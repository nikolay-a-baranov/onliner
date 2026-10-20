# Onliner Monthly Proofreading Report Analysis Rules

Version note: v0.42 fixes the Catalog rate to 18, requires Russian section display names in all user-facing explanations, and clarifies that extra special/evergreen/catalog rows are filtered/displayed as generic `Допы` while their status remains separate.

## Purpose

Use this skill to analyze monthly Onliner proofreading/report exports and produce a predictable payment summary, signal list, and manual-review list.

The assistant should perform the report analysis. Codex or other coding tools should only maintain this instruction file or the export code. They should not infer payment totals unless explicitly asked to analyze a concrete report with the same rules.

The goal is not to maximize automation. The goal is stable, explainable classification with clear separation between confirmed amounts, candidate amounts, and manual-review items.

## Input Format

The report may be provided as CSV or TSV.

CSV is the primary export format from the collection script. TSV is acceptable for analysis or ChatGPT handoff when CSV is inconvenient to read or parse.

Analysis must depend on column names and row values, not on the delimiter.

If the file cannot be parsed reliably, ask for a TSV version or a cleaner export. Do not guess from broken columns.

## Expected Report Columns

Expected columns may include:

- `section`
- `date`
- `weekday`
- `time`
- `sticky`
- `layout`
- `live`
- `edit`
- `author`
- `source`
- `volume`
- `revisions`
- `user_revisions`
- `title`
- `tags`
- `user_last_revision_date`
- `user_last_revision_time`
- `previous_revision_date`
- `previous_revision_time`
- `flags`

If some columns are missing, the assistant must state the limitation and reduce confidence accordingly.

Required for high-confidence relevance filtering:

- `user_last_revision_date`
- `user_last_revision_time`

Useful for analysis but not required:

- `previous_revision_date`
- `previous_revision_time`
- `tags`
- `flags`

## Column Semantics

`section` is the Onliner section, for example `people`, `money`, `sport`, `auto`, `tech`, `realt`.

When referring to sections in user-facing text, use these Russian display names with a capital letter:

| section | display name |
| --- | --- |
| `people` | `Люди` |
| `money` | `Кошель` |
| `sport` | `Спорт` |
| `auto` | `Авто` |
| `tech` | `Течь` |
| `realt` | `Недвига` |

Do not invent other Russian names for these sections in reports, diagnostics, tooltips, or viewer-facing labels unless the user explicitly changes this mapping. Do not leave English section names such as `People/Money`, `sport`, `Tech`, or `Sport/Tech` in rendered notes; write `Люди/Кошель`, `Спорт`, `Течь`, or `Спорт/Течь`.

`date`, `weekday`, and `time` describe the material publication date/time from the report.

`sticky` marks sticky materials.

`layout` describes material type, for example `news`, `longread`, `photoreport`.

`volume` is a rough size signal. Use it only for classifying substantial extra materials, not as direct payment.

`revisions` is total revision count. Do not use it for payment.

`user_revisions` is count of the target user's revisions. Do not use it for payment.

`user_last_revision_date` and `user_last_revision_time` show the target user's latest revision on the material. Use them as the primary relevance source.

`previous_revision_date` and `previous_revision_time` show the latest non-user revision before the target user's first revision. Treat this as an approximate handoff-to-proofreading signal, not an official `submitted_at` value.

`tags` may contain special project markers and topical flags.

`flags` may contain export hints such as `old_revision`. Treat flags as hints, not as payment rules.

## Manual Inputs

Before finalizing the analysis, identify which manual inputs are available and which are missing.

Relevant manual inputs:

- report month
- confirmed duty dates
- whether SMM duty applies
- whether sport block applies for the month or period
- confirmed lunch replacements, if known
- special project rates, if any
- any local exceptions for the month

If manual inputs are missing, infer candidates from the report when possible, but do not treat inferred items as confirmed.

## Relevance Filtering

Primary relevance source:

- `user_last_revision_date`
- `user_last_revision_time`

Use these fields to decide whether the target user's work happened within the reporting relevance window.

Recommended relevance window:

- `relevantStart = first day of report month minus 7 days`

Example:

- May 2026 report → `relevantStart = 2026-04-24`

A row is relevant when `user_last_revision_date + user_last_revision_time` is on or after `relevantStart`, unless a stronger manual rule says otherwise.

Rows with missing or old `user_last_revision_date/time` should go to Manual Review or Suspicious Rows. Do not automatically count them.

Do not use these fields as payment signals:

- `revisions`
- `user_revisions`
- `previous_revision_date`
- `previous_revision_time`

`previous_revision_date/time` is informational only. It helps explain when a material likely came to proofreading.

If `user_last_revision_date/time` are absent, the analysis is still possible, but relevance confidence is low. State this explicitly.

## Payment Rules

Default known rates:

| Item | Rate | Meaning |
| --- | ---: | --- |
| Base people/money block | 1900 | Monthly base for morning proofreading in `people` and `money` |
| Sport block | 300 | Morning `sport` block, week-on/week-off; block-based, not per article |
| Duty day | 175 | Count per confirmed duty day; two duty days normally total 350 |
| SMM duty day | 18 | Count per confirmed duty day when SMM duty applies; two duty days normally total 36 |
| Sunday duty sport/tech article | 35 | Separate article in `sport` or `tech` during Sunday duty |
| Catalog extra | 18 | Side morning longread with Onliner Catalog status |
| Evergreen extra | 18 | Side morning longread with evergreen status |
| Replacement longread | 17 | Regular longread substitution in another section, for example vacation replacement |
| Lunch replacement | 4 | Small replacement item, requires confirmation or candidate status |

These rates are not universal market rates. They are project-specific defaults. If the user gives different rates for a month, use the user-provided rates and state the override.

## Classification Priority

A row may have multiple signals, but it should not be paid multiple times unless the user explicitly confirms separate payment.

Use this priority order:

1. base `people`/`money` monthly block
2. sport block
3. duty block
4. Sunday duty `sport`/`tech` paid article
5. SMM duty manual item
6. sticky non-08 weekday additional text
7. additional substantial own-section text
8. lunch replacement candidate
9. special project marker
10. manual review

The priority is for payment classification. Signals can still be reported even when the row is already covered.

## Base People/Money Block

The base block covers regular morning proofreading in:

- `people`
- `money`

Do not count these rows individually when calculating the base amount. The base amount is a monthly block.

Morning rows are usually around `08:00`, but the report should be inspected for local schedule patterns.

Base rows can still carry informational flags, such as special project markers, but those flags do not automatically create extra payment.

## Sport Block

The sport block is a separate block, usually week-on/week-off.

Rules:

- Treat it as a block amount, not a per-row amount.
- Identify morning `sport` rows and group them by likely active periods.
- Confirm the sport block when the report shows two active weekly periods with regular morning `sport` materials.
- A weekly period does not need to contain a material on every calendar day. One missing day inside an otherwise clear active sport week does not make the block uncertain.
- Do not count each morning sport row separately unless the user explicitly gives a per-article sport rule.
- Non-morning `sport` news outside the active weekly periods should be treated as duty, lunch replacement, or manual-review signals depending on context.

## Duty Block

Duty may happen on weekends and can include materials from any section.

During duty, rows may include:

- `news`
- `longread`
- `photoreport`
- multiple sections
- non-morning times

Duty is normally detected as a weekend block, but the payment event must store it as a per-day calculation: `rate: 175`, `count: detected duty day count`, and amount `rate × count`. Two duty days normally total 350.

If duty dates are known, use them as confirmed.

If duty dates are not known, confirm duty when the report shows dense daytime weekend activity on Saturday and Sunday, especially when:
- there are multiple `news` rows during the day;
- several sections are involved;
- activity continues outside normal morning proofreading slots;
- the pattern spans both weekend days.

Do not mark this pattern as uncertain merely because the user did not manually provide duty dates. Dense multi-section daytime weekend activity is a strong enough signal to confirm duty.

Do not treat all duty rows as separate paid items. They are covered by the duty block unless a specific additional rule applies.

## SMM Duty

SMM duty is usually not visible in the report.

When duty is confirmed, automatically add SMM duty using the per-day default SMM duty rate unless the user explicitly says SMM duty did not apply or gives a different local rule. Store SMM as `rate: 18`, `count: detected duty day count`, and amount `rate × count`.

Do not require visible SMM rows in the admin report. SMM work is not expected to be visible in this export.

## Sunday Duty Sport/Tech Articles

During Sunday duty, separate `sport` or `tech` materials are paid at the Sunday duty article rate.

Rules:

- Count when Sunday duty is confirmed.
- Count both `sport` and `tech` Sunday duty articles when both are present.
- Prefer substantial article-like rows: `longread`, meaningful `photoreport`, or another explicitly article-like material.
- Do not count every small `sport` or `tech` news row automatically unless the user confirms that news rows also use the Sunday duty article rate.
- Do not use the same Sunday duty `sport` row as both sport-block evidence and Sunday duty article evidence. When a Sunday `sport` row is counted under `duty_sunday`, remove it from `line_sport.rowIds` and keep it under `line_duty_sunday`. The sport block may still be confirmed from the broader active sport periods, but the row-level quick filters must not overlap.
- If duty is not confirmed, keep these rows as candidates.

## Lunch Replacement Candidates

Lunch replacement is a small paid item and should be treated cautiously.

