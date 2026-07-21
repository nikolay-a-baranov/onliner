# Structure

Этот документ описывает текущую рабочую структуру проекта и направление, в котором ее стоит удерживать. Это не обещание "идеальной архитектуры", а практическая карта ownership для безопасных изменений и постепенной нормализации.

## Source layers

### `src/*.js`

Активные browser/bookmarklet entrypoints.

Это исполняемые точки входа, которые могут ссылаться из `tools/current/tools.json` или `tools/legacy/tools.json` и собираться в `dist/`.

Текущие активные entry areas:

- launchpad runtime entry: `src/launchpad.js`
- reader entry: `src/reader.js`
- crawler report entry: `src/report.js`
- transitional legacy-built entries: `src/legacy/editor.js`, `src/legacy/author.js`, `src/legacy/readmore.js`

Rules:

- entrypoints могут зависеть от `src/runtime/*.js`, `src/core/*.js` и `src/pipe/*.js`
- entrypoints владеют feature startup, mount/unmount и feature-local side effects
- entrypoints не должны становиться source of truth для shared command metadata

### `src/runtime/*.js`

Runtime metadata and resolution layer.

Current responsibilities:

- page/context detection
- scenario matching and resolution
- command and group metadata
- tool loading and runtime run flow

Current files:

- `src/runtime/context.js`
- `src/runtime/scenarios.js`
- `src/runtime/commands.js`
- `src/runtime/groups.js`
- `src/runtime/launchpad/*`: launchpad-only runtime helpers, которые еще не являются generic `core`-примитивами и не относятся к entrypoint orchestration

Rules:

- runtime владеет metadata и resolution logic
- runtime не должен зависеть от feature entries из `src/*.js`
- runtime не должен владеть feature-specific DOM flows
- runtime должен описывать commands/groups/scenarios, а не исполнять feature behavior напрямую
- runtime subfolders допустимы, когда они сохраняют цельную runtime boundary, а не создают второй generic helper layer

Known debt:

- ownership launchpad command metadata сейчас разделен между runtime files, `src/launchpad.js` и `src/actions.js`
- этот split нужно устранять до широких command-system refactors
- текущая фиксация решения и migration order живет в `docs/decisions/AD-001-command-metadata.md`

### `src/core/*.js`

Shared core layer.

Current responsibilities:

- shared UI and panel primitives
- shared toolbar behavior and persistence
- shared CMS/editor/DOM adapters
- shared icons, design tokens, CSS generators
- shared transform helpers

Current file groups:

- surface system:
  - `src/core/surface/panel.js`
  - `src/core/surface/toolbar.js`
  - `src/core/surface/ui.js`
  - `src/core/surface/css.js`
  - `src/core/surface/design.js`
  - `src/core/surface/icon.js`
  - `src/core/surface/ux.js`
- CMS/editor/browser adapters:
  - `src/core/cms.js`
  - `src/core/dom.js`
- low-level text/content helpers:
  - `src/core/transform.js`
  - `src/core/escape.js`
  - `src/core/block.js`
  - `src/core/widget.js`
  - `src/core/sanitizer.js`
  - `src/core/madtest.js`
- specialized shared service:
  - `src/core/crawler.js`

Current folder candidate:

- `src/core/surface/`
  Пока это единственная `core`-подпапка, которая уже выглядит как реальная общая подсистема.
  Candidate contents:
  - `surface/panel.js`
  - `surface/toolbar.js`
  - `surface/ui.js`
  - `surface/ux.js`
  - `surface/css.js`
  - `surface/design.js`
  - `surface/icon.js`
  Why this one:
  - эти файлы уже образуют один shared surface subsystem
  - они переиспользуются вместе в launchpad, reader, editor, audit и admin panels
  - они лучше соответствуют headless/UI split, чем остальная часть `core`
  Why not more:
  - `cms.js` и `dom.js` связаны, но пока не образуют достаточно чистую standalone subsystem boundary
  - `transform.js`, `escape.js`, `block.js`, `widget.js` и `sanitizer.js` это low-level helpers с пока еще неровной общей границей
  - `madtest.js` и `crawler.js` слишком малы и слишком специализированы, чтобы ради них создавать папку

Rules:

- core владеет shared UI/adapters/helpers
- core не должен зависеть от feature entries
- core не должен становиться второй runtime metadata layer
- новые subfolders в `core` стоит создавать только для стабильных shared subsystems, а не как staging area для feature code

UI naming note:

