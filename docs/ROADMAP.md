# Ten-week portfolio roadmap

The default budget is approximately **10 hours each week**: 2.5 hours targeted learning, 5.5 hours product implementation and verification, 1 hour React live-coding practice, and 1 hour evidence and reflection. Testing remains part of implementation.

This roadmap controls delivery order. [LEARNING_PLAN.md](LEARNING_PLAN.md) supplies the concepts, resources, and exit tests needed for each milestone. The ten-week target is a credible portfolio slice; the complete MVP may continue afterward.

## Portfolio outcome after ten weeks

An authenticated editor can enter a seeded workspace, create and find customer feedback, import a bounded CSV containing valid, invalid, and duplicate rows, recover from failures without duplicating accepted data, and inspect audit evidence for an important change. A viewer cannot mutate data, and neither role can access another workspace. The workflow is accessible, tested, deployed, and diagnosable through correlated logs.

The following may continue after Week 10 rather than being rushed:

- Complete invitation and membership administration.
- Saved views and advanced bulk workflows.
- Similarity suggestions and evidence clustering.
- Opportunity scoring, prioritization, and full decision history.
- Broad analytics, background processing, and live progress delivery.

## Week 1 — Executable web-to-API foundation

**User outcome:** a visitor can open SignalDesk and see whether the application service is available, including a recoverable unavailable state.

**Primary engineering risk:** the repository and HTTP boundary become complicated before they prove one working interaction.

### Backend

- Create the NestJS application inside the minimal monorepo.
- Add `GET /health` as a liveness endpoint with a stable `{ "status": "ok" }` response.
- Generate an OpenAPI document containing the health operation.
- Configure environment validation, an exact local web origin for CORS, and graceful shutdown.
- Add an HTTP-level test for the successful health response.

### Frontend

- Create the Next.js application and a minimal semantic SignalDesk shell.
- Request the NestJS health endpoint through a documented environment-specific base URL.
- Render accessible loading, connected, and unavailable states.
- Provide a keyboard-operable retry action without moving focus unexpectedly.
- Add component tests for loading, success, failure, and retry behavior.

### Completion gate

- A clean install can run web and API applications from documented root commands.
- Type checking, linting, tests, and production builds pass.
- The browser visibly recovers when the API is stopped and restarted.
- An ADR records the workspace tooling, runtime versions, and initial web-to-API boundary.

**React practice:** async service-status component.

## Week 2 — Feedback API contract and first list

**User outcome:** an editor can submit one feedback signal and see it in a deterministically ordered list during the running development session.

**Primary engineering risk:** validation, errors, and pagination become inconsistent before persistence is introduced.

### Backend

- Add a focused feedback module with thin controllers and an application service.
- Implement in-memory `POST /feedback` and `GET /feedback` endpoints behind a storage boundary that can be replaced in Week 3.
- Accept only the minimum signal fields: content, source, customer label, and occurrence time.
- Validate requests and return a documented deterministic error shape.
- Define stable ordering and cursor-pagination semantics, even with a small dataset.
- Add API tests for valid creation, invalid input, empty results, ordering, and pagination.

### Frontend

- Add a minimal feedback form using native labels, controls, and validation messages.
- Add a semantic feedback list or table backed by the API.
- Cover loading, empty, validation-error, service-error, and success states.
- Keep the UI deliberately small; advanced filters and editing are deferred.
- Add behavior-focused tests for submission and result states.

### Completion gate

- A valid submission appears in the list without a page reload.
- Invalid input produces the same field-level meaning at the API and UI boundaries.
- Ordering and pagination are documented in OpenAPI and verified at the HTTP level.
- The in-memory limitation is explicit in the README or milestone notes.

**React practice:** sortable data table using local data; production ordering remains server-owned.

## Week 3 — Persistent tenant-aware data foundation

**User outcome:** feedback survives an API restart and is visibly associated with a seeded workspace and customer.

**Primary engineering risk:** the schema permits cross-workspace links or relies on application code for invariants the database should enforce.

### Backend

