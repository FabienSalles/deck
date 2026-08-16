# @fabiensalles/deck

Astro integration for Reveal.js presentations with exercises, corrections, and PDF export.

## Installation

```bash
npm install @fabiensalles/deck
```

## Quick start

The commands below are the ones the `e2e` workflow runs: they build the package, pack it into
a tarball, install that tarball as a fresh consumer would, then build and test against it.

```bash
npm ci
npm run build
npm pack --silent --pack-destination e2e
cd e2e
npm install ./fabiensalles-deck-*.tgz
npx playwright install chromium chromium-headless-shell --with-deps
npm run build
npm test
```
