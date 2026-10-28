# Onliner Worker Bootstrap

`onliner-worker-bootstrap.user.js` нужен только для команд сбора по всем
разделам. Админки разделов находятся на разных поддоменах, поэтому Launchpad
не может самостоятельно внедрить worker-код в каждую вкладку из-за браузерной
политики same-origin.

## Установка

1. Установить расширение Tampermonkey.
2. Открыть опубликованный файл
   [Onliner Worker Bootstrap](https://nikolay-a-baranov.github.io/onliner/dist/userscripts/onliner-worker-bootstrap.user.js)
   или ссылку «установить Worker Bootstrap» на странице проекта.
3. Подтвердить установку userscript и убедиться, что он включён.
4. Разрешить всплывающие окна для админки Onlíner.

После обновления репозитория Tampermonkey получает новые версии по `@updateURL`.

## Использование

- Для команд «Все пользователи · Все разделы» и «Мои записи · Все разделы»
  bootstrap должен быть включён.
- Для команд текущего раздела bootstrap не требуется.
- Служебную worker-вкладку нельзя закрывать до завершения сбора.

Userscript запускается только на `https://*.onliner.by/wp-admin/edit.php*`,
только при параметре `worker=1` и только если страницу открыл Launchpad через
`window.opener`.

## Разработка и публикация

- Исходник хранится только в `tools/userscript/onliner-worker-bootstrap.user.js`.
- `node tools/build.js` публикует его в
  `dist/userscripts/onliner-worker-bootstrap.user.js` и подставляет URL из
  общей build-конфигурации.
- Сгенерированный файл в `dist/` вручную не редактируется.
- При изменении поведения userscript нужно увеличить его `@version`, иначе
  Tampermonkey не применит автоматическое обновление.

## Диагностика

Если worker не стартовал:

1. проверить, что Tampermonkey и Onliner Worker Bootstrap включены;
2. проверить разрешение всплывающих окон;
3. обновить userscript по опубликованной ссылке;
4. повторить запуск и не закрывать служебную вкладку.
