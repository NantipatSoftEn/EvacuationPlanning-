# Input Examples for Evacuation Planning System

## Evacuation Zone Input

### New Structured Format
```json
{
  "zoneId": "ZONE_001",
  "locationCoordinates": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "numberOfPeople": 150,
  "urgencyLevel": 4
}
```

### Legacy Format (Still Supported)
```json
{
  "location": "Downtown Area",
  "people": 150,
  "urgency": "high"
}
```

## Vehicle Input

### New Structured Format
```json
{
  "vehicleId": "BUS_001",
  "capacity": 50,
  "type": "bus",
  "locationCoordinates": {
    "latitude": 40.7589,
    "longitude": -73.9851
  },
  "speed": 45
}
```

### Legacy Format (Still Supported)
```json
{
  "capacity": 50,
  "type": "bus",
  "location": "Central Station"
}
```

## Input Data Specifications

### Evacuation Zones
- **Zone ID**: Unique identifier for the evacuation zone (optional, auto-generated if not provided)
- **Location Coordinates**: Latitude and longitude of the zone
  - Latitude: Valid latitude coordinate (-90 to 90)
  - Longitude: Valid longitude coordinate (-180 to 180)
- **Number of People**: Total number of people needing evacuation (must be > 0)
- **Urgency Level**: Integer from 1 to 5
  - 1 = Low urgency
  - 2 = Low urgency
  - 3 = Medium urgency
  - 4 = High urgency
  - 5 = High urgency

### Vehicles
- **Vehicle ID**: Unique identifier for each vehicle (optional, auto-generated if not provided)
- **Capacity**: Number of people the vehicle can transport in one trip (must be > 0)
- **Type**: Type of vehicle (must be one of: 'bus', 'van', 'boat')
- **Location Coordinates**: Latitude and longitude of the vehicle's current location
- **Speed**: Average speed of the vehicle in km/h (must be > 0)

## API Usage Examples

### Adding an Evacuation Zone (POST /evacuation/zones)
```bash
curl -X POST http://localhost:3000/evacuation/zones \
  -H "Content-Type: application/json" \
  -d '{
    "zoneId": "ZONE_001",
    "locationCoordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "numberOfPeople": 150,
    "urgencyLevel": 4
  }'
```

### Adding a Vehicle (POST /vehicles)
```bash
curl -X POST http://localhost:3000/vehicles \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "BUS_001",
    "capacity": 50,
    "type": "bus",
    "locationCoordinates": {
      "latitude": 40.7589,
      "longitude": -73.9851
    },
    "speed": 45
  }'
```

## Validation Rules

### Evacuation Zone Validation
- Either new format (locationCoordinates, numberOfPeople, urgencyLevel) OR legacy format (location, people, urgency) must be provided
- Urgency level must be between 1 and 5
- Number of people must be greater than 0
- Valid latitude and longitude coordinates are required for new format

### Vehicle Validation
- Either new format (locationCoordinates, speed) OR legacy format (location) must be provided
- Vehicle capacity must be greater than 0
- Vehicle type must be 'bus', 'van', or 'boat'
- Speed must be greater than 0 (for new format)
- Valid latitude and longitude coordinates are required for new format

## Response Examples

### Evacuation Plan Response
```json
{
  "plan": [
    {
      "vehicleId": "BUS_001",
      "assignedZone": "40.7128,-74.0060",
      "priority": 2,
      "capacity": 50,
      "peopleToEvacuate": 50,
      "zoneDetails": {
        "zoneId": "ZONE_001",
        "coordinates": {
          "latitude": 40.7128,
          "longitude": -74.0060
        },
        "urgencyLevel": 4
      }
    }
  ],
  "summary": {
    "totalVehicles": 1,
    "totalPeopleToEvacuate": 50,
    "highPriorityZones": 1
  }
}
```
