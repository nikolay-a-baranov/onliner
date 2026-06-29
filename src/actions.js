import { transform } from "./core/transform.js";
import { createShared } from "./actions/shared.js";
import { createChars } from "./actions/chars.js";
import { createMoves } from "./actions/moves.js";
import { createTokens } from "./actions/tokens.js";
import { createMarkup } from "./actions/markup.js";
import { createContent } from "./actions/content.js";
import { createSearch } from "./actions/search.js";
import { createAdmin } from "./actions/admin.js";
import { createAudit } from "./actions/audit.js";
import { createOnliner } from "./actions/onliner.js";
import { createSession } from "./actions/session.js";
import { createFeedback } from "./actions/feedback.js";
import { createProofread } from "./actions/proofread.js";
import { createMedia } from "./actions/media.js";

const api = {};
const shared = createShared(api);
const chars = createChars(api);
const moves = createMoves(api);
const tokens = createTokens(api);
const markup = createMarkup(api);
const content = createContent(api);
const search = createSearch(api);
const admin = createAdmin(api);
const audit = createAudit(api);
const onliner = createOnliner(api);
const session = createSession(api);
const feedback = createFeedback(api);
const proofread = createProofread(api);
const media = createMedia(api);
Object.assign(
  api,
  shared,
  chars,
  moves,
  tokens,
  markup,
  content,
  search,
  admin,
  audit,
  onliner,
  session,
  feedback,
  proofread,
  media,
);
api.current?.bind?.();

