# Redis Quick Test Guide

## Start Services
```bash
# Development mode with Redis
docker-compose up -d

# Check services
docker-compose ps
```

## Test Redis Integration

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```
Expected response:
```json
{
  "message": "Service is healthy and running",
  "data": {
    "status": "ok",
    "services": {
      "api": { "status": "up", "responseTime": 5 },
      "redis": { "status": "up", "connected": true, "latency": 2 }
    }
  }
}
```

### 2. Generate Evacuation Plan (First Time)
```bash
curl -X POST http://localhost:3000/api/evacuations/plan \
  -H "Content-Type: application/json" \
  -d '{
    "zones": [
      {
        "id": "ZONE001",
        "name": "Downtown Area",
        "priority": "HIGH",
        "estimatedPopulation": 5000,
        "location": {
          "latitude": 13.7563,
          "longitude": 100.5018
        }
      }
    ],
    "options": {
      "strategy": "greedy",
      "maxDistance": 50
    }
  }'
```

### 3. Generate Same Plan Again (From Cache)
Run the same command again. Response should include:
```json
{
  "data": {
    "fromCache": true,
    "responseTimeMs": 15
  }
}
```

### 4. Check Statistics
```bash
curl http://localhost:3000/api/evacuations/stats
```

### 5. Vehicle Status Test
```bash
# Update vehicle status
curl -X PUT http://localhost:3000/api/vehicles/V001/status \
  -H "Content-Type: application/json" \
  -d '{
    "available": false,
    "currentLocation": {
      "latitude": 13.7563,
      "longitude": 100.5018
    }
  }'

# Check vehicle status
curl http://localhost:3000/api/vehicles/V001/status
```

## Redis Web UI Access
- Open: http://localhost:8081
- Username: admin  
- Password: admin123

Check these keys:
- `evacuation_plan:*` (cached plans)
- `vehicle:*:status` (vehicle status)
- `stats:daily:*` (daily statistics)
- `distance:*` (cached distances)

## Performance Test
```bash
# Install Apache Bench (if not installed)
brew install httpie  # macOS
# or
apt-get install apache2-utils  # Linux

# Test plan generation performance
ab -n 10 -c 2 -T application/json -p plan.json http://localhost:3000/api/evacuations/plan
```

Create `plan.json`:
```json
{
  "zones": [
    {
      "id": "ZONE001",
      "name": "Test Zone",
      "priority": "HIGH", 
      "estimatedPopulation": 1000,
      "location": {
        "latitude": 13.7563,
        "longitude": 100.5018
      }
    }
  ],
  "options": {
    "strategy": "greedy",
    "maxDistance": 50
  }
}
```

## Expected Results
- First request: 200-500ms (fresh calculation)
- Cached requests: 5-15ms (85% improvement)
- Redis health check: Connected with low latency
- Vehicle status updates: Real-time tracking
- Statistics: Daily counters increment

## Troubleshooting
If Redis connection fails:
```bash
# Check Redis container
docker-compose logs redis

# Restart if needed
docker-compose restart redis

# Manual Redis test
redis-cli -h localhost -p 6379 ping
```

ระบบ Redis พร้อมใช้งานแล้ว! 🚀
