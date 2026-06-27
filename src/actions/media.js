import { cms } from "../core/cms.js";

export const createMedia = () => {
  const frame = {
    element() {
      return document.querySelector("#TB_iframeContent");
    },
    document() {
      const element = frame.element();
      try {
        return element?.contentDocument || element?.contentWindow?.document || null;
      } catch {
        return null;
      }
    },
    close() {
      if (typeof window.tb_remove === "function") {
        window.tb_remove();
        return true;
      }
      document.querySelector("#TB_closeWindowButton")?.click?.();
      return false;
    },
  };
  const post = {
    idFrom(value = "") {
      if (!value) return "";
      try {
        const url = new URL(value, window.location.href);
        return url.searchParams.get("post_id") || url.searchParams.get("post") || "";
      } catch {
        return "";
      }
    },
    id() {
      return (
        post.idFrom(gallery.button()?.getAttribute?.("href") || "") ||
        post.idFrom(window.location.href)
      );
    },
  };
  const source = {
    document() {
      if (document.querySelector("#media-items")) return document;
      return frame.document();
    },
    ready(documentValue) {
      return Boolean(documentValue?.querySelector?.("#media-items"));
    },
    itemPostId(item) {
      const className = String(item?.className || "");
      return className.match(/(?:^|\s)child-of-(\d+)(?:\s|$)/)?.[1] || "";
    },
    items(documentValue, postId = "") {
      const items = [...documentValue.querySelectorAll("#media-items .media-item")];
      if (!postId) return items;
      return items.filter((item) => source.itemPostId(item) === String(postId));
    },
    url(item) {
      return item.querySelector(".urlfile")?.dataset?.linkUrl || "";
    },
    filename(value = "") {
      return (
        String(value || "").match(/\/([^/]+\.(?:jpe?g|png|webp|gif))$/i)?.[1] || ""
      );
    },
  };
  const gallery = {
    button() {
      return document.querySelector("#content-add_media");
    },
    is(documentValue) {
      if (!documentValue) return false;
      const location = String(documentValue.location?.href || "");
      return Boolean(
        documentValue.querySelector("#gallery-form") ||
        documentValue.querySelector("#tab-gallery .current") ||
        /[?&]tab=gallery(?:&|$)/.test(location),
      );
    },
    link(documentValue) {
      return (
        documentValue
          ?.querySelector?.('#tab-gallery a[href*="tab=gallery"]')
          ?.getAttribute?.("href") || ""
      );
    },
    navigate(documentValue) {
      const href = gallery.link(documentValue);
      const view = documentValue?.defaultView;
      if (!href || !view) return false;
      try {
        view.location.href = new URL(href, view.location.href).href;
        return true;
      } catch {
        return false;
      }
    },
    url() {
      const href = gallery.button()?.getAttribute?.("href") || "";
      if (!href) return "";
      try {
        const url = new URL(href, window.location.href);
        url.searchParams.set("type", "image");
        url.searchParams.set("tab", "gallery");
        url.searchParams.set("TB_iframe", "1");
        if (!url.searchParams.get("width")) url.searchParams.set("width", "640");
        if (!url.searchParams.get("height")) url.searchParams.set("height", "806");
        return url.href;
      } catch {
        return "";
      }
    },
    popupUrl() {
      const url = gallery.url();
      if (!url) return "";
      try {
        const value = new URL(url);
        return `${value.pathname}${value.search}`;
      } catch {
        return url;
      }
    },
    async fetchDocument() {
      const url = gallery.url();
      if (!url) return null;
      try {
        const response = await fetch(url, { credentials: "same-origin" });
        if (!response.ok) return null;
        const html = await response.text();
        return new DOMParser().parseFromString(html, "text/html");
      } catch {
        return null;
      }
    },
    open() {
      const url = gallery.popupUrl();
      if (!url) return false;
      if (typeof window.tb_show === "function") {
        window.tb_show("", url, false);
        return true;
      }
      window.open(url, "_blank", "noopener,noreferrer");
      return false;
    },
  };
  const wait = {
    galleryDocument({ attempts = 60, delay = 250 } = {}) {
      return new Promise((resolve) => {
        let current = 0;
        let navigated = false;
        const tick = () => {
          const documentValue = source.document();
          if (gallery.is(documentValue) && source.ready(documentValue)) {
            resolve(documentValue);
            return;
          }
          if (documentValue && !gallery.is(documentValue) && !navigated) {
            navigated = gallery.navigate(documentValue);
          }
          current += 1;
          if (current >= attempts) {
            resolve(null);
            return;
          }
          window.setTimeout(tick, delay);
        };
        tick();
      });
    },
  };
  const image = {
    html(filename = "") {
      if (!filename) return "";
      return `<img class="aligncenter" src="https://content.onliner.by/news/1200x5616/${filename}" alt="" />`;
    },
    filename(item) {
      return source.filename(source.url(item));
    },
    filenames(documentValue, postId = "") {
      const seen = new Set();
      return source
        .items(documentValue, postId)
        .map(image.filename)
        .filter((filename) => {
          if (!filename || seen.has(filename)) return false;
          seen.add(filename);
          return true;
        });
    },
  };
  const editor = {
    filenames(value = "") {
      const seen = new Set();
      const matches = String(value || "").matchAll(
        /content\.onliner\.by\/news\/[^\s"'<>]+\/([^\s"'<>/]+\.(?:jpe?g|png|webp|gif))/gi,
      );
      [...matches].forEach((match) => {
        if (match[1]) seen.add(match[1]);
      });
      return seen;
    },
    append(current = "", value = "") {
      if (!value) return current;
      const separator = String(current || "").trim() ? "\n\n" : "";
      return `${current}${separator}${value}`;
    },
    insert(filenames = []) {
      const list = filenames.filter(Boolean);
      if (!list.length) return false;
      let changed = false;
      cms.editor.runContent((current) => {
        const existing = editor.filenames(current);
        const html = list
          .filter((filename) => !existing.has(filename))
          .map(image.html)
          .join("\n\n");
        const next = editor.append(current, html);
        changed = next !== current;
        return next;
      });
      return changed;
    },
  };
  const insert = {
    async galleryDocument() {
      const fetched = await gallery.fetchDocument();
      if (gallery.is(fetched) && source.ready(fetched)) return fetched;
      if (!gallery.open()) return null;
      return wait.galleryDocument();
    },
    async document() {
      const current = source.document();
      if (gallery.is(current) && source.ready(current)) return current;
      return insert.galleryDocument();
    },
    async run() {
      const postId = post.id();
      const documentValue = await insert.document();
      if (!documentValue) {
        alert("Медиа не найдены: не удалось открыть галерею");
        return false;
      }
      const filenames = image.filenames(documentValue, postId);
      if (!filenames.length) {
        alert("Картинки не найдены");
        return false;
      }
      const done = editor.insert(filenames);
      if (!done) {
        alert("Новых картинок нет");
        return false;
      }
      frame.close();
      return true;
    },
  };
  return {
    media: {
      insert,
    },
  };
};
