import { panel } from "./core/panel.js";
import { toolbar } from "./core/toolbar.js";
import { icon } from "./core/icon.js";
import { ui } from "./core/ui.js";
import { cms } from "./core/cms.js";
import { submit } from "./core/submit.js";
import { context } from "./runtime/context.js";
import { scenario } from "./runtime/scenario.js";
import { runner } from "./runtime/runner.js";
import { runtimeScenarios } from "./runtime/scenarios.js";
import { runtimeGroups } from "./runtime/groups.js";
import { runtimeCommands } from "./runtime/commands.js";
import { actions } from "./core/actions.js";
import { popup } from "./core/popup.js";

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
      contextSync: null,
      feed: {
        group: "",
        scenario: "",
      },
      parameterMode: "publish",
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
      set(value, user, role = "") {
        if (!launcher.preview.enabled(value, user)) return "";
        const next = role === "author" || role === "editor" ? role : "";
        try {
          if (next) localStorage.setItem(launcher.preview.key, next);
          else localStorage.removeItem(launcher.preview.key);
        } catch {}
        return next;
      },
      cycle(value, user) {
        if (!launcher.preview.enabled(value, user)) return "";
        const current = launcher.preview.role(value, user);
        const next =
          current === "" ? "author" : current === "author" ? "editor" : "";
        return launcher.preview.set(value, user, next);
      },
    },
    marker: {
      meta(value) {
        const current = (() => {
          const currentScenario = value.activeScenario || {};
          if (currentScenario.id === "published") {
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
          if (value.context.surface !== "adminPost") return null;
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
          return null;
        })();
        if (current) return current;
        const currentScenario = value.activeScenario || {};
        return {
          emoji: currentScenario.emoji || "\uD83D\uDD16",
          title: currentScenario.title || currentScenario.id || "Launcher",
          action: "scenario",
        };
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
        parameters: new Set([
          "parameters.time",
          "parameters.sticky",
          "parameters.updated",
          "parameters.access",
          "parameters.mode",
          "parameters.submit",
        ]),
      },
      id(value) {
        return String(value?.id || "");
      },
      toolId(value) {
        return String(value?.toolId || value?.id || "");
      },
      normalize(value) {
        if (typeof value === "string") {
          const meta = runtimeCommands[value] || {};
          return {
            id: value,
            toolId: value,
            title: String(meta.title || ""),
            glyph: String(meta.glyph || ""),
            emoji: String(meta.emoji || ""),
            image: String(meta.image || ""),
            logo: String(meta.logo || ""),
            favicon: String(meta.favicon || ""),
            close: String(meta.close || ""),
            hotkeys: Array.isArray(meta.hotkeys)
              ? meta.hotkeys
              : meta.hotkey
                ? [meta.hotkey]
                : [],
            states: meta.states || {},
            section: "",
            users: [],
            roles: [],
          };
        }
        const id = String(value?.id || "");
        const meta = runtimeCommands[id] || {};
        return {
          id,
          toolId: String(value?.toolId || id),
          title: String(value?.title || meta.title || ""),
          glyph: String(value?.glyph || meta.glyph || ""),
          emoji: String(value?.emoji || meta.emoji || ""),
          image: String(value?.image || meta.image || ""),
          logo: String(value?.logo || meta.logo || ""),
          favicon: String(value?.favicon || meta.favicon || ""),
          close: String(value?.close || meta.close || ""),
          hotkeys: Array.isArray(value?.hotkeys)
            ? value.hotkeys
            : value?.hotkey
              ? [value.hotkey]
              : Array.isArray(meta.hotkeys)
                ? meta.hotkeys
                : meta.hotkey
                  ? [meta.hotkey]
                  : [],
          states: value?.states || meta.states || {},
          section: String(value?.section || ""),
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
      parameter(value) {
        return launcher.command.ids.parameters.has(launcher.command.id(value));
      },
      submit(value) {
        return launcher.command.id(value) === "parameters.submit";
      },
      loader(value) {
        const id = launcher.command.id(value);
        if (launcher.command.parameter(value)) return false;
        if (actions.has(id)) return false;
        return true;
      },
      available(value) {
        if (!launcher.command.parameter(value)) return true;
        return launcher.parameters.available(launcher.command.id(value));
      },
      state(value) {
        if (!launcher.command.parameter(value)) return "";
        return launcher.parameters.state(launcher.command.id(value));
      },
      variant(value) {
        const state = launcher.command.state(value);
        if (!state) return null;
        return value?.states?.[state] || null;
      },
      content(value) {
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
        if (logo) return icon.logo.editorSource(logo);
        const favicon = String(variant?.favicon || current.favicon || "");
        if (favicon)
          return icon.logo.favicon(favicon, current.title || favicon);
        const glyph = String(variant?.glyph || current.glyph || "");
        if (glyph) {
          const primary = icon.fluent(glyph, 20);
          const fallback = icon.fluent(glyph, 24);
          return `<img class="toolbar-icon launcher-command-icon" src="${primary}" alt="" onerror="this.onerror=null;this.src='${fallback}'">`;
        }
        const emoji = String(variant?.emoji || current.emoji || "");
        if (emoji) return icon.emoji(emoji, "launcher");
        if (launcher.command.parameter(current)) {
          return launcher.parameters.content(launcher.command.id(current));
        }
        const tool = current.tool || {};
        return launcher.icon(tool.title || "\uD83D\uDD16");
      },
      active(value) {
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
        const current = value || {};
        const variant = launcher.command.variant(current);
        const title =
          variant?.title ||
          current.title ||
          (launcher.command.parameter(current)
            ? launcher.parameters.title(launcher.command.id(current))
            : current.toolId || current.id || "");
        const hotkey = launcher.command.hotkeyLabel(current);
        return hotkey ? `${title} · ${hotkey}` : title;
      },
    },
    parameters: {
      ids: {
        time: "parameters.time",
        sticky: "parameters.sticky",
        updated: "parameters.updated",
        access: "parameters.access",
        mode: "parameters.mode",
        submit: "parameters.submit",
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
        return launcher.parameters.stamp({
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
        return time > launcher.parameters.adminNow().getTime();
      },
      timestamp: {
        current() {
          return launcher.parameters.stamp({
            year: launcher.parameters.part("#cur_aa"),
            month: launcher.parameters.part("#cur_mm"),
            day: launcher.parameters.part("#cur_jj"),
            hours: launcher.parameters.part("#cur_hh"),
            minutes: launcher.parameters.part("#cur_mn"),
          });
        },
        hidden() {
          return launcher.parameters.stamp({
            year: launcher.parameters.part(
              "#hidden_aa",
              launcher.parameters.part("#aa"),
            ),
            month: launcher.parameters.part(
              "#hidden_mm",
              launcher.parameters.part("#mm"),
            ),
            day: launcher.parameters.part(
              "#hidden_jj",
              launcher.parameters.part("#jj"),
            ),
            hours: launcher.parameters.part(
              "#hidden_hh",
              launcher.parameters.part("#hh"),
            ),
            minutes: launcher.parameters.part(
              "#hidden_mn",
              launcher.parameters.part("#mn"),
            ),
          });
        },
        visible() {
          return launcher.parameters.stamp({
            year: launcher.parameters.part("#aa"),
            month: launcher.parameters.part("#mm"),
            day: launcher.parameters.part("#jj"),
            hours: launcher.parameters.part("#hh"),
            minutes: launcher.parameters.part("#mn"),
          });
        },
        state() {
          const current = launcher.parameters.timestamp.current();
          const hidden = launcher.parameters.timestamp.hidden();
          const mode = launcher.parameters.same(hidden, current)
            ? "keep"
            : hidden.hours === "07" && hidden.minutes === "00"
              ? "seven"
              : hidden.hours === "08" && hidden.minutes === "00"
                ? "eight"
                : "custom";
          return { current, hidden, mode };
        },
        target(mode) {
          const now = launcher.parameters.adminNow();
          if (mode === "keep") return launcher.parameters.timestamp.current();
          if (mode === "seven" || mode === "eight") {
            const hour = mode === "seven" ? 7 : 8;
            const date = new Date(now);
            if (date.getHours() >= hour) date.setDate(date.getDate() + 1);
            date.setHours(hour, 0, 0, 0);
            return launcher.parameters.fromDate(date);
          }
          if (mode === "custom") {
            const date = new Date(now);
            date.setMinutes(date.getMinutes() + 15);
            return launcher.parameters.fromDate(date);
          }
          const date = new Date(now);
          if (date.getHours() >= 9) date.setDate(date.getDate() + 1);
          date.setHours(9, 0, 0, 0);
          return launcher.parameters.fromDate(date);
        },
        apply(mode) {
          const value = launcher.parameters.timestamp.target(mode);
          launcher.field.click(launcher.field.one(".edit-timestamp"));
          [
            ["#mm", value.month],
            ["#jj", value.day],
            ["#aa", value.year],
            ["#hh", value.hours],
            ["#mn", value.minutes],
            ["#hidden_mm", value.month],
            ["#hidden_jj", value.day],
            ["#hidden_aa", value.year],
            ["#hidden_hh", value.hours],
            ["#hidden_mn", value.minutes],
          ].forEach(([selector, current]) => {
            launcher.field.set(launcher.field.one(selector), current);
          });
          if (mode === "custom") {
            const minutes = launcher.field.one("#mn");
            minutes?.focus?.();
            minutes?.select?.();
            return value;
          }
          launcher.field.click(launcher.field.one(".save-timestamp"));
          return value;
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
          const link = launcher.parameters.visibility.linkNode();
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
          const link = launcher.parameters.visibility.linkNode();
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
              launcher.parameters.visibility.stickyReset(),
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
      submitAction: {
        status() {
          const current =
            launcher.field.one("#post_status")?.value ||
            launcher.field.one("#original_post_status")?.value ||
            "";
          return current === "publish" ? "published" : "draft";
        },
        state() {
          if (launcher.parameters.mode() === "save") return "save";
          const button = String(launcher.field.one("#publish")?.value || "")
            .trim()
            .toLowerCase();
          if (/заплан/u.test(button)) return "schedule";
          if (/обнов/u.test(button)) return "update";
          if (launcher.parameters.submitAction.status() === "published") {
            return "update";
          }
          return launcher.parameters.future(
            launcher.parameters.timestamp.state().hidden,
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
            }[launcher.parameters.submitAction.state()] || "\u{1F680}"
          );
        },
        run() {
          return submit.run(launcher.parameters.mode());
        },
      },
      available(id) {
        if (
          !launcher.state.context ||
          launcher.state.context.surface !== "adminPost"
        ) {
          return false;
        }
        if (id === launcher.parameters.ids.submit) {
          return Boolean(
            launcher.field.one("#save-post") || launcher.field.one("#publish"),
          );
        }
        if (id === launcher.parameters.ids.time) {
          return Boolean(
            launcher.field.one(".edit-timestamp") &&
            launcher.field.one(".save-timestamp") &&
            launcher.field.one("#aa") &&
            launcher.field.one("#hh"),
          );
        }
        return Boolean(
          launcher.field.one(".edit-visibility") &&
          launcher.field.one(".save-post-visibility"),
        );
      },
      state(id) {
        const visibility = launcher.parameters.visibility.state();
        if (id === launcher.parameters.ids.time) {
          return launcher.parameters.timestamp.state().mode;
        }
        if (id === launcher.parameters.ids.sticky) {
          return visibility.sticky;
        }
        if (id === launcher.parameters.ids.updated) {
          return visibility.updated;
        }
        if (id === launcher.parameters.ids.access) {
          return visibility.access;
        }
        if (id === launcher.parameters.ids.mode) {
          return launcher.parameters.submitAction.state();
        }
        return "";
      },
      title(id) {
        const state = launcher.parameters.visibility.state();
        const time = launcher.parameters.timestamp.state();
        if (id === launcher.parameters.ids.time) {
          return `Time: ${time.mode}`;
        }
        if (id === launcher.parameters.ids.sticky) {
          return `Sticky: ${state.sticky}`;
        }
        if (id === launcher.parameters.ids.updated) {
          return `Upd: ${state.updated}`;
        }
        if (id === launcher.parameters.ids.access) {
          return `Access: ${state.access}`;
        }
        if (id === launcher.parameters.ids.mode) {
          return `Mode: ${launcher.parameters.submitAction.state()}`;
        }
        return `Submit: ${launcher.parameters.mode()}`;
      },
      content(id) {
        const time = launcher.parameters.timestamp.state();
        const visibility = launcher.parameters.visibility.state();
        if (id === launcher.parameters.ids.time) {
          return icon.emoji(
            {
              keep: "\u25B6\uFE0F",
              eight: "\u0038\uFE0F\u20E3",
              seven: "\u0037\uFE0F\u20E3",
              custom: "#\uFE0F\u20E3",
            }[time.mode] || "\u25B6\uFE0F",
            "launcher",
          );
        }
        if (id === launcher.parameters.ids.sticky) {
          return icon.emoji(
            {
              none: "\u{1F516}",
              left: "\u25C0\uFE0F",
              right: "\u27A1\uFE0F",
            }[visibility.sticky] || "\u{1F516}",
            "launcher",
          );
        }
        if (id === launcher.parameters.ids.updated) {
          return icon.emoji(
            visibility.updated === "on" ? "\u{1F199}" : "\u2611\uFE0F",
            "launcher",
          );
        }
        if (id === launcher.parameters.ids.access) {
          return icon.emoji(
            visibility.access === "link" ? "\u{1F517}" : "\u{1F30D}",
            "launcher",
          );
        }
        if (id === launcher.parameters.ids.mode) {
          return icon.emoji(
            launcher.parameters.submitAction.icon(),
            "launcher",
          );
        }
        return icon.emoji("\u2705", "launcher");
      },
      step(list, current, reverse = false) {
        const index = Math.max(0, list.indexOf(current));
        const delta = reverse ? -1 : 1;
        return list[(index + delta + list.length) % list.length];
      },
      run(id, { reverse = false } = {}) {
        if (id === launcher.parameters.ids.time) {
          const current = launcher.parameters.timestamp.state().mode;
          const next = launcher.parameters.step(
            ["keep", "eight", "seven", "custom"],
            current,
            reverse,
          );
          launcher.parameters.timestamp.apply(next);
          return true;
        }
        if (id === launcher.parameters.ids.sticky) {
          const current = launcher.parameters.visibility.state().sticky;
          const next = launcher.parameters.step(
            ["none", "left", "right"],
            current,
            reverse,
          );
          const state = launcher.parameters.visibility.state();
          launcher.parameters.visibility.apply({ ...state, sticky: next });
          return true;
        }
        if (id === launcher.parameters.ids.updated) {
          const state = launcher.parameters.visibility.state();
          launcher.parameters.visibility.apply({
            ...state,
            updated: state.updated === "on" ? "off" : "on",
          });
          return true;
        }
        if (id === launcher.parameters.ids.access) {
          const state = launcher.parameters.visibility.state();
          launcher.parameters.visibility.apply({
            ...state,
            access: state.access === "link" ? "public" : "link",
          });
          return true;
        }
        if (id === launcher.parameters.ids.mode) {
          launcher.parameters.mode(
            launcher.parameters.mode() === "save" ? "publish" : "save",
          );
          return true;
        }
        if (id === launcher.parameters.ids.submit) {
          launcher.parameters.submitAction.run();
          return true;
        }
        return false;
      },
    },
    feed: {
      current() {
        return launcher.state.feed.group || "";
      },
      clear() {
        launcher.state.feed.group = "";
      },
      clearScenario(id = "") {
        if (launcher.state.feed.scenario === id) return;
        launcher.state.feed.scenario = id;
        launcher.feed.clear();
      },
      set(id = "") {
        launcher.state.feed.group = launcher.feed.current() === id ? "" : id;
        return launcher.state.feed.group;
      },
      active(id = "") {
        return launcher.feed.current() === id;
      },
      meta(value) {
        const fallbackId = String(value?.id || "");
        const meta = runtimeGroups[fallbackId] || {};
        const id = String(meta.id || fallbackId);
        return {
          id,
          title: String(meta.title || value?.title || id),
          emoji: String(meta.emoji || ""),
        };
      },
      visible(value) {
        return Boolean(launcher.feed.meta(value).emoji);
      },
      activeGroup(groups = []) {
        const id = launcher.feed.current();
        if (!id) return null;
        return groups.find((group) => group.id === id) || null;
      },
      button(value) {
        const meta = launcher.feed.meta(value);
        if (!meta.emoji) return "";
        return ui.controls.button({
          content: icon.emoji(meta.emoji, "launcher"),
          action: "group",
          title: meta.title,
          classes: launcher.feed.active(meta.id) ? "is-active" : "",
          attrs: ` data-id="${meta.id}" type="button"`,
        });
      },
    },
    group: {
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
        return {
          id: String(value?.id || ""),
          title: String(value?.title || ""),
          users: Array.isArray(value?.users) ? value.users : [],
          roles: Array.isArray(value?.roles) ? value.roles : [],
          commands: Array.isArray(value?.commands)
            ? value.commands.map((item) => launcher.command.normalize(item))
            : [],
        };
      },
      allow(value, user, role) {
        if (!launcher.command.allowed(value, user, role)) {
          return {
            id: String(value?.id || ""),
            title: String(value?.title || ""),
            commands: [],
          };
        }
        const commands = Array.isArray(value?.commands) ? value.commands : [];
        return {
          id: String(value?.id || ""),
          title: String(value?.title || ""),
          commands: commands.filter((item) =>
            launcher.command.allowed(item, user, role),
          ),
        };
      },
      attach(value, tools, { visible } = {}) {
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
          id: String(value?.id || ""),
          title: String(value?.title || ""),
          commands,
        };
      },
      empty(value) {
        return !(Array.isArray(value?.commands) && value.commands.length);
      },
    },
    node: {
      panel() {
        return document.getElementById(launcher.id);
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
          group: launcher.feed.current(),
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
      const visible = (id) => {
        if (
          activeScenario?.id === "madtest" &&
          (contextValue.path === "/app" || contextValue.path === "/app/")
        ) {
          return id === "madtest-find";
        }
        if (id === "locator-madtest")
          return Boolean(contextValue.madtestImport);
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
          launcher.group.attach(group, launcher.catalog, { visible }),
        )
        .filter((group) => !launcher.group.empty(group));
      const tools = groups
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
    htmlCommand(value) {
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
    htmlRoleChoice(value) {
      return [
        {
          id: "author",
          title: "Журналист",
          emoji: "\uD83E\uDD88",
        },
        {
          id: "editor",
          title: "Корректор",
          emoji: "\uD83D\uDC1D",
        },
      ]
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
    htmlTools(groups = [], role = "") {
      const explicitGroup = launcher.feed.activeGroup(groups);
      if (explicitGroup) {
        return `${launcher.feed.button(explicitGroup)}${launcher.htmlCommands(explicitGroup.commands)}`;
      }
      const roleGroup = groups.find((group) => group.id === role) || null;
      const roleCommands = roleGroup?.commands || [];
      const topLevelGroups = groups.filter(
        (group) => !launcher.feed.visible(group),
      );
      const beforeGroups = topLevelGroups
        .filter((group) => group.id !== "submit")
        .flatMap((group) => group.commands || []);
      const afterGroups = topLevelGroups
        .filter((group) => group.id === "submit")
        .flatMap((group) => group.commands || []);
      const groupButtons = groups
        .filter((group) => launcher.feed.visible(group))
        .filter((group) => !roleGroup || group.id !== roleGroup.id)
        .map((group) => launcher.feed.button(group))
        .join("");
      return `${launcher.htmlCommands(roleCommands)}${launcher.htmlCommands(beforeGroups)}${groupButtons}${launcher.htmlCommands(afterGroups)}`;
    },
    html() {
      const snapshot = launcher.snapshot();
      const current = snapshot.activeScenario;
      const marker = snapshot.marker;
      const theme = launcher.theme();
      const superuserChoice =
        snapshot.context.surface === "adminPost" &&
        snapshot.realUser === "baranov" &&
        !snapshot.previewRole;
      const lineButtons = superuserChoice
        ? launcher.htmlRoleChoice(snapshot)
        : launcher.htmlTools(snapshot.groups, snapshot.effectiveRole);
      const scenarioButtons = snapshot.scenarios
        .map((item) =>
          ui.controls.button({
            content: icon.emoji(
              current?.id === item.id
                ? marker.emoji
                : item.emoji || "\uD83D\uDD16",
              "launcher",
            ),
            action: current?.id === item.id ? marker.action : "scenario",
            title:
              current?.id === item.id
                ? marker.label || marker.title
                : item.title,
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
      const saved = launcher.position();
      if (!saved) {
        panelNode.style.removeProperty("left");
        panelNode.style.removeProperty("top");
        panelNode.style.removeProperty("right");
        panelNode.style.removeProperty("bottom");
        panelNode.style.removeProperty("transform");
        launcher.dockApply(panelNode, { target: "floating", side: "" });
        return;
      }
      const dock = saved.dock || { target: "floating", side: "" };
      launcher.state.dock = dock;
      launcher.dockApply(panelNode, dock, saved);
    },
    render() {
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
      launcher.activeSync();
    },
    mount() {
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
    runTool(id) {
      return runner.run({
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
      popup.open(mode);
      return true;
    },
    runCommand(id, options = {}) {
      if (launcher.command.parameter({ id })) {
        return launcher.parameters.run(id, options);
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
      if (action === "scenario") {
        launcher.state.scenario = id;
        launcher.feed.clear();
        launcher.render();
        return;
      }
      if (action === "preview-role") {
        const role = button.dataset.role || "";
        if (role) {
          launcher.preview.set(
            launcher.scenarios.context(),
            context.account(),
            role,
          );
        } else {
          launcher.preview.cycle(
            launcher.scenarios.context(),
            context.account(),
          );
        }
        launcher.feed.clear();
        launcher.render();
        return;
      }
      if (action === "group") {
        launcher.feed.set(id);
        launcher.render();
        return;
      }
      if (action === "tool") {
        const parameter = launcher.command.parameter({ id });
        const close = button.dataset.close || "";
        launcher.runCommand(id, { reverse: Boolean(event?.altKey) });
        if (close === "group") launcher.feed.clear();
        if (parameter || close === "group") launcher.render();
        else launcher.activeSync();
      }
    },
    activeSync() {
      const panelNode = launcher.node.panel();
      if (!panelNode) return;
      const state = actions.state();
      panelNode
        .querySelectorAll('[data-action="tool"][data-id]')
        .forEach((button) => {
          const id = button.dataset.id || "";
          if (state[id]) {
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
          launcher.activeSync();
        }
        event.preventDefault();
        return true;
      },
      bind() {
        if (launcher.state.keyboardSync) return;
        const sync = (event) => launcher.keyboard.run(event);
        launcher.state.keyboardSync = sync;
        document.addEventListener("keydown", sync, true);
      },
      unbind() {
        if (!launcher.state.keyboardSync) return;
        document.removeEventListener(
          "keydown",
          launcher.state.keyboardSync,
          true,
        );
        launcher.state.keyboardSync = null;
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
        value.classList,
      ].join("::");
    },
    syncContext() {
      const next = launcher.scenarios.context();
      const current = launcher.state.context || {};
      if (launcher.contextKey(next) === launcher.contextKey(current)) return;
      launcher.state.context = next;
      launcher.state.scenario = "";
      launcher.feed.clear();
      launcher.render();
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
