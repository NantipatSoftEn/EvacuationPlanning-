import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CacheInterceptor } from './cache.interceptor';
import { RateLimitGuard } from './rate-limit.guard';
import { VehicleStatusService } from '@common/services/vehicle-status.service';

@Global()
@Module({
  providers: [RedisService, CacheInterceptor, RateLimitGuard, VehicleStatusService],
  exports: [RedisService, CacheInterceptor, RateLimitGuard, VehicleStatusService],
})
export class CacheModule {}
