#!/usr/bin/env bash
set -euo pipefail
: "${1:?Usage: bash scripts/verify-backup.sh /absolute/path/backup.dump}"
test -s "$1"
backup_file="$1"
container="signaldesk-restore-$(date +%s)-$$"
cleanup() { docker rm -f "$container" > /dev/null; }
trap cleanup EXIT
echo 'Starting isolated PostgreSQL (no published ports or external network)...'
docker run -d --name "$container" --network none \
  --tmpfs /var/lib/postgresql \
  -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB=signaldesk_restore \
  postgres:18-alpine > /dev/null
ready=false
for attempt in {1..60}; do
  # TCP excludes the entrypoint's temporary Unix-socket-only init server.
  if docker exec "$container" pg_isready -h 127.0.0.1 -U postgres -d signaldesk_restore > /dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 1
done
if [[ "$ready" != true ]]; then
  echo 'PostgreSQL readiness timed out.' >&2
  exit 1
fi
echo 'Restoring archive into the temporary database...'
docker exec -i "$container" pg_restore -h 127.0.0.1 --exit-on-error \
  --no-owner --no-privileges -U postgres -d signaldesk_restore < "$backup_file"
docker exec "$container" psql -h 127.0.0.1 -U postgres \
  -d signaldesk_restore -v ON_ERROR_STOP=1 \
  -c 'SELECT count(*) AS feedback_count FROM feedback;' \
  -c 'SELECT count(*) AS migration_count FROM migrations;'
echo 'Isolated database restore passed. Counts are evidence for review; this does not verify application sign-in.'
