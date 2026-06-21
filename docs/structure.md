# Structure

## Source layers

### `src/*.js`

Active bookmarklet entry files.

These are executable entrypoints that may be referenced from
`tools/current/tools.json` or `tools/legacy/tools.json`
and bundled into `dist/`.

Current active entry areas include:

- launchpad runtime entry: `src/launchpad.js`
- newsroom/editor tools: `src/legacy/editor.js`, `src/legacy/author.js`,
  `src/reader.js`
- content/service tools: `src/report.js`

Rules:

- entries may depend on `src/runtime/*.js`, `src/core/*.js`, and `src/pipe/*.js`
- entries own feature startup, mount/unmount, and feature-local side effects
- entries should not become the source of truth for shared command metadata

### `src/runtime/*.js`

Runtime metadata and resolution layer.

Current responsibilities:

- page/context detection
- scenario matching and resolution
- command and group metadata
- tool loading and runtime run flow

Current files:

- `src/runtime/context.js`
- `src/runtime/scenarios.js`
- `src/runtime/commands.js`
- `src/runtime/groups.js`
- `src/runtime/launchpad/*`: launchpad-only runtime helpers that are not generic
  enough for `src/core/*` and not entrypoint orchestration; current examples:
  placement persistence/bounds, tool-bundle loading, and launchpad identity/preview

Rules:

- runtime owns metadata and resolution logic
- runtime should not depend on feature entries in `src/*.js`
- runtime should not own feature-specific DOM flows
- runtime should describe commands/groups/scenarios, not execute feature behavior directly
- runtime subfolders are allowed when they keep one feature/runtime boundary
  together without creating a second generic helper layer

Known debt:

- launchpad command metadata ownership is currently split across runtime files,
  `src/launchpad.js`, and `src/actions.js`
- resolve that ownership split before broad command-system refactors
- the current ownership decision and migration order are tracked in
  `docs/decisions/AD-001-command-metadata.md`

### `src/core/*.js`

Shared core layer.

Current responsibilities:

- shared UI and panel primitives
- shared toolbar behavior and persistence
- shared CMS/editor/DOM adapters
- shared icons, design tokens, CSS generators
- shared transform helpers

Current file groups:

- surface system:
  - `src/core/surface/panel.js`
  - `src/core/surface/toolbar.js`
  - `src/core/surface/ui.js`
  - `src/core/surface/css.js`
  - `src/core/surface/design.js`
  - `src/core/surface/icon.js`
  - `src/core/surface/ux.js`
- CMS/editor/browser adapters:
  - `src/core/cms.js`
  - `src/core/dom.js`
  - `src/core/edit.js`
  - `src/core/hotkeys.js`
- low-level text/content helpers:
  - `src/core/transform.js`
  - `src/core/escape.js`
  - `src/core/block.js`
  - `src/core/markup.js`
  - `src/core/widget.js`
- specialized shared service:
  - `src/core/crawler.js`

Current folder candidate:

- `src/core/surface/`
  The only `core` subfolder that currently has enough internal cohesion to be
  worth a real migration.
  Candidate contents:
  - `surface/panel.js`
  - `surface/toolbar.js`
  - `surface/ui.js`
  - `surface/ux.js`
  - `surface/css.js`
  - `surface/design.js`
  - `surface/icon.js`
  Why this one:
  - these files already form one shared surface subsystem
  - they are reused together across launchpad, reader, editor, audit, and
    admin panels
  - they match the headless/UI split better than the rest of `core`
  Why not more:
  - `cms.js`, `dom.js`, `edit.js`, and `hotkeys.js` are related, but they do
    not yet form a clean enough standalone subsystem boundary
  - `transform.js`, `escape.js`, `block.js`, `markup.js`, and `widget.js` are
    low-level helpers with overlapping but still uneven responsibilities
  - `crawler.js` is too small and too specific to justify a folder

Rules:

- core owns shared UI/adapters/helpers
- core should not depend on feature entries
- core should not become a second runtime metadata layer
- new subfolders in `core` should be created only for stable shared subsystems,
  not as a staging area for feature code

UI naming note:

- `src/core/surface/panel.js` owns the outer panel container primitive
- `src/core/surface/toolbar.js` owns toolbar behavior/controllers/flows that run inside
  a panel
