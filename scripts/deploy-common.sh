#!/usr/bin/env bash
# Shared by deployment tools. Never source the secrets file as shell code.
cd "$(dirname "${BASH_SOURCE[0]}")/.."
DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-.env.deploy}"
read_image() {
  local key="$1" value
  value="$(sed -n "s/^${key}=//p" "$DEPLOY_ENV_FILE")"
  if [[ -z "$value" || "$value" == *$'\n'* ]]; then
    echo "Set exactly one $key in $DEPLOY_ENV_FILE or export it." >&2
    return 1
  fi
  printf '%s' "$value"
}
load_images() {
  API_IMAGE="${API_IMAGE:-$(read_image API_IMAGE)}"
  WEB_IMAGE="${WEB_IMAGE:-$(read_image WEB_IMAGE)}"
  : "${API_IMAGE:?Missing API_IMAGE}" "${WEB_IMAGE:?Missing WEB_IMAGE}"
  export API_IMAGE WEB_IMAGE
}
compose() {
  sudo env API_IMAGE="${API_IMAGE:-}" WEB_IMAGE="${WEB_IMAGE:-}" \
    docker compose -p signaldesk-deploy \
    --env-file "$DEPLOY_ENV_FILE" -f compose.deploy.yaml "$@"
}
check_web() {
  curl --fail --silent --show-error --connect-timeout 5 --max-time 10 \
    --retry 10 --retry-delay 2 --retry-max-time 60 \
    --retry-all-errors --output /dev/null http://127.0.0.1:3000/sign-in
}
