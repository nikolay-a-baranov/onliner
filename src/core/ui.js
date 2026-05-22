import { css } from "./css.js";
import { icon } from "./icon.js";

const popup = {
  id: "bml-ui-popup",
  styleId: "bml-ui-popup-style",
  ensureStyle() {
    if (document.getElementById(popup.styleId)) return;
    const style = document.createElement("style");
    style.id = popup.styleId;
    style.textContent = css.ui.popup();
    document.head.appendChild(style);
  },
  root() {
    let node = document.getElementById(popup.id);
    if (node) return node;
    node = document.createElement("div");
    node.id = popup.id;
    node.hidden = true;
    document.body.appendChild(node);
    return node;
  },
  title(kind = "", title = "", options = []) {
    if (kind === "titles" || options.length) return "\u{1F4D4} Заголовки";
    if (kind === "excerpt") return "\u{1F4AD} Цитата";
    if (kind === "slug") return "\u{1F587}\uFE0F Слаг";
    return title || "";
  },
  headless: {
    init({ options = [], pick = "", values = {}, value = "" } = {}) {
      return {
        index: Math.max(
          0,
          options.findIndex((item) => item.value === pick),
        ),
        values: options.reduce((result, item) => {
          const key = String(item.value || "");
          if (key in values) {
            result[key] = String(values[key] || "");
            return result;
          }
          result[key] = key === pick ? String(value || "") : "";
          return result;
        }, {}),
      };
    },
    option(state, options) {
      return options[state.index] || null;
    },
    key(state, options) {
      return String(popup.headless.option(state, options)?.value || "");
    },
    max(state, options, limit) {
      const value = Number(popup.headless.option(state, options)?.limit);
      return Number.isFinite(value) ? value : limit;
    },
    render({ state, options, textarea, navLabel }) {
      if (!options.length) return;
      const item = popup.headless.option(state, options);
      const key = popup.headless.key(state, options);
      navLabel.textContent = item?.label || "";
      textarea.value = String(state.values[key] || "");
    },
    sync({ state, options, limit, textarea, counter }) {
      const current = textarea.value || "";
      const max = popup.headless.max(state, options, limit);
      counter.textContent = max > 0 ? `${current.length}/${max}` : `${current.length}`;
    },
    step(state, options, value) {
      if (!options.length) return;
      state.index =
        (state.index + value + options.length) % Math.max(1, options.length);
    },
    save({ state, options, limit, textarea }) {
      const key = popup.headless.key(state, options);
      const current = textarea.value || "";
      if (options.length) state.values[key] = current;
      const max = popup.headless.max(state, options, limit);
      return {
        value: max > 0 ? current.slice(0, max) : current,
        pick: options.length ? key : "",
        values: state.values,
      };
    },
    theme: {
      init(value = "light") {
        return { current: value };
      },
      toggle(state) {
        state.current = state.current === "dark" ? "light" : "dark";
        return state.current;
      },
      apply(state, root, paintTheme) {
        const panel = root.querySelector(".panel");
        if (panel) panel.dataset.theme = state.current;
        paintTheme();
      },
    },
    action(name, context) {
      const {
        options,
        state,
        textarea,
        renderOption,
        sync,
        close,
        root,
        theme,
        paintTheme,
        save,
      } = context;
      if (name === "prev" || name === "next") {
        if (!options.length) return true;
        const step = name === "next" ? 1 : -1;
        const key = popup.headless.key(state, options);
        state.values[key] = textarea.value || "";
        popup.headless.step(state, options, step);
        renderOption();
        sync();
        textarea.focus();
        return true;
      }
      if (name === "theme") {
        popup.headless.theme.toggle(theme);
        popup.headless.theme.apply(theme, root, paintTheme);
        return true;
      }
      if (name === "close") {
        close(null);
        return true;
      }
      if (name === "save") {
        close(save());
        return true;
      }
      return false;
    },
    keyboard(event, { close, save } = {}) {
      if (event.key === "Escape") {
        close(null);
        return true;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        close(save());
        return true;
      }
      return false;
    },
    outside: {
      init() {
        return {
          dragFromField: false,
          suppressOutsideClick: false,
        };
      },
      down(state) {
        state.dragFromField = true;
      },
      up(state, event, root) {
        if (event.target === root && state.dragFromField) {
          state.suppressOutsideClick = true;
        }
        state.dragFromField = false;
      },
      shouldClose(state, event, root) {
        if (event.target !== root) return false;
        if (state.suppressOutsideClick) {
          state.suppressOutsideClick = false;
          return false;
        }
        return true;
      },
    },
    lifecycle: {
      init() {
        return { closed: false };
      },
      done(state, { root, textarea, click, key, mouseup, sync, resolve }, result) {
        if (state.closed) return;
        state.closed = true;
        root.removeEventListener("click", click);
        root.removeEventListener("keydown", key);
        root.removeEventListener("mouseup", mouseup);
        textarea.removeEventListener("input", sync);
        root.hidden = true;
        root.innerHTML = "";
        resolve(result);
      },
      close(state, refs, result = null) {
        popup.headless.lifecycle.done(state, refs, result);
      },
    },
  },
  open({
    title = "",
    kind = "",
    value = "",
    limit = 0,
    options = [],
    pick = "",
    values = {},
  } = {}) {
    popup.ensureStyle();
    const root = popup.root();
    const theme =
      document.getElementById("onliner-reader-panel")?.dataset?.theme ||
      document.querySelector('.panel[data-ui-surface="toolbar"]')?.dataset
        ?.theme ||
      "light";
    const popupTitleLegacy = (() => {
      if (options.length) return "\u{1F4D4} Заголовки";
      if (/excerpt/i.test(title)) return "\u{1F4AD} Цитата";
      if (/editable-post-name/i.test(title)) return "\u{1F587}\uFE0F Слаг";
      return title || "";
    })();
    const popupTitle = popup.title(kind, popupTitleLegacy, options);
    const button = (action, value) =>
      ui.controls.button({
        content: icon.emoji(value, "default"),
        action,
        attrs: ' type="button"',
      });
    const navHtml = options.length
      ? ui.shell.shell({
          classes: "ui-nav",
          left: button("prev", "\u2B05\uFE0F"),
          main: `<div class="ui-nav-label"></div>`,
          right: button("next", "\u27A1\uFE0F"),
        })
      : "";
    const head = ui.shell.shell({
      classes: "ui-head",
      left: `<h3 class="ui-title">${popupTitle}</h3>`,
      right: ui.shell.group(
        `${button("theme", icon.glyph(theme))}${button("close", "\u274C")}`,
        { rail: true },
      ),
    });
    const footer = ui.shell.shell({
      classes: "ui-row",
      left: ui.shell.group(`<span class="ui-counter"></span>`),
      right: `<div class="actions">${ui.shell.group(`${button("save", "\u2714\uFE0F")}`, { rail: true })}</div>`,
    });
    root.innerHTML = `
      <div class="panel" data-ui-surface="toolbar" data-ui-frame="capsule" data-theme="${theme}">
        ${head}
        ${navHtml}
        <textarea class="ui-field"></textarea>
        ${footer}
      </div>
    `;
    root.hidden = false;
    const textarea = root.querySelector(".ui-field");
    const navLabel = root.querySelector(".ui-nav-label");
    const counter = root.querySelector(".ui-counter");
    const themeButton = root.querySelector('[data-action="theme"]');
    const currentTheme = popup.headless.theme.init(theme);
    const outside = popup.headless.outside.init();
    const paintTheme = () => {
      if (!themeButton) return;
      themeButton.innerHTML = ui.controls.icon(
        icon.emoji(icon.glyph(currentTheme.current), "default"),
      );
    };
    paintTheme();
    const state = popup.headless.init({ options, pick, values, value });
    const renderOption = () =>
      popup.headless.render({ state, options, textarea, navLabel });
    if (options.length) {
      renderOption();
    } else {
      textarea.value = String(value || "");
    }
    const sync = () =>
      popup.headless.sync({ state, options, limit, textarea, counter });
    sync();
    textarea.focus();
    return new Promise((resolve) => {
      const lifecycle = popup.headless.lifecycle.init();
      const mouseup = (event) => {
        popup.headless.outside.up(outside, event, root);
      };
      let click = () => {};
      let key = () => {};
      const refs = {
        root,
        textarea,
        click: (event) => click(event),
        key: (event) => key(event),
        mouseup,
        sync,
        resolve,
      };
      const close = (result = null) =>
        popup.headless.lifecycle.close(lifecycle, refs, result);
      const save = () => popup.headless.save({ state, options, limit, textarea });
      click = (event) => {
        if (popup.headless.outside.shouldClose(outside, event, root)) {
          return close(null);
        }
        const action = event.target.closest("[data-action]")?.dataset?.action;
        popup.headless.action(action, {
          options,
          state,
          textarea,
          renderOption,
          sync,
          close,
          root,
          theme: currentTheme,
          paintTheme,
          save,
        });
      };
      key = (event) => {
        popup.headless.keyboard(event, { close, save });
      };
      refs.click = click;
      refs.key = key;
      root.addEventListener("click", refs.click, { once: false });
      textarea.addEventListener("mousedown", () =>
        popup.headless.outside.down(outside),
      );
      root.addEventListener("mouseup", mouseup, { once: false });
      root.addEventListener("keydown", refs.key, { once: false });
      textarea.addEventListener("input", sync, { once: false });
    });
  },
};

