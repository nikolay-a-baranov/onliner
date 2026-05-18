# BML Launcher Mode

Нужно добавить в существующую систему отдельный launcher-букмарклет.

## Контекст

Сейчас проект должен поддерживать генерацию отдельных bookmarklet-ссылок для инструментов в режимах:

- `javascript` — весь код внутри bookmarklet URL;
- `github` — стабильный GitHub loader;
- `local` — стабильный loader с локального dev-сервера.

Эту функциональность ломать нельзя.

Нужно добавить новый слой: один общий bookmarklet `BML Launcher`, который открывает маленькую панель поверх текущей страницы и позволяет запускать отдельные инструменты или сценарии.

## Цель

Пользователь должен иметь возможность перетянуть на панель закладок одну закладку:

```txt
BML
```

После клика по ней на целевой странице открывается меню:

```txt
BML
- ✒️ Editor
- 🧿 Proofread
- 🧭 TOC
- 🧽 Cleanup
- ✍️ Editing Flow
```

Одиночные инструменты запускают один bundle.

Сценарии запускают несколько bundle-файлов последовательно.

## Важное требование

Launcher должен быть добавочным режимом.

Нельзя удалять или ломать текущую витрину отдельных букмарклетов.

На `index.html` могут быть:

1. текущие карточки отдельных инструментов;
2. отдельная карточка/блок `BML Launcher`;
3. переключатель режимов для одиночных ссылок как раньше.

## Модель загрузки

Launcher bookmarklet должен быть стабильным.

### GitHub launcher

```js
javascript:(()=>{const s=document.createElement('script');s.src='https://nikolay-a-baranov.github.io/onliner-bookmarklets/dist/launcher.js?t='+Date.now();document.body.append(s)})()
```

### Local launcher

Если `index.html` открыт локально как:

```txt
http://192.168.1.23:5500/
```

то local launcher должен быть:

```js
javascript:(()=>{const s=document.createElement('script');s.src='http://192.168.1.23:5500/dist/launcher.js?t='+Date.now();document.body.append(s)})()
```

Важно: не использовать `location.origin` внутри bookmarklet-кода для local-режима, потому что при запуске bookmarklet это будет origin целевого сайта, а не страницы `index.html`.

`index.html` должен подставить свой `location.origin` при генерации local-ссылки.

## Файлы

Добавить:

```txt
src/launcher.js
dist/launcher.js
```

Опционально, если удобно:

```txt
src/launcher.config.js
```

или данные launcher можно брать из существующего списка bookmarklet entries.

Не плодить параллельную конфигурацию без необходимости. Если в проекте уже есть единый список инструментов, launcher должен использовать его.

## Поведение launcher

При запуске `dist/launcher.js`:

1. Если панель уже открыта — закрыть ее или переиспользовать существующую.
2. Если панели нет — создать панель.
3. Панель должна быть изолирована по id/class namespace, чтобы не конфликтовать с админкой.
4. Панель должна содержать список одиночных инструментов и сценариев.
5. По клику на одиночный инструмент загрузить соответствующий `dist/<name>.js`.
6. По клику на сценарий загрузить несколько файлов последовательно.

## Namespace

Использовать один стабильный корневой id, например:

```txt
bml-launcher
```

Классы:

```txt
bml-launcher
bml-launcher__panel
bml-launcher__title
bml-launcher__button
bml-launcher__section
bml-launcher__close
```

Не использовать слишком общие классы вроде `.panel`, `.button`, `.title`.

## Загрузка инструментов из launcher

Launcher должен грузить файлы относительно собственного URL, а не через захардкоженный GitHub host.

Это важно, чтобы один и тот же `dist/launcher.js` работал и с GitHub Pages, и с локального сервера.

Предпочтительная логика:

```js
const currentScript = document.currentScript;
const baseUrl = new URL(".", currentScript.src);
```

Если `launcher.js` лежит в:

```txt
dist/launcher.js
```

то загрузка `editor.js` должна идти из:

```txt
dist/editor.js
```

То есть:

```js
new URL("editor.js?v=<version>", baseUrl).href
```

## Версии инструментов

Основные tool bundles уже версионируются через `dist/manifest.json`.

Launcher должен использовать версии из manifest/build config.

Пример:

```js
const tools = [
  {
    id: "editor",
    title: "✒️ Editor",
    file: "editor.js",
    version: "20260516183045"
  }
];
```

При загрузке:

```txt
editor.js?v=20260516183045
```

Версия должна обновляться только когда изменился соответствующий `dist/editor.js`, как уже описано для GitHub loader mode.

