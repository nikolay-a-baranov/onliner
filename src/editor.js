import { frame } from "./core/panel.js";

(() => {
  const id = "editor-panel";
  const css = `
    #editor-panel {
      right: 20px;
      top: 40px;
      padding: var(--panel-pad);
    }
    #editor-panel .button {
      min-width: 28px;
      padding-inline: 6px;
    }
    #editor-panel [data-row] {
      display: flex;
      gap: var(--control-gap);
      margin-bottom: var(--panel-row-gap);
    }
    #editor-panel [data-row]:last-child {
      margin-bottom: 0;
    }
    #editor-panel[data-inside="true"] {
      width: 92px;
      opacity: .72;
      transition: opacity .12s ease;
    }
    #editor-panel[data-inside="true"]:hover {
      opacity: 1;
    }
    #editor-panel[data-inside="true"] [data-row] {
      flex-direction: column;
      gap: 4px;
    }
    #editor-panel[data-inside="true"] .button {
      width: 100%;
      min-width: 0;
      justify-content: flex-start;
      text-align: left;
      padding-inline: 8px;
    }
    #editor-panel[data-layout="bottom"],
    #editor-panel[data-layout="fullscreen"] {
      position: fixed;
      left: 0;
      right: auto;
      top: auto;
      bottom: 0;
      width: 100vw;
      box-sizing: border-box;
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding: 8px;
      opacity: 1;
      scrollbar-width: none;
    }
    #editor-panel[data-layout="bottom"]::-webkit-scrollbar,
    #editor-panel[data-layout="fullscreen"]::-webkit-scrollbar {
      display: none;
    }
    #editor-panel[data-layout="bottom"] {
      background: rgba(17,17,17,.94);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    #editor-panel[data-layout="bottom"] [data-row],
    #editor-panel[data-layout="fullscreen"] [data-row] {
      margin-bottom: 0;
      flex: 0 0 auto;
      gap: 6px;
    }
    #editor-panel[data-layout="bottom"] .button,
    #editor-panel[data-layout="fullscreen"] .button {
      min-width: 42px;
      height: 38px;
      padding-inline: 10px;
      white-space: nowrap;
    }
    #editor-panel[data-layout="fullscreen"] [data-action="close"] {
      display: none;
    }
    #editor-panel[data-layout="fullscreen"] {
      left: 50% !important;
      transform: translateX(-50%);
      width: fit-content !important;
      max-width: calc(100vw - 60px);
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
      justify-content: flex-start;
      padding: 12px 12px;
      gap: 8px;
      opacity: 1;
      border-radius: 999px;
      outline: 0 !important;
      bottom: 32px !important;
      backdrop-filter: blur(26px) saturate(1.6);
      -webkit-backdrop-filter: blur(26px) saturate(1.6);
    }
    #editor-panel[data-layout="fullscreen"]::-webkit-scrollbar {
      display: none;
    }
    body.onliner-mobile-active,
    html:has(body.onliner-mobile-active) {
      overflow: hidden !important;
    }
    @media (min-width: 1200px) {
      #editor-panel[data-layout="fullscreen"] {
        max-width: calc(100vw - 400px) !important;
      }
    }
    #editor-panel[data-layout="fullscreen"][data-theme="dark"] {
      background: rgba(34,34,34,.46) !important;
      border: 1px solid rgba(255,255,255,.14) !important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.10),
        0 12px 36px rgba(0,0,0,.34) !important;
    }
    #editor-panel[data-layout="fullscreen"][data-theme="light"] {
      background: rgba(255,255,255,.48) !important;
      border: 1px solid rgba(0,0,0,.10) !important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.82),
        0 10px 30px rgba(0,0,0,.06) !important;
    }
    #editor-panel[data-layout="fullscreen"]::before,
    #editor-panel[data-layout="fullscreen"]::after {
      display: none !important;
      content: none !important;
    }
    #editor-panel[data-layout="fullscreen"] [data-row] {
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      flex: 0 0 auto;
    }
    #editor-panel[data-layout="fullscreen"] .button {
      appearance: none !important;
      -webkit-appearance: none !important;
      height: 30px !important;
      min-width: 30px !important;
      padding: 0 9px !important;
      border-radius: 999px !important;
      border: 1px solid transparent !important;
      outline: 0 !important;
      box-shadow: none !important;
      background: transparent !important;
      background-image: none !important;
      text-shadow: none !important;
      font-weight: 400 !important;
      opacity: .78;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      transition:
        opacity .12s ease,
        background-color .12s ease,
        border-color .12s ease;
    }
    #editor-panel[data-layout="fullscreen"] .button.button-text {
      border-radius: 999px !important;
      background-image: none !important;
      line-height: 30px !important;
    }
    #editor-panel[data-layout="fullscreen"][data-theme="dark"] .button {
      color: rgba(255,255,255,.94) !important;
    }
    #editor-panel[data-layout="fullscreen"][data-theme="light"] .button {
      color: rgba(0,0,0,.82) !important;
    }
    #editor-panel[data-layout="fullscreen"] .button:hover,
    #editor-panel[data-layout="fullscreen"] .button:focus-visible {
      opacity: 1;
    }
    #editor-panel[data-layout="fullscreen"][data-theme="dark"] .button:hover,
    #editor-panel[data-layout="fullscreen"][data-theme="dark"] .button:focus-visible {
      background: rgba(255,255,255,.12) !important;
      border-color: rgba(255,255,255,.14) !important;
    }
    #editor-panel[data-layout="fullscreen"][data-theme="light"] .button:hover,
    #editor-panel[data-layout="fullscreen"][data-theme="light"] .button:focus-visible {
      background: rgba(0,0,0,.07) !important;
      border-color: rgba(0,0,0,.08) !important;
      box-shadow: none !important;
    }
    #editor-panel[data-layout="fullscreen"] .button:active {
      transform: scale(.96);
    }
    #editor-panel[data-active~="nbsp"] [data-action="nbsp"],
    #editor-panel[data-active~="em"] [data-action="em"],
    #editor-panel[data-active~="strong"] [data-action="strong"],
    #editor-panel[data-active~="comma"] [data-action="comma"],
    #editor-panel[data-active~="dash"] [data-action="dash"],
    #editor-panel[data-active~="quote"] [data-action="quote"],
    #editor-panel[data-active~="list"] [data-action="list"],
    #editor-panel[data-active~="abbr"] [data-action="abbr"],
    #editor-panel[data-active~="note"] [data-action="note"] {
      opacity: 1;
    }
    #editor-panel[data-layout="fullscreen"][data-theme="dark"][data-active~="nbsp"] [data-action="nbsp"],
    #editor-panel[data-layout="fullscreen"][data-theme="dark"][data-active~="em"] [data-action="em"],
    #editor-panel[data-layout="fullscreen"][data-theme="dark"][data-active~="strong"] [data-action="strong"],
    #editor-panel[data-layout="fullscreen"][data-theme="dark"][data-active~="comma"] [data-action="comma"],
    #editor-panel[data-layout="fullscreen"][data-theme="dark"][data-active~="dash"] [data-action="dash"],
    #editor-panel[data-layout="fullscreen"][data-theme="dark"][data-active~="quote"] [data-action="quote"],
    #editor-panel[data-layout="fullscreen"][data-theme="dark"][data-active~="list"] [data-action="list"],
    #editor-panel[data-layout="fullscreen"][data-theme="dark"][data-active~="abbr"] [data-action="abbr"],
    #editor-panel[data-layout="fullscreen"][data-theme="dark"][data-active~="note"] [data-action="note"] {
      background: rgba(255,255,255,.12) !important;
      border-color: rgba(255,255,255,.14) !important;
    }
    #editor-panel[data-layout="fullscreen"][data-theme="light"][data-active~="nbsp"] [data-action="nbsp"],
    #editor-panel[data-layout="fullscreen"][data-theme="light"][data-active~="em"] [data-action="em"],
    #editor-panel[data-layout="fullscreen"][data-theme="light"][data-active~="strong"] [data-action="strong"],
    #editor-panel[data-layout="fullscreen"][data-theme="light"][data-active~="comma"] [data-action="comma"],
    #editor-panel[data-layout="fullscreen"][data-theme="light"][data-active~="dash"] [data-action="dash"],
    #editor-panel[data-layout="fullscreen"][data-theme="light"][data-active~="quote"] [data-action="quote"],
    #editor-panel[data-layout="fullscreen"][data-theme="light"][data-active~="list"] [data-action="list"],
    #editor-panel[data-layout="fullscreen"][data-theme="light"][data-active~="abbr"] [data-action="abbr"],
    #editor-panel[data-layout="fullscreen"][data-theme="light"][data-active~="note"] [data-action="note"] {
      background: rgba(0,0,0,.07) !important;
      border-color: rgba(0,0,0,.08) !important;
    }
  `;
  const button = (item) =>
    `<button class="button button-text" data-action="${item.action}" data-short="${item.short || item.label}">${item.label}</button>`;
  const row = (items) => `<div data-row>${items.map(button).join("")}</div>`;
  const buttons = [
    [
      { action: "nbsp", label: "🔦 nbsp", short: "nbsp" },
      { action: "em", label: "🩹 em", short: "em" },
      { action: "strong", label: "🩹 strong", short: "strong" },
      { action: "killem", label: "💀 em", short: "kill" },
    ],
    [
      { action: "comma", label: "⌨️ ,", short: "," },
      { action: "dash", label: "⌨️ —", short: "—" },
      { action: "swap", label: "⌨️ : ↔ —", short: ":↔—" },
      { action: "quote", label: "⌨️ «„“»", short: "«»" },
      { action: "accent", label: "💪", short: "́" },
    ],
    [
      { action: "left", label: "⬅️ ←", short: "←" },
      { action: "right", label: "➡️ →", short: "→" },
      { action: "home", label: "🔙 ⇤", short: "⇤" },
      { action: "number", label: "#️ #", short: "#" },
      { action: "symbol", label: "🔣", short: "🔣" },
      { action: "math", label: "🔢", short: "🔢" },
    ],
    [
      { action: "note", label: "💭 Прим.", short: "Прим." },
      { action: "abbr", label: "🤏 Сокр.", short: "Сокр." },
      { action: "list", label: "📃 Список", short: "Список" },
    ],
    [
      { action: "gramota", label: "🔎 Грамота", short: "Грам." },
      { action: "google", label: "🔎 Гугл", short: "Гугл" },
      { action: "kinopoisk", label: "🔎 Кинопоиск", short: "Кино" },
    ],
    [{ action: "close", label: "❌", short: "❌", system: true }],
  ];
  const html = buttons.map(row).join("");
  const exists = document.getElementById(id);
  if (exists) {
    exists.remove();
    return;
  }
  const panel = frame.create({ id, html, place: "right" });
  frame.mount(`${id}-style`, css);
  const editor = {
    screen() {
      const viewport = window.visualViewport;
      if (!viewport)
        return {
          width: window.innerWidth,
          height: window.innerHeight,
          offsetLeft: 0,
          offsetTop: 0,
        };
      return {
        width: viewport.width,
        height: viewport.height,
        offsetLeft: viewport.offsetLeft,
        offsetTop: viewport.offsetTop,
      };
    },
    phone() {
      const screen = editor.screen();
      const touch = window.matchMedia("(pointer: coarse)").matches;
      const device = Math.min(window.screen.width, window.screen.height) <= 768;
      return touch || device || screen.width <= 768;
    },
    fullscreen() {
      return document.body.classList.contains("onliner-mobile-active");
    },
    layout() {
      if (editor.fullscreen()) return "fullscreen";
      if (editor.phone()) return "bottom";
      return "side";
    },
    theme() {
      const value = document.getElementById("content");
      const color = value ? getComputedStyle(value).backgroundColor : "";
      if (color.includes("255, 255, 255")) return "light";
      return "dark";
    },
    place(panel) {
      const layout = editor.layout();
      panel.dataset.layout = layout;
      panel.dataset.theme = editor.theme();
      if (panel.dataset.manual === "true") return;
      if (layout === "side") return editor.placeSide(panel);
      return editor.placeBottom(panel);
    },
    position(value) {
      const key = "editor-panel-position";
      if (value === undefined) {
        try {
          return JSON.parse(localStorage.getItem(key) || "null");
        } catch {
          return null;
        }
      }
      localStorage.setItem(key, JSON.stringify(value));
      return value;
    },
    placeFloating(panel, value) {
      panel.style.setProperty("left", `${value.left}px`, "important");
      panel.style.setProperty("top", `${value.top}px`, "important");
      panel.style.setProperty("right", "auto", "important");
      panel.style.setProperty("bottom", "auto", "important");
      panel.style.setProperty("width", "auto", "important");
      panel.style.setProperty("transform", "none", "important");
    },
    drag(panel) {
      if (panel.dataset.drag === "true") return;
      panel.dataset.drag = "true";
      let active = false;
      let startX = 0;
      let startY = 0;
      let left = 0;
      let top = 0;
      const down = (event) => {
        if (event.target.closest(".button")) return;
        active = true;
        panel.dataset.manual = "true";
        const rect = panel.getBoundingClientRect();
        startX = event.clientX;
        startY = event.clientY;
        left = rect.left;
        top = rect.top;
        panel.style.setProperty("transition", "none", "important");
        panel.style.setProperty("cursor", "grabbing", "important");
        panel.setPointerCapture?.(event.pointerId);
      };
      const move = (event) => {
        if (!active) return;
        const nextLeft = left + event.clientX - startX;
        const nextTop = top + event.clientY - startY;
        panel.style.setProperty("left", `${nextLeft}px`, "important");
        panel.style.setProperty("top", `${nextTop}px`, "important");
        panel.style.setProperty("right", "auto", "important");
        panel.style.setProperty("bottom", "auto", "important");
        panel.style.setProperty("width", "auto", "important");
        panel.style.setProperty("transform", "none", "important");
      };
      const up = (event) => {
        if (!active) return;
        active = false;
        panel.style.removeProperty("transition");
        panel.style.removeProperty("cursor");
        panel.releasePointerCapture?.(event.pointerId);
        const rect = panel.getBoundingClientRect();
        const snap = 96;
        const center = window.innerWidth / 2;
        const top = 96;
        const bottom = 60;
        if (rect.top < snap) {
          panel.style.setProperty("left", `${center}px`, "important");
          panel.style.setProperty("transform", "translateX(-50%)", "important");
          panel.style.setProperty("top", `${top}px`, "important");
          panel.style.setProperty("right", "auto", "important");
          panel.style.setProperty("bottom", "auto", "important");
          editor.position({ left: center, top });
          return;
        }
        if (window.innerHeight - rect.bottom < snap) {
          const value = window.innerHeight - rect.height - bottom;
          panel.style.setProperty("left", `${center}px`, "important");
          panel.style.setProperty("transform", "translateX(-50%)", "important");
          panel.style.setProperty("top", `${value}px`, "important");
          panel.style.setProperty("right", "auto", "important");
          panel.style.setProperty("bottom", "auto", "important");
          editor.position({ left: center, top: value });
          return;
        }
        editor.position({
          left: parseFloat(panel.style.left),
          top: parseFloat(panel.style.top),
        });
      };
      panel.addEventListener("pointerdown", down);
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    placeSide(panel) {
      const field = document.getElementById("content");
      if (!field) return;
      const rect = field.getBoundingClientRect();
      const outside = rect.right + 16;
      const inside = rect.right - panel.offsetWidth - 12;
      const free = outside + panel.offsetWidth <= window.innerWidth - 12;
      const left =
        window.innerWidth >= 1400 && free ? outside : Math.max(12, inside);
      panel.dataset.inside =
        window.innerWidth >= 1400 && free ? "false" : "true";
      panel.style.left = `${left}px`;
      panel.style.right = "auto";
      panel.style.top = `${Math.max(12, rect.top + 12)}px`;
      panel.style.bottom = "auto";
    },
    placeBottom(panel) {
      const screen = editor.screen();
      const layout = editor.layout();
      panel.dataset.inside = "false";
      panel.style.setProperty("right", "auto", "important");
      panel.style.setProperty("top", "auto", "important");
      if (layout === "fullscreen") {
        panel.style.setProperty("left", "50%", "important");
        panel.style.setProperty("bottom", "60px", "important");
        panel.style.setProperty("width", "fit-content", "important");
        panel.style.setProperty("transform", "translateX(-50%)", "important");
        return;
      }
      panel.style.setProperty("left", `${screen.offsetLeft}px`, "important");
      panel.style.setProperty(
        "bottom",
        `${Math.max(0, window.innerHeight - screen.height - screen.offsetTop)}px`,
        "important",
      );
      panel.style.setProperty("width", `${screen.width}px`, "important");
      panel.style.setProperty("transform", "none", "important");
    },
    get() {
      const element = document.activeElement;
      if (!element) return null;
      if (element.tagName !== "TEXTAREA" && element.tagName !== "INPUT")
        return null;
      return element;
    },
    emit(element) {
      ["input", "change"].forEach((type) =>
        element.dispatchEvent(new Event(type, { bubbles: true })),
      );
    },
    done(element) {
      editor.emit(element);
      element.focus();
      editor.mark(panel, editor.state(element));
    },
    block(value, start, end) {
      const left = value.lastIndexOf("\n", start - 1) + 1;
      const right = value.indexOf("\n", end);
      return {
        start: left,
        end: right < 0 ? value.length : right,
      };
    },
    trim(value, start, end) {
      const string = value.slice(start, end);
      const left = string.match(/^\s*/)[0].length;
      const right = string.match(/\s*$/)[0].length;
      return {
        start: start + left,
        end: end - right,
      };
    },
    inside(value, start, end) {
      const string = value.slice(start, end);
      const left = string.match(/^\s*(?:<[^/][^>]*>\s*)*/)[0].length;
      const right = string.match(/(?:\s*<\/[^>]+>)*\s*$/)[0].length;
      return {
        start: start + left,
        end: end - right,
      };
    },
    scope(value, start, end) {
      const block = editor.block(value, start, end);
      const text = value.slice(block.start, block.end);
      const local = start - block.start;
      const left = text.slice(0, local);
      const right = text.slice(local);
      const before = left.match(/[.!?…](?:\s|<\/?[^>]+>|[»“"'])*$/);
      const after = right.match(/[.!?…](?:\s|<\/?[^>]+>|[»“"'])*/);
      const from = before
        ? editor.skip(text, left.length - before[0].length + 1)
        : editor.skip(text, 0);
      const to = after ? local + after.index + after[0].length : text.length;
      return {
        start: block.start + from,
        end: block.start + to,
      };
    },
    range(value, start, end) {
      if (start !== end) return editor.trim(value, start, end);
      const block = editor.block(value, start, end);
      return editor.inside(value, block.start, block.end);
    },
    word(value, start) {
      const before = value.slice(0, start).match(/[А-Яа-яA-Za-zЁё0-9]+$/);
      const after = value.slice(start).match(/^[А-Яа-яA-Za-zЁё0-9]+/);
      return {
        start: before ? start - before[0].length : start,
        end: start + (after ? after[0].length : 0),
      };
    },
    item(value, start, end) {
      if (start !== end) return editor.trim(value, start, end);
      return editor.word(value, start);
    },
    clean(value) {
      return value
        .replace(/<\/?[^>]+>/g, "")
        .replace(/[«„“”"']/g, "")
        .trim();
    },
    skip(value, index) {
      let next = index;
      while (true) {
        const string = value.slice(next);
        const tag = string.match(/^<\/?[^>]+>/);
        if (tag) {
          next += tag[0].length;
          continue;
        }
        const quote = string.match(/^[\s«„“”"']+/);
        if (quote) {
          next += quote[0].length;
          continue;
        }
        return next;
      }
    },
    start(value, index) {
      return !editor.clean(value.slice(0, index));
    },
    gap(value) {
      return editor.clean(value) ? " " : "";
    },
    letter(value, upper) {
      return value.replace(
        /^((?:<[^>]+>|\s|[«„“"'()])+)?([А-Яа-яA-Za-zЁё])/,
        (_, left = "", letter) =>
          `${left}${upper ? letter.toUpperCase() : letter.toLowerCase()}`,
      );
    },
    sentence(value, index) {
      const left = value.slice(0, index);
      const match = left.match(/[.!?…:](?:\s|<\/?[^>]+>|[»“"'])*$/);
      if (!match) return editor.skip(value, 0);
      return editor.skip(value, left.length - match[0].length + 1);
    },
    tag(value, start, name) {
      const before = `<${name}>`;
      const after = `</${name}>`;
      const left = value.slice(0, start);
      const open = left.lastIndexOf(before);
      const close = left.lastIndexOf(after);
      if (open < 0 || open < close) return null;
      const right = value.slice(start);
      const end = right.indexOf(after);
      if (end < 0) return null;
      return {
        start: open,
        end: start + end + after.length,
        bodyStart: open + before.length,
        bodyEnd: start + end,
        before,
        after,
      };
    },
    insideTag(value, start, tag) {
      const left = value.slice(0, start);
      const open = left.lastIndexOf(`<${tag}>`);
      const close = left.lastIndexOf(`</${tag}>`);
      return open > close;
    },
    replace(element, string) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      element.value = value.slice(0, start) + string + value.slice(end);
      element.selectionStart = start + string.length;
      element.selectionEnd = start + string.length;
      editor.done(element);
    },
    wrap(element, before, after) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      const range = editor.range(value, start, end);
      const string = value.slice(range.start, range.end);
      element.value =
        value.slice(0, range.start) +
        before +
        string +
        after +
        value.slice(range.end);
      const cursor = Math.min(start + before.length, element.value.length);
      element.selectionStart = cursor;
      element.selectionEnd = cursor;
      editor.done(element);
    },
    unwrap(element, data, start) {
      const value = element.value;
      const body = value.slice(data.bodyStart, data.bodyEnd);
      element.value = value.slice(0, data.start) + body + value.slice(data.end);
      const cursor = Math.max(data.start, start - data.before.length);
      element.selectionStart = cursor;
      element.selectionEnd = cursor;
      editor.done(element);
    },
    taggle(element, name) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      if (start === end) {
        const data = editor.tag(value, start, name);
        if (data) {
          editor.unwrap(element, data, start);
          return;
        }
      }
      editor.wrap(element, `<${name}>`, `</${name}>`);
    },
    clear(element) {
      if (!confirm("Раскурсивить всё?")) return;
      element.value = element.value.replace(/<\/?em>/g, "");
      editor.done(element);
    },
    nbsp(element) {
      const start = element.selectionStart;
      const value = element.value;
      if (value[start - 1] === "\u00a0") {
        element.value = value.slice(0, start - 1) + " " + value.slice(start);
        element.selectionStart = start;
        element.selectionEnd = start;
        editor.done(element);
        return;
      }
      if (value[start] === "\u00a0") {
        element.value = value.slice(0, start) + " " + value.slice(start + 1);
        element.selectionStart = start + 1;
        element.selectionEnd = start + 1;
        editor.done(element);
        return;
      }
      const left = value.slice(0, start);
      const right = value.slice(start);
      const before = left.replace(/ $/, "\u00a0");
      const after = before === left ? right.replace(/^ /, "\u00a0") : right;
      element.value = before + after;
      element.selectionStart = before.length;
      element.selectionEnd = before.length;
      editor.done(element);
    },
    comma(element) {
      const start = element.selectionStart;
      const value = element.value;
      const left = value.slice(0, start);
      const right = value.slice(start);
      if (value[start - 1] === ",") {
        element.value = value.slice(0, start - 1) + value.slice(start);
        element.selectionStart = start - 1;
        element.selectionEnd = start - 1;
        editor.done(element);
        return;
      }
      if (left.endsWith(" ")) {
        const index = start - 1;
        const quote =
          value[index - 1] === "»" ||
          value[index - 1] === "“" ||
          value[index - 1] === '"';
        const comma = quote ? index - 2 : index - 1;
        if (value[comma] === ",") {
          element.value = value.slice(0, comma) + value.slice(comma + 1);
          element.selectionStart = Math.max(start - 1, 0);
          element.selectionEnd = Math.max(start - 1, 0);
          editor.done(element);
          return;
        }
        element.value = value.slice(0, index) + "," + value.slice(index);
        element.selectionStart = index + 1;
        element.selectionEnd = index + 1;
        editor.done(element);
        return;
      }
      const tail = right.match(/^[А-Яа-яA-Za-zЁё0-9]+[»“"]*/);
      const index = start + (tail ? tail[0].length : 0);
      if (value[index] === ",") {
        element.value = value.slice(0, index) + value.slice(index + 1);
        element.selectionStart = start;
        element.selectionEnd = start;
        editor.done(element);
        return;
      }
      element.value = value.slice(0, index) + "," + value.slice(index);
      element.selectionStart = index + 1;
      element.selectionEnd = index + 1;
      editor.done(element);
    },
    dash(element) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      if (start !== end) {
        editor.replace(element, "\u00a0— ");
        return;
      }
      const left = value.slice(0, start);
      const right = value.slice(start);
      if (left.endsWith(" ")) {
        const before = left.slice(0, -1);
        element.value = before + "\u00a0— " + right;
        element.selectionStart = before.length + 3;
        element.selectionEnd = before.length + 3;
        editor.done(element);
        return;
      }
      if (right.startsWith(" ")) {
        element.value = left + "\u00a0—" + right;
        element.selectionStart = left.length + 2;
        element.selectionEnd = left.length + 2;
        editor.done(element);
        return;
      }
      const tail = right.match(/^[А-Яа-яA-Za-zЁё0-9]+[.,:;!?…]*/);
      if (tail) {
        const index = start + tail[0].length;
        const space =
          value[index] === " " || value[index] === "\u00a0" ? "" : " ";
        element.value =
          value.slice(0, index) + "\u00a0—" + space + value.slice(index);
        element.selectionStart = index + 2 + space.length;
        element.selectionEnd = index + 2 + space.length;
        editor.done(element);
        return;
      }
      editor.replace(element, "\u00a0— ");
    },
    swap(element) {
      const start = element.selectionStart;
      const value = element.value;
      const right = value.slice(start);
      const colon = right.search(/:/);
      const dash = right.search(/[ \u00a0]—/);
      const first = [colon, dash]
        .filter((index) => index >= 0)
        .sort((a, b) => a - b)[0];
      if (first === undefined) return;
      const index = start + first;
      if (value[index] === ":") {
        element.value =
          value.slice(0, index) + "\u00a0—" + value.slice(index + 1);
        element.selectionStart = start;
        element.selectionEnd = start;
        editor.done(element);
        return;
      }
      const left =
        value[index] === " " || value[index] === "\u00a0" ? index : index - 1;
      element.value = value.slice(0, left) + ":" + value.slice(index + 2);
      element.selectionStart = start;
      element.selectionEnd = start;
      editor.done(element);
    },
    quote(element) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      if (start === end) {
        const data = editor.quoted(value, start);
        if (data) {
          const body = value.slice(data.bodyStart, data.bodyEnd);
          element.value =
            value.slice(0, data.start) + body + value.slice(data.end);
          element.selectionStart = start;
          element.selectionEnd = start;
          editor.done(element);
          return;
        }
      }
      const range = editor.item(value, start, end);
      if (range.start === range.end) return;
      const string = value.slice(range.start, range.end);
      const block = editor.block(value, range.start, range.end);
      const left = value.slice(block.start, range.start);
      const nested =
        (left.match(/«/g) || []).length > (left.match(/»/g) || []).length;
      const before = nested ? "„" : "«";
      const after = nested ? "“" : "»";
      element.value =
        value.slice(0, range.start) +
        before +
        string +
        after +
        value.slice(range.end);
      element.selectionStart = start;
      element.selectionEnd = start;
      editor.done(element);
    },
    quoted(value, start) {
      const left = value.slice(0, start);
      const outer = {
        open: left.lastIndexOf("«"),
        close: left.lastIndexOf("»"),
        before: "«",
        after: "»",
      };
      const inner = {
        open: left.lastIndexOf("„"),
        close: left.lastIndexOf("“"),
        before: "„",
        after: "“",
      };
      const data =
        outer.open > outer.close
          ? outer
          : inner.open > inner.close
            ? inner
            : null;
      if (!data) return null;
      const right = value.slice(start);
      const close = right.indexOf(data.after);
      if (close < 0) return null;
      return {
        start: data.open,
        end: start + close + data.after.length,
        bodyStart: data.open + data.before.length,
        bodyEnd: start + close,
      };
    },
    accent(element) {
      const start = element.selectionStart;
      const value = element.value;
      const left = value.slice(0, start);
      const right = value.slice(start);
      const before = left.match(/[А-Яа-яA-Za-zЁё]$/);
      const after = right.match(/^[А-Яа-яA-Za-zЁё]/);
      const index = before ? start : after ? start + 1 : -1;
      if (index < 0) return;
      if (value[index] === "\u0301") {
        element.value = value.slice(0, index) + value.slice(index + 1);
        element.selectionStart = start;
        element.selectionEnd = start;
        editor.done(element);
        return;
      }
      element.value = value.slice(0, index) + "\u0301" + value.slice(index);
      element.selectionStart = start;
      element.selectionEnd = start;
      editor.done(element);
    },
    number(element) {
      const start = element.selectionStart;
      const value = element.value;
      const small = [
        "ноль",
        "один",
        "два",
        "три",
        "четыре",
        "пять",
        "шесть",
        "семь",
        "восемь",
        "девять",
        "десять",
        "одиннадцать",
        "двенадцать",
        "тринадцать",
        "четырнадцать",
        "пятнадцать",
        "шестнадцать",
        "семнадцать",
        "восемнадцать",
        "девятнадцать",
      ];
      const tens = {
        20: "двадцать",
        30: "тридцать",
        40: "сорок",
        50: "пятьдесят",
        60: "шестьдесят",
        70: "семьдесят",
        80: "восемьдесят",
        90: "девяносто",
      };
      const build = (number) => {
        if (!Number.isInteger(number)) return null;
        if (number < 0 || number >= 100) return null;
        if (number < 20) return small[number];
        const main = Math.floor(number / 10) * 10;
        const rest = number % 10;
        return rest ? `${tens[main]} ${small[rest]}` : tens[main];
      };
      const join = (left, right) => {
        if (!left.includes(" ") && !right.includes(" "))
          return `${left}-${right}`;
        return `${left}\u00a0— ${right}`;
      };
      const pair = (() => {
        const before = value.slice(0, start).match(/\d+$/);
        const after = value.slice(start).match(/^\d+/);
        const left = before ? start - before[0].length : start;
        const right = start + (after ? after[0].length : 0);
        const around = value.slice(0, left).match(/\d+\s*[-–—]\s*$/);
        const ahead = value.slice(right).match(/^\s*[-–—]\s*\d+/);
        if (around) {
          return {
            start: left - around[0].length,
            end: right,
          };
        }
        if (ahead) {
          return {
            start: left,
            end: right + ahead[0].length,
          };
        }
        return null;
      })();
      if (pair) {
        const string = value.slice(pair.start, pair.end);
        const match = string.match(/^\s*(\d+)\s*[-–—]\s*(\d+)\s*$/);
        if (!match) return;
        const left = build(Number(match[1]));
        const right = build(Number(match[2]));
        if (!left || !right) return;
        const next = join(left, right);
        element.value =
          value.slice(0, pair.start) + next + value.slice(pair.end);
        element.selectionStart = start;
        element.selectionEnd = start;
        editor.done(element);
        return;
      }
      const range = (() => {
        const before = value.slice(0, start).match(/\d+$/);
        const after = value.slice(start).match(/^\d+/);
        const space =
          value[start - 1] === " "
            ? value.slice(0, start - 1).match(/\d+$/)
            : null;
        if (before || after) {
          return {
            start: before ? start - before[0].length : start,
            end: start + (after ? after[0].length : 0),
          };
        }
        if (!space) return null;
        return {
          start: start - 1 - space[0].length,
          end: start - 1,
        };
      })();
      if (!range) return;
      const next = build(Number(value.slice(range.start, range.end)));
      if (!next) return;
      element.value =
        value.slice(0, range.start) + next + value.slice(range.end);
      element.selectionStart = start;
      element.selectionEnd = start;
      editor.done(element);
    },
    symbol(element) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      const data = ["°", "′", "″", "$", "€", "Ўў", "Іі", "…"];
      if (start !== end) {
        editor.replace(element, data[0]);
        return;
      }
      const left = value[start - 1];
      const right = value[start];
      const index = data.findIndex((item) => item === left || item === right);
      if (index < 0) {
        editor.replace(element, data[0]);
        return;
      }
      const next = data[(index + 1) % data.length];
      const shift = data[index] === left ? -1 : 0;
      const place = start + shift;
      element.value = value.slice(0, place) + next + value.slice(place + 1);
      element.selectionStart = start;
      element.selectionEnd = start;
      editor.done(element);
    },
    math(element) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      const data = ["−", "×", "·", "÷", "≈", "≠", "±", "≤", "≥", "²", "³"];
      if (start !== end) {
        editor.replace(element, data[0]);
        return;
      }
      const left = value[start - 1];
      const right = value[start];
      const index = data.findIndex((item) => item === left || item === right);
      if (index < 0) {
        editor.replace(element, data[0]);
        return;
      }
      const next = data[(index + 1) % data.length];
      const shift = data[index] === left ? -1 : 0;
      const place = start + shift;
      element.value = value.slice(0, place) + next + value.slice(place + 1);
      element.selectionStart = start;
      element.selectionEnd = start;
      editor.done(element);
    },
    move(element, step) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      if (start === end) return;
      const value = element.value;
      const block = editor.scope(value, start, end);
      const range = { start, end };
      const next =
        step < 0
          ? editor.backward(value, block, range)
          : editor.forward(value, block, range);
      if (!next) return;
      element.value =
        value.slice(0, block.start) + next.value + value.slice(block.end);
      element.selectionStart = block.start + next.start;
      element.selectionEnd = block.start + next.end;
      editor.done(element);
    },
    backward(value, block, range) {
      const text = value.slice(block.start, block.end);
      const start = range.start - block.start;
      const end = range.end - block.start;
      const before = text.slice(0, start).replace(/[ \u00a0]+$/, "");
      const select = text.slice(start, end).trim();
      const after = text.slice(end).replace(/^[ \u00a0]+/, "");
      const match = before.match(/[А-Яа-яA-Za-zЁё0-9]+[.,:;!?…»“"]*$/);
      if (!match) return null;
      const word = match[0];
      const left = before
        .slice(0, before.length - word.length)
        .replace(/[ \u00a0]+$/, "");
      const first = editor.start(text, left.length);
      const next = editor.letter(select, first);
      const prev = editor.letter(word, false);
      const head = `${left}${editor.gap(left)}`;
      const body = `${next} ${prev}`;
      const tail = `${after ? " " : ""}${after}`;
      return {
        value: head + body + tail,
        start: head.length,
        end: head.length + next.length,
      };
    },
    forward(value, block, range) {
      const text = value.slice(block.start, block.end);
      const start = range.start - block.start;
      const end = range.end - block.start;
      const before = text.slice(0, start).replace(/[ \u00a0]+$/, "");
      const select = text.slice(start, end).trim();
      const after = text.slice(end).replace(/^[ \u00a0]+/, "");
      const match = after.match(/^[«„"']*[А-Яа-яA-Za-zЁё0-9]+[.,:;!?…»“"]*/);
      if (!match) return null;
      const word = match[0];
      const point = after.slice(word.length).match(/^[.,:;!?…»“"]+/)?.[0] || "";
      const right = after
        .slice(word.length + point.length)
        .replace(/^[ \u00a0]+/, "");
      const first = editor.start(text, before.length);
      const prev = editor.letter(word, first);
      const next = editor.letter(select, false);
      const head = `${before}${editor.gap(before)}${prev}`;
      const tail = right ? ` ${right}` : point;
      return {
        value: `${head} ${next}${tail}`,
        start: head.length + 1,
        end: head.length + 1 + next.length,
      };
    },
    home(element) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      const block = editor.block(value, start, end);
      const range = editor.item(value, start, end);
      if (range.start === range.end) return;
      const text = value.slice(block.start, block.end);
      const local = {
        start: range.start - block.start,
        end: range.end - block.start,
      };
      const point = editor.sentence(text, local.start);
      const left = text.slice(0, point);
      const before = text.slice(point, local.start).replace(/[ \u00a0]+$/, "");
      if (!editor.clean(before)) return;
      const select = editor.letter(
        text.slice(local.start, local.end).trim(),
        true,
      );
      const middle = editor.start(text, point)
        ? editor.letter(before, false)
        : before;
      const after = text.slice(local.end).replace(/^[ \u00a0]+/, "");
      const tail = after
        ? /^[.,:;!?…»“"]/.test(after)
          ? after
          : ` ${after}`
        : "";
      const next = `${left}${select} ${middle}${tail}`;
      element.value =
        value.slice(0, block.start) + next + value.slice(block.end);
      element.selectionStart = block.start + left.length;
      element.selectionEnd = block.start + left.length + select.length;
      editor.done(element);
    },
    note(element) {
      const start = element.selectionStart;
      const value = element.value;
      const block = editor.block(value, start, start);
      const text = value.slice(block.start, block.end);
      if (/<\/em>\([^()]+?\. — Прим\. [^()]+\)<em>/i.test(text)) return;
      const match = text.match(/\(([^()]+?)(?:\s+—|,)\s+прим\.\s+([^()]+)\)/i);
      if (!match) return;
      const body = match[1].replace(/\s*[.:,]?\s*$/, "");
      const name = match[2].trim();
      const next = `</em>(${body}. — Прим. ${name})<em>`;
      const result = text.replace(match[0], next);
      element.value =
        value.slice(0, block.start) + result + value.slice(block.end);
      element.selectionStart = start;
      element.selectionEnd = start;
      editor.done(element);
    },
    abbrData(value, start) {
      const left = value.slice(0, start).match(/[А-Яа-яA-Za-zЁё.]+$/);
      const right = value.slice(start).match(/^[А-Яа-яA-Za-zЁё.]+/);
      const range = {
        start: left ? start - left[0].length : start,
        end: start + (right ? right[0].length : 0),
      };
      if (range.start === range.end) return null;
      const string = value.slice(range.start, range.end).toLowerCase();
      const data = [
        [["тысяча", "тысячи", "тысяч"], "тыс."],
        [["миллион", "миллиона", "миллионов"], "млн"],
        [["миллиард", "миллиарда", "миллиардов"], "млрд"],
        [["триллион", "триллиона", "триллионов"], "трлн"],
        [["ч."], "часть"],
        [["ст."], "статью"],
      ];
      const item = data.find(([list]) => list.includes(string));
      if (!item) return null;
      return {
        range,
        next: item[1],
      };
    },
    abbr(element) {
      const start = element.selectionStart;
      const value = element.value;
      const data = editor.abbrData(value, start);
      if (!data) return;
      const dot =
        data.next.endsWith(".") && value[data.range.end] === "." ? 1 : 0;
      element.value =
        value.slice(0, data.range.start) +
        data.next +
        value.slice(data.range.end + dot);
      element.selectionStart = start;
      element.selectionEnd = start;
      editor.done(element);
    },
    listTag(value, start) {
      const left = value.slice(0, start);
      const item = [...left.matchAll(/<li(?:\s[^>]*)?>/gi)].pop();
      if (!item) return null;
      if (left.lastIndexOf("</li>") > item.index) return null;
      const list = [...left.matchAll(/<(ul|ol)(?:\s[^>]*)?>/gi)].pop();
      if (!list) return null;
      const tag = list[1].toLowerCase();
      const close = value.slice(start).search(new RegExp(`</${tag}>`, "i"));
      if (close < 0) return null;
      return {
        start: list.index,
        end: start + close + `</${tag}>`.length,
      };
    },
    list(element) {
      const start = element.selectionStart;
      const value = element.value;
      const html = (() => {
        const left = value.slice(0, start);
        const item = [...left.matchAll(/<li(?:\s[^>]*)?>/gi)].pop();
        if (!item) return null;
        if (left.lastIndexOf("</li>") > item.index) return null;
        const list = [...left.matchAll(/<(ul|ol)(?:\s[^>]*)?>/gi)].pop();
        if (!list) return null;
        const tag = list[1].toLowerCase();
        const close = value.slice(start).search(new RegExp(`</${tag}>`, "i"));
        if (close < 0) return null;
        return {
          start: list.index,
          end: start + close + `</${tag}>`.length,
        };
      })();
      if (html) {
        const string = value.slice(html.start, html.end);
        const semicolon =
          /<\/li>\s*<li/i.test(string) && /;\s*<\/li>/i.test(string);
        const mode = semicolon ? "." : ";";
        const next = string.replace(
          /<li(?:\s[^>]*)?>([\s\S]*?)<\/li>/gi,
          (_, item) => {
            const text = item.trim().replace(/[.;]\s*$/, "");
            const letter = editor.letter(text, mode === ".");
            return `<li>${letter}${mode}</li>`;
          },
        );
        const result =
          mode === ";"
            ? next.replace(/;(<\/li>\s*<\/(?:ul|ol)>)/i, ".$1")
            : next;
        element.value =
          value.slice(0, html.start) + result + value.slice(html.end);
        element.selectionStart = start;
        element.selectionEnd = start;
        editor.done(element);
        return;
      }
      const lines = value.split("\n");
      let index = 0;
      let current = -1;
      lines.some((line, i) => {
        const next = index + line.length + 1;
        const active = start >= index && start <= next;
        if (active) current = i;
        index = next;
        return active;
      });
      if (current < 0) return;
      const test = (line) => /^\s*([-•●▪◦]|\d+\.)\s+/.test(line);
      if (!test(lines[current])) return;
      let from = current;
      let to = current;
      while (from > 0) {
        let index = from - 1;
        while (index >= 0 && !lines[index].trim()) index -= 1;
        if (index < 0 || !test(lines[index])) break;
        from = index;
      }
      while (to < lines.length - 1) {
        let index = to + 1;
        while (index < lines.length && !lines[index].trim()) index += 1;
        if (index >= lines.length || !test(lines[index])) break;
        to = index;
      }
      const ordered = /^\s*\d+\./.test(lines[current]);
      const tag = ordered ? "ol" : "ul";
      const rows = lines
        .slice(from, to + 1)
        .filter((line) => line.trim())
        .map((line) => line.replace(/^\s*([-•●▪◦]|\d+\.)\s+/, "").trim())
        .filter(Boolean);
      if (!rows.length) return;
      const items = rows.map((item) => `<li>${item}</li>`).join("\n");
      const result = `<${tag}>\n${items}\n</${tag}>`;
      const before = lines.slice(0, from).join("\n");
      const after = lines.slice(to + 1).join("\n");
      element.value = [before, result, after].filter(Boolean).join("\n");
      element.selectionStart = start;
      element.selectionEnd = start;
      editor.done(element);
    },
    search(element, source) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      const range = start === end ? editor.word(value, start) : { start, end };
      if (range.start === range.end) return;
      const string = value.slice(range.start, range.end).trim();
      if (!string) return;
      const query = encodeURIComponent(string);
      const data = {
        google: `https://www.google.com/search?q=${query}`,
        gramota: `https://gramota.ru/poisk?query=${query}&mode=spravka`,
        kinopoisk: `https://www.kinopoisk.ru/new-search/?text=${query}`,
      };
      window.open(data[source], "_blank", "noopener,noreferrer");
      element.selectionStart = start;
      element.selectionEnd = end;
      element.focus();
    },
    state(element) {
      const start = element.selectionStart;
      const value = element.value;
      const block = editor.block(value, start, start);
      const text = value.slice(block.start, block.end);
      const note =
        !/<\/em>\([^()]+?\. — Прим\. [^()]+\)<em>/i.test(text) &&
        /\(([^()]+?)(?:\s+—|,)\s+прим\.\s+([^()]+)\)/i.test(text);
      return {
        nbsp: value[start - 1] === "\u00a0" || value[start] === "\u00a0",
        em: editor.insideTag(value, start, "em"),
        strong: editor.insideTag(value, start, "strong"),
        comma: value[start - 1] === "," || value[start] === ",",
        dash: value[start - 1] === "\u2014" || value[start] === "\u2014",
        quote: Boolean(editor.quoted(value, start)),
        list: Boolean(editor.listTag(value, start)),
        abbr: Boolean(editor.abbrData(value, start)),
        note: note,
      };
    },
    mark(panel, state) {
      panel.dataset.active = Object.entries(state)
        .filter(([, active]) => active)
        .map(([name]) => name)
        .join(" ");
    },
    visible(panel) {
      const rect = panel.getBoundingClientRect();
      const gap = 24;
      return (
        rect.right > gap &&
        rect.left < window.innerWidth - gap &&
        rect.bottom > gap &&
        rect.top < window.innerHeight - gap
      );
    },
    rescue(panel) {
      if (editor.visible(panel)) return;
      panel.dataset.manual = "false";
      editor.placeBottom(panel);
    },
  };
  editor.drag(panel);
  editor.place(panel);
  editor.rescue(panel);
  const sync = () => {
    panel.dataset.theme = editor.theme();
  };
  panel.addEventListener(
    "wheel",
    (event) => {
      if (editor.layout() !== "fullscreen") return;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      panel.scrollLeft += event.deltaY;
    },
    { passive: false },
  );
  setInterval(sync, 300);
  window.addEventListener("resize", () => {
    editor.place(panel);
    editor.rescue(panel);
  });
  window.addEventListener("scroll", () => editor.place(panel), true);
  const action = {
    nbsp: editor.nbsp,
    em: (element) => editor.taggle(element, "em"),
    strong: (element) => editor.taggle(element, "strong"),
    killem: editor.clear,
    comma: editor.comma,
    dash: editor.dash,
    swap: editor.swap,
    quote: editor.quote,
    accent: editor.accent,
    list: editor.list,
    left: (element) => editor.move(element, -1),
    right: (element) => editor.move(element, 1),
    home: editor.home,
    number: editor.number,
    symbol: editor.symbol,
    math: editor.math,
    note: editor.note,
    abbr: editor.abbr,
    gramota: (element) => editor.search(element, "gramota"),
    google: (element) => editor.search(element, "google"),
    kinopoisk: (element) => editor.search(element, "kinopoisk"),
  };
  panel.addEventListener("mousedown", (event) => event.preventDefault());
  panel.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const name = button.dataset.action;
    if (name === "close") {
      panel.remove();
      document.getElementById(`${id}-style`)?.remove();
      return;
    }
    const element = editor.get();
    if (!element) return;
    action[name](element);
  });
  document.addEventListener("selectionchange", () => {
    const element = editor.get();
    if (!element) return;
    editor.mark(panel, editor.state(element));
  });
})();
