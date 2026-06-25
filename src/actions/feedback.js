import { host } from "../core/surface/host.js";
import { styles as css } from "../core/surface/styles.js";
import { toolbar } from "../core/surface/toolbar.js";
import { ui } from "../core/surface/ui.js";
import { icon } from "../core/surface/icon.js";
import { field } from "../core/dom.js";
import { context } from "../runtime/context.js";

export const createFeedback = () => {
  const feedback = {
    ids: {
      root: "feedback-panel",
      style: "feedback-panel-style",
      message: "feedback-message",
      selection: "feedback-selection",
      selectionClear: "feedback-selection-clear",
    },
    state: {
      selection: "",
      selectionElement: null,
      activeElement: null,
      bound: false,
    },
    dom: {
      get(selector, root = document) {
        return root?.querySelector?.(selector) || null;
      },
      value(selector, root = document) {
        const element = feedback.dom.get(selector, root);
        if (!element || !("value" in element)) return "";
        return String(element.value || "");
      },
      root() {
        return document.getElementById(feedback.ids.root);
      },
      inside(element) {
        const root = feedback.dom.root();
        if (!root || !element) return false;
        return root === element || root.contains(element);
      },
    },
    element: {
      describe(element) {
        if (!element) return null;
        return {
          tag: String(element.tagName || "").toLowerCase(),
          id: String(element.id || ""),
          name: String(element.getAttribute?.("name") || ""),
          className:
            typeof element.className === "string" ? element.className : "",
        };
      },
      active() {
        const element = document.activeElement;
        if (!element) return feedback.state.activeElement;
        if (feedback.dom.inside(element)) return feedback.state.activeElement;
        return feedback.element.describe(element);
      },
      sync(event) {
        const element = event?.target || document.activeElement;
        if (!element || feedback.dom.inside(element)) return;
        feedback.state.activeElement = feedback.element.describe(element);
      },
    },
    selection: {
      node() {
        const selection = window.getSelection?.();
        if (!selection || !selection.rangeCount) return null;
        const node = selection.anchorNode;
        const element = node?.nodeType === 1 ? node : node?.parentElement;
        if (feedback.dom.inside(element)) return null;
        return element || null;
      },
      normalize(value) {
        return String(value || "")
          .replace(/\r\n?/g, "\n")
          .replace(/[\u00A0\t ]+/g, " ")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .join("\n")
          .trim()
          .slice(0, 500);
      },
      value() {
        const selection = window.getSelection?.();
        if (!selection || !selection.rangeCount) return "";
        if (!feedback.selection.node()) return "";
        return feedback.selection.normalize(selection.toString());
      },
      get() {
        return feedback.selection.value() || feedback.state.selection;
      },
      source() {
        return (
          feedback.element.describe(feedback.selection.node()) ||
          feedback.state.selectionElement
        );
      },
      sync() {
        const value = feedback.selection.value();
        if (!value) return;
        feedback.state.selection = value;
        feedback.state.selectionElement = feedback.selection.source();
        feedback.selection.render();
      },
      clear() {
        feedback.state.selection = "";
        feedback.state.selectionElement = null;
        window.getSelection?.()?.removeAllRanges?.();
        feedback.selection.render();
      },
      render() {
        const element = document.getElementById(feedback.ids.selection);
        if (!element) return;
        const value = feedback.state.selection || "";
        const empty = value ? "false" : "true";
        element.textContent =
          value ||
          "Выдели, если конкретно что-то не так,\nи/или сформулируй пониже своими словами";
        element.dataset.empty = empty;
        const wrap = element.closest(".feedback-selection-wrap");
        if (wrap) wrap.dataset.empty = empty;
        const clear = document.getElementById(feedback.ids.selectionClear);
        if (clear) clear.hidden = !value;
      },
      bind() {
        if (feedback.state.bound) return;
        feedback.state.bound = true;
        document.addEventListener("selectionchange", feedback.selection.sync);
        document.addEventListener("mouseup", feedback.selection.sync);
        document.addEventListener("keyup", feedback.selection.sync);
        document.addEventListener("focusin", feedback.element.sync);
      },
    },
    page: {
      viewport() {
        return {
          width: Math.round(
            window.visualViewport?.width || window.innerWidth || 0,
          ),
          height: Math.round(
            window.visualViewport?.height || window.innerHeight || 0,
          ),
          devicePixelRatio: window.devicePixelRatio || 1,
        };
      },
      scroll() {
        return {
          x: Math.round(window.scrollX || 0),
          y: Math.round(window.scrollY || 0),
        };
      },
    },
    post: {
      get(detected = context.detect()) {
        return {
          id: feedback.dom.value("#post_ID") || detected.postId || "",
          type:
            feedback.dom.value("#post_type") ||
            detected.revision?.postType ||
            "",
          status:
            feedback.dom.value("#original_post_status") ||
            detected.postStatus ||
            "",
          title: feedback.dom.value("#title") || "",
        };
      },
    },
    launcher: {
      debug() {
        return window.__ONLINER_LAUNCHPAD_DEBUG__ || {};
      },
      groupIds(value = feedback.launcher.debug()) {
        return (Array.isArray(value.groups) ? value.groups : [])
          .map((group) => String(group?.id || ""))
          .filter(Boolean);
      },
      commandIds(value = feedback.launcher.debug()) {
        return (Array.isArray(value.groups) ? value.groups : [])
          .flatMap((group) =>
            Array.isArray(group?.commands) ? group.commands : [],
          )
          .map((command) => String(command?.id || ""))
          .filter(Boolean);
      },
      marker(value = feedback.launcher.debug()) {
        const marker = value.marker || {};
        return {
          title: String(marker.title || ""),
          label: String(marker.label || ""),
          action: String(marker.action || ""),
          command: String(marker.command || value.markerCommand || ""),
        };
      },
      get() {
        const value = feedback.launcher.debug();
        const activeScenario = value.activeScenario || {};
        return {
          role: String(value.effectiveRole || value.role || ""),
          realRole: String(value.realRole || ""),
          previewRole: String(value.previewRole || ""),
          previewMode: value.previewMode === true,
          impersonation: value.impersonation === true,
          scenario: String(activeScenario.id || ""),
          group: String(value.group || ""),
          marker: feedback.launcher.marker(value),
          groups: feedback.launcher.groupIds(value),
          commands: feedback.launcher.commandIds(value),
          missing: Array.isArray(value.missingToolIds)
            ? value.missingToolIds
            : [],
          denied: Array.isArray(value.deniedToolReasons)
            ? value.deniedToolReasons
            : [],
        };
      },
    },
    payload: {
      message() {
        return feedback.dom.value(`#${feedback.ids.message}`).trim();
      },
      reporter(detected, launcherValue) {
        return {
          username: String(detected.user || ""),
          userId: String(detected.userId || ""),
          realRole: String(launcherValue.realRole || ""),
          effectiveRole: String(launcherValue.role || ""),
          previewRole: String(launcherValue.previewRole || ""),
          previewMode: launcherValue.previewMode === true,
          impersonation: launcherValue.impersonation === true,
        };
      },
      page(detected, post) {
        return {
          url: window.location.href,
          host: String(detected.host || ""),
          path: String(detected.path || ""),
          surface: String(detected.surface || ""),
          page: String(detected.page || ""),
          postId: String(post.id || detected.postId || ""),
          postType: String(post.type || detected.revision?.postType || ""),
          postStatus: String(post.status || detected.postStatus || ""),
          revision: detected.revision || {},
          type: Array.isArray(detected.type) ? detected.type : [],
          status: Array.isArray(detected.status) ? detected.status : [],
          roles: Array.isArray(detected.role) ? detected.role : [],
          pageFlags: detected.pageFlags || {},
        };
      },
      selection() {
        const text = feedback.selection.get();
        return {
          text,
          length: text.length,
          sourceElement: feedback.selection.source(),
        };
      },
      ui(launcherValue) {
        return {
          activeElement: feedback.element.active(),
          viewport: feedback.page.viewport(),
          scroll: feedback.page.scroll(),
          launcher: launcherValue,
        };
      },
      environment() {
        return {
          time: new Date().toISOString(),
          userAgent: navigator.userAgent || "",
          devicePixelRatio: window.devicePixelRatio || 1,
        };
      },
      debug(detected) {
        return {
          context: detected,
        };
      },
      get() {
        const detected = context.detect();
        const post = feedback.post.get(detected);
        const launcherValue = feedback.launcher.get();
        const message = feedback.payload.message();
        const payload = {
          message,
          reporter: feedback.payload.reporter(detected, launcherValue),
          page: feedback.payload.page(detected, post),
          post,
          selection: feedback.payload.selection(),
          ui: feedback.payload.ui(launcherValue),
          environment: feedback.payload.environment(),
          debug: feedback.payload.debug(detected),
        };
        return {
          ...payload,
          text: feedback.report.text(payload),
        };
      },
    },
    snapshot: {
      get() {
        return feedback.payload.get();
      },
    },
    report: {
      message() {
        return feedback.payload.message();
      },
      text(payload) {
        const message = payload.message || "Без комментария";
        const reporter = payload.reporter || {};
        const page = payload.page || {};
        const selection = payload.selection?.text || "";
        return [
          String.fromCodePoint(0x1F41E),
          `URL: ${page.url || ""}`,
          `Пользователь: ${reporter.username || ""} #${reporter.userId || ""}`,
          `Контекст: ${page.surface || ""} / ${page.page || ""}`,
          selection ? `Выделение: ${selection}` : "Выделение: —",
          `Сообщение: ${message}`,
        ].join("\n");
      },
      get() {
        const payload = feedback.payload.get();
        return {
          transport: "telegram",
          text: payload.text,
          payload,
        };
      },
      preview() {
        const payload = feedback.report.get();
        field.alert(JSON.stringify(payload, null, 2));
        return payload;
      },
    },
    view: {
      theme() {
        return (
          document.querySelector('.panel[data-ui-surface="toolbar"]')?.dataset
            ?.theme || "dark"
        );
      },
      icon(value = "") {
        return ui.controls.icon(icon.emoji(value));
      },
      head() {
        return ui.shell.frame({
          classes: "feedback-head",
          attrs: ' data-panel-drag-handle="true"',
          left: ui.controls.marker({
            content: feedback.view.icon("lady-beetle"),
            button: {
              title: "Фидбэк",
              attrs: ' type="button" tabindex="-1" aria-label="Фидбэк"',
            },
          }),
          right: ui.controls.chrome({
            theme: feedback.view.theme(),
            themeAction: "feedback.theme",
            closeAction: "feedback.close",
          }),
        });
      },
      selection() {
        const value = feedback.selection.get();
        const empty = value ? "false" : "true";
        return `<div class="feedback-selection-wrap" data-empty="${empty}"><div id="${feedback.ids.selection}" class="feedback-selection" data-empty="${empty}">${ui.controls.escape(
          value ||
            "Выдели, если конкретно что-то не так,\nи/или сформулируй пониже своими словами",
        )}</div>${ui.controls.button({
          action: "feedback.selection.clear",
          fluent: "Eraser Medium",
          fallback: "Eraser",
          title: "Очистить",
          classes: "feedback-corner feedback-selection-clear",
          attrs: ` id="${feedback.ids.selectionClear}" type="button"${value ? "" : " hidden"}`,
        })}</div>`;
      },
      submit() {
        return ui.controls.corner({
          action: "feedback.submit",
          fluent: "Send",
          fallback: "Send",
          title: "Отправить",
          classes: "feedback-corner feedback-submit",
          attrs: ' type="button"',
        });
      },
      message() {
        return `<div class="feedback-message-wrap"><textarea id="${feedback.ids.message}" class="feedback-message" placeholder="Так а что не так-то?"></textarea>${feedback.view.submit()}</div>`;
      },
      body() {
        return ui.shell.stack(
          [
            ui.shell.row(
              feedback.view.selection(),
              ' data-feedback-selection="true"',
            ),
            ui.shell.row(
              feedback.view.message(),
              ' data-feedback-message="true"',
            ),
          ].join(""),
          ' data-feedback-body="true"',
        );
      },
      html() {
        return ui.shell.stack(`${feedback.view.head()}${feedback.view.body()}`);
      },
      syncTheme(root = feedback.dom.root()) {
        if (!root) return "dark";
        const theme = root.dataset.theme === "dark" ? "light" : "dark";
        root.dataset.theme = theme;
        ui.surface.sync(root, {
          layout: "fullscreen",
          theme,
          surface: "toolbar",
        });
        ui.controls.chrome.theme(root, {
          theme,
          action: "feedback.theme",
        });
        return theme;
      },
      build() {
        host.mount(feedback.ids.style, css.feedback.panel());
        const root = host.create({
          id: feedback.ids.root,
          html: feedback.view.html(),
          draggable: true,
        });
        root.dataset.uiSurface = "toolbar";
        root.dataset.uiFrame = "capsule";
        root.dataset.toolbarFlow = "stack";
        root.dataset.feedbackPanel = "true";
        ui.surface.sync(root, {
          layout: "fullscreen",
          theme: feedback.view.theme(),
          surface: "toolbar",
        });
        root.addEventListener("click", feedback.view.click);
        toolbar.center(root, 16);
        feedback.view.fix(root);
        return root;
      },
      fix(root) {
        if (!root) return;
        root.style.setProperty(
          "width",
          "var(--feedback-panel-width)",
          "important",
        );
        root.style.setProperty(
          "min-width",
          "var(--feedback-panel-width)",
          "important",
        );
        root.style.setProperty(
          "max-width",
          "var(--feedback-panel-width)",
          "important",
        );
      },
      click(event) {
        const action =
          event.target?.closest?.("[data-action]")?.dataset?.action || "";
        if (action === "feedback.close") return feedback.close();
        if (action === "feedback.theme") return feedback.view.syncTheme();
        if (action === "feedback.submit") return feedback.report.preview();
        if (action === "feedback.selection.clear")
          return feedback.selection.clear();
        return false;
      },
      show() {
        feedback.close();
        feedback.element.sync();
        feedback.view.build();
        feedback.selection.sync();
        return true;
      },
    },
    close() {
      const root = feedback.dom.root();
      if (!root) return false;
      root.remove();
      return true;
    },
    run() {
      if (feedback.dom.root()) return feedback.close();
      return feedback.view.show();
    },
    init() {
      feedback.selection.bind();
      return feedback;
    },
  };
  return {
    feedback: feedback.init(),
  };
};