Signals:

- small or ordinary `news`
- non-base timing
- outside obvious base/sport/duty coverage
- often low volume, but volume alone is not decisive

Rules:

- Default rate is 4.
- Treat as candidate unless user confirms.
- Group small weekday `news` help by `date + section` before calculating the candidate amount. If several non-weekend small `news` rows fall on the same date/section and are outside base, sport, and duty coverage, count them as one `sub_day` candidate item with one payment, not as separate paid rows. Preserve all row IDs as evidence for that single candidate event.
- Do not confuse with substantial additional texts.
- Do not count inside confirmed duty unless the user states lunch replacement also applies there.

## Additional Substantial Own-Section Texts

Look for additional substantial materials in the user's regular sections.

Strong candidate pattern:

- same day has a normal base material in `people` or `money`
- same section has another substantial material
- substantial means `longread`, meaningful `photoreport`, or `volume >= 1000`

Rules:

- These are candidates for extra work or manual review.
- Do not automatically assign a rate unless the user provided one.
- Small `news` rows should usually go to lunch replacement candidates or manual review instead.

## Sticky Non-08 Weekday Materials

Weekday sticky materials outside the normal morning time can be additional paid signals.

Rules:

- Detect `sticky` rows on weekdays where `time` is not the normal morning slot.
- Mark as additional candidate or manual review depending on context.
- Do not count automatically if already inside confirmed duty or another covered block.

## Special Project Markers

Special projects are detected from `tags`.

Common markers include:

- `сп`
- `sp`
- tag patterns containing `-сп-`
- tag patterns containing `-sp-`
- variants where marker formatting is imperfect

Examples:

- `вдохновение-сп-альфа-7`
- `варикоз-сп-сервьер`
- `виды спорта-сп-Betera`
- `vidy-sporta-sp-betera`
- `взрослый спорт-сп-спортклуб`
- `студентка в 46-сп-гриндекс`

Rules:

- A special project marker does not automatically create payment.
- If the row is already covered by base, sport, or duty, report it as `covered + special_project_info`.
- If the row is outside covered blocks, put it into Manual Review as possible separate payment.
- Do not sum special projects without an explicit rate or user confirmation.

## Evergreen Markers

Evergreen rows are detected from the `flags` column.

Rules:

- Detect `evergreen` separately from special projects.
- Do not treat evergreen as a payment rule by itself.
- If the row is relevant by `user_last_revision_date/time`, keep it in the relevant dataset and classify it by the normal block rules.
- If the row has an old `user_last_revision_date/time`, put it into suspicious old revisions or manual review.
- Always show evergreen rows separately in Signals so they are not mixed with special projects.

## Signals and Manual Review

The assistant should surface signals instead of hiding uncertainty.

Signal types:

- special project markers
- suspicious old revisions
- missing `user_last_revision_date/time`
- rows outside expected blocks
- dense weekend activity suggesting duty
- possible lunch replacements
- substantial same-section extras
- sticky non-08 rows
- rows already covered but worth noting

Manual Review rows should include enough context to decide quickly.

Recommended columns:

- `date`
- `section`
- `time`
- `layout`
- `title`
- `reason`
- `suggested_action`

## No-Double-Counting Rules

Do not count a row twice just because it matches multiple signals.

Examples:

- A base `money` longread with a special project tag is base-covered plus special-project info, not automatic extra pay.
- A duty-day `news` row is duty-covered unless a separate lunch replacement rule is confirmed.
- A Sunday `sport` row during confirmed duty can receive separate Sunday duty article payment even if the sport block also applies.
- `user_revisions > 0` proves participation but does not create payment.

If uncertain, classify as candidate or manual review, not confirmed payment.

## Required Output Format

The assistant must return the analysis in this structure.

### 1. Assumptions

Include:

- report month
- input format: CSV or TSV
- relevance window
- manual inputs used
- missing manual inputs
- confidence caveats

### 2. Data Quality Check

Include:

- row count
- detected columns
- missing important columns
- whether `user_last_revision_date/time` are usable
- suspicious old or empty revision fields

### 3. Payment Summary

Use a table with:

- `item`
- `rate`
- `count/block`
- `amount`
- `status`: `confirmed`, `candidate`, or `manual`
- `notes`

Separate confirmed and candidate items.

### 4. Covered Blocks

Include:

- base people/money block
- sport block
- duty dates
- SMM duty, automatically added when duty is confirmed

### 5. Additional Paid Candidates

Group candidates by type:

- Sunday duty `sport`/`tech`
- sticky non-08
- substantial own-section extras
- lunch replacements

### 6. Signals

Include non-payment signals:

- special projects
- evergreen rows
- suspicious old revisions
- missing user revision dates
- already covered but notable rows

### 7. Manual Review

Use a table with:

- `date`
- `section`
- `time`
- `layout`
- `title`
- `reason`
- `suggested_action`

### 8. Final Total

Always separate:

- confirmed total
- candidate total
- possible total, if useful

Do not collapse unresolved candidates into one final number without labeling them.

## Confidence Rules

Use `confirmed` when:

- the rule is explicit
- required manual input is present
- row is relevant by `user_last_revision_date/time`
- no double-counting conflict exists

Use `candidate` when:

- the row matches a known pattern but needs user confirmation
- duty or sport boundaries are inferred
- lunch replacement is plausible but not confirmed
- special payment rate is unknown

Use `manual` when:

- required columns are missing
- relevance is unclear
- the row conflicts with another category
- the material appears special but has no rate

## Hard Rules

- Do not finalize lunch replacements without candidate/manual status unless confirmed.
- Do not use `revisions` or `user_revisions` as payment metrics.
- Do not use `previous_revision_date/time` as relevance filtering.
- Do not automatically count special projects as extra payment.
- Do not double-count rows across base, sport, duty, special project, and lunch replacement categories.
- Do not hide missing inputs. State them in Assumptions or Data Quality Check.
- Prefer partial, honest totals over a falsely precise final amount.

## Monthly Workflow

1. User provides monthly CSV or TSV.
2. User provides known manual inputs, if available.
3. Assistant validates columns and relevance fields.
4. Assistant classifies rows using this skill.
5. Assistant returns structured output with confirmed/candidate/manual separation.
6. User confirms or rejects candidates.
7. Assistant updates final total if needed.

## Minimal User Handoff for a New Month

Ask the user for:

- the report file
- the report month
- confirmed duty dates, if known
- whether SMM duty applies
- whether sport block applies
- confirmed lunch replacements, if known

If the user only provides the file, proceed with best-effort analysis and mark missing inputs clearly.


## Artifact Report Output

For monthly analysis, prefer producing a standalone Markdown artifact in addition to a short chat summary.

The chat response should contain only:

- confirmed total
- candidate/manual total, if any
- link to the artifact
- short list of unresolved manual inputs

The artifact should contain the full calculation and evidence.

Recommended artifact structure:

1. Executive Summary
2. Inputs and Assumptions
3. Data Quality
4. Confirmed Payment Summary
5. Candidate / Manual Amounts
6. Covered Blocks
7. Duty Evidence
8. Sport Block Evidence
9. Additional Morning Longread Signals
10. Special Project Rows
11. Evergreen Rows
12. Sunday Duty Sport/Tech Articles
13. Lunch Replacement Candidates
14. Manual Review
15. Final Totals
16. Appendix: Row-Level Tables

The artifact must separate payment classification from editorial/status classification.

Special and evergreen are different dimensions and must be shown in separate tables:

- `special` means special project / sponsored / partner marker.
- `evergreen` means reusable or updated old material.

A row may be both payment-covered and editorially notable. Do not merge these signals into one bucket.

## Automatic Sport Confirmation

Confirm the sport block automatically when the report shows two active weekly sport periods with regular morning sport materials.

A week does not need to contain a sport article every single day. One missing day inside an otherwise clear week-on/week-off sport pattern does not make the block uncertain.

When this pattern is present, classify the default sport block as `confirmed`, not `candidate`.

Do not count sport materials per article for the sport block. The sport block remains a block amount.

## Automatic Weekend Duty Confirmation

Confirm a duty block automatically when the report shows dense activity across Saturday and Sunday with these signals:

- multiple sections are present;
- multiple daytime rows are present outside normal morning slots;
- several `news` rows are present;
- activity spans both Saturday and Sunday;
- the pattern clearly differs from normal weekday morning proofreading.

When this pattern is present, classify the duty block as `confirmed`, not `candidate`.

## Automatic SMM Duty With Duty Block

When a duty block is confirmed, automatically add the SMM duty amount as a per-day calculation: 18 per detected duty day.

SMM work is usually not visible in the admin report. Do not require a separate row-level signal for SMM when duty is already confirmed.

If the user explicitly says SMM was not paid for a specific month, apply the user override and state it.

## Sunday Duty Sport/Tech Articles During Duty

When Sunday duty is confirmed, count Sunday `sport` and `tech` article-like rows separately at the Sunday duty sport/tech article rate.

Article-like rows are `longread` rows by default.

`photoreport` and small `news` rows should not be counted under this rule unless the user explicitly says they qualify.

This rule may coexist with a confirmed sport block at the payment-block level, but it must not reuse the same row in both `line_sport.rowIds` and `line_duty_sunday.rowIds`. If a Sunday `sport` material is part of duty, classify that row as `duty_sunday` for row-level evidence and quick filtering. The sport block remains a monthly block confirmed from the broader active sport periods.

