/**
 * Utility functions for distance and time calculations in evacuation planning
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two points using Haversine formula
 * @param point1 First coordinate point
 * @param point2 Second coordinate point
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  
  // Convert degrees to radians
  const lat1Rad = toRadians(point1.latitude);
  const lon1Rad = toRadians(point1.longitude);
  const lat2Rad = toRadians(point2.latitude);
  const lon2Rad = toRadians(point2.longitude);

  // Differences
  const deltaLat = lat2Rad - lat1Rad;
  const deltaLon = lon2Rad - lon1Rad;

  // Haversine formula
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Distance in kilometers
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate estimated travel time
 * @param distanceKm Distance in kilometers
 * @param speedKmh Speed in km/h
 * @returns Time in hours
 */
export function calculateTravelTime(distanceKm: number, speedKmh: number): number {
  if (speedKmh <= 0) {
    throw new Error('Speed must be greater than 0');
  }
  return Math.round((distanceKm / speedKmh) * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate estimated travel time in minutes
 * @param distanceKm Distance in kilometers
 * @param speedKmh Speed in km/h
 * @returns Time in minutes
 */
export function calculateTravelTimeMinutes(distanceKm: number, speedKmh: number): number {
  const timeHours = calculateTravelTime(distanceKm, speedKmh);
  return Math.round(timeHours * 60); // Convert to minutes and round
}

/**
 * Convert degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format travel time for display
 * @param hours Time in hours
 * @returns Formatted string (e.g., "1h 30m" or "45m")
 */
export function formatTravelTime(hours: number): string {
  if (hours >= 1) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const minutes = Math.round(hours * 60);
  return `${minutes}m`;
}

/**
 * Calculate ETA (Estimated Time of Arrival) from current time
 * @param hours Travel time in hours
 * @returns ISO date string of ETA
 */
export function calculateETA(hours: number): string {
  const now = new Date();
  const eta = new Date(now.getTime() + hours * 60 * 60 * 1000);
  return eta.toISOString();
}