const tabs = {
  headless: {
    init({
      items = [],
      active = "",
    } = {}) {
      const list = Array.isArray(items) ? items : [];
      const fallback = String(list[0] || "");
      const current = String(active || fallback);
      return {
        items: list,
        active: list.includes(current) ? current : fallback,
      };
    },
    set(state, next = "") {
      const value = String(next || "");
      if (!state?.items?.includes(value)) return state?.active || "";
      state.active = value;
      return state.active;
    },
    index(state) {
      if (!state?.items?.length) return -1;
      return state.items.indexOf(state.active);
    },
    step(state, delta = 0) {
      if (!state?.items?.length) return "";
      const current = tabs.headless.index(state);
      const size = state.items.length;
      const next = (current + delta + size) % size;
      state.active = state.items[next];
      return state.active;
    },
    next(state) {
      return tabs.headless.step(state, 1);
    },
    prev(state) {
      return tabs.headless.step(state, -1);
    },
    bind({
      root = null,
      scope = "[data-tabs]",
      tab = "[data-source]",
      key = "source",
      active = () => "",
      step = () => "",
    } = {}) {
      const host = root?.querySelector?.(scope);
      if (!host) return () => {};
      const keydown = (event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        const current = active(event.target.closest(tab));
        if (!current) return;
        const next = step(current, event.key === "ArrowRight" ? 1 : -1);
        if (!next || next === current) return;
        event.preventDefault();
        root.querySelector(`${tab}[data-${key}="${next}"]`)?.focus();
      };
      host.addEventListener("keydown", keydown, { once: false });
      return () => host.removeEventListener("keydown", keydown);
    },
  },
};

