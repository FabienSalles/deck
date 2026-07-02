/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger interface for structured logging
 */
export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, error?: Error | Record<string, unknown>): void;
}

/**
 * Console logger implementation
 */
export class ConsoleLogger implements Logger {
  constructor(
    private readonly prefix: string = '',
    private readonly minLevel: LogLevel = 'info'
  ) {}

  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.minLevel];
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString().slice(11, 19);
    const prefix = this.prefix ? `[${this.prefix}] ` : '';
    return `${timestamp} ${level.toUpperCase().padEnd(5)} ${prefix}${message}`;
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) return;
    console.log(this.formatMessage('debug', message), data ?? '');
  }

  info(message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog('info')) return;
    console.log(this.formatMessage('info', message), data ?? '');
  }

  warn(message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog('warn')) return;
    console.warn(this.formatMessage('warn', message), data ?? '');
  }

  error(message: string, error?: Error | Record<string, unknown>): void {
    if (!this.shouldLog('error')) return;
    if (error instanceof Error) {
      console.error(this.formatMessage('error', message), error.message);
    } else {
      console.error(this.formatMessage('error', message), error ?? '');
    }
  }
}

/**
 * Silent logger (for testing)
 */
export class SilentLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

/**
 * Create a logger instance
 */
export function createLogger(prefix?: string, verbose = false): Logger {
  return new ConsoleLogger(prefix, verbose ? 'debug' : 'info');
}
