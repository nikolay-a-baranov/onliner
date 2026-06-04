import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "snapshot.md");
const allowedExtensions = new Set([".js", ".json", ".md", ".html", ".css"]);
const ignoredDirs = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  ".cache",
  "coverage",
]);
const preferredFiles = [
  "package.json",
  "bookmarklets.json",
  "README.md",
  "JAVASCRIPT.md",
];

const file = {
  walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      const relative = path.relative(root, full);
      if (entry.isDirectory()) {
        if (ignoredDirs.has(entry.name)) return [];
        return file.walk(full);
      }
      if (!entry.isFile()) return [];
      if (!allowedExtensions.has(path.extname(entry.name))) return [];
      if (preferredFiles.includes(relative)) return [relative];
      if (relative.startsWith(`src${path.sep}`)) return [relative];
      if (relative.startsWith(`scripts${path.sep}`)) return [relative];
      return [];
    });
  },
  read(relative) {
    return fs.readFileSync(path.join(root, relative), "utf8");
  },
};

const imports = {
  collect(content) {
    const matches = [
      ...content.matchAll(/import\s+(?:[^'"]+\s+from\s+)?["']([^"']+)["']/g),
      ...content.matchAll(/import\(["']([^"']+)["']\)/g),
      ...content.matchAll(/require\(["']([^"']+)["']\)/g),
    ];
    return matches.map((match) => match[1]);
  },
};

const tree = {
  build(files) {
    return files.map((name) => `- ${name}`).join("\n");
  },
};

const section = {
  code(name, content) {
    return [
      `## ${name}`,
      "",
      "```" + path.extname(name).slice(1),
      content.trimEnd(),
      "```",
      "",
    ].join("\n");
  },
  imports(files) {
    const rows = files.flatMap((name) => {
      const content = file.read(name);
      return imports
        .collect(content)
        .map((target) => `| ${name} | ${target} |`);
    });
    if (!rows.length) return "## Imports\n\nNo imports found.\n";
    return [
      "## Imports",
      "",
      "| File | Import |",
      "|---|---|",
      ...rows,
      "",
    ].join("\n");
  },
};

const snapshot = {
  run() {
    const files = file.walk(root).sort((a, b) => a.localeCompare(b));
    const content = [
      "# Project snapshot",
      "",
      "## Structure",
      "",
      tree.build(files),
      "",
      section.imports(files),
      ...files.map((name) => section.code(name, file.read(name))),
    ].join("\n");
    fs.writeFileSync(output, content, "utf8");
    console.log(`Snapshot written: ${output}`);
  },
};

snapshot.run();
