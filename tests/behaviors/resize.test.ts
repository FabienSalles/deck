import { describe, it, expect } from 'vitest';
import {
  getCodeBlockConfig,
  needsCodeResize,
  getTextResizeConfig,
  computeMaxIterations,
  computeNextFontSize,
  getImageResizeThresholds,
  needsImageResize,
} from '../../src/reveal/domain/resize.service';
import {
  CODE_RESIZE_CONFIG,
  IMAGE_RESIZE_THRESHOLDS,
} from '../../src/reveal/domain/constants';

describe('Resize Service - Code block config', () => {
  describe('getCodeBlockConfig()', () => {
    it('should return normal config when not in print mode', () => {
      // GIVEN normal mode (not print)
      const overflowPercent = 0.5;

      // WHEN getting code block config
      const config = getCodeBlockConfig(overflowPercent, false);

      // THEN it returns the base (non-print) configuration
      expect(config.threshold).toBe(CODE_RESIZE_CONFIG.BASE_THRESHOLD);
      expect(config.fontReduction).toBe(CODE_RESIZE_CONFIG.REDUCTION_LIGHT);
      expect(config.padding).toBe(CODE_RESIZE_CONFIG.PADDING_NORMAL);
      expect(config.maxHeightPercent).toBe(CODE_RESIZE_CONFIG.MAX_HEIGHT_NORMAL);
    });

    it('should return light print config for mild overflow in print mode', () => {
      // GIVEN print mode with mild overflow (below moderate threshold)
      const overflowPercent = 0.1;

      // WHEN getting code block config
      const config = getCodeBlockConfig(overflowPercent, true);

      // THEN it returns the light print configuration
      expect(config.threshold).toBe(CODE_RESIZE_CONFIG.PRINT_THRESHOLD_LIGHT);
      expect(config.fontReduction).toBe(CODE_RESIZE_CONFIG.REDUCTION_MODERATE);
      expect(config.padding).toBe(CODE_RESIZE_CONFIG.PADDING_LIGHT);
      expect(config.maxHeightPercent).toBe(CODE_RESIZE_CONFIG.MAX_HEIGHT_LIGHT);
    });

    it('should return moderate print config for moderate overflow', () => {
      // GIVEN print mode with moderate overflow (above moderate, below heavy)
      const overflowPercent = 0.2;

      // WHEN getting code block config
      const config = getCodeBlockConfig(overflowPercent, true);

      // THEN it returns the moderate print configuration
      expect(config.threshold).toBe(CODE_RESIZE_CONFIG.PRINT_THRESHOLD_MODERATE);
      expect(config.fontReduction).toBe(CODE_RESIZE_CONFIG.REDUCTION_HEAVY);
      expect(config.padding).toBe(CODE_RESIZE_CONFIG.PADDING_MODERATE);
      expect(config.maxHeightPercent).toBe(CODE_RESIZE_CONFIG.MAX_HEIGHT_MODERATE);
    });

    it('should return heavy print config for severe overflow', () => {
      // GIVEN print mode with severe overflow (above heavy threshold)
      const overflowPercent = 0.5;

      // WHEN getting code block config
      const config = getCodeBlockConfig(overflowPercent, true);

      // THEN it returns the heavy print configuration
      expect(config.threshold).toBe(CODE_RESIZE_CONFIG.PRINT_THRESHOLD_HEAVY);
      expect(config.fontReduction).toBe(CODE_RESIZE_CONFIG.REDUCTION_VERY_HEAVY);
      expect(config.padding).toBe(CODE_RESIZE_CONFIG.PADDING_HEAVY);
      expect(config.maxHeightPercent).toBe(CODE_RESIZE_CONFIG.MAX_HEIGHT_HEAVY);
    });
  });

  describe('needsCodeResize()', () => {
    it('should return true when code takes too much vertical space', () => {
      // GIVEN a code block taller than threshold * slideHeight
      const totalCodeHeight = 500;
      const slideHeight = 600;
      const threshold = 0.4;

      // WHEN checking if resize is needed
      const result = needsCodeResize(totalCodeHeight, slideHeight, threshold, false);

      // THEN it needs resize (500 > 600 * 0.4 = 240)
      expect(result).toBe(true);
    });

    it('should return true when slide is overflowing regardless of code size', () => {
      // GIVEN a small code block but the slide overflows
      const totalCodeHeight = 100;
      const slideHeight = 600;
      const threshold = 0.4;

      // WHEN checking with hasOverflow=true
      const result = needsCodeResize(totalCodeHeight, slideHeight, threshold, true);

      // THEN it needs resize because of overflow
      expect(result).toBe(true);
    });

    it('should return false when code fits and no overflow', () => {
      // GIVEN a code block that fits within threshold
      const totalCodeHeight = 200;
      const slideHeight = 600;
      const threshold = 0.4;

      // WHEN checking with no overflow
      const result = needsCodeResize(totalCodeHeight, slideHeight, threshold, false);

      // THEN no resize needed (200 < 600 * 0.4 = 240)
      expect(result).toBe(false);
    });
  });
});

