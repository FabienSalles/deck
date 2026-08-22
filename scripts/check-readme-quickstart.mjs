#!/usr/bin/env node
// Proves the README's Quick start section tells a consumer what the package needs from its
// host (peer dependencies, the browser env var) instead of the repo's own CI sequence.
import { readFileSync } from 'node:fs';
import path from 'node:path';

const readmePath = path.resolve('README.md');
const pkgPath = path.resolve('package.json');

const readme = readFileSync(readmePath, 'utf8');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

const failures = [];

const quickstartHeadingMatch = readme.match(/^#+\s*Quick ?start\s*$/im);
if (!quickstartHeadingMatch) {
  failures.push('README.md has no "Quick start" heading');
}

const quickstart = quickstartHeadingMatch ? readme.slice(quickstartHeadingMatch.index) : '';

for (const [name, range] of Object.entries(pkg.peerDependencies ?? {})) {
  if (!quickstart.includes(name)) {
    failures.push(`Quick start does not name the peer dependency "${name}" (${range})`);
  }
}

if (!quickstart.includes('PUPPETEER_EXECUTABLE_PATH')) {
  failures.push('Quick start does not name the PUPPETEER_EXECUTABLE_PATH browser variable');
}

if (/npm ci\b/.test(quickstart) || /npm pack\b/.test(quickstart) || /git clone/.test(quickstart)) {
  failures.push('Quick start reads like the repo\'s CI sequence, not a consumer install (npm ci / npm pack / git clone)');
}

if (failures.length > 0) {
  console.error('README quickstart check failed:\n' + failures.map((failure) => `  - ${failure}`).join('\n'));
  process.exit(1);
}

console.log('README quickstart check passed: peer dependencies and the browser variable are named.');
