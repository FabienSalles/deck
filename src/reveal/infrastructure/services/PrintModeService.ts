/**
 * Print Mode Service — Infrastructure
 * Browser-dependent print mode and headless browser detection.
 *
 * Architecture:
 * - Domain types (PrintModeEnvironment, PrintModeService) in domain/reveal.model.ts
 * - Browser implementation (BrowserEnvironment, WindowPrintModeService) here
 * - Factory + cached singleton pattern for production use
 */

import type {
  PrintModeEnvironment,
  PrintModeService,
} from '../../domain/reveal.model';

/**
 * Browser environment — reads navigator, document, window.
 */
export class BrowserEnvironment implements PrintModeEnvironment {
  getUserAgent(): string {
    return navigator.userAgent;
  }

  getBodyClassList(): { contains(className: string): boolean } {
    return document.body.classList;
  }

  getLocationSearch(): string {
    return window.location.search;
  }
}

/**
 * Print mode detection implementation.
 */
export class WindowPrintModeService implements PrintModeService {
  private readonly listeners = new Set<(isPrint: boolean) => void>();
  private readonly _isPrintMode: boolean;
  private readonly _isHeadless: boolean;

  constructor(private readonly env: PrintModeEnvironment = new BrowserEnvironment()) {
    this._isHeadless = /HeadlessChrome/i.test(this.env.getUserAgent());
    this._isPrintMode =
      this.env.getBodyClassList().contains('print-pdf') ||
      /print-pdf/gi.test(this.env.getLocationSearch());
  }

  isPrintMode(): boolean {
    return this._isPrintMode;
  }

  isHeadlessBrowser(): boolean {
    return this._isHeadless;
  }

  isExportMode(): boolean {
    return this._isPrintMode || this._isHeadless;
  }

  subscribe(listener: (isPrint: boolean) => void): () => void {
    this.listeners.add(listener);

    return () => this.listeners.delete(listener);
  }
}

// -- Cached Singleton --

let cachedService: PrintModeService | null = null;

export function createPrintModeService(
  env: PrintModeEnvironment = new BrowserEnvironment(),
): PrintModeService {
  return new WindowPrintModeService(env);
}

export function getPrintModeService(): PrintModeService {
  if (cachedService === null) {
    cachedService = createPrintModeService();
  }

  return cachedService;
}

export function resetPrintModeService(): void {
  cachedService = null;
}

// -- Convenience Functions --

export function isPrintMode(): boolean {
  return getPrintModeService().isPrintMode();
}

export function isHeadlessBrowser(): boolean {
  return getPrintModeService().isHeadlessBrowser();
}

export function isExportMode(): boolean {
  return getPrintModeService().isExportMode();
}
