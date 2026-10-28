# ADR 0005: Evolve toward a resilient feedback platform

- Status: accepted
- Date: 2026-10-28
- Updates: ADR 0002's scope and delivery horizon for future development.
  Historical implementation evidence remains unchanged.

## Context

SignalDesk's existing portfolio slice focuses on a reliable manual
feedback workflow. The next phase should demonstrate infrastructure
management, asynchronous processing, failure recovery, and full-stack
product delivery.

External feedback ingestion provides a practical reason to introduce
messaging and workers. AI enrichment will follow after the underlying
workflow is reliable.

## Decision

Use the evolution plan as the active delivery plan.

Retain Next.js, NestJS, PostgreSQL, and TypeORM. Begin by verifying the
existing deployment and bringing intended AWS infrastructure under
Terraform management.

Initially retain EC2 and Docker Compose. Add RabbitMQ, a separate outbox
relay, and a separate processing worker within the existing repository.

Use a PostgreSQL transactional outbox to connect committed feedback
changes to event publication. Assume at-least-once delivery and make
consumer database effects idempotent.

Add webhook ingestion, processing visibility, retry and replay controls,
and reproducible failure demonstrations.

Add AI enrichment and scheduled insights after the event-driven release
is verified. Keep AI suggestions disabled until their implementation
and evaluation gates pass.

## Alternatives considered

- Keep only the manual inbox: provides less evidence of asynchronous
  processing and recovery.
- Add AI first: introduces provider variability before the durable
  processing foundation is established.
- Introduce ECS, Kubernetes, or multiple databases immediately:
  expands operational scope before baseline deployment is verified.
- Publish directly after a database write without an outbox:
  leaves a failure window between persistence and publication.

## Consequences

The application gains eventual consistency, more processes, and
additional operational responsibilities.

The interface must explain pending and failed processing. Tests must
cover duplicate delivery, interrupted execution, and recovery.

A single EC2 instance remains a host-level point of failure. Recovery
from worker or broker interruption does not establish high availability.

Terraform manages AWS infrastructure. Application deployment remains
a separate workflow.

## Validation

Use the epic completion criteria in the evolution plan. Support
reliability claims with integration tests and documented demonstrations.

Revisit the hosting decision when resource usage, isolation requirements,
availability goals, or operating cost justify a different deployment.

## References

- [Evolution plan](../EVOLUTION_PLAN.md)
- [Original delivery decision](0002-eight-week-ai-assisted-delivery.md)
