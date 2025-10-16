import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  GenerateMealPlanRequest,
  GroceryListSummary,
  MealPlan,
  MealPlanOverview,
  MealPlanSummary,
  Recipe
} from '../types';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getCurrentMealPlan(): Observable<MealPlan | null> {
    return this.http.get<MealPlan | null>(`${this.baseUrl}/meal-plans/current`);
  }

  getMealPlansOverview(): Observable<MealPlanOverview[]> {
    return this.http.get<MealPlanOverview[]>(`${this.baseUrl}/meal-plans`);
  }

  generateMealPlan(payload: GenerateMealPlanRequest): Observable<MealPlan> {
    return this.http.post<MealPlan>(`${this.baseUrl}/meal-plans/generate`, payload);
  }

  getMealPlanSummary(): Observable<MealPlanSummary | null> {
    return this.http.get<MealPlanSummary | null>(
      `${this.baseUrl}/meal-plans/current/summary`
    );
  }

  getMealPlanSummaryById(id: number): Observable<MealPlanSummary> {
    return this.http.get<MealPlanSummary>(`${this.baseUrl}/meal-plans/${id}/summary`);
  }

  getGroceryList(): Observable<GroceryListSummary | null> {
    return this.http.get<GroceryListSummary | null>(
      `${this.baseUrl}/grocery-list/current`
    );
  }

  getGroceryListForPlan(id: number): Observable<GroceryListSummary> {
    return this.http.get<GroceryListSummary>(
      `${this.baseUrl}/grocery-list/plan/${id}`
    );
  }

  getRecipes(): Observable<Recipe[]> {
    return this.http.get<Recipe[]>(`${this.baseUrl}/recipes`);
  }
}
