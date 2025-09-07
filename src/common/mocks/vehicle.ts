import { ProcessedVehicle } from '@modules/vehicle/vehicle.service';

export const mockVehicles: ProcessedVehicle[] = [
    {
        id: 'v1',
        vehicleId: 'V1',
        locationCoordinates: { latitude: 13.8, longitude: 100.51 },
        capacity: 10,
        speed: 100,
        type: 'van',
    },
    {
        id: 'v2',
        vehicleId: 'V2',
        locationCoordinates: { latitude: 13.76, longitude: 100.51 },
        capacity: 40,
        speed: 60,
        type: 'bus',
    },
    {
        id: 'v3',
        vehicleId: 'V3',
        locationCoordinates: { latitude: 13.1, longitude: 100.9 },
        capacity: 20,
        speed: 80,
        type: 'truck',
    },
];
