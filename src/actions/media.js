import { cms } from "../core/cms.js";
import { host } from "../core/surface/host.js";
import { icon } from "../core/surface/icon.js";
import { toolbar } from "../core/surface/toolbar.js";
import { ui } from "../core/surface/ui.js";

export const createMedia = () => {
  const timing = {
    openAttempts: 60,
    openDelay: 250,
    uploadAttempts: 240,
    uploadDelay: 500,
    uploadQuiet: 3,
    galleryAttempts: 20,
    galleryDelay: 750,
  };
  const state = {
    upload: false,
    phase: "idle",
    watermark: true,
    cancelled: false,
    theme: "dark",
  };
  const frame = {
    element() {
      return document.querySelector("#TB_iframeContent");
    },
    document() {
      const element = frame.element();
      try {
        return (
          element?.contentDocument || element?.contentWindow?.document || null
        );
      } catch {
        return null;
      }
    },
    cleanup() {
      document.getElementById("media-upload-flow-control")?.remove?.();
      document.getElementById("media-thumb-flow-control")?.remove?.();
      document.getElementById("media-thumb-flow-parent-style")?.remove?.();
      document.getElementById("media-upload-flow-parent-style")?.remove?.();
      document
        .querySelector("#TB_window")
        ?.classList?.remove?.("media-upload-flow-hidden-engine");
      document.body?.classList?.remove?.("media-upload-flow-open");
    },
    hide() {
      if (!document.getElementById("media-upload-flow-parent-style")) {
        const style = document.createElement("style");
        style.id = "media-upload-flow-parent-style";
        style.textContent = `
          body.media-upload-flow-open #TB_overlay{display:none!important;opacity:0!important;pointer-events:none!important;}
          body.media-upload-flow-open #TB_window.media-upload-flow-hidden-engine{position:fixed!important;left:-10000px!important;top:-10000px!important;width:1px!important;height:1px!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important;}
          body.media-upload-flow-open #TB_window.media-upload-flow-hidden-engine iframe{width:1px!important;height:1px!important;}
          #media-upload-flow-control{position:fixed!important;z-index:2147483647!important;width:max-content!important;max-width:calc(100vw - 24px)!important;cursor:grab!important;pointer-events:auto!important;}
          #media-upload-flow-control,#media-upload-flow-control *{box-sizing:border-box!important;}
          #media-upload-flow-control .toolbar-icon{width:24px!important;height:24px!important;}
          #media-upload-flow-control .ui-icon-content img.toolbar-icon{display:block!important;}
          #media-upload-flow-control .media-upload-flow-marker .emoji,#media-upload-flow-control .media-upload-flow-marker img.emoji{width:24px!important;height:24px!important;font-size:24px!important;}
        `;
        document.head?.appendChild?.(style);
      }
      document.body?.classList?.add?.("media-upload-flow-open");
      document
        .querySelector("#TB_window")
        ?.classList?.add?.("media-upload-flow-hidden-engine");
    },
    close() {
      if (typeof window.tb_remove === "function") {
        window.tb_remove();
        frame.cleanup();
        return true;
      }
      document.querySelector("#TB_closeWindowButton")?.click?.();
      frame.cleanup();
      return false;
    },
  };
  const post = {
    idFrom(value = "") {
      if (!value) return "";
      try {
        const url = new URL(value, window.location.href);
        return (
          url.searchParams.get("post_id") || url.searchParams.get("post") || ""
        );
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
        if (!url.searchParams.get("width"))
          url.searchParams.set("width", "640");
        if (!url.searchParams.get("height"))
          url.searchParams.set("height", "806");
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
      const items = [
        ...documentValue.querySelectorAll("#media-items .media-item"),
      ];
      if (!postId) return items;
      return items.filter((item) => source.itemPostId(item) === String(postId));
    },
    url(item) {
      return item.querySelector(".urlfile")?.dataset?.linkUrl || "";
    },
    filename(value = "") {
      return (
        String(value || "").match(/\/([^/]+\.(?:jpe?g|png|webp|gif))$/i)?.[1] ||
        ""
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
    uploadDocument({
      attempts = timing.openAttempts,
      delay = timing.openDelay,
    } = {}) {
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
    uploadDone(
      documentValue,
      postId = "",
      baseline = new Set(),
      {
        attempts = timing.uploadAttempts,
        delay = timing.uploadDelay,
        quiet = timing.uploadQuiet,
      } = {},
    ) {
      return new Promise((resolve) => {
        let current = 0;
        let quietCount = 0;
        let lastKey = "";
        const tick = () => {
          if (state.cancelled) {
            resolve([]);
            return;
          }
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
            resolve(filenames.length && !busy ? filenames : []);
            return;
          }
          window.setTimeout(tick, delay);
        };
        tick();
      });
    },
  };
  const image = {
    src(filename = "") {
      if (!filename) return "";
      return `https://content.onliner.by/news/1200x5616/${filename}`;
    },
    html(filename = "") {
      const src = image.src(filename);
      if (!src) return "";
      return `<img class="aligncenter" src="${src}" alt="" />`;
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
    place(current = "", value = "", options = {}) {
      if (!value) return current;
      if (options.distribute) {
        const next = distribute.place(current, value);
        return next || editor.append(current, value);
      }
      const next = distribute.run(current, value);
      return next || editor.append(current, value);
    },
    html(filenames = []) {
      const srcs = filenames.map(image.src).filter(Boolean);
      if (
        srcs.length >= 5 &&
        window.confirm(customGallery.randomMessage(srcs.length))
      ) {
        return customGallery.mixedHtml(srcs);
      }
      return filenames.map(image.html).filter(Boolean).join("\n\n");
    },
    insert(filenames = []) {
      const list = filenames.filter(Boolean);
      if (!list.length) return false;
      let changed = false;
      cms.editor.runContent((current) => {
        const existing = editor.filenames(current);
        const filenames = list.filter((filename) => !existing.has(filename));
        const scattered = distribute.offer(current, filenames.length);
        const html = editor.html(filenames);
        const next = scattered
          ? editor.place(current, html, { distribute: true })
          : editor.append(current, html);
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
      if (
        !documentValue ||
        documentValue.getElementById("media-upload-flow-style")
      )
        return;
      const style = documentValue.createElement("style");
      style.id = "media-upload-flow-style";
      style.textContent = `
        html,body{background:transparent!important;margin:0!important;min-height:0!important;overflow:hidden!important;}
        body > *{position:absolute!important;left:-10000px!important;top:0!important;width:1px!important;height:1px!important;max-width:1px!important;max-height:1px!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important;}
        #plupload-upload-ui,#html-upload-ui,#media-items,#file-form,#image-form{display:block!important;}
      `;
      documentValue.head?.appendChild?.(style);
    },
    glyph(name = "", fallback = name) {
      return ui.controls.glyph(name, 20, fallback || name);
    },
    icon(name = "", fallback = name) {
      return ui.controls.icon(upload.glyph(name, fallback));
    },
    marker() {
      return ui.controls.button({
        content: icon.emoji("framed-picture"),
        action: "place",
        title: "Долив",
        classes: "media-upload-flow-marker",
        attrs: ' type="button" aria-label="Долив"',
      });
    },
    panel() {
      const watermark = ui.controls.button({
        fluent: "Checkbox Checked",
        fallback: "Checkmark Square",
        size: 20,
        classes: "media-upload-flow-watermark",
        title: "Водяной",
        attrs:
          ' type="button" data-action="watermark" data-watermark-toggle aria-label="Водяной" aria-pressed="true"',
      });
      const choose = ui.controls.button({
        fluent: "Image Add",
        fallback: "Image",
        size: 20,
        classes: "media-upload-flow-choose",
        title: "Загрузить",
        attrs:
          ' type="button" data-action="choose" data-media-upload-choose aria-label="Загрузить"',
      });
      const actions = ui.shell.strip(`${watermark}${choose}`, {
        classes: "media-upload-flow-actions",
      });
      const left = ui.shell.group(upload.marker(), {
        stick: "left",
        rail: true,
      });
      const right = ui.controls.chrome({
        theme: state.theme || "dark",
        group: {
          stick: "right",
          rail: true,
        },
      });
      return ui.shell.frame({ left, main: actions, right });
    },
    control(documentValue) {
      if (!documentValue) return;
      frame.hide();
      let root = document.getElementById("media-upload-flow-control");
      if (!root) {
        root = document.createElement("div");
        root.id = "media-upload-flow-control";
        root.className = "panel media-upload-flow-panel";
        root.dataset.uiSurface = "toolbar";
        root.dataset.uiFrame = "capsule";
        root.dataset.toolbarCapsule = "true";
        root.dataset.toolbarFlow = "rail";
        root.dataset.dock = "floating";
        root.dataset.panelDraggable = "true";
        root.dataset.layout = "floating";
        root.dataset.theme = state.theme || "dark";
        upload.shape(root);
        root.innerHTML = upload.panel();
        document.body?.appendChild?.(root);
        upload.place(root);
      }
      root.dataset.theme = state.theme || "dark";
      upload.shape(root);
      upload.bind(root);
      upload.watermark(documentValue, state.watermark);
    },
    shape(root) {
      if (!root) return;
      root.style.setProperty(
        "--surface-toolbar-media-size",
        "calc(var(--surface-button-size) * 0.88)",
      );
      root.style.setProperty(
        "--surface-emoji-icon-size",
        "var(--surface-toolbar-media-size)",
      );
      root.style.setProperty(
        "--surface-toolbar-icon-size",
        "var(--surface-toolbar-media-size)",
      );
      root.style.setProperty(
        "--surface-toolbar-logo-size",
        "var(--surface-toolbar-media-size)",
      );
    },
    place(root) {
      if (!root) return;
      const saved = upload.position();
      const set = (left, top) => {
        root.style.setProperty("left", `${left}px`, "important");
        root.style.setProperty("top", `${top}px`, "important");
        root.style.setProperty("right", "auto", "important");
        root.style.setProperty("bottom", "auto", "important");
      };
      if (saved) {
        set(saved.left, saved.top);
        return;
      }
      window.requestAnimationFrame(() => {
        const rect = root.getBoundingClientRect();
        const content = document
          .getElementById("content")
          ?.getBoundingClientRect?.();
        const left = content
          ? content.left + (content.width - rect.width) / 2
          : (window.innerWidth - rect.width) / 2;
        set(
          Math.max(12, Math.round(left)),
          Math.max(12, Math.round(window.innerHeight * 0.18)),
        );
      });
    },
    position(value = null) {
      const key = "media-upload-flow-position";
      if (value) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch {}
        return value;
      }
      try {
        const saved = JSON.parse(localStorage.getItem(key) || "null");
        if (Number.isFinite(saved?.left) && Number.isFinite(saved?.top))
          return saved;
      } catch {}
      return null;
    },
    bind(root) {
      if (!root || root.dataset.mediaUploadActions === "true") return;
      root.dataset.mediaUploadActions = "true";
      root.addEventListener("click", (event) => {
        const button = event.target?.closest?.("[data-action]");
        if (!button || !root.contains(button)) return;
        upload.action(root, button.dataset.action || "");
      });
      root.addEventListener("pointerdown", (event) => upload.drag(root, event));
    },
    action(root, name = "") {
      const documentValue = frame.document();
      if (name === "watermark") {
        state.watermark = !state.watermark;
        upload.watermark(documentValue, state.watermark);
        return;
      }
      if (name === "choose") {
        const button = documentValue?.querySelector?.(
          "#plupload-browse-button",
        );
        const input = documentValue?.querySelector?.(
          '.plupload input[type="file"],input[type="file"]',
        );
        button?.click?.();
        if (!button) input?.click?.();
        return;
      }
      if (name === "theme") {
        state.theme =
          (root?.dataset?.theme || state.theme) === "dark" ? "light" : "dark";
        if (root) root.dataset.theme = state.theme;
        ui.controls.chrome.theme(root, { theme: state.theme, action: "theme" });
        return;
      }
      if (name === "close") {
        state.cancelled = true;
        state.upload = false;
        state.phase = "idle";
        frame.close();
      }
    },
    drag(root, event) {
      if (!root || event.button !== 0) return;
      if (
        event.target?.closest?.(
          "[data-action],button,input,textarea,select,a,label",
        )
      )
        return;
      const rect = root.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      root.style.setProperty("cursor", "grabbing", "important");
      root.setPointerCapture?.(event.pointerId);
      const move = (value) => {
        const left = Math.max(
          12,
          Math.min(
            window.innerWidth - rect.width - 12,
            value.clientX - offsetX,
          ),
        );
        const top = Math.max(
          12,
          Math.min(
            window.innerHeight - rect.height - 12,
            value.clientY - offsetY,
          ),
        );
        root.style.setProperty("left", `${Math.round(left)}px`, "important");
        root.style.setProperty("top", `${Math.round(top)}px`, "important");
      };
      const up = () => {
        const next = root.getBoundingClientRect();
        upload.position({
          left: Math.round(next.left),
          top: Math.round(next.top),
        });
        root.style.setProperty("cursor", "grab", "important");
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
      };
      document.addEventListener("pointermove", move);
      const __end = () => {
      up();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", __end);
      document.removeEventListener("pointercancel", __end);
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", __end);
    document.addEventListener("pointercancel", __end);
    },
    watermark(documentValue, enabled = state.watermark) {
      if (!documentValue) return;
      const fields = [
        ...documentValue.querySelectorAll(
          'input[type="checkbox"][name*="watermark"],input[type="checkbox"][id*="watermark"],input[type="checkbox"][name="use_watermark"]',
        ),
      ];
      fields.forEach((field) => {
        field.checked = Boolean(enabled);
        field.dispatchEvent(new Event("change", { bubbles: true }));
        field
          .closest?.("tr,p,label,div")
          ?.style?.setProperty?.("display", "none", "important");
      });
      const view = documentValue.defaultView;
      const params = view?.wpUploaderInit?.multipart_params;
      if (params) {
        if (enabled) params.use_watermark = "On";
        else delete params.use_watermark;
      }
      if (documentValue.body?.dataset) {
        documentValue.body.dataset.mediaUploadWatermark = enabled
          ? "on"
          : "off";
      }
      const button = document.querySelector(
        "#media-upload-flow-control [data-watermark-toggle]",
      );
      if (button) {
        button.dataset.enabled = enabled ? "true" : "false";
        button.setAttribute("aria-pressed", enabled ? "true" : "false");
        button.innerHTML = enabled
          ? upload.icon("Checkbox Checked", "Checkmark Square")
          : upload.icon("Checkbox Unchecked", "Square");
      }
    },
    busy(documentValue) {
      return Boolean(
        documentValue?.querySelector?.(
          ".uploading,.media-item.uploading,.media-item .progress,.media-item .bar,.media-item .filename.original,.plupload_upload_status,.plupload_uploading",
        ),
      );
    },
    delay(ms = 0) {
      return new Promise((resolve) => window.setTimeout(resolve, ms));
    },
    async insertUploaded({
      attempts = timing.galleryAttempts,
      delay = timing.galleryDelay,
    } = {}) {
      for (let index = 0; index < attempts; index += 1) {
        if (await insert.gallery({ alertEmpty: false, close: false })) {
          frame.close();
          return true;
        }
        await upload.delay(delay);
      }
      return false;
    },
    async open() {
      state.phase = "opening";
      if (!media.open("type")) return null;
      const documentValue = await wait.uploadDocument();
      if (!documentValue) return null;
      upload.style(documentValue);
      upload.control(documentValue);
      return documentValue;
    },
    async run(baseline = new Set()) {
      const postId = post.id();
      const documentValue = await upload.open();
      if (!documentValue) {
        if (!state.cancelled) alert("Не удалось открыть загрузку");
        return false;
      }
      state.phase = "uploading";
      const uploaded = await wait.uploadDone(documentValue, postId, baseline);
      if (!uploaded.length) {
        if (!state.cancelled)
          alert("Файлы не загружены или загрузка не завершилась");
        return false;
      }
      state.phase = "inserting";
      if (await upload.insertUploaded()) return true;
      if (!state.cancelled)
        alert("Загрузка завершилась, но новые картинки в галерее не найдены");
      return false;
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
      const data = customGallery.block(sourceValue, start, end, value);
      if (data.next === sourceValue) return false;
      target.value = data.next;
      target.selectionStart = data.start;
      target.selectionEnd = data.end;
      target.focus();
      customGallery.emit(target);
      cms.editor.runContent((current) => current);
      return true;
    },
    block(sourceValue = "", start = 0, end = 0, value = "") {
      const before = sourceValue.slice(0, start).replace(/\s*$/g, "");
      const after = sourceValue.slice(end).replace(/^\s*/g, "");
      const prefix = before.trim() ? "\n\n" : "";
      const suffix = after.trim() ? "\n\n" : "";
      const normalized = String(value || "").replace(/^\s+|\s+$/g, "");
      const next = `${before}${prefix}${normalized}${suffix}${after}`;
      const nextStart = before.length + prefix.length;
      return { next, start: nextStart, end: nextStart + normalized.length };
    },
    escapeAttr(value = "") {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;");
    },
    fragment(value = "") {
      const documentValue = new DOMParser().parseFromString(
        `<div>${value}</div>`,
        "text/html",
      );
      return documentValue.body.firstElementChild;
    },
    imageSrcs(value = "") {
      return customGallery.mediaItems(value).map((item) => item.src);
    },
    mediaItems(value = "") {
      const root = customGallery.fragment(value);
      const items = [];
      const walk = (node) => {
        if (!node || node.nodeType !== 1) return;
        if (node.matches?.("dl.wp-caption")) {
          const src =
            node.querySelector?.("img[src]")?.getAttribute?.("src") || "";
          const caption =
            node.querySelector?.("dd.wp-caption-dd,dd")?.innerHTML || "";
          if (src) items.push({ src, caption });
          return;
        }
        if (node.matches?.("img[src]")) {
          items.push({ src: node.getAttribute("src") || "", caption: "" });
          return;
        }
        [...node.children].forEach(walk);
      };
      [...(root?.children || [])].forEach(walk);
      return items.filter((item) => item.src);
    },
    imageHtml(src = "") {
      if (!src) return "";
      return `<img class="aligncenter" src="${customGallery.escapeAttr(src)}" alt="" />`;
    },
    captionHtml(item = {}) {
      const src = customGallery.escapeAttr(item.src || "");
      if (!src) return "";
      return `<dl class="wp-caption aligncenter"><dt class="wp-caption-dt"><img src="${src}" alt="" /></dt><dd class="wp-caption-dd">${item.caption || ""}</dd></dl>`;
    },
    imageBlockHtml(item = {}) {
      if (!item?.caption) return customGallery.imageHtml(item?.src || "");
      return customGallery.captionHtml(item);
    },
    galleryHtml(items = []) {
      const value = items
        .map((item) =>
          typeof item === "string" ? { src: item, caption: "" } : item,
        )
        .map((item) => ({
          src: String(item?.src || ""),
          caption: String(item?.caption || ""),
        }))
        .filter((item) => item.src);
      return `[onliner-gallery]${JSON.stringify(value)}[/onliner-gallery]`;
    },
    mixedHtml(srcs = []) {
      const queue = srcs.slice();
      const blocks = [];
      let index = 0;
      const range = (min, max) =>
        Math.floor(Math.random() * (max - min + 1)) + min;
      while (queue.length) {
        const asImages = index % 2 === 0;
        const imageLimit =
          queue.length > 4 ? Math.min(3, queue.length - 4) : queue.length;
        const imageCount = Math.max(1, imageLimit);
        const galleryCount = queue.length <= 8 ? queue.length : range(4, 8);
        const count = asImages ? range(1, imageCount) : galleryCount;
        const chunk = queue.splice(0, count);
        if (!chunk.length) break;
        if (asImages || chunk.length < 4) {
          blocks.push(...chunk.map((src) => customGallery.imageHtml(src)));
        } else {
          blocks.push(customGallery.galleryHtml(chunk));
        }
        index += 1;
      }
      return blocks.filter(Boolean).join("\n\n");
    },
    photoWord(count = 0) {
      const value = Math.abs(Number(count) || 0);
      const mod10 = value % 10;
      const mod100 = value % 100;
      if (mod10 === 1 && mod100 !== 11) return "фотку";
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
        return "фотки";
      return "фоток";
    },
    randomMessage(count = 0) {
      return `Суём ${count} ${customGallery.photoWord(count)}. Побить на галереи??`;
    },
    outputHtml(srcs = []) {
      if (srcs.length < 5) return customGallery.galleryHtml(srcs);
      if (!window.confirm(customGallery.randomMessage(srcs.length))) {
        return customGallery.galleryHtml(srcs);
      }
      return customGallery.mixedHtml(srcs);
    },
    galleryItems(value = "") {
      try {
        const items = JSON.parse(String(value || ""));
        if (!Array.isArray(items)) return [];
        return items
          .map((item) => ({
            src: String(item?.src || ""),
            caption: String(item?.caption || ""),
          }))
          .filter((item) => item.src);
      } catch {
        return [];
      }
    },
    splitHtml(value = "") {
      return customGallery
        .galleryItems(value)
        .map(customGallery.imageBlockHtml)
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
      const items = customGallery.mediaItems(selection.text);
      if (!items.length) return false;
      if (items.length < 2) {
        alert("В галерею минимум два экспоната");
        return true;
      }
      return customGallery.replace(
        target,
        selection.start,
        selection.end,
        customGallery.galleryHtml(items),
      );
    },
    asImages(target) {
      const selection = customGallery.selected(target);
      const selectedMatch = selection?.text?.match?.(
        /^\s*\[onliner-gallery\]([\s\S]*?)\[\/onliner-gallery\]\s*$/i,
      );
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
      alert("Выдели картинки или своди курсор в галерею");
      return false;
    },
  };
  const distribute = {
    config: {
      minMediaBlocks: 2,
      minTextBlocks: 6,
      minSafePoints: 2,
      minBlockChars: 80,
      minBeforeFirst: 2,
      minAfterLast: 2,
    },
    blocks(value = "") {
      return String(value || "")
        .split(/\n{2,}/)
        .map((item) => item.trim())
        .filter(Boolean);
    },
    mediaBlock(value = "") {
      return /^\s*(?:<img\b|<dl\b[^>]*wp-caption|\[onliner-gallery\])/i.test(
        value,
      );
    },
    blockedBlock(value = "") {
      return /^\s*(?:\[[^\]]+\]|<\/?(?:ul|ol|li|table|thead|tbody|tr|td|th|script|style|iframe|figure|blockquote|div|h[1-6])\b)/i.test(
        value,
      );
    },
    safeBlock(value = "") {
      const text = String(value || "").trim();
      if (text.length < distribute.config.minBlockChars) return false;
      if (distribute.mediaBlock(text)) return false;
      if (distribute.blockedBlock(text)) return false;
      return true;
    },
    safePoints(parts = []) {
      const last = parts.length - 1;
      return parts
        .map((part, index) => ({ part, index }))
        .filter(({ part, index }) => {
          if (index < distribute.config.minBeforeFirst) return false;
          if (last - index < distribute.config.minAfterLast) return false;
          if (!distribute.safeBlock(part)) return false;
          if (distribute.mediaBlock(parts[index - 1] || "")) return false;
          if (distribute.mediaBlock(parts[index + 1] || "")) return false;
          return true;
        })
        .map(({ index }) => index);
    },
    spread(points = [], count = 0) {
      if (!points.length || count <= 0) return [];
      const limit = Math.min(points.length, count);
      const picked = [];
      const used = new Set();
      for (let index = 0; index < limit; index += 1) {
        const target = Math.floor(((index + 1) * points.length) / (limit + 1));
        let cursor = Math.min(points.length - 1, Math.max(0, target));
        while (used.has(cursor) && cursor < points.length - 1) cursor += 1;
        while (used.has(cursor) && cursor > 0) cursor -= 1;
        if (used.has(cursor)) continue;
        used.add(cursor);
        picked.push(points[cursor]);
      }
      return picked.sort((left, right) => left - right);
    },
    prompt(count = 0) {
      return window.confirm(`Раскидать ${count} медиаблоков по тексту?`);
    },
    imagePrompt(count = 0) {
      return window.confirm(
        `Раскидать ${count} ${customGallery.photoWord(count)} по тексту?`,
      );
    },
    eligible(parts = [], mediaBlocks = [], points = []) {
      if (mediaBlocks.length < distribute.config.minMediaBlocks) return false;
      if (parts.length < distribute.config.minTextBlocks) return false;
      if (points.length < distribute.config.minSafePoints) return false;
      return true;
    },
    sourceEligible(parts = [], count = 0, points = []) {
      if (count < distribute.config.minMediaBlocks) return false;
      if (parts.length < distribute.config.minTextBlocks) return false;
      if (points.length < distribute.config.minSafePoints) return false;
      return true;
    },
    offer(current = "", count = 0) {
      const parts = distribute.blocks(current);
      const points = distribute.safePoints(parts);
      if (!distribute.sourceEligible(parts, count, points)) return false;
      return distribute.imagePrompt(count);
    },
    merge(parts = [], mediaBlocks = [], points = []) {
      const selected = distribute.spread(points, mediaBlocks.length);
      const placements = new Map();
      selected.forEach((point, index) => {
        placements.set(point, [mediaBlocks[index]]);
      });
      const next = [];
      parts.forEach((part, index) => {
        if (part) next.push(part);
        if (placements.has(index)) next.push(...placements.get(index));
      });
      mediaBlocks.slice(selected.length).forEach((block) => next.push(block));
      return next.filter(Boolean).join("\n\n");
    },
    place(current = "", value = "") {
      const mediaBlocks = distribute.blocks(value);
      const parts = distribute.blocks(current);
      const points = distribute.safePoints(parts);
      if (!mediaBlocks.length || !parts.length || !points.length) return "";
      return distribute.merge(parts, mediaBlocks, points);
    },
    run(current = "", value = "") {
      const mediaBlocks = distribute.blocks(value);
      const parts = distribute.blocks(current);
      const points = distribute.safePoints(parts);
      if (!distribute.eligible(parts, mediaBlocks, points))
        return editor.append(current, value);
      if (!distribute.prompt(mediaBlocks.length))
        return editor.append(current, value);
      return distribute.merge(parts, mediaBlocks, points);
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
        if (alertEmpty)
          alert("Картинки не найдены: не удалось открыть галерею");
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
      state.cancelled = false;
      state.phase = "checking";
      try {
        const baseline = editor.existing();
        if (await insert.gallery({ alertEmpty: false, close: true }))
          return true;
        return upload.run(baseline);
      } finally {
        state.upload = false;
        state.phase = "idle";
      }
    },
  };
  const thumb = {
    id: {
      root: "media-thumb-flow-control",
      style: "media-thumb-flow-parent-style",
    },
    button() {
      return (
        document.querySelector("#set-post-thumbnail") ||
        document.querySelector(
          '#postimagediv a.thickbox[href*="media-upload.php"],#postimagediv a[href*="media-upload.php"],a.thickbox[href*="media-upload.php"][href*="post_id="]',
        )
      );
    },
    theme() {
      return (
        document.querySelector('.panel[data-ui-surface="toolbar"]')?.dataset
          ?.theme ||
        state.theme ||
        "dark"
      );
    },
    key(value = "") {
      const source = String(value || "").trim();
      const decoded = (() => {
        try {
          return decodeURIComponent(source);
        } catch {
          return source;
        }
      })();
      const values = [source, decoded];
      try {
        const url = new URL(source, window.location.href);
        values.push(url.href, url.pathname, decodeURIComponent(url.pathname));
        url.pathname.split(/[\\/]+/).forEach((part) => values.push(part));
      } catch {
        source.split(/[\\/\s?#&=]+/).forEach((part) => values.push(part));
      }
      const raw = values
        .flatMap((item) => String(item || "").split(/[\\/\s?#&=]+/))
        .map((item) => String(item || "").trim())
        .filter(Boolean);
      const hashes = raw
        .flatMap((item) => item.match(/[a-f0-9]{24,64}/gi) || [])
        .map((item) => item.toLowerCase());
      const basenames = raw
        .map((item) => item.replace(/\.[a-z0-9]{2,5}$/i, ""))
        .filter((item) => /^[a-z0-9_-]{8,96}$/i.test(item))
        .map((item) => item.toLowerCase())
        .filter(
          (item) =>
            !/^(news|thumb|thumbnail|large|medium|small|image|content|onliner|970x485|820x410)$/i.test(
              item,
            ),
        );
      const tokens = [...new Set([...hashes, ...basenames])].filter(
        (item) => item.length >= 8,
      );
      return {
        source,
        primary: tokens[0] || "",
        tokens,
      };
    },
    url(tab = "library", { search = "" } = {}) {
      const href = thumb.button()?.getAttribute?.("href") || "";
      const postId = post.id();
      if (!href && !postId) return "";
      try {
        const url = href
          ? new URL(href, window.location.href)
          : new URL("/wp-admin/media-upload.php", window.location.href);
        if (postId && !url.searchParams.get("post_id")) {
          url.searchParams.set("post_id", postId);
        }
        url.searchParams.set("type", "image");
        url.searchParams.set("tab", tab);
        url.searchParams.set("TB_iframe", "1");
        url.searchParams.set("post_mime_type", "");
        url.searchParams.set("context", "");
        url.searchParams.set("m", "0");
        if (search) url.searchParams.set("s", search);
        if (!url.searchParams.get("width"))
          url.searchParams.set("width", "640");
        if (!url.searchParams.get("height"))
          url.searchParams.set("height", "806");
        return `${url.pathname}${url.search}`;
      } catch {
        return "";
      }
    },
    open(tab = "library", options = {}) {
      const url = thumb.url(tab, options);
      if (!url) return false;
      if (typeof window.tb_show === "function") {
        window.tb_show("Задать миниатюру", url, false);
        window.setTimeout(() => frame.hide(), 0);
        return true;
      }
      window.open(url, "_blank");
      return false;
    },
    documentReady(documentValue) {
      return Boolean(documentValue?.querySelector?.("#media-items"));
    },
    async fetchDocument(options = {}) {
      const path = thumb.url("library", options);
      if (!path) return null;
      try {
        const response = await fetch(new URL(path, window.location.href), {
          credentials: "same-origin",
        });
        if (!response.ok) return null;
        const html = await response.text();
        return new DOMParser().parseFromString(html, "text/html");
      } catch {
        return null;
      }
    },
    waitDocument({
      attempts = timing.openAttempts,
      delay = timing.openDelay,
    } = {}) {
      return new Promise((resolve) => {
        let current = 0;
        const tick = () => {
          const documentValue = frame.document();
          if (thumb.documentReady(documentValue)) {
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
    waitCandidates(documentValue, { attempts = 12, delay = 250 } = {}) {
      return new Promise((resolve) => {
        let current = 0;
        const tick = () => {
          const items = thumb.candidates(documentValue);
          if (items.length || current >= attempts) {
            resolve(items);
            return;
          }
          current += 1;
          window.setTimeout(tick, delay);
        };
        tick();
      });
    },
    itemText(item) {
      const values = [item.textContent || "", item.innerHTML || ""];
      item
        .querySelectorAll(
          "img[src],a[href],input[value],textarea,select,option",
        )
        .forEach((node) => {
          ["src", "href", "value", "title", "alt", "onclick"].forEach(
            (name) => {
              const value = node.getAttribute?.(name);
              if (value) values.push(value);
            },
          );
          if ("value" in node && node.value) values.push(node.value);
        });
      return values.join(" ");
    },
    candidates(documentValue, { search = "" } = {}) {
      return [...documentValue.querySelectorAll("#media-items .media-item")]
        .map((item) => {
          const link = item.querySelector("a.wp-post-thumbnail");
          const img = item.querySelector(
            "img.thumbnail[src],img.pinkynail[src],img[src]",
          );
          const onclick = link?.getAttribute?.("onclick") || "";
          const action = onclick.match(
            /WPSetAsThumbnail\(\s*['"]?(\d+)['"]?\s*,\s*['"]([^'"]+)['"]\s*\)/,
          );
          const id =
            action?.[1] ||
            String(link?.id || onclick || item.id || "").match(/(\d+)/)?.[1] ||
            "";
          const nonce = action?.[2] || "";
          const title =
            item.querySelector(".filename .title")?.textContent ||
            item.querySelector(".filename,.media-title")?.textContent ||
            item.querySelector(".post_title input")?.value ||
            id ||
            "Миниатюра";
          const src = img?.getAttribute?.("src") || "";
          return {
            id,
            link,
            src,
            title: String(title || id || "Миниатюра").trim(),
            text: thumb.itemText(item),
            nonce,
            search,
            usable: Boolean(link && id),
          };
        })
        .filter((item) => item.usable && item.src);
    },
    style() {
      frame.hide();
      host.ensureStyles();
      if (document.getElementById(thumb.id.style)) return;
      host.mount(
        thumb.id.style,
        `
        #${thumb.id.root}{
          --thumb-panel-width:min(var(--surface-shared-panel-width),var(--surface-shared-panel-max-width));
          width:var(--thumb-panel-width)!important;
          min-width:var(--thumb-panel-width)!important;
          max-width:var(--thumb-panel-width)!important;
          padding:var(--surface-toolbar-pad,8px)!important;
        }
        #${thumb.id.root} > .ui-stack{gap:var(--surface-stack-gap,8px)!important;}
        #${thumb.id.root}{cursor:grab!important;max-height:calc(100vh - 32px)!important;overflow:auto!important;}
        #${thumb.id.root}[data-panel-dragging="true"]{cursor:grabbing!important;}
        #${thumb.id.root} button,#${thumb.id.root} input,#${thumb.id.root} textarea,#${thumb.id.root} select{cursor:auto!important;}
        #${thumb.id.root} [data-thumb-body="true"]{display:grid!important;gap:8px!important;}
        #${thumb.id.root} [data-thumb-field="true"]{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:8px!important;align-items:center!important;}
        #${thumb.id.root} [data-thumb-input-group="true"]{box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:100%!important;height:var(--rail-pill-cross,var(--surface-toolbar-icon-box-size,var(--surface-button-size)))!important;min-height:var(--rail-pill-cross,var(--surface-toolbar-icon-box-size,var(--surface-button-size)))!important;max-height:var(--rail-pill-cross,var(--surface-toolbar-icon-box-size,var(--surface-button-size)))!important;align-items:center!important;}
        #${thumb.id.root} [data-thumb-input-group="true"] > .ui-group-body{box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:100%!important;height:100%!important;align-items:center!important;}
        #${thumb.id.root} .media-thumb-flow-input{box-sizing:border-box!important;display:block!important;width:100%!important;min-width:0!important;height:100%!important;min-height:0!important;max-height:100%!important;border:0!important;border-radius:999px!important;background:transparent!important;color:inherit!important;padding:0 10px!important;font:400 13px/normal system-ui,-apple-system,Segoe UI,Roboto,sans-serif!important;letter-spacing:0!important;outline:none!important;box-shadow:none!important;}
        #${thumb.id.root} .media-thumb-flow-input::placeholder{color:currentColor!important;opacity:.55!important;font-weight:400!important;}
        #${thumb.id.root} [data-thumb-actions="true"]{display:flex!important;gap:8px!important;align-items:center!important;}
        #${thumb.id.root} [data-thumb-results="true"]{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(86px,1fr))!important;gap:8px!important;max-height:min(50vh,360px)!important;overflow:auto!important;padding:2px!important;}
        #${thumb.id.root} .media-thumb-flow-item{display:block!important;width:100%!important;padding:4px!important;border:0!important;border-radius:14px!important;background:rgba(255,255,255,.12)!important;cursor:pointer!important;overflow:hidden!important;}
        #${thumb.id.root}[data-theme="light"] .media-thumb-flow-item{background:rgba(255,255,255,.74)!important;}
        #${thumb.id.root} .media-thumb-flow-item img{display:block!important;width:100%!important;aspect-ratio:1.6!important;object-fit:cover!important;border-radius:10px!important;}
        #${thumb.id.root} [data-thumb-crop="true"]{display:grid!important;gap:8px!important;}
        #${thumb.id.root} [data-thumb-file="true"]{display:none!important;}
        #${thumb.id.root} [data-thumb-crop-stage="true"]{position:relative!important;display:block!important;width:100%!important;max-height:min(42vh,360px)!important;overflow:hidden!important;border-radius:14px!important;background:rgba(255,255,255,.12)!important;}
        #${thumb.id.root} [data-thumb-crop-stage="true"][data-file-dragging="true"]{outline:2px solid currentColor!important;outline-offset:-6px!important;}
        #${thumb.id.root}[data-theme="light"] [data-thumb-crop-stage="true"]{background:rgba(255,255,255,.74)!important;}
        #${thumb.id.root} .media-thumb-flow-canvas{display:block!important;width:100%!important;height:auto!important;max-height:min(42vh,360px)!important;touch-action:none!important;cursor:grab!important;}
        #${thumb.id.root} [data-thumb-crop-stage="true"][data-dragging="true"] .media-thumb-flow-canvas{cursor:grabbing!important;}
        #${thumb.id.root} [data-thumb-crop-tools="true"]{display:flex!important;flex-wrap:wrap!important;gap:8px!important;align-items:center!important;}
        #${thumb.id.root} .media-thumb-flow-tool{box-sizing:border-box!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;height:30px!important;min-width:30px!important;padding:0 10px!important;border:0!important;border-radius:999px!important;background:rgba(0,0,0,.34)!important;color:inherit!important;font:600 12px/1 system-ui,-apple-system,Segoe UI,Roboto,sans-serif!important;letter-spacing:0!important;cursor:pointer!important;}
        #${thumb.id.root} .media-thumb-flow-tool:hover{background:rgba(0,0,0,.46)!important;}
        #${thumb.id.root}[data-theme="light"] .media-thumb-flow-tool{background:rgba(255,255,255,.74)!important;}
        #${thumb.id.root}[data-theme="light"] .media-thumb-flow-tool:hover{background:rgba(255,255,255,.9)!important;}
        #${thumb.id.root} .media-thumb-flow-tool-icon{font-size:16px!important;font-weight:700!important;padding:0!important;width:30px!important;}
        #${thumb.id.root} [data-thumb-crop-status="true"]{display:block!important;min-width:0!important;font:400 12px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif!important;opacity:.7!important;word-break:break-word!important;}
      `,
      );
    },
    escape(value = "") {
      return ui.controls.escape(value);
    },
    clipboard() {
      if (!navigator.clipboard?.readText) return Promise.resolve("");
      return navigator.clipboard
        .readText()
        .then((value) => String(value || "").trim())
        .catch(() => "");
    },
    matches(items = [], value = "") {
      const key = thumb.key(value);
      if (!key.tokens.length) return [];
      return items.filter((item) => {
        const haystack = String(item.text || "").toLowerCase();
        return key.tokens.some((token) => haystack.includes(token));
      });
    },
    sourceUrl(value = "") {
      const source = String(value || "").trim();
      if (!source) return "";
      try {
        const url = new URL(source, window.location.href);
        const imageName =
          url.pathname.match(/([^/]+\.(?:jpe?g|png|webp|gif))$/i)?.[1] ||
          "";
        if (!imageName) return "";
        if (/content\.onliner\.by$/i.test(url.hostname)) {
          return `https://content.onliner.by/news/1200x5616/${imageName}`;
        }
        return url.href;
      } catch {
        return "";
      }
    },
    crop: {
      presets: {
        news: { key: "news", width: 970, height: 485, label: "Новости" },
        long: { key: "long", width: 1400, height: 700, label: "Лонгрид" },
        featured: { key: "featured", width: 800, height: 920, label: "Выделенное" },
      },
      preset(key = "news") {
        return thumb.crop.presets[key] || thumb.crop.presets.news;
      },
      filename(value = "", preset = thumb.crop.presets.news) {
        const name = (() => {
          try {
            return new URL(value, window.location.href).pathname.match(/([^/]+)\.[a-z0-9]+$/i)?.[1] || "thumb";
          } catch {
            return String(value || "thumb").match(/[a-z0-9_-]{8,96}/i)?.[0] || "thumb";
          }
        })();
        return `${name}__${preset.key}-${preset.width}x${preset.height}.jpg`;
      },
      status(root, value = "") {
        const element = root?.querySelector?.("[data-thumb-crop-status]");
        if (element) element.textContent = value;
      },
      tool({ action, title, content = "", icon: iconValue = false }) {
        const classes = [
          "media-thumb-flow-tool",
          iconValue ? "media-thumb-flow-tool-icon" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return [
          `<button class="${classes}"`,
          ` type="button"`,
          ` data-action="${thumb.escape(action)}"`,
          ` title="${thumb.escape(title)}">`,
          thumb.escape(content),
          `</button>`,
        ].join("");
      },
      html() {
        return `
          <div data-thumb-crop="true">
            <div data-thumb-crop-stage="true"><canvas class="media-thumb-flow-canvas" data-thumb-crop-canvas="true"></canvas></div>
            <div data-thumb-crop-tools="true">
              ${thumb.crop.tool({ action: "crop.news", title: "Новости 970×485", content: "970×485" })}
              ${thumb.crop.tool({ action: "crop.long", title: "Лонгрид 1400×700", content: "1400×700" })}
              ${thumb.crop.tool({ action: "crop.featured", title: "Выделенное 800×920", content: "800×920" })}
              ${thumb.crop.tool({ action: "crop.fit", title: "Сбросить", content: "↺", icon: true })}
              ${thumb.crop.tool({ action: "crop.apply", title: "Кропнуть и поставить", content: "★", icon: true })}
            </div>
            <div data-thumb-crop-status="true">Вставьте ссылку или загрузите файл.</div>
          </div>
        `;
      },
      async image(url = "") {
        const image = new Image();
        image.decoding = "async";
        image.loading = "eager";
        image.crossOrigin = "anonymous";
        image.src = url;
        await image.decode();
        return {
          image,
          url,
          filename: thumb.crop.filename(url),
          source: "url",
        };
      },
      async file(file) {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.decoding = "async";
        image.loading = "eager";
        image.src = url;
        await image.decode();
        return {
          image,
          url,
          filename: thumb.crop.filename(file.name || "thumb.jpg"),
          source: "file",
        };
      },
      fit(imageValue, preset) {
        const scale = Math.max(
          preset.width / imageValue.naturalWidth,
          preset.height / imageValue.naturalHeight,
        );
        return { x: 0, y: 0, scale };
      },
      session(data = {}) {
        const preset = thumb.crop.preset("news");
        return {
          image: data.image,
          url: data.url || "",
          filename: data.filename || "thumb.jpg",
          source: data.source || "url",
          preset,
          transform: thumb.crop.fit(data.image, preset),
          drag: null,
        };
      },
      reset(session) {
        session.transform = thumb.crop.fit(session.image, session.preset);
        return session;
      },
      point(canvas, event) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - rect.left) * (canvas.width / rect.width),
          y: (event.clientY - rect.top) * (canvas.height / rect.height),
        };
      },
      render(root) {
        const session = root?.__thumbCropSession;
        const canvas = root?.querySelector?.("[data-thumb-crop-canvas]");
        if (!session || !canvas) return false;
        canvas.width = session.preset.width;
        canvas.height = session.preset.height;
        const context = canvas.getContext("2d", { alpha: false });
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        const imageValue = session.image;
        const transform = session.transform;
        const centerX = canvas.width / 2 + transform.x;
        const centerY = canvas.height / 2 + transform.y;
        context.save();
        context.translate(centerX, centerY);
        context.scale(transform.scale, transform.scale);
        context.drawImage(imageValue, -imageValue.naturalWidth / 2, -imageValue.naturalHeight / 2);
        context.restore();
        thumb.crop.status(root, `${session.preset.label}: ${session.preset.width}×${session.preset.height}. Drag — двигать, колесо — zoom.`);
        return true;
      },
      blob(root) {
        return new Promise((resolve, reject) => {
          const canvas = root?.querySelector?.("[data-thumb-crop-canvas]");
          if (!canvas) {
            reject(new Error("canvas not found"));
            return;
          }
          try {
            canvas.toBlob((blob) => {
              if (!blob) reject(new Error("toBlob returned null"));
              else resolve(blob);
            }, "image/jpeg", 0.85);
          } catch (error) {
            reject(error);
          }
        });
      },
      bindCanvas(root) {
        const canvas = root?.querySelector?.("[data-thumb-crop-canvas]");
        const stage = root?.querySelector?.("[data-thumb-crop-stage]");
        if (!canvas || canvas.dataset.thumbCropBound === "true") return;
        canvas.dataset.thumbCropBound = "true";
        canvas.addEventListener("pointerdown", (event) => {
          const session = root.__thumbCropSession;
          if (!session) return;
          const point = thumb.crop.point(canvas, event);
          session.drag = {
            x: point.x,
            y: point.y,
            transform: { ...session.transform },
          };
          stage?.setAttribute?.("data-dragging", "true");
          canvas.setPointerCapture?.(event.pointerId);
        });
        canvas.addEventListener("pointermove", (event) => {
          const session = root.__thumbCropSession;
          if (!session?.drag) return;
          const point = thumb.crop.point(canvas, event);
          session.transform.x = session.drag.transform.x + point.x - session.drag.x;
          session.transform.y = session.drag.transform.y + point.y - session.drag.y;
          thumb.crop.render(root);
        });
        const end = () => {
          const session = root.__thumbCropSession;
          if (session) session.drag = null;
          stage?.removeAttribute?.("data-dragging");
        };
        canvas.addEventListener("pointerup", end);
        canvas.addEventListener("pointercancel", end);
        canvas.addEventListener("wheel", (event) => {
          const session = root.__thumbCropSession;
          if (!session) return;
          event.preventDefault();
          const factor = Math.exp(-event.deltaY * 0.0012);
          session.transform.scale = Math.max(0.05, Math.min(10, session.transform.scale * factor));
          thumb.crop.render(root);
        }, { passive: false });
      },
      ensure(root) {
        const holder = root?.querySelector?.("[data-thumb-body]");
        if (!holder) return false;
        if (!holder.querySelector("[data-thumb-crop]")) {
          holder.insertAdjacentHTML("beforeend", thumb.crop.html());
        }
        thumb.crop.bindCanvas(root);
        return true;
      },
      async mount(root, value = "") {
        if (!thumb.crop.ensure(root)) return false;
        const url = thumb.sourceUrl(value);
        if (!url) {
          thumb.crop.status(root, "Вставьте прямую ссылку на картинку или загрузите файл.");
          return false;
        }
        try {
          const data = await thumb.crop.image(url);
          root.__thumbCropSession = thumb.crop.session(data);
          thumb.crop.render(root);
          return true;
        } catch {
          thumb.crop.status(root, "Не удалось загрузить картинку по ссылке. Попробуйте локальный файл.");
          return false;
        }
      },
      async mountFile(root, file) {
        if (!file?.type?.startsWith?.("image/") || !thumb.crop.ensure(root)) {
          return false;
        }
        try {
          const data = await thumb.crop.file(file);
          root.__thumbCropSession = thumb.crop.session(data);
          thumb.crop.render(root);
          return true;
        } catch {
          thumb.crop.status(root, "Не удалось открыть локальный файл.");
          return false;
        }
      },
      async upload(root) {
        const session = root?.__thumbCropSession;
        if (!session) return null;
        thumb.crop.status(root, "Готовим JPG…");
        try {
          const blob = await thumb.crop.blob(root);
          thumb.crop.status(root, "Загружаем в медиатеку…");
          return thumb.uploadBlob(blob, session.filename);
        } catch {
          thumb.crop.status(root, "Не удалось экспортировать картинку. Для внешней ссылки нужен CORS; загрузите файл локально.");
          return null;
        }
      },
    },
    head() {
      const marker = ui.controls.marker({
        content: icon.emoji("framed-picture"),
        button: {
          title: "Миниатюра",
          attrs: ' type="button" tabindex="-1" aria-label="Миниатюра"',
        },
      });
      const chrome = ui.controls.chrome({
        theme: thumb.theme(),
        themeAction: "thumb.theme",
        closeAction: "thumb.close",
      });
      return ui.shell.frame({
        left: marker,
        right: chrome,
        classes: "media-thumb-flow-head",
        attrs: ' data-thumb-head="true" data-panel-drag-handle="true"',
      });
    },
    actionButton({ action, title, content = "", fluent = "", fallback = "" }) {
      return ui.controls.button({
        content,
        fluent,
        fallback,
        title,
        attrs: ` type="button" data-action="${action}"`,
      });
    },
    field(value = "") {
      const input = ui.controls.cluster({
        content: `<input class="media-thumb-flow-input" type="text" value="${thumb.escape(value)}" placeholder="URL или hash" data-thumb-input="true">`,
        group: {
          attrs: ' data-thumb-input-group="true"',
        },
      });
      const actions = ui.controls.cluster({
        content: `${thumb.actionButton({ action: "find", title: "Найти", fluent: "Search", fallback: "Search" })}${thumb.actionButton({ action: "crop", title: "Кропнуть", fluent: "Crop", fallback: "Crop" })}${thumb.actionButton({ action: "file", title: "Загрузить файл", fluent: "Arrow Upload", fallback: "Upload" })}${thumb.actionButton({ action: "library", title: "Библиотека", fluent: "Image Multiple", fallback: "Image" })}`,
        group: {
          attrs: ' data-thumb-actions="true"',
        },
      });
      return `<div data-thumb-field="true">${input}${actions}</div>`;
    },
    results(items = []) {
      return `<div data-thumb-results="true">${items
        .map(
          (item, index) => `
          <button class="media-thumb-flow-item" type="button" data-index="${index}" title="${thumb.escape(item.title)}">
            <img src="${thumb.escape(item.src)}" alt="">
          </button>
        `,
        )
        .join("")}</div>`;
    },
    html({ value = "", items = [] } = {}) {
      const file = '<input type="file" accept="image/*" data-thumb-file="true">';
      const body = `<div data-thumb-body="true">${thumb.field(value)}${file}${items.length ? thumb.results(items) : ""}</div>`;
      return ui.shell.stack(`${thumb.head()}${body}`);
    },
    root({ value = "", items = [] } = {}) {
      thumb.style();
      const root = host.create({
        id: thumb.id.root,
        html: thumb.html({ value, items }),
        draggable: { handle: false },
      });
      root.dataset.uiSurface = "toolbar";
      root.dataset.uiFrame = "capsule";
      root.dataset.toolbarFlow = "stack";
      root.dataset.theme = thumb.theme();
      ui.surface.sync(root, {
        layout: "fullscreen",
        theme: thumb.theme(),
        surface: "toolbar",
      });
      toolbar.center(root, 16);
      return root;
    },
    bind(root, items = []) {
      root.addEventListener("change", async (event) => {
        const input = event.target?.closest?.("[data-thumb-file]");
        if (!input || !root.contains(input)) return;
        const file = input.files?.[0];
        input.value = "";
        if (file) await thumb.crop.mountFile(root, file);
      });
      root.addEventListener("dragover", (event) => {
        if (!event.dataTransfer?.types?.includes?.("Files")) return;
        event.preventDefault();
        root.querySelector("[data-thumb-crop-stage]")?.setAttribute?.("data-file-dragging", "true");
      });
      root.addEventListener("dragleave", () => {
        root.querySelector("[data-thumb-crop-stage]")?.removeAttribute?.("data-file-dragging");
      });
      root.addEventListener("drop", async (event) => {
        const file = event.dataTransfer?.files?.[0];
        if (!file?.type?.startsWith?.("image/")) return;
        event.preventDefault();
        root.querySelector("[data-thumb-crop-stage]")?.removeAttribute?.("data-file-dragging");
        await thumb.crop.mountFile(root, file);
      });
      root.addEventListener("paste", (event) => {
        if (!event.target?.matches?.("[data-thumb-input]")) return;
        window.setTimeout(async () => {
          const value = event.target?.value || "";
          if (thumb.key(value).primary) {
            if (await thumb.find(value, { applyExact: true })) {
              frame.close();
              root.remove();
            }
            return;
          }
          if (thumb.sourceUrl(value)) await thumb.crop.mount(root, value);
        }, 0);
      });
      root.addEventListener("click", async (event) => {
        const action =
          event.target?.closest?.("[data-action]")?.dataset?.action || "";
        if (action === "thumb.close" || action === "close") {
          frame.close();
          root.remove();
          return;
        }
        if (action === "thumb.theme") {
          root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
          ui.controls.chrome.theme(root, {
            theme: root.dataset.theme,
            action: "thumb.theme",
          });
          return;
        }
        if (action === "file") {
          root.querySelector("[data-thumb-file]")?.click?.();
          return;
        }
        if (action === "library") {
          const current = await thumb.loadCandidates();
          thumb.show({
            value: root.querySelector("[data-thumb-input]")?.value || "",
            items: current.slice(0, 24),
          });
          return;
        }
        if (action === "find") {
          await thumb.find(
            root.querySelector("[data-thumb-input]")?.value || "",
          );
          return;
        }
        if (action === "crop") {
          await thumb.crop.mount(
            root,
            root.querySelector("[data-thumb-input]")?.value || "",
          );
          return;
        }
        if (action.startsWith("crop.")) {
          await thumb.cropAction(root, action);
          return;
        }
        const button = event.target?.closest?.("[data-index]");
        if (!button || !root.contains(button)) return;
        const item = items[Number(button.dataset.index)];
        if (!item || !(await thumb.apply(item))) return;
        window.setTimeout(() => {
          frame.close();
          root.remove();
        }, 700);
      });
    },
    show({ value = "", items = [] } = {}) {
      const root = thumb.root({ value, items });
      thumb.bind(root, items);
      root.querySelector("[data-thumb-input]")?.focus?.();
      return root;
    },
    focusBlock() {
      const target = document.querySelector("#postimagediv") || thumb.button();
      if (!target) return;
      target.scrollIntoView?.({ block: "center", behavior: "smooth" });
      if (!target.hasAttribute?.("tabindex")) {
        target.setAttribute?.("tabindex", "-1");
      }
      target.focus?.({ preventScroll: true });
    },
    async cropAction(root, action = "") {
      const session = root?.__thumbCropSession;
      if (action === "crop.fit" && session) {
        thumb.crop.reset(session);
        thumb.crop.render(root);
        return true;
      }
      if (action === "crop.apply") {
        const item = await thumb.crop.upload(root);
        if (!item || !(await thumb.apply(item))) {
          thumb.crop.status(root, "Не удалось загрузить или применить миниатюру");
          return false;
        }
        window.setTimeout(() => {
          frame.close();
          root.remove();
        }, 700);
        return true;
      }
      const key = action.replace(/^crop\./, "");
      if (!session || !thumb.crop.presets[key]) return false;
      session.preset = thumb.crop.preset(key);
      thumb.crop.reset(session);
      thumb.crop.render(root);
      return true;
    },
    async uploadDocument() {
      let documentValue = frame.document();
      if (documentValue?.defaultView?.wpUploaderInit?.multipart_params) {
        return documentValue;
      }
      if (!media.open("type")) return null;
      documentValue = await wait.uploadDocument({ attempts: 24, delay: 250 });
      if (!documentValue) return null;
      upload.style(documentValue);
      frame.hide();
      return documentValue;
    },
    uploadParams(documentValue) {
      const params = documentValue?.defaultView?.wpUploaderInit?.multipart_params;
      if (!params) return null;
      return { ...params };
    },
    uploadIdFromHtml(html = "") {
      const documentValue = new DOMParser().parseFromString(String(html || ""), "text/html");
      return (
        documentValue.querySelector(".media-item[id]")?.id?.match(/(\d+)/)?.[1] ||
        String(html || "").match(/media-item-(\d+)/)?.[1] ||
        ""
      );
    },
    async uploadBlob(blob, filename = "thumb.jpg") {
      const documentValue = await thumb.uploadDocument();
      const params = thumb.uploadParams(documentValue);
      const postId = post.id();
      if (!params || !postId) return null;
      const body = new FormData();
      Object.entries(params).forEach(([key, value]) => {
        body.set(key, value);
      });
      body.set("post_id", postId);
      body.set("type", "image");
      body.set("tab", "type");
      body.set("name", filename);
      body.set("async-upload", blob, filename);
      try {
        const response = await fetch("/wp-admin/async-upload.php", {
          method: "POST",
          credentials: "same-origin",
          body,
        });
        if (!response.ok) return null;
        const html = await response.text();
        const uploadDocument = new DOMParser().parseFromString(html, "text/html");
        const direct = thumb.candidates(uploadDocument)[0];
        if (direct?.id && direct?.nonce) return direct;
        const id = thumb.uploadIdFromHtml(html);
        if (!id) return null;
        const candidates = await thumb.loadCandidates({
          search: filename.replace(/\.[^.]+$/, ""),
        });
        return candidates.find((item) => item.id === id) || candidates[0] || { id };
      } catch {
        return null;
      }
    },
    async apply(item) {
      const id = String(item?.id || "").trim();
      const nonce = String(item?.nonce || "").trim();
      if (!id) {
        alert("Не удалось применить миниатюру");
        return false;
      }
      if (await thumb.applyAjax(item)) {
        thumb.focusBlock();
        return true;
      }
      if (nonce && typeof window.WPSetAsThumbnail === "function") {
        window.WPSetAsThumbnail(id, nonce);
        thumb.focusBlock();
        return true;
      }
      if (item?.link?.ownerDocument?.defaultView && item.link.click) {
        item.link.click();
        thumb.focusBlock();
        return true;
      }
      if (await thumb.applyInFrame(item)) {
        thumb.focusBlock();
        return true;
      }
      alert("Не удалось применить миниатюру");
      return false;
    },
    thumbnailHtml(html = "") {
      const value = String(html || "").trim();
      if (!value || value === "0" || value === "-1") return "";
      return value;
    },
    updateThumbnail(id = "", html = "") {
      const value = thumb.thumbnailHtml(html);
      if (!value) return false;
      if (typeof window.WPSetThumbnailID === "function") {
        window.WPSetThumbnailID(id);
      }
      if (typeof window.WPSetThumbnailHTML === "function") {
        window.WPSetThumbnailHTML(value);
        return true;
      }
      const button = thumb.button();
      if (button) {
        button.innerHTML = value;
        const remove = document.querySelector("#remove-post-thumbnail");
        remove?.closest?.("p")?.style?.removeProperty?.("display");
        return true;
      }
      const container = document.querySelector("#postimagediv .inside");
      if (!container) return false;
      container.innerHTML = value;
      return true;
    },
    async applyAjax(item) {
      const id = String(item?.id || "").trim();
      const nonce = String(item?.nonce || "").trim();
      const postId = post.id();
      if (!id || !nonce || !postId) return false;
      const body = new URLSearchParams();
      body.set("action", "set-post-thumbnail");
      body.set("post_id", postId);
      body.set("thumbnail_id", id);
      body.set("_ajax_nonce", nonce);
      body.set("cookie", encodeURIComponent(document.cookie || ""));
      try {
        const response = await fetch("/wp-admin/admin-ajax.php", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
          body,
        });
        if (!response.ok) return false;
        const html = await response.text();
        return thumb.updateThumbnail(id, html);
      } catch {
        return false;
      }
    },
    async applyInFrame(item) {
      const id = String(item?.id || "").trim();
      if (!id || !thumb.open("library", { search: item?.search || "" })) {
        return false;
      }
      const documentValue = await thumb.waitDocument({
        attempts: 24,
        delay: 250,
      });
      if (!documentValue) return false;
      const selector = `#wp-post-thumbnail-${id}`;
      const link =
        documentValue.querySelector(selector) ||
        [...documentValue.querySelectorAll("a.wp-post-thumbnail")].find(
          (node) =>
            String(node.getAttribute("onclick") || "").includes(
              `WPSetAsThumbnail(&quot;${id}&quot;`,
            ) ||
            String(node.getAttribute("onclick") || "").includes(
              `WPSetAsThumbnail("${id}"`,
            ),
        );
      if (!link?.click) return false;
      link.click();
      return true;
    },
    async loadCandidates({ search = "" } = {}) {
      if (!thumb.button()) {
        alert("Кнопка миниатюры не найдена");
        return [];
      }
      const documentValue = await thumb.fetchDocument({ search });
      if (documentValue) return thumb.candidates(documentValue, { search });
      if (!thumb.open("library", { search })) return [];
      const fallbackDocument = await thumb.waitDocument({
        attempts: 24,
        delay: 250,
      });
      if (!fallbackDocument) {
        alert("Медиатека для миниатюры не открылась");
        return [];
      }
      const candidates = await thumb.waitCandidates(fallbackDocument, {
        attempts: 24,
        delay: 250,
      });
      return candidates.map((item) => ({ ...item, search }));
    },
    async find(value = "", { applyExact = false } = {}) {
      const key = thumb.key(value);
      if (!key.primary) {
        if (thumb.sourceUrl(value)) {
          const root = thumb.show({ value });
          await thumb.crop.mount(root, value);
          return true;
        }
        alert("Не вижу hash или прямую ссылку на картинку");
        return false;
      }
      const searched = await thumb.loadCandidates({ search: key.primary });
      const searchedMatches = thumb.matches(searched, value);
      if (applyExact && searchedMatches.length === 1) {
        if (await thumb.apply(searchedMatches[0])) return true;
        thumb.show({ value, items: searchedMatches });
        return false;
      }
      if (searchedMatches.length) {
        thumb.show({ value, items: searchedMatches.slice(0, 24) });
        return true;
      }
      const fallback = searched.length
        ? searched
        : await thumb.loadCandidates();
      const fallbackMatches = thumb.matches(fallback, value);
      if (applyExact && fallbackMatches.length === 1) {
        if (await thumb.apply(fallbackMatches[0])) return true;
        thumb.show({ value, items: fallbackMatches });
        return false;
      }
      if (fallbackMatches.length) {
        thumb.show({ value, items: fallbackMatches.slice(0, 24) });
        return true;
      }
      const root = thumb.show({ value, items: fallback.slice(0, 24) });
      if (thumb.sourceUrl(value)) {
        await thumb.crop.mount(root, value);
        thumb.crop.status(root, `В медиатеке не найдено: ${key.primary}. Можно кропнуть и загрузить.`);
        return true;
      }
      alert(`По hash не найдено: ${key.primary}`);
      return false;
    },
    async run() {
      const value = await thumb.clipboard();
      if (thumb.key(value).primary) return thumb.find(value, { applyExact: true });
      const root = thumb.show({ value });
      if (thumb.sourceUrl(value)) await thumb.crop.mount(root, value);
      return true;
    },
  };
  const imageSearch = {
    selection() {
      return String(window.getSelection?.()?.toString?.() || "").trim();
    },
    title() {
      return String(
        document.querySelector("#title")?.value ||
          document.querySelector('[name="post_title"]')?.value ||
          "",
      ).trim();
    },
    defaultQuery() {
      return imageSearch.selection() || imageSearch.title();
    },
    siteQuery(query = "") {
      const value = String(query || "").trim();
      if (!value) return "";
      if (/\bsite:onliner\.by\b/i.test(value)) return value;
      return `site:onliner.by ${value}`;
    },
    url(query = "") {
      const url = new URL("https://www.google.com/search");
      url.searchParams.set("tbm", "isch");
      url.searchParams.set("udm", "2");
      url.searchParams.set("q", imageSearch.siteQuery(query));
      return url.href;
    },
    run() {
      const query = window.prompt("Чо ищем??", imageSearch.defaultQuery());
      if (query === null) return false;
      const value = String(query || "").trim();
      if (!value) return false;
      const url = imageSearch.url(value);
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (opened) return true;
      field.alert(`Не удалось открыть поиск в новой вкладке.\n\n${url}`);
      return false;
    },
  };
  return {
    media: {
      upload: insert,
      gallery: customGallery,
      insert,
      thumb,
      search: imageSearch,
    },
  };
};
