# Project

## What this repository is

This repository contains bookmarklets and supporting tooling for Onliner
editorial workflows, related service tools, and a small set of isolated
external bookmarklets.

The main user-facing flow is:

- source bookmarklet code in `src/`
- build/publish through `tools/build.js`
- generated loaders and scripts in `dist/`
- generated legacy storefront page from `tools/legacy/storefront/template.html`
  and its legacy assets

## Main parts

### Bookmarklet source

- `src/*.js`: active bookmarklet entry files
- `src/runtime/*.js`: runtime metadata and scenario resolution
- `src/core/*.js`: shared UI, adapters, and helpers
- `src/core/actions.js`, `src/core/actions/*.js`: action execution layer
- `src/pipe/*.js`: reusable text/content transforms

### Isolated feature areas

- `src/madtest/*.js`: Madtest feature area
- `src/external/*.js`: external one-off bookmarklets
- `src/legacy/*.js`: historical archive, not active runtime code

### Build and site

- `tools/*.js`: build/check scripts
- `tools/catalog.json`: active launcher/dist tool build catalog
- `tools/legacy/storefront/storefront.json`: legacy storefront metadata
- `tools/legacy/storefront/template.html`: legacy storefront template used only
  by opt-in storefront build
- `tools/legacy/storefront/app.js`, `tools/legacy/storefront/styles.css`:
  legacy storefront assets
- `index.html`, `dist/`: generated outputs

## Source vs generated

Source of truth:

- `src/`
- `tools/`
- docs in `docs/`

Generated output:

- `index.html`
- `dist/`
- `dist/loaders/`
- `dist/manifest.json`

When behavior needs to change, update the source layer and regenerate outputs.

## Where to start when changing behavior

- For runtime availability, command/group/scenario questions:
  - start in `src/runtime/`
- For command execution:
  - start in `src/core/actions.js` and `src/core/actions/*.js`
- For shared panel/UI behavior:
  - start in `src/core/toolbar.js`, `src/core/ui.js`, `src/core/panel.js`
- For text/content transforms:
  - start in `src/pipe/`
- For one bookmarklet's startup and mount/unmount flow:
  - start in the relevant `src/*.js` entry

Read `docs/structure.md` for layer placement and `docs/architecture.md` for ownership rules before making runtime changes.
