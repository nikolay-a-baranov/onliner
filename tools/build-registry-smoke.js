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
    assert.match(ledger, /\.raw-filter-reset-wrap\[data-visible="false"\]/);
    assert.doesNotMatch(ledger, /\.raw-filter-reset-wrap\[data-visible="false"\] \{ display: none;/);
    assert.match(ledger, /\.\.\/local-data\/ledger\/index\.json/);
    assert.match(ledger, /onliner-ledger-local-index/);
    assert.match(ledger, /id="rawPeriodPicker"/);
    assert.match(ledger, /id="rawPeriod" aria-label="Период"/);
    assert.match(ledger, /id="rawProofreader" aria-label="Корректор"/);
    assert.match(ledger, /group\.options\.map\(\(item\) => `<option/);
    assert.match(ledger, /group\.display\.dashboard\(item\.name\)/);
    assert.match(ledger, /group\.display\.dashboard\(group\.handoff\.actor\(item\)\)/);
    assert.match(ledger, /group\.display\.dashboard\(entry\.name\)/);
    assert.match(ledger, /state\.raw\.selected = group\.defaults\.proofreader/);
    assert.doesNotMatch(ledger, /id="rawMeta"/);
    assert.match(ledger, /formatPeriod\(item\.period\)/);
    assert.match(ledger, /\.raw-head \{[^}]*justify-content: flex-start/);
    assert.match(ledger, /load\.dataset\(domEvent\.target\.value/);
    assert.match(ledger, /group\.options\.some\(\(item\) => item\.id === selected\) \? selected : group\.defaults\.proofreader/);
    assert.match(ledger, /host\.endsWith\("\.local"\)/);
    assert.match(ledger, /void load\.local\(!pending\)/);
    assert.doesNotMatch(ledger, /__LEDGER_GROUP_MODULE__/);
    assert.match(ledger, /globalThis\.__ONLINER_LEDGER_GROUP__ = ledgerGroup/);
    assert.match(ledger, /section: sectionLabels/);
    assert.match(ledger, /section: sectionIcons/);
    assert.doesNotMatch(ledger, /section: \{ people: "busts-in-silhouette"/);
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
    assert.match(ledger, /--surface-selection-glow-emoji-filter: drop-shadow\(0 0 1px rgba\(255,255,255,\.55\)\) drop-shadow\(0 0 3px rgba\(255,255,255,\.25\)\);/);
    assert.match(ledger, /data-ui-selection-glow data-raw-filter=/);
    assert.match(ledger, /\[data-ui-selection-glow\]:hover img, \[data-ui-selection-glow\]:focus-visible img \{ filter: var\(--surface-selection-glow-media-filter\); \}/);
    assert.match(ledger, /\.raw-cell-filter:hover \.emoji-icon.*filter: var\(--surface-selection-glow-emoji-filter\)/);
    assert.match(ledger, /data-raw-filter="date"/);
    assert.match(ledger, /const filterResetIcon = glyphIcon\(glyphs\.filterDismiss\)/);
    assert.match(ledger, /data-raw-filter-reset=.*<img src="\$\{filterResetIcon\}"/);
    assert.equal(fs.existsSync(path.join(__dirname, "..", "assets", "icons", "fluent", "filter_dismiss_20_regular.svg")), true);
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
    assert.match(ledger, /raw\.resetAll\(\), raw\.filterGroup\(signals, "signal", "Сигналы", signals\.map\(\(entry\) => \[entry\]\), `\$\{duties\}\$\{anomalies\}`, false\)/);
    assert.match(ledger, /const clustered = `\$\{grouped\}\$\{extraHtml\}`/);
    assert.match(ledger, /<span class="raw-filter-cluster" data-filter-cluster="\$\{raw\.motion\.key\(`(?:anomaly|duty)-/);
    assert.match(ledger, /wordForm\(item\.count, \["лонгрид", "лонгрида", "лонгридов"\]\)/);
    assert.doesNotMatch(ledger, /в разделе «\$\{section\}» за день/);
    assert.match(ledger, /group\.analytics\.duties\(raw\.filtered\(rows\)\)/);
    assert.match(ledger, /data-raw-filter="date" data-raw-filter-value="\$\{escapeHtml\(item\.date\)\}"/);
    assert.doesNotMatch(ledger, /два выходных подряд/);
    assert.match(ledger, /item\.sectionCount.*wordForm\(item\.sectionCount, \["раздел", "раздела", "разделов"\]\)/);
    assert.doesNotMatch(ledger, /item\.news.*item\.longreads/);
    assert.doesNotMatch(ledger, /<span>\$\{day\}<\/span>.*layoutIcon.*×\$\{item\.count\}/);
    assert.match(ledger, /class="raw-day-line"/);
    assert.match(ledger, /class="raw-day-dot"/);
    assert.match(ledger, /const chartTitle = "Динамика"/);
    assert.match(ledger, /--surface-analytics-chart-canvas: #232529;/);
    assert.match(ledger, /\.raw-day-dot\[data-zero="true"\] \{ border-color: var\(--surface-analytics-chart-primary\); background: var\(--surface-analytics-chart-canvas\); \}/);
    assert.doesNotMatch(ledger, /sectionChart\(rows\)/);
    assert.doesNotMatch(ledger, /По разделам/);
    assert.match(ledger, /data-raw-filter-reset="\$\{escapeHtml\(resetType\)\}"/);
    assert.match(ledger, /class="raw-filter-reset-wrap" data-visible="\$\{Boolean\(active\)\}"><span class="raw-filter-separator">·<\/span><button/);
    assert.match(ledger, /Сбросить все фильтры/);
    assert.match(ledger, /const alternative = item\[metric === "count" \? "words" : "count"\]/);
    assert.match(ledger, /formatWeekday\(item\.date\).*formatChartDate\(item\.date\).*money\(value\).*money\(alternative\)/);
    assert.match(ledger, /rawAnalytics\.curve\(points\)/);
    assert.match(ledger, /<path d="\$\{path\}"><\/path>/);
    assert.doesNotMatch(ledger, /<polyline/);
    assert.match(ledger, /metrics: \{ words: "Слова", count: "Материалы" \}/);
    assert.doesNotMatch(ledger, /metrics: \{ count: "Материалы", words: "Слова", revisions:/);
    assert.doesNotMatch(ledger, /class="raw-day-bar"/);
    assert.match(ledger, /class="raw-surface raw-chart-panel"/);
    assert.doesNotMatch(ledger, /class="raw-stat raw-stat-action"/);
    assert.doesNotMatch(ledger, /Максимумы и минимумы/);
    assert.match(ledger, /class="raw-control raw-filter-button raw-chart-metric" data-raw-chart-metric=/);
    assert.doesNotMatch(ledger, /class="raw-control raw-filter-button raw-chart-metric" data-ui-selection-glow/);
    assert.match(ledger, /metricButton\(\)/);
    assert.match(ledger, /state\.raw\.metric === "words" \? "count" : "words"/);
    assert.match(ledger, /metric: "words"/);
    assert.match(ledger, /--surface-analytics-picker-gap: 24px;/);
    assert.match(ledger, /--surface-analytics-divider: rgba\(255,255,255,\.12\);/);
    assert.match(ledger, /--surface-analytics-panel-radius: 18px;/);
    assert.match(ledger, /--surface-analytics-panel-background: rgba\(255,255,255,\.04\);/);
    assert.match(ledger, /--surface-analytics-stat-background: rgba\(255,255,255,\.065\);/);
    assert.match(ledger, /--surface-analytics-cluster-background: rgba\(255,255,255,\.09\);/);
    assert.match(ledger, /--surface-analytics-cluster-border: rgba\(255,255,255,\.18\);/);
    assert.match(ledger, /--surface-analytics-cluster-motion-duration: 0\.8s;/);
    assert.match(ledger, /--surface-analytics-cluster-diffusion-blur: 10px;/);
    assert.doesNotMatch(ledger, /--surface-analytics-cluster-diffusion-scale:/);
    assert.match(ledger, /--surface-analytics-cluster-motion-out-easing: cubic-bezier\(\.4,0,1,1\);/);
    assert.match(ledger, /--surface-analytics-cluster-motion-in-easing: cubic-bezier\(0,0,\.2,1\);/);
    assert.match(ledger, /--surface-toolbar-icon-motion-duration: 0\.24s;/);
    assert.match(ledger, /--surface-toolbar-icon-motion-easing: cubic-bezier\(\.16,\.84,\.32,1\);/);
    assert.match(ledger, /\.raw-surface \{[^}]*border-radius: var\(--surface-analytics-panel-radius\);[^}]*background: var\(--surface-analytics-panel-background\);/);
    assert.match(ledger, /\.raw-panel \{[^}]*border: 0;[^}]*background: transparent;[^}]*box-shadow: none;/);
    assert.match(ledger, /\.raw-picker select \{[^}]*font-weight: 400;/);
    assert.match(ledger, /\.raw-pickers \{[^}]*justify-content: space-between;/);
    assert.match(ledger, /\.raw-picker select:focus, \.raw-picker select:focus-visible \{ outline: none;/);
    assert.match(ledger, /\.raw-picker select option \{[^}]*background: #202329;/);
    assert.match(ledger, /\.raw-summary \.raw-stat-value \{ font-weight: 400; \}/);
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
    assert.match(ledger, /const layouts = raw\.filterEntries\(rows, "layout", \["news", "longread", "photoreport"\]\)\.map\(\(entry\) => \(\{ \.\.\.entry, compact: true \}\)\)/);
    assert.match(ledger, /const types = raw\.filterEntries\(rows, "signal", \["special", "evergreen"\]\)\.map\(\(entry\) => \(\{ \.\.\.entry, compact: true \}\)\)/);
    assert.match(ledger, /const sticky = raw\.filterEntries\(rows, "sticky", \["left", "right"\]\)\.map\(\(entry\) => \(\{ \.\.\.entry, compact: true \}\)\)/);
    assert.match(ledger, /const materials = \[\.\.\.sections, \.\.\.layouts, \.\.\.types, \.\.\.sticky\]/);
    assert.match(ledger, /raw\.filterGroup\(materials, "material", "Типаж", \[sections, layouts, types, sticky\]\)/);
    assert.match(ledger, /const label = compact \? "" : `<span class="raw-filter-name">/);
    assert.match(ledger, /data-compact="\$\{compact\}"/);
    assert.match(ledger, /aria-label="\$\{escapeHtml\(title\)\}"/);
    assert.match(ledger, /class="raw-filter-count">×\$\{count\}<\/span>/);
    assert.match(ledger, /\.raw-filter-count \{[^}]*font-weight: 400;/);
    assert.match(ledger, /\.raw-filter-group\[data-filter-group="signal"\] \.raw-filter-button\[data-compact="true"\] \{ gap: 0; \}/);
    assert.match(ledger, /\.raw-filter-reset-all button \{[^}]*width: 72px;[^}]*height: 100%;/);
    assert.match(ledger, /\.raw-filter-reset-all img \{[^}]*height: 50%;/);
    assert.match(ledger, /class="raw-filter-reset-all"><button type="button" data-raw-filter-reset="all"/);
    assert.doesNotMatch(ledger, /\.raw-filter-reset-all\[data-visible="false"\]/);
    assert.match(ledger, /\.raw-anomaly:hover, \.raw-anomaly:focus-visible \{ color: var\(--soft\);/);
    assert.match(ledger, /filter: `blur\(\$\{effect\.blur\}\)`/);
    assert.doesNotMatch(ledger, /transform: `scale\(\$\{effect\.scale\}\)`/);
    assert.match(ledger, /await raw\.motion\.animate\(node, raw\.motion\.disperse\(node\), "out"\)/);
    assert.match(ledger, /const property = direction === "out" \? "--surface-analytics-cluster-motion-out-easing" : "--surface-analytics-cluster-motion-in-easing"/);
    assert.match(ledger, /if \(typeof animation\.commitStyles === "function"\) animation\.commitStyles\(\);\s+animation\.cancel\(\);/);
    assert.doesNotMatch(ledger, /animation\.finished\.catch\(\(\) => \{\}\)\.finally\(\(\) => animation\.cancel\(\)\)/);
    assert.match(ledger, /async replace\(node, html\) \{\s+const version = raw\.motion\.version\(node\);\s+if \(node\.innerHTML === html\) return;/);
    assert.match(ledger, /node\.innerHTML = html;\s+await raw\.motion\.animate\(node, raw\.motion\.gather\(node\)\)/);
    assert.match(ledger, /raw\.motion\.replace\(existing, desiredNode\.innerHTML\)/);
    assert.match(ledger, /return raw\.motion\.animate\(node, raw\.motion\.gather\(node\)\)/);
    assert.match(ledger, /await Promise\.all\(current\.map\(\(item\) => raw\.motion\.animate\(item, raw\.motion\.disperse\(item\), "out"\)\)\)/);
    assert.match(ledger, /await Promise\.all\(desired\.map\(raw\.motion\.expand\)\)/);
    assert.match(ledger, /if \(transition === "reset"\) \{\s+raw\.motion\.reset\(node, html, version\)/);
    assert.match(ledger, /raw\.render\("reset"\)/);
    assert.match(ledger, /raw\.render\(active \? "reset" : ""\)/);
    assert.match(ledger, /typeof Element\.prototype\.animate !== "function"/);
    assert.doesNotMatch(ledger, /view-transition-name|startViewTransition/);
    assert.match(ledger, /raw\.motion\.render\(byId\("rawFilters"\)/);
    assert.doesNotMatch(ledger, /class="raw-control raw-filter-button" data-ui-selection-glow data-raw-filter=/);
    assert.match(ledger, /data-cluster-count="\$\{groups\.length\}"/);
    assert.match(ledger, /\.raw-filter-clusters \{[^}]*flex-wrap: wrap;/);
    assert.match(ledger, /\.raw-filter-cluster \{[^}]*max-width: 100%;[^}]*flex-wrap: wrap;/);
    assert.doesNotMatch(ledger, /repeat\(4, max-content\)/);
    assert.match(ledger, /@media \(max-width: 1180px\) \{\s*\.raw-filters \{ grid-template-columns: 1fr; \}/);
    assert.match(ledger, /const empty = resetType === "signal" \? "" : `<span class="muted">Нет данных<\/span>`/);
    assert.match(ledger, /shared_review: "Несколько корректоров"/);
    assert.match(ledger, /signal: \{ special: "admission-tickets", evergreen: "evergreen-tree", late_handoff: "timer-clock", shared_review: "busts-in-silhouette", duty: "safety-vest" \}/);
    assert.doesNotMatch(ledger, /late_handoff: "alarm-clock"/);
    assert.match(ledger, /const sections = raw\.filterEntries\(rows, "section"\)\.map\(\(entry\) => \(\{ \.\.\.entry, compact: true \}\)\)/);
    assert.match(ledger, /const signals = raw\.filterEntries\(rows, "signal", \["late_handoff", "shared_review"\]\)\.map\(\(entry\) => \(\{ \.\.\.entry, compact: true, tooltip: raw\.signalFilterTitle\(rows, entry\) \}\)\)/);
    assert.match(ledger, /const personal = state\.raw\.selected !== group\.aggregate\.id/);
    assert.match(ledger, /const duties = personal \? raw\.dutyButtons\(rows\) : ""/);
    assert.match(ledger, /const anomalies = personal \? raw\.anomalyButtons\(rows\) : ""/);
    assert.doesNotMatch(ledger, /raw\.filterGroup\(sections, "section", "Разделы"\)/);
    assert.match(ledger, /\.raw-filter-cluster \{[^}]*border: 1px solid var\(--surface-analytics-cluster-border\);[^}]*border-radius: 999px;[^}]*background: var\(--surface-analytics-cluster-background\);/);
    assert.doesNotMatch(ledger, /\.raw-filter-cluster \+ \.raw-filter-cluster \{[^}]*border-left:/);
    assert.match(ledger, /raw\.cell\(item, "layout"\)/);
    assert.match(ledger, /raw\.typeCell\(item\)/);
    assert.match(ledger, /class="raw-title-link" href="\$\{escapeHtml\(publicUrl\)\}"/);
    assert.doesNotMatch(ledger, /<th>Админка<\/th>/);
    assert.match(ledger, /class="link-pill raw-title-admin"/);
    assert.match(ledger, /const pieces = \[admin, authorHtml, volumeHtml/);
    assert.match(ledger, /<div class="title-text">\$\{titleHtml\}<\/div>\$\{raw\.titleMeta\(item\)\}/);
    assert.match(ledger, /\.raw-filter-group, \.raw-filter-clusters \{ animation: none; transition: none; \}/);
    assert.match(ledger, /data-raw-mode-toggle="signal"/);
    assert.match(ledger, /\.raw-table th \{ text-align: center; \}/);
    assert.match(ledger, /\.raw-table td\.raw-title-cell \{ text-align: left; \}/);
    assert.match(ledger, /#rawPanel \.table-scroll \{ max-height: none; border: 1px solid var\(--surface-analytics-divider\); border-radius: var\(--surface-analytics-panel-radius\); \}/);
    assert.match(ledger, /\.table-scroll \{[^}]*scroll-snap-type: y mandatory; scroll-padding-top: 52px;/);
    assert.match(ledger, /tbody tr \{ scroll-snap-align: start; scroll-snap-stop: always; \}/);
    assert.match(ledger, /const rows = raw\.sorted\(raw\.filtered\(result\.rows\)\)/);
    assert.match(ledger, /text\(left\?\.record\?\.published_at\)\.localeCompare\(text\(right\?\.record\?\.published_at\)\)/);
    assert.match(ledger, /const signals = \(item\?\.signals \|\| \[\]\)\.filter\(\(value\) => \["late_handoff", "shared_review"\]\.includes\(value\)\)/);
    assert.match(ledger, /item\.proofreading\.map/);
    assert.match(ledger, /raw\.revisionTitle\(item\.handoff\.previous\)\}\\n\$\{raw\.revisionTitle\(item\.handoff\.first\)\}/);
    assert.doesNotMatch(ledger, /\\n→ \$\{raw\.revisionTitle/);
    assert.doesNotMatch(ledger, /return `\$\{name\}:/);
    assert.match(ledger, /tooltip: raw\.signalFilterTitle\(rows, entry\)/);
    assert.match(ledger, /emojiImage\("signal", value, false\)/);
    assert.doesNotMatch(ledger, /item\.session/);
    assert.doesNotMatch(ledger, /Оценка от предыдущей ревизии/);
    assert.match(ledger, /colspan="5"/);
    assert.doesNotMatch(ledger, /colspan="6"/);
    assert.match(ledger, /class="date-stack raw-date-stack"/);
    assert.match(ledger, /class="muted">\$\{escapeHtml\(formatWeekdayFull\(value\).*formatDate\(value\).*published\.time/);
    assert.match(ledger, /const labelText = .*\? day : ""/);
    assert.match(ledger, /class="title-tag-item"/);
    assert.match(ledger, /index < tags\.length - 1 \? `<span class="title-separator">,<\/span>`/);
    assert.match(ledger, /const intersects = \["section", "layout", "sticky", "signal"\]\.includes\(type\)/);
    assert.match(ledger, /const materialActive = Boolean\(state\.raw\.filters\.section/);
    assert.doesNotMatch(ledger, /raw\.stat\("Корректор"/);
    assert.doesNotMatch(ledger, /raw\.stat\("Ревизии"/);
    assert.match(ledger, /raw\.stat\("Записи", shown\)/);
    assert.doesNotMatch(ledger, /raw\.cell\(item, "sticky"\)/);
    assert.doesNotMatch(ledger, /data-raw-mode-toggle="sticky"/);
    assert.match(ledger, /body\[data-source-mode="raw"\] \.hero \{ display: none !important; \}/);
    assert.match(ledger, /body\[data-source-mode="raw"\] \.layout \{ grid-template-columns: minmax\(0, 1fr\)/);
    assert.match(ledger, /\.raw-summary \{[^}]*repeat\(3, minmax\(0, 1fr\)\)/);
    assert.match(ledger, /@media \(max-width: 1450px\) \{[\s\S]*?\.raw-summary \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\); \}/);
    assert.match(ledger, /@media \(max-width: 620px\) \{\s*\.raw-summary \{ grid-template-columns: 1fr; \}/);
    assert.match(ledger, /raw\.stat\("Общий объём", money\(words\)\)/);
    assert.match(ledger, /\.link-icon-wordpress \{[^}]*filter: none;/);
    assert.match(ledger, /\.raw-filters \{[^}]*minmax\(0, 1fr\) 72px minmax\(0, 1fr\)/);
    assert.doesNotMatch(ledger, /#rawPanel \.table-scroll::?-webkit-scrollbar/);
    assert.ok(ledger.indexOf('id="rawSummary"') < ledger.indexOf('id="rawAnalytics"'));
    assert.ok(ledger.indexOf('id="rawAnalytics"') < ledger.indexOf('id="rawFilters"'));
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
