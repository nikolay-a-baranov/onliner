const assert = require("node:assert/strict");

const run = async () => {
  const { markup } = await import("../src/editor/markup.js");
  const { createShared } = await import("../src/actions/shared.js");
  const { createMarkup } = await import("../src/actions/markup.js");
  const selected = "<em>До <strong>слова</strong> после</em>";
  assert.deepEqual(
    markup.clearEm({
      value: selected,
      start: selected.indexOf("<strong>"),
      end: selected.indexOf("</em>") + "</em>".length,
    }),
    {
      value: "<em>До </em><strong>слова</strong> после",
      start: 12,
      end: 40,
    },
  );
  const inner = "<em>До слова после</em>";
  const innerStart = inner.indexOf("слова");
  assert.deepEqual(
    markup.clearEm({
      value: inner,
      start: innerStart,
      end: innerStart + "слова".length,
    }),
    {
      value: "<em>До </em>слова<em> после</em>",
      start: 12,
      end: 17,
    },
  );
  assert.deepEqual(
    markup.clearEm({
      value: "До <em>раз</em> и <em>два</em>",
      start: 3,
      end: 3,
    }),
    {
      value: "До раз и два",
      start: 3,
      end: 3,
    },
  );
  const tail = "<em>До курсора и после</em>";
  const tailStart = tail.indexOf(" и после");
  assert.deepEqual(
    markup.clearEm({
      value: tail,
      start: tailStart,
      end: tailStart,
    }),
    {
      value: "<em>До курсора</em> и после",
      start: 19,
      end: 19,
    },
  );
  const strong = "<strong>Текст</strong>";
  assert.deepEqual(
    markup.strong({ value: strong, start: 0, end: strong.length }),
    { value: "Текст", start: 0, end: 5 },
  );
  const emphasized = "<em>Первый второй</em>";
  const emphasizedStart = emphasized.indexOf("второй");
  assert.deepEqual(
    markup.em({
      value: emphasized,
      start: emphasizedStart,
      end: emphasizedStart + "второй".length,
    }),
    { value: "Первый второй", start: 0, end: 13 },
  );
  const speech = "<em>—\u00A0Привет.</em>";
  assert.deepEqual(
    markup.em({ value: speech, start: 0, end: speech.length }),
    { value: "—\u00A0Привет.", start: 0, end: 9 },
  );
  const api = {};
  Object.assign(api, createShared(api));
  Object.assign(api, createMarkup(api));
  const calls = [];
  const visual = {
    queryCommandState: (name) => name === "Italic",
    selection: {
      getContent: () => "Текст",
      setContent: (value) => calls.push(["set", value]),
    },
    formatter: {
      apply: (name) => calls.push(["apply", name]),
      remove: (name) => calls.push(["remove", name]),
    },
    focus: () => calls.push(["focus"]),
    save: () => calls.push(["save"]),
  };
  assert.equal(api.markup.visualInlineSelection(visual, { mode: "italic" }), true);
  assert.deepEqual(calls, [["remove", "italic"], ["focus"], ["save"]]);
  console.log("editor markup smoke: ok");
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
