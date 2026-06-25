import { text } from "../pipe/text.js";
import { field as domField } from "./dom.js";

const field = {
  editable(element = null) {
    if (!element?.matches) return false;
    if (element.matches("[disabled],[readonly]")) return false;
    return element.matches(
      "input:not([type]),input[type='text'],input[type='url'],textarea",
    );
  },
  typography(value, { trimEnd = false, uppercaseFirst = false } = {}) {
    const source = String(value || "").replace(/\u00A0/g, "\u0020");
    let outer = false;
    let inner = false;
    let result = "";
    const ahead = {
      outerClose(index) {
        const rest = source.slice(index + 1);
        const close = rest.indexOf("\u00bb");
        const open = rest.indexOf("\u00ab");
        return close >= 0 && (open < 0 || close < open);
      },
    };
    Array.from(source).forEach((char, index) => {
      if (char === "\u00ab") {
        if (inner) {
          inner = false;
          result += "\u201c";
          return;
        }
        if (outer) {
          outer = false;
          result += "\u00bb";
          return;
        }
        outer = true;
        result += char;
        return;
      }
      if (char === "\u00bb") {
        outer = false;
        inner = false;
        result += char;
        return;
      }
      if (char === "\u201e") {
        if (inner) {
          inner = false;
          result += "\u201c";
          return;
        }
        inner = true;
        result += char;
        return;
      }
      if (char === "\u201c") {
        inner = false;
        result += char;
        return;
      }
      if (char !== "\u0022") {
        result += char;
        return;
      }
      if (inner) {
        inner = false;
        result += "\u201c";
        return;
      }
      if (outer && ahead.outerClose(index)) {
        inner = true;
        result += "\u201e";
        return;
      }
      if (outer) {
        outer = false;
        result += "\u00bb";
        return;
      }
      outer = true;
      result += "\u00ab";
    });
    const normalized = result
      .replace(/\bOnliner\b/g, "Onlíner")
      .replace(/\u0027/g, "\u2019")
      .replace(/[\u0020\u0009\u00a0]*[\u002d\u2013\u2014\u2212][\u0020\u0009\u00a0]*/g, "\u00a0\u2014\u0020")
      .replace(/([^\s([{])\u00ab/g, "$1 \u00ab")
      .replace(/\u00ab[\u0020\u0009\u00a0]+/g, "\u00ab")
      .replace(/[\u0020\u0009\u00a0]+\u00bb/g, "\u00bb")
      .replace(/[\u0020\u0009]+/g, "\u0020")
      .replace(/^\s+/g, "");
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
    const cased = uppercaseFirst ? caseify.first(normalized) : normalized;
    return trimEnd ? cased.replace(/\s+$/g, "") : cased;
  },
  normalize(value) {
    return text.nbsp(field.typography(value, { trimEnd: true, uppercaseFirst: true }));
  },
  applySnapshot(element, { trimEnd = false, uppercaseFirst = false } = {}) {
    if (!field.editable(element)) return null;
    const raw = String(element.value || "");
    const normalized = field.typography(raw, { trimEnd, uppercaseFirst });
    if (normalized === raw) return null;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const delta = normalized.length - raw.length;
    domField.set(element, normalized);
    if (Number.isInteger(start)) {
      const from = Math.max(0, Math.min(normalized.length, start + delta));
      const to = Number.isInteger(end)
        ? Math.max(0, Math.min(normalized.length, end + delta))
        : from;
      element.setSelectionRange?.(from, to);
    }
    return {
      element,
      before: raw,
      after: normalized,
    };
  },
  apply(element, options = {}) {
    return Boolean(field.applySnapshot(element, options));
  },
  bind(
    root = document,
    {
      allow = () => true,
      trimEnd = false,
      uppercaseFirst = false,
      commit = null,
      reset = null,
    } = {},
  ) {
    const capture = (element, options = {}) => {
      if (!field.editable(element)) return null;
      if (!allow(element)) return null;
      const snapshot = field.applySnapshot(element, {
        trimEnd:
          options.trimEnd === undefined ? trimEnd : Boolean(options.trimEnd),
        uppercaseFirst:
          options.uppercaseFirst === undefined
            ? uppercaseFirst
            : Boolean(options.uppercaseFirst),
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
    const input = (event) => {
      if (event.isComposing) return;
      if (!field.editable(event.target)) return;
      if (!allow(event.target)) return;
      if (typeof reset === "function") reset(event.target, { reason: "input" });
    };
    const blur = (event) => {
      const item = capture(event.target, { trimEnd: true });
      if (!item) return;
      if (!item.changed) return;
      if (typeof commit === "function") commit(item.element, item.before, item.after, item);
    };
    root.addEventListener("input", input, true);
    root.addEventListener("blur", blur, true);
    return () => {
      root.removeEventListener("input", input, true);
      root.removeEventListener("blur", blur, true);
    };
  },
};

export const sanitizer = {
  field,
};
