import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IngredientsService } from "./ingredients.service";
import { Ingredient, IngredientCategory } from "./ingredient.entity";

describe("IngredientsService", () => {
  let service: IngredientsService;
  let repository: Repository<Ingredient>;

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
      name: "Chicken Breast",
      unit: "lb",
      pricePerUnit: 4.5,
      category: "protein",
      recipeIngredients: [],
    },
    {
      id: 3,
      name: "Tofu",
      unit: "lb",
      pricePerUnit: 2.5,
      category: "protein",
      recipeIngredients: [],
    },
    {
      id: 4,
      name: "Spinach",
      unit: "bunch",
      pricePerUnit: 1.5,
      category: "produce",
      recipeIngredients: [],
    },
    {
      id: 5,
      name: "Milk",
      unit: "gallon",
      pricePerUnit: 4.0,
      category: "dairy",
      recipeIngredients: [],
    },
    {
      id: 6,
      name: "Greek Yogurt",
      unit: "tub",
      pricePerUnit: 3.0,
      category: "dairy",
      recipeIngredients: [],
    },
  ];

  const mockRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngredientsService,
        {
          provide: getRepositoryToken(Ingredient),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<IngredientsService>(IngredientsService);
    repository = module.get<Repository<Ingredient>>(
      getRepositoryToken(Ingredient)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return all ingredients", async () => {
      mockRepository.find.mockResolvedValue(mockIngredients);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith();
      expect(result).toEqual(mockIngredients);
      expect(result).toHaveLength(6);
    });

    it("should return empty array when no ingredients exist", async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe("findByCategory", () => {
    it("should return ingredients filtered by protein category", async () => {
      const proteinIngredients = mockIngredients.filter(
        (i) => i.category === "protein"
      );
      mockRepository.find.mockResolvedValue(proteinIngredients);

      const result = await service.findByCategory("protein");

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { category: "protein" },
      });
      expect(result).toEqual(proteinIngredients);
      expect(result.every((i) => i.category === "protein")).toBe(true);
      expect(result).toHaveLength(3);
    });

    it("should return ingredients filtered by produce category", async () => {
      const produceIngredients = mockIngredients.filter(
        (i) => i.category === "produce"
      );
      mockRepository.find.mockResolvedValue(produceIngredients);

      const result = await service.findByCategory("produce");

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { category: "produce" },
      });
      expect(result).toEqual(produceIngredients);
      expect(result).toHaveLength(1);
    });

    it("should return ingredients filtered by dairy category", async () => {
      const dairyIngredients = mockIngredients.filter(
        (i) => i.category === "dairy"
      );
      mockRepository.find.mockResolvedValue(dairyIngredients);

      const result = await service.findByCategory("dairy");

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { category: "dairy" },
      });
      expect(result).toEqual(dairyIngredients);
      expect(result).toHaveLength(2);
    });

    it("should return empty array when no ingredients match category", async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findByCategory("pantry");

      expect(result).toEqual([]);
    });
  });

  describe("findCheaperAlternative", () => {
    it("should return the cheapest alternative in the same category", async () => {
      const targetIngredient = mockIngredients[1]; // Chicken Breast ($4.5)
      const proteinIngredients = mockIngredients.filter(
        (i) => i.category === "protein"
      );
      mockRepository.find.mockResolvedValue(proteinIngredients);

      const result = await service.findCheaperAlternative(targetIngredient);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { category: "protein" },
      });
      expect(result).toEqual(mockIngredients[2]); // Tofu ($2.5) - cheapest alternative
      expect(result!.pricePerUnit).toBeLessThan(targetIngredient.pricePerUnit);
    });

    it("should return null when no cheaper alternative exists", async () => {
      const targetIngredient = mockIngredients[2]; // Tofu ($2.5) - already cheapest
      const proteinIngredients = mockIngredients.filter(
        (i) => i.category === "protein"
      );
      mockRepository.find.mockResolvedValue(proteinIngredients);

      const result = await service.findCheaperAlternative(targetIngredient);

      expect(result).toBeNull();
    });

    it("should exclude the target ingredient from alternatives", async () => {
      const targetIngredient = mockIngredients[0]; // Eggs ($3.5)
      const proteinIngredients = mockIngredients.filter(
        (i) => i.category === "protein"
      );
      mockRepository.find.mockResolvedValue(proteinIngredients);

      const result = await service.findCheaperAlternative(targetIngredient);

      expect(result).toEqual(mockIngredients[2]); // Tofu ($2.5)
      expect(result!.id).not.toBe(targetIngredient.id);
    });

    it("should return null when only the target ingredient exists in category", async () => {
      const targetIngredient = mockIngredients[3]; // Spinach - only produce item
      const produceIngredients = [targetIngredient];
      mockRepository.find.mockResolvedValue(produceIngredients);

      const result = await service.findCheaperAlternative(targetIngredient);

      expect(result).toBeNull();
    });

    it("should return the cheapest among multiple cheaper alternatives", async () => {
      const expensiveIngredient: Ingredient = {
        id: 7,
        name: "Premium Steak",
        unit: "lb",
        pricePerUnit: 15.0,
        category: "protein",
        recipeIngredients: [],
      };

      const proteinIngredientsWithExpensive = [
        ...mockIngredients.filter((i) => i.category === "protein"),
        expensiveIngredient,
      ];
      mockRepository.find.mockResolvedValue(proteinIngredientsWithExpensive);

      const result = await service.findCheaperAlternative(expensiveIngredient);

      expect(result).toEqual(mockIngredients[2]); // Tofu ($2.5) - cheapest of all proteins
      expect(result!.pricePerUnit).toBe(2.5);
    });

    it("should handle empty category gracefully", async () => {
      const targetIngredient = mockIngredients[0];
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findCheaperAlternative(targetIngredient);

      expect(result).toBeNull();
    });

    it("should sort alternatives by price ascending and return the cheapest", async () => {
      const targetIngredient: Ingredient = {
        id: 8,
        name: "Expensive Dairy",
        unit: "tub",
        pricePerUnit: 10.0,
        category: "dairy",
        recipeIngredients: [],
      };

      const dairyIngredientsWithExpensive = [
        ...mockIngredients.filter((i) => i.category === "dairy"),
        targetIngredient,
      ];
      mockRepository.find.mockResolvedValue(dairyIngredientsWithExpensive);

      const result = await service.findCheaperAlternative(targetIngredient);

      expect(result).toEqual(mockIngredients[5]); // Greek Yogurt ($3.0) - cheaper than Milk ($4.0)
      expect(result!.pricePerUnit).toBe(3.0);
    });
  });
});
