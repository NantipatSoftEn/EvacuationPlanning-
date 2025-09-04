import { Injectable } from '@nestjs/common';
import { VehicleCreateDto } from './vehicle.dto';

@Injectable()
export class VehicleService {
  private vehicles: (VehicleCreateDto & { id: string })[] = [];

  addVehicle(vehicleData: VehicleCreateDto) {
    const newVehicle = {
      ...vehicleData,
      id: Math.random().toString(36).substr(2, 9)
    };
    this.vehicles.push(newVehicle);
    return newVehicle;
  }

  getAllVehicles() {
    return this.vehicles;
  }

  getVehicleById(id: string) {
    return this.vehicles.find(vehicle => vehicle.id === id);
  }
}
