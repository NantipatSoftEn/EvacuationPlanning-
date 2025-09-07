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
    
    return {
      message: `Evacuation plan generated successfully using ${options.strategy} strategy`,
      data: {
        plan: simplifiedPlan,
        strategy: options.strategy,
        totalAssignments: simplifiedPlan.length,
        planGeneratedAt: new Date().toISOString()
      }
    };
  }

  @Get('status')
  getEvacuationStatus() {
    const status = this.evacuationService.getEvacuationStatus();
    return {
      message: 'Retrieved evacuation status successfully',
      data: status
    };
  }

  @Put('update')
  updateEvacuationStatus(@Body() update: EvacuationUpdateDto) {
    console.log("update", update);
    const result = this.evacuationService.updateEvacuationStatus(
      update.zoneLocation,
      update.vehicleId
    );
    return {
      message: 'Evacuation status updated successfully',
      data: result
    };
  }

  @Delete('clear')
  clearEvacuationPlans() {
    const result = this.evacuationService.clearEvacuationPlans();
    return {
      message: 'All evacuation plans cleared successfully',
      data: {
        cleared: true,
        timestamp: new Date().toISOString()
      }
    };
  }

}
