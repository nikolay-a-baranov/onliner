# Payload

Файл описывает машинный контракт для пайплайна:

```text
source.json или обычный текст
→ ChatGPT Project
→ draft.json
→ админка создает новый draft
```

## Rule Sources

Этот файл — операционный контракт, а не редакционный документ.

Редакционные правила берутся из `editorial.md`, `source.md`, `verification.md`, `rewrite.md`, `titles.md`, `photos.md` и `checklist.md`.

Операционные правила пайплайна живут здесь, в `output.md` и `checklist.md`. К ним относятся schema `source.v1`/`draft.v1`, `target.section`, `target.categories`, `fields.slug`, формат `fields.excerpt`, стиль `audit.*`, suggested tags, explicit `options`, отключенная media-интеграция и правило выдачи `draft.json` файлом. Source of truth для section/categories — `taxonomy.md`.

Не переносить сюда детали реализации Launchpad: DOM-селекторы, endpoint’ы, nonce, кнопки, clipboard и создание записи в админке.

Не дублируй подробные правила полей в ответе пользователю. Для `section`, `categories`, `slug`, `tags`, `excerpt`, `audit`, `options`, `assets` и HTML используй профильные правила из Project files.

## Главный принцип

`source.json` — предпочтительный вход. Обычный текст допустим как fallback.

`draft.json` — единственный машинный output для импорта в админку. Он создает черновик, не публикацию.

Служебные заметки, риски и вопросы не вставляются в `fields.content_html`. Они живут только в `audit`.

Если пользователь просит файл, создай и приложи файл с именем, указанным в запросе. Для Launchpad используется правило `*_source.json` → `*_draft.json`: timestamp, host и база имени сохраняются, меняется только суффикс. В чат не выводи содержимое JSON; дай только короткое сообщение о готовности файла. Если файл создать невозможно, для `source.v1 → draft.v1` отвечай только валидным JSON без markdown, без пояснений, без комментариев и без code fence.

## Source.json

Минимальная schema:

```json
{
  "schema": "source.v1",
  "mode": "source-news",
  "target": {
    "categories": [],
    "layout": "news",
    "language": "ru",
    "length": "short"
  },
  "source": {
    "url": "",
    "canonical_url": "",
    "site": "",
    "title": "",
    "description": "",
    "published_at": "",
    "updated_at": "",
    "author": "",
    "text": "",
    "html": "",
    "images": [],
    "links": []
  },
  "editor": {
    "notes": ""
  }
}
```

### Source.json Fields

- `schema`: всегда `source.v1`.
- `mode`: обычно `source-news`.
- `target.categories`: человекочитаемые названия рубрик Onlíner, если они известны. Если неизвестны — пустой массив.
- `target.section`: optional extraction-подсказка. Если оно есть во входе, учитывай его как подсказку, но финальный `draft.target.section` классифицируй заново по `taxonomy.md`.
- `target.layout`: по умолчанию `news`.
- `target.language`: язык будущего черновика.
- `target.length`: `short`, `medium` или `long`.
- `source.url`: URL страницы источника.
- `source.canonical_url`: canonical URL, если удалось получить.
- `source.site`: название сайта/домена.
- `source.title`: заголовок источника.
- `source.description`: meta/og description, если есть.
- `source.published_at`: дата публикации, если есть.
- `source.updated_at`: дата обновления, если есть.
- `source.author`: автор источника, если есть.
- `source.text`: очищенный основной текст.
- `source.html`: очищенный HTML основного блока, если есть.
- `source.images`: массив изображений с `src`, `alt`, `title`, `caption`, если есть.
- `source.links`: массив ссылок с `url` и `text`, если есть.
- `editor.notes`: указания журналиста.

## Draft.json

Минимальная schema:

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

### Operational Rules Added During Testing

Эти правила не являются цитатами из исходных редакционных документов. Это рабочие требования пайплайна `source.json → draft.json → админка`:

