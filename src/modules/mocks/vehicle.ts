import { ProcessedVehicle } from "@modules/vehicle/vehicle.service";

export const mockVehicles: ProcessedVehicle[] = [
  {
    id: 'vehicle-001',
    vehicleId: 'BUS-001',
    capacity: 50,
    type: 'bus',
    locationCoordinates: {
      latitude: 40.7580,
      longitude: -73.9855
    },
    speed: 40,
    location: 'Times Square Depot'
  },
  {
    id: 'vehicle-002',
    vehicleId: 'AMB-001',
    capacity: 4,
    type: 'ambulance',
    locationCoordinates: {
      latitude: 40.7505,
      longitude: -73.9934
    },
    speed: 60,
    location: 'Manhattan General Hospital'
  },
  {
    id: 'vehicle-003',
    vehicleId: 'TRUCK-001',
    capacity: 20,
    type: 'truck',
    locationCoordinates: {
      latitude: 40.7282,
      longitude: -74.0776
    },
    speed: 35,
    location: 'West Side Highway Garage'
  },
  {
    id: 'vehicle-004',
    vehicleId: 'VAN-001',
    capacity: 12,
    type: 'van',
    locationCoordinates: {
      latitude: 40.6782,
      longitude: -73.9442
    },
    speed: 45,
    location: 'Brooklyn Emergency Center'
  },
  {
    id: 'vehicle-005',
    vehicleId: 'BUS-002',
    capacity: 45,
    type: 'bus',
    locationCoordinates: {
      latitude: 40.7831,
      longitude: -73.9712
    },
    speed: 40,
    location: 'Central Park Transit Hub'
  },
  {
    id: 'vehicle-006',
    vehicleId: 'CAR-001',
    capacity: 5,
    type: 'car',
    locationCoordinates: {
      latitude: 40.7614,
      longitude: -73.9776
    },
    speed: 50,
    location: 'Midtown Police Precinct'
  },
  {
    id: 'vehicle-007',
    vehicleId: 'TRUCK-002',
    capacity: 25,
    type: 'truck',
    locationCoordinates: {
      latitude: 40.6892,
      longitude: -74.0445
    },
    speed: 35,
    location: 'Brooklyn Heights Fire Station'
  },
  {
    id: 'vehicle-008',
    vehicleId: 'AMB-002',
    capacity: 6,
    type: 'ambulance',
    locationCoordinates: {
      latitude: 40.7489,
      longitude: -73.9680
    },
    speed: 65,
    location: 'East Side Medical Center'
  }
];
