#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/deploy-common.sh"
load_images
trap 'echo "Deployment failed. Inspect Compose status/logs; no automatic rollback was attempted." >&2' ERR
echo 'Validating deployment and pulling selected images...'
compose config -q
compose pull api web
compose up -d --wait --wait-timeout 120 postgres
bash scripts/backup-deploy.sh < /dev/null
echo 'Running reviewed migrations...'
compose run --rm --no-deps -T api \
  node node_modules/typeorm/cli.js migration:run \
  -d apps/api/dist/data-source.js < /dev/null
echo 'Starting application and checking HTTP readiness...'
compose up -d --no-build --wait --wait-timeout 120 api web
check_web
compose ps
echo 'Deployment passed.'