- `src/core/surface/ui.js` owns headless markup primitives such as `ui.shell.frame`,
  `ui.shell.group`, and `ui.shell.stack`
- `rail` and `stack` are toolbar flow names, not separate top-level feature
  types

Naming and placement notes:

- `src/core/markup.js` and `src/pipe/markup.js` are intentionally different:
  `core/markup.js` is editor-selection/tag-range infrastructure, while
  `pipe/markup.js` is transform/normalization logic
- when importing them together with nearby content code, prefer explicit local
  names such as `editorMarkup` and `contentMarkup` instead of another generic
  `markup`
- `src/core/surface/ux.js` is currently a small surface-behavior helper, not a broad
  product-wide UX layer; do not treat it as a reason to build a parallel
  `mode/` or `feature/` abstraction
- do not create `src/core/ui/`, `src/core/editor/`, or other subfolders until
  at least one stable subsystem is large enough to move as a whole rather than
  file by file
- if `core` gets its first real subfolder, prefer `src/core/surface/` and move
  the whole surface cluster there in one explicit migration

### `src/actions.js` and `src/actions/*.js`

Action registry and action modules.

Current responsibilities:

- action execution by id
- active-state checks for executable actions
- feature-local action implementations for admin, audit, text, markup, search,
  session, and shared editor behavior

Current structure:

- `src/actions.js`: central action registry and dispatch
- `src/actions/*.js`: grouped action implementations

Rules:

- actions execute behavior by id
- actions should not own command presentation metadata or scenario ownership
- action modules may use shared core and pipe helpers

Excerpt ownership note:

- active excerpt execution belongs to `src/actions/admin.js`
- active excerpt derivation/state belongs to `src/actions/admin.js`
- do not reintroduce a parallel active `fields.js` excerpt implementation

Known debt:

- the current registry works like a shared mutable service hub
- document and preserve that boundary during targeted patches; do not expand it casually
- do not add new non-shared feature folders under `src/core/`
- when this area moves, move it as one explicit migration to a feature/action
  layer; do not split it ad hoc file by file

### `src/pipe/*.js`

Reusable text/content transform pipelines.

Current responsibilities:

- text normalization
- markup normalization and reconciliation
- content cleanup and formatting
- credit and related content transforms

Current active transform files include:

- `src/pipe/text.js`
- `src/pipe/content.js`
- `src/pipe/markup.js`

Rules:

- `pipe` may depend on `core`
- `pipe` should stay mostly pure
- `pipe` should not import feature entries from `src/*.js`
- shared embed parsing/template/normalization belongs in `src/pipe/markup.js`

### `src/madtest/*.js`

Isolated active feature area for Madtest.

Rules:

- keep this as a separate feature area
- do not fold it into launchpad/runtime/core unless there is repeated reuse pressure

### `src/legacy/*.js`

Historical archive and read-only reference area.

Rules:

- `src/legacy/` is not active runtime code by default
- active source code must not import from `src/legacy/`
- duplication between `src/legacy/` and active code is not actionable by itself
- compatibility paths that still touch legacy-era state must be documented and kept bounded

Known debt:

- if build logic still falls back into `src/legacy/`, treat that as technical debt, not as the preferred source model
- legacy-only helpers such as `src/legacy/more.js` should stay here instead of
  leaking into `src/core/`
- `src/legacy/external/*.js` is an explicit exception: archived external
  bookmarklets still build for the legacy storefront, but should not be treated
  as active architecture to extend
- `src/legacy/editor.js`, `src/legacy/author.js`, and `src/legacy/readmore.js`
  are also explicit exceptions: current launchpad still builds them as
  transitional tools, but they should not drive new top-level source layout
  decisions

### `src/report.js`

Active service entry for report crawling/export.

Current responsibilities:

- thin standalone entry for crawler report execution

Rules:

- keep `src/report.js` thin and move report-specific logic into
  `src/actions/admin.js` under `admin.crawler.report`
- shared fetch/crawl mechanics may stay in `src/core/crawler.js`
- do not reintroduce report-only composition helpers into `src/core/`

## Build and site layers

### `tools/*.js`

Node-side build, check, and utility scripts.

Current examples:

- `tools/build.js`
- `tools/check.js`
- `tools/secrets.js`

