import { cms } from "../cms.js";

export const createOnliner = () => {
  const text = {
    normalize(value) {
      return String(value || "").replace(/\s+/g, " ").trim();
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
  const documentParser = {
    parse(value) {
      return new DOMParser().parseFromString(String(value || ""), "text/html");
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
      return decodeURIComponent(location.hash.match(/locator=([^&]+)/)?.[1] || "");
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
        String(value || "").match(
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
    id(documentValue) {
      return (
        documentValue.querySelector(".news-container[data-post-id]")?.dataset.postId ||
        documentValue.querySelector("[data-post-id]")?.dataset.postId ||
        documentValue.documentElement.innerHTML.match(/data-post-id=["'](\d+)["']/)?.[1] ||
        ""
      );
    },
    async load(url) {
      if (link.current()) return document;
      const html = await fetch(url, { credentials: "include" }).then((response) =>
        response.text(),
      );
      return documentParser.parse(html);
    },
    madtestId(documentValue) {
      const html = documentValue.documentElement?.innerHTML || "";
      const blocked = new Set(["sdk-v2", "sdk", "embed", "widget", "api"]);
      const normalize = (value) => text.normalize(value).replace(/["']/g, "");
      const accept = (value) => {
        const id = normalize(value);
        if (!id) return "";
        if (blocked.has(id.toLowerCase())) return "";
        if (id.length < 6) return "";
        if (!/^[a-zA-Z0-9_-]+$/.test(id)) return "";
        return id;
      };
      const fromData = accept(
        html.match(
          /(?:class=["'][^"']*\bmadtest\b[^"']*["'][^>]*\s)?data-id=["']([a-zA-Z0-9_-]+)["']/i,
        )?.[1] || "",
      );
      if (fromData) return fromData;
      const fromConfig = accept(
        html.match(/"testId"\s*:\s*"([a-zA-Z0-9_-]+)"/i)?.[1] || "",
      );
      if (fromConfig) return fromConfig;
      return [...html.matchAll(/madte\.st\/([a-zA-Z0-9_-]+)/gi)]
        .map((match) => accept(match[1]))
        .filter(Boolean)
        .filter((id) => !id.toLowerCase().startsWith("sdk"))[0] || "";
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
    apply(content, value) {
      if (!content || !value) return false;
      const found = editor.find(content, value);
      if (!found) return false;
      content.focus();
      api.select(content, found.index, found.index + found.length);
      editor.scroll(content, found.index);
      content.scrollIntoView({ block: "center" });
      return true;
    },
    pick(value) {
      return editor.apply(document.querySelector("#content"), value);
    },
    async run() {
      return editor.pick(
        admin.query() ||
          text.normalize(await clipboard.read(256)) ||
          prompt("Что ищем??", "") ||
          "",
      );
    },
  };
  const wordpress = {
    madtest: {
      open(id = "") {
        const hash = id ? `#madtest-find=${encodeURIComponent(id)}` : "";
        open(`https://madtest.ru/app/${hash}`, "_blank");
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
          editor.apply(content, value);
        } catch {
          if (Date.now() - started > 10000) clearInterval(timer);
        }
      }, 300);
    },
    async vpn() {
      try {
        await cms.vpn.ensure();
        return true;
      } catch {
        alert("🛑 VPN");
        return false;
      }
    },
    async run(options = {}) {
      if (admin.page()) return editor.run();
      const url = await link.get();
      if (!url) return false;
      const documentValue = await article.load(url);
      const testId = article.madtestId(documentValue);
      if (options.mode === "madtest") {
        if (!testId) {
          alert("Madtest id не найден в статье");
          return false;
        }
        wordpress.madtest.open(testId);
        return true;
      }
      const id = article.id(documentValue);
      if (!id) return false;
      const value = text.select();
      const access = await wordpress.vpn();
      if (!access) return false;
      const tab = open(admin.edit(url, id, value), "_blank");
      wordpress.watch(tab, value);
      return true;
    },
  };
  return {
    onliner: {
      wordpress,
      madtest: {
        find: {
          run() {
            return wordpress.run({ mode: "madtest" });
          },
        },
      },
    },
  };
};
