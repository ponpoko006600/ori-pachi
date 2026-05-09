#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMMIT_MESSAGE="${1:-chore: update Oripachi site}"

echo "Checking the site..."
npm run lint
npx next build --webpack

if git diff --quiet && git diff --cached --quiet; then
  AHEAD_COUNT="$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)"
  if [ "$AHEAD_COUNT" -eq 0 ]; then
    echo "No local changes to publish."
    exit 0
  fi
else
  echo "Saving changes..."
  git add .
  git commit -m "$COMMIT_MESSAGE"
fi

echo "Publishing to GitHub..."
git push origin main

echo "Done. Vercel will update the public site automatically."
