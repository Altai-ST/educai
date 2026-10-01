#!/usr/bin/env bash
# Builds the site for GitHub Pages (https://altai-st.github.io/educai/) and pushes it to the gh-pages branch.
set -euo pipefail
cd "$(dirname "$0")/.."
REMOTE=${REMOTE:-git@github.com:Altai-ST/educai.git}
BASE_PATH=${BASE_PATH:-/educai/} npx vite build
cp dist/index.html dist/404.html   # SPA fallback: deep links like /educai/tema/… open the app
touch dist/.nojekyll
tmp=$(mktemp -d)
cp -r dist/. "$tmp"
cd "$tmp"
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy $(date -u +%Y-%m-%dT%H:%MZ)"
git push -f "$REMOTE" gh-pages
rm -rf "$tmp"
echo "deployed → https://altai-st.github.io/educai/"
