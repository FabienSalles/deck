#!/usr/bin/env bash
# Proves the published quickstart works for someone who only has npm: installs from the
# registry into a clean directory outside this repository, follows the README step by step,
# and expects a rendered deck plus an exported PDF without any browser being downloaded.
set -euo pipefail

PORT=4323
WORKDIR=$(mktemp -d)
PREVIEW_PID=

cleanup() {
  [ -n "$PREVIEW_PID" ] && kill "$PREVIEW_PID" 2>/dev/null || true
  rm -rf "$WORKDIR"
}
trap cleanup EXIT

resolve_chromium() {
  if [ -n "${PUPPETEER_EXECUTABLE_PATH:-}" ]; then
    printf '%s\n' "$PUPPETEER_EXECUTABLE_PATH"
    return
  fi

  local cache found
  for cache in "$HOME/Library/Caches/ms-playwright" "$HOME/.cache/ms-playwright"; do
    [ -d "$cache" ] || continue
    found=$(find "$cache" -name chrome-headless-shell -type f 2>/dev/null | sort | tail -1)
    if [ -n "$found" ]; then
      printf '%s\n' "$found"
      return
    fi
  done

  echo "no chromium found: set PUPPETEER_EXECUTABLE_PATH, or run npx playwright install chromium-headless-shell" >&2
  exit 1
}

CHROMIUM=$(resolve_chromium)
echo "consumer workspace: $WORKDIR"
echo "chromium: $CHROMIUM"

cd "$WORKDIR"
npm init -y >/dev/null
npm pkg set type=module >/dev/null

npm install @fabiensalles/deck 'astro@^5' mermaid sass >/dev/null

test ! -e node_modules/puppeteer

cat > astro.config.mjs <<'EOF'
import { defineConfig } from 'astro/config';
import deck from '@fabiensalles/deck';

export default defineConfig({ integrations: [deck()] });
EOF

mkdir -p src/content/decks/demo/session-1/slides

cat > src/content/config.ts <<'EOF'
import { defineCollection } from 'astro:content';
import { SlideSchema } from '@fabiensalles/deck/content';

export const collections = {
  decks: defineCollection({ type: 'content', schema: SlideSchema }),
};
EOF

cat > src/content/decks/demo/session-1/_meta.yaml <<'EOF'
id: demo-session-1
title: "Demo"
EOF

cat > src/content/decks/demo/session-1/slides/01-intro.md <<'EOF'
## Hello

First slide.
EOF

npx astro build >/dev/null

test -f dist/index.html
test -f dist/demo/session-1/index.html

npx astro preview --port "$PORT" >/dev/null 2>&1 &
PREVIEW_PID=$!

for _ in $(seq 1 30); do
  curl -sf -o /dev/null "http://localhost:$PORT/" && break
  sleep 1
done
curl -sf -o /dev/null "http://localhost:$PORT/"

PUPPETEER_EXECUTABLE_PATH="$CHROMIUM" npx deck-pdf all --base-url "http://localhost:$PORT" >/dev/null

test -f public/pdf/demo/session-1/slides.pdf

test ! -e node_modules/puppeteer

echo "fresh consumer check passed: installed from the registry, rendered a deck, exported a PDF"
