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
  {
    id: 'vehicle-003',
    vehicleId: 'V3',
    capacity: 30,
    type: 'bus',
    locationCoordinates: {
      latitude: 13.7400,
      longitude: 100.5300
    },
    speed: 55
  },
  {
    id: 'vehicle-004',
    vehicleId: 'V4',
    capacity: 15,
    type: 'van',
    locationCoordinates: {
      latitude: 13.7500,
      longitude: 100.5400
    },
    speed: 45
  },
  {
    id: 'vehicle-005',
    vehicleId: 'V5',
    capacity: 25,
    type: 'boat',
    locationCoordinates: {
      latitude: 13.7600,
      longitude: 100.5500
    },
    speed: 30
  },
  {
    id: 'vehicle-006',
    vehicleId: 'V6',
    capacity: 35,
    type: 'bus',
    locationCoordinates: {
      latitude: 13.7450,
      longitude: 100.5350
    },
    speed: 60
  },
  {
    id: 'vehicle-007',
    vehicleId: 'V7',
    capacity: 18,
    type: 'van',
    locationCoordinates: {
      latitude: 13.7550,
      longitude: 100.5450
    },
    speed: 48
  },
  {
    id: 'vehicle-008',
    vehicleId: 'V8',
    capacity: 20,
    type: 'boat',
    locationCoordinates: {
      latitude: 13.7350,
      longitude: 100.5250
    },
    speed: 35
  }
];
