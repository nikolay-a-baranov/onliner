const platform = {
  apple() {
    return (
      /Mac|iPhone|iPad|iPod/.test(navigator.platform) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  },
};

const hotkey = {
  platform,
  modifier(event = null) {
    if (!event) return false;
    return hotkey.platform.apple()
      ? event.altKey && event.metaKey && !event.ctrlKey
      : event.altKey && !event.ctrlKey && !event.metaKey;
  },
  number(event = null, { zero = true, numpadHotkeys = true } = {}) {
    const code = String(event?.code || "");
    const pattern = numpadHotkeys
      ? /^(?:Digit|Numpad)([0-9])$/
      : /^Digit([0-9])$/;
    const match = code.match(pattern);
    if (!match) return -1;
    const value = Number(match[1]);
    return zero || value > 0 ? value : -1;
  },
  combo(key = "") {
    return `${hotkey.platform.apple() ? "\u2325\u2318" : "Alt+"}${String(key || "")}`;
  },
  tooltip(title = "", hotkey = "") {
    return [title, hotkey].filter(Boolean).join(" \u00B7 ");
  },
  action: {
    close: {
      label() {
        return "Esc";
      },
      match(event = null) {
        return event?.key === "Escape";
      },
    },
    theme: {
      label() {
        return hotkey.combo("\\");
      },
      match(event = null) {
        return hotkey.modifier(event) && event?.code === "Backslash";
      },
    },
    marker: {
      label() {
        return hotkey.combo("`");
      },
      match(event = null) {
        return hotkey.modifier(event) && event?.code === "Backquote";
      },
    },
  },
  popup: {
    apply: {
      label() {
        return hotkey.combo("1");
      },
      match(event = null, options = {}) {
        return (
          hotkey.modifier(event) &&
          hotkey.number(event, {
            zero: false,
            numpadHotkeys: options.numpadHotkeys,
          }) === 1
        );
      },
    },
    swap: {
      label() {
        return hotkey.combo("=");
      },
      match(event = null) {
        return hotkey.modifier(event) && event?.code === "Equal";
      },
    },
    cycle: {
      label() {
        return hotkey.combo("`");
      },
      match(event = null) {
        return hotkey.modifier(event) && event?.code === "Backquote";
      },
    },
  },
  audit: {
    items: {
      previous: { code: "ArrowUp", key: "\u2191" },
      next: { code: "ArrowDown", key: "\u2193" },
      search: { code: "Slash", key: "/" },
      ok: { code: "Minus", alt: ["NumpadSubtract"], key: "\u2212" },
      fix: { code: "Equal", alt: ["NumpadAdd"], key: "=" },
      input: { code: "KeyZ", key: "Z" },
      select: { code: "KeyQ", key: "Q" },
    },
    item(name = "") {
      return hotkey.audit.items[String(name || "")] || null;
    },
    label(name = "") {
      const item = hotkey.audit.item(name);
      return item ? hotkey.combo(item.key) : "";
    },
    match(event = null, name = "", { editable = false } = {}) {
      const item = hotkey.audit.item(name);
      if (!item) return false;
      const codes = [item.code, ...(item.alt || [])];
      if (!codes.includes(String(event?.code || ""))) return false;
      return hotkey.modifier(event) || !editable;
    },
    command(event = null, options = {}) {
      return Object.keys(hotkey.audit.items).find((name) =>
        hotkey.audit.match(event, name, options)
      ) || "";
    },
  },
};

export { hotkey };
