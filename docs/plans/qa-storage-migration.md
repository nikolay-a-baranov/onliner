# Separate QA fixtures from local captures

Status: completed
Last reviewed: 2026-10-20

## Sources

- User request to make `qa/` reproducible and move historical local material into a project archive.
- [Repository structure](../structure.md)
- [NPM scripts](../npm-scripts.md)

## Objective

Automated checks use only versioned fixtures, while raw QA captures remain local and can be archived outside the repository without affecting Git or CI.

## Scope

- Move test inputs consumed by automated checks under `tools/fixtures/qa/`.
- Move historical QA instructions and unused manual samples to the external
  project archive.
- Point `tools/check.js` at versioned fixtures only.
- Move the remaining ignored `qa/` material to a dated sibling archive.
- Document the resulting ownership and retention model.

## Non-goals

- Reclassifying or deleting unique historical captures.
- Uploading local captures or authenticated HTML to GitHub or cloud storage.
- Automating scheduled deletion.

## Current milestone

Migration completed with a verified external archive and a passing full test run.

## Affected areas

- `qa/`
- `tools/fixtures/qa/`
- `tools/check.js`
- repository and development documentation
- sibling `onliner-archive/` directory

## Dependencies and decisions needed

- External archive writes require explicit filesystem approval.
- Raw captures may contain authenticated or personal data and must stay outside Git.

## Steps

- [x] Move versioned fixtures and reference notes to their canonical owners.
- [x] Make `test:qa` independent from ignored local files.
- [x] Document the QA data lifecycle.
- [x] Move ignored captures to the dated external archive and record a manifest.
- [x] Run targeted checks, the production build, and the full test suite.

## Acceptance criteria

- `npm test` reads no ignored `qa/` files.
- A clean clone contains every fixture required by automated checks.
- Historical local QA material exists in a verified external archive.
- Repository documentation identifies canonical storage for each QA data class.

## Verification

- `npm.cmd test`
- `node tools/build.js`
- Markdown local-link scan
- Archive file count, byte count, and manifest verification
- Complete Git diff review

## Progress and evidence

- 2026-10-20 — inventory found 15 tracked QA files and 119 ignored local files; `tools/check.js` read arbitrary root-level local `.txt` files.
- 2026-10-20 — initially separated committed content and embed samples from historical instructions, then audited every consumer before finalizing their ownership.
- 2026-10-20 — moved 119 ignored files (16,558,758 bytes) to the sibling `../onliner-archive/2026-10/qa` directory and verified every SHA-256 entry in `qa-manifest.json`.
- 2026-10-20 — retained only the two content files consumed by `tools/check.js`; archived 8 unused embed samples and 6 historical QA documents in the verified external `qa-retired-reference-20261020.zip` archive.
- 2026-10-20 — `node tools/check.js`, `npm.cmd test`, `node --check tools/check.js`, and `node tools/build.js` completed successfully.

## Decision log

- 2026-10-20 — only inputs consumed by automated checks belong in `tools/fixtures/qa/`; ignored `qa/` is a temporary local inbox, not a test dependency.
- 2026-10-20 — historical captures are preserved outside the repository instead of being deleted or committed.

## Handoff

Migration is complete. The root `qa/` directory is an ignored local inbox;
automated checks use only committed fixtures they consume, and historical
captures, manual samples, and superseded instructions are recoverable through
dated sibling archives and checksum manifests.
