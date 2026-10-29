# Feedback processing acceptance criteria

Status: planned; scenarios have not been executed.
Date: 2026-10-29.
Scope: Epic 1, Step 6.

Design: [Feedback processing](../FEEDBACK_PROCESSING.md).

## Purpose

Define observable pass/fail criteria for durable feedback processing.

Run failure tests against an isolated environment with synthetic data.
Never interrupt the shared development deployment to run these tests.

Use real PostgreSQL and RabbitMQ for integration verification.
Use controlled failure hooks to reproduce precise crash windows.

## Evidence requirements

For every executed scenario, record:

- Application commit and container image identifiers.
- Relevant configuration, including retry and lease settings.
- Synthetic dataset and initial state.
- Failure introduced and recovery action.
- Observed database, queue, API, and UI results.
- Pass/fail outcome and remaining limitations.

Do not include secrets or raw customer data.

## A01 — Atomic capture

Action:
Force the creation audit write or outbox write to fail.

Pass:
No feedback, creation audit, processing job, or outbox event from that
request remains committed. The API reports failure.

Repeat without the injected failure.

Pass:
Exactly one feedback record, creation audit, initial job, and initial
outbox event are committed together.

## A02 — Repeated capture request

Action:
Submit the same capture request twice using the same request key.

Pass:
Both successful responses identify the same feedback record.
Only one creation audit, initial job, and initial event exist.

Reuse the key with different content.

Pass:
The API rejects the conflicting request without changing saved data.

## A03 — Worker outage

Action:
Stop the processing worker and create 20 feedback records.

Pass:
All accepted records remain readable, searchable, editable, and manually
classifiable. Their processing remains pending.

Restart the worker and allow the configured recovery window.

Pass:
All current revisions complete without duplicate results.
Record the measured recovery duration.

## A04 — Broker outage

Action:
Stop RabbitMQ while PostgreSQL and the API remain available.
Create 20 feedback records.

Pass:
Capture succeeds within configured capacity limits.
Each accepted record has durable outbox delivery intent.
No event is falsely marked published.

Restore RabbitMQ.

Pass:
Pending events publish and current revisions complete.

## A05 — Relay crash after publication

Action:
Terminate the relay after RabbitMQ confirms a message but before the
relay records publication success.

Restart the relay.

Pass:
The event may be delivered again with the same event ID.
The consumer produces only one committed result for that job.
No accepted work is lost.

## A06 — Worker crash before result commit

Action:
Terminate a worker after claiming work but before committing results.

Pass:
No partial result is committed.

Restart processing and allow the lease to expire where necessary.

Pass:
The interrupted attempt is recorded and recovery is scheduled.
The job completes or reaches the configured terminal attempt limit.
It does not remain permanently marked processing.

## A07 — Worker crash after commit

Action:
Terminate a worker after its result transaction commits but before
acknowledging the message.

Pass:
Redelivery is recognized as completed.
No duplicate result or duplicate completion effect is committed.

## A08 — Database unavailable during processing

Action:
Interrupt database connectivity while a worker is processing.

Pass:
The worker does not acknowledge unfinished work.
It pauses or reconnects with backoff without a tight redelivery loop.
No partial result is committed.

Restore connectivity.

Pass:
Processing resumes through redelivery or lease recovery.

## A09 — Temporary processing failure

Action:
Inject a retryable failure for the first two application attempts,
then permit success.

Pass:
Attempts and sanitized failure codes are recorded.
Retries are not published before their scheduled available-at times.
Attempt three completes.
No terminal failure or DLQ envelope is created.

Transport redelivery alone does not increment the application attempt.

## A10 — Attempts exhausted

Action:
Inject a retryable failure on every application attempt.

Pass:
The job stops after five application attempts.
A terminal failure and failure outbox envelope are committed.
The current feedback revision displays Needs attention.
Healthy jobs continue processing.

The failure envelope eventually reaches the DLQ and the failure recorder
persists or reconciles it without duplicating failure history.

## A11 — Broker unavailable during failure handoff

Action:
Make the broker unavailable as a worker records a terminal failure.

Pass:
The failure record and outgoing failure envelope commit together.
The original message is acknowledged only after that commit.

Restore the broker.

Pass:
The relay publishes the stored failure envelope to the DLQ.
Inspection history remains available throughout the broker outage.

## A12 — Invalid message

Action:
Publish malformed JSON, an unsupported schema version, and a message
whose persisted job does not match its supplied workspace.

Pass:
Invalid messages do not mutate feedback or another workspace's data.
They are durably quarantined before acknowledgement.
Healthy messages continue processing.

Untrusted workspace identifiers do not expose quarantine records through
tenant-facing Activity views.

## A13 — Stale result and expired lease

Action:
Pause processing of content revision 1, then edit feedback to revision 2.
Allow revision 2 to complete, then resume the older worker.

Pass:
Revision 1 cannot overwrite revision 2's result or processing status.
The obsolete outcome is recorded.

Repeat with a worker whose lease has expired and been replaced.

Pass:
Its obsolete lease token cannot authorize a result write.

## A14 — Concurrent delivery and recovery

Action:
Deliver the same event concurrently to two workers.
Run two recovery scheduler instances against the same expired lease.

Pass:
Only one valid claim performs committed processing.
Only one next application attempt is scheduled for that recovery.
Uniqueness constraints and locking preserve these invariants.

## A15 — Authorized replay

Action:
Replay a failed job as an authorized editor.
Repeat the request with the same replay idempotency key.

Pass:
One new job and initial event are created for the current content revision.
The original failure remains linked and inspectable.
The replay is audited.

Attempt replay as a viewer or a user from another workspace.

Pass:
The API rejects the request without changing jobs, events, or audit history.

Attempt a second replay while an equivalent job is active.

Pass:
No competing active job is created.

## A16 — Exact-duplicate candidates

Action:
Process two matching normalized texts in one workspace.
Process the same text in another workspace.
Also process texts that differ in case or punctuation.

Pass:
Only matching normalized text within the same workspace is identified
as an exact-duplicate candidate.
Original records remain unchanged.
No cross-workspace information is exposed.

## A17 — Existing feedback backfill

Action:
Run backfill twice over existing feedback while editing one record.

Pass:
Backfill does not create competing jobs for the same revision and
processor version. The edited record eventually has a result for its
current revision. Existing manual workflows remain usable.

## A18 — Container and broker restart

Action:
Restart the broker and application processes while accepted work is
pending, preserving their storage.

Pass:
Pending work recovers without duplicate committed effects.

This scenario does not simulate permanent disk loss.

## Timing and capacity

Before implementation verification, record:

- Worker concurrency and prefetch.
- Lease duration and renewal interval.
- Scheduler and relay polling intervals.
- Retry delays and jitter bounds.
- Outbox and queue capacity limits.
- Automated test timeouts.

Tests must use bounded waits derived from those settings.
Replace timing placeholders with measured evidence before release.

A full outbox or queue must cause explicit backpressure or rejection.
The system must not silently discard previously accepted work.

## Scope boundary

These tests target process interruption, dependency downtime, duplicate
delivery, and recovery with persistent storage retained.

They do not establish multi-host high availability, recovery from
permanent disk loss, or correctness of future AI analysis.

The initial single-EC2 deployment remains unavailable during host outage.
