import { ProcessedEvacuationZone } from '@modules/evacution/evacuation.service';

export const mockEvacuatedZones: ProcessedEvacuationZone[] = [
    {
        id: 'zone-example-1',
        zoneId: 'Z1',
        locationCoordinates: { latitude: 13.75, longitude: 100.5 },
        numberOfPeople: 60,
        urgencyLevel: 5,
        evacuated: 0,
    },
    {
        id: 'zone-example-2',
        zoneId: 'Z2',
        locationCoordinates: { latitude: 13.7, longitude: 100.55 },
        numberOfPeople: 30,
        urgencyLevel: 3,
        evacuated: 0,
    },
];
