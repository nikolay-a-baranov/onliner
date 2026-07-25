# Prompt

## Rule Sources

Этот файл — операционный файл и source of truth для Launchpad agent clipboard prompt.

Блок `Agent Prompt` должен содержать только текст prompt, который Launchpad кладет в буфер или вставляет в новый чат. Не вставляй сюда `source.json`: Launchpad добавляет source ниже сообщения отдельным fenced-блоком.

Prompt не дублирует подробные правила полей `draft.v1`. Правила `fields.slug`, `fields.tags`, `fields.excerpt`, `audit`, `assets` и `content_html` живут в `payload.md`, `output.md` и `checklist.md`. Prompt только запускает маршрут через `index.md`, `taxonomy.md` и профильные project files.

Обновляй блок `Agent Prompt`, если меняются:
- имена placeholders;
- правило именования файлов;
- способ передачи source;
- требование file-output/JSON fallback;
- список project files, через которые запускается маршрут.

Не обновляй prompt при изменении подробных правил `slug`, `tags`, `excerpt`, `audit` или HTML, если имена файлов и маршрут не изменились. Эти правила должны оставаться в профильных project files.

После изменения блока `Agent Prompt` отдельно синхронизируй строку `agentPromptValue` в `src/actions.js`.

## Agent Prompt

```md
draft-json

Из source.json ниже, который нужно считать файлом `{{sourceFilename}}` со schema `source.v1`, создай файл `{{draftFilename}}` со schema `draft.v1`.

Имя результата должно отличаться от имени исходного файла только суффиксом: `_source.json` → `_draft.json`. Timestamp, host и остальную базу имени не меняй.

Используй `index.md` как маршрутизатор и следуй правилам из `taxonomy.md`, `payload.md`, `editorial.md`, `source.md`, `verification.md`, `rewrite.md`, `titles.md`, `output.md`, `checklist.md` и, если источник содержит данные об изображениях, `photos.md`.

Перед сборкой `draft.v1` классифицируй материал по `taxonomy.md`. Заполни `draft.v1` строго по `payload.md`, `output.md` и `checklist.md`. Не выдумывай факты; всё непроверенное вынеси в `audit`. Оцени риск близкого рерайта по `rewrite.md`.

Ответ дай файлом `{{draftFilename}}`. В чат не выводи содержимое JSON.

После файла первой строкой выведи: `Лучшее место: https://{{section}}.onliner.by/wp-admin/post-new.php`, где `{{section}}` — выбранный `target.section`. Если section не определен, выведи `Лучшее место: уточнить раздел`.

Затем выведи короткий блок `Для автора` на 3–7 пунктов. Используй только важные предупреждения из `audit.fact_check_notes`, `audit.risk_notes` и `audit.editor_todo`. Не пересказывай материал и не дублируй JSON.

Если файл создать невозможно, выведи только валидный JSON без markdown, code fence, комментариев и текста до/после JSON.
```

## Placeholder Rules

- `{{sourceFilename}}` подставляет Launchpad.
- `{{draftFilename}}` подставляет Launchpad.
- `{{section}}` в строке `Лучшее место` не подставляет Launchpad; агент заменяет его выбранным `target.section` из `draft.v1`.
- Обычное правило имени: `*_source.json` → `*_draft.json`.
- Timestamp, host и остальная база имени не меняются.

## Launchpad Sync Rule

При изменении блока `Agent Prompt` обнови строку `agentPromptValue` в `src/actions.js`. Project files хранят актуальный текст prompt, но Launchpad исполняет свою копию из кода.

## Responsibility Boundary

`prompt.md` не является местом для правил генерации отдельных полей.

- `taxonomy.md` — классификация `target.section` и `target.categories`.
- `payload.md` — schema и правила `fields.slug`, `fields.tags`, `fields.excerpt`, `assets`, `audit`.
- `output.md` — связь полей `draft.json` с админкой и `content_html`.
- `checklist.md` — финальная проверка готовности `draft.json`.
- `rewrite.md` — оценка риска близкого рерайта.
- `photos.md` — правила фото/media, когда media-интеграция появится.

Prompt должен оставаться коротким и стабильным. Он запускает маршрут, но не становится вторым source of truth для правил.
