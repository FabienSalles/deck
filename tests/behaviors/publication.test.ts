import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.join(__dirname, '../..');
const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf-8'));

describe('Package manifest - publishConfig', () => {
  it('should declare public access so a scoped package publishes without a flag', () => {
    // GIVEN the manifest for a scoped package
    // WHEN a maintainer runs npm publish without --access
    // THEN the manifest itself asks for public access
    expect(pkg.publishConfig?.access).toBe('public');
  });
});

describe('Repository - LICENSE', () => {
  it('should ship the MIT licence the manifest announces', () => {
    // GIVEN a manifest that claims an MIT licence
    expect(pkg.license).toBe('MIT');

    // WHEN the package is published
    // THEN the licence text is present in the repository
    const licenseText = fs.readFileSync(path.join(repoRoot, 'LICENSE'), 'utf-8');
    expect(licenseText).toContain('MIT License');
  });
});

describe('Package manifest - peer dependencies', () => {
  it('should declare the sass compiler its own themes need', () => {
    // GIVEN a package whose default themes are .scss files compiled by the host
    // WHEN a consumer installs it
    // THEN the manifest asks the host for a sass implementation
    expect(pkg.peerDependencies?.sass).toBeDefined();
  });
});
