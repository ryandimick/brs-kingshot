# Deploying rally-lead

Self-hosted on a single Linux VPS (Hetzner CX22 recommended). Docker Compose
orchestrates three services: Caddy (HTTPS + reverse proxy + static frontend),
the Node API, and Postgres.

## What gets deployed

```
┌─ Caddy (HTTPS, port 80/443) ────────────┐
│  /api/*  → api:3001                     │
│  /*      → built React static assets    │
└─────────────────────────────────────────┘
              │
   ┌──────────┼──────────┐
   ▼          ▼          ▼
  api      postgres   (named volume: pg_data)
```

## One-time server setup

1. Spin up a Hetzner CX22 (or similar) with Debian 12 or Ubuntu 24.04.

2. SSH in as root, install Docker:

   ```sh
   apt-get update
   apt-get install -y ca-certificates curl
   install -m 0755 -d /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/debian/gpg \
     -o /etc/apt/keyrings/docker.asc
   chmod a+r /etc/apt/keyrings/docker.asc
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
     https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
     > /etc/apt/sources.list.d/docker.list
   apt-get update
   apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
   ```

3. Point DNS at the server (both records, A type):

   ```
   blackrosealliance.com       A   <server-ip>
   www.blackrosealliance.com   A   <server-ip>
   ```

4. Verify DNS has propagated before first deploy:

   ```sh
   dig +short www.blackrosealliance.com
   ```

   Should return the server IP. Caddy needs this to provision a Let's Encrypt
   cert at first start.

## Deploying

1. Clone the repo on the server:

   ```sh
   git clone https://github.com/<you>/<repo>.git /opt/rally-lead
   cd /opt/rally-lead
   ```

2. Create `.env` from the example and fill in real values:

   ```sh
   cp .env.example .env
   nano .env
   ```

   Required: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `POSTGRES_PASSWORD`.
   Keep `SITE_ADDRESS` set to the production domain.

3. Build + start:

   ```sh
   docker compose up -d --build
   ```

   First start takes ~3 minutes (npm installs, TypeScript build, React build,
   Caddy cert provisioning). Subsequent starts are seconds.

4. Verify:

   ```sh
   curl https://www.blackrosealliance.com/api/health
   # → {"ok":true,"ts":"..."}
   ```

## Updating

```sh
cd /opt/rally-lead
git pull
docker compose up -d --build
```

`postgres` and the named volume `pg_data` persist across rebuilds. Migrations
run automatically on api container startup (`prisma migrate deploy`).

## Backups

In-container Postgres needs your own backup strategy. Cheapest setup:

1. Provision a Hetzner Storage Box (~€4/mo, 1 TB).
2. On the VPS, install `borgbackup` and schedule a nightly dump:

   ```sh
   docker exec rally-lead-postgres-1 \
     pg_dump -U rally_lead rally_lead | gzip > /backups/$(date +%F).sql.gz
   ```

3. Rotate / push to Storage Box.

## Local stack test (optional)

To verify the Docker stack works before deploying, on your dev machine:

1. Copy `.env.example` to `.env` and switch to the local block:

   ```
   SITE_ADDRESS=:80
   SITE_ADDRESS_URL=http://localhost
   ```

2. `docker compose up -d --build`
3. Visit http://localhost — should serve the React app.
4. `curl http://localhost/api/health` — should return `{"ok":true,...}`.
5. `docker compose down` when done.

## Native local dev (preferred for daily work)

The full Docker stack is slow to rebuild on every change. For day-to-day:

```sh
# Just Postgres in a container
docker compose -f docker-compose.dev.yml up -d

# In one terminal:
cd rally-lead-api && npm run dev   # API with hot reload

# In another:
cd rally-lead-app && npm run dev   # Vite HMR
```
