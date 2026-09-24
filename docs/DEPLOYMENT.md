# Week 1 protected development deployment

SignalDesk runs on one Oracle Cloud Always Free Ubuntu VM. Docker Compose runs
Next.js, NestJS, and PostgreSQL. Only SSH is reachable from the internet.
Next.js binds to the VM's loopback address and is accessed through an SSH tunnel.
Use synthetic feedback only.

## VM setup

Create an Always Free VM.Standard.A1.Flex Ubuntu 24.04 instance in the
`signaldesk-vcn` public subnet with a public IPv4 address and an SSH key.

In the public subnet's security list, allow inbound TCP port 22 from your own
public IP address with `/32`. Do not add inbound rules for ports 3000, 3001,
or 5432.

Connect as `ubuntu` with the private SSH key. Install Docker Engine and the
Compose plugin using Docker's official Ubuntu instructions:
https://docs.docker.com/engine/install/ubuntu/

Verify:

```sh
sudo docker compose version
```

## Deploy

Clone the repository onto the VM and enter its root directory. Create an
untracked `.env.deploy` file with:

```dotenv
POSTGRES_DB=signaldesk
POSTGRES_USER=signaldesk
POSTGRES_PASSWORD=YOUR_LONG_RANDOM_ALPHANUMERIC_PASSWORD
DATABASE_URL=postgresql://signaldesk:THE_SAME_PASSWORD@postgres:5432/signaldesk
```

Use a unique password; never commit or share this file. Restrict its permissions:

```sh
chmod 600 .env.deploy
```

Start PostgreSQL and the API, then apply the migration and synthetic seed:

```sh
sudo docker compose -p signaldesk-deploy --env-file .env.deploy -f compose.deploy.yaml up -d --build postgres api
sudo docker compose -p signaldesk-deploy --env-file .env.deploy -f compose.deploy.yaml exec -T api node node_modules/typeorm/cli.js migration:run -d apps/api/dist/data-source.js
sudo docker compose -p signaldesk-deploy --env-file .env.deploy -f compose.deploy.yaml exec -T postgres psql -U signaldesk -d signaldesk < apps/api/db/seed.sql
sudo docker compose -p signaldesk-deploy --env-file .env.deploy -f compose.deploy.yaml up -d --build web
sudo docker compose -p signaldesk-deploy --env-file .env.deploy -f compose.deploy.yaml ps
```

The web mapping should show `127.0.0.1:3000->3000/tcp`. API and PostgreSQL
must have no host port mappings.

## Access and verify

On your own computer, open an SSH tunnel, replacing the key path and VM IP:

```sh
ssh -i /ABSOLUTE/PATH/TO/PRIVATE_KEY -N -L 3002:127.0.0.1:3000 ubuntu@VM_PUBLIC_IP
```

Open `http://localhost:3002`. Confirm the seeded feedback appears, submit a
new item, and reload the page.

Restart the application containers on the VM:

```sh
sudo docker compose -p signaldesk-deploy --env-file .env.deploy -f compose.deploy.yaml restart api web
```

Reload the page through the SSH tunnel. The new item must still appear.
Do not run `down -v`: that removes the PostgreSQL volume.