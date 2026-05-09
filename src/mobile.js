(() => {
  const mobile = {
    id: "onliner-mobile-content",
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
    active() {
      return Boolean(document.getElementById(mobile.id));
    },
    state() {
      return {
        scroll: Number(localStorage.getItem(mobile.key("scroll")) || 0),
        start: Number(localStorage.getItem(mobile.key("start")) || 0),
        end: Number(localStorage.getItem(mobile.key("end")) || 0),
      };
    },
    html() {
      const value = document.querySelector("#content-html");
      if (value && window.switchEditors) window.switchEditors.switchto(value);
    },
    screen() {
      const viewport = window.visualViewport;
      if (!viewport) {
        return {
          width: window.innerWidth,
          height: window.innerHeight,
          offsetLeft: 0,
          offsetTop: 0,
        };
      }
      return {
        width: viewport.width,
        height: viewport.height,
        offsetLeft: viewport.offsetLeft,
        offsetTop: viewport.offsetTop,
      };
    },
    css() {
      return `
html,body,#wpwrap,#wpcontent,#wpbody,#wpbody-content,.wrap,#post,#poststuff,#post-body,#post-body-content,#postdivrich,#wp-content-wrap,#wp-content-editor-container{margin:0!important;padding:0!important;width:100%!important;max-width:none!important;height:auto!important;overflow:visible!important}
#adminmenuback,#adminmenuwrap,#wpadminbar,#screen-meta,#screen-meta-links,#titlediv,.hndle,.title-preview,#postbox-container-1,#postbox-container-2,#wp-content-editor-tools,#ed_toolbar{display:none!important}
#content{position:fixed!important;left:0!important;top:0!important;z-index:999999!important;width:100vw!important;height:100vh!important;min-height:0!important;box-sizing:border-box!important;padding:16px 16px 100px!important;border:0!important;border-radius:0!important;outline:none!important;resize:none!important;background:#fff!important;color:#111!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;font-size:18px!important;line-height:1.45!important;white-space:pre-wrap!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;touch-action:manipulation!important;-webkit-text-size-adjust:100%!important}
#${mobile.panel}{position:fixed!important;right:10px!important;bottom:10px!important;z-index:1000000!important;display:flex!important;gap:6px!important;padding:6px!important;border-radius:14px!important;background:rgba(30,30,30,.72)!important;-webkit-backdrop-filter:blur(8px)!important;backdrop-filter:blur(8px)!important}
#${mobile.panel} button{width:38px!important;height:38px!important;border:0!important;border-radius:10px!important;background:#fff!important;color:#111!important;font:17px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important}
`;
    },
    style() {
      const value = document.createElement("style");
      value.id = mobile.id;
      value.textContent = mobile.css();
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
    resize() {
      const value = mobile.content();
      const panel = document.getElementById(mobile.panel);
      const screen = mobile.screen();
      if (!value) return;
      const landscape = screen.width > screen.height;
      const width = Math.min(screen.width * 0.94, screen.width);
      const left = screen.offsetLeft + (screen.width - width) / 2;
      const padding = Math.max(14, Math.min(screen.width * 0.035, 38));
      const bottom = Math.max(88, padding * 4);
      const size = Math.max(
        16,
        Math.min(screen.width / (landscape ? 42 : 28), landscape ? 18 : 23),
      );
      value.style.left = `${left}px`;
      value.style.top = `${screen.offsetTop}px`;
      value.style.width = `${width}px`;
      value.style.height = `${screen.height}px`;
      value.style.padding = `${padding}px ${padding}px ${bottom}px`;
      value.style.fontSize = `${size}px`;
      value.style.lineHeight = landscape ? "1.35" : "1.48";
      if (!panel) return;
      panel.style.left = "auto";
      panel.style.right = `${Math.max(10, screen.offsetLeft + 10)}px`;
      panel.style.bottom = `${Math.max(10, window.innerHeight - screen.offsetTop - screen.height + 10)}px`;
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
    move(step) {
      const value = mobile.content();
      if (!value) return;
      value.scrollTop = Math.max(0, value.scrollTop + step);
      mobile.save();
      value.focus();
    },
    panelNode() {
      const value = document.createElement("div");
      value.id = mobile.panel;
      value.innerHTML = `<button type="button" data-action="up">↑</button><button type="button" data-action="down">↓</button><button type="button" data-action="keyboard">⌨</button><button type="button" data-action="exit">×</button>`;
      value.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) return;
        const action = button.dataset.action;
        if (action === "up") mobile.move(-window.innerHeight * 0.7);
        if (action === "down") mobile.move(window.innerHeight * 0.7);
        if (action === "keyboard") mobile.content()?.focus();
        if (action === "exit") mobile.disable(true);
      });
      return value;
    },
    bind(value) {
      const resize = () => mobile.resize();
      const save = () => mobile.save();
      mobile.listen(window, "resize", resize);
      mobile.listen(window, "orientationchange", resize);
      mobile.listen(value, "scroll", save);
      mobile.listen(value, "keyup", save);
      mobile.listen(value, "mouseup", save);
      if (!window.visualViewport) return;
      mobile.listen(window.visualViewport, "resize", resize);
      mobile.listen(window.visualViewport, "scroll", resize);
    },
    enable() {
      const value = mobile.content();
      if (!value) return;
      mobile.html();
      document.head.appendChild(mobile.style());
      document.body.appendChild(mobile.panelNode());
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
      if (style) style.remove();
      if (panel) panel.remove();
      if (focus && value) value.focus();
    },
    run() {
      if (mobile.active()) return mobile.disable(true);
      mobile.enable();
    },
  };
  mobile.run();
})();
