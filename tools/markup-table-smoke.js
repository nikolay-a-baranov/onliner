const assert = require("node:assert/strict");

globalThis.location = { hostname: "www.onliner.by" };
globalThis.document = {
  createElement() {
    let html = "";
    return {
      set innerHTML(value) {
        html = value;
      },
      get value() {
        return html.replace(/<[^>]*>/g, "");
      },
    };
  },
};

const rows = (value) =>
  [...value.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) =>
    [...row[1].matchAll(/<t[dh]\b[^>]*>[\s\S]*?<\/t[dh]>/gi)].length,
  );

(async () => {
  const { markup } = await import("../src/pipe/markup.js");
  const input = [
    '<table border="0">',
    "<tbody>",
    "<tr><td></td><td>A</td><td>B</td></tr>",
    "<tr><td>X</td><td>1</td><td>2</td></tr>",
    "</tbody>",
    "</table>",
  ].join("\n");
  const output = markup.html.content(input);
  assert.deepEqual(rows(input), [3, 3]);
  assert.deepEqual(rows(output), [3, 3]);
  assert.match(output, /<th align="center"><\/th>/);
  assert.match(output, /<td>X<\/td>/);

  const malformed = [
    "<table>",
    "<tr><td>A</td><td>B</td></tr>",
    "<tr><td>X</td><td>1</td><td>2</td></tr>",
    "<tr><td>Y</td><td>3</td></tr>",
    "</table>",
  ].join("\n");
  const repaired = markup.html.content(malformed);
  assert.deepEqual(rows(repaired), [3, 3, 3]);
  assert.match(
    repaired,
    /<tr>\s*<th align="center"><\/th>\s*<th align="center"><strong>A<\/strong><\/th>/,
  );
  assert.match(repaired, /<td>Y<\/td>\s*<td align="center">3<\/td>\s*<td align="center"><\/td>/);

  const decimals = [
    "<table>",
    "<tr><td>Item</td><td>Price</td></tr>",
    "<tr><td>A</td><td>5,46</td></tr>",
    "<tr><td>B</td><td>4,8</td></tr>",
    "<tr><td>C</td><td>3</td></tr>",
    "</table>",
  ].join("\n");
  const aligned = markup.html.content(decimals);
  assert.match(aligned, /<td align="center">5,46<\/td>/);
  assert.match(aligned, /<td align="center">4,80<\/td>/);
  assert.match(aligned, /<td align="center">3,00<\/td>/);
  console.log("markup table structure smoke: ok");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
