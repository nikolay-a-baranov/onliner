import { panel } from "./core/panel.js";
import { toolbar } from "./core/toolbar.js";
import { icon } from "./core/icon.js";
import { ui } from "./core/ui.js";
import { context } from "./runtime/context.js";
import { scenario } from "./runtime/scenario.js";
import { runner } from "./runtime/runner.js";

(() => {
  const launcher = {
    id: "launcher-panel",
    tools: "__LAUNCHER_TOOLS__",
    scenarioConfig: "__LAUNCHER_SCENARIOS__",
    state: {
      manifest: null,
      scenario: "",
      position: "launcher-panel-position",
      theme: "launcher-panel-theme",
      dock: { target: "floating", side: "" },
      controller: null,
      layoutInput: null,
      layoutSync: null,
      contextTimer: 0,
    },
    access: {
      owner: "*",
      editor: [
        "longread",
        "news",
        "photoreport",
        "revision",
        "correction",
        "madtest",
      ],
      author: ["author", "correction", "madtest"],
    },
    owners: ["baranov", ""],
    editors: ["editor1", "editor2"],
    scenarios: {
      userRole(value) {
        if (!value.user) return "owner";
        if (launcher.owners.includes(value.user)) return "owner";
        if (launcher.editors.includes(value.user)) return "editor";
        return "author";
      },
      allowed(item, role) {
        if (launcher.access[role] === "*") return true;
        return launcher.access[role].includes(item.id);
      },
      context() {
        return context.detect();
      },
      fallback() {
        return [
          {
            type: "scenario",
            id: "news",
            title: "Новость",
            emoji: "🗞️",
            when: {
              surface: ["edit"],
              page: ["news"],
            },
            tools: [
              "cleanup",
              "proofread",
              "reader",
              "lead",
              "save",
              "private",
              "publish",
              "update",
              "editor",
            ],
          },
          {
            type: "scenario",
            id: "longread",
            title: "Лонгрид",
            emoji: "📰",
            when: {
              surface: ["edit"],
              page: ["longread"],
            },
            tools: [
              "cleanup",
              "proofread",
              "reader",
              "toc",
              "lead",
              "schedule",
              "save",
              "private",
              "publish",
            ],
          },
          {
            type: "scenario",
            id: "photoreport",
            title: "Фоторепортаж",
            emoji: "📸",
            when: {
              surface: ["edit"],
              page: ["photoreport"],
            },
            tools: [
              "cleanup",
              "proofread",
              "reader",
              "lead",
              "schedule",
              "save",
              "private",
              "publish",
              "editor",
            ],
          },
          {
            type: "scenario",
            id: "revision",
            title: "Ревизия",
            emoji: "📑",
            when: {
              surface: ["edit"],
            },
            tools: ["dump", "diff", "reader", "editor"],
          },
          {
            type: "scenario",
            id: "author",
            title: "Автор",
            emoji: "🦈",
            when: {
              surface: ["edit"],
            },
            tools: [
              "embed",
              "sanitize",
              "readmore",
              "toc",
              "private",
              "save",
              "publish",
              "update",
            ],
          },
          {
            type: "scenario",
            id: "correction",
            title: "Поправка",
            emoji: "⛑️",
            when: {
              surface: ["published"],
            },
            tools: ["locator", "locator-madtest"],
          },
          {
            type: "scenario",
            id: "madtest",
            title: "Madtest",
            emoji: "🧪",
            when: {
              surface: ["madtest"],
            },
            tools: [
              "madtest",
              "madtest-find",
              "madtest-export",
              "madtest-cleanup",
              "madtest-editor",
            ],
          },
        ];
      },
      list() {
        return scenario.list(
          launcher.scenarios.fallback(),
          launcher.scenarioConfig,
        );
      },
      run() {
        const value = launcher.scenarios.context();
        const role = launcher.scenarios.userRole(value);
        const list = launcher.scenarios.list().filter((item) =>
          launcher.scenarios.allowed(item, role),
        );
        const visible = scenario.visible(value, list, role);
        if (visible.length) return visible;
        return [];
      },
    },
    node: {
      panel() {
        return document.getElementById(launcher.id);
      },
    },
    theme() {
      return toolbar.state(launcher.state.theme) || "light";
    },
    setTheme(theme) {
      const panel = launcher.node.panel();
      toolbar.state(launcher.state.theme, theme);
      if (!panel) return;
      ui.surface.sync(panel, {
        layout: "fullscreen",
        theme,
        surface: "toolbar",
      });
    },
    baseUrl() {
      const current = document.currentScript;
      if (current && current.src) return new URL(".", current.src);
      const fallback = [...document.querySelectorAll("script[src]")].find(
        (script) => /\/dist\/launcher\.js(?:\?|$)/.test(script.src),
      );
      return new URL(".", fallback?.src || location.href);
    },
    icon(value) {
      const source = String(value || "").trim();
      const match = source.match(/^favicon:(.+)$/i);
      if (!match) return icon.emoji(source || "🔖");
      const domain = match[1].trim();
      if (!domain) return icon.emoji("🔖");
      return icon.logo.favicon(domain, domain, "toolbar-logo");
    },
    html() {
      const scenarios = launcher.scenarios.run();
      const current = launcher.activeScenario();
      const active = launcher.toolsByScenario();
      const theme = launcher.theme();
      const lineButtons = active
        .map((tool) =>
          ui.controls.button({
            content: launcher.icon(tool.title || "🔖"),
            action: "tool",
            attrs: ` data-id="${tool.id}" type="button"`,
          }),
        )
        .join("");
      const scenarioButtons = scenarios
        .map((item) =>
          ui.controls.button({
            content: icon.emoji(item.emoji || "🔖"),
            action: "scenario",
            title: item.title,
            classes: current?.id === item.id ? "is-active" : "",
            attrs: ` data-id="${item.id}" type="button"`,
          }),
        )
        .join("");
      const left = ui.shell.group(scenarioButtons, {
        stick: "left",
        rail: true,
      });
      const main = ui.shell.strip(lineButtons);
      const right = ui.shell.group(
        `${ui.controls.button({ content: icon.emoji(toolbar.appearance.themeToggleIcon(theme)), action: "theme", attrs: ` type="button"` })}${ui.controls.button({ content: icon.emoji("❌", "launcher"), action: "close", attrs: ` type="button"` })}`,
        {
          stick: "right",
          rail: true,
        },
      );
      return ui.shell.shell({ left, main, right });
    },
    activeScenario() {
      const current = scenario.resolve(
        launcher.state.scenario,
        launcher.scenarios.run(),
      );
      if (!current) return null;
      launcher.state.scenario = current.id;
      return current;
    },
    toolsByScenario() {
      const current = launcher.activeScenario();
      if (!current) return [];
      const value = launcher.scenarios.context();
      const map = new Map(launcher.tools.map((tool) => [tool.id, tool]));
      const visible = (id) => {
        if (current.id === "madtest" && (value.path === "/app" || value.path === "/app/")) {
          return id === "madtest-find";
        }
        if (id === "locator-madtest") return Boolean(value.madtestImport);
        return true;
      };
      return current.tools
        .filter((id) => visible(id))
        .map((id) => map.get(id))
        .filter(Boolean);
    },
    position(value) {
      return toolbar.state(launcher.state.position, value);
    },
    dock(panel) {
      return toolbar.behavior.dock({
        panel,
        snap: toolbar.rail.dock.snap,
      });
    },
    dockApply(panel, dock, value = null) {
      toolbar.behavior.dockApply({
        panel,
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
    place() {
      const panel = launcher.node.panel();
      if (!panel) return;
      const saved = launcher.position();
      if (!saved) {
        panel.style.removeProperty("left");
        panel.style.removeProperty("top");
        panel.style.removeProperty("right");
        panel.style.removeProperty("bottom");
        panel.style.removeProperty("transform");
        launcher.dockApply(panel, { target: "floating", side: "" });
        return;
      }
      const dock = saved.dock || { target: "floating", side: "" };
      launcher.state.dock = dock;
      launcher.dockApply(panel, dock, saved);
    },
    render() {
      const panel = launcher.node.panel();
      if (!panel) return;
      toolbar.appearance.rerender(
        panel,
        () => {
          panel.innerHTML = launcher.html();
        },
        (shot) => {
          const dock = {
            target:
              shot?.dock?.target || launcher.state.dock?.target || "floating",
            side:
              shot?.dock?.side === "floating"
                ? ""
                : shot?.dock?.side || launcher.state.dock?.side || "",
          };
          const current = {
            left: shot?.left ?? panel.getBoundingClientRect().left,
            top: shot?.top ?? panel.getBoundingClientRect().top,
          };
          launcher.state.dock = dock;
          launcher.dockApply(panel, dock, current);
        },
      );
      launcher.bindLine();
    },
    mount() {
      const node = panel.create({
        id: launcher.id,
        className: "panel launcher-panel",
        place: "right",
        html: launcher.html(),
      });
      node.dataset.theme = launcher.theme();
      const preset = toolbar.presets.singleRowDocked("content");
      launcher.state.controller = toolbar.creature({
        panel: node,
        ...preset,
        theme: () => launcher.theme(),
        actions: {
          action: launcher.click,
        },
        drag: {
          ...preset.drag,
          onMove() {
            const rect = node.getBoundingClientRect();
            toolbar.hint.update(node, {
              dock: launcher.dock(node),
              value: { left: rect.left, top: rect.top },
              margin: toolbar.rail.dock.margin,
              edge: toolbar.rail.dock.edge,
              floating:
                node.dataset.dock === "left" || node.dataset.dock === "right",
            });
          },
          onEnd({ moved } = {}) {
            if (!moved) return;
            const rect = node.getBoundingClientRect();
            const dock = launcher.dock(node);
            launcher.state.dock = dock;
            launcher.dockApply(node, dock, { left: rect.left, top: rect.top });
            launcher.position({ left: rect.left, top: rect.top, dock });
          },
        },
      });
      launcher.state.controller.appearance.sync();
      launcher.place();
      launcher.bind();
      launcher.state.context = launcher.scenarios.context();
      launcher.observeLayout();
      window.addEventListener("resize", launcher.place);
    },
    unmount() {
      const panel = launcher.node.panel();
      if (panel) {
        launcher.state.controller?.behavior.destroy();
        launcher.state.controller = null;
        panel.remove();
      }
      launcher.state.layoutObserver?.disconnect();
      launcher.state.layoutObserver = null;
      window.removeEventListener("resize", launcher.place);
      if (launcher.state.contextTimer) {
        window.clearInterval(launcher.state.contextTimer);
      }
      launcher.state.contextTimer = 0;
      if (launcher.state.layoutInput && launcher.state.layoutSync) {
        launcher.state.layoutInput.removeEventListener(
          "change",
          launcher.state.layoutSync,
        );
      }
      launcher.state.layoutInput = null;
      launcher.state.layoutSync = null;
    },
    manifest() {
      if (launcher.state.manifest)
        return Promise.resolve(launcher.state.manifest);
      let target = null;
      try {
        target = new URL("manifest.json", launcher.baseUrl());
      } catch {
        launcher.state.manifest = {};
        return Promise.resolve(launcher.state.manifest);
      }
      if (target.origin !== location.origin) {
        launcher.state.manifest = {};
        return Promise.resolve(launcher.state.manifest);
      }
      const url = target.href;
      return fetch(url, { cache: "no-store" })
        .then((response) => {
          if (!response.ok) throw new Error("manifest");
          return response.json();
        })
        .then((data) => {
          launcher.state.manifest = data || {};
          return launcher.state.manifest;
        })
        .catch(() => {
          launcher.state.manifest = {};
          return launcher.state.manifest;
        });
    },
    version(file, manifest) {
      if (manifest && manifest[file] && manifest[file].version) {
        return manifest[file].version;
      }
      return String(Date.now());
    },
    toolUrl(file, manifest) {
      return new URL(
        `${file}?v=${launcher.version(file, manifest)}`,
        launcher.baseUrl(),
      ).href;
    },
    load(src) {
      const localHttp = (value) => {
        let url = null;
        try {
          url = new URL(value, location.href);
        } catch {
          return "";
        }
        const localHost =
          url.hostname === "localhost" ||
          url.hostname === "127.0.0.1" ||
          /^10\./.test(url.hostname) ||
          /^192\.168\./.test(url.hostname) ||
          /^172\.(1[6-9]|2\d|3[0-1])\./.test(url.hostname);
        if (!localHost || url.protocol !== "https:") return "";
        return `http://${url.host}${url.pathname}${url.search}${url.hash}`;
      };
      const mount = (url) =>
        new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = url;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(url));
          (document.head || document.body || document.documentElement).append(
            script,
          );
        });
      return mount(src).catch(() => {
        const fallback = localHttp(src);
        if (!fallback) throw new Error(src);
        return mount(fallback);
      });
    },
    runTool(id) {
      return runner.run({
        id,
        tools: launcher.tools,
        manifest: launcher.manifest,
        load: launcher.load,
        toolUrl: launcher.toolUrl,
      });
    },
    click({ name, button }) {
      const panel = launcher.node.panel();
      if (panel?.dataset.moved === "true") {
        panel.dataset.moved = "false";
        return;
      }
      if (!button) return;
      const action = name || "";
      const id = button.dataset.id || "";
      if (action === "close") {
        launcher.unmount();
        return;
      }
      if (action === "theme") {
        const theme = launcher.theme() === "light" ? "dark" : "light";
        launcher.setTheme(theme);
        launcher.render();
        return;
      }
      if (action === "scenario") {
        launcher.state.scenario = id;
        launcher.render();
        return;
      }
      if (action === "tool") {
        launcher.runTool(id);
      }
    },
    bindLine() {
      const panel = launcher.node.panel();
      if (!panel) return;
      toolbar.behavior.line({
        panel,
        strip: "[data-line]",
        count: () => 3,
        axis: () =>
          panel.dataset.dock === "left" || panel.dataset.dock === "right"
            ? "y"
            : "x",
        bound: "launcher",
      });
    },
    contextKey(value) {
      return [
        value.surface,
        value.path,
        value.type.join("|"),
        value.status.join("|"),
        value.role.join("|"),
        value.classList,
      ].join("::");
    },
    syncContext() {
      const next = launcher.scenarios.context();
      const current = launcher.state.context || {};
      if (launcher.contextKey(next) === launcher.contextKey(current)) return;
      launcher.state.context = next;
      launcher.state.scenario = "";
      launcher.render();
    },
    observeLayout() {
      const layout = document.querySelector("#layout_select");
      const sync = () => launcher.syncContext();
      if (layout) {
        layout.addEventListener("change", sync);
      }
      launcher.state.contextTimer = window.setInterval(sync, 500);
      launcher.state.layoutInput = layout;
      launcher.state.layoutSync = sync;
    },
    bind() {
      const panel = launcher.node.panel();
      if (!panel) return;
      launcher.bindLine();
      launcher.state.controller?.behavior.bind();
    },
    run() {
      if (launcher.node.panel()) {
        launcher.unmount();
        return;
      }
      launcher.mount();
    },
  };
  launcher.run();
})();
