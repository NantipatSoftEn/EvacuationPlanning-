import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from './redis.service';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';

// Decorator สำหรับกำหนด cache config
export const CacheConfig = (ttl: number, keyGenerator?: (req: any) => string) =>
  SetMetadata('cacheConfig', { ttl, keyGenerator });

export interface CacheConfigMetadata {
  ttl: number;
  keyGenerator?: (req: any) => string;
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly reflector: Reflector
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const cacheConfig = this.reflector.get<CacheConfigMetadata>('cacheConfig', context.getHandler());
    
    if (!cacheConfig) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const cacheKey = this.generateCacheKey(context, request, cacheConfig.keyGenerator);

    try {
      // Check if we have cached data
      const cachedData = await this.redisService.get(cacheKey);
      if (cachedData) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return of(cachedData);
      }

      this.logger.debug(`Cache miss for key: ${cacheKey}`);
      
      // Execute the original method and cache the result
      return next.handle().pipe(
        tap(async (data) => {
          if (data) {
            await this.redisService.set(cacheKey, data, cacheConfig.ttl);
            this.logger.debug(`Data cached for key: ${cacheKey}`);
          }
        })
      );
    } catch (error) {
      this.logger.error(`Cache error: ${error.message}`);
      return next.handle(); // Fallback to executing the method
    }
  }

  private generateCacheKey(context: ExecutionContext, request: any, keyGenerator?: (req: any) => string): string {
    if (keyGenerator) {
      return keyGenerator(request);
    }

    const className = context.getClass().name;
    const methodName = context.getHandler().name;
    const url = request.url;
    const body = JSON.stringify(request.body || {});
    
    return `${className}:${methodName}:${Buffer.from(url + body).toString('base64')}`;
  }
}
