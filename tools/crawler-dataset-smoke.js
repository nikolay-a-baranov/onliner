const assert = require("node:assert/strict");

const run = async () => {
  global.location = {
    hostname: "people.onliner.by",
    href: "https://people.onliner.by/wp-admin/edit.php",
    origin: "https://people.onliner.by",
  };
  global.document = { title: "Crawler dataset smoke" };
  global.window = {
    reportStop: false,
    setTimeout,
    clearTimeout,
  };
  const { attachCrawler } = await import("../src/actions/tools/crawler.js");
  const { styles } = await import("../src/core/surface/styles.js");
  const admin = {};
  const archived = { files: [], name: "", options: null };
  attachCrawler(admin, {
    textFile: (name, text, type) => ({
      name,
      blob: new Blob([text], { type }),
    }),
    zipBlob: async (files, name, options) => {
      archived.files = files;
      archived.name = name;
      archived.options = options;
      return new Blob(["zip"], { type: "application/zip" });
    },
    downloadBlob: (name) => {
      archived.name = name;
    },
  });
  const progressCss = styles.filter.panel();
  assert.match(progressCss, /grid-template-columns: repeat\(3, minmax\(84px, 1fr\)\);/);
  admin.crawler.tags.plain = (value) => String(value || "").trim();
  assert.deepEqual(admin.crawler.report.request(), { timeout: 30000, retries: 1 });
  assert.deepEqual(admin.crawler.report.request("detail"), { timeout: 20000, retries: 1 });
  const listRow = (values) => {
    const fields = {
      ".row-title": {
        href: "https://people.onliner.by/wp-admin/post.php?post=1&action=edit",
        textContent: "Заголовок",
      },
      ".author": { textContent: "Автор" },
      ".tags": { textContent: values.join(", ") || "Меток нет" },
      "#inline_1 .aa": { textContent: "2026" },
      "#inline_1 .mm": { textContent: "09" },
      "#inline_1 .jj": { textContent: "01" },
      "#inline_1 .hh": { textContent: "10" },
      "#inline_1 .mn": { textContent: "00" },
    };
    return {
      id: "post-1",
      querySelector: (selector) => fields[selector] || null,
      querySelectorAll: (selector) => selector === ".tags a"
        ? values.map((value) => ({ textContent: value }))
        : [],
    };
  };
  const taggedRow = admin.crawler.report.row(
    listRow(["Новости, аналитика", "Разбор [2026]"]),
    "people",
    true,
  );
  const emptyRow = admin.crawler.report.row(listRow([]), "people", true);
  const reportRow = admin.crawler.report.row(listRow(["Наука"]), "people");
  assert.deepEqual(taggedRow.datasetTags, ["Новости, аналитика", "Разбор [2026]"]);
  assert.deepEqual(emptyRow.datasetTags, []);
  assert.equal(Object.hasOwn(reportRow, "datasetTags"), false);
  const revision = ({ text, href = "https://people.onliner.by/wp-admin/revision.php?revision=1336105" }) => {
    const link = {
      textContent: "01.10.2026, 09:22",
      getAttribute: (name) => name === "href" ? href : "",
    };
    return {
      textContent: text,
      querySelector: (selector) => ["a", "a[href]"].includes(selector) ? link : null,
    };
  };
  const autosave = revision({
    text: "[Автосохранение] автора Дарья Коско 01.10.2026, 09:22",
  });
  assert.deepEqual(admin.crawler.dataset.revision.parse(autosave), {
    id: "1336105",
    author: "Дарья Коско",
    autosave: true,
    date: "2026-10-01",
    time: "09:22",
  });
  assert.equal(
    admin.crawler.report.revisionAuthor(autosave),
    "[Автосохранение] автора Дарья Коско",
  );
  const ambiguous = admin.crawler.dataset.revision.parse(revision({
    text: "редактор не указан 01.10.2026, 09:22",
    href: "",
  }));
  assert.equal(ambiguous.author, "редактор не указан");
  assert.equal(ambiguous.autosave, false);
  assert.equal(ambiguous.id, null);
  assert.equal(ambiguous.raw, "редактор не указан 01.10.2026, 09:22");
  admin.crawler.dataset.metrics = () => ({ words: 1, chars: 4, chars_no_spaces: 4 });
  admin.crawler.report.specialProject = () => false;
  admin.crawler.report.evergreen = () => false;
  const madtestContent = '<p>Текст</p><script src="https://madte.st/sdk-v2.js"></script><div data-id="192098" class="embed madtest"></div>';
  assert.equal(admin.crawler.dataset.madtest.id(madtestContent), "192098");
  assert.equal(admin.crawler.dataset.madtest.id("<p>Текст без теста</p>"), null);
  const fields = {
    "#content": { value: madtestContent },
    "#title": { value: "Заголовок" },
    "#post_status": { value: "publish" },
    "#layout_select": { value: "news" },
    "#post_source": { value: "Источник" },
  };
  const detailDocument = {
    querySelector: (selector) => fields[selector] || null,
    querySelectorAll: (selector) => selector === "#revisionsdiv li" ? [autosave] : [],
  };
  const row = {
    id: "1",
    section: "people",
    live: "https://people.onliner.by/1",
    edit: "https://people.onliner.by/wp-admin/post.php?post=1&action=edit",
    title: "Заголовок",
    author: "Автор",
    date: "2026-09-01",
    time: "10:00",
    sticky: "",
    tags: "Новости, аналитика, Наука",
    datasetTags: ["Новости, аналитика", "Наука"],
  };
  const detail = admin.crawler.dataset.detail(row, detailDocument);
  assert.deepEqual(detail.tags, ["Новости, аналитика", "Наука"]);
  assert.equal(detail.madtest, "192098");
  assert.equal(detail.revisions[0].author, "Дарья Коско");
  assert.equal(detail.revisions[0].autosave, true);
  fields["#content"].value = "Текст без теста";
  assert.equal(admin.crawler.dataset.detail(row, detailDocument).madtest, null);
  assert.throws(
    () => admin.crawler.dataset.detail({ ...row, author: "" }, detailDocument),
    /author/,
  );
  assert.throws(
    () => admin.crawler.dataset.detail({ ...row, date: "--" }, detailDocument),
    /published_at/,
  );
  const prepared = admin.crawler.dataset.records.prepare([
    { section: "people", post_id: "1", title: "Первая" },
    { section: "people", post_id: "1", title: "Дубль" },
    { section: "auto", post_id: "1", title: "Другой раздел" },
  ]);
  assert.equal(prepared.values.length, 2);
  assert.equal(prepared.diagnostics.length, 1);
  assert.equal(prepared.diagnostics[0].type, "duplicate");
  assert.match(prepared.diagnostics[0].message, /Дубликат/);
  const missingResult = admin.crawler.dataset.results.prepare(
    ["people", "sport"],
    [{ section: "people", status: "completed", count: 1, scanned: 1, expected: 1 }],
  );
  assert.equal(missingResult.values[1].status, "failed");
  assert.equal(missingResult.errors[0].section, "sport");
  assert.equal(
    admin.crawler.dataset.filename(
      { key: "202609" },
      { section: "people", count: 233 },
      "20261028155428",
    ),
    "onliner-202609-people-233-20261028155428.json",
  );
  assert.equal(
    admin.crawler.dataset.filename(
      { key: "202609" },
      { count: 1400 },
      "20261028155428",
    ),
    "onliner-202609-20261028155428.json",
  );
  const reportArchive = await admin.crawler.report.archive.download(
    [row],
    {
      period: { key: "202609" },
      section: "people",
      user: "Николай Баранов",
    },
    [{ section: "people", error: "Тестовая ошибка" }],
  );
  assert.match(reportArchive, /^onliner-report-202609-people-nb-1-\d{14}\.zip$/);
  assert.equal(archived.name, reportArchive);
  assert.deepEqual(archived.options, { root: true });
  assert.equal(archived.files.length, 3);
  assert.match(archived.files[0].name, /\.csv$/);
  assert.match(archived.files[1].name, /\.txt$/);
  assert.match(archived.files[2].name, /-errors\.json$/);
  admin.crawler.tags.load = async () => {
    throw new Error("Ошибка страницы");
  };
  const errors = [];
  const failedOutcome = {};
  const records = await admin.crawler.report.collect(location.href, {
    dataset: true,
    errors,
    maxPages: 1,
    section: "people",
    user: "Тест",
    outcome: failedOutcome,
  });
  assert.deepEqual(records, []);
  assert.equal(errors.length, 1);
  assert.match(errors[0].error, /Ошибка страницы/);
  assert.deepEqual(failedOutcome, {
    section: "people",
    status: "failed",
    count: 0,
    scanned: 0,
    expected: 0,
  });
  await assert.rejects(
    admin.crawler.report.collect(location.href, {
      dataset: false,
      maxPages: 1,
      section: "people",
      user: "Тест",
    }),
    /Ошибка страницы/,
  );
  const progress = [];
  const listDocument = {
    querySelectorAll: (selector) => selector === "#the-list tr[id^='post-']" ? [{}] : [],
  };
  let loadCount = 0;
  admin.crawler.tags.load = async () => {
    loadCount += 1;
    return loadCount === 1 ? listDocument : detailDocument;
  };
  admin.crawler.tags.next = () => "";
  admin.crawler.report.pagination = () => ({ page: 1, totalPages: 1, totalItems: 1 });
  admin.crawler.report.rows = () => [row];
  admin.crawler.report.progress = (value) => progress.push(value);
  admin.crawler.dataset.detail = () => ({ section: "people", post_id: "1" });
  const completedOutcome = {};
  const completed = await admin.crawler.report.collect(location.href, {
    dataset: true,
    errors: [],
    maxPages: 1,
    section: "people",
    user: "Тест",
    outcome: completedOutcome,
  });
  assert.equal(completed.length, 1);
  assert.equal(progress.some((item) => item.done === 1), true);
  assert.deepEqual(completedOutcome, {
    section: "people",
    status: "completed",
    count: 1,
    scanned: 1,
    expected: 1,
  });
  let emptyLoads = 0;
  admin.crawler.tags.load = async () => {
    emptyLoads += 1;
    return {
      querySelector: () => null,
      querySelectorAll: () => [],
    };
  };
  admin.crawler.tags.next = () => "https://people.onliner.by/wp-admin/edit.php?paged=2";
  admin.crawler.report.pagination = () => ({ page: 1, totalPages: 20, totalItems: 0 });
  admin.crawler.report.rows = () => [];
  const emptyOutcome = {};
  const emptyRecords = await admin.crawler.report.collect(location.href, {
    dataset: true,
    errors: [],
    maxPages: 20,
    section: "sport",
    user: "Тест",
    outcome: emptyOutcome,
  });
  assert.deepEqual(emptyRecords, []);
  assert.equal(emptyLoads, 1);
  assert.equal(emptyOutcome.status, "empty");
  let lastPageLoads = 0;
  admin.crawler.tags.load = async () => {
    lastPageLoads += 1;
    return lastPageLoads % 2 ? {
      querySelector: (selector) => selector === ".tablenav-pages .total-pages" ? {} : null,
      querySelectorAll: (selector) => selector === "#the-list tr[id^='post-']" ? [{}] : [],
    } : detailDocument;
  };
  admin.crawler.report.pagination = () => ({ page: 2, totalPages: 2, totalItems: 1 });
  admin.crawler.report.rows = () => [row];
  const lastPageRecords = await admin.crawler.report.collect(location.href, {
    dataset: true,
    errors: [],
    maxPages: 20,
    section: "people",
    user: "Тест",
  });
  assert.equal(lastPageRecords.length, 1);
  assert.equal(lastPageLoads, 2);
  const state = admin.crawler.sections.state;
  assert.equal(admin.crawler.sections.workerTimeout, 60000);
  assert.equal(
    admin.crawler.sections.period.default(new Date(2026, 9, 2)).key,
    "202609",
  );
  assert.equal(
    admin.crawler.sections.period.default(new Date(2026, 9, 31)).key,
    "202610",
  );
  assert.deepEqual(
    admin.crawler.sections.period.options(new Date(2026, 9, 29), 3).map((item) => item.key),
    ["202610", "202609", "202608"],
  );
  assert.equal(
    admin.crawler.sections.period.label({ key: "202609" }, true),
    "Сентябрь 2026",
  );
  assert.equal(
    admin.crawler.sections.period.short({ key: "202609" }),
    "Сен 2026",
  );
  assert.equal(admin.crawler.sections.display.user("Николай Баранов"), "НБ");
  assert.equal(admin.crawler.sections.display.user("Николай Александрович Баранов"), "НБ");
  assert.equal(admin.crawler.sections.display.user("Редактор"), "Р");
  assert.equal(admin.crawler.sections.display.user("Все"), "Все");
  const worker = {};
  const originalNext = admin.crawler.sections.next;
  const originalStatus = admin.crawler.sections.status;
  const originalOrigin = admin.crawler.sections.currentOrigin;
  state.running = true;
  state.worker = worker;
  state.mode = "dataset";
  state.sections = ["people", "sport", "money"];
  state.index = 0;
  state.records = [];
  state.errors = [];
  state.results = [];
  admin.crawler.sections.next = () => {
    state.index += 1;
    return true;
  };
  admin.crawler.sections.status = () => true;
  admin.crawler.sections.currentOrigin = (section) => `https://${section}.onliner.by`;
  const timeoutBeforeProgress = window.setTimeout;
  const clearTimeoutBeforeProgress = window.clearTimeout;
  const scheduled = [];
  const cleared = [];
  window.setTimeout = (callback, timeout) => {
    scheduled.push({ callback, timeout });
    return scheduled.length;
  };
  window.clearTimeout = (timer) => cleared.push(timer);
  admin.crawler.sections.receive({
    source: worker,
    origin: "https://people.onliner.by",
    data: {
      source: "launchpad",
      type: "report.sections.progress",
      section: "people",
      progress: { done: 1 },
    },
  });
  assert.equal(scheduled[0].timeout, 75000);
  assert.equal(state.workerTimer, 1);
  admin.crawler.sections.receive({
    source: worker,
    origin: "https://people.onliner.by",
    data: {
      source: "launchpad",
      type: "report.sections.progress",
      section: "people",
      progress: { done: 2 },
    },
  });
  assert.equal(scheduled[1].timeout, 75000);
  assert.equal(cleared.includes(1), true);
  const resetBeforeTimeout = admin.crawler.sections.reset;
  let timeoutMessage = "";
  let resetAfterTimeout = false;
  global.alert = (value) => {
    timeoutMessage = value;
  };
  admin.crawler.sections.reset = () => {
    resetAfterTimeout = true;
    return true;
  };
  state.mode = "report";
  scheduled[1].callback();
  assert.equal(resetAfterTimeout, true);
  assert.match(timeoutMessage, /75 секунд/);
  admin.crawler.sections.reset = resetBeforeTimeout;
  state.mode = "dataset";
  window.setTimeout = timeoutBeforeProgress;
  window.clearTimeout = clearTimeoutBeforeProgress;
  window.clearTimeout(state.workerTimer);
  state.workerTimer = 0;
  const send = (section, recordsValue, result) => admin.crawler.sections.receive({
    source: worker,
    origin: `https://${section}.onliner.by`,
    data: {
      source: "launchpad",
      type: "report.sections.worker",
      section,
      mode: "dataset",
      records: recordsValue,
      errors: [],
      result,
    },
  });
  const peopleResult = {
    section: "people",
    status: "completed",
    count: 1,
    scanned: 1,
    expected: 1,
  };
  send("people", [{ section: "people", post_id: "1" }], peopleResult);
  assert.equal(state.index, 1);
  assert.equal(state.records.length, 1);
  assert.equal(state.results.length, 1);
  send("people", [{ section: "people", post_id: "1" }], peopleResult);
  assert.equal(state.index, 1);
  assert.equal(state.records.length, 1);
  assert.equal(state.results.length, 1);
  send("sport", [], {
    section: "sport",
    status: "empty",
    count: 0,
    scanned: 0,
    expected: 0,
  });
  assert.equal(state.index, 2);
  assert.equal(state.results[1].status, "empty");
  state.workerStamp = 7;
  let staleTimeoutAlerted = false;
  global.alert = () => {
    staleTimeoutAlerted = true;
  };
  admin.crawler.sections.fail("sport", 7);
  assert.equal(staleTimeoutAlerted, false);
  assert.equal(state.index, 2);
  send("money", [], null);
  assert.equal(state.index, 3);
  assert.equal(state.results[2].status, "failed");
  assert.match(state.errors.at(-1).error, /Worker/);
  admin.crawler.sections.next = originalNext;
  admin.crawler.sections.status = originalStatus;
  admin.crawler.sections.currentOrigin = originalOrigin;
  const periodPopup = admin.crawler.sections.period.html(new Date(2026, 9, 28));
  assert.match(periodPopup, /data-crawler-period-select="true"/);
  assert.match(periodPopup, /crawler-period-head" data-pack="spread"/);
  assert.doesNotMatch(periodPopup, /Период сбора/);
  assert.match(periodPopup, /<optgroup label="2026">/);
  assert.match(periodPopup, /value="202609" selected>Сентябрь<\/option>/);
  assert.match(periodPopup, /<optgroup label="2025">/);
  assert.match(periodPopup, /value="202510">Октябрь<\/option>/);
  const progressStrip = admin.crawler.sections.statusStrip(
    "sport",
    ["people", "sport", "money"],
    1,
  );
  assert.match(progressStrip, /data-section="people" data-status="completed"/);
  assert.match(progressStrip, /data-section="sport" data-status="current"/);
  assert.match(progressStrip, /data-section="money" data-status="upcoming"/);
  const progressPanel = admin.crawler.sections.statusPanel(
    {
      title: "202609",
      done: 7,
      totalItems: 10,
      matched: 6,
      failed: 1,
      period: { key: "202609" },
      user: "Николай Баранов",
    },
    "sport",
    ["people", "sport", "money"],
    1,
  );
  assert.match(progressPanel, /data-crawler-progress-counter="true"/);
  assert.match(progressPanel, /data-head-flex="true"/);
  assert.match(progressPanel, /data-show-label="false"/);
  assert.match(progressPanel, /data-admin-stack-head="true"/);
  assert.match(progressPanel, /data-admin-stack-body data-mode="crawler-progress"/);
  assert.doesNotMatch(progressPanel, /crawler-progress-summary/);
  assert.match(progressPanel, /data-crawler-progress-metric="collected"/);
  assert.match(progressPanel, /data-crawler-progress-metric="period"/);
  assert.match(progressPanel, /data-crawler-progress-metric="user"/);
  assert.doesNotMatch(progressPanel, /data-crawler-progress-metric="page"/);
  assert.match(progressPanel, /data-emoji="calendar"/);
  assert.match(progressPanel, /data-emoji="spiral-notepad"/);
  assert.doesNotMatch(progressPanel, /data-emoji="(?:page-facing-up|receipt)"/);
  assert.deepEqual(
    ["period", "collected", "user"].map((name) =>
      progressPanel.indexOf(`data-crawler-progress-metric="${name}"`)),
    ["period", "collected", "user"]
      .map((name) => progressPanel.indexOf(`data-crawler-progress-metric="${name}"`))
      .sort((left, right) => left - right),
  );
  assert.match(progressPanel, /crawler-progress-metric[^>]+data-rail-group="true"/);
  assert.doesNotMatch(progressPanel, /ui-field-control crawler-progress-metric/);
  assert.match(progressPanel, /aria-label="Месяц"/);
  assert.match(progressPanel, /aria-label="Записи"/);
  assert.match(progressPanel, /aria-label="Пользователь"/);
  const counterText = { textContent: "" };
  const counterLabel = { textContent: "" };
  const counterAttributes = {};
  const counter = {
    querySelector: (selector) => selector === ".ui-counter-text"
      ? counterText
      : selector === ".ui-counter-label"
        ? counterLabel
        : null,
    style: { setProperty() {} },
    setAttribute: (name, value) => {
      counterAttributes[name] = value;
    },
  };
  const metric = () => ({
    dataset: {},
    value: { textContent: "" },
    querySelector(selector) {
      return selector === "strong" ? this.value : null;
    },
  });
  const collectedMetric = metric();
  const periodMetric = metric();
  const userMetric = metric();
  const position = { textContent: "" };
  const progressNodes = {
    "[data-crawler-progress-counter='true']": counter,
    ".crawler-progress-position": position,
    '[data-crawler-progress-metric="collected"]': collectedMetric,
    '[data-crawler-progress-metric="period"]': periodMetric,
    '[data-crawler-progress-metric="user"]': userMetric,
  };
  assert.equal(admin.crawler.sections.statusSync({
    querySelector: (selector) => progressNodes[selector] || null,
  }, {
    page: 3,
    totalPages: 12,
    done: 8,
    totalItems: 10,
    matched: 7,
    failed: 1,
    period: { key: "202609" },
    user: "Николай Баранов",
  }, ["people", "sport"], 0), true);
  assert.equal(counterText.textContent, "8/10");
  assert.equal(counterAttributes["data-progress"], "80");
  assert.equal(collectedMetric.value.textContent, "7");
  assert.equal(periodMetric.value.textContent, "Сен 2026");
  assert.equal(userMetric.value.textContent, "НБ");
  assert.equal(userMetric.value.title, "Николай Баранов");
  assert.equal(position.textContent, "1/2");
  assert.match(progressPanel, /data-progress="70"/);
  assert.match(progressPanel, />7\/10</);
  assert.match(progressPanel, /<strong title="6">6<\/strong>/);
  assert.match(progressPanel, /<strong title="Николай Баранов">НБ<\/strong>/);
  state.period = { key: "202609" };
  state.sections = ["people", "sport", "money"];
  state.index = 1;
  const workerUrl = new URL(admin.crawler.sections.workerUrl("sport"));
  assert.equal(workerUrl.searchParams.get("worker_sections"), "people,sport,money");
  assert.equal(workerUrl.searchParams.get("worker_index"), "1");
  const demoProgress = [];
  const statusBeforeDemo = admin.crawler.sections.status;
  const clearBeforeDemo = admin.crawler.sections.clearStatus;
  const timeoutBeforeDemo = window.setTimeout;
  const clearTimeoutBeforeDemo = window.clearTimeout;
  let demoStep = null;
  admin.crawler.sections.status = (value) => demoProgress.push(value);
  admin.crawler.sections.clearStatus = () => true;
  window.setTimeout = (run) => {
    demoStep = run;
    return 1;
  };
  window.clearTimeout = () => {};
  assert.equal(admin.crawler.sections.demo.run(), true);
  assert.equal(demoProgress[0].section, "people");
  assert.equal(demoProgress[0].done, 0);
  assert.deepEqual(demoProgress[0].sections, admin.crawler.sections.values());
  demoStep();
  assert.equal(demoProgress[1].done, 2);
  admin.crawler.sections.demo.stop();
  const stampBeforeReset = state.workerStamp;
  admin.crawler.sections.reset();
  assert.equal(state.workerStamp, stampBeforeReset + 1);
  admin.crawler.sections.status = statusBeforeDemo;
  admin.crawler.sections.clearStatus = clearBeforeDemo;
  window.setTimeout = timeoutBeforeDemo;
  window.clearTimeout = clearTimeoutBeforeDemo;
  console.log("crawler dataset smoke: ok");
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
