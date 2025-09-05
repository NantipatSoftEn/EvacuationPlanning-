import { EvacuationAssignment } from '@common/types/EvacuationAssignment';
import { ProcessedEvacuationZone } from '@modules/evacution/evacuation.service';
import { ProcessedVehicle } from '@modules/vehicle/vehicle.service';

// ===== Weighted Strategy =====
// Priority: urgency > capacity > distance > ETA

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

// คำนวณคะแนนถ่วงน้ำหนักสำหรับการจับคู่ zone-vehicle
function calculateWeightedScore(
    zone: ProcessedEvacuationZone,
    vehicle: ProcessedVehicle,
): number {
    if (!zone.locationCoordinates || !vehicle.locationCoordinates) {
        return Infinity; // ไม่สามารถคำนวณได้ถ้าไม่มี coordinates
    }

    const remainingPeople = (zone.numberOfPeople || 0) - zone.evacuated;
    const urgencyLevel = zone.urgencyLevel || 1;
    const vehicleCapacity = vehicle.capacity;
    const vehicleSpeed = vehicle.speed || 50;

    // คำนวณระยะทางและเวลา
    const distance = haversineDistance(
        zone.locationCoordinates.latitude,
        zone.locationCoordinates.longitude,
        vehicle.locationCoordinates.latitude,
        vehicle.locationCoordinates.longitude,
    );
    const eta = estimateTravelTime(distance, vehicleSpeed);

    // กำหนดน้ำหนัก (weights) ตามลำดับความสำคัญ
    const urgencyWeight = 10000;  // น้ำหนักสูงสุด - urgency มาก่อน
    const capacityWeight = 1000;  // น้ำหนักรอง - capacity
    const distanceWeight = 100;   // น้ำหนักที่สาม - distance
    const etaWeight = 10;         // น้ำหนักต่ำสุด - ETA

    // คำนวณคะแนนแต่ละหมวด (ยิ่งต่ำยิ่งดี)
    
    // 1. Urgency Score (ยิ่ง urgency สูง คะแนนยิ่งต่ำ)
    // ใช้ (6 - urgencyLevel) เพื่อให้ urgency สูง ได้คะแนนต่ำ
    const normalizedUrgency = 6 - Math.min(Math.max(urgencyLevel, 1), 5);
    const urgencyScore = urgencyWeight * normalizedUrgency;
    
    // 2. Capacity Score (ยิ่งใช้ capacity เต็มที่ คะแนนยิ่งต่ำ)
    const capacityUtilization = Math.min(remainingPeople, vehicleCapacity) / vehicleCapacity;
    const capacityScore = capacityWeight * (1 - capacityUtilization);
    
    // 3. Distance Score (ยิ่งใกล้ คะแนนยิ่งต่ำ)
    const normalizedDistance = Math.min(distance, 100) / 100; // Normalize to 0-1
    const distanceScore = distanceWeight * normalizedDistance;
    
    // 4. ETA Score (ยิ่งเร็ว คะแนนยิ่งต่ำ)
    const normalizedEta = Math.min(eta, 300) / 300; // Normalize to 0-1 (max 5 hours)
    const etaScore = etaWeight * normalizedEta;

    // รวมคะแนนถ่วงน้ำหนัก
    const totalScore = urgencyScore + capacityScore + distanceScore + etaScore;

    return totalScore;
}

// เลือก vehicle ที่เหมาะสมที่สุดสำหรับ zone ด้วย weighted scoring
function chooseBestVehicleWeighted(
    zone: ProcessedEvacuationZone,
    vehicles: ProcessedVehicle[],
): ProcessedVehicle | null {
    let bestVehicle: ProcessedVehicle | null = null;
    let bestScore = Infinity;

    const remainingPeople = (zone.numberOfPeople || 0) - zone.evacuated;

    for (const vehicle of vehicles) {
        // ตรวจสอบว่า vehicle มี capacity เหลืออยู่และ zone ยังมีคนต้องอพยพ
        if (vehicle.capacity <= 0 || remainingPeople <= 0) {
            continue;
        }

        // คำนวณคะแนนถ่วงน้ำหนัก
        const score = calculateWeightedScore(zone, vehicle);

        // เลือก vehicle ที่มีคะแนนดีที่สุด (ต่ำสุด)
        if (score < bestScore) {
            bestScore = score;
            bestVehicle = vehicle;
        }
    }

    return bestVehicle;
}

