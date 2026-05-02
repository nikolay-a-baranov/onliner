const app = {
  title: document.title,
  currentScope: null,

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

  scope() {
    const string = location.hash.replace(/^#/, "").trim();
    if (!string) return "all";
    const known = new Set(
      Array.from(document.querySelectorAll("[data-scope-section]")).map((node) =>
        node.getAttribute("data-scope-section"),
      ),
    );
    return known.has(string) ? string : "all";
  },

  label(scope) {
    if (scope === "all") return "";
    const link = document.querySelector(`[data-scope-link="${scope}"]`);
    return link ? link.textContent.trim() : "";
  },

  renderScope() {
    const scope = app.scope();
    const sections = document.querySelectorAll("[data-scope-section]");
    const links = document.querySelectorAll("[data-scope-link]");
    let first = true;

    sections.forEach((section) => {
      const current = section.getAttribute("data-scope-section");
      const visible = scope === "all" || current === scope;
      section.hidden = !visible;
      if (visible && first) {
        section.setAttribute("data-first-visible", "true");
        first = false;
      } else {
        section.removeAttribute("data-first-visible");
      }
    });

    links.forEach((link) => {
      const current = link.getAttribute("data-scope-link");
      const visible = link.getAttribute("data-visible") !== "false";
      link.classList.toggle("current", current === scope);
      link.hidden = !visible && current !== scope;
    });

    const label = app.label(scope);
    document.title = label ? `${label} · ${app.title}` : app.title;

    if (app.currentScope !== null && app.currentScope !== scope) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    app.currentScope = scope;
  },

  bindCards() {
    document.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("click", async (event) => {
        event.preventDefault();
        const code = app.code(card);
        if (!code) return;
        const done = await app.copy(code);
        const icon = card.textContent;
        card.textContent = done ? "✅" : "❌";
        setTimeout(() => {
          card.textContent = icon;
        }, 700);
      });
    });
  },

  run() {
    app.bindCards();
    app.renderScope();
    window.addEventListener("hashchange", app.renderScope);
  },
};

app.run();
