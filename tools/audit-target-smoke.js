const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const smoke = {
  async module(file = path.join("src", "actions", "audit-target.js")) {
    const sourceFile = path.join(__dirname, "..", file);
    const source = fs.readFileSync(sourceFile, "utf8");
    const url = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
    return import(url);
  },
  ready(result) {
    assert.equal(result.status, "ready");
    return result.target;
  },
};

const run = async () => {
  const { auditTarget } = await smoke.module();
  const repeated = auditTarget.snapshot("<p>слово один</p><p>слово два</p><p>слово три</p>");
  const ambiguous = auditTarget.locate(repeated, { before: "слово", after: "текст" });
  assert.equal(ambiguous.status, "ambiguous");
  assert.equal(ambiguous.candidates.length, 3);
  const occurrences = [0, 1, 2].map((occurrence) =>
    smoke.ready(auditTarget.locate(repeated, { before: "слово", after: "текст", occurrence })),
  );
  assert.equal(new Set(occurrences.map((target) => target.id)).size, 3);
  assert.deepEqual(occurrences.map((target) => target.segment), [0, 1, 2]);

  const inline = auditTarget.snapshot("<p>BMW <strong>X5</strong></p>");
  assert.equal(auditTarget.locate(inline, { before: "BMW X5", after: "BMW\u00A0X5" }).status, "unsupported");
  const attribute = auditTarget.snapshot('<a href="https://example.test/ё" title="ё">текст</a>');
  assert.equal(auditTarget.locate(attribute, { before: "ё", after: "е" }).status, "not-found");
  const safeAttribute = auditTarget.snapshot('<a title="слово" href="/слово">слово</a>');
  const safeTarget = smoke.ready(auditTarget.locate(safeAttribute, { before: "слово", after: "текст" }));
  const safeApplied = auditTarget.apply({ snapshot: safeAttribute, current: safeAttribute.html, target: safeTarget, after: "текст" });
  assert.equal(safeApplied.status, "applied");
  assert.equal(safeApplied.html, '<a title="слово" href="/слово">текст</a>');

  const shortcode = auditTarget.snapshot("[onliner-box]ё[/onliner-box]");
  assert.equal(auditTarget.locate(shortcode, { before: "ё", after: "е" }).status, "not-found");
  const widget = auditTarget.snapshot('[poll]{"question":"ё"}[/poll]');
  assert.equal(auditTarget.locate(widget, { before: "ё", after: "е" }).status, "not-found");

  const nbsp = auditTarget.snapshot("<p>BMW\u00A0X5</p>");
  const nbspTarget = smoke.ready(auditTarget.locate(nbsp, { before: "BMW\u00A0X5", after: "BMW\u00A0X6" }));
  const nbspApplied = auditTarget.apply({ snapshot: nbsp, current: nbsp.html, target: nbspTarget, after: "BMW\u00A0X6" });
  assert.equal(nbspApplied.status, "applied");
  assert.equal(nbspApplied.html, "<p>BMW\u00A0X6</p>");
  const entity = auditTarget.snapshot("<p>BMW&nbsp;X5</p>");
  const entityTarget = smoke.ready(auditTarget.locate(entity, { before: "BMW\u00A0X5", after: "BMW\u00A0X6" }));
  const entityApplied = auditTarget.apply({ snapshot: entity, current: entity.html, target: entityTarget, after: "BMW\u00A0X6" });
  assert.equal(entityApplied.status, "applied");
  assert.equal(entityApplied.html, "<p>BMW\u00A0X6</p>");

  const overlap = auditTarget.snapshot("<p>abcdef</p>");
  const left = smoke.ready(auditTarget.locate(overlap, { before: "bcd", after: "B" }));
  const right = smoke.ready(auditTarget.locate(overlap, { before: "cde", after: "C" }));
  assert.equal(auditTarget.conflicts([left, right]).length, 1);
  assert.equal(auditTarget.apply({ snapshot: overlap, current: overlap.html, target: left, after: "B", pending: [right] }).status, "conflict");

  const sequence = auditTarget.snapshot("<p>первый кот</p><p>второй кот</p>");
  const first = smoke.ready(auditTarget.locate(sequence, { before: "кот", after: "пёс", occurrence: 0 }));
  const second = smoke.ready(auditTarget.locate(sequence, { before: "кот", after: "пёс", occurrence: 1 }));
  const firstApplied = auditTarget.apply({ snapshot: sequence, current: sequence.html, target: first, after: "пёс" });
  assert.equal(firstApplied.status, "applied");
  const secondResolved = smoke.ready(auditTarget.resolve(firstApplied.snapshot, second));
  const secondApplied = auditTarget.apply({ snapshot: firstApplied.snapshot, current: firstApplied.html, target: secondResolved, after: "пёс" });
  assert.equal(secondApplied.status, "applied");
  assert.equal(secondApplied.html, "<p>первый пёс</p><p>второй пёс</p>");

  const stale = auditTarget.snapshot("<p>старый текст</p>");
  const staleTarget = smoke.ready(auditTarget.locate(stale, { before: "старый", after: "новый" }));
  assert.equal(auditTarget.apply({ snapshot: stale, current: "<p>ручной текст</p>", target: staleTarget, after: "новый" }).status, "stale");
  const unrelated = auditTarget.snapshot("<p>старый текст</p>");
  assert.equal(auditTarget.resolve(unrelated, staleTarget).status, "ready");
  const modified = auditTarget.snapshot("<p>старый другой текст</p>");
  assert.equal(auditTarget.resolve(modified, staleTarget).status, "stale");

  assert.equal(auditTarget.locate(stale, { before: "", after: "x" }).status, "invalid");
  assert.equal(auditTarget.locate(stale, { before: "x".repeat(501), after: "y" }).status, "overlarge");
  const escaped = auditTarget.snapshot("<p>замени</p>");
  const escapedTarget = smoke.ready(auditTarget.locate(escaped, { before: "замени", after: "<b>&" }));
  const escapedApplied = auditTarget.apply({ snapshot: escaped, current: escaped.html, target: escapedTarget, after: "<b>&" });
  assert.equal(escapedApplied.html, "<p>&lt;b&gt;&amp;</p>");

  const audit = fs.readFileSync(path.join(__dirname, "..", "src", "actions", "audit.js"), "utf8");
  assert.match(audit, /import \{ auditTarget \} from "\.\/audit-target\.js";/);
  assert.match(audit, /target:\s*proposalTarget/);
  assert.match(audit, /cms\.editor\.runContent\(\(current\) =>/);
  assert.doesNotMatch(audit.match(/const proposalTarget = \{[\s\S]*?\n  \};/)?.[0] || "", /cms\.editor\.html\(|textarea\.value\s*=/);
  const events = [];
  const field = {
    value: "<p>до</p>",
    dispatchEvent(event) {
      events.push(event.type);
    },
  };
  const editor = {
    id: "content",
    saved: 0,
    content: "",
    isHidden: () => false,
    save() {
      editor.saved += 1;
    },
    setContent(value) {
      editor.content = value;
    },
  };
  global.window = { tinyMCE: { activeEditor: editor, get: () => editor } };
  global.document = {
    getElementById: (id) => id === "content" ? field : null,
    querySelector: () => null,
  };
  const { cms } = await smoke.module(path.join("src", "core", "cms.js"));
  const bridged = cms.editor.runContent((value) => value.replace("до", "после"));
  assert.equal(bridged, "<p>после</p>");
  assert.equal(field.value, "<p>после</p>");
  assert.equal(editor.saved, 1);
  assert.equal(editor.content, "<p>после</p>");
  assert.deepEqual(events, ["input", "change"]);
  delete global.window;
  delete global.document;
  console.log("audit target smoke: ok");
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
