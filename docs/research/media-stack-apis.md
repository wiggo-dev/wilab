# Research: media-stack integration APIs (Sonarr, Radarr, SABnzbd)

Resolves [issue #3](https://github.com/wiggo-dev/wilab/issues/3). Question: for each of Sonarr, Radarr, and SABnzbd, what authentication an **Integration** needs, which endpoints surface glanceable status for a dashboard tile, what the responses look like, and any version caveats.

**Primary sources used:**

- Sonarr OpenAPI 3.0 spec (source of truth for the v3 API): <https://github.com/Sonarr/Sonarr/blob/develop/src/Sonarr.Api.V3/openapi.json> (rendered at <https://sonarr.tv/docs/api/>)
- Radarr OpenAPI 3.0 spec: <https://github.com/Radarr/Radarr/blob/develop/src/Radarr.Api.V3/openapi.json> (rendered at <https://radarr.video/docs/api/>)
- SABnzbd official API reference: <https://sabnzbd.org/wiki/configuration/5.1/api> (source: <https://github.com/sabnzbd/sabnzbd.github.io/blob/master/wiki/configuration/5.1/api.html>)

All response shapes below are taken from those documents and trimmed to the fields a tile would use.

---

## Sonarr

### Authentication

The OpenAPI spec declares two interchangeable API-key schemes ([spec `securitySchemes`](https://github.com/Sonarr/Sonarr/blob/develop/src/Sonarr.Api.V3/openapi.json)):

- **`X-Api-Key` header** — "Apikey passed as header"
- **`apikey` query parameter** — "Apikey passed as query parameter"

Prefer the header so the key doesn't end up in proxy/access logs. The key is found in Sonarr under Settings → General.

### Version caveats

- All endpoints live under **`/api/v3/`**. The spec's own description states: *"The v3 API docs apply to both v3 and v4 versions of Sonarr. Some functionality may only be available in v4 of the Sonarr application."* ([spec `info.description`](https://github.com/Sonarr/Sonarr/blob/develop/src/Sonarr.Api.V3/openapi.json)) — so one Integration client covers Sonarr v3 and v4.
- No rate limits are documented anywhere in the spec.

### Endpoints of interest

All from the [Sonarr OpenAPI spec](https://github.com/Sonarr/Sonarr/blob/develop/src/Sonarr.Api.V3/openapi.json).

#### `GET /api/v3/queue/status` — queue badge in one cheap call

Returns a single `QueueStatusResource`:

```json
{ "totalCount": 5, "count": 5, "unknownCount": 0, "errors": false, "warnings": true }
```

Ideal tile primitive: item count plus error/warning flags, no paging.

#### `GET /api/v3/queue` — queue detail (paged)

Params: `page`, `pageSize` (default 10), `includeSeries`, `includeEpisode`, plus filters (`protocol`, `status`, `seriesIds`, …). Returns `QueueResourcePagingResource` (`page`, `pageSize`, `totalRecords`, `records[]`); each record (`QueueResource`) includes:

```json
{
  "title": "…", "status": "downloading", "protocol": "usenet",
  "size": 1277650000, "sizeleft": 1271580000,
  "timeleft": "00:16:44", "estimatedCompletionTime": "2026-08-17T15:30:00Z",
  "trackedDownloadStatus": "ok", "indexer": "…", "downloadClient": "…",
  "seriesId": 1, "episodeId": 2, "seasonNumber": 4
}
```

`status` enum: `unknown, queued, paused, downloading, completed, failed, warning, delay, downloadClientUnavailable, fallback`. Note: no download-speed field — Sonarr delegates downloading to a client (e.g. SABnzbd); speed comes from there.

#### `GET /api/v3/calendar?start=…&end=…` — upcoming episodes

Params: `start`/`end` (date-time), `unmonitored` (default false), `includeSeries` (default false — turn on to get series titles in one call). Returns an array of `EpisodeResource`:

```json
[{ "seriesId": 1, "title": "Episode Title", "airDateUtc": "2026-08-18T01:00:00Z",
   "seasonNumber": 4, "episodeNumber": 11, "hasFile": false, "monitored": true,
   "series": { "title": "Show Name" } }]
```

#### `GET /api/v3/health` — warnings/errors

Array of `HealthResource`; empty array means all healthy:

```json
[{ "source": "IndexerStatusCheck", "type": "warning",
   "message": "Indexers unavailable due to failures: …", "wikiUrl": "…" }]
```

`type` enum: `ok, notice, warning, error`.

#### Counts and extras

- `GET /api/v3/wanted/missing` — paged; use `totalRecords` with `pageSize=1` as a "missing episodes" count.
- `GET /api/v3/series` — array of all series (series count = length); each has a `statistics` object: `seasonCount`, `episodeCount`, `episodeFileCount`, `totalEpisodeCount`, `percentOfEpisodes`, `sizeOnDisk`.
- `GET /api/v3/system/status` — `SystemResource` with `appName`, `instanceName`, `version`, `branch`, `startTime` (good for a version/up check).
- `GET /api/v3/diskspace` — `[{ "path", "label", "freeSpace", "totalSpace" }]`.

---

## Radarr

### Authentication

Identical to Sonarr — the spec declares the same two schemes ([spec `securitySchemes`](https://github.com/Radarr/Radarr/blob/develop/src/Radarr.Api.V3/openapi.json)):

- **`X-Api-Key` header**, or
- **`apikey` query parameter**

### Version caveats

- Endpoints live under **`/api/v3/`**; the spec's `info.version` is `3.0.0` and current Radarr releases (v4/v5 application versions) still serve this v3 API — the project publishes only v3 docs at <https://radarr.video/docs/api/>.
- No rate limits documented in the spec.

### Endpoints of interest

All from the [Radarr OpenAPI spec](https://github.com/Radarr/Radarr/blob/develop/src/Radarr.Api.V3/openapi.json). The API mirrors Sonarr's shape with movies in place of episodes.

#### `GET /api/v3/queue/status`

Same `QueueStatusResource` shape as Sonarr: `totalCount`, `count`, `unknownCount`, `errors`, `warnings`.

#### `GET /api/v3/queue` — queue detail (paged)

Params: `page`, `pageSize`, `includeMovie`, `movieIds`, `protocol`, `status`, …. Returns `QueueResourcePagingResource`; each `QueueResource` record:

```json
{ "title": "…", "status": "downloading", "movieId": 42,
  "size": 8500000000, "sizeleft": 4200000000, "timeleft": "00:41:10",
  "estimatedCompletionTime": "…", "trackedDownloadStatus": "ok",
  "indexer": "…", "downloadClient": "…" }
```

#### `GET /api/v3/calendar?start=…&end=…` — upcoming releases

Params: `start`, `end`, `unmonitored` (default false), `tags`. Returns an array of full `MovieResource` objects (unlike Sonarr's episode objects); relevant fields:

```json
[{ "title": "Movie Title", "year": 2026, "status": "announced",
   "inCinemas": "2026-08-20T00:00:00Z", "digitalRelease": "2026-09-10T00:00:00Z",
   "physicalRelease": "2026-10-01T00:00:00Z", "hasFile": false, "monitored": true }]
```

A movie appears based on its release dates (cinema/digital/physical), so a tile should pick whichever date falls in the window.

#### `GET /api/v3/health`

Same shape as Sonarr: array of `{ source, type: ok|notice|warning|error, message, wikiUrl }`.

#### Counts and extras

- `GET /api/v3/wanted/missing` — paged `MovieResourcePagingResource`; `totalRecords` = missing-movies count.
- `GET /api/v3/movie` — array of all movies (library count = length); each has `sizeOnDisk` and a `statistics` object (`movieFileCount`, `sizeOnDisk`). Heavier payload than Sonarr's series list for large libraries.
- `GET /api/v3/system/status`, `GET /api/v3/diskspace` — same shapes as Sonarr.

---

## SABnzbd

### Authentication

From the [official API reference](https://sabnzbd.org/wiki/configuration/5.1/api):

- Single endpoint `http://host:port/api`; every call is `?mode=<function>` plus parameters.
- **`apikey=APIKEY` query parameter is required on every request** (no header scheme is documented). Missing key → `error: API Key Required`; wrong key → `error: API Key Incorrect`.
- A separate **NZB key** exists that can *only* add jobs to the queue; any other call with it returns `error: API Key Incorrect`.
- `mode=version` and `mode=auth` require no key at all (useful as an unauthenticated reachability probe).
- Output format: `output=json` (default) or `output=xml`.

### Version caveats / "api modes"

- The API is organised around the **`mode=` parameter** (queue, history, status, warnings, server_stats, config functions, …) rather than REST paths — see the [function tables in the reference](https://sabnzbd.org/wiki/configuration/5.1/api).
- Docs are versioned per SABnzbd release (4.5 / 5.0 / 5.1 / 5.2 directories in the [docs repo](https://github.com/sabnzbd/sabnzbd.github.io/tree/master/wiki/configuration)); `/wiki/advanced/api` redirects to the current version (5.1 at time of writing).
- **Numeric values arrive as strings** (e.g. `"kbpersec": "1296.02"`, `"have_warnings": "0"`) and sizes as human-formatted strings (`"speed": "1.3 M"`, `"size": "1.2 GB"`) — parse `kbpersec`/`mb`/`mbleft` for arithmetic. Shapes shown in the [queue example](https://sabnzbd.org/wiki/configuration/5.1/api#queue).
- No rate limits documented; `mode=history` supports `last_history_update` so a poller can skip unchanged payloads, and `mode=status` supports `skip_dashboard=1` to skip the slow public-IP lookup.

### Endpoints (modes) of interest

#### `api?mode=queue` — the one call that powers a tile

Optional `start`, `limit`, `cat`, `search`, `nzo_ids`, `status` filters. [Response](https://sabnzbd.org/wiki/configuration/5.1/api#queue) (trimmed):

```json
{ "queue": {
    "status": "Downloading", "paused": false,
    "speed": "1.3 M", "kbpersec": "1296.02",
    "timeleft": "0:16:44", "size": "1.2 GB", "sizeleft": "1.2 GB",
    "noofslots_total": 2, "have_warnings": "0",
    "speedlimit": "9", "speedlimit_abs": "4718592.0",
    "diskspace1": "161.16", "diskspacetotal1": "465.21",
    "version": "5.x.x",
    "slots": [{ "filename": "TV.Show.S04E11.720p.HDTV.x264", "status": "Downloading",
                "percentage": "0", "timeleft": "0:16:44", "mb": "1277.65",
                "mbleft": "1271.59", "cat": "tv", "priority": "Normal",
                "nzo_id": "SABnzbd_nzo_p86tgx" }]
} }
```

Download speed (`kbpersec`), pause state, time left, queue size, per-job progress, warning count, and free disk space — everything glanceable in one request.

#### `api?mode=history` — recent completions and totals

Optional `limit`, `failed_only`, `last_history_update`. [Response](https://sabnzbd.org/wiki/configuration/5.1/api#history) includes rolled-up transfer stats plus per-job slots:

```json
{ "history": { "noofslots": 220, "day_size": "1.9 G", "week_size": "30.4 G",
    "month_size": "167.3 G", "total_size": "678.1 G",
    "slots": [{ "name": "TV.Show.S04E02.720p.BluRay.x264-xHD", "status": "Completed",
                "size": "2.3 GB", "completed": 1469172988, "fail_message": "" }] } }
```

#### `api?mode=warnings` — active warnings/errors

[Response](https://sabnzbd.org/wiki/configuration/5.1/api#warnings):

```json
{ "warnings": [{ "text": "Thread 3@news.example.com:119: login failed",
                 "type": "ERROR", "time": 1505139501 }] }
```

#### `api?mode=server_stats` — transfer totals in bytes

Numeric (not string) totals: `{ "day": 2352634799, "week": …, "month": …, "total": …, "servers": { … } }` ([reference](https://sabnzbd.org/wiki/configuration/5.1/api#server_stats)).

#### `api?mode=fullstatus` — deep status (per-news-server state, uptime, orphans)

Heavier call; pass `skip_dashboard=1` to avoid the public-IP lookup ([reference](https://sabnzbd.org/wiki/configuration/5.1/api#fullstatus)). Mostly unnecessary for a tile since `mode=queue` already carries speed/warnings/disk space.

---

## Summary: what a wilab Integration tile can show

| Service | Auth | Tile data | Calls |
|---|---|---|---|
| Sonarr | `X-Api-Key` header (or `apikey` query), `/api/v3` for both v3 & v4 | queue count + error/warning flags, health, next airing episodes, missing count | `queue/status`, `health`, `calendar`, (`wanted/missing`) |
| Radarr | Same as Sonarr, `/api/v3` | queue count + flags, health, upcoming releases, missing count | `queue/status`, `health`, `calendar`, (`wanted/missing`) |
| SABnzbd | `apikey` query param only | download speed, pause state, time left, queue size, warnings, disk space | `mode=queue` (plus `mode=history` for totals) |

Polling guidance: none of the three documents rate limits; all are designed for polling UIs (SABnzbd even provides `last_history_update` for cheap change detection). A tile polling every few seconds is in line with what each product's own web UI does.
