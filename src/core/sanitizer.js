import { field as domField } from "./dom.js";

const caseify = {
  first(value) {
    const chars = Array.from(value);
    const leading = new Set([
      "\u00ab",
      "\u00bb",
      "\u201e",
      "\u201c",
      "\u0022",
      "\u2019",
      "'",
      "(",
      ")",
      "[",
      "]",
      "{",
      "}",
    ]);
    const index = chars.findIndex((char) => {
      if (!String(char || "").trim()) return false;
      return !leading.has(char);
    });
    if (index < 0) return value;
    const char = chars[index];
    const lower = char.toLocaleLowerCase("ru-RU");
    const upper = char.toLocaleUpperCase("ru-RU");
    if (lower === upper || char !== lower) return value;
    chars[index] = upper;
    return chars.join("");
  },
};

const typography = {
  unicode(value) {
    if (typeof value !== "string") return value;
    return value.normalize("NFC");
  },
  space(value) {
    return String(value || "")
      .replace(/\u00A0/g, "\u0020")
      .replace(/[\u0020\u0009]+/g, "\u0020")
      .replace(/^\s+/g, "");
  },
  softSpace(value) {
    return String(value || "")
      .replace(/[\u0020\u0009]+/g, "\u0020")
      .replace(/^\s+/g, "");
  },
  brand(value) {
    return String(value || "").replace(/\bOnliner\b/g, "Onl\u00edner");
  },
  apostrophe(value) {
    return String(value || "").replace(/([\p{L}])\u0027(?=[\p{L}])/gu, "$1\u2019");
  },
  dash(value) {
    const word = (value) =>
      String(value || "")
        .replace(/(\p{L})[\u2013\u2014]+(?=\p{L})/gu, "$1-")
        .replace(/(\p{L})-{2,}(?=\p{L})/gu, "$1-");
    const source = word(value);
    return source
      .replace(/(\d)[\u0020\u0009\u00a0]*[\u002d\u2013\u2014\u2212]+[\u0020\u0009\u00a0]*(?=\d)/g, "$1\u2014")
      .replace(/^[\u0020\u0009\u00a0]*[\u002d\u2013\u2014\u2212]+[\u0020\u0009\u00a0]*(?=\S)/gm, "\u2014\u0020")
      .replace(/(\S)[\u0020\u0009\u00a0]+[\u002d\u2013\u2014\u2212]+(?:[\u0020\u0009\u00a0]*[\u002d\u2013\u2014\u2212]+)*[\u0020\u0009\u00a0]+(?=\S)/g, "$1\u00a0\u2014\u0020");
  },
  quote(value, { finalize = false } = {}) {
    const source = String(value || "");
    const chars = Array.from(source);
    const stack = [];
    let last = -1;
    const result = chars.map((char, index) => {
      if (char === "\u00ab") {
        stack.push("outer");
        return char;
      }
      if (char === "\u201e") {
        stack.push("inner");
        return char;
      }
      if (char === "\u00bb") {
        stack.pop();
        return char;
      }
      if (char !== "\u0022" && char !== "\u201c" && char !== "\u201d") return char;
      const before = chars[index - 1] || "";
      const after = chars[index + 1] || "";
      const opens =
        (char === "\u201c" && stack[stack.length - 1] !== "inner") ||
        (char === "\u0022" &&
          (!before || /[\s([{—–,:;]/u.test(before)) &&
          !(!after || /[\s.,!?…:;)\]}»“”"]/u.test(after)));
      const closes = char === "\u201d" || !opens;
      last = index;
      if (opens && !closes) {
        const inner = stack.length > 0;
        stack.push(inner ? "inner" : "outer");
        return inner ? "\u201e" : "\u00ab";
      }
      const inner = stack.pop() === "inner";
      return inner ? "\u201c" : "\u00bb";
    });
    if (finalize && stack.length && last >= 0) result[last] = "";
    return result.join("");
  },
  quoteSpace(value) {
    return String(value || "")
      .replace(/([^\s([{])\u00ab/g, "$1 \u00ab")
      .replace(/\u00ab[\u0020\u0009\u00a0]+/g, "\u00ab")
      .replace(/[\u0020\u0009\u00a0]+\u00bb/g, "\u00bb");
  },
  trim(value) {
    return String(value || "").replace(/\s+$/g, "");
  },
  run(value, { trimEnd = false, uppercaseFirst = false, finalize = false } = {}) {
    const normalized = [
      typography.unicode,
      typography.space,
      typography.brand,
      typography.apostrophe,
      typography.dash,
      (string) => typography.quote(string, { finalize }),
      typography.quoteSpace,
      typography.softSpace,
    ].reduce((string, fn) => fn(string), value);
    const cased = uppercaseFirst ? caseify.first(normalized) : normalized;
    return trimEnd ? typography.trim(cased) : cased;
  },
};

const field = {
  resolve(element = null) {
    if (!element?.closest) return element;
    return (
      element.closest(
        "input:not([type]),input[type='text'],input[type='url'],textarea,[contenteditable='true']",
      ) || element
    );
  },
  editable(element = null) {
    const current = field.resolve(element);
    if (!current?.matches) return false;
    if (current.matches("[disabled],[readonly]")) return false;
    return current.matches(
      "input:not([type]),input[type='text'],input[type='url'],textarea,[contenteditable='true']",
    );
  },
  read(element = null) {
    const current = field.resolve(element);
    if (!current) return "";
    return current.isContentEditable
      ? String(current.innerText || "")
      : String(current.value || "");
  },
  write(element = null, value = "") {
    const current = field.resolve(element);
    if (!current) return false;
    if (current.isContentEditable) {
      current.textContent = value;
      return true;
    }
    return domField.set(current, value);
  },
  html(value, { trimEnd = false, uppercaseFirst = false, finalize = false } = {}) {
    const template = document.createElement("template");
    template.innerHTML = String(value || "");
    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const visible = nodes.filter((node) => String(node.nodeValue || "").trim());
    visible.forEach((node, index) => {
      node.nodeValue = typography.run(node.nodeValue, {
        trimEnd: trimEnd && index === visible.length - 1,
        uppercaseFirst: uppercaseFirst && index === 0,
        finalize: finalize && index === visible.length - 1,
      });
    });
    return template.innerHTML;
  },
  typography(value, { trimEnd = false, uppercaseFirst = false, finalize = false } = {}) {
    return typography.run(value, { trimEnd, uppercaseFirst, finalize });
  },
  normalize(value) {
    return field.typography(value, {
      trimEnd: true,
      uppercaseFirst: true,
      finalize: true,
    });
  },
  apply(element, { trimEnd = false, uppercaseFirst = false, finalize = false } = {}) {
    const current = field.resolve(element);
    if (!field.editable(current)) return null;
    const raw = field.read(current);
    const html = current.isContentEditable
      ? field.html(current.innerHTML, { trimEnd, uppercaseFirst, finalize })
      : null;
    const normalized = current.isContentEditable
      ? (() => {
          const template = document.createElement("template");
          template.innerHTML = html;
          return String(template.content.textContent || "");
        })()
      : field.typography(raw, { trimEnd, uppercaseFirst, finalize });
    if (normalized === raw) return null;
    const start = current.isContentEditable ? null : current.selectionStart;
    const end = current.isContentEditable ? null : current.selectionEnd;
    const delta = normalized.length - raw.length;
    if (current.isContentEditable) current.innerHTML = html;
    else field.write(current, normalized);
    if (Number.isInteger(start)) {
      const from = Math.max(0, Math.min(normalized.length, start + delta));
      const to = Number.isInteger(end)
        ? Math.max(0, Math.min(normalized.length, end + delta))
        : from;
      current.setSelectionRange?.(from, to);
    }
    return {
      element: current,
      before: raw,
      after: normalized,
    };
  },
  change(element, options = {}) {
    return Boolean(field.apply(element, options));
  },
  bind(
    root = document,
    {
      allow = () => true,
      trimEnd = false,
      uppercaseFirst = false,
      live = true,
      focus = false,
      commit = null,
      reset = null,
    } = {},
  ) {
    const capture = (element, options = {}) => {
      const current = field.resolve(element);
      if (!field.editable(current)) return null;
      if (!allow(current)) return null;
      const snapshot = field.apply(current, {
        trimEnd:
          options.trimEnd === undefined ? trimEnd : Boolean(options.trimEnd),
        uppercaseFirst:
          options.uppercaseFirst === undefined
            ? uppercaseFirst
            : Boolean(options.uppercaseFirst),
        finalize:
          options.finalize === undefined ? false : Boolean(options.finalize),
      });
      if (!snapshot) return null;
      return {
        element,
        before: snapshot.before,
        after: snapshot.after,
        restore: snapshot.before,
        changed: snapshot.before !== snapshot.after,
      };
    };
    const focusin = (event) => {
      const current = field.resolve(event.target);
      if (!focus) return;
      if (!field.editable(current)) return;
      if (!allow(current)) return;
      if (typeof reset === "function") reset(current, { reason: "focus" });
    };
    const input = (event) => {
      const current = field.resolve(event.target);
      if (event.isComposing) return;
      if (!field.editable(current)) return;
      if (!allow(current)) return;
      if (typeof reset === "function") reset(current, { reason: "input" });
      if (!live) return;
      capture(current);
    };
    const focusout = (event) => {
      const current = field.resolve(event.target);
      if (typeof reset === "function" && reset(current, { reason: "blur" }) === "skip") return;
      const item = capture(current, { trimEnd: true, finalize: true });
      if (!item) return;
      if (!item.changed) return;
      if (typeof commit === "function") commit(item.element, item.before, item.after, item);
    };
    root.addEventListener("focusin", focusin, true);
    root.addEventListener("input", input, true);
    root.addEventListener("focusout", focusout, true);
    return () => {
      root.removeEventListener("focusin", focusin, true);
      root.removeEventListener("input", input, true);
      root.removeEventListener("focusout", focusout, true);
    };
  },
};

export const sanitizer = {
  field,
};
