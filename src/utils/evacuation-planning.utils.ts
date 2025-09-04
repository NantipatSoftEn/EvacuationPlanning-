import { calculateHaversineDistance, calculateTravelTime, calculateTravelTimeMinutes, formatTravelTime, calculateETA } from './distance.utils';

export interface EvacuationPlanOptions {
  maxDistanceKm: number;           // Maximum distance to consider vehicles
  allowMultiVehicle: boolean;      // Allow multiple vehicles per zone
  preferFewerTrips: boolean;       // Prefer larger vehicles to reduce trips
  speedFallbackKmh: number;        // Default speed if vehicle doesn't specify
}

export interface Vehicle {
  id?: string;
  vehicleId?: string;
  capacity: number;
  type: string;
  locationCoordinates: {
    latitude: number;
    longitude: number;
  };
  speed?: number;
  location?: string;
}

export interface EvacuationZone {
  id: string;
  zoneId?: string;
  locationCoordinates: {
    latitude: number;
    longitude: number;
  };
  numberOfPeople?: number;
  people?: number;
  urgencyLevel?: number;
  urgency?: string;
  evacuated: number;
  location?: string;
}

export interface EvacuationAssignment {
  vehicleId: string;
  vehicleType: string;
  vehicleCapacity: number;
  assignedZone: string;
  zoneId: string;
  zoneCoordinates: {
    latitude: number;
    longitude: number;
  };
  urgencyLevel: number;
  urgencyCategory: string;
  priority: number;
  peopleToEvacuate: number;
  distanceKm: number;
  travelTimeHours: number;
  travelTimeMinutes: number;
  travelTimeFormatted: string;
  eta: string;
  speedKmh: number;
}

export interface EvacuationPlan {
  assignments: EvacuationAssignment[];
  summary: {
    totalVehiclesAssigned: number;
    totalPeopleToEvacuate: number;
    highPriorityZones: number;
    averageDistance: number;
    averageTravelTime: number;
    zonesFullyCovered: number;
    zonesPartiallyCovered: number;
    totalDistanceKm: number;
  };
  options: EvacuationPlanOptions;
}

/**
 * Generate comprehensive evacuation plan with distance calculation, urgency priority, and capacity optimization
 */
export function generateOptimalEvacuationPlan(
  vehicles: Vehicle[],
  zones: EvacuationZone[],
  options: EvacuationPlanOptions
): EvacuationPlan {
  const assignments: EvacuationAssignment[] = [];
  const availableVehicles = [...vehicles];
  
  // Step 1: Filter zones that need evacuation
  const zonesNeedingEvacuation = zones.filter(zone => {
    const totalPeople = zone.numberOfPeople || zone.people || 0;
    return totalPeople > zone.evacuated;
  });

  if (zonesNeedingEvacuation.length === 0) {
    return createEmptyPlan(options);
  }

  // Step 2: Sort zones by urgency (highest urgency first)
  const sortedZones = sortZonesByUrgency(zonesNeedingEvacuation);

  // Step 3: Process each zone
  for (const zone of sortedZones) {
    if (availableVehicles.length === 0) break;

    const remainingPeople = getRemainingPeople(zone);
    if (remainingPeople <= 0) continue;

    // Step 4: Find suitable vehicles for this zone
    const suitableVehicles = findSuitableVehicles(
      availableVehicles,
      zone,
      options
    );

    if (suitableVehicles.length === 0) continue;

    // Step 5: Apply capacity optimization
    const selectedVehicles = optimizeVehicleSelection(
      suitableVehicles,
      remainingPeople,
      options
    );

    // Step 6: Create assignments
    let peopleLeftToEvacuate = remainingPeople;
    for (const vehicleInfo of selectedVehicles) {
      if (peopleLeftToEvacuate <= 0) break;

      const peopleToEvacuate = Math.min(vehicleInfo.vehicle.capacity, peopleLeftToEvacuate);
      
      const assignment: EvacuationAssignment = {
        vehicleId: vehicleInfo.vehicle.id || vehicleInfo.vehicle.vehicleId || 'unknown',
        vehicleType: vehicleInfo.vehicle.type,
        vehicleCapacity: vehicleInfo.vehicle.capacity,
        assignedZone: getZoneLocation(zone),
        zoneId: zone.zoneId || zone.id,
        zoneCoordinates: zone.locationCoordinates,
        urgencyLevel: getUrgencyLevel(zone),
        urgencyCategory: getUrgencyCategory(zone),
        priority: getUrgencyPriority(zone),
        peopleToEvacuate,
        distanceKm: vehicleInfo.distance,
        travelTimeHours: vehicleInfo.travelTime,
        travelTimeMinutes: calculateTravelTimeMinutes(vehicleInfo.distance, vehicleInfo.speed),
        travelTimeFormatted: formatTravelTime(vehicleInfo.travelTime),
        eta: calculateETA(vehicleInfo.travelTime),
        speedKmh: vehicleInfo.speed
      };

      assignments.push(assignment);
      peopleLeftToEvacuate -= peopleToEvacuate;

      // Remove vehicle from available list
      const vehicleIndex = availableVehicles.findIndex(v => 
        (v.id || v.vehicleId) === (vehicleInfo.vehicle.id || vehicleInfo.vehicle.vehicleId)
      );
      if (vehicleIndex >= 0) {
        availableVehicles.splice(vehicleIndex, 1);
      }

      // Break if we don't allow multiple vehicles per zone
      if (!options.allowMultiVehicle) break;
    }
  }

  // Step 7: Generate summary
  const summary = generatePlanSummary(assignments, zones, options);

  return {
    assignments,
    summary,
    options
  };
}

