# Database backup and restore rehearsal

## Scope

This procedure uses only synthetic data in `signaldesk_test`.
It does not modify the development database or the protected deployment.

The source database runs in Compose project `signaldesk-ops-test`.
Restoration uses a separate PostgreSQL container with no published ports.

Stop the test API and other test processes before taking the backup.
Run the commands below in one terminal. Stop if any command fails.

## Recorded result

On October 13, 2026, the developer reported completing the rehearsal:

- A custom-format PostgreSQL backup was created.
- The backup restored into a fresh PostgreSQL 18 container.
- The synthetic feedback marker was present with version 1.
- Source and restored migration histories matched.

Command outputs and elapsed recovery time were not recorded in this document.
This is a developer-reported result, not independent verification.

The [application verification](#application-verification) below records passing
API integration tests, the restored synthetic marker, separate API startup,
HTTP 200 liveness/readiness checks, and matching response request IDs in logs.
These are developer-recorded results. Browser use against the restored database,
protected deployment recovery, and automated backup scheduling remain unverified.

## Prepare the source

From the repository root:

```sh
docker compose -p signaldesk-ops-test -f compose.ops-test.yaml up -d --wait
npm run build --workspace=apps/api

DATABASE_URL=postgresql://signaldesk:ops-test-only-password@localhost:5546/signaldesk_test \
node node_modules/typeorm/cli.js migration:run -d apps/api/dist/data-source.js
```

Add the synthetic marker:

```sh
docker compose -p signaldesk-ops-test -f compose.ops-test.yaml \
exec -T postgres psql -U signaldesk -d signaldesk_test \
-v ON_ERROR_STOP=1 <<'SQL'
BEGIN;

INSERT INTO workspaces (id, name)
VALUES ('66666666-6666-4666-8666-666666666666', 'Recovery rehearsal')
ON CONFLICT (id) DO NOTHING;

INSERT INTO feedback (id, workspace_id, content)
VALUES (
  '77777777-7777-4777-8777-777777777777',
  '66666666-6666-4666-8666-666666666666',
  'Synthetic backup recovery marker'
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
SQL
```

## Back up

```sh
umask 077
recovery_dir=$(mktemp -d /private/tmp/signaldesk-recovery.XXXXXX)

docker compose -p signaldesk-ops-test -f compose.ops-test.yaml \
exec -T postgres pg_dump \
-U signaldesk -d signaldesk_test \
--format=custom --no-owner --no-acl \
> "$recovery_dir/signaldesk_test.dump"

test -s "$recovery_dir/signaldesk_test.dump"
shasum -a 256 "$recovery_dir/signaldesk_test.dump"
```

The dump includes schema, data, and migration history. It excludes PostgreSQL
roles and deployment secrets. The checksum identifies the backup; it does
not establish that restoration succeeds.

The temporary directory is a rehearsal artifact, not durable backup storage.
Keep dumps out of Git. Deployed backups still need a protected storage
location, retention policy, and scheduled restore checks.

## Restore into a fresh container

```sh
docker run -d \
--name signaldesk-restore-check \
-e POSTGRES_DB=signaldesk_test \
-e POSTGRES_USER=signaldesk \
-e POSTGRES_PASSWORD=restore-test-only-password \
postgres:18-alpine
```

These are local test credentials only. If the container name already exists,
inspect it before proceeding; do not overwrite an unknown container.

Repeat this check until it reports accepting connections:

```sh
docker exec signaldesk-restore-check \
pg_isready -U signaldesk -d signaldesk_test
```

Restore:

```sh
docker exec -i signaldesk-restore-check \
pg_restore \
-U signaldesk -d signaldesk_test \
--exit-on-error --single-transaction --no-owner --no-acl \
< "$recovery_dir/signaldesk_test.dump"
```

## Verify

```sh
docker exec signaldesk-restore-check \
psql -U signaldesk -d signaldesk_test -v ON_ERROR_STOP=1 \
-c "SELECT content, version FROM feedback WHERE id = '77777777-7777-4777-8777-777777777777';"
```

Expected: `Synthetic backup recovery marker`, version `1`.

Compare migration history:

```sh
docker compose -p signaldesk-ops-test -f compose.ops-test.yaml \
exec -T postgres psql -U signaldesk -d signaldesk_test \
-Atc 'SELECT name FROM migrations ORDER BY id' \
> "$recovery_dir/source-migrations.txt"

docker exec signaldesk-restore-check \
psql -U signaldesk -d signaldesk_test \
-Atc 'SELECT name FROM migrations ORDER BY id' \
> "$recovery_dir/restored-migrations.txt"

diff -u "$recovery_dir/source-migrations.txt" \
"$recovery_dir/restored-migrations.txt"
```

Expected: no differences.

The API integration and readiness checks against restored data are recorded
under [application verification](#application-verification). An authenticated
browser workflow against restored data remains unverified.

## Cleanup

After verification, remove only the restore container and its anonymous volume:

```sh
docker stop signaldesk-restore-check
docker rm -v signaldesk-restore-check
```

Keep the source test container and backup until any remaining checks finish.
No development container or volume is removed by this procedure.

## Application verification

The restored database was exposed only on loopback port 5547 using
`compose.ops-restore.yaml` and Compose project `signaldesk-ops-restore`.

Verification uses the restored `signaldesk_test` database:

- API integration suite: pass.
- Synthetic recovery marker, version 1: pass.
- Separate API startup on port 3202: pass.
- `/health/live` and `/health/ready`: 200.
- Response request IDs matched API logs: pass.

Browser recovery and protected deployment recovery remain unverified.
