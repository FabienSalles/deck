import { test, expect } from '@playwright/test';
import { waitForRevealReady, goToSlide, getTotalSlides, getCurrentSlideIndex } from './helpers/reveal';

test.describe('Presentation page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/session-1/');
    await waitForRevealReady(page);
  });

  test('Reveal.js container is visible', async ({ page }) => {
    await expect(page.locator('.reveal')).toBeVisible();
  });

  test('Reveal.js is ready', async ({ page }) => {
    const isReady = await page.evaluate(() => window.Reveal.isReady());
    expect(isReady).toBe(true);
  });

  test('has at least 5 slides', async ({ page }) => {
    const total = await getTotalSlides(page);
    expect(total).toBeGreaterThanOrEqual(5);
  });

  test('starts at slide index (0, 0)', async ({ page }) => {
    const indices = await getCurrentSlideIndex(page);
    expect(indices.h).toBe(0);
    expect(indices.v).toBe(0);
  });

  test('can navigate to slide 1', async ({ page }) => {
    await goToSlide(page, 1);
    const indices = await getCurrentSlideIndex(page);
    expect(indices.h).toBe(1);
  });

  test('first slide contains "Welcome" text', async ({ page }) => {
    const slideContent = await page.locator('.reveal .slides section').first().textContent();
    expect(slideContent).toContain('Welcome');
  });

  test('page title matches _meta.yaml title', async ({ page }) => {
    await expect(page).toHaveTitle(/Demo Presentation - Session 1/);
  });
});
