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
    assert.equal(group.aggregate.name, "Все корректоры");
    assert.equal(group.defaults.proofreader, "nb");
    assert.equal(group.options.length, 7);
    assert.equal(group.options[0].name, "Николай Баранов");
    assert.equal(group.options.at(-1).name, "Все корректоры");
    assert.equal(group.sections.people.icon, "person-zombie");
    assert.equal(group.sections.tech.icon, "alien-monster");
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
    const shared = data.records.find((item) => item.post_id === "2");
    shared.revisions.unshift({ author: "vs", autosave: false, date: "2022-05-01", time: "12:00" });
    shared.revisions.push({ author: "vs", autosave: false, date: "2026-10-02", time: "10:00" });
    const oldOnly = data.records.find((item) => item.post_id === "3");
    oldOnly.revisions.unshift({ author: "vs", autosave: false, date: "2022-05-01", time: "12:00" });
    data.records.push(
      { post_id: "7", section: "people", revisions: [{ author: "kulieva", autosave: false, date: "2026-09-20", time: "10:00" }] },
      { post_id: "8", section: "people", revisions: [{ author: "charniakevich", autosave: false, date: "2026-09-21", time: "11:00" }] },
    );
    data.count += 2;
    data.section_results[0].count += 2;
    const source = JSON.stringify(data);
    const validated = group.validate(data);
    assert.equal(validated.data, data);
    assert.ok(validated.warnings.some((item) => item.includes("статус partial")));
    assert.ok(validated.warnings.some((item) => item.includes("1 ошибку")));
    const withoutSport = { ...data, count: 7, sections: ["sport"], section_results: [{ section: "sport", status: "failed", count: 0 }], records: data.records.filter((item) => item.section !== "sport") };
    assert.equal(group.validate(withoutSport).warnings.length, 0);
    const first = group.select(data, "nb");
    assert.equal(first.rows.length, 2);
    assert.equal(first.rows[0].observed.length, 4);
    assert.equal(first.rows[0].handoff.previous.time, "07:50");
    assert.equal(first.rows[0].handoff.first.time, "08:00");
    assert.equal(first.rows[0].handoff.waitMinutes, 10);
    assert.equal(first.rows[0].signals.join(","), "special,shared_review");
    assert.equal(first.rows[0].proofreaders.length, 2);
    assert.ok(first.rows[0].proofreaders.includes(group.roster.find((item) => item.id === "nb").name));
    assert.ok(first.rows[0].proofreaders.includes(group.roster.find((item) => item.id === "vs").name));
    assert.equal(first.rows[0].proofreading[0].name, "Николай Баранов");
    assert.equal(first.rows[0].proofreading[0].date, "2026-09-15");
    assert.equal(first.rows[0].proofreading[0].time, "08:00");
    assert.equal(first.rows[0].proofreading.at(-1).name, "Вадим Шклярик");
    assert.equal(first.rows[0].proofreading.at(-1).date, "2026-10-02");
    assert.equal(first.rows[0].proofreading.some((item) => item.date.startsWith("2022-")), false);
    assert.equal(group.handoff.actor(first.rows[0].handoff.first), "Николай Баранов");
    const late = first.rows.find((item) => item.record.post_id === "3");
    assert.equal(late.handoff.previous.author, "Игорь Шубич");
    assert.equal(late.handoff.waitMinutes, 12);
    assert.equal(late.signals.join(","), "evergreen,late_handoff");
    assert.equal(late.proofreaders.length, 1);
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
    const dutyRows = [
      ...["people", "sport", "people", "sport", "people"].map((section) => ({ record: { published_at: "2026-09-19T08:00:00", section } })),
      ...["people", "money", "people", "money", "people", "money"].map((section) => ({ record: { published_at: "2026-09-20T08:00:00", section } })),
      ...["people", "people", "people", "people", "people"].map((section) => ({ record: { published_at: "2026-09-26T08:00:00", section } })),
      ...["people", "sport", "people", "sport", "people"].map((section) => ({ record: { published_at: "2026-09-21T08:00:00", section } })),
    ];
    assert.equal(group.duty.config.minimumRecords, 5);
    assert.equal(group.duty.config.minimumSections, 2);
    const duties = group.analytics.duties(dutyRows);
    assert.equal(duties.length, 2);
    assert.equal(duties[0].date, "2026-09-19");
    assert.equal(duties[0].count, 5);
    assert.equal(duties[0].sectionCount, 2);
    assert.equal(duties[0].sections.join(","), "people,sport");
    assert.equal(duties[0].paired, true);
    assert.equal(group.analytics.get(dutyRows, "202609").duties.length, 2);
    assert.equal(first.autosaveOnlyCount, 1);
    assert.equal(group.select(data, "vs").rows.length, 1);
    assert.equal(group.select(data, "ek").rows.length, 1);
    assert.equal(group.select(data, "ms").rows.length, 1);
    assert.equal(group.select(data, group.aggregate.id).rows.length, 5);
    assert.equal(group.select(data, "nb").rows.length, first.rows.length);
    assert.equal(group.select(data, "").rows.length, 0);
    assert.equal(group.handoff.late(late.record, late.handoff), true);
    assert.equal(JSON.stringify(data), source);
    assert.throws(() => group.validate({ schema: "wrong", schema_version: 2, records: [] }), /onliner-publications/);
    assert.throws(() => group.validate({ schema: "onliner-publications", schema_version: 2 }), /records/);
    const large = { ...smoke.fixture(), count: 1494, errors: [], sections: [], section_results: [], records: Array.from({ length: 1494 }, (_, index) => ({ post_id: String(index), revisions: [{ author: index % 2 ? "Николай Баранов" : "Вадим Шклярик", autosave: false, date: "2026-09-20" }] })) };
    assert.equal(group.select(large, "nb").rows.length, 747);
    assert.equal(group.select(large, "vs").rows.length, 747);
    assert.equal(group.select(large, group.aggregate.id).rows.length, 1494);
    console.log("ledger group smoke: ok");
  },
};

smoke.run();
