# Week 1 protected development deployment

SignalDesk runs on the `signaldesk-dev` EC2 instance in AWS `us-east-2`
(Ubuntu 26.04). Docker Compose runs Next.js, NestJS, and PostgreSQL.
The web app binds only to the VM's loopback address and is accessed through
an SSH tunnel. Use synthetic feedback only.

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

## Deploy

In the VM terminal, clone the repository and enter it:

```sh
git clone https://github.com/Dmitrii-Lobanov/signaldesk.git
cd signaldesk
```

Create an untracked `.env.deploy` with a unique database password:

```sh
umask 077
DB_PASSWORD=$(openssl rand -hex 32)
printf 'POSTGRES_DB=signaldesk\nPOSTGRES_USER=signaldesk\nPOSTGRES_PASSWORD=%s\nDATABASE_URL=postgresql://signaldesk:%s@postgres:5432/signaldesk\n' "$DB_PASSWORD" "$DB_PASSWORD" > .env.deploy
unset DB_PASSWORD
chmod 600 .env.deploy
sudo docker compose --env-file .env.deploy -f compose.deploy.yaml config -q
```

Never commit, print, or share `.env.deploy`.

Start PostgreSQL and the API. Run the migration and synthetic seed **once**
on a new database, then start the web app:

```sh
sudo docker compose -p signaldesk-deploy --env-file .env.deploy -f compose.deploy.yaml up -d --build postgres api
sudo docker compose -p signaldesk-deploy --env-file .env.deploy -f compose.deploy.yaml exec -T api node node_modules/typeorm/cli.js migration:run -d apps/api/dist/data-source.js
sudo docker compose -p signaldesk-deploy --env-file .env.deploy -f compose.deploy.yaml exec -T postgres psql -U signaldesk -d signaldesk < apps/api/db/seed.sql
sudo docker compose -p signaldesk-deploy --env-file .env.deploy -f compose.deploy.yaml up -d --build web
sudo docker compose -p signaldesk-deploy --env-file .env.deploy -f compose.deploy.yaml ps
curl -I http://127.0.0.1:3000
```

The web mapping should show `127.0.0.1:3000->3000/tcp`, with no host port
mapping for the API or PostgreSQL. The local `curl` should return HTTP 200.

## Access and verify

On the **Mac**, open the SSH tunnel and leave that terminal running:

```sh
ssh -p 443 -i ~/Downloads/signaldesk_001.pem -o ExitOnForwardFailure=yes -N -L 3002:127.0.0.1:3000 ubuntu@INSTANCE_PUBLIC_IP
```

Open <http://localhost:3002>. Confirm the seeded feedback appears. Submit
a new synthetic feedback item and reload the page.

Restart the containers on the VM:

```sh
cd ~/signaldesk
sudo docker compose -p signaldesk-deploy --env-file .env.deploy -f compose.deploy.yaml restart
```

Reload <http://localhost:3002> again. The new feedback must still appear.
Do not run `down -v`: it deletes the PostgreSQL data volume.

When finished working, stop the EC2 instance in AWS to conserve Free plan
credits. Starting it again may assign a new public IP; use the new IP in the
SSH command and tunnel.
