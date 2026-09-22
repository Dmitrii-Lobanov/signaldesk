# Learning plan

## Purpose and positioning

Support the eight-week delivery milestones in [ROADMAP.md](ROADMAP.md). The near-term positioning is:

> Senior Frontend / Product Engineer who can independently deliver end-to-end TypeScript features using AI-assisted development.

Backend and AI claims must be supported by shipped behavior and independent explanation. AI-assisted engineering is required throughout; building an AI product feature is conditional.

## Stack and budget

Keep Next.js, NestJS, TypeScript and PostgreSQL, with TypeORM selected in [ADR 0003](decisions/0003-use-typeorm-for-persistence.md). Use REST/OpenAPI, an established authentication solution, meaningful integration/E2E tests, CI and deployment. Defer workers, Redis and live updates.

Allocate 15–20 hours weekly: 9–12 hours building and verification, 3–4 targeted learning, 1.5–2 independent debugging/explanation and interview practice, and 1.5–2 evidence. React practice fits within the independent-practice allocation rather than adding another curriculum. At lower availability, reduce scope or extend the timeline.

## Learning resources

Keep this index stable even when the weekly delivery sequence changes. Use only the chapters that unblock the active milestone.

### Courses

- [Learn Node.js](https://www.educative.io/courses/learn-node-js)
- [Getting Started with TypeScript ORM Libraries for Node.js](https://www.educative.io/courses/getting-started-with-typescript-orm-libraries-for-node-js)
- [Mastering PostgreSQL: From Basics to Advanced](https://www.educative.io/courses/mastering-postgre-sql-databases-from-basics-to-advanced)
- [Web Application Security for the Everyday Software Engineer](https://www.educative.io/courses/web-application-security-everyday-software-engineer)
- [Building Safer JavaScript Applications](https://www.educative.io/courses/building-safer-javascript-applications)
- [Simple Steps to Building Modern Applications with Docker](https://www.educative.io/courses/simple-building-modern-applications-docker)
- [Docker for Web Developers](https://www.educative.io/courses/docker-for-web-developers)
- [Building Full Stack Web Applications with Next.js](https://www.educative.io/courses/full-stack-web-applications-with-nextjs)

### Official documentation

- [Node.js documentation](https://nodejs.org/docs/latest/api/)
- [NestJS documentation](https://docs.nestjs.com/)
- [Next.js documentation](https://nextjs.org/docs)
- [Next.js authentication guidance](https://nextjs.org/docs/app/guides/authentication)
- [PostgreSQL documentation](https://www.postgresql.org/docs/current/)
- [TypeORM documentation](https://typeorm.io/docs/)
- [Docker documentation](https://docs.docker.com/)

## Eight-week learning sequence

| Week | Study only what unblocks delivery                                                                               | Independent exit test                                                                                   |
| ---- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1    | Node HTTP/async errors; Nest modules and validation; PostgreSQL schema/migrations; minimal deployment and CI    | Trace a form submission through API validation to persisted data and explain how it is deployed         |
| 2    | Authentication versus authorization; sessions/cookies or tokens; tenant-safe queries and relationships          | Explain and test why a direct API call cannot bypass workspace or viewer restrictions                   |
| 3    | API contracts; stable pagination; URL state; accessible forms and tables                                        | Diagnose a filter/pagination bug and complete classification using only a keyboard                      |
| 4    | Transactions; duplicate requests; stale updates; behavior-focused integration/E2E tests                         | Force a failure, explain rollback and demonstrate a safe retry                                          |
| 5    | If core gates pass: structured model outputs, prompt boundaries, held-out evaluations, latency/cost measurement | Explain a wrong suggestion and demonstrate validation and manual fallback; otherwise complete core gaps |
| 6    | Correlation IDs; privacy-aware logging; readiness; migrations, backups and recovery                             | Diagnose an injected failure and recover using the documented procedure                                 |
| 7    | Task-based usability sessions; accessibility; browser profiling or PostgreSQL query plans                       | Explain one observed problem and support a change or no-change decision with evidence                   |
| 8    | Technical communication; architecture trade-offs; reproducible demos                                            | Demonstrate the product and explain key backend and AI decisions without the agent                      |

For Week 5, use the selected model provider's official documentation for structured outputs, limits, data handling and pricing once the provider is chosen. Record the model and prompt versions used. No provider choice or course completion is required ahead of that milestone.

## AI-assisted practice every week

- Write requirements and acceptance criteria before prompting.
- Give one agent relevant context, constraints and repository commands; request small, reviewable changes.
- Inspect every diff, validate dependencies and review security-sensitive changes closely.
- Use synthetic examples and keep credentials and customer data out of prompts and logs.
- Test actual behavior; passing generated tests alone does not prove correctness.
- Spend an independent session explaining, modifying or debugging the result without agent help.
- Record agent contributions, mistakes, corrections and evidence in [LEARNING_LOG.md](LEARNING_LOG.md). Do not invent productivity gains.

## Competency evidence

By Week 8, independently design and ship a UI/API/database feature, prove workspace isolation, explain transaction and retry behavior, diagnose a failure through logs, deploy a migration with a recovery plan, and defend major technology choices. If the AI experiment ships, explain its evaluation limits and failure handling too.

Completing a course or deploying once is insufficient. Imports, jobs and broader MVP features are later learning opportunities, not completion requirements for this eight-week slice.
