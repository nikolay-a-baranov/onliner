# Structure

## Source layers

### `src/*.js`

Публичные executable bookmarklet entries.

Это файлы, которые могут быть указаны в `bookmarklets.json` как source и собраны в `dist`.

Примеры:

- `src/launcher.js`
- `src/author.js`
- `src/editor.js`
- `src/embed.js`
- `src/save.js`
- `src/publish.js`
- `src/reader.js`

### `src/runtime/*.js`

Launcher-first runtime layer.

Отвечает за:

- context detection
- scenario resolution
- run/load flow

Не должен:

- содержать tool-specific DOM logic
- содержать бизнес-логику конкретных bookmarklets
- импортировать `src/launcher.js` или другие entry-файлы

### `src/core/*.js`

Shared primitives, adapters and reusable domain helpers.

Примеры:

- `src/core/cms.js`
- `src/core/toolbar.js`
- `src/core/panel.js`
- `src/core/embed.js`
- `src/core/transform.js`
- `src/core/hotkeys.js`

Core не должен зависеть от entry, runtime или build.

### `src/pipe/*.js`

Sequential content transformation pipelines.

`pipe` может импортировать `core`.

`pipe` не должен импортировать executable entries вроде `src/embed.js`.

### `src/madtest/*.js`

Isolated Madtest feature area.

Оставляем как отдельную feature-папку и не переносим в `src/features` сейчас.

## Build/deploy/site layers

### `tools/*.js`

Build/check/deploy Node scripts.

`tools/build.js` оставляем на месте.

### `scripts/*.mjs`

Repo utilities, snapshots, diagnostics, one-off scripts.

### `bookmarklets.json`

Design/config source of truth для:

- bookmarklet catalog
- source paths
- scope
- launcher scenarios
- index order

Не переносить DOM probing, context detection и rendering logic в JSON.

### `template.html`

Source template for generated public index.

### `app.js` и `styles.css`

Текущие root-level site assets для generated vitrine.

Сейчас не переносим их в `site/`.

### `index.html`

Generated public artifact.

Не редактировать вручную.

### `dist/*`

Generated/published bookmarklet artifacts.

## Dependency direction

Разрешённые направления:

- `entry -> runtime/core/pipe`
- `runtime -> core/config data`
- `pipe -> core`
- `tools/scripts -> files/config`
- `build -> src files as source text`

Запрещённые или подозрительные направления:

- `core -> entry`
- `core -> runtime`
- `pipe -> entry`
- `runtime -> entry`, кроме явного loader/source metadata flow, если он уже существует
- `tools/scripts -> browser runtime execution`
- `generated files -> source logic`

## Current decisions

- Не добавляем `src/tools/` сейчас, потому что `src/*.js` уже является bookmarklet entry/tool layer.
- Не добавляем `checks/` или `procedures/` сейчас.
- Не переносим `src/madtest/`.
- Не переносим `tools/build.js`.
- Не переносим `app.js`, `styles.css`, `template.html` сейчас.
- Legacy tools остаются частью generated `index.html`, а не отдельной legacy page.
- Новые runtime-файлы класть в `src/runtime/`.
- Новые shared helpers класть в `src/core/` только если они реально переиспользуются.
- Новые content transforms класть в `src/pipe/`.
- Новые bookmarklet entries класть в `src/*.js` и регистрировать через `bookmarklets.json`.

## When to revisit

- Если появятся несколько независимых feature areas, можно обсудить `src/features/`.
- Если витрина станет отдельным сайтом, можно обсудить `site/`.
- Если появятся повторяемые multi-step flows, можно обсудить `procedures/`.
- Если checks станут автоматическим preflight, можно обсудить `checks/`.
