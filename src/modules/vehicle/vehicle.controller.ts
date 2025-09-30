import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { VehicleCreateDto } from './vehicle.dto';
import { VehicleService } from './vehicle.service';
import { VehicleSwaggerConfig } from './vehicle.swagger';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehicleController {
    constructor(private readonly vehicleService: VehicleService) {}

    @Post()
    @ApiOperation(VehicleSwaggerConfig.addVehicles.operation)
    @ApiBody(VehicleSwaggerConfig.addVehicles.body)
    @ApiResponse(VehicleSwaggerConfig.addVehicles.responses.success)
    @ApiResponse(VehicleSwaggerConfig.addVehicles.responses.badRequest)
    addVehicles(@Body() vehicles: VehicleCreateDto | VehicleCreateDto[]) {
        const vehiclesArray = Array.isArray(vehicles) ? vehicles : [vehicles];
        const results = this.vehicleService.addVehicles(vehiclesArray);

        return {
            message: `${results.length} vehicle(s) added successfully`,
            data: {
                vehicles: results,
                count: results.length,
            },
        };
    }

    @Get()
    @ApiOperation(VehicleSwaggerConfig.getAllVehicles.operation)
    @ApiResponse(VehicleSwaggerConfig.getAllVehicles.responses.success)
    getAllVehicles() {
        const vehicles = this.vehicleService.getAllVehicles();
        return {
            message: 'Retrieved all vehicles successfully',
            data: {
                vehicles,
                count: vehicles.length,
            },
        };
    }
}
