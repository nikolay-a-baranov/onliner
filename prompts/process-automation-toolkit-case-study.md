# Task for Codex

You are auditing a JavaScript internal automation project and packaging it as a credible productized case study for a Process Automation Engineer profile.

Do not invent production status, users, adoption, business impact, team size, or exact metrics. Work only from repository evidence and clearly separate:
- implemented;
- partial;
- prototype;
- planned;
- inferred.

Your job is not only to describe the codebase, but to frame it as an internal workflow automation product:
a browser-side operator toolkit for editorial and CMS workflows, with reusable commands, guardrails, UI surfaces, content helpers, media helpers, report/export flows, and human-in-the-loop controls.

## Positioning Goal

Position this project as:

- an internal workflow automation toolkit;
- a productized browser-side operations layer for legacy editorial/CMS processes;
- a maintainable operator toolset, not a one-off script;
- a Process Automation Engineer case, not a classic backend/platform engineering case.

Avoid positioning it as:
- a SaaS;
- a general-purpose AI product;
- a production backend platform;
- a mass-adopted enterprise system unless evidence explicitly supports that.

## What to inspect

Inspect the repository and identify:

1. Product shape
- What kind of internal product this is.
- Who the likely operator/user is.
- What recurring workflow pain it appears to reduce.
- Whether the repo supports the claim that this is a reusable toolkit rather than isolated scripts.

2. Main product modules
Look for evidence-backed modules such as:
- CMS/admin automation
- editor/post helpers
- title/slug/excerpt/tag handling
- rotation title handling
- sanitize/cleanup/validation helpers
- media upload/gallery/thumbnail flows
- UI/panel/overlay/launchpad surfaces
- report/crawler/export flows
- source extraction / payload generation / handoff flows
- AI-assisted development or operator handoff workflows

For each module:
- state whether it is implemented, partial, prototype, or inferred;
- cite relevant files/modules.

3. Product architecture and source of truth
- List key files/modules and one-sentence responsibilities.
- Identify source-of-truth modules vs compatibility facades/wrappers/transitional files.
- Identify whether the system is mainly browser-side, Node-side, or mixed.
- Explain what makes the codebase look productized: command registry, shared UI primitives, action routing, transform pipelines, runtime metadata, validation layers, etc.

4. Primary operator workflows
Explain the main user/operator flows:
- how the operator launches the tooling;
- what page/context it reads;
- what fields/DOM/content it inspects;
- what it transforms;
- what it writes back;
- what it exports/downloads/opens/copies.

Separate:
- implemented workflows;
- partial/prototype workflows;
- supporting infrastructure.

5. Manual work reduced or standardized
Extract concrete implemented features from code.
For each feature:
- describe the manual step it reduces, standardizes, or guards;
- explain the exact behavior in concrete terms;
- avoid vague claims like "improves productivity" unless supported by specific behavior.

6. Guardrails, reliability, and human-in-the-loop design
Identify:
- field existence checks;
- page/context gating;
- input validation;
- fallback behavior;
- confirm/prompt/alert/manual review checkpoints;
- error handling;
- status output;
- confidence/risk/manual-review markers;
- retry/timing logic;
- deterministic transforms vs side-effectful DOM actions.

Call out where the design is explicitly human-in-the-loop rather than fully autonomous.

7. Maintainability and product quality signals
Identify patterns that support product credibility:
- modularization;
- isolated transforms;
- shared UI/surface primitives;
- explicit source-of-truth rules;
- command metadata;
- architecture/docs ownership rules;
- build/validation steps;
- patch-oriented workflow;
- compatibility boundaries;
- legacy isolation.

Also identify fragility risks:
- DOM coupling;
- legacy CMS assumptions;
- very large modules;
- global state/window keys;
- weak test coverage;
- hidden side effects;
- unclear ownership splits.

8. AI-assisted workflow evidence
Identify evidence of:
- Codex/ChatGPT handoff;
- prompt-to-patch workflow;
- audit/handoff archive process;
- repository-guided AI collaboration;
- AI-assisted operator flow such as source extraction and draft handoff.

Do not claim runtime AI features unless code clearly implements them.

9. Product framing output
Based on the evidence, derive:
- a concise product description;
- target user/persona;
- jobs-to-be-done;
- core capability areas;
- boundaries of the product;
- what makes it credible as an internal tool product.

10. Metric candidates — do not present as exact unless verified
Produce a section called:
"Metric candidates — do not present as exact unless verified"

For each candidate metric, provide:
- metric name;
- what can be counted from repo/code/logs;
- formula or estimation method;
- evidence needed to validate it;
- safe wording for CV/portfolio/case study use.

