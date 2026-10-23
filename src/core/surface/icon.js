const text = {
  escape(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },
};
const asset = {
  active() {
    if (typeof document === "undefined") return "";
    return (
      document.currentScript?.src ||
      [...document.querySelectorAll("script[src]")]
        .map((node) => node?.src || "")
        .find((src) => /\/dist\/launchpad\.js(?:\?|$)/i.test(src)) ||
      [...document.querySelectorAll("script[src]")]
        .map((node) => node?.src || "")
        .find((src) => /\/dist\/[a-z0-9-]+\.js(?:\?|$)/i.test(src)) ||
      ""
    );
  },
  resolve(value) {
    const current = String(value || "").trim();
    if (!current) return "";
    if (/^(?:https?:)?\/\//i.test(current) || /^data:/i.test(current)) {
      return current;
    }
    const active = asset.active();
    if (!active) return current;
    const base = new URL(`../${current.replace(/^\/+/, "")}`, active);
    const version = new URL(active).searchParams.get("t") || "";
    if (version) base.searchParams.set("v", version);
    return base.href;
  },
  fluentSize(value) {
    const current = Number(value) || 20;
    const sizes = {
      16: 16,
      18: 20,
      20: 20,
      22: 24,
      24: 24,
      28: 28,
      60: 48,
    };
    return sizes[current] || current;
  },
};
const url = {
  fluent(name, size = 20) {
    const current = String(name || "").trim();
    if (!current) return "";
    const file = `${current.toLowerCase().replace(/[\s-]+/g, "_")}_${asset.fluentSize(size)}_regular.svg`;
    return asset.resolve(`assets/icons/fluent/${file}`);
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
const fallback = {
  html(label = "", className = "toolbar-icon") {
    const current = String(label || "").trim();
    const initial = current ? Array.from(current)[0].toUpperCase() : "?";
    const classes = ["ui-glyph-fallback", className].filter(Boolean).join(" ");
    const safeClass = text.escape(classes);
    const safeTitle = text.escape(current || "icon");
    const safeInitial = text.escape(initial);
    return `<span class="${safeClass}" title="${safeTitle}" aria-hidden="true" style="display:inline-flex;align-items:center;justify-content:center;font:700 10px/1 Arial,sans-serif;">${safeInitial}</span>`;
  },
  script(label = "", className = "toolbar-icon") {
    return fallback.html(label, className)
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/"/g, "&quot;")
      .replace(/\r?\n/g, "");
  },
  glyph(primary = "", backup = "", label = "", className = "toolbar-icon") {
    const safeBackup = fallback.script(label || backup || primary, className);
    if (!backup || primary === backup) {
      return `this.onerror=null;this.outerHTML='${safeBackup}'`;
    }
    return `if(!this.dataset.glyphBackup){this.dataset.glyphBackup='1';this.src='${backup}';return;}this.onerror=null;this.outerHTML='${safeBackup}'`;
  },
};
const emoji = {
  pack: "fluent-emoji-flat",
  native: {
    "b-button-blood-type": "\u{1F171}\uFE0F",
    "balance-scale": "\u2696\uFE0F",
    "black-nib": "\u2712\uFE0F",
    "bookmark-tabs": "\u{1F4D1}",
    bookmark: "\u{1F516}",
    books: "\u{1F4DA}",
    briefcase: "\u{1F4BC}",
    broom: "\u{1F9F9}",
    "camera-with-flash": "\u{1F4F8}",
    calendar: "\u{1F4C5}",
    "check-mark-button": "\u2705",
    "control-knobs": "\u{1F39B}\uFE0F",
    "counterclockwise-arrows-button": "\u{1F504}",
    crayon: "\u{1F58D}\uFE0F",
    cyclone: "\u{1F300}",
    "cross-mark": "\u274C",
    "desktop-computer": "\u{1F5A5}\uFE0F",
    "evergreen-tree": "\u{1F332}",
    "fire-extinguisher": "\u{1F9EF}",
    firecracker: "\u{1F9E8}",
    "floppy-disk": "\u{1F4BE}",
    "fountain-pen": "\u{1F58B}\uFE0F",
    "framed-picture": "\u{1F5BC}\uFE0F",
    "full-moon": "\u{1F315}",
    goblin: "\u{1F47A}",
    "globe-with-meridians": "\u{1F310}",
    "hammer-and-wrench": "\u{1F6E0}\uFE0F",
    honeybee: "\u{1F41D}",
    label: "\u{1F3F7}\uFE0F",
    "locked-with-key": "\u{1F510}",
    loudspeaker: "\u{1F4E2}",
    "magnifying-glass-tilted-left": "\u{1F50D}",
    "nazar-amulet": "\u{1F9FF}",
    newspaper: "\u{1F4F0}",
    "new-moon": "\u{1F311}",
    ogre: "\u{1F479}",
    "outbox-tray": "\u{1F4E4}",
    "page-facing-up": "\u{1F4C4}",
    paintbrush: "\u{1F58C}\uFE0F",
    pen: "\u{1F58A}\uFE0F",
    "person-juggling": "\u{1F939}",
    "ping-pong": "\u{1F3D3}",
    pick: "\u26CF\uFE0F",
    plus: "\u2795",
    minus: "\u2796",
    "puzzle-piece": "\u{1F9E9}",
    pushpin: "\u{1F4CC}",
    "ring-buoy": "\u{1F6DF}",
    robot: "\u{1F916}",
    rocket: "\u{1F680}",
    shark: "\u{1F988}",
    skateboard: "\u{1F6F9}",
    sunglasses: "\u{1F60E}",
    "test-tube": "\u{1F9EA}",
    "world-map": "\u{1F5FA}\uFE0F",
    "writing-hand": "\u270D\uFE0F",
  },
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
    return `https://api.iconify.design/${emoji.pack}/${name}.svg`;
  },
  fallback(value) {
    const current = String(value || "").trim();
    if (["default", "launcher", "reader"].includes(current)) return "";
    return emoji.native[emoji.name(current)] || current;
  },
  html(value, fallback = "") {
    const name = emoji.name(value);
    const fallbackValue =
      emoji.fallback(fallback) ||
      emoji.native[name] ||
      (name ? "?" : String(value || ""));
    const safeFallback = text.escape(fallbackValue);
    if (!name) return safeFallback;
    const source = emoji.url(name);
    const safeName = text.escape(name);
    const replacement = `<span aria-hidden="true" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;line-height:1;">${safeFallback}</span>`
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/"/g, "&quot;");
    const onerror = `this.onerror=null;this.outerHTML='${replacement}'`;
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
    return `<img class="ui-wait-glyph toolbar-icon" src="${primary}" alt="" onerror="${icon.fallback.glyph(primary, backup, fallback || name, "ui-wait-glyph toolbar-icon")}">`;
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
  deepseek: {
    domain: "deepseek.com",
    alt: "DeepSeek",
    source: "assets/images/deepseek.svg",
  },
};
const logo = {
  site,
  escape(value) {
    return text.escape(value);
  },
  asset(value) {
    return asset.resolve(value);
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
  fallback,
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
