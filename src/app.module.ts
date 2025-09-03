import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EvacuationZonesController } from './evacuation-zones.controller';

@Module({
  imports: [],
  controllers: [AppController, EvacuationZonesController],
  providers: [AppService],
})
export class AppModule {}
