# 🚨 Evacuation Planning API

A NestJS-based REST API for intelligent evacuation planning using multiple strategies to optimize vehicle-to-zone assignments based on urgency, capacity, and distance.

## 🌟 Features

- **Multiple Planning Strategies**: Greedy and Weighted algorithms
- **Real-time Plan Generation**: Dynamic vehicle and zone management
- **Flexible Input Formats**: Support both legacy and new coordinate-based formats
- **Comprehensive Validation**: Input validation with detailed error messages
- **API Documentation**: Auto-generated Swagger documentation
- **Test Coverage**: Comprehensive unit tests for all strategies

## 🏗️ Architecture

```
src/
├── common/
│   ├── mocks/                 # Mock data for testing
│   ├── strategies/           # Planning algorithms
│   ├── types/               # TypeScript interfaces
│   └── utils/               # Utility functions
├── modules/
│   ├── evacuation/          # Evacuation planning logic
│   └── vehicle/            # Vehicle management
└── main.ts                 # Application entry point
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd EvacuationPlanning-

# Install dependencies
npm install

# Start development server
npm run start:dev
```

The API will be available at `http://localhost:3000`
Documentation at `http://localhost:3000/docs`

## 📚 API Endpoints

### Vehicle Management
- `POST /api/vehicles` - Add a new vehicle
- `GET /api/vehicles` - Get all vehicles

### Evacuation Zones
- `POST /api/evacuation-zones` - Add evacuation zone
- `GET /api/evacuation-zones` - Get all zones

### Evacuation Planning
- `POST /api/evacuations/plan` - Generate evacuation plan
- `GET /api/evacuations/status` - Get evacuation status
- `PUT /api/evacuations/update` - Update evacuation progress
- `DELETE /api/evacuations/clear` - Clear all plans

## 🔧 Usage Examples

### Adding a Vehicle
```json
POST /api/vehicles
{
  "vehicleId": "V001",
  "capacity": 40,
  "type": "bus",
  "locationCoordinates": {
    "latitude": 13.7563,
    "longitude": 100.5018
  },
  "speed": 60
}
```

### Adding an Evacuation Zone
```json
POST /api/evacuation-zones
{
  "zoneId": "Z001",
  "locationCoordinates": {
    "latitude": 13.7500,
    "longitude": 100.4900
  },
  "numberOfPeople": 150,
  "urgencyLevel": 5
}
```

### Generating Evacuation Plan
```json
POST /api/evacuations/plan
{
  "strategy": "weighted",
  "maxDistanceKm": 50,
  "allowMultiVehicle": true,
  "preferFewerTrips": true,
  "speedFallbackKmh": 40
}
```

## 🧮 Planning Strategies

### Greedy Algorithm
- **Priority**: Urgency → Distance → Capacity
- **Behavior**: Makes locally optimal choices
- **Best for**: Quick decisions, simple scenarios

### Weighted Algorithm  
- **Priority**: Urgency → Capacity Utilization → Distance → ETA
- **Behavior**: Considers multiple factors with weights
- **Best for**: Complex scenarios requiring balanced optimization

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov

# Run e2e tests
npm run test:e2e
```

## 📊 Data Formats

The API supports both legacy and modern coordinate-based formats:

### Modern Format (Recommended)
```json
{
  "locationCoordinates": { "latitude": 13.7563, "longitude": 100.5018 },
  "numberOfPeople": 100,
  "urgencyLevel": 4
}
```

### Legacy Format (Backward Compatible)
```json
{
  "location": "13.7563,100.5018",
  "people": 100,
  "urgency": "high"
}
```

## 🔍 Response Example

```json
{
  "assignments": [
    {
      "vehicleId": "V001",
      "vehicleType": "bus",
      "assignedZone": "Emergency Zone A",
      "zoneId": "Z001",
      "urgencyLevel": 5,
      "peopleToEvacuate": 40,
      "distanceKm": 2.5,
      "travelTimeMinutes": 5.2,
      "eta": "14:25"
    }
  ],
  "summary": {
    "totalVehiclesAssigned": 3,
    "totalPeopleToEvacuate": 150,
    "averageDistance": 4.2,
    "zonesFullyCovered": 2
  }
}
```

## 🛠️ Development

### Project Scripts
```bash
npm run build          # Build the project
npm run start          # Start production server
npm run start:dev      # Start development server
npm run lint           # Lint code
npm run format         # Format code
```

### Environment Variables
```env
PORT=3000
NODE_ENV=development
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the UNLICENSED License.

## 🆘 Support

For questions and support, please refer to the API documentation at `/docs` endpoint when the server is running.

---

**Made with ❤️ using NestJS**