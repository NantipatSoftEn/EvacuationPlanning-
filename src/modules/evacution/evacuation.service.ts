import { Injectable, BadRequestException } from '@nestjs/common';
import { EvacuationZoneDto } from './evacuation-zone.dto';
import { VehicleService } from '../vehicle/vehicle.service';
import { RedisService } from '@common/cache/redis.service';
import { mockEvacuatedZones } from '@common/mocks/evacuation-zone';
import { generateGreedyPlan } from '@common/strategies/greedy-planner';
import { generateWeightedPlan } from '@common/strategies/weighted-planer';
import { EvacuationAssignment } from '@common/types/EvacuationAssignment';

export interface EvacuationPlanOptions {
  maxDistanceKm: number;
  allowMultiVehicle: boolean;
  preferFewerTrips: boolean;
  speedFallbackKmh: number;
}

export interface ProcessedEvacuationZone {
  id: string;
  zoneId?: string;
  locationCoordinates?: {
    latitude: number;
    longitude: number;
  };
  numberOfPeople?: number;
  urgencyLevel?: number;
  // Legacy fields
  location?: string;
  people?: number;
  urgency?: string;
  evacuated: number;
  lastVehicleUsed?: string;
}

@Injectable()
export class EvacuationService {
  private evacuationZones: ProcessedEvacuationZone[] = mockEvacuatedZones;

  constructor(
    private readonly vehicleService: VehicleService,
    private readonly redisService: RedisService
  ) {}

  addEvacuationZone(zone: EvacuationZoneDto) {
    // Validate input data
    this.validateEvacuationZoneInput(zone);

    const newZone: ProcessedEvacuationZone = {
      id: zone.zoneId || Math.random().toString(36).substr(2, 9),
      evacuated: 0
    };

    // Handle new format
    if (zone.locationCoordinates && zone.numberOfPeople !== undefined && zone.urgencyLevel !== undefined) {
      newZone.zoneId = zone.zoneId || newZone.id;
      newZone.locationCoordinates = zone.locationCoordinates;
      newZone.numberOfPeople = zone.numberOfPeople;
      newZone.urgencyLevel = zone.urgencyLevel;
    }

    // Handle legacy format or set legacy fields for compatibility
    if (zone.location) {
      newZone.location = zone.location;
    } else if (zone.locationCoordinates) {
      newZone.location = `${zone.locationCoordinates.latitude},${zone.locationCoordinates.longitude}`;
    }

    if (zone.people !== undefined) {
      newZone.people = zone.people;
    } else if (zone.numberOfPeople !== undefined) {
      newZone.people = zone.numberOfPeople;
    }

    if (zone.urgency) {
      newZone.urgency = zone.urgency;
    } else if (zone.urgencyLevel !== undefined) {
      // Convert urgency level to string format
      const urgencyMap = { 1: 'low', 2: 'low', 3: 'medium', 4: 'high', 5: 'high' };
      newZone.urgency = urgencyMap[zone.urgencyLevel] || 'medium';
    }

    this.evacuationZones.push(newZone);
    return newZone;
  }

  addEvacuationZones(zones: EvacuationZoneDto[]): ProcessedEvacuationZone[] {
    const results: ProcessedEvacuationZone[] = [];
    const errors: string[] = [];

    zones.forEach((zone, index) => {
      try {
        const result = this.addEvacuationZone(zone);
        results.push(result);
      } catch (error) {
        errors.push(`Zone ${index + 1}: ${error.message}`);
      }
    });

    if (errors.length > 0) {
      throw new BadRequestException(`Failed to add some zones: ${errors.join(', ')}`);
    }

    return results;
  }

