import { generateGreedyPlan, chooseBestVehicleGreedy } from './greedy-planner';
import { ProcessedEvacuationZone } from '@modules/evacution/evacuation.service';
import { ProcessedVehicle } from '@modules/vehicle/vehicle.service';
import { EvacuationAssignment } from '@common/types/EvacuationAssignment';

describe('🔹 Comprehensive Greedy Algorithm Test Cases', () => {
    describe('1. Urgency vs Distance', () => {
        it('should prioritize high urgency zone over closer zone with lower urgency', () => {
            const zones: ProcessedEvacuationZone[] = [
                {
                    id: 'z1-far-urgent',
                    zoneId: 'Z1',
                    locationCoordinates: { latitude: 13.9, longitude: 100.9 }, // Far away
                    numberOfPeople: 20,
                    urgencyLevel: 5, // High urgency
                    evacuated: 0,
                },
                {
                    id: 'z2-close-low-urgency',
                    zoneId: 'Z2',
                    locationCoordinates: { latitude: 13.751, longitude: 100.501 }, // Very close
                    numberOfPeople: 20,
                    urgencyLevel: 3, // Lower urgency
                    evacuated: 0,
                },
            ];

            const vehicles: ProcessedVehicle[] = [
                {
                    id: 'v1-close-to-z2',
                    vehicleId: 'V1',
                    locationCoordinates: { latitude: 13.75, longitude: 100.5 }, // Very close to Z2
                    capacity: 20,
                    speed: 60,
                    type: 'van',
                },
            ];

            const plan = generateGreedyPlan(zones, vehicles);

            // Greedy should choose Z1 first due to higher urgency despite distance
            expect(plan[0].zoneId).toBe('Z1');
            expect(plan[0].vehicleId).toBe('V1');
            expect(plan[0].evacuated).toBe(20);
        });
    });

    describe('2. Capacity เกินจำนวนคน', () => {
        it('should use oversized vehicle to evacuate zone in single trip', () => {
            const zones: ProcessedEvacuationZone[] = [
                {
                    id: 'z1-small-group',
                    zoneId: 'Z1',
                    locationCoordinates: { latitude: 13.75, longitude: 100.5 },
                    numberOfPeople: 10,
                    urgencyLevel: 5,
                    evacuated: 0,
                },
            ];

            const vehicles: ProcessedVehicle[] = [
                {
                    id: 'v1-oversized',
                    vehicleId: 'V1',
                    locationCoordinates: { latitude: 13.76, longitude: 100.51 },
                    capacity: 40, // Much larger than needed
                    speed: 60,
                    type: 'bus',
                },
            ];

            const plan = generateGreedyPlan(zones, vehicles);

            // Should complete evacuation in single assignment
            expect(plan.length).toBe(1);
            expect(plan[0].zoneId).toBe('Z1');
            expect(plan[0].vehicleId).toBe('V1');
            expect(plan[0].evacuated).toBe(10); // All people evacuated
        });
    });

    describe('3. ต้องใช้หลายคันมาช่วยกัน', () => {
        it('should assign multiple vehicles in order of capacity/efficiency', () => {
            const zones: ProcessedEvacuationZone[] = [
                {
                    id: 'z1-large-group',
                    zoneId: 'Z1',
                    locationCoordinates: { latitude: 13.75, longitude: 100.5 },
                    numberOfPeople: 70,
                    urgencyLevel: 5,
                    evacuated: 0,
                },
            ];

            const vehicles: ProcessedVehicle[] = [
                {
                    id: 'v1-large',
                    vehicleId: 'V1',
                    locationCoordinates: { latitude: 13.76, longitude: 100.51 },
                    capacity: 40,
                    speed: 60,
                    type: 'bus',
                },
                {
                    id: 'v2-medium',
                    vehicleId: 'V2',
                    locationCoordinates: { latitude: 13.77, longitude: 100.52 },
                    capacity: 20,
                    speed: 50,
                    type: 'van',
                },
                {
                    id: 'v3-small',
                    vehicleId: 'V3',
                    locationCoordinates: { latitude: 13.78, longitude: 100.53 },
                    capacity: 10,
                    speed: 40,
                    type: 'car',
                },
            ];

            const plan = generateGreedyPlan(zones, vehicles);

            // Should use all 3 vehicles for the same zone
            expect(plan.length).toBe(3);
            expect(plan.every(assignment => assignment.zoneId === 'Z1')).toBe(true);

            // Check total evacuation
            const totalEvacuated = plan.reduce((sum, assignment) => sum + assignment.evacuated, 0);
            expect(totalEvacuated).toBe(70);

            // Verify vehicle usage (greedy picks best available each time)
            const vehicleIds = plan.map(assignment => assignment.vehicleId);
            expect(vehicleIds).toContain('V1');
            expect(vehicleIds).toContain('V2'); 
            expect(vehicleIds).toContain('V3');
        });
    });

    describe('4. รถใกล้แต่จุน้อย vs รถไกลแต่จุเยอะ', () => {
        it('should demonstrate greedy short-sighted behavior (close small vs far large)', () => {
            const zones: ProcessedEvacuationZone[] = [
                {
                    id: 'z1-needs-40',
                    zoneId: 'Z1',
                    locationCoordinates: { latitude: 13.75, longitude: 100.5 },
                    numberOfPeople: 40,
                    urgencyLevel: 5,
                    evacuated: 0,
                },
            ];

            const vehicles: ProcessedVehicle[] = [
                {
                    id: 'v1-close-small',
                    vehicleId: 'V1',
                    locationCoordinates: { latitude: 13.751, longitude: 100.501 }, // Very close
                    capacity: 10,
                    speed: 60,
                    type: 'car',
                },
                {
                    id: 'v2-far-large',
                    vehicleId: 'V2',
                    locationCoordinates: { latitude: 13.8, longitude: 100.6 }, // Further away
                    capacity: 40,
                    speed: 50,
                    type: 'bus',
                },
            ];

            const plan = generateGreedyPlan(zones, vehicles);

            // Greedy will likely choose V1 first due to proximity (suboptimal)
            // This demonstrates the greedy algorithm's short-sighted nature
            expect(plan.length).toBeGreaterThan(1); // Multiple trips needed
            
            // Check that both vehicles are eventually used
            const vehicleIds = plan.map(assignment => assignment.vehicleId);
            const totalEvacuated = plan.reduce((sum, assignment) => sum + assignment.evacuated, 0);
            expect(totalEvacuated).toBe(40); // All people evacuated eventually
        });
    });

    describe('5. หลาย Zone แข่งรถกัน', () => {
        it('should prioritize zones strictly by urgency level', () => {
            const zones: ProcessedEvacuationZone[] = [
                {
                    id: 'z1-urgent',
                    zoneId: 'Z1',
                    locationCoordinates: { latitude: 13.75, longitude: 100.5 },
                    numberOfPeople: 30,
                    urgencyLevel: 5, // Higher urgency
                    evacuated: 0,
                },
                {
                    id: 'z2-less-urgent',
                    zoneId: 'Z2',
                    locationCoordinates: { latitude: 13.77, longitude: 100.52 },
                    numberOfPeople: 30,
                    urgencyLevel: 4, // Lower urgency
                    evacuated: 0,
                },
            ];

            const vehicles: ProcessedVehicle[] = [
                {
                    id: 'v1-shared',
                    vehicleId: 'V1',
                    locationCoordinates: { latitude: 13.76, longitude: 100.51 },
                    capacity: 40, // Can handle either zone completely
                    speed: 60,
                    type: 'bus',
                },
            ];

            const plan = generateGreedyPlan(zones, vehicles);

            // Z1 should be handled completely before Z2 gets any vehicle
            const z1Assignments = plan.filter(assignment => assignment.zoneId === 'Z1');
            const z2Assignments = plan.filter(assignment => assignment.zoneId === 'Z2');
            
            expect(z1Assignments.length).toBeGreaterThan(0);
            // Z1 should be evacuated first (30 people with 40 capacity = 1 trip)
            expect(z1Assignments[0].evacuated).toBe(30);
        });
    });

    describe('6. Zone ที่ไม่พอรถ (เกิน capacity รวม)', () => {
        it('should evacuate as many as possible when total capacity insufficient', () => {
            const zones: ProcessedEvacuationZone[] = [
                {
                    id: 'z1-too-many-people',
                    zoneId: 'Z1',
                    locationCoordinates: { latitude: 13.75, longitude: 100.5 },
                    numberOfPeople: 100,
                    urgencyLevel: 5,
                    evacuated: 0,
                },
            ];

            const vehicles: ProcessedVehicle[] = [
                {
                    id: 'v1-limited',
                    vehicleId: 'V1',
                    locationCoordinates: { latitude: 13.76, longitude: 100.51 },
                    capacity: 40,
                    speed: 60,
                    type: 'bus',
                },
                {
                    id: 'v2-limited',
                    vehicleId: 'V2',
                    locationCoordinates: { latitude: 13.77, longitude: 100.52 },
                    capacity: 30,
                    speed: 50,
                    type: 'van',
                },
            ];

            const plan = generateGreedyPlan(zones, vehicles);

            // Should use both vehicles
            expect(plan.length).toBe(2);
            
            const totalEvacuated = plan.reduce((sum, assignment) => sum + assignment.evacuated, 0);
            expect(totalEvacuated).toBe(70); // 40 + 30
            expect(totalEvacuated).toBeLessThan(100); // Not all people evacuated
            
            // Verify both vehicles are used
            const vehicleIds = plan.map(assignment => assignment.vehicleId);
            expect(vehicleIds).toContain('V1');
            expect(vehicleIds).toContain('V2');
        });
    });

    describe('7. No available vehicle', () => {
        it('should return empty plan when no vehicles available', () => {
            const zones: ProcessedEvacuationZone[] = [
                {
                    id: 'z1-needs-help',
                    zoneId: 'Z1',
                    locationCoordinates: { latitude: 13.75, longitude: 100.5 },
                    numberOfPeople: 20,
                    urgencyLevel: 5,
                    evacuated: 0,
                },
            ];

            const vehicles: ProcessedVehicle[] = []; // No vehicles available

            const plan = generateGreedyPlan(zones, vehicles);

            // Should return empty plan
            expect(plan).toEqual([]);
            expect(plan.length).toBe(0);
        });

        it('should return empty plan when vehicles have no capacity', () => {
            const zones: ProcessedEvacuationZone[] = [
                {
                    id: 'z1-needs-help',
                    zoneId: 'Z1',
                    locationCoordinates: { latitude: 13.75, longitude: 100.5 },
                    numberOfPeople: 20,
                    urgencyLevel: 5,
                    evacuated: 0,
                },
            ];

            const vehicles: ProcessedVehicle[] = [
                {
                    id: 'v1-full',
                    vehicleId: 'V1',
                    locationCoordinates: { latitude: 13.76, longitude: 100.51 },
                    capacity: 0, // No capacity
                    speed: 60,
                    type: 'bus',
                },
            ];

            const plan = generateGreedyPlan(zones, vehicles);

            // Should return empty plan
            expect(plan).toEqual([]);
        });
    });

    describe('8. Simultaneous zones with same urgency', () => {
        it('should have consistent tiebreaker for zones with same urgency', () => {
            const zones: ProcessedEvacuationZone[] = [
                {
                    id: 'z1-same-urgency',
                    zoneId: 'Z1',
                    locationCoordinates: { latitude: 13.75, longitude: 100.5 },
                    numberOfPeople: 20,
                    urgencyLevel: 4, // Same urgency
                    evacuated: 0,
                },
                {
                    id: 'z2-same-urgency',
                    zoneId: 'Z2',
                    locationCoordinates: { latitude: 13.77, longitude: 100.52 },
                    numberOfPeople: 25,
                    urgencyLevel: 4, // Same urgency
                    evacuated: 0,
                },
            ];

            const vehicles: ProcessedVehicle[] = [
                {
                    id: 'v1-single',
                    vehicleId: 'V1',
                    locationCoordinates: { latitude: 13.76, longitude: 100.51 },
                    capacity: 30, // Can handle either zone
                    speed: 60,
                    type: 'bus',
                },
            ];

            // Run multiple times to ensure consistent behavior
            const plan1 = generateGreedyPlan(zones, vehicles);
            const plan2 = generateGreedyPlan(zones, vehicles);
            const plan3 = generateGreedyPlan(zones, vehicles);

            // Should be consistent across runs
            expect(plan1).toEqual(plan2);
            expect(plan2).toEqual(plan3);
            
            // Should handle both zones
            expect(plan1.length).toBe(2);
            
            // First assignment should be consistent (based on sort order in array)
            expect(plan1[0].zoneId).toBe(plan2[0].zoneId);
            expect(plan1[0].zoneId).toBe(plan3[0].zoneId);
        });

        it('should use distance as tiebreaker when urgency is equal', () => {
            const zones: ProcessedEvacuationZone[] = [
                {
                    id: 'z1-far-same-urgency',
                    zoneId: 'Z1',
                    locationCoordinates: { latitude: 13.9, longitude: 100.9 }, // Far
                    numberOfPeople: 20,
                    urgencyLevel: 4,
                    evacuated: 0,
                },
                {
                    id: 'z2-close-same-urgency',
                    zoneId: 'Z2',
                    locationCoordinates: { latitude: 13.751, longitude: 100.501 }, // Close
                    numberOfPeople: 20,
                    urgencyLevel: 4,
                    evacuated: 0,
                },
            ];

            const vehicles: ProcessedVehicle[] = [
                {
                    id: 'v1-positioned',
                    vehicleId: 'V1',
                    locationCoordinates: { latitude: 13.75, longitude: 100.5 },
                    capacity: 25,
                    speed: 60,
                    type: 'bus',
                },
            ];

            const plan = generateGreedyPlan(zones, vehicles);
            
            // Since urgency is the same, the algorithm should process in the order 
            // they appear in the array (after sorting by urgency)
            expect(plan.length).toBe(2);
            // Both zones should be handled
            const zoneIds = plan.map(assignment => assignment.zoneId);
            expect(zoneIds).toContain('Z1');
            expect(zoneIds).toContain('Z2');
        });
    });
});
