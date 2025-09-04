import { Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { EvacuationPlanRequestDto, EvacuationPlanResponseDto, EvacuationStatusDto, EvacuationUpdateDto } from './evacuation-plan.dto';
import { EvacuationService } from './evacuation.service';

@Controller('api/evacuations')
export class EvacuationController {
  constructor(private readonly evacuationService: EvacuationService) {}

  @Post('plan')
  generateEvacuationPlan(@Body() request: EvacuationPlanRequestDto): EvacuationPlanResponseDto {
    const result = this.evacuationService.generateEvacuationPlan(request.vehicles);
    return result;
  }

  @Get('status')
  getEvacuationStatus(): EvacuationStatusDto {
    return this.evacuationService.getEvacuationStatus();
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
}
