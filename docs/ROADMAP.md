# Eight-week portfolio roadmap

## Goal and budget

Demonstrate independent end-to-end TypeScript delivery with disciplined AI-assisted engineering through one deployed SignalDesk workflow. This is a portfolio and learning target, not a guarantee of employment or senior backend competence.

Budget **15–20 hours per week** for eight weeks (120–160 hours total): 60% building and verification, 20% targeted learning, 10% independent explanation/debugging and interview practice, and 10% portfolio evidence. At 10 hours per week, reduce scope or extend the schedule; do not assume AI removes the difference. Keep job-search activity running alongside delivery.

This roadmap controls scope and order. [LEARNING_PLAN.md](LEARNING_PLAN.md) supplies milestone-specific study. Tests and applicable [quality checks](QUALITY_BAR.md) accompany implementation every week.

## Required outcome

An authenticated editor can capture, find, inspect, manually classify and edit feedback in a seeded workspace. A viewer cannot mutate it, and no user can access another workspace's data. Important changes have transactional audit evidence. The workflow is deployed, keyboard accessible, tested, monitored and explainable by its author.

AI-assisted development is required throughout. An AI classification feature is a conditional Week 5 experiment, not a prerequisite for completing the portfolio slice.

## Week 1 — First deployed slice

**Outcome:** submit feedback through the web interface and retrieve it after a service restart.

- Create the minimal Next.js/NestJS workspace and PostgreSQL setup; decide the ORM in an ADR before persistence work. Prisma remains the proposed choice.
- Add reviewed migrations and synthetic seeds with workspace-aware feedback records. Introduce only the schema needed now; add membership and roles in Week 2.
- Implement validated create/list endpoints, a minimal OpenAPI contract, and form/list loading, empty, success and error states.
- Set up type checks, linting, meaningful tests and builds in CI. Document environment configuration and local startup.
- Deploy web, API and database to a protected development environment. Until application authentication exists, protect both web and API at the hosting/access layer; an obscure URL is insufficient. Use synthetic data only.

**Gate:** the deployed browser-to-API-to-database path works; data survives restart; CI passes; the development deployment cannot be accessed publicly without its protection.

## Week 2 — Authentication and workspace isolation

**Outcome:** editors and viewers can access only their authorized workspace and actions.

- Record the authentication/session and Next.js-to-NestJS credential boundary in an ADR; use an established authentication library or provider.
- Add seeded memberships and editor/viewer policies, enforced by the API on every protected read and mutation.
- Enforce tenant-safe relationships and validate linked identifiers, not just top-level workspace IDs.
- Add sign-in/out, expired-session and access-denied behavior; preserve entered data where practical.
- Test against an isolated real PostgreSQL database, including direct API attempts to bypass UI restrictions.

**Gate:** unauthenticated access, viewer writes, cross-workspace reads/writes and cross-workspace relationships are rejected. Public access remains disabled until these checks pass.

## Week 3 — Usable feedback inbox

**Outcome:** capture, find, inspect and manually classify feedback from the keyboard.

- Add feedback detail, product area and tags with workspace-scoped validation.
- Add essential filters and deterministic pagination with a stable sort; preserve filter state in the URL.
- Generate or derive frontend types from the API contract without maintaining duplicate domain models.
- Complete validation, loading, empty, error, success and permission states with semantic controls and accessible announcements.

**Gate:** refresh/back/forward preserve filters; tested pagination has no duplicated or missing rows; a keyboard-only user completes the capture-and-classify workflow.

## Week 4 — Reliable changes

**Outcome:** edit feedback and inspect who changed it without ambiguous or partial writes.

- Write important mutations and their audit events atomically in one database transaction.
- Make one retry-prone command safe against duplicate submissions; handle stale edits explicitly.
- Preserve form input and show recoverable failures; avoid optimistic UI unless rollback is designed.
- Add integration tests for failed writes, duplicate submission and stale edits, plus one critical end-to-end journey.

**Gate:** forced audit-write failure leaves neither a partial mutation nor an audit event; a retry does not duplicate successful work; a successful change has traceable audit evidence.

**Scope checkpoint:** if Weeks 1–4 are not stable, use Week 5 to finish them and defer AI classification. Do not trade authorization or data integrity for feature breadth.

