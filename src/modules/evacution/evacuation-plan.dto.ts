import { IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

export class VehicleDto {
  id?: string;
  vehicleId?: string;
  capacity: number;
  type: string;
  locationCoordinates?: {
    latitude: number;
    longitude: number;
  };
  speed?: number;
  location?: string;
}

export class EvacuationPlanRequestDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxDistanceKm?: number;            // ตัดรถที่ไกลเกินไป

  @IsOptional()
  @IsBoolean()
  allowMultiVehicle?: boolean;       // อนุญาตแบ่งหลายคันต่อหนึ่งโซน

  @IsOptional()
  @IsBoolean()
  preferFewerTrips?: boolean;        // เน้นคันใหญ่เพื่อลดรอบ

  @IsOptional()
  @IsNumber()
  @Min(1)
  speedFallbackKmh?: number;         // ความเร็วสำรองหากรถคันไหนไม่ระบุ
}

export class EvacuationPlanResponseDto {
  assignments: {
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
  }[];
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
  options: {
    maxDistanceKm: number;
    allowMultiVehicle: boolean;
    preferFewerTrips: boolean;
    speedFallbackKmh: number;
  };
  
  // Legacy format for backward compatibility
  plan?: {
    vehicleId: string;
    assignedZone: string;
    priority: number;
    capacity: number;
    peopleToEvacuate: number;
    zoneDetails?: {
      zoneId: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
      urgencyLevel?: number;
    };
  }[];
}

export class EvacuationStatusDto {
  zones: {
    location: string;
    zoneId?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    totalPeople: number;
    evacuated: number;
    remaining: number;
    urgency?: string;
    urgencyLevel?: number;
    status: string;
  }[];
}

export class EvacuationUpdateDto {
  zoneLocation: string;
  evacuatedCount: number;
  vehicleId: string;
}
