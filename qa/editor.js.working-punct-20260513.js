import { frame } from "./core/panel.js";
import { toolbar } from "./core/toolbar.js";
import { emoji } from "./core/emoji.js";
import { css } from "./core/css.js";

(() => {
  const id = "editor-panel";
  const style = css.editor.text();
  const fluent = (name) =>
    `https://raw.githubusercontent.com/microsoft/fluentui-system-icons/main/assets/${name}/SVG/ic_fluent_${name.toLowerCase().replaceAll(" ", "_")}_24_regular.svg`;
  const icon = {
    drag: fluent("Drag"),
    nbsp: fluent("Spacebar"),
    em: fluent("Text Italic"),
    strong: fluent("Text Bold"),
    killem: fluent("Eraser"),
    quote: fluent("Comment Quote"),
    comma: fluent("Comma"),
    dash: fluent("Line Horizontal 1"),
    colon: fluent("More Vertical"),
    punct: fluent("Arrow Sync"),
    accent: fluent("Gavel"),
    home: fluent("Arrow Bounce"),
    left: fluent("Chevron Left"),
    right: fluent("Chevron Right"),
    letter: fluent("Text Font Size"),
    number: fluent("Number Symbol"),
    symbol: fluent("Symbols"),
    math: fluent("Math Symbols"),
    abbr: fluent("Arrow Autofit Width Dotted"),
    note: fluent("Note"),
    list: fluent("Apps List"),
  };
  const logo = {
    google: "https://www.google.com/favicon.ico",
    gramota: "https://gramota.ru/favicon.ico",
    kinopoisk: "https://www.kinopoisk.ru/favicon.ico",
  };
  const button = (item) => {
    const label = item.logo
      ? `<img class="toolbar-logo" src="${logo[item.logo]}" alt="">`
      : item.icon
        ? `<img class="toolbar-icon" src="${icon[item.icon]}" alt="">`
        : emoji.html(item.label);
    return `<button class="button button-text" data-action="${item.action}">${label}</button>`;
  };
  const row = (items) => `<div data-row>${items.map(button).join("")}</div>`;
  const buttons = [
    [
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
      { action: "note", label: "💭", icon: "note" },
      { action: "list", label: "📃", icon: "list" },
      { action: "gramota", label: "Грамота", logo: "gramota" },
      { action: "google", label: "Google", logo: "google" },
      { action: "kinopoisk", label: "Кинопоиск", logo: "kinopoisk" },
      { action: "keyboard", label: "⌨️", system: true },
    ],
    [{ action: "close", label: "❌", system: true }],
  ];
  const html = `<button class="button button-text" data-drag-handle="true" type="button"><img class="toolbar-icon" src="${icon.drag}" alt=""></button><span data-drag-separator="true"></span>${buttons.map(row).join("")}`;
  const exists = document.getElementById(id);
  if (exists) {
    exists.remove();
    document.getElementById(`${id}-style`)?.remove();
    return;
  }
  document.getElementById(`${id}-style`)?.remove();
  const fullscreen = () =>
    document.body.classList.contains("onliner-reader-active");
  const panel = frame.create({ id, html, place: "right" });
  frame.mount(`${id}-style`, style);
  const editor = {
    punctMemory: new WeakMap(),
    punctLocalMemory: new WeakMap(),
    fullscreen() {
      return fullscreen();
    },
    layout() {
      return toolbar.layout({ fullscreen: editor.fullscreen() });
    },
    place(panel) {
      const layout = editor.layout();
      const theme = toolbar.theme("content");
      const surface = layout === "fullscreen" ? "toolbar" : "";
      toolbar.sync(panel, { layout, theme, surface });
      panel.dataset.mobile = toolbar.mobile() ? "true" : "false";
      if (panel.dataset.manual === "true") return;
      if (layout === "side" || layout === "tablet")
        return editor.placeSide(panel);
      return editor.placeFloating(panel);
    },
    position(value) {
      return toolbar.state("editor-panel-position", value);
    },
    drag(panel) {
      toolbar.drag({
        panel,
        canStart: (event) => {
          if (toolbar.mobile()) return false;
          return !(
            event.target.closest(".button") &&
            !event.target.closest("[data-drag-handle]")
          );
        },
        onEnd: () => {
          if (panel.dataset.moved !== "true") return;
          if (
            toolbar.snap({
              panel,
              snap: 96,
              top: 96,
              bottom: 60,
              onSnapTop: (value) => editor.position(value),
              onSnapBottom: (value) => editor.position(value),
            })
          )
            return;
          if (toolbar.outside(panel, 12)) {
            panel.dataset.manual = "false";
            editor.place(panel);
            return;
          }
          editor.position({
            left: parseFloat(panel.style.left),
            top: parseFloat(panel.style.top),
          });
        },
      });
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
    placeFloating(panel) {
      const screen = toolbar.screen();
      const layout = editor.layout();
      panel.dataset.inside = "false";
      panel.style.setProperty("right", "auto", "important");
      panel.style.setProperty("top", "auto", "important");
      if (layout === "fullscreen") {
        const visible = screen.height;
        const base = Math.max(
          Number(panel.dataset.viewportBase || 0),
          visible,
          window.innerHeight,
          document.documentElement.clientHeight,
        );
        panel.dataset.viewportBase = String(base);
        const focused = document.activeElement?.id === "content";
        const keyboard = Math.max(0, base - visible);
        const inset =
          toolbar.mobile() && focused ? Math.max(keyboard, 140) : keyboard;
        const bottom = toolbar.mobile()
          ? `calc(${inset}px + env(safe-area-inset-bottom) + 12px)`
          : "60px";
        if (toolbar.mobile()) panel.dataset.manual = "false";
        panel.style.setProperty("left", "50%", "important");
        panel.style.setProperty("top", "auto", "important");
        panel.style.setProperty("bottom", bottom, "important");
        panel.style.setProperty("width", "fit-content", "important");
        panel.style.setProperty("transform", "translateX(-50%)", "important");
        return;
      }
      delete panel.dataset.viewportBase;
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
    keyboard() {
      const field = document.getElementById("content");
      if (!field) return;
      if (document.activeElement === field) field.blur();
      if (document.activeElement !== field) field.focus();
      editor.place(panel);
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
      const start = element.selectionStart;
      const end = element.selectionEnd;
      if (start !== end) {
        run();
        return;
      }
      const value = element.value;
      const anchor = editor.anchor(value, start);
      run();
      const next = editor.locate(element.value, anchor);
      if (next === null || next === undefined) return;
      element.selectionStart = next;
      element.selectionEnd = next;
      element.focus();
      editor.mark(panel, editor.state(element));
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
      const range = editor.word(value, start);
      if (range.start === range.end) {
        const cut = value[start] === " " || value[start] === "\u00a0" ? 1 : 0;
        return value.slice(0, start) + token + value.slice(start + cut);
      }
      if (start === range.start) {
        const hasGap =
          range.start > 0 &&
          (value[range.start - 1] === " " ||
            value[range.start - 1] === "\u00a0");
        const pivot = hasGap ? range.start - 1 : range.start;
        const cut = hasGap ? 1 : 0;
        return value.slice(0, pivot) + token + value.slice(pivot + cut);
      }
      const pivot = range.end;
      const cut = value[pivot] === " " || value[pivot] === "\u00a0" ? 1 : 0;
      return value.slice(0, pivot) + token + value.slice(pivot + cut);
    },
    punctSimple(element, mark) {
      const start = element.selectionStart;
      const value = element.value;
      const local = editor.punctLocalSimple(value, start, mark);
      const next =
        local === null ? editor.punctInsertSimple(value, start, mark) : local;
      element.value = next;
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
      if (local !== null) {
        element.value = local;
        element.selectionStart = start;
        element.selectionEnd = start;
        editor.punctMemory.delete(element);
        editor.punctLocalMemory.delete(element);
        editor.done(element);
        return;
      }
      const found = editor.punctForward(value, start);
      if (!found) return;
      const next = data.list[(data.index[found.key] + 1) % data.list.length];
      let string =
        value.slice(0, found.at) +
        next.next +
        value.slice(found.at + found.raw.length);
      if (found.key !== "dot" && next.key === "dot")
        string = editor.punctCase(string, found.at + next.next.length, "upper");
      element.value = string;
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
      element.value = string;
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
      return editor.quote(range, value);
    },
    quote(range, value) {
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
      const list = groups.map((group, index) => {
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
        .map(
          (group, index) =>
            data.value.slice(group.absEnd, list[index + 1].absStart) || " ",
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
        if (index < groups.length - 1) parts.push(data.between[index] || " ");
        ranges.push({
          group,
          start,
          end: parts.join("").length,
        });
      });
      parts.push(data.tail || "");
      return {
        text: parts.join(""),
        ranges,
      };
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
      const range = editor.sentence(value, start);
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
      editor.apply(
        element,
        (selection, size) => editor.shift(selection, step, size),
        step < 0 ? { beforeComma: true } : { afterComma: true },
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
      editor.placeFloating(panel);
    },
  };
  editor.drag(panel);
  editor.place(panel);
  panel.addEventListener("click", (event) => {
    if (!event.target.closest("[data-drag-handle]")) return;
    panel.dataset.manual = "false";
    editor.placeFloating(panel);
  });
  editor.rescue(panel);
  toolbar.observe({
    panel,
    layout: () => editor.layout(),
    place: () => editor.place(panel),
    rescue: () => {
      if (toolbar.mobile()) return;
      editor.rescue(panel);
    },
    theme: () => toolbar.theme("content"),
    wheel: (event) => {
      panel.scrollLeft += event.deltaY;
    },
  });
  if (window.visualViewport) {
    const refresh = () => {
      if (!editor.fullscreen()) return;
      editor.place(panel);
    };
    window.visualViewport.addEventListener("resize", refresh);
    window.visualViewport.addEventListener("scroll", refresh);
  }
  document.addEventListener("focusin", (event) => {
    if (!editor.fullscreen()) return;
    if (event.target?.id !== "content") return;
    setTimeout(() => editor.place(panel), 40);
  });
  document.addEventListener("focusout", (event) => {
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
    keyboard: () => editor.keyboard(),
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
    if (name === "keyboard") {
      action[name]();
      return;
    }
    const run = action[name];
    if (typeof run !== "function") return;
    const element = editor.get();
    if (!element) return;
    editor.keep(element, () => run(element));
  });
  document.addEventListener("selectionchange", () => {
    const element = editor.get();
    if (!element) return;
    editor.mark(panel, editor.state(element));
  });
})();
