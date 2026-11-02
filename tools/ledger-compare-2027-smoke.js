const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const smoke = {
  record(id, date, section = "people", options = {}) {
    return {
      post_id: id,
      title: id,
      section,
      layout: options.layout || "longread",
      published_at: `${date}T08:00:00`,
      metrics: { words: options.words ?? 1000 },
      special_project: options.special === true,
      revisions: [],
    };
  },
  data(records = []) {
    const coverageRecords = ["people", "sport", "money", "auto", "tech", "realt"].flatMap((section) => Array.from({ length: 5 }, (_, index) => smoke.record(`coverage-${section}-${index}`, `2026-01-${String(index + 20).padStart(2, "0")}`, section, { layout: "news", words: 100 })));
    const sourceRecords = [...records, ...coverageRecords];
    return {
      schema: "onliner-publications",
      schema_version: 2,
      period: "202601",
      count: sourceRecords.length,
      records: sourceRecords,
      errors: [],
      section_results: ["people", "sport", "money", "auto", "tech", "realt"].map((section) => ({ section, status: "completed", count: 100 })),
    };
  },
  async run() {
    const workflow = fs.readFileSync(path.resolve(".github/workflows/build.yml"), "utf8");
    assert.match(workflow, /Exclude local-only comparison/);
    ["local-tools", "tools\/ledger\/compare-2027\.js", "tools\/ledger\/compare-local-app\.js", "tools\/ledger\/compare-local\.css", "tools\/ledger-compare-local\.js", "tools\/ledger-compare-2027-smoke\.js"].forEach((value) => assert.match(workflow, new RegExp(value)));
    assert.doesNotMatch(fs.readFileSync(path.resolve("tools/build.js"), "utf8"), /ledger-compare-local|compare-local-app|local-tools/);
    const file = pathToFileURL(path.resolve("tools/ledger/compare-2027.js")).href;
    const { ledgerCompare2027: model } = await import(file);
    const records = [
      smoke.record("sun-nikolai", "2026-01-04"),
      smoke.record("mon-nikolai", "2026-01-05", "sport"),
      smoke.record("weekday", "2026-01-06", "money"),
      smoke.record("sun-other", "2026-01-11", "auto"),
      smoke.record("mon-other", "2026-01-12", "tech"),
      smoke.record("sun-unknown", "2026-01-18", "realt"),
      smoke.record("special-first", "2026-01-20", "people", { special: true }),
      smoke.record("special-second", "2026-01-20", "money", { special: true }),
    ];
    const data = smoke.data(records);
    const assignments = { "2026-01-04": "nikolai", "2026-01-11": "other" };
    const result = model.compare.get({ data, actualRows: [], assignments, pace: 100 });
    assert.equal(result.policy.id, "2027-third-proofreader");
    assert.equal(result.coverage.complete, true);
    assert.equal(result.scenario.assignedRows.some((item) => item.id === "sun-nikolai"), true);
    assert.equal(result.scenario.assignedRows.some((item) => item.id === "mon-nikolai"), true);
    assert.equal(result.scenario.assignedRows.some((item) => item.id === "weekday"), true);
    assert.equal(result.scenario.assignedRows.some((item) => item.id === "sun-other"), false);
    assert.equal(result.scenario.rows.find((item) => item.id === "sun-unknown").owner, "unknown");
    assert.equal(result.scenario.payment.events.filter((item) => item.key.startsWith("duty:")).length, 1);
    assert.equal(result.scenario.payment.confirmed, 2760);
    assert.equal(result.scenario.summary.estimatedReadingMinutes, 50);
    assert.equal(result.scenario.payment.candidates.length, 1);
    assert.equal(result.scenario.payment.events.some((item) => item.key.includes("special")), false);
    const faster = model.compare.get({ data, actualRows: [], assignments, pace: 200 });
    assert.equal(faster.scenario.summary.estimatedReadingMinutes, 25);
    const missingWords = smoke.data([smoke.record("missing-words", "2026-01-06", "people", { words: null })]);
    missingWords.records.find((item) => item.post_id === "missing-words").metrics = {};
    assert.equal(model.compare.get({ data: missingWords }).scenario.summary.estimatedReadingMinutes, null);
    const boundary = model.calendar.pairs("202606").find((item) => item.monday === "2026-06-01");
    assert.ok(boundary);
    assert.equal(boundary.key, "2026-05-31");
    assert.equal(boundary.boundary, true);
    const june = smoke.data([]);
    june.period = "202606";
    const juneResult = model.compare.get({ data: june, assignments: { "2026-05-31": "nikolai" } });
    assert.equal(juneResult.scenario.payment.events.some((item) => item.key === "duty:2026-05-31"), false);
    const partial = smoke.data(records);
    partial.section_results = partial.section_results.map((item) => item.section === "sport" ? { ...item, status: "empty", count: 0 } : item);
    partial.records = partial.records.filter((item) => item.section !== "sport");
    const incomplete = model.compare.get({ data: partial, assignments: {}, pace: 200 });
    assert.equal(incomplete.coverage.complete, false);
    assert.equal(incomplete.scenario.payment.events[0].status, "manual");
    assert.equal(incomplete.scenario.payment.confirmed, 0);
    console.log("ledger compare 2027 smoke: ok");
  },
};

smoke.run();
