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
9. When implementing an item from `TODO.md`, mark that exact item as done by changing `[]` to `[+]`.

## Continuous Improvement

- If recurring style or architecture ambiguity appears during a task, propose a minimal update to `AGENTS.md` or `JAVASCRIPT.md`.
- Keep rule updates specific, short, and non-duplicative.
- Prefer updating the single source of truth instead of repeating local one-off conventions in code.

## Encoding

- Keep text files in UTF-8.
- In fragile symbol sets (spaces/quotes/dashes in regex or mapping tables), prefer explicit code forms as described in `JAVASCRIPT.md`.
- Never rewrite JS files via shell-wide read/replace/write flows (`Get-Content -Raw` -> `Set-Content`) because it can corrupt Cyrillic and typographic symbols.
- Never rewrite Markdown/docs via shell-wide read/replace/write flows (`Get-Content`/`Set-Content`); use targeted `apply_patch` edits to preserve file encoding.
- For JS edits, prefer targeted `apply_patch` hunks.
- Do not require per-file mojibake `rg` scans during refactor passes; rely on the build gate (`node tools/build.js`) to block production mojibake.