Rules:

- tools may read repo files
- tools may write generated outputs
- tools should not become browser-runtime source of truth

### `tools/current/tools.json`

Active launchpad/dist tool registry.

Current responsibilities:

- active tool ids
- source file paths
- launchpad/build icons
- active build scopes

Rules:

- this is the active build source of truth for current tool outputs in
  `dist/*.js`, `dist/loaders/*`, `dist/manifest.json`, and launchpad tool
  injection
- keep runtime detection, DOM probing, and UI rendering logic out of JSON

### `tools/legacy/tools.json`

Legacy-only tool registry for archived standalone bookmarklets.

Current responsibilities:

- legacy-only tool ids
- source file paths for archived bookmarklets
- icons/scopes needed by the legacy storefront build

Rules:

- keep legacy-only bookmarklet definitions here, not in the current tool
  registry
- this file may still feed `dist/*.js` and `dist/loaders/*` while the legacy
  storefront remains supported

### `tools/legacy/storefront/storefront.json`

Root storefront/vitrine metadata.

Current responsibilities:

- storefront scope labels/icons/visibility
- storefront index order

Rules:

- storefront metadata must not drive launchpad runtime behavior
- launchpad scenarios live in `src/runtime/scenarios.js`, not in storefront data

### `tools/legacy/storefront/template.html`

Legacy storefront template source used only by the opt-in storefront build.

### `tools/legacy/storefront/app.js`, `tools/legacy/storefront/styles.css`

Current source assets:

- legacy storefront browser behavior
- legacy storefront styling

These define behavior and styling for the opt-in legacy storefront build.

## Generated outputs

Generated artifacts:

- `index.html`
- `legacy.html`
- `dist/`
- `dist/loaders/`
- `dist/manifest.json`

Rules:

- generated files do not own source logic
- do not treat generated output as the source of truth for architecture
- prefer fixing the source layer and regenerating outputs

## Dependency direction

Allowed directions:

- `entry -> runtime/core/pipe`
- `runtime -> core`
- `actions -> core/pipe`
- `pipe -> core`
- `tools -> repo files and generated outputs`

Disallowed or suspicious directions:

- `core -> entry`
- `runtime -> entry`
- `pipe -> entry`
- `active source -> legacy`
- `generated output -> source ownership`

## Current structure notes

- The current folder layout is mostly coherent and does not justify a broad reshuffle.
- The main architecture debt is source-of-truth drift around launchpad command metadata, not directory naming.
- Prefer targeted ownership fixes inside the current layers before discussing new top-level folders.

## Target normalization path

The target structure should be normalized by layer, not by file size.

### Stable target layers

- `src/*.js`
  Thin active entrypoints and feature bootstraps.
- `src/runtime/`
  Runtime policy, context, scenario resolution, and feature-runtime helpers.
- `src/core/`
  Shared primitives and shared UI/system infrastructure only.
- `src/pipe/`
  Mostly pure transforms and normalization pipelines.
- `src/legacy/`
  Archive/reference only.

### Folder creation rule

- add a subfolder only when it represents a real layer or subsystem boundary
- do not create one-file folders
- do not create a new folder just to shrink a large file
- prefer one feature/runtime subtree such as `src/runtime/launchpad/` over
  scattering feature helpers into `core`

### Migration order

1. Clarify ownership in docs.
2. Stop adding new code to the wrong layer.
3. Extract bounded subsystems into the right layer when they already have a seam.
4. Move historically misplaced folders only as explicit migrations.

### Current migration decisions

- launchpad-specific placement/runtime helpers may live under `src/runtime/launchpad/`
- launchpad entry orchestration lives in `src/launchpad.js`
- `src/actions/*` is the active action layer
- `src/pipe/markup.js` is the canonical shared owner for embed normalization
- `src/actions/admin.js` via `admin.crawler.report` is the canonical report owner
- `src/report.js` stays as the thin standalone report entry
- `src/legacy/more.js` is legacy-only and should not move back into `src/core/`

## When to revisit

- If several new independent feature areas appear, revisit whether another feature-area convention is needed.
- If external bookmarklets start sharing real infrastructure, revisit their placement.
- If launchpad/runtime metadata ownership is unified, update this file to record the canonical owner.