- `src/core/surface/panel.js` владеет outer panel container primitive
- `src/core/surface/toolbar.js` владеет toolbar behavior/controllers/flows внутри panel
- `src/core/surface/ui.js` владеет headless markup primitives вроде `ui.shell.frame`, `ui.shell.group` и `ui.shell.stack`
- `rail` и `stack` это toolbar flow names, а не отдельные top-level feature types

Naming and placement notes:

- `src/core/surface/ux.js` сейчас это маленький surface-behavior helper, а не широкий product-wide UX layer
- `src/core/widget.js` сейчас это shared widget format/codec helper для cleanup, reader, diff и смежных content flows; держать его в `core` нормально, пока не появится реальный small domain/formats cluster
- не нужно создавать `src/core/ui/`, `src/core/editor/` и подобные подпапки, пока нет стабильной общей подсистемы, которую стоит переносить целиком
- если у `core` появится следующая крупная папка, она должна появляться как явная subsystem migration, а не как пофайловое дробление

### `src/actions.js` and `src/actions/*.js`

Action registry and action modules.

`src/actions.js` нужно рассматривать как composition root и registry layer для action execution, а не как дом для крупных feature implementations.

Current responsibilities:

- action execution by id
- active-state checks для executable actions
- создание bounded feature owners
- связь action ids с handlers
- тонкий dispatch/runtime bridge

Current structure:

- `src/actions.js`: central action registry and dispatch
- `src/actions/*.js`: grouped action implementations

Ownership rules:

- actions исполняют behavior по id
- actions не должны владеть command presentation metadata или scenario ownership
- action modules могут использовать shared `core` и `pipe` helpers
- большие feature bodies не должны оставаться в `src/actions.js`, если у них уже есть ясный owner
- не нужно расширять публичный `api`, если это не является отдельным намерением

Current project direction:

- `src/actions.js` должен оставаться тонким
- `src/actions/*` должны владеть user-invoked workflows и bounded feature areas
- extraction из `src/actions.js` нужно делать по domain ownership, а не по размеру объекта

#### `src/actions/admin.js`

Сейчас это admin composition root и transitional owner части post-edit логики.

Его нормальная роль:

- собрать admin-related surface
- attach-ить bounded owner modules
- держать startup hooks и wiring
- экспортировать admin action surface наружу
- оставаться cross-admin action hub там, где это действительно нужно

Что важно:

- большой размер `admin.js` сам по себе не причина механически дробить его по именам объектов
- remaining post-edit logic внутри него сейчас является transition state, а не разрешением складывать туда новый несвязанный код
- future cleanup должен идти через audit natural owner, а не через косметическое file sharding

#### `src/actions/admin/post.js`

Это текущая post-edit workflow boundary.

Уже сейчас этот модуль владеет:

- dump behavior
- draft import / restore / apply behavior
- post-new / post routing around draft lifecycle

Это значит, что `admin/post.js` уже является natural owner для post-edit concerns.

Если позже будут двигаться `tags`, `submit`, `slug`, `title`, `excerpt`, draft-adjacent validation или save/publish behavior, их нужно оценивать как части post-edit boundary, а не как независимые sibling modules вроде `admin/tags.js` или `admin/submit.js`.

Nested `src/actions/admin/post/` subtree допустим только позже, если:

- owner file реально станет слишком большим
- внутренняя post-edit boundary уже стабилизирована
- перенос будет driven by domain, а не driven by object names

#### `src/actions/admin/revision.js`

Владелец revision/diff behavior.

Это уже отдельная bounded feature area. Ее не нужно смешивать с post-edit логикой только ради выравнивания размеров файлов.

#### `src/actions/tools/crawler.js`

Владелец crawler/report/worker orchestration.

Сюда входят:

- crawler/report flows
- opener/worker contracts
- message-based orchestration

Этот boundary behavior-sensitive. Его не нужно casually переносить или дробить без отдельного аудита.

Excerpt ownership note:

- active excerpt execution принадлежит `src/actions/admin.js`
- active excerpt derivation/state тоже сейчас принадлежит `src/actions/admin.js`
- не нужно повторно вводить параллельную active `fields.js` excerpt implementation

Known debt:

- current registry все еще работает как shared mutable service hub
- эту границу нужно документировать и сохранять при targeted patches, а не расширять без необходимости
- не нужно добавлять новые non-shared feature folders под `src/core/`
- когда feature area уже имеет owner boundary, переносить ее нужно туда явно, а не дробить ad hoc по файлам

### `src/pipe/*.js`

Reusable text/content transform pipelines.

Current responsibilities:

- text normalization
- markup normalization and reconciliation
- content cleanup and formatting
- credit and related content transforms

