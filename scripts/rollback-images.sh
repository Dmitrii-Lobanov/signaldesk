#!/usr/bin/env bash
set -euo pipefail
if [[ "${1:-}" != --schema-compatible || $# != 3 ]]; then
  echo 'Usage: bash scripts/rollback-images.sh --schema-compatible API_IMAGE WEB_IMAGE' >&2
  echo 'Review migration compatibility first. This command does not reverse migrations or restore data.' >&2
  exit 2
fi
API_IMAGE="$2"
WEB_IMAGE="$3"
export API_IMAGE WEB_IMAGE
source "$(dirname "$0")/deploy-common.sh"
echo 'Pulling explicitly reviewed rollback images...'
compose config -q
compose pull api web
compose up -d --no-build --no-deps --wait --wait-timeout 120 api web
check_web
compose ps
echo 'Rollback HTTP check passed. Verify sign-in and feedback before persisting these image selections in .env.deploy.'
