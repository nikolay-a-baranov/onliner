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
      return path.join(build.root, "src", "core", "icon.js");
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
  icon: {
    cache: null,
    load() {
      if (build.icon.cache) return build.icon.cache;
      const source = build.bundle(build.path.emoji());
      const icon = new Function(`${source}\nreturn icon;`)();
      build.icon.cache = icon;
      return icon;
    },
    text(value) {
      const source = String(value || "").trim();
      if (/^favicon:/i.test(source)) return "🔖";
      return source || "🔖";
    },
    html(value) {
      const source = String(value || "").trim();
      const match = source.match(/^favicon:(.+)$/i);
      if (match) {
        const domain = String(match[1] || "").trim();
        if (!domain) return build.icon.load().emoji("🔖");
        return build.icon.load().logo.favicon(domain, domain, "card-favicon");
      }
      return build.icon.load().emoji(source || "🔖");
    },
    decode(value) {
      const source = String(value || "");
      try {
        const decoded = Buffer.from(source, "latin1").toString("utf8");
        return decoded || source;
      } catch {
        return source;
      }
    },
    known(value) {
      const source = String(value || "").trim();
      if (!source || /^favicon:/i.test(source)) return true;
      return Boolean(build.icon.load().emojis.name(source, "default"));
    },
    normalize(value) {
      const source = String(value || "").trim();
      if (!source) return source;
      if (/^favicon:/i.test(source)) return source;
      const decoded = build.icon.decode(source).trim();
      const candidates = [source, decoded].filter(Boolean);
      const preferred = candidates.find((item) => build.icon.known(item));
      return preferred || source;
    },
    assert(value, where = "icon") {
      const source = String(value || "").trim();
      if (!source) return;
      if (build.icon.known(source)) return;
      if (source.includes("?") || source.includes("�")) {
        throw new Error(`Invalid ${where}: ${JSON.stringify(source)}`);
      }
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
  import: {
    parseSpecifiers(source = "") {
      return String(source || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
          const match = item.match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/);
          if (!match) return null;
          return {
            imported: match[1],
            local: match[2] || match[1],
          };
        })
        .filter(Boolean);
    },
    returns(list = []) {
      return list
        .map(({ imported }) => imported)
        .filter(Boolean)
        .join(", ");
    },
    destructure(list = []) {
      return list
        .map(({ imported, local }) =>
          imported === local ? imported : `${imported}: ${local}`,
        )
        .join(", ");
    },
    named(file, rel, source, stack) {
      const list = build.import.parseSpecifiers(source);
      if (!list.length) return "";
      const dep = path.resolve(path.dirname(file), rel);
      const bundled = build.bundle(dep, new Set(stack), false);
      const destructure = build.import.destructure(list);
      const returns = build.import.returns(list);
      return `const { ${destructure} } = (() => {\n${bundled}\nreturn { ${returns} };\n})();`;
    },
    sideEffect(file, rel, stack) {
      const dep = path.resolve(path.dirname(file), rel);
      const bundled = build.bundle(dep, new Set(stack), false);
      return `(() => {\n${bundled}\n})();`;
    },
  },
  bundle(file, stack = new Set(), entry = false) {
    const full = path.resolve(file);
    if (stack.has(full)) {
      throw new Error(`Circular import: ${[...stack, full].join(" -> ")}`);
    }
    stack.add(full);
    let string = build.read(full);
    string = string.replace(
      /^\s*import\s+\{([^}]+)\}\s+from\s+["'](.+?)["'];?\s*$/gm,
      (_, specifiers, rel) => {
        return build.import.named(full, rel, specifiers, stack);
      },
    );
    string = string.replace(/^\s*import\s+["'](.+?)["'];?\s*$/gm, (_, rel) => {
      return build.import.sideEffect(full, rel, stack);
    });
    string = string
      .replace(/^\s*export\s+const\s+/gm, "const ")
      .replace(/^\s*export\s+\{[^}]+\};?\s*$/gm, "");
    if (path.basename(full) === "launcher.js") {
      string = string.replace(
        /"__LAUNCHER_TOOLS__"/g,
        JSON.stringify(build.launcherTools()),
      );
    }
    stack.delete(full);
    if (entry) string = build.unwrap(string);
    return string;
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
    return `javascript:(()=>{const root=(document.head||document.body||document.documentElement);const u='${loaderUrl}?t='+Date.now();const s=document.createElement('script');s.src=u;s.onerror=()=>{const f='${scriptUrl}?v='+Date.now();const n=document.createElement('script');n.src=f;n.onerror=()=>alert('🛑 Script: '+f);root.append(n)};root.append(s)})()`;
  },
  launcher() {
    const url = `${build.config.publish.baseUrl}/${build.config.publish.distPath}/launcher.js`;
    return `javascript:(()=>{const root=(document.head||document.body||document.documentElement);const u='${url}?t='+Date.now();const s=document.createElement('script');s.src=u;s.onerror=()=>alert('🛑 Launcher: '+u);root.append(s)})()`;
  },
  loaderScript(id, version) {
    const url = `${build.config.publish.baseUrl}/${build.config.publish.distPath}/${id}.js`;
    return `(()=>{const u='${url}?v=${version}';const s=document.createElement('script');s.src=u;s.onerror=()=>alert('🛑 Script: '+u);(document.head||document.body||document.documentElement).append(s)})();`;
  },
  code(script) {
    return "javascript:" + script;
  },
  data() {
    const value = JSON.parse(build.read(build.path.bookmarklets()));
    const data = Array.isArray(value) ? { scope: {}, items: value } : value;
    const items = Array.isArray(data.items) ? data.items : [];
    items.forEach((item, index) => {
      if (!item || typeof item !== "object") return;
      item.icon = build.icon.normalize(item.icon);
      build.icon.assert(item.icon, `items[${index}].icon`);
    });
    return data;
  },
  scope() {
    return build.data().scope || {};
  },
  items() {
    return build.data().items || [];
  },
  indexOrder() {
    const index = build.data().index || {};
    return Array.isArray(index.order) ? index.order : [];
  },
  order(items, order) {
    if (!order.length) return items;
    const rank = new Map(order.map((id, index) => [id, index]));
    return [...items].sort((a, b) => {
      const left = rank.has(a.id) ? rank.get(a.id) : Number.MAX_SAFE_INTEGER;
      const right = rank.has(b.id) ? rank.get(b.id) : Number.MAX_SAFE_INTEGER;
      if (left !== right) return left - right;
      return 0;
    });
  },
  launcherTools() {
    return build
      .items()
      .filter((item) => item.id !== "launcher")
      .filter((item) => {
        const scopes = build.scopes(item);
        return (
          scopes.includes("editor") ||
          scopes.includes("author") ||
          scopes.includes("service")
        );
      })
      .map((item) => ({
        id: item.id,
        title: item.launcherIcon || item.icon || "🔖",
        file: `${item.id}.js`,
        scope: build
          .scopes(item)
          .filter(
            (scope) =>
              scope === "editor" || scope === "author" || scope === "service",
          ),
      }));
  },
  scopes(item) {
    if (!item.scope) return [];
    return Array.isArray(item.scope) ? item.scope : [item.scope];
  },
  sourcePath(item) {
    return item.src || `${item.id}.js`;
  },
  card(item) {
    const file = path.join(build.root, "src", build.sourcePath(item));
    if (!fs.existsSync(file)) {
      throw new Error(`Missing file: src/${build.sourcePath(item)}`);
    }
    const source = build.bundle(file, new Set(), true);
    const script = build.script(item.id, source);
    build.guard.mojibake(item.id, script);
    const hrefJs = build.href(script);
    const code =
      build.config.copy === "plain" ? build.escape(build.code(script)) : "";
    return {
      id: item.id,
      iconText: build.icon.text(item.icon),
      icon: build.icon.html(item.icon),
      ok: build.icon.html("✅"),
      fail: build.icon.html("❌"),
      hrefJs,
      copy: build.config.copy,
      code,
      scope: build.scopes(item),
      script,
    };
  },
  cards() {
    const ordered = build.order(build.items(), build.indexOrder());
    const ids = new Set();
    return ordered
      .filter((item) => {
        if (!item || !item.id) return false;
        if (ids.has(item.id)) return false;
        ids.add(item.id);
        return true;
      })
      .map((item) => build.card(item));
  },
  cardsByScope(cards, scope) {
    return cards.filter((card) => card.scope.includes(scope));
  },
  cardById(cards, id) {
    return cards.find((card) => card.id === id) || null;
  },
  legacyCards(cards) {
    return cards.filter((card) => card.id !== "launcher");
  },
  grid(cards) {
    return cards
      .map(
        (card) =>
          `<a class="card" id="${card.id}" href="${build.escape(card.hrefGh)}" title="${build.escape(`${card.iconText} ${card.id}`)}" data-bookmark-label="${build.escape(`${card.iconText} ${card.id}`)}" data-ok-html="${build.escape(card.ok)}" data-fail-html="${build.escape(card.fail)}" data-copy="${card.copy}" data-href-js="${build.escape(card.hrefJs)}" data-href-gh="${build.escape(card.hrefGh)}" data-href-local-loader="/${build.config.publish.distPath}/loaders/${card.id}.js" data-href-local-script="/${build.config.publish.distPath}/${card.id}.js"${card.code ? ` data-code="${card.code}"` : ""} draggable="true">${card.icon}<span class="card-drag-emoji">${build.escape(card.iconText)}</span></a>`,
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
        const text = build.icon.html(`${icon} ${label}`);
        return `<a class="nav-link" href="#${scope}" data-scope-link="${scope}"${hidden}>${text}</a>`;
      })
      .join("\n");
  },
  section(scope, title, cards, visible = true) {
    if (!cards.length) return "";
    const hidden = visible === false ? ` data-visible="false"` : "";
    return `<section class="scope-block" data-scope-section="${scope}"${hidden}>
  <h2 class="scope-title">${build.icon.html(title)}</h2>
  <section class="grid">
    <!-- prettier-ignore-start -->
${build.grid(cards)}
    <!-- prettier-ignore-end -->
  </section>
</section>`;
  },
  primary(card) {
    if (!card) return "";
    return `<section class="launcher-primary">
  <div class="launcher-primary-card">
${build.grid([card])}
    <div class="launcher-primary-actions">
      <button type="button" class="mode-button" data-mode-switch title="GitHub mode needs internet and access to GitHub Pages">GH</button>
    </div>
    <div class="launcher-primary-guides">
      <section class="launcher-primary-guide">
        <h2 class="launcher-text launcher-text-mark">&#1091;&#1090;&#1088;&#1086;&#1084;</h2>
        <ol class="launcher-primary-steps">
          <li class="launcher-text">&#1087;&#1072;&#1085;&#1101;&#1083; &#1079;&#1072;&#1082;&#1083;&#1072;&#1076;&#1082;&#1072; &#1087;&#1072;&#1082;&#1072;&#1079;&#1072;&#1090;</li>
          <li class="launcher-text">&#1080;&#1082;&#1086;&#1085;&#1072; &#1084;&#1099;&#1096;&#1082;&#1072;&#1084; &#1073;&#1088;&#1072;&#1090;</li>
          <li class="launcher-text">&#1085;&#1072; &#1087;&#1072;&#1085;&#1101;&#1083; &#1082;&#1083;&#1072;&#1076;&#1072;&#1090;</li>
        </ol>
      </section>
      <section class="launcher-primary-guide">
        <h2 class="launcher-text launcher-text-mark">&#1074;&#1077;&#1095;&#1077;&#1088;&#1086;&#1084;</h2>
        <ol class="launcher-primary-steps">
          <li class="launcher-text">&#1086;&#1085;&#1083;i&#1085;&#1077;&#1088; &#1072;&#1090;&#1082;&#1088;&#1099;&#1074;&#1072;&#1090;</li>
          <li class="launcher-text">&#1080;&#1082;&#1086;&#1085;&#1072; &#1078;&#1084;&#1072;&#1090;</li>
          <li class="launcher-text">&#1082;&#1072;&#1081;&#1092;&#1072;&#1074;&#1072;&#1090;</li>
          <li class="launcher-text">&#1072;&#1085;&#1078;&#1091;&#1084;&#1072;&#1085;&#1103; &#1085;&#1077; &#1085;&#1072;&#1076;&#1072;</li>
        </ol>
      </section>
    </div>
  </div>
</section>`;
  },
  legacy(cards) {
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
    return `<section class="legacy-block">
  <div class="legacy-copy">
    <p class="legacy-kicker">Старые инструменты</p>
    <h2 class="legacy-title">Старые отдельные bookmarklets</h2>
    <p class="legacy-text">Они оставлены как fallback и для совместимости. Основной сценарий теперь начинается с Launcher.</p>
  </div>
${blocks}
</section>`;
  },
  main(cards) {
    const launcher = build.cardById(cards, "launcher");
    return `<main class="layout">
${build.primary(launcher)}
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
    build.write(
      build.path.manifest(),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
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
      const hrefGh =
        card.id === "launcher" ? build.launcher() : build.loader(card.id);
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
