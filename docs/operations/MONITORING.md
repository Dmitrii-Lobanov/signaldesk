# Operational monitoring

## Current coverage

- API request logs record generated request IDs, route templates, status,
  duration, and completion or disconnect.
- Unexpected API errors produce sanitized `api_error` events.
- Feedback edit failures display API request references.
- Authentication proxy failures display web references and log the matching
  API request ID when an API response exists.
- Page-render error boundaries report fixed `frontend_render_failed` events
  and display the reporting reference.
- Docker checks API readiness, including PostgreSQL connectivity.

Application monitoring events exclude feedback content, credentials, cookies,
query strings, raw exception messages, and stacks.

Frontend reports are untrusted signals. Their endpoint accepts no diagnostic
payload and permits at most 30 reports per minute per web process.

## Operating model

Monitoring is operator-reviewed during deployment and recovery rehearsal.
There are no automatic external alerts or unattended notifications.

During those sessions, the deployment operator checks container health and
reviews recent structured error events. Outside those sessions, failures may
remain unnoticed until a user reports them.

This is the current protected-demo operating model. Continuous availability
monitoring and alert delivery remain deferred.

## Review on the protected VM

From the deployment checkout:

```sh
sudo docker compose -p signaldesk-deploy \
--env-file .env.deploy -f compose.deploy.yaml ps
```

Inspect structured application events:

```sh
sudo docker compose -p signaldesk-deploy \
--env-file .env.deploy -f compose.deploy.yaml \
logs --since 15m --no-color api web |
grep -E '"event":"(api_error|api_request_failed|auth_proxy_failed|frontend_render_failed)"'
```

Investigate repeated 5xx responses, transport failures, unhealthy containers,
and frontend rendering reports.

A 401 indicates credential rejection, 409 indicates a conflict, and 429
indicates a request limit. These statuses alone do not establish an
infrastructure outage.

## Correlating evidence

For a feedback edit failure, match the displayed reference directly to the
API request and error logs.

For a sign-in failure, match the browser reference to the web event's
`requestId`. Follow its `apiRequestId` to the API log when present.

A transport failure may have no API request ID because the connection never
reached the API.

For a page-render failure, match the displayed reference to the web server's
`frontend_render_failed` event. That event does not establish a backend cause.

Preserve sanitized evidence before recreating containers. Inspect evidence
before sharing it; exclude request headers, cookies, credentials, feedback
content, and unrelated raw logs.

## Health semantics

Liveness indicates that the API can respond.

Readiness checks PostgreSQL connectivity with a bounded probe. It does not
prove that every migration is applied or that the authenticated workflow
works.

AI providers are optional and do not determine readiness.

Compose waits for API readiness before starting the web container.
An unhealthy healthcheck does not automatically restart a container or stop
an already-running dependent service.

## Retention

The deployment configuration uses Docker's `json-file` driver with a 10 MB
rotation threshold and three retained files per container.

These settings apply when containers are recreated. Configuration validation
does not apply them to existing containers.

Container recreation can remove access to earlier logs. Rotated container
logs are not durable incident storage.

## Verification status

Frontend reporting has automated tests for safe event content, generated
references, origin checks, rate limiting, and reset behavior.

Record test execution results in the Week 6 verification record. The presence
of tests does not establish that they passed.

Protected-VM deployment of the current monitoring configuration must be
verified separately from local rehearsals.

## Known limitations

- Root-layout failures are outside the page error boundary.
- Event-handler exceptions and arbitrary asynchronous client failures are
  not centrally captured.
- Rendering reports omit diagnostic details to minimize sensitive content.
- Error reporting can fail when the web server is unavailable.
- Reporting limits are shared per process and reset on restart.
- Automatic external alerts and durable log collection are not implemented.
