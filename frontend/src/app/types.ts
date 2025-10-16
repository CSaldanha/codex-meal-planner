export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  pricePerUnit: number;
  category: string;
}

export interface RecipeIngredient {
  id: number;
  ingredient: Ingredient;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: number;
  name: string;
  description?: string;
  mealType: MealType;
  prepTimeMinutes: number;
  servings: number;
  ingredients: RecipeIngredient[];
}

export interface PlannedMeal {
  recipeId: number;
  recipeName: string;
  mealType: MealType;
}

export interface DayPlan {
  date: string;
  meals: Record<MealType, PlannedMeal>;
}

export interface MealPlan {
  id: number;
  startDate: string;
  endDate: string;
  days: DayPlan[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MealPlanOverview {
  id: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlanSummary {
  plan: MealPlan;
  recipes: Recipe[];
}

export interface GroceryListItem {
  ingredient: Ingredient;
  totalQuantity: number;
  unit: string;
  estimatedCost: number;
  substitution?: Ingredient | null;
  potentialSavings?: number;
}

export interface GroceryListSummary {
  items: GroceryListItem[];
  totalCost: number;
  potentialSavings: number;
}

export interface GenerateMealPlanRequest {
  startDate?: string;
  highlightedRecipes?: string[];
}
