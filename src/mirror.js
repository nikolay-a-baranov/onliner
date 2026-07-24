import { cms } from "./core/cms.js";

(() => {
  const mirror = {
    id: "launchpad-mirror",
    active() {
      return Boolean(document.getElementById(mirror.id));
    },
    source() {
      return cms.editor.syncToTextarea()?.value || "";
    },
    frame(html) {
      const documentSource = [
        "<!doctype html>",
        '<html lang="ru">',
        "<head>",
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width,initial-scale=1">',
        "<style>",
        "html{background:#fff;color:#111;font:18px/1.6 Arial,sans-serif}",
        "body{box-sizing:border-box;margin:0 auto;max-width:970px;padding:48px 32px 96px}",
        "img,video,iframe{display:block;height:auto;max-width:100%}",
        "table{border-collapse:collapse;max-width:100%;width:100%}",
        "td,th{border:1px solid #ddd;padding:8px;text-align:left}",
        "blockquote{border-left:4px solid #ddd;margin-left:0;padding-left:20px}",
        "</style>",
        "</head>",
        `<body>${html}</body>`,
        "</html>",
      ].join("");
      const frame = document.createElement("iframe");
      frame.setAttribute("title", "Mirror");
      frame.setAttribute("sandbox", "allow-same-origin");
      frame.srcdoc = documentSource;
      return frame;
    },
    close() {
      document.getElementById(mirror.id)?.remove();
      document.documentElement.style.removeProperty("overflow");
      return true;
    },
    open() {
      const root = document.createElement("div");
      const bar = document.createElement("div");
      const title = document.createElement("strong");
      const close = document.createElement("button");
      const frame = mirror.frame(mirror.source());
      root.id = mirror.id;
      root.style.cssText = "position:fixed;inset:0;z-index:2147483647;display:grid;grid-template-rows:auto 1fr;background:#f2f2f2";
      bar.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 14px;background:#111;color:#fff;font:14px/1.2 Arial,sans-serif";
      title.textContent = "Mirror · текущее содержимое редактора";
      close.type = "button";
      close.textContent = "Закрыть";
      close.style.cssText = "border:0;border-radius:6px;padding:7px 10px;cursor:pointer";
      frame.style.cssText = "width:100%;height:100%;border:0;background:#fff";
      close.addEventListener("click", mirror.close, { once: true });
      bar.append(title, close);
      root.append(bar, frame);
      document.documentElement.style.setProperty("overflow", "hidden");
      document.body.append(root);
      return true;
    },
    run() {
      return mirror.active() ? mirror.close() : mirror.open();
    },
  };
  mirror.run();
})();
