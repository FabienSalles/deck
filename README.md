# @fabiensalles/deck

Astro integration for Reveal.js presentations with exercises, corrections, and PDF export.

## Installation

```bash
npm install @fabiensalles/deck
```

## Quick start

`@fabiensalles/deck` is an Astro integration. Your project needs `astro` (^5.0.0),
`mermaid` (^11.0.0) and `sass` (^1.83.0) installed as peer dependencies. `sass` compiles the
themes the integration ships:

```bash
npm install @fabiensalles/deck astro@^5 mermaid sass
```

Register it in `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import deck from '@fabiensalles/deck';

export default defineConfig({
  integrations: [deck()],
});
```

Declare the content collection in `src/content/config.ts`:

```ts
import { defineCollection } from 'astro:content';
import { SlideSchema } from '@fabiensalles/deck/content';

export const collections = {
  decks: defineCollection({ type: 'content', schema: SlideSchema }),
};
```

A deck is a directory under `src/content/decks/`, holding a `_meta.yaml` and a `slides/`
directory with one markdown file per slide group:

```
src/content/decks/demo/session-1/
├── _meta.yaml
└── slides/
    └── 01-intro.md
```

```yaml
id: demo-session-1
title: "Demo"
```

`astro build` renders that deck at `/demo/session-1/`.

PDF export (the `deck-pdf` binary) launches Chromium through `puppeteer-core`, which does not
ship a browser of its own. Point `PUPPETEER_EXECUTABLE_PATH` at one (a Playwright or
Puppeteer browser cache works) before running it:

```bash
PUPPETEER_EXECUTABLE_PATH=/path/to/chromium deck-pdf
```
