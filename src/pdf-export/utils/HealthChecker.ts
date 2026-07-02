import type { ExportConfig } from '../core/ExportConfig.js';
import type { Logger } from './Logger.js';

/**
 * Service to check if the dev/preview server is running
 */
export class HealthChecker {
  constructor(
    private readonly config: ExportConfig,
    private readonly logger: Logger
  ) {}

  /**
   * Check if the server is available
   */
  async isServerRunning(): Promise<boolean> {
    const { baseUrl } = this.config;

    this.logger.debug(`Checking server at ${baseUrl}...`);

    try {
      const response = await fetch(baseUrl);
      const isRunning = response.ok;

      if (isRunning) {
        this.logger.debug('Server is running');
      } else {
        this.logger.warn(`Server returned status ${response.status}`);
      }

      return isRunning;
    } catch (error) {
      this.logger.debug('Server is not running', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Wait for the server to become available
   */
  async waitForServer(timeoutMs = 30000, intervalMs = 1000): Promise<boolean> {
    const startTime = Date.now();

    this.logger.info(`Waiting for server at ${this.config.baseUrl}...`);

    while (Date.now() - startTime < timeoutMs) {
      if (await this.isServerRunning()) {
        this.logger.info('Server is ready');
        return true;
      }

      await this.sleep(intervalMs);
    }

    this.logger.error(`Server not available after ${timeoutMs / 1000}s`);
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
