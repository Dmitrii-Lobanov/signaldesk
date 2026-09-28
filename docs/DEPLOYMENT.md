# Protected development deployment

SignalDesk runs on the `signaldesk-dev` EC2 instance in AWS `us-east-2`
(Ubuntu 26.04). Docker Compose runs Next.js, NestJS, and PostgreSQL.
The web app binds only to the VM's loopback address and is accessed through
an SSH tunnel. Use synthetic feedback and development accounts only.

This EC2 instance uses AWS Free plan credits while running; it is not an
Always Free instance.

## VM and network

The instance is `i-02fa4b4902626f926`, with security group
`sg-03a5ceb1f51a39700`. Its public IPv4 address may change after the
instance is stopped and started.

Keep these inbound security-group rules:

- SSH (TCP 22) from the current Mac public IP with `/32`.
- SSH (TCP 22) from the AWS-managed
  `com.amazonaws.us-east-2.ec2-instance-connect` prefix list.
- TCP 443 from the current Mac public IP with `/32`, for SSH from networks
  that block outbound port 22.

Do not add inbound rules for ports 3000, 3001, or 5432. Port 443 carries SSH
on this VM; it is not an HTTPS web endpoint. Update the `/32` rules if the
Mac's public IP changes.

Use **EC2 → Instances → signaldesk-dev → Connect → EC2 Instance Connect**
to open a browser terminal as `ubuntu`. This access uses port 22 and the
AWS-managed prefix-list rule.

