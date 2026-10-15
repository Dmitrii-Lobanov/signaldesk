#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ "${1:-}" != "--confirm-local-demo-reset" ]]; then
  echo "Usage: bash scripts/reset-local-demo.sh --confirm-local-demo-reset"
  exit 1
fi

demo() {
  docker compose -p signaldesk-demo \
    -f compose.ops-deploy.yaml -f compose.demo.yaml "$@"
}

container_id="$(demo ps -q postgres)"
[[ -n "$container_id" ]] || {
  echo "Demo PostgreSQL is not running."
  exit 1
}

project="$(docker inspect --format \
  '{{index .Config.Labels "com.docker.compose.project"}}' "$container_id")"
service="$(docker inspect --format \
  '{{index .Config.Labels "com.docker.compose.service"}}' "$container_id")"

[[ "$project" == "signaldesk-demo" && "$service" == "postgres" ]] || {
  echo "Refusing reset: unexpected container."
  exit 1
}

database="$(demo exec -T postgres \
  psql -U signaldesk -d signaldesk_test -Atc 'SELECT current_database()')"

[[ "$database" == "signaldesk_test" ]] || {
  echo "Refusing reset: unexpected database."
  exit 1
}

demo stop web api

# On failure, leave application services stopped for inspection.
demo exec -T postgres \
  psql -U signaldesk -d signaldesk_test -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $$
BEGIN
  IF current_database() <> 'signaldesk_test' THEN
    RAISE EXCEPTION 'Reset requires signaldesk_test';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM workspaces
    WHERE id = '11111111-1111-4111-8111-111111111111'
  ) THEN
    RAISE EXCEPTION 'Demo workspace is missing';
  END IF;
END
$$;

DELETE FROM audit_events
WHERE workspace_id = '11111111-1111-4111-8111-111111111111';

DELETE FROM feedback
WHERE workspace_id = '11111111-1111-4111-8111-111111111111';

INSERT INTO feedback
  (id, workspace_id, source, content, occurred_at, created_at)
VALUES (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'manual',
  'The export button is difficult to find.',
  '2026-09-01T12:00:00Z',
  '2026-09-01T12:00:00Z'
);

COMMIT;
SQL

demo up -d --wait api web
demo ps
echo "Reset complete: http://localhost:3300/sign-in"