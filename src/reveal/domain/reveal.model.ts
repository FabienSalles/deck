/**
 * Reveal.js Domain Models
 * Pure types and configuration — no DOM, no browser dependencies.
 */

// -- Reveal.js Configuration --

export type RevealConfig = {
  controls?: boolean;
  progress?: boolean;
  slideNumber?: boolean | string;
  hash?: boolean;
  history?: boolean;
  keyboard?: boolean;
  overview?: boolean;
  center?: boolean;
  touch?: boolean;
  loop?: boolean;
  fragments?: boolean;
  help?: boolean;
  autoSlide?: number;
  mouseWheel?: boolean;
  transition?: 'none' | 'fade' | 'slide' | 'convex' | 'concave' | 'zoom';
  transitionSpeed?: 'default' | 'fast' | 'slow';
  backgroundTransition?: string;
  pdfSeparateFragments?: boolean;
  pdfMaxPagesPerSlide?: number;
};

export const DEFAULT_REVEAL_CONFIG = {
  controls: true,
  progress: true,
  slideNumber: 'c/t',
  hash: false,
  history: false,
  keyboard: true,
  overview: true,
  center: false,
  touch: true,
  loop: false,
  fragments: true,
  help: true,
  autoSlide: 0,
  mouseWheel: false,
  transition: 'slide',
  transitionSpeed: 'default',
  backgroundTransition: 'fade',
  pdfSeparateFragments: false,
  pdfMaxPagesPerSlide: 1,
} as const satisfies RevealConfig;

export const MARKDOWN_CONFIG = {
  smartypants: true,
  breaks: true,
  gfm: true,
  pedantic: false,
} as const;

export const HIGHLIGHT_CONFIG = {
  highlightOnLoad: true,
  excapeHTML: false,
} as const;

// -- Overflow Detection --

export type OverflowInfo = {
  readonly hasOverflow: boolean;
  readonly overflowAmount: number;
  readonly overflowPercent: number;
};

// -- Resize --

export type ResizeResult = {
  readonly resized: boolean;
  readonly strategy: string;
};

// -- Logger --

export type Logger = {
  log(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
};

// -- Print Mode --

export type PrintModeEnvironment = {
  getUserAgent(): string;
  getBodyClassList(): { contains(className: string): boolean };
  getLocationSearch(): string;
};

export type PrintModeService = {
  isPrintMode(): boolean;
  isHeadlessBrowser(): boolean;
  isExportMode(): boolean;
  subscribe(listener: (isPrint: boolean) => void): () => void;
};