Install Docker Engine and the Compose plugin using Docker's
[official Ubuntu instructions](https://docs.docker.com/engine/install/ubuntu/).
Verify the installation:

```sh
sudo docker compose version
```

## SSH on port 443

Ubuntu uses `ssh.socket`. Keep port 22 available for EC2 Instance Connect
while also listening on port 443:

```sh
printf 'Port 22\nPort 443\n' | sudo tee /etc/ssh/sshd_config.d/50-signaldesk-ports.conf
sudo sshd -t
sudo systemctl daemon-reload
sudo systemctl restart ssh.socket
sudo ss -ltnp '( sport = :22 or sport = :443 )'
```

The final command should show listeners on both ports. Keep the EC2 Instance
Connect browser terminal open until SSH from the Mac succeeds.

Verify the SSH host-key fingerprint through EC2 Instance Connect before
accepting it on the Mac:

```sh
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

On the Mac, restrict the private key's permissions and connect, replacing
the IP if the instance's public IP has changed:

```sh
chmod 400 ~/Downloads/signaldesk_001.pem
ssh -p 443 -i ~/Downloads/signaldesk_001.pem ubuntu@INSTANCE_PUBLIC_IP
```

## Prepare the checkout

For a first deployment, clone the repository on the VM:

```sh
git clone https://github.com/Dmitrii-Lobanov/signaldesk.git
cd signaldesk
```

For an existing Week 1 deployment, keep the existing checkout and pull the
committed Week 2 changes:

```sh
cd ~/signaldesk
git pull --ff-only
```

## Configure deployment secrets

`.env.deploy` is untracked and must remain on the VM. It supplies the database
connection, the Better Auth secret, and two synthetic account credentials.
`BETTER_AUTH_URL` must match the browser origin used by the SSH tunnel below:
`http://localhost:3002`.

**For a first deployment only**, create `.env.deploy`:

```sh
umask 077
DB_PASSWORD=$(openssl rand -hex 32)
AUTH_SECRET=$(openssl rand -hex 32)
EDITOR_PASSWORD=$(openssl rand -hex 24)
VIEWER_PASSWORD=$(openssl rand -hex 24)

cat > .env.deploy <<EOF
POSTGRES_DB=signaldesk
POSTGRES_USER=signaldesk
POSTGRES_PASSWORD=$DB_PASSWORD
DATABASE_URL=postgresql://signaldesk:$DB_PASSWORD@postgres:5432/signaldesk
BETTER_AUTH_SECRET=$AUTH_SECRET
BETTER_AUTH_URL=http://localhost:3002
DEV_EDITOR_EMAIL=editor@example.invalid
DEV_EDITOR_PASSWORD=$EDITOR_PASSWORD
DEV_VIEWER_EMAIL=viewer@example.invalid
DEV_VIEWER_PASSWORD=$VIEWER_PASSWORD
EOF

unset DB_PASSWORD AUTH_SECRET EDITOR_PASSWORD VIEWER_PASSWORD
chmod 600 .env.deploy
```

**For an existing Week 1 deployment**, preserve the current `.env.deploy`
and its database password. Add the following settings **once**; do not
recreate the file or append duplicate keys:

```sh
umask 077
AUTH_SECRET=$(openssl rand -hex 32)
EDITOR_PASSWORD=$(openssl rand -hex 24)
VIEWER_PASSWORD=$(openssl rand -hex 24)

cat >> .env.deploy <<EOF
BETTER_AUTH_SECRET=$AUTH_SECRET
BETTER_AUTH_URL=http://localhost:3002
DEV_EDITOR_EMAIL=editor@example.invalid
DEV_EDITOR_PASSWORD=$EDITOR_PASSWORD
DEV_VIEWER_EMAIL=viewer@example.invalid
DEV_VIEWER_PASSWORD=$VIEWER_PASSWORD
EOF

unset AUTH_SECRET EDITOR_PASSWORD VIEWER_PASSWORD
chmod 600 .env.deploy
```

Keep `BETTER_AUTH_SECRET` unchanged on later deployments so existing sessions
remain valid. Never commit, print, or share `.env.deploy`. Do not copy the
local `.env` to EC2.

Validate the Compose configuration without printing its interpolated secrets:

```sh
sudo docker compose --env-file .env.deploy -f compose.deploy.yaml config -q
```

## Deploy

Start PostgreSQL and build the API image:

```sh
sudo docker compose -p signaldesk-deploy --env-file .env.deploy -f compose.deploy.yaml up -d --wait postgres
sudo docker compose -p signaldesk-deploy --env-file .env.deploy -f compose.deploy.yaml build api
```

Run the reviewed migrations before starting the application:

```sh
sudo docker compose -p signaldesk-deploy --env-file .env.deploy -f compose.deploy.yaml run --rm --no-deps api node node_modules/typeorm/cli.js migration:run -d apps/api/dist/data-source.js
```

On a **new database only**, add the synthetic workspace and sample feedback:

```sh
sudo docker compose -p signaldesk-deploy --env-file .env.deploy -f compose.deploy.yaml exec -T postgres psql -U signaldesk -d signaldesk < apps/api/db/seed.sql
```

Create or verify the synthetic editor and viewer memberships using the
one-time account-setup service:

```sh
sudo docker compose -p signaldesk-deploy --profile setup --env-file .env.deploy -f compose.deploy.yaml run --rm --no-deps account-setup
```

It should print `editor@example.invalid: editor` and
`viewer@example.invalid: viewer`. If an existing account has a different
stored password, the command fails instead of silently changing it; resolve
that mismatch before continuing.

Start the API and web app:

```sh
sudo docker compose -p signaldesk-deploy --env-file .env.deploy -f compose.deploy.yaml up -d --build api web
sudo docker compose -p signaldesk-deploy --env-file .env.deploy -f compose.deploy.yaml ps
curl -I http://127.0.0.1:3000/sign-in
```

The web mapping should show `127.0.0.1:3000->3000/tcp`, with no host port
mapping for the API or PostgreSQL. The `/sign-in` check should return HTTP 200.

## Access and verify

On the **Mac**, open the SSH tunnel and leave that terminal running:

```sh
ssh -p 443 -i ~/Downloads/signaldesk_001.pem -o ExitOnForwardFailure=yes -N -L 3002:127.0.0.1:3000 ubuntu@INSTANCE_PUBLIC_IP
```

Open <http://localhost:3002/sign-in>. Read the editor and viewer passwords
privately from `.env.deploy` on the VM; do not paste them into chat, logs, or
screenshots.

Sign in as `editor@example.invalid`, submit synthetic feedback, and confirm
it appears in the list. Sign out, then sign in as `viewer@example.invalid`.
The viewer must see the feedback but must not see the create form. Sign out
again and confirm that opening the home page returns to sign-in.

Restart only the application containers on the VM:

```sh
cd ~/signaldesk
sudo docker compose -p signaldesk-deploy --env-file .env.deploy -f compose.deploy.yaml restart api web
```

Sign in again and confirm the feedback still appears. Do not run `down -v`:
it deletes the PostgreSQL data volume.

Keep the SSH tunnel and network restrictions in place. Public access remains
disabled until the Week 2 authorization gate passes.

When finished working, stop the EC2 instance in AWS to conserve Free plan
credits. Starting it again may assign a new public IP; use the new IP in the
SSH command and tunnel.
