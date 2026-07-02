/**
 * Post-build script: adds .js extensions to relative imports in dist/.
 *
 * TypeScript with "moduleResolution": "bundler" emits extensionless
 * relative imports (e.g. from './foo'). Node.js ESM requires explicit
 * .js extensions. This script fixes them.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '..', 'dist');

/**
 * Check if a relative import path needs a .js extension.
 * Returns the corrected path or null if no fix needed.
 */
function fixImportPath(importPath, fromFile) {
  // Only fix relative imports
  if (!importPath.startsWith('.')) return null;
  const dir = dirname(fromFile);

  // Already ends with .js — no fix needed
  if (importPath.endsWith('.js')) return null;

  // Check if adding .js resolves to an existing file
  const asFile = resolve(dir, importPath + '.js');
  if (existsSync(asFile)) {
    return importPath + '.js';
  }

  // Check if it's a directory with an index.js
  const asDir = resolve(dir, importPath, 'index.js');
  if (existsSync(asDir)) {
    return importPath + '/index.js';
  }

  return null;
}

/**
 * Fix all relative imports in a .js file.
 */
function fixFile(filePath) {
  let content = readFileSync(filePath, 'utf8');
  let changed = false;

  // Match: from '...' or from "..." and export ... from '...'
  content = content.replace(
    /(from\s+['"])([^'"]+)(['"])/g,
    (match, prefix, importPath, suffix) => {
      const fixed = fixImportPath(importPath, filePath);
      if (fixed) {
        changed = true;
        return prefix + fixed + suffix;
      }
      return match;
    },
  );

  if (changed) {
    writeFileSync(filePath, content);
  }

  return changed;
}

/**
 * Recursively process all .js files in a directory.
 */
function processDir(dir) {
  let fixedCount = 0;

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      fixedCount += processDir(fullPath);
    } else if (entry.endsWith('.js')) {
      if (fixFile(fullPath)) {
        fixedCount++;
      }
    }
  }

  return fixedCount;
}

const count = processDir(distDir);
console.log(`Fixed ESM imports in ${count} file(s)`);
