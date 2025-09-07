import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { EvacuationZonesController } from '@modules/evacution/evacuation-zones.controller';
import { EvacuationController } from '@modules/evacution/evacuation.controller';
import { EvacuationService } from '@modules/evacution/evacuation.service';
import { VehicleController } from '@modules/vehicle/vehicle.controller';
import { VehicleService } from '@modules/vehicle/vehicle.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 1000, // 1 second
      limit: 3,
    }, {
      name: 'medium',
      ttl: 10000, // 10 seconds
      limit: 20
    }, {
      name: 'long',
      ttl: 60000, // 1 minute
      limit: 100
    }]),
  ],
  controllers: [AppController, HealthController, EvacuationZonesController, EvacuationController, VehicleController],
  providers: [AppService, EvacuationService, VehicleService],
})
export class AppModule {}
