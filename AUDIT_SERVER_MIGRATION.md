# Аудит проекта перед переносом на Debian-сервер

Дата аудита: 21 октября 2026 года  
Репозиторий: `onliner`  
Проверенная ветка и состояние Git: `main`, `HEAD ecadad5`, локальный `origin/main` указывает на тот же commit  
Целевая платформа: Fujitsu FUTRO S920 под Debian Linux, разработка через VS Code Remote SSH, локальный Codex CLI и Codex Cloud

## Резюме

Проект в целом пригоден для разработки на Debian без архитектурного переноса. Основная часть — статические bookmarklet-инструменты, которые собираются собственным Node.js-скриптом и публикуются через GitHub Actions в GitHub Pages. React, Vue, Vite, TypeScript, база данных и постоянный application server для основного продукта не используются.

Рекомендуемый вариант для S920: **нативная Debian-среда без Docker**, с зафиксированным Node.js 24, `npm ci`, VS Code Remote SSH и репозиторными зависимостями в `node_modules/`. Docker и Dev Containers для текущего проекта добавят заметную нагрузку и сложность, не устраняя главные локальные особенности: сертификаты, hostname, доступ мобильных браузеров и Windows-only maintenance scripts.

До переноса желательно отдельно спроектировать, но пока не применять:

1. фиксацию версии Node.js в репозитории (`engines` и/или `.nvmrc`/`.node-version`);
2. Debian-вариант локального HTTPS и стабильного hostname;
3. замену либо явное исключение Windows-only VS Code tasks и архиватора;
4. безопасное хранение секретов и добавление `.env*` в `.gitignore`;
5. резервное копирование локальных игнорируемых данных, не восстанавливаемых из Git;
6. отдельный способ эксплуатации `server.js`, если feedback-сервис действительно должен работать на S920.

Миграция в ходе аудита не выполнялась. Сборка, тесты, установка зависимостей и команды, меняющие generated output, не запускались.

## 1. Краткий технический паспорт проекта

### Назначение

Репозиторий содержит bookmarklet-панель и отдельные инструменты для редакционных процессов Onliner: работу с WordPress/admin pages, reader-режим, очистку и проверку HTML, генерацию редакционных полей, обработку медиа, диагностику и служебные сценарии.

Основной пользовательский путь:

```text
src/ и editorial/
        ↓
tools/build.js
        ↓
dist/*.js + dist/loaders/* + dist/manifest.json
        ↓
сгенерированный index.html
        ↓
GitHub Pages
```

Подтверждение: `README.md`, `docs/project.md`, `tools/build.js`, `tools/tools.json`.

### Стек

- JavaScript: CommonJS в Node-инструментах и модульный browser JavaScript в исходниках.
- Node.js и npm: сборка, проверки, watcher, статический dev-server и eval tooling.
- Собственный bundler/build pipeline: `tools/build.js`; Vite/Webpack/Rollup/esbuild не используются.
- Статическая витрина: HTML/CSS/JavaScript из `tools/storefront/`.
- GitHub Actions и GitHub Pages: CI, build и публикация.
- PowerShell: только локальное архивирование, вспомогательные Windows-сценарии и VS Code tasks.
- Отдельный минимальный Node HTTP service: `server.js`, предназначенный для `/feedback` и отправки сообщений в Telegram.

В проекте **нет** React, Vue, Vite, TypeScript, Docker, Compose, Dev Container, browser-test framework, ORM или базы данных. Основной GitHub Pages artifact статический. Однако весь репозиторий нельзя назвать полностью статическим из-за отдельного `server.js`.

### Основные каталоги и файлы

| Путь | Назначение |
| --- | --- |
| `src/` | Активные bookmarklet entrypoints, actions, runtime metadata, core и pipelines. |
| `src/runtime/` | Контексты, сценарии, команды, группы и launchpad runtime. |
| `src/actions/` | Реализация пользовательских действий. |
| `src/core/` | Общие DOM/CMS/service/UI primitives. |
| `src/core/surface/` | Общая система panel/toolbar/UI/icon. |
| `src/legacy/` | Архивная и явно legacy-собираемая часть. |
| `editorial/` | Редакционные prompt/source материалы, включаемые build pipeline. |
| `tools/` | Сборка, проверки, fixtures, storefront и maintenance scripts. |
| `assets/` | Иконки, изображения, шрифты, видео и звуки. |
| `docs/` | Архитектура, dev workflow, решения, планы и правила. |
| `.github/workflows/build.yml` | Единственный обнаруженный CI/Pages workflow. |
| `package.json` | npm scripts и три devDependencies. |
| `package-lock.json` | npm lockfile v3. |
| `server.js` | Отдельный feedback HTTP service на `127.0.0.1:8787` по умолчанию. |
| `index.html` | Отслеживаемый Git generated storefront. |
| `dist/`, `ledger/` | Игнорируемые generated outputs. |

