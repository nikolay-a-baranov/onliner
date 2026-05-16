import { frame } from "./core/panel.js";
import { toolbar } from "./core/toolbar.js";
import { emoji } from "./core/emoji.js";
import { css } from "./core/css.js";
import { widget } from "./core/widget.js";

(() => {
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
    names: ["Reader", "Mobile"],
    keys() {
      return session.names.flatMap((name) => [
        `onliner${name}`,
        `onliner${name}Exit`,
      ]);
    },
    clear() {
      session.keys().forEach((key) => delete window[key]);
    },
  };
  const active = document.getElementById("onliner-reader-content");
  if (active && window.onlinerReaderExit) {
    window.onlinerReaderExit();
    return;
  }
  if (active && window.onlinerMobileExit) {
    window.onlinerMobileExit();
    return;
  }
  if (active) {
    active.remove();
    document.getElementById("onliner-reader-panel")?.remove();
    document.body.classList.remove("onliner-reader-active");
    document.body.classList.remove("onliner-mobile-active");
    session.clear();
    return;
  }
  session.clear();
  const reader = {
    layout: {
      breakpoint: {
        phoneMaxShortEdge: 768,
      },
      padding: {
        top: {
          desktop: 80,
          touchBase: 22,
          touchFade: 18,
        },
        side: {
          touch: 16,
          desktop: 12,
        },
        bottom: {
          desktop: 38,
          touch: 86,
        },
      },
      panel: {
        height: {
          touch: 52,
          desktop: 64,
        },
        inset: 12,
      },
      keyboard: {
        openThreshold: 80,
      },
    },
    id: "onliner-reader-content",
    button: "onliner-reader-button",
    panel: "onliner-reader-panel",
    listeners: [],
    fontLimit: {
      min: -4,
      max: 8,
    },
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
        top: 0.2,
        bottom: 0.75,
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
        const duration = Math.max(420, Math.min(760, Math.abs(delta) * 0.8));
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
      plan(value) {
        if (!value) return;
        if (!reader.auto.mirror) return;
        if (reader.touch() && document.activeElement !== value) return;
        const y = reader.auto.y(value);
        if (y === null) return;
        const box = value.clientHeight;
        const profile = reader.profile();
        const keyboard = profile.keyboard || 0;
        const keyboardRatio = Math.min(0.32, keyboard / Math.max(1, box));
        const topRatio = reader.auto.ratio.top;
        const bottomRatio =
          profile.interaction === "touch-virtual"
            ? Math.max(
                topRatio + 0.25,
                reader.auto.ratio.bottom - keyboardRatio * 0.35,
              )
            : reader.auto.ratio.bottom;
        const top = box * topRatio;
        const bottom = box * bottomRatio;
        const aim = top + Math.max(8, reader.auto.line);
        if (y > bottom) {
          reader.auto.target = Math.max(0, value.scrollTop + (y - aim));
          reader.auto.animate(value, reader.auto.target);
          reader.auto.target = null;
          return;
        }
        if (y < top) {
          reader.auto.target = Math.max(0, value.scrollTop - (aim - y));
          reader.auto.animate(value, reader.auto.target);
          reader.auto.target = null;
          return;
        }
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
      return `onliner-reader-content-${reader.post()}-${name}`;
    },
    theme() {
      return localStorage.getItem(reader.key("theme")) || "dark";
    },
    font() {
      const saved = localStorage.getItem(reader.key("font"));
      if (saved !== null) return Number(saved || 0);
      if (reader.phone()) return -20;
      return 0;
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
      const screen = reader.screen();
      const short = Math.min(screen.width, screen.height);
      return (
        reader.touch() && short <= reader.layout.breakpoint.phoneMaxShortEdge
      );
    },
    tablet() {
      const screen = reader.screen();
      const short = Math.min(screen.width, screen.height);
      return (
        reader.touch() && short > reader.layout.breakpoint.phoneMaxShortEdge
      );
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
        #onliner-reader-button{
          text-decoration:none!important;
          border-bottom-color:transparent!important;
          border-bottom:1px solid transparent!important;
          box-shadow:none!important;
          background:#f0f0f1!important;
          color:#1d2327!important;
        }
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
      if (value.dataset.onlinerReaderSnapshot) return;
      value.dataset.onlinerReaderSnapshot = "1";
      value.dataset.onlinerReaderStyle = value.getAttribute("style") || "";
      value.dataset.onlinerReaderStyleEmpty =
        value.getAttribute("style") === null ? "1" : "0";
      value.dataset.onlinerReaderPage = String(window.scrollY);
    },
    reset() {
      const value = reader.content();
      if (!value) return;
      if (value.dataset.onlinerReaderStyleEmpty === "1")
        value.removeAttribute("style");
      if (value.dataset.onlinerReaderStyleEmpty !== "1")
        value.setAttribute("style", value.dataset.onlinerReaderStyle || "");
      window.scrollTo(0, Number(value.dataset.onlinerReaderPage || 0));
      delete value.dataset.onlinerReaderSnapshot;
      delete value.dataset.onlinerReaderStyle;
      delete value.dataset.onlinerReaderStyleEmpty;
      delete value.dataset.onlinerReaderPage;
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
      const base = Math.max(
        16,
        Math.min(screen.width / (landscape ? 42 : 28), landscape ? 18 : 23),
      );
      const size = Math.max(
        phone ? 16 : 14,
        Math.min(30, base + reader.font()),
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
      if (button) button.innerHTML = emoji.html(toolbar.themeToggleIcon(theme));
      reader.resize();
    },
    size(step) {
      const value = Math.max(
        reader.fontLimit.min,
        Math.min(reader.fontLimit.max, reader.font() + step),
      );
      localStorage.setItem(reader.key("font"), String(value));
      reader.resize();
      reader.syncButtons();
    },
    syncButtons() {
      const panel = document.getElementById(reader.panel);
      if (!panel) return;
      const smaller = panel.querySelector('[data-action="smaller"]');
      const bigger = panel.querySelector('[data-action="bigger"]');
      const current = reader.font();
      if (smaller)
        smaller.disabled = current <= reader.fontLimit.min;
      if (bigger)
        bigger.disabled = current >= reader.fontLimit.max;
    },
    exit() {
      reader.disable(true);
    },
    controls(mode) {
      const smaller = `<button class="button button-emoji" type="button" data-action="smaller">${emoji.html("\u2796")}</button>`;
      const theme = `<button class="button button-emoji" type="button" data-action="theme">${emoji.html(toolbar.themeToggleIcon(reader.theme()))}</button>`;
      const bigger = `<button class="button button-emoji" type="button" data-action="bigger">${emoji.html("\u2795")}</button>`;
      if (mode === "desktop") return `${smaller}${theme}${bigger}`;
      const keyboard = `<button class="button button-emoji" type="button" data-action="keyboard">${emoji.html("\u2328\uFE0F")}</button>`;
      const exit = `<button class="button button-emoji" type="button" data-action="exit">${emoji.html("\u274C")}</button>`;
      return `${keyboard}${smaller}${theme}${bigger}${exit}`;
    },
    panelNode() {
      const value = document.createElement("div");
      const mode = reader.mode();
      value.id = reader.panel;
      value.className = "panel";
      value.dataset.uiSurface = "reader";
      value.dataset.theme = reader.theme();
      value.innerHTML = reader.controls(mode);
      value.addEventListener("mousedown", (event) => event.preventDefault());
      value.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) return;
        if (button.disabled) {
          button.blur();
          return;
        }
        if (button.dataset.action === "theme") {
          reader.toggle();
          button.blur();
          return;
        }
        if (button.dataset.action === "keyboard") {
          const content = reader.content();
          if (!content) return;
          if (document.activeElement === content) {
            content.blur();
            button.blur();
            return;
          }
          content.focus();
          button.blur();
          return;
        }
        if (button.dataset.action === "exit") {
          reader.exit();
          button.blur();
          return;
        }
        if (button.dataset.action === "smaller") {
          reader.size(-1);
          button.blur();
          return;
        }
        if (button.dataset.action === "bigger") {
          reader.size(1);
          button.blur();
        }
      });
      return value;
    },
    toolbarButton() {
      const value = document.createElement("a");
      const action = (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        reader.enable();
      };
      value.id = reader.button;
      value.href = "#";
      value.className = "hide-if-no-js wp-switch-editor";
      value.innerHTML = emoji.html("\u{1F576}\uFE0F");
      value.addEventListener("click", action, true);
      value.addEventListener("touchend", action, true);
      return value;
    },
    mountButton() {
      const tools = document.querySelector("#wp-content-editor-tools");
      const html = document.querySelector("#content-html");
      if (!tools) return;
      tools.insertBefore(reader.toolbarButton(), html || tools.firstChild);
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
      frame.ensureStyles();
      reader.html();
      reader.widgetViewOn();
      reader.snapshot();
      reader.removeButton();
      document.getElementById(reader.id)?.remove();
      document.getElementById(reader.panel)?.remove();
      document.body.classList.add("onliner-reader-active");
      if (!reader.desktop())
        document.body.classList.add("onliner-mobile-active");
      document.head.appendChild(reader.style(reader.id, reader.css()));
      document.body.appendChild(reader.panelNode());
      const bottom = document.createElement("div");
      bottom.id = `${reader.panel}-bottom`;
      document.body.appendChild(bottom);
      window.onlinerReaderExit = () => reader.exit();
      window.onlinerMobileExit = () => reader.exit();
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
      reader.save();
      reader.widgetViewOff();
      reader.unlisten();
      reader.auto.clear();
      reader.reset();
      if (style) style.remove();
      if (panel) panel.remove();
      document.body.classList.remove("onliner-reader-active");
      document.body.classList.remove("onliner-mobile-active");
      document.documentElement.style.removeProperty("--reader-keyboard-gap");
      session.clear();
      reader.install();
      if (focus && value) value.focus();
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
