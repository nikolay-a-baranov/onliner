const MAX_EVENTS = 240;
const MAX_CODEPOINTS = 24;

export const createEcho = (api) => {
  const state = {
    enabled: false,
    started: "",
    events: [],
    dropped: 0,
    listeners: [],
    editorDocument: null,
    notice: null,
    pendingReport: null,
  };
  const mode = () => api.editor?.mode?.() || "unknown";
  const tiny = () => window.tinyMCE?.get?.("content") || window.tinymce?.get?.("content") || null;
  const sample = (value) => Array.from(String(value ?? "")).slice(0, MAX_CODEPOINTS).map((char) => char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0"));
  const digest = (value) => {
    let hash = 2166136261;
    const string = String(value ?? "");
    for (let index = 0; index < string.length; index += 1) {
      hash ^= string.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return { length: string.length, hash: (hash >>> 0).toString(16).padStart(8, "0") };
  };
  const snapshot = () => {
    const field = document.getElementById("content");
    const editor = tiny();
    let visual = null;
    try { visual = editor?.getContent?.({ format: "raw" }); }
    catch (error) { visual = null; }
    return { textarea: digest(field?.value || ""), visual: visual === null || visual === undefined ? null : digest(visual) };
  };
  const selection = (kind) => {
    if (kind === "html") {
      const element = document.getElementById("content");
      if (!element) return null;
      return { start: element.selectionStart, end: element.selectionEnd, selectedLength: Math.max(0, element.selectionEnd - element.selectionStart), selectedCodes: sample((element.value || "").slice(element.selectionStart, element.selectionEnd)) };
    }
    try {
      const current = tiny();
      const range = current?.selection?.getRng?.();
      if (!range) return null;
      return { collapsed: range.collapsed, startOffset: range.startOffset, endOffset: range.endOffset, sameNode: range.startContainer === range.endContainer, selectedCodes: sample(current.selection.getContent({ format: "text" })) };
    } catch (error) { return null; }
  };
  const record = (type, event, kind) => {
    if (!state.enabled) return;
    const entry = {
      time: new Date().toISOString(),
      source: kind,
      event: type,
      trusted: event?.isTrusted === true,
      inputType: event?.inputType || null,
      composing: Boolean(event?.isComposing),
      dataCodes: event?.data == null ? null : sample(event.data),
      selection: selection(kind),
      content: snapshot(),
    };
    if (state.events.length >= MAX_EVENTS) { state.events.shift(); state.dropped += 1; }
    state.events.push(entry);
  };
  const listen = (target, type, handler) => {
    if (!target?.addEventListener) return;
    target.addEventListener(type, handler, true);
    state.listeners.push(() => target.removeEventListener(type, handler, true));
  };
  const bindEditor = () => {
    const field = document.getElementById("content");
    if (field && field.dataset.echoDiagnosticBound !== "1") {
      field.dataset.echoDiagnosticBound = "1";
      const cleanup = () => delete field.dataset.echoDiagnosticBound;
      state.listeners.push(cleanup);
      for (const type of ["beforeinput", "input", "change", "compositionstart", "compositionend", "paste", "cut", "keydown", "keyup"]) {
        listen(field, type, (event) => record(type, event, "html"));
      }
    }
    const editor = tiny();
    const doc = editor?.getDoc?.();
    if (!doc || doc === state.editorDocument) return;
    state.editorDocument = doc;
    for (const type of ["beforeinput", "input", "change", "compositionstart", "compositionend", "paste", "cut", "keydown", "keyup"]) {
      listen(doc, type, (event) => record(type, event, "visual"));
    }
  };
  const unbind = () => {
    for (const dispose of state.listeners.reverse()) dispose();
    state.listeners = [];
    state.editorDocument = null;
  };
  const exportReport = () => JSON.stringify({ schema: "onliner.echo-diagnostic/v1", started: state.started, exported: new Date().toISOString(), mode: mode(), dropped: state.dropped, samplesLimitedToCodepoints: MAX_CODEPOINTS, events: state.events }, null, 2);
  const notice = (message, retry = false) => {
    state.notice?.remove();
    const root = document.createElement("div");
    root.id = "onliner-echo-notice";
    root.dataset.uiOverlay = "true";
    root.setAttribute("role", "status");
    root.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:2147483000;padding:10px 14px;background:#222;color:#fff;border-radius:8px;font:13px/1.4 Arial,sans-serif;box-shadow:0 4px 18px #0003";
    const label = document.createElement("span");
    label.textContent = message;
    root.append(label);
    if (retry) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Повторить копирование";
      button.style.cssText = "margin-left:12px;padding:4px 8px;cursor:pointer";
      button.addEventListener("click", () => { void copy(); });
      root.append(button);
    }
    document.body.append(root);
    state.notice = root;
    if (!retry) {
      window.setTimeout(() => {
        if (state.notice !== root) return;
        root.remove();
        state.notice = null;
      }, 3500);
    }
  };
  const copy = async () => {
    const report = state.pendingReport;
    if (!report) return false;
    let success = false;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(report);
      success = true;
    } catch (error) {
      const field = document.createElement("textarea");
      field.value = report;
      field.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.append(field);
      field.focus();
      field.select();
      try { success = document.execCommand("copy"); }
      catch (copyError) { success = false; }
      field.remove();
    }
    if (success) {
      state.pendingReport = null;
      notice("Echo: отчёт скопирован");
    } else {
      notice("Echo: не удалось скопировать отчёт", true);
    }
    return success;
  };
  const stop = () => {
    state.enabled = false;
    unbind();
    state.pendingReport = exportReport();
    return copy();
  };
  const start = () => {
    if (!document.getElementById("content")) return false;
    state.enabled = true;
    state.started = new Date().toISOString();
    state.events = [];
    state.dropped = 0;
    state.pendingReport = null;
    state.notice?.remove();
    state.notice = null;
    bindEditor();
    listen(document, "focusin", () => bindEditor());
    listen(document, "click", (event) => {
      if (event.target?.closest?.("#content-tmce, #content-html")) {
        window.setTimeout(() => { if (state.enabled) bindEditor(); }, 100);
      }
    });
    notice("Echo: запись запущена");
    return true;
  };
  return { echo: { run() { return state.enabled ? stop() : state.pendingReport ? copy() : start(); }, active() { return state.enabled; } } };
};
