/**
 * Type declarations for external modules without bundled types.
 */

// Reveal.js core
declare module 'reveal.js' {
  interface RevealApi {
    initialize(config?: Record<string, unknown>): Promise<void>;
    configure(config: Record<string, unknown>): void;
    getConfig(): Record<string, unknown>;
    getSlides(): HTMLElement[];
    getTotalSlides(): number;
    getSlidePastCount(): number;
    getState(): Record<string, unknown>;
    setState(state: Record<string, unknown>): void;
    getIndices(): { h: number; v: number; f?: number };
    getCurrentSlide(): HTMLElement;
    getRevealElement(): HTMLElement;
    on(event: string, callback: ((...args: unknown[]) => void) | EventListener): void;
    off(event: string, callback: ((...args: unknown[]) => void) | EventListener): void;
    slide(h: number, v?: number, f?: number): void;
    sync(): void;
    isLastSlide(): boolean;
    isFirstSlide(): boolean;
    isOverview(): boolean;
    isPaused(): boolean;
    isReady(): boolean;
    getPlugin(id: string): unknown;
    registerPlugin(plugin: unknown): void;
    addKeyBinding(binding: Record<string, unknown>, callback: () => void): void;
  }

  interface Plugin {
    id: string;
    init?(deck: RevealApi): void | Promise<void>;
    destroy?(): void;
  }

  type Api = RevealApi;

  function initialize(config?: Record<string, unknown>): Promise<RevealApi>;
  export default initialize;
  export { Api, Plugin, RevealApi };
}

// Reveal.js plugins
declare module 'reveal.js/plugin/markdown/markdown.esm.js' {
  const Markdown: () => unknown;
  export default Markdown;
}

declare module 'reveal.js/plugin/highlight/highlight.esm.js' {
  const Highlight: () => unknown;
  export default Highlight;
}

declare module 'reveal.js/plugin/notes/notes.esm.js' {
  const Notes: () => unknown;
  export default Notes;
}

declare module 'reveal.js/plugin/search/search.esm.js' {
  const Search: () => unknown;
  export default Search;
}

declare module 'reveal.js/plugin/zoom/zoom.esm.js' {
  const Zoom: () => unknown;
  export default Zoom;
}

// Mermaid.js
declare module 'mermaid' {
  interface MermaidConfig {
    startOnLoad?: boolean;
    theme?: string;
    themeCSS?: string;
    securityLevel?: string;
    [key: string]: unknown;
  }

  interface RenderResult {
    svg: string;
    bindFunctions?: (element: Element) => void;
  }

  const mermaid: {
    initialize(config: MermaidConfig): void;
    render(id: string, text: string): Promise<RenderResult>;
    parse(text: string): Promise<unknown>;
    contentLoaded(): void;
  };

  export default mermaid;
  export type { MermaidConfig, RenderResult };
}

