/**
 * @conveycode/deck — Reveal.js Module
 * Public API for the Reveal.js integration.
 */

// Domain — pure types and constants
export type { RevealConfig, OverflowInfo, ResizeResult, Logger } from './domain/reveal.model';
export { DEFAULT_REVEAL_CONFIG, MARKDOWN_CONFIG, HIGHLIGHT_CONFIG } from './domain/reveal.model';
export { RESIZE_CLASSES, MERMAID_SELECTORS, MERMAID_CLASSES, TIMING } from './domain/constants';
export { PluginRegistry, type PluginEntry, type RevealPlugin } from './domain/plugin.registry';
export { debounce, throttle } from './domain/performance';

// Infrastructure — browser-dependent
export { initRevealPresentation, toggleFullscreen } from './infrastructure/init';
export { AutoResizePlugin } from './infrastructure/plugins/auto-resize';
export { MermaidPlugin } from './infrastructure/plugins/mermaid';
export { PreHighlightPlugin } from './infrastructure/plugins/pre-highlight';
export { createLogger, NoopLogger } from './infrastructure/services/LoggerService';
export {
  getPrintModeService,
  isPrintMode,
  isHeadlessBrowser,
  isExportMode,
} from './infrastructure/services/PrintModeService';
