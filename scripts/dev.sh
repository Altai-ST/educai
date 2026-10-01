#!/usr/bin/env bash
# (re)starts the dev server in the background; pid in /tmp/zm-vite.pid
cd "$(dirname "$0")/.."
[ -f /tmp/zm-vite.pid ] && kill "$(cat /tmp/zm-vite.pid)" 2>/dev/null
setsid nohup node node_modules/vite/bin/vite.js --port 5173 --strictPort > /tmp/vite.log 2>&1 &
echo $! > /tmp/zm-vite.pid
sleep 2
tail -3 /tmp/vite.log