Подробная карта ownership уже хорошо зафиксирована в `docs/project.md`, `docs/structure.md` и `docs/architecture.md`.

## 2. Структура и зависимости

### Node.js и npm

Факты:

- CI использует Node.js `24`: `.github/workflows/build.yml`.
- На проверенной Windows-машине обнаружены Node.js `v24.15.0` и npm `12.2.0`.
- `package.json` не содержит `engines` и `packageManager`.
- В корне отсутствуют `.nvmrc`, `.node-version` и другие файлы фиксации runtime.
- Менеджер пакетов — npm; присутствует `package-lock.json` формата lockfile v3.
- Чистое восстановление по документации выполняется через `npm ci`: `docs/npm-scripts.md`.

Эффективной эталонной версией следует считать **Node.js 24**, потому что именно она явно используется в CI. Формально минимальная версия репозиторием не объявлена. Для Linux watcher использует `fs.watch(..., { recursive: true })` в `tools/build.js`; поэтому перенос на произвольно старый Node опасен даже при совместимости отдельных npm-пакетов.

### Проектные зависимости

Все объявленные зависимости находятся в `devDependencies`:

- `@fluentui/svg-icons` `1.1.337` — source package для локально vendored Fluent SVG;
- `http-server` `^14.1.1` — статический HTTP/HTTPS dev-server;
- `npm-run-all` `^4.1.5` — параллельный и последовательный запуск npm scripts.

Runtime браузерных bookmarklet bundle не требует установленного `node_modules`: зависимости нужны для разработки, сборки и dev-server. `server.js` использует только встроенные Node modules (`http`, `https`, `fs/promises`, `path`, `crypto`) и не требует npm-пакетов.

### Системные зависимости на Debian

Минимум для рекомендованной среды:

- Debian x86_64;
- Git;
- Node.js 24 и поставляемый с ним npm;
- OpenSSH server для VS Code Remote SSH;
- CA certificates и исходящий HTTPS-доступ к npm registry, GitHub и OpenAI;
- обычные shell/core utilities Debian.

Опционально:

- `mkcert` или другой процесс выдачи локального TLS-сертификата, если мобильные устройства должны обращаться к dev-server напрямую;
- reverse proxy (например, Caddy/Nginx) только если требуется единая TLS-точка и стабильное имя;
- systemd unit и права на `/var/log/onliner-feedback/`, если запускается `server.js`;
- PowerShell 7 лишь для сохранения Windows-oriented maintenance workflow; основной проект его не требует.

Нативные addons и platform-specific npm binaries в прямых зависимостях не обнаружены. Поэтому `npm ci` на Debian должен установить чисто JavaScript dependency tree без компилятора C/C++.

### Windows-специфичные части

1. `tools/archive-monthly.ps1` и `tools/schedule-monthly-archive.ps1` зависят от PowerShell и Windows Task Scheduler.
2. `.vscode/tasks.json` содержит несколько задач с `powershell.exe`, Windows/.NET regex и Windows file operations.
3. `.scripts/codex.ps1` содержит абсолютные пути `C:\Users\KB\...`, работу с Windows clipboard, COM `WScript.Shell` и процессом VS Code.
4. `.scripts/unzip.ps1` также является PowerShell helper.
5. Документация использует Windows-команды `npm.cmd`; на Debian эквивалент — `npm`.
6. Локальный dev hostname `desktop-ih35ogb.local` и сертификаты `.certs/ih35ogb*.pem` привязаны к текущей машине.

Эти части не блокируют Linux build/test/serve, но не перенесутся автоматически. Их следует либо заменить Linux-аналогами, либо документировать как Windows-only.

### Изоляция зависимостей

Внутри проекта должны оставаться:

- `node_modules/`, восстанавливаемый только через `npm ci` и не копируемый с Windows;
- generated `dist/` и `ledger/`, пересобираемые на целевой платформе;
- локальные сертификаты `.certs/`;
- локальные секреты;
- QA captures и рабочие артефакты `.chatgpt/`, `.handoff/`, `.audit/`, `.responses/` согласно политике хранения проекта.

