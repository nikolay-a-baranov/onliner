const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

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
  assert.equal(JSON.stringify(occurrences[0]).includes(repeated.html), false);
  const analysis = "ошибка один\nошибка два";
  const chunks = auditTarget.split(analysis, 13);
  assert.deepEqual(chunks, [
    { text: "ошибка один", start: 0 },
    { text: "ошибка два", start: 12 },
  ]);
  const languageTool = auditTarget.snapshot("<p>ошибка один</p><p>ошибка два</p>");
  const languageToolTargets = chunks.map((chunk) => {
    const offset = chunk.text.indexOf("ошибка");
    return smoke.ready(auditTarget.align(languageTool, analysis, {
      before: chunk.text.slice(offset, offset + 6),
      after: "ошибку",
      start: chunk.start + offset,
    }));
  });
  assert.equal(new Set(languageToolTargets.map((target) => target.id)).size, 2);
  assert.equal(auditTarget.align(languageTool, analysis, {
    before: "ошибка",
    after: "ошибку",
    start: 1,
  }).status, "not-found");

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
  assert.equal(auditTarget.align(entity, "BMW X5", {
    before: "BMW X5",
    after: "BMW X6",
    start: 0,
  }).status, "unsupported");

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
  const custom = auditTarget.snapshot("<p>было</p>");
  const customTarget = smoke.ready(auditTarget.locate(custom, { before: "было", after: "стало" }));
  const customized = auditTarget.apply({ snapshot: custom, current: custom.html, target: customTarget, after: "вручную" });
  assert.equal(customized.status, "applied");
  assert.equal(customized.html, "<p>вручную</p>");
  const restored = auditTarget.restore({ before: custom, after: customized.snapshot, current: customized.html });
  assert.equal(restored.status, "restored");
  assert.equal(restored.html, custom.html);
  assert.equal(auditTarget.restore({ before: custom, after: customized.snapshot, current: "<p>ручное изменение</p>" }).status, "stale");

  const audit = fs.readFileSync(path.join(__dirname, "..", "src", "actions", "audit.js"), "utf8");
  assert.match(audit, /import \{ auditTarget \} from "\.\/audit-target\.js";/);
  assert.match(audit, /target:\s*proposalTarget/);
  assert.match(audit, /cms\.editor\.runContent\(\(current\) =>/);
  assert.doesNotMatch(audit.match(/const proposalTarget = \{[\s\S]*?\n  \};/)?.[0] || "", /cms\.editor\.html\(|textarea\.value\s*=/);
  assert.match(audit, /if \(item\?\.targetStatus\) \{[\s\S]*?proposalTarget\.apply\([\s\S]*?if \(outcome\.status !== "applied"\) \{[\s\S]*?return false;/);
  assert.match(audit, /if \(!match\.apply\(index, button, state\.textarea\.selectionStart\)\) return;\s*state\.undo\.decision = decision\.add/);
  assert.match(audit, /if \(panel\.active\(\) !== row && !panel\.activate\(index, button\)\) return;\s*const item = state\.visible\[index\];/);
  assert.match(audit, /data-go-active data-ui-availability="deferred"/);
  assert.match(audit, /state\.list\.onclick = action\.click/);
  assert.match(audit, /const row = event\.target\.closest\("\[data-row\]"\)/);
  assert.doesNotMatch(audit, /querySelectorAll\("\[data-row\]"\)\.forEach\(action\.select\)/);
  assert.match(audit, /mode\.providers\(\)\.includes\(item\.source\) \|\| item\.targetStatus/);
  assert.match(audit, /targetStatus && targetStatus !== "ready" \? ' disabled aria-disabled="true"'/);
  assert.match(audit, /if \(item\.targetStatus\) \{\s*const target = selection\.target\(item\);\s*if \(!target\) return true;/);
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
  field.value = "<p>reader</p>";
  editor.saved = 0;
  editor.content = "";
  global.document.body = {
    classList: {
      contains: (value) => value === "reader-active",
    },
  };
  const readerBridged = cms.editor.runContent((value) => value.replace("reader", "audit"));
  assert.equal(readerBridged, "<p>audit</p>");
  assert.equal(field.value, "<p>audit</p>");
  assert.equal(editor.saved, 0);
  assert.equal(editor.content, "");
  delete global.window;
  delete global.document;
  const values = new Map();
  const auditEvents = [];
  global.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
  global.window = { auditIgnored: new Set() };
  global.location = { hostname: "people.onliner.by", href: "https://people.onliner.by/wp-admin/post.php" };
  global.document = {
    getElementById: () => null,
    querySelector: () => null,
  };
  const auditUrl = pathToFileURL(path.join(__dirname, "..", "src", "actions", "audit.js")).href;
  const { createAudit } = await import(auditUrl);
  const auditApi = createAudit({
    telemetry: {
      auditRecord(kind, value) {
        auditEvents.push({ kind, value });
        return true;
      },
    },
  }).audit.text;
  const auditHtml = "<p>уникальная ашипка</p><p>ещё текст</p>";
  const auditPlain = "уникальная ашипка\nещё текст";
  const integrationBefore = auditApi.target.snapshot(auditHtml);
  auditApi.state.targetSnapshot = integrationBefore;
  auditApi.state.plain = auditPlain;
  const languageToolMapped = auditApi.data.map.languagetool({
    matches: [{
      offset: auditPlain.indexOf("ашипка"),
      length: 6,
      message: "Возможно найдена орфографическая ошибка.",
      replacements: [{ value: "ошибка" }],
      rule: { id: "MISTAKE", category: { id: "TYPOS" } },
    }],
  }, { text: auditPlain, start: 0 });
  assert.equal(languageToolMapped.items.length, 1);
  assert.equal(languageToolMapped.items[0].targetStatus, "ready");
  assert.equal(languageToolMapped.items[0].sourceOffset, auditPlain.indexOf("ашипка"));
  const languageToolMismatch = auditApi.data.map.languagetool({
    matches: [{
      offset: 0,
      length: 5,
      message: "Возможно найдена орфографическая ошибка.",
      replacements: [{ value: "новая" }],
      rule: { id: "MISTAKE", category: { id: "TYPOS" } },
    }],
  }, { text: "чужая ошибка", start: 0 });
  assert.equal(languageToolMismatch.items[0].targetStatus, "not-found");
  const llmUnique = auditApi.data.map.gemini({
    edits: [{ before: "ещё", after: "другой", reason: "test", confidence: 1 }],
  });
  assert.equal(llmUnique.items[0].targetStatus, "ready");
  auditApi.state.plain = "другой анализ";
  const llmOutsideAnalysis = auditApi.data.map.gemini({
    edits: [{ before: "ещё", after: "другой", reason: "test", confidence: 1 }],
  });
  assert.equal(llmOutsideAnalysis.items[0].targetStatus, "not-found");
  const duplicateHtml = "<p>дубль один</p><p>дубль два</p>";
  auditApi.state.targetSnapshot = auditApi.target.snapshot(duplicateHtml);
  auditApi.state.plain = "дубль один\nдубль два";
  const llmDuplicate = auditApi.data.map.gemini({
    edits: [{ before: "дубль", after: "замена", reason: "test", confidence: 1 }],
  });
  assert.equal(llmDuplicate.items[0].targetStatus, "ambiguous");
  auditApi.state.targetSnapshot = auditApi.target.snapshot("<p>ааа</p>");
  auditApi.state.plain = "ааа";
  const llmOverlapDuplicate = auditApi.data.map.gemini({
    edits: [{ before: "аа", after: "б", reason: "test", confidence: 1 }],
  });
  assert.equal(llmOverlapDuplicate.items[0].targetStatus, "ambiguous");
  const integrationEvents = [];
  const integrationField = {
    value: auditHtml,
    dispatchEvent(event) {
      integrationEvents.push(event.type);
    },
  };
  global.document.getElementById = (id) => id === "content" ? integrationField : null;
  auditApi.state.targetSnapshot = auditApi.target.snapshot(auditHtml);
  const integrated = auditApi.target.apply(
    auditApi.state.targetSnapshot,
    languageToolMapped.items[0].target,
    "ручная",
  );
  assert.equal(integrated.status, "applied");
  assert.equal(integrationField.value, "<p>уникальная ручная</p><p>ещё текст</p>");
  assert.deepEqual(integrationEvents, ["input", "change"]);
  auditApi.state.targetSnapshot = integrated.snapshot;
  auditApi.state.undo = {
    type: "apply",
    before: integrationBefore.html,
    after: integrated.html,
    beforeSnapshot: integrationBefore,
    afterSnapshot: integrated.snapshot,
    guarded: true,
  };
  auditApi.panel.undo = () => true;
  auditApi.panel.render = () => true;
  auditApi.action.undo();
  assert.equal(integrationField.value, auditHtml);
  assert.deepEqual(integrationEvents, ["input", "change", "input", "change"]);
  assert.equal(auditApi.state.targetSnapshot, integrationBefore);
  assert.equal(auditApi.state.undo, null);
  const fieldAfterManualEdit = {
    value: "<p>ручное изменение</p>",
    selectionStart: 0,
    selectionEnd: 0,
    dispatchEvent() {},
  };
  global.document.getElementById = (id) => id === "content" ? fieldAfterManualEdit : null;
  auditApi.state.targetSnapshot = auditApi.target.snapshot(auditHtml);
  auditApi.state.targetStale = false;
  auditApi.state.textarea = fieldAfterManualEdit;
  auditApi.state.visible = [languageToolMapped.items[0]];
  const select = { value: "ошибка" };
  const row = {};
  auditApi.state.panel = {
    querySelector(selector) {
      if (selector === '[data-select="0"]') return select;
      return null;
    },
  };
  auditApi.panel.row = () => row;
  auditApi.panel.active = () => row;
  auditApi.panel.render = () => true;
  auditApi.selection.miss = () => true;
  auditApi.action.fix({ dataset: { fix: "0" } });
  assert.equal(fieldAfterManualEdit.value, "<p>ручное изменение</p>");
  assert.equal(auditApi.state.targetStale, true);
  assert.deepEqual(auditEvents, []);
  delete global.localStorage;
  delete global.window;
  delete global.document;
  delete global.location;
  console.log("audit target smoke: ok");
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
