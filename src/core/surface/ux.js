import { ui } from "./ui.js";

const actions = {
  headless: {
    init() {
      return {
        timer: null,
        name: "",
        button: null,
        consumed: false,
        skip: "",
      };
    },
    clear(state) {
      if (!state?.timer) return;
      clearTimeout(state.timer);
      state.timer = null;
    },
    reset(state) {
      actions.headless.clear(state);
      state.name = "";
      state.button = null;
      state.consumed = false;
    },
    recentTouchScroll(panel, now = Date.now()) {
      if (panel?.dataset?.touchScroll === "true") return true;
      const stamp = Number(panel?.dataset?.touchScrollStamp || "0");
      if (!Number.isFinite(stamp) || stamp <= 0) return false;
      return now - stamp < 320;
    },
    held(hold = [], name = "") {
      return hold.includes(String(name || ""));
    },
    shouldSkipClick(state, name = "") {
      return Boolean(state?.skip) && state.skip === String(name || "");
    },
    consumeSkip(state, name = "") {
      if (!actions.headless.shouldSkipClick(state, name)) return false;
      state.skip = "";
      return true;
    },
  },
};

const glyph = {
  sync(target, html = "", key = "", options = {}) {
    if (!target) return false;
    const datasetKey = options.datasetKey || "uiGlyphKey";
    const nextKey = String(key || "");
    const currentKey = String(target.dataset?.[datasetKey] || "");
    const apply = () => {
      target.innerHTML = html;
      target.dataset[datasetKey] = nextKey;
      target.style.opacity = "1";
      target.style.transform = "scale(1)";
    };
    if (!currentKey) {
      apply();
      return true;
    }
    if (currentKey === nextKey) {
      target.innerHTML = html;
      return true;
    }
    clearTimeout(target._uiGlyphTimer);
    if (target._uiGlyphFrame) {
      cancelAnimationFrame(target._uiGlyphFrame);
      target._uiGlyphFrame = 0;
    }
    const scale = String(options.scale || "0.72");
    const outDelay = Number(options.outDelay) || 120;
    const outTransition = options.outTransition || "transform 120ms cubic-bezier(.4,0,.2,1)";
    const inTransition = options.inTransition || "transform 240ms cubic-bezier(.16,1,.3,1)";
    target.style.opacity = "1";
    target.style.transition = outTransition;
    target.style.transform = `scale(${scale})`;
    target._uiGlyphTimer = setTimeout(() => {
      target.innerHTML = html;
      target.dataset[datasetKey] = nextKey;
      target.style.transition = "none";
      target.style.opacity = "1";
      target.style.transform = `scale(${scale})`;
      target._uiGlyphFrame = requestAnimationFrame(() => {
        target.style.transition = inTransition;
        target.style.transform = "scale(1)";
      });
    }, outDelay);
    return true;
  },
  flash(button = null, options = {}) {
    const target = button?.querySelector?.(options.selector || ".ui-icon-content");
    if (!target) return false;
    const previous = target.innerHTML;
    clearTimeout(button._uiGlyphFlashTimer);
    target.style.transition = options.transition || "opacity 140ms ease, transform 180ms ease";
    target.style.opacity = options.opacity || "0.38";
    target.style.transform = options.transform || "scale(0.92)";
    const swap = (html = "") => {
      target.innerHTML = html;
      target.style.opacity = "1";
      target.style.transform = "scale(1)";
    };
    window.setTimeout(() => swap(options.html || previous), Number(options.inDelay) || 120);
    button._uiGlyphFlashTimer = setTimeout(() => {
      target.style.opacity = options.opacity || "0.38";
      target.style.transform = options.transform || "scale(0.92)";
      window.setTimeout(() => {
        if (typeof options.restore === "function") {
          options.restore(target, button);
          return;
        }
        swap(previous);
      }, Number(options.outDelay) || 120);
    }, Number(options.duration) || 860);
    return true;
  },
  apply: {
    names: {
      ready: "Ribbon",
      applied: "Ribbon Star",
      working: "Lock Closed Ribbon",
    },
    state({
      text = "",
      applied = "",
      same = (left, right) => left === right,
      locked = false,
      title = {},
    } = {}) {
      if (!String(text || "").trim()) {
        return {
          name: "disabled",
          title: title.disabled || "",
          fluent: glyph.apply.names.ready,
          fallback: glyph.apply.names.ready,
        };
      }
      if (locked) {
        return {
          name: "locked",
          title: title.locked || "",
          fluent: glyph.apply.names.ready,
          fallback: glyph.apply.names.ready,
        };
      }
      if (!same(text, applied)) {
        return {
          name: "pending",
          title: title.pending || "",
          fluent: glyph.apply.names.ready,
          fallback: glyph.apply.names.ready,
        };
      }
      return {
        name: "applied",
        title: title.applied || "",
        fluent: glyph.apply.names.applied,
        fallback: glyph.apply.names.ready,
      };
    },
    html(state = {}, size = 22) {
      return ui.controls.glyph(
        state.fluent || glyph.apply.names.ready,
        size,
        state.fallback || glyph.apply.names.ready,
      );
    },
    button(button = null, name = glyph.apply.names.applied, options = {}) {
      if (!button) return false;
      const target = button.querySelector?.(options.selector || ".ui-icon-content") || button;
      const applied = name === glyph.apply.names.applied;
      const working = name === glyph.apply.names.working;
      glyph.sync(
        target,
        ui.controls.glyph(name, Number(options.size) || 20, glyph.apply.names.ready),
        name,
        { datasetKey: options.datasetKey || "applyGlyphKey" },
      );
      ui.controls.pulse(button, working);
      button.toggleAttribute(options.appliedAttr || "data-apply-applied", applied);
      const datasetKey = options.appliedDataset || "applyApplied";
      if (applied) button.dataset[datasetKey] = "true";
      else delete button.dataset[datasetKey];
      return true;
    },
  },
};

