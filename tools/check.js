const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const qaDir = path.join(root, "qa");

const read = (filePath) => fs.readFileSync(filePath, "utf8");
const isTxt = (name) => /\.txt$/i.test(name);

const normalizeText = (value) =>
  String(value || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const footers = {
  telegram: /Есть о чем рассказать\?|newsonliner_bot/i,
  copyright: /Перепечатка текста|ga@onliner\.by/i,
};

const checks = {
  danglingFooterTail(content) {
    return /(?:<p\b[^>]*>\s*)?(?:<span\b[^>]*>\s*)?(?:<strong>\s*)$/i.test(
      content.trim(),
    );
  },
  mergedBlocks(content) {
    return /<\/(?:p|li|blockquote|ul|ol|dl)>\s*<(?:p|ul|ol|li|blockquote|dl)\b/i.test(
      content,
    );
  },
  listExtraParagraphs(content) {
    return /<li\b[^>]*>\s*<p\b[^>]*>/i.test(content);
  },
  listBlankRows(content) {
    return /<li\b[^>]*>\s*\n\s*\n/i.test(content);
  },
  invalidTime(content) {
    const bad = content.match(/\b([01]\d|2[0-3]):([6-9]\d)\b/g) || [];
    return bad;
  },
  suspiciousMoneyTime(content) {
    return /\$\s*0\d:[0-9]{2}\b/.test(content);
  },
};

const toPairKey = (name) =>
  name
    .replace(/_cleanup\.txt$/i, "")
    .replace(/[—-]id\.txt$/i, "");

const list = fs.readdirSync(qaDir).filter(isTxt);
const issues = [];
const pairs = new Map();

for (const name of list) {
  const filePath = path.join(qaDir, name);
  const content = read(filePath);
  const fileIssues = [];

  if (checks.danglingFooterTail(content)) fileIssues.push("dangling-footer-tail");
  if (checks.mergedBlocks(content)) fileIssues.push("merged-blocks");
  if (checks.listExtraParagraphs(content)) fileIssues.push("li-wraps-p");
  if (checks.listBlankRows(content)) fileIssues.push("li-blank-rows");
  if (checks.suspiciousMoneyTime(content))
    fileIssues.push("money-looks-like-time");
  const invalidTime = checks.invalidTime(content);
  if (invalidTime.length) {
    fileIssues.push(`invalid-time:${[...new Set(invalidTime)].join(",")}`);
  }

  if (fileIssues.length) {
    issues.push({ name, fileIssues });
  }

  if (/_cleanup\.txt$/i.test(name) || /[—-]id\.txt$/i.test(name)) {
    const key = toPairKey(name);
    const item = pairs.get(key) || {};
    if (/_cleanup\.txt$/i.test(name)) item.cleanup = { name, content };
    if (/[—-]id\.txt$/i.test(name)) item.id = { name, content };
    pairs.set(key, item);
  }
}

const pairIssues = [];
for (const [key, item] of pairs.entries()) {
  if (!item.id || !item.cleanup) continue;
  const idText = normalizeText(item.id.content)
    .replace(footers.telegram, "")
    .replace(footers.copyright, "")
    .trim();
  const cleanupText = normalizeText(item.cleanup.content)
    .replace(footers.telegram, "")
    .replace(footers.copyright, "")
    .trim();
  if (!idText || !cleanupText) continue;
  const tail = idText.slice(-180).trim();
  if (tail && !cleanupText.includes(tail)) {
    pairIssues.push({
      key,
      id: item.id.name,
      cleanup: item.cleanup.name,
      issue: "tail-of-id-not-found-in-cleanup",
      sample: tail.slice(0, 90),
    });
  }
}

if (!issues.length && !pairIssues.length) {
  console.log("check: ok");
  process.exit(0);
}

console.log("check: issues found");
if (issues.length) {
  console.log("\nfiles:");
  for (const item of issues) {
    console.log(`- ${item.name}: ${item.fileIssues.join("; ")}`);
  }
}
if (pairIssues.length) {
  console.log("\npairs:");
  for (const item of pairIssues) {
    console.log(
      `- ${item.key}: ${item.issue} (${item.id} -> ${item.cleanup}) sample="${item.sample}"`,
    );
  }
}
process.exit(1);
