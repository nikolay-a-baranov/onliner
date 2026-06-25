const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const buildArgs = new Set(process.argv.slice(2));

const build = {
  args: buildArgs,
  root: path.resolve(__dirname, ".."),
  title: "Букмарклеты Onlíner",
  path: {
    currentHtml() {
      return path.join(build.root, "index.html");
    },
    legacyHtml() {
      return path.join(build.root, "legacy.html");
    },
    distDir(distPath = build.config.publish.currentDistPath) {
      return path.join(build.root, distPath);
    },
    dist(id, distPath = build.config.publish.currentDistPath) {
      return path.join(build.path.distDir(distPath), `${id}.js`);
    },
    loadersDir(distPath = build.config.publish.currentDistPath) {
      return path.join(build.path.distDir(distPath), "loaders");
    },
    loader(id, distPath = build.config.publish.currentDistPath) {
      return path.join(build.path.loadersDir(distPath), `${id}.js`);
    },
    manifest(distPath = build.config.publish.currentDistPath) {
      return path.join(build.path.distDir(distPath), "manifest.json");
    },
    currentStorefrontDir() {
      return path.join(build.root, "tools", "storefront", "current");
    },
    currentTemplate() {
      return path.join(build.path.currentStorefrontDir(), "template.html");
    },
    legacyStorefrontDir() {
      return path.join(build.root, "tools", "legacy", "storefront");
    },
    legacyTemplate() {
      return path.join(build.path.legacyStorefrontDir(), "template.html");
    },
    currentTools() {
      return path.join(build.root, "tools", "current", "tools.json");
    },
    legacyTools() {
      return path.join(build.root, "tools", "legacy", "tools.json");
    },
    legacyStorefrontMeta() {
      return path.join(build.path.legacyStorefrontDir(), "storefront.json");
    },
    emoji() {
      return path.join(build.root, "src", "core", "surface", "icon.js");
    },
  },
  config: {
    compact: new Set(["sanitize"]),
    copy: "href",
    targets: {
      current: true,
      legacy: !buildArgs.has("--no-legacy"),
    },
    publish: {
      baseUrl: "https://nikolay-a-baranov.github.io/onliner",
      currentDistPath: "dist",
      legacyDistPath: "dist/legacy",
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
      if (!source) return "🔖";
      if (/^favicon:/i.test(source)) return "🔖";
      if (/^logo:/i.test(source)) return "";
      if (build.icon.load().emojis.name(source)) return "";
      return source;
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
    resolve(file, rel) {
      const primary = path.resolve(path.dirname(file), rel);
      if (fs.existsSync(primary)) return primary;
      const legacyRoot = path.join(build.root, "src", "legacy") + path.sep;
      if (!file.startsWith(legacyRoot)) return primary;
      return path.resolve(path.join(build.root, "src"), rel);
    },
    parseSpecifiers(source = "") {
      return String(source || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
          const match = item.match(
            /^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/,
          );
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
      const dep = build.import.resolve(file, rel);
      const bundled = build.bundle(dep, new Set(stack), false);
      const destructure = build.import.destructure(list);
      const returns = build.import.returns(list);
      return `const { ${destructure} } = (() => {\n${bundled}\nreturn { ${returns} };\n})();`;
    },
    sideEffect(file, rel, stack) {
      const dep = build.import.resolve(file, rel);
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
    if (path.basename(full) === "launchpad.js") {
      string = string.replace(
        /"__LAUNCHPAD_TOOLS__"/g,
        JSON.stringify(build.launchpadTools()),
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
  loader(id, distPath = build.config.publish.currentDistPath) {
    const loaderUrl = `${build.config.publish.baseUrl}/${distPath}/loaders/${id}.js`;
    const scriptUrl = `${build.config.publish.baseUrl}/${distPath}/${id}.js`;
    return `javascript:(()=>{const root=(document.head||document.body||document.documentElement);const u='${loaderUrl}?t='+Date.now();const s=document.createElement('script');s.src=u;s.onerror=()=>{const f='${scriptUrl}?v='+Date.now();const n=document.createElement('script');n.src=f;n.onerror=()=>alert('📜: '+f);root.append(n)};root.append(s)})()`;
  },
  launchpad() {
    const url = `${build.config.publish.baseUrl}/${build.config.publish.currentDistPath}/launchpad.js`;
    return `javascript:(()=>{const root=(document.head||document.body||document.documentElement);const u='${url}?t='+Date.now();const s=document.createElement('script');s.src=u;s.onerror=()=>alert('🎛️: '+u);root.append(s)})()`;
  },
  loaderScript(id, version, distPath = build.config.publish.currentDistPath) {
    const url = `${build.config.publish.baseUrl}/${distPath}/${id}.js`;
    return `(()=>{const u='${url}?v=${version}';const s=document.createElement('script');s.src=u;s.onerror=()=>alert('📜: '+u);(document.head||document.body||document.documentElement).append(s)})();`;
  },
  code(script) {
    return "javascript:" + script;
  },
  toolset(file) {
    const data = JSON.parse(build.read(file));
    const tools = Array.isArray(data.items) ? data.items : [];
    tools.forEach((tool, index) => {
      if (!tool || typeof tool !== "object") return;
      tool.icon = build.icon.normalize(tool.icon);
      build.icon.assert(tool.icon, `items[${index}].icon`);
    });
    return { tools };
  },
  currentTools() {
    return build.toolset(build.path.currentTools());
  },
  legacyTools() {
    return build.toolset(build.path.legacyTools());
  },
  currentCards() {
    return build
      .currentTools()
      .tools.map((tool) =>
        build.toolCard(tool, build.config.publish.currentDistPath),
      );
  },
  legacyCards() {
    return build
      .legacyTools()
      .tools.map((tool) =>
        build.toolCard(tool, build.config.publish.legacyDistPath),
      );
  },
  legacyStorefront() {
    const data = JSON.parse(build.read(build.path.legacyStorefrontMeta()));
    return {
      scope: data.scope || {},
      index: data.index || {},
    };
  },
  legacyScope() {
    return build.legacyStorefront().scope || {};
  },
  legacyIndexOrder() {
    const index = build.legacyStorefront().index || {};
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
  launchpadTools() {
    return build
      .currentTools()
      .tools.filter((tool) => tool.id !== "launchpad")
      .filter((tool) => {
        const scopes = build.scopes(tool);
        return (
          scopes.includes("editor") ||
          scopes.includes("author") ||
          scopes.includes("service")
        );
      })
      .map((item) => ({
        id: item.id,
        title: item.launchpadIcon || item.icon || "🔖",
        file: `${item.id}.js`,
        scope: build
          .scopes(item)
          .filter(
            (scope) =>
              scope === "editor" || scope === "author" || scope === "service",
          ),
      }));
  },
  scopes(tool) {
    if (!tool.scope) return [];
    return Array.isArray(tool.scope) ? tool.scope : [tool.scope];
  },
  sourcePath(tool) {
    return tool.src || `${tool.id}.js`;
  },
  sourceFile(tool) {
    const source = build.sourcePath(tool);
    const file = path.join(build.root, "src", source);
    if (fs.existsSync(file)) return file;
    throw new Error(`Missing file: src/${source}`);
  },
  cardLabel(tool) {
    return String(tool?.title || tool?.id || "").trim();
  },
  cardTitle(tool, iconText, label) {
    if (tool.id === "launchpad") {
      return `${iconText} Зажми ЛКМ, дотяни до панели закладок (под адресной строкой, если не видно, жмать Ctrl/Cmd+Shift+B) и отпусти`;
    }
    return [iconText, label].filter(Boolean).join(" ");
  },
  bookmarkLabel(tool, iconText, label) {
    if (tool.id === "launchpad") return iconText;
    return [iconText, label].filter(Boolean).join(" ");
  },
  toolCard(tool, distPath = build.config.publish.currentDistPath) {
    const file = build.sourceFile(tool);
    const source = build.bundle(file, new Set(), true);
    const script = build.script(tool.id, source);
    build.guard.mojibake(tool.id, script);
    const hrefJs =
      tool.id === "launchpad" &&
      distPath === build.config.publish.currentDistPath
        ? build.launchpad()
        : build.href(script);
    const code =
      build.config.copy === "plain" ? build.escape(build.code(script)) : "";
    const iconText =
      tool.id === "launchpad" ? "🎛️" : build.icon.text(tool.icon);
    const label = build.cardLabel(tool);
    const bookmarkLabel = build.bookmarkLabel(tool, iconText, label);
    return {
      id: tool.id,
      label,
      iconText,
      icon: build.icon.html(tool.icon),
      ok: build.icon.html("check-mark-button"),
      fail: build.icon.html("cross-mark"),
      title: build.cardTitle(tool, iconText, label),
      bookmarkLabel,
      hrefJs,
      distPath,
      copy: build.config.copy,
      code,
      scope: build.scopes(tool),
      script,
    };
  },
  scopeCards(cards, scope) {
    return cards.filter((card) => card.scope.includes(scope));
  },
  findCard(cards, id) {
    return cards.find((card) => card.id === id) || null;
  },
  legacyBuildCards(cards) {
    return cards.filter((card) => card.id !== "launchpad");
  },
  grid(cards) {
    return cards
      .map(
        (card) =>
          `<a class="card" id="${card.id}" href="${build.escape(card.hrefGh)}" title="${build.escape(card.title)}" data-card-label="${build.escape(card.label)}" data-bookmark-label="${build.escape(card.bookmarkLabel)}" data-ok-html="${build.escape(card.ok)}" data-fail-html="${build.escape(card.fail)}" data-copy="${card.copy}" data-href-js="${build.escape(card.hrefJs)}" data-href-gh="${build.escape(card.hrefGh)}" data-href-local-loader="/${card.distPath}/loaders/${card.id}.js" data-href-local-script="/${card.distPath}/${card.id}.js"${card.code ? ` data-code="${card.code}"` : ""} draggable="true">${card.icon}<span class="card-drag-emoji">${build.escape(card.bookmarkLabel)}</span></a>`,
      )
      .join("\n");
  },
  iconLabel(value, label) {
    return [build.icon.html(value), build.escape(label)]
      .filter(Boolean)
      .join(" ");
  },
  nav() {
    const links = [
      { icon: "milky-way", label: "Все", scope: "all", visible: true },
      ...Object.entries(build.legacyScope()).map(([scope, meta]) => ({
        ...meta,
        scope,
      })),
    ];
    return links
      .map(({ icon, label, scope, visible }) => {
        const hidden = visible === false ? ` data-visible="false"` : "";
        const text = build.iconLabel(icon, label);
        return `<a class="nav-link" href="#${scope}" data-scope-link="${scope}"${hidden}>${text}</a>`;
      })
      .join("\n");
  },
  section(scope, title, cards, visible = true, iconValue = "") {
    if (!cards.length) return "";
    const hidden = visible === false ? ` data-visible="false"` : "";
    const heading = iconValue
      ? build.iconLabel(iconValue, title)
      : build.escape(title);
    return `<section class="scope-block" data-scope-section="${scope}"${hidden}>
  <h2 class="scope-title">${heading}</h2>
  <section class="grid">
    <!-- prettier-ignore-start -->
${build.grid(cards)}
    <!-- prettier-ignore-end -->
  </section>
</section>`;
  },
  primary(card) {
    if (!card) return "";
    return `<section class="launchpad-primary">
  <div class="launchpad-primary-card">
${build.grid([card])}
    <div class="launchpad-primary-actions">
      <button type="button" class="mode-button" data-mode-switch title="GitHub mode needs internet and access to GitHub Pages">GH</button>
    </div>
    <div class="launchpad-primary-guides">
      <section class="launchpad-primary-guide">
        <h2 class="launchpad-text launchpad-text-mark">&#1091;&#1090;&#1088;&#1086;&#1084;</h2>
        <ol class="launchpad-primary-steps">
          <li class="launchpad-text">&#1087;&#1072;&#1085;&#1101;&#1083; &#1079;&#1072;&#1082;&#1083;&#1072;&#1076;&#1082;&#1072; &#1087;&#1072;&#1082;&#1072;&#1079;&#1072;&#1090;</li>
          <li class="launchpad-text">&#1080;&#1082;&#1086;&#1085;&#1072; &#1084;&#1099;&#1096;&#1082;&#1072;&#1084; &#1073;&#1088;&#1072;&#1090;</li>
          <li class="launchpad-text">&#1085;&#1072; &#1087;&#1072;&#1085;&#1101;&#1083; &#1082;&#1083;&#1072;&#1076;&#1072;&#1090;</li>
        </ol>
      </section>
      <section class="launchpad-primary-guide">
        <h2 class="launchpad-text launchpad-text-mark">&#1074;&#1077;&#1095;&#1077;&#1088;&#1086;&#1084;</h2>
        <ol class="launchpad-primary-steps">
          <li class="launchpad-text">&#1048;&#1085;&#1090;&#1101;&#1088;&#1085;&#1101;&#1090; &#1089;&#1090;&#1088;&#1072;&#1085;&#1080;&#1094;&#1072; &#1072;&#1082;&#1090;&#1088;&#1099;&#1074;&#1072;&#1090;</li>
          <li class="launchpad-text">&#1080;&#1082;&#1086;&#1085;&#1072; &#1078;&#1084;&#1072;&#1090;</li>
          <li class="launchpad-text">&#1082;&#1072;&#1081;&#1092;&#1072;&#1074;&#1072;&#1090;</li>
          <li class="launchpad-text">&#1072;&#1085;&#1078;&#1091;&#1084;&#1072;&#1085;&#1103; &#1085;&#1077; &#1085;&#1072;&#1076;&#1072;</li>
        </ol>
      </section>
    </div>
  </div>
</section>`;
  },
  legacy(cards) {
    const blocks = Object.entries(build.legacyScope())
      .map(([scope, meta]) =>
        build.section(
          scope,
          meta.label,
          build.scopeCards(cards, scope),
          meta.visible,
          meta.icon,
        ),
      )
      .filter(Boolean)
      .join("\n\n");
    return `<section class="legacy-block">
  <div class="legacy-copy">
    <p class="legacy-kicker">Старые инструменты</p>
    <h2 class="legacy-title">Старые отдельные bookmarklets</h2>
    <p class="legacy-text">Они оставлены как fallback и для совместимости. Основной сценарий теперь начинается с Launchpad.</p>
  </div>
${blocks}
</section>`;
  },
  currentMain(cards) {
    const launchpad = build.findCard(cards, "launchpad");
    return `<main class="layout">
${build.primary(launchpad)}
</main>`;
  },
  currentHtml(cards) {
    return build
      .read(build.path.currentTemplate())
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${build.title}</title>`)
      .replace(/<main>[\s\S]*?<\/main>/, build.currentMain(cards));
  },
  legacyMain(cards) {
    return `<main class="layout">
${build.nav()}
${build.legacy(build.legacyBuildCards(cards))}
</main>`;
  },
  legacyHtml(cards) {
    return build
      .read(build.path.legacyTemplate())
      .replace(
        /<title>[\s\S]*?<\/title>/,
        `<title>${build.title} · Legacy</title>`,
      )
      .replace(/<main>[\s\S]*?<\/main>/, build.legacyMain(cards));
  },
  removeScopePages() {
    const dir = path.join(build.root, "scope");
    if (!fs.existsSync(dir)) return;
    fs.rmSync(dir, { recursive: true, force: true });
  },
  removeDir(dir) {
    if (!fs.existsSync(dir)) return;
    fs.rmSync(dir, { recursive: true, force: true });
  },
  cleanDist(distPath = build.config.publish.currentDistPath) {
    const removeJs = (dir) => {
      if (!fs.existsSync(dir)) return;
      fs.readdirSync(dir)
        .filter((file) => file.endsWith(".js"))
        .forEach((file) => fs.rmSync(path.join(dir, file)));
    };
    fs.mkdirSync(build.path.distDir(distPath), { recursive: true });
    fs.mkdirSync(build.path.loadersDir(distPath), { recursive: true });
    removeJs(build.path.distDir(distPath));
    removeJs(build.path.loadersDir(distPath));
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
  manifest(distPath = build.config.publish.currentDistPath) {
    const file = build.path.manifest(distPath);
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
  publish(cards, distPath = build.config.publish.currentDistPath) {
    build.cleanDist(distPath);
    const current = build.manifest(distPath);
    const nextVersion = build.now();
    const manifest = {};
    cards.forEach(({ id, script }) => {
      build.write(build.path.dist(id, distPath), script + "\n");
      manifest[`${id}.js`] = build.version(id, script, current, nextVersion);
    });
    build.write(
      build.path.manifest(distPath),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
    cards.forEach(({ id }) => {
      const file = `${id}.js`;
      const version = manifest[file]?.version || nextVersion;
      const loader = build.loaderScript(id, version, distPath);
      build.write(build.path.loader(id, distPath), loader + "\n");
    });
    return manifest;
  },
  link(cards) {
    return cards.map((card) => {
      const hrefGh =
        card.id === "launchpad" &&
        card.distPath === build.config.publish.currentDistPath
          ? build.launchpad()
          : build.loader(card.id, card.distPath);
      return {
        ...card,
        hrefGh,
      };
    });
  },
  currentBuild(cards = []) {
    if (!build.config.targets.current) return;
    build.write(build.path.currentHtml(), build.currentHtml(cards));
    build.removeScopePages();
  },
  legacyBuild(cards = []) {
    if (!build.config.targets.legacy) return;
    build.write(build.path.legacyHtml(), build.legacyHtml(cards));
  },
  run() {
    const currentCards = build.currentCards();
    const legacyCards = build.order(
      build.legacyCards(),
      build.legacyIndexOrder(),
    );
    build.publish(currentCards, build.config.publish.currentDistPath);
    if (build.config.targets.legacy) {
      build.publish(legacyCards, build.config.publish.legacyDistPath);
    } else {
      build.removeDir(build.path.distDir(build.config.publish.legacyDistPath));
    }
    const linkedCurrent = build.link(currentCards);
    const linkedLegacy = build.config.targets.legacy
      ? build.link(legacyCards)
      : [];
    build.currentBuild(linkedCurrent);
    if (build.config.targets.legacy) {
      build.legacyBuild(linkedLegacy);
    } else {
      const legacyHtml = build.path.legacyHtml();
      if (fs.existsSync(legacyHtml)) fs.rmSync(legacyHtml);
    }
  },
  watch() {
    const roots = [
      path.join(build.root, "src"),
      build.path.currentTools(),
      build.path.legacyTools(),
      build.path.legacyStorefrontMeta(),
      build.path.currentStorefrontDir(),
      build.path.legacyStorefrontDir(),
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
    const watched =
      "src, tools/current/tools.json, tools/legacy/tools.json, tools/storefront/current/**, tools/legacy/storefront/**";
    console.log(`Watching: ${watched}`);
  },
};

try {
  if (process.argv.includes("--watch")) build.watch();
  else build.run();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
