# Onliner Editorial Telemetry Analysis

Version: `0.3`  
Status: evidence-first methodology with a per-session artifact contract; source JSON semantics remain subject to verification.

## 1. Purpose and scope

Analyze real changes to Onliner publications during preparation and proofreading. Identify recurring corrections, gaps in algorithmic processing, editor decisions, and testable ways to improve Cleanup, Audit (including Gemini/Qwen prompts and filtering), and editorial guidance. The practical objective is to reduce proofreader work after Cleanup and Audit without degrading publication quality; findings are candidates for validation, not instructions to change code.

This skill governs **analysis**, not telemetry collection, Toolbar implementation, or automatic modification of prompts and code. The assistant analyzes evidence in this conversation. Codex may inspect current Toolbar sources to investigate technical causes when a specific finding justifies it; implementation is a separate task.

## 2. Inputs

Expected session archive: `<section>-<postId>.zip`.

Possible members:

| Suffix | Meaning |
| --- | --- |
| `0HF.json` | Publication state before Cleanup |
| `1GL.json` | Publication state after Cleanup |
| `2NT.json` | Publication state before Submit, after editing |
| `audit.json` | Audit checks, proposals, filtering and recorded user actions, if used |
| `manifest.json` | Archive inventory and metadata |

`3WP` and `4GG` are reserved; do not assume they have operational semantics.

Treat originals as **immutable evidence**. Do not modify originals or interpret absent files as evidence that a stage definitely did not happen. Do not invent or assume undocumented JSON paths, event names, schemas, timestamps, or action semantics. Discover actual structure from supplied examples. ZIP members may reside in a nested directory rather than at archive root. A snapshot’s `content` may be nested at `fields.content[0].value` rather than at the top level; treat this as an observed example, not a universal schema.

Main focus: `content`. Inspect other fields if they changed materially or help explain a finding. Preserve exact source member paths and observed field paths as provenance in outputs.

## 3. Mandatory analysis order

### A. Establish evidence and data quality

1. Identify archive by exact filename, section, and post ID as available.
2. List actual archive member paths (including nested directories) and relevant JSON keys; check parseability. Locate content by inspecting each actual snapshot structure, record the path used, and verify that extracted values are comparable across stages. Do not assume that similarly named fields have identical semantics.
3. Consult `manifest.json` for provenance and metadata, but verify it against actual archive members.
4. Record missing snapshots, ambiguities, inconsistent IDs, invalid data, and other limitations.
5. Do not silently repair corrupted or ambiguous source records.

### B. Analyze Cleanup: `0HF → 1GL`

Compare source and post-Cleanup states. Separate:

- visible textual changes;
- HTML structure, attributes and markup changes;
- encoding, whitespace, entities, Unicode and typography;
- changes that may affect rendering or meaning.

Identify potentially beneficial, questionable and harmful transformations. Do not label all differences as mistakes or all Cleanup changes as improvements. In particular, flag Cleanup changes that are reversed or corrected in `2NT` for closer examination; reversal alone does not prove a Cleanup defect.

Observed example (`money-351105`): `0HF` `онлайн- и` → `1GL` `онлайн— и` → `2NT` `онлайн- и`. The Cleanup change damages a suspended hyphen and the final snapshot restores the original form. Treat this as a concrete case, not yet a recurring defect.

### C. Analyze subsequent work: `1GL → 2NT`

Identify later content changes, including additions, deletions, replacements, moves, and formatting. This is an **observed state difference**, not a complete record of each editing action. Do not automatically attribute changes to the proofreader: Audit, manual edits, other tools or processes may have contributed.

If both stages are present, optionally examine `0HF → 2NT` to characterize the net outcome; never replace the intermediate comparisons with this net comparison. For reversals (`0HF` and `2NT` agree but `1GL` differs), check the surrounding context before deciding whether the Cleanup change was wrong, merely unwanted, or subsequently superseded.

### D. Analyze Audit independently

Only if `audit.json` exists and is interpretable:

- enumerate checks and supported providers (e.g. Gemini, Qwen, LanguageTool) as actually recorded;
- distinguish, where supported by actual fields and their verified semantics: provider-generated proposals; proposals removed by filtering; proposals shown to the proofreader; accepted, rejected or accepted-with-modification proposals; undone actions; and changes still present in `2NT`;
- treat these as distinct conceptual states, **not** a presumed JSON schema or a guaranteed linear lifecycle; do not infer an intermediate state from another state without evidence;
- account for repeated checks, stale proposals, conflicts and undo when recorded;
- correlate Audit events to state differences using text/context/identifiers/timing where available;
- mark uncertain attribution explicitly.

