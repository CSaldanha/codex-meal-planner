import { Component, OnInit } from '@angular/core';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Smart Meal Planner & Grocery Saver';
  potentialSavings = 0;

  constructor(private readonly api: ApiService) {}

  get hasSavings(): boolean {
    return this.potentialSavings > 0;
  }

  ngOnInit(): void {
    this.loadGroceryList();
  }

  private loadGroceryList(): void {
    this.api.getGroceryList().subscribe({
      next: (grocery) => {
        if (grocery) {
          this.potentialSavings = grocery.potentialSavings;
        }
      },
      error: () => {
        // Silently fail - the component will just not show savings
      }
    });
  }
}