- Accept an ADR selecting Prisma or a documented alternative before adding persistence.
- Add PostgreSQL and the ORM to the local development environment.
- Implement the initial user, workspace, membership, customer, and feedback schema.
- Add primary keys, foreign keys, unique membership constraints, required fields, timestamps, and tenant-aware indexes.
- Create reviewed migrations and deterministic seed data for at least two workspaces and multiple roles.
- Replace the in-memory feedback store with a database implementation without changing the HTTP contract unnecessarily.
- Add integration tests proving persistence and rejecting invalid relationships.

### Frontend

- Display the active seeded workspace and customer association in the feedback form and list.
- Consume persisted data after an API restart without introducing duplicate client models.
- Preserve the loading, empty, error, and success behavior from Week 2.
- Add a customer-selection exercise separately; production integration waits until its data and accessibility behavior are ready.

### Completion gate

- Feedback created through the UI remains after restarting the API.
- Seeds are repeatable and clearly labelled as synthetic portfolio data.
- Database constraints reject duplicate memberships and invalid references.
- The data-model document matches the migration and records any deferred invariants.

**React practice:** accessible customer autocomplete.

## Week 4 — Transactional capture and scalable retrieval

**User outcome:** an editor can create feedback reliably and page or filter through persisted signals without ambiguous results.

**Primary engineering risk:** multi-write operations partially succeed, while pagination or filtering produces missing or duplicated rows.

### Backend

- Make feedback creation and its initial audit event atomic in one transaction.
- Implement cursor pagination using a deterministic compound sort.
- Add essential source, customer, and date filters with explicit query semantics.
- Prevent cross-workspace customer assignment at the database or transactional boundary.
- Seed a representative volume and capture `EXPLAIN ANALYZE` evidence before and after one justified index.
- Add transaction rollback, filter, cursor-boundary, and workspace-link integration tests.

### Frontend

- Productionize feedback capture with pending, success, validation, and retry-safe failure states.
- Add paginated navigation and essential filters to the feedback inbox.
- Keep filters reflected in the URL so refresh and browser navigation preserve the view.
- Announce result counts and submission outcomes accessibly.
- Avoid optimistic insertion unless duplicate and rollback behavior is explicitly designed.

### Completion gate

- A forced audit write failure leaves neither a feedback row nor a partial audit event.
- Pagination produces no duplicates or omissions across tested cursor boundaries.
- Reloading or sharing a filtered URL restores the same view.
- Query-plan evidence explains the chosen index and dataset limitations.

**React practice:** filterable, paginated data table.

## Week 5 — Authentication and workspace isolation

**User outcome:** an authenticated editor can work only inside an authorized workspace; a viewer can read but cannot mutate feedback.

**Primary engineering risk:** the interface hides unauthorized actions while the API still accepts them or leaks cross-workspace data.

### Backend

- Record an ADR for the authentication, session, and Next.js-to-NestJS credential boundary.
- Integrate a reputable authentication library or provider without custom cryptography.
- Resolve workspace membership server-side and enforce owner, editor, and viewer policies with NestJS guards or policies.
- Scope every feedback read and mutation by authorized workspace rather than object identifier alone.
- Configure secure cookie or token behavior, security headers, and justified rate limits.
- Add negative integration tests for unauthenticated, forbidden, cross-workspace, and indirect-object access.

### Frontend

- Add sign-in, sign-out, session-expired, and access-denied experiences.
- Add an explicit workspace context or selector appropriate to the chosen session design.
- Hide or disable mutations for viewers while still treating the API as the authority.
- Preserve the intended destination through authentication when safe.
- Render permission failures distinctly from missing resources and service failures.

### Completion gate

- Direct API calls cannot bypass viewer restrictions or workspace isolation.
- Cross-workspace identifiers do not reveal whether another workspace's record exists.
- Expired sessions recover predictably without silently losing entered form data where practical.
- The authorization model and negative-test matrix are documented.

**React practice:** accessible tabs for workspace or feedback-detail views; do not use tabs if the product hierarchy does not require them.

## Week 6 — Production feedback inbox workflow

