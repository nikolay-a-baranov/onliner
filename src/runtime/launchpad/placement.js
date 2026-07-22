import { toolbar } from "../../core/surface/toolbar.js";

const runtime = {
  valid(value) {
    return Number.isFinite(value?.left) && Number.isFinite(value?.top);
  },
  normalizeDock(value = null) {
    const target = value?.target || "floating";
    const side = value?.side || "floating";
    return { target, side };
  },
  readDock(panelNode) {
    return runtime.normalizeDock({
      target: panelNode?.dataset?.dockTarget,
      side: panelNode?.dataset?.dock,
    });
  },
  current(panelNode) {
    if (!panelNode) return null;
    const rect = panelNode.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      dock: runtime.readDock(panelNode),
      anchor: runtime.anchor(panelNode, rect),
    };
  },
  anchor(panelNode, panelRect = null) {
    if (!panelNode) return null;
    const marker =
      panelNode.querySelector?.("[data-ui-marker='true']") ||
      panelNode.querySelector?.("[data-launchpad-group-head='true']") ||
      panelNode.firstElementChild;
    const rect = marker?.getBoundingClientRect?.();
    const base = panelRect || panelNode.getBoundingClientRect();
    if (!rect || !base) return null;
    return {
      left: rect.left - base.left,
      top: rect.top - base.top,
    };
  },
  saved(getPosition = () => null) {
    const value = getPosition();
    if (!runtime.valid(value)) return null;
    return {
      left: value.left,
      top: value.top,
      dock: runtime.normalizeDock(value.dock),
      anchor: value.anchor || null,
    };
  },
  dock(panelNode) {
    return toolbar.behavior.dock({
      panel: panelNode,
      snap: toolbar.rail.dock.snap,
    });
  },
  dockApply(panelNode, dock, value = null) {
    toolbar.behavior.dockApply({
      panel: panelNode,
      dock,
      value,
      margin: toolbar.rail.dock.margin,
      edge: toolbar.rail.dock.edge,
      normalize(node, side, previous) {
        toolbar.behavior.dockNormalize({
          panel: node,
          side,
          previous,
          line: "[data-line]",
        });
      },
    });
  },
  apply(panelNode, value = null) {
    if (!panelNode || !runtime.valid(value)) return false;
    const dock = runtime.normalizeDock(value.dock);
    runtime.dockApply(panelNode, dock, {
      left: value.left,
      top: value.top,
    });
    runtime.anchorApply(panelNode, value);
    return true;
  },
  anchorApply(panelNode, value = null) {
    if (!panelNode || !value?.anchor) return false;
    const current = runtime.anchor(panelNode);
    if (!current) return false;
    const rect = panelNode.getBoundingClientRect();
    const next = {
      left: rect.left + Number(value.anchor.left || 0) - current.left,
      top: rect.top + Number(value.anchor.top || 0) - current.top,
    };
    panelNode.style.left = `${Math.round(next.left)}px`;
    panelNode.style.top = `${Math.round(next.top)}px`;
    return true;
  },
  persist(panelNode, setPosition = () => null, dock = null) {
    const current = runtime.current(panelNode);
    if (!current) return false;
    const next = {
      left: current.left,
      top: current.top,
      dock: runtime.normalizeDock(dock || current.dock),
      anchor: current.anchor,
    };
    setPosition(next);
    return next;
  },
  home: {
    screen() {
      const screen = toolbar.screen();
      return {
        left: screen.offsetLeft,
        top: screen.offsetTop,
        right: screen.offsetLeft + screen.width,
        bottom: screen.offsetTop + screen.height,
      };
    },
    bounds(workspaceNode = null) {
      const screen = runtime.home.screen();
      const rect = workspaceNode?.getBoundingClientRect?.() || null;
      if (!rect || rect.width <= 0 || rect.height <= 0) return screen;
      return {
        left: Math.max(screen.left, rect.left),
        top: Math.max(screen.top, rect.top),
        right: Math.min(screen.right, rect.right),
        bottom: Math.min(screen.bottom, rect.bottom),
      };
    },
    inset(bounds, edge = toolbar.rail.dock.edge) {
      return {
        left: bounds.left + edge,
        top: bounds.top + edge,
        right: bounds.right - edge,
        bottom: bounds.bottom - edge,
      };
    },
    point(
      panelNode,
      {
        mode = "top-left",
        bounds = null,
        edge = 0,
      } = {},
    ) {
      return toolbar.placement.point(panelNode, {
        mode,
        edge,
        bounds,
      });
    },
  },
  create({
    getPosition = () => null,
    setPosition = () => null,
    clearPosition = () => null,
    home = {},
  } = {}) {
    const placement = {
      home: {
        mode: home.mode || (() => "top-left"),
        workspaceNode:
          home.workspaceNode ||
          (() =>
            document.getElementById("post-body-content") ||
            document.getElementById("content") ||
            null),
        screen: runtime.home.screen,
        edge() {
          return toolbar.rail.dock.edge;
        },
        bounds() {
          return runtime.home.bounds(placement.home.workspaceNode());
        },
        inset(bounds) {
          return runtime.home.inset(bounds, placement.home.edge());
        },
        point(panelNode) {
          const bounds = placement.home.inset(placement.home.bounds());
          return runtime.home.point(panelNode, {
            mode: placement.home.mode(),
            edge: 0,
            bounds,
          });
        },
      },
      valid: runtime.valid,
      normalizeDock: runtime.normalizeDock,
      readDock: runtime.readDock,
      current: runtime.current,
      saved() {
        return runtime.saved(getPosition);
      },
      dock: runtime.dock,
      dockApply: runtime.dockApply,
      apply: runtime.apply,
      persist(panelNode, dock = null) {
        return runtime.persist(panelNode, setPosition, dock);
      },
      reset(panelNode) {
        if (!panelNode) return false;
        clearPosition();
        return runtime.apply(panelNode, {
          ...placement.home.point(panelNode),
          dock: { target: "floating", side: "floating" },
        });
      },
      safe(panelNode) {
        if (!panelNode) return false;
        const saved = placement.saved();
        if (saved) return runtime.apply(panelNode, saved);
        const current = runtime.current(panelNode);
        if (!current) return placement.reset(panelNode);
        return runtime.apply(panelNode, current);
      },
    };
    return placement;
  },
};

export const launchpadPlacement = runtime;
