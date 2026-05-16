# Bookmarklet Presentation Skill

## Purpose

Generate compact user-facing descriptions for bookmarklets based on their source code and metadata.

This skill is not for explaining implementation.
It is for presenting bookmarklets to potential users who may not know what bookmarklets are.

The output must help a user quickly understand:

- what the bookmarklet does
- why they would click it
- when to use it
- what visible result to expect
- whether it is safe

## Core Rule

Presentation is not a code summary.

Do not describe how the code works.
Describe why a newsroom user would run it and what changes they will see.

Bad:

- Traverses DOM nodes
- Runs normalization pipeline
- Dispatches input events
- Uses regex replacements

Good:

- Очищает лишнее форматирование
- Подготавливает статью к переработке
- Заполняет SEO-поля
- Исправляет типографику

## User Context

All bookmarklets are used internally by a Russian-speaking editorial newsroom of a large online media outlet.

Users are:

- editors
- content managers
- newsroom staff
- producers
- journalists

Users are not developers.

Descriptions must use familiar editorial vocabulary and newsroom workflows.

Prefer:

- статья
- публикация
- редактор
- заголовок
- цитата
- автор
- SEO
- карточка
- виджет
- фото
- видео
- лента
- новость

Avoid generic technical wording such as:

- контентная сущность
- DOM
- pipeline
- transformation
- normalization
- automation layer

Avoid startup/SaaS tone.

The style should feel like internal editorial tooling used daily inside a newsroom.

## Editorial Vocabulary

Prefer editorial wording over generic technical wording.

Preferred wording:

- статья
- текст
- публикация
- редактор
- поле
- карточка
- блок
- заголовок
- SEO title
- цитата
- автор
- источник
- лид
- подпись
- фото
- видео

Avoid replacing familiar editorial terms with abstract equivalents.

Bad:

- материал
- сущность
- запись
- объект
- данные публикации

Good:

- статья
- текст статьи
- поля статьи
- публикация

## Positioning

Bookmarklets are operational newsroom tools.

Descriptions should feel like:

- internal editor utilities
- workflow shortcuts
- daily-use actions

Not like:

- consumer products
- AI assistants
- productivity marketing
- browser extension marketplaces

## Tone Rules

Descriptions must sound:

- practical
- controlled
- operational
- predictable

Avoid sounding:

- experimental
- magical
- overly automated
- destructive unless necessary

Prefer:

- очищает выбранные поля
- исправляет форматирование
- обновляет SEO
- подготавливает статью

Avoid:

- полностью перерабатывает
- автоматически оптимизирует
- полностью заменяет
- интеллектуально улучшает

## Presentation Goal

The description must answer the user's real question:

"Зачем мне это нажимать?"

The first visible text must explain the workflow value, not list modified fields.

Bad:

- Очищает поля статьи и приводит текст к редакционному формату

Good:

- Убирает старое оформление, чтобы подготовить статью заново

## Input

Use available sources in this priority order:

1. Bookmarklet name / id
2. Existing title or label
3. Emoji/icon, if already defined
4. Source code
5. README or nearby project notes
6. File name and folder context

Do not invent behavior that is not supported by the code.

If the code is ambiguous, use cautious wording.

## Output Schema

Return structured JSON only:

```json
{
  "emoji": "",
  "title": "",
  "category": "",
  "summary": "",
  "effects": [],
  "usage": "",
  "warnings": [],
  "destructive": false,
  "confidence": "high"
}
```

## Field Rules

### emoji

Required.

Use the existing bookmarklet emoji if it is already defined in metadata.

If no emoji exists, infer one conservatively from the user-facing purpose.

Examples:

- cleanup → 🧹
- formatting → ✨
- SEO → 🔎
- media/photo → 🖼️
- video → 🎬
- widgets → 🧩
- validation/check → ✅
- warning/risk → ⚠️
- copy/export → 📋

Do not use more than one emoji.
Do not use playful or unclear emoji.

### title

Required.

This is the visible bookmarklet name next to the emoji.

It must explain the user-facing purpose, not mirror the internal function name.

Prefer short newsroom action names.

Good:

- Сбросить статью
- Почистить текст
- Проверить виджеты
- Собрать SEO
- Починить фото

Bad:

- Очистить статью
- Cleanup
- Нормализация
- Обработка статьи

The title should immediately help a newsroom user understand why to click it.

### category

One short category.

Allowed examples:

- cleanup
- formatting
- seo
- media
- widgets
- validation
- import
- publishing
- utility

