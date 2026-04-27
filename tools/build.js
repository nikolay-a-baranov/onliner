const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "src");
const htmlPath = path.join(root, "index.html");
const listPath = path.join(root, "bookmarklets.json");

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
    .replace(/\s*([{}();,:?=+])\s*/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();

const bookmarklets = JSON.parse(fs.readFileSync(listPath, "utf8"));

const cards = bookmarklets.map((item) => {
  const jsPath = path.join(srcDir, `${item.id}.js`);

  if (!fs.existsSync(jsPath)) {
    throw new Error(`Missing file: src/${item.id}.js`);
  }

  const source = fs.readFileSync(jsPath, "utf8");
  const href = escapeAttr("javascript:" + clean(source));

  return {
    id: item.id,
    icon: item.icon || "🔖",
    href,
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