For recorded application (including acceptance with modification), check the relevant `2NT` passage where possible. Distinguish a logged action from its observed final effect: an accepted change may later be undone, overwritten, modified, or affected by another check or manual edit. If the correspondence cannot be established, report the effect as unverified rather than assuming persistence.

When evaluating Audit quality, distinguish a wrong provider suggestion, a useful suggestion suppressed by filtering, a correct suggestion rejected for editorial reasons, and a proposal-matching or application error. These conclusions require different evidence; an ignored or rejected suggestion is not automatically a provider failure. Observed examples: in `money-351105`, LanguageTool proposed `с скромных → со скромных` but filtering excluded it, while a similar Gemini proposal was accepted; in `people-1339919`, LanguageTool suggestions concerning colloquial vocabulary were rejected. These are isolated cases, not systemic findings.

A recommendation being accepted does not establish correctness. Rejection does not establish that a suggestion was wrong. An action log does not by itself guarantee that its textual effect persisted through `2NT`.

### E. Cross-source synthesis

Reconcile findings across snapshots, Audit and metadata. Separate confirmed effects from plausible causal explanations. If evidence conflicts, report the conflict instead of forcing one narrative. When a proposal and the final text agree, do not assume the proposal caused the change without linking evidence.

## 4. Comparison principles

- Always preserve exact before/after excerpts for meaningful findings and identify the transition.
- Avoid noisy full-HTML line diffs when a small tag or whitespace change shifts many lines.
- Compare on at least two conceptual levels: raw HTML and reader-visible text. A text extraction/normalization technique must not destroy the only evidence of a typography or whitespace change.
- Preserve meaningful Unicode distinctions (e.g. regular vs nonbreaking spaces, dash types, quotation marks, `е` vs `ё`) when evaluating editorial transformations.
- Distinguish markup-only, text-only, and mixed changes. Changes to links, images, embeds or attributes may be semantically significant even when visible text stays unchanged.
- Avoid treating moves or split/merged paragraphs as numerous independent rewrites when one structural operation explains them.
- For ambiguous matching, provide context and lower confidence rather than invent a precise change count.
- Only normalize for a declared comparison purpose. Keep raw originals available for verification; never use lossy normalization as the sole source of truth.
- Evaluate correctness against available editorial rules and context; do not infer a house rule merely because it appears in one final publication.

### Nested content and widgets

When actual content contains embedded components (including `[onliner-promo-widget]`), inspect the observed serialization before decoding. Parameters may resemble JSON and may contain a `text` value with HTML encoded as numeric HTML entities. Decode in the sequence justified by the actual format and preserve a reference to the original encoded fragment; do not blindly unescape or parse the entire document.

Compare component count and identity, reader-visible text, HTML tags/nesting/formatting, attributes, and metadata separately. Show exact decoded excerpts alongside source paths when diagnostically useful. Byte-level differences alone do not prove visible-text differences. Invalid HTML nesting suggests a structural concern, not a demonstrated visual defect without rendered evidence. Preserve archive bytes unchanged.

## 5. Finding dimensions

Classify observations on **independent axes**, where evidence permits:

**Stage / transition:** `0HF→1GL`, `1GL→2NT`, `0HF→2NT`, `audit`, or `cross-source`. For per-session JSON use the same strings; `audit` is an event-based observation, not a snapshot transition.

**Likely origin:** `cleanup`, `audit`, `manual`, `mixed`, `unknown`. For the second transition, default to `unknown` unless evidence permits more precise attribution.

**Change type:** spelling, grammar, punctuation, typography, whitespace, style, terminology, meaning/facts, structure/HTML, links/media, other. Multiple types may apply.

**Assessment:** justified, questionable, likely defect, neutral/technical, or cannot determine. Assessment is an analytical judgment, not an event status. Explain the basis.

**Evidence confidence:**

- `confirmed` — directly shown by supplied data;
- `supported interpretation` — plausible and well-grounded, but not directly recorded;
- `hypothesis` — requires further cases or source investigation;
- `unknown` — insufficient evidence.

Prefer accurate explanation to artificially precise scoring or counts.

## 6. Minimal observation record

Record only meaningful changes or diagnostic examples. Use a compact structure:

