# Portfolio evidence plan

## What a hiring manager should be able to verify

- The product solves a coherent customer and business problem.
- The UI handles complex data and workflows without sacrificing accessibility.
- Frontend architecture is connected to API, data, and operational constraints.
- Security, failure recovery, and observability are implemented rather than mentioned.
- Performance claims include reproducible measurements.
- Important decisions include alternatives and consequences.

## Evidence checklist

- Public production demo with a safe seeded workspace.
- Two-minute product video and five-minute technical walkthrough.
- Architecture diagram and data-model diagram that match the code.
- At least five meaningful ADRs.
- CI results covering types, linting, tests, and build.
- Accessibility report for critical workflows.
- One frontend and one backend/database performance investigation.
- Failure demo: duplicate import, partial rejection, retry, and recovery.
- Security demo: viewer restriction and cross-workspace access denial.
- Product case study with problem, constraints, decisions, measures, and reflection.

## Case-study outline

1. The customer-feedback problem and target user.
2. The narrow workflow selected for the MVP.
3. The hardest product interaction and its alternatives.
4. The tenant, authorization, and data-integrity model.
5. Import reliability and observable failure handling.
6. Performance diagnosis with before/after evidence.
7. Accessibility and testing strategy.
8. What was deliberately not built.
9. What user testing changed.
10. What the next engineer should know.

## Demo script

1. Enter as an editor in a seeded workspace.
2. Import a CSV containing valid, invalid, and duplicate rows.
3. Continue working while import progress updates.
4. Filter and classify signals from the keyboard.
5. Group evidence into an opportunity and inspect source context.
6. Change role to viewer and demonstrate protected mutations.
7. Record a decision and inspect the audit history.
8. Show logs or traces for one request and one job.

## Claim discipline

Never present seeded usage, synthetic benchmarks, or planned features as real customer results. Label the dataset, environment, measurement method, and limitations.
