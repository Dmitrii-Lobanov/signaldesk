# Delivery backlog

[ROADMAP.md](ROADMAP.md) controls the eight-week portfolio slice. The complete product remains broader; unchecked plans are not shipped features.

## Required: foundation and access — Weeks 1–2

- Deployed Next.js/NestJS/PostgreSQL capture-and-list path with CI.
- Protected development deployment until authentication and authorization pass.
- Seeded workspaces and editor/viewer membership; server-enforced permissions.
- Negative tests for direct API access, viewer mutations and cross-workspace reads/writes/relationships.

## Required: feedback inbox — Week 3

- Capture, inspect, find and manually classify feedback.
- Essential filters, deterministic pagination and URL state.
- Keyboard operation and complete validation/loading/empty/error/permission states.

## Required: reliable changes — Week 4

- Editing with atomic audit events.
- Safe duplicate submission and explicit stale-edit handling.
- Failure/rollback integration tests and a critical E2E journey.

## Conditional: AI classification — Week 5

Start only after core gates pass; otherwise finish core work.

- Server-side suggestions of product area/tags using authorized context.
- Human accept/edit/reject; normal authorized and audited mutation path.
- Structured-output validation, timeouts, limits and manual fallback.
- Held-out synthetic evaluation with quality, latency and cost results.
- Explicit ship/defer decision based on evidence.

## Required: operations and evidence — Weeks 6–8

- Correlated logs, error monitoring, readiness and recovery instructions.
- Incident drill, accessibility review, usability feedback and one performance investigation.
- Safe public demo, walkthrough, case study and two AI-assisted development examples.
- Documentation that distinguishes shipped scope from plans.

## Deferred: full MVP and depth

- Membership invitations and elaborate administration.
- CSV import preview, validation, stable row identity, partial rejection and safe retries.
- Saved views, advanced bulk workflows and analytics.
- Evidence grouping with source context and tenant-safe links.
- Opportunities, transparent scoring and decisions with evidence and rationale.
- Background workers, Redis/BullMQ and live progress only when measured requirements justify them.
- Vector search, clustering and additional integrations only after core user needs are validated.
