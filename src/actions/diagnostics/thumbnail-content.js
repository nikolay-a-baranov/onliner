import { telegram } from "../../core/telegram.js";

export const thumbnailContent = {
  id: "thumbnail-content",
  title: "Миниатюра / content",
  run(options = {}) {
    const previous = window.__thumbnailContentRecorder;
    if (previous?.finish) previous.finish("restarted");
    const config = {
      symptomQuietMs: 1000,
      fallbackMs: 30000,
      sampleMs: 250,
      filename: `thumbnail-content-recorder-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
    };
    const state = {
      startedAt: new Date().toISOString(),
      finishedAt: "",
      reason: "",
      events: [],
      snapshots: [],
      errors: [],
      originals: [],
      listeners: [],
      observers: [],
      timers: [],
      patchedEditors: new WeakSet(),
      initialThumbnailId: "",
      confirmedAt: 0,
      confirmedBy: "",
      symptomAt: 0,
      symptom: null,
      lastTrustedContentInputAt: 0,
      lastActivityAt: Date.now(),
      lastContent: null,
      lastTinyMCE: null,
      lastThumbnailId: null,
      finished: false,
    };
    const recorder = { finish: null };
    window.__thumbnailContentRecorder = recorder;
    const now = () => new Date().toISOString();
    const contentField = () => document.querySelector("#content");
    const thumbnailId = () => String(document.querySelector("#_thumbnail_id")?.value || "").trim();
    const editor = () => window.tinyMCE?.get?.("content") || window.tinymce?.get?.("content") || null;
    const hash = (value = "") => {
      let result = 2166136261;
      for (let index = 0; index < value.length; index += 1) {
        result ^= value.charCodeAt(index);
        result = Math.imul(result, 16777619);
      }
      return (result >>> 0).toString(16).padStart(8, "0");
    };
    const metrics = (value = "") => {
      const blankBlocks = value.split(/\r?\n\s*\r?\n+/).filter((item) => item.trim()).length;
      const tagBlocks = (value.match(/<(?:p|h[1-6]|li|blockquote|div|section|article)\b/gi) || []).length;
      return {
        length: value.length,
        hash: hash(value),
        lines: value ? value.split(/\r?\n/).length : 0,
        blocks: Math.max(blankBlocks, tagBlocks),
        paragraphs: (value.match(/<p(?:\s[^>]*)?>/gi) || []).length,
        emptyParagraphs: (value.match(/<p(?:\s[^>]*)?>\s*(?:&nbsp;|<br\s*\/?\s*>|\s)*<\/p>/gi) || []).length,
        images: (value.match(/<img\b/gi) || []).length,
        galleries: (value.match(/\[onliner-gallery\b/gi) || []).length,
      };
    };
    const readContent = () => {
      const field = contentField();
      const tiny = editor();
      let tinyValue = "";
      try {
        tinyValue = String(tiny?.getContent?.({ format: "raw" }) ?? tiny?.getContent?.() ?? "");
      } catch (error) {
        state.errors.push({ at: now(), source: "tinyMCE.getContent", message: String(error?.stack || error) });
      }
      return {
        textarea: String(field?.value || ""),
        tinyMCE: tinyValue,
        activeElement: document.activeElement?.id || document.activeElement?.tagName || "",
        editorMode: document.querySelector("#content-tmce")?.classList.contains("switch-tmce") ? "visual" : "html",
      };
    };
    const change = (previous = "", current = "") => {
      if (previous === current) return null;
      let start = 0;
      const limit = Math.min(previous.length, current.length);
      while (start < limit && previous[start] === current[start]) start += 1;
      let previousEnd = previous.length;
      let currentEnd = current.length;
      while (previousEnd > start && currentEnd > start && previous[previousEnd - 1] === current[currentEnd - 1]) {
        previousEnd -= 1;
        currentEnd -= 1;
      }
      return {
        start,
        removedLength: previousEnd - start,
        addedLength: currentEnd - start,
        removed: previous.slice(start, previousEnd).slice(0, 500),
        added: current.slice(start, currentEnd).slice(0, 500),
      };
    };
    const detectChange = (previous = "", current = "", source = "") => {
      if (previous === current || state.symptomAt > 0) return null;
      return {
        source,
        detectedAt: now(),
        previous: metrics(previous),
        current: metrics(current),
        change: change(previous, current),
      };
    };
    const snapshot = (source, details = {}, forceContent = false) => {
      const content = readContent();
      const textareaChanged = state.lastContent !== null && content.textarea !== state.lastContent;
      const tinyChanged = state.lastTinyMCE !== null && content.tinyMCE !== state.lastTinyMCE;
      const symptom = textareaChanged ? detectChange(state.lastContent, content.textarea, source) : null;
      if (symptom) {
        state.symptomAt = Date.now();
        state.symptom = symptom;
        state.events.push({ at: now(), type: "content.changed", details: symptom });
      }
      const record = {
        at: now(),
        source,
        details: {
          ...details,
          ...(textareaChanged ? { textareaChange: change(state.lastContent, content.textarea) } : {}),
          ...(tinyChanged ? { tinyMCEChange: change(state.lastTinyMCE, content.tinyMCE) } : {}),
        },
        thumbnailId: thumbnailId(),
        textareaMetrics: metrics(content.textarea),
        tinyMCEMetrics: metrics(content.tinyMCE),
        activeElement: content.activeElement,
        editorMode: content.editorMode,
      };
      if (forceContent || textareaChanged || symptom) record.textarea = content.textarea;
      if (forceContent || tinyChanged) record.tinyMCE = content.tinyMCE;
      state.snapshots.push(record);
      state.lastContent = content.textarea;
      state.lastTinyMCE = content.tinyMCE;
      state.lastThumbnailId = record.thumbnailId;
      state.lastActivityAt = Date.now();
      return record;
    };
    const event = (type, details = {}, capture = false) => {
      state.events.push({ at: now(), type, details });
      state.lastActivityAt = Date.now();
      if (capture) snapshot(type, details);
    };
    const confirm = (type, details = {}) => {
      state.confirmedAt = Date.now();
      state.confirmedBy = type;
      event(type, details, true);
    };
    const stack = () => String(new Error().stack || "")
      .split("\n")
      .slice(2, 14)
      .map((line) => line.trim())
      .filter(Boolean);
    const patchContentValue = () => {
      const prototype = window.HTMLTextAreaElement?.prototype;
      const descriptor = prototype ? Object.getOwnPropertyDescriptor(prototype, "value") : null;
      if (!prototype || !descriptor?.get || !descriptor?.set || descriptor.set.__thumbnailContentRecorderWrapped) return;
      const original = descriptor;
      const wrapped = function (value) {
        if (this?.id !== "content") return original.set.call(this, value);
        const previousValue = String(original.get.call(this) || "");
        const currentValue = String(value ?? "");
        event("#content.value-set.before", {
          previous: metrics(previousValue),
          current: metrics(currentValue),
          change: change(previousValue, currentValue),
          stack: stack(),
        }, true);
        try {
          return original.set.call(this, value);
        } finally {
          queueMicrotask(() => snapshot("#content.value-set.after", {
            stack: stack(),
          }, true));
        }
      };
      Object.defineProperty(wrapped, "__thumbnailContentRecorderWrapped", { value: true });
      Object.defineProperty(prototype, "value", { ...original, set: wrapped });
      state.originals.push(() => {
        const current = Object.getOwnPropertyDescriptor(prototype, "value");
        if (current?.set === wrapped) Object.defineProperty(prototype, "value", original);
      });
    };
    const addListener = (target, type, handler, options) => {
      target?.addEventListener?.(type, handler, options);
      state.listeners.push(() => target?.removeEventListener?.(type, handler, options));
    };
    const addTimer = (timer) => {
      state.timers.push(timer);
      return timer;
    };
    const patch = (target, key, wrapper) => {
      if (!target || typeof target[key] !== "function") return;
      const original = target[key];
      if (original.__thumbnailContentRecorderWrapped) return;
      const wrapped = wrapper(original);
      Object.defineProperty(wrapped, "__thumbnailContentRecorderWrapped", { value: true });
      target[key] = wrapped;
      state.originals.push(() => {
        if (target[key] === wrapped) target[key] = original;
      });
    };
    const requestBody = (value) => {
      if (!value) return {};
      if (value instanceof FormData || value instanceof URLSearchParams) {
        return ["action", "post_id", "thumbnail_id"].reduce((result, key) => {
          const item = value.get(key);
          return item === null ? result : { ...result, [key]: String(item) };
        }, {});
      }
      if (typeof value !== "string") return {};
      const params = new URLSearchParams(value);
      return ["action", "post_id", "thumbnail_id"].reduce((result, key) => {
        const item = params.get(key);
        return item === null ? result : { ...result, [key]: String(item) };
      }, {});
    };
    const request = (url = "", body = null, method = "GET") => {
      const data = requestBody(body);
      const action = String(data.action || "");
      return {
        url: String(url || ""),
        method: String(method || "GET"),
        action,
        postId: String(data.post_id || ""),
        thumbnailId: String(data.thumbnail_id || ""),
        relevant: /async-upload\.php|media-upload\.php|admin-ajax\.php|set-post-thumbnail/i.test(String(url || "")) || action === "set-post-thumbnail",
        appliesThumbnail: action === "set-post-thumbnail" || /set-post-thumbnail/i.test(String(url || "")),
        uploadsMedia: /async-upload\.php/i.test(String(url || "")),
      };
    };
    const patchEditor = (value) => {
      if (!value || state.patchedEditors.has(value)) return;
      state.patchedEditors.add(value);
      ["setContent", "save"].forEach((name) => {
        patch(value, name, (original) => function (...args) {
          event(`tinyMCE.${name}.before`, { args: args.slice(0, 1).map((item) => typeof item === "string" ? { length: item.length, hash: hash(item) } : typeof item) }, true);
          try {
            return original.apply(this, args);
          } finally {
            queueMicrotask(() => snapshot(`tinyMCE.${name}.after`));
          }
        });
      });
    };
    const patchTinyMCE = () => {
      patchEditor(editor());
      const manager = window.tinyMCE || window.tinymce;
      patch(manager, "triggerSave", (original) => function (...args) {
        event("tinyMCE.triggerSave.before", {}, true);
        try {
          return original.apply(this, args);
        } finally {
          queueMicrotask(() => snapshot("tinyMCE.triggerSave.after"));
        }
      });
    };
    const patchWordPress = () => {
      patch(window, "WPSetAsThumbnail", (original) => function (...args) {
        event("WPSetAsThumbnail.before", { id: String(args[0] || "") }, true);
        try {
          return original.apply(this, args);
        } finally {
          queueMicrotask(() => event("WPSetAsThumbnail.after", { id: String(args[0] || "") }, true));
        }
      });
      patch(window, "WPSetThumbnailID", (original) => function (...args) {
        const id = String(args[0] || "").trim();
        event("WPSetThumbnailID.before", { id }, true);
        try {
          return original.apply(this, args);
        } finally {
          queueMicrotask(() => {
            if (id && id !== "-1") confirm("WPSetThumbnailID.after", { id });
            else event("WPSetThumbnailID.after", { id }, true);
          });
        }
      });
      patch(window, "WPSetThumbnailHTML", (original) => function (...args) {
        event("WPSetThumbnailHTML.before", { htmlLength: String(args[0] || "").length }, true);
        try {
          return original.apply(this, args);
        } finally {
          queueMicrotask(() => event("WPSetThumbnailHTML.after", {}, true));
        }
      });
    };
    const patchFetch = () => {
      patch(window, "fetch", (original) => async function (...args) {
        const source = args[0];
        const options = args[1] || {};
        const detail = request(source?.url || source || "", options.body, options.method || source?.method || "GET");
        if (detail.relevant) event("fetch.before", detail, true);
        try {
          const response = await original.apply(this, args);
          if (detail.relevant) {
            const result = { ...detail, status: response.status, ok: response.ok };
            if (detail.appliesThumbnail && response.ok) confirm("fetch.after", result);
            else event("fetch.after", result, true);
          }
          return response;
        } catch (error) {
          if (detail.relevant) event("fetch.error", { ...detail, message: String(error?.stack || error) }, true);
          throw error;
        }
      });
    };
    const patchXHR = () => {
      const prototype = window.XMLHttpRequest?.prototype;
      if (!prototype) return;
      patch(prototype, "open", (original) => function (method, url, ...rest) {
        this.__thumbnailContentRecorderRequest = { method: String(method || "GET"), url: String(url || "") };
        return original.call(this, method, url, ...rest);
      });
      patch(prototype, "send", (original) => function (...args) {
        const base = this.__thumbnailContentRecorderRequest || {};
        const detail = request(base.url, args[0], base.method);
        if (detail.relevant) {
          event("xhr.before", detail, true);
          const done = () => {
            const result = { ...detail, status: this.status, ok: this.status >= 200 && this.status < 400 };
            if (detail.appliesThumbnail && result.ok) confirm("xhr.after", result);
            else event("xhr.after", result, true);
          };
          this.addEventListener("loadend", done, { once: true });
        }
        return original.apply(this, args);
      });
    };
    const observe = () => {
      const field = contentField();
      if (field) {
        addListener(field, "beforeinput", (input) => {
          if (input.isTrusted) state.lastTrustedContentInputAt = Date.now();
          event("#content.beforeinput", {
            trusted: input.isTrusted,
            inputType: input.inputType || "",
            dataLength: String(input.data || "").length,
          }, true);
        }, true);
        ["input", "change", "blur", "focus"].forEach((type) => {
          addListener(field, type, (input) => {
            if (input.isTrusted && (type === "input" || type === "change")) state.lastTrustedContentInputAt = Date.now();
            snapshot(`#content.${type}`, { trusted: input.isTrusted });
          }, true);
        });
      }
      addListener(document, "click", (click) => {
        const target = click.target?.closest?.("#set-post-thumbnail,#remove-post-thumbnail,[id^='wp-post-thumbnail-'],[data-thumb-action],[data-action]");
        if (!target) return;
        event("click", {
          id: target.id || "",
          action: target.getAttribute("data-thumb-action") || target.getAttribute("data-action") || "",
          text: String(target.textContent || "").trim().slice(0, 120),
        }, true);
      }, true);
      const block = document.querySelector("#postimagediv") || document.body;
      const observer = new MutationObserver((records) => {
        const current = thumbnailId();
        const changedId = current !== state.lastThumbnailId;
        event("thumbnail.mutation", { records: records.length, thumbnailId: current, changedId }, true);
        if (changedId && current && current !== "-1" && current !== state.initialThumbnailId) {
          confirm("thumbnail.id-change", { thumbnailId: current });
        }
      });
      observer.observe(block, { subtree: true, childList: true, attributes: true, characterData: true });
      state.observers.push(observer);
    };
    const cleanup = () => {
      state.listeners.splice(0).forEach((remove) => {
        try { remove(); } catch {}
      });
      state.observers.splice(0).forEach((observer) => observer.disconnect());
      state.timers.splice(0).forEach((timer) => clearInterval(timer) || clearTimeout(timer));
      state.originals.splice(0).reverse().forEach((restore) => {
        try { restore(); } catch {}
      });
      if (window.__thumbnailContentRecorder === recorder) delete window.__thumbnailContentRecorder;
    };
    const openDeveloperChat = () => {
      return telegram.open.user(options.developer?.telegram || "");
    };
    const download = () => {
      const payload = {
        schema: "thumbnail-content-recorder.v2",
        page: {
          url: location.href,
          title: document.title,
          userAgent: navigator.userAgent,
          language: navigator.language,
        },
        state: {
          startedAt: state.startedAt,
          finishedAt: state.finishedAt,
          reason: state.reason,
          initialThumbnailId: state.initialThumbnailId,
          confirmedBy: state.confirmedBy,
          symptom: state.symptom,
        },
        summary: {
          eventCount: state.events.length,
          snapshotCount: state.snapshots.length,
          initial: state.snapshots[0]?.textareaMetrics || null,
          final: state.snapshots[state.snapshots.length - 1]?.textareaMetrics || null,
        },
        events: state.events,
        snapshots: state.snapshots,
        errors: state.errors,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = config.filename;
      document.documentElement.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      openDeveloperChat();
    };
    const finish = (reason = "manual") => {
      if (state.finished) return;
      state.finished = true;
      state.reason = reason;
      state.finishedAt = now();
      snapshot("recorder.finish", { reason }, true);
      cleanup();
      download();
      console.log("Диагностика завершена, JSON скачан.");
    };
    recorder.finish = finish;
    state.initialThumbnailId = thumbnailId();
    patchFetch();
    patchXHR();
    patchContentValue();
    patchWordPress();
    patchTinyMCE();
    observe();
    snapshot("recorder.start", {}, true);
    addTimer(setInterval(() => {
      patchWordPress();
      patchTinyMCE();
      const currentContent = String(contentField()?.value || "");
      const currentThumbnail = thumbnailId();
      if (currentContent !== state.lastContent) snapshot("poll.content-change");
      if (currentThumbnail !== state.lastThumbnailId) {
        snapshot("poll.thumbnail-change", { thumbnailId: currentThumbnail });
        if (currentThumbnail && currentThumbnail !== "-1" && currentThumbnail !== state.initialThumbnailId) {
          confirm("poll.thumbnail-confirmed", { thumbnailId: currentThumbnail });
        }
      }
      if (state.symptomAt > 0 && Date.now() - state.symptomAt >= config.symptomQuietMs) {
        finish("content-changed");
      }
    }, config.sampleMs));
    addTimer(setTimeout(() => finish("fallback-timeout"), config.fallbackMs));
    console.log("Запись началась. Воспроизведите проблему; отчёт скачается при первом изменении content или через 30 секунд.");
  },
};
