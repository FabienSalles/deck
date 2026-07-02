/**
 * Headless Browser Compatibility Service — Infrastructure
 * Fixes for running in headless environments (Decktape/Puppeteer).
 */

import type { Api } from 'reveal.js';
import { isHeadlessBrowser } from './PrintModeService';

const TOOLBAR_HIDE_DELAYS = [0, 500, 1000, 2000] as const;
const HEADLESS_H1_COLOR = '#2563eb';

export function fixH1GradientInHeadless(): void {
  if (!isHeadlessBrowser()) {
    return;
  }

  document.querySelectorAll('.reveal h1').forEach((h1) => {
    const el = h1 as HTMLElement;
    el.style.background = 'none';
    el.style.webkitBackgroundClip = 'unset';
    el.style.webkitTextFillColor = HEADLESS_H1_COLOR;
    el.style.color = HEADLESS_H1_COLOR;
  });
}

export function hideAstroToolbar(): void {
  if (!isHeadlessBrowser()) {
    return;
  }

  const hideToolbar = (): void => {
    const toolbar = document.querySelector('astro-dev-toolbar');

    if (toolbar instanceof HTMLElement) {
      toolbar.style.display = 'none';
    }
  };

  TOOLBAR_HIDE_DELAYS.forEach((delay) => setTimeout(hideToolbar, delay));
}

export function logHeadlessDebugInfo(deck: Api): void {
  if (!isHeadlessBrowser()) {
    return;
  }

  const totalSlides = deck.getTotalSlides();
  const slides = deck.getSlides();
  // eslint-disable-next-line no-console
  console.log(`[Reveal.js] Initialized with ${totalSlides} slides (${slides.length} sections)`);
}

export function patchIsLastSlide(deck: Api): () => void {
  const originalIsLastSlide = deck.isLastSlide.bind(deck);

  deck.isLastSlide = (): boolean => {
    if (originalIsLastSlide()) {
      return true;
    }

    const totalSlides = deck.getTotalSlides();
    const currentSlideNumber = deck.getSlidePastCount() + 1;

    if (currentSlideNumber >= totalSlides) {
      return true;
    }

    const slides = deck.getSlides();
    const currentSlide = deck.getCurrentSlide();

    if (slides.length > 0 && currentSlide === slides[slides.length - 1]) {
      return true;
    }

    return false;
  };

  return () => {
    deck.isLastSlide = originalIsLastSlide;
  };
}

export function applyHeadlessCompatFixes(deck: Api): () => void {
  if (!isHeadlessBrowser()) {
    return () => {};
  }

  logHeadlessDebugInfo(deck);
  hideAstroToolbar();
  fixH1GradientInHeadless();
  const restoreIsLastSlide = patchIsLastSlide(deck);

  return () => {
    restoreIsLastSlide();
  };
}
