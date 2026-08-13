# MVP backlog

The complete MVP is broader than the ten-week portfolio slice in [ROADMAP.md](ROADMAP.md). Items marked **portfolio slice** are the initial delivery target; the remaining outcomes continue after Week 10 if they cannot be completed without reducing verification quality.

## Epic 1: Workspace foundation

**Outcome:** members access only the workspace data and actions allowed by their role.

**Portfolio slice:** seeded or minimally managed workspaces, role enforcement, and cross-workspace isolation. Invitation administration may follow.

- Create a workspace and invite a member.
- Enforce owner, editor, and viewer permissions.
- Prove cross-workspace isolation with negative integration tests.
- Record membership changes in the audit log.

## Epic 2: Feedback inbox

**Outcome:** an editor can capture, find, and classify customer evidence efficiently.

**Portfolio slice:** manual capture, deterministic pagination, essential filters, URL state, and keyboard operation. Saved views and advanced bulk workflows may follow.

- Create and edit a signal with customer, source, occurrence time, and content.
- Filter by status, source, tag, customer, product area, and date.
- Preserve filters and selection in the URL.
- Support keyboard-first triage and accessible bulk actions.

## Epic 3: Reliable CSV import

**Outcome:** an editor can import imperfect data without duplicating successful work.

**Portfolio slice:** one bounded synchronous import path with preview, row errors, stable identity, and safe retry. Background processing and live progress require measured justification.

- Preview mapping and validation before starting.
- Display accepted, rejected, duplicate, and pending counts.
- Report row-specific errors and allow corrected retries.
- Make repeated submissions idempotent.

## Epic 4: Evidence grouping

**Outcome:** related feedback can support one opportunity without losing source context.

**Post-slice by default:** begin only if the foundation, feedback, security, and import evidence is complete.

- Suggest and manually select related feedback.
- Create an opportunity from selected evidence.
- Add or remove evidence with audit history.
- Show representative excerpts and affected customers.

## Epic 5: Prioritization and decisions

**Outcome:** a team can make and later explain a prioritization decision.

**Post-slice by default:** do not rush scoring and decisions merely to claim the complete MVP.

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
