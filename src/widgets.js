import { editor } from "./core/admin.js";
import { entity } from "./core/escape.js";
import { widget } from "./core/widget.js";

(() => {
  const textarea = document.getElementById("content");
  if (!textarea) return;
  document._widgetsInternalSwitch = true;
  const options = {
    normalizeInline: false,
  };
  const helper = {
    marker(value) {
      return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    },
    parse(value) {
      if (!value) return {};
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    },
    frame(value, editable) {
      const data = value || {};
      return Object.keys(data).map((key) => {
        if (editable.includes(key)) return { key };
        return { key, value: data[key] };
      });
    },
    restore(base, frame, patch) {
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
    },
    read(body, markers) {
      const keys = Object.keys(markers);
      const stop = `(?:${keys.map((key) => helper.marker(markers[key])).join("|")})`;
      const pick = (key) => {
        const mark = helper.marker(markers[key]);
        const pattern = new RegExp(
          `(^|\\n)\\s*${mark}\\s*\\n([\\s\\S]*?)(?=\\n\\s*${stop}\\s*\\n|$)`,
          "i",
        );
        const match = body.match(pattern);
        return match ? match[2].trim() : null;
      };
      return keys.reduce((data, key) => {
        const value = pick(key);
        if (value === null) return data;
        data[key] = value;
        return data;
      }, {});
    },
    writeMeta(rows, meta, marker) {
      if (!Object.keys(meta).length) return rows;
      rows.push(marker, JSON.stringify(meta), "");
      return rows;
    },
    emit() {
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.dispatchEvent(new Event("change", { bubbles: true }));
    },
  };
  const promo = {
    tag: "onliner-promo-widget",
    cache: [],
    editable: ["title", "text", "label"],
    marker: {
      title: "@title",
      text: "@text",
      label: "@label",
      meta: "@meta",
    },
    toReadableText(value) {
      return (value || "")
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
    toWidgetText(value) {
      const source = (value || "").replace(/\r\n?/g, "\n").trim();
      if (!source) return "";
      const markup = {
        block(value) {
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
          if (!markup.tag(value)) return markup.paragraph(value);
          if (markup.native(value)) return value;
          if (!markup.block(value) && /^<\w/i.test(value))
            return markup.paragraph(value);
          if (/^<\w/i.test(value)) return value;
          const match = value.match(/^([\s\S]*?)(<[\s\S]+)$/);
          if (!match) return value;
          const head = match[1].replace(/\n+/g, " ").trim();
          const tail = match[2].trim();
          return head ? `${markup.paragraph(head)}${tail}` : tail;
        },
      };
      const normalized = markup.block(source)
        ? source
        : source.replace(/\n+/g, "\n\n");
      return normalized
        .split(/\n{2,}/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map(markup.mixed)
        .join("");
    },
    wrap(data = {}) {
      const rows = [`[${promo.tag}]`, ""];
      const title = data.title || "";
      const text = data.text || "";
      const label = data.label || "";
      helper.writeMeta(
        rows,
        helper.frame(data, promo.editable),
        promo.marker.meta,
      );
      if (title.trim()) rows.push(promo.marker.title, title, "");
      if (text.trim())
        rows.push(promo.marker.text, promo.toReadableText(text), "");
      if (label.trim()) rows.push(promo.marker.label, label, "");
      rows.push(`[/${promo.tag}]`);
      return rows.join("\n");
    },
    unwrap(body, index) {
      const base = promo.cache[index] || {};
      const data = helper.read(body, promo.marker);
      const patch = {};
      if (data.title !== undefined) patch.title = data.title;
      if (data.text !== undefined)
        patch.text = entity.decode(promo.toWidgetText(data.text));
      if (data.label !== undefined) patch.label = data.label;
      return helper.restore(base, helper.parse(data.meta), patch);
    },
    show(string) {
      promo.cache = [];
      return string.replace(
        /\[onliner-promo-widget\]([\s\S]*?)\[\/onliner-promo-widget\]/g,
        (full, raw) => {
          try {
            const data = JSON.parse(raw);
            promo.cache.push(data || {});
            return promo.wrap(data);
          } catch {
            promo.cache.push({});
            return full;
          }
        },
      );
    },
    hide(string) {
      let index = 0;
      return string.replace(
        /\[onliner-promo-widget\]([\s\S]*?)\[\/onliner-promo-widget\]/g,
        (full, body) => {
          if (/^\s*\{[\s\S]*\}\s*$/.test(body)) return full;
          const data = promo.unwrap(body, index);
          index += 1;
          return `[${promo.tag}]${JSON.stringify(data)}[/${promo.tag}]`;
        },
      );
    },
  };
  const vote = {
    tag: "onliner-vote",
    cache: [],
    editable: ["variants"],
    variantEditable: ["title", "description"],
    marker: {
      variants: "@variants",
      item: "@item",
      title: "@title",
      description: "@description",
      meta: "@meta",
    },
    toReadableText(value) {
      return promo.toReadableText(value);
    },
    toWidgetText(value) {
      return promo.toWidgetText(value);
    },
    wrap(data = {}) {
      const rows = [`[${vote.tag}]`, ""];
      const variants = data.variants || [];
      helper.writeMeta(
        rows,
        helper.frame(data, vote.editable),
        vote.marker.meta,
      );
      rows.push(vote.marker.variants, "");
      variants.forEach((item, index) => {
        const data = item || {};
        const title = (data.title || "").trim();
        const description = (data.description || "").trim();
        const meta = helper.frame(data, vote.variantEditable);
        if (!title && !description && !Object.keys(meta).length) return;
        rows.push(`${vote.marker.item}${index + 1}`, "");
        helper.writeMeta(rows, meta, vote.marker.meta);
        if (title) rows.push(vote.marker.title, title, "");
        if (description)
          rows.push(
            vote.marker.description,
            vote.toReadableText(description),
            "",
          );
      });
      rows.push(`[/${vote.tag}]`);
      return rows.join("\n");
    },
    item() {
      return {
        index: 0,
        meta: {},
        title: "",
        description: "",
      };
    },
    parse(body) {
      const lines = body.replace(/\r\n?/g, "\n").split("\n");
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
          current = vote.item();
          current.index = item[1] ? Number(item[1]) - 1 : data.chunks.length;
          return;
        }
        if (/^@meta$/i.test(value)) {
          mode = "meta";
          return;
        }
        if (/^@title$/i.test(value)) {
          mode = "title";
          return;
        }
        if (/^@description$/i.test(value)) {
          mode = "description";
          return;
        }
        if (/^@variants\b/i.test(value)) return;
        if (mode === "meta") {
          if (current) current.meta = helper.parse(line);
          else data.meta = helper.parse(line);
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
    unwrap(body, index) {
      const base = vote.cache[index] || {};
      const data = vote.parse(body);
      const next = helper.restore(base, data.meta, {});
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
              vote.toWidgetText(chunk.description.trim()),
            );
          }
          variants[chunk.index] = helper.restore(
            variants[chunk.index],
            chunk.meta,
            patch,
          );
        });
      next.variants = variants;
      return next;
    },
    show(string) {
      vote.cache = [];
      return string.replace(
        /\[onliner-vote\]([\s\S]*?)\[\/onliner-vote\]/g,
        (full, raw) => {
          try {
            const data = JSON.parse(raw);
            vote.cache.push(data || {});
            return vote.wrap(data);
          } catch {
            vote.cache.push({});
            return full;
          }
        },
      );
    },
    hide(string) {
      let index = 0;
      return string.replace(
        /\[onliner-vote\]([\s\S]*?)\[\/onliner-vote\]/g,
        (full, body) => {
          if (/^\s*\{[\s\S]*\}\s*$/.test(body)) return full;
          const data = vote.unwrap(body, index);
          index += 1;
          return `[${vote.tag}]${JSON.stringify(data)}[/${vote.tag}]`;
        },
      );
    },
  };
  const show = (string) =>
    vote.show(promo.show(widget.decode(string, (value) => value, options)));
  const normalizeEntities = (string) => {
    let value = string;
    let snap;
    do {
      snap = value;
      value = value.replace(/&#38;&#35;(\d+);/g, "&#$1;");
    } while (value !== snap);
    return value;
  };
  const hide = (string) =>
    normalizeEntities(
      widget.transform(
        vote.hide(promo.hide(string)),
        (value) => value,
        options,
      ),
    );
  const mode = {
    decoded(string) {
      return /\[(onliner-promo-widget|onliner-vote)\][\s\S]*?@(title|text|label|variants|item|description|meta)/i.test(
        string,
      );
    },
    get() {
      return (
        textarea.dataset.widgetMode ||
        (mode.decoded(textarea.value) || !widget.encoded(textarea.value)
          ? "decoded"
          : "encoded")
      );
    },
    set(value) {
      textarea.dataset.widgetMode = value;
    },
    sync() {
      mode.set(
        mode.decoded(textarea.value) || !widget.encoded(textarea.value)
          ? "decoded"
          : "encoded",
      );
    },
  };
  const run = (fn) => {
    const source = textarea.value;
    const result = fn(source);
    if (result === source) return;
    textarea.value = result;
    helper.emit();
  };
  const toggle = () => {
    if (mode.get() === "encoded") {
      run(show);
      mode.set("decoded");
      return;
    }
    run(hide);
    mode.set("encoded");
  };
  const ensureEncoded = () => {
    if (mode.get() === "encoded") return;
    run(hide);
    mode.set("encoded");
  };
  editor.html();
  setTimeout(() => {
    mode.sync();
    toggle();
    const onTmceSwitch = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest("#content-tmce")) return;
      if (mode.get() === "encoded") return;
      run(hide);
      mode.set("encoded");
    };
    if (document._widgetsTmceSwitchHandler) {
      document.removeEventListener(
        "mousedown",
        document._widgetsTmceSwitchHandler,
        true,
      );
    }
    document._widgetsTmceSwitchHandler = onTmceSwitch;
    document.addEventListener("mousedown", onTmceSwitch, true);
    const onHtmlSwitch = (event) => {
      if (document._widgetsInternalSwitch) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest("#content-html")) return;
      setTimeout(() => {
        run(show);
        mode.set("decoded");
      }, 0);
    };
    if (document._widgetsHtmlSwitchHandler) {
      document.removeEventListener(
        "click",
        document._widgetsHtmlSwitchHandler,
        true,
      );
    }
    document._widgetsHtmlSwitchHandler = onHtmlSwitch;
    document.addEventListener("click", onHtmlSwitch, true);
    editor.save({ beforeClick: ensureEncoded });
    editor.publish({ beforeClick: ensureEncoded });
    editor.tmce();
    setTimeout(() => {
      document._widgetsInternalSwitch = false;
    }, 0);
  }, 0);
})();
