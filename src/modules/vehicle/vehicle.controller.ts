import { Body, Controller, Get, Post } from '@nestjs/common';
import { VehicleCreateDto } from './vehicle.dto';
import { VehicleService } from './vehicle.service';

@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  addVehicle(@Body() vehicle: VehicleCreateDto) {
    const result = this.vehicleService.addVehicle(vehicle);
    return {
      message: 'Vehicle added successfully',
      vehicle: result,
    };
  }

  @Get()
  getAllVehicles() {
    return {
      vehicles: this.vehicleService.getAllVehicles()
    };
  }
}
