# @fabiensalles/deck

Astro integration for Reveal.js presentations with exercises, corrections, and PDF export.

## Installation

```bash
npm install @fabiensalles/deck
```

## Quick start

`@fabiensalles/deck` is an Astro integration. Your project needs `astro` (^5.0.0) and
`mermaid` (^11.0.0) installed as peer dependencies:

```bash
npm install @fabiensalles/deck astro mermaid
```

Register it in `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import deck from '@fabiensalles/deck';

export default defineConfig({
  integrations: [deck()],
});
```

PDF export (the `deck-pdf` binary) launches Chromium through `puppeteer-core`, which does not
ship a browser of its own. Point `PUPPETEER_EXECUTABLE_PATH` at one (a Playwright or
Puppeteer browser cache works) before running it:

```bash
PUPPETEER_EXECUTABLE_PATH=/path/to/chromium deck-pdf
```
