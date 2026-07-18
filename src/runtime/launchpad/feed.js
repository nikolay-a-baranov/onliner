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
        motion: {
          travel: {
            icon(button) {
              return (
                button?.querySelector?.(
                  ".ui-icon-box,.toolbar-icon-box,.toolbar-media-box",
                ) || null
              );
            },
            rect(button) {
              const node = launcher.feed.motion.travel.icon(button);
              if (!node) return null;
              const rect = node.getBoundingClientRect();
              if (!rect.width || !rect.height) return null;
              return {
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
              };
            },
            button(id = "") {
              const panel = launcher.node?.panel?.();
              if (!panel || !id) return null;
              return panel.querySelector(
                `[data-action="group"][data-id="${String(id || "")}"]`,
              );
            },
            reduce() {
              return Boolean(
                window.matchMedia?.("(prefers-reduced-motion: reduce)")
                  ?.matches,
              );
            },
            capture({ button = null, id = "", groups = [] } = {}) {
              if (!id || launcher.feed.motion.travel.reduce()) return null;
              if (id === "toolbox" || launcher.feed.inlineGroup(id)) return null;
              const rect = launcher.feed.motion.travel.rect(button);
              if (!rect) return null;
              return {
                id,
                rect,
                direction:
                  launcher.feed.currentId(groups) === id ? "exit" : "enter",
              };
            },
            distance(from = null, to = null) {
              if (!from || !to) return 0;
              const dx = to.left + to.width / 2 - (from.left + from.width / 2);
              const dy = to.top + to.height / 2 - (from.top + from.height / 2);
              return Math.hypot(dx, dy);
            },
            turns(from = null, to = null) {
              const distance = launcher.feed.motion.travel.distance(from, to);
              return Math.max(1, Math.ceil(distance / 46));
            },
            duration() {
              return 420;
            },
            landingDuration() {
              return 520;
            },
            hide(button = null) {
              if (!button) return null;
              button.dataset.feedTravelHidden = "true";
              return button;
            },
            show(button = null) {
              if (!button) return false;
              delete button.dataset.feedTravelHidden;
              return true;
            },
            clone(button = null) {
              const node = launcher.feed.motion.travel.icon(button);
              if (!node) return null;
              const rect = node.getBoundingClientRect();
              const style = window.getComputedStyle(node);
              const clone = document.createElement("span");
              const face = node.querySelector(".launchpad-back-face-default");
              clone.classList.add("launchpad-travel-ghost");
              clone.innerHTML = face ? face.innerHTML : node.innerHTML;
              clone.style.position = "fixed";
              clone.style.left = `${rect.left}px`;
              clone.style.top = `${rect.top}px`;
              clone.style.width = `${rect.width}px`;
              clone.style.height = `${rect.height}px`;
              clone.style.minWidth = `${rect.width}px`;
              clone.style.minHeight = `${rect.height}px`;
              clone.style.fontSize = style.fontSize;
              clone.style.color = style.color;
              clone.style.pointerEvents = "none";
              clone.style.zIndex = "2147483647";
              clone.style.margin = "0";
              clone.style.transformOrigin = "center center";
              document.body.appendChild(clone);
              return clone;
            },
            snapshot(panel = null) {
              if (!panel) return null;
              const rect = panel.getBoundingClientRect();
              if (!rect.width || !rect.height) return null;
              const clone = panel.cloneNode(true);
              clone.removeAttribute("id");
              clone.dataset.launchpadTravelSnapshot = "true";
              clone.setAttribute("aria-hidden", "true");
              clone.style.setProperty("position", "fixed", "important");
              clone.style.setProperty("left", `${rect.left}px`, "important");
              clone.style.setProperty("top", `${rect.top}px`, "important");
              clone.style.setProperty("width", `${rect.width}px`, "important");
              clone.style.setProperty("height", `${rect.height}px`, "important");
              clone.style.setProperty("margin", "0", "important");
              clone.style.setProperty("pointer-events", "none", "important");
              clone.style.setProperty("z-index", "2147483646", "important");
              clone.style.setProperty("visibility", "visible", "important");
              clone.querySelectorAll("[id]").forEach((node) => {
                node.removeAttribute("id");
              });
              document.body.appendChild(clone);
              return clone;
            },
            items(panel = null) {
              if (!panel) return [];
              return Array.from(
                panel.querySelectorAll(
                  [
                    '.ui-button[data-action="tool"] .ui-icon-box',
                    '.ui-button[data-action="tool"] .toolbar-icon-box',
                    '.ui-button[data-action="tool"] .toolbar-media-box',
                    '.ui-button[data-action="group"] .ui-icon-box',
                    '.ui-button[data-action="group"] .toolbar-icon-box',
                    '.ui-button[data-action="group"] .toolbar-media-box',
                    '[data-separator-mode]',
                  ].join(','),
                ),
              ).filter((node) => (
                !node.closest('[data-ui-cluster]') &&
                !node.closest('[data-ui-role="marker"]')
              ));
            },
            fade(panel = null, direction = "out") {
              const items = launcher.feed.motion.travel.items(panel);
              if (!items.length) return Promise.resolve();
              const enter = direction === "in";
              const duration = enter ? 180 : 140;
              const animations = items.map((node) => node.animate(
                enter
                  ? [{ opacity: 0 }, { opacity: 1 }]
                  : [{ opacity: 1 }, { opacity: 0 }],
                {
                  duration,
                  easing: enter
                    ? "cubic-bezier(.16,1,.3,1)"
                    : "cubic-bezier(.4,0,1,1)",
                  fill: "both",
                },
              ));
              return Promise.all(
                animations.map((animation) => animation.finished.catch(() => null)),
              );
            },
            conceal(panel = null) {
              launcher.feed.motion.travel.items(panel).forEach((node) => {
                node.style.setProperty("opacity", "0");
              });
              return panel;
            },
            reveal(panel = null) {
              const items = launcher.feed.motion.travel.items(panel);
              items.forEach((node) => {
                node.style.setProperty("opacity", "0");
              });
              const animation = launcher.feed.motion.travel.fade(panel, "in");
              animation.finally(() => {
                items.forEach((node) => {
                  node.style.removeProperty("opacity");
                });
              });
              return animation;
            },
            finish(panel) {
              window.setTimeout(() => {
                delete panel.dataset.feedTraveling;
                delete panel.dataset.feedTravelPhase;
              }, launcher.feed.motion.travel.landingDuration());
            },
            transition(value = null, apply = () => {}) {
              if (!value?.id || !value?.rect) return false;
              const panel = launcher.node?.panel?.();
              if (!panel) return false;
              const source = launcher.feed.motion.travel.button(value.id);
              const ghost = launcher.feed.motion.travel.clone(source);
              if (!ghost) return false;
              const panelRect = launcher.resize?.rect?.(panel) || null;
              const snapshot = launcher.feed.motion.travel.snapshot(panel);
              if (!snapshot) {
                ghost.remove();
                return false;
              }
              panel.dataset.feedTraveling = "true";
              panel.dataset.feedTravelPhase = "fade";
              launcher.feed.motion.travel.fade(snapshot, "out").then(() => {
                panel.style.visibility = "hidden";
                apply();
                launcher.render();
                requestAnimationFrame(() => requestAnimationFrame(() => {
                  const targetButton = launcher.feed.motion.travel.button(value.id);
                  launcher.feed.motion.travel.hide(targetButton);
                  const target = launcher.feed.motion.travel.rect(targetButton);
                  if (!target) {
                    ghost.remove();
                    snapshot.remove();
                    panel.style.visibility = "";
                    delete panel.dataset.feedTraveling;
                    delete panel.dataset.feedTravelPhase;
                    launcher.render();
                    return;
                  }
                  const dx =
                    target.left +
                    target.width / 2 -
                    (value.rect.left + value.rect.width / 2);
                  const dy =
                    target.top +
                    target.height / 2 -
                    (value.rect.top + value.rect.height / 2);
                  const turns = launcher.feed.motion.travel.turns(
                    value.rect,
                    target,
                  );
                  const sign = value.direction === "exit" ? 1 : -1;
                  const rotate = `${sign * turns * 360}deg`;
                  const scale = target.width && value.rect.width
                    ? target.width / value.rect.width
                    : 1;
                  const transform = `translate(${dx}px, ${dy}px) rotate(${rotate}) scale(${scale})`;
                  const approachScale = 1 + (scale - 1) * 0.72;
                  let settled = false;
                  const done = () => {
                    if (settled) return;
                    settled = true;
                    launcher.feed.motion.travel.show(targetButton);
                    launcher.feed.motion.travel.reveal(panel);
                    requestAnimationFrame(() => {
                      ghost.remove();
                      delete panel.dataset.feedTraveling;
                      delete panel.dataset.feedTravelPhase;
                    });
                  };
                  launcher.feed.motion.travel.conceal(panel);
                  panel.style.visibility = "";
                  snapshot.remove();
                  delete panel.dataset.feedTraveling;
                  launcher.resize?.run?.(panel, panelRect);
                  panel.dataset.feedTraveling = "true";
                  panel.dataset.feedTravelPhase = "move";
                  requestAnimationFrame(() => {
                    const duration = launcher.resize?.duration?.(panel) ||
                      launcher.feed.motion.travel.duration();
                    const animation = ghost.animate(
                      [
                        {
                          opacity: 1,
                          transform: "translate(0, 0) rotate(0deg) scale(1)",
                        },
                        {
                          opacity: 1,
                          offset: 0.58,
                          transform: `translate(${dx * 0.58}px, ${dy * 0.58}px) rotate(${sign * turns * 360 * 0.58}deg) scale(${approachScale})`,
                        },
                        {
                          opacity: 1,
                          offset: 0.78,
                          transform: `translate(${dx * 0.88}px, ${dy * 0.88}px) rotate(${sign * turns * 360 * 0.88}deg) scale(${scale})`,
                        },
                        { opacity: 1, transform },
                      ],
                      {
                        duration,
                        easing: "cubic-bezier(.22,1,.36,1)",
                        fill: "both",
                      },
                    );
                    animation.onfinish = done;
                    animation.oncancel = done;
                  });
                }));
              });
              return true;
            },
            play(value = null) {
              if (!value?.id || !value?.rect) return false;
              const button = launcher.feed.motion.travel.button(value.id);
              const node = launcher.feed.motion.travel.icon(button);
              if (!node) return false;
              const rect = node.getBoundingClientRect();
              const dx = value.rect.left - rect.left;
              const dy = value.rect.top - rect.top;
              const turns = launcher.feed.motion.travel.turns(value.rect, rect);
              const sign = value.direction === "exit" ? 1 : -1;
              const rotate = `${sign * turns * 360}deg`;
              if (launcher.state.feed.travelAnimation) {
                launcher.state.feed.travelAnimation.cancel();
              }
              node.dataset.feedTravel = value.direction || "";
              launcher.state.feed.travelAnimation = node.animate(
                [
                  {
                    opacity: 0.96,
                    transform: `translate(${dx}px, ${dy}px) rotate(0deg)`,
                  },
                  {
                    opacity: 1,
                    transform: `translate(0, 0) rotate(${rotate})`,
                  },
                ],
                {
                  duration: launcher.feed.motion.travel.duration(),
                  easing: "cubic-bezier(.22,1,.36,1)",
                  fill: "both",
                },
              );
              launcher.state.feed.travelAnimation.onfinish = () => {
                delete node.dataset.feedTravel;
                launcher.state.feed.travelAnimation = null;
              };
              launcher.state.feed.travelAnimation.oncancel = () => {
                delete node.dataset.feedTravel;
                launcher.state.feed.travelAnimation = null;
              };
              return true;
            },
          },
        },
        pinnedMotion() {
          return String(launcher.state.feed.pinnedMotion || "");
        },
        pinnedSpinMotion() {
          return String(launcher.state.feed.pinnedSpinMotion || "");
        },
        inlineMotion(id = "") {
          if (id === "pinned") {
            return launcher.feed.pinnedSpinMotion() || launcher.feed.pinnedMotion();
          }
          if (id === "roadmap") {
            return String(launcher.state.feed.roadmapMotion || "");
          }
          return "";
        },
        inlineMotionAttr(id = "") {
          const motion = launcher.feed.inlineMotion(id);
          return motion ? ` data-inline-motion="${motion}"` : "";
        },
        markerMotion() {
          return String(launcher.state.feed.markerMotion || "");
        },
        markerMotionAttr() {
          const motion = launcher.feed.markerMotion();
          return motion ? ` data-inline-motion="${motion}"` : "";
        },
        syncMarker(value = "") {
          launcher.state.feed.markerMotion = String(value || "");
          return launcher.feed.markerMotion();
        },
        markerClearLater() {
          if (launcher.state.feed.markerTimer) {
            window.clearTimeout(launcher.state.feed.markerTimer);
          }
          launcher.state.feed.markerTimer = window.setTimeout(() => {
            launcher.feed.syncMarker("");
            launcher.state.feed.markerTimer = 0;
            launcher.feed.syncMarkerDom();
          }, launcher.feed.motionDuration("marker", launcher.feed.markerMotion()));
        },
        syncMarkerDom() {
          const panel = launcher.node?.panel?.();
          if (!panel) return false;
          const button = panel.querySelector(
            '[data-launchpad-marker="true"],[data-action="role-cycle"],[data-action="preview-role"]',
          );
          if (!button) return false;
          const motion = launcher.feed.markerMotion();
          if (motion) button.dataset.inlineMotion = motion;
          else delete button.dataset.inlineMotion;
          return true;
        },
        spinMarker(value = "exit") {
          launcher.feed.syncMarker(value);
          launcher.feed.markerClearLater();
          return launcher.feed.markerMotion();
        },
        markerVisual() {
          const panel = launcher.node?.panel?.();
          const button = panel?.querySelector?.(
            '[data-launchpad-marker="true"],[data-action="role-cycle"],[data-action="preview-role"]',
          );
          return button?.querySelector?.(".launchpad-marker-visual") || null;
        },
        markerAnimation(node = null, motion = "exit") {
          if (!node?.animate) return null;
          const exit = motion === "exit";
          const keyframes = exit
            ? [
                { transform: "rotate(0deg) scale(1)", offset: 0 },
                { transform: "rotate(110deg) scale(.82)", offset: .34 },
                { transform: "rotate(410deg) scale(.4)", offset: .68 },
                { transform: "rotate(900deg) scale(.03125)", offset: 1 },
              ]
            : [
                { transform: "rotate(-900deg) scale(.03125)", offset: 0 },
                { transform: "rotate(-410deg) scale(.4)", offset: .32 },
                { transform: "rotate(-110deg) scale(.82)", offset: .66 },
                { transform: "rotate(0deg) scale(1)", offset: 1 },
              ];
          return node.animate(keyframes, {
            duration: launcher.feed.motionDuration("marker", motion),
            easing: exit
              ? "cubic-bezier(.55,0,.82,.3)"
              : "cubic-bezier(.18,.72,.24,1)",
            fill: "both",
          });
        },
        swapMarker(change = null) {
          if (launcher.state.feed.markerTransitioning) return false;
          const current = launcher.feed.markerVisual();
          if (!current) {
            change?.();
            launcher.render({ place: true });
            return true;
          }
          launcher.state.feed.markerTransitioning = true;
          const finish = () => {
            launcher.state.feed.markerTransitioning = false;
          };
          const enter = () => {
            window.requestAnimationFrame(() => {
              const next = launcher.feed.markerVisual();
              const animation = launcher.feed.markerAnimation(next, "enter");
              if (!animation) {
                finish();
                return;
              }
              animation.finished.then(finish).catch(finish);
            });
          };
          const swap = () => {
            change?.();
            launcher.render({ place: true });
            enter();
          };
          const animation = launcher.feed.markerAnimation(current, "exit");
          if (!animation) {
            swap();
            return true;
          }
          animation.finished.then(swap).catch(() => {
            finish();
          });
          return true;
        },
        syncPinned(value = "") {
          launcher.state.feed.pinnedMotion = String(value || "");
          return launcher.feed.pinnedMotion();
        },
        syncPinnedSpin(value = "") {
          launcher.state.feed.pinnedSpinMotion = String(value || "");
          return launcher.feed.pinnedSpinMotion();
        },
        motionDuration(id = "", motion = "") {
          if (id === "marker" && motion === "exit") return 880;
          if (id === "marker" && motion === "enter") return 880;
          if (id === "marker") return 880;
          if (id === "resize") return 480;
          if (id === "group" && motion === "enter") return 480;
          if (id === "pinned" && motion === "exit") {
            return Math.round(launcher.feed.motionDuration("group", "enter") / 3);
          }
          if (id === "pinned") return 720;
          if (id === "roadmap" && motion === "enter") return 480;
          if (id === "roadmap" && motion === "exit") return 560;
          return 560;
        },
        pinnedClearLater(render = false) {
          if (launcher.state.feed.pinnedTimer) {
            window.clearTimeout(launcher.state.feed.pinnedTimer);
          }
          launcher.state.feed.pinnedTimer = window.setTimeout(() => {
            launcher.feed.syncPinned("");
            launcher.state.feed.pinnedTimer = 0;
            if (render) launcher.render();
          }, launcher.feed.motionDuration("pinned", launcher.feed.pinnedMotion()));
        },
        pinnedSpinClearLater(render = false) {
          if (launcher.state.feed.pinnedSpinTimer) {
            window.clearTimeout(launcher.state.feed.pinnedSpinTimer);
          }
          launcher.state.feed.pinnedSpinTimer = window.setTimeout(() => {
            launcher.feed.syncPinnedSpin("");
            launcher.state.feed.pinnedSpinTimer = 0;
            if (render) launcher.render();
            else launcher.feed.syncPinnedSpinDom();
          }, launcher.feed.motionDuration("pinned", "enter"));
        },
        syncPinnedSpinDom() {
          const panel = launcher.node?.panel?.();
          if (!panel) return false;
          const button = panel.querySelector(
            '[data-action="group"][data-id="pinned"]',
          );
          if (!button) return false;
          const motion = launcher.feed.inlineMotion("pinned");
          if (motion) button.dataset.inlineMotion = motion;
          else delete button.dataset.inlineMotion;
          return true;
        },
        syncPinnedDom() {
          const panel = launcher.node?.panel?.();
          if (!panel) return false;
          const group = panel.querySelector(
            '[data-launchpad-group="true"][data-group-id="pinned"]',
          );
          if (!group) return false;
          const button = group.querySelector(
            '[data-action="group"][data-id="pinned"]',
          );
          const popover = group.querySelector('[data-pinned-popover="true"]');
          const motion = launcher.feed.pinnedMotion();
          group.dataset.groupMotion = "";
          group.dataset.groupShellMotion = "";
          group.dataset.pinnedMotion = "";
          if (popover) {
            popover.style.setProperty(
              "--surface-launchpad-pinned-popover-width",
              `${popover.scrollWidth}px`,
            );
            popover.style.setProperty(
              "--surface-launchpad-pinned-popover-height",
              `${popover.scrollHeight}px`,
            );
            popover.dataset.pinnedMotion = "";
          }
          if (button) {
            delete button.dataset.inlineMotion;
          }
          group.offsetWidth;
          group.dataset.groupMotion = "";
          group.dataset.groupShellMotion = "";
          group.dataset.pinnedMotion = motion;
          group.dataset.expanded = "true";
          if (popover) popover.dataset.pinnedMotion = motion;
          if (button) {
            button.classList.toggle("is-active", motion !== "exit");
            const inlineMotion = launcher.feed.inlineMotion("pinned");
            if (inlineMotion) button.dataset.inlineMotion = inlineMotion;
            else delete button.dataset.inlineMotion;
          }
          return true;
        },
        roadmapClearLater() {
          if (launcher.state.feed.roadmapTimer) {
            window.clearTimeout(launcher.state.feed.roadmapTimer);
          }
          const motion = String(launcher.state.feed.roadmapMotion || "");
          launcher.state.feed.roadmapTimer = window.setTimeout(() => {
            launcher.state.feed.roadmapMotion = "";
            launcher.state.feed.roadmapTimer = 0;
            launcher.feed.syncRoadmapDom();
          }, launcher.feed.motionDuration("roadmap", motion));
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
          if (launcher.state.feed.travelAnimation) {
            launcher.state.feed.travelAnimation.cancel();
          }
          launcher.state.feed.travelAnimation = null;
          launcher.state.feed.markerMotion = "";
          if (launcher.state.feed.markerTimer) {
            window.clearTimeout(launcher.state.feed.markerTimer);
          }
          launcher.state.feed.markerTimer = 0;
          launcher.state.feed.pinnedMotion = "";
          if (launcher.state.feed.pinnedTimer) {
            window.clearTimeout(launcher.state.feed.pinnedTimer);
          }
          launcher.state.feed.pinnedTimer = 0;
          launcher.state.feed.pinnedSpinMotion = "";
          if (launcher.state.feed.pinnedSpinTimer) {
            window.clearTimeout(launcher.state.feed.pinnedSpinTimer);
          }
          launcher.state.feed.pinnedSpinTimer = 0;
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
        clearRole(id = "") {
          if (launcher.state.feed.role === id) return;
          launcher.state.feed.role = id;
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
          if (String(id || "") === "pinned") {
            return current === "pinned"
              ? launcher.feed.pinnedHide()
              : launcher.feed.pinnedShow();
          }
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
        pinnedShow() {
          if (launcher.state.feed.pinnedTimer) {
            window.clearTimeout(launcher.state.feed.pinnedTimer);
          }
          launcher.state.feed.pinnedTimer = 0;
          launcher.feed.roadmap(false);
          launcher.state.feed.group = "pinned";
          launcher.feed.syncPinned("enter");
          launcher.feed.syncPinnedSpin("enter");
          launcher.feed.pinnedClearLater(false);
          launcher.feed.pinnedSpinClearLater();
          return launcher.state.feed.group;
        },
        pinnedHide() {
          if (launcher.state.feed.pinnedTimer) {
            window.clearTimeout(launcher.state.feed.pinnedTimer);
          }
          launcher.state.feed.group = "";
          launcher.feed.syncPinned("exit");
          launcher.feed.syncPinnedSpin("exit");
          launcher.feed.syncPinnedDom();
          launcher.feed.pinnedClearLater(false);
          launcher.feed.pinnedSpinClearLater(true);
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
          if (launcher.state.feed.roadmapMotion) {
            launcher.feed.roadmapClearLater();
          }
          return launcher.feed.roadmap();
        },
        roadmapBusy() {
          return String(launcher.state.feed.roadmapMotion || "") !== "";
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
            const motion = String(launcher.state.feed.roadmapMotion || "");
            if (motion) button.dataset.inlineMotion = motion;
            else delete button.dataset.inlineMotion;
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
          }, launcher.feed.motionDuration("roadmap", "exit"));
          return true;
        },
        toggleRoadmap() {
          if (launcher.feed.roadmapBusy()) return launcher.feed.roadmap();
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
          if (id === "pinned" && launcher.feed.pinnedMotion() === "exit") {
            return groups.some((group) => group.id === "pinned");
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
          const inlineMotion = launcher.feed.inlineMotionAttr(meta.id);
          return ui.controls.button({
            content: options.content || launcher.icon(meta.icon),
            action: "group",
            title: String(options.title || meta.title),
            classes,
            attrs: ` data-id="${meta.id}" type="button"${inlineMotion}${options.attrs || ""}`,
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
        const motion = meta.id === "pinned"
          ? launcher.feed.pinnedMotion()
          : launcher.state.feed.groupMotionId === meta.id
            ? String(launcher.state.feed.groupMotion || "")
            : "";
        const content = meta.id === "pinned"
          ? `${head}<span data-pinned-popover="true" data-pinned-motion="${motion}">${commands}</span>`
          : `${head}${commands}`;
        const groupMotion = meta.id === "pinned" ? "" : motion;
        const pinnedMotion = meta.id === "pinned"
          ? ` data-pinned-motion="${motion}"`
          : "";
        return ui.shell.strip(content, {
          classes: "launchpad-tool-group",
          attrs: ` data-launchpad-group="true" data-group-id="${meta.id}" data-expanded="true" data-group-motion="${groupMotion}" data-group-shell-motion="${groupMotion}"${pinnedMotion}`,
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
            id: "authors",
            title: "\u0416\u0443\u0440\u043D\u0430\u043B\u0438\u0441\u0442",
            emoji: "shark",
          },
          {
            id: "editors",
            title: "\u041A\u043E\u0440\u0440\u0435\u043A\u0442\u043E\u0440",
            emoji: "honeybee",
          },
        ]
          .sort(
            (left, right) =>
              Number(right.id === "editors") - Number(left.id === "editors"),
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
                ? ` data-id="${item.id}" data-command="${marker.command || ""}" type="button" aria-label="${marker.label || marker.title}" data-launchpad-marker="true"${launcher.feed.markerMotionAttr()}`
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
