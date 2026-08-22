#!/usr/bin/env bash
# Replays the sequence CI runs to prove a fresh consumer installs correctly. Assumes the
# Playwright browsers are already cached: that download is a runner-only workflow step,
# never a command this script issues.
set -euo pipefail

cd "$(dirname "$0")/.."

node scripts/check-readme-quickstart.mjs

npm ci
npm run build
npm pack --silent --pack-destination e2e

cd e2e
npm install ./fabiensalles-deck-*.tgz

test ! -e node_modules/puppeteer

node scripts/check-pdf-export.mjs
node scripts/check-package-surface.mjs

npm run build
npm test
