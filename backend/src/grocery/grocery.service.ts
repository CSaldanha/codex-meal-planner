import { Injectable } from '@nestjs/common';
import { IngredientsService } from '../ingredients/ingredients.service';
import { MealPlansService } from '../meal-plans/meal-plans.service';
import { MealType } from '../recipes/recipe.entity';
import {
  GroceryListItem,
  GroceryListSummary,
  MealPlansSummary
} from './grocery.types';

@Injectable()
export class GroceryService {
  constructor(
    private readonly mealPlansService: MealPlansService,
    private readonly ingredientsService: IngredientsService
  ) {}

  async getCurrentList(): Promise<GroceryListSummary | null> {
    const plan = await this.mealPlansService.getCurrentPlan();
    if (!plan) {
      return null;
    }
    return this.createFromSummary(await this.mealPlansService.summarizePlan(plan));
  }

  async getListForPlan(planId: number): Promise<GroceryListSummary> {
    const summary = await this.mealPlansService.getPlanSummaryById(planId);
    return this.createFromSummary(summary);
  }

  async createFromSummary(
    summary: MealPlansSummary
  ): Promise<GroceryListSummary> {
    const usage = this.countRecipeUsage(summary);
    const aggregate = new Map<number, GroceryListItem>();

    summary.recipes.forEach((recipe) => {
      const multiplier = usage.get(recipe.id) ?? 0;
      if (multiplier === 0) {
        return;
      }
      recipe.ingredients.forEach((ri) => {
        const existing = aggregate.get(ri.ingredient.id);
        const totalQuantity = ri.quantity * multiplier;
        const estimatedCost = ri.ingredient.pricePerUnit * totalQuantity;
        if (existing) {
          existing.totalQuantity += totalQuantity;
          existing.estimatedCost += estimatedCost;
        } else {
          aggregate.set(ri.ingredient.id, {
            ingredient: ri.ingredient,
            unit: ri.unit,
            totalQuantity,
            estimatedCost
          });
        }
      });
    });

    const itemsWithSuggestions = await Promise.all(
      Array.from(aggregate.values()).map(async (item) => {
        const substitution = await this.ingredientsService.findCheaperAlternative(
          item.ingredient
        );
        if (substitution) {
          const potentialSavings =
            item.totalQuantity *
            (item.ingredient.pricePerUnit - substitution.pricePerUnit);
          return {
            ...item,
            substitution,
            potentialSavings: Math.max(potentialSavings, 0)
          };
        }
        return item;
      })
    );

    const totalCost = itemsWithSuggestions.reduce(
      (sum, item) => sum + item.estimatedCost,
      0
    );
    const potentialSavings = itemsWithSuggestions.reduce((sum, item) => {
      if (item.substitution && item.potentialSavings) {
        return sum + item.potentialSavings;
      }
      return sum;
    }, 0);

    return {
      items: itemsWithSuggestions.sort((a, b) =>
        a.ingredient.name.localeCompare(b.ingredient.name)
      ),
      totalCost,
      potentialSavings
    };
  }

  private countRecipeUsage(summary: MealPlansSummary): Map<number, number> {
    const usage = new Map<number, number>();
    summary.plan.days.forEach((day) => {
      (Object.keys(day.meals) as MealType[]).forEach((type) => {
        const meal = day.meals[type];
        usage.set(meal.recipeId, (usage.get(meal.recipeId) ?? 0) + 1);
      });
    });
    return usage;
  }
}
