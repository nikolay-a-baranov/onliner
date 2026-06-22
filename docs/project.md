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

- `src/*.js`: active executable entries for current tools
- `src/actions.js`, `src/actions/*.js`: active action registry and feature
  behavior
- `src/runtime/`: context/scenario/group/command metadata and launchpad runtime
  helpers
- `src/runtime/launchpad/`: launchpad-specific runtime helpers such as loader,
  placement, and launchpad identity
- `src/core/*.js`: shared CMS/DOM/transform/widget/crawler helpers
- `src/core/surface/`: shared panel/toolbar/UI/design/icon system
- `src/pipe/*.js`: reusable text/content pipelines, including shared embed
  normalization in `src/pipe/markup.js`
- `src/report.js`: thin active crawler-report entry

### Isolated feature areas

- `src/actions/madtest.js` + `src/core/madtest.js`: active Madtest flow split
  between action behavior and shared helpers
- `src/legacy/*.js`: archived bookmarklets and historical helpers
- `src/legacy/external/*.js`: archived standalone external bookmarklets
- `src/legacy/editor.js`, `src/legacy/author.js`, `src/legacy/readmore.js`:
  transitional legacy entries that still build, but do not define the active
  architecture

### Build and site

- `tools/*.js`: build/check scripts
- `tools/current/tools.json`: active tool registry for current build outputs
- `tools/legacy/tools.json`: legacy-only registry for archived bookmarklets
- `tools/storefront/current/*`: current storefront source for `index.html`
- `tools/legacy/storefront/*`: legacy storefront template/metadata/assets for
  `legacy.html`
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
- For launchpad-specific runtime behavior such as tool loading or placement:
  - start in `src/runtime/launchpad/`
- For text/content transforms:
  - start in `src/pipe/`
- For one bookmarklet's startup and mount/unmount flow:
  - start in the relevant `src/*.js` entry

Read `docs/structure.md` for layer placement and `docs/architecture.md` for ownership rules before making runtime changes.
