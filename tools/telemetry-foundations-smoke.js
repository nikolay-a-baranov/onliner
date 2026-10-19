const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const smoke = {
  async module(file) {
    const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
    const url = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
    return import(url);
  },
  memory() {
    const values = new Map();
    return {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    };
  },
  root(bodyId = "") {
    return {
      body: { className: bodyId ? `wp-admin user-id-${bodyId}` : "wp-admin" },
    };
  },
  async archive() {
    const url = pathToFileURL(
      path.join(__dirname, "..", "src", "actions", "editorial.js"),
    ).href;
    const { createEditorial } = await import(url);
    const editorial = createEditorial({});
    const files = [
      editorial.textFile(
        "0HF.json",
        JSON.stringify({ stage: "0HF" }),
        "application/json;charset=utf-8",
      ),
    ];
    const blob = await editorial.zipBlob(files, "telemetry-post-123.zip");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    assert.equal(blob.type, "application/zip");
    assert.deepEqual([...bytes.slice(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
    assert.match(new TextDecoder().decode(bytes), /telemetry-post-123\/0HF\.json/);
  },
  async run() {
    const { context } = await smoke.module("src/runtime/context.js");
    assert.equal(
      context.currentUserId(smoke.root("35"), { userSettings: { uid: 35 } }),
      "35",
    );
    assert.equal(
      context.currentUserId(smoke.root("146"), { userSettings: { uid: 35 } }),
      "",
    );
    assert.equal(context.currentUserId(smoke.root(), {}), "");
    const { telemetry } = await smoke.module("src/core/telemetry.js");
    assert.equal(telemetry.allow("35"), true);
    telemetry.enabled = false;
    assert.equal(telemetry.allow("35"), false);
    telemetry.enabled = true;
    assert.equal(telemetry.allow("35"), true);
    assert.equal(telemetry.allow("146"), false);
    assert.equal(telemetry.allow(""), false);
    const { storage } = await smoke.module("src/core/storage.js");
    const memory = smoke.memory();
    const scope = {
      namespace: "telemetry",
      origin: "https://people.onliner.by",
      postId: "123",
      sessionId: "revision-7",
      name: "0HF",
    };
    assert.equal(
      storage.session.set(scope, { title: "Тест" }, {
        storage: memory,
        now: 100,
        ttlMs: 50,
      }).ok,
      true,
    );
    assert.deepEqual(
      storage.session.get(scope, { storage: memory, now: 120 }).value,
      { title: "Тест" },
    );
    assert.equal(storage.session.get(scope, { storage: memory, now: 150 }).reason, "stale");
    assert.equal(storage.session.get(scope, { storage: memory, now: 151 }).reason, "missing");
    memory.setItem(storage.session.key(scope), "{");
    assert.equal(storage.session.get(scope, { storage: memory }).reason, "malformed");
    const quota = {
      setItem() {
        const error = new Error("full");
        error.name = "QuotaExceededError";
        throw error;
      },
    };
    assert.equal(storage.session.set(scope, {}, { storage: quota }).reason, "quota");
    assert.equal(storage.session.get(scope, { storage: null }).reason, "unavailable");
    assert.equal(storage.session.remove(scope, { storage: memory }).ok, true);
    await smoke.archive();
    console.log("telemetry foundations smoke: ok");
  },
};

smoke.run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
