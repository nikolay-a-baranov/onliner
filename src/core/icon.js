import { toolbar } from "./toolbar.js";

const url = {
  fluent(name) {
    return `https://raw.githubusercontent.com/microsoft/fluentui-system-icons/main/assets/${name}/SVG/ic_fluent_${name.toLowerCase().replaceAll(" ", "_")}_24_regular.svg`;
  },
  noto(value, code) {
    const symbols = code(value)
      .split("-")
      .map((part) => `u${part}`)
      .join("_");
    return `https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@main/svg/emoji_${symbols}.svg`;
  },
  twemoji(value, code) {
    return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${code(value)}.svg`;
  },
};

const mode = {
  scope: {
    launcher: "emoji",
    reader: "emoji",
    editor: "fluent",
    proofread: "emoji",
    cards: "emoji",
  },
  icon: {
    "🌕": "full-moon",
    "🌑": "new-moon",
    "✔️": "check-mark",
    "❌": "cross-mark",
    "➕": "plus-sign",
    "➖": "minus-sign",
    "✒️": "black-nib",
    "✏️": "pencil",
    "🖋️": "fountain-pen",
    "🖊️": "pen",
    "🖌️": "paintbrush",
    "🖍️": "crayon",
    "🦈": "shark",
    "🗂️": "card-index-dividers",
    "🤖": "robot",
    "🧮": "abacus",
    "📖": "open-book",
    "🧲": "magnet",
    "🔦": "flashlight",
    "🩹": "adhesive-bandage",
    "💀": "skull",
    "⌨️": "keyboard",
    "⬅️": "left-arrow",
    "➡️": "right-arrow",
    "🔙": "back-arrow",
    "#️⃣": "keycap-number-sign",
    "🔢": "input-numbers",
    "🔠": "input-letters",
    "🔣": "input-symbols",
    "💪": "flexed-biceps",
    "🤏": "pinching-hand",
    "💭": "thought-balloon",
    "📃": "page-with-curl",
    "🔍": "magnifying-glass-tilted-left",
    "🔎": "magnifying-glass-tilted-right",
    "🔑": "key",
    "↩️": "right-arrow-curving-left",
    "💾": "floppy-disk",
    "🌐": "globe-with-meridians",
    "🆗": "ok-button",
    "☑️": "check-box-with-check",
    "🛠️": "hammer-and-wrench",
    "🧹": "broom",
    "🕶️": "sunglasses",
    "🧿": "nazar-amulet",
    "💬": "speech-balloon",
    "📅": "calendar",
    "🆙": "up-button",
    "🚀": "rocket",
    "🦠": "microbe",
    "📚": "books",
    "🎯": "direct-hit",
    "💈": "barber-pole",
    "🛰️": "satellite",
    "🎛️": "control-knobs",
    "⚖️": "balance-scale",
    "🔐": "locked-with-key",
    "💉": "syringe",
    "🏷️": "label",
    "🧾": "receipt",
    "🧪": "test-tube",
    "🤑": "money-mouth-face",
    "🗑️": "wastebasket",
    "🧬": "dna",
    "🧭": "compass",
    "🧰": "toolbox",
    "💼": "briefcase",
    "🅱️": "b-button-blood-type",
    "📟": "pager",
    "🌌": "milky-way",
    "📰": "newspaper",
    "🗞️": "rolled-up-newspaper",
    "📸": "camera-with-flash",
    "📑": "bookmark-tabs",
  },
  index: {
    default: [],
    cards: [
      "🧹",
      "🧿",
      "✒️",
      "💬",
      "🎯",
      "📅",
      "🕶️",
      "🧭",
      "🆙",
      "🚀",
      "📚",
      "🦠",
      "🔐",
      "⚖️",
      "📟",
      "🧬",
      "🧾",
      "🏷️",
      "🧪",
      "🤑",
      "🗑️",
      "💉",
      "💼",
      "🅱️",
    ],
    launcher: [
      "🧹",
      "🧿",
      "✒️",
      "💬",
      "🎯",
      "📅",
      "🕶️",
      "🧭",
      "🆙",
      "🚀",
      "📚",
      "🦠",
      "🔐",
      "⚖️",
      "📟",
      "🧬",
      "🧾",
      "🏷️",
      "🧪",
      "🤑",
      "🗑️",
      "💉",
      "💼",
      "🅱️",
    ],
    reader: ["🕶️", "➕", "➖", "⌨️", "❌", "🌕", "🌑"],
    proofread: ["🌑", "🌕", "✏️", "🔎", "🌐", "☑️", "🔙", "💾", "❌"],
    editor: [
      "🌕",
      "🌑",
      "➕",
      "➖",
      "🔙",
      "⬅️",
      "➡️",
      "❌",
      "✔️",
      "☑️",
      "💾",
      "🔎",
      "🌐",
    ],
  },
  tools: {
    proofread: {
      icon: {
        dark: { emoji: "🌑", fluent: "Weather Moon" },
        light: { emoji: "🌕", fluent: "Weather Sunny" },
        fix: { emoji: "✏️", fluent: "Edit" },
        search: { emoji: "🔎", fluent: "Search" },
        globe: { emoji: "🌐", fluent: "Globe" },
        ok: { emoji: "☑️", fluent: "Checkmark Square" },
        undo: { emoji: "🔙", fluent: "Arrow Undo" },
        save: { emoji: "💾", fluent: "Save" },
        close: { emoji: "❌", fluent: "Dismiss" },
      },
      pick(name) {
        const item = mode.tools.proofread.icon[name] || {};
        return mode.get("proofread") === "glyph"
          ? url.fluent(item.fluent || "")
          : item.emoji || "";
      },
      themeName(theme) {
        return theme === "dark" ? "light" : "dark";
      },
      html(name, alt = "") {
        const value = mode.tools.proofread.pick(name);
        if (mode.get("proofread") !== "glyph") {
          return icon.emoji(value, "proofread");
        }
        return `<img class="proofread-icon" src="${value}" alt="${String(alt || "").replace(/"/g, "&quot;")}" draggable="false">`;
      },
      theme(theme, alt = "theme") {
        return mode.tools.proofread.html(
          mode.tools.proofread.themeName(theme),
          alt,
        );
      },
    },
  },
  normalize(value, fallback = "emoji") {
    const current = String(value || fallback).toLowerCase();
    if (current === "glyph" || current === "fluent") return "glyph";
    return "emoji";
  },
  get(scope, fallback = "emoji") {
    return mode.normalize(mode.scope[scope], fallback);
  },
};

