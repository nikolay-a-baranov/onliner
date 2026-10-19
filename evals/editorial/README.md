# Editorial eval datasets

Здесь хранятся только versioned cases, отобранные из реальных admin observations.

До накопления и ручного разбора первых snapshots production suites намеренно отсутствуют.

Порядок добавления case:

1. Сохранить audit snapshot в `.eval/inbox/`.
2. Найти полезный accepted, dismissed или runtime-filtered случай через observation report.
3. Удалить имена, закрытые URL, post ID и другие чувствительные данные.
4. Сохранить только минимальный фрагмент, необходимый для воспроизведения поведения.
5. Зафиксировать ожидаемый результат после редакторской проверки.
6. Добавить case в task suite: `audit.json`, `slug.json` или `excerpt.json`.

Синтетические данные допустимы только в `evals/self-check/` для проверки самого runner и не участвуют в оценке качества production prompt.
