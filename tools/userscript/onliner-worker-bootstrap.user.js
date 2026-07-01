// ==UserScript==
// @name         Onliner Worker Bootstrap
// @namespace    onliner
// @version      2026-06-30
// @description  Auto-load Launchpad in worker tabs on *.onliner.by edit.php
// @match        https://*.onliner.by/wp-admin/edit.php*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(() => {
  const worker = {
    marker: "onliner-worker-bootstrap-script",
    param: "worker",
    baseUrl: "https://nikolay-a-baranov.github.io/onliner/dist",
    active(value = new URL(location.href)) {
      return (
        value.searchParams.get(worker.param) === "1" &&
        Boolean(window.opener)
      );
    },
    mounted(root = document) {
      return Boolean(
        root.getElementById(worker.marker) ||
        root.getElementById("launchpad-panel"),
      );
    },
    src() {
      return `${worker.baseUrl}/launchpad.js?t=${Date.now()}`;
    },
    inject(root = document) {
      if (worker.mounted(root)) return true;
      const host = root.head || root.body || root.documentElement;
      if (!host) return false;
      const script = root.createElement("script");
      script.id = worker.marker;
      script.src = worker.src();
      script.onerror = () => {
        script.remove();
        console.error(`Worker bootstrap failed: ${script.src}`);
      };
      host.append(script);
      return true;
    },
    run() {
      if (!worker.active()) return false;
      return worker.inject(document);
    },
  };
  worker.run();
})();