/**
 * Find vehicles suitable for a zone based on distance constraints
 */
function findSuitableVehicles(
  vehicles: Vehicle[],
  zone: EvacuationZone,
  options: EvacuationPlanOptions
): Array<{ vehicle: Vehicle; distance: number; travelTime: number; speed: number }> {
  const suitableVehicles: Array<{ vehicle: Vehicle; distance: number; travelTime: number; speed: number }> = [];

  for (const vehicle of vehicles) {
    const distance = calculateHaversineDistance(
      vehicle.locationCoordinates,
      zone.locationCoordinates
    );

    // Filter by maximum distance
    if (distance <= options.maxDistanceKm) {
      const speed = vehicle.speed || options.speedFallbackKmh;
      const travelTime = calculateTravelTime(distance, speed);

      suitableVehicles.push({
        vehicle,
        distance,
        travelTime,
        speed
      });
    }
  }

  // Sort by distance (closest first)
  return suitableVehicles.sort((a, b) => a.distance - b.distance);
}

/**
 * Optimize vehicle selection based on capacity and preferences
 */
function optimizeVehicleSelection(
  suitableVehicles: Array<{ vehicle: Vehicle; distance: number; travelTime: number; speed: number }>,
  peopleToEvacuate: number,
  options: EvacuationPlanOptions
): Array<{ vehicle: Vehicle; distance: number; travelTime: number; speed: number }> {
  if (options.preferFewerTrips) {
    // Sort by capacity descending, then by distance ascending
    suitableVehicles.sort((a, b) => {
      const capacityDiff = b.vehicle.capacity - a.vehicle.capacity;
      return capacityDiff !== 0 ? capacityDiff : a.distance - b.distance;
    });
  }

  const selectedVehicles: Array<{ vehicle: Vehicle; distance: number; travelTime: number; speed: number }> = [];
  let remainingPeople = peopleToEvacuate;

  for (const vehicleInfo of suitableVehicles) {
    if (remainingPeople <= 0) break;

    selectedVehicles.push(vehicleInfo);
    remainingPeople -= vehicleInfo.vehicle.capacity;

    // If we don't allow multiple vehicles, take only the first suitable one
    if (!options.allowMultiVehicle) break;
  }

  return selectedVehicles;
}

/**
 * Sort zones by urgency priority (highest urgency first)
 */
function sortZonesByUrgency(zones: EvacuationZone[]): EvacuationZone[] {
  return zones.sort((a, b) => {
    const priorityA = getUrgencyPriority(a);
    const priorityB = getUrgencyPriority(b);
    
    // Lower priority number means higher urgency (1 = highest, 5 = lowest)
    return priorityA - priorityB;
  });
}

/**
 * Get urgency priority (1 = highest urgency, 5 = lowest urgency)
 */
