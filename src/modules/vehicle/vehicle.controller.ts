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
    summary: 'Add vehicle(s) - Bulk Create Supported', 
    description: `Add one or multiple vehicles to the system. Supports both single object and array of objects for bulk operations.
    
    **Bulk Create Features:**
    - Add multiple vehicles in a single API call
    - Atomic operation - all succeed or all fail
    - Detailed validation for each vehicle
    - Comprehensive error reporting per vehicle
    
    **Supported Vehicle Types:** bus, van, boat
    **Required Fields:** vehicleId, capacity, type, locationCoordinates, speed` 
  })
  @ApiBody({
    description: 'Single vehicle or array of vehicles for bulk creation',
    examples: {
      'single': {
        summary: 'Single vehicle creation',
        description: 'Create a single vehicle with all required parameters',
        value: {
          vehicleId: 'v-001',
          capacity: 50,
          type: 'Bus',
          locationCoordinates: { latitude: 13.7563, longitude: 100.5018 },
          speed: 60
        }
      },
      'bulk-create-2': {
        summary: 'Bulk create - 2 vehicles',
        description: 'Create multiple vehicles with different types and capacities',
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
      },
      'bulk-create-5': {
        summary: 'Bulk create - 5 vehicles (fleet)',
        description: 'Create a complete vehicle fleet with mixed types',
        value: [
          {
            vehicleId: 'bus-001',
            capacity: 60,
            type: 'bus',
            locationCoordinates: { latitude: 13.7563, longitude: 100.5018 },
            speed: 65
          },
          {
            vehicleId: 'bus-002',
            capacity: 55,
            type: 'bus',
            locationCoordinates: { latitude: 13.7460, longitude: 100.5340 },
            speed: 60
          },
          {
            vehicleId: 'van-001',
            capacity: 30,
            type: 'van',
            locationCoordinates: { latitude: 13.7400, longitude: 100.5200 },
            speed: 55
          },
          {
            vehicleId: 'van-002',
            capacity: 25,
            type: 'van',
            locationCoordinates: { latitude: 13.7500, longitude: 100.5100 },
            speed: 50
          },
          {
            vehicleId: 'boat-001',
            capacity: 40,
            type: 'boat',
            locationCoordinates: { latitude: 13.7300, longitude: 100.5000 },
            speed: 35
          }
        ]
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Vehicle(s) added successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '5 vehicle(s) added successfully'
        },
        data: {
          type: 'object',
          properties: {
            vehicles: {
              type: 'array',
              description: 'Array of created vehicles'
            },
            count: {
              type: 'number',
              example: 5
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data or validation failed',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Failed to add some vehicles: Vehicle 1: Vehicle capacity must be greater than 0, Vehicle 3: Vehicle type must be bus, van, or boat'
        },
        error: {
          type: 'string',
          example: 'Bad Request'
        },
        statusCode: {
          type: 'number',
          example: 400
        }
      }
    }
  })
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
  @ApiOperation({ 
    summary: 'Get all vehicles', 
    description: 'Retrieve all registered vehicles in the system' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Retrieved all vehicles successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Retrieved all vehicles successfully'
        },
        data: {
          type: 'object',
          properties: {
            vehicles: {
              type: 'array',
              description: 'Array of all registered vehicles'
            },
            count: {
              type: 'number',
              example: 10
            }
          }
        }
      }
    }
  })
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
