import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';
import {
  DayPlan,
  GenerateMealPlanRequest,
  GroceryListSummary,
  MealPlan,
  MealPlanSummary,
  MealType,
  Recipe
} from '../../types';

@Component({
  selector: 'app-meal-planner',
  templateUrl: './meal-planner.component.html',
  styleUrls: ['./meal-planner.component.css']
})
export class MealPlannerComponent implements OnInit {
  loading = false;
  generating = false;
  errorMessage = '';

  plan: MealPlan | null = null;
  summary: MealPlanSummary | null = null;
  groceryList: GroceryListSummary | null = null;
  recipes: Recipe[] = [];

  readonly mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];
  plannerForm!: ReturnType<typeof this.createPlannerForm>;

  highlightedRecipeNames = new Set<string>();

  constructor(private readonly api: ApiService, private readonly fb: FormBuilder) {
    this.plannerForm = this.createPlannerForm();
  }

  private createPlannerForm() {
    return this.fb.nonNullable.group({
      startDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  get hasPlan(): boolean {
    return Boolean(this.plan?.days?.length);
  }

  get sortedDays(): DayPlan[] {
    if (!this.plan) {
      return [];
    }
    return [...this.plan.days].sort((a, b) => a.date.localeCompare(b.date));
  }

  get planGeneratedAt(): string | null {
    const createdAt = this.plan?.createdAt;
    if (!createdAt) {
      return null;
    }
    return this.formatDateTime(createdAt);
  }

  get highlightCount(): number {
    return this.highlightedRecipeNames.size;
  }

  recipesByType(type: MealType): Recipe[] {
    return this.recipes.filter((recipe) => recipe.mealType === type);
  }

  isRecipeHighlighted(recipe: Recipe): boolean {
    return this.highlightedRecipeNames.has(recipe.name);
  }

  toggleHighlight(recipe: Recipe): void {
    if (this.highlightedRecipeNames.has(recipe.name)) {
      this.highlightedRecipeNames.delete(recipe.name);
    } else {
      this.highlightedRecipeNames.add(recipe.name);
    }
  }

  generatePlan(): void {
    this.generating = true;
    this.errorMessage = '';
    const payload: GenerateMealPlanRequest = {};
    const startDate = this.plannerForm.value.startDate?.trim();
    if (startDate) {
      payload.startDate = startDate;
    }
    if (this.highlightedRecipeNames.size > 0) {
      payload.highlightedRecipes = Array.from(this.highlightedRecipeNames.values());
    }

    this.api.generateMealPlan(payload).subscribe({
      next: (plan) => {
        this.plan = plan;
        this.refreshSummaryAndGroceries();
        this.generating = false;
      },
      error: () => {
        this.errorMessage =
          'We could not generate a new meal plan. Please ensure the backend is running and seeded.';
        this.generating = false;
      }
    });
  }

  private loadInitialData(): void {
    this.loading = true;
    forkJoin({
      summary: this.api.getMealPlanSummary(),
      grocery: this.api.getGroceryList(),
      recipes: this.api.getRecipes()
    }).subscribe({
      next: ({ summary, grocery, recipes }) => {
        this.summary = summary;
        this.plan = summary?.plan ?? null;
        this.groceryList = grocery;
        this.recipes = [...recipes].sort((a, b) => a.name.localeCompare(b.name));
        this.loading = false;
      },
      error: () => {
        this.errorMessage =
          'Unable to load data. Make sure the NestJS API is running on port 3000.';
        this.loading = false;
      }
    });
  }

  private refreshSummaryAndGroceries(): void {
    forkJoin({
      summary: this.api.getMealPlanSummary(),
      grocery: this.api.getGroceryList()
    }).subscribe({
      next: ({ summary, grocery }) => {
        this.summary = summary;
        this.plan = summary?.plan ?? this.plan;
        this.groceryList = grocery;
      },
      error: () => {
        this.errorMessage =
          'The plan was generated but we could not refresh the summaries. Try reloading the page.';
      }
    });
  }

  formatDate(date: string): string {
    const dt = new Date(date + 'T00:00:00');
    return dt.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(date: string): string {
    const dt = new Date(date);
    if (isNaN(dt.getTime())) {
      return date;
    }
    return dt.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  trackByDate(_: number, day: DayPlan): string {
    return day.date;
  }

  recipeForMeal(day: DayPlan, type: MealType): Recipe | undefined {
    const meal = day.meals[type];
    return this.summary?.recipes.find((recipe) => recipe.id === meal.recipeId);
  }
}
