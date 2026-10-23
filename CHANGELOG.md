# Changelog

Этот файл описывает значимые изменения понятнее, чем история отдельных
коммитов. Git остаётся точным журналом кода; здесь фиксируются результат,
влияние, важные решения и выполненная проверка.

Записи добавляются в `Unreleased` по категориям `Added`, `Changed`, `Fixed`,
`Removed` и при выпуске могут переноситься в датированный раздел. Не нужно
перечислять generated-файлы, внутренние перестановки и каждый коммит.

## Unreleased

### Added

- Команда `tokens` предлагает вставить или удалить союзное `что` в позиции курсора рядом с запятой.
- Toolbar и Sandbox получили единую команду `strip`: в Sandbox она экспериментально
  показывает readonly plain-text preview через существующий `markup.strip`, не изменяя `#content`.
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

- В редакторском `roadmap` команда подготовки расписания перенесена сразу после Cleanup, Reader теперь предшествует Audit, а экспериментальная Strip удалена из набора.
- Попапы полей циклируются в порядке `lead → excerpt → titles → slug`, удерживают фокус команд на своём активном вводе и временно блокируют ручное редактирование основного `content`; применение лида обозначено глифом `Subtitles`, обновляет первый абзац, цитату и переводит в попап `excerpt`, а пустое состояние лида не показывает служебный placeholder или сообщение об отсутствующем абзаце.
- The editorial command chain now waits for Audit to finish its LanguageTool and Gemini checks before opening Lead.
- Telemetry ZIP export now runs locally before the VPN availability gate, so a failed WordPress submission does not lose the pre-submit archive.
- Revision provenance now distinguishes an absent author dictionary control, an absent or invalid ID-keyed option, and a resolved name missing from visible revision rows; conflicting author IDs or display-name sources fail closed.
- Telemetry package manifests now record a non-identifying client environment snapshot at pre-submit export and an optional snapshot of visible WordPress admin revision provenance, including the latest exact display-name match for the publication author; the author name can be resolved from the additional-authors control strictly as an ID-keyed dictionary when the primary author ID is known. Capture remains synchronous at the `0HF` boundary without a network request.
- Команда Mirror в тулбаре переименована в «Слойка» и получила Fluent-глиф слоя.
- Сравнение в Sandbox объединяет парные события `input` / `change` и показывает состояние `content` непосредственно до серии изменений относительно её результата, точно подсвечивает изменённые слова, знаки и пробелы общим с revisions алгоритмом, позволяет менять стороны местами и отделяет служебные показатели от глиф-контролов на общих surface/button primitives. Статистика ручного ввода принимает первый непустой текст за исходное состояние вместо подсчёта всей вставки от нуля.
- Системные Fluent-глифы standalone Ledger загружаются из локального vendored-набора; HTML/PDF-экспорт
  встраивает используемые в строках глифы и не получает битых относительных путей.
- CSS-состояния категорий и карточки дежурств в Ledger сведены к одному
  локальному каскаду без versioned дублей и изменения итогового оформления.
- Audit и Sandbox теперь используют общий нейтральный контракт native select;
  Sandbox больше не зависит от Audit-specific классов для оформления селекта.
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

- В суперрежиме Launchpad восстановлены разделители между редакторскими, авторскими и служебными ролями, включая локальную песочницу.
- Cleanup сохраняет и восстанавливает падежные наращения десятилетий в сочетаниях вроде `1970-х годов`.
- Текст вариантов в Audit снова учитывает место под указатель общего select и не наезжает на него.
- Canvas песочницы переведён на непрозрачный neutral-примитив, поэтому в тёмной теме области тулбара и редактора больше не смешиваются с подложкой в разные цвета.
- Keyboard focus в Ledger теперь обозначается единым видимым focus ring для
  полей, кнопок, ссылок и интерактивных карточек без изменения hover/active.
- Синхронизация внешнего вида UI-поверхности больше не сохраняет её тему в
  общий `ui-panel-theme`: локальная тема Reader и других панелей не
  перезаписывает настройку Sandbox при обычном открытии или обновлении.
- В Telegram-контексте команда «Скопировать видео» больше не отбрасывается
  editorial-слоем, отображается отдельной кнопкой `Video Clip`, находит MP4
  внутри встроенного Telegram-фрейма, копирует готовый HTML-код для админки и
  скачивает файл.
- Между редакционными командами `ChatGPT` и `Проект` во всех контекстах
  отображается разделитель.
- Тулбар продолжает инициализацию, если браузер запретил или не смог записать
  настройки в `localStorage`; отказ хранилища больше не оставляет панель
  неоформленной и неактивной.
