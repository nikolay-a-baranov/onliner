import { frame } from "./core/panel.js";
import { toolbar } from "./core/toolbar.js";
import { emoji } from "./core/emoji.js";
import { css } from "./core/css.js";

(() => {
  const session = {
    names: ["Reader", "Mobile"],
    keys() {
      return session.names.flatMap((name) => [
        `onliner${name}`,
        `onliner${name}Exit`,
      ]);
    },
    clear() {
      session.keys().forEach((key) => delete window[key]);
    },
  };
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
    session.clear();
    return;
  }
  session.clear();
  const reader = {
    layout: {
      breakpoint: {
        phoneMaxShortEdge: 768,
      },
      padding: {
        top: {
          desktop: 80,
          phone: 16,
          tablet: 22,
        },
        side: {
          touch: 16,
          desktop: 12,
        },
        bottom: {
          desktop: 38,
          touch: 86,
        },
      },
      panel: {
        height: {
          touch: 52,
          desktop: 64,
        },
        inset: 12,
      },
    },
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
    touch() {
      const agent = navigator.userAgent || "";
      if (/Windows NT/.test(agent)) {
        return false;
      }
      if (
        /iPad|iPhone|iPod/.test(agent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
      ) {
        return true;
      }
      return (
        window.matchMedia?.("(pointer: coarse)")?.matches ||
        navigator.maxTouchPoints > 0
      );
    },
    phone() {
      const screen = reader.screen();
      const short = Math.min(screen.width, screen.height);
      return (
        reader.touch() && short <= reader.layout.breakpoint.phoneMaxShortEdge
      );
    },
    tablet() {
      const screen = reader.screen();
      const short = Math.min(screen.width, screen.height);
      return (
        reader.touch() && short > reader.layout.breakpoint.phoneMaxShortEdge
      );
    },
    desktop() {
      return !reader.touch();
    },
    mode() {
      if (reader.desktop()) return "desktop";
      if (reader.phone()) return "phone";
      return "tablet";
    },
    profile() {
      const mode = reader.mode();
      const touch = mode !== "desktop";
      const keyboard = touch ? reader.keyboard() : 0;
      const topPadding = {
        desktop: reader.layout.padding.top.desktop,
        phone: reader.layout.padding.top.phone,
        tablet: reader.layout.padding.top.tablet,
      }[mode];
      return {
        mode,
        touch,
        keyboard,
        padding: {
          top: topPadding,
          side: touch
            ? reader.layout.padding.side.touch
            : reader.layout.padding.side.desktop,
          bottom: touch
            ? keyboard + reader.layout.padding.bottom.touch
            : reader.layout.padding.bottom.desktop,
        },
        panel: {
          height: touch
            ? reader.layout.panel.height.touch
            : reader.layout.panel.height.desktop,
          position: {
            left: touch ? `${reader.layout.panel.inset}px` : "0",
            right: touch
              ? `calc(var(--reader-scrollbar-gap,0px) + ${reader.layout.panel.inset}px)`
              : "0",
            top: "0",
            bottom: "auto",
          },
        },
      };
    },
    keyboard() {
      if (!window.visualViewport) return 0;
      return Math.max(
        0,
        window.innerHeight -
          window.visualViewport.height -
          window.visualViewport.offsetTop,
      );
    },
    state() {
      return {
        scroll: Number(localStorage.getItem(reader.key("scroll")) || 0),
        start: Number(localStorage.getItem(reader.key("start")) || 0),
        end: Number(localStorage.getItem(reader.key("end")) || 0),
      };
    },
    html() {
      const value = document.querySelector("#content-html");
      if (!value) return;
      if (!window.switchEditors || !window.switchEditors.switchto) return;
      window.switchEditors.switchto(value);
    },
    css() {
      return css.reader.text({ theme: reader.theme(), panel: reader.panel });
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
      const profile = reader.profile();
      const phone = profile.mode === "phone";
      const landscape = screen.width > screen.height;
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
        `${profile.padding.top}px ${profile.padding.side}px ${profile.padding.bottom}px`,
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
      document.documentElement.style.setProperty(
        "--reader-keyboard-gap",
        `${profile.keyboard}px`,
      );
      if (!panel) return;
      panel.style.setProperty(
        "height",
        `${profile.panel.height}px`,
        "important",
      );
      panel.style.setProperty("left", profile.panel.position.left, "important");
      panel.style.setProperty(
        "right",
        profile.panel.position.right,
        "important",
      );
      panel.style.setProperty("top", profile.panel.position.top, "important");
      panel.style.setProperty(
        "bottom",
        profile.panel.position.bottom,
        "important",
      );
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
      if (button) button.innerHTML = emoji.html(toolbar.themeToggleIcon(theme));
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
    controls(mode) {
      const smaller = `<button class="button button-emoji" type="button" data-action="smaller">${emoji.html("\u2796")}</button>`;
      const theme = `<button class="button button-emoji" type="button" data-action="theme">${emoji.html(toolbar.themeToggleIcon(reader.theme()))}</button>`;
      const bigger = `<button class="button button-emoji" type="button" data-action="bigger">${emoji.html("\u2795")}</button>`;
      if (mode === "desktop") return `${smaller}${theme}${bigger}`;
      const keyboard = `<button class="button button-emoji" type="button" data-action="keyboard">${emoji.html("\u2328\uFE0F")}</button>`;
      const exit = `<button class="button button-emoji" type="button" data-action="exit">${emoji.html("\u274C")}</button>`;
      return `${smaller}${keyboard}${theme}${bigger}${exit}`;
    },
    panelNode() {
      const value = document.createElement("div");
      const mode = reader.mode();
      value.id = reader.panel;
      value.className = "panel";
      value.dataset.uiSurface = "reader";
      value.dataset.theme = reader.theme();
      value.innerHTML = reader.controls(mode);
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
      const action = (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        reader.enable();
      };
      value.id = reader.button;
      value.href = "#";
      value.className = "hide-if-no-js wp-switch-editor";
      value.innerHTML = emoji.html("\u{1F576}\uFE0F");
      value.addEventListener("click", action, true);
      value.addEventListener("touchend", action, true);
      return value;
    },
    mountButton() {
      const tools = document.querySelector("#wp-content-editor-tools");
      const html = document.querySelector("#content-html");
      if (!tools) return;
      tools.insertBefore(reader.toolbarButton(), html || tools.firstChild);
    },
    removeButton() {
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
      if (reader.desktop()) {
        const escape = (event) => {
          if (event.key !== "Escape") return;
          reader.exit();
        };
        reader.listen(window, "keydown", escape);
      }
      reader.listen(window, "resize", resize);
      reader.listen(window, "orientationchange", resize);
      reader.listen(value, "scroll", save);
      reader.listen(value, "input", save);
      reader.listen(value, "keyup", save);
      reader.listen(value, "pointerup", save);
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
      if (!document.getElementById(reader.button)) reader.mountButton();
    },
    enable() {
      const value = reader.content();
      if (!value) return;
      frame.ensureStyles();
      reader.html();
      reader.snapshot();
      reader.removeButton();
      document.getElementById(reader.id)?.remove();
      document.getElementById(reader.panel)?.remove();
      document.body.classList.add("onliner-reader-active");
      if (!reader.desktop())
        document.body.classList.add("onliner-mobile-active");
      document.head.appendChild(reader.style(reader.id, reader.css()));
      document.body.appendChild(reader.panelNode());
      const bottom = document.createElement("div");
      bottom.id = `${reader.panel}-bottom`;
      document.body.appendChild(bottom);
      window.onlinerReaderExit = () => reader.exit();
      window.onlinerMobileExit = () => reader.exit();
      reader.bind(value);
      reader.resize();
      reader.restore();
      if (!reader.state().scroll) value.scrollTop = 0;
      if (reader.desktop()) value.focus();
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
      document.documentElement.style.removeProperty("--reader-keyboard-gap");
      session.clear();
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
