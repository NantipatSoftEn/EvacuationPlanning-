import { Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { EvacuationPlanRequestDto, EvacuationPlanResponseDto, EvacuationStatusDto, EvacuationUpdateDto } from './evacuation-plan.dto';
import { EvacuationService } from './evacuation.service';

@Controller('api/evacuations')
export class EvacuationController {
  constructor(private readonly evacuationService: EvacuationService) {}

  @Post('plan')
  generateEvacuationPlan(@Body() request: EvacuationPlanRequestDto) {
    console.log("reques",request);
    return "SHIT"
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
