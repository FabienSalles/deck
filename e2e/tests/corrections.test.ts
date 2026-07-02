import { test, expect } from '@playwright/test';

test.describe('Corrections menu page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/session-1/corrections');
  });

  test('displays "Corrections" heading', async ({ page }) => {
    await expect(page.locator('.menu-content h1')).toHaveText('Corrections');
  });

  test('lists one correction card', async ({ page }) => {
    const cards = page.locator('.exercise-card');
    await expect(cards).toHaveCount(1);
  });

  test('correction card links to individual page', async ({ page }) => {
    await expect(page.locator('.exercise-card').first()).toHaveAttribute(
      'href',
      '/demo/session-1/corrections/01',
    );
  });
});

test.describe('Individual correction page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/session-1/corrections/01');
  });

  test('renders correction content', async ({ page }) => {
    const content = page.locator('.exercise-content');
    await expect(content).toBeVisible();
    await expect(content).toContainText('Correction');
  });

  test('shows position indicator', async ({ page }) => {
    await expect(page.locator('.nav-position')).toHaveText('Correction 1/1');
  });

  test('has back-to-exercise link', async ({ page }) => {
    const btn = page.locator('.back-to-exercise-btn');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute('href', '/demo/session-1/exercices/01');
  });

  test('has navigation back to corrections menu', async ({ page }) => {
    const navBack = page.locator('.nav-back');
    await expect(navBack).toBeVisible();
    await expect(navBack).toHaveAttribute('href', '/demo/session-1/corrections');
  });
});
