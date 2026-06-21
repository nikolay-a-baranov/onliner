# Project

## What this repository is

This repository contains bookmarklets and supporting tooling for Onliner
editorial workflows, related service tools, and a small set of archived
external bookmarklets that still build into the legacy storefront.

The main user-facing flow is:

- source bookmarklet code in `src/`
- build/publish through `tools/build.js`
- generated loaders and scripts in `dist/`
- generated current storefront page in `index.html` from
  `tools/storefront/current/*`
- generated legacy storefront page in `legacy.html` from
  `tools/legacy/storefront/*`

## Main parts

### Bookmarklet source

- `src/*.js`: active bookmarklet entry files
- `src/runtime/`: runtime metadata, scenario resolution, and runtime-owned
  feature helpers
- `src/core/*.js`: shared UI, adapters, and helpers
- `src/actions.js`, `src/actions/*.js`: active action execution layer
- `src/pipe/*.js`: reusable text/content transforms, including shared embed
  normalization in `src/pipe/markup.js`
- `src/report.js`: thin active report service entry

### Isolated feature areas

- `src/madtest/*.js`: Madtest feature area
- `src/legacy/external/*.js`: archived external one-off bookmarklets
- `src/legacy/*.js`: historical archive, not active runtime code; includes
  legacy-only helpers such as `src/legacy/more.js`
- `src/legacy/editor.js`, `src/legacy/author.js`: transitional authoring tools
  still built by the current launchpad
- `src/legacy/readmore.js`: transitional standalone readmore bookmarklet still
  built by the current launchpad

### Build and site

- `tools/*.js`: build/check scripts
- `tools/current/tools.json`: active launchpad/dist tool registry
- `tools/legacy/tools.json`: legacy-only tool registry for archived standalone bookmarklets
- `tools/storefront/current/*`: current storefront source
- `tools/legacy/storefront/storefront.json`: legacy storefront metadata
- `tools/legacy/storefront/template.html`: legacy storefront template used only
  by legacy storefront build
- `tools/legacy/storefront/app.js`, `tools/legacy/storefront/styles.css`:
  legacy storefront assets
- `index.html`, `legacy.html`, `dist/`: generated outputs

## Source vs generated

Source of truth:

- `src/`
- `tools/`
- docs in `docs/`

Generated output:

- `index.html`
- `legacy.html`
- `dist/`
- `dist/loaders/`
- `dist/manifest.json`

When behavior needs to change, update the source layer and regenerate outputs.

## Where to start when changing behavior

- For runtime availability, command/group/scenario questions:
  - start in `src/runtime/`
- For command execution:
  - start in `src/actions.js` and `src/actions/*.js`
- For shared panel/UI behavior:
- start in `src/core/surface/toolbar.js`, `src/core/surface/ui.js`,
  `src/core/surface/panel.js`
- For text/content transforms:
  - start in `src/pipe/`
- For one bookmarklet's startup and mount/unmount flow:
  - start in the relevant `src/*.js` entry

Read `docs/structure.md` for layer placement and `docs/architecture.md` for ownership rules before making runtime changes.
