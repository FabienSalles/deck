/**
 * Plugin Constants
 * Centralized constants for Reveal.js plugins — pure values, no browser dependencies.
 */

export const MERMAID_SELECTORS = {
  DIAGRAM_SOURCE: 'pre code.mermaid-diagram-source',
  LANGUAGE_MERMAID: 'pre code.language-mermaid',
  MERMAID: 'pre code.mermaid',
  ALL: 'pre code.mermaid-diagram-source, pre code.language-mermaid, pre code.mermaid',
} as const;

export const MERMAID_ATTRIBUTES = {
  ORIGINAL: 'data-mermaid-original',
  PROTECTED: 'data-mermaid-protected',
  RENDERED: 'data-mermaid-rendered',
} as const;

export const MERMAID_CLASSES = {
  DIAGRAM: 'mermaid-diagram',
  SVG_WRAPPER: 'mermaid-svg-wrapper',
  DIAGRAM_SOURCE: 'mermaid-diagram-source',
  ERROR: 'mermaid-error',
  ERROR_MESSAGE: 'mermaid-error-message',
  NO_HIGHLIGHT: 'nohighlight',
} as const;

export const RESIZE_CLASSES = {
  NO_AUTO_RESIZE: 'no-auto-resize',
  SMALLEST_CONTENT: 'smallest-content',
  SMALLER_CONTENT: 'smaller-content',
  SMALL_CONTENT: 'small-content',
  AUTO_RESIZED: 'auto-resized',
  OVERFLOW_WARNING: 'content-overflow-warning',
} as const;

export const TIMING = {
  MERMAID_RENDER_DELAY: 300,
  THEME_CHANGE_DELAY: 100,
  LAYOUT_RECALC_DELAY: 100,
  PRE_HIGHLIGHT_DELAYS: [50, 200, 500],
} as const;

export const DEFAULT_RESIZE_OPTIONS = {
  minFontSize: 0.6,
  maxFontSize: 1.0,
  step: 0.05,
  threshold: 60,
} as const;

export const IMAGE_RESIZE_THRESHOLDS = {
  NORMAL_MODE: 0.75,
  PRINT_MODE: 0.65,
  MAX_PERCENT_NORMAL: 0.65,
  MAX_PERCENT_PRINT: 0.55,
} as const;

export const CODE_RESIZE_CONFIG = {
  HEAVY_OVERFLOW_THRESHOLD: 0.3,
  MODERATE_OVERFLOW_THRESHOLD: 0.15,

  REDUCTION_VERY_HEAVY: 0.6,
  REDUCTION_HEAVY: 0.65,
  REDUCTION_MODERATE: 0.7,
  REDUCTION_LIGHT: 0.75,
  MIN_FONT_REDUCTION: 0.65,

  BASE_THRESHOLD: 0.4,
  PRINT_THRESHOLD_HEAVY: 0.25,
  PRINT_THRESHOLD_MODERATE: 0.3,
  PRINT_THRESHOLD_LIGHT: 0.35,

  PADDING_NORMAL: '0.5rem',
  PADDING_HEAVY: '0.3rem',
  PADDING_MODERATE: '0.35rem',
  PADDING_LIGHT: '0.4rem',

  MAX_HEIGHT_NORMAL: 0.85,
  MAX_HEIGHT_HEAVY: 0.3,
  MAX_HEIGHT_MODERATE: 0.32,
  MAX_HEIGHT_LIGHT: 0.35,

  STILL_OVERFLOWS_THRESHOLD: 60,
} as const;

export const TEXT_RESIZE_CONFIG = {
  HEAVY_OVERFLOW_THRESHOLD: 0.3,
  MODERATE_OVERFLOW_THRESHOLD: 0.15,

  REDUCTION_HEAVY: 0.7,
  REDUCTION_MODERATE: 0.8,
  REDUCTION_LIGHT: 0.9,

  PRINT_MIN_FONT_HEAVY: 0.45,
  PRINT_MIN_FONT_MODERATE: 0.5,
  PRINT_MIN_FONT_LIGHT: 0.55,

  PRINT_STEP_HEAVY: 0.1,
  PRINT_STEP_MODERATE: 0.08,
  PRINT_STEP_LIGHT: 0.06,

  OVERFLOW_THRESHOLD: 60,
  OVERFLOW_WARNING_THRESHOLD: 100,

  PRINT_OVERFLOW_THRESHOLD: 10,
} as const;
