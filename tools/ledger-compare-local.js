const fs = require("node:fs");
const path = require("node:path");

const local = {
  directory: path.join(process.cwd(), "local-tools", "nikolai-2027"),
  html() {
    return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Николай · 2026 vs 2027</title>
<link rel="icon" type="image/svg+xml" href="../../assets/images/ledger-favicon.svg">
<link rel="stylesheet" href="../../tools/ledger/compare-local.css">
</head>
<body>
<main id="app" class="page">
  <header class="top"><div><h1>Николай · 2026 vs 2027</h1><p class="muted">Локальная ретроспектива · сценарий 2027-third-proofreader</p></div><div class="controls"><label class="control"><span>Месяц</span><select id="month"></select></label><label class="control"><span>Слов в минуту</span><input id="pace" type="number" min="1" step="1" value="100"></label><button id="export" type="button">Экспорт JSON</button></div></header>
  <section id="warnings" class="warnings"></section>
  <section class="panel"><h3>Покрытие источника</h3><div id="coverage" class="coverage"></div></section>
  <section class="section panel"><h3>Дежурный на паре воскресенье—понедельник</h3><div id="rota" class="rota"></div></section>
  <section class="section comparison"><article id="actual" class="panel"></article><article id="scenario" class="panel"></article></section>
  <section class="section panel"><h2>Календарь нагрузки</h2><table><thead><tr><th>Дата публикации</th><th>Факт</th><th>Модель · Николай</th><th>Не назначено</th><th>Материалы</th></tr></thead><tbody id="calendar"></tbody></table></section>
</main>
<script type="module" src="../../tools/ledger/compare-local-app.js"></script>
</body>
</html>`;
  },
  write() {
    fs.mkdirSync(local.directory, { recursive: true });
    const target = path.join(local.directory, "index.html");
    fs.writeFileSync(target, local.html(), "utf8");
    console.log(`Local comparison page: ${target}`);
  },
};

local.write();
