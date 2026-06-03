const app = {
  title: document.title,
  currentScope: null,
  modeStorageKey: "bookmarklet-mode",
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
    available() {
      if (app.mode.onGithubPages()) return ["github"];
      return app.mode.all;
    },
    read() {
      const value = localStorage.getItem(app.modeStorageKey);
      return app.mode.available().includes(value) ? value : app.mode.fallback;
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
      const url = new URL(location.href);
      const auth = url.username || url.password
        ? `${url.username}${url.password ? `:${url.password}` : ""}@`
        : "";
      return `${url.protocol}//${auth}localhost${url.port ? `:${url.port}` : ""}`;
    },
    local(card) {
      const scriptPath = card.getAttribute("data-href-local-script") || "";
      if (!scriptPath) return "";
      const scriptUrl = `${app.mode.localBase()}${scriptPath}`;
      if (card.id === "launcher") {
        return `javascript:(()=>{const root=document.head||document.body||document.documentElement;const u="${scriptUrl}?t="+Date.now();const p=u.replace(/^https:\\/\\//i,"http://");const s=document.createElement("script");s.src=u;s.onerror=()=>{if(p!==u){const f=document.createElement("script");f.src=p;f.onerror=()=>alert("🛑 Launcher: "+u);root.append(f);return;}alert("🛑 Launcher: "+u)};root.append(s)})()`;
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
      const button = app.node.modeSwitch();
      if (!button) return;
      const next = app.mode.next(value);
      button.innerHTML = `<img class="mode-icon" src="${app.mode.icon[value]}" alt="${app.mode.labels[value]}" />`;
      button.setAttribute("data-mode", value);
      button.setAttribute("data-icon", value);
      button.removeAttribute("title");
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
      app.node.cards().forEach((card) => {
        card.addEventListener("click", app.card.click);
      });
    },
  },
  run() {
    app.card.bind();
    app.mode.bind();
    app.scope.render();
    window.addEventListener("hashchange", app.scope.render);
  },
};
app.run();
