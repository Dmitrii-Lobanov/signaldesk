# Week 5 classification suggestion decision

## Decision

Week 5 decision: defer production AI suggestions. Keep manual classification
available. Suggestions remain available only when explicitly enabled with
`AI_SUGGESTIONS_ENABLED=true`.

The two-provider evaluation completed without held-out request failures, but
20 synthetic held-out cases do not establish accuracy on real customer
feedback. Browser verification of accept, edit, reject, and manual
classification during a provider outage is required before production
enablement.

## Measurement conditions

- 10 synthetic tuning cases and 20 separate held-out cases.
- Choices: Navigation and Reporting; tags: Usability and Export.
- Gemini was tried first; Groq was used after a Gemini failure or invalid
  response. Valid null/empty classifications did not trigger fallback.
- Model and prompt versions are recorded per case in the result files.
- The runner used one-second spacing between cases. Exact run timestamps
  were not recorded.
- All failures count as incorrect in quality metrics.
- Results were obtained by calling the server-side adapter directly with
  synthetic text. This does not measure browser or database behavior.

## Earlier Gemini-only tuning run

`Tuning-results.jsonl` is the earlier Gemini-only baseline: 2/10 successful
responses and 8/10 failures. Product-area accuracy including failures was
20%, and tag recall was 25%. A separate diagnostic request on October 12,
2026 returned Gemini HTTP 503 `UNAVAILABLE`.

## Gemini-to-Groq tuning run

`tuning-fallback-results.jsonl` contains 10/10 successful responses, all
from Groq. Product-area accuracy was 8/10 (80%). Tag precision was 8/9
(88.9%) and recall was 8/8 (100%). The area mistakes were t04 and t10.

## Gemini-to-Groq held-out run

`held-out-fallback-results.jsonl` contains all 20 cases, with no request
failures. Groq answered 19 cases; Gemini answered 1.

- Product-area accuracy: 17/20 (85%).
- Tag precision: 14/16 (87.5%).
- Tag recall: 14/15 (93.3%).
- Mean latency: 2,909 ms; median: 1,797 ms; maximum: 8,275 ms.
- Product-area mistakes: h10, h11, h19.
- Tag false positives: h04 and h11. Missed tag: h19.
- Known paid-tier estimate: $0.00049425 for the one Gemini response.
  The adapter records no Groq cost estimate, so total cost is unknown.
  This estimate is not a measured charge.

## Safety and release gate

Automated tests cover invalid model output, provider failure, workspace
access, suggestion-only behavior, request limits, and stale acceptance.
Manual classification remains available.

Before enabling production suggestions, verify in the browser that an editor
can reject without changing classification, edit or accept through the
audited save path, and classify manually when both providers are unavailable.
Evaluate accuracy on representative real feedback and decide an acceptable
quality threshold. These are release gates, not unfinished Week 5 evaluation
work.
