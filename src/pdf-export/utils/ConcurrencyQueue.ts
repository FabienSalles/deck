import type { Logger } from './Logger.js';

/**
 * Result of a queued task
 */
export interface QueueResult<T> {
  /** Task identifier */
  id: string;

  /** Whether the task succeeded */
  success: boolean;

  /** Task result if successful */
  result?: T;

  /** Error if failed */
  error?: string;
}

/**
 * Simple concurrency queue using a semaphore pattern.
 *
 * Provides progress tracking and error handling for batch operations
 * without requiring external dependencies like p-queue.
 */
export class ConcurrencyQueue {
  private completed = 0;
  private failed = 0;
  private total = 0;

  /** Number of currently running tasks */
  private running = 0;

  /** Queue of pending task resolvers waiting for a slot */
  private readonly waitQueue: Array<() => void> = [];

  constructor(
    private readonly concurrency: number,
    private readonly logger: Logger
  ) {}

  /**
   * Add multiple tasks to the queue and wait for completion
   */
  async processAll<T, R>(
    items: T[],
    fn: (item: T) => Promise<R>,
    getId: (item: T) => string
  ): Promise<QueueResult<R>[]> {
    this.total = items.length;
    this.completed = 0;
    this.failed = 0;

    this.logger.info(`Processing ${this.total} item(s) with concurrency ${this.concurrency}`);

    const results = await Promise.all(
      items.map((item) => this.enqueue(item, fn, getId))
    );

    this.logSummary();

    return results;
  }

  /**
   * Enqueue a single task, waiting for a concurrency slot
   */
  private async enqueue<T, R>(
    item: T,
    fn: (item: T) => Promise<R>,
    getId: (item: T) => string
  ): Promise<QueueResult<R>> {
    await this.acquire();

    const id = getId(item);
    try {
      const result = await fn(item);
      this.completed++;
      this.logProgress();
      return { id, success: true, result };
    } catch (error) {
      this.failed++;
      this.logProgress();
      return {
        id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      this.release();
    }
  }

  /**
   * Acquire a concurrency slot (semaphore acquire).
   * Resolves immediately if a slot is available, otherwise waits.
   */
  private acquire(): Promise<void> {
    if (this.running < this.concurrency) {
      this.running++;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  /**
   * Release a concurrency slot (semaphore release).
   * Wakes up the next waiting task if any.
   */
  private release(): void {
    const next = this.waitQueue.shift();
    if (next) {
      // Hand the slot directly to the next waiter (running count stays the same)
      next();
    } else {
      this.running--;
    }
  }

  /**
   * Log current progress
   */
  private logProgress(): void {
    const done = this.completed + this.failed;
    const percent = Math.round((done / this.total) * 100);
    this.logger.debug(`Progress: ${done}/${this.total} (${percent}%)`);
  }

  /**
   * Log final summary
   */
  private logSummary(): void {
    if (this.failed > 0) {
      this.logger.warn(`Completed: ${this.completed} succeeded, ${this.failed} failed`);
    } else {
      this.logger.info(`Completed: ${this.completed} succeeded`);
    }
  }

  /**
   * Get number of currently running tasks
   */
  get activeCount(): number {
    return this.running;
  }

  /**
   * Get number of tasks waiting for a slot
   */
  get pendingCount(): number {
    return this.waitQueue.length;
  }
}
