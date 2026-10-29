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
        { post_id: "1", section: "people", author: "Николай Баранов", revisions: [] },
        { post_id: "2", section: "people", revisions: [{ author: "Николай Баранов", autosave: false }, { author: "Николай Баранов", autosave: false }] },
        { post_id: "3", section: "people", revisions: [{ author: "baranov", autosave: false }] },
        { post_id: "4", section: "people", revisions: [{ author: "Николай Баранов", autosave: true }] },
        { post_id: "5", section: "people", revisions: [{ author: "Неизвестный автор", autosave: false }] },
        { post_id: "6", section: "sport", revisions: [{ author: "Вадим Шклярик", autosave: false }] },
      ],
    };
  },
  run() {
    const group = smoke.group();
    assert.equal(group.roster.length, 6);
    assert.equal(group.roster.some((item) => item.name === "Неизвестный автор"), false);
    const data = smoke.fixture();
    const source = JSON.stringify(data);
    const validated = group.validate(data);
    assert.equal(validated.data, data);
    assert.ok(validated.warnings.some((item) => item.includes("статус partial")));
    assert.ok(validated.warnings.some((item) => item.includes("1 ошибку")));
    const first = group.select(data, "nb");
    assert.equal(first.rows.length, 2);
    assert.equal(first.rows[0].observed.length, 2);
    assert.equal(first.autosaveOnlyCount, 1);
    assert.equal(group.select(data, "vs").rows.length, 1);
    assert.equal(group.select(data, "nb").rows.length, first.rows.length);
    assert.equal(group.select(data, "").rows.length, 0);
    assert.equal(JSON.stringify(data), source);
    assert.throws(() => group.validate({ schema: "wrong", schema_version: 2, records: [] }), /onliner-publications/);
    assert.throws(() => group.validate({ schema: "onliner-publications", schema_version: 2 }), /records/);
    const large = { ...smoke.fixture(), count: 1494, errors: [], sections: [], section_results: [], records: Array.from({ length: 1494 }, (_, index) => ({ post_id: String(index), revisions: [{ author: index % 2 ? "Николай Баранов" : "Вадим Шклярик", autosave: false }] })) };
    assert.equal(group.select(large, "nb").rows.length, 747);
    assert.equal(group.select(large, "vs").rows.length, 747);
    console.log("ledger group smoke: ok");
  },
};

smoke.run();
