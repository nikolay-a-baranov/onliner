import { panel } from "./core/panel.js";
import { toolbar } from "./core/toolbar.js";
import { icon } from "./core/icon.js";
import { css } from "./core/css.js";
import { ui } from "./core/ui.js";
import { cms } from "./core/cms.js";
import { widget } from "./core/widget.js";
import { design } from "./core/design.js";

(() => {
  const glyph = {
    smaller: "\u2796",
    bigger: "\u2795",
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
    marker: {
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
        const type = reader.marker.list(
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
        const context = reader.marker.context();
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
      title() {
        return (
          {
            longread: "Лонгрид",
            news: "Новость",
            photoreport: "Фоторепортаж",
          }[reader.marker.name()] || "Новость"
        );
      },
      emoji() {
        return (
          {
            longread: "\u{1F4F0}",
            news: "\u{1F5DE}\uFE0F",
            photoreport: "\u{1F4F8}",
          }[reader.marker.name()] || "\u{1F5DE}\uFE0F"
        );
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

    listeners: [],
    widgetReadable: false,
    widgetCache: {
      promo: [],
      vote: [],
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
    fontDisplay(value = reader.font(), mode = reader.mode()) {
      const base = reader.fontBase();
      const min = reader.fontDisplayMin(mode);
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
        icon.emoji(glyph.smaller, "reader"),
        ` title="${reader.sizeTitle(-1)}" aria-label="${reader.sizeTitle(-1)}"`,
      );
      const bigger = button(
        "bigger",
        icon.emoji(glyph.bigger, "reader"),
        ` title="${reader.sizeTitle(1)}" aria-label="${reader.sizeTitle(1)}"`,
      );
      const marker = button(
        "",
        icon.emoji(reader.marker.emoji(), "reader"),
        ` title="${reader.marker.title()}" aria-label="${reader.marker.title()}" tabindex="-1"`,
      );
      const theme = button(
        "theme",
        icon.theme(reader.theme()),
        ' title="Тема" aria-label="Тема"',
      );
      const exit = button(
        "exit",
        icon.emoji(glyph.exit, "reader"),
        ' title="Выход" aria-label="Выход"',
      );
      const group = (content) => ui.shell.group(content, { rail: true });
      return ui.shell.shell({
        left: group(`${smaller}${bigger}`),
        main: group(marker),
        right: group(`${theme}${exit}`),
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
      document.body.classList.remove("reader-active");
      document.body.classList.remove("mobile-active");
      document.documentElement.style.removeProperty("--reader-keyboard-gap");
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
