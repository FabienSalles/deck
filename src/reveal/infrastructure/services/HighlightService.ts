/**
 * Highlight Service — Infrastructure
 * Manages syntax highlighting for code blocks using highlight.js via Reveal.js.
 */

import type { Api } from 'reveal.js';

export const CODE_BLOCK_SELECTOR =
  'pre code:not(.nohighlight):not(.no-highlight):not(.mermaid):not(.language-mermaid):not(.mermaid-diagram-source)';

const MAX_FIXER_RUNS = 60;
const FIXER_INTERVAL_MS = 100;
const HIGHLIGHT_DEBOUNCE_MS = 50;

export function needsHighlighting(block: Element): boolean {
  if (!block.classList.contains('hljs')) {
    return true;
  }

  const hasHighlightSpans = block.querySelector('span[class^="hljs-"]') !== null;

  return !hasHighlightSpans;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getHljsInstance(deck: Api): any | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const highlightPlugin = deck.getPlugin('highlight') as any;

  return highlightPlugin?.hljs ?? null;
}

export function applyHighlighting(block: Element, deck: Api): boolean {
  const hljsInstance = getHljsInstance(deck);

  if (hljsInstance === null) {
    return false;
  }

  block.classList.remove('hljs');
  (block as HTMLElement).removeAttribute('data-highlighted');
  hljsInstance.highlightElement(block as HTMLElement);

  return true;
}

export function highlightCodeBlocks(container: Element, deck: Api): void {
  const codeBlocks = container.querySelectorAll(CODE_BLOCK_SELECTOR);

  codeBlocks.forEach((block) => {
    if (needsHighlighting(block)) {
      applyHighlighting(block, deck);
    }
  });
}

export function createHighlightFixer(
  getCodeBlocks: () => NodeListOf<Element> | Element[],
  deck: Api,
): { stop: () => void } {
  let runCount = 0;

  const intervalId = window.setInterval(() => {
    runCount++;

    if (runCount > MAX_FIXER_RUNS) {
      window.clearInterval(intervalId);

      return;
    }

    const codeBlocks = getCodeBlocks();

    codeBlocks.forEach((block) => {
      if (needsHighlighting(block)) {
        applyHighlighting(block, deck);
      }
    });
  }, FIXER_INTERVAL_MS);

  return {
    stop: () => window.clearInterval(intervalId),
  };
}

export function setupCodeHighlightObserver(deck: Api): MutationObserver | null {
  const revealElement = deck.getRevealElement();

  if (!revealElement) {
    return null;
  }

  let highlightTimeout: number | null = null;

  const scheduleHighlight = (container: Element): void => {
    if (highlightTimeout !== null) {
      window.clearTimeout(highlightTimeout);
    }

    highlightTimeout = window.setTimeout(() => {
      highlightCodeBlocks(container, deck);
    }, HIGHLIGHT_DEBOUNCE_MS);
  };

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            if (node.matches('pre') || node.querySelector('pre') !== null) {
              scheduleHighlight(node.closest('section') || revealElement);
            }
          }
        });
      }

      if (mutation.type === 'characterData' && mutation.target.parentElement !== null) {
        const parent = mutation.target.parentElement;

        if (parent.matches('code') && parent.closest('pre') !== null) {
          const section = parent.closest('section');

          if (section !== null) {
            scheduleHighlight(section);
          }
        }
      }
    });
  });

  observer.observe(revealElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  return observer;
}

export function saveMermaidOriginalContent(): void {
  const mermaidBlocks = document.querySelectorAll('code.language-mermaid, code.mermaid');

  mermaidBlocks.forEach((block) => {
    const code = block.textContent || '';
    block.setAttribute('data-mermaid-original', code);
    block.classList.add('nohighlight');
  });
}
