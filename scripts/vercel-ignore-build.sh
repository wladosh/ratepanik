#!/usr/bin/env bash
# Vercel Ignored Build Step.
# Exit 0 = skip this build. Exit 1 = continue the build.
#
# Skipped (canceled) builds still count toward Hobby's 100 deploys/day.
# This script only frees the single concurrent Hobby build slot when the
# commit cannot change the Next.js app (docs, SQL, README, meta).
#
# See: https://vercel.com/docs/project-configuration/project-settings#ignored-build-step

set -euo pipefail

echo "VERCEL_ENV=${VERCEL_ENV:-unset}"

if ! git rev-parse --verify HEAD^ >/dev/null 2>&1; then
  echo "No parent commit — build"
  exit 1
fi

changed="$(git diff --name-only HEAD^ HEAD || true)"
if [ -z "$changed" ]; then
  echo "Empty diff — skip"
  exit 0
fi

echo "Changed files:"
echo "$changed"

while IFS= read -r file; do
  [ -z "$file" ] && continue
  case "$file" in
    docs/*|supabase/*|.github/*|*.md|.gitignore|LICENSE|.cursor/*|scripts/vercel-ignore-build.sh|vercel.json|.vercelignore)
      ;;
    *)
      echo "App-relevant change: $file — build"
      exit 1
      ;;
  esac
done <<< "$changed"

echo "Docs/SQL/meta only — skip preview/production build"
exit 0
