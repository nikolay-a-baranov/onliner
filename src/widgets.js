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

  const promo = {
    tag: "onliner-promo-widget",
    cache: [],
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
      value = (value || "").replace(/\r\n?/g, "\n").trim();
      if (!value) return "";
      const hasBlockMarkup = (string) =>
        /<(?:p|ul|ol|li|blockquote|table|thead|tbody|tr|td|th|figure|figcaption|h[1-6])\b/i.test(
          string,
        );
      if (!hasBlockMarkup(value)) {
        value = value.replace(/\n+/g, "\n\n");
      }
      const hasTag = (string) => /<\/?[a-z][^>]*>/i.test(string);
      const isBlockTag = (string) =>
        /^(?:<ul\b|<ol\b|<li\b|<blockquote\b|<img\b|<dl\b|<table\b|<thead\b|<tbody\b|<tr\b|<td\b|<th\b|<figure\b|<figcaption\b)/i.test(
          string,
        );
      const hasParagraphOrBlock = (string) =>
        /<(?:p|ul|ol|li|blockquote|table|thead|tbody|tr|td|th|figure|figcaption|h[1-6])\b/i.test(
          string,
        );
      return value
        .split(/\n{2,}/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
          if (isBlockTag(item)) return item;
          if (hasTag(item)) {
            if (!hasParagraphOrBlock(item) && /^<\w/i.test(item)) {
              return `<p>${item}</p>`;
            }
            if (!/^<\w/i.test(item)) {
              const split = item.match(/^([\s\S]*?)(<[\s\S]+)$/);
              if (split) {
                const head = split[1].replace(/\n+/g, " ").trim();
                const tail = split[2].trim();
                if (head) return `<p>${head}</p>${tail}`;
                return tail;
              }
            }
            return item;
          }
          return `<p>${item.replace(/\n+/g, " ").trim()}</p>`;
        })
        .join("");
    },
    wrap({ title = "", text = "", label = "", meta = {} }) {
      const rows = [`[${promo.tag}]`, ""];
      if ((title || "").trim()) {
        rows.push(promo.marker.title, title, "");
      }
      if ((text || "").trim()) {
        rows.push(promo.marker.text, promo.toReadableText(text), "");
      }
      if ((label || "").trim()) {
        rows.push(promo.marker.label, label, "");
      }
      rows.push(`[/${promo.tag}]`);
      return rows.join("\n");
    },
    unwrap(body, index) {
      const base = promo.cache[index] || {};
      const titleMark = promo.marker.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const textMark = promo.marker.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const labelMark = promo.marker.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const stop = `(?:${titleMark}|${textMark}|${labelMark})`;
      const pick = (mark) => {
        const pattern = new RegExp(
          `(^|\\n)\\s*${mark}\\s*\\n([\\s\\S]*?)(?=\\n\\s*${stop}\\s*\\n|$)`,
          "i",
        );
        const match = body.match(pattern);
        return match ? match[2].trim() : null;
      };

      const next = { ...base };
      const title = pick(titleMark);
      const text = pick(textMark);
      const label = pick(labelMark);

      if (title !== null) next.title = title;
      if (text !== null) next.text = entity.decode(promo.toWidgetText(text));
      if (label !== null) next.label = label;

      return next;
    },
    show(string) {
      promo.cache = [];
      return string.replace(
        /\[onliner-promo-widget\]([\s\S]*?)\[\/onliner-promo-widget\]/g,
        (full, raw) => {
          try {
            const data = JSON.parse(raw);
            const { title = "", text = "", label = "", ...meta } = data || {};
            promo.cache.push({ ...meta, title, text, label });
            return promo.wrap({ title, text, label, meta });
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
          if (/^\s*\{[\s\S]*\}\s*$/.test(body)) {
            return full;
          }
          const data = promo.unwrap(body, index);
          index += 1;
          return `[${promo.tag}]${JSON.stringify(data)}[/${promo.tag}]`;
        },
      );
    },
  };

  const vote = {
    tag: "onliner-vote",
    marker: {
      variants: "@variants",
      item: "@item",
      title: "@title",
      description: "@description",
    },
    cache: [],
    toReadableText(value) {
      return promo.toReadableText(value);
    },
    toWidgetText(value) {
      return promo.toWidgetText(value);
    },
    wrap(data = {}) {
      const rows = [`[${vote.tag}]`, "", vote.marker.variants, ""];
      (data.variants || []).forEach((item, index) => {
        const title = (item?.title || "").trim();
        const description = (item?.description || "").trim();
        if (!title && !description) return;
        rows.push(`${vote.marker.item}${index + 1}`, "");
        if (title) rows.push(vote.marker.title, title, "");
        if (description) {
          rows.push(vote.marker.description, vote.toReadableText(description), "");
        }
      });
      rows.push(`[/${vote.tag}]`);
      return rows.join("\n");
    },
    show(string) {
      vote.cache = [];
      return string.replace(
        /\[onliner-vote\]([\s\S]*?)\[\/onliner-vote\]/g,
        (full, raw) => {
          try {
            const data = JSON.parse(raw);
            vote.cache.push(data);
            return vote.wrap(data);
          } catch {
            vote.cache.push({});
            return full;
          }
        },
      );
    },
    hide(string) {
      let blockIndex = 0;
      return string.replace(
        /\[onliner-vote\]([\s\S]*?)\[\/onliner-vote\]/g,
        (full, body) => {
          if (/^\s*\{[\s\S]*\}\s*$/.test(body)) {
            return full;
          }

          const base = vote.cache[blockIndex] || {};
          blockIndex += 1;
          const lines = body.replace(/\r\n?/g, "\n").split("\n");
          const chunks = [];
          let current = null;
          let mode = null;
          const push = () => {
            if (current) chunks.push(current);
            current = null;
            mode = null;
          };
          lines.forEach((line) => {
            const item = line.trim().match(/^@item(?:\s*(\d+))?/i);
            if (item) {
              push();
              current = {
                index: item[1] ? Number(item[1]) - 1 : chunks.length,
                title: "",
                description: "",
              };
              return;
            }
            if (!current) return;
            if (/^@title$/i.test(line.trim())) {
              mode = "title";
              return;
            }
            if (/^@description$/i.test(line.trim())) {
              mode = "description";
              return;
            }
            if (/^@(?:item|variants)\b/i.test(line.trim())) return;
            if (mode === "title") {
              current.title += (current.title ? "\n" : "") + line;
            } else if (mode === "description") {
              current.description += (current.description ? "\n" : "") + line;
            }
          });
          push();
          if (!chunks.length) {
            return `[${vote.tag}]${JSON.stringify(base)}[/${vote.tag}]`;
          }

          const variants = Array.isArray(base.variants)
            ? base.variants.map((variant) => ({ ...variant }))
            : [];

          if (!variants.length) {
            chunks
              .slice()
              .sort((left, right) => left.index - right.index)
              .forEach((chunk) => {
                variants.push({
                  title: chunk.title.trim(),
                  description: chunk.description.trim()
                    ? entity.decode(vote.toWidgetText(chunk.description.trim()))
                    : "",
                });
              });
            return `[${vote.tag}]${JSON.stringify({ ...base, variants })}[/${vote.tag}]`;
          }

          const next = { ...base, variants };
          chunks.forEach((chunk) => {
            const index = chunk.index;
            if (index < 0) return;
            if (index >= next.variants.length) {
              next.variants[index] = {};
            }
            if (chunk.title.trim()) next.variants[index].title = chunk.title.trim();
            if (chunk.description.trim()) {
              next.variants[index].description = entity.decode(
                vote.toWidgetText(chunk.description.trim()),
              );
            }
          });
          return `[${vote.tag}]${JSON.stringify(next)}[/${vote.tag}]`;
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
      widget.transform(vote.hide(promo.hide(string)), (value) => value, options),
    );

  const mode = {
    decoded(string) {
      return /\[(onliner-promo-widget|onliner-vote)\][\s\S]*?@(title|text|label|variants|item|description)/i.test(
        string,
      );
    },
    get: () =>
      textarea.dataset.widgetMode ||
      (mode.decoded(textarea.value) || !widget.encoded(textarea.value)
        ? "decoded"
        : "encoded"),
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

  const emit = () => {
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const run = (fn) => {
    const source = textarea.value;
    const result = fn(source);
    if (result === source) return;
    textarea.value = result;
    emit();
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
