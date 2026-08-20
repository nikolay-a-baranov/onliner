# AI Editorial System

Status: draft / living architecture note

## Purpose

Этот документ фиксирует рамочную архитектуру AI-функций редакционного инструмента.

Ключевая граница:

> Prompting отвечает за то, что должна сделать модель. Runtime отвечает за то, где и как это выполнить.

AI Editorial System рассматривается как provider-neutral task system для редакционных AI-задач над нормализованным контекстом.

Task может быть:

- atomic — одна самостоятельная задача;
- composite — один запрос, который возвращает несколько связанных результатов.

Task описывает:

- что требуется сделать;
- какой input нужен;
- какой дополнительный context нужен;
- инструкции;
- output contract;
- quality constraints;
- required capabilities;
- recommended model tier.

Runtime отвечает за:

- сбор дополнительного context;
- delivery;
- provider/model selection;
- execution;
- retries/fallback;
- budgets/rate limits;
- observability.

Интеграционный слой отвечает за использование результата в Launchpad/WordPress.

Детальный прогресс реализации ведется отдельно в `docs/roadmaps/ai-editorial.md`.

## Core principles

1. Prompting и runtime — разные ответственности.
2. Task definitions не знают про OpenRouter, DeepSeek, OpenAI, Gemini, Claude или конкретные модели.
3. Конкретный provider/model выбирается runtime-слоем.
4. Source of truth для task semantics должен быть один.
5. Не делать отдельные полные prompt-версии `for DeepSeek`, `for ChatGPT`, `for API` и т. п.
6. Task должен быть delivery-neutral.
7. Manual delivery нужен как способ раннего тестирования, но не обязан поддерживаться каждым будущим task.
8. Не строить один огромный универсальный system prompt.
9. Shared rules выделять только после доказанного повторения.
10. AI task не должен знать DOM или структуру WordPress.
11. WordPress/DOM extraction, нормализация данных, task compilation, execution и применение изменений — разные стадии.
12. Модель не должна напрямую владеть техническим WordPress payload.
13. Atomic и composite execution — равноправные варианты. Выбор между ними определяется quality, cost и latency, а не архитектурой.
14. Не оптимизировать систему заранее вокруг минимального числа запросов или минимального количества токенов.
15. Структура должна развиваться от реальных задач и измеряемого поведения.

## High-level architecture

```text
Sources / WordPress / user input / external context
                    ↓
              context collection
                    ↓
           normalized task context
                    ↓
               TaskContract
                    ↓
               task compiler
                    ↓
               CompiledTask
              ↙            ↘
         manual             runtime
                           ↓
                     provider/model
                           ↓
                    structured result
                           ↓
                 integration / review
                           ↓
                    WordPress apply
```

## Task types

### Atomic task

Одна редакционная задача.

Примеры:

```text
headline
lead
rewrite
factcheck
slug
style-review
```

Atomic tasks полезны для:

- ручного тестирования;
- точечных пользовательских команд;
- повторной генерации одного результата;
- сравнения качества моделей;
- fallback;
- evals.

### Composite task

Один task возвращает несколько связанных результатов.

Пример:

```text
publish
```

Может возвращать:

- headlines;
- leads;
- slug;
- excerpt;
- quotes;
- tags;
- taxonomy suggestions;
- language/style issues;
- facts to check.

Composite task является first-class concept системы, а не workaround поверх atomic tasks.

Нельзя заранее считать, что composite всегда лучше из-за экономии input tokens. Его качество должно сравниваться с atomic tasks.

## TaskContract

Каждая AI-задача должна иметь единый явный контракт.

Концептуальная форма:

```js
{
  id,
  input,
  context,
  instructions,
  output,
  capabilities,
  quality,
  tier,
}
```

TaskContract описывает задачу декларативно. Он не должен сам становиться отдельным runtime/provider implementation.

### `id`

Стабильный machine-readable id.

Примеры:

```text
headline
lead
rewrite
factcheck
publish
```

### `input`

Какие основные данные получает task.

Например:

```js
{
  article: "structured",
  currentHeadline: "optional",
}
```

### `context`

Какой дополнительный context нужно собрать.

Примеры:

- current title;
- excerpt;
- section;
- selected tags;
- allowed taxonomy candidates;
- source attribution;
- user-supplied instructions;
- uploaded/reference materials;
- external search results.

Task не должен сам читать DOM.

### `instructions`

Provider-neutral описание требуемого model behavior.

### `output`

Expected result contract.

Он может быть:

- human-readable;
- structured;
- schema-constrained.

### `capabilities`

Требования к execution environment, а не конкретной модели.

Примеры:

```js
{
  structuredOutput: true,
  web: false,
  vision: false,
  tools: [],
}
```

Будущие задачи могут требовать:

```text
web
vision
structured-output
tool-calling
large-context
```

Runtime должен выбирать provider/model, удовлетворяющий требованиям.

### `quality`

