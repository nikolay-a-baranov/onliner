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
    bind(node, { handle = "[data-panel-drag-handle]" } = {}) {
      if (!node || node.dataset.panelDraggable === "true") return node;
      const down = (event) => {
        const target = event.target?.closest?.(handle);
        if (!target || event.button !== 0 || panel.drag.interactive(event.target)) return;
        event.preventDefault();
        const rect = node.getBoundingClientRect();
        const offset = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };
        const userSelect = document.body.style.userSelect;
        const webkitUserSelect = document.body.style.webkitUserSelect;
        document.body.style.userSelect = "none";
        document.body.style.webkitUserSelect = "none";
        node.dataset.panelDragging = "true";
        node.style.position = "fixed";
        node.style.left = `${rect.left}px`;
        node.style.top = `${rect.top}px`;
        node.style.right = "auto";
        node.style.bottom = "auto";
        node.style.transform = "none";
        node.setPointerCapture?.(event.pointerId);
        const move = (event) => {
          event.preventDefault();
          const left = panel.drag.clamp(
            event.clientX - offset.x,
            0,
            window.innerWidth - node.offsetWidth,
          );
          const top = panel.drag.clamp(
            event.clientY - offset.y,
            0,
            window.innerHeight - node.offsetHeight,
          );
          node.style.left = `${left}px`;
          node.style.top = `${top}px`;
        };
        const up = (event) => {
          window.removeEventListener("pointermove", move, true);
          window.removeEventListener("pointerup", up, true);
          window.removeEventListener("pointercancel", up, true);
          node.releasePointerCapture?.(event.pointerId);
          document.body.style.userSelect = userSelect;
          document.body.style.webkitUserSelect = webkitUserSelect;
          delete node.dataset.panelDragging;
        };
        window.addEventListener("pointermove", move, true);
        window.addEventListener("pointerup", up, true);
        window.addEventListener("pointercancel", up, true);
      };
      node.addEventListener("pointerdown", down, { once: false });
      node.dataset.panelDraggable = "true";
      return node;
    },
  },
  create({ id, className = "panel", html = "", inlineStyle = "", place = "", draggable = false }) {
    this.ensureStyles();
    if (id) document.getElementById(id)?.remove();
    const panel = document.createElement("div");
    if (id) panel.id = id;
    const placeClass = this.place[place] || "";
    panel.className = [className, placeClass].filter(Boolean).join(" ");
    if (inlineStyle) panel.style.cssText = inlineStyle;
    panel.innerHTML = html;
    document.body.appendChild(panel);
    if (draggable) this.drag.bind(panel);
    return panel;
  },
};

export const frame = panel;