Current active transform files include:

- `src/pipe/text.js`
- `src/pipe/content.js`
- `src/pipe/markup.js`

Rules:

- `pipe` может зависеть от `core`
- `pipe` должен оставаться mostly pure
- `pipe` не должен импортировать feature entries из `src/*.js`
- shared embed parsing/template/normalization belongs in `src/pipe/markup.js`

### Madtest placement

Current active placement:

- `src/actions/madtest.js`: active Madtest actions and surface behavior
- `src/core/madtest.js`: shared Madtest helpers

Rules:

- не держать Madtest feature logic в top-level `src/*.js`
- feature behavior должно жить в action layer, а shared helper logic в `src/core/madtest.js`
- не нужно заново создавать отдельную `src/madtest/` folder, пока не появился реальный subsystem boundary

### `src/legacy/*.js`

Historical archive and compatibility boundary.

Rules:

- `src/legacy/` по умолчанию не является active runtime code
- active source code не должен импортировать из `src/legacy/`
- дублирование между `src/legacy/` и active code само по себе не является причиной изменений
- compatibility paths, которые еще касаются legacy-era state, должны быть явно ограничены и задокументированы

Known debt:

- если build logic все еще падает обратно в `src/legacy/`, это technical debt, а не preferred source model
- legacy-only helpers вроде `src/legacy/more.js` должны оставаться здесь, а не утекать в `src/core/`
- `src/legacy/external/*.js` это явное исключение: archived external bookmarklets все еще собираются для legacy storefront, но не должны определять active architecture
- `src/legacy/editor.js`, `src/legacy/author.js` и `src/legacy/readmore.js` это тоже явные исключения: launchpad пока еще может собирать их как transitional tools, но они не должны управлять новыми top-level layout decisions

### `src/report.js`

Active service entry for report crawling/export.

Current responsibilities:

- thin standalone entry для crawler report execution

Rules:

- `src/report.js` должен оставаться тонким
- report-specific logic должна жить в owner boundary, а не разрастаться здесь
- shared fetch/crawl mechanics могут оставаться в `src/core/crawler.js`
- report-only composition helpers не нужно повторно заносить в `src/core/`

## Build and site layers

### `tools/*.js`

Node-side build, check and utility scripts.

Current examples:

- `tools/build.js`
- `tools/check.js`
- `tools/secrets.js`

Rules:

- tools могут читать repo files
- tools могут писать generated outputs
- tools не должны становиться browser-runtime source of truth

### `tools/current/tools.json`

Active launchpad/dist tool registry.

Current responsibilities:

- active tool ids
- source file paths
- launchpad/build icons
- active build scopes

Rules:

- это active build source of truth для current tool outputs в `dist/*.js`, `dist/loaders/*`, `dist/manifest.json` и launchpad tool injection
- runtime detection, DOM probing и UI rendering logic не должны жить в JSON

### `tools/legacy/tools.json`

Legacy-only tool registry for archived standalone bookmarklets.

Current responsibilities:

- legacy-only tool ids
- source file paths для archived bookmarklets
- icons/scopes, нужные legacy storefront build

Rules:

- legacy-only bookmarklet definitions должны жить здесь, а не в current tool registry
- этот файл все еще может участвовать в сборке `dist/*.js` и `dist/loaders/*`, пока legacy storefront остается поддерживаемым

### `tools/legacy/storefront/storefront.json`

Root storefront/vitrine metadata.

Current responsibilities:

- storefront scope labels/icons/visibility
- storefront index order

Rules:

- storefront metadata не должна управлять launchpad runtime behavior
- launchpad scenarios живут в `src/runtime/scenarios.js`, а не в storefront data

### `tools/legacy/storefront/template.html`

Legacy storefront template source, используемый только opt-in storefront build.

### `tools/legacy/storefront/app.js`, `tools/legacy/storefront/styles.css`

Current source assets:

- legacy storefront browser behavior
- legacy storefront styling

Эти файлы описывают browser behavior и styles только для opt-in legacy storefront build.

## Documentation and task artifacts

### `docs/`

Документация о правилах, структуре, решениях и процессе.

Здесь должны жить:

- project standards
- architecture notes
- decisions
- workflow docs

### `.chatgpt/`

Рабочие task prompts и implementation reports для агентных проходов.

Это полезный audit trail по recent inspections и targeted patches, но не runtime source layer и не источник архитектурных решений сам по себе.

## Generated outputs

Generated artifacts:

- `index.html`
- `legacy.html`
- `dist/`
- `dist/loaders/`
- `dist/manifest.json`

