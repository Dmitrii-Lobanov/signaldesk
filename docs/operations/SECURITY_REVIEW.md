# Week 6 secrets and deployment settings review

## Scope and evidence

This review covers current tracked configuration and verification of the
protected development deployment.

Local source inspection does not establish that the VM is running the same
configuration. Database tests and rehearsals use only `signaldesk_test`.

Each deployment check below remains unverified until its observed result is
recorded. Do not include secret values in this document.

## Findings from tracked configuration

- Only `.env.example` is tracked among root environment files.
- `.env` and `.env.*` are ignored by Git, except `.env.example`.
- Environment files are excluded from Docker build context.
- API startup rejects missing authentication settings, secrets shorter than
  32 characters, and the environment-template secret placeholder.
- Both application images run as the non-root `node` user.
- Deployment publishes web port 3000 only on host loopback.
- API and PostgreSQL have no configured host port mappings.
- Deployment explicitly disables AI suggestions in API and web services.
- Public account sign-up is disabled.
- Application JSON parsing is bounded to 32 KiB.
- Feedback endpoints have per-user request and write limits.
- Production sign-in uses a shared five-attempts-per-minute budget.
- Container log rotation is configured.

These findings do not establish that secrets were never committed historically,
that secrets have sufficient randomness, or that deployed images are current.

## Authentication and proxy policy

Production authentication limits use in-memory storage. The sign-in budget
is shared because client IP headers are not used for tracking.

The web authentication proxy forwards selected authentication headers and
does not forward caller-supplied client IP headers.

Limits reset on API restart and are not shared across multiple API instances.
The shared budget is appropriate only for the current small protected demo
and must be reviewed before public or multi-instance deployment.

Explicitly disabled sign-up remains independent of rate limiting.

## Protected VM checks

Run from the deployment checkout:

```sh
stat -c '%a %U %n' .env.deploy

sudo docker compose -p signaldesk-deploy \
--env-file .env.deploy -f compose.deploy.yaml config -q

sudo docker compose -p signaldesk-deploy \
--env-file .env.deploy -f compose.deploy.yaml ps

sudo ss -ltnp
```

Expected:

- `.env.deploy` has mode 600 and belongs to the deployment operator.
- Compose configuration validates without printing interpolated secrets.
- Web binds to loopback.
- API and PostgreSQL ports are not publicly published.

Inspect AWS security-group rules separately. Confirm the restrictions described
in `docs/DEPLOYMENT.md`; do not infer them from local Compose configuration.

Do not print environment files, unrestricted Compose configuration, or full
container inspection output into shared evidence.

## Verification record

Fill each entry with the observed result, date, and safe evidence reference.
Use “unverified” when a check was unavailable.

| Check                                                  | Result     | Evidence |
| ------------------------------------------------------ | ---------- | -------- |
| VM environment-file permissions and ownership          | Unverified | —        |
| Deployment configuration validates                     | Unverified | —        |
| Web binds only to loopback                             | Unverified | —        |
| API/database have no public host mappings              | Unverified | —        |
| AWS security-group restrictions match the runbook      | Unverified | —        |
| VM images contain the reviewed Week 6 changes          | Unverified | —        |
| Deployed AI suggestions remain disabled                | Unverified | —        |
| Isolated sign-in limit returns 429 after five attempts | Unverified | —        |
| Sign-in budget permits attempts again after one minute | Unverified | —        |
| Log rotation is applied to deployed containers         | Unverified | —        |

The isolated sign-in check must use the synthetic container deployment,
not development accounts or the development database.

## Secret handling

Generate deployment secrets using the deployment runbook. Do not reuse local
credentials or replace existing secrets during routine verification.

Secret length validation does not establish randomness. Secrets remain private
and must not appear in screenshots, logs, Git, or incident documents.

A database dump does not back up deployment secrets or PostgreSQL roles.
Their recovery requires a separate protected process.

Historical secret exposure and a full credential-rotation rehearsal have not
been verified by this review.

## Remaining limitations

This document is a focused operational review, not a comprehensive security
audit. Public deployment, trusted-proxy changes, multiple instances, and
stronger monitoring require a new review of these assumptions.
