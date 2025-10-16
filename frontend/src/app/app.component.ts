import { Component, OnInit } from '@angular/core';
import { ApiService } from './services/api.service';
import { GroceryListSummary } from './types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Smart Meal Planner & Grocery Saver';
  groceryList: GroceryListSummary | null = null;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadGroceryList();
  }

  private loadGroceryList(): void {
    this.api.getGroceryList().subscribe({
      next: (grocery) => {
        this.groceryList = grocery;
      },
      error: () => {
        // Silently fail - the component will just not show savings
      }
    });
  }
}