## Additional Morning Longread Signals

Detect additional morning longreads by section and date.

A day has an additional morning longread signal when:

- the row is relevant by `user_last_revision_date/time`;
- `layout` is `longread`;
- `time` is a normal morning slot, usually `07:00` or `08:00`;
- the same `section` has more than one relevant morning longread on the same publication date.

In that case, treat one morning longread as covered by the normal block for that section/day and mark every additional morning longread in the same section/day as a likely extra paid material.

If the rate for such additional morning longreads is not known, do not add them to the confirmed money total. Instead show:

- count of extra morning longreads;
- row-level table;
- status `manual_rate`;
- suggested action: confirm the rate or mark as non-paid exception.

Do not discard the signal because it occurs inside a base, sport, or duty period. Show it separately and avoid summing it until the rate is known or the user confirms the month-specific handling.

Special and evergreen statuses are not additional-longread triggers by themselves. If a special or evergreen material is the only relevant morning longread in its section on that publication date, do not mark it as additional. Mark it only in the Special Project Rows or Evergreen Rows tables.

If a section has multiple relevant morning longreads on the same date and one of them is special or evergreen, the extra-longread signal is based on the count and section/day pattern, not on the special/evergreen status. Keep both dimensions visible separately.

## Special Project Detection

Detect `special` rows from either:

- `flags` containing `special`;
- tag segments containing explicit special-project markers.

Recognized tag marker patterns include:

- `-сп-`
- tag ending with `-сп`
- tag starting with `сп `
- `-sp-`
- tag ending with `-sp`
- tag starting with `sp `

Tags are comma-separated. Apply marker detection to tag segments, not to arbitrary substrings inside words.

Do not treat ordinary words such as `Спорт`, `Сплав`, or `Спасение` as special project markers.

Special project markers do not automatically create extra payment unless a rate or local rule is provided.

## Evergreen Detection

Detect `evergreen` rows from `flags` containing `evergreen`.

Evergreen is separate from special project detection.

An evergreen row can still be relevant and payable when `user_last_revision_date/time` falls inside the relevance window. Do not exclude relevant evergreen rows solely because they are evergreen.

Always show evergreen rows in a separate table.


## Spreadsheet Payment Payload

When the user needs to fill the monthly payment spreadsheet, produce separate machine-oriented payload artifacts in addition to the human-readable analysis artifact.

Produce two payload forms when practical:

```text
onliner-report-YYYYMM-payment-payload.json
onliner-report-YYYYMM-payment-paste.tsv
```

Use the JSON payload as the auditable source of truth: it should preserve semantic line items, evidence, formulas, computed values, statuses, and notes. Use the TSV payload as the practical clipboard artifact: the user can open the target spreadsheet, select the start cell, usually `A1`, and paste the TSV block. Spreadsheet editors normally split TSV into cells more reliably than DOM-click automation.

The TSV payload is preferred for manual transfer into the spreadsheet. CSV is not preferred for this workflow because Russian formulas use semicolon separators and decimal commas; TSV avoids conflicts with formula syntax and pasted text.

Required JSON payload fields:

- `schema` — stable payload schema name and version.
- `month` — report month.
- `source_report` — source export filename.
- `formula_locale` — usually `ru-RU`.
- `totals` — base salary, confirmed additions, candidates, and possible total.
- `paste_cells` — cell-oriented list with `cell`, `value` and/or `formula`.
- `line_items` — semantic list of the same payments with rows/evidence.
- `not_counted_as_additional_when_single` — special/evergreen/catalog rows that were status-only and not additional.
- `notes` — operational caveats.

Required TSV payload rules:

- It must be a direct rectangular paste block.
- The default target is the visible additions table starting at `A1`.
- Use tab characters between cells and newline characters between rows.
- Empty cells must remain present as empty tab-separated fields so formulas land in the correct columns.
- Put spreadsheet formulas directly into target cells, not computed numbers.
- Include totals formulas when the target table expects them, for example `=СУММ(C2:C14)`.
- Keep a JSON payload alongside the TSV when evidence or reviewability matters.

Spreadsheet formulas must use the spreadsheet locale expected by the user. For the current Russian spreadsheet, use semicolon separators, decimal commas, and Russian function names, for example:

```text
=ОКРУГЛВВЕРХ(175*2;0)
=ОКРУГЛВВЕРХ(18*2;0)
=ОКРУГЛВВЕРХ(35*2;0)
=ОКРУГЛВВЕРХ(37,5*2;0)
=ОКРУГЛВВЕРХ(18*4;0)
=ОКРУГЛВВЕРХ(17*2;0)
=СУММ(C2:C14)
```

Do not output only final numbers when the spreadsheet cell expects formulas. Include the formula and the computed value in JSON, and the formula in TSV.

For the top additions table, group values by the spreadsheet's practical rows when possible:

- duty weekend block;
- Sunday duty sport/tech articles;
- SMM duty;
- traffic duty bonus if confirmed;
- special projects;
- evergreen;
- catalog;
- vacation replacement;
- sport block, placed in a free premium row if the sheet has no dedicated sport row.

Special, evergreen, and catalog payment rows must be based on additional-material logic, not on marker presence alone. If a special/evergreen/catalog item is the only relevant morning longread in its section on that date, do not put it into the paid spreadsheet row. Put it into `not_counted_as_additional_when_single` and the corresponding status table in the analysis artifact.

If a row has both catalog and evergreen markers, assign it to only one spreadsheet row to avoid double counting. Prefer `catalog` over `evergreen` when the material is explicitly tagged as Catalog Onlíner, because catalog has its own rate.

If a rate is uncertain, keep the item in `line_items` with a non-confirmed status and do not include it in confirmed totals or the confirmed TSV formulas unless the user explicitly asks for a candidate TSV.

## First-Pass Extra Text Classification

Do not discover extra morning texts as a late manual cleanup. Build them during the first classification pass from the same normalized relevant row set used for payment totals.

Run first-pass classification in this order:

1. Normalize rows, deduplicate by `live`, parse dates and times, and filter relevance by `user_last_revision_date/time`.
2. Detect orthogonal row statuses: `special`, `evergreen`, `catalog`, `duty_candidate`, `sport_block_candidate`, `vacation_replacement_candidate`.
3. Confirm block-level payments when automatic rules match: base people/money, sport block, weekend duty, SMM with duty.
4. Build morning groups by `date + section` from relevant rows where `layout` is `longread` and `time` is usually `07:00` or `08:00`.
5. For every morning group with more than one row, assign a row-level morning role before calculating spreadsheet rows.

Morning role values:

- `primary_assumed` — the row treated as the covered/main morning text for that section/day.
- `extra_special` — an additional morning text with special-project status.
- `extra_evergreen` — an additional morning text with evergreen status.
- `extra_catalog` — an additional morning text with catalog status.
- `extra_assumed` — an additional morning text that is not special, evergreen, or catalog, but is still likely extra because the same section/day has multiple morning longreads.
- `extra_manual` — an additional morning text where the main/extra split is unclear and the user has not established that these should be added automatically.
- `duty_extra_allowed` — a same-section morning extra inside confirmed weekend duty that should still be counted as an extra morning text when the group has multiple morning longreads.
- `excluded_duty_overlap` — a duty row excluded only when it is already fully covered by a different explicit duty-specific rule and is not part of a same-section multiple-morning-longread group.
- `excluded_vacation_weekend` — a non-working-day row in a replacement section, for example Saturday `tech`, that should not be counted as vacation replacement unless explicitly confirmed.

Choosing `primary_assumed`:

- Prefer the ordinary regular morning row as the primary text when the same group also contains `special`, `evergreen`, or `catalog` rows.
- Prefer `08:00` over `07:00` when both are ordinary and no stronger status explains the split.
- If both rows are ordinary and similarly plausible, mark one `primary_assumed` and the others `extra_assumed`; do not hide the uncertainty. Add a note explaining that the split is inferred.
- Never count a single special, evergreen, or catalog row as extra when it is the only morning longread in that section/day.

Payment treatment:

- `extra_special`, `extra_evergreen`, and `extra_catalog` feed the corresponding spreadsheet rows when the local rate is known.
- `extra_assumed` feeds the general additional-text row when the local rule for ordinary second morning texts is established for the month. In the current ledger flow, ordinary second morning texts are counted as confirmed `xtra_longread` / `xtra_lr` unless a concrete exception is found. Do not mark confirmed `xtra_lr` rows as `needsReview` only because they are second morning texts.
- `extra_manual` is never summed until resolved.
- Confirmed weekend duty does not suppress same-section multiple-morning-longread extra counting. If a duty Saturday/Sunday has more than one relevant morning `longread` in the same section, assign `primary_assumed` and `extra_*` roles exactly as on weekdays and include the extra rows in the appropriate spreadsheet bucket.
- Keep explicit Sunday duty `sport`/`tech` article payments separate from same-section morning extras; both rules may apply when their conditions are met.
- Use `excluded_duty_overlap` only for duty rows that do not belong to a same-section multiple-morning-longread group and are already covered by the duty block or another explicit duty rule.
- Vacation replacement is counted by relevant weekday morning rows in the replacement section. Exclude Saturday/Sunday replacement-section rows unless the user explicitly confirms they were part of the replacement.

