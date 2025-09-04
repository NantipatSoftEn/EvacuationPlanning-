import { ProcessedEvacuationZone } from "@modules/evacution/evacuation.service";

export const mockEvacuatedZones: ProcessedEvacuationZone[] = [
  {
    id: 'zone-001',
    zoneId: 'Z1',
    locationCoordinates: {
      latitude: 13.7563,
      longitude: 100.5018
    },
    numberOfPeople: 100,
    urgencyLevel: 4,
    evacuated: 0
  },
  {
    id: 'zone-002',
    zoneId: 'Z2',
    locationCoordinates: {
      latitude: 13.7367,
      longitude: 100.5231
    },
    numberOfPeople: 50,
    urgencyLevel: 5,
    evacuated: 0
  }
];
