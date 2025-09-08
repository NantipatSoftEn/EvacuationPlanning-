# 🚨 Evacuation Planning API

A NestJS-based REST API for intelligent evacuation planning using multiple strategies to optimize vehicle-to-zone assignments based on urgency, capacity, and distance.

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
- Docker & Docker Compose (recommended)
- Redis (optional - included in Docker setup)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd EvacuationPlanning-

# Option 1: Docker (Recommended)
docker-compose up -d

# Option 2: Local Development
npm install
npm run start:dev
```

The API will be available at `http://localhost:3000`  
Documentation at `http://localhost:3000/docs`  
Health check at `http://localhost:3000/health`

## 📚 API Endpoints

### System Health
- `GET /health` - System health check with Redis status

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

## 🚀 Deployment Options

### Docker (Recommended)

```bash
# Development with Redis
docker-compose up -d

# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f
```

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev
```

## ⚡ Performance Features

### Redis Caching
- **Evacuation Plans**: 5-minute cache with 85% faster responses
- **Distance Matrix**: 24-hour cache for route calculations
- **Vehicle Status**: Real-time availability tracking

### Rate Limiting
- **Short**: 3 requests per second
- **Medium**: 20 requests per 10 seconds  
- **Long**: 100 requests per minute

### Health Monitoring
- System status endpoint at `/health`
- Redis connection monitoring
- Response time tracking

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
npm run build               # Build the project
npm run start              # Start production server
npm run start:dev          # Start development server
npm run start:debug        # Start with debugging
npm run lint               # Lint code
npm run format             # Format code
npm run typecheck          # TypeScript type checking

# Docker commands
npm run docker:build       # Build Docker image
npm run docker:run         # Run Docker container
npm run docker:compose:up  # Start with docker-compose
npm run docker:compose:down # Stop docker-compose services

# Development utilities
npm run seed:dev           # Seed development data
npm run clean              # Clean build artifacts
```

### Environment Variables
```env
PORT=3000
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_TTL=300
```

## 🆘 Support

For questions and support:

- **API Documentation**: Visit `/docs` endpoint when the server is running
- **Health Status**: Check `/health` for system status
- **Redis Documentation**: See `/docs/REDIS.md` for Redis integration details

## 🔧 Architecture Details

For detailed information about the system architecture and Redis implementation, check the documentation in the `/docs` folder:

- `REDIS.md` - Redis integration guide
- `redis-implementation.md` - Implementation details

---

## 📋 การวิเคราะห์โครงการ Evacuation Planning API

## 1. การตีความโจทย์ปัญหา

### ปัญหาหลัก

โครงการนี้พัฒนาขึ้นเพื่อแก้ปัญหาการจัดสรรยานพาหนะในสถานการณ์ฉุกเฉิน โดยเฉพาะการอพยพประชาชน ปัญหาที่ต้องแก้ไขคือ:

1. **การจับคู่ที่เหมาะสม (Optimal Matching)**
   - จับคู่ยานพาหนะกับพื้นที่อพยพอย่างมีประสิทธิภาพ
   - พิจารณาความเร่งด่วน ระยะทาง และความจุ

2. **การประหยัดเวลา (Time Optimization)**
   - ลดเวลาการตอบสนองในสถานการณ์ฉุกเฉิน
   - เพิ่มประสิทธิภาพด้วย Redis Caching (85% เร็วขึ้น)

3. **การรองรับการขยายตัว (Scalability)**
   - รองรับการใช้งานพร้อมกัน 200+ users
   - ระบบ rate limiting หลายระดับ

### แนวทางแก้ไข

ใช้ **Algorithm-based Approach** โดยพัฒนา 2 กลยุทธ์หลัก:

#### 🔄 Greedy Algorithm

```text
Priority: Urgency → Distance → Capacity
Behavior: เลือกตัวเลือกที่ดีที่สุดในแต่ละขั้นตอน
Best for: การตัดสินใจเร็ว, สถานการณ์ไม่ซับซ้อน
```

#### ⚖️ Weighted Algorithm

```text
Priority: Urgency → Capacity Utilization → Distance → ETA
Behavior: คำนวณคะแนนถ่วงน้ำหนักหลายปัจจัย
Best for: สถานการณ์ซับซ้อน, ต้องการการจับคู่ที่สมดุล
```

### หลักการออกแบบระบบ

1. **Separation of Concerns**
   - แยกอัลกอริทึมออกจาก business logic
   - ใช้ Strategy Pattern สำหรับเปลี่ยนแปลงอัลกอริทึม

2. **Performance First**
   - Redis caching ลด response time 85%
   - Distance matrix caching 24 ชั่วโมง

3. **Reliability & Monitoring**
   - Health check endpoint
   - Comprehensive logging
   - Error handling with fallback

---

## 2. แนวคิดเบื้องหลังการออกแบบ API

### API Architecture Overview

