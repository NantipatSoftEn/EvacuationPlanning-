import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EvacuationZonesController } from './evacuation-zones.controller';
import { EvacuationController } from './evacuation.controller';
import { EvacuationService } from './evacuation.service';
import { VehicleController } from './vehicle.controller';
import { VehicleService } from './vehicle.service';

@Module({
  imports: [],
  controllers: [AppController, EvacuationZonesController, EvacuationController, VehicleController],
  providers: [AppService, EvacuationService, VehicleService],
})
export class AppModule {}
