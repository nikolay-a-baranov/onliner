# Dev-flow для onliner

Короткая шпаргалка, чтобы не вспоминать заново, как запускать локальную разработку букмарклетов на компьютере, iPad и iPhone.

## Что настроено

Локальная разработка теперь работает через один HTTPS-адрес:

```text
https://desktop-ih35ogb.local:5173/
```

Этот адрес открывается с компьютера, iPad и iPhone в одной локальной сети.

Настроено:

```text
npm.cmd run dev
```

Эта команда одновременно:

- следит за изменениями файлов;
- пересобирает проект после сохранения;
- раздаёт проект локально по HTTPS;
- отключает cache dev-сервера.

## Обычный запуск

В начале работы открыть VSCode в корне проекта и запустить:

```powershell
npm.cmd run dev
```

После запуска открыть витрину:

```text
https://desktop-ih35ogb.local:5173/
```

На iPad и iPhone открывать тот же адрес.

## Обычное завершение

В терминале, где запущен dev-сервер:

```text
Ctrl+C
```

## Как работает обновление

Флоу такой:

```text
1. Правишь файл в VSCode
2. Auto Save сохраняет файл
3. watcher видит изменение
4. build запускается сам
5. обновляешь страницу или заново запускаешь букмарклет
```

Auto Save должен быть включён:

```text
Files: Auto Save = afterDelay
Files: Auto Save Delay = 1000
```

## Режимы на витрине

На карточке Launchpad есть переключатель режимов.

Режимы:

```text
GIT / GH   → GitHub Pages
LOC        → локальный HTTPS dev-server
JAV        → inline javascript
```

На GitHub Pages локальные режимы не должны быть доступны для обычного использования. Локальная разработка идёт через `desktop-ih35ogb.local`.

## Локальный bookmarklet

Для разработки нужен локальный режим.

Локальный bookmarklet должен грузить скрипт с текущего local origin:

```text
https://desktop-ih35ogb.local:5173/dist/launchpad.js
```

Если витрина открыта локально, local base берётся из `location.origin`, поэтому старый сохранённый IP не должен перебивать текущий адрес.

## Если iPad показывает старое

Проверить прямой файл:

```text
https://desktop-ih35ogb.local:5173/tools/storefront/current/app.js
```

Если там старый адрес или старое поведение:

1. закрыть вкладку;
2. открыть заново;
3. при необходимости открыть витрину с явным base:

```text
https://desktop-ih35ogb.local:5173/?local-base=https://desktop-ih35ogb.local:5173
```

Но после последней правки это обычно не должно быть нужно.

## HTTPS и сертификаты

Сертификат для локального HTTPS лежит в `.certs/`:

```text
.certs/ih35ogb.pem
.certs/ih35ogb-key.pem
```

Он выпущен для:

```text
desktop-ih35ogb.local
localhost
127.0.0.1
```

Root CA от mkcert установлен на компьютере и добавлен на iPad/iPhone. Поэтому Safari должен открывать локальный HTTPS без предупреждений.

Если сертификаты сломаются или hostname поменяется, надо перевыпустить сертификат через `mkcert`.

## Что коммитить

Можно коммитить:

```text
package.json
package-lock.json
tools/build.js
tools/storefront/current/app.js
```

Не коммитить:

```text
node_modules/
.certs/
secret.local.json
```

Они уже должны быть в `.gitignore`.

## Build and Pages delivery

The repository and the GitHub Pages artifact are different concerns.

The repository keeps the full development context:

```text
src/
tools/
docs/
.github/
server.js
package.json
```

The installed Launchpad bookmarklet stores only a small loader. On every run it
requests:

```text
/dist/launchpad.js
```

The build creates:

- `dist/launchpad.js` with embedded runtime and action modules
- separate `dist/<tool>.js` files for standalone or dynamically loaded tools
- `dist/loaders/*` for separately installed current bookmarklets
- `dist/legacy/*` and `dist/legacy/loaders/*` for legacy bookmarklets
- current and legacy manifests
- generated `index.html` and `legacy.html`

The current Pages workflow uploads the repository root after the build. This is
operationally simple, but broader than the runtime artifact actually requires.

Do not narrow the Pages artifact by maintaining an independent handwritten
allowlist in the workflow. The preferred future boundary is a build-owned
publish directory created by `tools/build.js`; the workflow should only upload
that directory.

Until that migration is implemented and verified, preserve these public paths:

```text
/dist/launchpad.js
/dist/manifest.json
/dist/*.js
/dist/loaders/*
/dist/legacy/*
/dist/legacy/loaders/*
```

Also preserve the generated storefront pages and their linked CSS, JS, font, and
favicon assets.

## Runtime diagnostics command

The `diagnostics` command is a tracked runtime/action feature, not a local
`qa/` dependency.

Source of truth:

```text
src/core/diagnostics.js
src/runtime/scenarios.js
src/actions/diagnostics.js
src/actions/diagnostics/
```

Access model:

- developer access is attached to the `service` group by `realUser`
- targeted access is attached to the `feedback` group by configured users,
  user ids, or roles
- `qa/diagnostics/*` may exist as local reference material, but production
  imports must not depend on ignored `qa/` files

When changing diagnostics visibility or script selection, update
`src/core/diagnostics.js`, then run:

```powershell
node tools/build.js
```

## Runtime hotkeys

Hotkeys are alternate input for visible toolbar controls.

Rules:

- command hotkey metadata lives in `src/runtime/commands.js`
- launchpad and reader should route hotkeys through the same button click/action
  path used by mouse and touch input
- direct `actions.run(...)` from hotkey handlers is fallback-only for commands
  without a rendered button
- `Alt+0` opens roadmap where applicable
- `Alt+1..9` follows the current visible launchpad/reader group or roadmap
  ordering
- <code>Alt+`</code> cycles launchpad mode
- <code>Alt+\</code> toggles launchpad theme

## Быстрая диагностика

Проверить scripts:

```powershell
node -e "const p=require('./package.json'); console.log(p.scripts)"
```

Ожидаемо важное:

```text
dev: npm-run-all --parallel watch serve:https
serve:https: http-server . -a 0.0.0.0 -p 5173 -c-1 -S -C .certs/ih35ogb.pem -K .certs/ih35ogb-key.pem
```

Проверить JS-синтаксис после ручных правок:

```powershell
node --check tools/build.js
node --check tools/storefront/current/app.js
```

## Коротко

Запомнить надо только это:

```powershell
npm.cmd run dev
```

И открыть:

```text
https://desktop-ih35ogb.local:5173/
```

Дальше правки сохраняются автоматически, build запускается сам, а локальный bookmarklet грузится с локального HTTPS.
