# Research: infra integration APIs (Uptime Kuma, Portainer, Home Assistant)

Resolves [#4](https://github.com/wiggo-dev/wilab/issues/4) (part of map [#1](https://github.com/wiggo-dev/wilab/issues/1)).

**Question:** For Uptime Kuma, Portainer, and Home Assistant — what auth methods, endpoints/mechanisms for glanceable status, response shapes, and caveats matter for building an Integration (per `CONTEXT.md`: the per-service client that fetches live information for a Service tile)?

All claims below are cited to primary sources: official docs and the projects' GitHub source code. Researched 2026-08-17.

---

## 1. Uptime Kuma

### The headline caveat: there is no stable REST API

Uptime Kuma's own wiki states it plainly: the application "primarily uses Socket.io for real-time communication after authentication" and the internal API "is not officially supported for third-party integrations. Breaking changes may occur between versions without prior notice." ([Internal API wiki](https://github.com/louislam/uptime-kuma/wiki/Internal-API)) The RESTful surface that does exist is limited to push monitors, status badges, Prometheus metrics, and public status page data ([same source](https://github.com/louislam/uptime-kuma/wiki/Internal-API)). So an Integration has four candidate ways in:

### Option A — `/metrics` (Prometheus exposition format) with an API key — **recommended**

**Auth.** The `/metrics` endpoint is protected by HTTP Basic Auth. Two modes, mutually exclusive:

- **API key (the maintained feature, recommended):** created under *Settings → API Keys*; keys look like `uk1_<secret>`. Pass the key as the Basic Auth **password** with an empty/ignored username: `curl -u":<key>" https://kuma.example/metrics`. ([Prometheus API Keys wiki](https://github.com/louislam/uptime-kuma/wiki/Prometheus-API-Keys)) Server-side, `apiAuth` in [`server/auth.js`](https://github.com/louislam/uptime-kuma/blob/master/server/auth.js) verifies only the password field against the stored key hash (the `apiAuthorizer` ignores the username), and rate-limits API auth attempts.
- **Username/password Basic Auth:** used only while no API key exists. "As soon as you add your first API key, the use of basic authentication for the endpoint will be permanently disabled." ([Prometheus API Keys wiki](https://github.com/louislam/uptime-kuma/wiki/Prometheus-API-Keys))

**Response shape.** Plain-text Prometheus gauges, one series per monitor, defined in [`server/prometheus.js`](https://github.com/louislam/uptime-kuma/blob/master/server/prometheus.js):

- `monitor_status` — `1 = UP, 0 = DOWN, 2 = PENDING, 3 = MAINTENANCE`
- `monitor_response_time` — last response time in ms (`-1` when not applicable)
- `monitor_cert_days_remaining`, `monitor_cert_is_valid`
- `monitor_uptime_ratio` and `monitor_response_time_seconds` — sliding-window gauges with a `window` label (`1d`, `30d`, `365d`)

Labels on every series: `monitor_id`, `monitor_name`, `monitor_type`, `monitor_url`, `monitor_hostname`, `monitor_port`, plus sanitized user tags ([`server/prometheus.js`](https://github.com/louislam/uptime-kuma/blob/master/server/prometheus.js), [Prometheus Integration wiki](https://github.com/louislam/uptime-kuma/wiki/Prometheus-Integration)). Trimmed example:

```text
monitor_status{monitor_id="1",monitor_name="Gitea",monitor_type="http",monitor_url="https://git.example"} 1
monitor_response_time{monitor_id="1",monitor_name="Gitea",monitor_type="http",monitor_url="https://git.example"} 123
monitor_uptime_ratio{monitor_id="1",monitor_name="Gitea",window="1d",...} 0.9998
```

An Integration needs a small Prometheus text-format parser (the format is line-oriented and trivial), but gets *all* monitors — including private ones — in one authenticated GET.

### Option B — public status page JSON (no auth, but requires setup)

If the user publishes a status page, two unauthenticated JSON endpoints exist (source: [`server/routers/status-page-router.js`](https://github.com/louislam/uptime-kuma/blob/master/server/routers/status-page-router.js)):

- `GET /api/status-page/:slug` — page config, pinned incident, and the monitor list grouped into public groups (server-cached 5 minutes).
- `GET /api/status-page/heartbeat/:slug` — per-monitor recent heartbeats plus 24-hour uptime (server-cached 1 minute):

```json
{
  "heartbeatList": {
    "1": [ { "status": 1, "time": "2026-08-17 10:30:00.123", "msg": "", "ping": 55 } ]
  },
  "uptimeList": { "1_24": 0.9998 }
}
```

The heartbeat objects are `toPublicJSON()` from [`server/model/heartbeat.js`](https://github.com/louislam/uptime-kuma/blob/master/server/model/heartbeat.js): `status` (0 DOWN / 1 UP / 2 PENDING / 3 MAINTENANCE per the enum comment in that file), `time`, `ping`, and `msg` blanked for public view. Caveats: only monitors placed in a *public* group on a *published* status page appear ([router source](https://github.com/louislam/uptime-kuma/blob/master/server/routers/status-page-router.js)), responses are cached server-side, and it requires the user to set up a status page just to feed the dashboard.

There are also per-monitor SVG badge endpoints (`/api/badge/:id/status`, `/uptime`, `/ping`, `/cert-exp`) and an overall `/api/status-page/:slug/badge` — images, not data, so useful only as `<img>` embeds ([Internal API wiki](https://github.com/louislam/uptime-kuma/wiki/Internal-API), [router source](https://github.com/louislam/uptime-kuma/blob/master/server/routers/status-page-router.js)).

### Option C — the socket.io interface (what the Kuma UI itself uses)

Connect via socket.io, then authenticate post-connection with a `login` event (username/password, optional 2FA token) or `loginByToken` (a JWT from a prior login); the server then pushes `monitorList`, `heartbeatList`, `heartbeat`, `avgPing`, `uptime` events in real time. ([Internal API wiki](https://github.com/louislam/uptime-kuma/wiki/Internal-API)) Caveats: it is explicitly internal and unstable ("Breaking changes may occur between versions without prior notice"), requires storing the user's real login credentials (API keys cannot be used — they "cannot be used to access the web interface", [Prometheus API Keys wiki](https://github.com/louislam/uptime-kuma/wiki/Prometheus-API-Keys)), and needs a persistent socket connection — heavy machinery for a landing page.

### Option D — push monitors (inverted flow)

`GET /api/push/:pushToken?status=up&msg=OK&ping=100` lets *Kuma monitor other things*, not the reverse ([Internal API wiki](https://github.com/louislam/uptime-kuma/wiki/Internal-API)). Not useful for a wilab Integration; listed for completeness.

### Recommendation for wilab

**Use `/metrics` with an API key.** It is the only authenticated, officially maintained, machine-readable read path: single GET, stable gauge names, covers every monitor, and the API-key feature exists precisely to serve it. Fall back to the status-page JSON if the user prefers to expose a status page instead of creating a key. Avoid socket.io (unstable, credential-hungry, connection-heavy).

---

## 2. Portainer

### Auth: per-user access tokens in the `X-API-Key` header

Portainer's API is RESTful (JSON over HTTPS on port 9443, or 9000 legacy HTTP). Auth options ([Accessing the Portainer API](https://docs.portainer.io/api/access), [API usage examples](https://docs.portainer.io/api/examples)):

- **Access token (recommended):** created per user under *My account → Access tokens*; shown once at creation. Sent as an `X-API-Key: <token>` header. The token inherits exactly that user's permissions — a user scoped to one environment can only query that environment. ([docs](https://docs.portainer.io/api/access))
- **JWT:** `POST /api/auth` with username/password returns `{"jwt": "..."}` for a `Authorization: Bearer <jwt>` header — but it expires after 8 hours, so it's wrong for an unattended dashboard. ([docs](https://docs.portainer.io/api/examples))

A good pattern for wilab: the user creates a least-privilege Portainer user with read access to the relevant environment, then issues a token for it.

### Endpoints for glanceable status

**Environment summary — cheapest single call.** `GET /api/endpoints` lists environments; each carries a `Status` (`1 - up, 2 - down, 3 - provisioning, 4 - error`) and a `Snapshots` array whose `DockerSnapshot` already aggregates exactly what a tile wants — per [`api/portainer.go`](https://github.com/portainer/portainer/blob/develop/api/portainer.go) (struct `DockerSnapshot` and the `Endpoint` struct's `Status`/`Snapshots` fields):

```json
{
  "Id": 1, "Name": "local", "Status": 1,
  "Snapshots": [{
    "Time": 1755436800, "DockerVersion": "27.1.1",
    "ContainerCount": 24, "RunningContainerCount": 22,
    "StoppedContainerCount": 2, "HealthyContainerCount": 10,
    "UnhealthyContainerCount": 0, "StackCount": 8,
    "ImageCount": 41, "VolumeCount": 17
  }]
}
```

(Trimmed; field names verbatim from the struct's JSON tags in [`portainer.go`](https://github.com/portainer/portainer/blob/develop/api/portainer.go).) One request yields "22/24 running, 0 unhealthy" — ideal glanceable data. Caveat: snapshots are periodic (note the `Time` field), not live.

**Per-container states — Docker API proxy.** Portainer reverse-proxies the full Docker Engine API at `/api/endpoints/<ENVIRONMENT_ID>/docker/...`, e.g. `GET /api/endpoints/1/docker/containers/json?all=true` with the `X-API-Key` header; "the response is identical to that returned by the `ContainerList` operation of the Docker API" ([API usage examples](https://docs.portainer.io/api/examples)) — i.e. an array of containers each with `Id`, `Names`, `Image`, `State` (e.g. `"running"`), and human-readable `Status` (e.g. `"Up 2 hours"`) per the [Docker Engine API `ContainerList` reference](https://docs.docker.com/reference/api/engine/version/v1.44/#tag/Container/operation/ContainerList) that Portainer's docs link to.

**Stacks.** `GET /api/stacks` returns the stacks the token's user can access; each has `Id`, `Name`, `EndpointId`, `Type`, and a numeric `Status` ([API access docs example response](https://docs.portainer.io/api/access)) where `1 = active, 2 = inactive, 3 = deploying, 4 = error` per the `StackStatus` constants and the `Stack.Status` doc-comment in [`api/portainer.go`](https://github.com/portainer/portainer/blob/develop/api/portainer.go).

### Caveats and recommendation

- Requests hit HTTPS with (by default) a self-signed certificate on 9443 ([docs](https://docs.portainer.io/api/access)) — the Integration's HTTP client must tolerate that or use the user's real cert.
- Token permissions mirror the user's; insufficient permission yields `{"message": "Access denied", "details": "Unauthorized"}` ([docs](https://docs.portainer.io/api/access)).
- Environment IDs must be discovered via `/api/endpoints` first (or configured).

**Recommendation:** authenticate with an access token via `X-API-Key`; read `GET /api/endpoints` for the tile-level summary (running/stopped/unhealthy counts from the snapshot), and only fall through to the Docker proxy `containers/json` when a detail view needs per-container rows.

---

## 3. Home Assistant

### Auth: long-lived access token as a Bearer header

- Long-lived access tokens are created in the UI under the user's profile page ("Long-Lived Access Tokens" section) and are **valid for 10 years** — the docs call them out as "useful for integrating with third-party APIs" ([Auth API docs](https://developers.home-assistant.io/docs/auth_api/#long-lived-access-token)).
- Every REST call sends `Authorization: Bearer <TOKEN>` ([REST API docs](https://developers.home-assistant.io/docs/api/rest/)); an invalid/expired token returns HTTP 401 ([Auth API docs](https://developers.home-assistant.io/docs/auth_api/#making-authenticated-requests)).
- The alternative is the full OAuth2/IndieAuth flow with short-lived (1800 s) access tokens plus refresh tokens ([Auth API docs](https://developers.home-assistant.io/docs/auth_api/)) — needless complexity for a single-user homelab dashboard.

### REST API (default port 8123, JSON only)

Everything lives under `http://<host>:8123/api/` ([REST API docs](https://developers.home-assistant.io/docs/api/rest/)). The relevant reads for an Integration:

- `GET /api/` — liveness check, returns `{"message": "API running."}` (trailing slash required).
- `GET /api/states` — **the glanceable-status workhorse**: an array of every entity's state object.
- `GET /api/states/<entity_id>` — one entity; 404 if unknown. Example response (from the docs):

```json
{
  "entity_id": "sun.sun",
  "state": "below_horizon",
  "last_changed": "2016-05-30T21:43:29.204838+00:00",
  "last_updated": "2016-05-30T21:50:30.529465+00:00",
  "attributes": { "friendly_name": "Sun", "azimuth": 336.34 }
}
```

- `GET /api/config` — instance metadata (`version`, `location_name`, loaded `components`), a nice secondary tile datum.
- `POST /api/services/<domain>/<service>` — actions (e.g. toggle a light), if an Integration ever grows beyond read-only.

All shapes above verbatim from the [REST API docs](https://developers.home-assistant.io/docs/api/rest/). Caveat: `/api/states` returns *every* entity — hundreds on a real instance — so an Integration should let the user pick specific `entity_id`s and fetch them individually (or filter client-side).

### WebSocket API (push, at `/api/websocket`)

For live updates without polling: connect, receive `auth_required`, send `{"type": "auth", "access_token": "..."}` (the same long-lived token works — "For the WebSocket connection, pass the access token in the authentication message", [Auth API docs](https://developers.home-assistant.io/docs/auth_api/#making-authenticated-requests)), receive `auth_ok`, then issue id-tagged commands: `get_states` dumps all current states, and `subscribe_events` with `"event_type": "state_changed"` pushes an `event` message per state change containing `old_state`/`new_state` objects ([WebSocket API docs](https://developers.home-assistant.io/docs/api/websocket/)). The protocol also supports application-level `ping`/`pong` heartbeats ([same docs](https://developers.home-assistant.io/docs/api/websocket/#pings-and-pongs)).

### Recommendation

**Long-lived access token + REST polling of `/api/states/<entity_id>` for chosen entities.** It's the officially documented third-party path, one HTTPS GET per entity (or one for all), trivially cacheable server-side in wilab's single container. The WebSocket API is the upgrade path if push-fresh entity states ever matter, at the cost of a persistent connection per Home Assistant instance — overkill for a landing page's refresh cadence.

---

## Summary: what a wilab Integration can show, and how

| Service | Auth (stored credential) | Fetch mechanism | Glanceable data |
|---|---|---|---|
| Uptime Kuma | API key (`uk1_…`) as Basic Auth password | `GET /metrics` (Prometheus text) | Per-monitor up/down/pending/maintenance, response time, cert days, 1d/30d uptime ratios |
| Portainer | Access token in `X-API-Key` header | `GET /api/endpoints` (snapshot counts); `GET /api/endpoints/{id}/docker/containers/json` for detail | Running/stopped/healthy/unhealthy container counts, stack count/status, per-container state |
| Home Assistant | Long-lived access token as `Authorization: Bearer` | `GET /api/states` or `/api/states/<entity_id>` | Entity states + attributes (temperature, lights on, alarms, …) |

Common shape: all three fit wilab's Integration model of *stored credential + periodic authenticated GET returning parseable text/JSON*. None requires webhooks or callbacks; only Uptime Kuma requires a non-JSON (Prometheus text) parser. The two push options (Kuma socket.io, HA WebSocket) both demand persistent connections and are not needed for tile-level status.
