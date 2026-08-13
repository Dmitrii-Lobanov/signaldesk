# Learning plan

## Purpose and positioning

This plan supports the delivery milestones in [ROADMAP.md](ROADMAP.md). The roadmap controls implementation order; this document identifies the concepts, resources, practice, and exit tests needed for the active milestone. Courses do not justify building infrastructure before the product needs it.

The near-term positioning is:

> Senior Frontend / Product Engineer who can independently deliver end-to-end TypeScript features.

SignalDesk should prove credible backend ownership without implying senior full-stack competence before the repository contains evidence for that claim.

## Target technical direction

- TypeScript and Node.js
- Next.js as the web application
- NestJS as the API
- PostgreSQL with Prisma as the proposed persistence stack
- REST documented with OpenAPI
- Authentication and server-enforced role and workspace authorization
- Vitest, React Testing Library, API integration tests, contract checks, and a small Playwright suite
- Docker, Docker Compose, CI, deployment, structured logs, monitoring, and deterministic error handling
- Background jobs and live progress only when measurements justify them; BullMQ and SSE are candidates, while WebSockets are optional

Prisma remains proposed until an ADR compares it with TypeORM and direct SQL for SignalDesk's requirements. Next.js initially consumes the NestJS API as the web application; Route Handlers are not a default proxy or BFF layer.

## Weekly budget

The default budget is approximately 10 hours:

- 2.5 hours of targeted courses and official documentation
- 5.5 hours of product implementation and verification
- 1 hour of React interview practice connected to the milestone
- 1 hour of ADRs, evidence, and reflection

