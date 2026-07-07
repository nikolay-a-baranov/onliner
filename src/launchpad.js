import { host } from "./core/surface/host.js";
import { toolbar } from "./core/surface/toolbar.js";
import { icon } from "./core/surface/icon.js";
import { ui } from "./core/surface/ui.js";
import { cms } from "./core/cms.js";
import { madtest } from "./core/madtest.js";
import { sanitizer } from "./core/sanitizer.js";
import { context } from "./runtime/context.js";
import { scenarios } from "./runtime/scenarios.js";
import { groups } from "./runtime/groups.js";
import { commands } from "./runtime/commands.js";
import { launchpadFeed } from "./runtime/launchpad/feed.js";
import { launchpadPlacement } from "./runtime/launchpad/placement.js";
import { launchpadLoader } from "./runtime/launchpad/loader.js";
import { launchpadIdentity } from "./runtime/launchpad/identity.js";
import { actions } from "./actions.js";

(() => {
  const launchpad = {
    id: "launchpad-panel",
    catalog: "__LAUNCHPAD_TOOLS__",
    state: {
      manifest: null,
      scenario: "",
      position: "launchpad-panel-position",
      theme: "launchpad-panel-theme",
      currentTheme: "",
      controller: null,
      layoutInput: null,
      layoutSync: null,
      contextTimer: 0,
      debugKey: "",
      context: null,
      activeSync: null,
      keyboardSync: null,
      keyboardTinySync: null,
      keyboardTinyDoc: null,
      keyboardTinyEditor: null,
      keyboardTinyTimer: 0,
      contextSync: null,
      toolFocusSync: null,
      madtestSanitizerCleanup: null,
      adminSanitizerCleanup: null,
      feed: {
        group: null,
        toolbox: false,
        groupMotion: "",
        groupMotionId: "",
        roadmap: false,
        roadmapMotion: "",
        roadmapTimer: 0,
        scenario: "",
      },
      parameterMode: "",
      parameterSync: null,
      parameterRenderKey: "",
      timeMode: "",
      timeBaseStamp: null,
      readerPlace: "",
    },
    identity: launchpadIdentity,
    preview: launchpadIdentity.preview,
    madtest: {
      editable(element) {
        if (!element?.matches) return false;
        if (element.closest?.(`#${launchpad.id}`)) return false;
        return element.matches(
          "input:not([type]),input[type='text'],input[type='url'],textarea",
        );
      },
      active(contextValue = launcher.state.context || context.detect()) {
        return (
          contextValue.surface === "madtest" &&
          ["main", "questions", "results"].includes(contextValue.madtestPage)
        );
      },
      stop() {
        if (!launcher.state.madtestSanitizerCleanup) return false;
        launcher.state.madtestSanitizerCleanup();
        launcher.state.madtestSanitizerCleanup = null;
        return true;
      },
      sync(contextValue = launcher.state.context || context.detect()) {
        launcher.madtest.stop();
        if (!launcher.madtest.active(contextValue)) return false;
        madtest.bridge.install();
        launcher.state.madtestSanitizerCleanup = sanitizer.field.bind(
          document,
          {
            allow: (element) => launcher.madtest.editable(element),
            uppercaseFirst: true,
          },
        );
        return true;
      },
    },
    adminSanitizer: {
      active(contextValue = launcher.state.context || context.detect()) {
        return contextValue?.surface === "post";
      },
      stop() {
        if (typeof launcher.state.adminSanitizerCleanup === "function") {
          launcher.state.adminSanitizerCleanup();
          launcher.state.adminSanitizerCleanup = null;
        }
        actions.admin?.inputSanitizer?.stop?.();
        return true;
      },
      sync(contextValue = launcher.state.context || context.detect()) {
        launcher.adminSanitizer.stop();
        if (!launcher.adminSanitizer.active(contextValue)) return false;
        actions.admin?.inputSanitizer?.run?.();
        launcher.state.adminSanitizerCleanup = () => {
          actions.admin?.inputSanitizer?.stop?.();
        };
        return true;
      },
    },
    marker: {
      image(color) {
        const fill = String(color || "").trim() || "#ef3a48";
        const source = [
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 584 459">',
          `<polygon points="149 0 584 0 150 459 0 329" fill="${fill}"/>`,
          "</svg>",
        ].join("");
        return `data:image/svg+xml;utf8,${encodeURIComponent(source)}`;
      },
      host(value) {
        return String(
          value?.context?.host ||
            value?.activeScenario?.favicon ||
            location.hostname ||
            "",
        ).trim();
      },
      visual(value) {
        return Boolean(
          String(value?.html || "").trim() ||
          String(value?.image || "").trim() ||
          String(value?.logo || "").trim() ||
          String(value?.favicon || "").trim() ||
          String(value?.emoji || "").trim(),
        );
      },
      fallback(value) {
        const current = value || {};
        if (launcher.marker.visual(current)) return current;
        const favicon = launcher.marker.host(value);
        if (!favicon) return current;
        return {
          ...current,
          favicon,
          faviconFallback: current.faviconFallback || "bookmark",
        };
      },
      editor() {
        const form = document.querySelector('form#post,form[name="post"]');
        if (!form) return false;
        return Boolean(
          form.querySelector(
            [
              'input#title[name="post_title"]',
              'textarea#content[name="content"]',
              "#save-post",
              "#publish",
            ].join(","),
          ),
        );
      },
      pageIcon() {
        const links = [...document.querySelectorAll('link[rel*="icon"][href]')]
          .map((link) => String(link.href || "").trim())
          .filter(Boolean);
        return (
          links.find((href) => href.startsWith(location.origin)) ||
          links[0] ||
          `${location.origin}/favicon.ico`
        );
      },
      admin(value) {
        return {
          logo: "wordpress-logo",
          title: "Админка Onliner",
          label: "Админка Onliner",
          action: "scenario",
        };
      },
      meta(value) {
        const current = (() => {
          const currentScenario = value.activeScenario || {};
          if (currentScenario.id === "onliner") {
            return {
              emoji: "fire-extinguisher",
              title:
                "\u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430",
              label:
                "\u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430",
              action: "scenario",
            };
          }
          if (value.context.surface === "madtest") {
            return {
              emoji: "test-tube",
              title: "Madtest",
              label: "Madtest",
              action: "scenario",
            };
          }
          if (["source", "telegram"].includes(value.context.surface)) {
            return {
              favicon: value.context.host || location.hostname,
              title: "Иношапотяне",
              label: "Иношапотяне",
              action: "scenario",
            };
          }
          if (value.context.surface !== "post") return null;
          if (!launcher.marker.editor()) return launcher.marker.admin(value);
          const action =
            value.realUser === "baranov" ? "preview-role" : "role-cycle";
          if (value.realUser === "baranov" && !value.previewRole) {
            return {
              emoji: "goblin",
              title:
                "\u0421\u0443\u043F\u0435\u0440\u0440\u0435\u0436\u0438\u043C",
              label:
                "\u0421\u0443\u043F\u0435\u0440\u0440\u0435\u0436\u0438\u043C",
              action,
            };
          }
          if (value.effectiveRole === "test") {
            return {
              logo: "onliner",
              title: "Полигон",
              label: "Полигон",
              action,
            };
          }
          if (value.effectiveRole === "author") {
            return {
              emoji: "shark",
              title: "\u0416\u0443\u0440\u043D\u0430\u043B\u0438\u0441\u0442",
              label: "\u0416\u0443\u0440\u043D\u0430\u043B\u0438\u0441\u0442",
              action,
            };
          }
          if (value.effectiveRole === "editor") {
            return {
              emoji: "honeybee",
              title: "\u041A\u043E\u0440\u0440\u0435\u043A\u0442\u043E\u0440",
              label: "\u041A\u043E\u0440\u0440\u0435\u043A\u0442\u043E\u0440",
              action,
            };
          }
          if (value.effectiveRole === "authors") {
            return {
              image: launcher.marker.image("#ef3a48"),
              imageClass: "launchpad-acute-icon",
              title: "\u0416\u0443\u0440\u043D\u0430\u043B\u0438\u0441\u0442",
              label: "\u0416\u0443\u0440\u043D\u0430\u043B\u0438\u0441\u0442",
              action,
            };
          }
          if (value.effectiveRole === "editors") {
            return {
              image: launcher.marker.image("#f1ce4f"),
              imageClass: "launchpad-acute-icon",
              title: "\u041A\u043E\u0440\u0440\u0435\u043A\u0442\u043E\u0440",
              label: "\u041A\u043E\u0440\u0440\u0435\u043A\u0442\u043E\u0440",
              action,
            };
          }
          return null;
        })();
        if (current) {
          if (
            value.markerCommand &&
            !["preview-role", "role-cycle"].includes(current.action)
          ) {
            return {
              ...current,
              action: "marker-command",
              command: value.markerCommand,
            };
          }
          return current;
        }
        const currentScenario = value.activeScenario || {};
        return launcher.marker.fallback({
          emoji: currentScenario.emoji || "",
          html: currentScenario.html || "",
          image: currentScenario.image || "",
          logo: currentScenario.logo || "",
          favicon: currentScenario.favicon || "",
          title: currentScenario.title || currentScenario.id || "Launchpad",
          action: "scenario",
        });
      },
      content(value) {
        if (commands.separator(value)) return "";
        const current = value || {};
        const html = String(current.html || "");
        if (html) return html;
        const image = String(current.image || "");
        const imageClass = String(current.imageClass || "").trim();
        if (image) {
          return icon.logo.image(
            image,
            current.title || "",
            ["launchpad-scenario-icon", imageClass].filter(Boolean).join(" "),
          );
        }
        const logo = String(current.logo || "");
        if (logo)
          return icon.logo(
            logo,
            current.title || logo,
            "launchpad-scenario-icon",
          );
        const favicon = String(current.favicon || "");
        const faviconFallback = String(current.faviconFallback || "");
        if (favicon) {
          return icon.logo.favicon(
            favicon,
            current.title || favicon,
            "launchpad-scenario-icon",
            faviconFallback,
          );
        }
        return icon.emoji(String(current.emoji || "bookmark"));
      },
    },
    legacy: {
      panels() {
        return ["author-panel", "editor-panel"];
      },
      styles() {
        return [
          "author-panel-style",
          "author-style",
          "editor-panel-style",
          "editor-style",
        ];
      },
      clear() {
        launcher.legacy
          .panels()
          .forEach((id) => document.getElementById(id)?.remove());
        launcher.legacy
          .styles()
          .forEach((id) => document.getElementById(id)?.remove());
      },
    },
    field: {
      one(selector, root = document) {
        return root?.querySelector?.(selector) || null;
      },
      many(selector, root = document) {
        return [...(root?.querySelectorAll?.(selector) || [])];
      },
      click(node) {
        node?.click?.();
        return node;
      },
      emit(node) {
        if (!node) return;
        node.dispatchEvent(new Event("input", { bubbles: true }));
        node.dispatchEvent(new Event("change", { bubbles: true }));
      },
      set(node, value) {
        if (!node) return false;
        const next = String(value ?? "");
        if ("value" in node && node.value !== next) {
          node.value = next;
          launcher.field.emit(node);
        }
        return true;
      },
      check(node, value) {
        if (!node || !("checked" in node)) return false;
        const next = Boolean(value);
        if (node.checked !== next) launcher.field.click(node);
        node.checked = next;
        launcher.field.emit(node);
        return true;
      },
    },
    command: {
      ids: {
        params: new Set([
          "params.time",
          "params.sticky",
          "params.updated",
          "params.visibility",
          "params.status",
          "params.mode",
          "params.submit",
        ]),
      },
      parameter(value) {
        if (commands.separator(value)) return false;
        return launcher.command.ids.params.has(commands.id(value));
      },
      loader(value) {
        if (commands.separator(value)) return false;
        const id = commands.id(value);
        if (launcher.command.parameter(value)) return false;
        if (actions.has(id)) return false;
        return true;
      },
      available(value) {
        if (commands.separator(value)) return true;
        if (!launcher.command.parameter(value)) return true;
        return launcher.params.available(commands.id(value));
      },
      state(value) {
        if (!launcher.command.parameter(value)) return "";
        return launcher.params.state(commands.id(value));
      },
      variant(value) {
        const state = launcher.command.state(value);
        if (!state) return null;
        return value?.states?.[state] || null;
      },
      content(value) {
        if (commands.separator(value)) return "";
        const current = value || {};
        const variant = launcher.command.variant(current);
        const image = String(variant?.image || current.image || "");
        if (image)
          return icon.logo.image(
            image,
            current.title || "",
            "launchpad-command-icon",
          );
        const logo = String(variant?.logo || current.logo || "");
        if (logo)
          return icon.logo(
            logo,
            current.title || logo,
            "launchpad-command-icon",
          );
        const favicon = String(variant?.favicon || current.favicon || "");
        const faviconFallback = String(
          variant?.faviconFallback || current.faviconFallback || "",
        );
        if (favicon)
          return icon.logo.favicon(
            favicon,
            current.title || favicon,
            "",
            faviconFallback,
          );
        const glyph = String(variant?.glyph || current.glyph || "");
        if (glyph) {
          const primary = icon.fluent(glyph, 20);
          const fallback = icon.fluent(glyph, 24);
          return `<img class="toolbar-icon launchpad-command-icon" src="${primary}" alt="" onerror="this.onerror=null;this.src='${fallback}'">`;
        }
        const emoji = String(variant?.emoji || current.emoji || "");
        if (emoji) return icon.emoji(emoji);
        if (launcher.command.parameter(current)) {
          return launcher.params.content(commands.id(current));
        }
        const tool = current.tool || {};
        return launcher.icon(tool.title || "bookmark");
      },
      active(value) {
        if (commands.separator(value)) return false;
        return actions.active(commands.id(value));
      },
      hotkeyLabel(value) {
        const key =
          (Array.isArray(value?.hotkeys) ? value.hotkeys : [])[0] || "";
        if (!key) return "";
        const labels = {
          ArrowLeft: "←",
          ArrowRight: "→",
          ArrowUp: "↑",
          ArrowDown: "↓",
          Slash: "/",
          Minus: "−",
          NumpadMinus: "−",
          Equal: "=",
          NumpadAdd: "+",
          Quote: "'",
          Comma: ",",
          Period: ".",
        };
        const letter = key.match(/^Key([A-Z])$/);
        const digit = key.match(/^Digit([0-9])$/);
        const current =
          labels[key] ||
          (letter ? letter[1] : "") ||
          (digit ? digit[1] : "") ||
          key;
        return `${launcher.keyboard.apple() ? "⌥⌘" : "Alt+"}${current}`;
      },
      title(value) {
        if (commands.separator(value)) return "";
        const current = value || {};
        const id = commands.id(current);
        const variant = launcher.command.variant(current);
        const title = launcher.command.parameter(current)
          ? launcher.params.title(id)
          : variant?.title ||
            current.title ||
            current.toolId ||
            current.id ||
            "";
        const hotkey = launcher.command.hotkeyLabel(current);
        return hotkey ? `${title} · ${hotkey}` : title;
      },
    },
    params: {
      ids: {
        time: "params.time",
        sticky: "params.sticky",
        updated: "params.updated",
        visibility: "params.visibility",
        status: "params.status",
        mode: "params.mode",
        submit: "params.submit",
      },
      defaultMode() {
        const contextValue = launcher.state.context || context.detect();
        const identity = launcher.identity.identity(contextValue);
        return identity.effectiveRole === "authors" ? "save" : "publish";
      },
      mode(value) {
        if (!value)
          return launcher.state.parameterMode || launcher.params.defaultMode();
        launcher.state.parameterMode = value === "save" ? "save" : "publish";
        return launcher.state.parameterMode;
      },
      adminNow() {
        return new Date(
          new Date().toLocaleString("en-US", {
            timeZone: cms.timezone,
          }),
        );
      },
      part(selector, fallback = "") {
        const value =
          launcher.field.one(selector)?.value ||
          launcher.field.one(selector.replace(/^#/, "#hidden_"))?.value ||
          fallback;
        return String(value || "");
      },
      stamp(parts = {}) {
        return {
          year: String(parts.year || ""),
          month: String(parts.month || "").padStart(2, "0"),
          day: String(parts.day || "").padStart(2, "0"),
          hours: String(parts.hours || "").padStart(2, "0"),
          minutes: String(parts.minutes || "").padStart(2, "0"),
        };
      },
      fromDate(date) {
        const pad = (value) => String(value).padStart(2, "0");
        return launcher.params.stamp({
          year: String(date.getFullYear()),
          month: pad(date.getMonth() + 1),
          day: pad(date.getDate()),
          hours: pad(date.getHours()),
          minutes: pad(date.getMinutes()),
        });
      },
      same(left, right) {
        if (!left || !right) return false;
        return (
          left.year === right.year &&
          left.month === right.month &&
          left.day === right.day &&
          left.hours === right.hours &&
          left.minutes === right.minutes
        );
      },
      future(stamp) {
        if (!stamp) return false;
        const iso = `${stamp.year}-${stamp.month}-${stamp.day}T${stamp.hours}:${stamp.minutes}:00`;
        const time = Date.parse(iso);
        if (!Number.isFinite(time)) return false;
        return time > launcher.params.adminNow().getTime();
      },
      timestamp: {
        selectedMode() {
          return launcher.state.timeMode || "";
        },
        base(value) {
          if (value !== undefined) {
            launcher.state.timeBaseStamp = value;
          }
          return (
            launcher.state.timeBaseStamp ||
            launcher.params.timestamp.hidden() ||
            launcher.params.timestamp.current()
          );
        },
        clearCycleMode() {
          launcher.state.timeMode = "";
          return "";
        },
        clearMode() {
          launcher.state.timeMode = "";
          return "";
        },
        currentMode() {
          return (
            launcher.params.timestamp.selectedMode() ||
            launcher.params.timestamp.state().mode
          );
        },
        derivedMode(base, hidden) {
          const now = launcher.params.fromDate(launcher.params.adminNow());
          if (hidden.hours === "07" && hidden.minutes === "00") return "seven";
          if (hidden.hours === "08" && hidden.minutes === "00") return "eight";
          if (launcher.params.same(hidden, now)) return "now";
          if (launcher.params.same(hidden, base)) return "keep";
          return "custom";
        },
        current() {
          return launcher.params.stamp({
            year: launcher.params.part("#cur_aa"),
            month: launcher.params.part("#cur_mm"),
            day: launcher.params.part("#cur_jj"),
            hours: launcher.params.part("#cur_hh"),
            minutes: launcher.params.part("#cur_mn"),
          });
        },
        hidden() {
          return launcher.params.stamp({
            year: launcher.params.part(
              "#hidden_aa",
              launcher.params.part("#aa"),
            ),
            month: launcher.params.part(
              "#hidden_mm",
              launcher.params.part("#mm"),
            ),
            day: launcher.params.part(
              "#hidden_jj",
              launcher.params.part("#jj"),
            ),
            hours: launcher.params.part(
              "#hidden_hh",
              launcher.params.part("#hh"),
            ),
            minutes: launcher.params.part(
              "#hidden_mn",
              launcher.params.part("#mn"),
            ),
          });
        },
        visible() {
          return launcher.params.stamp({
            year: launcher.params.part("#aa"),
            month: launcher.params.part("#mm"),
            day: launcher.params.part("#jj"),
            hours: launcher.params.part("#hh"),
            minutes: launcher.params.part("#mn"),
          });
        },
        mode(current, hidden) {
          if (launcher.state.timeMode) return launcher.state.timeMode;
          return launcher.params.timestamp.derivedMode(current, hidden);
        },
        state() {
          const current = launcher.params.timestamp.base();
          const hidden = launcher.params.timestamp.hidden();
          return {
            current,
            hidden,
            mode: launcher.params.timestamp.mode(current, hidden),
          };
        },
        dayLabel(value) {
          const pad = (number) => String(number).padStart(2, "0");
          const base = launcher.params.adminNow();
          const target = new Date(
            Number(value.year || 0),
            Number(value.month || 1) - 1,
            Number(value.day || 1),
          );
          base.setHours(0, 0, 0, 0);
          target.setHours(0, 0, 0, 0);
          const diff = Math.round((target - base) / 86400000);
          const relative = {
            [-2]: "позавчера",
            [-1]: "вчера",
            0: "сегодня",
            1: "завтра",
            2: "послезавтра",
          }[diff];
          return (
            relative || `${pad(value.day)}.${pad(value.month)}.${value.year}`
          );
        },
        label(value) {
          return `${launcher.params.timestamp.dayLabel(value)} ${value.hours}:${value.minutes}`;
        },
        title(mode) {
          if (mode === "keep") {
            return launcher.params.timestamp.label(
              launcher.params.timestamp.base(),
            );
          }
          if (["now", "seven", "eight", "custom"].includes(mode)) {
            return launcher.params.timestamp.label(
              launcher.params.timestamp.target(mode),
            );
          }
          return "Время";
        },
        target(mode) {
          const now = launcher.params.adminNow();
          if (mode === "keep") return launcher.params.timestamp.base();
          if (mode === "now") return launcher.params.fromDate(now);
          if (mode === "seven" || mode === "eight") {
            const hour = mode === "seven" ? 7 : 8;
            const date = new Date(now);
            if (date.getHours() >= hour) date.setDate(date.getDate() + 1);
            date.setHours(hour, 0, 0, 0);
            return launcher.params.fromDate(date);
          }
          if (mode === "custom") {
            const date = new Date(now);
            date.setMinutes(date.getMinutes() + 15);
            return launcher.params.fromDate(date);
          }
          const date = new Date(now);
          if (date.getHours() >= 9) date.setDate(date.getDate() + 1);
          date.setHours(9, 0, 0, 0);
          return launcher.params.fromDate(date);
        },
        opened() {
          const node = launcher.field.one("#timestampdiv");
          if (!node) return false;
          return window.getComputedStyle(node).display !== "none";
        },
        editing(element = document.activeElement) {
          if (!launcher.params.timestamp.opened()) return false;
          if (!element?.matches) return false;
          return element.matches("#aa,#mm,#jj,#hh,#mn");
        },
        commitCustomEdit() {
          if (launcher.params.timestamp.currentMode() !== "custom")
            return false;
          if (!launcher.params.timestamp.editing()) return false;
          launcher.params.timestamp.save();
          launcher.params.submitAction.sync();
          return true;
        },
        open() {
          if (launcher.params.timestamp.opened()) return true;
          launcher.field.click(launcher.field.one(".edit-timestamp"));
          return launcher.params.timestamp.opened();
        },
        fields(value) {
          return [
            ["#mm", value.month],
            ["#jj", value.day],
            ["#aa", value.year],
            ["#hh", value.hours],
            ["#mn", value.minutes],
          ];
        },
        set(value) {
          launcher.params.timestamp
            .fields(value)
            .forEach(([selector, current]) => {
              launcher.field.set(launcher.field.one(selector), current);
            });
          return value;
        },
        save() {
          const button = launcher.field.one(".save-timestamp");
          if (!button) return false;
          launcher.field.click(button);
          return true;
        },
        edit(value, { save = true, focus = false } = {}) {
          launcher.params.timestamp.open();
          launcher.params.timestamp.set(value);
          if (focus) {
            const minutes = launcher.field.one("#mn");
            minutes?.focus?.();
            minutes?.select?.();
          }
          if (save) launcher.params.timestamp.save();
          return value;
        },
        apply(mode) {
          return launcher.params.timestamp.edit(
            launcher.params.timestamp.target(mode),
            {
              save: mode !== "custom",
              focus: mode === "custom",
            },
          );
        },
        ensureValue(value, { future = false } = {}) {
          launcher.params.timestamp.edit(value);
          const hidden = launcher.params.timestamp.hidden();
          const visible = launcher.params.timestamp.visible();
          const saved = launcher.params.same(hidden, value);
          const applied = launcher.params.same(visible, value);
          return (
            saved && applied && (!future || launcher.params.future(hidden))
          );
        },
        ensureCustom({ future = false, passive = false } = {}) {
          if (!launcher.params.timestamp.opened()) {
            if (passive) {
              const hidden = launcher.params.timestamp.hidden();
              return !future || launcher.params.future(hidden);
            }
            if (!launcher.params.timestamp.open()) return false;
          }
          return launcher.params.timestamp.ensureValue(
            launcher.params.timestamp.visible(),
            { future },
          );
        },
        ensure(mode, { future = false, passive = false } = {}) {
          if (!mode || mode === "keep") return true;
          if (mode === "custom") {
            return launcher.params.timestamp.ensureCustom({ future, passive });
          }
          return launcher.params.timestamp.ensureValue(
            launcher.params.timestamp.target(mode),
            { future: future && mode !== "now" },
          );
        },
      },
      visibility: {
        linkNode() {
          return (
            launcher.field.many('input[name="visibility"]').find((node) => {
              const id = String(node?.id || "");
              const label = id
                ? document.querySelector(`label[for="${id}"]`)?.textContent ||
                  ""
                : node?.parentElement?.textContent || "";
              return /доступно по ссылке/u.test(
                String(label || "").toLowerCase(),
              );
            }) ||
            launcher.field.one("#visibility-radio-private") ||
            null
          );
        },
        stickyReset() {
          return (
            launcher.field.one('input[name="sticky"][value="none"]') ||
            launcher.field.one('input[name="sticky"][value="off"]') ||
            launcher.field.one('input[name="sticky"][value=""]') ||
            launcher.field
              .many('input[name="sticky"]')
              .find(
                (node) =>
                  !["left", "right"].includes(
                    String(node?.value || "").toLowerCase(),
                  ),
              ) ||
            null
          );
        },
        state() {
          const sticky =
            launcher.field.one('input[name="sticky"]:checked')?.value || "";
          const link = launcher.params.visibility.linkNode();
          const isLink = Boolean(
            (link && "checked" in link && link.checked) ||
            launcher.field.one("#visibility-radio-private")?.checked,
          );
          const updated = Boolean(launcher.field.one("#updated")?.checked);
          return {
            access: isLink ? "link" : "public",
            sticky:
              sticky === "left"
                ? "left"
                : sticky === "right"
                  ? "right"
                  : "none",
            updated: updated ? "on" : "off",
          };
        },
        apply(next = {}) {
          launcher.field.click(launcher.field.one(".edit-visibility"));
          launcher.field.check(
            launcher.field.one("#visibility-radio-public"),
            next.access !== "link",
          );
          const link = launcher.params.visibility.linkNode();
          if (link) {
            if ("checked" in link) {
              launcher.field.check(link, next.access === "link");
            } else if (next.access === "link") {
              launcher.field.click(link);
            }
          }
          launcher.field.set(
            launcher.field.one("#hidden-post-visibility"),
            next.access === "link" ? "private" : "public",
          );
          if (next.access !== "link") {
            launcher.field.set(launcher.field.one("#post_password"), "");
            launcher.field.set(launcher.field.one("#hidden-post-password"), "");
          }
          if (next.sticky === "left") {
            launcher.field.check(
              launcher.field.one('input[name="sticky"][value="left"]'),
              true,
            );
          } else if (next.sticky === "right") {
            launcher.field.check(
              launcher.field.one('input[name="sticky"][value="right"]'),
              true,
            );
          } else {
            launcher.field.check(
              launcher.params.visibility.stickyReset(),
              true,
            );
          }
          launcher.field.check(
            launcher.field.one("#updated"),
            next.updated === "on",
          );
          launcher.field.click(launcher.field.one(".save-post-visibility"));
        },
      },
      status: {
        value() {
          return String(
            launcher.field.one("#post_status")?.value ||
              launcher.field.one("#hidden_post_status")?.value ||
              launcher.field.one("#original_post_status")?.value ||
              "",
          ).trim();
        },
        actual() {
          return ["publish", "future"].includes(launcher.params.status.value())
            ? "published"
            : "draft";
        },
        state() {
          return launcher.params.status.actual();
        },
        opened() {
          const node = launcher.field.one("#post-status-select");
          if (!node) return false;
          return window.getComputedStyle(node).display !== "none";
        },
        open() {
          if (launcher.params.status.opened()) return true;
          launcher.field.click(launcher.field.one(".edit-post-status"));
          return true;
        },
        set(value = "publish") {
          const next = value === "draft" ? "draft" : "publish";
          launcher.params.status.open();
          launcher.field.set(launcher.field.one("#post_status"), next);
          launcher.field.set(launcher.field.one("#hidden_post_status"), next);
          launcher.field.click(launcher.field.one(".save-post-status"));
          return next;
        },
        run() {
          const current = launcher.params.status.state();
          const next = current === "draft" ? "publish" : "draft";
          launcher.params.status.set(next);
          return true;
        },
      },
      schedule: {
        decode(value = "") {
          const textarea = document.createElement("textarea");
          textarea.innerHTML = String(value || "");
          return textarea.value;
        },
        content() {
          return String(launcher.field.one("#content")?.value || "");
        },
        evergreen() {
          const once = launcher.params.schedule.decode(
            launcher.params.schedule.content(),
          );
          const twice = launcher.params.schedule.decode(once);
          return /эта статья уже публиковалась/iu.test(twice);
        },
        hour() {
          return launcher.params.schedule.evergreen() ? 7 : 8;
        },
        timeMode(hour = launcher.params.schedule.hour()) {
          return Number(hour) === 7 ? "seven" : "eight";
        },
        sticky(hour = launcher.params.schedule.hour()) {
          return Number(hour) === 7 ? "left" : "right";
        },
        tagName(value = "") {
          return String(value || "")
            .toLocaleLowerCase("ru-RU")
            .replace(/ё/g, "е")
            .replace(/\s+/g, " ")
            .trim();
        },
        tags() {
          const input = String(
            launcher.field.one("#tax-input-post_tag")?.value || "",
          )
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
          const checklist = launcher.field
            .many("#post_tag .tagchecklist span")
            .map((item) => {
              const clone = item.cloneNode(true);
              clone
                .querySelectorAll?.(".ntdelbutton")
                .forEach((button) => button.remove());
              return String(clone.textContent || "")
                .replace(/^[x\u00D7]\s*/i, "")
                .trim();
            })
            .filter(Boolean);
          return [...input, ...checklist];
        },
        hasTag(name = "") {
          const key = launcher.params.schedule.tagName(name);
          if (!key) return false;
          return launcher.params.schedule
            .tags()
            .some((item) => launcher.params.schedule.tagName(item) === key);
        },
        top() {
          const active = document.activeElement;
          if (active && active !== document.body) active.blur?.();
          window.scrollTo?.({
            left: window.scrollX || 0,
            top: 0,
          });
          return true;
        },
        tag(name = "Onliner") {
          if (launcher.params.schedule.hasTag(name)) {
            launcher.params.schedule.top();
            return true;
          }
          const input = launcher.field.one("#new-tag-post_tag");
          const button = launcher.field.one("#post_tag .tagadd");
          if (!input || !button) return false;
          launcher.field.set(input, name);
          launcher.field.click(button);
          launcher.params.schedule.top();
          return true;
        },
        layout() {
          const element = cms.layout.element();
          if (!element) return true;
          if (cms.layout.longread(cms.layout.value(element))) return true;
          const label =
            element.options?.[element.selectedIndex]?.text?.toLowerCase() || "";
          if (!window.confirm(`🚨 Точно ${label}, не лонгрид? Меняем?`)) {
            return false;
          }
          launcher.field.set(element, "longread");
          return true;
        },
        time(hour = launcher.params.schedule.hour()) {
          const mode = launcher.params.schedule.timeMode(hour);
          launcher.state.timeMode = mode;
          return launcher.params.timestamp.ensure(mode, {
            future: true,
            passive: false,
          });
        },
        visibility(hour = launcher.params.schedule.hour()) {
          const state = launcher.params.visibility.state();
          launcher.params.visibility.apply({
            ...state,
            access: "public",
            sticky: launcher.params.schedule.sticky(hour),
            updated: "off",
          });
          return true;
        },
        status() {
          if (launcher.params.status.actual() !== "draft") return true;
          launcher.params.status.set("publish");
          return true;
        },
        prepare() {
          if (!launcher.params.schedule.layout()) return false;
          const hour = launcher.params.schedule.hour();
          launcher.params.schedule.tag("Onliner");
          launcher.params.schedule.visibility(hour);
          launcher.params.schedule.time(hour);
          launcher.params.schedule.status();
          launcher.params.schedule.top();
          launcher.params.submitAction.sync();
          return true;
        },
      },
      update: {
        updated(value = true, { focus = false } = {}) {
          const node = launcher.field.one("#updated");
          if (!node) return false;
          launcher.field.check(node, value);
          if (focus) {
            try {
              node.focus({ preventScroll: true });
            } catch {
              node.focus?.();
            }
          }
          return true;
        },
        time() {
          launcher.state.timeMode = "now";
          return launcher.params.timestamp.ensure("now", {
            future: false,
            passive: false,
          });
        },
        prepare() {
          launcher.params.update.time();
          launcher.params.update.updated(true, { focus: true });
          launcher.params.submitAction.sync();
          return true;
        },
      },
      submitAction: {
        sync() {
          window.setTimeout(() => launcher.render(), 0);
          return true;
        },
        status() {
          const current =
            launcher.field.one("#post_status")?.value ||
            launcher.field.one("#original_post_status")?.value ||
            "";
          return ["publish", "future"].includes(String(current || "").trim())
            ? "published"
            : "draft";
        },
        state() {
          if (launcher.params.mode() === "save") return "save";
          const button = String(launcher.field.one("#publish")?.value || "")
            .trim()
            .toLowerCase();
          if (/заплан/u.test(button)) return "schedule";
          if (/обнов/u.test(button)) return "update";
          if (launcher.params.status.actual() === "draft") {
            return launcher.params.future(
              launcher.params.timestamp.state().hidden,
            )
              ? "schedule"
              : "draft";
          }
          if (launcher.params.submitAction.status() === "published") {
            return "update";
          }
          return launcher.params.future(
            launcher.params.timestamp.state().hidden,
          )
            ? "schedule"
            : "publish";
        },
        icon() {
          return (
            {
              save: "floppy-disk",
              update: "counterclockwise-arrows-button",
              schedule: "calendar",
              publish: "rocket",
            }[launcher.params.submitAction.state()] || "rocket"
          );
        },
        ensureTime() {
          const mode = launcher.state.timeMode || "";
          if (!mode) return true;
          return launcher.params.timestamp.ensure(mode, {
            future: launcher.params.submitAction.state() === "schedule",
            passive: false,
          });
        },
        run() {
          const action = launcher.params.mode();
          if (action === "save") {
            launcher.params.timestamp.clearMode();
          } else {
            launcher.params.submitAction.ensureTime();
            launcher.params.timestamp.clearCycleMode();
            launcher.params.submitAction.sync();
          }
          window.setTimeout(() => {
            Promise.resolve(actions.admin.submit.run(action)).finally(
              launcher.params.submitAction.sync,
            );
          }, 100);
          return true;
        },
      },
      available(id) {
        if (
          !launcher.state.context ||
          launcher.state.context.surface !== "post"
        ) {
          return false;
        }
        if (id === launcher.params.ids.submit) {
          return Boolean(
            launcher.field.one("#save-post") || launcher.field.one("#publish"),
          );
        }
        if (id === launcher.params.ids.time) {
          return Boolean(
            launcher.field.one(".edit-timestamp") &&
            launcher.field.one(".save-timestamp") &&
            launcher.field.one("#aa") &&
            launcher.field.one("#hh"),
          );
        }
        if (id === launcher.params.ids.status) {
          return Boolean(launcher.field.one("#post_status"));
        }
        return Boolean(
          launcher.field.one(".edit-visibility") &&
          launcher.field.one(".save-post-visibility"),
        );
      },
      syncTimeTarget(element = null) {
        if (!element?.matches) return false;
        return element.matches(
          [
            "#aa",
            "#mm",
            "#jj",
            "#hh",
            "#mn",
            "#hidden_aa",
            "#hidden_mm",
            "#hidden_jj",
            "#hidden_hh",
            "#hidden_mn",
            ".save-timestamp",
          ].join(","),
        );
      },
      syncTarget(element = null) {
        if (!element?.matches) return false;
        if (element.closest?.(`#${launcher.id}`)) return false;
        return element.matches(
          [
            "#updated",
            "#post_status",
            "#hidden_post_status",
            "#original_post_status",
            "#aa",
            "#mm",
            "#jj",
            "#hh",
            "#mn",
            "#hidden_aa",
            "#hidden_mm",
            "#hidden_jj",
            "#hidden_hh",
            "#hidden_mn",
            "input[name='sticky']",
            "input[name='visibility']",
            ".save-timestamp",
            ".save-post-visibility",
            ".save-post-status",
          ].join(","),
        );
      },
      renderKey() {
        const visibility = launcher.params.visibility.state();
        return JSON.stringify({
          time: launcher.params.timestamp.currentMode(),
          sticky: visibility.sticky,
          updated: visibility.updated,
          visibility: visibility.access,
          status: launcher.params.status.state(),
          submit: launcher.params.submitAction.state(),
          action: launcher.params.mode(),
        });
      },
      remember() {
        launcher.state.parameterRenderKey = launcher.params.renderKey();
        return launcher.state.parameterRenderKey;
      },
      sync() {
        const sync = () => {
          const key = launcher.params.renderKey();
          if (key === launcher.state.parameterRenderKey) return;
          launcher.state.parameterRenderKey = key;
          launcher.render();
        };
        window.setTimeout(sync, 0);
        window.setTimeout(sync, 120);
        return true;
      },
      state(id) {
        const visibility = launcher.params.visibility.state();
        if (id === launcher.params.ids.time) {
          return launcher.params.timestamp.currentMode();
        }
        if (id === launcher.params.ids.sticky) {
          return visibility.sticky;
        }
        if (id === launcher.params.ids.updated) {
          return visibility.updated;
        }
        if (id === launcher.params.ids.visibility) {
          return visibility.access;
        }
        if (id === launcher.params.ids.status) {
          return launcher.params.status.state();
        }
        if (id === launcher.params.ids.mode) {
          return launcher.params.submitAction.state();
        }
        return "";
      },
      summary() {
        return [
          launcher.params.title(launcher.params.ids.status),
          launcher.params.title(launcher.params.ids.time),
          launcher.params.title(launcher.params.ids.sticky),
          launcher.params.title(launcher.params.ids.updated),
          launcher.params.title(launcher.params.ids.visibility),
        ]
          .filter(Boolean)
          .join("\n");
      },
      capitalize(value = "") {
        const current = String(value || "");
        if (!current) return "";
        return `${current.slice(0, 1).toUpperCase()}${current.slice(1)}`;
      },
      title(id) {
        const state = launcher.params.visibility.state();
        if (id === launcher.params.ids.time) {
          return launcher.params.capitalize(
            launcher.params.timestamp.title(
              launcher.params.timestamp.currentMode(),
            ),
          );
        }
        if (id === launcher.params.ids.sticky) {
          return (
            {
              none: "Не прилеплена",
              left: "Прилепить слева",
              right: "Прилепить справа",
            }[state.sticky] || "Лепка"
          );
        }
        if (id === launcher.params.ids.updated) {
          return state.updated === "on" ? "Поднять" : "Не поднимать";
        }
        if (id === launcher.params.ids.visibility) {
          return state.access === "link" ? "Доступно по ссылке" : "Открыто";
        }
        if (id === launcher.params.ids.status) {
          return launcher.params.status.state() === "draft"
            ? "Черновик"
            : "Опубликовано";
        }
        if (id === launcher.params.ids.mode) {
          return (
            {
              draft: "Скрыть",
              save: "Сохранить",
              publish: "Опубликовать",
              schedule: "Запланировать",
              update: "Обновить",
            }[launcher.params.submitAction.state()] || "Запуск"
          );
        }
        if (id === launcher.params.ids.submit) {
          return launcher.params.summary();
        }
        return launcher.params.mode() === "save" ? "Сохранить" : "Запуск";
      },
      content(id) {
        const visibility = launcher.params.visibility.state();
        if (id === launcher.params.ids.time) {
          return icon.emoji(
            {
              keep: "play-button",
              now: "up-button",
              eight: "keycap-8",
              seven: "keycap-7",
              custom: "keycap-number-sign",
            }[launcher.params.timestamp.currentMode()] || "play-button",
          );
        }
        if (id === launcher.params.ids.sticky) {
          return icon.emoji(
            {
              none: "bookmark",
              left: "reverse-button",
              right: "right-arrow",
            }[visibility.sticky] || "bookmark",
          );
        }
        if (id === launcher.params.ids.updated) {
          return icon.emoji(
            visibility.updated === "on" ? "up-button" : "check-box-with-check",
          );
        }
        if (id === launcher.params.ids.visibility) {
          return icon.emoji(
            visibility.access === "link"
              ? "link"
              : "globe-showing-europe-africa",
          );
        }
        if (id === launcher.params.ids.status) {
          return icon.emoji(
            launcher.params.status.state() === "draft"
              ? "see-no-evil-monkey"
              : "eye",
          );
        }
        if (id === launcher.params.ids.mode) {
          if (launcher.params.submitAction.state() === "draft") {
            const primary = icon.fluent("Power", 20);
            const fallback = icon.fluent("Power", 24);
            return `<img class="toolbar-icon launchpad-command-icon" src="${primary}" alt="" onerror="this.onerror=null;this.src='${fallback}'">`;
          }
          return icon.emoji(launcher.params.submitAction.icon());
        }
        if (id === launcher.params.ids.submit) {
          return icon.emoji("check-mark-button");
        }
        return icon.emoji("check-mark-button");
      },
      step(list, current, reverse = false) {
        const index = Math.max(0, list.indexOf(current));
        const delta = reverse ? -1 : 1;
        return list[(index + delta + list.length) % list.length];
      },
      run(id, { reverse = false } = {}) {
        if (id === launcher.params.ids.time) {
          if (launcher.params.timestamp.commitCustomEdit()) return true;
          const current = launcher.params.timestamp.currentMode();
          const next = launcher.params.step(
            ["keep", "now", "eight", "seven", "custom"],
            current,
            reverse,
          );
          launcher.state.timeMode = next;
          launcher.params.timestamp.apply(next);
          return true;
        }
        if (id === launcher.params.ids.sticky) {
          const current = launcher.params.visibility.state().sticky;
          const next = launcher.params.step(
            ["none", "left", "right"],
            current,
            reverse,
          );
          const state = launcher.params.visibility.state();
          launcher.params.visibility.apply({ ...state, sticky: next });
          return true;
        }
        if (id === launcher.params.ids.updated) {
          const state = launcher.params.visibility.state();
          launcher.params.visibility.apply({
            ...state,
            updated: state.updated === "on" ? "off" : "on",
          });
          return true;
        }
        if (id === launcher.params.ids.visibility) {
          const state = launcher.params.visibility.state();
          launcher.params.visibility.apply({
            ...state,
            access: state.access === "link" ? "public" : "link",
          });
          return true;
        }
        if (id === launcher.params.ids.status) {
          return launcher.params.status.run();
        }
        if (id === launcher.params.ids.mode) {
          launcher.params.mode(
            launcher.params.mode() === "save" ? "publish" : "save",
          );
          return true;
        }
        if (id === launcher.params.ids.submit) {
          launcher.params.submitAction.run();
          return true;
        }
        return false;
      },
    },
    reader: {
      active(contextValue = launcher.state.context || context.detect()) {
        return contextValue?.surface === "reader";
      },
      touch() {
        return launcher.feed.touch();
      },
      keyboardThreshold() {
        const root = getComputedStyle(document.documentElement);
        const value = Number.parseFloat(
          root.getPropertyValue("--surface-reader-keyboard-open-threshold"),
        );
        return Number.isFinite(value) ? value : 80;
      },
      keyboardOpen() {
        return toolbar.keyboard() > launcher.reader.keyboardThreshold();
      },
      fixed(contextValue = launcher.state.context || context.detect()) {
        return launcher.reader.active(contextValue) && launcher.reader.touch();
      },
      rememberPlace(
        panelNode,
        contextValue = launcher.state.context || context.detect(),
      ) {
        if (!panelNode || !launcher.reader.fixed(contextValue)) return false;
        if (launcher.reader.keyboardOpen()) {
          launcher.state.readerPlace = "top";
          return true;
        }
        const rect = panelNode.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        const screen = toolbar.screen();
        const middle = screen.offsetTop + screen.height / 2;
        const center = rect.top + rect.height / 2;
        launcher.state.readerPlace = center <= middle ? "top" : "bottom";
        return true;
      },
      mode(contextValue = launcher.state.context || context.detect()) {
        if (!launcher.reader.active(contextValue)) {
          launcher.state.readerPlace = "";
          return "top-left";
        }
        if (!launcher.reader.touch()) {
          launcher.state.readerPlace = "";
          return "bottom-center";
        }
        if (launcher.reader.keyboardOpen()) {
          launcher.state.readerPlace = "top";
        }
        return launcher.state.readerPlace === "top"
          ? "top-center"
          : "bottom-center";
      },
      hudTop(panelNode = null) {
        const screen = toolbar.screen();
        const edge = toolbar.rail.dock.edge;
        const hud = document.getElementById("reader-panel-hud");
        const buttons = [
          ...(hud?.querySelectorAll?.(".reader-hud-button") || []),
        ];
        const tops = buttons
          .map((button) => button.getBoundingClientRect())
          .filter((rect) => rect.width > 0 && rect.height > 0)
          .map((rect) => rect.top);
        const fallback = (() => {
          const root = getComputedStyle(document.documentElement);
          const value = Number.parseFloat(
            root.getPropertyValue("--surface-reader-hud-top-offset"),
          );
          return screen.offsetTop + (Number.isFinite(value) ? value : 76);
        })();
        const top = tops.length ? Math.min(...tops) : fallback;
        const height =
          panelNode?.getBoundingClientRect?.().height ||
          panelNode?.offsetHeight ||
          0;
        const maxTop = screen.offsetTop + screen.height - height - edge;
        return Math.max(screen.offsetTop + edge, Math.min(maxTop, top));
      },
      point(panelNode) {
        const point = launcher.placement.home.point(panelNode);
        if (!point) return null;
        if (launcher.placement.home.mode() !== "top-center") return point;
        return {
          ...point,
          top: launcher.reader.hudTop(panelNode),
        };
      },
    },
    feed: null,
    view: null,
    editorial: {
      group() {
        return {
          id: "editorial-news",
          title: "Запил",
          commands: [
            commands.normalize("editorial.agent"),
            commands.normalize("editorial.draft"),
          ],
        };
      },
      groups(list = [], contextValue = {}, identity = {}) {
        const current = [...list];
        if (["source", "telegram"].includes(contextValue.surface)) {
          return [
            {
              id: "editorial-source",
              title: "Иношапотяне",
              commands: [commands.normalize("editorial.agent")],
            },
          ];
        }
        if (contextValue.surface === "post") {
          if (!launcher.marker.editor()) {
            if (
              identity.effectiveRole !== "authors" &&
              identity.realUser !== "baranov"
            ) {
              return current;
            }
            return [
              {
                id: "editorial-source",
                title: "Админка Onliner",
                commands: [commands.normalize("editorial.draft")],
              },
              ...current,
            ];
          }
          if (identity.effectiveRole === "editors") {
            return current;
          }
          return [launcher.editorial.group(), ...current];
        }
        return current;
      },
    },
    group: {
      normalizeCommands(list = []) {
        return groups.normalizeCommands(list);
      },
      meaningfulCommands(list = []) {
        return groups.meaningfulCommands(list);
      },
      rank(id = "") {
        return groups.rank(id);
      },
      normalizeScenario(value) {
        return groups.normalizeScenario(value);
      },
      normalize(value) {
        return groups.normalize(value);
      },
      allow(value, user, role, userId = "") {
        return groups.allow(value, user, role, userId);
      },
      merge(list = []) {
        return groups.merge(list);
      },
      attach(value, tools, { visible } = {}) {
        const id = String(value?.id || "");
        const meta = groups.meta(id);
        const map = new Map(tools.map((tool) => [tool.id, tool]));
        const groupCommands = (
          Array.isArray(value?.commands) ? value.commands : []
        )
          .map((item) => {
            if (!launcher.command.available(item)) return null;
            const id = commands.toolId(item);
            if (typeof visible === "function" && !visible(id)) return null;
            if (launcher.command.loader(item)) {
              const tool = map.get(id) || null;
              if (!tool) return null;
              return { ...item, tool };
            }
            return { ...item };
          })
          .filter(Boolean);
        return {
          id,
          title: String(value?.title || meta.title || ""),
          commands: launcher.group.normalizeCommands(groupCommands),
        };
      },
      empty(value) {
        return groups.empty(value);
      },
      order(list = []) {
        return groups.order(list);
      },
      pinned(list = []) {
        return groups.pinned(list);
      },
      roadmap(list = []) {
        return groups.roadmap(list);
      },
      submit(list = []) {
        return groups.submit(list);
      },
      feedback(list = []) {
        return groups.feedback(list);
      },
      emojis(list = []) {
        return list.filter((group) => launcher.feed.visible(group));
      },
      without(list = [], ids = []) {
        return groups.without(list, ids);
      },
      commands(list = []) {
        return groups.commands(list);
      },
      commandIds(list = []) {
        return groups.commandIds(list);
      },
      sameCommands(left = [], right = []) {
        return groups.sameCommands(left, right);
      },
      suppressRoleDuplicates(list = [], role = "") {
        return groups.suppressRoleDuplicates(list, role);
      },
      hasCommand(list = [], id = "") {
        return groups.hasCommand(list, id);
      },
      hasUsefulCommand(list = []) {
        return groups.hasUsefulCommand(list);
      },
      omitCommand(list = [], id = "") {
        return groups.omitCommand(list, id);
      },
      toolboxIdentities(identity = {}) {
        const realUser = String(identity.realUser || "");
        const realUserId = String(identity.realUserId || "");
        const realRole = String(identity.realRole || "");
        return [
          {
            user: realUser,
            role: realRole,
            userId: realUserId,
          },
          {
            user: "__preview__",
            role: "author",
            userId: "",
          },
          {
            user: "__preview__",
            role: "editor",
            userId: "",
          },
          {
            user: "__preview__",
            role: "authors",
            userId: "",
          },
          {
            user: "__preview__",
            role: "editors",
            userId: "",
          },
          {
            user: "__preview__",
            role: "test",
            userId: realUserId,
          },
        ];
      },
      toolbox(list = [], identity = {}, tools = [], options = {}) {
        const groups = launcher.group
          .toolboxIdentities(identity)
          .flatMap(({ user, role, userId }) =>
            list.map((group) =>
              launcher.group.allow(group, user, role, userId),
            ),
          )
          .filter((group) => !launcher.group.empty(group));
        return launcher.group
          .merge(groups)
          .map((group) => launcher.group.attach(group, tools, options))
          .filter((group) => !launcher.group.empty(group));
      },
    },
    node: {
      panel() {
        return document.getElementById(launcher.id);
      },
    },
    zoom: {
      viewport: {
        node: null,
        content: null,
        created: false,
      },
      iphone() {
        return /iPhone|iPod/.test(navigator.userAgent || "");
      },
      content() {
        return "width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover";
      },
      enable() {
        if (!launcher.zoom.iphone()) return;
        const current = document.querySelector('meta[name="viewport"]');
        const node = current || document.createElement("meta");
        launcher.zoom.viewport.node = node;
        launcher.zoom.viewport.content = node.getAttribute("content") || "";
        launcher.zoom.viewport.created = !current;
        node.setAttribute("name", "viewport");
        node.setAttribute("content", launcher.zoom.content());
        if (!current) document.head.appendChild(node);
      },
      disable() {
        const node = launcher.zoom.viewport.node;
        if (!node) return;
        if (launcher.zoom.viewport.created) node.remove();
        if (!launcher.zoom.viewport.created) {
          node.setAttribute("content", launcher.zoom.viewport.content);
        }
        launcher.zoom.viewport.node = null;
        launcher.zoom.viewport.content = null;
        launcher.zoom.viewport.created = false;
      },
    },
    theme() {
      if (launcher.state.currentTheme) return launcher.state.currentTheme;
      const current =
        launcher.node.panel()?.dataset.theme ||
        toolbar.state(launcher.state.theme) ||
        "light";
      launcher.state.currentTheme = current;
      return current;
    },
    syncTheme(value = "") {
      const panelNode = launcher.node.panel();
      const theme =
        value ||
        panelNode?.dataset.theme ||
        toolbar.state(launcher.state.theme) ||
        "light";
      launcher.state.currentTheme = theme;
      toolbar.state(launcher.state.theme, theme);
      if (!panelNode) return theme;
      ui.surface.sync(panelNode, {
        layout: "fullscreen",
        theme,
        surface: "toolbar",
      });
      panelNode.dataset.toolbarFlow = "rail";
      return theme;
    },
    setTheme(theme) {
      launcher.state.currentTheme = theme;
      const panelNode = launcher.node.panel();
      toolbar.state(launcher.state.theme, theme);
      if (!panelNode) return theme;
      ui.surface.sync(panelNode, {
        layout: "fullscreen",
        theme,
        surface: "toolbar",
      });
      panelNode.dataset.toolbarFlow = "rail";
      return theme;
    },
    icon(value) {
      const source = String(value || "").trim();
      const match = source.match(/^favicon:(.+)$/i);
      if (source.match(/^logo:(.+)$/i)) {
        const logo = source.match(/^logo:(.+)$/i)[1].trim();
        return icon.logo(logo, logo, "toolbar-logo");
      }
      if (!match) return icon.emoji(source || "bookmark");
      const domain = match[1].trim();
      if (!domain) return icon.emoji("bookmark");
      return icon.logo.favicon(domain, domain, "toolbar-logo");
    },
    debug: {
      enabled() {
        const params = new URL(location.href).searchParams;
        if (params.get("launchpadDebug") === "1") return true;
        try {
          return localStorage.getItem("ONLINER_LAUNCHPAD_DEBUG") === "1";
        } catch {
          return false;
        }
      },
      key(value) {
        return JSON.stringify({
          context: value.context,
          role: value.role,
          realUser: value.realUser,
          realUserId: value.realUserId,
          realRole: value.realRole,
          effectiveUser: value.effectiveUser,
          effectiveRole: value.effectiveRole,
          roleSource: value.roleSource,
          previewRole: value.previewRole,
          previewMode: value.previewMode,
          impersonation: value.impersonation,
          marker: value.marker,
          scenarios: value.scenarios.map((item) => item.id),
          activeScenario: value.activeScenario?.id || "",
          toolIds: value.allowedToolIds,
          deniedToolIds: value.deniedToolIds,
          missingToolIds: value.missingToolIds,
          group: launcher.feed.current(value.groups),
        });
      },
      sync(value) {
        window.__ONLINER_LAUNCHPAD_DEBUG__ = value;
        if (!launcher.debug.enabled()) return value;
        const key = launcher.debug.key(value);
        if (launcher.state.debugKey === key) return value;
        launcher.state.debugKey = key;
        console.log("ONLINER_LAUNCHPAD_DEBUG", value);
        return value;
      },
    },
    snapshot() {
      const contextValue = context.detect();
      launcher.state.context = contextValue;
      const identity = launcher.identity.identity(contextValue);
      const availableScenarios = scenarios.visible(
        contextValue,
        scenarios.all(),
        identity.effectiveRole,
      );
      const activeScenario = scenarios.resolve(
        launcher.state.scenario,
        availableScenarios,
      );
      launcher.feed.clearScenario(activeScenario?.id || "");
      const availableToolIds = launcher.catalog.map((tool) => tool.id);
      const normalizedGroups = launcher.group.normalizeScenario(
        activeScenario,
        {
          contextValue,
          identity,
        },
      );
      const commandList = normalizedGroups.flatMap((group) => group.commands);
      const deniedCommands = commandList
        .filter(
          (command) =>
            !commands.allowed(
              command,
              identity.effectiveUser,
              identity.effectiveRole,
              identity.effectiveUserId,
            ),
        )
        .map((command) => ({
          id: commands.id(command),
          reason: commands.reason(
            command,
            identity.effectiveUser,
            identity.effectiveRole,
            identity.effectiveUserId,
          ),
        }))
        .filter((item) => item.id);
      const allowedCommands = commandList.filter((command) =>
        commands.allowed(
          command,
          identity.effectiveUser,
          identity.effectiveRole,
          identity.effectiveUserId,
        ),
      );
      const deniedToolIds = deniedCommands.map((item) => item.id);
      const visible = (id) => {
        if (
          contextValue.surface === "madtest" &&
          contextValue.madtestPage === "home"
        ) {
          return id === "madtest-find";
        }
        if (id === "madtest.find") return Boolean(contextValue.madtestImport);
        return true;
      };
      const scopedGroups =
        activeScenario?.id === "onliner" && !contextValue.madtestImport
          ? launcher.group.omitCommand(normalizedGroups, "madtest.find")
          : normalizedGroups;
      const allowedGroups = scopedGroups
        .map((group) =>
          launcher.group.allow(
            group,
            identity.effectiveUser,
            identity.effectiveRole,
            identity.effectiveUserId,
          ),
        )
        .filter((group) => !launcher.group.empty(group));
      const attachedGroups = launcher.editorial.groups(
        launcher.group
          .merge(allowedGroups)
          .map((group) =>
            launcher.group.attach(group, launcher.catalog, { visible }),
          )
          .filter((group) => !launcher.group.empty(group)),
        contextValue,
        identity,
      );
      const markerCommand =
        launcher.group.hasCommand(attachedGroups, "whoami") &&
        launcher.group.hasUsefulCommand(attachedGroups)
          ? "whoami"
          : "";
      const groups = launcher.group.order(
        markerCommand
          ? launcher.group.omitCommand(attachedGroups, markerCommand)
          : attachedGroups,
      );
      const scopedRoleGroups = contextValue.madtestImport
        ? groups
        : launcher.group.omitCommand(groups, "madtest.find");
      const roleGroups = scopedRoleGroups;
      const toolboxGroups = launcher.group.order(
        launcher.group.toolbox(normalizedGroups, identity, launcher.catalog, {
          visible,
        }),
      );
      const scopedToolboxGroups = contextValue.madtestImport
        ? toolboxGroups
        : launcher.group.omitCommand(toolboxGroups, "madtest.find");
      const tools = roleGroups
        .flatMap((group) => group.commands)
        .map((item) => item.tool)
        .filter(Boolean);
      const allowedToolIds = tools.map((tool) => tool.id);
      const missingToolIds = allowedCommands
        .filter((command) => launcher.command.loader(command))
        .map((command) => commands.toolId(command))
        .filter(Boolean)
        .filter((id) => !availableToolIds.includes(id));
      const marker = launcher.marker.meta({
        context: contextValue,
        activeScenario,
        realUser: identity.realUser,
        effectiveRole: identity.effectiveRole,
        previewRole: identity.previewRole,
        previewMode: identity.previewMode,
        markerCommand,
      });
      return launcher.debug.sync({
        context: contextValue,
        role: identity.effectiveRole,
        realUser: identity.realUser,
        realUserId: identity.realUserId,
        realRole: identity.realRole,
        effectiveUser: identity.effectiveUser,
        effectiveUserId: identity.effectiveUserId,
        effectiveRole: identity.effectiveRole,
        roleSource: identity.roleSource,
        previewRole: identity.previewRole,
        previewMode: identity.previewMode,
        impersonation: identity.impersonation,
        marker,
        markerCommand,
        usage: launcher.preview.usage(),
        scenarios: availableScenarios,
        activeScenario,
        rawGroups: scopedGroups,
        commands: commandList,
        allowedCommands,
        groups: roleGroups,
        toolboxGroups: scopedToolboxGroups,
        toolIds: allowedToolIds,
        allowedToolIds,
        availableToolIds,
        deniedToolIds,
        deniedToolReasons: deniedCommands,
        missingToolIds,
        tools,
      });
    },
    position(value) {
      return toolbar.state(launcher.state.position, value);
    },
    positionClear() {
      return launcher.position(null);
    },
    placement: null,
    place() {
      const panelNode = launcher.node.panel();
      if (!panelNode) return false;
      const contextValue = launcher.state.context || context.detect();
      if (contextValue.surface === "reader") {
        toolbar.behavior.railAnchorClear(panelNode);
        delete panelNode.dataset.manual;
        delete panelNode.dataset.toolbarRestore;
        panelNode.dataset.dock = "floating";
        panelNode.dataset.dockTarget = "floating";
        const point = launcher.reader.point(panelNode);
        if (!point) return false;
        return launcher.placement.apply(panelNode, {
          ...point,
          dock: { target: "floating", side: "floating" },
        });
      }
      const saved = launcher.placement.saved();
      if (saved) return launcher.placement.apply(panelNode, saved);
      const current = launcher.placement.current(panelNode);
      if (current && panelNode.dataset.manual === "true") {
        return launcher.placement.apply(panelNode, current);
      }
      return (
        launcher.state.controller?.behavior.place({ restore: false }) || false
      );
    },
    render({ safe = false, place = false } = {}) {
      const panelNode = launcher.node.panel();
      if (!panelNode) return;
      const contextValue = launcher.state.context || context.detect();
      launcher.reader.rememberPlace(panelNode, contextValue);
      toolbar.appearance.rerender(
        panelNode,
        () => {
          panelNode.innerHTML = launcher.html();
        },
        {
          sync: () => launcher.state.controller?.appearance.sync(),
        },
      );
      const keepPlaced = place || launcher.reader.fixed(contextValue);
      toolbar.reflow(panelNode, keepPlaced ? () => launcher.place() : null);
      if (launcher.state.feed.groupMotion === "enter") {
        requestAnimationFrame(() => {
          launcher.state.feed.groupMotion = "";
          launcher.state.feed.groupMotionId = "";
        });
      }
      if (launcher.state.feed.roadmapMotion === "enter") {
        requestAnimationFrame(() => {
          launcher.state.feed.roadmapMotion = "";
        });
      }
      if (safe) {
        const applySafe = () => {
          const contextValue = launcher.state.context || context.detect();
          if (contextValue.surface === "reader") {
            launcher.place();
            return;
          }
          launcher.placement.safe(panelNode);
        };
        requestAnimationFrame(() => {
          applySafe();
          requestAnimationFrame(applySafe);
        });
      }
      launcher.activeSync();
      launcher.params.remember();
    },
    mount() {
      launcher.zoom.enable();
      launcher.legacy.clear();
      const node = host.create({
        id: launcher.id,
        className: "panel launchpad-panel",
        place: "right",
        html: launcher.html(),
      });
      launcher.syncTheme(node.dataset.theme);
      node.dataset.toolbarFlow = "rail";
      const preset = toolbar.presets.railDocked("content", {
        placement: {
          mode: () => launcher.placement.home.mode(),
          bounds: () =>
            launcher.placement.home.inset(launcher.placement.home.bounds()),
          edge: 0,
        },
      });
      launcher.state.controller = toolbar.controller({
        panel: node,
        ...preset,
        theme: () => launcher.theme(),
        actions: {
          keepFocus: true,
          action: launcher.click,
        },
        drag: {
          ...preset.drag,
          canStart(event) {
            const action =
              event.target
                ?.closest?.("[data-action]")
                ?.getAttribute?.("data-action") || "";
            if (
              [
                "marker-command",
                "preview-role",
                "role-cycle",
                "scenario",
              ].includes(action)
            ) {
              return false;
            }
            return preset.drag?.canStart ? preset.drag.canStart(event) : true;
          },
          onMove() {
            const rect = node.getBoundingClientRect();
            toolbar.hint.update(node, {
              dock: launcher.placement.dock(node),
              value: { left: rect.left, top: rect.top },
              margin: toolbar.rail.dock.margin,
              edge: toolbar.rail.dock.edge,
              floating:
                node.dataset.dock === "left" || node.dataset.dock === "right",
            });
          },
          onEnd(data = {}) {
            if (!data.moved) return;
            const dock = launcher.placement.dock(node);
            const rect = node.getBoundingClientRect();
            toolbar.behavior.dockApply({
              panel: node,
              dock,
              value: { left: rect.left, top: rect.top },
              margin: toolbar.rail.dock.margin,
              edge: toolbar.rail.dock.edge,
              line: "[data-line]",
              normalize(panelNode, side, previous) {
                toolbar.behavior.dockNormalize({
                  panel: panelNode,
                  side,
                  previous,
                  line: "[data-line]",
                });
              },
            });
            const contextValue = launcher.state.context || context.detect();
            if (contextValue.surface !== "reader") {
              launcher.placement.persist(node, {
                side: node.dataset.dock || dock.side || "floating",
                target: node.dataset.dockTarget || dock.target || "floating",
              });
              launcher.placement.safe(node);
            }
            node.dataset.moved = "false";
          },
        },
      });
      launcher.state.controller.appearance.sync();
      launcher.place();
      requestAnimationFrame(() => {
        const contextValue = launcher.state.context || context.detect();
        if (contextValue.surface === "reader") {
          launcher.place();
          return;
        }
        launcher.placement.safe(node);
      });
      launcher.bind();
      launcher.bindActive();
      launcher.bindParams();
      launcher.bindContext();
      launcher.keyboard.bind();
      launcher.activeSync();
      launcher.state.context = context.detect();
      launcher.madtest.sync(launcher.state.context);
      launcher.adminSanitizer.sync(launcher.state.context);
      launcher.params.timestamp.base(launcher.params.timestamp.hidden());
      launcher.observeLayout();
      window.addEventListener("resize", launcher.place);
      window.visualViewport?.addEventListener("resize", launcher.place);
      window.visualViewport?.addEventListener("scroll", launcher.place);
    },
    unmount() {
      const panelNode = launcher.node.panel();
      if (panelNode) {
        launcher.state.controller?.behavior.destroy();
        launcher.state.controller = null;
        panelNode.remove();
      }
      window.removeEventListener("resize", launcher.place);
      window.visualViewport?.removeEventListener("resize", launcher.place);
      window.visualViewport?.removeEventListener("scroll", launcher.place);
      if (launcher.state.activeSync) {
        document.removeEventListener(
          "selectionchange",
          launcher.state.activeSync,
        );
        document.removeEventListener("input", launcher.state.activeSync, true);
        document.removeEventListener("keyup", launcher.state.activeSync, true);
      }
      if (launcher.state.parameterSync) {
        document.removeEventListener(
          "change",
          launcher.state.parameterSync,
          true,
        );
        document.removeEventListener(
          "click",
          launcher.state.parameterSync,
          true,
        );
        document.removeEventListener(
          "keyup",
          launcher.state.parameterSync,
          true,
        );
      }
      if (launcher.state.toolFocusSync) {
        document.removeEventListener(
          "pointerdown",
          launcher.state.toolFocusSync,
          true,
        );
        document.removeEventListener(
          "touchstart",
          launcher.state.toolFocusSync,
          true,
        );
      }
      if (launcher.state.clickSync) {
        document.removeEventListener("click", launcher.state.clickSync, true);
      }
      launcher.state.activeSync = null;
      launcher.state.parameterSync = null;
      launcher.state.toolFocusSync = null;
      launcher.state.clickSync = null;
      launcher.state.parameterRenderKey = "";
      launcher.state.timeBaseStamp = null;
      launcher.madtest.stop();
      launcher.adminSanitizer.stop();
      launcher.keyboard.unbind();
      launcher.unbindContext();
      launcher.zoom.disable();
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
      if (window.__ONLINER_LAUNCHPAD__ === launcher) {
        delete window.__ONLINER_LAUNCHPAD__;
      }
    },
    loader: null,
    popupMode(id) {
      return (
        {
          fields: "titles",
          "editor.fields": "titles",
          "fields.titles": "titles",
          "editor.titles": "titles",
          "fields.excerpt": "excerpt",
          "editor.excerpt": "excerpt",
          "fields.slug": "slug",
          "editor.slug": "slug",
          "fields.delivery": "delivery",
          "editor.delivery": "delivery",
        }[String(id || "")] || ""
      );
    },
    runPopup(id) {
      const mode = launcher.popupMode(id);
      if (!mode) return false;
      ui.popup.open(mode);
      return true;
    },
    runCommand(id, options = {}) {
      if (launcher.command.parameter({ id })) {
        return launcher.params.run(id, options);
      }
      if (id === "prepare") {
        const prepared = launcher.params.schedule.prepare();
        if (prepared) launcher.render();
        return prepared;
      }
      if (id === "refresh") {
        const prepared = launcher.params.update.prepare();
        if (prepared) launcher.render();
        return prepared;
      }
      if (actions.has(id)) {
        actions.run(id, options);
        return true;
      }
      if (launcher.runPopup(id)) {
        return true;
      }
      launcher.loader?.runTool(id);
      return true;
    },
    click({ name, button, event }) {
      const panelNode = launcher.node.panel();
      if (panelNode?.dataset.moved === "true") {
        panelNode.dataset.moved = "false";
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
        launcher.setTheme(launcher.theme() === "light" ? "dark" : "light");
        launcher.render();
        return;
      }
      if (action === "marker-command") {
        const command = button.dataset.command || id;
        if (command) launcher.runCommand(command, { silent: true });
        launcher.render({ place: true });
        return;
      }
      if (action === "scenario") {
        launcher.state.scenario = id;
        launcher.feed.clear();
        launcher.render({ place: true });
        return;
      }
      if (action === "preview-role") {
        const role = button.dataset.role || "";
        const contextValue = context.detect();
        const user = context.account();
        const snapshot = launcher.snapshot();
        if (role) {
          launcher.preview.set(contextValue, user, role);
        } else if (
          snapshot.previewRole === "author" ||
          snapshot.previewRole === "editor"
        ) {
          launcher.preview.set(contextValue, user, "");
        } else {
          launcher.preview.cycle(contextValue, user);
        }
        launcher.feed.clear();
        launcher.render({ place: true });
        return;
      }
      if (action === "role-cycle") {
        const contextValue = context.detect();
        const identity = launcher.identity.identity(contextValue);
        launcher.identity.rotate.cycle(contextValue, identity.effectiveRole);
        launcher.feed.clear();
        launcher.render({ place: true });
        return;
      }
      if (action === "group") {
        const snapshot = launcher.snapshot();
        if (!launcher.feed.toolbox() && id === "roadmap") {
          launcher.feed.toggleRoadmap();
        } else if (launcher.view.superuser(snapshot) && id === "toolbox") {
          launcher.feed.setToolbox(
            id,
            snapshot.toolboxGroups || snapshot.groups,
          );
        } else if (launcher.feed.toolbox()) {
          launcher.feed.setToolbox(
            id,
            snapshot.toolboxGroups || snapshot.groups,
          );
        } else {
          launcher.feed.set(id, snapshot.groups);
        }
        launcher.render();
        return;
      }
      if (action === "tool") {
        const parameter = launcher.command.parameter({ id });
        const close = button.dataset.close || "";
        const snapshot = launcher.snapshot();
        launcher.runCommand(id, { reverse: Boolean(event?.altKey) });
        if (close === "group") launcher.feed.closeGroup(snapshot.groups);
        launcher.render();
      }
    },
    activeSync() {
      const panelNode = launcher.node.panel();
      if (!panelNode) return;
      panelNode
        .querySelectorAll('[data-action="tool"][data-id]')
        .forEach((button) => {
          const id = button.dataset.id || "";
          if (actions.active(id)) {
            button.dataset.active = "true";
            return;
          }
          delete button.dataset.active;
        });
    },
    bindActive() {
      if (launcher.state.activeSync) return;
      const sync = () => launcher.activeSync();
      launcher.state.activeSync = sync;
      document.addEventListener("selectionchange", sync);
      document.addEventListener("input", sync, true);
      document.addEventListener("keyup", sync, true);
    },
    bindParams() {
      if (launcher.state.parameterSync) return;
      const sync = (event) => {
        if (!launcher.params.syncTarget(event.target)) return;
        if (event.isTrusted && launcher.params.syncTimeTarget(event.target)) {
          launcher.params.timestamp.clearCycleMode();
        }
        launcher.params.sync();
      };
      launcher.state.parameterSync = sync;
      document.addEventListener("change", sync, true);
      document.addEventListener("click", sync, true);
      document.addEventListener("keyup", sync, true);
    },
    keyboard: {
      ipad() {
        return (
          /iPhone|iPad|iPod/.test(navigator.platform) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
        );
      },
      apple() {
        return /Mac/.test(navigator.platform) && !launcher.keyboard.ipad();
      },
      mod(event) {
        if (launcher.keyboard.apple()) {
          return event.altKey && event.metaKey && !event.ctrlKey;
        }
        return event.altKey && !event.ctrlKey && !event.metaKey;
      },
      visible(contextValue, id) {
        return commands.keyboardVisible(id, contextValue);
      },
      roleCommands(snapshot, role) {
        const contextValue = snapshot.context || context.detect();
        const visible = (id) => launcher.keyboard.visible(contextValue, id);
        const current = (snapshot.rawGroups || [])
          .map((group) =>
            launcher.group.allow(
              group,
              snapshot.effectiveUser,
              role,
              snapshot.effectiveUserId,
            ),
          )
          .filter((group) => !launcher.group.empty(group));
        const attached = launcher.editorial.groups(
          launcher.group
            .merge(current)
            .map((group) =>
              launcher.group.attach(group, launcher.catalog, { visible }),
            )
            .filter((group) => !launcher.group.empty(group)),
          contextValue,
          {
            realUser: snapshot.realUser,
            effectiveRole: role,
          },
        );
        return launcher.group.order(attached);
      },
      commands() {
        const snapshot = launcher.snapshot();
        const pair = launcher.identity.rotate.pair(snapshot.effectiveRole);
        if (!pair.length) {
          return snapshot.groups.flatMap((group) => group.commands || []);
        }
        return launcher.group
          .merge(
            pair.flatMap((role) =>
              launcher.keyboard.roleCommands(snapshot, role),
            ),
          )
          .flatMap((group) => group.commands || []);
      },
      match(event) {
        const code = String(event.code || "");
        if (!code) return null;
        return (
          launcher.keyboard
            .commands()
            .find((command) => (command.hotkeys || []).includes(code)) || null
        );
      },
      fallback(event) {
        const id =
          {
            ArrowLeft: "left",
            ArrowRight: "right",
          }[String(event.code || "")] || "";
        if (!id) return null;
        if (!actions.element?.()) return null;
        return { id, close: "stay" };
      },
      run(event) {
        if (event.defaultPrevented) return false;
        if (!launcher.node.panel()) return false;
        if (!launcher.keyboard.mod(event)) return false;
        const command =
          launcher.keyboard.match(event) || launcher.keyboard.fallback(event);
        if (!command) return false;
        event.preventDefault();
        event.stopPropagation?.();
        launcher.runCommand(commands.id(command), {
          reverse: Boolean(event.shiftKey),
        });
        if (command.close === "group") {
          const snapshot = launcher.snapshot();
          launcher.feed.closeGroup(snapshot.groups);
          launcher.render();
        } else {
          launcher.render();
        }
        return true;
      },
      tinyEditor() {
        const editor =
          window.tinyMCE?.get?.("content") ||
          window.tinyMCE?.activeEditor ||
          null;
        if (!editor) return null;
        if (typeof editor.isHidden === "function" && editor.isHidden()) {
          return null;
        }
        return editor;
      },
      tinyDocument(editor = launcher.keyboard.tinyEditor()) {
        const doc = editor?.getDoc?.() || null;
        return doc?.body ? doc : null;
      },
      bindTiny() {
        if (!launcher.state.keyboardTinySync) {
          launcher.state.keyboardTinySync = (event) =>
            launcher.keyboard.run(event);
        }
        const editor = launcher.keyboard.tinyEditor();
        const doc = launcher.keyboard.tinyDocument(editor);
        if (!editor || !doc) return;
        if (doc !== launcher.state.keyboardTinyDoc) {
          if (launcher.state.keyboardTinyDoc) {
            launcher.state.keyboardTinyDoc.removeEventListener(
              "keydown",
              launcher.state.keyboardTinySync,
              true,
            );
          }
          doc.addEventListener(
            "keydown",
            launcher.state.keyboardTinySync,
            true,
          );
          launcher.state.keyboardTinyDoc = doc;
        }
        if (editor === launcher.state.keyboardTinyEditor) return;
        if (launcher.state.keyboardTinyEditor?.off) {
          launcher.state.keyboardTinyEditor.off(
            "keydown",
            launcher.state.keyboardTinySync,
          );
        }
        editor.on?.("keydown", launcher.state.keyboardTinySync);
        launcher.state.keyboardTinyEditor = editor;
      },
      bind() {
        if (launcher.state.keyboardSync) return;
        const sync = (event) => launcher.keyboard.run(event);
        launcher.state.keyboardSync = sync;
        document.addEventListener("keydown", sync, true);
        launcher.keyboard.bindTiny();
        launcher.state.keyboardTinyTimer = window.setInterval(
          launcher.keyboard.bindTiny,
          700,
        );
      },
      unbind() {
        if (launcher.state.keyboardSync) {
          document.removeEventListener(
            "keydown",
            launcher.state.keyboardSync,
            true,
          );
        }
        if (launcher.state.keyboardTinyDoc && launcher.state.keyboardTinySync) {
          launcher.state.keyboardTinyDoc.removeEventListener(
            "keydown",
            launcher.state.keyboardTinySync,
            true,
          );
        }
        if (
          launcher.state.keyboardTinyEditor?.off &&
          launcher.state.keyboardTinySync
        ) {
          launcher.state.keyboardTinyEditor.off(
            "keydown",
            launcher.state.keyboardTinySync,
          );
        }
        if (launcher.state.keyboardTinyTimer) {
          window.clearInterval(launcher.state.keyboardTinyTimer);
        }
        launcher.state.keyboardSync = null;
        launcher.state.keyboardTinySync = null;
        launcher.state.keyboardTinyDoc = null;
        launcher.state.keyboardTinyEditor = null;
        launcher.state.keyboardTinyTimer = 0;
      },
    },
    bindToolFocus() {
      if (launcher.state.toolFocusSync) return;
      const sync = (event) => {
        const button = event.target?.closest?.(`#${launcher.id} [data-action]`);
        if (!button) return;
        event.preventDefault();
      };
      launcher.state.toolFocusSync = sync;
      document.addEventListener("pointerdown", sync, true);
      document.addEventListener("touchstart", sync, true);
    },

    bindClick() {
      if (launcher.state.clickSync) return;
      const sync = (event) => {
        const head = event.target?.closest?.(
          `#${launcher.id} [data-launchpad-group-head="true"]`,
        );
        if (!head) return;
        const button = head.querySelector?.('[data-action="group"]');
        if (!button) return;
        event.preventDefault();
        event.stopPropagation?.();
        event.stopImmediatePropagation?.();
        launcher.click({
          name: button.dataset.action || "",
          button,
          event,
        });
      };
      launcher.state.clickSync = sync;
      document.addEventListener("click", sync, true);
    },
    bindLine() {
      const panelNode = launcher.node.panel();
      if (!panelNode) return;
      toolbar.behavior.line({
        panel: panelNode,
        strip: "[data-line]",
        axis: () =>
          panelNode.dataset.dock === "left" ||
          panelNode.dataset.dock === "right"
            ? "y"
            : "x",
        bound: "launcher",
      });
    },
    syncContext() {
      const next = context.detect();
      const current = launcher.state.context || {};
      if (context.key(next) === context.key(current)) return;
      launcher.state.context = next;
      launcher.state.parameterMode = "";
      launcher.params.timestamp.clearMode();
      launcher.params.timestamp.base(launcher.params.timestamp.hidden());
      launcher.state.scenario = "";
      launcher.feed.clear();
      launcher.render({ safe: true });
      requestAnimationFrame(() => launcher.place());
      launcher.madtest.sync(next);
      launcher.adminSanitizer.sync(next);
    },
    observeLayout() {
      const layout = document.querySelector("#layout_select");
      const sync = () => launcher.syncContext();
      if (layout) layout.addEventListener("change", sync);
      launcher.state.contextTimer = window.setInterval(sync, 500);
      launcher.state.layoutInput = layout;
      launcher.state.layoutSync = sync;
    },
    bindContext() {
      if (launcher.state.contextSync) return;
      const sync = () => launcher.syncContext();
      launcher.state.contextSync = sync;
      window.addEventListener("onliner:context-change", sync);
    },
    unbindContext() {
      if (!launcher.state.contextSync) return;
      window.removeEventListener(
        "onliner:context-change",
        launcher.state.contextSync,
      );
      launcher.state.contextSync = null;
    },
    bind() {
      const panelNode = launcher.node.panel();
      if (!panelNode) return;
      launcher.bindClick();
      launcher.bindLine();
      launcher.bindToolFocus();
      launcher.state.controller?.behavior.bind();
    },
    run() {
      if (launcher.node.panel()) {
        launcher.unmount();
      }
      launcher.mount();
    },
  };
  const launcher = launchpad;
  Object.assign(
    launchpad,
    launchpadFeed.create({
      launcher,
      groups,
      ui,
      icon,
      toolbar,
      commands,
    }),
  );
  launchpad.placement = launchpadPlacement.create({
    getPosition: () => launchpad.position(),
    setPosition: (value) => launchpad.position(value),
    clearPosition: () => launchpad.positionClear(),
    home: {
      mode() {
        const contextValue = launchpad.state.context || context.detect();
        return launchpad.reader.mode(contextValue);
      },
      workspaceNode() {
        const contextValue = launchpad.state.context || context.detect();
        if (contextValue.surface === "reader") return null;
        return (
          document.getElementById("post-body-content") ||
          document.getElementById("content") ||
          null
        );
      },
    },
  });
  launchpad.loader = launchpadLoader.create({
    getManifestCache: () => launchpad.state.manifest,
    setManifestCache: (value) => {
      launchpad.state.manifest = value;
      return launchpad.state.manifest;
    },
    tools: launchpad.catalog,
  });
  const previous = window.__ONLINER_LAUNCHPAD__;
  if (previous && previous !== launchpad) {
    try {
      previous.unmount?.();
    } catch {}
  }
  window.__ONLINER_LAUNCHPAD__ = launchpad;
  launchpad.run();
  actions.admin?.crawler?.sections?.worker?.();
})();
