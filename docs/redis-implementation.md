# Redis Implementation Guide for Evacuation Planning API

## Overview

This guide explains how Redis is integrated into the Evacuation Planning API to improve performance, enable real-time features, and provide analytics.

## Redis Implementation Points

### 1. Evacuation Plan Caching

**Purpose**: Cache generated evacuation plans to reduce computation time for similar requests.

**Implementation**:

- **Cache Key**: MD5 hash of zones + vehicles + options
- **TTL**: 5 minutes (300 seconds)
- **Benefits**: Significant performance improvement for repeated plan generations

**Usage**:

```typescript
// Automatic caching in EvacuationService.generateEvacuationPlan()
const result = await evacuationService.generateEvacuationPlan(vehicles, options);
// Result includes `fromCache: true` if served from cache
```

### 2. Distance Matrix Caching

**Purpose**: Cache calculated distances between zones and vehicles to avoid recalculation.

**Implementation**:

- **Cache Key**: `distance:lat1,lng1:lat2,lng2`
- **TTL**: 24 hours (distances rarely change)
- **Benefits**: Faster plan generation, reduced CPU usage

### 3. Vehicle Status Management
**Purpose**: Real-time tracking of vehicle availability and status.

**Implementation**:
- **Keys**: 
  - `vehicle:{vehicleId}:status` - Basic status
  - `vehicle_detail:{vehicleId}` - Detailed status
  - `available_vehicles` - Set of available vehicle IDs

**Usage**:
```typescript
// Update vehicle status
await vehicleStatusService.updateVehicleStatus({
  vehicleId: 'V001',
  available: false,
  currentLocation: { latitude: 13.7563, longitude: 100.5018 },
  lastUpdated: new Date()
});

// Get available vehicles
const availableVehicles = await redisService.getAvailableVehicles();
```

### 4. Rate Limiting
**Purpose**: Prevent API abuse and ensure fair usage.

**Implementation**:
- **Endpoints Protected**:
  - `/evacuations/plan` - 5 requests per minute
  - `/evacuations/stats` - 20 requests per minute
  - `/evacuations/cache` - 2 requests per 5 minutes

**Usage**:
```typescript
@UseGuards(RateLimitGuard)
@RateLimit(5, 60) // 5 requests per minute
async generateEvacuationPlan() { ... }
```

### 5. Analytics & Metrics
**Purpose**: Track API usage, performance, and system health.

**Metrics Tracked**:
- Daily plan generations: `stats:daily:{date}:plan_generated`
- Strategy usage: `stats:strategy_usage:{strategy}:{date}`
- Response times: `response_times:{endpoint}`

**Usage**:
```bash
GET /api/evacuations/stats
```

### 6. Session-based Plans
**Purpose**: Store evacuation plans per session for continuity.

**Implementation**:
- **Key**: `evacuation_plan:session:{sessionId}`
- **TTL**: 2 hours
- **Benefits**: Users can retrieve their plans, plan versioning

## Configuration

### Environment Variables
```bash
# Redis Connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0
REDIS_TTL=300

# For production
REDIS_HOST=redis
REDIS_PASSWORD=your_secure_redis_password_here
```

### Docker Setup
```yaml
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

## API Endpoints

### New Redis-enabled Endpoints

#### Get Statistics
```http
GET /api/evacuations/stats
```
Response:
```json
{
  "message": "Statistics retrieved successfully",
  "data": {
    "today": {
      "stats:daily:2025-09-08:plan_generated": "15"
    },
    "strategies": {
      "stats:strategy_usage:greedy:2025-09-08": "10",
      "stats:strategy_usage:weighted:2025-09-08": "5"
    },
    "cache": {
      "connected": true,
      "info": ["redis_version:7.0.0", "..."]
    }
  }
}
```

#### Clear Cache
```http
DELETE /api/evacuations/cache
```

#### Enhanced Health Check
```http
GET /api/health
```
Response:
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

#### Enhanced Plan Generation
```http
POST /api/evacuations/plan
```
Response now includes:
```json
{
  "data": {
    "plan": [...],
    "fromCache": false,
    "responseTimeMs": 150
  }
}
```

## Performance Benefits

### Before Redis Implementation
- Plan generation: 200-500ms
- Repeated requests: Same computation time
- No real-time vehicle tracking
- Limited analytics

### After Redis Implementation
- Cached plan retrieval: 5-15ms
- Distance lookups: 1-2ms (vs 10-20ms calculation)
- Real-time vehicle status updates
- Comprehensive usage analytics
- Rate limiting protection

## Monitoring

### Redis Commander (Development)
Access Redis web UI: `http://localhost:8081`
- Username: admin
- Password: admin123

### Key Patterns to Monitor
```bash
# Plan caches
evacuation_plan:*

# Vehicle status
vehicle:*:status
available_vehicles

# Analytics
stats:daily:*
stats:strategy_usage:*

# Rate limiting
rate_limit:*
```

## Troubleshooting

### Redis Connection Issues
1. Check Redis service status: `docker-compose ps`
2. Check Redis logs: `docker-compose logs redis`
3. Test connection: `redis-cli ping`

### Cache Miss Issues
- Plans not being cached if they take too long to generate
- Vehicle status not updating if Redis is unreachable
- System gracefully falls back to direct computation

### Performance Issues
- Monitor cache hit rates via `/api/evacuations/stats`
- Check Redis memory usage: `redis-cli info memory`
- Review rate limiting logs for blocked requests

## Best Practices

1. **Cache Keys**: Use descriptive, consistent naming patterns
2. **TTL Values**: Set appropriate expiration times based on data volatility
3. **Error Handling**: Always provide fallbacks when Redis is unavailable
4. **Monitoring**: Regularly check cache hit rates and system performance
5. **Cleanup**: Implement periodic cleanup of old analytics data

## Future Enhancements

1. **Pub/Sub**: Real-time notifications for plan updates
2. **Clustering**: Redis cluster for high availability
3. **Persistence**: RDB/AOF for data durability
4. **Advanced Analytics**: Time-series data with Redis TimeSeries
5. **Geospatial Features**: Redis geospatial commands for location-based queries
