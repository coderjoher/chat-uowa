#!/usr/bin/env bash
# Back up the UOWA Chat database and uploaded files, keeping the last KEEP_DAYS days.
set -euo pipefail

cd "$(dirname "$0")"
BACKUP_DIR="${BACKUP_DIR:-$PWD/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y-%m-%d_%H%M)"

mkdir -p "$BACKUP_DIR"

docker compose exec -T mongodb mongodump --quiet --archive --gzip --db rocketchat > "$BACKUP_DIR/db_$STAMP.archive.gz"
docker compose exec -T rocketchat tar -czf - -C /app uploads > "$BACKUP_DIR/uploads_$STAMP.tar.gz"

find "$BACKUP_DIR" -name 'db_*.archive.gz' -mtime +"$KEEP_DAYS" -delete
find "$BACKUP_DIR" -name 'uploads_*.tar.gz' -mtime +"$KEEP_DAYS" -delete

echo "Backup written to $BACKUP_DIR (db_$STAMP.archive.gz, uploads_$STAMP.tar.gz)"
