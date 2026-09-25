# ADR 0004: Authentication and workspace access

- Status: proposed
- Date: 2026-09-25

## Context

SignalDesk currently creates and lists feedback in one hardcoded demo
workspace. The application does not identify individual users or enforce
editor/viewer permissions. The protected development deployment limits
who can reach the application, but does not provide application-level
authentication or workspace isolation.

The Next.js frontend calls the NestJS API from the server. A browser
session will not automatically accompany those server-to-server
requests. We need an explicit credential boundary so NestJS can verify
who made each protected request.

Week 2 requires unauthenticated requests, viewer writes, and
cross-workspace access to be rejected by the API, including direct API
requests that bypass the UI.

## Decision

Use Better Auth in the NestJS API for authentication, with sessions
stored in PostgreSQL. Use email/password sign-in for seeded development
accounts. Disable public sign-up; account creation for these test users
will use a controlled setup process.

Next.js will provide the browser-facing sign-in and sign-out interface
and forward authentication requests to NestJS. It will relay session
cookies to the browser and forward the browser's session credential
when making protected API requests. NestJS will validate the session
on every protected request. The exact forwarding and cookie behavior
must be verified with integration tests before deployment.

Keep workspace membership and role data in SignalDesk-owned tables.
A membership connects a user to a workspace with an `editor` or
`viewer` role. NestJS will check membership for the requested
workspace on every protected read and mutation. Editors may read and
create feedback; viewers may read feedback but may not create it.
A workspace ID supplied by a client selects a workspace but does not
prove permission to access it.

Use TypeORM for SignalDesk entities and reviewed migrations for
application schema changes. Review Better Auth's generated schema
changes and include them in the version-controlled migration workflow.
Do not enable automatic schema synchronization.

Keep the existing deployment protection enabled until the Week 2
authentication and workspace-isolation gate passes.

## Alternatives considered

- **Clerk:** Provides hosted authentication and ready-made Next.js
  components, but introduces an external identity service and moves
  more of the authentication workflow outside this project's code.
- **Auth0 or Amazon Cognito:** Provide managed identity and tokens
  that NestJS can verify, but require additional provider
  configuration for the frontend-to-API flow.
- **Auth.js in Next.js:** Fits the frontend well, but requires a
  separate, carefully defined way for NestJS to verify the user's
  identity on direct API requests.
- **Passport with application-managed sessions:** Offers direct
  control in NestJS, but requires more work to build and maintain
  the account and session lifecycle.

## Consequences

- Authentication data and sessions remain in the project's
  PostgreSQL database.
- NestJS remains the authority for both identity verification and
  workspace permissions. Frontend controls can improve usability,
  but cannot grant access.
- Next.js must forward credentials correctly and handle sign-in,
  sign-out, and expired sessions.
- The application must manage authentication configuration, secrets,
  schema changes, account setup, and session behavior.
- Better Auth's documented NestJS integration is community
  maintained. Its compatibility with the installed NestJS version
  and its behavior in this application need verification.
- Linked records introduced later, such as tags and product areas,
  must be validated as belonging to the authorized workspace.

## Validation

Test protected API behavior against an isolated PostgreSQL database,
including requests made directly to NestJS:

- A request without a valid session cannot list or create feedback.
- An expired or invalid session is rejected.
- An editor can list and create feedback in a workspace where they
  have editor membership.
- A viewer can list feedback in their workspace but cannot create it.
- A user cannot read or write feedback in a workspace where they have
  no membership.
- Changing a workspace ID or a linked record ID in a direct API
  request cannot cross workspace boundaries.
- Rejected writes leave the database unchanged.

Test the browser flow as well: sign-in establishes a usable session,
sign-out ends it, expired sessions lead to a recoverable sign-in
state, and permission errors are shown clearly. Preserve entered
feedback when practical.

Public access remains disabled until these checks pass.