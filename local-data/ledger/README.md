# Local Ledger data

This directory stores prepared monthly crawler exports for Ledger. JSON files
are ignored by Git and are not published to GitHub Pages.

Keep full crawler archives in `qa/onliner-crawler/`. Prepare the local copies
with the `onliner-ledger-dataset` skill or its deterministic helper:

```text
node .agents/skills/onliner-ledger-dataset/scripts/prepare-ledger-datasets.js --dry-run
node .agents/skills/onliner-ledger-dataset/scripts/prepare-ledger-datasets.js
```

The helper validates crawler schema v2, keeps the Ledger-facing fields and
derived signals, removes heavy raw editor payload, writes `YYYYMM.json`, and
rebuilds `index.json`.

Ledger sorts entries by `period` and opens the latest month by default. The
month selector is available only on local hosts.
