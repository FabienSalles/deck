#!/usr/bin/env node
// Run from e2e/ after installing the packed @fabiensalles/deck tarball: proves the manifest
// describes the tarball that actually landed in node_modules, not the repo's working tree.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const pkgDir = path.resolve('node_modules/@fabiensalles/deck');
const pkg = JSON.parse(readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));

const failures = [];

for (const entry of pkg.files ?? []) {
  const target = path.join(pkgDir, entry.replace(/\/$/, ''));

  if (!existsSync(target)) {
    failures.push(`files: "${entry}" is declared but missing at ${target}`);
  }
}

for (const [specifier, condition] of Object.entries(pkg.exports ?? {})) {
  if (specifier.includes('*')) {
    const dir = path.join(pkgDir, condition.replace('/*', ''));

    if (!existsSync(dir) || readdirSync(dir).length === 0) {
      failures.push(`exports: "${specifier}" resolves to an empty or missing directory ${dir}`);
    }

    continue;
  }

  const importCondition = typeof condition === 'string' ? condition : condition.import;
  const typesCondition = typeof condition === 'string' ? condition : condition.types;

  if (importCondition) {
    const importSpecifier = specifier === '.' ? pkg.name : `${pkg.name}/${specifier.slice(2)}`;

    try {
      import.meta.resolve(importSpecifier);
    } catch (error) {
      failures.push(`exports: "${specifier}" does not resolve from the installed package (${error.message})`);
    }
  }

  if (typesCondition && !existsSync(path.join(pkgDir, typesCondition))) {
    failures.push(`exports: "${specifier}" declares types at "${typesCondition}" but the file is missing`);
  }
}

if (failures.length > 0) {
  console.error('Package surface check failed:\n' + failures.map((failure) => `  - ${failure}`).join('\n'));
  process.exit(1);
}

console.log(
  `Package surface check passed: ${Object.keys(pkg.exports ?? {}).length} exports, ${(pkg.files ?? []).length} files entries.`,
);
