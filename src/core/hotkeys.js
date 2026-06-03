const keydown = ({
  map = {},
  run = () => false,
  active = () => true,
  debug = false,
  source = "html",
} = {}) => {
  const log = (...items) => {
    if (!debug) return;
    console.log("[hotkeys]", ...items);
  };
  return (event) => {
    if (event.defaultPrevented) return;
    if (typeof active === "function" && !active()) return;
    const apple =
      /Mac|iPhone|iPad|iPod/.test(navigator.platform) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const mod = apple
      ? event.altKey && event.ctrlKey && !event.metaKey
      : event.altKey && !event.ctrlKey && !event.metaKey;
    if (!mod) return;
    log("keydown received", source, event.code || "", event.key || "");
    const name = map[String(event.code || "")] || "";
    if (!name) return;
    log("action resolved", name, source);
    const fired = !!run(name, event, source);
    log(fired ? "executed" : "skipped", name, source);
    if (fired) event.preventDefault();
  };
};

export const hotkeys = {
  bind({
    target,
    map = {},
    run = () => false,
    active = () => true,
    debug = false,
    source = "html",
  } = {}) {
    if (!target?.addEventListener) return () => {};
    const log = (...items) => {
      if (!debug) return;
      console.log("[hotkeys]", ...items);
    };
    log("bind called", source);
    const handler = keydown({ map, run, active, debug, source });
    target.addEventListener("keydown", handler);
    return () => target.removeEventListener("keydown", handler);
  },
  bindTiny({
    getEditor = () => null,
    map = {},
    run = () => false,
    active = () => true,
    debug = false,
  } = {}) {
    const log = (...items) => {
      if (!debug) return;
      console.log("[hotkeys]", ...items);
    };
    const state = {
      editor: null,
      doc: null,
      clear: () => {},
    };
    const reset = () => {
      state.clear();
      state.editor = null;
      state.doc = null;
      state.clear = () => {};
    };
    const bindEditor = (editor) => {
      if (!editor) return false;
      const handler = keydown({
        map,
        run,
        active,
        debug,
        source: "tmce",
      });
      if (typeof editor.on === "function") {
        editor.on("keydown", handler);
        state.clear = () => {
          try {
            editor.off?.("keydown", handler);
          } catch {}
        };
        state.editor = editor;
        state.doc = null;
        log("tiny editor found", editor.id || "");
        log("event source", "editor.on");
        return true;
      }
      if (editor.onKeyDown?.add) {
        const legacy = (_, event) => handler(event);
        editor.onKeyDown.add(legacy);
        state.clear = () => {
          try {
            editor.onKeyDown.remove?.(legacy);
          } catch {}
        };
        state.editor = editor;
        state.doc = null;
        log("tiny editor found", editor.id || "");
        log("event source", "editor.onKeyDown");
        return true;
      }
      const doc = editor.getDoc?.();
      if (!doc?.addEventListener) return false;
      doc.addEventListener("keydown", handler);
      state.clear = () => doc.removeEventListener("keydown", handler);
      state.editor = editor;
      state.doc = doc;
      log("tiny editor found", editor.id || "");
      log("event source", "iframe document");
      return true;
    };
    return {
      sync() {
        log("bind called", "tmce");
        const editor = getEditor();
        if (!editor) {
          log("tiny editor found", "none");
          reset();
          return false;
        }
        if (typeof editor.on === "function" || editor.onKeyDown?.add) {
          if (state.editor === editor && !state.doc) return true;
          reset();
          return bindEditor(editor);
        }
        const doc = editor.getDoc?.();
        if (state.editor === editor && state.doc === doc) return true;
        reset();
        return bindEditor(editor);
      },
      destroy() {
        reset();
      },
    };
  },
};
