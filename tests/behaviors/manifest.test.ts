import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { resolveConfig } from '../../src/integration/config';
import {
  manifestPath,
  readDeckManifest,
  resolveContentDir,
  writeDeckManifest,
} from '../../src/integration/manifest';

let projectRoot: string;

beforeEach(() => {
  projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'deck-manifest-'));
});

afterEach(() => {
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

describe('Deck manifest - writeDeckManifest()', () => {
  it('should write a manifest the reader can load back', () => {
    // GIVEN a consumer that renamed its collection
    const config = resolveConfig({ collection: 'formations', contentBase: 'formations' });

    // WHEN the integration serialises its resolved config
    writeDeckManifest(projectRoot, config);

    // THEN the manifest is readable and carries the content base
    expect(readDeckManifest(projectRoot)?.contentBase).toBe('formations');
  });

  it('should create the manifest directory when it does not exist', () => {
    // GIVEN a project root with no .deck directory
    expect(fs.existsSync(path.join(projectRoot, '.deck'))).toBe(false);

    // WHEN the integration writes its manifest
    writeDeckManifest(projectRoot, resolveConfig({}));

    // THEN the file exists at the documented location
    expect(fs.existsSync(manifestPath(projectRoot))).toBe(true);
  });
});

describe('Deck manifest - readDeckManifest()', () => {
  it('should return null when the project has no manifest', () => {
    // GIVEN a project that does not use the integration
    // WHEN reading its manifest
    // THEN nothing is found, and that is not an error
    expect(readDeckManifest(projectRoot)).toBeNull();
  });

  it('should return null when the manifest is not readable JSON', () => {
    // GIVEN a truncated manifest left by an interrupted build
    fs.mkdirSync(path.dirname(manifestPath(projectRoot)), { recursive: true });
    fs.writeFileSync(manifestPath(projectRoot), '{ "contentBase"');

    // WHEN reading it
    // THEN the caller falls back instead of crashing
    expect(readDeckManifest(projectRoot)).toBeNull();
  });
});

describe('Deck manifest - resolveContentDir()', () => {
  it('should follow the content base the integration resolved', () => {
    // GIVEN a consumer whose collection is not the default one
    writeDeckManifest(projectRoot, resolveConfig({ contentBase: 'formations' }));

    // WHEN the CLI resolves its content directory without a flag
    const contentDir = resolveContentDir(projectRoot);

    // THEN it points at the collection the integration renders
    expect(contentDir).toBe('src/content/formations');
  });

  it('should let an explicit flag win over the manifest', () => {
    // GIVEN a manifest that says one thing
    writeDeckManifest(projectRoot, resolveConfig({ contentBase: 'formations' }));

    // WHEN the caller passes --content-dir explicitly
    const contentDir = resolveContentDir(projectRoot, 'src/content/elsewhere');

    // THEN the flag wins
    expect(contentDir).toBe('src/content/elsewhere');
  });

  it('should return undefined when no manifest and no flag are available', () => {
    // GIVEN a project that is not a consumer of the integration
    // WHEN the CLI resolves its content directory
    // THEN it has nothing to say, and the export config keeps its own default
    expect(resolveContentDir(projectRoot)).toBeUndefined();
  });
});
