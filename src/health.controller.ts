import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
    @Get()
    checkHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'Evacuation Planning API',
            version: '1.0.0',
            uptime: Math.floor(process.uptime())
        };
    }
}
