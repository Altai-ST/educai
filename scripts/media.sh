#!/usr/bin/env bash
# Copies the rendered lessons from ../projects into public/ in web-friendly form.
set -euo pipefail
cd "$(dirname "$0")/.."
P=../projects
declare -A PREVIEW=( [drobi]=33 [desyatichnye]=2 [procenty]=1 )
for s in drobi desyatichnye procenty; do
  src="$P/$s/out/${s}_compact.mp4"
  out=public/media/$s
  mkdir -p "$out"
  ffmpeg -v error -y -i "$src" -c copy -movflags +faststart "$out/video.mp4"
  ffmpeg -v error -y -i "$P/$s/out/thumbnail.jpg" -vf scale=1280:-1 -q:v 3 "$out/poster.jpg"
  # silent 6-s loop for hover previews
  ffmpeg -v error -y -ss "${PREVIEW[$s]}" -t 6 -i "$src" -an -vf "scale=768:-2,fps=30" -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart "$out/preview.mp4"
  # scrub sprite: one frame every 2 s, 10 columns
  ffmpeg -v error -y -i "$src" -vf "fps=1/2,scale=192:108,tile=10x5" -frames:v 1 -q:v 4 "$out/sprite.jpg"
  mkdir -p src/data/tl && cp "$P/$s/src/timeline.json" "src/data/tl/$s.json"
done
cp "$P/drobi/public/Rubik.ttf" public/fonts/Rubik.ttf
cp "$P/drobi/public/grain.png" public/grain.png
for f in "$P"/drobi/public/sfx/*.wav; do
  n=$(basename "$f" .wav)
  ffmpeg -v error -y -i "$f" -ac 1 -c:a libmp3lame -b:a 96k "public/sfx/$n.mp3"
done
echo done
