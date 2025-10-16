# Copilot Instructions for Smart Meal Planner

## Architecture Overview

This is a monorepo with Angular frontend (`/frontend`) and NestJS backend (`/backend`) for meal planning and grocery list generation. The backend uses SQLite + TypeORM with domain modules: `meal-plans`, `recipes`, `ingredients`, and `grocery`. Frontend communicates via proxy config (`proxy.conf.json`) that rewrites `/api/*` requests to direct backend routes at `localhost:3000` (e.g., `/api/meal-plans` → `/meal-plans`).

## Core Domain Model

- **MealPlan**: Contains 7-day plans with `DayPlan[]` stored as JSON, each day having breakfast/lunch/dinner recipes
- **Recipe**: Has `mealType` enum, ingredients via `RecipeIngredient` join table, requires balanced mix of breakfast/lunch/dinner for plan generation
- **Ingredient**: Has pricing, category, and unit data for grocery cost calculations
- **Grocery aggregation**: Cross-references meal plans with recipe ingredients to build shopping lists with substitution hints

## Development Workflow

```bash
# Setup (Node 18+ required)
cd backend && npm install && npm run seed  # Populates SQLite with sample data
cd frontend && npm install

# Development servers
cd backend && npm run start:dev   # NestJS on :3000
cd frontend && npm start          # Angular dev server with proxy

# Reset database with fresh sample data
cd backend && npm run seed
```

## Key Patterns & Conventions

### Backend (NestJS + TypeORM)

- Domain modules in `src/{meal-plans,recipes,ingredients,grocery}` with standard controller/service/entity structure
- **Critical**: Meal plan generation requires at least 1 recipe per meal type (breakfast/lunch/dinner) - validated in `MealPlansService.generateWeeklyPlan()`
- TypeORM entities use `simple-json` columns for complex data (see `MealPlan.days`)
- Service injection follows dependency direction: `GroceryService` → `MealPlansService` → `RecipesService`
- DTOs use `class-validator` decorators, placed in module `dto/` folders

### Frontend (Angular 17)

- Single `MealPlannerComponent` handles all UI state with reactive forms
- `ApiService` centralizes HTTP calls, uses environment-based URLs
- Types in `frontend/src/app/types.ts` mirror backend DTOs
- Proxy config forwards API calls: `proxy.conf.json` rewrites `/api/*` → backend routes

### Database & Seeding

- SQLite file: `backend/database.sqlite` (gitignored, auto-created)
- Seed script (`backend/src/seed.ts`) provides 20+ ingredients, 9 balanced recipes (3 per meal type), generates sample plan
- **Always run `npm run seed` after schema changes** - uses `synchronize: true` in TypeORM config

### Cross-Module Dependencies

- **Grocery list generation**: `GroceryService.createFromSummary()` aggregates ingredients across recipe usage in meal plans
- **Recipe highlighting**: Frontend sends `highlightedRecipes[]` to influence plan generation randomization
- **Plan summary**: `MealPlansService.summarizePlan()` enriches plans with full recipe details for UI display

## API Route Patterns

- Current resources: `/meal-plans/current`, `/grocery-list/current`
- Plan-specific: `/meal-plans/{id}/summary`, `/grocery-list/plan/{id}`
- Generation: `POST /meal-plans/generate` with `GenerateMealPlanDto`
- All routes assume latest plan is "current" by `createdAt DESC`

## Common Tasks

- **Adding new recipes**: Update `backend/src/seed.ts` ingredient/recipe data, ensure meal type balance
- **New API endpoints**: Follow existing controller patterns, update `frontend/src/app/services/api.service.ts` and types
- **UI changes**: Most logic in `MealPlannerComponent`, uses Angular reactive forms with `FormBuilder`
- **Database changes**: Modify entities, run seed script to recreate with sample data

## Testing & Quality

- Backend has comprehensive Jest unit tests with 100% service coverage
- Test commands: `npm test`, `npm run test:watch`, `npm run test:coverage`
- Tests use NestJS testing utilities with mocked repositories and services
- Frontend uses TailwindCSS (`tailwind.config.js` configured)
- Both projects use TypeScript strict mode, ESLint with `@typescript-eslint` rules