The analysis artifact must include a row-level table for all morning groups with more than one row. Required columns:

- `date`
- `section`
- `time`
- `layout`
- `title`
- `flags`
- `status_dimension` (`regular`, `special`, `evergreen`, `catalog`, or combined)
- `morning_role`
- `payment_bucket`
- `counted`
- `reason`

The spreadsheet JSON payload must preserve these row-level decisions in an `extra_morning_rows` array, even when the TSV only contains aggregated payment formulas.

## Canonical Classification Labels v2

Use these labels for first-pass row classification and payment-event aggregation. These labels supersede older names such as `primary_assumed`, `extra_assumed`, `extra_special`, `extra_evergreen`, `extra_catalog`, and `old_revision` when producing new artifacts.

Payment buckets:

| bucket | Meaning | Count mode |
| --- | --- | --- |
| `base` | Monthly people/money base block | block |
| `sport` | Sport block | block |
| `duty` | Weekend duty block | block |
| `duty_smm` | SMM duty addition | block, auto with confirmed duty |
| `duty_sunday` | Sunday duty sport/tech article | per article |
| `sub_long` | Regular longread substitution in another section, for example weekday tech vacation replacement | per day/article |
| `xtra_sp` | Side morning longread with special-project status | per side row |
| `xtra_eg` | Side morning longread with evergreen status | per side row |
| `xtra_oc` | Side morning longread with Onliner Catalog status | per side row |
| `xtra_lr` | Side morning regular longread without `sp`, `eg`, or `oc` status | per side row, reviewable |
| `sub_day` | One-off day/lunch/small substitution | per grouped date/section item, usually candidate |

Row roles:

| role | Meaning |
| --- | --- |
| `main` | Main/covered row inside a same-date same-section morning group |
| `side` | Additional row inside a same-date same-section morning group |
| `single` | Only morning longread in its date/section group |
| `none` | Role is not applicable, for example non-morning news or block-level-only evidence |

Row statuses:

| status | Meaning |
| --- | --- |
| `regular` | No special, evergreen, or Onliner Catalog signal |
| `sp` | Special-project signal |
| `eg` | Evergreen signal |
| `oc` | Onliner Catalog signal |
| `refresh` | Row is visible in the report month but the target user's revision is outside the relevance window or flagged old |
| `duplicate` | Duplicate row excluded from totals |
| `excluded` | Row is intentionally visible but not counted |

When multiple status signals are present, preserve all signals in a row-level `signals` array. For the primary scalar `status`, prefer `oc` over `eg` when a row has both Catalog and evergreen signals, because the spreadsheet has a dedicated Catalog row and this prevents double counting.

`xtra_lr` must only be assigned to rows where `layout` is exactly `longread`. Do not assign `xtra_lr` to `news` or `photoreport`. If additional payment for other layouts becomes relevant, create a separate explicit bucket instead of overloading `xtra_lr`.

## Row-Level Analysis JSON v2

For new monthly analyses, produce a canonical JSON artifact in addition to markdown/TSV outputs:

```text
onliner-report-YYYYMM-analysis.json
```

The JSON is the source of truth for the interactive review page and for auditable payment aggregation. It should not be replaced by the HTML viewer. The viewer is only a local interface for inspecting this JSON.

Required top-level fields:

- `schema` — use `onliner_monthly_analysis/v2`.
- `month` — report month, for example `2026-06`.
- `sourceReport` — source export filename.
- `generatedAt` — generation timestamp.
- `relevance` — object with `relevantStart` and relevance source.
- `labels` — declared buckets, roles, statuses, and icon maps.
- `rates` — effective rates used for this analysis.
- `totals` — confirmed, candidate, and possible totals.
- `counts` — row counts by bucket/status and review counts.
- `paymentEvents` — semantic payment events used for totals.
- `rows` — normalized row-level records.

Required row fields:

- `id` — stable row identifier, preferably based on post id.
- `date`, `weekday`, `time`, `section`, `sticky`, `layout`.
- `layoutIcon`, `timeIcon`, `stickyIcon`.
- `live`, `edit`, `postId`, `slug`.
- `title`, `tags`, `flags`, `author`, `volume`.
- `previousRevisionAt`, `userLastRevisionAt`, `relevant`.
- `status`, `signals`, `role`, `buckets`, `bucket`.
- `pay`, `payAmount`, `needsReview`, `reviewReason`, `reason`, `groupKey`, `notes`.

Keep both `buckets` and `bucket`. `buckets` is the complete set of row-level payment/block signals. `bucket` is the primary display bucket, usually the most specific payable bucket. For example, a duty-weekend money side longread may have `buckets: ["base", "duty", "xtra_lr"]` and `bucket: "xtra_lr"`.

Required payment-event fields:

- `key` — stable event key.
- `bucket` — one canonical bucket.
- `status` — `confirmed`, `candidate`, or `manual`.
- `rate`, `count`, `amount`, `formula`.
- `rowIds` — rows supporting this event when applicable.
- `note` — short explanation.

Totals must be calculated from `paymentEvents`, not by summing all rows blindly. Row-level `payAmount` exists for viewer convenience and filtered review totals, but block-level payments such as `base`, `sport`, `duty`, and `duty_smm` must be represented as payment events.

## Review Viewer Artifact

For local review, generate a static HTML viewer:

```text
onliner-report-viewer.html
```

The viewer must not contain private report data by default. It should load a local `onliner-report-YYYYMM-analysis.json` file through a file input. This keeps admin links and report data off public hosting.

The viewer should work as a standalone file with no build step, no server, and no external dependencies. It may be committed to a private repository as tooling. Do not publish self-contained report HTML with embedded admin URLs to a public GitHub Pages site.

Required icon map:

| Source value | Icon |
| --- | --- |
| `layout=longread` | `📰` |
| `layout=news` | `🗞️` |
| `layout=photoreport` | `📸` |
| `time=08:00` | `8️` |
| `time=07:00` | `7️⃣` |
| other time | `*️` |
| `sticky=left` | `⬅️` |
| `sticky=right` | `➡️` |

The viewer may expose a review toggle only for genuinely unresolved rows. Do not use `Чек` as a second label for confirmed paid extras. For confirmed ordinary extra morning texts, emit:

```js
row.buckets.includes('xtra_lr')
row.pay === true
row.needsReview === false
```

Use `needsReview: true` only when the row needs a user decision before it can be counted or excluded. Candidate payment events should remain candidate at `paymentEvents[].status`, but they should not force unrelated confirmed rows into `Чек`.

Minimum manual filters:

- bucket
- status
- role
- section
- pay
- text search over title/tags/reason/review reason

The viewer should show bottom totals:

- total confirmed amount from `paymentEvents`;
- possible amount from `paymentEvents`;
- number of shown rows vs all rows;
- sum of `payAmount` for currently shown rows, clearly labeled as a filtered row-level amount rather than the official total.

The viewer should also show a `paymentEvents` table so block-level items remain visible even when row-level filters are active.

### Filtered export requirements

The viewer should support exporting the currently visible filtered review state without embedding the full original JSON:

- `Export filtered CSV` — exports only currently visible rows as UTF-8 with BOM and semicolon delimiter. Include machine-readable fields such as `bucket`, `buckets`, `status`, `role`, `pay`, `payAmount`, `live`, `edit`, `reason`, and `reviewReason`.
- `Export filtered HTML` — exports a static snapshot containing only currently visible rows and related `paymentEvents`. Keep `live` and `admin` links clickable. Do not include the full source JSON in this snapshot.
- `Print / Save PDF` — calls `window.print()` after the user applies filters. The viewer must include print CSS that hides controls, keeps links visible, and formats tables for PDF output.

Snapshot totals should distinguish:

- `row-level pay по фильтру` — sum of `payAmount` for visible rows;
- `related events amount` — sum of payment events related to visible rows or matching the active bucket filter;
- global confirmed/possible totals from the full analysis.

Do not treat a filtered snapshot as the canonical payroll source. It is a review/export artifact only. Official totals still come from full `paymentEvents` in `analysis.json`.

## Deployment Rule

Preferred private deployment model:

- commit `onliner-report-viewer.html` as static tooling;
- keep monthly `analysis.json` files local or in a private location;
- open the viewer locally and load the JSON through the browser file input.

Avoid publishing report JSON or self-contained report HTML to public GitHub Pages because rows may contain admin URLs and internal editorial/payment information.

## Ledger Viewer v3

Use `ledger.html` as the canonical local review viewer name. Avoid `viewer.html` for this workflow because it is too generic. The ledger is a static tool that loads a monthly JSON file through a browser file input.

The canonical monthly JSON for the ledger should use schema `onliner.monthly.ledger.v3` and include:

- `rows` — normalized row-level data with `bucket`, `buckets`, `status`, `role`, `pay`, `payAmount`, `needsReview`, links, icons, and explanation fields;
- `paymentEvents` — official payroll-calculation events;
- `reportLines` — user-facing rows that correspond to the payroll/Yandex table and act as first-class quick filters in the ledger.
- `links.sheet` — optional HTTPS link to the payroll table; the viewer reveals it only after this local JSON is loaded and must not embed it in the public HTML.

`reportLines` shape:

