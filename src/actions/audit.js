import { cms } from "../core/cms.js";
import { panel as frame } from "../core/surface/panel.js";
import { css } from "../core/surface/css.js";
import { toolbar } from "../core/surface/toolbar.js";
import { icon } from "../core/surface/icon.js";
import { ui } from "../core/surface/ui.js";
import { widget } from "../core/widget.js";
import { markup as contentMarkup } from "../pipe/markup.js";

export const createAudit = () => {
  const config = {
    languagetool: true,
    qwen: true,
    gemini: false,
    launch: {
      startLtOnInit: true,
    },
  };
  const model = {
    qwen: ["qwen3.5-flash"],
    gemini: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"],
  };
  const mode = {
    providers() {
      return ["qwen", "gemini"].filter((name) => config[name]);
    },
    provider() {
      return mode.providers()[0] || "qwen";
    },
    llm() {
      return mode.providers().length > 0;
    },
  };
  const id = {
    skin: "audit-style",
  };
  const state = {
    ignored:
      window.auditIgnored ??
      (window.auditIgnored = window.proofreadIgnored ?? window.ltIgnored ?? new Set()),
    textarea: null,
    panel: null,
    list: null,
    undo: null,
    plain: "",
    chunks: [],
    matches: [],
    visible: [],
    view: new Set(["languagetool"]),
    drag: null,
    resize: null,
    rowsVisible: 5,
    rowsTarget: 5,
    rowsCompact: false,
    waitTimer: null,
    waitStep: 0,
    listObserver: null,
    tabObserver: null,
    fitFrame: null,
    running: false,
    checked: false,
    progress: 0,
    model: [],
    provider: mode.provider(),
    checkedSources: new Set(),
    debug: [],
    controller: null,
  };
  const proofread = {
    control: {
      close: "cross-mark",
      marker: "nazar-amulet",
    },
    source: {
      google: "google",
      languagetool: "languagetool",
    },
    provider: {
      gemini: "gemini",
      qwen: "qwen",
    },
    theme(value) {
      return icon.theme(value);
    },
    icon(name) {
      return icon.emoji(proofread.control[name] || name);
    },
    logo(name, className = "") {
      const key = proofread.source[String(name || "").toLowerCase()] || "";
      if (!key) return "";
      return icon.logo(key, name, className);
    },
    llm(name, className = "") {
      const key = proofread.provider[String(name || "").toLowerCase()] || "";
      if (!key) return "";
      return icon.logo(key, name, className);
    },
    status(name, providerName, className = "") {
      if (String(name || "").toLowerCase() === "llm") {
        return proofread.llm(providerName, className);
      }
      return proofread.logo(name, className);
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
    message(value) {
      const message = String(value || "").trim();
      return message === "Возможно найдена орфографическая ошибка."
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
        textarea.value = value;
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
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.dispatchEvent(new Event("change", { bubbles: true }));
    },
    decode() {
      const { textarea } = state;
      const source = textarea.value;
      const result = widget.decode.run(source, contentMarkup.clean);
      if (result === source) return;
      textarea.value = result;
      text.emit();
    },
    split(value) {
      const result = [];
      const limit = 8000;
      let rest = value;
      while (rest.length > limit) {
        let cut = rest.lastIndexOf("\n\n", limit);
        if (cut < limit * 0.5) cut = rest.lastIndexOf("\n", limit);
        if (cut < limit * 0.5) cut = rest.lastIndexOf(" ", limit);
        if (cut < limit * 0.5) cut = limit;
        result.push(rest.slice(0, cut));
        rest = rest.slice(cut).replace(/^\s+/, "");
      }
      if (rest) result.push(rest);
      return result;
    },
    plain() {
      return contentMarkup.strip(state.textarea.value);
    },
    key(match) {
      return `${match.word}|${match.message}`;
    },
  };
  const storage = {
    key: {
      prefix: "audit-key-",
      legacyPrefix: "proofread-key-",
      legacy: "proofread-qwen-key",
      build(provider = state.provider) {
        return `${storage.key.prefix}${provider}`;
      },
      legacyBuild(provider = state.provider) {
        return `${storage.key.legacyPrefix}${provider}`;
      },
      read(provider = state.provider) {
        const value = localStorage.getItem(storage.key.build(provider));
        if (value) return value;
        const legacy = localStorage.getItem(storage.key.legacyBuild(provider));
        if (legacy) return legacy;
        if (provider === "qwen")
          return localStorage.getItem(storage.key.legacy) || "";
        return "";
      },
      write(value, provider = state.provider) {
        localStorage.setItem(
          storage.key.build(provider),
          String(value || "").trim(),
        );
      },
      ensure(provider = state.provider) {
        const value = storage.key.read(provider);
        if (value) return value;
        const input = prompt(`Вставь API-ключ для ${provider}`);
        if (!input) throw new Error("API-ключ не указан.");
        storage.key.write(input, provider);
        return input;
      },
    },
    model: {
      prefix: "audit-models-",
      legacyPrefix: "proofread-models-",
      build(provider = state.provider) {
        return `${storage.model.prefix}${provider}`;
      },
      legacyBuild(provider = state.provider) {
        return `${storage.model.legacyPrefix}${provider}`;
      },
      parse(value) {
        return String(value || "")
          .split(",")
          .map((model) => model.trim())
          .filter(Boolean);
      },
      read(provider = state.provider) {
        const value = localStorage.getItem(storage.model.build(provider));
        const models = storage.model.parse(value);
        if (models.length) return models;
        const legacy = localStorage.getItem(storage.model.legacyBuild(provider));
        const legacyModels = storage.model.parse(legacy);
        return legacyModels.length ? legacyModels : model[provider] || [];
      },
      write(value, provider = state.provider) {
        localStorage.setItem(
          storage.model.build(provider),
          storage.model.parse(value).join(","),
        );
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
    clean(value) {
      const string = String(value || "")
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      const start = string.indexOf("{");
      const end = string.lastIndexOf("}");
      if (start < 0 || end < 0) return '{"edits":[]}';
      return string.slice(start, end + 1);
    },
    prompt(value) {
      return [
        "Ты НЕ редактор. Ты ТОЛЬКО корректор.",
        "Нужно найти только бесспорные технические ошибки в русском тексте.",
        "Разрешено исправлять только:",
        "- опечатки;",
        "- явные орфографические ошибки;",
        "- явные грамматические ошибки;",
        "- явные ошибки согласования;",
        "- неверное слово, если оно очевидно появилось из-за опечатки;",
        "- только грубые пунктуационные опечатки вроде двух точек подряд: слово.. → слово.",
        "Строго запрещено:",
        "- улучшать стиль;",
        "- заменять разговорные слова на нейтральные;",
        "- убирать слова вроде же, ведь, вообще, сперва;",
        "- менять тире на двоеточие или запятую ради вкуса;",
        "- добавлять точки в конец фрагмента, если в исходном тексте после этого фрагмента уже стоит знак препинания;",
        "- предлагать правку, если before и after отличаются только стилистически.",
        "Верни только валидный JSON без markdown.",
        "Формат:",
        '{"edits":[{"before":"точная подстрока из текста","after":"минимальное исправление","reason":"кратко","confidence":0.95}]}',
        "Правила:",
        "- before должен быть точной подстрокой исходного текста;",
        "- after должен быть минимальным исправлением ошибки;",
        "- если сомневаешься — не добавляй правку;",
        '- если ошибок нет, верни {"edits":[]}.',
        "Текст:",
        value,
      ].join("\n\n");
    },
    adapter: {
      gemini: {
        label: "Gemini",
        link(model) {
          const key = storage.key.ensure("gemini");
          return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        },
        authorize() {
          return { "Content-Type": "application/json" };
        },
        compose(model, value) {
          return JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: provider.prompt(value) }],
              },
            ],
            generationConfig: {
              temperature: 0,
              responseMimeType: "application/json",
            },
          });
        },
        extract(value) {
          return value.candidates?.[0]?.content?.parts?.[0]?.text;
        },
        retry(value) {
          const code = value.error?.code;
          return code === 503 || code === 429;
        },
        describe(value, model) {
          const code = value.error?.code;
          if (code === 503) return `${model}: перегружен`;
          if (code === 429) return `${model}: превышен лимит`;
          if (code === 400) return `${model}: некорректный запрос`;
          return value.error?.message || `${model}: ошибка Gemini API`;
        },
      },
      qwen: {
        label: "Qwen",
        link() {
          return "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
        },
        authorize() {
          const key = storage.key.ensure("qwen");
          return {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          };
        },
        compose(model, value) {
          return JSON.stringify({
            model,
            messages: [
              {
                role: "user",
                content: provider.prompt(value),
              },
            ],
            temperature: 0,
            response_format: { type: "json_object" },
          });
        },
        extract(value) {
          return value.choices?.[0]?.message?.content;
        },
        retry(value) {
          const code = value.error?.code || value.error?.status_code;
          const status = Number(value.statusCode || value.status_code || 0);
          return code === "Throttling" || status === 429 || status === 503;
        },
        describe(value, model) {
          const code = value.error?.code || value.error?.status_code;
          const message = value.error?.message || value.message;
          if (code === "Throttling") return `${model}: превышен лимит`;
          if (code === "InvalidApiKey") return `${model}: неверный API-ключ`;
          if (code === "InvalidParameter")
            return `${model}: некорректный запрос`;
          return message || `${model}: ошибка Qwen API`;
        },
      },
    },
    empty(model) {
      return {
        error: {
          retry: true,
          message: `${model}: пустой или невалидный ответ`,
        },
        model,
      };
    },
    decode(adapter, raw, model, providerName, chunk) {
      state.debug.push({
        source: "llm",
        provider: providerName,
        model,
        chunk,
        raw,
      });
      const value = provider.parse(raw);
      if (value.error) return { error: value.error, model };
      const string = adapter.extract(value);
      if (!string) return provider.empty(model);
      try {
        return {
          ...provider.parse(provider.clean(string)),
          model,
        };
      } catch {
        return provider.empty(model);
      }
    },
    send(adapter, model, chunk, providerName) {
      return fetch(adapter.link(model), {
        method: "POST",
        headers: adapter.authorize(),
        body: adapter.compose(model, chunk),
      })
        .then((response) => response.text())
        .then((raw) =>
          provider.decode(adapter, raw, model, providerName, chunk),
        );
    },
    run(providerName, chunk, models = storage.model.read(providerName)) {
      const adapter = provider.adapter[providerName];
      const [model, ...rest] = models;
      if (!adapter) throw new Error(`Провайдер недоступен: ${providerName}`);
      if (!model)
        throw new Error(`${adapter.label} недоступен. Попробуй позже.`);
      panel.model(model);
      return provider.send(adapter, model, chunk, providerName).then((value) => {
        if (!value.error) {
          panel.model(value.model);
          return value;
        }
        if ((value.error?.retry || adapter.retry(value)) && rest.length) {
          return provider.run(providerName, chunk, rest);
        }
        throw new Error(value.error?.message || adapter.describe(value, model));
      });
    },
    languagetool(chunk) {
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
          state.debug.push({ source: "languagetool", chunk, raw });
          return provider.parse(raw);
        });
    },
    gemini(chunk) {
      return provider.run("gemini", chunk);
    },
    qwen(chunk) {
      return provider.run("qwen", chunk);
    },
    llm(chunk) {
      const providerName = state.provider;
      const run = provider[providerName];
      if (typeof run !== "function") {
        return Promise.reject(
          new Error(`Провайдер недоступен: ${providerName}`),
        );
      }
      return run(chunk);
    },
  };
  const data = {
    map: {
      languagetool(value, string) {
        const filter = {
          whitelist(item) {
            const message = String(item.message || "");
            return [/орфографическ/i, /опечат/i, /пробел/i, /повтор/i].some(
              (rule) => rule.test(message),
            );
          },
          run(value) {
            return value.filter(filter.allow);
          },
          proper(item) {
            if (item.message !== "Возможно найдена орфографическая ошибка.")
              return false;
            return /^[А-ЯЁ][а-яё]+(?:-[А-ЯЁа-яё]+)?$/u.test(item.word || "");
          },
          form(item) {
            if (item.message !== "Возможно найдена орфографическая ошибка.")
              return false;
            const word = String(item.word || "").toLowerCase();
            const fix = String(item.fix || "").toLowerCase();
            if (word.length < 5 || fix.length < 5) return false;
            if (!/^[а-яё-]+$/u.test(word + fix)) return false;
            return word.startsWith(fix);
          },
          split(item) {
            if (item.message !== "Возможно найдена орфографическая ошибка.")
              return false;
            const word = String(item.word || "");
            if (word.includes(" ")) return false;
            return item.variants.some((value) =>
              String(value || "").includes(" "),
            );
          },
          hyphen(item) {
            if (item.message !== "Возможно найдена орфографическая ошибка.")
              return false;
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
          (value.matches || []).map((item) => ({
            source: "languagetool",
            word: string.slice(item.offset, item.offset + item.length),
            fix: item.replacements?.[0]?.value || "",
            variants: (item.replacements || [])
              .slice(0, 10)
              .map((replacement) => replacement.value),
            message: item.message,
            replaceAll: true,
          })),
        );
      },
      llm(value) {
        const items = Array.isArray(value.edits) ? value.edits : [];
        const provider = String(state.provider || "llm");
        const label = provider.charAt(0).toUpperCase() + provider.slice(1);
        return items.map((item) => ({
          source: "llm",
          word: String(item.before || ""),
          fix: String(item.after || ""),
          variants: [String(item.after || "")],
          message: item.reason ? `${label}: ${item.reason}` : label,
          confidence: Number(item.confidence) || 0,
          replaceAll: false,
        }));
      },
    },
    check(name, index = 0, items = []) {
      if (index >= state.chunks.length) return Promise.resolve(items);
      const string = state.chunks[index];
      const total = state.chunks.length;
      progress.set(Math.round(((index + 1) / total) * 100));
      return provider[name](string).then((value) => {
        const matches = data.map[name](value, string);
        return data.check(name, index + 1, items.concat(matches));
      });
    },
    run(name) {
      return data.check(name);
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
      if (item.source !== "llm") return true;
      return item.confidence >= 0.8;
    },
    style(item) {
      if (item.source !== "llm") return true;
      return !text.stylistic(item.message);
    },
    size(item) {
      if (item.source !== "llm") return true;
      return !text.longer(item);
    },
    punctuationSafe(item) {
      if (item.source !== "llm") return true;
      return !text.removesPunctuation(item);
    },
    present(item, value) {
      return value.includes(item.word);
    },
    filter(items) {
      const value = state.textarea.value;
      return data.group(items.filter((item) => data.allow(item, value)));
    },
    group(items) {
      const groups = new Map();
      items.forEach((item) => {
        if (item.source === "llm") {
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
      return [...groups.values()];
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
        const button = element.querySelector("#proofread-theme");
        if (button)
          button.innerHTML = ui.controls.icon(
            proofread.theme(value),
          );
      },
      toggle() {
        const next = view.theme.get() === "dark" ? "light" : "dark";
        view.theme.set(next);
      },
    },
    source: {
      enabled: { languagetool: config.languagetool, llm: mode.llm() },
      tabs: {
        items() {
          return Object.entries(view.source.enabled)
            .filter(([, active]) => active)
            .map(([name]) => name);
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
          { languagetool: 0, llm: 0 },
        );
      },
      selected() {
        return view.source.tabs.items().filter((name) => state.view.has(name));
      },
      visible() {
        return state.matches.filter(
          (match) =>
            state.view.has(match.source) && !state.ignored.has(text.key(match)),
        );
      },
      toggle(name) {
        if (!state.checkedSources.has(name)) {
          state.view.add(name);
          app.check(name);
          return;
        }
        if (state.view.has(name)) state.view.delete(name);
        else state.view.add(name);
        panel.render();
      },
      update() {
        const element = state.panel;
        if (!element) return;
        const counts = view.source.count();
        element.querySelectorAll("[data-source]").forEach((button) => {
          const name = button.dataset.source;
          const active = state.view.has(name);
          button.dataset.active = active ? "true" : "false";
          const count = button.querySelector("[data-count]");
          if (!count) return;
          if (!state.checkedSources.has(name)) {
            count.textContent = "—";
            return;
          }
          count.textContent = counts[name] || 0;
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
        "--proofread-progress",
        `${Math.min(100, state.progress)}%`,
      );
    },
    reset() {
      state.progress = 0;
      state.panel.style.setProperty("--proofread-progress", "0%");
    },
    done() {
      progress.set(100);
    },
  };
  const layout = {
    loading() {
      return state.panel?.dataset.done === "false";
    },
    rows() {
      return ui.surface.rows.count(state.list);
    },
    value(value = state.rowsTarget) {
      const number = Number(value);
      if (!Number.isFinite(number)) return state.rowsTarget || 5;
      return Math.max(0, Math.round(number));
    },
    remember(value = state.rowsTarget) {
      state.rowsTarget = layout.value(value);
      return state.rowsTarget;
    },
    apply(
      value = state.rowsTarget,
      { remember = false, preserve = true, compact = false } = {},
    ) {
      const list = state.list;
      const element = state.panel;
      if (!list || !element || layout.loading()) return null;
      state.rowsCompact = compact;
      const visible = remember ? layout.remember(value) : layout.value(value);
      const result = ui.surface.rows.fit(element, list, {
        visible,
        loading: layout.loading,
        rowSelector: "[data-row]",
        emptySelector: "[data-empty]",
        rowHeightVar: "--proofread-row-height",
        rowBorderVar: "--proofread-row-border-width",
        rowGapVar: "--proofread-row-stack-gap",
        headerSelector: "[data-header]",
        headerHeightVar: "--proofread-header-height",
        preserveHeight: compact ? false : preserve,
      });
      state.rowsVisible = result.rows;
      return result;
    },
    empty() {
      return layout.apply(1, { preserve: false, compact: true });
    },
    fit() {
      if (state.rowsCompact) return layout.empty();
      return layout.apply(state.rowsTarget);
    },
  };
  const wait = {
    text() {
      return `Ожидайте${".".repeat(state.waitStep)}`;
    },
    stop() {
      if (!state.waitTimer) return;
      clearInterval(state.waitTimer);
      state.waitTimer = null;
      state.waitStep = 0;
    },
    html() {
      return `<span data-wait-label>Ожидайте</span><span data-wait-dots style="display:inline-block;width:3ch;text-align:left">${".".repeat(state.waitStep)}</span>`;
    },
    tick() {
      state.waitStep = (state.waitStep + 1) % 4;
      const dots = state.list?.querySelector("[data-wait-dots]");
      if (!dots) return;
      dots.textContent = ".".repeat(state.waitStep);
    },
    start() {
      wait.stop();
      state.waitStep = 0;
      panel.emptyHtml(wait.html());
      layout.empty();
      state.waitTimer = setInterval(wait.tick, 420);
    },
  };
  const glyph = {
    html(name, size = 20, fallbackName = name) {
      const primary = icon.fluent(name, size);
      const fallback = icon.fluent(fallbackName, 24);
      return `<img class="toolbar-icon proofread-glyph" src="${primary}" alt="" onerror="this.onerror=null;this.src='${fallback}'">`;
    },
  };
  const row = {
    buildOptions(match) {
      return ["__other__", ...match.variants.slice()];
    },
    buildOption(option, selected = false) {
      if (option === "__other__")
        return '<option value="__other__">это другое…</option>';
      const safe = text.safe(option);
      return `<option value="${safe}"${selected ? " selected" : ""}>${safe}</option>`;
    },
    buildLabel(match) {
      const count = match.count > 1 ? ` ×${match.count}` : "";
      return {
        html: `${text.safe(match.word)}${count}`,
        raw: `${String(match.word || "")}${count}`,
      };
    },
    build(match, index) {
      const note = text.message(match.message);
      const label = row.buildLabel(match);
      const options = row.buildOptions(match);
      const selected = String(
        match.variants?.[0] || match.fix || match.word || "",
      );
      const element = document.createElement("div");
      element.dataset.row = index;
      if (note) element.dataset.note = note;
      const tools = ui.shell.group(
        [
          shell.button({
            content: glyph.html("Autocorrect", 20, "Edit"),
            title: "Поправить",
            attrs: ` data-fix="${index}"`,
          }),
          shell.button({
            content: glyph.html("Globe Search", 20, "Search"),
            title: "Поискать",
            attrs: ` data-search="${index}"`,
          }),
          shell.button({
            content: glyph.html("Circle Multiple Subtract Checkmark", 20, "Dismiss Circle"),
            title: "Скипнуть",
            attrs: ` data-ok="${index}"`,
          }),
        ].join(""),
        { rail: true },
      );
      element.innerHTML = `
            <div class="proofread-line">
              <label data-main>
                <span data-word title="${text.safe(match.message)}">${label.html}</span>
                <div data-field-cell>
                  <select class="field audit-field audit-field-select" data-select="${index}" data-default="${text.safe(selected)}" title="${text.safe(selected)}">
                    ${options
                      .map((option) =>
                        row.buildOption(option, option === selected),
                      )
                      .join("")}
                  </select>
                  <input class="field audit-field audit-field-input" data-input="${index}">
                </div>
              </label>
              <div data-tools-row>
                ${tools}
              </div>
            </div>
          `;
      return element;
    },
  };
  const shell = {
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
        classes: "proofread-source-button",
        attrs: ` data-source="${value.source}"`,
      });
    },
    buildTabs(value) {
      const icons = {
        languagetool: value.languagetool,
        llm: value.llm,
      };
      return view.source.tabs
        .items()
        .map((source) => ({
          source,
          label: "",
          icon: icons[source] || "",
          count: source,
        }))
        .map(shell.buildTab)
        .join("");
    },
    buildHtml() {
      const value = {
        theme: proofread.theme(view.theme.get()),
        languagetool: proofread.logo("languagetool"),
        llm: proofread.llm(state.provider),
        go: glyph.html("Group Return", 20, "Arrow Return Up Left"),
        save: glyph.html("Arrow Download", 20),
        close: proofread.icon("close"),
      };
      const left = ui.controls.marker({
        content: proofread.icon("marker"),
        button: {
          action: "proofread-marker",
          classes: "proofread-panel-marker",
          attrs: ' type="button" tabindex="-1" aria-label="Proofread"',
        },
        group: { classes: "proofread-marker-group" },
      });
      const download = shell.button({
        content: value.save,
        title: "Скачать",
        attrs: " data-download",
      });
      const tabs = ui.shell.group(
        ui.shell.strip(`${shell.buildTabs(value)}${download}`),
        {
          classes: "proofread-engine-group",
          attrs: " data-tabs data-engine-group",
          rail: true,
        },
      );
      const back = ui.shell.group(
        shell.button({
          content: value.go,
          title: "Вернуть",
          attrs: " data-go-active",
        }),
        {
          classes: "proofread-return-group",
          attrs: " data-return-group",
          rail: true,
        },
      );
      const controls = ui.shell.group(
        `${shell.button({
          content: value.theme,
          title: "Тема",
          attrs: ' id="proofread-theme"',
        })}${shell.button({
          content: value.close,
          title: "Закрыть",
          attrs: ' id="proofread-close"',
        })}`,
        {
          classes: "proofread-controls-group",
          attrs: " data-controls-group",
          rail: true,
        },
      );
      const main = ui.shell.strip(`${tabs}${back}`, {
        classes: "proofread-header-main",
      });
      return `
          <div data-header>
            ${ui.shell.frame({
              left,
              main,
              right: controls,
              classes: "proofread-header-shell",
              pack: "start",
            })}
            <div data-progress>
              <span data-progress-bar></span>
            </div>
          </div>
          <div id="proofread-list">
            <div data-empty>Засылаю…</div>
          </div>
          <div data-proofread-meta hidden aria-hidden="true">
            <div data-status><div id="proofread-model"></div><div id="proofread-title"></div></div>
          </div>
  `;
    },
    bind(value) {
      value.querySelectorAll("[data-source]").forEach((button) => {
        button.onclick = () => view.source.toggle(button.dataset.source);
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
      value.querySelector("#proofread-theme").onclick = () =>
        view.theme.toggle();
      value.querySelector("#proofread-close").onclick = () => {
        state.listObserver?.disconnect();
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
        id: "proofread-panel",
        className: "panel",
        html: shell.buildHtml(),
      });
    },
  };
  const panel = {
    create() {
      frame.mount(id.skin, css.proofread.panel());
      const element = shell.create();
      element.dataset.uiSurface = "toolbar";
      element.dataset.uiFrame = "capsule";
      element.dataset.theme = view.theme.get();
      element.dataset.toolsReady = "false";
      element.dataset.done = "true";
      element.dataset.loading = "false";
      shell.bind(element);
      state.panel = element;
      state.list = element.querySelector("#proofread-list");
      state.controller = toolbar.controller({
        panel: element,
        ...toolbar.presets.multiRowFixed("content"),
        theme: () => view.theme.get(),
        drag: {
          keepWidth: true,
          canStart(event) {
            if (event.button !== 0) return false;
            if (event.target.closest("button,input,select,a")) return false;
            if (event.target.closest("#proofread-list")) return false;
            if (!event.target.closest("[data-header]") && event.target !== element) return false;
            if (layout.loading()) return false;
            const header = element.querySelector("[data-header]");
            if (header) header.style.cursor = "grabbing";
            return true;
          },
          onEnd() {
            const header = element.querySelector("[data-header]");
            if (header) header.style.cursor = "grab";
          },
        },
        resize: null,
      });
      view.source.update();
      state.controller.behavior.bind();
      delete element.dataset.toolbarCapsule;
      return element;
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
      const node = state.panel?.querySelector("#proofread-model");
      if (!node) return;
      if (state.panel?.dataset.done === "false") {
        node.textContent = "";
        return;
      }
      node.textContent = state.model || "";
    },
    title(value) {
      const node = state.panel?.querySelector("#proofread-title");
      if (!node) return;
      node.textContent = value || "";
    },
    status(name = "languagetool") {
      const node = state.panel?.querySelector("#proofread-title");
      if (!node) return;
      node.innerHTML = `<span data-status-logo>${proofread.status(name, state.provider)}</span>`;
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
    activate(index, button, from = 0) {
      const row = panel.row(index);
      if (!row) return false;
      panel.rows().forEach((item) => item.removeAttribute("data-active"));
      row.dataset.active = "true";
      row.scrollIntoView({ block: "nearest" });
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
      const button = state.panel?.querySelector("#proofread-undo");
      if (button) button.disabled = !value;
    },
    render() {
      wait.stop();
      state.panel.dataset.toolsReady = "true";
      state.panel.dataset.done = "true";
      state.panel.dataset.loading = "false";
      delete state.panel.dataset.loadingSource;
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
        "2px solid var(--surface-proofread-error-border)";
      panel.title("Ошибка");
      panel.empty(text.safe(error.message));
    },
  };
  const selection = {
    find(item, from = 0) {
      const { textarea } = state;
      const position = textarea.value.indexOf(item.word, from);
      if (position >= 0 || from <= 0) return position;
      return textarea.value.indexOf(item.word);
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
    go(item, button, from = 0) {
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
        return select.dataset.custom || state.visible[index].fix;
      }
      if (select?.value === "__other__") {
        return input?.value || state.visible[index].fix;
      }
      return select?.value || input?.value || state.visible[index].fix;
    },
    apply(index, button, from = 0) {
      const { textarea, visible } = state;
      const item = visible[index];
      const position = selection.find(item, from);
      if (position < 0) {
        selection.miss(button);
        return false;
      }
      const fix = match.fix(index);
      const replaceAll = item.replaceAll && !text.spaceAdded(item.word, fix);
      const after = replaceAll
        ? textarea.value.split(item.word).join(fix)
        : textarea.value.slice(0, position) +
          fix +
          textarea.value.slice(position + item.word.length);
      state.undo = {
        type: "apply",
        before: textarea.value,
        after,
      };
      panel.undo(true);
      textarea.value = after;
      text.emit();
      selection.focus(position, fix.length);
      return true;
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
  const action = {
    bind(selector, handler) {
      state.panel.querySelectorAll(selector).forEach((node) => {
        node.onclick = () => handler(node);
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
    select(row) {
      row.onclick = (event) => {
        if (event.target.closest("button,select,input")) return;
        const index = row.dataset.row;
        const button = row.querySelector("[data-go]");
        const from = state.textarea.selectionEnd;
        if (panel.activate(index, button, from)) return;
        row.remove();
        panel.refreshTitle();
        panel.activateNext(null, from);
      };
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
      if (panel.active() !== row) {
        panel.activate(index, button);
        return;
      }
      if (!match.apply(index, button, state.textarea.selectionStart)) return;
      const from = state.textarea.selectionEnd;
      selection.flash(button, "green");
      setTimeout(() => {
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
      };
      panel.undo(true);
      state.ignored.add(key);
      selection.flash(button, "green");
      setTimeout(() => {
        row.remove();
        panel.refreshTitle();
        panel.activateNext(next, from, same);
      }, 220);
    },
    undo() {
      const undo = state.undo;
      if (!undo) return;
      if (undo.type === "apply") {
        state.textarea.value = undo.before;
        text.emit();
      }
      if (undo.type === "ignore") {
        state.ignored.delete(undo.key);
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
      state.undo = null;
      panel.undo(false);
      panel.refreshTitle();
    },
    configure() {
      const provider = state.provider;
      const value = prompt(
        `Вставь API-ключ для ${provider}`,
        storage.key.read(provider),
      );
      if (value == null) return;
      storage.key.write(value, provider);
      const models = prompt(
        `Модели ${provider} через запятую`,
        storage.model.read(provider).join(", "),
      );
      if (models == null) return;
      storage.model.write(models, provider);
    },
  };
  const bind = {
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
      state.panel.querySelectorAll("[data-select]").forEach((select) => {
        select.onchange = () => {
          const index = select.dataset.select;
          const input = state.panel.querySelector(`[data-input="${index}"]`);
          if (!input) return;
          if (select.value !== "__other__") {
            const label =
              select.selectedOptions?.[0]?.textContent || select.value;
            select.title = label;
            select.style.display = "";
            input.style.display = "none";
            if (select.value !== "__custom__") {
              delete select.dataset.custom;
              select.querySelector('option[value="__custom__"]')?.remove();
            }
            return;
          }
          select.style.display = "none";
          input.style.display = "inline-block";
          input.value = select.dataset.custom || state.visible[index].word;
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
                select.value = next;
                const label = select.selectedOptions?.[0]?.textContent || next;
                select.title = label;
              }
              input.style.display = "none";
              select.style.display = "";
              return;
            }
            input.value = value;
            input.title = value;
            ensureCustomOption(select, value);
            select.value = "__custom__";
            const label = select.selectedOptions?.[0]?.textContent || value;
            select.title = label;
            input.style.display = "none";
            select.style.display = "";
          };
        };
      });
    },
    actions() {
      action.bind("[data-go-active]", action.goActive);
      state.panel.querySelectorAll("[data-row]").forEach(action.select);
      action.bind("[data-search]", action.search);
      action.bind("[data-fix]", action.fix);
      action.bind("[data-ok]", action.ignore);
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
    save(name, value, type = "application/json;charset=utf-8") {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([value], { type }));
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    },
    build() {
      return {
        view: state.view,
        model: state.model,
        plain: state.plain,
        chunks: state.chunks,
        debug: state.debug,
        matches: state.matches,
        visible: state.visible,
      };
    },
    write(value) {
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
        file.write(prompt("Что скачать: text/debug/all?", "all"));
      } catch {}
    },
  };
  const prepare = {
    prepare() {
      cms.editor.html();
      const textarea = document.querySelector("#content");
      if (!textarea) return false;
      state.textarea = textarea;
      text.decode();
      state.plain = text.plain();
      state.chunks = text.split(state.plain);
      panel.create();
      state.view = new Set(view.source.tabs.items());
      return true;
    },
  };
  const app = {
    prepareLlm() {
      if (!view.source.active("llm")) return;
      state.provider = mode.provider();
      const provider = state.provider;
      if (storage.key.read(provider)) return;
      action.configure();
      if (storage.key.read(provider)) return;
      view.source.enabled.llm = false;
      view.source.update();
    },
    check(name = "languagetool") {
      state.panel.dataset.toolsReady = "false";
      state.panel.dataset.loading = "true";
      state.panel.dataset.loadingSource = name;
      progress.reset();
      if (state.running) return;
      if (name === "llm") app.prepareLlm();
      state.running = true;
      state.checked = true;
      panel.model("");
      panel.status(name);
      wait.start();
      data
        .run(name)
        .then((items) => {
          state.matches = data.filter(state.matches.concat(items));
          state.checkedSources.add(name);
          state.view.add(name);
          panel.render();
        })
        .catch((error) => panel.error(error))
        .finally(() => {
          progress.done();
          state.running = false;
          state.panel.dataset.loading = "false";
          delete state.panel.dataset.loadingSource;
        });
    },
    run() {
      if (!prepare.prepare()) return false;
      panel.render();
      if (config.launch.startLtOnInit && config.languagetool) {
        requestAnimationFrame(() => app.check("languagetool"));
      }
      return true;
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
    },
  };
  return {
    audit,
  };
};
