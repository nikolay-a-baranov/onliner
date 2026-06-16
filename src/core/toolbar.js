import { panel } from "./panel.js";
import { css } from "./css.js";
import { icon } from "./icon.js";
import { ui } from "./ui.js";
import { ux } from "./ux.js";
import { design } from "./design.js";

export const toolbar = {
  render: {
    content(item, options = {}) {
      const source = item || {};
      const value = { ...(options || {}) };
      const useGlyph = value.iconMode === "glyph";
      const emojiScope = source.emojiScope || "editor";
      if (source.logo) {
        return value.logo?.(source.logo) || "";
      }
      if (useGlyph && source.icon) {
        return `<img class="toolbar-icon" src="${value.glyph?.[source.icon] || ""}" alt="">`;
      }
      return (
        value.emoji?.(source.emoji || source.label || "", emojiScope) ||
        String(source.emoji || source.label || "")
      );
    },
    button(item, options = {}) {
      const source = item || {};
      const activeAttr = source.active ? ' data-active="true"' : "";
      const itemAttrs = source.attrs || "";
      return ui.controls.button({
        content: toolbar.render.content(source, options),
        action: source.action,
        title: source.title || "",
        classes: source.classes || "",
        attrs: ` type="button"${activeAttr}${itemAttrs}`,
      });
    },
    actions(list = [], options = {}) {
      return list.map((item) => toolbar.render.button(item, options)).join("");
    },
    current(list = []) {
      return list.map((item, index) => ({
        ...item,
        attrs: `${item.attrs || ""}${index === 0 ? ' data-mode-first="true"' : ""}`,
      }));
    },
    shell({
      options = {},
      primary = [],
      modes = [],
      current = [],
      system = [],
      collapsed = true,
      solo = false,
      launcher = {},
      modeAttrs = ' data-toolbar-modes="true"',
    } = {}) {
      const primaryHtml = solo ? "" : toolbar.render.actions(primary, options);
      const modeHtml = modes.length
        ? ui.shell.group(toolbar.render.actions(modes, options), {
            attrs: modeAttrs,
            rail: false,
          })
        : "";
      const currentHtml =
        collapsed && !solo
          ? ""
          : toolbar.render.actions(toolbar.render.current(current), options);
      const main = ui.shell.strip(`${primaryHtml}${modeHtml}${currentHtml}`);
      const left =
        launcher === false
          ? ""
          : ui.controls.marker({
              content: options.emoji?.(
                launcher.emoji || "\u270D\uFE0F",
                launcher.scope || "launcher",
              ),
              button: {
                action: launcher.action || "place",
                attrs: ' type="button"',
              },
              group: {
                stick: "left",
                rail: true,
              },
            });
      const right = system.length
        ? ui.shell.group(toolbar.render.actions(system, options), {
            stick: "right",
            rail: true,
          })
        : "";
      return ui.shell.shell({ left, main, right });
    },
  },
  rail: {
    scale: design.surface.toolbar.rail.scale,
    pad: {
      y: design.surface.toolbar.rail.padY,
      x: design.surface.toolbar.rail.padX,
    },
    pill: design.surface.toolbar.rail.pill,
    inset: design.surface.toolbar.rail.inset,
    bar: {
      padY: design.surface.toolbar.rail.barPadY,
      padX: design.surface.toolbar.rail.barPadX,
    },
    side: {
      size: design.surface.toolbar.rail.sideSize,
      padY: design.surface.toolbar.rail.sidePadY,
      padX: design.surface.toolbar.rail.sidePadX,
    },
    gap: design.surface.toolbar.rail.gap,
    dock: {
      snap: design.surface.toolbar.rail.dockSnap,
      margin: design.surface.toolbar.rail.dockMargin,
      edge: design.surface.toolbar.rail.dockEdge,
    },
    snap: {
      snap: design.surface.toolbar.rail.snap,
      top: design.surface.toolbar.rail.snapTop,
      bottom: design.surface.toolbar.rail.snapBottom,
    },
  },
  hint: {
    node: null,
    ensure() {
      if (toolbar.hint.node?.isConnected) return toolbar.hint.node;
      const node = document.createElement("div");
      node.dataset.toolbarHint = "true";
      node.style.position = "fixed";
      node.style.left = "0";
      node.style.top = "0";
      node.style.width = "0";
      node.style.height = "0";
      node.style.pointerEvents = "none";
      node.style.zIndex = "999998";
      node.style.borderRadius = design.surface.toolbar.hint.radius;
      node.style.opacity = design.surface.toolbar.hint.startOpacity;
      node.style.transform = `translateZ(0) scale(${design.surface.toolbar.hint.startScale})`;
      node.style.transition = design.surface.toolbar.hint.transition;
      node.style.background = design.surface.toolbar.hint.darkBackground;
      node.style.border = design.surface.toolbar.hint.darkBorder;
      node.style.boxShadow = design.surface.toolbar.hint.darkShadow;
      node.style.backdropFilter = design.surface.toolbar.hint.backdrop;
      node.style.webkitBackdropFilter = design.surface.toolbar.hint.backdrop;
      document.body.appendChild(node);
      toolbar.hint.node = node;
      return node;
    },
    clear() {
      const node = toolbar.hint.node;
      if (!node) return;
      node.style.opacity = "0";
      node.style.transform = `translateZ(0) scale(${design.surface.toolbar.hint.startScale})`;
    },
    paint(panel, node) {
      const dark = panel?.dataset?.theme !== "light";
      node.style.background = dark
        ? design.surface.toolbar.hint.darkBackground
        : design.surface.toolbar.hint.lightBackground;
      node.style.border = dark
        ? design.surface.toolbar.hint.darkBorder
        : design.surface.toolbar.hint.lightBorder;
      node.style.boxShadow = dark
        ? design.surface.toolbar.hint.darkShadow
        : design.surface.toolbar.hint.lightShadow;
    },
    show(panel, value) {
      if (!panel || !value) return toolbar.hint.clear();
      const node = toolbar.hint.ensure();
      toolbar.hint.paint(panel, node);
      node.style.left = `${Math.round(value.left)}px`;
      node.style.top = `${Math.round(value.top)}px`;
      node.style.width = `${Math.round(value.width)}px`;
      node.style.height = `${Math.round(value.height)}px`;
      node.style.borderRadius = getComputedStyle(panel).borderRadius || "999px";
      node.style.opacity = "1";
      node.style.transform = "translateZ(0) scale(1)";
      return node;
    },
    update(panel, options = {}) {
      if (!panel) return toolbar.hint.clear();
      if (options.dock) {
        const rect = panel.getBoundingClientRect();
        const value = options.value || {
          left: rect.left,
          top: rect.top,
        };
        const next = toolbar.behavior.geometry({
          panel,
          dock: options.dock,
          value,
          margin: options.margin,
          content: options.content,
          edge: options.edge,
        });
        if (!next) return toolbar.hint.clear();
        if (next.target === "floating" && !options.floating) {
          return toolbar.hint.clear();
        }
        return toolbar.hint.show(panel, next);
      }
      const snap = options.snap ?? toolbar.rail.snap.snap;
      const top = options.top ?? toolbar.rail.snap.top;
      const bottom = options.bottom ?? toolbar.rail.snap.bottom;
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
      if (!nearTop && !nearBottom) return toolbar.hint.clear();
      const width = Math.max(
        48,
        Math.round(rect.width || panel.offsetWidth || 48),
      );
      const height = Math.max(
        28,
        Math.round(rect.height || panel.offsetHeight || 42),
      );
      const center =
        screen.offsetLeft +
        leftInset +
        (screen.width - leftInset - rightInset) / 2;
      const left = center - width / 2;
      const y = nearTop
        ? screenTop + topOffset
        : screenBottom - bottomOffset - height;
      return toolbar.hint.show(panel, {
        left,
        top: y,
        width,
        height,
      });
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
    delete panel.dataset.actions;
    delete panel.dataset.toolbarLine;
  },
  button({
    content = "",
    action = "",
    title = "",
    classes = "",
    attrs = "",
  } = {}) {
    return ui.controls.button({
      content,
      action,
      title,
      classes,
      attrs,
    });
  },
  test: {
    id: "toolbar-test-panel",
    key: "toolbar-test-theme",
    modeKey: "toolbar-test-mode",
    theme(next) {
      if (next !== undefined) return toolbar.state(toolbar.test.key, next);
      return toolbar.state(toolbar.test.key) || "dark";
    },
    mode(next) {
      if (next !== undefined) return toolbar.state(toolbar.test.modeKey, next);
      return toolbar.state(toolbar.test.modeKey) || "bowling";
    },
    html() {
      const button = (emoji, attrs = "") =>
        toolbar.button({ content: icon.emoji(emoji), attrs });
      const mode = toolbar.test.mode();
      const left = ui.shell.group(
        `${button("\u{1F3B3}", ` data-action="mode-bowling" data-mode="${mode}" type="button"`)}${button("\u{1F3B1}", ` data-action="mode-pool" data-mode="${mode}" type="button"`)}`,
        { stick: "left", rail: true },
      );
      const main = ui.shell.strip(
        ["\u{1F479}", "\u{1F47A}", "\u{1F4A9}", "\u{1F916}", "\u{1F47B}"]
          .map((item) =>
            toolbar.button({
              content: icon.emoji(item),
              attrs: ` data-action="item" type="button"`,
            }),
          )
          .join(""),
      );
      const right = ui.shell.group(
        `${button(toolbar.themeToggleIcon(toolbar.test.theme()), ` data-action="theme" type="button"`)}${button("\u{274C}", ` data-action="close" type="button"`)}`,
        { stick: "right", rail: true },
      );
      return ui.shell.shell({ left, main, right });
    },
    mount() {
      const id = toolbar.test.id;
      const current = document.getElementById(id);
      if (current) {
        toolbar.destroy(current);
        current.remove();
      }
      const panelNode = panel.create({
        id,
        className: "panel",
        place: "right",
        html: toolbar.test.html(),
      });
      const controller = toolbar.creature({
        panel: panelNode,
        ...toolbar.presets.railDocked("content", {
          panel: panelNode,
          line: {
            count: () => 3,
          },
        }),
        theme: () => toolbar.test.theme(),
        actions: {
          action({ name }) {
            if (name === "close") {
              controller.behavior.destroy();
              panelNode.remove();
              return;
            }
            if (name !== "theme") return;
            toolbar.test.theme(
              toolbar.test.theme() === "dark" ? "light" : "dark",
            );
            render();
          },
        },
      });
      controller.behavior.bind();
      const render = () =>
        toolbar.rerender(
          panelNode,
          () => {
            panelNode.innerHTML = toolbar.test.html();
          },
          {
            sync: () => controller.appearance.sync(),
          },
        );
      return panelNode;
    },
  },
  segment(
    panel,
    {
      root = panel,
      hold = [],
      delay = 420,
      disabled = () => false,
      action = () => {},
    } = {},
  ) {
    if (!panel || !root) return;
    const state = {
      timer: null,
      name: "",
      consumed: false,
      button: null,
      skip: "",
    };
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
        event.preventDefault();
        event.stopPropagation();
        const name = button.dataset.action || "";
        if (!hold.includes(name)) return;
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
      if (panel.dataset.touchScroll === "true") {
        event.preventDefault();
        event.stopPropagation();
        state.name = "";
        state.button = null;
        return;
      }
      if (!target || !name) {
        state.name = "";
        state.button = null;
        return;
      }
      if (hold.includes(name)) {
        if (!wasPending || !holdButton || !holdName) return;
        if (disabled(name, target)) {
          state.name = "";
          state.button = null;
          return;
        }
        state.skip = name;
        action({ name, kind: "click", button: target, event });
        state.name = "";
        state.button = null;
        return;
      }
      if (disabled(name, target)) {
        return;
      }
      state.skip = name;
      action({ name, kind: "click", button: target, event });
      state.name = "";
      state.button = null;
    });
    toolbar.listen(panel, root, "touchcancel", clear);
    toolbar.listen(panel, root, "click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (panel.dataset.touchScroll === "true") return;
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
  measureWidth(panel, { selector = ".ui-shell" } = {}) {
    if (!panel) return 0;
    const clone = panel.cloneNode(true);
    clone.removeAttribute("id");
    clone.style.setProperty("position", "fixed", "important");
    clone.style.setProperty("left", "-10000px", "important");
    clone.style.setProperty("top", "0", "important");
    clone.style.setProperty("right", "auto", "important");
    clone.style.setProperty("bottom", "auto", "important");
    clone.style.setProperty("visibility", "hidden", "important");
    clone.style.setProperty("pointer-events", "none", "important");
    clone.style.setProperty("width", "max-content", "important");
    clone.style.setProperty("max-width", "none", "important");
    clone.style.setProperty("min-width", "0", "important");
    clone.style.setProperty("height", "auto", "important");
    clone.style.setProperty("max-height", "none", "important");
    clone.style.setProperty("transform", "none", "important");
    const shell = selector ? clone.querySelector(selector) : clone;
    const line = clone.querySelector("[data-line]");
    const strip = clone.querySelector(".ui-strip");
    [shell, line, strip].forEach((node) => {
      if (!node) return;
      node.style.setProperty("width", "max-content", "important");
      node.style.setProperty("max-width", "none", "important");
      node.style.setProperty("min-width", "0", "important");
      node.style.setProperty("flex", "0 0 auto", "important");
    });
    document.body.appendChild(clone);
    try {
      const cloneRect = Math.ceil(clone.getBoundingClientRect().width || 0);
      const shellRect = shell
        ? Math.ceil(shell.getBoundingClientRect().width || 0)
        : 0;
      const shellScroll = shell ? Math.ceil(shell.scrollWidth || 0) : 0;
      const lineRect = line
        ? Math.ceil(line.getBoundingClientRect().width || 0)
        : 0;
      const lineScroll = line ? Math.ceil(line.scrollWidth || 0) : 0;
      const stripRect = strip
        ? Math.ceil(strip.getBoundingClientRect().width || 0)
        : 0;
      const stripScroll = strip ? Math.ceil(strip.scrollWidth || 0) : 0;
      return Math.max(
        cloneRect,
        shellRect,
        shellScroll,
        lineRect,
        lineScroll,
        stripRect,
        stripScroll,
        0,
      );
    } finally {
      clone.remove();
    }
  },
  reflow(panel, place = null) {
    if (!panel || panel.dataset.reflow === "true") return;
    panel.dataset.reflow = "true";
    const run = () => {
      if (!panel.isConnected) {
        delete panel.dataset.reflow;
        return;
      }
      if (typeof place === "function") place();
      toolbar.behavior.refresh(panel);
      requestAnimationFrame(() => {
        if (typeof place === "function" && panel.isConnected) place();
        if (panel.isConnected) toolbar.behavior.refresh(panel);
        delete panel.dataset.reflow;
      });
    };
    requestAnimationFrame(run);
  },
  floating(panel, value, { keepWidth = false } = {}) {
    panel.style.setProperty("left", `${value.left}px`, "important");
    panel.style.setProperty("top", `${value.top}px`, "important");
    panel.style.setProperty("right", "auto", "important");
    panel.style.setProperty("bottom", "auto", "important");
    if (!keepWidth) {
      panel.style.setProperty("width", "auto", "important");
    }
    panel.style.setProperty("transform", "none", "important");
  },
  place(
    panel,
    {
      layout = "fullscreen",
      touch = false,
      fit = null,
      keyboardOpen = false,
      touchBottom = design.surface.toolbar.metric.touchBottom,
      desktopBottom = design.surface.toolbar.metric.desktopBottom,
      keyboardTop = design.surface.toolbar.metric.keyboardTop,
    } = {},
  ) {
    const screen = toolbar.screen();
    const box = fit || {};
    if (
      touch &&
      panel.dataset.manual === "true" &&
      panel.dataset.snap === "top"
    ) {
      return;
    }
    panel.style.setProperty("right", "auto", "important");
    panel.style.setProperty("top", "auto", "important");
    if (layout === "bottom") {
      if (box.rect) {
        const bottomGap = Math.max(
          12,
          window.innerHeight - box.rect.bottom + 12,
        );
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
        panel.style.setProperty("top", "auto", "important");
        panel.style.setProperty(
          "bottom",
          `calc(${toolbar.keyboard() + 12}px + env(safe-area-inset-bottom))`,
          "important",
        );
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
    const line = panel.querySelector("[data-line]");
    return {
      left: rect.left,
      top: rect.top,
      line: {
        left: line ? line.scrollLeft : 0,
        top: line ? line.scrollTop : 0,
      },
      dock: {
        target: panel.dataset.dockTarget || "floating",
        side: panel.dataset.dock || "floating",
      },
    };
  },
  rerender(panel, render, options = {}) {
    if (!panel || typeof render !== "function") return null;
    const shot = toolbar.snapshot(panel);
    const restoreLine = () => {
      const line = panel.querySelector("[data-line]");
      if (!line || !shot?.line) return;
      line.scrollLeft = shot.line.left;
      line.scrollTop = shot.line.top;
    };
    const value = render(shot);
    if (typeof options.sync === "function") options.sync(shot);
    if (typeof options.restore === "function") options.restore(shot);
    restoreLine();
    toolbar.behavior.refresh(panel);
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(restoreLine);
    }
    return value ?? shot;
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
    const top = list.reduce(
      (max, item) => Math.max(max, toolbar.zIndex(item)),
      999998,
    );
    panel.style.setProperty("z-index", `${top + 1}`, "important");
  },
  recover(panel, { edge = 8, mode = "center" } = {}) {
    if (!panel) return false;
    if (!toolbar.escaped(panel, edge)) return false;
    toolbar.fit(panel, edge);
    if (mode === "clamp") {
      const rect = panel.getBoundingClientRect();
      const next = toolbar.clamp(panel, {
        left: rect.left,
        top: rect.top,
        edge,
      });
      toolbar.floating(panel, next, { keepWidth: true });
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
    const safeLeft =
      minLeft > maxLeft ? screen.offsetLeft + (screen.width - width) / 2 : left;
    const safeTop =
      minTop > maxTop ? screen.offsetTop + (screen.height - height) / 2 : top;
    return {
      left:
        minLeft > maxLeft
          ? safeLeft
          : Math.min(maxLeft, Math.max(minLeft, safeLeft)),
      top:
        minTop > maxTop ? safeTop : Math.min(maxTop, Math.max(minTop, safeTop)),
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
    const readerActive = document.body?.classList?.contains("reader-active");
    if (!readerActive) return { top: 0, right: 0, bottom: 0, left: 0 };
    const style = getComputedStyle(document.documentElement);
    const keyboard =
      parseFloat(style.getPropertyValue("--reader-keyboard-gap")) || 0;
    const scrollbar =
      parseFloat(style.getPropertyValue("--reader-scrollbar-gap")) || 0;
    const top =
      parseFloat(style.getPropertyValue("--reader-toolbar-top-gap")) || 76;
    const bottom =
      parseFloat(style.getPropertyValue("--reader-toolbar-bottom-gap")) || 64;
    return {
      top: Math.max(0, top),
      right: Math.max(0, scrollbar),
      bottom: Math.max(0, bottom) + Math.max(0, keyboard),
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
    return icon.glyph(theme);
  },
  sync(panel, { layout, theme, surface, capsule, frame } = {}) {
    panel.dataset.layout = layout;
    panel.dataset.theme = theme;
    panel.dataset.keyboardOpen = toolbar.keyboardOpen() ? "true" : "false";
    const scale = Number(toolbar.rail.scale || 1);
    const scaleBy = (value) => Math.round(value * scale);
    const root = getComputedStyle(document.documentElement);
    const baseButton = Number.parseFloat(
      root.getPropertyValue("--surface-toolbar-button-size"),
    );
    const buttonSize = Number.isFinite(baseButton)
      ? scaleBy(baseButton)
      : scaleBy(36);
    const iconSize = Math.round(buttonSize * 0.84);
    const padY = scaleBy(toolbar.rail.pad?.y ?? toolbar.rail.bar.padY);
    const padX = scaleBy(toolbar.rail.pad?.x ?? toolbar.rail.bar.padX);
    const gap = scaleBy(toolbar.rail.gap);
    const sideSize = scaleBy(toolbar.rail.side.size);
    const pillPad = scaleBy(toolbar.rail.pill ?? 5);
    const inset = scaleBy(toolbar.rail.inset ?? 4);
    panel.style.setProperty("--rail-side-size", `${sideSize}px`, "important");
    panel.style.setProperty("--rail-side-pad-y", `${padY}px`, "important");
    panel.style.setProperty("--rail-side-pad-x", `${padX}px`, "important");
    panel.style.setProperty("--rail-pill-pad", `${pillPad}px`, "important");
    panel.style.setProperty("--rail-group-inset", `${inset}px`, "important");
    panel.style.setProperty("--rail-gap", `${gap}px`, "important");
    panel.style.setProperty("--rail-bar-pad-y", `${padY}px`, "important");
    panel.style.setProperty("--rail-bar-pad-x", `${padX}px`, "important");
    panel.style.setProperty("--toolbar-scale", `${scale}`, "important");
    panel.style.setProperty(
      "--surface-emoji-icon-size",
      `${iconSize}px`,
      "important",
    );
    if (surface) panel.dataset.uiSurface = surface;
    if (!surface) delete panel.dataset.uiSurface;
    if (frame) panel.dataset.uiFrame = frame;
    if (frame === "") delete panel.dataset.uiFrame;
    if (surface === "toolbar") {
      panel.dataset.toolbarCapsule = capsule === false ? "false" : "true";
    } else {
      delete panel.dataset.toolbarCapsule;
    }
  },
  observe({
    panel,
    layout,
    place,
    rescue,
    theme,
    content = null,
    fullscreen = "fullscreen",
    scroll = true,
    wheel = null,
  }) {
    if (panel.dataset.observe === "true") return;
    panel.dataset.observe = "true";
    const sync = () => {
      panel.dataset.theme = theme();
    };
    const update = () => {
      place();
      if (rescue) rescue();
      toolbar.behavior.refresh(panel);
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
    toolbar.listen(panel, window, "resize", update);
    toolbar.listen(panel, window.visualViewport, "resize", update);
    toolbar.listen(panel, window.visualViewport, "scroll", update);
    if (typeof ResizeObserver === "function") {
      const target =
        typeof content === "function"
          ? content()
          : typeof content === "string"
            ? document.getElementById(content)
            : content;
      if (target) {
        const observer = new ResizeObserver(update);
        observer.observe(target);
        toolbar.ensureBinding(panel).clear.push(() => observer.disconnect());
      }
    }
    if (scroll) toolbar.listen(panel, window, "scroll", place, true);
  },
  scroll({
    panel,
    target = panel,
    canRun = () => true,
    wheel,
    touch = true,
    touchStep = null,
  }) {
    if (!panel || panel.dataset.scroll === "true") return;
    panel.dataset.scroll = "true";
    const node = () => (typeof target === "function" ? target() : target);
    let startX = 0;
    let startY = 0;
    let left = 0;
    let top = 0;
    let touchAction = "";
    let stepping = false;
    let pointerId = null;
    let touchAxis = "x";
    let moved = false;
    let clearTimer = 0;
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
    const canTouch = (event) => {
      if (!canRun(event)) return false;
      return event.pointerType === "touch";
    };
    toolbar.listen(panel, panel, "pointerdown", (event) => {
      if (!canTouch(event)) return;
      stepping = true;
      moved = false;
      if (clearTimer) {
        clearTimeout(clearTimer);
        clearTimer = 0;
      }
      delete panel.dataset.touchScroll;
      if (touchStep) {
        const config = touchStep(event) || {};
        touchAxis = config.axis === "y" ? "y" : "x";
      } else {
        touchAxis = "x";
      }
      moved = false;
      delete panel.dataset.touchScroll;
      pointerId = event.pointerId;
      panel.setPointerCapture?.(event.pointerId);
      startX = event.clientX;
      startY = event.clientY;
      const current = node();
      if (!current) return;
      left = current.scrollLeft;
      top = current.scrollTop;
    });
    toolbar.listen(
      panel,
      panel,
      "pointermove",
      (event) => {
        if (pointerId !== event.pointerId) return;
        if (!canTouch(event)) return;
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;
        if (pointerId !== event.pointerId) return;
        if (Math.abs(deltaX) < 3 && Math.abs(deltaY) < 3) return;
        moved = true;
        panel.dataset.touchScroll = "true";
        panel.dataset.touchScrollStamp = String(Date.now());
        if (touchStep) {
          event.preventDefault();
          if (touchAxis === "y") {
            const current = node();
            if (!current) return;
            current.scrollTop = top - deltaY;
            return;
          }
          const current = node();
          if (!current) return;
          current.scrollLeft = left - deltaX;
          return;
        }
        const current = node();
        if (!current) return;
        current.scrollLeft = left - deltaX;
        current.scrollTop = top - deltaY;
      },
      { passive: false },
    );
    const unlock = () => {
      const currentPointerId = pointerId;
      stepping = false;
      pointerId = null;
      if (
        currentPointerId !== null &&
        panel.hasPointerCapture?.(currentPointerId)
      ) {
        panel.releasePointerCapture?.(currentPointerId);
      }
      if (!moved) return;
      moved = false;
      if (clearTimer) clearTimeout(clearTimer);
      clearTimer = setTimeout(() => {
        clearTimer = 0;
        panel.dataset.touchScrollStamp = String(Date.now());
        delete panel.dataset.touchScroll;
      }, 120);
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
    toolbar.listen(panel, panel, "lostpointercapture", unlock, {
      passive: true,
    });
    toolbar.listen(panel, window, "scroll", unlock, { passive: true });
    toolbar.listen(panel, window, "blur", unlock, { passive: true });
    toolbar.listen(panel, window, "beforeunload", resetTouchAction);
  },
  drag({ panel, canStart, onMove, onEnd, hint = null, keepWidth = false }) {
    if (panel.dataset.drag === "true") return;
    panel.dataset.drag = "true";
    panel.dataset.draggable = "true";
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
      toolbar.floating(panel, next, { keepWidth });
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
      const input = toolbar.behavior.input.drag(event);
      touchDrag = toolbar.behavior.input.mode(event) === "touch";
      touchReady = input.hold <= 0;
      panel.dataset.moved = "false";
      const rect = panel.getBoundingClientRect();
      startX = event.clientX;
      startY = event.clientY;
      left = rect.left;
      top = rect.top;
      panel.setPointerCapture?.(event.pointerId);
      if (input.hold > 0) {
        holdTimer = setTimeout(() => {
          touchReady = true;
          holdTimer = 0;
        }, input.hold);
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
      const input = toolbar.behavior.input.drag(event);
      if (!active && Math.hypot(deltaX, deltaY) < input.threshold) return;
      if (!active) {
        toolbar.bringToFront(panel);
        active = true;
        panel.dataset.manual = "true";
        panel.dataset.dragging = "true";
        panel.style.setProperty("transition", "none", "important");
        panel.style.setProperty("cursor", "grabbing", "important");
        lockPage();
        if (touchDrag) bindTouchGuard();
      }
      event.preventDefault();
      applyMove(event.clientX, event.clientY);
      if (hint) toolbar.hint.update(panel, hint);
      if (onMove) onMove({ panel, event });
    };
    const finish = (cancelled = false, event = null) => {
      if (!pending) return;
      pending = false;
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = 0;
      }
      toolbar.hint.clear();
      if (!active) {
        touchDrag = false;
        touchReady = false;
        delete panel.dataset.dragging;
        if (event?.pointerId !== undefined) {
          panel.releasePointerCapture?.(event.pointerId);
        }
        return;
      }
      active = false;
      touchDrag = false;
      touchReady = false;
      delete panel.dataset.dragging;
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
  snap({ panel, snap, top, bottom, onSnapTop, onSnapBottom }) {
    const snapGap = snap ?? toolbar.rail.snap.snap;
    const topGap = top ?? toolbar.rail.snap.top;
    const bottomGap = bottom ?? toolbar.rail.snap.bottom;
    const screen = toolbar.screen();
    const inset = toolbar.insets();
    const leftInset = Math.max(0, inset.left || 0);
    const rightInset = Math.max(0, inset.right || 0);
    const topInset = Math.max(0, inset.top || 0);
    const bottomInset = Math.max(0, inset.bottom || 0);
    const screenTop = screen.offsetTop;
    const screenBottom = screen.offsetTop + screen.height;
    const center =
      screen.offsetLeft +
      leftInset +
      (screen.width - leftInset - rightInset) / 2;
    const topOffset = Math.max(0, topGap + inset.top);
    const bottomOffset = Math.max(0, bottomGap + inset.bottom);
    const rect = panel.getBoundingClientRect();
    const width = rect.width || panel.offsetWidth || 0;
    const overlapX = (leftA, rightA, leftB, rightB) =>
      Math.min(rightA, rightB) - Math.max(leftA, leftB) > 24;
    const peers = [
      ...document.querySelectorAll('.panel[data-ui-surface="toolbar"]'),
    ]
      .filter((item) => item !== panel && item.isConnected)
      .map((item) => item.getBoundingClientRect());
    if (rect.top - screenTop < snapGap + topInset) {
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
      panel.dataset.snap = "top";
      panel.dataset.manual = "true";
      if (onSnapTop) onSnapTop({ left: center, top: targetTop });
      return true;
    }
    if (screenBottom - rect.bottom < snapGap + bottomInset) {
      let value = screenBottom - rect.height - bottomOffset;
      const left = center - width / 2;
      const right = left + width;
      peers
        .filter((item) => overlapX(left, right, item.left, item.right))
        .sort((a, b) => b.bottom - a.bottom)
        .forEach((item) => {
          const close =
            Math.abs(item.bottom - (value + rect.height)) < item.height + 16;
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
      panel.dataset.snap = "bottom";
      panel.dataset.manual = "true";
      if (onSnapBottom) onSnapBottom({ left: center, top: value });
      return true;
    }
    delete panel.dataset.snap;
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
  active: {
    sync(panel, state = {}) {
      if (!panel) return;
      const active = new Set(
        Object.entries(state)
          .filter(([, value]) => value)
          .map(([name]) => name),
      );
      panel.dataset.active = [...active].join(" ");
      [...panel.querySelectorAll("[data-action]")].forEach((button) => {
        const name = button.getAttribute("data-action") || "";
        if (active.has(name)) {
          button.dataset.active = "true";
          return;
        }
        delete button.dataset.active;
      });
    },
    clear(panel) {
      toolbar.active.sync(panel, {});
    },
  },
  appearance: {
    icon(content = "") {
      return ui.controls.icon(content);
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
    origin(
      panel,
      {
        content = "content",
        min = 280,
        edge = toolbar.rail.dock.edge,
        cap = 0,
      } = {},
    ) {
      if (!panel) return null;
      const screen = toolbar.screen();
      const field = document.getElementById(content);
      const rect = field?.getBoundingClientRect() || null;
      const natural = Math.max(min, toolbar.measureWidth(panel));
      const limit = cap > 0 ? Math.min(natural, cap) : natural;
      const viewportMax = Math.max(min, screen.width - edge * 2);
      const hasField = rect && rect.width - edge * 2 >= min;
      const fieldMax = hasField
        ? Math.max(min, rect.width - edge * 2)
        : viewportMax;
      const maxWidth = Math.min(viewportMax, fieldMax);
      const width = Math.min(limit, maxWidth);
      const panelRect = panel.getBoundingClientRect();
      const height = Math.ceil(panelRect.height || panel.offsetHeight || 0);
      const baseLeft = hasField ? rect.left + edge : screen.offsetLeft + edge;
      const baseTop = hasField ? rect.top + edge : screen.offsetTop + edge;
      const next = toolbar.clamp(panel, {
        left: baseLeft,
        top: baseTop,
        edge,
      });
      panel.style.setProperty("width", `${width}px`, "important");
      panel.style.setProperty("max-width", `${maxWidth}px`, "important");
      toolbar.floating(
        panel,
        {
          left: next.left,
          top: Math.min(
            next.top,
            screen.offsetTop + screen.height - height - edge,
          ),
        },
        { keepWidth: true },
      );
      return {
        left: next.left,
        top: next.top,
        width,
        maxWidth,
        rect,
      };
    },
    fitContent(
      panel,
      { content = "content", min = 280, edge = toolbar.rail.dock.edge } = {},
    ) {
      if (!panel) return null;
      const screen = toolbar.screen();
      const rect = document.getElementById(content)?.getBoundingClientRect();
      const natural = Math.max(min, toolbar.measureWidth(panel));
      const viewportMax = Math.max(min, screen.width - edge * 2);
      const hasField = rect && rect.width >= min;
      const fieldMax = hasField ? Math.max(min, rect.width) : viewportMax;
      const maxWidth = Math.min(viewportMax, fieldMax);
      const width = Math.min(natural, maxWidth);
      const center = hasField
        ? rect.left + rect.width / 2
        : screen.offsetLeft + screen.width / 2;
      const minLeft = screen.offsetLeft + edge;
      const maxLeft = screen.offsetLeft + screen.width - width - edge;
      const left = Math.min(maxLeft, Math.max(minLeft, center - width / 2));
      return {
        left,
        width,
        maxWidth,
        rect: hasField ? rect : null,
      };
    },
    snapshot(panel) {
      return toolbar.snapshot(panel);
    },
    rerender(panel, render, options) {
      return toolbar.rerender(panel, render, options);
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
    refresh(panel) {
      if (!panel) return;
      const line = panel.querySelector("[data-line]");
      panel.dispatchEvent(new Event("scroll"));
      if (line) line.dispatchEvent(new Event("scroll"));
      requestAnimationFrame(() => {
        panel.dispatchEvent(new Event("scroll"));
        if (line) line.dispatchEvent(new Event("scroll"));
      });
    },
    scrollClamp(panel, { line = "[data-line]" } = {}) {
      if (!panel) return;
      const node =
        typeof line === "string" ? panel.querySelector(line) : line || panel;
      if (!node) return;
      const maxX = Math.max(0, node.scrollWidth - node.clientWidth);
      const maxY = Math.max(0, node.scrollHeight - node.clientHeight);
      if (node.scrollLeft > maxX) node.scrollLeft = maxX;
      if (node.scrollTop > maxY) node.scrollTop = maxY;
      if (node.scrollLeft < 0) node.scrollLeft = 0;
      if (node.scrollTop < 0) node.scrollTop = 0;
    },
    scrollStep(panel, { strip = ".ui-strip" } = {}) {
      if (!panel) return 0;
      const node =
        typeof strip === "string" ? panel.querySelector(strip) : strip || panel;
      const first = node ? node.querySelector(".ui-button") : null;
      if (!first) return 0;
      const rect = first.getBoundingClientRect();
      const parent = node || first.parentElement;
      const style = parent ? getComputedStyle(parent) : null;
      const gap = style ? parseFloat(style.columnGap || style.gap || "0") : 0;
      const base =
        rect.width ||
        parseFloat(
          getComputedStyle(panel).getPropertyValue("--surface-button-size") ||
            "0",
        ) ||
        0;
      if (!base) return 0;
      const extra = parseFloat(
        getComputedStyle(panel).getPropertyValue(
          "--surface-scroll-step-extra",
        ) || "0",
      );
      const value =
        base +
        (Number.isFinite(gap) ? gap : 0) +
        (Number.isFinite(extra) ? extra : 0);
      return value > 0 ? value : 0;
    },
    axis(panel) {
      const side = panel?.dataset?.dock || "floating";
      return side === "left" || side === "right" ? "y" : "x";
    },
    launcher(panel, { place = null, line = "[data-line]" } = {}) {
      if (!panel) return false;
      if (panel.dataset.toolbarFlow === "rail") {
        toolbar.behavior.orient({
          panel,
          dock: { target: "floating", side: "floating" },
          normalize(node, side, previous) {
            toolbar.behavior.dockNormalize({
              panel: node,
              side,
              previous,
              line,
            });
          },
        });
      }
      delete panel.dataset.snap;
      panel.dataset.manual = "false";
      const node = typeof line === "string" ? panel.querySelector(line) : line;
      if (node) {
        node.scrollLeft = 0;
        node.scrollTop = 0;
        node.style.removeProperty("width");
        node.style.removeProperty("height");
        node.style.removeProperty("max-width");
        node.style.removeProperty("max-height");
      }
      if (typeof place === "function") place();
      toolbar.behavior.refresh(panel);
      return true;
    },
    themeToggle(
      panel,
      {
        get = () => "light",
        set = () => "light",
        action = "theme",
        scope = "editor",
      } = {},
    ) {
      if (!panel) return "light";
      const current = get();
      const next = current === "dark" ? "light" : "dark";
      set(next);
      panel.dataset.theme = next;
      ui.surface.theme.set(next);
      ui.surface.theme.syncButton(panel, { action, scope });
      return next;
    },
    input: {
      mode(event) {
        if (event?.pointerType === "touch") return "touch";
        if (event?.pointerType === "pen") return "pen";
        return "mouse";
      },
      drag(event) {
        const mode = toolbar.behavior.input.mode(event);
        if (mode === "touch") {
          return {
            threshold: 6,
            hold: 80,
          };
        }
        return {
          threshold: 4,
          hold: 0,
        };
      },
    },
    wheel({
      panel,
      event,
      step = () => 0,
      axis = () => "x",
      smooth = false,
      speed = 1,
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
      const raw = smooth ? source * speed : (source > 0 ? 1 : -1) * value;
      const delta = Math.max(-value, Math.min(value, raw));
      if (targetAxis === "y") {
        const current = panel.scrollTop;
        const max = Math.max(0, panel.scrollHeight - panel.clientHeight);
        const next = Math.max(0, Math.min(max, current + delta));
        if (Math.abs(next - current) < 0.5) return false;
        panel.scrollTop = next;
        return true;
      }
      const current = panel.scrollLeft;
      const max = Math.max(0, panel.scrollWidth - panel.clientWidth);
      const next = Math.max(0, Math.min(max, current + delta));
      if (Math.abs(next - current) < 0.5) return false;
      panel.scrollLeft = next;
      return true;
    },
    step({
      panel,
      target = panel,
      axis = "x",
      step = () => 0,
      delay = 170,
      enabled = () => true,
    }) {
      if (!panel) return;
      const node = () => (typeof target === "function" ? target() : target);
      let timer = 0;
      let snapping = false;
      let touching = false;
      const run = () => {
        if (snapping || touching || !enabled()) return;
        const value = step();
        if (!Number.isFinite(value) || value <= 0) return;
        const vertical = axis === "y";
        const currentNode = node();
        if (!currentNode) return;
        const current = vertical
          ? currentNode.scrollTop
          : currentNode.scrollLeft;
        const max = vertical
          ? Math.max(0, currentNode.scrollHeight - currentNode.clientHeight)
          : Math.max(0, currentNode.scrollWidth - currentNode.clientWidth);
        const atStart = current <= 0.5;
        const atEnd = max - current <= 0.5;
        let next = Math.max(
          0,
          Math.min(max, Math.round(current / value) * value),
        );
        if (atStart) next = 0;
        if (atEnd) next = max;
        if (Math.abs(current - next) <= 0.5) return;
        snapping = true;
        if (vertical) {
          currentNode.scrollTo({ top: next, behavior: "smooth" });
        } else {
          currentNode.scrollTo({ left: next, behavior: "smooth" });
        }
        setTimeout(() => {
          snapping = false;
        }, 160);
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
      toolbar.listen(panel, node(), "scroll", schedule, { passive: true });
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
      strip = ".ui-strip",
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
      strip = panel,
      canRun = () => true,
      axis = () => "x",
      step = () => 0,
      delay = 110,
      touch = true,
    }) {
      if (!panel) return;
      const target = () =>
        typeof strip === "string" ? panel.querySelector(strip) : strip || panel;
      const resolveAxis = (event = null) => {
        const value = axis(event);
        return value === "y" ? "y" : "x";
      };
      const resolveStep = (event = null) => {
        const value = Number(step(event));
        if (Number.isFinite(value) && value > 0) return value;
        const node = target();
        const items = [
          ...(node?.querySelectorAll?.(".ui-button") || []),
        ].filter((item) => item.offsetParent !== null);
        if (!items.length) return 0;
        const axisValue = resolveAxis(event);
        if (items.length > 1) {
          const first = items[0];
          const second = items[1];
          const distance =
            axisValue === "y"
              ? second.offsetTop - first.offsetTop
              : second.offsetLeft - first.offsetLeft;
          if (distance > 0) return Math.round(distance);
        }
        const rect = items[0].getBoundingClientRect();
        return Math.round(axisValue === "y" ? rect.height : rect.width);
      };
      toolbar.behavior.scroll({
        panel,
        target,
        canRun: (event) => canRun(event) && resolveStep(event) > 0,
        wheel: (event) =>
          toolbar.behavior.wheel({
            panel: target(),
            event,
            step: () => resolveStep(event),
            axis: () => resolveAxis(event),
            smooth: false,
          }),
        touch,
        touchStep: (event) => ({
          axis: resolveAxis(event),
          step: resolveStep(event),
        }),
      });
      toolbar.behavior.step({
        panel,
        target,
        axis: "x",
        step: () => resolveStep(),
        delay,
        enabled: () => canRun() && resolveAxis() === "x" && resolveStep() > 0,
      });
      toolbar.behavior.step({
        panel,
        target,
        axis: "y",
        step: () => resolveStep(),
        delay,
        enabled: () => canRun() && resolveAxis() === "y" && resolveStep() > 0,
      });
    },
    dock({ panel, snap, content = null, enabled = () => true }) {
      const snapGap = snap ?? toolbar.rail.dock.snap;
      if (!panel || !enabled()) return { target: "floating", side: "" };
      if (panel.dataset.toolbarFlow !== "rail") {
        return { target: "floating", side: "" };
      }
      const rect = panel.getBoundingClientRect();
      const screen = toolbar.screen();
      const near = (distance) => (distance <= snapGap ? distance : Infinity);
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
        {
          target: "screen",
          side: "left",
          distance: near(rect.left - leftEdge),
        },
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
    railApply({
      panel,
      dock = { target: "floating", side: "" },
      value = null,
      line = "[data-line]",
      normalize = null,
      keepWidth = false,
    }) {
      if (!panel) return value;
      const applyNormalize =
        normalize ||
        ((node, side, previous) => {
          toolbar.behavior.dockNormalize({
            panel: node,
            side,
            previous,
            line,
          });
        });
      toolbar.behavior.orient({
        panel,
        dock,
        normalize: applyNormalize,
      });
      panel.style.removeProperty("overflow");
      panel.style.removeProperty("overflow-x");
      panel.style.removeProperty("overflow-y");
      if (value) {
        panel.style.removeProperty("transform");
        panel.style.removeProperty("right");
        panel.style.removeProperty("bottom");
        toolbar.appearance.floating(panel, value, { keepWidth });
      }
      toolbar.behavior.scrollClamp(panel, { line });
      toolbar.behavior.refresh(panel);
      return value;
    },
    railRestore({
      panel,
      position = null,
      line = "[data-line]",
      edge = toolbar.rail.dock.edge,
    }) {
      if (!panel || !position || typeof position !== "object") return false;
      const dock =
        position.dock && typeof position.dock === "object"
          ? position.dock
          : { target: "floating", side: "floating" };
      const hasPosition =
        typeof position.left === "number" && typeof position.top === "number";
      const hasDock =
        dock.side &&
        dock.side !== "floating" &&
        dock.target &&
        dock.target !== "floating";
      panel.dataset.dock = dock.side || "floating";
      panel.dataset.dockTarget = dock.target || "floating";
      if (!hasPosition && !hasDock) return false;
      panel.dataset.manual = "true";
      const current = hasPosition
        ? { left: position.left, top: position.top }
        : {
            left: panel.getBoundingClientRect().left,
            top: panel.getBoundingClientRect().top,
          };
      const next = toolbar.appearance.clamp(panel, {
        left: current.left,
        top: current.top,
        edge,
      });
      toolbar.behavior.dockApply({
        panel,
        dock,
        value: next,
        edge,
        line,
        keepWidth: true,
      });
      return true;
    },
    railPersist({ panel, key = "", dock = null }) {
      if (!panel || !key) return false;
      const rect = panel.getBoundingClientRect();
      toolbar.state(key, {
        left: rect.left,
        top: rect.top,
        dock: dock || {
          side: panel.dataset.dock || "floating",
          target: panel.dataset.dockTarget || "floating",
        },
      });
      return true;
    },
    dockNormalize({
      panel,
      side = "floating",
      previous = "floating",
      line = "[data-line]",
    }) {
      if (!panel) return;
      const node = typeof line === "string" ? panel.querySelector(line) : line;
      if (!node) return;
      const vertical = side === "left" || side === "right";
      const wasVertical = previous === "left" || previous === "right";
      if (vertical === wasVertical) return;
      node.scrollTop = 0;
      node.scrollLeft = 0;
    },
    geometry({
      panel,
      dock = { target: "floating", side: "" },
      value = null,
      margin,
      content = null,
      edge,
    }) {
      if (!panel) return null;
      const current = dock || { target: "floating", side: "" };
      const marginGap = margin ?? toolbar.rail.dock.margin;
      const edgeGap = edge ?? toolbar.rail.dock.edge;
      const screen = toolbar.screen();
      const area = typeof content === "function" ? content() : content;
      if (current.target === "content" && !area) return null;
      const anchor =
        current.target === "content" && area
          ? area
          : {
              left: screen.offsetLeft,
              top: screen.offsetTop,
              right: screen.offsetLeft + screen.width,
              bottom: screen.offsetTop + screen.height,
            };
      const previous = {
        side: panel.dataset.dock || "floating",
        target: panel.dataset.dockTarget || "floating",
      };
      panel.dataset.dock = current.side || "floating";
      panel.dataset.dockTarget = current.target || "floating";
      toolbar.behavior.refresh(panel);
      const rect = panel.getBoundingClientRect();
      panel.dataset.dock = previous.side;
      panel.dataset.dockTarget = previous.target;
      toolbar.behavior.refresh(panel);
      const width = rect.width || panel.offsetWidth || 0;
      const height = rect.height || panel.offsetHeight || 0;
      const clamp = (number, min, max) => Math.max(min, Math.min(max, number));
      const leftMin = anchor.left + edgeGap;
      const leftMax = anchor.right - width - edgeGap;
      const topMin = anchor.top + edgeGap;
      const topMax = anchor.bottom - height - edgeGap;
      const safeLeft = (number) =>
        leftMin > leftMax
          ? anchor.left + (anchor.right - anchor.left - width) / 2
          : clamp(number, leftMin, leftMax);
      const safeTop = (number) =>
        topMin > topMax
          ? anchor.top + (anchor.bottom - anchor.top - height) / 2
          : clamp(number, topMin, topMax);
      const left =
        value && typeof value.left === "number" ? value.left : rect.left;
      const top = value && typeof value.top === "number" ? value.top : rect.top;
      if (current.target === "floating") {
        return {
          left,
          top,
          width,
          height,
          target: "floating",
          side: "floating",
        };
      }
      if (current.side === "top") {
        return {
          left: safeLeft(left),
          top: safeTop(anchor.top + marginGap),
          width,
          height,
          target: current.target,
          side: current.side,
        };
      }
      if (current.side === "bottom") {
        return {
          left: safeLeft(left),
          top: safeTop(anchor.bottom - height - marginGap),
          width,
          height,
          target: current.target,
          side: current.side,
        };
      }
      if (current.side === "left") {
        return {
          left: safeLeft(anchor.left + marginGap),
          top: safeTop(top),
          width,
          height,
          target: current.target,
          side: current.side,
        };
      }
      if (current.side === "right") {
        return {
          left: safeLeft(anchor.right - width - marginGap),
          top: safeTop(top),
          width,
          height,
          target: current.target,
          side: current.side,
        };
      }
      return {
        left,
        top,
        width,
        height,
        target: "floating",
        side: "floating",
      };
    },
    dockApply({
      panel,
      dock = { target: "floating", side: "" },
      value = null,
      margin,
      content = null,
      normalize = null,
      edge,
      line = "[data-line]",
      keepWidth = false,
    }) {
      if (!panel) return;
      const current = dock || { target: "floating", side: "" };
      const next = toolbar.behavior.geometry({
        panel,
        dock: current,
        value,
        margin,
        content,
        edge,
      });
      if (!next) return;
      toolbar.behavior.railApply({
        panel,
        dock: current,
        value: next,
        line,
        normalize,
        keepWidth,
      });
    },
    preview({ panel, dock, delay = 120, hits = 2, apply = null }) {
      if (!panel || !dock) return;
      const state = toolbar.preview.get(panel) || {
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
      strip = ".ui-strip",
      count = () => null,
      axis = () => "x",
      step = () => 0,
      canRun = () => true,
      edgeTrim = 0,
      measure = true,
    }) {
      if (!panel) return;
      const nodeSize = (node, axisValue) => {
        const rect = node.getBoundingClientRect();
        return axisValue === "y" ? rect.height : rect.width;
      };
      const reset = (node) => {
        node.style.removeProperty("width");
        node.style.removeProperty("height");
        node.style.removeProperty("max-width");
        node.style.removeProperty("max-height");
      };
      const visibleItems = (node) => [
        ...((node.querySelector(".ui-strip") || node).querySelectorAll(
          ".ui-button",
        ) || []),
      ].filter((item) => item.offsetParent !== null);
      const trackByItems = (node, value, axisValue) => {
        const host = node.querySelector(".ui-strip") || node;
        const items = visibleItems(node);
        if (!items.length) return 0;
        const limit = Math.max(1, Math.min(items.length, Math.floor(value)));
        const first = items[0];
        const last = items[limit - 1];
        const style = getComputedStyle(node);
        if (axisValue === "y") {
          const top = first.offsetTop;
          const bottom = last.offsetTop + last.offsetHeight;
          const pad =
            (parseFloat(style.paddingTop || "0") || 0) +
            (parseFloat(style.paddingBottom || "0") || 0);
          return Math.max(0, Math.ceil(bottom - top + pad));
        }
        const left = first.offsetLeft;
        const right = last.offsetLeft + last.offsetWidth;
        const pad =
          (parseFloat(style.paddingLeft || "0") || 0) +
          (parseFloat(style.paddingRight || "0") || 0);
        return Math.max(0, Math.ceil(right - left + pad));
      };
      const snap = (node, axisValue, unit) => {
        if (!Number.isFinite(unit) || unit <= 0) return;
        const vertical = axisValue === "y";
        const current = vertical ? node.scrollTop : node.scrollLeft;
        const max = vertical
          ? Math.max(0, node.scrollHeight - node.clientHeight)
          : Math.max(0, node.scrollWidth - node.clientWidth);
        const target = Math.max(
          0,
          Math.min(max, Math.round(current / unit) * unit),
        );
        if (Math.abs(current - target) <= 0.5) return;
        if (vertical) node.scrollTop = target;
        else node.scrollLeft = target;
      };
      const autoCount = (node, axisValue, unit, trim) => {
        const items = visibleItems(node);
        if (!items.length) return 0;
        if (!Number.isFinite(unit) || unit <= 0) return 0;
        const size = nodeSize(node, axisValue);
        const max = items.length;
        let value = Math.max(
          1,
          Math.min(max, Math.floor((size + trim) / unit)),
        );
        while (value > 1 && trackByItems(node, value, axisValue) > size + 0.5) {
          value -= 1;
        }
        return value;
      };
      const apply = () => {
        if (!canRun()) return;
        const node =
          typeof strip === "string" ? panel.querySelector(strip) : strip;
        if (!node) return;
        const axisValue = axis() === "y" ? "y" : "x";
        const rawCount = Number(count());
        const automatic = !Number.isFinite(rawCount) || rawCount <= 0;
        if (automatic) reset(node);
        const style = getComputedStyle(node);
        const gap = parseFloat(style.columnGap || style.gap || "0");
        const trim = Number.isFinite(gap) ? gap : 0;
        const unit = Number(step());
        const baseUnit =
          Number.isFinite(unit) && unit > 0
            ? unit
            : Math.max(
                0,
                (parseFloat(style.getPropertyValue("--surface-button-size")) ||
                  0) + trim,
              );
        const value = automatic
          ? autoCount(node, axisValue, baseUnit, trim)
          : rawCount;
        if (!Number.isFinite(value) || value <= 0) {
          reset(node);
          return;
        }
        const measured = measure ? trackByItems(node, value, axisValue) : 0;
        const rawTrim =
          typeof edgeTrim === "function"
            ? edgeTrim({ node, axis: axisValue })
            : edgeTrim;
        const extraTrim = Number(rawTrim) || 0;
        const fallback =
          Number.isFinite(baseUnit) && baseUnit > 0
            ? Math.floor(baseUnit * value - trim)
            : 0;
        const track = Math.max(0, (measured || fallback) - extraTrim);
        if (axisValue === "y") {
          node.style.removeProperty("width");
          node.style.setProperty("height", `${track}px`, "important");
          node.style.removeProperty("max-width");
          node.style.setProperty("max-height", `${track}px`, "important");
          snap(node, axisValue, baseUnit);
          return;
        }
        node.style.removeProperty("height");
        node.style.setProperty("width", `${track}px`, "important");
        node.style.removeProperty("max-height");
        node.style.setProperty("max-width", `${track}px`, "important");
        snap(node, axisValue, baseUnit);
      };
      toolbar.listen(panel, window, "resize", apply);
      toolbar.listen(panel, panel, "scroll", apply);
      apply();
    },
    line({
      panel,
      strip = ".ui-strip",
      canRun = () => true,
      axis = () => "x",
      step = () => 0,
      count = () => 0,
      delay = 110,
      touch = true,
      bound = "true",
      onRefresh = null,
      edgeTrim = 0,
      limit = true,
    }) {
      if (!panel || panel.dataset.toolbarLine === bound) return;
      panel.dataset.toolbarLine = bound;
      const clearLimit = () => {
        const node =
          typeof strip === "string" ? panel.querySelector(strip) : strip;
        if (!node) return;
        node.style.removeProperty("width");
        node.style.removeProperty("height");
        node.style.removeProperty("max-width");
        node.style.removeProperty("max-height");
      };
      const refresh = () => {
        panel.dispatchEvent(new Event("scroll"));
        if (typeof onRefresh === "function") onRefresh();
      };
      const refreshLater = (delay) => {
        setTimeout(refresh, delay);
      };
      toolbar.behavior.flow({
        panel,
        strip,
        canRun,
        axis,
        step,
        delay,
        touch,
      });
      if (limit) {
        const config = limit === true ? {} : limit;
        toolbar.behavior.limit({
          panel,
          strip: config.strip ?? strip,
          count: config.count ?? count,
          axis: config.axis ?? axis,
          step: config.step ?? step,
          canRun: config.canRun ?? canRun,
          edgeTrim: config.edgeTrim ?? edgeTrim,
          measure: config.measure ?? true,
        });
      } else {
        clearLimit();
      }
      setTimeout(refresh, 0);
      setTimeout(refresh, 40);
      refreshLater(120);
      refreshLater(260);
      refreshLater(520);
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(refresh);
      }
      const images = panel.querySelectorAll("img");
      images.forEach((image) => {
        if (image.complete) {
          refreshLater(0);
          refreshLater(40);
        }
        toolbar.listen(panel, image, "load", refresh, { passive: true });
        if (typeof image.decode === "function") {
          image
            .decode()
            .then(refresh)
            .catch(() => {});
        }
      });
      if (document.fonts?.ready) {
        document.fonts.ready.then(refresh).catch(() => {});
      }
    },
    actions({
      panel,
      root = panel,
      selector = "[data-action]",
      action = () => {},
      disabled = () => false,
      hold = [],
      delay = 420,
      keepFocus = false,
    }) {
      if (!panel || !root || panel.dataset.actions === "true") return;
      panel.dataset.actions = "true";
      const state = ux.actions.headless.init();
      toolbar.listen(
        panel,
        root,
        "touchstart",
        (event) => {
          const button = event.target.closest(selector);
          if (!button || !panel.contains(button)) return;
          if (
            keepFocus ||
            ux.actions.headless.held(hold, button.dataset.action)
          ) {
            event.preventDefault();
            event.stopPropagation();
          }
          const name = button.dataset.action || "";
          if (!ux.actions.headless.held(hold, name)) return;
          if (disabled(name, button)) {
            return;
          }
          ux.actions.headless.reset(state);
          state.name = name;
          state.button = button;
          state.timer = setTimeout(() => {
            state.timer = null;
            state.consumed = true;
            action({ name, kind: "hold", button, event });
          }, delay);
        },
        { passive: false },
      );
      toolbar.listen(panel, root, "touchend", (event) => {
        const button = event.target.closest(selector);
        if (!button || !panel.contains(button)) return;
        if (ux.actions.headless.recentTouchScroll(panel)) {
          ux.actions.headless.reset(state);
          return;
        }
        const name = button.dataset.action || "";
        if (!ux.actions.headless.held(hold, name)) {
          if (!keepFocus) return;
          if (disabled(name, button)) return;
          state.skip = name;
          action({ name, kind: "click", button, event });
          ux.actions.headless.reset(state);
          return;
        }
        if (!ux.actions.headless.held(hold, name)) return;
        const pending = Boolean(state.timer);
        ux.actions.headless.clear(state);
        if (state.consumed && state.name === name) {
          ux.actions.headless.reset(state);
          return;
        }
        if (!pending) {
          ux.actions.headless.reset(state);
          return;
        }
        if (disabled(name, button)) {
          ux.actions.headless.reset(state);
          return;
        }
        state.skip = name;
        action({ name, kind: "click", button, event });
        ux.actions.headless.reset(state);
      });
      toolbar.listen(panel, root, "touchcancel", () =>
        ux.actions.headless.reset(state),
      );
      toolbar.listen(panel, root, "click", (event) => {
        const button = event.target.closest(selector);
        if (!button || !panel.contains(button)) return;
        if (ux.actions.headless.recentTouchScroll(panel)) return;
        const name = button.dataset.action || "";
        if (ux.actions.headless.consumeSkip(state, name)) return;
        if (disabled(name, button)) {
          return;
        }
        action({ name, kind: "click", button, event });
      });
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
      toolbar.listen(panel, panel, "pointerdown", () =>
        toolbar.bringToFront(panel),
      );
      toolbar.listen(panel, panel, "focusin", () =>
        toolbar.bringToFront(panel),
      );
    },
    recover(panel, value) {
      return toolbar.recover(panel, value);
    },
  },
  policy: {
    rail(
      content = "content",
      {
        panel = null,
        place = null,
        launcher = {},
        line = {},
        drag = {},
        origin = {},
        dock = {},
        position = null,
      } = {},
    ) {
      const base = {
        content,
        fullscreen: () => true,
        surface: () => "toolbar",
        flow: "rail",
      };
      const positionConfig =
        !position || position === false
          ? null
          : typeof position === "string"
            ? { key: position }
            : position;
      const positionKey = positionConfig?.key || "";
      const canStart = (event) => {
        if (event.button !== undefined && event.button !== 0) return false;
        return !event.target.closest("[data-action]");
      };
      if (!panel) {
        return {
          ...base,
          drag: {
            canStart,
          },
        };
      }
      const lineConfig = line === false ? null : line || {};
      const lineStrip = lineConfig?.strip || "[data-line]";
      const buildDock = () =>
        toolbar.behavior.dock({
          panel,
          snap: dock.snap ?? toolbar.rail.dock.snap,
          content: dock.content || null,
          enabled: dock.enabled || (() => true),
        });
      const applyDock = (value) => {
        if (!value) return null;
        const rect = panel.getBoundingClientRect();
        toolbar.behavior.dockApply({
          panel,
          dock: value,
          value: { left: rect.left, top: rect.top },
          margin: dock.margin ?? toolbar.rail.dock.margin,
          edge: dock.edge ?? toolbar.rail.dock.edge,
          normalize(node, side, previous) {
            toolbar.behavior.dockNormalize({
              panel: node,
              side,
              previous,
              line: lineStrip,
            });
          },
        });
        const node = panel.querySelector(lineStrip);
        if (node) node.dispatchEvent(new Event("scroll"));
        return {
          side: panel.dataset.dock || value.side || "floating",
          target: panel.dataset.dockTarget || value.target || "floating",
        };
      };
      const updateHint = () => {
        const rect = panel.getBoundingClientRect();
        toolbar.hint.update(panel, {
          dock: buildDock(),
          value: { left: rect.left, top: rect.top },
          margin: dock.margin ?? toolbar.rail.dock.margin,
          edge: dock.edge ?? toolbar.rail.dock.edge,
          content: dock.content || null,
          floating:
            panel.dataset.dock === "left" || panel.dataset.dock === "right",
        });
      };
      return {
        ...base,
        place,
        position: positionKey || undefined,
        persist: positionKey
          ? {
              key: positionKey,
              line: lineStrip,
              edge: positionConfig?.edge ?? dock.edge,
            }
          : null,
        launcher: launcher === false ? false : { ...(launcher || {}) },
        line:
          lineConfig === null
            ? null
            : {
                strip: lineStrip,
                canRun:
                  lineConfig.canRun ||
                  (() => {
                    const layout = panel.dataset.layout;
                    return layout === "fullscreen" || layout === "bottom";
                  }),
                axis: lineConfig.axis || (() => toolbar.behavior.axis(panel)),
                step:
                  lineConfig.step || (() => toolbar.behavior.scrollStep(panel)),
                count: lineConfig.count || (() => null),
                limit: lineConfig.limit ?? true,
              },
        origin:
          origin === false
            ? null
            : {
                min: origin.min || 280,
                edge: origin.edge,
                cap: origin.cap || 0,
              },
        drag: {
          keepWidth: drag.keepWidth === true,
          canStart(event) {
            if (!canStart(event)) return false;
            return drag.canStart ? drag.canStart(event) : true;
          },
          onMove(data) {
            updateHint();
            if (drag.onMove) drag.onMove(data);
          },
          onEnd(data = {}) {
            const dockValue = data.moved ? applyDock(buildDock()) : null;
            if (data.moved && positionKey) {
              toolbar.behavior.railPersist({
                panel,
                key: positionKey,
                dock: dockValue,
              });
            }
            if (drag.onEnd) drag.onEnd({ ...data, dock: dockValue });
          },
        },
      };
    },
    railDocked(content = "content", options = {}) {
      return toolbar.policy.rail(content, options);
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
    rail(content = "content", options = {}) {
      return toolbar.policy.rail(content, options);
    },
    railDocked(content = "content", options = {}) {
      return toolbar.presets.rail(content, options);
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
      theme:
        config.theme ||
        (() => toolbar.appearance.theme(config.content || "content")),
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
      actions: config.actions || null,
      scroll: config.scroll || null,
      resize: config.resize || null,
      snap: config.snap || null,
      hint: config.hint || config.snap || null,
      sticky: config.sticky || null,
      line: config.line || null,
      launcher: config.launcher || null,
      origin: config.origin || null,
      persist: config.persist || null,
      observe: config.observe || {},
      flow: config.flow || "",
      surface:
        config.surface ||
        ((layout) => (layout === "fullscreen" ? "toolbar" : "")),
    };
    if (value.flow && value.panel) {
      value.panel.dataset.toolbarFlow = value.flow;
      if (value.flow === "rail" && !value.panel.dataset.dock) {
        value.panel.dataset.dock = "floating";
        value.panel.dataset.dockTarget = "floating";
      }
    }
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
            content: value.content,
            scroll: value.observe.scroll !== false,
            wheel: value.wheel ? (event) => value.wheel(event) : null,
          });
        },
        actions() {
          if (!value.actions) return;
          toolbar.behavior.actions({
            panel: value.panel,
            root: value.actions.root || value.panel,
            selector: value.actions.selector || "[data-action]",
            action: value.actions.action || (() => {}),
            disabled: value.actions.disabled || (() => false),
            hold: value.actions.hold || [],
            delay: value.actions.delay || 420,
            keepFocus: value.actions.keepFocus || false,
          });
        },
        drag() {
          if (!value.drag) return;
          toolbar.behavior.drag({
            panel: value.panel,
            hint: value.hint || null,
            keepWidth: value.drag?.keepWidth === true,
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
        restore(options = {}) {
          if (options.restore === false) return false;
          if (value.flow !== "rail") return false;
          if (!value.persist?.key) return false;
          if (toolbar.mobile()) return false;
          if (value.panel.dataset.toolbarRestore === "true") return false;
          value.panel.dataset.toolbarRestore = "true";
          return toolbar.behavior.railRestore({
            panel: value.panel,
            position: toolbar.state(value.persist.key),
            line: value.persist.line || value.line?.strip || "[data-line]",
            edge: value.persist.edge ?? toolbar.rail.dock.edge,
          });
        },
        place(options = {}) {
          if (typeof value.place !== "function") return false;
          const line = value.line?.strip || "[data-line]";
          if (value.flow !== "rail") {
            value.place();
            return true;
          }
          if (controller.behavior.restore(options)) return true;
          const side = value.panel.dataset.dock || "floating";
          const target = value.panel.dataset.dockTarget || "floating";
          if (side === "floating") {
            if (!toolbar.mobile()) {
              value.place();
              if (value.panel.dataset.manual === "true") {
                const rect = value.panel.getBoundingClientRect();
                const next = toolbar.appearance.clamp(value.panel, {
                  left: rect.left,
                  top: rect.top,
                  edge: value.origin?.edge ?? toolbar.rail.dock.edge,
                });
                toolbar.behavior.railApply({
                  panel: value.panel,
                  dock: { side, target },
                  value: next,
                  line,
                  keepWidth: true,
                });
                return true;
              }
              if (value.origin === null) {
                toolbar.behavior.railApply({
                  panel: value.panel,
                  dock: { side, target },
                  line,
                });
                return true;
              }
              const next = toolbar.appearance.origin(value.panel, {
                content: value.content,
                min: value.origin?.min || 280,
                edge: value.origin?.edge ?? toolbar.rail.dock.edge,
                cap:
                  typeof value.origin?.cap === "function"
                    ? value.origin.cap()
                    : value.origin?.cap || 0,
              });
              toolbar.behavior.railApply({
                panel: value.panel,
                dock: { side, target },
                value: next ? { left: next.left, top: next.top } : null,
                line,
                keepWidth: true,
              });
              return true;
            }
            value.place();
            toolbar.behavior.railApply({
              panel: value.panel,
              dock: { side, target },
              line,
            });
            return true;
          }
          const rect = value.panel.getBoundingClientRect();
          toolbar.behavior.dockApply({
            panel: value.panel,
            dock: { side, target },
            value: { left: rect.left, top: rect.top },
            margin: toolbar.rail.dock.margin,
            edge: toolbar.rail.dock.edge,
            line,
            normalize(node, next, previous) {
              toolbar.behavior.dockNormalize({
                panel: node,
                side: next,
                previous,
                line,
              });
            },
          });
          return true;
        },
        launcher() {
          value.launcher?.prepare?.();
          controller.behavior.line();
          delete value.panel.dataset.toolbarRestore;
          if (value.persist?.key) toolbar.state(value.persist.key, null);
          return toolbar.behavior.launcher(value.panel, {
            place: () => controller.behavior.place({ restore: false }),
            line: value.line?.strip || "[data-line]",
          });
        },
        line() {
          if (!value.line) return;
          toolbar.behavior.line({
            panel: value.panel,
            ...value.line,
            onRefresh: () => {
              controller.behavior.place();
              value.line.onRefresh?.();
            },
          });
        },
        bind(options = {}) {
          const sync = options.sync !== false;
          if (sync) controller.appearance.sync();
          if (value.flow && !value.panel.dataset.dock) {
            toolbar.behavior.orient({
              panel: value.panel,
              dock: { target: "floating", side: "floating" },
            });
          }
          toolbar.behavior.stack(value.panel);
          controller.behavior.observe();
          controller.behavior.actions();
          controller.behavior.drag();
          controller.behavior.scroll();
          controller.behavior.resize();
          controller.behavior.sticky();
          controller.behavior.line();
          if (typeof value.place === "function") {
            controller.behavior.place();
            toolbar.reflow(value.panel, () => controller.behavior.place());
          }
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

ui.surface = {
  ...ui.surface,
  theme: {
    key: "ui-panel-theme",
    get(fallback = "") {
      const value = toolbar.state(ui.surface.theme.key);
      if (value === "dark" || value === "light") return value;
      return fallback;
    },
    set(value = "") {
      if (value !== "dark" && value !== "light") return "";
      toolbar.state(ui.surface.theme.key, value);
      return value;
    },
    syncButton(panel, { action = "theme", scope = "reader" } = {}) {
      if (!panel) return;
      const button = panel.querySelector(`[data-action="${action}"]`);
      if (!button) return;
      if (button.dataset.themeIcon !== "auto") return;
      const current = panel.dataset.theme || "light";
      const buttonScope = button.dataset.themeScope || scope;
      button.innerHTML = ui.controls.icon(
        icon.emoji(toolbar.appearance.themeToggleIcon(current), buttonScope),
      );
    },
  },
  sync(panel, value) {
    const next = { ...(value || {}) };
    const saved = ui.surface.theme.get("");
    if (saved && !next.theme) next.theme = saved;
    const result = toolbar.appearance.sync(panel, next);
    const current = panel?.dataset?.theme;
    if (current === "dark" || current === "light") {
      ui.surface.theme.set(current);
    }
    ui.surface.theme.syncButton(panel);
    return result;
  },
  themeLocal(panel, { action = "theme", scope = "reader" } = {}) {
    if (!panel) return "light";
    const current = panel.dataset.theme || "light";
    const next = current === "dark" ? "light" : "dark";
    panel.dataset.theme = next;
    ui.surface.theme.set(next);
    ui.surface.theme.syncButton(panel, { action, scope });
    return next;
  },
  bindToolbar({
    panel,
    root = panel,
    hold = [],
    action = () => {},
    draggable = true,
    initial = null,
    rememberPosition = false,
    rememberKey = "",
    drag = {},
  } = {}) {
    if (!panel) return;
    const edge = 12;
    const min = 280;
    const screen = toolbar.screen();
    const storageKey =
      rememberKey ||
      `ui-toolbar-position:${panel.id || panel.dataset.uiSurface || "panel"}`;
    const applyPosition = ({ left, top }) => {
      const next = toolbar.clamp(panel, { left, top, edge });
      panel.style.setProperty("left", `${next.left}px`, "important");
      panel.style.setProperty("top", `${next.top}px`, "important");
      panel.style.setProperty("right", "auto", "important");
      panel.style.setProperty("bottom", "auto", "important");
      panel.style.removeProperty("transform");
    };
    const place = (mode) => {
      if (!mode) return false;
      panel.style.setProperty("width", "fit-content", "important");
      panel.style.setProperty("max-width", "none", "important");
      const rect = panel.getBoundingClientRect();
      const width = Math.ceil(rect.width || panel.offsetWidth || 0);
      const height = Math.ceil(rect.height || panel.offsetHeight || 0);
      const minLeft = screen.offsetLeft + edge;
      const maxLeft = screen.offsetLeft + screen.width - width - edge;
      const minTop = screen.offsetTop + edge;
      const maxTop = screen.offsetTop + screen.height - height - edge;
      if (mode === "content-center") {
        const field = document.getElementById("content");
        const box = field?.getBoundingClientRect();
        const viewportMax = Math.max(min, screen.width - edge * 2);
        const fieldMax = box ? Math.max(min, box.width) : viewportMax;
        const maxWidth = Math.min(viewportMax, fieldMax);
        const natural = Math.max(min, toolbar.measureWidth(panel));
        const fitWidth = Math.min(natural, maxWidth);
        const centerX = box
          ? box.left + box.width / 2
          : screen.offsetLeft + screen.width / 2;
        const centerY = box
          ? box.top + box.height / 2
          : screen.offsetTop + screen.height / 2;
        const left = Math.min(
          screen.offsetLeft + screen.width - fitWidth - edge,
          Math.max(minLeft, centerX - fitWidth / 2),
        );
        const top = Math.min(maxTop, Math.max(minTop, centerY - height / 2));
        applyPosition({ left, top });
        return true;
      }
      if (mode === "center") {
        const left = screen.offsetLeft + (screen.width - width) / 2;
        const top = screen.offsetTop + (screen.height - height) / 2;
        applyPosition({ left, top });
        return true;
      }
      if (mode === "top-left") {
        applyPosition({ left: minLeft, top: minTop });
        return true;
      }
      if (mode === "top-right") {
        applyPosition({ left: maxLeft, top: minTop });
        return true;
      }
      if (mode === "top-center") {
        applyPosition({
          left: screen.offsetLeft + (screen.width - width) / 2,
          top: minTop,
        });
        return true;
      }
      return false;
    };
    if (rememberPosition) {
      const saved = toolbar.state(storageKey);
      if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
        applyPosition({ left: saved.left, top: saved.top });
      } else {
        place(initial);
      }
    } else {
      place(initial);
    }
    const run = (event) => {
      if (panel?.dataset?.moved === "true") {
        panel.dataset.moved = "false";
        return;
      }
      action(event);
    };
    toolbar.behavior.actions({
      panel,
      root,
      hold,
      action: run,
    });
    if (!draggable) return;
    panel.style.setProperty("cursor", "grab", "important");
    const onEndBase = drag.onEnd;
    const canStartBase = drag.canStart;
    const dragConfig = { ...drag };
    delete dragConfig.onEnd;
    delete dragConfig.canStart;
    toolbar.behavior.drag({
      panel,
      ...dragConfig,
      canStart(event) {
        if (event.button !== undefined && event.button !== 0) return false;
        const target = event.target;
        if (
          target?.closest?.(
            "[data-action],button,input,textarea,select,a,label",
          )
        ) {
          return false;
        }
        if (typeof canStartBase === "function") {
          return canStartBase(event);
        }
        return true;
      },
      onEnd(data = {}) {
        if (rememberPosition && data.panel) {
          const rect = data.panel.getBoundingClientRect();
          toolbar.state(storageKey, { left: rect.left, top: rect.top });
        }
        if (typeof onEndBase === "function") onEndBase(data);
      },
    });
  },
};
