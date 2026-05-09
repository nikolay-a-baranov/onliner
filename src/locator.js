import { vpn } from "./core/admin.js";

(async () => {
  const parse = (html) => new DOMParser().parseFromString(html, "text/html");
  const text = {
    normalize(value) {
      return value.replace(/\s+/g, " ").trim();
    },
    select() {
      return text.normalize(window.getSelection().toString()).slice(0, 400);
    },
    chunks(value) {
      const string = text.normalize(value);
      if (string.length <= 160) return [string];
      return [
        string,
        string.slice(0, 160),
        string.slice(
          Math.max(0, Math.floor(string.length / 2) - 80),
          Math.floor(string.length / 2) + 80,
        ),
        string.slice(-160),
      ].filter((item) => item.length >= 8);
    },
  };
  const admin = {
    page() {
      return (
        location.pathname.includes("/wp-admin/post.php") &&
        new URLSearchParams(location.search).get("action") === "edit"
      );
    },
    edit(url, id) {
      const section = new URL(url).hostname.split(".")[0];
      return `https://${section}.onliner.by/wp-admin/post.php?post=${id}&action=edit`;
    },
  };
  const clipboard = {
    async read(limit = 0) {
      try {
        const value = await navigator.clipboard.readText();
        return limit ? value.slice(0, limit) : value;
      } catch {
        return "";
      }
    },
  };
  const link = {
    article(value) {
      return /^https?:\/\/[a-z0-9-]+\.onliner\.by\/(?:comments\/)?\d{4}\/\d{2}\/\d{2}\/[^/?#]+\/?/i.test(
        value,
      );
    },
    parse(value) {
      return (
        value.match(
          /https?:\/\/[a-z0-9-]+\.onliner\.by\/(?:comments\/)?\d{4}\/\d{2}\/\d{2}\/[^\s"'<>]+/i,
        )?.[0] || ""
      ).replace(/[),.;:!?]+$/g, "");
    },
    current() {
      return link.article(location.href) ? location.href : "";
    },
    async get() {
      return link.current() || link.parse(await clipboard.read());
    },
  };
  const article = {
    id(doc) {
      return (
        doc.querySelector(".news-container[data-post-id]")?.dataset.postId ||
        doc.querySelector("[data-post-id]")?.dataset.postId ||
        doc.documentElement.innerHTML.match(
          /data-post-id=["'](\d+)["']/,
        )?.[1] ||
        ""
      );
    },
    async load(url) {
      if (link.current()) return document;
      const html = await fetch(url, { credentials: "include" }).then(
        (response) => response.text(),
      );
      return parse(html);
    },
  };
  const memory = {
    key(id) {
      return `locator:${location.hostname}:${id}`;
    },
    save(id, value) {
      if (!value) return;
      localStorage.setItem(memory.key(id), value);
    },
    load() {
      const id = new URLSearchParams(location.search).get("post");
      return localStorage.getItem(memory.key(id)) || "";
    },
  };
  const editor = {
    find(content, value) {
      const source = content.value.toLowerCase();
      return text
        .chunks(value)
        .map((chunk) => ({
          index: source.indexOf(chunk.toLowerCase()),
          length: chunk.length,
        }))
        .find((item) => item.index >= 0);
    },
    pick(value) {
      const content = document.querySelector("#content");
      if (!content || !value) return;
      const found = editor.find(content, value);
      if (!found) return;
      content.focus();
      content.selectionStart = found.index;
      content.selectionEnd = found.index + found.length;
      content.scrollIntoView({ block: "center" });
    },
    async run() {
      editor.pick(
        memory.load() ||
          text.normalize(await clipboard.read(256)) ||
          prompt("Что ищем??", "") ||
          "",
      );
    },
  };
  const locator = {
    async vpn() {
      await vpn.ensure().catch(() => {
        alert("🛑 VPN");
        throw new Error("vpn");
      });
    },
    async run() {
      if (admin.page()) {
        await editor.run();
        return;
      }
      const url = await link.get();
      if (!url) return;
      const doc = await article.load(url);
      const id = article.id(doc);
      if (!id) return;
      memory.save(id, text.select());
      await locator.vpn();
      const tab = open("about:blank", "_blank");
      if (tab) {
        tab.location.href = admin.edit(url, id);
        return;
      }
      location.href = admin.edit(url, id);
    },
  };
  locator.run().catch((error) => console.error(error));
})();
