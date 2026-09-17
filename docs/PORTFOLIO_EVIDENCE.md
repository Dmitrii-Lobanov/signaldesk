# Portfolio evidence plan

## Required for the eight-week slice

- Public demo with isolated synthetic data and constrained demo access.
- Two-minute product video and concise technical walkthrough.
- README setup/status, architecture and data model matching implemented behavior.
- Meaningful ADRs for material decisions, with alternatives and consequences.
- Passing CI for types, lint, tests and builds; a critical end-to-end journey and database/authorization integration tests.
- Security demonstration: viewer mutation denial and cross-workspace access denial through direct API calls.
- Reliability demonstration: transactional audit rollback, duplicate submission handling and stale edit behavior.
- One correlated failure investigation and documented recovery procedure.
- Accessibility review of the shipped critical workflow.
- One reproducible frontend or backend/database performance investigation; before/after evidence when a change is justified.
- Findings from 2–3 task-based user sessions, or an explicit recruitment limitation and labeled internal walkthrough.
- At least two AI-assisted development examples: original task/context, agent contribution, your corrections, verification and what you can explain independently. Remove sensitive data.
- Concise case study with constraints, decisions, evidence and limitations.

## Conditional AI classification evidence

Required only if the Week 5 experiment ships:

- Labeled synthetic evaluation set with tuning/held-out separation and ambiguous/adversarial examples.
- Model/prompt versions, product-area accuracy, tag precision/recall, latency and estimated cost with method and limitations.
- Demonstration of accept/edit/reject, invalid-output handling, timeout/provider outage and manual fallback.
- Proof that suggestions do not mutate feedback without an authorized human action.

If deferred, document why. AI-assisted development evidence remains required.

## Case-study outline

1. Customer-feedback problem and deliberately narrow capture-and-classify workflow.
2. UI, API, data and authorization boundaries.
3. Transactions, retries, stale edits and audit history.
4. AI-assisted workflow: useful output, mistakes and your judgment.
5. Optional classification experiment and its measured limitations.
6. Operations, accessibility, usability and performance evidence.
7. What remains unbuilt and the next constraint to investigate.

## Eight-week demo script

1. Sign in as an editor and capture a synthetic feedback signal.
2. Find it through filters, inspect it and manually classify it using the keyboard.
3. Edit it and inspect audit evidence; demonstrate a recoverable failure.
4. Show viewer write denial and cross-workspace denial.
5. If shipped, request a classification suggestion and accept or reject it; show manual fallback.
6. Trace one failure using correlated logs and explain recovery.
7. Show CI, measurements and an AI-generated mistake you corrected.

## Later MVP evidence

CSV import retry/partial rejection, opportunity grouping, scoring and decision history, queues and live progress belong to later milestones. They are not promised in the eight-week demo.

## Claim discipline

Never present synthetic benchmarks, seeded usage, planned features or internal walkthroughs as real customer results. Label environments, datasets, participants, methods and limitations. Do not claim AI productivity improvements without comparable measurement.
