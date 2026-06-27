import { cms } from "../core/cms.js";
import { widget } from "../core/widget.js";
import { contentEmbed as sharedContentEmbed } from "../pipe/markup.js";

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
    titles: [
      "О чем эта статья",
      "О чем этот текст",
      "О чем пойдет речь",
    ],
    skip(tag = "") {
      return /\sid=(?:"toc"|'toc'|toc)(?:\s|>)/i.test(String(tag || ""));
    },
    key(value = "") {
      return entity.decode(
        String(value || "")
          .replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .trim(),
      )
        .toLocaleLowerCase("ru-RU")
        .replace(/ё/g, "е");
    },
    headingTitle(value = "") {
      const key = toc.key(value);
      return toc.titles.find((title) => toc.key(title) === key) || "";
    },
    stale(value = "") {
      return /href=(?:"#zag\d+"|'#zag\d+'|#zag\d+)(?:\s|>)/i.test(
        String(value || ""),
      );
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
    heading(tag = "h2", attrs = "", inner = "") {
      const clean = String(attrs || "").replace(
        /\s+id=(?:"[^"]*"|'[^']*'|[^\s>]+)/i,
        "",
      );
      return `<${tag}${clean} id="toc">${inner || toc.titles[0]}</${tag}>`;
    },
    list(value = "") {
      const source = String(value || "");
      return [...source.matchAll(/<li\b[^>]*>[\s\S]*?<\/li>/gi)]
        .map((match) => {
          const html = match[0];
          const id = html.match(
            /href=(?:"#(zag\d+)"|'#(zag\d+)'|#(zag\d+))/i,
          );
          return {
            id: id?.[1] || id?.[2] || id?.[3] || "",
            html,
          };
        })
        .filter((item) => item.id);
    },
    merge(items = [], previous = []) {
      return items.map((item) => {
        const match = previous.find((entry) => entry.id === item.id);
        return match ? { ...item, html: match.html } : item;
      });
    },
    build(items = [], data = {}) {
      const title = data.title || toc.titles[0];
      const heading = toc.heading("h2", "", title);
      const list = data.list || "<ul>";
      return [
        heading,
        list,
        ...items.map(
          (item) => item.html || `\t<li><a href="#${item.id}">${item.title}</a></li>`,
        ),
        "</ul>",
      ].join("\n");
    },
    remove(value = "") {
      const data = {
        value: String(value || ""),
        title: "",
        list: "",
        items: [],
      };
      const heading = String.raw`<(h[23])\b([^>]*)>([\s\S]*?)<\/\1>`;
      const list = String.raw`<ul\b[^>]*>[\s\S]*?href=(?:"#zag\d+"|'#zag\d+'|#zag\d+)[\s\S]*?<\/ul>`;
      data.value = data.value.replace(
        new RegExp(String.raw`\n?\s*${heading}\s*(${list})\s*`, "gi"),
        (match, tag, attrs, headingText, listText) => {
          data.title ||= headingText || toc.title(headingText);
          data.list ||= listText.match(/^<ul\b[^>]*>/i)?.[0] || "<ul>";
          data.items = data.items.concat(toc.list(listText));
          return "\n";
        },
      );
      data.value = data.value.replace(
        new RegExp(String.raw`\n?\s*(${list})\s*`, "gi"),
        (match, listText) => {
          data.list ||= listText.match(/^<ul\b[^>]*>/i)?.[0] || "<ul>";
          data.items = data.items.concat(toc.list(listText));
          return "\n";
        },
      );
      return data;
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
    compose(value = "", options = {}) {
      const items = [];
      const clean = toc.remove(value);
      const content = toc.replace(clean.value, items);
      if (!items.length) return value;
      return toc.insert(
        content,
        toc.build(toc.merge(items, clean.items), {
          title: options.title || clean.title || toc.titles[0],
          list: clean.list,
        }),
      );
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
    async source() {
      try {
        const value = await navigator.clipboard.readText();
        if (String(value || "").trim()) return value;
      } catch {}
      return prompt("Ссылка") || "";
    },
    async run() {
      const value = await embed.source();
      if (!String(value || "").trim()) return false;
      const shortcode = contentEmbed.build(value);
      if (!shortcode) {
        alert(
          "Embed: нужна ссылка Instagram, Threads, TikTok, X/Twitter или Telegram",
        );
        return false;
      }
      return api.insert(shortcode);
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
    run() {
      const textarea = document.getElementById("content");
      if (!textarea) return false;
      cms.editor.html();
      const mode = widget.mode.create();
      cms.editor.runContent((value) => mode.next(value));
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