## Версия launcher

Сам launcher можно грузить из bookmarklet с runtime cache-buster:

```js
?t='+Date.now()
```

Потому что он маленький и должен обновляться быстро.

## Сценарии

Добавить поддержку сценариев.

Пример структуры:

```js
const scenarios = [
  {
    id: "editing",
    title: "✍️ Editing Flow",
    files: ["cleanup.js", "reader.js", "editor.js", "proofread.js"]
  },
  {
    id: "cleanup-editor",
    title: "🧽 Cleanup + Editor",
    files: ["cleanup.js", "editor.js"]
  }
];
```

Сценарий должен запускать файлы последовательно, не параллельно.

Минимальная реализация:

```js
const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.append(script);
  });
```

Для сценария:

```js
for (const file of files) {
  await loadScript(buildToolUrl(file));
}
```

## Важное ограничение по сценариям

Не делать сложную систему orchestration.

Не пытаться угадывать, когда инструмент “полностью завершил работу”, если сам инструмент не предоставляет явный сигнал.

На первом этапе достаточно последовательной загрузки скриптов через `script.onload`.

Если какой-то инструмент асинхронно открывает панель или запускает долгую проверку, это остается ответственностью самого инструмента.

Сценарии должны быть только для безопасных комбинаций.

## Начальный набор сценариев

Добавить 1–2 примера, но не переусложнять.

Например:

```txt
🧽 Cleanup + Editor
✍️ Editing Flow
```

Если точные имена файлов отличаются, использовать существующие entry names проекта.

Не создавать сценарии для инструментов, порядок которых потенциально конфликтует.

## UI

Панель должна быть простой.

Минимально:

```txt
BML
[×]

Инструменты
[✒️ Editor]
[🧿 Proofread]
[🧭 TOC]

Сценарии
[🧽 Cleanup + Editor]
[✍️ Editing Flow]
```

Требования:

- fixed positioning;
- высокий z-index;
- компактный размер;
- нормальная работа на iPad;
- кнопка закрытия;
- повторный запуск bookmarklet не должен плодить дубли панелей.

Не делать сложный дизайн.

## CSS

CSS можно встроить в `launcher.js`.

Важно:

- не использовать глобальные селекторы;
- все стили должны быть scoped через `#bml-launcher`;
- не ломать стили целевой страницы.

## Ошибки

Если загрузка инструмента не удалась:

- показать короткое сообщение внутри панели;
- не использовать `alert`;
- не падать с необработанной ошибкой.

Пример:

```txt
Не удалось загрузить Editor
```

## Index page

На `index.html` нужно добавить отдельную карточку или секцию:

```txt
BML Launcher
```

Она должна давать bookmarklet-ссылку для текущего режима:

- github launcher;
- local launcher.

Для `javascript`-режима launcher, скорее всего, не нужен, потому что он должен быть удаленно обновляемым. Если проще, можно показывать launcher только в режимах `github` и `local`.

Не ломать существующий flow копирования/перетягивания ссылок.

## Архитектура

Предпочтительно:

- launcher использует существующий список entries;
- tool metadata не дублируется в нескольких местах;
- сценарии можно держать отдельным небольшим списком;
- URLs строятся одной функцией;
- DOM creation и URL building разделены;
- side effects только в `run`.

Следовать `JAVASCRIPT.md`:

- небольшие функции;
- явные имена;
- без лишней абстракции;
- без глобального мусора;
- без широкого рефакторинга.

## Желательная структура

```txt
src/
  launcher.js
dist/
  launcher.js
  editor.js
  proofread.js
  toc.js
  manifest.json
  loaders/
    editor.js
    proofread.js
    toc.js
index.html
```

## Проверка результата

После доработки:

1. Отдельные bookmarklet-ссылки продолжают работать.
2. Режим `javascript` не сломан.
3. Режим `github` не сломан.
4. Режим `local` не сломан.
5. На `index.html` есть ссылка/карточка `BML Launcher`.
6. GitHub launcher грузит `dist/launcher.js` с GitHub Pages.
7. Local launcher грузит `dist/launcher.js` с origin текущей страницы `index.html`.
8. Один клик по bookmarklet открывает панель.
9. Повторный клик не создает дубликаты панели.
10. Клик по одиночному инструменту грузит нужный `dist/<name>.js`.
11. Клик по сценарию грузит несколько файлов последовательно.
12. Если инструмент обновился, launcher использует новую версию из manifest/build output.
13. Один и тот же `dist/launcher.js` работает и на GitHub Pages, и на локальном dev-сервере.
