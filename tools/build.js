const fs = require("fs");
const path = require("path");

const build = {
  root: path.resolve(__dirname, ".."),
  title: "Букмарклеты Onlíner",
  path: {
    src(id) {
      return path.join(build.root, "src", `${id}.js`);
    },
    html() {
      return path.join(build.root, "index.html");
    },
    distDir() {
      return path.join(build.root, build.config.publish.distPath);
    },
    dist(id) {
      return path.join(build.path.distDir(), `${id}.js`);
    },
    template() {
      return path.join(build.root, "template.html");
    },
    bookmarklets() {
      return path.join(build.root, "bookmarklets.json");
    },
    emoji() {
      return path.join(build.root, "src", "core", "emoji.js");
    },
  },
  config: {
    compact: new Set(["sanitize"]),
    copy: "href",
    publish: {
      baseUrl: "https://nikolay-a-baranov.github.io/onliner-bookmarklets",
      distPath: "dist",
    },
  },
  emoji: {
    cache: null,
    load() {
      if (build.emoji.cache) return build.emoji.cache;
      const source = build
        .read(build.path.emoji())
        .replace(/^\s*export\s+const\s+emoji\s*=\s*/m, "const emoji = ");
      const emoji = new Function(`${source}\nreturn emoji;`)();
      build.emoji.cache = emoji;
      return emoji;
    },
    html(value) {
      return build.emoji.load().html(value);
    },
  },
  guard: {
    mojibake(id, string) {
      const match = string.match(/[ÐÑÂâÃ][\u0080-\uFFFF]{0,80}/u);
      if (!match) return;
      throw new Error(`🆘 mojibake in "${id}": ${JSON.stringify(match[0])}`);
    },
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
        deps += build.bundle(path.resolve(path.dirname(full), rel), seen) + "\n";
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
  encode(script) {
    return Buffer.from(script, "utf8").toString("base64");
  },
  href(script) {
    const base64 = build.encode(script);
    return `javascript:(()=>{const s=atob("${base64}");const u=Uint8Array.from(s,c=>c.charCodeAt(0));(0,eval)(new TextDecoder().decode(u));})();`;
  },
  loader(id) {
    const url = `${build.config.publish.baseUrl}/${build.config.publish.distPath}/${id}.js`;
    return `javascript:(()=>{const s=document.createElement('script');s.src='${url}?v='+Date.now();document.body.append(s)})()`;
  },
  code(script) {
    return "javascript:" + script;
  },
  data() {
    const value = JSON.parse(build.read(build.path.bookmarklets()));
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
    const file = build.path.src(item.id);
    if (!fs.existsSync(file)) {
      throw new Error(`Missing file: src/${item.id}.js`);
    }
    const source = build.bundle(file, new Set(), true);
    const script = build.script(item.id, source);
    build.guard.mojibake(item.id, script);
    const href = build.escape(build.loader(item.id));
    const code = build.config.copy === "plain" ? build.escape(build.code(script)) : "";
    return {
      id: item.id,
      iconText: item.icon || "🔖",
      icon: build.emoji.html(item.icon || "🔖"),
      ok: build.emoji.html("✅"),
      fail: build.emoji.html("❌"),
      href,
      copy: build.config.copy,
      code,
      scope: build.scopes(item),
      script,
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
          `<a class="card" id="${card.id}" href="${card.href}" title="${build.escape(`${card.iconText} ${card.id}`)}" data-bookmark-label="${build.escape(`${card.iconText} ${card.id}`)}" data-ok-html="${build.escape(card.ok)}" data-fail-html="${build.escape(card.fail)}" data-copy="${card.copy}"${card.code ? ` data-code="${card.code}"` : ""} draggable="true">${card.icon}</a>`,
      )
      .join("\n");
  },
  nav() {
    const links = [
      { icon: "🌌", label: "Все", scope: "all", visible: true },
      ...Object.entries(build.scope()).map(([scope, meta]) => ({
        ...meta,
        scope,
      })),
    ];
    return links
      .map(({ icon, label, scope, visible }) => {
        const hidden = visible === false ? ` data-visible="false"` : "";
        const text = build.emoji.html(`${icon} ${label}`);
        return `<a class="nav-link" href="#${scope}" data-scope-link="${scope}"${hidden}>${text}</a>`;
      })
      .join("\n");
  },
  section(scope, title, cards, visible = true) {
    if (!cards.length) return "";
    const hidden = visible === false ? ` data-visible="false"` : "";
    return `<section class="scope-block" data-scope-section="${scope}"${hidden}>
  <h2 class="scope-title">${build.emoji.html(title)}</h2>
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
          meta.visible,
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
      .read(build.path.template())
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${build.title}</title>`)
      .replace(/<main>[\s\S]*?<\/main>/, build.main(cards));
  },
  removeScopePages() {
    const dir = path.join(build.root, "scope");
    if (!fs.existsSync(dir)) return;
    fs.rmSync(dir, { recursive: true, force: true });
  },
  cleanDist(cards) {
    fs.mkdirSync(build.path.distDir(), { recursive: true });
    cards.forEach(({ id }) => {
      const file = build.path.dist(id);
      if (fs.existsSync(file)) fs.rmSync(file);
    });
  },
  publish(cards) {
    build.cleanDist(cards);
    cards.forEach(({ id, script }) => {
      build.write(build.path.dist(id), script + "\n");
    });
  },
  run() {
    const cards = build.cards();
    build.write(build.path.html(), build.html(cards));
    build.publish(cards);
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
