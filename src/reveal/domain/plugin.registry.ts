/**
 * Plugin Registry — Pure Domain Collection
 * Map-based collection with iteration support (ts-oop: Collection > named properties).
 * No DOM, no browser — just data structures and configuration.
 */

// -- Plugin Types --

export type RevealPlugin = {
  id: string;
  init?(): void | Promise<void>;
  destroy?(): void;
};

export type PluginEntry = {
  readonly name: string;
  readonly factory: () => RevealPlugin;
  readonly enabled: boolean;
  readonly config: Readonly<Record<string, unknown>>;
};

// -- Plugin Registry --

/**
 * Iterable collection of plugin entries.
 * Follows Tell Don't Ask: exposes behavior, not raw data.
 */
export class PluginRegistry implements Iterable<PluginEntry> {
  private readonly plugins = new Map<string, PluginEntry>();

  register(entry: PluginEntry): void {
    this.plugins.set(entry.name, entry);
  }

  get(name: string): PluginEntry | undefined {
    return this.plugins.get(name);
  }

  has(name: string): boolean {
    return this.plugins.has(name);
  }

  getEnabled(): PluginEntry[] {
    return [...this.plugins.values()].filter((p) => p.enabled);
  }

  get count(): number {
    return this.plugins.size;
  }

  get enabledCount(): number {
    return this.getEnabled().length;
  }

  /**
   * Creates Reveal.js plugin instances from all enabled entries.
   */
  instantiateEnabled(): RevealPlugin[] {
    return this.getEnabled().map((entry) => entry.factory());
  }

  [Symbol.iterator](): Iterator<PluginEntry> {
    return this.plugins.values();
  }
}
