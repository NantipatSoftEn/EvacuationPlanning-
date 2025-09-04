export class VehicleDto {
  id: string;
  capacity: number;
  type: string;
}

export class EvacuationPlanRequestDto {
  vehicles: VehicleDto[];
}

export class EvacuationPlanResponseDto {
  plan: {
    vehicleId: string;
    assignedZone: string;
    priority: number;
    capacity: number;
    peopleToEvacuate: number;
  }[];
  summary: {
    totalVehicles: number;
    totalPeopleToEvacuate: number;
    highPriorityZones: number;
  };
}

export class EvacuationStatusDto {
  zones: {
    location: string;
    totalPeople: number;
    evacuated: number;
    remaining: number;
    urgency: string;
    status: string;
  }[];
}

export class EvacuationUpdateDto {
  zoneLocation: string;
  evacuatedCount: number;
  vehicleId: string;
}
