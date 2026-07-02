import { cpSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const assets = [
  { src: 'src/components', dest: 'dist/components' },
  { src: 'src/layouts', dest: 'dist/layouts' },
  { src: 'src/pages', dest: 'dist/pages' },
  { src: 'src/styles', dest: 'dist/styles' },
];

for (const { src, dest } of assets) {
  cpSync(resolve(root, src), resolve(root, dest), { recursive: true });
  console.log(`Copied ${src} → ${dest}`);
}
