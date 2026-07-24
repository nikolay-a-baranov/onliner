import { cms } from "../core/cms.js";
import { host } from "../core/surface/host.js";
import { icon } from "../core/surface/icon.js";
import { styles as css } from "../core/surface/styles.js";
import { toolbar } from "../core/surface/toolbar.js";
import { ui } from "../core/surface/ui.js";
import { ux } from "../core/surface/ux.js";

export const createMedia = () => {
  const feature = {
    textHeaderMaintenanceCommands: true,
    textPanelMaintenanceCommands: false,
    autoGalleryFormat: true,
  };
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
  const uploadEngine = {
    id: "media-thumb-upload-engine",
    element() {
      return document.getElementById(uploadEngine.id);
    },
    document() {
      const element = uploadEngine.element();
      try {
        return element?.contentDocument || element?.contentWindow?.document || null;
      } catch {
        return null;
      }
    },
    open(url = "") {
      if (!url) return null;
      const current = uploadEngine.element();
      if (current) {
        if (current.getAttribute("src") !== url) current.setAttribute("src", url);
        return current;
      }
      const element = document.createElement("iframe");
      element.id = uploadEngine.id;
      element.name = uploadEngine.id;
      element.setAttribute("src", url);
      element.setAttribute("aria-hidden", "true");
      element.tabIndex = -1;
      element.style.setProperty("display", "none", "important");
      (document.body || document.documentElement).appendChild(element);
      return element;
    },
    wait({ attempts = timing.openAttempts, delay = timing.openDelay } = {}) {
      return new Promise((resolve) => {
        let current = 0;
        const tick = () => {
          const documentValue = uploadEngine.document();
          if (documentValue?.defaultView?.wpUploaderInit?.multipart_params) {
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
    section() {
      const hostname = String(window.location.hostname || "").toLowerCase();
      const section = hostname.split(".")[0] || "post";
      return section.replace(/[^a-z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "post";
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
      const direct = item.querySelector(".urlfile")?.dataset?.linkUrl || "";
      if (direct) return direct;
      const values = [...item.querySelectorAll("input[value],textarea,a[href],img[src]")]
        .map((node) => node.value || node.getAttribute?.("href") || node.getAttribute?.("src") || "")
        .filter((value) => /\.(?:jpe?g|png|webp|gif)(?:[?#]|$)/i.test(value));
      return values.find((value) => !/-(?:150x150|300x\d+|\d+x300)\./i.test(value)) || values[0] || "";
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
      const content = distribute.content(current);
      const separator = content.body.trim() ? "\n\n" : "";
      return `${content.body}${separator}${value}${content.footer}`;
    },
    appendEnd(current = "", value = "") {
      if (!value) return current;
      const base = String(current || "").trimEnd();
      return `${base}${base ? "\n\n" : ""}${value}`;
    },
    place(current = "", value = "", options = {}) {
      if (!value) return current;
      const content = distribute.content(current);
      if (options.distribute) {
        const next = distribute.place(content.body, value);
        return `${next || editor.append(content.body, value)}${content.footer}`;
      }
      const next = distribute.run(content.body, value);
      return `${next || editor.append(content.body, value)}${content.footer}`;
    },
    html(filenames = [], format = "ask") {
      const srcs = filenames.map(image.src).filter(Boolean);
      const resolved = format === "auto"
        ? srcs.length >= customGallery.autoThreshold ? "mixed" : "images"
        : format;
      if (resolved === "images") {
        return filenames.map(image.html).filter(Boolean).join("\n\n");
      }
      if (resolved === "mixed") return customGallery.mixedHtml(srcs);
      if (
        srcs.length >= 5 &&
        window.confirm(customGallery.randomMessage(srcs.length))
      ) {
        return customGallery.mixedHtml(srcs);
      }
      return filenames.map(image.html).filter(Boolean).join("\n\n");
    },
    insert(filenames = [], { format = "ask", placement = "ask", replace = false, replaceFilenames = [], selectInserted = false } = {}) {
      const list = filenames.filter(Boolean);
      if (!list.length) return false;
      let changed = false;
      let inserted = "";
      cms.editor.runContent((current) => {
        const base = replace
          ? editor.removeMedia(current)
          : editor.removeMedia(current, replaceFilenames);
        const existing = editor.filenames(base);
        const available = list.filter((filename) => !existing.has(filename));
        const distributed = placement === "distribute"
          ? true
          : placement === "end"
            ? false
            : distribute.offer(base, available.length);
        const html = editor.html(available, format);
        inserted = html;
        const next = distributed
          ? editor.place(base, html, { distribute: true })
          : placement === "end"
            ? editor.appendEnd(base, html)
            : editor.append(base, html);
        changed = next !== current;
        return changed ? next : current;
      });
      if (changed && selectInserted && placement === "end" && inserted) {
        editor.selectInserted(inserted);
      }
      return changed;
    },
    focusEnd() {
      const target = document.querySelector("#content");
      if (!target) return false;
      const end = String(target.value || "").length;
      target.focus();
      target.setSelectionRange(end, end);
      target.scrollTop = target.scrollHeight;
      return true;
    },
    selectInserted(value = "") {
      const target = document.querySelector("#content");
      const content = String(target?.value || "");
      const fragment = String(value || "");
      const start = content.lastIndexOf(fragment);
      if (!target || !fragment || start < 0) return false;
      const end = start + fragment.length;
      window.setTimeout(() => {
        target.focus();
        target.setSelectionRange(start, end);
        target.scrollTop = target.scrollHeight;
      }, 0);
      return true;
    },
    removeMedia(value = "", filenames = null) {
      const targets = Array.isArray(filenames)
        ? new Set(filenames.filter(Boolean))
        : null;
      if (targets && !targets.size) return String(value || "");
      const filename = (src = "") =>
        source.filename(String(src || "").split(/[?#]/)[0]);
      const galleries = String(value || "").replace(
        /\[onliner-gallery\]([\s\S]*?)\[\/onliner-gallery\]/gi,
        (match, data) => {
          if (!targets) return "";
          const items = customGallery
            .galleryItems(data)
            .filter((item) => !targets.has(filename(item.src)));
          return items.length ? customGallery.galleryHtml(items) : "";
        },
      );
      const documentValue = new DOMParser().parseFromString(galleries, "text/html");
      documentValue.body.querySelectorAll("dl").forEach((node) => {
        const imageNode = node.querySelector("img[src]");
        if (!imageNode) return;
        if (!targets || targets.has(filename(imageNode.getAttribute("src")))) {
          node.remove();
        }
      });
      documentValue.body.querySelectorAll("img[src]").forEach((node) => {
        if (targets && !targets.has(filename(node.getAttribute("src")))) return;
        const parent = node.parentElement;
        node.remove();
        if (!parent || parent.tagName !== "P") return;
        if (parent.textContent.trim() || parent.children.length) return;
        parent.remove();
      });
      return documentValue.body.innerHTML
        .replace(/(?:\s*<p>\s*<\/p>\s*)+/gi, "\n\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    },
    removeInsertedMedia(filenames = []) {
      let changed = false;
      cms.editor.runContent((current) => {
        const next = editor.removeMedia(current, filenames);
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
        title: "Долив",
        classes: "media-upload-flow-marker",
        attrs: ' type="button" aria-label="Долив"',
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
        title: "Водяной",
        attrs:
          ' type="button" data-action="watermark" data-watermark-toggle aria-label="Водяной" aria-pressed="true"',
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
        title: "Загрузить",
        attrs:
          ' type="button" data-action="choose" data-media-upload-choose aria-label="Загрузить"',
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
      return ui.shell.frame({ left, main: actions, right, pack: "spread" });
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
        if (!state.cancelled) alert("Не удалось открыть загрузку");
        return false;
      }
      state.phase = "uploading";
      upload.status(null, "Загружаем в медиатеку", "uploading");
      const uploaded = await wait.uploadDone(documentValue, postId, baseline);
      if (!uploaded.length) {
        upload.status(null, "Файлы не загружены", "failed");
        if (!state.cancelled)
          alert("Файлы не загружены или загрузка не завершилась");
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
        alert("Загрузка завершилась, но новые картинки в галерее не найдены");
      return false;
    },
  };
  const customGallery = {
    autoThreshold: 10,
    shuffleItems: false,
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
    shuffle(items = []) {
      const value = items.slice();
      for (let index = value.length - 1; index > 0; index -= 1) {
        const target = Math.floor(Math.random() * (index + 1));
        [value[index], value[target]] = [value[target], value[index]];
      }
      return value;
    },
    mixedHtml(srcs = []) {
      const queue = customGallery.shuffleItems
        ? customGallery.shuffle(srcs)
        : srcs.slice();
      const blocks = [];
      let index = 0;
      const range = (min, max) =>
        Math.floor(Math.random() * (max - min + 1)) + min;
      while (queue.length) {
        const asImages = index % 2 === 0;
        const imageLimit =
          queue.length > 4 ? Math.min(3, queue.length - 4) : queue.length;
        const imageCount = Math.max(1, imageLimit);
        const galleryCount = queue.length <= 5 ? queue.length : range(3, 5);
        const count = asImages ? range(1, imageCount) : galleryCount;
        const chunk = queue.splice(0, count);
        if (!chunk.length) break;
        if (asImages || chunk.length < 3) {
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
      footerBlocks: 3,
      footerPatterns: [
        /t\.me\/newsonliner_bot/i,
        /mailto:ga@onliner\.by/i,
        /перепечатка текста и фотографий onl(?:í|i)ner/i,
      ],
      minMediaBlocks: 2,
      minTextBlocks: 6,
      minSafePoints: 2,
      minBlockChars: 80,
      fallbackBlockChars: 20,
      minBeforeFirst: 2,
      minAfterLast: 2,
    },
    content(value = "") {
      const parts = distribute.blocks(value);
      const signatureStart = Math.max(0, parts.length - 8);
      const signatureOffset = parts.slice(signatureStart).findIndex((part) =>
        distribute.config.footerPatterns.some((pattern) => pattern.test(part)),
      );
      const signatureIndex = signatureOffset >= 0 ? signatureStart + signatureOffset : -1;
      const fallbackCount = Math.max(0, Number(distribute.config.footerBlocks || 0));
      const footerIndex = signatureIndex >= 0
        ? signatureIndex
        : fallbackCount && parts.length > fallbackCount
          ? parts.length - fallbackCount
          : parts.length;
      if (footerIndex >= parts.length) return { body: String(value || ""), footer: "" };
      return {
        body: parts.slice(0, footerIndex).join("\n\n"),
        footer: `\n\n${parts.slice(footerIndex).join("\n\n")}`,
      };
    },
    blocks(value = "") {
      return String(value || "")
        .replace(/<\/p>\s*(?=<p\b)/gi, "</p>\n\n")
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
    safeBlock(value = "", minChars = distribute.config.minBlockChars) {
      const text = String(value || "").trim();
      if (text.length < minChars) return false;
      if (distribute.mediaBlock(text)) return false;
      if (distribute.blockedBlock(text)) return false;
      return true;
    },
    safePoints(parts = [], minChars = distribute.config.minBlockChars) {
      const last = parts.length - 1;
      return parts
        .map((part, index) => ({ part, index }))
        .filter(({ part, index }) => {
          if (index < distribute.config.minBeforeFirst) return false;
          if (last - index < distribute.config.minAfterLast) return false;
          if (!distribute.safeBlock(part, minChars)) return false;
          if (distribute.mediaBlock(parts[index - 1] || "")) return false;
          if (distribute.mediaBlock(parts[index + 1] || "")) return false;
          return true;
        })
        .map(({ index }) => index);
    },
    spread(points = [], count = 0, parts = []) {
      if (!points.length || count <= 0 || !parts.length) return [];
      const lengths = parts.map((part) => String(part || "")
        .replace(/<[^>]+>/g, "")
        .replace(/&(?:#\d+|#x[a-f0-9]+|[a-z]+);/gi, " ")
        .trim().length);
      const total = lengths.reduce((sum, length) => sum + length, 0);
      if (!total) return points.slice(0, Math.min(points.length, count));
      const positions = [];
      lengths.reduce((sum, length, index) => {
        positions[index] = sum + length;
        return positions[index];
      }, 0);
      const limit = Math.min(points.length, count);
      const available = [...points];
      const picked = [];
      for (let index = 0; index < limit; index += 1) {
        const target = ((index + 1) * total) / (limit + 1);
        const nearest = available.reduce((best, point, cursor) => {
          const distance = Math.abs((positions[point] || 0) - target);
          return distance < best.distance ? { cursor, distance } : best;
        }, { cursor: 0, distance: Number.POSITIVE_INFINITY });
        picked.push(available.splice(nearest.cursor, 1)[0]);
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
      const selected = distribute.spread(points, mediaBlocks.length, parts);
      if (!selected.length) return "";
      const buckets = selected.map(() => []);
      mediaBlocks.forEach((block, index) => {
        const bucket = Math.min(
          buckets.length - 1,
          Math.floor((index * buckets.length) / mediaBlocks.length),
        );
        buckets[bucket].push(block);
      });
      const placements = new Map(
        selected.map((point, index) => [point, buckets[index]]),
      );
      const next = [];
      parts.forEach((part, index) => {
        if (part) next.push(part);
        if (placements.has(index)) next.push(...placements.get(index));
      });
      return next.filter(Boolean).join("\n\n");
    },
    place(current = "", value = "") {
      const mediaBlocks = distribute.blocks(value);
      const parts = distribute.blocks(current);
      const strictPoints = distribute.safePoints(parts);
      const points = strictPoints.length
        ? strictPoints
        : distribute.safePoints(parts, distribute.config.fallbackBlockChars);
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
      return null;
    },
    async document() {
      const current = source.document();
      if (gallery.is(current) && source.ready(current)) return current;
      return insert.galleryDocument();
    },
    async gallery({ alertEmpty = true, close = true, format = "ask", placement = "end", replaceFromCount = null, replaceExisting = false, selectInserted = false, focusEndBeforeInsert = false, details = false } = {}) {
      const postId = post.id();
      const documentValue = await insert.document();
      if (!documentValue) {
        if (alertEmpty)
          alert("Картинки не найдены: не удалось открыть галерею");
        return details ? null : false;
      }
      const plan = thumb.galleryPlan(documentValue);
      const filenames = plan.contentFilenames;
      const thumbnailCount = plan.thumbnailCandidates.length;
      const chooseThumbnail = thumbnailCount > 1;
      const uploadThumbnail = thumbnailCount === 0;
      if (thumbnailCount === 1) {
        const applied = await thumb.apply(plan.thumbnailCandidates[0], { confirmReplace: false });
        if (applied) alert("Миниатюра на базе");
      } else if (chooseThumbnail) {
        alert("Выбери миниатюру из загруженных");
      } else {
        alert("Нет миниатюр, иди загрузи");
      }
      if (!filenames.length) {
        if (alertEmpty) alert("Картинки для текста не найдены");
        if (uploadThumbnail) await thumb.openThumbnailUpload();
        return details ? null : false;
      }
      const replace = Number.isFinite(replaceFromCount) && filenames.length === replaceFromCount;
      const resolvedFormat = format === "ask" && feature.autoGalleryFormat
        ? "auto"
        : format;
      if (focusEndBeforeInsert && placement === "end") editor.focusEnd();
      const done = editor.insert(filenames, {
        format: resolvedFormat,
        placement,
        replace,
        replaceFilenames: replaceExisting ? filenames : [],
        selectInserted,
      });
      if (!done) {
        if (alertEmpty) alert("Новых картинок нет");
        return details ? null : false;
      }
      if (close) frame.close();
      if (chooseThumbnail) await thumb.openThumbnailGallery();
      else if (uploadThumbnail) await thumb.openThumbnailUpload();
      return details ? { done: true, count: filenames.length } : true;
    },
    async meta({ title = "Всов" } = {}) {
      const documentValue = await insert.document();
      const count = documentValue
        ? thumb.galleryPlan(documentValue).contentFilenames.length
        : 0;
      return {
        count,
        title: `${title} · ${count}`,
      };
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
        if (await insert.gallery({ alertEmpty: false, close: true, selectInserted: true })) {
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
    file: {
      image(value) {
        if (!value) return false;
        const type = String(value.type || "").toLowerCase();
        const name = String(value.name || "").toLowerCase();
        return type.startsWith("image/") || /\.(?:heic|heif)$/.test(name);
      },
    },
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
      title: "Миниатюра",
      placeholder: "URL или hash",
      loading: "Ищем миниатюру\u2026",
      actions: {
        find: "Найти",
        crop: "Кропнуть",
        file: "Загрузить",
        library: "Библиотека",
        collage: "Коллаж",
      },
      crop: {
        presets: {
          news: "Новости",
          long: "Лонгрид",
          featured: "Выделенное",
        },
        controls: {
          fit: "Сбросить",
          apply: "Применить",
          remove: "Убрать",
          divider: "Повернуть разделитель",
          dividerWidth: "Ширина",
          swap: "Свапнуть",
          restore: "Вернуть удалённую картинку",
          forceApply: "Во 1) хуле ты мне сделаешь",
          forceApplyTitle: "А что, если таки можно??",
          forceApplied: "в тетьих 3) что ты мне сделаешь, я в другмо городе",
          forceAppliedTitle: "А говорил, что нельзя",
        },
        empty: "",
        source: "",
        pick: "Жми или тащи",
        loadFailed: "Не удалось загрузить картинку по ссылке. Попробуйте локальный файл.",
        fileFailed: "Не удалось открыть локальный файл.",
        preparing: "Готовим JPG\u2026",
        uploading: "Завоз",
        exportFailed:
          "Не удалось экспортировать картинку. Для внешней ссылки нужен CORS; загрузите файл локально.",
        applyFailed:
          "Не удалось загрузить или применить миниатюру",
        invalidFrame:
          "Берега видь",
        render(preset) {
          return `${preset.label}: ${preset.width}\u00d7${preset.height}. Drag \u2014 двигать, колесо \u2014 zoom.`;
        },
        notFound(key = "") {
          return `В медиатеке не найдено: ${key}. Можно кропнуть и загрузить.`;
        },
      },
      notice: {
        missingButton:
          "Кнопка миниатюры не найдена",
        libraryClosed:
          "Медиатека для миниатюры не открылась",
        invalidValue:
          "Не вижу hash или прямую ссылку на картинку",
        applyFailed:
          "Не удалось применить миниатюру",
        notFound(key = "") {
          return `По hash не найдено: ${key}`;
        },
      },
      search: {
        prompt: "Чо ищем??",
        openFailed(url = "") {
          return `Не удалось открыть поиск в новой вкладке.\n\n${url}`;
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
    documentReady(documentValue) {
      return Boolean(documentValue?.querySelector?.("#media-items"));
    },
    async fetchDocument(options = {}) {
      const path = thumb.url(options.tab || "library", options);
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
          const url = source.url(item) || src;
          const urls = [...new Set([url, src].filter(Boolean))];
          return {
            id,
            link,
            src,
            url,
            urls,
            title: String(title || id || thumb.copy.title).trim(),
            text: thumb.itemText(item),
            nonce,
            search,
            usable: Boolean(link && id),
          };
        })
        .filter((item) => item.usable && item.src);
    },
    attachedCandidates(documentValue) {
      const decodeUrl = (value = "") => {
        const textarea = document.createElement("textarea");
        textarea.innerHTML = String(value || "");
        return textarea.value.trim();
      };
      const usableUrl = (value = "") => {
        const url = decodeUrl(value);
        if (!url || !/\.(?:jpe?g|png|webp|gif)(?:[?#]|$)/i.test(url)) return "";
        if (/\/(?:wp-admin|wp-includes)\//i.test(url)) return "";
        return url;
      };
      return [...documentValue.querySelectorAll("#media-items .media-item")]
        .map((item) => {
          const img = item.querySelector(
            "img.thumbnail[src],img.pinkynail[src],.image-preview img[src],img[src*='content.onliner.by/news/']",
          );
          const id = String(item.id || item.querySelector("[id]")?.id || "").match(/(\d+)/)?.[1] || "";
          const title = item.querySelector(".filename .title")?.textContent || item.querySelector(".filename,.media-title")?.textContent || item.querySelector(".post_title input")?.value || id || thumb.copy.title;
          const src = usableUrl(img?.getAttribute?.("src") || "");
          const fields = [
            ...item.querySelectorAll(
              ".urlfile[data-link-url],.urlfile input,.urlfield input,input[name*='[url]'],textarea,a[href*='content.onliner.by/news/'],img[src*='content.onliner.by/news/']",
            ),
          ];
          const urls = [...new Set([
            usableUrl(source.url(item)),
            ...fields.map((node) => usableUrl(
              node.dataset?.linkUrl ||
              node.value ||
              node.getAttribute?.("href") ||
              node.getAttribute?.("src") ||
              "",
            )),
            src,
          ].filter(Boolean))];
          const url = urls.find((value) => !/-(?:150x150|300x\d+|\d+x300)\./i.test(value)) || urls[0] || src;
          const link = item.querySelector("a.wp-post-thumbnail");
          const onclick = link?.getAttribute?.("onclick") || "";
          const action = onclick.match(
            /WPSetAsThumbnail\(\s*['"]?(\d+)['"]?\s*,\s*['"]([^'"]+)['"]\s*\)/,
          );
          const nonce = action?.[2] || "";
          const dimensions = thumb.itemDimensions(item);
          const nativeThumbnail = Boolean(link);
          const overrideThumbnail = Boolean(
            thumb.forbiddenThumbnailWarning(item) &&
              /1200[\s ]*[×x][\s ]*800/.test(dimensions),
          );
          return {
            id,
            link,
            nonce,
            src: src || url,
            url,
            urls,
            title: String(title || id || thumb.copy.title).trim(),
            dimensions,
            thumbnailEligible: nativeThumbnail || overrideThumbnail,
          };
        })
        .filter((item) => item.id && item.src && item.url);
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
    dimensions(value = "") {
      const match = String(value || "").match(/(\d{2,5})[\s ]*[×x][\s ]*(\d{2,5})/i);
      if (!match) return null;
      return {
        width: Number(match[1]) || 0,
        height: Number(match[2]) || 0,
      };
    },
    thumbnailCandidate(item = null) {
      if (!item?.thumbnailEligible) return false;
      const dimensions = thumb.dimensions(item.dimensions);
      const preset = thumb.crop.modePreset(null, "thumb");
      return Boolean(
        dimensions &&
          dimensions.width === Number(preset.width) &&
          dimensions.height === Number(preset.height),
      );
    },
    galleryPlan(documentValue) {
      const items = thumb.attachedCandidates(documentValue);
      const thumbnailCandidates = items.filter(thumb.thumbnailCandidate);
      const thumbnailIds = new Set(thumbnailCandidates.map((item) => item.id));
      const seen = new Set();
      const contentFilenames = items
        .filter((item) => !thumbnailIds.has(item.id))
        .map((item) => source.filename(item.url))
        .filter((filename) => {
          if (!filename || seen.has(filename)) return false;
          seen.add(filename);
          return true;
        });
      return {
        items,
        thumbnailCandidates,
        contentFilenames,
      };
    },
    forceApplyTarget(item) {
      const warning = thumb.forbiddenThumbnailWarning(item);
      if (warning) return warning;
      const id = thumb.mediaItemId(item);
      const current = String(thumb.__forceAppliedId || thumb.currentThumbnailId() || "").trim();
      if (!id || !current || id !== current) return null;
      return item?.querySelector?.(".savesend input[type='submit'],.savesend .button,input[type='submit']");
    },
    forbiddenThumbnailItem(item) {
      if (!item || item.querySelector?.("[data-thumb-force-apply]")) return false;
      if (!thumb.mediaItemId(item)) return false;
      if (!thumb.forceApplyTarget(item)) return false;
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
        thumb.forceApplyTarget(item)?.insertAdjacentElement("afterend", row);
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
          const toggle = event.target?.closest?.(".describe-toggle-on,.describe-toggle-off,a.toggle");
          if (toggle) {
            const owner = toggle.ownerDocument || documentValue || document;
            window.setTimeout(() => thumb.enhanceForceApplyDocument(owner), 0);
            window.setTimeout(() => thumb.enhanceForceApplyDocument(owner), 250);
          }
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        const id = String(button.dataset.thumbForceApply || "").trim();
        if (!id) return;
        const status = thumb.showForceApplyStatus(button);
        const done = await thumb.applyAttachment({ id, title: id });
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
    forceApplyFrames() {
      return [...document.querySelectorAll("iframe")].filter((iframe) => {
        const id = String(iframe.id || "");
        const name = String(iframe.name || "");
        const src = String(iframe.getAttribute("src") || iframe.src || "");
        return id === "TB_iframeContent" || id === "fast_insert" || name === "fast_insert" || src.includes("media-upload.php");
      });
    },
    bindForceApplyFrame(iframe) {
      if (!iframe || iframe.__thumbForceApplyLoadBound) return false;
      iframe.__thumbForceApplyLoadBound = true;
      iframe.addEventListener("load", () => thumb.scheduleForceApplyScan(), true);
      return true;
    },
    bindForceApplyFrames() {
      thumb.forceApplyFrames().forEach((iframe) => thumb.bindForceApplyFrame(iframe));
      return true;
    },
    scanForceApplyDocuments() {
      thumb.bindForceApplyFrames();
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
      thumb.bindForceApplyFrames();
      thumb.scheduleForceApplyScan();
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
      const root = document.body || document.documentElement;
      if (root && !root.__thumbForceApplyFrameObserved) {
        root.__thumbForceApplyFrameObserved = true;
        const observer = new MutationObserver((mutations) => {
          const found = mutations.some((mutation) =>
            [...mutation.addedNodes].some((node) =>
              node?.matches?.("#TB_iframeContent,#fast_insert,iframe[src*='media-upload.php']") ||
              node?.querySelector?.("#TB_iframeContent,#fast_insert,iframe[src*='media-upload.php']"),
            ),
          );
          if (!found) return;
          thumb.bindForceApplyFrames();
          thumb.scheduleForceApplyScan();
        });
        observer.observe(root, {
          childList: true,
          subtree: true,
        });
      }
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
    async copyClipboard(value = "") {
      const text = String(value || "");
      if (!text) return false;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch {}
      }
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = Boolean(document.execCommand?.("copy"));
      textarea.remove();
      return copied;
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
      modes: ["text", "thumb", "section", "neuroslop"],
      textInsertPlacement: "distribute",
      modeLabels: {
        thumb: "Миниатюра",
        section: "Раздел",
        vertical: "Вертикаль",
        text: "Текст",
        neuroslop: "Нейрослоп",
      },
      presets: {
        news: {
          key: "news",
          mode: "thumb",
          width: 1200,
          height: 800,
          label: "Новости",
          guide: { width: 1200, height: 600 },
        },
        long: { key: "long", mode: "thumb", width: 1400, height: 700, label: "Лонгрид" },
        section: { key: "section", mode: "section", width: 800, height: 930, label: "Раздел" },
        text: { key: "text", mode: "text", label: "Текст" },
        neuroslop: { key: "neuroslop", mode: "neuroslop", label: "Нейрослоп" },
        newsVertical: { key: "news-800h", mode: "vertical", width: null, height: 800, resize: "height", label: "Вертикаль" },
        longVertical: { key: "long-820w", mode: "vertical", width: 820, height: null, resize: "width", label: "Вертикаль" },
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
      layoutKind() {
        return cms.layout?.longread?.(thumb.crop.layoutValue()) ? "long" : "news";
      },
      layoutName() {
        const element = cms.layout?.element?.();
        return String(element?.options?.[element.selectedIndex]?.text || cms.layout?.value?.(element) || "Layout").trim();
      },
      layoutType() {
        const value = thumb.crop.layoutValue();
        if (cms.layout?.longread?.(value)) return "Лонгрид";
        if (/photo|фото/i.test(value)) return "Фоторепорт";
        return "Новость";
      },
      currentMode(root = null) {
        const value = String(root?.__thumbCropMode || "text");
        return thumb.crop.modes.includes(value) ? value : "text";
      },
      modePreset(root = null, mode = thumb.crop.currentMode(root)) {
        const kind = thumb.crop.layoutKind();
        if (mode === "section") return thumb.crop.presets.section;
        if (mode === "text") return thumb.crop.presets.text;
        if (mode === "neuroslop") return thumb.crop.presets.neuroslop;
        if (mode === "vertical") {
          return kind === "long" ? thumb.crop.presets.longVertical : thumb.crop.presets.newsVertical;
        }
        return kind === "long" ? thumb.crop.presets.long : thumb.crop.presets.news;
      },
      relevantPresets(root = null) {
        return thumb.crop.modes.map((mode) => thumb.crop.modePreset(root, mode));
      },
      syncLayout(root, { reset = true } = {}) {
        if (!root) return null;
        const preset = thumb.crop.modePreset(root);
        if (root.__thumbCropPresetKey === preset.key) return preset;
        root.__thumbCropPresetKey = preset.key;
        const session = root.__thumbCropSession;
        if (!session) {
          thumb.crop.view.syncPreset(root);
          return preset;
        }
        session.preset = preset;
        if (reset) thumb.crop.reset(session);
        thumb.crop.render(root);
        thumb.crop.view.syncPreset(root);
        return preset;
      },
      bindLayout(root) {
        const element = cms.layout?.element?.();
        if (!root || !element || root.__thumbLayoutElement === element) return false;
        root.__thumbLayoutAbort?.abort?.();
        const controller = new AbortController();
        element.addEventListener("change", () => thumb.crop.syncLayout(root), {
          signal: controller.signal,
        });
        root.__thumbLayoutAbort = controller;
        root.__thumbLayoutElement = element;
        return true;
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
      preset(key = "", root = null) {
        const relevant = thumb.crop.relevantPresets(root);
        return relevant.find((item) => item.key === key) || thumb.crop.modePreset(root) || thumb.crop.presets.news;
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
        return `${thumb.crop.timestamp()}-${post.section()}-${postId}-${suffix}.jpg`;
      },
      title(size = {}, timestamp = thumb.crop.timestamp()) {
        const width = Math.max(1, Math.round(Number(size.width || 0)));
        const height = Math.max(1, Math.round(Number(size.height || 0)));
        const suffix = width && height ? `${width}x${height}` : "thumb";
        return `${post.slug()}-${suffix}-${timestamp}`;
      },
      status(root, value = "", options = {}) {
        const element = root?.querySelector?.("[data-thumb-crop-status]");
        const label = element?.querySelector?.("[data-thumb-crop-status-label]");
        const stage = root?.querySelector?.("[data-thumb-crop-stage]");
        if (!element) return false;
        const hasImage = stage?.getAttribute?.("data-has-image") === "true";
        if (label) label.textContent = value;
        element.toggleAttribute("data-thumb-status-center", Boolean(options.center));
        element.hidden = !value && hasImage;
        element.toggleAttribute("data-thumb-crop-empty", !value && !hasImage);
        element.toggleAttribute("data-dots", value === thumb.copy.crop.uploading);
        if (label) label.hidden = !value;
        return true;
      },
      paintFrame() {
        return new Promise((resolve) => {
          window.requestAnimationFrame?.(() => window.requestAnimationFrame?.(resolve) || resolve()) || window.setTimeout(resolve, 32);
        });
      },
      uploading(root, active = false) {
        const stage = root?.querySelector?.("[data-thumb-crop-stage]");
        root?.toggleAttribute?.("data-thumb-crop-uploading", active);
        stage?.toggleAttribute?.("data-uploading", active);
        return Boolean(stage);
      },
      working(root, active = false) {
        const stage = root?.querySelector?.("[data-thumb-crop-stage]");
        root?.toggleAttribute?.("data-thumb-crop-working", active);
        stage?.toggleAttribute?.("data-working", active);
        thumb.crop.syncApply(root);
        return Boolean(stage);
      },
      syncApply(root) {
        const button = root?.querySelector?.('[data-action="crop.apply"]');
        if (!button) return false;
        const mode = thumb.crop.currentMode(root);
        const inactive = mode === "text"
          ? !root.__thumbTextAction || root.hasAttribute("data-thumb-crop-working")
          : mode === "neuroslop"
            ? !root.__thumbNeuroslopAction || root.hasAttribute("data-thumb-crop-working")
            : !root.__thumbCropSession || root.hasAttribute("data-thumb-crop-working");
        button.disabled = inactive;
        button.toggleAttribute("data-thumb-apply-inactive", inactive);
        return true;
      },
      syncViewport(root, size) {
        const stage = root?.querySelector?.("[data-thumb-crop-stage]");
        const viewport = root?.querySelector?.("[data-thumb-crop-viewport]");
        const canvas = root?.querySelector?.("[data-thumb-crop-canvas]");
        const preview = root?.querySelector?.("[data-thumb-crop-preview]");
        if (!stage || !viewport || !canvas || !size?.width || !size?.height) return false;
        const ratio = size.width / size.height;
        const stageWidth = Math.max(1, stage.clientWidth || stage.getBoundingClientRect?.().width || 1);
        const stageHeight = Math.max(1, stage.clientHeight || stage.getBoundingClientRect?.().height || 1);
        const scale = Math.min(stageWidth / size.width, stageHeight / size.height);
        const width = Math.max(1, Math.round(size.width * scale));
        const height = Math.max(1, Math.round(size.height * scale));
        viewport.style.width = `${width}px`;
        viewport.style.height = `${height}px`;
        viewport.style.aspectRatio = String(ratio);
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        if (preview) {
          preview.style.width = "100%";
          preview.style.height = "100%";
        }
        return true;
      },
      bindViewport(root) {
        const stage = root?.querySelector?.("[data-thumb-crop-stage]");
        if (!stage || root.__thumbViewportObserver) return false;
        const sync = () => {
          const session = root.__thumbCropSession;
          const preset = session?.preset || thumb.crop.view.currentPreset(root);
          const size = thumb.crop.size(preset, session?.image || null);
          thumb.crop.syncViewport(root, size);
        };
        if (typeof ResizeObserver === "function") {
          const observer = new ResizeObserver(sync);
          observer.observe(stage);
          root.__thumbViewportObserver = observer;
        }
        window.requestAnimationFrame?.(sync);
        return true;
      },
      syncGuide(root, size = {}, session = null) {
        const guide = root?.querySelector?.("[data-thumb-crop-guide]");
        const preset = session?.preset || thumb.crop.view.currentPreset(root);
        const value = preset?.guide;
        if (!guide) return false;
        if (!session?.image || !value?.width || !value?.height || !size.width || !size.height) {
          root?.removeAttribute?.("data-thumb-crop-guide-active");
          guide.hidden = true;
          return true;
        }
        if (!guide.__thumbGuideReady) {
          guide.innerHTML = '<span data-thumb-crop-guide-frame="true"></span>';
          guide.__thumbGuideReady = true;
        }
        const left = ((size.width - value.width) / 2 / size.width) * 100;
        const top = ((size.height - value.height) / 2 / size.height) * 100;
        const width = (value.width / size.width) * 100;
        const height = (value.height / size.height) * 100;
        guide.style.setProperty("--thumb-guide-left", `${left}%`);
        guide.style.setProperty("--thumb-guide-top", `${top}%`);
        guide.style.setProperty("--thumb-guide-width", `${width}%`);
        guide.style.setProperty("--thumb-guide-height", `${height}%`);
        const preview = root?.querySelector?.("[data-thumb-crop-preview]");
        preview?.style?.setProperty?.("--thumb-guide-left", `${left}%`);
        preview?.style?.setProperty?.("--thumb-guide-top", `${top}%`);
        preview?.style?.setProperty?.("--thumb-guide-right", `${100 - left - width}%`);
        preview?.style?.setProperty?.("--thumb-guide-bottom", `${100 - top - height}%`);
        root?.setAttribute?.("data-thumb-crop-guide-active", "true");
        guide.hidden = false;
        return true;
      },
      textContentStats(value = "") {
        let galleryCount = 0;
        let galleryPhotos = 0;
        const sourceValue = String(value || "").replace(
          /\[onliner-gallery\]([\s\S]*?)\[\/onliner-gallery\]/gi,
          (_, data = "") => {
            const count = customGallery.galleryItems(data).length;
            if (count) {
              galleryCount += 1;
              galleryPhotos += count;
            }
            return "";
          },
        );
        const documentValue = new DOMParser().parseFromString(sourceValue, "text/html");
        const separate = documentValue.body.querySelectorAll("img").length;
        return {
          galleryCount,
          galleryPhotos,
          separate,
          total: separate + galleryPhotos,
        };
      },
      textMetaValue(root) {
        const target = customGallery.textarea();
        const stats = thumb.crop.textContentStats(target?.value || "");
        const galleryCount = Math.max(0, Number(root?.__thumbTextGalleryCount) || 0);
        return `Галерея: ${galleryCount} · Всунуто: ${stats.total} (${stats.separate} отдельно, ${stats.galleryPhotos} в ${stats.galleryCount} галереях)`;
      },
      syncTextMeta(root) {
        const element = root?.querySelector?.("[data-thumb-crop-meta]");
        if (!element || thumb.crop.currentMode(root) !== "text") return false;
        const value = thumb.crop.textMetaValue(root);
        if (element.textContent !== value) element.textContent = value;
        element.hidden = false;
        return true;
      },
      async refreshTextMeta(root) {
        if (!root || thumb.crop.currentMode(root) !== "text" || root.__thumbTextMetaRefreshing) return false;
        root.__thumbTextMetaRefreshing = true;
        try {
          const documentValue = await insert.document();
          if (documentValue) {
            root.__thumbTextGalleryCount = thumb.crop.textGalleryCount(documentValue);
          }
          return thumb.crop.syncTextMeta(root);
        } finally {
          root.__thumbTextMetaRefreshing = false;
        }
      },
      bindTextMeta(root) {
        const target = customGallery.textarea();
        if (!root || !target || root.__thumbTextMetaTarget === target) return false;
        const sync = () => {
          if (root.__thumbTextMetaFrame) return;
          root.__thumbTextMetaFrame = window.requestAnimationFrame(() => {
            root.__thumbTextMetaFrame = 0;
            thumb.crop.syncTextMeta(root);
          });
        };
        target.addEventListener("input", sync);
        target.addEventListener("change", sync);
        root.__thumbTextMetaTarget = target;
        root.__thumbTextMetaDestroy = () => {
          target.removeEventListener("input", sync);
          target.removeEventListener("change", sync);
        };
        return true;
      },
      syncMeta(root, session = null) {
        const element = root?.querySelector?.("[data-thumb-crop-meta]");
        if (!element) return false;
        if (thumb.crop.currentMode(root) === "text") {
          thumb.crop.bindTextMeta(root);
          thumb.crop.syncTextMeta(root);
          return true;
        }
        if (thumb.crop.currentMode(root) === "neuroslop") {
          const engine = thumb.crop.neuroslopEngine(root);
          element.textContent = `Движок: ${engine.label}`;
          element.hidden = false;
          return true;
        }
        if (session?.mode === "collage") {
          const values = session.images
            .filter((imageValue) => imageValue?.naturalWidth && imageValue?.naturalHeight)
            .map((imageValue) => `${imageValue.naturalWidth}×${imageValue.naturalHeight}`);
          element.textContent = values.join(" · ");
          element.hidden = !values.length;
          return true;
        }
        if (thumb.crop.currentMode(root) === "section") {
          const items = thumb.sectionGallery.items(root);
          const index = Number(root?.__thumbSectionIndex || 0);
          element.textContent = items.length ? `${index + 1} / ${items.length}` : "";
          element.hidden = !items.length;
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
      syncHeaderTool(root, button, value) {
        if (!button || !value) return false;
        const target = button.querySelector?.(".ui-icon-content") || button;
        const apply = () => {
          button.dataset.action = value.action;
          button.title = value.title;
          button.setAttribute("aria-label", value.title);
          target.innerHTML = value.html || ui.controls.glyph(value.fluent, 20, value.fallback);
        };
        if (button.dataset.action === value.action || !target.getAnimations) {
          apply();
          button.disabled = false;
          return true;
        }
        const token = Number(target.__thumbHeaderToolSwap || 0) + 1;
        const play = async (phase) => {
          target.removeAttribute("data-ui-swipe-phase");
          void target.offsetWidth;
          target.setAttribute("data-ui-swipe-phase", phase);
          const animations = target.getAnimations?.() || [];
          await Promise.all(animations.map((animation) => animation.finished.catch(() => false)));
        };
        target.__thumbHeaderToolSwap = token;
        target.getAnimations?.().forEach((animation) => animation.cancel());
        button.disabled = true;
        void (async () => {
          await play("exit");
          if (target.__thumbHeaderToolSwap !== token) return;
          apply();
          await play("enter");
          if (target.__thumbHeaderToolSwap !== token) return;
          target.removeAttribute("data-ui-swipe-phase");
          button.disabled = false;
        })();
        return true;
      },
      syncHeaderTools(root) {
        const group = root?.querySelector?.('[data-thumb-actions="gallery"]');
        const buttons = Array.from(group?.querySelectorAll?.("[data-action]") || []);
        if (buttons.length < 2) return false;
        const mode = thumb.crop.currentMode(root);
        const engine = mode === "neuroslop" ? thumb.crop.neuroslopEngine(root) : null;
        const textMaintenanceDisabled = mode === "text" && !feature.textHeaderMaintenanceCommands;
        group.hidden = textMaintenanceDisabled;
        if (textMaintenanceDisabled) return true;
        const values = mode === "text"
          ? [
            { action: "text.add.now", title: "Долить", fluent: "Image Add", fallback: "Image" },
            { action: "text.remove.now", title: "Выпилить", fluent: "Image Prohibited", fallback: "Image Off" },
          ]
          : mode === "neuroslop"
            ? [
              { action: "neuroslop.engine", title: `Движок: ${engine.label}`, fluent: "Bot", fallback: "AI" },
              { action: "neuroslop.logo", title: engine.label, html: thumb.crop.neuroslopLogo(engine) },
            ]
            : mode === "section"
            ? [
              { action: "library", title: "Галерея", fluent: "Image Multiple", fallback: "▦" },
              { action: "crop.section.remove", title: "Не выделять", fluent: "Image Off", fallback: "×" },
            ]
            : [
              { action: "library", title: "Галерея", fluent: "Image Multiple", fallback: "▦" },
              { action: "crop.single.history", title: "Очистить", fluent: "Delete", fallback: "×" },
            ];
        buttons.slice(0, 2).forEach((button, index) => {
          thumb.crop.syncHeaderTool(root, button, values[index]);
        });
        if (mode === "neuroslop") thumb.crop.syncNeuroslopEngine(root);
        return true;
      },
      syncSingleHistory(root, session = null) {
        const button = root?.querySelector?.('[data-action="crop.single.history"]');
        if (!button) return false;
        const sectionMode = thumb.crop.currentMode(root) === "section";
        const collageMode = session?.mode === "collage" || Boolean(root?.__thumbRemovedCollage);
        const canRestoreCollage = Boolean(root?.__thumbRemovedCollage);
        const canRestoreSingle = Boolean(root?.__thumbRemovedSingle) && !sectionMode && !collageMode;
        const canClear = Boolean(session) && !sectionMode;
        const canRestore = canRestoreCollage || canRestoreSingle;
        const target = button.querySelector?.(".ui-icon-content") || button;
        const title = canRestore ? "Вернуть" : collageMode ? "Очистить коллаж" : "Очистить";
        target.innerHTML = canRestore
          ? ui.controls.glyph("Group Return", 20, "↩")
          : ui.controls.glyph("Delete", 20, "×");
        button.title = title;
        button.setAttribute("aria-label", title);
        button.disabled = sectionMode || (!canRestore && !canClear);
        button.toggleAttribute("data-thumb-single-restore", canRestoreSingle);
        button.toggleAttribute("data-thumb-collage-restore", canRestoreCollage);
        button.toggleAttribute("data-thumb-single-clear", canClear && !canRestore && !collageMode);
        button.toggleAttribute("data-thumb-collage-clear", canClear && !canRestore && collageMode);
        return true;
      },
      syncCollageHistory(root, session = null) {
        return thumb.crop.syncSingleHistory(root, session);
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
      removePoint(size, session, regionIndex, button) {
        const region = thumb.crop.regions(session, size).find((value) => value.index === regionIndex);
        const polygon = region?.polygon || [];
        if (!polygon.length) return null;
        const epsilon = 0.5;
        const edges = polygon.map((point, index) => {
          const next = polygon[(index + 1) % polygon.length];
          const horizontal = Math.abs(point.y - next.y) <= epsilon;
          const vertical = Math.abs(point.x - next.x) <= epsilon;
          if (horizontal && Math.abs(point.y) <= epsilon) return { edge: "top", start: Math.min(point.x, next.x), end: Math.max(point.x, next.x) };
          if (horizontal && Math.abs(point.y - size.height) <= epsilon) return { edge: "bottom", start: Math.min(point.x, next.x), end: Math.max(point.x, next.x) };
          if (vertical && Math.abs(point.x) <= epsilon) return { edge: "left", start: Math.min(point.y, next.y), end: Math.max(point.y, next.y) };
          if (vertical && Math.abs(point.x - size.width) <= epsilon) return { edge: "right", start: Math.min(point.y, next.y), end: Math.max(point.y, next.y) };
          return null;
        }).filter(Boolean).map((value) => ({ ...value, length: value.end - value.start })).sort((a, b) => b.length - a.length);
        const boundary = edges[0];
        if (!boundary) return null;
        const buttonWidth = button?.offsetWidth || 72;
        const buttonHeight = button?.offsetHeight || 72;
        const insetX = buttonWidth / 2 + 8;
        const insetY = buttonHeight / 2 + 8;
        const middle = (boundary.start + boundary.end) / 2;
        const point = boundary.edge === "top"
          ? { x: middle, y: insetY }
          : boundary.edge === "bottom"
            ? { x: middle, y: size.height - insetY }
            : boundary.edge === "left"
              ? { x: insetX, y: middle }
              : { x: size.width - insetX, y: middle };
        return {
          x: Math.max(0, Math.min(size.width - buttonWidth, point.x - buttonWidth / 2)),
          y: Math.max(0, Math.min(size.height - buttonHeight, point.y - buttonHeight / 2)),
        };
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
          return thumb.crop.regions(session, size).every((region) => {
            const imageValue = session.images?.[region.imageIndex];
            const transform = session.transforms?.[region.imageIndex];
            if (!imageValue || !transform) return false;
            return thumb.crop.frameCovered(imageValue, transform, region.frame, region.polygon);
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
        const regions = thumb.crop.regions(session, thumb.crop.size(session.preset, session.image));
        buttons.forEach((button) => {
          const regionIndex = Number(button.dataset.thumbCropRemove || 0);
          button.toggleAttribute("data-thumb-remove-active", regionIndex < regions.length);
        });
        window.requestAnimationFrame?.(() => {
          const stageRect = stage.getBoundingClientRect();
          const canvasRect = canvas.getBoundingClientRect();
          const size = thumb.crop.size(session.preset, session.image);
          if (!stageRect.width || !canvasRect.width || !size.width || !size.height) return;
          const scaleX = canvasRect.width / size.width;
          const scaleY = canvasRect.height / size.height;
          const regions = thumb.crop.regions(session, size);
          buttons.forEach((button) => {
            const regionIndex = Number(button.dataset.thumbCropRemove || 0);
            const active = regionIndex < regions.length;
            if (!active) {
              button.style.removeProperty("--thumb-remove-left");
              button.style.removeProperty("--thumb-remove-top");
              return;
            }
            const point = thumb.crop.removePoint(size, session, regionIndex, button);
            if (!point) return;
            const left = canvasRect.left - stageRect.left + point.x * scaleX;
            const top = canvasRect.top - stageRect.top + point.y * scaleY;
            button.style.setProperty("--thumb-remove-left", `${Math.max(0, Math.round(left))}px`);
            button.style.setProperty("--thumb-remove-top", `${Math.max(0, Math.round(top))}px`);
          });
        });
        return true;
      },
      applyGlyph(root, name = "Ribbon Star") {
        const button = root?.querySelector?.('[data-action="crop.apply"]');
        if (thumb.crop.currentMode(root) === "neuroslop") {
          const target = button?.querySelector?.(".ui-icon-content") || button;
          ux.glyph.sync(
            target,
            ui.controls.glyph("Agents", 20, "Agents"),
            "Agents",
            { datasetKey: "applyGlyphKey" },
          );
          ui.controls.pulse(button, false);
          button?.removeAttribute?.("data-crop-applied");
          if (button?.dataset) delete button.dataset.cropApplied;
          return Boolean(button);
        }
        return ux.glyph.apply.button(button, name, {
          appliedAttr: "data-crop-applied",
          appliedDataset: "cropApplied",
        });
      },
      markDirty(root, session = null) {
        const current = session || root?.__thumbCropSession;
        if (!current || thumb.crop.currentMode(root) === "section") return false;
        current.dirty = true;
        thumb.crop.applyGlyph(root, "Ribbon");
        return true;
      },
      neuroslopEngineStorageKey: "launchpad.media.neuroslop.engine",
      neuroslopEngines: [
        { id: "chatgpt", label: "ChatGPT", url: "https://chatgpt.com/images/", logo: "chatgpt", domain: "chatgpt.com" },
        { id: "copilot", label: "Copilot", url: "https://copilot.microsoft.com/imagine", logo: "copilot", domain: "copilot.microsoft.com" },
        { id: "gemini", label: "Gemini", url: "https://gemini.google.com/app", logo: "gemini", domain: "gemini.google.com" },
      ],
      neuroslopLogo(engine = null) {
        const value = engine || thumb.crop.neuroslopEngines[0];
        return icon.logo(value.logo || value.domain, value.label);
      },
      neuroslopEngine(root = null) {
        const values = thumb.crop.neuroslopEngines;
        const fallback = values[0];
        const current = String(root?.__thumbNeuroslopEngine || "");
        const selected = values.find((item) => item.id === current);
        if (selected) return selected;
        let stored = "";
        try {
          stored = String(window.localStorage?.getItem?.(thumb.crop.neuroslopEngineStorageKey) || "");
        } catch {
          stored = "";
        }
        const restored = values.find((item) => item.id === stored) || fallback;
        if (root) root.__thumbNeuroslopEngine = restored.id;
        return restored;
      },
      cycleNeuroslopEngine(root) {
        if (!root) return false;
        const values = thumb.crop.neuroslopEngines;
        const current = thumb.crop.neuroslopEngine(root);
        const index = Math.max(0, values.findIndex((item) => item.id === current.id));
        const next = values[(index + 1) % values.length] || values[0];
        root.__thumbNeuroslopEngine = next.id;
        try {
          window.localStorage?.setItem?.(thumb.crop.neuroslopEngineStorageKey, next.id);
        } catch {
          void 0;
        }
        thumb.crop.syncNeuroslopEngine(root);
        thumb.crop.syncMeta(root, null);
        return true;
      },
      syncNeuroslopEngine(root) {
        const engine = thumb.crop.neuroslopEngine(root);
        const title = `Движок: ${engine.label}`;
        const button = root?.querySelector?.('[data-action="neuroslop.engine"]');
        if (button) {
          button.title = title;
          button.setAttribute("aria-label", title);
        }
        const logo = root?.querySelector?.('[data-action="neuroslop.logo"]');
        const target = logo?.querySelector?.(".ui-icon-content") || logo;
        if (logo) {
          logo.title = engine.label;
          logo.setAttribute("aria-label", engine.label);
        }
        if (target) {
          ux.glyph.sync(
            target,
            thumb.crop.neuroslopLogo(engine),
            engine.id,
            { datasetKey: "neuroslopEngineGlyphKey" },
          );
        }
        return Boolean(button || logo);
      },
      neuroslopPrompts: {
        base: [
          "Нужно создать изображение для статьи Onliner.by.",
          "Изображение должно выглядеть как настоящая фотография, а не как иллюстрация, 3D-рендер или типичный AI-арт.",
          "Избегай дешёвых фотобанковых клише, чрезмерно постановочных сцен, пластиковых лиц, неестественных поз и перегруженных визуальных эффектов.",
          "Предпочтительны выразительные, редакционно уместные решения. Коллаж лучше одиночного кадра, когда он помогает раскрыть тему.",
          "Фирменный стиль Onliner.by добавляй только по отдельному запросу.",
          "Не изображай известных людей без необходимости. Если конкретный человек не нужен, используй нейтральную реалистичную сцену или предметную композицию.",
          "Не добавляй текст, логотипы, водяные знаки и интерфейсные элементы, если это отдельно не запрошено.",
          "Композиция должна быть пригодна для редакционного использования на новостном или журнальном сайте.",
        ].join("\n"),
        thumbnail: [
          "Сделай миниатюру размером 1400×700 пикселей.",
          "Композиция должна хорошо читаться в широком формате и сохранять смысл при уменьшении.",
          "Если тема допускает, используй выразительный коллаж.",
        ].join("\n"),
        longread: [
          "Сделай обычную фотографию для лонгрида размером 1200×800 пикселей.",
          "Композиция может быть спокойнее и подробнее, чем у миниатюры, но должна оставаться выразительной и реалистичной.",
        ].join("\n"),
        collage: [
          "Сделай коллаж из двух изображений размером 1400×700 пикселей.",
          "Раздели кадры тонкой белой линией шириной ровно 6 пикселей.",
          "Линия может быть прямой или слегка наклонной, если это улучшает композицию.",
          "Обе части должны восприниматься как единое редакционное изображение.",
        ].join("\n"),
        smooth: [
          "Сделай миниатюру-коллаж размером 1400×700 пикселей.",
          "Объедини все изображения плавными переходами без грубых швов.",
          "Итог должен выглядеть как цельная реалистичная фотографическая композиция.",
        ].join("\n"),
      },
      neuroslopPrompt(action = "") {
        const key = String(action || "").replace(/^neuroslop\./, "");
        const variant = thumb.crop.neuroslopPrompts[key] || "";
        if (!variant) return "";
        return [
          thumb.crop.neuroslopPrompts.base,
          variant,
          "Тема и необходимые детали: [добавь описание статьи или сюжета]",
        ].join("\n");
      },
      syncNeuroslopAction(root) {
        const selected = String(root?.__thumbNeuroslopAction || "");
        root?.querySelectorAll?.("[data-thumb-neuroslop-actions] [data-action]")?.forEach?.((button) => {
          const active = button.getAttribute("data-action") === selected;
          const cluster = button.closest?.("[data-thumb-text-action-cluster]");
          button.setAttribute("aria-pressed", active ? "true" : "false");
          button.toggleAttribute("data-selected", active);
          cluster?.toggleAttribute?.("data-selected", active);
        });
        return Boolean(selected);
      },
      selectNeuroslopAction(root, action = "") {
        const values = ["neuroslop.thumbnail", "neuroslop.longread", "neuroslop.collage", "neuroslop.smooth"];
        const value = values.includes(action) ? action : "";
        if (!root || !value) return false;
        root.__thumbNeuroslopAction = value;
        thumb.crop.syncNeuroslopAction(root);
        thumb.crop.applyGlyph(root, root.__thumbNeuroslopApplied === value ? "Ribbon Star" : "Ribbon");
        thumb.crop.syncApply(root);
        return true;
      },
      syncTextAction(root) {
        const selected = String(root?.__thumbTextAction || "");
        root?.querySelectorAll?.("[data-thumb-text-actions] [data-action]")?.forEach?.((button) => {
          const active = button.getAttribute("data-action") === selected;
          const cluster = button.closest?.("[data-thumb-text-action-cluster]");
          button.setAttribute("aria-pressed", active ? "true" : "false");
          button.toggleAttribute("data-selected", active);
          cluster?.toggleAttribute?.("data-selected", active);
        });
        return Boolean(selected);
      },
      textGalleryCount(documentValue = null) {
        const sourceValue = documentValue || source.document();
        if (!sourceValue) return 0;
        return thumb.galleryPlan(sourceValue).contentFilenames.length;
      },
      markTextApplied(root, action = "", count = 0) {
        if (!root || !["text.images", "text.mixed"].includes(action)) return false;
        root.__thumbTextApplied = { action, count: Math.max(0, Number(count) || 0) };
        thumb.crop.applyGlyph(root, "Ribbon Star");
        return true;
      },
      clearTextApplied(root) {
        if (!root?.__thumbTextApplied) return false;
        root.__thumbTextApplied = null;
        thumb.crop.applyGlyph(root, "Ribbon");
        return true;
      },
      async syncTextApplied(root) {
        if (!root || thumb.crop.currentMode(root) !== "text" || root.__thumbTextSyncing) return false;
        root.__thumbTextSyncing = true;
        try {
          const documentValue = await insert.document();
          if (!documentValue) return false;
          const filenames = thumb.galleryPlan(documentValue).contentFilenames;
          const existing = editor.existing();
          const complete = filenames.length > 0 && filenames.every((filename) => existing.has(filename));
          thumb.crop.applyGlyph(root, complete ? "Ribbon Star" : "Ribbon");
          return complete;
        } finally {
          root.__thumbTextSyncing = false;
        }
      },
      bindTextAppliedSync(root) {
        if (!root || root.__thumbTextSyncBound) return false;
        const sync = () => {
          if (thumb.crop.currentMode(root) !== "text") return;
          void thumb.crop.refreshTextMeta(root);
          void thumb.crop.syncTextApplied(root);
        };
        window.addEventListener("focus", sync);
        root.__thumbTextSyncBound = true;
        root.__thumbTextSyncDestroy = () => window.removeEventListener("focus", sync);
        return true;
      },
      textPlacement(root) {
        const value = String(root?.__thumbTextInsertPlacement || thumb.crop.textInsertPlacement);
        return value === "end" ? "end" : "distribute";
      },
      syncTextPlacement(root) {
        const group = root?.querySelector?.("[data-thumb-text-placement]");
        const button = group?.querySelector?.('[data-action="text.placement"]');
        if (!group || !button) return false;
        const textMode = thumb.crop.currentMode(root) === "text";
        const placement = thumb.crop.textPlacement(root);
        group.hidden = !textMode;
        group.style.display = textMode ? "" : "none";
        if (!textMode) return true;
        const glyph = placement === "end" ? "Panel Bottom Contract" : "Panel Top Expand";
        const target = button.querySelector?.(".ui-icon-content") || button;
        ux.glyph.sync(
          target,
          ui.controls.glyph(glyph, 20, placement === "end" ? "⇲" : "⇱"),
          placement,
          { datasetKey: "textPlacementGlyphKey" },
        );
        button.title = placement === "end" ? "Досунуть" : "Рассувать";
        button.setAttribute("aria-label", button.title);
        button.setAttribute("aria-pressed", placement === "distribute" ? "true" : "false");
        return true;
      },
      toggleTextPlacement(root) {
        if (!root) return false;
        root.__thumbTextInsertPlacement = thumb.crop.textPlacement(root) === "distribute"
          ? "end"
          : "distribute";
        return thumb.crop.syncTextPlacement(root);
      },
      async removeTextGalleryMedia(root) {
        const documentValue = await insert.document();
        if (!documentValue) return false;
        const filenames = thumb.galleryPlan(documentValue).items
          .map((item) => source.filename(item.url))
          .filter(Boolean);
        const removed = editor.removeInsertedMedia(filenames);
        if (removed) thumb.crop.clearTextApplied(root);
        return removed;
      },
      selectTextAction(root, action = "") {
        const value = ["text.add", "text.remove", "text.images", "text.mixed"].includes(action) ? action : "";
        if (!root || !value) return false;
        root.__thumbTextAction = value;
        thumb.crop.syncTextAction(root);
        void thumb.crop.syncTextApplied(root);
        thumb.crop.syncApply(root);
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
          if (["text", "neuroslop"].includes(preset.mode)) return preset.label || thumb.crop.modeLabels[preset.mode];
          if (preset.resize === "width") return `${preset.width}w`;
          if (preset.resize === "height") return `${preset.height}h`;
          return `${preset.width}×${preset.height}`;
        },
        presetTitle(preset) {
          return `${thumb.crop.layoutType()} · ${thumb.crop.view.presetLabel(preset)}`;
        },
        currentPreset(root) {
          return thumb.crop.preset(root?.__thumbCropPresetKey || "", root);
        },
        nextMode(root) {
          const modes = thumb.crop.modes;
          const current = thumb.crop.currentMode(root);
          const index = Math.max(0, modes.indexOf(current));
          return modes[(index + 1) % modes.length] || "thumb";
        },
        nextPreset(root) {
          const mode = thumb.crop.view.nextMode(root);
          root.__thumbCropMode = mode;
          return thumb.crop.modePreset(root, mode);
        },
        syncPreset(root) {
          const button = root?.querySelector?.('[data-action="crop.size"]');
          const labelNode = root?.querySelector?.('[data-thumb-mode-label="true"]');
          if (!button || !labelNode) return false;
          const mode = thumb.crop.currentMode(root);
          root.setAttribute("data-thumb-crop-mode", mode);
          thumb.syncSectionPhoto(root);
          const preset = thumb.crop.view.currentPreset(root);
          const session = root?.__thumbCropSession;
          const label = thumb.crop.modeLabels[mode] || preset.label || thumb.crop.view.presetLabel(preset);
          if (!ui.controls.ribbonTextSet(labelNode, label)) {
            labelNode.innerHTML = ui.controls.ribbonText(label);
          }
          if (session?.mode === "collage") {
            button.title = `${thumb.copy.actions.collage} · ${thumb.crop.view.presetTitle(preset)}`;
            button.setAttribute("aria-label", button.title);
            button.setAttribute("data-collage-mode", "true");
            return true;
          }
          button.title = thumb.crop.view.presetTitle(preset);
          button.setAttribute("aria-label", button.title);
          button.removeAttribute("data-collage-mode");
          const header = root.querySelector?.('[data-ui-responsive-header="true"]');
          if (mode === "text" && !root.__thumbTextAction) root.__thumbTextAction = "text.images";
          if (mode === "neuroslop" && !root.__thumbNeuroslopAction) root.__thumbNeuroslopAction = "neuroslop.thumbnail";
          if (mode === "text") {
            thumb.crop.bindTextAppliedSync(root);
            thumb.crop.bindTextMeta(root);
            thumb.crop.applyGlyph(root, "Ribbon");
            void thumb.crop.syncTextApplied(root);
            void thumb.crop.refreshTextMeta(root);
          }
          if (mode === "neuroslop") {
            thumb.crop.neuroslopEngine(root);
            thumb.crop.syncNeuroslopEngine(root);
            thumb.crop.applyGlyph(root, root.__thumbNeuroslopApplied === root.__thumbNeuroslopAction ? "Ribbon Star" : "Ribbon");
          }
          thumb.crop.syncHeaderTools(root);
          thumb.crop.syncTextPlacement(root);
          if (!["text", "neuroslop"].includes(mode)) thumb.crop.syncSingleHistory(root, session);
          thumb.crop.syncTextAction(root);
          thumb.crop.syncNeuroslopAction(root);
          thumb.crop.syncMeta(root, ["text", "neuroslop"].includes(mode) ? null : session);
          thumb.crop.status(root, "");
          thumb.crop.syncApply(root);
          header?.__uiResponsiveHeader?.sync?.();
          return true;
        },
        syncModeWidth(root) {
          const button = root?.querySelector?.('[data-thumb-actions="mode"] [data-action="crop.size"]');
          const labelNode = root?.querySelector?.('[data-thumb-mode-label="true"]');
          if (!root || !button || !labelNode) return false;
          const style = window.getComputedStyle?.(labelNode);
          if (!style) return false;
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) return false;
          context.font = style.font || `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
          const labels = Object.values(thumb.crop.modeLabels);
          const textWidth = Math.max(...labels.map((label) => context.measureText(label).width));
          const horizontal = [style.paddingLeft, style.paddingRight]
            .map((value) => Number.parseFloat(value || "0") || 0)
            .reduce((sum, value) => sum + value, 0);
          root.style.setProperty("--thumb-mode-cluster-width", `${Math.ceil(textWidth + horizontal)}px`);
          root.querySelector?.('[data-thumb-head-row="primary"]')?.__uiResponsiveHeader?.sync?.();
          return true;
        },
        presetButton(preset) {
          const mode = preset?.mode || "thumb";
          const label = thumb.crop.modeLabels[mode] || preset?.label || thumb.crop.view.presetLabel(preset);
          const title = thumb.escape(thumb.crop.view.presetTitle(preset));
          return `<button class="button ui-button media-thumb-flow-crop-mode-hit" type="button" data-action="crop.size" title="${title}" aria-label="${title}"></button><span class="media-thumb-flow-crop-text" data-thumb-mode-label="true">${ui.controls.ribbonText(label)}</span>`;
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
        textActionButton({ action, title, label, fluent, fallback }) {
          const titleValue = thumb.escape(title);
          const glyph = ui.controls.icon(ui.controls.glyph(fluent, 20, fallback || fluent));
          const labelValue = `<span data-thumb-text-action-label="true">${thumb.escape(label)}</span>`;
          return `<button class="button button-emoji button-icon ui-button media-thumb-flow-text-action" type="button" data-action="${thumb.escape(action)}" title="${titleValue}" aria-label="${titleValue}" aria-pressed="false" data-thumb-text-action-button="true"><span data-thumb-text-action-content="true">${glyph}${labelValue}</span></button>`;
        },
        toolCluster(content = "", attrs = "") {
          return ui.controls.cluster({
            content,
            role: "thumb-crop",
            group: { attrs: ` data-thumb-crop-cluster="true"${attrs}` },
          });
        },
        html() {
          return `
            <div data-thumb-crop="true">
              <div data-thumb-crop-stage="true" data-field-resize-edge="true" title="${thumb.escape(thumb.copy.crop.pick)}">
                <div data-thumb-crop-viewport="true">
                  <canvas class="media-thumb-flow-canvas" data-thumb-crop-canvas="true" title="${thumb.escape(thumb.copy.crop.pick)}"></canvas>
                  <canvas class="media-thumb-flow-preview" data-thumb-crop-preview="true" aria-hidden="true"></canvas>
                  <div data-thumb-crop-guide="true" hidden></div>
                  <div data-thumb-crop-status="true" data-thumb-crop-empty="true"><span data-thumb-crop-status-glyph="true">${ui.controls.glyph("Arrow Download", 60, "↓")}</span><span data-thumb-crop-status-label="true" hidden></span></div>
                  <div data-thumb-crop-work="true" data-thumb-crop-wait="true">${ui.controls.waitGlyph()}</div>
                  <div data-thumb-crop-gallery="true" hidden></div>
                </div>
                <button type="button" data-action="crop.remove.0" data-thumb-crop-remove="0" title="${thumb.escape(thumb.copy.crop.controls.remove)}">${ui.controls.glyph("Image Off", 16, "×")}</button>
                <button type="button" data-action="crop.remove.1" data-thumb-crop-remove="1" title="${thumb.escape(thumb.copy.crop.controls.remove)}">${ui.controls.glyph("Image Off", 16, "×")}</button>
                <button type="button" data-action="crop.remove.2" data-thumb-crop-remove="2" title="${thumb.escape(thumb.copy.crop.controls.remove)}">${ui.controls.glyph("Image Off", 16, "×")}</button>
              </div>
              <div data-thumb-text-actions="true" data-thumb-mode-actions="true" hidden>
                ${feature.textPanelMaintenanceCommands
                  ? `${thumb.crop.view.toolCluster(
                    thumb.crop.view.textActionButton({ action: "text.add", title: "Долить", label: "Долить", fluent: "Image Add", fallback: "Image" }),
                    ' data-thumb-text-action-cluster="true" data-thumb-action-slot="left-top" data-ui-glyph-scale="true" style="--ui-glyph-scale:2.5"',
                  )}${thumb.crop.view.toolCluster(
                    thumb.crop.view.textActionButton({ action: "text.remove", title: "Удалить фотки", label: "Выпилить", fluent: "Image Prohibited", fallback: "Image Off" }),
                    ' data-thumb-text-action-cluster="true" data-thumb-action-slot="left-bottom" data-ui-glyph-scale="true" style="--ui-glyph-scale:2.5"',
                  )}`
                  : ""}
                ${thumb.crop.view.toolCluster(
                  thumb.crop.view.iconButton({ action: "text.placement", title: "Досунуть", fluent: "Panel Top Expand", fallback: "⇱" }),
                  ' data-thumb-text-placement="true" data-thumb-action-slot="left-control" data-ui-glyph-scale="true" style="--ui-glyph-scale:1"',
                )}
                ${thumb.crop.view.toolCluster(
                  thumb.crop.view.textActionButton({ action: "text.images", title: "Всунуть фотки по отдельности", label: "Отдельно", fluent: "Image", fallback: "▧" }),
                  ' data-thumb-text-action-cluster="true" data-thumb-action-slot="left-top" data-ui-glyph-scale="true" style="--ui-glyph-scale:2.5"',
                )}
                ${thumb.crop.view.toolCluster(
                  thumb.crop.view.textActionButton({ action: "text.mixed", title: "Всунуть фотки с рандомными галереями", label: "Вперемешку", fluent: "Image Multiple", fallback: "▦" }),
                  ' data-thumb-text-action-cluster="true" data-thumb-action-slot="left-bottom" data-ui-glyph-scale="true" style="--ui-glyph-scale:2.5"',
                )}
              </div>
              <div data-thumb-neuroslop-actions="true" data-thumb-mode-actions="true" hidden>
                ${thumb.crop.view.toolCluster(
                  thumb.crop.view.textActionButton({ action: "neuroslop.thumbnail", title: "Скопировать промпт для миниатюры 1400×700", label: "Миниатюра", fluent: "Image Border", fallback: "▧" }),
                  ' data-thumb-text-action-cluster="true" data-thumb-action-slot="left-top" data-ui-glyph-scale="true" style="--ui-glyph-scale:2.5"',
                )}
                ${thumb.crop.view.toolCluster(
                  thumb.crop.view.textActionButton({ action: "neuroslop.longread", title: "Скопировать промпт для лонгрида 1200×800", label: "Лонгрид", fluent: "Tab Desktop Image", fallback: "Image" }),
                  ' data-thumb-text-action-cluster="true" data-thumb-action-slot="left-bottom" data-ui-glyph-scale="true" style="--ui-glyph-scale:2.5"',
                )}
                ${thumb.crop.view.toolCluster(
                  thumb.crop.view.textActionButton({ action: "neuroslop.collage", title: "Скопировать промпт для коллажа из двух кадров", label: "Чёткий", fluent: "Image Stack", fallback: "▥" }),
                  ' data-thumb-text-action-cluster="true" data-thumb-action-slot="right-top" data-ui-glyph-scale="true" style="--ui-glyph-scale:2.5"',
                )}
                ${thumb.crop.view.toolCluster(
                  thumb.crop.view.textActionButton({ action: "neuroslop.smooth", title: "Скопировать промпт для коллажа с плавными переходами", label: "Плавный", fluent: "Image Stack", fallback: "▥" }),
                  ' data-thumb-text-action-cluster="true" data-thumb-action-slot="right-bottom" data-ui-glyph-scale="true" style="--ui-glyph-scale:2.5"',
                )}
              </div>
              <div data-thumb-collage-controls="true" hidden>
                ${thumb.crop.collageDividerWidthControlEnabled
                  ? thumb.crop.view.toolCluster(
                    thumb.crop.view.iconButton({ action: "crop.divider.width", title: thumb.copy.crop.controls.dividerWidth, fluent: "Line Thickness", fallback: "≡" }),
                    ' data-thumb-crop-collage-cluster="true" data-thumb-collage-control="width"',
                  )
                  : ""}
                ${thumb.crop.view.toolCluster(
                  thumb.crop.view.iconButton({ action: "crop.divider.swap", title: thumb.copy.crop.controls.swap, fluent: "Arrow Swap", fallback: "⇄" }),
                  ' data-thumb-crop-collage-cluster="true" data-thumb-collage-control="swap"',
                )}
              </div>
              <div data-thumb-crop-meta="true" hidden></div>
            </div>
          `;
        },
      },
      async image(url = "", { crossOrigin = true } = {}) {
        const image = new Image();
        image.decoding = "async";
        image.loading = "eager";
        if (crossOrigin) image.crossOrigin = "anonymous";
        image.src = url;
        await image.decode();
        return {
          image,
          url,
          filename: url || "thumb.jpg",
          source: crossOrigin ? "url" : "preview",
        };
      },
      async previewImage(url = "") {
        const image = new Image();
        image.decoding = "async";
        image.loading = "eager";
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
      collageDividerWidth: 6,
      collageDividerWidthControlEnabled: false,
      dividerWidths: [3, 5, 6, 7, 10, 14],
      dividerMode(session = null, dividerIndex = 0) {
        const widths = thumb.crop.dividerWidths;
        const divider = session?.dividers?.[dividerIndex] || null;
        const widthIndex = Math.max(0, Number(divider?.widthIndex ?? session?.dividerIndex ?? 0));
        const width = thumb.crop.collageDividerWidthControlEnabled
          ? widths[widthIndex % widths.length] || thumb.crop.collageDividerWidth
          : thumb.crop.collageDividerWidth;
        return {
          key: `divider-${width}`,
          angle: Number.isFinite(divider?.angle)
            ? divider.angle
            : (Number.isFinite(session?.dividerAngle) ? session.dividerAngle : Math.PI / 2),
          width,
        };
      },
      cycleDividerWidth(session = null, dividerIndex = 0) {
        if (!thumb.crop.collageDividerWidthControlEnabled || !session || session.mode !== "collage") return false;
        session.dividers ||= [{ angle: Math.PI / 2, widthIndex: 0 }];
        const divider = session.dividers[dividerIndex] || session.dividers[0];
        divider.widthIndex = (Number(divider.widthIndex || 0) + 1) % thumb.crop.dividerWidths.length;
        return true;
      },
      swapCollage(session = null) {
        if (!session || session.mode !== "collage") return false;
        const order = Array.isArray(session.regionOrder) ? session.regionOrder : session.images.map((_, index) => index);
        session.regionOrder = order.length > 2 ? [...order.slice(1), order[0]] : [order[1] ?? 1, order[0] ?? 0];
        return true;
      },
      collageImageIndex(session = null, regionIndex = 0) {
        if (!session || session.mode !== "collage") return regionIndex;
        const order = Array.isArray(session.regionOrder) ? session.regionOrder : [0, 1];
        const index = order[regionIndex] ?? regionIndex;
        return Number.isFinite(index) ? index : regionIndex;
      },
      snapAngle(angle = 0) {
        const options = [Math.PI / 2, Math.PI / 4, -Math.PI / 4];
        const threshold = Math.PI / 36;
        const match = options
          .map((value) => ({ value, distance: Math.abs(Math.atan2(Math.sin(angle - value), Math.cos(angle - value))) }))
          .sort((a, b) => a.distance - b.distance)[0];
        return match && match.distance <= threshold ? match.value : angle;
      },
      rotateDivider(session = null, size = null, point = null, dividerIndex = 0) {
        if (!session || session.mode !== "collage" || !size?.width || !size?.height || !point) return false;
        const angle = Math.atan2(point.y - size.height / 2, point.x - size.width / 2);
        if (!Number.isFinite(angle)) return false;
        session.dividers ||= [{ angle: Math.PI / 2, widthIndex: 0 }];
        const divider = session.dividers[dividerIndex] || session.dividers[0];
        divider.angle = thumb.crop.snapAngle(angle);
        return true;
      },
      regions(session = null, size = null) {
        if (!session || session.mode !== "collage" || !size?.width || !size?.height) return [];
        const count = Math.max(2, Math.min(3, session.images?.length || 2));
        const mode = thumb.crop.dividerMode(session, 0);
        return Array.from({ length: count }, (_, regionIndex) => {
          const polygon = thumb.crop.regionPolygon(size, regionIndex, count, mode);
          const xs = polygon.map((point) => point.x);
          const ys = polygon.map((point) => point.y);
          const x = xs.length ? Math.min(...xs) : 0;
          const y = ys.length ? Math.min(...ys) : 0;
          const width = xs.length ? Math.max(1, Math.max(...xs) - x) : size.width;
          const height = ys.length ? Math.max(1, Math.max(...ys) - y) : size.height;
          return {
            index: regionIndex,
            imageIndex: thumb.crop.collageImageIndex(session, regionIndex),
            polygon,
            frame: { x, y, width, height },
          };
        });
      },
      frame(size, index = null, session = null) {
        if (!size?.width || !size?.height) return { x: 0, y: 0, width: 1, height: 1 };
        if (session?.mode === "collage" && Number.isFinite(index)) {
          return thumb.crop.regions(session, size).find((region) => region.index === index)?.frame
            || { x: 0, y: 0, width: size.width, height: size.height };
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
      dividerOffsets(size, count = 2, mode = null) {
        if (count <= 2) return [0];
        const angle = Number.isFinite(mode?.angle) ? mode.angle : Math.PI / 2;
        const nx = -Math.sin(angle);
        const ny = Math.cos(angle);
        const radius = Math.abs(nx) * size.width / 2 + Math.abs(ny) * size.height / 2;
        return [-radius / 3, radius / 3];
      },
      dividerHit(size, point, mode, count = 2) {
        const threshold = Math.max(10, (mode?.width || 5) * 2);
        return thumb.crop.dividerOffsets(size, count, mode)
          .some((offset) => Math.abs(thumb.crop.dividerValue(size, point, mode) - offset) <= threshold);
      },
      clipRegion(source = [], size = null, mode = null, offset = 0, keepLess = true) {
        const value = (point) => thumb.crop.dividerValue(size, point, mode) - offset;
        const inside = (point) => keepLess ? value(point) <= 0 : value(point) >= 0;
        const intersection = (a, b) => {
          const av = value(a);
          const bv = value(b);
          const divider = av - bv;
          const t = divider ? av / divider : 0;
          return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
        };
        const out = [];
        source.forEach((point, pointIndex) => {
          const previous = source[(pointIndex + source.length - 1) % source.length];
          const pointInside = inside(point);
          const previousInside = inside(previous);
          if (pointInside) {
            if (!previousInside) out.push(intersection(previous, point));
            out.push(point);
          } else if (previousInside) out.push(intersection(previous, point));
        });
        return out;
      },
      regionPolygon(size, index, count, mode) {
        if (!size?.width || !size?.height) return [];
        const source = [
          { x: 0, y: 0 },
          { x: size.width, y: 0 },
          { x: size.width, y: size.height },
          { x: 0, y: size.height },
        ];
        const offsets = thumb.crop.dividerOffsets(size, count, mode);
        if (count <= 2) return thumb.crop.clipRegion(source, size, mode, offsets[0], index === 0);
        if (index === 0) return thumb.crop.clipRegion(source, size, mode, offsets[0], true);
        if (index === count - 1) return thumb.crop.clipRegion(source, size, mode, offsets[offsets.length - 1], false);
        return [
          (value) => thumb.crop.clipRegion(value, size, mode, offsets[0], false),
          (value) => thumb.crop.clipRegion(value, size, mode, offsets[1], true),
        ].reduce((value, step) => step(value), source);
      },
      dividerPolygon(size, index, mode) {
        return thumb.crop.regionPolygon(size, index, 2, mode);
      },
      dividerLine(size, mode, offset = 0) {
        const angle = Number.isFinite(mode?.angle) ? mode.angle : Math.PI / 2;
        const vx = Math.cos(angle);
        const vy = Math.sin(angle);
        const nx = -Math.sin(angle);
        const ny = Math.cos(angle);
        const cx = size.width / 2 + nx * offset;
        const cy = size.height / 2 + ny * offset;
        const scale = Math.hypot(size.width, size.height);
        return {
          a: { x: cx - vx * scale, y: cy - vy * scale },
          b: { x: cx + vx * scale, y: cy + vy * scale },
        };
      },
      drawDivider(context, size, mode, count = 2) {
        context.save();
        context.strokeStyle = "#ffffff";
        context.lineWidth = mode.width;
        context.lineCap = "square";
        thumb.crop.dividerOffsets(size, count, mode).forEach((offset) => {
          const line = thumb.crop.dividerLine(size, mode, offset);
          context.beginPath();
          context.moveTo(line.a.x, line.a.y);
          context.lineTo(line.b.x, line.b.y);
          context.stroke();
        });
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
        const region = thumb.crop.regions(session, size)
          .find((item) => thumb.crop.pointInPolygon(point, item.polygon));
        return region?.imageIndex ?? thumb.crop.collageImageIndex(session, 0);
      },
      clampTransform(session, size) {
        if (!session || !size?.width || !size?.height) return false;
        if (session.mode === "collage") return true;
        if (!session.image) return false;
        thumb.crop.frameTransform(session.image, session.transform, thumb.crop.frame(size, null));
        return true;
      },
      session(data = {}, root = null) {
        const preset = thumb.crop.preset(root?.__thumbCropPresetKey || "", root);
        return {
          mode: "single",
          image: data.image,
          url: data.url || "",
          filename: data.filename || "thumb.jpg",
          source: data.source || "url",
          preset,
          transform: thumb.crop.fit(data.image, preset),
          drag: null,
          dirty: false,
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
      collageSession(first = {}, second = {}, root = null, third = null) {
        const preset = thumb.crop.preset(root?.__thumbCropPresetKey || "", root);
        const values = [first, second, third].filter((value) => value?.image).slice(0, 3);
        const size = thumb.crop.size(preset, values[0]?.image);
        const session = {
          mode: "collage",
          image: values[0]?.image,
          images: values.map((value) => value.image),
          urls: values.map((value) => value.url || ""),
          filename: values.find((value) => value.filename)?.filename || "collage.jpg",
          source: "collage",
          preset,
          transforms: [],
          dividerCycle: 0,
          dividers: [{ angle: Math.PI / 2, widthIndex: 0 }],
          regionOrder: values.map((_, index) => index),
          drag: null,
          dirty: true,
        };
        session.transforms = session.images.map((imageValue, imageIndex) => {
          const regionIndex = session.regionOrder.indexOf(imageIndex);
          return thumb.crop.fitFrame(imageValue, thumb.crop.frame(size, regionIndex < 0 ? imageIndex : regionIndex, session));
        });
        return session;
      },
      reset(session, { dirty = true } = {}) {
        session.dirty = dirty;
        if (session.mode === "collage") {
          const size = thumb.crop.size(session.preset, session.image);
            session.transforms = session.images.map((imageValue, imageIndex) => {
            const side = session.regionOrder.indexOf(imageIndex);
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
        const preview = root?.querySelector?.("[data-thumb-crop-preview]");
        if (preview) {
          preview.width = size.width;
          preview.height = size.height;
        }
        thumb.crop.syncViewport(root, size);
        thumb.crop.syncGuide(root, size, session);
        thumb.crop.syncMeta(root, session);
        thumb.crop.view.syncPreset(root);
        thumb.crop.syncCollageControls(root, session);
        thumb.crop.syncCollageHistory(root, session);
        thumb.crop.syncSingleHistory(root, session);
        thumb.crop.syncRemoveButtons(root, session);
        thumb.crop.syncApply(root);
        thumb.galleryNavigator.sync(root);
        thumb.thumbnailGallery.syncApplied(root);
        const stage = root.querySelector?.("[data-thumb-crop-stage]");
        const validFrame = thumb.crop.coverageValid(session, size);
        stage?.toggleAttribute?.("data-invalid-frame", !validFrame);
        root.toggleAttribute?.("data-invalid-frame", !validFrame);
        stage?.setAttribute?.("data-has-image", "true");
        if (session.mode === "collage") {
          stage?.setAttribute?.("data-has-collage", "true");
          root.setAttribute?.("data-has-collage", "true");
          thumb.syncSourceMode(root, "collage");
        } else {
          stage?.removeAttribute?.("data-has-collage");
          root.removeAttribute?.("data-has-collage");
          thumb.syncSourceMode(root, thumb.crop.currentMode(root) === "section" ? "upload" : thumb.sourceMode(root) === "gallery" ? "gallery" : "upload");
        }
        root.toggleAttribute?.("data-has-collage-undo", Boolean(root.__thumbRemovedCollage));
        thumb.crop.syncCollageHistory(root, session);
        thumb.crop.syncRemoveButtons(root, session);
        thumb.crop.clampTransform(session, size);
        const context = canvas.getContext("2d", { alpha: false });
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        if (session.mode === "collage") {
          const mode = thumb.crop.dividerMode(session, 0);
          thumb.crop.regions(session, size).forEach((region) => {
            const imageValue = session.images[region.imageIndex];
            if (!imageValue) return;
            thumb.crop.drawPolygonFrame(
              context,
              imageValue,
              session.transforms[region.imageIndex],
              region.frame,
              region.polygon,
            );
          });
          thumb.crop.drawDivider(context, size, mode, session.images.length);
        } else {
          thumb.crop.drawFrame(context, session.image, session.transform, thumb.crop.frame(size, null));
        }
        if (preview && session.preset?.guide) {
          const previewContext = preview.getContext("2d", { alpha: false });
          previewContext.clearRect(0, 0, preview.width, preview.height);
          previewContext.drawImage(canvas, 0, 0);
          preview.hidden = false;
        } else if (preview) {
          preview.hidden = true;
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
        root.toggleAttribute?.("data-has-collage-undo", Boolean(root.__thumbRemovedCollage));
        thumb.crop.syncCollageHistory(root, null);
        thumb.crop.syncSingleHistory(root, null);
        thumb.crop.syncApply(root);
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        const preview = root?.querySelector?.("[data-thumb-crop-preview]");
        if (preview) {
          preview.width = 1;
          preview.height = 1;
          preview.getContext?.("2d")?.clearRect?.(0, 0, 1, 1);
          preview.hidden = true;
        }
        const status = root?.querySelector?.("[data-thumb-crop-status]");
        const glyph = status?.querySelector?.("[data-thumb-crop-status-glyph]");
        const label = status?.querySelector?.("[data-thumb-crop-status-label]");
        if (status) {
          status.hidden = false;
          status.setAttribute("data-thumb-crop-empty", "true");
          status.removeAttribute("data-dots");
        }
        if (glyph) glyph.innerHTML = ui.controls.glyph("Arrow Download", 60, "↓");
        if (label) {
          label.textContent = "";
          label.hidden = true;
        }
        thumb.syncSourceMode(root, "upload");
        thumb.galleryNavigator.sync(root);
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
          if (!session || thumb.crop.currentMode(root) === "section") return;
          const point = thumb.crop.point(canvas, event);
          const size = thumb.crop.size(session.preset, session.image);
          if (session.mode === "collage" && thumb.crop.dividerHit(size, point, thumb.crop.dividerMode(session), session.images.length)) {
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
              stage?.toggleAttribute?.("data-divider-hover", thumb.crop.dividerHit(size, point, thumb.crop.dividerMode(session), session.images.length));
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
              thumb.crop.markDirty(root, session);
              thumb.crop.render(root);
            }
            return;
          }
          const target = session.drag.index === null ? session.transform : session.transforms[session.drag.index];
          target.x = session.drag.transform.x + point.x - session.drag.x;
          target.y = session.drag.transform.y + point.y - session.drag.y;
          thumb.crop.markDirty(root, session);
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
        canvas.addEventListener("dblclick", (event) => {
          const session = root.__thumbCropSession;
          if (!session) return;
          event.preventDefault();
          event.stopPropagation();
          const size = thumb.crop.size(session.preset, session.image);
          const point = thumb.crop.point(canvas, event);
          const index = thumb.crop.activeIndex(session, size, point);
          if (index === null) {
            thumb.crop.frameTransform(session.image, session.transform, thumb.crop.frame(size, null));
            thumb.crop.markDirty(root, session);
            thumb.crop.render(root);
            return;
          }
          const region = thumb.crop.regions(session, size).find((value) => value.imageIndex === index);
          const imageValue = session.images?.[index];
          const transform = session.transforms?.[index];
          if (!region || !imageValue || !transform) return;
          const imageWidth = imageValue.naturalWidth * transform.scale;
          const imageHeight = imageValue.naturalHeight * transform.scale;
          if (imageWidth < region.frame.width || imageHeight < region.frame.height) return;
          thumb.crop.frameTransform(imageValue, transform, region.frame);
          thumb.crop.markDirty(root, session);
          thumb.crop.render(root);
        });
        canvas.addEventListener("wheel", (event) => {
          const session = root.__thumbCropSession;
          event.preventDefault();
          event.stopPropagation();
          if (!session || thumb.crop.currentMode(root) === "section") return;
          const size = thumb.crop.size(session.preset, session.image);
          const point = thumb.crop.point(canvas, event);
          const index = thumb.crop.activeIndex(session, size, point);
          const imageValue = index === null ? session.image : session.images[index];
          const transform = index === null ? session.transform : session.transforms[index];
          const side = index === null ? null : (session.regionOrder || [0, 1]).indexOf(index);
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
          thumb.crop.markDirty(root, session);
          thumb.crop.render(root);
        }, { passive: false });
        stage?.addEventListener?.("click", (event) => {
          if (!event.target?.closest?.("[data-thumb-crop-viewport='true']")) return;
          if (event.target?.closest?.("[data-thumb-crop-gallery]")) return;
          if (root.__thumbCropSession || thumb.sourceMode(root) !== "upload") return;
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
        thumb.crop.syncLayout(root, { reset: false });
        thumb.crop.bindLayout(root);
        thumb.crop.prime(root);
        thumb.crop.bindCanvas(root);
        thumb.crop.bindViewport(root);
        thumb.syncSourceMode(root, thumb.sourceMode(root));
        return true;
      },
      async mount(root, value = "", { normalize = true } = {}) {
        if (!thumb.crop.ensure(root)) return false;
        const sourceValue = String(value || "").trim();
        const url = normalize ? thumb.sourceUrl(sourceValue) : sourceValue;
        if (!url) {
          thumb.crop.status(root, "");
          return false;
        }
        try {
          const data = await thumb.crop.image(url);
          root.__thumbCropSession = thumb.crop.session(data, root);
          root.__thumbSelectedThumbnailId = "";
          root.__thumbSelectedGalleryItem = null;
          root.__thumbThumbnailSession = root.__thumbCropSession;
          root.__thumbRemovedSingle = null;
          thumb.crop.render(root);
          return true;
        } catch {
          thumb.crop.status(root, "");
          return false;
        }
      },
      async mountFile(root, file) {
        if (!thumb.file.image(file) || !thumb.crop.ensure(root)) {
          return false;
        }
        try {
          const data = await thumb.crop.file(file);
          root.__thumbCropSession = thumb.crop.session(data, root);
          root.__thumbSelectedThumbnailId = "";
          root.__thumbSelectedGalleryItem = null;
          root.__thumbThumbnailSession = root.__thumbCropSession;
          root.__thumbRemovedSingle = null;
          thumb.crop.render(root);
          return true;
        } catch {
          thumb.crop.status(root, thumb.copy.crop.fileFailed);
          return false;
        }
      },
      async mountCollageFiles(root, ...files) {
        const values = files.flat().filter((file) => thumb.file.image(file)).slice(0, 3);
        if (values.length < 2 || !thumb.crop.ensure(root)) return false;
        try {
          const data = await Promise.all(values.map((file) => thumb.crop.file(file)));
          root.__thumbCropSession = thumb.crop.collageSession(data[0], data[1], root, data[2] || null);
          thumb.crop.render(root);
          return true;
        } catch {
          thumb.crop.status(root, thumb.copy.crop.fileFailed);
          return false;
        }
      },
      async mountCollageSecond(root, file) {
        const first = thumb.crop.dataFromSession(root?.__thumbCropSession);
        if (!first || !thumb.file.image(file) || !thumb.crop.ensure(root)) return false;
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
      async mountCollageUrl(root, value = "") {
        const session = root?.__thumbCropSession;
        const url = String(value || "").trim();
        if (!session || session.mode !== "collage" || !url || session.images.length >= 3 || !thumb.crop.ensure(root)) return false;
        try {
          const data = await thumb.crop.image(url);
          const current = session.images.map((imageValue, index) => ({
            image: imageValue,
            url: session.urls?.[index] || "",
            filename: index === 0 ? session.filename : "",
          }));
          const next = [...current, data].slice(0, 3);
          const replacement = thumb.crop.collageSession(next[0], next[1], root, next[2] || null);
          replacement.preset = session.preset;
          replacement.dividers = session.dividers.map((divider) => ({ ...divider }));
          root.__thumbCropSession = replacement;
          thumb.crop.render(root);
          return true;
        } catch {
          thumb.crop.status(root, thumb.copy.crop.loadFailed);
          return false;
        }
      },
      async mountCollageAdditional(root, files = []) {
        const session = root?.__thumbCropSession;
        const values = files.filter((file) => thumb.file.image(file)).slice(0, Math.max(0, 3 - (session?.images?.length || 0)));
        if (!session || session.mode !== "collage" || !values.length || !thumb.crop.ensure(root)) return false;
        try {
          const data = await Promise.all(values.map((file) => thumb.crop.file(file)));
          const current = session.images.map((imageValue, index) => ({
            image: imageValue,
            url: session.urls?.[index] || "",
            filename: index === 0 ? session.filename : "",
          }));
          const next = [...current, ...data].slice(0, 3);
          const replacement = thumb.crop.collageSession(next[0], next[1], root, next[2] || null);
          replacement.preset = session.preset;
          replacement.dividers = session.dividers.map((divider) => ({ ...divider }));
          root.__thumbCropSession = replacement;
          thumb.crop.render(root);
          return true;
        } catch {
          thumb.crop.status(root, thumb.copy.crop.fileFailed);
          return false;
        }
      },
      async promoteGallerySession(root) {
        const session = root?.__thumbCropSession;
        const item = root?.__thumbSelectedGalleryItem;
        if (!session || session.source !== "gallery-preview" || !item) return true;
        const values = [...new Set([
          item.url,
          ...(Array.isArray(item.urls) ? item.urls : []),
          item.src,
        ].map((value) => String(value || "").replace(/&amp;/g, "&").trim()).filter(Boolean))];
        for (const value of values) {
          try {
            const data = await thumb.crop.image(value);
            const previous = session.image;
            const transform = { ...session.transform };
            if (previous?.naturalWidth && data.image?.naturalWidth) {
              transform.scale *= previous.naturalWidth / data.image.naturalWidth;
            }
            session.image = data.image;
            session.url = data.url || value;
            session.filename = data.filename || session.filename;
            session.source = "gallery";
            session.transform = transform;
            thumb.crop.clampTransform(session, thumb.crop.size(session.preset, session.image));
            thumb.crop.render(root);
            return true;
          } catch {}
        }
        thumb.crop.status(root, "Не удалось подготовить вариант кадрирования");
        return false;
      },
      async upload(root) {
        const session = root?.__thumbCropSession;
        if (!session) return null;
        thumb.crop.status(root, "");
        thumb.crop.uploading(root, true);
        try {
          if (session.source === "gallery-preview" && session.dirty) {
            const promoted = await thumb.crop.promoteGallerySession(root);
            if (!promoted) return null;
          }
          const size = thumb.crop.size(session.preset, session.image);
          const timestamp = thumb.crop.timestamp();
          const blob = await thumb.crop.blob(root);
          const filename = thumb.crop.filename(size);
          const title = thumb.crop.title(size, timestamp);
          const uploaded = await thumb.uploadBlob(blob, filename, title);
          if (!uploaded) return null;
          const ready = uploaded.pending
            ? await (async () => {
              thumb.crop.status(root, "Загружено. Применяю миниатюру…", { busy: true });
              const nonce = await thumb.thumbnailNonceFromLibrary();
              return nonce ? { ...uploaded, nonce, pending: false } : null;
            })()
            : uploaded;
          if (!ready) return null;
          return thumb.syncUploadedAttachment(root, ready);
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
          group: {
            attrs: ' data-ui-cluster-slot="marker"',
          },
        });
        const chrome = ui.controls.chrome({
          theme: thumb.theme(),
          themeAction: "thumb.theme",
          closeAction: "thumb.close",
          group: {
            attrs: ' data-ui-cluster-slot="chrome"',
          },
        });
        return `<div class="media-thumb-flow-head" data-thumb-head="true" data-panel-drag-handle="true">${thumb.view.headActions({ marker, chrome })}</div>`;
      },
      action({ action, title, content = "", fluent = "", fallback = "", attrs = "" }) {
        return ui.controls.button({
          content,
          fluent,
          fallback,
          title,
          attrs: ` type="button" data-action="${action}"${attrs}`,
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
      headActions({ marker = "", chrome = "" } = {}) {
        const preset = thumb.crop.modePreset(document.querySelector(`#${thumb.id.root}`));
        const previous = thumb.crop.view.toolCluster(
          thumb.crop.view.iconButton({ action: "crop.gallery.prev", title: "Взад", fluent: "Chevron Left", fallback: "‹" }),
          ' data-thumb-gallery-browser-cluster="prev" data-ui-cluster-slot="nav-prev" data-ui-cluster-responsive-ignore="true" hidden',
        );
        const next = thumb.crop.view.toolCluster(
          thumb.crop.view.iconButton({ action: "crop.gallery.next", title: "Вперёд", fluent: "Chevron Right", fallback: "›" }),
          ' data-thumb-gallery-browser-cluster="next" data-ui-cluster-slot="nav-next" data-ui-cluster-responsive-ignore="true" hidden',
        );
        const gallery = ui.controls.cluster({
          content: `${thumb.view.action({ action: "library", title: "Галерея", fluent: "Image Multiple", fallback: "▦" })}${thumb.view.action({ action: "crop.single.history", title: "Очистить", fluent: "Delete", fallback: "×" })}`,
          size: "content",
          group: { attrs: ' data-thumb-actions="gallery" data-ui-cluster-slot="gallery"' },
        });
        const mode = ui.controls.cluster({
          content: thumb.crop.view.presetButton(preset),
          size: "fill",
          group: { attrs: ' data-thumb-actions="mode" data-ui-cluster-slot="mode" data-head-flex="true" style="--ui-head-flex-min:var(--thumb-mode-cluster-width)"' },
        });
        const apply = ui.controls.cluster({
          content: thumb.view.action({ action: "crop.apply", title: thumb.copy.crop.controls.apply, fluent: "Ribbon", fallback: "Ribbon", attrs: " disabled" }),
          size: "content",
          group: { attrs: ' data-thumb-actions="apply" data-ui-cluster-slot="apply"' },
        });
        const primary = ui.controls.responsiveHeader({
          marker,
          gallery,
          mode,
          apply,
          chrome,
          previous,
          next,
          attrs: ' data-thumb-head-row="primary"',
        });
        return `<div data-thumb-head-actions="true">${primary}</div>`;
      },
      actionsCluster() {
        return thumb.view.headActions();
      },
      field() {
        return "";
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
        const body = `<div data-thumb-body="true">${file}${items.length ? thumb.view.results(items) : thumb.view.status(status, { busy })}</div>`;
        return ui.shell.stack(`${thumb.view.head(value)}${body}`);
      },
      root({ value = "", items = [], status = "", busy = false } = {}) {
        thumb.style();
        const root = host.create({
          id: thumb.id.root,
          html: thumb.view.html({ value, items, status, busy }),
          draggable: {
            handle: false,
            exclude: "[data-thumb-crop-stage],[data-thumb-crop-gallery]",
          },
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
      root?.__thumbHeaderRow?.__uiResponsiveClusterRow?.destroy?.();
      root?.__thumbLayoutAbort?.abort?.();
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
    sourceMode(root) {
      const mode = root?.dataset?.thumbSourceMode || "upload";
      return ["upload", "gallery", "collage"].includes(mode) ? mode : "upload";
    },
    syncSourceMode(root, mode = "upload") {
      const next = ["gallery", "collage"].includes(mode) ? mode : "upload";
      const button = root?.querySelector?.('[data-action="library"]');
      const tray = root?.querySelector?.("[data-thumb-crop-gallery]");
      if (!root || !button || !tray) return false;
      root.dataset.thumbSourceMode = next;
      tray.hidden = next !== "gallery";
      const target = button.querySelector?.(".ui-icon-content") || button;
      const glyph = next === "collage"
        ? ["Image Stack", "▥"]
        : next === "gallery"
          ? ["Arrow Upload", "↑"]
          : ["Image Multiple", "▦"];
      target.innerHTML = ui.controls.glyph(glyph[0], 20, glyph[1]);
      button.title = next === "collage" ? thumb.copy.actions.collage : next === "gallery" ? "Загрузка" : "Галерея";
      button.setAttribute("aria-label", button.title);
      button.setAttribute("aria-pressed", next !== "upload" ? "true" : "false");
      button.toggleAttribute("data-selected", next !== "upload");
      return true;
    },
    async postGalleryCandidates(root) {
      const path = thumb.url("gallery");
      if (!path) return [];
      try {
        const response = await fetch(new URL(path, window.location.href), {
          credentials: "same-origin",
        });
        if (!response.ok) {
          if (response.status === 403) {
            thumb.crop.status(root, "🛑 VPN", { center: true });
          }
          return [];
        }
        const html = await response.text();
        const documentValue = new DOMParser().parseFromString(html, "text/html");
        return thumb.attachedCandidates(documentValue).slice(0, 100);
      } catch {
        thumb.crop.status(root, "🛑 VPN", { center: true });
        return [];
      }
    },
    async galleryCandidates(root, { refresh = false } = {}) {
      if (!root) return [];
      const cached = Array.isArray(root.__thumbAttachedGalleryItems)
        ? root.__thumbAttachedGalleryItems
        : [];
      if (cached.length && !refresh) return cached;
      const items = await thumb.postGalleryCandidates(root);
      root.__thumbAttachedGalleryItems = items;
      root.__thumbGalleryItems = items;
      root.__thumbSectionItems = items;
      if (items.length) thumb.crop.status(root, "");
      return items;
    },
    async mountGalleryItem(root, item) {
      if (!root || !item) return false;
      const values = [...new Set([
        item?.url,
        ...(Array.isArray(item?.urls) ? item.urls : []),
        item?.src,
      ].map((value) => String(value || "").replace(/&amp;/g, "&").trim()).filter(Boolean))];
      for (const value of values) {
        try {
          const data = await thumb.crop.image(value);
          root.__thumbCropSession = thumb.crop.session({ ...data, source: "gallery" }, root);
        } catch {
          try {
            const data = await thumb.crop.image(value, { crossOrigin: false });
            root.__thumbCropSession = thumb.crop.session({ ...data, source: "gallery-preview" }, root);
          } catch {
            continue;
          }
        }
        root.__thumbSelectedThumbnailId = String(item.id || "").trim();
        root.__thumbSelectedGalleryItem = item;
        root.__thumbThumbnailSession = root.__thumbCropSession;
        root.__thumbRemovedSingle = null;
        thumb.crop.render(root);
        thumb.crop.syncSingleHistory(root, root.__thumbCropSession);
        thumb.thumbnailGallery.syncApplied(root);
        return true;
      }
      return false;
    },
    async showLibrary(root) {
      const tray = root?.querySelector?.("[data-thumb-crop-gallery]");
      if (!tray) return false;
      if (thumb.sourceMode(root) === "collage") {
        thumb.syncSourceMode(root, "upload");
        return true;
      }
      if (thumb.sourceMode(root) === "gallery") {
        thumb.syncSourceMode(root, "upload");
        return true;
      }
      const current = await thumb.galleryCandidates(root);
      const mode = thumb.crop.currentMode(root);
      const visible = mode === "section"
        ? current
        : current.filter((item) => item.thumbnailEligible);
      const preset = thumb.crop.view.currentPreset(root);
      const width = Number(preset?.width || preset?.guide?.width || 1);
      const height = Number(preset?.height || preset?.guide?.height || 1);
      root.__thumbVisibleGalleryItems = visible;
      tray.style.setProperty("--thumb-gallery-ratio", `${width} / ${height}`);
      tray.innerHTML = visible.map((item, index) => [
        `<button type="button" data-thumb-gallery-index="${index}" title="${thumb.escape(item.title)}">`,
        `<img src="${thumb.escape(item.src)}" alt="">`,
        `</button>`,
      ].join("")).join("");
      thumb.crop.status(root, visible.length ? "" : "Нет изображений для этого режима");
      thumb.syncSourceMode(root, "gallery");
      return true;
    },
    search() {
      return imageSearch.run();
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
      if (!thumb.file.image(file)) return false;
      await thumb.crop.mountFile(root, file);
      return true;
    },
    handlers: {
      change(root) {
        return async (event) => {
          const input = event.target?.closest?.("[data-thumb-file]");
          if (!input || !root.contains(input)) return;
          const files = Array.from(input.files || []).filter((file) => thumb.file.image(file));
          const pickMode = root.__thumbPickMode || "";
          root.__thumbPickMode = "";
          input.value = "";
          if (pickMode === "collage" && root.__thumbCropSession?.mode === "collage") {
            await thumb.crop.mountCollageAdditional(root, files);
            return;
          }
          if (pickMode === "collage" && files[0] && root.__thumbCropSession?.image) {
            await thumb.crop.mountCollageSecond(root, files[0]);
            return;
          }
          if (files.length >= 2) {
            await thumb.crop.mountCollageFiles(root, files.slice(0, 3));
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
          const files = Array.from(event.dataTransfer?.files || []).filter((file) => thumb.file.image(file));
          if (!files.length) return;
          event.preventDefault();
          thumb.setFileDragging(root, false);
          if (root.__thumbCropSession?.mode === "collage") {
            await thumb.crop.mountCollageAdditional(root, files);
          } else if (files.length >= 2) {
            await thumb.crop.mountCollageFiles(root, files.slice(0, 3));
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
          const galleryButton = event.target?.closest?.("[data-thumb-gallery-index]");
          if (galleryButton && root.contains(galleryButton)) {
            event.preventDefault();
            event.stopPropagation();
            const index = Number(galleryButton.dataset.thumbGalleryIndex);
            const item = root.__thumbVisibleGalleryItems?.[index];
            const sectionMode = thumb.crop.currentMode(root) === "section";
            const collageMode = root.__thumbCropSession?.mode === "collage";
            const done = sectionMode
              ? await thumb.sectionGallery.selectItem(root, item, index)
              : collageMode
                ? await thumb.crop.mountCollageUrl(root, item?.url || item?.src || "")
                : await thumb.mountGalleryItem(root, item);
            if (done) {
              if (!sectionMode) thumb.thumbnailGallery.syncApplied(root);
              thumb.syncSourceMode(root, "upload");
              thumb.galleryNavigator.sync(root);
              return;
            }
            thumb.crop.status(root, "Не удалось открыть изображение");
            return;
          }
          if (action.startsWith("crop.") || action.startsWith("text.") || action.startsWith("neuroslop.")) {
            await thumb.cropAction(root, action);
            return;
          }
          const button = event.target?.closest?.("[data-index]");
          if (!button || !root.contains(button)) return;
          event.preventDefault();
          const index = Number(button.dataset.index);
          const item = root.__thumbGalleryItems?.[index] || items[index];
          const sectionMode = thumb.crop.currentMode(root) === "section";
          const collageMode = root.__thumbCropSession?.mode === "collage";
          const done = sectionMode
            ? await thumb.sectionGallery.selectItem(root, item, index)
            : collageMode
              ? await thumb.crop.mountCollageUrl(root, item?.url || item?.src || "")
              : await thumb.mountGalleryItem(root, item);
          if (done) {
            if (!sectionMode) thumb.thumbnailGallery.syncApplied(root);
            thumb.syncSourceMode(root, "upload");
            thumb.galleryNavigator.sync(root);
          }
        };
      },
    },
    bind(root, items = []) {
      const headerRow = root.querySelector?.('[data-thumb-head-row="primary"]');
      if (headerRow) {
        root.__thumbHeaderRow = headerRow;
        ui.controls.bindResponsiveHeader(headerRow);
        thumb.crop.view.syncModeWidth(root);
        document.fonts?.ready?.then?.(() => thumb.crop.view.syncModeWidth(root));
      }
      root.addEventListener("change", thumb.handlers.change(root));
      root.addEventListener("dragover", thumb.handlers.dragover(root));
      root.addEventListener("dragleave", thumb.handlers.dragleave(root));
      root.addEventListener("drop", thumb.handlers.drop(root));
      root.addEventListener("paste", thumb.handlers.paste(root));
      root.addEventListener("click", thumb.handlers.click(root, items));
    },
    show({ value = "", items = [], status = "", busy = false, crop = true } = {}) {
      const root = thumb.view.root({ value, items, status, busy });
      const galleryItems = items.map((item) => ({
        id: item?.id || "",
        src: item?.src || item?.url || "",
        url: item?.url || item?.src || "",
        title: item?.title || thumb.copy.title,
      })).filter((item) => item.src && item.url);
      root.__thumbGalleryItems = galleryItems;
      root.__thumbSectionItems = galleryItems;
      thumb.bind(root, items);
      thumb.sectionGallery.preload(root);
      if (crop && !items.length && !busy) {
        thumb.crop.ensure(root);
        thumb.thumbnailGallery.ensure(root);
      }
      requestAnimationFrame(() => toolbar.center(root, 16));
      return root;
    },
    async openThumbnailGallery() {
      const root = thumb.show({ crop: false });
      const preset = thumb.crop.modePreset(root, "thumb");
      root.__thumbCropMode = "thumb";
      root.__thumbCropPresetKey = preset.key;
      thumb.crop.ensure(root);
      thumb.crop.view.syncPreset(root);
      await thumb.showLibrary(root);
      requestAnimationFrame(() => toolbar.center(root, 16));
      return root;
    },
    openThumbnailUpload() {
      const root = thumb.show({ crop: false });
      const preset = thumb.crop.modePreset(root, "thumb");
      root.__thumbCropMode = "thumb";
      root.__thumbCropPresetKey = preset.key;
      thumb.crop.ensure(root);
      thumb.crop.view.syncPreset(root);
      thumb.syncSourceMode(root, "upload");
      requestAnimationFrame(() => toolbar.center(root, 16));
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
        root.__thumbRemovedCollage = session;
        const regionIndex = Number(action.replace("crop.remove.", ""));
        const removeIndex = thumb.crop.collageImageIndex(session, regionIndex);
        const values = session.images.map((imageValue, index) => ({
          image: imageValue,
          url: session.urls?.[index] || "",
          filename: index === 0 ? session.filename : "",
        })).filter((_, index) => index !== removeIndex);
        if (values.length >= 2) {
          const replacement = thumb.crop.collageSession(values[0], values[1], root, values[2] || null);
          replacement.preset = session.preset;
          replacement.dividers = session.dividers.map((divider) => ({ ...divider }));
          root.__thumbCropSession = replacement;
        } else {
          const value = values[0];
          if (!value?.image) return false;
          root.__thumbCropSession = thumb.crop.session({
            image: value.image,
            url: value.url,
            filename: session.filename || "thumb.jpg",
            source: "collage",
          }, root);
          root.__thumbCropSession.preset = session.preset;
        }
        thumb.crop.render(root);
        return true;
      }
      if (action === "crop.single.history") {
        if (thumb.crop.currentMode(root) === "section") return false;
        if (root.__thumbRemovedCollage) {
          root.__thumbCropSession = root.__thumbRemovedCollage;
          root.__thumbRemovedCollage = null;
          thumb.crop.render(root);
          return true;
        }
        if (session?.mode === "collage") {
          root.__thumbRemovedCollage = session;
          root.__thumbCropSession = null;
          thumb.crop.prime(root);
          thumb.crop.syncSingleHistory(root, null);
          return true;
        }
        if (root.__thumbRemovedSingle) {
          root.__thumbCropSession = root.__thumbRemovedSingle;
          root.__thumbThumbnailSession = root.__thumbCropSession;
          root.__thumbRemovedSingle = null;
          thumb.syncSourceMode(root, "upload");
          thumb.crop.render(root);
          thumb.crop.syncSingleHistory(root, root.__thumbCropSession);
          thumb.thumbnailGallery.syncApplied(root);
          return true;
        }
        if (!session) return false;
        root.__thumbRemovedSingle = session;
        root.__thumbCropSession = null;
        root.__thumbSelectedThumbnailId = "";
        root.__thumbSelectedGalleryItem = null;
        root.__thumbThumbnailSession = null;
        thumb.syncSourceMode(root, "upload");
        thumb.crop.prime(root);
        thumb.crop.syncSingleHistory(root, null);
        thumb.thumbnailGallery.syncApplied(root);
        return true;
      }
      if (action === "crop.history") {
        if (root?.__thumbRemovedCollage) {
          root.__thumbCropSession = root.__thumbRemovedCollage;
          root.__thumbRemovedCollage = null;
          thumb.crop.render(root);
          return true;
        }
        if (session?.mode !== "collage") return false;
        root.__thumbRemovedCollage = session;
        root.__thumbCropSession = null;
        thumb.crop.prime(root);
        return true;
      }
      if (action === "crop.divider.width" && thumb.crop.collageDividerWidthControlEnabled && session?.mode === "collage") {
        thumb.crop.cycleDividerWidth(session);
        thumb.crop.render(root);
        return true;
      }
      if (action === "crop.divider.swap" && session?.mode === "collage") {
        thumb.crop.swapCollage(session);
        thumb.crop.render(root);
        return true;
      }
      if (action === "crop.gallery.prev") {
        return thumb.galleryNavigator.move(root, -1);
      }
      if (action === "crop.gallery.next") {
        return thumb.galleryNavigator.move(root, 1);
      }
      if (action === "crop.section.remove") {
        if (!thumb.sectionPhoto.value()) return false;
        if (!thumb.sectionPhoto.set("")) return false;
        thumb.syncSectionPhoto(root);
        thumb.sectionGallery.syncApplied(root);
        return true;
      }
      if (action === "text.add.now") return Boolean(await upload.open());
      if (action === "text.remove.now") {
        return thumb.crop.removeTextGalleryMedia(root);
      }
      if (action === "text.placement") {
        return thumb.crop.toggleTextPlacement(root);
      }
      if (["text.add", "text.remove", "text.images", "text.mixed"].includes(action)) {
        return thumb.crop.selectTextAction(root, action);
      }
      if (action === "neuroslop.engine") {
        return thumb.crop.cycleNeuroslopEngine(root);
      }
      if (action === "neuroslop.logo") return false;
      if (action.startsWith("neuroslop.")) {
        return thumb.crop.selectNeuroslopAction(root, action);
      }
      if (action === "crop.apply") {
        const mode = thumb.crop.currentMode(root);
        if (mode === "neuroslop") {
          const selected = String(root?.__thumbNeuroslopAction || "");
          const prompt = thumb.crop.neuroslopPrompt(selected);
          if (!prompt) return false;
          const engine = thumb.crop.neuroslopEngine(root);
          const copyPromise = thumb.copyClipboard(prompt);
          const opened = window.open(engine.url, "_blank", "noopener,noreferrer");
          if (!(await copyPromise)) {
            opened?.close?.();
            return false;
          }
          root.__thumbNeuroslopApplied = selected;
          thumb.crop.applyGlyph(root, "Ribbon Star");
          return true;
        }
        if (mode === "text") {
          const selected = String(root?.__thumbTextAction || "");
          if (selected === "text.add") {
            return Boolean(await upload.open());
          }
          if (["text.images", "text.mixed"].includes(selected)) {
            const format = selected === "text.images" ? "images" : "mixed";
            const result = await insert.gallery({
              close: false,
              format,
              placement: thumb.crop.textPlacement(root),
              replaceExisting: true,
              details: true,
            });
            if (!result?.done) return false;
            thumb.crop.markTextApplied(root, selected, result.count);
            return true;
          }
          if (selected === "text.remove") {
            return thumb.crop.removeTextGalleryMedia(root);
          }
          return false;
        }
        const sectionMode = thumb.crop.currentMode(root) === "section";
        const applyButton = root?.querySelector?.('[data-action="crop.apply"]');
        if (applyButton?.hasAttribute?.("data-crop-applied")) {
          const removed = sectionMode
            ? thumb.sectionPhoto.set("")
            : thumb.removeThumbnail();
          if (!removed) return false;
          if (sectionMode) thumb.syncSectionPhoto(root);
          else root.__thumbSelectedThumbnailId = "";
          thumb.crop.applyGlyph(root, "Ribbon");
          return true;
        }
        if (!session) return false;
        if (!thumb.crop.coverageValid(session, thumb.crop.size(session.preset, session.image))) {
          thumb.crop.status(root, thumb.copy.crop.invalidFrame);
          thumb.crop.render(root);
          return false;
        }
        let applied = false;
        thumb.crop.applyGlyph(root, "Lock Closed Ribbon");
        thumb.crop.working(root, true);
        await thumb.crop.paintFrame();
        try {
          const selectedGalleryItem = !sectionMode
            && !session.dirty
            && String(session.source || "").startsWith("gallery")
            ? root.__thumbSelectedGalleryItem
            : null;
          const item = sectionMode
            ? thumb.sectionGallery.current(root)
            : selectedGalleryItem || await thumb.crop.upload(root);
          applied = Boolean(item && (sectionMode
            ? await thumb.sectionPhoto.apply(item)
            : selectedGalleryItem
              ? await thumb.applyExisting(item)
              : await thumb.apply(item, { confirmReplace: false })));
          if (!applied) {
            thumb.crop.status(root, thumb.copy.crop.applyFailed);
            return false;
          }
          thumb.syncSectionPhoto(root);
          if (!sectionMode) {
            root.__thumbSelectedThumbnailId = String(item.id || "").trim();
            root.__thumbThumbnailSession = root.__thumbCropSession;
          }
          thumb.crop.applyGlyph(root);
          return true;
        } finally {
          thumb.crop.working(root, false);
          if (!applied) {
            if (sectionMode) thumb.sectionGallery.syncApplied(root);
            else thumb.thumbnailGallery.syncApplied(root);
          }
        }
      }
      if (action === "crop.size") {
        const stage = root?.querySelector?.("[data-thumb-crop-stage='true']");
        return ui.controls.swipeSwap(stage, async () => {
          const currentSession = root?.__thumbCropSession;
          const currentMode = thumb.crop.currentMode(root);
          if (currentMode !== "section" && currentSession?.mode !== "collage") {
            root.__thumbThumbnailSession = currentSession;
          }
          const preset = thumb.crop.view.nextPreset(root);
          root.__thumbCropPresetKey = preset.key;
          thumb.crop.view.syncPreset(root);
          if (preset.mode === "section") {
            await thumb.sectionGallery.ensure(root);
            return true;
          }
          if (["text", "neuroslop"].includes(preset.mode)) {
            thumb.galleryNavigator.sync(root);
            return true;
          }
          if (currentMode === "section") {
            root.__thumbCropSession = null;
            thumb.crop.prime(root);
            if (root.__thumbThumbnailSession?.image && root.__thumbThumbnailSession?.preset?.mode !== "section") {
              root.__thumbCropSession = root.__thumbThumbnailSession;
              root.__thumbCropSession.preset = preset;
              thumb.crop.reset(root.__thumbCropSession);
              thumb.crop.render(root);
              thumb.galleryNavigator.sync(root);
              return true;
            }
            root.__thumbThumbnailSession = null;
            const restored = await thumb.thumbnailGallery.ensure(root);
            if (!restored) {
              const size = thumb.crop.size(preset);
              thumb.crop.syncViewport(root, size);
              thumb.crop.syncGuide(root, size, null);
              thumb.crop.status(root, "");
              thumb.crop.applyGlyph(root, "Ribbon");
            }
            thumb.galleryNavigator.sync(root);
            return true;
          }
          if (!currentSession) {
            thumb.crop.syncViewport(root, thumb.crop.size(preset));
            thumb.crop.syncGuide(root, thumb.crop.size(preset), null);
            await thumb.thumbnailGallery.ensure(root);
            thumb.galleryNavigator.sync(root);
            return true;
          }
          currentSession.preset = preset;
          thumb.crop.reset(currentSession);
          thumb.crop.render(root);
          thumb.galleryNavigator.sync(root);
          return true;
        });
      }
      const key = action.replace(/^crop\./, "");
      if (!thumb.crop.relevantPresets(root).some((item) => item.key === key)) return false;
      root.__thumbCropPresetKey = key;
      thumb.crop.view.syncPreset(root);
      if (!session) return true;
      session.preset = thumb.crop.preset(key, root);
      session.transform.scale = Math.max(
        session.transform.scale,
        thumb.crop.coverScale(session.image, thumb.crop.size(session.preset, session.image)),
      );
      thumb.crop.render(root);
      return true;
    },
    async uploadDocument() {
      const current = uploadEngine.document();
      if (current?.defaultView?.wpUploaderInit?.multipart_params) return current;
      const url = thumb.url("type");
      if (!uploadEngine.open(url)) return null;
      const documentValue = await uploadEngine.wait({ attempts: 24, delay: 250 });
      if (!documentValue) return null;
      upload.style(documentValue);
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
        const found = candidates.find((item) => String(item.id || "") === String(id || ""));
        if (found?.id && found?.nonce) return found;
        await new Promise((resolve) => window.setTimeout(resolve, delay));
      }
      return null;
    },
    async syncUploadedAttachment(root, item = {}, { attempts = 8, delay = 500 } = {}) {
      const id = String(item?.id || "").trim();
      if (!root || !id) return item;
      for (let index = 0; index < attempts; index += 1) {
        const items = await thumb.galleryCandidates(root, { refresh: true });
        const found = items.find((candidate) => String(candidate?.id || "") === id);
        if (found) {
          root.__thumbSelectedGalleryItem = found;
          root.__thumbSelectedThumbnailId = id;
          return { ...item, ...found, id };
        }
        await new Promise((resolve) => window.setTimeout(resolve, delay));
      }
      return item;
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
      body.delete("use_watermark");
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
    thumbnailGallery: {
      currentId() {
        return thumb.currentThumbnailId();
      },
      currentUrl() {
        return String(
          document.querySelector("#set-post-thumbnail img")?.getAttribute?.("src") ||
            document.querySelector("#postimagediv img.attachment-post-thumbnail")?.getAttribute?.("src") ||
            "",
        ).trim();
      },
      index(items = []) {
        const id = thumb.thumbnailGallery.currentId();
        if (id) {
          const byId = items.findIndex((item) => String(item?.id || "") === id);
          if (byId >= 0) return byId;
        }
        const hash = thumb.hash(thumb.thumbnailGallery.currentUrl());
        if (!hash) return -1;
        return items.findIndex((item) => thumb.hash(item?.url || item?.src || "") === hash);
      },
      syncApplied(root) {
        if (!root || thumb.crop.currentMode(root) === "section") return false;
        const selectedId = String(root.__thumbSelectedThumbnailId || "").trim();
        const appliedId = thumb.thumbnailGallery.currentId();
        const selectedItem = root.__thumbSelectedGalleryItem;
        const selectedUrls = [
          selectedItem?.url,
          selectedItem?.src,
          ...(Array.isArray(selectedItem?.urls) ? selectedItem.urls : []),
        ];
        const appliedHash = thumb.hash(thumb.thumbnailGallery.currentUrl());
        const selectedByUrl = Boolean(
          appliedHash && selectedUrls.some((value) => thumb.hash(value) === appliedHash),
        );
        const applied = Boolean(
          selectedId && ((appliedId && selectedId === appliedId) || selectedByUrl),
        );
        return thumb.crop.applyGlyph(root, applied ? "Ribbon Star" : "Ribbon");
      },
      async ensure(root) {
        if (!root || thumb.crop.currentMode(root) === "section") return false;
        if (root.__thumbThumbnailSession?.image && root.__thumbThumbnailSession?.preset?.mode !== "section") {
          root.__thumbCropSession = root.__thumbThumbnailSession;
          root.__thumbCropSession.preset = thumb.crop.modePreset(root, "thumb");
          thumb.crop.render(root);
          thumb.thumbnailGallery.syncApplied(root);
          thumb.galleryNavigator.sync(root);
          return true;
        }
        root.__thumbThumbnailSession = null;
        const items = await thumb.galleryCandidates(root);
        const index = thumb.thumbnailGallery.index(items);
        if (index < 0) return false;
        const done = await thumb.mountGalleryItem(root, items[index]);
        if (!done) return false;
        thumb.thumbnailGallery.syncApplied(root);
        thumb.galleryNavigator.sync(root);
        return true;
      },
    },
    galleryNavigator: {
      items(root) {
        const items = thumb.sectionGallery.items(root);
        if (thumb.crop.currentMode(root) === "section") return items;
        return items.filter((item) => item.thumbnailEligible);
      },
      index(root, items = thumb.galleryNavigator.items(root)) {
        if (!items.length) return -1;
        if (thumb.crop.currentMode(root) === "section") {
          const current = thumb.sectionGallery.current(root);
          const currentId = String(current?.id || "");
          const index = items.findIndex((item) => String(item?.id || "") === currentId);
          return index >= 0 ? index : 0;
        }
        const selected = String(root?.__thumbSelectedThumbnailId || "");
        if (selected) {
          const index = items.findIndex((item) => String(item?.id || "") === selected);
          if (index >= 0) return index;
        }
        return Math.max(0, thumb.thumbnailGallery.index(items));
      },
      sync(root) {
        if (!root) return false;
        const items = thumb.galleryNavigator.items(root);
        const previousCluster = root.querySelector?.('[data-thumb-gallery-browser-cluster="prev"]');
        const nextCluster = root.querySelector?.('[data-thumb-gallery-browser-cluster="next"]');
        const previous = previousCluster?.querySelector?.("button");
        const next = nextCluster?.querySelector?.("button");
        const active = items.length > 0 && thumb.sourceMode(root) !== "gallery";
        if (previousCluster) previousCluster.hidden = !active;
        if (nextCluster) nextCluster.hidden = !active;
        if (previous) previous.disabled = items.length < 2;
        if (next) next.disabled = items.length < 2;
        root.toggleAttribute("data-thumb-gallery-browsing", active);
        return true;
      },
      async select(root, index = 0) {
        const items = thumb.galleryNavigator.items(root);
        if (!items.length) {
          thumb.galleryNavigator.sync(root);
          return false;
        }
        const next = ((Number(index) % items.length) + items.length) % items.length;
        if (thumb.crop.currentMode(root) === "section") {
          const item = items[next];
          const all = thumb.sectionGallery.items(root);
          return thumb.sectionGallery.select(root, Math.max(0, all.indexOf(item)));
        }
        const done = await thumb.mountGalleryItem(root, items[next]);
        if (!done) return false;
        const session = root.__thumbCropSession;
        if (session) {
          session.preset = thumb.crop.modePreset(root);
          thumb.crop.reset(session, { dirty: false });
          thumb.crop.render(root);
        }
        thumb.galleryNavigator.sync(root);
        return true;
      },
      async move(root, offset = 0) {
        const items = thumb.galleryNavigator.items(root);
        if (!items.length) return false;
        return thumb.galleryNavigator.select(root, thumb.galleryNavigator.index(root, items) + Number(offset || 0));
      },
    },
    sectionGallery: {
      items(root) {
        return Array.isArray(root?.__thumbSectionItems) ? root.__thumbSectionItems : [];
      },
      current(root) {
        const items = thumb.sectionGallery.items(root);
        const index = Number(root?.__thumbSectionIndex || 0);
        return items[index] || null;
      },
      index(items = [], url = "") {
        const hash = thumb.hash(url);
        if (!hash) return 0;
        const index = items.findIndex((item) => thumb.hash(item.url || item.src) === hash);
        return index < 0 ? 0 : index;
      },
      syncApplied(root) {
        if (!root || thumb.crop.currentMode(root) !== "section") return false;
        const current = thumb.sectionGallery.current(root);
        const currentHash = thumb.hash(current?.url || current?.src || "");
        const appliedHash = thumb.hash(thumb.sectionPhoto.value());
        const applied = Boolean(currentHash && appliedHash && currentHash === appliedHash);
        return thumb.crop.applyGlyph(root, applied ? "Ribbon Star" : "Ribbon");
      },
      sync(root) {
        return thumb.galleryNavigator.sync(root);
      },
      async data(root, item = null) {
        if (!root || !item) return null;
        root.__thumbSectionCache ||= new Map();
        const key = String(item.id || item.url || item.src || "");
        if (root.__thumbSectionCache.has(key)) return root.__thumbSectionCache.get(key);
        const values = [...new Set([item.url, item.src].filter(Boolean))];
        for (const value of values) {
          try {
            const data = await thumb.crop.previewImage(value);
            root.__thumbSectionCache.set(key, data);
            return data;
          } catch {}
        }
        return null;
      },
      async preload(root) {
        if (!root) return false;
        if (root.__thumbSectionPreload) return root.__thumbSectionPreload;
        root.__thumbSectionPreload = (async () => {
          const items = await thumb.galleryCandidates(root);
          root.__thumbSectionItems = items;
          root.__thumbSectionIndex = thumb.sectionGallery.index(items, thumb.sectionPhoto.value());
          thumb.galleryNavigator.sync(root);
          return items.length > 0;
        })();
        const done = await root.__thumbSectionPreload;
        root.__thumbSectionPreload = null;
        return done;
      },
      async select(root, index = 0) {
        const items = thumb.sectionGallery.items(root);
        if (!items.length) {
          thumb.galleryNavigator.sync(root);
          return false;
        }
        const next = ((Number(index) % items.length) + items.length) % items.length;
        const item = items[next];
        const data = await thumb.sectionGallery.data(root, item);
        if (!data) return false;
        root.__thumbSectionIndex = next;
        root.__thumbCropSession = thumb.crop.session(data, root);
        root.__thumbCropSession.preset = thumb.crop.presets.section;
        thumb.crop.reset(root.__thumbCropSession);
        thumb.crop.render(root);
        thumb.galleryNavigator.sync(root);
        thumb.sectionGallery.syncApplied(root);
        return true;
      },
      async selectItem(root, item = null, index = 0) {
        if (!root || !item) return false;
        const items = thumb.sectionGallery.items(root);
        if (!items.length) {
          root.__thumbSectionItems = [item];
          root.__thumbGalleryItems = [item];
          return thumb.sectionGallery.select(root, 0);
        }
        const current = items.indexOf(item);
        return thumb.sectionGallery.select(root, current >= 0 ? current : index);
      },
      async selectIndex(root, index = 0) {
        if (!root) return false;
        const items = await thumb.galleryCandidates(root);
        root.__thumbSectionItems = items;
        return thumb.sectionGallery.select(root, index);
      },
      async ensure(root) {
        if (!root || thumb.crop.currentMode(root) !== "section") return false;
        await thumb.sectionGallery.preload(root);
        const items = thumb.sectionGallery.items(root);
        thumb.galleryNavigator.sync(root);
        if (!items.length) {
          thumb.crop.status(root, "В галерее записи нет изображений");
          return false;
        }
        return thumb.sectionGallery.select(root, root.__thumbSectionIndex || 0);
      },
      async move(root, offset = 0) {
        if (thumb.crop.currentMode(root) !== "section") return false;
        const items = thumb.sectionGallery.items(root);
        if (!items.length) return false;
        return thumb.sectionGallery.select(root, Number(root.__thumbSectionIndex || 0) + Number(offset || 0));
      },
    },
    sectionPhoto: {
      target() {
        const input = document.querySelector("#news_list_photo");
        const checkbox = document.querySelector("#mark_on_list_page");
        const container = document.querySelector("#news-list-photo-container");
        const preview = container?.querySelector?.("a.thickbox img") || container?.querySelector?.("img") || null;
        if (!input || !checkbox) return null;
        return { input, checkbox, container, preview };
      },
      value() {
        return String(thumb.sectionPhoto.target()?.input?.value || "").trim();
      },
      normalize(url = "") {
        const value = String(url || "").trim();
        if (!value) return "";
        try {
          const parsed = new URL(value, window.location.href);
          const filename = source.filename(parsed.pathname);
          const newsImage = parsed.hostname === "content.onliner.by" && parsed.pathname.startsWith("/news/");
          if (!filename || !newsImage) return value;
          return `https://content.onliner.by/news/800x920/${filename}`;
        } catch {
          return value;
        }
      },
      set(url = "") {
        const target = thumb.sectionPhoto.target();
        if (!target) return false;
        const value = thumb.sectionPhoto.normalize(url);
        const active = Boolean(value);
        target.input.value = value;
        target.input.setAttribute("value", value);
        target.checkbox.checked = active;
        if (active) target.checkbox.setAttribute("checked", "checked");
        else target.checkbox.removeAttribute("checked");
        if (target.preview) target.preview.setAttribute("src", value);
        if (target.container) target.container.style.display = active ? "" : "none";
        return true;
      },
      async url(item = null) {
        const direct = thumb.sectionPhoto.normalize(item?.url || item?.src || "");
        if (direct) return direct;
        const id = String(item?.id || "").trim();
        if (!id) return "";
        const candidate = await thumb.uploadedCandidate(id, item?.search || item?.title || "");
        return thumb.sectionPhoto.normalize(candidate?.url || candidate?.src || "");
      },
      async apply(item = null) {
        const url = await thumb.sectionPhoto.url(item);
        return Boolean(url && thumb.sectionPhoto.set(url));
      },
    },
    syncSectionPhoto(root) {
      if (!root) return false;
      root.toggleAttribute("data-has-section-photo", Boolean(thumb.sectionPhoto.value()));
      return true;
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
    waitThumbnailId(id = "", { attempts = 20, delay = 100 } = {}) {
      const expected = String(id || "").trim();
      if (!expected) return Promise.resolve(false);
      return new Promise((resolve) => {
        let current = 0;
        const tick = () => {
          if (thumb.currentThumbnailId() === expected) {
            resolve(true);
            return;
          }
          current += 1;
          if (current >= attempts) {
            resolve(false);
            return;
          }
          window.setTimeout(tick, delay);
        };
        tick();
      });
    },
    async applyNative(item) {
      const id = String(item?.id || "").trim();
      const nonce = String(item?.nonce || "").trim();
      if (!id || !nonce || typeof window.WPSetAsThumbnail !== "function") {
        return false;
      }
      window.WPSetAsThumbnail(id, nonce);
      return thumb.waitThumbnailId(id);
    },
    async applyNativeWithLibraryNonce(item) {
      const id = String(item?.id || "").trim();
      if (!id) return false;
      const nonce = await thumb.thumbnailNonceFromLibrary();
      if (!nonce) return false;
      return thumb.applyNative({ ...item, id, nonce });
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
    removeThumbnail() {
      const link = document.querySelector("#remove-post-thumbnail");
      if (link?.click) {
        link.click();
        return true;
      }
      const input = document.querySelector("#_thumbnail_id");
      if (!input) return false;
      input.value = "-1";
      if (typeof window.WPSetThumbnailID === "function") {
        window.WPSetThumbnailID(-1);
      }
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
    async applyAttachment(item) {
      const id = String(item?.id || "").trim();
      if (!id) return false;
      const nonce =
        String(item?.nonce || "").trim() ||
        await thumb.thumbnailNonceFromLibrary();
      if (!nonce) return false;
      const value = { ...item, id, nonce };
      const ajaxDone = await thumb.applyAjax(value);
      if (ajaxDone && await thumb.waitThumbnailId(id)) {
        return thumb.applyResult(true, id);
      }
      const nativeDone = await thumb.applyNative(value);
      if (!nativeDone) return false;
      return thumb.applyResult(await thumb.waitThumbnailId(id), id);
    },
    async applyExisting(item) {
      return thumb.applyAttachment(item);
    },
    async apply(item, { confirmReplace = true } = {}) {
      if (confirmReplace && !thumb.confirmReplace()) return false;
      return thumb.applyAttachment(item);
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
        const value = html.trim();
        if (value === "1") {
          thumb.ensureThumbnailInput(id);
          if (typeof window.WPSetThumbnailID === "function") {
            window.WPSetThumbnailID(id);
          }
          return true;
        }
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
    library: {
      async fetched(search = "") {
        const documentValue = await thumb.fetchDocument({ search });
        if (!documentValue) return [];
        return thumb.candidates(documentValue, { search });
      },
    },
    async loadCandidates({ search = "" } = {}) {
      if (!thumb.button()) return thumb.notice.missingButton();
      return thumb.library.fetched(search);
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
      const fallback = imageSearch.defaultQuery();
      const query = fallback || window.prompt(thumb.copy.search.prompt, "");
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
