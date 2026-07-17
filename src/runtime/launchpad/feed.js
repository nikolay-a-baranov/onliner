const launchpadFeed = {
  create({ launcher, groups, ui, icon, toolbar, commands }) {
    return {
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
          if (launcher.feed.touch()) return "";
          return groups.some((group) => group.id === "pinned") ? "pinned" : "";
        },
        currentId(groups = []) {
          if (launcher.state.feed.group !== null) {
            return launcher.state.feed.group;
          }
          return launcher.feed.defaultId(groups);
        },
        current(groups = []) {
          return launcher.feed.currentId(groups);
        },
        preservePinned(groups = []) {
          return (
            launcher.feed.reader() &&
            !launcher.feed.touch() &&
            groups.some((group) => group.id === "pinned")
          );
        },
        inlineGroup(id = "") {
          return ["pinned", "roadmap"].includes(String(id || ""));
        },
        animateGroup(id = "", current = "") {
          launcher.state.feed.groupMotion =
            id && current !== id ? "enter" : "";
          launcher.state.feed.groupMotionId =
            launcher.state.feed.groupMotion ? String(id || "") : "";
          return launcher.state.feed.groupMotion;
        },
        clear() {
          launcher.state.feed.group = null;
          launcher.state.feed.toolbox = false;
          launcher.state.feed.groupMotion = "";
          launcher.state.feed.groupMotionId = "";
          launcher.state.feed.roadmap = false;
          launcher.state.feed.roadmapMotion = "";
          if (launcher.state.feed.roadmapTimer) {
            window.clearTimeout(launcher.state.feed.roadmapTimer);
          }
          launcher.state.feed.roadmapTimer = 0;
        },
        clearScenario(id = "") {
          if (launcher.state.feed.scenario === id) return;
          launcher.state.feed.scenario = id;
          launcher.feed.clear();
        },
        closeGroup(groups = []) {
          if (launcher.feed.preservePinned(groups)) {
            launcher.state.feed.group = null;
            launcher.state.feed.toolbox = false;
            return;
          }
          launcher.feed.clear();
        },
        set(id = "", groups = []) {
          const current = launcher.feed.currentId(groups);
          launcher.feed.animateGroup(id, current);
          if (String(id || "") !== "roadmap") {
            launcher.feed.roadmap(false);
          }
          launcher.state.feed.group = current === id ? "" : id;
          if (launcher.state.feed.group !== String(id || "")) {
            launcher.state.feed.groupMotion = "";
            launcher.state.feed.groupMotionId = "";
          }
          return launcher.state.feed.group;
        },
        roadmap(value) {
          if (value === undefined) return launcher.state.feed.roadmap === true;
          if (launcher.state.feed.roadmapTimer) {
            window.clearTimeout(launcher.state.feed.roadmapTimer);
          }
          launcher.state.feed.roadmapTimer = 0;
          launcher.state.feed.roadmap = value === true;
          launcher.state.feed.roadmapMotion = launcher.state.feed.roadmap
            ? "enter"
            : "";
          return launcher.feed.roadmap();
        },
        syncRoadmapDom() {
          const panel = launcher.node?.panel?.();
          if (!panel) return false;
          const popover = panel.querySelector('[data-roadmap-popover="true"]');
          if (!popover) return false;
          const group = popover.closest?.('[data-launchpad-group="true"]');
          const button =
            group?.querySelector?.('[data-action="group"][data-id="roadmap"]') ||
            panel.querySelector?.('[data-action="group"][data-id="roadmap"]');
          const expanded = launcher.feed.roadmap();
          if (group) {
            group.dataset.expanded = expanded ? "true" : "false";
          }
          if (button) {
            button.classList.toggle("is-active", expanded);
          }
          popover.dataset.roadmapMotion = String(
            launcher.state.feed.roadmapMotion || "",
          );
          popover.setAttribute("aria-hidden", expanded ? "false" : "true");
          if (expanded) {
            popover.removeAttribute("inert");
          } else {
            popover.setAttribute("inert", "");
          }
          return true;
        },
        roadmapHide() {
          if (!launcher.state.feed.roadmap) return false;
          if (launcher.state.feed.roadmapTimer) {
            window.clearTimeout(launcher.state.feed.roadmapTimer);
          }
          launcher.state.feed.roadmapMotion = "exit";
          launcher.state.feed.roadmapTimer = window.setTimeout(() => {
            launcher.state.feed.roadmap = false;
            launcher.state.feed.roadmapMotion = "";
            launcher.state.feed.roadmapTimer = 0;
            launcher.feed.syncRoadmapDom();
          }, 560);
          return true;
        },
        toggleRoadmap() {
          if (launcher.feed.roadmap()) return launcher.feed.roadmapHide();
          return launcher.feed.roadmap(true);
        },
        active(id = "", groups = []) {
          if (id === "roadmap") {
            return (
              (launcher.feed.roadmap() ||
                launcher.state.feed.roadmapMotion === "exit") &&
              groups.some((group) => group.id === "roadmap")
            );
          }
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
            toolbox: "toolbox",
            pinned: "pushpin",
            authors: "shark",
            editors: "honeybee",
          };
          const emoji = String(value?.emoji || "") ||
            emojiMap[id] ||
            String(meta.emoji || "");
          const logo =
            id === "pinned" ? "" : String(meta.logo || value?.logo || "");
          const favicon =
            id === "pinned"
              ? ""
              : String(meta.favicon || value?.favicon || "");
          const iconValue = emoji ||
            (logo ? `logo:${logo}` : favicon ? `favicon:${favicon}` : "");
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
          if (launcher.feed.inlineGroup(current.id)) return null;
          return current;
        },
        setToolbox(id = "", groups = []) {
          const current = launcher.feed.currentId(groups);
          if (id === "toolbox") {
            const next = !launcher.feed.toolbox();
            launcher.feed.toolbox(next);
            launcher.state.feed.group = next ? "" : null;
            launcher.state.feed.groupMotion = "";
            launcher.state.feed.groupMotionId = "";
            return launcher.feed.toolbox();
          }
          if (!launcher.feed.toolbox()) return false;
          launcher.feed.animateGroup(id, current);
          if (String(id || "") !== "roadmap") {
            launcher.feed.roadmap(false);
          }
          launcher.state.feed.group = current === id ? "" : id;
          if (launcher.state.feed.group !== String(id || "")) {
            launcher.state.feed.groupMotion = "";
            launcher.state.feed.groupMotionId = "";
          }
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
          if (!meta.icon || launcher.feed.inlineGroup(meta.id)) {
            return launcher.feed.button(value);
          }
          return launcher.feed.button(value, {
            content: `<span class="launchpad-back-icon"><span class="launchpad-back-face launchpad-back-face-default">${launcher.icon(meta.icon)}</span><span class="launchpad-back-face launchpad-back-face-hover">${ui.controls.glyph("Arrow Step Back", 20, "back-arrow")}</span></span>`,
            title: `${meta.title} \u00B7 \u041D\u0430\u0437\u0430\u0434`,
            classes: "is-focused-back",
            attrs: ' data-launchpad-back="group"',
          });
        },
      },
      view: {
        superuser(snapshot) {
          return (
            snapshot.context.surface === "post" &&
            launcher.marker.editor() &&
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
      htmlCommand(value) {
        if (commands.separator(value)) {
          return ui.controls.separator({
            attrs: ' data-separator-mode="dot"',
          });
        }
        const active = launcher.command.active(value)
          ? ' data-active="true"'
          : "";
        return ui.controls.button({
          content: launcher.command.content(value),
          action: "tool",
          title: launcher.command.title(value),
          attrs: ` data-id="${commands.id(value)}" data-close="${value.close || ""}"${active} type="button"`,
        });
      },
      htmlCommands(list = []) {
        return list.map((item) => launcher.htmlCommand(item)).join("");
      },
      htmlGroup(value, groups = []) {
        const meta = launcher.feed.meta(value);
        if (!meta.icon) return launcher.htmlCommands(value?.commands || []);
        const expanded = launcher.feed.active(meta.id, groups);
        const head = `<span class="launchpad-tool-group-head" data-launchpad-group-head="true">${expanded && !launcher.feed.inlineGroup(meta.id) ? launcher.feed.back(value) : launcher.feed.button(value)}</span>`;
        if (!expanded) return head;
        const commands = launcher.htmlCommands(value?.commands || []);
        const motion =
          launcher.state.feed.groupMotionId === meta.id
            ? String(launcher.state.feed.groupMotion || "")
            : "";
        return ui.shell.strip(`${head}${commands}`, {
          classes: "launchpad-tool-group",
          attrs: ` data-launchpad-group="true" data-group-id="${meta.id}" data-expanded="true" data-group-motion="${motion}" data-group-shell-motion="${motion}"`,
        });
      },
      htmlInlineGroup(value, groups = [], options = {}) {
        const meta = launcher.feed.meta(value);
        if (!meta.icon) return launcher.htmlCommands(value?.commands || []);
        const expanded = launcher.feed.active(meta.id, groups);
        const head = `<span class="launchpad-tool-group-head" data-launchpad-group-head="true">${launcher.feed.button(value)}</span>`;
        const currentCommands = launcher.htmlCommands(value?.commands || []);
        if (options.invert) {
          const motion = expanded
            ? String(launcher.state.feed.roadmapMotion || "")
            : "";
          const content = ui.shell.group(currentCommands, {
            classes: "launchpad-inline-invert-content",
            rail: true,
            attrs: ' data-inline-invert-content="true"',
          });
          return `<span class="launchpad-tool-group launchpad-inline-invert" data-launchpad-group="true" data-expanded="${expanded ? "true" : "false"}" data-inline-invert="true">${head}<span data-inline-invert-popover="true" data-roadmap-popover="true" data-roadmap-motion="${motion}" aria-hidden="${expanded ? "false" : "true"}"${expanded ? "" : ' inert'}>${content}</span></span>`;
        }
        if (!expanded) return head;
        return ui.shell.strip(`${head}${currentCommands}`, {
          classes: "launchpad-tool-group",
          attrs: ' data-launchpad-group="true" data-expanded="true"',
        });
      },
      htmlBlocks(list = []) {
        const blocks = list.filter(Boolean);
        return blocks.reduce((html, block, index) => {
          if (!index) return block;
          return `${html}${ui.controls.separator({
            attrs: ' data-separator-mode="dot"',
          })}${block}`;
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
      htmlRoadmap(groups = []) {
        const current = launcher.group.roadmap(groups);
        if (!current) return "";
        return launcher.htmlInlineGroup(current, groups, { invert: true });
      },
      htmlGroupButtons(groups = []) {
        return launcher.group
          .emojis(groups)
          .filter(
            (group) =>
              !launcher.feed.inlineGroup(group.id) &&
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
      htmlEditorialSource(groups = []) {
        const source = groups.find((group) => group.id === "editorial-source");
        return launcher.htmlCommands(source?.commands || []);
      },
      htmlNormal(groups = []) {
        return launcher.htmlBlocks([
          launcher.htmlPinned(groups),
          launcher.htmlEditorialSource(groups),
          launcher.htmlFeedback(groups),
          launcher.htmlGroupButtons(groups),
          launcher.htmlSubmit(groups),
          launcher.htmlRoadmap(groups),
        ]);
      },
      htmlToolboxGroups(groups = []) {
        const availableGroups = launcher.group
          .emojis(groups)
          .filter(
            (group) =>
              group.id !== "submit" &&
              !launcher.feed.inlineGroup(group.id) &&
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
          {
            id: "author",
            title: "\u0416\u0443\u0440\u043D\u0430\u043B\u0438\u0441\u0442",
            emoji: "shark",
          },
          {
            id: "editor",
            title: "\u041A\u043E\u0440\u0440\u0435\u043A\u0442\u043E\u0440",
            emoji: "honeybee",
          },
        ]
          .sort(
            (left, right) =>
              Number(right.id === "editor") - Number(left.id === "editor"),
          )
          .map((item) =>
            ui.controls.button({
              content: icon.emoji(item.emoji),
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
          title: "\u0422\u0443\u043B\u0431\u043E\u043A\u0441",
          classes: launcher.feed.toolbox() ? "is-active" : "",
          attrs: ' data-id="toolbox" type="button"',
        });
      },
      htmlToolboxOpen(groups = []) {
        const focused = launcher.htmlFocused(groups);
        if (focused) return focused;
        return `${launcher.htmlToolboxControl()}${launcher.htmlToolboxGroups(groups)}`;
      },
      htmlSuperuser() {
        return `${launcher.htmlToolboxControl()}${launcher.htmlRoleChoice()}`;
      },
      htmlTools(groups = []) {
        const focused = launcher.htmlFocused(groups);
        if (focused) return focused;
        return launcher.htmlNormal(groups);
      },
      html() {
        const snapshot = launcher.snapshot();
        const current = snapshot.activeScenario;
        const marker = snapshot.marker;
        const theme = launcher.theme();
        const compact = ["source", "telegram"].includes(
          snapshot.context?.surface || "",
        );
        const lineButtons = launcher.view.html(snapshot);
        const scenarioButtons = snapshot.scenarios
          .map((item) => {
            const active = current?.id === item.id;
            const source = active ? marker : item;
            const classes = [
              active ? "is-active" : "",
              active ? String(source.imageClass || "").trim() : "",
            ]
              .filter(Boolean)
              .join(" ");
            return ui.controls.button({
              content: launcher.marker.content(source),
              action: active ? marker.action : "scenario",
              title: active ? marker.label || marker.title : item.title,
              classes,
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
          `${ui.controls.button({ content: icon.emoji(toolbar.appearance.themeToggleIcon(theme)), action: "theme", title: "\u0422\u0435\u043C\u0430", attrs: ' type="button" aria-label="\u0422\u0435\u043C\u0430" data-theme-icon="auto" data-theme-scope="launcher"' })}${ui.controls.button({ content: icon.emoji("cross-mark"), action: "close", title: "\u0412\u044B\u0445\u043E\u0434", attrs: ' type="button" aria-label="\u0412\u044B\u0445\u043E\u0434"' })}`,
          {
            stick: "right",
            rail: true,
          },
        );
        return ui.shell.frame({
          left,
          main,
          right,
          pack: compact ? "start" : "between",
          attrs: compact ? ' data-launchpad-compact="true"' : "",
        });
      },
    };
  },
};

export { launchpadFeed };
