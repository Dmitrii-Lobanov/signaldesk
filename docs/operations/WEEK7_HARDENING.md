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
in signaldesk_test, requesting 21 rows.

The visible baseline plan scanned 10,000 rows, sorted them, used 626
shared-buffer hits, and executed in 5.290 ms.

The visible experimental indexed plan returned 21 rows without sorting,
used four shared-buffer hits, and executed in 0.032 ms.

Decision: add an index on
(workspace_id, created_at DESC, id DESC).

The experiment used a transaction and rolled back synthetic records and
the temporary index. A separate migration implements the retained index.

Limitations: screenshots show individual runs, not five-run averages.
This measures local database execution, not browser latency, concurrent
load, search/filter performance, or production behavior.
The index adds storage and write overhead.

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
