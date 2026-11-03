#!/usr/bin/env bash
# Nightly off-site backup: snapshots the live database and pushes it to the
# private GitHub repo eau-cure-backups, so the data survives if the server dies.
# Runs from cron on the server — see docs/deployment/OFFSITE_BACKUPS.md.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/eau-cure}"
BACKUP_REPO="${BACKUP_REPO:-/var/www/eau-cure-backups}"
KEEP_FILES="${KEEP_FILES:-90}"   # newest N kept in the repo tree; older ones stay in git history

stamp="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
mkdir -p "$BACKUP_REPO/daily"
tmp="$(mktemp --suffix=.db)"
trap 'rm -f "$tmp"' EXIT

cd "$APP_DIR"
node scripts/snapshotDb.js "$tmp"
if [ ! -s "$tmp" ]; then
  echo "[$stamp] ERROR: snapshot is empty" >&2
  exit 1
fi
gzip -c "$tmp" > "$BACKUP_REPO/daily/water_station_${stamp}.db.gz"

cd "$BACKUP_REPO"
ls -1t daily/*.db.gz | tail -n +"$((KEEP_FILES + 1))" | xargs -r git rm -q --
git add daily
git commit -q -m "Backup $stamp"
git push -q origin HEAD

echo "[$stamp] Off-site backup pushed: water_station_${stamp}.db.gz"
