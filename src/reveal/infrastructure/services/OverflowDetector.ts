/**
 * Overflow Detector — Infrastructure
 * DOM-dependent overflow detection using element dimensions.
 * Pure calculation logic delegated to domain/overflow.service.ts.
 */

import type { OverflowInfo } from '../../domain/reveal.model';
import { computeOverflow } from '../../domain/overflow.service';

export interface OverflowDetector {
  hasOverflow(element: HTMLElement, threshold: number): boolean;
  getOverflowInfo(element: HTMLElement): OverflowInfo;
}

export class DefaultOverflowDetector implements OverflowDetector {
  private readonly overflowCache = new WeakMap<HTMLElement, { info: OverflowInfo; timestamp: number }>();
  private readonly CACHE_TTL = 100;

  constructor(private readonly isPrintMode: boolean) {}

  hasOverflow(element: HTMLElement, threshold: number): boolean {
    const effectiveThreshold = this.isPrintMode ? 10 : threshold;

    return element.scrollHeight > element.offsetHeight + effectiveThreshold;
  }

  getOverflowInfo(element: HTMLElement): OverflowInfo {
    const now = Date.now();
    const cached = this.overflowCache.get(element);

    if (cached !== undefined && now - cached.timestamp < this.CACHE_TTL) {
      return cached.info;
    }

    const info = computeOverflow(element.scrollHeight, element.offsetHeight);

    this.overflowCache.set(element, { info, timestamp: now });

    return info;
  }
}

export function createOverflowDetector(isPrintMode: boolean): OverflowDetector {
  return new DefaultOverflowDetector(isPrintMode);
}