  private validateEvacuationZoneInput(zone: EvacuationZoneDto) {
    // Check if either new format or legacy format is provided
    const hasNewFormat = zone.locationCoordinates && zone.numberOfPeople !== undefined && zone.urgencyLevel !== undefined;
    const hasLegacyFormat = zone.location && zone.people !== undefined && zone.urgency;

    if (!hasNewFormat && !hasLegacyFormat) {
      throw new BadRequestException(
        'Invalid input format. Please provide either:\n' +
        '- New format: locationCoordinates, numberOfPeople, urgencyLevel\n' +
        '- Legacy format: location, people, urgency'
      );
    }

    // Validate new format
    if (hasNewFormat) {
      if (zone.urgencyLevel! < 1 || zone.urgencyLevel! > 5) {
        throw new BadRequestException('Urgency level must be between 1 and 5');
      }
      if (zone.numberOfPeople! <= 0) {
        throw new BadRequestException('Number of people must be greater than 0');
      }
      if (!zone.locationCoordinates!.latitude || !zone.locationCoordinates!.longitude) {
        throw new BadRequestException('Valid latitude and longitude coordinates are required');
      }
    }

    // Validate legacy format
    if (hasLegacyFormat && !hasNewFormat) {
      if (zone.people! <= 0) {
        throw new BadRequestException('Number of people must be greater than 0');
      }
      if (!['low', 'medium', 'high'].includes(zone.urgency!.toLowerCase())) {
        throw new BadRequestException('Urgency must be low, medium, or high');
      }
    }
  }

  getEvacuationZones() {
    return this.evacuationZones;
  }

  getAvailableVehicles() {
    return this.vehicleService.getAllVehicles();
  }

