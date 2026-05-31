import { panel } from "./core/panel.js";
import { toolbar } from "./core/toolbar.js";
import { icon } from "./core/icon.js";
import { css } from "./core/css.js";
import { ui } from "./core/ui.js";
import { widget } from "./core/widget.js";
import { design } from "./core/design.js";
import { delivery } from "./core/delivery.js";
import { cms } from "./core/cms.js";
import { excerpt } from "./pipe/excerpt.js";

(() => {
  const glyph = {
    smaller: "\u2796",
    bigger: "\u2795",
    editor: "\u2712\uFE0F",
    titles: "\u{1F4D4}",
    excerpt: "\u{1F4AD}",
    slug: "\u{1F587}\uFE0F",
    delivery: "\u{1F4EB}",
    exit: "\u274C",
  };
  const source = document.querySelector("#content");
  if (source) {
    const next = widget.ensure(source.value);
    if (next !== source.value) {
      source.value = next;
      source.dispatchEvent(new Event("input", { bubbles: true }));
      source.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  const session = {
    keys() {
      return ["readerExit", "mobileExit"];
    },
    clear() {
      session.keys().forEach((key) => delete window[key]);
    },
  };
  const active = document.getElementById("reader-content");
  if (active && window.readerExit) {
    window.readerExit();
    return;
  }
  if (active && window.mobileExit) {
    window.mobileExit();
    return;
  }
  if (active) {
    active.remove();
    const panel = document.getElementById("reader-panel");
    if (panel) {
      toolbar.destroy(panel);
      panel.remove();
    }
    document.body.classList.remove("reader-active");
    document.body.classList.remove("mobile-active");
    session.clear();
    return;
  }
  session.clear();
  const reader = {
    scenario: {
      list(value) {
        if (!value) return [];
        return String(value)
          .toLowerCase()
          .split(/[\s,;|]+/)
          .map((item) => item.trim())
          .filter(Boolean);
      },
      context() {
        const root = document.documentElement;
        const body = document.body;
        const layout = document.querySelector("#layout_select")?.value || "";
        const type = reader.scenario.list(
          layout ||
            body?.dataset?.type ||
            body?.dataset?.entity ||
            root?.dataset?.pageType ||
            root?.dataset?.entityType ||
            document
              .querySelector('meta[name="page:type"],meta[property="og:type"]')
              ?.getAttribute("content"),
        );
        const path = location.pathname.toLowerCase();
        const classList = [
          ...(body?.classList || []),
          ...(root?.classList || []),
        ]
          .map((item) => item.toLowerCase())
          .join(" ");
        return { type, path, classList };
      },
      name() {
        const context = reader.scenario.context();
        if (
          context.type.includes("longread") ||
          context.path.includes("/longread/") ||
          context.classList.includes("longread")
        ) {
          return "longread";
        }
        if (
          context.type.includes("photoreport") ||
          context.path.includes("/photo/") ||
          context.path.includes("/photoreport/") ||
          context.classList.includes("photoreport")
        ) {
          return "photoreport";
        }
        return "news";
      },
      emoji() {
        return (
          {
            longread: "\u{1F4F0}",
            news: "\u{1F5DE}\uFE0F",
            photoreport: "\u{1F4F8}",
          }[reader.scenario.name()] || "\u{1F5DE}\uFE0F"
        );
      },
      panel: {
        id: "reader-scenario-panel",
      },
      tools: {
        list() {
          return {
            longread: [
              "cleanup",
              "proofread",
              "schedule",
              "private",
              "save",
              "publish",
              "toc",
              "dump",
            ],
            news: ["cleanup", "proofread", "update", "private", "save", "publish"],
            photoreport: ["cleanup", "proofread", "private", "save", "publish"],
          };
        },
        icons() {
          return {
            cleanup: "\u{1F488}",
            proofread: "\u{1F9FF}",
            reader: "\u{1F576}\uFE0F",
            lead: "\u{1F4AD}",
            schedule: "\u{1F4C5}",
            private: "\u{1F517}",
            toc: "\u{1F9ED}",
            save: "\u{1F4BE}",
            publish: "\u{1F680}",
            editor: "\u{270F}\uFE0F",
            update: "\u{1F199}",
          };
        },
        ids() {
          const map = reader.scenario.tools.list();
          return map[reader.scenario.name()] || map.news;
        },
        icon(id) {
          const value = reader.scenario.tools.icons()[id] || "\u{1F516}";
          return icon.emoji(value, "default");
        },
        src(id) {
          const current = document.currentScript;
          const fallback = [...document.querySelectorAll("script[src]")].find(
            (node) => /\/(?:dist\/)?reader\.js(?:\?|$)/.test(node.src),
          );
          const source = current?.src || fallback?.src || "";
          if (!source) return "";
          const url = new URL(source, location.href);
          url.pathname = url.pathname.replace(/reader\.js$/i, `${id}.js`);
          url.searchParams.set("v", String(Date.now()));
          return url.href;
        },
        run(id) {
          if (!id || id === "reader") return;
          if (id === "editor") return reader.editorToggle();
          const src = reader.scenario.tools.src(id);
          if (!src) return;
          const script = document.createElement("script");
          script.src = src;
          (document.head || document.body || document.documentElement).append(
            script,
          );
        },
      },
      panelNode() {
        return document.getElementById(reader.scenario.panel.id);
      },
      panelClose() {
        reader.scenario.panelNode()?.remove();
      },
      panelHtml() {
        const scenarioButton = ui.controls.button({
          content: icon.emoji(reader.scenario.emoji(), "reader"),
          action: "",
          attrs: ' type="button"',
        });
        const tools = reader.scenario.tools.ids();
        const line = tools
          .map((id) =>
            ui.controls.button({
              content: reader.scenario.tools.icon(id),
              action: "scenario-tool",
              attrs: ` data-id="${id}" type="button"`,
            }),
          )
          .join("");
        const theme = ui.controls.button({
          content: icon.theme(reader.theme()),
          action: "scenario-theme",
          attrs: ' type="button"',
        });
        const close = ui.controls.button({
          content: icon.emoji("\u{274C}", "default"),
          action: "scenario-close",
          attrs: ' type="button"',
        });
        return ui.shell.shell({
          left: ui.shell.group(scenarioButton, { rail: true }),
          main: ui.shell.strip(line),
          right: ui.shell.group(`${theme}${close}`, { rail: true }),
        });
      },
      panelRender() {
        const panelNode = reader.scenario.panelNode();
        if (!panelNode) return;
        panelNode.innerHTML = reader.scenario.panelHtml();
        ui.surface.sync(panelNode, {
          layout: "fullscreen",
          theme: reader.theme(),
          surface: "toolbar",
        });
      },
      panelOpen() {
        if (reader.scenario.panelNode()) {
          reader.scenario.panelClose();
          return;
        }
        const panelNode = panel.create({
          id: reader.scenario.panel.id,
          className: "panel",
          place: "right",
          html: reader.scenario.panelHtml(),
        });
        ui.surface.sync(panelNode, {
          layout: "fullscreen",
          theme: reader.theme(),
          surface: "toolbar",
        });
        ui.surface.bindToolbar({
          panel: panelNode,
          root: panelNode,
          initial: "center",
          rememberPosition: false,
          action: ({ name, button }) => {
            if (name === "scenario-close") return reader.scenario.panelClose();
            if (name === "scenario-theme") {
              return ui.surface.themeLocal(panelNode, {
                action: "scenario-theme",
                scope: "reader",
              });
            }
            if (name === "scenario-tool") {
              const id = button?.dataset?.id || "";
              return reader.scenario.tools.run(id);
            }
          },
        });
      },
    },
    layout: {
      breakpoint: {
        phoneMaxShortEdge: design.surface.reader.layout.phoneMaxShortEdge,
      },
      padding: {
        top: {
          desktop: design.surface.reader.layout.topDesktop,
          touchBase: design.surface.reader.layout.topTouchBase,
          touchFade: design.surface.reader.layout.topTouchFade,
        },
        side: {
          touch: design.surface.reader.layout.sideTouch,
          desktop: design.surface.reader.layout.sideDesktop,
        },
        bottom: {
          desktop: design.surface.reader.layout.bottomDesktop,
          touch: design.surface.reader.layout.bottomTouch,
        },
      },
      panel: {
        height: {
          touch: design.surface.reader.layout.panelTouchHeight,
          desktop: design.surface.reader.layout.panelDesktopHeight,
        },
        inset: design.surface.reader.layout.panelInset,
      },
      keyboard: {
        openThreshold: design.surface.reader.layout.keyboardOpenThreshold,
      },
      font: {
        display: {
          min: {
            desktop: design.surface.reader.layout.fontMinDesktop,
            tablet: design.surface.reader.layout.fontMinTablet,
            phone: design.surface.reader.layout.fontMinPhone,
          },
          max: design.surface.reader.layout.fontMax,
        },
      },
    },
    id: "reader-content",
    button: "reader-button",
    panel: "reader-panel",
    launcher: {
      id: "launcher-panel",
      hidden: false,
      display: "",
      panel() {
        return document.getElementById(reader.launcher.id);
      },
      hide() {
        const node = reader.launcher.panel();
        if (!node || reader.launcher.hidden) return;
        reader.launcher.display = node.style.display || "";
        node.style.display = "none";
        reader.launcher.hidden = true;
      },
      show() {
        const node = reader.launcher.panel();
        if (!node || !reader.launcher.hidden) return;
        node.style.display = reader.launcher.display;
        reader.launcher.display = "";
        reader.launcher.hidden = false;
      },
    },
    listeners: [],
    widgetReadable: false,
    widgetCache: {
      promo: [],
      vote: [],
    },
    popup: {
      titles: {
        title: {
          key: "title",
          title: "title",
          limit: 130,
        },
        rotation: {
          key: "rotation",
          title: "rotation_titles[]",
          limit: 130,
        },
        favourite: {
          key: "favourite",
          title: "favourite_title",
          limit: 130,
        },
        seo: {
          key: "seo",
          title: "seo_title",
          limit: 65,
        },
      },
      title: {
        selector: "#title",
        label: "title",
      },
      rotation: {
        selector: 'input[name="rotation_titles[]"]',
        label: "rotation_titles[]",
      },
      favourite: {
        selector: '#favourite_title,input[name="favourite_title"]',
        label: "favourite_title",
      },
      seo: {
        selector:
          '#seo_title,#yoast_wpseo_title,input[name="seo_title"],input[name="yoast_wpseo_title"]',
        label: "seo_title",
      },
      excerpt: {
        selector: '#excerpt,textarea[name="excerpt"]',
        label: "excerpt",
        title: "excerpt",
        kind: "excerpt",
        limit: 320,
      },
      slug: {
        selector:
          '#editable-post-name input,#new-post-slug,input[name="post_name"],#post_name',
        fullSelector:
          '#editable-post-name-full,input[name="editable-post-name-full"]',
        previewSelector: "#editable-post-name",
        label: "editable-post-name",
        title: "editable-post-name",
        kind: "slug",
        limit: 120,
      },
    },
    auto: {
      frame: null,
      tween: null,
      mirror: null,
      marker: null,
      target: null,
      ratio: {
        top: design.surface.reader.auto.topRatio,
        bottom: design.surface.reader.auto.bottomRatio,
      },
      line: 24,
      setup(value) {
        if (!reader.desktop()) return;
        if (reader.auto.mirror) return;
        const mirror = document.createElement("div");
        const marker = document.createElement("span");
        marker.textContent = "\u200b";
        mirror.style.position = "fixed";
        mirror.style.left = "-99999px";
        mirror.style.top = "0";
        mirror.style.visibility = "hidden";
        mirror.style.pointerEvents = "none";
        mirror.style.whiteSpace = "pre-wrap";
        mirror.style.wordBreak = "break-word";
        mirror.style.overflowWrap = "anywhere";
        mirror.style.boxSizing = "border-box";
        mirror.appendChild(marker);
        document.body.appendChild(mirror);
        reader.auto.mirror = mirror;
        reader.auto.marker = marker;
        reader.auto.sync(value);
      },
      clear() {
        if (reader.auto.frame) cancelAnimationFrame(reader.auto.frame);
        if (reader.auto.tween) cancelAnimationFrame(reader.auto.tween);
        reader.auto.frame = null;
        reader.auto.tween = null;
        reader.auto.target = null;
        reader.auto.marker = null;
        reader.auto.mirror?.remove();
        reader.auto.mirror = null;
      },
      animate(value, target) {
        if (!value) return;
        if (reader.auto.tween) cancelAnimationFrame(reader.auto.tween);
        const from = value.scrollTop;
        const to = Math.max(0, target);
        const delta = to - from;
        if (Math.abs(delta) < 1) {
          value.scrollTop = to;
          return;
        }
        const duration = Math.max(
          design.surface.reader.auto.durationMin,
          Math.min(
            design.surface.reader.auto.durationMax,
            Math.abs(delta) * design.surface.reader.auto.durationRatio,
          ),
        );
        const ease = (t) =>
          t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const start = performance.now();
        const step = (now) => {
          const time = Math.min(1, (now - start) / duration);
          value.scrollTop = from + delta * ease(time);
          if (time < 1) {
            reader.auto.tween = requestAnimationFrame(step);
            return;
          }
          reader.auto.tween = null;
        };
        reader.auto.tween = requestAnimationFrame(step);
      },
      sync(value) {
        const mirror = reader.auto.mirror;
        if (!mirror || !value) return;
        const style = getComputedStyle(value);
        mirror.style.width = `${value.clientWidth}px`;
        mirror.style.padding = style.padding;
        mirror.style.border = style.border;
        mirror.style.font = style.font;
        mirror.style.fontSize = style.fontSize;
        mirror.style.fontFamily = style.fontFamily;
        mirror.style.fontWeight = style.fontWeight;
        mirror.style.letterSpacing = style.letterSpacing;
        mirror.style.lineHeight = style.lineHeight;
        mirror.style.textTransform = style.textTransform;
        mirror.style.textIndent = style.textIndent;
        mirror.style.textDecoration = style.textDecoration;
        mirror.style.direction = style.direction;
        mirror.style.textAlign = style.textAlign;
        mirror.style.tabSize = style.tabSize;
        mirror.style.MozTabSize = style.tabSize;
        const line = Number.parseFloat(style.lineHeight);
        if (Number.isFinite(line)) reader.auto.line = line;
      },
      y(value) {
        const mirror = reader.auto.mirror;
        const marker = reader.auto.marker;
        if (!mirror || !marker || !value) return null;
        const start = value.selectionStart || 0;
        mirror.textContent = value.value.slice(0, start);
        mirror.appendChild(marker);
        const top = marker.offsetTop;
        const line = marker.offsetHeight || reader.auto.line;
        return top + line * 0.5 - value.scrollTop;
      },
      point(value, index = 0) {
        const mirror = reader.auto.mirror;
        const marker = reader.auto.marker;
        if (!mirror || !marker || !value) return null;
        const size = Math.max(0, Math.min(value.value.length, Number(index || 0)));
        mirror.textContent = value.value.slice(0, size);
        mirror.appendChild(marker);
        const top = marker.offsetTop - value.scrollTop;
        const line = marker.offsetHeight || reader.auto.line;
        return { top, line };
      },
      paragraph(value) {
        if (!value) return null;
        const text = String(value.value || "");
        const caret = Math.max(0, Math.min(text.length, value.selectionStart || 0));
        const headMark = text.lastIndexOf("\n\n", Math.max(0, caret - 1));
        const tailMark = text.indexOf("\n\n", caret);
        const start = headMark === -1 ? 0 : headMark + 2;
        const end = tailMark === -1 ? text.length : tailMark;
        const raw = text.slice(start, end);
        const clean = raw.trim();
        const special =
          clean.length === 0 ||
          /<img\b/i.test(clean) ||
          /\[(?:onliner-gallery|tweet|instagram|tiktok)\b[^\]]*]/i.test(clean);
        const head = reader.auto.point(value, start);
        const tail = reader.auto.point(value, end);
        if (!head || !tail) return null;
        const top = head.top;
        const bottom = Math.max(top + head.line, tail.top + tail.line);
        return {
          top,
          bottom,
          center: (top + bottom) * 0.5,
          height: Math.max(head.line, bottom - top),
          special,
        };
      },
      plan(value) {
        if (!value) return;
        if (!reader.auto.mirror) return;
        if (reader.touch() && document.activeElement !== value) return;
        const paragraph = reader.auto.paragraph(value);
        if (!paragraph) return;
        const box = value.clientHeight;
        const line = Math.max(design.surface.reader.auto.minAim, reader.auto.line);
        const center = box * 0.5;
        const delta = paragraph.center - center;
        const distance = Math.abs(delta);
        const deadzone = Math.max(
          line * design.surface.reader.auto.deadzoneLineRatio,
          box * design.surface.reader.auto.deadzoneViewportRatio,
          paragraph.height * design.surface.reader.auto.deadzoneParagraphRatio,
        );
        if (distance <= deadzone) {
          reader.auto.target = null;
          return;
        }
        const half = Math.max(1, box * 0.5);
        const strength = Math.min(1, distance / half);
        const boost = paragraph.special
          ? design.surface.reader.auto.smartShiftBoost
          : 0;
        const shift =
          delta *
          (design.surface.reader.auto.shiftBase +
            strength * design.surface.reader.auto.shiftGain +
            boost);
        reader.auto.target = Math.max(0, value.scrollTop + shift);
        reader.auto.animate(value, reader.auto.target);
        reader.auto.target = null;
      },
      glide(value) {
        if (!reader.desktop()) return;
        if (!value) return;
      },
      queue(value) {
        if (!reader.desktop()) return;
        if (!value) return;
        if (reader.auto.frame) return;
        reader.auto.frame = requestAnimationFrame(() => {
          reader.auto.frame = null;
          reader.auto.plan(value);
        });
      },
    },
    content() {
      return document.querySelector("#content");
    },
    field(selector) {
      if (!selector) return null;
      return document.querySelector(selector);
    },
    fields(selector) {
      if (!selector) return [];
      return [...document.querySelectorAll(selector)];
    },
    fieldValue(selector) {
      const node = reader.field(selector);
      if (!node) return "";
      if ("value" in node) return String(node.value || "");
      return String(node.textContent || "").trim();
    },
    fieldSet(selector, value) {
      const node = reader.field(selector);
      if (!node) return false;
      if ("value" in node) {
        node.value = value;
        node.dispatchEvent(new Event("input", { bubbles: true }));
        node.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
      node.textContent = value;
      return true;
    },
    fieldSetAll(selector, value) {
      const list = reader.fields(selector);
      if (!list.length) return false;
      list.forEach((node) => {
        if ("value" in node) {
          node.value = value;
          node.dispatchEvent(new Event("input", { bubbles: true }));
          node.dispatchEvent(new Event("change", { bubbles: true }));
          return;
        }
        node.textContent = value;
      });
      return true;
    },
    popupLabel(limit, current) {
      const size = `${current.length}${limit ? `/${limit}` : ""}`;
      return `Текущее значение (${size}):`;
    },
    async popupSet({
      title,
      kind = "",
      selector,
      limit = 0,
      get = null,
      set = null,
    }) {
      const read = () =>
        typeof get === "function"
          ? String(get() || "")
          : reader.fieldValue(selector);
      const write = (value) =>
        typeof set === "function"
          ? Boolean(set(value))
          : reader.fieldSet(selector, value);
      const current = read();
      const result = await ui.popup.open({
        title,
        kind,
        value: current,
        limit,
      });
      if (!result) return;
      write(result.value || "");
    },
    async popupField(name, value = {}) {
      const config = reader.popup[name] || {};
      return reader.popupSet({
        title: value.title ?? config.title ?? "",
        kind: value.kind ?? config.kind ?? "",
        selector: value.selector ?? config.selector ?? "",
        limit: value.limit ?? config.limit ?? 0,
        get: value.get ?? null,
        set: value.set ?? null,
      });
    },
    async popupTitles() {
      const label = (item) => {
        if (item.key === "title") return "Заг";
        if (item.key === "favourite") return "Крик";
        if (item.key === "seo") return "SEO";
        if (item.key.startsWith("rotation-")) {
          const index = Number(item.key.replace("rotation-", "") || 1);
          return `Ротация #${index}`;
        }
        return item.label || reader.popup[item.key]?.label || item.title;
      };
      const base = Object.values(reader.popup.titles).map((item) => ({
        ...item,
      }));
      const rotations = [
        ...document.querySelectorAll('input[name="rotation_titles[]"]'),
      ].map((node, index) => ({
        key: `rotation-${index + 1}`,
        title: `rotation_titles[${index + 1}]`,
        label: `Ротация #${index + 1}`,
        limit: 130,
        get: () => String(node.value || ""),
        set: (value) => {
          node.value = value;
          node.dispatchEvent(new Event("input", { bubbles: true }));
          node.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        },
      }));
      const map = base.flatMap((item) => {
        if (item.key !== "rotation") return [item];
        if (!rotations.length) return [item];
        return rotations;
      });
      const visible = map.filter((item) => {
        if (typeof item.get === "function") {
          return String(item.get() || "").trim().length > 0;
        }
        const config = reader.popup[item.key];
        return reader.fieldValue(config.selector).trim().length > 0;
      });
      const list = visible.length ? visible : map;
      const rows = list
        .map((item, index) => {
          const value =
            typeof item.get === "function"
              ? String(item.get() || "")
              : reader.fieldValue(reader.popup[item.key].selector);
          const size = `${value.length}${item.limit ? `/${item.limit}` : ""}`;
          return `${index + 1}. ${label(item)}: ${size}`;
        })
        .join("\n");
      const first = list[0];
      const firstValue =
        typeof first.get === "function"
          ? String(first.get() || "")
          : reader.fieldValue(reader.popup[first.key].selector);
      const result = await ui.popup.open({
        title: `📔 Поля titles\n${rows}`,
        kind: "titles",
        value: firstValue,
        limit: first.limit || 0,
        options: list.map((item) => ({
          value: item.key,
          label: label(item),
          limit: item.limit || 0,
        })),
        pick: first.key,
        values: list.reduce((result, item) => {
          const current =
            typeof item.get === "function"
              ? String(item.get() || "")
              : reader.fieldValue(reader.popup[item.key].selector);
          result[item.key] = current;
          return result;
        }, {}),
      });
      if (!result) return;
      const item = list.find((entry) => entry.key === result.pick) || first;
      const value =
        item.limit > 0
          ? (result.value || "").slice(0, item.limit)
          : result.value || "";
      if (item.set) {
        item.set(value);
        return;
      }
      const selector = reader.popup[item.key]?.selector || "";
      reader.fieldSet(selector, value);
    },
    async popupExcerpt() {
      return reader.popupField("excerpt");
    },
    async popupSlug() {
      return reader.popupField("slug", {
        selector: reader.popup.slug.fullSelector || reader.popup.slug.selector,
        get: () =>
          reader.fieldValue(reader.popup.slug.fullSelector) ||
          reader.fieldValue(reader.popup.slug.selector),
        set: (value) => {
          reader.fieldSetAll(reader.popup.slug.fullSelector, value);
          reader.fieldSetAll(reader.popup.slug.selector, value);
          setTimeout(() => {
            const preview = reader.field(reader.popup.slug.previewSelector);
            const current = String(
              preview?.innerHTML || preview?.textContent || "",
            );
            if (!/hellip|\u2026/i.test(current) && value.length > 28) {
              alert("Slug preview did not update to ellipsis state.");
            }
          }, 120);
          return true;
        },
      });
    },
    post() {
      return document.querySelector("#post_ID")?.value || "unknown";
    },
    key(name) {
      return `reader-content-${reader.post()}-${name}`;
    },
    theme() {
      return localStorage.getItem(reader.key("theme")) || "dark";
    },
    font() {
      const mode = reader.mode();
      const saved = localStorage.getItem(reader.key("font"));
      const fallback = 0;
      const value = saved !== null ? Number(saved || 0) : fallback;
      return reader.fontClamp(value, mode);
    },
    fontBase() {
      const screen = reader.screen();
      const landscape = window.matchMedia("(orientation: landscape)").matches;
      return Math.max(
        16,
        Math.min(screen.width / (landscape ? 42 : 28), landscape ? 18 : 23),
      );
    },
    fontDisplayMin(mode = reader.mode()) {
      return reader.layout.font.display.min[mode] || 14;
    },
    fontDisplayMax() {
      return reader.layout.font.display.max;
    },
    fontRange(mode = reader.mode()) {
      const base = reader.fontBase();
      const min = Math.ceil(reader.fontDisplayMin(mode) - base);
      const max = Math.floor(reader.fontDisplayMax() - base);
      return { min, max: Math.max(min, max) };
    },
    fontClamp(value, mode = reader.mode()) {
      const range = reader.fontRange(mode);
      return Math.max(range.min, Math.min(range.max, Number(value || 0)));
    },
    active() {
      return Boolean(document.getElementById(reader.id));
    },
    screen() {
      return toolbar.screen();
    },
    touch() {
      const agent = navigator.userAgent || "";
      if (/Windows NT/.test(agent)) {
        return false;
      }
      if (
        /iPad|iPhone|iPod/.test(agent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
      ) {
        return true;
      }
      return (
        window.matchMedia?.("(pointer: coarse)")?.matches ||
        navigator.maxTouchPoints > 0
      );
    },
    phone() {
      if (!reader.touch()) return false;
      const screen = reader.screen();
      const short = Math.min(screen.width, screen.height);
      return short < reader.layout.breakpoint.phoneMaxShortEdge;
    },
    tablet() {
      if (!reader.touch()) return false;
      const screen = reader.screen();
      const short = Math.min(screen.width, screen.height);
      return short >= reader.layout.breakpoint.phoneMaxShortEdge;
    },
    desktop() {
      return !reader.touch();
    },
    keyboardOpen() {
      return reader.keyboard() > reader.layout.keyboard.openThreshold;
    },
    interaction() {
      if (!reader.touch()) return "desktop";
      if (reader.keyboardOpen()) return "touch-virtual";
      return "touch-hardware";
    },
    mode() {
      if (reader.desktop()) return "desktop";
      if (reader.phone()) return "phone";
      return "tablet";
    },
    profile() {
      const mode = reader.mode();
      const interaction = reader.interaction();
      const touch = mode !== "desktop";
      const keyboard = interaction === "touch-virtual" ? reader.keyboard() : 0;
      const panelHeight = touch
        ? reader.layout.panel.height.touch
        : reader.layout.panel.height.desktop;
      const touchTop =
        panelHeight +
        reader.layout.padding.top.touchBase +
        reader.layout.padding.top.touchFade +
        Math.max(0, Math.round(reader.screen().offsetTop || 0));
      const topPadding =
        mode === "desktop" ? reader.layout.padding.top.desktop : touchTop;
      return {
        mode,
        interaction,
        touch,
        keyboard,
        padding: {
          top: topPadding,
          side: touch
            ? reader.layout.padding.side.touch
            : reader.layout.padding.side.desktop,
          bottom: touch
            ? keyboard + reader.layout.padding.bottom.touch
            : reader.layout.padding.bottom.desktop,
        },
        panel: {
          height: panelHeight,
          position: {
            left: "0",
            right: "0",
            top: "0",
            bottom: "auto",
          },
        },
      };
    },
    keyboard() {
      if (!window.visualViewport) return 0;
      return Math.max(
        0,
        window.innerHeight -
          window.visualViewport.height -
          window.visualViewport.offsetTop,
      );
    },
    state() {
      return {
        scroll: Number(localStorage.getItem(reader.key("scroll")) || 0),
        start: Number(localStorage.getItem(reader.key("start")) || 0),
        end: Number(localStorage.getItem(reader.key("end")) || 0),
      };
    },
    html() {
      const value = document.querySelector("#content-html");
      if (!value) return;
      if (!window.switchEditors || !window.switchEditors.switchto) return;
      window.switchEditors.switchto(value);
    },
    widgetMeta(string) {
      if (!string) return {};
      try {
        return JSON.parse(string);
      } catch {
        return {};
      }
    },
    widgetRows(rows, meta, marker) {
      if (!Object.keys(meta).length) return rows;
      rows.push(marker, JSON.stringify(meta), "");
      return rows;
    },
    widgetReadableShow(string) {
      const promo = {
        editable: widget.form.promo.editable,
        marker: widget.form.promo.marker,
        tag: widget.tag.promo,
      };
      const vote = {
        editable: widget.form.vote.editable,
        variantEditable: widget.form.vote.variantEditable,
        marker: widget.form.vote.marker,
        tag: widget.tag.vote,
      };
      reader.widgetCache.promo = [];
      const promoText = widget.block.mapJson(
        string,
        promo.tag,
        (full, data) => {
          if (!data) {
            reader.widgetCache.promo.push({});
            return full;
          }
          reader.widgetCache.promo.push(data || {});
          const rows = [`[${promo.tag}]`, ""];
          reader.widgetRows(
            rows,
            widget.frame(data, promo.editable),
            promo.marker.meta,
          );
          if ((data.title || "").trim())
            rows.push(promo.marker.title, data.title || "", "");
          if ((data.text || "").trim())
            rows.push(
              promo.marker.text,
              widget.text.readable(data.text || ""),
              "",
            );
          if ((data.label || "").trim())
            rows.push(promo.marker.label, data.label || "", "");
          rows.push(`[/${promo.tag}]`);
          return rows.join("\n");
        },
      );
      reader.widgetCache.vote = [];
      return widget.block.mapJson(promoText, vote.tag, (full, data) => {
        if (!data) {
          reader.widgetCache.vote.push({});
          return full;
        }
        reader.widgetCache.vote.push(data || {});
        const rows = [`[${vote.tag}]`, ""];
        const variants = data.variants || [];
        reader.widgetRows(
          rows,
          widget.frame(data, vote.editable),
          vote.marker.meta,
        );
        rows.push(vote.marker.variants, "");
        variants.forEach((item, index) => {
          const current = item || {};
          const title = (current.title || "").trim();
          const description = (current.description || "").trim();
          const meta = widget.frame(current, vote.variantEditable);
          if (!title && !description && !Object.keys(meta).length) return;
          rows.push(`${vote.marker.item}${index + 1}`, "");
          reader.widgetRows(rows, meta, vote.marker.meta);
          if (title) rows.push(vote.marker.title, title, "");
          if (description)
            rows.push(
              vote.marker.description,
              widget.text.readable(description),
              "",
            );
        });
        rows.push(`[/${vote.tag}]`);
        return rows.join("\n");
      });
    },
    widgetReadableHide(string) {
      const promo = {
        marker: widget.form.promo.marker,
        tag: widget.tag.promo,
      };
      const vote = {
        marker: widget.form.vote.marker,
        tag: widget.tag.vote,
      };
      let promoIndex = 0;
      const promoText = widget.block.each(string, promo.tag, (full, body) => {
        if (widget.block.jsonBody(body)) return full;
        const base = reader.widgetCache.promo[promoIndex] || {};
        const data = widget.read.markers(body, promo.marker);
        const patch = {};
        if (data.title !== undefined) patch.title = data.title;
        if (data.text !== undefined)
          patch.text = widget.read.raw(widget.text.widget(data.text));
        if (data.label !== undefined) patch.label = data.label;
        promoIndex += 1;
        return widget.block.stringify(
          promo.tag,
          widget.restore(base, reader.widgetMeta(data.meta), patch),
        );
      });
      let voteIndex = 0;
      return widget.block.each(promoText, vote.tag, (full, body) => {
        if (widget.block.jsonBody(body)) return full;
        const base = reader.widgetCache.vote[voteIndex] || {};
        const data = widget.read.vote(body, vote.marker);
        const next = widget.restore(base, data.meta, {});
        const variants = Array.isArray(base.variants)
          ? base.variants.map((item) => ({ ...item }))
          : [];
        data.chunks
          .slice()
          .sort((left, right) => left.index - right.index)
          .forEach((chunk) => {
            if (chunk.index < 0) return;
            if (!variants[chunk.index]) variants[chunk.index] = {};
            const patch = {};
            if (chunk.title.trim()) patch.title = chunk.title.trim();
            if (chunk.description.trim())
              patch.description = widget.read.raw(
                widget.text.widget(chunk.description.trim()),
              );
            variants[chunk.index] = widget.restore(
              variants[chunk.index],
              chunk.meta,
              patch,
            );
          });
        next.variants = variants;
        voteIndex += 1;
        return widget.block.stringify(vote.tag, next);
      });
    },
    widgetViewOn() {
      const value = reader.content();
      if (!value) return;
      if (reader.widgetReadable) return;
      const next = reader.widgetReadableShow(
        widget.decode.raw(value.value, (item) => item),
      );
      if (next !== value.value) value.value = next;
      reader.widgetReadable = true;
    },
    widgetViewOff() {
      const value = reader.content();
      if (!value) return;
      if (!reader.widgetReadable) return;
      value.value = widget.ensure(reader.widgetReadableHide(value.value));
      reader.widgetReadable = false;
    },
    css() {
      return css.reader.text({ theme: reader.theme(), panel: reader.panel });
    },
    installCss() {
      return `
        #reader-button,
        #onliner-reader-button{
          text-decoration:none!important;
          border-bottom-color:transparent!important;
          border-bottom:1px solid transparent!important;
          box-shadow:none!important;
          background:#f0f0f1!important;
          color:#1d2327!important;
        }
        #reader-button:hover,
        #onliner-reader-button:hover{
          background:#f0f0f1!important;
          color:#1d2327!important;
        }
      `;
    },
    style(id, string) {
      const value = document.createElement("style");
      value.id = id;
      value.textContent = string;
      return value;
    },
    save() {
      const value = reader.content();
      if (!value) return;
      localStorage.setItem(reader.key("scroll"), String(value.scrollTop));
      localStorage.setItem(
        reader.key("start"),
        String(value.selectionStart || 0),
      );
      localStorage.setItem(reader.key("end"), String(value.selectionEnd || 0));
    },
    restore() {
      const value = reader.content();
      const state = reader.state();
      if (!value) return;
      value.scrollTop = state.scroll;
      value.setSelectionRange(state.start, state.end);
    },
    snapshot() {
      const value = reader.content();
      if (!value) return;
      if (value.dataset.readerSnapshot) return;
      value.dataset.readerSnapshot = "1";
      value.dataset.readerStyle = value.getAttribute("style") || "";
      value.dataset.readerStyleEmpty =
        value.getAttribute("style") === null ? "1" : "0";
      value.dataset.readerPage = String(window.scrollY);
    },
    reset() {
      const value = reader.content();
      if (!value) return;
      const styleEmpty = value.dataset.readerStyleEmpty;
      const styleValue = value.dataset.readerStyle || "";
      const pageValue = value.dataset.readerPage || "0";
      if (styleEmpty === "1")
        value.removeAttribute("style");
      if (styleEmpty !== "1") value.setAttribute("style", styleValue);
      window.scrollTo(0, Number(pageValue || 0));
      delete value.dataset.readerSnapshot;
      delete value.dataset.readerStyle;
      delete value.dataset.readerStyleEmpty;
      delete value.dataset.readerPage;
    },
    resize() {
      const value = reader.content();
      const panel = document.getElementById(reader.panel);
      const screen = reader.screen();
      if (!value) return;
      reader.auto.sync(value);
      const profile = reader.profile();
      const phone = profile.mode === "phone";
      const landscape = window.matchMedia("(orientation: landscape)").matches;
      const top = screen.offsetTop;
      const height = screen.height;
      const base = reader.fontBase();
      const minDisplay = reader.fontDisplayMin(profile.mode);
      const maxDisplay = reader.fontDisplayMax();
      const size = Math.max(
        minDisplay,
        Math.min(maxDisplay, base + reader.font()),
      );
      value.style.setProperty(
        "left",
        phone ? "-1px" : `${screen.offsetLeft - 1}px`,
        "important",
      );
      value.style.setProperty("top", `${Math.max(0, top - 1)}px`, "important");
      value.style.setProperty(
        "width",
        phone ? "calc(100vw + 2px)" : `${screen.width + 2}px`,
        "important",
      );
      value.style.setProperty("height", `${height + 1}px`, "important");
      value.style.setProperty(
        "padding",
        `${profile.padding.top}px ${profile.padding.side}px ${profile.padding.bottom}px`,
        "important",
      );
      value.style.setProperty("font-size", `${size}px`, "important");
      value.style.setProperty(
        "line-height",
        landscape ? "1.35" : "1.48",
        "important",
      );
      document.documentElement.style.setProperty(
        "--reader-scrollbar-gap",
        `${Math.max(0, value.offsetWidth - value.clientWidth)}px`,
      );
      document.documentElement.style.setProperty(
        "--reader-keyboard-gap",
        `${profile.keyboard}px`,
      );
      document.documentElement.style.setProperty(
        "--reader-toolbar-top-gap",
        `${profile.panel.height + reader.layout.padding.top.touchFade}px`,
      );
      document.documentElement.style.setProperty(
        "--reader-toolbar-bottom-gap",
        "60px",
      );
      if (!panel) return;
      panel.style.setProperty(
        "height",
        `${profile.panel.height}px`,
        "important",
      );
      panel.style.setProperty("left", profile.panel.position.left, "important");
      panel.style.setProperty(
        "right",
        profile.panel.position.right,
        "important",
      );
      panel.style.setProperty("top", profile.panel.position.top, "important");
      panel.style.setProperty(
        "bottom",
        profile.panel.position.bottom,
        "important",
      );
      reader.syncButtons();
    },
    listen(target, type, action, options) {
      target.addEventListener(type, action, options);
      reader.listeners.push({ target, type, action, options });
    },
    unlisten() {
      reader.listeners.forEach(({ target, type, action, options }) =>
        target.removeEventListener(type, action, options),
      );
      reader.listeners = [];
    },
    toggle() {
      const theme = reader.theme() === "dark" ? "light" : "dark";
      const style = document.getElementById(reader.id);
      const button = document.querySelector(
        `#${reader.panel} [data-action="theme"]`,
      );
      const panel = document.getElementById(reader.panel);
      localStorage.setItem(reader.key("theme"), theme);
      if (style) style.textContent = reader.css();
      if (panel) panel.dataset.theme = theme;
      if (button) button.innerHTML = ui.controls.icon(icon.theme(theme));
      reader.fieldsPopupSyncTheme();
      reader.resize();
    },
    size(step) {
      const range = reader.fontRange();
      const current = reader.font();
      const value = Math.max(range.min, Math.min(range.max, current + step));
      if (value === current) {
        reader.syncButtons();
        return;
      }
      reader.fontSet(value);
    },
    fontSet(value) {
      localStorage.setItem(reader.key("font"), String(value));
      reader.resize();
      reader.syncButtons();
    },
    sizeEdge(step) {
      const range = reader.fontRange();
      const value = step < 0 ? range.min : range.max;
      if (reader.font() === value) return;
      reader.fontSet(value);
    },
    editorScriptUrl() {
      const current = document.currentScript;
      const fallback = [...document.querySelectorAll("script[src]")].find(
        (node) => /\/(?:dist\/)?reader\.js(?:\?|$)/.test(node.src),
      );
      const source = current?.src || fallback?.src || "";
      if (!source) return "";
      const url = new URL(source, location.href);
      url.pathname = url.pathname.replace(/reader\.js$/i, "editor.js");
      url.searchParams.set("v", String(Date.now()));
      return url.href;
    },
    editorClose() {
      const active = document.getElementById("editor-panel");
      if (!active) return;
      toolbar.destroy(active);
      active.remove();
      document.getElementById("editor-panel-style")?.remove();
    },
    editorOpen() {
      const active = document.getElementById("editor-panel");
      if (active) return;
      const source = reader.editorScriptUrl();
      if (!source) return;
      const script = document.createElement("script");
      script.src = source;
      (document.head || document.body || document.documentElement).append(
        script,
      );
    },
    async editorToggle() {
      const active = document.getElementById("editor-panel");
      if (active) return reader.editorClose();
      reader.editorOpen();
    },
    syncButtons() {
      const panel = document.getElementById(reader.panel);
      if (!panel) return;
      const smaller = panel.querySelector('[data-action="smaller"]');
      const bigger = panel.querySelector('[data-action="bigger"]');
      const range = reader.fontRange();
      const current = reader.font();
      if (smaller) {
        smaller.dataset.disabled = current <= range.min ? "true" : "false";
        smaller.setAttribute(
          "aria-disabled",
          current <= range.min ? "true" : "false",
        );
      }
      if (bigger) {
        bigger.dataset.disabled = current >= range.max ? "true" : "false";
        bigger.setAttribute(
          "aria-disabled",
          current >= range.max ? "true" : "false",
        );
      }
    },
    fieldsPopupId: "reader-fields-popup",
    fieldsPopupState: {
      mode: "titles",
      theme: "dark",
      dragX: 0,
      dragY: 0,
      lock: null,
      lockPending: false,
      cleanup: [],
      opener: null,
      excerptBase: "",
      excerptLeadBackup: "",
      excerptLeadActive: false,
      excerptLeadSkipReset: false,
      slugCycle: 0,
      counterWidth: "",
      counterShowText: true,
      activeTitleKey: "",
      delivery: {
        hours: "",
        minutes: "",
        date: "",
        left: false,
        right: false,
        visibility: "public",
        update: false,
        timeAction: "time-manual",
        pinAction: "link",
      },
      deliveryDirty: false,
      active: {
        label: "\u0417\u0430\u0433",
        current: 0,
        limit: 105,
      },
    },
    fieldsPopupRules: {
      title: 105,
      rotation: 105,
      favourite: 105,
      seo: 70,
      excerpt: 420,
      slug: 34,
    },
    fieldsPopupButton(action, content, attrs = "") {
      return ui.controls.button({
        action,
        content,
        attrs: ` type="button"${attrs}`,
      });
    },
    fieldsPopupModeItems() {
      return [
        { name: "titles", icon: glyph.titles },
        { name: "excerpt", icon: glyph.excerpt },
        { name: "slug", icon: glyph.slug },
        { name: "delivery", icon: glyph.delivery },
      ];
    },
    fieldsPopupCleanupBind(cleanup) {
      if (typeof cleanup !== "function") return;
      reader.fieldsPopupState.cleanup.push(cleanup);
    },
    fieldsPopupCleanupRun() {
      const list = [...reader.fieldsPopupState.cleanup];
      reader.fieldsPopupState.cleanup = [];
      list.forEach((cleanup) => {
        try {
          cleanup();
        } catch (_) {}
      });
    },
    fieldsPopupFocusMode(popup, mode) {
      const button = popup?.querySelector(
        `[data-action="fields-mode"][data-mode="${mode}"]`,
      );
      if (!button) return;
      button.focus();
    },
    fieldsPopupBindKeyboard(popup) {
      if (!popup) return;
      const onKeydown = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          reader.fieldsPopupClose();
          return;
        }
        if (
          event.key !== "ArrowLeft" &&
          event.key !== "ArrowRight" &&
          event.key !== "Home" &&
          event.key !== "End"
        )
          return;
        const target = event.target;
        if (!(target instanceof Element)) return;
        if (!target.closest('[data-action="fields-mode"]')) return;
        const items = reader.fieldsPopupModeItems();
        if (!items.length) return;
        const mode = target.getAttribute("data-mode") || "";
        const index = items.findIndex((item) => item.name === mode);
        if (index < 0) return;
        let next = index;
        if (event.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
        if (event.key === "ArrowRight") next = (index + 1) % items.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = items.length - 1;
        if (next === index) return;
        event.preventDefault();
        const nextMode = items[next].name;
        reader.fieldsPopupState.mode = nextMode;
        reader.fieldsPopupRender(popup);
        reader.fieldsPopupFocusMode(popup, nextMode);
      };
      popup.addEventListener("keydown", onKeydown);
      reader.fieldsPopupCleanupBind(() => {
        popup.removeEventListener("keydown", onKeydown);
      });
    },
    fieldsPopupTitleItems() {
      const labels = {
        title: "\u0417\u0430\u0433",
        rotation: "\u0420\u043e\u0442\u0430\u0446\u0438\u044f",
        favourite: "\u041a\u0440\u0438\u043a",
      };
      const items = [
        {
          key: "title",
          label: "Заг",
          limit: reader.fieldsPopupRules.title,
          get: () => reader.fieldValue(reader.popup.title.selector),
          set: (value) => reader.fieldSet(reader.popup.title.selector, value),
        },
      ];
      const rotations = [
        ...document.querySelectorAll('input[name="rotation_titles[]"]'),
      ];
      for (let index = 0; index < Math.max(3, rotations.length); index += 1) {
        const node = rotations[index] || null;
        items.push({
          key: `rotation-${index + 1}`,
          label: `Ротация #${index + 1}`,
          limit: reader.fieldsPopupRules.rotation,
          get: () => String(node?.value || ""),
          set: (value) => {
            if (!node) return false;
            node.value = value;
            node.dispatchEvent(new Event("input", { bubbles: true }));
            node.dispatchEvent(new Event("change", { bubbles: true }));
            return true;
          },
        });
      }
      items.push({
        key: "favourite",
        label: "Крик",
        limit: reader.fieldsPopupRules.favourite,
        get: () => reader.fieldValue(reader.popup.favourite.selector),
        set: (value) => reader.fieldSet(reader.popup.favourite.selector, value),
      });
      items.push({
        key: "seo",
        label: "SEO",
        limit: reader.fieldsPopupRules.seo,
        get: () => reader.fieldValue(reader.popup.seo.selector),
        set: (value) => reader.fieldSet(reader.popup.seo.selector, value),
      });
      return items.slice(0, 6);
    },
    fieldsPopupExcerptValue() {
      return reader.fieldValue(reader.popup.excerpt.selector);
    },
    fieldsPopupExcerptSet(value) {
      return reader.fieldSet(reader.popup.excerpt.selector, value);
    },
    fieldsPopupSlugValue() {
      return (
        reader.fieldValue(reader.popup.slug.fullSelector) ||
        reader.fieldValue(reader.popup.slug.selector)
      );
    },
    fieldsPopupSlugSet(value) {
      const text = String(value || "");
      const first = reader.fieldSetAll(reader.popup.slug.fullSelector, text);
      const second = reader.fieldSetAll(reader.popup.slug.selector, text);
      return Boolean(first || second);
    },
    fieldsPopupSlugNormalize(value = "") {
      const map = {
        а: "a",
        б: "b",
        в: "v",
        г: "g",
        д: "d",
        е: "e",
        ё: "e",
        ж: "zh",
        з: "z",
        и: "i",
        й: "y",
        к: "k",
        л: "l",
        м: "m",
        н: "n",
        о: "o",
        п: "p",
        р: "r",
        с: "s",
        т: "t",
        у: "u",
        ф: "f",
        х: "h",
        ц: "ts",
        ч: "ch",
        ш: "sh",
        щ: "sch",
        ъ: "",
        ы: "y",
        ь: "",
        э: "e",
        ю: "yu",
        я: "ya",
      };
      return String(value || "")
        .toLowerCase()
        .split("")
        .map((char) => map[char] ?? char)
        .join("")
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-");
    },
    fieldsPopupSlugSnapshot(value = "") {
      const normalized = reader.fieldsPopupSlugNormalize(value);
      const chars = Array.from(normalized);
      const limit = reader.fieldsPopupRules.slug || 34;
      const willBeCut = chars.length > limit;
      const visible = willBeCut
        ? `${chars.slice(0, 16).join("")}\u2026${chars.slice(-16).join("")}`
        : chars.join("");
      return {
        value: chars.join(""),
        length: chars.length,
        limit,
        willBeCut,
        visible,
      };
    },
    fieldsPopupSlugCommit(value) {
      const text = reader.fieldsPopupSlugNormalize(value);
      const panel = reader.field("#editable-post-name");
      const edit = reader.field("#edit-slug-buttons .edit-slug");
      const save = reader.field("#edit-slug-buttons .save");
      const slugInput = reader.field("#new-post-slug");
      const apply = () => {
        reader.fieldSetAll("#new-post-slug", text);
        reader.fieldSetAll('input[name="post_name"]', text);
        reader.fieldSetAll("#post_name", text);
        reader.fieldSetAll(reader.popup.slug.fullSelector, text);
        reader.fieldSetAll(reader.popup.slug.selector, text);
        if (save && panel && panel.offsetParent !== null) save.click();
      };
      if (edit && (!slugInput || slugInput.offsetParent === null)) {
        edit.click();
        setTimeout(apply, 0);
      } else {
        apply();
      }
      const preview = reader.field(reader.popup.slug.previewSelector);
      if (preview) preview.textContent = text;
      return true;
    },
    async fieldsPopupPhoneEditTitle({ input, item, popup }) {
      const result = await ui.popup.open({
        title: reader.fieldsPopupLabelFix(input.dataset.fieldLabel || "Заг"),
        kind: "",
        value: input.value || "",
        limit: Number(input.dataset.fieldLimit) || 0,
      });
      if (!result) return;
      item.set(result.value || "");
      reader.fieldsPopupRender(popup);
    },
    fieldsPopupSlugCandidates() {
      return reader
        .fieldsPopupTitleItems()
        .map((item) => String(item.get() || "").trim())
        .filter(Boolean);
    },
    fieldsPopupCounter(value, limit = 0) {
      return ui.controls.counter({
        current: String(value || "").length,
        limit: Number(limit) || 0,
        showText: reader.fieldsPopupState.counterShowText !== false,
      });
    },
    fieldsPopupCounterTop() {
      const active = reader.fieldsPopupState.active || {};
      return ui.shell.group(
        ui.controls.counter({
          current: Number(active.current) || 0,
          limit: Number(active.limit) || 0,
          showText: reader.fieldsPopupState.counterShowText !== false,
          classes: "reader-fields-counter-main",
          attrs: active.label
            ? ` data-label="${String(active.label).replace(/"/g, "&quot;")}"`
            : "",
        }),
        { rail: true, classes: "reader-fields-counter-group ui-counter-group" },
      );
    },
    fieldsPopupDeliveryTop() {
      const text = delivery.summaryTop(reader.fieldsPopupState.delivery || {});
      return ui.shell.group(
        `<div class="reader-fields-delivery-top-text" data-field-kind="delivery-summary-top">${icon.emoji(text, "default")}</div>`,
        { rail: true, classes: "reader-fields-counter-group reader-fields-delivery-top-group" },
      );
    },
    fieldsPopupHeaderMain() {
      const mode = reader.fieldsPopupState.mode || "titles";
      if (mode === "delivery") return ui.shell.strip(reader.fieldsPopupDeliveryTop());
      return ui.shell.strip(reader.fieldsPopupCounterTop());
    },
    fieldsPopupDeliveryAction(item = {}) {
      const name = String(item.name || "");
      const content = icon.emoji(item.icon || "", "default");
      return reader.fieldsPopupButton(
        "fields-delivery",
        content,
        ` data-delivery-action="${name}" title="${name}"`,
      );
    },
    fieldsPopupDeliveryApplyState(popup, next = {}) {
      reader.fieldsPopupState.delivery = {
        ...reader.fieldsPopupState.delivery,
        hours: String(next.hours || ""),
        minutes: String(next.minutes || ""),
        date: String(next.date || reader.fieldsPopupState.delivery?.date || ""),
        left: Boolean(next.left),
        right: Boolean(next.right),
        visibility: String(next.visibility || reader.fieldsPopupState.delivery?.visibility || "public"),
        update: Boolean(next.update),
        timeAction: String(next.timeAction || reader.fieldsPopupState.delivery?.timeAction || ""),
        pinAction: String(next.pinAction || reader.fieldsPopupState.delivery?.pinAction || "none"),
      };
      const panel = popup?.querySelector(".panel");
      if (!panel) return;
      const hours = panel.querySelector('input[data-field-kind="delivery-hours"]');
      const minutes = panel.querySelector('input[data-field-kind="delivery-minutes"]');
      if (hours) hours.value = String(reader.fieldsPopupState.delivery.hours || "");
      if (minutes) minutes.value = String(reader.fieldsPopupState.delivery.minutes || "");
      panel
        .querySelectorAll('[data-field-kind="delivery-summary-top"]')
        .forEach((node) => {
          node.innerHTML = icon.emoji(
            delivery.summaryTop(reader.fieldsPopupState.delivery),
            "default",
          );
        });
      reader.fieldsPopupSetActive({
        label: "delivery",
        value: `${reader.fieldsPopupState.delivery.hours}:${reader.fieldsPopupState.delivery.minutes}`,
        limit: 0,
      });
      reader.fieldsPopupSyncCounterNode(popup);
      reader.fieldsPopupState.deliveryDirty = true;
    },
    fieldsPopupDeliveryReadAdmin() {
      const value = (selector) => String(reader.fieldValue(selector) || "");
      const checked = (selector) => Boolean(reader.field(selector)?.checked);
      const byText = (pattern) =>
        reader
          .fields('input[name="visibility"]')
          .find((node) => {
            const id = String(node?.id || "");
            const label = id
              ? document.querySelector(`label[for="${id}"]`)?.textContent || ""
              : node?.parentElement?.textContent || "";
            return pattern.test(String(label || "").toLowerCase());
          }) || null;
      const month = value("#mm").padStart(2, "0");
      const day = value("#jj").padStart(2, "0");
      const year = value("#aa");
      const hours = value("#hh").padStart(2, "0");
      const minutes = value("#mn").padStart(2, "0");
      const hasDate =
        /^\d{2}$/u.test(month) &&
        /^\d{2}$/u.test(day) &&
        /^\d{4}$/u.test(year);
      const date = hasDate ? `${year}-${month}-${day}` : "";
      const left = checked('input[name="sticky"][value="left"]');
      const right = checked('input[name="sticky"][value="right"]');
      const update = checked("#updated");
      const visibilityLink =
        Boolean(byText(/доступно по ссылке/u)?.checked) ||
        checked("#visibility-radio-private");
      return {
        ...reader.fieldsPopupState.delivery,
        hours: /^\d{2}$/u.test(hours) ? hours : "",
        minutes: /^\d{2}$/u.test(minutes) ? minutes : "",
        date,
        left,
        right,
        visibility: visibilityLink ? "link" : "public",
        update,
        pinAction: left ? "pin-left" : right ? "pin-right" : "none",
      };
    },
    fieldsPopupDeliverySyncFromAdmin() {
      reader.fieldsPopupState.delivery = reader.fieldsPopupDeliveryReadAdmin();
      if (!reader.fieldsPopupState.delivery.timeAction) {
        reader.fieldsPopupState.delivery.timeAction = "time-manual";
      }
      reader.fieldsPopupState.deliveryDirty = false;
    },
    fieldsPopupDeliveryApplyAdmin() {
      const state = reader.fieldsPopupState.delivery || {};
      const click = (node) => node?.click?.();
      const setChecked = (selector, value) => {
        const node = reader.field(selector);
        if (!node || !("checked" in node)) return;
        if (node.checked !== Boolean(value)) click(node);
        node.checked = Boolean(value);
        node.dispatchEvent(new Event("input", { bubbles: true }));
        node.dispatchEvent(new Event("change", { bubbles: true }));
      };
      const visibilityLinkNode =
        reader
          .fields('input[name="visibility"]')
          .find((node) => {
            const id = String(node?.id || "");
            const label = id
              ? document.querySelector(`label[for="${id}"]`)?.textContent || ""
              : node?.parentElement?.textContent || "";
            return /доступно по ссылке/u.test(String(label || "").toLowerCase());
          }) ||
        reader.field("#visibility-radio-private") ||
        null;
      click(reader.field(".edit-visibility"));
      setChecked("#visibility-radio-public", state.visibility !== "link");
      if (visibilityLinkNode) {
        if (visibilityLinkNode.id) {
          setChecked(`#${visibilityLinkNode.id}`, state.visibility === "link");
        } else {
          if (visibilityLinkNode.checked !== Boolean(state.visibility === "link")) {
            click(visibilityLinkNode);
          }
        }
      }
      if (state.left) {
        setChecked('input[name="sticky"][value="left"]', true);
      } else if (state.right) {
        setChecked('input[name="sticky"][value="right"]', true);
      } else {
        const reset =
          reader.field('input[name="sticky"][value="none"]') ||
          reader.field('input[name="sticky"][value=""]') ||
          reader
            .fields('input[name="sticky"]')
            .find(
              (node) =>
                String(node?.value || "").toLowerCase() !== "left" &&
                String(node?.value || "").toLowerCase() !== "right",
          );
        if (reset) setChecked(`input[name="sticky"][value="${String(reset.value || "")}"]`, true);
      }
      setChecked("#updated", Boolean(state.update));
      click(reader.field(".save-post-visibility"));
      const schedule = delivery.schedule(state);
      if (!schedule) return;
      click(reader.field(".edit-timestamp"));
      const pairs = [
        ["#mm", schedule.month],
        ["#jj", schedule.day],
        ["#aa", schedule.year],
        ["#hh", schedule.hours],
        ["#mn", schedule.minutes],
      ];
      pairs.forEach(([selector, value]) => {
        reader.fieldSet(selector, value);
      });
      click(reader.field(".save-timestamp"));
      reader.fieldsPopupState.deliveryDirty = false;
    },
    fieldsPopupSetActive({ label = "", value = "", limit = 0 } = {}) {
      reader.fieldsPopupState.active = {
        label: reader.fieldsPopupLabelFix(String(label || "")),
        current: Array.from(String(value || "")).length,
        limit: Number(limit) || 0,
      };
    },
    fieldsPopupLabelFix(value = "") {
      const raw = String(value || "");
      const mojibake = [...raw].some((char) => {
        const code = char.charCodeAt(0);
        return code === 208 || code === 209;
      });
      if (!mojibake) return raw;
      try {
        return decodeURIComponent(escape(raw));
      } catch (_) {
        return raw;
      }
    },
    fieldsPopupHtml(value = "") {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    },
    fieldsPopupTokens(value = "") {
      const text = String(value || "");
      try {
        return text.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]+/gu) || [text];
      } catch (_) {
        return text.match(/\s+|[^\s]+/g) || [text];
      }
    },
    fieldsPopupDiffHtml(before = "", after = "") {
      const left = reader.fieldsPopupTokens(before);
      const right = reader.fieldsPopupTokens(after);
      if (left.join("") === right.join(""))
        return reader.fieldsPopupHtml(left.join(""));
      const rows = left.length + 1;
      const cols = right.length + 1;
      const dp = Array.from({ length: rows }, () => new Array(cols).fill(0));
      for (let i = 1; i < rows; i += 1) {
        for (let j = 1; j < cols; j += 1) {
          if (left[i - 1] === right[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1] + 1;
          } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          }
        }
      }
      const chunks = [];
      let i = left.length;
      let j = right.length;
      while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && left[i - 1] === right[j - 1]) {
          chunks.push({ kind: "same", value: left[i - 1] });
          i -= 1;
          j -= 1;
          continue;
        }
        if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
          chunks.push({ kind: "add", value: right[j - 1] });
          j -= 1;
          continue;
        }
        if (i > 0) {
          chunks.push({ kind: "del", value: left[i - 1] });
          i -= 1;
        }
      }
      const ordered = chunks.reverse();
      const merged = ordered.reduce((result, item) => {
        const last = result[result.length - 1];
        if (last && last.kind === item.kind) {
          last.value += item.value;
          return result;
        }
        result.push({ ...item });
        return result;
      }, []);
      const refineChars = (oldText = "", newText = "") => {
        const oldChars = [...String(oldText || "")];
        const newChars = [...String(newText || "")];
        const rows = oldChars.length + 1;
        const cols = newChars.length + 1;
        const dp = Array.from({ length: rows }, () => new Array(cols).fill(0));
        for (let a = 1; a < rows; a += 1) {
          for (let b = 1; b < cols; b += 1) {
            if (oldChars[a - 1] === newChars[b - 1]) {
              dp[a][b] = dp[a - 1][b - 1] + 1;
            } else {
              dp[a][b] = Math.max(dp[a - 1][b], dp[a][b - 1]);
            }
          }
        }
        const stack = [];
        let a = oldChars.length;
        let b = newChars.length;
        while (a > 0 || b > 0) {
          if (a > 0 && b > 0 && oldChars[a - 1] === newChars[b - 1]) {
            stack.push({ kind: "same", value: oldChars[a - 1] });
            a -= 1;
            b -= 1;
            continue;
          }
          if (b > 0 && (a === 0 || dp[a][b - 1] >= dp[a - 1][b])) {
            stack.push({ kind: "add", value: newChars[b - 1] });
            b -= 1;
            continue;
          }
          if (a > 0) {
            stack.push({ kind: "del", value: oldChars[a - 1] });
            a -= 1;
          }
        }
        const run = stack.reverse().reduce((result, item) => {
          const last = result[result.length - 1];
          if (last && last.kind === item.kind) {
            last.value += item.value;
            return result;
          }
          result.push({ ...item });
          return result;
        }, []);
        return run
          .map((item) => {
            const value = reader.fieldsPopupHtml(item.value);
            if (item.kind === "add") {
              return `<mark class="reader-diff reader-diff-add reader-diff-char-add">${value}</mark>`;
            }
            if (item.kind === "del") {
              return `<mark class="reader-diff reader-diff-del reader-diff-char-del">${value}</mark>`;
            }
            return value;
          })
          .join("");
      };
      return merged
        .map((item, index) => {
          if (item.kind === "del") {
            const next = merged[index + 1];
            if (next?.kind === "add") {
              return `<span class="reader-diff-pair">${refineChars(item.value, next.value)}</span>`;
            }
          }
          if (item.kind === "add") {
            const prev = merged[index - 1];
            if (prev?.kind === "del") return "";
          }
          const value = reader.fieldsPopupHtml(item.value);
          if (item.kind === "add") {
            return `<mark class="reader-diff reader-diff-add">${value}</mark>`;
          }
          if (item.kind === "del") {
            return `<mark class="reader-diff reader-diff-del">${value}</mark>`;
          }
          return value;
        })
        .join("");
    },
    fieldsPopupSyncCounterNode(popup) {
      const panel = popup?.querySelector(".panel");
      const node = panel?.querySelector(".reader-fields-counter-main");
      if (!node) return;
      node.setAttribute(
        "data-show-text",
        reader.fieldsPopupState.counterShowText !== false ? "true" : "false",
      );
      const active = reader.fieldsPopupState.active || {};
      ui.controls.counterSync(node, {
        current: Number(active.current) || 0,
        limit: Number(active.limit) || 0,
        label: active.label || "",
      });
    },
    fieldsPopupBodyTitles() {
      return reader
        .fieldsPopupTitleItems()
        .map((item) => {
          const value = String(item.get() || "");
          return `
            <div class="reader-fields-row">
              <input class="reader-fields-input" data-field-kind="title" data-field-key="${item.key}" data-field-label="${item.label}" data-field-limit="${Number(item.limit) || 0}" type="text" placeholder="${item.label}" value="${String(value).replace(/"/g, "&quot;")}">
            </div>
          `;
        })
        .join("");
    },
    fieldsPopupBodyExcerpt() {
      const value = reader.fieldsPopupExcerptValue();
      const limit = reader.fieldsPopupRules.excerpt || 0;
      return `
        <div class="reader-fields-row">
          <div class="reader-fields-label">Цитата</div>
          <textarea class="reader-fields-input" data-field-kind="excerpt" data-field-label="Цитата" data-field-limit="${limit}" data-multiline="true" placeholder="Цитата">${String(value || "")}</textarea>
          ${reader.fieldsPopupCounter(value, limit)}
        </div>
        <div class="reader-fields-row reader-fields-row--delivery">
          <div class="reader-fields-preview reader-fields-preview--slug-live reader-fields-static" data-field-kind="delivery-summary">${delivery.summary(state)}</div>
        </div>
      `;
    },
    fieldsPopupBodySlug() {
      const value = reader.fieldsPopupSlugValue();
      const limit = reader.popup.slug.limit || 0;
      return `
        <div class="reader-fields-row">
          <div class="reader-fields-label">Slug (текущее)</div>
          <div class="reader-fields-preview">${String(value || "")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")}</div>
          ${reader.fieldsPopupCounter(value, limit)}
        </div>
      `;
    },
    fieldsPopupBody(mode) {
      if (mode === "titles") return reader.fieldsPopupBodyTitlesPlain();
      if (mode === "excerpt") return reader.fieldsPopupBodyExcerptPlain();
      if (mode === "delivery") return reader.fieldsPopupBodyDeliveryPlain();
      return reader.fieldsPopupBodySlugPlain();
    },
    fieldsPopupBodyDeliveryPlain() {
      const state = reader.fieldsPopupState.delivery || {};
      const hours = String(state.hours || "");
      const minutes = String(state.minutes || "");
      const groups = delivery.actions.groups();
      const actions = (kind = "") =>
        (groups.find((group) => group.kind === kind)?.items || [])
          .map((item) => reader.fieldsPopupDeliveryAction(item))
          .join("");
      return `
        <div class="reader-fields-row reader-fields-row--delivery reader-fields-row--delivery-grid">
          <div class="reader-fields-delivery-capsule">
            <div class="reader-fields-delivery-actions reader-fields-delivery-actions--time">${actions("time")}</div>
          </div>
          <div class="reader-fields-delivery-capsule">
            <div class="reader-fields-delivery-time">
              <input class="reader-fields-input reader-fields-input--delivery-time" data-field-kind="delivery-hours" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" placeholder="hh" value="${hours.replace(/"/g, "&quot;")}">
              <span class="reader-fields-delivery-sep">:</span>
              <input class="reader-fields-input reader-fields-input--delivery-time" data-field-kind="delivery-minutes" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" placeholder="mm" value="${minutes.replace(/"/g, "&quot;")}">
            </div>
          </div>
          <div class="reader-fields-delivery-capsule">
            <div class="reader-fields-delivery-actions">${actions("options")}</div>
          </div>
        </div>
      `;
    },
    fieldsPopupBodyTitlesPlain() {
      return reader
        .fieldsPopupTitleItems()
        .map((item) => {
          const value = String(item.get() || "");
          const limit = Number(item.limit) || 0;
          return `
            <div class="reader-fields-row">
              <input class="reader-fields-input" data-field-kind="title" data-field-key="${item.key}" data-field-label="${reader.fieldsPopupLabelFix(item.label)}" data-field-limit="${limit}" type="text" placeholder="${reader.fieldsPopupLabelFix(item.label)}" value="${String(value).replace(/"/g, "&quot;")}">
            </div>
          `;
        })
        .join("");
    },
    fieldsPopupBodyExcerptPlain() {
      const value = reader.fieldsPopupExcerptValue();
      const base = String(reader.fieldsPopupState.excerptBase || "");
      const limit = reader.fieldsPopupRules.excerpt || 0;
      const diff = reader.fieldsPopupDiffHtml(base, value);
      return `
        <div class="reader-fields-row">
          <div class="reader-fields-excerpt-frame">
            <textarea class="reader-fields-input reader-fields-input--excerpt reader-fields-input--excerpt-plain" data-field-kind="excerpt" data-field-label="\u0426\u0438\u0442\u0430\u0442\u0430" data-field-limit="${limit}" data-multiline="true" placeholder="\u0426\u0438\u0442\u0430\u0442\u0430">${String(value || "")}</textarea>
            <div class="reader-fields-excerpt-divider"><button class="reader-fields-excerpt-divider-mark" type="button" data-action="fields-excerpt-lead" title="Подставить лид">${icon.emoji("\u{1F504}", "default")}</button></div>
            <div class="reader-fields-preview reader-fields-preview--readonly reader-fields-preview--excerpt-plain reader-fields-static" data-field-kind="excerpt-current">${diff}</div>
          </div>
        </div>
      `;
    },
    fieldsPopupBodySlugPlain() {
      const value = reader.fieldsPopupSlugValue();
      const limit = reader.fieldsPopupRules.slug || 0;
      const snap = reader.fieldsPopupSlugSnapshot(value);
      const cycle = ui.controls.button({
        action: "fields-slug-cycle",
        content: icon.emoji("\u{1F504}", "default"),
        attrs:
          ' type="button" title="\u0426\u0438\u043a\u043b \u0437\u0430\u0433\u043e\u043b\u043e\u0432\u043a\u043e\u0432"',
      });
      return `
        <div class="reader-fields-row">
          <input class="reader-fields-input reader-fields-input--slug" data-field-kind="slug" data-field-label="\u0421\u043b\u0430\u0433" data-field-limit="${limit}" type="text" placeholder="\u0421\u043b\u0430\u0433" value="${String(value).replace(/"/g, "&quot;")}">
        </div>
        <div class="reader-fields-row reader-fields-row--slug-cycle">
          <div class="reader-fields-slug-cycle">${cycle}</div>
        </div>
        <div class="reader-fields-row">
          <div class="reader-fields-preview reader-fields-preview--slug-live reader-fields-static" data-field-kind="slug-live" title="${snap.value}">${reader.fieldsPopupHtml(snap.visible)}</div>
        </div>
      `;
    },
    fieldsPopupBuild() {
      const mode = reader.fieldsPopupState.mode || "titles";
      const left = ui.shell.group(
        reader
          .fieldsPopupModeItems()
          .map((item) =>
            reader.fieldsPopupButton(
              "fields-mode",
              icon.emoji(item.icon, "default"),
              ` data-mode="${item.name}"${mode === item.name ? ' data-active="true"' : ""}`,
            ),
          )
          .join(""),
        { rail: true, classes: "reader-fields-modes" },
      );
      const main = reader.fieldsPopupHeaderMain();
      const theme = reader.fieldsPopupState.theme || reader.theme();
      const right = ui.shell.group(
        `${reader.fieldsPopupButton("fields-theme", icon.theme(theme))}${reader.fieldsPopupButton("fields-close", icon.emoji(glyph.exit, "default"))}`,
        { rail: true, stick: "right", classes: "reader-fields-system" },
      );
      return `
        ${ui.shell.shell({ left, main, right, attrs: ' data-fields-header="true"' })}
        <div data-fields-body data-mode="${mode}">${reader.fieldsPopupBody(mode)}</div>
      `;
    },
    fieldsPopupRender(popup, { focusTitleKey = "" } = {}) {
      const node = popup?.querySelector(".panel");
      if (!node) return;
      node.innerHTML = reader.fieldsPopupBuild();
      reader.fieldsPopupBindFields(popup, { focusTitleKey });
      reader.fieldsPopupBindDrag(popup);
      reader.fieldsPopupLockSize(node);
      reader.fieldsPopupSyncHeaderWidths(popup);
    },
    fieldsPopupSyncHeaderWidths(popup) {
      const panel = popup?.querySelector(".panel");
      const shell = panel?.querySelector('[data-fields-header="true"]');
      const left = panel?.querySelector(".reader-fields-modes");
      const right = panel?.querySelector(".reader-fields-system");
      const counter = panel?.querySelector(".reader-fields-counter-group");
      if (!panel || !shell || !left || !right || !counter) return;
      if (popup?.dataset?.mode === "phone") {
        counter.style.removeProperty("--reader-fields-counter-width");
        return;
      }
      const style = getComputedStyle(shell);
      const gap = Number.parseFloat(style.gap || style.columnGap || "0") || 0;
      const leftWidth = Math.ceil(left.getBoundingClientRect().width);
      const rightWidth = Math.ceil(right.getBoundingClientRect().width);
      if (!leftWidth || !rightWidth) return;
      const width = leftWidth + rightWidth + Math.ceil(gap);
      reader.fieldsPopupState.counterWidth = `${width}px`;
      counter.style.setProperty("--reader-fields-counter-width", `${width}px`);
      requestAnimationFrame(() => {
        if (!panel.isConnected) return;
        const nextLeft = Math.ceil(left.getBoundingClientRect().width);
        const nextRight = Math.ceil(right.getBoundingClientRect().width);
        if (!nextLeft || !nextRight) return;
        const next = nextLeft + nextRight + Math.ceil(gap);
        if (next === width) return;
        reader.fieldsPopupState.counterWidth = `${next}px`;
        counter.style.setProperty("--reader-fields-counter-width", `${next}px`);
      });
    },
    fieldsPopupLockSize(panel) {
      if (!panel) return;
      if (reader.fieldsPopupState.lock) {
        ui.surface.lock.apply(panel, reader.fieldsPopupState.lock);
        return;
      }
      if (reader.fieldsPopupState.lockPending) return;
      reader.fieldsPopupState.lockPending = true;
      requestAnimationFrame(() => {
        reader.fieldsPopupState.lockPending = false;
        if (!panel.isConnected || reader.fieldsPopupState.lock) return;
        const lock = ui.surface.lock.measure(panel, {
          bodySelector: "[data-fields-body]",
          minWidth: 420,
          minHeight: 140,
          minBodyHeight: 60,
        });
        if (!lock) return;
        reader.fieldsPopupState.lock = lock;
        ui.surface.lock.apply(panel, lock);
        const popup = panel.closest(`#${reader.fieldsPopupId}`);
        if (popup) reader.fieldsPopupSyncHeaderWidths(popup);
      });
    },
    fieldsPopupBindFields(popup, { focusTitleKey = "" } = {}) {
      const panel = popup?.querySelector(".panel");
      if (!panel) return;
      const mode = reader.fieldsPopupState.mode || "titles";
      if (mode === "titles") {
        const onPhone = reader.phone();
        const dict = Object.fromEntries(
          reader.fieldsPopupTitleItems().map((item) => [item.key, item]),
        );
        panel
          .querySelectorAll('input[data-field-kind="title"]')
          .forEach((input) => {
            const key = input.dataset.fieldKey || "";
            const item = dict[key];
            if (onPhone) {
              input.addEventListener("pointerdown", (event) => {
                event.preventDefault();
                if (!item) return;
                reader.fieldsPopupPhoneEditTitle({ input, item, popup });
              });
              return;
            }
            const sync = () =>
              reader.fieldsPopupSetActive({
                label: input.dataset.fieldLabel || "",
                value: input.value || "",
                limit: Number(input.dataset.fieldLimit) || 0,
              });
            input.addEventListener("focus", () => {
              reader.fieldsPopupState.activeTitleKey = key || "";
              sync();
              reader.fieldsPopupSyncCounterNode(popup);
            });
            input.addEventListener("input", () => {
              if (!item) return;
              reader.fieldsPopupState.activeTitleKey = key || "";
              item.set(input.value || "");
              sync();
              reader.fieldsPopupSyncCounterNode(popup);
            });
          });
        const key = focusTitleKey || reader.fieldsPopupState.activeTitleKey || "";
        const selected =
          panel.querySelector(`input[data-field-kind="title"][data-field-key="${key}"]`) ||
          panel.querySelector('input[data-field-kind="title"]');
        if (selected) {
          reader.fieldsPopupState.activeTitleKey =
            selected.dataset.fieldKey || "";
          reader.fieldsPopupSetActive({
            label: selected.dataset.fieldLabel || "",
            value: selected.value || "",
            limit: Number(selected.dataset.fieldLimit) || 0,
          });
          reader.fieldsPopupSyncCounterNode(popup);
          if (focusTitleKey && !onPhone) selected.focus();
        }
      }
      if (mode === "excerpt") {
        const input = panel.querySelector(
          'textarea[data-field-kind="excerpt"]',
        );
        if (!input) return;
        const sync = () =>
          reader.fieldsPopupSetActive({
            label: input.dataset.fieldLabel || "Цитата",
            value: input.value || "",
            limit: Number(input.dataset.fieldLimit) || 0,
          });
        input.addEventListener("focus", () => {
          sync();
          reader.fieldsPopupSyncCounterNode(popup);
        });
        input.addEventListener("input", () => {
          if (!reader.fieldsPopupState.excerptLeadSkipReset) {
            reader.fieldsPopupState.excerptLeadBackup = "";
            reader.fieldsPopupState.excerptLeadActive = false;
          }
          reader.fieldsPopupExcerptSet(input.value || "");
          const current = panel.querySelector(
            '[data-field-kind="excerpt-current"]',
          );
          if (current) {
            current.innerHTML = reader.fieldsPopupDiffHtml(
              reader.fieldsPopupState.excerptBase || "",
              input.value || "",
            );
          }
          sync();
          reader.fieldsPopupSyncCounterNode(popup);
        });
        sync();
        reader.fieldsPopupSyncCounterNode(popup);
      }
      if (mode === "slug") {
        const input = panel.querySelector('input[data-field-kind="slug"]');
        if (!input) return;
        const sync = () =>
          (() => {
            const snap = reader.fieldsPopupSlugSnapshot(input.value || "");
            return reader.fieldsPopupSetActive({
              label: input.dataset.fieldLabel || "\u0421\u043b\u0430\u0433",
              value: snap.value,
              limit: Number(input.dataset.fieldLimit) || snap.limit || 0,
            });
          })();
        input.addEventListener("focus", () => {
          sync();
          reader.fieldsPopupSyncCounterNode(popup);
        });
        input.addEventListener("input", () => {
          const snap = reader.fieldsPopupSlugSnapshot(input.value || "");
          reader.fieldsPopupSlugSet(snap.value);
          const live = panel.querySelector('[data-field-kind="slug-live"]');
          if (live) {
            live.textContent = snap.visible;
            live.setAttribute("title", snap.value);
          }
          sync();
          reader.fieldsPopupSyncCounterNode(popup);
        });
        input.addEventListener("blur", () => {
          reader.fieldsPopupSlugCommit(input.value || "");
        });
        sync();
        reader.fieldsPopupSyncCounterNode(popup);
      }
      if (mode === "delivery") {
        const hours = panel.querySelector(
          'input[data-field-kind="delivery-hours"]',
        );
        const minutes = panel.querySelector(
          'input[data-field-kind="delivery-minutes"]',
        );
        const sync = () => {
          const normalize = (value = "", max = 23) => {
            const digits = String(value || "").replace(/\D+/g, "").slice(0, 2);
            if (!digits) return "";
            const number = Math.min(max, Number(digits));
            if (!Number.isFinite(number)) return "";
            return String(number).padStart(2, "0");
          };
          const h = normalize(hours?.value || "", 23);
          const m = normalize(minutes?.value || "", 59);
          if (hours && hours.value !== h && h) hours.value = h;
          if (minutes && minutes.value !== m && m) minutes.value = m;
          reader.fieldsPopupState.delivery = {
            ...reader.fieldsPopupState.delivery,
            hours: h,
            minutes: m,
            date: "",
            timeAction: "time-manual",
          };
          panel
            .querySelectorAll('[data-field-kind="delivery-summary-top"]')
            .forEach((node) => {
              node.innerHTML = icon.emoji(
                delivery.summaryTop(reader.fieldsPopupState.delivery),
                "default",
              );
            });
          reader.fieldsPopupSetActive({
            label: "delivery",
            value: `${h}:${m}`,
            limit: 0,
          });
          reader.fieldsPopupSyncCounterNode(popup);
          reader.fieldsPopupState.deliveryDirty = true;
        };
        [hours, minutes].forEach((input) => {
          if (!input) return;
          input.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
            event.preventDefault();
            const max =
              input.getAttribute("data-field-kind") === "delivery-hours" ? 23 : 59;
            const step = event.key === "ArrowUp" ? 1 : -1;
            const raw = String(input.value || "").replace(/\D+/g, "");
            const current = Number(raw || "0");
            const next = ((current + step) % (max + 1) + (max + 1)) % (max + 1);
            input.value = String(next).padStart(2, "0");
            sync();
          });
          input.addEventListener("focus", sync);
          input.addEventListener("input", sync);
        });
        sync();
      }
    },
    fieldsPopupBindDrag(popup) {
      if (!popup || popup.dataset.mode === "phone") return;
      const panel = popup.querySelector(".panel");
      const header = panel?.querySelector('[data-fields-header="true"]');
      if (!panel || !header) return;
      let drag = null;
      panel.style.userSelect = "none";
      const apply = () => {
        panel.style.transform = `translate(${reader.fieldsPopupState.dragX}px, ${reader.fieldsPopupState.dragY}px)`;
      };
      const move = (event) => {
        if (!drag) return;
        const x = event.clientX - drag.startX;
        const y = event.clientY - drag.startY;
        reader.fieldsPopupState.dragX = drag.baseX + x;
        reader.fieldsPopupState.dragY = drag.baseY + y;
        apply();
      };
      const up = () => {
        if (!drag) return;
        drag = null;
        popup.dataset.dragging = "false";
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      panel.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        const target = event.target;
        if (!(target instanceof Element)) return;
        if (target.closest("[data-fields-body]")) return;
        if (
          target.closest("[data-action],button,input,textarea,select,a,label")
        )
          return;
        if (target.closest(".ui-counter-pill")) return;
        drag = {
          startX: event.clientX,
          startY: event.clientY,
          baseX: reader.fieldsPopupState.dragX || 0,
          baseY: reader.fieldsPopupState.dragY || 0,
        };
        event.preventDefault();
        popup.dataset.dragging = "true";
        window.addEventListener("pointermove", move, { passive: true });
        window.addEventListener("pointerup", up, { passive: true });
      });
      reader.fieldsPopupCleanupBind(() => {
        drag = null;
        popup.dataset.dragging = "false";
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      });
      apply();
    },
    fieldsPopupClose() {
      if (reader.fieldsPopupState.deliveryDirty) {
        reader.fieldsPopupDeliveryApplyAdmin();
      }
      reader.fieldsPopupCleanupRun();
      document.getElementById(reader.fieldsPopupId)?.remove();
      const opener = reader.fieldsPopupState.opener;
      if (opener?.isConnected) opener.focus();
      reader.fieldsPopupState.opener = null;
    },
    fieldsPopupIsOpen() {
      return Boolean(document.getElementById(reader.fieldsPopupId));
    },
    fieldsPopupSyncTheme() {
      const popup = document.getElementById(reader.fieldsPopupId);
      const panel = popup?.querySelector(".panel");
      const focusTitleKey =
        popup
          ?.querySelector('input[data-field-kind="title"]:focus')
          ?.dataset?.fieldKey || "";
      if (panel) {
        ui.surface.sync(panel, {
          layout: "fullscreen",
          theme: reader.fieldsPopupState.theme || "dark",
          surface: "toolbar",
        });
      }
      if (popup) reader.fieldsPopupRender(popup, { focusTitleKey });
    },
    fieldsPopupOpen() {
      reader.fieldsPopupClose();
      panel.mount("reader-fields-popup-style", css.ui.popup());
      reader.fieldsPopupState.opener = document.activeElement;
      const phone = reader.phone();
      reader.fieldsPopupState.theme = reader.theme();
      reader.fieldsPopupState.lock = null;
      reader.fieldsPopupState.lockPending = false;
      reader.fieldsPopupState.cleanup = [];
      reader.fieldsPopupState.counterWidth = "";
      reader.fieldsPopupState.excerptBase = reader.fieldsPopupExcerptValue();
      reader.fieldsPopupDeliverySyncFromAdmin();
      const popup = document.createElement("div");
      popup.id = reader.fieldsPopupId;
      popup.dataset.mode = phone ? "phone" : "desktop";
      popup.tabIndex = -1;
      const node = document.createElement("div");
      node.className = "panel";
      node.dataset.uiFrame = "capsule";
      node.dataset.toolbarFlow = "single-row";
      node.dataset.dock = "floating";
      node.dataset.dockTarget = "floating";
      node.style.pointerEvents = "auto";
      ui.surface.sync(node, {
        layout: "fullscreen",
        theme: reader.fieldsPopupState.theme,
        surface: "toolbar",
      });
      popup.appendChild(node);
      document.body.appendChild(popup);
      reader.fieldsPopupBindKeyboard(popup);
      const counterToggle = (event) => {
        const node = event.target.closest(".ui-counter-pill");
        if (!node || !popup.contains(node)) return;
        event.preventDefault();
        reader.fieldsPopupState.counterShowText =
          !reader.fieldsPopupState.counterShowText;
        popup
          .querySelectorAll(".ui-counter-pill")
          .forEach((counter) =>
            counter.setAttribute(
              "data-show-text",
              reader.fieldsPopupState.counterShowText ? "true" : "false",
            ),
          );
      };
      popup.addEventListener("click", counterToggle);
      reader.fieldsPopupCleanupBind(() => {
        popup.removeEventListener("click", counterToggle);
      });
      reader.fieldsPopupRender(popup);
      popup.focus();
      toolbar.behavior.actions({
        panel: popup,
        root: popup,
        action: ({ name, button }) => {
          if (name === "fields-close") return reader.fieldsPopupClose();
          if (name === "fields-theme") {
            reader.fieldsPopupState.theme =
              (reader.fieldsPopupState.theme || "dark") === "dark"
                ? "light"
                : "dark";
            return reader.fieldsPopupSyncTheme();
          }
          if (name === "fields-mode") {
            const mode = button?.dataset?.mode || "titles";
            if (mode === "delivery") reader.fieldsPopupDeliverySyncFromAdmin();
            reader.fieldsPopupState.mode = mode;
            return reader.fieldsPopupRender(popup);
          }
          if (name === "fields-slug-cycle") {
            if ((reader.fieldsPopupState.mode || "titles") !== "slug") return;
            const list = reader.fieldsPopupSlugCandidates();
            if (!list.length) return;
            const next = reader.fieldsPopupState.slugCycle % list.length;
            reader.fieldsPopupState.slugCycle += 1;
            const value = list[next];
            const input = popup.querySelector('input[data-field-kind="slug"]');
            if (!input) return;
            input.value = value;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            reader.fieldsPopupSlugCommit(value);
            input.focus();
          }
          if (name === "fields-excerpt-lead") {
            if ((reader.fieldsPopupState.mode || "titles") !== "excerpt") return;
            const input = popup.querySelector('textarea[data-field-kind="excerpt"]');
            if (!input) return;
            if (reader.fieldsPopupState.excerptLeadActive) {
              const restore = String(reader.fieldsPopupState.excerptLeadBackup || "");
              reader.fieldsPopupState.excerptLeadSkipReset = true;
              input.value = restore;
              input.dispatchEvent(new Event("input", { bubbles: true }));
              reader.fieldsPopupState.excerptLeadSkipReset = false;
              reader.fieldsPopupState.excerptLeadBackup = "";
              reader.fieldsPopupState.excerptLeadActive = false;
              return;
            }
            const currentValue = String(input.value || "");
            const lead = excerpt.lead(reader.fieldValue("#content"));
            reader.fieldsPopupState.excerptLeadBackup = currentValue;
            reader.fieldsPopupState.excerptLeadActive = true;
            reader.fieldsPopupState.excerptLeadSkipReset = true;
            input.value = lead;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            reader.fieldsPopupState.excerptLeadSkipReset = false;
          }
          if (name === "fields-delivery") {
            if ((reader.fieldsPopupState.mode || "titles") !== "delivery") return;
            const action = button?.dataset?.deliveryAction || "";
            const state = {
              ...reader.fieldsPopupState.delivery,
            };
            const next = delivery.preset(state, action);
            if (next && next !== state) {
              return reader.fieldsPopupDeliveryApplyState(popup, next);
            }
          }
        },
      });
    },
    exit() {
      reader.scenario.panelClose();
      reader.fieldsPopupClose();
      reader.disable(true);
    },
    controls() {
      const button = (action, content) =>
        ui.controls.button({
          action,
          content,
          attrs: ' type="button"',
        });
      const smaller = button("smaller", icon.emoji(glyph.smaller, "reader"));
      const bigger = button("bigger", icon.emoji(glyph.bigger, "reader"));
      const editor = button("editor", icon.emoji(glyph.editor));
      const fields = button("fields", icon.emoji("\u{1F5C3}\uFE0F"));
      const scenario = button(
        "scenario",
        icon.emoji(reader.scenario.emoji(), "reader"),
      );
      const theme = button("theme", icon.theme(reader.theme()));
      const exit = button("exit", icon.emoji(glyph.exit, "reader"));
      const capsule = (content) => ui.shell.group(content, { rail: true });
      const size = capsule(`${smaller}${bigger}`);
      const actions = capsule(`${scenario}${fields}${editor}`);
      const system = capsule(`${theme}${exit}`);
      return ui.shell.shell({
        left: size,
        main: actions,
        right: system,
        classes: "reader-header-shell",
      });
    },
    panelNode() {
      const value = document.createElement("div");
      const run = ({ name, kind }) => {
        if (kind === "hold") {
          if (name === "smaller") reader.sizeEdge(-1);
          if (name === "bigger") reader.sizeEdge(1);
          return;
        }
        if (name === "theme") return reader.toggle();
        if (name === "scenario") return reader.scenario.panelOpen();
        if (name === "editor") return reader.editorToggle();
        if (name === "fields") return reader.fieldsPopupOpen();
        if (name === "titles") return reader.popupTitles();
        if (name === "excerpt") return reader.popupExcerpt();
        if (name === "slug") return reader.popupSlug();
        if (name === "exit") return reader.exit();
        if (name === "smaller") return reader.size(-1);
        if (name === "bigger") return reader.size(1);
      };
      value.id = reader.panel;
      value.className = "panel";
      value.dataset.uiSurface = "toolbar";
      value.dataset.theme = reader.theme();
      ui.surface.sync(value, {
        layout: "fullscreen",
        theme: reader.theme(),
        surface: "toolbar",
      });
      delete value.dataset.toolbarCapsule;
      value.innerHTML = reader.controls();
      toolbar.behavior.actions({
        panel: value,
        root: value,
        hold: ["smaller", "bigger"],
        disabled: (name, button) =>
          (name === "smaller" || name === "bigger") &&
          button.dataset.disabled === "true",
        action: run,
      });
      return value;
    },
    toolbarButton() {
      return cms.admin.mount({
        id: reader.button,
        content: icon.emoji("\u{1F576}\uFE0F"),
        html: true,
        onClick: () => reader.enable(),
      });
    },
    mountButton() {
      reader.toolbarButton();
    },
    removeButton() {
      document.getElementById(reader.button)?.remove();
    },
    bind(value) {
      let raf = null;
      let timer = null;
      const resize = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = null;
          reader.resize();
        });
      };
      const save = () => {
        clearTimeout(timer);
        timer = setTimeout(() => reader.save(), 150);
      };
      if (reader.desktop()) {
        const escape = (event) => {
          if (event.key !== "Escape") return;
          if (reader.fieldsPopupIsOpen()) {
            event.preventDefault();
            event.stopPropagation();
            reader.fieldsPopupClose();
            return;
          }
          reader.exit();
        };
        reader.listen(window, "keydown", escape);
      }
      reader.auto.setup(value);
      const auto = () => reader.auto.queue(value);
      reader.listen(value, "keyup", auto);
      reader.listen(value, "click", auto);
      reader.listen(value, "input", auto);
      reader.listen(document, "selectionchange", auto);
      reader.listen(window, "resize", resize);
      reader.listen(window, "orientationchange", resize);
      reader.listen(value, "scroll", save);
      reader.listen(value, "input", save);
      reader.listen(value, "keyup", save);
      reader.listen(value, "pointerup", save);
      if (reader.touch()) {
        const keep = () => {
          if (!reader.keyboardOpen()) return;
          const top = value.scrollTop;
          requestAnimationFrame(() => {
            value.scrollTop = top;
          });
          setTimeout(() => {
            value.scrollTop = top;
          }, 60);
          setTimeout(() => {
            value.scrollTop = top;
          }, 180);
        };
        reader.listen(value, "focus", keep);
        reader.listen(value, "blur", keep);
        const pinch = (event) => {
          if (event.touches && event.touches.length > 1) event.preventDefault();
        };
        const gesture = (event) => event.preventDefault();
        reader.listen(window, "touchmove", pinch, { passive: false });
        reader.listen(window, "gesturestart", gesture);
        reader.listen(window, "gesturechange", gesture);
      }
      if (!window.visualViewport) return;
      reader.listen(window.visualViewport, "resize", resize);
      reader.listen(window.visualViewport, "scroll", resize);
    },
    install() {
      if (!document.getElementById(`${reader.button}-style`)) {
        document.head.appendChild(
          reader.style(`${reader.button}-style`, reader.installCss()),
        );
      }
      if (!document.getElementById(reader.button)) reader.mountButton();
    },
    enable() {
      const value = reader.content();
      if (!value) return;
      panel.ensureStyles();
      reader.html();
      reader.widgetViewOn();
      reader.snapshot();
      reader.removeButton();
      document.getElementById(reader.id)?.remove();
      const currentPanel = document.getElementById(reader.panel);
      if (currentPanel) {
        toolbar.destroy(currentPanel);
        currentPanel.remove();
      }
      document.body.classList.add("reader-active");
      if (!reader.desktop()) document.body.classList.add("mobile-active");
      document.head.appendChild(reader.style(reader.id, reader.css()));
      document.body.appendChild(reader.panelNode());
      const bottom = document.createElement("div");
      bottom.id = `${reader.panel}-bottom`;
      document.body.appendChild(bottom);
      window.readerExit = () => reader.exit();
      window.mobileExit = () => reader.exit();
      reader.launcher.hide();
      reader.syncButtons();
      reader.bind(value);
      reader.resize();
      reader.restore();
      reader.editorOpen();
      if (!reader.state().scroll) value.scrollTop = 0;
      if (reader.desktop()) value.focus();
    },
    disable(focus) {
      const style = document.getElementById(reader.id);
      const panel = document.getElementById(reader.panel);
      document.getElementById(`${reader.panel}-bottom`)?.remove();
      const value = reader.content();
      const touchExit = {
        readonly: false,
        sink: null,
      };
      if (reader.touch()) {
        if (value && !value.hasAttribute("readonly")) {
          value.setAttribute("readonly", "readonly");
          touchExit.readonly = true;
        }
        const sink = document.createElement("button");
        sink.type = "button";
        sink.tabIndex = -1;
        sink.setAttribute("aria-hidden", "true");
        sink.style.position = "fixed";
        sink.style.left = "-9999px";
        sink.style.top = "0";
        sink.style.width = "1px";
        sink.style.height = "1px";
        sink.style.opacity = "0";
        document.body.appendChild(sink);
        sink.focus({ preventScroll: true });
        touchExit.sink = sink;
        if (document.activeElement === value) value?.blur?.();
        if (document.activeElement instanceof HTMLElement)
          document.activeElement.blur();
      }
      reader.save();
      reader.widgetViewOff();
      reader.unlisten();
      reader.auto.clear();
      reader.reset();
      if (style) style.remove();
      if (panel) {
        toolbar.destroy(panel);
        panel.remove();
      }
      reader.editorClose();
      document.body.classList.remove("reader-active");
      document.body.classList.remove("mobile-active");
      document.documentElement.style.removeProperty("--reader-keyboard-gap");
      reader.launcher.show();
      session.clear();
      reader.install();
      if (reader.touch()) {
        setTimeout(() => {
          if (document.activeElement instanceof HTMLElement)
            document.activeElement.blur();
          if (touchExit.sink) touchExit.sink.remove();
          if (touchExit.readonly && value) value.removeAttribute("readonly");
        }, 320);
      }
      if (focus && value && reader.desktop()) value.focus();
    },
    run() {
      if (reader.active()) return reader.exit();
      if (document.getElementById(reader.button)) return reader.enable();
      reader.install();
      reader.enable();
    },
  };
  reader.run();
})();
