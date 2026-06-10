import { embed as embedCore } from "../embed.js";
import { block } from "../block.js";
import { edit } from "../edit.js";

export const createShared = (api) => ({
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
    const element = api.element();
    if (!element) return {};
    const start = element.selectionStart || 0;
    const end = element.selectionEnd || start;
    const value = element.value || "";
    const block = api.block(value, start, end);
    const text = value.slice(block.start, block.end);
    const note =
      !/<\/em>\([^()]+?\. — Прим\. [^()]+\)<em>/i.test(text) &&
      /\(([^()]+?)(?:\s+—|,)\s+прим\.\s+([^()]+)\)/i.test(text);
    return {
      "editor.nbsp": value[start - 1] === "\u00a0" || value[start] === "\u00a0",
      "editor.em": api.insideTag(value, start, "em"),
      "editor.strong": api.insideTag(value, start, "strong"),
      "editor.comma": api.around(value, start, /,/),
      "editor.colon": api.around(value, start, /:/),
      "editor.dash": api.around(value, start, /\u2014/),
      "editor.punct": api.around(value, start, /[,.:\u2014!?…;]/),
      "editor.quote": Boolean(api.quoted(value, start)),
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
    return Boolean(api.state()[String(id || "")]);
  },
  apply(run) {
    const element = api.element();
    if (!element) return false;
    return edit.apply(element, run);
  },
  insert(value, caretOffset = null) {
    const element = api.element();
    if (!element) return false;
    return block.insert(element, value, caretOffset);
  },
  embed() {
    return navigator.clipboard
      .readText()
      .then((value) => {
        const element = api.element();
        const shortcode = embedCore.build(value);
        if (!element || !shortcode) return false;
        return block.insert(element, shortcode);
      })
      .catch(() => false);
  },

  emit(element) {
    if (!element) return;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  },
  done(element, start = null, end = start) {
    if (!element) return false;
    if (Number.isInteger(start)) {
      const size = element.value.length;
      const from = Math.max(0, Math.min(start, size));
      const to = Number.isInteger(end)
        ? Math.max(0, Math.min(end, size))
        : from;
      element.selectionStart = from;
      element.selectionEnd = to;
    }
    api.emit(element);
    element.focus?.();
    return true;
  },
  word(value, start) {
    const before = value.slice(0, start).match(/[А-Яа-яA-Za-zЁё0-9]+$/);
    const after = value.slice(start).match(/^[А-Яа-яA-Za-zЁё0-9]+/);
    return {
      start: before ? start - before[0].length : start,
      end: start + (after ? after[0].length : 0),
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
  range(value, start, end) {
    if (start !== end) return api.trim(value, start, end);
    const block = api.block(value, start, end);
    return api.inside(value, block.start, block.end);
  },
  item(value, start, end) {
    if (start !== end) return api.trim(value, start, end);
    return api.word(value, start);
  },
  replace(element, string) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    element.value = value.slice(0, start) + string + value.slice(end);
    return api.done(element, start + string.length);
  },
});