Нельзя переносить Windows `node_modules/` как готовый dependency tree. На сервере нужен свежий `npm ci` из lockfile.

## 3. Текущий workflow разработки

### Установка

Документированный Windows flow:

```text
npm.cmd ci
```

Эквивалент для Debian:

```text
npm ci
```

Источник: `docs/npm-scripts.md`.

### Локальная разработка

`npm run dev` параллельно запускает:

- `watch`: проверка Fluent icons, первичная сборка и recursive file watching;
- `serve:https`: `http-server` на `0.0.0.0:5173`, без cache, с CORS и сертификатами из `.certs/`.

Watcher после каждого изменения перезаписывает generated output. Поэтому это не read-only команда и в ходе аудита она не запускалась.

Текущий адрес: `https://desktop-ih35ogb.local:5173/`. Он не годится для Debian без настройки DNS/mDNS и нового сертификата.

### Сборка

Основной production script:

```text
npm run build
```

Он выполняет `node tools/fluent.js check`, затем `node tools/build.js`. Build обновляет `dist/`, `index.html` и `ledger/index.html`, а также удаляет legacy output при обычной сборке. Legacy build запускается отдельно через `npm run build:legacy`.

Build script использует переносимые Node `fs`, `path` и `crypto`, нормализует path separators при формировании web paths и не вызывает Windows executables. По статическому анализу его обычный build path совместим с Debian.

### Тесты и проверки

`npm test` последовательно запускает:

- `test:build-registry`;
- `test:lead`;
- `test:qa`;
- `test:telemetry-foundations`.

Это Node smoke/fixture checks. Также есть `fluent:check`, build budgets и prompt eval tooling. Browser automation dependencies (Playwright, Puppeteer, Selenium) не обнаружены.

Следствие: браузер нужен для функциональной проверки bookmarklets, WordPress/admin integrations, popup/toolbar UI, Safari/iPad/iPhone и реальных authenticated pages. Эти проверки остаются ручными на клиентских устройствах. На сервере browser не нужен для штатной сборки и текущих автоматических тестов.

### Что выполняется на компьютере разработчика сейчас

- VS Code и редактирование файлов;
- Node watcher/build;
- HTTPS static server на порту `5173`;
- хранение локального CA/сертификатов;
- доступ браузеров Windows/iPad/iPhone к dev-server;
- Windows Task Scheduler для monthly archive;
- Windows PowerShell VS Code tasks и helper scripts;
- локальные Codex/ChatGPT workflow artifacts.

### Что можно перенести на S920

Без существенных изменений:

- Git checkout, редактирование через Remote SSH;
- `npm ci`, build, Node smoke tests и evals;
- watcher;
- HTTP static server;
- Codex CLI;
- хранение рабочих веток/worktrees;
- при отдельной настройке — `server.js`.

Требует проектирования:

- HTTPS hostname и доверие сертификату на мобильных клиентах;
- прямой LAN/VPN-доступ к порту `5173`;
- Windows-only архиватор/tasks;
- резервное копирование локальных ignored artifacts;
- service management, secrets и log rotation для feedback service.

## 4. Git и GitHub Pages

### Состояние Git на момент аудита

- Текущая ветка: `main`.
- Локально видны только `main`, `origin/main` и symbolic `origin/HEAD`.
- Локальный `HEAD` совпадает с локальной remote-tracking ref `origin/main`: `ecadad5`.
- Tags: 0.
- Submodules: отсутствуют.
- Remote использует HTTPS GitHub URL без embedded credentials.
- Отслеживаемых файлов: 691, суммарно около 5.17 MB в проверенном checkout.
- Case-colliding tracked paths не обнаружены.
- Symlinks и executable-bit tracked files не обнаружены.

До аудита уже имелись незакоммиченные изменения:

```text
CHANGELOG.md
assets/sandbox/diagnostics.js
sandbox/index.html
src/launchpad.js
src/runtime/context.js
src/runtime/groups.js
src/runtime/launchpad/feed.js
```

Они не создавались и не изменялись данным аудитом. Наличие незакоммиченного production source — главный операционный риск перед переносом: обычный clone на Debian его не восстановит.

### Неотслеживаемые и ignored локальные данные

Обнаружены по именам, без чтения секретных значений:

