import { test, expect } from '@playwright/test';
import { waitForRevealReady, goToSlide, getTotalSlides } from './helpers/reveal';

test.describe('Mermaid diagrams', () => {
  test('renders at least one mermaid SVG in the presentation', async ({ page }) => {
    await page.goto('/demo/session-1/');
    await waitForRevealReady(page);

    const totalSlides = await getTotalSlides(page);
    let foundMermaidSvg = false;

    for (let i = 0; i < totalSlides; i++) {
      await goToSlide(page, i);
      // Wait for async mermaid rendering
      await page.waitForTimeout(500);

      const svgCount = await page
        .locator('.reveal .slides section svg')
        .count();

      if (svgCount > 0) {
        foundMermaidSvg = true;
        break;
      }
    }

    expect(foundMermaidSvg).toBe(true);
  });
});
