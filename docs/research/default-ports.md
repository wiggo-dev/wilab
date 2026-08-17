# Research: default URLs/ports for the 16 Catalog services

Resolves [issue #10](https://github.com/wiggo-dev/wilab/issues/10). Map: [issue #1](https://github.com/wiggo-dev/wilab/issues/1).

Each Catalog entry stores a `defaultUrl` for its Service. This note records, for each of
the 16 predefined services, the default port (and scheme/path where relevant) that the
service's **own documentation, official Docker image, or source code** declares.
`<host>` is a placeholder the user fills in when adding the service.

## Summary table

| Service | Suggested `defaultUrl` | Scheme/path notes | Source |
| --- | --- | --- | --- |
| Home Assistant | `http://<host>:8123` | HTTP; no path | [HA `http` integration docs](https://www.home-assistant.io/integrations/http/) |
| Zigbee2MQTT | `http://<host>:8080` | HTTP; frontend must be enabled in config | [Z2M frontend docs](https://www.zigbee2mqtt.io/guide/configuration/frontend.html) |
| ESPHome | `http://<host>:6052` | HTTP; Device Builder dashboard | [ESPHome Docker docs](https://esphome.io/install/docker/) |
| Sonarr | `http://<host>:8989` | HTTP; no path | [Sonarr source, `ConfigFileProvider.cs`](https://github.com/Sonarr/Sonarr/blob/develop/src/NzbDrone.Core/Configuration/ConfigFileProvider.cs) |
| Radarr | `http://<host>:7878` | HTTP; no path | [Radarr source, `ConfigFileProvider.cs`](https://github.com/Radarr/Radarr/blob/develop/src/NzbDrone.Core/Configuration/ConfigFileProvider.cs) |
| SABnzbd | `http://<host>:8080` | HTTP; no path | [SABnzbd source, `constants.py`](https://github.com/sabnzbd/sabnzbd/blob/develop/sabnzbd/constants.py) |
| Prowlarr | `http://<host>:9696` | HTTP; no path | [Prowlarr source, `ConfigFileProvider.cs`](https://github.com/Prowlarr/Prowlarr/blob/develop/src/NzbDrone.Core/Configuration/ConfigFileProvider.cs) |
| Portainer | `https://<host>:9443` | **HTTPS** (self-signed cert by default); 9000 is legacy HTTP | [Portainer CE install docs](https://docs.portainer.io/start/install-ce/server/docker/linux) |
| Immich | `http://<host>:2283` | HTTP; no path | [Immich official `docker-compose.yml`](https://github.com/immich-app/immich/blob/main/docker/docker-compose.yml) |
| Uptime Kuma | `http://<host>:3001` | HTTP; no path | [Uptime Kuma source, `server/config.js`](https://github.com/louislam/uptime-kuma/blob/master/server/config.js) |
| Jellyfin | `http://<host>:8096` | HTTP; HTTPS (8920) exists but is off by default | [Jellyfin networking docs](https://jellyfin.org/docs/general/networking/) |
| QNAP | `http://<host>:8080` | HTTP; HTTPS is 443; varies by config | [QNAP service ports (QTS 5.2.x)](https://docs.qnap.com/operating-system/qts/5.2.x/en-us/qnap-service-ports-C25795F.html) |
| Plex | `http://<host>:32400/web` | HTTP; **`/web` path required** for the local web app | [Plex: Opening Plex Web App](https://support.plex.tv/articles/200288666-opening-plex-web-app/) |
| Vaultwarden | `http://<host>` (container port 80) | HTTP; no canonical host port — see caveats | [Vaultwarden `Dockerfile.debian`](https://github.com/dani-garcia/vaultwarden/blob/main/docker/Dockerfile.debian) |
| Actual Budget | `http://<host>:5006` | HTTP; no path | [Actual Budget Docker docs](https://actualbudget.org/docs/install/docker) |
| Frigate | `http://<host>:8971` | HTTP; authenticated UI port (not 5000 — see caveats) | [Frigate installation docs](https://docs.frigate.video/frigate/installation/) |

## Per-service notes and caveats

### Home Assistant — 8123

The [`http` integration docs](https://www.home-assistant.io/integrations/http/) state that
`server_port` defaults to `8123` for Home Assistant Container. **Caveat:** the same page
notes that starting with Home Assistant 2026.8, the default for Home Assistant *OS*
installs is port `80`. The docs' own examples still use `8123`, and every pre-2026.8
install and all Container installs remain on `8123`, so `http://<host>:8123` is the
sensible Catalog default — but HA OS users on new installs may need plain `http://<host>`.

### Zigbee2MQTT — 8080, frontend must be enabled

The [frontend docs](https://www.zigbee2mqtt.io/guide/configuration/frontend.html) say the
built-in web frontend is only served when `frontend: enabled: true` is set in
`configuration.yaml`, and that it then starts on port `8080` (the config reference lists
`port: 8080` as "Optional, default: 8080"). The same page notes the official Dockerfile
uses `EXPOSE 8080`. **Caveats:** (1) no frontend at all unless enabled; (2) under the
Home Assistant add-on the frontend is forced to port `8099` for Ingress; (3) `8080`
collides with SABnzbd's and QNAP's defaults on the same host.

### ESPHome — 6052

The official [Docker guide](https://esphome.io/install/docker/) says the Device Builder
dashboard "is then available at `localhost:6052`" and its non-host-networking example
publishes `-p 6052:6052`. **Caveat:** when run as a Home Assistant add-on the dashboard
is normally reached through HA Ingress rather than a direct port.

### Sonarr — 8989

Sonarr publishes no official Docker image
([servarr wiki](https://wiki.servarr.com/sonarr/installation/docker)), so the
authoritative default is in the source:
[`ConfigFileProvider.cs`](https://github.com/Sonarr/Sonarr/blob/develop/src/NzbDrone.Core/Configuration/ConfigFileProvider.cs)
has `public int Port => _serverOptions.Port ?? GetValueInt("Port", 8989);`.

### Radarr — 7878

Same situation as Sonarr (no official image):
[`ConfigFileProvider.cs`](https://github.com/Radarr/Radarr/blob/develop/src/NzbDrone.Core/Configuration/ConfigFileProvider.cs)
has `public int Port => _serverOptions.Port ?? GetValueInt("Port", 7878);`.

### SABnzbd — 8080

[`sabnzbd/constants.py`](https://github.com/sabnzbd/sabnzbd/blob/develop/sabnzbd/constants.py)
defines `DEF_PORT = 8080`. **Caveat:** collides with Zigbee2MQTT's frontend default and
QNAP's admin default; users running several of these will have remapped at least one.

### Prowlarr — 9696

No official image;
[`ConfigFileProvider.cs`](https://github.com/Prowlarr/Prowlarr/blob/develop/src/NzbDrone.Core/Configuration/ConfigFileProvider.cs)
defines `public const int DEFAULT_PORT = 9696;`.

### Portainer — 9443 (HTTPS), 9000 legacy

The [CE install docs](https://docs.portainer.io/start/install-ce/server/docker/linux)
state: "By default, Portainer Server will expose the UI over port `9443`", secured with a
self-signed certificate, and the login instructions use `https://localhost:9443`.
**Caveat:** HTTP port `9000` is described only as an optional mapping "for legacy
reasons"; older installs may still use `http://<host>:9000`. The self-signed cert means
browsers will warn on the default URL.

### Immich — 2283

The official
[`docker-compose.yml`](https://github.com/immich-app/immich/blob/main/docker/docker-compose.yml)
(the same file the [install docs](https://immich.app/docs/install/docker-compose) tell
users to download) maps `'2283:2283'` for the immich-server container.

### Uptime Kuma — 3001

[`server/config.js`](https://github.com/louislam/uptime-kuma/blob/master/server/config.js)
falls back to `3001` when no `--port` argument or `UPTIME_KUMA_PORT`/`PORT` env var is
set; the official [`docker/dockerfile`](https://github.com/louislam/uptime-kuma/blob/master/docker/dockerfile)
has `EXPOSE 3001`, and the [README](https://github.com/louislam/uptime-kuma/blob/master/README.md)
docker run example is `-p 3001:3001` ("http://localhost:3001").

### Jellyfin — 8096 (HTTP)

The [networking docs](https://jellyfin.org/docs/general/networking/) port-binding table
lists `8096/TCP` as "Default HTTP" and `8920/TCP` as "Default HTTPS", noting "By default
this [HTTPS] port will not be used" because HTTPS requires a certificate. So
`http://<host>:8096` is the correct default.

### QNAP — 8080 (HTTP) / 443 (HTTPS), varies

QNAP's official [service ports table (QTS 5.2.x)](https://docs.qnap.com/operating-system/qts/5.2.x/en-us/qnap-service-ports-C25795F.html)
lists "NAS Web" as `8080` and "NAS Web (HTTPS)" as `443`. **Caveats:** this is the most
config-dependent entry in the Catalog. The [system administration settings docs](https://docs.qnap.com/operating-system/qts/5.0.x/en-us/configuring-system-administration-settings-F6C72493.html)
show the system port is user-configurable and that forcing HTTPS is a common setting;
newer QTS versions also disable URL redirection to the login page by default, so the port
must be typed explicitly. `http://<host>:8080` is the documented default, but expect many
real installs on `https://<host>:443` or a custom port.

### Plex — 32400 with `/web` path

[Opening Plex Web App](https://support.plex.tv/articles/200288666-opening-plex-web-app/)
documents the local web app URL as `http://server.local.ip.address:32400/web` (or
`http://localhost:32400/web` on the server itself). The `/web` path is part of the URL —
`http://<host>:32400` alone is the API root, not the app.

### Vaultwarden — container port 80, no canonical host port

The official image's
[`Dockerfile.debian`](https://github.com/dani-garcia/vaultwarden/blob/main/docker/Dockerfile.debian)
sets `ROCKET_PORT=80` and `EXPOSE 80`, so the *container* listens on 80. **Caveat:**
there is no documented default *host* port — the
[README](https://github.com/dani-garcia/vaultwarden/blob/main/README.md) deployment
example publishes `127.0.0.1:8000:80` and explicitly recommends running behind a reverse
proxy (Bitwarden clients require HTTPS). A `defaultUrl` of `http://<host>` (port 80) is
the least-wrong guess, but this entry will need user adjustment more often than most.

### Actual Budget — 5006

The official [Docker install docs](https://actualbudget.org/docs/install/docker) run the
image with `-p 5006:5006` and describe it as "sets the port to access Actual".

### Frigate — 8971 (authenticated UI)

The [installation docs](https://docs.frigate.video/frigate/installation/) ports table
lists `8971` as "Authenticated UI and API access without TLS" and `5000` as "Internal
unauthenticated UI and API access. Access to this port should be limited." **Caveat:**
much older guidance pointed at `5000`; since authentication was introduced, `8971` is the
port users are meant to browse to, so `http://<host>:8971` is the right default.

## Cross-cutting observations

- **Port collisions**: Zigbee2MQTT, SABnzbd, and QNAP all default to `8080`. The Catalog
  can still ship all three defaults, but users running more than one will have remapped.
- **Scheme matters**: Portainer is the only service whose primary default is HTTPS
  (self-signed). Everything else defaults to plain HTTP on a LAN.
- **Path matters**: only Plex requires a path (`/web`) in its default URL.
- **Weakest defaults**: Vaultwarden (no canonical host port) and QNAP (model/config
  dependent) are the two entries where the stored `defaultUrl` is most likely to be
  edited by the user.
