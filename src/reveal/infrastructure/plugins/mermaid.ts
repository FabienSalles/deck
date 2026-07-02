/**
 * Mermaid Plugin — Infrastructure
 * Renders Mermaid diagram code blocks into SVG diagrams.
 */

import type { Api, Plugin } from 'reveal.js';
import { MERMAID_SELECTORS, MERMAID_ATTRIBUTES, TIMING } from '../../domain/constants';
import { createLogger } from '../services/LoggerService';
import { getPrintModeService } from '../services/PrintModeService';
import {
  createMermaidConfigService,
  type MermaidPluginOptions,
} from '../services/MermaidConfigService';
import { createMermaidBlockValidator } from '../services/MermaidBlockValidator';
import { createMermaidRenderer } from '../services/MermaidRenderer';

const defaultOptions: MermaidPluginOptions = {
  theme: 'default',
  flowchart: { curve: 'basis' },
};

export const MermaidPlugin = (options: MermaidPluginOptions = defaultOptions): Plugin => {
  return {
    id: 'mermaid',

    init: async (deck: Api): Promise<void> => {
      const logger = createLogger('MermaidPlugin');
      const printModeService = getPrintModeService();
      const isPrintMode = printModeService.isPrintMode();
      const configService = createMermaidConfigService();
      const validator = createMermaidBlockValidator(logger);
      const renderer = createMermaidRenderer(logger);

      configService.initialize(options, isPrintMode);

      let isRendering = false;

      const renderMermaidDiagrams = async (): Promise<void> => {
        if (isRendering) {
          return;
        }

        isRendering = true;

        try {
          const revealElement = deck.getRevealElement();

          if (!revealElement) {
            isRendering = false;

            return;
          }

          const mermaidBlocks = revealElement.querySelectorAll(MERMAID_SELECTORS.ALL);

          for (let i = 0; i < mermaidBlocks.length; i++) {
            const block = mermaidBlocks[i] as HTMLElement;

            if (validator.isBlockAlreadyRendered(block)) {
              continue;
            }

            const validationResult = validator.validateBlock(block, i);

            if (validationResult === null || !validationResult.isValid) {
              block.setAttribute(MERMAID_ATTRIBUTES.RENDERED, 'true');

              continue;
            }

            await renderer.render(validationResult.code, block, i, isPrintMode);
          }
        } finally {
          isRendering = false;
        }
      };

      deck.on('ready', () => {
        setTimeout(() => {
          renderMermaidDiagrams();
        }, TIMING.MERMAID_RENDER_DELAY);
      });

      if (!isPrintMode) {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (
              mutation.type === 'attributes' &&
              mutation.attributeName === 'data-theme' &&
              mutation.target === document.documentElement
            ) {
              const newTheme = document.documentElement.getAttribute('data-theme');
              const newMermaidTheme = newTheme === 'light' ? 'default' : 'dark';

              const revealElement = deck.getRevealElement();

              if (!revealElement) {
                return;
              }

              const renderedDiagrams = revealElement.querySelectorAll(
                `[class*="mermaid-diagram"][${MERMAID_ATTRIBUTES.ORIGINAL}]`,
              );

              renderedDiagrams.forEach((diagram: Element) => {
                const diagramElement = diagram as HTMLElement;
                const code = diagramElement.getAttribute(MERMAID_ATTRIBUTES.ORIGINAL);

                if (code !== null) {
                  const pre = document.createElement('pre');
                  const codeBlock = document.createElement('code');
                  codeBlock.className = 'mermaid-diagram-source nohighlight';
                  codeBlock.setAttribute(MERMAID_ATTRIBUTES.ORIGINAL, code);
                  codeBlock.textContent = code;
                  pre.appendChild(codeBlock);
                  diagramElement.replaceWith(pre);
                }
              });

              configService.reinitialize(newMermaidTheme as 'default' | 'dark');

              setTimeout(() => {
                renderMermaidDiagrams();
              }, TIMING.THEME_CHANGE_DELAY);
            }
          });
        });

        observer.observe(document.documentElement, { attributes: true });
      }
    },
  };
};
