# Operational monitoring

## Current coverage

- Docker checks API readiness, including PostgreSQL connectivity.
- API request logs contain request IDs, status, duration, and outcome.
- Unexpected API errors produce sanitized `api_error` events.
- Feedback edit failures link frontend references to API request IDs.
- Authentication proxy failures link browser references to web logs and,
  when an API response exists, API request IDs.

Frontend JavaScript failures outside these paths are not centrally captured.
There are no automatic external alerts. Monitoring currently requires an
operator to review health and logs during deployment and rehearsal.

## Review on the protected VM

From the deployment checkout:

```sh
sudo docker compose -p signaldesk-deploy \
--env-file .env.deploy -f compose.deploy.yaml ps
```

Inspect structured application error events:

```sh
sudo docker compose -p signaldesk-deploy \
--env-file .env.deploy -f compose.deploy.yaml \
logs --since 15m --no-color api web |
grep -E '"event":"(api_error|api_request_failed|auth_proxy_failed)"'
```

Investigate repeated 5xx responses and transport failures.
A 401 indicates credential rejection; 409 indicates a conflict; 429 indicates
a request limit. These statuses alone do not establish an infrastructure outage.

Match a browser reference to its web event, then follow `apiRequestId` when
present. A transport failure may have no API request because the connection
never reached the API.

Before sharing evidence, inspect it and exclude cookies, credentials,
feedback content, and raw exception details.

## Retention and limits

Docker logs rotate at approximately 10 MB per file, retaining three files
per container. Container recreation can remove access to earlier logs.
Preserve sanitized incident evidence separately before recreating services.

Logging settings apply when containers are recreated. Configuration validation
alone does not apply them to running containers.

Automatic alerts, durable log collection, and broader frontend error capture
remain outstanding.