If unclear, use `utility`.

### summary

One sentence, max 80 characters.

Explain the workflow value and expected result.

Good:

- Убирает старое оформление, чтобы подготовить статью заново
- Исправляет типографику после вставки текста
- Подготавливает SEO-поля перед публикацией

Bad:

- Автоматизирует работу
- Делает обработку страницы
- Улучшает контент
- Очищает поля статьи и приводит текст к редакционному формату

### effects

3–6 short bullet-style strings.

Each item must describe a visible or meaningful user-facing effect.

Good:

```json
[
  "очищает основной текст",
  "удаляет лишние HTML-обёртки",
  "исправляет пробелы и кавычки",
  "обновляет поля редактора"
]
```

Bad:

```json
[
  "вызывает normalizeText",
  "проходит по textarea",
  "использует querySelectorAll",
  "диспатчит input/change"
]
```

### usage

One short sentence describing when to use it.

Good:

- Используйте перед повторной подготовкой старой статьи.
- Используйте после вставки текста из внешнего источника.
- Используйте перед финальной проверкой публикации.

If unclear, use an empty string.

### warnings

Only include important user-facing limitations.

Good:

```json
[
  "не сохраняет статью автоматически",
  "работает только на странице редактирования",
  "перезаписывает выбранные поля"
]
```

Bad:

```json
["может работать нестабильно", "использует DOM", "есть регулярные выражения"]
```

### destructive

Set to `true` if the bookmarklet removes, overwrites, resets, publishes, sends, deletes, or irreversibly changes user content.

Set to `false` if it only reads, previews, copies, highlights, validates, or formats non-destructively.

If unsure, use `true`.

### confidence

Use:

- `high` — behavior is clear from code
- `medium` — main behavior is clear, details uncertain
- `low` — intent is inferred from weak signals

## Language

Use Russian for all user-facing text.

Keep wording simple and editorial.

Avoid technical English unless it is already a user-facing product term, such as SEO.

## Compression Rules

Users should understand the tooltip in 5–10 seconds.

Maximums:

- title: 3 words
- summary: 80 characters
- effects: 6 items
- each effect: 40 characters
- warnings: 3 items

Prefer shorter.

## Vocabulary Rules

Use user vocabulary, not code vocabulary.

Translate implementation terms:

- textarea/input → поле
- post content → текст статьи / контент статьи
- excerpt → цитата
- post title → заголовок
- rotation_titles → заголовки ротации
- meta fields → служебные поля
- dispatch events → обновляет редактор
- DOM cleanup → очищает лишнюю разметку
- normalization → исправляет форматирование
- HTML entities → HTML-сущности
- shortcode → шорткод
- widget → виджет

## Safety and Trust

Always mention if the bookmarklet:

- changes article text
- clears fields
- overwrites values
- cannot be undone automatically
- does not save automatically
- only works on specific pages

Do not overstate safety.

If it modifies fields but does not click Save/Publish, add:

```json
"warnings": ["не сохраняет статью автоматически"]
```

## Extraction Process

When analyzing code, follow this order:

1. Identify the page/context where it runs.
2. Identify the main newsroom workflow goal.
3. Identify visible article/editor changes.
4. Identify what it does not do automatically.
5. Remove implementation details completely.
6. Compress into the schema.

## Quality Checklist

Before final output, verify:

- Would a non-technical editor understand this?
- Is the reason to click obvious immediately?
- Is the workflow value clear in one sentence?
- Are risky effects disclosed?
- Are implementation details removed?
- Are there no vague claims like “ускоряет работу”?
- Is every claim grounded in code?
- Does the wording sound like internal newsroom tooling?

## Example

Input behavior:

- reads WordPress editor fields
- cleans title, SEO title, authors, excerpt, content
- normalizes HTML and text
- does not submit form

Output:

```json
{
  "emoji": "🧹",
  "title": "Сбросить статью",
  "category": "cleanup",
  "summary": "Убирает старое оформление, чтобы подготовить статью заново",
  "effects": [
    "очищает заголовок и SEO",
    "чистит цитату и текст",
    "исправляет пробелы и кавычки",
    "обновляет источник и авторов"
  ],
  "usage": "Используйте после вставки или переделки старой статьи.",
  "warnings": [
    "перезаписывает поля статьи",
    "не сохраняет статью автоматически"
  ],
  "destructive": true,
  "confidence": "high"
}
```

## Final Rule

If the output sounds like developer documentation, rewrite it.

The result must sound like a compact newsroom tool description for editors.
