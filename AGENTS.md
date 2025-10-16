# Repository Guidelines

## Project Structure & Module Organization
This repo is split into `backend` (NestJS + TypeORM) and `frontend` (Angular). Backend domain modules reside in `backend/src/{meal-plans,grocery,recipes,ingredients}` with the bootstrap entry in `backend/src/main.ts` and seed data in `backend/src/seed.ts`. Angular features live in `frontend/src/app`, and static assets stay under `frontend/src/assets`. The `frontend/proxy.conf.json` already forwards `/meal-plans`, `/grocery-list`, and related calls to the API, so keep new client endpoints aligned with existing backend routes.

## Build, Test, and Development Commands
- `cd backend && npm install` / `cd frontend && npm install` — install Node 18+ dependencies.
- `cd backend && npm run seed` — reset the SQLite database with sample recipes and plans.
- `cd backend && npm run start:dev` — run the NestJS watcher on http://localhost:3000.
- `cd frontend && npm start` — launch the Angular dev server with proxy enabled.
- `cd backend && npm run lint` and `cd frontend && npm run lint` — TypeScript-aware ESLint passes.
- `cd frontend && npm run build` — production Angular bundle for CI smoke checks.

## Coding Style & Naming Conventions
Use TypeScript across both projects with 2-space indentation. Classes and Nest providers stay `PascalCase`, exported functions and variables remain `camelCase`, and DTOs/interfaces end with `Dto`/`Interface`. ESLint runs with the `@typescript-eslint` recommended presets; address `no-unused-vars` warnings rather than muting them. Prefer Prettier-compatible formatting (single quotes, trailing commas where valid) to avoid lint churn.

## Testing Guidelines
Automated tests are not yet scaffolded, so add backend specs beside their modules (`backend/src/recipes/recipes.service.spec.ts`) using `@nestjs/testing`. Frontend component tests belong under `frontend/src/app/**/__tests__` or `*.spec.ts` files built with Angular’s `TestBed`. Once suites exist, wire `npm run test` scripts and target ≥80% line coverage. Until then, treat ESLint as the pre-merge gate and document any manual verification steps in PRs.

## Commit & Pull Request Guidelines
The current history only contains the initial clone, so establish Conventional Commit messages (`feat: add meal plan filters`) in present tense. Each PR should include: a concise summary of changes, related issue or ticket ID, database/seed considerations if data models shift, screenshots or curl samples for UI/API updates, and a checklist of lint/tests executed. Request review when the branch is rebased and ready—drafts are welcome for early feedback.
