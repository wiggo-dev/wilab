# Research: logo & catalog sources for the 16 predefined services

Resolves [issue #2](https://github.com/wiggo-dev/wilab/issues/2). Investigated 2026-08-17 against primary sources (repo file listings via the GitHub API, LICENSE files, and dashboard source code — not secondary write-ups).

**Recommendation up front:** bundle logos from **[homarr-labs/dashboard-icons](https://github.com/homarr-labs/dashboard-icons)**. It covers all 16 Catalog services in SVG, PNG, and WebP (verified against the repo tree, not assumed), is Apache-2.0 licensed (redistribution inside our Docker image is expressly permitted), and is the same source the major dashboards (Homarr, Homepage) standardise on. Ship the SVGs plus a copy of the collection's LICENSE and a trademark disclaimer.

---

## 1. Coverage of the 16 services

### homarr-labs/dashboard-icons (recommended)

The collection's own index, [`metadata.json`](https://github.com/homarr-labs/dashboard-icons/blob/main/metadata.json), lists 3,125 icons. I cross-checked every one of our 16 services against the actual file trees of the [`svg/`](https://github.com/homarr-labs/dashboard-icons/tree/main/svg) (3,363 files), [`png/`](https://github.com/homarr-labs/dashboard-icons/tree/main/png) (4,066 files) and [`webp/`](https://github.com/homarr-labs/dashboard-icons/tree/main/webp) (4,058 files) directories via the GitHub git-trees API. **All 16 are present in all three formats.**

Per the [README's Technical Details](https://github.com/homarr-labs/dashboard-icons/blob/main/README.md): SVG is the original source format; PNG and WebP are auto-generated at 512 px height; names are kebab-case; `-light`/`-dark` suffixed variants exist for themed backgrounds.

| Service | Icon name (kebab-case) | SVG | PNG | WebP | Theme variants (from `metadata.json` `colors`) |
| --- | --- | :---: | :---: | :---: | --- |
| Home Assistant | `home-assistant` | ✅ | ✅ | ✅ | — |
| Zigbee2MQTT | `zigbee2mqtt` | ✅ | ✅ | ✅ | `zigbee2mqtt-light` for light-on-dark |
| ESPHome | `esphome` | ✅ | ✅ | ✅ | `esphome-light` |
| Sonarr | `sonarr` | ✅ | ✅ | ✅ | `sonarr-dark` |
| Radarr | `radarr` | ✅ | ✅ | ✅ | — |
| SABnzbd | `sabnzbd` | ✅ | ✅ | ✅ | `sabnzbd-light` |
| Prowlarr | `prowlarr` | ✅ | ✅ | ✅ | — |
| Portainer | `portainer` | ✅ | ✅ | ✅ | `portainer-dark` |
| Immich | `immich` | ✅ | ✅ | ✅ | — |
| Uptime Kuma | `uptime-kuma` | ✅ | ✅ | ✅ | — (aliases: `status-page`, `website-monitor`) |
| Jellyfin | `jellyfin` | ✅ | ✅ | ✅ | — |
| QNAP | `qnap` | ✅ | ✅ | ✅ | — |
| Plex | `plex` | ✅ | ✅ | ✅ | `plex-light` |
| VaultWarden | `vaultwarden` | ✅ | ✅ | ✅ | `vaultwarden-light` |
| Actual Budget | `actual-budget` | ✅ | ✅ | ✅ | — |
| Frigate | `frigate` | ✅ | ✅ | ✅ | `frigate-light` (aliases: `nvr`) |

Sources: file listings from the git-trees API for [`main:svg`](https://api.github.com/repos/homarr-labs/dashboard-icons/git/trees/main:svg), [`main:png`](https://api.github.com/repos/homarr-labs/dashboard-icons/git/trees/main:png), [`main:webp`](https://api.github.com/repos/homarr-labs/dashboard-icons/git/trees/main:webp); variant/alias data from [`metadata.json`](https://raw.githubusercontent.com/homarr-labs/dashboard-icons/main/metadata.json).

Note on the predecessor: `walkxcode/dashboard-icons` is not a separate collection any more — the GitHub API redirects it to `homarr-labs/dashboard-icons` (the repo was transferred to Homarr Labs), so there is only one canonical repo. Source: `GET /repos/walkxcode/dashboard-icons` resolves to `full_name: homarr-labs/dashboard-icons`.

### Alternatives considered

**[selfhst/icons](https://github.com/selfhst/icons) (selfh.st/icons)** — also covers **all 16** (verified against the [`svg/`](https://github.com/selfhst/icons/tree/main/svg) tree, 7,124 files, and [`png/`](https://github.com/selfhst/icons/tree/main/png) tree, 7,569 files, same kebab-case names). Larger collection; formats are SVG (most), PNG/WebP/AVIF/ICO (all), per the [README](https://github.com/selfhst/icons/blob/main/README.md). Two drawbacks for us: its [LICENSE](https://github.com/selfhst/icons/blob/main/LICENSE) is **CC-BY-4.0**, which adds a formal attribution requirement to redistribution, and custom-colored variants are gated behind a paid membership ([README, "Custom Colors"](https://github.com/selfhst/icons/blob/main/README.md)). A solid fallback if dashboard-icons ever lacks an icon.

**[simple-icons/simple-icons](https://github.com/simple-icons/simple-icons)** — **incomplete: 14/16**. Checked against the project's own data file [`data/simple-icons.json`](https://github.com/simple-icons/simple-icons/blob/master/data/simple-icons.json); **SABnzbd and Prowlarr are missing**. Icons are also monochrome single-path SVGs (brand glyphs, not full-color logos), which is the wrong look for service tiles. License is CC0-1.0 (GitHub license detection for the repo), but its [DISCLAIMER.md](https://github.com/simple-icons/simple-icons/blob/master/DISCLAIMER.md) stresses that CC0 on the collection does not imply the individual icons are CC0 and that trademark permissions remain the user's responsibility. Not suitable as the primary source.

## 2. Licensing of bundling the logos in our Docker image

**dashboard-icons is licensed Apache-2.0** — [LICENSE](https://github.com/homarr-labs/dashboard-icons/blob/main/LICENSE), copyright "(c) 2024 Bjorn Lammers, Meier Lukas, Thomas Camlong and Homarr Labs". What that means for bundling:

- **Copyright: clear.** Apache-2.0 §4 expressly permits reproducing and distributing copies "in any medium, with or without modifications", conditional on (a) including a copy of the license and (c) retaining attribution notices. So: ship a `LICENSE` / `NOTICE` copy for dashboard-icons alongside the bundled icons in the image (e.g. `catalog/icons/LICENSE`).
- **Trademarks: not granted by the license — same as everyone else.** Apache-2.0 §6 explicitly does *not* grant trademark rights, and the icons depict third-party trademarks the collection doesn't own anyway. The collection's own position is in the [README's Legal section](https://github.com/homarr-labs/dashboard-icons/blob/main/README.md#legal): "All product names, trademarks, and registered trademarks are the property of their respective owners. Icons are used for identification purposes only and do not imply endorsement." Using a logo to identify the service a tile links to is classic nominative fair use, and it is exactly what Heimdall (bundles icons in [linuxserver/Heimdall-Apps](https://github.com/linuxserver/Heimdall-Apps), MIT-licensed repo), Homarr, and Homepage all do. We should carry the same disclaimer in our README.
- Practical verdict: **bundling is fine.** Include the Apache-2.0 license text and a trademark disclaimer; no attribution-per-icon bookkeeping needed (unlike CC-BY-4.0 selfh.st).

## 3. Design reference: how comparable dashboards model predefined services

### Heimdall — the closest analogue to our Catalog

Heimdall is the only one of the three that ships a true predefined-app list. Each app lives in a folder in [linuxserver/Heimdall-Apps](https://github.com/linuxserver/Heimdall-Apps) containing `app.json`, the logo file, and (for apps with live stats) a PHP class + blade templates. Example, [`Sonarr/app.json`](https://github.com/linuxserver/Heimdall-Apps/blob/master/Sonarr/app.json):

```json
{
  "appid": "6e2a525ceb737f9ed8badcef5eb20d1502e39656",
  "name": "Sonarr",
  "website": "https://sonarr.tv",
  "license": "GNU General Public License v3.0 only",
  "description": "Sonarr is a PVR for Usenet and BitTorrent users. ...",
  "enhanced": true,
  "tile_background": "dark",
  "icon": "sonarr.svg",
  "config": {
    "type": "apikey",
    "stat1": { "name": "Missing", "url": ":url:api/v3/wanted/missing?...&apikey=:apikey:", "key": "totalRecords", ... },
    "stat2": { "name": "Queue", "url": ":url:api/v3/queue?apikey=:apikey:", "filter": "count", ... }
  }
}
```

Takeaways: stable id, display name, logo filename co-located with the entry, an `enhanced` flag marking that an Integration exists, and declarative stat endpoints keyed off the user's URL + API key. Notably **Heimdall does not store a default URL/port** — `website` is the project homepage, and the user always types the instance URL.

### Homepage — no catalog; icon-by-name convention

Homepage has no bundled service list; users define everything in `services.yaml`. Per [docs/configs/services.md](https://github.com/gethomepage/homepage/blob/main/docs/configs/services.md), a service is a named map with `href`, `description`, `icon`, and an optional `widget` (type + url + key — their Integration equivalent). The icon field's convention is the useful part: a bare name like `sonarr.svg` resolves against **dashboard-icons**, with prefixes `si-` (Simple Icons), `mdi-` (Material Design Icons), and `sh-` (selfh.st) for other sets. The docs explicitly warn these sets "are not bundled with Homepage, they are fetched in the browser from remote CDN servers" — the offline gap our bundled Catalog is designed to avoid.

### Homarr — no catalog; runtime icon index from the same repos

Homarr also ships no predefined list; apps are user-created records. Its icon picker fetches icon indexes at runtime, and the source ([`packages/icons/src/icons-fetcher.ts`](https://github.com/homarr-labs/homarr/blob/dev/packages/icons/src/icons-fetcher.ts)) hard-codes the repositories: dashboard-icons (first), selfh.st/icons, Simple Icons, Papirus, and homelab-svg-assets, all served via jsDelivr CDN, plus locally-uploaded icons. Again: dashboard-icons is the primary source, and offline use depends on user uploads.

### Implication for our Catalog format

None of the three stores a **default URL/port**, because none of them ships a "add this known service with sane defaults" flow — that's Wilab's differentiator, so we add it ourselves. A minimal catalog entry, borrowing Heimdall's shape:

```json
{
  "id": "sonarr",
  "name": "Sonarr",
  "defaultUrl": "http://{host}:8989",
  "logo": "icons/sonarr.svg",
  "integration": "sonarr"
}
```

- `id` doubles as the dashboard-icons kebab-case name (the table in §1 shows they match for all 16).
- `logo` points at the bundled SVG copied from dashboard-icons at build time (SVG only is sufficient — it's the source format and scales; skip PNG/WebP to keep the image small).
- `integration` is null for catalog entries without one, matching CONTEXT.md's "zero or one integration".
- Default ports per service are a separate small research task (each service's own docs are the primary source); they were out of scope for this ticket.

## Summary of the recommendation

1. **Source:** vendor the 16 SVGs from `homarr-labs/dashboard-icons` at build time (pin a commit; the repo tree is the source of truth). Coverage is 16/16, verified.
2. **License compliance:** include the collection's Apache-2.0 LICENSE next to the bundled icons and a "trademarks belong to their owners; used for identification only" disclaimer in our README.
3. **Catalog format:** a single bundled JSON array of `{id, name, defaultUrl, logo, integration}` entries, Heimdall-style, with the default-URL field that no comparable dashboard ships.
