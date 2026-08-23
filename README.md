# wilab

A single-user homelab landing page: a grid of links to self-hosted services, with live info pulled from services that expose an API. One Docker container; config in `./data` on the host.

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

- Config is stored on the host at `./data/config.json` (bind-mounted to `/data` in the container). Create the directory with `mkdir -p data` if Compose does not.
- Upgrades: `docker compose pull && docker compose up -d` — your `./data` folder is left alone.
- If you previously used the named `wilab-data` volume, copy it out once with `docker compose cp wilab:/data/config.json ./data/config.json` (after `mkdir -p data`), then recreate with the updated compose file.

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

Images are published **only on GitHub Releases** (semver tags like `v0.1.0`), not on every `main` commit:

```bash
docker pull ghcr.io/wiggo-dev/wilab:latest   # newest release
docker pull ghcr.io/wiggo-dev/wilab:0.1.0    # exact version
docker pull ghcr.io/wiggo-dev/wilab:0.1      # latest 0.1.x patch
```

The package must be **public** in GitHub (Packages → wilab → Package settings) for anonymous pulls.

## Versioning and releases

wilab uses [semantic versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`). The source of truth for a release is a **git tag** `vX.Y.Z`.

| Change | Bump |
|--------|------|
| Breaking config/API or compose contract | MAJOR |
| New integration or user-facing feature | MINOR |
| Bug fix / polish | PATCH |

### Cut a release

From `main`, with a clean tree:

```bash
# 1. Bump package.json version to match (e.g. 0.1.0 → 0.2.0)
# 2. Commit if needed, then:
git tag -a v0.2.0 -m "wilab v0.2.0"
git push origin v0.2.0
```

That triggers CI to:

1. Build and push `ghcr.io/wiggo-dev/wilab:{version}`, `{major}.{minor}`, and `latest`
2. Create a GitHub Release with auto-generated notes

Or with the GitHub CLI (creates the tag + release; the tag push still runs the Docker job):

```bash
gh release create v0.2.0 --generate-notes --latest
```

Upgrades on a host: `docker compose pull && docker compose up -d`.

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
