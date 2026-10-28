# Evolution operational gaps

Recorded: 2026-10-28.
Scope: Epic 1, Step 3.

Evidence: [AWS inventory](AWS_INVENTORY.md).

## Purpose

Track observed problems and unverified capabilities before changing
infrastructure or updating the AWS application.

An unverified capability is not automatically a failure.
Close each item only after recording supporting evidence.

## Before Terraform adoption — Epic 2

- [ ] G01: Record the instance AMI ID and EBS volume type.
- [ ] G02: Verify whether existing resources are managed by another
      Terraform state or infrastructure tool.
- [ ] G03: Establish named operator access with temporary credentials
      for routine infrastructure work. The inspected console session
      used root; existing alternative access has not been verified.
- [ ] G04: Configure protected Terraform state storage and locking.
- [ ] G05: Review resource plans for unintended replacement or deletion.
      Protect the database volume during infrastructure changes.

## Before updating the AWS application — Epic 3

- [ ] G06: Create a database backup, retain a copy outside the instance,
      and verify restoration in an isolated environment.
- [ ] G07: Plan the update from the September 24 checkout to a verified
      application revision, including required settings and migrations.
- [ ] G08: Establish identifiable container images and a documented
      recovery path compatible with database changes.
- [ ] G09: Review host updates and the required restart. Perform
      maintenance after backup and recovery arrangements are verified.

## Before a public portfolio release — Epics 3 and 7

- [ ] G10: Configure a domain, HTTPS, and suitable demo access.
      The current web service binds only to loopback.
- [ ] G11: Verify the service listening on port 443 and plan how HTTPS
      and administrative access will coexist.
- [ ] G12: Verify authentication, workspace isolation, viewer restrictions,
      and the main feedback journey on the updated AWS deployment.
- [ ] G13: Establish durable logs, health monitoring, and actionable alerts.
      Current AWS configuration has not been verified.
- [ ] G14: Review operating costs and configure budget notifications
      before expanding infrastructure.
- [ ] G15: Plan encrypted persistent storage and an explicit retention
      policy. The current root volume is unencrypted and is deleted
      when the instance is terminated.

## Observed application discrepancy

The existing web service returns HTTP 200 for the homepage and HTTP 404
for /sign-in. The server checkout is c17291b from 2026-09-24 and contains
only the homepage route.

This is consistent with an earlier application version. It does not
establish a regression in the current local application.

## Architecture limitation

Web, API, and PostgreSQL currently share one EC2 instance.

Worker and broker recovery will improve tolerance of individual process
failures. A single-host outage will still make this deployment unavailable.

Host-level high availability is outside the initial deployment target.

## Completion evidence

For each resolved item, record:

- Gap ID.
- Implementation or configuration reference.
- Verification date and result.
- Remaining limitations.
