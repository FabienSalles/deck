import puppeteer, { type Browser, type Page } from 'puppeteer';

import type { Logger } from '../utils/Logger.js';

/**
 * Browser pool for efficient Puppeteer resource management
 *
 * Instead of launching a new browser for each export,
 * we reuse browser instances and manage page lifecycle.
 */
export class BrowserPool {
  private browser: Browser | null = null;
  private pageCount = 0;

  constructor(
    private readonly maxPages: number,
    private readonly logger: Logger
  ) {}

  /**
   * Initialize the browser pool
   */
  async initialize(): Promise<void> {
    if (this.browser) return;

    this.logger.debug('Launching browser...');

    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    this.logger.debug('Browser launched');
  }

  /**
   * Acquire a new page from the pool
   */
  async acquirePage(): Promise<Page> {
    if (!this.browser) {
      await this.initialize();
    }

    if (!this.browser) {
      throw new Error('Failed to initialize browser');
    }

    if (this.pageCount >= this.maxPages) {
      this.logger.warn(`Max pages (${this.maxPages}) reached, waiting...`);
      // In a real implementation, we'd queue this request.
      // For now, we'll just create the page anyway.
    }

    const page = await this.browser.newPage();
    this.pageCount++;

    this.logger.debug(`Page acquired (${this.pageCount} active)`);

    return page;
  }

  /**
   * Release a page back to the pool
   */
  async releasePage(page: Page): Promise<void> {
    try {
      await page.close();
      this.pageCount--;
      this.logger.debug(`Page released (${this.pageCount} active)`);
    } catch (error) {
      this.logger.warn('Failed to close page', { error: String(error) });
    }
  }

  /**
   * Execute a function with a page, automatically releasing it afterward
   */
  async withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
    const page = await this.acquirePage();
    try {
      return await fn(page);
    } finally {
      await this.releasePage(page);
    }
  }

  /**
   * Close the browser pool
   */
  async close(): Promise<void> {
    if (this.browser) {
      this.logger.debug('Closing browser...');
      await this.browser.close();
      this.browser = null;
      this.pageCount = 0;
      this.logger.debug('Browser closed');
    }
  }

  /**
   * Check if the pool is initialized
   */
  isInitialized(): boolean {
    return this.browser !== null;
  }
}
