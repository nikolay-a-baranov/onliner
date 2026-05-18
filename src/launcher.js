import { frame } from "./core/panel.js";
import { css } from "./core/css.js";

(() => {
  const launcher = {
    id: "bml-launcher-panel",
    skin: "bml-launcher-style",
    tools: [
      { id: "cleanup", title: "\uD83E\uDDF9", file: "cleanup.js" },
      { id: "proofread", title: "\uD83E\uDDFF", file: "proofread.js" },
      { id: "editor", title: "\u270F\uFE0F", file: "editor.js" },
      { id: "lead", title: "\uD83D\uDCAC", file: "lead.js" },
      { id: "locator", title: "\uD83C\uDFAF", file: "locator.js" },
      { id: "schedule", title: "\uD83D\uDDD3", file: "schedule.js" },
      { id: "reader", title: "\uD83D\uDD76\uFE0F", file: "reader.js" },
      { id: "toc", title: "\uD83E\uDDED", file: "toc.js" },
      { id: "update", title: "\uD83C\uDD99", file: "update.js" },
      { id: "publish", title: "\uD83D\uDE80", file: "publish.js" },
      { id: "readmore", title: "\uD83D\uDCDA", file: "readmore.js" },
      { id: "sanitize", title: "\uD83E\uDDA0", file: "sanitize.js" },
    ],
    state: {
      manifest: null,
    },
    node: {
      panel() {
        return document.getElementById(launcher.id);
      },
      status() {
        return launcher.node.panel()?.querySelector("[data-bml-status]");
      },
    },
    theme() {
      return "light";
    },
    baseUrl() {
      const current = document.currentScript;
      if (current?.src) return new URL(".", current.src);
      const fallback = [...document.querySelectorAll("script[src]")].find(
        (script) => /\/dist\/launcher\.js(?:\?|$)/.test(script.src),
      );
      return new URL(".", fallback?.src || location.href);
    },
    setStatus(string = "") {
      const node = launcher.node.status();
      if (!node) return;
      node.textContent = string;
    },
    html() {
      return `
<header class="launcher-head">
  <button type="button" class="button button-emoji launcher-close" data-bml-close title="Close">\u274C</button>
</header>
<section class="launcher-section">
  <div class="launcher-row">
  ${launcher.tools
    .map(
      (tool) =>
        `<button type="button" class="button button-text launcher-button" data-bml-button data-bml-type="tool" data-bml-id="${tool.id}">${tool.title}</button>`,
    )
    .join("")}
  </div>
</section>
<p class="launcher-status" data-bml-status></p>`;
    },
    mount() {
      frame.mount(launcher.skin, css.launcher.panel());
      const panel = frame.create({
        id: launcher.id,
        className: "panel launcher-panel",
        place: "right",
        html: launcher.html(),
      });
      panel.dataset.theme = launcher.theme();
      launcher.bind();
    },
    unmount() {
      launcher.node.panel()?.remove();
    },
    manifest() {
      if (launcher.state.manifest)
        return Promise.resolve(launcher.state.manifest);
      const url = new URL("manifest.json", launcher.baseUrl()).href;
      return fetch(url, { cache: "no-store" })
        .then((response) => {
          if (!response.ok) throw new Error("manifest");
          return response.json();
        })
        .then((data) => {
          launcher.state.manifest = data || {};
          return launcher.state.manifest;
        })
        .catch(() => {
          launcher.state.manifest = {};
          return launcher.state.manifest;
        });
    },
    version(file, manifest) {
      return manifest?.[file]?.version || String(Date.now());
    },
    toolUrl(file, manifest) {
      return new URL(
        `${file}?v=${launcher.version(file, manifest)}`,
        launcher.baseUrl(),
      ).href;
    },
    load(src) {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(src));
        (document.head || document.body || document.documentElement).append(
          script,
        );
      });
    },
    runFiles(files) {
      launcher.setStatus("Loading...");
      return launcher
        .manifest()
        .then((manifest) =>
          files.reduce(
            (chain, file) =>
              chain.then(() => launcher.load(launcher.toolUrl(file, manifest))),
            Promise.resolve(),
          ),
        )
        .then(() => launcher.setStatus(""))
        .catch(() => launcher.setStatus("🛑 Loader"));
    },
    runTool(id) {
      const tool = launcher.tools.find((item) => item.id === id);
      if (!tool) return;
      launcher.runFiles([tool.file]);
    },
    click(event) {
      if (event.target.closest("[data-bml-close]")) {
        launcher.unmount();
        return;
      }
      const button = event.target.closest("[data-bml-button]");
      if (!button) return;
      const type = button.getAttribute("data-bml-type");
      const id = button.getAttribute("data-bml-id");
      if (type === "tool") launcher.runTool(id);
    },
    bind() {
      launcher.node.panel()?.addEventListener("click", launcher.click);
    },
    run() {
      if (launcher.node.panel()) {
        launcher.unmount();
        return;
      }
      launcher.mount();
    },
  };

  launcher.run();
})();
