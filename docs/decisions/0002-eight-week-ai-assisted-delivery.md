# ADR 0002: Focus on eight-week AI-assisted delivery

- Status: accepted
- Date: 2026-09-17
- Updates: the delivery horizon and scope established after ADR 0001; the documentation-first principle remains in effect.

## Context

The goal is to extend existing senior frontend experience into demonstrable end-to-end engineering with AI in two months. The earlier ten-week plan budgeted 10 hours weekly and required CSV imports while leaving AI practice implicit.

## Decision

Use eight weeks at 15–20 hours per week. Retain Next.js, NestJS, TypeScript and PostgreSQL. Move persistence and protected deployment to Week 1 and authentication/tenant isolation to Week 2. Focus on capture, retrieval, manual classification, reliable editing and audit evidence. Integrate reviewed AI-assisted development and independent explanation every week.

Make Week 5 classification suggestions conditional on passing core gates, with human approval, evaluations and fallback. Defer CSV imports, queues, live updates, clustering, scoring and elaborate membership administration. Preserve the original ADR as a historical record.

## Alternatives

- Compress the entire previous plan: adds delivery risk and leaves little verification time.
- Replace the stack or build a new project: discards relevant work without improving the evidence target.
- Require an AI feature regardless of readiness: risks weakening core correctness and confusing AI tool use with product capability.

## Consequences and validation

The time commitment rises to 120–160 hours total. Lower availability requires reduced scope or a longer timeline. Completion means a deployed, tested and explainable workflow plus evidence of AI-assisted judgment, not guaranteed employment or senior full-stack expertise. The Week 4 checkpoint determines whether the AI product experiment proceeds. Week 8 review uses the portfolio evidence checklist and explicit limitations.
