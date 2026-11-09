#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

: "${API_IMAGE:?Set API_IMAGE to the reviewed ECR image}"
: "${WEB_IMAGE:?Set WEB_IMAGE to the reviewed ECR image}"
export API_IMAGE WEB_IMAGE

compose() {
  sudo env API_IMAGE="$API_IMAGE" WEB_IMAGE="$WEB_IMAGE" \
    docker compose -p signaldesk-deploy \
    --env-file .env.deploy -f compose.deploy.yaml "$@"
}

compose config -q
compose pull api web
compose up -d --wait postgres
compose run --rm --no-deps -T api \
  node node_modules/typeorm/cli.js migration:run \
  -d apps/api/dist/data-source.js
compose up -d --no-build --wait --wait-timeout 120 api web
curl --fail --silent --show-error \
  --connect-timeout 5 --max-time 10 \
  --retry 10 --retry-delay 2 --retry-max-time 60 \
  --retry-all-errors --output /dev/null \
  http://127.0.0.1:3000/sign-in
compose ps