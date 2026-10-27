# Proofreading evidence-to-improvement workflow

## Status and scope

This document defines the lightweight repository workflow for turning
proofreading telemetry into proposed Cleanup or Audit changes. Report creation
never authorizes or starts runtime work. A person may explicitly submit a
bounded Codex brief that authorizes its conditional low-risk patch, while
risky, broad or policy-sensitive work still requires separate approval.

The source session archive remains immutable. Derived analysis may explain the
evidence, but it must not silently replace missing archive members, infer an
unverified schema, or claim productivity gains that were not measured.

## Current sources of truth

| Concern | Source of truth | What it already establishes |
| --- | --- | --- |
| Session snapshots, manifest, Audit/activity export and package name | `src/actions/telemetry.js` | `onliner.post-snapshot/v1`, `onliner.telemetry-package/v1`, `onliner.audit-telemetry/v1`, `onliner.activity/v1`, environment and optional revision provenance; export as `<section>-<postId>.zip` |
| Toolbar command boundary | `src/actions.js` | Central `actions.run(...)` instrumentation; completion means that the action returned, not that text changed |
| Cleanup orchestration and submit boundaries | `src/actions/admin.js` | `0HF` before Cleanup, `1GL` after Cleanup, `2NT` before Save/Publish export; current post-edit behavior |
| Cleanup transformations | `src/pipe/text.js`, `src/core/widget.js`, and the relevant `admin.clean` code in `src/actions/admin.js` | Executable behavior. No separate prose document overrides these rules |
| Audit prompt contract | `src/prompts/editorial.js` | Provider-neutral prompt ID/revision, output shape and normalization |
| Audit mapping, filters, review and decision IDs | `src/actions/audit.js` | Generated, filtered and presented suggestions; accepted/dismissed/customized decisions and undo telemetry |
| Prompt observations and curated regression cases | `docs/decisions/AD-002-audit-evaluation-observations.md`, `evals/README.md`, `evals/editorial/README.md`, `evals/run.js` | Raw observations stay in ignored `.eval/`; reviewed, redacted cases belong in `evals/editorial/`; interaction is not ground truth |
| Activity contract and limitations | `docs/telemetry-activity.md`, `tools/telemetry-foundations-smoke.js` | Coverage, privacy limits, grouping, persistence and current structural checks |
| Repository task and change records | `AGENTS.md`, `docs/JAVASCRIPT.md`, `docs/decisions/AD-004-planning-and-change-records.md` | `TODO.md` is the backlog; plans, decisions, notes and changelog have distinct owners; `.chatgpt/` is temporary task history |
| Analysis skill and report contract | `.agents/skills/onliner-proofreading-analysis/SKILL.md` | Discoverable repository skill containing methodology v0.4 and the backward-compatible report contract |

No standalone authoritative house-style file or committed comprehensive Cleanup
fixture suite was found. Editorial constraints currently live in executable
Cleanup rules, the Audit prompt and runtime filters. `sandbox/` can support
manual checks, while curated Audit behavior belongs in `evals/editorial/`.

## Minimal evidence lifecycle

1. Keep `<section>-<postId>.zip` unchanged. Record its filename and preferably a
   SHA-256 digest when it enters a review. This ZIP is the evidence, including
   any schema and coverage limitations declared by its manifest and members.
2. Analyze one session into the current required pair:
   `<section>-<postId>.analysis.md` for the readable account and
   `<section>-<postId>.findings.json` for stable finding IDs and evidence links.
   Each link names the source archive, member and a JSON Pointer or other exact
   context locator. Missing members are recorded as unavailable.
3. Keep `*.codex.md` optional and evidence-gated. Generating it does nothing by
   itself. When the user explicitly submits it to Codex, that action authorizes
   only the brief's bounded research and conditional localized patch; the
   per-session filename remains unchanged inside the report ZIP.
