import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { GroceryService } from './grocery.service';
import { GroceryListSummary } from './grocery.types';

@Controller('grocery-list')
export class GroceryController {
  constructor(private readonly groceryService: GroceryService) {}

  @Get('current')
  async getCurrentList(): Promise<GroceryListSummary | null> {
    return this.groceryService.getCurrentList();
  }

  @Get('plan/:id')
  async getListForPlan(
    @Param('id', ParseIntPipe) id: number
  ): Promise<GroceryListSummary> {
    return this.groceryService.getListForPlan(id);
  }
}
