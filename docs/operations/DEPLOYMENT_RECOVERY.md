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

Results from the saved October 13, 2026 evidence:

- Baseline API healthy: not independently captured before failure.
- Failure API unhealthy: verified in [outage status](evidence/week6/outage-status.txt).
- Web authentication proxy returned 502: verified in [outage web log](evidence/week6/outage-web.txt).
- Recovery API healthy using `signaldesk-api:ops-known-good`: verified in
  [recovery status](evidence/week6/recovery-status.txt).
- Synthetic invalid sign-in returned 401 after recovery: verified in
  [web recovery log](evidence/week6/recovery-web.txt) and the
  [matching API log](evidence/week6/recovery-api.txt).
- Rehearsal date: October 13, 2026.
- Recovery elapsed time: not measured. The failed and recovered requests are
  approximately 46 seconds apart; that interval is not recovery duration.

See the [incident walkthrough](INCIDENT_WALKTHROUGH.md) for request references
and the remaining browser-capture limitation.

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

## Migration recovery policy

Before deployment, retain the working images and a verified database backup.
Review whether each migration remains compatible with the previous application.

If the schema is compatible, restore the retained application image.
Otherwise, prefer a reviewed forward fix. Restoring a pre-migration backup
requires stopping writes and explicitly accounting for writes made since
that backup.

Migration reversals are not run automatically. The current rehearsal covers
configuration recovery without schema changes; cross-version migration
recovery remains unverified.

## Migration recovery policy

Before deployment, retain the working images and a verified database backup.
Review whether each migration remains compatible with the previous application.

If the schema is compatible, restore the retained application image.
Otherwise, prefer a reviewed forward fix. Restoring a pre-migration backup
requires stopping writes and explicitly accounting for writes made since
that backup.

Migration reversals are not run automatically. The current rehearsal covers
configuration recovery without schema changes; cross-version migration
recovery remains unverified.
