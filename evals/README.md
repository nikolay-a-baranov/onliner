# Prompt evals

`evals/` — единый source layer для воспроизводимой оценки prompt-задач.

## Structure

```text
evals/
  run.js
  editorial/
    README.md
  self-check/
    editorial.json
    observations/
    suites/
```

- `run.js` содержит общий loader, deterministic checks и сводный отчет.
- `editorial/` принимает versioned curated cases, полученные из реальных observations.
- `self-check/` проверяет сам eval runner на заранее известных результатах.
- `.eval/` содержит локальные requests, model outputs и отчеты; эта папка не коммитится.

Eval не живет рядом с production prompt. Prompt остается в `src/prompts/`, а eval datasets и scoring остаются здесь, чтобы тестовые данные не попадали в browser bundle.

## Admin capture

После реального audit в админке нажать кнопку скачивания и выбрать `eval` — это значение теперь используется по умолчанию. Snapshot содержит:

- исходный и финальный текст;
- точный compiled prompt и его hash;
- prompt id/revision;
- provider/model и время выполнения;
- нормализованный model output;
- suggestions до и после runtime-фильтров;
- решения редактора `accepted`/`dismissed`, включая ручную замену;
- raw LLM debug response.

Если браузер поддерживает File System Access API, откроется системный Save As и файл можно сразу сохранить в `.eval/inbox/`. Иначе JSON будет скачан обычным способом, после чего его нужно переместить в эту папку.

Получить агрегат по накопленным observations:

```text
npm run eval:prompts -- --observations .eval/inbox
```

Отчет показывает generated/presented/runtime-filtered suggestions, accepted/dismissed/pending, acceptance/resolution rate и разрез provider/model.

## Curated regression workflow

После накопления реальных observations отобранные и обезличенные случаи переносятся в task suites внутри `evals/editorial/`. До этого production suites остаются пустыми.

Создать локальный run template:

```text
npm run eval:prompts -- --init .eval/editorial-current.json
```

В созданном файле указать `provider`, `model`, результат модели в `samples[].output`, latency/usage при наличии и ручную оценку в `samples[].review`.

Оценить заполненный run:

```text
npm run eval:prompts -- --run .eval/editorial-current.json
```

Сравнить baseline и candidate после изменения prompt:

```text
npm run eval:prompts -- --compare .eval/baseline.json .eval/candidate.json
```

Comparison показывает delta отдельно для всех samples, audit, slug и excerpt: hard failures, acceptance rate, factuality, usefulness, latency, tokens, а для audit также edit precision/recall.

Проверить eval runner:

```text
npm run eval:prompts:self-check
```

## Data policy

- Сырые редакционные материалы и полные ответы модели остаются в `.eval/`.
- В tracked suites переносить только обезличенные или синтетические representative cases.
- Каждый case получает стабильный `id`, task, tags, input и явные deterministic expectations.
- Семантическое качество не маскировать автоматическими эвристиками: factuality, usefulness и готовность принять результат оцениваются человеком.
- Изменение prompt сравнивать на одном наборе cases, одинаковых моделях и одинаковом числе повторов.
- В baseline записывать provider, точную model, prompt hash, дату и latency/usage, если они доступны.

## Promotion rule

Новая версия prompt принимается, если:

1. не ухудшает hard constraints;
2. не увеличивает false positives;
3. улучшает или сохраняет human acceptance и factuality;
4. изменение latency/token usage приемлемо;
5. результат повторяется минимум на двух прогонах для неоднозначных случаев.
