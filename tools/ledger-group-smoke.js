const assert = require("node:assert/strict");
const path = require("node:path");
const vm = require("node:vm");
const { build } = require("./build.js");

const smoke = {
  group() {
    const context = {};
    const file = path.join(__dirname, "ledger", "group.js");
    vm.runInNewContext(build.registry.bundle(file), context);
    return context.__ONLINER_LEDGER_GROUP__;
  },
  fixture() {
    return {
      schema: "onliner-publications",
      schema_version: 2,
      period: "202609",
      sections: ["people", "sport"],
      count: 6,
      section_results: [
        { section: "people", status: "completed", count: 5 },
        { section: "sport", status: "partial", count: 1 },
      ],
      errors: [{ section: "sport", message: "timeout" }],
      records: [
        { post_id: "1", section: "people", author: "Николай Баранов", revisions: [{ author: "Николай Баранов", autosave: false, date: "2026-08-31" }] },
        { post_id: "2", section: "people", layout: "longread", title: "Большой материал", metrics: { words: 1000 }, published_at: "2026-09-15T08:30:00", special_project: true, revisions: [{ author: "Игорь Шубич", autosave: false, date: "2026-09-15", time: "07:50" }, { author: "Николай Баранов", autosave: false, date: "2026-09-15", time: "08:00" }, { author: "Николай Баранов", autosave: false, date: "2026-09-15", time: "08:10" }, { author: "Николай Баранов", autosave: false, date: "2026-09-15", time: "12:00" }, { author: "Игорь Шубич", autosave: false, date: "2026-09-15", time: "12:05" }, { author: "Николай Баранов", autosave: false, date: "2026-09-15", time: "12:15" }, { author: "Николай Баранов", autosave: false, date: "2026-10-01", time: "09:00" }] },
        { post_id: "3", section: "people", layout: "longread", title: "Маленький материал", metrics: { words: 200 }, published_at: "2026-09-15T09:55:00", evergreen: true, revisions: [{ author: "Игорь Шубич", autosave: false, date: "2026-09-16", time: "10:00" }, { author: "baranov", autosave: false, date: "2026-09-16", time: "10:12" }] },
        { post_id: "4", section: "people", revisions: [{ author: "Николай Баранов", autosave: true, date: "2026-09-17" }] },
        { post_id: "5", section: "people", revisions: [{ author: "Неизвестный автор", autosave: false, date: "2026-09-18" }] },
        { post_id: "6", section: "sport", revisions: [{ author: "Вадим Шклярик", autosave: false, date: "2026-09-19" }] },
      ],
    };
  },
  run() {
    const group = smoke.group();
    assert.equal(group.roster.length, 6);
    assert.equal(group.roster.some((item) => item.name === "Неизвестный автор"), false);
    assert.equal(group.author.name("darruiss"), "Юрий Байдаков");
    assert.equal(group.author.name("Валерий Волатович"), "Юрий Байдаков");
    assert.equal(group.author.name("Сергей Сергеев"), "Ян Альшевский");
    assert.equal(group.author.name("Ольга Прокопьева"), "Наталья Злотник");
    assert.equal(group.author.name("Артем"), "Артём");
    group.author.enabled = false;
    assert.equal(group.author.name("darruiss"), "darruiss");
    group.author.enabled = true;
    const data = smoke.fixture();
    const source = JSON.stringify(data);
    const validated = group.validate(data);
    assert.equal(validated.data, data);
    assert.ok(validated.warnings.some((item) => item.includes("статус partial")));
    assert.ok(validated.warnings.some((item) => item.includes("1 ошибку")));
    const withoutSport = { ...data, count: 5, sections: ["sport"], section_results: [{ section: "sport", status: "failed", count: 0 }], records: data.records.filter((item) => item.section !== "sport") };
    assert.equal(group.validate(withoutSport).warnings.length, 0);
    const first = group.select(data, "nb");
    assert.equal(first.rows.length, 2);
    assert.equal(first.rows[0].observed.length, 4);
    assert.equal(first.rows[0].handoff.previous.time, "07:50");
    assert.equal(first.rows[0].handoff.first.time, "08:00");
    assert.equal(first.rows[0].handoff.waitMinutes, 10);
    assert.equal(first.rows[0].signals.join(","), "special");
    const late = first.rows.find((item) => item.record.post_id === "3");
    assert.equal(late.handoff.previous.author, "Игорь Шубич");
    assert.equal(late.handoff.waitMinutes, 12);
    assert.equal(late.signals.join(","), "evergreen,late_handoff");
    assert.equal(first.rows.some((item) => item.record.post_id === "1"), false);
    const analytics = group.analytics.get(first.rows, data.period);
    assert.equal(analytics.days.length, 30);
    assert.equal(analytics.days.find((item) => item.date === "2026-09-15").count, 2);
    assert.equal(analytics.days.find((item) => item.date === "2026-09-15").words, 1200);
    assert.equal(analytics.extrema.busiest.count, 2);
    assert.equal(analytics.extrema.largest.record.post_id, "2");
    assert.equal(analytics.extrema.smallest.record.post_id, "3");
    assert.equal(analytics.anomalies.length, 1);
    assert.equal(analytics.anomalies[0].count, 2);
    assert.equal(first.autosaveOnlyCount, 1);
    assert.equal(group.select(data, "vs").rows.length, 1);
    assert.equal(group.select(data, "nb").rows.length, first.rows.length);
    assert.equal(group.select(data, "").rows.length, 0);
    assert.equal(group.handoff.late(late.record, late.handoff), true);
    assert.equal(JSON.stringify(data), source);
    assert.throws(() => group.validate({ schema: "wrong", schema_version: 2, records: [] }), /onliner-publications/);
    assert.throws(() => group.validate({ schema: "onliner-publications", schema_version: 2 }), /records/);
    const large = { ...smoke.fixture(), count: 1494, errors: [], sections: [], section_results: [], records: Array.from({ length: 1494 }, (_, index) => ({ post_id: String(index), revisions: [{ author: index % 2 ? "Николай Баранов" : "Вадим Шклярик", autosave: false, date: "2026-09-20" }] })) };
    assert.equal(group.select(large, "nb").rows.length, 747);
    assert.equal(group.select(large, "vs").rows.length, 747);
    console.log("ledger group smoke: ok");
  },
};

smoke.run();
