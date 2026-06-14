import { css } from "./css.js";
import { icon } from "./icon.js";

const popup = {
  id: "ui-popup",
  styleId: "ui-popup-style",
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
      controls.counterSync(counter, {
        current: Array.from(current).length,
        limit: Number(max) || 0,
      });
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
      document.getElementById("reader-panel")?.dataset?.theme ||
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
      left: ui.shell.group(ui.controls.counter({ classes: "ui-counter" }), {
        classes: "ui-counter-group",
      }),
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
        const counterNode = event.target.closest(".ui-counter-pill");
        if (counterNode) {
          const show = counterNode.getAttribute("data-show-text") !== "false";
          counterNode.setAttribute("data-show-text", show ? "false" : "true");
          return;
        }
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
      stretch = false,
    } = options || {};
    const classAttr = classes ? ` ${classes}` : "";
    const stickAttr = stick ? ` data-sticky-group="${stick}"` : "";
    const railAttr = rail ? ` data-rail-group="true"` : "";
    const stretchAttr = stretch ? ' data-stretch-group="true"' : "";
    return `<div class="ui-group${classAttr}"${stickAttr}${railAttr}${stretchAttr}${attrs}><div class="ui-group-body">${content}</div></div>`;
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
    pack = "between",
  } = {}) {
    const classAttr = classes ? ` ${classes}` : "";
    const packAttr = ` data-pack="${pack}"`;
    return `<div class="ui-shell${classAttr}"${packAttr}${attrs}>${left}${shell.line(main, ' data-line="true"')}${right}</div>`;
  },
};

