import { ProcessedEvacuationZone } from "@modules/evacution/evacuation.service";

export const mockEvacuatedZones: ProcessedEvacuationZone[] = [
  // High urgency zones (Level 5)
  {
    id: 'zone-001',
    zoneId: 'Z1',
    locationCoordinates: {
      latitude: 13.7563,
      longitude: 100.5018
    },
    numberOfPeople: 100,
    urgencyLevel: 5,
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
  },
  {
    id: 'zone-003',
    zoneId: 'Z3',
    locationCoordinates: {
      latitude: 13.7150,
      longitude: 100.5400
    },
    numberOfPeople: 75,
    urgencyLevel: 5,
    evacuated: 0
  },
  
  // High-medium urgency zones (Level 4)
  {
    id: 'zone-004',
    zoneId: 'Z4',
    locationCoordinates: {
      latitude: 13.7800,
      longitude: 100.5100
    },
    numberOfPeople: 120,
    urgencyLevel: 4,
    evacuated: 0
  },
  {
    id: 'zone-005',
    zoneId: 'Z5',
    locationCoordinates: {
      latitude: 13.7450,
      longitude: 100.5350
    },
    numberOfPeople: 80,
    urgencyLevel: 4,
    evacuated: 0
  },
  {
    id: 'zone-006',
    zoneId: 'Z6',
    locationCoordinates: {
      latitude: 13.7200,
      longitude: 100.5600
    },
    numberOfPeople: 95,
    urgencyLevel: 4,
    evacuated: 0
  },
  
  // Medium urgency zones (Level 3)
  {
    id: 'zone-007',
    zoneId: 'Z7',
    locationCoordinates: {
      latitude: 13.7600,
      longitude: 100.4900
    },
    numberOfPeople: 60,
    urgencyLevel: 3,
    evacuated: 0
  },
  {
    id: 'zone-008',
    zoneId: 'Z8',
    locationCoordinates: {
      latitude: 13.7300,
      longitude: 100.5500
    },
    numberOfPeople: 40,
    urgencyLevel: 3,
    evacuated: 0
  },
  {
    id: 'zone-009',
    zoneId: 'Z9',
    locationCoordinates: {
      latitude: 13.7700,
      longitude: 100.5200
    },
    numberOfPeople: 85,
    urgencyLevel: 3,
    evacuated: 0
  },
  
  // Low-medium urgency zones (Level 2)
  {
    id: 'zone-010',
    zoneId: 'Z10',
    locationCoordinates: {
      latitude: 13.7400,
      longitude: 100.4800
    },
    numberOfPeople: 30,
    urgencyLevel: 2,
    evacuated: 0
  },
  {
    id: 'zone-011',
    zoneId: 'Z11',
    locationCoordinates: {
      latitude: 13.7100,
      longitude: 100.5700
    },
    numberOfPeople: 45,
    urgencyLevel: 2,
    evacuated: 0
  },
  {
    id: 'zone-012',
    zoneId: 'Z12',
    locationCoordinates: {
      latitude: 13.7900,
      longitude: 100.5000
    },
    numberOfPeople: 65,
    urgencyLevel: 2,
    evacuated: 0
  },
  
  // Low urgency zones (Level 1)
  {
    id: 'zone-013',
    zoneId: 'Z13',
    locationCoordinates: {
      latitude: 13.7250,
      longitude: 100.4700
    },
    numberOfPeople: 25,
    urgencyLevel: 1,
    evacuated: 0
  },
  {
    id: 'zone-014',
    zoneId: 'Z14',
    locationCoordinates: {
      latitude: 13.7050,
      longitude: 100.5800
    },
    numberOfPeople: 35,
    urgencyLevel: 1,
    evacuated: 0
  },
  {
    id: 'zone-015',
    zoneId: 'Z15',
    locationCoordinates: {
      latitude: 13.8000,
      longitude: 100.4900
    },
    numberOfPeople: 20,
    urgencyLevel: 1,
    evacuated: 0
  },
  
  // Edge cases for testing
  // Very large population zone
  {
    id: 'zone-016',
    zoneId: 'Z16',
    locationCoordinates: {
      latitude: 13.7500,
      longitude: 100.5300
    },
    numberOfPeople: 200,
    urgencyLevel: 4,
    evacuated: 0
  },
  
  // Very small population zone
  {
    id: 'zone-017',
    zoneId: 'Z17',
    locationCoordinates: {
      latitude: 13.7350,
      longitude: 100.5150
    },
    numberOfPeople: 5,
    urgencyLevel: 3,
    evacuated: 0
  },
  
  // Partially evacuated zones for testing
  {
    id: 'zone-018',
    zoneId: 'Z18',
    locationCoordinates: {
      latitude: 13.7650,
      longitude: 100.5400
    },
    numberOfPeople: 80,
    urgencyLevel: 4,
    evacuated: 30
  },
  
  {
    id: 'zone-019',
    zoneId: 'Z19',
    locationCoordinates: {
      latitude: 13.7750,
      longitude: 100.5050
    },
    numberOfPeople: 60,
    urgencyLevel: 2,
    evacuated: 45
  },
  
  // Almost fully evacuated zone
  {
    id: 'zone-020',
    zoneId: 'Z20',
    locationCoordinates: {
      latitude: 13.7550,
      longitude: 100.5250
    },
    numberOfPeople: 90,
    urgencyLevel: 3,
    evacuated: 85
  }
];
