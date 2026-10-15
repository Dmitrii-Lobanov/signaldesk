# Week 7 — Feedback and hardening

## Status

Close Week 7 hardening using the roadmap's structured-walkthrough fallback.
Automated verification, developer-reported manual findings, resulting fixes,
and a reproducible performance investigation are recorded below.
External participant validation remains unavailable.

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

Script: [inbox-performance.sql](evidence/week7/inbox-performance.sql).
Results: [inbox-performance.txt](evidence/week7/inbox-performance.txt).

Limitations: five measured executions per condition in one local session.
This measures database execution, not browser latency, concurrent load,
search/filter performance, or production behavior. The index adds storage
and write overhead.

## Verification

- Web lint, TypeScript, formatting, and 14 unit tests passed.
- Saved browser results passed for the expanded critical journey.
- On October 14, 2026, the API integration suite passed all 23 tests
  across six suites against signaldesk_test.
- Browser coverage includes keyboard capture-error recovery, stale edits,
  manual classification persistence and audit evidence, viewer restrictions,
  and same-page form-version refresh.

## Developer structured walkthrough — October 15, 2026

Other participants were unavailable. The developer reported completing
the following checks using synthetic feedback:

- Keyboard capture → classify → edit → classify without reloading:
  passed, with visible focus and clear save confirmations.
- Inbox search/filter navigation, refresh, and Back/Forward: passed.
- Controls remained readable and usable at 200% browser zoom: passed.
- Viewer keyboard inspection of feedback, classification, and history:
  passed; capture, edit, and classification mutation controls were absent.
- Sign-out initially failed. The developer confirmed it worked after
  correcting the authentication origin configuration.

These are developer-reported results, not independent participant
validation. Screen-reader announcement behavior was not separately verified.

## Limitations

No sessions with external participants were conducted.
The walkthrough does not establish general usability or accessibility
conformance. Performance results retain the measurement limits described
above. AI remains disabled, and Week 6 operational limitations remain.
