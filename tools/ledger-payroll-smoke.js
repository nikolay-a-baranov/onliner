const assert = require("node:assert/strict");
const path = require("node:path");
const vm = require("node:vm");
const { build } = require("./build.js");

const smoke = {
  payroll() {
    const context = {};
    const file = path.join(__dirname, "ledger", "payroll.js");
    vm.runInNewContext(build.registry.bundle(file), context);
    return context.__ONLINER_LEDGER_PAYROLL__;
  },
  row(id, time, options = {}) {
    return {
      record: {
        post_id: id,
        published_at: `${options.date || "2026-09-15"}T${time}:00`,
        section: options.section || "people",
        layout: options.layout || "longread",
        sticky: options.sticky || "",
        special_project: options.special || false,
        evergreen: options.evergreen || false,
      },
    };
  },
  profile() {
    return {
      schema: "onliner-ledger-local-payroll",
      schema_version: 1,
      proofreader: "nb",
      blocks: [{ key: "base", label: "База", amount: 1900, components: [{ type: "section", value: "people" }, { type: "section", value: "money" }] }],
      rates: { sport: 300, duty: 175, duty_smm: 18, duty_sunday: 35, duty_lr: 35, xtra_lr: 37.5, xtra_sp: 37.5, xtra_eg: 18 },
      rules: { sport: { minimumWeeks: 2, minimumRowsPerWeek: 2 }, duty: { minimumRecords: 5, minimumSections: 2 }, smm: { paidThrough: "202609" } },
    };
  },
  run() {
    const payroll = smoke.payroll();
    const rows = [
      smoke.row("main", "08:00", { sticky: "right" }),
      smoke.row("extra", "07:00", { sticky: "left" }),
      smoke.row("special", "09:30", { sticky: "left", special: true }),
      smoke.row("manual", "08:00", { section: "auto", evergreen: true }),
      smoke.row("news", "08:00", { layout: "news" }),
    ];
    const source = JSON.stringify(rows);
    const result = payroll.calculate({ rows, period: "202609", proofreaderId: "nb", profile: smoke.profile() });
    assert.equal(result.blocks.length, 1);
    assert.equal(result.totals.blocks, 1900);
    assert.equal(result.materials.find((item) => item.id === "main").paid, false);
    assert.equal(result.materials.find((item) => item.id === "main").covered, true);
    assert.equal(result.materials.find((item) => item.id === "main").coverage.amount, 1900);
    assert.equal(result.materials.find((item) => item.id === "main").toggleable, false);
    assert.equal(result.materials.find((item) => item.id === "extra").paid, true);
    assert.equal(result.materials.find((item) => item.id === "extra").toggleable, true);
    assert.equal(result.materials.find((item) => item.id === "special").paid, true);
    assert.equal(result.materials.find((item) => item.id === "manual").paid, false);
    assert.equal(result.materials.find((item) => item.id === "news").eligible, false);
    assert.equal(result.materials.find((item) => item.id === "extra").secondText, true);
    assert.equal(result.materials.find((item) => item.id === "special").bucket, "xtra_sp");
    assert.equal(result.materials.find((item) => item.id === "special").rate, 37.5);
    assert.equal(result.materials.find((item) => item.id === "extra").textOrder, 2);
    assert.equal(result.materials.find((item) => item.id === "special").textOrder, 3);
    assert.deepEqual([...result.signals.secondTextIds], ["extra"]);
    assert.deepEqual([...result.signals.thirdTextIds], ["special"]);
    assert.deepEqual(Array.from(result.lines.find((item) => item.key === "xtra_lr").components, (item) => item.value), ["second_text"]);
    assert.deepEqual(Array.from(result.lines.find((item) => item.key === "xtra_sp").components, (item) => item.value), ["third_text", "special"]);
    assert.equal(result.totals.materials, 76);
    const corrected = payroll.calculate({
      rows,
      period: "202609",
      proofreaderId: "nb",
      profile: smoke.profile(),
      overrides: { include: ["manual"], exclude: ["extra"] },
    });
    assert.equal(corrected.materials.find((item) => item.id === "extra").paid, false);
    assert.equal(corrected.materials.find((item) => item.id === "manual").paid, true);
    assert.equal(corrected.totals.materials, 56);
    assert.equal(corrected.totals.amount, 1956);
    const ordinalRows = [
      smoke.row("ordinal-main", "08:00", { sticky: "right" }),
      smoke.row("ordinal-third", "09:30", { sticky: "right" }),
      smoke.row("ordinal-second", "07:00", { sticky: "left" }),
    ];
    const ordinal = payroll.calculate({ rows: ordinalRows, period: "202609", proofreaderId: "nb", profile: smoke.profile() });
    assert.deepEqual(Array.from(ordinal.lines.find((item) => item.key === "xtra_lr").components, (item) => item.value), ["second_text", "third_text"]);
    assert.equal(ordinal.lines.find((item) => item.key === "xtra_lr").amount, 75);
    assert.deepEqual([...ordinal.signals.secondTextIds], ["ordinal-second"]);
    assert.deepEqual([...ordinal.signals.thirdTextIds], ["ordinal-third"]);
    const specialRows = [
      smoke.row("special-main", "08:00", { date: "2026-09-14", sticky: "right" }),
      smoke.row("special-extra", "07:00", { date: "2026-09-14", sticky: "left", special: true }),
    ];
    const special = payroll.calculate({ rows: specialRows, period: "202609", proofreaderId: "nb", profile: smoke.profile() });
    assert.equal(special.materials.find((item) => item.id === "special-extra").secondText, true);
    assert.equal(special.materials.find((item) => item.id === "special-extra").bucket, "xtra_sp");
    assert.equal(special.materials.find((item) => item.id === "special-extra").rate, 37.5);
    const evergreenRows = [
      smoke.row("evergreen-main", "08:00", { date: "2026-09-16", sticky: "right" }),
      smoke.row("evergreen-extra", "11:30", { date: "2026-09-16", sticky: "left", evergreen: true }),
    ];
    const evergreen = payroll.calculate({ rows: evergreenRows, period: "202609", proofreaderId: "nb", profile: smoke.profile() });
    assert.equal(evergreen.materials.find((item) => item.id === "evergreen-extra").secondText, true);
    assert.equal(evergreen.materials.find((item) => item.id === "evergreen-extra").bucket, "xtra_eg");
    assert.equal(evergreen.materials.find((item) => item.id === "evergreen-extra").rate, 18);
    const rejectedRows = [
      smoke.row("rejected-main", "08:00", { date: "2026-09-17", sticky: "right" }),
      smoke.row("rejected-unstuck", "07:00", { date: "2026-09-17" }),
      smoke.row("missing-main", "08:00", { date: "2026-09-18", sticky: "left" }),
      smoke.row("missing-main-extra", "07:00", { date: "2026-09-18", sticky: "left" }),
      smoke.row("foreign-main", "08:00", { date: "2026-09-19", section: "auto", sticky: "right" }),
      smoke.row("foreign-extra", "07:00", { date: "2026-09-19", section: "auto", sticky: "left" }),
    ];
    const rejected = payroll.calculate({ rows: rejectedRows, period: "202609", proofreaderId: "nb", profile: smoke.profile() });
    assert.equal(rejected.materials.find((item) => item.id === "rejected-unstuck").paid, false);
    assert.equal(rejected.materials.find((item) => item.id === "missing-main-extra").paid, false);
    assert.equal(rejected.materials.find((item) => item.id === "foreign-extra").paid, false);
    const noBaseProfile = { ...smoke.profile(), blocks: [] };
    const withoutBase = payroll.calculate({ rows: specialRows, period: "202609", proofreaderId: "nb", profile: noBaseProfile });
    assert.equal(withoutBase.materials.find((item) => item.id === "special-extra").paid, false);
    assert.equal(withoutBase.materials.find((item) => item.id === "special-extra").secondText, false);
    const automaticRows = [
      smoke.row("sport-1", "08:00", { date: "2026-09-01", section: "sport" }),
      smoke.row("sport-2", "08:00", { date: "2026-09-02", section: "sport" }),
      smoke.row("sport-3", "08:00", { date: "2026-09-15", section: "sport" }),
      smoke.row("sport-4", "08:00", { date: "2026-09-16", section: "sport" }),
      ...Array.from({ length: 5 }, (_, index) => smoke.row(`sat-${index}`, `1${index}:00`, { date: "2026-09-12", section: index % 2 ? "money" : "people", layout: "news" })),
      smoke.row("sun-sport", "08:00", { date: "2026-09-13", section: "sport" }),
      ...Array.from({ length: 4 }, (_, index) => smoke.row(`sun-${index}`, `1${index}:00`, { date: "2026-09-13", section: index % 2 ? "money" : "people", layout: "news" })),
    ];
    const automatic = payroll.calculate({ rows: automaticRows, period: "202609", proofreaderId: "nb", profile: smoke.profile() });
    assert.deepEqual([...automatic.blocks.map((item) => item.key)], ["base", "sport", "duty", "duty_smm"]);
    assert.equal(automatic.blocks.find((item) => item.key === "duty").count, 2);
    assert.deepEqual([...automatic.signals.dutyDates], ["2026-09-12", "2026-09-13"]);
    assert.equal(automatic.signals.sport, true);
    assert.equal(automatic.materials.find((item) => item.id === "sport-1").coverage.amount, 300);
    assert.equal(automatic.materials.find((item) => item.id === "sat-0").coverage.amount, 175);
    assert.equal(automatic.materials.find((item) => item.id === "sat-0").toggleable, false);
    assert.equal(automatic.materials.find((item) => item.id === "sun-sport").bucket, "duty_sunday");
    assert.equal(automatic.materials.find((item) => item.id === "sun-sport").toggleable, true);
    assert.equal(automatic.totals.blocks, 2586);
    assert.equal(automatic.totals.materials, 35);
    assert.equal(automatic.totals.amount, 2621);
    const october = payroll.calculate({ rows: automaticRows, period: "202610", proofreaderId: "nb", profile: smoke.profile() });
    assert.equal(october.blocks.some((item) => item.key === "duty_smm"), false);
    assert.equal(october.totals.blocks, 2550);
    const sportExtras = [
      smoke.row("sport-main-1", "08:00", { date: "2026-09-01", section: "sport", sticky: "right" }),
      smoke.row("sport-extra", "07:00", { date: "2026-09-01", section: "sport", sticky: "left" }),
      smoke.row("sport-evidence-1", "08:00", { date: "2026-09-02", section: "sport" }),
      smoke.row("sport-evidence-2", "08:00", { date: "2026-09-15", section: "sport" }),
      smoke.row("sport-evidence-3", "08:00", { date: "2026-09-16", section: "sport" }),
    ];
    const sportSecondText = payroll.calculate({ rows: sportExtras, period: "202609", proofreaderId: "nb", profile: smoke.profile() });
    assert.equal(sportSecondText.materials.find((item) => item.id === "sport-extra").secondText, true);
    assert.equal(sportSecondText.materials.find((item) => item.id === "sport-extra").paid, true);
    assert.equal(payroll.calculate({ rows, period: "202609", proofreaderId: "vs", profile: smoke.profile() }), null);
    assert.equal(JSON.stringify(rows), source);
    assert.throws(() => payroll.profile.validate({ schema: "wrong" }), /onliner-ledger-local-payroll/);
    console.log("ledger payroll smoke: ok");
  },
};

smoke.run();