**User outcome:** an editor can capture, find, inspect, and classify customer feedback efficiently from the keyboard.

**Primary engineering risk:** frontend state, URL state, and server data diverge as the inbox becomes more interactive.

### Backend

- Extend feedback queries with the smallest useful status and product-area classification fields.
- Add a feedback-detail endpoint and any missing filter metadata endpoints.
- Keep ordering, pagination, validation, authorization, and error schemas deterministic.
- Generate or export the OpenAPI contract and establish the frontend type-generation workflow.
- Add contract coverage and integration tests for combined filters and role boundaries.

### Frontend

- Build the production inbox with semantic table or list structure, essential filters, pagination, and URL state.
- Add an accessible capture flow and a feedback-detail view showing source context.
- Add status and product-area classification with complete permission and error handling.
- Manage focus predictably after navigation, submission, validation failure, and classification.
- Test keyboard behavior, accessible names and status announcements, URL restoration, and service failures.

### Completion gate

- A first-time editor can create and classify one signal using only the keyboard.
- Refresh, back, forward, and a shared URL preserve the intended filter and selection state.
- The web application consumes generated or derived API contracts without hand-maintained duplicate domain models.
- A short task-based usability run records time, blockers, and resulting changes.

**React practice:** multi-step form or autocomplete, chosen according to the hardest remaining inbox interaction.

## Week 7 — Reliable editing and audit evidence

**User outcome:** an editor can change an important feedback field, understand success or failure, and inspect who changed it without duplicate or silent stale writes.

**Primary engineering risk:** retries and concurrent edits create duplicate audit events or overwrite newer data.

### Backend

- Select one important mutation, such as feedback classification, for the reliability demonstration.
- Add an idempotency mechanism for duplicate submissions where retries are expected.
- Add optimistic concurrency through a version or expected-update precondition where stale overwrites matter.
- Write the mutation and append-only audit event in one transaction.
- Include correlation and stable request identifiers in structured responses and logs.
- Test duplicate submissions, stale updates, transaction rollback, authorization, and successful retry.

### Frontend

- Show pending state without allowing accidental overlapping submissions.
- Implement either pessimistic confirmation or an optimistic update with explicit rollback; document the choice.
- Distinguish validation, permission, stale-update, and transient service errors.
- Offer a safe retry for transient failure and a refresh/review path for stale data.
- Add an audit-history view for the selected mutation.

### Completion gate

- Repeating the same retry-safe request does not duplicate the domain change or audit event.
- Two simulated editors cannot silently overwrite one another in the protected workflow.
- A failed mutation restores or retains a truthful UI state.
- One user-visible failure can be correlated with its API log entry.

**React practice:** toast or inline notification queue, with production feedback placed near the affected workflow when more accessible.

## Week 8 — Reproducible quality and operations

**User outcome:** the implemented feedback workflow is dependable across supported roles, keyboard use, clean local setup, and automated verification.

**Primary engineering risk:** the application works only in one developer environment and regressions are expensive to locate.

### Backend

- Run persistence and authorization integration tests against an isolated real PostgreSQL database.
- Define deterministic test setup and cleanup without sharing developer data.
- Add readiness behavior that reflects required dependencies while keeping liveness semantics distinct.
- Add Dockerfile and Docker Compose configuration for the implemented API and database.
- Add CI checks for formatting, linting, types, tests, OpenAPI compatibility, and builds.
- Document migration application and forward-recovery behavior.

### Frontend

- Add one Playwright journey covering sign-in, feedback creation, classification, and viewer denial.
- Perform an automated accessibility scan plus a manual keyboard and focus review of the critical workflow.
- Fix the discovered blockers rather than only publishing a report.
- Add frontend production build and test execution to Docker or CI as appropriate.
- Verify layout and behavior at representative desktop and narrow viewport sizes.

### Completion gate

- Another developer can clone the repository and run the implemented system from the README.
- CI passes from a clean state and failures identify the affected layer.
- The critical E2E journey and cross-workspace integration tests are deterministic.
- Accessibility findings, fixes, remaining limitations, and test environments are recorded.

