import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post
} from '@nestjs/common';
import { MealPlan } from './meal-plan.entity';
import { MealPlansService } from './meal-plans.service';
import { GenerateMealPlanDto } from './dto/generate-meal-plan.dto';
import { MealPlansSummary } from '../grocery/grocery.types';

type MealPlanOverview = Pick<MealPlan, 'id' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt'>;

@Controller('meal-plans')
export class MealPlansController {
  constructor(private readonly mealPlansService: MealPlansService) {}

  @Get()
  async listPlans(): Promise<MealPlanOverview[]> {
    const plans = await this.mealPlansService.listPlans();
    return plans.map(({ id, startDate, endDate, createdAt, updatedAt }) => ({
      id,
      startDate,
      endDate,
      createdAt,
      updatedAt
    }));
  }

  @Get('current')
  async getCurrentPlan(): Promise<MealPlan | null> {
    return this.mealPlansService.getCurrentPlan();
  }

  @Get('current/summary')
  async getCurrentSummary(): Promise<MealPlansSummary | null> {
    const plan = await this.mealPlansService.getCurrentPlan();
    if (!plan) {
      return null;
    }
    return this.mealPlansService.summarizePlan(plan);
  }

  @Get(':id/summary')
  async getSummaryById(
    @Param('id', ParseIntPipe) id: number
  ): Promise<MealPlansSummary> {
    return this.mealPlansService.getPlanSummaryById(id);
  }

  @Get(':id')
  async getPlanById(@Param('id', ParseIntPipe) id: number): Promise<MealPlan> {
    return this.mealPlansService.getPlanById(id);
  }

  @Post('generate')
  async generate(@Body() dto: GenerateMealPlanDto): Promise<MealPlan> {
    return this.mealPlansService.generateWeeklyPlan(dto);
  }
}