const layout = {
  head: {
    width(node) {
      return node?.getBoundingClientRect?.().width || 0;
    },
    gap(root, name = "--rail-gap", fallback = 8) {
      const value = parseFloat(getComputedStyle(root || document.documentElement).getPropertyValue(name));
      return Number.isFinite(value) ? value : fallback;
    },
    items(items = []) {
      return (Array.isArray(items) ? items : [])
        .map((item) => (item?.node ? item : { node: item }))
        .filter((item) => item.node);
    },
    reset(items = []) {
      items.forEach((item) => {
        item.node.removeAttribute("data-head-flex");
        item.node.style.removeProperty("--ui-head-flex-width");
        item.node.style.removeProperty("--ui-head-flex-min");
        item.node.style.removeProperty("--ui-head-flex-gap");
        const parent = item.node.parentElement;
        if (parent?.dataset?.headTemplate === "true") {
          delete parent.dataset.headTemplate;
          parent.style.removeProperty("grid-template-columns");
        }
      });
    },
    groups(items = []) {
      return items.reduce((groups, item) => {
        const parent = item.node.parentElement;
        if (!parent?.classList?.contains("ui-strip")) return groups;
        const found = groups.find((group) => group.parent === parent);
        if (found) {
          found.items.push(item);
          return groups;
        }
        return [...groups, { parent, items: [item] }];
      }, []);
    },
    distributed(items = []) {
      return layout.head.groups(items).flatMap((group) => group.items);
    },
    spaces(items = []) {
      const groups = layout.head.groups(items);
      if (!groups.length) return Math.max(0, items.length - 1);
      return groups.reduce((sum, group) => sum + group.items.length + 1, 0);
    },
    measure(items = [], available = 0, gap = 0, edge = true) {
      const spaces = edge ? layout.head.spaces(items) : Math.max(0, items.length - 1);
      const gaps = gap * spaces;
      const fixed = items
        .filter((item) => item.flex !== true)
        .reduce((sum, item) => sum + layout.head.width(item.node), 0);
      const flexible = items.filter((item) => item.flex === true);
      const flexMin = flexible.reduce((sum, item) => sum + (Number(item.min) || 0), 0);
      return {
        fixed,
        flexible,
        gaps,
        needed: fixed + flexMin + gaps,
        remaining: Math.max(0, available - fixed - gaps),
      };
    },
    assign(items = [], available = 0, gap = 0, edge = false) {
      const value = layout.head.measure(items, available, gap, edge);
      const width = value.flexible.length
        ? Math.max(0, value.remaining / value.flexible.length)
        : 0;
      const groups = layout.head.groups(items);
      groups.forEach((group) => {
        const columns = [];
        if (edge) columns.push(`minmax(${gap}px, 1fr)`);
        group.items.forEach((item, index) => {
          const min = Number(item.min) || 0;
          const extra = item.flexGap === true ? gap * 2 : 0;
          columns.push(item.flex === true ? `minmax(${min}px, ${Math.floor(width + extra)}px)` : "max-content");
          if (index < group.items.length - 1) columns.push(`minmax(${gap}px, 1fr)`);
        });
        if (edge) columns.push(`minmax(${gap}px, 1fr)`);
        group.parent.dataset.headTemplate = "true";
        group.parent.style.setProperty("grid-template-columns", columns.join(" "));
      });
      if (!value.flexible.length) return Boolean(groups.length);
      value.flexible.forEach((item) => {
        const group = groups.find((group) => group.items.includes(item));
        const hasNeighbor = !group || group.items.length > 1;
        const extra = item.flexGap === true && hasNeighbor ? gap * 2 : 0;
        item.node.setAttribute("data-head-flex", "true");
        item.node.style.setProperty("--ui-head-flex-width", `${Math.floor(width)}px`);
        item.node.style.setProperty("--ui-head-flex-min", `${Number(item.min) || 0}px`);
        item.node.style.setProperty("--ui-head-flex-gap", `${Math.floor(extra / 2)}px`);
      });
      return true;
    },
    fit(root, options = {}) {
      if (!root?.dataset) return "line";
      const key = options.key || "headMode";
      const head = options.head || root.querySelector?.(options.selector || "[data-panel-head]");
      if (!head) {
        root.dataset[key] = "line";
        return "line";
      }
      root.dataset[key] = "line";
      const items = layout.head.items(options.items);
      const compactItems = layout.head.items(options.compactItems).length
        ? layout.head.items(options.compactItems)
        : items.filter((item) => item.flex === true);
      layout.head.reset([...items, ...compactItems]);
      const gap = layout.head.gap(root, options.gapVar || "--rail-gap", Number(options.gap) || 8);
      const lineNode = options.line || head.querySelector?.(".ui-line");
      const available = Number(options.width) || layout.head.width(lineNode) || layout.head.width(head) || layout.head.width(root);
      const lineItems = layout.head.distributed(items);
      const line = layout.head.measure(lineItems, available, gap, true);
      const mode = available > 0 && line.needed > available ? "compact" : "line";
      root.dataset[key] = mode;
      layout.head.assign(mode === "compact" ? compactItems : lineItems, available, gap, mode !== "compact");
      return mode;
    },
  },
};

const ux = { actions, glyph, layout };

export { ux };
