/**
 * Deck Integration Config
 * User-facing configuration type for the Astro integration.
 */

export type DeckConfig = {
  /**
   * Name of the Astro content collection containing slides.
   * @default 'decks'
   */
  readonly collection?: string;

  /**
   * Base path for the content files relative to `src/content/`.
   * @default 'decks'
   */
  readonly contentBase?: string;

  /**
   * Enable exercise pages.
   * @default true
   */
  readonly exercises?: boolean;

  /**
   * Enable correction pages.
   * @default true
   */
  readonly corrections?: boolean;

  /**
   * Enable the home page (index listing all decks).
   * @default true
   */
  readonly homePage?: boolean;

  /**
   * Custom Reveal.js configuration overrides.
   */
  readonly reveal?: Readonly<Record<string, unknown>>;
};

export const DEFAULT_CONFIG = {
  collection: 'decks',
  contentBase: 'decks',
  exercises: true,
  corrections: true,
  homePage: true,
  reveal: {},
} as const satisfies Required<DeckConfig>;

/**
 * Resolves user config with defaults.
 */
export function resolveConfig(userConfig: DeckConfig = {}): Required<DeckConfig> {
  return {
    collection: userConfig.collection ?? DEFAULT_CONFIG.collection,
    contentBase: userConfig.contentBase ?? DEFAULT_CONFIG.contentBase,
    exercises: userConfig.exercises ?? DEFAULT_CONFIG.exercises,
    corrections: userConfig.corrections ?? DEFAULT_CONFIG.corrections,
    homePage: userConfig.homePage ?? DEFAULT_CONFIG.homePage,
    reveal: { ...DEFAULT_CONFIG.reveal, ...userConfig.reveal },
  };
}
