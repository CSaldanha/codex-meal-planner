import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException } from "@nestjs/common";
import { MealPlansService } from "./meal-plans.service";
import { MealPlan, DayPlan, PlannedMeal } from "./meal-plan.entity";
import { RecipesService } from "../recipes/recipes.service";
import { GenerateMealPlanDto } from "./dto/generate-meal-plan.dto";
import { Recipe, MealType } from "../recipes/recipe.entity";

describe("MealPlansService", () => {
  let service: MealPlansService;
  let repository: Repository<MealPlan>;
  let recipesService: RecipesService;

  const mockMealPlans: MealPlan[] = [
    {
      id: 1,
      startDate: "2025-10-20",
      endDate: "2025-10-26",
      days: [],
      createdAt: new Date("2025-10-16T10:00:00Z"),
      updatedAt: new Date("2025-10-16T10:00:00Z"),
    },
    {
      id: 2,
      startDate: "2025-10-13",
      endDate: "2025-10-19",
      days: [],
      createdAt: new Date("2025-10-09T10:00:00Z"),
      updatedAt: new Date("2025-10-09T10:00:00Z"),
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
      ingredients: [],
    },
    {
      id: 2,
      name: "Pancakes",
      description: "Fluffy pancakes",
      mealType: "breakfast",
      prepTimeMinutes: 20,
      servings: 3,
      ingredients: [],
    },
    {
      id: 3,
      name: "Chicken Sandwich",
      description: "Grilled chicken sandwich",
      mealType: "lunch",
      prepTimeMinutes: 15,
      servings: 1,
      ingredients: [],
    },
    {
      id: 4,
      name: "Caesar Salad",
      description: "Fresh Caesar salad",
      mealType: "lunch",
      prepTimeMinutes: 10,
      servings: 2,
      ingredients: [],
    },
    {
      id: 5,
      name: "Beef Stew",
      description: "Hearty beef stew",
      mealType: "dinner",
      prepTimeMinutes: 120,
      servings: 4,
      ingredients: [],
    },
    {
      id: 6,
      name: "Pasta Carbonara",
      description: "Classic Italian pasta",
      mealType: "dinner",
      prepTimeMinutes: 30,
      servings: 2,
      ingredients: [],
    },
  ];

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRecipesService = {
    getAllGroupedByMealType: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealPlansService,
        {
          provide: getRepositoryToken(MealPlan),
          useValue: mockRepository,
        },
        {
          provide: RecipesService,
          useValue: mockRecipesService,
        },
      ],
    }).compile();

    service = module.get<MealPlansService>(MealPlansService);
    repository = module.get<Repository<MealPlan>>(getRepositoryToken(MealPlan));
    recipesService = module.get<RecipesService>(RecipesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("listPlans", () => {
    it("should return meal plans ordered by startDate and createdAt DESC", async () => {
      mockRepository.find.mockResolvedValue(mockMealPlans);

      const result = await service.listPlans();

      expect(mockRepository.find).toHaveBeenCalledWith({
        select: ["id", "startDate", "endDate", "createdAt", "updatedAt"],
        order: {
          startDate: "DESC",
          createdAt: "DESC",
        },
      });
      expect(result).toEqual(mockMealPlans);
    });

    it("should return empty array when no plans exist", async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.listPlans();

      expect(result).toEqual([]);
    });
  });

  describe("getCurrentPlan", () => {
    it("should return the most recent meal plan", async () => {
      mockRepository.find.mockResolvedValue([mockMealPlans[0]]);

      const result = await service.getCurrentPlan();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: "DESC", startDate: "DESC" },
        take: 1,
      });
      expect(result).toEqual(mockMealPlans[0]);
    });

    it("should return null when no plans exist", async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getCurrentPlan();

      expect(result).toBeNull();
    });
  });

  describe("getPlanById", () => {
    it("should return meal plan by id", async () => {
      mockRepository.findOne.mockResolvedValue(mockMealPlans[0]);

      const result = await service.getPlanById(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockMealPlans[0]);
    });

    it("should throw NotFoundException when plan does not exist", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getPlanById(999)).rejects.toThrow(
        new NotFoundException("Meal plan 999 was not found")
      );
    });
  });

  describe("generateWeeklyPlan", () => {
    const mockGroupedRecipes = {
      breakfast: [mockRecipes[0], mockRecipes[1]],
      lunch: [mockRecipes[2], mockRecipes[3]],
      dinner: [mockRecipes[4], mockRecipes[5]],
    };

    beforeEach(() => {
      mockRecipesService.getAllGroupedByMealType.mockResolvedValue(
        mockGroupedRecipes
      );
      mockRepository.create.mockImplementation((data) => ({ id: 1, ...data }));
      mockRepository.save.mockImplementation((plan) => Promise.resolve(plan));
    });

    it("should generate a weekly plan successfully", async () => {
      const dto: GenerateMealPlanDto = { startDate: "2025-10-20" };

      const result = await service.generateWeeklyPlan(dto);

      expect(mockRecipesService.getAllGroupedByMealType).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalledWith({
        startDate: expect.any(String),
        endDate: expect.any(String),
        days: expect.any(Array),
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.days).toHaveLength(7);
      // Just verify that dates are in correct format
      expect(result.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should throw NotFoundException when no breakfast recipes exist", async () => {
      mockRecipesService.getAllGroupedByMealType.mockResolvedValue({
        breakfast: [],
        lunch: [mockRecipes[2]],
        dinner: [mockRecipes[4]],
      });

      const dto: GenerateMealPlanDto = { startDate: "2025-10-20" };

      await expect(service.generateWeeklyPlan(dto)).rejects.toThrow(
        new NotFoundException(
          "Unable to build a plan because there are no breakfast recipes"
        )
      );
    });

    it("should throw NotFoundException when no lunch recipes exist", async () => {
      mockRecipesService.getAllGroupedByMealType.mockResolvedValue({
        breakfast: [mockRecipes[0]],
        lunch: [],
        dinner: [mockRecipes[4]],
      });

      const dto: GenerateMealPlanDto = { startDate: "2025-10-20" };

      await expect(service.generateWeeklyPlan(dto)).rejects.toThrow(
        new NotFoundException(
          "Unable to build a plan because there are no lunch recipes"
        )
      );
    });

    it("should throw NotFoundException when no dinner recipes exist", async () => {
      mockRecipesService.getAllGroupedByMealType.mockResolvedValue({
        breakfast: [mockRecipes[0]],
        lunch: [mockRecipes[2]],
        dinner: [],
      });

      const dto: GenerateMealPlanDto = { startDate: "2025-10-20" };

      await expect(service.generateWeeklyPlan(dto)).rejects.toThrow(
        new NotFoundException(
          "Unable to build a plan because there are no dinner recipes"
        )
      );
    });

    it("should prioritize highlighted recipes in the plan", async () => {
      const dto: GenerateMealPlanDto = {
        startDate: "2025-10-20",
        highlightedRecipes: ["Pancakes", "Caesar Salad"],
      };

      const result = await service.generateWeeklyPlan(dto);

      // Check that highlighted recipes appear early in the plan
      const firstDay = result.days[0];
      expect(firstDay.meals.breakfast.recipeName).toBe("Pancakes"); // Highlighted
      expect(firstDay.meals.lunch.recipeName).toBe("Caesar Salad"); // Highlighted
    });

    it("should cycle through recipes over 7 days", async () => {
      const dto: GenerateMealPlanDto = { startDate: "2025-10-20" };

      const result = await service.generateWeeklyPlan(dto);

      // With 2 recipes per meal type, should see repetition
      const breakfastRecipes = result.days.map(
        (day) => day.meals.breakfast.recipeName
      );
      const uniqueBreakfast = new Set(breakfastRecipes);
      expect(uniqueBreakfast.size).toBeLessThanOrEqual(2);
      expect(breakfastRecipes).toHaveLength(7);
    });

    it("should default to next Monday when no start date provided", async () => {
      const dto: GenerateMealPlanDto = {};

      const result = await service.generateWeeklyPlan(dto);

      // Should generate a plan with valid date format
      expect(result.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.days).toHaveLength(7);
    });

    it("should handle invalid start date gracefully", async () => {
      const dto: GenerateMealPlanDto = { startDate: "invalid-date" };

      const result = await service.generateWeeklyPlan(dto);

      // Should generate a plan with valid date format
      expect(result.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.days).toHaveLength(7);
    });
  });

  describe("summarizePlan", () => {
    it("should return plan summary with used recipes", async () => {
      const mockPlan: MealPlan = {
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
              lunch: {
                recipeId: 3,
                recipeName: "Chicken Sandwich",
                mealType: "lunch",
              },
              dinner: {
                recipeId: 5,
                recipeName: "Beef Stew",
                mealType: "dinner",
              },
            },
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRecipesService.findAll.mockResolvedValue(mockRecipes);

      const result = await service.summarizePlan(mockPlan);

      expect(mockRecipesService.findAll).toHaveBeenCalled();
      expect(result.plan).toEqual(mockPlan);
      expect(result.recipes).toHaveLength(3);
      expect(result.recipes.map((r) => r.id)).toEqual([1, 3, 5]);
    });

    it("should handle plan with duplicate recipe usage", async () => {
      const mockPlan: MealPlan = {
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
              lunch: {
                recipeId: 1,
                recipeName: "Scrambled Eggs",
                mealType: "breakfast",
              },
              dinner: {
                recipeId: 1,
                recipeName: "Scrambled Eggs",
                mealType: "breakfast",
              },
            },
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRecipesService.findAll.mockResolvedValue(mockRecipes);

      const result = await service.summarizePlan(mockPlan);

      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].id).toBe(1);
    });
  });
});
