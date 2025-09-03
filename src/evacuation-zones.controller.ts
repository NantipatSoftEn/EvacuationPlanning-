import { Body, Controller, Post } from '@nestjs/common';
import { EvacuationZoneDto } from './evacuation-zone.dto';
import { EvacuationService } from './evacuation.service';

@Controller('api/evacuation-zones')
export class EvacuationZonesController {
  constructor(private readonly evacuationService: EvacuationService) {}

  @Post()
  addEvacuationZone(@Body() zone: EvacuationZoneDto) {
    const result = this.evacuationService.addEvacuationZone(zone);
    return {
      message: 'Evacuation zone added',
      zone: result,
    };
  }
}