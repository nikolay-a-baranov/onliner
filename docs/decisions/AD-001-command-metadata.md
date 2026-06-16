# AD-001 Command Metadata

## Problem

Command data is currently split across runtime metadata, launcher orchestration,
action execution, and reader-specific UI code.

This creates repeated ownership questions:

- where static command metadata belongs
- where audience and scenario composition belongs
- what launcher may derive locally
- what actions are allowed to know
- what reader should consume instead of duplicating

The immediate goal is to define a practical ownership model before runtime code
patches begin.

## Current state

- `src/runtime/commands.js` owns static command presentation metadata:
  - title
  - icon fields
  - hotkeys
  - close behavior
  - parameter state variants for `params.*`
- `src/runtime/groups.js` owns group metadata:
  - group id
  - group title
  - group icon
- `src/runtime/scenarios.js` owns:
  - command membership inside groups
  - audience restrictions attached to command entries
  - pinned sets
  - scenario composition
  - reader command composition
- `src/runtime/context.js` owns page/user/context detection
- `src/runtime/scenario.js` owns scenario matching and visibility
- `src/launcher.js` currently rebuilds command objects from runtime data and also
  evaluates command visibility, parameter state, variant labels, and launcher UI state
- `src/core/actions.js` owns action dispatch and active-state checks
- `src/reader.js` re-derives page classification and builds its HUD command list
  from a partial runtime export plus local additions

## Decision

Keep the current runtime/core folder layout.

Do not introduce a new generic command framework.

Use the following target boundary:

- `src/runtime/commands.js` is the canonical owner of static command metadata.
- `src/runtime/groups.js` is the canonical owner of static group metadata.
- `src/runtime/scenarios.js` is the canonical owner of command placement:
  - which groups exist in which scenarios
  - which command ids appear in which groups
  - which command instances carry audience restrictions
  - which commands are pinned
  - which command list the reader HUD consumes
- `src/runtime/context.js` and `src/runtime/scenario.js` remain the canonical
  context and scenario resolution layer.
- `src/core/actions.js` remains the canonical action execution and active-state layer.
- `src/launcher.js` may derive view state from runtime metadata, but should not
  recreate or become the source of static command metadata.
- `src/reader.js` should consume runtime-owned command and page metadata instead
  of keeping a parallel classifier or a parallel pinned-command definition.

Recommended design:

- keep `runtime/commands.js` as the single static command registry
- keep `runtime/groups.js` as the single static group registry
- keep `runtime/scenarios.js` as the single command-placement and audience registry
- move launcher-local normalization toward a thin runtime consumer, not a metadata owner

Rejected alternatives:

- broad rewrite into a new command framework: too much risk, not needed
- moving command execution into runtime: wrong boundary
- keeping launcher and reader as parallel metadata builders: preserves the current debt

## Ownership table

| Concept | Canonical owner | Current state | Notes |
| --- | --- | --- | --- |
| command id | `src/runtime/commands.js` | owned but duplicated elsewhere | `launcher.js` re-normalizes ids into local command objects |
| command title | `src/runtime/commands.js` | owned but duplicated elsewhere | parameter commands may derive current display title from launcher state |
| command icon | `src/runtime/commands.js` | owned but duplicated elsewhere | static icon fields belong in runtime commands |
| command group | derive from `src/runtime/scenarios.js` group membership | should be derived, not stored | no separate per-command owner needed |
| command audience/scope | `src/runtime/scenarios.js` command entries | owned but duplicated elsewhere | launcher may evaluate, but should not own the restriction data |
| command availability | derive from `runtime` metadata plus current context/state | unclear owner | scenario visibility comes from runtime; parameter visibility comes from launcher page state |
| command pinned status | `src/runtime/scenarios.js` | owned but duplicated elsewhere | reader currently consumes only part of it and adds local behavior |
| command hotkey | `src/runtime/commands.js` | owned but duplicated elsewhere | launcher formats labels but should not own the key list |
| command close behavior | `src/runtime/commands.js` | owned but duplicated elsewhere | launcher may act on `close`, not define it |
| command active-state status | `src/core/actions.js` | already correctly owned | dynamic execution state, not runtime metadata |
| command parameter state | `src/launcher.js` params subsystem | already correctly owned | dynamic page state, derived at runtime, not static metadata |
| command variant/title override logic | split: static variants in `runtime/commands.js`, current variant selection in `src/launcher.js` | unclear owner | static `states` belong in runtime; current selected state belongs in launcher |
| group id | `src/runtime/groups.js` | already correctly owned | launcher should consume via lookup |
| group title | `src/runtime/groups.js` | owned but duplicated elsewhere | launcher feed UI consumes and decorates it |
| group icon | `src/runtime/groups.js` | owned but duplicated elsewhere | same as title |
| scenario composition | `src/runtime/scenarios.js` | already correctly owned | runtime scenarios already own the command placement model |
| reader HUD command selection | `src/runtime/scenarios.js` | owned but duplicated elsewhere | reader should consume one runtime-owned reader command list |

