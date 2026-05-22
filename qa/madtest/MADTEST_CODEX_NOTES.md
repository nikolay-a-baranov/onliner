
# MADTEST_CODEX_NOTES

## Архитектура

Главная идея:
- не делать большой экспорт всего подряд
- использовать локальные сценарии:
  - export
  - sanitize
  - find

Madtest — SPA:
- DOM перерисовывается
- старые ссылки на элементы тухнут
- после переходов всегда заново querySelector/querySelectorAll

---

## Wait flow

Нельзя опираться только на setTimeout.

Нужен polling wait:

```js
wait(getter, limit = 10000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      const value = getter();
      if (value) {
        clearInterval(timer);
        resolve(value);
      }
      if (Date.now() - started > limit) {
        clearInterval(timer);
        reject(new Error("wait timeout"));
      }
    }, 100);
  });
}
```

---

## Questions/results

Там:
- список слева
- форма справа

Нужен traversal mode:

```js
list.run(kind, action)
```

Flow:
1. получить список
2. кликнуть
3. дождаться формы
4. export/sanitize
5. следующий пункт

---

## DOM references

Плохо:

```js
const items = [...document.querySelectorAll(...)];
```

Лучше:

```js
const items = () => [...document.querySelectorAll(...)];
```

---

## Export

Не делать цепочку из многих download подряд.

Лучше:
- один txt
- zip
- json

---

## Preview

На preview:
- публикация может быть выключена
- embed появляется асинхронно

Flow:
1. включить publish
2. дождаться embed
3. читать код

---

## Find mode

Первый вариант:
- fetch preview
- искать public slug

Fallback:
- последовательная навигация через sessionStorage
- чтение DOM после render

---

## Санитизация

Только:
- видимые
- editable
- не readonly
- не disabled

После изменения:
- emit input/change

Правила должны быть idempotent.
