#!/usr/bin/env bash
# Auto-deploy for lazy-closet. Pulls origin/main, rebuilds, mirrors into Caddy mount.
set -eu
LOCK=/tmp/lazy-closet-auto-deploy.lock
exec 9>"$LOCK"
flock -n 9 || exit 0

cd /opt/lazy-closet
OLD=$(git rev-parse HEAD)
git fetch origin --quiet
NEW=$(git rev-parse origin/main)
if [ "$OLD" = "$NEW" ]; then
    echo "lazy-closet: no upstream changes"
    exit 0
fi
echo "lazy-closet: deploying $OLD -> $NEW"
git reset --hard origin/main
npm ci --no-audit --no-fund
APP_URL="https://lazy-closet.ericai.dev" npm run build

# Mirror into admin-dashboard's static mount (visible to Caddy container)
rsync -a --delete /opt/lazy-closet/dist/ /opt/admin-dashboard/static/lazy-closet/
chmod -R o+rX /opt/admin-dashboard/static/lazy-closet
echo "lazy-closet: deployed $NEW"
