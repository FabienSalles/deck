import type { ExportConfig } from './ExportConfig.js';
import type { DeckTarget, DeckScanner } from './DeckScanner.js';
import type { Exporter, ExportResult, ExportTarget } from '../exporters/ExporterInterface.js';
import type { Logger } from '../utils/Logger.js';
import { ConcurrencyQueue } from '../utils/ConcurrencyQueue.js';
import { HealthChecker } from '../utils/HealthChecker.js';

/**
 * Summary of export operation
 */
export interface ExportSummary {
  /** Total number of targets processed */
  total: number;

  /** Number of successful exports */
  succeeded: number;

  /** Number of failed exports */
  failed: number;

  /** Total duration in milliseconds */
  duration: number;

  /** Detailed results */
  results: ExportResult[];
}

/**
 * Main orchestrator for PDF export operations
 *
 * Coordinates:
 * - Server health checks
 * - Deck scanning
 * - Exporter lifecycle
 * - Concurrent processing
 */
export class ExportOrchestrator {
  private readonly healthChecker: HealthChecker;
  private readonly queue: ConcurrencyQueue;
  private readonly exporters: Exporter[] = [];

  constructor(
    private readonly config: ExportConfig,
    private readonly scanner: DeckScanner,
    private readonly logger: Logger
  ) {
    this.healthChecker = new HealthChecker(config, logger);
    this.queue = new ConcurrencyQueue(config.maxConcurrentDecks, logger);
  }

  /**
   * Register an exporter
   */
  registerExporter(exporter: Exporter): void {
    this.exporters.push(exporter);
    this.logger.debug(`Registered exporter: ${exporter.name}`);
  }

  /**
   * Export all decks
   */
  async exportAll(): Promise<ExportSummary> {
    const decks = this.scanner.scanAll();
    return this.exportDecks(decks);
  }

  /**
   * Export a specific deck by path
   */
  async exportByPath(path: string): Promise<ExportSummary> {
    const decks = this.scanner.findByPrefix(path);

    if (decks.length === 0) {
      this.logger.error(`No decks found for path: ${path}`);
      return this.emptySummary();
    }

    return this.exportDecks(decks);
  }

  /**
   * Export a single item (exercise or correction)
   */
  async exportSingleItem(
    deckPath: string,
    type: 'exercice' | 'correction',
    num: string
  ): Promise<ExportSummary> {
    const target: ExportTarget = { deckPath, type, num };
    return this.exportTargets([target]);
  }

  /**
   * Export multiple decks
   */
  private async exportDecks(decks: DeckTarget[]): Promise<ExportSummary> {
    // Convert decks to export targets
    const targets = decks.flatMap((d) => this.scanner.toExportTargets(d));

    this.logger.info(`Exporting ${decks.length} deck(s), ${targets.length} target(s)`);

    return this.exportTargets(targets);
  }

  /**
   * Export a list of targets
   */
  private async exportTargets(targets: ExportTarget[]): Promise<ExportSummary> {
    const startTime = Date.now();

    // Check server health
    if (!(await this.healthChecker.isServerRunning())) {
      this.logger.error(`Server not running at ${this.config.baseUrl}`);
      this.logger.error('Please start the server first: npm run dev');
      return this.emptySummary();
    }

    // Initialize all exporters
    await this.initializeExporters();

    try {
      // Process targets with concurrency
      const queueResults = await this.queue.processAll(
        targets,
        (target) => this.exportTarget(target),
        (target) => `${target.deckPath}/${target.type}${target.num ? `-${target.num}` : ''}`
      );

      // Build summary
      const results = queueResults.filter((r) => r.result).map((r) => r.result as ExportResult);

      const succeeded = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      return {
        total: targets.length,
        succeeded,
        failed,
        duration: Date.now() - startTime,
        results,
      };
    } finally {
      // Always cleanup exporters
      await this.cleanupExporters();
    }
  }

  /**
   * Export a single target using the appropriate exporter
   */
  private async exportTarget(target: ExportTarget): Promise<ExportResult> {
    const exporter = this.findExporter(target);

    if (!exporter) {
      this.logger.error(`No exporter found for type: ${target.type}`);
      return {
        success: false,
        outputPath: '',
        error: `No exporter for type: ${target.type}`,
        duration: 0,
      };
    }

    return exporter.export(target);
  }

  /**
   * Find an exporter that can handle the target
   */
  private findExporter(target: ExportTarget): Exporter | null {
    return this.exporters.find((e) => e.canExport(target)) ?? null;
  }

  /**
   * Initialize all registered exporters
   */
  private async initializeExporters(): Promise<void> {
    this.logger.debug('Initializing exporters...');
    await Promise.all(this.exporters.map((e) => e.initialize()));
  }

  /**
   * Cleanup all registered exporters
   */
  private async cleanupExporters(): Promise<void> {
    this.logger.debug('Cleaning up exporters...');
    await Promise.all(this.exporters.map((e) => e.cleanup()));
  }

  /**
   * Create an empty summary
   */
  private emptySummary(): ExportSummary {
    return {
      total: 0,
      succeeded: 0,
      failed: 0,
      duration: 0,
      results: [],
    };
  }
}
