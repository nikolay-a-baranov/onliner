# AI Editorial Roadmap

Status: active working roadmap

Roadmap реализации архитектуры из `docs/ai-editorial.md`.

## Phase 0 — Repository discovery

- [x] Провести repository-level discovery AI/editorial integration points.
- [x] Найти canonical TinyMCE-safe content read: `cms.editor.syncToTextarea()`.
- [x] Найти reusable normalization owners в `src/pipe/*`.
- [x] Найти shared field setters в `src/core/dom.js`.
- [x] Найти existing provider/runtime owner: `src/core/llm.js`.
- [x] Подтвердить, что отдельный `src/ai/` пока преждевременен.
- [x] Подтвердить отсутствие reliable AI-ready Catalog category source.

## Phase 1 — Task system foundation

Цель: доказать provider-neutral TaskContract и context/compilation boundaries без построения API runtime.

- [ ] Зафиксировать минимальную реализационную форму `TaskContract`.
- [ ] Определить минимальный Base ArticleContext для первых tasks.
- [ ] Определить task-specific context collection contract.
- [ ] Переиспользовать/собрать `plain` content projection.
- [ ] Переиспользовать/собрать `structured` content projection.
- [ ] Реализовать простой общий task compiler.
- [ ] Определить manual delivery representation.
- [ ] Добавить developer inspect/download CompiledTask.
- [ ] Не добавлять новый provider stack.
- [ ] Не создавать `src/ai/` без подтвержденной owner boundary.

Exit criteria:

- task не читает DOM;
- task не знает provider/model;
- context собирается существующими owners;
- CompiledTask можно прочитать целиком;
- один task можно выполнить вручную через разные чаты без изменения source contract.

## Phase 2 — Representative atomic tasks

Первые tasks используются как test specimens системы.

### Headline

- [ ] TaskContract `headline`.
- [ ] Input contract.
- [ ] Context requirements.
- [ ] Instructions.
- [ ] Output contract.
- [ ] Quality constraints.
- [ ] Capability requirements.
- [ ] Tier recommendation.
- [ ] Manual fixtures.
- [ ] Manual comparison на нескольких моделях/чатах.

### Lead

- [ ] TaskContract `lead`.
- [ ] Input contract.
- [ ] Context requirements.
- [ ] Instructions.
- [ ] Output contract.
- [ ] Quality constraints.
- [ ] Capability requirements.
- [ ] Tier recommendation.
- [ ] Manual fixtures.
- [ ] Manual comparison на нескольких моделях/чатах.

### Rewrite

- [ ] TaskContract `rewrite`.
- [ ] Input contract.
- [ ] Context requirements.
- [ ] Instructions.
- [ ] Output contract.
- [ ] Quality constraints.
- [ ] Capability requirements.
- [ ] Tier recommendation.
- [ ] Manual fixtures.
- [ ] Manual comparison на нескольких моделях/чатах.

Exit criteria:

- 2–3 provider-neutral tasks устойчиво работают;
- понятен реальный набор shared rules;
- понятны реальные differences между plain/structured inputs;
- нет необходимости в full provider-specific prompt variants;
- есть реальные данные для library normalization.

## Phase 3 — Normalize prompt/task library

Только после Phase 2.

- [ ] Выделить shared editorial rules при доказанном reuse.
- [ ] Выделить shared factuality/safety rules при доказанном reuse.
- [ ] Вынести exact specs/limits.
- [ ] Ввести schemas только там, где structured result реально используется приложением.
- [ ] Определить task registry/manifest только если он упрощает execution.
- [ ] Определить revision/hash strategy.
- [ ] Проверить, появилась ли реальная shared subsystem boundary.
- [ ] Пересмотреть необходимость `src/ai/`.
- [ ] Не вводить universal prompt DSL.

Exit criteria:

- source of truth понятен;
- tasks остаются читаемыми;
- shared pieces уменьшают duplication;
- dependency graph не становится сложнее самих prompts.

## Phase 4 — API runtime integration

После стабильных TaskContracts.

