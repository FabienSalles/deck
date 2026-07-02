/**
 * Resize Strategies — Infrastructure
 * DOM-dependent resize strategies using pure config from domain/resize.service.ts.
 */

import type { OverflowInfo, ResizeResult } from '../../domain/reveal.model';
import {
  RESIZE_CLASSES,
  CODE_RESIZE_CONFIG,
  TEXT_RESIZE_CONFIG,
} from '../../domain/constants';
import {
  getCodeBlockConfig,
  getImageResizeThresholds,
  getTextResizeConfig,
  computeMaxIterations,
  computeNextFontSize,
  type CodeBlockConfig,
} from '../../domain/resize.service';

export interface ResizeStrategy {
  canApply(slide: HTMLElement): boolean;
  apply(slide: HTMLElement, overflowInfo: OverflowInfo): Promise<ResizeResult>;
}

// -- Image Resize Strategy --

export class ImageResizeStrategy implements ResizeStrategy {
  constructor(private readonly isPrintMode: boolean) {}

  canApply(slide: HTMLElement): boolean {
    return slide.querySelectorAll('img').length > 0;
  }

  async apply(slide: HTMLElement): Promise<ResizeResult> {
    const images = slide.querySelectorAll('img');
    let imagesResized = false;

    const { threshold, maxPercent } = getImageResizeThresholds(this.isPrintMode);
    const slideHeight = slide.offsetHeight;

    images.forEach((img) => {
      const htmlImg = img as HTMLImageElement;

      if (!htmlImg.complete || htmlImg.naturalHeight === 0) {
        return;
      }

      const imageHeight = htmlImg.offsetHeight;

      if (slideHeight <= 0 || imageHeight <= 0) {
        return;
      }

      if (imageHeight > slideHeight * threshold) {
        const maxHeight = slideHeight * maxPercent;
        htmlImg.style.maxHeight = `${maxHeight}px`;
        htmlImg.style.width = 'auto';
        htmlImg.style.height = 'auto';
        imagesResized = true;
      }
    });

    return { resized: imagesResized, strategy: 'image' };
  }
}

// -- Code Block Resize Strategy --

export class CodeBlockResizeStrategy implements ResizeStrategy {
  constructor(private readonly isPrintMode: boolean) {}

  canApply(slide: HTMLElement): boolean {
    return slide.querySelectorAll('pre').length > 0;
  }

  async apply(slide: HTMLElement, overflowInfo: OverflowInfo): Promise<ResizeResult> {
    const codeBlocks = slide.querySelectorAll('pre');

    if (codeBlocks.length === 0) {
      return { resized: false, strategy: 'code' };
    }

    const slideHeight = slide.offsetHeight;
    const totalCodeHeight = this.calculateTotalCodeHeight(codeBlocks);
    const config = getCodeBlockConfig(overflowInfo.overflowPercent, this.isPrintMode);

    const needsResize =
      totalCodeHeight > slideHeight * config.threshold || overflowInfo.hasOverflow;

    if (!needsResize) {
      return { resized: false, strategy: 'code' };
    }

    let codeResized = false;

    codeBlocks.forEach((pre) => {
      if (this.resizeCodeBlock(pre as HTMLElement, config)) {
        codeResized = true;
      }
    });

    const stillOverflows =
      slide.scrollHeight > slide.offsetHeight + CODE_RESIZE_CONFIG.STILL_OVERFLOWS_THRESHOLD;

    if (stillOverflows) {
      this.applyHeightConstraints(codeBlocks, slideHeight, config.maxHeightPercent);
    }

    return { resized: codeResized, strategy: 'code' };
  }

  private calculateTotalCodeHeight(codeBlocks: NodeListOf<Element>): number {
    let total = 0;

    codeBlocks.forEach((pre) => {
      total += (pre as HTMLElement).offsetHeight;
    });

    return total;
  }

  private resizeCodeBlock(pre: HTMLElement, config: CodeBlockConfig): boolean {
    const code = pre.querySelector('code');

    if (code === null) {
      return false;
    }

    if (!pre.dataset['originalFontSize']) {
      const computedStyle = window.getComputedStyle(code);
      pre.dataset['originalFontSize'] = computedStyle.fontSize;
      pre.dataset['originalPadding'] = computedStyle.padding;
    }

    const currentFontSize = parseFloat(pre.dataset['originalFontSize'] ?? '16');
    const newFontSize = currentFontSize * config.fontReduction;
    code.style.fontSize = `${newFontSize}px`;
    code.style.padding = config.padding;

    if (config.fontReduction <= CODE_RESIZE_CONFIG.MIN_FONT_REDUCTION) {
      code.style.lineHeight = '1.2';
    }

    pre.classList.add(RESIZE_CLASSES.AUTO_RESIZED);

    return true;
  }

