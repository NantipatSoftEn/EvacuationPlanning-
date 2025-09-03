import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EvacuationZonesController } from './evacuation-zones.controller';
import { EvacuationController } from './evacuation.controller';
import { EvacuationService } from './evacuation.service';

@Module({
  imports: [],
  controllers: [AppController, EvacuationZonesController, EvacuationController],
  providers: [AppService, EvacuationService],
})
export class AppModule {}
