# Incident walkthrough: sign-in dependency failure

## Scope

Intentional local failure in Compose project `signaldesk-ops-deploy` using
only `signaldesk_test` and synthetic credentials. The protected deployment
was not involved. Evidence was captured on October 13, 2026.

## Symptom and cause

`compose.ops-failure.yaml` changes the API listening port to 3999 while the
web proxy and readiness probe still target port 3001. This intentionally
breaks web-to-API connectivity.

The [outage status](evidence/week6/outage-status.txt) shows the API unhealthy
while PostgreSQL remains healthy and the web container remains running.
The [web outage event](evidence/week6/outage-web.txt) records:

- Time: 19:58:02 UTC (14:58:02 America/Guayaquil).
- Browser-facing reference: `0fbf748b-7883-4ec6-83c4-0e1bedec7970`.
- HTTP status: 502.
- Failure kind: `transport`.
- API request ID: null; the connection did not reach the API.

The sign-in UI is designed to show “Sign-in is unavailable” and the
browser-facing reference for this response. A screenshot of this particular
outage alert is not included in the saved evidence; the reference above is
verified from the proxy log, not independently from a browser capture.

## Recovery

Apply `compose.ops-recovery.yaml` over `compose.ops-deploy.yaml`, excluding
the failure override. This restores API port 3001 and uses the retained
`signaldesk-api:ops-known-good` image without rebuilding.

The [recovery status](evidence/week6/recovery-status.txt) shows the API healthy
and running the retained image. PostgreSQL and web remain running; their
reported container ages support that they were not recreated during recovery.
No schema change was part of this rehearsal.

## Correlated post-recovery evidence

The [web recovery log](evidence/week6/recovery-web.txt) records a new response
at 19:58:48 UTC (14:58:48 America/Guayaquil):

- Browser-facing reference: `f91c65a5-1f2f-452e-bfb2-f5602a11793b`.
- HTTP status: 401.
- Failure kind: `http`.
- API request ID: `0ec0216a-7df4-4fa7-b5b4-990e6e24cc16`.

The [matching API event](evidence/week6/recovery-api.txt) contains that same
API request ID, method POST, status 401, duration 90 ms, and outcome completed.
The authentication handler appears as route `unmatched` in the API request log.

This links the web response to its API request and establishes restored
reachability and credential rejection. The new browser-facing reference is
verified from the proxy log; a screenshot matching this particular reference
is not included.

## Earlier browser verification

An earlier browser screenshot showed a 401 alert and response header with
reference `a90d779c-32d3-4910-9841-d560f095c986`. Its web event mapped to API
ID `608b8330-4696-4a7e-977b-0e7e1f21c490`. That earlier screenshot verified
browser-to-web correlation but did not establish post-outage recovery.

## Result and limits

Saved evidence verifies an unhealthy API and web transport failure, followed
by a healthy retained API image and a correlated web/API 401 response.
A 401 establishes reachability, not successful authenticated use.

The two recorded requests are approximately 46 seconds apart. This is not a
measured recovery duration: failure onset and recovery-command timings were
not captured. Configuration recovery does not verify rollback across schema
changes or protected-deployment recovery.

To complete browser evidence for this exact rehearsal, attach sanitized outage
and post-recovery alert captures matching the two new references. Exclude
cookies, credentials, and request payloads.