  async generateEvacuationPlan(vehicles?: any[], options?: Partial<EvacuationPlanOptions & { strategy?: 'greedy' | 'weighted' }>) {
    // Use provided vehicles or get all available vehicles from service
    const availableVehicles = vehicles || this.vehicleService.getAllVehicles();
    
    const strategy = options?.strategy || 'greedy'; // Default to greedy strategy

    // Check cache first
    try {
      const cachedPlan = await this.redisService.getCachedPlan(
        this.evacuationZones, 
        availableVehicles, 
        { ...options, strategy }
      );
      if (cachedPlan) {
        return {
          ...cachedPlan.plan,
          fromCache: true,
          cachedAt: cachedPlan.cachedAt
        };
      }
    } catch (error) {
      console.warn('Redis cache error, proceeding without cache:', error.message);
    }
    
    if (availableVehicles.length === 0) {
      return {
        assignments: [],
        summary: {
          totalVehiclesAssigned: 0,
          totalPeopleToEvacuate: 0,
          highPriorityZones: this.evacuationZones.filter(z => this.getUrgencyCategory(z) === 'high').length,
          averageDistance: 0,
          averageTravelTime: 0,
          zonesFullyCovered: 0,
          zonesPartiallyCovered: 0,
          totalDistanceKm: 0
        },
        options: {
          strategy,
          maxDistanceKm: options?.maxDistanceKm || 100,
          allowMultiVehicle: options?.allowMultiVehicle !== false,
          preferFewerTrips: options?.preferFewerTrips !== false,
          speedFallbackKmh: options?.speedFallbackKmh || 40
        },
        // Legacy format for backward compatibility
        plan: []
      };
    }

    let assignments: EvacuationAssignment[] = [];

    // Use selected strategy
    if (strategy === 'weighted') {
      assignments = generateWeightedPlan(this.evacuationZones, availableVehicles);
    } else {
      assignments = generateGreedyPlan(this.evacuationZones, availableVehicles);
    }

    // Convert assignments to the expected format
    const formattedAssignments = await Promise.all(assignments.map(async assignment => {
      const zone = this.evacuationZones.find(z => (z.zoneId || z.id) === assignment.zoneId);
      const vehicle = availableVehicles.find(v => (v.vehicleId || v.id) === assignment.vehicleId);
      
      if (!zone || !vehicle) {
        return null;
      }

      const distanceKm = await this.calculateDistance(zone, vehicle);
      const travelTimeMinutes = assignment.etaMinutes;
      
      return {
        vehicleId: assignment.vehicleId,
        vehicleType: vehicle.type,
        vehicleCapacity: vehicle.capacity,
        assignedZone: zone.location || `Zone ${zone.zoneId || zone.id}`,
        zoneId: zone.zoneId || zone.id,
        zoneCoordinates: zone.locationCoordinates || { latitude: 0, longitude: 0 },
        urgencyLevel: zone.urgencyLevel || 1,
        urgencyCategory: this.getUrgencyCategory(zone),
        priority: zone.urgencyLevel || 1,
        peopleToEvacuate: assignment.evacuated,
        distanceKm: distanceKm,
        travelTimeHours: travelTimeMinutes / 60,
        travelTimeMinutes: travelTimeMinutes,
        travelTimeFormatted: this.formatTravelTime(travelTimeMinutes),
        eta: this.calculateETA(travelTimeMinutes),
        speedKmh: vehicle.speed || 50
      };
    }));

    const validAssignments = formattedAssignments.filter(assignment => assignment !== null);

    // Calculate summary statistics
    const totalVehiclesAssigned = new Set(validAssignments.map(a => a.vehicleId)).size;
    const totalPeopleToEvacuate = validAssignments.reduce((sum, a) => sum + a.peopleToEvacuate, 0);
    const highPriorityZones = this.evacuationZones.filter(z => this.getUrgencyCategory(z) === 'high').length;
    const totalDistanceKm = validAssignments.reduce((sum, a) => sum + a.distanceKm, 0);
    const averageDistance = validAssignments.length > 0 ? totalDistanceKm / validAssignments.length : 0;
    const averageTravelTime = validAssignments.length > 0 
      ? validAssignments.reduce((sum, a) => sum + a.travelTimeMinutes, 0) / validAssignments.length 
      : 0;

    // Count zones coverage
    const assignedZoneIds = new Set(validAssignments.map(a => a.zoneId));
    const zonesFullyCovered = this.evacuationZones.filter(zone => {
      if (!assignedZoneIds.has(zone.zoneId || zone.id)) return false;
      const zoneAssignments = validAssignments.filter(a => a.zoneId === (zone.zoneId || zone.id));
      const totalEvacuated = zoneAssignments.reduce((sum, a) => sum + a.peopleToEvacuate, 0);
      const totalPeople = zone.numberOfPeople || zone.people || 0;
      return totalEvacuated >= totalPeople;
    }).length;

    const zonesPartiallyCovered = assignedZoneIds.size - zonesFullyCovered;

    const result = {
      assignments: validAssignments,
      summary: {
        totalVehiclesAssigned,
        totalPeopleToEvacuate,
        highPriorityZones,
        averageDistance: Math.round(averageDistance * 100) / 100,
        averageTravelTime: Math.round(averageTravelTime * 100) / 100,
        zonesFullyCovered,
        zonesPartiallyCovered,
        totalDistanceKm: Math.round(totalDistanceKm * 100) / 100
      },
      options: {
        strategy,
        maxDistanceKm: options?.maxDistanceKm || 100,
        allowMultiVehicle: options?.allowMultiVehicle !== false,
        preferFewerTrips: options?.preferFewerTrips !== false,
        speedFallbackKmh: options?.speedFallbackKmh || 40
      },
      // Legacy format for backward compatibility
      plan: validAssignments.map(assignment => ({
        vehicleId: assignment.vehicleId,
        assignedZone: assignment.assignedZone,
        priority: assignment.priority,
        capacity: assignment.vehicleCapacity,
        peopleToEvacuate: assignment.peopleToEvacuate,
        zoneDetails: {
          zoneId: assignment.zoneId,
          coordinates: assignment.zoneCoordinates,
          urgencyLevel: assignment.urgencyLevel
        }
      }))
    };

    // Cache the result
    try {
      await this.redisService.cachePlan(
        this.evacuationZones, 
        availableVehicles, 
        { ...options, strategy }, 
        result
      );

      // Track analytics
      await this.redisService.incrementCounter(`stats:strategy_usage:${strategy}:${new Date().toISOString().split('T')[0]}`);
      await this.redisService.incrementCounter(`stats:daily:${new Date().toISOString().split('T')[0]}:plan_generated`);
    } catch (error) {
      console.warn('Redis cache error:', error.message);
    }

    return result;
  }

