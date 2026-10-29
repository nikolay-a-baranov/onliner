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
  async syntax() {
    const file = path.join(__dirname, "..", "src", "core", "syntax.js");
    return import(pathToFileURL(file).href);
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
    const audit = fs.readFileSync(
      path.join(__dirname, "..", "src", "actions", "audit.js"),
      "utf8",
    );
    const chain = fs.readFileSync(
      path.join(__dirname, "..", "src", "actions", "chain.js"),
      "utf8",
    );
    const styles = fs.readFileSync(
      path.join(__dirname, "..", "src", "core", "surface", "styles.js"),
      "utf8",
    );
    const icon = fs.readFileSync(
      path.join(__dirname, "..", "src", "core", "surface", "icon.js"),
      "utf8",
    );
    const ui = fs.readFileSync(
      path.join(__dirname, "..", "src", "core", "surface", "ui.js"),
      "utf8",
    );
    const uxSource = fs.readFileSync(
      path.join(__dirname, "..", "src", "core", "surface", "ux.js"),
      "utf8",
    );
    const launchpad = fs.readFileSync(
      path.join(__dirname, "..", "src", "launchpad.js"),
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
      /as\.editor\("cleanup"\),\s*as\.editor\("strip"\),\s*as\.editor\("audit"\),\s*as\.editor\("edits"\),/,
    );
    assert.match(scenarios, /as\.editor\("reader"\),/);
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
      /lead:\s*{\s*title:\s*"Лид",\s*glyph:\s*"Slide Content",\s*close:\s*"stay"/,
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
      /if \(!admin\.lead\.headless\.reset\(\)\) return false;\s*const root = admin\.stack\.open\(admin\.lead, options\);\s*admin\.stack\.cleanup\(admin\.lead, \(\) => admin\.lead\.syntax\.clear\(root\)\);\s*admin\.lead\.bind\.actions\(root\)/,
    );
    assert.match(admin, /mainAfter:\s*admin\.lead\.view\.apply\(\)/);
    assert.match(admin, /data-admin-stack-head="true" data-panel-head="true"/);
    assert.match(audit, /ux\.layout\.head\.fit\(root,/);
    assert.match(audit, /attrs:\s*' data-panel-head="true"'/);
    assert.equal(audit.match(/data-ui-availability="deferred"/g)?.length, 4);
    assert.match(audit, /availability:\s*{\s*keyPage:\s*"deferred",\s*qwen:\s*options\.qwen === true \? "available" : "deferred"/);
    assert.match(audit, /qwen:\s*config\.qwen && config\.availability\.qwen !== "deferred"/);
    assert.match(audit, /placement:\s*{\s*initial:\s*String\(options\.placement \|\| "bottom-center"\)/);
    assert.match(audit, /place:\s*\(\) => panel\.place\(\)/);
    assert.match(audit, /place\(mode = state\.placement\)/);
    assert.match(audit, /state\.placement = String\(options\.placement \|\| config\.placement\.initial\)/);
    assert.doesNotMatch(audit, /placeSoon/);
    assert.doesNotMatch(chain, /placement:\s*"bottom-right"/);
    assert.doesNotMatch(chain, /completedPlacement:\s*"top-center"/);
    assert.match(audit, /if \(checked && hasMatches && options\.completedPlacement\)/);
    assert.match(
      chain,
      /const lead = await api\.admin\.lead\.run\(\{ waitForClose: true \}\);[\s\S]*?background:\s*true,[\s\S]*?closeEmpty:\s*true/,
    );
    assert.match(admin, /flow:\s*\{[\s\S]*?waiters:\s*new Set\(\),[\s\S]*?complete\(\)[\s\S]*?content\.holders\.size/);
    assert.match(admin, /if \(!opened \|\| options\.waitForClose !== true\) return opened;\s*return admin\.stack\.flow\.wait\(\);/);
    assert.match(audit, /if \(options\.panel !== false\) panel\.create\(\);/);
    assert.match(audit, /if \(options\.background === true\) return app\.background\(options\);/);
    assert.match(audit, /state\.panel\.hidden = true;[\s\S]*?app\.checks\(sources\)[\s\S]*?state\.panel\.hidden = false;/);
    assert.match(audit, /reviewWait:\s*null/);
    assert.match(audit, /flow\.complete\(true\);\s*state\.session \+= 1/);
    assert.match(audit, /const reviewCompletion = options\.waitForReview === true/);
    assert.match(audit, /if \(checked\) return reviewCompletion;/);
    assert.match(audit, /keyPrompted:\s*new Set\(\)/);
    assert.match(audit, /if \(state\.keyPrompted\.has\(provider\)\) \{\s*throw new Error\("API-ключ не указан\."\);/);
    assert.match(audit, /state\.keyPrompted\.clear\(\)/);
    assert.match(audit, /new ResizeObserver\(\(\) => layout\.syncHead\(\)\)/);
    assert.match(
      styles,
      /\[data-head-mode="compact"\] \.ui-shell\[data-panel-head="true"\]\[data-pack="spread"\]/,
    );
    assert.match(styles, /\[data-ui-availability="deferred"\]\s*\{\s*display:\s*none\s*!important;/);
    assert.doesNotMatch(styles, /#audit-panel \.audit-engine-group \{[^}]*max-width:\s*max-content/s);
    assert.match(admin, /admin-lead-apply-group/);
    assert.match(
      admin,
      /const apply = mainAfter\s*\? `<div class="admin-fields-apply-slot">\$\{mainAfter\}<\/div>`\s*:\s*"";/,
    );
    assert.match(styles, /\.admin-stack-main\{[^}]*min-height:var\(--rail-horizontal-cross-size\);/s);
    assert.match(styles, /--admin-head-compact-width:420px/);
    assert.match(admin, /mode:\s*compact \? "compact" : ""/);
    assert.match(admin, /compactEdge:\s*true/);
    assert.match(uxSource, /const requestedMode = \["line", "compact"\]\.includes\(options\.mode\)/);
    assert.match(uxSource, /mode !== "compact" \|\| options\.compactEdge === true/);
    assert.match(
      admin,
      /cycleItems\(\)\s*{\s*return admin\.titles\.headless\.items\(\);\s*}/,
    );
    assert.match(admin, /data-title-picker data-title-picker-count=/);
    assert.match(admin, /admin\.titles\.view\.animatePicker\(root, delta\)/);
    assert.match(admin, /admin\.titles\.bind\.swipe\(root\)/);
    assert.match(admin, /Math\.abs\(y\) >= 24 && Math\.abs\(y\) > Math\.abs\(x\) \* 1\.15/);
    assert.match(styles, /\.admin-title-picker\{[^}]*touch-action:none;/s);
    assert.match(styles, /data-title-picker-dragging="true"/);
    assert.match(styles, /@keyframes admin-title-picker-next/);
    assert.match(
      admin,
      /if \(ux\.hotkeys\.popup\.cycle\.match\(event\)\) \{\s*return admin\.stack\.cycleFeature\(feature, 1\) \? "handled" : "blocked";/,
    );
    assert.match(
      admin,
      /\.filter\(\(field\) => field && field\.tabIndex !== -1\);\s*if \(fields\.length\) \{\s*const index = fields\.indexOf\(input\);/,
    );
    assert.match(
      admin,
      /"lead-apply",\s*ui\.controls\.glyph\("Subtitles",\s*22,\s*"Subtitles"\)/,
    );
    assert.match(admin, /counter:\s*false/);
    assert.match(admin, /value:\s*admin\.lead\.state\.draft,\s*placeholder:\s*""/);
    assert.match(
      admin,
      /admin\.lead\.state\.error !== admin\.lead\.copy\.error\.missing/,
    );
    assert.match(admin, /marker:\s*"ping-pong"/);
    assert.equal(admin.match(/contentLock:\s*true/g)?.length, 4);
    assert.match(admin, /admin\.excerpt\.headless\.commit\(quote\)/);
    assert.match(admin, /import \{ syntax as markupSyntax \} from "\.\.\/core\/syntax\.js"/);
    assert.match(admin, /data-lead-editor/);
    assert.match(admin, /markupSyntax\.tokenize\(input\.value \|\| ""\)/);
    assert.match(styles, /\.admin-lead-editor\[data-syntax-active="true"\] \.admin-fields-input/);
    assert.match(readerSource, /import \{ syntax as markupSyntax \} from "\.\/core\/syntax\.js"/);
    assert.match(readerSource, /return markupSyntax\.tokenize\(value\)/);
    assert.match(admin, /replaceFeature:\s*admin\.lead/);
    assert.match(icon, /"ping-pong":\s*"\\u\{1F3D3\}"/);
    assert.match(ui, /hotkeys\.config\.command\(event,\s*editable,\s*context\)/);
    assert.match(
      launchpad,
      /command:\s*\(event\)\s*=>\s*launcher\.keyboard\.run\(event\)/,
    );
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
    const uxUrl = pathToFileURL(
      path.join(__dirname, "..", "src", "core", "surface", "ux.js"),
    ).href;
    const { ux } = await import(uxUrl);
    const marker = {};
    assert.deepEqual(
      ux.layout.head.items([{ node: null, flex: true }, marker]),
      [{ node: marker }],
    );
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
    const chainUrl = pathToFileURL(
      path.join(__dirname, "..", "src", "actions", "chain.js"),
    ).href;
    const { createChain } = await import(chainUrl);
    const calls = [];
    let finishLead = () => {};
    let auditOptions = null;
    const chainRuntime = createChain({
      admin: {
        clean: {
          async run() {
            calls.push("clean");
            return true;
          },
        },
        lead: {
          run(options) {
            calls.push("lead");
            assert.equal(options.waitForClose, true);
            return new Promise((resolve) => {
              finishLead = resolve;
            });
          },
        },
      },
      audit: {
        text: {
          run(options) {
            calls.push("audit-background");
            auditOptions = options;
            return true;
          },
        },
      },
    });
    const chainRun = chainRuntime.chain.run({
      identity,
      context: { surface: "post", page: "news" },
      reader: {
        async run() {
          calls.push("reader");
          return true;
        },
      },
    });
    await Promise.resolve();
    await Promise.resolve();
    assert.deepEqual(calls, ["clean", "reader", "lead"]);
    finishLead(true);
    assert.equal(await chainRun, true);
    assert.deepEqual(calls, ["clean", "reader", "lead", "audit-background"]);
    assert.deepEqual(auditOptions, {
      background: true,
      backgroundSources: ["languagetool"],
      sources: ["gemini"],
      closeEmpty: true,
    });
  },
  async run() {
    const { lead } = await smoke.module();
    const { syntax } = await smoke.syntax();
    const locate = (value) => lead.locate(value, smoke.strip);
    assert.equal(
      locate("<em>Italic lead</em>\n\n<p>After</p>").html,
      "<em>Italic lead</em>",
    );
    assert.equal(locate("<section>Not a lead</section>"), null);
    assert.deepEqual(syntax.tokenize("<em>Italic</em>"), [
      { text: "<em>", kind: "markup" },
      { text: "Italic", kind: "" },
      { text: "</em>", kind: "markup" },
    ]);
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
