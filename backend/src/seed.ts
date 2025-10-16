import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Ingredient } from './ingredients/ingredient.entity';
import { Recipe } from './recipes/recipe.entity';
import { RecipeIngredient } from './recipes/recipe-ingredient.entity';
import { MealPlan } from './meal-plans/meal-plan.entity';
import { MealPlansService } from './meal-plans/meal-plans.service';
import { RecipesService } from './recipes/recipes.service';

const dataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DB_PATH ?? 'database.sqlite',
  entities: [Ingredient, Recipe, RecipeIngredient, MealPlan],
  synchronize: true
});

async function seed() {
  await dataSource.initialize();

  const ingredientRepo = dataSource.getRepository(Ingredient);
  const recipeRepo = dataSource.getRepository(Recipe);
  const mealPlanRepo = dataSource.getRepository(MealPlan);

  await mealPlanRepo.clear();
  await recipeRepo.clear();
  await ingredientRepo.clear();

  const ingredientsData = [
    { name: 'Eggs', unit: 'dozen', pricePerUnit: 3.5, category: 'protein' },
    { name: 'Spinach', unit: 'bunch', pricePerUnit: 1.5, category: 'produce' },
    { name: 'Whole Wheat Bread', unit: 'loaf', pricePerUnit: 2.2, category: 'grain' },
    { name: 'Chicken Breast', unit: 'lb', pricePerUnit: 4.5, category: 'protein' },
    { name: 'Brown Rice', unit: 'lb', pricePerUnit: 1.8, category: 'grain' },
    { name: 'Black Beans', unit: 'can', pricePerUnit: 1, category: 'pantry' },
    { name: 'Greek Yogurt', unit: 'tub', pricePerUnit: 4, category: 'dairy' },
    { name: 'Berries Mix', unit: 'lb', pricePerUnit: 3, category: 'produce' },
    { name: 'Oats', unit: 'lb', pricePerUnit: 2, category: 'grain' },
    { name: 'Banana', unit: 'lb', pricePerUnit: 0.6, category: 'produce' },
    { name: 'Sweet Potato', unit: 'lb', pricePerUnit: 1.2, category: 'produce' },
    { name: 'Chickpeas', unit: 'can', pricePerUnit: 1.1, category: 'pantry' },
    { name: 'Tomato', unit: 'lb', pricePerUnit: 1.4, category: 'produce' },
    { name: 'Bell Pepper', unit: 'lb', pricePerUnit: 1.5, category: 'produce' },
    { name: 'Cheddar Cheese', unit: 'lb', pricePerUnit: 4.8, category: 'dairy' },
    { name: 'Tofu', unit: 'lb', pricePerUnit: 2.5, category: 'protein' },
    { name: 'Lentils', unit: 'lb', pricePerUnit: 1.3, category: 'pantry' },
    { name: 'Quinoa', unit: 'lb', pricePerUnit: 3.2, category: 'grain' },
    { name: 'Cucumber', unit: 'lb', pricePerUnit: 1, category: 'produce' },
    { name: 'Olive Oil', unit: 'bottle', pricePerUnit: 6.5, category: 'pantry' },
    { name: 'Garlic', unit: 'head', pricePerUnit: 0.5, category: 'spice' },
    { name: 'Onion', unit: 'lb', pricePerUnit: 0.8, category: 'produce' }
  ];

  const ingredientEntities = await ingredientRepo.save(
    ingredientsData.map((data) => ingredientRepo.create(data as any)) as any
  );

  const findIngredient = (name: string) => {
    const ingredient = ingredientEntities.find((item) => item.name === name);
    if (!ingredient) {
      throw new Error(`Missing ingredient ${name}`);
    }
    return ingredient;
  };

  const recipesData = [
    {
      name: 'Veggie Omelette',
      description: 'Fluffy eggs with fresh veggies and cheese.',
      mealType: 'breakfast',
      prepTimeMinutes: 15,
      servings: 2,
      ingredients: [
        { ingredient: findIngredient('Eggs'), quantity: 0.5, unit: 'dozen' },
        { ingredient: findIngredient('Spinach'), quantity: 0.5, unit: 'bunch' },
        { ingredient: findIngredient('Tomato'), quantity: 0.3, unit: 'lb' },
        { ingredient: findIngredient('Bell Pepper'), quantity: 0.3, unit: 'lb' },
        { ingredient: findIngredient('Cheddar Cheese'), quantity: 0.2, unit: 'lb' }
      ]
    },
    {
      name: 'Berry Yogurt Parfait',
      description: 'Layered Greek yogurt with berries and oats.',
      mealType: 'breakfast',
      prepTimeMinutes: 10,
      servings: 2,
      ingredients: [
        { ingredient: findIngredient('Greek Yogurt'), quantity: 0.5, unit: 'tub' },
        { ingredient: findIngredient('Berries Mix'), quantity: 0.4, unit: 'lb' },
        { ingredient: findIngredient('Oats'), quantity: 0.2, unit: 'lb' }
      ]
    },
    {
      name: 'Banana Oatmeal',
      description: 'Creamy oats topped with bananas and yogurt.',
      mealType: 'breakfast',
      prepTimeMinutes: 12,
      servings: 2,
      ingredients: [
        { ingredient: findIngredient('Oats'), quantity: 0.3, unit: 'lb' },
        { ingredient: findIngredient('Banana'), quantity: 0.5, unit: 'lb' },
        { ingredient: findIngredient('Greek Yogurt'), quantity: 0.2, unit: 'tub' }
      ]
    },
    {
      name: 'Grilled Chicken Salad',
      description: 'Lean grilled chicken served over hearty greens.',
      mealType: 'lunch',
      prepTimeMinutes: 25,
      servings: 2,
      ingredients: [
        { ingredient: findIngredient('Chicken Breast'), quantity: 1, unit: 'lb' },
        { ingredient: findIngredient('Spinach'), quantity: 0.5, unit: 'bunch' },
        { ingredient: findIngredient('Tomato'), quantity: 0.4, unit: 'lb' },
        { ingredient: findIngredient('Cucumber'), quantity: 0.4, unit: 'lb' },
        { ingredient: findIngredient('Olive Oil'), quantity: 0.05, unit: 'bottle' }
      ]
    },
    {
      name: 'Chickpea Quinoa Bowl',
      description: 'Protein-packed bowl with roasted veggies.',
      mealType: 'lunch',
      prepTimeMinutes: 30,
      servings: 2,
      ingredients: [
        { ingredient: findIngredient('Quinoa'), quantity: 0.4, unit: 'lb' },
        { ingredient: findIngredient('Chickpeas'), quantity: 1, unit: 'can' },
        { ingredient: findIngredient('Bell Pepper'), quantity: 0.3, unit: 'lb' },
        { ingredient: findIngredient('Onion'), quantity: 0.3, unit: 'lb' },
        { ingredient: findIngredient('Olive Oil'), quantity: 0.05, unit: 'bottle' }
      ]
    },
    {
      name: 'Lentil Soup',
      description: 'Comforting soup simmered with aromatics.',
      mealType: 'lunch',
      prepTimeMinutes: 35,
      servings: 4,
      ingredients: [
        { ingredient: findIngredient('Lentils'), quantity: 0.5, unit: 'lb' },
        { ingredient: findIngredient('Tomato'), quantity: 0.4, unit: 'lb' },
        { ingredient: findIngredient('Onion'), quantity: 0.4, unit: 'lb' },
        { ingredient: findIngredient('Garlic'), quantity: 0.2, unit: 'head' }
      ]
    },
    {
      name: 'Chicken Sweet Potato Skillet',
      description: 'One-pan chicken with caramelized sweet potatoes.',
      mealType: 'dinner',
      prepTimeMinutes: 30,
      servings: 3,
      ingredients: [
        { ingredient: findIngredient('Chicken Breast'), quantity: 1, unit: 'lb' },
        { ingredient: findIngredient('Sweet Potato'), quantity: 1.2, unit: 'lb' },
        { ingredient: findIngredient('Onion'), quantity: 0.3, unit: 'lb' },
        { ingredient: findIngredient('Garlic'), quantity: 0.1, unit: 'head' }
      ]
    },
    {
      name: 'Tofu Stir Fry',
      description: 'Crispy tofu tossed with veggies in a light sauce.',
      mealType: 'dinner',
      prepTimeMinutes: 25,
      servings: 2,
      ingredients: [
        { ingredient: findIngredient('Tofu'), quantity: 1, unit: 'lb' },
        { ingredient: findIngredient('Bell Pepper'), quantity: 0.4, unit: 'lb' },
        { ingredient: findIngredient('Cucumber'), quantity: 0.4, unit: 'lb' },
        { ingredient: findIngredient('Garlic'), quantity: 0.1, unit: 'head' },
        { ingredient: findIngredient('Olive Oil'), quantity: 0.05, unit: 'bottle' }
      ]
    },
    {
      name: 'Black Bean Rice Bowl',
      description: 'Smoky black beans over fluffy brown rice.',
      mealType: 'dinner',
      prepTimeMinutes: 28,
      servings: 3,
      ingredients: [
        { ingredient: findIngredient('Black Beans'), quantity: 1, unit: 'can' },
        { ingredient: findIngredient('Brown Rice'), quantity: 0.5, unit: 'lb' },
        { ingredient: findIngredient('Tomato'), quantity: 0.4, unit: 'lb' },
        { ingredient: findIngredient('Onion'), quantity: 0.3, unit: 'lb' },
        { ingredient: findIngredient('Bell Pepper'), quantity: 0.4, unit: 'lb' }
      ]
    }
  ];

  for (const recipeData of recipesData) {
    const recipe = recipeRepo.create(recipeData as any);
    await recipeRepo.save(recipe);
  }

  const mealPlansService = new MealPlansService(
    mealPlanRepo as any,
    new RecipesService(recipeRepo as any)
  );

  await mealPlansService.generateWeeklyPlan({});

  console.log('Database seeded with starter data.');
  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Failed to seed database', error);
  process.exit(1);
});
