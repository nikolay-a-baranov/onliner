---
name: onliner-ledger-dataset
description: Prepare monthly Onliner crawler v2 JSON for the private local Ledger viewer by validating it, keeping the Ledger-facing record contract, removing heavy raw fields, and refreshing the local dataset index. Use when moving exports from qa/onliner-crawler into local-data/ledger; do not use it to classify payroll or generate canonical monthly payroll ledgers.
---

# Onliner Ledger Dataset

Turn complete crawler exports into compact private datasets that Ledger can load directly.

## Contract

- Treat `qa/onliner-crawler/` as the immutable full-fidelity source archive.
- Publish prepared files to `local-data/ledger/YYYYMM.json` and refresh `local-data/ledger/index.json`.
- Keep the prepared JSON private and ignored by Git. It contains admin URLs and editorial history.
- Require `schema: "onliner-publications"`, `schema_version: 2`, a `YYYYMM` period, and a `records` array.
- Use `records[].metrics.words` as volume. The crawler computes it from `markup.strip(content)`, so never recalculate volume after removing `content`.
- Preserve derived signals including `madtest`, `special_project`, and `evergreen`; they were extracted before cleanup.
- Keep source collection errors and diagnostics in the top-level payload. Report non-empty `errors`, but do not silently remove valid records because a collection has warnings.

## Prepare datasets

Run the deterministic helper from the repository root:

```text
node .agents/skills/onliner-ledger-dataset/scripts/prepare-ledger-datasets.js --dry-run
node .agents/skills/onliner-ledger-dataset/scripts/prepare-ledger-datasets.js
```

The helper selects the newest export for each period, validates every record, writes compact monthly files, and rebuilds the sorted local index. Use `--source <directory>` or `--target <directory>` only when the user gives different locations.

The prepared record allowlist is deliberately narrower than the archive. It retains identity, links, display fields, revisions, volume, and precomputed signals while dropping raw `content`, `form_fields`, and other editor-only payload. Update the helper allowlist and the Ledger consumer together if Ledger starts reading another field.

## Verify

After preparation:

- confirm every source period has one target entry;
- confirm target `count` equals `records.length`;
- confirm every target record has numeric `metrics.words`;
- confirm no target record contains `content` or `form_fields`;
- confirm crawler rows with a `madtest` value retain it in the target;
- inspect source/target byte totals from the helper summary.

For payroll classification or canonical `onliner.monthly.ledger.v3` generation, use `onliner-monthly-report` after this preparation step.
