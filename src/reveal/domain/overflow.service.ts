/**
 * Overflow Detection — Pure Domain Service
 * Pure calculation functions for overflow detection.
 * No DOM access — takes numeric inputs, returns computed results.
 */

import type { OverflowInfo } from './reveal.model';

/**
 * Computes overflow information from raw dimensions.
 */
export function computeOverflow(
  scrollHeight: number,
  offsetHeight: number,
): OverflowInfo {
  const overflowAmount = scrollHeight - offsetHeight;
  const overflowPercent = offsetHeight > 0 ? overflowAmount / offsetHeight : 0;

  return {
    hasOverflow: overflowAmount > 0,
    overflowAmount,
    overflowPercent,
  };
}

/**
 * Checks if content overflows beyond a threshold.
 * In print mode, uses a stricter threshold (10px vs custom).
 */
export function isOverflowing(
  scrollHeight: number,
  offsetHeight: number,
  threshold: number,
  isPrintMode: boolean,
): boolean {
  const effectiveThreshold = isPrintMode ? 10 : threshold;

  return scrollHeight > offsetHeight + effectiveThreshold;
}

/**
 * Checks if overflow is severe enough to trigger a warning.
 */
export function shouldShowWarning(
  scrollHeight: number,
  offsetHeight: number,
  warningThreshold: number,
): boolean {
  return scrollHeight > offsetHeight + warningThreshold;
}

/**
 * Detects if overflow is a false positive caused by hidden fragments.
 *
 * When Reveal.js fragments are revealed one at a time, `scrollHeight`
 * includes ALL fragments (even hidden ones), making the detector see
 * overflow that doesn't exist when fragments are shown progressively.
 *
 * @param overflowAmount - scrollHeight - offsetHeight
 * @param fragmentHeights - Heights of all fragment elements
 */
export function isFragmentFalsePositive(
  overflowAmount: number,
  fragmentHeights: readonly number[],
): boolean {
  if (fragmentHeights.length === 0) {
    return false;
  }

  const totalFragmentHeight = fragmentHeights.reduce((sum, h) => sum + h, 0);
  const avgFragmentHeight = totalFragmentHeight / fragmentHeights.length;
  const estimatedFalseOverflow = totalFragmentHeight - avgFragmentHeight;

  return overflowAmount <= estimatedFalseOverflow;
}
