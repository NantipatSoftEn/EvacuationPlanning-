import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
    @Get()
    checkHealth() {
        return {
            message: 'Service is healthy and running',
            data: {
                status: 'ok',
                timestamp: new Date().toISOString(),
                service: 'Evacuation Planning API',
                version: '1.0.0',
                uptime: Math.floor(process.uptime())
            }
        };
    }
}
