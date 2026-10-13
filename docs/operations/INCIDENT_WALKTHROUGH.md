# Incident walkthrough: sign-in dependency failure

## Scope

Intentional local failure in Compose project `signaldesk-ops-deploy`.
The database is `signaldesk_test`; credentials and feedback are synthetic.
The protected deployment was not involved.

## Failure and expected symptom

`compose.ops-failure.yaml` changes the API listening port to 3999.
The web proxy and API readiness probe still target port 3001.

Expected browser behavior:

- Sign-in returns HTTP 502.
- The alert says sign-in is unavailable and displays a reference.
- The matching web event has `failureKind: transport`.
- `apiRequestId` is null because the connection does not reach the API.
- The API container becomes unhealthy.

Observed outage evidence: not yet attached to this record.

## Recovery

Apply `compose.ops-recovery.yaml` over `compose.ops-deploy.yaml`,
using the retained `signaldesk-api:ops-known-good` image without rebuilding.

The recovery configuration restores API port 3001.
No database migration or volume recreation is required for this failure.

## Observed reachable-service evidence

A browser screenshot showed HTTP 401 for deliberately invalid credentials.
The alert reference matched the web response header:

`a90d779c-32d3-4910-9841-d560f095c986`

The corresponding web log contained:

- Event: `auth_proxy_failed`
- Request ID: `a90d779c-32d3-4910-9841-d560f095c986`
- API request ID: `608b8330-4696-4a7e-977b-0e7e1f21c490`
- Status: 401
- Failure kind: `http`

This confirms browser-to-web correlation and an API HTTP response.
It does not establish that this request followed the injected outage.
The matching API log entry has not yet been attached.

## Evidence needed to close the walkthrough

- Browser 502 symptom and its reference.
- Matching web transport-failure event.
- Unhealthy API status during the injected failure.
- Healthy API status after recovery.
- A post-recovery browser reference and matching web/API log entries.

## Limits

A 401 response establishes service reachability and credential rejection,
not successful authenticated use.

Recovery duration was not recorded.
This configuration recovery does not verify rollback across schema changes.
Screenshots must exclude cookies, passwords, and request payloads.
