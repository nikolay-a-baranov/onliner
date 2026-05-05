import { theme } from "./panel.css.js";

const style_id = "panel-style";

export const frame = {
  place: {
    right: "place-right",
    left: "place-left",
    center: "place-center",
  },
  ensureStyles() {
    if (document.getElementById(style_id)) return;
    const style = document.createElement("style");
    style.id = style_id;
    style.textContent = theme;
    document.head.appendChild(style);
  },
  mount(id, css) {
    if (!id || !css || document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  },
  create({ id, className = "panel", html = "", inlineStyle = "", place = "" }) {
    this.ensureStyles();
    if (id) document.getElementById(id)?.remove();
    const panel = document.createElement("div");
    if (id) panel.id = id;
    const placeClass = this.place[place] || "";
    panel.className = [className, placeClass].filter(Boolean).join(" ");
    if (inlineStyle) panel.style.cssText = inlineStyle;
    panel.innerHTML = html;
    document.body.appendChild(panel);
    return panel;
  },
};
