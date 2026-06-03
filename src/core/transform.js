const string = (value) => String(value ?? "");
const trimFrame = (value = "") => {
  const source = string(value);
  const lead = source.match(/^\s*/)?.[0] || "";
  const trail = source.match(/\s*$/)?.[0] || "";
  return {
    lead,
    trail,
    body: source.slice(lead.length, source.length - trail.length),
  };
};
const replace = (value, range, next, start, end, extra = {}) => ({
  value: string(value).slice(0, range.start) + next + string(value).slice(range.end),
  start,
  end,
  ...extra,
});
const unwrap = (value = "", tag = "") => {
  const match = string(value).match(new RegExp(`^<${tag}>([\\s\\S]*)</${tag}>$`, "i"));
  return match ? match[1] : null;
};
const emphasisState = (value = "") => {
  const source = string(value);
  if (/^<strong><em>[\s\S]*<\/em><\/strong>$/i.test(source)) return "combo";
  if (/^<em><strong>[\s\S]*<\/strong><\/em>$/i.test(source)) return "combo-alt";
  if (/^<strong>[\s\S]*<\/strong>$/i.test(source)) return "strong";
  if (/^<em>[\s\S]*<\/em>$/i.test(source)) return "em";
  return "plain";
};
const emphasisInner = (value = "") => {
  const current = emphasisState(value);
  if (current === "strong") return unwrap(value, "strong");
  if (current === "em") return unwrap(value, "em");
  if (current === "combo") {
    const outer = unwrap(value, "strong");
    return outer === null ? null : unwrap(outer, "em");
  }
  if (current === "combo-alt") {
    const outer = unwrap(value, "em");
    return outer === null ? null : unwrap(outer, "strong");
  }
  return string(value);
};
const selection = (value, start, end) => {
  const source = string(value);
  if (start !== end) return { start, end, text: source.slice(start, end) };
  return transform.scope.block(source, start, end);
};
const emphasisRange = (value, start, end) => {
  const source = string(value);
  const range = selection(source, start, end);
  if (!range) return null;
  let from = range.start;
  let to = range.end;
  let changed = true;
  while (changed) {
    changed = false;
    const left = source.slice(0, from);
    const right = source.slice(to);
    [
      { open: "<strong>", close: "</strong>" },
      { open: "<em>", close: "</em>" },
    ].forEach((item) => {
      if (!left.endsWith(item.open)) return;
      if (!right.startsWith(item.close)) return;
      from -= item.open.length;
      to += item.close.length;
      changed = true;
    });
  }
  return {
    start: from,
    end: to,
    text: source.slice(from, to),
  };
};

export const transform = {
  scope: {
    block(value, start, end = start) {
      const source = string(value);
      const before = source.slice(0, start);
      const after = source.slice(start);
      const left = before.lastIndexOf("\n");
      const right = after.indexOf("\n");
      const from = left >= 0 ? left + 1 : 0;
      const to = right >= 0 ? start + right : source.length;
      return {
        start: from,
        end: to,
        text: source.slice(from, to),
      };
    },
    trim(value = "") {
      return trimFrame(value);
    },
  },
  heading(value, { start = 0, end = start } = {}) {
    const range = transform.scope.block(value, start, end);
    if (!range) return null;
    const part = trimFrame(range.text);
    if (!part.body) return null;
    const current = /^<h2\b[^>]*>[\s\S]*<\/h2>$/i.test(part.body)
      ? "h2"
      : /^<h3\b[^>]*>[\s\S]*<\/h3>$/i.test(part.body)
        ? "h3"
        : "plain";
    const body = string(part.body)
      .replace(/^<h[23]\b[^>]*>/i, "")
      .replace(/<\/h[23]>$/i, "")
      .replace(/<\/?(?:strong|em)>/gi, "");
    const next =
      current === "plain"
        ? `<h2>${body}</h2>`
        : current === "h2"
          ? `<h3>${body}</h3>`
          : body;
    const text = `${part.lead}${next}${part.trail}`;
    const caret = range.start + text.length;
    return replace(value, range, text, caret, caret);
  },
  emphasis(value, { start = 0, end = start } = {}) {
    const range = emphasisRange(value, start, end);
    if (!range) return null;
    const part = trimFrame(range.text);
    if (!part.body) return null;
    const current = emphasisState(part.body);
    const inner = emphasisInner(part.body);
    if (inner === null) return null;
    const next =
      current === "plain"
        ? `<strong>${part.body}</strong>`
        : current === "strong"
          ? `<em>${inner}</em>`
          : current === "em"
            ? `<strong><em>${inner}</em></strong>`
            : inner;
    const text = `${part.lead}${next}${part.trail}`;
    const from =
      current === "plain"
        ? range.start + part.lead.length + "<strong>".length
        : current === "strong"
          ? range.start + part.lead.length + "<em>".length
          : current === "em"
            ? range.start + part.lead.length + "<strong><em>".length
            : range.start + part.lead.length;
    const to =
      current === "combo" || current === "combo-alt"
        ? from
        : from + string(inner ?? part.body).length;
    return replace(value, range, text, from, to, {
      collapse: current === "combo" || current === "combo-alt",
    });
  },
  quote(value, { start = 0, end = start } = {}) {
    const range = selection(value, start, end);
    if (!range) return null;
    const part = trimFrame(range.text);
    if (!part.body) return null;
    const inner = unwrap(part.body, "blockquote");
    const next = inner === null ? `<blockquote>${part.body}</blockquote>` : inner;
    const text = `${part.lead}${next}${part.trail}`;
    const from = range.start + part.lead.length;
    return replace(value, range, text, from, from + next.length);
  },
  cleanup(value, { start = 0 } = {}) {
    const next = string(value)
      .replace(/&nbsp;|&#160;|\u00a0/gi, " ")
      .replace(/<p>(?:\s| )*<\/p>\s*/gi, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/[ \t]+$/gm, "")
      .replace(/\n{3,}/g, "\n\n");
    const caret = Math.min(start, next.length);
    return {
      value: next,
      start: caret,
      end: caret,
    };
  },
};
