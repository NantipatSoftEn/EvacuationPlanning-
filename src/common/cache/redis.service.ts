import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import * as crypto from 'crypto';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    this.client = createClient({
    //   url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
      password: process.env.REDIS_PASSWORD,
      database: parseInt(process.env.REDIS_DB || '0'),
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis Client Connected');
    });
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.disconnect();
  }

  // Generic cache methods
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Failed to get key ${key}:`, error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  // Evacuation Plan specific methods
  generatePlanCacheKey(zones: any[], vehicles: any[], options: any): string {
    const data = { zones, vehicles, options };
    return `evacuation_plan:${crypto.createHash('md5').update(JSON.stringify(data)).digest('hex')}`;
  }

  async cachePlan(zones: any[], vehicles: any[], options: any, plan: any): Promise<void> {
    const key = this.generatePlanCacheKey(zones, vehicles, options);
    const ttl = parseInt(process.env.REDIS_TTL || '300'); // 5 minutes default
    await this.set(key, { plan, cachedAt: new Date() }, ttl);
  }

  async getCachedPlan(zones: any[], vehicles: any[], options: any): Promise<any | null> {
    const key = this.generatePlanCacheKey(zones, vehicles, options);
    return await this.get(key);
  }

  // Vehicle availability methods
  async setVehicleStatus(vehicleId: string, status: {
    available: boolean;
    currentLocation?: { latitude: number; longitude: number };
    lastUpdated?: Date;
  }): Promise<void> {
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
    const key = `vehicle:${vehicleId}:status`;
    return await this.get(key);
  }

  async getAvailableVehicles(): Promise<string[]> {
    return await this.client.sMembers('available_vehicles');
  }

  // Session-based plans
  async setSessionPlan(sessionId: string, plan: any): Promise<void> {
    const key = `evacuation_plan:session:${sessionId}`;
    const ttl = 2 * 60 * 60; // 2 hours
    await this.set(key, plan, ttl);
  }

  async getSessionPlan(sessionId: string): Promise<any | null> {
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
    const key = `distance:${from.latitude},${from.longitude}:${to.latitude},${to.longitude}`;
    const ttl = 24 * 60 * 60; // 24 hours
    await this.set(key, { distance, travelTime }, ttl);
  }

  async getCachedDistance(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): Promise<{ distance: number; travelTime: number } | null> {
    const key = `distance:${from.latitude},${from.longitude}:${to.latitude},${to.longitude}`;
    return await this.get(key);
  }

  // Rate limiting
  async checkRateLimit(identifier: string, endpoint: string, maxRequests: number = 10, windowSeconds: number = 60): Promise<boolean> {
    const key = `rate_limit:${identifier}:${endpoint}`;
    const current = await this.client.incr(key);
    
    if (current === 1) {
      await this.client.expire(key, windowSeconds);
    }
    
    return current <= maxRequests;
  }

  // Analytics
  async incrementCounter(key: string): Promise<void> {
    await this.client.incr(key);
  }

  async trackResponseTime(endpoint: string, responseTime: number): Promise<void> {
    const key = `response_times:${endpoint}`;
    await this.client.lPush(key, responseTime.toString());
    await this.client.lTrim(key, 0, 999); // Keep last 1000 entries
  }

  async getStats(pattern: string): Promise<Record<string, string>> {
    const keys = await this.client.keys(pattern);
    const stats: Record<string, string> = {};
    
    for (const key of keys) {
      stats[key] = await this.client.get(key) || '0';
    }
    
    return stats;
  }

  // Utility methods
  async flush(): Promise<void> {
    await this.client.flushAll();
  }

  async info(): Promise<string> {
    return await this.client.info();
  }
}