function getUrgencyPriority(zone: EvacuationZone): number {
  if (zone.urgencyLevel !== undefined) {
    return 6 - zone.urgencyLevel; // Convert 1-5 scale to priority (5=1, 4=2, etc.)
  }
  if (zone.urgency) {
    const urgencyPriority: { [key: string]: number } = { 
      'high': 1, 
      'medium': 3, 
      'low': 5 
    };
    return urgencyPriority[zone.urgency.toLowerCase()] || 3;
  }
  return 3; // Default to medium priority
}

/**
 * Get urgency level (1-5 scale)
 */
function getUrgencyLevel(zone: EvacuationZone): number {
  if (zone.urgencyLevel !== undefined) {
    return zone.urgencyLevel;
  }
  if (zone.urgency) {
    const urgencyLevelMap: { [key: string]: number } = { 
      'high': 5, 
      'medium': 3, 
      'low': 1 
    };
    return urgencyLevelMap[zone.urgency.toLowerCase()] || 3;
  }
  return 3; // Default to medium
}

/**
 * Get urgency category string
 */
function getUrgencyCategory(zone: EvacuationZone): string {
  if (zone.urgencyLevel !== undefined) {
    if (zone.urgencyLevel >= 4) return 'high';
    if (zone.urgencyLevel === 3) return 'medium';
    return 'low';
  }
  return zone.urgency?.toLowerCase() || 'medium';
}

/**
 * Get remaining people to evacuate from a zone
 */
function getRemainingPeople(zone: EvacuationZone): number {
  const totalPeople = zone.numberOfPeople || zone.people || 0;
  return Math.max(0, totalPeople - zone.evacuated);
}

/**
 * Get zone location string
 */
function getZoneLocation(zone: EvacuationZone): string {
  if (zone.location) return zone.location;
  if (zone.locationCoordinates) {
    return `${zone.locationCoordinates.latitude},${zone.locationCoordinates.longitude}`;
  }
  return 'Unknown location';
}

/**
 * Generate plan summary statistics
 */
function generatePlanSummary(
  assignments: EvacuationAssignment[],
  allZones: EvacuationZone[],
  options: EvacuationPlanOptions
) {
  const totalVehiclesAssigned = assignments.length;
  const totalPeopleToEvacuate = assignments.reduce((sum, a) => sum + a.peopleToEvacuate, 0);
  const highPriorityZones = assignments.filter(a => a.urgencyCategory === 'high').length;
  
  const distances = assignments.map(a => a.distanceKm);
  const averageDistance = distances.length > 0 
    ? Math.round((distances.reduce((sum, d) => sum + d, 0) / distances.length) * 100) / 100
    : 0;
  
  const travelTimes = assignments.map(a => a.travelTimeHours);
  const averageTravelTime = travelTimes.length > 0 
    ? Math.round((travelTimes.reduce((sum, t) => sum + t, 0) / travelTimes.length) * 100) / 100
    : 0;

  const totalDistanceKm = Math.round(distances.reduce((sum, d) => sum + d, 0) * 100) / 100;

  // Calculate zone coverage
  const assignedZoneIds = new Set(assignments.map(a => a.zoneId));
  let zonesFullyCovered = 0;
  let zonesPartiallyCovered = 0;

  for (const zone of allZones) {
    if (assignedZoneIds.has(zone.zoneId || zone.id)) {
      const totalPeople = zone.numberOfPeople || zone.people || 0;
      const remainingPeople = totalPeople - zone.evacuated;
      const assignedCapacity = assignments
        .filter(a => a.zoneId === (zone.zoneId || zone.id))
        .reduce((sum, a) => sum + a.peopleToEvacuate, 0);
      
      if (assignedCapacity >= remainingPeople) {
        zonesFullyCovered++;
      } else {
        zonesPartiallyCovered++;
      }
    }
  }

  return {
    totalVehiclesAssigned,
    totalPeopleToEvacuate,
    highPriorityZones,
    averageDistance,
    averageTravelTime,
    zonesFullyCovered,
    zonesPartiallyCovered,
    totalDistanceKm
  };
}

/**
 * Create empty evacuation plan
 */
function createEmptyPlan(options: EvacuationPlanOptions): EvacuationPlan {
  return {
    assignments: [],
    summary: {
      totalVehiclesAssigned: 0,
      totalPeopleToEvacuate: 0,
      highPriorityZones: 0,
      averageDistance: 0,
      averageTravelTime: 0,
      zonesFullyCovered: 0,
      zonesPartiallyCovered: 0,
      totalDistanceKm: 0
    },
    options
  };
}