mode.index.default = Object.keys(mode.icon);

const emojis = {
  pack: "fluent",
  icons(scope = "default") {
    const list = mode.index[scope] || mode.index.default;
    return list.reduce((result, key) => {
      const value = mode.icon[key];
      if (!value) return result;
      result[key] = value;
      return result;
    }, {});
  },
  normalize(value) {
    return [...String(value || "")]
      .filter((symbol) => symbol.codePointAt(0).toString(16) !== "fe0f")
      .join("");
  },
  namespace() {
    return {
      fluent: "fluent-emoji-flat",
      noto: "noto",
    }[emojis.pack];
  },
  name(value, scope = "default") {
    const dictionary = emojis.icons(scope);
    const direct = dictionary[value];
    if (direct) return direct;
    const normalized = emojis.normalize(value);
    return (
      Object.entries(dictionary).find(
        ([key]) => emojis.normalize(key) === normalized,
      )?.[1] || null
    );
  },
  code(value) {
    if (value === "#️⃣" || value === "#️") return "23-20e3";
    return [...value]
      .map((symbol) => symbol.codePointAt(0).toString(16))
      .filter((symbol) => symbol !== "fe0f")
      .join("-");
  },
  url(value, scope = "default") {
    if (emojis.pack === "native") return null;
    if (emojis.pack === "twemoji") return icon.url.twemoji(value);
    if (emojis.pack === "noto") return icon.url.noto(value);
    const namespace = emojis.namespace();
    const name = emojis.name(value, scope);
    if (!namespace || !name) return null;
    return `https://api.iconify.design/${namespace}:${name}.svg`;
  },
  image(value, scope = "default") {
    const source = emojis.url(value, scope);
    if (!source) return value;
    const onerror =
      emojis.pack === "twemoji"
        ? ""
        : ` onerror="this.onerror=null;this.closest('.emoji').outerHTML='${value}'"`;
    return `<span class="emoji" data-emoji="${value}" style="width:1em;height:1em;display:inline-block;vertical-align:-0.12em;"><img alt="${value}" src="${source}"${onerror} style="width:100%;height:100%;display:block;"></span>`;
  },
  list(scope = "default") {
    return Object.keys(emojis.icons(scope)).sort(
      (left, right) => right.length - left.length,
    );
  },
  replace(value, scope = "default") {
    return emojis
      .list(scope)
      .reduce(
        (string, item) => string.split(item).join(emojis.image(item, scope)),
        value,
      );
  },
  html(value, scope = "default") {
    if (emojis.pack === "native") return value;
    return emojis.replace(value, scope);
  },
};

const logo = {
  editor: {
    google: { domain: "google.com", alt: "Google" },
    gramota: { domain: "gramota.ru", alt: "Грамота" },
    kinopoisk: { domain: "kinopoisk.ru", alt: "Кинопоиск" },
  },
  escape(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },
  favicon(domain, alt = "", className = "") {
    const safeAlt = logo.escape(alt || domain || "");
    const safeClass = logo.escape(className).trim();
    const classAttr = safeClass ? ` class="${safeClass}"` : "";
    return `<img${classAttr} src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32" alt="${safeAlt}" loading="lazy" decoding="async" draggable="false" ondragstart="return false">`;
  },
  proofreadSource(provider = "qwen") {
    const current = String(provider || "qwen").toLowerCase();
    if (current === "gemini") {
      return logo.favicon("google.com", "Gemini");
    }
    return logo.favicon("qwen.com", "Qwen");
  },
  proofreadStatus(name = "languagetool", provider = "qwen") {
    if (name === "languagetool") {
      return logo.favicon("languagetool.org", "LanguageTool");
    }
    return logo.proofreadSource(provider);
  },
  editorSource(name) {
    const value = logo.editor[name] || {};
    if (!value.domain) return "";
    return logo.favicon(value.domain, value.alt || name, "toolbar-logo");
  },
};

const icon = {
  url: {
    fluent(name) {
      return url.fluent(name);
    },
    noto(value) {
      return url.noto(value, emojis.code);
    },
    twemoji(value) {
      return url.twemoji(value, emojis.code);
    },
  },
  emojis,
  mode,
  fluent(name) {
    return icon.url.fluent(name);
  },
  emoji(value, scope = "default") {
    return emojis.html(value, scope);
  },
  glyph(theme) {
    return toolbar.themeToggleIcon(theme);
  },
  theme(theme) {
    return icon.emoji(icon.glyph(theme), "reader");
  },
  logo,
  proofread: mode.tools.proofread,
};

export { icon };
