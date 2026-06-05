import { panel } from "./core/panel.js";
import { toolbar } from "./core/toolbar.js";
import { icon } from "./core/icon.js";
import { ui } from "./core/ui.js";
import { context } from "./runtime/context.js";
import { scenario } from "./runtime/scenario.js";
import { runner } from "./runtime/runner.js";
import { runtimeScenarios } from "./runtime/scenarios.js";

(() => {
  const launcher = {
    id: "launcher-panel",
    catalog: "__LAUNCHER_TOOLS__",
    state: {
      manifest: null,
      scenario: "",
      position: "launcher-panel-position",
      theme: "launcher-panel-theme",
      currentTheme: "",
      dock: { target: "floating", side: "" },
      controller: null,
      layoutInput: null,
      layoutSync: null,
      contextTimer: 0,
      debugKey: "",
    },
    scenarios: {
      userRole(value) {
        if (value.role.includes("editor")) return "editor";
        if (value.role.includes("author")) return "author";
        if (!value.user) return "unknown";
        return "author";
      },
      identity(value) {
        const realUser = value.user;
        const realRole = launcher.scenarios.userRole(value);
        const previewRole = launcher.preview.role(value, realUser);
        if (previewRole) {
          return {
            realUser,
            realRole,
            effectiveUser: "__preview__",
            effectiveRole: previewRole,
            previewRole,
            previewMode: true,
            impersonation: true,
          };
        }
        if (realUser !== "baranov") {
          return {
            realUser,
            realRole,
            effectiveUser: realUser,
            effectiveRole: realRole,
            previewRole: "",
            previewMode: false,
            impersonation: false,
          };
        }
        try {
          const nextUser = localStorage.getItem("ONLINER_LAUNCHER_USER") || "";
          const nextRole = localStorage.getItem("ONLINER_LAUNCHER_ROLE") || "";
          return {
            realUser,
            realRole,
            effectiveUser: nextUser || realUser,
            effectiveRole: nextRole || realRole,
            previewRole: "",
            previewMode: false,
            impersonation: Boolean(nextUser || nextRole),
          };
        } catch {
          return {
            realUser,
            realRole,
            effectiveUser: realUser,
            effectiveRole: realRole,
            previewRole: "",
            previewMode: false,
            impersonation: false,
          };
        }
      },
      context() {
        return context.detect();
      },
      list() {
        return scenario.external(runtimeScenarios, []);
      },
      run() {
        const value = launcher.scenarios.context();
        const identity = launcher.scenarios.identity(value);
        const visible = scenario.visible(
          value,
          launcher.scenarios.list(),
          identity.effectiveRole,
        );
        if (visible.length) return visible;
        return [];
      },
    },
    preview: {
      key: "ONLINER_LAUNCHER_PREVIEW_ROLE",
      usage() {
        return {
          setAuthor: 'localStorage.ONLINER_LAUNCHER_PREVIEW_ROLE = "author"',
          setEditor: 'localStorage.ONLINER_LAUNCHER_PREVIEW_ROLE = "editor"',
          clear: 'localStorage.removeItem("ONLINER_LAUNCHER_PREVIEW_ROLE")',
        };
      },
      enabled(value, user) {
        return user === "baranov" && value.surface === "adminPost";
      },
      role(value, user) {
        if (!launcher.preview.enabled(value, user)) return "";
        try {
          const role = localStorage.getItem(launcher.preview.key) || "";
          if (role === "author" || role === "editor") return role;
          return "";
        } catch {
          return "";
        }
      },
      cycle(value, user) {
        if (!launcher.preview.enabled(value, user)) return "";
        const current = launcher.preview.role(value, user);
        const next =
          current === ""
            ? "author"
            : current === "author"
              ? "editor"
              : "";
        try {
          if (next) localStorage.setItem(launcher.preview.key, next);
          else localStorage.removeItem(launcher.preview.key);
        } catch {}
        return next;
      },
    },
    marker: {
      meta(value) {
        const current = (() => {
          const scenario = value.activeScenario || {};
          if (scenario.id === "published") {
            return {
              emoji: "\uD83E\uDDEF",
              title: "\u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430",
              label: "\u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430",
              action: "scenario",
            };
          }
          if (scenario.id === "madtest") {
            return {
              emoji: "\u2697\uFE0F",
              title: "Madtest",
              label: "Madtest",
              action: "scenario",
            };
          }
          if (value.context.surface !== "adminPost") return null;
          const action = value.realUser === "baranov" ? "preview-role" : "scenario";
          if (value.realUser === "baranov" && !value.previewRole) {
            return {
              emoji: "\uD83D\uDC7A",
              title: "\u0421\u0443\u043F\u0435\u0440\u0440\u0435\u0436\u0438\u043C",
              label: "\u0421\u0443\u043F\u0435\u0440\u0440\u0435\u0436\u0438\u043C \u00B7 \u043D\u0430\u0436\u043C\u0438\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0440\u043E\u043B\u0438",
              action,
            };
          }
          if (value.effectiveRole === "author") {
            return {
              emoji: "\uD83E\uDD88",
              title: "\u0416\u0443\u0440\u043D\u0430\u043B\u0438\u0441\u0442",
              label: "\u0416\u0443\u0440\u043D\u0430\u043B\u0438\u0441\u0442 \u00B7 \u043D\u0430\u0436\u043C\u0438\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0440\u0435\u0436\u0438\u043C",
              action,
            };
          }
          if (value.effectiveRole === "editor") {
            return {
              emoji: "\uD83D\uDC1D",
              title: "\u041A\u043E\u0440\u0440\u0435\u043A\u0442\u043E\u0440",
              label: "\u041A\u043E\u0440\u0440\u0435\u043A\u0442\u043E\u0440 \u00B7 \u043D\u0430\u0436\u043C\u0438\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0440\u0435\u0436\u0438\u043C",
              action,
            };
          }
          return null;
        })();
        if (current) return current;
        const scenario = value.activeScenario || {};
        if (scenario.id === "published") {
          return { emoji: "\uD83E\uDDEF", title: "Published", action: "scenario" };
        }
        if (scenario.id === "madtest") {
          return { emoji: "\u2697\uFE0F", title: "Madtest", action: "scenario" };
        }
        if (value.context.surface === "adminPost") {
          const action = value.realUser === "baranov" ? "preview-role" : "scenario";
          if (value.realUser === "baranov" && !value.previewMode) {
            return { emoji: "\uD83D\uDC7A", title: "Superuser", action };
          }
          if (value.effectiveRole === "author") {
            return { emoji: "\uD83E\uDD88", title: "Author", action };
          }
          if (value.effectiveRole === "editor") {
            return { emoji: "\uD83D\uDC1D", title: "Editor", action };
          }
        }
        return {
          emoji: scenario.emoji || "\uD83D\uDD16",
          title: scenario.title || scenario.id || "Launcher",
          action: "scenario",
        };
      },
    },
    command: {
      id(value) {
        return String(value?.id || "");
      },
      toolId(value) {
        return String(value?.toolId || "");
      },
      normalize(value) {
        if (typeof value === "string") {
          return {
            id: value,
            toolId: value,
          };
        }
        return {
          id: String(value?.id || ""),
          toolId: String(value?.id || ""),
          users: Array.isArray(value?.users) ? value.users : [],
          roles: Array.isArray(value?.roles) ? value.roles : [],
        };
      },
      allowed(value, user, role) {
        const users = Array.isArray(value?.users) ? value.users : [];
        const roles = Array.isArray(value?.roles) ? value.roles : [];
        if (!users.length && !roles.length) return true;
        if (users.includes(user)) return true;
        if (roles.includes(role)) return true;
        return false;
      },
      reason(value, user, role) {
        const users = Array.isArray(value?.users) ? value.users : [];
        const roles = Array.isArray(value?.roles) ? value.roles : [];
        if (!users.length && !roles.length) return "";
        if (users.includes(user) || roles.includes(role)) return "";
        if (users.length && roles.length) return "users|roles";
        if (users.length) return "users";
        if (roles.length) return "roles";
        return "";
      },
    },
    group: {
      normalizeScenario(value) {
        const groups = Array.isArray(value?.groups) ? value.groups : [];
        if (groups.length) return groups.map((item) => launcher.group.normalize(item));
        const tools = Array.isArray(value?.tools) ? value.tools : [];
        return [
          launcher.group.normalize({
            id: "tools",
            title: "",
            commands: tools,
          }),
        ];
      },
      normalize(value) {
        return {
          id: String(value?.id || ""),
          title: String(value?.title || ""),
          commands: Array.isArray(value?.commands)
            ? value.commands.map((item) => launcher.command.normalize(item))
            : [],
        };
      },
      allow(value, user, role) {
        const commands = Array.isArray(value?.commands) ? value.commands : [];
        const next = commands.filter((command) =>
          launcher.command.allowed(command, user, role),
        );
        return {
          id: String(value?.id || ""),
          title: String(value?.title || ""),
          commands: next,
        };
      },
      attach(value, tools) {
        const map = new Map(tools.map((tool) => [tool.id, tool]));
        const commands = (Array.isArray(value?.commands) ? value.commands : [])
          .map((command) => {
            const tool = map.get(launcher.command.toolId(command)) || null;
            if (!tool) return null;
            return {
              ...command,
              tool,
            };
          })
          .filter(Boolean);
        return {
          id: String(value?.id || ""),
          title: String(value?.title || ""),
          commands,
          tools: commands.map((command) => command.tool),
        };
      },
      empty(value) {
        return !(Array.isArray(value?.commands) && value.commands.length);
      },
      tools(value) {
        return Array.isArray(value?.tools) ? value.tools : [];
      },
    },
    node: {
      panel() {
        return document.getElementById(launcher.id);
      },
    },
    theme() {
      if (launcher.state.currentTheme) return launcher.state.currentTheme;
      const panel = launcher.node.panel();
      const current =
        panel?.dataset.theme || toolbar.state(launcher.state.theme) || "light";
      launcher.state.currentTheme = current;
      return current;
    },
    syncTheme(value = "") {
      const panel = launcher.node.panel();
      const theme =
        value || panel?.dataset.theme || toolbar.state(launcher.state.theme) || "light";
      launcher.state.currentTheme = theme;
      toolbar.state(launcher.state.theme, theme);
      if (!panel) return theme;
      ui.surface.sync(panel, {
        layout: "fullscreen",
        theme,
        surface: "toolbar",
      });
      return theme;
    },
    setTheme(theme) {
      launcher.state.currentTheme = theme;
      const panel = launcher.node.panel();
      toolbar.state(launcher.state.theme, theme);
      if (!panel) return theme;
      ui.surface.sync(panel, {
        layout: "fullscreen",
        theme,
        surface: "toolbar",
      });
      return theme;
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
    debug: {
      enabled() {
        const params = new URL(location.href).searchParams;
        if (params.get("launcherDebug") === "1") return true;
        try {
          return localStorage.getItem("ONLINER_LAUNCHER_DEBUG") === "1";
        } catch {
          return false;
        }
      },
      key(value) {
        return JSON.stringify({
          context: value.context,
          role: value.role,
          realUser: value.realUser,
          realRole: value.realRole,
          effectiveUser: value.effectiveUser,
          effectiveRole: value.effectiveRole,
          previewRole: value.previewRole,
          previewMode: value.previewMode,
          impersonation: value.impersonation,
          marker: value.marker,
          scenarios: value.scenarios.map((item) => item.id),
          activeScenario: value.activeScenario?.id || "",
          toolIds: value.allowedToolIds,
          deniedToolIds: value.deniedToolIds,
          missingToolIds: value.missingToolIds,
        });
      },
      sync(value) {
        window.__ONLINER_LAUNCHER_DEBUG__ = value;
        if (!launcher.debug.enabled()) return value;
        const key = launcher.debug.key(value);
        if (launcher.state.debugKey === key) return value;
        launcher.state.debugKey = key;
        console.log("ONLINER_LAUNCHER_DEBUG", value);
        return value;
      },
    },
    snapshot() {
      const contextValue = launcher.scenarios.context();
      const identity = launcher.scenarios.identity(contextValue);
      const scenarios = scenario.visible(
        contextValue,
        launcher.scenarios.list(),
        identity.effectiveRole,
      );
      const activeScenario = scenario.resolve(launcher.state.scenario, scenarios);
      const availableToolIds = launcher.catalog.map((tool) => tool.id);
      const rawToolItems = activeScenario?.tools || [];
      const normalizedGroups = launcher.group.normalizeScenario(activeScenario);
      const commands = normalizedGroups.flatMap((group) => group.commands);
      const deniedCommands = commands
        .filter(
          (command) =>
            !launcher.command.allowed(
              command,
              identity.effectiveUser,
              identity.effectiveRole,
            ),
        )
        .map((command) => ({
          id: launcher.command.id(command),
          reason: launcher.command.reason(
            command,
            identity.effectiveUser,
            identity.effectiveRole,
          ),
        }))
        .filter((item) => item.id);
      const allowedCommands = commands.filter((command) =>
        launcher.command.allowed(
          command,
          identity.effectiveUser,
          identity.effectiveRole,
        ),
      );
      const deniedToolIds = deniedCommands.map((item) => item.id);
      const map = new Map(launcher.catalog.map((tool) => [tool.id, tool]));
      const visible = (id) => {
        if (
          activeScenario?.id === "madtest" &&
          (contextValue.path === "/app" || contextValue.path === "/app/")
        ) {
          return id === "madtest-find";
        }
        if (id === "locator-madtest") return Boolean(contextValue.madtestImport);
        return true;
      };
      const allowedGroups = normalizedGroups
        .map((group) =>
          launcher.group.allow(
            group,
            identity.effectiveUser,
            identity.effectiveRole,
          ),
        )
        .filter((group) => !launcher.group.empty(group));
      const groups = allowedGroups
        .map((group) =>
          launcher.group.attach(
            group,
            group.commands
              .map((command) => launcher.command.toolId(command))
              .filter((id) => visible(id))
              .map((id) => map.get(id))
              .filter(Boolean),
          ),
        )
        .filter((group) => group.tools.length);
      const tools = groups.flatMap((group) => launcher.group.tools(group));
      const allowedToolIds = tools.map((tool) => tool.id);
      const missingToolIds = allowedCommands
        .map((command) => launcher.command.toolId(command))
        .filter(Boolean)
        .filter((id) => !availableToolIds.includes(id));
      const marker = launcher.marker.meta({
        context: contextValue,
        activeScenario,
        realUser: identity.realUser,
        effectiveRole: identity.effectiveRole,
        previewRole: identity.previewRole,
        previewMode: identity.previewMode,
      });
      return launcher.debug.sync({
        context: contextValue,
        role: identity.effectiveRole,
        realUser: identity.realUser,
        realRole: identity.realRole,
        effectiveUser: identity.effectiveUser,
        effectiveRole: identity.effectiveRole,
        previewRole: identity.previewRole,
        previewMode: identity.previewMode,
        impersonation: identity.impersonation,
        marker,
        usage: launcher.preview.usage(),
        scenarios,
        activeScenario,
        rawToolItems,
        rawGroups: normalizedGroups,
        commands,
        allowedCommands,
        groups,
        toolIds: allowedToolIds,
        allowedToolIds,
        availableToolIds,
        deniedToolIds,
        deniedToolReasons: deniedCommands,
        missingToolIds,
        tools,
      });
    },
    htmlTools(groups) {
      return groups
        .flatMap((group) => group.commands || [])
        .map((command) => {
          if (!command?.tool) return "";
          return ui.controls.button({
            content: launcher.icon(command.tool.title || "🔖"),
            action: "tool",
            attrs: ` data-id="${launcher.command.toolId(command)}" type="button"`,
          });
        })
        .join("");
    },
    html() {
      const snapshot = launcher.snapshot();
      const scenarios = snapshot.scenarios;
      const current = snapshot.activeScenario;
      const marker = snapshot.marker;
      const groups = snapshot.groups;
      const theme = launcher.theme();
      const lineButtons = launcher.htmlTools(groups);
      const scenarioButtons = scenarios
        .map((item) =>
          ui.controls.button({
            content: icon.emoji(
              current?.id === item.id ? marker.emoji : item.emoji || "🔖",
            ),
            action: current?.id === item.id ? marker.action : "scenario",
            title: current?.id === item.id ? marker.label || marker.title : item.title,
            classes: current?.id === item.id ? "is-active" : "",
            attrs:
              current?.id === item.id
                ? ` data-id="${item.id}" type="button" aria-label="${marker.label || marker.title}"`
                : ` data-id="${item.id}" type="button"`,
          }),
        )
        .join("");
      const left = ui.shell.group(scenarioButtons, {
        stick: "left",
        rail: true,
      });
      const main = ui.shell.strip(lineButtons);
      const right = ui.shell.group(
        `${ui.controls.button({ content: icon.emoji(toolbar.appearance.themeToggleIcon(theme)), action: "theme", title: "Тема", attrs: ` type="button" aria-label="Тема"` })}${ui.controls.button({ content: icon.emoji("❌", "launcher"), action: "close", title: "Выход", attrs: ` type="button" aria-label="Выход"` })}`,
        {
          stick: "right",
          rail: true,
        },
      );
      return ui.shell.shell({ left, main, right });
    },
    activeScenario() {
      const current = launcher.snapshot().activeScenario;
      if (!current) return null;
      launcher.state.scenario = current.id;
      return current;
    },
    toolsByScenario() {
      return launcher.snapshot().tools;
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
      launcher.syncTheme(node.dataset.theme);
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
            node.dataset.moved = "false";
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
        tools: launcher.catalog,
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
        const current = launcher.theme();
        const theme = current === "light" ? "dark" : "light";
        launcher.setTheme(theme);
        launcher.render();
        return;
      }
      if (action === "scenario") {
        launcher.state.scenario = id;
        launcher.render();
        return;
      }
      if (action === "preview-role") {
        launcher.preview.cycle(launcher.scenarios.context(), context.account());
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
