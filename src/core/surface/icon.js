const text = {
  escape(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },
};
const url = {
  fluent(name, size = 20) {
    return `https://raw.githubusercontent.com/microsoft/fluentui-system-icons/main/assets/${name}/SVG/ic_fluent_${name.toLowerCase().replaceAll(" ", "_")}_${size}_regular.svg`;
  },
  noto(value, code) {
    const symbols = code(value)
      .split("-")
      .map((part) => `u${part.padStart(4, "0")}`)
      .join("_");
    return `https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@main/svg/emoji_${symbols}.svg`;
  },
  twemoji(value, code) {
    return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${code(value)}.svg`;
  },
};
const emoji = {
  pack: "fluent-emoji-flat",
  name(value) {
    const current = String(value || "").trim().toLowerCase();
    const name = current
      .replace(/^fluent-emoji-flat:/, "")
      .replace(/^emoji:/, "")
      .replace(/[_\s]+/g, "-");
    if (!/^[a-z0-9-]+$/.test(name)) return "";
    return name;
  },
  code(value) {
    return [...String(value || "")]
      .map((symbol) => symbol.codePointAt(0).toString(16))
      .filter((symbol) => symbol !== "fe0f")
      .join("-");
  },
  url(value) {
    const name = emoji.name(value);
    if (!name) return "";
    return `https://api.iconify.design/${emoji.pack}:${name}.svg`;
  },
  fallback(value) {
    const current = String(value || "").trim();
    if (["default", "launcher", "reader"].includes(current)) return "";
    return current;
  },
  html(value, fallback = "") {
    const name = emoji.name(value);
    const safeFallback = text.escape(emoji.fallback(fallback) || value);
    if (!name) return safeFallback;
    const source = emoji.url(name);
    const safeName = text.escape(name);
    const onerror = `this.onerror=null;this.closest('.emoji').outerHTML='${safeFallback || safeName}'`;
    return `<span class="emoji" data-emoji="${safeName}" style="width:1em;height:1em;display:inline-block;vertical-align:-0.12em;"><img alt="${safeFallback || safeName}" src="${source}" onerror="${onerror}" style="width:100%;height:100%;display:block;"></span>`;
  },
};
const wait = {
  frames: [
    "Hourglass One Quarter",
    "Hourglass Half",
    "Hourglass Half",
    "Hourglass One Quarter",
  ],
  glyph(name = "", fallback = "Hourglass") {
    const primary = url.fluent(name, 20);
    const backup = url.fluent(fallback, 20);
    return `<img class="ui-wait-glyph toolbar-icon" src="${primary}" alt="" onerror="this.onerror=null;this.src='${backup}'">`;
  },
  stage(index = 0) {
    const size = wait.frames.length;
    const value = Number(index) || 0;
    return wait.frames[((value % size) + size) % size] || wait.frames[0];
  },
  frame(index = 0) {
    const name = wait.stage(index);
    return wait.glyph(name);
  },
  html() {
    return `
      <span class="ui-wait" data-ui-wait="true" aria-hidden="true">
        <span class="ui-wait-shell">
          ${wait.frames
            .map(
              (name, index) =>
                `<span class="ui-wait-frame" data-ui-wait-frame="${index + 1}">${wait.glyph(name)}</span>`,
            )
            .join("")}
        </span>
      </span>
    `;
  },
};
const site = {
  google: { domain: "google.com", alt: "Google" },
  yandex: {
    domain: "ya.ru",
    alt: "Yandex",
    source: "assets/images/yandex.svg",
  },
  gramota: { domain: "gramota.ru", alt: "Грамота" },
  kinopoisk: { domain: "kinopoisk.ru", alt: "Кинопоиск" },
  onliner: {
    domain: "onliner.by",
    alt: "Onlíner",
    source: "assets/images/onliner-logo.svg",
  },
  wordpress: {
    domain: "wordpress.org",
    alt: "WordPress",
    source: "assets/images/wordpress-logo.svg",
  },
  "wordpress-logo": {
    domain: "wordpress.org",
    alt: "WordPress",
    source: "assets/images/wordpress-logo.svg",
  },
  gemini: {
    domain: "google.com",
    alt: "Gemini",
    source: "assets/images/gemini.svg",
  },
  chatgpt: {
    domain: "chatgpt.com",
    alt: "ChatGPT",
    source: "assets/images/chatgpt.svg",
  },
  copilot: {
    domain: "bing.com",
    alt: "Copilot",
    source: "assets/images/copilot.svg",
  },
  languagetool: { domain: "languagetool.org", alt: "LanguageTool" },
  qwen: {
    domain: "qwen.com",
    alt: "Qwen",
    source: "assets/images/qwen.svg",
  },
};
const logo = {
  site,
  escape(value) {
    return text.escape(value);
  },
  asset(value) {
    const current = String(value || "").trim();
    if (!current) return "";
    if (/^(?:https?:)?\/\//i.test(current) || /^data:/i.test(current)) {
      return current;
    }
    if (typeof document === "undefined") return current;
    const active =
      document.currentScript?.src ||
      [...document.querySelectorAll("script[src]")]
        .map((node) => node?.src || "")
        .find((src) => /\/dist\/launchpad\.js(?:\?|$)/i.test(src)) ||
      [...document.querySelectorAll("script[src]")]
        .map((node) => node?.src || "")
        .find((src) => /\/dist\/[a-z0-9-]+\.js(?:\?|$)/i.test(src)) ||
      "";
    if (!active) return current;
    const base = new URL(`../${current.replace(/^\/+/, "")}`, active);
    const version = new URL(active).searchParams.get("t") || "";
    if (version) {
      base.searchParams.set("v", version);
    }
    return base.href;
  },
  domain(value) {
    const current = String(value || "").trim();
    if (!current) return "";
    const item = site[current.toLowerCase()];
    if (item?.domain) return item.domain;
    return current
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split(/[/?#]/)[0]
      .trim();
  },
  meta(value) {
    const current = String(value || "").trim();
    if (!current) return null;
    const item = site[current.toLowerCase()];
    if (item?.domain) return item;
    const domain = logo.domain(current);
    if (!domain) return null;
    return {
      domain,
      alt: current,
    };
  },
  url(value) {
    return /^(?:https?:)?\/\//i.test(value) || /^data:/i.test(value);
  },
  script(value) {
    return String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\r?\n/g, "");
  },
  favicon(domain, alt = "", className = "", fallback = "") {
    const safeAlt = logo.escape(alt || domain || "");
    const safeClass = logo.escape(className).trim();
    const classes = ["toolbar-logo", safeClass].filter(Boolean).join(" ");
    const classAttr = classes ? ` class="${classes}"` : "";
    const currentDomain = logo.domain(domain);
    const host = encodeURIComponent(currentDomain);
    const direct = `https://${currentDomain}/favicon.ico`;
    const primary = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https%3A%2F%2F${host}&size=64`;
    const backup = `https://icons.duckduckgo.com/ip3/${host}.ico`;
    const final = `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
    const safeFallback = logo.escape(fallback);
    const emojiFallback = logo.url(fallback)
      ? ""
      : logo.script(icon.emoji(fallback, alt || currentDomain));
    const onerror = safeFallback
      ? logo.url(fallback)
        ? `if(!this.dataset.err){this.dataset.err='1';this.src='${primary}';return;}if(!this.dataset.err2){this.dataset.err2='1';this.src='${backup}';return;}if(!this.dataset.err3){this.dataset.err3='1';this.src='${final}';return;}this.onerror=null;this.src='${safeFallback}'`
        : `if(!this.dataset.err){this.dataset.err='1';this.src='${primary}';return;}if(!this.dataset.err2){this.dataset.err2='1';this.src='${backup}';return;}if(!this.dataset.err3){this.dataset.err3='1';this.src='${final}';return;}this.onerror=null;this.outerHTML='${emojiFallback}'`
      : `if(!this.dataset.err){this.dataset.err='1';this.src='${primary}';return;}if(!this.dataset.err2){this.dataset.err2='1';this.src='${backup}';return;}this.onerror=null;this.src='${final}'`;
    return `<img${classAttr} src="${direct}" alt="${safeAlt}" loading="lazy" decoding="async" draggable="false" ondragstart="return false" onerror="${onerror}">`;
  },
  image(source, alt = "", className = "") {
    const safeAlt = logo.escape(alt || "");
    const safeClass = logo.escape(className).trim();
    const classes = ["toolbar-logo", safeClass].filter(Boolean).join(" ");
    const classAttr = classes ? ` class="${classes}"` : "";
    const safeSource = logo.escape(logo.asset(source));
    return `<img${classAttr} src="${safeSource}" alt="${safeAlt}" loading="lazy" decoding="async" draggable="false" ondragstart="return false">`;
  },
  source(name, className = "") {
    const current = logo.meta(name);
    if (current?.source) {
      return logo.image(current.source, current.alt || name, className);
    }
    if (!current?.domain) return "";
    return logo.favicon(current.domain, current.alt || name, className);
  },
  html(value, alt = "", className = "") {
    const current = logo.meta(value);
    if (current?.source) {
      return logo.image(current.source, alt || current.alt || value, className);
    }
    if (!current?.domain) return "";
    return logo.favicon(current.domain, alt || current.alt || value, className);
  },
};
const icon = {
  url: {
    fluent(name, size = 20) {
      return url.fluent(name, size);
    },
    noto(value) {
      return url.noto(value, emoji.code);
    },
    twemoji(value) {
      return url.twemoji(value, emoji.code);
    },
  },
  emojis: emoji,
  fluent(name) {
    return icon.url.fluent(name);
  },
  fluentFallback(name) {
    return [
      icon.url.fluent(name),
      icon.url.fluent(`${name} 24`),
      icon.url.fluent(`${name} 16`),
    ];
  },
  resolve(value) {
    const name = emoji.name(value);
    if (!name) return null;
    return { name };
  },
  symbol(value, fallback = "") {
    return emoji.name(value) || fallback;
  },
  emoji(value, fallback = "") {
    return emoji.html(value, fallback);
  },
  wait: Object.assign(
    (index = 0) => wait.frame(index),
    wait,
  ),
  image(source, alt = "", className = "") {
    return logo.image(source, alt, className);
  },
  theme(theme) {
    return icon.emoji(theme === "dark" ? "full-moon" : "new-moon");
  },
  logo: Object.assign(
    (value, alt = "", className = "") => logo.html(value, alt, className),
    logo,
  ),
};
export { icon };