Hard constraints и критерии качества.

Например:

- не придумывать факты;
- ровно 5 вариантов;
- максимальная длина;
- semantic diversity;
- preserve numbers/names;
- use only allowed taxonomy values.

### `tier`

Рекомендуемый уровень модели:

```text
fast
normal
smart
```

Tier описывает ожидаемую сложность/стоимость задачи, но не provider/model.

## Task compilation

TaskContract — source of truth задачи.

Отдельный compiler преобразует:

```text
TaskContract
+ normalized context
+ shared references/specs
```

в:

```js
{
  instructions,
  input,
  output,
  capabilities,
  tier,
  metadata,
}
```

Task-specific code не должен создавать собственный уникальный способ сборки request, если эту работу можно выполнить общим compiler path.

При этом compiler должен оставаться простым и явным. Не создавать универсальный DSL или скрытую orchestration layer.

## Delivery

### Manual

Manual delivery превращает CompiledTask в полный человекочитаемый запрос для копирования во внешний чат.

Используется в первую очередь для:

- раннего prompt testing;
- сравнений моделей;
- работы без API;
- диагностики compiled task.

Один task может быть протестирован через DeepSeek Chat, ChatGPT, Gemini и другие чаты без создания provider-specific source prompt.

### API

API delivery передает тот же semantic CompiledTask runtime-слою.

Runtime решает:

- provider;
- concrete model;
- mapping instructions/input;
- schema/tools;
- retry;
- fallback;
- limits;
- budget.

Manual и API packaging могут различаться. Редакционный смысл задачи — нет.

### Delivery-neutrality

Не требуется, чтобы абсолютно каждый будущий task был удобен в manual mode.

Например task с:

- web tools;
- backend retrieval;
- large structured taxonomy;
- internal service calls

может оказаться API-only.

Архитектурное требование: TaskContract не должен быть привязан к конкретному delivery/provider.

## Context model

`ArticleContext` — базовый нормализованный context редакционной записи, но не универсальный контейнер для всей AI-системы.

Нужно различать:

```text
BaseContext
TaskContext
```

### Base ArticleContext

Минимальная целевая форма:

```js
{
  postId,
  section,
  title,
  excerpt,
  slug,
  content: {
    source,
    plain,
    structured,
  },
  taxonomy: {
    currentCategory,
    currentTags,
  },
}
```

### Task-specific context

Дополнительный context собирается только если нужен конкретной задаче.

Например:

```js
{
  article,
  references,
  taxonomyCandidates,
  catalogCandidates,
  webSources,
  userInput,
  uploadedMaterials,
}
```

Не раздувать `ArticleContext` всеми возможными будущими данными.

## Existing source ownership

По repository discovery:

- актуальное WordPress/TinyMCE content читается через существующий `cms.editor.syncToTextarea()` path;
- provider/runtime requests уже имеют owner в `src/core/llm.js`;
- reusable content normalization уже есть в `src/pipe/*`;
- reactive-safe field writes уже есть в `src/core/dom.js`;
- post-edit apply behavior принадлежит существующему admin/post action layer;
- reliable AI-ready Catalog category mapping пока отсутствует.

Новые AI-функции должны переиспользовать эти owners, а не создавать параллельные реализации.

## Content representations

Нужны как минимум:

### `source`

Исходное содержимое редактора.

### `plain`

Чистый текст без HTML и технических вставок.

Подходит для:

- headlines;
- slug;
- summary;
- простой тематической классификации.

### `structured`

Текстовое представление с сохранением полезной структуры:

- абзацев;
- подзаголовков;
- цитат;
- списков;
- значимых блоков.

Подходит для:

- lead;
- rewrite;
- style review;
- factcheck;
- composition analysis.

Не вводить один агрессивный `stripTags()` как универсальный формат.

## Prompt composition

Compiled task может включать:

```text
shared editorial rules
shared factuality/safety rules
task-specific instructions
dynamic context
output contract
```

Но shared components появляются только после реального reuse.

Не начинать с большой библиотеки микромодулей.

Плохое направление:

```text
no-yo.md
no-emoji.md
short-sentences.md
no-clickbait.md
```

Task должен оставаться читаемым без знания сложной dependency graph.

## Specs

В specs выносить прежде всего точные данные:

- размеры;
- aspect ratio;
- limits;
- counts;
- allowed values;
- taxonomy identifiers;
- technical formats.

Предпочитать переменные для данных, а не для редакционной философии.

## Prompt library

Логическая целевая структура:

```text
tasks/
references/
specs/
schemas/
```

Физическое размещение определяется после первых реальных implementations.

`src/ai/` пока не является утвержденной subsystem boundary.

Он может появиться позже, если несколько независимых AI tasks создадут реальный shared runtime/compiler/state boundary, который больше не принадлежит существующим owners.

## First implementation proof

Первый implementation stage нужен для проверки TaskContract и compilation model, а не для определения всей будущей архитектуры.

