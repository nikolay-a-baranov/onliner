import { cms } from "./core/cms.js";

(async () => {
  const scriptMode = /\/locator-madtest\.js(?:\?|$)/i.test(
    document.currentScript?.src || "",
  )
    ? "madtest"
    : "";
  const locatorMode = window.__locatorMode || scriptMode;
  try {
    delete window.__locatorMode;
  } catch {
    window.__locatorMode = undefined;
  }
  const mode = {
    current: String(locatorMode || "onliner").toLowerCase(),
    madtest() {
      return this.current === "madtest";
    },
  };
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
    edit(url, id, value = "") {
      const section = new URL(url).hostname.split(".")[0];
      const hash = value ? `#locator=${encodeURIComponent(value)}` : "";
      return `https://${section}.onliner.by/wp-admin/post.php?post=${id}&action=edit${hash}`;
    },
    query() {
      return decodeURIComponent(
        location.hash.match(/locator=([^&]+)/)?.[1] || "",
      );
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
    madtestId(doc) {
      const html = doc.documentElement?.innerHTML || "";
      const normalize = (value) => text.normalize(value).replace(/['"]/g, "");
      const blocked = new Set([
        "sdk-v2",
        "sdk",
        "embed",
        "widget",
        "api",
      ]);
      const accept = (value) => {
        const id = normalize(value);
        if (!id) return "";
        if (blocked.has(id.toLowerCase())) return "";
        if (id.length < 6) return "";
        if (!/^[a-zA-Z0-9_-]+$/.test(id)) return "";
        return id;
      };
      const fromData = accept(
        html.match(/(?:class=["'][^"']*\bmadtest\b[^"']*["'][^>]*\s)?data-id=["']([a-zA-Z0-9_-]+)["']/i)?.[1] ||
          "",
      );
      if (fromData) return fromData;
      const fromConfig = accept(
        html.match(/"testId"\s*:\s*"([a-zA-Z0-9_-]+)"/i)?.[1] || "",
      );
      if (fromConfig) return fromConfig;
      const links = [...html.matchAll(/madte\.st\/([a-zA-Z0-9_-]+)/gi)]
        .map((match) => accept(match[1]))
        .filter(Boolean)
        .filter((id) => !id.toLowerCase().startsWith("sdk"));
      return links[0] || "";
    },
  };
  const editor = {
    scroll(content, index) {
      const style = getComputedStyle(content);
      const lineHeight = parseFloat(style.lineHeight) || 20;
      const top = content.value.slice(0, index).split("\n").length * lineHeight;
      content.scrollTop = Math.max(0, top - content.clientHeight / 2);
    },
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
      editor.scroll(content, found.index);
      content.scrollIntoView({ block: "center" });
    },
    async run() {
      editor.pick(
        admin.query() ||
          text.normalize(await clipboard.read(256)) ||
          prompt("Что ищем??", "") ||
          "",
      );
    },
  };
  const locator = {
    madtest: {
      open(id = "") {
        const hash = id ? `#madtest-find=${encodeURIComponent(id)}` : "";
        const url = `https://madtest.ru/app/${hash}`;
        open(url, "_blank");
      },
    },
    watch(tab, value) {
      if (!tab || !value) return;
      const started = Date.now();
      const timer = setInterval(() => {
        try {
          const content = tab.document.querySelector("#content");
          if (!content) {
            if (Date.now() - started > 10000) clearInterval(timer);
            return;
          }
          clearInterval(timer);
          const found = editor.find(content, value);
          if (!found) return;
          content.focus();
          content.selectionStart = found.index;
          content.selectionEnd = found.index + found.length;
          editor.scroll(content, found.index);
          content.scrollIntoView({ block: "center" });
        } catch {
          if (Date.now() - started > 10000) clearInterval(timer);
        }
      }, 300);
    },
    async vpn() {
      await cms.vpn.ensure().catch(() => {
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
      const testId = article.madtestId(doc);
      if (mode.madtest()) {
        if (!testId) {
          alert("Madtest id не найден в статье");
          return;
        }
        locator.madtest.open(testId);
        return;
      }
      const id = article.id(doc);
      if (!id) return;
      const value = text.select();
      await locator.vpn();
      const target = admin.edit(url, id, value);
      const tab = open(target, "_blank");
      locator.watch(tab, value);
    },
  };
  locator.run().catch((error) => console.error(error));
})();