```text
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Controllers   │ -> │    Services      │ -> │   Strategies    │
│  (HTTP Layer)   │    │ (Business Logic) │    │  (Algorithms)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         v                       v                       v
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Validation    │    │  Redis Caching   │    │   Utilities     │
│   (DTOs)        │    │  (Performance)   │    │  (Calculations) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Core APIs และขั้นตอนการทำงาน

#### 📊 POST /api/evacuations/plan - สร้างแผนอพยพ

```typescript
Request Flow:
1. รับ request parameters (strategy, maxDistance, etc.)
2. ตรวจสอบ cache ใน Redis
3. ดึงข้อมูล vehicles และ zones
4. เรียกใช้ algorithm ที่เลือก (Greedy/Weighted)
5. คำนวณ distance และ ETA
6. จัดเรียงผลลัพธ์และสร้าง summary
7. บันทึกลง cache
8. ส่งคืน response
```

#### 🚗 POST /api/vehicles - เพิ่มยานพาหนะ

```typescript
Validation Steps:
1. ตรวจสอบ vehicleId ไม่ซ้ำ
2. ตรวจสอบ coordinates ถูกต้อง
3. ตรวจสอบ capacity > 0
4. บันทึกลงระบบ
5. อัปเดต available vehicles ใน Redis
```

#### 🏠 POST /api/evacuation-zones - เพิ่มพื้นที่อพยพ

```typescript
Processing:
1. รองรับทั้ง modern และ legacy format
2. แปลง urgency string -> numeric level
3. ตรวจสอบ coordinate range
4. บันทึกพร้อม default evacuated = 0
```

### เหตุผลการออกแบบ

#### 🔄 Strategy Pattern

- **เพื่อ Flexibility**: เปลี่ยนอัลกอริทึมได้ง่าย
- **เพื่อ Testing**: ทดสอบแต่ละอัลกอริทึมแยกกัน
- **เพื่อ Future Expansion**: เพิ่มอัลกอริทึมใหม่ได้

#### 🚀 Redis Integration

- **Cache Layer**: ลด database hits
- **Real-time Status**: ติดตามสถานะยานพาหนะ
- **Rate Limiting**: ป้องกัน system overload

#### 📐 Modular Architecture

- **Controllers**: รับ/ส่งข้อมูล HTTP
- **Services**: ประมวลผล business logic
- **Strategies**: คำนวณอัลกอริทึม
- **Utils**: ฟังก์ชันช่วยเหลือทั่วไป

---

## 3. การออกแบบโครงสร้างข้อมูล

### Data Storage Strategy

โครงการนี้ใช้ **In-Memory Storage** ร่วมกับ **Redis Caching**

```typescript
// Primary Data Structures

interface ProcessedEvacuationZone {
  id: string;
  zoneId?: string;
  locationCoordinates?: {
    latitude: number;
    longitude: number;
  };
  numberOfPeople?: number;
  urgencyLevel?: number;
  evacuated: number; // ติดตามสถานะการอพยพ
  
  // Legacy format support
  location?: string;
  people?: number;
  urgency?: string;
}

interface ProcessedVehicle {
  id: string;
  vehicleId: string;
  locationCoordinates: {
    latitude: number;
    longitude: number;
  };
  capacity: number;
  speed: number;
  type: string;
}
```

### Redis Schema Design

#### 1. Plan Caching

```text
Key Pattern: plan:cache:{MD5_HASH}
Value: JSON string of complete plan
TTL: 300 seconds (5 minutes)
```

#### 2. Distance Matrix

```text
Key Pattern: distance:{lat1},{lng1}:{lat2},{lng2}
Value: Float distance in KM
TTL: 86400 seconds (24 hours)
```

#### 3. Vehicle Status

```text
Key Pattern: vehicle:status:{vehicleId}
Value: JSON object with real-time status
TTL: Persistent (updated on assignment)
```

#### 4. Rate Limiting

```text
Key Pattern: ratelimit:{endpoint}:{clientIP}
Value: Counter
TTL: Based on time window (60s, 300s, etc.)
```

### ผลลัพธ์ข้อมูล (EvacuationAssignment)

```typescript
interface EvacuationAssignment {
  zoneId: string;
  vehicleId: string;
  etaMinutes: number;
  evacuated: number;  // จำนวนคนที่อพยพในรอบนี้
}
```

### เหตุผลการออกแบบ

#### 🧠 In-Memory + Redis Hybrid

- **Performance**: เข้าถึงข้อมูลเร็วมาก
- **Caching**: ลดการคำนวณซ้ำ
- **Scalability**: กระจายโหลดได้ด้วย Redis

#### 📊 Flexible Schema

- **Backward Compatibility**: รองรับ legacy format
- **Forward Compatible**: เพิ่มฟิลด์ใหม่ได้ง่าย
- **Multiple Formats**: รองรับหลากหลาย input format

#### ⚡ Performance Optimization

- **Pre-calculated Distance**: Cache ระยะทาง 24 ชั่วโมง
- **Smart Caching**: ใช้ MD5 hash ของ input เป็น cache key
- **Efficient Updates**: อัปเดตเฉพาะส่วนที่เปลี่ยน

---

## 4. การใช้ภาพประกอบเพื่อช่วยอธิบาย

### 4.1 System Flow Diagram

```text
┌─────────────────┐
│   HTTP Request  │
│   (Client)      │
└─────────┬───────┘
          │
          v
