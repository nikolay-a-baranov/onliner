import { css } from "./css.js";

const style_id = "panel-style";

export const panel = {
  place: {
    right: "place-right",
    left: "place-left",
    center: "place-center",
  },
  ensureStyles() {
    if (document.getElementById(style_id)) return;
    const style = document.createElement("style");
    style.id = style_id;
    style.textContent = css.panel.theme();
    document.head.appendChild(style);
  },
  mount(id, css) {
    if (!id || !css || document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  },
  drag: {
    interactive(target) {
      return Boolean(target?.closest?.("button,a,input,textarea,select,label"));
    },
    clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    },
    viewport() {
      const value = window.visualViewport;
      if (!value) {
        return {
          left: 0,
          top: 0,
          right: window.innerWidth,
          bottom: window.innerHeight,
        };
      }
      return {
        left: value.offsetLeft,
        top: value.offsetTop,
        right: value.offsetLeft + value.width,
        bottom: value.offsetTop + value.height,
      };
    },
    snapConfig(value) {
      if (value === false) return null;
      const source = value && typeof value === "object" ? value : {};
      return {
        enabled: source.enabled !== false,
        gap: Number.isFinite(source.gap) ? source.gap : 32,
        margin: Number.isFinite(source.margin) ? source.margin : 12,
      };
    },
    preview: {
      node: null,
      ensure() {
        if (panel.drag.preview.node?.isConnected) return panel.drag.preview.node;
        const node = document.createElement("div");
        node.dataset.panelSnapPreview = "true";
        node.style.position = "fixed";
        node.style.left = "0";
        node.style.top = "0";
        node.style.width = "0";
        node.style.height = "0";
        node.style.pointerEvents = "none";
        node.style.zIndex = "999998";
        node.style.border = "1px solid rgba(255,255,255,.38)";
        node.style.borderRadius = "var(--panel-radius, 14px)";
        node.style.background = "rgba(255,255,255,.08)";
        node.style.opacity = "0";
        node.style.transition = "opacity .12s ease";
        document.body.appendChild(node);
        panel.drag.preview.node = node;
        return node;
      },
      clear() {
        const node = panel.drag.preview.node;
        if (!node) return;
        node.style.opacity = "0";
      },
      show(node, value) {
        const preview = panel.drag.preview.ensure();
        const radius = getComputedStyle(node).borderRadius || "var(--panel-radius, 14px)";
        preview.style.left = `${Math.round(value.left)}px`;
        preview.style.top = `${Math.round(value.top)}px`;
        preview.style.width = `${Math.round(value.width)}px`;
        preview.style.height = `${Math.round(value.height)}px`;
        preview.style.borderRadius = radius;
        preview.style.opacity = "1";
      },
    },
    clearSnap(node) {
      if (!node?.dataset) return;
      delete node.dataset.panelSnapX;
      delete node.dataset.panelSnapY;
      delete node.dataset.panelSnapMargin;
    },
    snapState(rect, screen, config) {
      const gap = config.gap;
      const state = { x: "", y: "" };
      if (rect.left - screen.left <= gap) state.x = "left";
      else if (screen.right - rect.right <= gap) state.x = "right";
      if (rect.top - screen.top <= gap) state.y = "top";
      else if (screen.bottom - rect.bottom <= gap) state.y = "bottom";
      return state;
    },
    snapPosition(node, state, margin) {
      const screen = panel.drag.viewport();
      const rect = node.getBoundingClientRect();
      const width = node.offsetWidth || rect.width || 0;
      const height = node.offsetHeight || rect.height || 0;
      const next = { left: rect.left, top: rect.top };
      if (state.x === "left") next.left = screen.left + margin;
      if (state.x === "right") next.left = screen.right - width - margin;
      if (state.y === "top") next.top = screen.top + margin;
      if (state.y === "bottom") next.top = screen.bottom - height - margin;
      const minLeft = screen.left + margin;
      const maxLeft = screen.right - width - margin;
      const minTop = screen.top + margin;
      const maxTop = screen.bottom - height - margin;
      return {
        left: minLeft > maxLeft
          ? screen.left + (screen.right - screen.left - width) / 2
          : panel.drag.clamp(next.left, minLeft, maxLeft),
        top: minTop > maxTop
          ? screen.top + (screen.bottom - screen.top - height) / 2
          : panel.drag.clamp(next.top, minTop, maxTop),
      };
    },
    applyPosition(node, value) {
      node.style.left = `${Math.round(value.left)}px`;
      node.style.top = `${Math.round(value.top)}px`;
    },
    syncSnap(node, value = true) {
      const config = panel.drag.snapConfig(value);
      if (!node || !config?.enabled) return false;
      if (node.dataset.panelDragging === "true") return false;
      const state = {
        x: node.dataset.panelSnapX || "",
        y: node.dataset.panelSnapY || "",
      };
      if (!state.x && !state.y) return false;
      const margin = Number.parseFloat(node.dataset.panelSnapMargin || "");
      const next = panel.drag.snapPosition(
        node,
        state,
        Number.isFinite(margin) ? margin : config.margin,
      );
      panel.drag.applyPosition(node, next);
      return true;
    },
    snapPreview(node, value = true) {
      const config = panel.drag.snapConfig(value);
      if (!node || !config?.enabled) return false;
      const screen = panel.drag.viewport();
      const rect = node.getBoundingClientRect();
      const state = panel.drag.snapState(rect, screen, config);
      if (!state.x && !state.y) {
        panel.drag.preview.clear();
        return false;
      }
      const next = panel.drag.snapPosition(node, state, config.margin);
      panel.drag.preview.show(node, {
        left: next.left,
        top: next.top,
        width: rect.width || node.offsetWidth || 0,
        height: rect.height || node.offsetHeight || 0,
      });
      return true;
    },
    snap(node, value = true) {
      const config = panel.drag.snapConfig(value);
      if (!node || !config?.enabled) return false;
      const screen = panel.drag.viewport();
      const rect = node.getBoundingClientRect();
      const state = panel.drag.snapState(rect, screen, config);
      if (!state.x && !state.y) {
        panel.drag.clearSnap(node);
        panel.drag.preview.clear();
        return false;
      }
      const next = panel.drag.snapPosition(node, state, config.margin);
      node.dataset.panelSnapX = state.x;
      node.dataset.panelSnapY = state.y;
      node.dataset.panelSnapMargin = String(config.margin);
      panel.drag.applyPosition(node, next);
      panel.drag.preview.clear();
      return Math.abs(next.left - rect.left) >= 0.5 || Math.abs(next.top - rect.top) >= 0.5;
    },
    bind(node, { handle = "[data-panel-drag-handle]", snap = true } = {}) {
      if (!node || node.dataset.panelDraggable === "true") return node;
      let state = null;
      const syncSnap = () => panel.drag.syncSnap(node, snap);
      const allowed = (event) => {
        const target = event.target?.closest?.(handle);
        if (!target) return false;
        if (event.button !== undefined && event.button !== 0) return false;
        return !panel.drag.interactive(event.target);
      };
      const lock = () => {
        const root = document.documentElement;
        return {
          bodyTouchAction: document.body.style.touchAction,
          rootTouchAction: root.style.touchAction,
          bodyUserSelect: document.body.style.userSelect,
          rootUserSelect: root.style.userSelect,
          bodyWebkitUserSelect: document.body.style.webkitUserSelect,
          rootWebkitUserSelect: root.style.webkitUserSelect,
          rootUiDragging: root.dataset.uiDragging,
        };
      };
      const applyLock = () => {
        const root = document.documentElement;
        root.dataset.uiDragging = "true";
        document.body.style.touchAction = "none";
        root.style.touchAction = "none";
        document.body.style.userSelect = "none";
        root.style.userSelect = "none";
        document.body.style.webkitUserSelect = "none";
        root.style.webkitUserSelect = "none";
      };
      const restoreLock = (snapshot) => {
        const root = document.documentElement;
        document.body.style.touchAction = snapshot.bodyTouchAction;
        root.style.touchAction = snapshot.rootTouchAction;
        document.body.style.userSelect = snapshot.bodyUserSelect;
        root.style.userSelect = snapshot.rootUserSelect;
        document.body.style.webkitUserSelect = snapshot.bodyWebkitUserSelect;
        root.style.webkitUserSelect = snapshot.rootWebkitUserSelect;
        if (snapshot.rootUiDragging) {
          root.dataset.uiDragging = snapshot.rootUiDragging;
        } else {
          delete root.dataset.uiDragging;
        }
      };
      const point = (event) => {
        const touch = event.touches?.[0] || event.changedTouches?.[0];
        if (touch) return { x: touch.clientX, y: touch.clientY };
        return { x: event.clientX, y: event.clientY };
      };
      const place = ({ x, y }) => {
        if (!state) return;
        const left = panel.drag.clamp(
          x - state.offset.x,
          0,
          window.innerWidth - node.offsetWidth,
        );
        const top = panel.drag.clamp(
          y - state.offset.y,
          0,
          window.innerHeight - node.offsetHeight,
        );
        node.style.left = `${left}px`;
        node.style.top = `${top}px`;
        panel.drag.snapPreview(node, state.snap);
      };
      const move = (event) => {
        if (!state) return;
        event.preventDefault();
        place(point(event));
      };
      const clear = (event) => {
        if (!state) return;
        window.removeEventListener("pointermove", move, true);
        window.removeEventListener("pointerup", clear, true);
        window.removeEventListener("pointercancel", clear, true);
        document.removeEventListener("touchmove", move, true);
        document.removeEventListener("touchend", clear, true);
        document.removeEventListener("touchcancel", clear, true);
        node.releasePointerCapture?.(event?.pointerId ?? state.pointerId);
        restoreLock(state.lock);
        panel.drag.snap(node, state.snap);
        state = null;
        panel.drag.preview.clear();
        delete node.dataset.panelDragging;
      };
      const start = (event) => {
        if (!allowed(event)) return;
        event.preventDefault();
        const rect = node.getBoundingClientRect();
        const value = point(event);
        panel.drag.clearSnap(node);
        state = {
          pointerId: event.pointerId,
          lock: lock(),
          offset: {
            x: value.x - rect.left,
            y: value.y - rect.top,
          },
          snap,
        };
        applyLock();
        node.dataset.panelDragging = "true";
        node.style.position = "fixed";
        node.style.left = `${rect.left}px`;
        node.style.top = `${rect.top}px`;
        node.style.right = "auto";
        node.style.bottom = "auto";
        node.style.transform = "none";
        node.setPointerCapture?.(event.pointerId);
        window.addEventListener("pointermove", move, true);
        window.addEventListener("pointerup", clear, true);
        window.addEventListener("pointercancel", clear, true);
        document.addEventListener("touchmove", move, { passive: false, capture: true });
        document.addEventListener("touchend", clear, { passive: false, capture: true });
        document.addEventListener("touchcancel", clear, { passive: false, capture: true });
      };
      const touchstart = (event) => {
        if (!allowed(event)) return;
        event.preventDefault();
      };
      node.addEventListener("touchstart", touchstart, { passive: false, capture: true });
      node.addEventListener("pointerdown", start, { passive: false });
      window.addEventListener("scroll", syncSnap, { passive: true });
      window.addEventListener("resize", syncSnap, { passive: true });
      window.visualViewport?.addEventListener("scroll", syncSnap, { passive: true });
      window.visualViewport?.addEventListener("resize", syncSnap, { passive: true });
      node.dataset.panelDraggable = "true";
      return node;
    },
  },
  create({ id, className = "panel", html = "", inlineStyle = "", place = "", draggable = false, snap = true }) {
    this.ensureStyles();
    if (id) document.getElementById(id)?.remove();
    const panel = document.createElement("div");
    if (id) panel.id = id;
    const placeClass = this.place[place] || "";
    panel.className = [className, placeClass].filter(Boolean).join(" ");
    if (inlineStyle) panel.style.cssText = inlineStyle;
    panel.innerHTML = html;
    document.body.appendChild(panel);
    if (draggable) this.drag.bind(panel, { snap });
    return panel;
  },
};

export const frame = panel;
