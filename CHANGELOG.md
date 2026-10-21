# Changelog

Этот файл описывает значимые изменения понятнее, чем история отдельных
коммитов. Git остаётся точным журналом кода; здесь фиксируются результат,
влияние, важные решения и выполненная проверка.

Записи добавляются в `Unreleased` по категориям `Added`, `Changed`, `Fixed`,
`Removed` и при выпуске могут переноситься в датированный раздел. Не нужно
перечислять generated-файлы, внутренние перестановки и каждый коммит.

## Unreleased

### Added

- Added a verified monthly maintenance command for archiving completed
  `.chatgpt/`, `.handoff/`, and `.audit/` month directories and recognized
  timestamped artifacts, plus an explicit Windows Task Scheduler installer.
- HTML-песочница по стабильному адресу `/sandbox/` запускает production-команды
  `cleanup` и Reader, загружает синтетические fixtures и локальные HTML-файлы,
  показывает raw HTML до/после и безопасный текстовый diff для диагностики.
- На главную витрину добавлена отдельная иконка-ссылка на публичную страницу
  Ledger.
- Введены живые планы в `docs/plans/` для многосессионных и рискованных работ,
  включая progress, decision log, verification evidence и handoff.
- Добавлен этот смысловой журнал значимых изменений поверх истории Git.

### Changed

- Песочница получила компактный интерфейс на общих design tokens, общую тему
  UI и штатный Reader-сценарий; все режимы Launchpad доступны только в
  распознанном sandbox-контексте.
- QA checks now read committed fixtures from `tools/fixtures/qa/`; the ignored
  root `qa/` directory is reserved for temporary local captures and can be
  archived outside the repository without changing test results.
- `npm`-команды сведены в единый справочник с точками входа и side effects;
  существующий lead smoke-test включён в общий `npm test`, а неиспользуемая
  `chokidar-cli` удалена из dev dependencies.
- Репозиторные skills перенесены из общего `skills/` в `.agents/skills/`;
  объёмные правила и инструкции анализа вынесены в references соответствующих
  skills.
- Корневой `TODO.md` назначен единственным каноническим backlog; прежний
  `docs/TODO.md` сохранён как справочный архив
  `docs/notes/editorial-backlog.md`.
- Правила владения backlog, планами, ADR и changelog закреплены в `AGENTS.md` и
  [AD-004](docs/decisions/AD-004-planning-and-change-records.md).

### Fixed

- В Telegram-контексте команда «Скопировать видео» больше не отбрасывается
  editorial-слоем, отображается отдельной кнопкой `Video Clip`, находит MP4
  внутри встроенного Telegram-фрейма, копирует готовый HTML-код для админки и
  скачивает файл.
- Между редакционными командами `ChatGPT` и `Проект` во всех контекстах
  отображается разделитель.
- Тулбар продолжает инициализацию, если браузер запретил или не смог записать
  настройки в `localStorage`; отказ хранилища больше не оставляет панель
  неоформленной и неактивной.
