export const emoji = {
  pack: "native",
  icons: {
    "\u{1F315}": "full-moon",
    "\u{1F311}": "new-moon",
    "\u2795": "plus-sign",
    "\u2796": "minus-sign",
    "\u{1F916}": "robot",
    "\u{1F4D6}": "open-book",
    "\u{1F9F2}": "magnet",
    "\u{1F526}": "flashlight",
    "\u{1FA79}": "adhesive-bandage",
    "\u{1F480}": "skull",
    "\u2328\uFE0F": "keyboard",
    "\u{1F4AA}": "flexed-biceps",
    "\u2B05\uFE0F": "left-arrow",
    "\u27A1\uFE0F": "right-arrow",
    "\u{1F519}": "back-arrow",
    "\u{1F9EE}": "abacus",
    "#\uFE0F\u20E3": "keycap-number-sign",
    "\u{1F522}": "input-numbers",
    "\u{1F520}": "input-letters",
    "\u{1F523}": "input-symbols",
    "\u{1F4AD}": "thought-balloon",
    "\u{1F90F}": "pinching-hand",
    "\u{1F4C3}": "page-with-curl",
    "\u{1F50E}": "magnifying-glass-tilted-right",
    "\u274C": "cross-mark",
    "\u{1F511}": "key",
    "\u21A9\uFE0F": "right-arrow-curving-left",
    "\u{1F4BE}": "floppy-disk",
    "\u270F\uFE0F": "pencil",
    "\u{1F310}": "globe-with-meridians",
    "\u{1F197}": "ok-button",
    "\u2611\uFE0F": "check-box-with-check",
    "\u2714\uFE0F": "check-mark",
    "\u{1F5C2}\uFE0F": "card-index-dividers",
    "\u{1F58B}\uFE0F": "fountain-pen",
    "\u{1F6E0}\uFE0F": "hammer-and-wrench",
    "\u{1F9F9}": "broom",
    "\u{1F576}\uFE0F": "dark-sunglasses",
    "\u{1F9FF}": "nazar-amulet",
    "\u2712\uFE0F": "black-nib",
    "\u{1F4AC}": "speech-balloon",
    "\u{1F4C5}": "calendar",
    "\u{1F199}": "up-button",
    "\u{1F680}": "rocket",
    "\u{1F9A0}": "microbe",
    "\u{1F4DA}": "books",
    "\u{1F3AF}": "direct-hit",
    "\u2696\uFE0F": "balance-scale",
    "\u{1F510}": "locked-with-key",
    "\u{1F489}": "syringe",
    "\u{1F3F7}\uFE0F": "label",
    "\u{1F9FE}": "receipt",
    "\u{1F9EA}": "test-tube",
    "\u{1F911}": "money-mouth-face",
    "\u{1F5D1}\uFE0F": "wastebasket",
    "\u{1F9EC}": "dna",
    "\u{1F171}\uFE0F": "b-button-blood-type",
    "\u{1F4DF}": "pager",
    "\u{1F30C}": "milky-way",
  },
  code(value) {
    if (value === "#\uFE0F\u20E3" || value === "#\uFE0F") return "23-20e3";
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
    if (emoji.pack === "twemoji") return emoji.twemojiUrl(value);
    const namespace = emoji.namespace();
    const name = emoji.icons[value];
    if (!namespace || !name) return null;
    return `https://api.iconify.design/${namespace}:${name}.svg`;
  },
  twemojiUrl(value) {
    return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${emoji.code(value)}.svg`;
  },
  image(value) {
    const url = emoji.url(value);
    if (!url) return value;
    const onerror =
      emoji.pack === "twemoji"
        ? ""
        : ` onerror="this.onerror=null;this.closest('.emoji').outerHTML='${value}'"`;
    return `<span class="emoji" data-emoji="${value}" style="width:1em;height:1em;display:inline-block;vertical-align:-0.12em;"><img alt="${value}" src="${url}"${onerror} style="width:100%;height:100%;display:block;"></span>`;
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
