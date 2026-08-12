#!/usr/bin/env bash
set -euo pipefail

DECK_REPO="/Users/fabiensalles/projects/github/deck"
FORMATION_REPO="/Users/fabiensalles/projects/conveycode/formation"
BENCH_DIR="/Users/fabiensalles/orca/workspaces/formation/deck-bench"
BENCH_BRANCH="bench/deck-consumer"

pack_and_install_deck() {
  (cd "$DECK_REPO" && npm run build)
  local tarball
  tarball=$(cd "$DECK_REPO" && npm pack --silent --pack-destination "$BENCH_DIR")
  (cd "$BENCH_DIR" && npm install "./$tarball")
  rm -f "$BENCH_DIR/$tarball"
}

# Carries the formation repo's own local engine (predating the package) over
# to consuming @conveycode/deck: its routes, content loading and theming
# replace src/lib, src/pages, scripts/pdf-export and tests/behaviors.
migrate_to_package() {
  rm -rf "$BENCH_DIR/src/lib" "$BENCH_DIR/src/pages" \
    "$BENCH_DIR/scripts/pdf-export" "$BENCH_DIR/tests/behaviors"

  # A theme slot replaces the package entry point wholesale. Pointing a slot at a
  # bare formation sheet therefore drops the package's structural rules — the ones
  # constraining a slide to the configured height — and auto-resize stops detecting
  # anything. Each entry pulls the package entry first, then formation's own.
  for slot in presentation:custom-theme document:document home:home; do
    cat > "$BENCH_DIR/src/styles/deck-${slot%%:*}.scss" <<EOF
@use '@conveycode/deck/styles/theme-${slot%%:*}.scss';
@use '${slot##*:}';
EOF
  done

  cat > "$BENCH_DIR/astro.config.mjs" <<'EOF'
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import deck from '@conveycode/deck';

export default defineConfig({
  srcDir: './src',
  outDir: './dist',

  integrations: [
    mdx(),
    deck({
      contentBase: 'formations',
      collection: 'formations',
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
  (cd "$BENCH_DIR/dist" && find . -name index.html | sed 's#^\./##' | sort) \
    > "$BENCH_DIR/.bench/routes-before.txt"

  pack_and_install_deck
  migrate_to_package
}

refresh() {
  if [ ! -d "$BENCH_DIR" ]; then
    setup
    return
  fi
  pack_and_install_deck
  migrate_to_package
}

case "${1:-}" in
  setup) setup ;;
  refresh) refresh ;;
  *)
    echo "usage: $(basename "$0") {setup|refresh}" >&2
    exit 1
    ;;
esac
