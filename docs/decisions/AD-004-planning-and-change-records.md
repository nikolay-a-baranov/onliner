# AD-004: Planning and change records

## Status

Accepted on 2026-10-19.

## Context

The repository had two files named as TODO lists, a strategic roadmap, decision
records, and technical-debt tickets, but no explicit ownership boundary between
them. Completed work was recoverable from Git, while its intent, operational
impact, verification, and handoff context were easy to lose between sessions.

A full project harness would add more ceremony than this repository currently
needs. The useful parts are a canonical backlog, bounded living plans for complex
work, durable decision records, and a curated record of meaningful changes.

## Decision

Use the following sources with non-overlapping ownership:

- `TODO.md` is the only actionable backlog.
- `docs/roadmaps/` describes strategic direction and phase ordering.
- `docs/plans/` contains living execution plans only for multi-session,
  cross-subsystem, migration-sensitive, or otherwise risky work.
- `docs/decisions/` records durable architectural and repository-process choices.
- `docs/debt/` records understood problems that need substantial context but do
  not yet have an approved execution plan.
- `CHANGELOG.md` summarizes meaningful delivered and repository-workflow changes
  in terms of outcome and impact.
- `docs/notes/` contains unapproved observations and reference material.
- Git remains the exact source of line-level and commit history.

Plans must separate intended work from observed progress. Verification evidence
is recorded only after the corresponding command or manual check has actually
run. Material changes are added to `CHANGELOG.md` under `Unreleased`; routine
refactors and generated output are omitted unless they affect behavior.

## Consequences

- A future session has one place to find actionable backlog items and one place
  to resume a complex active change.
- Git history no longer has to explain product impact or the rationale behind a
  decision by itself.
- Planning overhead remains proportional: small changes do not require plans.
- Existing planning documents should adopt lifecycle metadata when next edited;
  they do not need a bulk rewrite solely for formatting consistency.

## Alternatives considered

- Keep both TODO files: rejected because task ownership stays ambiguous.
- Use commit messages as the only history: rejected because they are a poor
  source for cross-commit outcomes, verification, and handoffs.
- Add a full `GOALS.md`/`PROMPTS.md`/harness structure now: deferred until the
  repository demonstrates recurring long-running work that needs those owners.

## Validation

- Repository references must no longer treat `docs/TODO.md` as an active backlog.
- `AGENTS.md`, the documentation map, plan template, and changelog must agree on
  artifact ownership.
- Documentation changes must pass `git diff --check`.