const controls = {
  icon(content = "") {
    return `<span class="ui-icon-box"><span class="ui-icon-content">${content}</span></span>`;
  },
  glyph(name = "", size = 20, fallback = name) {
    const primary = icon.fluent(name, size);
    const backup = icon.fluent(fallback || name, size);
    return `<img class="toolbar-icon" src="${primary}" alt="" onerror="this.onerror=null;this.src='${backup}'">`;
  },
  button({
    content = "",
    glyph = "",
    fluent = "",
    fallback = "",
    size = 20,
    action = "",
    title = "",
    classes = "",
    attrs = "",
  } = {}) {
    const actionAttr = action ? ` data-action="${action}"` : "";
    const titleAttr = title ? ` title="${title}"` : "";
    const classAttr = classes ? ` ${classes}` : "";
    const value = fluent
      ? controls.glyph(fluent, size, fallback || fluent)
      : glyph
        ? icon.emoji(glyph, "default")
        : content;
    return `<button class="button button-emoji button-icon ui-button${classAttr}"${actionAttr}${titleAttr}${attrs}>${controls.icon(value)}</button>`;
  },
  panelActions({
    theme = "light",
    themeAction = "theme",
    closeAction = "close",
  } = {}) {
    return controls.cluster({
      content: `${controls.button({
        content: icon.emoji(icon.glyph(theme), "default"),
        action: themeAction,
        title: "Тема",
        attrs: ' type="button" data-panel-theme-button="true"',
      })}${controls.button({
        content: icon.emoji("❌", "default"),
        action: closeAction,
        title: "Закрыть",
        attrs: ' type="button"',
      })}`,
    });
  },
  panelActionsSync(root, { theme = "light", themeAction = "theme" } = {}) {
    const button = root?.querySelector?.(
      `[data-action="${themeAction}"][data-panel-theme-button="true"]`,
    );
    if (!button) return;
    button.innerHTML = controls.icon(icon.emoji(icon.glyph(theme), "default"));
  },
  separator({ classes = "", attrs = "" } = {}) {
    const classAttr = classes ? ` ${classes}` : "";
    return `<span class="ui-separator${classAttr}" data-ui-separator="true" aria-hidden="true"${attrs}></span>`;
  },
  cluster({
    content = "",
    stick = "",
    rail = true,
    group = {},
  } = {}) {
    const attrs = `${group.attrs || ""} data-ui-cluster="true"`;
    return shell.group(content, {
      stick,
      rail,
      ...group,
      attrs,
    });
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
    return controls.cluster({
      content: markerButton,
      stick,
      rail,
      group,
    });
  },
  escape(value = "") {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },
  counter({
    current = 0,
    limit = 0,
    label = "",
    classes = "",
    attrs = "",
    showText = true,
    showLabel = false,
  } = {}) {
    const state = controls.counterState({ current, limit });
    const { text, progress, overflow, over } = state;
    const classAttr = classes ? ` ${classes}` : "";
    const overflowWidth = Math.min(100, overflow);
    const textAttr = showText ? "true" : "false";
    const labelAttr = showLabel ? "true" : "false";
    const labelText = controls.escape(label);
    const title = label ? `${label}: ${text}` : text;
    return `<span class="ui-counter-pill${classAttr}" data-over="${over}" data-progress="${progress}" data-overflow="${overflow}" data-show-text="${textAttr}" data-show-label="${labelAttr}" data-label="${labelText}" title="${controls.escape(title)}" style="--counter-progress:${progress};--counter-overflow:${overflowWidth};"${attrs}><span class="ui-counter-fill" aria-hidden="true"></span><span class="ui-counter-overflow" aria-hidden="true"></span><span class="ui-counter-label">${labelText}</span><span class="ui-counter-text">${text}</span></span>`;
  },
  counterState({ current = 0, limit = 0 } = {}) {
    const value = Number(current) || 0;
    const max = Number(limit) || 0;
    const text = max > 0 ? `${value}/${max}` : `${value}`;
    const raw = max > 0 ? (value / max) * 100 : 0;
    const progress = Math.round(Math.min(100, Math.max(0, raw)));
    const overflow = Math.round(Math.max(0, raw - 100));
    const over = max > 0 && value > max ? "true" : "false";
    const overflowWidth = Math.min(100, overflow);
    const overflowTone = controls.counterOverflowTone(overflow);
    return { value, max, text, progress, overflow, over, overflowWidth, overflowTone };
  },
  counterOverflowTone(overflow = 0) {
    const value = Number(overflow) || 0;
    if (value <= 0) return "none";
    if (value > 150) return "extreme";
    if (value > 75) return "high";
    if (value > 25) return "medium";
    return "low";
  },
  counterSync(node, {
    current = 0,
    limit = 0,
    label = "",
    showLabel = null,
  } = {}) {
    if (!node) return;
    const state = controls.counterState({ current, limit });
    const text = node.querySelector(".ui-counter-text");
    const labelNode = node.querySelector(".ui-counter-label");
    if (text) text.textContent = state.text;
    if (labelNode) labelNode.textContent = String(label || "");
    node.style.setProperty("--counter-progress", String(state.progress));
    node.style.setProperty("--counter-overflow", String(state.overflow));
    node.style.setProperty("--counter-overflow-width", String(state.overflowWidth));
    node.setAttribute("data-progress", String(state.progress));
    node.setAttribute("data-overflow", String(state.overflow));
    node.setAttribute("data-overflow-tone", String(state.overflowTone));
    node.setAttribute("data-over", String(state.over));
    node.setAttribute("title", label ? `${label}: ${state.text}` : state.text);
    if (label) node.setAttribute("data-label", String(label));
    if (showLabel !== null) {
      node.setAttribute("data-show-label", showLabel ? "true" : "false");
    }
  },
  progress({ id = "", classes = "", attrs = "" } = {}) {
    const idAttr = id ? ` id="${id}"` : "";
    const classAttr = classes ? ` ${classes}` : "";
    return `<div class="progress${classAttr}"${idAttr}${attrs}><div class="progress-track"><div class="progress-fill" data-progress-bar="true"></div></div></div>`;
  },
  progressSync(node, percent = 0) {
    if (!node) return;
    const value = Number.isFinite(percent) ? percent : 0;
    const width = Math.max(0, Math.min(100, Math.round(value)));
    const bar =
      node.querySelector("[data-progress-bar='true']") ||
      node.querySelector(".progress-fill");
    if (!bar) return;
    bar.style.width = `${width}%`;
  },
  message({
    icon: value = "",
    rawIcon = "",
    text = "",
    scope = "default",
    classes = "",
    attrs = "",
  } = {}) {
    const classAttr = classes ? ` ${classes}` : "";
    const iconHtml = rawIcon
      ? `<span class="ui-message-icon">${String(rawIcon)}</span>`
      : value
        ? `<span class="ui-message-icon">${icon.emoji(value, scope)}</span>`
        : "";
    const textHtml = `<span class="ui-message-text">${String(text || "")}</span>`;
    return `<span class="ui-message${classAttr}"${attrs}>${iconHtml}${textHtml}</span>`;
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
  theme: {
    set(value = "") {
      const next = value === "dark" ? "dark" : "light";
      document.documentElement.dataset.uiTheme = next;
      return next;
    },
    syncButton(root, { action = "theme", scope = "default" } = {}) {
      const button = root?.querySelector?.(`[data-action="${action}"]`);
      if (!button) return;
      const theme = root?.dataset?.theme || "light";
      button.innerHTML = controls.icon(icon.emoji(icon.glyph(theme), scope));
    },
  },
  lock: {
    measure(
      panel,
      {
        bodySelector = "[data-fields-body]",
        minWidth = 420,
        minHeight = 140,
        minBodyHeight = 60,
      } = {},
    ) {
      if (!panel) return null;
      const body = panel.querySelector(bodySelector);
      if (!body) return null;
      const rect = panel.getBoundingClientRect();
      const width = Math.ceil(rect.width);
      const height = Math.ceil(rect.height);
      const bodyHeight = Math.ceil(body.getBoundingClientRect().height);
      if (width < minWidth || height < minHeight || bodyHeight < minBodyHeight) {
        return null;
      }
      return { width, height, bodyHeight };
    },
    apply(panel, lock, { bodySelector = "[data-fields-body]" } = {}) {
      if (!panel || !lock) return;
      const body = panel.querySelector(bodySelector);
      panel.style.width = `${lock.width}px`;
      panel.style.minWidth = `${lock.width}px`;
      panel.style.maxWidth = `${lock.width}px`;
      panel.style.height = `${lock.height}px`;
      panel.style.minHeight = `${lock.height}px`;
      panel.style.maxHeight = `${lock.height}px`;
      if (!body) return;
      body.style.height = `${lock.bodyHeight}px`;
      body.style.minHeight = `${lock.bodyHeight}px`;
      body.style.maxHeight = `${lock.bodyHeight}px`;
    },
  },
  rows: {
    count(list, selector = "[data-row]") {
      if (!list) return 0;
      return list.querySelectorAll(selector).length || 0;
    },
    measure(
      panel,
      list,
      {
        rowSelector = "[data-row]",
        rowHeightVar = "--proofread-row-height",
        rowBorderVar = "--proofread-row-border-width",
        rowGapVar = "",
        minStep = 8,
        fallbackStep = 30,
        fallbackBorder = 1,
      } = {},
    ) {
      const rows = list ? [...list.querySelectorAll(rowSelector)] : [];
      const item = rows[0] || null;
      const next = rows[1] || null;
      const style = panel ? getComputedStyle(panel) : null;
      const itemHeight = item ? Math.round(item.getBoundingClientRect().height) : 0;
      const stepByRows =
        item && next
          ? Math.round(
              next.getBoundingClientRect().top - item.getBoundingClientRect().top,
            )
          : 0;
      const height =
        itemHeight ||
        parseFloat(style?.getPropertyValue(rowHeightVar)) ||
        fallbackStep;
      const gapByRows = stepByRows ? Math.max(0, stepByRows - height) : 0;
      const gap =
        gapByRows ||
        parseFloat(style?.getPropertyValue(rowGapVar)) ||
        0;
      const step = stepByRows || height + gap;
      const border =
        parseFloat(style?.getPropertyValue(rowBorderVar)) || fallbackBorder;
      return {
        height: Math.max(minStep, Math.round(height)),
        gap: Math.max(0, Math.round(gap)),
        step: Math.max(minStep, Math.round(step)),
        border,
      };
    },
    chrome(
      panel,
      {
        headerSelector = "[data-header]",
        headerHeightVar = "",
      } = {},
    ) {
      if (!panel) return 0;
      const style = getComputedStyle(panel);
      const header = panel.querySelector(headerSelector);
      const paddingTop = parseFloat(style?.paddingTop) || 0;
      const paddingBottom = parseFloat(style?.paddingBottom) || 0;
      const headerHeight = headerHeightVar
        ? parseFloat(style?.getPropertyValue(headerHeightVar)) ||
          header?.offsetHeight ||
          0
        : header?.offsetHeight || 0;
      return Math.round(paddingTop + paddingBottom + headerHeight);
    },
    fit(
      panel,
      list,
      {
        visible = 0,
        loading = () => false,
        rowSelector = "[data-row]",
        emptySelector = "[data-empty]",
        rowHeightVar = "--proofread-row-height",
        rowBorderVar = "--proofread-row-border-width",
        rowGapVar = "",
        headerSelector = "[data-header]",
        headerHeightVar = "",
        preserveHeight = false,
      } = {},
    ) {
      if (!panel || !list || loading()) return { rows: 0, count: 0 };
      const measure = surface.rows.measure(panel, list, {
        rowSelector,
        rowHeightVar,
        rowBorderVar,
        rowGapVar,
      });
      const chrome = surface.rows.chrome(panel, {
        headerSelector,
        headerHeightVar,
      });
      const count = surface.rows.count(list, rowSelector);
      const visibleRows = Math.max(0, Math.round(Number(visible) || 0));
      const rows = Math.max(0, Math.min(visibleRows, count));
      const heightRows = preserveHeight ? visibleRows : rows;
      const listStyle = getComputedStyle(list);
      const listPadding =
        (parseFloat(listStyle.paddingTop) || 0) +
        (parseFloat(listStyle.paddingBottom) || 0);
      const rowStackHeight = (value) => {
        const amount = Math.max(0, Math.round(Number(value) || 0));
        if (!amount) return 0;
        return (
          amount * measure.height +
          Math.max(0, amount - 1) * measure.gap +
          measure.border
        );
      };
      const emptyHeight = Math.max(
        rowStackHeight(heightRows || 1),
        measure.step,
        (list.querySelector(emptySelector)?.offsetHeight || 0) +
          measure.border * 2,
      );
      const listHeight =
        (count > 0 ? rowStackHeight(heightRows) : emptyHeight) + listPadding;
      panel.style.height = `${Math.round(chrome + listHeight)}px`;
      list.style.maxHeight = `${Math.round(listHeight)}px`;
      return { rows, count, heightRows, listHeight, chrome };
    },
  },
  progress: {
    ensure({
      id = "ui-progress",
      textId = "ui-progress-text",
      meterId = "ui-progress-counter",
      classes = "",
      rowAttrs = "",
    } = {}) {
      let panel = document.getElementById(id);
      if (!panel) {
        panel = document.createElement("div");
        panel.id = id;
        panel.className = ["panel", classes].filter(Boolean).join(" ");
        panel.innerHTML = shell.stack(
          `${shell.row(`<div id="${textId}"></div>`, rowAttrs)}${shell.row(
            controls.counter({ classes: "ui-counter", attrs: ` id="${meterId}"` }),
          )}`,
        );
        document.body.appendChild(panel);
      }
      panel.dataset.uiSurface = "progress";
      if (!panel.dataset.uiFrame) panel.dataset.uiFrame = "capsule";
      return panel;
    },
    sync(
      panel,
      {
        text = "",
        current = 0,
        limit = 0,
        done = null,
        total = null,
        textId = "ui-progress-text",
        meterId = "ui-progress-counter",
      } = {},
    ) {
      if (!panel) return;
      const label = panel.querySelector(`#${textId}`);
      if (label) label.innerHTML = String(text || "");
      controls.counterSync(panel.querySelector(`#${meterId}`), {
        current: done ?? current,
        limit: total ?? limit,
      });
    },
  },
};

const ui = { popup, tabs, shell, controls, surface };

export { ui };
