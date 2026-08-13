# MVP backlog

## Epic 1: Workspace foundation

**Outcome:** members access only the workspace data and actions allowed by their role.

- Create a workspace and invite a member.
- Enforce owner, editor, and viewer permissions.
- Prove cross-workspace isolation with negative integration tests.
- Record membership changes in the audit log.

## Epic 2: Feedback inbox

**Outcome:** an editor can capture, find, and classify customer evidence efficiently.

- Create and edit a signal with customer, source, occurrence time, and content.
- Filter by status, source, tag, customer, product area, and date.
- Preserve filters and selection in the URL.
- Support keyboard-first triage and accessible bulk actions.

## Epic 3: Reliable CSV import

**Outcome:** an editor can import imperfect data without duplicating successful work.

- Preview mapping and validation before starting.
- Display accepted, rejected, duplicate, and pending counts.
- Report row-specific errors and allow corrected retries.
- Make repeated submissions idempotent.

## Epic 4: Evidence grouping

**Outcome:** related feedback can support one opportunity without losing source context.

- Suggest and manually select related feedback.
- Create an opportunity from selected evidence.
- Add or remove evidence with audit history.
- Show representative excerpts and affected customers.

## Epic 5: Prioritization and decisions

**Outcome:** a team can make and later explain a prioritization decision.

- Configure a small scoring model with visible inputs.
- Add qualitative rationale and constraints.
- Record accepted, deferred, rejected, and investigating outcomes.
- Expose a chronological decision history.

## Epic 6: Operational confidence

**Outcome:** a developer can detect, locate, and explain a critical failure.

- Add structured request and job logging.
- Capture frontend and backend errors.
- Correlate import UI, API request, and worker job.
- Document one incident drill and recovery.