```json
{
  "id": "line_xtra_special",
  "label": "Спец | 16Л, 23С",
  "bucket": "xtra_sp",
  "targetColumn": "premium",
  "status": "confirmed",
  "amount": 75,
  "eventIds": ["xtra_special"],
  "rowIds": ["post-...", "post-..."],
  "note": ""
}
```

Ledger quick filters must be driven by `reportLines`, not by string guessing. Use short Russian labels for UI-facing report lines. The current UI names are: `Дежурство`, `Дежурство #Воскрес`, `Дежурство #SMM`, `Дежурство #Трафик`, `Спорт`, `Спец`, `Зелень`, `Каталог`, `Замена`, `Допы`, `Обед`, `Вечер`. Clicking a report-line filter must show only the row IDs attached to that report line. `Дежурство #SMM` and `Дежурство #Трафик` are optional payment toggles in the ledger UI, not default quick filters.

Sport and Sunday duty separation:

- `line_sport` is the monthly sport block quick filter. It should show regular sport-block evidence rows only.
- `line_duty_sunday` is a duty quick filter. It should show Sunday duty `sport`/`tech` article rows.
- The same row must not appear in both `line_sport.rowIds` and `line_duty_sunday.rowIds`.
- If a Sunday sport article is read because of duty, prefer `line_duty_sunday` for row-level classification even when the sport block is also confirmed for the month.


### Ledger key dictionary

Use one stable dictionary for payroll keys. Keep machine keys English and hierarchical; keep rendered labels short and Russian. Do not derive labels from keys in analysis output; write explicit `label` or let the ledger map known keys. For extra status-specific payments, use full event and report-line names such as `xtra_special`, `xtra_evergreen`, `xtra_catalog`, `line_xtra_special`, `line_xtra_evergreen`, and `line_xtra_catalog`; do not expose abbreviated `sp`, `eg`, or `oc` names in user-facing text.

Canonical `reportLines[].id` values:

| id | label | meaning |
| --- | --- | --- |
| `line_duty` | `Дежурство` | weekend duty block |
| `line_duty_sunday` | `Дежурство #Воскрес` | Sunday fifth-article duty item |
| `line_duty_smm` | `Дежурство #SMM` | optional SMM duty supplement |
| `line_duty_traffic` | `Дежурство #Трафик` | optional traffic duty bonus |
| `line_sport` | `Спорт` | monthly sport block |
| `line_xtra_special` | `Спец` | extra special-project longreads |
| `line_xtra_evergreen` | `Зелень` | extra evergreen longreads |
| `line_xtra_catalog` | `Каталог` | extra Onliner Catalog longreads |
| `line_xtra_longread` | `Допы` | extra regular longreads |
| `line_sub_longread` | `Замена` | vacation/section longread replacement |
| `line_sub_dinner` | `Обед` | lunch/small day replacement candidate |
| `line_sub_evening` | `Вечер` | evening replacement, when present |

Canonical `paymentEvents[].key` values:

| key | label | bucket |
| --- | --- | --- |
| `base_people_money` | `База` | `base` |
| `base_sport` | `Спорт` | `sport` |
| `opt_duty` | `Дежурство` | `duty` |
| `opt_duty_traffic` | `Дежурство #Трафик` | `duty_traffic` |
| `opt_duty_smm` | `Дежурство #SMM` | `duty_smm` |
| `opt_duty_sunday` | `Дежурство #Воскрес` | `duty_sunday` |
| `opt_sub` | `Замена` | `sub_long` |
| `xtra_special` | `Спец` | `xtra_sp` |
| `xtra_evergreen` | `Зелень` | `xtra_eg` |
| `xtra_catalog` | `Каталог` | `xtra_oc` |
| `xtra_longread` | `Допы` | `xtra_lr` |
| `opt_sub_dinner` | `Обед` | `sub_day` |

Deprecated aliases may be read by the viewer for old JSON files, but new analysis output should not emit them: `sport_block`, `weekend_duty`, `traffic_duty_bonus`, `weekend_duty_smm`, `sunday_sport_tech_articles`, `tech_vacation_replacement`, `extra_special_longreads`, `extra_evergreen_longreads`, `extra_onliner_catalog_longreads`, `extra_regular_longreads`, `candidate_sub_day`, `line_xtra_sp`, `line_xtra_eg`, `line_xtra_oc`, `line_xtra_lr`, `line_sub_long`, `line_sub_day`.

Add the payment bucket:

| bucket | meaning | rate |
| --- | --- | --- |
| `duty_traffic` | bonus for traffic duty | 50 |

Add the extra longread bucket:

| bucket | meaning | rate |
| --- | --- | --- |
| `xtra_lr` | extra regular longreads / `Допы` | 37.5 per item, round only the final product |
| `xtra_eg` | extra evergreen longreads / `Зелень` | 18 per side row |
| `xtra_oc` | extra Onliner Catalog longreads / `Каталог` | 18 per side row |
| `sub_long` | replacement longreads / `Замена` | 17 per item/day |

Do not use the old `7` rate for `xtra_lr` / `xtra_longread`. The old `7` row belongs to a different tariff line and must not be used for regular extra longreads.


Rate separation rules:

- `xtra_lr` and `xtra_sp` use the ordinary extra-longread rate when no more specific local rate is set; currently this is 37.5, rounded only after multiplying by count.
- `xtra_eg` must use 18 per side row. Do not inherit the ordinary extra-longread rate for evergreen rows.
- `xtra_oc` must use 18 per side row. Do not inherit the ordinary extra-longread rate for catalog rows.
- `sub_long` / `opt_sub` must use 17 per replacement item/day.
- If the report shows a regular weekday run of replacement-section longreads across a period, classify it as a confirmed replacement block, not as loose uncertain checks. Example: a weekday Tech replacement run should produce one confirmed `sub_long` event with all eligible row IDs, `rate: 17`, `count: eligible replacement item count`, and row-level `pay: true` / `needsReview: false` unless a concrete conflicting signal exists.
- `duty` / `opt_duty` must store count as detected duty days with rate 175, not as a single 350 block.
- `duty_smm` / `opt_duty_smm` must store count as detected duty days with rate 18, not as a single 36 block.

Payroll rounding rule:

- if a per-item rate has fractional rubles, round each item up to a whole ruble before multiplying by count;
- example: `xtra_lr` / `Допы` uses `37.5`; `37.5 × 6 = 225`, not `38 × 6 = 228`;
- event formulas should show the real rate and count, for example `37,5 × 6`;
- final `paymentEvents[].amount`, `reportLines[].amount`, row `payAmount`, and totals must not contain half-ruble values.

`duty_traffic` is a payment event. It may link to the same evidence rows as the confirmed weekend `duty` event, but it should not be folded into `duty`, because the row in the payroll table and the rate are separate.

Ledger deployment model:

- publish only `ledger.html` as static GitHub Pages tooling if needed;
- do not publish monthly JSON with admin links publicly;
- load the monthly JSON locally through the file input;
- use `Export HTML`, `Export CSV`, or browser print/PDF only after applying a filter.

Ledger text fields must be user-facing Russian. In generated JSON, keep `reason`, `reviewReason`, `paymentEvents[].note`, `reportLines[].note`, and other explanatory captions concise and in Russian. Do not leave English diagnostic labels in fields rendered by the ledger UI. Machine keys such as `bucket`, `status`, `role`, `paymentEvents[].key`, and `reportLines[].id` may stay stable English identifiers.

If the user later rejects a paid row, treat that as a source-data correction: regenerate or patch the JSON by removing the row ID from the corresponding `paymentEvents[].rowIds` / `reportLines[].rowIds`, updating `count`, `amount`, `formula`, row `pay`, `payAmount`, `buckets`, and explanatory `reason`. Do not make this a hidden viewer-only override unless the viewer also exports an explicit patched JSON artifact.

## Ledger v0.25 analysis rules

Row-level base separation:

- `base` is salary-block evidence for regular people/money/sport work, not an additional category on duty rows.
- A row must not be rendered or generated as `base + duty`, `base + duty_sunday`, `sport + duty_sunday`, or similar mixed salary/duty evidence.
- If a row is used as duty evidence, classify it under the duty bucket only at row level. Keep the monthly base or sport block as a separate `paymentEvents` block if it is confirmed by the month as a whole.
- `line_sport.rowIds` must not include Sunday duty rows. Sunday sport/tech duty rows belong to `line_duty_sunday`.

Interactive review expectations:

- Time filtering in the ledger treats `07:00` and `08:00` as exact morning slots. Any other clicked time means “other time” and should show all non-`07:00`/non-`08:00` rows.
- Author and tag fields are first-class review filters in the ledger UI. Generated JSON should keep `author` and `tags` clean and human-readable.

## Ledger v0.28 refresh and filter rules

Refresh rows must be marked during analysis, not only in the viewer. A row is `status: "refresh"` when it is visible in the report month but `userLastRevisionAt` is older than `relevance.relevantStart`, or when export flags explicitly contain `old_revision` or `refresh`. Preserve the displaced status signal in `signals`, for example `signals: ["eg"]`, but use scalar `status: "refresh"` so the ledger can show the zombie marker and the `Древность` filter.

Do not mix `base` with weekend duty row-level buckets. If a row is counted as `duty`, `duty_sunday`, `duty_smm`, or `duty_traffic`, remove `base` and `sport` from that row's visible `buckets`; block-level base totals may still exist as separate payment events.

