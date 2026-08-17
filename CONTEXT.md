# Wilab

A single-user homelab landing page: a grid of links to self-hosted services, with live info pulled from services that expose an API, deployed as one Docker container.

## Language

**Service**:
An entry on the landing page: a name, a URL it links out to, a logo, and optional tags. The core unit everything else attaches to.
_Avoid_: App, bookmark, link, tile (tile is the visual rendering of a service, not the service itself)

**Catalog**:
The bundled list of Catalog entries that ships inside the app so a known service can be added without typing details by hand. Works offline.
_Avoid_: Registry, library

**Catalog entry**:
A predefined template in the Catalog: a known name, default URL, logo, and optional Integration. Distinct from a Service — many Services may come from one Catalog entry (two Sonarrs on different hosts).
_Avoid_: App definition

**Custom service**:
A service the user defines from scratch — not drawn from the catalog — with a user-supplied name, URL, and logo.

**Integration**:
The per-service client that fetches live information (via API key or login credentials) and the extra data it displays. A service may have zero or one integration.
_Avoid_: Enhanced app (Heimdall's term), widget, plugin

**Pinned section**:
A drag-orderable area at the top of the page holding services the user has pinned. Pinning is emphasis, not relocation: a pinned service also keeps its place in the main grid.

**Main grid**:
The flat, drag-orderable grid of all services below the pinned section. There are no category sections; organisation beyond ordering is done with tags.

**Tag**:
A user-defined label attached to a service, used to filter the main grid. Tags filter; they never group the layout.
_Avoid_: Category, group, folder

**Search provider**:
The web search engine the search bar submits to — chosen from a predefined list or defined by a custom URL template.

**Edit mode**:
The inline state of the landing page where services can be added, changed, removed, and re-ordered — including dialogs for details like integration credentials. There is no separate admin page for managing services.
