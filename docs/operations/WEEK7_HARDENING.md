# Week 7 — Feedback and hardening

## Status

Implementation and automated hardening checks completed.
The Week 7 gate remains open pending participant or structured-walkthrough
observations and manual accessibility findings.

## Observations and decisions

- Source inspection found capture errors were not associated with the
  textarea. Added an accessible error description, invalid state, and
  focus return after empty submission.
- Browser regression exposed an outdated classification-form version
  after editing feedback on the same page.
- Updated untouched classification and edit forms when refreshed server
  versions arrive. Unsaved drafts retain their original versions to
  preserve stale-write protection.
- These findings came from source inspection and automated browser
  testing, not participant sessions.

## Performance investigation

Measured the newest inbox-page query against 10,000 synthetic records
in signaldesk_test, requesting 21 rows. Content length was 382–386
characters. PostgreSQL was 18.6 on aarch64 Alpine Linux.

Six executions per condition were recorded. Excluding the first execution
of each condition as warm-up:

| Measurement        | Before index             | After index        |
| ------------------ | ------------------------ | ------------------ |
| Median execution   | 4.682 ms                 | 0.034 ms           |
| Execution range    | 4.120–5.092 ms           | 0.024–0.037 ms     |
| Shared-buffer hits | 626                      | 4                  |
| Plan               | Sequential scan and sort | Ordered index scan |

Decision: retain the index on
(workspace_id, created_at DESC, id DESC).

The comparison temporarily dropped and rebuilt the shipped index inside
a transaction. Rollback removed the synthetic records and experimental
changes; the final check confirmed the original index remained.

Reproduction: run from the repository root without concurrent test or
application traffic:

```sh
docker compose -p signaldesk-ops-test -f compose.ops-test.yaml \
exec -T postgres psql -U signaldesk -d signaldesk_test \
-v ON_ERROR_STOP=1 < docs/operations/evidence/week7/inbox-performance.sql
```

## Verification

- Web lint, TypeScript, formatting, and 14 unit tests passed.
- Saved browser results passed for the expanded critical journey.
- On October 14, 2026, the API integration suite passed all 23 tests
  across six suites against signaldesk_test.
- Browser coverage includes keyboard capture-error recovery, stale edits,
  manual classification persistence and audit evidence, viewer restrictions,
  and same-page form-version refresh.

## Outstanding evidence

- Participant availability and honestly labeled session observations.
- Manual keyboard, focus, announcements, and 200% zoom findings.
- Preservation of the performance command and full measured outputs.

AI remains disabled. Week 6 operational verification limitations remain
unchanged. No user-validation or Week 7 completion claim is made.
```
