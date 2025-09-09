import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiExcludeEndpoint() // This endpoint is excluded from Swagger as it's just a welcome message
  getHello() {
    const hello = this.appService.getHello();
    return {
      message: 'Welcome to Evacuation Planning API',
      data: {
        greeting: hello,
        version: '1.0.0',
        endpoints: {
          health: '/health',
          docs: '/docs',
          vehicles: '/api/api/vehicles',
          evacuationZones: '/api/api/evacuation-zones',
          evacuationPlan: '/api/api/evacuations/plan'
        }
      }
    };
  }
}
