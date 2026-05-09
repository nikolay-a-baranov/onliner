(() => {
  const current = window.onlinerMobile;
  if (current && typeof current.active === "function" && current.active()) {
    if (typeof current.exit === "function") current.exit();
    return;
  }
  delete window.onlinerMobile;
  const mobile = {
    id: "onliner-mobile-content",
    button: "onliner-mobile-button",
    panel: "onliner-mobile-panel",
    listeners: [],
    content() {
      return document.querySelector("#content");
    },
    post() {
      return document.querySelector("#post_ID")?.value || "unknown";
    },
    key(name) {
      return `onliner-mobile-content-${mobile.post()}-${name}`;
    },
    theme() {
      return localStorage.getItem(mobile.key("theme")) || "dark";
    },
    font() {
      return Number(localStorage.getItem(mobile.key("font")) || 0);
    },
    active() {
      return Boolean(document.getElementById(mobile.id));
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
      const touch = window.matchMedia("(pointer: coarse)").matches;
      const device = Math.min(window.screen.width, window.screen.height) <= 768;
      const viewport = mobile.screen().width <= 768;
      return touch || device || viewport;
    },
    state() {
      return {
        scroll: Number(localStorage.getItem(mobile.key("scroll")) || 0),
        start: Number(localStorage.getItem(mobile.key("start")) || 0),
        end: Number(localStorage.getItem(mobile.key("end")) || 0),
      };
    },
    colors() {
      if (mobile.theme() === "light")
        return {
          background: "#fff",
          color: "#111",
          panel: "rgba(0,0,0,.08)",
          control: "rgba(0,0,0,.12)",
          border: "rgba(0,0,0,.12)",
        };
      return {
        background: "#111",
        color: "#f2f2f2",
        panel: "rgba(255,255,255,.08)",
        control: "rgba(255,255,255,.16)",
        border: "rgba(255,255,255,.12)",
      };
    },
    html() {
      const value = document.querySelector("#content-html");
      if (!value) return;
      if (!window.switchEditors || !window.switchEditors.switchto) return;
      window.switchEditors.switchto(value);
    },
    css() {
      const color = mobile.colors();
      return `
html,body,body.onliner-mobile-active,#wpwrap,#wpcontent,#wpbody,#wpbody-content,.wrap,#post,#poststuff,#post-body,#post-body-content,#postdivrich,#wp-content-wrap,#wp-content-editor-container{margin:0!important;padding:0!important;width:100%!important;max-width:none!important;height:auto!important;overflow:visible!important;background:${color.background}!important}
#adminmenuback,#adminmenuwrap,#wpadminbar,#screen-meta,#screen-meta-links,#titlediv,.hndle,.title-preview,#postbox-container-1,#postbox-container-2,#wp-content-editor-tools,#ed_toolbar{display:none!important}
#content{position:fixed!important;left:0!important;top:0!important;z-index:999999!important;width:100vw!important;height:100vh!important;min-height:0!important;box-sizing:border-box!important;padding:16px!important;border:0!important;border-radius:0!important;outline:none!important;resize:none!important;background:${color.background}!important;color:${color.color}!important;caret-color:${color.color}!important;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;font-size:18px!important;line-height:1.45!important;letter-spacing:.01em!important;white-space:pre-wrap!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;touch-action:manipulation!important;-webkit-text-size-adjust:100%!important}
#${mobile.panel}{position:fixed!important;left:0!important;right:0!important;top:0!important;bottom:auto!important;z-index:1000000!important;height:66px!important;box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:10px!important;padding:10px 12px 12px!important;background:${color.background}!important}
#${mobile.panel} button{width:42px!important;height:42px!important;min-width:42px!important;padding:0!important;border:0!important;border-radius:999px!important;background:${color.control}!important;color:${color.color}!important;font:16px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;box-shadow:none!important;cursor:pointer!important}
#${mobile.panel} button:hover{filter:brightness(1.18)!important}
#${mobile.panel} button:active{transform:scale(.96)!important}
`;
    },
    installCss() {
      return `
#onliner-mobile-button{
  text-decoration:none!important;
  border-bottom-color:transparent!important;
  border-bottom:1px solid transparent!important;
  box-shadow:none!important;
  background:#f0f0f1!important;
  color:#1d2327!important;
}
#onliner-mobile-button:hover{
  background:#f0f0f1!important;
  color:#1d2327!important;
}
`;
    },
    style(id, string) {
      const value = document.createElement("style");
      value.id = id;
      value.textContent = string;
      return value;
    },
    save() {
      const value = mobile.content();
      if (!value) return;
      localStorage.setItem(mobile.key("scroll"), String(value.scrollTop));
      localStorage.setItem(
        mobile.key("start"),
        String(value.selectionStart || 0),
      );
      localStorage.setItem(mobile.key("end"), String(value.selectionEnd || 0));
    },
    restore() {
      const value = mobile.content();
      const state = mobile.state();
      if (!value) return;
      value.scrollTop = state.scroll;
      value.setSelectionRange(state.start, state.end);
    },
    snapshot() {
      const value = mobile.content();
      if (!value) return;
      if (value.dataset.onlinerMobileSnapshot) return;
      value.dataset.onlinerMobileSnapshot = "1";
      value.dataset.onlinerMobileStyle = value.getAttribute("style") || "";
      value.dataset.onlinerMobileStyleEmpty =
        value.getAttribute("style") === null ? "1" : "0";
      value.dataset.onlinerMobilePage = String(window.scrollY);
    },
    reset() {
      const value = mobile.content();
      if (!value) return;
      if (value.dataset.onlinerMobileStyleEmpty === "1")
        value.removeAttribute("style");
      if (value.dataset.onlinerMobileStyleEmpty !== "1")
        value.setAttribute("style", value.dataset.onlinerMobileStyle || "");
      window.scrollTo(0, Number(value.dataset.onlinerMobilePage || 0));
      delete value.dataset.onlinerMobileSnapshot;
      delete value.dataset.onlinerMobileStyle;
      delete value.dataset.onlinerMobileStyleEmpty;
      delete value.dataset.onlinerMobilePage;
    },
    resize() {
      const value = mobile.content();
      const panel = document.getElementById(mobile.panel);
      const screen = mobile.screen();
      if (!value) return;
      const phone = mobile.phone();
      const landscape = screen.width > screen.height;
      const header = 66;
      const padding = 16;
      const top = screen.offsetTop;
      const height = screen.height;
      const base = Math.max(
        16,
        Math.min(screen.width / (landscape ? 42 : 28), landscape ? 18 : 23),
      );
      const size = Math.max(14, Math.min(30, base + mobile.font()));
      value.style.setProperty(
        "left",
        phone ? "-1px" : `${screen.offsetLeft}px`,
        "important",
      );
      value.style.setProperty("top", `${top}px`, "important");
      value.style.setProperty(
        "width",
        phone ? "calc(100vw + 2px)" : `${screen.width}px`,
        "important",
      );
      value.style.setProperty("height", `${height}px`, "important");
      value.style.setProperty(
        "padding",
        `${header + padding}px ${padding}px ${padding}px`,
        "important",
      );
      value.style.setProperty("font-size", `${size}px`, "important");
      value.style.setProperty(
        "line-height",
        landscape ? "1.35" : "1.48",
        "important",
      );
      if (!panel) return;
      panel.style.setProperty("height", `${header}px`, "important");
      panel.style.setProperty(
        "padding-top",
        phone ? "max(8px, env(safe-area-inset-top))" : "8px",
        "important",
      );
    },
    listen(target, type, action) {
      target.addEventListener(type, action);
      mobile.listeners.push({ target, type, action });
    },
    unlisten() {
      mobile.listeners.forEach(({ target, type, action }) =>
        target.removeEventListener(type, action),
      );
      mobile.listeners = [];
    },
    toggle() {
      const theme = mobile.theme() === "dark" ? "light" : "dark";
      const style = document.getElementById(mobile.id);
      const button = document.querySelector(
        `#${mobile.panel} [data-action="theme"]`,
      );
      localStorage.setItem(mobile.key("theme"), theme);
      if (style) style.textContent = mobile.css();
      if (button) button.textContent = theme === "dark" ? "☀️" : "🌙";
      mobile.resize();
    },
    size(step) {
      const value = Math.max(-4, Math.min(8, mobile.font() + step));
      localStorage.setItem(mobile.key("font"), String(value));
      mobile.resize();
    },
    exit() {
      mobile.disable(true);
    },
    node() {
      const value = document.createElement("div");
      const controls = mobile.phone()
        ? `<button type="button" data-action="theme">${mobile.theme() === "dark" ? "☀️" : "🌙"}</button><button type="button" data-action="keyboard">⌨️</button><button type="button" data-action="exit">❌</button>`
        : `<button type="button" data-action="theme">${mobile.theme() === "dark" ? "☀️" : "🌙"}</button><button type="button" data-action="smaller">➖</button><button type="button" data-action="bigger">➕</button>`;
      value.id = mobile.panel;
      value.innerHTML = controls;
      value.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) return;
        if (button.dataset.action === "theme") return mobile.toggle();
        if (button.dataset.action === "keyboard")
          return mobile.content()?.focus();
        if (button.dataset.action === "exit") return mobile.exit();
        if (button.dataset.action === "smaller") return mobile.size(-1);
        if (button.dataset.action === "bigger") return mobile.size(1);
      });
      return value;
    },
    toolbarButton() {
      const value = document.createElement("a");
      value.id = mobile.button;
      value.href = "#";
      value.className = "hide-if-no-js wp-switch-editor";
      value.textContent = "📱";
      value.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          event.stopPropagation();
          mobile.enable();
        },
        true,
      );
      return value;
    },
    buttonNode() {
      const tools = document.querySelector("#wp-content-editor-tools");
      const html = document.querySelector("#content-html");
      if (!tools) return;
      tools.insertBefore(mobile.toolbarButton(), html || tools.firstChild);
    },
    removeEntry() {
      document.getElementById(mobile.button)?.remove();
    },
    bind(value) {
      let frame = null;
      let timer = null;
      const resize = () => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = null;
          mobile.resize();
        });
      };
      const save = () => {
        clearTimeout(timer);
        timer = setTimeout(() => mobile.save(), 150);
      };
      if (!mobile.phone()) {
        const escape = (event) => {
          if (event.key !== "Escape") return;
          mobile.exit();
        };
        mobile.listen(window, "keydown", escape);
      }
      mobile.listen(window, "resize", resize);
      mobile.listen(window, "orientationchange", resize);
      mobile.listen(value, "scroll", save);
      mobile.listen(value, "keyup", save);
      mobile.listen(value, "mouseup", save);
      if (!window.visualViewport) return;
      mobile.listen(window.visualViewport, "resize", resize);
      mobile.listen(window.visualViewport, "scroll", resize);
    },
    install() {
      if (!document.getElementById(`${mobile.button}-style`)) {
        document.head.appendChild(
          mobile.style(`${mobile.button}-style`, mobile.installCss()),
        );
      }
      if (!document.getElementById(mobile.button)) mobile.buttonNode();
    },
    enable() {
      const value = mobile.content();
      if (!value) return;
      mobile.html();
      mobile.snapshot();
      mobile.removeEntry();
      document.getElementById(mobile.id)?.remove();
      document.getElementById(mobile.panel)?.remove();
      document.body.classList.add("onliner-mobile-active");
      document.head.appendChild(mobile.style(mobile.id, mobile.css()));
      document.body.appendChild(mobile.node());
      window.onlinerMobile = {
        active: () => mobile.active(),
        exit: () => mobile.exit(),
      };
      mobile.bind(value);
      mobile.resize();
      mobile.restore();
      value.focus();
    },
    disable(focus) {
      const style = document.getElementById(mobile.id);
      const panel = document.getElementById(mobile.panel);
      const value = mobile.content();
      mobile.save();
      mobile.unlisten();
      mobile.reset();
      if (style) style.remove();
      if (panel) panel.remove();
      document.body.classList.remove("onliner-mobile-active");
      delete window.onlinerMobile;
      mobile.install();
      if (focus && value) value.focus();
    },
    run() {
      if (mobile.active()) return mobile.exit();
      if (document.getElementById(mobile.button)) return mobile.enable();
      mobile.install();
      mobile.enable();
    },
  };
  mobile.run();
})();