## Allowed patterns

- Static command metadata may be looked up by id from `runtime/commands.js`.
- Group metadata may be looked up by id from `runtime/groups.js`.
- Scenario/group builders in `runtime/scenarios.js` may attach audience fields to
  concrete command entries.
- Launcher may derive:
  - current parameter state
  - current parameter title/content override
  - current command visibility from runtime-declared restrictions
  - rendered icon/title/hotkey labels from runtime metadata
- Actions may expose:
  - `has(id)`
  - `run(id, options)`
  - `active(id)`
- Reader may consume:
  - runtime-owned reader command list
  - runtime-owned command metadata
  - runtime-owned page classification

## Forbidden patterns

- Do not add new static command metadata inside `src/launcher.js`.
- Do not make `src/core/actions.js` a presentation metadata registry.
- Do not define a second pinned-command source in `src/reader.js`.
- Do not store command-group membership separately from runtime scenario/group composition.
- Do not add new audience ownership rules outside `src/runtime/scenarios.js`.
- Do not import active runtime code from `src/legacy/`.

## Migration plan

### Patch 1

- Goal:
  - make `runtime/commands.js` the explicit canonical source for static command metadata
  - reduce launcher-local command normalization to a thin consumer
- Files affected:
  - `src/runtime/commands.js`
  - `src/launcher.js`
- Risk level:
  - medium
- Behavior expected to remain unchanged:
  - visible command titles/icons/hotkeys/close behavior
  - launcher rendering order
- Checks to run:
  - `node tools/build.js`
  - targeted launcher smoke check for editor/author/service contexts

### Patch 2

- Goal:
  - make runtime command placement and audience restrictions the explicit source for visibility decisions
  - keep launcher only as evaluator of current context/state
- Files affected:
  - `src/runtime/scenarios.js`
  - `src/launcher.js`
- Risk level:
  - medium
- Behavior expected to remain unchanged:
  - which commands are visible per role/context
  - parameter command availability behavior
- Checks to run:
  - `node tools/build.js`
  - targeted scenario snapshots for editor/author/test/service contexts

### Patch 3

- Goal:
  - make reader consume runtime page and reader-command metadata instead of duplicating them
- Files affected:
  - `src/runtime/context.js`
  - `src/runtime/scenarios.js`
  - `src/reader.js`
- Risk level:
  - medium
- Behavior expected to remain unchanged:
  - reader page label/emoji
  - reader HUD command set
  - reader action execution
- Checks to run:
  - `node tools/build.js`
  - targeted reader smoke check on longread/news/photoreport pages

### Patch 4

- Goal:
  - clean up remaining duplicate group/command decoration logic after the ownership model is in code
- Files affected:
  - `src/launcher.js`
  - `src/runtime/groups.js`
  - `src/runtime/commands.js`
- Risk level:
  - low
- Behavior expected to remain unchanged:
  - toolbar grouping and feed labels
- Checks to run:
  - `node tools/build.js`
  - launcher and reader regression smoke check

## Open questions

- Should parameter command ids remain launcher-local special cases, or should a
  small runtime helper expose which ids are parameter-driven?
- Should reader keep its local HUD position map in `src/reader.js`, or should that
  eventually move into runtime-owned reader metadata?
- Should launcher visibility evaluation stay in `src/launcher.js`, or should a
  small runtime helper later evaluate audience restrictions from runtime metadata?
