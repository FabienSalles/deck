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
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { contentDirOf, resolveConfig, type DeckConfig } from './config';
import { writeDeckManifest } from './manifest';
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
        // Slide markdown resolves images to `/<contentBase>/<deck>/_images/…`,
        // so the package that mints those URLs also has to ship the files.
        const imagesRoot = contentDirOf(config);

        updateConfig({
          image: {
            service: { entrypoint: 'astro/assets/services/noop' },
          },
          vite: {
            plugins: [
              virtualDeckConfig(config),
              viteStaticCopy({
                targets: [
                  {
                    src: `${imagesRoot}/**/_images/**/*`,
                    dest: config.contentBase,
                    rename: (_name: string, _ext: string, srcPath: string) => {
                      const suffix = srcPath.split(`${imagesRoot}/`)[1];

                      return suffix ?? srcPath;
                    },
                  },
                ],
              }),
            ],
          },
        });
      },

      'astro:config:done': ({ config: astroConfig }) => {
        writeDeckManifest(fileURLToPath(astroConfig.root), config);
      },
    },
  };
}

// Re-export types
export type { DeckConfig, DeckStyles } from './config';