describe('Resize Service - Text resize config', () => {
  describe('getTextResizeConfig()', () => {
    it('should return default config in normal mode', () => {
      // GIVEN normal mode with custom defaults
      const defaultMinFontSize = 0.6;
      const defaultStep = 0.05;

      // WHEN getting text resize config
      const config = getTextResizeConfig(0.2, false, defaultMinFontSize, defaultStep);

      // THEN it returns the provided defaults
      expect(config.minFontSize).toBe(0.6);
      expect(config.step).toBe(0.05);
    });

    it('should return light print config for mild overflow in print mode', () => {
      // GIVEN print mode with mild overflow
      const config = getTextResizeConfig(0.1, true, 0.6, 0.05);

      // THEN it returns light print configuration
      expect(config.minFontSize).toBe(0.55);
      expect(config.step).toBe(0.06);
    });

    it('should return moderate print config for moderate overflow', () => {
      // GIVEN print mode with moderate overflow
      const config = getTextResizeConfig(0.2, true, 0.6, 0.05);

      // THEN it returns moderate print configuration
      expect(config.minFontSize).toBe(0.5);
      expect(config.step).toBe(0.08);
    });

    it('should return heavy print config for severe overflow', () => {
      // GIVEN print mode with severe overflow
      const config = getTextResizeConfig(0.5, true, 0.6, 0.05);

      // THEN it returns heavy print configuration
      expect(config.minFontSize).toBe(0.45);
      expect(config.step).toBe(0.1);
    });
  });

  describe('computeMaxIterations()', () => {
    it('should calculate the number of steps from max to min font size', () => {
      // GIVEN a range from 1.0 to 0.6 with step 0.05
      const maxFontSize = 1.0;
      const minFontSize = 0.6;
      const step = 0.05;

      // WHEN computing max iterations
      const iterations = computeMaxIterations(maxFontSize, minFontSize, step);

      // THEN it returns ceil((1.0 - 0.6) / 0.05) = ceil(8) = 8
      expect(iterations).toBe(8);
    });

    it('should round up when range is not evenly divisible by step', () => {
      // GIVEN a range that does not divide evenly
      const maxFontSize = 1.0;
      const minFontSize = 0.55;
      const step = 0.06;

      // WHEN computing max iterations
      const iterations = computeMaxIterations(maxFontSize, minFontSize, step);

      // THEN it rounds up: ceil((1.0 - 0.55) / 0.06) = ceil(7.5) = 8
      expect(iterations).toBe(8);
    });
  });

  describe('computeNextFontSize()', () => {
    it('should reduce font size by the step', () => {
      // GIVEN current size and step
      const currentSize = 0.9;
      const step = 0.05;
      const minFontSize = 0.6;

      // WHEN computing next font size
      const next = computeNextFontSize(currentSize, step, minFontSize);

      // THEN it reduces by step
      expect(next).toBeCloseTo(0.85);
    });

    it('should floor at the minimum font size', () => {
      // GIVEN a current size close to minimum
      const currentSize = 0.62;
      const step = 0.05;
      const minFontSize = 0.6;

      // WHEN computing next font size
      const next = computeNextFontSize(currentSize, step, minFontSize);

      // THEN it floors at minimum: max(0.62 - 0.05, 0.6) = max(0.57, 0.6) = 0.6
      expect(next).toBeCloseTo(0.6);
    });
  });
});

describe('Resize Service - Image resize', () => {
  describe('getImageResizeThresholds()', () => {
    it('should return normal thresholds when not in print mode', () => {
      // GIVEN normal mode
      const thresholds = getImageResizeThresholds(false);

      // THEN it returns normal mode values
      expect(thresholds.threshold).toBe(IMAGE_RESIZE_THRESHOLDS.NORMAL_MODE);
      expect(thresholds.maxPercent).toBe(IMAGE_RESIZE_THRESHOLDS.MAX_PERCENT_NORMAL);
    });

    it('should return stricter thresholds in print mode', () => {
      // GIVEN print mode
      const thresholds = getImageResizeThresholds(true);

      // THEN it returns print mode values (stricter)
      expect(thresholds.threshold).toBe(IMAGE_RESIZE_THRESHOLDS.PRINT_MODE);
      expect(thresholds.maxPercent).toBe(IMAGE_RESIZE_THRESHOLDS.MAX_PERCENT_PRINT);
    });
  });

  describe('needsImageResize()', () => {
    it('should return true when image is taller than threshold ratio of slide', () => {
      // GIVEN an image taking 80% of slide height with a 75% threshold
      const imageHeight = 480;
      const slideHeight = 600;
      const threshold = 0.75;

      // WHEN checking if resize is needed
      const result = needsImageResize(imageHeight, slideHeight, threshold);

      // THEN it needs resize (480 > 600 * 0.75 = 450)
      expect(result).toBe(true);
    });

    it('should return false when image fits within threshold', () => {
      // GIVEN an image taking 60% of slide height with a 75% threshold
      const imageHeight = 360;
      const slideHeight = 600;
      const threshold = 0.75;

      // WHEN checking if resize is needed
      const result = needsImageResize(imageHeight, slideHeight, threshold);

      // THEN no resize needed (360 < 600 * 0.75 = 450)
      expect(result).toBe(false);
    });

    it('should return false when slide height is zero', () => {
      // GIVEN zero slide height (edge case)
      const result = needsImageResize(100, 0, 0.75);

      // THEN it returns false (guard against division issues)
      expect(result).toBe(false);
    });

    it('should return false when image height is zero', () => {
      // GIVEN zero image height
      const result = needsImageResize(0, 600, 0.75);

      // THEN it returns false
      expect(result).toBe(false);
    });
  });
});
