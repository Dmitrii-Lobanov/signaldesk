# Deployment recovery rehearsal

## Scope

This rehearsal uses Compose project `signaldesk-ops-deploy` and only
`signaldesk_test`. It does not modify the protected deployment.

It tests recovery from an incorrect API port configuration without changing
the database schema.

## Procedure

1. Confirm the baseline API is healthy.
2. Tag its running image as `signaldesk-api:ops-known-good`.
3. Apply `compose.ops-failure.yaml` over `compose.ops-deploy.yaml`.
4. Confirm readiness fails because the API listens on port 3999 while
   the healthcheck and web service expect port 3001.
5. Check a synthetic sign-in request through the web proxy.
6. Apply `compose.ops-recovery.yaml`, restoring the retained image and port 3001.
7. Confirm readiness and web-to-API reachability recover.

Use `--no-build` during recovery so the retained image is reused.
The failure override must not be included in the recovery command.

## Verification results

Record actual results before marking this rehearsal complete:

- Baseline API healthy:
- Failure deployment reported unhealthy:
- Web authentication proxy returned 502:
- Recovery API healthy:
- Synthetic invalid sign-in returned 401 after recovery:
- Rehearsal date:
- Recovery elapsed time, if measured:

## Cause and recovery

The failure was caused by inconsistent port configuration.
Recovery restored the known working API image and its expected port.

The PostgreSQL container and data volume were not recreated.

## Limits

The local known-good image tag must remain available and must not be overwritten.
This does not verify recovery on the protected deployment.

No schema changes were made. Rolling back an application after a migration
requires checking schema compatibility. Do not run migration reversals
automatically; choose a reviewed compatible rollback, forward fix, or
backup restoration according to the specific change.
