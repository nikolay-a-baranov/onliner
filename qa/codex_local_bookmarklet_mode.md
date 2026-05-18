# Local Network Mode for Bookmarklet Testing

Нужно добавить локальный режим для тестирования букмарклетов на iPad/iPhone без push в GitHub.

## Контекст

Сейчас проект должен поддерживать режимы на `index.html`:

- `javascript` — текущий режим, где весь код находится прямо внутри bookmarklet URL;
- `github` — режим со стабильным GitHub loader;
- нужно добавить `local` — режим со стабильным loader, который грузит файлы с локального dev-сервера в сети.

Текущие режимы ломать нельзя.

## Зачем нужен local-режим

Для проверки на iPad сейчас без локального сетевого режима приходится:

1. собрать код;
2. сделать push;
3. дождаться GitHub Pages;
4. открыть страницу на iPad;
5. проверить bookmarklet.

Это слишком медленно для разработки.

Local-режим должен позволить открывать `index.html` на iPad по адресу локального dev-сервера, например:

```txt
http://192.168.1.23:5500/#editor
```

и перетягивать/создавать dev-закладки, которые грузят код с того же локального сервера.

## Требуемая модель

В local-режиме bookmarklet должен быть стабильным loader’ом на локальный host.

Пример:

```js
javascript:(()=>{const s=document.createElement('script');s.src='http://192.168.1.23:5500/dist/loaders/editor.js?t='+Date.now();document.body.append(s)})()
```

А `dist/loaders/editor.js` уже подключает актуальный локальный `dist/editor.js`:

```js
(()=>{const s=document.createElement('script');s.src='../editor.js?v=20260516183045';document.body.append(s)})();
```

## Важное отличие от github-режима

`github` использует фиксированную базу:

```txt
https://nikolay-a-baranov.github.io/onliner-bookmarklets
```

`local` должен использовать базу текущей открытой страницы `index.html`.

Если `index.html` открыт как:

```txt
http://192.168.1.23:5500/
```

local-режим строит ссылки от:

```txt
http://192.168.1.23:5500
```

Итоговый loader URL:

```txt
http://192.168.1.23:5500/dist/loaders/editor.js
```

Так не нужно вручную хранить IP в конфиге.

## Переключатель режимов

На `index.html` нужно расширить текущий switcher:

```txt
javascript | github | local
```

Поведение:

### javascript

Работает как сейчас.

Bookmarklet содержит весь исполняемый код внутри URL.

### github

Bookmarklet грузит стабильный GitHub loader:

```txt
https://nikolay-a-baranov.github.io/onliner-bookmarklets/dist/loaders/<name>.js?t=<runtime>
```

### local

Bookmarklet грузит стабильный local loader:

```txt
<index_origin>/dist/loaders/<name>.js?t=<runtime>
```

Например:

```txt
http://192.168.1.23:5500/dist/loaders/editor.js?t=...
```

## Runtime cache-busting

Для loader’ов в `github` и `local` допустимо использовать:

```js
'?t='+Date.now()
```

Причина: loader маленький, зато пользователь всегда получает свежий loader без переустановки закладки.

Основной файл `dist/<name>.js` должен оставаться версионированным через manifest:

```txt
dist/editor.js?v=20260516183045
```

## Сборка loader-файлов

Нужно проверить, как сейчас генерируются `dist/loaders/<name>.js`.

Предпочтительное решение — сделать loader относительным:

```js
(()=>{const s=document.createElement('script');s.src='../editor.js?v=20260516183045';document.body.append(s)})();
```

Тогда один и тот же файл работает и на GitHub Pages, и на локальном сервере.

Для `dist/loaders/editor.js` путь `../editor.js` ведет к:

```txt
dist/editor.js
```

Плюсы:
- нет дублирования loader-файлов;
- GitHub/local используют один и тот же `dist/loaders/<name>.js`;
- меньше конфигурации;
- меньше риска расхождения.

## Важная деталь про location.origin

В готовом local bookmarklet нельзя использовать `location.origin` внутри самой закладки.

Плохо:

```js
javascript:(()=>{const s=document.createElement('script');s.src=location.origin+'/dist/loaders/editor.js?t='+Date.now();document.body.append(s)})()
```

Потому что `location.origin` будет origin сайта, на котором пользователь запускает bookmarklet, а не origin страницы `index.html`.

Правильно:

`index.html` при генерации local-ссылки должен взять свой `location.origin` и подставить его в готовую строку bookmarklet:

```js
const localBaseUrl = location.origin;
```

И собрать итоговый href уже с конкретным URL:

```js
javascript:(()=>{const s=document.createElement('script');s.src='http://192.168.1.23:5500/dist/loaders/editor.js?t='+Date.now();document.body.append(s)})()
```

## Настройки dev-сервера

В README или рядом с UI нужно добавить короткое примечание:

Для тестирования на iPad нельзя использовать `127.0.0.1`, потому что на iPad это сам iPad.

Нужно открыть страницу по IP компьютера в локальной сети:

```txt
http://192.168.1.23:5500/
```

Для VS Code Live Server может понадобиться настройка:

```json
{
  "liveServer.settings.host": "0.0.0.0"
}
```

Также Mac и iPad должны быть в одной Wi-Fi-сети, а macOS firewall должен разрешать входящие подключения.

## Важные ограничения

- Не ломать режим `javascript`.
- Не ломать режим `github`.
- `local` должен быть добавочным режимом.
- Не делать широкий рефакторинг без необходимости.
- Не вводить новую сложную конфигурацию, если можно использовать `location.origin` страницы `index.html`.
- Не использовать `location.origin` внутри bookmarklet-кода для local-режима.
- Loader должен оставаться маленьким.
- Основной код должен исполняться из `dist/<name>.js`.
- Версионирование через `dist/manifest.json` должно работать как раньше.
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

После доработки:

1. В режиме `javascript` старые ссылки работают как раньше.
2. В режиме `github` ссылки грузят GitHub loader.
3. В режиме `local` ссылки грузят loader с origin страницы `index.html`.
4. Если открыть `index.html` на iPad как `http://192.168.1.23:5500/`, local bookmarklet содержит именно этот host.
5. Local bookmarklet можно запустить на целевой странице на iPad без push в GitHub.
6. После изменения `dist/editor.js` и локальной пересборки iPad получает новую версию через local loader.
7. GitHub production-ссылки не зависят от local-режима.
