# Feedback processing design

Status: planned, not implemented.
Date: 2026-10-29.
Scope: Epic 1, Steps 4 and 5.

## User outcome

Feedback is saved immediately and remains readable, searchable, editable,
and manually classifiable while background processing is unavailable.

Background processing adds normalized text, character and word counts,
and exact-duplicate candidates. It preserves the original feedback.

Start with manual capture. Webhook ingestion follows after the pipeline
is verified.

## Process responsibilities

### API

- Authenticate users and enforce workspace permissions.
- Validate feedback and preserve capture idempotency.
- Save feedback, audit history, pending processing state, and an outbox
  event in one PostgreSQL transaction.
- Return saved feedback after commit without waiting for RabbitMQ.
- Expose processing state and authorized recovery operations.

### Outbox relay

- Claim due outbox entries using expiring leases.
- Publish persistent messages to their configured exchange.
- Require publisher confirmation and detect unroutable messages.
- Mark publication complete only after successful confirmation and routing.
- Retry interrupted publication without changing the message ID.

### Processing worker

- Validate messages and enforce workspace-scoped database access.
- Claim a processing attempt with an expiring lease.
- Calculate derived results.
- Commit results and message deduplication atomically.
- Record retries or terminal failures durably before acknowledgement.
- Acknowledge completed, superseded, or durably handed-off messages.

### Recovery scheduler

- Find expired processing leases and due retries.
- Create replacement delivery messages through the outbox.
- Use locking and uniqueness constraints to prevent concurrent schedulers
  from creating duplicate scheduled attempts.

Initially run this loop in the relay process. Keep its responsibility
separate in code so it can be deployed independently later.

### Failure recorder

- Consume the dead-letter queue.
- Persist or reconcile quarantine records idempotently.
- Acknowledge only after the database transaction commits.
- Run as a separate consumer within the worker application.

### Web application

- Display feedback and processing state.
- Show failure summaries and attempt history in Activity.
- Permit recovery actions only through authorized API operations.
- Use page refresh initially; live updates are not required.

## Persistence boundary

Use one PostgreSQL instance initially.

The API owns feedback and manual classification mutations.
Workers own derived results and processing attempts.
The relay owns publication leases and delivery bookkeeping.

Shared storage simplifies transactions but couples these processes to
the same database. They are separate processes, not independently owned
microservice databases.

Audit history records user and recovery actions.
Outbox records delivery intent.
Neither table substitutes for the other.

## Successful processing flow

1. API commits feedback, creation audit, processing job, and outbox event.
2. Relay publishes the event to RabbitMQ.
3. Worker claims the attempt and calculates derived information.
4. Worker transaction verifies the current content revision and lease.
5. It saves derived results, completes the job, and records the consumed
   message ID.
6. Worker acknowledges the message.

Retrying a successful capture with the same request key returns the
existing feedback without creating another creation event or job.

## Derived information

Normalization version 1:

- Apply Unicode NFC normalization.
- Trim leading and trailing whitespace.
- Collapse consecutive whitespace into one space.
- Preserve case and punctuation.

Store normalized text, its SHA-256 fingerprint, normalization version,
character count, and word count.

Count characters as Unicode code points in normalized text.
Count words as whitespace-separated tokens; this is a simple metric,
not language-aware tokenization.

Identify duplicate candidates within one workspace using fingerprints
and normalization version, then compare normalized text.

Preserve both source records. Do not automatically merge or delete them.
Repeated delivery of one event is handled separately by ingestion and
consumer deduplication.

## Event contract

Use feedback.processing.requested with schemaVersion 1.

Example:

    {
      "eventId": "f6c24e88-1706-4595-90f0-65a2aa221027",
      "type": "feedback.processing.requested",
      "schemaVersion": 1,
      "occurredAt": "2026-10-29T15:00:00.000Z",
      "workspaceId": "ee826552-a85a-4451-b0d6-e388a05bf510",
      "correlationId": "cff47998-c325-4100-a61e-03330b7adca9",
      "causationId": null,
      "data": {
        "feedbackId": "3265d596-be7f-4984-a51f-c0aaa508c777",
        "contentRevision": 1,
        "jobId": "a01a2ef0-8cc3-46b4-b507-63ad80da88f5",
        "attempt": 1,
        "processorVersion": "feedback-normalization-v1"
      }
    }

eventId identifies one logical message and stays unchanged across transport
redelivery. Set the AMQP messageId to this eventId.

jobId identifies a processing run.
attempt identifies a scheduled application attempt within that run.

A retry has a new eventId, the same jobId, an incremented attempt,
and causationId pointing to the previous message.

Preserve correlationId across the workflow.
It is an opaque trace identifier, not a credential.

