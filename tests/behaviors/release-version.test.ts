import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.join(__dirname, '../..');
const guard = path.join(repoRoot, 'scripts/check-release-version.sh');
const manifestVersion = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf-8')
).version as string;

function runGuard(...args: string[]) {
  return spawnSync('bash', [guard, ...args], { encoding: 'utf-8' });
}

describe('Release guard - tag versus manifest', () => {
  it('should accept a tag that names the version the manifest would publish', () => {
    // GIVEN a Release tagged with the manifest version, v-prefixed
    // WHEN the pipeline checks it before publishing
    const result = runGuard(`v${manifestVersion}`);

    // THEN it lets the publication proceed
    expect(result.status).toBe(0);
  });

  it('should refuse a tag that diverges from the manifest, naming both', () => {
    // GIVEN a Release cut on a commit whose manifest was never bumped to the tag
    // WHEN the pipeline checks it before publishing
    const result = runGuard('v9.9.9');

    // THEN it refuses, and says which two versions disagree
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('v9.9.9');
    expect(result.stderr).toContain(manifestVersion);
  });

  it('should refuse an unprefixed tag rather than guess the convention', () => {
    // GIVEN a Release tagged without the v prefix the convention requires
    // WHEN the pipeline checks it
    const result = runGuard(manifestVersion);

    // THEN it refuses instead of accepting a second spelling
    expect(result.status).toBe(1);
  });

  it('should refuse to run at all when no tag is passed', () => {
    // GIVEN a pipeline step that forgot to forward the tag
    // WHEN the guard runs with no argument
    const result = runGuard();

    // THEN it fails loudly instead of comparing against an empty string
    expect(result.status).toBe(2);
  });
});
