import { panel } from "./core/panel.js";
import { toolbar } from "./core/toolbar.js";
import { icon } from "./core/icon.js";
import { ui } from "./core/ui.js";

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
      parseUser(value) {
        return String(value || "")
          .toLowerCase()
          .trim()
          .replace(/^@/, "");
      },
      userRole(context) {
        if (!context.user) return "owner";
        if (launcher.owners.includes(context.user)) return "owner";
        if (launcher.editors.includes(context.user)) return "editor";
        return "author";
      },
      allowed(item, role) {
        if (launcher.access[role] === "*") return true;
        return launcher.access[role].includes(item.id);
      },
      surface() {
        const url = new URL(location.href);
        const host = url.hostname.toLowerCase();
        const path = url.pathname.toLowerCase();
        const params = url.searchParams;
        const madtest = host === "madtest.ru";
        const onliner = host.endsWith("onliner.by");
        const article = document
          .querySelector('meta[property="og:type"]')
          ?.getAttribute("content");
        if (madtest && path.startsWith("/app")) return "madtest";
        if (!onliner) return "unsupported";
        if (params.get("action") === "edit") return "edit";
        if (path.includes("/wp-admin/")) return "edit";
        if (document.body?.classList?.contains("wp-admin")) return "edit";
        if (article === "article") return "published";
        if (document.querySelector(".news-container[data-post-id]"))
          return "published";
        if (/^\/\d{4}\/\d{2}\/\d{2}\//.test(path)) return "published";
        return "unsupported";
      },
      account() {
        const source =
          document
            .querySelector("#wp-admin-bar-user-info .username")
            ?.textContent?.trim() ||
          document.querySelector('meta[name="user:login"]')?.content ||
          document.querySelector('meta[name="user:username"]')?.content ||
          "";
        return launcher.scenarios.parseUser(source);
      },
      parseList(value) {
        if (!value) return [];
        return String(value)
          .toLowerCase()
          .split(/[\s,;|]+/)
          .map((item) => item.trim())
          .filter(Boolean);
      },
      visible(item, context) {
        return launcher.scenarios.match(item.when || {}, context, item.id);
      },
      context() {
        const root = document.documentElement;
        const body = document.body;
        const surface = launcher.scenarios.surface();
        const user = launcher.scenarios.account();
        const title = `${document.title || ""} ${
          root?.getAttribute("data-page-title") || ""
        }`.toLowerCase();
        const path = location.pathname.toLowerCase();
        const layout = document.querySelector("#layout_select")?.value || "";
        const type = launcher.scenarios.parseList(
          layout ||
            body?.dataset?.type ||
            body?.dataset?.entity ||
            root?.dataset?.pageType ||
            root?.dataset?.entityType ||
            document
              .querySelector('meta[name="page:type"],meta[property="og:type"]')
              ?.getAttribute("content"),
        );
        const status = launcher.scenarios.parseList(
          body?.dataset?.status ||
            root?.dataset?.status ||
            document
              .querySelector('meta[name="publication:status"]')
              ?.getAttribute("content"),
        );
        const role = launcher.scenarios.parseList(
          body?.dataset?.role ||
            body?.dataset?.userRole ||
            root?.dataset?.role ||
            root?.dataset?.userRole ||
            document.querySelector('meta[name="user:role"]')?.content,
        );
        const classList = [
          ...(body?.classList || []),
          ...(root?.classList || []),
        ]
          .map((item) => item.toLowerCase())
          .join(" ");
        const madtestImport = Boolean(
          document.querySelector(
            '.madtest[data-id],iframe[src*="madte.st"],a[href*="madte.st"]',
          ) ||
          /madte\.st\/[a-z0-9_-]+/i.test(
            document.documentElement?.innerHTML || "",
          ),
        );
        return {
          surface,
          user,
          title,
          path,
          type,
          status,
          role,
          classList,
          madtestImport,
        };
      },
      page: {
        longread(context) {
          return (
            context.type.includes("longread") ||
            context.path.includes("/longread/") ||
            context.classList.includes("longread")
          );
        },
        news(context) {
          return (
            context.type.includes("news") ||
            context.path.includes("/news/") ||
            context.classList.includes("news")
          );
        },
        photoreport(context) {
          return (
            context.type.includes("photoreport") ||
            context.path.includes("/photo/") ||
            context.path.includes("/photoreport/") ||
            context.classList.includes("photoreport")
          );
        },
        published(context) {
          return (
            context.status.includes("published") ||
            context.path.includes("/published/") ||
            /\bопублик|published\b/u.test(context.title)
          );
        },
        madtest(context) {
          return Boolean(context.madtestImport);
        },
      },
      role: {
        editor(context) {
          return (
            context.role.includes("editor") || context.role.includes("редактор")
          );
        },
        author(context) {
          return (
            context.role.includes("author") || context.role.includes("автор")
          );
        },
      },
      list() {
        return [
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
              "lead",
              "schedule",
              "toc",
              "publish",
              "editor",
            ],
          },
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
              "publish",
              "update",
              "editor",
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
            tools: ["dump", "diff", "reader"],
          },
          {
            type: "scenario",
            id: "author",
            title: "Автор",
            emoji: "🦈",
            when: {
              surface: ["edit"],
            },
            tools: ["sanitize", "readmore", "toc", "publish", "update"],
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
      run() {
        const context = launcher.scenarios.context();
        const role = launcher.scenarios.userRole(context);
        const list = launcher.scenarios
          .list()
          .filter((item) => launcher.scenarios.allowed(item, role));
        const visible = list.filter((item) =>
          launcher.scenarios.visible(item, context),
        );
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
        .map((scenario) =>
          ui.controls.button({
            content: icon.emoji(scenario.emoji || "🔖"),
            action: "scenario",
            title: scenario.title,
            classes: current?.id === scenario.id ? "is-active" : "",
            attrs: ` data-id="${scenario.id}" type="button"`,
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
      const scenarios = launcher.scenarios.run();
      if (!scenarios.length) return null;
      if (scenarios.some((item) => item.id === launcher.state.scenario)) {
        return scenarios.find((item) => item.id === launcher.state.scenario);
      }
      launcher.state.scenario = scenarios[0].id;
      return scenarios[0];
    },
    toolsByScenario() {
      const scenario = launcher.activeScenario();
      if (!scenario) return [];
      const context = launcher.scenarios.context();
      const map = new Map(launcher.tools.map((tool) => [tool.id, tool]));
      const visible = (id) => {
        if (
          scenario.id === "madtest" &&
          (context.path === "/app" || context.path === "/app/")
        ) {
          return id === "madtest-find";
        }
        if (id === "locator-madtest") return Boolean(context.madtestImport);
        return true;
      };
      return scenario.tools
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
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(src));
        (document.head || document.body || document.documentElement).append(
          script,
        );
      });
    },
    runFiles(files) {
      return launcher
        .manifest()
        .then((manifest) =>
          files.reduce(
            (chain, file) =>
              chain.then(() => launcher.load(launcher.toolUrl(file, manifest))),
            Promise.resolve(),
          ),
        )
        .catch(() => {});
    },
    runTool(id) {
      const tool = launcher.tools.find((item) => item.id === id);
      if (!tool) return;
      launcher.runFiles([tool.file]);
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
    contextKey(context) {
      return [
        context.surface,
        context.path,
        context.type.join("|"),
        context.status.join("|"),
        context.role.join("|"),
        context.classList,
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
  const fallbackScenarioList = launcher.scenarios.list.bind(launcher.scenarios);
  launcher.scenarios.include = (list, value) => {
    if (!Array.isArray(list) || !list.length) return true;
    return list.includes(value);
  };
  launcher.scenarios.any = (list, sample) => {
    if (!Array.isArray(sample) || !sample.length) return true;
    if (!Array.isArray(list) || !list.length) return false;
    return sample.some((item) => list.includes(item));
  };
  launcher.scenarios.text = (value, sample) => {
    if (!Array.isArray(sample) || !sample.length) return true;
    const string = String(value || "").toLowerCase();
    return sample.some((item) => string.includes(String(item).toLowerCase()));
  };
  launcher.scenarios.pageMatch = (context, sample) => {
    if (!Array.isArray(sample) || !sample.length) return true;
    const map = {
      longread: launcher.scenarios.page.longread(context),
      news: launcher.scenarios.page.news(context),
      photoreport: launcher.scenarios.page.photoreport(context),
      published: launcher.scenarios.page.published(context),
      madtest: launcher.scenarios.page.madtest(context),
    };
    return sample.some((item) => Boolean(map[item]));
  };
  launcher.scenarios.match = (when, context, mode) => {
    if (!launcher.scenarios.include(when.mode, mode)) return false;
    if (!launcher.scenarios.include(when.surface, context.surface))
      return false;
    if (!launcher.scenarios.any([context.user], when.user)) return false;
    if (!launcher.scenarios.pageMatch(context, when.page)) return false;
    if (!launcher.scenarios.any(context.role, when.role)) return false;
    if (!launcher.scenarios.any(context.status, when.status)) return false;
    if (!launcher.scenarios.any(context.type, when.type)) return false;
    if (!launcher.scenarios.text(context.path, when.path)) return false;
    if (!launcher.scenarios.text(context.title, when.title)) return false;
    if (!launcher.scenarios.text(context.classList, when.class)) return false;
    return true;
  };
  launcher.scenarios.external = () => {
    if (!Array.isArray(launcher.scenarioConfig)) return [];
    const fallback = new Map(
      fallbackScenarioList().map((item) => [item.id, item]),
    );
    return launcher.scenarioConfig
      .filter((item) => item && item.id && Array.isArray(item.tools))
      .map((item) => {
        const base = fallback.get(item.id) || {};
        return {
          id: item.id,
          title: item.title || base.title || item.id,
          emoji: item.emoji || base.emoji || "🔖",
          when: item.when || base.when || {},
          tools: item.tools,
        };
      });
  };
  launcher.scenarios.list = () => {
    const fallback = fallbackScenarioList();
    const external = launcher.scenarios.external();
    const map = new Map(fallback.map((item) => [item.id, item]));
    external.forEach((item) => map.set(item.id, item));
    return [...map.values()];
  };
  launcher.run();
})();
