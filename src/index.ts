/**
 * @fabiensalles/deck
 * Astro integration for Reveal.js presentations with exercises, corrections, and PDF export.
 */

// Main integration (default export)
export { default } from './integration/index';
export type { DeckConfig } from './integration/config';

// Content module
export {
  SlideCollection,
  type Slide,
  type DeckMeta,
  type ExerciseInfo,
  type ExerciseData,
  type DeckDay,
  type DeckGroup,
  formatDayName,
  prepareSlideMarkdown,
  extractDeckPath,
  groupSlidesByDeck,
  loadDeckMeta,
  hasContent,
  findDeckPathsWithSubfolder,
  loadExerciseInfos,
  loadExerciseData,
  getCorrectionNumbers,
  SlideSchema,
} from './content/index';

// Reveal module
export {
  initRevealPresentation,
  AutoResizePlugin,
  MermaidPlugin,
  PreHighlightPlugin,
  DEFAULT_REVEAL_CONFIG,
  type RevealConfig,
} from './reveal/index';
