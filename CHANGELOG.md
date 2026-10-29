# Changelog

Этот файл описывает значимые изменения понятнее, чем история отдельных
коммитов. Git остаётся точным журналом кода; здесь фиксируются результат,
влияние, важные решения и выполненная проверка.

Записи добавляются в `Unreleased` по категориям `Added`, `Changed`, `Fixed`,
`Removed` и при выпуске могут переноситься в датированный раздел. Не нужно
перечислять generated-файлы, внутренние перестановки и каждый коммит.

## Unreleased

- Во время сбора статистики административная страница снова закрывается полноэкранным индикатором разделов; текущий раздел выделяется крупным эмоджи, а обработанные записи, выбранный месяц и пользователь показываются в отдельной перетаскиваемой панели с заполняемым счётчиком. Worker получает до 60 секунд на первичную загрузку Launchpad при переходе между разделами, а после первого ответа watchdog перевзводится при каждом обновлении прогресса и останавливает действительно замерший обход через 75 секунд. Watchdog привязан к конкретному разделу и уникальному поколению запуска, поэтому запоздалый таймер больше не может остановить уже следующий раздел. Внизу самой страницы Sandbox доступна временная кнопка «Демо обхода» с автоматической имитацией такого сбора.

- Имя JSON одного раздела содержит число фактически сохранённых записей после названия раздела.

- Выбор месяца перед сбором статистики перенесён из системного confirm в отдельный перетаскиваемый admin-попап. Выпадающий список охватывает текущий и 359 предыдущих месяцев, группирует месяцы под заметными заголовками годов и одинаково используется во всех четырёх режимах сбора.

- Обход раздела останавливается сразу после подтверждённо пустой таблицы WordPress или достижения указанной сервером последней страницы, даже если в HTML осталась активная ссылка `next-page`; страницы с публикациями, но без ревизий выбранного пользователя, по-прежнему проверяются полностью.

- Загрузка списка WordPress сохраняет 30-секундный тайм-аут, а отдельная карточка публикации ограничена 20 секундами на попытку с одним повтором; проблемная карточка больше не выглядит как минутное зависание и по-прежнему пропускается с записанной причиной только после retry.

- Добавлен отдельный полный сбор публикаций и всех видимых ревизий для текущего или сразу всех разделов; старые отчёты по активному пользователю сохранены отдельными командами. В выборе периода по умолчанию остаётся прошлый месяц с первого по пятое число и текущий в последний день месяца, но перед запуском значение всегда можно изменить. В JSON-схеме v2 метки сохраняются отдельными значениями из ссылок серверной таблицы WordPress, автор и признак автосохранения ревизии разделены, каждый раздел получает явный итог сбора, реальные ошибки отделены от диагностики исключённых дублей, а запоздалый повторный ответ worker больше не может подменить следующий раздел.

- Команды статистики явно названы по охвату записей, пользователей и разделов; в админской ленте они вынесены из закреплённой группы в отдельную группу «Отчёт» после «Драфта» и разделены на полный и пользовательский сбор. Пользовательский отчёт скачивается одним ZIP с общими CSV, TSV и, при наличии, JSON ошибок, поэтому браузеру не требуется разрешать серию автоматических загрузок. Загрузка карточки повторяется после 30-секундного тайм-аута, а повторно недоступная запись пропускается с сохранением ссылки и причины в JSON ошибок. Пакетная выгрузка напоминает о Tampermonkey bootstrap и явно сообщает о блокировке worker-вкладки или отсутствии bootstrap вместо незаметного отказа; build публикует обновляемый userscript для прямой установки.

- Audit acceptance now applies an explicitly chosen suggestion on the first click even when its row was not active; the redundant return-to-active control is retained as deferred UI, while Undo remains available for recovery.

### Added

- Документирован evidence-to-improvement workflow для телеметрии корректуры:
  внешнее хранение исходных архивов, проверяемые finding IDs, ручное одобрение
  изменений и границы будущего action-to-effect эксперимента.
- Команда `tokens` переключает десятичный разделитель `.` ↔ `,`, когда курсор находится внутри дробного числа; даты, версии и другие цепочки с несколькими разделителями не затрагиваются.
- Команда «Скобки» получила хоткей `Alt+B`; при оборачивании выделения она убирает предшествующую запятую или тире, а одинаковые парные знаки снимает с обеих сторон с нормализацией пробелов.
- Команда `Edits` («Правки») принимает свободную редакторскую инструкцию, запрашивает точечные предложения у выбранного LLM и передаёт их в безопасный поштучный review с проверенными HTML-targets, custom replacement и Undo.
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

