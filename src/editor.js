import { frame } from "./core/panel.js";
import { toolbar } from "./core/toolbar.js";
import { ui } from "./core/ui.js";
import { icon } from "./core/icon.js";
import { css } from "./core/css.js";
import { search } from "./core/actions/search.js";
import { edit } from "./core/edit.js";
import { markup } from "./core/markup.js";

(() => {
  const id = "editor-panel";
  if (typeof window.__authorPanelClose === "function") {
    window.__authorPanelClose();
  } else {
    const panel = document.getElementById("author-panel");
    if (panel) {
      toolbar.destroy(panel);
      panel.remove();
    }
  }
  const style = css.editor.text();
  const assets = {
    glyph: {
      drag: icon.fluent("Drag"),
      scroll: icon.fluent("Dual Screen Update"),
      nbsp: icon.fluent("Spacebar"),
      em: icon.fluent("Text Italic"),
      strong: icon.fluent("Text Bold"),
      killem: icon.fluent("Eraser"),
      quote: icon.fluent("Text Quote"),
      comma: icon.fluent("Comma"),
      dash: icon.fluent("Line Horizontal 1"),
      colon: icon.fluent("More Vertical"),
      punct: icon.fluent("Arrow Sync"),
      home: icon.fluent("Arrow Bounce"),
      left: icon.fluent("Chevron Left"),
      right: icon.fluent("Chevron Right"),
      letter: icon.fluent("Text Font Size"),
      number: icon.fluent("Number Symbol"),
      symbol: icon.fluent("Symbols"),
      math: icon.fluent("Math Symbols"),
      accent: icon.fluent("Gavel"),
      abbr: icon.fluent("Arrow Autofit Width Dotted"),
      year: icon.fluent("Calendar"),
      note: icon.fluent("Note"),
      list: icon.fluent("Apps List"),
      branch: icon.fluent("Branch Fork"),
      exit: icon.fluent("Arrow Exit"),
    },
    logo: (name) => icon.logo(name),
    emoji: (value) => icon.emoji(value),
    mode: "glyph",
  };
  const { glyph } = assets;
  const state = {
    iconMode: toolbar.state("editor-panel-icon-mode") || assets.mode || "glyph",
    mode:
      {
        text: "markup",
        motion: "transform",
        symbols: "punct",
        search: "search",
      }[toolbar.state("editor-panel-mode")] ||
      toolbar.state("editor-panel-mode") ||
      "punct",
    collapsed: toolbar.state("editor-panel-collapsed") !== "false",
    solo: false,
    soloCycle: null,
  };
  const themeState = (next) => {
    const key = "editor-panel-theme";
    if (next !== undefined) return toolbar.state(key, next);
    return toolbar.state(key) || toolbar.appearance.theme("content");
  };
  const themeIcon = () => toolbar.appearance.themeToggleIcon(themeState());
  const editorButtons = [
    { action: "nbsp", label: "🔦", icon: "nbsp", group: "primary" },
    { action: "punct", label: "⌨️ ,.:—", icon: "punct", group: "primary" },
    { action: "quote", label: "⌨️ «„“»", icon: "quote", group: "primary" },
    { action: "left", label: "⬅️", icon: "left", group: "primary" },
    { action: "right", label: "➡️", icon: "right", group: "primary" },
    { action: "em", label: "🩹 em", icon: "em", group: "markup" },
    { action: "strong", label: "🩹 strong", icon: "strong", group: "markup" },
    { action: "killem", label: "💀 em", icon: "killem", group: "markup" },
    { action: "note", label: "💭", icon: "note", group: "markup" },
    { action: "list", label: "📃", icon: "list", group: "markup" },
    { action: "nbsp", label: "🔦", icon: "nbsp", group: "punct" },
    { action: "comma", label: "⌨️ ,", icon: "comma", group: "punct" },
    { action: "colon", label: "⌨️ :", icon: "colon", group: "punct" },
    { action: "dash", label: "⌨️ —", icon: "dash", group: "punct" },
    { action: "qswap", label: "—«»", icon: "quote", group: "punct" },
    { action: "accent", label: "💪", icon: "accent", group: "punct" },
    { action: "symbol", label: "🔣", icon: "symbol", group: "punct" },
    { action: "math", label: "*️⃣", icon: "math", group: "punct" },
    { action: "home", label: "🔙", icon: "home", group: "transform" },
    { action: "left", label: "⬅️", icon: "left", group: "transform" },
    { action: "right", label: "➡️", icon: "right", group: "transform" },
    { action: "letter", label: "🔠", icon: "letter", group: "transform" },
    { action: "number", label: "🔢", icon: "number", group: "transform" },
    { action: "abbr", label: "🤏", icon: "abbr", group: "transform" },
    { action: "year", label: "📅", icon: "year", group: "transform" },
    { action: "branch", label: "🌿", icon: "branch", group: "transform" },
    { action: "scroll", label: "↕️", icon: "scroll", group: "transform" },
    { action: "gramota", label: "Грамота", logo: "gramota", group: "search" },
    { action: "google", label: "Google", logo: "google", group: "search" },
    {
      action: "kinopoisk",
      label: "Кинопоиск",
      logo: "kinopoisk",
      group: "search",
    },
  ];
  const editorModes = [
    {
      mode: "punct",
      action: "mode-punct",
      label: "punct",
      emoji: "⌨️",
    },
    {
      mode: "transform",
      action: "mode-transform",
      label: "transform",
      emoji: "🩹",
    },
    {
      mode: "markup",
      action: "mode-markup",
      label: "markup",
      emoji: "📐",
    },
    {
      mode: "search",
      action: "mode-search",
      label: "search",
      emoji: "🌐",
    },
  ];
  const modeList = editorModes.map((item) => item.mode);
  const editorVisibleButtons = () =>
    editorButtons.filter((item) => {
      if (item.group === "primary") return true;
      return item.group === state.mode;
    });
  const editorModeButtons = () =>
    editorModes.map((item) => ({
      ...item,
      active: item.mode === state.mode,
    }));
  const systemButtons = () => {
    const icon = themeIcon();
    return [
      {
        action: "theme",
        label: icon,
        emoji: icon,
        attrs: ' data-theme-icon="auto" data-theme-scope="editor"',
      },
      { action: "close", label: "❌", emoji: "❌", system: true },
    ];
  };
  const buttonOptions = () => ({
    glyph,
    logo: assets.logo,
    emoji: assets.emoji,
    iconMode: state.iconMode,
  });
  const html = (source = null) => {
    const options = buttonOptions();
    const visibleButtons = source?.buttons?.() || editorVisibleButtons();
    const solo = source?.soloMode?.() ?? state.solo;
    const collapsed = source?.collapsed?.() ?? state.collapsed;
    const modeList = solo
      ? (source?.modeButtons?.() || editorModeButtons()).filter(
          (item) => item.mode === state.mode,
        )
      : source?.modeButtons?.() || editorModeButtons();
    return toolbar.render.shell({
      options,
      primary: visibleButtons.filter((item) => item.group === "primary"),
      modes: modeList.map((item) => ({
        ...item,
        attrs: ` data-mode="${item.mode}" data-toolbar-mode="true"`,
      })),
      current: visibleButtons.filter(
        (item) => item.group === state.mode && item.group !== "primary",
      ),
      system: systemButtons(),
      collapsed,
      solo,
      launcher: {
        action: "place",
        emoji: "\u{1F41D}",
        scope: "launcher",
      },
    });
  };
  const exists = document.getElementById(id);
  if (exists) {
    toolbar.destroy(exists);
    exists.remove();
    document.getElementById(`${id}-style`)?.remove();
  }
  document.getElementById(`${id}-style`)?.remove();
  const fullscreen = () => document.body.classList.contains("reader-active");
  const appleTouch = () =>
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const bar = frame.create({ id, html: html(), place: "right" });
  frame.mount(`${id}-style`, style);
  const editor = {
    punctMemory: new WeakMap(),
    punctLocalMemory: new WeakMap(),
    selectionMemory: new WeakMap(),
    undoMemory: new WeakMap(),
    redoMemory: new WeakMap(),
    accentMemory: new WeakMap(),
    abbrMemory: new WeakMap(),
    wordCycleMemory: new WeakMap(),
    controller: null,
    fullscreen() {
      return fullscreen();
    },
    layout() {
      return toolbar.appearance.layout({ fullscreen: editor.fullscreen() });
    },
    keyboardOpen(touch) {
      const threshold = toolbar.phone() ? 120 : toolbar.tablet() ? 160 : 140;
      return touch ? toolbar.keyboardOpen(threshold) : false;
    },
    theme: themeState,
    mode(value) {
      if (value === undefined) return state.mode;
      const next = String(value || "");
      if (!modeList.includes(next)) return state.mode;
      state.mode = next;
      toolbar.state("editor-panel-mode", next);
      return state.mode;
    },
    collapsed(value) {
      if (value === undefined) return state.collapsed;
      state.collapsed = Boolean(value);
      toolbar.state(
        "editor-panel-collapsed",
        state.collapsed ? "true" : "false",
      );
      return state.collapsed;
    },
    solo(value) {
      if (value === undefined) return state.solo;
      state.solo = Boolean(value);
      if (!state.solo) state.soloCycle = null;
      return state.solo;
    },
    modeView(value) {
      const next = String(value || "");
      if (!modeList.includes(next)) return;
      if (editor.solo() && state.mode === next) {
        editor.solo(false);
        editor.collapsed(true);
        return;
      }
      editor.mode(next);
      editor.collapsed(false);
      state.soloCycle = null;
      editor.solo(true);
    },
    revealModeStart(panel) {
      const first = panel.querySelector('[data-mode-first="true"]');
      const line = panel.querySelector("[data-line]");
      if (!first || !line) return;
      first.scrollIntoView({
        block: "nearest",
        inline: "start",
      });
    },
    hotkeyButton(index = 0) {
      if (!bar?.isConnected) return false;
      const line = bar.querySelector("[data-line]");
      if (!line) return false;
      const list = [
        ...line.querySelectorAll(".ui-line .ui-button[data-action]"),
      ];
      const target = list[index] || null;
      if (!target) return false;
      target.click();
      return true;
    },
    hotkeyAction(name = "") {
      const key = String(name || "");
      if (!key) return false;
      const system = systemAction[key];
      if (typeof system === "function") {
        system();
        return true;
      }
      const run = editorAction[key];
      if (typeof run !== "function") return false;
      const element = editor.get();
      const current = editor.current();
      if (!element && !current) return false;
      const target = element || current;
      editor.restoreSelection(target);
      editor.rememberSelection(target);
      const cycle = editor.cycle.signature(key, target);
      editor.keep(target, () => run(target));
      if (toolbar.mobile()) {
        const focused = editor.current();
        if (focused) toolbar.active.sync(bar, editor.state(focused));
        if (!focused) toolbar.active.clear(bar);
      }
      editor.soloAfterAction(key, target, cycle);
      return true;
    },
    soloAfterAction(name, element, cycle) {
      if (!editor.solo()) return;
      const action = String(name || "");
      const before = cycle || null;
      const entry = editor.cycle.signature(action, element);
      const size = Number(entry?.size || before?.size || 0);
      if (!entry || size <= 2) {
        editor.solo(false);
        editor.collapsed(true);
        editor.paint();
        editor.controller?.behavior.place();
        return;
      }
      const stored = state.soloCycle;
      if (!stored || stored.action !== action) {
        state.soloCycle = { action, value: entry.value };
        return;
      }
      if (stored.value !== entry.value) return;
      state.soloCycle = null;
      editor.solo(false);
      editor.collapsed(true);
      editor.paint();
      editor.controller?.behavior.place();
    },
    cycle: {
      signature(name, element) {
        const action = String(name || "");
        const field = element || editor.current() || editor.get();
        if (!field) return null;
        return (
          editor.cycle.punct(action, field) ||
          editor.cycle.branch(action, field) ||
          editor.cycle.symbol(action, field) ||
          editor.cycle.math(action, field) ||
          editor.cycle.letter(action, field) ||
          editor.cycle.accent(action, field) ||
          editor.cycle.year(action, field)
        );
      },
      punct(name, element) {
        if (name !== "punct") return null;
        const start = element.selectionStart;
        const found = editor.punctForward(element.value, start);
        if (!found) return null;
        const block = editor.block(element.value, start, start);
        const tail = element.value.slice(
          found.at + found.raw.length,
          block.end,
        );
        const data = editor.punctData();
        const cycle = !tail.replace(/(?:\s|<\/?[^>]+>|&nbsp;|&#160;)+/gi, "")
          ? [data.list[data.index.dot], data.list[data.index.colon]]
          : data.list;
        return { action: name, value: found.key, size: cycle.length };
      },
      branch(name, element) {
        if (name !== "branch") return null;
        const start = element.selectionStart;
        const end = element.selectionEnd;
        const data = editor.wordCycleData(element.value, start, end);
        if (!data) return null;
        return {
          action: name,
          value: data.chain[data.index] || data.source,
          size: data.chain.length,
        };
      },
      symbol(name, element) {
        if (name !== "symbol") return null;
        return editor.cycle.pick(name, element, [
          "°",
          "′",
          "″",
          "$",
          "€",
          "Ў",
          "ў",
          "І",
          "і",
          "í",
          "…",
        ]);
      },
      math(name, element) {
        if (name !== "math") return null;
        return editor.cycle.pick(name, element, [
          "−",
          "×",
          "·",
          "÷",
          "≈",
          "≠",
          "±",
          "≤",
          "≥",
          "²",
          "³",
        ]);
      },
      pick(name, element, list) {
        const start = element.selectionStart;
        const value = element.value;
        const left = value[start - 1];
        const right = value[start];
        const current = list.find((item) => item === left || item === right);
        if (!current) return null;
        return { action: name, value: current, size: list.length };
      },
      letter(name, element) {
        if (name !== "letter") return null;
        const start = element.selectionStart;
        const end = element.selectionEnd;
        const value = element.value;
        const range =
          start === end
            ? editor.word(value, start)
            : editor.trim(value, start, end);
        if (range.start === range.end) return null;
        const source = value.slice(range.start, range.end);
        return {
          action: name,
          value: source === source.toLowerCase() ? "lower" : "upper",
          size: 2,
        };
      },
      accent(name, element) {
        if (name !== "accent") return null;
        const start = element.selectionStart;
        const value = element.value;
        const acute = "\u0301";
        const base = (() => {
          if (
            start > 1 &&
            value[start - 1] === acute &&
            /[А-Яа-яA-Za-zЁё]/.test(value[start - 2] || "")
          )
            return start - 2;
          if (/[А-Яа-яA-Za-zЁё]/.test(value[start - 1] || "")) return start - 1;
          if (
            value[start] === acute &&
            /[А-Яа-яA-Za-zЁё]/.test(value[start - 1] || "")
          )
            return start - 1;
          return -1;
        })();
        if (base < 0) return null;
        return {
          action: name,
          value: value[base + 1] === acute ? "on" : "off",
          size: 2,
        };
      },
      year(name, element) {
        if (name !== "year") return null;
        const start = element.selectionStart;
        const data = editor.yearToken(element.value, start);
        if (!data) return null;
        return {
          action: name,
          value: element.value.slice(data.start, data.end),
          size: 2,
        };
      },
    },
    buttons() {
      return editorVisibleButtons();
    },
    soloMode() {
      return editor.solo();
    },
    modeButtons() {
      return editorModeButtons();
    },
    themeIcon,
    paintTheme() {
      const button = bar.querySelector('[data-action="theme"]');
      if (!button) return;
      button.innerHTML = ui.controls.icon(
        assets.emoji(editor.themeIcon(), "editor"),
      );
    },
    paint() {
      bar.innerHTML = html(editor);
      editor.paintTheme();
    },
    place(panel) {
      const touch = toolbar.mobile() || appleTouch();
      const layout = touch && !editor.fullscreen() ? "bottom" : "fullscreen";
      const theme = editor.theme();
      const surface = "toolbar";
      ui.surface.sync(panel, { layout, theme, surface });
      editor.paintTheme();
      panel.dataset.iconMode = state.iconMode;
      panel.dataset.mobile = touch ? "true" : "false";
      if (!touch) panel.dataset.keyboardOpen = "false";
      panel.style.removeProperty("display");
      const fitted = toolbar.appearance.fitContent(panel, {
        content: "content",
        edge: toolbar.rail.dock.edge,
        min: 280,
      });
      if (panel.dataset.manual === "true") {
        panel.style.setProperty("width", `${fitted.width}px`, "important");
        panel.style.setProperty(
          "max-width",
          `${fitted.maxWidth}px`,
          "important",
        );
        toolbar.behavior.scrollClamp(panel);
        return;
      }
      const keyboard =
        layout === "fullscreen" && touch && editor.keyboardOpen(touch);
      panel.dataset.keyboardOpen = keyboard ? "true" : "false";
      if (keyboard) panel.dataset.manual = "false";
      toolbar.appearance.place(panel, {
        layout,
        touch,
        fit: fitted,
        keyboardOpen: keyboard,
      });
      toolbar.behavior.scrollClamp(panel);
      return;
    },
    scrollAnchor(element) {
      if (!(element instanceof HTMLTextAreaElement)) return;
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const style = getComputedStyle(element);
      const mirror = document.createElement("div");
      const before = element.value.slice(0, start);
      const marker = document.createElement("span");
      mirror.style.position = "absolute";
      mirror.style.left = "-99999px";
      mirror.style.top = "0";
      mirror.style.visibility = "hidden";
      mirror.style.whiteSpace = "pre-wrap";
      mirror.style.wordBreak = "break-word";
      mirror.style.overflowWrap = "break-word";
      mirror.style.font = style.font;
      mirror.style.lineHeight = style.lineHeight;
      mirror.style.letterSpacing = style.letterSpacing;
      mirror.style.textTransform = style.textTransform;
      mirror.style.padding = style.padding;
      mirror.style.width = `${element.clientWidth}px`;
      mirror.textContent = before;
      marker.textContent = "\u200b";
      mirror.appendChild(marker);
      document.body.appendChild(mirror);
      const caretTop = marker.offsetTop;
      mirror.remove();
      const lineHeight = parseFloat(style.lineHeight) || 26;
      const target = Math.max(0, caretTop - lineHeight * 3.5);
      element.scrollTo({ top: target, behavior: "smooth" });
      element.selectionStart = start;
      element.selectionEnd = end;
      element.focus();
    },
    get() {
      const element = document.activeElement;
      if (!element) return null;
      if (element.tagName !== "TEXTAREA" && element.tagName !== "INPUT")
        return null;
      return element;
    },
    current() {
      const active = editor.get();
      if (active) return active;
      const content = document.getElementById("content");
      if (!content) return null;
      if (content.tagName !== "TEXTAREA" && content.tagName !== "INPUT")
        return null;
      return content;
    },
    rememberSelection(element) {
      if (!element) return;
      if (typeof element.selectionStart !== "number") return;
      if (typeof element.selectionEnd !== "number") return;
      editor.selectionMemory.set(element, {
        start: element.selectionStart,
        end: element.selectionEnd,
      });
    },
    restoreSelection(element) {
      if (!element) return;
      const saved = editor.selectionMemory.get(element);
      if (!saved) return;
      if (document.activeElement === element) return;
      const start = Math.max(0, Math.min(saved.start, element.value.length));
      const end = Math.max(0, Math.min(saved.end, element.value.length));
      element.selectionStart = start;
      element.selectionEnd = end;
    },
    snapshot(element) {
      return {
        value: element.value,
        start: element.selectionStart,
        end: element.selectionEnd,
      };
    },
    undoPush(element, state, resetRedo = true) {
      const list = editor.undoMemory.get(element) || [];
      const next = [...list, state].slice(-50);
      editor.undoMemory.set(element, next);
      if (resetRedo) editor.redoMemory.delete(element);
    },
    redoPush(element, state) {
      const list = editor.redoMemory.get(element) || [];
      const next = [...list, state].slice(-50);
      editor.redoMemory.set(element, next);
    },
    undoStep(element) {
      const list = editor.undoMemory.get(element) || [];
      if (!list.length) return false;
      const current = editor.snapshot(element);
      const state = list[list.length - 1];
      editor.undoMemory.set(element, list.slice(0, -1));
      editor.redoPush(element, current);
      element.value = state.value;
      editor.caret.done(element, state.start, state.end);
      return true;
    },
    redoStep(element) {
      const list = editor.redoMemory.get(element) || [];
      if (!list.length) return false;
      const current = editor.snapshot(element);
      const state = list[list.length - 1];
      editor.redoMemory.set(element, list.slice(0, -1));
      editor.undoPush(element, current, false);
      element.value = state.value;
      editor.caret.done(element, state.start, state.end);
      return true;
    },
    emit(element) {
      ["input", "change"].forEach((type) =>
        element.dispatchEvent(new Event(type, { bubbles: true })),
      );
    },
    done(element) {
      editor.emit(element);
      if (!toolbar.mobile()) element.focus();
      toolbar.active.sync(bar, editor.state(element));
    },
    caret: {
      set(element, start, end = start) {
        const size = element.value.length;
        const from = Math.max(0, Math.min(start, size));
        const to = Math.max(0, Math.min(end, size));
        element.selectionStart = from;
        element.selectionEnd = to;
      },
      done(element, start, end = start) {
        editor.caret.set(element, start, end);
        editor.done(element);
      },
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
    kinopoiskName(value, start) {
      const base = editor.word(value, start);
      if (base.start === base.end) return base;
      const block = editor.block(value, start, start);
      const text = value.slice(block.start, block.end);
      const token = /[A-Za-zА-Яа-яЁё]+(?:-[A-Za-zА-Яа-яЁё]+)*/g;
      const list = [...text.matchAll(token)].map((item) => ({
        start: block.start + item.index,
        end: block.start + item.index + item[0].length,
        text: item[0],
      }));
      if (!list.length) return base;
      const pivot = list.findIndex(
        (item) => item.start < base.end && item.end > base.start,
      );
      if (pivot < 0) return base;
      const upper = (string) => /^[A-ZА-ЯЁ]/.test(string);
      if (!upper(list[pivot].text)) return base;
      let left = pivot;
      let right = pivot;
      while (left > 0) {
        const gap = value.slice(list[left - 1].end, list[left].start);
        if (!/^[ \u00a0]+$/.test(gap) || !upper(list[left - 1].text)) break;
        left -= 1;
      }
      while (right < list.length - 1) {
        const gap = value.slice(list[right].end, list[right + 1].start);
        if (!/^[ \u00a0]+$/.test(gap) || !upper(list[right + 1].text)) break;
        right += 1;
      }
      return {
        start: list[left].start,
        end: list[right].end,
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
    letterPlain(value, upper) {
      const quote = /[«»„“”"'`]/;
      let at = -1;
      let index = 0;
      while (index < value.length) {
        const tail = value.slice(index);
        const tag = tail.match(/^<\/?[^>]+>/);
        if (tag) {
          index += tag[0].length;
          continue;
        }
        const entity = tail.match(/^&[a-z0-9#]+;/i);
        if (entity) {
          if (
            !/^&(laquo|raquo|ldquo|rdquo|bdquo|quot|#171|#187|#8220|#8221|#8222|#34);/i.test(
              entity[0],
            )
          )
            break;
          index += entity[0].length;
          continue;
        }
        const char = value[index];
        if (/\s/.test(char) || quote.test(char)) {
          index += 1;
          continue;
        }
        at = /[А-Яа-яA-Za-zЁё]/.test(char) ? index : -1;
        break;
      }
      if (at < 0) return value;
      const letter = value[at];
      const next = upper ? letter.toUpperCase() : letter.toLowerCase();
      if (next === letter) return value;
      return value.slice(0, at) + next + value.slice(at + 1);
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
      const cursor = start + string.length;
      element.selectionStart = cursor;
      element.selectionEnd = cursor;
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
      const run =
        name === "em"
          ? markup.em
          : name === "strong"
            ? markup.strong
            : null;
      if (!run) return false;
      const changed = edit.apply(element, run);
      if (!changed) return false;
      toolbar.active.sync(bar, editor.state(element));
      return true;
    },
    wrapped(value, range, name) {
      const index = Math.max(0, Math.min(range.start, value.length - 1));
      const data = editor.tag(value, index, name);
      if (!data) return false;
      return range.start >= data.bodyStart && range.end <= data.bodyEnd;
    },
    flattenTag(element, name) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const before = `<${name}>`;
      const after = `</${name}>`;
      const compact = (value) => {
        let next = value;
        while (true) {
          const merged = next
            .replace(new RegExp(`${before}\\s*${before}`, "g"), before)
            .replace(new RegExp(`${after}\\s*${after}`, "g"), after);
          if (merged === next) return next;
          next = merged;
        }
      };
      const next = compact(element.value);
      if (next === element.value) return;
      element.value = next;
      element.selectionStart = Math.min(start, next.length);
      element.selectionEnd = Math.min(end, next.length);
      editor.done(element);
    },
    quoteParts(value) {
      const cut = value.match(/^\s*/)?.[0].length || 0;
      const text = value.slice(cut);
      if (!/^—\s+/u.test(text)) return null;
      const split = text.match(
        /^(—[\s\S]*?,)\s+—\s+([а-яё][\s\S]*?[.!?…])\s+—\s+([\s\S]+)$/u,
      );
      if (split) {
        const first = split[1];
        const third = split[3];
        const thirdStart = text.length - third.length;
        return {
          cut,
          parts: [
            { start: 0, end: first.length },
            { start: thirdStart, end: text.length },
          ],
        };
      }
      const mid = text.match(
        /^(—[\s\S]*?,)\s+—\s+([а-яё][\s\S]*?),\s+(—[\s\S]+)$/u,
      );
      if (mid) {
        const first = mid[1];
        const third = mid[3];
        return {
          cut,
          parts: [
            { start: 0, end: first.length },
            { start: text.length - third.length, end: text.length },
          ],
        };
      }
      const tail =
        text.match(/^(—[\s\S]*?[.!?…»"'])\s+—\s+[а-яё][\s\S]*$/u) ||
        text.match(/^(—[\s\S]*?,)\s+—\s+[а-яё][\s\S]*$/u);
      if (tail) {
        return {
          cut,
          parts: [{ start: 0, end: tail[1].length }],
        };
      }
      return {
        cut,
        parts: [{ start: 0, end: text.length }],
      };
    },
    emQuote(element) {
      const start = element.selectionStart;
      const value = element.value;
      const block = editor.block(value, start, start);
      const source = value.slice(block.start, block.end);
      const text = source.replace(/<\/?em>/gi, "");
      const data = editor.plain(text, 0, text.length);
      const quote = editor.quoteParts(data.clean);
      if (!quote || !quote.parts.length) return false;
      const spans = quote.parts
        .map((part) => {
          const left = quote.cut + part.start;
          const right = quote.cut + part.end - 1;
          const absStart = data.map[left];
          const absEnd = data.map[right];
          if (absStart === undefined || absEnd === undefined) return null;
          const span = {
            start: absStart,
            end: absEnd + 1,
          };
          while (
            span.start < span.end &&
            /[\s\u00a0]/.test(text[span.start] || "")
          )
            span.start += 1;
          while (
            span.end > span.start &&
            /[\s\u00a0]/.test(text[span.end - 1] || "")
          )
            span.end -= 1;
          if (span.start >= span.end) return null;
          return span;
        })
        .filter(Boolean)
        .sort((a, b) => b.start - a.start);
      if (!spans.length) return false;
      const next = spans.reduce(
        (string, span) =>
          string.slice(0, span.start) +
          `<em>${string.slice(span.start, span.end)}</em>` +
          string.slice(span.end),
        text,
      );
      element.value =
        value.slice(0, block.start) + next + value.slice(block.end);
      editor.caret.done(element, start);
      return true;
    },
    anchor(value, index) {
      const range = editor.word(value, index);
      if (range.start === range.end) return null;
      const text = value.slice(range.start, range.end);
      return {
        start: range.start,
        text,
        lower: text.toLowerCase(),
        offset: Math.max(0, index - range.start),
      };
    },
    locate(value, anchor) {
      if (!anchor) return null;
      const list = [];
      const lower = value.toLowerCase();
      let index = lower.indexOf(anchor.lower);
      while (index >= 0) {
        list.push(index);
        index = lower.indexOf(anchor.lower, index + 1);
      }
      if (!list.length) return null;
      const near = list.reduce((best, item) =>
        Math.abs(item - anchor.start) < Math.abs(best - anchor.start)
          ? item
          : best,
      );
      return near + Math.min(anchor.offset, anchor.text.length);
    },
    keep(element, run) {
      run();
      if (!toolbar.mobile()) element.focus();
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
        editor.caret.done(element, start);
        return;
      }
      if (value[start] === "\u00a0") {
        element.value = value.slice(0, start) + " " + value.slice(start + 1);
        editor.caret.done(element, start + 1);
        return;
      }
      const left = value.slice(0, start);
      const right = value.slice(start);
      if (left.endsWith(" ")) {
        const before = left.slice(0, -1) + "\u00a0";
        element.value = before + right;
        editor.caret.done(element, before.length);
        return;
      }
      if (right.startsWith(" ")) {
        const after = "\u00a0" + right.slice(1);
        element.value = left + after;
        editor.caret.done(element, left.length + 1);
        return;
      }
      element.value = left + "\u00a0" + right;
      editor.caret.done(element, start + 1);
    },
    comma(element) {
      const start = element.selectionStart;
      const value = element.value;
      const lowerAfter = (string, index) => {
        const left = string.slice(0, index);
        const right = string
          .slice(index)
          .replace(
            /^((?:\s|<[^>]+>|[«„“"'()])+)?([А-ЯA-ZЁ])/,
            (_, before = "", letter) => `${before}${letter.toLowerCase()}`,
          );
        return `${left}${right}`;
      };
      const near = (() => {
        if (value[start - 1] === ",") {
          return {
            value: value.slice(0, start - 1) + value.slice(start),
            cursor: Math.max(0, start - 1),
          };
        }
        if (value[start] === ",") {
          return {
            value: value.slice(0, start) + value.slice(start + 1),
            cursor: start,
          };
        }
        if (
          start >= 2 &&
          value[start - 2] === "," &&
          (value[start - 1] === " " || value[start - 1] === "\u00a0")
        ) {
          return {
            value: value.slice(0, start - 2) + value.slice(start - 1),
            cursor: start - 1,
          };
        }
        if (
          /[А-Яа-яA-Za-zЁё0-9»“"]/.test(value[start - 1] || "") &&
          (value[start] === " " || value[start] === "\u00a0")
        ) {
          return {
            value: value.slice(0, start) + "," + value.slice(start),
            cursor: start + 1,
          };
        }
        return null;
      })();
      if (near) {
        element.value = near.value;
        element.selectionStart = near.cursor;
        element.selectionEnd = near.cursor;
        editor.done(element);
        return;
      }
      const tailText = value.slice(start);
      const period = tailText.search(/\./);
      const dash = tailText.search(/[ \u00a0]\u2014/);
      const periodAt = period < 0 ? Number.POSITIVE_INFINITY : start + period;
      const dashAt = dash < 0 ? Number.POSITIVE_INFINITY : start + dash;
      if (!Number.isFinite(periodAt) && !Number.isFinite(dashAt)) return;
      if (periodAt < dashAt) {
        const next = value.slice(0, periodAt) + "," + value.slice(periodAt + 1);
        element.value = lowerAfter(next, periodAt + 1);
        editor.caret.done(element, start);
        return;
      }
      const mark =
        value.slice(dashAt).match(/^[ \u00a0]\u2014\s*/)?.[0] || " — ";
      element.value =
        value.slice(0, dashAt) + "," + value.slice(dashAt + mark.length);
      editor.caret.done(element, start);
      return;
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
        editor.caret.done(element, start);
        return;
      }
      const left =
        value[index] === " " || value[index] === "\u00a0" ? index : index - 1;
      element.value = value.slice(0, left) + ":" + value.slice(index + 2);
      editor.caret.done(element, start);
    },
    punctData() {
      const list = [
        { key: "dot", mark: ".", next: ".\u0020" },
        { key: "comma", mark: ",", next: ",\u0020" },
        { key: "colon", mark: ":", next: ":\u0020" },
        { key: "dash", next: "\u00a0—\u0020" },
      ];
      return {
        list,
        index: list.reduce((state, item, index) => {
          state[item.key] = index;
          return state;
        }, {}),
        byMark: {
          ".": "dot",
          ",": "comma",
          ":": "colon",
          "—": "dash",
        },
      };
    },
    punctCase(value, index, mode) {
      const left = value.slice(0, index);
      const right = value
        .slice(index)
        .replace(
          /^((?:\s|<[^>]+>|[«„“"'()])+)?([А-Яа-яA-Za-zЁё])/,
          (_, before = "", letter) =>
            `${before}${mode === "upper" ? letter.toUpperCase() : letter.toLowerCase()}`,
        );
      return `${left}${right}`;
    },
    punctTagGap(value) {
      return value.replace(
        /([,:;.!?])(?:\s|&nbsp;|&#160;)+(<\/[^>]+>)/gi,
        "$1$2",
      );
    },
    punctTailDot(value) {
      return value.replace(
        /\.(\s+)((?:<\/[^>]+>\s*)*)$/u,
        (_, __, tags = "") => `.${tags}`,
      );
    },
    punctTailMark(value, mark) {
      const esc = mark.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(
        `(${esc})(?:\\s|&nbsp;|&#160;)+((?:<\\/[^>]+>(?:\\s|&nbsp;|&#160;)*)*)$`,
        "iu",
      );
      return value.replace(pattern, "$1$2");
    },
    punctTailMarkBlock(value, mark, edge) {
      const left = value.slice(0, edge);
      const right = value.slice(edge);
      return editor.punctTailMark(left, mark) + right;
    },
    punctLocal(value, start, mark) {
      if (mark === "—") {
        const around = [
          [start - 3, start, "\u00a0—"],
          [start - 2, start + 1, "— "],
          [start, start + 3, "\u00a0— "],
          [start - 1, start + 2, " —"],
        ].find(
          ([from, to, sample]) =>
            from >= 0 && to <= value.length && value.slice(from, to) === sample,
        );
        if (around) {
          const [from, to] = around;
          return { value: value.slice(0, from) + value.slice(to) };
        }
        if (
          /[А-Яа-яA-Za-zЁё0-9»“"]/.test(value[start - 1] || "") &&
          (value[start] === " " || value[start] === "\u00a0")
        ) {
          return {
            value: value.slice(0, start) + "\u00a0— " + value.slice(start + 1),
          };
        }
        return null;
      }
      if (value[start - 1] === mark)
        return { value: value.slice(0, start - 1) + value.slice(start) };
      if (value[start] === mark)
        return { value: value.slice(0, start) + value.slice(start + 1) };
      if (
        start >= 2 &&
        value[start - 2] === mark &&
        (value[start - 1] === " " || value[start - 1] === "\u00a0")
      ) {
        return { value: value.slice(0, start - 2) + value.slice(start - 1) };
      }
      if (
        /[А-Яа-яA-Za-zЁё0-9»“"]/.test(value[start - 1] || "") &&
        (value[start] === " " || value[start] === "\u00a0")
      ) {
        return null;
      }
      return null;
    },
    punctForward(value, start) {
      const block = editor.block(value, start, start);
      const from = Math.max(start, block.start);
      const scope = value.slice(from, block.end);
      const match = scope.match(/([ \u00a0]\u2014\s*|:\s*|,\s*|\.\s*)/);
      if (!match) return null;
      const at = from + match.index;
      const raw = match[1];
      const key = /^[ \u00a0]\u2014/.test(raw)
        ? "dash"
        : raw.trim().startsWith(":")
          ? "colon"
          : raw.trim().startsWith(",")
            ? "comma"
            : "dot";
      return { at, raw, key };
    },
    punctRead(value, at) {
      const match = value
        .slice(at)
        .match(/^([ \u00a0]\u2014\s*|:\s*|,\s*|\.\s*)/);
      if (!match) return null;
      const raw = match[1];
      const key = /^[ \u00a0]\u2014/.test(raw)
        ? "dash"
        : raw.trim().startsWith(":")
          ? "colon"
          : raw.trim().startsWith(",")
            ? "comma"
            : "dot";
      return { at, raw, key };
    },
    punctLocalSimple(value, start, mark) {
      if (mark === "—") {
        const around = [
          [start - 3, start, "\u00a0\u2014"],
          [start - 2, start + 1, "\u2014 "],
          [start, start + 3, "\u00a0\u2014 "],
          [start - 1, start + 2, " \u2014"],
          [start - 1, start, "\u2014"],
          [start, start + 1, "\u2014"],
        ].find(
          ([from, to, sample]) =>
            from >= 0 && to <= value.length && value.slice(from, to) === sample,
        );
        if (!around) return null;
        const [from, to] = around;
        return value.slice(0, from) + value.slice(to);
      }
      if (value[start - 1] === mark)
        return value.slice(0, start - 1) + value.slice(start);
      if (value[start] === mark)
        return value.slice(0, start) + value.slice(start + 1);
      if (
        start >= 2 &&
        value[start - 2] === mark &&
        (value[start - 1] === " " || value[start - 1] === "\u00a0")
      ) {
        return value.slice(0, start - 2) + value.slice(start - 1);
      }
      return null;
    },
    punctInsertSimple(value, start, mark) {
      const token = mark === "—" ? "\u00a0\u2014 " : `${mark} `;
      const markKey = { ",": "comma", ":": "colon", "—": "dash" }[mark];
      const swapBeforeWord = (wordStart) => {
        const left = value.slice(0, wordStart);
        const found = left.match(/([ \u00a0]\u2014\s*|:\s*|,\s*|\.\s*)$/);
        if (!found) return null;
        const raw = found[1];
        const from = wordStart - raw.length;
        const key = /^[ \u00a0]\u2014/.test(raw)
          ? "dash"
          : raw.trim().startsWith(":")
            ? "colon"
            : raw.trim().startsWith(",")
              ? "comma"
              : "dot";
        if (!["dot", "comma", "colon", "dash"].includes(key)) return null;
        if (key === markKey) {
          const next = value.slice(0, from) + value.slice(wordStart);
          const tail = next.slice(from);
          const merged = /^[A-Za-zА-Яа-яЁё0-9]/.test(tail)
            ? `${next.slice(0, from)} ${tail}`
            : next;
          return key === "dot"
            ? editor.punctCase(merged, from, "lower")
            : merged;
        }
        const merged = value.slice(0, from) + token + value.slice(wordStart);
        return key === "dot" && markKey !== "dot"
          ? editor.punctCase(merged, from + token.length, "lower")
          : merged;
      };
      const swapAt = (pivot) => {
        const found = value
          .slice(pivot)
          .match(/^([ \u00a0]\u2014\s*|:\s*|,\s*|\.\s*)/);
        if (!found) return null;
        const raw = found[1];
        const key = /^[ \u00a0]\u2014/.test(raw)
          ? "dash"
          : raw.trim().startsWith(":")
            ? "colon"
            : raw.trim().startsWith(",")
              ? "comma"
              : "dot";
        if (key === markKey) {
          const left = value.slice(0, pivot);
          const right = value.slice(pivot + raw.length);
          const stick =
            /[A-Za-zА-Яа-яЁё0-9]$/.test(left) &&
            /^[A-Za-zА-Яа-яЁё0-9]/.test(right);
          const merged = stick ? `${left} ${right}` : left + right;
          return key === "dot"
            ? editor.punctCase(merged, pivot, "lower")
            : merged;
        }
        if (["dot", "comma", "colon", "dash"].includes(key)) {
          const merged =
            value.slice(0, pivot) + token + value.slice(pivot + raw.length);
          return key === "dot" && markKey !== "dot"
            ? editor.punctCase(merged, pivot + token.length, "lower")
            : merged;
        }
        return null;
      };
      const range = editor.word(value, start);
      if (range.start === range.end) {
        const swap = swapAt(start);
        if (swap !== null) return swap;
        const cut = value[start] === " " || value[start] === "\u00a0" ? 1 : 0;
        return value.slice(0, start) + token + value.slice(start + cut);
      }
      if (start === range.start) {
        const beforeWord = swapBeforeWord(range.start);
        if (beforeWord !== null) return beforeWord;
        const hasGap =
          range.start > 0 &&
          (value[range.start - 1] === " " ||
            value[range.start - 1] === "\u00a0");
        const pivot = hasGap ? range.start - 1 : range.start;
        const swap = swapAt(pivot);
        if (swap !== null) return swap;
        const cut = hasGap ? 1 : 0;
        return value.slice(0, pivot) + token + value.slice(pivot + cut);
      }
      const pivot = range.end;
      const swap = swapAt(pivot);
      if (swap !== null) return swap;
      const cut = value[pivot] === " " || value[pivot] === "\u00a0" ? 1 : 0;
      return value.slice(0, pivot) + token + value.slice(pivot + cut);
    },
    punctSimple(element, mark) {
      const start = element.selectionStart;
      const value = element.value;
      const local = editor.punctLocalSimple(value, start, mark);
      const next =
        local === null ? editor.punctInsertSimple(value, start, mark) : local;
      element.value = editor.punctTagGap(next);
      element.selectionStart = start;
      element.selectionEnd = start;
      editor.punctMemory.delete(element);
      editor.punctLocalMemory.delete(element);
      editor.done(element);
      return true;
    },
    punct(element, mark) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      const data = editor.punctData();
      const key = data.byMark[mark];
      if (!key) return;
      if (mark === "," && start !== end) {
        const left = value.slice(0, start).replace(/[ \u00a0]+$/g, "");
        const source = value.slice(start, end).trim();
        const right = value.slice(end).replace(/^[ \u00a0]+/g, "");
        if (!source) return;
        const tailGap = right && !/^[,.;:!?…)\]\}]/.test(right) ? " " : "";
        element.value = `${left}, ${source},${tailGap}${right}`;
        const from = left.length + 2;
        element.selectionStart = from;
        element.selectionEnd = from + source.length;
        editor.punctMemory.delete(element);
        editor.punctLocalMemory.delete(element);
        editor.done(element);
        return;
      }
      const local = editor.punctLocalSimple(value, start, mark);
      const next =
        local === null ? editor.punctInsertSimple(value, start, mark) : local;
      element.value = next;
      element.selectionStart = start;
      element.selectionEnd = start;
      editor.punctMemory.delete(element);
      editor.punctLocalMemory.delete(element);
      editor.done(element);
    },
    punctCycle(element) {
      const start = element.selectionStart;
      const value = element.value;
      const data = editor.punctData();
      const found = editor.punctForward(value, start);
      if (!found) return;
      const block = editor.block(value, start, start);
      const tail = value.slice(found.at + found.raw.length, block.end);
      const atEnd = !tail.replace(/(?:\s|<\/?[^>]+>|&nbsp;|&#160;)+/gi, "");
      const cycle = atEnd
        ? [data.list[data.index.dot], data.list[data.index.colon]]
        : data.list;
      const index = cycle.findIndex((item) => item.key === found.key);
      const next = index < 0 ? cycle[0] : cycle[(index + 1) % cycle.length];
      let string =
        value.slice(0, found.at) +
        next.next +
        value.slice(found.at + found.raw.length);
      if (found.key === "dot" && next.key !== "dot")
        string = editor.punctCase(string, found.at + next.next.length, "lower");
      if (found.key !== "dot" && next.key === "dot")
        string = editor.punctCase(string, found.at + next.next.length, "upper");
      const scope = editor.block(string, start, start);
      const cleaned =
        next.key === "dot"
          ? editor.punctTailMarkBlock(string, ".", scope.end)
          : next.key === "colon"
            ? editor.punctTailMarkBlock(string, ":", scope.end)
            : string;
      element.value = editor.punctTagGap(cleaned);
      editor.caret.done(element, start);
    },
    letterMode(element) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      const range =
        start === end
          ? editor.word(value, start)
          : editor.trim(value, start, end);
      if (range.start === range.end) return;
      const source = value.slice(range.start, range.end);
      const lower = source.toLowerCase();
      const next = source === lower ? editor.letter(lower, true) : lower;
      element.value =
        value.slice(0, range.start) + next + value.slice(range.end);
      const cursor = Math.min(start, element.value.length);
      if (start === end) {
        element.selectionStart = cursor;
        element.selectionEnd = cursor;
      } else {
        const size = next.length;
        element.selectionStart = range.start;
        element.selectionEnd = range.start + size;
      }
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
          element.selectionStart = data.start;
          element.selectionEnd = data.start + body.length;
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
      element.selectionStart = range.start + before.length;
      element.selectionEnd = range.end + before.length;
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
    qswapText(text, cursor = 0) {
      const apply = (pattern, build) => {
        const match = pattern.exec(text);
        if (!match) return null;
        const from = match.index;
        const to = from + match[0].length;
        if (cursor < from || cursor > to) return null;
        const replace = build(match);
        if (!replace || replace === match[0]) return null;
        const next = text.slice(0, from) + replace + text.slice(to);
        return {
          text: next,
          delta: next.length - text.length,
          cursor: from + replace.length,
        };
      };
      const forward = apply(
        /(<em>)\s*[—-]\s*([\s\S]*?)\s*(<\/em>\s*[—-]\s*)/i,
        (match) => {
          const body = String(match[2] || "").trim();
          if (!body) return null;
          const punct = body.match(/([,.;:!?…])$/)?.[1] || "";
          const core = punct ? body.slice(0, -1).trimEnd() : body;
          if (!core) return null;
          const quoted = punct ? `«${core}»${punct}` : `«${core}»`;
          return `${match[1]}${quoted}${match[3]}`;
        },
      );
      if (forward) return forward;
      const reverse = apply(
        /(<em>)\s*[«„]\s*([\s\S]*?)\s*[»“]\s*([,.;:!?…]?)\s*(<\/em>\s*[—-]\s*)/i,
        (match) => {
          const body = String(match[2] || "").trim();
          if (!body) return null;
          const punct = String(match[3] || "");
          const plain = `${body}${punct}`;
          return `${match[1]}— ${plain}${match[4]}`;
        },
      );
      return reverse;
    },
    qswap(element) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      const block = editor.block(value, start, end);
      const local = value.slice(block.start, block.end);
      const next = editor.qswapText(local, start - block.start);
      if (!next) return;
      element.value =
        value.slice(0, block.start) + next.text + value.slice(block.end);
      const cursor = Math.max(
        0,
        Math.min(
          block.start + next.cursor,
          (value.slice(0, block.start) + next.text + value.slice(block.end))
            .length,
        ),
      );
      element.selectionStart = cursor;
      element.selectionEnd = cursor;
      editor.done(element);
    },
    accent(element) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      const acute = "\u0301";
      if (start !== end) {
        if (end - start !== 1) return;
        if (!/[А-Яа-яA-Za-zЁё]/.test(value[start] || "")) return;
        const markAt = start + 1;
        const run = value.slice(markAt).match(/^\u0301+/)?.[0].length || 0;
        if (run > 0) {
          element.value = value.slice(0, markAt) + value.slice(markAt + run);
          editor.accentMemory.set(element, { cursor: end, base: start });
          editor.caret.done(element, start, start + 1);
          return;
        }
        element.value = value.slice(0, markAt) + acute + value.slice(markAt);
        editor.accentMemory.set(element, { cursor: end, base: start });
        editor.caret.done(element, start, start + 2);
        return;
      }
      const memory = editor.accentMemory.get(element);
      if (memory && memory.cursor !== start)
        editor.accentMemory.delete(element);
      const current = editor.accentMemory.get(element);
      const detectBase = () => {
        if (current && Number.isInteger(current.base)) return current.base;
        if (start <= 0) return -1;
        if (
          value[start - 1] === acute &&
          start - 2 >= 0 &&
          /[А-Яа-яA-Za-zЁё]/.test(value[start - 2])
        ) {
          return start - 2;
        }
        if (/[А-Яа-яA-Za-zЁё]/.test(value[start - 1] || "")) return start - 1;
        if (
          value[start] === acute &&
          start - 1 >= 0 &&
          /[А-Яа-яA-Za-zЁё]/.test(value[start - 1])
        ) {
          return start - 1;
        }
        return -1;
      };
      const base = detectBase();
      if (base < 0) return;
      const markAt = base + 1;
      const run = value.slice(markAt).match(/^\u0301+/)?.[0].length || 0;
      let next = start;
      if (run > 0) {
        element.value = value.slice(0, markAt) + value.slice(markAt + run);
        if (markAt < start) next = Math.max(markAt, start - run);
      } else {
        element.value = value.slice(0, markAt) + acute + value.slice(markAt);
        if (markAt < start) next = start + 1;
      }
      editor.accentMemory.set(element, { cursor: start, base });
      element.selectionStart = next;
      element.selectionEnd = next;
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
      const tailSpace = (string) => string.replace(/^\u00a0/, " ");
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
          value.slice(0, pair.start) + next + tailSpace(value.slice(pair.end));
        const tail = Math.max(pair.start, pair.start + next.length - 1);
        element.selectionStart = tail;
        element.selectionEnd = pair.start + next.length;
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
        value.slice(0, range.start) + next + tailSpace(value.slice(range.end));
      const tail = Math.max(range.start, range.start + next.length - 1);
      element.selectionStart = tail;
      element.selectionEnd = range.start + next.length;
      editor.done(element);
    },
    yearToken(value, start) {
      const forms = [
        { short: "й", full: "год" },
        { short: "го", full: "года" },
        { short: "м", full: "году" },
      ];
      const token = /(\d{4})(?:[-‑–—](й|го|м)|(?:\u00a0| )(года|году|год))/giu;
      const word = (char) => /[0-9A-Za-zА-Яа-яЁё]/.test(char || "");
      for (const match of value.matchAll(token)) {
        const absStart = match.index;
        const absEnd = absStart + match[0].length;
        if (start < absStart || start > absEnd) continue;
        const prev = value[absStart - 1];
        const next = value[absEnd];
        if (word(prev) || word(next)) continue;
        const short = match[2] ? match[2].toLowerCase() : null;
        const full = match[3] ? match[3].toLowerCase() : null;
        const data = short
          ? forms.find((item) => item.short === short)
          : full
            ? forms.find((item) => item.full === full)
            : null;
        if (!data) return null;
        return {
          start: absStart,
          end: absEnd,
          next: short
            ? `${match[1]}\u00a0${data.full}`
            : `${match[1]}-${data.short}`,
        };
      }
      return null;
    },
    year(element) {
      const start = element.selectionStart;
      const value = element.value;
      const data = editor.yearToken(value, start);
      if (!data) return;
      element.value =
        value.slice(0, data.start) + data.next + value.slice(data.end);
      const cursor = data.start + 4;
      element.selectionStart = cursor;
      element.selectionEnd = cursor;
      editor.done(element);
    },
    symbol(element) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      const data = ["°", "′", "″", "$", "€", "Ў", "ў", "І", "і", "í", "…"];
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
      editor.caret.done(element, start);
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
      editor.caret.done(element, start);
    },
    plain(value, start, end) {
      const text = value.slice(start, end);
      const data = { value, start, end, text, clean: "", map: [] };
      const tag = /<\/?[^>]+>/y;
      const entity = /&(?:nbsp|#160);/iy;
      let index = 0;
      while (index < text.length) {
        tag.lastIndex = index;
        entity.lastIndex = index;
        const tagged = tag.exec(text);
        const space = entity.exec(text);
        if (tagged) {
          index = tag.lastIndex;
          continue;
        }
        if (space) {
          data.clean += " ";
          data.map.push(start + index);
          index = entity.lastIndex;
          continue;
        }
        data.clean += text[index];
        data.map.push(start + index);
        index += 1;
      }
      return data;
    },
    sentence(value, start) {
      const block = editor.block(value, start, start);
      const data = editor.plain(value, block.start, block.end);
      const local = data.map.findIndex((index) => index >= start);
      const point = local < 0 ? data.clean.length : local;
      const left = data.clean.slice(0, point);
      const right = data.clean.slice(point);
      const before = left.search(/[.!?…](?:\s|[»“"'])*[^.!?…]*$/);
      const after = right.search(/[.!?…]/);
      const from = before < 0 ? 0 : before + 1;
      const to = after < 0 ? data.clean.length : point + after + 1;
      const range = {
        start: data.map[from] ?? block.start,
        end: (data.map[to - 1] ?? block.end - 1) + 1,
      };
      return editor.quoteLead(range, value);
    },
    sentenceScope(value, start, end) {
      if (start === end) return editor.sentence(value, start);
      const left = editor.sentence(value, start);
      const right = editor.sentence(value, Math.max(0, end - 1));
      return {
        start: Math.min(left.start, right.start),
        end: Math.max(left.end, right.end),
      };
    },
    quoteLead(range, value) {
      const text = value.slice(range.start, range.end);
      const skip = text.match(
        /^(?:\s|<(?:em|strong)(?:\s[^>]*)?>|<\/(?:em|strong)>)*(?:—\s+)?/i,
      )?.[0].length;
      if (!skip) return range;
      return {
        start: Math.min(range.start + skip, range.end),
        end: range.end,
      };
    },
    motion(value, range) {
      const data = editor.plain(value, range.start, range.end);
      const token = /[А-Яа-яA-Za-zЁё0-9]+|[«»„“"'()[\]{}.,:;!?…]/g;
      const tokens = [...data.clean.matchAll(token)].map((match) => ({
        cleanStart: match.index,
        cleanEnd: match.index + match[0].length,
        start: data.map[match.index],
        end: data.map[match.index + match[0].length - 1] + 1,
        text: match[0],
        type: editor.kind(match[0]),
      }));
      return editor.groups({ ...data, tokens });
    },
    kind(value) {
      if (/^[А-Яа-яA-Za-zЁё0-9]+$/.test(value)) return "word";
      if (/^[.,:;!?…]$/.test(value)) return "punctuation";
      return "wrapper";
    },
    openWrap(value) {
      return /^[«„“([{]$/.test(value);
    },
    groups(data) {
      const groups = [];
      let pending = [];
      data.tokens.forEach((token) => {
        if (token.type === "word") {
          groups.push({ tokens: [...pending, token], word: token });
          pending = [];
          return;
        }
        if (
          token.type === "wrapper" &&
          (!groups.length || editor.openWrap(token.text))
        ) {
          pending = [...pending, token];
          return;
        }
        if (!groups.length) return;
        const group = groups[groups.length - 1];
        group.tokens = [...group.tokens, token];
      });
      if (pending.length && groups.length) {
        const group = groups[groups.length - 1];
        group.tokens = [...group.tokens, ...pending];
      }
      const suffix = [];
      const last = groups[groups.length - 1];
      while (last && last.tokens.length) {
        const token = last.tokens[last.tokens.length - 1];
        const terminal =
          token.type === "punctuation" && /[.!?…]/.test(token.text);
        const wrapper = token.type === "wrapper" && suffix.length;
        if (!terminal && !wrapper) break;
        suffix.unshift(last.tokens.pop());
      }
      const list = groups
        .flatMap((group) => {
          const body = group.tokens.slice();
          const tail = [];
          while (body.length) {
            const token = body[body.length - 1];
            if (token.type !== "punctuation") break;
            tail.unshift(body.pop());
          }
          const next = [];
          if (body.length) next.push({ ...group, tokens: body });
          tail.forEach((token) => next.push({ tokens: [token], word: null }));
          return next;
        })
        .map((group, index) => {
          const first = group.tokens[0] || group.word;
          const lastToken = group.tokens[group.tokens.length - 1] || group.word;
          return {
            ...group,
            index,
            absStart: first.start,
            absEnd: lastToken.end,
          };
        });
      const between = list
        .slice(0, -1)
        .map((group, index) =>
          data.value.slice(group.absEnd, list[index + 1].absStart),
        );
      const chain = (() => {
        const groups = [];
        const slots = [];
        list.forEach((group, index) => {
          if (!index) {
            groups.push({ ...group });
            return;
          }
          const join = between[index - 1] || "";
          const lastGroup = groups[groups.length - 1];
          if (/^(?:-|‑|–)$/.test(join)) {
            lastGroup.tokens = [
              ...lastGroup.tokens,
              { text: join, type: "wrapper" },
              ...group.tokens,
            ];
            lastGroup.absEnd = group.absEnd;
            return;
          }
          slots.push(join);
          groups.push({ ...group });
        });
        return { groups, between: slots };
      })();
      const head = list.length
        ? data.value.slice(data.start, list[0].absStart)
        : data.value.slice(data.start, data.end);
      const tail = list.length
        ? data.value.slice(list[list.length - 1].absEnd, data.end)
        : "";
      const indexed = chain.groups.map((group, index) => ({ ...group, index }));
      return {
        ...data,
        groups: indexed,
        between: chain.between,
        head,
        tail,
        suffix,
      };
    },
    pick(data, start, end) {
      const from = data.groups.findIndex((group) =>
        start === end
          ? group.absStart <= start && start <= group.absEnd
          : group.absStart < end && group.absEnd > start,
      );
      if (from < 0) return null;
      if (start === end) return { from, to: from };
      const to = data.groups.reduce(
        (last, group, index) =>
          group.absStart < end && group.absEnd > start ? index : last,
        from,
      );
      return { from, to };
    },
    text(group, mode) {
      return group.tokens
        .map((token) => {
          if (token !== group.word) return token.text;
          return mode ? editor.case(token.text, mode) : token.text;
        })
        .join("");
    },
    join(data) {
      return editor.render(data, data.groups).text;
    },
    caseText(value) {
      return value.replace(
        /^((?:[«„“"'()[\]{}]\s*)*)([А-Яа-яA-Za-zЁё])/,
        (_, before = "", letter) => `${before}${letter.toUpperCase()}`,
      );
    },
    render(data, groups) {
      const parts = [data.head || ""];
      const ranges = [];
      const first = groups[0];
      const previous = data.groups[0];
      groups.forEach((group, index) => {
        const start = parts.join("").length;
        const mode =
          group === first
            ? "upper"
            : group === previous && previous !== first
              ? "lower"
              : null;
        const text = editor.text(group, mode);
        parts.push(text);
        const end = parts.join("").length;
        ranges.push({
          group,
          start,
          end,
        });
        if (index < groups.length - 1)
          parts.push(
            editor.between(group, groups[index + 1], data.between[index]),
          );
      });
      parts.push(data.tail || "");
      return {
        text: parts.join(""),
        ranges,
      };
    },
    between(left, right, join) {
      const leftToken = left?.tokens?.[left.tokens.length - 1];
      const rightToken = right?.tokens?.[0];
      const leftWord =
        leftToken?.type === "word" ||
        left?.tokens?.some((token) => token.type === "word");
      const rightWord =
        rightToken?.type === "word" ||
        (rightToken?.type === "wrapper" &&
          right?.tokens?.some((token) => token.type === "word"));
      const leftPunctGap =
        leftToken?.type === "punctuation" && /[,:;.!?…]/.test(leftToken.text);
      if (rightToken?.type === "punctuation") return "";
      if (join === "" && leftWord && rightWord) return " ";
      if (join === "" && leftPunctGap && rightWord) return " ";
      if (join !== undefined) return join;
      if (leftPunctGap && rightWord) return " ";
      return " ";
    },
    reorder(data, selection, target) {
      const groups = data.groups.slice();
      const count = selection.to - selection.from + 1;
      const chunk = groups.splice(selection.from, count);
      groups.splice(target, 0, ...chunk);
      const render = editor.render(data, groups);
      const items = render.ranges.filter((range) =>
        chunk.includes(range.group),
      );
      if (!items.length) return null;
      const range = {
        start: Math.min(...items.map((item) => item.start)),
        end: Math.max(...items.map((item) => item.end)),
      };
      return {
        value:
          data.value.slice(0, data.start) +
          render.text +
          data.value.slice(data.end),
        start: data.start + range.start,
        end: data.start + range.end,
      };
    },
    tail(group) {
      const index = group.tokens.length - 1;
      const token = group.tokens[index];
      if (!token || token.type !== "punctuation") return null;
      if (!/^[,;:]$/.test(token.text)) return null;
      return { index, token };
    },
    commaLeft(data, selection) {
      if (selection.from !== selection.to) return null;
      if (selection.from <= 0) return null;
      const left = data.groups[selection.from - 1];
      const source = data.groups[selection.from];
      const tail = editor.tail(left);
      if (!tail) return null;
      const groups = data.groups.map((group) => {
        if (group === left) {
          return {
            ...group,
            tokens: group.tokens.filter((_, index) => index !== tail.index),
          };
        }
        if (group === source) {
          return {
            ...group,
            tokens: [...group.tokens, tail.token],
          };
        }
        return group;
      });
      const render = editor.render(data, groups);
      const range = render.ranges.find(
        (item) => item.group.index === source.index,
      );
      if (!range) return null;
      return {
        value:
          data.value.slice(0, data.start) +
          render.text +
          data.value.slice(data.end),
        start: data.start + range.start,
        end: data.start + range.end,
      };
    },
    commaRight(data, selection) {
      if (selection.from !== selection.to) return null;
      if (selection.from >= data.groups.length - 1) return null;
      const source = data.groups[selection.from];
      const right = data.groups[selection.from + 1];
      const tail = editor.tail(source);
      if (!tail) return null;
      const groups = data.groups.map((group) => {
        if (group === source) {
          return {
            ...group,
            tokens: group.tokens.filter((_, index) => index !== tail.index),
          };
        }
        if (group === right) {
          return {
            ...group,
            tokens: [...group.tokens, tail.token],
          };
        }
        return group;
      });
      const render = editor.render(data, groups);
      const range = render.ranges.find(
        (item) => item.group.index === source.index,
      );
      if (!range) return null;
      return {
        value:
          data.value.slice(0, data.start) +
          render.text +
          data.value.slice(data.end),
        start: data.start + range.start,
        end: data.start + range.end,
      };
    },
    shift(selection, step, size) {
      const count = selection.to - selection.from + 1;
      const target = selection.from + step;
      if (target < 0) return null;
      if (target + count > size) return null;
      return {
        from: selection.from,
        to: selection.to,
        target,
      };
    },
    begin(selection) {
      if (selection.from <= 0) return null;
      return {
        from: selection.from,
        to: selection.to,
        target: 0,
      };
    },
    apply(element, move, option = {}) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      const range = editor.sentenceScope(value, start, end);
      const data = editor.motion(value, range);
      const selection = editor.pick(data, start, end);
      if (!selection) return;
      const soft = option.beforeComma
        ? editor.commaLeft(data, selection)
        : option.afterComma
          ? editor.commaRight(data, selection)
          : null;
      if (soft) {
        element.value = soft.value;
        element.selectionStart = soft.start;
        element.selectionEnd = soft.end;
        editor.done(element);
        return;
      }
      const next = move(selection, data.groups.length);
      if (!next) return;
      const result = editor.reorder(data, selection, next.target);
      if (!result) return;
      element.value = result.value;
      element.selectionStart = result.start;
      element.selectionEnd = result.end;
      editor.done(element);
    },
    move(element, step) {
      editor.apply(element, (selection, size) =>
        editor.shift(selection, step, size),
      );
    },
    home(element) {
      editor.apply(element, (selection) => editor.begin(selection));
    },
    case(value, mode) {
      return value.replace(
        /^((?:[«„“"'()[\]{}]\s*)*)([А-Яа-яA-Za-zЁё])/,
        (_, before = "", letter) => {
          const next =
            mode === "upper" ? letter.toUpperCase() : letter.toLowerCase();
          return `${before}${next}`;
        },
      );
    },
    lowerGroup(group, lower) {
      if (!lower) return group;
      return {
        ...group,
        tokens: group.tokens.map((token) => {
          if (token !== group.word) return token;
          return {
            ...token,
            text: editor.case(token.text, "lower"),
          };
        }),
      };
    },
    note(element) {
      const start = element.selectionStart;
      const value = element.value;
      const block = editor.block(value, start, start);
      const text = value.slice(block.start, block.end);
      const plain = text.replace(/<\/?em>/gi, "");
      const notes = [];
      const token = (index) => `\u0001NOTE${index}\u0002`;
      const prepared = plain.replace(
        /\(([^()]+?)(?:\s+—|,)\s+прим\.\s+([^()]+)\)/gi,
        (_, body, name) => {
          const clear = body.replace(/\s*[.:,]?\s*$/, "");
          const item = `(${clear}. — Прим. ${name.trim()})`;
          const index = notes.push(item) - 1;
          return token(index);
        },
      );
      if (!notes.length) return;
      const next = notes.reduce(
        (string, item, index) =>
          string.replace(token(index), `</em>${item}<em>`),
        `<em>${prepared}</em>`,
      );
      element.value =
        value.slice(0, block.start) + next + value.slice(block.end);
      editor.caret.done(element, start);
    },
    wordCycleData(value, start, end) {
      const groups = [
        {
          origin: "делиться",
          excludeOrigin: true,
          forms: ["делиться", "рассказывать", "говорить", "сообщать"],
        },
        {
          origin: "делится",
          excludeOrigin: true,
          forms: ["делится", "рассказывает", "говорит", "сообщает"],
        },
        {
          origin: "делятся",
          excludeOrigin: true,
          forms: ["делятся", "рассказывают", "говорят", "сообщают"],
        },
        {
          origin: "делился",
          excludeOrigin: true,
          forms: ["делился", "рассказывал", "говорил", "сообщал"],
        },
        {
          origin: "делилась",
          excludeOrigin: true,
          forms: ["делилась", "рассказывала", "говорила", "сообщала"],
        },
        {
          origin: "делились",
          excludeOrigin: true,
          forms: ["делились", "рассказывали", "говорили", "сообщали"],
        },
        {
          origin: "делюсь",
          excludeOrigin: true,
          forms: ["делюсь", "рассказываю", "говорю", "сообщаю"],
        },
        {
          origin: "делимся",
          excludeOrigin: true,
          forms: ["делимся", "рассказываем", "говорим", "сообщаем"],
        },
        {
          origin: "делитесь",
          excludeOrigin: true,
          forms: ["делитесь", "рассказываете", "говорите", "сообщаете"],
        },
        {
          origin: "поделиться",
          excludeOrigin: true,
          forms: ["поделиться", "рассказать", "сообщить"],
        },
        {
          origin: "поделится",
          excludeOrigin: true,
          forms: ["поделится", "расскажет", "сообщит"],
        },
        {
          origin: "поделился",
          excludeOrigin: true,
          forms: ["поделился", "рассказал", "сообщил"],
        },
        {
          origin: "поделилась",
          excludeOrigin: true,
          forms: ["поделилась", "рассказала", "сообщила"],
        },
        {
          origin: "поделились",
          excludeOrigin: true,
          forms: ["поделились", "рассказали", "сообщили"],
        },
        { origin: "", excludeOrigin: false, forms: ["после", "впоследствии"] },
        { origin: "", excludeOrigin: false, forms: ["или", "либо"] },
        { origin: "", excludeOrigin: false, forms: ["но", "однако"] },
        { origin: "", excludeOrigin: false, forms: ["закончить", "окончить"] },
        {
          origin: "",
          excludeOrigin: false,
          forms: ["учитывая", "с учетом того"],
        },
        {
          origin: "",
          excludeOrigin: false,
          forms: ["независимо", "вне зависимости"],
        },
        {
          origin: "",
          excludeOrigin: false,
          forms: ["с помощью", "при помощи"],
        },
        {
          origin: "",
          excludeOrigin: false,
          forms: ["больше", "более"],
        },
        {
          origin: "",
          excludeOrigin: false,
          forms: ["меньше", "менее"],
        },
        {
          origin: "",
          excludeOrigin: false,
          forms: ["более или менее", "более-менее"],
        },
        {
          origin: "",
          excludeOrigin: false,
          forms: ["РБ", "Республики Беларусь", "Беларусь"],
        },
      ];
      const verbSlots = [
        "inf",
        "pres_1s",
        "pres_2s",
        "pres_3s",
        "pres_1p",
        "pres_2p",
        "pres_3p",
        "past_m",
        "past_f",
        "past_n",
        "past_p",
        "gerund",
        "part_pres_m",
        "part_pres_f",
        "part_pres_n",
        "part_pres_p",
      ];
      const verbBuild = (lemma, model = "1") => {
        const postfix = lemma.endsWith("ся")
          ? "ся"
          : lemma.endsWith("сь")
            ? "сь"
            : "";
        const core = postfix ? lemma.slice(0, -postfix.length) : lemma;
        if (!core.endsWith("ть")) return null;
        const base = core.slice(0, -2);
        const act =
          model === "2" && base.endsWith("и") ? base.slice(0, -1) : base;
        const data =
          model === "2"
            ? {
                inf: core,
                pres_1s: `${act}ю`,
                pres_2s: `${act}ишь`,
                pres_3s: `${act}ит`,
                pres_1p: `${act}им`,
                pres_2p: `${act}ите`,
                pres_3p: `${act}ят`,
                past_m: `${base}л`,
                past_f: `${base}ла`,
                past_n: `${base}ло`,
                past_p: `${base}ли`,
                gerund: `${act}я`,
                part_pres_m: `${act}ящий`,
                part_pres_f: `${act}ящая`,
                part_pres_n: `${act}ящее`,
                part_pres_p: `${act}ящие`,
              }
            : {
                inf: core,
                pres_1s: `${base}ю`,
                pres_2s: `${base}ешь`,
                pres_3s: `${base}ет`,
                pres_1p: `${base}ем`,
                pres_2p: `${base}ете`,
                pres_3p: `${base}ют`,
                past_m: `${base}л`,
                past_f: `${base}ла`,
                past_n: `${base}ло`,
                past_p: `${base}ли`,
                gerund: `${base}я`,
                part_pres_m: `${base}ющий`,
                part_pres_f: `${base}ющая`,
                part_pres_n: `${base}ющее`,
                part_pres_p: `${base}ющие`,
              };
        if (!postfix) return data;
        return Object.fromEntries(
          Object.entries(data).map(([slot, form]) => [
            slot,
            `${form}${postfix}`,
          ]),
        );
      };
      const verbPairCycle = (source) => {
        const lower = source.toLowerCase();
        const pairs = [
          {
            left: verbBuild("кушать", "1"),
            right: {
              ...verbBuild("есть", "1"),
              pres_1s: "ем",
              pres_2s: "ешь",
              pres_3s: "ест",
              pres_1p: "едим",
              pres_2p: "едите",
              pres_3p: "едят",
              past_m: "ел",
              past_f: "ела",
              past_n: "ело",
              past_p: "ели",
              gerund: "едя",
              part_pres_m: "едящий",
              part_pres_f: "едящая",
              part_pres_n: "едящее",
              part_pres_p: "едящие",
            },
          },
        ];
        for (const pair of pairs) {
          for (const slot of verbSlots) {
            const left = pair.left[slot];
            const right = pair.right[slot];
            if (!left || !right) continue;
            if (lower !== left && lower !== right) continue;
            return {
              source: lower,
              chain: [left, right],
              index: lower === left ? 0 : 1,
            };
          }
        }
        return null;
      };
      const verbCycle = (source) => {
        const lower = source.toLowerCase();
        const postfix = lower.endsWith("ся")
          ? "ся"
          : lower.endsWith("сь")
            ? "сь"
            : "";
        const stemmed = postfix ? lower.slice(0, -postfix.length) : lower;
        const list = [
          ["ает", "ают"],
          ["яет", "яют"],
          ["ует", "уют"],
          ["ит", "ят"],
          ["ет", "ют"],
        ];
        const pair = list.find(
          ([single, plural]) =>
            stemmed.length > single.length + 1 &&
            (stemmed.endsWith(single) || stemmed.endsWith(plural)),
        );
        if (!pair) return null;
        const [single, plural] = pair;
        const stem = stemmed.endsWith(single)
          ? stemmed.slice(0, -single.length)
          : stemmed.slice(0, -plural.length);
        const chain = [
          `${stem}${single}${postfix}`,
          `${stem}${plural}${postfix}`,
        ];
        return {
          source: lower,
          chain,
          index: lower === chain[0] ? 0 : 1,
        };
      };
      const word = (char) => /[0-9A-Za-zА-Яа-яЁё]/.test(char || "");
      const lowerValue = value.toLowerCase();
      const hit = (() => {
        const matches = [];
        groups.forEach((group) => {
          group.forms.forEach((form) => {
            const token = form.toLowerCase();
            if (!token.includes(" ")) return;
            let from = lowerValue.indexOf(token);
            while (from >= 0) {
              const to = from + token.length;
              const inside =
                start === end
                  ? start >= from && start <= to
                  : end > from && start < to;
              if (
                inside &&
                !word(lowerValue[from - 1]) &&
                !word(lowerValue[to])
              )
                matches.push({ group, from, to, token });
              from = lowerValue.indexOf(token, from + 1);
            }
          });
        });
        if (!matches.length) return null;
        return matches.sort((a, b) => b.token.length - a.token.length)[0];
      })();
      const range = hit
        ? { start: hit.from, end: hit.to }
        : start === end
          ? editor.word(value, start)
          : { start, end };
      if (range.start === range.end) return null;
      const source = value.slice(range.start, range.end);
      const lower = source.toLowerCase();
      const group = hit
        ? hit.group
        : groups.find((item) => item.forms.includes(lower));
      const base = group
        ? group.excludeOrigin
          ? group.forms.filter((item) => item !== group.origin)
          : group.forms.slice()
        : null;
      const upper = source[0] === source[0].toUpperCase();
      const raw = base?.length
        ? {
            source: lower,
            chain: base,
            index: base.findIndex((item) => item.toLowerCase() === lower),
          }
        : verbPairCycle(source) || verbCycle(source);
      if (!raw || !raw.chain.length) return null;
      const chain = raw.chain.map((item) =>
        upper ? `${item[0].toUpperCase()}${item.slice(1)}` : item,
      );
      return {
        range,
        source: raw.source,
        chain,
        index: raw.index,
      };
    },
    branch(element) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      const data = editor.wordCycleData(value, start, end);
      if (data) {
        const index = data.index < 0 ? 0 : (data.index + 1) % data.chain.length;
        const next = data.chain[index];
        element.value =
          value.slice(0, data.range.start) + next + value.slice(data.range.end);
        const cursor = data.range.start + next.length;
        element.selectionStart = cursor;
        element.selectionEnd = cursor;
        editor.done(element);
        return;
      }
    },
    branchDecode(value) {
      const field = document.createElement("textarea");
      field.innerHTML = value;
      return field.value;
    },
    branchSkip(tag) {
      return /\sid=(?:"toc"|'toc'|toc)(?:\s|>)/i.test(tag);
    },
    branchClean(value) {
      return value.replace(
        /^\s*<a\b[^>]*\bname=(?:"zag\d+"|'zag\d+'|zag\d+)[^>]*>\s*<\/a>\s*/i,
        "",
      );
    },
    branchTitle(value) {
      return editor.branchDecode(
        value
          .replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .trim(),
      );
    },
    branchTag(value, id) {
      return value.replace(/^<h2\b([^>]*)>/i, (_, attrs) => {
        const clean = attrs.replace(/\s+id=(?:"[^"]*"|'[^']*'|[^\s>]+)/i, "");
        return `<h2${clean} id="${id}">`;
      });
    },
    branchHeading(value, items) {
      return value.replace(/<h2\b[^>]*>[\s\S]*?<\/h2>/gi, (match) => {
        const tag = match.match(/^<h2\b[^>]*>/i)[0];
        if (editor.branchSkip(tag)) return match;
        const id = `zag${items.length}`;
        const inner = match
          .replace(/^<h2\b[^>]*>/i, "")
          .replace(/<\/h2>$/i, "");
        const content = editor.branchClean(inner);
        items.push({ id, title: editor.branchTitle(content) });
        return `${editor.branchTag(tag, id)}${content}</h2>`;
      });
    },
    branchToc(items) {
      return [
        '<h2 id="toc">О чем эта статья</h2>',
        "<ul>",
        ...items.map(
          (item) => `\t<li><a href="#${item.id}">${item.title}</a></li>`,
        ),
        "</ul>",
      ].join("\n");
    },
    branchRemove(value) {
      return value.replace(
        /\n?\s*<h[23]\b[^>]*>\s*О чем эта статья\s*<\/h[23]>\s*<ul>\s*[\s\S]*?<\/ul>\s*/i,
        "\n",
      );
    },
    branchInsert(value, content) {
      if (!/<!--more-->/i.test(value)) return value;
      return value.replace(/<!--more-->/i, `<!--more-->\n${content}`);
    },
    branchArticle(value) {
      const items = [];
      const clean = editor.branchRemove(value);
      const content = editor.branchHeading(clean, items);
      if (!items.length) return value;
      return editor.branchInsert(content, editor.branchToc(items));
    },
    abbrData(value, start) {
      const left = value.slice(0, start).match(/[А-Яа-яA-Za-zЁё.]+$/);
      const right = value.slice(start).match(/^[А-Яа-яA-Za-zЁё.]+/);
      let range = {
        start: left ? start - left[0].length : start,
        end: start + (right ? right[0].length : 0),
      };
      if (range.start === range.end) return null;
      let string = value.slice(range.start, range.end).toLowerCase();
      const data = [
        { left: ["тыс."], right: ["тысяч", "тысячи", "тысяча"] },
        { left: ["млн"], right: ["миллиона", "миллионов", "миллион"] },
        { left: ["млрд"], right: ["миллиарда", "миллиардов", "миллиард"] },
        { left: ["трлн"], right: ["триллиона", "триллионов", "триллион"] },
        { left: ["г."], right: "года" },
        { left: ["р."], right: ["рублей", "рубля", "рубль"] },
        { left: ["руб."], right: ["рублей", "рубля", "рубль"] },
        { left: ["г"], right: ["граммов", "грамма", "грамм"] },
        { left: ["кг"], right: ["килограммов", "килограмма", "килограмм"] },
        { left: ["м"], right: ["метров", "метра", "метр"] },
        { left: ["км", "км."], right: ["километров", "километра", "километр"] },
        { left: ["га"], right: ["гектаров", "гектара", "гектар"] },
        {
          left: ["ст."],
          right: ["статьи", "статью", "статьей", "статье", "статья"],
        },
        { left: ["ч."], right: ["части", "частью", "часть"] },
        { left: ["п."], right: ["пункта", "пунктом", "пункт"] },
        { left: ["пп."], right: ["пунктов", "пунктами", "пункты"] },
        { left: ["в т. ч."], right: "в том числе" },
        { left: ["и т. д."], right: "и так далее" },
        { left: ["и т. п."], right: "и тому подобное" },
        { left: ["т. е."], right: "то есть" },
        { left: ["т. к"], right: "так как" },
        {
          left: ["кв. м"],
          right: [
            "квадратных метров",
            "квадратного метра",
            "квадратный метр",
            "«квадратов»",
            "«квадрата»",
            "«квадрат»",
          ],
        },
      ];
      const stripDot = (string) => string.replace(/\.$/, "");
      const equal = (left, right) => {
        if (left === right) return true;
        if (left === "г." || right === "г.") return false;
        return stripDot(left) === stripDot(right);
      };
      const lower = value.toLowerCase();
      const phrase = data
        .flatMap((entry) => {
          const right = Array.isArray(entry.right)
            ? entry.right
            : [entry.right];
          return [...entry.left, ...right];
        })
        .map((item) => item.toLowerCase())
        .filter((item) => /\s/.test(item))
        .find((item) => {
          let from = lower.indexOf(item);
          while (from >= 0) {
            const to = from + item.length;
            if (start >= from && start <= to) return true;
            from = lower.indexOf(item, from + 1);
          }
          return false;
        });
      if (phrase) {
        let from = lower.indexOf(phrase);
        while (from >= 0) {
          const to = from + phrase.length;
          if (start >= from && start <= to) {
            range = { start: from, end: to };
            string = lower.slice(from, to);
            break;
          }
          from = lower.indexOf(phrase, from + 1);
        }
      }
      const item = data.find(
        (entry) =>
          entry.left.some((value) => equal(value, string)) ||
          (() => {
            const right = Array.isArray(entry.right)
              ? entry.right
              : [entry.right];
            return right.some((value) => equal(value, string));
          })(),
      );
      if (!item) return null;
      const rightList = Array.isArray(item.right) ? item.right : [item.right];
      const chain = [...item.left, ...rightList];
      const index = chain.findIndex((value) => equal(value, string));
      if (index < 0) return null;
      return {
        range,
        chain,
        index,
        leftCount: item.left.length,
        rightCount: rightList.length,
      };
    },
    abbrEnd(value, index) {
      const block = editor.block(value, index, index);
      const tail = value.slice(index, block.end);
      const next = tail.replace(/^(?:\s|<\/?[^>]+>|[»“"'()\]\}])+/u, "");
      return next.length === 0;
    },
    abbr(element) {
      const start = element.selectionStart;
      const value = element.value;
      const data = editor.abbrData(value, start);
      if (!data) return;
      const memory = editor.abbrMemory.get(element);
      const key = data.chain.join("\u0001");
      let state =
        memory && memory.at === data.range.start && memory.key === key
          ? memory
          : {
              at: data.range.start,
              key,
              one: null,
              resume: null,
              jumped: false,
            };
      let nextIndex = (data.index + 1) % data.chain.length;
      if (state.resume !== null && data.index === state.one) {
        nextIndex = state.resume;
        state.resume = null;
        state.jumped = true;
      } else if (
        !state.jumped &&
        data.leftCount > 1 &&
        data.rightCount === 1 &&
        data.index < data.leftCount
      ) {
        nextIndex = data.leftCount;
        state.one = data.leftCount;
        state.resume = (data.index + 1) % data.leftCount;
      } else if (
        !state.jumped &&
        data.leftCount === 1 &&
        data.rightCount > 1 &&
        data.index >= data.leftCount
      ) {
        const rightIndex = data.index - data.leftCount;
        nextIndex = 0;
        state.one = 0;
        state.resume = data.leftCount + ((rightIndex + 1) % data.rightCount);
      } else if (state.resume === null) {
        state.jumped = true;
      }
      editor.abbrMemory.set(element, state);
      const nextValue = data.chain[nextIndex];
      const source = value.slice(data.range.start, data.range.end);
      const hadDot = source.endsWith(".");
      const nextHasDot = nextValue.endsWith(".");
      const tailDot = nextHasDot && value[data.range.end] === "." ? 1 : 0;
      const keepDot = !nextHasDot && hadDot;
      const next = keepDot ? `${nextValue}.` : nextValue;
      element.value =
        value.slice(0, data.range.start) +
        next +
        value.slice(data.range.end + tailDot);
      element.selectionStart = data.range.start;
      element.selectionEnd = data.range.start;
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
    listItems(value) {
      return [...value.matchAll(/<li(?:\s[^>]*)?>[\s\S]*?<\/li>/gi)].map(
        (match) => ({
          full: match[0],
          body: match[0]
            .replace(/^<li(?:\s[^>]*)?>/i, "")
            .replace(/<\/li>$/i, ""),
        }),
      );
    },
    listToc(value) {
      const items = editor.listItems(value);
      if (!items.length) return false;
      return items.every((item) =>
        /<a\b[^>]*\bhref=(?:"|')#zag\d+(?:"|')[^>]*>[\s\S]*<\/a>/i.test(
          item.body.trim(),
        ),
      );
    },
    listTailPunct(value) {
      const data = editor.plain(value, 0, value.length);
      let index = data.clean.length - 1;
      while (index >= 0 && /[\s\u00a0]/.test(data.clean[index])) index -= 1;
      if (index < 0) return value;
      if (!/[.,;:!?…]/.test(data.clean[index])) return value;
      const at = data.map[index];
      if (at === undefined) return value;
      return value.slice(0, at) + value.slice(at + 1);
    },
    listSelection(value, start, end) {
      if (start === end) return null;
      const range = editor.trim(value, start, end);
      if (range.start === range.end) return null;
      const source = value.slice(range.start, range.end);
      if (/<(?:ul|ol|li)\b/i.test(source)) return null;
      const blocks = [
        ...source.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi),
      ].map((item) => item[1]);
      const plainRows = source
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
      const rows = (blocks.length ? blocks : plainRows)
        .map((item) =>
          item.replace(/^((?:<[^>]+>\s*)*)(?:[-•●▪◦]|\d+\.)\s+/i, "$1").trim(),
        )
        .filter(Boolean);
      if (!rows.length) return null;
      const items = rows.map((item) => `<li>${item}</li>`).join("\n");
      return {
        start: range.start,
        end: range.end,
        value: `<ul>\n${items}\n</ul>`,
      };
    },
    list(element) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      const selection = editor.listSelection(value, start, end);
      if (selection) {
        element.value =
          value.slice(0, selection.start) +
          selection.value +
          value.slice(selection.end);
        editor.caret.done(element, selection.start);
        return;
      }
      const html = editor.listTag(value, start);
      if (html) {
        const string = value.slice(html.start, html.end);
        if (editor.listToc(string)) {
          const next = string.replace(
            /<li(?:\s[^>]*)?>([\s\S]*?)<\/li>/gi,
            (_, item) => {
              const text = item
                .trim()
                .replace(/^((?:<[^>]+>\s*)*)(?:[-•●▪◦]|\d+\.)\s+/i, "$1");
              const clear = editor.listTailPunct(text);
              const letter = editor.letterPlain(clear, true);
              return `<li>${letter}</li>`;
            },
          );
          element.value =
            value.slice(0, html.start) + next + value.slice(html.end);
          editor.caret.done(element, start);
          return;
        }
        const semicolon =
          /<\/li>\s*<li/i.test(string) && /;\s*<\/li>/i.test(string);
        const mode = semicolon ? "." : ";";
        const next = string.replace(
          /<li(?:\s[^>]*)?>([\s\S]*?)<\/li>/gi,
          (_, item) => {
            const text = item
              .trim()
              .replace(/^((?:<[^>]+>\s*)*)(?:[-•●▪◦]|\d+\.)\s+/i, "$1");
            const clear = editor.listTailPunct(text);
            const letter = editor.letter(clear, mode === ".");
            return `<li>${letter}${mode}</li>`;
          },
        );
        const result =
          mode === ";"
            ? next.replace(/;(<\/li>\s*<\/(?:ul|ol)>)/i, ".$1")
            : next;
        element.value =
          value.slice(0, html.start) + result + value.slice(html.end);
        editor.caret.done(element, start);
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
      editor.caret.done(element, start);
    },
    search(element, source) {
      return search.open(element, source);
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
        number: Boolean(
          value.slice(0, start).match(/\d+$/) ||
          value.slice(start).match(/^\d+/),
        ),
        branch: Boolean(editor.wordCycleData(value, start, start)),
        list: Boolean(editor.listTag(value, start)),
        year: Boolean(editor.yearToken(value, start)),
        abbr: Boolean(editor.abbrData(value, start)),
        note: note,
        "mode-search": state.mode === "search",
        "mode-markup": state.mode === "markup",
        "mode-punct": state.mode === "punct",
        "mode-transform": state.mode === "transform",
      };
    },
    inView(panel) {
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
      if (editor.inView(panel)) return;
      panel.dataset.manual = "false";
      editor.controller?.behavior.place();
    },
  };
  editor.controller = toolbar.creature({
    panel: bar,
    ...toolbar.presets.rail("content", {
      panel: bar,
      place: () => editor.place(bar),
      launcher: {
        prepare() {
          editor.solo(false);
          editor.collapsed(true);
          editor.paint();
        },
      },
      drag: {
        canStart(event) {
          const touch = toolbar.mobile() || appleTouch();
          if (touch) {
            const fullscreen = editor.fullscreen();
            const keyboard = bar.dataset.keyboardOpen === "true";
            if (!fullscreen || keyboard) return false;
          }
          return true;
        },
      },
      position: {
        key: "editor-panel-position",
      },
    }),
    theme: () => editor.theme(),
    observe: { scroll: false },
    rescue: () => {
      if (toolbar.mobile()) return;
      editor.rescue(bar);
    },
    actions: {
      keepFocus: true,
      action({ name }) {
        const system = systemAction[name];
        if (typeof system === "function") {
          system();
          return;
        }
        const run = editorAction[name];
        if (typeof run !== "function") return;
        const element = editor.get();
        const current = editor.current();
        if (!element && !current) return;
        const target = element || current;
        editor.restoreSelection(target);
        editor.rememberSelection(target);
        const before = editor.snapshot(target);
        const cycle = editor.cycle.signature(name, target);
        editor.keep(target, () => run(target));
        const changed = target.value !== before.value;
        if (changed) editor.undoPush(target, before);
        if (toolbar.mobile()) {
          const focused = editor.current();
          if (focused) toolbar.active.sync(bar, editor.state(focused));
          if (!focused) toolbar.active.clear(bar);
        }
        editor.soloAfterAction(name, target, cycle);
      },
    },
  });
  toolbar.listen(bar, bar, "contextmenu", (event) => {
    const theme = event.target.closest('[data-action="theme"]');
    if (!theme) return;
    event.preventDefault();
    const next = state.iconMode === "glyph" ? "emoji" : "glyph";
    state.iconMode = next;
    toolbar.state("editor-panel-icon-mode", next);
    editor.paint();
    editor.controller?.behavior.place();
  });
  editor.rescue(bar);
  editor.controller.appearance.sync();
  editor.controller.behavior.bind({ sync: false });
  if (window.visualViewport) {
    const refresh = () => {
      if (!editor.fullscreen()) return;
      editor.controller?.behavior.place();
    };
    toolbar.listen(bar, window.visualViewport, "resize", refresh);
    toolbar.listen(bar, window.visualViewport, "scroll", refresh);
  }
  toolbar.listen(bar, document, "focusin", (event) => {
    if (!editor.fullscreen()) return;
    if (event.target?.id !== "content") return;
    setTimeout(() => editor.controller?.behavior.place(), 40);
  });
  toolbar.listen(bar, document, "focusout", (event) => {
    if (!editor.fullscreen()) return;
    if (event.target?.id !== "content") return;
    setTimeout(() => editor.controller?.behavior.place(), 40);
  });
  toolbar.listen(bar, document, "keydown", (event) => {
    if (event.defaultPrevented) return;
    const apple =
      /Mac|iPhone|iPad|iPod/.test(navigator.platform) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const mod = apple
      ? event.altKey && event.ctrlKey && !event.metaKey
      : event.altKey && !event.ctrlKey && !event.metaKey;
    if (!mod) return;
    const actionByCode = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "abbr",
      ArrowDown: "nbsp",
      Slash: "punct",
      Minus: "dash",
      NumpadMinus: "dash",
      Equal: "branch",
      NumpadAdd: "branch",
      Quote: "quote",
      Comma: "em",
      Period: "strong",
      KeyC: "qswap",
      KeyL: "list",
      KeyN: "number",
      KeyY: "year",

      KeyZ: "google",
      KeyQ: "gramota",
      KeyA: "abbr",
      KeyT: "letter",
    };
    const codeAction = actionByCode[String(event.code || "")];
    if (codeAction) {
      const fired = editor.hotkeyAction(codeAction);
      if (!fired) return;
      event.preventDefault();
      return;
    }
    const code = String(event.code || "");
    const key = String(event.key || "");
    const match = code.match(/^Digit([1-9])$/) || key.match(/^([1-9])$/);
    if (!match) return;
    const index = Number(match[1]) - 1;
    if (!Number.isFinite(index) || index < 0) return;
    const fired = editor.hotkeyButton(index);
    if (!fired) return;
    event.preventDefault();
  });
  const systemAction = {
    "mode-search"() {
      editor.modeView("search");
      editor.paint();
      editor.controller?.behavior.place();
      editor.revealModeStart(bar);
    },
    "mode-markup"() {
      editor.modeView("markup");
      editor.paint();
      editor.controller?.behavior.place();
      editor.revealModeStart(bar);
    },
    "mode-punct"() {
      editor.modeView("punct");
      editor.paint();
      editor.controller?.behavior.place();
      editor.revealModeStart(bar);
    },
    "mode-transform"() {
      editor.modeView("transform");
      editor.paint();
      editor.controller?.behavior.place();
      editor.revealModeStart(bar);
    },
    place() {
      editor.controller?.behavior.launcher();
    },
    theme() {
      toolbar.behavior.themeToggle(bar, {
        get: () => themeState(),
        set: (next) => themeState(next),
        action: "theme",
        scope: "editor",
      });
    },
    close() {
      editor.controller?.behavior.destroy();
      editor.controller = null;
      if (window.__editorPanelClose) delete window.__editorPanelClose;
      bar.remove();
      document.getElementById(`${id}-style`)?.remove();
    },
  };
  window.__editorPanelClose = () => systemAction.close();
  const editorAction = {
    nbsp: editor.nbsp,
    em: (element) => editor.taggle(element, "em"),
    strong: (element) => editor.taggle(element, "strong"),
    killem: editor.clear,
    comma: (element) => editor.punct(element, ","),
    colon: (element) => editor.punct(element, ":"),
    dash: (element) => editor.punct(element, "—"),
    punct: editor.punctCycle,
    scroll: editor.scrollAnchor,
    swap: editor.swap,
    quote: editor.quote,
    qswap: editor.qswap,
    accent: editor.accent,
    list: editor.list,
    left: (element) => editor.move(element, -1),
    right: (element) => editor.move(element, 1),
    home: editor.home,
    letter: editor.letterMode,
    number: editor.number,
    year: editor.year,
    symbol: editor.symbol,
    math: editor.math,
    note: editor.note,
    branch: editor.branch,
    abbr: editor.abbr,
    gramota: (element) => editor.search(element, "gramota"),
    google: (element) => editor.search(element, "google"),
    kinopoisk: (element) => editor.search(element, "kinopoisk"),
  };
  document.addEventListener("selectionchange", () => {
    const element = editor.current();
    if (!element) {
      toolbar.active.clear(bar);
      return;
    }
    editor.rememberSelection(element);
    toolbar.active.sync(bar, editor.state(element));
  });
  document.addEventListener("keydown", (event) => {
    const apple = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    const mod = apple ? event.metaKey : event.ctrlKey;
    if (!mod) return;
    const key = String(event.key || "").toLowerCase();
    const element = editor.current();
    if (!element || element.id !== "content") return;
    if (key === "z" && event.shiftKey) {
      if (!editor.redoStep(element)) return;
      event.preventDefault();
      return;
    }
    if (key === "z") {
      if (!editor.undoStep(element)) return;
      event.preventDefault();
      return;
    }
    if (key !== "y") return;
    if (!editor.redoStep(element)) return;
    event.preventDefault();
  });
})();
