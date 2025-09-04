import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EvacuationZonesController } from '@modules/evacution/evacuation-zones.controller';
import { EvacuationController } from '@modules/evacution/evacuation.controller';
import { EvacuationService } from '@modules/evacution/evacuation.service';
import { VehicleController } from '@modules/vehicle/vehicle.controller';
import { VehicleService } from '@modules/vehicle/vehicle.service';

@Module({
  imports: [],
  controllers: [AppController, EvacuationZonesController, EvacuationController, VehicleController],
  providers: [AppService, EvacuationService, VehicleService],
})
export class AppModule {}
