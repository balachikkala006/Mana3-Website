#!/bin/bash
# Run from Terminal: bash scripts/push-to-github.sh YOUR_GITHUB_USERNAME
set -e
cd "$(dirname "$0")/.."
USER="${1:?Usage: bash scripts/push-to-github.sh YOUR_GITHUB_USERNAME}"

if [ ! -d .git ]; then
  git init
  git branch -M main
fi

git add -A
git status

if git diff --cached --quiet; then
  echo "Nothing new to commit."
else
  git commit -m "Launch Mana3 Events — mana3events.com"
fi

REMOTE="https://github.com/${USER}/mana3-website.git"
if git remote get-url origin &>/dev/null; then
  git remote set-url origin "$REMOTE"
else
  git remote add origin "$REMOTE"
fi

echo ""
echo "Next: Create empty repo at https://github.com/new named 'mana3-website'"
echo "Then run: git push -u origin main"
echo ""
read -p "Press Enter after you created the repo on GitHub..."
git push -u origin main

echo ""
echo "Done! Enable Pages: https://github.com/${USER}/mana3-website/settings/pages"
echo "Custom domain: mana3events.com"
echo "Full guide: LAUNCH.md"
