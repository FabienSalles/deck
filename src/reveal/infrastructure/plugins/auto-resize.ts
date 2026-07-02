/**
 * Auto-Resize Plugin — Infrastructure
 * Automatically adjusts slide content to prevent overflow.
 *
 * Strategy pipeline: Image → Code Block → Text Font Size
 */

import type { Api, Plugin } from 'reveal.js';
import { DEFAULT_RESIZE_OPTIONS, RESIZE_CLASSES } from '../../domain/constants';
import { getPrintModeService, isHeadlessBrowser } from '../services/PrintModeService';
import { waitForImages, nextFrame, waitForLayout } from '../services/DomUtilsService';
import { createOverflowDetector } from '../services/OverflowDetector';
import { createResizeStrategies, type ResizeStrategy } from '../services/ResizeStrategies';

type ResizeOptions = {
  minFontSize?: number;
  maxFontSize?: number;
  step?: number;
  threshold?: number;
};

class SlideResizer {
  private readonly options: Required<ResizeOptions>;
  private resizeObserver: ResizeObserver | null = null;
  private readonly processedSlides = new WeakSet<HTMLElement>();
  private readonly isPrintMode: boolean;
  private readonly isExportMode: boolean;
  private readonly overflowDetector;
  private readonly resizeStrategies: ResizeStrategy[];

  constructor(options: ResizeOptions = {}) {
    this.options = { ...DEFAULT_RESIZE_OPTIONS, ...options };
    const printModeService = getPrintModeService();
    this.isPrintMode = printModeService.isPrintMode();
    this.isExportMode = printModeService.isExportMode();

    this.overflowDetector = createOverflowDetector(this.isExportMode);
    this.resizeStrategies = createResizeStrategies(
      this.isExportMode,
      this.options.minFontSize,
      this.options.maxFontSize,
      this.options.step,
    );
  }

  private shouldSkipSlide(slide: HTMLElement): boolean {
    if (this.isPrintMode) {
      return true;
    }

    return (
      slide.classList.contains(RESIZE_CLASSES.NO_AUTO_RESIZE) ||
      slide.classList.contains(RESIZE_CLASSES.SMALLEST_CONTENT) ||
      slide.classList.contains(RESIZE_CLASSES.SMALLER_CONTENT) ||
      slide.classList.contains(RESIZE_CLASSES.SMALL_CONTENT)
    );
  }

  async adjustSlideSize(slide: HTMLElement): Promise<void> {
    if (this.shouldSkipSlide(slide)) {
      return;
    }

    const overflowInfo = this.overflowDetector.getOverflowInfo(slide);

    for (const strategy of this.resizeStrategies) {
      if (strategy.canApply(slide)) {
        const result = await strategy.apply(slide, overflowInfo);

        if (result.resized) {
          await waitForLayout();
        }
      }
    }

    this.processedSlides.add(slide);
  }

  observeSlides(slides: HTMLElement[]): void {
    if (slides.length === 0) {
      return;
    }

    this.disconnect();

    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const slide = entry.target as HTMLElement;

        nextFrame().then(() => {
          this.adjustSlideSize(slide);
        });
      });
    });

    slides.forEach((slide) => {
      this.resizeObserver?.observe(slide);

      waitForImages(slide).then(() => {
        nextFrame().then(() => {
          this.adjustSlideSize(slide);
        });
      });
    });
  }

  disconnect(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }
}

async function preResizeAllSlides(slides: HTMLElement[], resizer: SlideResizer): Promise<void> {
  await Promise.all(slides.map((slide) => waitForImages(slide)));

  await new Promise((resolve) => setTimeout(resolve, 100));

  for (const slide of slides) {
    await resizer.adjustSlideSize(slide);
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  for (const slide of slides) {
    await resizer.adjustSlideSize(slide);
  }
}

export function AutoResizePlugin(options: ResizeOptions = {}): Plugin {
  let resizer: SlideResizer | null = null;

  return {
    id: 'auto-resize',

    init: (deck: Api): void => {
      resizer = new SlideResizer(options);
      const isHeadless = isHeadlessBrowser();

      const initializeResizer = async (): Promise<void> => {
        const slides = deck.getSlides() as HTMLElement[];

        if (slides.length === 0) {
          return;
        }

        if (isHeadless && resizer !== null) {
          await preResizeAllSlides(slides, resizer);
        } else {
          resizer?.observeSlides(slides);
        }
      };

      deck.on('ready', () => {
        if (isHeadless) {
          initializeResizer();
        } else {
          setTimeout(initializeResizer, 100);
        }
      });

      deck.on('slidechanged', () => {
        const currentSlide = deck.getCurrentSlide() as HTMLElement;

        if (currentSlide !== null) {
          if (isHeadless) {
            resizer?.adjustSlideSize(currentSlide);
          } else {
            nextFrame().then(() => {
              resizer?.adjustSlideSize(currentSlide);
            });
          }
        }
      });

      deck.on('destroy', () => {
        resizer?.disconnect();
      });
    },
  };
}
