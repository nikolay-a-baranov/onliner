# Onliner Toolbar

Набор bookmarklet-инструментов и вспомогательной инфраструктуры для редакционных
процессов Onliner.

Проект собирает рабочую панель команд, инструменты для админки WordPress,
reader-режим, редакционные проверки, генерацию служебных полей, работу с медиа,
cleanup HTML и отдельные сервисные сценарии.

## Что делает проект

- Собирает текущую страницу инструментов `index.html` и legacy-страницу
  `legacy.html`.
- Генерирует bookmarklet/loaders в `dist/`.
- Даёт launchpad-панель с командами, группами, roadmap и role-aware режимами.
- Поддерживает reader-режим с отдельным HUD и reader-командами.
- Выполняет редакционные actions: cleanup, audit, titles, excerpt, slug,
  media, publish/submit параметры и другие рабочие сценарии.
- Содержит shared UI/surface систему для панелей, тулбаров, хоткеев, glyph/icon
  rendering и layout-поведения.
- Поддерживает диагностические команды для ограниченного круга пользователей.

## Быстрый старт

```powershell
npm.cmd install
npm.cmd run dev
```

Локальная витрина:

```text
https://desktop-ih35ogb.local:5173/
```

Ручная сборка:

```powershell
node tools/build.js
```

## Основная структура

- `src/` — исходники активных bookmarklet-инструментов.
- `src/actions.js` и `src/actions/*` — registry и реализация команд.
- `src/runtime/*` — context, scenarios, commands, groups и runtime metadata.
- `src/runtime/launchpad/*` — launchpad-specific runtime helpers.
- `src/core/*` — общие CMS/DOM/transform/widget/service helpers.
- `src/core/surface/*` — shared UI, toolbar, panel, design, icon и hotkey
  инфраструктура.
- `src/pipe/*` — reusable text/content pipelines.
- `tools/` — сборка, storefront generation и служебные scripts.
- `dist/`, `index.html`, `legacy.html` — generated output.

## Source of Truth

Поведение меняется в `src/` и `tools/`.

Установленный Launchpad bookmarklet содержит короткий loader и при каждом
запуске загружает `dist/launchpad.js` с GitHub Pages. Основной bundle содержит
embedded runtime/actions, а отдельные tools, loaders и legacy entries остаются
самостоятельными generated-файлами в `dist/`.

Generated files не редактируются вручную:

- `dist/`
- `dist/loaders/`
- `dist/manifest.json`
- `index.html`
- `legacy.html`

После изменений production JS запускай:

```powershell
node tools/build.js
```

## Хоткеи

Хоткеи считаются альтернативным способом вызвать ту же команду, что клик или
тап по кнопке. Если команда отрисована в панели, hotkey должен идти через тот же
button/action path. Прямой запуск action из hotkey допускается только как
fallback для команды без видимой кнопки.

Command hotkey metadata живёт в `src/runtime/commands.js`.

Основные runtime-сочетания:

- `Alt+0` — roadmap, где применимо.
- `Alt+1..9` — текущий порядок видимых групп, roadmap или команд внутри
  раскрытой группы.
- <code>Alt+`</code> — переключение режима launchpad.
- <code>Alt+\</code> — переключение темы launchpad.

## Диагностика

Команда `diagnostics` подключается через обычный runtime/action flow.

Source of truth:

- `src/core/diagnostics.js` — включение, script id, developer users и targets.
- `src/runtime/scenarios.js` — подключение команды к resolved groups.
- `src/actions/diagnostics.js` и `src/actions/diagnostics/*` — выполнение.

Dev-доступ к диагностике проверяется по `realUser`. Точечный доступ можно
включать отдельно через users, user ids или roles в diagnostics config.

Ignored `qa/diagnostics/*` может оставаться локальным reference material, но
production imports не должны зависеть от `qa/`.

## Документация

- `docs/project.md` — карта проекта и куда смотреть при изменениях.
- `docs/architecture.md` — ownership rules и архитектурные границы.
- `docs/structure.md` — текущая структура source layers.
- `docs/README_DEV.md` — локальный dev-flow.
- `docs/JAVASCRIPT.md` — правила JavaScript-кода и безопасного редактирования.
- `docs/decisions/` — зафиксированные архитектурные решения.
- `docs/debt/` — известный technical debt.

## Правила разработки

- Не переписывай generated output вручную.
- Не дублируй command metadata в feature files, если оно уже есть в runtime.
- Для UI-панелей используй shared surface/toolbar primitives.
- Для JS-правок соблюдай `docs/JAVASCRIPT.md`.
- Для production JS после правок запускай `node tools/build.js`.
