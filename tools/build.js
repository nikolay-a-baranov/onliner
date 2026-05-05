const fs = require("fs");
const path = require("path");

const build = {
  root: path.resolve(__dirname, ".."),
  title: "Букмарклеты Onlíner",

  file: {
    src(id) {
      return path.join(build.root, "src", `${id}.js`);
    },
    html() {
      return path.join(build.root, "index.html");
    },
    template() {
      return path.join(build.root, "template.html");
    },
    list() {
      return path.join(build.root, "bookmarklets.json");
    },
  },

  config: {
    compact: new Set(["sanitize"]),
    copy: "href",
  },

  read(file) {
    return fs.readFileSync(file, "utf8");
  },

  write(file, string) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, string, "utf8");
  },

  unwrap(string) {
    const match = string.match(/^\s*\(\(\)\s*=>\s*\{([\s\S]*)\}\)\(\);?\s*$/);
    return match ? match[1].trim() : string;
  },

  bundle(file, seen = new Set(), entry = false) {
    const full = path.resolve(file);
    if (seen.has(full)) return "";
    seen.add(full);

    let string = build.read(full);
    let deps = "";

    string = string.replace(
      /^\s*import\s+\{[^}]+\}\s+from\s+["'](.+?)["'];?\s*$/gm,
      (_, rel) => {
        deps +=
          build.bundle(path.resolve(path.dirname(full), rel), seen) + "\n";
        return "";
      },
    );

    string = string
      .replace(/^\s*export\s+const\s+/gm, "const ")
      .replace(/^\s*export\s+\{[^}]+\};?\s*$/gm, "");

    if (entry) string = build.unwrap(string);

    return deps + string;
  },

  escape(string) {
    return string
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  },

  clean(string) {
    return string
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|\n)\s*\/\/.*(?=\n|$)/g, "$1")
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  },

  compact(string) {
    return string
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
    const string = build.clean(`(()=>{${source}})();`);
    return build.config.compact.has(id) ? build.compact(string) : string;
  },

  href(id, script) {
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
    if (!item.scope) return [];
    return Array.isArray(item.scope) ? item.scope : [item.scope];
  },

  card(item) {
    const file = build.file.src(item.id);

    if (!fs.existsSync(file)) {
      throw new Error(`Missing file: src/${item.id}.js`);
    }

    const source = build.bundle(file, new Set(), true);
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

  cardsByScope(cards, scope) {
    return cards.filter((card) => card.scope.includes(scope));
  },

  grid(cards) {
    return cards
      .map(
        (card) =>
          `<a class="card" id="${card.id}" href="${card.href}" data-copy="${card.copy}"${card.code ? ` data-code="${card.code}"` : ""} draggable="true">${card.icon}</a>`,
      )
      .join("\n");
  },

  nav() {
    const links = [
      { icon: "🗂️", label: "Все", scope: "all", visible: true },
      ...Object.entries(build.scope()).map(([scope, meta]) => ({
        ...meta,
        scope,
      })),
    ];

    return links
      .map(({ icon, label, scope, visible }) => {
        const hidden = visible === false ? ` data-visible="false"` : "";
        return `<a class="nav-link" href="#${scope}" data-scope-link="${scope}"${hidden}>${icon} ${label}</a>`;
      })
      .join("\n");
  },

  section(scope, title, cards) {
    if (!cards.length) return "";
    return `<section class="scope-block" data-scope-section="${scope}">
  <h2 class="scope-title">${title}</h2>
  <section class="grid">
<!-- prettier-ignore-start -->
${build.grid(cards)}
<!-- prettier-ignore-end -->
  </section>
</section>`;
  },

  main(cards) {
    const blocks = Object.entries(build.scope())
      .map(([scope, meta]) =>
        build.section(
          scope,
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

  html(cards) {
    return build
      .read(build.file.template())
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${build.title}</title>`)
      .replace(/<main>[\s\S]*?<\/main>/, build.main(cards));
  },

  removeScopePages() {
    const dir = path.join(build.root, "scope");
    if (!fs.existsSync(dir)) return;
    fs.rmSync(dir, { recursive: true, force: true });
  },

  run() {
    const cards = build.cards();
    build.write(build.file.html(), build.html(cards));
    build.removeScopePages();
    cards.forEach((card) => console.log(`Updated: ${card.id}`));
  },
};

try {
  build.run();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
