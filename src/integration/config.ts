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
   * Heading and document title of the home page.
   * @default 'Presentations'
   */
  readonly homeTitle?: string;

  /**
   * Subtitle and meta description of the home page.
   * @default 'Interactive technical presentations'
   */
  readonly homeSubtitle?: string;

  /**
   * Custom Reveal.js configuration overrides.
   */
  readonly reveal?: Readonly<Record<string, unknown>>;

  /**
   * Stylesheets providing the theme, as project-root paths. Each one replaces
   * the package entry point of the same name, so a consumer copy can configure
   * the Sass variables, reorder the `@use` rules, drop one or add its own.
   */
  readonly styles?: DeckStyles;
};

export type DeckStyles = {
  readonly presentation?: string;
  readonly document?: string;
  readonly home?: string;
};

export const STYLE_SLOTS = ['presentation', 'document', 'home'] as const;

export type StyleSlot = (typeof STYLE_SLOTS)[number];

function packageEntry(slot: StyleSlot): string {
  return `@conveycode/deck/styles/theme-${slot}.scss`;
}

export type ResolvedDeckConfig = Omit<Required<DeckConfig>, 'styles'> & {
  readonly styles: Required<DeckStyles>;
};

export function contentDirOf(config: Pick<ResolvedDeckConfig, 'contentBase'>): string {
  return `src/content/${config.contentBase}`;
}

export const DEFAULT_CONFIG = {
  collection: 'decks',
  contentBase: 'decks',
  exercises: true,
  corrections: true,
  homePage: true,
  homeTitle: 'Presentations',
  homeSubtitle: 'Interactive technical presentations',
  reveal: {},
  styles: {
    presentation: packageEntry('presentation'),
    document: packageEntry('document'),
    home: packageEntry('home'),
  },
} as const satisfies Required<DeckConfig>;

/**
 * Resolves user config with defaults.
 */
export function resolveConfig(userConfig: DeckConfig = {}): ResolvedDeckConfig {
  return {
    collection: userConfig.collection ?? DEFAULT_CONFIG.collection,
    contentBase: userConfig.contentBase ?? DEFAULT_CONFIG.contentBase,
    exercises: userConfig.exercises ?? DEFAULT_CONFIG.exercises,
    corrections: userConfig.corrections ?? DEFAULT_CONFIG.corrections,
    homePage: userConfig.homePage ?? DEFAULT_CONFIG.homePage,
    homeTitle: userConfig.homeTitle ?? DEFAULT_CONFIG.homeTitle,
    homeSubtitle: userConfig.homeSubtitle ?? DEFAULT_CONFIG.homeSubtitle,
    reveal: { ...DEFAULT_CONFIG.reveal, ...userConfig.reveal },
    styles: Object.fromEntries(
      STYLE_SLOTS.map((slot) => [slot, userConfig.styles?.[slot] ?? packageEntry(slot)]),
    ) as Required<DeckStyles>,
  };
}
