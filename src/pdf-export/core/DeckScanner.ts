import fs from 'node:fs';
import path from 'node:path';

import type { ExportConfig } from './ExportConfig.js';
import type { ExportTarget } from '../exporters/ExporterInterface.js';
import type { Logger } from '../utils/Logger.js';

/**
 * Represents a deck session with its available content
 */
export interface DeckTarget {
  /** Relative path (e.g., "ddd/session-1") */
  path: string;

  /** Whether the deck has slides */
  hasSlides: boolean;

  /** Whether the deck has exercises */
  hasExercises: boolean;

  /** Whether the deck has corrections */
  hasCorrections: boolean;

  /** List of exercise numbers */
  exerciseNums: string[];

  /** List of correction numbers */
  correctionNums: string[];
}

/**
 * Service for scanning and discovering deck content directories
 */
export class DeckScanner {
  private readonly contentDir: string;

  constructor(
    config: ExportConfig,
    private readonly logger: Logger
  ) {
    this.contentDir = path.join(process.cwd(), config.contentDir);
  }

  /**
   * Scan and return all decks
   */
  scanAll(): DeckTarget[] {
    this.logger.debug(`Scanning decks in: ${this.contentDir}`);

    const decks: DeckTarget[] = [];
    this.scanDirectory(this.contentDir, '', decks);

    this.logger.info(`Found ${decks.length} deck(s)`);

    return decks;
  }

  /**
   * Find a specific deck by path
   */
  findByPath(deckPath: string): DeckTarget | null {
    const all = this.scanAll();
    return all.find((d) => d.path === deckPath) ?? null;
  }

  /**
   * Find decks matching a path prefix
   */
  findByPrefix(prefix: string): DeckTarget[] {
    const all = this.scanAll();
    return all.filter((d) => d.path === prefix || d.path.startsWith(`${prefix}/`));
  }

  /**
   * Convert a deck to export targets
   */
  toExportTargets(deck: DeckTarget): ExportTarget[] {
    const targets: ExportTarget[] = [];

    if (deck.hasSlides) {
      targets.push({
        deckPath: deck.path,
        type: 'slides',
      });
    }

    for (const num of deck.exerciseNums) {
      targets.push({
        deckPath: deck.path,
        type: 'exercice',
        num,
      });
    }

    for (const num of deck.correctionNums) {
      targets.push({
        deckPath: deck.path,
        type: 'correction',
        num,
      });
    }

    return targets;
  }

  /**
   * Recursively scan a directory for decks
   */
  private scanDirectory(dir: string, relativePath: string, decks: DeckTarget[]): void {
    if (!fs.existsSync(dir)) {
      this.logger.warn(`Directory does not exist: ${dir}`);
      return;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const hasMetaYaml = entries.some((e) => e.name === '_meta.yaml');

    if (hasMetaYaml) {
      // This is a deck session directory
      const deck = this.parseDeck(dir, relativePath, entries);
      if (deck) {
        decks.push(deck);
        this.logger.debug(`Found deck: ${deck.path}`);
      }
    }

    // Continue scanning subdirectories
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.')) {
        const newRelPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        this.scanDirectory(path.join(dir, entry.name), newRelPath, decks);
      }
    }
  }

  /**
   * Parse a deck directory
   */
  private parseDeck(
    dir: string,
    relativePath: string,
    entries: fs.Dirent[]
  ): DeckTarget | null {
    const hasSlides = entries.some((e) => e.isDirectory() && e.name === 'slides');
    const hasExercises = entries.some((e) => e.isDirectory() && e.name === 'exercices');
    const hasCorrections = entries.some((e) => e.isDirectory() && e.name === 'corrections');

    // At least one content type required
    if (!hasSlides && !hasExercises && !hasCorrections) {
      return null;
    }

    const exerciseNums = hasExercises ? this.scanDocumentNumbers(path.join(dir, 'exercices')) : [];

    const correctionNums = hasCorrections
      ? this.scanDocumentNumbers(path.join(dir, 'corrections'))
      : [];

    return {
      path: relativePath,
      hasSlides,
      hasExercises,
      hasCorrections,
      exerciseNums,
      correctionNums,
    };
  }

  /**
   * Scan document numbers in a directory
   */
  private scanDocumentNumbers(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];

    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const match = f.match(/^(\d+)/);
        return match?.[1] ?? null;
      })
      .filter((n): n is string => n !== null)
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }
}
