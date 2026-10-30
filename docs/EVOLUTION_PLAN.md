# SignalDesk evolution plan

Status: planned; implementation has not been verified.
Created: 2026-10-28.

## Goal

Evolve SignalDesk from a manual feedback inbox into a deployed feedback
platform that receives external events, processes them asynchronously,
and recovers from supported dependency failures.

Deliver the infrastructure and reliable event-processing workflow first.
Add AI enrichment and scheduled insights after that workflow is verified.

This document controls the next phase of delivery. The original
[roadmap](ROADMAP.md) and [backlog](BACKLOG.md) describe the earlier
portfolio slice.

## Current baseline

The repository implements:

- Next.js web application and NestJS API.
- PostgreSQL persistence with TypeORM migrations.
- Authentication, workspace isolation, and editor/viewer permissions.
- Manual feedback capture, search, filtering, and pagination.
- Manual classification, editing, and transactional audit history.
- Idempotent capture and stale-write protection.
- Automated checks and documented operational rehearsals.

The repository documents a protected EC2 deployment using Docker Compose.
Its current AWS state must be inspected before infrastructure changes.

RabbitMQ, background workers, webhook ingestion, Terraform management,
and scheduled insights are planned features. AI suggestions remain disabled.

## Delivery rules

- Preserve the existing manual feedback workflow.
- Keep implemented behavior separate from planned behavior.
- Verify each epic's completion criteria before marking it complete.
- Include authorization, accessibility, and failure states in each feature.
- Record architecture decisions and material limitations.
- Use synthetic data for development, demonstrations, and evaluations.
- Do not assign delivery dates until the baseline review is complete.

## Epic 1 — Verify the baseline and architecture

- [x] Run the application and existing applicable checks.
- [x] Inspect existing AWS resources and deployment status.
- [x] Record current operational gaps and unresolved failures.
- [x] Define the first asynchronous feedback-processing workflow.
- [x] Confirm process boundaries and event contracts.
- [x] Define supported failure scenarios and acceptance criteria.

Completion: the starting point, architecture, and verification scope
are documented and supported by evidence.

## Epic 2 — Manage AWS infrastructure with Terraform

- [x] Create documented Terraform configuration under infra/terraform.
- [x] Configure remote state with encryption, versioning, locking,
      and restricted access.
- [ ] Define networking, security groups, IAM, compute, and storage.
- [ ] Import existing resources that should remain in use.
- [ ] Review plans and resolve unintended changes before applying them.
- [ ] Add Terraform formatting and validation to CI.
- [ ] Document infrastructure updates, recovery, and teardown.
- [ ] Add resource tags and cost alerts.

Completion: Terraform manages the intended AWS resources through a
reviewable workflow, with data preservation documented.

## Epic 3 — Establish repeatable application deployment

- [ ] Build versioned container images and publish them to Amazon ECR.
- [ ] Configure GitHub Actions authentication to AWS using OIDC.
- [ ] Configure secure runtime secrets and application settings.
- [ ] Configure a domain, HTTPS, and appropriate demo access.
- [ ] Resolve the existing SSH-on-port-443 arrangement.
- [ ] Automate deployment, controlled migrations, and health checks.
- [ ] Verify rollback using compatible application and database versions.
- [ ] Verify backup restoration in an isolated environment.
- [ ] Provide reproducible synthetic demo data and accounts.

Completion: the current application can be deployed, accessed through
HTTPS, rolled back, and restored using documented procedures.

## Epic 4 — Build durable event processing

- [ ] Define versioned event envelopes with event ID, workspace ID,
      feedback ID, feedback version, timestamp, and correlation ID.
- [ ] Add a PostgreSQL transactional outbox.
- [ ] Save feedback, audit history, and its event in one transaction.
- [ ] Add RabbitMQ with persistent storage.
- [ ] Build a separate outbox relay with safe claiming, publisher
      confirms, and handling for unroutable messages.
- [ ] Build a separate processing worker.
- [ ] Commit processing results before acknowledging messages.
- [ ] Deduplicate completed events within the result transaction.
- [ ] Normalize incoming data and identify exact duplicates while
      preserving source records.
- [ ] Persist processing status and reject stale results.
- [ ] Add bounded concurrency and graceful shutdown.

Completion: manually captured feedback passes through a durable
background workflow with inspectable processing status.

## Epic 5 — Add webhook ingestion and integrations

- [ ] Define a source-neutral incoming feedback format.
- [ ] Add workspace-scoped integration credentials.
- [ ] Verify signatures and timestamps; validate and limit payloads.
- [ ] Deduplicate deliveries by integration and source event ID.
- [ ] Acknowledge receipt only after durable database acceptance.
- [ ] Build a support-system simulator for repeatable demonstrations.
- [ ] Add an Integrations screen with setup, delivery history,
      and a test-event action.
