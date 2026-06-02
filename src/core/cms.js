const timezone = "Europe/Minsk";
const sections = {
  people: {
    icon: "\u{1F9DF}",
    label: "\u041B\u044E\u0434\u0438",
  },
  sport: { icon: "\u{1F3C5}", label: "\u0421\u043F\u043E\u0440\u0442" },
  money: { icon: "\u{1F45B}", label: "\u041A\u043E\u0448\u0435\u043B\u044C" },
  auto: { icon: "\u{1F698}", label: "\u0410\u0432\u0442\u043E" },
  tech: { icon: "\u{1F996}", label: "\u0422\u0435\u0447\u044C" },
  realt: { icon: "\u{1F3D8}\uFE0F", label: "\u041D\u0435\u0434\u0432\u0438\u0433\u0430" },
};
const editor = (() => {
  const button = (mode) => document.querySelector(`#content-${mode}`);
  const tiny = () => {
    const current = window.tinyMCE?.activeEditor;
    if (!current || current.isHidden()) return null;
    return current;
  };
  const textarea = () => document.getElementById("content");
  const emit = (target) => {
    if (!target) return;
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const runContentCore = (fn, { sync = true } = {}) => {
    const field = sync ? editor.syncToTextarea() : textarea();
    if (!field || typeof fn !== "function") return field?.value || "";
    const source = field.value || "";
    const result = fn(source);
    if (typeof result !== "string") {
      editor.syncFromTextarea();
      return result;
    }
    if (result === source) {
      editor.syncFromTextarea();
      return result;
    }
    field.value = result;
    emit(field);
    editor.syncFromTextarea();
    return result;
  };
  const plain = {
    cursor(target, value) {
      if (!target) return false;
      const source = target.value || "";
      const start = target.selectionStart ?? source.length;
      const end = target.selectionEnd ?? start;
      const next = source.slice(0, start) + value + source.slice(end);
      if (next === source) return true;
      target.value = next;
      target.selectionStart = start + value.length;
      target.selectionEnd = start + value.length;
      target.focus();
      emit(target);
      return true;
    },
    block(target, value) {
      if (!target) return false;
      const source = target.value || "";
      const cursor = target.selectionStart ?? source.length;
      const lineStart = source.lastIndexOf("\n", cursor - 1) + 1;
      const lineEnd = source.indexOf("\n", cursor);
      const end = lineEnd < 0 ? source.length : lineEnd;
      const line = source.slice(lineStart, end);
      const before = source.slice(lineStart, cursor);
      const point = line.trim() && !before.trim() ? lineStart : end;
      const left = source
        .slice(0, point)
        .replace(/[ \t]+$/g, "")
        .replace(/\n+$/g, "");
      const right = source
        .slice(point)
        .replace(/^[ \t]+/g, "")
        .replace(/^\n+/g, "");
      const part = (left ? "\n\n" : "") + value + (right ? "\n\n" : "");
      const next = left + part + right;
      if (next === source) return true;
      target.value = next;
      target.selectionStart = target.selectionEnd = (left + part).length;
      target.focus();
      emit(target);
      return true;
    },
  };
  const action = (selector, { beforeClick, click = false } = {}) => {
    const target = document.querySelector(selector);
    if (!target) return null;
    if (typeof beforeClick === "function") {
      const key = `${selector}:beforeClick`;
      const hooks = target._editorBeforeClickHooks || {};
      const list = hooks[key] || [];
      list.push(beforeClick);
      hooks[key] = list;
      target._editorBeforeClickHooks = hooks;
      if (!target.dataset.editorBeforeClickHook) {
        target.dataset.editorBeforeClickHook = "1";
        const runHooks = () => {
          const map = target._editorBeforeClickHooks || {};
          Object.values(map).forEach((items) => {
            items.forEach((run) => {
              if (typeof run === "function") run();
            });
          });
        };
        target.addEventListener("mousedown", runHooks, true);
        target.addEventListener("click", runHooks, true);
      }
    }
    if (click) target.click();
    return target;
  };
  return {
    getMode() {
      const content = window.tinyMCE?.get?.("content") || null;
      const active = window.tinyMCE?.activeEditor || null;
      const visible = (value) => {
        if (!value) return false;
        const isContent = value.id === "content" || value === content;
        if (!isContent) return false;
        if (typeof value.isHidden !== "function") return true;
        return !value.isHidden();
      };
      if (visible(content) || visible(active)) return "tmce";
      const wrap = document.querySelector("#wp-content-wrap");
      if (wrap?.classList.contains("html-active")) return "html";
      if (wrap?.classList.contains("tmce-active")) return "tmce";
      const tmceTab = button("tmce");
      const htmlTab = button("html");
      if (tmceTab?.classList.contains("active")) return "tmce";
      if (htmlTab?.classList.contains("active")) return "html";
      return "html";
    },
    syncToTextarea() {
      const field = textarea();
      if (!field) return null;
      if (editor.getMode() === "tmce") {
        const current = window.tinyMCE?.get?.("content");
        if (current && !current.isHidden()) current.save();
      }
      return field;
    },
    syncFromTextarea(mode = editor.getMode()) {
      if (mode !== "tmce") return;
      const field = textarea();
      if (!field) return;
      const current = window.tinyMCE?.get?.("content");
      if (!current || current.isHidden()) return;
      current.setContent(field.value || "");
    },
    runContent(fn) {
      return runContentCore(fn, { sync: true });
    },
    runHtmlBridge(fn, options = {}) {
      const mode = options.mode || editor.getMode();
      editor.syncToTextarea();
      if (mode === "tmce") editor.html();
      const result = runContentCore(fn, { sync: false });
      if (mode === "tmce") {
        editor.syncFromTextarea("tmce");
        setTimeout(() => editor.tmce({ click: true }), 0);
      }
      return result;
    },
    html() {
      const target = button("html");
      if (target) target.click();
      return target;
    },
    tmce({ beforeClick, click = false } = {}) {
      const target = button("tmce");
      if (!target) return null;
      if (typeof beforeClick === "function") {
        const hooks = target._editorTmceBeforeClickHooks || [];
        hooks.push(beforeClick);
        target._editorTmceBeforeClickHooks = hooks;
        if (target.dataset.editorTmceHook !== "1") {
          target.dataset.editorTmceHook = "1";
          const runHooks = () => {
            const list = target._editorTmceBeforeClickHooks || [];
            list.forEach((run) => {
              if (typeof run === "function") run();
            });
          };
          target.addEventListener("mousedown", runHooks, true);
          target.addEventListener("click", runHooks, true);
        }
      }
      if (click) target.click();
      return target;
    },
    save(options) {
      return action("#save-post", options);
    },
    publish(options) {
      return action("#publish", options);
    },
    insert: {
      cursor(value) {
        const current = tiny();
        if (current) {
          current.execCommand("mceInsertContent", false, value);
          return true;
        }
        return plain.cursor(textarea(), value);
      },
      block(value) {
        const current = tiny();
        if (current) {
          const selection = current.selection;
          const node =
            selection && typeof selection.getNode === "function"
              ? selection.getNode()
              : null;
          const block =
            node && current.dom && typeof current.dom.getParent === "function"
              ? current.dom.getParent(
                  node,
                  "p,div,li,blockquote,h1,h2,h3,h4,h5,h6",
                )
              : null;
          if (
            block &&
            selection &&
            typeof selection.select === "function" &&
            typeof selection.collapse === "function"
          ) {
            try {
              selection.select(block, true);
              selection.collapse(false);
            } catch {}
          }
          current.execCommand("mceInsertContent", false, value);
          return true;
        }
        return plain.block(textarea(), value);
      },
    },
  };
})();
const layout = {
  element() {
    return (
      document.querySelector("#layout_select") ||
      [...document.querySelectorAll("select")].find((element) =>
        [...element.options].some((option) => option.value === "longread"),
      )
    );
  },
  value(element = layout.element()) {
    return element?.value || "";
  },
  longread(value) {
    return /longread/i.test(String(value || ""));
  },
};
const vpn = {
  ensure: async (message = "🛑 VPN", timeout = 1500) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(
        `${location.origin}/wp-admin/admin-ajax.php`,
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        },
      );
      if (!response.ok) throw new Error(message);
    } catch {
      throw new Error(message);
    } finally {
      clearTimeout(timer);
    }
  },
};
const chief = {
  acting: {
    until: "2026-06-16",
    before: "ng@onliner.by",
    default: "ga@onliner.by",
  },
  email(date = new Date()) {
    const pivot = chief.acting.until;
    const current = new Date(date).toISOString().slice(0, 10);
    return current <= pivot ? chief.acting.before : chief.acting.default;
  },
};
const admin = {
  tools() {
    return document.querySelector("#wp-content-editor-tools");
  },
  mount({
    id = "",
    content = "",
    html = false,
    exists = [],
    onClick = null,
  } = {}) {
    const tools = admin.tools();
    if (!tools || !id || !content || typeof onClick !== "function") return null;
    const blocked = [id, ...exists].filter(Boolean);
    if (blocked.some((item) => document.getElementById(item))) return null;
    const button = document.createElement("a");
    button.id = id;
    button.href = "#";
    button.className = "hide-if-no-js wp-switch-editor";
    if (html) {
      button.innerHTML = content;
    } else {
      button.textContent = content;
    }
    const run = (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      onClick(event, button);
    };
    button.addEventListener("click", run, true);
    button.addEventListener("touchend", run, true);
    const htmlTab = document.querySelector("#content-html");
    tools.insertBefore(button, htmlTab || tools.firstChild);
    return button;
  },
  lazyTool({
    id = "",
    icon = "",
    html = false,
    from = "",
    to = "",
    exists = [],
    query = "v",
  } = {}) {
    if (!id || !icon || !from || !to) return;
    const current = document.currentScript;
    const fallback = [...document.querySelectorAll("script[src]")].find((node) =>
      new RegExp(String.raw`\/(?:dist\/)?${from}(?:\?|$)`, "i").test(node.src),
    );
    const source = current?.src || fallback?.src || "";
    if (!source) return;
    const url = new URL(source, location.href);
    url.pathname = url.pathname.replace(new RegExp(`${from}$`, "i"), to);
    if (query) url.searchParams.set(query, String(Date.now()));
    const target = url.href;
    admin.mount({
      id,
      content: icon,
      html,
      exists,
      onClick: (_, button) => {
        const script = document.createElement("script");
        script.src = target;
        (document.head || document.body || document.documentElement).append(script);
        button.remove();
      },
    });
  },
};
const cms = {
  sections,
  timezone,
  editor,
  layout,
  vpn,
  chief,
  admin,
};

export { cms };
