import { cms } from "../core/cms.js";

export const createMedia = () => {
  const state = { upload: false };
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
        post.idFrom(media.button()?.getAttribute?.("href") || "") ||
        post.idFrom(window.location.href)
      );
    },
  };
  const media = {
    button() {
      return document.querySelector("#content-add_media");
    },
    url(tab = "gallery") {
      const href = media.button()?.getAttribute?.("href") || "";
      if (!href) return "";
      try {
        const url = new URL(href, window.location.href);
        url.searchParams.set("type", "image");
        url.searchParams.set("tab", tab);
        url.searchParams.set("TB_iframe", "1");
        if (!url.searchParams.get("width")) url.searchParams.set("width", "640");
        if (!url.searchParams.get("height")) url.searchParams.set("height", "806");
        return url.href;
      } catch {
        return "";
      }
    },
    popupUrl(tab = "gallery") {
      const url = media.url(tab);
      if (!url) return "";
      try {
        const value = new URL(url);
        return `${value.pathname}${value.search}`;
      } catch {
        return url;
      }
    },
    open(tab = "gallery") {
      const url = media.popupUrl(tab);
      if (!url) return false;
      if (typeof window.tb_show === "function") {
        window.tb_show("", url, false);
        return true;
      }
      window.open(url, "_blank", "noopener,noreferrer");
      return false;
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
    async fetchDocument() {
      const url = media.url("gallery");
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
    uploadDocument({ attempts = 60, delay = 250 } = {}) {
      return new Promise((resolve) => {
        let current = 0;
        const tick = () => {
          const documentValue = frame.document();
          if (documentValue?.querySelector?.("#media-items")) {
            resolve(documentValue);
            return;
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
    uploadDone(documentValue, postId = "", baseline = new Set(), { attempts = 240, delay = 500, quiet = 3 } = {}) {
      return new Promise((resolve) => {
        let current = 0;
        let quietCount = 0;
        let lastKey = "";
        const tick = () => {
          const filenames = image
            .filenames(documentValue, postId)
            .filter((filename) => !baseline.has(filename));
          const key = filenames.join("|");
          const busy = upload.busy(documentValue);
          quietCount = key && key === lastKey && !busy ? quietCount + 1 : 0;
          lastKey = key;
          if (filenames.length && quietCount >= quiet) {
            resolve(filenames);
            return;
          }
          current += 1;
          if (current >= attempts) {
            resolve(filenames);
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
    existing() {
      return editor.filenames(document.querySelector("#content")?.value || "");
    },
  };
  const upload = {
    style(documentValue) {
      if (!documentValue || documentValue.getElementById("media-upload-flow-style")) return;
      const style = documentValue.createElement("style");
      style.id = "media-upload-flow-style";
      style.textContent = `
        #media-upload-header,#gallery-settings,#save,#insertall,#invertall,.media-item .slidetoggle,.describe-toggle-on,.describe-toggle-off{display:none!important;}
        body{background:#f6f7f7!important;}
        #media-upload{padding:16px!important;}
        #plupload-upload-ui,#html-upload-ui{display:block!important;margin:0!important;padding:0!important;}
        #drag-drop-area{min-height:160px!important;border-radius:14px!important;}
        .media-item{max-width:none!important;}
      `;
      documentValue.head?.appendChild?.(style);
    },
    watermark(documentValue) {
      const fields = [
        ...documentValue.querySelectorAll('input[type="checkbox"][name*="watermark"],input[type="checkbox"][id*="watermark"]'),
      ];
      fields.forEach((field) => {
        field.checked = true;
        field.closest?.("tr,p,label,div")?.style?.setProperty?.("display", "none", "important");
      });
    },
    busy(documentValue) {
      return Boolean(
        documentValue?.querySelector?.(
          ".uploading,.media-item.uploading,.media-item .progress,.media-item .bar,.media-item .filename.original",
        ),
      );
    },
    async open() {
      if (!media.open("type")) return null;
      const documentValue = await wait.uploadDocument();
      if (!documentValue) return null;
      upload.style(documentValue);
      upload.watermark(documentValue);
      return documentValue;
    },
    async run(baseline = new Set()) {
      const postId = post.id();
      const documentValue = await upload.open();
      if (!documentValue) {
        alert("Не удалось открыть загрузку");
        return false;
      }
      const uploaded = await wait.uploadDone(documentValue, postId, baseline);
      if (!uploaded.length) return false;
      return insert.gallery({ alertEmpty: false, close: true });
    },
  };
  const customGallery = {
    textarea() {
      cms.editor.runContent((value) => value);
      return document.querySelector("#content");
    },
    emit(target) {
      if (!target) return;
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
    },
    replace(target, start, end, value = "") {
      const sourceValue = target.value || "";
      const next = `${sourceValue.slice(0, start)}${value}${sourceValue.slice(end)}`;
      if (next === sourceValue) return false;
      target.value = next;
      target.selectionStart = start;
      target.selectionEnd = start + value.length;
      target.focus();
      customGallery.emit(target);
      cms.editor.runContent((current) => current);
      return true;
    },
    imageSrcs(value = "") {
      return [...String(value || "").matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
        .map((match) => match[1])
        .filter(Boolean);
    },
    imageHtml(src = "") {
      if (!src) return "";
      return `<img class="aligncenter" src="${src}" alt="" />`;
    },
    galleryHtml(srcs = []) {
      const items = srcs.map((src) => ({ src, caption: "" }));
      return `[onliner-gallery]${JSON.stringify(items)}[/onliner-gallery]`;
    },
    galleryItems(value = "") {
      try {
        const items = JSON.parse(String(value || ""));
        if (!Array.isArray(items)) return [];
        return items
          .map((item) => ({ src: String(item?.src || ""), caption: String(item?.caption || "") }))
          .filter((item) => item.src);
      } catch {
        return [];
      }
    },
    splitHtml(value = "") {
      return customGallery
        .galleryItems(value)
        .map((item) => customGallery.imageHtml(item.src))
        .filter(Boolean)
        .join("\n\n");
    },
    selected(target) {
      const value = target.value || "";
      const start = target.selectionStart ?? 0;
      const end = target.selectionEnd ?? start;
      if (end <= start) return null;
      return { start, end, text: value.slice(start, end) };
    },
    containingGallery(target) {
      const value = target.value || "";
      const cursor = target.selectionStart ?? 0;
      const pattern = /\[onliner-gallery\]([\s\S]*?)\[\/onliner-gallery\]/gi;
      for (const match of value.matchAll(pattern)) {
        const start = match.index ?? 0;
        const end = start + match[0].length;
        if (start <= cursor && cursor <= end) {
          return { start, end, json: match[1], text: match[0] };
        }
      }
      return null;
    },
    asGallery(target) {
      const selection = customGallery.selected(target);
      if (!selection) return false;
      const srcs = customGallery.imageSrcs(selection.text);
      if (!srcs.length) return false;
      return customGallery.replace(
        target,
        selection.start,
        selection.end,
        customGallery.galleryHtml(srcs),
      );
    },
    asImages(target) {
      const selection = customGallery.selected(target);
      const selectedMatch = selection?.text?.match?.(/^\s*\[onliner-gallery\]([\s\S]*?)\[\/onliner-gallery\]\s*$/i);
      const current = selectedMatch
        ? { start: selection.start, end: selection.end, json: selectedMatch[1] }
        : customGallery.containingGallery(target);
      if (!current) return false;
      const html = customGallery.splitHtml(current.json);
      if (!html) return false;
      return customGallery.replace(target, current.start, current.end, html);
    },
    run() {
      const target = customGallery.textarea();
      if (!target) return false;
      if (customGallery.asImages(target)) return true;
      if (customGallery.asGallery(target)) return true;
      alert("Выделите картинки или поставьте курсор в галерею");
      return false;
    },
  };
  const insert = {
    async galleryDocument() {
      const fetched = await gallery.fetchDocument();
      if (gallery.is(fetched) && source.ready(fetched)) return fetched;
      if (!media.open("gallery")) return null;
      return wait.galleryDocument();
    },
    async document() {
      const current = source.document();
      if (gallery.is(current) && source.ready(current)) return current;
      return insert.galleryDocument();
    },
    async gallery({ alertEmpty = true, close = true } = {}) {
      const postId = post.id();
      const documentValue = await insert.document();
      if (!documentValue) {
        if (alertEmpty) alert("Медиа не найдены: не удалось открыть галерею");
        return false;
      }
      const filenames = image.filenames(documentValue, postId);
      if (!filenames.length) {
        if (alertEmpty) alert("Картинки не найдены");
        return false;
      }
      const done = editor.insert(filenames);
      if (!done) {
        if (alertEmpty) alert("Новых картинок нет");
        return false;
      }
      if (close) frame.close();
      return true;
    },
    active() {
      return state.upload;
    },
    async run() {
      if (state.upload) return false;
      state.upload = true;
      try {
        const baseline = editor.existing();
        if (await insert.gallery({ alertEmpty: false, close: true })) return true;
        return upload.run(baseline);
      } finally {
        state.upload = false;
      }
    },
  };
  return {
    media: {
      upload: insert,
      gallery: customGallery,
      insert,
    },
  };
};