- [ ] Define and enforce permissions for integration management.

Completion: an external simulator can securely submit feedback, and
repeated deliveries do not create duplicate feedback records.

## Epic 6 — Add recovery controls and processing screens

- [ ] Implement bounded retries with backoff and jitter.
- [ ] Distinguish retryable failures from invalid events.
- [ ] Add dead-letter handling and inspectable failure details.
- [ ] Implement authorized, audited replay with explicit replay semantics.
- [ ] Add an Activity screen for pending, completed, retrying,
      and failed processing.
- [ ] Extend the inbox with source information and processing statuses.
- [ ] Extend feedback detail with a processing timeline.
- [ ] Add accessible loading, empty, error, and recovery states.

Completion: users can understand processing state and authorized users
can recover eligible failed work without duplicating completed effects.

## Epic 7 — Verify resilience and operations

- [ ] Test with real PostgreSQL and RabbitMQ.
- [ ] Verify capture continues during worker downtime.
- [ ] Verify outbox recovery after broker downtime.
- [ ] Verify redelivery after a worker commits but fails before acknowledgement.
- [ ] Verify duplicates, invalid events, replay, and stale-event handling.
- [ ] Correlate requests, events, and processing attempts in logs.
- [ ] Measure backlog size, oldest pending work, latency, retries,
      and permanent failures.
- [ ] Add actionable alerts and operational dashboards.
- [ ] Measure recovery under a documented synthetic workload.
- [ ] Rehearse deployment recovery and isolated backup restoration.
- [ ] Document incident response and remaining limitations.

Completion: supported recovery claims have reproducible evidence and
failures are detectable and diagnosable.

## Epic 8 — Publish portfolio evidence

- [ ] Polish the Inbox, Integrations, and Activity journeys.
- [ ] Prepare realistic synthetic demonstration data.
- [ ] Update setup instructions, architecture diagrams, and decisions.
- [ ] Write a case study with measured results and limitations.
- [ ] Prepare a reproducible failure-and-recovery demonstration.
- [ ] Record a 4–5 minute product and architecture video.
- [ ] Add captions, transcript, and a README video link.
- [ ] Verify the hosted demo and tag the release.

Completion: a reviewer can understand, try, and verify the resilient
feedback workflow.

## Epic 9 — Add AI enrichment

Start after the event-driven release is verified.

- [ ] Review the existing classification experiment and evaluation data.
- [ ] Define suggested product areas, tags, and short summaries.
- [ ] Add an AI worker with a separate queue.
- [ ] Validate outputs against authorized workspace options.
- [ ] Record feedback, model, and prompt versions plus usage and latency.
- [ ] Add provider timeouts, bounded retries, and spending limits.
- [ ] Store suggestions separately from approved classification.
- [ ] Add authorized accept/reject controls and stale-result handling.
- [ ] Evaluate held-out examples before enabling suggestions.

Completion: evaluated suggestions support human review without blocking
feedback capture or deterministic processing.

## Epic 10 — Add scheduled insights

- [ ] Define weekly reports with counts, changes, and supporting feedback.
- [ ] Add a scheduler that enqueues durable jobs.
- [ ] Prevent duplicate reports per workspace and reporting period.
- [ ] Define catch-up behavior for missed scheduled runs.
- [ ] Calculate counts deterministically and use AI for summaries.
- [ ] Link report claims to supporting feedback.
- [ ] Add an Insights screen with report history.
- [ ] Evaluate report quality and monitor failures and costs.
- [ ] Update the case study and record an AI workflow demonstration.

Completion: scheduled reports recover from interrupted execution and
contain inspectable evidence.

## Reliability boundaries

- Worker downtime: accepted feedback waits for processing.
- Broker downtime: accepted feedback waits in the PostgreSQL outbox,
  subject to available storage and configured backlog limits.
- Database downtime: requests fail explicitly; receipt is not acknowledged.
- Duplicate delivery: consumers prevent duplicate committed database effects.
- Invalid events: failed work is isolated without blocking healthy work.
- Stale events: older results cannot overwrite newer feedback state.
- Single-host outage: a deployment on one EC2 instance becomes unavailable.

The target is at-least-once delivery with idempotent database effects.
External side effects require their own deduplication or reconciliation.

## Delivery milestones

1. AWS foundation: Epics 1–3.
2. Resilient portfolio release: Epics 4–8.
3. AI and scheduled intelligence: Epics 9–10.

## Outside this phase

CSV import, vector search, semantic clustering, opportunity scoring,
full decision tracking, Kubernetes, and elaborate membership administration
remain outside this plan.