- Дизайн-система получила общий opt-in паттерн `data-ui-selection-glow`: активный текст подсвечивается мягким свечением, а изображения — двойным drop-shadow. Фильтры группового Ledger используют его вместо цветной заливки.
- Групповой Ledger может по расширяемому словарю заменять технические значения авторов из админки каноническими именами; режим управляется единым флагом `ledgerGroup.author.enabled` и не изменяет исходный crawler JSON.
- Локальный Ledger читает индекс месячных crawler-экспортов из игнорируемого Git каталога `local-data/ledger/`, показывает выбор месяца в формате «Сентябрь 2026» и по умолчанию открывает последний доступный период; переданный с главной JSON имеет приоритет, а GitHub Pages локальный архив не запрашивает. Верхняя строка содержит только выбор периода и корректора, стрелки используют правый светлый Fluent-глиф, а место под reset зарезервировано постоянно без скачков высоты.
- Таблицы Ledger сохраняют читаемую минимальную ширину на более узких мониторах и прокручиваются по горизонтали вместо переноса текста по буквам; боковые панели на средних экранах складываются в один столбец, освобождая место отчёту.
- Ledger распознаёт полный локальный экспорт `onliner-publications` v2 и открывает отдельный режим «Участие в ревизиях»: в статистику корректора входят только его ревизии внутри отчётного месяца, а для каждой публикации показывается приблизительная передача на вычитку — последняя обычная ревизия другого пользователя перед первой ревизией выбранного корректора. Передача после времени публикации отмечается консервативным сигналом «Дедлайн»; признаки `special_project` и `evergreen` выводятся как кликабельные source-backed типы материалов. Первый корректор из общего roster выбирается сразу, а строки повторяют структуру пользовательской таблицы — под заголовком показываются автор, количество слов и теги, рядом стоят локальные логотипы Onlíner/WordPress. Раздел и тип материала показываются эмоджи с переключением вида по заголовкам; распределения по ним и сигналы одновременно служат статистикой и комбинируемыми toggle-фильтрами, а дата, автор и теги фильтруются кликом непосредственно в таблице. Лепка, технические данные autosave, ID записи и статус в строках не показываются. В raw-режиме также скрыта отдельная колонка с кнопкой Ledger, а селекты, карточки статистики и фильтры выровнены равномерными сетками. Зарплатные итоги и платёжные переключатели остаются только в прежнем индивидуальном ledger v3.
- Пустые разделы crawler-экспорта не попадают в фильтры Ledger и не создают дублирующие предупреждения о статусе и общей ошибке; ошибки разделов с сохранёнными публикациями по-прежнему видны.
- Страница Ledger называется «Дашборд · Onlíner» и использует системную эмоджи 📒 как собственный favicon.
- Групповой Ledger получил интерактивную аналитику: окно «Динамика» показывает соединёнными точками все календарные дни месяца и переключается между материалами и словами; подсказка точки содержит день недели, дату и значение, а нулевые значения обозначаются пустыми точками. Точки дней применяют фильтры, общий reset-глиф снимает все фильтры сразу, а аномалии нескольких лонгридов одного раздела за день выводятся непосредственно в «Сигналах» без скрытых эвристических порогов. Количество материалов и фильтрация по разделам остаются в едином верхнем блоке; отдельное распределение с полосками, окно странностей и блок максимумов и минимумов убраны как дублирующие представления.
- Верхнее обобщение группового Ledger оставляет только количество записей и средний объём без повторения выбранного корректора и числа ревизий. Лэйауты, спецтипы и фактическая лепка слева/справа собраны кластерами в едином фильтре «Типаж» без варианта «Без лепки»; количества отделены срединной точкой и выделены жирным. Неочевидный столбец ревизий и передачи из таблицы скрыт.
- В таблице группового Ledger лэйаут и тип материала разделены по самостоятельным столбцам с независимым переключением эмоджи/текста; в типе остаются только спецпроект и эвергрин. Все заголовки таблицы выровнены по центру независимо от выравнивания содержимого столбца.
- Групповой Ledger использует единый вертикальный шаг между селектами, обобщением, фильтрами, графиком и таблицей без пустой строки под общий reset. Публичная ссылка перенесена на визуально нейтральный заголовок материала, а отдельная колонка оставляет только вход в WordPress. Подписи блоков остаются компактными, содержимое фильтров, графика и таблицы приведено к основному размеру селектов.
- Строки группового Ledger явно сортируются по дате и времени публикации от новых к старым независимо от порядка разделов в crawler-экспорте. Нулевые точки графика непрозрачно маскируют проходящую под ними линию через общий цвет полотна, а контейнер таблицы использует скругление аналитических поверхностей.
- Аналитика Ledger использует общие surface-примитивы: крупные смысловые блоки снова оформлены отдельными окнами, а вложенные контролы остаются прозрачными и выделяются только selection glow. Расстояние между верхними селектами задаётся отдельным дизайн-токеном, а raw-панель использует обычное начертание подписей без конкурирующей с подсветкой обводки выбранных элементов.
- Команды `left` и `right` сохраняют все исходные запятые и другие разделители при перестановке одиночных слов и многословных фрагментов; внутренние разделители перемещаются вместе с фрагментом вместо перезаписи на пересекаемой границе, а HTML-теги служат границами и не участвуют в перестановке.
- При замене «в том числе» на «помимо прочего,» команда `tokens` добавляет требуемую запятую слева, кроме начала предложения, и не дублирует уже поставленную запятую.
- В команде `tokens` точка и запятая одинаково распознаются числовыми преобразованиями: переключатель десятичного разделителя уступает им для всего найденного числа, а словесная форма возвращается в русскую запись через запятую.
- Загрузка Ledger JSON перенесена на главную страницу: крупная кнопка отделена от краткой инструкции, сразу открывает файл и передаёт его в Ledger, а отдельная инструкция по установке Worker Bootstrap с витрины удалена. Логотипы режимов GitHub, JavaScript и local теперь загружаются из локальных assets и не зависят от внешних CDN.
- Команда `killem` с глифом `Eraser Medium` снимает теги `<em>` только в выделенном фрагменте, а без выделения — от курсора до конца поля `content`, сохраняя корректные пары тегов по краям диапазона.
- Cleanup заголовков удаляет тире перед самостоятельными предлогами «о», «об», «обо» и «про», не затрагивая такие же сочетания в основном тексте.
- Репозиторий получил единый `npm run verify` gate: полный набор smoke-тестов выполняется вместе с production build и проверкой синхронизации Fluent-иконок; агентские правила больше не считают прямой запуск `node tools/build.js` достаточной финальной проверкой.
- Shared surface controls now group field and select geometry, theme, focus, selection, disabled, and toolbar-button state tokens by responsibility; Popup, Promo, Feedback, Edits, Audit, Admin, Media, and Readmore reuse the common primitives, escaped options, and native setter path without changing their rendered dimensions.
- Shared surfaces now hide native scrollbar chrome through one design-system contract while preserving wheel, touch, keyboard, and programmatic scrolling; Reader applies the same contract to both its content field and syntax layer.

