const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { build } = require("./build.js");

const smoke = {
  fixture(file) {
    return path.join(__dirname, "fixtures", "build-registry", file);
  },
  run() {
    const entry = smoke.fixture("entry.js");
    const context = {};
    vm.runInNewContext(build.registry.bundle(entry), context);
    assert.equal(context.__BUILD_REGISTRY_RESULT__.loads, 1);
    assert.equal(context.__BUILD_REGISTRY_RESULT__.singleton, true);
    assert.equal(
      context.__BUILD_REGISTRY_RESULT__.order,
      "shared,first,consumer,second",
    );
    const stats = build.registry.stats.get(path.resolve(entry));
    assert.equal(stats.emitted, stats.unique);
    assert.equal(stats.unique, 5);
    const storefront = build.primary({
      id: "launchpad",
      hrefGh: "javascript:void 0",
      title: "Launchpad",
      label: "Launchpad",
      bookmarkLabel: "Launchpad",
      ok: "",
      fail: "",
      copy: "href",
      hrefJs: "javascript:void 0",
      distPath: "dist",
      code: "",
      icon: "icon",
    });
    assert.match(storefront, /data-ledger-file/);
    assert.match(storefront, /data-ledger-upload/);
    assert.match(storefront, /title="Дашборд" aria-label="Дашборд"/);
    assert.doesNotMatch(storefront, /Worker Bootstrap/);
    assert.ok(storefront.indexOf("launchpad-primary-guides") < storefront.indexOf("ledger-upload"));
    const ledger = build.ledger.html();
    assert.match(ledger, /load\.pending\(\)/);
    assert.match(ledger, /Участие в ревизиях/);
    assert.match(ledger, /__ONLINER_LEDGER_GROUP__/);
    assert.match(ledger, /Николай Баранов/);
    assert.match(ledger, /#rowsPanel table \{ min-width: 1160px; \}/);
    assert.match(ledger, /@media \(max-width: 1450px\)/);
    [...ledger.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((match) => {
      assert.doesNotThrow(() => new Function(match[1]));
    });
    const storefrontApp = fs.readFileSync(
      path.join(__dirname, "storefront", "app.js"),
      "utf8",
    );
    assert.match(storefrontApp, /assets\/images\/github\.svg/);
    assert.match(storefrontApp, /assets\/images\/javascript\.svg/);
    assert.match(storefrontApp, /assets\/icons\/fluent\/code_20_regular\.svg/);
    assert.doesNotMatch(
      storefrontApp,
      /cdn\.jsdelivr\.net|api\.iconify\.design\/simple-icons/,
    );
    const sandbox = fs.readFileSync(
      path.join(__dirname, "..", "sandbox", "index.html"),
      "utf8",
    );
    const sandboxDiagnostics = fs.readFileSync(
      path.join(__dirname, "..", "assets", "sandbox", "diagnostics.js"),
      "utf8",
    );
    assert.match(sandbox, /id="sandbox-demo-tools"/);
    assert.match(sandboxDiagnostics, /id=\"sandbox-overlay-demo\"/);
    assert.match(sandboxDiagnostics, /crawler\.overlay\.demo/);
    console.log("build registry smoke: ok");
  },
};

smoke.run();
