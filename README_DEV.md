# Dev-flow для onliner-bookmarklets

Короткая шпаргалка, чтобы не вспоминать заново, как запускать локальную разработку букмарклетов на компьютере, iPad и iPhone.

## Что настроено

Локальная разработка теперь работает через один HTTPS-адрес:

```text
https://desktop-ih35ogb.local:5173/
```

Этот адрес открывается с компьютера, iPad и iPhone в одной локальной сети.

Настроено:

```text
npm.cmd run dev
```

Эта команда одновременно:

- следит за изменениями файлов;
- пересобирает проект после сохранения;
- раздаёт проект локально по HTTPS;
- отключает cache dev-сервера.

## Обычный запуск

В начале работы открыть VSCode в корне проекта и запустить:

```powershell
npm.cmd run dev
```

После запуска открыть витрину:

```text
https://desktop-ih35ogb.local:5173/
```

На iPad и iPhone открывать тот же адрес.

## Обычное завершение

В терминале, где запущен dev-сервер:

```text
Ctrl+C
```

## Как работает обновление

Флоу такой:

```text
1. Правишь файл в VSCode
2. Auto Save сохраняет файл
3. watcher видит изменение
4. build запускается сам
5. обновляешь страницу или заново запускаешь букмарклет
```

Auto Save должен быть включён:

```text
Files: Auto Save = afterDelay
Files: Auto Save Delay = 1000
```

## Режимы на витрине

На карточке Launchpad есть переключатель режимов.

Режимы:

```text
GIT / GH   → GitHub Pages
LOC        → локальный HTTPS dev-server
JAV        → inline javascript
```

На GitHub Pages локальные режимы не должны быть доступны для обычного использования. Локальная разработка идёт через `desktop-ih35ogb.local`.

## Локальный bookmarklet

Для разработки нужен локальный режим.

Локальный bookmarklet должен грузить скрипт с текущего local origin:

```text
https://desktop-ih35ogb.local:5173/dist/launchpad.js
```

Если витрина открыта локально, local base берётся из `location.origin`, поэтому старый сохранённый IP не должен перебивать текущий адрес.

## Если iPad показывает старое

Проверить прямой файл:

```text
https://desktop-ih35ogb.local:5173/tools/storefront/current/app.js
```

Если там старый адрес или старое поведение:

1. закрыть вкладку;
2. открыть заново;
3. при необходимости открыть витрину с явным base:

```text
https://desktop-ih35ogb.local:5173/?local-base=https://desktop-ih35ogb.local:5173
```

Но после последней правки это обычно не должно быть нужно.

## HTTPS и сертификаты

Сертификат для локального HTTPS лежит в `.certs/`:

```text
.certs/ih35ogb.pem
.certs/ih35ogb-key.pem
```

Он выпущен для:

```text
desktop-ih35ogb.local
localhost
127.0.0.1
```

Root CA от mkcert установлен на компьютере и добавлен на iPad/iPhone. Поэтому Safari должен открывать локальный HTTPS без предупреждений.

Если сертификаты сломаются или hostname поменяется, надо перевыпустить сертификат через `mkcert`.

## Что коммитить

Можно коммитить:

```text
package.json
package-lock.json
tools/build.js
tools/storefront/current/app.js
```

Не коммитить:

```text
node_modules/
.certs/
secret.local.json
```

Они уже должны быть в `.gitignore`.

## Быстрая диагностика

Проверить scripts:

```powershell
node -e "const p=require('./package.json'); console.log(p.scripts)"
```

Ожидаемо важное:

```text
dev: npm-run-all --parallel watch serve:https
serve:https: http-server . -a 0.0.0.0 -p 5173 -c-1 -S -C .certs/ih35ogb.pem -K .certs/ih35ogb-key.pem
```

Проверить JS-синтаксис после ручных правок:

```powershell
node --check tools/build.js
node --check tools/storefront/current/app.js
```

## Коротко

Запомнить надо только это:

```powershell
npm.cmd run dev
```

И открыть:

```text
https://desktop-ih35ogb.local:5173/
```

Дальше правки сохраняются автоматически, build запускается сам, а локальный bookmarklet грузится с локального HTTPS.
