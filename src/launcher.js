import { frame } from "./core/panel.js";
import { css } from "./core/css.js";
import { toolbar } from "./core/toolbar.js";
import { icon } from "./core/icon.js";

(() => {
  const launcher = {
    id: "bml-launcher-panel",
    skin: "bml-launcher-style",
    tools: "__LAUNCHER_TOOLS__",
    scenarioConfig: "__LAUNCHER_SCENARIOS__",
    state: {
      manifest: null,
      scenario: "",
      position: "launcher-panel-position",
      theme: "launcher-panel-theme",
      dock: { target: "floating", side: "" },
      previewTimer: 0,
      previewDock: null,
      previewLastKey: "",
      previewCandidateKey: "",
      previewCandidateHits: 0,
      statusTimer: 0,
      controller: null,
      layoutInput: null,
      layoutSync: null,
    },
    access: {
      owner: "*",
      editor: ["longread", "news", "photoreport", "revision"],
      author: ["author"],
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
        if (
          document.body?.classList?.contains("wp-admin") &&
          document.querySelector("#content")
        ) {
          return "edit";
        }
        if (
          location.hostname.endsWith("onliner.by") &&
          document.querySelector("article")
        ) {
          return "publicArticle";
        }
        if (location.hostname.endsWith("onliner.by")) return "publicPage";
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
        return { surface, user, title, path, type, status, role, classList };
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
              "editor",
              "lead",
              "schedule",
              "toc",
              "publish",
              "dump",
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
              "editor",
              "lead",
              "publish",
              "update",
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
              "editor",
              "lead",
              "publish",
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
            tools: ["diff", "reader"],
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
        return list;
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
      toolbar.appearance.sync(panel, {
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
    setStatus(string = "", timeout = 0) {
      return { string, timeout };
    },
    html() {
      const scenarios = launcher.scenarios.run();
      const current = launcher.activeScenario();
      const active = launcher.toolsByScenario();
      const theme = launcher.theme();
      const glyph = (value) => toolbar.icon(icon.emoji(value));
      const themeIcon = glyph(toolbar.appearance.themeToggleIcon(theme));
      const closeIcon = glyph("\u274C");
      return `
<header class="launcher-head">
  <div class="launcher-shell">
    <div class="launcher-mode-top">
    <div class="toolbar-group launcher-mode-group">
      <div class="toolbar-segment-group launcher-mode-toggle">
        ${scenarios
          .map(
            (scenario) =>
              `<span class="toolbar-segment${current?.id === scenario.id ? " is-active" : ""}" data-bml-scenario="${scenario.id}" title="${scenario.title}">${glyph(scenario.emoji || "🔖")}</span>`,
          )
          .join("")}
      </div>
    </div>
    </div>
    <div class="launcher-row launcher-line" data-bml-line>
      ${active
        .map(
          (tool) =>
            `<span class="toolbar-segment" data-bml-button data-bml-type="tool" data-bml-id="${tool.id}" role="button" tabindex="0">${glyph(tool.title || "🔖")}</span>`,
        )
        .join("")}
    </div>
    <div class="launcher-foot">
      <div class="toolbar-group launcher-mode-group">
        <div class="toolbar-segment-group launcher-meta-toggle">
          <span class="toolbar-segment" data-bml-theme="toggle">${themeIcon}</span>
          <span class="toolbar-segment" data-bml-close="true">${closeIcon}</span>
        </div>
      </div>
    </div>
  </div>
</header>`;
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
      if (!scenario) return launcher.tools;
      const map = new Map(launcher.tools.map((tool) => [tool.id, tool]));
      const tools = scenario.tools.map((id) => map.get(id)).filter(Boolean);
      return tools.length ? tools : launcher.tools;
    },
    position(value) {
      return toolbar.state(launcher.state.position, value);
    },
    contentRect(strict = true) {
      const content = document.getElementById("content");
      if (!content) return null;
      const rect = content.getBoundingClientRect();
      if (strict && (rect.width < 720 || rect.height < 220)) return null;
      return rect;
    },
    detectDock(panel) {
      if (panel?.dataset.toolbarFlow !== "single-row")
        return { target: "floating", side: "" };
      const snap = 88;
      const rect = panel.getBoundingClientRect();
      const near = (distance) => (distance <= snap ? distance : Infinity);
      const content = launcher.contentRect(true);
      const list = [
        { target: "screen", side: "top", distance: near(rect.top) },
        {
          target: "screen",
          side: "bottom",
          distance: near(window.innerHeight - rect.bottom),
        },
        { target: "screen", side: "left", distance: near(rect.left) },
        {
          target: "screen",
          side: "right",
          distance: near(window.innerWidth - rect.right),
        },
      ];
      if (content) {
        list.push({
          target: "content",
          side: "top",
          distance: near(Math.abs(rect.top - content.top)),
        });
        list.push({
          target: "content",
          side: "bottom",
          distance: near(Math.abs(rect.bottom - content.bottom)),
        });
        list.push({
          target: "content",
          side: "left",
          distance: near(Math.abs(rect.left - content.left)),
        });
        list.push({
          target: "content",
          side: "right",
          distance: near(Math.abs(rect.right - content.right)),
        });
      }
      const best = list.sort((a, b) => a.distance - b.distance)[0];
      if (!best || best.distance === Infinity)
        return { target: "floating", side: "" };
      return { target: best.target, side: best.side };
    },
    applyDock(dock, value = null) {
      const panel = launcher.node.panel();
      if (!panel) return;
      const previousSide = panel.dataset.dock || "floating";
      const current = dock || { target: "floating", side: "" };
      panel.dataset.dock = current.side || "floating";
      panel.dataset.dockTarget = current.target || "floating";
      launcher.normalizeLine(panel, current.side || "floating", previousSide);
      panel.style.removeProperty("transform");
      panel.style.removeProperty("right");
      panel.style.removeProperty("bottom");
      if (current.target === "floating") {
        if (
          value &&
          typeof value.left === "number" &&
          typeof value.top === "number"
        ) {
          toolbar.appearance.floating(panel, value);
        }
        return;
      }
      const content = launcher.contentRect(false);
      const anchor =
        current.target === "content" && content
          ? content
          : {
              left: 0,
              top: 0,
              right: document.documentElement.clientWidth || window.innerWidth,
              bottom: window.innerHeight,
            };
      if (current.target === "content" && !content) return;
      const rect = panel.getBoundingClientRect();
      const margin = 12;
      const clamp = (number, min, max) => Math.max(min, Math.min(max, number));
      const leftMin = 8;
      const leftMax = window.innerWidth - rect.width - 8;
      const topMin = 8;
      const topMax = window.innerHeight - rect.height - 8;
      if (current.side === "top") {
        const left =
          value && typeof value.left === "number" ? value.left : rect.left;
        const top = anchor.top + margin;
        toolbar.appearance.floating(panel, {
          left: clamp(left, leftMin, leftMax),
          top: clamp(top, 8, window.innerHeight - rect.height - 8),
        });
        return;
      }
      if (current.side === "bottom") {
        const left =
          value && typeof value.left === "number" ? value.left : rect.left;
        const top = anchor.bottom - rect.height - margin;
        toolbar.appearance.floating(panel, {
          left: clamp(left, leftMin, leftMax),
          top: clamp(top, 8, window.innerHeight - rect.height - 8),
        });
        return;
      }
      if (current.side === "left") {
        const left = anchor.left + margin;
        const top =
          value && typeof value.top === "number"
            ? value.top
            : (anchor.top + anchor.bottom - rect.height) / 2;
        toolbar.appearance.floating(panel, {
          left: clamp(left, 8, window.innerWidth - rect.width - 8),
          top: clamp(top, topMin, topMax),
        });
        return;
      }
      if (current.side === "right") {
        const left = anchor.right - rect.width - margin;
        const top =
          value && typeof value.top === "number"
            ? value.top
            : (anchor.top + anchor.bottom - rect.height) / 2;
        toolbar.appearance.floating(panel, {
          left: clamp(left, 8, window.innerWidth - rect.width - 8),
          top: clamp(top, topMin, topMax),
        });
      }
    },
    normalizeLine(panel, side, previousSide = "floating") {
      const line = panel.querySelector("[data-bml-line]");
      if (!line) return;
      const vertical = side === "left" || side === "right";
      const wasVertical = previousSide === "left" || previousSide === "right";
      if (vertical === wasVertical) return;
      if (vertical) {
        line.scrollTop = 0;
        line.scrollLeft = 0;
        return;
      }
      line.scrollLeft = 0;
      line.scrollTop = 0;
    },
    queuePreviewDock(panel, dock) {
      if (!panel || !dock) return;
      const key = `${dock.target || "floating"}:${dock.side || "floating"}`;
      if (key === launcher.state.previewLastKey) return;
      if (key !== launcher.state.previewCandidateKey) {
        launcher.state.previewCandidateKey = key;
        launcher.state.previewCandidateHits = 1;
        return;
      }
      launcher.state.previewCandidateHits += 1;
      if (launcher.state.previewCandidateHits < 2) return;
      launcher.state.previewDock = dock;
      if (launcher.state.previewTimer) clearTimeout(launcher.state.previewTimer);
      launcher.state.previewTimer = setTimeout(() => {
        launcher.state.previewTimer = 0;
        const next = launcher.state.previewDock;
        launcher.state.previewDock = null;
        if (!next) return;
        const nextSide = next.side || "floating";
        const currentSide = panel.dataset.dock || "floating";
        if (nextSide === currentSide) return;
        panel.dataset.dock = nextSide;
        panel.dataset.dockTarget = next.target || "floating";
        launcher.state.previewLastKey = `${next.target || "floating"}:${nextSide}`;
        launcher.normalizeLine(panel, nextSide, currentSide);
      }, 120);
    },
    flushPreviewDock() {
      if (launcher.state.previewTimer) clearTimeout(launcher.state.previewTimer);
      launcher.state.previewTimer = 0;
      launcher.state.previewDock = null;
      launcher.state.previewCandidateKey = "";
      launcher.state.previewCandidateHits = 0;
      launcher.state.previewLastKey = "";
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
        launcher.applyDock({ target: "floating", side: "" });
        return;
      }
      const dock = saved.dock || { target: "floating", side: "" };
      launcher.state.dock = dock;
      launcher.applyDock(dock, saved);
    },
    drag() {
      launcher.state.controller?.behavior.drag();
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
            target: shot?.dock?.target || launcher.state.dock?.target || "floating",
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
          launcher.applyDock(dock, current);
        },
      );
      launcher.bindLine();
    },
    mount() {
      frame.mount(launcher.skin, css.launcher.panel());
      const panel = frame.create({
        id: launcher.id,
        className: "panel launcher-panel",
        place: "right",
        html: launcher.html(),
      });
      panel.dataset.theme = launcher.theme();
      launcher.state.controller = toolbar.creature({
        panel,
        ...toolbar.presets.singleRowDocked("content"),
        theme: () => launcher.theme(),
        drag: {
          canStart(event) {
            if (event.button !== undefined && event.button !== 0) return false;
            const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
            if (coarse) return !event.target.closest("[data-bml-line]");
            if (event.target.closest("[data-bml-button]")) return false;
            if (event.target.closest("[data-bml-scenario]")) return false;
            if (event.target.closest("[data-bml-theme]")) return false;
            if (event.target.closest("[data-bml-close]")) return false;
            return true;
          },
          onMove() {
            launcher.queuePreviewDock(panel, launcher.detectDock(panel));
          },
          onEnd({ moved } = {}) {
            launcher.flushPreviewDock();
            if (!moved) return;
            const rect = panel.getBoundingClientRect();
            const dock = launcher.detectDock(panel);
            launcher.state.dock = dock;
            launcher.applyDock(dock, { left: rect.left, top: rect.top });
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
      const url = new URL("manifest.json", launcher.baseUrl()).href;
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
      launcher.setStatus("Loading...", 1000);
      return launcher
        .manifest()
        .then((manifest) =>
          files.reduce(
            (chain, file) =>
              chain.then(() => launcher.load(launcher.toolUrl(file, manifest))),
            Promise.resolve(),
          ),
        )
        .then(() => launcher.setStatus(""))
        .catch(() => launcher.setStatus("🛑 Loader", 1400));
    },
    runTool(id) {
      const tool = launcher.tools.find((item) => item.id === id);
      if (!tool) return;
      launcher.runFiles([tool.file]);
    },
    click(event) {
      const panel = launcher.node.panel();
      if (panel?.dataset.moved === "true") {
        panel.dataset.moved = "false";
        return;
      }
      if (event.target.closest("[data-bml-close]")) {
        launcher.unmount();
        return;
      }
      if (event.target.closest("[data-bml-theme]")) {
        const theme = launcher.theme() === "light" ? "dark" : "light";
        launcher.setTheme(theme);
        launcher.render();
        return;
      }
      const scenarioNode = event.target.closest("[data-bml-scenario]");
      if (scenarioNode) {
        launcher.state.scenario =
          scenarioNode.getAttribute("data-bml-scenario");
        launcher.render();
        return;
      }
      const button = event.target.closest("[data-bml-button]");
      if (!button) return;
      const type = button.getAttribute("data-bml-type");
      const id = button.getAttribute("data-bml-id");
      if (type === "tool") launcher.runTool(id);
    },
    bindLine() {
      const panel = launcher.node.panel();
      const line = panel ? panel.querySelector("[data-bml-line]") : null;
      if (line) {
        const lineStep = () => {
          const style = getComputedStyle(panel);
          return (
            parseFloat(style.getPropertyValue("--launcher-step")) +
            parseFloat(
              style.getPropertyValue("--launcher-scroll-gap") ||
                style.getPropertyValue("--launcher-gap"),
            )
          );
        };
        toolbar.behavior.scroll({
          panel: line,
          canRun: () => {
            const step = lineStep();
            return Number.isFinite(step) && step > 0;
          },
          wheel: (event) => {
            const dock = panel.dataset.dock || "floating";
            const vertical = dock === "left" || dock === "right";
            const step = lineStep();
            if (!Number.isFinite(step) || step <= 0) return;
            toolbar.behavior.stepWheel({
              panel: line,
              event,
              step: () => step,
              axis: () => (vertical ? "y" : "x"),
            });
          },
          touch: true,
        });
        toolbar.behavior.stepSnap({
          panel: line,
          axis: "x",
          step: lineStep,
          delay: 110,
          enabled: () => {
            const dock = panel.dataset.dock || "floating";
            if (dock === "left" || dock === "right") return false;
            const value = lineStep();
            return Number.isFinite(value) && value > 0;
          },
        });
        toolbar.behavior.stepSnap({
          panel: line,
          axis: "y",
          step: lineStep,
          delay: 110,
          enabled: () => {
            const dock = panel.dataset.dock || "floating";
            if (!(dock === "left" || dock === "right")) return false;
            const value = lineStep();
            return Number.isFinite(value) && value > 0;
          },
        });
      }
    },
    observeLayout() {
      const layout = document.querySelector("#layout_select");
      const sync = () => {
        const next = launcher.scenarios.context();
        const current = launcher.state.context || {};
        if (
          next.type.join("|") === (current.type || []).join("|") &&
          next.path === current.path &&
          next.classList === current.classList
        ) {
          return;
        }
        launcher.state.context = next;
        launcher.state.scenario = "";
        launcher.render();
      };
      if (layout) {
        layout.addEventListener("change", sync);
      }
      launcher.state.layoutInput = layout;
      launcher.state.layoutSync = sync;
    },
    bind() {
      const panel = launcher.node.panel();
      if (panel) panel.addEventListener("click", launcher.click);
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
      .filter(
        (item) =>
          item &&
          item.id &&
          Array.isArray(item.tools) &&
          (item.title || item.emoji),
      )
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