- `fields.slug` обязателен для permalink: суть выбирается на русском и транслитерируется, а не переводится на английский.
- `fields.excerpt` заполняет поле “Цитата” и должен быть около 400 символов.
- `fields.tags` содержит suggested tags: короткие предложения модели, а не гарантированно существующие термины админки.
- `options` содержит явные boolean-настройки записи, если ими управляет агент; не оставляй такие решения implicit.
- `audit.fact_check_notes`, `audit.risk_notes` и `audit.editor_todo` формулируются как короткие практические предупреждения автору.
- `assets.thumbnail` и `assets.images` отключены до отдельной media-интеграции.
- Машинный output должен быть валидным `draft.json` и, если возможно, отдаваться файлом.

### Draft.json Fields

- `schema`: всегда `draft.v1`.
- `status`: всегда `draft`.
- `target.section`: классифицированный целевой раздел из `taxonomy.md`, если агент уверен. Если не уверен — пустая строка `""` и задача в `audit.editor_todo`.
- `target.layout`: обычно `news`. Используй другое значение только при явной причине.
- `target.categories`: suggested WordPress categories, только exact labels из allowed categories выбранного `target.section` в `taxonomy.md`. Не ID. Не создавай новые рубрики. Если уверенности нет — оставь пустой массив или минимальный безопасный набор и добавь “Уточнить рубрику” в `audit.editor_todo`.
- `fields.title`: основной заголовок.
- `fields.slug`: человекочитаемый slug для WordPress permalink. Сначала выбери короткую суть новости на русском, затем транслитерируй ее в латиницу. Не переводи смысл на английский. Используй lowercase, дефисы вместо пробелов, без спецсимволов. До замены пробелов на дефисы русская смысловая фраза должна быть не длиннее 34 символов; итоговый slug тоже держи коротким и понятным. Slug должен быть устойчивым: без дат, мусорных слов и чрезмерных деталей, если они не нужны для различения новости.
- `fields.rotation_titles`: до 3 альтернативных заголовков. Это массив строк.
- `fields.seo_title`: SEO-заголовок, если уместно. Если отдельный SEO-заголовок не нужен, можно повторить `fields.title` или оставить пустую строку.
- `fields.lead`: короткий лид без HTML. Это не служебная заметка.
- `fields.content_html`: публикационный HTML тела материала для `textarea#content`. Не содержит `title`, `audit`, заметки редактору или служебные предупреждения.
- `fields.excerpt`: цитата/выжимка для поля “Цитата”, около 400 символов. Не обрезай предложение механически. Текст должен быть самостоятельным, понятным автору и пригодным для редакторского поля. Без HTML. Не выдумывай прямую речь. Не упоминай источник, издание, сайт, СМИ или материал: `excerpt` не должен содержать служебную атрибуцию вроде “источник сообщает”, “издание пишет”, “в материале говорится”, “по данным СМИ”. Если факт требует проверки источника, вынеси это в `audit`, а не в `fields.excerpt`.
- `fields.tags`: 3–7 коротких suggested tags без хэштегов и дублей, только если они явно следуют из материала. Каждый тег пиши с большой буквы. Для составных русских тегов используй естественную капитализацию: `Искусственный интеллект`, а не `Искусственный Интеллект`. Предпочитай очевидные существующие редакционные/админские термины. Не добавляй узкие одноразовые метки, случайные имена людей, слишком длинные фразы и SEO-ключи. Если метка сомнительная или новая — лучше `audit.editor_todo`, чем `fields.tags`. Project только предлагает теги; importer должен сверять их с существующими метками админки.
- `options.enableComments`: `false` по умолчанию. Ставь `true` только для материалов в `sport`, `tech` и `auto`. Для `auto` ставь `true` только если материал не про ДТП, аварию, наезд, погибших, пострадавших или другой аварийный/травматичный контекст. Если комментарии отключены из-за раздела или риска, добавь короткую причину в `audit.editor_todo`.
- `options.enableReactions`: `true` по умолчанию. Можно поставить `false` для чувствительных материалов; добавь причину в `audit.editor_todo`.
- `options.includeDzen`: `false` по умолчанию. Не включай без явного основания.
- `options.juicyVideo`: `false` по умолчанию. Включай только если материал действительно строится вокруг видео и это явно нужно.
- `options.updated`: `false` по умолчанию. Включай только если материал является обновлением существующей/текущей новости.
- `options.livecast`: `false` по умолчанию. Включай только для прямой трансляции/livecast.
- `options.mainPageFavorite`: `false` по умолчанию. Не включай промо/избранное без явного редакторского основания.
- `options.mark_on_list_page`: `false` по умолчанию. Не включай выделение на странице раздела без явного редакторского основания.
- `assets.thumbnail`: `null` до отдельной media-интеграции.
- `assets.images`: `[]` до отдельной media-интеграции.
- `audit.source_links`: ссылки на источник, первоисточник, документы или конкретные посты. Массив строк или объектов допустим, но предпочтительно использовать объекты `{ "label": "...", "url": "..." }`.
- `audit.fact_check_notes`: короткие практические предупреждения автору о том, что нужно проверить фактологически. Не дублируй очевидное.
- `audit.risk_notes`: короткие практические предупреждения автору о юридических, репутационных, этических и точностных рисках. Не дублируй очевидное.
- `audit.editor_todo`: короткие практические действия редактора перед публикацией. Выноси сюда ручные редакторские решения и сверки, которые нельзя безопасно автоматизировать.

