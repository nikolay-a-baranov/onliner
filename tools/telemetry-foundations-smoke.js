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
  revisionRow({ id = "", date = "", author = "", href = "" } = {}) {
    const link = href === null ? null : {
      href: href || `https://people.onliner.by/wp-admin/revision.php?revision=${id}`,
      textContent: date,
      getAttribute: () => href || `revision.php?revision=${id}`,
    };
    return {
      textContent: `${date} автора ${author}`.trim(),
      querySelector: (selector) => selector === 'a[href*="revision="]' ? link : null,
    };
  },
  revisionRoot(rows = [], present = true, author = null, dictionary = null) {
    const list = { querySelectorAll: (selector) => selector === ":scope > li" ? rows : [] };
    const select = author ? {
      selectedOptions: [{ value: String(author.id || ""), textContent: author.name || "" }],
      querySelector: () => null,
    } : null;
    const dictionarySelect = dictionary ? {
      querySelectorAll(selector) {
        const id = selector.match(/^option\[value="(\d+)"\]$/)?.[1];
        return dictionary.filter((entry) => String(entry.id) === id).map((entry) => ({ value: String(entry.id), textContent: entry.name || "", selected: Boolean(entry.selected) }));
      },
    } : null;
    return {
      querySelector(selector) {
        if (selector === "ul.post-revisions") return present ? list : null;
        if (selector === "#post_author_override") return select;
        if (selector === "#additional_post_authors") return dictionarySelect;
        return null;
      },
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
      editorial.textFile(
        "manifest.json",
        JSON.stringify({ revision_provenance: { status: "not_available" } }),
        "application/json;charset=utf-8",
      ),
    ];
    const blob = await editorial.zipBlob(files, "telemetry-post-123.zip");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    assert.equal(blob.type, "application/zip");
    assert.deepEqual([...bytes.slice(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
    assert.match(new TextDecoder().decode(bytes), /telemetry-post-123\/0HF\.json/);
    assert.match(new TextDecoder().decode(bytes), /telemetry-post-123\/manifest\.json/);
  },
  submitOrder() {
    const source = fs.readFileSync(path.join(__dirname, "..", "src", "actions", "admin.js"), "utf8");
    const submitStart = source.indexOf("  async submit(state, action)");
    const submitEnd = source.indexOf("  async execute(action", submitStart);
    const submitSource = source.slice(submitStart, submitEnd);
    assert.ok(submitStart >= 0 && submitEnd > submitStart);
    const submitOrder = ["await this.archive()", "await this.vpn()", "await this.click(action)"].map((value) => submitSource.indexOf(value));
    assert.equal(submitOrder.every((index) => index >= 0), true);
    assert.equal(submitOrder.every((index, position) => position === 0 || index > submitOrder[position - 1]), true);
    const guardStart = source.indexOf("        async guard(event, button)");
    const guardEnd = source.indexOf("        bind(selector)", guardStart);
    const guardSource = source.slice(guardStart, guardEnd);
    assert.ok(guardStart >= 0 && guardEnd > guardStart);
    const guardOrder = ["await submit.archive()", "await admin.clean.submit.vpn()", "await admin.clean.submit.open(button)"].map((value) => guardSource.indexOf(value));
    assert.equal(guardOrder.every((index) => index >= 0), true);
    assert.equal(guardOrder.every((index, position) => position === 0 || index > guardOrder[position - 1]), true);
    assert.match(source, /async archive\(\)[\s\S]*if \(result !== false\) return true;[\s\S]*field\.alert\("Не удалось скачать архив телеметрии\. Отправка отменена"\)/);
    assert.match(source, /async vpn\(\)[\s\S]*cms\.vpn\.ensure\("🛑 VPN", 5000\)[\s\S]*field\.alert\(error\.message\)/);
    assert.doesNotMatch(source, /if \(action === "save"\) return true/);
    assert.doesNotMatch(source, /Всё равно (?:сохранить|отправить)/);
    const clickStart = source.indexOf("  async click(action)");
    const clickEnd = source.indexOf("  allowed(button", clickStart);
    const clickSource = source.slice(clickStart, clickEnd);
    assert.equal(clickSource.indexOf("api.telemetry?.resetExport?.()") > clickSource.indexOf("button.click()"), true);
    const openStart = source.indexOf("        async open(button)");
    const openEnd = source.indexOf("        async guard(event, button)", openStart);
    const openSource = source.slice(openStart, openEnd);
    assert.equal(openSource.indexOf("api.telemetry?.resetExport?.()") > openSource.indexOf("button.click()"), true);
    const telemetrySource = fs.readFileSync(path.join(__dirname, "..", "src", "actions", "telemetry.js"), "utf8");
    assert.match(telemetrySource, /if \(!capture\("2NT"\)\) return false;/);
    const downloadIndex = telemetrySource.indexOf("deps.downloadBlob(filename, blob)");
    const settleIndex = telemetrySource.indexOf("setTimeout(resolve, 150)", downloadIndex);
    const successIndex = telemetrySource.indexOf("return true", settleIndex);
    assert.equal(downloadIndex >= 0 && settleIndex > downloadIndex && successIndex > settleIndex, true);
  },
  async manifest() {
    const url = pathToFileURL(
      path.join(__dirname, "..", "src", "actions", "telemetry.js"),
    ).href;
    const { telemetryArchive } = await import(url);
    const snapshot = { schema: "onliner.post-snapshot/v1", fields: { title: [{ value: "Test" }] } };
    const before = JSON.stringify(snapshot);
    const date = new Date("2026-10-22T16:03:18.000Z");
    const provenance = {
      schema: "onliner.revision-provenance/v1",
      captured_at: "2026-10-22T16:00:00.000Z",
      capture_point: "0HF",
      source: "wp-admin-dom",
      status: "not_available",
      reason: "revision-list-absent",
    };
    const manifest = telemetryArchive.manifest({
      postId: "123",
      section: "people",
      records: [{ stage: "0HF", value: snapshot }],
      missing: ["1GL", "2NT"],
      audit: null,
      revisionProvenance: provenance,
      date,
      view: {
        innerWidth: 1440,
        innerHeight: 900,
        navigator: {
          userAgent: "",
          userAgentData: {
            mobile: false,
            platform: "Windows",
            brands: [{ brand: "Not A Brand" }, { brand: "Google Chrome" }],
          },
        },
      },
    });
    assert.deepEqual(manifest.environment, {
      captured_at: "2026-10-22T16:03:18.000Z",
      device_type: "desktop",
      os: "Windows",
      browser: "Chrome",
      viewport: { width: 1440, height: 900 },
    });
    assert.equal(manifest.exported_at, manifest.environment.captured_at);
    assert.equal(manifest.complete, false);
    assert.deepEqual(manifest.stages, ["0HF"]);
    assert.deepEqual(manifest.revision_provenance, provenance);
    assert.equal(JSON.stringify(snapshot), before);
    const unknown = telemetryArchive.manifest({
      postId: "123",
      section: "people",
      records: [],
      missing: ["0HF", "1GL", "2NT"],
      audit: null,
      date,
      view: { innerWidth: 0, innerHeight: Number.NaN, navigator: {} },
    });
    assert.deepEqual(unknown.environment, {
      captured_at: "2026-10-22T16:03:18.000Z",
      device_type: "unknown",
      os: null,
      browser: null,
      viewport: { width: null, height: null },
    });
    assert.equal(Object.hasOwn(unknown, "revision_provenance"), false);
    const signatureInput = {
      records: [{ stage: "2NT", value: snapshot }],
      audit: { events: [] },
      revisionProvenance: provenance,
    };
    const laterSnapshot = { ...snapshot, meta: { ...snapshot.meta, captured_at: "2026-10-22T16:04:18.000Z" } };
    assert.equal(telemetryArchive.signature(signatureInput), telemetryArchive.signature({ ...signatureInput, records: [{ stage: "2NT", value: laterSnapshot }] }));
    const changedSnapshot = { ...snapshot, fields: { ...snapshot.fields, title: [{ value: "Изменено" }] } };
    assert.notEqual(telemetryArchive.signature(signatureInput), telemetryArchive.signature({ ...signatureInput, records: [{ stage: "2NT", value: changedSnapshot }] }));
  },
  async revisions() {
    const url = pathToFileURL(
      path.join(__dirname, "..", "src", "actions", "telemetry.js"),
    ).href;
    const { telemetryRevision } = await import(url);
    const capturedAt = "2026-10-22T18:00:00.000Z";
    const origin = "https://people.onliner.by";
    const fields = { post_author: [{ value: "35" }] };
    const available = telemetryRevision.capture(smoke.revisionRoot([
      smoke.revisionRow({ id: "801", date: "25.03.2026, 19:45", author: "Анна Иванова" }),
      smoke.revisionRow({ id: "802", date: "25.03.2026, 20:00", author: "Николай Баранов" }),
      smoke.revisionRow({ id: "803", date: "25.03.2026, 20:10", author: "Иван Петров" }),
    ], true, { id: "35", name: "  НИКОЛАЙ   БАРАНОВ " }), capturedAt, origin, fields);
    assert.equal(available.status, "available");
    assert.equal(available.source, "wp-admin-dom");
    assert.equal(available.capture_point, "0HF");
    assert.deepEqual(available.latest_visible_revision, {
      revision_id: 803,
      displayed_at: "25.03.2026, 20:10",
      local_date: "2026-03-25",
      local_time: "20:10",
      timezone: "unknown",
      precision: "minute",
      author_display_name: "Иван Петров",
    });
    assert.equal(available.author_match, "display-name");
    assert.deepEqual(available.post_author, {
      author_id: 35,
      display_name: "НИКОЛАЙ БАРАНОВ",
      id_source: "form.post_author",
      display_name_source: "#post_author_override option:checked",
    });
    assert.equal(available.latest_post_author_revision.revision_id, 802);
    assert.equal(available.latest_post_author_revision.author_display_name, "Николай Баранов");
    assert.deepEqual(available.coverage, { visible_rows: 3, parsed_rows: 3, ignored_rows: 0, complete: false });
    const absent = telemetryRevision.capture(smoke.revisionRoot([], false), capturedAt, origin);
    assert.equal(absent.status, "not_available");
    assert.equal(absent.reason, "revision-list-absent");
    assert.equal(absent.latest_post_author_revision, null);
    const malformed = telemetryRevision.capture(smoke.revisionRoot([
      smoke.revisionRow({ id: "", date: "25 марта 2026", author: "Николай Баранов" }),
      smoke.revisionRow({ id: "804", date: "31.02.2026, 20:00", author: "Анна Иванова" }),
      smoke.revisionRow({ id: "805", date: "25.03.2026, 20:10", author: "", href: null }),
    ]), capturedAt, origin);
    assert.equal(malformed.status, "unparseable");
    assert.equal(malformed.reason, "no-parseable-rows");
    assert.deepEqual(malformed.coverage, { visible_rows: 3, parsed_rows: 0, ignored_rows: 3, complete: false });
    const equal = telemetryRevision.capture(smoke.revisionRoot([
      smoke.revisionRow({ id: "901", date: "25.03.2026, 20:00", author: "Николай Баранов" }),
      smoke.revisionRow({ id: "900", date: "25.03.2026, 20:00", author: "Николай Баранов" }),
    ], true, { id: "35", name: "Николай Баранов" }), capturedAt, origin, fields);
    assert.equal(equal.status, "available");
    assert.equal(equal.latest_visible_revision, null);
    assert.equal(equal.latest_post_author_revision, null);
    assert.deepEqual(equal.ambiguity, {
      reason: "equal-display-timestamps",
      revision_ids: [900, 901],
      latest_post_author_revision: { reason: "equal-display-timestamps", revision_ids: [900, 901] },
    });
    assert.equal(equal.limitations.includes("equal-display-timestamps-ambiguous"), true);
    const idOnly = telemetryRevision.capture(smoke.revisionRoot([
      smoke.revisionRow({ id: "910", date: "25.03.2026, 20:00", author: "Николай Баранов" }),
    ]), capturedAt, origin, fields);
    assert.equal(idOnly.post_author.author_id, 35);
    assert.equal(idOnly.author_match, "unavailable");
    assert.equal(idOnly.latest_post_author_revision, null);
    assert.equal(idOnly.latest_post_author_revision_reason, "dictionary-control-absent");
    const nameOnly = telemetryRevision.capture(smoke.revisionRoot([
      smoke.revisionRow({ id: "911", date: "25.03.2026, 20:00", author: "Николай Баранов" }),
    ], true, { name: "Николай Баранов" }), capturedAt, origin);
    assert.equal(Object.hasOwn(nameOnly.post_author, "author_id"), false);
    assert.equal(nameOnly.author_match, "display-name");
    assert.equal(nameOnly.latest_post_author_revision.revision_id, 911);
    const noIdentity = telemetryRevision.capture(smoke.revisionRoot([
      smoke.revisionRow({ id: "912", date: "25.03.2026, 20:00", author: "Николай Баранов" }),
    ]), capturedAt, origin);
    assert.equal(Object.hasOwn(noIdentity, "post_author"), false);
    assert.equal(noIdentity.latest_post_author_revision, null);
    const noSubstring = telemetryRevision.capture(smoke.revisionRoot([
      smoke.revisionRow({ id: "920", date: "25.03.2026, 20:00", author: "Николай Баранов" }),
    ], true, { id: "35", name: "Николай" }), capturedAt, origin, fields);
    assert.equal(noSubstring.latest_post_author_revision, null);
    assert.equal(noSubstring.latest_post_author_revision_reason, "revision-author-no-match");
    const dictionaryFields = { post_author: [{ value: "220" }] };
    const dictionary = telemetryRevision.capture(smoke.revisionRoot([
      smoke.revisionRow({ id: "930", date: "25.03.2026, 20:00", author: "Варвара Морозова" }),
      smoke.revisionRow({ id: "931", date: "25.03.2026, 20:10", author: "Иван Петров" }),
    ], true, null, [{ id: "220", name: "Варвара Морозова", selected: false }]), capturedAt, origin, dictionaryFields);
    assert.deepEqual(dictionary.post_author, {
      author_id: 220,
      display_name: "Варвара Морозова",
      id_source: "form.post_author",
      display_name_source: "#additional_post_authors option[value=\"220\"]",
    });
    assert.equal(dictionary.author_match, "display-name");
    assert.equal(dictionary.latest_visible_revision.revision_id, 931);
    assert.equal(dictionary.latest_post_author_revision.revision_id, 930);
    assert.equal(dictionary.limitations.includes("additional-authors-id-name-dictionary"), true);
    const dictionaryMissing = telemetryRevision.capture(smoke.revisionRoot([
      smoke.revisionRow({ id: "932", date: "25.03.2026, 20:00", author: "Варвара Морозова" }),
    ], true, null, []), capturedAt, origin, dictionaryFields);
    assert.equal(dictionaryMissing.latest_post_author_revision, null);
    assert.equal(dictionaryMissing.latest_post_author_revision_reason, "author-option-absent");
    const conflict = telemetryRevision.capture(smoke.revisionRoot([
      smoke.revisionRow({ id: "933", date: "25.03.2026, 20:00", author: "Варвара Морозова" }),
    ], true, { id: "35", name: "Николай Баранов" }, [{ id: "220", name: "Варвара Морозова" }]), capturedAt, origin, dictionaryFields);
    assert.deepEqual(conflict.post_author, {
      author_id: 220,
      id_source: "form.post_author",
      id_conflict: true,
      conflicting_author_id: 35,
      conflicting_id_source: "#post_author_override option:checked",
      display_name_reason: "post-author-id-conflict",
    });
    assert.equal(conflict.author_match, "unavailable");
    assert.equal(conflict.latest_post_author_revision, null);
    assert.equal(conflict.latest_post_author_revision_reason, "post-author-id-conflict");
    const fieldConflict = telemetryRevision.capture(smoke.revisionRoot([
      smoke.revisionRow({ id: "938", date: "25.03.2026, 20:00", author: "Варвара Морозова" }),
    ], true, null, [{ id: "220", name: "Варвара Морозова" }]), capturedAt, origin, {
      post_author: [{ value: "220" }],
      post_author_override: [{ value: "35" }],
    });
    assert.equal(fieldConflict.post_author.author_id, 220);
    assert.equal(fieldConflict.post_author.conflicting_author_id, 35);
    assert.equal(fieldConflict.latest_post_author_revision, null);
    assert.equal(fieldConflict.latest_post_author_revision_reason, "post-author-id-conflict");
    const dictionaryNonmatching = telemetryRevision.capture(smoke.revisionRoot([
      smoke.revisionRow({ id: "934", date: "25.03.2026, 20:00", author: "Иван Петров" }),
    ], true, null, [{ id: "220", name: "Варвара Морозова" }]), capturedAt, origin, dictionaryFields);
    assert.equal(dictionaryNonmatching.latest_post_author_revision, null);
    assert.equal(dictionaryNonmatching.latest_post_author_revision_reason, "revision-author-no-match");
    const dictionaryAmbiguous = telemetryRevision.capture(smoke.revisionRoot([
      smoke.revisionRow({ id: "935", date: "25.03.2026, 20:00", author: "Варвара Морозова" }),
    ], true, null, [{ id: "220", name: "Варвара Морозова" }, { id: "220", name: "Варвара Морозова" }]), capturedAt, origin, dictionaryFields);
    assert.equal(dictionaryAmbiguous.latest_post_author_revision, null);
    assert.equal(dictionaryAmbiguous.latest_post_author_revision_reason, "author-option-ambiguous");
    const dictionaryEmpty = telemetryRevision.capture(smoke.revisionRoot([
      smoke.revisionRow({ id: "936", date: "25.03.2026, 20:00", author: "Варвара Морозова" }),
    ], true, null, [{ id: "220", name: "   " }]), capturedAt, origin, dictionaryFields);
    assert.equal(dictionaryEmpty.latest_post_author_revision, null);
    assert.equal(dictionaryEmpty.latest_post_author_revision_reason, "author-option-empty");
    const nameConflict = telemetryRevision.capture(smoke.revisionRoot([
      smoke.revisionRow({ id: "937", date: "25.03.2026, 20:00", author: "Варвара Морозова" }),
    ], true, { id: "220", name: "Другое Имя" }, [{ id: "220", name: "Варвара Морозова" }]), capturedAt, origin, dictionaryFields);
    assert.equal(nameConflict.latest_post_author_revision, null);
    assert.equal(nameConflict.latest_post_author_revision_reason, "post-author-name-conflict");
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
    await smoke.manifest();
    await smoke.revisions();
    await smoke.archive();
    smoke.submitOrder();
    console.log("telemetry foundations smoke: ok");
  },
};

smoke.run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
