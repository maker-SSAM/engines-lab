#!/bin/zsh
# rebuild.sh — 시험 덱 전체 다시 만들기.  사용: zsh rebuild.sh
# · 설치 도구는 OneDrive 밖 ~/engines-lab-tools 에 있다 (npm: reveal·impress·marp / slidev: Slidev)
# · 다른 곳에 설치했다면: zsh rebuild.sh <npm 폴더> <slidev 폴더>
set -e
cd "${0:A:h}"
NPM="${1:-$HOME/engines-lab-tools/npm}"
SLIDEV="${2:-$HOME/engines-lab-tools/slidev}"
node build-lab.js
"$NPM/node_modules/.bin/marp" marp/slides.md --theme-set marp/lab-theme.css --html --allow-local-files -o marp/index.html < /dev/null
cp slidev/slides.md "$SLIDEV/" && mkdir -p "$SLIDEV/styles" && cp slidev/style.css "$SLIDEV/styles/index.css"
(cd "$SLIDEV" && npx slidev build slides.md --base ./ --out dist < /dev/null)
rm -rf slidev/dist && cp -R "$SLIDEV/dist" slidev/dist
echo "완료"
