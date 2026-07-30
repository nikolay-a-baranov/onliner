# Roadmap

Этот файл фиксирует планируемые улучшения операционного пайплайна. Это не текущая обязательная schema и не редакционный документ.

## Rule Sources

Редакционные правила остаются в `editorial.md`, `source.md`, `verification.md`, `rewrite.md`, `titles.md`, `photos.md` и `checklist.md`.

Текущий машинный контракт остается в `payload.md` и `output.md`.

Этот файл нужен, чтобы не смешивать текущий контракт `draft.v1` с задачами для Launchpad/importer и будущими улучшениями.


## Taxonomy Completion

Текущий статус:
- `taxonomy.md` стал source of truth для `target.section` и `target.categories`;
- exact categories подтверждены только там, где они выгружены из админки;
- если section/category не уверены, Project должен оставить category пустой и добавить предупреждение в `audit.editor_todo`.

План:
- выгрузить exact category labels для `people`, `auto`, `tech` и `realt` из соответствующих админок;
- обновить `taxonomy.md`, не расширяя `payload.md`;
- научить Launchpad importer сверять `target.categories` с текущими WP terms и показывать warnings при несовпадении;
- не создавать новые categories автоматически.

## Options Import

Текущий статус:
- `draft.v1` содержит явный блок `options` для управляемых checkbox/post options;
- безопасные defaults описаны в `payload.md`.

План:
- Launchpad importer должен маппить `options` на стабильные checkbox fields админки;
- если option не удалось применить, показывать warning автору;
- не включать промо/избранное/выделение без явного `true` в payload.

## Tag Resolution

Текущий статус:
- `fields.tags` в `draft.v1` содержит suggested tags от модели;
- теги должны быть короткими, с большой буквы, без хэштегов и дублей;
- Project не знает полный список существующих меток админки.

План:
- Launchpad/importer должен сверять `fields.tags` с существующими WordPress/админскими метками;
- существующие метки можно применять автоматически;
- отсутствующие метки не создавать автоматически в MVP;
- отсутствующие или сомнительные метки показывать автору как warning/notice или переносить в `audit.editor_todo`;
- позже можно добавить autocomplete/search по меткам админки перед импортом.

Причина:
- автоматическое создание новых меток быстро создаст мусор, дубли и разные формы одного тега.

## Slug Import

Текущий статус:
- `fields.slug` генерируется в `draft.v1`;
- slug должен быть человекочитаемым: суть выбирается на русском, затем транслитерируется в латиницу; lowercase, дефисы вместо пробелов, без спецсимволов. Русская смысловая фраза до замены пробелов на дефисы — до 34 символов.

План:
- Launchpad/importer должен маппить `fields.slug` в WordPress permalink/post_name;
- если WordPress перетирает slug после title/autosave, применять slug вторым шагом после появления `post_id`;
- importer должен показывать warning, если slug не применился.

## Media Integration

Текущий статус:
- `assets.thumbnail` остается `null`;
- `assets.images` остается `[]`;
- внешние картинки не вставляются в `fields.content_html`.

План:
- отдельно определить media contract;
- маппить source images в кандидаты для Onlíner media workflow;
- не подмешивать media-логику в `draft.v1`, пока importer и админка не готовы.

## Source Metadata Import

Текущий статус:
- source attribution сейчас живет в публикационном тексте и `audit.source_links`;
- `draft.v1` пока не содержит отдельного стабильного payload-блока для полей админки “Источник” и “Ссылка на источник”.

План:
- определить отдельный payload contract для source name/source URL, если такие поля стабильно доступны в админке;
- маппить название источника в поле источника, а canonical/source URL — в поле ссылки на источник;
- не смешивать это с `fields.content_html`: текст должен атрибутировать источник редакционно, а importer — заполнять технические поля детерминированно;
- не внедрять до проверки стабильных admin field names и поведения importer.


## Prompt Sync

Текущий статус:
- `prompt.md` — source of truth для Launchpad agent clipboard prompt;
- Launchpad хранит исполняемую копию prompt в коде.

План:
- при изменении `prompt.md` обновлять `agentPromptValue` в `src/actions/editorial.js`;
- не дублировать полный `payload.md` в prompt-строке;
- держать prompt коротким, маршрутизирующим и стабильным.


## ChatGPT Project Deployment

Текущий статус:
- Project files поставляются архивом;
- `project.md` вручную вставляется в Project Instructions;
- остальные `.md` вручную загружаются как Project files;
- официально поддерживаемый workflow для программного создания ChatGPT Project и загрузки файлов не используется.

План:
- использовать shared Project, если он доступен;
- для ручного развёртывания использовать `setup.md`;
- не делать браузерную автоматизацию ChatGPT UI частью MVP, потому что она хрупкая.


## Prompt Minimality

- `prompt.md` должен оставаться коротким запуском маршрута.
- Подробные правила полей живут в `payload.md`, `output.md` и `checklist.md`.
- Не дублировать в prompt правила `slug`, `tags`, `excerpt`, `audit`, `assets` или HTML.
- Если меняются только подробные правила полей, но маршрут и placeholders не меняются, `agentPromptValue` обычно не требует обновления.

## Verified Context Enrichment

Planned improvement: add an explicit enrichment step before `draft-json` for cases where a short source needs verified background context.

Rules for future implementation:

- enrichment must use explicit URLs/documents/search results, not model memory;
- every added context fact must be traceable in `audit.source_links`;
- enrichment should be optional and visible to the author;
- if verification is unavailable, the agent should add `audit.editor_todo` instead of inserting background facts into `content_html`;
- importer remains deterministic and does not make editorial decisions.
