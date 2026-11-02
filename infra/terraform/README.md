# SignalDesk AWS infrastructure

Status: existing EC2 instance, security group, and four rules imported.
Application and bootstrap plans reported no changes on 2026-11-02.
The existing VPC and subnet are referenced through data sources.
The instance currently has no IAM instance profile.

## Target

- Account: 376896792178.
- Region: us-east-2.
- Existing instance: i-02fa4b4902626f926.

The AWS provider rejects credentials belonging to another account.

## Local setup

Use the signaldesk-operator IAM user through temporary CLI credentials.

From the repository root:

    aws login --profile signaldesk
    export AWS_PROFILE=signaldesk-terraform
    aws sts get-caller-identity
    terraform -chdir=infra/terraform init
    terraform -chdir=infra/terraform fmt -check
    terraform -chdir=infra/terraform validate
    terraform -chdir=infra/terraform plan

The signaldesk-terraform profile obtains credentials through:

    credential_process = aws configure export-credentials --profile signaldesk --format process

Store profile configuration in the local AWS CLI configuration,
not in repository files.

## State storage

Bucket: signaldesk-tfstate-376896792178-us-east-2.

- Bootstrap state: bootstrap/terraform.tfstate.
- Application infrastructure state: dev/terraform.tfstate.

Both backends enable encryption and S3 state locking.
The bucket enables versioning, blocks public access, and requires HTTPS.

The bootstrap configuration lives in ../bootstrap.
Both bootstrap and application state have been migrated to S3.

Commit dependency lock files. Never commit state files, saved plans,
credentials, or .terraform directories.

## Infrastructure updates

Authenticate using the local setup above. Confirm that the caller ARN
ends with user/signaldesk-operator.

Run formatting, validation, and a plan for the directory being changed.
Save the reviewed plan and apply that exact file:

    terraform -chdir=infra/terraform plan -out=reviewed.tfplan
    terraform -chdir=infra/terraform apply reviewed.tfplan
    terraform -chdir=infra/terraform plan

Proceed only when every proposed change is understood.
The final plan should report no changes.

CI checks formatting and validation for both Terraform directories.
Live AWS plans and applies remain local.

The operator retains bucket bootstrap permissions.
Narrow those permissions separately after reviewing required operations.

## Recovery

S3 versioning preserves previous state versions. State recovery restores
Terraform's resource records; it does not restore application data.

If state appears missing, first check the AWS identity, backend bucket,
state key, and workspace. Do not apply a plan proposing duplicate resources.

For suspected state corruption, stop all Terraform runs and preserve the
current state securely before investigating previous S3 object versions.
Restore state only through a separately reviewed recovery procedure.
Do not force-unlock state until the owning operation is confirmed stopped.

Application database backup and restore remain unverified.
Before deployment or storage changes, create a database backup outside
the EC2 root volume and verify restoration.

## Teardown

Teardown is not currently approved or verified.
The instance, security group, rules, and state bucket use prevent_destroy.

The EC2 root volume contains application data and is configured for
deletion when the instance terminates. Before intentional teardown,
verify an independent database backup and restore, review dependencies,
and explicitly review any removal of destruction protections.

Preserve the state bucket and its versions until application recovery
and infrastructure teardown are complete.

## Responsibility boundary

Terraform manages AWS infrastructure.

Application image builds, database migrations, and container releases
belong to the application deployment workflow.

## References

- [Evolution plan](../../docs/EVOLUTION_PLAN.md)
- [AWS inventory](../../docs/operations/AWS_INVENTORY.md)
- [Operational gaps](../../docs/operations/EVOLUTION_GAPS.md)