## Week 5 — Conditional AI classification experiment

**Outcome:** request suggested product area/tags, then explicitly accept, edit or reject them.

- First create a small labeled synthetic evaluation set, for example 30–50 varied signals, including ambiguous and adversarial text. Separate tuning examples from held-out evaluation cases.
- Call one model through a server-side adapter using authorized workspace context and bounded inputs. No agents, vector store or queue is required.
- Treat feedback as untrusted data; validate structured output and allow only workspace-owned classification values.
- Suggestions cannot mutate classification. Acceptance goes through the normal authorized, audited mutation path and checks for stale feedback.
- Add timeouts, request limits, error recovery and manual fallback. Record model/prompt versions, quality results, latency and estimated cost with measurement conditions.

**Gate:** report product-area accuracy and tag precision/recall on held-out cases, including failures; demonstrate rejection of incorrect suggestions, invalid outputs and provider outage. Manual classification remains usable. Record an explicit ship/defer decision based on results rather than claiming general accuracy from a small dataset.

**Fallback:** if the core is unfinished or suggestions are not useful, document the finding and ship the manual workflow. AI-assisted development evidence still applies.

## Week 6 — Operational confidence

**Outcome:** locate and recover from a user-visible failure.

- Add correlated structured logs, frontend/backend error monitoring and justified request limits; exclude raw feedback, credentials and sensitive content.
- Distinguish liveness from readiness and verify required dependencies.
- Document and rehearse deployment, migrations, backup/restore and rollback or forward recovery using development data.
- Trace an intentional failure through UI and API to its dependency and recovery. Review secrets and deployment settings.

**Gate:** another developer can follow startup and recovery instructions; one incident walkthrough links symptoms, correlated evidence, cause and recovery.

## Week 7 — User feedback and hardening

**Outcome:** validate that the core workflow is understandable and usable.

- Run task-based sessions with 2–3 people and label participants and synthetic data honestly. If unavailable, report that limitation and use a structured walkthrough without claiming user validation.
- Fix the highest-impact usability issues; perform manual keyboard and accessibility checks.
- Investigate one frontend or API/database performance question on a documented dataset. Optimize only when evidence supports it; record before/after conditions if changed.
- Recheck critical journeys and negative authorization tests after fixes.

**Gate:** publish observations, resulting decisions, accessibility findings and one reproducible performance investigation. Outstanding limitations remain visible.

## Week 8 — Portfolio and interviews

**Outcome:** a reviewer can try the product and assess end-to-end ownership.

- Stabilize a public demo using isolated synthetic data, constrained demo accounts, sensible limits and a documented reset strategy. Keep provider credentials and administrative access private.
- Align README status, architecture, data model, backlog and documentation with shipped behavior.
- Record a two-minute product demo and concise technical walkthrough; write a case study covering decisions, failures, measurements and limitations.
- Publish at least two AI-assisted development examples showing agent output, your corrections and verification, with sensitive information removed.
- Practice explaining authorization, transactions, deployment and an unfamiliar failure without relying on the coding agent. Continue targeted applications and use the demo in interviews.

**Gate:** public demo and clean setup work; applicable CI checks pass; required evidence in [PORTFOLIO_EVIDENCE.md](PORTFOLIO_EVIDENCE.md) is reviewable; planned functionality is clearly separated from shipped functionality.

## Weekly AI-assisted engineering loop

1. Write the user outcome, constraints and acceptance criteria yourself.
2. Give one coding agent relevant repository context and ask for a bounded plan.
3. Review assumptions, delegate small changes and inspect every diff.
4. Verify with behavior tests and manual checks, especially authorization and data integrity.
5. Explain and modify the result independently; record one useful contribution and one error/correction in [LEARNING_LOG.md](LEARNING_LOG.md).

Use the same agent consistently to develop a repeatable workflow. Courses and tool exploration should unblock the active milestone, not delay shipping.

## Deferred scope

CSV imports, queues/Redis/BullMQ, live updates, clustering, opportunity scoring, full decision history, advanced analytics and elaborate membership administration remain post-slice work. Add complexity only for demonstrated needs. Keep the existing Next.js/NestJS/PostgreSQL direction; do not rebuild the stack for the AI-native label.
