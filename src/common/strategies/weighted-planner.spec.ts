import { 
    generateWeightedPlan, 
    chooseBestVehicleWeighted, 
    calculateWeightedScore,
    haversineDistance,
    estimateTravelTime
} from './weighted-planer';
import { ProcessedEvacuationZone } from '@modules/evacution/evacuation.service';
import { ProcessedVehicle } from '@modules/vehicle/vehicle.service';

describe('Weighted Planner Strategy', () => {
    const mockZones: ProcessedEvacuationZone[] = [
        {
            id: 'z1',
            zoneId: 'Z1',
            locationCoordinates: { latitude: 13.9, longitude: 100.9 },
            numberOfPeople: 40,
            urgencyLevel: 5, // High urgency
            evacuated: 0,
        },
        {
            id: 'z2',
            zoneId: 'Z2',
            locationCoordinates: { latitude: 13.0, longitude: 100.9 },
            numberOfPeople: 10,
            urgencyLevel: 2, // Lower urgency
            evacuated: 0,
        },
        {
            id: 'z3',
            zoneId: 'Z3',
            locationCoordinates: { latitude: 13.8, longitude: 100.5 },
            numberOfPeople: 25,
            urgencyLevel: 4, // Medium-high urgency
            evacuated: 0,
        },
    ];

    const mockVehicles: ProcessedVehicle[] = [
        {
            id: 'v1',
            vehicleId: 'V1',
            locationCoordinates: { latitude: 13.8, longitude: 100.51 },
            capacity: 10,
            speed: 100, // Fast but small capacity
            type: 'van',
        },
        {
            id: 'v2',
            vehicleId: 'V2',
            locationCoordinates: { latitude: 13.76, longitude: 100.51 },
            capacity: 40,
            speed: 60, // Large capacity, moderate speed
            type: 'bus',
        },
        {
            id: 'v3',
            vehicleId: 'V3',
            locationCoordinates: { latitude: 13.1, longitude: 100.9 },
            capacity: 20,
            speed: 80, // Medium capacity, good speed
            type: 'truck',
        },
    ];

    describe('haversineDistance', () => {
        it('should calculate distance between two coordinates correctly', () => {
            const distance = haversineDistance(13.0, 100.0, 13.1, 100.1);
            expect(distance).toBeGreaterThan(0);
            expect(distance).toBeLessThan(20); // Should be reasonable distance
        });

        it('should return 0 for same coordinates', () => {
            const distance = haversineDistance(13.0, 100.0, 13.0, 100.0);
            expect(distance).toBe(0);
        });
    });

    describe('estimateTravelTime', () => {
        it('should calculate travel time correctly', () => {
            const travelTime = estimateTravelTime(60, 60); // 60km at 60km/h = 60 minutes
            expect(travelTime).toBe(60);
        });

        it('should return infinity for zero speed', () => {
            const travelTime = estimateTravelTime(60, 0);
            expect(travelTime).toBe(Infinity);
        });

        it('should return infinity for negative speed', () => {
            const travelTime = estimateTravelTime(60, -10);
            expect(travelTime).toBe(Infinity);
        });
    });

    describe('calculateWeightedScore', () => {
        it('should return lower score for higher urgency', () => {
            const highUrgencyZone = { ...mockZones[0], urgencyLevel: 5 };
            const lowUrgencyZone = { ...mockZones[1], urgencyLevel: 1 };
            const vehicle = mockVehicles[0];

            const highUrgencyScore = calculateWeightedScore(highUrgencyZone, vehicle);
            const lowUrgencyScore = calculateWeightedScore(lowUrgencyZone, vehicle);

            expect(highUrgencyScore).toBeLessThan(lowUrgencyScore);
        });

        it('should return lower score for better capacity utilization', () => {
            const zone = { ...mockZones[0], numberOfPeople: 40 };
            const perfectCapacityVehicle = { ...mockVehicles[1], capacity: 40 }; // Perfect match
            const excessCapacityVehicle = { ...mockVehicles[1], capacity: 80 }; // Too much capacity

            const perfectScore = calculateWeightedScore(zone, perfectCapacityVehicle);
            const excessScore = calculateWeightedScore(zone, excessCapacityVehicle);

            expect(perfectScore).toBeLessThan(excessScore);
        });

        it('should return Infinity for zones/vehicles without coordinates', () => {
            const zoneNoCoords = { ...mockZones[0], locationCoordinates: undefined };
            const vehicleNoCoords = { ...mockVehicles[0], locationCoordinates: undefined };

            expect(calculateWeightedScore(zoneNoCoords, mockVehicles[0])).toBe(Infinity);
            expect(calculateWeightedScore(mockZones[0], vehicleNoCoords)).toBe(Infinity);
        });
    });

    describe('chooseBestVehicleWeighted', () => {
        it('should choose vehicle with best weighted score', () => {
            const zone = mockZones[0]; // High urgency zone
            const vehicles = [...mockVehicles];

            const bestVehicle = chooseBestVehicleWeighted(zone, vehicles);
            expect(bestVehicle).toBeDefined();
            expect(bestVehicle?.capacity).toBeGreaterThan(0);
        });

        it('should return null if no vehicles have capacity', () => {
            const zone = mockZones[0];
            const noCapacityVehicles = mockVehicles.map(v => ({ ...v, capacity: 0 }));

            const bestVehicle = chooseBestVehicleWeighted(zone, noCapacityVehicles);
            expect(bestVehicle).toBeNull();
        });

        it('should return null if zone has no people to evacuate', () => {
            const evacuatedZone = { ...mockZones[0], evacuated: 40 }; // All people evacuated
            const vehicles = [...mockVehicles];

            const bestVehicle = chooseBestVehicleWeighted(evacuatedZone, vehicles);
            expect(bestVehicle).toBeNull();
        });
    });

    describe('generateWeightedPlan', () => {
        it('should generate a complete evacuation plan', () => {
            const zones = mockZones.map(z => ({ ...z }));
            const vehicles = mockVehicles.map(v => ({ ...v }));

            const plan = generateWeightedPlan(zones, vehicles);

            expect(plan).toBeDefined();
            expect(plan.length).toBeGreaterThan(0);
            expect(plan).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        zoneId: expect.any(String),
                        vehicleId: expect.any(String),
                        etaMinutes: expect.any(Number),
                        evacuated: expect.any(Number),
                    }),
                ])
            );
        });

        it('should prioritize high urgency zones', () => {
            const zones = mockZones.map(z => ({ ...z }));
            const vehicles = mockVehicles.map(v => ({ ...v }));

            const plan = generateWeightedPlan(zones, vehicles);
            
            // Find assignments for high urgency zone (Z1, urgencyLevel: 5)
            const highUrgencyAssignments = plan.filter(p => p.zoneId === 'Z1');
            
            // Should have assignments for high urgency zone
            expect(highUrgencyAssignments.length).toBeGreaterThan(0);
        });

        it('should not assign more people than zone population', () => {
            const zones = mockZones.map(z => ({ ...z }));
            const vehicles = mockVehicles.map(v => ({ ...v }));

            const plan = generateWeightedPlan(zones, vehicles);

            // Group assignments by zone and check total evacuated doesn't exceed population
            const assignmentsByZone = plan.reduce((acc, assignment) => {
                if (!acc[assignment.zoneId]) {
                    acc[assignment.zoneId] = 0;
                }
                acc[assignment.zoneId] += assignment.evacuated;
                return acc;
            }, {} as Record<string, number>);

            zones.forEach(zone => {
                const zoneId = zone.zoneId || zone.id;
                const totalEvacuated = assignmentsByZone[zoneId] || 0;
                expect(totalEvacuated).toBeLessThanOrEqual(zone.numberOfPeople || 0);
            });
        });

        it('should not assign more people than vehicle capacity', () => {
            const zones = mockZones.map(z => ({ ...z }));
            const vehicles = mockVehicles.map(v => ({ ...v }));

            const plan = generateWeightedPlan(zones, vehicles);

            plan.forEach(assignment => {
                const vehicle = vehicles.find(v => 
                    (v.vehicleId || v.id) === assignment.vehicleId
                );
                expect(vehicle).toBeDefined();
                expect(assignment.evacuated).toBeLessThanOrEqual(vehicle!.capacity);
            });
        });

        it('should handle empty inputs gracefully', () => {
            expect(generateWeightedPlan([], [])).toEqual([]);
            expect(generateWeightedPlan(mockZones, [])).toEqual([]);
            expect(generateWeightedPlan([], mockVehicles)).toEqual([]);
        });
    });

    describe('Priority System Verification', () => {
        it('should prioritize urgency over distance', () => {
            const nearZoneLowUrgency: ProcessedEvacuationZone = {
                id: 'near',
                zoneId: 'NEAR',
                locationCoordinates: { latitude: 13.76, longitude: 100.51 }, // Very close to vehicle
                numberOfPeople: 10,
                urgencyLevel: 1, // Low urgency
                evacuated: 0,
            };

            const farZoneHighUrgency: ProcessedEvacuationZone = {
                id: 'far',
                zoneId: 'FAR',
                locationCoordinates: { latitude: 14.5, longitude: 101.5 }, // Far from vehicle
                numberOfPeople: 10,
                urgencyLevel: 5, // High urgency
                evacuated: 0,
            };

            const vehicle = mockVehicles[0];

            const nearScore = calculateWeightedScore(nearZoneLowUrgency, vehicle);
            const farScore = calculateWeightedScore(farZoneHighUrgency, vehicle);

            // High urgency should get better score even if farther
            expect(farScore).toBeLessThan(nearScore);
        });

        it('should prioritize capacity utilization over distance when urgency is equal', () => {
            const baseZone = {
                locationCoordinates: { latitude: 13.9, longitude: 100.9 },
                urgencyLevel: 3,
                evacuated: 0,
            };

            const perfectCapacityZone: ProcessedEvacuationZone = {
                ...baseZone,
                id: 'perfect',
                zoneId: 'PERFECT',
                numberOfPeople: 40, // Perfect match for 40-capacity vehicle
            };

            const wastedCapacityZone: ProcessedEvacuationZone = {
                ...baseZone,
                id: 'wasted',
                zoneId: 'WASTED',
                numberOfPeople: 10, // Will waste vehicle capacity
            };

            const vehicle = { ...mockVehicles[1], capacity: 40 };

            const perfectScore = calculateWeightedScore(perfectCapacityZone, vehicle);
            const wastedScore = calculateWeightedScore(wastedCapacityZone, vehicle);

            // Perfect capacity utilization should get better score
            expect(perfectScore).toBeLessThan(wastedScore);
        });
    });
});