- **ID:** stable within the analysis, e.g. `<section>-<postId>#01`.
- **Source:** exact archive and JSON members; transition, field, location/context.
- **Before → after:** short, exact excerpts; render special whitespace visibly when relevant.
- **What happened:** neutral description of the observed difference.
- **Classification:** origin (if known), change type, assessment, evidence confidence.
- **Audit evidence:** relevant event or `not available / no match / uncertain`.
- **Interpretation:** why the change matters, with any competing explanation.
- **Status:** isolated observation, candidate pattern, supported recurring pattern, or withdrawn/revised. A single-session JSON finding must not assert a cross-publication pattern; reserve such statuses for supported cross-archive synthesis.

Do not fabricate offsets or event identifiers. If exact location cannot be given, use distinctive surrounding text.

## 7. Recurrence and hypotheses

An observation from one publication is an example, **not** proof of a lasting editor preference or systematic Toolbar flaw.

For recurring patterns:

1. Group by the concrete transformation/problem, not vague labels such as “punctuation”.
2. Count distinct publications and indicate how many are actually comparable; repeated suggestions inside one article are not independent publications.
3. Track supporting cases and counterexamples, including situations where Cleanup or Audit handled the same pattern correctly.
4. Distinguish editorial preference, explicit house rule, algorithmic defect, and uncertain causal explanation.
5. Form a falsifiable hypothesis and state what new evidence would confirm or weaken it.
6. Prioritize investigation only when recurrence, impact and confidence justify it. Do not invent numerical thresholds before seeing representative data.

Suggested hypothesis fields: ID, problem statement, evidence IDs, counterexamples, affected stage, suspected cause (if justified), impact, uncertainty, next validation step, status.

Do not silently upgrade a hypothesis to a confirmed rule; record the evidence supporting a status change.

## 8. Reporting behavior and per-session artifacts

For each supplied `<section>-<postId>.zip`, produce one downloadable `<section>-<postId>-report.zip` with **exactly two** files at its root:

```text
<section>-<postId>-report.zip
├── <section>-<postId>.analysis.md
└── <section>-<postId>.findings.json
```

Do not include the original ZIP, copies of source JSON, or auxiliary artifacts in the report ZIP. In chat, provide a short summary and a link to the report ZIP. The original inputs remain immutable; use the actual member paths, including nested directories. If a source is too incomplete to analyze, document the limitation in the two files rather than inventing observations.

### Human-readable analysis (`.analysis.md`)

Organize the report around these topics, adapting depth to available evidence and omitting empty detail sections or artificial tables:

1. **Metadata / Provenance** — exact ZIP filename, section/postId, generation timestamp with timezone, methodology and JSON schema versions, available stages, exact JSON member paths and observed content/field paths.
2. **Data Quality / Limitations** — absent or broken stages, parsing/decoding problems, completeness, provenance and unresolved ambiguities.
3. **Session / Workload Metrics** — reader-text volume, supported timestamps and intervals, qualified pace, change volume, computation definitions, reliability limits; mark unavailable measures as `not available`.
4. **Cleanup (`0HF→1GL`)** — substantive text and HTML changes, beneficial transformations, possible defects, reversals, verified correct controls.
5. **Audit** — per-provider generated/filtered/presented proposals, recorded decisions/actions (including modification and Undo), repeated checks, observed persistence in `2NT`, and uncertainty of event-to-text mapping. Keep proposal counts, action counts, and final textual effects distinct.
6. **Editing (`1GL→2NT`)** — observed subsequent textual/HTML changes; call an edit manual only with supporting evidence.
7. **Findings & Opportunities** — significant findings by stable ID, exact evidence, limitations, candidate improvement direction and automation risk. These are investigative hypotheses, not approved patches or measured savings.
8. **Open questions** — only questions that materially affect validation.

Do not manufacture findings to fill a section. Show only meaningful excerpts rather than massive HTML diffs. Cross-publication patterns belong in a separate comparative analysis, not as assertions in a single-session report. A verified case of correct handling may be a diagnostic finding; merely observing no error is not a verified control.

Maintain the existing distinction between **Observed**, **Interpretation**, and **Hypothesis**. The Markdown must reference the same findings IDs, evidence status and versions as the JSON; small excerpts may be repeated for readability without duplicating the whole report in JSON.

### Workload and timing rules

Keep distinct clock timestamps, elapsed intervals calculated from them, and expert interpretations. Where supported by actual timestamps, report these different intervals independently:

