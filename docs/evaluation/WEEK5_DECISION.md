# Week 5 classification suggestion decision

## Decision

Defer AI suggestions. Keep manual classification available. The suggestion
experiment has not passed the Week 5 quality gate.

## Measurement conditions

- Synthetic labeled cases: 10 tuning and 20 reserved held-out cases.
- The tuning run used `gemini-3.8-flash` through
  `classification-gemini-3.8-v1`, with an 8-second adapter timeout and
  one-second spacing between requests.
- Choices were Navigation and Reporting; tags were Usability and Export.
- Results are in `tuning-results.jsonl`. The runner did not record the
  exact run time.
- The held-out set was not run, so no held-out accuracy claim is made.

## Tuning results

- Successful responses: 2/10; failures: 8/10.
- Product-area accuracy, counting failures as incorrect: 2/10 (20%).
- Tag precision: 2/2 (100%) on the two predicted tags.
- Tag recall, counting missed tags on failures: 2/8 (25%).
- Mean elapsed time across all attempts: 3,066 ms. Three failures took
  approximately the full 8-second timeout.
- Known estimated cost for the two successful responses: $0.000837.
  Cost for failed requests is unknown. This is the adapter's paid-tier
  list-price estimate, not a measured charge.

The adapter reports a generic failure, so the tuning results do not
identify every provider error. A separate synthetic diagnostic request
on October 12, 2026 returned HTTP 503 `UNAVAILABLE` with a
high-demand message from Gemini.

## Safety and product behavior

Automated tests cover invalid model output, provider failure, access
control, suggestion-only behavior, request limits, and stale acceptance.
Manual classification remains available. Rejection in the browser has
not yet been demonstrated while the provider is unavailable.

## Revisit criteria

Run a fresh tuning pass when provider availability is stable. Then run
the reserved held-out cases once, report accuracy and tag precision/
recall including failures, and demonstrate accept, edit, and reject in
the app before considering shipment.