---
name: onliner-monthly-report
description: Analyze a single proofreader's monthly Onliner CSV/TSV export, classify payroll categories, generate canonical Ledger JSON, and review payment evidence. Use for current per-user monthly reports or changes to their classification and payment rules; group-wide reporting is not yet supported.
---

# Onliner Monthly Report

Analyze monthly proofreading work into an auditable payment result while keeping confirmed amounts, candidates, and manual-review cases separate.

The current contract is intentionally per-user: one export, one proofreader, and one payroll ledger. Do not merge several proofreaders into one calculation until the group input and attribution contract is implemented.

## Canonical rules

Before analyzing a concrete report or changing classification semantics, read [references/monthly-analysis.md](references/monthly-analysis.md) completely. It is the source of truth for:

- expected CSV/TSV columns and relevance filtering;
- payment categories, priority, and no-double-counting rules;
- manual inputs and confidence levels;
- canonical `onliner.monthly.ledger.v3` JSON;
- Ledger filters, diagnostics, totals, and exports.

Update that reference instead of duplicating rules in this entrypoint.

## Required boundaries

- Calculate official totals from `paymentEvents`, not by summing rows blindly.
- Preserve source payload such as dates, numbers, rates, IDs, and links.
- State missing manual inputs and reduce confidence instead of inventing confirmations.
- Keep confirmed, candidate, and manual amounts distinct.
- Treat the JSON as the canonical analysis artifact and Ledger as its review interface.
- Keep monthly JSON local or private. Do not publish report data, admin links, or self-contained report snapshots to public GitHub Pages.

## Repository paths

- Analysis rules: `.agents/skills/onliner-monthly-report/references/monthly-analysis.md`
- Ledger source: `tools/ledger/index.html`
- Generated public viewer: `ledger/index.html`

When implementation changes affect production output, follow the repository build and verification rules.
