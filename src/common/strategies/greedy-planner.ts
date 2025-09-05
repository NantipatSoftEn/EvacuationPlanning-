import { mockEvacuatedZones } from '@common/mocks/evacuation-zone';
import { mockVehicles } from '@common/mocks/vehicle';
import { EvacuationAssignment } from '@common/types/EvacuationAssignment';
import { estimateTravelTime } from '@common/utils/estimate-travel-time';
import { haversineDistance } from '@common/utils/haversine-distance';
import { ProcessedEvacuationZone } from '@modules/evacution/evacuation.service';
import { ProcessedVehicle } from '@modules/vehicle/vehicle.service';

// ===== Greedy Strategy =====

// เลือก vehicle ที่ใกล้และเหมาะสมที่สุดสำหรับ zone
function chooseBestVehicleGreedy(
    zone: ProcessedEvacuationZone, 
    vehicles: ProcessedVehicle[]
): ProcessedVehicle | null {
    let bestVehicle: ProcessedVehicle | null = null;
    let bestScore = Infinity;

    for (const v of vehicles) {
        if (!zone.locationCoordinates || !v.locationCoordinates) {
            continue; // ข้าม vehicle ที่ไม่มี coordinates
        }

        const dist = haversineDistance(
            zone.locationCoordinates.latitude, 
            zone.locationCoordinates.longitude, 
            v.locationCoordinates.latitude, 
            v.locationCoordinates.longitude
        );

        const remainingPeople = (zone.numberOfPeople || 0) - zone.evacuated;
        
        // greedy = เลือกที่เร็ว/ใกล้ + มี capacity เพียงพอ
        if (v.capacity > 0 && remainingPeople > 0) {
            const eta = estimateTravelTime(dist, v.speed || 50); // default speed 50 km/h
            const wastedCapacity = Math.max(0, v.capacity - remainingPeople);
            const score = eta + wastedCapacity; // greedy heuristic

            if (score < bestScore) {
                bestScore = score;
                bestVehicle = v;
            }
        }
    }

    return bestVehicle;
}

// สร้าง evacuation plan แบบ greedy
function generateGreedyPlan(
    zones: ProcessedEvacuationZone[], 
    vehicles: ProcessedVehicle[]
): EvacuationAssignment[] {
    const plan: EvacuationAssignment[] = [];
    
    // สร้างสำเนาของ zones และ vehicles เพื่อไม่ให้แก้ไขข้อมูลต้นฉบับ
    const zonesWorkingCopy = zones.map(zone => ({ ...zone }));
    const vehiclesWorkingCopy = vehicles.map(vehicle => ({ ...vehicle }));

    // เรียง zone ตาม urgency มาก → น้อย
    zonesWorkingCopy.sort((a, b) => (b.urgencyLevel || 0) - (a.urgencyLevel || 0));

    for (const zone of zonesWorkingCopy) {
        const remainingPeople = (zone.numberOfPeople || 0) - zone.evacuated;
        let peopleToEvacuate = remainingPeople;
        
        while (peopleToEvacuate > 0) {
            const vehicle = chooseBestVehicleGreedy(zone, vehiclesWorkingCopy);
            if (!vehicle || !zone.locationCoordinates || !vehicle.locationCoordinates) {
                break; // ไม่มีรถเหมาะสมแล้วหรือไม่มีข้อมูล coordinates
            }

            const assigned = Math.min(vehicle.capacity, peopleToEvacuate);

            plan.push({
                zoneId: zone.zoneId || zone.id,
                vehicleId: vehicle.vehicleId || vehicle.id,
                etaMinutes: estimateTravelTime(
                    haversineDistance(
                        zone.locationCoordinates.latitude,
                        zone.locationCoordinates.longitude,
                        vehicle.locationCoordinates.latitude,
                        vehicle.locationCoordinates.longitude,
                    ),
                    vehicle.speed || 50, // default speed 50 km/h
                ),
                evacuated: assigned,
            });

            // update state
            peopleToEvacuate -= assigned;
            zone.evacuated += assigned;
            vehicle.capacity -= assigned;
        }
    }

    return plan;
}

// ===== Export Functions =====
export { generateGreedyPlan, chooseBestVehicleGreedy };


console.log('Example Greedy Plan:', generateGreedyPlan(mockEvacuatedZones, mockVehicles));
