# Project

## What this repository is

This repository contains bookmarklets and supporting tooling for Onliner
editorial workflows, related service tools, and a small set of archived
external bookmarklets that still build into the legacy storefront.

The main user-facing flow is:

- source bookmarklet code in `src/`
- build through `tools/build.js`
- generated runtime bundle, standalone tools, loaders, and manifests in `dist/`
- generated current storefront page in `index.html` from
  `tools/storefront/current/*`
- generated legacy storefront page in `legacy.html` from
  `tools/legacy/storefront/*`
- GitHub Pages currently publishes the repository checkout after build

The installed Launchpad bookmarklet stores a small loader, not the full
application. It loads `dist/launchpad.js` from GitHub Pages on every run.
`dist/launchpad.js` contains embedded runtime/action modules, while standalone
tools such as reader, mirror, report, Madtest entries, and transitional legacy
entries remain separate generated files under `dist/` and may be loaded
dynamically.

## Main parts

### Bookmarklet source

- `src/*.js`: active executable entries for current tools
- `src/actions.js`, `src/actions/*.js`: active action registry and feature
  behavior
- `src/actions/diagnostics/`: tracked diagnostics scripts invoked through the
  `diagnostics` action
- `src/runtime/`: context/scenario/group/command metadata and launchpad runtime
  helpers
- `src/runtime/launchpad/`: launchpad-specific runtime helpers such as loader,
  placement, and launchpad identity
- `src/core/*.js`: shared CMS/DOM/transform/widget/crawler helpers
- `src/core/diagnostics.js`: diagnostics availability and script selection
  config used by runtime scenarios and action execution
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

GitHub Pages delivery:

- the current workflow uploads the repository root after running the build
- runtime-critical public paths are the generated storefront pages and `dist/**`
- source, docs, QA material, editor config, and server-only files are repository
  content, not runtime dependencies
- the long-term target is a build-owned publish directory so the workflow can
  deploy only the public artifact without duplicating build knowledge
- changing this boundary requires compatibility checks for Launchpad,
  standalone, and legacy bookmarklets

When behavior needs to change, update the source layer and regenerate outputs.

## Where to start when changing behavior

- For runtime availability, command/group/scenario questions:
  - start in `src/runtime/`
- For command execution:
  - start in `src/actions.js` and `src/actions/*.js`
- For diagnostics availability or script selection:
  - start in `src/core/diagnostics.js`
  - command visibility is attached in `src/runtime/scenarios.js`
  - script execution lives in `src/actions/diagnostics.js` and
    `src/actions/diagnostics/`
- For shared panel/UI behavior:
  - start in `src/core/surface/toolbar.js`, `src/core/surface/ui.js`,
    `src/core/surface/panel.js`
- For hotkey behavior:
  - keep command hotkey metadata in `src/runtime/commands.js`
  - route hotkey execution through the same click/action path as mouse and touch
    input
- For launchpad-specific runtime behavior such as tool loading or placement:
  - start in `src/runtime/launchpad/`
- For text/content transforms:
  - start in `src/pipe/`
- For one bookmarklet's startup and mount/unmount flow:
  - start in the relevant `src/*.js` entry

Read `docs/structure.md` for layer placement and `docs/architecture.md` for ownership rules before making runtime changes.
