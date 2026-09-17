# Quality bar

## Definition of done

A feature is complete when the user outcome works, the principal failure modes are recoverable, and another engineer can understand and operate it.

For every milestone, mark each quality area as **applicable**, **deferred**, or **not applicable**, with a reason. A read-only liveness endpoint, for example, does not require authorization or a transaction, while a workspace mutation does.

### Product behavior

- Acceptance criteria describe a user outcome, not just a component.
- Loading, empty, error, success, and permission states exist.
- Destructive actions require clear intent and appropriate recovery.
- Important product behavior is instrumented with privacy-conscious events.

### Accessibility

- Semantic HTML is the default.
- Every interaction works by keyboard with visible focus.
- Focus moves predictably after dialogs, errors, and route changes.
- Names, roles, states, validation messages, and status announcements are exposed.
- Automated checks pass and critical flows receive a manual keyboard review.

### Frontend performance

- Measure representative workflows before optimization.
- Avoid request waterfalls and unbounded client rendering.
- Large lists use pagination or virtualization based on measured needs.
- Expensive rerenders are demonstrated with profiling evidence.
- Performance changes record before/after conditions and results.

### API and data

- Inputs are validated at the boundary.
- Authorization is enforced server-side and tested negatively.
- Pagination, ordering, and error shapes are deterministic.
- Transactions protect multi-write invariants.
- Migrations are reviewed for existing data and recovery strategy.
- Concurrent behavior is tested where lost updates or invariant violations are possible.
- API error schemas and the generated OpenAPI contract remain compatible with consumers.

### Reliability and security

- Retryable commands are idempotent.
- Timeouts, duplicate submissions, partial failures, and stale updates are considered.
- Sensitive content is not logged.
- Dependencies and secrets are handled by established tooling.
- The application follows least privilege and secure defaults.

### Testing

- Domain rules have focused unit tests where useful.
- Database and authorization behavior have integration tests.
- Persistence integration tests run against an isolated real database with deterministic cleanup.
- API compatibility has contract coverage.
- A small number of critical user journeys have E2E tests.
- Tests are deterministic and failures produce actionable output.

### Operations

- Structured logs include correlation and outcome data.
- Errors are captured with enough context to reproduce safely.
- Liveness and readiness have distinct semantics; readiness reflects the dependencies required to serve traffic.
- The deployment and rollback or forward-recovery process is documented.

### AI-assisted engineering

- The engineer understands and can explain generated code, inspects every diff and owns the result.
- Tasks have explicit context, constraints and acceptance criteria before delegation.
- Dependencies are verified; security-sensitive code receives focused review and negative tests.
- Credentials and customer data are excluded from prompts and logs; use synthetic examples.
- Verification checks actual behavior rather than accepting agent-written tests as independent proof.
- Weekly evidence records an agent contribution, an error/correction and an independent explanation or debugging exercise.

### Conditional AI product feature

- Suggestions are validated, workspace-scoped and never applied without authorized human acceptance.
- Untrusted feedback cannot override application rules; invalid values and stale suggestions are rejected.
- Timeouts, limits, provider failures and manual fallback are demonstrated.
- A held-out labeled evaluation records quality, latency, estimated cost, model/prompt versions and limitations.
- The ship/defer decision is documented. If the experiment is deferred, mark this section deferred with the reason.
