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
  const admin = {};
  attachCrawler(admin);
  admin.crawler.tags.plain = (value) => String(value || "").trim();
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
  const fields = {
    "#content": { value: "Текст" },
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
  assert.equal(detail.revisions[0].author, "Дарья Коско");
  assert.equal(detail.revisions[0].autosave, true);
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
  ], []);
  assert.equal(prepared.values.length, 2);
  assert.equal(prepared.errors.length, 1);
  assert.match(prepared.errors[0].error, /Дубликат/);
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
  admin.crawler.tags.load = async () => {
    throw new Error("Ошибка страницы");
  };
  const errors = [];
  const records = await admin.crawler.report.collect(location.href, {
    dataset: true,
    errors,
    maxPages: 1,
    section: "people",
    user: "Тест",
  });
  assert.deepEqual(records, []);
  assert.equal(errors.length, 1);
  assert.match(errors[0].error, /Ошибка страницы/);
  await assert.rejects(
    admin.crawler.report.collect(location.href, {
      dataset: false,
      maxPages: 1,
      section: "people",
      user: "Тест",
    }),
    /Ошибка страницы/,
  );
  console.log("crawler dataset smoke: ok");
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
