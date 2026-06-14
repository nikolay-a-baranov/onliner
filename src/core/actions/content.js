import { cms } from "../cms.js";
import { entity as htmlEntity } from "../escape.js";
import { widget } from "../widget.js";

export const contentEmbed = {
  url: {
    parse(value) {
      try {
        return new URL(String(value || "").trim());
      } catch {
        return null;
      }
    },
    clean(value) {
      const clean = new URL(value.toString());
      clean.search = "";
      clean.hash = "";
      return clean.toString();
    },
    link(value = "") {
      const parsed = contentEmbed.url.parse(
        String(value).replace(/&amp;/gi, "&"),
      );
      if (!parsed) return "";
      return contentEmbed.url.clean(parsed);
    },
  },
  template: {
    instagram(value) {
      return `[instagram]\n<blockquote class="instagram-media" data-instgrm-version="14" data-instgrm-permalink="${value}"><a href="${value}">Instagram</a></blockquote>\n[/instagram]`;
    },
    threads(value) {
      return `[threads]\n<blockquote class="text-post-media" data-text-post-version="0" data-text-post-permalink="${value}"><a href="${value}">Threads</a></blockquote>\n[/threads]`;
    },
    tiktok(value) {
      const match = value.match(/\/video\/(\d+)/);
      if (!match) return "";
      return `[tiktok]\n<blockquote class="tiktok-embed" data-video-id="${match[1]}" cite="${value}"><section>TikTok</section></blockquote>\n[/tiktok]`;
    },
    tweet(value) {
      return `[tweet]\n<blockquote class="twitter-tweet"><a href="${value}">X</a></blockquote>\n[/tweet]`;
    },
    telegram(value) {
      const path = value.replace(/^https?:\/\/t\.me\//, "").replace(/^s\//, "");
      return `[telegram]${path}[/telegram]`;
    },
  },
  service: {
    get(value) {
      const host = value.hostname.replace(/^www\./, "");
      if (host === "instagram.com") return contentEmbed.template.instagram;
      if (host === "threads.com" || host === "threads.net") {
        return contentEmbed.template.threads;
      }
      if (host === "tiktok.com") return contentEmbed.template.tiktok;
      if (host === "x.com" || host === "twitter.com") {
        return contentEmbed.template.tweet;
      }
      if (host === "t.me") return contentEmbed.template.telegram;
      return null;
    },
  },
  build(value) {
    const parsedUrl = contentEmbed.url.parse(value);
    if (!parsedUrl) return "";
    const cleanUrl = contentEmbed.url.clean(parsedUrl);
    const builder = contentEmbed.service.get(parsedUrl);
    if (!builder) return "";
    return builder(cleanUrl);
  },
  normalize: {
    video(value) {
      return value.replace(/\[video\][\s\S]*?\[\/video\]/gi, (full) => {
        const link = full.match(
          /src="([^"]*youtube\.com\/embed\/[^"]*)"/i,
        )?.[1];
        const clean = contentEmbed.url.link(link);
        if (!clean) return full;
        const match = clean.match(/youtube\.com\/embed\/([^/?#&"]+)/i);
        if (!match) return full;
        return full.replace(
          /src="[^"]*youtube\.com\/embed\/[^"]*"/i,
          `src="https://www.youtube.com/embed/${match[1]}"`,
        );
      });
    },
    duplicatedClosing(value) {
      return value.replace(
        /(\[\/(instagram|threads|telegram|tiktok|tweet)\])(\s*\[\/\2\])+/g,
        "$1",
      );
    },
    instagram(value) {
      return value.replace(/\[instagram\][\s\S]*?\[\/instagram\]/gi, (full) => {
        const link =
          full.match(/data-instgrm-permalink="([^"]+)"/i)?.[1] ||
          full.match(/href="([^"]*instagram\.com[^"]*)"/i)?.[1];
        const clean = contentEmbed.url.link(link);
        if (!clean) return full;
        return contentEmbed.template.instagram(clean);
      });
    },
    threads(value) {
      return value.replace(/\[threads\][\s\S]*?\[\/threads\]/gi, (full) => {
        const link =
          full.match(/data-text-post-permalink="([^"]+)"/i)?.[1] ||
          full.match(/href="([^"]*threads\.(com|net)[^"]*)"/i)?.[1];
        const clean = contentEmbed.url.link(link);
        if (!clean) return full;
        return contentEmbed.template.threads(clean);
      });
    },
    tweet(value) {
      return value.replace(/\[tweet\][\s\S]*?\[\/tweet\]/gi, (full) => {
        const link = full.match(
          /href="([^"]*(x\.com|twitter\.com)[^"]*)"/i,
        )?.[1];
        const clean = contentEmbed.url.link(link);
        if (!clean) return full;
        return contentEmbed.template.tweet(clean);
      });
    },
    tiktok(value) {
      return value.replace(/\[tiktok\][\s\S]*?\[\/tiktok\]/gi, (full) => {
        const link =
          full.match(/cite="([^"]+)"/i)?.[1] ||
          full.match(/href="([^"]*tiktok\.com[^"]*)"/i)?.[1] ||
          full.match(/https?:\/\/(?:www\.)?tiktok\.com\/[^\s"'<>]+/i)?.[0];
        const clean = contentEmbed.url.link(link);
        if (!clean) return full;
        return contentEmbed.template.tiktok(clean) || full;
      });
    },
    run(value) {
      return [
        contentEmbed.normalize.video,
        contentEmbed.normalize.duplicatedClosing,
        contentEmbed.normalize.instagram,
        contentEmbed.normalize.threads,
        contentEmbed.normalize.tweet,
        contentEmbed.normalize.tiktok,
      ].reduce((state, step) => step(state), value);
    },
  },
};

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
      widgets,
      photo,
      video,
    },
  };
};
