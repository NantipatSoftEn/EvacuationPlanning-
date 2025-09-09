import { Body, Controller, Delete, Get, Post, Put, UseGuards, UseInterceptors, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { EvacuationPlanRequestDto, EvacuationPlanResponseDto, EvacuationStatusDto, EvacuationUpdateDto } from './evacuation-plan.dto';
import { EvacuationService } from './evacuation.service';
import { RateLimit, RateLimitGuard } from '@common/cache/rate-limit.guard';
import { CacheConfig, CacheInterceptor } from '@common/cache/cache.interceptor';
import { RedisService } from '@common/cache/redis.service';

@ApiTags('evacuations')
@Controller('/evacuations')
export class EvacuationController {
  constructor(
    private readonly evacuationService: EvacuationService,
    private readonly redisService: RedisService
  ) {}

  @Post('plan')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 60) // 5 requests per minute
  @ApiOperation({ 
    summary: 'Generate evacuation plan', 
    description: 'Generate an optimized evacuation plan using specified strategy (greedy or weighted)' 
  })
  @ApiBody({
    description: 'Evacuation plan request parameters',
    examples: {
      'greedy': {
        summary: 'Greedy strategy with basic parameters',
        value: {
          strategy: 'greedy',
          maxDistanceKm: 50,
          allowMultiVehicle: true,
          preferFewerTrips: true,
          speedFallbackKmh: 40
        }
      },
      'weighted': {
        summary: 'Weighted strategy with advanced parameters',
        value: {
          strategy: 'weighted',
          maxDistanceKm: 100,
          allowMultiVehicle: true,
          preferFewerTrips: false,
          speedFallbackKmh: 45
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Evacuation plan generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input parameters' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
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
  @ApiOperation({ summary: 'Get evacuation status', description: 'Retrieve current evacuation status for all zones' })
  @ApiResponse({ status: 200, description: 'Evacuation status retrieved successfully' })
  getEvacuationStatus() {
    const status = this.evacuationService.getEvacuationStatus();
    return {
      message: 'Retrieved evacuation status successfully',
      data: status
    };
  }

  @Put('update')
  @ApiOperation({ 
    summary: 'Update evacuation status', 
    description: 'Update the evacuation progress for a specific zone' 
  })
  @ApiBody({
    description: 'Evacuation update parameters',
    examples: {
      'by-id': {
        summary: 'Update by zone ID',
        value: {
          id: 'zone-001',
          vehicleId: 'v-001'
        }
      },
      'by-location': {
        summary: 'Update by zone location',
        value: {
          zoneLocation: '13.7563,100.5018',
          vehicleId: 'v-002'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Evacuation status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Zone not found' })
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
  @ApiOperation({ 
    summary: 'Clear all evacuation plans', 
    description: 'Clear all evacuation plans and cache data' 
  })
  @ApiResponse({ status: 200, description: 'All evacuation plans and cache cleared successfully' })
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
  @ApiOperation({ 
    summary: 'Get system statistics', 
    description: 'Retrieve daily statistics, strategy usage, and cache information' 
  })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
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
