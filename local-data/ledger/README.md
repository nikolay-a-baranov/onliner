# Local Ledger data

This directory stores local monthly crawler exports for Ledger. JSON files are
ignored by Git and are not published to GitHub Pages.

Use one file per month:

```text
YYYYMM.json
```

Add the file to the local `index.json`:

```json
{
  "schema": "onliner-ledger-local-index",
  "schema_version": 1,
  "datasets": [
    { "period": "202609", "file": "202609.json" }
  ]
}
```

Ledger sorts entries by `period` and opens the latest month by default. The
month selector is available only on local hosts.
