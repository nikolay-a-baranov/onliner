const app = {
  title: document.title,
  currentScope: null,
  modeStorageKey: "bookmarklet-mode",
  guideStyleStorageKey: "bookmarklet-guide-style",
  localBaseStorageKey: "bookmarklet-local-base",
  defaultLocalBase: "https://192.168.31.112:5500",
  node: {
    sections() {
      return [...document.querySelectorAll("[data-scope-section]")];
    },
    links() {
      return [...document.querySelectorAll("[data-scope-link]")];
    },
    cards() {
      return [...document.querySelectorAll(".card")];
    },
    modeSwitch() {
      return document.querySelector("[data-mode-switch]");
    },
  },
  guide: {
    allowed: ["plain", "sheet"],
    query() {
      const url = new URL(location.href);
      return (url.searchParams.get("guide") || "").trim().toLowerCase();
    },
    read() {
      const value =
        app.guide.query() ||
        localStorage.getItem(app.guideStyleStorageKey) ||
        "sheet";
      return app.guide.allowed.includes(value) ? value : "sheet";
    },
    apply(value) {
      if (value === "sheet") {
        document.body.setAttribute("data-guide-style", "sheet");
        return;
      }
      document.body.removeAttribute("data-guide-style");
    },
    bind() {
      const value = app.guide.read();
      localStorage.setItem(app.guideStyleStorageKey, value);
      app.guide.apply(value);
    },
  },
  platform: {
    target(code = "") {
      const source = String(code || "");
      const quoted = source.match(/const u=["']([^"']+)["']/);
      if (quoted?.[1]) return quoted[1];
      const fallback = source.match(/const f=["']([^"']+)["']/);
      return fallback?.[1] || "";
    },
  },
  mode: {
    all: ["javascript", "github", "local"],
    fallback: "javascript",
    labels: {
      github: "GIT",
      javascript: "JAV",
      local: "LOC",
    },
    icon: {
      github: "https://api.iconify.design/simple-icons:github.svg",
      javascript: "https://api.iconify.design/logos:javascript.svg",
      local:
        "https://cdn.jsdelivr.net/gh/devicons/devicon@v2.17.0/icons/devicon/devicon-original.svg",
    },
    onGithubPages() {
      return /\.github\.io$/i.test(location.hostname);
    },
    localQuery() {
      const url = new URL(location.href);
      return (
        url.searchParams.get("local-base") ||
        url.searchParams.get("local") ||
        ""
      ).trim();
    },
    localLike(host = "") {
      return (
        host === "localhost" ||
        host === "127.0.0.1" ||
        /\.local$/i.test(host) ||
        /^10\./.test(host) ||
        /^192\.168\./.test(host) ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
      );
    },
    localOverride() {
      const current = app.mode.localQuery() ||
        localStorage.getItem(app.localBaseStorageKey) ||
        "";
      if (!current) return "";
      try {
        const base = current.includes("://")
          ? current
          : `${location.protocol}//${current}`;
        const url = new URL(base);
        localStorage.setItem(app.localBaseStorageKey, url.origin);
        return url.origin;
      } catch {
        return "";
      }
    },
    available() {
      if (app.mode.onGithubPages()) return ["github"];
      return app.mode.all;
    },
    preferred() {
      if (app.mode.onGithubPages()) return "github";
      if (app.mode.localOverride()) return "local";
      if (app.mode.localLike(location.hostname)) return "local";
      return app.mode.fallback;
    },
    read() {
      const preferred = app.mode.preferred();
      const value = localStorage.getItem(app.modeStorageKey) || "";
      if (!app.mode.available().includes(value)) return preferred;
      if (preferred === "github" && value !== "github") return preferred;
      return value;
    },
    save(value) {
      localStorage.setItem(app.modeStorageKey, value);
    },
    next(value) {
      const list = app.mode.available();
      const index = list.indexOf(value);
      return list[(index + 1) % list.length];
    },
    localBase() {
      const override = app.mode.localOverride();
      if (override) return override;
      return app.defaultLocalBase;
    },
    local(card) {
      const scriptPath = card.getAttribute("data-href-local-script") || "";
      if (!scriptPath) return "";
      const scriptUrl = `${app.mode.localBase()}${scriptPath}`;
      if (card.id === "launchpad") {
        return `javascript:(()=>{const root=document.head||document.body||document.documentElement;const u="${scriptUrl}?t="+Date.now();const p=u.replace(/^https:\\/\\//i,"http://");const s=document.createElement("script");s.src=u;s.onerror=()=>{if(p!==u){const f=document.createElement("script");f.src=p;f.onerror=()=>alert("🛑 Launchpad: "+u);root.append(f);return;}alert("🛑 Launchpad: "+u)};root.append(s)})()`;
      }
      return `javascript:(()=>{const root=document.head||document.body||document.documentElement;const u="${scriptUrl}?v="+Date.now();const p=u.replace(/^https:\\/\\//i,"http://");const s=document.createElement("script");s.src=u;s.onerror=()=>{if(p!==u){const f=document.createElement("script");f.src=p;f.onerror=()=>alert("🛑 Script: "+u);root.append(f);return;}alert("🛑 Script: "+u)};root.append(s)})()`;
    },
    href(card, mode) {
      if (mode === "local") return app.mode.local(card);
      const key = mode === "github" ? "data-href-gh" : "data-href-js";
      return card.getAttribute(key) || "";
    },
    render(value) {
      app.node.cards().forEach((card) => {
        const href = app.mode.href(card, value);
        if (href) card.setAttribute("href", href);
      });
      app.card.syncTitle(value);
      const button = app.node.modeSwitch();
      if (!button) return;
      const next = app.mode.next(value);
      button.innerHTML = `<img class="mode-icon" src="${app.mode.icon[value]}" alt="${app.mode.labels[value]}" />`;
      button.setAttribute("data-mode", value);
      button.setAttribute("data-icon", value);
      button.setAttribute(
        "title",
        `Режим: ${app.mode.labels[value]}. Нажми для ${app.mode.labels[next]}.`,
      );
      button.setAttribute("aria-label", button.getAttribute("title") || "");
    },
    toggle() {
      const current = app.mode.read();
      const next = app.mode.next(current);
      app.mode.save(next);
      app.mode.render(next);
    },
    bind() {
      app.mode.render(app.mode.read());
      const button = app.node.modeSwitch();
      if (!button) return;
      button.addEventListener("click", app.mode.toggle);
    },
  },
  scope: {
    get() {
      const string = location.hash.replace(/^#/, "").trim();
      if (!string) return "all";
      const known = new Set(
        app.node
          .sections()
          .map((section) => section.getAttribute("data-scope-section")),
      );
      return known.has(string) ? string : "all";
    },
    label(scope) {
      if (scope === "all") return "";
      const link = document.querySelector(`[data-scope-link="${scope}"]`);
      return link ? link.textContent.trim() : "";
    },
    render() {
      const scope = app.scope.get();
      let first = true;
      app.node.sections().forEach((section) => {
        const current = section.getAttribute("data-scope-section");
        const enabled = section.getAttribute("data-visible") !== "false";
        const visible = scope === "all" ? enabled : current === scope;
        section.hidden = !visible;
        if (visible && first) {
          section.setAttribute("data-first-visible", "true");
          first = false;
        } else {
          section.removeAttribute("data-first-visible");
        }
      });
      app.node.links().forEach((link) => {
        const current = link.getAttribute("data-scope-link");
        const visible = link.getAttribute("data-visible") !== "false";
        link.classList.toggle("current", current === scope);
        link.hidden = !visible && current !== scope;
      });
      const label = app.scope.label(scope);
      document.title = label ? `${label} · ${app.title}` : app.title;
      if (app.currentScope !== null && app.currentScope !== scope) {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
      app.currentScope = scope;
    },
  },
  card: {
    launchpadTitle() {
      return `🎛️ Зажми ЛКМ, дотяни до панели закладок (под адресной строкой, если не видно, жмать ${app.platform.bookmarkBarShortcut()}) и отпусти`;
    },
    title(card, mode = app.mode.read()) {
      if (!card) return "";
      if (mode === "javascript") return "javascript:(...)";
      if (mode === "local") {
        const path = card.getAttribute("data-href-local-script") || "";
        return path ? `${app.mode.localBase()}${path}` : "javascript:(...)";
      }
      const target = app.platform.target(card.getAttribute("data-href-gh") || "");
      return target || "javascript:(...)";
    },
    syncTitle(mode = app.mode.read()) {
      app.node.cards().forEach((card) => {
        const title = app.card.title(card, mode);
        if (!title) return;
        card.setAttribute("title", title);
      });
    },
    code(card) {
      const mode = card.getAttribute("data-copy") || "href";
      if (mode === "plain") {
        const code = card.getAttribute("data-code") || "";
        if (code.startsWith("javascript:")) return code;
      }
      const href = card.getAttribute("href") || "";
      return href.startsWith("javascript:") ? href : "";
    },
    async copy(string) {
      try {
        await navigator.clipboard.writeText(string);
        return true;
      } catch {
        const area = document.createElement("textarea");
        area.value = string;
        area.style.position = "fixed";
        area.style.left = "-9999px";
        area.style.top = "0";
        document.body.appendChild(area);
        area.focus();
        area.select();
        area.setSelectionRange(0, area.value.length);
        const done = document.execCommand("copy");
        area.remove();
        return done;
      }
    },
    async click(event) {
      event.preventDefault();
      const card = event.currentTarget;
      const code = app.card.code(card);
      if (!code) return;
      const done = await app.card.copy(code);
      const icon = card.innerHTML;
      const ok = card.getAttribute("data-ok-html") || "✅";
      const fail = card.getAttribute("data-fail-html") || "❌";
      card.innerHTML = done ? ok : fail;
      setTimeout(() => {
        card.innerHTML = icon;
      }, 700);
    },
    bind() {
      app.card.syncTitle();
      app.node.cards().forEach((card) => {
        card.addEventListener("click", app.card.click);
      });
    },
  },
  run() {
    app.guide.bind();
    app.card.bind();
    app.mode.bind();
    app.scope.render();
    window.addEventListener("hashchange", app.scope.render);
  },
};
app.run();