Prefer metrics like:
- number of operator actions consolidated into one launch surface;
- number of CMS fields checked/populated/normalized;
- number of reusable workflow commands;
- number of validation/guard checkpoints;
- number of supported workflow modules;
- number of report/export artifacts produced from one run;
- number of manual review cases surfaced instead of silently auto-handled;
- estimated manual steps removed per post/report flow, with a proposed measurement method.

11. Career packaging
Produce safe positioning for:
- CV bullet(s)
- portfolio/case-study summary
- interview explanation

12. HR/manager-friendly case study framing
Produce a short non-technical case-study version that a recruiter or hiring manager can scan quickly.

Use a simple structure such as STAR or CAR:
- Situation / Context
- Task / Goal
- Actions
- Result

Requirements for this section:
- keep it readable by non-engineers;
- avoid deep implementation detail and file-level discussion;
- avoid exact metrics unless verified;
- keep claims conservative but concrete;
- make clear that this was an internal workflow automation product/toolkit, not a generic script or unsupported claim of platform ownership.

13. Author positioning
Add sections that position the repository owner as the author of the solution in a credible way.

Cover:
- what this case demonstrates about the author's strengths;
- what engineering/product/process judgment is visible in the work;
- what ownership claims are safe;
- what seniority signals are present;
- what role-fit this supports best: Process Automation Engineer, internal tools/product engineer, workflow automation specialist, or adjacent roles.

14. Reusable career assets
Produce short reusable assets derived from the report:
- 3 CV bullets;
- 1 portfolio/project summary paragraph;
- 1 LinkedIn-style summary paragraph;
- 1 short interview pitch around 30-45 seconds;
- 1 longer interview answer around 90 seconds.

## Recommended files to inspect explicitly

Do not limit the audit to action modules only. Explicitly inspect these files if they exist, because they materially affect product positioning:

- `src/actions.js`
- `src/actions/admin.js`
- `src/actions/content.js`
- `src/actions/media.js`
- `src/actions/editorial.js`
- `src/launchpad.js`
- `src/runtime/commands.js`
- `src/runtime/scenarios.js`
- `src/runtime/groups.js`
- `src/runtime/launchpad/feed.js`
- `src/runtime/launchpad/identity.js`
- `src/report.js`
- `docs/project.md`
- `docs/architecture.md`
- `docs/assistant-tasks-workflow.md`

Why these matter:
- `src/launchpad.js` shows that the project is not just a set of scripts, but a reusable operator surface with context detection, command execution, panel behavior, and workflow entrypoints.
- `src/runtime/scenarios.js` and `src/runtime/groups.js` show how command availability and workflow groupings are modeled, which strengthens the internal-tool/product narrative.
- `src/runtime/launchpad/feed.js` shows how the user-facing command/feed experience is organized, which is useful when describing usability and operator experience.
- `src/actions/editorial.js` is important for structured source extraction, export, and AI-assisted handoff claims; do not rely only on older inline copies of this logic if the project now has a dedicated module.

Also identify:
- risky wording to avoid;
- likely interviewer challenge points;
- extra evidence to collect before using the story publicly.

## Output format

Return a structured Markdown report with these sections:

1. Executive finding
2. What product this appears to be
3. Likely user and jobs-to-be-done
4. Repository areas inspected
5. Main modules and responsibilities
6. Source of truth vs compatibility/transitional layers
7. Implemented operator workflows
8. Partial / prototype / planned workflows
9. Manual steps reduced or standardized
10. Guardrails, validation, and human-in-the-loop design
11. Maintainability / architecture notes
12. AI-assisted workflow evidence
13. Product framing summary
14. Metric candidates — do not present as exact unless verified
15. Safe wording for CV / case study
16. Risky wording to avoid
17. Interview challenge points
18. Missing evidence to collect next
19. HR / hiring-manager case study version
20. What This Demonstrates About the Author
21. Safe Author Ownership Claims
22. Role Fit and Seniority Signals
23. Reusable Career Assets

## Artifact requirement

Treat both the prompt and the generated answer as repository artifacts.

- Save this prompt as a source artifact under `prompts/` with a clear, stable filename.
- Save the generated report as a response artifact under `.responces/` with a clear, human-readable filename.
- In the report, include the exact prompt artifact path used to generate it.
- Do not assume the report exists only in chat output; produce it as a file artifact suitable for later reuse.

## Constraints

- Be factual and repository-grounded.
- Cite file paths and function/module names where possible.
- Do not rewrite code.
- Do not invent users, outcomes, or impact.
- Distinguish implemented vs partial vs prototype vs inferred.
- Prefer concise technical language.
- Treat this as an internal workflow product case, not a generic software project summary.
