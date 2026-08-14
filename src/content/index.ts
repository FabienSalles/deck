/**
 * @fabiensalles/deck — Content Module
 * Public API for content loading, slide management, and schema.
 */

// Domain — pure types and services
export {
  SlideCollection,
  type Slide,
  type DeckMeta,
  type ExerciseInfo,
  type ExerciseData,
  type DeckDay,
  type DeckGroup,
  formatDayName,
  getFilename,
  extractNumericPrefix,
  hasNumericPrefix,
} from './domain/slide.model';

export {
  convertImagePaths,
  convertExerciseLinks,
  prepareSlideMarkdown,
  extractDeckPath,
  groupSlidesByDeck,
  extractTitleFromMarkdown,
  extractExerciseNumber,
} from './domain/slide.service';

// Infrastructure — Node.js file system
export {
  loadDeckMeta,
  hasContent,
  findDeckPathsWithSubfolder,
  loadExerciseInfos,
  loadExerciseData,
  getCorrectionNumbers,
} from './infrastructure/content-loader';

// Schema
export { SlideSchema, type SlideSchemaType } from './infrastructure/schema';
