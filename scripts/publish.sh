#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMMIT_MESSAGE="${1:-chore: update Oripachi site}"

echo "Checking the site..."
npm run lint
npx next build --webpack

if git diff --quiet && git diff --cached --quiet; then
  echo "No local changes to publish."
  exit 0
fi

echo "Saving changes..."
git add .
git commit -m "$COMMIT_MESSAGE"

echo "Publishing to GitHub..."
git push origin main

echo "Done. Vercel will update the public site automatically."
