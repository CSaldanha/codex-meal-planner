import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecipesService } from './recipes.service';
import { Recipe, MealType } from './recipe.entity';

describe('RecipesService', () => {
  let service: RecipesService;
  let repository: Repository<Recipe>;

  const mockRecipes: Recipe[] = [
    {
      id: 1,
      name: 'Scrambled Eggs',
      description: 'Fluffy scrambled eggs',
      mealType: 'breakfast',
      prepTimeMinutes: 10,
      servings: 2,
      ingredients: []
    },
    {
      id: 2,
      name: 'Chicken Sandwich',
      description: 'Grilled chicken sandwich',
      mealType: 'lunch',
      prepTimeMinutes: 15,
      servings: 1,
      ingredients: []
    },
    {
      id: 3,
      name: 'Beef Stew',
      description: 'Hearty beef stew',
      mealType: 'dinner',
      prepTimeMinutes: 120,
      servings: 4,
      ingredients: []
    },
    {
      id: 4,
      name: 'Pancakes',
      description: 'Fluffy pancakes',
      mealType: 'breakfast',
      prepTimeMinutes: 20,
      servings: 3,
      ingredients: []
    }
  ];

  const mockRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        {
          provide: getRepositoryToken(Recipe),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<RecipesService>(RecipesService);
    repository = module.get<Repository<Recipe>>(getRepositoryToken(Recipe));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all recipes ordered by name ASC', async () => {
      const sortedRecipes = [...mockRecipes].sort((a, b) => a.name.localeCompare(b.name));
      mockRepository.find.mockResolvedValue(sortedRecipes);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
      expect(result).toEqual(sortedRecipes);
    });

    it('should return empty array when no recipes exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByMealType', () => {
    it('should return recipes filtered by breakfast meal type', async () => {
      const breakfastRecipes = mockRecipes.filter(r => r.mealType === 'breakfast');
      mockRepository.find.mockResolvedValue(breakfastRecipes);

      const result = await service.findByMealType('breakfast');

      expect(mockRepository.find).toHaveBeenCalledWith({ where: { mealType: 'breakfast' } });
      expect(result).toEqual(breakfastRecipes);
      expect(result.every(r => r.mealType === 'breakfast')).toBe(true);
    });

    it('should return recipes filtered by lunch meal type', async () => {
      const lunchRecipes = mockRecipes.filter(r => r.mealType === 'lunch');
      mockRepository.find.mockResolvedValue(lunchRecipes);

      const result = await service.findByMealType('lunch');

      expect(mockRepository.find).toHaveBeenCalledWith({ where: { mealType: 'lunch' } });
      expect(result).toEqual(lunchRecipes);
    });

    it('should return recipes filtered by dinner meal type', async () => {
      const dinnerRecipes = mockRecipes.filter(r => r.mealType === 'dinner');
      mockRepository.find.mockResolvedValue(dinnerRecipes);

      const result = await service.findByMealType('dinner');

      expect(mockRepository.find).toHaveBeenCalledWith({ where: { mealType: 'dinner' } });
      expect(result).toEqual(dinnerRecipes);
    });

    it('should return empty array when no recipes match meal type', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findByMealType('breakfast');

      expect(result).toEqual([]);
    });
  });

  describe('getAllGroupedByMealType', () => {
    it('should return recipes grouped by meal type', async () => {
      mockRepository.find.mockResolvedValue(mockRecipes);

      const result = await service.getAllGroupedByMealType();

      expect(mockRepository.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
      expect(result).toEqual({
        breakfast: [mockRecipes[0], mockRecipes[3]],
        lunch: [mockRecipes[1]],
        dinner: [mockRecipes[2]]
      });
    });

    it('should return empty arrays for meal types with no recipes', async () => {
      const onlyBreakfastRecipes = mockRecipes.filter(r => r.mealType === 'breakfast');
      mockRepository.find.mockResolvedValue(onlyBreakfastRecipes);

      const result = await service.getAllGroupedByMealType();

      expect(result).toEqual({
        breakfast: onlyBreakfastRecipes,
        lunch: [],
        dinner: []
      });
    });

    it('should return all empty arrays when no recipes exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getAllGroupedByMealType();

      expect(result).toEqual({
        breakfast: [],
        lunch: [],
        dinner: []
      });
    });

    it('should handle recipes with all meal types evenly distributed', async () => {
      const evenRecipes = [
        { ...mockRecipes[0], mealType: 'breakfast' as MealType },
        { ...mockRecipes[1], mealType: 'lunch' as MealType },
        { ...mockRecipes[2], mealType: 'dinner' as MealType }
      ];
      mockRepository.find.mockResolvedValue(evenRecipes);

      const result = await service.getAllGroupedByMealType();

      expect(result.breakfast).toHaveLength(1);
      expect(result.lunch).toHaveLength(1);
      expect(result.dinner).toHaveLength(1);
    });
  });
});