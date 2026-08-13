#!/usr/bin/env node

/**
 * Describes a pixelmatch diff image in text, so a visual gap can be located
 * without loading the image itself.
 *
 * usage: node scripts/describe-diff.mjs <diff.png> [...]
 */

import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';

const COLS = 12;
const ROWS = 8;

function ramp(ratio) {
  if (ratio === 0) return ' ';
  if (ratio < 0.005) return '.';
  if (ratio < 0.05) return ':';
  if (ratio < 0.2) return '+';

  return '#';
}

function describe(file) {
  const { width, height, data } = PNG.sync.read(readFileSync(file));
  const cells = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));

  let changed = 0;
  let antialiased = 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) << 2;
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];

      if (r > 200 && g > 200 && b < 100) {
        antialiased++;
        continue;
      }

      if (r < 200 || g > 100 || b > 100) {
        continue;
      }

      changed++;
      cells[Math.floor((y / height) * ROWS)][Math.floor((x / width) * COLS)]++;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  const total = width * height;
  const cellPixels = (width / COLS) * (height / ROWS);

  console.log(`${file}  ${width}x${height}`);
  console.log(`  changed: ${changed} px (${((changed / total) * 100).toFixed(2)}%)`);
  console.log(`  antialiased: ${antialiased} px`);

  if (changed === 0) {
    console.log('  no changed pixel, nothing to locate');

    return;
  }

  console.log(
    `  bounding box: x ${minX}..${maxX}  y ${minY}..${maxY}  (${maxX - minX + 1}x${maxY - minY + 1})`
  );
  console.log(`  grid ${COLS}x${ROWS}, one cell = ${Math.round(width / COLS)}x${Math.round(height / ROWS)} px`);
  console.log('  legend: " " none  "." <0.5%  ":" <5%  "+" <20%  "#" >=20%');

  for (const [row, counts] of cells.entries()) {
    const y0 = Math.round((row / ROWS) * height);
    console.log(`  y${String(y0).padStart(4)} |${counts.map((c) => ramp(c / cellPixels)).join('')}|`);
  }
}

const files = process.argv.slice(2);

if (files.length === 0) {
  console.error('usage: node scripts/describe-diff.mjs <diff.png> [...]');
  process.exit(1);
}

for (const file of files) {
  describe(file);
}
