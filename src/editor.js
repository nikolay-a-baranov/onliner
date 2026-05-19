import { frame } from "./core/panel.js";
import { toolbar } from "./core/toolbar.js";
import { icon } from "./core/icon.js";
import { css } from "./core/css.js";

(() => {
  const id = "editor-panel";
  const style = css.editor.text();
  const glyph = {
    drag: icon.fluent("Drag"),
    scroll: icon.fluent("Dual Screen Update"),
    nbsp: icon.fluent("Spacebar"),
    em: icon.fluent("Text Italic"),
    strong: icon.fluent("Text Bold"),
    killem: icon.fluent("Eraser"),
    quote: icon.fluent("Comment Quote"),
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
  };
  const button = (item) => {
    const content = item.logo
      ? icon.logo.editorSource(item.logo)
      : item.icon
        ? `<img class="toolbar-icon" src="${glyph[item.icon]}" alt="">`
        : icon.emoji(item.label);
    return `<button class="button button-emoji toolbar-segment" data-action="${item.action}">${toolbar.icon(content)}</button>`;
  };
  const row = (items) =>
    `<div class="toolbar-group editor-row"><div class="toolbar-segment-group">${items.map(button).join("")}</div></div>`;
  const buttons = [
    [
      { action: "scroll", label: "↕️", icon: "scroll" },
      { action: "nbsp", label: "🔦", icon: "nbsp" },
      { action: "em", label: "🩹 em", icon: "em" },
      { action: "strong", label: "🩹 strong", icon: "strong" },
      { action: "killem", label: "💀 em", icon: "killem" },
      { action: "quote", label: "⌨️ «„“»", icon: "quote" },
      { action: "comma", label: "⌨️ ,", icon: "comma" },
      { action: "dash", label: "⌨️ —", icon: "dash" },
      { action: "colon", label: "⌨️ :", icon: "colon" },
      { action: "punct", label: "⌨️ ,.:—", icon: "punct" },
      { action: "home", label: "🔙", icon: "home" },
      { action: "left", label: "⬅️", icon: "left" },
      { action: "right", label: "➡️", icon: "right" },
      { action: "letter", label: "🔠", icon: "letter" },
      { action: "number", label: "🔢", icon: "number" },
      { action: "symbol", label: "🔣", icon: "symbol" },
      { action: "math", label: "*️⃣", icon: "math" },
      { action: "accent", label: "💪", icon: "accent" },
      { action: "abbr", label: "🤏", icon: "abbr" },
      { action: "year", label: "📅", icon: "year" },
      { action: "note", label: "💭", icon: "note" },
      { action: "list", label: "📃", icon: "list" },
      { action: "branch", label: "🌿", icon: "branch" },
      { action: "gramota", label: "Грамота", logo: "gramota" },
      { action: "google", label: "Google", logo: "google" },
      { action: "kinopoisk", label: "Кинопоиск", logo: "kinopoisk" },
    ],
    [{ action: "close", label: "❌", icon: "exit", system: true }],
  ];
  const drag = `<div class="toolbar-group" data-drag-group="true"><div class="toolbar-segment-group"><button class="button button-emoji toolbar-segment" data-drag-handle="true" type="button">${toolbar.icon(`<img class="toolbar-icon" src="${glyph.drag}" alt="">`)}</button></div></div>`;
  const html = `${drag}${buttons.map(row).join("")}`;
  const exists = document.getElementById(id);
  if (exists) {
    exists.remove();
    document.getElementById(`${id}-style`)?.remove();
    return;
  }
  document.getElementById(`${id}-style`)?.remove();
  const fullscreen = () =>
    document.body.classList.contains("onliner-reader-active");
  const appleTouch = () =>
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const panel = frame.create({ id, html, place: "right" });
  frame.mount(`${id}-style`, style);
  const editor = {
    punctMemory: new WeakMap(),
    punctLocalMemory: new WeakMap(),
    selectionMemory: new WeakMap(),
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
      if (!touch || !window.visualViewport) return false;
      const screen = toolbar.screen();
      const occluded = Math.max(
        0,
        window.innerHeight - (screen.height + screen.offsetTop),
      );
      const threshold = toolbar.phone() ? 120 : toolbar.tablet() ? 160 : 140;
      return occluded >= threshold;
    },
    place(panel) {
      const touch = toolbar.mobile() || appleTouch();
      const baseLayout = editor.layout();
      const layout = touch && !editor.fullscreen() ? "bottom" : baseLayout;
      const theme = toolbar.appearance.theme("content");
      const surface =
        layout === "fullscreen" || layout === "bottom" ? "toolbar" : "";
      toolbar.appearance.sync(panel, { layout, theme, surface });
      panel.dataset.iconMode = icon.mode.get("editor");
      panel.dataset.mobile = touch ? "true" : "false";
      if (!touch) panel.dataset.keyboardOpen = "false";
      panel.style.removeProperty("display");
      if (panel.dataset.manual === "true") return;
      if (layout === "bottom") return editor.placeBottom(panel);
      return editor.placeFloating(panel);
    },
    position(value) {
      return toolbar.state("editor-panel-position", value);
    },
    touchPosition(value) {
      return toolbar.state("editor-panel-position-touch", value);
    },
    touchBottom() {
      return "calc(env(safe-area-inset-bottom) + 60px)";
    },
    fit(panel) {
      const screen = toolbar.screen();
      const field = document.getElementById("content");
      const rect = field?.getBoundingClientRect();
      const viewportMax = Math.max(280, screen.width - 24);
      const fieldMax = rect ? Math.max(280, rect.width) : viewportMax;
      const maxWidth = Math.min(viewportMax, fieldMax);
      panel.style.setProperty("width", "fit-content", "important");
      panel.style.setProperty("max-width", "none", "important");
      const natural = Math.max(
        280,
        panel.scrollWidth || panel.offsetWidth || 0,
      );
      const width = Math.min(natural, maxWidth);
      const center = rect
        ? rect.left + rect.width / 2
        : screen.offsetLeft + screen.width / 2;
      const minLeft = screen.offsetLeft + 12;
      const maxLeft = screen.offsetLeft + screen.width - width - 12;
      const left = Math.min(maxLeft, Math.max(minLeft, center - width / 2));
      return { left, width, maxWidth, rect };
    },
    clampTouch(panel, left, top) {
      const screen = toolbar.screen();
      const width =
        panel.offsetWidth || panel.getBoundingClientRect().width || 0;
      const height =
        panel.offsetHeight || panel.getBoundingClientRect().height || 0;
      const minLeft = screen.offsetLeft + 12;
      const maxLeft =
        screen.offsetLeft + Math.max(12, screen.width - width - 12);
      const minTop = screen.offsetTop + 12;
      const maxTop =
        screen.offsetTop + Math.max(12, screen.height - height - 12);
      return {
        left: Math.min(maxLeft, Math.max(minLeft, left)),
        top: Math.min(maxTop, Math.max(minTop, top)),
      };
    },
    placeBottom(panel) {
      const fit = editor.fit(panel);
      if (!fit.rect) return editor.placeFloating(panel);
      const bottomGap = Math.max(12, window.innerHeight - fit.rect.bottom + 12);
      panel.style.setProperty("left", `${fit.left}px`, "important");
      panel.style.setProperty("right", "auto", "important");
      panel.style.setProperty("top", "auto", "important");
      panel.style.setProperty(
        "bottom",
        `calc(${bottomGap}px + env(safe-area-inset-bottom))`,
        "important",
      );
      panel.style.setProperty("width", `${fit.width}px`, "important");
      panel.style.setProperty("max-width", `${fit.maxWidth}px`, "important");
      panel.style.setProperty("transform", "none", "important");
    },
    placeFloating(panel) {
      const screen = toolbar.screen();
      const layout = editor.layout();
      const touch = toolbar.mobile() || appleTouch();
      panel.style.setProperty("right", "auto", "important");
      panel.style.setProperty("top", "auto", "important");
      if (layout === "fullscreen") {
        const fit = editor.fit(panel);
        if (touch) {
          const keyboard = editor.keyboardOpen(touch);
          panel.dataset.keyboardOpen = keyboard ? "true" : "false";
          if (keyboard) {
            panel.dataset.manual = "false";
            panel.style.setProperty("left", `${fit.left}px`, "important");
            panel.style.setProperty(
              "top",
              "calc(env(safe-area-inset-top) + 80px)",
              "important",
            );
            panel.style.setProperty("bottom", "auto", "important");
            panel.style.setProperty("width", `${fit.width}px`, "important");
            panel.style.setProperty(
              "max-width",
              `${fit.maxWidth}px`,
              "important",
            );
            panel.style.setProperty("transform", "none", "important");
            return;
          }
          if (panel.dataset.manual === "true") {
            const saved = editor.touchPosition();
            if (
              saved &&
              Number.isFinite(saved.left) &&
              Number.isFinite(saved.top)
            ) {
              const clamped = editor.clampTouch(panel, saved.left, saved.top);
              toolbar.appearance.floating(panel, clamped);
              panel.style.setProperty("bottom", "auto", "important");
              panel.style.setProperty("transform", "none", "important");
              return;
            }
          }
          panel.style.setProperty("left", `${fit.left}px`, "important");
          panel.style.setProperty("top", "auto", "important");
          panel.style.setProperty("bottom", editor.touchBottom(), "important");
          panel.style.setProperty("width", `${fit.width}px`, "important");
          panel.style.setProperty(
            "max-width",
            `${fit.maxWidth}px`,
            "important",
          );
          panel.style.setProperty("transform", "none", "important");
          return;
        }
        panel.dataset.keyboardOpen = "false";
        panel.style.setProperty("left", `${fit.left}px`, "important");
        panel.style.setProperty("top", "auto", "important");
        panel.style.setProperty("bottom", "60px", "important");
        panel.style.setProperty("width", `${fit.width}px`, "important");
        panel.style.setProperty("max-width", `${fit.maxWidth}px`, "important");
        panel.style.setProperty("transform", "none", "important");
        return;
      }
      panel.style.setProperty("left", `${screen.offsetLeft}px`, "important");
      panel.style.setProperty(
        "bottom",
        `calc(${Math.max(0, window.innerHeight - screen.height - screen.offsetTop)}px + env(safe-area-inset-bottom))`,
        "important",
      );
      panel.style.setProperty("width", `${screen.width}px`, "important");
      panel.style.setProperty("max-width", "100vw", "important");
      panel.style.setProperty("transform", "none", "important");
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
    emit(element) {
      ["input", "change"].forEach((type) =>
        element.dispatchEvent(new Event(type, { bubbles: true })),
      );
    },
    done(element) {
      editor.emit(element);
      if (!toolbar.mobile()) element.focus();
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
          if (!/^&(laquo|raquo|ldquo|rdquo|bdquo|quot|#171|#187|#8220|#8221|#8222|#34);/i.test(entity[0])) break;
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
      if (name === "em" && start === end && editor.emQuote(element)) return;
      if (start === end) {
        const data = editor.tag(value, start, name);
        if (data) {
          editor.unwrap(element, data, start);
          return;
        }
      }
      if (start !== end) {
        const range = editor.trim(value, start, end);
        if (editor.wrapped(value, range, name)) return;
      }
      editor.wrap(element, `<${name}>`, `</${name}>`);
      editor.flattenTag(element, name);
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
      element.selectionStart = start;
      element.selectionEnd = start;
      editor.done(element);
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
        element.selectionStart = start;
        element.selectionEnd = start;
        editor.done(element);
        return;
      }
      const mark =
        value.slice(dashAt).match(/^[ \u00a0]\u2014\s*/)?.[0] || " — ";
      element.value =
        value.slice(0, dashAt) + "," + value.slice(dashAt + mark.length);
      element.selectionStart = start;
      element.selectionEnd = start;
      editor.done(element);
      return;
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
    punctData() {
      const list = [
        { key: "dot", mark: ".", next: ". " },
        { key: "comma", mark: ",", next: ", " },
        { key: "colon", mark: ":", next: ": " },
        { key: "dash", next: "\u00a0— " },
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
      const value = element.value;
      const data = editor.punctData();
      const key = data.byMark[mark];
      if (!key) return;
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
      const next = data.list[(data.index[found.key] + 1) % data.list.length];
      let string =
        value.slice(0, found.at) +
        next.next +
        value.slice(found.at + found.raw.length);
      if (found.key === "dot" && next.key !== "dot")
        string = editor.punctCase(string, found.at + next.next.length, "lower");
      if (found.key !== "dot" && next.key === "dot")
        string = editor.punctCase(string, found.at + next.next.length, "upper");
      const block = editor.block(string, start, start);
      const cleaned =
        next.key === "dot"
          ? editor.punctTailMarkBlock(string, ".", block.end)
          : next.key === "colon"
            ? editor.punctTailMarkBlock(string, ":", block.end)
            : string;
      element.value = editor.punctTagGap(cleaned);
      element.selectionStart = start;
      element.selectionEnd = start;
      editor.done(element);
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
          const plain = body.replace(/<\/?[^>]+>/g, "");
          const lead = plain.match(/^\s*/)?.[0].length || 0;
          const cursor = data.start + lead;
          element.selectionStart = cursor;
          element.selectionEnd = cursor;
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
      const cursor = range.start + before.length;
      element.selectionStart = cursor;
      element.selectionEnd = cursor;
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
      const end = element.selectionEnd;
      const value = element.value;
      if (start !== end) return;
      const acute = "\u0301";
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
      element.selectionStart = start;
      element.selectionEnd = start;
      editor.done(element);
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
          forms: ["учитывая", "с учетом того что"],
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
        const postfix =
          lemma.endsWith("ся") ? "ся" : lemma.endsWith("сь") ? "сь" : "";
        const core = postfix ? lemma.slice(0, -postfix.length) : lemma;
        if (!core.endsWith("ть")) return null;
        const base = core.slice(0, -2);
        const act = model === "2" && base.endsWith("и") ? base.slice(0, -1) : base;
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
          Object.entries(data).map(([slot, form]) => [slot, `${form}${postfix}`]),
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
        const postfix =
          lower.endsWith("ся") ? "ся" : lower.endsWith("сь") ? "сь" : "";
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
      const field = document.getElementById("content");
      if (!field) return;
      if (window.tinyMCE && tinyMCE.get("content")) tinyMCE.triggerSave();
      const result = editor.branchArticle(field.value);
      if (result === field.value) return;
      field.value = result;
      editor.emit(field);
      if (
        window.tinyMCE &&
        tinyMCE.get("content") &&
        !tinyMCE.get("content").isHidden()
      )
        tinyMCE.get("content").setContent(result);
      editor.mark(panel, editor.state(field));
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
        { left: ["км"], right: ["километров", "километра", "километр"] },
        { left: ["га"], right: ["гектаров", "гектара", "гектар"] },
        {
          left: ["ст."],
          right: ["статьи", "статью", "статьей", "статье", "статья"],
        },
        { left: ["ч."], right: ["части", "частью", "часть"] },
        { left: ["п."], right: ["пункта", "пунктом", "пункт"] },
        { left: ["пп."], right: ["пунктов", "пунктами", "пункты"] },
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
          entry.left.includes(string) ||
          (() => {
            const right = Array.isArray(entry.right)
              ? entry.right
              : [entry.right];
            return right.some(
              (value) =>
                value === string ||
                (!value.endsWith(".") && `${value}.` === string),
            );
          })(),
      );
      if (!item) return null;
      const rightList = Array.isArray(item.right) ? item.right : [item.right];
      const chain = [...item.left, ...rightList];
      const current = chain.includes(string)
        ? string
        : rightList.find(
            (value) => !value.endsWith(".") && `${value}.` === string,
          ) || string;
      const index = chain.indexOf(current);
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
      const keepDot =
        !nextHasDot && hadDot && editor.abbrEnd(value, data.range.end);
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
    list(element) {
      const start = element.selectionStart;
      const value = element.value;
      const html = editor.listTag(value, start);
      if (html) {
        const string = value.slice(html.start, html.end);
        const semicolon =
          /<\/li>\s*<li/i.test(string) && /;\s*<\/li>/i.test(string);
        const mode = semicolon ? "." : ";";
        const next = string.replace(
          /<li(?:\s[^>]*)?>([\s\S]*?)<\/li>/gi,
          (_, item) => {
            const text = item
              .trim()
              .replace(/^((?:<[^>]+>\s*)*)(?:[-•●▪◦]|\d+\.)\s+/i, "$1")
              .replace(/[.;]\s*$/, "");
            const linked = /<a\b[\s\S]*<\/a>/i.test(text);
            const letter = linked
              ? editor.letterPlain(text, true)
              : editor.letter(text, mode === ".");
            const suffix = linked ? "" : mode;
            return `<li>${letter}${suffix}</li>`;
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
      const range =
        start === end
          ? source === "kinopoisk"
            ? editor.kinopoiskName(value, start)
            : editor.word(value, start)
          : { start, end };
      if (range.start === range.end) return;
      const string = value.slice(range.start, range.end).trim();
      if (!string) return;
      const query = encodeURIComponent(string);
      const exact = encodeURIComponent(`"${string}"`);
      const data = {
        google: `https://www.google.com/search?igu=1&q=${exact}`,
        gramota: `https://gramota.ru/poisk?query=${query}&mode=spravka`,
        kinopoisk: `https://www.kinopoisk.ru/index.php?kp_query=${query}`,
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
        number: Boolean(
          value.slice(0, start).match(/\d+$/) ||
          value.slice(start).match(/^\d+/),
        ),
        branch: Boolean(editor.wordCycleData(value, start, start)),
        list: Boolean(editor.listTag(value, start)),
        year: Boolean(editor.yearToken(value, start)),
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
      editor.placeFloating(panel);
    },
  };
  editor.controller = toolbar.creature({
    panel,
    ...toolbar.presets.fullscreen("content"),
    place: () => editor.place(panel),
    rescue: () => {
      if (toolbar.mobile()) return;
      editor.rescue(panel);
    },
    scroll: {
      canRun: () => {
        const layout = panel.dataset.layout;
        return layout === "fullscreen" || layout === "bottom";
      },
      wheel: (event) => {
        panel.scrollLeft += event.deltaY;
      },
      touch: true,
    },
    drag: {
      canStart(event) {
        const touch = toolbar.mobile() || appleTouch();
        if (touch) {
          const fullscreen = editor.fullscreen();
          const keyboard = panel.dataset.keyboardOpen === "true";
          if (!fullscreen || keyboard) return false;
        }
        return !(
          event.target.closest(".button") &&
          !event.target.closest("[data-drag-handle]")
        );
      },
      onEnd({ snapped } = {}) {
        if (panel.dataset.moved !== "true") return;
        const touch = toolbar.mobile() || appleTouch();
        if (
          touch &&
          editor.fullscreen() &&
          panel.dataset.keyboardOpen !== "true"
        ) {
          const left = parseFloat(panel.style.left);
          const top = parseFloat(panel.style.top);
          if (!Number.isFinite(left) || !Number.isFinite(top)) return;
          const clamped = editor.clampTouch(panel, left, top);
          toolbar.appearance.floating(panel, clamped);
          panel.style.setProperty("bottom", "auto", "important");
          panel.style.setProperty("transform", "none", "important");
          editor.touchPosition(clamped);
          return;
        }
        if (snapped) return;
        if (toolbar.behavior.outside(panel, 12)) {
          panel.dataset.manual = "false";
          editor.place(panel);
          return;
        }
        editor.position({
          left: parseFloat(panel.style.left),
          top: parseFloat(panel.style.top),
        });
      },
    },
    snap: {
      snap: 96,
      top: 96,
      bottom: 60,
      onSnapTop: (value) => editor.position(value),
      onSnapBottom: (value) => editor.position(value),
    },
  });
  editor.place(panel);
  panel.addEventListener("click", (event) => {
    if (!event.target.closest("[data-drag-handle]")) return;
    if (panel.dataset.moved === "true") {
      panel.dataset.moved = "false";
      return;
    }
    panel.dataset.manual = "false";
    editor.placeFloating(panel);
  });
  editor.rescue(panel);
  editor.controller.behavior.bind({ sync: false });
  if (window.visualViewport) {
    const refresh = () => {
      if (!editor.fullscreen()) return;
      editor.place(panel);
    };
    toolbar.listen(panel, window.visualViewport, "resize", refresh);
    toolbar.listen(panel, window.visualViewport, "scroll", refresh);
  }
  toolbar.listen(panel, document, "focusin", (event) => {
    if (!editor.fullscreen()) return;
    if (event.target?.id !== "content") return;
    setTimeout(() => editor.place(panel), 40);
  });
  toolbar.listen(panel, document, "focusout", (event) => {
    if (!editor.fullscreen()) return;
    if (event.target?.id !== "content") return;
    setTimeout(() => editor.place(panel), 40);
  });
  const action = {
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
  panel.addEventListener("mousedown", (event) => event.preventDefault());
  panel.addEventListener("pointerdown", (event) => {
    if (!event.target.closest("[data-action]")) return;
    if (event.pointerType === "touch") return;
    event.preventDefault();
  });
  panel.addEventListener(
    "touchstart",
    (event) => {
      if (!event.target.closest("[data-action]")) return;
      if (event.touches?.length > 1) event.preventDefault();
    },
    { passive: false },
  );
  panel.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const name = button.dataset.action;
    if (name === "close") {
      editor.controller?.behavior.destroy();
      editor.controller = null;
      panel.remove();
      document.getElementById(`${id}-style`)?.remove();
      return;
    }
    const run = action[name];
    if (typeof run !== "function") return;
    const element = editor.get();
    const current = editor.current();
    if (!element && !current) return;
    const target = element || current;
    editor.restoreSelection(target);
    editor.rememberSelection(target);
    editor.keep(target, () => run(target));
    if (toolbar.mobile()) {
      const focused = editor.current();
      if (focused) editor.mark(panel, editor.state(focused));
      if (!focused) panel.dataset.active = "";
    }
  });
  document.addEventListener("selectionchange", () => {
    const element = editor.current();
    if (!element) {
      panel.dataset.active = "";
      return;
    }
    editor.rememberSelection(element);
    editor.mark(panel, editor.state(element));
  });
})();
