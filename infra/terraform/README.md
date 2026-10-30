# SignalDesk AWS infrastructure

Status: configuration foundation only.
No AWS resources or imports are declared yet.

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
Its state was initially local and must be migrated successfully before
considering remote-state setup complete.

Commit dependency lock files. Never commit state files, saved plans,
credentials, or .terraform directories.

## Next steps

Verify existing infrastructure ownership before importing resources.
Review every plan before applying changes.

The operator currently has bucket bootstrap permissions.
Narrow configuration permissions after bootstrap verification.
Application infrastructure permissions will be configured separately.

## Responsibility boundary

Terraform manages AWS infrastructure.

Application image builds, database migrations, and container releases
belong to the application deployment workflow.

## References

- [Evolution plan](../../docs/EVOLUTION_PLAN.md)
- [AWS inventory](../../docs/operations/AWS_INVENTORY.md)
- [Operational gaps](../../docs/operations/EVOLUTION_GAPS.md)
