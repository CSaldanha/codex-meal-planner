import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MealPlansSummary } from '../grocery/grocery.types';
import { MealPlan, DayPlan, PlannedMeal } from './meal-plan.entity';
import { GenerateMealPlanDto } from './dto/generate-meal-plan.dto';
import { RecipesService } from '../recipes/recipes.service';
import { MealType, Recipe } from '../recipes/recipe.entity';

@Injectable()
export class MealPlansService {
  constructor(
    @InjectRepository(MealPlan)
    private readonly mealPlanRepository: Repository<MealPlan>,
    private readonly recipesService: RecipesService
  ) {}

  async listPlans(): Promise<MealPlan[]> {
    return this.mealPlanRepository.find({
      select: ['id', 'startDate', 'endDate', 'createdAt', 'updatedAt'],
      order: {
        startDate: 'DESC',
        createdAt: 'DESC'
      }
    });
  }

  async getCurrentPlan(): Promise<MealPlan | null> {
    const [latest] = await this.mealPlanRepository.find({
      order: { createdAt: 'DESC', startDate: 'DESC' },
      take: 1
    });
    return latest ?? null;
  }

  async getPlanById(id: number): Promise<MealPlan> {
    const plan = await this.mealPlanRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Meal plan ${id} was not found`);
    }
    return plan;
  }

  async getPlanSummaryById(id: number): Promise<MealPlansSummary> {
    const plan = await this.getPlanById(id);
    return this.summarizePlan(plan);
  }

  async generateWeeklyPlan(dto: GenerateMealPlanDto): Promise<MealPlan> {
    const grouped = await this.recipesService.getAllGroupedByMealType();
    (['breakfast', 'lunch', 'dinner'] as MealType[]).forEach((type) => {
      if (!grouped[type] || grouped[type].length === 0) {
        throw new NotFoundException(
          `Unable to build a plan because there are no ${type} recipes`
        );
      }
    });

    const highlightSet = new Set(
      dto.highlightedRecipes?.map((name) => name.toLowerCase()) ?? []
    );

    const reorder = (recipes: Recipe[]) =>
      [...recipes].sort((a, b) => {
        const aHighlighted = highlightSet.has(a.name.toLowerCase()) ? 1 : 0;
        const bHighlighted = highlightSet.has(b.name.toLowerCase()) ? 1 : 0;
        return bHighlighted - aHighlighted || a.name.localeCompare(b.name);
      });

    const ordered: Record<MealType, Recipe[]> = {
      breakfast: reorder(grouped.breakfast),
      lunch: reorder(grouped.lunch),
      dinner: reorder(grouped.dinner)
    };

    const startDate = this.resolveStartDate(dto.startDate);
    const days: DayPlan[] = [];
    const counters: Record<MealType, number> = {
      breakfast: 0,
      lunch: 0,
      dinner: 0
    };

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const isoDate = currentDate.toISOString().split('T')[0];
      const dayMeals: Record<MealType, PlannedMeal> = {
        breakfast: this.recipeToPlannedMeal(
          ordered.breakfast[counters.breakfast % ordered.breakfast.length]
        ),
        lunch: this.recipeToPlannedMeal(
          ordered.lunch[counters.lunch % ordered.lunch.length]
        ),
        dinner: this.recipeToPlannedMeal(
          ordered.dinner[counters.dinner % ordered.dinner.length]
        )
      };
      counters.breakfast += 1;
      counters.lunch += 1;
      counters.dinner += 1;
      days.push({ date: isoDate, meals: dayMeals });
    }

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const plan = this.mealPlanRepository.create({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      days
    });
    return this.mealPlanRepository.save(plan);
  }

  async summarizePlan(plan: MealPlan): Promise<MealPlansSummary> {
    const recipes = await this.recipesService.findAll();
    const recipeMap = new Map(recipes.map((recipe) => [recipe.id, recipe]));

    const uniqueRecipeIds = new Set<number>();
    plan.days.forEach((day) => {
      (Object.keys(day.meals) as MealType[]).forEach((type) => {
        uniqueRecipeIds.add(day.meals[type].recipeId);
      });
    });

    const usedRecipes = Array.from(uniqueRecipeIds)
      .map((id) => recipeMap.get(id))
      .filter((recipe): recipe is Recipe => Boolean(recipe));

    return {
      plan,
      recipes: usedRecipes
    };
  }

  private resolveStartDate(input?: string): Date {
    if (input) {
      const parsed = new Date(input);
      if (!isNaN(parsed.getTime())) {
        parsed.setHours(0, 0, 0, 0);
        return parsed;
      }
    }
    const today = new Date();
    const start = new Date(today);
    const day = start.getDay();
    const distanceToMonday = (8 - day) % 7; // 0 if Monday
    start.setDate(start.getDate() + distanceToMonday);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private recipeToPlannedMeal(recipe: Recipe): PlannedMeal {
    return {
      recipeId: recipe.id,
      recipeName: recipe.name,
      mealType: recipe.mealType
    };
  }
}
