// import { mockEvacuatedZones } from '@common/mocks/evacuation-zone';
// import { mockVehicles } from '@common/mocks/vehicle';
import { EvacuationAssignment } from '@common/types/EvacuationAssignment';
// import { estimateTravelTime } from '@common/utils/estimate-travel-time';
// import { haversineDistance } from '@common/utils/haversine-distance';
import { ProcessedEvacuationZone } from '@modules/evacution/evacuation.service';
import { ProcessedVehicle } from '@modules/vehicle/vehicle.service';

// ===== Greedy Strategy =====

// Haversine formula คำนวณระยะทางระหว่างสองจุด (กม.)
export function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    const R = 6371; // รัศมีโลก (km)
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

export function estimateTravelTime(
    distanceKm: number,
    speedKmh: number,
): number {
    if (speedKmh <= 0) return Infinity;
    return (distanceKm / speedKmh) * 60;
}

// เลือก vehicle ที่ใกล้และเหมาะสมที่สุดสำหรับ zone
function chooseBestVehicleGreedy(
    zone: ProcessedEvacuationZone,
    vehicles: ProcessedVehicle[],
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
            v.locationCoordinates.longitude,
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
    vehicles: ProcessedVehicle[],
): EvacuationAssignment[] {
    const plan: EvacuationAssignment[] = [];

    // สร้างสำเนาของ zones และ vehicles เพื่อไม่ให้แก้ไขข้อมูลต้นฉบับ
    const zonesWorkingCopy = zones.map((zone) => ({ ...zone }));
    const vehiclesWorkingCopy = vehicles.map((vehicle) => ({ ...vehicle }));

    // เรียง zone ตาม urgency มาก → น้อย
    zonesWorkingCopy.sort(
        (a, b) => (b.urgencyLevel || 0) - (a.urgencyLevel || 0),
    );

    for (const zone of zonesWorkingCopy) {
        const remainingPeople = (zone.numberOfPeople || 0) - zone.evacuated;
        let peopleToEvacuate = remainingPeople;

        while (peopleToEvacuate > 0) {
            const vehicle = chooseBestVehicleGreedy(zone, vehiclesWorkingCopy);
            if (
                !vehicle ||
                !zone.locationCoordinates ||
                !vehicle.locationCoordinates
            ) {
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

const mockZone: ProcessedEvacuationZone[] = [
    {
        id: 'z1',
        zoneId: 'Z1',
        locationCoordinates: { latitude: 13.9, longitude: 100.9 }, // Far
        numberOfPeople: 40,
        urgencyLevel: 5,
        evacuated: 0,
    },
     {
        id: 'z2',
        zoneId: 'Z2',
        locationCoordinates: { latitude: 13.0, longitude: 100.9 }, // Far
        numberOfPeople: 10,
        urgencyLevel: 4,
        evacuated: 0,
    },
];

const mockVehicles: ProcessedVehicle[] = [
    {
        id: 'v1',
        vehicleId: 'v1',
        locationCoordinates: { latitude: 13.8, longitude: 100.51 },
        capacity: 10, 
        speed: 100,
        type: 'bus',
    },
     {
        id: 'v2',
        vehicleId: 'v2',
        locationCoordinates: { latitude: 13.76, longitude: 100.51 },
        capacity: 40,
        speed: 61,
        type: 'bus',
    },
];

console.log(generateGreedyPlan(mockZone, mockVehicles));
