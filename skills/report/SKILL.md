# Onliner Monthly Proofreading Report Analysis Skill

## Purpose

Analyze a monthly Onliner proofreading report from CSV or TSV.

Main goals:

- quickly classify paid work categories;
- find unusual/additional materials;
- avoid double counting;
- estimate monthly payment;
- surface ambiguous cases for manual review.

The analysis is not about audience performance. Ignore views, reactions, comments, traffic, etc.

---

## Input Format

Expected report columns:

```tsv
section	weekday	date	time	sticky	layout	live	edit	author	source	volume	title	tags	flags	revisions	user_revisions	previous_revision_date	previous_revision_time	user_last_revision_date	user_last_revision_time
```

This tab-separated line is only a readable example of column structure. The actual report may be CSV or TSV. Analysis must depend on column names, not on the delimiter.

Column notes:

- `sticky`: `left`, `right`, or empty
- `user_last_revision_date`: last revision date by the current user in `YYYY-MM-DD`, or empty
- `user_last_revision_time`: last revision time by the current user in `HH:mm`, or empty
- `previous_revision_date`: last non-user revision date before the first revision by the current user, in `YYYY-MM-DD`, or empty
- `previous_revision_time`: last non-user revision time before the first revision by the current user, in `HH:mm`, or empty
- `flags`: comma-separated markers, currently:
  - `special`
  - `evergreen`
  - `old_revision`

---

## Relevance Filtering

Use `user_last_revision_date` and `user_last_revision_time` as the main relevance signal.

For a monthly report:

- `relevantStart` = 7 days before the first day of the report month
- example for May 2026 report: `relevantStart = 2026-04-24`

A report row is relevant if:

- `user_last_revision_date/time >= relevantStart`

A report row is suspicious or non-relevant if:

- `user_last_revision_date/time` is empty
- or `user_last_revision_date/time < relevantStart`

`previous_revision_date/time` is not a relevance filter. It is only a heuristic signal for when the text likely came to proofreading.

---

## Interpretation Rules

- `revisions` count is not used for payment
- `user_revisions` count is not used for payment
- `previous_revision_date/time` is a heuristic for handoff-to-proofreading timing, not an official `submitted_at`
- avoid double counting: special projects, duty shifts, sport block work, and base salary rows must not be summed multiple times from the same row

Use `flags` as supporting hints:

- `special`: likely special project
- `evergreen`: article already published before / evergreen content
- `old_revision`: export-side heuristic that the user revision is older than the report month logic; keep it as a hint, but prefer direct relevance filtering from `user_last_revision_date/time`

---

## Manual Review Cases

Surface rows for manual review when:

- user revision fields are empty but the row still looks work-related
- `previous_revision_date/time` exists but the timeline looks inconsistent
- the row has mixed signals across `flags`, `source`, `sticky`, `layout`, and revision dates
- there is risk of double counting with another category