  private applyHeightConstraints(
    codeBlocks: NodeListOf<Element>,
    slideHeight: number,
    maxHeightPercent: number,
  ): void {
    const maxHeightPerBlock = (slideHeight * maxHeightPercent) / codeBlocks.length;

    codeBlocks.forEach((pre) => {
      const htmlPre = pre as HTMLElement;
      const code = htmlPre.querySelector('code');

      if (code === null) {
        return;
      }

      if (code.scrollHeight > maxHeightPerBlock) {
        htmlPre.style.maxHeight = `${maxHeightPerBlock}px`;
        htmlPre.style.overflow = this.isPrintMode ? 'hidden' : 'auto';
      }
    });
  }
}

// -- Text Font Size Strategy --

export class TextFontSizeStrategy implements ResizeStrategy {
  constructor(
    private readonly isPrintMode: boolean,
    private readonly minFontSize: number,
    private readonly maxFontSize: number,
    private readonly step: number,
  ) {}

  canApply(): boolean {
    return true;
  }

  async apply(slide: HTMLElement, overflowInfo: OverflowInfo): Promise<ResizeResult> {
    slide.style.fontSize = '';

    if (!overflowInfo.hasOverflow) {
      slide.classList.remove(RESIZE_CLASSES.OVERFLOW_WARNING);

      return { resized: false, strategy: 'text' };
    }

    const config = getTextResizeConfig(
      overflowInfo.overflowPercent,
      this.isPrintMode,
      this.minFontSize,
      this.step,
    );

    let currentSize = this.maxFontSize;
    let iterations = 0;
    const maxIterations = computeMaxIterations(this.maxFontSize, config.minFontSize, config.step);

    while (
      this.hasOverflow(slide, TEXT_RESIZE_CONFIG.OVERFLOW_THRESHOLD) &&
      currentSize > config.minFontSize &&
      iterations < maxIterations
    ) {
      currentSize = computeNextFontSize(currentSize, config.step, config.minFontSize);
      slide.style.fontSize = `${currentSize}em`;
      iterations++;
    }

    const stillOverflows = this.hasOverflow(slide, TEXT_RESIZE_CONFIG.OVERFLOW_WARNING_THRESHOLD);
    const isFragmentFP = stillOverflows && this.isFragmentFalsePositive(slide);

    if (stillOverflows && !isFragmentFP) {
      if (!this.isPrintMode) {
        slide.classList.add(RESIZE_CLASSES.OVERFLOW_WARNING);
      }
    } else {
      slide.classList.remove(RESIZE_CLASSES.OVERFLOW_WARNING);
    }

    return { resized: iterations > 0, strategy: 'text' };
  }

  private hasOverflow(element: HTMLElement, threshold: number): boolean {
    const effectiveThreshold = this.isPrintMode
      ? TEXT_RESIZE_CONFIG.PRINT_OVERFLOW_THRESHOLD
      : threshold;

    return element.scrollHeight > element.offsetHeight + effectiveThreshold;
  }

  private isFragmentFalsePositive(slide: HTMLElement): boolean {
    const fragments = slide.querySelectorAll('.fragment');

    if (fragments.length === 0) {
      return false;
    }

    let totalFragmentHeight = 0;

    fragments.forEach((fragment) => {
      totalFragmentHeight += (fragment as HTMLElement).offsetHeight;
    });

    const overflowAmount = slide.scrollHeight - slide.offsetHeight;
    const estimatedFalseOverflow = totalFragmentHeight - totalFragmentHeight / fragments.length;

    return overflowAmount <= estimatedFalseOverflow;
  }
}

// -- Factory --

export function createResizeStrategies(
  isPrintMode: boolean,
  minFontSize: number,
  maxFontSize: number,
  step: number,
): ResizeStrategy[] {
  return [
    new ImageResizeStrategy(isPrintMode),
    new CodeBlockResizeStrategy(isPrintMode),
    new TextFontSizeStrategy(isPrintMode, minFontSize, maxFontSize, step),
  ];
}
