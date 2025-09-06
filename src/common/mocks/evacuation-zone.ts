import { ProcessedEvacuationZone } from '@modules/evacution/evacuation.service';

export const mockEvacuatedZones: ProcessedEvacuationZone[] = [
  { id: 'z1', zoneId: 'Z1', locationCoordinates: { latitude: 13.9, longitude: 100.9 }, numberOfPeople: 40, urgencyLevel: 5,  evacuated: 0, lastVehicleUsed: undefined },
  { id: 'z2', zoneId: 'Z2', locationCoordinates: { latitude: 13.0, longitude: 100.9 }, numberOfPeople: 10, urgencyLevel: 2,  evacuated: 0, lastVehicleUsed: undefined },
  { id: 'z3', zoneId: 'Z3', locationCoordinates: { latitude: 13.8, longitude: 100.5 }, numberOfPeople: 25, urgencyLevel: 4, evacuated: 0, lastVehicleUsed: undefined },
];
