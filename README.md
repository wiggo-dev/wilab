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

For catalog entries without a dedicated integration (and for custom services), enable **HTTP health check** in the service edit dialog to poll the URL (or an optional path on the same host). After you save, a small status pill under the tile name shows `Up`, an HTTP status code, or `Unavailable`.

### Config and upgrades

- Config is stored on the host at `./data/config.json` (bind-mounted to `/data` in the container). Create the directory with `mkdir -p data` if Compose does not.
- In **Edit** mode, use **Export config** / **Import config** to download or restore a backup. Exports are plain JSON and **contain secrets** (API keys and passwords) — treat the file as confidential.
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
| `WILAB_ACCESS_TOKEN` | _(unset)_ | Optional shared secret; when set, browser and API require auth |
| `PORT` | `3000` | HTTP port inside the container |

### Access control (optional)

By default wilab has **no authentication** — keep it LAN-only or protect it at a reverse proxy.

To enable a shared-secret gate, set `WILAB_ACCESS_TOKEN` in Compose (or the container env). Unauthenticated browsers are redirected to a sign-in page that sets an httpOnly cookie; API clients may send `Authorization: Bearer <token>` instead. `GET /api/health` stays open for probes.

```yaml
environment:
  WILAB_DATA_DIR: /data
  WILAB_ACCESS_TOKEN: "replace-me"
```

This complements proxy auth for simpler setups; it is not multi-user OAuth.

### Progressive Web App

wilab ships a web app manifest and a service worker that caches **static assets** only (icons, hashed JS/CSS, catalog logos). It does **not** cache the HTML document, so an installed app still needs network to open — offline shows the browser’s offline page, not a wilab shell. Live glances (`/api/live`) and config always need the network. Install from the browser “Add to Home Screen” / install prompt when serving at the **site root**. Subpath reverse-proxy installs are not supported in v2.

### Reverse proxy

Run wilab on your LAN and put nginx, Caddy, or Traefik in front for TLS. Prefer proxy auth for internet exposure; or set `WILAB_ACCESS_TOKEN` for a lightweight shared secret.

### Remote access (Tailscale, VPN, reverse proxy)

wilab itself can be reached from off-LAN, but **service tiles are different**:

| Concern | Who must reach the service host |
|---------|----------------------------------|
| **Glances / health** | The **wilab server** (server-side `/api/live`). Use a URL the container/host can resolve — prefer LAN DNS or Tailscale MagicDNS over `localhost` inside Docker. |
| **Tile links** | The **browser**. A `192.168.x.x` or `.local` URL works on LAN but not from a phone on cellular. |
| **Logos** | The **browser** for absolute logo URLs. Catalog icons are served by wilab and work remotely; custom favicons pointing at LAN hosts may fail (cosmetic). |

For mixed LAN + remote use, keep the service **URL** as the address wilab uses for glances, and set an optional **Open URL** (edit the service) to a remotely routable link — e.g. Tailscale MagicDNS (`https://sonarr.tailnet.ts.net`) or a reverse-proxied hostname. wilab does not proxy service UIs.

## Container image (GHCR)

Images are published **only on GitHub Releases** (semver tags like `v1.0.0`), not on every `main` commit:

```bash
docker pull ghcr.io/wiggo-dev/wilab:latest   # newest release
docker pull ghcr.io/wiggo-dev/wilab:1.0.0    # exact version
docker pull ghcr.io/wiggo-dev/wilab:1.0      # latest 1.0.x patch
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
# 1. Bump package.json version to match (e.g. 1.0.0 → 1.1.0)
# 2. Commit if needed, then:
git tag -a v1.1.0 -m "wilab v1.1.0"
git push origin v1.1.0
```

That triggers CI to:

1. Build and push `ghcr.io/wiggo-dev/wilab:{version}`, `{major}.{minor}`, and `latest`
2. Create a GitHub Release with auto-generated notes

Or with the GitHub CLI (creates the tag + release; the tag push still runs the Docker job):

```bash
gh release create v1.1.0 --generate-notes --latest
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
