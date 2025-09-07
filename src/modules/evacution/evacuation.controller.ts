import { Body, Controller, Delete, Get, Post, Put, UseGuards, UseInterceptors, NotFoundException, BadRequestException } from '@nestjs/common';
import { EvacuationPlanRequestDto, EvacuationPlanResponseDto, EvacuationStatusDto, EvacuationUpdateDto } from './evacuation-plan.dto';
import { EvacuationService } from './evacuation.service';
import { RateLimit, RateLimitGuard } from '@common/cache/rate-limit.guard';
import { CacheConfig, CacheInterceptor } from '@common/cache/cache.interceptor';
import { RedisService } from '@common/cache/redis.service';

@Controller('/evacuations')
export class EvacuationController {
  constructor(
    private readonly evacuationService: EvacuationService,
    private readonly redisService: RedisService
  ) {}

  @Post('plan')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 60) // 5 requests per minute
  async generateEvacuationPlan(@Body() request: EvacuationPlanRequestDto) {
    const startTime = Date.now();
    
    const options = {
      strategy: request.strategy || 'greedy', // Default to greedy if not specified
      maxDistanceKm: request.maxDistanceKm || 100,
      allowMultiVehicle: request.allowMultiVehicle !== false,
      preferFewerTrips: request.preferFewerTrips !== false,
      speedFallbackKmh: request.speedFallbackKmh || 40
    };
    
    // Get vehicles from the service (you might want to get them from database or other source)
    const vehicles = this.evacuationService.getAvailableVehicles();
    const result = await this.evacuationService.generateEvacuationPlan(vehicles, options);
    
    // Track response time
    const responseTime = Date.now() - startTime;
    try {
      await this.redisService.trackResponseTime('evacuation_plan', responseTime);
    } catch (error) {
      // Analytics error doesn't affect response
    }
    
    // Transform to expected format: simple array with ZoneID, VehicleID, ETA, NumberOfPeople
    const simplifiedPlan = result.assignments.map(assignment => ({
      ZoneID: assignment.zoneId,
      VehicleID: assignment.vehicleId,
      ETA: assignment.travelTimeFormatted,
      NumberOfPeople: assignment.peopleToEvacuate
    }));
    
    return {
      message: `Evacuation plan generated successfully using ${options.strategy} strategy`,
      data: {
        plan: simplifiedPlan,
        strategy: options.strategy,
        totalAssignments: simplifiedPlan.length,
        planGeneratedAt: new Date().toISOString(),
        fromCache: result.fromCache || false,
        responseTimeMs: responseTime
      }
    };
  }

  @Get('status')
  getEvacuationStatus() {
    const status = this.evacuationService.getEvacuationStatus();
    return {
      message: 'Retrieved evacuation status successfully',
      data: status
    };
  }

    @Put('update')
  updateEvacuationStatus(@Body() update: EvacuationUpdateDto) {
    console.log("update", update);
    
    // Validate that either id or zoneLocation is provided
    const idOrLocation = update.id || update.zoneLocation;
    if (!idOrLocation) {
      throw new BadRequestException({
        message: 'Either id or zoneLocation must be provided',
        statusCode: 400
      });
    }
    
    try {
      const result = this.evacuationService.updateEvacuationStatus(
        idOrLocation,
        update.vehicleId
      );
      return {
        message: 'Evacuation status updated successfully',
        data: result
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException({
          message: 'Zone not found',
          error: error.message,
          statusCode: 404
        });
      }
      throw error;
    }
  }

  @Delete('clear')
  async clearEvacuationPlans() {
    const result = this.evacuationService.clearEvacuationPlans();
    
    // Clear Redis cache as well
    try {
      await this.redisService.flush();
    } catch (error) {
      // Cache clear error doesn't affect the main operation
      console.warn('Failed to clear Redis cache:', error.message);
    }
    
    return {
      message: 'All evacuation plans and cache cleared successfully',
      data: {
        cleared: true,
        timestamp: new Date().toISOString()
      }
    };
  }

  @Get('stats')
  @UseGuards(RateLimitGuard)
  @RateLimit(20, 60) // 20 requests per minute for stats
  async getStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [dailyStats, strategyStats, cacheInfo] = await Promise.all([
        this.redisService.getStats(`stats:daily:${today}:*`),
        this.redisService.getStats('stats:strategy_usage:*'),
        this.redisService.info()
      ]);

      return {
        message: 'Statistics retrieved successfully',
        data: {
          today: dailyStats,
          strategies: strategyStats,
          cache: {
            connected: true,
            info: cacheInfo.split('\r\n').slice(0, 10) // First 10 lines of Redis info
          }
        }
      };
    } catch (error) {
      return {
        message: 'Failed to retrieve statistics',
        error: error.message,
        data: {
          cache: {
            connected: false
          }
        }
      };
    }
  }
}
