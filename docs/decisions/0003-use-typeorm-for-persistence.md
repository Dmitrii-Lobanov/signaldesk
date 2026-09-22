# ADR 0003: Use TypeORM for PostgreSQL persistence

- Status: accepted
- Date: 2026-09-22

## Context

SignalDesk needs PostgreSQL persistence for the Week 1 feedback capture-and-list workflow. The API needs reviewed migrations, synthetic seed data, and database access that fits the NestJS module and dependency-injection model.

The current backend course work uses PostgreSQL and TypeORM repositories with NestJS. Using the same approach allows the course material to reinforce the implementation while still requiring independent review and verification.

## Decision

Use TypeORM with PostgreSQL for persistence in the NestJS API.

Use Data Mapper-style repositories injected into application services. Manage schema changes through reviewed migrations and keep automatic schema synchronization disabled.

Define only the workspace and feedback entities required for the current workflow. Validate incoming HTTP requests with DTOs and validation pipes rather than relying on TypeORM entities for request validation.

## Alternatives considered

- Prisma: offers generated types and a convenient migration workflow, but requires a separate schema and does not align as directly with the current NestJS course material.
- Raw SQL with a migration tool: provides direct database control, but adds query mapping and infrastructure beyond what the first vertical slice requires.
- Drizzle: offers type-safe, SQL-oriented access, but introduces another API to study without improving the current learning outcome.

## Consequences

- TypeORM integrates with NestJS modules and dependency injection through `@nestjs/typeorm`.
- Repository patterns learned in the course can be applied and evaluated in SignalDesk.
- Entity decorators keep persistence definitions in TypeScript.
- Migration configuration and commands require additional setup, especially with ESM.
- TypeORM abstractions do not remove the need to understand constraints, indexes, transactions, or generated SQL.
- `synchronize` must remain disabled; schema changes must use reviewed migrations.

## Validation

The decision remains appropriate if Week 1 can generate and review a migration, seed synthetic data, persist feedback, retrieve it after an API restart, and keep database behavior understandable. Revisit the choice if migration tooling or TypeORM’s abstractions create disproportionate complexity.