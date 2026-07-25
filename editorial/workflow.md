# Workflow

## Rule Sources

Этот файл — пользовательский операционный workflow. Он описывает, как тестировать пайплайн `source.json → draft.json → админка`, но не описывает реализацию Launchpad и не заменяет редакционные правила.

Файл описывает пользовательский workflow для связки Launchpad, ChatGPT Project и админки.

## Цель

Получить из внешнего источника машинный `draft.json` или `*_draft.json`, который Launchpad сможет загрузить в админку и создать новую запись-черновик.

Пайплайн:

```text
внешняя страница
→ Launchpad собирает source.json
→ новый чат в ChatGPT Project
→ ChatGPT возвращает draft.json
→ Launchpad создает draft в админке
→ журналист проверяет черновик
```

## Правило Одного Материала

Один материал — один чат в Project. Не смешивай несколько источников и несколько будущих новостей в одном чате, если они не должны стать одним материалом.

## Имена Файлов

Базовые имена:
- `source.json` — вход из Launchpad;
- `draft.json` — выход из ChatGPT.

Для файлов Launchpad используй суффиксы:
- `20260629_belavia-delay_source.json`;
- `20260629_belavia-delay_draft.json`.

Правило: меняется только суффикс `_source.json` → `_draft.json`. Timestamp, host и остальная база имени сохраняются.

Импортер должен ориентироваться на поле `schema`, а не только на имя файла:
- `schema: "source.v1"` — входной source;
- `schema: "draft.v1"` — готовый draft для админки.

## Стандартный Пользовательский Workflow

1. Открой внешний источник новости.
2. В Launchpad нажми команду `agent` или команду сборки source.
3. Launchpad должен скачать/подготовить `source.json` или файл вида `*_source.json`.
4. Открой новый чат внутри ChatGPT Project.
5. Прикрепи `source.json`.
6. Вставь prompt из `prompt.md`.
7. Получи файл `draft.json` или `{topic}_draft.json`.
8. Загрузи `draft.json` в админку через Launchpad-команду создания черновика.
9. Проверь созданный draft: заголовок, content, цитату, рубрики, теги и `audit`.

## Agent Prompt

Стандартный prompt для команды `agent` хранится в `prompt.md`, в блоке `Agent Prompt`.

Launchpad должен копировать prompt из `prompt.md` в буфер обмена. Не дублируй полный контракт payload в Launchpad: source of truth находится в project files.

Prompt запускает маршрут, но не хранит подробные правила полей. Правила `section`, `categories`, `slug`, `tags`, `excerpt`, `audit`, `options`, `assets` и HTML живут в `taxonomy.md`, `payload.md`, `output.md` и `checklist.md`.

Если изменился блок `Agent Prompt`, нужно обновить строку `agentPromptValue` в `src/actions.js`. Если меняются только подробные правила полей без изменения маршрута и placeholders, Launchpad prompt обычно менять не нужно.

## Ожидаемый Результат

ChatGPT должен создать файл `draft.json` или вернуть JSON такой формы, если файл создать невозможно:

```json
{
  "schema": "draft.v1",
  "status": "draft",
  "target": {
    "section": "",
    "layout": "news",
    "categories": []
  },
  "fields": {
    "title": "",
    "slug": "",
    "rotation_titles": [],
    "seo_title": "",
    "lead": "",
    "content_html": "",
    "excerpt": "",
    "tags": []
  },
  "options": {
    "enableComments": false,
    "enableReactions": true,
    "includeDzen": false,
    "juicyVideo": false,
    "updated": false,
    "livecast": false,
    "mainPageFavorite": false,
    "mark_on_list_page": false
  },
  "assets": {
    "thumbnail": null,
    "images": []
  },
  "audit": {
    "source_links": [],
    "fact_check_notes": [],
    "risk_notes": [],
    "editor_todo": []
  }
}
```

## Проверка Перед Импортом

Перед загрузкой в админку проверь:
- ответ является валидным JSON;
- `schema` = `draft.v1`;
- `target.section` выбран по `taxonomy.md` или явно оставлен пустым с задачей в `audit.editor_todo`;
- `target.categories` принадлежат выбранному section по `taxonomy.md`;
- `fields.title` не пустой;
- `fields.content_html` не содержит служебный audit;
- `assets.thumbnail` = `null`;
- `assets.images` = `[]`;
- риски, включая риск близкого рерайта, лежат в `audit`, а не в публикационном тексте;
- теги из `fields.tags` проверены по существующим меткам админки или явно оставлены как suggestions;
- `options` заполнены явно и не включают промо/выделение без основания.
