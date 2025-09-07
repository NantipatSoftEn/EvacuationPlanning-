import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from './redis.service';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';

// Decorator สำหรับกำหนด rate limit
export const RateLimit = (maxRequests: number, windowSeconds: number = 60) =>
  SetMetadata('rateLimit', { maxRequests, windowSeconds });

export interface RateLimitMetadata {
  maxRequests: number;
  windowSeconds: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly redisService: RedisService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitConfig = this.reflector.get<RateLimitMetadata>('rateLimit', context.getHandler());
    
    if (!rateLimitConfig) {
      return true; // No rate limiting configured
    }

    const request = context.switchToHttp().getRequest();
    const identifier = this.getIdentifier(request);
    const endpoint = `${context.getClass().name}.${context.getHandler().name}`;

    const allowed = await this.redisService.checkRateLimit(
      identifier,
      endpoint,
      rateLimitConfig.maxRequests,
      rateLimitConfig.windowSeconds
    );

    if (!allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Rate limit exceeded. Maximum ${rateLimitConfig.maxRequests} requests per ${rateLimitConfig.windowSeconds} seconds.`,
          error: 'Too Many Requests'
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }

  private getIdentifier(request: any): string {
    // Use IP address as identifier (you can customize this)
    return request.ip || request.connection.remoteAddress || 'unknown';
  }
}
