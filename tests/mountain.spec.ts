import { test, expect } from "@playwright/test";

test.describe("Mountain Visibility App", () => {
  test("should render the hero section", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator("[data-testid='hero-section']");
    await expect(hero).toBeVisible();
  });

  test("should display the visibility score as a number 0-100", async ({ page }) => {
    await page.goto("/");
    const gauge = page.locator("[data-testid='visibility-score']");
    await expect(gauge).toBeVisible();
    const text = await gauge.innerText();
    const score = parseInt(text);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test("should have a working viewpoint carousel", async ({ page }) => {
    await page.goto("/");
    const carousel = page.locator("[data-testid='viewpoint-carousel']");
    await expect(carousel).toBeVisible();
    const items = carousel.locator("button");
    expect(await items.count()).toBeGreaterThan(0);
  });
});