## Required and Optional Fields

Required for import:
- `schema`;
- `status`;
- `target.section`;
- `target.layout`;
- `target.categories`;
- `fields.title`;
- `fields.slug`;
- `fields.content_html`;
- `options`;
- `audit.source_links`;
- `audit.fact_check_notes`;
- `audit.risk_notes`;
- `audit.editor_todo`.

Recommended:
- `fields.rotation_titles`;
- `fields.seo_title`;
- `fields.lead`;
- `fields.excerpt`;
- `fields.tags` as suggested tags.

Disabled until media integration:
- `assets.thumbnail = null`;
- `assets.images = []`.


## Classification And Taxonomy

Классификация выполняется перед финальной сборкой `draft.json`.

- Используй `taxonomy.md` как единственный source of truth для `target.section` и `target.categories`.
- `target.section` должен быть одним из allowed sections или пустой строкой, если уверенности нет.
- `target.categories` должен содержать только exact labels из allowed categories выбранного section.
- Не переносить `source.target.categories` в `draft.target.categories` механически: это только подсказка extraction-слоя.
- Не создавать новые WordPress categories.
- Если section/category сомнительны, заполни `audit.editor_todo` практическим предупреждением перед публикацией.

## Options

`options` — явный блок управляемых чекбоксов/настроек записи. Если поле управляется агентом или importer, оно должно быть явно указано в payload, а не оставаться implicit.

Базовые безопасные defaults:

```json
{
  "options": {
    "enableComments": false,
    "enableReactions": true,
    "includeDzen": false,
    "juicyVideo": false,
    "updated": false,
    "livecast": false,
    "mainPageFavorite": false,
    "mark_on_list_page": false
  }
}
```

Если агент не уверен, используй default. Не включай комментарии, промо, избранное, выделение или спецрежимы без явного основания из материала или `editor.notes`.

## Tag Suggestions

`fields.tags` — предложения модели, а не команда автоматически создать новые метки.

Правила генерации:
- 3–7 тегов;
- каждый тег с большой буквы;
- без хэштегов;
- без дублей;
- без слишком узких одноразовых формулировок;
- только если тег явно следует из материала;
- предпочтительно использовать знакомые редакционные/админские термины, если они очевидны из контекста.

Если подходящие теги неочевидны, оставь `fields.tags` пустым массивом или дай минимальные предложения и добавь задачу в `audit.editor_todo`: `Проверить метки перед публикацией.`

Импортер/Launchpad должен сверять suggested tags с существующими метками админки. Не создавай новые метки автоматически.

## Audit Notes

`audit.fact_check_notes`, `audit.risk_notes` и `audit.editor_todo` должны быть короткими практическими предупреждениями автору перед публикацией. Не дублируй очевидное и не пиши общие самооценки.

