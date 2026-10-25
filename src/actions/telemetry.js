import { telemetry } from "../core/telemetry.js";
import { storage } from "../core/storage.js";
import { context } from "../runtime/context.js";
import { cms } from "../core/cms.js";

const STAGES = ["0HF", "1GL", "2NT"];
const TTL = 24 * 60 * 60 * 1000;
const ACTIVITY_EVENTS = 500;
const ACTIVITY_CHARACTERS = 128 * 1024;
const ACTIVITY_GROUP_MS = 1500;
const EXCLUDED = /(?:^|[_\[\].-])(?:nonce|token|secret|password|passwd|auth|session|security|csrf|referer|post_lock)(?:$|[_\[\].-])/i;
const SYSTEM = new Set(["_wp_http_referer", "action", "action2", "originalaction", "save", "publish", "submit", "meta-box-order", "closedpostboxesnonce", "active_post_lock", "screenoptionnonce", "_wpnonce", "_wp_http_referer"]);
const OMIT_TYPES = new Set(["submit", "button", "reset", "file", "image"]);

const client = {
  agent(view) { return String(view?.navigator?.userAgent || ""); },
  brands(view) { return Array.isArray(view?.navigator?.userAgentData?.brands) ? view.navigator.userAgentData.brands.map(({ brand }) => String(brand)) : []; },
  browser(view) {
    const brands = client.brands(view);
    if (brands.some((brand) => /Microsoft Edge/i.test(brand))) return "Edge";
    if (brands.some((brand) => /Google Chrome/i.test(brand))) return "Chrome";
    if (brands.some((brand) => /Opera/i.test(brand))) return "Opera";
    if (brands.some((brand) => /^Chromium$/i.test(brand))) return "Chromium";
    const agent = client.agent(view);
    if (/Edg\//i.test(agent)) return "Edge";
    if (/OPR\//i.test(agent)) return "Opera";
    if (/Firefox\//i.test(agent)) return "Firefox";
    if (/(?:Chrome|CriOS)\//i.test(agent)) return "Chrome";
    if (/Safari\//i.test(agent) && /Version\//i.test(agent)) return "Safari";
    return null;
  },
  os(view) {
    const agent = client.agent(view);
    const platform = String(view?.navigator?.userAgentData?.platform || view?.navigator?.platform || "");
    if (/(?:iPhone|iPad|iPod)/i.test(agent)) return "iOS";
    if (/Android/i.test(agent) || /Android/i.test(platform)) return "Android";
    if (/Windows/i.test(agent) || /Windows/i.test(platform)) return "Windows";
    if (/CrOS/i.test(agent) || /Chrome OS/i.test(platform)) return "Chrome OS";
    if (/(?:Macintosh|Mac OS)/i.test(agent) || /macOS|MacIntel/i.test(platform)) return "macOS";
    if (/Linux/i.test(agent) || /Linux/i.test(platform)) return "Linux";
    return null;
  },
  device(view) {
    const agent = client.agent(view);
    if (/iPad|Tablet|Android(?!.*Mobile)/i.test(agent)) return "tablet";
    if (view?.navigator?.userAgentData?.mobile === true || /Mobi|iPhone|iPod|Android.*Mobile/i.test(agent)) return "mobile";
    if (view?.navigator?.userAgentData?.mobile === false) return "desktop";
    if (["Windows", "macOS", "Chrome OS", "Linux"].includes(client.os(view))) return "desktop";
    return "unknown";
  },
  size(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.round(number) : null;
  },
  environment(view, date) {
    return {
      captured_at: date.toISOString(),
      device_type: client.device(view),
      os: client.os(view),
      browser: client.browser(view),
      viewport: { width: client.size(view?.innerWidth), height: client.size(view?.innerHeight) },
    };
  },
};

const telemetryActivity = {
  create({ postId, section, coverage = {} }) {
    return {
      schema: "onliner.activity/v1",
      source: { post_id: postId, section, session_id: "active" },
      coverage: {
        toolbar_commands: "central-dispatcher",
        manual_editing: {
          html_textarea: Boolean(coverage.htmlTextarea),
          visual_editor: Boolean(coverage.visualEditor),
          editorial_fields: [...(coverage.editorialFields || [])],
          trusted_input_only: true,
          grouping_window_ms: ACTIVITY_GROUP_MS,
        },
        audit: "cross-reference-only",
        persistence: coverage.persistence || "sessionStorage",
        limitations: [
          "no-reading-or-idle-time",
          "no-cursor-or-selection-history",
          "no-clipboard-or-text-content",
          "native-editor-input-events-only",
          "trusted-input-during-toolbar-command-omitted",
          "command-completion-is-not-proof-of-text-change",
        ],
      },
      overflow: {
        max_events: ACTIVITY_EVENTS,
        max_serialized_characters: ACTIVITY_CHARACTERS,
        truncated: false,
        dropped_events: 0,
        reasons: [],
      },
      events: [],
    };
  },
  trusted(event) {
    return event?.isTrusted === true;
  },
  command: {
    run(execute, hooks = {}) {
      const notify = (name) => {
        try { hooks[name]?.(); }
        catch (error) { console.warn("[onliner telemetry] activity command", name, error); }
      };
      try {
        const result = execute();
        if (!result || typeof result.then !== "function") {
          notify("complete");
          return result;
        }
        return result.then(
          (value) => { notify("complete"); return value; },
          (error) => { notify("fail"); throw error; },
        );
      } catch (error) {
        notify("fail");
        throw error;
      }
    },
  },
  classify(inputType = "") {
    const value = String(inputType || "");
    if (value === "historyUndo") return "undo";
    if (value === "historyRedo") return "redo";
    if (value === "insertFromPaste" || value === "insertFromDrop") return "paste";
    if (value === "insertReplacementText") return "replace";
    if (value.startsWith("delete")) return "delete";
    if (value.startsWith("format")) return "format";
    if (value.startsWith("insert")) return "insert";
    return "unknown";
  },
  manual({ id, at, source, inputType, beforeLength, afterLength, stage }) {
    const operation = telemetryActivity.classify(inputType);
    const delta = Number(afterLength) - Number(beforeLength);
    const measurable = Number.isFinite(delta);
    const effect = measurable ? {
      net_characters: delta,
      ...(delta > 0 && ["insert", "paste"].includes(operation) ? { added_characters: delta } : {}),
      ...(delta < 0 && operation === "delete" ? { removed_characters: Math.abs(delta) } : {}),
    } : {};
    return {
      id,
      type: "manual",
      source,
      operation,
      input_type: String(inputType || "unknown"),
      started_at: at,
      completed_at: at,
      operations: 1,
      stage,
      ...(Object.keys(effect).length ? { effect } : {}),
    };
  },
  coalesce(current, next, gapMs) {
    const grouped = ["insert", "delete"].includes(next?.operation) &&
      current?.type === "manual" && current.source === next.source &&
      current.operation === next.operation && current.input_type === next.input_type &&
      Number.isFinite(gapMs) && gapMs >= 0 && gapMs <= ACTIVITY_GROUP_MS;
    if (!grouped) return null;
    const effect = {
      net_characters: Number(current.effect?.net_characters || 0) + Number(next.effect?.net_characters || 0),
      ...(current.effect?.added_characters !== undefined || next.effect?.added_characters !== undefined
        ? { added_characters: Number(current.effect?.added_characters || 0) + Number(next.effect?.added_characters || 0) }
        : {}),
      ...(current.effect?.removed_characters !== undefined || next.effect?.removed_characters !== undefined
        ? { removed_characters: Number(current.effect?.removed_characters || 0) + Number(next.effect?.removed_characters || 0) }
        : {}),
    };
    return { ...current, completed_at: next.completed_at, operations: current.operations + 1, effect };
  },
  limit(record, limits = {}) {
    const maxEvents = Number(limits.maxEvents) || ACTIVITY_EVENTS;
    const maxCharacters = Number(limits.maxCharacters) || ACTIVITY_CHARACTERS;
    const events = [...(record?.events || [])];
    const reasons = new Set(record?.overflow?.reasons || []);
    let dropped = Number(record?.overflow?.dropped_events || 0);
    while (events.length > maxEvents) {
      events.shift();
      dropped += 1;
      reasons.add("event-count");
    }
    while (events.length && JSON.stringify({ ...record, events }).length > maxCharacters) {
      events.shift();
      dropped += 1;
      reasons.add("serialized-size");
    }
    return {
      ...record,
      overflow: {
        ...record.overflow,
        max_events: maxEvents,
        max_serialized_characters: maxCharacters,
        truncated: dropped > 0,
        dropped_events: dropped,
        reasons: [...reasons],
      },
      events,
    };
  },
  append(record, event, limits = {}) {
    return telemetryActivity.limit({ ...record, events: [...record.events, event] }, limits);
  },
  replace(record, id, event) {
    const index = record.events.findIndex((value) => value.id === id);
    if (index < 0) return telemetryActivity.append(record, event);
    return telemetryActivity.limit({ ...record, events: record.events.map((value, position) => position === index ? event : value) });
  },
};

const telemetryArchive = {
  signature({ records, audit, activity, revisionProvenance }) {
    return JSON.stringify({
      records: records.map(({ stage, value }) => ({
        stage,
        value: { ...value, meta: { ...value.meta, captured_at: null } },
      })),
      audit,
      activity: activity ? { ...activity, exported_at: null, events: activity.events.filter((event) => event.command_id !== "submit.save") } : null,
      revision_provenance: revisionProvenance,
    });
  },
  manifest({ postId, section, records, missing, audit, activity, revisionProvenance, view, date }) {
    return {
      schema: "onliner.telemetry-package/v1",
      post_id: postId,
      section,
      exported_at: date.toISOString(),
      stages: records.map(({ stage }) => stage),
      missing,
      complete: missing.length === 0,
      trigger: "pre-submit",
      audit: { present: Boolean(audit), runs: audit?.runs?.length || 0, events: audit?.events?.length || 0 },
      activity: { present: Boolean(activity), events: activity?.events?.length || 0, truncated: Boolean(activity?.overflow?.truncated) },
      environment: client.environment(view, date),
      ...(revisionProvenance ? { revision_provenance: revisionProvenance } : {}),
    };
  },
};

const telemetryRevision = {
  integer(value) {
    const number = Number(value);
    return Number.isSafeInteger(number) && number > 0 ? number : null;
  },
  date(value) {
    const displayedAt = String(value || "").replace(/\s+/g, " ").trim();
    const match = displayedAt.match(/^(\d{2})\.(\d{2})\.(\d{4}),\s*(\d{2}):(\d{2})$/);
    if (!match) return null;
    const [, day, month, year, hour, minute] = match;
    const stamp = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    const check = new Date(stamp);
    if (check.getUTCFullYear() !== Number(year) || check.getUTCMonth() !== Number(month) - 1 || check.getUTCDate() !== Number(day) || check.getUTCHours() !== Number(hour) || check.getUTCMinutes() !== Number(minute)) return null;
    return { displayed_at: displayedAt, local_date: `${year}-${month}-${day}`, local_time: `${hour}:${minute}`, timezone: "unknown", precision: "minute", order: Number(`${year}${month}${day}${hour}${minute}`) };
  },
  id(value, origin = "") {
    try {
      return telemetryRevision.integer(new URL(value, origin).searchParams.get("revision"));
    } catch {
      return null;
    }
  },
  row(item, origin = "") {
    const link = item?.querySelector?.('a[href*="revision="]');
    const revisionId = telemetryRevision.id(link?.href || link?.getAttribute?.("href"), origin);
    const timestamp = telemetryRevision.date(link?.textContent);
    const text = String(item?.textContent || "").replace(/\s+/g, " ").trim();
    const author = text.replace(timestamp?.displayed_at || "", "").trim().replace(/^автора\s+/iu, "").trim();
    if (!revisionId || !timestamp || !author) return null;
    return {
      revision_id: revisionId,
      displayed_at: timestamp.displayed_at,
      local_date: timestamp.local_date,
      local_time: timestamp.local_time,
      timezone: timestamp.timezone,
      precision: timestamp.precision,
      author_display_name: author,
      order: timestamp.order,
    };
  },
  normalize(value) {
    return String(value || "").normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
  },
  postAuthor(root, fields = {}) {
    const fieldId = telemetryRevision.integer(fields.post_author?.[0]?.value);
    const fallbackFieldId = telemetryRevision.integer(fields.post_author_override?.[0]?.value);
    const select = root?.querySelector?.("#post_author_override");
    const option = select?.selectedOptions?.[0] || select?.querySelector?.("option:checked");
    const selectId = telemetryRevision.integer(option?.value);
    const identities = [
      { id: fieldId, source: "form.post_author" },
      { id: fallbackFieldId, source: "form.post_author_override" },
      { id: selectId, source: "#post_author_override option:checked" },
    ].filter(({ id }) => id);
    const primary = identities[0] || null;
    const conflict = identities.find(({ id }) => id !== primary?.id) || null;
    if (conflict) return { author_id: primary.id, id_source: primary.source, id_conflict: true, conflicting_author_id: conflict.id, conflicting_id_source: conflict.source, display_name_reason: "post-author-id-conflict" };
    const authorId = primary?.id || null;
    const optionName = String(option?.textContent || "").replace(/\s+/g, " ").trim();
    const dictionary = authorId ? root?.querySelector?.("#additional_post_authors") : null;
    const dictionaryOptions = dictionary ? [...dictionary.querySelectorAll(`option[value="${authorId}"]`)] : [];
    const dictionaryName = dictionaryOptions.length === 1 ? String(dictionaryOptions[0]?.textContent || "").replace(/\s+/g, " ").trim() : "";
    const dictionarySource = `#additional_post_authors option[value="${authorId}"]`;
    const names = [
      { value: optionName, source: "#post_author_override option:checked" },
      { value: dictionaryName, source: dictionarySource },
    ].filter(({ value }) => value);
    const nameConflict = names.length > 1 && telemetryRevision.normalize(names[0].value) !== telemetryRevision.normalize(names[1].value);
    const displayName = nameConflict || dictionaryOptions.length > 1 ? "" : names[0]?.value || "";
    const displayNameSource = displayName ? names[0].source : "";
    const displayNameReason = [
      [!displayName && !authorId, "post-author-id-unavailable"],
      [nameConflict, "post-author-name-conflict"],
      [dictionaryOptions.length > 1, "author-option-ambiguous"],
      [!displayName && !dictionary, "dictionary-control-absent"],
      [!displayName && dictionaryOptions.length === 1, "author-option-empty"],
      [!displayName, "author-option-absent"],
    ].find(([matches]) => matches)?.[1] || "";
    if (!authorId && !displayName) return null;
    return {
      ...(authorId ? { author_id: authorId } : {}),
      ...(displayName ? { display_name: displayName } : {}),
      ...(authorId ? { id_source: primary.source } : {}),
      ...(displayNameSource ? { display_name_source: displayNameSource } : {}),
      ...(names.length > 1 && !nameConflict ? { corroborating_display_name_source: names[1].source } : {}),
      ...(nameConflict ? { conflicting_display_name_sources: names.map(({ source }) => source) } : {}),
      ...(displayNameReason ? { display_name_reason: displayNameReason } : {}),
    };
  },
  select(records) {
    const sorted = [...records].sort((left, right) => right.order - left.order);
    if (!sorted.length) return { value: null, ambiguous: [] };
    const matches = sorted.filter((record) => record.order === sorted[0].order);
    if (matches.length !== 1) return { value: null, ambiguous: matches.map(({ revision_id: revisionId }) => revisionId).sort((left, right) => left - right) };
    const { order, ...value } = matches[0];
    return { value, ambiguous: [] };
  },
  capture(root, capturedAt, origin = "", fields = {}) {
    const list = root?.querySelector?.("ul.post-revisions");
    const base = { schema: "onliner.revision-provenance/v1", captured_at: capturedAt, capture_point: "0HF", source: "wp-admin-dom" };
    const limitations = ["visible-dom-rows-only", "history-may-be-truncated", "display-timezone-unknown", "not-editorial-handoff", "revision-author-id-unavailable"];
    const postAuthor = telemetryRevision.postAuthor(root, fields);
    const authorName = telemetryRevision.normalize(postAuthor?.display_name);
    const author = {
      ...(postAuthor ? { post_author: postAuthor } : {}),
      author_match: authorName ? "display-name" : "unavailable",
    };
    if (!list) return { ...base, ...author, status: "not_available", reason: "revision-list-absent", latest_post_author_revision: null, latest_post_author_revision_reason: "revision-list-absent", coverage: { visible_rows: 0, parsed_rows: 0, ignored_rows: 0, complete: false }, limitations };
    const rows = [...list.querySelectorAll(":scope > li")];
    const records = rows.map((item) => telemetryRevision.row(item, origin)).filter(Boolean);
    const latest = telemetryRevision.select(records);
    const authorRecords = authorName
      ? records.filter((record) => telemetryRevision.normalize(record.author_display_name) === authorName)
      : [];
    const latestPostAuthor = telemetryRevision.select(authorRecords);
    const postAuthorReason = [
      [!records.length && rows.length, "no-parseable-rows"],
      [!records.length, "revision-list-empty"],
      [!authorName, postAuthor?.display_name_reason || "post-author-display-name-unavailable"],
      [Boolean(latestPostAuthor.ambiguous.length), "equal-display-timestamps"],
      [!latestPostAuthor.value, "revision-author-no-match"],
    ].find(([matches]) => matches)?.[1] || "";
    if (rows.length !== records.length) limitations.push("unparseable-rows-ignored");
    if (latest.ambiguous.length) limitations.push("equal-display-timestamps-ambiguous");
    if (authorName) limitations.push("author-match-display-name");
    else limitations.push("post-author-display-name-unavailable");
    if (postAuthor?.id_conflict) limitations.push("post-author-id-conflict");
    if (postAuthor?.display_name_reason && !limitations.includes(postAuthor.display_name_reason)) limitations.push(postAuthor.display_name_reason);
    if (postAuthor?.display_name_source?.startsWith("#additional_post_authors ")) limitations.push("additional-authors-id-name-dictionary");
    if (latestPostAuthor.ambiguous.length) limitations.push("post-author-equal-display-timestamps-ambiguous");
    const ambiguity = {
      ...(latest.ambiguous.length ? { reason: "equal-display-timestamps", revision_ids: latest.ambiguous } : {}),
      ...(latestPostAuthor.ambiguous.length ? { latest_post_author_revision: { reason: "equal-display-timestamps", revision_ids: latestPostAuthor.ambiguous } } : {}),
    };
    return {
      ...base,
      status: records.length ? "available" : "unparseable",
      ...(records.length ? {} : { reason: rows.length ? "no-parseable-rows" : "revision-list-empty" }),
      latest_visible_revision: latest.value,
      ...author,
      latest_post_author_revision: latestPostAuthor.value,
      ...(postAuthorReason ? { latest_post_author_revision_reason: postAuthorReason } : {}),
      ...(Object.keys(ambiguity).length ? { ambiguity } : {}),
      coverage: { visible_rows: rows.length, parsed_rows: records.length, ignored_rows: rows.length - records.length, complete: false },
      limitations,
    };
  },
};

export const createTelemetry = (api = {}, deps = {}) => {
  let exportedSignature = "";
  let activityState = null;
  let activityTimer = 0;
  let activityGroup = null;
  let activityBound = false;
  let activityCurrentStage = "";
  const activityBefore = new WeakMap();
  const activityEditors = new WeakSet();
  const activityCommands = new Set();
  const activityCoverage = { htmlTextarea: false, visualEditor: false, editorialFields: [], persistence: "sessionStorage" };
  const postId = () => String(document.querySelector("#post_ID")?.value || new URLSearchParams(location.search).get("post") || "").trim();
  const section = () => location.hostname.split(".")[0].replace(/[^a-z0-9_-]/gi, "_") || "post";
  const enabled = () => telemetry.allow(context.currentUserId()) && /^\d+$/.test(postId());
  const scope = (name) => ({ namespace: "telemetry", origin: location.origin, postId: postId(), sessionId: "active", name });
  const activityScope = () => scope("activity");
  const activityCreate = () => telemetryActivity.create({ postId: postId(), section: section(), coverage: activityCoverage });
  const activityRead = () => {
    if (activityState) return activityState;
    const result = storage.session.get(activityScope());
    if (result.ok && result.found && result.value?.schema === "onliner.activity/v1" && result.value?.source?.post_id === postId()) {
      activityState = result.value;
      return activityState;
    }
    if (!result.ok) activityCoverage.persistence = `unavailable:${result.reason}`;
    activityState = activityCreate();
    return activityState;
  };
  const activityWrite = () => {
    if (!activityState) return true;
    if (activityTimer) clearTimeout(activityTimer);
    activityTimer = 0;
    const result = storage.session.set(activityScope(), activityState, { ttlMs: TTL });
    if (result.ok) return true;
    activityCoverage.persistence = `unavailable:${result.reason}`;
    activityState = {
      ...activityState,
      coverage: { ...activityState.coverage, persistence: activityCoverage.persistence },
    };
    console.warn("[onliner telemetry] activity storage", result.reason);
    return false;
  };
  const activitySave = () => {
    if (activityTimer) clearTimeout(activityTimer);
    activityTimer = setTimeout(activityWrite, 200);
    return true;
  };
  const activitySyncCoverage = () => {
    const record = activityRead();
    activityState = {
      ...record,
      coverage: {
        ...record.coverage,
        manual_editing: {
          ...record.coverage.manual_editing,
          html_textarea: activityCoverage.htmlTextarea,
          visual_editor: activityCoverage.visualEditor,
          editorial_fields: [...activityCoverage.editorialFields],
        },
      },
    };
    return activityWrite();
  };
  const activityStage = () => {
    if (activityCurrentStage) return activityCurrentStage;
    activityCurrentStage = [...STAGES].reverse().find((stage) => {
      const result = storage.session.get(scope(stage));
      return result.ok && result.found;
    }) || "pre-0HF";
    return activityCurrentStage;
  };
  const activityId = (prefix) => crypto.randomUUID?.() || `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const activityAppend = (event, deferred = false) => {
    activityState = telemetryActivity.append(activityRead(), event);
    return deferred ? activitySave() : activityWrite();
  };
  const activityReplace = (id, event, deferred = false) => {
    activityState = telemetryActivity.replace(activityRead(), id, event);
    return deferred ? activitySave() : activityWrite();
  };
  const activityCommand = {
    run(id, execute) {
      if (!enabled() || typeof execute !== "function") return execute?.();
      const startedAt = new Date().toISOString();
      const startedMono = globalThis.performance?.now?.() ?? Date.now();
      const event = { id: activityId("command"), type: "command", command_id: String(id || "unknown"), status: "started", started_at: startedAt, stage: activityStage() };
      activityCommands.add(event.id);
      try { activityAppend(event); }
      catch (error) { console.warn("[onliner telemetry] activity command", "start", error); }
      const finish = (status) => {
        activityCommands.delete(event.id);
        const completedMono = globalThis.performance?.now?.() ?? Date.now();
        const completed = {
          ...event,
          status,
          completed_at: new Date().toISOString(),
          duration_ms: Math.max(0, Math.round(completedMono - startedMono)),
          completed_stage: activityStage(),
        };
        try { activityReplace(event.id, completed); }
        catch (error) { console.warn("[onliner telemetry] activity command", status, error); }
      };
      return telemetryActivity.command.run(execute, {
        complete: () => finish("completed"),
        fail: () => finish("failed"),
      });
    },
  };
  const activityAudit = (kind, payload, auditEvent) => {
    if (!["suggestion.decision", "suggestion.undo"].includes(kind)) return true;
    const decisionId = String(payload?.decision?.id || payload?.decision_id || "");
    if (!decisionId) return false;
    const action = kind === "suggestion.undo" ? "undo" : String(payload?.decision?.outcome || "unknown");
    return activityAppend({
      id: activityId("audit"),
      type: "audit",
      action,
      at: auditEvent.at,
      stage: activityStage(),
      audit_event_id: auditEvent.id,
      run_id: String(payload?.run_id || ""),
      decision_id: decisionId,
    });
  };
  const activityManual = {
    length(target, source) {
      return source === "tinymce-contenteditable" ? String(target?.textContent || "").length : String(target?.value || "").length;
    },
    before(event, target, source) {
      if (!telemetryActivity.trusted(event)) return;
      activityBefore.set(target, { inputType: event.inputType || "", length: activityManual.length(target, source) });
    },
    input(event, target, source) {
      if (!telemetryActivity.trusted(event)) return;
      const before = activityBefore.get(target) || {};
      activityBefore.delete(target);
      if (activityCommands.size) return;
      const now = globalThis.performance?.now?.() ?? Date.now();
      const next = telemetryActivity.manual({
        id: activityId("manual"),
        at: new Date().toISOString(),
        source,
        inputType: event.inputType || before.inputType,
        beforeLength: before.length,
        afterLength: activityManual.length(target, source),
        stage: activityStage(),
      });
      const current = activityGroup ? activityRead().events.find((value) => value.id === activityGroup.id) : null;
      const merged = telemetryActivity.coalesce(current, next, now - Number(activityGroup?.endedAt));
      if (merged) activityReplace(current.id, merged, true);
      else activityAppend(next, true);
      activityGroup = { id: merged?.id || next.id, endedAt: now };
    },
    bind(target, source, root = target) {
      if (!target || activityEditors.has(target)) return false;
      activityEditors.add(target);
      target.addEventListener("beforeinput", (event) => activityManual.before(event, root, source), true);
      target.addEventListener("input", (event) => activityManual.input(event, root, source), true);
      return true;
    },
  };
  const activityBind = () => {
    if (!enabled()) return false;
    const textarea = document.querySelector("#content");
    if (textarea && activityManual.bind(textarea, "wordpress-textarea")) activityCoverage.htmlTextarea = true;
    const bindFields = () => {
      const fields = [
        { selector: "#title", source: "wordpress-title" },
        { selector: '#excerpt,textarea[name="excerpt"]', source: "wordpress-excerpt" },
        { selector: 'input[name="post_name"],#post_name,#new-post-slug', source: "wordpress-slug" },
        { selector: 'input[name="seo_title"]', source: "wordpress-seo-title" },
      ];
      let changed = false;
      fields.forEach(({ selector, source }) => {
        document.querySelectorAll(selector).forEach((field) => {
          if (!activityManual.bind(field, source)) return;
          if (!activityCoverage.editorialFields.includes(source)) activityCoverage.editorialFields.push(source);
          changed = true;
        });
      });
      return changed;
    };
    const bindVisual = () => {
      const editor = window.tinyMCE?.get?.("content") || window.tinymce?.get?.("content") || null;
      const doc = editor?.getDoc?.() || null;
      const body = editor?.getBody?.() || doc?.body || null;
      if (!doc || !body || !activityManual.bind(doc, "tinymce-contenteditable", body)) return false;
      activityCoverage.visualEditor = true;
      return true;
    };
    const sync = () => {
      const fieldsChanged = bindFields();
      const visualChanged = bindVisual();
      return (fieldsChanged || visualChanged) ? activitySyncCoverage() : false;
    };
    if (activityBound) return sync() || true;
    activityBound = true;
    activityState = activityRead();
    bindFields();
    bindVisual();
    document.addEventListener("focusin", sync, true);
    window.addEventListener("pagehide", activityWrite, true);
    return activitySyncCoverage();
  };
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
  const revisionScope = () => scope("revision-provenance");
  const revisionRead = () => {
    const entry = storage.session.get(revisionScope());
    return entry.ok && entry.found && entry.value?.schema === "onliner.revision-provenance/v1"
      ? entry.value : null;
  };
  const revisionWrite = (entry) => {
    const result = storage.session.set(revisionScope(), entry, { ttlMs: TTL });
    if (!result.ok) console.warn("[onliner telemetry] revision storage", result.reason);
    return result.ok;
  };
  const revisionCapture = (data) => {
    return revisionWrite(telemetryRevision.capture(document, data.meta.captured_at, location.origin, data.fields));
  };
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
      const event = kind === "run" ? null : { id: crypto.randomUUID?.() || `${Date.now()}-${record.events.length}`, at: new Date().toISOString(), type: kind, ...payload };
      if (event) record.events.push(event);
      const written = auditWrite(record);
      if (written && event) {
        try { activityAudit(kind, payload, event); }
        catch (error) { console.warn("[onliner telemetry] activity audit", error); }
      }
      return written;
    } catch (error) { console.warn("[onliner telemetry] audit event", error); return false; }
  };
  const capture = (stage) => {
    if (!enabled() || !STAGES.includes(stage)) return false;
    try {
      const data = snapshot(stage);
      if (stage === "0HF") {
        exportedSignature = "";
        storage.session.remove(scope("1GL"));
        storage.session.remove(scope("2NT"));
        storage.session.remove(auditScope());
        storage.session.remove(revisionScope());
      }
      const result = storage.session.set(scope(stage), data, { ttlMs: TTL });
      if (!result.ok) console.warn("[onliner telemetry] storage", stage, result.reason);
      if (result.ok) activityCurrentStage = stage;
      if (result.ok && stage === "0HF") revisionCapture(data);
      return result.ok;
    } catch (error) { console.warn("[onliner telemetry] capture", stage, error); return false; }
  };
  const exportAtSubmit = async () => {
    if (!enabled()) return null;
    if (!capture("2NT")) return false;
    const records = [];
    const missing = [];
    for (const stage of STAGES) {
      const result = storage.session.get(scope(stage));
      if (result.ok && result.found && result.value?.meta?.post_id === postId() && result.value?.meta?.stage === stage) records.push({ stage, value: result.value });
      else missing.push(stage);
    }
    if (!records.length) return false;
    const audit = auditRead();
    activityWrite();
    const activity = { ...activityRead(), exported_at: new Date().toISOString() };
    const revisionProvenance = revisionRead();
    const signature = telemetryArchive.signature({ records, audit, activity, revisionProvenance });
    if (signature === exportedSignature) return true;
    const manifest = telemetryArchive.manifest({ postId: postId(), section: section(), records, missing, audit, activity, revisionProvenance, view: window, date: new Date() });
    const files = records.map(({ stage, value }) => deps.textFile(`${section()}-${postId()}-${stage}.json`, JSON.stringify(value, null, 2), "application/json;charset=utf-8"));
    files.push(deps.textFile(`${section()}-${postId()}-manifest.json`, JSON.stringify(manifest, null, 2), "application/json;charset=utf-8"));
    if (audit) files.push(deps.textFile(`${section()}-${postId()}-audit.json`, JSON.stringify(audit, null, 2), "application/json;charset=utf-8"));
    files.push(deps.textFile(`${section()}-${postId()}-activity.json`, JSON.stringify(activity, null, 2), "application/json;charset=utf-8"));
    const filename = `${section()}-${postId()}.zip`;
    try {
      const blob = await deps.zipBlob(files, filename, { root: true });
      deps.downloadBlob(filename, blob);
      await new Promise((resolve) => setTimeout(resolve, 150));
      exportedSignature = signature;
      return true;
    } catch (error) { console.warn("[onliner telemetry] ZIP", error); return false; }
  };
  const resetExport = () => {
    exportedSignature = "";
    return true;
  };
  return {
    enabled,
    capture,
    exportAtSubmit,
    resetExport,
    snapshot,
    auditRecord,
    activity: { bind: activityBind, command: activityCommand },
  };
};

export { telemetryActivity, telemetryArchive, telemetryRevision };
