const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { build } = require("./build.js");

const smoke = {
  fixture(file) {
    return path.join(__dirname, "fixtures", "build-registry", file);
  },
  run() {
    const entry = smoke.fixture("entry.js");
    const context = {};
    vm.runInNewContext(build.registry.bundle(entry), context);
    assert.equal(context.__BUILD_REGISTRY_RESULT__.loads, 1);
    assert.equal(context.__BUILD_REGISTRY_RESULT__.singleton, true);
    assert.equal(
      context.__BUILD_REGISTRY_RESULT__.order,
      "shared,first,consumer,second",
    );
    const stats = build.registry.stats.get(path.resolve(entry));
    assert.equal(stats.emitted, stats.unique);
    assert.equal(stats.unique, 5);
    const storefront = build.primary({
      id: "launchpad",
      hrefGh: "javascript:void 0",
      title: "Launchpad",
      label: "Launchpad",
      bookmarkLabel: "Launchpad",
      ok: "",
      fail: "",
      copy: "href",
      hrefJs: "javascript:void 0",
      distPath: "dist",
      code: "",
      icon: "icon",
    });
    assert.match(storefront, /data-ledger-file/);
    assert.match(storefront, /data-ledger-upload/);
    assert.match(storefront, /title="Дашборд" aria-label="Дашборд"/);
    assert.doesNotMatch(storefront, /Worker Bootstrap/);
    assert.ok(storefront.indexOf("launchpad-primary-guides") < storefront.indexOf("ledger-upload"));
    const ledger = build.ledger.html();
    assert.match(ledger, /<title>Дашборд · Onlíner<\/title>/);
    assert.match(ledger, /<link rel="icon" type="image\/svg\+xml" href="\.\.\/assets\/images\/ledger-favicon\.svg">/);
    assert.match(ledger, /load\.pending\(\)/);
    assert.doesNotMatch(ledger, />Crawler v2</);
    assert.doesNotMatch(ledger, />Участие в ревизиях</);
    assert.match(ledger, /\.raw-picker::after/);
    assert.match(ledger, /background-image: none/);
    assert.match(ledger, /data-visible="\$\{Boolean\(active\)\}"/);
    assert.match(ledger, /\.raw-filter-reset\[data-visible="false"\]/);
    assert.match(ledger, /\.\.\/local-data\/ledger\/index\.json/);
    assert.match(ledger, /onliner-ledger-local-index/);
    assert.match(ledger, /id="rawPeriodPicker"/);
    assert.match(ledger, /id="rawPeriod" aria-label="Период"/);
    assert.match(ledger, /id="rawProofreader" aria-label="Корректор"/);
    assert.doesNotMatch(ledger, /id="rawMeta"/);
    assert.match(ledger, /formatPeriod\(item\.period\)/);
    assert.match(ledger, /\.raw-head \{[^}]*justify-content: flex-start/);
    assert.match(ledger, /load\.dataset\(domEvent\.target\.value/);
    assert.match(ledger, /group\.roster\.some\(\(item\) => item\.id === selected\) \? selected/);
    assert.match(ledger, /host\.endsWith\("\.local"\)/);
    assert.match(ledger, /void load\.local\(!pending\)/);
    assert.doesNotMatch(ledger, /__LEDGER_GROUP_MODULE__/);
    assert.match(ledger, /globalThis\.__ONLINER_LEDGER_GROUP__ = ledgerGroup/);
    assert.match(ledger, /if \(!group\) throw new Error/);
    assert.match(ledger, /Николай Баранов/);
    assert.match(ledger, /#rowsPanel table \{ min-width: 1160px; \}/);
    assert.match(ledger, /@media \(max-width: 1450px\)/);
    assert.doesNotMatch(ledger, /\.\.\/assets\/images\/onliner-logo\.svg/);
    assert.match(ledger, /\.\.\/assets\/images\/wordpress-logo\.svg/);
    assert.doesNotMatch(ledger, /<option value="">Выберите корректора<\/option>/);
    assert.match(ledger, /data-raw-mode-toggle="layout"/);
    assert.match(ledger, /data-raw-filter=/);
    assert.match(ledger, /Средний объём/);
    assert.match(ledger, /class="brand-base"><img src="\.\.\/assets\/images\/ledger\.svg"/);
    assert.doesNotMatch(ledger, /api\.iconify\.design\/fluent-emoji-flat:/);
    assert.doesNotMatch(ledger, /__SURFACE_DESIGN_TOKENS__/);
    assert.match(ledger, /--surface-selection-glow-text-shadow: 0 0 12px currentColor;/);
    assert.match(ledger, /--surface-selection-glow-media-filter: drop-shadow/);
    assert.match(ledger, /data-ui-selection-glow data-raw-filter=/);
    assert.match(ledger, /\.raw-cell-filter:hover \.emoji-icon.*filter: var\(--surface-selection-glow-media-filter\)/);
    assert.match(ledger, /data-raw-filter="date"/);
    assert.match(ledger, /data-raw-filter-reset=.*<img src="\$\{resetIcon\}"/);
    assert.doesNotMatch(ledger, /raw\.stat\("Только autosave"/);
    assert.doesNotMatch(ledger, /<span>знаков<\/span>/);
    assert.doesNotMatch(ledger, /const postMeta =/);
    assert.doesNotMatch(ledger, /<th>Объём<\/th>/);
    assert.match(ledger, /data-raw-filter="author"/);
    assert.match(ledger, /data-raw-filter="tag"/);
    assert.match(ledger, /class="title-volume"/);
    assert.doesNotMatch(ledger, /Ревизии \/ передача/);
    assert.doesNotMatch(ledger, /class="raw-revisions"/);
    assert.match(ledger, /data-raw-filter="signal"/);
    assert.match(ledger, /id="rawAnalytics"/);
    assert.doesNotMatch(ledger, /id="rawInsights"/);
    assert.match(ledger, /data-raw-chart-metric/);
    assert.match(ledger, /data-raw-anomaly-date/);
    assert.match(ledger, /raw\.filterGroup\(signals, "all", "Сигналы", \[\], anomalies\)/);
    assert.match(ledger, /<span>\$\{day\}<\/span>.*sectionIcon.*layoutIcon.*×\$\{item\.count\}/);
    assert.match(ledger, /class="raw-day-line"/);
    assert.match(ledger, /class="raw-day-dot"/);
    assert.match(ledger, /const chartTitle = "Динамика"/);
    assert.match(ledger, /--surface-analytics-chart-canvas: #232529;/);
    assert.match(ledger, /\.raw-day-dot\[data-zero="true"\] \{ border-color: var\(--surface-analytics-chart-primary\); background: var\(--surface-analytics-chart-canvas\); \}/);
    assert.doesNotMatch(ledger, /sectionChart\(rows\)/);
    assert.doesNotMatch(ledger, /По разделам/);
    assert.match(ledger, /data-raw-filter-reset="\$\{escapeHtml\(resetType\)\}"/);
    assert.match(ledger, /Сбросить все фильтры/);
    assert.match(ledger, /formatWeekday\(item\.date\).*formatDate\(item\.date\).*money\(value\)/);
    assert.match(ledger, /metrics: \{ count: "Материалы", words: "Слова" \}/);
    assert.doesNotMatch(ledger, /metrics: \{ count: "Материалы", words: "Слова", revisions:/);
    assert.doesNotMatch(ledger, /class="raw-day-bar"/);
    assert.match(ledger, /class="raw-surface raw-chart-panel"/);
    assert.doesNotMatch(ledger, /class="raw-stat raw-stat-action"/);
    assert.doesNotMatch(ledger, /Максимумы и минимумы/);
    assert.match(ledger, /class="raw-control raw-filter-button raw-chart-metric" data-ui-selection-glow/);
    assert.match(ledger, /--surface-analytics-picker-gap: 24px;/);
    assert.match(ledger, /--surface-analytics-divider: rgba\(255,255,255,\.12\);/);
    assert.match(ledger, /--surface-analytics-panel-radius: 18px;/);
    assert.match(ledger, /\.raw-surface \{[^}]*border-radius: var\(--surface-analytics-panel-radius\);[^}]*background: var\(--surface-analytics-panel-background\);/);
    assert.match(ledger, /\.raw-picker select \{[^}]*font-weight: 400;/);
    assert.match(ledger, /\.raw-picker select:focus, \.raw-picker select:focus-visible \{ outline: none;/);
    assert.match(ledger, /\.raw-picker select option \{[^}]*background: #202329;/);
    assert.match(ledger, /\.raw-summary \.raw-stat-value \{ font-weight: 700; \}/);
    assert.match(ledger, /\.raw-filter-name \{ font-size: 14px; \}/);
    assert.match(ledger, /\.raw-chart-metric \{[^}]*font-size: 14px;/);
    assert.match(ledger, /\.raw-table td \{ font-size: 14px; \}/);
    assert.doesNotMatch(ledger, /\.raw-filters \{[^}]*padding-top:/);
    assert.match(ledger, /#rawPanel button\[data-active="true"\] \{ border-color: transparent; background: transparent; box-shadow: none; \}/);
    assert.match(ledger, /background: var\(--surface-analytics-chart-primary\)/);
    assert.doesNotMatch(ledger, /class="raw-insight-card"/);
    assert.match(ledger, /group\.analytics\.anomalies\(raw\.filtered\(rows\)\)/);
    assert.doesNotMatch(ledger, /Самый загруженный день/);
    assert.match(ledger, /group\.analytics\.days/);
    assert.match(ledger, /Дедлайн/);
    assert.doesNotMatch(ledger, /Поздняя сдача/);
    assert.match(ledger, /Спецпроект/);
    assert.match(ledger, /Эвергрин/);
    assert.match(ledger, /const sticky = raw\.filterEntries\(rows, "sticky", \["left", "right"\]\)/);
    assert.match(ledger, /const materials = \[\.\.\.layouts, \.\.\.types, \.\.\.sticky\]/);
    assert.match(ledger, /raw\.filterGroup\(materials, "material", "Типаж", \[layouts, types, sticky\]\)/);
    assert.match(ledger, /class="raw-filter-separator">·<\/span><span class="raw-filter-count">/);
    assert.match(ledger, /const signals = raw\.filterEntries\(rows, "signal", \["late_handoff"\]\)/);
    assert.match(ledger, /raw\.cell\(item, "layout"\)/);
    assert.match(ledger, /raw\.typeCell\(item\)/);
    assert.match(ledger, /class="raw-title-link" href="\$\{escapeHtml\(publicUrl\)\}"/);
    assert.match(ledger, /<th>Админка<\/th>/);
    assert.match(ledger, /data-raw-mode-toggle="signal"/);
    assert.match(ledger, /\.raw-table th \{ text-align: center; \}/);
    assert.match(ledger, /\.raw-table td\.raw-title-cell \{ text-align: left; \}/);
    assert.match(ledger, /#rawPanel \.table-scroll \{ border: 1px solid var\(--surface-analytics-divider\); border-radius: var\(--surface-analytics-panel-radius\); \}/);
    assert.match(ledger, /const rows = raw\.sorted\(raw\.filtered\(result\.rows\)\)/);
    assert.match(ledger, /text\(right\?\.record\?\.published_at\)\.localeCompare\(text\(left\?\.record\?\.published_at\)\)/);
    assert.match(ledger, /const signals = \(item\?\.signals \|\| \[\]\)\.filter\(\(value\) => value === "late_handoff"\)/);
    assert.doesNotMatch(ledger, /item\.session/);
    assert.doesNotMatch(ledger, /Оценка от предыдущей ревизии/);
    assert.match(ledger, /colspan="6"/);
    assert.doesNotMatch(ledger, /raw\.stat\("Корректор"/);
    assert.doesNotMatch(ledger, /raw\.stat\("Ревизии"/);
    assert.match(ledger, /raw\.stat\("Записи", shown\)/);
    assert.doesNotMatch(ledger, /raw\.cell\(item, "sticky"\)/);
    assert.doesNotMatch(ledger, /data-raw-mode-toggle="sticky"/);
    assert.match(ledger, /body\[data-source-mode="raw"\] \.hero \{ display: none !important; \}/);
    assert.match(ledger, /body\[data-source-mode="raw"\] \.layout \{ grid-template-columns: minmax\(0, 1fr\)/);
    assert.match(ledger, /\.raw-summary \{[^}]*repeat\(2, minmax\(0, 1fr\)\)/);
    assert.match(ledger, /\.raw-filters \{[^}]*minmax\(0, 1fr\) minmax\(0, 2fr\) minmax\(0, 1fr\)/);
    assert.match(ledger, /Юрий Байдаков/);
    assert.match(ledger, /Ян Альшевский/);
    assert.match(ledger, /Наталья Злотник/);
    assert.match(ledger, /group\.author\.name\(record\.author\)/);
    assert.match(ledger, /\[data-ui-selection-glow\]\[data-active="true"\].*text-shadow: var\(--surface-selection-glow-text-shadow\)/);
    const ledgerScripts = [...ledger.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
    ledgerScripts.forEach((script) => {
      assert.doesNotThrow(() => new Function(script));
    });
    const ledgerNodes = new Map();
    const ledgerNode = () => ({
      dataset: {},
      style: {},
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      addEventListener() {},
      appendChild() {},
      remove() {},
      setAttribute() {},
      removeAttribute() {},
      getAttribute() { return ""; },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      closest() { return null; },
      innerHTML: "",
      textContent: "",
      value: "",
      src: "",
      offsetWidth: 0,
    });
    const ledgerBody = ledgerNode();
    const pendingLedger = JSON.stringify({
      schema: "onliner-publications",
      schema_version: 2,
      period: "202609",
      sections: [],
      section_results: [],
      errors: [],
      count: 0,
      records: [],
    });
    let pendingRemoved = false;
    const ledgerAlerts = [];
    const ledgerRuntime = {
      document: {
        body: ledgerBody,
        getElementById(id) {
          if (!ledgerNodes.has(id)) ledgerNodes.set(id, ledgerNode());
          return ledgerNodes.get(id);
        },
        querySelector() { return ledgerNode(); },
        querySelectorAll() { return []; },
        createElement() { return ledgerNode(); },
      },
      sessionStorage: {
        getItem(key) { return key === "onliner-ledger-pending" ? pendingLedger : null; },
        removeItem(key) { if (key === "onliner-ledger-pending") pendingRemoved = true; },
      },
      navigator: {},
      location: { hostname: "example.com", href: "https://example.com/ledger/" },
      window: {},
      alert(message) { ledgerAlerts.push(String(message)); },
      setTimeout() {},
      URL,
      Blob,
    };
    assert.doesNotThrow(() => vm.runInNewContext(ledgerScripts.at(-1), ledgerRuntime));
    assert.deepEqual(ledgerAlerts, []);
    assert.equal(pendingRemoved, true);
    assert.equal(ledgerBody.dataset.loaded, "true");
    assert.equal(ledgerBody.dataset.sourceMode, "raw");
    const storefrontApp = fs.readFileSync(
      path.join(__dirname, "storefront", "app.js"),
      "utf8",
    );
    assert.match(storefrontApp, /assets\/images\/github\.svg/);
    assert.match(storefrontApp, /assets\/images\/javascript\.svg/);
    assert.match(storefrontApp, /assets\/icons\/fluent\/code_20_regular\.svg/);
    assert.doesNotMatch(
      storefrontApp,
      /cdn\.jsdelivr\.net|api\.iconify\.design\/simple-icons/,
    );
    const sandbox = fs.readFileSync(
      path.join(__dirname, "..", "sandbox", "index.html"),
      "utf8",
    );
    const sandboxDiagnostics = fs.readFileSync(
      path.join(__dirname, "..", "assets", "sandbox", "diagnostics.js"),
      "utf8",
    );
    assert.match(sandbox, /id="sandbox-demo-tools"/);
    assert.match(sandboxDiagnostics, /id=\"sandbox-overlay-demo\"/);
    assert.match(sandboxDiagnostics, /crawler\.overlay\.demo/);
    console.log("build registry smoke: ok");
  },
};

smoke.run();