4. The analysis assistant never implements changes. Codex may implement only
   after verifying the cause and desired behavior and only when the brief's
   low-risk/testable gate passes. Otherwise it makes no behavior change.
   Rejected or deferred dispositions remain in the external review record.
5. Use `TODO.md` or `docs/plans/` for separately approved backlog, risky or
   multi-session work, and `docs/decisions/` only for durable architectural
   choices. Do not duplicate a bounded submitted brief in another registry.
   Finding IDs continue through the paired response, tests, commit/version,
   `CHANGELOG.md` for implemented fixes, and later validation.

These are separate state axes; do not collapse them into one ambiguous status:

- observation: `observed` or `incomplete`;
- research: `not-started`, `investigating`, `supported`, `unsupported` or
  `inconclusive`;
- implementation: `not-proposed`, `proposed`, `approved`, `rejected`,
  `deferred`, `implemented` or `validated`.

Example format only — the ID and evidence below are explicitly synthetic:

```md
| Finding | Evidence | Observation | Research | Implementation | Validation |
| --- | --- | --- | --- | --- | --- |
| SYNTH-DEMO-001 | `demo-000.zip#demo-000-activity.json:/events/4` and `#demo-000-1GL.json:/fields/content/0/value` | observed | supported | approved | pending on `<commit-or-version>` |
```

An approved record must describe the observed behavior and expected behavior,
not translate elapsed timestamps into saved time. Time savings require a
separate measurement with a stated baseline and method.

## Storage and access

The default is user-managed external storage for original session ZIPs and
report ZIPs. Codex receives only the selected report, JSON or an explicitly
readable path for the current task. If the user has not supplied an artifact,
record it as unavailable and stop claims that depend on it; do not substitute a
similarly named local file or recreate the external skill.

As an optional local workflow, the user may explicitly nominate a read-only
folder for a task. It may be outside the repository or use the already ignored
`.audit/` area, for example `.audit/telemetry-reports/`. The nominated location
is the storage location, not an automatically copied mirror. Do not hard-code a
machine path, recursively import it, upload it, or scan unrelated reports.
Article content and author information stay local unless the user separately
authorizes another destination.

The repository `onliner-proofreading-analysis` skill is the current canonical
methodology for this workflow.
If a ChatGPT Project source also exposes the skill, it should reference or be
synchronized from this owner rather than become an independently editable
copy. Every generated report should state the skill/contract version that
produced it.

## Current v0.4 Codex brief contract

Use these requirements without changing the methodology or findings schema:

1. Keep `.analysis.md` and `.findings.json` required. Permit, but never require,
   one `<section>-<postId>.codex.md`; existing v0.3 two-file reports remain
   valid and consumers must ignore an unknown optional third file.
2. Generate `.codex.md` only when every referenced finding has a resolvable
   archive/member/context link, identifies a Cleanup or Audit owner, states
   current versus desired behavior, discloses uncertainty and proposes a
   reproducible check. Otherwise explain the finding only in the required pair.
3. Make `.codex.md` ready to run as research plus a conditional targeted patch.
   Include finding IDs, scope/non-goals, questions, likely owners, competing
   explanations, patch/no-patch gates and validation. Explicit user submission
   authorizes only this bounded task; report generation never does.
4. Represent observation, research and implementation statuses as separate
   fields. Preserve `rejected` and `deferred` human dispositions; analysis may
   initialize status but cannot promote it to `approved`.
5. Give every finding an evidence list containing archive name, member name,
   member schema, exact locator and an evidence-strength label. Mark a missing,
   malformed or unsupported member as unavailable rather than inferring data.
6. Read `activity.json`, manifest environment and revision provenance only
   after validating their actual schemas. State absent fields and coverage/
   truncation limits. Do not reinterpret older archives as newer schemas.
7. Keep report-contract evolution independent of findings schema version.
   Document changes as additive; never rewrite old report ZIPs merely to match
   the latest contract.
8. Require the paired `codex-chatgpt-yyyymmdd-hhmmss.md` answer to link the
   submitted per-session brief and report finding IDs, verification, hypothesis
   outcome, implementation decision, paths, tests, risks, commit when available
   and subsequent-session validation. Do not rename the file inside the ZIP.

## Action-to-effect tracing research

### What current data can prove

| Classification | Current link |
| --- | --- |
| Directly observed | A trusted `beforeinput`/`input` pair records an activity event ID, editor source, `inputType`, stage and a derived character-length effect. Audit activity records join through `audit_event_id` and `decision_id` to accepted/dismissed/customized decisions and undo. Stage snapshots directly show included form values at `0HF`, `1GL` and `2NT`. |
| Supported but uncertain | Command start/end surrounds the central dispatcher and status/duration are real, but completion is explicitly not proof of a mutation. A stage diff can support a Cleanup hypothesis when no competing edit occurred, but cannot assign each changed span to a command. Ordering can support an Audit narrative, while the Audit log remains the stronger source. |
| Unavailable | Current data cannot identify the exact changed range or replacement for a manual event, attribute a same-length edit from length delta, select a specific field instance beyond its source category, or prove causality from timing. It cannot reconstruct intermediate effects between stage snapshots or reliably attribute overlapping async commands. |

Important edge cases are already visible in the code:

- synthetic input is excluded from manual activity by `isTrusted`; trusted
  input while any Toolbar command is active is also omitted;
- TinyMCE activity measures `textContent`, while snapshots synchronize and
  store textarea HTML, so offsets and lengths use different representations;
- Cleanup overwrites the current `0HF`/`1GL` snapshots on repeated runs while
  activity survives that boundary;
- Toolbar commands may be synchronous or asynchronous, and overlapping command
  lifetimes provide no safe ownership rule;
- Audit has its own append-only run/decision evidence and should not be
  duplicated by a generic mutation log;
- `2NT` proves the exported final form state, not which earlier event caused it.

### Minimal future experiment

Use an additive, explicitly versioned experiment on a few existing mutation
boundaries, not a DOM-wide recorder or new event bus:

1. Assign a monotonically increasing revision per observed field. At an atomic
   mutation boundary, record event ID, stable field key, representation
   (`textarea-value`, `editor-html` or `content-text`), before/after revision,
   lengths and whether the value actually changed.
2. For exact bounded effects, prefer one minimal diff tuple: start offset,
   removed length, inserted length and before/after state hashes. Offsets alone
   drift; hashes alone prove state identity but not the changed span. Minimal
   removed/inserted excerpts are diagnostically strongest but increase article
   exposure and should be capped and enabled only after privacy review. Never
   collect keystrokes or clipboard contents.
3. First cover `#content` in HTML mode, one synchronous Toolbar mutation,
   Cleanup's existing `0HF` → `1GL` transaction, and Audit accept/customize/undo.
   Link Audit effects to its existing IDs instead of creating a second log.
   Treat TinyMCE and async commands as a later phase after representation and
   completion ownership are explicit.
4. Store the final field revision/hash in `2NT` so the event chain can be
   checked against the exported state. A no-op, reverted edit or broken chain
   is recorded as such, not promoted to a causal link.

This experiment adds useful evidence without claiming that adjacent timestamps
establish causality. Its main risks are HTML normalization, moving offsets,
async overlap, extra sensitive excerpts and activity truncation.

Representative validation should cover manual insert/delete/paste/undo/redo,
same-length replacement, synthetic input exclusion, no-op and revert, a
programmatic Toolbar write, repeated Cleanup, Audit accept/custom replacement/
dismiss/undo, overlapping async commands, `#content` versus TinyMCE, another
editorial field, page/session boundaries, overflow and final `2NT` chain
verification. Sanitized accepted cases may enter an existing eval or focused
smoke fixture only after human review.
