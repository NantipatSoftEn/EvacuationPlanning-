import { Controller, Get } from '@nestjs/common';
import { RedisService } from '@common/cache/redis.service';

@Controller('health')
export class HealthController {
    constructor(private readonly redisService: RedisService) {}

    @Get()
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
