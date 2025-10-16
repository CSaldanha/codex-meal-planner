import { Test, TestingModule } from "@nestjs/testing";
import { GroceryService } from "./grocery.service";
import { MealPlansService } from "../meal-plans/meal-plans.service";
import { IngredientsService } from "../ingredients/ingredients.service";
import { MealPlan } from "../meal-plans/meal-plan.entity";
import { Recipe } from "../recipes/recipe.entity";
import { Ingredient } from "../ingredients/ingredient.entity";
import { RecipeIngredient } from "../recipes/recipe-ingredient.entity";
import { MealPlansSummary } from "./grocery.types";

describe("GroceryService", () => {
  let service: GroceryService;
  let mealPlansService: MealPlansService;
  let ingredientsService: IngredientsService;

  const mockIngredients: Ingredient[] = [
    {
      id: 1,
      name: "Eggs",
      unit: "dozen",
      pricePerUnit: 3.5,
      category: "protein",
      recipeIngredients: [],
    },
    {
      id: 2,
      name: "Milk",
      unit: "gallon",
      pricePerUnit: 4.0,
      category: "dairy",
      recipeIngredients: [],
    },
    {
      id: 3,
      name: "Chicken Eggs",
      unit: "dozen",
      pricePerUnit: 2.5,
      category: "protein",
      recipeIngredients: [],
    },
  ];

  const mockRecipeIngredients: RecipeIngredient[] = [
    {
      id: 1,
      recipe: null as any,
      ingredient: mockIngredients[0], // Eggs
      quantity: 6,
      unit: "pieces",
    },
    {
      id: 2,
      recipe: null as any,
      ingredient: mockIngredients[1], // Milk
      quantity: 1,
      unit: "cup",
    },
  ];

  const mockRecipes: Recipe[] = [
    {
      id: 1,
      name: "Scrambled Eggs",
      description: "Fluffy scrambled eggs",
      mealType: "breakfast",
      prepTimeMinutes: 10,
      servings: 2,
      ingredients: [mockRecipeIngredients[0]],
    },
    {
      id: 2,
      name: "Pancakes",
      description: "Fluffy pancakes",
      mealType: "breakfast",
      prepTimeMinutes: 20,
      servings: 3,
      ingredients: [mockRecipeIngredients[1]],
    },
  ];

  const mockMealPlan: MealPlan = {
    id: 1,
    startDate: "2025-10-20",
    endDate: "2025-10-26",
    days: [
      {
        date: "2025-10-20",
        meals: {
          breakfast: {
            recipeId: 1,
            recipeName: "Scrambled Eggs",
            mealType: "breakfast",
          },
          lunch: { recipeId: 2, recipeName: "Pancakes", mealType: "breakfast" },
          dinner: {
            recipeId: 1,
            recipeName: "Scrambled Eggs",
            mealType: "breakfast",
          },
        },
      },
      {
        date: "2025-10-21",
        meals: {
          breakfast: {
            recipeId: 1,
            recipeName: "Scrambled Eggs",
            mealType: "breakfast",
          },
          lunch: { recipeId: 2, recipeName: "Pancakes", mealType: "breakfast" },
          dinner: {
            recipeId: 2,
            recipeName: "Pancakes",
            mealType: "breakfast",
          },
        },
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMealPlanSummary: MealPlansSummary = {
    plan: mockMealPlan,
    recipes: mockRecipes,
  };

  const mockMealPlansService = {
    getCurrentPlan: jest.fn(),
    summarizePlan: jest.fn(),
    getPlanSummaryById: jest.fn(),
  };

  const mockIngredientsService = {
    findCheaperAlternative: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroceryService,
        {
          provide: MealPlansService,
          useValue: mockMealPlansService,
        },
        {
          provide: IngredientsService,
          useValue: mockIngredientsService,
        },
      ],
    }).compile();

    service = module.get<GroceryService>(GroceryService);
    mealPlansService = module.get<MealPlansService>(MealPlansService);
    ingredientsService = module.get<IngredientsService>(IngredientsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getCurrentList", () => {
    it("should return grocery list for current meal plan", async () => {
      mockMealPlansService.getCurrentPlan.mockResolvedValue(mockMealPlan);
      mockMealPlansService.summarizePlan.mockResolvedValue(mockMealPlanSummary);
      mockIngredientsService.findCheaperAlternative.mockResolvedValue(null);

      const result = await service.getCurrentList();

      expect(mockMealPlansService.getCurrentPlan).toHaveBeenCalled();
      expect(mockMealPlansService.summarizePlan).toHaveBeenCalledWith(
        mockMealPlan
      );
      expect(result).toBeDefined();
      expect(result!.items).toHaveLength(2); // Eggs and Milk
      expect(result!.totalCost).toBeGreaterThan(0);
    });

    it("should return null when no current plan exists", async () => {
      mockMealPlansService.getCurrentPlan.mockResolvedValue(null);

      const result = await service.getCurrentList();

      expect(result).toBeNull();
      expect(mockMealPlansService.summarizePlan).not.toHaveBeenCalled();
    });
  });

  describe("getListForPlan", () => {
    it("should return grocery list for specific plan", async () => {
      mockMealPlansService.getPlanSummaryById.mockResolvedValue(
        mockMealPlanSummary
      );
      mockIngredientsService.findCheaperAlternative.mockResolvedValue(null);

      const result = await service.getListForPlan(1);

      expect(mockMealPlansService.getPlanSummaryById).toHaveBeenCalledWith(1);
      expect(result).toBeDefined();
      expect(result.items).toHaveLength(2);
    });
  });

  describe("createFromSummary", () => {
    it("should aggregate ingredients correctly with usage multipliers", async () => {
      mockIngredientsService.findCheaperAlternative.mockResolvedValue(null);

      const result = await service.createFromSummary(mockMealPlanSummary);

      // Recipe 1 (Scrambled Eggs with Eggs ingredient) appears 3 times
      // Recipe 2 (Pancakes with Milk ingredient) appears 3 times
      const eggsItem = result.items.find(
        (item) => item.ingredient.name === "Eggs"
      );
      const milkItem = result.items.find(
        (item) => item.ingredient.name === "Milk"
      );

      expect(eggsItem).toBeDefined();
      expect(eggsItem!.totalQuantity).toBe(18); // 6 pieces × 3 uses
      expect(eggsItem!.estimatedCost).toBe(63); // 6 × 3.5(price) × 3(uses)

      expect(milkItem).toBeDefined();
      expect(milkItem!.totalQuantity).toBe(3); // 1 cup × 3 uses
      expect(milkItem!.estimatedCost).toBe(12); // 1 × 4.0(price) × 3(uses)

      expect(result.totalCost).toBe(75); // 63 + 12
    });

    it("should calculate potential savings with substitutions", async () => {
      // Mock cheaper alternative for Eggs
      mockIngredientsService.findCheaperAlternative.mockImplementation(
        (ingredient: Ingredient) => {
          if (ingredient.id === 1) {
            return Promise.resolve(mockIngredients[2]); // Chicken Eggs (cheaper)
          }
          return Promise.resolve(null);
        }
      );

      const result = await service.createFromSummary(mockMealPlanSummary);

      const eggsItem = result.items.find(
        (item) => item.ingredient.name === "Eggs"
      );
      expect(eggsItem!.substitution).toEqual(mockIngredients[2]);
      expect(eggsItem!.potentialSavings).toBe(18); // 18 quantity × (3.5 - 2.5) price diff
      expect(result.potentialSavings).toBe(18);
    });

    it("should handle recipes with no ingredients", async () => {
      const emptyRecipeMealPlan: MealPlansSummary = {
        plan: mockMealPlan,
        recipes: [
          {
            id: 3,
            name: "Water",
            description: "Just water",
            mealType: "breakfast",
            prepTimeMinutes: 1,
            servings: 1,
            ingredients: [],
          },
        ],
      };

      const result = await service.createFromSummary(emptyRecipeMealPlan);

      expect(result.items).toHaveLength(0);
      expect(result.totalCost).toBe(0);
      expect(result.potentialSavings).toBe(0);
    });

    it("should sort items alphabetically by ingredient name", async () => {
      mockIngredientsService.findCheaperAlternative.mockResolvedValue(null);

      const result = await service.createFromSummary(mockMealPlanSummary);

      const itemNames = result.items.map((item) => item.ingredient.name);
      const sortedNames = [...itemNames].sort();
      expect(itemNames).toEqual(sortedNames);
    });

    it("should handle recipes not used in meal plan", async () => {
      const unusedRecipeMealPlan: MealPlansSummary = {
        plan: {
          ...mockMealPlan,
          days: [], // No days, so no recipe usage
        },
        recipes: mockRecipes,
      };

      const result = await service.createFromSummary(unusedRecipeMealPlan);

      expect(result.items).toHaveLength(0);
      expect(result.totalCost).toBe(0);
    });

    it("should accumulate duplicate ingredients across recipes", async () => {
      // Create a meal plan where both recipes use the same ingredient
      const duplicateIngredientRecipes: Recipe[] = [
        {
          ...mockRecipes[0],
          ingredients: [mockRecipeIngredients[0]], // Eggs
        },
        {
          ...mockRecipes[1],
          ingredients: [
            {
              id: 3,
              recipe: null as any,
              ingredient: mockIngredients[0], // Same Eggs ingredient
              quantity: 2,
              unit: "pieces",
            },
          ],
        },
      ];

      const duplicateSummary: MealPlansSummary = {
        plan: mockMealPlan,
        recipes: duplicateIngredientRecipes,
      };

      mockIngredientsService.findCheaperAlternative.mockResolvedValue(null);

      const result = await service.createFromSummary(duplicateSummary);

      expect(result.items).toHaveLength(1); // Only Eggs
      const eggsItem = result.items[0];
      // Recipe 1: 6 pieces × 3 uses = 18
      // Recipe 2: 2 pieces × 3 uses = 6
      // Total: 24 pieces
      expect(eggsItem.totalQuantity).toBe(24);
      expect(eggsItem.estimatedCost).toBe(84); // 24 × 3.5
    });
  });
});
