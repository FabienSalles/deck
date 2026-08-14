import { describe, it, expect } from 'vitest';
import {
  convertImagePaths,
  convertExerciseLinks,
  prepareSlideMarkdown,
  extractDeckPath,
  groupSlidesByDeck,
  extractTitleFromMarkdown,
  extractExerciseNumber,
} from '../../src/content/domain/slide.service';

describe('Slide Service - Image path conversion', () => {
  describe('convertImagePaths()', () => {
    it('should convert markdown image paths with _images/ prefix', () => {
      // GIVEN markdown with a relative image path
      const markdown = '![diagram](_images/architecture.png)';
      const imagesPrefix = '/decks/ddd/jour-1/_images';

      // WHEN converting image paths
      const result = convertImagePaths(markdown, imagesPrefix);

      // THEN the path is converted to absolute
      expect(result).toBe('![diagram](/decks/ddd/jour-1/_images/architecture.png)');
    });

    it('should convert HTML img src attributes', () => {
      // GIVEN markdown with an HTML img tag
      const markdown = '<img src="_images/logo.svg" alt="logo" />';
      const imagesPrefix = '/decks/git/day-1/_images';

      // WHEN converting image paths
      const result = convertImagePaths(markdown, imagesPrefix);

      // THEN the src is converted
      expect(result).toBe('<img src="/decks/git/day-1/_images/logo.svg" alt="logo" />');
    });

    it('should convert relative paths with ../ prefix', () => {
      // GIVEN markdown with ../_images/ paths
      const markdown = '![alt](../_images/shared.png)';
      const imagesPrefix = '/decks/ddd/jour-1/_images';

      // WHEN converting image paths
      const result = convertImagePaths(markdown, imagesPrefix);

      // THEN the path is converted
      expect(result).toBe('![alt](/decks/ddd/jour-1/_images/shared.png)');
    });

    it('should convert relative paths with ./ prefix', () => {
      // GIVEN markdown with ./_images/ paths
      const markdown = '![alt](./_images/local.png)';
      const imagesPrefix = '/decks/ddd/jour-1/_images';

      // WHEN converting image paths
      const result = convertImagePaths(markdown, imagesPrefix);

      // THEN the path is converted
      expect(result).toBe('![alt](/decks/ddd/jour-1/_images/local.png)');
    });

    it('should handle multiple images in the same markdown', () => {
      // GIVEN markdown with multiple images
      const markdown = '![a](_images/a.png)\n![b](_images/b.png)';
      const imagesPrefix = '/decks/ddd/jour-1/_images';

      // WHEN converting
      const result = convertImagePaths(markdown, imagesPrefix);

      // THEN all images are converted
      expect(result).toContain('/decks/ddd/jour-1/_images/a.png');
      expect(result).toContain('/decks/ddd/jour-1/_images/b.png');
    });
  });
});

describe('Slide Service - Exercise link conversion', () => {
  describe('convertExerciseLinks()', () => {
    it('should convert exercise image links to clickable HTML links', () => {
      // GIVEN markdown with an exercise link pattern
      const markdown = '![exercice:01](_images/exercise-banner.png)';
      const basePath = 'ddd/jour-1';

      // WHEN converting exercise links
      const result = convertExerciseLinks(markdown, basePath);

      // THEN it creates an anchor wrapping the image
      expect(result).toContain('href="/ddd/jour-1/exercices/01"');
      expect(result).toContain('class="exercise-link"');
      expect(result).toContain('target="_blank"');
      expect(result).toContain('![exercice](_images/exercise-banner.png)');
    });

    it('should convert correction image links to clickable HTML links', () => {
      // GIVEN markdown with a correction link pattern
      const markdown = '![correction:02](_images/correction-banner.png)';
      const basePath = 'git/day-2';

      // WHEN converting correction links
      const result = convertExerciseLinks(markdown, basePath);

      // THEN it creates an anchor with corrections path
      expect(result).toContain('href="/git/day-2/corrections/02"');
      expect(result).toContain('title="Open correction 02"');
    });

    it('should leave non-matching images untouched', () => {
      // GIVEN a regular markdown image
      const markdown = '![diagram](_images/architecture.png)';
      const basePath = 'ddd/jour-1';

      // WHEN converting
      const result = convertExerciseLinks(markdown, basePath);

      // THEN the image is not modified
      expect(result).toBe(markdown);
    });
  });
});

describe('Slide Service - Full markdown pipeline', () => {
  describe('prepareSlideMarkdown()', () => {
    it('should apply both exercise links and image path conversion', () => {
      // GIVEN raw markdown with both exercise links and images
      const rawMarkdown = [
        '# Introduction',
        '![diagram](_images/arch.png)',
        '![exercice:01](_images/exercise.png)',
      ].join('\n');
      const deckPath = 'ddd/jour-1';

      // WHEN preparing markdown
      const result = prepareSlideMarkdown(rawMarkdown, deckPath);

      // THEN exercise links are converted
      expect(result).toContain('href="/ddd/jour-1/exercices/01"');
      // AND image paths are converted to absolute
      expect(result).toContain('/decks/ddd/jour-1/_images/arch.png');
    });

    it('should resolve images against a renamed content collection', () => {
      // GIVEN a consumer that renamed the collection, as formation does
      const rawMarkdown = '![branch](../_images/branch_1.png)';
      const deckPath = 'git/day-1';

      // WHEN preparing markdown with that content base
      const result = prepareSlideMarkdown(rawMarkdown, deckPath, 'formations');

      // THEN the image URL follows the collection the files were copied under
      expect(result).toContain('/formations/git/day-1/_images/branch_1.png');
      // AND never falls back to the default collection name
      expect(result).not.toContain('/decks/');
    });

    it('should keep the default collection when the consumer renamed nothing', () => {
      // GIVEN a consumer leaving the collection at its default
      const rawMarkdown = '![diagram](_images/arch.png)';

      // WHEN preparing markdown without naming a content base
      const result = prepareSlideMarkdown(rawMarkdown, 'ddd/jour-1');

      // THEN the default collection is used
      expect(result).toContain('/decks/ddd/jour-1/_images/arch.png');
    });
  });
});

