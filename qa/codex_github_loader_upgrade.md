# GitHub Bookmarklet Loader Upgrade

Нужно доработать GitHub-режим букмарклетов так, чтобы пользователям не нужно было заново перетягивать закладки после обновления версии.

## Текущая проблема

Если `index.html` генерирует bookmarklet напрямую на версионированный файл:

```js
javascript:(()=>{const s=document.createElement('script');s.src='https://nikolay-a-baranov.github.io/onliner-bookmarklets/dist/editor.js?v=20260516183045';document.body.append(s)})()
```

то версия `20260516183045` оказывается внутри URL закладки пользователя.

После следующей сборки версия изменится, но старая закладка у пользователя останется со старым `?v=...`.

Это значит, что для обновления пришлось бы снова перетягивать bookmarklet. Так делать не надо.

## Нужная модель

GitHub-режим должен использовать двухступенчатую загрузку:

```txt
bookmarklet
  ↓
stable loader
  ↓
actual versioned script
```

То есть bookmarklet должен быть стабильным и не должен содержать версию конкретного исполняемого файла.

Пример стабильного bookmarklet:

```js
javascript:(()=>{const s=document.createElement('script');s.src='https://nikolay-a-baranov.github.io/onliner-bookmarklets/dist/loaders/editor.js';document.body.append(s)})()
```

А файл `dist/loaders/editor.js` уже должен подключать актуальный версионированный исполняемый файл:

```js
(()=>{const s=document.createElement('script');s.src='https://nikolay-a-baranov.github.io/onliner-bookmarklets/dist/editor.js?v=20260516183045';document.body.append(s)})();
```

## Что нужно сохранить

Нельзя ломать текущую функциональность.

На `index.html` должен остаться переключатель режимов:

- `javascript` — текущий режим, где весь код находится прямо внутри bookmarklet URL;
- `github` — новый режим, где bookmarklet содержит только стабильный loader URL.

Текущий `javascript`-режим должен работать как раньше.

## Что нужно изменить в GitHub-режиме

В режиме `github` карточки/ссылки на `index.html` должны генерировать стабильные bookmarklet-ссылки на loader-файлы:

```txt
dist/loaders/<name>.js
```

Например:

```txt
dist/loaders/editor.js
dist/loaders/toc.js
dist/loaders/proofread.js
```

А не напрямую на:

```txt
dist/editor.js?v=<version>
```

## Сборка

Для каждого bookmarklet entry нужно собирать:

1. основной исполняемый файл:

```txt
dist/<name>.js
```

2. стабильный loader-файл:

```txt
dist/loaders/<name>.js
```

Пример:

```txt
dist/editor.js
dist/loaders/editor.js
```

## Версионирование

Текущую идею с версией по дате нужно сохранить.

Но версия должна использоваться только внутри loader-файлов, а не в bookmarklet URL.

Формат версии:

```txt
YYYYMMDDHHmmss
```

Версия должна обновляться только если изменился соответствующий `dist/<name>.js`.

Для этого сохранить manifest, например:

```json
{
  "editor.js": {
    "hash": "...",
    "version": "20260516183045"
  }
}
```

Файл manifest:

```txt
dist/manifest.json
```

Логика:

1. Собрать `dist/<name>.js`.
2. Посчитать hash итогового содержимого.
3. Прочитать старый `dist/manifest.json`, если он есть.
4. Если hash не изменился — сохранить старую version.
5. Если hash изменился или записи нет — записать новую version текущей датой.
6. Обновить `dist/manifest.json`.
7. Сгенерировать `dist/loaders/<name>.js`, который подключает `dist/<name>.js?v=<version>`.
8. Сгенерировать/обновить `index.html`.

## Пример результата

Для `editor`:

### `index.html` в режиме github должен давать bookmarklet:

```js
javascript:(()=>{const s=document.createElement('script');s.src='https://nikolay-a-baranov.github.io/onliner-bookmarklets/dist/loaders/editor.js';document.body.append(s)})()
```

### `dist/loaders/editor.js` должен содержать:

```js
(()=>{const s=document.createElement('script');s.src='https://nikolay-a-baranov.github.io/onliner-bookmarklets/dist/editor.js?v=20260516183045';document.body.append(s)})();
```

## Кеширование

Стабильный loader-файл может кешироваться браузером, поэтому в bookmarklet можно добавить cache-busting только для loader, но не через дату сборки.

Чтобы пользователь всегда получал свежий loader без переустановки bookmarklet, лучше добавить к loader URL короткий runtime cache-buster:

```js
'?t='+Date.now()
```

То есть стабильный bookmarklet в GitHub-режиме может быть таким:

```js
javascript:(()=>{const s=document.createElement('script');s.src='https://nikolay-a-baranov.github.io/onliner-bookmarklets/dist/loaders/editor.js?t='+Date.now();document.body.append(s)})()
```

Это допустимо, потому что loader маленький. Основной тяжелый файл при этом остается кешируемым через стабильную версию:

```txt
dist/editor.js?v=20260516183045
```

## Важные ограничения

- Не ломать режим `javascript`.
- Не удалять текущую возможность генерировать bookmarklet с кодом внутри URL.
- GitHub-режим должен быть добавочным.
- В GitHub-режиме bookmarklet не должен содержать версию основного файла.
- Версия основного файла должна жить только в `dist/loaders/<name>.js`.
- Основной код должен исполняться из `dist/<name>.js`.
- Loader должен быть маленьким и стабильным по URL.
- Не делать широкий рефакторинг без необходимости.
- Сохранять текущую структуру проекта.
- Следовать правилам из `JAVASCRIPT.md`.

## Желательная структура

```txt
src/
dist/
  editor.js
  toc.js
  proofread.js
  manifest.json
  loaders/
    editor.js
    toc.js
    proofread.js
index.html
```

## Проверка результата

После сборки:

1. В режиме `javascript` старые ссылки работают как раньше.
2. В режиме `github` ссылка на `index.html` содержит только loader URL.
3. Loader URL не меняется при изменении версии.
4. При изменении `dist/editor.js` меняется version в `dist/manifest.json`.
5. После изменения version пересобирается `dist/loaders/editor.js`.
6. Пользовательская закладка, перетянутая один раз, продолжает получать новый исполняемый код без повторного перетягивания.
