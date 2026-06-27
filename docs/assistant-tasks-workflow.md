# Assistant Tasks Workflow

Этот файл нужен, чтобы в любом новом чате быстро восстановить рабочий процесс с VS Code tasks: audit → handoff → patch archive.

## Общая модель

Работаем patch-oriented.

Перед изменениями сначала собираем контекст через task:

- `mode=audit` — получить текстовый отчёт по файлам/паттернам.
- `mode=handoff` — собрать zip с актуальными файлами для правки.

Assistant не должен править проект “по памяти”. Если есть риск, что локальные файлы изменились, сначала просим свежий handoff.

Готовый результат от Assistant должен быть `.zip`-архивом только с изменёнными файлами и repository-relative paths внутри архива.

## Как запускать task

В VS Code:

1. Открыть Command Palette.
2. Выбрать `Tasks: Run Task`.
3. Запустить `assistant: request block`.
4. Вставить одну строку запроса целиком.
5. После выполнения взять созданный файл:
   - audit: `.reports/<label>-YYYYMMDD_HHMMSS.txt`
   - handoff: `.handoff/<label>-YYYYMMDD_HHMMSS.zip`
6. Загрузить этот файл в чат.

## Формат request block

Одна строка, поля разделяются через `;;;`.

```text
mode=<audit|handoff>;;; label=<short-label>;;; ...
```

Поля можно писать с пробелами вокруг `=`. Значения вставляются как есть.

## Handoff

Используется, когда Assistant должен посмотреть актуальные файлы или сделать патч.

Формат:

```text
mode=handoff;;; label=<archive-label>;;; files=<repo-relative-file-1>, <repo-relative-file-2>
```

Пример:

```text
mode=handoff;;; label=host-cleanup;;; files=src/core/surface/host.js, src/core/surface/styles.js, src/core/surface/design.js
```

Что делает task:

- берёт указанные файлы из текущего репозитория;
- сохраняет zip в `.handoff/`;
- сохраняет пути внутри архива относительно корня репозитория;
- добавляет `MANIFEST.txt`.

Как использовать в чате:

- загрузить zip;
- написать, что именно надо проверить/исправить;
- Assistant должен менять только файлы из handoff, если не попросит дополнительные source-of-truth файлы.

## Audit

Используется, чтобы быстро найти usage/imports/legacy names/потенциальные места правки.

Формат:

```text
mode=audit;;; label=<report-label>;;; paths=<repo-relative-paths>;;; includes=<glob>; <glob>;;; pattern=<PowerShell/.NET regex>
```

Минимальный пример:

```text
mode=audit;;; label=surface-imports;;; paths=src;;; includes=*.js;;; pattern=from\s+["'].*[/\\]panel\.js["']|from\s+["'].*[/\\]host\.js["']
```

Что делает task:

- проходит по указанным `paths`;
- фильтрует файлы по `includes`;
- ищет строки по `pattern`;
- сохраняет текстовый отчёт в `.reports/`.

Как использовать в чате:

- загрузить `.txt` отчёт;
- Assistant анализирует результаты и решает, нужен ли patch, handoff или ещё один audit.

## Типовые request blocks

### Проверить импорты surface modules

```text
mode=audit;;; label=surface-module-final;;; paths=src;;; includes=*.js;;; pattern=from\s+["'].*[/\\]panel\.js["']|from\s+["'].*[/\\]css\.js["']|from\s+["'].*[/\\]host\.js["']|from\s+["'].*[/\\]styles\.js["']
```

### Собрать handoff по surface core

```text
mode=handoff;;; label=surface-core;;; files=src/core/surface/host.js, src/core/surface/styles.js, src/core/surface/ui.js, src/core/surface/design.js
```

### Проверить legacy names внутри файлов

```text
mode=audit;;; label=host-styles-legacy-names;;; paths=src/core/surface/host.js, src/core/surface/styles.js;;; includes=*.js;;; pattern=\bpanel\b|\bcss\b|\bskin\b|\bframe\b|css\.|panel\.|styles\.panel|host\.frame
```

### Найти импорты старого css module

```text
mode=audit;;; label=css-module-imports;;; paths=src;;; includes=*.js;;; pattern=from\s+["'].*[/\\]css\.js["']|import\s+\{\s*css\s*\}|import\s+\{\s*styles\s*\}|from\s+["'].*[/\\]styles\.js["']
```

## Что Assistant должен делать с handoff archive

1. Распаковать архив.
2. Определить ответственность файлов.
3. Найти source of truth и зависимости.
4. Классифицировать работу:
   - analysis only
   - targeted patch
   - local cleanup
   - structural refactor
   - cross-file refactor
5. Делать минимальный maintainable patch.
6. Создать новый zip только с изменёнными файлами.
7. В ответе указать:
   - ссылку на архив;
   - changed files;
   - краткое summary;
   - какие проверки запускались.

## Проверки перед выдачей patch archive

Для изменённых JS файлов:

```text
node --check <file>
```

Если затронуты `design.js` или `styles.js`, желательно также проверить:

- generated CSS не содержит `undefined`;
- facade imports работают;
- старые compatibility exports не сломаны.

## Архитектурные правила проекта

Текущие решения:

- `host.js` — основной модуль floating frame / host runtime.
- `panel.js` — compatibility facade, не рабочий API для новых импортов.
- `styles.js` — основной модуль CSS generators.
- `css.js` — compatibility facade, не рабочий API для новых импортов.
- `.panel`, `--panel-*`, `data-panel-*`, `#*-panel` пока считать DOM/CSS compatibility contract, не переименовывать без отдельного плана.
- `skin` — допустимое имя для CSS block конкретной surface/action.
- `theme` — shared/base visual mode.
- `styles` — модуль CSS generators.

Не делать:

- широкие переименования DOM/CSS классов без audit;
- удаление facades без финального import audit;
- дробление `ui.js` на много модулей без repo-level/Codex анализа;
- speculative abstractions.

## Как продолжать в новом чате

В начале нового чата можно загрузить этот файл и написать:

```text
Работаем по инструкции из assistant-tasks-workflow.md. Продолжаем patch-oriented через audit/handoff tasks. Сначала анализ, потом минимальный patch archive.
```

Дальше дать либо audit report, либо handoff zip.