// สร้าง evacuation plan แบบ weighted strategy
function generateWeightedPlan(
    zones: ProcessedEvacuationZone[],
    vehicles: ProcessedVehicle[],
): EvacuationAssignment[] {
    const plan: EvacuationAssignment[] = [];

    // สร้างสำเนาของ zones และ vehicles เพื่อไม่ให้แก้ไขข้อมูลต้นฉบับ
    const zonesWorkingCopy = zones.map((zone) => ({ ...zone }));
    const vehiclesWorkingCopy = vehicles.map((vehicle) => ({ ...vehicle }));

    // เรียง zones ตาม urgency level จากมาก → น้อย
    zonesWorkingCopy.sort(
        (a, b) => (b.urgencyLevel || 0) - (a.urgencyLevel || 0),
    );

    for (const zone of zonesWorkingCopy) {
        const remainingPeople = (zone.numberOfPeople || 0) - zone.evacuated;
        
        if (remainingPeople <= 0) continue;

        // หาคู่ zone-vehicle ที่ดีที่สุดโดยพิจารณาการใช้ vehicle เต็มประสิทธิภาพ
        let bestAssignment: {
            vehicle: ProcessedVehicle;
            score: number;
            evacuated: number;
            etaMinutes: number;
        } | null = null;

        for (const vehicle of vehiclesWorkingCopy) {
            if (!vehicle.locationCoordinates || !zone.locationCoordinates || vehicle.capacity <= 0) {
                continue;
            }

            // คำนวณจำนวนคนที่จะอพยพได้ด้วย vehicle นี้
            const canEvacuate = Math.min(vehicle.capacity, remainingPeople);
            
            // คำนวณระยะทางและเวลา
            const distance = haversineDistance(
                zone.locationCoordinates.latitude,
                zone.locationCoordinates.longitude,
                vehicle.locationCoordinates.latitude,
                vehicle.locationCoordinates.longitude,
            );
            const etaMinutes = estimateTravelTime(distance, vehicle.speed || 50);

            // คำนวณคะแนนถ่วงน้ำหนัก
            const score = calculateWeightedScore(zone, vehicle);

            // เลือกการจับคู่ที่ดีที่สุด (คะแนนต่ำสุด และอพยพคนได้มากที่สุด)
            if (!bestAssignment || 
                score < bestAssignment.score || 
                (score === bestAssignment.score && canEvacuate > bestAssignment.evacuated)) {
                bestAssignment = {
                    vehicle,
                    score,
                    evacuated: canEvacuate,
                    etaMinutes,
                };
            }
        }

        // ถ้าหาคู่ที่ดีที่สุดได้
        if (bestAssignment) {
            plan.push({
                zoneId: zone.zoneId || zone.id,
                vehicleId: bestAssignment.vehicle.vehicleId || bestAssignment.vehicle.id,
                etaMinutes: bestAssignment.etaMinutes,
                evacuated: bestAssignment.evacuated,
            });

            // อัพเดทสถานะ
            zone.evacuated += bestAssignment.evacuated;
            bestAssignment.vehicle.capacity -= bestAssignment.evacuated;
        }
    }

    return plan;
}

// ===== Export Functions =====
export { 
    generateWeightedPlan, 
    chooseBestVehicleWeighted, 
    calculateWeightedScore 
};

// ===== Testing Data =====
// const mockZones: ProcessedEvacuationZone[] = [
//     {
//         id: 'z1',
//         zoneId: 'Z1',
//         locationCoordinates: { latitude: 13.9, longitude: 100.9 },
//         numberOfPeople: 40,
//         urgencyLevel: 5, // High urgency
//         evacuated: 0,
//     },
//     {
//         id: 'z2',
//         zoneId: 'Z2',
//         locationCoordinates: { latitude: 13.0, longitude: 100.9 },
//         numberOfPeople: 10,
//         urgencyLevel: 2, // Lower urgency
//         evacuated: 0,
//     },
//     {
//         id: 'z3',
//         zoneId: 'Z3',
//         locationCoordinates: { latitude: 13.8, longitude: 100.5 },
//         numberOfPeople: 25,
//         urgencyLevel: 4, // Medium-high urgency
//         evacuated: 0,
//     },
// ];

// const mockVehicles: ProcessedVehicle[] = [
//     {
//         id: 'v1',
//         vehicleId: 'V1',
//         locationCoordinates: { latitude: 13.8, longitude: 100.51 },
//         capacity: 10,
//         speed: 100, // Fast but small capacity
//         type: 'van',
//     },
//     {
//         id: 'v2',
//         vehicleId: 'V2',
//         locationCoordinates: { latitude: 13.76, longitude: 100.51 },
//         capacity: 40,
//         speed: 60, // Large capacity, moderate speed
//         type: 'bus',
//     },
//     {
//         id: 'v3',
//         vehicleId: 'V3',
//         locationCoordinates: { latitude: 13.1, longitude: 100.9 },
//         capacity: 20,
//         speed: 80, // Medium capacity, good speed
//         type: 'truck',
//     },
// ];

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



// Test the weighted strategy
console.log('=== Weighted Strategy Test ===');
console.log(JSON.stringify(generateWeightedPlan(mockZone, mockVehicles), null, 2));