# wilab

A single-user homelab landing page: a grid of links to self-hosted services, with live info pulled from services that expose an API.

## Development

```bash
pnpm install
pnpm dev
```

Config is stored in `./data/config.json` locally. Docker uses `/data` via `WILAB_DATA_DIR`.

## Catalog icons

Service logos are bundled from [homarr-labs/dashboard-icons](https://github.com/homarr-labs/dashboard-icons) (Apache-2.0). See `public/catalog/icons/LICENSE`.

All product names, trademarks, and registered trademarks are the property of their respective owners. Icons are used for identification purposes only and do not imply endorsement.
