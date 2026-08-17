const fs = require("fs");
const path = require("path");

const fluent = {
  root: path.resolve(__dirname, ".."),
  sizes: [16, 20, 24, 28, 48],
  path: {
    source() {
      return path.join(
        fluent.root,
        "node_modules",
        "@fluentui",
        "svg-icons",
        "icons",
      );
    },
    target() {
      return path.join(fluent.root, "assets", "icons", "fluent");
    },
    manifest() {
      return path.join(fluent.path.target(), "manifest.json");
    },
    src() {
      return path.join(fluent.root, "src");
    },
  },
  name(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
  },
  size(value) {
    const current = Number(value) || 20;
    const map = {
      16: 16,
      18: 20,
      20: 20,
      22: 24,
      24: 24,
      28: 28,
      60: 48,
    };
    return map[current] || current;
  },
  files(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const current = path.join(directory, entry.name);
      if (entry.isDirectory()) return fluent.files(current);
      if (!entry.isFile() || !entry.name.endsWith(".js")) return [];
      return [current];
    });
  },
  add(state, name, sizes = []) {
    const current = String(name || "").trim();
    if (!current) return state;
    const previous = state.get(current) || new Set();
    sizes.forEach((size) => previous.add(fluent.size(size)));
    state.set(current, previous);
    return state;
  },
  available(name, size = 20) {
    const sourceRoot = fluent.path.source();
    if (!fs.existsSync(sourceRoot)) return false;
    return fluent.sizes.some((value) =>
      fs.existsSync(path.join(sourceRoot, fluent.file(name, fluent.size(size || value)))),
    );
  },
  addAvailable(state, name, sizes = []) {
    if (!fluent.available(name, sizes[0] || 20)) return state;
    return fluent.add(state, name, sizes);
  },
  scanFile(state, file) {
    const source = fs.readFileSync(file, "utf8");
    const glyph = /\bglyph\s*:\s*["']([^"']+)["']/g;
    const named = /\bfluent\s*:\s*["']([^"']+)["']/g;
    const conditional = /\b(?:fluent|glyph)\s*:\s*[^?\n]+?\?\s*["']([^"']+)["']\s*:\s*["']([^"']+)["']/g;
    const applyNames = /\bapply\s*:\s*\{\s*names\s*:\s*\{([\s\S]*?)\}\s*,/g;
    const waitFrames = /\bframes\s*:\s*\[([\s\S]*?)\]\s*,\s*glyph\s*\(/g;
    const glyphs = /\bconst\s+glyphs\s*=\s*\{([\s\S]*?)\n\s*\};/g;
    const tuple = /\[\s*["']([A-Z][A-Za-z0-9 -]+)["']\s*,\s*["'][^"']*["']\s*\]/g;
    const direct = /\bicon\.fluent\s*\(\s*["']([^"']+)["'](?:\s*,\s*(\d+))?/g;
    const control = /\bui\.controls\.glyph\s*\(\s*["']([^"']+)["'](?:\s*,\s*(\d+))?(?:\s*,\s*["']([^"']+)["'])?/g;
    const local = /\bglyph\.html\s*\(\s*["']([^"']+)["'](?:\s*,\s*(\d+))?(?:\s*,\s*["']([^"']+)["'])?/g;
    Array.from(source.matchAll(glyph)).forEach((match) => {
      fluent.add(state, match[1], [20, 24, 28]);
    });
    Array.from(source.matchAll(named)).forEach((match) => {
      fluent.add(state, match[1], [20, 24]);
    });
    Array.from(source.matchAll(conditional)).forEach((match) => {
      fluent.add(state, match[1], [20, 24]);
      fluent.add(state, match[2], [20, 24]);
    });
    Array.from(source.matchAll(applyNames)).forEach((match) => {
      Array.from(match[1].matchAll(/\b[a-z][a-z0-9]*\s*:\s*["']([^"']+)["']/gi)).forEach((item) => {
        fluent.add(state, item[1], [20, 24]);
      });
    });
    Array.from(source.matchAll(waitFrames)).forEach((match) => {
      Array.from(match[1].matchAll(/["']([^"']+)["']/g)).forEach((item) => {
        fluent.add(state, item[1], [20]);
      });
    });
    Array.from(source.matchAll(glyphs)).forEach((match) => {
      Array.from(match[1].matchAll(/\b[a-z][a-z0-9]*\s*:\s*["']([^"']+)["']/gi)).forEach((item) => {
        fluent.add(state, item[1], [20]);
      });
    });
    Array.from(source.matchAll(tuple)).forEach((match) => {
      fluent.addAvailable(state, match[1], [20]);
    });
    Array.from(source.matchAll(direct)).forEach((match) => {
      fluent.add(state, match[1], [match[2] || 20]);
    });
    Array.from(source.matchAll(control)).forEach((match) => {
      fluent.add(state, match[1], [match[2] || 20]);
      fluent.addAvailable(state, match[3], [match[2] || 20]);
    });
    Array.from(source.matchAll(local)).forEach((match) => {
      fluent.add(state, match[1], [match[2] || 20]);
      fluent.addAvailable(state, match[3], [match[2] || 20]);
    });
    return state;
  },
  usages() {
    return fluent.files(fluent.path.src()).reduce(
      (state, file) => fluent.scanFile(state, file),
      new Map(),
    );
  },
  file(name, size) {
    return `${fluent.name(name)}_${size}_regular.svg`;
  },
  expected() {
    return Array.from(fluent.usages().entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, sizes]) => ({
        name,
        files: Array.from(sizes)
          .sort((left, right) => left - right)
          .map((size) => fluent.file(name, size)),
      }));
  },
  source(name, file) {
    const sourceRoot = fluent.path.source();
    const exact = path.join(sourceRoot, file);
    if (fs.existsSync(exact)) return exact;
    const requested = Number(file.match(/_(\d+)_regular\.svg$/)?.[1] || 20);
    const available = fluent.sizes
      .map((size) => ({
        size,
        file: path.join(sourceRoot, fluent.file(name, size)),
      }))
      .filter((item) => fs.existsSync(item.file))
      .sort(
        (left, right) =>
          Math.abs(left.size - requested) - Math.abs(right.size - requested),
      );
    return available[0]?.file || "";
  },
  manifest(items) {
    return {
      schema: "onliner.fluent-icons/v1",
      package: "@fluentui/svg-icons",
      icons: items,
    };
  },
  write(value) {
    fs.mkdirSync(fluent.path.target(), { recursive: true });
    fs.writeFileSync(
      fluent.path.manifest(),
      `${JSON.stringify(value, null, 2)}\n`,
      "utf8",
    );
    return value;
  },
  sync() {
    const sourceRoot = fluent.path.source();
    if (!fs.existsSync(sourceRoot)) {
      throw new Error("Missing @fluentui/svg-icons. Run npm install.");
    }
    const items = fluent.expected();
    const targetRoot = fluent.path.target();
    fs.mkdirSync(targetRoot, { recursive: true });
    const required = new Set(items.flatMap((item) => item.files));
    fs.readdirSync(targetRoot)
      .filter((file) => file.endsWith(".svg") && !required.has(file))
      .forEach((file) => fs.rmSync(path.join(targetRoot, file)));
    const missing = [];
    items.forEach((item) => {
      item.files.forEach((file) => {
        const source = fluent.source(item.name, file);
        if (!source) {
          missing.push(`${item.name}: ${file}`);
          return;
        }
        fs.copyFileSync(source, path.join(targetRoot, file));
      });
    });
    if (missing.length) {
      throw new Error(`Missing Fluent icons in package:\n${missing.join("\n")}`);
    }
    fluent.write(fluent.manifest(items));
    console.log(`fluent: synced ${required.size} svg files`);
  },
  check() {
    const manifestFile = fluent.path.manifest();
    if (!fs.existsSync(manifestFile)) {
      throw new Error("Missing Fluent icon manifest. Run npm run fluent:sync.");
    }
    const expected = fluent.expected();
    const current = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
    const wanted = JSON.stringify(fluent.manifest(expected));
    if (JSON.stringify(current) !== wanted) {
      throw new Error("Fluent icon manifest is stale. Run npm run fluent:sync.");
    }
    const missing = expected.flatMap((item) =>
      item.files
        .filter((file) => !fs.existsSync(path.join(fluent.path.target(), file)))
        .map((file) => `${item.name}: ${file}`),
    );
    if (missing.length) {
      throw new Error(`Missing vendored Fluent SVG:\n${missing.join("\n")}`);
    }
    console.log("fluent: ok");
  },
  run() {
    const mode = process.argv[2] || "check";
    if (mode === "sync") return fluent.sync();
    if (mode === "check") return fluent.check();
    throw new Error(`Unknown fluent mode: ${mode}`);
  },
};

if (require.main === module) {
  try {
    fluent.run();
  } catch (error) {
    console.error(error.message || error);
    process.exitCode = 1;
  }
}

module.exports = fluent;
