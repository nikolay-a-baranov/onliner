import { cms } from "../core/cms.js";
import { host } from "../core/surface/host.js";
import { icon } from "../core/surface/icon.js";
import { styles as css } from "../core/surface/styles.js";
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
    status: "Готово к загрузке",
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
        style.textContent = css.media.uploadParent();
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
    slug() {
      const value =
        document.querySelector("#editable-post-name-full")?.textContent ||
        document.querySelector("#editable-post-name")?.textContent ||
        document.querySelector("#post_name")?.value ||
        "";
      return (
        String(value || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_-]+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "") || "post"
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
        const documentValue = new DOMParser().parseFromString(html, "text/html");
        thumb.enhanceForceApplyDocument(documentValue);
        return documentValue;
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
      style.textContent = css.media.uploadFrame();
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
        title: "\u0414\u043e\u043b\u0438\u0432",
        classes: "media-upload-flow-marker",
        attrs: ' type="button" aria-label="\u0414\u043e\u043b\u0438\u0432"',
      });
    },
    statusText() {
      return {
        checking: "Проверяем галерею",
        opening: "Открываем загрузку",
        ready: "Выберите файлы",
        choosing: "Ждём выбор файла",
        uploading: "Загружаем в медиатеку",
        inserting: "Вставляем картинки",
        done: "Готово",
        cancelled: "Отменено",
        failed: "Не получилось",
        idle: "Готово к загрузке",
      }[state.phase] || state.status || "Готово к загрузке";
    },
    status(root = document.getElementById("media-upload-flow-control"), value = "", phase = "") {
      if (phase) state.phase = phase;
      if (value) state.status = value;
      const panel = root || document.getElementById("media-upload-flow-control");
      if (!panel) return false;
      panel.dataset.mediaUploadPhase = state.phase || "idle";
      const node = panel.querySelector("[data-media-upload-status]");
      if (node) node.textContent = value || upload.statusText();
      return true;
    },
    panel() {
      const watermark = ui.controls.button({
        fluent: "Checkbox Checked",
        fallback: "Checkmark Square",
        size: 20,
        classes: "media-upload-flow-watermark",
        title: "\u0412\u043e\u0434\u044f\u043d\u043e\u0439",
        attrs:
          ' type="button" data-action="watermark" data-watermark-toggle aria-label="\u0412\u043e\u0434\u044f\u043d\u043e\u0439" aria-pressed="true"',
      });
      const place = ui.controls.button({
        fluent: "Image Multiple",
        fallback: "Image",
        size: 20,
        classes: "media-upload-flow-place",
        title: "Вставить из галереи",
        attrs:
          ' type="button" data-action="place" data-media-upload-place aria-label="Вставить из галереи"',
      });
      const choose = ui.controls.button({
        fluent: "Image Add",
        fallback: "Image",
        size: 20,
        classes: "media-upload-flow-choose",
        title: "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c",
        attrs:
          ' type="button" data-action="choose" data-media-upload-choose aria-label="\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c"',
      });
      const status = ui.controls.message({
        text: upload.statusText(),
        classes: "media-upload-flow-status",
        attrs: " data-media-upload-status",
      });
      const actions = ui.shell.strip(`${status}${watermark}${place}${choose}`, {
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
        root = host.create({
          id: "media-upload-flow-control",
          className: "panel media-upload-flow-panel",
          html: upload.panel(),
        });
        root.dataset.uiSurface = "toolbar";
        root.dataset.uiFrame = "capsule";
        root.dataset.toolbarCapsule = "true";
        root.dataset.toolbarFlow = "rail";
        root.dataset.dock = "floating";
        root.dataset.layout = "floating";
        root.dataset.theme = state.theme || "dark";
      }
      root.dataset.theme = state.theme || "dark";
      upload.status(root);
      upload.bind(root);
      upload.watermark(documentValue, state.watermark);
    },
    bind(root) {
      if (!root || root.dataset.mediaUploadActions === "true") return;
      root.dataset.mediaUploadActions = "true";
      ui.surface.bindToolbar({
        panel: root,
        root,
        rememberPosition: true,
        rememberKey: "media-upload-flow-position",
        initial: "content-center",
        action(event) {
          const name =
            event.target?.closest?.("[data-action]")?.dataset?.action || "";
          if (!name) return;
          upload.action(root, name);
        },
      });
    },
    async action(root, name = "") {
      const documentValue = frame.document();
      if (name === "watermark") {
        state.watermark = !state.watermark;
        upload.watermark(documentValue, state.watermark);
        return;
      }
      if (name === "place") {
        upload.status(root, "Вставляем из галереи", "inserting");
        const done = await insert.gallery({ alertEmpty: true, close: true });
        upload.status(root, done ? "Готово" : "Нечего вставлять", done ? "done" : "idle");
        return;
      }
      if (name === "choose") {
        upload.status(root, "Выберите файлы", "choosing");
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
        state.phase = "cancelled";
        upload.status(root, "Отменено", "cancelled");
        frame.close();
      }
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
      upload.status(null, "Открываем загрузку", "opening");
      if (!media.open("type")) return null;
      const documentValue = await wait.uploadDocument();
      if (!documentValue) return null;
      upload.style(documentValue);
      upload.control(documentValue);
      upload.status(null, "Выберите файлы", "ready");
      return documentValue;
    },
    async run(baseline = new Set()) {
      const postId = post.id();
      const documentValue = await upload.open();
      if (!documentValue) {
        if (!state.cancelled) alert("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043a\u0440\u044b\u0442\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0443");
        return false;
      }
      state.phase = "uploading";
      upload.status(null, "Загружаем в медиатеку", "uploading");
      const uploaded = await wait.uploadDone(documentValue, postId, baseline);
      if (!uploaded.length) {
        upload.status(null, "Файлы не загружены", "failed");
        if (!state.cancelled)
          alert("\u0424\u0430\u0439\u043b\u044b \u043d\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u044b \u0438\u043b\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043d\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043b\u0430\u0441\u044c");
        return false;
      }
      state.phase = "inserting";
      upload.status(null, "Вставляем картинки", "inserting");
      if (await upload.insertUploaded()) {
        upload.status(null, "Готово", "done");
        return true;
      }
      upload.status(null, "Новые картинки не найдены", "failed");
      if (!state.cancelled)
        alert("\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043b\u0430\u0441\u044c, \u043d\u043e \u043d\u043e\u0432\u044b\u0435 \u043a\u0430\u0440\u0442\u0438\u043d\u043a\u0438 \u0432 \u0433\u0430\u043b\u0435\u0440\u0435\u0435 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b");
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
      if (mod10 === 1 && mod100 !== 11) return "\u0444\u043e\u0442\u043a\u0443";
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
        return "\u0444\u043e\u0442\u043a\u0438";
      return "\u0444\u043e\u0442\u043e\u043a";
    },
    randomMessage(count = 0) {
      return `\u0421\u0443\u0451\u043c ${count} ${customGallery.photoWord(count)}. \u041f\u043e\u0431\u0438\u0442\u044c \u043d\u0430 \u0433\u0430\u043b\u0435\u0440\u0435\u0438??`;
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
        alert("\u0412 \u0433\u0430\u043b\u0435\u0440\u0435\u044e \u043c\u0438\u043d\u0438\u043c\u0443\u043c \u0434\u0432\u0430 \u044d\u043a\u0441\u043f\u043e\u043d\u0430\u0442\u0430");
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
      alert("\u0412\u044b\u0434\u0435\u043b\u0438 \u043a\u0430\u0440\u0442\u0438\u043d\u043a\u0438 \u0438\u043b\u0438 \u0441\u0432\u043e\u0434\u0438 \u043a\u0443\u0440\u0441\u043e\u0440 \u0432 \u0433\u0430\u043b\u0435\u0440\u0435\u044e");
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
      return window.confirm(`\u0420\u0430\u0441\u043a\u0438\u0434\u0430\u0442\u044c ${count} \u043c\u0435\u0434\u0438\u0430\u0431\u043b\u043e\u043a\u043e\u0432 \u043f\u043e \u0442\u0435\u043a\u0441\u0442\u0443?`);
    },
    imagePrompt(count = 0) {
      return window.confirm(
        `\u0420\u0430\u0441\u043a\u0438\u0434\u0430\u0442\u044c ${count} ${customGallery.photoWord(count)} \u043f\u043e \u0442\u0435\u043a\u0441\u0442\u0443?`, 
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
          alert("\u041a\u0430\u0440\u0442\u0438\u043d\u043a\u0438 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b: \u043d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043a\u0440\u044b\u0442\u044c \u0433\u0430\u043b\u0435\u0440\u0435\u044e");
        return false;
      }
      const filenames = image.filenames(documentValue, postId);
      if (!filenames.length) {
        if (alertEmpty) alert("\u041a\u0430\u0440\u0442\u0438\u043d\u043a\u0438 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b");
        return false;
      }
      const done = editor.insert(filenames);
      if (!done) {
        if (alertEmpty) alert("\u041d\u043e\u0432\u044b\u0445 \u043a\u0430\u0440\u0442\u0438\u043d\u043e\u043a \u043d\u0435\u0442");
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
      upload.status(null, "Проверяем галерею", "checking");
      try {
        const baseline = editor.existing();
        if (await insert.gallery({ alertEmpty: false, close: true })) {
          upload.status(null, "Готово", "done");
          return true;
        }
        return upload.run(baseline);
      } finally {
        state.upload = false;
        if (state.phase !== "done" && state.phase !== "cancelled") {
          state.phase = "idle";
          upload.status(null, "Готово к загрузке", "idle");
        }
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
    copy: {
      title: "\u041c\u0438\u043d\u0438\u0430\u0442\u044e\u0440\u0430",
      placeholder: "URL \u0438\u043b\u0438 hash",
      loading: "\u0418\u0449\u0435\u043c \u043c\u0438\u043d\u0438\u0430\u0442\u044e\u0440\u0443\u2026",
      actions: {
        find: "\u041d\u0430\u0439\u0442\u0438",
        crop: "\u041a\u0440\u043e\u043f\u043d\u0443\u0442\u044c",
        file: "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c",
        library: "\u0411\u0438\u0431\u043b\u0438\u043e\u0442\u0435\u043a\u0430",
        collage: "\u041a\u043e\u043b\u043b\u0430\u0436",
      },
      crop: {
        presets: {
          news: "\u041d\u043e\u0432\u043e\u0441\u0442\u0438",
          long: "\u041b\u043e\u043d\u0433\u0440\u0438\u0434",
          featured: "\u0412\u044b\u0434\u0435\u043b\u0435\u043d\u043d\u043e\u0435",
        },
        controls: {
          fit: "\u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c",
          apply: "\u041f\u043e\u0441\u0442\u0430\u0432\u0438\u0442\u044c",
          remove: "\u0423\u0431\u0440\u0430\u0442\u044c",
          divider: "\u041f\u043e\u0432\u0435\u0440\u043d\u0443\u0442\u044c \u0440\u0430\u0437\u0434\u0435\u043b\u0438\u0442\u0435\u043b\u044c",
          dividerWidth: "\u0428\u0438\u0440\u0438\u043d\u0430",
          swap: "\u0421\u0432\u0430\u043f\u043d\u0443\u0442\u044c",
          forceApply: "\u0412\u043e 1) \u0445\u0443\u043b\u0435 \u0442\u044b \u043c\u043d\u0435 \u0441\u0434\u0435\u043b\u0430\u0435\u0448\u044c",
          forceApplyTitle: "\u0410 \u0447\u0442\u043e, \u0435\u0441\u043b\u0438 \u0442\u0430\u043a\u0438 \u043c\u043e\u0436\u043d\u043e??",
          forceApplied: "\u0432 \u0442\u0435\u0442\u044c\u0438\u0445 3) \u0447\u0442\u043e \u0442\u044b \u043c\u043d\u0435 \u0441\u0434\u0435\u043b\u0430\u0435\u0448\u044c, \u044f \u0432 \u0434\u0440\u0443\u0433\u043c\u043e \u0433\u043e\u0440\u043e\u0434\u0435",
          forceAppliedTitle: "\u0410 \u0433\u043e\u0432\u043e\u0440\u0438\u043b, \u0447\u0442\u043e \u043d\u0435\u043b\u044c\u0437\u044f",
        },
        empty: "\u0412\u0441\u0442\u0430\u0432\u044c \u0441\u0441\u044b\u043b\u043a\u0443 \u043d\u0430 \u043a\u0430\u0440\u0442\u0438\u043d\u043a\u0443 \u0438\u043b\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u0438 \u0444\u0430\u0439\u043b",
        source: "\u0412\u0441\u0442\u0430\u0432\u044c \u0441\u0441\u044b\u043b\u043a\u0443 \u043d\u0430 \u043a\u0430\u0440\u0442\u0438\u043d\u043a\u0443 \u0438\u043b\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u0438 \u0444\u0430\u0439\u043b",
        pick: "\u041a\u043b\u0438\u043a\u043d\u0438, \u0447\u0442\u043e\u0431\u044b \u0432\u044b\u0431\u0440\u0430\u0442\u044c \u0444\u0430\u0439\u043b",
        loadFailed: "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043a\u0430\u0440\u0442\u0438\u043d\u043a\u0443 \u043f\u043e \u0441\u0441\u044b\u043b\u043a\u0435. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u044b\u0439 \u0444\u0430\u0439\u043b.",
        fileFailed: "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043a\u0440\u044b\u0442\u044c \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u044b\u0439 \u0444\u0430\u0439\u043b.",
        preparing: "\u0413\u043e\u0442\u043e\u0432\u0438\u043c JPG\u2026",
        uploading: "\u0417\u0430\u0432\u043e\u0437",
        exportFailed:
          "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u044d\u043a\u0441\u043f\u043e\u0440\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u043a\u0430\u0440\u0442\u0438\u043d\u043a\u0443. \u0414\u043b\u044f \u0432\u043d\u0435\u0448\u043d\u0435\u0439 \u0441\u0441\u044b\u043b\u043a\u0438 \u043d\u0443\u0436\u0435\u043d CORS; \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0444\u0430\u0439\u043b \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u043e.",
        applyFailed:
          "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0438\u043b\u0438 \u043f\u0440\u0438\u043c\u0435\u043d\u0438\u0442\u044c \u043c\u0438\u043d\u0438\u0430\u0442\u044e\u0440\u0443",
        invalidFrame:
          "\u0411\u0435\u0440\u0435\u0433\u0430 \u0432\u0438\u0434\u044c",
        render(preset) {
          return `${preset.label}: ${preset.width}\u00d7${preset.height}. Drag \u2014 \u0434\u0432\u0438\u0433\u0430\u0442\u044c, \u043a\u043e\u043b\u0435\u0441\u043e \u2014 zoom.`;
        },
        notFound(key = "") {
          return `\u0412 \u043c\u0435\u0434\u0438\u0430\u0442\u0435\u043a\u0435 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e: ${key}. \u041c\u043e\u0436\u043d\u043e \u043a\u0440\u043e\u043f\u043d\u0443\u0442\u044c \u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c.`;
        },
      },
      notice: {
        missingButton:
          "\u041a\u043d\u043e\u043f\u043a\u0430 \u043c\u0438\u043d\u0438\u0430\u0442\u044e\u0440\u044b \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430",
        libraryClosed:
          "\u041c\u0435\u0434\u0438\u0430\u0442\u0435\u043a\u0430 \u0434\u043b\u044f \u043c\u0438\u043d\u0438\u0430\u0442\u044e\u0440\u044b \u043d\u0435 \u043e\u0442\u043a\u0440\u044b\u043b\u0430\u0441\u044c",
        invalidValue:
          "\u041d\u0435 \u0432\u0438\u0436\u0443 hash \u0438\u043b\u0438 \u043f\u0440\u044f\u043c\u0443\u044e \u0441\u0441\u044b\u043b\u043a\u0443 \u043d\u0430 \u043a\u0430\u0440\u0442\u0438\u043d\u043a\u0443",
        applyFailed:
          "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u0440\u0438\u043c\u0435\u043d\u0438\u0442\u044c \u043c\u0438\u043d\u0438\u0430\u0442\u044e\u0440\u0443",
        notFound(key = "") {
          return `\u041f\u043e hash \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e: ${key}`;
        },
      },
      search: {
        prompt: "\u0427\u043e \u0438\u0449\u0435\u043c??",
        openFailed(url = "") {
          return `\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043a\u0440\u044b\u0442\u044c \u043f\u043e\u0438\u0441\u043a \u0432 \u043d\u043e\u0432\u043e\u0439 \u0432\u043a\u043b\u0430\u0434\u043a\u0435.\n\n${url}`;
        },
      },
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
        thumb.watchForceApplyFrame();
        window.tb_show(thumb.copy.title, url, false);
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
            thumb.copy.title;
          const src = img?.getAttribute?.("src") || "";
          return {
            id,
            link,
            src,
            title: String(title || id || thumb.copy.title).trim(),
            text: thumb.itemText(item),
            nonce,
            search,
            usable: Boolean(link && id),
          };
        })
        .filter((item) => item.usable && item.src);
    },
    mediaItemId(item) {
      if (!item) return "";
      return (
        String(item.id || "").match(/(\d+)/)?.[1] ||
        String(item.querySelector?.('[name^="attachments["]')?.name || "").match(/attachments\[(\d+)\]/)?.[1] ||
        String(item.querySelector?.('[id^="attachments["]')?.id || "").match(/attachments\[(\d+)\]/)?.[1] ||
        String(item.querySelector?.('input[id*="attachment"],input[name*="attachment"]')?.id || "").match(/(\d+)/)?.[1] ||
        String(item.querySelector?.('input[id*="attachment"],input[name*="attachment"]')?.name || "").match(/(\d+)/)?.[1] ||
        ""
      );
    },
    forceApplyEnabled() {
      const layout = thumb.crop.layoutValue();
      if (cms.layout?.longread?.(layout)) return false;
      if (cms.layout?.news?.(layout)) return true;
      const element = document.querySelector("#layout_select,[name='layout']");
      if (!element) return true;
      const value = [
        element.value || "",
        element.options?.[element.selectedIndex]?.text || "",
      ]
        .join("\n")
        .toLowerCase();
      if (!value) return true;
      if (/longread|лонгрид/.test(value)) return false;
      return /news|новость/.test(value);
    },
    currentThumbnailId() {
      const value = String(document.querySelector("#_thumbnail_id")?.value || "").trim();
      return value && value !== "-1" ? value : "";
    },
    forbiddenThumbnailWarning(item) {
      return [...(item?.querySelectorAll?.(".savesend span,td span") || [])].find((node) =>
        /Данное изображение нельзя использовать как миниатюру/.test(
          String(node.textContent || ""),
        ),
      );
    },
    itemDimensions(item) {
      const id = thumb.mediaItemId(item);
      return String(
        item?.querySelector?.(`#media-dims-${id}`)?.textContent ||
          item?.querySelector?.("[id^='media-dims-']")?.textContent ||
          item?.textContent ||
          "",
      );
    },
    forbiddenThumbnailItem(item) {
      if (!thumb.forceApplyEnabled()) return false;
      if (!item || item.querySelector?.("[data-thumb-force-apply]")) return false;
      if (!thumb.mediaItemId(item)) return false;
      if (!thumb.forbiddenThumbnailWarning(item)) return false;
      return /1200[\s ]*[×x][\s ]*800/.test(thumb.itemDimensions(item));
    },
    injectForceApplyStyle(documentValue) {
      if (!documentValue?.head || documentValue.getElementById("media-thumb-force-apply-style")) return;
      const style = documentValue.createElement("style");
      style.id = "media-thumb-force-apply-style";
      style.textContent = [
        ".media-thumb-force-row{display:block;margin:8px 0 6px;white-space:normal;}",
        ".media-thumb-force-apply{display:inline-block;margin:0;white-space:normal;}",
        ".media-thumb-force-apply[disabled]{opacity:.55;cursor:default;}",
        ".media-thumb-force-status{display:inline-block;margin:0 0 0 8px;color:#777;}"
      ].join("\n");
      documentValue.head.appendChild(style);
    },
    enhanceForceApplyButtons(documentValue = document) {
      if (!documentValue?.querySelectorAll) return false;
      thumb.injectForceApplyStyle(documentValue);
      const items = [
        ...documentValue.querySelectorAll("#media-items .media-item,[id^='media-item-']"),
      ];
      let changed = false;
      items.forEach((item) => {
        if (!thumb.forbiddenThumbnailItem(item)) return;
        const row = documentValue.createElement("span");
        const button = documentValue.createElement("button");
        row.className = "media-thumb-force-row";
        button.type = "button";
        button.className = "media-thumb-force-apply button";
        button.dataset.thumbForceApply = thumb.mediaItemId(item);
        button.textContent = thumb.copy.crop.controls.forceApply;
        button.title = thumb.copy.crop.controls.forceApplyTitle;
        row.appendChild(button);
        thumb.forbiddenThumbnailWarning(item)?.insertAdjacentElement("afterend", row);
        changed = true;
      });
      return changed;
    },
    forceApplyStatusText() {
      const step = Math.floor(Date.now() / 350) % 4;
      return `W Zavoz${".".repeat(step)}`;
    },
    forceAppliedIdFromNativeLink(link) {
      return (
        String(link?.id || "").match(/wp-post-thumbnail-(\d+)/)?.[1] ||
        String(link?.getAttribute?.("onclick") || "").match(/WPSetAsThumbnail\(["']?(\d+)/)?.[1] ||
        ""
      );
    },
    setForceButtonState(button, applied = false) {
      if (!button || button.parentElement?.querySelector?.("[data-thumb-force-status]")) return false;
      const disabled = Boolean(applied);
      const text = applied
        ? thumb.copy.crop.controls.forceApplied
        : thumb.copy.crop.controls.forceApply;
      const title = applied
        ? thumb.copy.crop.controls.forceAppliedTitle
        : thumb.copy.crop.controls.forceApplyTitle;
      if (button.disabled === disabled && button.textContent === text && button.title === title) return false;
      button.disabled = disabled;
      button.textContent = text;
      button.title = title;
      return true;
    },
    syncForceApplyButtonsInDocument(documentValue = document, activeId = thumb.__forceAppliedId || thumb.currentThumbnailId()) {
      const current = String(activeId || "").trim();
      [...(documentValue.querySelectorAll?.("[data-thumb-force-apply]") || [])].forEach((button) => {
        const id = String(button.dataset.thumbForceApply || "").trim();
        thumb.setForceButtonState(button, Boolean(current && id === current));
      });
      return true;
    },
    setForceAppliedId(id = "", documentValue = document) {
      const value = String(id || "").trim();
      if (!value) return false;
      thumb.__forceAppliedId = value;
      thumb.syncForceApplyButtonsInDocument(documentValue, value);
      return true;
    },
    showForceApplyStatus(button) {
      if (!button) return null;
      const documentValue = button.ownerDocument || document;
      const status = documentValue.createElement("span");
      status.className = "media-thumb-force-status";
      status.dataset.thumbForceStatus = button.dataset.thumbForceApply || "";
      button.disabled = true;
      button.insertAdjacentElement("afterend", status);
      const update = () => {
        status.textContent = thumb.forceApplyStatusText();
      };
      update();
      status.__thumbForceStatusTimer = window.setInterval(update, 350);
      return status;
    },
    hideForceApplyStatus(status, button) {
      if (status?.__thumbForceStatusTimer) {
        window.clearInterval(status.__thumbForceStatusTimer);
      }
      status?.remove?.();
      if (button) button.disabled = false;
      return true;
    },
    bindForceApplyButtons(documentValue = document) {
      if (!documentValue?.addEventListener || documentValue.__thumbForceApplyBound) return false;
      documentValue.__thumbForceApplyBound = true;
      documentValue.addEventListener("click", async (event) => {
        const button = event.target?.closest?.("[data-thumb-force-apply]");
        if (!button) {
          const nativeLink = event.target?.closest?.("a.wp-post-thumbnail,[id^='wp-post-thumbnail-']");
          const nativeId = thumb.forceAppliedIdFromNativeLink(nativeLink);
          if (nativeId) {
            const owner = nativeLink.ownerDocument || documentValue || document;
            window.setTimeout(() => thumb.setForceAppliedId(nativeId, owner), 0);
            window.setTimeout(() => thumb.setForceAppliedId(nativeId, owner), 500);
          }
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        const id = String(button.dataset.thumbForceApply || "").trim();
        if (!id) return;
        const status = thumb.showForceApplyStatus(button);
        const done = await thumb.applyAjaxWithLibraryNonce({ id, title: id });
        thumb.hideForceApplyStatus(status, button);
        if (!done) {
          button.disabled = false;
          button.textContent = thumb.copy.crop.controls.forceApply;
          button.title = thumb.copy.crop.controls.forceApplyTitle;
          thumb.notice.applyFailed();
          return;
        }
        thumb.setForceAppliedId(id, button.ownerDocument || documentValue || document);
      }, true);
      return true;
    },
    enhanceForceApplyDocument(documentValue = document) {
      if (!documentValue?.querySelectorAll) return false;
      thumb.bindForceApplyButtons(documentValue);
      const changed = thumb.enhanceForceApplyButtons(documentValue);
      if (changed) thumb.syncForceApplyButtonsInDocument(documentValue);
      return changed;
    },
    forceApplyDocuments() {
      const documents = [document];
      const frameDocument = frame.document();
      if (frameDocument && !documents.includes(frameDocument)) documents.push(frameDocument);
      [...document.querySelectorAll("iframe")].forEach((iframe) => {
        try {
          const value = iframe.contentDocument || iframe.contentWindow?.document || null;
          if (value && !documents.includes(value)) documents.push(value);
        } catch {}
      });
      return documents;
    },
    observeForceApplyDocument(documentValue = document) {
      if (!documentValue?.documentElement) return false;
      thumb.enhanceForceApplyDocument(documentValue);
      const mediaItems = documentValue.querySelector("#media-items");
      if (mediaItems && !mediaItems.__thumbForceApplyObserved) {
        mediaItems.__thumbForceApplyObserved = true;
        const observer = new MutationObserver(() => thumb.enhanceForceApplyDocument(documentValue));
        observer.observe(mediaItems, {
          childList: true,
          subtree: true,
        });
      }
      if (!documentValue.__thumbForceApplyClickScan) {
        documentValue.__thumbForceApplyClickScan = true;
        documentValue.addEventListener(
          "click",
          () => {
            window.setTimeout(() => thumb.enhanceForceApplyDocument(documentValue), 0);
            window.setTimeout(() => thumb.enhanceForceApplyDocument(documentValue), 250);
          },
          true,
        );
      }
      return true;
    },
    scanForceApplyDocuments() {
      thumb.forceApplyDocuments().forEach((documentValue) => thumb.observeForceApplyDocument(documentValue));
      return true;
    },
    scheduleForceApplyScan() {
      [0, 250, 750, 1500].forEach((delay) => {
        window.setTimeout(() => thumb.scanForceApplyDocuments(), delay);
      });
      return true;
    },
    watchForceApplyFrame() {
      thumb.scheduleForceApplyScan();
      [...document.querySelectorAll("iframe")].forEach((iframe) => {
        if (iframe.__thumbForceApplyLoadBound) return;
        iframe.__thumbForceApplyLoadBound = true;
        iframe.addEventListener("load", () => thumb.scheduleForceApplyScan(), true);
      });
      return true;
    },
    bootstrapForceApply() {
      if (thumb.__forceApplyBootstrap) return true;
      thumb.__forceApplyBootstrap = true;
      thumb.watchForceApplyFrame();
      document.addEventListener(
        "click",
        (event) => {
          const link = event.target?.closest?.(
            "#set-post-thumbnail,.thickbox[href*='media-upload.php'],a[href*='media-upload.php'][href*='type=image'],.describe-toggle-on,.describe-toggle-off",
          );
          if (!link) return;
          thumb.scheduleForceApplyScan();
        },
        true,
      );
      return true;
    },
    style() {
      frame.hide();
      host.ensureStyles();
      if (document.getElementById(thumb.id.style)) return;
      host.mount(thumb.id.style, css.media.thumb(thumb.id.root));
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
    hash(value = "") {
      return (String(value || "").match(/[a-f0-9]{24,64}/i) || [""])[0];
    },
    acceptedInput(value = "") {
      const source = String(value || "").trim();
      if (!source) return "";
      if (thumb.sourceUrl(source)) return source;
      return thumb.hash(source) || "";
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
        newsWidth: { key: "news-820w", width: 820, height: null, resize: "width", label: "#×820" },
        newsHeight: { key: "news-800h", width: null, height: 800, resize: "height", label: "#×800" },
        long: { key: "long", width: 1400, height: 700, label: "Лонгрид" },
        longBody: { key: "long-body", width: 1200, height: 800, label: "Лонгрид 3:2" },
        longWidth: { key: "long-820w", width: 820, height: null, resize: "width", label: "#×820" },
        featured: { key: "featured", width: 800, height: 920, label: "Выделенное" },
      },
      layoutValue() {
        const element = cms.layout?.element?.();
        if (!element) return "";
        return [
          cms.layout?.value?.(element) || "",
          element.options?.[element.selectedIndex]?.text || "",
        ]
          .join("\n")
          .toLowerCase();
      },
      relevantPresets() {
        const value = thumb.crop.layoutValue();
        if (cms.layout?.longread?.(value)) {
          return [
            thumb.crop.presets.long,
            thumb.crop.presets.longBody,
            thumb.crop.presets.featured,
            thumb.crop.presets.longWidth,
          ];
        }
        return [
          thumb.crop.presets.news,
          thumb.crop.presets.featured,
          thumb.crop.presets.newsWidth,
          thumb.crop.presets.newsHeight,
        ];
      },
      size(preset = thumb.crop.presets.news, imageValue = null) {
        if (preset.resize === "width") {
          const sourceWidth = imageValue?.naturalWidth || preset.width;
          const sourceHeight = imageValue?.naturalHeight || preset.width;
          const width = Math.min(preset.width, sourceWidth);
          const height = Math.max(1, Math.round((sourceHeight * width) / sourceWidth));
          return { width, height };
        }
        if (preset.resize === "height") {
          const sourceWidth = imageValue?.naturalWidth || preset.height;
          const sourceHeight = imageValue?.naturalHeight || preset.height;
          const height = Math.min(preset.height, sourceHeight);
          const width = Math.max(1, Math.round((sourceWidth * height) / sourceHeight));
          return { width, height };
        }
        return { width: preset.width, height: preset.height };
      },
      preset(key = "") {
        const relevant = thumb.crop.relevantPresets();
        return relevant.find((item) => item.key === key) || relevant[0] || thumb.crop.presets.news;
      },
      timestamp(value = new Date()) {
        const pad = (number) => String(number).padStart(2, "0");
        return [
          value.getFullYear(),
          pad(value.getMonth() + 1),
          pad(value.getDate()),
          "-",
          pad(value.getHours()),
          pad(value.getMinutes()),
          pad(value.getSeconds()),
        ].join("");
      },
      filename(size = {}) {
        const postId = String(post.id() || "post").replace(/\D+/g, "") || "post";
        const width = Math.max(1, Math.round(Number(size.width || 0)));
        const height = Math.max(1, Math.round(Number(size.height || 0)));
        const suffix = width && height ? `${width}x${height}` : "thumb";
        return `${thumb.crop.timestamp()}-post-${postId}-${suffix}.jpg`;
      },
      title(size = {}, timestamp = thumb.crop.timestamp()) {
        const width = Math.max(1, Math.round(Number(size.width || 0)));
        const height = Math.max(1, Math.round(Number(size.height || 0)));
        const suffix = width && height ? `${width}x${height}` : "thumb";
        return `${post.slug()}-${suffix}-${timestamp}`;
      },
      status(root, value = "") {
        const element = root?.querySelector?.("[data-thumb-crop-status]");
        if (!element) return false;
        element.textContent = value;
        element.hidden = !value;
        element.toggleAttribute("data-dots", value === thumb.copy.crop.uploading);
        return true;
      },
      uploading(root, active = false) {
        const stage = root?.querySelector?.("[data-thumb-crop-stage]");
        root?.toggleAttribute?.("data-thumb-crop-uploading", active);
        stage?.toggleAttribute?.("data-uploading", active);
        return Boolean(stage);
      },
      syncViewport(root, size) {
        const stage = root?.querySelector?.("[data-thumb-crop-stage]");
        const canvas = root?.querySelector?.("[data-thumb-crop-canvas]");
        if (!stage || !canvas || !size?.width || !size?.height) return false;
        const ratio = size.width / size.height;
        stage.style.setProperty("--thumb-crop-ratio", String(ratio));
        canvas.style.setProperty("--thumb-crop-ratio", String(ratio));
        return true;
      },
      syncMeta(root, session = null) {
        const element = root?.querySelector?.("[data-thumb-crop-meta]");
        if (!element) return false;
        if (session?.mode === "collage") {
          const values = session.images
            .filter((imageValue) => imageValue?.naturalWidth && imageValue?.naturalHeight)
            .map((imageValue) => `${imageValue.naturalWidth}×${imageValue.naturalHeight}`);
          element.textContent = values.join(" · ");
          element.hidden = !values.length;
          return true;
        }
        const imageValue = session?.image;
        if (!imageValue?.naturalWidth || !imageValue?.naturalHeight) {
          element.textContent = "";
          element.hidden = true;
          return true;
        }
        element.textContent = `${imageValue.naturalWidth}×${imageValue.naturalHeight}`;
        element.hidden = false;
        return true;
      },
      syncCollageControls(root, session = null) {
        const button = root?.querySelector?.('[data-action="crop.divider.width"]');
        if (!button || session?.mode !== "collage") return false;
        const mode = thumb.crop.dividerMode(session);
        const title = `Ширина ${mode.width}px`;
        button.title = title;
        button.setAttribute("aria-label", title);
        return true;
      },
      imageBounds(imageValue, transform, frameValue) {
        const width = imageValue.naturalWidth * transform.scale;
        const height = imageValue.naturalHeight * transform.scale;
        const centerX = frameValue.x + frameValue.width / 2 + transform.x;
        const centerY = frameValue.y + frameValue.height / 2 + transform.y;
        return {
          x: centerX - width / 2,
          y: centerY - height / 2,
          width,
          height,
          right: centerX + width / 2,
          bottom: centerY + height / 2,
        };
      },
      containsPoint(rect, point) {
        return point.x >= rect.x && point.x <= rect.right && point.y >= rect.y && point.y <= rect.bottom;
      },
      pointInPolygon(point, polygon = []) {
        if (!polygon.length) return false;
        let inside = false;
        for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
          const a = polygon[index];
          const b = polygon[previous];
          const hit = ((a.y > point.y) !== (b.y > point.y))
            && point.x < ((b.x - a.x) * (point.y - a.y)) / ((b.y - a.y) || 1) + a.x;
          if (hit) inside = !inside;
        }
        return inside;
      },
      rectIntersection(a, b) {
        const x = Math.max(a.x, b.x);
        const y = Math.max(a.y, b.y);
        const right = Math.min(a.right ?? a.x + a.width, b.right ?? b.x + b.width);
        const bottom = Math.min(a.bottom ?? a.y + a.height, b.bottom ?? b.y + b.height);
        if (right <= x || bottom <= y) return null;
        return { x, y, right, bottom, width: right - x, height: bottom - y };
      },
      removePoint(size, session, side, button) {
        const imageIndex = thumb.crop.collageImageIndex(session, side);
        const imageValue = session.images?.[imageIndex];
        const transform = session.transforms?.[imageIndex];
        if (!imageValue || !transform) return null;
        const frameValue = thumb.crop.frame(size, side, session);
        const polygon = thumb.crop.dividerPolygon(size, side, thumb.crop.dividerMode(session));
        const bounds = thumb.crop.imageBounds(imageValue, transform, frameValue);
        const clip = thumb.crop.rectIntersection(bounds, {
          x: frameValue.x,
          y: frameValue.y,
          width: frameValue.width,
          height: frameValue.height,
          right: frameValue.x + frameValue.width,
          bottom: frameValue.y + frameValue.height,
        });
        if (!clip) return null;
        const offset = 8;
        const buttonWidth = button?.offsetWidth || 24;
        const buttonHeight = button?.offsetHeight || 24;
        const candidates = side === 0
          ? [
            { x: clip.x + offset, y: clip.y + offset },
            { x: clip.x + offset, y: clip.bottom - buttonHeight - offset },
            { x: clip.right - buttonWidth - offset, y: clip.y + offset },
            { x: clip.right - buttonWidth - offset, y: clip.bottom - buttonHeight - offset },
          ]
          : [
            { x: clip.right - buttonWidth - offset, y: clip.y + offset },
            { x: clip.right - buttonWidth - offset, y: clip.bottom - buttonHeight - offset },
            { x: clip.x + offset, y: clip.y + offset },
            { x: clip.x + offset, y: clip.bottom - buttonHeight - offset },
          ];
        return candidates.find((point) => thumb.crop.pointInPolygon({
          x: point.x + buttonWidth / 2,
          y: point.y + buttonHeight / 2,
        }, polygon)) || candidates[0];
      },
      frameCovered(imageValue, transform, frameValue, polygon = null) {
        const bounds = thumb.crop.imageBounds(imageValue, transform, frameValue);
        const points = polygon?.length ? polygon : [
          { x: frameValue.x, y: frameValue.y },
          { x: frameValue.x + frameValue.width, y: frameValue.y },
          { x: frameValue.x + frameValue.width, y: frameValue.y + frameValue.height },
          { x: frameValue.x, y: frameValue.y + frameValue.height },
        ];
        return points.every((point) => thumb.crop.containsPoint(bounds, point));
      },
      coverageValid(session = null, size = null) {
        if (!session || !size?.width || !size?.height) return true;
        if (session.mode === "collage") {
          return [0, 1].every((side) => {
            const imageIndex = thumb.crop.collageImageIndex(session, side);
            const imageValue = session.images?.[imageIndex];
            const transform = session.transforms?.[imageIndex];
            if (!imageValue || !transform) return false;
            const frameValue = thumb.crop.frame(size, side, session);
            const polygon = thumb.crop.dividerPolygon(size, side, thumb.crop.dividerMode(session));
            return thumb.crop.frameCovered(imageValue, transform, frameValue, polygon);
          });
        }
        return thumb.crop.frameCovered(session.image, session.transform, thumb.crop.frame(size, null));
      },
      syncRemoveButtons(root, session = null) {
        const stage = root?.querySelector?.("[data-thumb-crop-stage]");
        const canvas = root?.querySelector?.("[data-thumb-crop-canvas]");
        const buttons = [...(root?.querySelectorAll?.("[data-thumb-crop-remove]") || [])];
        if (!stage || !canvas || session?.mode !== "collage") {
          buttons.forEach((button) => {
            button.style.removeProperty("--thumb-remove-left");
            button.style.removeProperty("--thumb-remove-top");
          });
          return false;
        }
        window.requestAnimationFrame?.(() => {
          const stageRect = stage.getBoundingClientRect();
          const canvasRect = canvas.getBoundingClientRect();
          const size = thumb.crop.size(session.preset, session.image);
          if (!stageRect.width || !canvasRect.width || !size.width || !size.height) return;
          const scaleX = canvasRect.width / size.width;
          const scaleY = canvasRect.height / size.height;
          buttons.forEach((button) => {
            const side = Number(button.dataset.thumbCropRemove || 0);
            const point = thumb.crop.removePoint(size, session, side, button);
            if (!point) return;
            const left = canvasRect.left - stageRect.left + point.x * scaleX;
            const top = canvasRect.top - stageRect.top + point.y * scaleY;
            button.style.setProperty("--thumb-remove-left", `${Math.max(0, Math.round(left))}px`);
            button.style.setProperty("--thumb-remove-top", `${Math.max(0, Math.round(top))}px`);
          });
        });
        return true;
      },
      glyph(name = "", fallback = name) {
        return ui.controls.glyph(name, 20, fallback || name);
      },
      applyGlyph(root, name = "Document Ribbon") {
        const button = root?.querySelector?.('[data-action="crop.apply"]');
        if (!button) return false;
        const target = button.querySelector?.(".ui-icon-content") || button;
        target.innerHTML = thumb.crop.glyph(name, "Document Ribbon");
        button.dataset.cropApplied = "true";
        return true;
      },
      view: {
        button({ action, title, content = "", fluent = "", fallback = "", classes = "" }) {
          return ui.controls.button({
            content: content ? `<span class="media-thumb-flow-tool-label">${thumb.escape(content)}</span>` : "",
            fluent,
            fallback: fallback || fluent,
            size: 20,
            action,
            title,
            classes,
            attrs: ' type="button"',
          });
        },
        presetLabel(preset) {
          if (preset.resize === "width") return preset.label || `#×${preset.width}`;
          if (preset.resize === "height") return preset.label || `#×${preset.height}`;
          return `${preset.width}×${preset.height}`;
        },
        currentPreset(root) {
          return thumb.crop.preset(root?.__thumbCropPresetKey || "");
        },
        nextPreset(root) {
          const presets = thumb.crop.relevantPresets();
          if (!presets.length) return thumb.crop.presets.news;
          const current = thumb.crop.view.currentPreset(root);
          const index = Math.max(0, presets.findIndex((preset) => preset.key === current.key));
          return presets[(index + 1) % presets.length] || presets[0];
        },
        syncPreset(root) {
          const button = root?.querySelector?.('[data-action="crop.size"]');
          if (!button) return false;
          const preset = thumb.crop.view.currentPreset(root);
          const label = thumb.crop.view.presetLabel(preset);
          const target = button.querySelector?.(".media-thumb-flow-tool-label") || button;
          target.textContent = label;
          button.title = `${preset.label} ${label}`;
          return true;
        },
        presetButton(preset) {
          const size = thumb.crop.view.presetLabel(preset);
          return thumb.crop.view.button({
            action: "crop.size",
            title: `${preset.label} ${size}`,
            content: size,
            classes: "media-thumb-flow-crop-text",
          });
        },
        iconButton({ action, title, fluent, fallback }) {
          return thumb.crop.view.button({
            action,
            title,
            fluent,
            fallback,
            classes: "media-thumb-flow-crop-icon",
          });
        },
        toolCluster(content = "", attrs = "") {
          return ui.controls.cluster({
            content,
            role: "thumb-crop",
            group: { attrs: ` data-thumb-crop-cluster="true"${attrs}` },
          });
        },
        html() {
          const preset = thumb.crop.preset("");
          const presetCluster = thumb.crop.view.toolCluster(
            thumb.crop.view.presetButton(preset),
            ' data-thumb-crop-preset-cluster="true"',
          );
          const collageClusters = [
            thumb.crop.view.iconButton({ action: "crop.divider.width", title: thumb.copy.crop.controls.dividerWidth, fluent: "Image Split", fallback: "Split" }),
            thumb.crop.view.iconButton({ action: "crop.divider.swap", title: thumb.copy.crop.controls.swap, fluent: "Image Reflection", fallback: "Swap" }),
          ]
            .map((button) => thumb.crop.view.toolCluster(button, ' data-thumb-crop-collage-cluster="true"'))
            .join("");
          const actionClusters = [
            thumb.crop.view.iconButton({ action: "crop.fit", title: thumb.copy.crop.controls.fit, fluent: "Arrow Reset", fallback: "Arrow Counterclockwise" }),
            thumb.crop.view.iconButton({ action: "crop.apply", title: thumb.copy.crop.controls.apply, fluent: "Ribbon Star", fallback: "Ribbon" }),
          ]
            .map((button) => thumb.crop.view.toolCluster(button, ' data-thumb-crop-action-cluster="true"'))
            .join("");
          return `
            <div data-thumb-crop="true">
              <div data-thumb-crop-tools="true">
                <div data-thumb-crop-left="true">${thumb.view.actionsCluster()}</div>
                <div data-thumb-crop-actions="true">${presetCluster}${collageClusters}${actionClusters}</div>
              </div>
              <div data-thumb-crop-stage="true" data-field-resize-edge="true" title="${thumb.escape(thumb.copy.crop.pick)}">
                <canvas class="media-thumb-flow-canvas" data-thumb-crop-canvas="true" title="${thumb.escape(thumb.copy.crop.pick)}"></canvas>
                <button type="button" data-action="crop.remove.0" data-thumb-crop-remove="0" title="${thumb.escape(thumb.copy.crop.controls.remove)}">${ui.controls.glyph("Image Off", 16, "×")}</button>
                <button type="button" data-action="crop.remove.1" data-thumb-crop-remove="1" title="${thumb.escape(thumb.copy.crop.controls.remove)}">${ui.controls.glyph("Image Off", 16, "×")}</button>
                <div data-thumb-crop-status="true">${thumb.copy.crop.empty}</div>
              </div>
              <div data-thumb-crop-meta="true" hidden></div>
            </div>
          `;
        },
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
          filename: url || "thumb.jpg",
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
          filename: file.name || "thumb.jpg",
          source: "file",
        };
      },
      fit(imageValue, preset) {
        const size = thumb.crop.size(preset, imageValue);
        const scale = Math.max(
          size.width / imageValue.naturalWidth,
          size.height / imageValue.naturalHeight,
        );
        return { x: 0, y: 0, scale };
      },
      coverScale(imageValue, size) {
        if (!imageValue?.naturalWidth || !imageValue?.naturalHeight || !size?.width || !size?.height) return 1;
        return Math.max(size.width / imageValue.naturalWidth, size.height / imageValue.naturalHeight);
      },
      dividerWidths: [3, 5, 7, 10, 14],
      dividerMode(session = null) {
        const widths = thumb.crop.dividerWidths;
        const index = Math.max(0, Number(session?.dividerIndex || 0));
        const width = widths[index % widths.length] || 5;
        return {
          key: `divider-${width}`,
          angle: Number.isFinite(session?.dividerAngle) ? session.dividerAngle : Math.PI / 2,
          width,
        };
      },
      cycleDividerWidth(session = null) {
        if (!session || session.mode !== "collage") return false;
        session.dividerIndex = (Number(session.dividerIndex || 0) + 1) % thumb.crop.dividerWidths.length;
        return true;
      },
      swapCollage(session = null) {
        if (!session || session.mode !== "collage") return false;
        const order = Array.isArray(session.sideOrder) ? session.sideOrder : [0, 1];
        session.sideOrder = [order[1] ?? 1, order[0] ?? 0];
        return true;
      },
      collageImageIndex(session = null, side = 0) {
        if (!session || session.mode !== "collage") return side;
        const order = Array.isArray(session.sideOrder) ? session.sideOrder : [0, 1];
        const index = order[side] ?? side;
        return Number.isFinite(index) ? index : side;
      },
      snapAngle(angle = 0) {
        const options = [Math.PI / 2, Math.PI / 4, -Math.PI / 4];
        const threshold = Math.PI / 36;
        const match = options
          .map((value) => ({ value, distance: Math.abs(Math.atan2(Math.sin(angle - value), Math.cos(angle - value))) }))
          .sort((a, b) => a.distance - b.distance)[0];
        return match && match.distance <= threshold ? match.value : angle;
      },
      rotateDivider(session = null, size = null, point = null) {
        if (!session || session.mode !== "collage" || !size?.width || !size?.height || !point) return false;
        const angle = Math.atan2(point.y - size.height / 2, point.x - size.width / 2);
        if (!Number.isFinite(angle)) return false;
        session.dividerAngle = thumb.crop.snapAngle(angle);
        return true;
      },
      frame(size, index = null, session = null) {
        if (!size?.width || !size?.height) return { x: 0, y: 0, width: 1, height: 1 };
        if (session?.mode === "collage" && (index === 0 || index === 1)) {
          const polygon = thumb.crop.dividerPolygon(size, index, thumb.crop.dividerMode(session));
          if (polygon.length) {
            const xs = polygon.map((point) => point.x);
            const ys = polygon.map((point) => point.y);
            const x = Math.min(...xs);
            const y = Math.min(...ys);
            const width = Math.max(1, Math.max(...xs) - x);
            const height = Math.max(1, Math.max(...ys) - y);
            return { x, y, width, height };
          }
        }
        return { x: 0, y: 0, width: size.width, height: size.height };
      },
      fitFrame(imageValue, frameValue) {
        const scale = Math.max(
          frameValue.width / imageValue.naturalWidth,
          frameValue.height / imageValue.naturalHeight,
        );
        return { x: 0, y: 0, scale };
      },
      frameTransform(imageValue, transform, frameValue) {
        const imageWidth = imageValue.naturalWidth * transform.scale;
        const imageHeight = imageValue.naturalHeight * transform.scale;
        const limitX = Math.max(0, (imageWidth - frameValue.width) / 2);
        const limitY = Math.max(0, (imageHeight - frameValue.height) / 2);
        transform.x = Math.max(-limitX, Math.min(limitX, transform.x));
        transform.y = Math.max(-limitY, Math.min(limitY, transform.y));
        return transform;
      },
      drawFrame(context, imageValue, transform, frameValue) {
        context.save();
        context.beginPath();
        context.rect(frameValue.x, frameValue.y, frameValue.width, frameValue.height);
        context.clip();
        context.translate(frameValue.x + frameValue.width / 2 + transform.x, frameValue.y + frameValue.height / 2 + transform.y);
        context.scale(transform.scale, transform.scale);
        context.drawImage(imageValue, -imageValue.naturalWidth / 2, -imageValue.naturalHeight / 2);
        context.restore();
        return true;
      },
      dividerValue(size, point, mode) {
        if (!size?.width || !size?.height || !point) return 0;
        const angle = Number.isFinite(mode?.angle) ? mode.angle : Math.PI / 2;
        const nx = -Math.sin(angle);
        const ny = Math.cos(angle);
        return (point.x - size.width / 2) * nx + (point.y - size.height / 2) * ny;
      },
      dividerHit(size, point, mode) {
        const value = Math.abs(thumb.crop.dividerValue(size, point, mode));
        return value <= Math.max(10, (mode?.width || 5) * 2);
      },
      collageSide(size, point, mode) {
        return thumb.crop.dividerValue(size, point, mode) < 0 ? 0 : 1;
      },
      dividerPolygon(size, index, mode) {
        if (!size?.width || !size?.height) return [];
        const source = [
          { x: 0, y: 0 },
          { x: size.width, y: 0 },
          { x: size.width, y: size.height },
          { x: 0, y: size.height },
        ];
        const inside = (point) => index === 0
          ? thumb.crop.dividerValue(size, point, mode) <= 0
          : thumb.crop.dividerValue(size, point, mode) >= 0;
        const intersection = (a, b) => {
          const av = thumb.crop.dividerValue(size, a, mode);
          const bv = thumb.crop.dividerValue(size, b, mode);
          const divider = av - bv;
          const t = divider ? av / divider : 0;
          return {
            x: a.x + (b.x - a.x) * t,
            y: a.y + (b.y - a.y) * t,
          };
        };
        const out = [];
        source.forEach((point, pointIndex) => {
          const previous = source[(pointIndex + source.length - 1) % source.length];
          const pointInside = inside(point);
          const previousInside = inside(previous);
          if (pointInside) {
            if (!previousInside) out.push(intersection(previous, point));
            out.push(point);
          } else if (previousInside) {
            out.push(intersection(previous, point));
          }
        });
        return out;
      },
      dividerLine(size, mode) {
        const angle = Number.isFinite(mode?.angle) ? mode.angle : Math.PI / 2;
        const vx = Math.cos(angle);
        const vy = Math.sin(angle);
        const cx = size.width / 2;
        const cy = size.height / 2;
        const scale = Math.hypot(size.width, size.height);
        return {
          a: { x: cx - vx * scale, y: cy - vy * scale },
          b: { x: cx + vx * scale, y: cy + vy * scale },
        };
      },
      drawDivider(context, size, mode) {
        const line = thumb.crop.dividerLine(size, mode);
        context.save();
        context.strokeStyle = "#ffffff";
        context.lineWidth = mode.width;
        context.lineCap = "square";
        context.beginPath();
        context.moveTo(line.a.x, line.a.y);
        context.lineTo(line.b.x, line.b.y);
        context.stroke();
        context.restore();
        return true;
      },
      drawPolygonFrame(context, imageValue, transform, frameValue, polygon = []) {
        if (!polygon.length) return false;
        context.save();
        context.beginPath();
        context.moveTo(polygon[0].x, polygon[0].y);
        polygon.slice(1).forEach((point) => context.lineTo(point.x, point.y));
        context.closePath();
        context.clip();
        context.translate(frameValue.x + frameValue.width / 2 + transform.x, frameValue.y + frameValue.height / 2 + transform.y);
        context.scale(transform.scale, transform.scale);
        context.drawImage(imageValue, -imageValue.naturalWidth / 2, -imageValue.naturalHeight / 2);
        context.restore();
        return true;
      },
      activeIndex(session, size, point = null) {
        if (session?.mode !== "collage") return null;
        if (!point) return thumb.crop.collageImageIndex(session, 0);
        const side = thumb.crop.collageSide(size, point, thumb.crop.dividerMode(session));
        return thumb.crop.collageImageIndex(session, side);
      },
      clampTransform(session, size) {
        if (!session || !size?.width || !size?.height) return false;
        if (session.mode === "collage") return true;
        if (!session.image) return false;
        thumb.crop.frameTransform(session.image, session.transform, thumb.crop.frame(size, null));
        return true;
      },
      session(data = {}, root = null) {
        const preset = thumb.crop.preset(root?.__thumbCropPresetKey || "");
        return {
          mode: "single",
          image: data.image,
          url: data.url || "",
          filename: data.filename || "thumb.jpg",
          source: data.source || "url",
          preset,
          transform: thumb.crop.fit(data.image, preset),
          drag: null,
        };
      },
      dataFromSession(session = null) {
        if (!session?.image) return null;
        return {
          image: session.image,
          url: session.url || "",
          filename: session.filename || "thumb.jpg",
          source: session.source || "session",
        };
      },
      collageSession(first = {}, second = {}, root = null) {
        const preset = thumb.crop.preset(root?.__thumbCropPresetKey || "");
        const size = thumb.crop.size(preset, first.image);
        const session = {
          mode: "collage",
          image: first.image,
          images: [first.image, second.image],
          urls: [first.url || "", second.url || ""],
          filename: first.filename || second.filename || "collage.jpg",
          source: "collage",
          preset,
          transforms: [],
          dividerCycle: 0,
          dividerIndex: 0,
          sideOrder: [0, 1],
          drag: null,
        };
        session.transforms = session.images.map((imageValue, imageIndex) => {
          const side = session.sideOrder.indexOf(imageIndex);
          return thumb.crop.fitFrame(imageValue, thumb.crop.frame(size, side < 0 ? imageIndex : side, session));
        });
        return session;
      },
      reset(session) {
        if (session.mode === "collage") {
          const size = thumb.crop.size(session.preset, session.image);
            session.transforms = session.images.map((imageValue, imageIndex) => {
            const side = session.sideOrder.indexOf(imageIndex);
            return thumb.crop.fitFrame(imageValue, thumb.crop.frame(size, side < 0 ? imageIndex : side, session));
          });
          return session;
        }
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
        const size = thumb.crop.size(session.preset, session.image);
        canvas.width = size.width;
        canvas.height = size.height;
        thumb.crop.syncViewport(root, size);
        thumb.crop.syncMeta(root, session);
        thumb.crop.syncCollageControls(root, session);
        thumb.crop.syncRemoveButtons(root, session);
        const stage = root.querySelector?.("[data-thumb-crop-stage]");
        const validFrame = thumb.crop.coverageValid(session, size);
        stage?.toggleAttribute?.("data-invalid-frame", !validFrame);
        root.toggleAttribute?.("data-invalid-frame", !validFrame);
        stage?.setAttribute?.("data-has-image", "true");
        if (session.mode === "collage") {
          stage?.setAttribute?.("data-has-collage", "true");
          root.setAttribute?.("data-has-collage", "true");
        } else {
          stage?.removeAttribute?.("data-has-collage");
          root.removeAttribute?.("data-has-collage");
        }
        thumb.crop.clampTransform(session, size);
        const context = canvas.getContext("2d", { alpha: false });
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        if (session.mode === "collage") {
          const mode = thumb.crop.dividerMode(session);
            [0, 1].forEach((side) => {
            const imageIndex = thumb.crop.collageImageIndex(session, side);
            const imageValue = session.images[imageIndex];
            if (!imageValue) return;
            thumb.crop.drawPolygonFrame(
              context,
              imageValue,
              session.transforms[imageIndex],
              thumb.crop.frame(size, side, session),
              thumb.crop.dividerPolygon(size, side, mode),
            );
          });
          thumb.crop.drawDivider(context, size, mode);
        } else {
          thumb.crop.drawFrame(context, session.image, session.transform, thumb.crop.frame(size, null));
        }
        thumb.crop.status(root, "");
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
      prime(root) {
        const canvas = root?.querySelector?.("[data-thumb-crop-canvas]");
        if (!canvas || root?.__thumbCropSession) return false;
        canvas.width = 1;
        canvas.height = 1;
        canvas.style.removeProperty("--thumb-crop-ratio");
        thumb.crop.syncMeta(root, null);
        thumb.crop.syncRemoveButtons(root, null);
        const stage = root.querySelector?.("[data-thumb-crop-stage]");
        stage?.removeAttribute?.("data-invalid-frame");
        root.removeAttribute?.("data-invalid-frame");
        stage?.removeAttribute?.("data-has-image");
        stage?.removeAttribute?.("data-has-collage");
        root.removeAttribute?.("data-has-collage");
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        return true;
      },
      bindCanvas(root) {
        const canvas = root?.querySelector?.("[data-thumb-crop-canvas]");
        const stage = root?.querySelector?.("[data-thumb-crop-stage]");
        if (!canvas || canvas.dataset.thumbCropBound === "true") return;
        canvas.dataset.thumbCropBound = "true";
        canvas.addEventListener("pointerdown", (event) => {
          const session = root.__thumbCropSession;
          event.preventDefault();
          event.stopPropagation();
          if (!session) return;
          const point = thumb.crop.point(canvas, event);
          const size = thumb.crop.size(session.preset, session.image);
          if (session.mode === "collage" && thumb.crop.dividerHit(size, point, thumb.crop.dividerMode(session))) {
            session.drag = {
              pointerId: event.pointerId,
              divider: true,
              moved: false,
              x: point.x,
              y: point.y,
            };
            stage?.setAttribute?.("data-divider-dragging", "true");
            canvas.setPointerCapture?.(event.pointerId);
            return;
          }
          const index = thumb.crop.activeIndex(session, size, point);
          const transform = index === null ? session.transform : session.transforms[index];
          session.drag = {
            pointerId: event.pointerId,
            index,
            x: point.x,
            y: point.y,
            transform: { ...transform },
          };
          stage?.setAttribute?.("data-dragging", "true");
          canvas.setPointerCapture?.(event.pointerId);
        });
        canvas.addEventListener("pointermove", (event) => {
          const session = root.__thumbCropSession;
          if (!session?.drag) {
            if (session?.mode === "collage") {
              const point = thumb.crop.point(canvas, event);
              const size = thumb.crop.size(session.preset, session.image);
              stage?.toggleAttribute?.("data-divider-hover", thumb.crop.dividerHit(size, point, thumb.crop.dividerMode(session)));
            }
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          const point = thumb.crop.point(canvas, event);
          if (session.drag.divider) {
            session.drag.moved = session.drag.moved || Math.hypot(point.x - session.drag.x, point.y - session.drag.y) > 4;
            if (session.drag.moved) {
              thumb.crop.rotateDivider(session, thumb.crop.size(session.preset, session.image), point);
              thumb.crop.render(root);
            }
            return;
          }
          const target = session.drag.index === null ? session.transform : session.transforms[session.drag.index];
          target.x = session.drag.transform.x + point.x - session.drag.x;
          target.y = session.drag.transform.y + point.y - session.drag.y;
          thumb.crop.render(root);
        });
        const end = (event) => {
          const session = root.__thumbCropSession;
          if (!session?.drag) return;
          event?.preventDefault?.();
          event?.stopPropagation?.();
          const drag = session.drag;
          canvas.releasePointerCapture?.(event?.pointerId ?? drag.pointerId);
          session.drag = null;
          stage?.removeAttribute?.("data-dragging");
          stage?.removeAttribute?.("data-divider-dragging");
          if (drag.divider && !drag.moved) {
            thumb.crop.render(root);
          }
        };
        canvas.addEventListener("pointerup", end);
        canvas.addEventListener("pointercancel", end);
        canvas.addEventListener("pointerleave", () => {
          if (!root.__thumbCropSession?.drag) stage?.removeAttribute?.("data-divider-hover");
        });
        window.addEventListener("pointerup", end, true);
        window.addEventListener("pointercancel", end, true);
        canvas.addEventListener("wheel", (event) => {
          const session = root.__thumbCropSession;
          event.preventDefault();
          event.stopPropagation();
          if (!session) return;
          const size = thumb.crop.size(session.preset, session.image);
          const point = thumb.crop.point(canvas, event);
          const index = thumb.crop.activeIndex(session, size, point);
          const imageValue = index === null ? session.image : session.images[index];
          const transform = index === null ? session.transform : session.transforms[index];
          const side = index === null ? null : (session.sideOrder || [0, 1]).indexOf(index);
          const frameValue = index === null ? thumb.crop.frame(size, null) : thumb.crop.frame(size, side < 0 ? 0 : side, session);
          const beforeScale = transform.scale;
          const factor = Math.exp(-event.deltaY * 0.0012);
          const minScale = thumb.crop.coverScale(imageValue, frameValue);
          const nextScale = Math.max(minScale, Math.min(10, beforeScale * factor));
          if (nextScale === beforeScale) return;
          const centerX = frameValue.x + frameValue.width / 2 + transform.x;
          const centerY = frameValue.y + frameValue.height / 2 + transform.y;
          const sourceX = (point.x - centerX) / beforeScale;
          const sourceY = (point.y - centerY) / beforeScale;
          transform.scale = nextScale;
          transform.x = point.x - frameValue.x - frameValue.width / 2 - sourceX * nextScale;
          transform.y = point.y - frameValue.y - frameValue.height / 2 - sourceY * nextScale;
          thumb.crop.render(root);
        }, { passive: false });
        stage?.addEventListener?.("click", (event) => {
          if (root.__thumbCropSession) return;
          event.preventDefault();
          event.stopPropagation();
          thumb.chooseFile(root);
        });
      },
      ensure(root) {
        const holder = root?.querySelector?.("[data-thumb-body]");
        if (!holder) return false;
        holder.dataset.thumbMode = "crop";
        if (!holder.querySelector("[data-thumb-crop]")) {
          holder.insertAdjacentHTML("beforeend", thumb.crop.view.html());
        }
        thumb.crop.view.syncPreset(root);
        thumb.crop.prime(root);
        thumb.crop.bindCanvas(root);
        return true;
      },
      async mount(root, value = "") {
        if (!thumb.crop.ensure(root)) return false;
        const url = thumb.sourceUrl(value);
        if (!url) {
          thumb.crop.status(root, thumb.copy.crop.source);
          return false;
        }
        try {
          const data = await thumb.crop.image(url);
          root.__thumbCropSession = thumb.crop.session(data, root);
          thumb.crop.render(root);
          return true;
        } catch {
          thumb.crop.status(root, thumb.copy.crop.loadFailed);
          return false;
        }
      },
      async mountFile(root, file) {
        if (!file?.type?.startsWith?.("image/") || !thumb.crop.ensure(root)) {
          return false;
        }
        try {
          const data = await thumb.crop.file(file);
          root.__thumbCropSession = thumb.crop.session(data, root);
          thumb.crop.render(root);
          return true;
        } catch {
          thumb.crop.status(root, thumb.copy.crop.fileFailed);
          return false;
        }
      },
      async mountCollageFiles(root, firstFile, secondFile) {
        if (!firstFile?.type?.startsWith?.("image/") || !secondFile?.type?.startsWith?.("image/") || !thumb.crop.ensure(root)) {
          return false;
        }
        try {
          const first = await thumb.crop.file(firstFile);
          const second = await thumb.crop.file(secondFile);
          root.__thumbCropSession = thumb.crop.collageSession(first, second, root);
          thumb.crop.render(root);
          return true;
        } catch {
          thumb.crop.status(root, thumb.copy.crop.fileFailed);
          return false;
        }
      },
      async mountCollageSecond(root, file) {
        const first = thumb.crop.dataFromSession(root?.__thumbCropSession);
        if (!first || !file?.type?.startsWith?.("image/") || !thumb.crop.ensure(root)) return false;
        try {
          const second = await thumb.crop.file(file);
          root.__thumbCropSession = thumb.crop.collageSession(first, second, root);
          thumb.crop.render(root);
          return true;
        } catch {
          thumb.crop.status(root, thumb.copy.crop.fileFailed);
          return false;
        }
      },
      async upload(root) {
        const session = root?.__thumbCropSession;
        if (!session) return null;
        thumb.crop.status(root, thumb.copy.crop.preparing);
        thumb.crop.uploading(root, true);
        try {
          const size = thumb.crop.size(session.preset, session.image);
          const timestamp = thumb.crop.timestamp();
          const blob = await thumb.crop.blob(root);
          thumb.crop.status(root, thumb.copy.crop.uploading);
          return await thumb.uploadBlob(blob, thumb.crop.filename(size), thumb.crop.title(size, timestamp));
        } catch {
          thumb.crop.status(root, thumb.copy.crop.exportFailed);
          return null;
        } finally {
          thumb.crop.uploading(root, false);
        }
      },
    },
    view: {
      head(value = "") {
        const marker = ui.controls.marker({
          content: icon.emoji("framed-picture"),
          button: {
            title: thumb.copy.title,
            attrs: ` type="button" tabindex="-1" aria-label="${thumb.copy.title}"`,
          },
        });
        const chrome = ui.controls.chrome({
          theme: thumb.theme(),
          themeAction: "thumb.theme",
          closeAction: "thumb.close",
        });
        return ui.shell.frame({
          left: marker,
          main: thumb.view.inputCluster(value),
          right: chrome,
          classes: "media-thumb-flow-head",
          attrs: ' data-thumb-head="true" data-panel-drag-handle="true"',
        });
      },
      action({ action, title, content = "", fluent = "", fallback = "" }) {
        return ui.controls.button({
          content,
          fluent,
          fallback,
          title,
          attrs: ` type="button" data-action="${action}"`,
        });
      },
      inputCluster(value = "") {
        return ui.controls.cluster({
          content: `<input class="media-thumb-flow-input" type="text" value="${thumb.escape(value)}" placeholder="${thumb.escape(thumb.copy.placeholder)}" data-thumb-input="true">`,
          group: {
            attrs: ' data-thumb-input-group="true"',
          },
        });
      },
      actionsCluster() {
        return ui.controls.cluster({
          content: `${thumb.view.action({ action: "find", title: thumb.copy.actions.find, fluent: "Search", fallback: "Search" })}${thumb.view.action({ action: "library", title: thumb.copy.actions.library, fluent: "Image Multiple", fallback: "Image" })}${thumb.view.action({ action: "file", title: thumb.copy.actions.file, fluent: "Arrow Upload", fallback: "Upload" })}${thumb.view.action({ action: "crop", title: thumb.copy.actions.crop, fluent: "Resize Large", fallback: "Crop" })}${thumb.view.action({ action: "collage", title: thumb.copy.actions.collage, fluent: "Image Stack", fallback: "Collage" })}`,
          group: {
            attrs: ' data-thumb-actions="true"',
          },
        });
      },
      field() {
        return `<div data-thumb-field="true">${thumb.view.actionsCluster()}</div>`;
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
      status(value = "", { busy = false } = {}) {
        if (!value) return "";
        const label = busy ? "" : `<span>${thumb.escape(value)}</span>`;
        const size = busy ? 48 : 20;
        return [
          `<div data-thumb-status="true"${busy ? ' data-busy="true"' : ""}>`,
          `<span data-thumb-status-glyph="true">${ui.controls.glyph("Timer", size, "Timer")}</span>`,
          label,
          `</div>`,
        ].join("");
      },
      html({ value = "", items = [], status = "", busy = false } = {}) {
        const file = '<input type="file" accept="image/*" multiple data-thumb-file="true">';
        const body = `<div data-thumb-body="true">${thumb.view.field()}${file}${items.length ? thumb.view.results(items) : thumb.view.status(status, { busy })}</div>`;
        return ui.shell.stack(`${thumb.view.head(value)}${body}`);
      },
      root({ value = "", items = [], status = "", busy = false } = {}) {
        thumb.style();
        const root = host.create({
          id: thumb.id.root,
          html: thumb.view.html({ value, items, status, busy }),
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
    },
    input(root) {
      return root?.querySelector?.("[data-thumb-input]") || null;
    },
    inputValue(root) {
      return thumb.input(root)?.value || "";
    },
    fileInput(root) {
      return root?.querySelector?.("[data-thumb-file]") || null;
    },
    stage(root) {
      return root?.querySelector?.("[data-thumb-crop-stage]") || null;
    },
    setFileDragging(root, active = false) {
      const stage = thumb.stage(root);
      if (!stage) return false;
      if (active) {
        stage.setAttribute("data-file-dragging", "true");
        return true;
      }
      stage.removeAttribute("data-file-dragging");
      return true;
    },
    close(root) {
      frame.close();
      root?.remove?.();
      return true;
    },
    toggleTheme(root) {
      if (!root) return "dark";
      root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
      ui.controls.chrome.theme(root, {
        theme: root.dataset.theme,
        action: "thumb.theme",
      });
      return root.dataset.theme;
    },
    chooseFile(root) {
      thumb.fileInput(root)?.click?.();
      return true;
    },
    async showLibrary(root) {
      const current = await thumb.loadCandidates();
      thumb.show({
        value: thumb.inputValue(root),
        items: current.slice(0, 24),
      });
      return true;
    },
    search(root) {
      return thumb.find(thumb.inputValue(root));
    },
    cropCurrent(root) {
      return thumb.crop.mount(root, thumb.inputValue(root));
    },
    async applyItem(root, item) {
      if (!item || !(await thumb.apply(item))) return false;
      window.setTimeout(() => {
        thumb.close(root);
      }, 700);
      return true;
    },
    async pasteValue(root, value = "") {
      if (thumb.key(value).primary) {
        if (await thumb.find(value, { applyExact: true })) {
          thumb.close(root);
        }
        return true;
      }
      if (thumb.sourceUrl(value)) {
        await thumb.crop.mount(root, value);
        return true;
      }
      return false;
    },
    async mountDroppedFile(root, file) {
      if (!file?.type?.startsWith?.("image/")) return false;
      await thumb.crop.mountFile(root, file);
      return true;
    },
    handlers: {
      change(root) {
        return async (event) => {
          const input = event.target?.closest?.("[data-thumb-file]");
          if (!input || !root.contains(input)) return;
          const files = Array.from(input.files || []).filter((file) => file?.type?.startsWith?.("image/"));
          const pickMode = root.__thumbPickMode || "";
          root.__thumbPickMode = "";
          input.value = "";
          if (pickMode === "collage" && files.length >= 2) {
            await thumb.crop.mountCollageFiles(root, files[0], files[1]);
            return;
          }
          if (pickMode === "collage" && files[0] && root.__thumbCropSession?.image) {
            await thumb.crop.mountCollageSecond(root, files[0]);
            return;
          }
          if (files.length >= 2) {
            await thumb.crop.mountCollageFiles(root, files[0], files[1]);
            return;
          }
          if (files[0]) await thumb.crop.mountFile(root, files[0]);
        };
      },
      dragover(root) {
        return (event) => {
          if (!event.dataTransfer?.types?.includes?.("Files")) return;
          event.preventDefault();
          thumb.setFileDragging(root, true);
        };
      },
      dragleave(root) {
        return () => {
          thumb.setFileDragging(root, false);
        };
      },
      drop(root) {
        return async (event) => {
          const files = Array.from(event.dataTransfer?.files || []).filter((file) => file?.type?.startsWith?.("image/"));
          if (!files.length) return;
          event.preventDefault();
          thumb.setFileDragging(root, false);
          if (files.length >= 2) {
            await thumb.crop.mountCollageFiles(root, files[0], files[1]);
          } else if (root.__thumbCropSession?.image) {
            await thumb.crop.mountCollageSecond(root, files[0]);
          } else {
            await thumb.mountDroppedFile(root, files[0]);
          }
        };
      },
      paste(root) {
        return (event) => {
          if (!event.target?.matches?.("[data-thumb-input]")) return;
          const value = event.clipboardData?.getData?.("text/plain") || "";
          if (value && !thumb.acceptedInput(value)) {
            event.preventDefault();
            return;
          }
          window.setTimeout(async () => {
            await thumb.pasteValue(root, event.target?.value || "");
          }, 0);
        };
      },
      click(root, items = []) {
        return async (event) => {
          const action =
            event.target?.closest?.("[data-action]")?.dataset?.action || "";
          if (action === "thumb.close" || action === "close") {
            thumb.close(root);
            return;
          }
          if (action === "thumb.theme") {
            thumb.toggleTheme(root);
            return;
          }
          if (action === "file") {
            thumb.chooseFile(root);
            return;
          }
          if (action === "collage") {
            root.__thumbPickMode = "collage";
            thumb.chooseFile(root);
            return;
          }
          if (action === "library") {
            await thumb.showLibrary(root);
            return;
          }
          if (action === "find") {
            await thumb.search(root);
            return;
          }
          if (action === "crop") {
            await thumb.cropCurrent(root);
            return;
          }
          if (action.startsWith("crop.")) {
            await thumb.cropAction(root, action);
            return;
          }
          const button = event.target?.closest?.("[data-index]");
          if (!button || !root.contains(button)) return;
          const item = items[Number(button.dataset.index)];
          await thumb.applyItem(root, item);
        };
      },
    },
    bind(root, items = []) {
      root.addEventListener("change", thumb.handlers.change(root));
      root.addEventListener("dragover", thumb.handlers.dragover(root));
      root.addEventListener("dragleave", thumb.handlers.dragleave(root));
      root.addEventListener("drop", thumb.handlers.drop(root));
      root.addEventListener("paste", thumb.handlers.paste(root));
      root.addEventListener("click", thumb.handlers.click(root, items));
    },
    show({ value = "", items = [], status = "", busy = false, crop = true } = {}) {
      const root = thumb.view.root({ value, items, status, busy });
      thumb.bind(root, items);
      if (crop && !items.length && !busy) {
        thumb.crop.ensure(root);
      }
      thumb.input(root)?.focus?.();
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
    notice: {
      missingButton() {
        alert(
          thumb.copy.notice.missingButton,
        );
        return [];
      },
      libraryClosed() {
        alert(
          thumb.copy.notice.libraryClosed,
        );
        return [];
      },
      invalidValue() {
        alert(
          thumb.copy.notice.invalidValue,
        );
        return false;
      },
      applyFailed() {
        alert(
          thumb.copy.notice.applyFailed,
        );
        return false;
      },
      notFound(key = "") {
        alert(thumb.copy.notice.notFound(key));
        return false;
      },
    },
    async cropAction(root, action = "") {
      const session = root?.__thumbCropSession;
      if (action === "crop.fit" && session) {
        thumb.crop.reset(session);
        thumb.crop.render(root);
        return true;
      }
      if (action.startsWith("crop.remove.")) {
        if (!session || session.mode !== "collage") return false;
        const side = Number(action.replace("crop.remove.", ""));
        const removeIndex = thumb.crop.collageImageIndex(session, side);
        const keepIndex = removeIndex === 0 ? 1 : 0;
        const imageValue = session.images?.[keepIndex];
        if (!imageValue) return false;
        root.__thumbCropSession = thumb.crop.session({
          image: imageValue,
          url: session.urls?.[keepIndex] || "",
          filename: session.filename || "thumb.jpg",
          source: "collage",
        }, root);
        root.__thumbCropSession.preset = session.preset;
        thumb.crop.render(root);
        return true;
      }
      if (action === "crop.divider.width" && session?.mode === "collage") {
        thumb.crop.cycleDividerWidth(session);
        thumb.crop.render(root);
        return true;
      }
      if (action === "crop.divider.swap" && session?.mode === "collage") {
        thumb.crop.swapCollage(session);
        thumb.crop.render(root);
        return true;
      }
      if (action === "crop.apply") {
        if (session && !thumb.crop.coverageValid(session, thumb.crop.size(session.preset, session.image))) {
          thumb.crop.status(root, thumb.copy.crop.invalidFrame);
          thumb.crop.render(root);
          return false;
        }
        if (!thumb.confirmReplace()) return false;
        const item = await thumb.crop.upload(root);
        if (!item || !(await thumb.apply(item, { confirmReplace: false }))) {
          thumb.crop.status(root, thumb.copy.crop.applyFailed);
          return false;
        }
        thumb.crop.applyGlyph(root);
        window.setTimeout(() => {
          frame.close();
          root.remove();
        }, 700);
        return true;
      }
      if (action === "crop.size") {
        const preset = thumb.crop.view.nextPreset(root);
        root.__thumbCropPresetKey = preset.key;
        thumb.crop.view.syncPreset(root);
        if (!session) return true;
        session.preset = preset;
        if (session.mode === "collage") {
          const size = thumb.crop.size(session.preset, session.image);
          session.transforms.forEach((transform, imageIndex) => {
            const side = (session.sideOrder || [0, 1]).indexOf(imageIndex);
            transform.scale = Math.max(transform.scale, thumb.crop.coverScale(session.images[imageIndex], thumb.crop.frame(size, side < 0 ? 0 : side, session)));
          });
        } else {
          session.transform.scale = Math.max(
            session.transform.scale,
            thumb.crop.coverScale(session.image, thumb.crop.size(session.preset, session.image)),
          );
        }
        thumb.crop.render(root);
        return true;
      }
      const key = action.replace(/^crop\./, "");
      if (!thumb.crop.relevantPresets().some((item) => item.key === key)) return false;
      root.__thumbCropPresetKey = key;
      thumb.crop.view.syncPreset(root);
      if (!session) return true;
      session.preset = thumb.crop.preset(key);
      session.transform.scale = Math.max(
        session.transform.scale,
        thumb.crop.coverScale(session.image, thumb.crop.size(session.preset, session.image)),
      );
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
      const source = String(html || "").trim();
      const documentValue = new DOMParser().parseFromString(source, "text/html");
      return (
        documentValue.querySelector(".media-item[id]")?.id?.match(/(\d+)/)?.[1] ||
        source.match(/media-item-(\d+)/)?.[1] ||
        source.match(/^\d+$/)?.[0] ||
        ""
      );
    },
    async uploadedCandidate(id = "", search = "", { attempts = 8, delay = 300 } = {}) {
      for (let index = 0; index < attempts; index += 1) {
        const candidates = await thumb.library.fetched(search);
        const found = candidates.find((item) => String(item.id || "") === String(id || "")) || candidates[0];
        if (found?.id && found?.nonce) return found;
        await new Promise((resolve) => window.setTimeout(resolve, delay));
      }
      return null;
    },
    async uploadBlob(blob, filename = "thumb.jpg", titleValue = "") {
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
      const title = titleValue || filename.replace(/\.[^.]+$/, "");
      body.set("name", filename);
      body.set("post_title", title);
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
        const search = filename.replace(/\.[^.]+$/, "");
        return { id, search, title: search, pending: true };
      } catch {
        return null;
      }
    },
    hasThumbnail() {
      const block = document.querySelector("#postimagediv");
      if (!block) return false;
      return Boolean(
        block.querySelector("#remove-post-thumbnail") ||
          block.querySelector("#set-post-thumbnail img") ||
          block.querySelector("img.attachment-post-thumbnail"),
      );
    },
    confirmReplace() {
      if (!thumb.hasThumbnail()) return true;
      return window.confirm("Миниатюра уже есть. Заменить?");
    },
    applyResult(done = false, id = "") {
      if (!done) return false;
      thumb.setForceAppliedId(id);
      return true;
    },
    applyDirect(item) {
      const id = String(item?.id || "").trim();
      const nonce = String(item?.nonce || "").trim();
      if (!nonce || typeof window.WPSetAsThumbnail !== "function") {
        return false;
      }
      window.WPSetAsThumbnail(id, nonce);
      return true;
    },
    applyLink(item) {
      if (!item?.link?.ownerDocument?.defaultView || !item.link.click) {
        return false;
      }
      item.link.click();
      return true;
    },
    ensureThumbnailInput(id = "") {
      const value = String(id || "").trim();
      if (!value) return false;
      let input = document.querySelector("#_thumbnail_id");
      if (!input) {
        input = document.createElement("input");
        input.type = "hidden";
        input.id = "_thumbnail_id";
        input.name = "_thumbnail_id";
        const form = document.querySelector("#post") || document.querySelector("form#post");
        const block = document.querySelector("#postimagediv .inside");
        (form || block || document.body).appendChild(input);
      }
      input.value = value;
      return true;
    },
    pendingThumbnailHtml(item) {
      const id = thumb.escape(String(item?.id || "").trim());
      const title = thumb.escape(String(item?.title || item?.search || "").trim());
      const label = title || `attachment-${id}`;
      return `
        <p class="hide-if-no-js"><strong>${label}</strong></p>
        <p class="hide-if-no-js">Миниатюра будет применена после сохранения записи.</p>
        <p class="hide-if-no-js"><a href="#" id="remove-post-thumbnail" data-thumb-pending-remove="true">Убрать миниатюру</a></p>
      `;
    },
    bindPendingRemove(container) {
      const remove = container?.querySelector?.("[data-thumb-pending-remove]");
      if (!remove || remove.dataset.thumbBound === "true") return;
      remove.dataset.thumbBound = "true";
      remove.addEventListener("click", (event) => {
        event.preventDefault();
        const input = document.querySelector("#_thumbnail_id");
        if (input) input.value = "-1";
        const block = document.querySelector("#postimagediv .inside");
        if (block) {
          block.innerHTML = '<p class="hide-if-no-js"><a title="Задать миниатюру" href="' + thumb.escape(thumb.url("library") || "#") + '" id="set-post-thumbnail" class="thickbox">Задать миниатюру</a></p>';
        }
      });
    },
    applyPending(item) {
      const id = String(item?.id || "").trim();
      const container = document.querySelector("#postimagediv .inside");
      if (!id || !container || !thumb.ensureThumbnailInput(id)) return false;
      container.innerHTML = thumb.pendingThumbnailHtml(item);
      thumb.bindPendingRemove(container);
      return true;
    },
    async apply(item, { confirmReplace = true } = {}) {
      const id = String(item?.id || "").trim();
      if (!id) return thumb.notice.applyFailed();
      if (confirmReplace && !thumb.confirmReplace()) return false;
      if (thumb.applyResult(await thumb.applyAjaxByPostNonce(item), id)) return true;
      if (thumb.applyResult(await thumb.applyAjax(item), id)) return true;
      if (thumb.applyResult(await thumb.applyAjaxWithLibraryNonce(item), id)) return true;
      if (thumb.applyResult(thumb.applyDirect(item), id)) return true;
      if (thumb.applyResult(thumb.applyLink(item), id)) return true;
      if (thumb.applyResult(await thumb.applyInFrame(item), id)) return true;
      return thumb.notice.applyFailed();
    },
    thumbnailHtml(html = "") {
      const value = String(html || "").trim();
      if (!value || value === "0" || value === "-1") return "";
      return value;
    },
    updateThumbnail(id = "", html = "") {
      const value = thumb.thumbnailHtml(html);
      if (!value) return false;
      thumb.ensureThumbnailInput(id);
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
    async applyAjaxByPostNonce(item) {
      const id = String(item?.id || "").trim();
      const nonce = String(document.querySelector("#_wpnonce")?.value || "").trim();
      const postId = post.id();
      if (!id || !nonce || !postId) return false;
      const body = new URLSearchParams();
      body.set("action", "set-post-thumbnail");
      body.set("post_id", postId);
      body.set("thumbnail_id", id);
      body.set("_ajax_nonce", nonce);
      body.set("json", "1");
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
        const text = await response.text();
        const value = text.trim();
        if (value === "1") return true;
        if (!value) return false;
        try {
          const json = JSON.parse(value);
          if (json?.success === false) return false;
          const html =
            typeof json?.data === "string"
              ? json.data
              : json?.data?.html || json?.data?.thumbnail || "";
          if (html && thumb.updateThumbnail(id, html)) return true;
          return json?.success === true;
        } catch {
          return thumb.updateThumbnail(id, value);
        }
      } catch {
        return false;
      }
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
    async thumbnailNonceFromLibrary() {
      const documentValue = await thumb.fetchDocument();
      if (!documentValue) return "";
      const items = thumb.candidates(documentValue);
      return String(items.find((item) => item.nonce)?.nonce || "").trim();
    },
    async applyAjaxWithLibraryNonce(item) {
      const id = String(item?.id || "").trim();
      if (!id) return false;
      const nonce = await thumb.thumbnailNonceFromLibrary();
      if (!nonce) return false;
      return thumb.applyAjax({ ...item, id, nonce });
    },
    async applyInFrame(item) {
      const id = String(item?.id || "").trim();
      if (!id) return false;
      const searches = [String(item?.search || "").trim(), id].filter(Boolean);
      for (const search of searches) {
        if (!thumb.open("library", { search })) continue;
        const documentValue = await thumb.waitDocument({
          attempts: 24,
          delay: 250,
        });
        if (!documentValue) continue;
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
        if (link?.click) {
          link.click();
          return true;
        }
        frame.close();
      }
      return false;
    },
    library: {
      async fetched(search = "") {
        const documentValue = await thumb.fetchDocument({ search });
        if (!documentValue) return [];
        return thumb.candidates(documentValue, { search });
      },
      async fallback(search = "") {
        if (!thumb.open("library", { search })) return [];
        const fallbackDocument = await thumb.waitDocument({
          attempts: 24,
          delay: 250,
        });
        if (!fallbackDocument) return thumb.notice.libraryClosed();
        const candidates = await thumb.waitCandidates(fallbackDocument, {
          attempts: 24,
          delay: 250,
        });
        return candidates.map((item) => ({ ...item, search }));
      },
    },
    async loadCandidates({ search = "" } = {}) {
      if (!thumb.button()) return thumb.notice.missingButton();
      const direct = await thumb.library.fetched(search);
      if (direct.length) return direct;
      return thumb.library.fallback(search);
    },
    searchFlow: {
      matches(items = [], value = "") {
        return thumb.matches(items, value);
      },
      async exact(items = [], value = "", applyExact = false) {
        const matches = thumb.searchFlow.matches(items, value);
        if (!(applyExact && matches.length === 1)) return null;
        if (await thumb.apply(matches[0])) return true;
        thumb.show({ value, items: matches });
        return false;
      },
      present(value = "", items = [], limit = 24) {
        if (!items.length) return false;
        thumb.show({ value, items: items.slice(0, limit) });
        return true;
      },
      async source(value = "") {
        if (!thumb.sourceUrl(value)) return null;
        const root = thumb.show({ value });
        await thumb.crop.mount(root, value);
        return root;
      },
    },
    async find(value = "", { applyExact = false } = {}) {
      const key = thumb.key(value);
      if (!key.primary) {
        if (await thumb.searchFlow.source(value)) return true;
        return thumb.notice.invalidValue();
      }
      const searched = await thumb.loadCandidates({ search: key.primary });
      const searchedExact = await thumb.searchFlow.exact(
        searched,
        value,
        applyExact,
      );
      if (searchedExact !== null) return searchedExact;
      const searchedMatches = thumb.searchFlow.matches(searched, value);
      if (thumb.searchFlow.present(value, searchedMatches)) return true;
      const fallback = searched.length
        ? searched
        : await thumb.loadCandidates();
      const fallbackExact = await thumb.searchFlow.exact(
        fallback,
        value,
        applyExact,
      );
      if (fallbackExact !== null) return fallbackExact;
      const fallbackMatches = thumb.searchFlow.matches(fallback, value);
      if (thumb.searchFlow.present(value, fallbackMatches)) return true;
      const root = thumb.show({ value, items: fallback.slice(0, 24) });
      if (thumb.sourceUrl(value)) {
        await thumb.crop.mount(root, value);
        thumb.crop.status(
          root,
          thumb.copy.crop.notFound(key.primary),
        );
        return true;
      }
      return thumb.notice.notFound(key.primary);
    },
    async run() {
      thumb.watchForceApplyFrame();
      const clipboardValue = await thumb.clipboard();
      const value = thumb.acceptedInput(clipboardValue);
      const source = thumb.sourceUrl(value);
      const hash = thumb.hash(value);
      if (hash && !source) {
        thumb.show({ value, status: thumb.copy.loading, busy: true, crop: false });
        return thumb.find(value, { applyExact: true });
      }
      const root = thumb.show({ value: source ? value : "" });
      if (source) await thumb.crop.mount(root, value);
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
      const query = window.prompt(thumb.copy.search.prompt, imageSearch.defaultQuery());
      if (query === null) return false;
      const value = String(query || "").trim();
      if (!value) return false;
      const url = imageSearch.url(value);
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (opened) return true;
      field.alert(thumb.copy.search.openFailed(url));
      return false;
    },
  };
  thumb.bootstrapForceApply();

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
