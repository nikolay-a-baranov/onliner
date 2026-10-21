# AD-005: Separate QA fixtures, notes, and local captures

Status: accepted
Date: 2026-10-20

## Context

The root `qa/` directory mixed committed test inputs, historical instructions,
raw authenticated page captures, logs, generated audit material, and exact
duplicates. `tools/check.js` also scanned root-level `.txt` files from this
ignored directory, so a local file could change `npm test` without appearing in
Git.

## Decision

- Deterministic inputs consumed by repository checks live under
  `tools/fixtures/qa/`.
- Historical instructions and unused manual samples live in the external
  project archive rather than in source or fixture directories.
- The root `qa/` directory is an ignored local inbox and must not be a test or
  production dependency.
- Completed raw captures move to a dated sibling `onliner-archive/` directory,
  preserving relative paths and a checksum manifest.
- Build output and secrets are not included in QA archives.

## Consequences

- Automated checks behave the same in a clean clone, CI, and a developer
  workspace.
- Raw captures do not expand the Git history or Pages artifact.
- Fixture directories do not accumulate samples that no automated check reads.
- Local archive storage must be backed up separately if long-term retention is
  required.
- Captures may contain authenticated or personal data and must not be uploaded
  without a separate review.
