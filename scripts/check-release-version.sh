#!/usr/bin/env bash
# Refuses a Release whose tag disagrees with the manifest it would publish. A Release can be
# cut on any commit, including one whose manifest was never bumped, so the tag is not proof.
set -euo pipefail

cd "$(dirname "$0")/.."

tag=${1:-}

if [ -z "$tag" ]; then
  echo "usage: check-release-version.sh <tag>" >&2
  exit 2
fi

manifest=$(node -p "require('./package.json').version")

if [ "$tag" != "v$manifest" ]; then
  echo "release tag $tag does not match manifest version $manifest (expected v$manifest)" >&2
  exit 1
fi

echo "release tag $tag matches manifest version $manifest"