Quick filters in the ledger are conjunctive. Multiple active quick/report-line/table filters must narrow the visible rows with AND semantics, not broaden them with OR semantics.

`Чек` and candidate review are review states. They should be represented in row fields (`needsReview`, candidate payment event rowIds, `status: "candidate"` where appropriate) so the viewer can expose them through summary-card toggles rather than relying on label text.

## Ledger v0.29 duty and refresh rules

Weekend duty should be represented as a separate duty block in the ledger, not as ordinary quick filters. New JSON should still keep explicit machine keys, but the viewer derives the duty card from these records:

- `line_duty` / `opt_duty` for duty days and evidence rows;
- `line_duty_smm` / `opt_duty_smm` for SMM duty, with the day count matching the detected duty days;
- `line_duty_sunday` / `opt_duty_sunday` for Sunday sport/tech duty articles, with row sections preserved so the viewer can show sport/tech icons;
- `line_duty_traffic` / `opt_duty_traffic` for the optional traffic bonus.

`SMM` is automatic when duty is confirmed. `Трафик` remains an explicit optional toggle in the viewer because it may require manual confirmation. Do not expose `line_duty`, `line_duty_sunday`, `line_duty_smm`, or `line_duty_traffic` as ordinary quick-filter chips when a dedicated duty card is present.

Refresh/old rows require an explicit signal. If a row is visible in the report month but should be treated as a raised old material, set `status: "refresh"` and include `"skip_refresh"` in `signals`. Preserve the displaced semantic status in `signals` as well, for example `signals: ["skip_refresh", "eg"]`. This keeps the row auditable while giving the viewer a stable signal for the zombie marker and `Древность` filter.

Do not rely only on UI-side inference for refresh rows. The viewer may infer `refresh` from old revision dates for backward compatibility, but canonical new JSON must mark it during analysis.

## Ledger v0.30 duty card presentation

The duty block is shown in the left summary column before the payroll summary cards. It is not a normal quick-filter group.

Duty-card data must remain explicit in JSON:

- `line_duty` / `opt_duty` provide the detected duty dates and evidence rows;
- `line_duty_smm` / `opt_duty_smm` provide the automatic SMM supplement and its count;
- `line_duty_sunday` / `opt_duty_sunday` provide Sunday sport/tech article rows;
- `line_duty_traffic` / `opt_duty_traffic` provide the optional traffic supplement.

For Sunday duty rows, preserve `section` exactly. The viewer renders sport rows with the `sports-medal` icon and tech rows with the tech icon. Do not collapse Sunday sport/tech rows into an untyped duty note, because the section icon is part of review evidence.

The rendered duty card uses short inline captions such as `Дни: 27, 28`, `SMM: 2 дня`, `Воскрес: <icons>`, `Трафик: <toggle>`. Keep notes concise and Russian.


## Ledger v0.41 base/side row cleanup

For base people/money rows, the base block covers only the main morning text for each `date + section` group. When there are two or more relevant morning longreads in the same section on the same date, assign exactly one row to the base-covered role (`role: "main"` with bucket `base`) and assign every additional row to a side role (`role: "side"`) with the matching extra bucket such as `xtra_sp`, `xtra_eg`, `xtra_oc`, or `xtra_lr`.

A side row must not keep the `base` bucket. Do not emit `buckets: ["base", "xtra_lr"]` or similar combinations for the same row. The block-level base payment remains confirmed, but row-level evidence must separate covered base rows from extra rows so the viewer does not imply that the second text is also part of the base.

If the split between main and side is inferred, prefer the ordinary 08:00 regular text as `main`; mark the additional 07:00 or status-marked row as `side`; keep the reason short and Russian.


## Ledger v0.45 Sunday duty longread rules

Sunday duty longreads from regular sections are duty work, not base work and not automatic extra `Допы`.

When Sunday duty is confirmed:

- classify Sunday longread rows from `people`, `money`, `auto`, `realt`, and other non-`sport`/non-`tech` sections as duty evidence when they are part of the duty day workflow;
- do not assign those rows to `base`;
- do not assign those rows to `xtra_longread` / `line_xtra_longread` only because they are Sunday longreads;
- keep them under `line_duty.rowIds` as evidence for the duty block;
- preserve their section, layout, time, sticky, title, and revision dates so the viewer can review what was covered by the duty day.

The preferred Sunday duty main longread signal is one article-like row per section, commonly a right-sticky `08:00` longread. If that exact pattern is absent, still treat another Sunday article-like row as duty evidence when the broader weekend duty pattern is confirmed.

Exception: Sunday duty `sport` and `tech` article-like rows remain a separate paid event under `line_duty_sunday` / `opt_duty_sunday` at the Sunday duty article rate. These rows must not also be used as ordinary sport-block row evidence.

Do not let the base people/money block absorb Sunday duty rows. Block-level base may still be confirmed for the month, but row-level Sunday duty evidence belongs to duty buckets.

## Ledger v0.46 wording rules

Use section names with an initial capital in user-facing notes and reasons. Preferred short section names are:

- `people` → `Люди`;
- `money` → `Кошель`;
- `realt` → `Недвига`;
- `tech` → `Течь`;
- `auto` → `Авто`;
- `sport` → `Спорт`.

For ordinary additional morning longreads, avoid vague notes such as `Обычные допы`. Prefer a concrete reason such as `Второй текст на утро`, optionally with the section name when useful, for example `Второй текст на утро: Кошель`.

When generating `paymentEvents[].note`, `reportLines[].note`, `row.reason`, and `row.reviewReason`, keep the text short, Russian, and operational. The note should explain why the row is counted or why it needs review, not restate the bucket name.

## Ledger v0.36 duty article roles

Sunday duty article-like rows should carry a display role in the analysis JSON, not only in the viewer.

When Sunday duty is confirmed, assign row roles for duty article-like rows from the duty date:

- `role: "main"` for the primary duty article-like row in each `date + section` group;
- `role: "side"` for additional article-like rows in the same `date + section` group;
- keep `role: "single"` for separately paid Sunday `sport`/`tech` rows under `line_duty_sunday / opt_duty_sunday` when they are the only paid Sunday article in that section;
- do not use these roles to create extra payment by themselves.

The role is a review/display signal. Payment must still come from `paymentEvents` and `reportLines`. The ledger may infer the same role from existing `duty` buckets for backward compatibility, but canonical new JSON should emit the role explicitly so the viewer remains a vitrine, not a classifier.


## Ledger v0.37 strict duty and paid-filter rules

The analysis JSON remains the source of truth. The ledger may filter and display, but it should not invent salary attribution that is absent from `paymentEvents` and `reportLines`.

Strict duty evidence must be separated from coincidental paid extras that happen on duty dates.

Confirmed duty consists of these payroll concepts only:

- `opt_duty` / `line_duty`: the weekend duty block evidence, primarily news flow and the expected duty article coverage;
- `opt_duty_smm` / `line_duty_smm`: automatic SMM supplement for the duty days;
- `opt_duty_sunday` / `line_duty_sunday`: separately paid Sunday `sport`/`tech` article-like rows;
- `opt_duty_traffic` / `line_duty_traffic`: optional traffic duty supplement.

Rows that are paid as ordinary extras (`xtra_longread`, `xtra_special`, `xtra_evergreen`, `xtra_catalog`, `opt_sub`) must not be treated as part of strict duty merely because their publication date falls on a duty weekend. They may still carry a duty-date context signal, but their payment attribution belongs to their own payment event.

Saturday `sport` article-like rows that are part of the monthly sport block belong to `base_sport` / `line_sport`, not to `opt_duty` / `line_duty`. If such a row occurs on a duty Saturday, keep it as sport-block evidence and do not duplicate it into duty rowIds. Small sport news during the duty window may remain duty evidence only when it is not used as sport-block article evidence.

The paid quick filter in the ledger should mean paid non-duty work by default. Duty can be included as a separate toggle, but the included duty set must use strict duty evidence above, not every paid row on a duty date.

For user-facing ledger text, avoid verbose labels with `Дежурство #...`. Keep machine keys stable, but display short labels where possible:

- `line_duty_smm` / `opt_duty_smm` → `SMM`;
- `line_duty_traffic` / `opt_duty_traffic` → `Трафик`;
- `line_duty_sunday` / `opt_duty_sunday` → `Воскрес`.

If the user rejects a row from money, patch or regenerate JSON. Remove the row id from the relevant payment/report line, update counts, amount, formula, row `pay`, `payAmount`, `buckets`, and reasons. Do not store that decision as hidden ledger state unless the ledger exports a patched JSON artifact.

## Ledger v0.38 coverage diagnostics

The analysis should emit diagnostic signals separately from payment attribution. These signals help the ledger show missing or suspicious coverage without changing money totals.

Recommended top-level field:

```json
"diagnostics": {
  "expectedCoverage": [
    {
      "id": "coverage_people_2026-06-01",
      "type": "missing_expected_section",
      "section": "people",
      "date": "2026-06-01",
      "severity": "info",
      "expected": "Утренний текст: Люди",
      "actualRowIds": [],
      "reason": "Нет релевантного утреннего текста в Людях"
    }
  ]
}
```

Diagnostic rules:

