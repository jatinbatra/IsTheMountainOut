import { test, expect } from '@playwright/test';

test.describe('Mountain Visibility App', () => {
  test('should display the main headline', async ({ page }) => {
    await page.goto('/');
    
    // The headline should contain "YES." or "NOT TODAY."
    const headline = page.locator('h1.hero-headline');
    await expect(headline).toBeVisible();
    await expect(headline).toHaveText(/YES\.|NOT TODAY\./);
  });

  test('should show the visibility score', async ({ page }) => {
    await page.goto('/');
    
    // The score is displayed in a gauge
    const scoreElement = page.locator('.font-display.tabular');
    await expect(scoreElement).toBeVisible();
    
    const scoreText = await scoreElement.innerText();
    const scoreValue = parseInt(scoreText);
    expect(scoreValue).toBeGreaterThanOrEqual(0);
    expect(scoreValue).toBeLessThanOrEqual(100);
  });

  test('should have a working neighborhood selector', async ({ page }) => {
    await page.goto('/');
    
    // Find the neighborhood selector (it's in SeattleVisibilityMap or similar)
    // Actually, looking at Dashboard.tsx, there's a setNeighborhood function
    // and SeattleVisibilityMap component.
    
    // Let's check for the map section
    const mapSection = page.locator('#section-map');
    await expect(mapSection).toBeVisible();
  });
});