  // Helper methods  
  private async calculateDistance(zone: ProcessedEvacuationZone, vehicle: any): Promise<number> {
    if (!zone.locationCoordinates || !vehicle.locationCoordinates) {
      return 0;
    }

    // Try to get cached distance first
    try {
      const cached = await this.redisService.getCachedDistance(
        zone.locationCoordinates,
        vehicle.locationCoordinates
      );
      if (cached) {
        return cached.distance;
      }
    } catch (error) {
      // Continue with calculation if cache fails
    }
    
    const R = 6371; // Earth's radius in km
    const lat1 = zone.locationCoordinates.latitude * Math.PI / 180;
    const lat2 = vehicle.locationCoordinates.latitude * Math.PI / 180;
    const deltaLat = (vehicle.locationCoordinates.latitude - zone.locationCoordinates.latitude) * Math.PI / 180;
    const deltaLng = (vehicle.locationCoordinates.longitude - zone.locationCoordinates.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;

    // Cache the calculated distance and estimated travel time
    try {
      const travelTime = (distance / 40) * 60; // Assuming 40 km/h average speed
      await this.redisService.cacheDistance(
        zone.locationCoordinates,
        vehicle.locationCoordinates,
        distance,
        travelTime
      );
    } catch (error) {
      // Cache error doesn't affect the result
    }

    return distance;
  }

  private formatTravelTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  private calculateETA(minutes: number): string {
    const now = new Date();
    const eta = new Date(now.getTime() + minutes * 60 * 1000);
    return eta.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  private getRemainingPeople(zone: ProcessedEvacuationZone): number {
    return (zone.numberOfPeople || zone.people || 0) - zone.evacuated;
  }

  private getZoneLocation(zone: ProcessedEvacuationZone): string {
    if (zone.location) return zone.location;
    if (zone.locationCoordinates) {
      return `${zone.locationCoordinates.latitude},${zone.locationCoordinates.longitude}`;
    }
    return 'Unknown location';
  }

  private getUrgencyPriority(zone: ProcessedEvacuationZone): number {
    if (zone.urgencyLevel !== undefined) {
      return 6 - zone.urgencyLevel; // Convert 1-5 scale to priority (5=1, 4=2, etc.)
    }
    if (zone.urgency) {
      const urgencyPriority: { [key: string]: number } = { 'high': 1, 'medium': 2, 'low': 3 };
      return urgencyPriority[zone.urgency.toLowerCase()] || 3;
    }
    return 3; // Default to medium priority
  }

  private getUrgencyCategory(zone: ProcessedEvacuationZone): string {
    if (zone.urgencyLevel !== undefined) {
      if (zone.urgencyLevel >= 4) return 'high';
      if (zone.urgencyLevel === 3) return 'medium';
      return 'low';
    }
    return zone.urgency?.toLowerCase() || 'medium';
  }

  getEvacuationStatus() {
    return this.evacuationZones.map(zone => {
      const totalPeople = zone.numberOfPeople || zone.people || 0;
      return {
        zoneId: zone.zoneId || zone.id,
        totalEvacuated: zone.evacuated,
        remainingPeople: totalPeople - zone.evacuated,
        ...(zone.lastVehicleUsed && { lastVehicleUsed: zone.lastVehicleUsed })
      };
    });
  }

  updateEvacuationStatus(zoneLocation: string, vehicleId: string) {
    // ดึงข้อมูลรถจาก vehicleService เพื่อใช้ capacity
    const vehicle = this.vehicleService.getVehicleById(vehicleId);
    if (!vehicle) {
      throw new Error(`Vehicle ${vehicleId} not found`);
    }

    const evacuatedCount = vehicle.capacity; // ใช้ capacity ของรถ

    const zone = this.evacuationZones.find(z => 
      this.getZoneLocation(z) === zoneLocation || 
      z.zoneId === zoneLocation ||
      z.id === zoneLocation
    );
    
    if (!zone) {
      throw new Error(`Zone ${zoneLocation} not found`);
    }

    const totalPeople = zone.numberOfPeople || zone.people || 0;
    zone.evacuated = Math.min(zone.evacuated + evacuatedCount, totalPeople);
    zone.lastVehicleUsed = vehicleId; // Track the last vehicle used
    
    return {
      message: `Updated evacuation status for ${this.getZoneLocation(zone)} using vehicle ${vehicleId} (capacity: ${evacuatedCount})`,
      zone: {
        location: this.getZoneLocation(zone),
        zoneId: zone.zoneId || zone.id,
        coordinates: zone.locationCoordinates,
        totalPeople,
        evacuated: zone.evacuated,
        remaining: totalPeople - zone.evacuated,
        vehicleUsed: vehicleId,
        vehicleCapacity: evacuatedCount
      }
    };
  }

  clearEvacuationPlans() {
    this.evacuationZones = [];
    return {
      message: 'All evacuation plans have been cleared and data has been reset',
      success: true
    };
  }
}
