const assert = require("node:assert/strict");
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
    console.log("build registry smoke: ok");
  },
};

smoke.run();