const shell = {
  group(content = "", options = "") {
    if (typeof options === "string") {
      return `<div class="ui-group"${options}><div class="ui-group-body">${content}</div></div>`;
    }
    const {
      attrs = "",
      classes = "",
      stick = "",
      rail = true,
    } = options || {};
    const classAttr = classes ? ` ${classes}` : "";
    const stickAttr = stick ? ` data-sticky-group="${stick}"` : "";
    const railAttr = rail ? ` data-rail-group="true"` : "";
    return `<div class="ui-group${classAttr}"${stickAttr}${railAttr}${attrs}><div class="ui-group-body">${content}</div></div>`;
  },
  strip(content = "", options = "") {
    if (typeof options === "string") {
      return `<div class="ui-group-body ui-strip"${options}>${content}</div>`;
    }
    const { attrs = "", classes = "" } = options || {};
    const classAttr = classes ? ` ${classes}` : "";
    return `<div class="ui-group-body ui-strip${classAttr}"${attrs}>${content}</div>`;
  },
  line(content = "", attrs = "") {
    return `<div class="ui-line"${attrs}>${content}</div>`;
  },
  row(content = "", attrs = "") {
    return `<div class="ui-stack-row"${attrs}>${content}</div>`;
  },
  stack(content = "", attrs = "") {
    return `<div class="ui-stack"${attrs}>${content}</div>`;
  },
  shell({
    left = "",
    main = "",
    right = "",
    classes = "",
    attrs = "",
  } = {}) {
    const classAttr = classes ? ` ${classes}` : "";
    return `<div class="ui-shell${classAttr}"${attrs}>${left}${shell.line(main, ' data-line="true"')}${right}</div>`;
  },
};

const controls = {
  icon(content = "") {
    return `<span class="ui-icon-box"><span class="ui-icon-content">${content}</span></span>`;
  },
  button({
    content = "",
    action = "",
    title = "",
    classes = "",
    attrs = "",
  } = {}) {
    const actionAttr = action ? ` data-action="${action}"` : "";
    const titleAttr = title ? ` title="${title}"` : "";
    const classAttr = classes ? ` ${classes}` : "";
    return `<button class="button button-emoji button-icon ui-button${classAttr}"${actionAttr}${titleAttr}${attrs}>${controls.icon(content)}</button>`;
  },
  marker({
    content = "",
    stick = "left",
    rail = true,
    button = {},
    group = {},
  } = {}) {
    const markerButton = controls.button({
      content,
      ...button,
    });
    return shell.group(markerButton, {
      stick,
      rail,
      ...group,
    });
  },
  counter({ current = 0, limit = 0, classes = "", attrs = "" } = {}) {
    const value = Number(current) || 0;
    const max = Number(limit) || 0;
    const text = max > 0 ? `${value}/${max}` : `${value}`;
    const raw = max > 0 ? (value / max) * 100 : 0;
    const progress = Math.round(Math.min(100, Math.max(0, raw)));
    const overflow = Math.round(Math.max(0, raw - 100));
    const over = max > 0 && value > max ? "true" : "false";
    const classAttr = classes ? ` ${classes}` : "";
    const overflowWidth = Math.min(100, overflow);
    return `<span class="ui-counter-pill${classAttr}" data-over="${over}" data-progress="${progress}" data-overflow="${overflow}" title="${text}" style="--counter-progress:${progress};--counter-overflow:${overflowWidth};"${attrs}><span class="ui-counter-fill" aria-hidden="true"></span><span class="ui-counter-overflow" aria-hidden="true"></span><span class="ui-counter-text">${text}</span></span>`;
  },
};

const surface = {
  sync(panel, { layout = "", theme = "", surface = "" } = {}) {
    if (!panel) return;
    if (layout) panel.dataset.layout = layout;
    if (theme) panel.dataset.theme = theme;
    if (surface) panel.dataset.uiSurface = surface;
    if (!surface) delete panel.dataset.uiSurface;
  },
};

const ui = { popup, tabs, shell, controls, surface };

export { ui };
