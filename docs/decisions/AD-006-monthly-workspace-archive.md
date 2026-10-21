# AD-006: Archive completed workspace months outside the repository

Status: accepted
Date: 2026-10-20

## Context

Ignored working directories under `.chatgpt/`, `.handoff/`, and `.audit/`
accumulate historical month folders and timestamped loose artifacts. They are
useful for recovery but do not belong in Git and make the active workspace
harder to inspect and back up.

## Decision

- Eligible history is either a direct child directory named `YYYYMM` or a
  loose artifact matching the strict timestamp format produced by that scope.
  Its directory name or parsed filename date must be earlier than the current
  local month.
- Completed months are archived to the dated sibling `onliner-archive/`
  directory while preserving their workspace-relative scope and paths.
- Every run creates a ZIP, an external JSON manifest with per-file SHA-256
  hashes, and a SHA-256 checksum for the ZIP. New archives preserve exact
  repository-relative paths, including leading dots in scope names.
- Outputs are built under unique `.partial-<pid>` names and published only
  after verification; failed pre-publication runs remove their partial files.
- Source artifacts are removed only after ZIP contents and unchanged source
  files and directory layout have all been verified.
- The current month, unrecognized loose files or directories, reparse points,
  secrets outside the selected artifacts, and existing final archive artifacts
  are never implicitly included or overwritten.
- Windows Task Scheduler runs the operation on the first day of each month;
  manual preview and apply commands remain available for inspection and
  recovery.

## Consequences

- Active working directories stay compact without losing completed history.
- Existing timestamp-based generators do not need a second directory layout;
  the archive process groups their completed loose artifacts by parsed month.
- A failed or interrupted verification leaves source directories intact.
- The sibling archive is outside Git and requires its own backup and access
  policy, especially when working material contains authenticated data.
- If an archive artifact with the generated name already exists, the run stops
  for manual review instead of merging with or replacing it.
