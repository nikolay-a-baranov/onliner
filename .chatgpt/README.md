# ChatGPT Report Exchange

This folder stores temporary Codex reports for analysis in ChatGPT.

- Filename format: `codex-chatgpt-yyyymmdd-hhmm.md`
- Reports here are not the source of truth.
- After agreement, important decisions should be moved to `docs/` or issue/task records.

## Launcher command model

- `scenario` decides where commands are available.
- `group` is a semantic block and may use emoji/title.
- `command` is a concrete action and should use explicit metadata.
- `command.id` is the machine command name.
- `command.glyph` is a project glyph key.
- Project glyph keys resolve to verified Microsoft Fluent UI System Icons names.
- Fluent icon names should stay in one registry, not scattered across scenarios.
- Add a glyph key to scenarios only after the key is mapped to a verified Fluent icon name in the registry.
- `command.glyph` is not a Unicode character and not raw display text.
- `command.title` / label is the human-readable description.
- `command.type` decides implementation path: `loader` or `inline`.
- Legacy catalog `tool.title` is only a fallback for old loader commands, not the preferred source of UI metadata for migrated commands.
- Important agreed decisions should later move to `docs/` or an issue/task.
