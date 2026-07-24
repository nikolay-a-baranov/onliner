import { cms } from "../core/cms.js";
import { widget } from "../core/widget.js";
import { host } from "../core/surface/host.js";
import { styles as css } from "../core/surface/styles.js";
import { toolbar } from "../core/surface/toolbar.js";
import { ui } from "../core/surface/ui.js";
import { ux } from "../core/surface/ux.js";
import { icon } from "../core/surface/icon.js";
import { contentEmbed as sharedContentEmbed } from "../pipe/markup.js";
import { normalizeBlocks as normalizeContentBlocks } from "../pipe/content.js";

export const contentEmbed = sharedContentEmbed;

export const createContent = (api) => {
  const entity = {
    decode(value = "") {
      const field = document.createElement("textarea");
      field.innerHTML = String(value || "");
      return field.value;
    },
  };
  const toc = {
    titles: ["О чем этот текст", "О чем пойдет речь"],
    skip(tag = "") {
      return /\sid=(?:"toc"|'toc'|toc)(?:\s|>)/i.test(String(tag || ""));
    },
    key(value = "") {
      return entity
        .decode(
          String(value || "")
            .replace(/<[^>]+>/g, "")
            .replace(/\s+/g, " ")
            .trim(),
        )
        .toLocaleLowerCase("ru-RU")
        .replace(/ё/g, "е");
    },
    headingTitle(value = "") {
      const key = toc.key(value);
      return toc.titles.find((title) => toc.key(title) === key) || "";
    },
    stale(value = "") {
      return /href=(?:"#zag\d+"|'#zag\d+'|#zag\d+)(?:\s|>)/i.test(
        String(value || ""),
      );
    },
    clean(value = "") {
      return String(value || "").replace(
        /^\s*<a\b[^>]*\bname=(?:"zag\d+"|'zag\d+'|zag\d+)[^>]*>\s*<\/a>\s*/i,
        "",
      );
    },
    title(value = "") {
      return entity.decode(
        String(value || "")
          .replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .trim(),
      );
    },
    tag(value = "", id = "") {
      return String(value || "").replace(/^<h2\b([^>]*)>/i, (_, attrs) => {
        const clean = String(attrs || "").replace(
          /\s+id=(?:"[^"]*"|'[^']*'|[^\s>]+)/i,
          "",
        );
        return `<h2${clean} id="${id}">`;
      });
    },
    replace(value = "", items = []) {
      return String(value || "").replace(
        /<h2\b[^>]*>[\s\S]*?<\/h2>/gi,
        (match) => {
          const tag = match.match(/^<h2\b[^>]*>/i)?.[0] || "";
          if (toc.skip(tag)) return match;
          const id = `zag${items.length}`;
          const inner = match
            .replace(/^<h2\b[^>]*>/i, "")
            .replace(/<\/h2>$/i, "");
          const content = toc.clean(inner);
          items.push({ id, title: toc.title(content) });
          return `${toc.tag(tag, id)}<a name="${id}"></a>${content}</h2>`;
        },
      );
    },
    heading(tag = "h2", attrs = "", inner = "") {
      const clean = String(attrs || "").replace(
        /\s+id=(?:"[^"]*"|'[^']*'|[^\s>]+)/i,
        "",
      );
      return `<${tag}${clean} id="toc">${inner || toc.titles[0]}</${tag}>`;
    },
    build(items = [], data = {}) {
      const title = data.title || toc.titles[0];
      const heading = data.heading || toc.heading("h2", "", title);
      const list = data.list || "<ul>";
      return [
        heading,
        list,
        ...items.map(
          (item) =>
            /^\t<li\b/i.test(String(item.html || ""))
              ? item.html
              : item.html
                ? `\t${String(item.html || "").trim()}`
                : `\t<li><a href="#${item.id}">${item.title}</a></li>`,
        ),
        "</ul>",
      ].join("\n");
    },
    remove(value = "") {
      const data = {
        value: String(value || ""),
        heading: "",
        title: "",
        list: "",
      };
      const heading = String.raw`<(h[1-6])\b([^>]*)>([\s\S]*?)<\/\1>`;
      const list = String.raw`<ul\b[^>]*>[\s\S]*?href=(?:"#zag\d+"|'#zag\d+'|#zag\d+)[\s\S]*?<\/ul>`;
      data.value = data.value.replace(
        new RegExp(String.raw`\n?\s*${heading}\s*(${list})\s*`, "gi"),
        (match, tag, attrs, headingText, listText) => {
          const open = `<${tag}${attrs}>`;
          if (toc.skip(open)) {
            data.heading ||= `${open}${headingText}</${tag}>`;
            data.title ||= toc.title(headingText);
          } else {
            data.title ||= headingText || toc.title(headingText);
          }
          data.list ||= listText.match(/^<ul\b[^>]*>/i)?.[0] || "<ul>";
          return "\n";
        },
      );
      data.value = data.value.replace(
        new RegExp(String.raw`\n?\s*(${list})\s*`, "gi"),
        (match, listText) => {
          data.list ||= listText.match(/^<ul\b[^>]*>/i)?.[0] || "<ul>";
          return "\n";
        },
      );
      return data;
    },
    insert(value = "", content = "") {
      const marker = String(value || "").match(/<!--more-->/i);
      if (!marker || marker.index === undefined) return value;
      const point = marker.index + marker[0].length;
      const left = String(value || "")
        .slice(0, point)
        .replace(/[ \t]+$/g, "")
        .replace(/\n+$/g, "");
      const right = String(value || "")
        .slice(point)
        .replace(/^[ \t]+/g, "")
        .replace(/^\n+/g, "");
      return `${left}\n\n${content}${right ? "\n\n" : ""}${right}`;
    },
    compose(value = "", options = {}) {
      const items = [];
      const clean = toc.remove(value);
      const content = toc.replace(clean.value, items);
      if (!items.length) return value;
      return toc.insert(
        content,
        toc.build(items, {
          title: options.title || clean.title || toc.titles[0],
          list: clean.list,
        }),
      );
    },
    run() {
      return api.editor.document((state) => {
        const next = toc.compose(state.value);
        if (next === state.value) return null;
        return {
          value: next,
          start: Math.min(state.start, next.length),
          end: Math.min(state.end, next.length),
        };
      });
    },
  };
  const more = {
    token: "<!--more-->",
    edge(value = "", index = 0) {
      const left = String(value || "").slice(0, index);
      const right = String(value || "").slice(index + more.token.length);
      return {
        leftInline: /[^\s]/.test(left.replace(/[ \t]*$/g, "").slice(-1)),
        rightInline: /^[ \t]*[^\s]/.test(right),
      };
    },
    remove(value = "") {
      let next = String(value || "");
      while (next.includes(more.token)) {
        const index = next.indexOf(more.token);
        const edge = more.edge(next, index);
        const gap = edge.leftInline && edge.rightInline ? "\n\n" : "";
        next =
          next.slice(0, index) + gap + next.slice(index + more.token.length);
      }
      return next;
    },
    compact(value = "") {
      return normalizeContentBlocks(
        String(value || "")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n[ \t]+/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/^[ \t]+/g, "")
        .replace(/[ \t]+$/g, ""),
      );
    },
    point(value = "") {
      const source = String(value || "");
      const string = source.replace(/^\s+/, "");
      const offset = source.length - string.length;
      const html = string.match(/<\/(?:p|div|blockquote|h[1-6])>/i);
      const gap = string.match(/\n/);
      const points = [
        html && html.index !== undefined
          ? offset + html.index + html[0].length
          : null,
        gap && gap.index !== undefined ? offset + gap.index : null,
      ].filter(Number.isInteger);
      if (!points.length) return source.length;
      return Math.min(...points);
    },
    insert(value = "") {
      const string = String(value || "");
      const point = more.point(string);
      const left = string
        .slice(0, point)
        .replace(/[ \t]+$/g, "")
        .replace(/\n+$/g, "");
      const right = string
        .slice(point)
        .replace(/^[ \t]+/g, "")
        .replace(/^\n+/g, "");
      return `${left}${more.token}${right ? "\n\n" : ""}${right}`;
    },
    normalize(value = "") {
      return more.insert(more.compact(more.remove(value)));
    },
    run() {
      return api.editor.change((state) => {
        const next = more.normalize(state.value);
        if (next === state.value) return null;
        return {
          value: next,
          start: Math.min(state.start, next.length),
          end: Math.min(state.end, next.length),
        };
      });
    },
  };
  const embed = {
    ...contentEmbed,
    async source() {
      try {
        const value = await navigator.clipboard.readText();
        if (String(value || "").trim()) return value;
      } catch {}
      return prompt("Ссылка") || "";
    },
    async run() {
      const value = await embed.source();
      if (!String(value || "").trim()) return false;
      const shortcode = contentEmbed.build(value);
      if (!shortcode) {
        alert(
          "Ссылку на ютуб, инсту, тредс, тикток, твитор или телегу скопируй и дай сюда.",
        );
        return false;
      }
      return api.insert(shortcode);
    },
  };
  const readmore = {
    token: {
      slash(url) {
        return url.endsWith("/") ? url : `${url}/`;
      },
      same(url) {
        return readmore.token.slash(url.split("#")[0].split("?")[0]);
      },
      clean(value = "") {
        return String(value || "")
          .replace(/\s*[-–—]\s*.*onl[ií]ner.*$/i, "")
          .trim();
      },
      escape(value = "") {
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      },
    },
    parse(value = "") {
      const seen = new Set();
      return [
        ...String(value || "").matchAll(
          /https?:\/\/[a-z0-9-]+\.onliner\.by\/\d{4}\/\d{2}\/\d{2}\/[^\s"'<>]+/gi,
        ),
      ]
        .map(([url]) =>
          readmore.token.same(
            url.replace(/&amp;/g, "&").replace(/[),.;:!?]+$/g, ""),
          ),
        )
        .filter((url) => {
          if (seen.has(url)) return false;
          seen.add(url);
          return true;
        });
    },
    async source() {
      try {
        const value = await navigator.clipboard.readText();
        if (String(value || "").trim()) return value;
      } catch {}
      return prompt("Ссылки") || "";
    },
    async title(url) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) return "";
        const page = new DOMParser().parseFromString(
          await response.text(),
          "text/html",
        );
        return readmore.token.clean(
          page.querySelector('meta[property="og:title"]')?.content ||
            page.title ||
            "",
        );
      } catch {
        return "";
      } finally {
        clearTimeout(timer);
      }
    },
    async link(url) {
      const title = await readmore.title(url);
      if (title) return { url, text: title };
      const text = readmore.token.clean(prompt(`Заголовок для ${url}`) || "");
      return text ? { url, text } : null;
    },
    insert(links = []) {
      const items = links.map(
        ({ url, text }) =>
          `\t<li><a href="${readmore.token.escape(url)}" target="_blank">${readmore.token.escape(text)}</a></li>`,
      );
      const block = `<strong>Читайте также:</strong>\n<ul>\n${items.join("\n")}\n</ul>`;
      cms.editor.insert.block(block);
      return true;
    },
    async run() {
      const value = await readmore.source();
      const urls = readmore.parse(value);
      if (!urls.length) return false;
      const links = (await Promise.all(urls.map(readmore.link))).filter(
        Boolean,
      );
      if (!links.length) return false;
      return readmore.insert(links);
    },
  };
  const widgets = {
    run() {
      const textarea = document.getElementById("content");
      if (!textarea) return false;
      cms.editor.html();
      const mode = widget.mode.create();
      cms.editor.runContent((value) => mode.next(value));
      return true;
    },
  };
  const promo = {
    ids: {
      panel: "promo-widget-panel",
      style: "promo-widget-style",
      input: "promo-widget-input",
    },
    copy: {
      title: "Зелень",
      action: {
        insert: "Вставить",
      },
    },
    text: "Этот текст уже выходил на Onlíner. Мы обновили материал и вновь делимся им, потому что а почему бы и нет.",
    colors: [
      { value: "#FFF5EE", name: "Морская ракушка" },
      { value: "#E6E6FA", name: "Лаванда" },
      { value: "#FFF0F5", name: "Розово-лавандовый" },
      { value: "#F5F5F5", name: "Белый дым" },
      { value: "#F0F8FF", name: "Синяя Элис" },
      { value: "#F5FFFA", name: "Мятный крем" },
      { value: "#F0FFFF", name: "Лазурный" },
      { value: "#FFE4E1", name: "Туманная роза" },
      { value: "#FAF0E6", name: "Текстильный" },
      { value: "#FFFAF0", name: "Цветочно белый" },
      { value: "#F0FFF0", name: "Медвяная роса" },
    ],
    state: {
      target: null,
      start: 0,
      end: 0,
      color: 10,
    },
    escape(value = "") {
      return ui.controls.escape(String(value || ""));
    },
    entity(value = "") {
      return Array.from(String(value || ""))
        .map((char) => `&#${char.codePointAt(0)};`)
        .join("");
    },
    html(value = "") {
      return `<p>${String(value || "").trim()}</p>`;
    },
    textValue(value = "") {
      return entity
        .decode(widget.text.widget(value))
        .replace(/\s+/g, " ")
        .trim();
    },
    colorValue(value = "") {
      return String(value || "").trim().toUpperCase();
    },
    signature(value = "", color = promo.color().value) {
      const text = promo.textValue(value);
      if (!text) return "";
      return `${text}\n${promo.colorValue(color)}`;
    },
    content() {
      return String(document.getElementById("content")?.value || "");
    },
    applied(value = promo.panel.value()) {
      const signature = promo.signature(value);
      let applied = false;
      widget.block.mapJson(promo.content(), widget.tag.promo, (full, data) => {
        if (!data || applied) return full;
        if (promo.signature(entity.decode(data.text || ""), data.color) === signature) {
          applied = true;
        }
        return full;
      });
      return applied;
    },
    color() {
      return promo.colors[promo.state.color] || promo.colors[3];
    },
    data(value = "") {
      return {
        title: "",
        image: "",
        originalImage: "",
        text: promo.entity(promo.html(value)),
        color: promo.color().value,
        label: "",
      };
    },
    dataFrom(data = {}) {
      return {
        title: String(data.title || ""),
        image: String(data.image || ""),
        originalImage: String(data.originalImage || ""),
        text: promo.entity(widget.text.widget(data.text || "")),
        color: String(data.color || promo.color().value),
        label: String(data.label || ""),
      };
    },
    shortcode(value = "") {
      return widget.block.stringify(widget.tag.promo, promo.data(value));
    },
    shortcodeData(data = {}) {
      return widget.block.stringify(widget.tag.promo, promo.dataFrom(data));
    },
    target() {
      cms.editor.html?.();
      cms.editor.syncToTextarea?.();
      return document.getElementById("content");
    },
    capture() {
      const target = promo.target();
      if (!target) return false;
      const fallback = String(target.value || "").length;
      promo.state.target = target;
      promo.state.start = target.selectionStart ?? fallback;
      promo.state.end = target.selectionEnd ?? promo.state.start;
      return true;
    },
    restore() {
      const target = promo.state.target || promo.target();
      if (!target) return false;
      const length = String(target.value || "").length;
      const start = Math.max(0, Math.min(length, promo.state.start));
      const end = Math.max(start, Math.min(length, promo.state.end));
      target.focus?.();
      target.setSelectionRange?.(start, end);
      return true;
    },
    insert(value = "") {
      if (!promo.restore()) return false;
      return api.insert(promo.shortcode(value));
    },
    insertData(data = {}) {
      if (!promo.restore()) return false;
      return api.insert(promo.shortcodeData(data));
    },
    template(key) {
      const data = widget.template.promo[key];
      if (!data) return false;
      promo.capture();
      return promo.insertData(data);
    },
    run() {
      promo.capture();
      return promo.panel.show();
    },
  };
  promo.view = {
    theme() {
      return (
        document.querySelector('.panel[data-ui-surface="toolbar"]')?.dataset
          ?.theme || "dark"
      );
    },
    icon(value = "") {
      return ui.controls.icon(icon.emoji(value));
    },
    style() {
      return css.content.promo(promo.ids.panel);
    },
    head() {
      return ui.shell.frame({
        classes: "promo-widget-head",
        pack: "spread",
        left: ui.controls.marker({
          content: promo.view.icon("evergreen-tree"),
          button: {
            title: promo.copy.title,
            attrs: ` type="button" tabindex="-1" aria-label="${promo.copy.title}"`,
          },
        }),
        main: promo.view.submit(),
        right: ui.controls.chrome({
          theme: promo.view.theme(),
          themeAction: "promo.theme",
          closeAction: "promo.close",
        }),
      });
    },
    color() {
      const color = promo.color();
      const content = ui.controls.icon(
        ui.controls.glyph("Color Background", 22),
      );
      return `<button class="promo-widget-color" type="button" data-action="promo.color" data-promo-color="true" title="${promo.escape(color.name)}" aria-label="${promo.escape(color.name)}">${content}</button>`;
    },
    applyState(root = promo.panel.node()) {
      const value = promo.panel.value(root);
      const signature = promo.signature(value);
      return ux.glyph.apply.state({
        text: signature,
        applied: promo.applied(value) ? signature : "",
        title: {
          disabled: promo.copy.action.insert,
          pending: promo.copy.action.insert,
          applied: promo.copy.action.insert,
        },
      });
    },
    applyGlyph(state = promo.view.applyState()) {
      return ux.glyph.apply.html(state, 22);
    },
    submit() {
      const state = promo.view.applyState();
      return ui.controls.marker({
        content: ui.controls.icon(promo.view.applyGlyph(state)),
        button: {
          title: state.title || promo.copy.action.insert,
          attrs: ` type="button" data-action="promo.insert" aria-label="${state.title || promo.copy.action.insert}" data-promo-apply="true" data-apply-state="${state.name || ""}"`,
        },
      });
    },
    input() {
      return `<div class="promo-widget-message-wrap"><textarea id="${promo.ids.input}" class="promo-widget-message" data-promo-input="true">${promo.escape(promo.text)}</textarea>${promo.view.color()}</div>`;
    },
    body() {
      return ui.shell.stack(
        ui.shell.row(promo.view.input(), ' data-promo-input-row="true"'),
        ' data-promo-body="true"',
      );
    },
    html() {
      return ui.shell.stack(`${promo.view.head()}${promo.view.body()}`);
    },
    syncColor(root = promo.panel.node()) {
      const button = root?.querySelector?.('[data-action="promo.color"]');
      if (!button) return false;
      const color = promo.color();
      button.title = color.name;
      button.setAttribute("aria-label", color.name);
      root?.style?.setProperty?.("--promo-widget-color", color.value);
      promo.view.syncApply(root);
      return true;
    },
    syncApply(root = promo.panel.node()) {
      const button = root?.querySelector?.('[data-action="promo.insert"]');
      const target = button?.querySelector?.(".ui-icon-content");
      if (!button || !target) return false;
      const state = promo.view.applyState(root);
      ux.glyph.sync(
        target,
        promo.view.applyGlyph(state),
        state.name,
        { datasetKey: "promoGlyphKey" },
      );
      const title = state.title || promo.copy.action.insert;
      button.dataset.applyState = state.name || "";
      button.title = title;
      button.setAttribute("aria-label", title);
      return true;
    },
    syncTheme(root = promo.panel.node()) {
      if (!root) return "dark";
      const theme = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = theme;
      ui.surface.sync(root, {
        layout: "fullscreen",
        theme,
        surface: "toolbar",
      });
      ui.controls.chrome.theme(root, {
        theme,
        action: "promo.theme",
      });
      return theme;
    },
    build() {
      host.mount(promo.ids.style, promo.view.style());
      const root = host.create({
        id: promo.ids.panel,
        html: promo.view.html(),
        draggable: true,
      });
      root.dataset.uiSurface = "toolbar";
      root.dataset.uiFrame = "capsule";
      root.dataset.toolbarFlow = "stack";
      root.dataset.promoPanel = "true";
      root.dataset.panelDragHandle = "true";
      ui.surface.sync(root, {
        layout: "fullscreen",
        theme: promo.view.theme(),
        surface: "toolbar",
      });
      root.style.setProperty("--promo-widget-color", promo.color().value);
      root.addEventListener("click", promo.view.click);
      root.addEventListener("input", promo.view.inputEvent);
      root.addEventListener("keydown", promo.view.keydown);
      toolbar.center(root, 16);
      promo.view.syncApply(root);
      promo.view.focus(root);
      return root;
    },
    focus(root = promo.panel.node()) {
      root?.querySelector?.('[data-promo-input="true"]')?.focus?.();
      return true;
    },
    click(event) {
      const action =
        event.target?.closest?.("[data-action]")?.dataset?.action || "";
      if (action === "promo.close") return promo.panel.close();
      if (action === "promo.theme") return promo.view.syncTheme();
      if (action === "promo.color") return promo.panel.color();
      if (action === "promo.insert") return promo.panel.apply();
      return false;
    },
    inputEvent(event) {
      if (!event.target?.matches?.('[data-promo-input="true"]')) return false;
      return promo.view.syncApply();
    },
    keydown(event) {
      if (event.key === "Escape") return promo.panel.close();
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        return promo.panel.apply();
      }
      return false;
    },
  };
  promo.panel = {
    node() {
      return document.getElementById(promo.ids.panel);
    },
    value(root = promo.panel.node()) {
      return String(
        root?.querySelector?.('[data-promo-input="true"]')?.value || "",
      );
    },
    color() {
      promo.state.color = (promo.state.color + 1) % promo.colors.length;
      return promo.view.syncColor();
    },
    apply(root = promo.panel.node()) {
      const value = promo.panel.value(root);
      if (!value.trim()) return false;
      const done = promo.insert(value);
      if (done) promo.view.syncApply(root);
      if (done) promo.panel.close();
      return done;
    },
    close() {
      const root = promo.panel.node();
      if (!root) return false;
      root.remove();
      return true;
    },
    show() {
      const existing = promo.panel.node();
      if (existing) {
        promo.view.focus(existing);
        return true;
      }
      promo.view.build();
      return true;
    },
  };
  const photo = {
    run() {
      return api.insert("ФОТО ", 5);
    },
  };
  const video = {
    run() {
      return api.insert("[video][/video]", 7);
    },
  };
  return {
    content: {
      toc,
      more,
      embed,
      readmore,
      widgets,
      promo,
      photo,
      video,
    },
  };
};
