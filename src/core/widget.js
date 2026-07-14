import { entity } from "./escape.js";
import { text } from "../pipe/text.js";

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
      if (typeof data.title === "string") {
        data.title = fn(data.title);
      }
      if (typeof data.text === "string") {
        data.text = fn(data.text);
      }
      if (typeof data.label === "string") {
        data.label = fn(data.label);
      }
    },
  },
  "onliner-vote": {
    visit(data, fn) {
      data.variants?.forEach((item) => {
        if (typeof item?.title === "string") {
          item.title = fn(item.title);
        }
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
const html = {
  guard(string, fn = (value) => value) {
    const parts = [];
    const put = (part) => {
      const key = `___WHT${parts.length}___`;
      parts.push(part);
      return key;
    };
    const restore = (value) =>
      String(value || "").replace(/___WHT(\d+)___/g, (_, index) => parts[+index]);
    const protectedText = String(string || "").replace(/<[^>]*>/g, put);
    return restore(fn(protectedText));
  },
};
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
const widgetMode = {
  parse(value) {
    if (!value) return {};
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  },
  append(rows, meta, marker) {
    if (!Object.keys(meta).length) return rows;
    rows.push(marker, JSON.stringify(meta), "");
    return rows;
  },
  field: {
    start(tag) {
      return [`[${tag}]`, ""];
    },
    finish(rows, tag) {
      rows.push(`[/${tag}]`);
      return rows.join("\n");
    },
    push(rows, marker, value, transform = (item) => item) {
      const current = value || "";
      if (!current.trim()) return rows;
      rows.push(marker, transform(current), "");
      return rows;
    },
  },
  patch: {
    from(base, meta, patch) {
      return restore(base, meta, patch);
    },
    text(patch, data, key) {
      if (data[key] === undefined) return patch;
      patch[key] = entity.decode(format.widget(data[key]));
      return patch;
    },
    value(patch, data, key) {
      if (data[key] === undefined) return patch;
      patch[key] = data[key];
      return patch;
    },
  },
  cycle(entry) {
    entry.show = (string) => {
      entry.cache = [];
      return block.mapJson(string, entry.tag, (full, data) => {
        if (!data) {
          entry.cache.push({});
          return full;
        }
        entry.cache.push(data || {});
        return entry.wrap(data);
      });
    };
    entry.hide = (string) => {
      let index = 0;
      return block.each(string, entry.tag, (full, body) => {
        if (block.jsonBody(body)) return full;
        const data = entry.unwrap(body, index);
        index += 1;
        return block.stringify(entry.tag, data);
      });
    };
    return entry;
  },
  promo() {
    const promo = widgetMode.cycle({
      tag: widgetTag.promo,
      cache: [],
      editable: form.promo.editable,
      marker: form.promo.marker,
      wrap(data = {}) {
        const rows = widgetMode.field.start(promo.tag);
        widgetMode.append(rows, widgetFrame(data, promo.editable), promo.marker.meta);
        widgetMode.field.push(rows, promo.marker.title, data.title || "");
        widgetMode.field.push(
          rows,
          promo.marker.text,
          data.text || "",
          format.readable,
        );
        widgetMode.field.push(rows, promo.marker.label, data.label || "");
        return widgetMode.field.finish(rows, promo.tag);
      },
      unwrap(body, index) {
        const base = promo.cache[index] || {};
        const data = read.markers(body, promo.marker);
        const patch = {};
        widgetMode.patch.value(patch, data, "title");
        widgetMode.patch.text(patch, data, "text");
        widgetMode.patch.value(patch, data, "label");
        return widgetMode.patch.from(base, widgetMode.parse(data.meta), patch);
      },
    });
    return promo;
  },
  vote() {
    const vote = widgetMode.cycle({
      tag: widgetTag.vote,
      cache: [],
      editable: form.vote.editable,
      variantEditable: form.vote.variantEditable,
      marker: form.vote.marker,
      wrap(data = {}) {
        const rows = widgetMode.field.start(vote.tag);
        const variants = data.variants || [];
        widgetMode.append(rows, widgetFrame(data, vote.editable), vote.marker.meta);
        rows.push(vote.marker.variants, "");
        variants.forEach((item, index) => {
          const current = item || {};
          const title = (current.title || "").trim();
          const description = (current.description || "").trim();
          const meta = widgetFrame(current, vote.variantEditable);
          if (!title && !description && !Object.keys(meta).length) return;
          rows.push(`${vote.marker.item}${index + 1}`, "");
          widgetMode.append(rows, meta, vote.marker.meta);
          widgetMode.field.push(rows, vote.marker.title, title);
          widgetMode.field.push(
            rows,
            vote.marker.description,
            description,
            format.readable,
          );
        });
        return widgetMode.field.finish(rows, vote.tag);
      },
      unwrap(body, index) {
        const base = vote.cache[index] || {};
        const data = read.vote(body, vote.marker);
        const next = restore(base, data.meta, {});
        const variants = Array.isArray(base.variants)
          ? base.variants.map((variant) => ({ ...variant }))
          : [];
        data.chunks
          .slice()
          .sort((left, right) => left.index - right.index)
          .forEach((chunk) => {
            if (chunk.index < 0) return;
            if (!variants[chunk.index]) variants[chunk.index] = {};
            const patch = {};
            if (chunk.title.trim()) patch.title = chunk.title.trim();
            if (chunk.description.trim()) {
              patch.description = entity.decode(
                format.widget(chunk.description.trim()),
              );
            }
            variants[chunk.index] = restore(
              variants[chunk.index],
              chunk.meta,
              patch,
            );
          });
        next.variants = variants;
        return next;
      },
    });
    return vote;
  },
  create() {
    const promo = widgetMode.promo();
    const vote = widgetMode.vote();
    const mode = {
      show(string) {
        return vote.show(promo.show(decode.raw(string, (value) => value)));
      },
      hide(string) {
        const normalized = transform.raw(
          vote.hide(promo.hide(string)),
          (value) => value,
        );
        let value = normalized;
        let snap = "";
        do {
          snap = value;
          value = value.replace(/&#38;&#35;(\d+);/g, "&#$1;");
        } while (value !== snap);
        return value;
      },
      detect(value) {
        if (readable(value)) return "readable";
        if (encoded(value)) return "encoded";
        return "decoded";
      },
      encoded(value) {
        const current = mode.detect(value);
        if (current === "encoded") return value;
        if (current === "readable") return mode.hide(value);
        return encode(value);
      },
      decoded(value) {
        const current = mode.detect(value);
        if (current === "decoded") return value;
        if (current === "readable") {
          return decode.raw(mode.hide(value), (item) => item);
        }
        return decode.raw(value, (item) => item);
      },
      raw(value) {
        return mode.decoded(value);
      },
      readable(value) {
        return mode.detect(value) === "readable" ? value : mode.show(value);
      },
      next(value) {
        const current = mode.detect(value);
        if (current === "encoded") return mode.readable(value);
        return mode.encoded(value);
      },
      pick(value, key) {
        if (/^e/i.test(key)) return mode.encoded(value);
        if (/^(d|r)$/i.test(key)) return mode.decoded(value);
        if (/^w|^read/i.test(key)) return mode.readable(value);
        return mode.next(value);
      },
    };
    return mode;
  },
};
const format = {
  readable(value) {
    const string = String(value || "")
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
    return text
      .finalize(text.run(string))
      .replace(/(^|\n)\s*(<li\b)/gi, "$1\t$2");
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
    return map(string, (value) =>
      entity.encode(html.guard(read.raw(value), fn)),
    );
  },
  normalized(string, fn) {
    return map(string, (value) =>
      entity.encode(html.guard(read.normalized(value), fn)),
    );
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
  mode: widgetMode,
};

export { widget };
