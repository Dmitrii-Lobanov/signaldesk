# Full-stack skills plan

## Positioning objective

The near-term positioning is:

> Senior Frontend / Product Engineer who can independently deliver end-to-end TypeScript features.

The project should prove credible backend ownership without diluting the strongest evidence in React, TypeScript, product interfaces, architecture, and performance.

## Competency matrix

| Capability | Appropriate outcome | SignalDesk proof |
| --- | --- | --- |
| Node.js and HTTP | Explain runtime, async behavior, API lifecycle, errors, and timeouts | NestJS API and error contract |
| API design | Model resources, validation, pagination, idempotency, and versioning | OpenAPI contract and integration tests |
| PostgreSQL | Design normalized data, constraints, indexes, migrations, and transactions | Schema, query plans, and import transaction design |
| Authentication | Integrate a trusted solution and secure sessions | Documented flow and security tests |
| Authorization | Enforce tenant and role boundaries server-side | RBAC policy and cross-workspace tests |
| Async processing | Design idempotent jobs, retries, and observable failures | CSV import worker and job status UI |
| Testing | Balance unit, integration, contract, and E2E coverage | CI-enforced critical-path suite |
| Operations | Containerize, deploy, log, monitor, and diagnose | Preview environments and incident walkthrough |
| Product ownership | Convert ambiguous needs into scoped, measured outcomes | Brief, ADRs, usability tasks, and case study |

## Recommended learning resources

Use course chapters selectively when they unblock the current milestone:

- [Learn Node.js](https://www.educative.io/courses/learn-node-js)
- [Getting Started with TypeScript ORM Libraries for Node.js](https://www.educative.io/courses/getting-started-with-typescript-orm-libraries-for-node-js)
- [Mastering PostgreSQL](https://www.educative.io/courses/mastering-postgre-sql-databases-from-basics-to-advanced)
- [Web Application Security for the Everyday Software Engineer](https://www.educative.io/courses/web-application-security-everyday-software-engineer)
- [Building Modern Applications with Docker](https://www.educative.io/courses/simple-building-modern-applications-docker)
- [Building Full Stack Web Applications with Next.js](https://www.educative.io/courses/full-stack-web-applications-with-nextjs)

Official framework and database documentation remains the source of truth during implementation.

## Readiness criteria

The end-to-end claim becomes defensible when you can, without following a tutorial:

- Design and ship a new feature across UI, API, and database.
- Explain trust boundaries and prove tenant isolation with tests.
- Diagnose a slow request using browser, API, and database evidence.
- Recover safely from a failed or duplicated background job.
- Deploy a migration and explain rollback or forward-recovery strategy.
- Trace a user-visible failure through logs and correlation identifiers.
- Explain why each major technology exists and what simpler option was rejected.

## Interview narrative

Use a concise ownership story:

1. **Problem:** feedback was fragmented and prioritization lacked traceable evidence.
2. **Decision:** deliver a narrow feedback-to-decision workflow with explicit tenant and reliability boundaries.
3. **Execution:** own accessible React workflows, API contracts, persistence, async imports, tests, and operations.
4. **Evidence:** demonstrate measurements, failure recovery, security tests, and documented trade-offs.
5. **Reflection:** identify what would change at higher scale and what deliberately remained out of scope.