- [ ] Определить semantic CompiledTask contract.
- [ ] Интегрировать execution с существующим `src/core/llm.js`.
- [ ] Определить runtime mapping `fast / normal / smart`.
- [ ] Добавить capability-aware model/provider selection.
- [ ] Добавить structured output там, где это полезно.
- [ ] Добавить deterministic validation/normalization.
- [ ] Добавить task/model/prompt/schema metadata.
- [ ] Добавить token usage/latency logging.
- [ ] Позже добавить retry/fallback/budget policy при реальной необходимости.
- [ ] Не добавлять provider-specific prompt forks без eval evidence.

Exit criteria:

- один TaskContract работает через manual и API там, где manual mode применим;
- concrete provider/model выбирает runtime;
- editorial semantics не зависят от provider.

## Phase 5 — Composite publish experiment

Цель: проверить основной workflow «одна статья → один структурированный редакционный пакет».

Candidate outputs:

- [ ] headlines;
- [ ] leads;
- [ ] slug;
- [ ] excerpt;
- [ ] tags;
- [ ] quotes;
- [ ] language/typo issues;
- [ ] facts-to-check.

Experiment:

- [ ] Создать first-class `publish` TaskContract.
- [ ] Определить structured output schema.
- [ ] Сравнить publish results с atomic tasks на одинаковых материалах.
- [ ] Сравнить factual fidelity.
- [ ] Сравнить manual edit burden.
- [ ] Сравнить token usage.
- [ ] Сравнить latency.
- [ ] Проверить multi-task interference.
- [ ] Принять решение: composite by default / hybrid / separate.

Exit criteria:

- production execution strategy выбрана по измеряемым quality/cost/latency данным.

## Phase 6 — Analysis state and review UI

Если reusable/composite analysis доказан:

- [ ] source hash.
- [ ] task/prompt/schema/model metadata.
- [ ] stale detection.
- [ ] structured result preview.
- [ ] suggested/selected/applied states.
- [ ] no silent semantic apply.

## Phase 7 — WordPress apply

- [ ] Определить partial `WordPressPatch` domain contract.
- [ ] Build patch только из selected suggestions.
- [ ] Apply через existing admin/post/field owners.
- [ ] title/slug/excerpt/tags smoke tests.
- [ ] Не создавать второй write path.
- [ ] Не давать model знать DOM field names.

## Phase 8 — Taxonomy and Catalog

- [ ] Зафиксировать reliable taxonomy source.
- [ ] Зафиксировать reliable Catalog category source.
- [ ] Определить candidate retrieval.
- [ ] Передавать model только allowed candidates.
- [ ] Запретить unknown/generated ids.
- [ ] Добавить review/apply flow.

## Phase 9 — New user-requested tasks

Для каждой новой задачи:

- [ ] определить atomic/composite nature;
- [ ] определить TaskContract;
- [ ] определить input;
- [ ] определить context collectors;
- [ ] определить output contract;
- [ ] определить capabilities;
- [ ] назначить tier;
- [ ] определить quality criteria;
- [ ] протестировать manual, если task допускает manual delivery;
- [ ] подключить API execution при необходимости;
- [ ] не дублировать context/compiler/runtime logic.

Candidate tasks:

- [ ] factcheck;
- [ ] topic expansion;
- [ ] interview preparation;
- [ ] special project ideation;
- [ ] style polishing;
- [ ] related articles;
- [ ] photo captions;
- [ ] multimodal/image tasks.

## Deferred

Не реализовывать без отдельного основания:

- [ ] prompt CMS/database;
- [ ] remote prompt registry;
- [ ] universal prompt DSL;
- [ ] graph/orchestration framework;
- [ ] full provider-specific prompt forks;
- [ ] generalized taxonomy subsystem без реального consumer;
- [ ] separate provider stack parallel to `src/core/llm.js`;
- [ ] `src/ai/` subsystem до появления устойчивой shared boundary;
- [ ] silent auto-apply смысловых изменений.

## Current next step

Собрать implementation handoff для Phase 1–2.

Handoff должен позволить:

1. переиспользовать canonical editor content extraction;
2. переиспользовать существующие text/content transforms;
3. изучить текущие prompt conventions;
4. встроить TaskContract/compiler/manual inspect в natural existing owner;
5. реализовать первый `headline` task;
6. не затрагивать API provider execution, WordPress apply и Catalog.

