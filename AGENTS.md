# AGENTS.md

## Purpose

Agent instructions for code changes in this repository.

## Source of Truth

- For JavaScript style, architecture, and encoding rules, always follow [`docs/JAVASCRIPT.md`](docs/JAVASCRIPT.md).
- Do not duplicate or reinterpret rules from `docs/JAVASCRIPT.md` if they are already explicit there.

## Priority

1. Direct user task requirements
2. Repository safety/correctness
3. `JAVASCRIPT.md` (project JS standard)
4. General defaults

If there is a conflict between general defaults and `JAVASCRIPT.md`, prefer `JAVASCRIPT.md`.

## Scope

Apply `docs/JAVASCRIPT.md` to:

- `src/**/*.js`
- `tools/**/*.js`
- generated JS patches and refactors

## Workflow

1. Read `docs/JAVASCRIPT.md` before editing JS.
2. Keep changes small and local.
3. Preserve existing module patterns unless the task explicitly requires refactor.
4. After edits, quickly self-check naming, pipeline shape, side effects, and encoding-sensitive symbols.
5. For JS tasks that affect production output, run `node tools/build.js` before final response and treat `build.guard.mojibake` failures as blocking.
6. For shared utility semantics, prefer grouped objects with nested sub-methods instead of flat helper names:
   - use domain groups like `ahead.word`, `ahead.closing`, `ahead.tag`
   - use behavior groups like `helper.caseify.first` and `helper.caseify.all`
   - avoid one-off top-level utility fields when the concept has variants
7. Do not extract single-use literals (especially long phrase checks) into named `const` values unless reuse or clearer behavior justifies it.
8. Preferred module structure (when compatible with current file semantics):
   - define reusable parts as top-level local `const` values in the file
   - assemble one exported module object at the bottom (for example `const cms = { ... }`)
   - prefer importing that module object (`import { cms } ...`) and using namespaced access (`cms.editor.html()`), instead of importing many named fragments from the same file
9. In launchpad/runtime feed config, context/role entries should declare command availability, while command-to-group attribution should live in a separate shared mapping. Do not hardcode role-specific visual groups directly inside scenario context lists unless there is no reusable group mapping.
10. When implementing an item from `TODO.md`, mark that exact item as done by changing `[]` to `[+]`.
11. For any UI built with `ui.shell.group` / `ui.shell.shell`, never theme/sync groups individually. Always sync the parent panel once via `ui.surface.sync(panel, { layout, theme, surface: "toolbar" })` and set panel-level layout context (`data-toolbar-flow`, `data-dock`, `data-dock-target`) so shared rail/group CSS works consistently across launcher, reader popups, and other panels.
12. `toolbar.appearance.sync(...)` is considered a legacy compatibility path. For new code and refactors, prefer `ui.surface.sync(...)` as the neutral design-system entrypoint.
13. All toolbar/group icons must be rendered through `icon.js` primitives (`icon.emoji`, `icon.logo`, `icon.theme`, etc.). Do not insert raw emoji/text icons directly in UI markup. If a new icon appears in a group, add/cover it in `src/core/icon.js` scope mapping first so rendering is consistent by default.
14. For text/regex normalization changes, preserve semantic payload tokens from the source (numbers, currency signs, units, IDs, links). Do not ship replacements that can drop captured numeric/value groups; before final response, run a quick targeted smoke-check on at least one affected input/output sample.
15. For action code that edits `input` / `textarea` values, prefer shared setter paths such as `field.set(...)` over direct `element.value = ...` writes. Keep event emission centralized through shared helpers (`field.emit(...)`, `api.done(...)`, etc.), because some reactive pages accept native setter writes but later revert plain property mutation.

## Design Architecture

- Use a headless UI approach for design refactors: separate `UX` behavior/state/event logic from `UI` rendering/styling primitives.
- Keep behavior modules reusable across surfaces; avoid binding interaction logic to specific visual classes or hardcoded markup.
- Build panels from shared UI primitives first (`panel`, `toolbar`, shared controls, shared popup parts), then apply surface-level tokens.
- Treat one-off visual customization as a last step; prefer extending shared primitives when the pattern is reusable.
- Prefer adapting headless architecture patterns locally (state machine + accessibility behavior + keyboard/focus contracts) instead of introducing external UI frameworks/libraries for bookmarklet surfaces.

## Continuous Improvement

- If recurring style or architecture ambiguity appears during a task, propose a minimal update to `AGENTS.md` or `JAVASCRIPT.md`.
- Keep rule updates specific, short, and non-duplicative.
- Prefer updating the single source of truth instead of repeating local one-off conventions in code.

## Encoding

- Keep text files in UTF-8.
- In fragile symbol sets (spaces/quotes/dashes in regex or mapping tables), prefer explicit code forms as described in `docs/JAVASCRIPT.md`.
- Never rewrite JS files via shell-wide read/replace/write flows (`Get-Content -Raw` -> `Set-Content`) because it can corrupt Cyrillic and typographic symbols.
- Never rewrite Markdown/docs via shell-wide read/replace/write flows (`Get-Content`/`Set-Content`); use targeted `apply_patch` edits to preserve file encoding.
- For JS edits, prefer targeted `apply_patch` hunks.
- Do not require per-file mojibake `rg` scans during refactor passes; rely on the build gate (`node tools/build.js`) to block production mojibake.

## Safe Text-File Editing

- All repository text files are UTF-8.
- Ordinary Cyrillic must remain ordinary readable UTF-8 text.
- Do not rewrite source files through PowerShell pipelines.
- Do not use `Get-Content | Set-Content`.
- Do not read a whole source file, call `.Replace(...)`, and write the whole file back through PowerShell or shell tooling.
- Do not use shell redirection to replace JavaScript or other source files.
- Do not use ad-hoc full-file transcoding.
- Do not run iterative mojibake-recovery transformations over whole source files.
- Do not rewrite an entire file for a targeted change.
- Use `apply_patch` for targeted source edits.
- Preserve existing encoding and line endings.
- If a targeted patch unexpectedly changes unrelated Cyrillic, typography, or large unrelated regions, stop immediately.
- Restore only changes introduced by the current agent operation, then reapply the intended edit safely.
- Do not restore a whole file from `HEAD` when that could remove user changes unless the user explicitly approves it.
- If a safe targeted patch is not possible, stop and report the blocker instead of switching to a whole-file shell rewrite.

## Post-Edit Verification

- Inspect `git diff --stat`.
- Inspect the complete diff of every changed file.
- Verify that no unrelated text changed.
- Run the relevant syntax checks.
- Run the relevant build when the task affects buildable source.
