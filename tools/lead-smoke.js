const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const smoke = {
  async module() {
    const file = path.join(__dirname, "..", "src", "actions", "admin", "lead.js");
    const source = fs.readFileSync(file, "utf8");
    const url = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
    return import(url);
  },
  strip(value = "") {
    return String(value || "")
      .replace(/<img\b[^>]*>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ");
  },
  placement() {
    const scenarios = fs.readFileSync(
      path.join(__dirname, "..", "src", "runtime", "scenarios.js"),
      "utf8",
    );
    const commands = fs.readFileSync(
      path.join(__dirname, "..", "src", "runtime", "commands.js"),
      "utf8",
    );
    const actions = fs.readFileSync(
      path.join(__dirname, "..", "src", "actions.js"),
      "utf8",
    );
    assert.match(
      scenarios,
      /commands:\s*\["titles",\s*"slug",\s*as\.editor\("lead"\),\s*"excerpt",\s*"tags\.normalize"\]/,
    );
    assert.match(
      scenarios,
      /as\.editor\("cleanup"\),\s*as\.editor\("audit"\),\s*as\.editor\("reader"\),\s*as\.editor\("lead"\)/,
    );
    assert.match(scenarios, /remove:\s*\["lead",\s*"tags\.normalize"\]/);
    assert.doesNotMatch(scenarios, /card-index/);
    assert.match(
      commands,
      /lead:\s*{\s*title:\s*"Лид",\s*glyph:\s*"Text First Line",\s*close:\s*"stay"/,
    );
    assert.match(actions, /lead:\s*\(\)\s*=>\s*api\.admin\.lead\.run\(\)/);
  },
  async run() {
    const { lead } = await smoke.module();
    const locate = (value) => lead.locate(value, smoke.strip);
    assert.equal(
      locate("  \n<p>Первый</p><p>Второй</p>").html,
      "<p>Первый</p>",
    );
    assert.equal(
      locate("<p> &nbsp; </p>\n<h2>Тема</h2>\n<p>Лид</p>").html,
      "<p>Лид</p>",
    );
    assert.equal(
      locate(
        '<img src="a.jpg">\n<dl class="wp-caption"><dt><img src="b.jpg"></dt><dd>Подпись</dd></dl>\n<p>Лид</p>',
      ).html,
      "<p>Лид</p>",
    );
    assert.equal(
      locate("[video]<iframe></iframe>[/video]\n<p>Лид</p>").html,
      "<p>Лид</p>",
    );
    assert.equal(locate("<!--more-->\n<p>Поздно</p>"), null);
    assert.equal(
      locate("<p>Лид</p>\n<!--more-->\n<p>Текст</p>").html,
      "<p>Лид</p>",
    );
    assert.equal(locate("<h2>Только заголовок</h2>"), null);
    const source = "<h2>Заголовок</h2>\n<p>Лид</p>\n<p>После</p>";
    const snapshot = lead.capture(source, smoke.strip);
    assert.equal(
      lead.replace(snapshot, "<p>Новый лид</p>", source).value,
      "<h2>Заголовок</h2>\n<p>Новый лид</p>\n<p>После</p>",
    );
    assert.equal(
      lead.replace(snapshot, "<p>Новый лид</p>", `${source}!`).reason,
      "stale",
    );
    assert.equal(lead.replace(snapshot, "   ", source).reason, "empty");
    assert.deepEqual(lead.capture(source, smoke.strip), snapshot);
    smoke.placement();
    process.stdout.write("lead smoke: ok\n");
  },
};

smoke.run().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
