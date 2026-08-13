/**
 * Deck Manifest
 * The integration serialises its resolved config to `<root>/.deck/config.json`
 * so `deck-pdf`, a Node binary running outside Astro, can read what
 * `virtual:deck/config` only exposes inside the Vite module graph.
 */

import fs from 'node:fs';
import path from 'node:path';

import { contentDirOf, type ResolvedDeckConfig } from './config';

const MANIFEST_PATH = path.join('.deck', 'config.json');

export function manifestPath(projectRoot: string): string {
  return path.join(projectRoot, MANIFEST_PATH);
}

export function writeDeckManifest(projectRoot: string, config: ResolvedDeckConfig): void {
  const target = manifestPath(projectRoot);

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(config, null, 2)}\n`);
}

export function readDeckManifest(projectRoot: string): ResolvedDeckConfig | null {
  try {
    return JSON.parse(fs.readFileSync(manifestPath(projectRoot), 'utf-8')) as ResolvedDeckConfig;
  } catch {
    return null;
  }
}

export function resolveContentDir(projectRoot: string, flag?: string): string | undefined {
  if (flag !== undefined) {
    return flag;
  }

  const manifest = readDeckManifest(projectRoot);

  return manifest === null ? undefined : contentDirOf(manifest);
}
