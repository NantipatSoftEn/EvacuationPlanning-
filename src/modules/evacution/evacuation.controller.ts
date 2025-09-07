import { Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { EvacuationPlanRequestDto, EvacuationPlanResponseDto, EvacuationStatusDto, EvacuationUpdateDto } from './evacuation-plan.dto';
import { EvacuationService } from './evacuation.service';

@Controller('/evacuations')
export class EvacuationController {
  constructor(private readonly evacuationService: EvacuationService) {}

  @Post('plan')
  generateEvacuationPlan(@Body() request: EvacuationPlanRequestDto) {
    const options = {
      strategy: request.strategy || 'greedy', // Default to greedy if not specified
      maxDistanceKm: request.maxDistanceKm || 100,
      allowMultiVehicle: request.allowMultiVehicle !== false,
      preferFewerTrips: request.preferFewerTrips !== false,
      speedFallbackKmh: request.speedFallbackKmh || 40
    };
    
    // Get vehicles from the service (you might want to get them from database or other source)
    const vehicles = this.evacuationService.getAvailableVehicles();
    const result = this.evacuationService.generateEvacuationPlan(vehicles, options);
    
    // Transform to expected format: simple array with ZoneID, VehicleID, ETA, NumberOfPeople
    const simplifiedPlan = result.assignments.map(assignment => ({
      ZoneID: assignment.zoneId,
      VehicleID: assignment.vehicleId,
      ETA: assignment.travelTimeFormatted,
      NumberOfPeople: assignment.peopleToEvacuate
    }));
    
    return simplifiedPlan;
  }

  @Get('status')
  getEvacuationStatus() {
    return this.evacuationService.getEvacuationStatus();
  }

  @Put('update')
  updateEvacuationStatus(@Body() update: EvacuationUpdateDto) {
    console.log("update",update);
    return this.evacuationService.updateEvacuationStatus(
      update.zoneLocation,
      update.vehicleId
    );
  }

  @Delete('clear')
  clearEvacuationPlans() {
    return this.evacuationService.clearEvacuationPlans();
  }

}
