# ADR 0004: Authentication and workspace access

- Status: proposed
- Date: 2026-09-25

## Context

SignalDesk currently creates and lists feedback in one hardcoded
workspace without application authentication. Week 2 requires
authenticated users, editor/viewer permissions, and workspace
isolation enforced by the NestJS API.

The Next.js frontend calls NestJS server-side, so session
credentials must cross that boundary explicitly.

## Decision

Use Better Auth in the NestJS API for authentication, with
database-backed sessions in PostgreSQL.

Use email/password sign-in for seeded development accounts.
Public registration is outside the Week 2 scope.

Next.js provides the browser-facing authentication routes and UI.
It forwards authentication requests and session credentials to
NestJS and relays authentication cookies back to the browser.

NestJS validates sessions on every protected API request.
Workspace membership and editor/viewer permissions are checked
in the API using application-owned membership records.

Use TypeORM for workspace, membership, and feedback persistence.
Review authentication schema changes and incorporate them into
the version-controlled migration workflow.

Keep the existing deployment protection enabled until the
Week 2 authorization and workspace-isolation checks pass.
