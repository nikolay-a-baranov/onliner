const fs = require("fs");
const path = require("path");
const build = {
  root: path.resolve(__dirname, ".."),

  file: {
    src(id) {
      return path.join(build.root, "src", `${id}.js`);
    },
    html(name = "index") {
      return path.join(build.root, `${name}.html`);
    },
    template() {
      return path.join(build.root, "template.html");
    },
    list() {
      return path.join(build.root, "bookmarklets.json");
    },
  },

  config: {
    wrapped: new Set(["cleanup", "publish", "proofread"]),
    compact: new Set(["sanitize"]),
    copy: "href",
  },

  read(file) {
    return fs.readFileSync(file, "utf8");
  },

  write(file, value) {
    fs.writeFileSync(file, value, "utf8");
  },

  unwrap(code) {
    const match = code.match(/^\s*\(\(\)\s*=>\s*\{([\s\S]*)\}\)\(\);?\s*$/);
    return match ? match[1].trim() : code;
  },

  bundle(file, seen = new Set(), entry = false) {
    const full = path.resolve(file);
    if (seen.has(full)) return "";
    seen.add(full);

    let code = build.read(full);
    let deps = "";

    code = code.replace(
      /^\s*import\s+\{[^}]+\}\s+from\s+["'](.+?)["'];?\s*$/gm,
      (_, rel) => {
        deps +=
          build.bundle(path.resolve(path.dirname(full), rel), seen) + "\n";
        return "";
      },
    );

    code = code
      .replace(/^\s*export\s+const\s+/gm, "const ")
      .replace(/^\s*export\s+\{[^}]+\};?\s*$/gm, "");

    if (entry) code = build.unwrap(code);

    return deps + code;
  },

  escape(string) {
    return string
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  },

  clean(code) {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  },

  compact(code) {
    return code
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
      .replace(/\{\s+/g, "{")
      .replace(/\s+\}/g, "}")
      .replace(/\s+\.(?=[A-Za-z_$])/g, ".")
      .replace(/\)\s+\{/g, "){")
      .replace(/\}\s+;/g, "};")
      .replace(/:\s+/g, ":")
      .replace(/;\s+/g, ";")
      .replace(/,\s+/g, ",")
      .trim();
  },

  script(id, source) {
    const code = build.clean(`(()=>{${source}})();`);
    return build.config.compact.has(id) ? build.compact(code) : code;
  },

  href(id, script) {
    if (!build.config.wrapped.has(id)) return "javascript:" + script;
    const base64 = Buffer.from(script, "utf8").toString("base64");
    return `javascript:(()=>{const s=atob("${base64}");const u=Uint8Array.from(s,c=>c.charCodeAt(0));(0,eval)(new TextDecoder().decode(u));})();`;
  },

  code(script) {
    return "javascript:" + script;
  },

  data() {
    const value = JSON.parse(build.read(build.file.list()));
    return Array.isArray(value) ? { scope: {}, items: value } : value;
  },

  scope() {
    return build.data().scope || {};
  },

  items() {
    return build.data().items || [];
  },

  scopes(item) {
    const value = item.scope;
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  },

  card(item) {
    const jsPath = build.file.src(item.id);

    if (!fs.existsSync(jsPath)) {
      throw new Error(`Missing file: src/${item.id}.js`);
    }

    const source = build.bundle(jsPath, new Set(), true);
    const script = build.script(item.id, source);
    const href = build.escape(build.href(item.id, script));
    const code =
      build.config.copy === "plain" ? build.escape(build.code(script)) : "";

    return {
      id: item.id,
      icon: item.icon || "🔖",
      href,
      copy: build.config.copy,
      code,
      scope: build.scopes(item),
    };
  },

  cards() {
    return build.items().map((item) => build.card(item));
  },

  grid(cards) {
    return cards
      .map(
        (card) =>
          `<a class="card" id="${card.id}" href="${card.href}" data-copy="${card.copy}"${card.code ? ` data-code="${card.code}"` : ""} draggable="true">${card.icon}</a>`,
      )
      .join("\n");
  },

  cardsByScope(cards, scope) {
    return cards.filter((card) => card.scope.includes(scope));
  },

  scopeMeta(page) {
    return Object.entries(build.scope()).find(
      ([scope, meta]) => scope === page || meta.file === page,
    );
  },

  nav(current = "index") {
    const links = [
      { icon: "🗂️", label: "Все", file: "index" },
      ...Object.values(build.scope()).filter(
        (scope) => scope.visible !== false || scope.file === current,
      ),
    ];

    return links
      .map(({ icon, label, file }) => {
        const active = file === current ? "nav-link current" : "nav-link";
        return `<a class="${active}" href="${file}.html">${icon} ${label}</a>`;
      })
      .join("\n");
  },

  section(title, cards) {
    if (!cards.length) return "";
    return `<section class="scope-block">
  <h2 class="scope-title">${title}</h2>
  <section class="grid">
<!-- prettier-ignore-start -->
${build.grid(cards)}
<!-- prettier-ignore-end -->
  </section>
</section>`;
  },

  main(cards, page = "index") {
    if (page !== "index") {
      const [, scope] = build.scopeMeta(page);
      return `<main class="layout">
  <nav class="scope-nav">
${build.nav(page)}
  </nav>
  ${build.section(`${scope.icon} ${scope.label}`, cards)}
</main>`;
    }

    const blocks = Object.entries(build.scope())
      .filter(([, meta]) => meta.visible !== false)
      .map(([scope, meta]) =>
        build.section(
          `${meta.icon} ${meta.label}`,
          build.cardsByScope(cards, scope),
        ),
      )
      .filter(Boolean)
      .join("\n\n");

    return `<main class="layout">
  <nav class="scope-nav">
${build.nav()}
  </nav>
${blocks}
</main>`;
  },

  title(page = "index") {
    if (page === "index") return "Букмарклеты Onlíner";
    const [, scope] = build.scopeMeta(page);
    return `${scope.label} · Букмарклеты Onlíner`;
  },

  html(cards, page = "index") {
    const source = build.read(build.file.template());
    return source
      .replace(
        /<title>[\s\S]*?<\/title>/,
        `<title>${build.title(page)}</title>`,
      )
      .replace(/<main>[\s\S]*?<\/main>/, build.main(cards, page));
  },

  pages(cards) {
    const pages = { index: cards };
    Object.entries(build.scope()).forEach(([scope, meta]) => {
      pages[meta.file] = build.cardsByScope(cards, scope);
    });
    return pages;
  },

  run() {
    const cards = build.cards();
    Object.entries(build.pages(cards)).forEach(([page, pageCards]) => {
      build.write(build.file.html(page), build.html(pageCards, page));
    });
    cards.forEach((card) => console.log(`Updated: ${card.id}`));
  },
};

try {
  build.run();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