const symbolList = ["°", "′", "″", "$", "€", "Ў", "ў", "І", "і", "í", "…"];
const mathList = ["−", "×", "·", "÷", "≈", "≠", "±", "≤", "≥", "²", "³"];
const editorActions = {
  "nbsp": (element) => api.nbsp(element),
  "comma": (element) => api.punctMark(element, ","),
  "colon": (element) => api.punctMark(element, ":"),
  "dash": (element) => api.punctMark(element, "—"),
  "punct": (element) => api.punct(element),
  "quote": (element) => api.cycle(element, ["«", "»"]),
  "qswap": (element) => api.qswap(element),
  "accent": (element) => api.accent(element),
  "symbol": (element) => api.cycle(element, symbolList),
  "math": (element) => api.cycle(element, mathList),
  "home": (element) => api.home(element),
  "left": (element) => api.move(element, -1),
  "right": (element) => api.move(element, 1),
  "capital": (element) => api.capital(element),
  "token": (element) => api.token(element),
  "number": (element) => api.number(element),
  "abbr": (element) => api.abbr(element),
  "year": (element) => api.year(element),
  "branch": (element) => api.branch(element),
  "inflect": (element) => api.inflect(element),
  "separator": (element) => api.markup.separator(element),
  "italic": (element) =>
    api.markup.inline(element, { mode: "italic" }),
  "bold": (element) => api.markup.inline(element, { mode: "bold" }),
  "clear": (element) => api.markup.clear.run(element),
  "note": (element) => api.note(element),
  "list": (element) => api.list(element),
};
const textActions = {
  blockquote: () =>
    api.apply((value) =>
      transform.quote(value.value, {
        start: value.start,
        end: value.end,
      }),
    ),
};
editorActions.quote = (element) => api.quote(element);
const contentActions = {
  more: () => api.content.more.run(),
  readmore: () => api.content.readmore.run(),
  toc: () => api.content.toc.run(),
  embed: () => api.content.embed.run(),
  promo: () => api.content.promo.run(),
  photo: () => api.content.photo.run(),
  video: () => api.content.video.run(),
  widgets: () => api.content.widgets.run(),
};
const searchActions = {
  "google": () => api.search.google.run(),
  "gramota": () => api.search.gramota.run(),
  "kinopoisk": () => api.search.kinopoisk.run(),
};
const fieldActions = {
  excerpt: () => api.admin.excerpt.run(),
};
const markupActions = {
  inline: (options = {}) =>
    api.markup.inline(api.element(), {
      mode: "cycle",
      reverse: Boolean(options.reverse),
    }),
  block: (options = {}) =>
    api.markup.block(api.element(), {
      mode: "cycle",
      reverse: Boolean(options.reverse),
    }),
  resize: () => {
    const element = api.element();
    return element ? api.markup.resize(element) : false;
  },
  interview: () => api.markup.interview.run(),
  "image.caption": () => api.markup.caption.run(),
  "clipboard.link": () => api.markup.link.run(),
};
const auditActions = {
  audit: () => api.audit.text.run(),
};
const cleanupActions = {
  cleanup: () => api.admin.clean.run(),
  "footer.normalize": () => api.admin.clean.author.run(),
};
const adminActions = {
  diff: () => api.admin.diff.run(),
  dump: () => api.admin.dump.run(),
  "submit.save": () => api.admin.submit.run("save"),
  tags: () => api.admin.tags.run(),
  report: () => api.admin.crawler.report.run(),
  "crawler.tags": () => api.admin.crawler.tags.run(),
  "tags.normalize": () => api.admin.tags.normalize.run(),
  "tags.suggest": () => api.admin.tags.suggest.run(),
  titles: () => api.admin.titles.run(),
  slug: () => api.admin.slug.run(),
  sanitize: () => api.admin.sanitize.run(),
  prepare: () => api.admin.prepare.run(),
  refresh: () => api.admin.refresh.run(),
  whoami: (options = {}) => api.admin.whoami.run(options),
  plan: () => api.admin.plan.run(),
};
const onlinerActions = {
  wordpress: () => api.onliner.wordpress.run(),
  "madtest.find": () => api.onliner.madtest.find.run(),
};
const projectHomeActions = {
  "project.home.onliner": () =>
    window.open("https://www.onliner.by/", "_blank", "noopener,noreferrer"),
  "project.home.wordpress": () =>
    window.open(
      "https://people.onliner.by/wp-admin/edit.php",
      "_blank",
      "noopener,noreferrer",
    ),
  "project.home.madtest": () =>
    window.open("https://madtest.ru/app/", "_blank", "noopener,noreferrer"),
};
const sessionActions = {
  login: () => api.session.login.run(),
};
const feedbackActions = {
  feedback: () => api.feedback.run(),
};
const proofreadActions = {
  proofread: () => api.proofread.run(),
};
const mediaActions = {
  thumb: () => api.media.thumb.run(),
  "image.search": () => api.media.search.run(),
  "media.upload": () => api.media.upload.run(),
  "media.gallery": () => api.media.gallery.run(),
  "media.insert": () => api.media.upload.run(),
};
const editorial = {
  projectUrlValue: "https://chatgpt.com/g/g-p-6a423143f52c8191b51816634b536208/project",
  agentPromptValue: [
    "draft-json",
    "",
    "Из source.json ниже, который нужно считать файлом `{{sourceFilename}}` со schema `source.v1`, создай файл `{{draftFilename}}` со schema `draft.v1`.",
    "",
    "Имя результата должно отличаться от имени исходного файла только суффиксом: `_source.json` → `_draft.json`. Timestamp, host и остальную базу имени не меняй.",
    "",
    "Используй `index.md` как маршрутизатор и следуй правилам из `taxonomy.md`, `payload.md`, `editorial.md`, `source.md`, `verification.md`, `rewrite.md`, `titles.md`, `output.md`, `checklist.md` и, если источник содержит данные об изображениях, `photos.md`.",
    "",
    "Перед сборкой `draft.v1` классифицируй материал по `taxonomy.md`. Заполни `draft.v1` строго по `payload.md`, `output.md` и `checklist.md`. Не выдумывай факты; всё непроверенное вынеси в `audit`. Оцени риск близкого рерайта по `rewrite.md`.",
    "",
    "Ответ дай файлом `{{draftFilename}}`. В чат не выводи содержимое JSON.",
    "",
    "После файла первой строкой выведи: `Лучшее место: https://<section>.onliner.by/wp-admin/post-new.php`, где `<section>` — выбранный `target.section`. Если section не определен, выведи `Лучшее место: уточнить раздел`.",
    "",
    "После этого выведи короткий блок `Для автора` на 3–7 пунктов. Используй только важные предупреждения из `audit.fact_check_notes`, `audit.risk_notes` и `audit.editor_todo`. Не пересказывай материал и не дублируй JSON.",
    "",
    "Если файл создать невозможно, выведи только валидный JSON без markdown, code fence, комментариев и текста до/после JSON.",
  ].join("\n"),
  contentSelectors: [
    '[itemprop="articleBody"]',
    '.entry-content .content-inner',
    '.entry-content',
    '.post-content',
    '.article-content',
    '.jeg_inner_content',
    '.content-inner',
    'article',
    'main',
  ],
  noiseSelector: [
    "script",
    "style",
    "noscript",
    "template",
    "iframe",
    "svg",
    "form",
    "nav",
    "header",
    "footer",
    "aside",
    '[role="navigation"]',
    '[role="complementary"]',
    '[class*="sidebar"]',
    '[class*="related"]',
    '[class*="share"]',
    '[class*="reaction"]',
    '[class*="comment"]',
    '[class*="tag"]',
    '[id^="adfox_"]',
    '.jeg_post_tags',
    '.jeg_share_button',
    '.sharethis-inline-reaction-buttons',
    '.jnews_related_post_container',
    '.jeg_custom_prev_next_wrapper',
    '.jeg_postblock',
    '.module-overlay',
  ].join(","),
  blockSelector: "p,h2,h3,h4,blockquote,ul,ol,figure,img",
  meta(name, property = "") {
    const selector = property
      ? `meta[name="${name}"],meta[property="${property}"]`
      : `meta[name="${name}"],meta[property="${name}"]`;
    return document.querySelector(selector)?.getAttribute("content")?.trim() || "";
  },
  clean(value = "") {
    return String(value || "").replace(/\s+/g, " ").trim();
  },
  text(node) {
    return editorial.clean(node?.textContent || "");
  },
  absolute(value = "") {
    try {
      return new URL(String(value || ""), location.href).href;
    } catch {
      return "";
    }
  },
  parseJson(value = "") {
    try {
      return JSON.parse(String(value || ""));
    } catch {
      return null;
    }
  },
  values(value) {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object") return [];
    const graph = Array.isArray(value["@graph"]) ? value["@graph"] : [];
    return [value, ...graph];
  },
  jsonLd() {
    return [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((node) => editorial.parseJson(node.textContent || ""))
      .flatMap(editorial.values)
      .filter(Boolean);
  },
  type(value = {}) {
    const type = value["@type"];
    return Array.isArray(type) ? type.join(" ") : String(type || "");
  },
  articleData() {
    return (
      editorial.jsonLd().find((item) => /(^|\s)(Article|NewsArticle|BlogPosting)(\s|$)/i.test(editorial.type(item))) ||
      editorial.jsonLd().find((item) => typeof item.articleBody === "string") ||
      null
    );
  },
  blockNodes(root) {
    return [...(root?.querySelectorAll?.(editorial.blockSelector) || [])]
      .filter((node) => !node.parentElement?.closest?.(editorial.blockSelector));
  },
  blocksFromHtml(value = "") {
    const template = document.createElement("template");
    template.innerHTML = String(value || "");
    const root = template.content;
    editorial.removeNoise(root);
    const blocks = editorial.blockNodes(root);
    if (blocks.length) return editorial.trimBlocks(blocks);
    const text = editorial.clean(root.textContent || value);
    return text ? [{ text, html: `<p>${editorial.escape(text)}</p>` }] : [];
  },
  removeNoise(root) {
    root?.querySelectorAll?.(editorial.noiseSelector)?.forEach((node) => node.remove());
  },
  escape(value = "") {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },
  safeHref(value = "") {
    const url = editorial.absolute(value);
    if (!url || /^(?:javascript|data):/i.test(url)) return "";
    return url;
  },
  htmlChildren(node) {
    return [...(node?.childNodes || [])].map(editorial.htmlNode).join("");
  },
  htmlNode(node) {
    if (node.nodeType === Node.TEXT_NODE) return editorial.escape(node.textContent || "");
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const tag = String(node.tagName || "").toLowerCase();
    if (tag === "br") return "<br>";
    const body = editorial.htmlChildren(node);
    if (["strong", "em", "b", "i"].includes(tag)) {
      const next = tag === "b" ? "strong" : tag === "i" ? "em" : tag;
      return body ? `<${next}>${body}</${next}>` : "";
    }
    if (tag === "a") {
      const href = editorial.safeHref(node.getAttribute("href") || "");
      return href && body ? `<a href="${editorial.escape(href)}">${body}</a>` : body;
    }
    if (tag === "img") {
      const src = editorial.imageUrl(
        node.getAttribute("src") ||
          node.getAttribute("data-src") ||
          node.getAttribute("data-original") ||
          "",
      );
      if (!src) return "";
      const alt = editorial.escape(node.getAttribute("alt") || "");
      const title = editorial.escape(node.getAttribute("title") || "");
      return `<img src="${editorial.escape(src)}" alt="${alt}"${title ? ` title="${title}"` : ""}>`;
    }
    if (["p", "blockquote", "ul", "ol", "li", "h2", "h3", "h4", "figure"].includes(tag)) {
      return body ? `<${tag}>${body}</${tag}>` : "";
    }
    return body;
  },
  htmlBlock(node) {
    const html = editorial.htmlNode(node).trim();
    if (html) return html;
    const text = editorial.text(node);
    return text ? `<p>${editorial.escape(text)}</p>` : "";
  },
  blockValue(node) {
    const html = editorial.htmlBlock(node);
    return {
      text: editorial.text(node),
      html,
      media: /<img\s/iu.test(html),
    };
  },
  byline(block) {
    const text = editorial.clean(block?.text || "");
    if (!text || text.length > 80) return false;
    if (/[.!?。？！]$/u.test(text)) return false;
    if (/\d/.test(text)) return false;
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > 4) return false;
    return words.some((word) => /^[А-ЯЁA-ZІЎЇЄ]{2,}$/u.test(word));
  },
  bracketedText(value = "") {
    return /[([][^()\[\]]{1,160}[)\]]/u.test(String(value || ""));
  },
  linkDense(block) {
    const text = editorial.clean(block?.text || "");
    if (!text || editorial.bracketedText(text)) return false;
    const html = String(block?.html || "");
    const linkCount = (html.match(/<a\s/giu) || []).length;
    if (!linkCount) return false;
    const words = text.split(/\s+/).filter(Boolean).length;
    return linkCount >= 2 || (linkCount === 1 && words <= 18);
  },
  leadingJunk(block) {
    const text = editorial.clean(block?.text || "");
    if (/^(?:подписаться на|поделиться|читать в|слушать|войти)$/iu.test(text)) return true;
    return editorial.linkDense(block) && !/[.!?。？！]/u.test(text);
  },
  terminalBlock(block) {
    const text = editorial.clean(block?.text || "");
    if (/^(?:об авторе|читайте также:?|смотрите также:?|читайте и подписывайтесь|по теме|в тему|рекомендуем|похожие новости|комментарии|контакты)$/iu.test(text)) {
      return true;
    }
    if (/^©\s*\d{4}/u.test(text)) return true;
    return editorial.linkDense(block) && !/[.!?。？！]/u.test(text);
  },
  articleEnough(items = []) {
    const text = items.map((item) => item.text).join(" ");
    return items.length >= 1 && text.length >= 240;
  },
  trimBlocks(blocks = []) {
    const source = blocks.map(editorial.blockValue).filter((item) => item.text || item.media);
    const items = [];
    source.some((item) => {
      if (!items.length && !item.text) return false;
      if (!items.length && editorial.leadingJunk(item)) return false;
      if (editorial.terminalBlock(item) && editorial.articleEnough(items)) return true;
      items.push(item);
      return false;
    });
    while (items.length > 1 && editorial.byline(items[items.length - 1])) {
      items.pop();
    }
    return items;
  },
  candidate(node) {
    if (!node) return null;
    const clone = node.cloneNode(true);
    editorial.removeNoise(clone);
    const blocks = editorial.trimBlocks(editorial.blockNodes(clone));
    const text = blocks.map((item) => item.text).filter(Boolean).join("\n\n").trim();
    if (!text) return null;
    return {
      node,
      blocks,
      text,
      html: blocks.map((item) => item.html).join("\n").trim(),
      score: editorial.score(node, blocks, text),
    };
  },
  score(node, blocks = [], text = "") {
    const h1 = editorial.clean(document.querySelector("h1")?.textContent || "");
    const headings = [...node.querySelectorAll?.("h1,h2,h3") || []]
      .map(editorial.text)
      .join(" ");
    const titleMatch = h1 && headings.includes(h1) ? 300 : 0;
    const textScore = Math.min(text.length, 5000);
    const blockScore = blocks.length * 120;
    const imageScore = Math.min(node.querySelectorAll?.("img").length || 0, 5) * 40;
    const penalty = node === document.body ? 4000 : 0;
    return textScore + blockScore + imageScore + titleMatch - penalty;
  },
  domArticle() {
    const candidates = editorial.contentSelectors
      .flatMap((selector) => [...document.querySelectorAll(selector)])
      .map(editorial.candidate)
      .filter(Boolean)
      .filter((item) => item.text.length >= 120 || item.blocks.length >= 2)
      .sort((left, right) => right.score - left.score);
    return candidates[0] || editorial.candidate(document.body);
  },
  articleContent() {
    const data = editorial.articleData();
    if (typeof data?.articleBody === "string" && editorial.clean(data.articleBody)) {
      const blocks = editorial.blocksFromHtml(data.articleBody);
      const text = blocks.map((item) => item.text).filter(Boolean).join("\n\n").trim();
      return {
        text,
        html: blocks.map((item) => item.html).join("\n").trim(),
        node: editorial.domArticle()?.node || document.body,
        data,
      };
    }
    const dom = editorial.domArticle();
    return {
      text: dom?.text || "",
      html: dom?.html || "",
      node: dom?.node || document.body,
      data,
    };
  },
  author(data = null) {
    const value = data?.author;
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.map((item) => item?.name || "").filter(Boolean).join(", ");
    return (
      value?.name ||
      editorial.meta("author", "article:author") ||
      ""
    );
  },
  image(node) {
    const src =
      node?.currentSrc ||
      node?.src ||
      node?.getAttribute?.("src") ||
      node?.getAttribute?.("data-src") ||
      "";
    const url = editorial.absolute(src);
    if (!url || /^data:/i.test(url)) return null;
    const figure = node.closest?.("figure") || null;
    return {
      src: url,
      alt: String(node.getAttribute?.("alt") || "").trim(),
      title: String(node.getAttribute?.("title") || "").trim(),
      caption: editorial.text(figure?.querySelector?.("figcaption")),
    };
  },
  imageUrl(value = "") {
    const url = editorial.absolute(value);
    if (!url || /^data:/i.test(url)) return "";
    if (/\.(?:avif|gif|jpe?g|png|webp)(?:[?#]|$)/i.test(url)) return url;
    return "";
  },
  dataImage(value) {
    if (!value) return null;
    const image = typeof value === "string" ? { url: value } : value;
    const url = editorial.imageUrl(image.url || image.contentUrl || "");
    if (!url) return null;
    return {
      src: url,
      alt: "",
      title: "",
      caption: "",
    };
  },
  metaImage() {
    const url = editorial.imageUrl(
      editorial.meta("og:image") ||
        editorial.meta("twitter:image") ||
        "",
    );
    return url
      ? {
          src: url,
          alt: "",
          title: "",
          caption: "",
        }
      : null;
  },
  imageRelevant(item = {}, title = "") {
    const src = String(item.src || "");
    if (!src || /(?:avatar|logo|banner|icon|share|flags?|vajber|telega|insta)/i.test(src)) return false;
    const haystack = editorial.clean(`${item.alt || ""} ${item.title || ""} ${item.caption || ""}`).toLowerCase();
    const words = editorial.clean(title)
      .toLowerCase()
      .split(/[^a-zа-яё0-9]+/iu)
      .filter((word) => word.length >= 5);
    if (!words.length) return true;
    return words.some((word) => haystack.includes(word));
  },
  imageJunk(item = {}) {
    return /(?:avatar|logo|banner|icon|share|flags?|vajber|telega|insta|author)/i.test(String(item.src || ""));
  },
  htmlImage(node) {
    const src = editorial.imageUrl(node?.getAttribute?.("src") || "");
    if (!src) return null;
    const figure = node.closest?.("figure") || null;
    const item = {
      src,
      alt: editorial.clean(node.getAttribute("alt") || ""),
      title: editorial.clean(node.getAttribute("title") || ""),
      caption: editorial.clean(figure?.textContent || ""),
    };
    return editorial.imageJunk(item) ? null : item;
  },
  imagesFromHtml(value = "") {
    const template = document.createElement("template");
    template.innerHTML = String(value || "");
    editorial.removeNoise(template.content);
    const blocks = editorial.blockNodes(template.content);
    const root = document.createElement("div");
    root.innerHTML = blocks.length
      ? editorial.trimBlocks(blocks).map((item) => item.html).join("\n")
      : template.innerHTML;
    return [...root.querySelectorAll("img[src]")]
      .map(editorial.htmlImage)
      .filter(Boolean);
  },
  link(node) {
    const href = editorial.safeHref(node?.getAttribute?.("href") || "");
    if (!href) return null;
    const image = node?.querySelector?.("img") || null;
    return {
      href,
      text: editorial.text(node) ||
        editorial.clean(image?.getAttribute?.("alt") || image?.getAttribute?.("title") || "") ||
        href,
    };
  },
  linksFromHtml(value = "") {
    const template = document.createElement("template");
    template.innerHTML = String(value || "");
    editorial.removeNoise(template.content);
    const blocks = editorial.blockNodes(template.content);
    const root = document.createElement("div");
    root.innerHTML = blocks.length
      ? editorial.trimBlocks(blocks).map((item) => item.html).join("\n")
      : template.innerHTML;
    return [...root.querySelectorAll("a[href]")]
      .map(editorial.link)
      .filter(Boolean)
      .filter((item) => item.text);
  },
  unique(list = [], key) {
    const seen = new Set();
    return list.filter((item) => {
      const value = key(item);
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  },
  imageExtension(value = "", type = "") {
    const mime = String(type || "").match(/image\/(avif|gif|jpeg|jpg|png|webp)/i)?.[1] || "";
    if (mime) return mime === "jpeg" ? "jpg" : mime.toLowerCase();
    try {
      const path = new URL(String(value || ""), location.href).pathname;
      return path.match(/\.(avif|gif|jpe?g|png|webp)$/i)?.[1]?.replace(/^jpeg$/i, "jpg").toLowerCase() || "jpg";
    } catch {
      return "jpg";
    }
  },
  mediaName(index = 0, item = {}) {
    return `${String(index + 1).padStart(3, "0")}.${editorial.imageExtension(item.src)}`;
  },
  withMediaNames(value) {
    const images = (value?.source?.images || []).map((item, index) => ({
      ...item,
      local_name: item.local_name || editorial.mediaName(index, item),
    }));
    return {
      ...value,
      source: {
        ...value.source,
        images,
      },
    };
  },
  telegramWeb() {
    return location.hostname.toLowerCase() === "web.telegram.org";
  },
  telegramLink(value = "") {
    try {
      const url = new URL(String(value || "").trim());
      if (!/^(?:www\.)?(?:t\.me|telegram\.me)$/i.test(url.hostname)) return null;
      const parts = url.pathname.split("/").filter(Boolean);
      const offset = parts[0] === "s" ? 1 : 0;
      const channel = parts[offset] || "";
      const id = parts[offset + 1] || "";
      if (!channel || !/^\d+$/.test(id) || channel === "c") return null;
      return {
        channel,
        id,
        url: `https://t.me/${channel}/${id}`,
        webUrl: `https://t.me/s/${channel}/${id}`,
      };
    } catch {
      return null;
    }
  },
  telegramPost() {
    return editorial.telegramLink(location.href);
  },
  telegramMessageNode(post = editorial.telegramPost()) {
    if (!post) return null;
    const exact = `${post.channel}/${post.id}`;
    return (
      document.querySelector(`.tgme_widget_message[data-post="${exact}"]`) ||
      document.querySelector(`.tgme_widget_message[data-post$="/${post.id}"]`) ||
      document.querySelector(".tgme_widget_message")
    );
  },
  telegramTitle(node = null, text = "") {
    const channel = editorial.text(
      node?.querySelector?.(".tgme_widget_message_owner_name") ||
        document.querySelector(".tgme_channel_info_header_title"),
    );
    const lead = editorial.clean(text).slice(0, 90);
    return [channel, lead].filter(Boolean).join(" — ");
  },
  telegramText(node = null) {
    const textNode = node?.querySelector?.(".tgme_widget_message_text") || null;
    return String(textNode?.innerText || textNode?.textContent || "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  },
  telegramHtml(node = null) {
    const textNode = node?.querySelector?.(".tgme_widget_message_text") || null;
    const html = editorial.htmlChildren(textNode).trim();
    return html ? `<p>${html}</p>` : "";
  },
  styleImage(value = "") {
    const match = String(value || "").match(/url\(["']?([^"')]+)["']?\)/i);
    return editorial.imageUrl(match?.[1] || "");
  },
  telegramMedia(node = null) {
    const backgrounds = [
      ...(node?.querySelectorAll?.(".tgme_widget_message_photo_wrap,.tgme_widget_message_video_thumb") || []),
    ];
    const images = [...(node?.querySelectorAll?.("img") || [])];
    return editorial.unique(
      [
        ...backgrounds
          .map((item) => editorial.styleImage(item.style?.backgroundImage || item.getAttribute("style") || ""))
          .filter(Boolean)
          .map((src) => ({ src, alt: "", title: "", caption: "" })),
        ...images.map(editorial.image).filter(Boolean),
      ],
      (item) => item.src,
    );
  },
  sourceClipboardKey: "launchpad-editorial-source-link",
  sourceLink(value = "") {
    try {
      const url = new URL(String(value || "").trim());
      if (!/^https?:$/i.test(url.protocol)) return null;
      const post = editorial.telegramLink(url.href);
      if (post) {
        return {
          kind: "telegram-post",
          url: post.webUrl,
        };
      }
      return {
        kind: "web-source",
        url: url.href,
      };
    } catch {
      return null;
    }
  },
  rememberSourceLink(value = "") {
    const link = editorial.sourceLink(value);
    if (!link) return null;
    sessionStorage.setItem(editorial.sourceClipboardKey, link.url);
    return link;
  },
  rememberedSourceLink() {
    return editorial.sourceLink(sessionStorage.getItem(editorial.sourceClipboardKey) || "");
  },
  async clipboardSourceLink() {
    try {
      const value = await navigator.clipboard.readText();
      return editorial.rememberSourceLink(value);
    } catch {
      return editorial.rememberedSourceLink();
    }
  },
  async openClipboardSource() {
    const link = await editorial.clipboardSourceLink();
    if (!link) {
      alert("Скопируй ссылку на пост Telegram или внешний источник и запусти Источник еще раз.");
      return false;
    }
    window.open(link.url, "_blank", "noopener,noreferrer");
    return true;
  },
  buildTelegramSource() {
    const post = editorial.telegramPost();
    const node = editorial.telegramMessageNode(post);
    const text = editorial.telegramText(node);
    const html = editorial.telegramHtml(node);
    const title = editorial.telegramTitle(node, text) || document.title || "Telegram post";
    const time = node?.querySelector?.("time[datetime]")?.getAttribute("datetime") || "";
    const url = post ? `https://t.me/${post.channel}/${post.id}` : location.href;
    return {
      schema: "source.v1",
      mode: "source-news",
      target: {
        section: "",
        layout: "news",
        language: "ru",
        length: "short",
      },
      source: {
        kind: "telegram-post",
        url,
        canonical_url: url,
        site: "t.me",
        title: editorial.clean(title),
        description: editorial.clean(editorial.meta("description", "og:description")),
        published_at: time,
        updated_at: "",
        author: editorial.text(node?.querySelector?.(".tgme_widget_message_owner_name")),
        text,
        html,
        images: editorial.telegramMedia(node),
        links: editorial.unique(editorial.linksFromHtml(html), (item) => item.href),
      },
      editor: { notes: "" },
    };
  },
  buildSource() {
    if (editorial.telegramPost()) return editorial.buildTelegramSource();
    const article = editorial.articleContent();
    const data = article.data || editorial.articleData();
    const node = article.node || document.body;
    const canonical = document.querySelector('link[rel="canonical"]')?.href || "";
    const title =
      data?.headline ||
      data?.name ||
      editorial.meta("og:title") ||
      editorial.meta("twitter:title") ||
      document.title ||
      "";
    const description =
      data?.description ||
      editorial.meta("description", "og:description") ||
      editorial.meta("twitter:description") ||
      "";
    const dataImages = Array.isArray(data?.image) ? data.image : [data?.image];
    const images = editorial.unique(
      [
        ...dataImages.map(editorial.dataImage).filter(Boolean),
        editorial.metaImage(),
        ...editorial.imagesFromHtml(article.html),
        ...[...(node?.querySelectorAll?.("img") || [])]
          .map(editorial.image)
          .filter(Boolean)
          .filter((item) => editorial.imageRelevant(item, title)),
      ].filter(Boolean),
      (item) => item.src,
    );
    const links = editorial.unique(
      editorial.linksFromHtml(article.html),
      (item) => item.href,
    );
    return {
      schema: "source.v1",
      mode: "source-news",
      target: {
        section: "",
        layout: "news",
        language: "ru",
        length: "short",
      },
      source: {
        kind: "web-article",
        url: location.href,
        canonical_url: canonical || location.href,
        site: location.hostname.replace(/^www\./i, ""),
        title: editorial.clean(title),
        description: editorial.clean(description),
        published_at: data?.datePublished || editorial.meta("article:published_time"),
        updated_at: data?.dateModified || editorial.meta("article:modified_time"),
        author: editorial.clean(editorial.author(data)),
        text: article.text,
        html: article.html,
        images,
        links,
      },
      editor: { notes: "" },
    };
  },
  async mediaFile(item = {}) {
    const src = String(item.src || "");
    if (!src) return null;
    try {
      const response = await fetch(src, { credentials: "omit" });
      if (!response.ok) return null;
      const blob = await response.blob();
      if (!/^image\//i.test(blob.type || "")) return null;
      const name = item.local_name || editorial.mediaName(0, item);
      return {
        name: name.replace(/\.[^.]+$/, `.${editorial.imageExtension(src, blob.type)}`),
        blob,
        src,
      };
    } catch {
      return null;
    }
  },
  async mediaFiles(payload = {}) {
    const images = (payload?.source?.images || []).slice(0, 12);
    const settled = await Promise.all(images.map((item) => editorial.mediaFile(item)));
    const files = settled.filter(Boolean);
    const downloaded = new Set(files.map((item) => item.src));
    const skipped = images
      .filter((item) => !downloaded.has(item.src))
      .map((item) => ({
        src: item.src,
        reason: "fetch failed or blocked",
      }));
    return { files, skipped };
  },
  zipFolder(name = "") {
    return String(name || editorial.mediaFilename())
      .replace(/\.zip$/i, "")
      .replace(/[^a-z0-9._-]+/gi, "_")
      .replace(/^_+|_+$/g, "") || "media";
  },
  async zipBlob(files = [], folder = "") {
    const encoder = new TextEncoder();
    const table = editorial.crcTable();
    const local = [];
    const central = [];
    let offset = 0;
    const prefix = editorial.zipFolder(folder);
    for (const file of files) {
      const filename = String(file.name || "").replace(/^\/+/, "");
      if (!filename) continue;
      const name = encoder.encode(`${prefix}/${filename}`);
      const data = new Uint8Array(await file.blob.arrayBuffer());
      const crc = editorial.crc32(data, table);
      const header = editorial.zipLocalHeader(name, data, crc);
      local.push(header, data);
      central.push(editorial.zipCentralHeader(name, data, crc, offset));
      offset += header.length + data.length;
    }
    const centralSize = central.reduce((sum, item) => sum + item.length, 0);
    return new Blob([
      ...local,
      ...central,
      editorial.zipEnd(central.length, centralSize, offset),
    ], { type: "application/zip" });
  },
  crcTable() {
    if (editorial.crcTableValue) return editorial.crcTableValue;
    editorial.crcTableValue = Array.from({ length: 256 }, (_, index) => {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) {
        value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      }
      return value >>> 0;
    });
    return editorial.crcTableValue;
  },
  crc32(data, table) {
    let value = 0xffffffff;
    data.forEach((byte) => {
      value = table[(value ^ byte) & 0xff] ^ (value >>> 8);
    });
    return (value ^ 0xffffffff) >>> 0;
  },
  zipDate(date = new Date()) {
    return {
      time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
      date: ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    };
  },
  zipWrite(view, offset, values = []) {
    values.forEach((item) => {
      view[item.size === 2 ? "setUint16" : "setUint32"](offset, item.value, true);
      offset += item.size;
    });
    return offset;
  },
  zipLocalHeader(name, data, crc) {
    const stamp = editorial.zipDate();
    const buffer = new ArrayBuffer(30 + name.length);
    const view = new DataView(buffer);
    const offset = editorial.zipWrite(view, 0, [
      { size: 4, value: 0x04034b50 },
      { size: 2, value: 20 },
      { size: 2, value: 0 },
      { size: 2, value: 0 },
      { size: 2, value: stamp.time },
      { size: 2, value: stamp.date },
      { size: 4, value: crc },
      { size: 4, value: data.length },
      { size: 4, value: data.length },
      { size: 2, value: name.length },
      { size: 2, value: 0 },
    ]);
    new Uint8Array(buffer).set(name, offset);
    return new Uint8Array(buffer);
  },
  zipCentralHeader(name, data, crc, localOffset) {
    const stamp = editorial.zipDate();
    const buffer = new ArrayBuffer(46 + name.length);
    const view = new DataView(buffer);
    const offset = editorial.zipWrite(view, 0, [
      { size: 4, value: 0x02014b50 },
      { size: 2, value: 20 },
      { size: 2, value: 20 },
      { size: 2, value: 0 },
      { size: 2, value: 0 },
      { size: 2, value: stamp.time },
      { size: 2, value: stamp.date },
      { size: 4, value: crc },
      { size: 4, value: data.length },
      { size: 4, value: data.length },
      { size: 2, value: name.length },
      { size: 2, value: 0 },
      { size: 2, value: 0 },
      { size: 2, value: 0 },
      { size: 2, value: 0 },
      { size: 4, value: 0 },
      { size: 4, value: localOffset },
    ]);
    new Uint8Array(buffer).set(name, offset);
    return new Uint8Array(buffer);
  },
  zipEnd(count, size, offset) {
    const buffer = new ArrayBuffer(22);
    editorial.zipWrite(new DataView(buffer), 0, [
      { size: 4, value: 0x06054b50 },
      { size: 2, value: 0 },
      { size: 2, value: 0 },
      { size: 2, value: count },
      { size: 2, value: count },
      { size: 4, value: size },
      { size: 4, value: offset },
      { size: 2, value: 0 },
    ]);
    return new Uint8Array(buffer);
  },
  async downloadMedia(name, payload = {}) {
    const { files } = await editorial.mediaFiles(payload);
    if (!files.length) return false;
    const blob = await editorial.zipBlob(files, name);
    editorial.downloadBlob(name, blob);
    return true;
  },
  pad(value) {
    return String(value).padStart(2, "0");
  },
  stamp(date = new Date()) {
    return [
      date.getFullYear(),
      editorial.pad(date.getMonth() + 1),
      editorial.pad(date.getDate()),
      "_",
      editorial.pad(date.getHours()),
      editorial.pad(date.getMinutes()),
    ].join("");
  },
  filename() {
    const host = location.hostname.replace(/^www\./i, "") || "source";
    return `${editorial.stamp()}_${host}_source.json`;
  },
  mediaFilename(name = "") {
    return String(name || editorial.filename()).replace(/_source\.json$/i, "_media.zip");
  },
  draftFilename(name = "") {
    return String(name || editorial.filename()).replace(/_source\.json$/i, "_draft.json");
  },
  json(value) {
    return JSON.stringify(value, null, 2);
  },
  downloadBlob(name, blob) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = name;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 1000);
  },
  download(name, value) {
    editorial.downloadBlob(
      name,
      new Blob([value], { type: "application/json;charset=utf-8" }),
    );
  },
  async copy(value) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  },
  projectUrl() {
    return editorial.projectUrlValue;
  },
  agentPrompt(sourceName = "") {
    const sourceFilename = String(sourceName || editorial.filename());
    const draftFilename = editorial.draftFilename(sourceFilename);
    return editorial.agentPromptValue
      .split("{{sourceFilename}}")
      .join(sourceFilename)
      .split("{{draftFilename}}")
      .join(draftFilename);
  },
  agentPayload(value, sourceName = "") {
    const sourceFilename = String(sourceName || editorial.filename());
    return [
      editorial.agentPrompt(sourceFilename),
      "",
      "## source file",
      "",
      "`" + sourceFilename + "`",
      "",
      "## source.json",
      "",
      "```json",
      String(value || ""),
      "```",
    ].join("\n");
  },
  async source() {
    if (editorial.telegramWeb()) return editorial.openClipboardSource();
    const name = editorial.filename();
    const payload = editorial.withMediaNames(editorial.buildSource());
    editorial.download(name, editorial.json(payload));
    editorial.downloadMedia(editorial.mediaFilename(name), payload);
    return true;
  },
  async agent() {
    if (editorial.telegramWeb()) return editorial.openClipboardSource();
    const name = editorial.filename();
    const payload = editorial.withMediaNames(editorial.buildSource());
    const media = editorial.downloadMedia(editorial.mediaFilename(name), payload);
    await editorial.copy(editorial.agentPayload(editorial.json(payload), name));
    const url = editorial.projectUrl();
    if (!url) return false;
    window.open(url, "_blank", "noopener,noreferrer");
    media.catch(() => false);
    return true;
  },
};

if (location.hostname.toLowerCase() === "web.telegram.org") {
  document.addEventListener("copy", () => {
    setTimeout(() => {
      editorial.clipboardSourceLink();
    }, 0);
  });
}

const editorialActions = {
  "editorial.source": () => editorial.source(),
  "editorial.agent": () => editorial.agent(),
  "editorial.draft": () => api.admin.draft.run(),
};
const visualEditorActions = new Set([
  "italic",
  "bold",
  "list",
]);
const actionMap = {
  ...editorActions,
  ...textActions,
  ...contentActions,
  ...markupActions,
  ...searchActions,
  ...fieldActions,
  ...auditActions,
  ...cleanupActions,
  ...adminActions,
  ...onlinerActions,
  ...projectHomeActions,
  ...sessionActions,
  ...feedbackActions,
  ...proofreadActions,
  ...mediaActions,
  ...editorialActions,
};
const active = {
  element(run) {
    const element = api.element();
    return element && typeof run === "function" ? run(element) : false;
  },
  editor(run) {
    const element = api.element();
    if (element && typeof run === "function") return run(element);
    if (api.editor?.visual?.() && typeof run === "function") return run(null);
    return false;
  },
};
const activeMap = {
  "media.upload": () => api.media.upload.active(),
  "nbsp": () => active.element((element) => api.chars.state(element, "nbsp")),
  "comma": () => active.element((element) => api.chars.state(element, "comma")),
  "colon": () => active.element((element) => api.chars.state(element, "colon")),
  "dash": () => active.element((element) => api.chars.state(element, "dash")),
  "quote": () => active.element((element) => api.chars.state(element, "quote")),
  "punct": () => false,
  "token": () => active.element((element) => api.tokenActive(element)),
  "italic": () => active.editor((element) => api.markup.inlineActive(element, { mode: "italic" })),
  "bold": () => active.editor((element) => api.markup.inlineActive(element, { mode: "bold" })),
  inline: () => active.editor((element) => api.markup.inlineActive(element, { mode: "cycle" })),
  block: () => active.editor((element) => api.markup.blockActive(element)),
};



// === separate bridge (minimal) ===
api.separate = {
  handlers: {},
  register(type, fn) {
    this.handlers[type] = fn;
  },
  run(type, payload) {
    const handler = this.handlers[type];
    if (!handler) return false;
    return handler(payload);
  },
};

window.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;
  return api.separate.run(data.type, data.payload);
});

export const actions = {
  ...api,
  has(id) {
    const value = String(id || "");
    return Boolean(actionMap[value]);
  },
  active(id) {
    const value = String(id || "");
    const active = activeMap[value];
    if (active) return Boolean(active());
    return Boolean(api.state()[value]);
  },
  run(id, options = {}) {
    const value = String(id || "");
    const action = actionMap[value];
    if (!action) return false;
    if (editorActions[value]) {
      const element = api.element();
      if (element) return action(element, options);
      if (api.editor?.visual?.() && visualEditorActions.has(value)) {
        return action(null, options);
      }
      return false;
    }
    return action(options);
  },
};
