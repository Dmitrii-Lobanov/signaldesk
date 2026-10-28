# AWS infrastructure inventory

Observed: 2026-10-28.
Scope: Epic 1, Step 2 — inspect the existing deployment.

## Account and compute

| Field                        | Observed value      |
| ---------------------------- | ------------------- |
| AWS account ID               | 376896792178        |
| Region                       | us-east-2           |
| Availability zone            | us-east-2c          |
| Instance name                | signaldesk-dev      |
| Instance ID                  | i-02fa4b4902626f926 |
| Instance type                | m7i-flex.large      |
| State                        | Running             |
| Infrastructure status checks | 3/3 passed          |
| Operating system             | Ubuntu 26.04 LTS    |
| AMI ID                       | Not yet recorded    |
| Key-pair name                | signaldesk_001      |
| IAM role                     | None                |
| IMDSv2                       | Required            |

## Networking

| Field          | Observed value                                    |
| -------------- | ------------------------------------------------- |
| VPC ID         | vpc-02f4c74dcfacd53db                             |
| Subnet ID      | subnet-018d6247845dfe865                          |
| Public IPv4    | Automatically assigned; observed but omitted here |
| Elastic IP     | None                                              |
| Security group | sg-03a5ceb1f51a39700 / launch-wizard-1            |

### Security group rules

| Direction | Protocol/port | Source or destination              |
| --------- | ------------- | ---------------------------------- |
| Inbound   | TCP 22        | One specific IPv4 address /32      |
| Inbound   | TCP 443       | The same specific IPv4 address /32 |
| Inbound   | TCP 22        | Prefix list pl-03915406641cb1f53   |
| Outbound  | All traffic   | 0.0.0.0/0                          |

The runbook identifies port 443 as an additional SSH port.
The listening service has not yet been independently verified.

## Storage

| Field                 | Observed value        |
| --------------------- | --------------------- |
| Root volume ID        | vol-004c86f7f1624ac9a |
| Device                | /dev/sda1             |
| Size                  | 30 GiB                |
| Volume type           | Not yet recorded      |
| Encrypted             | No                    |
| Delete on termination | Yes                   |

PostgreSQL uses Docker volume signaldesk-deploy_postgres_data.
Its host path is
/var/lib/docker/volumes/signaldesk-deploy_postgres_data/_data,
mounted inside the container at /var/lib/postgresql.

Root filesystem usage was 23%, with approximately 22 GB available.
Backup and restore status for this deployment has not been verified.

## Application runtime

Inspected through EC2 Instance Connect using username ubuntu.

- Server checkout: c17291b, dated 2026-09-24.
- Commit subject: docs: add protected development deployment runbook.
- Server working tree: clean.
- Web container: running for approximately four weeks.
- API container: running for approximately four weeks.
- PostgreSQL container: running and healthy.
- Web binds to 127.0.0.1:3000.
- API and PostgreSQL have no published host ports in the inspected output.
- Homepage returns HTTP 200.
- Sign-in page returns HTTP 404.
- Checked-out web source contains only the homepage route.

The checkout revision does not independently establish the running
container images' build revision. Current authentication and feedback
workflows have not been verified on this deployment.

## Findings and follow-up

- Earlier searches used account 609121374068. The documented instance
  was subsequently located in account 376896792178.
- The server checkout predates the current local application.
- The host reports 76 pending updates and a required restart.
- The root volume is unencrypted and configured for deletion on termination.
- Record the AMI ID and EBS volume type before Terraform adoption.
- Verify backups before deployment or storage changes.
- Inspect existing infrastructure ownership before importing resources.
- Plan a controlled application update with migrations and recovery.

## Verification boundary

This inventory confirms observed resources, container states, storage
mounts, and basic HTTP responses. It does not establish full application
health, successful authentication, restore capability, or high availability.