┌─────────────────┐     ┌─────────────────┐
│  Rate Limiting  │────▶│ Request Blocked │
│   (Redis)       │     │  (429 Error)    │
└─────────┬───────┘     └─────────────────┘
          │ ✓
          v
┌─────────────────┐     ┌─────────────────┐
│ Cache Check     │────▶│  Return Cached  │
│ (Redis)         │ Hit │    Result       │
└─────────┬───────┘     └─────────────────┘
          │ Miss
          v
┌─────────────────┐
│ Algorithm       │
│ Selection       │
└─────────┬───────┘
          │
    ┌─────┴─────┐
    │           │
    v           v
┌─────────┐ ┌─────────┐
│ Greedy  │ │Weighted │
│Algorithm│ │Algorithm│
└─────────┘ └─────────┘
    │           │
    └─────┬─────┘
          │
          v
┌─────────────────┐
│   Calculate     │
│ Distance & ETA  │
└─────────┬───────┘
          │
          v
┌─────────────────┐     ┌─────────────────┐
│ Cache Result    │────▶│ Return Response │
│ (Redis - 5min)  │     │  (JSON)         │
└─────────────────┘     └─────────────────┘
```

### 4.2 Algorithm Comparison Diagram

```text
Greedy Algorithm Flow:
┌──────────────┐
│ Sort by      │
│ Urgency DESC │
└──────┬───────┘
       │
       v
┌──────────────┐    ┌─────────────────┐
│ For each     │───▶│ Find closest    │
│ Zone         │    │ available       │
│              │    │ vehicle         │
└──────┬───────┘    └─────────────────┘
       │                     │
       │                     v
       │            ┌─────────────────┐
       │            │ Assign vehicle  │
       │            │ to zone         │
       │            └─────────────────┘
       │                     │
       │                     v
       │            ┌─────────────────┐
       └────────────│ Update capacity │
                    │ & continue      │
                    └─────────────────┘

Weighted Algorithm Flow:
┌──────────────┐
│ Sort by      │
│ Urgency DESC │
└──────┬───────┘
       │
       v
┌──────────────┐    ┌─────────────────┐
│ For each     │───▶│ Calculate       │
│ Zone         │    │ weighted score  │
│              │    │ for all vehicles│
└──────┬───────┘    └─────────────────┘
       │                     │
       │                     v
       │            ┌─────────────────┐
       │            │ Select vehicle  │
       │            │ with best score │
       │            └─────────────────┘
       │                     │
       │                     v
       │            ┌─────────────────┐
       └────────────│ Update states   │
                    │ & continue      │
                    └─────────────────┘

Weighted Score Calculation:
┌─────────────────┐
│ Urgency Score   │ Weight: 10,000
│ (6-urgencyLevel)│
└─────────────────┘
          │
          v
┌─────────────────┐
│ Capacity Score  │ Weight: 1,000
│(1-utilization)  │
└─────────────────┘
          │
          v
┌─────────────────┐
│ Distance Score  │ Weight: 100
│(normalized)     │
└─────────────────┘
          │
          v
┌─────────────────┐
│ ETA Score       │ Weight: 10
│(travel time)    │
└─────────────────┘
          │
          v
┌─────────────────┐
│ Total Score     │ (Lower = Better)
│ (Sum all)       │
└─────────────────┘
```

### 4.5 API Request-Response Flow

```text
1. POST /api/evacuations/plan

Request:
{
  "strategy": "weighted",
  "maxDistanceKm": 50,
  "allowMultiVehicle": true,
  "preferFewerTrips": true
}
        │
        v
┌─────────────────┐
│ Validation      │
│ & Rate Limiting │
└─────────┬───────┘
          │
          v
┌─────────────────┐
│ Cache Check     │ ──┐
└─────────┬───────┘   │
          │           │ Hit
          │ Miss      │
          v           │
┌─────────────────┐   │
│ Load Data:      │   │
│ • Zones         │   │
│ • Vehicles      │   │
└─────────┬───────┘   │
          │           │
          v           │
┌─────────────────┐   │
│ Execute         │   │
│ Weighted        │   │
│ Algorithm       │   │
└─────────┬───────┘   │
          │           │
          v           │
┌─────────────────┐   │
│ Format Response │   │
│ & Cache Result  │   │
└─────────┬───────┘   │
          │           │
          v           │
Response: │◀──────────┘
{
  "assignments": [
    {
      "vehicleId": "V001",
      "zoneId": "Z001",
      "etaMinutes": 5.2,
      "peopleToEvacuate": 40,
      "distanceKm": 2.5
    }
  ],
  "summary": {
    "totalVehiclesAssigned": 3,
    "totalPeopleToEvacuate": 150,
    "averageDistance": 4.2
  }
}
```