Messages contain references rather than raw feedback or credentials.
Validate all identifiers, supported versions, timestamps, and bounded
attempt values at runtime. TypeScript types alone are insufficient.

The worker verifies that job, workspace, feedback, content revision,
and attempt match persisted records.

## Content edits and ordering

Introduce contentRevision separately from the existing feedback version.

The existing version protects user edits and classification changes.
contentRevision changes only when feedback text changes.

A content edit atomically increments contentRevision, marks processing
pending, creates a new job, and writes a new outbox event.

Before committing results, lock and verify the current revision and
processing lease. Older results cannot replace newer results.

A classification-only change does not trigger text processing.
Worker writes do not increment the user-facing feedback version.

Ordering is not guaranteed. Correctness depends on revision checks,
job identity, leases, and deduplication.

## RabbitMQ topology

Use durable direct exchanges and durable queues:

| Exchange              | Routing key                      | Queue                                 |
| --------------------- | -------------------------------- | ------------------------------------- |
| signaldesk.processing | feedback.processing.requested.v1 | signaldesk.feedback.processing.v1     |
| signaldesk.failures   | feedback.processing.failed.v1    | signaldesk.feedback.processing.dlq.v1 |

Use persistent messages, manual consumer acknowledgements, publisher
confirms, mandatory publishing, and bounded prefetch.

The DLQ is consumed by the failure recorder. The database retains
inspection history after the queue message is acknowledged.

Select and verify queue type and broker redelivery policies during
implementation. Do not rely on default dead-letter behavior for lossless
transfer. A single broker on one EC2 host does not provide host-level
high availability.

## Temporary failures and delayed retries

Initial policy: at most five application attempts per job.
After attempts 1–4, schedule retries with base delays of
5 seconds, 30 seconds, 2 minutes, and 10 minutes, plus bounded jitter.

For a retryable failure, one database transaction:

1. Records the failed attempt with a sanitized error code.
2. Marks the job retrying.
3. Adds a retry message to the outbox with its available-at timestamp.
4. Records completion of the current message's handoff.

Then acknowledge the current message.
The relay publishes the retry only when it is due.

If that transaction fails, do not acknowledge. Pause consumption and
recover the connection with backoff rather than immediately requeueing
in a tight loop.

Transport redelivery is not a new application attempt.
An expired lease records an interrupted attempt and schedules recovery
within the same bounded attempt policy.

Lease tokens fence writes from workers whose claims have expired.

## Terminal failures and the dead-letter queue

Invalid supported input and exhausted retries are terminal failures.

For a valid processing message, one database transaction:

1. Records the terminal failure and attempt history.
2. Marks the current job failed.
3. Writes a failure envelope to the outbox.
4. Records completion of the original message's handoff.

Then acknowledge the original message.

The relay eventually publishes the failure envelope to the DLQ.
If RabbitMQ is unavailable, that envelope remains in the outbox.

A failure envelope includes:

- failureId and its own eventId.
- Original event ID, job ID, and correlation ID.
- Validated workspace, feedback, and content revision identifiers.
- Attempt count, failure timestamp, and sanitized error code.

Never copy raw feedback, credentials, or provider responses into errors.

For malformed or unsupported messages, record an operator-only quarantine
entry and failure outbox message before acknowledgement.

Do not trust malformed workspace identifiers or expose such records in a
tenant's Activity view. Use a bounded payload digest and validated transport
identity to recognize redelivery.

The failure recorder deduplicates by failureId and reconciles the
quarantine record. It does not retry processing automatically.

## Inspection and replay

Show Needs attention only when the current content revision's job failed.
Historical failures remain visible in Activity without marking newer
successful revisions failed.

An authorized replay:

1. Checks workspace permission and current processing state.
2. Creates a new job and event for the current content revision.
3. Links the new job to the original failure.
4. Writes an audit record in the same transaction.

The replay endpoint requires an idempotency key and prevents concurrent
active jobs for the same feedback revision and processor version.

Replay preserves the original failure history.
It does not blindly republish arbitrary DLQ payloads.

## Existing feedback and AI

Existing feedback remains usable and displays Not processed until a
controlled, repeatable backfill schedules jobs through the same outbox.

The existing request-driven AI experiment remains separate.
Future background AI processing uses its own queue and human-review flow.

## Failure boundaries

- Worker down: accepted feedback waits.
- Broker down: delivery intent waits in PostgreSQL, within capacity limits.
- Database down: capture fails; workers do not acknowledge unfinished work.
- Duplicate message: no duplicate committed processing effect.
- Stale event: no overwrite of newer results.
- Terminal failure: durable inspection record and eventual DLQ delivery.
- Entire host down: the initial deployment is unavailable.

Detailed acceptance tests are defined in Epic 1, Step 6.
