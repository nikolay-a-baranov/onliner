import { block } from "../core/block.js";
import { cms } from "../core/cms.js";
import { field } from "../core/dom.js";

const current = {
  element: null,
  bound: false,
};

export const createShared = (api) => ({
  editor: {
    mode() {
      return cms.editor.getMode();
    },
    visual() {
      return api.editor.mode() === "tmce";
    },
    textarea() {
      const element = document.getElementById("content");
      if (!element) return null;
      if (element.tagName !== "TEXTAREA" && element.tagName !== "INPUT") {
        return null;
      }
      return element;
    },
    tiny() {
      const current =
        window.tinyMCE?.get?.("content") || window.tinyMCE?.activeEditor || null;
      if (!current) return null;
      if (typeof current.isHidden === "function" && current.isHidden()) {
        return null;
      }
      return current;
    },
    textState() {
      const element = api.editor.textarea();
      if (!element) return null;
      const start = element.selectionStart || 0;
      const end = element.selectionEnd || start;
      return {
        element,
        editor: null,
        visual: false,
        value: element.value || "",
        start,
        end,
      };
    },
    visualState() {
      const element = api.editor.sync();
      const editor = api.editor.tiny();
      if (!element || !editor) return null;
      return {
        element,
        editor,
        visual: true,
        value: element.value || "",
        start: 0,
        end: 0,
      };
    },
    capture() {
      if (api.editor.visual()) return api.editor.visualState();
      return api.editor.textState();
    },
    write(state = {}) {
      const element = state.element || api.editor.textarea();
      if (!element || typeof state.value !== "string") return false;
      const value = state.value;
      const changed = element.value !== value;
      const focus = state.focus !== false;
      field.set(element, value);
      if (Number.isInteger(state.start)) {
        api.select(element, state.start, state.end);
      }
      if (changed) api.emit(element);
      if (state.visual) {
        const editor = state.editor || api.editor.tiny();
        if (!editor) return changed;
        editor.setContent(value);
        if (focus) editor.focus?.();
        editor.save?.();
        return true;
      }
      if (focus) element.focus?.();
      return changed;
    },
    visualDocument(run) {
      const element = api.editor.sync();
      if (!element || typeof run !== "function") return false;
      cms.editor.html();
      let changed = false;
      try {
        const source = element.value || "";
        const result = run({ value: source, start: 0, end: 0 });
        if (result && typeof result.value === "string" && result.value !== source) {
          field.set(element, result.value);
          api.emit(element);
          changed = true;
        }
      } finally {
        setTimeout(() => cms.editor.tmce({ click: true }), 0);
      }
      return changed;
    },
    document(run, options = {}) {
      if (api.editor.visual()) return api.editor.visualDocument(run);
      const state = api.editor.textState();
      if (!state || typeof run !== "function") return false;
      const result = run({
        value: state.value,
        start: state.start,
        end: state.end,
      });
      if (!result || typeof result.value !== "string") return false;
      return api.editor.write({
        ...state,
        value: result.value,
        start: Number.isInteger(result.start) ? result.start : state.start,
        end: Number.isInteger(result.end) ? result.end : result.start,
        focus: options.focus,
      });
    },
    change(run, options = {}) {
      return api.editor.document(run, options);
    },
    blockNode() {
      const editor = api.editor.tiny();
      const node = editor?.selection?.getNode?.() || null;
      if (!node || !editor?.dom?.getParent) return null;
      return editor.dom.getParent(
        node,
        "p,div,li,blockquote,h1,h2,h3,h4,h5,h6",
      );
    },
    blockMode(node = api.editor.blockNode()) {
      const tag = String(node?.tagName || "").toLowerCase();
      if (tag === "h2" || tag === "h3" || tag === "blockquote") return tag;
      return "plain";
    },
    replaceBlock(node, tag = "p") {
      const editor = api.editor.tiny();
      const doc = editor?.getDoc?.() || null;
      if (!node || !doc || !node.parentNode) return null;
      const next = doc.createElement(tag === "plain" ? "p" : tag);
      next.innerHTML = node.innerHTML;
      node.parentNode.replaceChild(next, node);
      api.editor.caretEnd(next);
      editor.focus?.();
      editor.save?.();
      return next;
    },
    selectBlock(node) {
      const editor = api.editor.tiny();
      const doc = editor?.getDoc?.() || null;
      if (!node || !doc || !editor?.selection?.setRng) return false;
      const range = doc.createRange();
      range.selectNodeContents(node);
      editor.selection.setRng(range);
      return true;
    },
    caretEnd(node) {
      const editor = api.editor.tiny();
      const doc = editor?.getDoc?.() || null;
      if (!node || !doc || !editor?.selection?.setRng) return false;
      const range = doc.createRange();
      range.selectNodeContents(node);
      range.collapse(false);
      editor.selection.setRng(range);
      return true;
    },
    insertTarget(node = api.editor.blockNode()) {
      const editor = api.editor.tiny();
      const body = editor?.getBody?.() || null;
      if (!node || !body) return node;
      let current = node;
      while (current.parentNode && current.parentNode !== body) {
        current = current.parentNode;
      }
      return current;
    },
    replaceSelection(html = "") {
      const editor = api.editor.tiny();
      const doc = editor?.getDoc?.() || null;
      const range = editor?.selection?.getRng?.() || null;
      if (!editor || !doc || !range || !html) return false;
      const template = doc.createElement("div");
      template.innerHTML = html;
      const nodes = [...template.childNodes];
      if (!nodes.length) return false;
      const fragment = doc.createDocumentFragment();
      nodes.forEach((node) => fragment.appendChild(node));
      range.deleteContents();
      range.insertNode(fragment);
      const next = doc.createRange();
      next.setStartBefore(nodes[0]);
      next.setEndAfter(nodes[nodes.length - 1]);
      editor.selection.setRng(next);
      editor.focus?.();
      editor.save?.();
      return true;
    },
    insertAfterBlock(content = "") {
      const editor = api.editor.tiny();
      const node = api.editor.insertTarget();
      const doc = editor?.getDoc?.() || null;
      if (!editor || !node || !doc || !node.parentNode || !content) return false;
      const template = doc.createElement("div");
      template.innerHTML = String(content);
      const nodes = [...template.childNodes];
      if (!nodes.length) return false;
      const next = node.nextSibling;
      nodes.forEach((item) => node.parentNode.insertBefore(item, next));
      const range = doc.createRange();
      range.setStartAfter(nodes[nodes.length - 1]);
      range.collapse(true);
      editor.selection?.setRng?.(range);
      editor.focus?.();
      editor.save?.();
      return true;
    },
    range(value = "", start = 0, end = start) {
      return api.block(String(value || ""), start, end);
    },
    insert(content = "", caretOffset = null) {
      if (!content) return false;
      if (api.editor.visual()) return api.editor.insertAfterBlock(content);
      return api.editor.document((state) => {
        const range = api.editor.range(state.value, state.start, state.end);
        if (!range) return null;
        const source = state.value;
        const left = source.slice(0, range.end).replace(/[ \t]+$/g, "");
        const rightSource = source.slice(range.end);
        const rightTrimmed = rightSource.replace(/^[ \t]+/g, "");
        const right = rightTrimmed && !/^\n\n/.test(rightTrimmed)
          ? rightTrimmed.replace(/^\n+/g, "")
          : rightTrimmed;
        const beforeGap = left ? (/\n\n$/.test(left) ? "" : "\n\n") : "";
        const afterGap = "\n\n";
        const value = `${left}${beforeGap}${content}${afterGap}${right}`;
        const start = left.length + beforeGap.length;
        const caret = typeof caretOffset === "number"
          ? start + caretOffset
          : start + content.length;
        return {
          value,
          start: caret,
          end: caret,
        };
      });
    },
    sync() {
      return cms.editor.syncToTextarea();
    },
    commit() {
      cms.editor.syncFromTextarea();
      return true;
    },
  },
  current: {
    selector() {
      return [
        "input:not([type])",
        "input[type='text']",
        "input[type='url']",
        "input[type='search']",
        "input[type='email']",
        "input[type='tel']",
        "textarea",
      ].join(",");
    },
    valid(element) {
      if (!element?.matches) return false;
      if (element.matches("[disabled],[readonly]")) return false;
      if (!element.matches(api.current.selector())) return false;
      if (typeof element.value !== "string") return false;
      if (typeof element.selectionStart !== "number") return false;
      if (typeof element.selectionEnd !== "number") return false;
      return true;
    },
    set(element) {
      if (!api.current.valid(element)) return null;
      current.element = element;
      return current.element;
    },
    live() {
      return api.current.set(document.activeElement);
    },
    saved() {
      if (!api.current.valid(current.element)) {
        current.element = null;
      }
      return current.element;
    },
    bind() {
      if (current.bound) return;
      const sync = (event) => api.current.set(event.target);
      document.addEventListener("focusin", sync, true);
      document.addEventListener("input", sync, true);
      document.addEventListener("keyup", sync, true);
      document.addEventListener("mouseup", sync, true);
      document.addEventListener("selectionchange", () => {
        api.current.live();
      });
      current.bound = true;
    },
    element() {
      api.current.bind();
      return api.current.live() || api.current.saved();
    },
  },
  element() {
    if (api.editor.visual()) return null;
    return api.current.element() || api.editor.textarea();
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
    return api.editor.change(run);
  },
  insert(value, caretOffset = null) {
    if (api.editor.visual()) return api.editor.insert(value, caretOffset);
    const element = api.element();
    if (!element) return false;
    return block.insert(element, value, caretOffset);
  },
  emit(element) {
    field.emit(element);
  },
  set(element, value) {
    return field.set(element, value);
  },
  select(element, start, end = start) {
    if (!element) return false;
    const size = element.value.length;
    const from = Math.max(0, Math.min(start, size));
    const to = Number.isInteger(end)
      ? Math.max(0, Math.min(end, size))
      : from;
    element.selectionStart = from;
    element.selectionEnd = to;
    return { start: from, end: to };
  },
  done(element, start = null, end = start) {
    if (!element) return false;
    field.set(element, element.value);
    if (Number.isInteger(start)) api.select(element, start, end);
    api.emit(element);
    element.focus?.();
    return true;
  },
  doneData(element, data = {}) {
    return api.done(element, data.start ?? data.caret, data.end);
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
    field.set(element, value.slice(0, start) + string + value.slice(end));
    return api.done(element, start + string.length);
  },
});
