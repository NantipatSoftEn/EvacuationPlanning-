import { ProcessedVehicle } from "@modules/vehicle/vehicle.service";

export const mockVehicles: ProcessedVehicle[] = [
  {
    id: 'vehicle-001',
    vehicleId: 'V1',
    capacity: 40,
    type: 'bus',
    locationCoordinates: {
      latitude: 13.7650,
      longitude: 100.5381
    },
    speed: 60
  },
  {
    id: 'vehicle-002',
    vehicleId: 'V2',
    capacity: 20,
    type: 'van',
    locationCoordinates: {
      latitude: 13.7320,
      longitude: 100.5200
    },
    speed: 50
  },
];
