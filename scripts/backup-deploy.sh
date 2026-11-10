#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/deploy-common.sh"
load_images
umask 077
backup_dir="${BACKUP_DIR:-$HOME/signaldesk-backups}"
mkdir -p "$backup_dir"
chmod 700 "$backup_dir"
backup_file="$(mktemp "$backup_dir/pre-deploy-XXXXXXXX.dump")"
trap 'echo "Backup failed; incomplete file: $backup_file" >&2' ERR
echo 'Creating database backup...'
timeout 120s sudo env API_IMAGE="$API_IMAGE" WEB_IMAGE="$WEB_IMAGE" \
  docker compose -p signaldesk-deploy --env-file "$DEPLOY_ENV_FILE" \
  -f compose.deploy.yaml exec -T --interactive=false postgres sh -c \
  'pg_dump -w -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$backup_file"
test -s "$backup_file"
# Only check the archive directory here. A restore rehearsal is a separate check.
timeout 120s sudo docker run --rm -i postgres:18-alpine \
  pg_restore --list < "$backup_file" > /dev/null
printf 'Backup archive check passed: %s\n' "$backup_file"
