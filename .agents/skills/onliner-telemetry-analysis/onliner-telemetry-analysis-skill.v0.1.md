# Onliner Editorial Telemetry Analysis

Version: `0.1`  
Status: initial methodology; requires validation on real session archives.

## 1. Purpose and scope

Analyze real changes to Onliner publications during preparation and proofreading. Identify recurring corrections, gaps in algorithmic processing, editor decisions, and testable ways to improve Cleanup, Audit, and editorial guidance.

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

Treat originals as **immutable evidence**. Do not modify originals or interpret absent files as evidence that a stage definitely did not happen. Do not invent or assume undocumented JSON paths, event names, schemas, timestamps, or action semantics. Discover actual structure from supplied examples.

Main focus: `content`. Inspect other fields if they changed materially or help explain a finding.

## 3. Mandatory analysis order

### A. Establish evidence and data quality

1. Identify archive by exact filename, section, and post ID as available.
2. List actual files and relevant keys; check JSON parseability and whether expected `content` values can be identified.
3. Consult `manifest.json` for provenance and metadata, but verify it against actual archive members.
4. Record missing snapshots, ambiguities, inconsistent IDs, invalid data, and other limitations.
5. Do not silently repair corrupted or ambiguous source records.

### B. Analyze Cleanup: `0HF → 1GL`

Compare source and post-Cleanup states. Separate:

- visible textual changes;
- HTML structure, attributes and markup changes;
- encoding, whitespace, entities, Unicode and typography;
- changes that may affect rendering or meaning.

Identify potentially beneficial, questionable and harmful transformations. Do not label all differences as mistakes or all Cleanup changes as improvements.

### C. Analyze subsequent work: `1GL → 2NT`

Identify later content changes, including additions, deletions, replacements, moves, and formatting. This is an **observed state difference**, not a complete record of each editing action. Do not automatically attribute changes to the proofreader: Audit, manual edits, other tools or processes may have contributed.

If both stages are present, optionally examine `0HF → 2NT` to characterize the net outcome; never replace the intermediate comparisons with this net comparison.

### D. Analyze Audit independently

Only if `audit.json` exists and is interpretable:

- enumerate checks and supported providers (e.g. Gemini, Qwen, LanguageTool) as actually recorded;
- distinguish raw proposals, filtering, display, user decisions, application, modification, rejection, undo, and final effect **only where evidence supports those states**;
- account for repeated checks, stale proposals, conflicts and undo when recorded;
- correlate Audit events to state differences using text/context/identifiers/timing where available;
- mark uncertain attribution explicitly.

A recommendation being accepted does not establish correctness. Rejection does not establish that a suggestion was wrong. An action log does not by itself guarantee that its textual effect persisted through `2NT`.

### E. Cross-source synthesis

Reconcile findings across snapshots, Audit and metadata. Separate confirmed effects from plausible causal explanations. If evidence conflicts, report the conflict instead of forcing one narrative.

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

## 5. Finding dimensions

Classify observations on **independent axes**, where evidence permits:

**Stage / transition:** `0HF→1GL`, `1GL→2NT`, `0HF→2NT`, `audit`, or `cross-source`.

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
- **Status:** isolated observation, candidate pattern, supported recurring pattern, or withdrawn/revised.

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

## 8. Reporting behavior

Use a **short report by default**:

1. **Coverage / limitations:** analyzed files, missing stages and any parsing concerns.
2. **Cleanup:** significant `0HF→1GL` findings.
3. **After Cleanup:** significant `1GL→2NT` findings.
4. **Audit:** relevant suggestion/action patterns and attribution limitations.
5. **Observations:** noteworthy change records, prioritized by significance.
6. **Cross-archive signals:** only if previous comparable cases exist.
7. **Questions for further evidence:** only questions that block a meaningful conclusion.

Do not manufacture findings to populate every heading. If a stage is absent, say so and omit its detailed section. Use tables when they clarify dense comparisons; do not produce massive raw diffs in ordinary chat. For extensive changes, summarize and retain traceable examples.

Separate three statements explicitly when necessary:

- **Observed:** what data definitively show.
- **Interpretation:** the best-supported explanation.
- **Hypothesis:** what needs further verification.

## 9. Codex boundary

Use Codex only when investigation requires current source-of-truth logic, such as identifying the Cleanup rule behind a recurring transformation, interpreting an Audit event, or checking whether behavior matches implementation.

Send Codex a narrow, evidence-backed question with concrete excerpt(s), archive identifiers and expected versus observed behavior. Request source locations, execution path and falsifiable explanation, not an automatic patch. Review any proposed conclusion against observed telemetry. Code changes are outside this skill.

## 10. Methodology evolution

This is `v0.1`, a methodological baseline, **not** a verified decoder of the JSON format.

Revise after examining real archives, especially:

- schema and provenance of each snapshot;
- structure, identity and chronological ordering of Audit events;
- reliability of linking Audit actions to text differences;
- boundaries of HTML parsing and normalization;
- useful taxonomy and reporting granularity.

Keep source archives unchanged. Record substantive changes to methodology with version number and brief changelog. Record which methodology version was used for each analysis. When a rule changes, flag earlier findings that may need re-evaluation rather than silently rewriting their interpretation.

### Changelog

- `v0.1` — initial evidence-first comparison and classification methodology; no archive-specific assumptions.
