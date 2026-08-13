# Plan

## Target stack
* TypeScript
* Node.js
* NestJS
* PostgreSQL
* Prisma or TypeORM — choose one
* REST APIs
* Authentication and role-based authorization
* Background jobs and WebSockets
* Jest/Vitest and API integration tests
* Docker and Docker Compose
* Deployment, logs, monitoring and error handling
* Next.js as the frontend/BFF layer

## Week schedule
* 3 hours: structured courses and documentation
* 6 hours: build or extend one serious application
* 1 hour: document decisions, diagrams, trade-offs and results

## Recommended 10-week plan

### Weeks 1–2: Node.js and HTTP foundations
Complete [Learn Node.js](https://www.educative.io/courses/learn-node-js).

Focus on:
* Event loop and non-blocking I/O
* Promises and error propagation
* HTTP request lifecycle
* REST conventions and status codes
* Configuration and environment variables
* Streams only at a conceptual level
* Graceful shutdown
* Structured error handling

Build:
* A small TypeScript API
* Validation
* Centralized errors
* Pagination and filtering
* Structured logging
* Unit and API-level tests

Exit test: you can explain what happens from an incoming HTTP request to the database response, including where failures may occur.

### Weeks 3–4: PostgreSQL and data correctness
Use selected modules from:
* [Getting Started with TypeScript ORM Libraries for Node.js](https://www.educative.io/courses/getting-started-with-typescript-orm-libraries-for-node-js)
* [Mastering PostgreSQL: From Basics to Advanced](https://www.educative.io/courses/mastering-postgre-sql-databases-from-basics-to-advanced)

Study:
* Relational modelling
* Primary and foreign keys
* Unique and check constraints
* Joins and aggregates
* Migrations
* Transactions
* Indexes
* Pagination
* N+1 query problems
* EXPLAIN ANALYZE
The official PostgreSQL documentation is particularly useful for [indexes](https://www.postgresql.org/docs/current/indexes.html), [query plans](https://www.postgresql.org/docs/current/using-explain.html) and [concurrency control](https://www.postgresql.org/docs/current/mvcc.html).
Choose either Prisma or TypeORM. 

Build:
* A real schema with users, workspaces, memberships, roles and domain entities
* Transactional multi-table operations
* Constraints that prevent invalid data
* Seed data and migrations
* An indexed query with before/after query-plan evidence

Exit test: you can explain why each relationship and index exists and what must happen atomically.

### Week 5: Authentication, authorization and security

Use one of these:
* [Web Application Security for the Everyday Software Engineer](https://www.educative.io/courses/web-application-security-everyday-software-engineer)
* [Building Safer JavaScript Applications](https://www.educative.io/courses/building-safer-javascript-applications)

Implement:
* Secure authentication using a reputable library/provider
* Session or token lifecycle
* Role-based authorization
* Ownership checks
* Input validation
* Rate limiting
* Secure cookies
* CORS and security headers
* Protection against SQL injection and accidental data exposure

Do not confuse authentication with authorization. Every sensitive operation must verify both identity and permission. Next.js’s current guidance also recommends treating Route Handlers and Server Actions as public endpoints requiring authorization checks. [Next.js authentication guidance](https://nextjs.org/docs/app/guides/authentication)

Exit test: you can demonstrate that one user cannot read or mutate another workspace’s data—even by directly calling the API.

### Week 6: NestJS application structure
Use the official NestJS documentation alongside your project.

Learn and implement:
* Modules, controllers and providers
* Dependency injection
* DTO validation
* Guards and interceptors
* Exception filters
* Configuration
* Repository/service boundaries
* API documentation
* Testing modules

Do not create abstractions merely because NestJS permits them. Your architecture should make feature ownership and testing easier.

Exit test: you can add a new feature without modifying unrelated modules or creating circular dependencies.

### Week 7: Testing and reliability

Implement:
* Unit tests for domain logic
* Integration tests against a real test database
* API tests for authentication, authorization and failure cases
* Database isolation or cleanup
* Timeouts and retry policies for external calls
* Idempotency for an important mutation
* Consistent error responses

Your minimum important test cases:
* Unauthorized
* Forbidden
* Invalid request
* Resource not found
* Duplicate submission
* Concurrent update
* Dependency unavailable
* Successful path

Do not learn Playwright specifically for this plan unless you want browser-level E2E testing. Backend credibility comes first from API integration testing and data correctness.

### Week 8: Docker, deployment and observability

Complete [Simple Steps to Building Modern Applications with Docker](https://www.educative.io/courses/simple-building-modern-applications-docker) or selected Node-related parts of [Docker for Web Developers](https://www.educative.io/courses/docker-for-web-developers).

Deliver:
* Backend Dockerfile
* Docker Compose for API and PostgreSQL
* Health/readiness endpoint
* Automated database migrations
* CI checks
* Production deployment
* Structured logs with request IDs
* Error tracking
* Basic performance and availability metrics
* Documented rollback procedure

Exit test: another developer can clone the repository and run the complete system from your README.

### Weeks 9–10: End-to-end product ownership

Use selected modules from [Building Full Stack Web Applications with Next.js](https://www.educative.io/courses/full-stack-web-applications-with-nextjs). It covers modern App Router, Server Components, Route Handlers, Server Actions, middleware and authentication.

Integrate your React/Next.js frontend with the backend and complete one meaningful workflow:

User action
→ validation
→ authorization
→ domain operation
→ transaction
→ response
→ optimistic/pessimistic UI update
→ logging and monitoring

Add one production-style feature:
* Real-time collaboration
* Background job with retry handling
* File processing
* Notifications
* Audit history
* Import/export workflow
* Third-party API integration with failure recovery

Then publish a concise case study explaining:
* Product problem
* Constraints
* Architecture
* Data model
* Authorization model
* Reliability risks
* Testing strategy
* Deployment
* Trade-offs
* What you would change at higher scale

### Optional weeks 11–12
Use these weeks for depth rather than new technologies:
* Redis caching
* Background jobs
* WebSockets
* Optimistic concurrency
* Idempotency keys
* Load testing
* Query optimization
* CI/CD improvements
* AI API integration with streaming, usage limits and failure handling
