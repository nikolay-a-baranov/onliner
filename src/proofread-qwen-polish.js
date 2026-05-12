import { cms } from "./core/cms.js";
import { frame } from "./core/panel.js";
import { css } from "./core/css.js";
import { toolbar } from "./core/toolbar.js";
import { emoji } from "./core/emoji.js";
import { widget } from "./core/widget.js";
import { markup } from "./pipe/markup.js";


const model = {
  qwen: ["qwen-plus", "qwen-turbo"],
  gemini: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"],
};

const id = {
    skin: "proofread-style",
  };

const state = {
    ignored:
      window.proofreadIgnored ??
      (window.proofreadIgnored = window.ltIgnored ?? new Set()),
    textarea: null,
    panel: null,
    list: null,
    undo: null,
    plain: "",
    chunks: [],
    matches: [],
    visible: [],
    view: "all",
    drag: null,
    resize: null,
    rowsVisible: 5,
    listObserver: null,
    fitFrame: null,
    running: false,
    checked: false,
    model: [],
    provider: "qwen",
    debug: [],
  };

const text = {
    ignored: new Set(["телеграм-бот", "},", ",{"]),
    punctuation(value) {
      return /^[\s.,!?…:;'"«»„“”()\-–—]+$/u.test(value || "");
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
      const result = widget.decode(source, markup.clean);
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
      return markup.strip(state.textarea.value);
    },
    key(match) {
      return `${match.word}|${match.message}`;
    },
  };

const storage = {
  key: {
    prefix: "proofread-key-",
    legacy: "proofread-qwen-key",
    build(provider = state.provider) {
      return `${storage.key.prefix}${provider}`;
    },
    read(provider = state.provider) {
      const value = localStorage.getItem(storage.key.build(provider));
      if (value) return value;
      if (provider === "qwen") return localStorage.getItem(storage.key.legacy) || "";
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
    prefix: "proofread-models-",
    build(provider = state.provider) {
      return `${storage.model.prefix}${provider}`;
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
      return models.length ? models : model[provider] || [];
    },
    write(value, provider = state.provider) {
      localStorage.setItem(
        storage.model.build(provider),
        storage.model.parse(value).join(","),
      );
    },
  },
};
const api = {
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
              parts: [{ text: api.prompt(value) }],
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
              content: api.prompt(value),
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
        if (code === "InvalidParameter") return `${model}: некорректный запрос`;
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
  decode(adapter, raw, model, provider, chunk) {
    state.debug.push({ source: "llm", provider, model, chunk, raw });
    const value = api.parse(raw);
    if (value.error) return { error: value.error, model };
    const string = adapter.extract(value);
    if (!string) return api.empty(model);
    try {
      return {
        ...api.parse(api.clean(string)),
        model,
      };
    } catch {
      return api.empty(model);
    }
  },
  send(adapter, model, chunk, provider) {
    return fetch(adapter.link(model), {
      method: "POST",
      headers: adapter.authorize(),
      body: adapter.compose(model, chunk),
    })
      .then((response) => response.text())
      .then((raw) => api.decode(adapter, raw, model, provider, chunk));
  },
  run(provider, chunk, models = storage.model.read(provider)) {
    const adapter = api.adapter[provider];
    const [model, ...rest] = models;
    if (!adapter) throw new Error(`Провайдер недоступен: ${provider}`);
    if (!model) throw new Error(`${adapter.label} недоступен. Попробуй позже.`);
    panel.model(model);
    return api.send(adapter, model, chunk, provider).then((value) => {
      if (!value.error) {
        panel.model(value.model);
        return value;
      }
      if ((value.error?.retry || adapter.retry(value)) && rest.length) {
        return api.run(provider, chunk, rest);
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
        return api.parse(raw);
      });
  },
  gemini(chunk) {
    return api.run("gemini", chunk);
  },
  qwen(chunk) {
    return api.run("qwen", chunk);
  },
  llm(chunk) {
    const provider = state.provider;
    const run = api[provider];
    if (typeof run !== "function") {
      return Promise.reject(new Error(`Провайдер недоступен: ${provider}`));
    }
    return run(chunk);
  },
};

const data = {
  map: {
    languagetool(value, string) {
      return (value.matches || []).map((item) => ({
        source: "languagetool",
        word: string.slice(item.offset, item.offset + item.length),
        fix: item.replacements?.[0]?.value || "",
        variants: (item.replacements || [])
          .slice(0, 10)
          .map((replacement) => replacement.value),
        message: item.message,
        replaceAll: true,
      }));
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
    state.panel.style.setProperty(
      "--proofread-progress",
      `${Math.round(((index + 1) / total) * 100)}%`,
    );
    panel.title("Загрузка");
    return api[name](string).then((value) => {
      const matches = data.map[name](value, string);
      return data.check(name, index + 1, items.concat(matches));
    });
  },
  run() {
    const names = Object.keys(view.source.enabled).filter((name) =>
      view.source.active(name),
    );
    if (!names.length) return Promise.resolve([]);
    panel.title(`Проверка: ${view.source.names()}`);
    return Promise.all(names.map((name) => data.check(name))).then((items) =>
      items.flat(),
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
    key: "onliner-proofread-theme",
    get() {
      const stored = localStorage.getItem(view.theme.key);
      if (stored === "dark" || stored === "light") return stored;
      return toolbar.theme("content");
    },
    icon(value) {
      return toolbar.themeToggleIcon(value);
    },
    set(value) {
      localStorage.setItem(view.theme.key, value);
      const element = state.panel;
      if (!element) return;
      element.dataset.theme = value;
      const button = element.querySelector("#proofread-theme");
      if (button) button.innerHTML = emoji.html(view.theme.icon(value));
    },
    toggle() {
      const next = view.theme.get() === "dark" ? "light" : "dark";
      view.theme.set(next);
    },
  },
  source: {
    enabled: { languagetool: true, llm: true },
    active(name) {
      return view.source.enabled[name] === true;
    },
    count() {
      return state.matches.reduce(
        (value, match) => ({
          ...value,
          [match.source]: (value[match.source] || 0) + 1,
        }),
        { all: state.matches.length, languagetool: 0, llm: 0 },
      );
    },
    visible() {
      const value = state.view;
      if (value === "all") return state.matches;
      return state.matches.filter((match) => match.source === value);
    },
    toggle(name) {
      state.view = state.view === name ? "all" : name;
      panel.render();
    },
    update() {
      const element = state.panel;
      if (!element) return;
      const counts = view.source.count();
      element.querySelectorAll("[data-source]").forEach((button) => {
        const name = button.dataset.source;
        const active =
          (state.view === "all" && name === "all") ||
          state.view === name;
        button.dataset.active = active ? "true" : "false";
        const count = button.querySelector("[data-count]");
        if (count) count.textContent = counts[name] || 0;
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
const layout = {
  measure() {
    const element = state.panel;
    const list = state.list;
    const item = list?.querySelector("[data-row]");
    const style = element ? getComputedStyle(element) : null;
    const step =
      item?.offsetHeight ||
      parseFloat(style?.getPropertyValue("--proofread-row-height")) ||
      30;
    const border =
      parseFloat(style?.getPropertyValue("--proofread-row-border-width")) ||
      1;
    return { step: Math.max(8, Math.round(step)), border };
  },
  chrome() {
    const element = state.panel;
    const header = element?.querySelector("[data-header]");
    const edge = element?.querySelector("[data-resize-edge]");
    if (!element || !header || !edge) return 0;
    const panelStyle = getComputedStyle(element);
    const headerStyle = getComputedStyle(header);
    const paddingTop = parseFloat(panelStyle.paddingTop) || 0;
    const paddingBottom = parseFloat(panelStyle.paddingBottom) || 0;
    const headerMarginTop = parseFloat(headerStyle.marginTop) || 0;
    const headerMarginBottom = parseFloat(headerStyle.marginBottom) || 0;
    const edgeHeight = edge.offsetHeight || 0;
    return Math.round(
      paddingTop +
        paddingBottom +
        header.offsetHeight +
        headerMarginTop +
        headerMarginBottom +
        edgeHeight,
    );
  },
  apply(value) {
    const list = state.list;
    const element = state.panel;
    if (!list || !element) return;
    const measure = layout.measure();
    const chrome = layout.chrome();
    const rows = Math.max(1, value);
    state.rowsVisible = rows;
    const height = rows * measure.step;
    element.style.height = `${Math.round(chrome + height)}px`;
    list.style.maxHeight = `${Math.round(height)}px`;
  },
  fit() {
    const list = state.list;
    if (!list) return;
    const count = list.querySelectorAll("[data-row]").length;
    const measure = layout.measure();
    const current = Math.max(
      1,
      Math.floor((list.clientHeight || measure.step) / measure.step),
    );
    const rows = Math.max(1, Math.min(current, count));
    layout.apply(rows);
  },
};
const row = {
  buildOptions(match) {
    return ["__other__", ...match.variants.slice()];
  },
  buildOption(option, selected = false) {
    if (option === "__other__") return '<option value="__other__">это другое…</option>';
    const safe = text.safe(option);
    return `<option value="${safe}"${selected ? " selected" : ""}>${safe}</option>`;
  },
  buildLabel(match) {
    const count = match.count > 1 ? ` ×${match.count}` : "";
    return {
      html: `${text.safe(match.word)}${count} →`,
      raw: `${String(match.word || "")}${count} →`,
    };
  },
  build(match, index) {
    const note = text.message(match.message);
    const label = row.buildLabel(match);
    const options = row.buildOptions(match);
    const selected = String(match.variants?.[0] || match.fix || match.word || "");
    const element = document.createElement("div");
    element.dataset.row = index;
    if (note) element.dataset.note = note;
    element.innerHTML = `
            <div class="proofread-line">
              <label data-main>
                <span title="${text.safe(label.raw)}">${label.html}</span>
                <select class="field field-select" data-select="${index}" data-default="${text.safe(selected)}" title="${text.safe(selected)}">
                  ${options
                    .map((option) => row.buildOption(option, option === selected))
                    .join("")}
                </select>
                <input class="field field-input" data-input="${index}">
              </label>
              <div data-tools-row>
                <button class="button button-emoji" data-fix="${index}">${emoji.html("✏️")}</button>
                <button class="button button-emoji" data-go="${index}">${emoji.html("🔎")}</button>
                <button class="button button-emoji" data-search="${index}">${emoji.html("🌐")}</button>
                <button class="button button-emoji" data-ok="${index}">${emoji.html("☑️")}</button>
              </div>
            </div>
          `;
    return element;
  },
};
const shell = {
  buildIcon() {
    return {
      theme: emoji.html(view.theme.icon(view.theme.get())),
      languagetool: emoji.html("📖"),
      llm: emoji.html("🤖"),
      key: emoji.html("🔑"),
      undo: emoji.html("↩️"),
      save: emoji.html("💾"),
      close: emoji.html("❌"),
    };
  },
  buildTab(value) {
    const icon = value.icon ? `<span data-icon>${value.icon}</span>` : "";
    const label = value.label ? `<span>${value.label}</span>` : "";
    return `
                <button class="button proofread-tab" data-source="${value.source}">
                  ${label}${icon}
                  <span data-count="${value.count}">0</span>
                </button>
              `;
  },
  buildTabs(value) {
    return [
      { source: "all", label: "Все", icon: "", count: "all" },
      { source: "llm", label: "", icon: value.llm, count: "llm" },
      {
        source: "languagetool",
        label: "",
        icon: value.languagetool,
        count: "languagetool",
      },
    ]
      .map(shell.buildTab)
      .join("");
  },
  buildHtml(value) {
    return `
          <div data-header>
            <div data-headline>
              <div data-status>
                <div id="proofread-model"></div>
                <div id="proofread-title"></div>
              </div>
              <div data-tabs>
                ${shell.buildTabs(value)}
              </div>
            </div>
            <div data-progress>
              <span data-progress-bar></span>
            </div>
            <div data-actions>
              <div data-mode>
                <button class="button button-emoji" id="proofread-theme" title="Тема">${value.theme}</button>
                <button class="button button-emoji" id="proofread-key" title="API-ключ">${value.key}</button>
              </div>
              <div data-tools>
                <button class="button button-emoji" id="proofread-undo" title="Вернуть" disabled>${value.undo}</button>
                <button class="button button-emoji" data-download title="Скачать">${value.save}</button>
                <button class="button button-emoji" id="proofread-close" title="Закрыть">${value.close}</button>
              </div>
            </div>
          </div>
          <div id="proofread-list">
            <div data-empty>Засылаю…</div>
          </div>
          <div data-resize-edge></div>
`;
  },
  bind(value) {
    value.querySelectorAll("[data-source]").forEach((button) => {
      button.onclick = () => view.source.toggle(button.dataset.source);
    });
    value.querySelector("#proofread-theme").onclick = () => view.theme.toggle();
    value.querySelector("#proofread-close").onclick = () => {
      state.listObserver?.disconnect();
      value.remove();
    };
    return value;
  },
  create() {
    return frame.create({
      id: "proofread-panel",
      className: "panel",
      html: shell.buildHtml(shell.buildIcon()),
    });
  },
};
const panel = {
    create() {
      frame.mount(id.skin, css.panel());
      const element = shell.create();
      element.dataset.uiSurface = "toolbar";
      element.dataset.theme = view.theme.get();
      element.dataset.toolsReady = "false";
      element.dataset.done = "false";
      shell.bind(element);
      state.panel = element;
      state.list = element.querySelector("#proofread-list");
      view.source.update();
      panel.drag();
      panel.resize();
      return element;
    },
    drag() {
      const element = state.panel;
      const header = element?.querySelector("[data-header]");
      if (!element || !header) return;
      header.style.cursor = "grab";
      header.onpointerdown = (event) => {
        if (event.button !== 0) return;
        if (event.target.closest("button,input,select,a")) return;
        const rect = element.getBoundingClientRect();
        state.drag = {
          x: event.clientX,
          y: event.clientY,
          left: rect.left,
          top: rect.top,
        };
        element.style.left = `${rect.left}px`;
        element.style.top = `${rect.top}px`;
        element.style.right = "auto";
        element.style.transform = "none";
        header.style.cursor = "grabbing";
        element.setPointerCapture?.(event.pointerId);
      };
      element.onpointermove = (event) => {
        const drag = state.drag;
        if (!drag) return;
        if (state.resize) return;
        const left = Math.max(
          0,
          Math.min(
            window.innerWidth - element.offsetWidth,
            drag.left + event.clientX - drag.x,
          ),
        );
        const top = Math.max(
          0,
          Math.min(
            window.innerHeight - element.offsetHeight,
            drag.top + event.clientY - drag.y,
          ),
        );
        element.style.left = `${left}px`;
        element.style.top = `${top}px`;
      };
      element.onpointerup = (event) => {
        if (state.drag) header.style.cursor = "grab";
        state.drag = null;
        element.releasePointerCapture?.(event.pointerId);
      };
      element.onpointercancel = () => {
        header.style.cursor = "grab";
        state.drag = null;
      };
    },
    resize() {
      const element = state.panel;
      const list = state.list;
      const edge = element?.querySelector("[data-resize-edge]");
      if (!element || !list || !edge) return;
      edge.onpointerdown = (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        const panelRect = element.getBoundingClientRect();
        const listRect = list.getBoundingClientRect();
        const metrics = layout.measure();
        const baseRows = Math.max(
          1,
          state.rowsVisible ||
            Math.floor((listRect.height - metrics.border) / metrics.step),
        );
        state.resize = {
          y: event.clientY,
          panelTop: panelRect.top,
          chrome: layout.chrome(),
          baseRows,
          step: metrics.step,
          border: metrics.border,
        };
        element.style.left = `${panelRect.left}px`;
        element.style.top = `${panelRect.top}px`;
        element.style.right = "auto";
        element.style.transform = "none";
        element.style.height = `${panelRect.height}px`;
        edge.setPointerCapture?.(event.pointerId);
      };
      edge.onpointermove = (event) => {
        const resize = state.resize;
        if (!resize) return;
        const step = resize.step || 24;
        const deltaRows = Math.round((event.clientY - resize.y) / step);
        const maxHeight = window.innerHeight - resize.panelTop;
        const maxList = Math.max(120, maxHeight - (resize.chrome || 0));
        const maxRows = Math.max(1, Math.floor(maxList / step));
        const rows = Math.max(
          1,
          Math.min(maxRows, resize.baseRows + deltaRows),
        );
        const listHeight = rows * step;
        state.rowsVisible = rows;
        element.style.height = `${Math.round((resize.chrome || 0) + listHeight)}px`;
        list.style.maxHeight = `${Math.round(listHeight)}px`;
      };
      edge.onpointerup = (event) => {
        state.resize = null;
        edge.releasePointerCapture?.(event.pointerId);
      };
      edge.onpointercancel = () => {
        state.resize = null;
      };
    },
    model(value) {
      state.model = value || state.model;
      const node = state.panel?.querySelector("#proofread-model");
      if (!node) return;
      node.innerHTML = state.model
        ? `${emoji.html("🤖")} ${text.safe(state.model)}`
        : "";
    },
    title(value) {
      const node = state.panel?.querySelector("#proofread-title");
      if (!node) return;
      node.textContent = value || "";
    },
    empty(message) {
      state.list.innerHTML = "";
      if (!message) return;
      state.list.innerHTML = `<div data-empty>${text.safe(message)}</div>`;
    },
    row(index) {
      return state.panel.querySelector(`[data-row="${index}"]`);
    },
    rows() {
      return [...state.panel.querySelectorAll("[data-row]")];
    },
    active() {
      return state.panel.querySelector(
        '[data-row][data-active="true"]',
      );
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
      panel
        .rows()
        .forEach((item) => item.removeAttribute("data-active"));
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
        state.panel.remove();
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
      state.panel.dataset.toolsReady = "true";
      const matches = view.source.visible();
      view.source.update();
      state.visible = matches;
      state.list.innerHTML = "";
      if (!matches.length) {
        panel.empty(
          state.checked
            ? "Правок не найдено"
            : "Проверка не запускалась",
        );
        return;
      }
      matches
        .slice(0, 50)
        .forEach((match, index) =>
          state.list.appendChild(row.build(match, index)),
        );
      bind.selects();
      bind.actions();
      layout.apply(5);
      bind.list();
      panel.activateNext();
      state.panel.dataset.done = "true";
    },

    error(error) {
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
    textarea.scrollTop = Math.max(0, mark.offsetTop - textarea.clientHeight / 2);
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
    const after = item.replaceAll
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
    go(button) {
      const index = button.dataset.go;
      const row = panel.row(index);
      const from = state.textarea.selectionEnd;
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
        if (state.fitFrame)
          cancelAnimationFrame(state.fitFrame);
        state.fitFrame = requestAnimationFrame(() => {
          state.fitFrame = null;
          layout.fit();
        });
      });
      observer.observe(list, { childList: true });
      state.listObserver = observer;
    },
    selects() {
      state.panel
        .querySelectorAll("[data-select]")
        .forEach((select) => {
          select.onchange = () => {
            const index = select.dataset.select;
            const input = state.panel.querySelector(
              `[data-input="${index}"]`,
            );
            if (!input) return;
            if (select.value !== "__other__") {
              const label =
                select.selectedOptions?.[0]?.textContent || select.value;
              select.title = label;
              select.style.display = "";
              input.style.display = "none";
              return;
            }
            select.style.display = "none";
            input.style.display = "inline-block";
            input.value = state.visible[index].word;
            input.title = input.value;
            input.oninput = () => {
              input.title = input.value;
            };
            input.focus();
            input.select();
            input.onblur = () => {
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
            };
          };
        });
    },
    actions() {
      action.bind("[data-go]", action.go);
      state.panel.querySelectorAll("[data-row]").forEach(action.select);
      action.bind("[data-search]", action.search);
      action.bind("[data-fix]", action.fix);
      action.bind("[data-ok]", action.ignore);
      state.panel.querySelector("#proofread-undo").onclick = action.undo;
      state.panel.querySelector("#proofread-key").onclick = action.configure;
      state.panel
        .querySelectorAll("[data-download]")
        .forEach((button) => {
          button.onclick = file.run;
        });
    },
  };

const file = {
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
      file.save("proofread-text.txt", state.plain, "text/plain;charset=utf-8");
      return;
    }
    if (value === "all") {
      file.save("proofread-all.json", JSON.stringify(file.build(), null, 2));
      return;
    }
    file.save(
      "proofread-debug.json",
      JSON.stringify({ chunks: state.chunks, debug: state.debug }, null, 2),
    );
  },
  run() {
    try {
      file.write(prompt("Что скачать: text/debug/all?", "all"));
    } catch {}
  },
};

const editor = {
  prepare() {
    cms.editor.html();
    const textarea = document.querySelector("#content");
    if (!textarea) return false;
    state.textarea = textarea;
    text.decode();
    state.plain = text.plain();
    state.chunks = text.split(state.plain);
    panel.create();
    return true;
  },
};

const app = {
  check() {
    state.panel.dataset.done = "false";
    state.panel.style.setProperty("--proofread-progress", "0%");
    if (state.running) return;
    state.running = true;
    state.checked = true;
    panel.title("Засылаю…");
    panel.empty("");
    data
      .run()
      .then((items) => {
        state.matches = data.filter(items);
        state.view = "all";
        panel.render();
      })
      .catch((error) => panel.error(error))
      .finally(() => {
        state.running = false;
      });
  },
  run() {
    if (!editor.prepare()) return;
    app.check();
  },
};

const proofread = {
  id,
  state,
  text,
  storage,
  api,
  data,
  view,
  layout,
  row,
  shell,
  panel,
  selection,
  match,
  action,
  bind,
  file,
  editor,
  app,
  check: app.check,
  run: app.run,
};
app.run();
