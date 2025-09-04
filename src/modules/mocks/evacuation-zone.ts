import { ProcessedEvacuationZone } from "@modules/evacution/evacuation.service";

export const mockEvacuatedZones: ProcessedEvacuationZone[] = [
  {
    id: 'zone-001',
    zoneId: 'ZONE-A1',
    locationCoordinates: {
      latitude: 40.7128,
      longitude: -74.006,
    },
    numberOfPeople: 150,
    urgencyLevel: 5,
    location: 'Downtown Manhattan',
    people: 150,
    urgency: 'high',
    evacuated: 0,
  },
  {
    id: 'zone-002',
    zoneId: 'ZONE-B2',
    locationCoordinates: {
      latitude: 40.7589,
      longitude: -73.9851,
    },
    numberOfPeople: 80,
    urgencyLevel: 3,
    location: 'Times Square',
    people: 80,
    urgency: 'medium',
    evacuated: 25,
  },
  {
    id: 'zone-003',
    zoneId: 'ZONE-C3',
    locationCoordinates: {
      latitude: 40.6892,
      longitude: -74.0445,
    },
    numberOfPeople: 200,
    urgencyLevel: 4,
    location: 'Brooklyn Heights',
    people: 200,
    urgency: 'high',
    evacuated: 50,
  },
];
