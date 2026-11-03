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
        { post_id: "2", section: "people", layout: "longread", title: "Большой материал", metrics: { words: 1000 }, published_at: "2026-09-15T08:30:00", madtest: "abc123", special_project: true, revisions: [{ author: "Игорь Шубич", autosave: false, date: "2026-09-15", time: "07:50" }, { author: "Николай Баранов", autosave: false, date: "2026-09-15", time: "08:00" }, { author: "Николай Баранов", autosave: false, date: "2026-09-15", time: "08:10" }, { author: "Николай Баранов", autosave: false, date: "2026-09-15", time: "12:00" }, { author: "Игорь Шубич", autosave: false, date: "2026-09-15", time: "12:05" }, { author: "Николай Баранов", autosave: false, date: "2026-09-15", time: "12:15" }, { author: "Николай Баранов", autosave: false, date: "2026-10-01", time: "09:00" }] },
        { post_id: "3", section: "people", layout: "longread", title: "Маленький материал", metrics: { words: 200 }, published_at: "2026-09-15T09:55:00", tags: ["Каталог Onlíner"], evergreen: true, revisions: [{ author: "Игорь Шубич", autosave: false, date: "2026-09-16", time: "10:00" }, { author: "baranov", autosave: false, date: "2026-09-16", time: "10:12" }] },
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
    assert.equal(group.display.dashboard("Николай Баранов"), "Коля");
    assert.equal(group.display.dashboard("Вадим Шклярик"), "Вадим");
    assert.equal(group.display.dashboard("Марина Сивицкая (Чернякевич)"), "Марина");
    assert.equal(group.display.dashboard("Елена Кулиева"), "Лена");
    assert.equal(group.display.dashboard("Юлия Михайлова"), "Юля М.");
    assert.equal(group.display.dashboard("Юлия Петрович (Кевро)"), "Юля П.");
    assert.equal(group.display.dashboard("Все корректоры"), "Все корректоры");
    assert.equal(group.terminology.editorial.sp, "Спецпроект");
    assert.equal(group.terminology.editorial.eg, "Зелень");
    assert.equal(group.terminology.editorial.ct, "Каталог");
    assert.equal(group.terminology.layout.news, "Ньюс");
    assert.equal(group.terminology.layout.longread, "Лонг");
    assert.equal(group.terminology.layout.photoreport, "Фоторепорт");
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
    const options = group.proofreader.list(data);
    assert.equal(options.map((item) => item.id).join(","), "nb,ek,ms,vs,all");
    assert.equal(options.map((item) => group.display.dashboard(item.name)).join(","), "Коля,Лена,Марина,Вадим,Все корректоры");
    assert.equal(group.proofreader.select(data, "ym"), "nb");
    const vadimOnly = { ...data, records: [{ revisions: [{ author: "Вадим Шклярик", autosave: false, date: "2026-09-01" }] }] };
    assert.equal(group.proofreader.select(vadimOnly, "nb"), "vs");
    const autosaveOnly = { ...data, records: [{ revisions: [{ author: "Юлия Михайлова", autosave: true, date: "2026-09-01" }] }] };
    assert.equal(group.proofreader.list(autosaveOnly).length, 0);
    assert.equal(group.proofreader.select(autosaveOnly, "nb"), "");
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
    assert.equal(first.rows[0].signals.join(","), "special,shared_review,madtest");
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
    assert.equal(late.signals.join(","), "catalog,evergreen");
    assert.equal(group.editorial.catalog(late.record), true);
    assert.equal(group.editorial.catalog({ tags: ["Каталогизация"] }), false);
    assert.equal(late.proofreaders.length, 1);
    assert.equal(first.rows.some((item) => item.record.post_id === "1"), false);
    const analytics = group.analytics.get(first.rows, data.period);
    assert.equal(analytics.days.length, 30);
    assert.equal(analytics.days.find((item) => item.date === "2026-09-15").count, 2);
    assert.equal(analytics.days.find((item) => item.date === "2026-09-15").words, 1200);
    assert.equal(analytics.extrema.busiest.count, 2);
    assert.equal(analytics.extrema.largest.record.post_id, "2");
    assert.equal(analytics.extrema.smallest.record.post_id, "3");
    assert.equal(analytics.anomalies.length, 0);
    const morningAnomalies = group.analytics.anomalies([
      { record: { section: "people", layout: "longread", published_at: "2026-09-15T07:00:00" } },
      { record: { section: "people", layout: "longread", published_at: "2026-09-15T08:30:00" } },
      { record: { section: "people", layout: "longread", published_at: "2026-09-15T09:00:00" } },
    ]);
    assert.equal(morningAnomalies.length, 1);
    assert.equal(morningAnomalies[0].count, 2);
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
    const morningTech = { section: "tech", layout: "longread", published_at: "2026-09-21T08:00:00" };
    const dayNews = { section: "auto", layout: "news", published_at: "2026-09-21T14:00:00" };
    const eveningNews = { section: "people", layout: "news", published_at: "2026-09-21T18:00:00" };
    const eveningLongread = { section: "people", layout: "longread", published_at: "2026-09-21T19:00:00" };
    const weekendNews = { section: "people", layout: "news", published_at: "2026-09-20T19:00:00" };
    const eveningDates = new Set(["2026-09-21"]);
    assert.deepEqual([...group.replacement.get(morningTech)], ["morning_replacement", "vacation_replacement"]);
    assert.deepEqual([...group.replacement.get(dayNews)], ["day_replacement"]);
    assert.deepEqual([...group.replacement.get(eveningNews, eveningDates)], ["evening_replacement", "vacation_replacement"]);
    assert.deepEqual([...group.replacement.get(eveningLongread, eveningDates)], ["evening_replacement", "vacation_replacement"]);
    assert.deepEqual([...group.replacement.get(weekendNews)], []);
    assert.deepEqual([...group.replacement.config.proofreaders], ["nb"]);
    assert.equal(group.replacement.reason(morningTech, "morning_replacement"), "Утро");
    assert.equal(group.replacement.reason(dayNews, "day_replacement"), "День");
    assert.equal(group.replacement.reason(eveningNews, "evening_replacement"), "Вечер");
    assert.equal(group.replacement.reason(eveningNews, "vacation_replacement"), "Замена");
    const workloadRows = [
      ...Array.from({ length: 6 }, (_, index) => ({ record: { published_at: `2026-09-${String(index + 1).padStart(2, "0")}T08:00:00`, metrics: { words: 1000 } } })),
      ...Array.from({ length: 6 }, () => ({ record: { published_at: "2026-09-07T08:00:00", metrics: { words: 2000 } } })),
    ];
    assert.equal(group.workload.config.minimumActiveDays, 5);
    assert.equal(group.workload.config.baselineMultiplier, 2);
    const workload = group.analytics.workload(workloadRows, "202609");
    assert.equal(workload.length, 1);
    assert.equal(workload[0].date, "2026-09-07");
    assert.equal(workload[0].count, 6);
    assert.equal(workload[0].words, 12000);
    assert.equal(workload[0].baseline.count, 1);
    assert.equal(group.analytics.get(workloadRows, "202609").workload.length, 1);
    const dutyWorkloadRows = [
      ...workloadRows,
      ...Array.from({ length: 6 }, (_, index) => ({ record: { published_at: `2026-09-12T${String(index + 10).padStart(2, "0")}:00:00`, section: index % 2 ? "people" : "money", metrics: { words: 2500 } } })),
      ...Array.from({ length: 6 }, (_, index) => ({ record: { published_at: `2026-09-13T${String(index + 10).padStart(2, "0")}:00:00`, section: index % 2 ? "people" : "money", metrics: { words: 2500 } } })),
    ];
    assert.equal(group.analytics.workload(dutyWorkloadRows, "202609").some((item) => ["2026-09-12", "2026-09-13"].includes(item.date)), false);
    assert.equal(first.autosaveOnlyCount, 1);
    assert.equal(group.select(data, "vs").rows.length, 1);
    assert.equal(group.select(data, "ek").rows.length, 1);
    assert.equal(group.select(data, "ms").rows.length, 1);
    assert.equal(group.select(data, group.aggregate.id).rows.length, 5);
    assert.equal(group.select(data, "nb").rows.length, first.rows.length);
    assert.equal(group.select(data, "").rows.length, 0);
    const afterDeadline = { previous: { date: "2026-09-14", time: "22:01" } };
    const atDeadline = { previous: { date: "2026-09-14", time: "22:00" } };
    assert.equal(group.handoff.context({ layout: "longread", published_at: "2026-09-15T08:00:00" }), "Утренний лонг");
    assert.equal(group.handoff.context({ layout: "news", published_at: "2026-09-15T18:00:00" }), "Вечерний ньюс");
    assert.equal(group.handoff.context({ layout: "news", published_at: "2026-09-15T22:00:00" }), "Вечерний ньюс");
    assert.equal(group.handoff.late({ layout: "longread", published_at: "2026-09-15T08:00:00" }, afterDeadline), true);
    assert.equal(group.handoff.late({ layout: "longread", published_at: "2026-09-15T08:00:00" }, atDeadline), false);
    assert.equal(group.handoff.late({ layout: "news", published_at: "2026-09-15T19:00:00" }, afterDeadline), true);
    assert.equal(group.handoff.late({ layout: "news", published_at: "2026-09-15T17:59:00" }, afterDeadline), false);
    assert.equal(group.handoff.late({ layout: "photoreport", published_at: "2026-09-15T08:00:00" }, afterDeadline), false);
    assert.equal(group.handoff.late(late.record, late.handoff), false);
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
