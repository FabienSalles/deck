/**
 * Resize Configuration — Pure Domain Service
 * Pure functions that compute resize parameters from overflow state.
 * No DOM access — takes numeric inputs, returns configuration objects.
 */

import { CODE_RESIZE_CONFIG, TEXT_RESIZE_CONFIG } from './constants';

// -- Code Block Resize Config --

export type CodeBlockConfig = {
  readonly threshold: number;
  readonly fontReduction: number;
  readonly padding: string;
  readonly maxHeightPercent: number;
};

/**
 * Selects the appropriate code block resize configuration
 * based on print mode and overflow severity.
 */
export function getCodeBlockConfig(
  overflowPercent: number,
  isPrintMode: boolean,
): CodeBlockConfig {
  if (!isPrintMode) {
    return {
      threshold: CODE_RESIZE_CONFIG.BASE_THRESHOLD,
      fontReduction: CODE_RESIZE_CONFIG.REDUCTION_LIGHT,
      padding: CODE_RESIZE_CONFIG.PADDING_NORMAL,
      maxHeightPercent: CODE_RESIZE_CONFIG.MAX_HEIGHT_NORMAL,
    };
  }

  if (overflowPercent > CODE_RESIZE_CONFIG.HEAVY_OVERFLOW_THRESHOLD) {
    return {
      threshold: CODE_RESIZE_CONFIG.PRINT_THRESHOLD_HEAVY,
      fontReduction: CODE_RESIZE_CONFIG.REDUCTION_VERY_HEAVY,
      padding: CODE_RESIZE_CONFIG.PADDING_HEAVY,
      maxHeightPercent: CODE_RESIZE_CONFIG.MAX_HEIGHT_HEAVY,
    };
  }

  if (overflowPercent > CODE_RESIZE_CONFIG.MODERATE_OVERFLOW_THRESHOLD) {
    return {
      threshold: CODE_RESIZE_CONFIG.PRINT_THRESHOLD_MODERATE,
      fontReduction: CODE_RESIZE_CONFIG.REDUCTION_HEAVY,
      padding: CODE_RESIZE_CONFIG.PADDING_MODERATE,
      maxHeightPercent: CODE_RESIZE_CONFIG.MAX_HEIGHT_MODERATE,
    };
  }

  return {
    threshold: CODE_RESIZE_CONFIG.PRINT_THRESHOLD_LIGHT,
    fontReduction: CODE_RESIZE_CONFIG.REDUCTION_MODERATE,
    padding: CODE_RESIZE_CONFIG.PADDING_LIGHT,
    maxHeightPercent: CODE_RESIZE_CONFIG.MAX_HEIGHT_LIGHT,
  };
}

/**
 * Determines if a code block needs resize based on its height
 * relative to the slide height and the current overflow state.
 */
export function needsCodeResize(
  totalCodeHeight: number,
  slideHeight: number,
  threshold: number,
  hasOverflow: boolean,
): boolean {
  return totalCodeHeight > slideHeight * threshold || hasOverflow;
}

/**
 * Computes the new font size for a code block after reduction.
 */
export function computeCodeFontSize(
  originalFontSize: number,
  fontReduction: number,
): number {
  return originalFontSize * fontReduction;
}

/**
 * Determines if line height should be compressed for a code block.
 */
export function shouldCompressLineHeight(fontReduction: number): boolean {
  return fontReduction <= CODE_RESIZE_CONFIG.MIN_FONT_REDUCTION;
}

/**
 * Computes the max height per code block when height constraints are needed.
 */
export function computeMaxHeightPerBlock(
  slideHeight: number,
  maxHeightPercent: number,
  blockCount: number,
): number {
  return (slideHeight * maxHeightPercent) / blockCount;
}

// -- Text (Global Font Size) Resize Config --

export type TextResizeConfig = {
  readonly minFontSize: number;
  readonly step: number;
};

/**
 * Selects the text resize configuration based on print mode
 * and overflow severity.
 */
export function getTextResizeConfig(
  overflowPercent: number,
  isPrintMode: boolean,
  defaultMinFontSize: number,
  defaultStep: number,
): TextResizeConfig {
  if (!isPrintMode) {
    return { minFontSize: defaultMinFontSize, step: defaultStep };
  }

  if (overflowPercent > TEXT_RESIZE_CONFIG.HEAVY_OVERFLOW_THRESHOLD) {
    return {
      minFontSize: TEXT_RESIZE_CONFIG.PRINT_MIN_FONT_HEAVY,
      step: TEXT_RESIZE_CONFIG.PRINT_STEP_HEAVY,
    };
  }

  if (overflowPercent > TEXT_RESIZE_CONFIG.MODERATE_OVERFLOW_THRESHOLD) {
    return {
      minFontSize: TEXT_RESIZE_CONFIG.PRINT_MIN_FONT_MODERATE,
      step: TEXT_RESIZE_CONFIG.PRINT_STEP_MODERATE,
    };
  }

  return {
    minFontSize: TEXT_RESIZE_CONFIG.PRINT_MIN_FONT_LIGHT,
    step: TEXT_RESIZE_CONFIG.PRINT_STEP_LIGHT,
  };
}

/**
 * Computes the maximum number of reduction iterations.
 */
export function computeMaxIterations(
  maxFontSize: number,
  minFontSize: number,
  step: number,
): number {
  return Math.ceil((maxFontSize - minFontSize) / step);
}

/**
 * Computes the next font size in a reduction iteration.
 */
export function computeNextFontSize(
  currentSize: number,
  step: number,
  minFontSize: number,
): number {
  return Math.max(currentSize - step, minFontSize);
}

// -- Image Resize Config --

import { IMAGE_RESIZE_THRESHOLDS } from './constants';

export type ImageResizeThresholds = {
  readonly threshold: number;
  readonly maxPercent: number;
};

/**
 * Returns the image resize thresholds for normal or print mode.
 */
export function getImageResizeThresholds(
  isPrintMode: boolean,
): ImageResizeThresholds {
  return {
    threshold: isPrintMode
      ? IMAGE_RESIZE_THRESHOLDS.PRINT_MODE
      : IMAGE_RESIZE_THRESHOLDS.NORMAL_MODE,
    maxPercent: isPrintMode
      ? IMAGE_RESIZE_THRESHOLDS.MAX_PERCENT_PRINT
      : IMAGE_RESIZE_THRESHOLDS.MAX_PERCENT_NORMAL,
  };
}

/**
 * Determines if an image needs to be resized based on its height
 * relative to the slide height.
 */
export function needsImageResize(
  imageHeight: number,
  slideHeight: number,
  threshold: number,
): boolean {
  if (slideHeight <= 0 || imageHeight <= 0) {
    return false;
  }

  return imageHeight > slideHeight * threshold;
}

/**
 * Computes the max height for an image after resize.
 */
export function computeImageMaxHeight(
  slideHeight: number,
  maxPercent: number,
): number {
  return slideHeight * maxPercent;
}
