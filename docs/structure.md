# Structure

## Source layers

### `src/*.js`

Active bookmarklet entry files.

These are executable entrypoints that may be referenced from `tools/catalog.json`
and bundled into `dist/`.

Current active entry areas include:

- launcher and runtime entry: `src/launcher.js`
- newsroom/editor tools: `src/editor.js`, `src/author.js`, `src/reader.js`
- content/service tools: `src/cleanup.js`, `src/readmore.js`, `src/filter.js`

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
- `src/runtime/scenario.js`
- `src/runtime/scenarios.js`
- `src/runtime/commands.js`
- `src/runtime/groups.js`

Rules:

- runtime owns metadata and resolution logic
- runtime should not depend on feature entries in `src/*.js`
- runtime should not own feature-specific DOM flows
- runtime should describe commands/groups/scenarios, not execute feature behavior directly

Known debt:

- launcher command metadata ownership is currently split across runtime files,
  `src/launcher.js`, and `src/core/actions.js`
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

Important files:

- shared UI/surface primitives:
  - `src/core/panel.js`
  - `src/core/toolbar.js`
  - `src/core/ui.js`
  - `src/core/css.js`
  - `src/core/design.js`
  - `src/core/icon.js`
- shared adapters/helpers:
  - `src/core/cms.js`
  - `src/core/dom.js`
  - `src/core/edit.js`
  - `src/core/hotkeys.js`
  - `src/core/transform.js`
  - `src/core/widget.js`

Rules:

- core owns shared UI/adapters/helpers
- core should not depend on feature entries
- core should not become a second runtime metadata layer

### `src/core/actions.js` and `src/core/actions/*.js`

Action registry and action modules.

Current responsibilities:

- action execution by id
- active-state checks for executable actions
- feature-local action implementations for admin, audit, text, markup, search,
  session, and shared editor behavior

Current structure:

- `src/core/actions.js`: central action registry and dispatch
- `src/core/actions/*.js`: grouped action implementations

Rules:

- actions execute behavior by id
- actions should not own command presentation metadata or scenario ownership
- action modules may use shared core and pipe helpers

Excerpt ownership note:

- active excerpt execution belongs to `src/core/actions/admin.js`
- shared excerpt derivation/state belongs to `src/pipe/excerpt.js`
- do not reintroduce a parallel active `fields.js` excerpt implementation

Known debt:

- the current registry works like a shared mutable service hub
- document and preserve that boundary during targeted patches; do not expand it casually

### `src/pipe/*.js`

Reusable text/content transform pipelines.

Current responsibilities:

- text normalization
- markup normalization and reconciliation
- content cleanup and formatting
- excerpt, credit, and tag-related transforms

Current active transform files include:

- `src/pipe/text.js`
- `src/pipe/content.js`
- `src/pipe/markup.js`
- `src/pipe/excerpt.js`
- `src/pipe/tag.js`

Rules:

- `pipe` may depend on `core`
- `pipe` should stay mostly pure
- `pipe` should not import feature entries from `src/*.js`

### `src/madtest/*.js`

Isolated active feature area for Madtest.

Rules:

- keep this as a separate feature area
- do not fold it into launcher/runtime/core unless there is repeated reuse pressure

### `src/external/*.js`

External one-off bookmarklets for non-Onliner targets.

Current active files:

- `src/external/linkedin.js`
- `src/external/vitrina.js`
- `src/external/wanderlog.js`

Rules:

- treat these as isolated feature entries
- do not force them into launcher/runtime architecture unless they start sharing real infrastructure

### `src/legacy/*.js`

Historical archive and read-only reference area.

Rules:

- `src/legacy/` is not active runtime code
- active source code must not import from `src/legacy/`
- duplication between `src/legacy/` and active code is not actionable by itself
- compatibility paths that still touch legacy-era state must be documented and kept bounded

Known debt:

- if build logic still falls back into `src/legacy/`, treat that as technical debt, not as the preferred source model

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

### `tools/catalog.json`

Active launcher/dist tool build catalog.

Current responsibilities:

- tool ids
- source file paths
- launcher/build icons
- active build scopes

Rules:

- this is the active build source of truth for `dist/*.js`, `dist/loaders/*`,
  `dist/manifest.json`, and launcher tool injection
- keep runtime detection, DOM probing, and UI rendering logic out of JSON

### `tools/legacy/storefront/storefront.json`

Root storefront/vitrine metadata.

Current responsibilities:

- storefront scope labels/icons/visibility
- storefront index order

Rules:

- storefront metadata must not drive launcher runtime behavior
- launcher scenarios live in `src/runtime/scenarios.js`, not in storefront data

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
- `core/actions -> core/pipe`
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
- The main architecture debt is source-of-truth drift around launcher command metadata, not directory naming.
- Prefer targeted ownership fixes inside the current layers before discussing new top-level folders.

## When to revisit

- If several new independent feature areas appear, revisit whether another feature-area convention is needed.
- If external bookmarklets start sharing real infrastructure, revisit their placement.
- If launcher/runtime metadata ownership is unified, update this file to record the canonical owner.