- Keep diagnostics independent from `paymentEvents`; a diagnostic must not add or remove money by itself.
- Emit one diagnostic object per concrete signal, not one merged paragraph.
- Use stable `type` values so the ledger can filter them predictably.
- Preserve `date`, `section`, `rowIds` / `actualRowIds`, and a short Russian `reason` whenever possible.

Useful diagnostic `type` values:

- `missing_expected_section` — expected morning coverage for a section is absent on a date;
- `missing_people_base` — expected `people` morning base evidence is absent;
- `missing_money_base` — expected `money` morning base evidence is absent;
- `missing_sport_block_day` — sport block period likely exists, but a sport morning row is absent on a relevant date;
- `missing_duty_sunday_sport` — Sunday duty has no separate `sport` article-like row;
- `missing_duty_sunday_tech` — Sunday duty has no separate `tech` article-like row;
- `unexpected_paid_overlap` — a row matches more than one paid event and needs source-of-truth cleanup;
- `old_revision_in_report` — row is present in the report but has old user revision / `skip_refresh`.

For duty-card hints, emit missing Sunday `sport` and `tech` diagnostics even when the missing article simply means no extra payment. The ledger may render those as dimmed sport/tech icons in the duty card. Do not create `opt_duty_sunday` unless the corresponding row exists and qualifies under the Sunday duty sport/tech rule.

For base coverage hints, only check dates where the report pattern makes the expectation meaningful. Do not flag weekends, holidays, or known off-schedule days unless the report clearly shows the usual section schedule should apply.

## Ledger v0.39 attribution layers and diagnostics

Separate payment category from editorial/status state.

Canonical row layers:

- payment/category layer: `base`, `sport`, `duty`, `duty_sunday`, `duty_smm`, `duty_traffic`, `xtra_lr`, `sub_long`, `sub_day`, and other `base_* / opt_* / xtra_* / sub_*` attribution buckets;
- status/editorial layer: `regular`, `special`, `evergreen`, `catalog`, `longread`, `refresh`, `candidate`, `manual`;
- role/display layer: `main`, `side`, `single`, `none`.

A row must not use `special`, `evergreen`, or `catalog` as the visible payment category when that same concept is already the status/editorial layer. For example, an evergreen row should be `status: "evergreen"` or `status: "eg"`, while its payment/category layer should remain `base`, `xtra_lr`, or another actual payment attribution. The same applies to special project and catalog rows.

For viewer-facing category badges, side special/evergreen/catalog additions may keep precise internal buckets (`xtra_sp`, `xtra_eg`, `xtra_oc`) for rates and report-line aggregation, but the row category display should collapse them to the generic extra-text category `Допы` with the `ant` glyph. Their special/evergreen/catalog identity belongs in the status column and in dedicated report-line filters, not in the row category column. Clicking a `Допы` category badge in the viewer must filter all extra-longread buckets together: `xtra_lr`, `xtra_sp`, `xtra_eg`, and `xtra_oc`. The quick report-line chips for `Спец`, `Зелень`, `Каталог`, and `Допы` should also operate as one extras group when used as broad quick filters; precise separation remains available through row status filters and event/report-line evidence.

`news` rows must not receive `role: "main"`, `role: "side"`, or `role: "single"` as article roles. Those roles are reserved for article-like rows, normally `longread` and meaningful `photoreport`. Non-morning news, especially rows outside `07:00` / `08:00`, should keep `role: "none"` unless a separate explicit non-article role is introduced.

Base and extra attribution rules:

- Base can cover only one primary article-like morning row per `date + section` inside base sections.
- A second relevant article-like row in the same `date + section` group must not remain `base`; it should become an extra attribution such as `xtra_lr` with reason `Второй текст на утро` when it is payable, or a manual diagnostic when the rate/status is unclear.
- Morning means `07:00` or `08:00` by default, but if a section/day has a clear primary morning row and another article-like row at a nearby nonstandard time such as `09:30`, treat the later row as the second text, not as the main base row.
- Saturday article-like rows in normal base sections (`people`, `money`) may still be base evidence when they are part of the regular morning base schedule. Do not move them into duty only because they are on Saturday.
- Tech or other non-base article-like rows on a duty Saturday/Sunday are not automatically covered by duty. If the user should not have read that section as part of duty, classify it as an extra/manual signal, not as ordinary duty evidence. Sunday `sport`/`tech` article-like rows remain the explicit `duty_sunday` exception when they qualify for the separate Sunday rate.

Strict duty means only the duty payroll package:

- weekend duty block evidence and duty news flow;
- expected duty article coverage for duty sections;
- automatic SMM supplement;
- optional traffic supplement;
- separately paid Sunday `sport`/`tech` article-like rows.

Coincidental extras on duty dates must stay outside strict duty and keep their own attribution.

Expected coverage diagnostics should include a general observation layer in addition to missing-section signals. Recommended additional diagnostic types:

- `heavy_longread_day` — many article-like rows on one date;
- `heavy_record_day` — many total rows on one date;
- `high_volume_day` — unusually high total `volume` for one date;
- `second_morning_text` — a detected second article-like row in one `date + section` group;
- `nonbase_duty_article` — a non-base section article-like row read during duty that may need separate attribution;
- `missing_expected_base_section` — expected base section evidence absent for a workday;
- `missing_expected_sport_article` — sport block period has no expected sport row for a relevant workday.

The analysis should estimate `counts.workDays` from actual base evidence, not from the calendar alone. A workday is a date with confirmed/relevant base evidence in `people` or `money`. Calendar-derived expectations may be used only as diagnostics, because transfers and local schedule exceptions are possible.

For ledger rendering, include enough structured data to show diagnostics without recalculating salary: `type`, `date`, `section`, `rowIds`, `severity`, `reason`, and optional `expected` / `actual` fields.

## v0.43 Clarifications

### Canonical payment bucket IDs

Keep the JSON bucket ids stable as:

- `base`
- `sport`
- `duty`
- `duty_smm`
- `duty_sunday`
- `duty_traffic`
- `sub_long`
- `sub_day`
- `xtra_lr`
- `xtra_sp`
- `xtra_eg`
- `xtra_oc`

When writing user-facing explanations, do not leave these ids naked if a clearer Russian label exists. Use `Допы`, `Спец`, `Зелень`, `Каталог`, `Замена`, `Дежурство`, `Воскрес`, `Трафик`, `SMM`, `База`, `Спорт`.

### Morning-role assignment

Morning roles are only for morning `longread` rows.

- `news` always gets role `none`.
- `photoreport` always gets role `none`.
- other non-`longread` layouts also stay `none` unless the user explicitly introduces a different rule later.

Do not assign `main`, `side`, or `single` to a `photoreport` just because it appears on a duty day or because it is article-like in a broad sense.

### Picking the main text inside a same-section morning pair

When the same `date + section` has multiple morning `longread` rows and both are ordinary rows:

1. prefer the row with `sticky = right` as the main / covered text;
2. treat `sticky = left` as the additional morning text;
3. if there is no clear sticky split, prefer `08:00` over `07:00`;
4. if the tie still remains, keep the split explicit in notes.

This rule also applies on confirmed duty days. Confirmed duty does not suppress a real second morning `longread` in the same section. In that case the extra row still becomes confirmed `xtra_lr`.

### User-facing section names

In explanations, diagnostics, notes, and viewer-facing strings, refer to sections only by the approved Russian display names with a capital letter:

- `people` → `Люди`
- `money` → `Кошель`
- `sport` → `Спорт`
- `auto` → `Авто`
- `tech` → `Течь`
- `realt` → `Недвига`

Do not fall back to English section names in rendered notes such as `People/Money`, `Sport/Tech`, or `Tech replacement`. Write `Люди/Кошель`, `Спорт/Течь`, `Замена Течь`, and so on.

## v0.44 Clarifications

### Aggregate rounding for fractional rates

When a rate is fractional, multiply the rate by the count first and round only the final product. Do not round each row independently before multiplying.

Example: `37,5 × 2 = 75`, not `38 × 2 = 76`.

### Non-refresh rows must not remain uncategorized

A relevant row with `status != refresh` must not be left in a user-facing `Без оплаты` bucket. If no more specific bucket is justified, classify it as a rejectable additional item under `xtra_lr` / `Допы` so the ledger can include it in the calculation and the user can disable it locally with `certificate`.

Keep the row status orthogonal: a row may still have `sp`, `eg`, or `oc` status while its payment bucket is `xtra_lr` when the local rule says to count it as a general additional item.

### Refresh visibility in filters

Rows with `status = refresh` should appear in the full unfiltered ledger and in the dedicated `Древность` filter. Other filters, including status filters such as `Зелень`, should exclude refresh rows so old revisions do not pollute operational review lists.

### Covered-block certificate behavior

Rows covered by a block payment but not paid as row-level extras should show a neutral certificate glyph, not `certificate off`. Clicking it should show the block amount that covers the row, for example `1900`, `300`, or `175`, without plus/minus semantics and without changing local exclusion state.

## v0.45 Carryover and Filter Clarifications

### Carryover window is longread-only for paid extras

The relevance carryover window may bring in rows whose user revision happened shortly before the report month. This tolerance is only allowed to create paid extra rows for `layout = longread`.

Do not promote `news` or `photoreport` rows from the carryover window into `xtra_lr`, `xtra_sp`, `xtra_eg`, `xtra_oc`, or `sub_long`. They may remain visible as diagnostics or explicit exclusions, but they must not receive row-level paid certificates.