Первые representative tasks:

```text
headline
lead
rewrite
```

Для каждой:

1. определить TaskContract;
2. собрать normalized context;
3. получить manual CompiledTask;
4. протестировать на реальных материалах;
5. сравнить минимум на нескольких моделях/чатах;
6. уточнить instructions/output/quality;
7. определить реальное shared repetition.

Эти tasks — test specimens архитектуры, а не фундаментальная иерархия системы.

## Evals

До сложного runtime нужны representative fixtures.

Для первых tasks проверять:

- factual fidelity;
- hard constraints;
- usefulness;
- manual edit burden;
- semantic diversity;
- stability;
- достаточность context.

После API подключения дополнительно:

- token usage;
- latency;
- model/provider differences;
- structured output reliability.

## Composite publish analysis

`publish` остается важным целевым workflow.

Концепция:

```text
article once
    ↓
publish task
    ↓
structured editorial package
```

Candidate outputs:

- headlines;
- leads;
- slug;
- excerpt;
- quotes;
- tags;
- section/category suggestions;
- Catalog suggestion;
- language/style issues;
- facts to check.

Решение о том, использовать ли composite by default, принимается после сравнения:

```text
atomic quality
vs
composite quality
vs
cost
vs
latency
```

Возможный итог:

- composite by default;
- hybrid;
- separate tasks.

Архитектура должна поддерживать все три.

## Structured results

Когда результат нужен приложению, предпочтителен domain contract, а не WordPress payload.

Черновая форма будущего publish result:

```json
{
  "schema": "onliner.editorial.analysis/v1",
  "source": {
    "postId": "",
    "hash": ""
  },
  "content": {
    "summary": "",
    "topics": []
  },
  "headlines": [],
  "leads": [],
  "publication": {
    "slug": "",
    "excerpt": "",
    "section": null,
    "category": null,
    "tags": []
  },
  "quotes": [],
  "catalog": {
    "relevant": false,
    "category": null
  },
  "review": {
    "language": [],
    "style": [],
    "factsToCheck": []
  }
}
```

Schema не считается стабильной до реального composite experiment.

## Analysis state

Для reusable/composite analysis может понадобиться:

```js
{
  postId,
  sourceHash,
  analyzedAt,
  taskId,
  promptHash,
  schemaVersion,
  model,
  result,
}
```

Если source hash отличается от текущего материала, analysis считается stale.

Persistent analysis state не требуется для первых manual task tests.

## WordPress integration

AI result и WordPress mutation разделяются:

```text
AI result
   ↓
review / selection
   ↓
WordPressPatch
   ↓
existing post-edit owners
```

Различать:

- suggested;
- selected;
- applied.

Не начинать с silent auto-apply.

Модель не должна знать DOM field names или WordPress form payload.

## Taxonomy and Catalog

Если существует конечный набор допустимых значений, модель должна выбирать из source of truth.

Для большой taxonomy допустима схема:

```text
task context
    ↓
candidate retrieval
    ↓
small allowed candidate set
    ↓
model selection
```

Текущее repository discovery показывает, что reliable Catalog category source пока не найден.

Catalog classification не должна реализовываться через выдуманные model ids.

## Runtime direction

Runtime вводится после стабилизации нескольких TaskContracts.

Он должен отвечать за:

```text
task requirements
    ↓
provider/model resolution
    ↓
execution
    ↓
retry/fallback
    ↓
usage/budget/latency tracking
```

Existing `src/core/llm.js` должен учитываться как текущий runtime/provider owner. Не создавать параллельный provider stack без отдельного ownership решения.

## Model/provider strategy

Канонический task остается provider-neutral.

Provider-specific override допускается только если eval показывает измеримую необходимость.

Не создавать заранее:

```text
headline-openai
headline-deepseek
headline-gemini
```

Возможная адаптация должна быть минимальной и runtime-owned.

## Debug / inspect

Нужен developer-visible способ посмотреть конечный CompiledTask.

Целевой интерфейс:

```js
task.inspect(id, context)
```

Он должен показывать:

- task id;
- contract revision;
- input representation;
- references/specs;
- compiled instructions;
- context;
- output contract;
- capabilities;
- tier;
- sizes/hashes when relevant.

Это особенно важно для manual testing и prompt debugging.

## Scope control

Не делать без реального основания:

- prompt CMS/database;
- remote prompt registry;
- universal prompt DSL;
- graph/orchestration framework;
- full provider-specific prompt forks;
- generalized taxonomy infrastructure;
- complex inheritance/composition;
- new provider stack parallel to `src/core/llm.js`;
- `src/ai/` только ради красивой структуры;
- silent semantic auto-apply;
- architecture optimized only for token savings.

## Decision policy

Стратегические изменения сначала фиксируются здесь.

Если отдельное решение стабилизировалось и имеет долгосрочные последствия для ownership/contracts/runtime, его можно вынести в `docs/decisions/AD-xxx-*.md`.

