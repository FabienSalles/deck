/**
 * Content Loader — Infrastructure
 * Deck content discovery using Node.js `fs` (build-time only).
 * Unified content discovery for @fabiensalles/deck.
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type { DeckMeta, ExerciseInfo, ExerciseData } from '../domain/slide.model';
import { extractTitleFromMarkdown, extractExerciseNumber } from '../domain/slide.service';

// -- Deck Metadata --

/**
 * Loads deck metadata from `_meta.yaml`.
 * Returns a default meta object if the file doesn't exist.
 */
export function loadDeckMeta(
  contentDir: string,
  deckPath: string,
): DeckMeta {
  const defaultMeta: DeckMeta = {
    id: deckPath.replace(/\//g, '-'),
    title: deckPath,
  };

  const metaFilePath = path.join(contentDir, deckPath, '_meta.yaml');

  if (!fs.existsSync(metaFilePath)) {
    return defaultMeta;
  }

  try {
    const metaContent = fs.readFileSync(metaFilePath, 'utf-8');
    const parsed = yaml.load(metaContent) as Partial<DeckMeta>;

    return { ...defaultMeta, ...parsed };
  } catch {
    return defaultMeta;
  }
}

// -- Content Discovery --

/**
 * Checks if a deck path has a subfolder with markdown files.
 */
export function hasContent(
  contentDir: string,
  deckPath: string,
  folderName: string,
): boolean {
  const folderPath = path.join(contentDir, deckPath, folderName);

  if (!fs.existsSync(folderPath)) {
    return false;
  }

  try {
    const files = fs.readdirSync(folderPath);

    return files.some((f) => f.endsWith('.md'));
  } catch {
    return false;
  }
}

/**
 * Recursively finds all deck paths that contain a given subfolder.
 * Used to discover exercises/ and corrections/ folders.
 */
export function findDeckPathsWithSubfolder(
  contentDir: string,
  subfolderName: string,
): string[] {
  const results: string[] = [];

  function walk(dir: string, relativePath: string): void {
    if (!fs.existsSync(dir)) {
      return;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const newRelativePath = relativePath.length > 0
        ? `${relativePath}/${entry.name}`
        : entry.name;

      if (entry.name === subfolderName) {
        results.push(relativePath);
      } else if (!entry.name.startsWith('_') && !entry.name.startsWith('.')) {
        walk(path.join(dir, entry.name), newRelativePath);
      }
    }
  }

  walk(contentDir, '');

  return results;
}

// -- Exercise / Correction Loading --

/**
 * Lists sorted markdown files in a directory.
 */
function listSortedMarkdownFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith('.md'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/^(\d+)/)?.[1] || '0', 10);
      const numB = parseInt(b.match(/^(\d+)/)?.[1] || '0', 10);

      return numA - numB;
    });
}

/**
 * Loads exercise info (metadata only, no content) from a directory.
 */
export function loadExerciseInfos(
  contentDir: string,
  deckPath: string,
  type: 'exercices' | 'corrections',
): ExerciseInfo[] {
  const dirPath = path.join(contentDir, deckPath, type);
  const files = listSortedMarkdownFiles(dirPath);

  return files.map((filename) => {
    const content = fs.readFileSync(path.join(dirPath, filename), 'utf-8');
    const title = extractTitleFromMarkdown(content) || filename.replace(/^\d+-/, '').replace('.md', '');
    const num = extractExerciseNumber(filename);

    return { num, title, filename };
  });
}

/**
 * Loads full exercise data (with content) from a directory.
 */
export function loadExerciseData(
  contentDir: string,
  deckPath: string,
  type: 'exercices' | 'corrections',
): ExerciseData[] {
  const dirPath = path.join(contentDir, deckPath, type);
  const files = listSortedMarkdownFiles(dirPath);

  return files.map((filename) => {
    const content = fs.readFileSync(path.join(dirPath, filename), 'utf-8');
    const title = extractTitleFromMarkdown(content) || filename.replace(/^\d+-/, '').replace('.md', '');
    const num = extractExerciseNumber(filename);

    return { num, title, filename, content };
  });
}

/**
 * Gets the set of exercise numbers that have a matching correction.
 */
export function getCorrectionNumbers(
  contentDir: string,
  deckPath: string,
): Set<string> {
  const dirPath = path.join(contentDir, deckPath, 'corrections');

  if (!fs.existsSync(dirPath)) {
    return new Set();
  }

  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.md'));

  return new Set(
    files.map((f) => f.match(/^(\d+)/)?.[1]).filter((n): n is string => n !== undefined),
  );
}