- `.certs/` — 4 локальных certificate/key files;
- `secrets.local.json` — локальный secret file;
- `.chatgpt/`, `.handoff/`, `.audit/`, `.responses/` — локальная рабочая история;
- `dist/`, `ledger/`, `node_modules/` — воспроизводимые generated/dependency directories.

`qa/` присутствует, но на момент проверки пуст. Эти данные не войдут в обычный clone. Для `.chatgpt/`, `.handoff/` и `.audit/` уже существует отдельная repository policy в `docs/README_DEV.md` и решение `docs/decisions/AD-006-monthly-workspace-archive.md`.

### Оценка `.gitignore`

Корректно игнорируются `node_modules/`, `dist/`, `build/`, `/ledger/`, `/qa/`, `.eval/`, `secrets.local.json`, `.certs/`, локальные agent/service artifacts и `.vscode/` для новых файлов. Уже отслеживаемые `.vscode/settings.json` и `.vscode/tasks.json` остаются в Git — правило ignore их не удаляет.

Пробелы:

- `.env` и `.env.*` **не игнорируются**;
- нет общей защиты для `*.pem`, `*.key`, credential files вне `.certs/`;
- `server.js` требует environment variables, но безопасный шаблон `.env.example` или deployment contract не найден.

Проверка tracked contents по распространённым сигнатурам private keys, GitHub tokens, OpenAI keys и AWS access keys совпадений не обнаружила. Это не является полноценным secret scan всей истории Git.

### GitHub Actions и Pages

Workflow `.github/workflows/build.yml`:

1. запускается на push в `main`;
2. выполняется на `ubuntu-latest`;
3. устанавливает Node.js 24 с npm cache;
4. выполняет `npm ci`;
5. выполняет `npm test`;
6. выполняет `npm run build`;
7. загружает в Pages artifact весь checkout (`path: .`);
8. деплоит через `actions/deploy-pages`.

Публикация поэтому **не зависит от Windows-сборки разработчика**: production artifact создаётся на Linux runner. Это сильное подтверждение переносимости основной build/test цепочки.

Build base URL жёстко задан как `https://nikolay-a-baranov.github.io/onliner` в `tools/build.js`. Дополнительные hardcoded ссылки есть в `src/reader.js`, `src/runtime/context.js` и `tools/userscript/onliner-worker-bootstrap.user.js`. Project Pages base path `/onliner` должен сохраняться.

Риски Pages:

- workflow публикует корень репозитория, а не минимальный build-owned publish directory;
- `index.html` отслеживается в Git, но одновременно генерируется build script;
- нет `pull_request` trigger, поэтому обязательная CI-проверка видна только после push в `main`;
- изменение owner/repository name или Pages URL сломает hardcoded URLs;
- изменение структуры `/dist/*` сломает уже установленные bookmarklet loaders;
- workflow не публикует legacy output, если он не создан обычной сборкой;
- реальный статус последнего Actions run и настройка Pages source не были подтверждены через административные настройки GitHub.

Публичный GitHub repository и Pages URL существуют, но аудит не менял и не авторизовывался в GitHub settings. Перед миграцией вручную проверить: Settings → Pages → Source = GitHub Actions, успешность последнего `Build & Deploy`, branch protection для `main`, repository secrets/variables и наличие custom domain/CNAME.

## 5. Требования к Debian и VS Code Remote SSH

### Базовая среда

Рекомендуемый baseline:

- Debian stable x86_64 с актуальными security updates;
- отдельный непривилегированный пользователь разработки;
- SSH key authentication, отключённый password/root login после проверки доступа;
- Git и Node.js 24;
- рабочий каталог на SSD, не на штатном малом write-limited thin-client flash;
- минимум 10–20 GB свободного пространства, лучше 40+ GB для Git history, worktrees, caches и архивов;
- swap 2–4 GB как страховка, но не как замена RAM.

### Remote SSH

VS Code Server будет установлен в home удалённого пользователя самим Remote SSH. Extensions, которым нужен доступ к файлам/Node/shell, следует устанавливать на remote side. Локальными остаются UI-only extensions и браузер.

Для витрины есть два режима:

1. **Только ноутбук:** VS Code port forwarding `5173 → localhost:5173`; текущий сертификат заявлен для `localhost`, но на Debian всё равно нужен доступный key/cert pair. Bookmarklet будет загружать bundle через origin forwarded URL.
2. **Ноутбук и мобильные устройства:** сервер слушает LAN/VPN interface, имеет стабильное DNS/mDNS имя и сертификат, которому доверяют iPad/iPhone. Простого SSH port forwarding для телефона недостаточно.

