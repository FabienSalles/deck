import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the page heading and subtitle', async ({ page }) => {
    await expect(page.locator('.header h1')).toHaveText('Presentations');
    await expect(page.locator('.header .subtitle')).toBeVisible();
  });

  test('displays one formation group named DEMO', async ({ page }) => {
    const groups = page.locator('.formation-group');
    await expect(groups).toHaveCount(1);
    await expect(groups.first().locator('.group-header h2')).toHaveText('DEMO');
  });

  test('main session card has title, slides link, exercises link, and corrections link', async ({
    page,
  }) => {
    // Find the card that has the exercises link (the main presentation card)
    const card = page.locator('.day-card', { has: page.locator('.link-btn.exercices') });
    await expect(card).toHaveCount(1);
    await expect(card.locator('h3')).toHaveText('Demo Presentation - Session 1');
    await expect(card.locator('.link-btn.primary')).toHaveAttribute('href', '/demo/session-1/');
    await expect(card.locator('.link-btn.exercices')).toHaveAttribute(
      'href',
      '/demo/session-1/exercices',
    );
    await expect(card.locator('.link-btn.corrections')).toHaveAttribute(
      'href',
      '/demo/session-1/corrections',
    );
  });

  test('displays tags from _meta.yaml', async ({ page }) => {
    const tags = page.locator('.tag');
    await expect(tags.count()).resolves.toBeGreaterThanOrEqual(2);
    await expect(tags.first()).toHaveText('demo');
  });
});
