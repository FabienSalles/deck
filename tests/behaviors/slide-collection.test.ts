import { describe, it, expect } from 'vitest';
import {
  SlideCollection,
  getFilename,
  extractNumericPrefix,
  hasNumericPrefix,
  formatDayName,
} from '../../src/content/domain/slide.model';

describe('SlideCollection - Immutable ordered slide collection', () => {
  it('should sort slides by their numeric prefix', () => {
    // GIVEN slides in arbitrary order
    const slides = [
      { id: 'ddd/jour-1/slides/03-patterns', body: '# Patterns' },
      { id: 'ddd/jour-1/slides/01-intro', body: '# Intro' },
      { id: 'ddd/jour-1/slides/02-concepts', body: '# Concepts' },
    ];

    // WHEN creating a collection
    const collection = new SlideCollection(slides);

    // THEN iteration yields slides in numeric order
    const bodies = [...collection].map((s) => s.body);
    expect(bodies).toEqual(['# Intro', '# Concepts', '# Patterns']);
  });

  describe('toMarkdown()', () => {
    it('should concatenate slide bodies with --- separator', () => {
      // GIVEN ordered slides
      const slides = [
        { id: 'ddd/jour-1/slides/01-intro', body: '# Intro' },
        { id: 'ddd/jour-1/slides/02-concepts', body: '# Concepts' },
      ];
      const collection = new SlideCollection(slides);

      // WHEN converting to markdown
      const markdown = collection.toMarkdown();

      // THEN slides are joined with Reveal.js horizontal separator
      expect(markdown).toBe('# Intro\n\n---\n\n# Concepts');
    });

    it('should skip slides without numeric prefix (like _meta)', () => {
      // GIVEN slides including non-numeric ones
      const slides = [
        { id: 'ddd/jour-1/slides/_meta', body: 'title: DDD' },
        { id: 'ddd/jour-1/slides/01-intro', body: '# Intro' },
        { id: 'ddd/jour-1/slides/02-concepts', body: '# Concepts' },
      ];
      const collection = new SlideCollection(slides);

      // WHEN converting to markdown
      const markdown = collection.toMarkdown();

      // THEN _meta slide is excluded
      expect(markdown).toBe('# Intro\n\n---\n\n# Concepts');
      expect(markdown).not.toContain('title: DDD');
    });
  });

  describe('count', () => {
    it('should return the total number of slides including non-numeric', () => {
      // GIVEN a collection with 3 slides
      const slides = [
        { id: 'ddd/jour-1/slides/01-intro', body: '# Intro' },
        { id: 'ddd/jour-1/slides/_meta', body: 'title: DDD' },
        { id: 'ddd/jour-1/slides/02-concepts', body: '# Concepts' },
      ];
      const collection = new SlideCollection(slides);

      // THEN count returns total slides in the collection
      expect(collection.count).toBe(3);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty collection', () => {
      // GIVEN an empty collection
      const collection = new SlideCollection([]);

      // THEN isEmpty is true
      expect(collection.isEmpty).toBe(true);
    });

    it('should return false for non-empty collection', () => {
      // GIVEN a collection with slides
      const collection = new SlideCollection([
        { id: 'ddd/jour-1/slides/01-intro', body: '# Intro' },
      ]);

      // THEN isEmpty is false
      expect(collection.isEmpty).toBe(false);
    });
  });

  describe('Iterable via for...of', () => {
    it('should be iterable using for...of loop', () => {
      // GIVEN a collection
      const slides = [
        { id: 'ddd/jour-1/slides/01-intro', body: '# Intro' },
        { id: 'ddd/jour-1/slides/02-concepts', body: '# Concepts' },
      ];
      const collection = new SlideCollection(slides);

      // WHEN iterating with for...of
      const result: string[] = [];
      for (const slide of collection) {
        result.push(slide.body);
      }

      // THEN all slides are yielded in order
      expect(result).toEqual(['# Intro', '# Concepts']);
    });
  });
});

describe('Slide helpers - Pure utility functions', () => {
  describe('getFilename()', () => {
    it('should extract the filename from a path', () => {
      expect(getFilename('ddd/jour-1/slides/01-intro')).toBe('01-intro');
    });

    it('should return the input when there is no slash', () => {
      expect(getFilename('01-intro')).toBe('01-intro');
    });

    it('should handle deeply nested paths', () => {
      expect(getFilename('a/b/c/d/file')).toBe('file');
    });
  });

  describe('extractNumericPrefix()', () => {
    it('should extract the numeric prefix from a filename', () => {
      expect(extractNumericPrefix('01-intro')).toBe(1);
      expect(extractNumericPrefix('12-advanced')).toBe(12);
    });

    it('should return 999 for filenames without numeric prefix', () => {
      expect(extractNumericPrefix('_meta')).toBe(999);
      expect(extractNumericPrefix('intro')).toBe(999);
    });
  });

  describe('hasNumericPrefix()', () => {
    it('should return true for filenames starting with digits followed by dash', () => {
      expect(hasNumericPrefix('01-intro')).toBe(true);
      expect(hasNumericPrefix('123-test')).toBe(true);
    });

    it('should return false for filenames without numeric prefix', () => {
      expect(hasNumericPrefix('_meta')).toBe(false);
      expect(hasNumericPrefix('intro')).toBe(false);
      expect(hasNumericPrefix('01intro')).toBe(false); // no dash
    });
  });

  describe('formatDayName()', () => {
    it('should replace dashes with spaces and capitalize words', () => {
      expect(formatDayName('jour-1')).toBe('Jour 1');
      expect(formatDayName('day-2')).toBe('Day 2');
    });

    it('should capitalize each word', () => {
      expect(formatDayName('advanced-topics')).toBe('Advanced Topics');
    });
  });
});
