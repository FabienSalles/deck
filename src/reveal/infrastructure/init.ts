/**
 * Reveal.js Initialization — Infrastructure
 * Orchestrates Reveal.js setup with plugins, events, and compatibility fixes.
 */

import Reveal from 'reveal.js';
import type { Api } from 'reveal.js';

// Reveal.js built-in plugins
import Markdown from 'reveal.js/plugin/markdown/markdown.esm.js';
import Highlight from 'reveal.js/plugin/highlight/highlight.esm.js';
import Notes from 'reveal.js/plugin/notes/notes.esm.js';
import Search from 'reveal.js/plugin/search/search.esm.js';
import Zoom from 'reveal.js/plugin/zoom/zoom.esm.js';

// Custom plugins
import { PreHighlightPlugin } from './plugins/pre-highlight';
import { AutoResizePlugin } from './plugins/auto-resize';
import { firstMermaidPass, MermaidPlugin } from './plugins/mermaid';

// Services
import { isPrintMode } from './services/PrintModeService';
import {
  highlightCodeBlocks,
  createHighlightFixer,
  setupCodeHighlightObserver,
  saveMermaidOriginalContent,
  CODE_BLOCK_SELECTOR,
} from './services/HighlightService';
import {
  applyHeadlessCompatFixes,
  fixH1GradientInHeadless,
} from './services/HeadlessCompatService';

// Domain
import {
  type RevealConfig,
  DEFAULT_REVEAL_CONFIG,
  MARKDOWN_CONFIG,
  HIGHLIGHT_CONFIG,
} from '../domain/reveal.model';

// Re-exports
export type { RevealConfig } from '../domain/reveal.model';
export { DEFAULT_REVEAL_CONFIG as defaultConfig } from '../domain/reveal.model';
export { needsHighlighting, applyHighlighting, createHighlightFixer } from './services/HighlightService';

// Fragment event type (not exported by reveal.js)
type FragmentEvent = {
  fragment?: HTMLElement;
};

export function toggleFullscreen(): void {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

function setupEventListeners(deck: Api): void {
  setupCodeHighlightObserver(deck);

  deck.on('fragmentshown', ((event: FragmentEvent) => {
    if (event.fragment) {
      event.fragment.classList.add('fragment-shown');
    }
  }) as EventListener);

  deck.on('fragmenthidden', ((event: FragmentEvent) => {
    if (event.fragment) {
      event.fragment.classList.remove('fragment-shown');
    }
  }) as EventListener);

  deck.on('slidechanged', () => {
    const currentSlide = deck.getCurrentSlide();

    if (currentSlide !== null) {
      highlightCodeBlocks(currentSlide, deck);
    }

    fixH1GradientInHeadless();
  });

  deck.on('ready', () => {
    const currentSlide = deck.getCurrentSlide();

    if (currentSlide !== null) {
      highlightCodeBlocks(currentSlide, deck);
    }

    createHighlightFixer(() => {
      const slide = deck.getCurrentSlide();

      return slide ? slide.querySelectorAll(CODE_BLOCK_SELECTOR) : [];
    }, deck);

    fixH1GradientInHeadless();
  });

  deck.addKeyBinding(
    { keyCode: 70, key: 'F', description: 'Toggle fullscreen' },
    () => { toggleFullscreen(); },
  );
}

function buildPluginList(isPrint: boolean): unknown[] {
  const basePlugins = [
    Markdown,
    PreHighlightPlugin(),
    Highlight,
    MermaidPlugin(),
    Notes,
    Search,
    Zoom,
  ];

  return isPrint ? basePlugins : [...basePlugins, AutoResizePlugin()];
}

export async function initRevealPresentation(
  customConfig: Partial<RevealConfig> = {},
): Promise<Api> {
  saveMermaidOriginalContent();

  const isPrint = isPrintMode();
  const plugins = buildPluginList(isPrint);

  const config = {
    ...DEFAULT_REVEAL_CONFIG,
    ...customConfig,
    plugins,
    markdown: MARKDOWN_CONFIG,
    highlight: HIGHLIGHT_CONFIG,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deck = new (Reveal as any)(config) as Api;
  await deck.initialize();

  deck.sync();

  if (isPrint) {
    await firstMermaidPass;
  }

  // Expose Reveal globally for tools like Decktape
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).Reveal = deck;

  applyHeadlessCompatFixes(deck);

  setTimeout(() => {
    saveMermaidOriginalContent();
  }, 100);

  setupEventListeners(deck);

  // URL hash management (Reveal.js hash disabled to prevent loops)
  deck.on('slidechanged', () => {
    const indices = deck.getIndices();
    const hash = indices.v > 0 ? `#/${indices.h}/${indices.v}` : `#/${indices.h}`;
    window.history.replaceState(null, '', window.location.pathname + window.location.search + hash);
  });

  return deck;
}

export default initRevealPresentation;
