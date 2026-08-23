# wilab

A single-user homelab landing page: a grid of links to self-hosted services, with live info pulled from services that expose an API. One Docker container, config on a volume.

## Quick start (Docker Compose)

**Requirements:** Docker and Compose v2.

```bash
mkdir wilab && cd wilab
curl -O https://raw.githubusercontent.com/wiggo-dev/wilab/main/docker-compose.yml
docker compose pull
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000). Click **Edit** to add services from the bundled catalog or define your own.

### Config and upgrades

- Layout, services, integrations, and search providers persist in a Docker volume (`wilab-data` → `/data/config.json` inside the container).
- Upgrades: `docker compose pull && docker compose up -d` — your config survives as long as you keep the volume.
- To bind a host directory instead of a named volume, replace the `volumes` entry with `./data:/data`.

### Build locally instead of pulling

If the GHCR image is unavailable or you are hacking on wilab, uncomment `build: .` in `docker-compose.yml` (and optionally comment out `image:`), then:

```bash
git clone https://github.com/wiggo-dev/wilab.git && cd wilab
docker compose up -d --build
```

### Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `WILAB_DATA_DIR` | `/data` | Directory for `config.json` (set automatically in Compose) |
| `PORT` | `3000` | HTTP port inside the container |

### Reverse proxy

Run wilab on your LAN and put nginx, Caddy, or Traefik in front for TLS. wilab has no built-in authentication in v1 — keep it LAN-only or protect it at the proxy.

## Container image (GHCR)

Pre-built images are published to GitHub Container Registry on each push to `main` and on release tags:

```bash
docker pull ghcr.io/wiggo-dev/wilab:latest
# or a release tag, e.g. ghcr.io/wiggo-dev/wilab:0.1.0
```

The package must be **public** in GitHub (Packages → wilab → Package settings) for anonymous pulls.

## Development

```bash
pnpm install
pnpm dev
```

Config is stored in `./data/config.json` locally (same shape as the Docker volume). E2E tests use a separate port and temp data dir — they do not touch `./data` (see `AGENTS.md`).

```bash
pnpm test        # unit and API integration tests
pnpm test:e2e    # Playwright browser smoke tests (port 3001)
pnpm lint
pnpm typecheck
```

## Catalog icons

Service logos are bundled from [homarr-labs/dashboard-icons](https://github.com/homarr-labs/dashboard-icons) (Apache-2.0). See `public/catalog/icons/LICENSE`.

All product names, trademarks, and registered trademarks are the property of their respective owners. Icons are used for identification purposes only and do not imply endorsement.
