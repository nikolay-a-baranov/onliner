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
    return String(value || "")
      .replace(/(\d)[\u0020\u0009\u00a0]*[\u002d\u2013\u2014\u2212]+[\u0020\u0009\u00a0]*(?=\d)/g, "$1\u2014")
      .replace(/(^|[^\d\s])[\u0020\u0009\u00a0]*[\u002d\u2013\u2014\u2212]+(?:[\u0020\u0009\u00a0]*[\u002d\u2013\u2014\u2212]+)*[\u0020\u0009\u00a0]*(?=\S)/g, (match, before) => before ? `${before}\u00a0\u2014\u0020` : "\u2014\u0020");
  },
  quote(value, { finalize = false } = {}) {
    const source = String(value || "");
    const chars = Array.from(source);
    const quotes = new Set([
      "\u0022",
      "\u00ab",
      "\u00bb",
      "\u201c",
      "\u201d",
      "\u201e",
    ]);
    let open = false;
    let last = -1;
    const result = chars.map((char, index) => {
      if (!quotes.has(char)) return char;
      open = !open;
      last = index;
      return open ? "\u00ab" : "\u00bb";
    });
    if (finalize && open && last >= 0) result[last] = "";
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
  editable(element = null) {
    if (!element?.matches) return false;
    if (element.matches("[disabled],[readonly]")) return false;
    return element.matches(
      "input:not([type]),input[type='text'],input[type='url'],textarea",
    );
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
    if (!field.editable(element)) return null;
    const raw = String(element.value || "");
    const normalized = field.typography(raw, { trimEnd, uppercaseFirst, finalize });
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
      if (!field.editable(element)) return null;
      if (!allow(element)) return null;
      const snapshot = field.apply(element, {
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
      if (!focus) return;
      if (!field.editable(event.target)) return;
      if (!allow(event.target)) return;
      if (typeof reset === "function") reset(event.target, { reason: "focus" });
    };
    const input = (event) => {
      if (event.isComposing) return;
      if (!field.editable(event.target)) return;
      if (!allow(event.target)) return;
      if (typeof reset === "function") reset(event.target, { reason: "input" });
      if (!live) return;
      capture(event.target);
    };
    const blur = (event) => {
      if (typeof reset === "function" && reset(event.target, { reason: "blur" }) === "skip") return;
      const item = capture(event.target, { trimEnd: true, finalize: true });
      if (!item) return;
      if (!item.changed) return;
      if (typeof commit === "function") commit(item.element, item.before, item.after, item);
    };
    root.addEventListener("focusin", focusin, true);
    root.addEventListener("input", input, true);
    root.addEventListener("blur", blur, true);
    return () => {
      root.removeEventListener("focusin", focusin, true);
      root.removeEventListener("input", input, true);
      root.removeEventListener("blur", blur, true);
    };
  },
};

export const sanitizer = {
  field,
};
