# NPM scripts

Этот документ — справочник по npm-командам репозитория. Исполняемый source of
truth остаётся в `scripts` файла [`package.json`](../package.json); здесь
зафиксированы назначение, side effects и точки входа каждой команды.

## Запуск

В чистом клоне установить зависимости строго по lockfile:

```powershell
npm.cmd ci
```

`npm.cmd install` использовать при намеренном обновлении dependency metadata.

В Windows-команда запускается как `npm.cmd run <script>`, в Linux и macOS — как
`npm run <script>`. Для `test` допустима короткая форма `npm test`.

Дополнительные аргументы передаются после `--`:

```powershell
npm.cmd run eval:prompts -- --run .eval/editorial-current.json
```

## Ежедневная разработка

| Script | Назначение | Side effects |
| --- | --- | --- |
| `dev` | Параллельно запускает `watch` и `serve:https`. | Пересобирает generated output. |
| `watch` | Проверяет Fluent-иконки, делает начальную сборку и следит за source-файлами. | Перезаписывает generated output после изменений. |
| `serve` | Раздаёт корень репозитория по HTTP на порту `5173` без cache. | Нет записей на диск. |
| `serve:https` | Раздаёт корень по HTTPS с сертификатами из `.certs/`. | Нет записей на диск; требует локальные сертификаты. |

`dev` использует адрес `https://desktop-ih35ogb.local:5173/`. Настройка hostname,
сертификатов и мобильных устройств описана в [`README_DEV.md`](README_DEV.md).

## Сборка

| Script | Назначение | Side effects |
| --- | --- | --- |
| `verify` | Последовательно запускает полный `npm test` и production `npm run build`; это единый локальный gate перед завершением buildable-изменений. | Те же generated output, что у `build`. |
| `build` | Проверяет Fluent-иконки и запускает обычную registry-сборку. | Обновляет `dist/`, `index.html`, `ledger/index.html`; удаляет legacy output. |
| `build:legacy` | Собирает текущие и legacy-инструменты. | Дополнительно создаёт `legacy.html` и `dist/legacy/`. |
| `build:analyze` | Печатает статистику обычной registry-сборки. | Не записывает generated output. |
| `build:registry:analyze` | Явное имя для анализа registry-сборки. | Не записывает generated output. |
| `build:inline:analyze` | Анализирует compatibility inline-bundler. | Не записывает generated output. |

Основная реализация находится в [`../tools/build.js`](../tools/build.js).
Активные build entries описаны в [`../tools/tools.json`](../tools/tools.json),
legacy entries — в [`../tools/legacy/tools.json`](../tools/legacy/tools.json).
Архитектурный контракт bundler зафиксирован в
[`decisions/AD-003-build-module-registry.md`](decisions/AD-003-build-module-registry.md).

Не редактировать вручную `dist/`, `index.html`, `ledger/index.html` и
`legacy.html`: это generated output.

## Автоматические проверки

`npm test` последовательно запускает все scripts с префиксом `test:` через
`npm-run-all`. Новый обязательный smoke-тест нужно объявлять как `test:<name>` —
после этого он автоматически войдёт в общий прогон.

| Script | Точка входа | Что проверяет |
| --- | --- | --- |
| `test:build-registry` | `tools/build-registry-smoke.js` | Граф модулей и однократную эмиссию shared dependencies. |
| `test:lead` | `tools/lead-smoke.js` | Lead transform, размещение команды и runtime wiring. |
| `test:qa` | `tools/check.js` | Versioned fixtures из `tools/fixtures/qa/content/` и известные дефекты HTML/content. |
| `test:telemetry-foundations` | `tools/telemetry-foundations-smoke.js` | Базовый telemetry contract. |

В CI проверки выполняются до production build. Workflow находится в
[`../.github/workflows/build.yml`](../.github/workflows/build.yml).

## Prompt evals

| Script | Назначение |
| --- | --- |
| `eval:prompts` | Запускает `evals/run.js`; режим выбирается аргументами `--init`, `--run`, `--compare` или `--observations`. |
| `eval:prompts:self-check` | Проверяет основной eval runner на versioned fixtures. |
| `eval:observations:self-check` | Проверяет импорт observation fixtures. |

Полный workflow и правила для чувствительных данных описаны в
[`../evals/README.md`](../evals/README.md).

## Иконки и локальные секреты

| Script | Назначение | Side effects |
| --- | --- | --- |
| `fluent:check` | Сверяет используемые Fluent glyphs с vendored SVG и manifest. | Нет записей на диск. |
| `fluent:sync` | Синхронизирует `assets/icons/fluent/` с используемыми glyphs. | Добавляет, обновляет и удаляет vendored SVG. |
| `secrets:apply` | Читает `secrets.local.json` и печатает команду для browser DevTools. | Не меняет repository files; секрет появляется в terminal output. |

Fluent-логика находится в [`../tools/fluent.js`](../tools/fluent.js), подготовка
локальных секретов — в [`../tools/secrets.js`](../tools/secrets.js).

## Local maintenance

| Script | Purpose | Side effects |
| --- | --- | --- |
| `maintenance:archive` | Preview completed `YYYYMM` directories and recognized timestamped artifacts under `.chatgpt/`, `.handoff/`, and `.audit/`. | Read-only. |
| `maintenance:archive:apply` | Archive completed monthly artifacts with a manifest, SHA-256 verification, and temporary partial outputs. | Writes to the sibling `onliner-archive/` directory and removes only verified source artifacts. |
| `maintenance:archive:schedule` | Register the archive operation in Windows Task Scheduler for day 1 of each month. | Creates or replaces the local scheduled task named `Onliner Monthly Workspace Archive`. |

The archive workflow and recovery guarantees are documented in
[`README_DEV.md`](README_DEV.md#monthly-workspace-archive).

## Как расширять

- Добавлять пользовательскую точку входа в `package.json`, а реализацию держать
  в тематическом файле внутри `tools/` или `evals/`.
- Называть обязательные автоматические проверки `test:<name>`, чтобы их подхватил
  общий `npm test`.
- Не помещать сложную логику непосредственно в строку npm script.
- Документировать новую команду здесь одновременно с добавлением script.
- Для команды, которая пишет или удаляет файлы, явно указывать side effects.
