import type { Page } from '@playwright/test';

/**
 * Wait until Reveal.js is fully initialized and ready.
 * Polls `window.Reveal.isReady()` up to a timeout.
 */
export async function waitForRevealReady(page: Page, timeout = 15_000): Promise<void> {
  await page.waitForFunction(
    () => typeof window.Reveal !== 'undefined' && window.Reveal.isReady(),
    { timeout },
  );
}

/**
 * Navigate to a specific slide by horizontal (h) and vertical (v) index.
 */
export async function goToSlide(page: Page, h: number, v = 0): Promise<void> {
  await page.evaluate(([h, v]) => window.Reveal.slide(h, v), [h, v] as const);
  // Small pause for transition
  await page.waitForTimeout(300);
}

/**
 * Get the total number of horizontal slides.
 */
export async function getTotalSlides(page: Page): Promise<number> {
  return page.evaluate(() => window.Reveal.getTotalSlides());
}

/**
 * Get the current slide indices { h, v, f }.
 */
export async function getCurrentSlideIndex(
  page: Page,
): Promise<{ h: number; v: number; f: number }> {
  return page.evaluate(() => window.Reveal.getIndices());
}

// Extend Window type for Reveal.js globals
declare global {
  interface Window {
    Reveal: {
      isReady(): boolean;
      slide(h: number, v: number, f?: number): void;
      getTotalSlides(): number;
      getIndices(): { h: number; v: number; f: number };
    };
  }
}