- `1GL → 2NT`: full post-Cleanup elapsed interval;
- Audit end `→ 2NT`: approximate post-Audit window;
- last recorded Audit action `→ 2NT`: separate last-action reference window;
- Audit duration: only when genuine start and end timestamps exist.

For each metric, give source members/field paths, timestamp timezone and calculation; do not treat the windows as mutually exclusive or additive. Audit may overlap reading; intervals may include breaks, idle time and parallel tasks. Do not equate any elapsed interval with **active proofreading time**.

If giving words per time or minutes per 1000 words, specify the snapshot and reader-text extraction method: included/excluded headings, widgets, service blocks and other material; HTML entity decoding and Unicode/whitespace normalization; word segmentation; and exact formula (`words ÷ elapsed_minutes × 60` for words/hour; `elapsed_minutes × 1000 ÷ words` for minutes/1000 words). Exclude zero or unknown denominators. State that pace is conditional on the chosen elapsed interval and text scope, not active reading speed. Preserve enough definitions to recalculate later.

Describe change volume by explicitly defined units (e.g., characters, words or compared semantic changes) and matching/normalization rules. Raw diff blocks are **not** a count of manual actions. Separate directly observed, computed and expert-estimated values. Never invent time savings or publish a unified score, thresholds or complexity weights on sparse evidence; `not available` is valid.

### Findings JSON (`.findings.json`)

Use a compact, documented format named `onliner-telemetry-findings`, schema version `1.0`. One object describes one publication. `findings` contains one entry **per meaningful diagnostic observation**, not per raw diff; `findings: []` is valid. The schema is conceptual and does not constrain or claim any source-archive JSON shape.

Top-level fields:

- `schema`: literal `onliner-telemetry-findings`;
- `schema_version`: `1.0`;
- `methodology_version`: skill version, here `0.3`;
- `generated_at`: ISO 8601 timestamp with offset or `Z`;
- `source`: `{ "archive": "<section>-<postId>.zip", "section": "...", "post_id": "..." }`, keeping ID as a string;
- `members`: mapping from each **actually inspected** stage label (`0HF`, `1GL`, `2NT`, `audit`, `manifest`) to its exact ZIP member path; omit unavailable members;
- `coverage`: mapping for applicable comparison/check areas (`cleanup`, `editing`, `audit`, `widgets`), each with `status` of `not_checked`, `checked_no_issue`, `checked_with_findings`, or `not_available`, plus optional `note`. This is coverage of the **performed inspection**, not a guarantee that no defects exist. `checked_no_issue` requires an actual check; `findings: []` alone never proves it;
- `limitations`: brief array of strings;
- `findings`: array described below.

Finding fields:

- `id`: stable per-publication `<section>-<postId>#NN`; preserve the ID for the same observation during reruns when possible, and document any remapping;
- `transition`: one of `0HF→1GL`, `1GL→2NT`, `0HF→2NT`, `audit`, `cross-source`;
- `evidence`: array of references `{ "member": "exact ZIP member path", "field": "observed JSON path", "context": "distinctive location or surrounding text" }`. Reference only members actually present; for a decoded widget, include an exact pointer/context to the original encoded fragment;
- `excerpts`: optional `{ "before": "...", "after": "...", "final": "...", "context": "..." }`. Use exact short raw or explicitly identified decoded substrings, preserving NBSP, dash and quote distinctions. Omit absent stages rather than inventing text. Explain representation/decoding when relevant;
- `observation`: short neutral statement of what was actually compared;
- `change_types`: array from section 5, possibly empty for event-only observations;
- `origin`: `cleanup`, `audit`, `manual`, `mixed`, or `unknown` (default to `unknown` for unproven attribution);
- `assessment`: `justified`, `questionable`, `likely defect`, `neutral/technical`, or `cannot determine`;
- `confidence`: `confirmed`, `supported interpretation`, `hypothesis`, or `unknown`; it qualifies the **stated interpretation**, not the mere existence of a diff;
- `audit_link`: optional `{ "member": "exact audit member path", "event_ref": "verified identifier or locatable event context", "provider": "observed provider", "decision": "observed decision" }`. Populate only independently verified parts; never fabricate run IDs, event IDs or decisions. Omission means no established event link, **not** no Audit activity;
- `opportunity`: `{ "target": "cleanup | audit/prompt | audit/filter | editorial guidance | manual/none | undetermined", "candidate": true, "rationale": "...", "risk": "..." }`. `candidate: true` means a possible investigation/improvement, not a confirmed saving or approved change; use `manual/none` or `undetermined` where no automation direction is warranted;
- `limitations`: optional short array of uncertainty notes.

