import { transform } from "./transform.js";
import { embed as embedCore } from "./embed.js";
import { more } from "./more.js";
import { block } from "./block.js";
import { edit } from "./edit.js";

export const actions = {
  element() {
    const element = document.getElementById("content");
    if (!element) return null;
    if (element.tagName !== "TEXTAREA" && element.tagName !== "INPUT")
      return null;
    return element;
  },
  block(value, start, end) {
    const left = value.lastIndexOf("\n", start - 1) + 1;
    const right = value.indexOf("\n", end);
    return {
      start: left,
      end: right < 0 ? value.length : right,
    };
  },
  insideTag(value, start, tag) {
    const left = value.slice(0, start);
    const open = left.lastIndexOf(`<${tag}>`);
    const close = left.lastIndexOf(`</${tag}>`);
    return open > close;
  },
  around(value, start, pattern) {
    return (
      pattern.test(value[start - 1] || "") || pattern.test(value[start] || "")
    );
  },
  state() {
    const element = actions.element();
    if (!element) return {};
    const start = element.selectionStart || 0;
    const end = element.selectionEnd || start;
    const value = element.value || "";
    const block = actions.block(value, start, end);
    const text = value.slice(block.start, block.end);
    const note =
      !/<\/em>\([^()]+?\. — Прим\. [^()]+\)<em>/i.test(text) &&
      /\(([^()]+?)(?:\s+—|,)\s+прим\.\s+([^()]+)\)/i.test(text);
    return {
      "editor.nbsp": value[start - 1] === "\u00a0" || value[start] === "\u00a0",
      "editor.em": actions.insideTag(value, start, "em"),
      "editor.strong": actions.insideTag(value, start, "strong"),
      "editor.comma": actions.around(value, start, /,/),
      "editor.colon": actions.around(value, start, /:/),
      "editor.dash": actions.around(value, start, /\u2014/),
      "editor.punct": actions.around(value, start, /[,.:\u2014!?…;]/),
      "editor.quote": actions.around(value, start, /[«»„“”"]/),
      "editor.note": note,
      "editor.list": /<\/?(?:ul|ol|li)\b/i.test(text),
      "editor.year": Boolean(
        value.slice(0, start).match(/\d{4}$/) ||
        value.slice(start).match(/^\d{4}/),
      ),
      "editor.number": Boolean(
        value.slice(0, start).match(/\d+$/) || value.slice(start).match(/^\d+/),
      ),
    };
  },
  active(id) {
    return Boolean(actions.state()[String(id || "")]);
  },
  apply(run) {
    const element = actions.element();
    if (!element) return false;
    return edit.apply(element, run);
  },
  insert(value, caretOffset = null) {
    const element = actions.element();
    if (!element) return false;
    return block.insert(element, value, caretOffset);
  },
  embed() {
    return navigator.clipboard
      .readText()
      .then((value) => {
        const element = actions.element();
        const shortcode = embedCore.build(value);
        if (!element || !shortcode) return false;
        return block.insert(element, shortcode);
      })
      .catch(() => false);
  },
  has(id) {
    const value = String(id || "");
    return value.startsWith("author.") || value.startsWith("editor.");
  },
  run(id) {
    if (id === "author.heading") {
      return actions.apply((value) =>
        transform.heading(value.value, {
          start: value.start,
          end: value.end,
        }),
      );
    }
    if (id === "author.emphasis") {
      return actions.apply((value) =>
        transform.emphasis(value.value, {
          start: value.start,
          end: value.end,
        }),
      );
    }
    if (id === "author.quote") {
      return actions.apply((value) =>
        transform.quote(value.value, {
          start: value.start,
          end: value.end,
        }),
      );
    }
    if (id === "author.more") {
      const element = actions.element();
      if (!element) return false;
      return more.run(element);
    }
    if (id === "author.embed") {
      actions.embed();
      return true;
    }
    if (id === "author.photo") return actions.insert("ФОТО ", 5);
    if (id === "author.video") return actions.insert("[video][/video]", 7);
    if (id === "author.cleanup") {
      return actions.apply((value) =>
        transform.cleanup(value.value, {
          start: value.start,
          end: value.end,
        }),
      );
    }
    return false;
  },
};
