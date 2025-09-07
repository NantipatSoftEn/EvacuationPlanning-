import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { VehicleCreateDto } from './vehicle.dto';
import { VehicleService } from './vehicle.service';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Add vehicle(s)', 
    description: 'Add one or multiple vehicles. Accepts both single object and array of objects.' 
  })
  @ApiBody({
    description: 'Single vehicle or array of vehicles',
    examples: {
      'single': {
        summary: 'Single vehicle',
        value: {
          vehicleId: 'v-001',
          capacity: 50,
          type: 'Bus',
          locationCoordinates: { latitude: 13.7563, longitude: 100.5018 },
          speed: 60
        }
      },
      'multiple': {
        summary: 'Multiple vehicles',
        value: [
          {
            vehicleId: 'v-001',
            capacity: 50,
            type: 'Bus',
            locationCoordinates: { latitude: 13.7563, longitude: 100.5018 },
            speed: 60
          },
          {
            vehicleId: 'v-002',
            capacity: 30,
            type: 'Van',
            locationCoordinates: { latitude: 13.7460, longitude: 100.5340 },
            speed: 50
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Vehicle(s) added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  addVehicles(@Body() vehicles: VehicleCreateDto | VehicleCreateDto[]) {
    const vehiclesArray = Array.isArray(vehicles) ? vehicles : [vehicles];
    const results = this.vehicleService.addVehicles(vehiclesArray);
    
    return {
      message: `${results.length} vehicle(s) added successfully`,
      data: {
        vehicles: results,
        count: results.length
      }
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all vehicles' })
  @ApiResponse({ status: 200, description: 'Retrieved all vehicles successfully' })
  getAllVehicles() {
    const vehicles = this.vehicleService.getAllVehicles();
    return {
      message: 'Retrieved all vehicles successfully',
      data: {
        vehicles,
        count: vehicles.length
      }
    };
  }
}
