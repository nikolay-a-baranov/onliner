import { entity } from "./escape.js";

const widgetTag = {
  promo: "onliner-promo-widget",
  vote: "onliner-vote",
  list: ["onliner-promo-widget", "onliner-vote"],
};
const marker = {
  full: ["title", "text", "label", "variants", "item\\d*", "description", "meta"],
  readable: ["title", "text", "label", "variants", "item\\d*", "description"],
};
const form = {
  promo: {
    editable: ["title", "text", "label"],
    marker: {
      title: "@title",
      text: "@text",
      label: "@label",
      meta: "@meta",
    },
  },
  vote: {
    editable: ["variants"],
    variantEditable: ["title", "description"],
    marker: {
      variants: "@variants",
      item: "@item",
      title: "@title",
      description: "@description",
      meta: "@meta",
    },
  },
};
const widgetSource = {
  tagGroup: widgetTag.list.join("|"),
  markerGroup(items) {
    return items.join("|");
  },
};
const pattern = {
  block: {
    any: `\\[(${widgetSource.tagGroup})([^\\]]*)\\]([\\s\\S]*?)\\[\\/\\1\\]`,
    plain: `\\[(${widgetSource.tagGroup})\\]([\\s\\S]*?)\\[\\/\\1\\]`,
    byTag(tag) {
      return `\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`;
    },
  },
  marker: {
    full: `@(?:${widgetSource.markerGroup(marker.full)})\\b`,
    readable: `@(?:${widgetSource.markerGroup(marker.readable)})\\b`,
    fullLine: `^\\s*@(${widgetSource.markerGroup(marker.full)})\\s*$`,
    readableLine: `^\\s*@(${widgetSource.markerGroup(marker.readable)})\\s*$`,
  },
};
const regex = {
  block: {
    any: new RegExp(pattern.block.any, "gi"),
    plain: new RegExp(pattern.block.plain, "gi"),
    byTag(tag, flags = "g") {
      return new RegExp(pattern.block.byTag(tag), flags);
    },
  },
  marker: {
    full: new RegExp(pattern.marker.full, "i"),
    readable: new RegExp(pattern.marker.readable, "i"),
    fullLine: new RegExp(pattern.marker.fullLine, "i"),
    readableLine: new RegExp(pattern.marker.readableLine, "i"),
  },
};
const block = {
  jsonBody(string) {
    return /^\s*\{[\s\S]*\}\s*$/.test(String(string || ""));
  },
  stringify(tag, data) {
    return `[${tag}]${JSON.stringify(data)}[/${tag}]`;
  },
  each(string, tag, fn) {
    return String(string || "").replace(
      regex.block.byTag(tag),
      (full, body) => fn(full, body),
    );
  },
  mapJson(string, tag, fn) {
    return block.each(string, tag, (full, raw) => {
      try {
        const data = JSON.parse(raw);
        return fn(full, data);
      } catch {
        return fn(full, null);
      }
    });
  },
};
const normalize = {
  inline(string) {
    return String(string || "").replace(/<\/?(b|i)\b[^>]*>/gi, (tag, name) => {
      const next = name.toLowerCase() === "b" ? "strong" : "em";
      return tag[1] === "/" ? `</${next}>` : `<${next}>`;
    });
  },
};
const schema = {
  "onliner-promo-widget": {
    visit(data, fn) {
      if (typeof data.text === "string") {
        data.text = fn(data.text);
      }
    },
  },
  "onliner-vote": {
    visit(data, fn) {
      data.variants?.forEach((item) => {
        if (typeof item?.description === "string") {
          item.description = fn(item.description);
        }
      });
    },
  },
};
const map = (string, fn) =>
  Object.entries(schema).reduce(
    (result, [tag, { visit }]) =>
      result.replace(
        new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`, "g"),
        (full, raw) => {
          try {
            const data = JSON.parse(raw);
            visit(data, fn);
            return block.stringify(tag, data);
          } catch {
            return full;
          }
        },
      ),
    string,
  );
const read = {
  json(value) {
    if (!value) return {};
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  },
  marker(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  },
  markers(body, markers) {
    const keys = Object.keys(markers || {});
    if (!keys.length) return {};
    const stop = `(?:${keys.map((key) => read.marker(markers[key])).join("|")})`;
    const pick = (key) => {
      const mark = read.marker(markers[key]);
      const pattern = new RegExp(
        `(^|\\n)\\s*${mark}\\s*\\n([\\s\\S]*?)(?=\\n\\s*${stop}\\s*\\n|$)`,
        "i",
      );
      const match = String(body || "").match(pattern);
      return match ? match[2].trim() : null;
    };
    return keys.reduce((data, key) => {
      const value = pick(key);
      if (value === null) return data;
      data[key] = value;
      return data;
    }, {});
  },
  vote(body, marker) {
    const lines = String(body || "").replace(/\r\n?/g, "\n").split("\n");
    const data = {
      meta: {},
      chunks: [],
    };
    let current = null;
    let mode = null;
    const push = () => {
      if (current) data.chunks.push(current);
      current = null;
      mode = null;
    };
    lines.forEach((line) => {
      const value = line.trim();
      const item = value.match(/^@item(?:\s*(\d+))?/i);
      if (item) {
        push();
        current = {
          index: item[1] ? Number(item[1]) - 1 : data.chunks.length,
          meta: {},
          title: "",
          description: "",
        };
        return;
      }
      if (new RegExp(`^${read.marker(marker.meta)}$`, "i").test(value)) {
        mode = "meta";
        return;
      }
      if (new RegExp(`^${read.marker(marker.title)}$`, "i").test(value)) {
        mode = "title";
        return;
      }
      if (new RegExp(`^${read.marker(marker.description)}$`, "i").test(value)) {
        mode = "description";
        return;
      }
      if (new RegExp(`^${read.marker(marker.variants)}\\b`, "i").test(value)) {
        return;
      }
      if (mode === "meta") {
        if (current) current.meta = read.json(line);
        else data.meta = read.json(line);
        mode = null;
        return;
      }
      if (!current) return;
      if (mode === "title") {
        current.title += (current.title ? "\n" : "") + line;
      }
      if (mode === "description") {
        current.description += (current.description ? "\n" : "") + line;
      }
    });
    push();
    return data;
  },
  raw(string) {
    return entity.decode(string).replace(/\\"/g, '"').replace(/\\'/g, "'");
  },
  normalized(string) {
    return normalize.inline(read.raw(string));
  },
};
const widgetFrame = (value, editable) => {
  const data = value || {};
  return Object.keys(data).map((key) => {
    if (editable.includes(key)) return { key };
    return { key, value: data[key] };
  });
};
const restore = (base, frame, patch) => {
  const source = base || {};
  const data = Array.isArray(frame) ? frame : [];
  const change = patch || {};
  if (Object.keys(source).length) {
    const next = {};
    Object.keys(source).forEach((key) => {
      next[key] = key in change ? change[key] : source[key];
    });
    data.forEach((item) => {
      if (!item || !item.key || item.key in next) return;
      next[item.key] = item.key in change ? change[item.key] : item.value;
    });
    Object.keys(change).forEach((key) => {
      if (key in next) return;
      next[key] = change[key];
    });
    return next;
  }
  const next = {};
  data.forEach((item) => {
    if (!item || !item.key) return;
    next[item.key] = item.key in change ? change[item.key] : item.value;
  });
  Object.keys(change).forEach((key) => {
    if (key in next) return;
    next[key] = change[key];
  });
  return next;
};
const format = {
  readable(value) {
    return String(value || "")
      .replace(/\r\n?/g, "\n")
      .replace(/<br\b[^>]*>/gi, "\n\n")
      .replace(/([^>\n])<p\b/gi, "$1\n\n<p")
      .replace(/<p\b[^>]*>\s*<\/p>/gi, "\n\n")
      .replace(/<\/p>\s*<p\b[^>]*>/gi, "\n\n")
      .replace(/<p\b[^>]*>/gi, "")
      .replace(/<\/p>/gi, "")
      .replace(/<\/?(ul|ol)\b[^>]*>/gi, "\n$&\n")
      .replace(/<\/li>\s*<li\b[^>]*>/gi, "</li>\n\t<li>")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  },
  widget(value) {
    const source = String(value || "").replace(/\r\n?/g, "\n").trim();
    if (!source) return "";
    const block = {
      has(value) {
        return /<(?:p|ul|ol|li|blockquote|table|thead|tbody|tr|td|th|figure|figcaption|h[1-6])\b/i.test(
          value,
        );
      },
      tag(value) {
        return /<\/?[a-z][^>]*>/i.test(value);
      },
      native(value) {
        return /^(?:<ul\b|<ol\b|<li\b|<blockquote\b|<img\b|<dl\b|<table\b|<thead\b|<tbody\b|<tr\b|<td\b|<th\b|<figure\b|<figcaption\b)/i.test(
          value,
        );
      },
      paragraph(value) {
        return `<p>${value.replace(/\n+/g, " ").trim()}</p>`;
      },
      mixed(value) {
        if (!block.tag(value)) return block.paragraph(value);
        if (block.native(value)) return value;
        if (!block.has(value) && /^<\w/i.test(value)) return block.paragraph(value);
        if (/^<\w/i.test(value)) return value;
        const match = value.match(/^([\s\S]*?)(<[\s\S]+)$/);
        if (!match) return value;
        const head = match[1].replace(/\n+/g, " ").trim();
        const tail = match[2].trim();
        return head ? `${block.paragraph(head)}${tail}` : tail;
      },
    };
    const normalized = block.has(source) ? source : source.replace(/\n+/g, "\n\n");
    return normalized
      .split(/\n{2,}/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map(block.mixed)
      .join("");
  },
};
const readable = (string) => {
  if (!string) return false;
  return (
    new RegExp(pattern.block.plain, "i").test(string) &&
    regex.marker.full.test(string)
  );
};
const decode = {
  raw(string, fn = (value) => value) {
    return map(string, (value) => fn(read.raw(value)));
  },
  normalized(string, fn = (value) => value) {
    return map(string, (value) => fn(read.normalized(value)));
  },
  run(string, fn = (value) => value, options = {}) {
    return options.normalizeInline === false
      ? decode.raw(string, fn)
      : decode.normalized(string, fn);
  },
};
const encode = (string) => map(string, entity.encode);
const ensure = (string) =>
  map(string, (value) =>
    entity.encoded(value) ? value : entity.encode(value),
  );
const transform = {
  raw(string, fn) {
    return map(string, (value) => entity.encode(fn(read.raw(value))));
  },
  normalized(string, fn) {
    return map(string, (value) => entity.encode(fn(read.normalized(value))));
  },
  run(string, fn, options = {}) {
    return options.normalizeInline === false
      ? transform.raw(string, fn)
      : transform.normalized(string, fn);
  },
};
const encoded = (string) => {
  let found = false;
  map(string, (value) => {
    if (entity.encoded(value)) found = true;
    return value;
  });
  return found;
};
const widget = {
  tag: widgetTag,
  form,
  marker,
  source: widgetSource,
  pattern,
  regex,
  block,
  readable,
  read,
  decode,
  encode,
  ensure,
  transform,
  toggle(string, fn) {
    return this.encoded(string)
      ? this.decode.run(string, fn)
      : this.encode(string);
  },
  encoded,
  frame: widgetFrame,
  restore,
  text: format,
};

export { widget };
