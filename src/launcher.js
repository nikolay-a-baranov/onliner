import { panel } from "./core/panel.js";
import { toolbar } from "./core/toolbar.js";
import { icon } from "./core/icon.js";
import { ui } from "./core/ui.js";
import { cms } from "./core/cms.js";
import { context } from "./runtime/context.js";
import { scenario } from "./runtime/scenario.js";
import { scenarios } from "./runtime/scenarios.js";
import { groups } from "./runtime/groups.js";
import { commands } from "./runtime/commands.js";
import { actions } from "./core/actions.js";

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
      context: null,
      activeSync: null,
      keyboardSync: null,
      keyboardTinySync: null,
      keyboardTinyDoc: null,
      keyboardTinyEditor: null,
      keyboardTinyTimer: 0,
      contextSync: null,
      feed: {
        group: null,
        toolbox: false,
        scenario: "",
      },
      parameterMode: "publish",
      timeMode: "",
      submitTimeMode: "",
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
        const realUserId = value.userId || "";
        const realRole = launcher.scenarios.userRole(value);
        const previewRole = launcher.preview.role(value, realUser);
        if (previewRole) {
          return {
            realUser,
            realUserId,
            realRole,
            effectiveUser: "__preview__",
            effectiveUserId: previewRole === "test" ? realUserId : "",
            effectiveRole: previewRole,
            previewRole,
            previewMode: true,
            impersonation: true,
          };
        }
        if (realUser !== "baranov") {
          return {
            realUser,
            realUserId,
            realRole,
            effectiveUser: realUser,
            effectiveUserId: realUserId,
            effectiveRole: realRole,
            previewRole: "",
            previewMode: false,
            impersonation: false,
          };
        }
        return {
          realUser,
          realUserId,
          realRole,
          effectiveUser: realUser,
          effectiveUserId: realUserId,
          effectiveRole: realRole,
          previewRole: "",
          previewMode: false,
          impersonation: false,
        };
      },
      context() {
        return context.detect();
      },
      list() {
        return scenario.external(scenarios.list, []);
      },
    },
    preview: {
      key: "ONLINER_LAUNCHER_PREVIEW_ROLE",
      usage() {
        return {
          setAuthor: 'localStorage.ONLINER_LAUNCHER_PREVIEW_ROLE = "author"',
          setEditor: 'localStorage.ONLINER_LAUNCHER_PREVIEW_ROLE = "editor"',
          setAuthors: 'localStorage.ONLINER_LAUNCHER_PREVIEW_ROLE = "authors"',
          setEditors: 'localStorage.ONLINER_LAUNCHER_PREVIEW_ROLE = "editors"',
          setTest: 'localStorage.ONLINER_LAUNCHER_PREVIEW_ROLE = "test"',
          clear: 'localStorage.removeItem("ONLINER_LAUNCHER_PREVIEW_ROLE")',
        };
      },
      enabled(value, user) {
        return user === "baranov" && value.surface === "post";
      },
      role(value, user) {
        if (!launcher.preview.enabled(value, user)) return "";
        try {
          const role = localStorage.getItem(launcher.preview.key) || "";
          if (
            role === "author" ||
            role === "editor" ||
            role === "authors" ||
            role === "editors" ||
            role === "test"
          ) {
            return role;
          }
          return "";
        } catch {
          return "";
        }
      },
      set(value, user, role = "") {
        if (!launcher.preview.enabled(value, user)) return "";
        const next = [
          "author",
          "editor",
          "authors",
          "editors",
          "test",
        ].includes(role)
          ? role
          : "";
        try {
          if (next) localStorage.setItem(launcher.preview.key, next);
          else localStorage.removeItem(launcher.preview.key);
        } catch {}
        return next;
      },
      cycle(value, user) {
        if (!launcher.preview.enabled(value, user)) return "";
        const current = launcher.preview.role(value, user);
        const list = ["", "test", "author", "editor", "authors", "editors"];
        const index = Math.max(0, list.indexOf(current));
        return launcher.preview.set(
          value,
          user,
          list[(index + 1) % list.length],
        );
      },
    },
    marker: {
      meta(value) {
        const current = (() => {
          const currentScenario = value.activeScenario || {};
          if (currentScenario.id === "onliner") {
            return {
              emoji: "\u{1F9EF}",
              title:
                "\u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430",
              label:
                "\u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430",
              action: "scenario",
            };
          }
          if (currentScenario.id === "madtest") {
            return {
              emoji: "\u2697\uFE0F",
              title: "Madtest",
              label: "Madtest",
              action: "scenario",
            };
          }
          if (value.context.surface !== "post") return null;
          const action =
            value.realUser === "baranov" ? "preview-role" : "scenario";
          if (value.realUser === "baranov" && !value.previewRole) {
            return {
              emoji: "\uD83D\uDC7A",
              title:
                "\u0421\u0443\u043F\u0435\u0440\u0440\u0435\u0436\u0438\u043C",
              label:
                "\u0421\u0443\u043F\u0435\u0440\u0440\u0435\u0436\u0438\u043C",
              action,
            };
          }
          if (value.effectiveRole === "test") {
            return {
              favicon: "onliner.by",
              title: "Полигон",
              label: "Полигон",
              action,
            };
          }
          if (value.effectiveRole === "author") {
            return {
              emoji: "\uD83E\uDD88",
              title: "\u0416\u0443\u0440\u043D\u0430\u043B\u0438\u0441\u0442",
              label: "\u0416\u0443\u0440\u043D\u0430\u043B\u0438\u0441\u0442",
              action,
            };
          }
          if (value.effectiveRole === "editor") {
            return {
              emoji: "\uD83D\uDC1D",
              title: "\u041A\u043E\u0440\u0440\u0435\u043A\u0442\u043E\u0440",
              label: "\u041A\u043E\u0440\u0440\u0435\u043A\u0442\u043E\u0440",
              action,
            };
          }
          if (value.effectiveRole === "authors") {
            return {
              favicon: "onliner.by",
              title: "\u0416\u0443\u0440\u043D\u0430\u043B\u0438\u0441\u0442",
              label: "\u0416\u0443\u0440\u043D\u0430\u043B\u0438\u0441\u0442",
              action,
            };
          }
          if (value.effectiveRole === "editors") {
            return {
              favicon: "onliner.by",
              title: "\u041A\u043E\u0440\u0440\u0435\u043A\u0442\u043E\u0440",
              label: "\u041A\u043E\u0440\u0440\u0435\u043A\u0442\u043E\u0440",
              action,
            };
          }
          return null;
        })();
        if (current) {
          if (value.markerCommand && current.action !== "preview-role") {
            return {
              ...current,
              action: "marker-command",
              command: value.markerCommand,
            };
          }
          return current;
        }
        const currentScenario = value.activeScenario || {};
        return {
          emoji: currentScenario.emoji || "\uD83D\uDD16",
          image: currentScenario.image || "",
          logo: currentScenario.logo || "",
          favicon: currentScenario.favicon || "",
          title: currentScenario.title || currentScenario.id || "Launcher",
          action: "scenario",
        };
      },
      content(value) {
        if (launcher.command.separator(value)) return "";
        const current = value || {};
        const image = String(current.image || "");
        if (image) {
          return icon.logo.image(
            image,
            current.title || "",
            "launcher-scenario-icon",
          );
        }
        const logo = String(current.logo || "");
        if (logo)
          return icon.logo(
            logo,
            current.title || logo,
            "launcher-scenario-icon",
          );
        const favicon = String(current.favicon || "");
        const faviconFallback = String(current.faviconFallback || "");
        if (favicon) {
          return icon.logo.favicon(
            favicon,
            current.title || favicon,
            "launcher-scenario-icon",
            faviconFallback,
          );
        }
        return icon.emoji(String(current.emoji || "\uD83D\uDD16"), "launcher");
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
      separator(value) {
        return value?.type === "separator";
      },
      id(value) {
        if (launcher.command.separator(value)) return "";
        return String(value?.id || "");
      },
      toolId(value) {
        return String(value?.toolId || value?.id || "");
      },
      normalize(value) {
        return commands.normalize(value);
      },
      access(value) {
        return scenarios.access(value);
      },
      allowed(value, user, role, userId = "") {
        const { users, userIds, roles } = launcher.command.access(value);
        if (!users.length && !userIds.length && !roles.length) return true;
        if (users.includes(user)) return true;
        if (userIds.includes(String(userId || ""))) return true;
        if (roles.includes(role)) return true;
        return false;
      },
      reason(value, user, role, userId = "") {
        const { users, userIds, roles } = launcher.command.access(value);
        if (!users.length && !userIds.length && !roles.length) return "";
        if (users.includes(user)) return "";
        if (userIds.includes(String(userId || ""))) return "";
        if (roles.includes(role)) return "";
        return [
          users.length ? "users" : "",
          userIds.length ? "userIds" : "",
          roles.length ? "roles" : "",
        ]
          .filter(Boolean)
          .join("|");
      },
      parameter(value) {
        if (launcher.command.separator(value)) return false;
        return launcher.command.ids.params.has(launcher.command.id(value));
      },
      submit(value) {
        return launcher.command.id(value) === "params.submit";
      },
      loader(value) {
        if (launcher.command.separator(value)) return false;
        const id = launcher.command.id(value);
        if (launcher.command.parameter(value)) return false;
        if (actions.has(id)) return false;
        return true;
      },
      available(value) {
        if (launcher.command.separator(value)) return true;
        if (!launcher.command.parameter(value)) return true;
        return launcher.params.available(launcher.command.id(value));
      },
      state(value) {
        if (!launcher.command.parameter(value)) return "";
        return launcher.params.state(launcher.command.id(value));
      },
      variant(value) {
        const state = launcher.command.state(value);
        if (!state) return null;
        return value?.states?.[state] || null;
      },
      content(value) {
        if (launcher.command.separator(value)) return "";
        const current = value || {};
        const variant = launcher.command.variant(current);
        const image = String(variant?.image || current.image || "");
        if (image)
          return icon.logo.image(
            image,
            current.title || "",
            "launcher-command-icon",
          );
        const logo = String(variant?.logo || current.logo || "");
        if (logo)
          return icon.logo(
            logo,
            current.title || logo,
            "launcher-command-icon",
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
          return `<img class="toolbar-icon launcher-command-icon" src="${primary}" alt="" onerror="this.onerror=null;this.src='${fallback}'">`;
        }
        const emoji = String(variant?.emoji || current.emoji || "");
        if (emoji) return icon.emoji(emoji, "launcher");
        if (launcher.command.parameter(current)) {
          return launcher.params.content(launcher.command.id(current));
        }
        const tool = current.tool || {};
        return launcher.icon(tool.title || "\uD83D\uDD16");
      },
      active(value) {
        if (launcher.command.separator(value)) return false;
        return actions.active(launcher.command.id(value));
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
        return `${launcher.keyboard.apple() ? "⌃⌥" : "Alt+"}${current}`;
      },
      title(value) {
        if (launcher.command.separator(value)) return "";
        const current = value || {};
        const id = launcher.command.id(current);
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
      mode(value) {
        if (!value) return launcher.state.parameterMode || "publish";
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
          return launcher.state.timeMode || launcher.state.submitTimeMode || "";
        },
        clearCycleMode() {
          launcher.state.timeMode = "";
          return "";
        },
        submitMode(value) {
          if (value === undefined) return launcher.state.submitTimeMode || "";
          launcher.state.submitTimeMode = String(value || "");
          return launcher.state.submitTimeMode;
        },
        clearMode() {
          launcher.state.timeMode = "";
          launcher.state.submitTimeMode = "";
          return "";
        },
        currentMode() {
          return (
            launcher.params.timestamp.selectedMode() ||
            launcher.params.timestamp.state().mode
          );
        },
        derivedMode(current, hidden) {
          const now = launcher.params.fromDate(launcher.params.adminNow());
          if (hidden.hours === "07" && hidden.minutes === "00") return "seven";
          if (hidden.hours === "08" && hidden.minutes === "00") return "eight";
          if (launcher.params.same(hidden, now)) return "now";
          if (launcher.params.same(hidden, current)) return "keep";
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
          if (launcher.state.submitTimeMode)
            return launcher.state.submitTimeMode;
          return launcher.params.timestamp.derivedMode(current, hidden);
        },
        state() {
          const current = launcher.params.timestamp.current();
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
              launcher.params.timestamp.current(),
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
          if (mode === "keep") return launcher.params.timestamp.current();
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
        state() {
          return launcher.params.status.value() === "draft"
            ? "draft"
            : "published";
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
          return current === "publish" ? "published" : "draft";
        },
        state() {
          if (launcher.params.status.state() === "draft") return "draft";
          if (launcher.params.mode() === "save") return "save";
          const button = String(launcher.field.one("#publish")?.value || "")
            .trim()
            .toLowerCase();
          if (/заплан/u.test(button)) return "schedule";
          if (/обнов/u.test(button)) return "update";
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
              save: "\u{1F4BE}",
              update: "\u{1F504}",
              schedule: "\u{1F4C5}",
              publish: "\u{1F680}",
            }[launcher.params.submitAction.state()] || "\u{1F680}"
          );
        },
        ensureTime() {
          const submitState = launcher.params.submitAction.state();
          const mode = launcher.state.timeMode || "";
          const future = submitState === "schedule";
          if (!mode) return "";
          launcher.params.timestamp.ensure(mode, {
            future,
            passive: false,
          });
          return "";
        },
        run() {
          const action = launcher.params.mode();
          if (action === "save") {
            launcher.params.timestamp.clearMode();
          }
          const appliedMode =
            action === "save" ? "" : launcher.params.submitAction.ensureTime();
          if (action !== "save") {
            launcher.params.timestamp.clearCycleMode();
            launcher.params.timestamp.submitMode(appliedMode || "");
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
      state(id) {
        const visibility = launcher.params.visibility.state();
        if (id === launcher.params.ids.time) {
          return launcher.params.timestamp.state().mode;
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
          launcher.params.title(launcher.params.ids.mode),
          launcher.params.title(launcher.params.ids.time),
          launcher.params.title(launcher.params.ids.sticky),
          launcher.params.title(launcher.params.ids.updated),
          launcher.params.title(launcher.params.ids.visibility),
          launcher.params.title(launcher.params.ids.status),
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
        const time = launcher.params.timestamp.state();
        if (id === launcher.params.ids.time) {
          return launcher.params.capitalize(
            launcher.params.timestamp.title(time.mode),
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
        const time = launcher.params.timestamp.state();
        const visibility = launcher.params.visibility.state();
        if (id === launcher.params.ids.time) {
          return icon.emoji(
            {
              keep: "\u25B6\uFE0F",
              now: "\u{1F199}",
              eight: "\u0038\uFE0F\u20E3",
              seven: "\u0037\uFE0F\u20E3",
              custom: "#\uFE0F\u20E3",
            }[time.mode] || "\u25B6\uFE0F",
            "launcher",
          );
        }
        if (id === launcher.params.ids.sticky) {
          return icon.emoji(
            {
              none: "\u{1F516}",
              left: "\u25C0\uFE0F",
              right: "\u27A1\uFE0F",
            }[visibility.sticky] || "\u{1F516}",
            "launcher",
          );
        }
        if (id === launcher.params.ids.updated) {
          return icon.emoji(
            visibility.updated === "on" ? "\u{1F199}" : "\u2611\uFE0F",
            "launcher",
          );
        }
        if (id === launcher.params.ids.visibility) {
          return icon.emoji(
            visibility.access === "link" ? "\u{1F517}" : "\u{1F30D}",
            "launcher",
          );
        }
        if (id === launcher.params.ids.status) {
          return icon.emoji(
            launcher.params.status.state() === "draft"
              ? "\u{1F648}"
              : "\u{1F441}\uFE0F",
            "launcher",
          );
        }
        if (id === launcher.params.ids.mode) {
          if (launcher.params.submitAction.state() === "draft") {
            const primary = icon.fluent("Power", 20);
            const fallback = icon.fluent("Power", 24);
            return `<img class="toolbar-icon launcher-command-icon" src="${primary}" alt="" onerror="this.onerror=null;this.src='${fallback}'">`;
          }
          return icon.emoji(launcher.params.submitAction.icon(), "launcher");
        }
        return icon.emoji("\u2705", "launcher");
      },
      step(list, current, reverse = false) {
        const index = Math.max(0, list.indexOf(current));
        const delta = reverse ? -1 : 1;
        return list[(index + delta + list.length) % list.length];
      },
      run(id, { reverse = false } = {}) {
        if (id === launcher.params.ids.time) {
          launcher.params.timestamp.submitMode("");
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
    feed: {
      touch() {
        const agent = navigator.userAgent || "";
        if (/Windows NT/.test(agent)) return false;
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
      reader() {
        return launcher.state.context?.surface === "reader";
      },
      defaultId(groups = []) {
        if (launcher.feed.reader() && launcher.feed.touch()) return "";
        return groups.some((group) => group.id === "pinned") ? "pinned" : "";
      },
      currentId(groups = []) {
        if (launcher.state.feed.group !== null)
          return launcher.state.feed.group;
        return launcher.feed.defaultId(groups);
      },
      current(groups = []) {
        return launcher.feed.currentId(groups);
      },
      clear() {
        launcher.state.feed.group = null;
        launcher.state.feed.toolbox = false;
      },
      clearScenario(id = "") {
        if (launcher.state.feed.scenario === id) return;
        launcher.state.feed.scenario = id;
        launcher.feed.clear();
      },
      set(id = "", groups = []) {
        const current = launcher.feed.currentId(groups);
        launcher.state.feed.group = current === id ? "" : id;
        return launcher.state.feed.group;
      },
      active(id = "", groups = []) {
        return launcher.feed.currentId(groups) === id;
      },
      toolbox(value) {
        if (value === undefined) return launcher.state.feed.toolbox === true;
        launcher.state.feed.toolbox = value === true;
        return launcher.feed.toolbox();
      },
      meta(value) {
        const fallbackId = String(value?.id || "");
        const meta = groups.meta(fallbackId);
        const id = String(meta.id || fallbackId);
        const emojiMap = {
          toolbox: "\u{1F9F0}",
          pinned: "\u{1F4CC}",
          authors: "\u{1F988}",
          editors: "\u{1F41D}",
        };
        const emoji = emojiMap[id] || String(meta.emoji || "");
        const favicon =
          id === "pinned" ? "" : String(meta.favicon || value?.favicon || "");
        const iconValue = emoji || (favicon ? `favicon:${favicon}` : "");
        return {
          id,
          title: String(meta.title || value?.title || id),
          icon: iconValue,
        };
      },
      visible(value) {
        return Boolean(launcher.feed.meta(value).icon);
      },
      activeGroup(groups = []) {
        const id = launcher.feed.currentId(groups);
        if (!id) return null;
        return groups.find((group) => group.id === id) || null;
      },
      focusedGroup(groups = []) {
        const current = launcher.feed.activeGroup(groups);
        if (!current || !launcher.feed.visible(current)) return null;
        if (current.id === "pinned") return null;
        return current;
      },
      setToolbox(id = "", groups = []) {
        const current = launcher.feed.currentId(groups);
        if (id === "toolbox") {
          const next = !launcher.feed.toolbox();
          launcher.feed.toolbox(next);
          launcher.state.feed.group = next ? "" : null;
          return launcher.feed.toolbox();
        }
        if (!launcher.feed.toolbox()) return false;
        launcher.state.feed.group = current === id ? "" : id;
        return launcher.state.feed.group;
      },
      button(value, options = {}) {
        const meta = launcher.feed.meta(value);
        if (!meta.icon) return "";
        const classes = [
          launcher.feed.active(meta.id, [value]) ? "is-active" : "",
          options.classes || "",
        ]
          .filter(Boolean)
          .join(" ");
        return ui.controls.button({
          content: options.content || launcher.icon(meta.icon),
          action: "group",
          title: String(options.title || meta.title),
          classes,
          attrs: ` data-id="${meta.id}" type="button"${options.attrs || ""}`,
        });
      },
      back(value) {
        const meta = launcher.feed.meta(value);
        if (!meta.icon || meta.id === "pinned")
          return launcher.feed.button(value);
        return launcher.feed.button(value, {
          content: `<span class="launcher-back-icon"><span class="launcher-back-face launcher-back-face-default">${launcher.icon(meta.icon)}</span><span class="launcher-back-face launcher-back-face-hover">${ui.controls.glyph("Arrow Step Back", 20, "back-arrow")}</span></span>`,
          title: `${meta.title} · Взад`,
          classes: "is-focused-back",
          attrs: ' data-launcher-back="group"',
        });
      },
    },
    view: {
      superuser(snapshot) {
        return (
          snapshot.context.surface === "post" &&
          snapshot.realUser === "baranov" &&
          !snapshot.previewRole
        );
      },
      current(snapshot) {
        if (launcher.view.superuser(snapshot)) {
          if (!launcher.feed.toolbox()) return "superuser-top";
          const groups = snapshot.toolboxGroups || snapshot.groups;
          return launcher.feed.focusedGroup(groups)
            ? "superuser-toolbox-focused"
            : "superuser-toolbox";
        }
        return launcher.feed.focusedGroup(snapshot.groups)
          ? "normal-focused"
          : "normal";
      },
      html(snapshot) {
        const current = launcher.view.current(snapshot);
        if (current === "superuser-top") {
          return launcher.htmlSuperuser(snapshot.groups);
        }
        if (
          current === "superuser-toolbox" ||
          current === "superuser-toolbox-focused"
        ) {
          return launcher.htmlToolboxOpen(
            snapshot.toolboxGroups || snapshot.groups,
          );
        }
        if (current === "normal-focused") {
          return launcher.htmlFocused(snapshot.groups);
        }
        return launcher.htmlNormal(snapshot.groups);
      },
    },
    group: {
      normalizeCommands(list = []) {
        const value = Array.isArray(list) ? list.filter(Boolean) : [];
        const reduced = value.reduce((items, command) => {
          if (!launcher.command.separator(command)) return [...items, command];
          if (!items.length) return items;
          if (launcher.command.separator(items[items.length - 1])) return items;
          return [...items, command];
        }, []);
        if (!reduced.length) return reduced;
        if (launcher.command.separator(reduced[reduced.length - 1])) {
          return reduced.slice(0, -1);
        }
        return reduced;
      },
      meaningfulCommands(list = []) {
        return launcher.group
          .normalizeCommands(list)
          .filter((command) => !launcher.command.separator(command));
      },
      rank(id = "") {
        return (
          {
            pinned: 0,
            service: 1,
            fields: 90,
            params: 91,
            submit: 100,
          }[String(id || "")] ?? 50
        );
      },
      normalizeScenario(value) {
        const groups = Array.isArray(value?.groups) ? value.groups : [];
        if (groups.length) {
          return groups.map((item) => launcher.group.normalize(item));
        }
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
        const id = String(value?.id || "");
        const meta = groups.meta(id);
        return {
          id,
          title: String(value?.title || meta.title || ""),
          ...launcher.command.access(value),
          commands: Array.isArray(value?.commands)
            ? value.commands.map((item) => launcher.command.normalize(item))
            : [],
        };
      },
      allow(value, user, role, userId = "") {
        const id = String(value?.id || "");
        const meta = groups.meta(id);
        if (!launcher.command.allowed(value, user, role, userId)) {
          return {
            id,
            title: String(value?.title || meta.title || ""),
            commands: [],
          };
        }
        const commands = Array.isArray(value?.commands) ? value.commands : [];
        return {
          id,
          title: String(value?.title || meta.title || ""),
          commands: launcher.group.normalizeCommands(
            commands.filter((item) =>
              launcher.command.allowed(item, user, role, userId),
            ),
          ),
        };
      },
      merge(list = []) {
        return list.reduce((items, group) => {
          const id = String(group?.id || "");
          const commands = Array.isArray(group?.commands) ? group.commands : [];
          const current = items.find((item) => item.id === id);
          if (!current) {
            return [
              ...items,
              {
                ...group,
                commands: launcher.group.normalizeCommands(commands),
              },
            ];
          }
          const ids = new Set(
            current.commands
              .filter((item) => !launcher.command.separator(item))
              .map((item) => launcher.command.id(item)),
          );
          const next = commands.filter((item) => {
            if (launcher.command.separator(item)) return true;
            const commandId = launcher.command.id(item);
            if (ids.has(commandId)) return false;
            ids.add(commandId);
            return true;
          });
          return items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  commands: launcher.group.normalizeCommands([
                    ...item.commands,
                    ...next,
                  ]),
                }
              : item,
          );
        }, []);
      },
      attach(value, tools, { visible } = {}) {
        const id = String(value?.id || "");
        const meta = groups.meta(id);
        const map = new Map(tools.map((tool) => [tool.id, tool]));
        const commands = (Array.isArray(value?.commands) ? value.commands : [])
          .map((item) => {
            if (!launcher.command.available(item)) return null;
            if (launcher.command.loader(item)) {
              const id = launcher.command.toolId(item);
              if (typeof visible === "function" && !visible(id)) return null;
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
          commands: launcher.group.normalizeCommands(commands),
        };
      },
      empty(value) {
        return !launcher.group.meaningfulCommands(value?.commands).length;
      },
      order(list = []) {
        return (Array.isArray(list) ? list : [])
          .map((group, index) => ({ group, index }))
          .sort((left, right) => {
            const leftRank = launcher.group.rank(left.group?.id);
            const rightRank = launcher.group.rank(right.group?.id);
            if (leftRank !== rightRank) return leftRank - rightRank;
            return left.index - right.index;
          })
          .map((entry) => entry.group);
      },
      pinned(groups = []) {
        return groups.find((group) => group.id === "pinned") || null;
      },
      submit(groups = []) {
        const current = groups.find((group) => group.id === "submit") || null;
        if (!launcher.group.meaningfulCommands(current?.commands).length) {
          return null;
        }
        return current;
      },
      feedback(groups = []) {
        const current = groups.find((group) => group.id === "feedback") || null;
        if (!launcher.group.meaningfulCommands(current?.commands).length) {
          return null;
        }
        return current;
      },
      emojis(groups = []) {
        return groups.filter((group) => launcher.feed.visible(group));
      },
      without(groups = [], ids = []) {
        const hidden = new Set(Array.isArray(ids) ? ids : []);
        return groups.filter((group) => !hidden.has(group.id));
      },
      commands(groups = []) {
        return groups.flatMap((group) => group.commands || []);
      },
      commandIds(list = []) {
        return launcher.group
          .meaningfulCommands(list)
          .map((command) => launcher.command.id(command))
          .filter(Boolean);
      },
      sameCommands(left = [], right = []) {
        const leftIds = launcher.group.commandIds(left);
        const rightIds = launcher.group.commandIds(right);
        if (leftIds.length !== rightIds.length) return false;
        return leftIds.every((id, index) => id === rightIds[index]);
      },
      suppressRoleDuplicates(groups = [], role = "") {
        const duplicateId =
          role === "authors" ? "authors" : role === "editors" ? "editors" : "";
        if (!duplicateId) return groups;
        const pinned = launcher.group.pinned(groups);
        const duplicate =
          groups.find((group) => group.id === duplicateId) || null;
        if (!pinned || !duplicate) return groups;
        if (!launcher.group.sameCommands(pinned.commands, duplicate.commands)) {
          return groups;
        }
        return launcher.group.without(groups, [duplicateId]);
      },
      hasCommand(groups = [], id = "") {
        return launcher.group
          .commands(groups)
          .some((command) => launcher.command.id(command) === id);
      },
      hasUsefulCommand(groups = []) {
        return launcher.group.commands(groups).some((command) => {
          const id = launcher.command.id(command);
          return Boolean(id && id !== "whoami");
        });
      },
      omitCommand(groups = [], id = "") {
        return groups
          .map((group) => ({
            ...group,
            commands: launcher.group.normalizeCommands(
              (group.commands || []).filter(
                (command) => launcher.command.id(command) !== id,
              ),
            ),
          }))
          .filter((group) => !launcher.group.empty(group));
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
      if (!match) return icon.emoji(source || "\uD83D\uDD16", "launcher");
      const domain = match[1].trim();
      if (!domain) return icon.emoji("\uD83D\uDD16", "launcher");
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
          realUserId: value.realUserId,
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
          group: launcher.feed.current(value.groups),
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
      launcher.state.context = contextValue;
      const identity = launcher.scenarios.identity(contextValue);
      const scenarios = scenario.visible(
        contextValue,
        launcher.scenarios.list(),
        identity.effectiveRole,
      );
      const activeScenario = scenario.resolve(
        launcher.state.scenario,
        scenarios,
      );
      launcher.feed.clearScenario(activeScenario?.id || "");
      const availableToolIds = launcher.catalog.map((tool) => tool.id);
      const normalizedGroups = launcher.group.normalizeScenario(activeScenario);
      const commands = normalizedGroups.flatMap((group) => group.commands);
      const deniedCommands = commands
        .filter(
          (command) =>
            !launcher.command.allowed(
              command,
              identity.effectiveUser,
              identity.effectiveRole,
              identity.effectiveUserId,
            ),
        )
        .map((command) => ({
          id: launcher.command.id(command),
          reason: launcher.command.reason(
            command,
            identity.effectiveUser,
            identity.effectiveRole,
            identity.effectiveUserId,
          ),
        }))
        .filter((item) => item.id);
      const allowedCommands = commands.filter((command) =>
        launcher.command.allowed(
          command,
          identity.effectiveUser,
          identity.effectiveRole,
          identity.effectiveUserId,
        ),
      );
      const deniedToolIds = deniedCommands.map((item) => item.id);
      const visible = (id) => {
        if (
          activeScenario?.id === "madtest" &&
          (contextValue.path === "/app" || contextValue.path === "/app/")
        ) {
          return id === "madtest-find";
        }
        if (id === "madtest.find") return Boolean(contextValue.madtestImport);
        return true;
      };
      const allowedGroups = normalizedGroups
        .map((group) =>
          launcher.group.allow(
            group,
            identity.effectiveUser,
            identity.effectiveRole,
            identity.effectiveUserId,
          ),
        )
        .filter((group) => !launcher.group.empty(group));
      const attachedGroups = launcher.group
        .merge(allowedGroups)
        .map((group) =>
          launcher.group.attach(group, launcher.catalog, { visible }),
        )
        .filter((group) => !launcher.group.empty(group));
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
      const roleGroups = launcher.group.suppressRoleDuplicates(
        groups,
        identity.effectiveRole,
      );
      const toolboxGroups = launcher.group.order(
        launcher.group.toolbox(normalizedGroups, identity, launcher.catalog, {
          visible,
        }),
      );
      const tools = roleGroups
        .flatMap((group) => group.commands)
        .map((item) => item.tool)
        .filter(Boolean);
      const allowedToolIds = tools.map((tool) => tool.id);
      const missingToolIds = allowedCommands
        .filter((command) => launcher.command.loader(command))
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
        previewRole: identity.previewRole,
        previewMode: identity.previewMode,
        impersonation: identity.impersonation,
        marker,
        markerCommand,
        usage: launcher.preview.usage(),
        scenarios,
        activeScenario,
        rawGroups: normalizedGroups,
        commands,
        allowedCommands,
        groups: roleGroups,
        toolboxGroups,
        toolIds: allowedToolIds,
        allowedToolIds,
        availableToolIds,
        deniedToolIds,
        deniedToolReasons: deniedCommands,
        missingToolIds,
        tools,
      });
    },
    htmlCommand(value) {
      if (launcher.command.separator(value)) return ui.controls.separator();
      const active = launcher.command.active(value)
        ? ' data-active="true"'
        : "";
      return ui.controls.button({
        content: launcher.command.content(value),
        action: "tool",
        title: launcher.command.title(value),
        attrs: ` data-id="${launcher.command.id(value)}" data-close="${value.close || ""}"${active} type="button"`,
      });
    },
    htmlCommands(list = []) {
      return list.map((item) => launcher.htmlCommand(item)).join("");
    },
    htmlGroup(value, groups = []) {
      const meta = launcher.feed.meta(value);
      if (!meta.icon) return launcher.htmlCommands(value?.commands || []);
      const expanded = launcher.feed.active(meta.id, groups);
      const head = `<span class="launcher-tool-group-head" data-launcher-group-head="true">${expanded && meta.id !== "pinned" ? launcher.feed.back(value) : launcher.feed.button(value)}</span>`;
      if (!expanded) return head;
      const commands = launcher.htmlCommands(value?.commands || []);
      return ui.shell.strip(`${head}${commands}`, {
        classes: "launcher-tool-group",
        attrs: ' data-launcher-group="true" data-expanded="true"',
      });
    },
    htmlBlocks(list = []) {
      const blocks = list.filter(Boolean);
      return blocks.reduce((html, block, index) => {
        if (!index) return block;
        return `${html}${ui.controls.separator()}${block}`;
      }, "");
    },
    htmlFocused(groups = []) {
      const current = launcher.feed.focusedGroup(groups);
      if (!current) return "";
      return launcher.htmlGroup(current, groups);
    },
    htmlPinned(groups = []) {
      const current = launcher.group.pinned(groups);
      if (!current) return "";
      return launcher.htmlGroup(current, groups);
    },
    htmlGroupButtons(groups = []) {
      return launcher.group
        .emojis(groups)
        .filter(
          (group) =>
            group.id !== "pinned" &&
            group.id !== "feedback" &&
            group.id !== "submit",
        )
        .map((group) => launcher.feed.button(group))
        .join("");
    },
    htmlFeedback(groups = []) {
      const feedback = launcher.group.feedback(groups);
      return launcher.htmlCommands(feedback?.commands || []);
    },
    htmlSubmit(groups = []) {
      const submit = launcher.group.submit(groups);
      return launcher.htmlCommands(submit?.commands || []);
    },
    htmlNormal(groups = []) {
      return launcher.htmlBlocks([
        launcher.htmlPinned(groups),
        launcher.htmlFeedback(groups),
        launcher.htmlGroupButtons(groups),
        launcher.htmlSubmit(groups),
      ]);
    },
    htmlToolboxGroups(groups = []) {
      const availableGroups = launcher.group
        .emojis(groups)
        .filter(
          (group) =>
            group.id !== "submit" &&
            group.id !== "pinned" &&
            group.id !== "toolbox",
        );
      const service =
        availableGroups.find((group) => group.id === "service") || null;
      const others = availableGroups.filter((group) => group.id !== "service");
      return [service, ...others]
        .filter(Boolean)
        .map(launcher.feed.button)
        .join("");
    },
    htmlRoleChoice() {
      return [
        { id: "author", title: "Журналист", emoji: "🦈" },
        { id: "editor", title: "Корректор", emoji: "🐝" },
      ]
        .sort(
          (left, right) =>
            Number(right.id === "editor") - Number(left.id === "editor"),
        )
        .map((item) =>
          ui.controls.button({
            content: icon.emoji(item.emoji, "launcher"),
            action: "preview-role",
            title: item.title,
            attrs: ` data-role="${item.id}" type="button"`,
          }),
        )
        .join("");
    },
    htmlToolboxControl() {
      return ui.controls.button({
        content: launcher.icon(launcher.feed.meta({ id: "toolbox" }).icon),
        action: "group",
        title: "Тулбокс",
        classes: launcher.feed.toolbox() ? "is-active" : "",
        attrs: ' data-id="toolbox" type="button"',
      });
    },
    htmlToolboxOpen(groups = []) {
      const focused = launcher.htmlFocused(groups);
      if (focused) return focused;
      return `${launcher.htmlToolboxControl()}${launcher.htmlToolboxGroups(groups)}`;
    },
    htmlSuperuser(groups = []) {
      return `${launcher.htmlToolboxControl()}${launcher.htmlRoleChoice()}`;
    },
    htmlTools(groups = [], role = "") {
      const focused = launcher.htmlFocused(groups);
      if (focused) return focused;
      return launcher.htmlNormal(groups);
    },
    html() {
      const snapshot = launcher.snapshot();
      const current = snapshot.activeScenario;
      const marker = snapshot.marker;
      const theme = launcher.theme();
      const lineButtons = launcher.view.html(snapshot);
      const scenarioButtons = snapshot.scenarios
        .map((item) => {
          const active = current?.id === item.id;
          const source = active ? marker : item;
          return ui.controls.button({
            content: launcher.marker.content(source),
            action: active ? marker.action : "scenario",
            title: active ? marker.label || marker.title : item.title,
            classes: active ? "is-active" : "",
            attrs: active
              ? ` data-id="${item.id}" data-command="${marker.command || ""}" type="button" aria-label="${marker.label || marker.title}"`
              : ` data-id="${item.id}" type="button"`,
          });
        })
        .join("");
      const left = ui.shell.group(scenarioButtons, {
        stick: "left",
        rail: true,
      });
      const main = ui.shell.strip(lineButtons);
      const right = ui.shell.group(
        `${ui.controls.button({ content: icon.emoji(toolbar.appearance.themeToggleIcon(theme), "launcher"), action: "theme", title: "\u0422\u0435\u043C\u0430", attrs: ' type="button" aria-label="\u0422\u0435\u043C\u0430" data-theme-icon="auto" data-theme-scope="launcher"' })}${ui.controls.button({ content: icon.emoji("\u274C", "launcher"), action: "close", title: "\u0412\u044B\u0445\u043E\u0434", attrs: ' type="button" aria-label="\u0412\u044B\u0445\u043E\u0434"' })}`,
        {
          stick: "right",
          rail: true,
        },
      );
      return ui.shell.shell({ left, main, right });
    },
    position(value) {
      return toolbar.state(launcher.state.position, value);
    },
    positionClear() {
      return launcher.position(null);
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
      workspaceNode() {
        return (
          document.getElementById("post-body-content") ||
          document.getElementById("content") ||
          null
        );
      },
      bounds() {
        const screen = launcher.home.screen();
        const node = launcher.home.workspaceNode();
        const rect = node?.getBoundingClientRect?.() || null;
        if (!rect || rect.width <= 0 || rect.height <= 0) return screen;
        return {
          left: Math.max(screen.left, rect.left),
          top: Math.max(screen.top, rect.top),
          right: Math.min(screen.right, rect.right),
          bottom: Math.min(screen.bottom, rect.bottom),
        };
      },
      edge() {
        return toolbar.rail.dock.edge;
      },
      inset(bounds) {
        const edge = launcher.home.edge();
        return {
          left: bounds.left + edge,
          top: bounds.top + edge,
          right: bounds.right - edge,
          bottom: bounds.bottom - edge,
        };
      },
      point() {
        const bounds = launcher.home.inset(launcher.home.bounds());
        return {
          left: bounds.left,
          top: bounds.top,
        };
      },
      origin(panelNode) {
        const value = launcher.home.point(panelNode);
        if (!panelNode) return value;
        return launcher.home.clamp(panelNode, value);
      },
      current(panelNode) {
        if (!panelNode) return null;
        const rect = panelNode.getBoundingClientRect();
        return {
          left: rect.left,
          top: rect.top,
        };
      },
      valid(value) {
        return Number.isFinite(value?.left) && Number.isFinite(value?.top);
      },
      clamp(panelNode, value) {
        const bounds = launcher.home.inset(launcher.home.bounds());
        const rect = panelNode.getBoundingClientRect();
        const width = rect.width || panelNode.offsetWidth || 0;
        const height = rect.height || panelNode.offsetHeight || 0;
        const minLeft = bounds.left;
        const minTop = bounds.top;
        const maxLeft = bounds.right - width;
        const maxTop = bounds.bottom - height;
        return {
          left:
            minLeft > maxLeft
              ? minLeft
              : Math.min(maxLeft, Math.max(minLeft, value.left)),
          top:
            minTop > maxTop
              ? minTop
              : Math.min(maxTop, Math.max(minTop, value.top)),
        };
      },
      apply(panelNode) {
        if (!panelNode) return false;
        const dock = { target: "floating", side: "floating" };
        const current = launcher.home.origin(panelNode);
        launcher.state.dock = dock;
        launcher.dockApply(panelNode, dock, current);
        launcher.positionClear();
        return true;
      },
      safe(panelNode) {
        const current = launcher.home.current(panelNode);
        const origin = launcher.home.origin(panelNode);
        const same =
          launcher.home.valid(current) &&
          Math.abs(current.left - origin.left) < 1 &&
          Math.abs(current.top - origin.top) < 1;
        if (same) {
          return false;
        }
        return launcher.home.apply(panelNode);
      },
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
    place() {
      const panelNode = launcher.node.panel();
      if (!panelNode) return;
      const dock = { target: "floating", side: "floating" };
      const value = launcher.home.origin(panelNode);
      launcher.state.dock = dock;
      launcher.dockApply(panelNode, dock, value);
      launcher.positionClear();
    },
    render({ safe = false } = {}) {
      const panelNode = launcher.node.panel();
      if (!panelNode) return;
      toolbar.appearance.rerender(
        panelNode,
        () => {
          panelNode.innerHTML = launcher.html();
        },
        {
          sync: () => launcher.state.controller?.appearance.sync(),
        },
      );
      if (safe) {
        requestAnimationFrame(() => {
          launcher.home.safe(panelNode);
          requestAnimationFrame(() => launcher.home.safe(panelNode));
        });
      }
      launcher.activeSync();
    },
    mount() {
      launcher.zoom.enable();
      const node = panel.create({
        id: launcher.id,
        className: "panel launcher-panel",
        place: "right",
        html: launcher.html(),
      });
      launcher.syncTheme(node.dataset.theme);
      node.dataset.toolbarFlow = "rail";
      const preset = toolbar.presets.railDocked("content");
      launcher.state.controller = toolbar.creature({
        panel: node,
        ...preset,
        theme: () => launcher.theme(),
        actions: {
          keepFocus: true,
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
            launcher.positionClear();
            node.dataset.moved = "false";
          },
        },
      });
      launcher.state.controller.appearance.sync();
      launcher.place();
      requestAnimationFrame(() => launcher.home.safe(node));
      launcher.bind();
      launcher.bindActive();
      launcher.bindContext();
      launcher.keyboard.bind();
      launcher.activeSync();
      launcher.state.context = launcher.scenarios.context();
      launcher.observeLayout();
      window.addEventListener("resize", launcher.place);
    },
    unmount() {
      const panelNode = launcher.node.panel();
      if (panelNode) {
        launcher.state.controller?.behavior.destroy();
        launcher.state.controller = null;
        panelNode.remove();
      }
      window.removeEventListener("resize", launcher.place);
      if (launcher.state.activeSync) {
        document.removeEventListener(
          "selectionchange",
          launcher.state.activeSync,
        );
        document.removeEventListener("input", launcher.state.activeSync, true);
        document.removeEventListener("keyup", launcher.state.activeSync, true);
      }
      launcher.state.activeSync = null;
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
    },
    manifest() {
      if (launcher.state.manifest) {
        return Promise.resolve(launcher.state.manifest);
      }
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
      return fetch(target.href, { cache: "no-store" })
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
    runner: {
      files({ files, manifest, load, toolUrl }) {
        return manifest()
          .then((value) =>
            files.reduce(
              (chain, file) => chain.then(() => load(toolUrl(file, value))),
              Promise.resolve(),
            ),
          )
          .catch(() => {});
      },
      run({ id, tools, manifest, load, toolUrl }) {
        const tool = tools.find((item) => item.id === id);
        if (!tool) return;
        return launcher.runner.files({
          files: [tool.file],
          manifest,
          load,
          toolUrl,
        });
      },
    },
    runTool(id) {
      return launcher.runner.run({
        id,
        tools: launcher.catalog,
        manifest: launcher.manifest,
        load: launcher.load,
        toolUrl: launcher.toolUrl,
      });
    },
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
      if (
        id !== launcher.params.ids.time &&
        id !== launcher.params.ids.submit
      ) {
        launcher.params.timestamp.clearMode();
      }
      if (launcher.command.parameter({ id })) {
        return launcher.params.run(id, options);
      }
      if (actions.run(id, options)) {
        return true;
      }
      if (launcher.runPopup(id)) {
        return true;
      }
      launcher.runTool(id);
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
        return;
      }
      if (action === "scenario") {
        launcher.state.scenario = id;
        launcher.feed.clear();
        launcher.render({ safe: true });
        return;
      }
      if (action === "preview-role") {
        const role = button.dataset.role || "";
        const contextValue = launcher.scenarios.context();
        const user = context.account();
        const snapshot = launcher.snapshot();
        if (role) {
          launcher.preview.set(contextValue, user, role);
        } else if (snapshot.previewRole === "test" && snapshot.markerCommand) {
          launcher.runCommand(snapshot.markerCommand, { silent: true });
          launcher.preview.set(contextValue, user, "author");
        } else {
          launcher.preview.cycle(contextValue, user);
        }
        launcher.feed.clear();
        launcher.render({ safe: true });
        return;
      }
      if (action === "group") {
        const snapshot = launcher.snapshot();
        if (launcher.view.superuser(snapshot) && id === "toolbox") {
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
        launcher.render({ safe: true });
        return;
      }
      if (action === "tool") {
        const parameter = launcher.command.parameter({ id });
        const close = button.dataset.close || "";
        launcher.runCommand(id, { reverse: Boolean(event?.altKey) });
        if (close === "group") launcher.feed.clear();
        launcher.render({ safe: close === "group" });
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
    keyboard: {
      apple() {
        return (
          /Mac|iPhone|iPad|iPod/.test(navigator.platform) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
        );
      },
      mod(event) {
        if (launcher.keyboard.apple()) {
          return event.altKey && event.ctrlKey && !event.metaKey;
        }
        return event.altKey && !event.ctrlKey && !event.metaKey;
      },
      commands() {
        const snapshot = launcher.snapshot();
        return snapshot.groups.flatMap((group) => group.commands || []);
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
      run(event) {
        if (event.defaultPrevented) return false;
        if (!launcher.node.panel()) return false;
        if (!launcher.keyboard.mod(event)) return false;
        const command = launcher.keyboard.match(event);
        if (!command) return false;
        launcher.runCommand(launcher.command.id(command), {
          reverse: Boolean(event.shiftKey),
        });
        if (command.close === "group") {
          launcher.feed.clear();
          launcher.render();
        } else {
          launcher.render();
        }
        event.preventDefault();
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
    contextKey(value) {
      return [
        value.surface,
        value.path,
        value.type.join("|"),
        value.status.join("|"),
        value.role.join("|"),
        value.userId || "",
        value.classList,
        value.madtestImport ? "madtest" : "",
      ].join("::");
    },
    syncContext() {
      const next = launcher.scenarios.context();
      const current = launcher.state.context || {};
      if (launcher.contextKey(next) === launcher.contextKey(current)) return;
      launcher.state.context = next;
      launcher.state.scenario = "";
      launcher.feed.clear();
      launcher.render({ safe: true });
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
