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

setup() {
  git -C "$FORMATION_REPO" worktree add -B "$BENCH_BRANCH" "$BENCH_DIR"
  (cd "$BENCH_DIR" && npm ci)
  (cd "$BENCH_DIR" && npm run build)

  mkdir -p "$BENCH_DIR/.bench"
  (cd "$BENCH_DIR/dist" && find . -name index.html | sed 's#^\./##' | sort) \
    > "$BENCH_DIR/.bench/routes-before.txt"

  pack_and_install_deck
}

refresh() {
  if [ ! -d "$BENCH_DIR" ]; then
    setup
    return
  fi
  pack_and_install_deck
}

case "${1:-}" in
  setup) setup ;;
  refresh) refresh ;;
  *)
    echo "usage: $(basename "$0") {setup|refresh}" >&2
    exit 1
    ;;
esac
