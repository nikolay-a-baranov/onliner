import { host } from "./core/surface/host.js";
import { toolbar } from "./core/surface/toolbar.js";
import { icon } from "./core/surface/icon.js";
import { styles as css } from "./core/surface/styles.js";
import { ui } from "./core/surface/ui.js";
import { ux } from "./core/surface/ux.js";
import { cms } from "./core/cms.js";
import { field as domField } from "./core/dom.js";
import { widget } from "./core/widget.js";
import { design } from "./core/surface/design.js";
import { actions } from "./actions.js";
import { context } from "./runtime/context.js";
import { commands } from "./runtime/commands.js";

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
      modeTransitioning: false,
      mode: {
        id: "reader.hud.layer",
        command() {
          return {
            id: reader.hud.mode.id,
            title: reader.hud.mode.title(),
            glyph: "Channel Share",
          };
        },
        title() {
          return reader.hud.mode.active() === 2 ? "Слой 2" : "Слой 1";
        },
        active() {
          return reader.hud.mode.value;
        },
        set(value) {
          const next = value === 2 ? 2 : 1;
          reader.hud.mode.value = next;
          return next;
        },
        toggle() {
          return reader.hud.mode.set(reader.hud.mode.active() === 2 ? 1 : 2);
        },
        reset() {
          return reader.hud.mode.set(1);
        },
        value: 1,
      },
      zone: {
        list() {
          return [
            "left-x",
            "left-y",
            "center-x",
            "right-y",
            "right-x",
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
        return (
          reader.hud.enabled() &&
          reader.interaction() === "touch-virtual" &&
          !reader.tools.expanded()
        );
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
        return reader.hud.position.ids();
      },
      commandId(value) {
        return typeof value === "string" ? value : value?.id;
      },
      position: {
        layers() {
          return {
            1: [
              { side: "left", slot: 1, id: "punct" },
              { side: "left", slot: 2, id: "token" },
              { side: "left", slot: 3, id: "nbsp" },
              { side: "left", slot: 4, id: "comma" },
              { side: "center", slot: 1, id: reader.hud.mode.id },
              { side: "right", slot: 1, id: "quote" },
              { side: "right", slot: 2, id: "inline" },
              { side: "right", slot: 3, id: "left" },
              { side: "right", slot: 4, id: "right" },
            ],
            2: [
              { side: "left", slot: 1, id: "dash" },
              { side: "left", slot: 2, id: "list" },
              { side: "left", slot: 3, id: "backspace" },
              { side: "left", slot: 4, id: "undo" },
              { side: "center", slot: 1, id: reader.hud.mode.id },
              { side: "right", slot: 1, id: "bold" },
              { side: "right", slot: 2, id: "italic" },
              { side: "right", slot: 3, id: "cursor" },
              { side: "right", slot: 4, id: "capital" },
            ],
          };
        },
        slots() {
          return (
            reader.hud.position.layers()[reader.hud.mode.active()] ||
            reader.hud.position.layers()[1]
          ).slice();
        },
        ids() {
          return reader.hud.position
            .slots()
            .map((value) => reader.hud.commandId(value))
            .filter(Boolean);
        },
        phone() {
          return [
            { side: "left", slot: 1, zone: "left-x", order: 10 },
            { side: "left", slot: 2, zone: "left-x", order: 20 },
            { side: "left", slot: 3, zone: "left-y", order: 10 },
            { side: "left", slot: 4, zone: "left-y", order: 20 },
            { side: "center", slot: 1, zone: "center-x", order: 10 },
            { side: "right", slot: 1, zone: "right-y", order: 10 },
            { side: "right", slot: 2, zone: "right-y", order: 20 },
            { side: "right", slot: 3, zone: "right-x", order: 10 },
            { side: "right", slot: 4, zone: "right-x", order: 20 },
          ];
        },
        tablet() {
          return [
            { side: "left", slot: 1, zone: "left-x", order: 10 },
            { side: "left", slot: 2, zone: "left-x", order: 20 },
            { side: "left", slot: 3, zone: "left-y", order: 10 },
            { side: "left", slot: 4, zone: "left-y", order: 20 },
            { side: "center", slot: 1, zone: "center-x", order: 10 },
            { side: "right", slot: 1, zone: "right-y", order: 10 },
            { side: "right", slot: 2, zone: "right-y", order: 20 },
            { side: "right", slot: 3, zone: "right-x", order: 30 },
            { side: "right", slot: 4, zone: "right-x", order: 40 },
          ];
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
          return reader.phone()
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
              zone: "left-x",
              order: index * 10,
            }
          );
        },
      },
      commandItem(value, index) {
        const id = reader.hud.commandId(value);
        const meta =
          id === reader.hud.mode.id
            ? reader.hud.mode.command()
            : commands.normalize(id);
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
          .filter(
            (item) =>
              item.id &&
              (item.id === reader.hud.mode.id || actions.has(item.id)),
          )
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
        if (id === reader.hud.mode.id) return false;
        return actions.active(id);
      },
      signature(id = "", { active = false, layer = reader.hud.mode.active() } = {}) {
        return [String(id || ""), active ? "1" : "0", String(layer || 1)].join(":");
      },
      key(button = null) {
        return button?.dataset?.readerHudPosition || button?.dataset?.id || "";
      },
      capture(node = null) {
        const current = node || document.getElementById(reader.hud.id());
        if (!current) return new Map();
        return new Map(
          [...current.querySelectorAll("[data-id]")].map((button) => [
            reader.hud.key(button),
            {
              signature: button.dataset.signature || "",
              html:
                button.querySelector(".reader-hud-flip-face")?.innerHTML || button.innerHTML,
              rect: button.getBoundingClientRect(),
            },
          ]),
        );
      },
      modeFace(layer = 1) {
        const mirrored = layer === 2 ? ' data-reader-hud-mirrored="true"' : "";
        return `<span class="reader-hud-mode-glyph" data-layer="${layer}"${mirrored}>${reader.hud.content(reader.hud.mode.command())}</span>`;
      },
      flipFace(content = "") {
        return `<span class="reader-hud-flip-face">${content}</span>`;
      },
      flipShell(content = "") {
        return `<span class="reader-hud-flip-shell">${reader.hud.flipFace(content)}</span>`;
      },
      signatureLayer(signature = "") {
        return String(signature || "").split(":")[2] || "";
      },
      shouldFlip(from = null, button = null) {
        if (button?.dataset?.readerHudMode === "true") return false;
        const previous = reader.hud.signatureLayer(from?.signature);
        const next = reader.hud.signatureLayer(button?.dataset?.signature);
        return Boolean(previous && next && previous !== next);
      },
      direction(from = null, button = null) {
        const previous = reader.hud.signatureLayer(from?.signature);
        const next = reader.hud.signatureLayer(button?.dataset?.signature);
        if (!previous || !next) return "forward";
        return Number(next || 1) > Number(previous || 1) ? "forward" : "back";
      },
      button(value) {
        const active = reader.hud.active(value.id);
        const mode = value.id === reader.hud.mode.id;
        const position = String(value.readerHud?.position || value.id || "");
        const signature = reader.hud.signature(value.id, { active });
        return ui.controls.button({
          action: "command",
          content: reader.hud.flipShell(
            mode ? reader.hud.modeFace(reader.hud.mode.active()) : reader.hud.content(value),
          ),
          classes: "reader-hud-button",
          attrs: ` data-id="${value.id}" data-reader-hud-position="${position}" data-signature="${signature}" data-active="${active ? "true" : "false"}"${mode ? ' data-reader-hud-mode="true"' : ""} type="button" aria-label="${value.title}" aria-pressed="${active ? "true" : "false"}" title="${value.title}"`,
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
        const previous = reader.hud.capture(node);
        node.dataset.theme = reader.theme();
        node.dataset.interaction = reader.interaction();
        node.dataset.readerMode = reader.mode();
        node.dataset.visible = reader.hud.visible() ? "true" : "false";
        node.dataset.hudLayer = String(reader.hud.mode.active());
        node.innerHTML = reader.hud.html();
        reader.hud.animateDiff(previous, node);
      },
      syncState() {
        const node = document.getElementById(reader.hud.id());
        if (!node) return;
        const previous = reader.hud.capture(node);
        node.querySelectorAll("[data-id]").forEach((button) => {
          const id = button.dataset.id || "";
          const active = reader.hud.active(id);
          button.dataset.active = active ? "true" : "false";
          button.dataset.signature = reader.hud.signature(id, { active });
          button.setAttribute("aria-pressed", active ? "true" : "false");
        });
        reader.hud.animateDiff(previous, node);
      },
      animateButton(from = null, button = null, options = {}) {
        if (!from || !button) return;
        if (!options.force && !reader.hud.shouldFlip(from, button)) return;
        const shell = button.querySelector(".reader-hud-flip-shell");
        const face = shell?.querySelector(".reader-hud-flip-face");
        if (!shell || !face) return;
        const html = face.innerHTML;
        const clear = () => {
          options.done?.();
          if (!button.isConnected) return;
          button.dataset.readerHudFlipDone = "true";
          face.innerHTML = html;
          shell.style.removeProperty("transform");
          shell.style.removeProperty("filter");
          delete button.dataset.readerHudFlipping;
          delete button.dataset.readerHudFlipVisible;
          requestAnimationFrame(() => {
            if (!button.isConnected) return;
            delete button.dataset.readerHudFlipDone;
            delete button.dataset.readerHudFlipReady;
          });
        };
        if (!shell.animate) {
          clear();
          return;
        }
        face.innerHTML = from.html;
        button.dataset.readerHudFlipReady = "true";
        button.offsetWidth;
        button.dataset.readerHudFlipping = "true";
        const direction = reader.hud.direction(from, button);
        const angle = 90;
        const middle = direction === "back" ? -angle : angle;
        const entry = direction === "back" ? angle : -angle;
        const duration = 280;
        const easing = "cubic-bezier(.45,0,.55,1)";
        const first = shell.animate(
          [
            { transform: "rotateY(0deg)", filter: "brightness(1)" },
            { transform: `rotateY(${middle}deg)`, filter: "brightness(1)" },
          ],
          {
            duration,
            easing,
            fill: "forwards",
          },
        );
        first.oncancel = clear;
        first.onfinish = () => {
          if (!button.isConnected) return;
          face.innerHTML = html;
          shell.style.transform = `rotateY(${entry}deg)`;
          button.dataset.readerHudFlipVisible = "true";
          button.offsetWidth;
          const second = shell.animate(
            [
              { transform: `rotateY(${entry}deg)`, filter: "brightness(1)" },
              { transform: "rotateY(0deg)", filter: "brightness(1)" },
            ],
            {
              duration,
              easing,
              fill: "forwards",
            },
          );
          second.onfinish = clear;
          second.oncancel = clear;
        };
      },
      animateDiff(previous = new Map(), node = null) {
        const current = node || document.getElementById(reader.hud.id());
        if (!current || !previous.size) return;
        const changed = [...current.querySelectorAll("[data-id]")].filter((button) => {
          const next = button.dataset.signature || "";
          const value = previous.get(reader.hud.key(button));
          return Boolean(
            value &&
            value.signature !== next &&
            reader.hud.shouldFlip(value, button)
          );
        });
        if (!changed.length) return;
        changed.forEach((button) => {
          reader.hud.animateButton(previous.get(reader.hud.key(button)), button);
        });
      },
      schedule() {
        if (reader.hud.frame) return;
        reader.hud.frame = requestAnimationFrame(() => {
          reader.hud.frame = null;
          reader.hud.syncState();
        });
      },
      animateMode() {
        if (reader.hud.modeTransitioning) return false;
        const node = document.getElementById(reader.hud.id());
        const current = node?.querySelector('[data-reader-hud-mode="true"]');
        const value = reader.commandTarget();
        const from = current
          ? {
              signature: current.dataset.signature || "",
              html:
                current.querySelector(".reader-hud-flip-face")?.innerHTML ||
                current.innerHTML,
            }
          : null;
        const finish = () => {
          reader.hud.modeTransitioning = false;
          value?.focus?.({ preventScroll: true });
        };
        reader.hud.modeTransitioning = true;
        if (!current?.animate) {
          reader.hud.mode.toggle();
          reader.hud.sync();
          finish();
          return true;
        }
        reader.hud.mode.toggle();
        reader.hud.sync();
        const next = document
          .getElementById(reader.hud.id())
          ?.querySelector('[data-reader-hud-mode="true"]');
        if (!next) {
          finish();
          return true;
        }
        reader.hud.animateButton(from, next, { force: true, done: finish });
        return true;
      },
      commandDone(id = "", done = false) {
        if (!done) return false;
        const value = commands.normalize(id);
        if (!value.cycle) return true;
        const current = actions.cycleDone(id);
        if (typeof current === "boolean") return current;
        return true;
      },
      resetAfterCommand(id = "", done = false) {
        if (reader.hud.mode.active() !== 2) return;
        if (!reader.hud.commandDone(id, done)) return;
        reader.hud.mode.reset();
        reader.hud.sync();
      },
      run(id) {
        if (id === reader.hud.mode.id) {
          return reader.hud.animateMode();
        }
        const value = reader.commandTarget();
        if (!value || !actions.has(id)) return false;
        value.focus?.({ preventScroll: true });
        const done = actions.run(id);
        reader.hud.resetAfterCommand(id, done);
        reader.hud.schedule();
        return done;
      },
      node() {
        reader.hud.mode.reset();
        const value = document.createElement("div");
        value.id = reader.hud.id();
        value.className = "panel";
        value.dataset.uiSurface = "toolbar";
        value.dataset.theme = reader.theme();
        value.dataset.interaction = reader.interaction();
        value.dataset.readerMode = reader.mode();
        value.dataset.visible = reader.hud.visible() ? "true" : "false";
        value.dataset.hudLayer = String(reader.hud.mode.active());
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
          keepFocus: true,
          action({ name, button }) {
            if (name !== "command") return;
            const id = button?.dataset?.id || "";
            if (id) reader.hud.run(id);
          },
        });
        return value;
      },
    },
    tools: {
      open: false,
      transitioning: false,
      frame: null,
      instance() {
        return window.__ONLINER_LAUNCHPAD__ || null;
      },
      launcherHide() {
        const current = reader.tools.instance();
        const panel = current?.node?.panel?.();
        if (!panel) return false;
        panel.style.display = "none";
        return true;
      },
      launcherShow() {
        const current = reader.tools.instance();
        if (!current) return false;
        current.render?.({ place: true });
        return true;
      },
      enabled() {
        const value = reader.tools.instance();
        return Boolean(value?.snapshot && value?.runCommand);
      },
      active() {
        return reader.tools.enabled() && reader.tools.open === true;
      },
      title() {
        return reader.tools.active()
          ? "Назад"
          : "Инструменты";
      },
      set(value) {
        reader.tools.open = reader.tools.enabled() && value === true;
        return reader.tools.open;
      },
      reset() {
        reader.tools.open = false;
        reader.tools.instance()?.feed?.clear?.();
        return false;
      },
      markerVisual(button = null) {
        const panel = document.getElementById(reader.panel);
        const marker = button || panel?.querySelector('[data-action="tools"]');
        return marker?.querySelector?.(".launchpad-marker-visual") || null;
      },
      markerAnimation(node = null, motion = "exit") {
        return reader.tools.instance()?.feed?.markerAnimation?.(node, motion) || null;
      },
      headerVisuals(panel = null) {
        if (!panel) return [];
        const shell = panel.querySelector(".reader-header-shell");
        const marker = shell?.querySelector?.('[data-action="tools"]');
        if (!shell) return [];
        return Array.from(shell.children).filter((node) => (
          !marker || !node.contains(marker)
        ));
      },
      toggle(button = null) {
        if (reader.tools.transitioning) return reader.tools.active();
        const panel = document.getElementById(reader.panel);
        const feed = reader.tools.instance()?.feed;
        const current = reader.tools.markerVisual(button);
        const previous = reader.tools.headerVisuals(panel);
        const duration = feed?.motionDuration?.("marker", "exit") || 880;
        const apply = () => {
          const next = !reader.tools.active();
          if (!next) {
            reader.tools.reset();
          } else {
            reader.tools.set(true);
          }
          reader.panelSync();
          reader.hud.sync();
          const visuals = feed?.motion?.conceal?.(
            reader.tools.headerVisuals(panel),
          ) || [];
          const finish = () => {
            visuals.forEach((node) => node.style.removeProperty("opacity"));
            reader.tools.transitioning = false;
            reader.content()?.focus?.({ preventScroll: true });
          };
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
              const marker = reader.tools.markerVisual();
              const enter = reader.tools.markerAnimation(marker, "enter");
              const fade = feed?.motion?.fade?.(visuals, "in", {
                duration: feed?.motionDuration?.("marker", "enter") || duration,
              }) || Promise.resolve();
              Promise.all([
                enter?.finished?.catch?.(() => null) || Promise.resolve(),
                fade,
              ]).then(finish).catch(finish);
            });
          });
        };
        reader.tools.transitioning = true;
        const exit = reader.tools.markerAnimation(current, "exit");
        const fade = feed?.motion?.fade?.(previous, "out", { duration }) ||
          Promise.resolve();
        Promise.all([
          exit?.finished?.catch?.(() => null) || Promise.resolve(),
          fade,
        ]).then(apply).catch(apply);
        return reader.tools.active();
      },
      snapshot() {
        return reader.tools.instance()?.snapshot?.() || null;
      },
      expanded(snapshot = null) {
        const current = reader.tools.instance();
        const value = snapshot || reader.tools.snapshot();
        const groups = value?.groups || [];
        if (!current || !groups.length || !reader.tools.active()) return false;
        return Boolean(current.feed.focusedGroup?.(groups));
      },
      focused(snapshot = null) {
        const current = reader.tools.instance();
        const value = snapshot || reader.tools.snapshot();
        const groups = value?.groups || [];
        if (!current || !groups.length || !reader.tools.active()) return null;
        return current.feed.focusedGroup?.(groups) || null;
      },
      collapse(id = "", snapshot = null) {
        const current = reader.tools.instance();
        if (!current || !id) return false;
        if (current.popupMode?.(id)) return false;
        return current.command.collapse(id);
      },
      marker() {
        const current = reader.tools.instance();
        const snapshot = reader.tools.snapshot();
        if (!current || !snapshot?.marker) return "";
        return current.marker.content(snapshot.marker);
      },
      command(value) {
        const current = reader.tools.instance();
        if (!current) return "";
        const active = current.command.active(value)
          ? ' data-active="true"'
          : "";
        return ui.controls.button({
          content: current.command.content(value),
          action: "tool",
          classes: "reader-tools-command reader-hud-button",
          title: current.command.title(value),
          attrs: ` data-id="${commands.id(value)}" data-close="${value.close || ""}"${active} type="button"`,
        });
      },
      activeCommands(value) {
        const current = reader.tools.instance();
        if (!current) return [];
        return (value?.commands || []).filter((item) => {
          if (commands.separator(item)) return false;
          return current.command.active(item);
        });
      },
      previewActive() {
        return !reader.phone();
      },
      columns(list = []) {
        const size = Math.max(1, list.length);
        const rows = 6;
        const count = Math.max(1, Math.ceil(size / rows));
        const perColumn = Math.ceil(size / count);
        return Array.from({ length: count }, (_, index) =>
          list.slice(index * perColumn, index * perColumn + perColumn),
        ).filter((column) => column.length > 0);
      },
      popover(list = [], side = "left") {
        const columns = reader.tools.columns(list);
        if (!columns.length) return "";
        const height = Math.max(...columns.map((column) => column.length));
        const render = (column = []) =>
          `<div class="reader-tools-popover-column">${column.map((item, index) => `<div class="reader-tools-command-slot" style="--reader-tools-card-index:${index};--reader-tools-card-reverse-index:${height - index - 1}">${reader.tools.command(item)}</div>`).join("")}</div>`;
        const main = render(columns[0]);
        const extraList = columns.slice(1);
        const extra = extraList.length
          ? `<div class="reader-tools-popover-extra">${extraList.map(render).join("")}</div>`
          : "";
        return `<div class="reader-tools-popover-list" data-reader-tools-side="${side}"><div class="reader-tools-popover-main">${main}</div>${extra}</div>`;
      },
      dropdown(value, groups = [], side = "left") {
        const current = reader.tools.instance();
        if (!current) return "";
        const meta = current.feed.meta(value);
        if (!meta.icon) return current.htmlCommands(value?.commands || []);
        const head = `<span class="launchpad-tool-group-head" data-launchpad-group-head="true">${current.feed.button(value)}</span>`;
        const expanded = current.feed.active(meta.id, groups);
        const activeCommands = reader.tools.activeCommands(value);
        const preview = reader.tools.previewActive() && !expanded && activeCommands.length > 0;
        const list = expanded ? value?.commands || [] : activeCommands;
        const commands = reader.tools.popover(list, side);
        if (!commands) return head;
        return `<span class="launchpad-tool-group reader-tools-dropdown" data-launchpad-group="true" data-group-id="${meta.id}" data-expanded="${expanded ? "true" : "false"}" data-reader-tools-preview="${preview ? "true" : "false"}" data-reader-tools-side="${side}">${head}<span data-reader-tools-popover="true" aria-hidden="${expanded || preview ? "false" : "true"}"${expanded || preview ? "" : ' inert'}>${commands}</span></span>`;
      },
      iphoneClusters(list = [], limit = 6) {
        const size = Math.max(0, Number(limit) || 0);
        if (list.length <= size) return list;
        const drop = ["prep", "shift"];
        const reduced = drop.reduce((items, id) => {
          if (items.length <= size) return items;
          return items.filter((group) => group.id !== id);
        }, list);
        if (reduced.length <= size) return reduced;
        return reduced.slice(0, size);
      },
      clusters(snapshot = null) {
        const current = reader.tools.instance();
        const groups = snapshot?.groups || [];
        if (!current || !groups.length) return [];
        const list = current.group
          .emojis(groups)
          .filter(
            (group) =>
              group.id !== "pinned" &&
              group.id !== "toolbox",
          );
        if (!reader.phone()) {
          const shift = list.find((group) => group.id === "shift");
          if (!shift) return list;
          return [shift, ...list.filter((group) => group.id !== "shift")];
        }
        return reader.tools.iphoneClusters(list, 6);
      },
      split(list = []) {
        if (!list.length) {
          return { left: "", right: "" };
        }
        const current = reader.tools.instance();
        if (!current) return { left: "", right: "" };
        const pivot = Math.ceil(list.length / 2);
        return {
          left: list
            .slice(0, pivot)
            .map((group) =>
              ui.shell.group(reader.tools.dropdown(group, list, "left"), {
                rail: true,
                classes: "reader-tools-cluster",
              }),
            )
            .join(""),
          right: list
            .slice(pivot)
            .map((group) =>
              ui.shell.group(reader.tools.dropdown(group, list, "right"), {
                rail: true,
                classes: "reader-tools-cluster",
              }),
            )
            .join(""),
        };
      },
      content(markerButton = "") {
        const snapshot = reader.tools.snapshot();
        if (!snapshot) return "";
        const { left, right } = reader.tools.split(reader.tools.clusters(snapshot));
        return ui.shell.frame({
          left: left
            ? `<div class="reader-tools-side" data-sticky-group="left">${left}</div>`
            : "",
          main: ui.shell.group(markerButton, {
            rail: true,
            role: "marker",
            classes: "reader-tools-marker-group",
          }),
          right: right
            ? `<div class="reader-tools-side" data-sticky-group="right">${right}</div>`
            : "",
          classes: "reader-header-shell reader-tools-shell",
          pack: "center",
          attrs: ' data-reader-tools="true"',
        });
      },
      previewFor(panel = null, id = "") {
        if (!panel || !id) return null;
        return panel.querySelector(
          `.reader-tools-dropdown[data-group-id="${id}"][data-reader-tools-preview="true"] [data-reader-tools-popover="true"]`,
        );
      },
      previewClose(panel = null, id = "") {
        const node = reader.tools.previewFor(panel, id);
        if (!node) return Promise.resolve(false);
        const state = reader.tools.popoverState(panel).find(
          (value) => value.id === id && value.preview,
        );
        if (!state) return Promise.resolve(false);
        node.style.setProperty("visibility", "hidden", "important");
        const clone = document.createElement("span");
        clone.innerHTML = state.html;
        clone.setAttribute("data-reader-tools-popover", "true");
        clone.setAttribute("data-reader-tools-closing-clone", "true");
        clone.setAttribute("aria-hidden", "false");
        clone.dataset.readerToolsMotion = "closing";
        clone.style.setProperty("position", "fixed", "important");
        clone.style.setProperty("left", `${state.rect.left}px`, "important");
        clone.style.setProperty("top", `${state.rect.top}px`, "important");
        clone.style.setProperty("width", `${state.rect.width}px`, "important");
        clone.style.setProperty("z-index", "1000005", "important");
        panel.appendChild(clone);
        const slots = Array.from(clone.querySelectorAll(".reader-tools-command-slot"));
        return new Promise((resolve) => {
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            clone.remove();
            resolve(true);
          };
          const pending = new Set(slots);
          const ended = (event) => {
            if (!["readerToolsCardClose", "readerToolsFirstCardClose"].includes(event.animationName)) return;
            pending.delete(event.currentTarget);
            if (!pending.size) finish();
          };
          slots.forEach((slot) => slot.addEventListener("animationend", ended));
          requestAnimationFrame(() => {
            clone.getBoundingClientRect();
            requestAnimationFrame(() => {
              if (!clone.isConnected) return finish();
              clone.dataset.readerToolsMotion = "closed";
              if (!slots.length) finish();
            });
          });
          window.setTimeout(finish, 1800);
        });
      },
      run({ name = "", button = null, event = null } = {}) {
        const current = reader.tools.instance();
        if (!current || !reader.tools.active()) return false;
        const id = button?.dataset.id || "";
        const panel = document.getElementById(reader.panel);
        if (name === "group" && id && reader.tools.previewFor(panel, id)) {
          if (reader.tools.transitioning) return true;
          reader.tools.transitioning = true;
          reader.tools.previewClose(panel, id).finally(() => {
            current.click({ name, button, event });
            const preview = reader.tools.previewFor(panel, id);
            preview?.closest?.('[data-group-id]')?.remove?.();
            reader.panelSync();
            reader.hud.sync();
            reader.tools.transitioning = false;
          });
          return true;
        }
        current.click({ name, button, event });
        if (name === "tool") {
          const snapshot = reader.tools.snapshot();
          if (id && reader.tools.expanded(snapshot) && reader.tools.collapse(id, snapshot)) {
            current.feed.closeGroup(snapshot?.groups || []);
          }
        }
        reader.panelSync();
        reader.hud.sync();
        const focusBack =
          id &&
          !current.command.parameter?.({ id }) &&
          !["prepare", "refresh"].includes(id);
        if (focusBack) {
          reader.commandTarget()?.focus?.({ preventScroll: true });
        }
        return true;
      },
      popovers(panel = null) {
        if (!panel) return [];
        return Array.from(
          panel.querySelectorAll(
            '.reader-tools-dropdown[data-group-id]:is([data-expanded="true"],[data-reader-tools-preview="true"]) [data-reader-tools-popover="true"]',
          ),
        );
      },
      popoverState(panel = null) {
        return reader.tools.popovers(panel).map((node) => {
          const parent = node.closest('[data-group-id]');
          const rect = node.getBoundingClientRect();
          return {
            id: parent?.dataset.groupId || "",
            preview: parent?.dataset.readerToolsPreview === "true",
            signature: `${parent?.dataset.groupId || ""}:${parent?.dataset.readerToolsPreview === "true" ? "preview" : "expanded"}:${node.textContent || ""}`,
            html: node.innerHTML,
            rect: {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            },
            node,
          };
        }).filter((value) => value.id);
      },
      animateIcon(panel = null, id = "", motion = "") {
        if (!panel || !id || !motion) return;
        const button = panel.querySelector(`[data-action="group"][data-id="${id}"]`);
        if (!button) return;
        button.dataset.readerToolsIconMotion = motion;
        const clear = (event) => {
          if (!["readerToolsIconOpen", "readerToolsIconClose"].includes(event.animationName)) return;
          button.removeEventListener("animationend", clear);
          delete button.dataset.readerToolsIconMotion;
        };
        button.addEventListener("animationend", clear);
        window.setTimeout(() => {
          if (button.isConnected) delete button.dataset.readerToolsIconMotion;
        }, 800);
      },
      animateOpening(panel = null, before = []) {
        const previous = new Set(before.map((value) => value.signature));
        reader.tools.popoverState(panel).forEach(({ id, node, preview, signature }) => {
          if (previous.has(signature)) return;
          node.dataset.readerToolsMotion = "opening";
          if (!preview) reader.tools.animateIcon(panel, id, "opening");
          requestAnimationFrame(() => {
            if (!node.isConnected) return;
            node.getBoundingClientRect();
            requestAnimationFrame(() => {
              if (!node.isConnected) return;
              node.dataset.readerToolsMotion = "open";
            });
          });
        });
      },
      animateClosing(panel = null, before = []) {
        const current = new Set(reader.tools.popoverState(panel).map((value) => value.signature));
        before.forEach(({ id, html, rect, preview, signature }) => {
          if (current.has(signature) || !panel || !rect?.width || !rect?.height) return;
          const clone = document.createElement("span");
          clone.innerHTML = html;
          clone.setAttribute("data-reader-tools-popover", "true");
          clone.setAttribute("data-reader-tools-closing-clone", "true");
          clone.setAttribute("aria-hidden", "false");
          clone.dataset.readerToolsMotion = "closing";
          clone.style.setProperty("position", "fixed", "important");
          clone.style.setProperty("left", `${rect.left}px`, "important");
          clone.style.setProperty("top", `${rect.top}px`, "important");
          clone.style.setProperty("width", `${rect.width}px`, "important");
          clone.style.setProperty("z-index", "1000005", "important");
          panel.appendChild(clone);
          if (!preview) reader.tools.animateIcon(panel, id, "closing");
          const slots = Array.from(clone.querySelectorAll(".reader-tools-command-slot"));
          const pending = new Set(slots);
          const finish = (event) => {
            if (!["readerToolsCardClose", "readerToolsFirstCardClose"].includes(event.animationName)) return;
            pending.delete(event.currentTarget);
            if (pending.size) return;
            slots.forEach((slot) => slot.removeEventListener("animationend", finish));
            clone.remove();
          };
          slots.forEach((slot) => slot.addEventListener("animationend", finish));
          requestAnimationFrame(() => {
            if (!clone.isConnected) return;
            clone.getBoundingClientRect();
            requestAnimationFrame(() => {
              if (!clone.isConnected) return;
              clone.dataset.readerToolsMotion = "closed";
              if (!slots.length) clone.remove();
            });
          });
          window.setTimeout(() => clone.remove(), 3000);
        });
      },
      animatePopovers(panel = null, before = []) {
        if (!panel || !reader.tools.active()) return;
        reader.tools.animateOpening(panel, before);
        reader.tools.animateClosing(panel, before);
      },
      activeSync() {
        const panel = document.getElementById(reader.panel);
        if (!panel || !reader.tools.active()) return;
        panel.querySelectorAll('[data-action="tool"][data-id]').forEach((button) => {
          const id = button.dataset.id || "";
          if (actions.active(id)) {
            button.dataset.active = "true";
            return;
          }
          delete button.dataset.active;
        });
      },
      scheduleSync() {
        if (!reader.tools.previewActive() || !reader.tools.active()) return;
        if (reader.tools.frame) return;
        reader.tools.frame = requestAnimationFrame(() => {
          reader.tools.frame = null;
          reader.panelSync();
        });
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
    commandTarget() {
      const popup = document.getElementById("ui-popup");
      const field = popup?.hidden ? null : popup?.querySelector?.(".ui-field");
      if (field && typeof field.selectionStart === "number") return field;
      return reader.content();
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
      if (reader.phone()) return Math.max(16, value);
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
      if (typeof value.click === "function") {
        value.click();
        return;
      }
      if (window.switchEditors?.go) {
        window.switchEditors.go("content", "html");
        return;
      }
      if (window.switchEditors?.switchto) {
        window.switchEditors.switchto("content");
      }
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
      reader.hud.sync();
      if (!panel) return;
      panel.dataset.readerMode = profile.mode;
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
      reader.panelSync();
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
      const panel = document.getElementById(reader.panel);
      localStorage.setItem(reader.key("theme"), theme);
      if (style) style.textContent = reader.css();
      if (panel) panel.dataset.theme = theme;
      reader.panelSync();
      reader.hud.sync();
      reader.resize();
    },
    inlineSpin(button = null, direction = 1, count = 1) {
      const visual =
        button?.querySelector?.(".ui-icon-content") ||
        button?.querySelector?.(".reader-inline-spin-visual") || null;
      if (!visual) return false;
      const feed = reader.tools.instance()?.feed;
      const steps = Math.max(1, Math.round(Number(count) || 1));
      const duration = feed?.motionDuration?.("spin") || 480;
      const animation = ux.motion.spin(visual, direction, {
        base: "translateZ(0)",
        count: steps,
        duration: duration * steps,
        pulse: true,
      });
      return Boolean(animation);
    },
    sizeSpin(action = "", direction = 1, count = 1) {
      requestAnimationFrame(() => {
        const button = document
          .getElementById(reader.panel)
          ?.querySelector(`[data-action="${action}"]`);
        reader.inlineSpin(button, direction, count);
      });
    },
    size(step, button = null) {
      const range = reader.fontRange();
      const current = reader.font();
      const value = Math.max(range.min, Math.min(range.max, current + step));
      if (value === current) {
        reader.syncButtons();
        return;
      }
      reader.fontSet(value);
      reader.sizeSpin(button?.dataset?.action || "", step < 0 ? -1 : 1);
    },
    fontSet(value) {
      localStorage.setItem(reader.key("font"), String(value));
      reader.resize();
      reader.syncButtons();
    },
    sizeEdge(step, button = null) {
      const range = reader.fontRange();
      const current = reader.font();
      const value = step < 0 ? range.min : range.max;
      const count = Math.abs(value - current);
      if (!count) return;
      reader.fontSet(value);
      reader.sizeSpin(button?.dataset?.action || "", step < 0 ? -1 : 1, count);
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
    panelSync() {
      const panel = document.getElementById(reader.panel);
      if (!panel) return;
      const before = reader.tools.active()
        ? reader.tools.popoverState(panel)
        : [];
      if (!reader.tools.enabled()) reader.tools.reset();
      panel.dataset.readerTools = reader.tools.active() ? "true" : "false";
      panel.innerHTML = reader.controls();
      if (reader.tools.active()) {
        reader.tools.activeSync();
        reader.tools.animatePopovers(panel, before);
        return;
      }
      reader.syncButtons();
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
      const inlineSpinVisual = (content) =>
        `<span class="reader-inline-spin-visual">${content}</span>`;
      const smaller = button(
        "smaller",
        inlineSpinVisual(icon.emoji(glyph.smaller)),
        ` title="${reader.sizeTitle(-1)}" aria-label="${reader.sizeTitle(-1)}"`,
      );
      const bigger = button(
        "bigger",
        inlineSpinVisual(icon.emoji(glyph.bigger)),
        ` title="${reader.sizeTitle(1)}" aria-label="${reader.sizeTitle(1)}"`,
      );
      const markerAction = reader.tools.enabled() ? "tools" : "";
      const markerVisual = reader.tools.active()
        ? reader.tools.marker() || icon.emoji(reader.marker.emoji())
        : icon.emoji(reader.marker.emoji());
      const markerContent = markerVisual.includes("launchpad-marker-visual")
        ? markerVisual
        : `<span class="launchpad-marker-visual">${markerVisual}</span>`;
      const markerTitle = reader.tools.enabled()
        ? `${reader.marker.title()} \u00B7 ${reader.tools.title()}`
        : reader.marker.title();
      const marker = button(
        markerAction,
        markerContent,
        ` title="${markerTitle}" aria-label="${markerTitle}"`,
      );
      if (reader.tools.active()) return reader.tools.content(marker);
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
      const run = ({ name, kind, button, event }) => {
        if (kind === "hold") {
          if (name === "smaller") reader.sizeEdge(-1, button);
          if (name === "bigger") reader.sizeEdge(1, button);
          return;
        }
        if (name === "tools") return reader.tools.toggle(button);
        if (reader.tools.active()) {
          if (reader.tools.run({ name, button, event })) return;
        }
        if (name === "theme") return reader.toggle();
        if (name === "exit") return reader.exit();
        if (name === "smaller") return reader.size(-1, button);
        if (name === "bigger") return reader.size(1, button);
      };
      value.id = reader.panel;
      value.className = "panel";
      value.dataset.uiSurface = "toolbar";
      value.dataset.theme = reader.theme();
      value.dataset.readerMode = reader.mode();
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
        keepFocus: true,
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
      const surface = () => {
        reader.hud.sync();
      };
      const tools = () => reader.tools.scheduleSync();
      reader.listen(value, "keyup", auto);
      reader.listen(value, "click", auto);
      reader.listen(value, "input", auto);
      reader.listen(document, "selectionchange", auto);
      reader.listen(value, "keyup", hud);
      reader.listen(value, "click", hud);
      reader.listen(value, "input", hud);
      reader.listen(value, "pointerup", hud);
      reader.listen(document, "selectionchange", hud);
      reader.listen(value, "keyup", tools);
      reader.listen(value, "click", tools);
      reader.listen(value, "input", tools);
      reader.listen(value, "pointerup", tools);
      reader.listen(document, "selectionchange", tools);
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
        reader.listen(value, "focus", surface);
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
      reader.tools.reset();
      reader.tools.launcherHide();
      if (reader.tools.enabled()) reader.tools.set(true);
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
      if (reader.tools.frame) cancelAnimationFrame(reader.tools.frame);
      reader.tools.frame = null;
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
      reader.tools.launcherShow();
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
      reader.tools.reset();
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
