#!/usr/bin/env bash
# Re-apply git identity + remote (sandbox may not persist .git/config across sessions)
set -e
git config user.name "clickalex"
git config user.email "clickalex@users.noreply.github.com"
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/clickalex/GrinKingdom.git
echo "Git ready:"; git remote -v