Текущий `http-server -a 0.0.0.0` открывает порт всем доступным interfaces. На сервере это следует ограничить firewall/VPN или reverse proxy; открывать development server в публичный интернет не рекомендуется.

### Feedback service

`server.js`:

- слушает `127.0.0.1` и порт из `PORT` либо `8787`;
- требует `FEEDBACK_SECRET`;
- для Telegram требует `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`;
- CORS allowlist берёт из `FEEDBACK_ORIGIN`;
- пишет JSONL в `/var/log/onliner-feedback/feedback.jsonl`;
- требует исходящий HTTPS к `api.telegram.org`.

Он уже ориентирован на Unix log path, но deployment files отсутствуют: не найдены systemd unit, reverse-proxy config, Dockerfile, Compose, install script или logrotate rule. Запускать этот service в production до отдельного security/deployment review не следует. Особое внимание нужно передаче `X-Feedback-Secret` из browser context: если секрет встроен в публичный client bundle, он не является секретом.

## 6. Совместимость с локальным и облачным Codex

### Codex CLI на Debian

Использование возможно. Официальная документация поддерживает установку Codex CLI на macOS/Linux standalone installer и запуск `codex` непосредственно из каталога проекта. Первый запуск предлагает Sign in with ChatGPT или другой доступный способ авторизации. Источник: [OpenAI Docs — Codex CLI](https://learn.chatgpt.com/docs/codex/cli).

Для этого репозитория Codex CLI получит хороший контекст:

- корневой `AGENTS.md` уже существует и содержит подробные safety/style/workflow правила;
- `docs/JAVASCRIPT.md` является source of truth по JavaScript;
- `README.md`, `docs/project.md`, `docs/architecture.md`, `docs/structure.md` и `docs/npm-scripts.md` описывают проект;
- `TODO.md` выделен как единственный actionable backlog;
- build и test commands определены в `package.json`.

Добавлять второй набор общих Codex-инструкций не требуется. Перед переносом полезно дополнить существующий `AGENTS.md` только Linux-специфичными проверенными фактами после принятия архитектуры: эталонная версия Node, Debian-команды, политика port forwarding/TLS, разграничение Windows-only scripts и безопасный service workflow.

Codex должен уметь:

- читать архитектурные документы и локальные инструкции;
- вносить небольшие targeted patches;
- запускать релевантные syntax/smoke checks;
- выполнять `node tools/build.js` для production JS по правилам репозитория;
- проверять полный diff и `git diff --stat`;
- не трогать generated files вручную;
- не читать/печатать локальные секреты;
- не запускать destructive/archive apply/deployment commands без явного запроса.

### Codex Cloud

Codex Cloud подключается к выбранным GitHub repositories, готовит dependencies/tools и использует переиспользуемое cloud environment; каждая задача имеет отдельный workspace. Источник: [OpenAI Docs — Codex Cloud](https://learn.chatgpt.com/docs/cloud).

Для этого проекта автоматический npm setup должен быть простым: repository содержит `package-lock.json`, а CI уже подтверждает Linux-oriented sequence `npm ci → npm test → npm run build`. Для воспроизводимости cloud environment нужно явно использовать Node 24.

Ограничения Cloud относительно локальной разработки:

- `.certs/`, `secrets.local.json`, ignored captures и незакоммиченные файлы туда не попадут;
- authenticated WordPress pages и реальные мобильные браузеры недоступны без отдельной интеграции;
- network access agent phase может быть ограничен;
- cloud task видит выбранную branch/commit, а не незакоммиченное состояние ноутбука или S920;
- результаты параллельных задач могут конфликтовать на одинаковых файлах.

### Worktrees и параллельная работа

Отдельные Git worktrees рекомендуются, если одновременно работают разработчик и локальный Codex либо выполняются две независимые локальные задачи. Для Cloud каждая task уже имеет отдельный workspace, но итоговые branches всё равно нужно интегрировать последовательно.

Правила безопасности параллельной работы:

- одна задача — одна branch/worktree;
- не давать двум агентам менять `src/launchpad.js`, runtime metadata или generated `index.html` одновременно;
- не запускать watcher из нескольких worktrees на один output directory;
- не смешивать незакоммиченные пользовательские изменения с agent task;
- сначала обновлять branch от `main`, затем проверять diff/test/build, и только потом merge;
- не хранить секреты в task prompt, Git diff или cloud environment без необходимости.

Защищать от случайной модификации следует `.certs/`, `secrets.local.json`, `.git/`, ignored captures/archives, generated `dist/` и `ledger/`, а также user-owned dirty files.

## 7. Требования к ресурсам S920

### Измеренные показатели текущего checkout

| Объект | Размер / количество |
| --- | ---: |
| Tracked working files | 691 файлов, около 5.17 MB |
| `.git/` | около 19.78 MB |
| `node_modules/` | около 19.91 MB, 26 088 файлов |
| `src/` | около 2.78 MB |
| `assets/` | около 1.54 MB |
| `dist/` | около 10.24 MB |
| Самый большой текущий bundle | `dist/launchpad.js`, около 2.51 MB |
| Локальные `.chatgpt/` + `.handoff/` | около 2.1 MB на момент аудита |

Это размеры файлов, а не измерение peak RAM/CPU. Build/test timing и peak memory не измерялись из-за запрета запуска команд, изменяющих проект.

### Аппаратная неопределённость S920

FUTRO S920 выпускался с несколькими AMD G-Series SoC: двухъядерным GX-222GC и четырёхъядерными вариантами GX-415GA/GX-424CC; заводские RAM/storage configurations также различались. В datasheet указаны два memory slots и конфигурации до 8 GB, а практические апгрейды могут отличаться по ревизии/BIOS. Источники: [Fujitsu S920 datasheet mirror](https://device.report/m/3e23ac2a2076b7f9cbadc9de63ff0d2026f93b61f8c82d1c44820762d57656b0.pdf) и [официальная страница Fujitsu Operating Manual](https://support.ts.fujitsu.com/Search/SWP1206702.asp).

Поэтому точную пригодность конкретного устройства нельзя установить без `lscpu`, `free -h`, `lsblk`, SMART/health data и проверки реального накопителя.

### Оценка нагрузки

| Режим | CPU | RAM | Диск | Оценка |
| --- | --- | --- | --- | --- |
| SSH + Git + редактирование | низкая | 0.5–1.5 GB сверх ОС/VS Code Server | мало | Комфортно при 4+ GB RAM. |
| `http-server` | очень низкая | десятки MB | чтение файлов | Не является проблемой. |
| `tools/build.js` | кратковременная нагрузка на 1 core | ориентировочно 0.2–0.8 GB | запись ~10–15 MB | Должен работать; на GX-415GA будет медленнее современного ноутбука. |
| `npm test` | краткие Node процессы | ориентировочно 0.2–1 GB | мало | Должен работать последовательно. |
| VS Code Server + Codex CLI | низкая/средняя, bursts | ориентировочно 1–3 GB в зависимости от extensions/task | caches/logs | 8 GB желательно. |
| Docker/Dev Container | дополнительный daemon/container overhead | ещё ~0.3–1+ GB | images/layers 1–5+ GB | Нежелательно на 4 GB и малом flash. |
| Несколько worktrees/agents | параллельные bursts | может превысить 4 GB | дубли dependencies/build outputs | Ограничить concurrency. |

Это приблизительные оценки, а не результаты benchmark.

### Практический минимум

- **4 GB RAM:** допустимо для Git + VS Code Remote SSH + одиночного Node watcher, но Codex и параллельные задачи могут вызвать swap и задержки.
- **8 GB RAM:** рекомендуемый минимум для комфортной одиночной разработки.
- **16 GB RAM:** предпочтительно для нескольких worktrees, Codex, дополнительных сервисов и Docker, если конкретная ревизия стабильно поддерживает этот объём.
- **Накопитель:** минимум 32 GB usable, лучше 64–128 GB SSD. Штатные 8/16 GB mSATA modules непрактичны для Debian + VS Code Server + npm caches + logs и могут иметь ограниченный ресурс записи.
- **CPU:** четырёхъядерный GX-415GA/GX-424CC предпочтительнее; двухъядерный GX-222GC пригоден, но build/Codex/VS Code concurrency нужно ограничить.

## 8. Сравнение вариантов изоляции окружения

| Вариант | Преимущества | Недостатки | Поддержка | Нагрузка на S920 |
| --- | --- | --- | --- | --- |
| A. Нативный Debian | Минимум слоёв; быстрый filesystem; простой Remote SSH; project deps остаются в `node_modules`; совпадает с GitHub Actions Linux flow. | Node version и системные пакеты надо зафиксировать отдельно; TLS/systemd/firewall настраиваются на host; Windows scripts не работают. | Низкая при документированном Node 24 и отдельном user. | Самая низкая. |
| B. Docker + Compose | Воспроизводимый image; изоляция feedback service; удобные volumes/env; проще переносить service между hosts. | Docker не используется проектом; build artifacts и file watcher усложняются bind mounts; дополнительные disk/RAM; TLS/mobile access всё равно host concern. | Средняя; нужен Docker lifecycle и обновление image. | Средняя, заметная при 4 GB RAM/малом SSD. |
| C. VS Code Dev Containers | IDE и tools описываются как код; удобный onboarding; хороший isolation для нескольких проектов. | Docker обязателен; самый тяжёлый cold start; extension duplication; сложнее LAN HTTPS и device access; лишняя сложность для трёх JS dependencies. | Средняя/высокая. | Самая высокая из трёх. |

### Рекомендация

Выбрать **A: нативный Debian**.

Причины:

- текущий build/test workflow уже выполняется на Linux GitHub runner;
- нет native dependencies и сложной service topology;
- проект мал по размеру и использует всего три devDependencies;
- браузерная часть статическая;
- S920 — слабая платформа, где Docker/Dev Container overhead не окупается;
- `server.js` можно позже изолировать отдельно, не контейнеризуя всю development environment.

Для воспроизводимости нативного варианта достаточно зафиксировать Node 24, использовать только `npm ci`, хранить npm dependencies локально в checkout, документировать Debian bootstrap и не устанавливать project npm packages глобально. Codex CLI можно установить отдельно на уровне пользователя официальным Linux installer.

Docker имеет смысл пересмотреть, если S920 станет хостом нескольких production services либо feedback service получит полноценный deployment contract. Dev Container оправдан только если появится команда разработчиков или существенно усложнится toolchain.

## 9. Риски переноса и предварительные проверки

### Критические перед первым clone

1. **Незакоммиченные изменения.** Семь изменённых tracked files не попадут на сервер. Нужно осознанно commit/stash/patch/backup, не выполнять слепой reset.
2. **Ignored локальные данные.** Сертификаты, секреты и agent/workspace artifacts не восстанавливаются из Git.
3. **Неизвестная конфигурация S920.** RAM, CPU variant, SSD size/health и Debian architecture не проверены.
4. **Node version drift.** CI использует 24, но repository metadata это не фиксирует.
5. **TLS/hostname.** `desktop-ih35ogb.local` не должен автоматически переноситься на новый host.

### Пути, регистр и имена файлов

- Case collisions среди tracked paths не найдены.
- Есть файл `assets/images/claude-haiku .svg` с пробелом перед расширением; это легально на Linux, но легко пропустить в shell scripts и ручных операциях.
- Build script использует `path.join/resolve` и нормализует web paths, что снижает риск separator problems.
- `.gitattributes` задаёт LF для JS/CSS/JSON/Markdown, но локальный Git настроен `core.autocrlf=true`; `git diff --check` показал предупреждения о будущей конверсии LF→CRLF для части текущих Windows files. На Debian рекомендуется LF-oriented Git config и проверка diff перед commit.

### Права доступа

- Remote user должен владеть checkout, npm cache, VS Code Server и generated directories.
- Не запускать `npm`, build, watcher или Codex через `sudo`.
- Для `/var/log/onliner-feedback/` нужен отдельный service user/группа либо systemd-managed writable path.
- SSH private keys должны иметь режим `0600`, `.ssh` — `0700`.

### Переменные окружения и секреты

- Не переносить секреты через Git.
- Не печатать значения `secrets.local.json` и Telegram/feedback variables в logs/chat.
- Использовать systemd EnvironmentFile с ограниченными правами, secret manager либо user environment вне repository.
- Добавить `.env*` в ignore до появления таких файлов.
- Не считать client-visible `X-Feedback-Secret` настоящей защитой без threat-model review.

### Git и SSH

- Текущий remote HTTPS; для unattended Git на сервере потребуется credential helper/token либо переход на SSH remote.
- Для Codex Cloud GitHub connection настраивается отдельно и не наследует server SSH credentials.
- Проверить known_hosts, deploy/user key scope и отсутствие write access сверх необходимого.

### Публикация

- Не переносить локальный `dist/` как source of truth.
- Сохранить `main` push workflow, Node 24, `/onliner` base URL и публичные `/dist/*` paths.
- Не переносить deployment на S920 без отдельного решения: сейчас GitHub Actions уже обеспечивает независимый Linux build и Pages deploy.
- Перед изменением repository owner/name выполнить поиск всех hardcoded `nikolay-a-baranov.github.io/onliner` ссылок.

### Проверки после будущего переноса

После отдельного согласования миграции выполнить на чистом checkout:

1. подтвердить hardware и storage health;
2. подтвердить `node --version` = выбранный Node 24 release и `npm --version`;
3. выполнить `npm ci`;
4. выполнить `npm test`;
5. выполнить `npm run build` и проверить mojibake guard;
6. сравнить generated manifest/критические paths;
7. запустить dev-server сначала через SSH forwarding;
8. вручную проверить storefront и bookmarklets в desktop browser;
9. только после TLS/DNS настройки проверить iPad/iPhone;
10. отдельно проверить GitHub Actions/Pages после безопасного test commit.

В рамках данного аудита эти команды не выполнялись.

## 10. Рекомендуемая архитектура

```text
Ноутбук Windows 11
├─ VS Code UI
├─ локальный браузер
└─ SSH / port forwarding
          │
          ▼
FUTRO S920 · Debian
├─ непривилегированный dev user
├─ Git checkout / отдельные worktrees
├─ Node.js 24 + npm
├─ repo-local node_modules (`npm ci`)
├─ VS Code Server
├─ Codex CLI
├─ watcher/build/test
└─ dev static server :5173
          │
          ├─ localhost через SSH forwarding
          └─ LAN/VPN hostname + trusted TLS для iPad/iPhone

GitHub
├─ origin/main
├─ Codex Cloud tasks в отдельных workspaces/branches
└─ GitHub Actions (Ubuntu + Node 24)
          │
          ▼
GitHub Pages /onliner
```

Feedback service, если он нужен постоянно, следует отделить логически:

```text
reverse proxy / VPN boundary
        ↓
systemd service: node server.js
        ├─ EnvironmentFile вне Git
        ├─ writable/logrotate-managed log path
        └─ outbound HTTPS → api.telegram.org
```

Не рекомендуется связывать доступность GitHub Pages с состоянием S920. Сервер разработки может быть выключен, а production Pages deployment должен продолжать работать через GitHub Actions.

## 11. Что не удалось установить

Следующие сведения отсутствуют в repository или не могли быть безопасно подтверждены без доступа к целевому серверу/административным настройкам:

1. Точная модификация CPU конкретного S920: GX-222GC, GX-415GA или GX-424CC.
2. Фактический объём RAM и стабильность возможного 16 GB upgrade.
3. Тип, объём, скорость, SMART health и write endurance накопителя.
4. Версия Debian, kernel, firmware compatibility, состояние NIC и фактическая производительность.
5. Реальное время и peak RAM сборки/тестов на S920.
6. Планируемое сетевое имя, DNS/mDNS, VPN, firewall и TLS trust model.
7. Должен ли `server.js` работать на S920 постоянно и какой внешний endpoint должен к нему вести.
8. Где сейчас эксплуатируется feedback service и как хранятся его environment variables.
9. Административная Pages setting (GitHub Actions source), branch protection и repository secret/variable configuration.
10. Статус последнего GitHub Actions deployment на момент аудита.
11. Полная история возможных утечек секретов; выполнена только ограниченная проверка текущих tracked files без вывода значений.
12. Какие ignored `.chatgpt/`, `.handoff/`, `.audit/`, `.responses/` artifacts нужно переносить, архивировать или оставить на ноутбуке.
13. Нужна ли Linux-замена Windows monthly archive Task Scheduler или архивирование останется на Windows.
14. Нужен ли прямой доступ мобильных устройств к dev-server вне домашней LAN.

## Итоговое решение

Проект можно переносить на Debian как центральную среду разработки, но начинать перенос следует только после сохранения текущих незакоммиченных изменений и инвентаризации ignored локальных данных. Основной production workflow уже Linux-compatible благодаря GitHub Actions и не должен переноситься с Pages на S920.

Оптимальная целевая модель — нативный Debian + Node.js 24 + npm lockfile + Remote SSH + Codex CLI, с GitHub Actions как единственным production build/deploy path. Docker и Dev Containers на текущем этапе не нужны. Самые существенные подготовительные работы находятся не в JavaScript build, а вокруг TLS/hostname, secrets, Windows-only maintenance, feedback service и дисциплины параллельных Git worktrees.

