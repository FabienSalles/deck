import type { ExportConfig } from '../core/ExportConfig.js';
import type { Logger } from '../utils/Logger.js';

/**
 * Result of an export operation
 */
export interface ExportResult {
  /** Whether the export succeeded */
  success: boolean;

  /** Output file path */
  outputPath: string;

  /** Error message if failed */
  error?: string;

  /** Duration in milliseconds */
  duration: number;
}

/**
 * Information about content to export
 */
export interface ExportTarget {
  /** Deck path (e.g., "ddd/session-1") */
  deckPath: string;

  /** Type of content */
  type: 'slides' | 'exercice' | 'correction';

  /** Document number for exercise/correction (e.g., "01") */
  num?: string;
}

/**
 * Common interface for PDF exporters
 */
export interface Exporter {
  /** Unique identifier for this exporter */
  readonly name: string;

  /**
   * Check if this exporter can handle the target
   */
  canExport(target: ExportTarget): boolean;

  /**
   * Export a single target to PDF
   */
  export(target: ExportTarget): Promise<ExportResult>;

  /**
   * Initialize the exporter (e.g., launch browser)
   */
  initialize(): Promise<void>;

  /**
   * Cleanup resources (e.g., close browser)
   */
  cleanup(): Promise<void>;
}

/**
 * Base class for exporters with common functionality
 */
export abstract class BaseExporter implements Exporter {
  abstract readonly name: string;

  constructor(
    protected readonly config: ExportConfig,
    protected readonly logger: Logger
  ) {}

  abstract canExport(target: ExportTarget): boolean;
  abstract export(target: ExportTarget): Promise<ExportResult>;

  async initialize(): Promise<void> {
    this.logger.debug(`[${this.name}] Initialized`);
  }

  async cleanup(): Promise<void> {
    this.logger.debug(`[${this.name}] Cleaned up`);
  }

  /**
   * Build the URL for a target
   */
  protected buildUrl(target: ExportTarget): string {
    const { baseUrl } = this.config;

    switch (target.type) {
      case 'slides':
        return `${baseUrl}/${target.deckPath}/?print-pdf`;

      case 'exercice':
        return `${baseUrl}/${target.deckPath}/exercices/${target.num}?print`;

      case 'correction':
        return `${baseUrl}/${target.deckPath}/corrections/${target.num}?print`;
    }
  }

  /**
   * Build the output file path for a target
   */
  protected buildOutputPath(target: ExportTarget): string {
    const { outputDir } = this.config;
    const base = `${outputDir}/${target.deckPath}`;

    switch (target.type) {
      case 'slides':
        return `${base}/slides.pdf`;

      case 'exercice':
        return `${base}/exercice-${target.num}.pdf`;

      case 'correction':
        return `${base}/correction-${target.num}.pdf`;
    }
  }

  /**
   * Measure execution time of an async function
   */
  protected async withTiming<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    return { result, duration };
  }
}
