/**
 * Logger Service — Infrastructure
 * Browser-dependent logging with localStorage-based debug toggle.
 */

import type { Logger } from '../../domain/reveal.model';

export class DevelopmentLogger implements Logger {
  constructor(private readonly context: string) {}

  log(message: string, ...args: unknown[]): void {
    if (
      typeof localStorage !== 'undefined' &&
      localStorage.getItem('DEBUG_REVEAL') !== null
    ) {
      console.log(`[${this.context}] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[${this.context}] ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`[${this.context}] ${message}`, ...args);
  }
}

export class NoopLogger implements Logger {
  log(): void {}
  warn(): void {}
  error(): void {}
}

export function createLogger(context: string, enabled = true): Logger {
  return enabled ? new DevelopmentLogger(context) : new NoopLogger();
}
