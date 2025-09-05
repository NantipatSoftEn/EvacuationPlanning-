// เวลาที่ใช้ (ชั่วโมง → นาที)
export function estimateTravelTime(distanceKm: number, speedKmh: number): number {
    if (speedKmh <= 0) return Infinity;
    return (distanceKm / speedKmh) * 60;
}