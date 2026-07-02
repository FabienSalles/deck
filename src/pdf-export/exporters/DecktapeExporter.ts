import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { BaseExporter, type ExportResult, type ExportTarget } from './ExporterInterface.js';

/**
 * Exporter for Reveal.js slides using Decktape
 *
 * Decktape is a headless Chrome-based tool specifically designed
 * for exporting HTML presentations to PDF.
 */
export class DecktapeExporter extends BaseExporter {
  readonly name = 'DecktapeExporter';

  canExport(target: ExportTarget): boolean {
    return target.type === 'slides';
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

    this.logger.info(`Exporting slides: ${target.deckPath}`);
    this.logger.debug(`URL: ${url}`);
    this.logger.debug(`Output: ${outputPath}`);

    const { result, duration } = await this.withTiming(() => this.runDecktape(url, outputPath));

    if (result.success) {
      this.logger.info(`Slides exported successfully (${(duration / 1000).toFixed(1)}s)`);
    } else {
      this.logger.error(`Slides export failed: ${result.error}`);
    }

    return { ...result, duration };
  }

  /**
   * Run Decktape as a child process
   */
  private runDecktape(url: string, outputPath: string): Promise<ExportResult> {
    return new Promise((resolve) => {
      const args = ['decktape', 'reveal', url, outputPath, ...this.config.decktapeOptions];

      this.logger.debug(`Running: npx ${args.join(' ')}`);

      const childProcess = spawn('npx', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stderr = '';

      childProcess.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      childProcess.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            outputPath,
            duration: 0, // Will be set by withTiming
          });
        } else {
          resolve({
            success: false,
            outputPath,
            error: `Decktape exited with code ${String(code)}: ${stderr}`,
            duration: 0,
          });
        }
      });

      childProcess.on('error', (error: Error) => {
        resolve({
          success: false,
          outputPath,
          error: `Failed to spawn Decktape: ${error.message}`,
          duration: 0,
        });
      });
    });
  }
}
