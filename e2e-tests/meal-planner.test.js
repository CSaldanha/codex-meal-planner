const puppeteer = require('puppeteer');

describe('Meal Planner E2E Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      defaultViewport: { width: 1280, height: 720 }
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should load meal planner application', async () => {
    await page.goto('http://localhost:4200');
    await page.waitForSelector('app-meal-planner');
    
    const title = await page.title();
    expect(title).toContain('Smart Meal Planner');
  });

  test('should generate a new meal plan', async () => {
    await page.goto('http://localhost:4200');
    
    // Wait for the application to load
    await page.waitForSelector('[data-testid="generate-meal-plan"], .generate-plan-btn, button:contains("Generate")', 
      { timeout: 10000 });
    
    // Click generate meal plan button (adjust selector based on your UI)
    await page.click('button'); // Adjust this selector
    
    // Wait for meal plan to appear
    await page.waitForSelector('.meal-plan, .weekly-plan, [data-testid="meal-plan"]', 
      { timeout: 15000 });
    
    // Verify meal plan was generated
    const mealPlanExists = await page.$('.meal-plan, .weekly-plan') !== null;
    expect(mealPlanExists).toBe(true);
  });

  test('should display grocery list', async () => {
    await page.goto('http://localhost:4200');
    
    // Look for grocery list section or button
    const grocerySection = await page.waitForSelector(
      '.grocery-list, [data-testid="grocery-list"], button:contains("Grocery")', 
      { timeout: 10000 }
    );
    
    expect(grocerySection).toBeTruthy();
  });

  test('should display recipes', async () => {
    await page.goto('http://localhost:4200');
    
    // Check if recipes are displayed
    await page.waitForSelector('body', { timeout: 5000 });
    
    // Take screenshot for visual validation
    await page.screenshot({ 
      path: 'e2e-tests/screenshots/meal-planner-home.png',
      fullPage: true 
    });
    
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000); // Basic content check
  });

  test('should handle API responses correctly', async () => {
    // Monitor network requests
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        responses.push({
          url: response.url(),
          status: response.status()
        });
      }
    });

    await page.goto('http://localhost:4200');
    await page.waitForTimeout(3000); // Wait for API calls

    // Verify API calls were made successfully
    const successfulAPICalls = responses.filter(r => r.status >= 200 && r.status < 300);
    expect(successfulAPICalls.length).toBeGreaterThan(0);
  });
});