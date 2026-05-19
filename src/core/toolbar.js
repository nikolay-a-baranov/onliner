import { panel } from "./panel.js";
import { css } from "./css.js";
import { icon } from "./icon.js";

export const toolbar = {
  snapHint: {
    node: null,
    ensure() {
      if (toolbar.snapHint.node?.isConnected) return toolbar.snapHint.node;
      const node = document.createElement("div");
      node.dataset.toolbarSnapHint = "true";
      node.style.position = "fixed";
      node.style.left = "0";
      node.style.top = "0";
      node.style.width = "0";
      node.style.height = "0";
      node.style.pointerEvents = "none";
      node.style.zIndex = "999998";
      node.style.borderRadius = "14px";
      node.style.opacity = "0";
      node.style.transform = "translateZ(0) scale(0.985)";
      node.style.transition =
        "opacity 0.12s ease, top 0.14s ease, left 0.14s ease, width 0.14s ease, height 0.14s ease, transform 0.14s ease";
      node.style.background = "rgba(120, 180, 255, 0.18)";
      node.style.border = "1px solid rgba(120, 180, 255, 0.52)";
      node.style.boxShadow =
        "0 0 0 1px rgba(255,255,255,0.08) inset, 0 0 12px rgba(120, 180, 255, 0.24)";
      node.style.backdropFilter = "blur(2px)";
      node.style.webkitBackdropFilter = "blur(2px)";
      document.body.appendChild(node);
      toolbar.snapHint.node = node;
      return node;
    },
    clear() {
      const node = toolbar.snapHint.node;
      if (!node) return;
      node.style.opacity = "0";
      node.style.transform = "translateZ(0) scale(0.985)";
    },
    update(panel, { snap = 96, top = 96, bottom = 60 } = {}) {
      if (!panel) return toolbar.snapHint.clear();
      const rect = panel.getBoundingClientRect();
      const inset = toolbar.insets();
      const screen = toolbar.screen();
      const topInset = Math.max(0, inset.top || 0);
      const rightInset = Math.max(0, inset.right || 0);
      const bottomInset = Math.max(0, inset.bottom || 0);
      const leftInset = Math.max(0, inset.left || 0);
      const screenTop = screen.offsetTop;
      const screenBottom = screen.offsetTop + screen.height;
      const topOffset = Math.max(0, top + inset.top);
      const bottomOffset = Math.max(0, bottom + inset.bottom);
      const nearTop = rect.top - screenTop < snap + topInset;
      const nearBottom = screenBottom - rect.bottom < snap + bottomInset;
      if (!nearTop && !nearBottom) return toolbar.snapHint.clear();
      const node = toolbar.snapHint.ensure();
      const width = Math.max(48, Math.round(screen.width - leftInset - rightInset - 16));
      const left = Math.round(screen.offsetLeft + leftInset + 8);
      const height = Math.max(28, Math.round((rect.height || 42) + 6));
      const y = nearTop
        ? Math.round(screenTop + topOffset - 3)
        : Math.round(screenBottom - bottomOffset - height + 3);
      node.style.left = `${left}px`;
      node.style.width = `${width}px`;
      node.style.height = `${height}px`;
      node.style.top = `${y}px`;
      node.style.opacity = "1";
      node.style.transform = "translateZ(0) scale(1)";
    },
  },
  binding: new WeakMap(),
  preview: new WeakMap(),
  ensureBinding(panel) {
    const value = toolbar.binding.get(panel);
    if (value) return value;
    const next = { clear: [] };
    toolbar.binding.set(panel, next);
    return next;
  },
  listen(panel, target, name, handler, options) {
    if (!target || !name || !handler) return () => {};
    target.addEventListener(name, handler, options);
    const binding = toolbar.ensureBinding(panel);
    const clear = () => target.removeEventListener(name, handler, options);
    binding.clear.push(clear);
    return clear;
  },
  timer(panel, handler, timeout) {
    const id = setInterval(handler, timeout);
    const binding = toolbar.ensureBinding(panel);
    const clear = () => clearInterval(id);
    binding.clear.push(clear);
    return clear;
  },
  destroy(panel) {
    if (!panel) return;
    const preview = toolbar.preview.get(panel);
    if (preview?.timer) clearTimeout(preview.timer);
    toolbar.preview.delete(panel);
    const binding = toolbar.binding.get(panel);
    if (binding) {
      binding.clear.forEach((clear) => clear());
      toolbar.binding.delete(panel);
    }
    delete panel.dataset.drag;
    delete panel.dataset.observe;
    delete panel.dataset.scroll;
  },
  icon(content = "") {
    return `<span class="toolbar-media-box toolbar-icon-box"><span class="toolbar-media toolbar-icon-content">${content}</span></span>`;
  },
  editor: {
    metric: {
      touchBottom: "calc(env(safe-area-inset-bottom) + 60px)",
      desktopBottom: "60px",
      keyboardTop: "calc(env(safe-area-inset-top) + 80px)",
    },
    style() {
      return css.editor.text();
    },
    assets(scope = "editor") {
      return {
        glyph: {
          drag: icon.fluent("Drag"),
          scroll: icon.fluent("Dual Screen Update"),
          nbsp: icon.fluent("Spacebar"),
          em: icon.fluent("Text Italic"),
          strong: icon.fluent("Text Bold"),
          killem: icon.fluent("Eraser"),
          quote: icon.fluent("Comment Quote"),
          comma: icon.fluent("Comma"),
          dash: icon.fluent("Line Horizontal 1"),
          colon: icon.fluent("More Vertical"),
          punct: icon.fluent("Arrow Sync"),
          home: icon.fluent("Arrow Bounce"),
          left: icon.fluent("Chevron Left"),
          right: icon.fluent("Chevron Right"),
          letter: icon.fluent("Text Font Size"),
          number: icon.fluent("Number Symbol"),
          symbol: icon.fluent("Symbols"),
          math: icon.fluent("Math Symbols"),
          accent: icon.fluent("Gavel"),
          abbr: icon.fluent("Arrow Autofit Width Dotted"),
          year: icon.fluent("Calendar"),
          note: icon.fluent("Note"),
          list: icon.fluent("Apps List"),
          branch: icon.fluent("Branch Fork"),
          exit: icon.fluent("Arrow Exit"),
        },
        logo: (name) => icon.logo.editorSource(name),
        emoji: (value) => icon.emoji(value),
        mode: icon.mode.get(scope),
      };
    },
    mount({ id, html, style, place = "right" }) {
      const node = panel.create({ id, html, place });
      panel.mount(`${id}-style`, style);
      return node;
    },
    unmount(id) {
      document.getElementById(`${id}-style`)?.remove();
    },
    button(item, { glyph = {}, logo = null, emoji = null, iconMode = "glyph" } = {}) {
      const useGlyph = iconMode === "glyph";
      const content = item.logo
        ? logo?.(item.logo) || ""
        : useGlyph && item.icon
          ? `<img class="toolbar-icon" src="${glyph[item.icon] || ""}" alt="">`
          : emoji?.(item.emoji || item.label || "") || String(item.emoji || item.label || "");
      return `<button class="button button-emoji button-icon toolbar-segment" data-action="${item.action}">${toolbar.icon(content)}</button>`;
    },
    row(items = [], options = {}) {
      return `<div class="toolbar-group editor-row"><div class="toolbar-segment-group">${items.map((item) => toolbar.editor.button(item, options)).join("")}</div></div>`;
    },
    drag({ glyph = {} } = {}) {
      const icon = glyph.drag || "";
      return `<div class="toolbar-group" data-drag-group="true"><div class="toolbar-segment-group"><button class="button button-emoji button-icon toolbar-segment" data-drag-handle="true" type="button">${toolbar.icon(`<img class="toolbar-icon" src="${icon}" alt="">`)}</button></div></div>`;
    },
    html(rows = [], options = {}) {
      return `${toolbar.editor.drag(options)}${rows.map((items) => toolbar.editor.row(items, options)).join("")}`;
    },
    fit(panel, { content = "content", edge = 12, min = 280 } = {}) {
      const screen = toolbar.screen();
      const field = document.getElementById(content);
      const rect = field?.getBoundingClientRect();
      const viewportMax = Math.max(min, screen.width - edge * 2);
      const fieldMax = rect ? Math.max(min, rect.width) : viewportMax;
      const maxWidth = Math.min(viewportMax, fieldMax);
      panel.style.setProperty("width", "fit-content", "important");
      panel.style.setProperty("max-width", "none", "important");
      const natural = Math.max(min, panel.scrollWidth || panel.offsetWidth || 0);
      const width = Math.min(natural, maxWidth);
      const center = rect
        ? rect.left + rect.width / 2
        : screen.offsetLeft + screen.width / 2;
      const minLeft = screen.offsetLeft + edge;
      const maxLeft = screen.offsetLeft + screen.width - width - edge;
      const left = Math.min(maxLeft, Math.max(minLeft, center - width / 2));
      return { left, width, maxWidth, rect };
    },
  },
  segment(panel, {
    root = panel,
    hold = [],
    delay = 420,
    disabled = () => false,
    action = () => {},
  } = {}) {
    if (!panel || !root) return;
    const state = { timer: null, name: "", consumed: false, button: null, skip: "" };
    const clear = () => {
      if (!state.timer) return;
      clearTimeout(state.timer);
      state.timer = null;
    };
    toolbar.listen(panel, root, "mousedown", (event) => event.preventDefault());
    toolbar.listen(
      panel,
      root,
      "touchstart",
      (event) => {
        const button = event.target.closest("[data-action]");
        if (!button) return;
        const name = button.dataset.action || "";
        if (!hold.includes(name)) return;
        event.preventDefault();
        event.stopPropagation();
        clear();
        state.name = name;
        state.button = button;
        state.consumed = false;
        state.timer = setTimeout(() => {
          state.timer = null;
          state.consumed = true;
          action({ name, kind: "hold", button, event });
        }, delay);
      },
      { passive: false },
    );
    toolbar.listen(panel, root, "touchend", (event) => {
      const target = event.target?.closest?.("[data-action]");
      const name = target?.dataset?.action || "";
      const holdName = state.name;
      const holdButton = state.button;
      const wasPending = Boolean(state.timer);
      clear();
      if (!target || !name) {
        state.name = "";
        state.button = null;
        return;
      }
      if (hold.includes(name)) {
        if (!wasPending || !holdButton || !holdName) return;
        if (disabled(name, target)) {
          target.blur?.();
          state.name = "";
          state.button = null;
          return;
        }
        state.skip = name;
        action({ name, kind: "click", button: target, event });
        target.blur?.();
        state.name = "";
        state.button = null;
        return;
      }
      if (disabled(name, target)) {
        target.blur?.();
        return;
      }
      state.skip = name;
      action({ name, kind: "click", button: target, event });
      target.blur?.();
      state.name = "";
      state.button = null;
    });
    toolbar.listen(panel, root, "touchcancel", clear);
    toolbar.listen(panel, root, "click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const button = event.target.closest("[data-action]");
      if (!button) return;
      const name = button.dataset.action || "";
      if (state.skip && state.skip === name) {
        state.skip = "";
        return;
      }
      if (state.consumed && state.name === name) {
        state.consumed = false;
        state.name = "";
        state.button = null;
        return;
      }
      if (disabled(name, button)) {
        button.blur?.();
        return;
      }
      action({ name, kind: "click", button, event });
      button.blur?.();
    });
  },
  state(key, value) {
    if (value === undefined) {
      try {
        return JSON.parse(localStorage.getItem(key) || "null");
      } catch {
        return null;
      }
    }
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  },
  floating(panel, value) {
    panel.style.setProperty("left", `${value.left}px`, "important");
    panel.style.setProperty("top", `${value.top}px`, "important");
    panel.style.setProperty("right", "auto", "important");
    panel.style.setProperty("bottom", "auto", "important");
    panel.style.setProperty("width", "auto", "important");
    panel.style.setProperty("transform", "none", "important");
  },
  place(
    panel,
    {
      layout = "fullscreen",
      touch = false,
      fit = null,
      keyboardOpen = false,
      touchBottom = "calc(env(safe-area-inset-bottom) + 60px)",
      desktopBottom = "60px",
      keyboardTop = "calc(env(safe-area-inset-top) + 80px)",
    } = {},
  ) {
    const screen = toolbar.screen();
    const box = fit || {};
    panel.style.setProperty("right", "auto", "important");
    panel.style.setProperty("top", "auto", "important");
    if (layout === "bottom") {
      if (box.rect) {
        const bottomGap = Math.max(12, window.innerHeight - box.rect.bottom + 12);
        panel.style.setProperty("left", `${box.left}px`, "important");
        panel.style.setProperty(
          "bottom",
          `calc(${bottomGap}px + env(safe-area-inset-bottom))`,
          "important",
        );
        panel.style.setProperty("width", `${box.width}px`, "important");
        panel.style.setProperty("max-width", `${box.maxWidth}px`, "important");
        panel.style.setProperty("transform", "none", "important");
        return;
      }
      panel.style.setProperty("left", `${screen.offsetLeft}px`, "important");
      panel.style.setProperty(
        "bottom",
        `calc(${Math.max(0, window.innerHeight - screen.height - screen.offsetTop)}px + env(safe-area-inset-bottom))`,
        "important",
      );
      panel.style.setProperty("width", `${screen.width}px`, "important");
      panel.style.setProperty("max-width", "100vw", "important");
      panel.style.setProperty("transform", "none", "important");
      return;
    }
    if (layout === "fullscreen") {
      if (keyboardOpen) {
        panel.style.setProperty("left", `${box.left}px`, "important");
        panel.style.setProperty("top", keyboardTop, "important");
        panel.style.setProperty("bottom", "auto", "important");
      } else {
        panel.style.setProperty("left", `${box.left}px`, "important");
        panel.style.setProperty("top", "auto", "important");
        panel.style.setProperty(
          "bottom",
          touch ? touchBottom : desktopBottom,
          "important",
        );
      }
      panel.style.setProperty("width", `${box.width}px`, "important");
      panel.style.setProperty("max-width", `${box.maxWidth}px`, "important");
      panel.style.setProperty("transform", "none", "important");
    }
  },
  snapshot(panel) {
    if (!panel) return null;
    const rect = panel.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      dock: {
        target: panel.dataset.dockTarget || "floating",
        side: panel.dataset.dock || "floating",
      },
    };
  },
  rerender(panel, render, restore) {
    if (!panel || typeof render !== "function") return null;
    const shot = toolbar.snapshot(panel);
    render();
    if (typeof restore === "function") restore(shot);
    return shot;
  },
  zIndex(panel) {
    const inline = parseInt(panel?.style?.zIndex || "", 10);
    if (Number.isFinite(inline)) return inline;
    const computed = parseInt(getComputedStyle(panel).zIndex || "", 10);
    if (Number.isFinite(computed)) return computed;
    return 999999;
  },
  bringToFront(panel) {
    if (!panel) return;
    const list = [...document.querySelectorAll(".panel")];
    const top = list.reduce((max, item) => Math.max(max, toolbar.zIndex(item)), 999998);
    panel.style.setProperty("z-index", `${top + 1}`, "important");
  },
  recover(panel, { edge = 8, mode = "center" } = {}) {
    if (!panel) return false;
    if (!toolbar.escaped(panel, edge)) return false;
    toolbar.fit(panel, edge);
    if (mode === "clamp") {
      const rect = panel.getBoundingClientRect();
      const next = toolbar.clamp(panel, { left: rect.left, top: rect.top, edge });
      toolbar.floating(panel, next);
      return true;
    }
    toolbar.center(panel, edge);
    return true;
  },
  center(panel, edge = 12) {
    toolbar.fit(panel, edge);
    const screen = toolbar.screen();
    const width = panel.offsetWidth || panel.getBoundingClientRect().width || 0;
    const height =
      panel.offsetHeight || panel.getBoundingClientRect().height || 0;
    const left = screen.offsetLeft + (screen.width - width) / 2;
    const top = screen.offsetTop + (screen.height - height) / 2;
    const next = toolbar.clamp(panel, { left, top, edge });
    toolbar.floating(panel, next);
    return next;
  },
  clamp(panel, { left, top, edge = 8 }) {
    toolbar.fit(panel, edge);
    const screen = toolbar.screen();
    const width = panel.offsetWidth || panel.getBoundingClientRect().width || 0;
    const height =
      panel.offsetHeight || panel.getBoundingClientRect().height || 0;
    const minLeft = screen.offsetLeft + edge;
    const maxLeft = screen.offsetLeft + screen.width - width - edge;
    const minTop = screen.offsetTop + edge;
    const maxTop = screen.offsetTop + screen.height - height - edge;
    const safeLeft = minLeft > maxLeft ? screen.offsetLeft + (screen.width - width) / 2 : left;
    const safeTop = minTop > maxTop ? screen.offsetTop + (screen.height - height) / 2 : top;
    return {
      left: minLeft > maxLeft ? safeLeft : Math.min(maxLeft, Math.max(minLeft, safeLeft)),
      top: minTop > maxTop ? safeTop : Math.min(maxTop, Math.max(minTop, safeTop)),
    };
  },
  fit(panel, edge = 8) {
    if (!panel) return;
    const screen = toolbar.screen();
    const maxWidth = Math.max(140, Math.floor(screen.width - edge * 2));
    const maxHeight = Math.max(80, Math.floor(screen.height - edge * 2));
    panel.style.setProperty("max-width", `${maxWidth}px`, "important");
    panel.style.setProperty("max-height", `${maxHeight}px`, "important");
    const rect = panel.getBoundingClientRect();
    if (rect.width > maxWidth) {
      panel.style.setProperty("width", `${maxWidth}px`, "important");
    }
    if (rect.height > maxHeight) {
      panel.style.setProperty("height", `${maxHeight}px`, "important");
      panel.style.setProperty("overflow", "auto", "important");
    }
  },
  screen() {
    const viewport = window.visualViewport;
    if (!viewport)
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        offsetLeft: 0,
        offsetTop: 0,
      };
    return {
      width: viewport.width,
      height: viewport.height,
      offsetLeft: viewport.offsetLeft,
      offsetTop: viewport.offsetTop,
    };
  },
  keyboard() {
    const viewport = window.visualViewport;
    if (!viewport) return 0;
    return Math.max(
      0,
      window.innerHeight - (viewport.height + viewport.offsetTop),
    );
  },
  keyboardOpen(threshold = 120) {
    return toolbar.keyboard() >= threshold;
  },
  insets() {
    const reader = document.body?.classList?.contains("onliner-reader-active");
    if (!reader) return { top: 0, right: 0, bottom: 0, left: 0 };
    const style = getComputedStyle(document.documentElement);
    const keyboard =
      parseFloat(style.getPropertyValue("--reader-keyboard-gap")) || 0;
    const scrollbar =
      parseFloat(style.getPropertyValue("--reader-scrollbar-gap")) || 0;
    return {
      top: 76,
      right: Math.max(0, scrollbar),
      bottom: 64 + Math.max(0, keyboard),
      left: 0,
    };
  },
  desktop() {
    const screen = toolbar.screen();
    const precise = window.matchMedia("(pointer: fine)").matches;
    return precise || screen.width >= 1024;
  },
  tablet() {
    const screen = toolbar.screen();
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (toolbar.desktop()) return false;
    return touch && screen.width > 768;
  },
  phone() {
    const screen = toolbar.screen();
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (toolbar.desktop()) return false;
    return touch && screen.width <= 768;
  },
  mobile() {
    return toolbar.phone() || toolbar.tablet();
  },
  layout({ fullscreen }) {
    if (fullscreen) return "fullscreen";
    if (toolbar.mobile()) return "hidden";
    return "bottom";
  },
  theme(id = "content") {
    const value = document.getElementById(id);
    const color = value ? getComputedStyle(value).backgroundColor : "";
    if (color.includes("255, 255, 255")) return "light";
    return "dark";
  },
  themeToggleIcon(theme) {
    return theme === "dark" ? "\u{1F315}" : "\u{1F311}";
  },
  sync(panel, { layout, theme, surface }) {
    panel.dataset.layout = layout;
    panel.dataset.theme = theme;
    panel.dataset.keyboardOpen = toolbar.keyboardOpen() ? "true" : "false";
    if (surface) panel.dataset.uiSurface = surface;
    if (!surface) delete panel.dataset.uiSurface;
    if (surface === "toolbar") panel.dataset.toolbarCapsule = "true";
    if (surface !== "toolbar") delete panel.dataset.toolbarCapsule;
  },
  observe({
    panel,
    layout,
    place,
    rescue,
    theme,
    fullscreen = "fullscreen",
    scroll = true,
    wheel = null,
  }) {
    if (panel.dataset.observe === "true") return;
    panel.dataset.observe = "true";
    const sync = () => {
      panel.dataset.theme = theme();
    };
    toolbar.listen(
      panel,
      panel,
      "wheel",
      (event) => {
        if (layout() !== fullscreen) return;
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        event.preventDefault();
        if (!wheel) return;
        wheel(event);
      },
      { passive: false },
    );
    toolbar.timer(panel, sync, 300);
    toolbar.listen(panel, window, "resize", () => {
      place();
      if (rescue) rescue();
    });
    if (scroll) toolbar.listen(panel, window, "scroll", place, true);
  },
  scroll({ panel, canRun = () => true, wheel, touch = true, touchStep = null }) {
    if (!panel || panel.dataset.scroll === "true") return;
    panel.dataset.scroll = "true";
    let startX = 0;
    let startY = 0;
    let left = 0;
    let top = 0;
    let touchAction = "";
    let stepping = false;
    let pointerId = null;
    if (touchStep) {
      touchAction = panel.style.touchAction;
      panel.style.setProperty("touch-action", "none", "important");
    }
    if (wheel) {
      toolbar.listen(
        panel,
        panel,
        "wheel",
        (event) => {
          if (!canRun(event)) return;
          if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
          event.preventDefault();
          wheel(event);
        },
        { passive: false },
      );
    }
    if (!touch) return;
    toolbar.listen(panel, panel, "pointerdown", (event) => {
      if (!canRun(event)) return;
      if (event.pointerType !== "touch") return;
      stepping = Boolean(touchStep);
      pointerId = event.pointerId;
      panel.setPointerCapture?.(event.pointerId);
      startX = event.clientX;
      startY = event.clientY;
      left = panel.scrollLeft;
      top = panel.scrollTop;
    });
    toolbar.listen(
      panel,
      panel,
      "pointermove",
      (event) => {
        if (!canRun(event)) return;
        if (event.pointerType !== "touch") return;
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;
        if (Math.abs(deltaX) < 3 && Math.abs(deltaY) < 3) return;
        if (touchStep) {
          event.preventDefault();
          const config = touchStep(event) || {};
          const size = Number(config.step || 0);
          const axis = config.axis === "y" ? "y" : "x";
          if (Number.isFinite(size) && size > 0) {
            const delta = axis === "y" ? deltaY : deltaX;
            const threshold = Math.max(10, Math.min(size * 0.45, 24));
            if (Math.abs(delta) < threshold) return;
            const sign = delta > 0 ? 1 : -1;
            if (axis === "y") {
              panel.scrollTop -= sign * size;
              top = panel.scrollTop;
              startY = event.clientY;
              startX = event.clientX;
              return;
            }
            panel.scrollLeft -= sign * size;
            left = panel.scrollLeft;
            startX = event.clientX;
            startY = event.clientY;
            return;
          }
        }
        panel.scrollLeft = left - deltaX;
        panel.scrollTop = top - deltaY;
      },
      { passive: false },
    );
    const unlock = () => {
      if (!stepping) return;
      stepping = false;
      if (pointerId !== null) {
        panel.releasePointerCapture?.(pointerId);
      }
      pointerId = null;
    };
    const resetTouchAction = () => {
      if (!touchStep) return;
      if (touchAction) {
        panel.style.touchAction = touchAction;
      } else {
        panel.style.removeProperty("touch-action");
      }
    };
    toolbar.listen(panel, panel, "pointerup", unlock, { passive: true });
    toolbar.listen(panel, panel, "pointercancel", unlock, { passive: true });
    toolbar.listen(panel, panel, "lostpointercapture", unlock, { passive: true });
    toolbar.listen(panel, window, "beforeunload", resetTouchAction);
  },
  drag({ panel, canStart, onMove, onEnd, snapPreview = null }) {
    if (panel.dataset.drag === "true") return;
    panel.dataset.drag = "true";
    let active = false;
    let pending = false;
    let startX = 0;
    let startY = 0;
    let left = 0;
    let top = 0;
    let touchDrag = false;
    let touchReady = false;
    let holdTimer = 0;
    let touchAction = "";
    let userSelect = "";
    let webkitUserSelect = "";
    let guardTouchMove = null;
    let guardTouchEnd = null;
    let guardTouchCancel = null;
    const applyMove = (clientX, clientY) => {
      panel.dataset.moved = "true";
      const nextLeft = left + clientX - startX;
      const nextTop = top + clientY - startY;
      const next = toolbar.clamp(panel, { left: nextLeft, top: nextTop });
      toolbar.floating(panel, next);
    };
    const bindTouchGuard = () => {
      guardTouchMove = (event) => {
        if (!active || !touchDrag) return;
        const touch = event.touches?.[0];
        if (!touch) return;
        event.preventDefault();
        applyMove(touch.clientX, touch.clientY);
      };
      guardTouchEnd = () => {
        if (!active || !touchDrag) return;
        finish();
      };
      guardTouchCancel = () => {
        if (!active || !touchDrag) return;
        finish(true);
      };
      document.addEventListener("touchmove", guardTouchMove, {
        passive: false,
        capture: true,
      });
      document.addEventListener("touchend", guardTouchEnd, {
        passive: false,
        capture: true,
      });
      document.addEventListener("touchcancel", guardTouchCancel, {
        passive: false,
        capture: true,
      });
    };
    const unbindTouchGuard = () => {
      if (guardTouchMove) {
        document.removeEventListener("touchmove", guardTouchMove, true);
      }
      if (guardTouchEnd) {
        document.removeEventListener("touchend", guardTouchEnd, true);
      }
      if (guardTouchCancel) {
        document.removeEventListener("touchcancel", guardTouchCancel, true);
      }
      guardTouchMove = null;
      guardTouchEnd = null;
      guardTouchCancel = null;
    };
    const lockPage = () => {
      touchAction = document.body.style.touchAction;
      userSelect = document.body.style.userSelect;
      webkitUserSelect = document.body.style.webkitUserSelect;
      document.body.style.touchAction = "none";
      document.body.style.userSelect = "none";
      document.body.style.webkitUserSelect = "none";
      panel.style.setProperty("touch-action", "none", "important");
    };
    const unlockPage = () => {
      document.body.style.touchAction = touchAction;
      document.body.style.userSelect = userSelect;
      document.body.style.webkitUserSelect = webkitUserSelect;
      panel.style.removeProperty("touch-action");
      unbindTouchGuard();
    };
    const down = (event) => {
      if (canStart && !canStart(event)) return;
      pending = true;
      active = false;
      touchDrag = event.pointerType === "touch";
      touchReady = !touchDrag;
      panel.dataset.moved = "false";
      const rect = panel.getBoundingClientRect();
      startX = event.clientX;
      startY = event.clientY;
      left = rect.left;
      top = rect.top;
      panel.setPointerCapture?.(event.pointerId);
      if (touchDrag) {
        holdTimer = setTimeout(() => {
          touchReady = true;
          holdTimer = 0;
        }, 140);
      }
    };
    const move = (event) => {
      if (!pending) return;
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      if (touchDrag && !touchReady) {
        if (Math.hypot(deltaX, deltaY) > 8) {
          clearTimeout(holdTimer);
          holdTimer = 0;
          pending = false;
          touchDrag = false;
          touchReady = false;
          panel.releasePointerCapture?.(event.pointerId);
        }
        return;
      }
      const threshold = touchDrag ? 10 : 4;
      if (!active && Math.hypot(deltaX, deltaY) < threshold) return;
      if (!active) {
        toolbar.bringToFront(panel);
        active = true;
        panel.dataset.manual = "true";
        panel.style.setProperty("transition", "none", "important");
        panel.style.setProperty("cursor", "grabbing", "important");
        lockPage();
        if (touchDrag) bindTouchGuard();
      }
      event.preventDefault();
      applyMove(event.clientX, event.clientY);
      if (snapPreview) toolbar.snapHint.update(panel, snapPreview);
      if (onMove) onMove({ panel, event });
    };
    const finish = (cancelled = false, event = null) => {
      if (!pending) return;
      pending = false;
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = 0;
      }
      toolbar.snapHint.clear();
      if (!active) {
        touchDrag = false;
        touchReady = false;
        if (event?.pointerId !== undefined) {
          panel.releasePointerCapture?.(event.pointerId);
        }
        return;
      }
      active = false;
      touchDrag = false;
      touchReady = false;
      panel.style.removeProperty("transition");
      panel.style.removeProperty("cursor");
      unlockPage();
      if (event?.pointerId !== undefined) {
        panel.releasePointerCapture?.(event.pointerId);
      }
      toolbar.recover(panel, { edge: 8, mode: "center" });
      if (cancelled) return;
      if (!onEnd) return;
      onEnd({ panel, event });
    };
    const up = (event) => {
      finish(false, event);
    };
    const cancel = (event) => {
      finish(true, event);
    };
    toolbar.listen(
      panel,
      window,
      "touchmove",
      (event) => {
        if (!pending || !touchDrag || !touchReady) return;
        if (event.cancelable) event.preventDefault();
      },
      { passive: false, capture: true },
    );
    toolbar.listen(panel, panel, "pointerdown", down);
    toolbar.listen(panel, window, "pointermove", move);
    toolbar.listen(panel, window, "pointerup", up);
    toolbar.listen(panel, window, "pointercancel", cancel);
  },
  resizeRows({
    panel,
    list,
    edge,
    loading = () => false,
    rows = () => 1,
    chrome = () => 0,
    measure,
    set,
  }) {
    if (!panel || !list || !edge || edge.dataset.resize === "true") return;
    edge.dataset.resize = "true";
    let value = null;
    toolbar.listen(panel, edge, "pointerdown", (event) => {
      if (loading()) return;
      if (event.button !== 0) return;
      event.preventDefault();
      const panelRect = panel.getBoundingClientRect();
      const listRect = list.getBoundingClientRect();
      const metrics = measure();
      const baseRows = Math.max(
        1,
        Math.floor((listRect.height - metrics.border) / metrics.step),
      );
      value = {
        y: event.clientY,
        panelTop: panelRect.top,
        baseRows,
        step: metrics.step,
        border: metrics.border,
        chrome: chrome(),
      };
      toolbar.floating(panel, { left: panelRect.left, top: panelRect.top });
      panel.style.setProperty("height", `${panelRect.height}px`);
      edge.setPointerCapture?.(event.pointerId);
    });
    toolbar.listen(panel, edge, "pointermove", (event) => {
      if (!value) return;
      const step = value.step || 24;
      const deltaRows = Math.round((event.clientY - value.y) / step);
      const maxHeight = window.innerHeight - value.panelTop;
      const maxList = Math.max(120, maxHeight - (value.chrome || 0));
      const maxRows = Math.max(1, Math.floor(maxList / step));
      const totalRows = Math.max(1, rows());
      const nextRows = Math.max(
        1,
        Math.min(maxRows, totalRows, value.baseRows + deltaRows),
      );
      const listHeight = nextRows * step + (value.border || 1);
      set({
        rows: nextRows,
        listHeight: Math.round(listHeight),
        panelHeight: Math.round((value.chrome || 0) + listHeight),
      });
    });
    const clear = (event) => {
      if (!value) return;
      value = null;
      edge.releasePointerCapture?.(event?.pointerId);
    };
    toolbar.listen(panel, edge, "pointerup", clear);
    toolbar.listen(panel, edge, "pointercancel", clear);
  },
  snap({ panel, snap = 96, top = 96, bottom = 60, onSnapTop, onSnapBottom }) {
    const screen = toolbar.screen();
    const inset = toolbar.insets();
    const leftInset = Math.max(0, inset.left || 0);
    const rightInset = Math.max(0, inset.right || 0);
    const topInset = Math.max(0, inset.top || 0);
    const bottomInset = Math.max(0, inset.bottom || 0);
    const screenTop = screen.offsetTop;
    const screenBottom = screen.offsetTop + screen.height;
    const center =
      screen.offsetLeft + leftInset + (screen.width - leftInset - rightInset) / 2;
    const topOffset = Math.max(0, top + inset.top);
    const bottomOffset = Math.max(0, bottom + inset.bottom);
    const rect = panel.getBoundingClientRect();
    const width = rect.width || panel.offsetWidth || 0;
    const overlapX = (leftA, rightA, leftB, rightB) =>
      Math.min(rightA, rightB) - Math.max(leftA, leftB) > 24;
    const peers = [...document.querySelectorAll('.panel[data-ui-surface="toolbar"]')]
      .filter((item) => item !== panel && item.isConnected)
      .map((item) => item.getBoundingClientRect());
    if (rect.top - screenTop < snap + topInset) {
      let targetTop = screenTop + topOffset;
      const left = center - width / 2;
      const right = left + width;
      peers
        .filter((item) => overlapX(left, right, item.left, item.right))
        .sort((a, b) => a.top - b.top)
        .forEach((item) => {
          const close = Math.abs(item.top - targetTop) < item.height + 16;
          if (close && targetTop <= item.bottom) targetTop = item.bottom + 8;
        });
      panel.style.setProperty("left", `${center}px`, "important");
      panel.style.setProperty("transform", "translateX(-50%)", "important");
      panel.style.setProperty("top", `${targetTop}px`, "important");
      panel.style.setProperty("right", "auto", "important");
      panel.style.setProperty("bottom", "auto", "important");
      if (onSnapTop) onSnapTop({ left: center, top: targetTop });
      return true;
    }
    if (screenBottom - rect.bottom < snap + bottomInset) {
      let value = screenBottom - rect.height - bottomOffset;
      const left = center - width / 2;
      const right = left + width;
      peers
        .filter((item) => overlapX(left, right, item.left, item.right))
        .sort((a, b) => b.bottom - a.bottom)
        .forEach((item) => {
          const close = Math.abs(item.bottom - (value + rect.height)) < item.height + 16;
          if (close && value + rect.height >= item.top) {
            value = item.top - rect.height - 8;
          }
        });
      value = Math.max(screenTop + topOffset, value);
      panel.style.setProperty("left", `${center}px`, "important");
      panel.style.setProperty("transform", "translateX(-50%)", "important");
      panel.style.setProperty("top", `${value}px`, "important");
      panel.style.setProperty("right", "auto", "important");
      panel.style.setProperty("bottom", "auto", "important");
      if (onSnapBottom) onSnapBottom({ left: center, top: value });
      return true;
    }
    return false;
  },
  outside(panel, edge = 12) {
    const rect = panel.getBoundingClientRect();
    return (
      rect.left < edge ||
      rect.top < edge ||
      rect.right > window.innerWidth - edge ||
      rect.bottom > window.innerHeight - edge
    );
  },
  escaped(panel, threshold = 8) {
    const rect = panel.getBoundingClientRect();
    const screen = toolbar.screen();
    return (
      rect.left < screen.offsetLeft - threshold ||
      rect.top < screen.offsetTop - threshold ||
      rect.right > screen.offsetLeft + screen.width + threshold ||
      rect.bottom > screen.offsetTop + screen.height + threshold
    );
  },
  appearance: {
    icon(content = "") {
      return toolbar.icon(content);
    },
    layout({ fullscreen }) {
      return toolbar.layout({ fullscreen });
    },
    theme(id = "content") {
      return toolbar.theme(id);
    },
    themeToggleIcon(theme) {
      return toolbar.themeToggleIcon(theme);
    },
    sync(panel, value) {
      return toolbar.sync(panel, value);
    },
    floating(panel, value) {
      return toolbar.floating(panel, value);
    },
    clamp(panel, value) {
      return toolbar.clamp(panel, value);
    },
    place(panel, value) {
      return toolbar.place(panel, value);
    },
    snapshot(panel) {
      return toolbar.snapshot(panel);
    },
    rerender(panel, render, restore) {
      return toolbar.rerender(panel, render, restore);
    },
  },
  behavior: {
    observe(value) {
      return toolbar.observe(value);
    },
    drag(value) {
      return toolbar.drag(value);
    },
    resize(value) {
      return toolbar.resizeRows(value);
    },
    snap(value) {
      return toolbar.snap(value);
    },
    outside(panel, edge = 12) {
      return toolbar.outside(panel, edge);
    },
    scroll(value) {
      return toolbar.scroll(value);
    },
    wheel({
      panel,
      event,
      step = () => 0,
      axis = () => "x",
    }) {
      if (!panel || !event) return false;
      const value = Number(step());
      if (!Number.isFinite(value) || value <= 0) return false;
      const targetAxis = axis(event);
      if (targetAxis !== "x" && targetAxis !== "y") return false;
      const source =
        Math.abs(event.deltaY) >= Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX;
      if (!Number.isFinite(source) || source === 0) return false;
      const sign = source > 0 ? 1 : -1;
      if (targetAxis === "y") {
        panel.scrollTop += sign * value;
        return true;
      }
      panel.scrollLeft += sign * value;
      return true;
    },
    step({
      panel,
      axis = "x",
      step = () => 0,
      delay = 110,
      enabled = () => true,
    }) {
      if (!panel) return;
      let timer = 0;
      let snapping = false;
      let touching = false;
      const run = () => {
        if (snapping || touching || !enabled()) return;
        const value = step();
        if (!Number.isFinite(value) || value <= 0) return;
        const vertical = axis === "y";
        const current = vertical ? panel.scrollTop : panel.scrollLeft;
        const target = Math.round(current / value) * value;
        if (Math.abs(current - target) <= 0.5) return;
        snapping = true;
        if (vertical) panel.scrollTop = target;
        if (!vertical) panel.scrollLeft = target;
        setTimeout(() => {
          snapping = false;
        }, 0);
      };
      const schedule = () => {
        if (touching || !enabled()) return;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          timer = 0;
          run();
        }, delay);
      };
      const clear = () => {
        if (!timer) return;
        clearTimeout(timer);
        timer = 0;
      };
      toolbar.listen(panel, panel, "scroll", schedule, { passive: true });
      toolbar.listen(panel, panel, "touchend", schedule, { passive: true });
      toolbar.listen(panel, panel, "pointerup", schedule, { passive: true });
      toolbar.listen(panel, panel, "wheel", schedule, { passive: true });
      toolbar.listen(
        panel,
        panel,
        "pointerdown",
        (event) => {
          if (event.pointerType !== "touch") return;
          touching = true;
          clear();
        },
        { passive: true },
      );
      toolbar.listen(
        panel,
        panel,
        "pointerup",
        (event) => {
          if (event.pointerType !== "touch") return;
          touching = false;
          schedule();
        },
        { passive: true },
      );
      toolbar.listen(
        panel,
        panel,
        "pointercancel",
        (event) => {
          if (event.pointerType !== "touch") return;
          touching = false;
          clear();
        },
        { passive: true },
      );
      toolbar.listen(panel, panel, "pointercancel", clear, { passive: true });
      toolbar.listen(panel, panel, "touchcancel", clear, { passive: true });
    },
    strip({
      panel,
      strip = ".toolbar-strip",
      axis = "x",
      canRun = () => true,
      step = () => 0,
    }) {
      if (!panel) return;
      toolbar.listen(
        panel,
        panel,
        "wheel",
        (event) => {
          if (!canRun(event)) return;
          const node =
            typeof strip === "string" ? panel.querySelector(strip) : strip;
          if (!node) return;
          const overflow =
            axis === "y"
              ? node.scrollHeight - node.clientHeight
              : panel.scrollWidth - panel.clientWidth;
          if (overflow <= 1) return;
          const value = Number(step(event));
          if (!Number.isFinite(value) || value <= 0) return;
          event.preventDefault();
          toolbar.behavior.wheel({
            panel,
            event,
            step: () => value,
            axis: () => axis,
          });
        },
        { passive: false },
      );
    },
    flow({
      panel,
      strip = ".toolbar-strip",
      canRun = () => true,
      axis = () => "x",
      step = () => 0,
      delay = 110,
      touch = true,
    }) {
      if (!panel) return;
      const resolveAxis = (event = null) => {
        const value = axis(event);
        return value === "y" ? "y" : "x";
      };
      const resolveStep = (event = null) => {
        const value = Number(step(event));
        return Number.isFinite(value) && value > 0 ? value : 0;
      };
      toolbar.behavior.scroll({
        panel,
        canRun: (event) => canRun(event) && resolveStep(event) > 0,
        wheel: (event) =>
          toolbar.behavior.wheel({
            panel,
            event,
            step: () => resolveStep(event),
            axis: () => resolveAxis(event),
          }),
        touch,
        touchStep: (event) => ({
          axis: resolveAxis(event),
          step: resolveStep(event),
        }),
      });
      toolbar.behavior.strip({
        panel,
        strip,
        axis: resolveAxis(),
        canRun: (event) => canRun(event),
        step: (event) => resolveStep(event),
      });
      toolbar.behavior.step({
        panel,
        axis: "x",
        step: () => resolveStep(),
        delay,
        enabled: () => canRun() && resolveAxis() === "x" && resolveStep() > 0,
      });
      toolbar.behavior.step({
        panel,
        axis: "y",
        step: () => resolveStep(),
        delay,
        enabled: () => canRun() && resolveAxis() === "y" && resolveStep() > 0,
      });
    },
    dock({
      panel,
      snap = 88,
      content = null,
      enabled = () => true,
    }) {
      if (!panel || !enabled()) return { target: "floating", side: "" };
      if (panel.dataset.toolbarFlow !== "single-row") {
        return { target: "floating", side: "" };
      }
      const rect = panel.getBoundingClientRect();
      const screen = toolbar.screen();
      const near = (distance) => (distance <= snap ? distance : Infinity);
      const leftEdge = screen.offsetLeft;
      const topEdge = screen.offsetTop;
      const rightEdge = screen.offsetLeft + screen.width;
      const bottomEdge = screen.offsetTop + screen.height;
      const list = [
        { target: "screen", side: "top", distance: near(rect.top - topEdge) },
        {
          target: "screen",
          side: "bottom",
          distance: near(bottomEdge - rect.bottom),
        },
        { target: "screen", side: "left", distance: near(rect.left - leftEdge) },
        {
          target: "screen",
          side: "right",
          distance: near(rightEdge - rect.right),
        },
      ];
      const area = typeof content === "function" ? content() : content;
      if (area) {
        list.push({
          target: "content",
          side: "top",
          distance: near(Math.abs(rect.top - area.top)),
        });
        list.push({
          target: "content",
          side: "bottom",
          distance: near(Math.abs(rect.bottom - area.bottom)),
        });
        list.push({
          target: "content",
          side: "left",
          distance: near(Math.abs(rect.left - area.left)),
        });
        list.push({
          target: "content",
          side: "right",
          distance: near(Math.abs(rect.right - area.right)),
        });
      }
      const best = list.sort((a, b) => a.distance - b.distance)[0];
      if (!best || best.distance === Infinity) {
        return { target: "floating", side: "" };
      }
      return { target: best.target, side: best.side };
    },
    orient({
      panel,
      dock = { target: "floating", side: "" },
      normalize = null,
    }) {
      if (!panel) return;
      const current = panel.dataset.dock || "floating";
      const next = dock?.side || "floating";
      panel.dataset.dock = next;
      panel.dataset.dockTarget = dock?.target || "floating";
      if (typeof normalize === "function") normalize(panel, next, current);
    },
    preview({
      panel,
      dock,
      delay = 120,
      hits = 2,
      apply = null,
    }) {
      if (!panel || !dock) return;
      const state =
        toolbar.preview.get(panel) ||
        {
          timer: 0,
          dock: null,
          last: "",
          candidate: "",
          count: 0,
        };
      const key = `${dock.target || "floating"}:${dock.side || "floating"}`;
      if (key === state.last) {
        toolbar.preview.set(panel, state);
        return;
      }
      if (key !== state.candidate) {
        state.candidate = key;
        state.count = 1;
        toolbar.preview.set(panel, state);
        return;
      }
      state.count += 1;
      if (state.count < hits) {
        toolbar.preview.set(panel, state);
        return;
      }
      state.dock = dock;
      if (state.timer) clearTimeout(state.timer);
      state.timer = setTimeout(() => {
        state.timer = 0;
        const next = state.dock;
        state.dock = null;
        if (!next) return;
        if (typeof apply === "function") apply(next);
        state.last = `${next.target || "floating"}:${next.side || "floating"}`;
      }, delay);
      toolbar.preview.set(panel, state);
    },
    previewClear(panel) {
      if (!panel) return;
      const state = toolbar.preview.get(panel);
      if (!state) return;
      if (state.timer) clearTimeout(state.timer);
      state.timer = 0;
      state.dock = null;
      state.candidate = "";
      state.count = 0;
      state.last = "";
      toolbar.preview.set(panel, state);
    },
    limit({
      panel,
      strip = ".toolbar-strip",
      count = () => 0,
      axis = () => "x",
      step = () => 0,
      canRun = () => true,
    }) {
      if (!panel) return;
      const apply = () => {
        if (!canRun()) return;
        const node =
          typeof strip === "string" ? panel.querySelector(strip) : strip;
        if (!node) return;
        const value = Number(count());
        const unit = Number(step());
        if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(unit) || unit <= 0) {
          node.style.removeProperty("max-width");
          node.style.removeProperty("max-height");
          return;
        }
        const axisValue = axis() === "y" ? "y" : "x";
        const track = Math.max(0, Math.round(unit * value));
        if (axisValue === "y") {
          node.style.removeProperty("max-width");
          node.style.setProperty("max-height", `${track}px`, "important");
          return;
        }
        node.style.removeProperty("max-height");
        node.style.setProperty("max-width", `${track}px`, "important");
      };
      toolbar.listen(panel, window, "resize", apply);
      toolbar.listen(panel, panel, "scroll", apply);
      apply();
    },
    sticky({
      panel,
      node,
      axis = "x",
      gap = 0,
      canRun = () => true,
      active = () => true,
    }) {
      if (!panel || !node) return;
      const apply = () => {
        if (!active()) return;
        const parent = panel.getBoundingClientRect();
        const rect = node.getBoundingClientRect();
        if (axis === "x") {
          const nextLeft = parent.left + gap;
          const delta = Math.round(nextLeft - rect.left);
          if (delta) {
            node.style.transform = `translateX(${delta}px)`;
            return;
          }
          node.style.removeProperty("transform");
          return;
        }
        const nextTop = parent.top + gap;
        const delta = Math.round(nextTop - rect.top);
        if (delta) {
          node.style.transform = `translateY(${delta}px)`;
          return;
        }
        node.style.removeProperty("transform");
      };
      toolbar.listen(panel, panel, "scroll", () => {
        if (!canRun()) return;
        apply();
      });
      toolbar.listen(panel, window, "resize", apply);
      apply();
    },
    destroy(panel) {
      return toolbar.destroy(panel);
    },
    stack(panel) {
      if (!panel || panel.dataset.stack === "true") return;
      panel.dataset.stack = "true";
      toolbar.bringToFront(panel);
      toolbar.listen(panel, panel, "pointerdown", () => toolbar.bringToFront(panel));
      toolbar.listen(panel, panel, "focusin", () => toolbar.bringToFront(panel));
    },
    recover(panel, value) {
      return toolbar.recover(panel, value);
    },
  },
  presets: {
    fullscreen(content = "content") {
      return {
        content,
        fullscreen: () => true,
        surface: () => "toolbar",
      };
    },
    floating(content = "content") {
      return {
        content,
        fullscreen: () => false,
        surface: () => "toolbar",
      };
    },
    dock(content = "content") {
      return {
        content,
        fullscreen: () => true,
        surface: () => "toolbar",
      };
    },
    listPanel(content = "content") {
      return {
        content,
        fullscreen: () => false,
        surface: () => "toolbar",
      };
    },
    singleRowDocked(content = "content") {
      return {
        content,
        fullscreen: () => true,
        surface: () => "toolbar",
        flow: "single-row",
      };
    },
    multiRowFixed(content = "content") {
      return {
        content,
        fullscreen: () => false,
        surface: () => "toolbar",
        flow: "multi-row",
      };
    },
  },
  creature(config) {
    const value = {
      panel: config.panel,
      content: config.content || "content",
      theme: config.theme || (() => toolbar.appearance.theme(config.content || "content")),
      state: {
        position: config.position || "toolbar-position",
        dock: config.dock || "toolbar-dock",
        size: config.size || "toolbar-size",
        manual: config.manual || "toolbar-manual",
      },
      fullscreen: config.fullscreen || (() => false),
      place: config.place,
      rescue: config.rescue || null,
      wheel: config.wheel || null,
      drag: config.drag || null,
      scroll: config.scroll || null,
      resize: config.resize || null,
      snap: config.snap || null,
      sticky: config.sticky || null,
      observe: config.observe || {},
      flow: config.flow || "",
      surface:
        config.surface ||
        ((layout) => (layout === "fullscreen" ? "toolbar" : "")),
    };
    const controller = {
      appearance: {
        layout() {
          return toolbar.appearance.layout({ fullscreen: value.fullscreen() });
        },
        theme() {
          return value.theme();
        },
        sync() {
          if (value.flow) value.panel.dataset.toolbarFlow = value.flow;
          const layout = controller.appearance.layout();
          const theme = controller.appearance.theme();
          const surface = value.surface(layout);
          toolbar.appearance.sync(value.panel, { layout, theme, surface });
          return { layout, theme, surface };
        },
      },
      behavior: {
        observe() {
          if (!value.place) return;
          toolbar.behavior.observe({
            panel: value.panel,
            layout: () => controller.appearance.layout(),
            place: () => value.place(),
            rescue: value.rescue ? () => value.rescue() : null,
            theme: () => controller.appearance.theme(),
            scroll: value.observe.scroll !== false,
            wheel: value.wheel ? (event) => value.wheel(event) : null,
          });
        },
        drag() {
          if (!value.drag) return;
          toolbar.behavior.drag({
            panel: value.panel,
            snapPreview: value.snap || null,
            canStart: (event) =>
              value.drag.canStart ? value.drag.canStart(event) : true,
            onMove: (data) => {
              if (!value.drag.onMove) return;
              value.drag.onMove(data);
            },
            onEnd: (data) => {
              const moved = data?.panel?.dataset?.moved === "true";
              const snapped = moved ? controller.behavior.snap() : false;
              data.moved = moved;
              data.snapped = snapped;
              if (!value.drag.onEnd) return;
              value.drag.onEnd(data);
            },
          });
        },
        scroll() {
          if (!value.scroll) return;
          toolbar.behavior.scroll({
            panel: value.panel,
            canRun: value.scroll.canRun || (() => true),
            wheel: value.scroll.wheel || null,
            touch: value.scroll.touch !== false,
          });
        },
        resize() {
          if (!value.resize) return;
          toolbar.behavior.resize({
            panel: value.panel,
            list: value.resize.list,
            edge: value.resize.edge,
            loading: value.resize.loading || (() => false),
            rows: value.resize.rows || (() => 1),
            chrome: value.resize.chrome || (() => 0),
            measure: value.resize.measure,
            set: value.resize.set,
          });
        },
        snap() {
          if (!value.snap) return false;
          return toolbar.behavior.snap({ panel: value.panel, ...value.snap });
        },
        sticky() {
          if (!value.sticky) return;
          toolbar.behavior.sticky({
            panel: value.panel,
            node: value.sticky.node,
            axis: value.sticky.axis || "x",
            gap: value.sticky.gap || 0,
            canRun: value.sticky.canRun || (() => true),
            active: value.sticky.active || (() => true),
          });
        },
        bind(options = {}) {
          const sync = options.sync !== false;
          if (sync) controller.appearance.sync();
          toolbar.behavior.stack(value.panel);
          controller.behavior.observe();
          controller.behavior.drag();
          controller.behavior.scroll();
          controller.behavior.resize();
          controller.behavior.sticky();
        },
        destroy() {
          toolbar.behavior.destroy(value.panel);
        },
      },
      state: {
        position(next) {
          return toolbar.state(value.state.position, next);
        },
        dock(next) {
          return toolbar.state(value.state.dock, next);
        },
        size(next) {
          return toolbar.state(value.state.size, next);
        },
        manual(next) {
          return toolbar.state(value.state.manual, next);
        },
      },
    };
    return {
      layout() {
        return controller.appearance.layout();
      },
      theme() {
        return controller.appearance.theme();
      },
      state(next) {
        return controller.state.position(next);
      },
      sync() {
        return controller.appearance.sync();
      },
      observe() {
        controller.behavior.observe();
      },
      drag() {
        controller.behavior.drag();
      },
      behavior: controller.behavior,
      appearance: controller.appearance,
      storage: controller.state,
    };
  },
};
