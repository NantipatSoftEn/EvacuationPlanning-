import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RedisService } from '@common/cache/redis.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
    constructor(private readonly redisService: RedisService) {}

    @Get()
    @ApiOperation({ 
        summary: 'Health check', 
        description: 'Check the health status of the API and its dependencies (Redis)' 
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Service health check successful',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Service is healthy and running'
                },
                data: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'ok'
                        },
                        timestamp: {
                            type: 'string',
                            example: '2025-09-09T10:30:00.000Z'
                        },
                        service: {
                            type: 'string',
                            example: 'Evacuation Planning API'
                        },
                        version: {
                            type: 'string',
                            example: '1.0.0'
                        },
                        uptime: {
                            type: 'number',
                            example: 3600
                        },
                        services: {
                            type: 'object',
                            properties: {
                                api: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'up' },
                                        responseTime: { type: 'number', example: 5 }
                                    }
                                },
                                redis: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'up' },
                                        connected: { type: 'boolean', example: true },
                                        latency: { type: 'number', example: 2 }
                                    }
                                }
                            }
                        },
                        environment: {
                            type: 'string',
                            example: 'development'
                        }
                    }
                }
            }
        }
    })
    async checkHealth() {
        const startTime = Date.now();
        let redisStatus = 'down';
        let redisInfo = {};

        try {
            await this.redisService.set('health_check', { timestamp: new Date() }, 5);
            const healthCheck = await this.redisService.get('health_check');
            if (healthCheck) {
                redisStatus = 'up';
                redisInfo = {
                    connected: true,
                    latency: Date.now() - startTime
                };
            }
        } catch (error) {
            redisInfo = {
                connected: false,
                error: error.message
            };
        }

        return {
            message: 'Service is healthy and running',
            data: {
                status: 'ok',
                timestamp: new Date().toISOString(),
                service: 'Evacuation Planning API',
                version: '1.0.0',
                uptime: Math.floor(process.uptime()),
                services: {
                    api: {
                        status: 'up',
                        responseTime: Date.now() - startTime
                    },
                    redis: {
                        status: redisStatus,
                        ...redisInfo
                    }
                },
                environment: process.env.NODE_ENV || 'development'
            }
        };
    }
}