Выноси туда всё непроверенное, сомнительное, требующее сверки с источником, юридически/репутационно рискованное или требующее ручного редакторского решения.

## Content HTML

`fields.content_html` должен содержать только тело материала.

Не вставляй в `fields.content_html`:
- `fields.title`;
- `fields.lead` отдельным служебным заголовком;
- `audit.source_links` отдельным списком;
- `audit.fact_check_notes`;
- `audit.risk_notes`;
- `audit.editor_todo`;
- служебные комментарии;
- предупреждения о неполном источнике;
- изображения из внешнего источника, пока media-интеграция отключена.

Для новости ставь `<!--more-->` после первого содержательного абзаца/лида.

Не добавляй `<!--end-tag-->`.

## Rewrite Risk Assessment

Оценивай не “процент уникальности”, а редакционный риск близкого рерайта. Не создавай отдельные поля вне schema `draft.v1`. Используй существующие поля `audit.risk_notes` и `audit.editor_todo`.

Если структура, ход мысли, порядок фактов или формулировки слишком близки к источнику, добавь в `audit.risk_notes` строку в таком формате:

```text
Риск близкого рерайта: low|medium|high — краткое объяснение.
```

Ориентиры:
- `low` — факты использованы как сырье, структура и лид самостоятельные;
- `medium` — часть структуры или последовательности источника заметно сохранена, нужна редакторская правка;
- `high` — текст слишком близок к источнику, нужен новый черновик или глубокая переработка.

Если риск `medium` или `high`, добавь конкретное действие в `audit.editor_todo`.

## Plain Text Fallback

Если пользователь дал обычный текст, пресс-релиз, заметку или пересказ без `source.json`:

- все равно можно вернуть `draft.json`, если фактов достаточно;
- не выдумывай URL, canonical URL, сайт, дату публикации, автора, изображения и ссылки;
- используй `target.section = ""` и `target.categories = []`, если раздел или рубрика не указаны;
- используй `target.layout = "news"`, если layout не указан;
- добавь предупреждение в `audit.fact_check_notes`;
- добавь задачи в `audit.editor_todo`.

Минимальные заметки для plain text:

```json
{
  "audit": {
    "fact_check_notes": [
      "Вход был дан обычным текстом, без URL и метаданных источника.",
      "Нужно вручную проверить первоисточник, дату публикации и автора."
    ],
    "editor_todo": [
      "Добавить ссылку на источник.",
      "Проверить дату и контекст.",
      "Уточнить рубрику и layout, если они не указаны."
    ]
  }
}
```

## Empty or Unsafe Source

Если `source.text` пустой, слишком короткий или не содержит достаточно фактов для черновика:

- не выдумывай полноценный материал;
- верни валидный `draft.json`;
- оставь `fields.content_html` пустым или минимальным;
- подробно заполни `audit.editor_todo`;
- укажи проблему в `audit.fact_check_notes`.

## File Naming

Базовые имена:
- `source.json` — входной файл, который собирает Launchpad из внешней страницы;
- `draft.json` — выходной файл, который ChatGPT Project возвращает для импорта в админку.

Для Launchpad предпочтительно правило:
- `*_source.json` → `*_draft.json`.

Timestamp, host и остальная база имени сохраняются. Меняется только суффикс `_source.json` на `_draft.json`.

Главным идентификатором остается поле `schema`, а не имя файла. Но при создании файла для Launchpad сохраняй базовое имя source и меняй только суффикс `_source.json` на `_draft.json`.

## Output Rules

Если пользователь прислал `source.json` со `schema: "source.v1"`, возвращай только валидный JSON без markdown-комментариев вокруг него.

Если пользователь просит `draft.json`, возвращай только валидный JSON без markdown-комментариев вокруг него.

Если пользователь просит файл, создай файл с именем из запроса. Для Launchpad это обычно `*_draft.json`, полученный заменой суффикса `_source.json` на `_draft.json`. Schema внутри файла важнее имени, но имя нужно сохранить для удобного импорта.

Если вход неполный, не отказывайся автоматически. Верни `draft.json`, но честно заполни `audit`.
