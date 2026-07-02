import { describe, it, expect } from 'vitest';
import {
  computeOverflow,
  isOverflowing,
  shouldShowWarning,
  isFragmentFalsePositive,
} from '../../src/reveal/domain/overflow.service';

describe('Overflow Service - Pure overflow detection', () => {
  describe('computeOverflow()', () => {
    it('should report positive overflow when scrollHeight exceeds offsetHeight', () => {
      // GIVEN a slide where content exceeds visible area
      const scrollHeight = 800;
      const offsetHeight = 600;

      // WHEN computing overflow
      const info = computeOverflow(scrollHeight, offsetHeight);

      // THEN it reports overflow with correct amount and percentage
      expect(info.hasOverflow).toBe(true);
      expect(info.overflowAmount).toBe(200);
      expect(info.overflowPercent).toBeCloseTo(200 / 600);
    });

    it('should report no overflow when content fits', () => {
      // GIVEN a slide where content fits within visible area
      const scrollHeight = 500;
      const offsetHeight = 600;

      // WHEN computing overflow
      const info = computeOverflow(scrollHeight, offsetHeight);

      // THEN it reports no overflow
      expect(info.hasOverflow).toBe(false);
      expect(info.overflowAmount).toBe(-100);
      expect(info.overflowPercent).toBeCloseTo(-100 / 600);
    });

    it('should handle zero offsetHeight without dividing by zero', () => {
      // GIVEN a slide with zero height (edge case)
      const scrollHeight = 100;
      const offsetHeight = 0;

      // WHEN computing overflow
      const info = computeOverflow(scrollHeight, offsetHeight);

      // THEN overflowPercent is 0 (not NaN or Infinity)
      expect(info.hasOverflow).toBe(true);
      expect(info.overflowAmount).toBe(100);
      expect(info.overflowPercent).toBe(0);
    });
  });

  describe('isOverflowing()', () => {
    it('should return true when overflow exceeds the threshold', () => {
      // GIVEN dimensions where overflow is 100px (600 + 60 = 660 < 700)
      const scrollHeight = 700;
      const offsetHeight = 600;
      const threshold = 60;

      // WHEN checking overflow in normal mode
      const result = isOverflowing(scrollHeight, offsetHeight, threshold, false);

      // THEN it reports overflowing
      expect(result).toBe(true);
    });

    it('should return false when overflow is within the threshold', () => {
      // GIVEN dimensions where overflow is 50px (600 + 60 = 660 > 650)
      const scrollHeight = 650;
      const offsetHeight = 600;
      const threshold = 60;

      // WHEN checking overflow in normal mode
      const result = isOverflowing(scrollHeight, offsetHeight, threshold, false);

      // THEN it does not report overflowing
      expect(result).toBe(false);
    });

    it('should use a stricter threshold (10px) in print mode', () => {
      // GIVEN dimensions where overflow is 20px
      const scrollHeight = 620;
      const offsetHeight = 600;
      const threshold = 60;

      // WHEN checking in print mode (threshold becomes 10)
      const result = isOverflowing(scrollHeight, offsetHeight, threshold, true);

      // THEN it reports overflowing (620 > 600 + 10)
      expect(result).toBe(true);
    });

    it('should not report overflow within 10px in print mode', () => {
      // GIVEN dimensions where overflow is 5px
      const scrollHeight = 605;
      const offsetHeight = 600;
      const threshold = 60;

      // WHEN checking in print mode
      const result = isOverflowing(scrollHeight, offsetHeight, threshold, true);

      // THEN it does not report overflowing (605 < 600 + 10)
      expect(result).toBe(false);
    });
  });

  describe('shouldShowWarning()', () => {
    it('should return true when overflow exceeds warning threshold', () => {
      // GIVEN dimensions with 150px overflow and a 100px warning threshold
      const scrollHeight = 750;
      const offsetHeight = 600;
      const warningThreshold = 100;

      // WHEN checking warning
      const result = shouldShowWarning(scrollHeight, offsetHeight, warningThreshold);

      // THEN warning should show
      expect(result).toBe(true);
    });

    it('should return false when overflow is within warning threshold', () => {
      // GIVEN dimensions with 50px overflow and a 100px warning threshold
      const scrollHeight = 650;
      const offsetHeight = 600;
      const warningThreshold = 100;

      // WHEN checking warning
      const result = shouldShowWarning(scrollHeight, offsetHeight, warningThreshold);

      // THEN warning should not show
      expect(result).toBe(false);
    });
  });

  describe('isFragmentFalsePositive()', () => {
    it('should return false when there are no fragments', () => {
      // GIVEN an overflow with no fragments
      const overflowAmount = 100;
      const fragmentHeights: number[] = [];

      // WHEN checking for false positive
      const result = isFragmentFalsePositive(overflowAmount, fragmentHeights);

      // THEN it is not a false positive (real overflow)
      expect(result).toBe(false);
    });

    it('should detect false positive when overflow comes from stacked fragments', () => {
      // GIVEN 3 fragments of 100px each
      // totalFragmentHeight = 300, avgFragmentHeight = 100
      // estimatedFalseOverflow = 300 - 100 = 200
      // overflowAmount (150) <= estimatedFalseOverflow (200) => false positive
      const overflowAmount = 150;
      const fragmentHeights = [100, 100, 100];

      // WHEN checking for false positive
      const result = isFragmentFalsePositive(overflowAmount, fragmentHeights);

      // THEN it is a false positive (fragments cause the apparent overflow)
      expect(result).toBe(true);
    });

    it('should detect real overflow even with fragments present', () => {
      // GIVEN 3 fragments of 100px each
      // totalFragmentHeight = 300, avgFragmentHeight = 100
      // estimatedFalseOverflow = 300 - 100 = 200
      // overflowAmount (250) > estimatedFalseOverflow (200) => real overflow
      const overflowAmount = 250;
      const fragmentHeights = [100, 100, 100];

      // WHEN checking for false positive
      const result = isFragmentFalsePositive(overflowAmount, fragmentHeights);

      // THEN it is NOT a false positive (real overflow beyond fragment stacking)
      expect(result).toBe(false);
    });
  });
});
