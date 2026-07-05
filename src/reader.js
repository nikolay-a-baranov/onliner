import { host } from "./core/surface/host.js";
import { toolbar } from "./core/surface/toolbar.js";
import { icon } from "./core/surface/icon.js";
import { styles as css } from "./core/surface/styles.js";
import { ui } from "./core/surface/ui.js";
import { cms } from "./core/cms.js";
import { field as domField } from "./core/dom.js";
import { widget } from "./core/widget.js";
import { design } from "./core/surface/design.js";
import { actions } from "./actions.js";
import { context } from "./runtime/context.js";
import { commands } from "./runtime/commands.js";
import { scenarios } from "./runtime/scenarios.js";

(() => {
  const glyph = {
    smaller: "minus",
    bigger: "plus",
    exit: "cross-mark",
  };
  const source = document.querySelector("#content");
  if (source) {
    const next = widget.ensure(source.value);
    if (next !== source.value) domField.input(source, next);
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
    document.getElementById("reader-panel-shield")?.remove();
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
    marker: {
      meta() {
        return context.page.meta(context.detect());
      },
      title() {
        return reader.marker.meta().title;
      },
      emoji() {
        return reader.marker.meta().emoji;
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
    shield: "reader-panel-shield",

    listeners: [],
    widgetReadable: false,
    widgetCache: {
      promo: [],
      vote: [],
    },
    hud: {
      frame: null,
      zone: {
        list() {
          return [
            "left-bottom",
            "left-middle",
            "left-bottom-right",
            "center-bottom",
            "right-middle",
            "right-bottom",
            "top-right",
          ];
        },
      },
      metrics: {
        padding: 108,
        footerGap: 148,
        bottomGap: 20,
      },
      id() {
        return `${reader.panel}-hud`;
      },
      enabled() {
        return reader.touch() && reader.hud.list().length > 0;
      },
      keyboardPadding() {
        return Math.max(
          reader.hud.metrics.bottomGap,
          Math.round(reader.hud.metrics.padding * 0.5),
        );
      },
      visible() {
        return reader.hud.enabled() && reader.interaction() === "touch-virtual";
      },
      padding() {
        if (!reader.hud.visible()) return 0;
        return reader.hud.keyboardPadding();
      },
      footerGap() {
        if (!reader.hud.visible()) return 60;
        return reader.hud.metrics.footerGap;
      },
      bottomGap() {
        if (!reader.hud.visible()) return 0;
        return reader.hud.metrics.bottomGap;
      },
      commands() {
        return scenarios.reader.commands();
      },
      commandId(value) {
        return typeof value === "string" ? value : value?.id;
      },
      position: {
        slots() {
          return [
            { side: "left", slot: 1, id: "punct" },
            { side: "left", slot: 2, id: "token" },
            { side: "left", slot: 3, id: "nbsp" },
            { side: "left", slot: 4, id: "comma" },
            { side: "center", slot: 1, id: "capital" },
            { side: "right", slot: 1, id: "quote" },
            { side: "right", slot: 2, id: "inline" },
            { side: "right", slot: 3, id: "left" },
            { side: "right", slot: 4, id: "right" },
          ];
        },
        phone() {
          return [
            { side: "left", slot: 4, zone: "left-bottom", order: 10 },
            { side: "left", slot: 3, zone: "left-bottom", order: 20 },
            { side: "left", slot: 1, zone: "left-bottom", order: 30 },
            { side: "left", slot: 2, zone: "left-bottom-right", order: 10 },
            { side: "center", slot: 1, zone: "center-bottom", order: 10 },
            { side: "right", slot: 1, zone: "right-middle", order: 10 },
            { side: "right", slot: 2, zone: "right-middle", order: 20 },
            { side: "right", slot: 3, zone: "right-bottom", order: 10 },
            { side: "right", slot: 4, zone: "right-bottom", order: 20 },
          ];
        },
        tablet() {
          return reader.hud.position.slots().map((value) => ({
            ...value,
            zone: `${value.side}-bottom`,
            order: value.slot * 10,
          }));
        },
        key(value) {
          return `${value.side}.${value.slot}`;
        },
        slotMap() {
          return new Map(
            reader.hud.position
              .slots()
              .map((value) => [reader.hud.position.key(value), value.id]),
          );
        },
        layout() {
          return reader.iphone()
            ? reader.hud.position.phone()
            : reader.hud.position.tablet();
        },
        list() {
          const slots = reader.hud.position.slotMap();
          return reader.hud.position.layout().map((value) => ({
            ...value,
            id: slots.get(reader.hud.position.key(value)),
          }));
        },
        map() {
          return new Map(
            reader.hud.position.list().map((value) => [
              value.id,
              {
                side: value.side,
                slot: value.slot,
                position: reader.hud.position.key(value),
                zone: value.zone,
                order: value.order,
              },
            ]),
          );
        },
        get(id, index) {
          return (
            reader.hud.position.map().get(String(id || "")) || {
              side: "left",
              slot: 0,
              position: "left.0",
              zone: "left-bottom",
              order: index * 10,
            }
          );
        },
      },
      commandItem(value, index) {
        const id = reader.hud.commandId(value);
        const meta = commands.normalize(id);
        const place = reader.hud.position.get(id, index);
        return {
          id,
          title: String(meta?.title || ""),
          glyph: String(meta?.glyph || ""),
          emoji: String(meta?.emoji || ""),
          image: String(meta?.image || ""),
          logo: String(meta?.logo || ""),
          favicon: String(meta?.favicon || ""),
          readerHud: {
            position: place.position,
            zone: place.zone,
            order: place.order,
          },
        };
      },
      list() {
        return reader.hud
          .commands()
          .map(reader.hud.commandItem)
          .filter((item) => item.id && actions.has(item.id))
          .sort((left, right) => {
            if (left.readerHud.zone !== right.readerHud.zone) {
              return (
                reader.hud.zone.list().indexOf(left.readerHud.zone) -
                reader.hud.zone.list().indexOf(right.readerHud.zone)
              );
            }
            return (left.readerHud.order || 0) - (right.readerHud.order || 0);
          });
      },
      content(value) {
        const image = String(value?.image || "");
        if (image) {
          return icon.logo.image(image, value.title || "", "reader-hud-icon");
        }
        const logo = String(value?.logo || "");
        if (logo) return icon.logo(logo, value.title || logo, "reader-hud-icon");
        const favicon = String(value?.favicon || "");
        if (favicon) {
          return icon.logo.favicon(favicon, value.title || favicon);
        }
        const glyph = String(value?.glyph || "");
        if (glyph) {
          const primary = icon.fluent(glyph, 24);
          const fallback = icon.fluent(glyph, 28);
          return `<img class="toolbar-icon reader-hud-icon" src="${primary}" alt="" onerror="this.onerror=null;this.src='${fallback}'">`;
        }
        return icon.emoji(String(value?.emoji || "bookmark"));
      },
      active(id) {
        if (id === "punct") return false;
        return actions.active(id);
      },
      button(value) {
        const active = reader.hud.active(value.id);
        return ui.controls.button({
          action: "command",
          content: reader.hud.content(value),
          classes: "reader-hud-button",
          attrs: ` data-id="${value.id}" data-active="${active ? "true" : "false"}" type="button" aria-label="${value.title}" aria-pressed="${active ? "true" : "false"}" title="${value.title}"`,
        });
      },
      section(zone, list) {
        if (!list.length) return "";
        return `<div class="reader-hud-zone" data-reader-hud-zone="${zone}">${list.map((item) => reader.hud.button(item)).join("")}</div>`;
      },
      html() {
        const items = reader.hud.list();
        return reader.hud.zone
          .list()
          .map((zone) =>
            reader.hud.section(
              zone,
              items.filter((item) => item.readerHud.zone === zone),
            ),
          )
          .join("");
      },
      sync() {
        const node = document.getElementById(reader.hud.id());
        if (!node) return;
        node.dataset.theme = reader.theme();
        node.dataset.interaction = reader.interaction();
        node.innerHTML = reader.hud.html();
      },
      syncState() {
        const node = document.getElementById(reader.hud.id());
        if (!node) return;
        node.querySelectorAll("[data-id]").forEach((button) => {
          const active = reader.hud.active(button.dataset.id);
          button.dataset.active = active ? "true" : "false";
          button.setAttribute("aria-pressed", active ? "true" : "false");
        });
      },
      schedule() {
        if (reader.hud.frame) return;
        reader.hud.frame = requestAnimationFrame(() => {
          reader.hud.frame = null;
          reader.hud.syncState();
        });
      },
      run(id) {
        const value = reader.content();
        if (!value || !actions.has(id)) return false;
        value.focus?.({ preventScroll: true });
        const done = actions.run(id);
        reader.hud.schedule();
        return done;
      },
      node() {
        const value = document.createElement("div");
        value.id = reader.hud.id();
        value.className = "panel";
        value.dataset.uiSurface = "toolbar";
        value.dataset.theme = reader.theme();
        value.dataset.interaction = reader.interaction();
        ui.surface.sync(value, {
          layout: "fullscreen",
          theme: reader.theme(),
          surface: "toolbar",
        });
        delete value.dataset.toolbarCapsule;
        value.innerHTML = reader.hud.html();
        toolbar.behavior.actions({
          panel: value,
          root: value,
          action({ name, button }) {
            if (name !== "command") return;
            const id = button?.dataset?.id || "";
            if (id) reader.hud.run(id);
          },
        });
        return value;
      },
    },
    zoom: {
      viewport: {
        node: null,
        content: null,
        created: false,
      },
      content() {
        return "width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover";
      },
      enable() {
        if (!reader.touch()) return;
        const value = document.querySelector('meta[name="viewport"]');
        const node = value || document.createElement("meta");
        reader.zoom.viewport.node = node;
        reader.zoom.viewport.content = node.getAttribute("content") || "";
        reader.zoom.viewport.created = !value;
        node.setAttribute("name", "viewport");
        node.setAttribute("content", reader.zoom.content());
        if (!value) document.head.appendChild(node);
      },
      disable() {
        const value = reader.zoom.viewport.node;
        if (!value) return;
        if (reader.zoom.viewport.created) value.remove();
        if (!reader.zoom.viewport.created) {
          value.setAttribute("content", reader.zoom.viewport.content);
        }
        reader.zoom.viewport.node = null;
        reader.zoom.viewport.content = null;
        reader.zoom.viewport.created = false;
      },
    },
    viewport: {
      frame() {
        const keyboard = reader.keyboard();
        if (reader.touch() && keyboard > reader.layout.keyboard.openThreshold) {
          return {
            left: 0,
            top: 0,
            width: Math.max(0, Math.round(window.innerWidth || 0)),
            height: Math.max(0, Math.round((window.innerHeight || 0) - keyboard)),
          };
        }
        const value = window.visualViewport;
        if (value) {
          return {
            left: Math.max(0, Math.round(value.offsetLeft || 0)),
            top: Math.max(0, Math.round(value.offsetTop || 0)),
            width: Math.max(0, Math.round(value.width || window.innerWidth)),
            height: Math.max(0, Math.round(value.height || window.innerHeight)),
          };
        }
        return {
          left: 0,
          top: 0,
          width: Math.max(0, Math.round(window.innerWidth || 0)),
          height: Math.max(0, Math.round(window.innerHeight || 0)),
        };
      },
      sync() {
        const value = reader.viewport.frame();
        document.documentElement.style.setProperty(
          "--reader-viewport-left",
          `${value.left}px`,
        );
        document.documentElement.style.setProperty(
          "--reader-viewport-top",
          `${value.top}px`,
        );
        document.documentElement.style.setProperty(
          "--reader-viewport-width",
          `${value.width}px`,
        );
        document.documentElement.style.setProperty(
          "--reader-viewport-height",
          `${value.height}px`,
        );
        document.documentElement.style.setProperty(
          "--reader-hud-bottom-gap",
          `${reader.hud.bottomGap()}px`,
        );
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
      enabled() {
        return reader.desktop() || reader.interaction() === "touch-hardware";
      },
      setup(value) {
        if (!reader.auto.enabled()) return;
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
        const size = Math.max(
          0,
          Math.min(value.value.length, Number(index || 0)),
        );
        mirror.textContent = value.value.slice(0, size);
        mirror.appendChild(marker);
        const top = marker.offsetTop - value.scrollTop;
        const line = marker.offsetHeight || reader.auto.line;
        return { top, line };
      },
      paragraph(value) {
        if (!value) return null;
        const text = String(value.value || "");
        const caret = Math.max(
          0,
          Math.min(text.length, value.selectionStart || 0),
        );
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
        if (!reader.auto.enabled()) return;
        if (!value) return;
        if (!reader.auto.mirror) return;
        if (reader.touch() && document.activeElement !== value) return;
        const paragraph = reader.auto.paragraph(value);
        if (!paragraph) return;
        const box = value.clientHeight;
        const line = Math.max(
          design.surface.reader.auto.minAim,
          reader.auto.line,
        );
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
        if (!reader.auto.enabled()) return;
        if (!value) return;
      },
      queue(value) {
        if (!reader.auto.enabled()) return;
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
    fontInputMin(mode = reader.mode()) {
      const value = reader.fontDisplayMin(mode);
      if (reader.iphone()) return Math.max(16, value);
      return value;
    },
    fontDisplayMax() {
      return reader.layout.font.display.max;
    },
    fontRange(mode = reader.mode()) {
      const base = reader.fontBase();
      const min = Math.ceil(reader.fontInputMin(mode) - base);
      const max = Math.floor(reader.fontDisplayMax() - base);
      return { min, max: Math.max(min, max) };
    },
    fontClamp(value, mode = reader.mode()) {
      const range = reader.fontRange(mode);
      return Math.max(range.min, Math.min(range.max, Number(value || 0)));
    },
    fontDisplay(value = reader.font(), mode = reader.mode()) {
      const base = reader.fontBase();
      const min = reader.fontInputMin(mode);
      const max = reader.fontDisplayMax();
      return Math.max(min, Math.min(max, base + Number(value || 0)));
    },
    fontLabel(value = reader.font(), mode = reader.mode()) {
      return `${Math.round(reader.fontDisplay(value, mode))}px`;
    },
    sizeTitle(step) {
      const range = reader.fontRange();
      const current = reader.font();
      const next = Math.max(range.min, Math.min(range.max, current + step));
      const label = reader.fontLabel(next);
      if (step < 0) {
        return current <= range.min ? `Минимум ${label}` : `${label}`;
      }
      return current >= range.max ? `Максимум ${label}` : `${label}`;
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
    iphone() {
      const agent = navigator.userAgent || "";
      return /iPhone|iPod/.test(agent);
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
      const screen = reader.screen();
      const viewportHeight = Math.max(
        0,
        Math.round((window.innerHeight || 0) - keyboard),
      );
      const keyboardPadding =
        keyboard > 0 && screen.height > viewportHeight + 1 ? keyboard : 0;
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
            ? keyboardPadding +
              reader.layout.padding.bottom.touch +
              reader.hud.padding()
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
      return css.reader.text({
        theme: reader.theme(),
        panel: reader.panel,
        hud: reader.hud.id(),
      });
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
      if (styleEmpty === "1") value.removeAttribute("style");
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
      const profile = reader.profile();
      document.body.dataset.readerInteraction = profile.interaction;
      const phone = profile.mode === "phone";
      const landscape = window.matchMedia("(orientation: landscape)").matches;
      const top = screen.offsetTop;
      const height = screen.height;
      const base = reader.fontBase();
      const minDisplay = reader.fontInputMin(profile.mode);
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
      reader.auto.sync(value);
      reader.viewport.sync();
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
        `${reader.hud.footerGap()}px`,
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
      reader.hud.sync();
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
    syncButtons() {
      const panel = document.getElementById(reader.panel);
      if (!panel) return;
      const smaller = panel.querySelector('[data-action="smaller"]');
      const bigger = panel.querySelector('[data-action="bigger"]');
      const range = reader.fontRange();
      const current = reader.font();
      if (smaller) {
        const title = reader.sizeTitle(-1);
        smaller.dataset.disabled = current <= range.min ? "true" : "false";
        smaller.setAttribute(
          "aria-disabled",
          current <= range.min ? "true" : "false",
        );
        smaller.setAttribute("title", title);
        smaller.setAttribute("aria-label", title);
      }
      if (bigger) {
        const title = reader.sizeTitle(1);
        bigger.dataset.disabled = current >= range.max ? "true" : "false";
        bigger.setAttribute(
          "aria-disabled",
          current >= range.max ? "true" : "false",
        );
        bigger.setAttribute("title", title);
        bigger.setAttribute("aria-label", title);
      }
      reader.hud.sync();
    },
    exit() {
      reader.disable(true);
    },
    controls() {
      const button = (action, content, attrs = "") =>
        ui.controls.button({
          action,
          content,
          attrs: ` type="button"${attrs}`,
        });
      const smaller = button(
        "smaller",
        icon.emoji(glyph.smaller),
        ` title="${reader.sizeTitle(-1)}" aria-label="${reader.sizeTitle(-1)}"`,
      );
      const bigger = button(
        "bigger",
        icon.emoji(glyph.bigger),
        ` title="${reader.sizeTitle(1)}" aria-label="${reader.sizeTitle(1)}"`,
      );
      const marker = button(
        "",
        icon.emoji(reader.marker.emoji()),
        ` title="${reader.marker.title()}" aria-label="${reader.marker.title()}" tabindex="-1"`,
      );
      const theme = button(
        "theme",
        icon.theme(reader.theme()),
        ' title="Тема" aria-label="Тема"',
      );
      const exit = button(
        "exit",
        icon.emoji(glyph.exit),
        ' title="Выход" aria-label="Выход"',
      );
      const group = (content) => ui.shell.group(content, { rail: true });
      return ui.shell.frame({
        left: group(`${smaller}${bigger}`),
        main: group(marker),
        right: group(`${theme}${exit}`),
        classes: "reader-header-shell",
      });
    },

    shieldNode() {
      const value = document.createElement("div");
      value.id = reader.shield;
      value.setAttribute("aria-hidden", "true");
      value.style.position = "fixed";
      value.style.left = "0";
      value.style.top = "0";
      value.style.right = "0";
      value.style.bottom = "0";
      value.style.width = "100vw";
      value.style.height = "100vh";
      value.style.zIndex = "999998";
      value.style.pointerEvents = "auto";
      value.style.touchAction = "none";
      value.style.background = "transparent";
      const block = (event) => {
        event.preventDefault();
        event.stopPropagation();
      };
      value.addEventListener("touchstart", block, { passive: false });
      value.addEventListener("touchmove", block, { passive: false });
      value.addEventListener("touchend", block, { passive: false });
      value.addEventListener("pointerdown", block);
      value.addEventListener("pointermove", block);
      value.addEventListener("pointerup", block);
      return value;
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
        content: icon.emoji("sunglasses"),
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
      let resizeTimers = [];
      const stableResize = () => {
        resizeTimers.forEach((value) => clearTimeout(value));
        resizeTimers = [80, 220, 420].map((delay) =>
          setTimeout(() => reader.resize(), delay),
        );
      };
      const resize = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = null;
          reader.resize();
          if (reader.touch()) stableResize();
        });
      };
      const save = () => {
        clearTimeout(timer);
        timer = setTimeout(() => reader.save(), 150);
      };
      if (reader.desktop()) {
        const escape = (event) => {
          if (event.key !== "Escape") return;
          reader.exit();
        };
        reader.listen(window, "keydown", escape);
      }
      reader.auto.setup(value);
      const auto = () => reader.auto.queue(value);
      const hud = () => reader.hud.schedule();
      reader.listen(value, "keyup", auto);
      reader.listen(value, "click", auto);
      reader.listen(value, "input", auto);
      reader.listen(document, "selectionchange", auto);
      reader.listen(value, "keyup", hud);
      reader.listen(value, "click", hud);
      reader.listen(value, "input", hud);
      reader.listen(value, "pointerup", hud);
      reader.listen(document, "selectionchange", hud);
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
        let lastTap = null;
        const point = (event) => {
          const touch = event.changedTouches?.[0] || event.touches?.[0];
          if (!touch) return null;
          return {
            time: Date.now(),
            x: Math.round(touch.clientX || 0),
            y: Math.round(touch.clientY || 0),
          };
        };
        const repeated = (value) => {
          if (!value || !lastTap) return false;
          const time = value.time - lastTap.time;
          const dx = Math.abs(value.x - lastTap.x);
          const dy = Math.abs(value.y - lastTap.y);
          return time > 0 && time < 360 && dx < 36 && dy < 36;
        };
        const pinch = (event) => {
          if (event.touches && event.touches.length > 1) event.preventDefault();
        };
        const gesture = (event) => event.preventDefault();
        const doubleTapStart = (event) => {
          if (event.touches && event.touches.length !== 1) return;
          if (repeated(point(event))) event.preventDefault();
        };
        const doubleTapEnd = (event) => {
          const current = point(event);
          if (repeated(current)) event.preventDefault();
          lastTap = current;
        };
        reader.listen(value, "focus", keep);
        reader.listen(value, "blur", keep);
        reader.listen(value, "touchmove", pinch, { passive: false });
        reader.listen(window, "gesturestart", gesture, { passive: false });
        reader.listen(window, "gesturechange", gesture, { passive: false });
        reader.listen(window, "gestureend", gesture, { passive: false });
        reader.listen(window, "touchstart", doubleTapStart, {
          capture: true,
          passive: false,
        });
        reader.listen(window, "touchend", doubleTapEnd, {
          capture: true,
          passive: false,
        });
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
      host.ensureStyles();
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
      reader.zoom.enable();
      document.head.appendChild(reader.style(reader.id, reader.css()));
      document.body.appendChild(reader.shieldNode());
      document.body.appendChild(reader.panelNode());
      if (reader.hud.enabled()) {
        document.body.appendChild(reader.hud.node());
      }
      const bottom = document.createElement("div");
      bottom.id = `${reader.panel}-bottom`;
      document.body.appendChild(bottom);
      window.readerExit = () => reader.exit();
      window.mobileExit = () => reader.exit();
      reader.syncButtons();
      reader.bind(value);
      reader.resize();
      reader.restore();
      if (!reader.state().scroll) value.scrollTop = 0;
      if (reader.desktop()) value.focus();
    },
    disable(focus) {
      const style = document.getElementById(reader.id);
      const panel = document.getElementById(reader.panel);
      const hud = document.getElementById(reader.hud.id());
      const shield = document.getElementById(reader.shield);
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
      if (reader.hud.frame) cancelAnimationFrame(reader.hud.frame);
      reader.hud.frame = null;
      reader.reset();
      if (style) style.remove();
      if (shield) shield.remove();
      if (panel) {
        toolbar.destroy(panel);
        panel.remove();
      }
      if (hud) {
        toolbar.destroy(hud);
        hud.remove();
      }
      document.body.classList.remove("reader-active");
      document.body.classList.remove("mobile-active");
      reader.zoom.disable();
      [
        "--reader-scrollbar-gap",
        "--reader-keyboard-gap",
        "--reader-toolbar-top-gap",
        "--reader-toolbar-bottom-gap",
        "--reader-viewport-left",
        "--reader-viewport-top",
        "--reader-viewport-width",
        "--reader-viewport-height",
        "--reader-hud-bottom-gap",
      ].forEach((name) => document.documentElement.style.removeProperty(name));
      delete document.body.dataset.readerInteraction;
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
