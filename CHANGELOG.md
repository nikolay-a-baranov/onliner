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

- Кластеры панели Sandbox сохраняют системные размеры на узком экране и через общий responsive cluster-row переносят самый широкий кластер в отдельную центрированную строку.
- Фоны поля контента и сравнения Sandbox используют те же theme-aware design tokens, что и кластеры тулбара.
- Sandbox при загрузке читает редактируемый `sandbox/content.txt` без кэша и принимает его содержимое за исходное состояние статистики и сравнения; сырой HTML в файле не обрабатывается как документ.
- В Sandbox рядом с темой добавлен отдельный циклический эмоджи-переключатель лэйаута `news → longread → photoreport`; он меняет штатный `layout_select`, поэтому контекст и доступные команды обновляются тем же путём, что в админке.
- В редакторском `roadmap` команда подготовки расписания перенесена сразу после Cleanup, Reader теперь предшествует Audit, а экспериментальная Strip удалена из набора.
- Попапы полей циклируются по `Alt+\`` в порядке `lead → excerpt → titles → slug` без закрытия активного окна, сохраняют единую геометрию хедера, удерживают фокус команд на своём активном вводе и временно блокируют ручное редактирование основного `content`; применение лида обозначено глифом `Subtitles`, обновляет первый абзац, цитату и переводит в попап `excerpt`, а пустое состояние лида не показывает служебный placeholder или сообщение об отсутствующем абзаце.
- Audit now selects LanguageTool, Gemini, and Qwen through one engine cycle. LanguageTool results are prefetched in the background but enter the review only after explicit activation; the editorial chain waits only for its foreground Gemini check before opening Lead and keeps Audit available for later LanguageTool review.
- На узких экранах все попапы полей используют единый двухрядный хедер с сохранёнными крайними отступами; в Titles доступные типы заголовков переключаются между стрелками или вертикальным свайпом по анимированному барабану.
- Audit and admin field popups now share the responsive header layout contract: controls are distributed evenly on wide panels and move to a measured second row before they can overlap on narrow screens.
- Audit keeps its manual result export implemented but hides the download control and its separator behind the shared `data-ui-availability="deferred"` marker while telemetry remains the primary collection path.
- Audit defers the API-key page prompt and asks for each missing provider key at most once while its popup remains open; closing Audit resets that prompt guard.
- Qwen remains implemented in Audit but is marked `deferred`, so the current engine cycle exposes only LanguageTool and Gemini.
- Telemetry ZIP export now finishes assembly and starts the browser download before the strict VPN gate for both Save and Publish; an unchanged retry after a VPN failure reuses that successful download, while changed editorial data produces a fresh archive.
- Telemetry packages now include privacy-limited `activity.json` data for centrally dispatched Toolbar commands, trusted manual editor operations, and Audit decision references, with explicit coverage and overflow metadata; activity survives initial and repeated Cleanup boundaries within the active post session.
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

- `Tab` и `Shift+Tab` в попапе Titles остаются в цикле доступных полей заголовка, даже если сейчас разблокировано только одно поле.
- Pinned-группа при раскрытии сначала разворачивает контейнер и только затем показывает содержимое, зеркально анимации скрытия и без видимого выезда из границы.
- Cleanup ставит неразрывный пробел после цифровых порядковых числительных с наращением во всех падежных формах, например `16-й этаж` и `21-го октября`.
- Тулбар Sandbox снова корректно создаётся при загрузке: атрибуты кнопок режима Strip больше не повреждают HTML-разметку панели, а сохранённая позиция Launchpad ограничивается текущим viewport и не уносит панель за экран.
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
