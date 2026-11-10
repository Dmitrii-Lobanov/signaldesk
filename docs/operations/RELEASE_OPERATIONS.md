# Versioned release operations

## Existing EC2 deployment

Keep `.env.deploy` mode 600 and preserve its database and auth secrets.
Set exactly one `API_IMAGE=` and `WEB_IMAGE=` entry to the reviewed immutable
ECR release references. Exported values override these selections for a single
run. The scripts read only these image keys, never execute the secrets file.

On EC2, from `~/signaldesk`, after pulling the reviewed code:

```bash
set -o pipefail
aws ecr get-login-password --region us-east-2 |
  sudo docker login --username AWS --password-stdin \
    376896792178.dkr.ecr.us-east-2.amazonaws.com
bash scripts/deploy-images.sh < /dev/null
```

The script validates configuration, pulls images, waits for PostgreSQL,
creates a protected backup, checks its archive directory, runs migrations,
starts the application without building, and retries the sign-in HTTP check.
Review migration compatibility before running. A failed command stops delivery;
it does not reverse migrations or automatically roll back containers.
`timeout` is required on the Ubuntu deployment host.

Backups accumulate in `~/signaldesk-backups` with mode 600. Retain off-instance
copies and manage retention manually. Archive-directory validation alone is
not a restore test. This path expects an existing initialized database;
use the first-time setup in DEPLOYMENT.md for a fresh deployment.

Before changing releases, record the running image references:

```bash
sudo docker inspect --format '{{.Name}} {{.Config.Image}}' \
  signaldesk-deploy-api-1 signaldesk-deploy-web-1
```

## Isolated restore on the Mac

Copy the selected backup from EC2 using the current public IP and your SSH key.
Then run, from the repository:

```bash
bash scripts/verify-backup.sh \
  "$HOME/signaldesk-backups/pre-ecr-20261106T195816Z.dump"
```

This creates a uniquely named PostgreSQL 18 container with memory-backed data,
no published ports, and no external network. TCP readiness avoids confusing the
initial temporary server with the final server. Restore stops on SQL errors;
feedback and migration counts are printed for comparison. The temporary
container is removed on exit. The source archive is preserved.

Verified on 2026-11-10: the November 6 archive restored successfully with
three feedback records and six migration records. The temporary container
was removed after the check. A successful
restore and matching counts establish database recovery evidence; application
sign-in and permissions require a separate application rehearsal.

## Compatible application rollback

Review migrations between the running and target releases first. Use a target
whose schema expectations remain compatible with the current database. Keep
writes controlled during the rehearsal and verify existing feedback afterward.
Do not automatically reverse migrations or restore an old backup over new writes.

```bash
bash scripts/rollback-images.sh --schema-compatible \
  'REVIEWED_API_IMAGE_REFERENCE' 'REVIEWED_WEB_IMAGE_REFERENCE'
```

The flag is an operator assertion, not an automated compatibility proof.
This command pulls the target images and replaces only API/web containers,
without migrations or database recreation. It checks HTTP readiness. Verify
editor/viewer sign-in and feedback, then update the two image selections in
`.env.deploy` to persist the accepted release. Re-run the same command with the
original image references to return to the original release.

A same-image restart does not establish cross-version rollback evidence.
The older published image must be reviewed before using it as a rollback target.

## Outstanding release gates

- Run the updated backup-before-migration deployment on EC2.
- Rehearse a reviewed compatible release rollback and return.
- Verify synthetic account/data setup against a fresh database.
- Choose a domain and configure HTTPS. Port 443 currently carries SSH;
  migrate that access route while preserving EC2 Instance Connect before
  assigning 443 to HTTPS. Do not expose database or API ports.
