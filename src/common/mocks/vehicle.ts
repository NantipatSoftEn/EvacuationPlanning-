import { ProcessedVehicle } from "@modules/vehicle/vehicle.service";

export const mockVehicles: ProcessedVehicle[] = [
  { 
        id: 'vehicle-example-1', 
        vehicleId: 'V1',
        locationCoordinates: { latitude: 13.8, longitude: 100.6 },
        capacity: 40, 
        speed: 60,
        type: 'bus'
    },
    { 
        id: 'vehicle-example-2', 
        vehicleId: 'V2',
        locationCoordinates: { latitude: 13.72, longitude: 100.58 },
        capacity: 20, 
        speed: 50,
        type: 'van'
    },
];
