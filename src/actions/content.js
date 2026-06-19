import { cms } from "../core/cms.js";
import { entity as htmlEntity } from "../core/escape.js";
import { widget } from "../core/widget.js";
import { contentEmbed as sharedContentEmbed } from "../pipe/embed.js";

export const contentEmbed = sharedContentEmbed;

export const createContent = (api) => {
  const entity = {
    decode(value = "") {
      const field = document.createElement("textarea");
      field.innerHTML = String(value || "");
      return field.value;
    },
  };
  const toc = {
    skip(tag = "") {
      return /\sid=(?:"toc"|'toc'|toc)(?:\s|>)/i.test(String(tag || ""));
    },
    clean(value = "") {
      return String(value || "").replace(
        /^\s*<a\b[^>]*\bname=(?:"zag\d+"|'zag\d+'|zag\d+)[^>]*>\s*<\/a>\s*/i,
        "",
      );
    },
    title(value = "") {
      return entity.decode(
        String(value || "")
          .replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .trim(),
      );
    },
    tag(value = "", id = "") {
      return String(value || "").replace(/^<h2\b([^>]*)>/i, (_, attrs) => {
        const clean = String(attrs || "").replace(
          /\s+id=(?:"[^"]*"|'[^']*'|[^\s>]+)/i,
          "",
        );
        return `<h2${clean} id="${id}">`;
      });
    },
    replace(value = "", items = []) {
      return String(value || "").replace(
        /<h2\b[^>]*>[\s\S]*?<\/h2>/gi,
        (match) => {
          const tag = match.match(/^<h2\b[^>]*>/i)?.[0] || "";
          if (toc.skip(tag)) return match;
          const id = `zag${items.length}`;
          const inner = match
            .replace(/^<h2\b[^>]*>/i, "")
            .replace(/<\/h2>$/i, "");
          const content = toc.clean(inner);
          items.push({ id, title: toc.title(content) });
          return `${toc.tag(tag, id)}<a name="${id}"></a>${content}</h2>`;
        },
      );
    },
    build(items = []) {
      return [
        '<h2 id="toc">О чем эта статья</h2>',
        "<ul>",
        ...items.map(
          (item) => `\t<li><a href="#${item.id}">${item.title}</a></li>`,
        ),
        "</ul>",
      ].join("\n");
    },
    remove(value = "") {
      return String(value || "").replace(
        /\n?\s*<h[23]\b[^>]*>\s*О чем эта статья\s*<\/h[23]>\s*<ul>\s*[\s\S]*?<\/ul>\s*/i,
        "\n",
      );
    },
    insert(value = "", content = "") {
      const marker = String(value || "").match(/<!--more-->/i);
      if (!marker || marker.index === undefined) return value;
      const point = marker.index + marker[0].length;
      const left = String(value || "")
        .slice(0, point)
        .replace(/[ \t]+$/g, "")
        .replace(/\n+$/g, "");
      const right = String(value || "")
        .slice(point)
        .replace(/^[ \t]+/g, "")
        .replace(/^\n+/g, "");
      return `${left}\n\n${content}${right ? "\n\n" : ""}${right}`;
    },
    compose(value = "") {
      const items = [];
      const clean = toc.remove(value);
      const content = toc.replace(clean, items);
      if (!items.length) return value;
      return toc.insert(content, toc.build(items));
    },
    run() {
      return api.editor.document((state) => {
        const next = toc.compose(state.value);
        if (next === state.value) return null;
        return {
          value: next,
          start: Math.min(state.start, next.length),
          end: Math.min(state.end, next.length),
        };
      });
    },
  };
  const more = {
    token: "<!--more-->",
    edge(value = "", index = 0) {
      const left = String(value || "").slice(0, index);
      const right = String(value || "").slice(index + more.token.length);
      return {
        leftInline: /[^\s]/.test(left.replace(/[ \t]*$/g, "").slice(-1)),
        rightInline: /^[ \t]*[^\s]/.test(right),
      };
    },
    remove(value = "") {
      let next = String(value || "");
      while (next.includes(more.token)) {
        const index = next.indexOf(more.token);
        const edge = more.edge(next, index);
        const gap = edge.leftInline && edge.rightInline ? "\n\n" : "";
        next =
          next.slice(0, index) + gap + next.slice(index + more.token.length);
      }
      return next;
    },
    compact(value = "") {
      return String(value || "")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n[ \t]+/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/^[ \t]+/g, "")
        .replace(/[ \t]+$/g, "");
    },
    point(value = "") {
      const source = String(value || "");
      const string = source.replace(/^\s+/, "");
      const offset = source.length - string.length;
      const html = string.match(/<\/(?:p|div|blockquote|h[1-6])>/i);
      const gap = string.match(/\n/);
      const points = [
        html && html.index !== undefined
          ? offset + html.index + html[0].length
          : null,
        gap && gap.index !== undefined ? offset + gap.index : null,
      ].filter(Number.isInteger);
      if (!points.length) return source.length;
      return Math.min(...points);
    },
    insert(value = "") {
      const string = String(value || "");
      const point = more.point(string);
      const left = string
        .slice(0, point)
        .replace(/[ \t]+$/g, "")
        .replace(/\n+$/g, "");
      const right = string
        .slice(point)
        .replace(/^[ \t]+/g, "")
        .replace(/^\n+/g, "");
      return `${left}${more.token}${right ? "\n\n" : ""}${right}`;
    },
    normalize(value = "") {
      return more.insert(more.compact(more.remove(value)));
    },
    run() {
      return api.editor.change((state) => {
        const next = more.normalize(state.value);
        if (next === state.value) return null;
        return {
          value: next,
          start: Math.min(state.start, next.length),
          end: Math.min(state.end, next.length),
        };
      });
    },
  };
  const embed = {
    ...contentEmbed,
  async run() {
    try {
      const value = await navigator.clipboard.readText();
      const shortcode = contentEmbed.build(value);
      if (!shortcode) return false;
      return api.insert(shortcode);
    } catch {
      return false;
    }
  },
  };

  const readmore = {
    token: {
      slash(url) {
        return url.endsWith("/") ? url : `${url}/`;
      },
      same(url) {
        return readmore.token.slash(url.split("#")[0].split("?")[0]);
      },
      clean(value = "") {
        return String(value || "")
          .replace(/\s*[-–—]\s*.*onl[ií]ner.*$/i, "")
          .trim();
      },
      escape(value = "") {
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      },
    },
    parse(value = "") {
      const seen = new Set();
      return [
        ...String(value || "").matchAll(
          /https?:\/\/[a-z0-9-]+\.onliner\.by\/\d{4}\/\d{2}\/\d{2}\/[^\s"'<>]+/gi,
        ),
      ]
        .map(([url]) =>
          readmore.token.same(
            url.replace(/&amp;/g, "&").replace(/[),.;:!?]+$/g, ""),
          ),
        )
        .filter((url) => {
          if (seen.has(url)) return false;
          seen.add(url);
          return true;
        });
    },
    async source() {
      try {
        const value = await navigator.clipboard.readText();
        if (String(value || "").trim()) return value;
      } catch {}
      return prompt("Ссылки") || "";
    },
    async title(url) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) return "";
        const page = new DOMParser().parseFromString(
          await response.text(),
          "text/html",
        );
        return readmore.token.clean(
          page.querySelector('meta[property="og:title"]')?.content ||
            page.title ||
            "",
        );
      } catch {
        return "";
      } finally {
        clearTimeout(timer);
      }
    },
    async link(url) {
      const title = await readmore.title(url);
      if (title) return { url, text: title };
      const text = readmore.token.clean(prompt(`Заголовок для ${url}`) || "");
      return text ? { url, text } : null;
    },
    insert(links = []) {
      const items = links.map(
        ({ url, text }) =>
          `\t<li><a href="${readmore.token.escape(url)}" target="_blank">${readmore.token.escape(text)}</a></li>`,
      );
      const block = `<strong>Читайте также:</strong>\n<ul>\n${items.join("\n")}\n</ul>`;
      cms.editor.insert.block(block);
      return true;
    },
    async run() {
      const value = await readmore.source();
      const urls = readmore.parse(value);
      if (!urls.length) return false;
      const links = (await Promise.all(urls.map(readmore.link))).filter(Boolean);
      if (!links.length) return false;
      return readmore.insert(links);
    },
  };
  const widgets = {
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
    block: {
      start(tag) {
        return [`[${tag}]`, ""];
      },
      finish(rows, tag) {
        rows.push(`[/${tag}]`);
        return rows.join("\n");
      },
      field(rows, marker, value, transform = (item) => item) {
        const current = value || "";
        if (!current.trim()) return rows;
        rows.push(marker, transform(current), "");
        return rows;
      },
    },
    patch: {
      from(base, meta, patch) {
        return widget.restore(base, meta, patch);
      },
      text(patch, data, key) {
        if (data[key] === undefined) return patch;
        patch[key] = htmlEntity.decode(widget.text.widget(data[key]));
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
        return widget.block.mapJson(string, entry.tag, (full, data) => {
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
        return widget.block.each(string, entry.tag, (full, body) => {
          if (widget.block.jsonBody(body)) return full;
          const data = entry.unwrap(body, index);
          index += 1;
          return widget.block.stringify(entry.tag, data);
        });
      };
      return entry;
    },
    promo() {
      const promo = widgets.cycle({
        tag: widget.tag.promo,
        cache: [],
        editable: widget.form.promo.editable,
        marker: widget.form.promo.marker,
        wrap(data = {}) {
          const rows = widgets.block.start(promo.tag);
          widgets.append(
            rows,
            widget.frame(data, promo.editable),
            promo.marker.meta,
          );
          widgets.block.field(rows, promo.marker.title, data.title || "");
          widgets.block.field(
            rows,
            promo.marker.text,
            data.text || "",
            widget.text.readable,
          );
          widgets.block.field(rows, promo.marker.label, data.label || "");
          return widgets.block.finish(rows, promo.tag);
        },
        unwrap(body, index) {
          const base = promo.cache[index] || {};
          const data = widget.read.markers(body, promo.marker);
          const patch = {};
          widgets.patch.value(patch, data, "title");
          widgets.patch.text(patch, data, "text");
          widgets.patch.value(patch, data, "label");
          return widgets.patch.from(base, widgets.parse(data.meta), patch);
        },
      });
      return promo;
    },
    vote() {
      const vote = widgets.cycle({
        tag: widget.tag.vote,
        cache: [],
        editable: widget.form.vote.editable,
        variantEditable: widget.form.vote.variantEditable,
        marker: widget.form.vote.marker,
        wrap(data = {}) {
          const rows = widgets.block.start(vote.tag);
          const variants = data.variants || [];
          widgets.append(rows, widget.frame(data, vote.editable), vote.marker.meta);
          rows.push(vote.marker.variants, "");
          variants.forEach((item, index) => {
            const data = item || {};
            const title = (data.title || "").trim();
            const description = (data.description || "").trim();
            const meta = widget.frame(data, vote.variantEditable);
            if (!title && !description && !Object.keys(meta).length) return;
            rows.push(`${vote.marker.item}${index + 1}`, "");
            widgets.append(rows, meta, vote.marker.meta);
            widgets.block.field(rows, vote.marker.title, title);
            widgets.block.field(
              rows,
              vote.marker.description,
              description,
              widget.text.readable,
            );
          });
          return widgets.block.finish(rows, vote.tag);
        },
        unwrap(body, index) {
          const base = vote.cache[index] || {};
          const data = widget.read.vote(body, vote.marker);
          const next = widget.restore(base, data.meta, {});
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
                patch.description = htmlEntity.decode(
                  widget.text.widget(chunk.description.trim()),
                );
              }
              variants[chunk.index] = widget.restore(
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
    mode() {
      const promo = widgets.promo();
      const vote = widgets.vote();
      const mode = {
        show(string) {
          return vote.show(promo.show(widget.decode.raw(string, (value) => value)));
        },
        hide(string) {
          const normalized = widget.transform.raw(
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
          if (widget.readable(value)) return "readable";
          if (widget.encoded(value)) return "encoded";
          return "raw";
        },
        encoded(value) {
          const current = mode.detect(value);
          if (current === "encoded") return value;
          if (current === "readable") return mode.hide(value);
          return widget.encode(value);
        },
        raw(value) {
          const current = mode.detect(value);
          if (current === "raw") return value;
          if (current === "readable") {
            return widget.decode.raw(mode.hide(value), (item) => item);
          }
          return widget.decode.raw(value, (item) => item);
        },
        readable(value) {
          return mode.detect(value) === "readable" ? value : mode.show(value);
        },
        next(value) {
          const current = mode.detect(value);
          if (current === "encoded") return mode.raw(value);
          if (current === "raw") return mode.readable(value);
          return mode.encoded(value);
        },
        pick(value, key) {
          if (/^e/i.test(key)) return mode.encoded(value);
          if (/^r$/i.test(key)) return mode.raw(value);
          if (/^w|^read/i.test(key)) return mode.readable(value);
          return mode.next(value);
        },
      };
      return mode;
    },
    run() {
      const textarea = document.getElementById("content");
      if (!textarea) return false;
      cms.editor.html();
      const choice = prompt("Widgets mode: e=encoded, r=raw, w=readable");
      const mode = widgets.mode();
      cms.editor.runContent((value) => mode.pick(value, (choice || "").trim()));
      return true;
    },
  };
  const photo = {
    run() {
      return api.insert("ФОТО ", 5);
    },
  };
  const video = {
    run() {
      return api.insert("[video][/video]", 7);
    },
  };
  return {
    content: {
      toc,
      more,
      embed,
      readmore,
      widgets,
      photo,
      video,
    },
  };
};
