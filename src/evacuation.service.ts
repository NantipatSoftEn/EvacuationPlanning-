import { Injectable } from '@nestjs/common';
import { EvacuationZoneDto } from './evacuation-zone.dto';
import { VehicleService } from './vehicle.service';

@Injectable()
export class EvacuationService {
  private evacuationZones: (EvacuationZoneDto & { evacuated: number; id: string })[] = [];

  constructor(private readonly vehicleService: VehicleService) {}

  addEvacuationZone(zone: EvacuationZoneDto) {
    const newZone = {
      ...zone,
      evacuated: 0,
      id: Math.random().toString(36).substr(2, 9)
    };
    this.evacuationZones.push(newZone);
    return newZone;
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
          highPriorityZones: this.evacuationZones.filter(z => z.urgency.toLowerCase() === 'high').length
        }
      };
    }

    // Sort zones by urgency (high -> medium -> low)
    const urgencyPriority: { [key: string]: number } = { 'high': 1, 'medium': 2, 'low': 3 };
    const sortedZones = [...this.evacuationZones]
      .filter(zone => zone.people - zone.evacuated > 0)
      .sort((a, b) => {
        const urgencyA = urgencyPriority[a.urgency.toLowerCase()] || 3;
        const urgencyB = urgencyPriority[b.urgency.toLowerCase()] || 3;
        return urgencyA - urgencyB;
      });

    // Sort vehicles by capacity (largest first)
    const sortedVehicles = [...availableVehicles].sort((a, b) => b.capacity - a.capacity);

    const plan: any[] = [];
    let vehicleIndex = 0;

    for (const zone of sortedZones) {
      const remainingPeople = zone.people - zone.evacuated;
      let peopleToEvacuate = remainingPeople;

      while (peopleToEvacuate > 0 && vehicleIndex < sortedVehicles.length) {
        const vehicle = sortedVehicles[vehicleIndex];
        const canEvacuate = Math.min(peopleToEvacuate, vehicle.capacity);

        plan.push({
          vehicleId: vehicle.id,
          assignedZone: zone.location,
          priority: urgencyPriority[zone.urgency.toLowerCase()] || 3,
          capacity: vehicle.capacity,
          peopleToEvacuate: canEvacuate
        });

        peopleToEvacuate -= canEvacuate;
        vehicleIndex++;
      }
    }

    const summary = {
      totalVehicles: plan.length,
      totalPeopleToEvacuate: plan.reduce((sum, p) => sum + p.peopleToEvacuate, 0),
      highPriorityZones: sortedZones.filter(z => z.urgency.toLowerCase() === 'high').length
    };

    return { plan, summary };
  }

  getEvacuationStatus() {
    return {
      zones: this.evacuationZones.map(zone => ({
        location: zone.location,
        totalPeople: zone.people,
        evacuated: zone.evacuated,
        remaining: zone.people - zone.evacuated,
        urgency: zone.urgency,
        status: zone.evacuated >= zone.people ? 'completed' : 'in-progress'
      }))
    };
  }

  updateEvacuationStatus(zoneLocation: string, evacuatedCount: number, vehicleId: string) {
    const zone = this.evacuationZones.find(z => z.location === zoneLocation);
    if (!zone) {
      throw new Error(`Zone ${zoneLocation} not found`);
    }

    zone.evacuated = Math.min(zone.evacuated + evacuatedCount, zone.people);
    
    return {
      message: `Updated evacuation status for ${zoneLocation}`,
      zone: {
        location: zone.location,
        totalPeople: zone.people,
        evacuated: zone.evacuated,
        remaining: zone.people - zone.evacuated,
        vehicleUsed: vehicleId
      }
    };
  }
}
