const session = {
  prefix: "onliner",
  version: 1,
  scope(value = {}) {
    return {
      namespace: String(value.namespace || "").trim(),
      origin: String(value.origin || globalThis.location?.origin || "").trim(),
      postId: String(value.postId || "").trim(),
      sessionId: String(value.sessionId || "").trim(),
      name: String(value.name || "").trim(),
    };
  },
  key(value = {}) {
    const scope = session.scope(value);
    if (Object.values(scope).some((item) => !item)) return "";
    return [
      session.prefix,
      scope.namespace,
      scope.origin,
      `post:${scope.postId}`,
      `session:${scope.sessionId}`,
      scope.name,
    ]
      .map(encodeURIComponent)
      .join(":");
  },
  storage(options = {}) {
    if (Object.prototype.hasOwnProperty.call(options, "storage")) {
      return options.storage;
    }
    try {
      return globalThis.sessionStorage || null;
    } catch {
      return null;
    }
  },
  reason(error, fallback = "storage") {
    return /quota/i.test(String(error?.name || "")) ? "quota" : fallback;
  },
  discard(storage, key) {
    try {
      storage?.removeItem?.(key);
      return true;
    } catch {
      return false;
    }
  },
  get(value = {}, options = {}) {
    const key = session.key(value);
    if (!key) {
      return { ok: false, found: false, key, reason: "scope", value: null };
    }
    const storage = session.storage(options);
    if (!storage) {
      return { ok: false, found: false, key, reason: "unavailable", value: null };
    }
    let raw = "";
    try {
      raw = storage.getItem(key);
    } catch (error) {
      return {
        ok: false,
        found: false,
        key,
        reason: session.reason(error, "read"),
        value: null,
      };
    }
    if (!raw) {
      return { ok: true, found: false, key, reason: "missing", value: null };
    }
    let record = null;
    try {
      record = JSON.parse(raw);
    } catch {
      session.discard(storage, key);
      return { ok: false, found: false, key, reason: "malformed", value: null };
    }
    if (
      record?.version !== session.version ||
      !Number.isFinite(record.createdAt) ||
      !Number.isFinite(record.expiresAt) ||
      !Object.prototype.hasOwnProperty.call(record, "value")
    ) {
      session.discard(storage, key);
      return { ok: false, found: false, key, reason: "malformed", value: null };
    }
    const now = Number.isFinite(options.now) ? options.now : Date.now();
    if (record.expiresAt > 0 && record.expiresAt <= now) {
      session.discard(storage, key);
      return { ok: true, found: false, key, reason: "stale", value: null };
    }
    return { ok: true, found: true, key, reason: "", value: record.value };
  },
  set(value = {}, data = null, options = {}) {
    const key = session.key(value);
    if (!key) return { ok: false, key, reason: "scope" };
    if (data === undefined) return { ok: false, key, reason: "serialize" };
    const storage = session.storage(options);
    if (!storage) return { ok: false, key, reason: "unavailable" };
    const now = Number.isFinite(options.now) ? options.now : Date.now();
    const ttlMs = Number.isFinite(options.ttlMs) && options.ttlMs > 0
      ? options.ttlMs
      : 0;
    let raw = "";
    try {
      raw = JSON.stringify({
        version: session.version,
        createdAt: now,
        expiresAt: ttlMs ? now + ttlMs : 0,
        value: data,
      });
    } catch {
      return { ok: false, key, reason: "serialize" };
    }
    try {
      storage.setItem(key, raw);
      return { ok: true, key, reason: "" };
    } catch (error) {
      return { ok: false, key, reason: session.reason(error, "write") };
    }
  },
  remove(value = {}, options = {}) {
    const key = session.key(value);
    if (!key) return { ok: false, key, reason: "scope" };
    const storage = session.storage(options);
    if (!storage) return { ok: false, key, reason: "unavailable" };
    try {
      storage.removeItem(key);
      return { ok: true, key, reason: "" };
    } catch (error) {
      return { ok: false, key, reason: session.reason(error, "remove") };
    }
  },
};

const storage = {
  session,
};

export { storage };
