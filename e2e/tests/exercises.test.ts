import { test, expect } from '@playwright/test';

test.describe('Exercises menu page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/session-1/exercices');
  });

  test('displays "Exercises" heading', async ({ page }) => {
    await expect(page.locator('.menu-content h1')).toHaveText('Exercises');
  });

  test('lists one exercise card', async ({ page }) => {
    const cards = page.locator('.exercise-card');
    await expect(cards).toHaveCount(1);
  });

  test('exercise card shows number and title', async ({ page }) => {
    const card = page.locator('.exercise-card').first();
    await expect(card.locator('.exercise-number')).toHaveText('01');
    await expect(card.locator('.exercise-title')).toContainText('Getting Started');
  });

  test('exercise card links to individual exercise page', async ({ page }) => {
    await expect(page.locator('.exercise-card').first()).toHaveAttribute(
      'href',
      '/demo/session-1/exercices/01',
    );
  });

  test('shows formation badge', async ({ page }) => {
    await expect(page.locator('.formation-badge')).toHaveText('Demo Presentation - Session 1');
  });

  test('has back link to home', async ({ page }) => {
    const backLink = page.locator('.back-link');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/');
  });
});

test.describe('Individual exercise page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/session-1/exercices/01');
  });

  test('renders exercise content', async ({ page }) => {
    const content = page.locator('.exercise-content');
    await expect(content).toBeVisible();
    await expect(content).toContainText('Getting Started');
  });

  test('shows position indicator', async ({ page }) => {
    await expect(page.locator('.nav-position')).toHaveText('Exercise 1/1');
  });

  test('has navigation back to exercises menu', async ({ page }) => {
    const navBack = page.locator('.nav-back');
    await expect(navBack).toBeVisible();
    await expect(navBack).toHaveAttribute('href', '/demo/session-1/exercices');
  });

  test('has correction link', async ({ page }) => {
    const correctionBtn = page.locator('.correction-btn');
    await expect(correctionBtn).toBeVisible();
    await expect(correctionBtn).toHaveAttribute('href', '/demo/session-1/corrections/01');
  });
});
