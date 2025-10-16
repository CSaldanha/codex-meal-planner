import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';
import {
  DayPlan,
  GenerateMealPlanRequest,
  GroceryListSummary,
  MealPlan,
  MealPlanOverview,
  MealPlanSummary,
  MealType,
  Recipe
} from '../../types';

@Component({
  selector: 'app-meal-planner',
  templateUrl: './meal-planner.component.html'
})
export class MealPlannerComponent implements OnInit {
  loading = false;
  generating = false;
  planDetailsLoading = false;
  errorMessage = '';

  plan: MealPlan | null = null;
  summary: MealPlanSummary | null = null;
  groceryList: GroceryListSummary | null = null;
  recipes: Recipe[] = [];
  planOptions: MealPlanOverview[] = [];
  selectedPlanId: number | null = null;

  readonly mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];
  private readonly fb = inject(FormBuilder);
  readonly plannerForm = this.fb.nonNullable.group({
    startDate: ['']
  });

  highlightedRecipeNames = new Set<string>();

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadInitialData();
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

  get currentWeekLabel(): string | null {
    if (!this.plan) {
      return null;
    }
    return this.formatWeekRange(this.plan.startDate, this.plan.endDate);
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
        this.errorMessage = '';
        const overview = this.toPlanOverview(plan);
        this.upsertPlanOption(overview);
        this.generating = false;
        this.changePlan(plan.id);
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
      plans: this.api.getMealPlansOverview(),
      recipes: this.api.getRecipes()
    }).subscribe({
      next: ({ plans, recipes }) => {
        this.recipes = [...recipes].sort((a, b) => a.name.localeCompare(b.name));
        this.planOptions = this.sortPlanOptions(plans);
        const initialPlan = this.planOptions[0];
        if (initialPlan) {
          this.changePlan(initialPlan.id);
        } else {
          this.plan = null;
          this.summary = null;
          this.groceryList = null;
          this.loading = false;
        }
      },
      error: () => {
        this.errorMessage =
          'Unable to load meal plans. Make sure the NestJS API is running on port 3000.';
        this.loading = false;
      }
    });
  }

  changePlan(planId: number): void {
    if (!planId) {
      return;
    }
    if (planId === this.selectedPlanId && !this.loading && !this.planDetailsLoading) {
      return;
    }

    const previousPlan = this.selectedPlanId;
    this.selectedPlanId = planId;
    this.planDetailsLoading = true;
    this.errorMessage = '';

    forkJoin({
      summary: this.api.getMealPlanSummaryById(planId),
      grocery: this.api.getGroceryListForPlan(planId)
    }).subscribe({
      next: ({ summary, grocery }) => {
        this.summary = summary;
        this.plan = summary.plan;
        this.groceryList = grocery;
        this.planDetailsLoading = false;
        this.loading = false;
      },
      error: () => {
        this.errorMessage =
          'We could not load that week. Try again or regenerate a new meal plan.';
        if (previousPlan == null) {
          this.plan = null;
          this.summary = null;
          this.groceryList = null;
        }
        this.selectedPlanId = previousPlan ?? null;
        this.planDetailsLoading = false;
        this.loading = false;
      }
    });
  }

  onPlanSelect(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (!Number.isNaN(value)) {
      this.changePlan(value);
    }
  }

  planOptionLabel(option: MealPlanOverview): string {
    return this.formatWeekRange(option.startDate, option.endDate);
  }

  private formatWeekRange(start: string, end: string): string {
    const startDate = this.parseDate(start);
    const endDate = this.parseDate(end);
    if (!startDate || !endDate) {
      return `${start} - ${end}`;
    }

    const sameYear = startDate.getFullYear() === endDate.getFullYear();
    const startLabel = startDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: sameYear ? undefined : 'numeric'
    });
    const endLabel = endDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    return `${startLabel} - ${endLabel}`;
  }

  private parseDate(value: string | Date | undefined | null): Date | null {
    if (!value) {
      return null;
    }
    const date = typeof value === 'string' ? new Date(`${value}T00:00:00`) : new Date(value);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  }

  private toPlanOverview(plan: MealPlan): MealPlanOverview {
    const fallbackIso = this.parseDate(plan.startDate)?.toISOString() ?? new Date().toISOString();
    return {
      id: plan.id,
      startDate: plan.startDate,
      endDate: plan.endDate,
      createdAt: plan.createdAt ? this.toIsoString(plan.createdAt) : fallbackIso,
      updatedAt: plan.updatedAt ? this.toIsoString(plan.updatedAt) : fallbackIso
    };
  }

  private toIsoString(value?: string | Date): string {
    if (!value) {
      return new Date().toISOString();
    }
    if (typeof value === 'string') {
      return value;
    }
    return value.toISOString();
  }

  private sortPlanOptions(plans: MealPlanOverview[]): MealPlanOverview[] {
    return [...plans].sort((a, b) => {
      const startComparison = b.startDate.localeCompare(a.startDate);
      if (startComparison !== 0) {
        return startComparison;
      }
      return b.id - a.id;
    });
  }

  private upsertPlanOption(option: MealPlanOverview): void {
    const filtered = this.planOptions.filter((plan) => plan.id !== option.id);
    this.planOptions = this.sortPlanOptions([option, ...filtered]);
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