### Non-longread roles

Only `longread` rows can receive `main`, `side`, or `single` morning roles. `news` and `photoreport` rows must keep role `none`, including on duty days. The viewer may not infer `main`/`side` for photoreports as a fallback.

### Filtered ledger totals

When the viewer is filtered to a row-level paid category, the visible additions table and footer should reflect the visible row-level intersections. Block payments such as base, sport, duty, SMM, and traffic remain block-level and are not split by arbitrary row count unless the JSON event itself is row-count based.

## v0.46 Clarifications

### Do not broaden excluded artifacts into paid extras

Do not convert every non-refresh `none`/`excluded` row into `Допы`. Transition-window tolerance is primarily for relevant `longread` rows. `news` and old duty artifacts from the previous month must stay excluded unless the user explicitly identifies a concrete current-month item as payable.

A current-month `photoreport` may be included in `Допы` only when the user confirms that it should be treated as paid extra work for the month. Even then, its row role remains `none`; it must not become `main`, `side`, or `single`.

### Catalog precedence over evergreen

When a row has both `oc` and `eg` signals, `Каталог` is the primary scalar status and payment bucket. It should appear under the `Каталог` quick filter and report line, not under `Зелень`. Preserve `eg` only as a secondary signal if needed for diagnostics.

### Viewer payment glyph semantics

Rows covered by block payments (`base`, `sport`, `duty`) may show a regular certificate glyph as informational coverage, but clicking it must not toggle row inclusion. The click feedback should show the applicable block amount without plus/minus. Row-level paid extras remain toggleable and recalculate totals locally.

## v0.47 Clarifications

### Same-time sticky morning pairs

When the same `date + section` has two relevant morning `longread` rows at the same time, use sticky side before any other tie-breaker:

- `sticky = right` is the main / covered text;
- `sticky = left` is the additional text;
- if the sticky split is missing or duplicated, fall back to the existing time/status rules and preserve the uncertainty in notes.

This applies on weekdays and inside confirmed duty windows.

### Month card day count

For the ledger viewer month card, `counts.workDays` should represent the publication days visible in the report month, not only base-covered days. If the report contains rows on 28 distinct dates, the card should show `28`. Keep narrower counts such as base-covered days in separate fields if needed.

### Status precedence

If a row has both evergreen and catalog signals, catalog wins for the scalar `status` and quick-filter membership. Preserve the secondary signal in `signals`, but do not show the row in the `Зелень` quick filter when it is primarily `Каталог`.

## v0.48 Clarifications

### Morning photoreports

`photoreport` is not always role `none`.

Use role `none` for non-morning photoreports and incidental duty/news-like photoreports.

A `photoreport` may receive a morning role when it is published in a normal morning slot, usually `07:00` or `08:00`, and behaves as a substantial article-like morning material. In that case:

- if it is covered by a block bucket such as `base`, `sport`, or `duty`, use `single` or `main` according to the same morning-group rules as longreads;
- if it is an additional paid row in `xtra_*` or `sub_long`, use `side`;
- never overload `news` this way: `news` stays role `none`.

### Duty overrides status signals for Sunday main rows

On confirmed Sunday duty, a main/covered morning text remains in `duty` even when it has `eg`, `sp`, or `oc` status signals.

Status signals remain visible as row status/signals, but they do not move the row into `xtra_eg`, `xtra_sp`, or `xtra_oc` unless the row is actually an additional side material inside a same-section morning group or another explicit paid-extra rule applies.

For quick filters and payment rows, filter `Спец`, `Зелень`, and `Каталог` by their payment buckets (`xtra_sp`, `xtra_eg`, `xtra_oc`), not by status alone, so covered duty/base/sport rows do not leave their block context.

## v0.49 Clarification: Duty-Day Non-Regular Section Morning Rows

A confirmed duty day can contain morning article-like rows in sections that are not part of the user's regular covered block. Do not automatically convert such rows into paid `xtra_lr` only because they are at `07:00` or `08:00`.

For Saturday duty rows in non-regular sections such as `tech`, `auto`, or `realt`:

- if there is only one relevant morning article-like row in that same `date + section` group, keep it covered by `duty` and use role `none`;
- if there are two or more relevant morning article-like rows in that same `date + section` group, choose the main/side split inside that group and count only the side row as the appropriate extra bucket;
- if an explicit replacement rule exists for that section and date, classify by the replacement rule instead of this fallback;
- do not use `sticky = left` at `07:00` as sufficient evidence of an extra by itself.

Sunday `sport`/`tech` article payments remain a separate rule and are not affected by this Saturday duty fallback.

## v0.50 Clarification

`xtra_longread` / `xtra_lr` uses the same 37.5 rate model as special-project extras for this ledger: multiply the raw rate by the count first, then round the final product if needed. Do not round each row to 38 before multiplication.

For the main rows table, keep all non-text columns narrow and equal where possible; make `Категория` double that width; let `Текст` take the remaining table width.

## v0.51 Clarification

### Duty as source versus paid extra

A Saturday duty row can be both duty context/evidence and a row-level paid extra when all of these are true:

- the row is a relevant `longread`;
- it is in a non-regular section such as `tech` / `Течь`;
- it is a left-sticky morning row around `07:00`;
- it exists because of the user's duty work rather than as part of the user's regular base section.

In this case preserve both meanings:

- keep `duty` in `buckets` so the row remains part of duty context;
- use primary `bucket: xtra_lr` for payment/filtering;
- set row-level payment as a rejectable certificate entry so the user can disable it locally if it should not be paid.

This is not a base row. Do not hide it under the duty block when it is a substantial left-sticky morning longread from a non-regular section.

## Diagnostics / audit signals

Add a top-level `auditSignals` array to every monthly analysis JSON. This is a review layer, not a payment source of truth. Payment still comes from `rows`, `paymentEvents`, and `reportLines`.

Each signal must use a stable shape:

```json
{
  "id": "high_volume_days",
  "type": "high_volume_days",
  "severity": "warn",
  "label": "Много объёма",
  "reason": "Human-readable reason",
  "rowIds": ["post-..."],
  "metric": 2,
  "threshold": 10000,
  "details": []
}
```

Required signal classes:

- `missing_base_sections`: a normal publication day has one base section covered but the paired base section (`people` or `money`) has no base row. Use all rows from the affected date in `rowIds`, because the missing row itself has no source row.
- `high_longread_days`: days with 5 or more relevant non-refresh `longread` rows. Use the longread rows for those dates.
- `high_row_count_days`: non-duty days with 6 or more relevant non-refresh rows of any layout. Exclude duty dates, because high row counts are expected on duty days and should not create noise. Use all relevant non-refresh rows for the remaining flagged dates.
- `high_volume_days`: days where relevant non-refresh row volume is at least 10000. Use all relevant non-refresh rows for those dates.
- Do not add a separate `old_revision_rows` / `Древность` audit signal. Old revisions already have a dedicated table filter and should not duplicate the audit signal layer.
- `unusual_morning_pairs`: `date + section` groups with two or more article-like morning rows (`longread` or morning `photoreport` at `07:00/08:00`).
- `covered_status_rows`: rows with `status` signal `sp`, `eg`, or `oc` that are covered by `base`, `duty`, or `sport` instead of paid as extra rows.

The viewer may use `auditSignals[].rowIds` as an exact interactive filter. Do not derive payment from `auditSignals`.


## v0.53 Clarification

Audit signals should be compact review filters, not a second copy of ordinary table filters. Each signal may include an `emoji` field for the viewer, but filtering must still use exact `rowIds`.

Signal clicks are exclusive: when an audit signal is selected, clear ordinary quick filters, line filters, event filters, duty filters, and column filters so the rows table shows only the rows attached to that signal.

`missing_base_sections` should be explainable in `reason` and `details`: it flags dates where one expected base section exists while the paired base section is absent. Because the missing article has no row, attach the available rows from that affected date as review context.

## v0.54 Clarification: Duty additional longreads / Лапоть

Additional morning longreads produced inside a duty context are not ordinary `xtra_longread` extras. Attribute them to a separate payment bucket:

- canonical event key: `opt_duty_longread`;
- canonical row bucket: `duty_lr`;
- user-facing label: `Лапоть`;
- rate: `35` per row;
- target column: premium / confirmed add-on;
- row behavior: rejectable certificate, same local exclusion behavior as other row-level extras.

Use `opt_duty_longread` when a row is a substantial morning article-like duty extra and all of the following are true:

- the row is on a confirmed duty date;
- the row is not the user's normal base row for that day;
- the row is not one of the fixed Sunday `sport` / `tech` rows already covered by `opt_duty_sunday`;
- the row works as an additional morning text inside duty context, usually a left-sticky `07:00` / `08:00` longread or the side item in a same-section morning pair.

Preserve source context without hiding the payment bucket:

- use primary `bucket: duty_lr` for payment, category, and row-level filtering;
- include `duty` in `buckets` when the row belongs to the duty-day context;
- do not count these rows in ordinary `xtra_longread` / `xtra_lr`;
- do not count them as base.

For June 2026 this principle identifies three `opt_duty_longread` rows: the Saturday money side text, the Sunday money side text, and the Saturday tech left-sticky morning longread. This is a principle-based classification, not a target count rule.
