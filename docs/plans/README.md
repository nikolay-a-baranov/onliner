# Execution Plans

Эта папка предназначена для живых исполняемых планов сложных изменений. План
нужен, если работа занимает несколько сессий, затрагивает несколько подсистем,
требует миграции/восстановления или отдельного человеческого контроля. Для
локальной правки достаточно `TODO.md` и обычной проверки.

## Ownership

- `TODO.md` отвечает за список конкретных задач.
- Roadmap отвечает за направление и порядок крупных этапов.
- Plan отвечает за выполнение одного ограниченного изменения.
- `docs/decisions/` отвечает за долговечные решения и их причины.
- `CHANGELOG.md` отвечает за значимые фактически внесённые изменения.
- Git отвечает за точную историю строк и коммитов.

План нельзя использовать как доказательство выполнения. Намерения находятся в
разделах scope/steps, а наблюдаемый результат — только в progress/evidence.

## File names and lifecycle

Используй имя `docs/plans/<short-topic>.md` и один из статусов:

- `draft`
- `active`
- `blocked`
- `completed`
- `superseded`

Активный план обновляется при изменении курса, завершении значимого шага или
перед передачей работы в следующую сессию. Завершённый план сохраняется как
короткая история исполнения; актуальное поведение должно оставаться описано в
профильной документации, а не только в плане.

## Template

```md
# <Outcome-oriented title>

Status: draft
Last reviewed: YYYY-MM-DD

## Sources

- Links to the backlog item, roadmap, decision, specification, or user request.

## Objective

Observable outcome of the work.

## Scope

- Included work.

## Non-goals

- Explicitly excluded work.

## Current milestone

One concrete next result, not a broad theme.

## Affected areas

- Expected files, modules, data, or external surfaces.

## Dependencies and decisions needed

- Prerequisites, unknowns, approval gates, and recovery constraints.

## Steps

- [ ] Bounded implementation step.

## Acceptance criteria

- Observable condition that must be true.

## Verification

- Exact focused and broader commands or manual checks planned.

## Progress and evidence

- YYYY-MM-DD — observed result, command/check, and outcome.

## Decision log

- YYYY-MM-DD — decision, reason, and consequence for the plan.

## Handoff

Current state, next action, blockers, and anything the next session must preserve.
```

## Maintenance rules

- Keep the document self-contained enough to resume after a pause.
- Record decisions when they are made; do not silently rewrite earlier reasoning.
- Append corrections when prior evidence was wrong or incomplete.
- Link to canonical specifications instead of copying them into the plan.
- Do not claim tests, builds, reviews, or acceptance without observed evidence.
- On completion, update `CHANGELOG.md` when the outcome is material and create or
  update an ADR if the work established a durable architectural decision.
