const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

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
    loadersDir() {
      return path.join(build.path.distDir(), "loaders");
    },
    loader(id) {
      return path.join(build.path.loadersDir(), `${id}.js`);
    },
    manifest() {
      return path.join(build.path.distDir(), "manifest.json");
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
    const loaderUrl = `${build.config.publish.baseUrl}/${build.config.publish.distPath}/loaders/${id}.js`;
    const scriptUrl = `${build.config.publish.baseUrl}/${build.config.publish.distPath}/${id}.js`;
    return `javascript:(()=>{const root=(document.head||document.body||document.documentElement);const u='${loaderUrl}?t='+Date.now();const s=document.createElement('script');s.src=u;s.onerror=()=>{const f='${scriptUrl}?v='+Date.now();const n=document.createElement('script');n.src=f;n.onerror=()=>alert('Bookmarklet script failed: '+f);root.append(n)};root.append(s)})()`;
  },
  launcher() {
    const url = `${build.config.publish.baseUrl}/${build.config.publish.distPath}/launcher.js`;
    return `javascript:(()=>{const root=(document.head||document.body||document.documentElement);const u='${url}?t='+Date.now();const s=document.createElement('script');s.src=u;s.onerror=()=>alert('Bookmarklet launcher failed: '+u);root.append(s)})()`;
  },
  loaderScript(id, version) {
    const url = `${build.config.publish.baseUrl}/${build.config.publish.distPath}/${id}.js`;
    return `(()=>{const u='${url}?v=${version}';const s=document.createElement('script');s.src=u;s.onerror=()=>alert('Bookmarklet script failed: '+u);(document.head||document.body||document.documentElement).append(s)})();`;
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
    const hrefJs = build.href(script);
    const code = build.config.copy === "plain" ? build.escape(build.code(script)) : "";
    return {
      id: item.id,
      iconText: item.icon || "🔖",
      icon: build.emoji.html(item.icon || "🔖"),
      ok: build.emoji.html("✅"),
      fail: build.emoji.html("❌"),
      hrefJs,
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
          `<a class="card" id="${card.id}" href="${build.escape(card.hrefGh)}" title="${build.escape(`${card.iconText} ${card.id}`)}" data-bookmark-label="${build.escape(`${card.iconText} ${card.id}`)}" data-ok-html="${build.escape(card.ok)}" data-fail-html="${build.escape(card.fail)}" data-copy="${card.copy}" data-href-js="${build.escape(card.hrefJs)}" data-href-gh="${build.escape(card.hrefGh)}" data-href-local-loader="/${build.config.publish.distPath}/loaders/${card.id}.js" data-href-local-script="/${build.config.publish.distPath}/${card.id}.js"${card.code ? ` data-code="${card.code}"` : ""} draggable="true">${card.icon}</a>`,
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
    <button type="button" class="mode-button" data-mode-switch title="GitHub mode needs internet and access to GitHub Pages">GH</button>
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
    fs.mkdirSync(build.path.loadersDir(), { recursive: true });
    cards.forEach(({ id }) => {
      const file = build.path.dist(id);
      if (fs.existsSync(file)) fs.rmSync(file);
      const loader = build.path.loader(id);
      if (fs.existsSync(loader)) fs.rmSync(loader);
    });
  },
  hash(string) {
    return crypto.createHash("sha256").update(string, "utf8").digest("hex");
  },
  now() {
    const date = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
      pad(date.getHours()),
      pad(date.getMinutes()),
      pad(date.getSeconds()),
    ].join("");
  },
  manifest() {
    const file = build.path.manifest();
    if (!fs.existsSync(file)) return {};
    return JSON.parse(build.read(file));
  },
  version(id, script, current, nextVersion) {
    const file = `${id}.js`;
    const hash = build.hash(script + "\n");
    const prev = current[file];
    const version = prev && prev.hash === hash ? prev.version : nextVersion;
    return { hash, version };
  },
  publish(cards) {
    build.cleanDist(cards);
    const current = build.manifest();
    const nextVersion = build.now();
    const manifest = {};
    cards.forEach(({ id, script }) => {
      build.write(build.path.dist(id), script + "\n");
      manifest[`${id}.js`] = build.version(id, script, current, nextVersion);
    });
    build.write(build.path.manifest(), `${JSON.stringify(manifest, null, 2)}\n`);
    cards.forEach(({ id }) => {
      const file = `${id}.js`;
      const version = manifest[file]?.version || nextVersion;
      const loader = build.loaderScript(id, version);
      build.write(build.path.loader(id), loader + "\n");
    });
    return manifest;
  },
  link(cards, manifest) {
    return cards.map((card) => {
      const hrefGh = card.id === "launcher" ? build.launcher() : build.loader(card.id);
      return {
        ...card,
        hrefGh,
      };
    });
  },
  run() {
    const cards = build.cards();
    const manifest = build.publish(cards);
    const linked = build.link(cards, manifest);
    build.write(build.path.html(), build.html(linked));
    build.removeScopePages();
    linked.forEach((card) => console.log(`Updated: ${card.id}`));
  },
  watch() {
    const roots = [
      path.join(build.root, "src"),
      build.path.bookmarklets(),
      build.path.template(),
    ];
    let timer = null;
    const rebuild = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        try {
          build.run();
        } catch (error) {
          console.error(error);
        }
      }, 120);
    };
    rebuild();
    roots.forEach((root) => {
      fs.watch(root, { recursive: true }, (_, file) => {
        const name = file ? String(file) : "";
        if (name.includes(`${path.sep}dist${path.sep}`)) return;
        if (name.endsWith(".tmp")) return;
        rebuild();
      });
    });
    console.log("Watching: src, bookmarklets.json, template.html");
  },
};

try {
  if (process.argv.includes("--watch")) build.watch();
  else build.run();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
