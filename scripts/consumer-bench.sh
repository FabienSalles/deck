#!/usr/bin/env bash
set -euo pipefail

DECK_REPO="/Users/fabiensalles/projects/github/deck"
FORMATION_REPO="/Users/fabiensalles/projects/conveycode/formation"
BENCH_DIR="/Users/fabiensalles/orca/workspaces/formation/deck-bench"
BENCH_BRANCH="bench/deck-consumer"
BENCH_PORT=4321

ensure_preview() {
  local pid owner

  pid=$(lsof -t -nP -iTCP:"$BENCH_PORT" -sTCP:LISTEN 2>/dev/null | head -1 || true)

  if [ -n "$pid" ]; then
    owner=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | tail -1)
    owner=${owner#n}

    if [ "$owner" = "$BENCH_DIR" ]; then
      return
    fi

    echo "port $BENCH_PORT is served from $owner, not the bench: an export would capture that site" >&2
    exit 1
  fi

  (cd "$BENCH_DIR" && nohup npm run preview >/dev/null 2>&1 &)

  local attempt
  for attempt in $(seq 1 30); do
    if curl -s -o /dev/null "http://localhost:$BENCH_PORT/"; then
      return
    fi

    sleep 1
  done

  echo "the bench preview server never answered on port $BENCH_PORT" >&2
  exit 1
}

pack_and_install_deck() {
  (cd "$DECK_REPO" && npm run build)
  local tarball
  tarball=$(cd "$DECK_REPO" && npm pack --silent --pack-destination "$BENCH_DIR")
  (cd "$BENCH_DIR" && npm install "./$tarball")
  rm -f "$BENCH_DIR/$tarball"
}

# Carries the formation repo's own local engine (predating the package) over
# to consuming @fabiensalles/deck: its routes, content loading and theming
# replace src/lib, src/pages, scripts/pdf-export and tests/behaviors.
migrate_to_package() {
  rm -rf "$BENCH_DIR/src/lib" "$BENCH_DIR/src/pages" \
    "$BENCH_DIR/scripts/pdf-export" "$BENCH_DIR/tests/behaviors"

  # Both point at what the deletion above just removed, so `npm test` and the
  # type-check stay red until they follow. tests/functions is the only vitest
  # suite the migration leaves standing.
  (cd "$BENCH_DIR" && node -e "
    const fs = require('node:fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    pkg.scripts.test = 'vitest run tests/functions';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  ")
  sed -i '' "/'@lib': resolve/d" "$BENCH_DIR/vitest.config.ts"

  # A theme slot replaces the package entry point wholesale. Pointing a slot at a
  # bare formation sheet therefore drops the package's structural rules — the ones
  # constraining a slide to the configured height — and auto-resize stops detecting
  # anything. Each entry pulls the package entry first, then formation's own.
  for slot in presentation:custom-theme document:document home:home; do
    cat > "$BENCH_DIR/src/styles/deck-${slot%%:*}.scss" <<EOF
@use '@fabiensalles/deck/styles/theme-${slot%%:*}.scss';
@use '${slot##*:}';
EOF
  done

  cat > "$BENCH_DIR/astro.config.mjs" <<'EOF'
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import deck from '@fabiensalles/deck';

export default defineConfig({
  srcDir: './src',
  outDir: './dist',

  integrations: [
    mdx(),
    deck({
      contentBase: 'formations',
      collection: 'formations',
      homeTitle: 'Formations',
      homeSubtitle: 'Presentations techniques interactives',
      styles: {
        presentation: 'src/styles/deck-presentation.scss',
        document: 'src/styles/deck-document.scss',
        home: 'src/styles/deck-home.scss',
      },
    }),
  ],

  image: {
    service: {
      entrypoint: 'astro/assets/services/noop',
    },
  },

  vite: {
    server: {
      watch: {
        ignored: ['**/*.swp', '**/*~', '**/.#*'],
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: (source, filename) => {
            if (filename.includes('node_modules')) {
              return source;
            }
            return `@use "src/styles/variables" as *;\n${source}`;
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@layouts': '/src/layouts',
        '@styles': '/src/styles',
      },
    },
  },

  output: 'static',

  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },

  server: {
    port: 4321,
  },
});
EOF
}

setup() {
  git -C "$FORMATION_REPO" worktree add -B "$BENCH_BRANCH" "$BENCH_DIR"
  (cd "$BENCH_DIR" && npm ci)
  (cd "$BENCH_DIR" && npm run build)

  mkdir -p "$BENCH_DIR/.bench"
  # Formation's own engine derived a deck from any markdown in the collection, so
  # loose notes sitting at a formation's root published a phantom deck page. The
  # package drops those on purpose, so they must not count as routes lost.
  (cd "$BENCH_DIR/dist" && find . -name index.html | sed 's#^\./##' | sort) \
    | while IFS= read -r route; do
        segment=${route%%/*}

        if [ "$route" = "$segment/index.html" ] \
          && [ ! -d "$BENCH_DIR/src/content/formations/$segment/slides" ] \
          && [ -d "$BENCH_DIR/src/content/formations/$segment" ]; then
          continue
        fi

        printf '%s\n' "$route"
      done > "$BENCH_DIR/.bench/routes-before.txt"

  pack_and_install_deck
  migrate_to_package
  ensure_preview
}

refresh() {
  if [ ! -d "$BENCH_DIR" ]; then
    setup
    return
  fi
  pack_and_install_deck
  migrate_to_package
  ensure_preview
}

case "${1:-}" in
  setup) setup ;;
  refresh) refresh ;;
  *)
    echo "usage: $(basename "$0") {setup|refresh}" >&2
    exit 1
    ;;
esac
