import { Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { EvacuationPlanRequestDto, EvacuationPlanResponseDto, EvacuationStatusDto, EvacuationUpdateDto } from './evacuation-plan.dto';
import { EvacuationService } from './evacuation.service';
import { testDistanceCalculations } from '../../utils/distance-test.utils';

@Controller('api/evacuations')
export class EvacuationController {
  constructor(private readonly evacuationService: EvacuationService) {}

  @Post('plan')
  generateEvacuationPlan(@Body() request: EvacuationPlanRequestDto): EvacuationPlanResponseDto {
    const options = {
      maxDistanceKm: request.maxDistanceKm || 100,
      allowMultiVehicle: request.allowMultiVehicle !== false,
      preferFewerTrips: request.preferFewerTrips !== false,
      speedFallbackKmh: request.speedFallbackKmh || 40
    };
    
    // Get vehicles from the service (you might want to get them from database or other source)
    const vehicles = this.evacuationService.getAvailableVehicles();
    const result = this.evacuationService.generateEvacuationPlan(vehicles, options);
    return result;
  }

  @Get('status')
  getEvacuationStatus(): EvacuationStatusDto {
    return this.evacuationService.getEvacuationStatus();
  }

  @Get('status/detailed')
  getDetailedEvacuationStatus() {
    const status = this.evacuationService.getEvacuationStatus();
    const zones = this.evacuationService.getEvacuationZones();
    
    return {
      ...status,
      totalZones: zones.length,
      zonesRequiringEvacuation: zones.filter(z => {
        const total = z.numberOfPeople || z.people || 0;
        return total > z.evacuated;
      }).length,
      totalPeopleInAllZones: zones.reduce((sum, z) => sum + (z.numberOfPeople || z.people || 0), 0),
      totalEvacuated: zones.reduce((sum, z) => sum + z.evacuated, 0),
      evacuationProgress: {
        completed: zones.filter(z => {
          const total = z.numberOfPeople || z.people || 0;
          return z.evacuated >= total && total > 0;
        }).length,
        inProgress: zones.filter(z => {
          const total = z.numberOfPeople || z.people || 0;
          return z.evacuated > 0 && z.evacuated < total;
        }).length,
        pending: zones.filter(z => z.evacuated === 0 && (z.numberOfPeople || z.people || 0) > 0).length
      },
      urgencyDistribution: {
        high: zones.filter(z => (z.urgencyLevel || 0) >= 4 || (z.urgency === 'high')).length,
        medium: zones.filter(z => (z.urgencyLevel || 0) === 3 || (z.urgency === 'medium')).length,
        low: zones.filter(z => (z.urgencyLevel || 0) <= 2 || (z.urgency === 'low')).length
      }
    };
  }

  @Put('update')
  updateEvacuationStatus(@Body() update: EvacuationUpdateDto) {
    return this.evacuationService.updateEvacuationStatus(
      update.zoneLocation,
      update.evacuatedCount,
      update.vehicleId
    );
  }

  @Delete('clear')
  clearEvacuationPlans() {
    return this.evacuationService.clearEvacuationPlans();
  }

  @Get('test/distance')
  testDistanceCalculations() {
    return testDistanceCalculations();
  }
}
