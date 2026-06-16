# Architecture

## Project principles

- Keep behavior deterministic.
- Keep one explicit source of truth for each concept.
- Prefer small local changes over broad rewrites.
- Do not reshuffle folders without proven ownership or maintenance pressure.
- Do not add abstractions before there is real reuse or a real boundary problem.

## Source of truth rules

### Command metadata

Current state:

- Known debt.
- Ownership is split across `src/runtime/commands.js`, `src/runtime/groups.js`,
  `src/runtime/scenarios.js`, `src/launcher.js`, and `src/core/actions.js`.

Target rule:

- command id/title/icon/hotkey/close/state metadata should have one canonical owner
- launcher and reader surfaces should consume that metadata, not recreate it
- detailed ownership decision lives in `docs/decisions/AD-001-command-metadata.md`

### Command availability and scenarios

Current owner:

- `src/runtime/scenarios.js`
- `src/runtime/context.js`
- `src/runtime/scenario.js`

Rule:

- availability and scenario resolution belong to runtime metadata
- feature entries may react to resolved commands, but should not become the policy owner

### Action execution

Current owner:

- `src/core/actions.js`
- `src/core/actions/*.js`

Rule:

- actions execute behavior by id
- actions do not own presentation metadata or scenario policy

### Launcher positioning, docking, and reset

Current owner:

- shared behavior and persistence in `src/core/toolbar.js`
- feature-specific orchestration in `src/launcher.js`

Rule:

- shared drag/dock mechanics belong in shared UI infrastructure
- launcher-specific home/reset behavior belongs in launcher code
- do not duplicate docking rules across multiple feature entries

### Shared panel and surface rendering

Current owner:

- `src/core/panel.js`
- `src/core/toolbar.js`
- `src/core/ui.js`
- `src/core/css.js`
- `src/core/design.js`

Rule:

- shared panel/surface rendering belongs in core UI infrastructure
- feature files may compose these primitives, but should not grow parallel infrastructure

### Popup rendering

Current owner:

- `src/core/ui.js`

Rule:

- popup rendering and popup shell behavior belong to shared UI code

### Text and content transforms

Current owner:

- `src/pipe/*.js`
- shared low-level helpers in `src/core/transform.js` and `src/core/widget.js`

Rule:

- reusable transforms belong in pipe/core transform helpers
- DOM-writing code should stay outside transform pipelines

### Excerpt ownership

Current owner:

- reusable excerpt derivation/state in `src/pipe/excerpt.js`
- active WordPress admin excerpt execution in `src/core/actions/admin.js`

Rule:

- `src/pipe/excerpt.js` owns shared excerpt text/state rules such as `lead`,
  `percent`, `empty`, `long`, `message`, and `state`
- `src/core/actions/admin.js` owns active admin excerpt orchestration and field
  UI flow
- do not keep a second active excerpt implementation in another action module

### Legacy archive

Current owner:

- `src/legacy/` as archive only

Rule:

- legacy is reference material, not an active dependency source

### Legacy storefront source

Current owner:

- `tools/legacy/storefront/`

Rule:

- legacy storefront metadata/template/assets belong under legacy-owned tooling
- default active build must not depend on legacy storefront source files
- root `index.html` may remain a generated legacy storefront output only

## Launcher, runtime, and action boundary

- Runtime metadata describes page context, commands, groups, and scenarios.
- Launcher renders the resolved command surface and executes resolved command ids.
- Launcher should not recreate command metadata that already belongs to runtime.
- Actions execute behavior by id and expose active-state checks.
- Actions should not own command presentation or scenario availability.
- Reader should not maintain a parallel copy of page classification or pinned command metadata unless there is an explicit, documented reason.

## UI surface rules

- `ui.surface.sync(...)` is the preferred active surface sync path.
- `toolbar.appearance.sync(...)` is a legacy compatibility path.
- Do not grow parallel theming/layout APIs for the same panel system.
- Shared surface fixes should land in the shared surface path, not be copied into feature panels one by one.

## State ownership rules

- Each persistent state key must have one clear owner.
- Each window-global namespace must be explicit and feature-scoped.
- Every global namespace must have a teardown and re-entry story.
- Local storage compatibility keys are allowed only as documented migration or compatibility paths.
- Compatibility reads may stay temporarily; compatibility writes should not spread casually.

## Legacy rules

- `src/legacy/` is a historical archive and read-only reference area.
- Active source code must not import from `src/legacy/`.
- Duplication between active and legacy code is not actionable by itself.
- Compatibility paths that still touch legacy-era state must be documented and kept bounded.
- Build fallback into legacy, if present, is known debt and should not be extended.

## Refactoring policy

- Fix repeated classes of problems by updating rules first, then code.
- Avoid large rewrites.
- Split large files only along seams that already exist in the code.
- Do not extract helpers without real reuse or clearer ownership.
- Each runtime patch should close one class of problem, not start a second refactor track.

## Audit follow-up policy

1. Audit the current state.
2. Update docs and architecture rules.
3. Apply targeted runtime patches.
4. Re-check project health and update docs when ownership changes.