**React practice:** accessible modal only if a shipped workflow requires it; otherwise repeat the weakest prior exercise.

## Week 9 — Bounded CSV import and diagnosis

**User outcome:** an editor can preview and import a bounded CSV, understand accepted, rejected, and duplicate rows, and correct failures without repeating successful work.

**Primary engineering risk:** partial failure or retry duplicates data and leaves the user unable to determine the import outcome.

### Backend

- Define a small supported CSV schema, file-size/row limits, and deterministic row validation.
- Add import, import-row, and stable source-identity persistence.
- Preview validation before commit and return row-specific errors without exposing sensitive content in logs.
- Make repeated submission and corrected retry behavior explicit and idempotent.
- Begin synchronously; measure representative duration before adding BullMQ, a worker, polling, or SSE.
- Add correlated structured logging and integration tests for valid, invalid, duplicate, partial, and repeated imports.

### Frontend

- Build an accessible file-selection and mapping/preview flow for the supported schema.
- Display pending, accepted, rejected, and duplicate counts with row-level errors.
- Allow correction and retry while clearly preserving already accepted rows.
- Keep the user informed during a synchronous request and handle timeouts or connection loss truthfully.
- Add component tests and extend the E2E suite with the most important import recovery path if time permits.

### Completion gate

- Repeating the same import does not duplicate accepted feedback.
- Invalid rows identify the field and reason, and corrected rows can be retried independently where promised.
- Logs connect the UI attempt, API request, import record, and outcome without storing raw feedback content.
- Measurements determine whether asynchronous processing is justified; infrastructure is not added on speculation.

**React practice:** async resource explorer or import preview state machine.

## Week 10 — Measured, deployed portfolio slice

**User outcome:** a reviewer can use the deployed workflow and verify its accessibility, security, reliability, performance, and operational evidence.

**Primary engineering risk:** portfolio claims exceed the behavior and measurements present in the repository.

### Backend

- Deploy the API and managed PostgreSQL with validated production configuration and secrets handling.
- Apply migrations through a documented release process with rollback or forward-recovery guidance.
- Investigate one representative API or database performance question using timings and query plans.
- Configure structured production logs, error capture, health/readiness checks, and minimal privacy-conscious metrics.
- Run a documented incident exercise from user-visible failure to diagnosis and recovery.

### Frontend

- Deploy the Next.js application against the production API with the documented request and session boundary.
- Run the critical workflow against safe seeded data and label all synthetic data and measurements.
- Investigate one representative frontend performance or usability question with before/after evidence.
- Complete the critical-flow keyboard review and address launch-blocking accessibility issues.
- Produce the two-minute product demo, technical walkthrough, screenshots, and case-study narrative.

### Completion gate

- The public demo completes the promised feedback and import workflow without undocumented local setup.
- Security, failure, accessibility, and performance claims link to reproducible evidence.
- Architecture and data-model diagrams match the deployed code.
- README status, backlog, learning log, portfolio evidence, limitations, and post–Week 10 priorities are honest and synchronized.

**React practice:** repeat the lowest-scoring exercise and record whether the reasoning improved.

## Weekly operating loop

1. Confirm the user outcome and primary engineering risk.
2. Turn the backend, frontend, and completion-gate bullets into issue acceptance criteria.
3. Study only the concepts required by the milestone.
4. Complete a connected React exercise when it reinforces the product work.
5. Implement and verify the smallest complete slice.
6. Record what shipped, what failed, what was measured, and what remains uncertain.

## Scope rules

- A week is complete only when its completion gate is satisfied or its reduced scope is documented before moving on.
- If a week slips, reduce features before reducing verification.
- Tests, accessibility, security, and operational concerns are addressed when they first apply, not deferred to a hardening week.
- Do not add AI classification until the manual workflow is usable.
- Start CSV import synchronously; introduce Redis, BullMQ, SSE, or a worker only when measured requirements justify them.
- Use WebSockets only for demonstrated bidirectional low-latency behavior.
- Do not claim senior full-stack positioning merely because the app deploys; use the evidence criteria in the learning plan.
