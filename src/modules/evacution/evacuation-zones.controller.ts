import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { EvacuationZoneDto } from './evacuation-zone.dto';
import { EvacuationService } from './evacuation.service';

@ApiTags('evacuation-zones')
@Controller('evacuation-zones')
export class EvacuationZonesController {
  constructor(private readonly evacuationService: EvacuationService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Add evacuation zone(s)', 
    description: 'Add one or multiple evacuation zones. Accepts both single object and array of objects.' 
  })
  @ApiBody({
    description: 'Single evacuation zone or array of evacuation zones',
    examples: {
      'single': {
        summary: 'Single evacuation zone',
        value: {
          zoneId: 'zone-001',
          locationCoordinates: { latitude: 13.7563, longitude: 100.5018 },
          numberOfPeople: 150,
          urgencyLevel: 3
        }
      },
      'multiple': {
        summary: 'Multiple evacuation zones',
        value: [
          {
            zoneId: 'zone-001',
            locationCoordinates: { latitude: 13.7563, longitude: 100.5018 },
            numberOfPeople: 150,
            urgencyLevel: 3
          },
          {
            zoneId: 'zone-002',
            locationCoordinates: { latitude: 13.7460, longitude: 100.5340 },
            numberOfPeople: 200,
            urgencyLevel: 4
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Evacuation zone(s) added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  addEvacuationZones(@Body() zones: EvacuationZoneDto | EvacuationZoneDto[]) {
    const zonesArray = Array.isArray(zones) ? zones : [zones];
    const results = this.evacuationService.addEvacuationZones(zonesArray);
    
    return {
      message: `${results.length} evacuation zone(s) added successfully`,
      data: {
        zones: results,
        count: results.length
      }
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all evacuation zones' })
  @ApiResponse({ status: 200, description: 'Retrieved all evacuation zones successfully' })
  getAllEvacuationZones() {
    const zones = this.evacuationService.getEvacuationZones();
    return {
      message: 'Retrieved all evacuation zones successfully',
      data: {
        zones,
        count: zones.length
      }
    };
  }
}