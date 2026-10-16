# SignalDesk: a reliable feedback inbox

## Problem and scope

SignalDesk explores a narrow product-feedback workflow: capture a signal,
find it again, manually classify it, edit it reliably, and inspect history.

I implemented the project with AI assistance, reviewed and applied source
changes myself, and verified behavior through automated tests and a labeled
developer walkthrough. All demonstration data is synthetic.

The delivered portfolio experience runs locally. Public hosting is deferred;
the original roadmap's public-demo requirement is not fulfilled.

## Architecture and authorization

Next.js renders the interface and forwards session credentials to NestJS.
Better Auth manages PostgreSQL-backed sessions. NestJS independently checks
workspace membership and editor/viewer permissions.

Workspace-aware foreign keys prevent product-area and tag relationships
from crossing tenant boundaries. The interface uses one seeded workspace;
direct API tests exercise unauthorized and cross-workspace requests.

See [architecture](ARCHITECTURE.md), [data model](DATA_MODEL.md), and
[authentication ADR](decisions/0004-authentication-and-workspace-access.md).

## Reliable mutations

Feedback creation uses a scoped idempotency key. Editing and classification
check an expected version, protecting against silent stale overwrites.
Important mutations and their audit events share a transaction.

Integration tests exercise duplicate creation, stale changes, and forced
audit-write failure. Browser coverage connects capture, editing,
classification, history, and viewer restrictions.

## A browser regression found a real workflow defect

Editing feedback refreshed server data but left the classification form
holding its original version. A subsequent classification save failed
with a conflict despite occurring on the same page.

I updated untouched forms to adopt refreshed server versions while preserving
unsaved drafts and their original versions. The reverse classify-to-edit
transition received the same treatment.

This distinction matters: blindly replacing a draft's version could permit
a stale write, while remounting every form could discard unsaved work.

## Performance investigation

On 10,000 synthetic records, the newest inbox-page query scanned and sorted
the workspace's feedback to return 21 rows.

A workspace/order index changed the plan to an ordered index scan.
Excluding one warm-up per condition, five measured executions had medians
of 4.682 ms before and 0.034 ms after, with buffer hits falling from 626 to 4.

These are local database measurements, not production throughput or browser
latency. The experiment does not establish search/filter performance or
account for index write/storage overhead.

[Reproduction and results](operations/WEEK7_HARDENING.md).

## Operations and debugging

The application distinguishes liveness from PostgreSQL readiness, records
correlated requests, and provides bounded privacy-conscious failure reporting.

An isolated configuration-failure rehearsal linked an unhealthy API and
web transport failure to retained-image recovery and correlated credential
rejection. That demonstrated restored reachability, not successful
authenticated recovery.

Local demo setup exposed another configuration boundary: an older rehearsal
container owned the intended browser port. Verifying the listener and
container mapping resolved the apparent credential problem.

[Incident evidence](operations/INCIDENT_WALKTHROUGH.md) and
[verification limitations](operations/WEEK6_CLOSEOUT.md%3A).

## Why AI suggestions remain disabled

The held-out synthetic evaluation achieved 17/20 product-area accuracy,
14/16 tag precision, and 14/15 tag recall. This small evaluation does not
establish usefulness on representative customer feedback.

Browser acceptance/rejection/provider-outage verification and representative
feedback evaluation remain release gates. The manual workflow is the
delivered product path.

[Evaluation and defer decision](evaluation/WEEK5_DECISION.md).

## Verification and limits

On October 14, 2026, the API integration suite passed 23 tests across six
suites against signaldesk_test. Web checks included lint, TypeScript,
14 unit tests, a production build, and the expanded critical browser journey.
These are recorded results, not a claim that every later commit passed CI.

The developer reported keyboard, navigation, viewer, and 200% zoom checks
passing. External participants were unavailable; no independent user
validation is claimed. Screen-reader announcements were not separately
verified.

Monitoring is operator-reviewed. External alerts, durable log collection,
protected-VM verification, and cross-version migration recovery retain
documented limitations.

## Delivered and deferred

Delivered: local manual feedback workflow, authorization, reliable mutations,
audit history, reproducible performance evidence, and isolated demo reset.

Deferred: public hosting, production AI suggestions, CSV imports, clustering,
opportunities, prioritization, queues, and live updates.

Two reviewed AI contributions and their corrections are recorded in
[AI-assisted development examples](AI_ASSISTED_EXAMPLES.md).