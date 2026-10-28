#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

export DATABASE_URL='postgresql://signaldesk:ops-test-only-password@localhost:5546/signaldesk_test'
export BETTER_AUTH_SECRET='final-local-test-secret-at-least-32-characters'
export BETTER_AUTH_URL='http://localhost:3100'
export AI_SUGGESTIONS_ENABLED=true

echo "Verifying commit:"
git rev-parse HEAD
echo "Working-tree changes:"
git status --short

docker compose -p signaldesk-ops-test \
  -f compose.ops-test.yaml up -d --wait

./node_modules/.bin/tsc --noEmit -p apps/api/tsconfig.json
npm exec --workspace=apps/web -- next typegen
./node_modules/.bin/tsc --noEmit -p apps/web/tsconfig.json

npm run lint --workspace=apps/api
npm run lint --workspace=apps/web
npm run format:check
./node_modules/.bin/prettier --check apps/web/e2e/reliable-feedback.spec.mjs

node --check apps/api/scripts/seed-dev-accounts.mjs
bash -n scripts/reset-local-demo.sh
bash -n scripts/verify-project.sh

npm run test --workspace=apps/api
npm run test:unit --workspace=apps/web
node --test apps/web/test/auth-proxy.test.mjs

npm run build --workspace=apps/api
node node_modules/typeorm/cli.js migration:run \
  -d apps/api/dist/data-source.js

npm run test:e2e --workspace=apps/api
npm run build --workspace=apps/web
npm run test:e2e --workspace=apps/web

git diff --check
echo "PASS: all project verification steps completed."