Use section 5 vocabulary verbatim; `likely defect` is an assessment, not automatically an evidenced origin. No per-publication JSON claims about systematic recurrence, speculative time savings, arbitrary scores or reproduced full Markdown. An example with a checked widget but no issue must be represented by `coverage.widgets.status = "checked_no_issue"`, not by assuming absence of widget findings signifies a passed check.

**Illustrative example only (synthetic data, not a reanalysis of any Onliner publication):**

```json
{
  "schema": "onliner-telemetry-findings",
  "schema_version": "1.0",
  "methodology_version": "0.3",
  "generated_at": "2026-10-22T09:00:00+02:00",
  "source": { "archive": "sample-123.zip", "section": "sample", "post_id": "123" },
  "members": { "0HF": "sample-123/0HF.json", "1GL": "sample-123/1GL.json" },
  "coverage": {
    "cleanup": { "status": "checked_with_findings" },
    "editing": { "status": "not_available", "note": "2NT absent" },
    "audit": { "status": "not_available" },
    "widgets": { "status": "not_checked" }
  },
  "limitations": ["Final-state persistence cannot be checked"],
  "findings": [
    {
      "id": "sample-123#01",
      "transition": "0HF→1GL",
      "evidence": [
        { "member": "sample-123/0HF.json", "field": "fields.content[0].value", "context": "synthetic sentence" },
        { "member": "sample-123/1GL.json", "field": "fields.content[0].value", "context": "same sentence" }
      ],
      "excerpts": { "before": "слово- и другое", "after": "слово— и другое" },
      "observation": "Cleanup replaced a suspended hyphen with an em dash.",
      "change_types": ["typography"],
      "origin": "cleanup",
      "assessment": "likely defect",
      "confidence": "supported interpretation",
      "opportunity": { "target": "cleanup", "candidate": true, "rationale": "Check suspended-hyphen handling", "risk": "Overbroad exception may suppress valid dash corrections" },
      "limitations": ["Synthetic example; no 2NT available"]
    }
  ]
}
```

The example shows an optional missing Audit link and missing final excerpt. In real outputs, verify actual paths, source encodings, event associations and confidence from the archive. Keep Markdown and JSON IDs, provenance, stages, assessments and versions synchronized; validate JSON parseability and ZIP membership before release.

## 9. Codex boundary

Use Codex only when investigation requires current source-of-truth logic, such as identifying the Cleanup rule behind a recurring transformation, interpreting an Audit event, or checking whether behavior matches implementation.

Send Codex a narrow, evidence-backed question with concrete excerpt(s), archive identifiers and expected versus observed behavior. Request source locations, execution path and falsifiable explanation, not an automatic patch. Review any proposed conclusion against observed telemetry. Code changes are outside this skill.

## 10. Methodology evolution

This is `v0.3`, an evidence-first methodology with reproducible per-session outputs, **not** a verified decoder of every JSON variant or Audit event.

Revise after examining real archives, especially:

- schema and provenance of each snapshot;
- structure, identity and chronological ordering of Audit events;
- reliability of linking Audit actions to text differences;
- boundaries of HTML parsing and normalization;
- useful taxonomy and reporting granularity.

Keep source archives unchanged. Record substantive changes to methodology with version number and brief changelog. Record the methodology version, JSON schema version, generation time, examined stages and assumptions in each derived analysis. Re-run the same original ZIP under a later methodology to compare conclusions; do not silently reinterpret previous reports. Keep the agreed report ZIP filename unchanged and store versions **inside** the report; if replacement would discard a prior report needed for comparison, archive the older report separately first. No database or report-generation subsystem is required.

### Changelog

- `v0.3` — established the two-file per-session report ZIP and synchronized findings JSON schema; defined evidence/coverage states, workload metric limits, widget decoding/comparison, versioned regeneration and output validation without changing the core analytical taxonomy.
- `v0.2` — clarified nested archive/content discovery, Audit proposal and action states, final-effect verification in `2NT`, Cleanup reversals and distinct Audit/filtering failure modes; added isolated case examples without new thresholds.
- `v0.1` — initial evidence-first comparison and classification methodology; no archive-specific assumptions.