- Reader HUD uses its calculated phone mode consistently in portrait and landscape, maps row and phone “tetris” layouts through explicit base/stack coordinates, and places secondary layer cards outside the vertical phone controls instead of overlapping their primary glyphs.
- Proofreading analysis is now discoverable through the conventional
  `.agents/skills/onliner-proofreading-analysis/SKILL.md` entry point; telemetry
  names remain unchanged for collection schemas and exported artifacts.
- Cleanup обособляет календарную дату после дня недели: ставит запятую перед датой и закрывает оборот второй запятой только тогда, когда предложение продолжается.
- Proofreading-analysis Codex briefs now authorize a user-initiated, bounded
  research pass with a conditional low-risk patch, while report generation and
  risky or broad changes remain non-executing. Source: proofreading workflow.
- Cleanup приводит числовые размеры вида `1920x1080` и `10х20х30` к компактной записи со знаком `×`; пробелы вокруг него сохраняются только для размеров с дробными значениями.
- Cleanup распознаёт простые числовые формулы, приводит сложение, вычитание, умножение, деление и равенство к знакам `+`, `−`, `×`, `÷`, `=` и нормализует пробелы вокруг операций.
- В editor-наборе группа Prep получила рабочий порядок `Cleanup → Prepare → Reader → Audit → Lead → Edits → Echo`, а Roadmap оставляет только запуск команды `Chain`.
- Reader выделяет gallery и catalog shortcode-блоки, social embeds, наборы `ul`/`ol`/`li`, `dl`/`dt`/`dd` и HTML-теги таблиц отдельными theme-aware цветами, не меняя исходный текст.
- Первичная подсветка Reader строится после первого кадра интерфейса; повторная синхронизация не перерисовывает неизменившийся текст и не запускает лишний layout.
- Popup «Правки» принимает инструкцию без искусственного лимита; отправка с глифом `Agents` перенесена из поля в центральный кластер шапки, а одиночное поле больше не получает лишнюю focus-рамку.
- Draggable popup «Правки» сохраняет штатный glass-фон и получает двухконтрастную границу с внешней тенью, чтобы его силуэт читался над фоном любой яркости.
- Audit suggestions now carry verified source targets from LanguageTool or LLM mapping through preview, apply, and undo; ambiguous, conflicting, unsupported, or stale targets remain visible but cannot mutate editor HTML.
- Кластеры панели Sandbox сохраняют системные размеры на узком экране и через общий responsive cluster-row переносят самый широкий кластер в отдельную центрированную строку.
- Фоны поля контента и сравнения Sandbox используют те же theme-aware design tokens, что и кластеры тулбара.
- Sandbox при загрузке читает редактируемый `sandbox/content.txt` без кэша и принимает его содержимое за исходное состояние статистики и сравнения; сырой HTML в файле не обрабатывается как документ.
- В Sandbox рядом с темой добавлен отдельный циклический эмоджи-переключатель лэйаута `news → longread → photoreport`; он меняет штатный `layout_select`, поэтому контекст и доступные команды обновляются тем же путём, что в админке.
- В редакторском `roadmap` команда подготовки расписания перенесена сразу после Cleanup, Reader теперь предшествует Audit, а экспериментальная Strip удалена из набора.
- Попапы полей циклируются по `Alt+\`` в порядке `lead → excerpt → titles → slug` без закрытия активного окна, сохраняют единую геометрию хедера, удерживают фокус команд на своём активном вводе и временно блокируют ручное редактирование основного `content`; применение лида обозначено глифом `Subtitles`, обновляет первый абзац, цитату и переводит в попап `excerpt`, а пустое состояние лида не показывает служебный placeholder или сообщение об отсутствующем абзаце.
- Lead распознаёт первый содержательный абзац, начинающийся с inline HTML-тега, и подсвечивает HTML/шорткоды в поле редактирования тем же общим токенизатором и палитрой, что Reader.
- Audit now selects LanguageTool, Gemini, and Qwen through one engine cycle. LanguageTool results are prefetched in the background but enter the review only after explicit activation; the editorial chain opens Lead only after the foreground Audit review is closed, so the next popup cannot overlap or lock an active Audit panel.
- На узких экранах все попапы полей используют единый двухрядный хедер с сохранёнными крайними отступами; в Titles доступные типы заголовков переключаются между стрелками или вертикальным свайпом по анимированному барабану.
- Audit and admin field popups now share the responsive header layout contract: controls are distributed evenly on wide panels and move to a measured second row before they can overlap on narrow screens.
- Audit keeps its manual result export implemented but hides the download control and its separator behind the shared `data-ui-availability="deferred"` marker while telemetry remains the primary collection path.
- Audit defers the API-key page prompt and asks for each missing provider key at most once while its popup remains open; closing Audit resets that prompt guard.
- Qwen remains implemented in Audit but is marked `deferred`, so the current engine cycle exposes only LanguageTool and Gemini.
- Audit and its reusable review surface initialize at `bottom-center`; their controller reapplies that shared placement during layout reflow instead of falling back to `top-center`, and the editorial chain inherits the same default.
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

