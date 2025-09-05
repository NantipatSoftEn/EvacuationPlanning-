import { ProcessedEvacuationZone } from '@modules/evacution/evacuation.service';
import { ProcessedVehicle } from '@modules/vehicle/vehicle.service';

// ===== Interfaces =====

interface EvacuationAssignment {
  zoneId: string;
  vehicleId: string;
  etaMinutes: number;
  evacuated: number;
}

// ===== Helper Functions =====

// Haversine formula คำนวณระยะทางระหว่างสองจุด (กม.)
function haversineDistance(
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

// เวลาที่ใช้ (ชั่วโมง → นาที)
function estimateTravelTime(distanceKm: number, speedKmh: number): number {
    if (speedKmh <= 0) return Infinity;
    return (distanceKm / speedKmh) * 60;
}

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
export { generateGreedyPlan, chooseBestVehicleGreedy, haversineDistance, estimateTravelTime };

// ===== Example Usage =====
const exampleZones: ProcessedEvacuationZone[] = [
    { 
        id: 'zone-example-1', 
        zoneId: 'Z1',
        locationCoordinates: { latitude: 13.75, longitude: 100.5 },
        numberOfPeople: 60, 
        urgencyLevel: 5,
        evacuated: 0
    },
    { 
        id: 'zone-example-2', 
        zoneId: 'Z2',
        locationCoordinates: { latitude: 13.7, longitude: 100.55 },
        numberOfPeople: 30, 
        urgencyLevel: 3,
        evacuated: 0
    },
];

const exampleVehicles: ProcessedVehicle[] = [
    { 
        id: 'vehicle-example-1', 
        vehicleId: 'V1',
        locationCoordinates: { latitude: 13.8, longitude: 100.6 },
        capacity: 40, 
        speed: 60,
        type: 'bus'
    },
    { 
        id: 'vehicle-example-2', 
        vehicleId: 'V2',
        locationCoordinates: { latitude: 13.72, longitude: 100.58 },
        capacity: 20, 
        speed: 50,
        type: 'van'
    },
];

console.log('Example Greedy Plan:', generateGreedyPlan(exampleZones, exampleVehicles));
