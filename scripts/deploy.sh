#!/usr/bin/env bash
# Builds the site for GitHub Pages (https://altai-st.github.io/educai/) and pushes it to the gh-pages branch.
set -euo pipefail
cd "$(dirname "$0")/.."
REMOTE=${REMOTE:-git@github.com:Altai-ST/educai.git}
BASE_PATH=${BASE_PATH:-/educai/} npx vite build
cp dist/index.html dist/404.html   # SPA fallback for unknown paths
# real copies for every known route, so deep links answer 200 (link previews in messengers work)
python3 - <<'PY'
import re, os, shutil
src = open('src/data/catalog.ts', encoding='utf-8').read()
subjects = re.findall(r"\{id: '([a-z-]+)', title: '[^']+', short:", src)
routes = ['katalog', 'predmety', 'progress'] + [f'predmet/{s}' for s in subjects]
for m in re.finditer(r"\{\s*id: '([a-z0-9-]+)',\s*subject:", src):
    tid = m.group(1)
    routes.append(f'tema/{tid}')
    block = src[m.end(): src.find("\n  {", m.end()) if src.find("\n  {", m.end()) > 0 else len(src)]
    stages = re.findall(r"\{id: '([a-z0-9-]+)', title: '[^']+', video:", block)
    if not stages:
        n = block.count("'") and len(re.findall(r"soon\(\[([^\]]*)\]", block)[0].split("',")) if re.findall(r"soon\(\[([^\]]*)\]", block) else 0
        stages = [f'e{i+1}' for i in range(n)]
    routes += [f'tema/{tid}/{s}' for s in stages]
for r in routes:
    os.makedirs(f'dist/{r}', exist_ok=True)
    shutil.copy('dist/index.html', f'dist/{r}/index.html')
print(len(routes), 'routes')
PY
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
