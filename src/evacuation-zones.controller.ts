import { Body, Controller, Post } from '@nestjs/common';
import { EvacuationZoneDto } from './evacuation-zone.dto';

@Controller('api/evacuation-zones')
export class EvacuationZonesController {
  @Post()
  addEvacuationZone(@Body() zone: EvacuationZoneDto) {
    // Here you would normally save to a database
    return {
      message: 'Evacuation zone added',
      zone,
    };
  }
}