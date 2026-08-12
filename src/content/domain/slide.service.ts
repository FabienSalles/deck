/**
 * Slide Service — Pure Domain Functions
 * Image path conversion, exercise link conversion.
 * No fs, no browser — string transforms only.
 */

/**
 * Converts relative `_images/` paths to absolute public paths.
 *
 * `_images/foo.png` → `/decks/ddd/session-1/_images/foo.png`
 * `../_images/foo.png` → `/decks/ddd/session-1/_images/foo.png`
 *
 * @param imagesPrefix - Base URL prefix for images (e.g., `/decks/ddd/session-1/_images`)
 */
export function convertImagePaths(markdown: string, imagesPrefix: string): string {
  // Markdown image syntax: ![alt](_images/...) or ![alt](../_images/...)
  let result = markdown.replace(
    /!\[([^\]]*)\]\(\s*(?:\.\.?\/)?\s*_images\/([^)\s]+)\s*\)/g,
    `![$1](${imagesPrefix}/$2)`,
  );

  // HTML img src: src="_images/..." or src="../_images/..."
  result = result.replace(
    /src=["'](?:\.\.?\/)?_images\/([^"']+)["']/g,
    `src="${imagesPrefix}/$1"`,
  );

  return result;
}

/**
 * Converts exercise/correction image links to clickable links.
 *
 * `![exercice:01](path)` → `<a href="/ddd/session-1/exercices/01" ...><img ...></a>`
 * `![correction:01](path)` → `<a href="/ddd/session-1/corrections/01" ...><img ...></a>`
 */
export function convertExerciseLinks(markdown: string, basePath: string): string {
  return markdown.replace(
    /!\[(exercice|correction):(\d+)\]\(([^)]+)\)/g,
    (_, type: string, num: string, imagePath: string) => {
      const plural = type === 'exercice' ? 'exercices' : 'corrections';
      const href = `/${basePath}/${plural}/${num}`;

      return `<a href="${href}" class="exercise-link" target="_blank" title="Open ${type} ${num}">![${type}](${imagePath})</a>`;
    },
  );
}

/**
 * Prepares slide markdown for Reveal.js rendering.
 * Applies exercise links and image path conversion in sequence.
 */
export function prepareSlideMarkdown(
  rawMarkdown: string,
  deckPath: string,
  contentBase = 'decks',
): string {
  const imagesPrefix = `/${contentBase}/${deckPath}/_images`;
  const withExerciseLinks = convertExerciseLinks(rawMarkdown, deckPath);

  return convertImagePaths(withExerciseLinks, imagesPrefix);
}

/**
 * Extracts the deck path from a slide ID.
 *
 * A deck is a folder holding a `slides/` subfolder. Markdown living anywhere
 * else — exercises, corrections, loose notes at the collection root — belongs
 * to no deck and must not surface as one.
 *
 * `ddd/jour-1/slides/01-intro` → `ddd/jour-1`
 * `ddd/jour-1/exercices/01-supple-design` → null
 * `ddd/qcm-jour-2` → null
 */
export function extractDeckPath(slideId: string): string | null {
  const parts = slideId.split('/');
  const slidesIndex = parts.indexOf('slides');

  if (slidesIndex <= 0) {
    return null;
  }

  return parts.slice(0, slidesIndex).join('/');
}

/**
 * Groups slide IDs by their deck path.
 */
export function groupSlidesByDeck<T extends { id: string }>(
  slides: readonly T[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const slide of slides) {
    const deckPath = extractDeckPath(slide.id);

    if (deckPath === null) {
      continue;
    }

    const existing = groups.get(deckPath);

    if (existing !== undefined) {
      existing.push(slide);
    } else {
      groups.set(deckPath, [slide]);
    }
  }

  return groups;
}

/**
 * Extracts the title from markdown content (first `# ` heading).
 */
export function extractTitleFromMarkdown(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);

  return match?.[1] ?? null;
}

/**
 * Extracts the exercise number from a filename.
 * `01-introduction.md` → `01`
 */
export function extractExerciseNumber(filename: string): string {
  const match = filename.match(/^(\d+)/);

  return match?.[1] ?? '01';
}
