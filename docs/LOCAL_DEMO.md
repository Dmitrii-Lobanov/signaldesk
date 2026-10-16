# Local portfolio demo

## Scope

This is a local, synthetic-data demonstration. Public hosting is deferred.
Do not expose this configuration publicly: its credentials are disposable,
its sign-in limit is shared, and it has no public HTTPS setup.

Requirements: Docker with Compose, Git, and an available localhost port 3300.
Docker builds install the Node dependencies.

## First setup

Run from the repository root. Stop if any command fails.

Check whether port 3300 is already occupied:

```sh
docker ps --filter publish=3300 --format '{{.Names}} {{.Ports}}'
lsof -nP -iTCP:3300 -sTCP:LISTEN
```

No listener is expected for a first setup. If an existing service owns the
port, identify it before continuing. A previous operations-rehearsal web
container can serve a different database at the same address.

Define the demo command in the current terminal:

```sh
sd_demo() {
  docker compose -p signaldesk-demo \
    -f compose.ops-deploy.yaml -f compose.demo.yaml "$@"
}
```

Build and initialize:

```sh
sd_demo config -q
sd_demo up -d --wait postgres
sd_demo build api web

sd_demo run --rm --no-deps api \
  node node_modules/typeorm/cli.js migration:run \
  -d apps/api/dist/data-source.js

sd_demo exec -T postgres \
  psql -U signaldesk -d signaldesk_test -v ON_ERROR_STOP=1 \
  < apps/api/db/seed.sql

sd_demo run --rm --no-deps \
  -e DEV_EDITOR_EMAIL=demo-editor@example.invalid \
  -e DEV_EDITOR_PASSWORD='Local-demo-editor-only-123!' \
  -e DEV_VIEWER_EMAIL=demo-viewer@example.invalid \
  -e DEV_VIEWER_PASSWORD='Local-demo-viewer-only-123!' \
  api node apps/api/scripts/seed-dev-accounts.mjs --demo-test

sd_demo up -d --wait api web
sd_demo ps
curl -I http://localhost:3300/sign-in
```

Expect healthy API/PostgreSQL containers, web port
`127.0.0.1:3300->3000/tcp`, and HTTP 200 from sign-in.

## Accounts

Open http://localhost:3300/sign-in.

| Role | Email | Disposable local password |
| --- | --- | --- |
| Editor | demo-editor@example.invalid | Local-demo-editor-only-123! |
| Viewer | demo-viewer@example.invalid | Local-demo-viewer-only-123! |

Use synthetic feedback only. These are not protected-deployment credentials.

The production-mode sign-in budget is five attempts per minute shared across
users. After a 429 response, wait a full minute without retrying.

## Later starts and stops

From the repository root:

```sh
docker compose -p signaldesk-demo \
  -f compose.ops-deploy.yaml -f compose.demo.yaml up -d --wait
```

Stop without deleting data:

```sh
docker compose -p signaldesk-demo \
  -f compose.ops-deploy.yaml -f compose.demo.yaml stop
```

Rebuild images after source changes. Do not rerun account setup to change
passwords or remove database volumes during routine startup.

## Reset

This explicitly discards the seeded workspace's feedback and audit history.
It restores one feedback record while preserving accounts, classification
options, migrations, and other databases.

```sh
bash scripts/reset-local-demo.sh --confirm-local-demo-reset
```

If reset fails, application services may remain stopped for inspection.
The reset is manual; there is no scheduled reset.

## Troubleshooting

- 401: confirm account and password, then confirm the listener belongs to
  `signaldesk-demo-web-1`.
- 429: wait for the shared sign-in window to expire.
- Connection refused: inspect `sd_demo ps -a` and `sd_demo logs --tail 40 web`.
- Running web container without the expected published port: recreate only
  that container after confirming port 3300 is free:

```sh
sd_demo up -d --no-deps --force-recreate web
sd_demo ps
```

Keep the browser origin at http://localhost:3300; the API's authentication
configuration expects that exact origin.

## Evidence

See the [case study](CASE_STUDY.md),
[AI-assisted examples](AI_ASSISTED_EXAMPLES.md), and
[Week 7 findings](operations/WEEK7_HARDENING.md).