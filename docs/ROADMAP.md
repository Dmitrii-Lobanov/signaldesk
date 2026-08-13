# Ten-week roadmap

The default budget is approximately **10 hours each week**: 3 hours learning, 5 hours product delivery, 1.5 hours React live-coding practice, and 0.5 hours evidence and reflection. Courses are supporting material; working software and explained trade-offs are the output.

| Week | Full-stack focus | SignalDesk outcome | Live-coding component | Evidence |
| --- | --- | --- | --- | --- |
| 1 | Node and HTTP boundaries | Product brief, architecture, monorepo, health endpoint | Accessible modal | ADR and API walkthrough |
| 2 | NestJS modules and validation | Workspace, membership, and feedback API | Multi-step form | Validation and authorization tests |
| 3 | PostgreSQL and Prisma | Schema, migrations, seed data, feedback queries | Sortable data table | Query plans and data-model notes |
| 4 | Authentication and authorization | Sign-in integration and workspace RBAC | Reusable tabs | Cross-tenant security test suite |
| 5 | Next.js integration | Feedback inbox, details, filters, URL state | Accessible autocomplete | Complete vertical-slice demo |
| 6 | Mutation reliability | Create/edit flows, optimistic updates, audit events | Toast system | Failure and rollback demo |
| 7 | Imports and async work | CSV import, row errors, job status | Infinite scrolling feed | Idempotency and retry tests |
| 8 | Testing and accessibility | Critical E2E journeys and keyboard audit | File explorer tree | CI results and accessibility report |
| 9 | Performance and observability | Representative dataset, profiling, logging, monitoring | Async resource explorer | Before/after measurements |
| 10 | Deployment and product narrative | Production demo, case study, demo script, backlog review | Reorderable list | Published case study and retrospective |

## Weekly operating loop

1. Pick one user-visible outcome and one engineering risk.
2. Write acceptance criteria and the smallest architecture decision needed.
3. Build a standalone React exercise under interview time pressure.
4. Rebuild it to production quality inside SignalDesk when it genuinely fits.
5. Add tests, failure states, accessibility, and instrumentation.
6. Record what changed, what was measured, and what remains uncertain.

## Scope rules

- If a week slips, reduce features before reducing verification.
- Do not add AI classification until the manual workflow is usable.
- Do not add Redis, queues, or WebSockets before their failure modes are understood.
- Do not claim senior full-stack positioning merely because the app deploys; use the readiness criteria in the skills plan.
