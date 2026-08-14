import fs from 'node:fs';
import path from 'node:path';
import type { Page } from 'puppeteer-core';

import type { ExportConfig } from '../core/ExportConfig.js';
import type { Logger } from '../utils/Logger.js';
import { BrowserPool } from './BrowserPool.js';
import { BaseExporter, type ExportResult, type ExportTarget } from './ExporterInterface.js';

/**
 * CSS selectors for document pages
 */
const SELECTORS = {
  content: '.document-content, .exercise-content',
  navigation: '.back-link, .document-actions, .exercise-nav, .exercise-footer-nav',
};

/**
 * Print styles to inject for proper PDF rendering
 */
const PRINT_STYLES = `
  html, body {
    height: auto !important;
    min-height: auto !important;
  }
  .document-page {
    min-height: auto !important;
    height: auto !important;
    display: block !important;
  }
  .document-content {
    flex: none !important;
  }
`;

/**
 * Exporter for slides, exercises and corrections, all rendered through a
 * shared Puppeteer browser pool.
 */
export class PuppeteerExporter extends BaseExporter {
  readonly name = 'PuppeteerExporter';
  private browserPool: BrowserPool;

  constructor(config: ExportConfig, logger: Logger) {
    super(config, logger);
    this.browserPool = new BrowserPool(config.maxConcurrentDocuments, logger);
  }

  canExport(target: ExportTarget): boolean {
    return target.type === 'exercice' || target.type === 'correction' || target.type === 'slides';
  }

  override async initialize(): Promise<void> {
    await super.initialize();
    await this.browserPool.initialize();
  }

  override async cleanup(): Promise<void> {
    await this.browserPool.close();
    await super.cleanup();
  }

  async export(target: ExportTarget): Promise<ExportResult> {
    if (!this.canExport(target)) {
      return {
        success: false,
        outputPath: '',
        error: `${this.name} cannot export type: ${target.type}`,
        duration: 0,
      };
    }

    const url = this.buildUrl(target);
    const outputPath = this.buildOutputPath(target);

    // Ensure output directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const typeName =
      target.type === 'exercice' ? 'Exercise' : target.type === 'correction' ? 'Correction' : 'Slides';
    const label = target.num ? `${typeName} ${target.num}` : typeName;
    this.logger.info(`Exporting ${label}: ${target.deckPath}`);
    this.logger.debug(`URL: ${url}`);
    this.logger.debug(`Output: ${outputPath}`);

    const { result, duration } = await this.withTiming(() =>
      this.browserPool.withPage((page) => this.exportPage(page, target, url, outputPath))
    );

    if (result.success) {
      this.logger.info(`${label} exported (${(duration / 1000).toFixed(1)}s)`);
    } else {
      this.logger.error(`${label} export failed: ${result.error}`);
    }

    return { ...result, duration };
  }

  /**
   * Export a single page to PDF
   */
  private async exportPage(
    page: Page,
    target: ExportTarget,
    url: string,
    outputPath: string
  ): Promise<ExportResult> {
    try {
      await page.setViewport({ width: 794, height: 1123 }); // A4 at 96 DPI
      await page.emulateMediaType('print');

      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: this.config.navigationTimeout,
      });

      if (target.type === 'slides') {
        // reveal.js paginates itself under the `?print-pdf` URL it was navigated to.
        await page.waitForSelector('.reveal', { timeout: this.config.selectorTimeout });
      } else {
        await page.waitForSelector(SELECTORS.content, {
          timeout: this.config.selectorTimeout,
        });

        await page.evaluate(
          (styles: string, navSelector: string) => {
            const styleEl = document.createElement('style');
            styleEl.textContent = styles;
            document.head.appendChild(styleEl);

            document.querySelectorAll(navSelector).forEach((el) => {
              (el as HTMLElement).style.display = 'none';
            });
          },
          PRINT_STYLES,
          SELECTORS.navigation
        );
      }

      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin:
          target.type === 'slides'
            ? undefined
            : { top: '1.5cm', right: '1.5cm', bottom: '1.5cm', left: '1.5cm' },
      });

      return {
        success: true,
        outputPath,
        duration: 0,
      };
    } catch (error) {
      return {
        success: false,
        outputPath,
        error: error instanceof Error ? error.message : String(error),
        duration: 0,
      };
    }
  }
}
