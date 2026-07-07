# Process Automation Toolkit Current Metrics

Scope date: `2026-07-06`

This file contains repository-derived counts that can be reused in a case study, CV support materials, or interview prep.

## Safe Summary

In the current repository version:
- `100` command metadata entries
- `81` executable action ids
- `15` connected action modules
- `14` top-level scenarios
- `22` unique command-group ids
- `53` active JS source files outside the legacy archive

## Detailed Counts

### Commands and actions

- `100` command metadata entries
  - Source: [commands.js](/C:/Users/KB/Dev/onliner/src/runtime/commands.js)
  - Method: counted top-level entries inside `const byId = { ... }`
  - Meaning: the command catalog / metadata layer, including user-facing and service-level entries

- `81` executable action ids
  - Source: [actions.js](/C:/Users/KB/Dev/onliner/src/actions.js)
  - Method: counted ids registered across `editorActions`, `contentActions`, `adminActions`, `mediaActions`, `editorialActions`, and the other `*Actions` maps
  - Meaning: distinct action ids mapped to runnable behavior in the active action layer

### Modules and scenarios

- `15` connected action modules
  - Source: [actions.js](/C:/Users/KB/Dev/onliner/src/actions.js)
  - Method: counted imported `create*` factories wired into the shared action API
  - Modules counted:
    - `createShared`
    - `createChars`
    - `createMoves`
    - `createTokens`
    - `createMarkup`
    - `createContent`
    - `createSearch`
    - `createAdmin`
    - `createAudit`
    - `createOnliner`
    - `createSession`
    - `createFeedback`
    - `createProofread`
    - `createMedia`
    - `createEditorial`

- `14` top-level scenarios
  - Source: [scenarios.js](/C:/Users/KB/Dev/onliner/src/runtime/scenarios.js)
  - Method: counted entries in `scenarios.list`
  - Scenarios counted:
    - `longread`
    - `news`
    - `photoreport`
    - `post-admin`
    - `reader`
    - `revision`
    - `login`
    - `project-home`
    - `source`
    - `onliner`
    - `madtest-login`
    - `madtest-home`
    - `madtest-stat`
    - `madtest-edit`

- `22` unique group ids
  - Source: [groups.js](/C:/Users/KB/Dev/onliner/src/runtime/groups.js)
  - Method: counted distinct `id` values in exported group metadata
  - Meaning: reusable command-group categories in the operator UI/runtime layer

### Repository size indicators

- `53` active JS files in `src/` excluding `src/legacy/`
  - Method: recursive count of `.js` files under `src/`, excluding paths containing `/legacy/`

- `20` JS files in `src/actions/`
  - Method: recursive count of `.js` files under `src/actions/`

- `8` JS files in `src/runtime/`
  - Method: recursive count of `.js` files under `src/runtime/`

- `10` documentation files in `docs/` with `.md` or `.json`
  - Method: recursive count of `.md` / `.json` files under `docs/`

## Scenario / Workflow Area Counts

These are safe as directional support counts, but should be presented with wording like "at least" or "in the current version" if used outside technical discussion.

- `16` admin/CMS-related action ids
  - Source block: `adminActions` in [actions.js](/C:/Users/KB/Dev/onliner/src/actions.js)

- `8` content-related action ids
  - Source block: `contentActions` in [actions.js](/C:/Users/KB/Dev/onliner/src/actions.js)

- `5` media-related action ids
  - Source block: `mediaActions` in [actions.js](/C:/Users/KB/Dev/onliner/src/actions.js)

- `3` editorial/export/handoff action ids
  - Source block: `editorialActions` in [actions.js](/C:/Users/KB/Dev/onliner/src/actions.js)

- `3` search-related action ids
  - Source block: `searchActions` in [actions.js](/C:/Users/KB/Dev/onliner/src/actions.js)

## Recommended Wording

### Technical-safe

- `In the current repository version, the toolkit includes 100 command metadata entries, 81 executable action ids, 15 connected action modules, and 14 top-level scenarios.`

### HR / hiring-manager-safe

- `In the current version, the internal toolkit is organized around roughly 80 executable commands, 15 workflow modules, and 14 top-level usage scenarios.`

### Conservative portfolio-safe

- `The current version contains a command-driven internal tooling layer with around 80 executable actions, 15 modular workflow areas, and a scenario-based operator surface.`

## Notes and Caveats

- `100 commands` and `81 executable action ids` are not the same number because the repository separates metadata entries from runnable action mappings.
- These counts are repository-state counts, not usage/adoption metrics.
- These numbers should not be presented as impact metrics.
- If the repository changes, regenerate this file before using the numbers externally.
