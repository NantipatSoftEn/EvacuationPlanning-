import { calculateHaversineDistance, calculateTravelTime, formatTravelTime } from './distance.utils';

/**
 * Test and demonstrate the distance calculation utilities
 */
export function testDistanceCalculations() {
  console.log('=== Testing Distance Calculation Utilities ===\n');

  // Test coordinates (New York City locations)
  const timesSquare = { latitude: 40.7580, longitude: -73.9855 };
  const downtownManhattan = { latitude: 40.7128, longitude: -74.0060 };
  const brooklynHeights = { latitude: 40.6892, longitude: -74.0445 };
  const westSideGarage = { latitude: 40.7282, longitude: -74.0776 };

  // Test 1: Distance calculations
  console.log('1. Distance Calculations:');
  const distance1 = calculateHaversineDistance(timesSquare, downtownManhattan);
  console.log(`Times Square → Downtown Manhattan: ${distance1} km`);
  
  const distance2 = calculateHaversineDistance(timesSquare, brooklynHeights);
  console.log(`Times Square → Brooklyn Heights: ${distance2} km`);
  
  const distance3 = calculateHaversineDistance(westSideGarage, downtownManhattan);
  console.log(`West Side Garage → Downtown Manhattan: ${distance3} km`);

  // Test 2: Travel time calculations
  console.log('\n2. Travel Time Calculations:');
  
  const speeds = [30, 40, 50, 60]; // km/h
  speeds.forEach(speed => {
    const time = calculateTravelTime(distance1, speed);
    const formatted = formatTravelTime(time);
    console.log(`${distance1} km at ${speed} km/h: ${time.toFixed(2)} hours (${formatted})`);
  });

  // Test 3: Multiple vehicle scenarios
  console.log('\n3. Vehicle Assignment Scenarios:');
  
  const vehicles = [
    { id: 'bus-001', location: 'Times Square', coords: timesSquare, capacity: 50, speed: 40 },
    { id: 'van-001', location: 'West Side Garage', coords: westSideGarage, capacity: 12, speed: 45 },
    { id: 'ambulance-001', location: 'Times Square', coords: timesSquare, capacity: 4, speed: 60 }
  ];

  const evacuationSites = [
    { id: 'zone-A1', location: 'Downtown Manhattan', coords: downtownManhattan, people: 150, urgency: 5 },
    { id: 'zone-B2', location: 'Brooklyn Heights', coords: brooklynHeights, people: 80, urgency: 3 }
  ];

  evacuationSites.forEach(site => {
    console.log(`\nEvacuation Zone: ${site.location} (${site.people} people, urgency: ${site.urgency})`);
    console.log('Available vehicles:');
    
    vehicles.forEach(vehicle => {
      const distance = calculateHaversineDistance(vehicle.coords, site.coords);
      const travelTime = calculateTravelTime(distance, vehicle.speed);
      const formatted = formatTravelTime(travelTime);
      const trips = Math.ceil(site.people / vehicle.capacity);
      
      console.log(`  - ${vehicle.id} (${vehicle.location}): ${distance} km, ${formatted}, ${trips} trips needed`);
    });
  });

  return {
    distances: {
      timesSquareToDowntown: distance1,
      timesSquareToBrooklyn: distance2,
      westSideToDowntown: distance3
    },
    testResults: 'All distance calculations completed successfully'
  };
}

/**
 * Validate distance calculation accuracy
 */
export function validateDistanceAccuracy() {
  // Known distances for validation (approximate)
  const testCases = [
    {
      from: { latitude: 40.7128, longitude: -74.0060 }, // NYC
      to: { latitude: 40.7589, longitude: -73.9851 },   // Times Square
      expectedKm: 5.4, // Approximate distance
      tolerance: 1.0
    },
    {
      from: { latitude: 40.7128, longitude: -74.0060 }, // NYC
      to: { latitude: 40.6892, longitude: -74.0445 },   // Brooklyn
      expectedKm: 4.2, // Approximate distance
      tolerance: 1.0
    }
  ];

  console.log('\n=== Distance Calculation Validation ===');
  
  testCases.forEach((test, index) => {
    const calculated = calculateHaversineDistance(test.from, test.to);
    const difference = Math.abs(calculated - test.expectedKm);
    const withinTolerance = difference <= test.tolerance;
    
    console.log(`Test ${index + 1}:`);
    console.log(`  Expected: ~${test.expectedKm} km`);
    console.log(`  Calculated: ${calculated} km`);
    console.log(`  Difference: ${difference.toFixed(2)} km`);
    console.log(`  Within tolerance: ${withinTolerance ? '✓' : '✗'}`);
  });
}
