import { frame } from "./core/panel.js";
import { toolbar } from "./core/toolbar.js";

(() => {
  const active = document.getElementById("onliner-reader-content");
  if (active && window.onlinerReaderExit) {
    window.onlinerReaderExit();
    return;
  }
  if (active && window.onlinerMobileExit) {
    window.onlinerMobileExit();
    return;
  }
  if (active) {
    active.remove();
    document.getElementById("onliner-reader-panel")?.remove();
    document.body.classList.remove("onliner-reader-active");
    document.body.classList.remove("onliner-mobile-active");
    delete window.onlinerReader;
    delete window.onlinerReaderExit;
    delete window.onlinerMobile;
    delete window.onlinerMobileExit;
    return;
  }
  delete window.onlinerReader;
  delete window.onlinerReaderExit;
  delete window.onlinerMobile;
  delete window.onlinerMobileExit;
  const reader = {
    id: "onliner-reader-content",
    button: "onliner-reader-button",
    panel: "onliner-reader-panel",
    listeners: [],
    content() {
      return document.querySelector("#content");
    },
    post() {
      return document.querySelector("#post_ID")?.value || "unknown";
    },
    key(name) {
      return `onliner-reader-content-${reader.post()}-${name}`;
    },
    theme() {
      return localStorage.getItem(reader.key("theme")) || "dark";
    },
    font() {
      return Number(localStorage.getItem(reader.key("font")) || 0);
    },
    active() {
      return Boolean(document.getElementById(reader.id));
    },
    screen() {
      return toolbar.screen();
    },
    phone() {
      return toolbar.phone();
    },
    state() {
      return {
        scroll: Number(localStorage.getItem(reader.key("scroll")) || 0),
        start: Number(localStorage.getItem(reader.key("start")) || 0),
        end: Number(localStorage.getItem(reader.key("end")) || 0),
      };
    },
    colors() {
      if (reader.theme() === "light")
        return {
          background: "#fff",
          color: "#111",
          fade: "rgba(255,255,255,0)",
          shade: "rgba(255,255,255,.92)",
          shadow: "rgba(255,255,255,.55)",
        };
      return {
        background: "#111",
        color: "#f2f2f2",
        fade: "rgba(17,17,17,0)",
        shade: "rgba(17,17,17,.92)",
        shadow: "rgba(17,17,17,.55)",
      };
    },
    html() {
      const value = document.querySelector("#content-html");
      if (!value) return;
      if (!window.switchEditors || !window.switchEditors.switchto) return;
      window.switchEditors.switchto(value);
    },
    css() {
      const color = reader.colors();
      return `
        html,
        body,
        body.onliner-reader-active,
        #wpwrap,
        #wpcontent,
        #wpbody,
        #wpbody-content,
        .wrap,
        #post,
        #poststuff,
        #post-body,
        #post-body-content,
        #postdivrich,
        #wp-content-wrap,
        #wp-content-editor-container{
          margin:0!important;
          padding:0!important;
          width:100%!important;
          max-width:none!important;
          height:auto!important;
          overflow:visible!important;
          background:${color.background}!important
        }
        #adminmenuback,
        #adminmenuwrap,
        #wpadminbar,
        #screen-meta,
        #screen-meta-links,
        #titlediv,
        .hndle,
        .title-preview,
        #postbox-container-1,
        #postbox-container-2,
        #wp-content-editor-tools,
        #ed_toolbar{
          display:none!important
        }
        #content{
          position:fixed!important;
          left:0!important;
          top:0!important;
          z-index:999999!important;
          width:100vw!important;
          height:100vh!important;
          min-height:0!important;
          box-sizing:border-box!important;
          padding:16px!important;
          border:0!important;
          border-radius:0!important;
          appearance:none!important;
          -webkit-appearance:none!important;
          box-shadow:none!important;
          outline:none!important;
          resize:none!important;
          background:${color.background}!important;
          color:${color.color}!important;
          caret-color:${color.color}!important;
          font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;
          font-size:18px!important;
          line-height:1.45!important;
          letter-spacing:.01em!important;
          white-space:pre-wrap!important;
          overflow:auto!important;
          overflow-x:hidden!important;
          -webkit-overflow-scrolling:touch!important;
          overscroll-behavior:contain!important;
          overscroll-behavior-x:none!important;
          touch-action:manipulation!important;
          -webkit-text-size-adjust:100%!important;
          word-break:break-word!important;
          overflow-wrap:anywhere!important
        }
        html,
        body,
        body.onliner-reader-active{
          overflow-x:hidden!important
        }
        #${reader.panel}{
          position:fixed!important;
          left:0!important;
          right:0!important;
          top:0!important;
          bottom:auto!important;
          z-index:1000000!important;
          height:64px!important;
          box-sizing:border-box!important;
          display:flex!important;
          align-items:center!important;
          justify-content:center!important;
          gap:10px!important;
          padding:0 12px!important;
          pointer-events:none!important;
          border:0!important;
          border-radius:0!important;
          box-shadow:none!important;
          background:transparent!important
        }
        #${reader.panel}::after{
          content:""!important;
          position:absolute!important;
          left:-1px!important;
          right:calc(var(--reader-scrollbar-gap,0px) - 1px)!important;
          top:-1px!important;
          height:100px!important;
          background:linear-gradient(
            to bottom,
            ${color.background} 0%,
            ${color.background} 22%,
            ${color.shade} 54%,
            ${color.shadow} 78%,
            ${color.fade} 100%
          )!important;
          z-index:-1!important;
          border-radius:0!important
        }
        #${reader.panel}-bottom{
          position:fixed!important;
          left:0!important;
          right:var(--reader-scrollbar-gap,0px)!important;
          bottom:0!important;
          height:60px!important;
          pointer-events:none!important;
          z-index:1000000!important;
          background:linear-gradient(
            to top,
            ${color.background} 0%,
            ${color.background} 22%,
            ${color.shade} 54%,
            ${color.shadow} 78%,
            ${color.fade} 100%
          )!important
        }
        #${reader.panel} .button{
          pointer-events:auto!important;
          font:16px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important
        }
      `;
    },
    installCss() {
      return `
        #onliner-reader-button{
          text-decoration:none!important;
          border-bottom-color:transparent!important;
          border-bottom:1px solid transparent!important;
          box-shadow:none!important;
          background:#f0f0f1!important;
          color:#1d2327!important;
        }
        #onliner-reader-button:hover{
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
      const value = reader.content();
      if (!value) return;
      localStorage.setItem(reader.key("scroll"), String(value.scrollTop));
      localStorage.setItem(
        reader.key("start"),
        String(value.selectionStart || 0),
      );
      localStorage.setItem(reader.key("end"), String(value.selectionEnd || 0));
    },
    restore() {
      const value = reader.content();
      const state = reader.state();
      if (!value) return;
      value.scrollTop = state.scroll;
      value.setSelectionRange(state.start, state.end);
    },
    snapshot() {
      const value = reader.content();
      if (!value) return;
      if (value.dataset.onlinerReaderSnapshot) return;
      value.dataset.onlinerReaderSnapshot = "1";
      value.dataset.onlinerReaderStyle = value.getAttribute("style") || "";
      value.dataset.onlinerReaderStyleEmpty =
        value.getAttribute("style") === null ? "1" : "0";
      value.dataset.onlinerReaderPage = String(window.scrollY);
    },
    reset() {
      const value = reader.content();
      if (!value) return;
      if (value.dataset.onlinerReaderStyleEmpty === "1")
        value.removeAttribute("style");
      if (value.dataset.onlinerReaderStyleEmpty !== "1")
        value.setAttribute("style", value.dataset.onlinerReaderStyle || "");
      window.scrollTo(0, Number(value.dataset.onlinerReaderPage || 0));
      delete value.dataset.onlinerReaderSnapshot;
      delete value.dataset.onlinerReaderStyle;
      delete value.dataset.onlinerReaderStyleEmpty;
      delete value.dataset.onlinerReaderPage;
    },
    resize() {
      const value = reader.content();
      const panel = document.getElementById(reader.panel);
      const screen = reader.screen();
      if (!value) return;
      const phone = reader.phone();
      const landscape = screen.width > screen.height;
      const header = 96;
      const padding = phone ? 16 : 12;
      const top = screen.offsetTop;
      const height = screen.height;
      const base = Math.max(
        16,
        Math.min(screen.width / (landscape ? 42 : 28), landscape ? 18 : 23),
      );
      const size = Math.max(14, Math.min(30, base + reader.font()));
      value.style.setProperty(
        "left",
        phone ? "-1px" : `${screen.offsetLeft - 1}px`,
        "important",
      );
      value.style.setProperty("top", `${Math.max(0, top - 1)}px`, "important");
      value.style.setProperty(
        "width",
        phone ? "calc(100vw + 2px)" : `${screen.width + 2}px`,
        "important",
      );
      value.style.setProperty("height", `${height + 1}px`, "important");
      value.style.setProperty(
        "padding",
        `${header - 12}px ${padding}px ${padding + 26}px`,
        "important",
      );
      value.style.setProperty("font-size", `${size}px`, "important");
      value.style.setProperty(
        "line-height",
        landscape ? "1.35" : "1.48",
        "important",
      );
      document.documentElement.style.setProperty(
        "--reader-scrollbar-gap",
        `${Math.max(0, value.offsetWidth - value.clientWidth)}px`,
      );
      if (!panel) return;
      panel.style.setProperty("height", "64px", "important");
    },
    listen(target, type, action) {
      target.addEventListener(type, action);
      reader.listeners.push({ target, type, action });
    },
    unlisten() {
      reader.listeners.forEach(({ target, type, action }) =>
        target.removeEventListener(type, action),
      );
      reader.listeners = [];
    },
    toggle() {
      const theme = reader.theme() === "dark" ? "light" : "dark";
      const style = document.getElementById(reader.id);
      const button = document.querySelector(
        `#${reader.panel} [data-action="theme"]`,
      );
      const panel = document.getElementById(reader.panel);
      localStorage.setItem(reader.key("theme"), theme);
      if (style) style.textContent = reader.css();
      if (panel) panel.dataset.theme = theme;
      if (button) button.textContent = toolbar.themeToggleIcon(theme);
      reader.resize();
    },
    size(step) {
      const value = Math.max(-4, Math.min(8, reader.font() + step));
      localStorage.setItem(reader.key("font"), String(value));
      reader.resize();
    },
    exit() {
      reader.disable(true);
    },
    node() {
      const value = document.createElement("div");
      const controls = reader.phone()
        ? `<button class="button button-emoji" type="button" data-action="keyboard">⌨️</button><button class="button button-emoji" type="button" data-action="theme">${toolbar.themeToggleIcon(reader.theme())}</button><button class="button button-emoji" type="button" data-action="exit">❌</button>`
        : `<button class="button button-emoji" type="button" data-action="smaller">➖</button><button class="button button-emoji" type="button" data-action="theme">${toolbar.themeToggleIcon(reader.theme())}</button><button class="button button-emoji" type="button" data-action="bigger">➕</button>`;
      value.id = reader.panel;
      value.className = "panel";
      value.dataset.uiSurface = "reader";
      value.dataset.theme = reader.theme();
      value.innerHTML = controls;
      value.addEventListener("mousedown", (event) => event.preventDefault());
      value.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) return;
        if (button.dataset.action === "theme") return reader.toggle();
        if (button.dataset.action === "keyboard")
          return reader.content()?.focus();
        if (button.dataset.action === "exit") return reader.exit();
        if (button.dataset.action === "smaller") return reader.size(-1);
        if (button.dataset.action === "bigger") return reader.size(1);
      });
      return value;
    },
    toolbarButton() {
      const value = document.createElement("a");
      value.id = reader.button;
      value.href = "#";
      value.className = "hide-if-no-js wp-switch-editor";
      value.textContent = "📱";
      value.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          event.stopPropagation();
          reader.enable();
        },
        true,
      );
      return value;
    },
    buttonNode() {
      const tools = document.querySelector("#wp-content-editor-tools");
      const html = document.querySelector("#content-html");
      if (!tools) return;
      tools.insertBefore(reader.toolbarButton(), html || tools.firstChild);
    },
    removeEntry() {
      document.getElementById(reader.button)?.remove();
    },
    bind(value) {
      let raf = null;
      let timer = null;
      const resize = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = null;
          reader.resize();
        });
      };
      const save = () => {
        clearTimeout(timer);
        timer = setTimeout(() => reader.save(), 150);
      };
      if (!reader.phone()) {
        const escape = (event) => {
          if (event.key !== "Escape") return;
          reader.exit();
        };
        reader.listen(window, "keydown", escape);
      }
      reader.listen(window, "resize", resize);
      reader.listen(window, "orientationchange", resize);
      reader.listen(value, "scroll", save);
      reader.listen(value, "keyup", save);
      reader.listen(value, "mouseup", save);
      if (!window.visualViewport) return;
      reader.listen(window.visualViewport, "resize", resize);
      reader.listen(window.visualViewport, "scroll", resize);
    },
    install() {
      if (!document.getElementById(`${reader.button}-style`)) {
        document.head.appendChild(
          reader.style(`${reader.button}-style`, reader.installCss()),
        );
      }
      if (!document.getElementById(reader.button)) reader.buttonNode();
    },
    enable() {
      const value = reader.content();
      if (!value) return;
      frame.ensureStyles();
      reader.html();
      reader.snapshot();
      reader.removeEntry();
      document.getElementById(reader.id)?.remove();
      document.getElementById(reader.panel)?.remove();
      document.body.classList.add("onliner-reader-active");
      document.head.appendChild(reader.style(reader.id, reader.css()));
      document.body.appendChild(reader.node());
      const bottom = document.createElement("div");
      bottom.id = `${reader.panel}-bottom`;
      document.body.appendChild(bottom);
      window.onlinerReaderExit = () => reader.exit();
      window.onlinerMobileExit = () => reader.exit();
      reader.bind(value);
      reader.resize();
      reader.restore();
      if (!reader.state().scroll) value.scrollTop = 0;
      value.focus();
    },
    disable(focus) {
      const style = document.getElementById(reader.id);
      const panel = document.getElementById(reader.panel);
      document.getElementById(`${reader.panel}-bottom`)?.remove();
      const value = reader.content();
      reader.save();
      reader.unlisten();
      reader.reset();
      if (style) style.remove();
      if (panel) panel.remove();
      document.body.classList.remove("onliner-reader-active");
      document.body.classList.remove("onliner-mobile-active");
      document.documentElement.style.removeProperty("--reader-scrollbar-gap");
      delete window.onlinerReader;
      delete window.onlinerReaderExit;
      delete window.onlinerMobile;
      delete window.onlinerMobileExit;
      reader.install();
      if (focus && value) value.focus();
    },
    run() {
      if (reader.active()) return reader.exit();
      if (document.getElementById(reader.button)) return reader.enable();
      reader.install();
      reader.enable();
    },
  };
  reader.run();
})();