- В цепной проверке Lead и цитата завершаются до запуска Audit; проверка модели затем выполняется в фоне без блокировки редактора, а панель Audit появляется только с готовыми предложениями.
- Команда очистки форматирования снова распознаёт `<em>` и `<strong>` в выбранном диапазоне или после курсора, корректно снимает оформление внутри окружающей пары тегов и сохраняет валидное форматирование за границами очищаемого фрагмента.
- Ledger больше не падает с `undefined.schema`, если групповой модуль отсутствует в устаревшей сборке: актуальная сборка проверяет фактическое встраивание модуля, а runtime показывает понятную диагностическую ошибку.
- Повторное применение `italic` и `bold` теперь снимает активное оформление в HTML- и visual-режимах вместо наращивания вложенных `<em>` и `<strong>`.
- Reader сохраняет совпадение курсора с цветным слоем на границах HTML-токенов: подсветка наносится диапазонами поверх цельного текста без влияющих на переносы `span`, а завершающая пустая строка повторяет поведение `textarea`.
- On iOS and iPadOS, pre-submit telemetry ZIPs enter a local IndexedDB backup
  with a 24-hour expiry before Safari opens its download confirmation; an
  unchanged retry reuses the backup and offers the same archive again.
- Cleanup приводит кириллические и смешанные обозначения столетий вроде `ХХ век` и `ХIХ век` к корректным латинским римским цифрам.
- Cleanup исправляет визуально неотличимые латинские `I/i` на кириллические `І/і` внутри смешанных кириллических слов вместе с остальными омоглифами.
- Cleanup сохраняет дефисы в телефонных фрагментах вида `123-45-67` и приводит тиреподобные разделители в них к обычному дефису.
- Команды Left и Right переставляют отдельные слова внутри `<em>` и `<strong>`, не захватывая закрывающий тег вместе с хвостовой пунктуацией.
- Reader no longer treats taps inside floating panels or modal surfaces as page double-tap gestures, so Audit row selection and accept/dismiss controls receive their click events on touch devices.
- Audit uses delegated result-list actions so accept, dismiss, search, and whole-row activation survive rerenders; while Reader is active, editor mutations use its HTML textarea as the source of truth instead of allowing a stale TinyMCE instance to overwrite the text.
- Ввод инструкции `Edits` перенесён с full-screen modal overlay на floating host-панель по контракту Feedback/admin; review получил компактную шапку без Audit-only контролов, непрозрачные theme-aware карточки и общие размеры кластеров.
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
