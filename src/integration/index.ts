/**
 * @conveycode/deck — Astro Integration
 *
 * Usage in astro.config.mjs:
 * ```ts
 * import deck from '@conveycode/deck';
 *
 * export default defineConfig({
 *   integrations: [deck({ collection: 'decks' })],
 * });
 * ```
 */

import type { AstroIntegration } from 'astro';
import { resolveConfig, type DeckConfig } from './config';
import { virtualDeckConfig } from './virtual-modules';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export default function deckIntegration(userConfig: DeckConfig = {}): AstroIntegration {
  const config = resolveConfig(userConfig);

  return {
    name: '@conveycode/deck',

    hooks: {
      'astro:config:setup': ({ injectRoute, updateConfig }) => {
        // Resolve the package root to find pages
        const packageRoot = path.dirname(fileURLToPath(import.meta.url));
        const pagesDir = path.join(packageRoot, '..', 'pages');

        // -- Inject routes --

        // Presentation pages: /{deck}/{session}/
        injectRoute({
          pattern: '[...slug]',
          entrypoint: path.join(pagesDir, '[...slug].astro'),
        });

        // Home page (optional)
        if (config.homePage) {
          injectRoute({
            pattern: '',
            entrypoint: path.join(pagesDir, 'index.astro'),
          });
        }

        // Exercise pages (optional)
        if (config.exercises) {
          injectRoute({
            pattern: '[...path]/exercices',
            entrypoint: path.join(pagesDir, '[...path]', 'exercices', 'index.astro'),
          });

          injectRoute({
            pattern: '[...path]/exercices/[num]',
            entrypoint: path.join(pagesDir, '[...path]', 'exercices', '[num].astro'),
          });
        }

        // Correction pages (optional)
        if (config.corrections) {
          injectRoute({
            pattern: '[...path]/corrections',
            entrypoint: path.join(pagesDir, '[...path]', 'corrections', 'index.astro'),
          });

          injectRoute({
            pattern: '[...path]/corrections/[num]',
            entrypoint: path.join(pagesDir, '[...path]', 'corrections', '[num].astro'),
          });
        }

        // -- Vite plugins --
        updateConfig({
          vite: {
            plugins: [virtualDeckConfig(config)],
          },
        });
      },
    },
  };
}

// Re-export types
export type { DeckConfig } from './config';
