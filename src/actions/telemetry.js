import { telemetry } from "../core/telemetry.js";
import { storage } from "../core/storage.js";
import { context } from "../runtime/context.js";
import { cms } from "../core/cms.js";

const STAGES = ["0HF", "1GL", "2NT"];
const TTL = 24 * 60 * 60 * 1000;
const EXCLUDED = /(?:^|[_\[\].-])(?:nonce|token|secret|password|passwd|auth|session|security|csrf|referer|post_lock)(?:$|[_\[\].-])/i;
const SYSTEM = new Set(["_wp_http_referer", "action", "action2", "originalaction", "save", "publish", "submit", "meta-box-order", "closedpostboxesnonce", "active_post_lock", "screenoptionnonce", "_wpnonce", "_wp_http_referer"]);
const OMIT_TYPES = new Set(["submit", "button", "reset", "file", "image"]);

export const createTelemetry = (api = {}, deps = {}) => {
  const postId = () => String(document.querySelector("#post_ID")?.value || new URLSearchParams(location.search).get("post") || "").trim();
  const section = () => location.hostname.split(".")[0].replace(/[^a-z0-9_-]/gi, "_") || "post";
  const enabled = () => telemetry.allow(context.currentUserId()) && /^\d+$/.test(postId());
  const scope = (name) => ({ namespace: "telemetry", origin: location.origin, postId: postId(), sessionId: "active", name });
  const excluded = (name, type) => {
    const normalized = String(name || "").toLowerCase();
    if (!normalized || OMIT_TYPES.has(type)) return "non-data";
    if (SYSTEM.has(normalized) || EXCLUDED.test(normalized) || /nonce$/i.test(normalized) || /(?:authorization|authentication|api[_-]?key|access[_-]?key)/i.test(normalized)) return "sensitive-or-system";
    return "";
  };
  const snapshot = (stage) => {
    cms.editor.syncToTextarea();
    const form = document.querySelector("#post") || document.querySelector("form#post") || document.querySelector("form[action*='post.php']");
    if (!form) throw new Error("WordPress post form unavailable");
    const fields = {};
    const excludedNames = {};
    const nodes = [...form.querySelectorAll("input[name],textarea[name],select[name]")];
    for (const el of nodes) {
      const name = el.name;
      const type = (el.type || el.tagName).toLowerCase();
      const why = excluded(name, type);
      if (why) { excludedNames[name] = why; continue; }
      let value;
      if (type === "checkbox" || type === "radio") value = { value: el.value, checked: Boolean(el.checked) };
      else if (el.tagName.toLowerCase() === "select" && el.multiple) value = [...el.selectedOptions].map((option) => option.value);
      else value = el.value;
      const item = { type, value, disabled: Boolean(el.disabled) };
      if (!fields[name]) fields[name] = [];
      fields[name].push(item);
    }
    return {
      schema: "onliner.post-snapshot/v1",
      meta: { post_id: postId(), section: section(), stage, captured_at: new Date().toISOString(), post_type: document.querySelector("#post_type")?.value || "post", url: location.origin + location.pathname },
      fields,
      coverage: { discovered: nodes.length, included: Object.values(fields).reduce((n, list) => n + list.length, 0), excluded: nodes.length - Object.values(fields).reduce((n, list) => n + list.length, 0), excluded_names: excludedNames, note: "DOM form snapshot, not a complete WordPress database backup" },
    };
  };
  const auditScope = () => scope("audit");
  const auditRead = () => {
    const entry = storage.session.get(auditScope());
    return entry.ok && entry.found && entry.value?.schema === "onliner.audit-telemetry/v1"
      ? entry.value : null;
  };
  const auditWrite = (entry) => {
    const result = storage.session.set(auditScope(), entry, { ttlMs: TTL });
    if (!result.ok) console.warn("[onliner telemetry] audit storage", result.reason);
    return result.ok;
  };
  // Event and run records are append-only. They never change review UI state.
  const auditRecord = (kind, payload = {}) => {
    if (!enabled()) return false;
    try {
      const record = auditRead() || {
        schema: "onliner.audit-telemetry/v1",
        post_id: postId(), section: section(),
        created_at: new Date().toISOString(), runs: [], events: [],
      };
      if (kind === "run") record.runs.push(payload);
      else record.events.push({ id: crypto.randomUUID?.() || `${Date.now()}-${record.events.length}`, at: new Date().toISOString(), type: kind, ...payload });
      return auditWrite(record);
    } catch (error) { console.warn("[onliner telemetry] audit event", error); return false; }
  };
  const capture = (stage) => {
    if (!enabled() || !STAGES.includes(stage)) return false;
    try {
      const data = snapshot(stage);
      if (stage === "0HF") {
        storage.session.remove(scope("1GL"));
        storage.session.remove(scope("2NT"));
        storage.session.remove(auditScope());
      }
      const result = storage.session.set(scope(stage), data, { ttlMs: TTL });
      if (!result.ok) console.warn("[onliner telemetry] storage", stage, result.reason);
      return result.ok;
    } catch (error) { console.warn("[onliner telemetry] capture", stage, error); return false; }
  };
  const exportAtSubmit = async () => {
    if (!enabled()) return false;
    capture("2NT");
    const records = [];
    const missing = [];
    for (const stage of STAGES) {
      const result = storage.session.get(scope(stage));
      if (result.ok && result.found && result.value?.meta?.post_id === postId() && result.value?.meta?.stage === stage) records.push({ stage, value: result.value });
      else missing.push(stage);
    }
    if (!records.length) return false;
    const audit = auditRead();
    const manifest = { schema: "onliner.telemetry-package/v1", post_id: postId(), section: section(), exported_at: new Date().toISOString(), stages: records.map((x) => x.stage), missing, complete: missing.length === 0, trigger: "pre-submit", audit: { present: Boolean(audit), runs: audit?.runs?.length || 0, events: audit?.events?.length || 0 } };
    const files = records.map(({ stage, value }) => deps.textFile(`${section()}-${postId()}-${stage}.json`, JSON.stringify(value, null, 2), "application/json;charset=utf-8"));
    files.push(deps.textFile(`${section()}-${postId()}-manifest.json`, JSON.stringify(manifest, null, 2), "application/json;charset=utf-8"));
    if (audit) files.push(deps.textFile(`${section()}-${postId()}-audit.json`, JSON.stringify(audit, null, 2), "application/json;charset=utf-8"));
    const filename = `${section()}-${postId()}.zip`;
    try {
      const blob = await deps.zipBlob(files, filename, { root: true });
      deps.downloadBlob(filename, blob);
      return true;
    } catch (error) { console.warn("[onliner telemetry] ZIP", error); return false; }
  };
  return { enabled, capture, exportAtSubmit, snapshot, auditRecord };
};
