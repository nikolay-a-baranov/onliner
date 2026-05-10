export const toolbar = {
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
  phone() {
    const screen = toolbar.screen();
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const device = Math.min(window.screen.width, window.screen.height) <= 768;
    return touch || device || screen.width <= 768;
  },
  theme(id = "content") {
    const value = document.getElementById(id);
    const color = value ? getComputedStyle(value).backgroundColor : "";
    if (color.includes("255, 255, 255")) return "light";
    return "dark";
  },
  themeToggleIcon(theme) {
    return theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19";
  },
  layout({ fullscreen }) {
    if (fullscreen) return "fullscreen";
    if (toolbar.phone()) return "bottom";
    return "side";
  },
  sync(panel, { layout, theme, surface }) {
    panel.dataset.layout = layout;
    panel.dataset.theme = theme;
    if (surface) panel.dataset.uiSurface = surface;
    if (!surface) delete panel.dataset.uiSurface;
  },
  observe({
    panel,
    layout,
    place,
    rescue,
    theme,
    fullscreen = "fullscreen",
    wheel = null,
  }) {
    const sync = () => {
      panel.dataset.theme = theme();
    };
    panel.addEventListener(
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
    setInterval(sync, 300);
    window.addEventListener("resize", () => {
      place();
      if (rescue) rescue();
    });
    window.addEventListener("scroll", place, true);
  },
  drag({ panel, canStart, onEnd }) {
    if (panel.dataset.drag === "true") return;
    panel.dataset.drag = "true";
    let active = false;
    let startX = 0;
    let startY = 0;
    let left = 0;
    let top = 0;
    const down = (event) => {
      if (canStart && !canStart(event)) return;
      active = true;
      panel.dataset.moved = "false";
      panel.dataset.manual = "true";
      const rect = panel.getBoundingClientRect();
      startX = event.clientX;
      startY = event.clientY;
      left = rect.left;
      top = rect.top;
      panel.style.setProperty("transition", "none", "important");
      panel.style.setProperty("cursor", "grabbing", "important");
      panel.setPointerCapture?.(event.pointerId);
    };
    const move = (event) => {
      if (!active) return;
      panel.dataset.moved = "true";
      const nextLeft = left + event.clientX - startX;
      const nextTop = top + event.clientY - startY;
      toolbar.floating(panel, { left: nextLeft, top: nextTop });
    };
    const up = (event) => {
      if (!active) return;
      active = false;
      panel.style.removeProperty("transition");
      panel.style.removeProperty("cursor");
      panel.releasePointerCapture?.(event.pointerId);
      if (!onEnd) return;
      onEnd({ panel, event });
    };
    panel.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  },
  snap({ panel, snap = 96, top = 96, bottom = 60, onSnapTop, onSnapBottom }) {
    const rect = panel.getBoundingClientRect();
    const center = window.innerWidth / 2;
    if (rect.top < snap) {
      panel.style.setProperty("left", `${center}px`, "important");
      panel.style.setProperty("transform", "translateX(-50%)", "important");
      panel.style.setProperty("top", `${top}px`, "important");
      panel.style.setProperty("right", "auto", "important");
      panel.style.setProperty("bottom", "auto", "important");
      if (onSnapTop) onSnapTop({ left: center, top });
      return true;
    }
    if (window.innerHeight - rect.bottom < snap) {
      const value = window.innerHeight - rect.height - bottom;
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
  createController(config) {
    const value = {
      panel: config.panel,
      content: config.content || "content",
      position: config.position || "toolbar-position",
      fullscreen: config.fullscreen || (() => false),
      place: config.place,
      rescue: config.rescue || null,
      wheel: config.wheel || null,
      drag: config.drag || null,
      surface: config.surface || ((layout) => (layout === "fullscreen" ? "toolbar" : "")),
    };
    return {
      layout() {
        return toolbar.layout({ fullscreen: value.fullscreen() });
      },
      theme() {
        return toolbar.theme(value.content);
      },
      state(next) {
        return toolbar.state(value.position, next);
      },
      sync() {
        const layout = this.layout();
        const theme = this.theme();
        const surface = value.surface(layout);
        toolbar.sync(value.panel, { layout, theme, surface });
        return { layout, theme, surface };
      },
      observe() {
        toolbar.observe({
          panel: value.panel,
          layout: () => this.layout(),
          place: () => value.place(),
          rescue: value.rescue ? () => value.rescue() : null,
          theme: () => this.theme(),
          wheel: value.wheel ? (event) => value.wheel(event) : null,
        });
      },
      drag() {
        if (!value.drag) return;
        toolbar.drag({
          panel: value.panel,
          canStart: (event) =>
            value.drag.canStart ? value.drag.canStart(event) : true,
          onEnd: (data) => {
            if (!value.drag.onEnd) return;
            value.drag.onEnd(data);
          },
        });
      },
    };
  },
};
