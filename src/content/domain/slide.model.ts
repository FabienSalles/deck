/**
 * Content Domain — Pure Types & Value Objects
 * No fs, no browser, no Astro dependency.
 */

// -- Slide --

export type Slide = {
  readonly id: string;
  readonly body: string;
};

// -- Slide Collection (Iterable Value Object) --

/**
 * Immutable, iterable collection of slides.
 * Follows Tell Don't Ask: exposes behavior (`toMarkdown`), not raw data.
 */
export class SlideCollection implements Iterable<Slide> {
  private readonly slides: readonly Slide[];

  constructor(slides: readonly Slide[]) {
    this.slides = [...slides].sort((a, b) => {
      const aPrefix = extractNumericPrefix(getFilename(a.id));
      const bPrefix = extractNumericPrefix(getFilename(b.id));

      return aPrefix - bPrefix;
    });
  }

  get count(): number {
    return this.slides.length;
  }

  get isEmpty(): boolean {
    return this.slides.length === 0;
  }

  /**
   * Concatenates all slide bodies with `---` separators (Reveal.js convention).
   * Only includes slides with a numeric prefix in their filename.
   */
  toMarkdown(): string {
    return this.slides
      .filter((slide) => hasNumericPrefix(getFilename(slide.id)))
      .map((slide) => slide.body)
      .join('\n\n---\n\n');
  }

  [Symbol.iterator](): Iterator<Slide> {
    return this.slides[Symbol.iterator]();
  }
}

// -- Deck Metadata --

export type DeckMeta = {
  readonly id: string;
  readonly title: string;
  readonly tags?: readonly string[];
  readonly reveal?: Readonly<Record<string, unknown>>;
};

// -- Exercise / Correction --

export type ExerciseInfo = {
  readonly num: string;
  readonly title: string;
  readonly filename: string;
};

export type ExerciseData = ExerciseInfo & {
  readonly content: string;
};

// -- Deck Listing --

export type DeckDay = {
  readonly path: string;
  readonly dayName: string;
  readonly id: string;
  readonly title: string;
  readonly tags?: readonly string[];
  readonly hasExercises: boolean;
  readonly hasCorrections: boolean;
};

export type DeckGroup = {
  readonly name: string;
  readonly days: readonly DeckDay[];
};

// -- Pure Helpers --

export function getFilename(id: string): string {
  return id.split('/').pop() || id;
}

export function extractNumericPrefix(filename: string): number {
  const match = filename.match(/^(\d+)-/);

  return match?.[1] !== undefined ? parseInt(match[1], 10) : 999;
}

export function hasNumericPrefix(filename: string): boolean {
  return /^\d+-/.test(filename);
}

export function formatDayName(dayName: string): string {
  return dayName
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
