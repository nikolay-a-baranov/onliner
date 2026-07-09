import { block } from "../core/block.js";
import { cms } from "../core/cms.js";
import { field } from "../core/dom.js";

const current = {
  element: null,
  bound: false,
};
const state = {
  undo: new WeakMap(),
  collapse: new WeakMap(),
};
const pattern = {
  word: /[А-Яа-яA-Za-zЁё0-9]/,
  space: /[ \t\u00A0]/,
  newline: /[\r\n]/,
  opening: /[(\[{«"']/,
  closing: /[)\]},.;:!?%»"']/,
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
        return block.layout.insert(state.value, range, content, caretOffset);
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
  erase: {
    char: {
      word(value = "") {
        return pattern.word.test(String(value || ""));
      },
      space(value = "") {
        return pattern.space.test(String(value || ""));
      },
      newline(value = "") {
        return pattern.newline.test(String(value || ""));
      },
      opening(value = "") {
        return pattern.opening.test(String(value || ""));
      },
      closing(value = "") {
        return pattern.closing.test(String(value || ""));
      },
      trailing(value = "") {
        return /[),.;:!?%»"'\]-]/.test(String(value || ""));
      },
    },
    skip: {
      leftSpace(value = "", start = 0) {
        let index = start;
        while (index > 0 && api.erase.char.space(value[index - 1])) index -= 1;
        return index;
      },
      rightSpace(value = "", start = 0) {
        let index = start;
        while (index < value.length && api.erase.char.space(value[index])) {
          index += 1;
        }
        return index;
      },
    },
    range: {
      word(value = "", start = 0) {
        let left = start;
        let right = start;
        while (left > 0 && api.erase.char.word(value[left - 1])) left -= 1;
        while (right < value.length && api.erase.char.word(value[right])) {
          right += 1;
        }
        if (left === right) return null;
        return { start: left, end: right };
      },
      previous(value = "", start = 0) {
        const right = api.erase.skip.leftSpace(value, start);
        let left = right;
        while (left > 0 && api.erase.char.trailing(value[left - 1])) left -= 1;
        while (left > 0 && api.erase.char.word(value[left - 1])) left -= 1;
        if (left === right) return null;
        return { start: left, end: start };
      },
      target(value = "", start = 0, end = start) {
        if (start !== end) return { start, end };
        const current = api.erase.range.word(value, start);
        const atStart =
          api.erase.char.word(value[start]) &&
          !api.erase.char.word(value[start - 1]);
        if (atStart) return api.erase.range.previous(value, start);
        if (current) return current;
        return api.erase.range.previous(value, start);
      },
      normalize(value = "", range = null) {
        if (!range) return null;
        const start = api.erase.skip.leftSpace(value, range.start);
        const end = api.erase.skip.rightSpace(value, range.end);
        const left = value[start - 1] || "";
        const right = value[end] || "";
        const gap = api.erase.join(left, right) ? " " : "";
        const next = value.slice(0, start) + gap + value.slice(end);
        const caret = start + gap.length;
        if (next === value) return null;
        return {
          value: next,
          start: caret,
          end: caret,
        };
      },
    },
    join(left = "", right = "") {
      if (!left || !right) return false;
      if (api.erase.char.newline(left) || api.erase.char.newline(right)) {
        return false;
      }
      if (api.erase.char.opening(left)) return false;
      if (api.erase.char.closing(right)) return false;
      if (api.erase.char.word(left) || api.erase.char.word(right)) return true;
      return false;
    },
    word: {
      backState(state = {}) {
        const value = String(state.value || "");
        const start = Number.isInteger(state.start) ? state.start : 0;
        const end = Number.isInteger(state.end) ? state.end : start;
        const range = api.erase.range.target(value, start, end);
        return api.erase.range.normalize(value, range);
      },
      back(element) {
        if (!element) return false;
        const result = api.erase.word.backState({
          value: element.value || "",
          start: element.selectionStart || 0,
          end: element.selectionEnd || 0,
        });
        if (!result) return false;
        api.set(element, result.value);
        return api.doneData(element, result);
      },
    },
  },
  cursor: {
    state(element) {
      return state.collapse.get(element) || null;
    },
    direction(data = null) {
      return data?.side === "end" ? "start" : "end";
    },
    write(element, start, end, side) {
      state.collapse.set(element, { start, end, side });
      const caret = side === "start" ? start : end;
      return api.done(element, caret, caret);
    },
    collapse(element) {
      if (!element) return false;
      const start = element.selectionStart || 0;
      const end = element.selectionEnd || start;
      if (start !== end) {
        const data = api.cursor.state(element);
        const same = data?.start === start && data?.end === end;
        const side = same ? api.cursor.direction(data) : "end";
        return api.cursor.write(element, start, end, side);
      }
      const data = api.cursor.state(element);
      if (!data) return false;
      if (start !== data.start && start !== data.end) return false;
      return api.cursor.write(element, data.start, data.end, api.cursor.direction(data));
    },
  },
  undo: {
    size: 30,
    data(element) {
      const current = state.undo.get(element);
      if (current) return current;
      const next = { steps: [] };
      state.undo.set(element, next);
      return next;
    },
    snapshot(element) {
      if (!api.current.valid(element)) return null;
      return {
        value: String(element.value || ""),
        start: element.selectionStart || 0,
        end: element.selectionEnd || 0,
      };
    },
    same(left = null, right = null) {
      if (!left || !right) return false;
      return (
        left.value === right.value &&
        left.start === right.start &&
        left.end === right.end
      );
    },
    push(element, snapshot = null) {
      if (!element || !snapshot) return false;
      const data = api.undo.data(element);
      const last = data.steps[data.steps.length - 1] || null;
      if (api.undo.same(last, snapshot)) return false;
      data.steps.push(snapshot);
      if (data.steps.length > api.undo.size) data.steps.shift();
      return true;
    },
    capture(element) {
      return api.undo.snapshot(element);
    },
    commit(element, before = null) {
      const after = api.undo.snapshot(element);
      if (!before || !after) return false;
      if (api.undo.same(before, after)) return false;
      return api.undo.push(element, before);
    },
    run(element) {
      if (!element) return false;
      const data = api.undo.data(element);
      const snapshot = data.steps.pop();
      if (!snapshot) return false;
      api.set(element, snapshot.value);
      return api.done(element, snapshot.start, snapshot.end);
    },
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
      "editor.separator": Boolean(
        api.markup?.separatorData?.nearby(value, start),
      ),
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
