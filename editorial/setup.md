# Setup

## Rule Sources

Этот файл описывает ручное развёртывание ChatGPT Project и обновление существующего проекта. Это операционная инструкция, а не редакционный документ и не техническая реализация Launchpad.

## Fresh Install

1. Создай новый ChatGPT Project.
2. Назови проект, например: `Onliner Editorial AI`.
3. Открой `project.md` и вставь его содержимое в Project Instructions.
4. Загрузи как Project files файлы из папки `sources/`:
   - `sources/index.md`
   - `sources/taxonomy.md`
   - `sources/payload.md`
   - `sources/editorial.md`
   - `sources/source.md`
   - `sources/verification.md`
   - `sources/rewrite.md`
   - `sources/titles.md`
   - `sources/photos.md`
   - `sources/output.md`
   - `sources/checklist.md`
5. Используй `setup.md` и `update.md` как памятки, но не загружай их в Project files.
6. Синхронизируй Launchpad agent prompt: скопируй блок `Agent Prompt` из `prompt.md` в строку `agentPromptValue` в `src/actions/editorial.js`.
7. Сделай smoke test по `workflow.md`.

## Update Existing Project

Короткая инструкция для обновления вынесена в `update.md`.

При обновлении не обязательно удалять и перезаливать все файлы. Используй список changed files из ответа с архивом.

Обычно:
- `project.md` заменяется в Project Instructions;
- изменённые `.md` заменяются в Project files;
- новые `.md` добавляются;
- неизменённые `.md` не трогаются.

Если в Project остались старые версии файлов с теми же именами и ChatGPT видит обе версии, удали старые, чтобы не было конфликтов.

## Launchpad Prompt Sync

`prompt.md` — source of truth для Launchpad agent prompt, но фактически Launchpad исполняет строку из кода.

После каждого изменения блока `Agent Prompt`:

1. Найди блок `Agent Prompt`.
2. Скопируй только содержимое fenced-блока.
3. Обнови `agentPromptValue` в `src/actions/editorial.js`.
4. Убедись, что placeholders `{{sourceFilename}}` и `{{draftFilename}}` не заменены конкретными именами.
5. Убедись, что Launchpad добавляет source.json ниже prompt отдельным fenced-блоком.

Если меняются только подробные правила `section`, `categories`, `slug`, `tags`, `excerpt`, `audit`, `options`, `assets` или HTML, но маршрут, placeholders, список route files и file-output не меняются, `agentPromptValue` обычно не обновляется. Эти правила читаются из Project files.

## Smoke Test

1. На внешней странице собери `*_source.json` через Launchpad.
2. Открой новый чат в ChatGPT Project.
3. Вставь agent prompt из Launchpad.
4. Убедись, что source JSON добавлен ниже сообщения отдельным fenced-блоком.
5. Получи файл `*_draft.json`.
6. Проверь, что внутри:
   - `schema` = `draft.v1`;
   - есть `target.section`;
   - `target.categories` соответствуют `taxonomy.md` или есть задача в `audit.editor_todo`;
   - есть `fields.slug`;
   - `fields.tags` с большой буквы;
   - `options` заполнены явными boolean-значениями;
   - `assets.thumbnail` = `null`;
   - `assets.images` = `[]`;
   - риски и проверки лежат в `audit`.
7. Импортируй `*_draft.json` в админку через Launchpad.
8. Проверь, применились ли title, content, excerpt, categories, tags, slug и options.

## Known Manual Steps

Официально поддерживаемого способа создать ChatGPT Project, установить Project Instructions и загрузить Project files из внешней команды сейчас не предполагается в этом workflow.

Предпочтительный способ развёртывания для другого человека — shared Project, если он доступен. Альтернатива — ручной Fresh Install по этому файлу.

Браузерная автоматизация ChatGPT UI теоретически возможна, но хрупкая и не входит в MVP.