describe('Slide Service - Deck path extraction', () => {
  describe('extractDeckPath()', () => {
    it('should extract deck path from a slide ID with /slides/ folder', () => {
      // GIVEN a slide ID containing /slides/
      const slideId = 'ddd/jour-1/slides/01-intro';

      // WHEN extracting the deck path
      const result = extractDeckPath(slideId);

      // THEN it returns the path up to (but not including) /slides/
      expect(result).toBe('ddd/jour-1');
    });

    it('should return null for an exercise file', () => {
      // GIVEN a markdown file living in an exercices folder
      const slideId = 'ddd/jour-1/exercices/01-supple-design';

      // WHEN extracting the deck path
      const result = extractDeckPath(slideId);

      // THEN it belongs to no deck
      expect(result).toBeNull();
    });

    it('should return null for a correction file', () => {
      // GIVEN a markdown file living in a corrections folder
      const slideId = 'ddd/jour-1/corrections/01-supple-design';

      // WHEN extracting the deck path
      const result = extractDeckPath(slideId);

      // THEN it belongs to no deck
      expect(result).toBeNull();
    });

    it('should return null for a loose note at the collection root', () => {
      // GIVEN a stray markdown file outside any slides folder
      const slideId = 'ddd/qcm-jour-2';

      // WHEN extracting the deck path
      const result = extractDeckPath(slideId);

      // THEN it belongs to no deck
      expect(result).toBeNull();
    });

    it('should return null for short paths that cannot be split', () => {
      // GIVEN a single-segment ID
      const slideId = 'orphan';

      // WHEN extracting the deck path
      const result = extractDeckPath(slideId);

      // THEN it returns null
      expect(result).toBeNull();
    });
  });
});

describe('Slide Service - Grouping slides by deck', () => {
  describe('groupSlidesByDeck()', () => {
    it('should group slides by their deck path', () => {
      // GIVEN slides from multiple decks
      const slides = [
        { id: 'ddd/jour-1/slides/01-intro' },
        { id: 'ddd/jour-1/slides/02-concepts' },
        { id: 'git/day-1/slides/01-basics' },
      ];

      // WHEN grouping
      const groups = groupSlidesByDeck(slides);

      // THEN slides are grouped by deck path
      expect(groups.size).toBe(2);
      expect(groups.get('ddd/jour-1')).toHaveLength(2);
      expect(groups.get('git/day-1')).toHaveLength(1);
    });

    it('should skip slides that cannot be grouped (single-segment ID)', () => {
      // GIVEN a mix of groupable and ungroupable slides
      const slides = [
        { id: 'ddd/jour-1/slides/01-intro' },
        { id: 'orphan' },
      ];

      // WHEN grouping
      const groups = groupSlidesByDeck(slides);

      // THEN only groupable slides are included
      expect(groups.size).toBe(1);
      expect(groups.has('ddd/jour-1')).toBe(true);
    });
  });
});

describe('Slide Service - Title extraction', () => {
  describe('extractTitleFromMarkdown()', () => {
    it('should find the first h1 heading', () => {
      // GIVEN markdown with a heading
      const content = '# My Great Title\n\nSome content here.';

      // WHEN extracting the title
      const title = extractTitleFromMarkdown(content);

      // THEN it returns the heading text
      expect(title).toBe('My Great Title');
    });

    it('should return null if there is no heading', () => {
      // GIVEN markdown without any heading
      const content = 'Just some text.\nNo headings at all.';

      // WHEN extracting the title
      const title = extractTitleFromMarkdown(content);

      // THEN it returns null
      expect(title).toBeNull();
    });

    it('should find the first h1 even if not on the first line', () => {
      // GIVEN markdown with heading on a later line
      const content = 'Some intro text.\n\n# The Title\n\nMore content.';

      // WHEN extracting the title
      const title = extractTitleFromMarkdown(content);

      // THEN it returns the first h1
      expect(title).toBe('The Title');
    });
  });
});

describe('Slide Service - Exercise number extraction', () => {
  describe('extractExerciseNumber()', () => {
    it('should parse the numeric prefix from a filename', () => {
      expect(extractExerciseNumber('01-introduction.md')).toBe('01');
      expect(extractExerciseNumber('12-advanced-topics.md')).toBe('12');
    });

    it('should default to 01 when no number prefix exists', () => {
      expect(extractExerciseNumber('introduction.md')).toBe('01');
    });
  });
});
