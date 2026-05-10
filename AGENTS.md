# AGENTS.md

## Purpose

Agent instructions for code changes in this repository.

## Source of Truth

- For JavaScript style and architecture rules, always follow `JAVASCRIPT.md`.
- Do not duplicate or reinterpret rules from `JAVASCRIPT.md` if they are already explicit there.

## Priority

1. Direct user task requirements
2. Repository safety/correctness
3. `JAVASCRIPT.md` (project JS standard)
4. General defaults

If there is a conflict between general defaults and `JAVASCRIPT.md`, prefer `JAVASCRIPT.md`.

## Scope

Apply `JAVASCRIPT.md` to:

- `src/**/*.js`
- `tools/**/*.js`
- generated JS patches and refactors

## Workflow

1. Read `JAVASCRIPT.md` before editing JS.
2. Keep changes small and local.
3. Preserve existing module patterns unless the task explicitly requires refactor.
4. After edits, quickly self-check naming, pipeline shape, side effects, and encoding-sensitive symbols.
5. Before final response for any JS edits, run a mojibake check on touched files with `rg` for patterns like `Ð`, `Â`, `â`, `Ã`, `Ñ` and fix all hits.
5. For shared utility semantics, prefer grouped objects with nested sub-methods instead of flat helper names:
   - use domain groups like `ahead.word`, `ahead.closing`, `ahead.tag`
   - use behavior groups like `helper.caseify.first` and `helper.caseify.all`
   - avoid one-off top-level utility fields when the concept has variants

## Continuous Improvement

- If recurring style or architecture ambiguity appears during a task, propose a minimal update to `AGENTS.md` or `JAVASCRIPT.md`.
- Keep rule updates specific, short, and non-duplicative.
- Prefer updating the single source of truth instead of repeating local one-off conventions in code.

## Encoding

- Keep text files in UTF-8.
- In fragile symbol sets (spaces/quotes/dashes in regex or mapping tables), prefer explicit code forms as described in `JAVASCRIPT.md`.
- Never rewrite JS files via shell-wide read/replace/write flows (`Get-Content -Raw` -> `Set-Content`) because it can corrupt Cyrillic and typographic symbols.
- For JS edits, prefer targeted `apply_patch` hunks and re-check for mojibake (`Ð`, `Â`, `â`) before finishing.
