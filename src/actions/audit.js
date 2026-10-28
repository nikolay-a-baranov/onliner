import { cms } from "../core/cms.js";
import { host as frame } from "../core/surface/host.js";
import { styles as css } from "../core/surface/styles.js";
import { toolbar } from "../core/surface/toolbar.js";
import { icon } from "../core/surface/icon.js";
import { ui } from "../core/surface/ui.js";
import { ux } from "../core/surface/ux.js";
import { widget } from "../core/widget.js";
import { field as domField } from "../core/dom.js";
import { llm } from "../core/llm.js";
import { editorialPrompt } from "../prompts/editorial.js";
import { markup as contentMarkup } from "../pipe/markup.js";
import { auditTarget } from "./audit-target.js";

export const createAudit = (api = {}, options = {}) => {
  const config = {
    languagetool: options.languagetool !== false,
    qwen: true,
    gemini: true,
    availability: {
      keyPage: "deferred",
      qwen: options.qwen === true ? "available" : "deferred",
    },
    placement: {
      initial: String(options.placement || "bottom-center"),
    },
  };
  const agentScope = options.agentScope || "audit";
  const providerKey = "audit-provider";
  const reviewOnly = options.reviewOnly === true;
  const reviewTitle = String(options.reviewTitle || "Правки");
  const engineValues = [
    ...llm.agent.values.map((item) => ({ ...item, kind: "llm" })),
    {
      id: "languagetool",
      provider: "languagetool",
      label: "LanguageTool",
      logo: "languagetool",
      kind: "checker",
    },
  ];
  const mode = {
    config() {
      return {
        languagetool: config.languagetool,
        gemini: config.gemini,
        qwen: config.qwen && config.availability.qwen !== "deferred",
      };
    },
    agent() {
      return llm.choice.current({
        key: llm.agent.storageKey(agentScope),
        values: engineValues,
        config: mode.config(),
        legacy: providerKey,
      });
    },
    agents() {
      return llm.choice.items(engineValues, mode.config());
    },
    providers() {
      return mode.agents()
        .filter((item) => item.kind === "llm")
        .map((item) => item.provider);
    },
    provider() {
      const current = mode.agent()?.provider || "";
      if (mode.providers().includes(current)) return current;
      return llm.agent.current(agentScope, mode.config(), providerKey)?.provider || "gemini";
    },
    source() {
      return mode.agent()?.provider || mode.provider();
    },
    setProvider(value) {
      const agent = llm.choice.set({
        key: llm.agent.storageKey(agentScope),
        value,
        values: engineValues,
        config: mode.config(),
      }) || mode.agent();
      state.engine = agent?.provider || mode.source();
      if (mode.providers().includes(state.engine)) state.provider = state.engine;
      return state.engine;
    },
    cycle() {
      const agent = llm.choice.cycle({
        key: llm.agent.storageKey(agentScope),
        values: engineValues,
        config: mode.config(),
      }) || mode.agent();
      state.engine = agent?.provider || mode.source();
      if (mode.providers().includes(state.engine)) state.provider = state.engine;
      state.view = new Set([state.engine]);
      panel.syncAgent();
      panel.render();
      if (!state.checkedSources.has(state.engine)) app.check(state.engine);
      return agent;
    },
    llm() {
      return mode.providers().length > 0;
    },
  };
  const id = {
    skin: "audit-style",
  };
  const variant = {
    glyphs: "calligraphy",
  };
  const glyphs = {
    classic: {
      fix: "Autocorrect",
      search: "Globe Search",
      ok: "Circle Multiple Subtract Checkmark",
    },
    calligraphy: {
      fix: "Calligraphy Pen Error",
      search: "Calligraphy Pen Question Mark",
      ok: "Calligraphy Pen Checkmark",
    },
  };
  const state = {
    ignored:
      window.auditIgnored ??
      (window.auditIgnored = window.proofreadIgnored ?? window.ltIgnored ?? new Set()),
    textarea: null,
    panel: null,
    list: null,
    undo: null,
    targetSnapshot: null,
    targetStale: false,
    plain: "",
    chunks: [],
    matches: [],
    rejected: { languagetool: [] },
    visible: [],
    view: new Set(),
    sourceMode: { languagetool: "normal" },
    drag: null,
    resize: null,
    rowsVisible: 5,
    rowsTarget: 5,
    rowsCompact: false,
    listObserver: null,
    headObserver: null,
    headFrame: null,
    headTimer: null,
    tabObserver: null,
    fitFrame: null,
    running: false,
    checked: false,
    progress: 0,
    model: [],
    provider: mode.provider(),
    engine: mode.source(),
    result: {
      sourceKey: "",
      edits: [],
      slug: { text: "" },
      excerpt: { text: "" },
    },
    evaluation: {
      startedAt: "",
      completedAt: "",
      generated: [],
      presented: [],
      decisions: [],
    },
    pending: null,
    keyPrompted: new Set(),
    prefetched: {},
    prefetching: {},
    checkedSources: new Set(),
    debug: [],
    controller: null,
    session: 0,
    keyboardSync: null,
    busySync: null,
    placement: config.placement.initial,
  };
  const auditTelemetry = {
    id() { return crypto.randomUUID?.() || `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`; },
    record(kind, payload) {
      try { return api.telemetry?.auditRecord?.(kind, payload) || false; }
      catch (error) { console.warn("[onliner audit telemetry]", error); return false; }
    },
    activeRun: "",
  };
  const proposalTarget = {
    snapshot(value = state.textarea?.value || "") {
      return auditTarget.snapshot(value);
    },
    occurrences(value, needle) {
      return auditTarget.occurrences(value, needle);
    },
    locate(snapshot, value = {}) {
      return auditTarget.locate(snapshot, value);
    },
    apply(snapshot, target, after, pending = []) {
      let outcome = { status: "unsupported" };
      cms.editor.runContent((current) => {
        outcome = auditTarget.apply({ snapshot, current, target, after, pending });
        return outcome.status === "applied" ? outcome.html : current;
      });
      return outcome;
    },
    restore(before, after) {
      let outcome = { status: "unsupported" };
      cms.editor.runContent((current) => {
        outcome = auditTarget.restore({ before, after, current });
        return outcome.status === "restored" ? outcome.html : current;
      });
      return outcome;
    },
    resolve(snapshot, target) {
      return auditTarget.resolve(snapshot, target);
    },
    align(snapshot, analysis, value = {}) {
      return auditTarget.align(snapshot, analysis, value);
    },
  };
  const visual = {
    control: {
      close: "cross-mark",
      marker: "nazar-amulet",
    },
    source: {
      google: "google",
      languagetool: "languagetool",
      gemini: "gemini",
      qwen: "qwen",
    },
    provider: {
      gemini: "gemini",
      qwen: "qwen",
    },
    theme(value) {
      return icon.theme(value);
    },
    icon(name) {
      return icon.emoji(visual.control[name] || name);
    },
    logo(name, className = "") {
      const key = visual.source[String(name || "").toLowerCase()] || "";
      if (!key) return "";
      return icon.logo(key, name, className);
    },
    llm(name, className = "") {
      const agent = llm.agent.get(name, mode.config());
      const key = agent?.logo || visual.provider[String(name || "").toLowerCase()] || "";
      if (!key) return "";
      return icon.logo(key, agent?.label || name, className);
    },
    status(name, providerName, className = "") {
      if (mode.providers().includes(String(name || "").toLowerCase())) {
        return visual.llm(name, className);
      }
      if (String(name || "").toLowerCase() === "llm") {
        return visual.llm(providerName, className);
      }
      return visual.logo(name, className);
    },
  };
  const text = {
    ignored: new Set(["телеграм-бот", "},", ",{"]),
    punctuation(value) {
      return /^[\s.,!?…:;'"«»„“”()\-–—]+$/u.test(value || "");
    },
    spaceCount(value) {
      return (String(value || "").match(/[\s\u00A0]/g) || []).length;
    },
    spaceAdded(source, target) {
      const left = String(source || "");
      const right = String(target || "");
      if (left === right) return false;
      if (left.replace(/[\s\u00A0]+/g, "") !== right.replace(/[\s\u00A0]+/g, "")) {
        return false;
      }
      return text.spaceCount(right) > text.spaceCount(left);
    },
    wordChar(value) {
      return /^[\p{L}\p{N}_-]$/u.test(value || "");
    },
    wholeWord(value) {
      return /^[\p{L}\p{N}_-]+$/u.test(value || "");
    },
    wholeAt(value, word, position) {
      const string = String(value || "");
      const left = string.slice(position - 1, position);
      const right = string.slice(position + word.length, position + word.length + 1);
      return !text.wordChar(left) && !text.wordChar(right);
    },
    find(value, word, from = 0, whole = false) {
      const string = String(value || "");
      const needle = String(word || "");
      let position = string.indexOf(needle, Math.max(0, from));
      while (position >= 0) {
        if (!whole || text.wholeAt(string, needle, position)) return position;
        position = string.indexOf(needle, position + needle.length);
      }
      return -1;
    },
    count(value, word, whole = false) {
      const string = String(value || "");
      const needle = String(word || "");
      if (!needle) return 0;
      let count = 0;
      let cursor = 0;
      let position = text.find(string, needle, cursor, whole);
      while (position >= 0) {
        count += 1;
        cursor = position + needle.length;
        position = text.find(string, needle, cursor, whole);
      }
      return count;
    },
    replaceWhole(value, word, fix) {
      const string = String(value || "");
      const needle = String(word || "");
      if (!needle) return string;
      let cursor = 0;
      let result = "";
      let position = text.find(string, needle, cursor, true);
      while (position >= 0) {
        result += string.slice(cursor, position) + fix;
        cursor = position + needle.length;
        position = text.find(string, needle, cursor, true);
      }
      return result + string.slice(cursor);
    },
    dotted(value) {
      return /[.…]/u.test(value || "");
    },
    normalizeFix(value) {
      return String(value || "").replace(/ ([—–])/g, "\u00A0$1");
    },
    replaceEverywhere(item, fix) {
      return [
        item.replaceAll,
        text.wholeWord(item.word),
        !text.spaceAdded(item.word, fix),
        !text.dotted(item.word),
        !text.dotted(fix),
      ].every(Boolean);
    },
    proper(item) {
      if (item.source !== "languagetool") return false;
      if (item.message !== "Возможно найдена орфографическая ошибка.")
        return false;
      return /^[А-ЯЁ][а-яё]+(?:-[А-ЯЁа-яё]+)?$/u.test(item.word || "");
    },
    form(item) {
      if (item.source !== "languagetool") return false;
      if (item.message !== "Возможно найдена орфографическая ошибка.")
        return false;
      const word = String(item.word || "").toLowerCase();
      const fix = String(item.fix || "").toLowerCase();
      if (word.length < 5 || fix.length < 5) return false;
      if (!/^[а-яё-]+$/u.test(word + fix)) return false;
      if (word.startsWith(fix)) return true;
      if (fix.startsWith(word)) return true;
      return false;
    },
    safe(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    },
    orthographic(value) {
      return [
        "Возможно найдена орфографическая ошибка.",
        "Возможно, орфографическая ошибка.",
      ].includes(String(value || "").trim());
    },
    tooltip(value) {
      const message = String(value || "").trim();
      return text.orthographic(message)
        ? "Возможно, орфографическая ошибка."
        : message;
    },
    message(value) {
      const message = text.tooltip(value);
      return message === "Возможно, орфографическая ошибка."
        ? ""
        : message;
    },
    copy(value) {
      try {
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(value);
          return;
        }
        const textarea = document.createElement("textarea");
        domField.set(textarea, value);
        textarea.style.cssText = "position:fixed;left:-9999px;top:0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      } catch {}
    },
    next(value, word) {
      const index = value.indexOf(word);
      if (index < 0) return "";
      return value.slice(index + word.length, index + word.length + 1);
    },
    stylistic(message) {
      return /лучше|ясност|разговорн|устаревш|уместн|подходит|полное слово|повторное упоминание|неоднозначность|неверный формат года|полноты значения|параллелизм|название болезни/i.test(
        message || "",
      );
    },
    longer(match) {
      return (
        String(match.fix || "").length > String(match.word || "").length * 1.5
      );
    },
    punctuationAfter(value, word) {
      return /^[.!?…:;,]/.test(text.next(value, word));
    },
    removesPunctuation(match) {
      return (
        /[,:;!?…]$/.test(match.word || "") && !/[,:;!?…]$/.test(match.fix || "")
      );
    },
    emit() {
      const { textarea } = state;
      domField.emit(textarea);
    },
    decode() {
      const { textarea } = state;
      const source = textarea.value;
      const result = widget.decode.run(source, contentMarkup.clean);
      if (result === source) return;
      domField.input(textarea, result);
    },
    split(value) {
      return auditTarget.split(value, 8000);
    },
    plain() {
      return contentMarkup.strip(state.textarea.value);
    },
    key(match) {
      if (match?.proposalId) return `${match.source}|${match.proposalId}|${match.message}`;
      if (match?.target?.id) return `${match.source}|${match.target.id}|${match.message}`;
      return `${match.word}|${match.message}`;
    },
  };
  const storage = {
    key: {
      build(provider = state.provider) {
        return llm.key.build(provider);
      },
      read(provider = state.provider) {
        return llm.key.read(provider);
      },
      write(value, provider = state.provider) {
        llm.key.write(provider, value);
      },
      page(provider = state.provider) {
        return llm.key.page(provider);
      },
      label(provider = state.provider) {
        return llm.key.label(provider);
      },
      open(provider = state.provider) {
        if (config.availability.keyPage === "deferred") return false;
        const page = storage.key.page(provider);
        if (!page) return false;
        const label = storage.key.label(provider);
        if (!window.confirm(`Открыть страницу API-ключей для ${label}?`)) return false;
        window.open(page, "_blank", "noopener");
        return true;
      },
      ensure(provider = state.provider) {
        const value = storage.key.read(provider);
        if (value) return value;
        if (state.keyPrompted.has(provider)) {
          throw new Error("API-ключ не указан.");
        }
        state.keyPrompted.add(provider);
        storage.key.open(provider);
        const label = storage.key.label(provider);
        const input = prompt(`Вставь API-ключ для ${label}`);
        if (!input) throw new Error("API-ключ не указан.");
        storage.key.write(input, provider);
        return input;
      },
    },
  };
  const provider = {
    parse(value) {
      try {
        return JSON.parse(value);
      } catch {
        throw new Error(String(value || "").slice(0, 300));
      }
    },
    languagetool(chunk, options = {}) {
      return fetch("https://api.languagetool.org/v2/check", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          text: chunk,
          language: "ru",
          level: "picky",
        }),
      })
        .then((response) => response.text())
        .then((raw) => {
          if (options.debug !== false) {
            state.debug.push({ source: "languagetool", chunk, raw });
          }
          return provider.parse(raw);
        });
    },
  };
  const runner = {
    audit(providerName, value) {
      return llm
        .run({
          provider: providerName,
          input: value,
          prompt: editorialPrompt.audit.build(value),
          fallback: JSON.stringify(editorialPrompt.audit.empty()),
          resolveKey(name) {
            return storage.key.ensure(name);
          },
          onDebug(result) {
            state.debug.push(result);
          },
          onModel(result) {
            panel.model(result);
          },
        })
        .then((result) => editorialPrompt.audit.normalize(result));
    },
    languagetool(chunk, options = {}) {
      return provider.languagetool(chunk, options);
    },
  };
  const result = {
    source(value = "") {
      return contentMarkup
        .strip(String(value || ""))
        .replace(/\s+/g, " ")
        .trim();
    },
    key(value = "") {
      return Array.from(result.source(value)).reduce(
        (hash, char) => Math.imul(hash ^ char.codePointAt(0), 16777619) >>> 0,
        2166136261,
      ).toString(36);
    },
    current(value = "") {
      const sourceKey = result.key(value);
      return state.result.sourceKey === sourceKey ? state.result : null;
    },
    set(value = "", data = editorialPrompt.audit.empty()) {
      const normalized = editorialPrompt.audit.normalize(data);
      state.result = {
        sourceKey: result.key(value),
        edits: normalized.edits,
        slug: normalized.slug,
        excerpt: normalized.excerpt,
      };
      return state.result;
    },
    get(value = "", options = {}) {
      const source = result.source(value);
      if (!source) return Promise.resolve(state.result);
      const sourceKey = result.key(source);
      const cached = result.current(source);
      if (cached) return Promise.resolve(cached);
      if (state.pending?.sourceKey === sourceKey) return state.pending.promise;
      const providerName = options.provider || mode.provider();
      app.prepareLlm(providerName);
      const promise = runner
        .audit(providerName, source)
        .then((data) => result.set(source, data))
        .finally(() => {
          if (state.pending?.promise === promise) state.pending = null;
        });
      state.pending = { sourceKey, promise };
      return promise;
    },
  };
  const data = {
    map: {
      languagetool(value, chunk) {
        const string = chunk.text;
        const filter = {
          whitelist(item) {
            const message = String(item.message || "");
            return [/орфографическ/i, /опечат/i, /пробел/i, /повтор/i].some(
              (rule) => rule.test(message),
            );
          },
          customReason(item) {
            if (filter.proper(item)) return "proper-name";
            if (filter.form(item)) return "word-form";
            if (filter.split(item)) return "split-word";
            if (filter.hyphen(item)) return "hyphen";
            return "";
          },
          mainReason(item) {
            if (!filter.whitelist(item)) return "not-main-whitelist";
            return "";
          },
          describe(reason) {
            return {
              "not-main-whitelist": "не входит в основной фильтр",
              "proper-name": "похоже на имя",
              "word-form": "похоже на словоформу",
              "split-word": "разбиение слова",
              hyphen: "сомнительный дефис",
            }[reason] || reason;
          },
          annotate(item, reason) {
            return {
              ...item,
              rejected: true,
              rejectReason: reason,
              message: `${item.message} · ${filter.describe(reason)}`,
            };
          },
          viable(item) {
            if (!data.allow(item, string)) return false;
            return !filter.customReason(item);
          },
          run(value) {
            return value.reduce(
              (result, item) => {
                if (!filter.viable(item)) return result;
                const reason = filter.mainReason(item);
                if (!reason) {
                  result.items.push(item);
                  return result;
                }
                result.rejected.push(filter.annotate(item, reason));
                return result;
              },
              { items: [], rejected: [], raw: [] },
            );
          },
          proper(item) {
            if (!text.orthographic(item.message)) return false;
            return /^[А-ЯЁ][а-яё]+(?:-[А-ЯЁа-яё]+)?$/u.test(item.word || "");
          },
          form(item) {
            if (!text.orthographic(item.message)) return false;
            const word = String(item.word || "").toLowerCase();
            const fix = String(item.fix || "").toLowerCase();
            if (word.length < 5 || fix.length < 5) return false;
            if (!/^[а-яё-]+$/u.test(word + fix)) return false;
            if (word.startsWith(fix)) return true;
            if (fix.startsWith(word)) return true;
            return false;
          },
          split(item) {
            if (!text.orthographic(item.message)) return false;
            const word = String(item.word || "");
            if (word.includes(" ")) return false;
            return item.variants.some((value) =>
              String(value || "").includes(" "),
            );
          },
          hyphen(item) {
            if (!text.orthographic(item.message)) return false;
            const word = String(item.word || "");
            if (!word.includes("-")) return false;
            return item.variants.some((value) => {
              const fix = String(value || "");
              if (fix.includes("-") || fix.includes(" ")) return false;
              return fix.length > word.length / 2;
            });
          },
          allow(item) {
            return [
              filter.whitelist(item),
              !filter.proper(item),
              !filter.form(item),
              !filter.split(item),
              !filter.hyphen(item),
            ].every(Boolean);
          },
        };
        return filter.run(
          (value.matches || []).map((item, index) => {
            const offset = Number(item.offset);
            const length = Number(item.length);
            const valid = Number.isInteger(offset) && offset >= 0 &&
              Number.isInteger(length) && length > 0 && offset + length <= string.length;
            const word = valid ? string.slice(offset, offset + length) : "";
            const fix = item.replacements?.[0]?.value || "";
            const located = valid
              ? proposalTarget.align(state.targetSnapshot, state.plain, {
                  before: word,
                  after: fix,
                  start: chunk.start + offset,
                })
              : { status: "invalid" };
            return {
              source: "languagetool",
              word,
              fix,
              variants: (item.replacements || [])
                .slice(0, 10)
                .map((replacement) => replacement.value),
              message: text.tooltip(item.message),
              category: item.rule?.category?.id || "",
              rule: item.rule?.id || "",
              replaceAll: false,
              target: located.target || null,
              targetStatus: located.status,
              sourceOffset: valid ? chunk.start + offset : null,
              proposalId: valid
                ? `languagetool:${chunk.start + offset}:${length}:${item.rule?.id || ""}`
                : `languagetool:invalid:${chunk.start}:${index}`,
            };
          }),
        );
      },
      llm(value, source = state.provider) {
        const result = editorialPrompt.audit.normalize(value);
        const items = Array.isArray(result.edits) ? result.edits : [];
        const provider = String(source || state.provider || "llm");
        const label = provider === "gemini" ? "Gemini" : provider.charAt(0).toUpperCase() + provider.slice(1);
        return {
          items: items.map((item, index) => {
            const word = String(item?.before || "");
            const fix = String(item?.after || "");
            const analysisCount = proposalTarget.occurrences(state.plain, word).length;
            const resolved = proposalTarget.locate(state.targetSnapshot, {
              before: word,
              after: fix,
            });
            const located = analysisCount > 1
              ? { status: "ambiguous" }
              : analysisCount < 1
                ? { status: "not-found" }
                : resolved.status === "not-found"
                  ? proposalTarget.align(state.targetSnapshot, state.plain, {
                      before: word,
                      after: fix,
                      start: state.plain.indexOf(word),
                    })
                  : resolved;
            return {
              source: provider,
              word,
              fix,
              variants: [fix],
              message: item?.reason ? `${label}: ${item.reason}` : label,
              confidence: Number(item?.confidence) || 0,
              replaceAll: false,
              target: located.target || null,
              targetStatus: located.status,
              proposalId: `${provider}:${index}:${word}:${fix}`,
            };
          }),
          rejected: [],
          raw: [],
        };
      },
      gemini(value) {
        return data.map.llm(value, "gemini");
      },
      qwen(value) {
        return data.map.llm(value, "qwen");
      },
    },
    check(name, index = 0, result = { items: [], rejected: [], raw: [] }, options = {}) {
      if (index >= state.chunks.length) return Promise.resolve(result);
      const chunk = state.chunks[index];
      const string = chunk.text;
      const total = state.chunks.length;
      if (options.progress !== false) {
        progress.set(Math.round(((index + 1) / total) * 100));
      }
      return runner[name](string, options).then((value) => {
        const matches = data.map[name](value, chunk);
        return data.check(name, index + 1, {
          items: result.items.concat(matches.items || []),
          rejected: result.rejected.concat(matches.rejected || []),
          raw: result.raw.concat(matches.raw || []),
        }, options);
      });
    },
    run(name, options = {}) {
      if (!mode.providers().includes(name)) {
        return data.check(name, 0, { items: [], rejected: [], raw: [] }, options);
      }
      return result.get(state.plain, { provider: name }).then((value) =>
        data.map[name](value, state.plain),
      );
    },
    allow(item, value) {
      const checks = [
        data.filled,
        (item) => !data.ignored(item),
        (item) => !data.punctuation(item),
        (item) => !data.hidden(item),
        data.confidence,
        data.style,
        data.size,
        data.punctuationSafe,
        (item) => data.present(item, value),
      ];
      return checks.every((check) => check(item));
    },
    filled(item) {
      return Boolean(item.word && item.fix && item.word !== item.fix);
    },
    ignored(item) {
      return text.ignored.has(item.word.toLowerCase());
    },
    punctuation(item) {
      return text.punctuation(item.fix);
    },
    hidden(item) {
      return state.ignored.has(text.key(item));
    },
    confidence(item) {
      if (!mode.providers().includes(item.source)) return true;
      return item.confidence >= 0.8;
    },
    style(item) {
      if (!mode.providers().includes(item.source)) return true;
      return !text.stylistic(item.message);
    },
    size(item) {
      if (!mode.providers().includes(item.source)) return true;
      return !text.longer(item);
    },
    punctuationSafe(item) {
      if (!mode.providers().includes(item.source)) return true;
      return !text.removesPunctuation(item);
    },
    present(item, value) {
      if (item.targetStatus) return true;
      return value.includes(item.word);
    },
    filter(items) {
      const value = state.textarea.value;
      return data.group(items.filter((item) => data.allow(item, value)));
    },
    group(items) {
      const groups = new Map();
      items.forEach((item) => {
        if (mode.providers().includes(item.source) || item.targetStatus) {
          groups.set(`${item.source}|${groups.size}|${item.word}`, {
            ...item,
            count: 1,
          });
          return;
        }
        const key = text.key(item);
        const value = groups.get(key);
        if (!value) {
          groups.set(key, { ...item, count: 1 });
          return;
        }
        value.count += 1;
      });
      return [...groups.values()].map((item) => {
        if (!item.replaceAll || !text.wholeWord(item.word)) return item;
        const count = text.count(state.textarea.value, item.word, true);
        if (count <= item.count) return item;
        return { ...item, count };
      });
    },
  };
  const identity = {
    status(item) {
      if (!item.target) return item.targetStatus || "unresolved";
      if (state.targetStale || !state.targetSnapshot) return "stale";
      return proposalTarget.resolve(state.targetSnapshot, item.target).status;
    },
    sync(items = []) {
      const entries = items.map((item, index) => {
        const result = item.target && !state.targetStale && state.targetSnapshot
          ? proposalTarget.resolve(state.targetSnapshot, item.target)
          : { status: identity.status(item) };
        return { index, item, result };
      });
      const conflicts = new Set();
      entries.forEach((left, index) => {
        if (left.result.status !== "ready") return;
        entries.slice(index + 1).forEach((right) => {
          if (right.result.status !== "ready") return;
          if (!auditTarget.proposal.overlap(left.result.target, right.result.target)) return;
          conflicts.add(left.index);
          conflicts.add(right.index);
        });
      });
      return entries.map(({ index, item, result }) => ({
        ...item,
        targetStatus: conflicts.has(index) ? "conflict" : result.status,
      }));
    },
    pending(item) {
      return state.visible
        .filter((value) => value !== item && value.target && value.targetStatus === "ready")
        .map((value) => value.target);
    },
  };
  const view = {
    theme: {
      key: "onliner-audit-theme",
      get() {
        const stored = localStorage.getItem(view.theme.key);
        if (stored === "dark" || stored === "light") return stored;
        return toolbar.appearance.theme("content");
      },
      set(value) {
        localStorage.setItem(view.theme.key, value);
        const element = state.panel;
        if (!element) return;
        element.dataset.theme = value;
        if (reviewOnly) {
          ui.surface.sync(element, {
            layout: "fullscreen",
            theme: value,
            surface: "toolbar",
          });
        }
        ui.controls.chrome.theme(element, {
          theme: value,
          action: "audit-theme",
        });
      },
      toggle() {
        const next = view.theme.get() === "dark" ? "light" : "dark";
        view.theme.set(next);
      },
    },
    source: {
      enabled: mode.config(),
      items() {
        const name = state.engine || mode.source();
        return view.source.enabled[name] ? [name] : [];
      },
      tabs: {
        items() {
          return view.source.items();
        },
        state(active = "") {
          return ui.tabs.headless.init({
            items: view.source.tabs.items(),
            active,
          });
        },
        step(name = "", delta = 0) {
          const tabs = view.source.tabs.state(name);
          return ui.tabs.headless.step(tabs, delta);
        },
      },
      active(name) {
        return view.source.enabled[name] === true;
      },
      count() {
        return state.matches.reduce(
          (value, match) => ({
            ...value,
            [match.source]: (value[match.source] || 0) + 1,
          }),
          { languagetool: 0, gemini: 0, qwen: 0 },
        );
      },
      rejectedCount(name) {
        return (state.rejected[name] || []).length;
      },
      selected() {
        return view.source.tabs.items().filter((name) => state.view.has(name));
      },
      visible() {
        const regular = state.matches.filter((match) => {
          if (!state.view.has(match.source)) return false;
          if (match.source === "languagetool") {
            return state.sourceMode.languagetool !== "rejected";
          }
          return true;
        });
        const rejected =
          state.view.has("languagetool") &&
          state.sourceMode.languagetool === "rejected"
            ? state.rejected.languagetool || []
            : [];
        return identity.sync(regular
          .concat(rejected)
          .filter((match) => !state.ignored.has(text.key(match))));
      },
      toggle(name) {
        if (!state.checkedSources.has(name)) {
          state.view.add(name);
          app.check(name);
          return;
        }
        if (name === "languagetool") {
          view.source.toggleLanguagetool();
          return;
        }
        view.source.toggleProvider(name);
      },
      toggleProvider(name) {
        if (state.view.has(name)) state.view.delete(name);
        else state.view.add(name);
        panel.render();
      },
      toggleLanguagetool() {
        if (!state.view.has("languagetool")) {
          state.view.add("languagetool");
          state.sourceMode.languagetool = "normal";
          panel.render();
          return;
        }
        if (state.sourceMode.languagetool === "normal") {
          state.sourceMode.languagetool = "rejected";
          panel.render();
          return;
        }
        state.sourceMode.languagetool = "normal";
        state.view.delete("languagetool");
        panel.render();
      },
      reset() {
        state.view = new Set([state.engine || mode.source()]);
        state.sourceMode.languagetool = "normal";
        panel.render();
      },
      update() {
        const element = state.panel;
        if (!element) return;
        const counts = view.source.count();
        element.querySelectorAll("[data-source]").forEach((button) => {
          const name = button.dataset.source;
          const active = state.view.has(name);
          const checked = state.checkedSources.has(name);
          const rejected = name === "languagetool" &&
            state.sourceMode.languagetool === "rejected";
          button.dataset.active = active ? "true" : "false";
          button.dataset.checked = checked ? "true" : "false";
          button.dataset.mode = rejected ? "rejected" : "normal";
          if (name === "languagetool") {
            button.title = rejected
              ? "LanguageTool: фильтр"
              : "LanguageTool";
          }
          if (mode.providers().includes(name)) {
            const agent = mode.agents().find((item) => item.provider === name) || mode.agent();
            button.title = state.model ? `${agent.label}\n${state.model}` : agent.label;
          }
          const count = button.querySelector("[data-count]");
          if (!count) return;
          if (!checked) {
            count.textContent = "—";
            return;
          }
          count.textContent = rejected
            ? view.source.rejectedCount(name)
            : counts[name] || 0;
        });
      },
      names() {
        return Object.entries(view.source.enabled)
          .filter(([, active]) => active)
          .map(([name]) => name.toUpperCase())
          .join(" + ");
      },
    },
  };
  const progress = {
    set(value) {
      state.progress = Math.max(state.progress || 0, value);
      state.panel.style.setProperty(
        "--audit-progress",
        `${Math.min(100, state.progress)}%`,
      );
    },
    reset() {
      state.progress = 0;
      state.panel.style.setProperty("--audit-progress", "0%");
    },
    done() {
      progress.set(100);
    },
  };
  const layout = {
    syncHead() {
      const root = state.panel;
      const head = root?.querySelector("[data-panel-head]");
      const tabs = head?.querySelector(".audit-engine-group");
      const back = head?.querySelector(".audit-return-group");
      const visibleBack = ux.layout.head.width(back) > 0 ? back : null;
      return ux.layout.head.fit(root, {
        head,
        items: [
          head?.firstElementChild,
          tabs,
          visibleBack,
          head?.lastElementChild,
        ],
        compactItems: [tabs, visibleBack],
      });
    },
    syncHeadSoon() {
      layout.syncHead();
      if (state.headFrame) cancelAnimationFrame(state.headFrame);
      clearTimeout(state.headTimer);
      state.headFrame = requestAnimationFrame(() => {
        state.headFrame = null;
        layout.syncHead();
      });
      state.headTimer = setTimeout(() => {
        state.headTimer = null;
        layout.syncHead();
      }, 120);
    },
    loading() {
      return state.panel?.dataset.done === "false";
    },
    rows() {
      return ui.surface.rows.count(state.list);
    },
    max() {
      return 5;
    },
    value(value = state.rowsTarget) {
      const number = Number(value);
      if (!Number.isFinite(number)) return state.rowsTarget || layout.max();
      return Math.max(1, Math.min(layout.max(), Math.round(number)));
    },
    remember(value = state.rowsTarget) {
      state.rowsTarget = layout.value(value);
      return state.rowsTarget;
    },
    apply(
      value = state.rowsTarget,
      {
        remember = false,
        preserve = true,
        compact = false,
        preserveEmpty = false,
      } = {},
    ) {
      const list = state.list;
      const element = state.panel;
      if (!list || !element || layout.loading()) return null;
      state.rowsCompact = compact;
      const visible = remember ? layout.remember(value) : layout.value(value);
      const count = layout.rows();
      const preserveTarget = preserve && (preserveEmpty || visible <= count);
      const result = ui.surface.rows.fit(element, list, {
        visible,
        loading: layout.loading,
        rowSelector: "[data-row]",
        emptySelector: "[data-empty]",
        rowHeightVar: "--audit-row-box-height",
        rowBorderVar: "--audit-row-border-width",
        rowGapVar: "--audit-row-stack-gap",
        headerSelector: "[data-header]",
        headerHeightVar: "--audit-header-height",
        preserveHeight: compact ? false : preserveTarget,
      });
      if (count > result.heightRows && result.listHeight > 1) {
        list.style.maxHeight = `${Math.floor(result.listHeight) - 1}px`;
      }
      state.rowsVisible = result.rows;
      return result;
    },
    empty() {
      return layout.apply(1, { preserve: false, compact: true });
    },
    fit() {
      if (state.rowsCompact) return layout.empty();
      return layout.apply(state.rowsTarget, { preserve: false });
    },
    snapScroll() {
      if (!state.panel || !state.list || layout.loading()) return false;
      const measure = ui.surface.rows.measure(state.panel, state.list, {
        rowSelector: "[data-row]",
        rowHeightVar: "--audit-row-box-height",
        rowBorderVar: "--audit-row-border-width",
        rowGapVar: "--audit-row-stack-gap",
      });
      if (!measure.step) return false;
      const top = state.list.scrollTop || 0;
      const next = Math.round(top / measure.step) * measure.step;
      if (Math.abs(next - top) < 1) return false;
      state.list.scrollTop = next;
      return true;
    },
    reset() {
      if (!state.panel) return false;
      ["left", "top", "right", "bottom", "transform"].forEach((name) => {
        state.panel.style.removeProperty(name);
      });
      state.rowsCompact = false;
      state.rowsTarget = layout.max();
      if (state.list) state.list.scrollTop = 0;
      layout.apply(layout.max(), { remember: true, preserve: false });
      return true;
    },
    resize(pointerY = 0) {
      if (!state.panel || !state.list || layout.loading()) return null;
      const measure = ui.surface.rows.measure(state.panel, state.list, {
        rowSelector: "[data-row]",
        rowHeightVar: "--audit-row-box-height",
        rowBorderVar: "--audit-row-border-width",
        rowGapVar: "--audit-row-stack-gap",
      });
      const top = state.list.getBoundingClientRect().top;
      const style = getComputedStyle(state.list);
      const padding =
        (parseFloat(style.paddingTop) || 0) +
        (parseFloat(style.paddingBottom) || 0);
      const height = Math.max(measure.step, pointerY - top - padding);
      const rows = Math.max(
        1,
        Math.min(layout.max(), Math.round(height / measure.step)),
      );
      state.list.scrollTop = 0;
      return layout.apply(rows, {
        remember: true,
        preserve: true,
        preserveEmpty: true,
      });
    },
  };
  const wait = {
    stop() {},
    html() {
      return ui.controls.wait({
        attrs: ' data-wait="true"',
      });
    },
    start() {
      panel.emptyHtml(wait.html());
      layout.empty();
    },
  };
  const busy = {
    sync(value = llm.busy.snapshot()) {
      if (!state.panel || state.running) return;
      if (value.active) {
        state.panel.dataset.loading = "true";
        state.panel.dataset.loadingSource = "llm";
        wait.start();
        return;
      }
      state.panel.dataset.loading = "false";
      delete state.panel.dataset.loadingSource;
      panel.render();
    },
    bind() {
      state.busySync?.();
      state.busySync = llm.busy.subscribe((value) => {
        if (value.active || state.panel?.dataset.loadingSource === "llm") {
          busy.sync(value);
        }
      });
    },
    unbind() {
      state.busySync?.();
      state.busySync = null;
    },
  };
  const glyph = {
    html(name, size = 20, fallbackName = name) {
      return ui.controls.glyph(name, size, fallbackName);
    },
    action(name) {
      return glyphs[variant.glyphs]?.[name] || glyphs.classic[name] || name;
    },
  };
  const row = {
    targetStatus(value = "") {
      return {
        ambiguous: "Неоднозначное место",
        conflict: "Пересекается с другой правкой",
        invalid: "Некорректная привязка",
        "not-found": "Фрагмент не найден",
        overlarge: "Слишком большая правка",
        stale: "Текст изменился",
        unsupported: "Неподдерживаемая структура",
        unresolved: "Нет безопасной привязки",
      }[value] || "";
    },
    buildOptions(match) {
      return ["__other__", ...match.variants.slice()];
    },
    buildOption(option, selected = false) {
      if (option === "__other__")
        return ui.controls.option({ value: "__other__", label: "{…}" });
      return ui.controls.option({ value: option, label: option, selected });
    },
    buildLabel(match) {
      const count = match.count > 1 ? ` ×${match.count}` : "";
      return {
        html: `${text.safe(match.word)}${count}`,
        raw: `${String(match.word || "")}${count}`,
      };
    },
    build(match, index) {
      const targetStatus = String(match.targetStatus || "");
      const targetNote = targetStatus && targetStatus !== "ready"
        ? row.targetStatus(targetStatus)
        : "";
      const note = [text.message(match.message), targetNote].filter(Boolean).join(" · ");
      const label = row.buildLabel(match);
      const options = row.buildOptions(match);
      const selected = String(
        match.variants?.[0] || match.fix || match.word || "",
      );
      const element = document.createElement("div");
      element.dataset.row = index;
      if (targetStatus) element.dataset.targetStatus = targetStatus;
      if (note) element.dataset.note = note;
      const tools = ui.controls.cluster({
        role: "actions",
        content: [
          shell.button({
            content: glyph.html(glyph.action("ok"), 20, "Dismiss Circle"),
            title: ux.hotkeys.tooltip("Скипнуть", ux.hotkeys.audit.label("ok")),
            attrs: ` data-ok="${index}"`,
          }),
          shell.button({
            content: glyph.html(glyph.action("search"), 20, "Search"),
            title: ux.hotkeys.tooltip("Поискать", ux.hotkeys.audit.label("search")),
            attrs: ` data-search="${index}"`,
          }),
          shell.button({
            content: glyph.html(glyph.action("fix"), 20, "Edit"),
            title: ux.hotkeys.tooltip(targetNote || "Поправить", ux.hotkeys.audit.label("fix")),
            attrs: ` data-fix="${index}"${targetStatus && targetStatus !== "ready" ? ' disabled aria-disabled="true"' : ""}`,
          }),
        ].join(""),
        group: {
          attrs: ' data-audit-actions="true" data-ui-boxes="3"',
        },
      });
          element.innerHTML = `
            <div class="audit-line">
              <div data-main style="display:flex;align-items:center;min-width:0;height:100%;">
                <span data-word style="line-height:1.2;" title="${text.safe(text.tooltip(match.message))}">${label.html}</span>
              </div>
              <div data-audit-field="true" data-ui-role="field" style="display:flex;align-items:center;min-width:0;height:100%;">
                ${ui.controls.fieldBox({
                  content: `
                    ${ui.controls.select({
                      content: options
                        .map((option) =>
                          row.buildOption(option, option === selected),
                        )
                        .join(""),
                      classes: "field audit-field audit-field-select",
                      attrs: ` style="width:100%;box-sizing:border-box;font:inherit;line-height:1.2;" data-select="${index}" data-default="${text.safe(selected)}" title="${text.safe(ux.hotkeys.tooltip(selected, ux.hotkeys.audit.label("select")))}"`,
                    })}
                    ${ui.controls.input({
                      classes: "field audit-field audit-field-input",
                      attrs: ` style="width:100%;box-sizing:border-box;font:inherit;line-height:1.2;" data-input="${index}" title="${text.safe(ux.hotkeys.tooltip("Вписать", ux.hotkeys.audit.label("input")))}"`,
                    })}
                  `,
                  classes: "ui-select-box audit-field-box audit-field-choice",
                  attrs: ' data-audit-input="false" data-ui-boxes="3" style="width:100%;min-width:0;"',
                })}
              </div>
              ${tools}
            </div>
          `;
      return element;
    },
  };
  const shell = {
    closeCurrent() {
      const current = document.getElementById("audit-panel");
      if (!current) return false;
      const button = current.querySelector('[data-action="audit-close"]');
      if (button) button.click();
      else current.remove();
      return true;
    },
    button({ content = "", title = "", attrs = "", classes = "" } = {}) {
      return ui.controls.button({
        content,
        title,
        classes,
        attrs: ` type="button"${attrs}`,
      });
    },
    buildTab(value) {
      const icon = value.icon ? `<span data-icon>${value.icon}</span>` : "";
      const label = value.label ? `<span>${value.label}</span>` : "";
      return shell.button({
        content: `${label}${icon}<span data-count="${value.count}">0</span>`,
        title: value.title || "",
        classes: "audit-source-button",
        attrs: ` data-source="${value.source}"`,
      });
    },
    buildHtml() {
      const agent = mode.agent();
      const source = state.engine || mode.source();
      const separator = ui.controls.separator({
        attrs: ' data-separator-mode="dot" data-ui-availability="deferred"',
      });
      const value = {
        theme: visual.theme(view.theme.get()),
        engine: visual.status(source, state.provider),
        go: glyph.html("Group Return", 20, "Arrow Return Up Left"),
        undo: glyph.html("Arrow Undo", 20),
        agent: glyph.html("Bot", 20, "AI"),
        save: glyph.html("Arrow Download", 20),
        close: visual.icon("close"),
      };
      const left = ui.controls.marker({
        content: reviewOnly
          ? glyph.html("Line Horizontal 4 Search", 20)
          : visual.icon("marker"),
        button: {
          action: "audit-marker",
          classes: "audit-panel-marker",
          attrs: ` type="button" tabindex="-1" aria-label="${reviewOnly ? text.safe(reviewTitle) : "Проверка"}"`,
        },
        group: { classes: "audit-marker-group" },
      });
      const download = shell.button({
        content: value.save,
        title: "Скачать",
        attrs: ' data-download data-ui-availability="deferred"',
      });
      const agentButton = shell.button({
        content: value.agent,
        title: `Агент: ${agent?.label || ""}`,
        attrs: ` data-action="audit-agent"${reviewOnly ? ' data-ui-availability="deferred"' : ""}`,
      });
      const engineTab = shell.buildTab({
        source,
        label: "",
        icon: value.engine,
        count: source,
      });
      const engineCluster = ui.shell.strip(`${reviewOnly ? "" : agentButton}${engineTab}`, {
        attrs: " data-engine-source",
      });
      const tabs = ui.controls.cluster({
        content: ui.shell.strip(`${engineCluster}${reviewOnly ? "" : `${separator}${download}`}`),
        group: {
          classes: "audit-engine-group",
          attrs: " data-tabs data-engine-group",
        },
      });
      const back = ui.controls.cluster({
        content: [
          shell.button({
            content: value.undo,
            title: "Отменить решение",
            attrs: ' id="audit-undo" data-undo disabled',
          }),
          reviewOnly ? "" : shell.button({
            content: value.go,
            title: "Вернуть",
            attrs: ' data-go-active data-ui-availability="deferred"',
          }),
        ].join(""),
        group: {
          classes: "audit-return-group",
          attrs: " data-return-group",
        },
      });
      const chrome = ui.controls.chrome({
        theme: view.theme.get(),
        themeAction: "audit-theme",
        closeAction: "audit-close",
        closeHotkey: ux.hotkeys.action.close.label(),
        group: {
          classes: "audit-controls-group",
          attrs: " data-controls-group",
        },
      });
      const main = ui.shell.strip(`${tabs}${back}`, {
        classes: "audit-header-main",
      });
      return `
          <div data-header>
            ${ui.shell.frame({
              left,
              main,
              right: chrome,
              classes: "audit-header-shell",
              attrs: ' data-panel-head="true"',
              pack: "spread",
            })}
            <div data-progress>
              <span data-progress-bar></span>
            </div>
          </div>
          <div id="audit-list">
            <div data-empty>Засылаю…</div>
          </div>
          <div data-audit-resize="true" title="Потягать"></div>
          <div data-audit-meta hidden aria-hidden="true">
            <div data-status><div id="audit-model"></div><div id="audit-title"></div></div>
          </div>
  `;
    },
    bind(value) {
      value.querySelectorAll("[data-source]").forEach((button) => {
        button.onclick = () => {
          const name = button.dataset.source;
          view.source.toggle(name);
          if (state.view.has(name)) {
            delete button.dataset.hoverMuted;
            return;
          }
          button.dataset.hoverMuted = "true";
        };
        button.onmouseleave = () => {
          delete button.dataset.hoverMuted;
        };
      });
      state.tabObserver = ui.tabs.headless.bind({
        root: value,
        scope: "[data-tabs]",
        tab: "[data-source]",
        key: "source",
        active(node) {
          return node?.dataset?.source || "";
        },
        step(name, delta) {
          return view.source.tabs.step(name, delta);
        },
      });
      value.querySelector('[data-action="audit-marker"]').onclick = () => {
        view.source.reset();
        layout.reset();
      };
      const agentButton = value.querySelector('[data-action="audit-agent"]');
      if (agentButton) agentButton.onclick = () => mode.cycle();
      value.querySelector('[data-action="audit-theme"]').onclick = () =>
        view.theme.toggle();
      value.querySelector('[data-action="audit-close"]').onclick = () => {
        ui.overlay.unregister("audit-panel");
        busy.unbind();
        state.session += 1;
        state.keyPrompted.clear();
        state.listObserver?.disconnect();
        state.headObserver?.disconnect();
        if (state.headFrame) cancelAnimationFrame(state.headFrame);
        clearTimeout(state.headTimer);
        state.tabObserver?.();
        state.tabObserver = null;
        state.controller?.behavior.destroy();
        state.controller = null;
        value.remove();
      };
      return value;
    },
    create() {
      return frame.create({
        id: "audit-panel",
        className: "panel",
        html: shell.buildHtml(),
      });
    },
  };
  const panel = {
    create() {
      frame.mount(id.skin, css.audit.panel());
      const element = shell.create();
      element.dataset.uiSurface = "toolbar";
      element.dataset.uiFrame = "capsule";
      element.dataset.theme = view.theme.get();
      element.dataset.toolsReady = "false";
      element.dataset.done = "true";
      element.dataset.loading = "false";
      if (reviewOnly) {
        element.dataset.auditReview = "true";
        element.dataset.toolbarFlow = "stack";
        element.dataset.dock = "floating";
        element.dataset.dockTarget = "floating";
        ui.surface.sync(element, {
          layout: "fullscreen",
          theme: view.theme.get(),
          surface: "toolbar",
        });
      }
      shell.bind(element);
      state.panel = element;
      state.list = element.querySelector("#audit-list");
      bind.head();
      busy.bind();
      ui.overlay.register({
        id: "audit-panel",
        kind: "audit",
        close: keyboard.close,
        editable: () => null,
        handle: (event) => {
          if (keyboard.run(event)) return "handled";
          return ui.hotkeys.project(event) ? "blocked" : "pass";
        },
      });
      bind.scroll();
      bind.resize();
      state.controller = toolbar.controller({
        panel: element,
        ...toolbar.presets.multiRowFixed("content"),
        place: () => panel.place(),
        theme: () => view.theme.get(),
        drag: {
          keepWidth: true,
          canStart(event) {
            if (event.button !== 0) return false;
            if (event.target.closest("button,input,select,a,[data-word],[data-audit-resize]")) return false;
            if (!event.target.closest("[data-header],#audit-list") && event.target !== element) return false;
            if (layout.loading()) return false;
            element.dataset.dragging = "true";
            return true;
          },
          onEnd() {
            delete element.dataset.dragging;
          },
        },
        resize: null,
      });
      view.source.update();
      state.controller.behavior.bind();
      delete element.dataset.toolbarCapsule;
      layout.syncHeadSoon();
      return element;
    },
    place(mode = state.placement) {
      const next = toolbar.placement.point(state.panel, { mode });
      if (!next) return false;
      toolbar.floating(state.panel, next, { keepWidth: true });
      return true;
    },
    drag() {
      const header = state.panel?.querySelector("[data-header]");
      if (header) header.style.cursor = "grab";
      state.controller?.behavior.drag();
    },
    resize() {
      layout.fit();
    },
    model(value) {
      if (typeof value === "string") state.model = value;
      view.source.update();
      const node = state.panel?.querySelector("#audit-model");
      if (!node) return;
      if (state.panel?.dataset.done === "false") {
        node.textContent = "";
        return;
      }
      node.textContent = state.model || "";
    },
    title(value) {
      const node = state.panel?.querySelector("#audit-title");
      if (!node) return;
      node.textContent = value || "";
    },
    status(name = "languagetool") {
      const node = state.panel?.querySelector("#audit-title");
      if (!node) return;
      node.innerHTML = `<span data-status-logo>${visual.status(name, state.provider)}</span>`;
    },
    empty(message) {
      state.list.innerHTML = "";
      if (!message) return;
      state.list.innerHTML = `<div data-empty>${text.safe(message)}</div>`;
    },
    emptyHtml(html) {
      state.list.innerHTML = "";
      if (!html) return;
      state.list.innerHTML = `<div data-empty>${html}</div>`;
    },
    row(index) {
      return state.panel.querySelector(`[data-row="${index}"]`);
    },
    rows() {
      return [...state.panel.querySelectorAll("[data-row]")];
    },
    active() {
      return state.panel.querySelector('[data-row][data-active="true"]');
    },
    next(row, predicate = () => false) {
      let next = row?.nextElementSibling || null;
      while (next && predicate(state.visible[next.dataset.row])) {
        next = next.nextElementSibling;
      }
      return next;
    },
    highlight(index) {
      const row = panel.row(index);
      if (!row) return false;
      panel.rows().forEach((item) => item.removeAttribute("data-active"));
      row.dataset.active = "true";
      row.scrollIntoView({ block: "nearest" });
      return true;
    },
    activate(index, button, from = 0) {
      if (!panel.highlight(index)) return false;
      const row = panel.row(index);
      return selection.go(
        state.visible[index],
        button || row.querySelector("[data-fix]"),
        from,
      );
    },
    activateNext(row, from = 0, predicate = () => false) {
      let next = row?.matches?.("[data-row]")
        ? row
        : (row && panel.next(row, predicate)) ||
          state.panel.querySelector("[data-row]");
      while (next) {
        const index = next.dataset.row;
        const button = next.querySelector("[data-fix]");
        if (panel.activate(index, button, from)) return;
        next.remove();
        panel.refreshTitle();
        next = state.panel.querySelector("[data-row]");
      }
    },
    refreshTitle() {
      const count = state.panel.querySelectorAll("[data-fix]").length;
      if (!count) {
        panel.title("Правок: 0");
        panel.empty("Правки закончились");
        layout.empty();
        return;
      }
      panel.title(`Правок: ${count}`);
      layout.fit();
    },
    remove(predicate) {
      state.list.querySelectorAll("[data-fix]").forEach((button) => {
        const item = state.matches[button.dataset.fix];
        if (predicate(item)) {
          button.closest("[data-row]").remove();
        }
      });
      panel.refreshTitle();
    },
    undo(value) {
      const button = state.panel?.querySelector("#audit-undo");
      if (button) button.disabled = !value;
    },
    syncAgent() {
      const agent = mode.agent();
      const source = state.engine || mode.source();
      const button = state.panel?.querySelector?.('[data-action="audit-agent"]');
      const tab = state.panel?.querySelector?.("[data-engine-source] [data-source]");
      const target = tab?.querySelector?.("[data-icon]");
      if (button) {
        button.title = `Агент: ${agent?.label || ""}`;
        button.setAttribute("aria-label", button.title);
      }
      if (tab) tab.dataset.source = source;
      const count = tab?.querySelector?.("[data-count]");
      if (count) count.dataset.count = source;
      if (target) {
        ux.icon.sync(
          target,
          visual.status(source, state.provider),
          source,
          ux.icon.preset.choice({
            datasetKey: "auditAgentGlyphKey",
          }),
        );
      }
      view.source.update();
      layout.syncHeadSoon();
      return Boolean(button || tab);
    },
    render() {
      if (!state.running) {
        wait.stop();
        state.panel.dataset.done = "true";
        state.panel.dataset.loading = "false";
        delete state.panel.dataset.loadingSource;
      }
      state.panel.dataset.toolsReady = "true";
      const matches = view.source.visible();
      view.source.update();
      state.visible = matches;
      state.list.innerHTML = "";
      if (!view.source.selected().length) {
        panel.empty("Источники не выбраны");
        layout.empty();
        return;
      }
      if (!matches.length) {
        panel.empty(
          state.checked ? "Правок не найдено" : "Проверка не запускалась",
        );
        layout.empty();
        return;
      }
      state.rowsCompact = false;
      matches
        .slice(0, 50)
        .forEach((match, index) =>
          state.list.appendChild(row.build(match, index)),
        );
      bind.selects();
      bind.actions();
      layout.fit();
      requestAnimationFrame(layout.fit);
      bind.list();
      panel.activateNext();
    },
    error(error) {
      wait.stop();
      state.panel.dataset.toolsReady = "true";
      state.panel.style.border =
        "2px solid var(--surface-audit-error-border)";
      panel.title("Ошибка");
      panel.empty(text.safe(error.message));
    },
  };
  const selection = {
    target(item) {
      if (!item?.target || !state.targetSnapshot || state.targetStale) return null;
      if (state.textarea.value !== state.targetSnapshot.html) {
        state.targetStale = true;
        return null;
      }
      const result = proposalTarget.resolve(state.targetSnapshot, item.target);
      return result.status === "ready" ? result.target : null;
    },
    find(item, from = 0) {
      const { textarea } = state;
      const whole = text.wholeWord(item.word);
      const position = text.find(textarea.value, item.word, from, whole);
      if (position >= 0 || from <= 0) return position;
      return text.find(textarea.value, item.word, 0, whole);
    },
    miss(button) {
      selection.flash(button, "red", 900);
    },
    flash(button, type = "green", timeout = 500) {
      if (!button) return;
      clearTimeout(button._flashTimer);
      delete button.dataset.flash;
      requestAnimationFrame(() => {
        button.dataset.flash = type;
        button._flashTimer = setTimeout(() => {
          delete button.dataset.flash;
        }, timeout);
      });
    },
    scroll(position) {
      const { textarea } = state;
      const styles = getComputedStyle(textarea);
      const mirror = document.createElement("div");
      const mark = document.createElement("span");
      mirror.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: ${textarea.clientWidth}px;
      white-space: pre-wrap;
      word-wrap: break-word;
      font: ${styles.font};
      line-height: ${styles.lineHeight};
      padding: ${styles.padding};
      border: ${styles.border};
      box-sizing: ${styles.boxSizing};
    `;
      mirror.textContent = textarea.value.slice(0, position);
      mark.textContent = "|";
      mirror.appendChild(mark);
      document.body.appendChild(mirror);
      textarea.scrollTop = Math.max(
        0,
        mark.offsetTop - textarea.clientHeight / 2,
      );
      mirror.remove();
    },
    focus(position, length) {
      const { textarea } = state;
      const apply = () => {
        textarea.focus({ preventScroll: true });
        textarea.setSelectionRange(position, position + length);
        selection.scroll(position);
      };
      apply();
      requestAnimationFrame(apply);
    },
    preview(item, from = state.textarea.selectionEnd) {
      if (!item) return false;
      if (item.targetStatus) {
        const target = selection.target(item);
        if (!target) return true;
        state.textarea.setSelectionRange(target.rawStart, target.rawEnd);
        selection.scroll(target.rawStart);
        return true;
      }
      const position = selection.find(item, from);
      if (position < 0) return false;
      state.textarea.setSelectionRange(position, position + item.word.length);
      selection.scroll(position);
      return true;
    },
    go(item, button, from = 0) {
      if (item?.targetStatus) {
        const target = selection.target(item);
        if (!target) {
          selection.miss(button);
          return true;
        }
        selection.focus(target.rawStart, target.rawEnd - target.rawStart);
        return true;
      }
      const position = selection.find(item, from);
      if (position < 0) {
        selection.miss(button);
        return false;
      }
      selection.focus(position, item.word.length);
      return true;
    },
  };
  const match = {
    fix(index) {
      const select = state.panel.querySelector(`[data-select="${index}"]`);
      const input = state.panel.querySelector(`[data-input="${index}"]`);
      if (select?.value === "__custom__") {
        return text.normalizeFix(select.dataset.custom || state.visible[index].fix);
      }
      if (select?.value === "__other__") {
        return text.normalizeFix(input?.value || state.visible[index].fix);
      }
      return text.normalizeFix(select?.value || input?.value || state.visible[index].fix);
    },
    apply(index, button, from = 0) {
      const { textarea, visible } = state;
      const item = visible[index];
      if (item?.targetStatus) {
        if (item.targetStatus !== "ready" || !item.target) {
          selection.miss(button);
          return false;
        }
        const before = state.targetSnapshot;
        const outcome = proposalTarget.apply(
          before,
          item.target,
          match.fix(index),
          identity.pending(item),
        );
        if (outcome.status !== "applied") {
          if (outcome.status === "stale") state.targetStale = true;
          selection.miss(button);
          panel.render();
          return false;
        }
        state.undo = {
          type: "apply",
          before: before.html,
          after: outcome.html,
          beforeSnapshot: before,
          afterSnapshot: outcome.snapshot,
          guarded: true,
        };
        state.targetSnapshot = outcome.snapshot;
        state.targetStale = false;
        panel.undo(true);
        selection.focus(outcome.range.start, outcome.range.end - outcome.range.start);
        return true;
      }
      const position = selection.find(item, from);
      if (position < 0) {
        selection.miss(button);
        return false;
      }
      const fix = match.fix(index);
      const after =
        textarea.value.slice(0, position) +
        fix +
        textarea.value.slice(position + item.word.length);
      state.undo = {
        type: "apply",
        before: textarea.value,
        after,
      };
      panel.undo(true);
      domField.set(textarea, after);
      text.emit();
      selection.focus(position, fix.length);
      return true;
    },
    consume(index) {
      const item = state.visible[index];
      if (!item) return false;
      const key = text.key(item);
      const lists = [state.matches].concat(Object.values(state.rejected || {}));
      let remaining = false;
      lists.forEach((list) => {
        if (!Array.isArray(list)) return;
        const position = list.findIndex(
          (value) => value === item || text.key(value) === key,
        );
        if (position < 0) return;
        const count = Math.max(0, (Number(list[position].count) || 1) - 1);
        if (count > 0) {
          list[position] = { ...list[position], count };
          remaining = true;
          return;
        }
        list.splice(position, 1);
      });
      return remaining;
    },
    ignore(index) {
      const item = state.visible[index];
      const row = panel.row(index);
      if (!item || !row) return;
      const from = state.textarea.selectionEnd;
      const key = text.key(item);
      const same = (value) => text.key(value) === key;
      state.ignored.add(key);
      row.remove();
      panel.refreshTitle();
      panel.activateNext(null, from, same);
    },
  };
  const decision = {
    add(item, outcome, applied = "") {
      if (!item) return "";
      const id = `${Date.now()}-${state.evaluation.decisions.length + 1}`;
      const entry = {
        id,
        at: new Date().toISOString(),
        outcome,
        provider: item.source,
        before: String(item.word || ""),
        suggested: String(item.fix || ""),
        applied: String(applied || ""),
        reason: String(item.message || ""),
        confidence: Number(item.confidence) || 0,
      };
      state.evaluation.decisions.push(entry);
      auditTelemetry.record("suggestion.decision", { run_id: auditTelemetry.activeRun, decision: entry, customized: outcome === "accepted" && entry.applied !== entry.suggested });
      return id;
    },
    remove(id = "") {
      if (!id) return;
      state.evaluation.decisions = state.evaluation.decisions.filter(
        (item) => item.id !== id,
      );
    },
  };
  const action = {
    bind(selector, handler) {
      state.panel.querySelectorAll(selector).forEach((node) => {
        node.onclick = () => {
          if (node.closest?.("[data-audit-actions]")) ux.icon.press(node);
          handler(node);
        };
      });
    },
    goActive(button) {
      const row = panel.active() || state.panel.querySelector("[data-row]");
      const index = row?.dataset.row;
      const from = state.textarea.selectionEnd;
      if (index === undefined) return;
      if (panel.activate(index, button, from)) return;
      row?.remove();
      panel.refreshTitle();
      panel.activateNext(null, from);
    },
    activateRow(row, { focus = true } = {}) {
      const index = row?.dataset.row;
      const from = state.textarea.selectionEnd;
      if (index === undefined) return;
      const button = row.querySelector("[data-go]");
      const active = focus
        ? panel.activate(index, button, from)
        : panel.highlight(index) && selection.preview(state.visible[index], from);
      if (active) return;
      row.remove();
      panel.refreshTitle();
      panel.activateNext(null, from);
    },
    click(event) {
      const button = event.target.closest("[data-search],[data-fix],[data-ok]");
      if (button && state.list.contains(button)) {
        ux.icon.press(button);
        if (button.matches("[data-search]")) action.search(button);
        if (button.matches("[data-fix]")) action.fix(button);
        if (button.matches("[data-ok]")) action.ignore(button);
        return;
      }
      if (event.target.closest("button,select,input,a")) return;
      const row = event.target.closest("[data-row]");
      if (row && state.list.contains(row)) action.activateRow(row);
    },
    search(button) {
      const index = button.dataset.search;
      const item = state.visible[index];
      panel.activate(index, button);
      text.copy(item.word);
      const query = encodeURIComponent(item.word);
      selection.flash(button, "blue");
      window.open(`https://www.google.com/search?q=${query}`, "_blank");
    },
    fix(button) {
      const index = button.dataset.fix;
      const row = panel.row(index);
      if (!row) return;
      if (panel.active() !== row && !panel.activate(index, button)) return;
      const item = state.visible[index];
      const applied = match.fix(index);
      if (!match.apply(index, button, state.textarea.selectionStart)) return;
      state.undo.decision = decision.add(item, "accepted", applied);
      const from = state.textarea.selectionEnd;
      const remaining = match.consume(index);
      selection.flash(button, "green");
      setTimeout(() => {
        if (item.targetStatus) {
          panel.render();
          return;
        }
        if (remaining) {
          panel.render();
          panel.activate(index, button, from);
          return;
        }
        row.remove();
        panel.refreshTitle();
        panel.activateNext(row, from);
      }, 220);
    },
    ignore(button) {
      const index = button.dataset.ok;
      const item = state.visible[index];
      const row = button.closest("[data-row]");
      if (!item || !row) return;
      const from = state.textarea.selectionEnd;
      const key = text.key(item);
      const same = (value) => text.key(value) === key;
      const next = panel.next(row, same);
      state.undo = {
        type: "ignore",
        key,
        row: row.cloneNode(true),
        next: row.nextElementSibling,
        decision: decision.add(item, "dismissed"),
        targeted: Boolean(item.targetStatus),
      };
      panel.undo(true);
      state.ignored.add(key);
      selection.flash(button, "green");
      setTimeout(() => {
        if (item.targetStatus) {
          panel.render();
          return;
        }
        row.remove();
        panel.refreshTitle();
        panel.activateNext(next, from, same);
      }, 220);
    },
    undo() {
      const undo = state.undo;
      if (!undo) return;
      if (undo.type === "apply") {
        if (undo.guarded) {
          const outcome = proposalTarget.restore(
            undo.beforeSnapshot,
            undo.afterSnapshot,
          );
          if (outcome.status !== "restored") {
            state.targetStale = true;
            panel.render();
            return;
          }
          state.targetSnapshot = outcome.snapshot;
          state.targetStale = false;
        } else {
          domField.input(state.textarea, undo.before);
        }
      }
      if (undo.type === "ignore") {
        state.ignored.delete(undo.key);
        if (undo.targeted) {
          panel.render();
        } else {
          if (undo.next?.parentNode) {
            undo.next.before(undo.row);
          } else {
            state.list.appendChild(undo.row);
          }
          panel.rows().forEach((item) => item.removeAttribute("data-active"));
          undo.row.dataset.active = "true";
          bind.actions();
          const index = undo.row.dataset.row;
          const button = undo.row.querySelector("[data-fix]");
          panel.activate(index, button, state.textarea.selectionEnd);
        }
      }
      if (undo.decision) auditTelemetry.record("suggestion.undo", { run_id: auditTelemetry.activeRun, decision_id: undo.decision, undo_type: undo.type });
      decision.remove(undo.decision);
      state.undo = null;
      panel.undo(false);
      if (undo.guarded) panel.render();
      else panel.refreshTitle();
    },
    configure() {
      const agents = mode.agents();
      const providerName = prompt(
        `Агент: ${agents.map((item) => item.id).join(", ")}`,
        mode.agent()?.id || state.provider,
      );
      if (providerName == null) return;
      const provider = mode.setProvider(providerName);
      state.view = new Set([provider]);
      panel.syncAgent();
      panel.render();
      if (!mode.providers().includes(provider)) return;
      const current = storage.key.read(provider);
      const name = storage.key.label(provider);
      if (!current && state.keyPrompted.has(provider)) return;
      if (!current) state.keyPrompted.add(provider);
      if (!current) storage.key.open(provider);
      const label = current
        ? `API-ключ для ${name} уже сохранён. Дай другой или ничего не трогай, чтоб оставить текущий`
        : `Вставь API-ключ для ${name}`;
      const value = prompt(label, "");
      if (value == null) return;
      if (String(value || "").trim()) storage.key.write(value, provider);
    },
  };
  const keyboard = {
    editable(event) {
      return Boolean(
        event.target?.closest?.("input,textarea,select,[contenteditable='true']"),
      );
    },
    active() {
      if (!state.panel?.isConnected) return null;
      if (state.panel.dataset.done === "false") return null;
      return panel.active() || state.panel.querySelector("[data-row]");
    },
    row(step = 1) {
      const rows = panel.rows();
      if (!rows.length) return false;
      const active = keyboard.active();
      const index = rows.indexOf(active);
      const next = rows[Math.max(0, Math.min(rows.length - 1, index + step))];
      if (!next || next === active) return false;
      action.activateRow(next);
      return true;
    },
    button(selector = "") {
      const row = keyboard.active();
      const button = row?.querySelector(selector);
      if (!button) return false;
      button.click();
      return true;
    },
    input() {
      const row = keyboard.active();
      const select = row?.querySelector("[data-select]");
      if (!select) return false;
      domField.set(select, "__other__");
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    },
    select() {
      const row = keyboard.active();
      const select = row?.querySelector("[data-select]");
      if (!select) return false;
      select.focus({ preventScroll: true });
      select.dataset.auditSelectOpen = "true";
      action.activateRow(row, { focus: false });
      select.showPicker?.();
      return true;
    },
    close() {
      const button = state.panel?.querySelector('[data-action="audit-close"]');
      if (!button) return false;
      button.click();
      return true;
    },
    command(event) {
      if (ux.hotkeys.action.close.match(event)) return keyboard.close;
      const command = ux.hotkeys.audit.command(event, {
        editable: keyboard.editable(event),
      });
      return {
        previous: () => keyboard.row(-1),
        next: () => keyboard.row(1),
        search: () => keyboard.button("[data-search]"),
        ok: () => keyboard.button("[data-ok]"),
        fix: () => keyboard.button("[data-fix]"),
        input: keyboard.input,
        select: keyboard.select,
      }[command] || null;
    },
    run(event) {
      if (event.defaultPrevented) return false;
      if (!state.panel?.isConnected) return false;
      const command = keyboard.command(event);
      if (!command) return false;
      event.preventDefault();
      event.stopPropagation?.();
      event.stopImmediatePropagation?.();
      return Boolean(command());
    },
  };
  const bind = {
    head() {
      state.headObserver?.disconnect();
      if (typeof ResizeObserver !== "function" || !state.panel) return;
      state.headObserver = new ResizeObserver(() => layout.syncHead());
      state.headObserver.observe(state.panel);
    },
    list() {
      const list = state.list;
      if (!list) return;
      state.listObserver?.disconnect();
      const observer = new MutationObserver(() => {
        if (state.fitFrame) cancelAnimationFrame(state.fitFrame);
        state.fitFrame = requestAnimationFrame(() => {
          state.fitFrame = null;
          layout.fit();
        });
      });
      observer.observe(list, { childList: true });
      state.listObserver = observer;
    },
    scroll() {
      const list = state.list;
      if (!list) return;
      const measureRows = () =>
        ui.surface.rows.measure(state.panel, list, {
          rowSelector: "[data-row]",
          rowHeightVar: "--audit-row-box-height",
          rowBorderVar: "--audit-row-border-width",
          rowGapVar: "--audit-row-stack-gap",
        });
      const snapLater = (delay = 180) => {
        clearTimeout(state.scrollSnapTimer);
        state.scrollSnapTimer = setTimeout(() => layout.snapScroll(), delay);
      };
      list.onwheel = (event) => {
        if (layout.loading()) return;
        const measure = measureRows();
        if (!measure.step) return;
        event.preventDefault();
        const direction = event.deltaY < 0 ? -1 : 1;
        const visible = Math.max(1, state.rowsVisible || 1);
        const maxIndex = Math.max(0, layout.rows() - visible);
        const current = Math.round((list.scrollTop || 0) / measure.step);
        const index = Math.max(0, Math.min(maxIndex, current + direction));
        const top = index * measure.step;
        if (Math.abs(top - (list.scrollTop || 0)) < 1) return;
        list.scrollTo({ top, behavior: "smooth" });
        snapLater(220);
      };
      list.onscroll = () => snapLater();
    },
    resize() {
      const handle = state.panel?.querySelector('[data-audit-resize="true"]');
      if (!handle) return;
      handle.onpointerdown = (event) => {
        if (event.button !== undefined && event.button !== 0) return;
        if (layout.loading()) return;
        event.preventDefault();
        event.stopPropagation();
        state.resize = {
          pointerId: event.pointerId,
        };
        state.panel.dataset.resizing = "true";
        handle.setPointerCapture?.(event.pointerId);
        const move = (current) => {
          if (!state.resize) return;
          current.preventDefault();
          layout.resize(current.clientY);
        };
        const clear = (current) => {
          if (!state.resize) return;
          handle.releasePointerCapture?.(current?.pointerId || event.pointerId);
          window.removeEventListener("pointermove", move, true);
          window.removeEventListener("pointerup", clear, true);
          window.removeEventListener("pointercancel", clear, true);
          delete state.panel.dataset.resizing;
          state.resize = null;
          layout.fit();
          layout.snapScroll();
        };
        window.addEventListener("pointermove", move, true);
        window.addEventListener("pointerup", clear, true);
        window.addEventListener("pointercancel", clear, true);
      };
    },
    selects() {
      const ensureCustomOption = (select, value) => {
        const clean = String(value || "").trim();
        const current = select.querySelector('option[value="__custom__"]');
        if (!clean) {
          current?.remove();
          delete select.dataset.custom;
          return;
        }
        select.dataset.custom = clean;
        const label = clean;
        if (current) {
          current.textContent = label;
          return;
        }
        const option = document.createElement("option");
        option.value = "__custom__";
        option.textContent = label;
        select.insertBefore(option, select.firstChild);
      };
      const clearSelectHover = (activeSelect = null) => {
        state.panel.querySelectorAll("[data-select]").forEach((select) => {
          if (select === activeSelect) return;
          delete select.dataset.auditSelectOpen;
        });
      };
      state.panel.querySelectorAll("[data-select]").forEach((select) => {
        const keepSelectHover = () => {
          clearSelectHover(select);
          select.dataset.auditSelectOpen = "true";
          action.activateRow(select.closest("[data-row]"), { focus: false });
        };
        const clearCurrentSelectHover = () => {
          delete select.dataset.auditSelectOpen;
        };
        select.onpointerdown = keepSelectHover;
        select.onblur = clearCurrentSelectHover;
        select.onkeydown = (event) => {
          if (!["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) return;
          keepSelectHover();
        };
        select.onchange = () => {
          clearCurrentSelectHover();
          const index = select.dataset.select;
          const input = state.panel.querySelector(`[data-input="${index}"]`);
          const box = select.closest(".audit-field-box");
          if (!input) return;
          if (select.value !== "__other__") {
            const label =
              select.selectedOptions?.[0]?.textContent || select.value;
            select.title = ux.hotkeys.tooltip(
              label,
              ux.hotkeys.audit.label("select"),
            );
            if (box) box.dataset.auditInput = "false";
            select.style.display = "";
            input.style.display = "none";
            if (select.value !== "__custom__") {
              delete select.dataset.custom;
              select.querySelector('option[value="__custom__"]')?.remove();
            }
            return;
          }
          if (box) box.dataset.auditInput = "true";
          select.style.display = "none";
          input.style.display = "inline-block";
          domField.set(input, select.dataset.custom || state.visible[index].word);
          input.title = input.value;
          input.oninput = () => {
            input.title = input.value;
          };
          input.focus();
          const caret = input.value.length;
          input.setSelectionRange?.(caret, caret);
          input.onblur = () => {
            const value = String(input.value || "").trim();
            if (!value) {
              const fallback = select.dataset.default || "";
              const next =
                [...select.options].find((option) => option.value === fallback)
                  ?.value || fallback;
              if (next) {
                domField.set(select, next);
                const label = select.selectedOptions?.[0]?.textContent || next;
                select.title = label;
              }
              if (box) box.dataset.auditInput = "false";
              input.style.display = "none";
              select.style.display = "";
              return;
            }
            domField.set(input, value);
            input.title = value;
            ensureCustomOption(select, value);
            domField.set(select, "__custom__");
            const label = select.selectedOptions?.[0]?.textContent || value;
            select.title = label;
            if (box) box.dataset.auditInput = "false";
            input.style.display = "none";
            select.style.display = "";
          };
        };
      });
    },
    actions() {
      action.bind("[data-go-active]", action.goActive);
      action.bind("[data-undo]", action.undo);
      state.list.onclick = action.click;
      state.panel.querySelectorAll("[data-download]").forEach((button) => {
        button.onclick = file.run;
      });
    },
  };
  const file = {
    postId() {
      try {
        const query = new URLSearchParams(window.location.search || "");
        const post = String(
          query.get("post") || query.get("post_id") || "",
        ).trim();
        return /^\d+$/.test(post) ? post : "unknown";
      } catch {
        return "unknown";
      }
    },
    name(value, ext) {
      return `audit-${value}-post_${file.postId()}.${ext}`;
    },
    evalName() {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      return `audit-eval-post_${file.postId()}-${stamp}.json`;
    },
    save(name, value, type = "application/json;charset=utf-8") {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([value], { type }));
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    },
    async saveAs(name, value, type = "application/json;charset=utf-8") {
      if (typeof window.showSaveFilePicker !== "function") {
        file.save(name, value, type);
        return;
      }
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: name,
          types: [{
            description: "JSON",
            accept: { "application/json": [".json"] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(value);
        await writable.close();
      } catch (error) {
        if (error?.name !== "AbortError") file.save(name, value, type);
      }
    },
    build() {
      return {
        view: state.view,
        model: state.model,
        plain: state.plain,
        chunks: state.chunks,
        debug: state.debug,
        matches: state.matches,
        rejected: state.rejected,
        visible: state.visible,
      };
    },
    readUsage() {
      const entry = state.debug
        .filter((item) => item.source === "llm")
        .slice(-1)[0];
      try {
        const value = JSON.parse(entry?.raw || "{}");
        const usage = value.usageMetadata || value.usage || {};
        return {
          inputTokens: Number(
            usage.promptTokenCount ?? usage.prompt_tokens,
          ) || null,
          outputTokens: Number(
            usage.candidatesTokenCount ?? usage.completion_tokens,
          ) || null,
        };
      } catch {
        return { inputTokens: null, outputTokens: null };
      }
    },
    buildEvaluation() {
      const prompt = editorialPrompt.audit.build(state.plain);
      const output = editorialPrompt.audit.normalize(state.result);
      return {
        schema: "onliner.prompt-eval-observation/v1",
        capturedAt: new Date().toISOString(),
        task: {
          id: editorialPrompt.audit.id,
          revision: editorialPrompt.audit.revision,
        },
        prompt: {
          hash: result.key(prompt),
          hashAlgorithm: "fnv1a32-base36",
          compiled: prompt,
        },
        execution: {
          provider: state.provider,
          model: state.model,
          startedAt: state.evaluation.startedAt,
          completedAt: state.evaluation.completedAt,
          usage: file.readUsage(),
        },
        context: {
          postId: file.postId(),
          url: location.href,
        },
        input: {
          text: state.plain,
          sourceKey: result.key(state.plain),
        },
        output,
        suggestions: {
          generated: state.evaluation.generated,
          presented: state.evaluation.presented,
        },
        review: {
          decisions: state.evaluation.decisions,
          finalText: state.textarea?.value || "",
        },
        debug: state.debug.filter((item) => item.source === "llm"),
      };
    },
    write(value) {
      if (value === "eval") {
        return file.saveAs(
          file.evalName(),
          JSON.stringify(file.buildEvaluation(), null, 2),
        );
      }
      if (value === "text") {
        file.save(
          file.name("text", "txt"),
          state.plain,
          "text/plain;charset=utf-8",
        );
        return;
      }
      if (value === "all") {
        file.save(
          file.name("all", "json"),
          JSON.stringify(file.build(), null, 2),
        );
        return;
      }
      file.save(
        file.name("debug", "json"),
        JSON.stringify({ chunks: state.chunks, debug: state.debug }, null, 2),
      );
    },
    run() {
      try {
        Promise.resolve(
          file.write(prompt("Что скачать: eval/text/debug/all?", "eval")),
        ).catch(() => false);
      } catch {}
    },
  };
  const session = {
    reset() {
      state.session += 1;
      state.matches = [];
      state.rejected = { languagetool: [] };
      state.visible = [];
      state.debug = [];
      state.evaluation = {
        startedAt: "",
        completedAt: "",
        generated: [],
        presented: [],
        decisions: [],
      };
      state.prefetched = {};
      state.prefetching = {};
      state.placement = config.placement.initial;
      state.targetSnapshot = null;
      state.targetStale = false;
      view.source.enabled = mode.config();
      state.checkedSources = new Set();
      state.sourceMode = { languagetool: "normal" };
      state.checked = false;
      state.progress = 0;
      state.running = false;
    },
    active(value) {
      return value === state.session;
    },
  };
  const review = {
    open({ snapshot, plain = "", provider = "gemini", model = "", loading = false, placement = config.placement.initial } = {}) {
      shell.closeCurrent();
      session.reset();
      cms.editor.html();
      const textarea = document.querySelector("#content");
      if (!textarea || !snapshot?.html) return false;
      state.textarea = textarea;
      state.targetSnapshot = snapshot;
      state.plain = String(plain || "");
      state.provider = provider;
      state.engine = provider;
      state.view = new Set([provider]);
      state.checkedSources = new Set([provider]);
      state.checked = true;
      state.running = loading;
      state.model = model;
      state.placement = placement;
      panel.create();
      panel.model(model);
      if (!loading) {
        panel.render();
        return true;
      }
      state.panel.dataset.done = "false";
      state.panel.dataset.loading = "true";
      state.panel.dataset.loadingSource = provider;
      panel.status(provider);
      wait.start();
      return true;
    },
    present(items = [], { model = "" } = {}) {
      if (!state.panel?.isConnected) return false;
      state.running = false;
      state.model = model || state.model;
      state.matches = Array.isArray(items) ? items.slice() : [];
      state.evaluation.generated = state.matches.map((item) => ({ ...item }));
      state.evaluation.presented = state.matches.map((item) => ({ ...item }));
      panel.model(state.model);
      panel.render();
      return true;
    },
    error(error) {
      if (!state.panel?.isConnected) return false;
      state.running = false;
      state.panel.dataset.loading = "false";
      delete state.panel.dataset.loadingSource;
      panel.error(error instanceof Error ? error : new Error(String(error || "Ошибка")));
      return true;
    },
  };
  const prepare = {
    prepare(options = {}) {
      shell.closeCurrent();
      session.reset();
      cms.editor.html();
      const textarea = document.querySelector("#content");
      if (!textarea) return false;
      state.textarea = textarea;
      text.decode();
      state.targetSnapshot = proposalTarget.snapshot(textarea.value);
      state.plain = text.plain();
      state.chunks = text.split(state.plain);
      state.placement = String(options.placement || config.placement.initial);
      panel.create();
      state.provider = mode.provider();
      state.engine = mode.source();
      state.view = new Set([state.engine]);
      return true;
    },
  };
  const app = {
    prepareLlm(name = mode.provider()) {
      if (!view.source.active(name)) return;
      state.provider = name;
      try {
        storage.key.ensure(name);
      } catch {
        view.source.enabled[name] = false;
        view.source.update();
      }
    },
    cached(name = "") {
      const cached = state.prefetched[name];
      if (!cached || cached.sourceKey !== result.key(state.plain)) return null;
      return cached.value;
    },
    load(name = "") {
      const cached = app.cached(name);
      if (cached) return Promise.resolve(cached);
      const pending = state.prefetching[name];
      if (pending?.sourceKey === result.key(state.plain)) {
        return pending.promise.then((value) => value || data.run(name));
      }
      return data.run(name);
    },
    prefetch(name = "languagetool") {
      if (!view.source.active(name)) return Promise.resolve(false);
      const sourceKey = result.key(state.plain);
      if (app.cached(name)) return Promise.resolve(true);
      if (state.prefetching[name]?.sourceKey === sourceKey) {
        return state.prefetching[name].promise;
      }
      const currentSession = state.session;
      const runId = auditTelemetry.id();
      const startedAt = new Date().toISOString();
      const promise = data
        .run(name, { debug: false, progress: false })
        .then((value) => {
          if (!session.active(currentSession)) return false;
          state.prefetched[name] = { sourceKey, value };
          auditTelemetry.record("run.prefetched", {
            run_id: runId,
            provider: name,
            model: null,
            task: "languagetool.check",
            prompt_revision: null,
            started_at: startedAt,
            completed_at: new Date().toISOString(),
            input_text: state.plain,
            generated: (value.items || []).map((item) => ({ ...item })),
            filtered: (value.rejected || []).map((item) => ({ ...item })),
            presented: [],
            background: true,
          });
          return value;
        })
        .catch((error) => {
          if (session.active(currentSession)) {
            auditTelemetry.record("run.prefetch_failed", {
              run_id: runId,
              provider: name,
              started_at: startedAt,
              error: String(error?.message || error),
            });
          }
          return null;
        })
        .finally(() => {
          if (state.prefetching[name]?.promise === promise) {
            delete state.prefetching[name];
          }
        });
      state.prefetching[name] = { sourceKey, promise };
      return promise;
    },
    check(name = "languagetool") {
      if (state.running) return Promise.resolve(false);
      const currentSession = state.session;
      const runId = auditTelemetry.id();
      const startedAt = new Date().toISOString();
      const debugStart = state.debug.length;
      auditTelemetry.activeRun = runId;
      state.panel.dataset.toolsReady = "false";
      state.panel.dataset.loading = "true";
      state.panel.dataset.loadingSource = name;
      progress.reset();
      if (mode.providers().includes(name)) app.prepareLlm(name);
      state.running = true;
      state.checked = true;
      if (mode.providers().includes(name)) {
        state.evaluation = {
          startedAt: new Date().toISOString(),
          completedAt: "",
          generated: [],
          presented: [],
          decisions: [],
        };
      }
      panel.model("");
      panel.status(name);
      wait.start();
      return app
        .load(name)
        .then((result) => {
          if (!session.active(currentSession)) return;
          state.matches = data.filter(state.matches.concat(result.items || []));
          if (name === "languagetool") {
            const accepted = new Set(
              state.matches
                .filter((item) => item.source === "languagetool")
                .map((item) => text.key(item)),
            );
            state.rejected[name] = data.group(
              (result.rejected || []).filter(
                (item) => !accepted.has(text.key(item)),
              ),
            );
          } else {
            state.rejected[name] = data.filter(result.rejected || []);
          }
          if (mode.providers().includes(name)) {
            state.evaluation.generated = (result.items || []).map((item) => ({
              ...item,
            }));
            state.evaluation.presented = state.matches
              .filter((item) => item.source === name)
              .map((item) => ({ ...item }));
            state.evaluation.completedAt = new Date().toISOString();
          }
          const generated = (result.items || []).map((item) => ({ ...item }));
          const filtered = (result.rejected || []).map((item) => ({ ...item }));
          const presented = state.matches.filter((item) => item.source === name).map((item) => ({ ...item }));
          const presentedKeys = new Set(presented.map((item) => text.key(item)));
          const runtimeFiltered = generated.filter((item) => !presentedKeys.has(text.key(item)));
          auditTelemetry.record("run", {
            run_id: runId, provider: name,
            model: name === "languagetool" ? null : state.model,
            task: name === "languagetool" ? "languagetool.check" : editorialPrompt.audit.id,
            prompt_revision: name === "languagetool" ? null : editorialPrompt.audit.revision,
            started_at: startedAt, completed_at: new Date().toISOString(),
            input_text: state.plain,
            generated, filtered, presented, runtime_filtered: runtimeFiltered,
            raw_provider_debug: state.debug.slice(debugStart),
            note: "runtime_filtered inferred by matching displayed suggestions; it may include grouping/deduplication",
          });
          state.checkedSources.add(name);
          state.view.add(name);
          panel.render();
          return true;
        })
        .catch((error) => {
          if (!session.active(currentSession)) return;
          auditTelemetry.record("run.failed", { run_id: runId, provider: name, started_at: startedAt, error: String(error?.message || error) });
          panel.error(error);
          return false;
        })
        .finally(() => {
          if (!session.active(currentSession)) return;
          progress.done();
          state.running = false;
          state.panel.dataset.loading = "false";
          delete state.panel.dataset.loadingSource;
        });
    },
    checks(names = []) {
      return names.reduce(
        (promise, name) =>
          promise.then((passed) =>
            app.check(name).then((checked) => passed && checked === true)
          ),
        Promise.resolve(true),
      );
    },
    sources(options = {}) {
      if (!Array.isArray(options.sources)) return [];
      const available = new Set([
        ...(config.languagetool ? ["languagetool"] : []),
        ...mode.providers(),
      ]);
      return options.sources.filter((name) => available.has(name));
    },
    backgroundSources(options = {}) {
      if (Array.isArray(options.backgroundSources)) {
        return app.sources({ sources: options.backgroundSources });
      }
      return config.languagetool ? ["languagetool"] : [];
    },
    run(options = {}) {
      if (!prepare.prepare(options)) return false;
      const sources = app.sources(options);
      if (sources.length) {
        mode.setProvider(sources[0]);
        state.view = new Set([state.engine]);
        panel.syncAgent();
      }
      panel.render();
      app.backgroundSources(options).forEach((name) => app.prefetch(name));
      const completion = sources.length
        ? new Promise((resolve) =>
            requestAnimationFrame(() => resolve(app.checks(sources)))
          )
            .then((checked) => {
              if (
                checked &&
                options.closeEmpty === true &&
                view.source.visible().length === 0
              ) {
                action.close();
              }
              return checked;
            })
            .catch(() => false)
        : Promise.resolve(true);
      return options.waitForChecks === true ? completion : true;
    },
    suggestSlug(value = "", options = {}) {
      const source = contentMarkup.strip(
        String(value || field.element("#content")?.value || ""),
      ).trim();
      if (!source) return Promise.resolve("");
      const prompt = editorialPrompt.audit.build(source);
      const preview = prompt.replace(
        /\n\s*Текст:\s*[\s\S]*$/i,
        "\n\nТекст:\n\n[ARTICLE TEXT HIDDEN]",
      );
      if (options.debug !== false) alert(preview);
      return result.get(source).then((value) =>
        String(value?.slug?.text || "").trim(),
      );
    },
    suggestExcerpt(value = "") {
      const source = contentMarkup.strip(
        String(value || field.element("#content")?.value || ""),
      ).trim();
      if (!source) return Promise.resolve("");
      return result.get(source).then((value) =>
        String(value?.excerpt?.text || "").trim(),
      );
    },
  };
  const audit = {
    text: {
      id,
      state,
      text,
      storage,
      provider,
      data,
      result,
      target: proposalTarget,
      review,
      view,
      layout,
      row,
      shell,
      panel,
      selection,
      match,
      wait,
      action,
      bind,
      file,
      prepare,
      app,
      check: app.check,
      run: app.run,
      suggestSlug: app.suggestSlug,
      suggestExcerpt: app.suggestExcerpt,
    },
  };
  return {
    audit,
  };
};
