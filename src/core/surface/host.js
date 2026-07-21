import { styles } from "./styles.js";

const hostStyleId = "panel-style";
const placementClass = {
  right: "place-right",
  left: "place-left",
  center: "place-center",
};
const surfaceSelector = ".panel";

export const host = {
  place: placementClass,
  styles: {
    upsert(id, value) {
      if (!id || !value) return null;
      const current = document.getElementById(id);
      if (current) {
        if (current.textContent !== value) current.textContent = value;
        return current;
      }
      const style = document.createElement("style");
      style.id = id;
      style.textContent = value;
      document.head.appendChild(style);
      return style;
    },
    ensure() {
      return host.styles.upsert(hostStyleId, styles.host.theme());
    },
    mount(id, value) {
      return host.styles.upsert(id, value);
    },
  },
  ensureStyles() {
    return host.styles.ensure();
  },
  mount(id, value) {
    return host.styles.mount(id, value);
  },
  drag: {
    interactive(target) {
      return Boolean(target?.closest?.("button,a,input,textarea,select,label,[data-field-resize-edge]"));
    },
    clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    },
    point(event) {
      const touch = event.touches?.[0] || event.changedTouches?.[0];
      if (touch) return { x: touch.clientX, y: touch.clientY };
      return { x: event.clientX, y: event.clientY };
    },
    lock: {
      snapshot() {
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
      },
      apply() {
        const root = document.documentElement;
        root.dataset.uiDragging = "true";
        document.body.style.touchAction = "none";
        root.style.touchAction = "none";
        document.body.style.userSelect = "none";
        root.style.userSelect = "none";
        document.body.style.webkitUserSelect = "none";
        root.style.webkitUserSelect = "none";
      },
      restore(value) {
        const root = document.documentElement;
        document.body.style.touchAction = value.bodyTouchAction;
        root.style.touchAction = value.rootTouchAction;
        document.body.style.userSelect = value.bodyUserSelect;
        root.style.userSelect = value.rootUserSelect;
        document.body.style.webkitUserSelect = value.bodyWebkitUserSelect;
        root.style.webkitUserSelect = value.rootWebkitUserSelect;
        if (value.rootUiDragging) {
          root.dataset.uiDragging = value.rootUiDragging;
        } else {
          delete root.dataset.uiDragging;
        }
      },
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
        if (host.drag.preview.node?.isConnected) return host.drag.preview.node;
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
        host.drag.preview.node = node;
        return node;
      },
      clear() {
        const node = host.drag.preview.node;
        if (!node) return;
        node.style.opacity = "0";
      },
      show(node, value) {
        const preview = host.drag.preview.ensure();
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
      const screen = host.drag.viewport();
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
          : host.drag.clamp(next.left, minLeft, maxLeft),
        top: minTop > maxTop
          ? screen.top + (screen.bottom - screen.top - height) / 2
          : host.drag.clamp(next.top, minTop, maxTop),
      };
    },
    applyPosition(node, value) {
      node.style.left = `${Math.round(value.left)}px`;
      node.style.top = `${Math.round(value.top)}px`;
    },
    syncSnap(node, value = true) {
      const config = host.drag.snapConfig(value);
      if (!node || !config?.enabled) return false;
      if (node.dataset.panelDragging === "true") return false;
      const state = {
        x: node.dataset.panelSnapX || "",
        y: node.dataset.panelSnapY || "",
      };
      if (!state.x && !state.y) return false;
      const margin = Number.parseFloat(node.dataset.panelSnapMargin || "");
      const next = host.drag.snapPosition(
        node,
        state,
        Number.isFinite(margin) ? margin : config.margin,
      );
      host.drag.applyPosition(node, next);
      return true;
    },
    snapPreview(node, value = true) {
      const config = host.drag.snapConfig(value);
      if (!node || !config?.enabled) return false;
      const screen = host.drag.viewport();
      const rect = node.getBoundingClientRect();
      const state = host.drag.snapState(rect, screen, config);
      if (!state.x && !state.y) {
        host.drag.preview.clear();
        return false;
      }
      const next = host.drag.snapPosition(node, state, config.margin);
      host.drag.preview.show(node, {
        left: next.left,
        top: next.top,
        width: rect.width || node.offsetWidth || 0,
        height: rect.height || node.offsetHeight || 0,
      });
      return true;
    },
    snap(node, value = true) {
      const config = host.drag.snapConfig(value);
      if (!node || !config?.enabled) return false;
      const screen = host.drag.viewport();
      const rect = node.getBoundingClientRect();
      const state = host.drag.snapState(rect, screen, config);
      if (!state.x && !state.y) {
        host.drag.clearSnap(node);
        host.drag.preview.clear();
        return false;
      }
      const next = host.drag.snapPosition(node, state, config.margin);
      node.dataset.panelSnapX = state.x;
      node.dataset.panelSnapY = state.y;
      node.dataset.panelSnapMargin = String(config.margin);
      host.drag.applyPosition(node, next);
      host.drag.preview.clear();
      return Math.abs(next.left - rect.left) >= 0.5 || Math.abs(next.top - rect.top) >= 0.5;
    },
    bind(node, { handle = "[data-panel-drag-handle]", exclude = "", snap = true } = {}) {
      if (!node || node.dataset.panelDraggable === "true") return node;
      let state = null;
      const syncSnap = () => host.drag.syncSnap(node, snap);
      const allowed = (event) => {
        if (event.button !== undefined && event.button !== 0) return false;
        if (host.drag.interactive(event.target)) return false;
        if (exclude && event.target?.closest?.(exclude)) return false;
        if (handle === false || handle === null) return node.contains(event.target);
        return Boolean(event.target?.closest?.(handle));
      };
      const place = ({ x, y }) => {
        if (!state) return;
        const screen = host.drag.viewport();
        const width = node.offsetWidth || node.getBoundingClientRect().width || 0;
        const height = node.offsetHeight || node.getBoundingClientRect().height || 0;
        const minLeft = screen.left;
        const maxLeft = screen.right - width;
        const minTop = screen.top;
        const maxTop = screen.bottom - height;
        const left = host.drag.clamp(
          x - state.offset.x,
          minLeft,
          minLeft > maxLeft ? minLeft : maxLeft,
        );
        const top = host.drag.clamp(
          y - state.offset.y,
          minTop,
          minTop > maxTop ? minTop : maxTop,
        );
        node.style.left = `${left}px`;
        node.style.top = `${top}px`;
        host.drag.snapPreview(node, state.snap);
      };
      const move = (event) => {
        if (!state) return;
        event.preventDefault();
        place(host.drag.point(event));
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
        host.drag.lock.restore(state.lock);
        host.drag.snap(node, state.snap);
        state = null;
        host.drag.preview.clear();
        delete node.dataset.panelDragging;
      };
      const start = (event) => {
        if (!allowed(event)) return;
        event.preventDefault();
        const rect = node.getBoundingClientRect();
        const value = host.drag.point(event);
        host.drag.clearSnap(node);
        state = {
          pointerId: event.pointerId,
          lock: host.drag.lock.snapshot(),
          offset: {
            x: value.x - rect.left,
            y: value.y - rect.top,
          },
          snap,
        };
        host.drag.lock.apply();
        node.dataset.panelDragging = "true";
        host.bringToFront(node);
        node.style.position = "fixed";
        node.style.left = `${rect.left}px`;
        node.style.top = `${rect.top}px`;
        node.style.right = "auto";
        node.style.bottom = "auto";
        node.style.transform = "none";
        node.style.visibility = "visible";
        node.style.opacity = "1";
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
  stack: {
    zIndex(node) {
      const inline = parseInt(node?.style?.zIndex || "", 10);
      if (Number.isFinite(inline)) return inline;
      const computed = parseInt(getComputedStyle(node).zIndex || "", 10);
      if (Number.isFinite(computed)) return computed;
      return 999999;
    },
    bringToFront(node) {
      if (!node) return;
      const list = [...document.querySelectorAll(surfaceSelector)];
      const value = list.reduce(
        (max, item) => Math.max(max, host.stack.zIndex(item)),
        999998,
      );
      node.style.setProperty("z-index", `${value + 1}`, "important");
    },
    bindFront(node) {
      if (!node || node.dataset.panelFront === "true") return;
      const sync = () => host.stack.bringToFront(node);
      node.addEventListener("pointerdown", sync, { capture: true });
      node.addEventListener("focusin", sync, { capture: true });
      node.dataset.panelFront = "true";
    },
  },
  frame: {
    place: placementClass,
    zIndex(node) {
      return host.stack.zIndex(node);
    },
    bringToFront(node) {
      return host.stack.bringToFront(node);
    },
    bindFront(node) {
      return host.stack.bindFront(node);
    },
    create({
      id,
      className = "panel",
      html = "",
      inlineStyle = "",
      place = "",
      draggable = false,
      snap = true,
    }) {
      host.styles.ensure();
      if (id) document.getElementById(id)?.remove();
      const node = document.createElement("div");
      if (id) node.id = id;
      const placement = host.frame.place[place] || "";
      node.className = [className, placement].filter(Boolean).join(" ");
      if (inlineStyle) node.style.cssText = inlineStyle;
      node.innerHTML = html;
      document.body.appendChild(node);
      host.stack.bindFront(node);
      host.stack.bringToFront(node);
      if (draggable) {
        const options = typeof draggable === "object"
          ? { snap, ...draggable }
          : { snap };
        host.drag.bind(node, options);
      }
      return node;
    },
  },
  zIndex(node) {
    return host.stack.zIndex(node);
  },
  bringToFront(node) {
    return host.stack.bringToFront(node);
  },
  bindFront(node) {
    return host.stack.bindFront(node);
  },
  create(value) {
    return host.frame.create(value);
  },
};

export const frame = host;
