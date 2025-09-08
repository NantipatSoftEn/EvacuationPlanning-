import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import * as crypto from 'crypto';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private readonly logger = new Logger(RedisService.name);
  private readonly isRedisEnabled: boolean;

  constructor() {
    this.isRedisEnabled = process.env.REDIS_ENABLED === 'true';
    
    if (!this.isRedisEnabled) {
      this.logger.log('Redis is disabled via REDIS_ENABLED environment variable');
      return;
    }

    let redisConfig: any;

    // For Azure Redis Cache with authentication
    if (process.env.REDIS_PASSWORD && process.env.REDIS_TLS === 'true') {
      redisConfig = {
        url: `rediss://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
        database: parseInt(process.env.REDIS_DB || '0'),
        socket: {
          tls: true,
          rejectUnauthorized: false,
        },
      };
      console.log('Using Azure Redis Cache configuration', redisConfig);
    } else {
      // Build Redis URL based on whether we have authentication
      const host = process.env.REDIS_HOST || 'localhost';
      const port = process.env.REDIS_PORT || '6379';
      const tls = process.env.REDIS_TLS === 'true';
      const protocol = tls ? 'rediss' : 'redis';
      
      if (process.env.REDIS_PASSWORD) {
        // With authentication
        const username = process.env.REDIS_USERNAME || 'default';
        redisConfig = {
          url: `${protocol}://${username}:${process.env.REDIS_PASSWORD}@${host}:${port}`,
          database: parseInt(process.env.REDIS_DB || '0'),
        };
      } else {
        // Without authentication - for local Redis
        redisConfig = {
          url: `${protocol}://${host}:${port}`,
          database: parseInt(process.env.REDIS_DB || '0'),
        };
      }

      // Add TLS configuration if needed
      if (tls) {
        redisConfig.socket = {
          tls: true,
          rejectUnauthorized: false,
        };
      }
    }

    this.client = createClient(redisConfig);
    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis Client Connected');
    });
  }

  async onModuleInit() {
    if (this.isRedisEnabled && this.client) {
      await this.client.connect();
    }
  }

  async onModuleDestroy() {
    if (this.isRedisEnabled && this.client) {
      await this.client.disconnect();
    }
  }

  // Generic cache methods
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.isRedisEnabled) {
      return;
    }
    
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isRedisEnabled) {
      return null;
    }
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Failed to get key ${key}:`, error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isRedisEnabled) {
      return;
    }
    
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isRedisEnabled) {
      return false;
    }
    
    return (await this.client.exists(key)) === 1;
  }

  // Evacuation Plan specific methods
  generatePlanCacheKey(zones: any[], vehicles: any[], options: any): string {
    const data = { zones, vehicles, options };
    return `evacuation_plan:${crypto.createHash('md5').update(JSON.stringify(data)).digest('hex')}`;
  }

  async cachePlan(zones: any[], vehicles: any[], options: any, plan: any): Promise<void> {
    if (!this.isRedisEnabled) {
      return;
    }
    
    const key = this.generatePlanCacheKey(zones, vehicles, options);
    const ttl = parseInt(process.env.REDIS_TTL || '300'); // 5 minutes default
    await this.set(key, { plan, cachedAt: new Date() }, ttl);
  }

  async getCachedPlan(zones: any[], vehicles: any[], options: any): Promise<any | null> {
    if (!this.isRedisEnabled) {
      return null;
    }
    
    const key = this.generatePlanCacheKey(zones, vehicles, options);
    return await this.get(key);
  }

  // Vehicle availability methods
  async setVehicleStatus(vehicleId: string, status: {
    available: boolean;
    currentLocation?: { latitude: number; longitude: number };
    lastUpdated?: Date;
  }): Promise<void> {
    if (!this.isRedisEnabled) {
      return;
    }
    
    const key = `vehicle:${vehicleId}:status`;
    await this.set(key, { ...status, lastUpdated: new Date() });
    
    // Update available vehicles set
    if (status.available) {
      await this.client.sAdd('available_vehicles', vehicleId);
    } else {
      await this.client.sRem('available_vehicles', vehicleId);
    }
  }

  async getVehicleStatus(vehicleId: string): Promise<any | null> {
    if (!this.isRedisEnabled) {
      return null;
    }
    
    const key = `vehicle:${vehicleId}:status`;
    return await this.get(key);
  }

  async getAvailableVehicles(): Promise<string[]> {
    if (!this.isRedisEnabled) {
      return [];
    }
    
    return await this.client.sMembers('available_vehicles');
  }

  // Session-based plans
  async setSessionPlan(sessionId: string, plan: any): Promise<void> {
    if (!this.isRedisEnabled) {
      return;
    }
    
    const key = `evacuation_plan:session:${sessionId}`;
    const ttl = 2 * 60 * 60; // 2 hours
    await this.set(key, plan, ttl);
  }

  async getSessionPlan(sessionId: string): Promise<any | null> {
    if (!this.isRedisEnabled) {
      return null;
    }
    
    const key = `evacuation_plan:session:${sessionId}`;
    return await this.get(key);
  }

  // Distance caching
  async cacheDistance(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number },
    distance: number,
    travelTime: number
  ): Promise<void> {
    if (!this.isRedisEnabled) {
      return;
    }
    
    const key = `distance:${from.latitude},${from.longitude}:${to.latitude},${to.longitude}`;
    const ttl = 24 * 60 * 60; // 24 hours
    await this.set(key, { distance, travelTime }, ttl);
  }

  async getCachedDistance(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): Promise<{ distance: number; travelTime: number } | null> {
    if (!this.isRedisEnabled) {
      return null;
    }
    
    const key = `distance:${from.latitude},${from.longitude}:${to.latitude},${to.longitude}`;
    return await this.get(key);
  }

  // Rate limiting
  async checkRateLimit(identifier: string, endpoint: string, maxRequests: number = 10, windowSeconds: number = 60): Promise<boolean> {
    if (!this.isRedisEnabled) {
      return true; // Allow all requests when Redis is disabled
    }
    
    const key = `rate_limit:${identifier}:${endpoint}`;
    const current = await this.client.incr(key);
    
    if (current === 1) {
      await this.client.expire(key, windowSeconds);
    }
    
    return current <= maxRequests;
  }

  // Analytics
  async incrementCounter(key: string): Promise<void> {
    if (!this.isRedisEnabled) {
      return;
    }
    
    await this.client.incr(key);
  }

  async trackResponseTime(endpoint: string, responseTime: number): Promise<void> {
    if (!this.isRedisEnabled) {
      return;
    }
    
    const key = `response_times:${endpoint}`;
    await this.client.lPush(key, responseTime.toString());
    await this.client.lTrim(key, 0, 999); // Keep last 1000 entries
  }

  async getStats(pattern: string): Promise<Record<string, string>> {
    if (!this.isRedisEnabled) {
      return {};
    }
    
    const keys = await this.client.keys(pattern);
    const stats: Record<string, string> = {};
    
    for (const key of keys) {
      stats[key] = await this.client.get(key) || '0';
    }
    
    return stats;
  }

  // Utility methods
  async flush(): Promise<void> {
    if (!this.isRedisEnabled) {
      return;
    }
    
    await this.client.flushAll();
  }

  async info(): Promise<string> {
    if (!this.isRedisEnabled) {
      return 'Redis is disabled';
    }
    
    return await this.client.info();
  }
}
