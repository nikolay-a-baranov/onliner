const fs = require("fs");
const path = require("path");

const secrets = {
  path: {
    root: path.resolve(__dirname, ".."),
    local() {
      return path.join(secrets.path.root, "secrets.local.json");
    },
  },
  read() {
    const file = secrets.path.local();
    if (!fs.existsSync(file)) {
      throw new Error("Missing secrets.local.json. Copy secrets.local.example.json first.");
    }
    return JSON.parse(fs.readFileSync(file, "utf8"));
  },
  pick(value) {
    const key = String(value?.proofread?.qwen?.key || "").trim();
    const models = Array.isArray(value?.proofread?.qwen?.models)
      ? value.proofread.qwen.models.map((item) => String(item || "").trim()).filter(Boolean)
      : ["qwen-plus", "qwen-turbo"];
    if (!key) throw new Error("Missing proofread.qwen.key in secrets.local.json.");
    return { key, models };
  },
  command({ key, models }) {
    const safeKey = JSON.stringify(key);
    const safeModels = JSON.stringify(models.join(","));
    return [
      `localStorage.setItem("proofread-key-qwen", ${safeKey});`,
      `localStorage.setItem("proofread-models-qwen", ${safeModels});`,
      `localStorage.setItem("proofread-qwen-key", ${safeKey});`,
      `console.log("Qwen key saved for proofread.");`,
    ].join(" ");
  },
  run() {
    const value = secrets.read();
    const picked = secrets.pick(value);
    console.log("Local secrets loaded from secrets.local.json.");
    console.log("Copy this line to browser DevTools Console on the CMS page:");
    console.log("");
    console.log(secrets.command(picked));
  },
};

try {
  secrets.run();
} catch (error) {
  console.error(error.message || String(error));
  process.exitCode = 1;
}
