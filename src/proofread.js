import { editor } from "./core/admin.js";
import { widget } from "./core/widget.js";
import { markup } from "./core/markup.js";
import { frame } from "./core/panel.js";
import { skin } from "./core/panel.skin.js";
import { toolbar } from "./core/toolbar.js";
import { emoji } from "./core/emoji.js";

const GEMINI_API_KEY = "AIzaSyCtqqfXIei99ql5HDwjGtClZ87s8vrNazw";
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
];

const proofread = {
  id: {
    skin: "proofread-style",
  },
  state: {
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
    model: [],
    debug: [],
  },
  text: {
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
      return /^[.!?…:;,]/.test(proofread.text.next(value, word));
    },
    removesPunctuation(match) {
      return (
        /[,:;!?…]$/.test(match.word || "") && !/[,:;!?…]$/.test(match.fix || "")
      );
    },

    emit() {
      const { textarea } = proofread.state;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.dispatchEvent(new Event("change", { bubbles: true }));
    },
    decode() {
      const { textarea } = proofread.state;
      const source = textarea.value;
      const result = widget.decode(source, markup.clean);
      if (result === source) return;
      textarea.value = result;
      proofread.text.emit();
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
      return markup.strip(proofread.state.textarea.value);
    },
    key(match) {
      return `${match.word}|${match.message}`;
    },
  },
  theme: {
    key: "onliner-proofread-theme",
    get() {
      const value = localStorage.getItem(proofread.theme.key);
      if (value === "dark" || value === "light") return value;
      return toolbar.theme("content");
    },
    icon(value) {
      return toolbar.themeToggleIcon(value);
    },
    set(value) {
      localStorage.setItem(proofread.theme.key, value);
      const panel = proofread.state.panel;
      if (!panel) return;
      panel.dataset.theme = value;
      const button = panel.querySelector("#proofread-theme");
      if (button) button.innerHTML = emoji.html(proofread.theme.icon(value));
    },
    toggle() {
      const next = proofread.theme.get() === "dark" ? "light" : "dark";
      proofread.theme.set(next);
    },
  },
  source: {
    enabled: { lt: false, gg: true },
    active(name) {
      return proofread.source.enabled[name] === true;
    },
    counts() {
      return proofread.state.matches.reduce(
        (state, match) => ({
          ...state,
          [match.source]: (state[match.source] || 0) + 1,
        }),
        { lt: 0, gg: 0 },
      );
    },
    visible() {
      const view = proofread.state.view;
      if (view === "all") return proofread.state.matches;
      return proofread.state.matches.filter((match) => match.source === view);
    },
    toggle(name) {
      proofread.state.view = proofread.state.view === name ? "all" : name;
      proofread.panel.render();
    },
    update() {
      const panel = proofread.state.panel;
      if (!panel) return;
      const counts = proofread.source.counts();
      panel.querySelectorAll("[data-source]").forEach((button) => {
        const name = button.dataset.source;
        button.dataset.active =
          proofread.state.view === "all" || proofread.state.view === name
            ? "true"
            : "false";
        const count = button.querySelector("[data-count]");
        if (count) count.textContent = counts[name] || 0;
      });
    },
    names() {
      return Object.entries(proofread.source.enabled)
        .filter(([, active]) => active)
        .map(([name]) => name.toUpperCase())
        .join(" + ");
    },
  },
  panel: {
    metrics() {
      const panel = proofread.state.panel;
      const list = proofread.state.list;
      const row = list?.querySelector("[data-row]");
      const style = panel ? getComputedStyle(panel) : null;
      const step =
        row?.offsetHeight ||
        parseFloat(style?.getPropertyValue("--proofread-row-height")) ||
        30;
      const border =
        parseFloat(style?.getPropertyValue("--proofread-row-border-width")) ||
        1;
      return { step: Math.max(8, Math.round(step)), border };
    },
    chrome() {
      const panel = proofread.state.panel;
      const header = panel?.querySelector("[data-header]");
      const edge = panel?.querySelector("[data-resize-edge]");
      if (!panel || !header || !edge) return 0;
      const panelStyle = getComputedStyle(panel);
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
    rows(value) {
      const list = proofread.state.list;
      const panel = proofread.state.panel;
      if (!list || !panel) return;
      const metrics = proofread.panel.metrics();
      const chrome = proofread.panel.chrome();
      const rows = Math.max(1, value);
      proofread.state.rowsVisible = rows;
      const listHeight = rows * metrics.step;
      panel.style.height = `${Math.round(chrome + listHeight)}px`;
      list.style.maxHeight = `${Math.round(listHeight)}px`;
    },
    fit() {
      const list = proofread.state.list;
      if (!list) return;
      const count = list.querySelectorAll("[data-row]").length;
      const metrics = proofread.panel.metrics();
      const currentRows = Math.max(
        1,
        Math.floor((list.clientHeight || metrics.step) / metrics.step),
      );
      const rows = Math.max(1, Math.min(currentRows, count));
      proofread.panel.rows(rows);
    },
    create() {
      frame.mount(proofread.id.skin, skin.proofread);
      const source = {
        lt: '<img alt="LanguageTool" src="https://cdn.jsdelivr.net/gh/selfhst/icons/svg/languagetool.svg">',
        gg: '<img alt="Google Gemini" src="https://api.iconify.design/logos:google-gemini.svg">',
      };
      const panel = frame.create({
        id: "proofread-panel",
        className: "panel",
        html: `
          <div data-header>
            <div id="proofread-title">
              <button class="button button-emoji" data-source="lt" title="LanguageTool">${source.lt}<span data-count="lt">0</span></button>
              <button class="button button-emoji" data-source="gg" title="Google Gemini">${source.gg}<span data-count="gg">0</span></button>
            </div>
            <div id="proofread-title" data-tabs>
              <button class="button" data-source="all">Все <span data-count="all">0</span></button>
              <button class="button" data-source="gg">${source.gg} <span data-count="gg">0</span></button>
              <button class="button" data-source="lt">${source.lt} <span data-count="lt">0</span></button>
            </div>
            <div data-mode>
              <button class="button button-emoji" id="proofread-theme" title="Тема">${emoji.html(proofread.theme.icon(proofread.theme.get()))}</button>
            </div>
            <div data-tools>
              <button class="button button-emoji" id="proofread-undo" title="Вернуть" disabled>${emoji.html("↩️")}</button>
              <button class="button button-emoji" data-download title="Скачать">${emoji.html("💾")}</button>
              <button class="button button-emoji" id="proofread-close" title="Закрыть">${emoji.html("❌")}</button>
            </div>
          </div>
          <div id="proofread-model"></div>
          <div id="proofread-list">
            <div data-empty>Засылаю…</div>
          </div>
          <div data-resize-edge></div>
        `,
      });
      panel.dataset.uiSurface = "toolbar";
      panel.dataset.theme = proofread.theme.get();
      panel.dataset.toolsReady = "false";
      panel.querySelectorAll("[data-source]").forEach((button) => {
        button.onclick = () => proofread.source.toggle(button.dataset.source);
      });
      proofread.source.update();
      panel.querySelector("#proofread-theme").onclick = () =>
        proofread.theme.toggle();
      panel.querySelector("#proofread-close").onclick = () => {
        proofread.state.listObserver?.disconnect();
        panel.remove();
      };
      proofread.state.panel = panel;
      proofread.state.list = panel.querySelector("#proofread-list");
      proofread.panel.drag();
      proofread.panel.resize();
      return panel;
    },
    drag() {
      const panel = proofread.state.panel;
      const header = panel?.querySelector("[data-header]");
      if (!panel || !header) return;
      header.style.cursor = "grab";
      header.onpointerdown = (event) => {
        if (event.button !== 0) return;
        if (event.target.closest("button,input,select,a")) return;
        const rect = panel.getBoundingClientRect();
        proofread.state.drag = {
          x: event.clientX,
          y: event.clientY,
          left: rect.left,
          top: rect.top,
        };
        panel.style.left = `${rect.left}px`;
        panel.style.top = `${rect.top}px`;
        panel.style.right = "auto";
        panel.style.transform = "none";
        header.style.cursor = "grabbing";
        panel.setPointerCapture?.(event.pointerId);
      };
      panel.onpointermove = (event) => {
        const drag = proofread.state.drag;
        if (!drag) return;
        if (proofread.state.resize) return;
        const left = Math.max(
          0,
          Math.min(
            window.innerWidth - panel.offsetWidth,
            drag.left + event.clientX - drag.x,
          ),
        );
        const top = Math.max(
          0,
          Math.min(
            window.innerHeight - panel.offsetHeight,
            drag.top + event.clientY - drag.y,
          ),
        );
        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;
      };
      panel.onpointerup = (event) => {
        if (proofread.state.drag) header.style.cursor = "grab";
        proofread.state.drag = null;
        panel.releasePointerCapture?.(event.pointerId);
      };
      panel.onpointercancel = () => {
        header.style.cursor = "grab";
        proofread.state.drag = null;
      };
    },
    resize() {
      const panel = proofread.state.panel;
      const list = proofread.state.list;
      const edge = panel?.querySelector("[data-resize-edge]");
      if (!panel || !list || !edge) return;
      edge.onpointerdown = (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        const panelRect = panel.getBoundingClientRect();
        const listRect = list.getBoundingClientRect();
        const metrics = proofread.panel.metrics();
        const baseRows = Math.max(
          1,
          proofread.state.rowsVisible ||
            Math.floor((listRect.height - metrics.border) / metrics.step),
        );
        proofread.state.resize = {
          y: event.clientY,
          panelTop: panelRect.top,
          chrome: proofread.panel.chrome(),
          baseRows,
          step: metrics.step,
          border: metrics.border,
        };
        panel.style.left = `${panelRect.left}px`;
        panel.style.top = `${panelRect.top}px`;
        panel.style.right = "auto";
        panel.style.transform = "none";
        panel.style.height = `${panelRect.height}px`;
        edge.setPointerCapture?.(event.pointerId);
      };
      edge.onpointermove = (event) => {
        const resize = proofread.state.resize;
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
        proofread.state.rowsVisible = rows;
        panel.style.height = `${Math.round((resize.chrome || 0) + listHeight)}px`;
        list.style.maxHeight = `${Math.round(listHeight)}px`;
      };
      edge.onpointerup = (event) => {
        proofread.state.resize = null;
        edge.releasePointerCapture?.(event.pointerId);
      };
      edge.onpointercancel = () => {
        proofread.state.resize = null;
      };
    },
    model(value) {
      proofread.state.model = value || proofread.state.model;
      const node = proofread.state.panel?.querySelector("#proofread-model");
      if (!node) return;
      node.textContent = proofread.state.model
        ? `Gemini: ${proofread.state.model}`
        : "";
    },
    title(value) {},
    empty(message) {
      proofread.state.list.innerHTML = `<div data-empty>${message}</div>`;
    },
    row(index) {
      return proofread.state.panel.querySelector(`[data-row="${index}"]`);
    },
    rows() {
      return [...proofread.state.panel.querySelectorAll("[data-row]")];
    },
    active() {
      return proofread.state.panel.querySelector(
        '[data-row][data-active="true"]',
      );
    },
    next(row, predicate = () => false) {
      let next = row?.nextElementSibling || null;
      while (next && predicate(proofread.state.visible[next.dataset.row])) {
        next = next.nextElementSibling;
      }
      return next;
    },
    activate(index, button, from = 0) {
      const row = proofread.panel.row(index);
      if (!row) return false;
      proofread.panel
        .rows()
        .forEach((item) => item.removeAttribute("data-active"));
      row.dataset.active = "true";
      row.scrollIntoView({ block: "nearest" });
      return proofread.match.go(
        proofread.state.visible[index],
        button || row.querySelector("[data-fix]"),
        from,
      );
    },
    activateNext(row, from = 0, predicate = () => false) {
      let next = row?.matches?.("[data-row]")
        ? row
        : (row && proofread.panel.next(row, predicate)) ||
          proofread.state.panel.querySelector("[data-row]");
      while (next) {
        const index = next.dataset.row;
        const button = next.querySelector("[data-fix]");
        if (proofread.panel.activate(index, button, from)) return;
        next.remove();
        proofread.panel.refreshTitle();
        next = proofread.state.panel.querySelector("[data-row]");
      }
    },
    refreshTitle() {
      const count = proofread.state.panel.querySelectorAll("[data-fix]").length;
      if (!count) {
        proofread.state.panel.remove();
        return;
      }
      proofread.panel.title(`Правок: ${count}`);
      proofread.panel.fit();
    },
    remove(predicate) {
      proofread.state.list.querySelectorAll("[data-fix]").forEach((button) => {
        const match = proofread.state.matches[button.dataset.fix];
        if (predicate(match)) {
          button.closest("[data-row]").remove();
        }
      });
      proofread.panel.refreshTitle();
    },
    undo(value) {
      const button = proofread.state.panel?.querySelector("#proofread-undo");
      if (button) button.disabled = !value;
    },
    render() {
      proofread.state.panel.dataset.toolsReady = "true";
      const matches = proofread.source.visible();
      proofread.source.update();
      proofread.state.visible = matches;
      proofread.state.list.innerHTML = "";
      if (!matches.length) {
        proofread.panel.empty("Правок не найдено");
        return;
      }
      matches.slice(0, 50).forEach((match, index) => {
        const options = match.variants.slice();
        options.splice(1, 0, "__other__");
        const note = proofread.text.message(match.message);
        const row = document.createElement("div");
        row.dataset.row = index;
        if (note) row.dataset.note = note;
        row.innerHTML = `
          <div class="proofread-line">
            <label data-main>
              <span>
                ${proofread.text.safe(match.word)}${match.count > 1 ? ` ×${match.count + 1}` : ""} →
              </span>
              <select class="field field-select" data-select="${index}">
                ${options
                  .map((option) =>
                    option === "__other__"
                      ? `<option value="__other__">это другое…</option>`
                      : `<option value="${proofread.text.safe(option)}">${proofread.text.safe(option)}</option>`,
                  )
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
        proofread.state.list.appendChild(row);
      });
      proofread.bind.selects();
      proofread.bind.actions();
      proofread.panel.rows(5);
      proofread.bind.list();
      proofread.panel.activateNext();
    },

    error(error) {
      proofread.state.panel.dataset.toolsReady = "true";
      proofread.state.panel.style.border =
        "2px solid var(--surface-proofread-error-border)";
      proofread.panel.title("Ошибка");
      proofread.panel.empty(proofread.text.safe(error.message));
    },
  },

  engine: {
    parse(raw) {
      try {
        return JSON.parse(raw);
      } catch {
        throw new Error(raw.slice(0, 300));
      }
    },
    cleanJson(raw) {
      const value = String(raw || "")
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      const start = value.indexOf("{");
      const end = value.lastIndexOf("}");
      if (start < 0 || end < 0) {
        return '{"edits":[]}';
      }
      return value.slice(start, end + 1);
    },
    checkLt(chunk) {
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
          proofread.state.debug.push({
            source: "lt",
            chunk,
            raw,
          });
          return proofread.engine.parse(raw);
        });
    },
    prompt(value) {
      return [
        "Ты НЕ редактор. Ты только корректор.",
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
        "- заменять папа на отец, мама на Марина, двушка на квартира;",
        "- заменять 2024-го на 2024 года;",
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
    checkGg(chunk) {
      const module = {
        url(model) {
          return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        },
        body(chunk) {
          return JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: proofread.engine.prompt(chunk) }],
              },
            ],
            generationConfig: {
              temperature: 0,
              responseMimeType: "application/json",
            },
          });
        },
        unavailable(data) {
          const code = data.error?.code;
          return code === 503 || code === 429;
        },
        message(data, model) {
          const code = data.error?.code;
          if (code === 503) return `${model}: перегружен`;
          if (code === 429) return `${model}: превышен лимит`;
          if (code === 400) return `${model}: некорректный запрос`;
          return data.error?.message || `${model}: ошибка Gemini API`;
        },
        parse(raw, model, chunk) {
          proofread.state.debug.push({
            source: "gg",
            model,
            chunk,
            raw,
          });
          const data = proofread.engine.parse(raw);
          if (data.error) return { error: data.error, model };
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) return { edits: [], model };
          try {
            return {
              ...proofread.engine.parse(proofread.engine.cleanJson(text)),
              model,
            };
          } catch {
            return { edits: [], model };
          }
        },
        request(model, chunk) {
          return fetch(module.url(model), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: module.body(chunk),
          })
            .then((response) => response.text())
            .then((raw) => module.parse(raw, model, chunk));
        },
        run(models, chunk) {
          if (!GEMINI_API_KEY || GEMINI_API_KEY === "PASTE_GEMINI_API_KEY") {
            throw new Error("Вставь Gemini API key в GEMINI_API_KEY");
          }
          const [model, ...rest] = models;
          if (!model) throw new Error("Gemini недоступен. Попробуй позже.");
          proofread.panel.model(model);
          return module.request(model, chunk).then((data) => {
            if (!data.error) {
              proofread.panel.model(data.model);
              return data;
            }
            if (module.unavailable(data) && rest.length) {
              return module.run(rest, chunk);
            }
            throw new Error(module.message(data, model));
          });
        },
      };
      return module.run(GEMINI_MODELS, chunk);
    },
    lt(index = 0, all = []) {
      if (index >= proofread.state.chunks.length) return Promise.resolve(all);
      proofread.panel.title(
        `LT: ${index + 1}/${proofread.state.chunks.length}`,
      );
      return proofread.engine
        .checkLt(proofread.state.chunks[index])
        .then((data) => {
          const matches = (data.matches || []).map((match) => ({
            source: "lt",
            word: proofread.state.chunks[index].slice(
              match.offset,
              match.offset + match.length,
            ),
            fix: match.replacements?.[0]?.value || "",
            variants: (match.replacements || [])
              .slice(0, 10)
              .map((item) => item.value),
            message: match.message,
            replaceAll: true,
          }));
          return proofread.engine.lt(index + 1, all.concat(matches));
        });
    },
    gg(index = 0, all = []) {
      if (index >= proofread.state.chunks.length) return Promise.resolve(all);
      proofread.panel.title(
        `GG: ${index + 1}/${proofread.state.chunks.length}`,
      );
      return proofread.engine
        .checkGg(proofread.state.chunks[index])
        .then((data) => {
          const edits = Array.isArray(data.edits) ? data.edits : [];
          const matches = edits.map((edit) => ({
            source: "gg",
            word: String(edit.before || ""),
            fix: String(edit.after || ""),
            variants: [String(edit.after || "")],
            message: edit.reason ? `Gemini: ${edit.reason}` : "Gemini",
            confidence: Number(edit.confidence) || 0,
            replaceAll: false,
          }));
          return proofread.engine.gg(index + 1, all.concat(matches));
        });
    },
    run() {
      const jobs = [];
      if (proofread.source.active("lt")) jobs.push(proofread.engine.lt());
      if (proofread.source.active("gg")) jobs.push(proofread.engine.gg());
      if (!jobs.length) return Promise.resolve([]);
      proofread.panel.title(`Проверка: ${proofread.source.names()}`);
      return Promise.all(jobs).then((items) => items.flat());
    },
    filter(matches) {
      const value = proofread.state.textarea.value;
      const safe = matches.filter(
        (match) =>
          match.word &&
          match.fix &&
          match.word !== match.fix &&
          !proofread.text.ignored.has(match.word.toLowerCase()) &&
          !proofread.text.punctuation(match.fix) &&
          !proofread.state.ignored.has(proofread.text.key(match)) &&
          (match.source !== "gg" || match.confidence >= 0.8) &&
          (match.source !== "gg" || !proofread.text.stylistic(match.message)) &&
          (match.source !== "gg" || !proofread.text.longer(match)) &&
          (match.source !== "gg" ||
            !proofread.text.removesPunctuation(match)) &&
          value.includes(match.word),
      );
      return proofread.engine.group(safe);
    },
    group(matches) {
      const groups = new Map();
      matches.forEach((match) => {
        if (match.source === "gg") {
          groups.set(`${match.source}|${groups.size}|${match.word}`, {
            ...match,
            count: 1,
          });
          return;
        }
        const groupKey = proofread.text.key(match);
        const current = groups.get(groupKey);
        if (!current) {
          groups.set(groupKey, { ...match, count: 1 });
          return;
        }
        current.count += 1;
      });
      return [...groups.values()];
    },
  },
  match: {
    miss(button) {
      proofread.match.flash(button, "red", 900);
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
      const { textarea } = proofread.state;
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
      const { textarea } = proofread.state;
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(position, position + length);
      proofread.match.scroll(position);
      requestAnimationFrame(() => {
        textarea.focus({ preventScroll: true });
        textarea.setSelectionRange(position, position + length);
        proofread.match.scroll(position);
      });
    },
    go(match, button, from = 0) {
      const { textarea } = proofread.state;
      let position = textarea.value.indexOf(match.word, from);
      if (position < 0 && from > 0) {
        position = textarea.value.indexOf(match.word);
      }
      if (position < 0) {
        proofread.match.miss(button);
        return false;
      }
      proofread.match.focus(position, match.word.length);
      return true;
    },
    fix(index) {
      const select = proofread.state.panel.querySelector(
        `[data-select="${index}"]`,
      );
      const input = proofread.state.panel.querySelector(
        `[data-input="${index}"]`,
      );
      if (select?.value === "__other__") {
        return input?.value || proofread.state.visible[index].fix;
      }
      return (
        select?.value || input?.value || proofread.state.visible[index].fix
      );
    },
    apply(index, button, from = 0) {
      const { textarea, visible } = proofread.state;
      const match = visible[index];
      let position = textarea.value.indexOf(match.word, from);
      if (position < 0 && from > 0) {
        position = textarea.value.indexOf(match.word);
      }
      if (position < 0) {
        proofread.match.miss(button);
        return false;
      }
      const fix = proofread.match.fix(index);
      const after = match.replaceAll
        ? textarea.value.split(match.word).join(fix)
        : textarea.value.slice(0, position) +
          fix +
          textarea.value.slice(position + match.word.length);
      proofread.state.undo = {
        type: "apply",
        before: textarea.value,
        after,
      };
      proofread.panel.undo(true);
      textarea.value = after;
      proofread.text.emit();
      proofread.match.focus(position, fix.length);
      return true;
    },
    ignore(index) {
      const match = proofread.state.visible[index];
      const row = proofread.panel.row(index);
      if (!match || !row) return;
      const from = proofread.state.textarea.selectionEnd;
      const matchKey = proofread.text.key(match);
      const same = (item) => proofread.text.key(item) === matchKey;
      proofread.state.ignored.add(matchKey);
      row.remove();
      proofread.panel.refreshTitle();
      proofread.panel.activateNext(null, from, same);
    },
  },
  bind: {
    list() {
      const list = proofread.state.list;
      if (!list) return;
      proofread.state.listObserver?.disconnect();
      const observer = new MutationObserver(() => {
        if (proofread.state.fitFrame)
          cancelAnimationFrame(proofread.state.fitFrame);
        proofread.state.fitFrame = requestAnimationFrame(() => {
          proofread.state.fitFrame = null;
          proofread.panel.fit();
        });
      });
      observer.observe(list, { childList: true });
      proofread.state.listObserver = observer;
    },
    selects() {
      proofread.state.panel
        .querySelectorAll("[data-select]")
        .forEach((select) => {
          select.onchange = () => {
            const index = select.dataset.select;
            const input = proofread.state.panel.querySelector(
              `[data-input="${index}"]`,
            );
            if (!input) return;
            if (select.value !== "__other__") {
              select.style.display = "";
              input.style.display = "none";
              return;
            }
            select.style.display = "none";
            input.style.display = "inline-block";
            input.value = proofread.state.visible[index].word;
            input.focus();
            input.select();
            input.onblur = () => {
              input.style.display = "none";
              select.style.display = "";
            };
          };
        });
    },
    actions() {
      proofread.state.panel.querySelectorAll("[data-go]").forEach((button) => {
        button.onclick = () => {
          const index = button.dataset.go;
          const row = proofread.panel.row(index);
          const from = proofread.state.textarea.selectionEnd;
          if (proofread.panel.activate(index, button, from)) return;
          row?.remove();
          proofread.panel.refreshTitle();
          proofread.panel.activateNext(null, from);
        };
      });
      proofread.state.panel.querySelectorAll("[data-row]").forEach((row) => {
        row.onclick = (event) => {
          if (event.target.closest("button,select,input")) return;
          const index = row.dataset.row;
          const button = row.querySelector("[data-go]");
          const from = proofread.state.textarea.selectionEnd;
          if (proofread.panel.activate(index, button, from)) return;
          row.remove();
          proofread.panel.refreshTitle();
          proofread.panel.activateNext(null, from);
        };
      });
      proofread.state.panel
        .querySelectorAll("[data-search]")
        .forEach((button) => {
          button.onclick = () => {
            const index = button.dataset.search;
            const match = proofread.state.visible[index];
            proofread.panel.activate(index, button);
            proofread.text.copy(match.word);
            const query = encodeURIComponent(match.word);
            proofread.match.flash(button, "blue");
            window.open(`https://www.google.com/search?q=${query}`, "_blank");
          };
        });
      proofread.state.panel.querySelectorAll("[data-fix]").forEach((button) => {
        button.onclick = () => {
          const index = button.dataset.fix;
          const row = proofread.panel.row(index);
          if (!row) return;
          if (proofread.panel.active() !== row) {
            proofread.panel.activate(index, button);
            return;
          }
          if (
            proofread.match.apply(
              index,
              button,
              proofread.state.textarea.selectionStart,
            )
          ) {
            const from = proofread.state.textarea.selectionEnd;
            proofread.match.flash(button, "green");
            setTimeout(() => {
              row.remove();
              proofread.panel.refreshTitle();
              proofread.panel.activateNext(row, from);
            }, 220);
          }
        };
      });
      proofread.state.panel.querySelectorAll("[data-ok]").forEach((button) => {
        button.onclick = () => {
          const index = button.dataset.ok;
          const match = proofread.state.visible[index];
          const row = button.closest("[data-row]");
          if (!match || !row) return;
          const from = proofread.state.textarea.selectionEnd;
          const matchKey = proofread.text.key(match);
          const same = (item) => proofread.text.key(item) === matchKey;
          const next = proofread.panel.next(row, same);
          proofread.state.undo = {
            type: "ignore",
            key: matchKey,
            row: row.cloneNode(true),
            next: row.nextElementSibling,
          };
          proofread.panel.undo(true);
          proofread.state.ignored.add(matchKey);
          proofread.match.flash(button, "green");
          setTimeout(() => {
            row.remove();
            proofread.panel.refreshTitle();
            proofread.panel.activateNext(next, from, same);
          }, 220);
        };
      });
      proofread.state.panel.querySelector("#proofread-undo").onclick = () => {
        const undo = proofread.state.undo;
        if (!undo) return;
        if (undo.type === "apply") {
          proofread.state.textarea.value = undo.before;
          proofread.text.emit();
        }
        if (undo.type === "ignore") {
          proofread.state.ignored.delete(undo.key);
          if (undo.next?.parentNode) {
            undo.next.before(undo.row);
          } else {
            proofread.state.list.appendChild(undo.row);
          }
          proofread.panel
            .rows()
            .forEach((item) => item.removeAttribute("data-active"));
          undo.row.dataset.active = "true";
          proofread.bind.actions();
          const index = undo.row.dataset.row;
          const button = undo.row.querySelector("[data-fix]");
          proofread.panel.activate(
            index,
            button,
            proofread.state.textarea.selectionEnd,
          );
        }
        proofread.state.undo = null;
        proofread.panel.undo(false);
        proofread.panel.refreshTitle();
      };
      proofread.state.panel
        .querySelectorAll("[data-download]")
        .forEach((button) => {
          button.onclick = proofread.download;
        });
    },
  },
  download() {
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
      data() {
        return {
          view: proofread.state.view,
          model: proofread.state.model,
          plain: proofread.state.plain,
          chunks: proofread.state.chunks,
          debug: proofread.state.debug,
          matches: proofread.state.matches,
          visible: proofread.state.visible,
        };
      },
      run() {
        const value = prompt("Что скачать: text/debug/all?", "all");
        if (value === "text") {
          file.save(
            "proofread-text.txt",
            proofread.state.plain,
            "text/plain;charset=utf-8",
          );
          return;
        }
        if (value === "all") {
          file.save("proofread-all.json", JSON.stringify(file.data(), null, 2));
          return;
        }
        file.save(
          "proofread-debug.json",
          JSON.stringify(
            {
              chunks: proofread.state.chunks,
              debug: proofread.state.debug,
            },
            null,
            2,
          ),
        );
      },
    };
    try {
      file.run();
    } catch {}
  },
  init() {
    editor.html();
    const textarea = document.querySelector("#content");
    if (!textarea) return false;
    proofread.state.textarea = textarea;
    proofread.text.decode();
    proofread.state.plain = proofread.text.plain();
    proofread.state.chunks = proofread.text.split(proofread.state.plain);
    proofread.panel.create();
    return true;
  },
  check() {
    if (proofread.state.running) return;
    proofread.state.running = true;
    proofread.panel.empty("Засылаю…");
    proofread.engine
      .run()
      .then((matches) => {
        proofread.state.matches = proofread.engine.filter(matches);
        proofread.state.view = "all";
        proofread.panel.render();
      })
      .catch((error) => proofread.panel.error(error))
      .finally(() => {
        proofread.state.running = false;
      });
  },
  run() {
    if (!proofread.init()) return;
    proofread.check();
  },
};
proofread.run();
