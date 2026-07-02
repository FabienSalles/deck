/**
 * Pre-Highlight Plugin — Infrastructure
 * Runs BEFORE Highlight.js to protect mermaid blocks from syntax highlighting.
 */

import type { Api, Plugin } from 'reveal.js';
import { debounce } from '../../domain/performance';

export const PreHighlightPlugin = (): Plugin => {
  return {
    id: 'pre-highlight',

    init: (deck: Api): void => {
      const protectMermaidBlocks = (): void => {
        const revealElement = deck.getRevealElement();

        if (!revealElement) {
          return;
        }

        const mermaidBlocks = revealElement.querySelectorAll(
          'code.language-mermaid, code.mermaid, pre code[class*="language-mermaid"]',
        );

        mermaidBlocks.forEach((block: Element) => {
          const codeBlock = block as HTMLElement;

          if (codeBlock.hasAttribute('data-mermaid-protected')) {
            return;
          }

          const originalContent = codeBlock.textContent || '';

          codeBlock.setAttribute('data-mermaid-original', originalContent);
          codeBlock.setAttribute('data-mermaid-protected', 'true');

          codeBlock.classList.add('nohighlight');
          codeBlock.classList.add('no-highlight');
          codeBlock.classList.remove('language-mermaid');
          codeBlock.classList.add('mermaid-diagram-source');
        });
      };

      protectMermaidBlocks();

      const debouncedProtect = debounce(protectMermaidBlocks, 100);
      const observer = new MutationObserver(() => {
        debouncedProtect();
      });

      const revealElement = deck.getRevealElement();

      if (revealElement) {
        observer.observe(revealElement, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class'],
        });
      }

      deck.on('ready', () => {
        setTimeout(protectMermaidBlocks, 50);
        setTimeout(protectMermaidBlocks, 200);
        setTimeout(protectMermaidBlocks, 500);
      });
    },
  };
};
