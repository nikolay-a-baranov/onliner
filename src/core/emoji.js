export const emoji = {
  pack: "twemoji",
  icons: {
    "🌕": "full-moon",
    "🌑": "new-moon",
    "➕": "plus-sign",
    "➖": "minus-sign",
    "🤖": "robot",
    "📖": "open-book",
    "🧲": "magnet",
    "🔦": "flashlight",
    "🩹": "adhesive-bandage",
    "💀": "skull",
    "⌨️": "keyboard",
    "💪": "flexed-biceps",
    "⬅️": "left-arrow",
    "➡️": "right-arrow",
    "🔙": "back-arrow",
    "🧮": "abacus",
    "#️⃣": "keycap-number-sign",
    "🔢": "input-numbers",
    "🔠": "input-letters",
    "🔣": "input-symbols",
    "💭": "thought-balloon",
    "🤏": "pinching-hand",
    "📃": "page-with-curl",
    "🔎": "magnifying-glass-tilted-right",
    "❌": "cross-mark",
    "🔑": "key",
    "↩️": "right-arrow-curving-left",
    "💾": "floppy-disk",
    "✏️": "pencil",
    "🌐": "globe-with-meridians",
    "🆗": "ok-button",
    "☑️": "check-box-with-check",
  },
  code(value) {
    if (value === "#️⃣" || value === "#️") return "23-20e3";
    return [...value]
      .map((symbol) => symbol.codePointAt(0).toString(16))
      .filter((symbol) => symbol !== "fe0f")
      .join("-");
  },
  namespace() {
    return {
      fluent: "fluent-emoji-flat",
      noto: "noto",
    }[emoji.pack];
  },
  url(value) {
    if (emoji.pack === "native") return null;
    if (emoji.pack === "twemoji") {
      return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${emoji.code(value)}.svg`;
    }
    const namespace = emoji.namespace();
    const name = emoji.icons[value];
    if (!namespace || !name) return null;
    return `https://api.iconify.design/${namespace}:${name}.svg`;
  },
  image(value) {
    const url = emoji.url(value);
    if (!url) return value;
    return `<span class="emoji" data-emoji="${value}"><img alt="${value}" src="${url}"></span>`;
  },
  list() {
    return Object.keys(emoji.icons).sort(
      (left, right) => right.length - left.length,
    );
  },
  replace(value) {
    return emoji
      .list()
      .reduce(
        (string, icon) => string.split(icon).join(emoji.image(icon)),
        value,
      );
  },
  html(value) {
    if (emoji.pack === "native") return value;
    return emoji.replace(value);
  },
};
