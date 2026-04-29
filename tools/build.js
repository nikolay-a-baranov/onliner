const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "src");
const htmlPath = path.join(root, "index.html");
const listPath = path.join(root, "bookmarklets.json");

const bundle = (file, seen = new Set()) => {
  const full = path.resolve(file);
  if (seen.has(full)) return "";
  seen.add(full);
  let code = fs.readFileSync(full, "utf8");
  let deps = "";
  code = code.replace(
    /^\s*import\s+\{[^}]+\}\s+from\s+["'](.+?)["'];?\s*$/gm,
    (_, rel) => {
      deps += bundle(path.resolve(path.dirname(full), rel), seen) + "\n";
      return "";
    },
  );
  code = code
    .replace(/^\s*export\s+const\s+/gm, "const ")
    .replace(/^\s*export\s+\{[^}]+\};?\s*$/gm, "");
  return deps + code;
};

const escapeAttr = (text) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const clean = (code) =>
  code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

const wrapped = new Set(["cleanup", "publish", "proofread"]);

const href = (id, source) => {
  const script = clean(`(()=>{${source}})();`);
  if (!wrapped.has(id)) return "javascript:" + script;
  const base64 = Buffer.from(script, "utf8").toString("base64");
  return `javascript:(()=>{const s=atob("${base64}");const u=Uint8Array.from(s,c=>c.charCodeAt(0));(0,eval)(new TextDecoder().decode(u));})();`;
};

const bookmarklets = JSON.parse(fs.readFileSync(listPath, "utf8"));

const cards = bookmarklets.map((item) => {
  const jsPath = path.join(srcDir, `${item.id}.js`);
  if (!fs.existsSync(jsPath)) {
    throw new Error(`Missing file: src/${item.id}.js`);
  }
  const source = bundle(jsPath);
  const value = escapeAttr(href(item.id, source));
  return {
    id: item.id,
    icon: item.icon || "🔖",
    href: value,
  };
});

const block = cards
  .map(
    (card) =>
      `<a class="card" id="${card.id}" href="${card.href}" draggable="true">${card.icon}</a>`,
  )
  .join("\n");

let html = fs.readFileSync(htmlPath, "utf8");

html = html.replace(
  /<section class="grid">[\s\S]*?<\/section>/,
  () => `<section class="grid">
<!-- prettier-ignore-start -->
${block}
<!-- prettier-ignore-end -->
</section>`,
);

fs.writeFileSync(htmlPath, html, "utf8");

cards.forEach((card) => console.log(`Updated: ${card.id}`));
