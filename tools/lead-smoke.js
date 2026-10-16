const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

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
  async placement() {
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
    const admin = fs.readFileSync(
      path.join(__dirname, "..", "src", "actions", "admin.js"),
      "utf8",
    );
    const readerSource = fs.readFileSync(
      path.join(__dirname, "..", "src", "reader.js"),
      "utf8",
    );
    assert.match(
      scenarios,
      /commands:\s*\[as\.editor\("lead"\),\s*"excerpt",\s*"titles",\s*"slug",\s*"tags\.normalize"\]/,
    );
    assert.match(
      scenarios,
      /as\.editor\("cleanup"\),\s*as\.editor\("audit"\),\s*as\.editor\("reader"\),\s*as\.editor\("lead"\)/,
    );
    assert.match(
      scenarios,
      /when:\s*{\s*surface:\s*\["reader"\]\s*},\s*commands:\s*\["lead",\s*"excerpt",\s*"titles",\s*"slug"\]/,
    );
    assert.match(
      scenarios,
      /variant\(entry\s*=\s*{},\s*current\s*=\s*{},\s*options\s*=\s*{}\)/,
    );
    assert.doesNotMatch(scenarios, /card-index/);
    assert.match(
      commands,
      /lead:\s*{\s*title:\s*"Лид",\s*glyph:\s*"Text First Line",\s*close:\s*"stay"/,
    );
    assert.match(actions, /lead:\s*\(\)\s*=>\s*api\.admin\.lead\.run\(\)/);
    assert.match(
      admin,
      /popupFeatures\(\)\s*{\s*return\s*\[admin\.lead,\s*admin\.excerpt,\s*admin\.titles,\s*admin\.slug\]/,
    );
    assert.match(admin, /replaceFeature:\s*feature/);
    assert.match(admin, /replaceFeature\?\.close\?\.\(\{ restoreFocus: false \}\)/);
    assert.match(admin, /admin\.stack\.button\(\s*"lead-apply"/);
    assert.match(
      admin,
      /if \(!admin\.lead\.headless\.reset\(\)\) return false;\s*const root = admin\.stack\.open\(admin\.lead, options\);\s*admin\.lead\.bind\.actions\(root\)/,
    );
    assert.match(admin, /mainAfter:\s*admin\.lead\.view\.apply\(\)/);
    assert.match(admin, /admin-lead-apply-group/);
    assert.doesNotMatch(admin, /admin\.lead\.bind\.flush\(current\)/);
    assert.match(readerSource, /fields:\s*\["lead"\]/);
    assert.doesNotMatch(readerSource, /fields:\s*\["excerpt"\]/);
    const scenariosUrl = pathToFileURL(
      path.join(__dirname, "..", "src", "runtime", "scenarios.js"),
    ).href;
    const { scenarios: runtime } = await import(scenariosUrl);
    const commandsUrl = pathToFileURL(
      path.join(__dirname, "..", "src", "runtime", "commands.js"),
    ).href;
    const { commands: commandRuntime } = await import(commandsUrl);
    const identity = {
      effectiveRole: "editor",
      feedMode: "editor",
      realUserId: "35",
    };
    const commandIds = (scenario, surface) =>
      scenario
        .groups({
          contextValue: { surface, page: "news", role: ["editor"] },
          identity,
        })
        .find((group) => group.id === "fields")
        .commands.map((command) => command.id || command);
    const reader = runtime.list.find((scenario) => scenario.id === "reader");
    const post = runtime.list.find((scenario) => scenario.id === "post-news");
    assert.deepEqual(commandIds(reader, "reader"), [
      "lead",
      "excerpt",
      "titles",
      "slug",
    ]);
    const readerCommands = reader
      .groups({
        contextValue: { surface: "reader", page: "news", role: ["author"] },
        identity: { ...identity, effectiveRole: "author" },
      })
      .find((group) => group.id === "fields")
      .commands.filter((command) =>
        commandRuntime.allowed(command, "", "author", ""),
      )
      .map((command) => command.id || command);
    assert.deepEqual(readerCommands, ["lead", "excerpt", "titles", "slug"]);
    assert.deepEqual(commandIds(post, "post"), [
      "lead",
      "excerpt",
      "titles",
      "slug",
      "tags.normalize",
    ]);
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
    const liveFirst = lead.replace(snapshot, "<p>Live one</p>", source);
    const liveSnapshot = lead.capture(liveFirst.value, smoke.strip);
    assert.equal(
      lead.replace(liveSnapshot, "<p>Live two</p>", liveFirst.value).value,
      "<h2>Заголовок</h2>\n<p>Live two</p>\n<p>После</p>",
    );
    await smoke.placement();
    process.stdout.write("lead smoke: ok\n");
  },
};

smoke.run().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
