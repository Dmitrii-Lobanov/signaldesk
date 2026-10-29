# SignalDesk AWS infrastructure

Status: configuration foundation only.
No AWS resources or imports are declared yet.

## Target

- Account: 376896792178.
- Region: us-east-2.
- Existing instance: i-02fa4b4902626f926.

The AWS provider rejects credentials belonging to another account.

## Local setup

Install Terraform using HashiCorp's macOS instructions.

From the repository root:

    terraform -chdir=infra/terraform init -backend=false
    terraform -chdir=infra/terraform fmt -check
    terraform -chdir=infra/terraform validate

Initialization downloads the AWS provider and creates a dependency lock
file. Commit .terraform.lock.hcl; do not commit the .terraform directory.

These checks do not create AWS resources or verify AWS credentials.

## Next steps

Configure named operator access and protected remote state before
planning imports or applying infrastructure changes.

The remote-state storage requires a separate bootstrap configuration.
Do not import the existing instance into temporary local state.

Existing resources must be checked for prior infrastructure ownership
before adoption.

## Responsibility boundary

Terraform manages AWS infrastructure.

Application image builds, database migrations, and container releases
belong to the application deployment workflow.

## References

- [Evolution plan](../../docs/EVOLUTION_PLAN.md)
- [AWS inventory](../../docs/operations/AWS_INVENTORY.md)
- [Operational gaps](../../docs/operations/EVOLUTION_GAPS.md)