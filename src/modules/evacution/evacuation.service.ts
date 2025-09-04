import { Injectable, BadRequestException } from '@nestjs/common';
import { EvacuationZoneDto } from './evacuation-zone.dto';
import { VehicleService } from '../vehicle/vehicle.service';

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
}

@Injectable()
export class EvacuationService {
  private evacuationZones: ProcessedEvacuationZone[] = [];

  constructor(private readonly vehicleService: VehicleService) {}

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

  generateEvacuationPlan(vehicles?: any[]) {
    // Use provided vehicles or get all available vehicles from service
    const availableVehicles = vehicles || this.vehicleService.getAllVehicles();
    
    if (availableVehicles.length === 0) {
      return {
        plan: [],
        summary: {
          totalVehicles: 0,
          totalPeopleToEvacuate: 0,
          highPriorityZones: this.evacuationZones.filter(z => this.getUrgencyCategory(z) === 'high').length
        }
      };
    }

    // Sort zones by urgency (high -> medium -> low)
    const sortedZones = [...this.evacuationZones]
      .filter(zone => this.getRemainingPeople(zone) > 0)
      .sort((a, b) => {
        const urgencyA = this.getUrgencyPriority(a);
        const urgencyB = this.getUrgencyPriority(b);
        return urgencyA - urgencyB;
      });

    // Sort vehicles by capacity (largest first)
    const sortedVehicles = [...availableVehicles].sort((a, b) => b.capacity - a.capacity);

    const plan: any[] = [];
    let vehicleIndex = 0;

    for (const zone of sortedZones) {
      const remainingPeople = this.getRemainingPeople(zone);
      let peopleToEvacuate = remainingPeople;

      while (peopleToEvacuate > 0 && vehicleIndex < sortedVehicles.length) {
        const vehicle = sortedVehicles[vehicleIndex];
        const canEvacuate = Math.min(peopleToEvacuate, vehicle.capacity);

        plan.push({
          vehicleId: vehicle.id || vehicle.vehicleId,
          assignedZone: this.getZoneLocation(zone),
          priority: this.getUrgencyPriority(zone),
          capacity: vehicle.capacity,
          peopleToEvacuate: canEvacuate,
          zoneDetails: {
            zoneId: zone.zoneId || zone.id,
            coordinates: zone.locationCoordinates,
            urgencyLevel: zone.urgencyLevel
          }
        });

        peopleToEvacuate -= canEvacuate;
        vehicleIndex++;
      }
    }

    const summary = {
      totalVehicles: plan.length,
      totalPeopleToEvacuate: plan.reduce((sum, p) => sum + p.peopleToEvacuate, 0),
      highPriorityZones: sortedZones.filter(z => this.getUrgencyCategory(z) === 'high').length
    };

    return { plan, summary };
  }

  // Helper methods
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
    return {
      zones: this.evacuationZones.map(zone => {
        const totalPeople = zone.numberOfPeople || zone.people || 0;
        return {
          location: this.getZoneLocation(zone),
          zoneId: zone.zoneId || zone.id,
          coordinates: zone.locationCoordinates,
          totalPeople,
          evacuated: zone.evacuated,
          remaining: totalPeople - zone.evacuated,
          urgency: zone.urgency,
          urgencyLevel: zone.urgencyLevel,
          status: zone.evacuated >= totalPeople ? 'completed' : 'in-progress'
        };
      })
    };
  }

  updateEvacuationStatus(zoneLocation: string, evacuatedCount: number, vehicleId: string) {
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
    
    return {
      message: `Updated evacuation status for ${this.getZoneLocation(zone)}`,
      zone: {
        location: this.getZoneLocation(zone),
        zoneId: zone.zoneId || zone.id,
        coordinates: zone.locationCoordinates,
        totalPeople,
        evacuated: zone.evacuated,
        remaining: totalPeople - zone.evacuated,
        vehicleUsed: vehicleId
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