Testing is part of implementation, not postponed to the final documentation hour.

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
- [Prisma documentation](https://www.prisma.io/docs)
- [Docker documentation](https://docs.docker.com/)

## Operating rules

For each milestone:

1. Define one user outcome and one primary engineering risk.
2. Read only the material needed to address that risk.
3. Complete an interview-sized React exercise when it reinforces the milestone.
4. Implement a narrow web-to-API-to-data slice where the milestone requires it.
5. Verify applicable accessibility, security, reliability, and operational concerns.
6. Complete the exit test without following a tutorial.
7. Record evidence, limitations, and concepts that are not yet interview-defensible in [LEARNING_LOG.md](LEARNING_LOG.md).

## Ten-week learning sequence

### Week 1: Node, HTTP, and NestJS foundations

Learning sources:

- [Learn Node.js](https://www.educative.io/courses/learn-node-js)
- Official [Node.js documentation](https://nodejs.org/docs/latest/api/)
- Official [NestJS first steps](https://docs.nestjs.com/first-steps), [controllers](https://docs.nestjs.com/controllers), and [OpenAPI](https://docs.nestjs.com/openapi/introduction) documentation
- Official [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) documentation

Learn:

- Node.js event loop, promises, error propagation, configuration, and graceful shutdown
- HTTP request lifecycle, REST status codes, CORS, and failure categories
- NestJS modules, controllers, providers, configuration, testing, and OpenAPI basics
- Next.js server/client boundaries for a small API-dependent status UI

Build:

- Minimal monorepo with Next.js and NestJS
- Liveness endpoint and generated OpenAPI document
- Accessible web status with loading, success, failure, and retry behavior
- Root type, lint, test, and build commands

Exit test: explain the health request from browser to NestJS response, where it can fail, why CORS is not authorization, and why liveness does not necessarily depend on PostgreSQL.

### Week 2: API boundaries and deterministic behavior

Learning sources:

- Selected HTTP, asynchronous programming, and error-handling sections from [Learn Node.js](https://www.educative.io/courses/learn-node-js)
- Official NestJS documentation for [validation](https://docs.nestjs.com/techniques/validation), [exception filters](https://docs.nestjs.com/exception-filters), and [testing](https://docs.nestjs.com/fundamentals/testing)
- Official [OpenAPI operations](https://docs.nestjs.com/openapi/operations) documentation

Learn:

- DTO validation, exception filters, structured error responses, pagination, filtering, and request identifiers
- Thin controllers and use-case-oriented services

Build:

- In-memory feedback creation and listing API
- Minimal feedback list in the web application
- Validation, deterministic ordering, pagination, structured errors, and API-level tests

Exit test: add one endpoint without changing unrelated modules and explain validation, error propagation, pagination stability, and test boundaries.

### Weeks 3–4: PostgreSQL and data correctness

Learning sources:

- [Getting Started with TypeScript ORM Libraries for Node.js](https://www.educative.io/courses/getting-started-with-typescript-orm-libraries-for-node-js)
- [Mastering PostgreSQL: From Basics to Advanced](https://www.educative.io/courses/mastering-postgre-sql-databases-from-basics-to-advanced)
- Official PostgreSQL documentation for [indexes](https://www.postgresql.org/docs/current/indexes.html), [query plans](https://www.postgresql.org/docs/current/using-explain.html), and [concurrency control](https://www.postgresql.org/docs/current/mvcc.html)
- Official Prisma documentation for [data modelling](https://www.prisma.io/docs/orm/prisma-schema/data-model), [migrations](https://www.prisma.io/docs/orm/prisma-migrate), and [transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)

Learn and build:

- Relational modelling, keys, constraints, joins, migrations, and seed data
- Workspace, membership, customer, and feedback persistence
- Transactional multi-table operations
- Cursor pagination and N+1 avoidance
- One indexed query with representative before/after `EXPLAIN ANALYZE` evidence
- Migration forward-recovery considerations

Exit test: explain why each relationship, constraint, transaction boundary, and index exists, including what must happen atomically and how an unsafe migration would recover.

### Week 5: Authentication, authorization, and security

Learning sources:

- [Web Application Security for the Everyday Software Engineer](https://www.educative.io/courses/web-application-security-everyday-software-engineer)
- [Building Safer JavaScript Applications](https://www.educative.io/courses/building-safer-javascript-applications)
- [Next.js authentication guidance](https://nextjs.org/docs/app/guides/authentication)
- Official NestJS documentation for [authentication](https://docs.nestjs.com/security/authentication), [authorization](https://docs.nestjs.com/security/authorization), [CORS](https://docs.nestjs.com/security/cors), and [rate limiting](https://docs.nestjs.com/security/rate-limiting)

Learn and implement:

- Authentication through a reputable library or provider
- Session or token lifecycle and secure cookie handling
- NestJS guards and server-enforced role and workspace authorization
- Ownership checks, rate limiting where justified, CORS, and security headers
- Negative integration tests for unauthorized, forbidden, and cross-workspace access

Exit test: demonstrate that a user cannot read or mutate another workspace by calling the API directly, and explain authentication, authorization, ownership, and CORS.

### Week 6: Product web integration

Learning sources:

- [Building Full Stack Web Applications with Next.js](https://www.educative.io/courses/full-stack-web-applications-with-nextjs)
- Official Next.js documentation for [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components), [data fetching](https://nextjs.org/docs/app/getting-started/fetching-data), and [forms](https://nextjs.org/docs/app/guides/forms)
- Official NestJS [OpenAPI](https://docs.nestjs.com/openapi/introduction) documentation

Learn and implement:

- Server and Client Component boundaries
- Feedback capture and inbox with URL-backed filters
- Accessible forms, table semantics, keyboard workflows, and resilient request states
- OpenAPI-generated or derived frontend contracts without manually duplicated domain models

Exit test: trace one feedback workflow through UI, validation, authorization, persistence, response handling, and user-visible failure recovery.

### Week 7: Mutation reliability

Learning sources:

- Selected error, timeout, and asynchronous-flow sections from [Learn Node.js](https://www.educative.io/courses/learn-node-js)
- Selected transaction and concurrency modules from [Mastering PostgreSQL: From Basics to Advanced](https://www.educative.io/courses/mastering-postgre-sql-databases-from-basics-to-advanced)
- Official PostgreSQL documentation for [transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html) and [explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- Official NestJS documentation for [interceptors](https://docs.nestjs.com/interceptors) and [exception filters](https://docs.nestjs.com/exception-filters)
- Official Prisma [transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions) documentation

Learn and implement:

- Idempotency for one retry-prone command
- Transactions for audit events and domain mutations
- Duplicate submissions, concurrent updates, timeouts, and stale data
- Consistent structured errors and correlation identifiers

Minimum important cases include unauthorized, forbidden, invalid request, not found, duplicate submission, concurrent update, dependency unavailable, and success.

Exit test: demonstrate a duplicate or stale mutation and explain how the system preserves data integrity and enables diagnosis.

### Week 8: Test hardening and operational packaging

Learning sources:

- [Simple Steps to Building Modern Applications with Docker](https://www.educative.io/courses/simple-building-modern-applications-docker)
- Node-related sections from [Docker for Web Developers](https://www.educative.io/courses/docker-for-web-developers)
- Official [Docker documentation](https://docs.docker.com/) and [Compose documentation](https://docs.docker.com/compose/)
- Official NestJS [testing](https://docs.nestjs.com/fundamentals/testing) documentation
- Official Next.js [testing guides](https://nextjs.org/docs/app/guides/testing)

Deliver:

- Integration tests against an isolated real PostgreSQL database
- Contract coverage and one critical Playwright journey
- Dockerfile and Docker Compose for the currently implemented system
- CI checks for types, lint, tests, and builds
- Separate liveness and readiness behavior where appropriate
- Documented migration and recovery procedure

Exit test: another developer can clone the repository, run the implemented system, execute its tests, and understand how database state is isolated.

### Week 9: Import reliability and observability

Learning sources:

- Selected streams, error propagation, and process-reliability sections from [Learn Node.js](https://www.educative.io/courses/learn-node-js)
- Selected transaction and data-correctness modules from [Mastering PostgreSQL: From Basics to Advanced](https://www.educative.io/courses/mastering-postgre-sql-databases-from-basics-to-advanced)
- Official NestJS documentation for [logging](https://docs.nestjs.com/techniques/logger), [queues](https://docs.nestjs.com/techniques/queues), and [Server-Sent Events](https://docs.nestjs.com/techniques/server-sent-events)
- Official PostgreSQL [transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html) documentation

Start with a synchronous CSV import and representative limits. Introduce a queue or worker only if duration, retry, or isolation requirements justify the boundary.

Implement:

- Preview and row validation
- Stable row identity, partial rejection, and safe retry behavior
- Structured logs with request identifiers and privacy-conscious context
- Error tracking and basic workflow metrics
- Polling or SSE for progress only if the import becomes asynchronous

Exit test: recover from invalid and duplicate rows without repeating successful work, then trace one failure across UI, API, database, and logs.

### Week 10: Performance, deployment, and narrative

Learning sources:

- Relevant deployment modules from [Building Full Stack Web Applications with Next.js](https://www.educative.io/courses/full-stack-web-applications-with-nextjs)
- Relevant production modules from [Simple Steps to Building Modern Applications with Docker](https://www.educative.io/courses/simple-building-modern-applications-docker) or [Docker for Web Developers](https://www.educative.io/courses/docker-for-web-developers)
- Selected query-analysis modules from [Mastering PostgreSQL: From Basics to Advanced](https://www.educative.io/courses/mastering-postgre-sql-databases-from-basics-to-advanced)
- Official Next.js documentation for [production](https://nextjs.org/docs/app/guides/production-checklist) and [self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- Official PostgreSQL documentation for [`EXPLAIN`](https://www.postgresql.org/docs/current/using-explain.html)
- Official Docker documentation for [building images](https://docs.docker.com/build/) and [production use of Compose](https://docs.docker.com/compose/how-tos/production/)

Deliver:

- Production or production-like deployment of the ten-week portfolio slice
- One frontend and one API/database investigation using representative data
- Documented rollback or forward-recovery procedure
- Incident walkthrough, accessibility review, demo script, and concise case study
- Backlog review separating shipped evidence from later MVP work

Exit test: demonstrate the product slice and explain its product problem, architecture, data model, authorization, failure recovery, measurements, limitations, and next scaling constraint.

## Optional continuation

Use later weeks for product completion or justified depth:

- Opportunity grouping, prioritization, and decision history
- Saved views and broader analytics
- BullMQ worker and bounded retries
- SSE progress delivery
- Optimistic concurrency and idempotency keys on additional workflows
- Load testing, query optimization, CI/CD improvements, and AI-assisted classification experiments

Do not add Redis, background workers, WebSockets, or AI merely to expand the technology list.

## Competency evidence

The end-to-end claim becomes defensible when you can, without following a tutorial:

- Design and ship a feature across UI, API, and database.
- Explain trust boundaries and prove tenant isolation with tests.
- Diagnose a slow request using browser, API, and database evidence.
- Recover safely from a failed or duplicated import or job.
- Deploy a migration and explain rollback or forward recovery.
- Trace a user-visible failure through correlation identifiers and logs.
- Explain why every major technology exists and which simpler alternative was rejected.

Completing a course or deploying once is not sufficient evidence by itself.