Rules:

- generated files не владеют source logic
- generated output не нужно считать source of truth для архитектуры
- структурные проблемы нужно исправлять в source layer и затем пересобирать outputs

## Dependency direction

Allowed directions:

- `entry -> runtime/core/pipe`
- `runtime -> core`
- `actions -> core/pipe`
- `pipe -> core`
- `tools -> repo files and generated outputs`

Disallowed or suspicious directions:

- `core -> entry`
- `runtime -> entry`
- `pipe -> entry`
- `active source -> legacy`
- `generated output -> source ownership`

## Current structure notes

- текущая folder layout в целом уже достаточно coherent и не оправдывает broad reshuffle
- основной structural debt сейчас это source-of-truth drift вокруг launchpad command metadata и transitional ownership внутри admin actions, а не просто naming проблемы
- targeted ownership fixes внутри текущих layers полезнее, чем обсуждение новых top-level folders

## Transitional state and cleanup rules

Часть post-edit поведения все еще живет в `src/actions/admin.js`. Это ожидаемо, потому что перенос здесь behavior-sensitive.

Особенно осторожно нужно относиться к зонам, где легко сломать:

- startup hooks
- submit guards
- field writes
- TinyMCE/content sync
- history/edit flows
- crawler/worker/message contracts

Это intentional gradual normalization, а не разрешение продолжать складывать в `admin.js` любой новый несвязанный code.

Incremental cleanup rules:

- предпочитать domain ownership, а не sharding по именам объектов
- не создавать новый файл только потому, что локальный object большой
- не переносить code across boundaries без проверки startup hooks, public action IDs, side effects и manual smoke tests
- держать action IDs стабильными
- не расширять публичный `api` без отдельного явного намерения
- не делать broad folder renames ради косметики
- не трогать crawler/worker/message contracts без отдельного аудита

Дополнительное правило для admin cleanup:

- `tags`, `submit`, `slug`, `title`, `excerpt` и publish/save validation относятся к post-edit context
- если они будут двигаться, их owner должен определяться по post boundary, а не по имени локального объекта
- `revision` и `crawler/report` уже имеют отдельные owner boundaries и не должны втягиваться в post-edit cleanup

## Target normalization path

Целевое направление нужно нормализовать по layer и domain ownership, а не по file size.

### Stable target layers

- `src/*.js`
  Thin active entrypoints and feature bootstraps.
- `src/runtime/`
  Runtime policy, context, scenario resolution и feature-runtime helpers.
- `src/core/`
  Shared primitives и shared UI/system infrastructure only.
- `src/actions/*`
  Bounded feature owners и user-invoked workflows.
- `src/pipe/`
  Mostly pure transforms и normalization pipelines.
- `src/legacy/`
  Archive/reference and compatibility boundary.

### Structural direction for actions/admin

- `src/actions.js` должен оставаться thin registry/composition layer
- `src/actions/admin.js` должен оставаться admin composition root и transitional owner до тех пор, пока sensitive post-edit logic не будет перенесена безопасно
- `src/actions/admin/post.js` уже сейчас является natural post-edit owner boundary
- nested `src/actions/admin/post/` subtree можно рассматривать только после стабилизации внутренней post-edit boundary

### Folder creation rule

- добавлять subfolder только когда он отражает реальную layer или subsystem boundary
- не создавать one-file folders
- не создавать новую folder только чтобы уменьшить большой файл
- prefer one coherent subtree вроде `src/runtime/launchpad/`, а не рассеивание feature helpers по `core`

### Migration order

1. Уточнить ownership в docs.
2. Перестать добавлять новый code в неправильный layer.
3. Аудировать cohesive behavior и находить его natural owner.
4. Переносить bounded subsystems в правильный layer только когда seam уже понятен.
5. Двигать исторически misplaced pieces только как explicit migrations.

### Current migration decisions

- launchpad-specific placement/runtime helpers могут жить под `src/runtime/launchpad/`
- launchpad entry orchestration живет в `src/launchpad.js`
- `src/actions/*` это active action layer
- `src/pipe/markup.js` это canonical shared owner для embed normalization
- `src/report.js` остается thin standalone report entry
- `src/legacy/more.js` это legacy-only helper и его не нужно возвращать в `src/core/`

## When to revisit

- если появятся несколько новых независимых feature areas, можно пересмотреть feature-area convention
- если external bookmarklets начнут делить реальную инфраструктуру, можно пересмотреть их placement
- если launchpad/runtime metadata ownership будет объединен, этот документ нужно обновить и явно зафиксировать canonical owner
