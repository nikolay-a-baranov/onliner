const launchpadMotion = {
  conceal(nodes = []) {
    nodes.forEach((node) => {
      node?.style?.setProperty?.("opacity", "0");
    });
    return nodes;
  },
  fade(nodes = [], direction = "out", options = {}) {
    const targets = Array.from(nodes || []).filter((node) => node?.animate);
    if (!targets.length) return Promise.resolve();
    const enter = direction === "in";
    const duration = Math.max(0, Number(options.duration) || 0);
    const delay = Math.max(0, Number(options.delay) || 0);
    const animations = targets.map((node) =>
      node.animate(
        enter ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }],
        {
          duration,
          delay,
          easing: "linear",
          fill: "both",
        },
      ),
    );
    return Promise.all(
      animations.map((animation) => animation.finished.catch(() => null)),
    );
  },
  spin(node = null, direction = 1, options = {}) {
    if (!node?.animate) return null;
    node.getAnimations?.().forEach((animation) => animation.cancel());
    const duration = Math.max(0, Number(options.duration) || 0);
    const turns = direction < 0 ? -1 : 1;
    return node.animate(
      [
        { transform: "rotate(0deg)" },
        { transform: `rotate(${turns * 360}deg)` },
      ],
      {
        duration,
        easing: options.easing || "cubic-bezier(.22,1,.36,1)",
        fill: "both",
      },
    );
  },
};

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
        defaultId() {
          return "";
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
            launcher.state.feed.group === "pinned" &&
            groups.some((group) => group.id === "pinned")
          );
        },
        inlineGroup(id = "") {
          return ["pinned", "roadmap"].includes(String(id || ""));
        },
        motion: {
          ...launchpadMotion,
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
              return Math.max(1, Math.ceil(distance / 72));
            },
            duration() {
              return 560;
            },
            landingDuration() {
              return 520;
            },
            settleDuration() {
              return 140;
            },
            hide(button = null) {
              const node = launcher.feed.motion.travel.icon(button);
              if (!node) return null;
              node.style.setProperty("opacity", "0");
              return node;
            },
            show(button = null) {
              const node = launcher.feed.motion.travel.icon(button);
              if (!node) return false;
              node.style.removeProperty("opacity");
              return true;
            },
            clone(button = null) {
              const node = launcher.feed.motion.travel.icon(button);
              if (!node) return null;
              const rect = node.getBoundingClientRect();
              const width = node.offsetWidth || rect.width;
              const height = node.offsetHeight || rect.height;
              const left = rect.left + (rect.width - width) / 2;
              const top = rect.top + (rect.height - height) / 2;
              const style = window.getComputedStyle(node);
              const clone = document.createElement("span");
              const face = node.querySelector(".launchpad-back-face-default");
              clone.classList.add("launchpad-travel-ghost");
              clone.innerHTML = face ? face.innerHTML : node.innerHTML;
              clone.style.position = "fixed";
              clone.style.left = `${left}px`;
              clone.style.top = `${top}px`;
              clone.style.width = `${width}px`;
              clone.style.height = `${height}px`;
              clone.style.minWidth = `${width}px`;
              clone.style.minHeight = `${height}px`;
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
              launcher.feed.motion.travel.hide(source);
              const panelRect = launcher.resize?.rect?.(panel) || null;
              const snapshot = launcher.feed.motion.travel.snapshot(panel);
              const previous = launcher.feed.railMotion.visuals(snapshot);
              panel.dataset.feedTraveling = "true";
              panel.dataset.feedTravelPhase = "fade";
              if (snapshot) {
                panel.style.setProperty("visibility", "hidden");
              }
              const fadeOut = launcher.feed.railMotion.fade(previous, "out", {
                duration: launcher.feed.motion.travel.duration(),
              });
              apply();
              launcher.render();
              const targetButton = launcher.feed.motion.travel.button(value.id);
              const targetVisual = launcher.feed.motion.travel.hide(targetButton);
              const visuals = launcher.feed.railMotion.conceal(
                launcher.feed.railMotion.visuals(panel),
              );
              const fadingVisuals = visuals.filter((node) => node !== targetVisual);
              const layoutReady = new Promise((resolve) => {
                requestAnimationFrame(() => requestAnimationFrame(resolve));
              });
              fadeOut.finally(() => null);
              layoutReady.then(() => {
                const target = launcher.feed.motion.travel.rect(targetButton);
                if (!target) {
                  visuals.forEach((node) => node.style.removeProperty("opacity"));
                  panel.style.removeProperty("visibility");
                  snapshot?.remove();
                  ghost.remove();
                  delete panel.dataset.feedTraveling;
                  delete panel.dataset.feedTravelPhase;
                  launcher.render();
                  return;
                }
                const ghostRect = ghost.getBoundingClientRect();
                const centerX = ghostRect.left + ghostRect.width / 2;
                const centerY = ghostRect.top + ghostRect.height / 2;
                const start = {
                  left: centerX - target.width / 2,
                  top: centerY - target.height / 2,
                  width: target.width,
                  height: target.height,
                };
                ghost.style.left = `${start.left}px`;
                ghost.style.top = `${start.top}px`;
                ghost.style.width = `${start.width}px`;
                ghost.style.height = `${start.height}px`;
                ghost.style.minWidth = `${start.width}px`;
                ghost.style.minHeight = `${start.height}px`;
                const dx = target.left - start.left;
                const dy = target.top - start.top;
                const turns = launcher.feed.motion.travel.turns(start, target);
                const sign = value.direction === "exit" ? 1 : -1;
                const rotate = `${sign * turns * 360}deg`;
                const transform = `translate(${dx}px, ${dy}px) rotate(${rotate})`;
                let settled = false;
                const done = () => {
                  if (settled) return;
                  settled = true;
                  launcher.feed.motion.travel.show(targetButton);
                  ghost.remove();
                  delete panel.dataset.feedTraveling;
                  delete panel.dataset.feedTravelPhase;
                };
                const land = (animation = null) => {
                  const finalTarget = launcher.feed.motion.travel.rect(targetButton);
                  const currentRect = ghost.getBoundingClientRect();
                  if (!finalTarget || !currentRect.width || !currentRect.height) {
                    done();
                    return;
                  }
                  const currentStyle = window.getComputedStyle(ghost);
                  const landing = ghost.animate(
                    [
                      {
                        left: `${parseFloat(currentStyle.left) || start.left}px`,
                        top: `${parseFloat(currentStyle.top) || start.top}px`,
                        width: `${parseFloat(currentStyle.width) || start.width}px`,
                        height: `${parseFloat(currentStyle.height) || start.height}px`,
                        transform: currentStyle.transform === "none"
                          ? "none"
                          : currentStyle.transform,
                      },
                      {
                        left: `${finalTarget.left}px`,
                        top: `${finalTarget.top}px`,
                        width: `${finalTarget.width}px`,
                        height: `${finalTarget.height}px`,
                        transform: "none",
                      },
                    ],
                    {
                      duration: launcher.feed.motion.travel.settleDuration(),
                      easing: "cubic-bezier(.18,.72,.24,1)",
                      fill: "both",
                    },
                  );
                  animation?.cancel?.();
                  landing.onfinish = done;
                  landing.oncancel = done;
                };
                delete panel.dataset.feedTraveling;
                launcher.resize?.run?.(panel, panelRect, { position: false });
                panel.dataset.feedTraveling = "true";
                panel.dataset.feedTravelPhase = "move";
                panel.style.removeProperty("visibility");
                snapshot?.remove();
                requestAnimationFrame(() => {
                  const duration = Math.max(
                    launcher.feed.motion.travel.duration(),
                    launcher.resize?.duration?.(panel) || 0,
                  );
                  launcher.feed.railMotion.fade(fadingVisuals, "in", {
                    duration,
                  }).finally(() => {
                    fadingVisuals.forEach((node) => {
                      node.style.removeProperty("opacity");
                    });
                  });
                  const animation = ghost.animate(
                    [
                      {
                        opacity: 1,
                        transform: "translate(0, 0) rotate(0deg)",
                      },
                      { opacity: 1, transform },
                    ],
                    {
                      duration,
                      easing: "cubic-bezier(.2,.72,.24,1)",
                      fill: "both",
                    },
                  );
                  animation.onfinish = () => land(animation);
                  animation.oncancel = done;
                });
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
        toolboxMotion() {
          return String(launcher.state.feed.toolboxMotion || "");
        },
        toolboxSpinMotion() {
          return String(launcher.state.feed.toolboxSpinMotion || "");
        },
        inlineMotion(id = "") {
          if (id === "pinned") {
            return launcher.feed.pinnedSpinMotion();
          }
          if (id === "toolbox") {
            return launcher.feed.toolboxSpinMotion();
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
        railMotion: {
          visuals(root = null) {
            if (!root) return [];
            const rail = root.matches?.(".ui-line")
              ? root
              : root.querySelector?.(".ui-line");
            if (!rail) return [];
            const selector = [
              ".ui-icon-box",
              ".toolbar-icon-box",
              ".toolbar-media-box",
              ".toolbar-logo",
              ".launchpad-scenario-icon",
              "[data-separator-mode]",
            ].join(",");
            return Array.from(rail.querySelectorAll(selector)).filter((node) => (
              !node.parentElement?.closest?.(selector) &&
              !node.closest('[data-ui-cluster]') &&
              !node.closest('[data-ui-role="marker"]')
            ));
          },
          overlay(panel = null) {
            const rail = panel?.querySelector?.(".ui-line");
            if (!panel || !rail) return null;
            const panelRect = panel.getBoundingClientRect();
            const railRect = rail.getBoundingClientRect();
            const clone = rail.cloneNode(true);
            clone.removeAttribute("id");
            clone.setAttribute("aria-hidden", "true");
            clone.dataset.launchpadRailOverlay = "true";
            clone.style.setProperty("position", "absolute", "important");
            clone.style.setProperty(
              "left",
              `${railRect.left - panelRect.left}px`,
              "important",
            );
            clone.style.setProperty(
              "top",
              `${railRect.top - panelRect.top}px`,
              "important",
            );
            clone.style.setProperty("width", `${railRect.width}px`, "important");
            clone.style.setProperty("height", `${railRect.height}px`, "important");
            clone.style.setProperty("margin", "0", "important");
            clone.style.setProperty("pointer-events", "none", "important");
            clone.style.setProperty("z-index", "2", "important");
            clone.style.setProperty("background", "transparent", "important");
            clone.style.setProperty("border-color", "transparent", "important");
            clone.style.setProperty("box-shadow", "none", "important");
            clone.querySelectorAll("[id]").forEach((node) => {
              node.removeAttribute("id");
            });
            panel.appendChild(clone);
            return clone;
          },
          conceal(nodes = []) {
            return launcher.feed.motion.conceal(nodes);
          },
          fade(nodes = [], direction = "out", options = {}) {
            return launcher.feed.motion.fade(nodes, direction, options);
          },
          clear(node = null) {
            node?.remove?.();
            return true;
          },
        },
        swapMarker(change = null) {
          if (launcher.state.feed.markerTransitioning) return false;
          const panel = launcher.node?.panel?.();
          const resizeFrom = launcher.resize?.rect?.(panel);
          const current = launcher.feed.markerVisual();
          const previous = launcher.feed.railMotion.visuals(panel);
          const render = () => {
            const snapshot = panel && resizeFrom
              ? launcher.feed.motion.travel.snapshot(panel)
              : null;
            if (snapshot) {
              launcher.feed.railMotion.conceal(
                launcher.feed.railMotion.visuals(snapshot),
              );
              panel.style.setProperty("visibility", "hidden");
            }
            change?.();
            launcher.render({ place: true, resize: false });
            const visuals = launcher.feed.railMotion.conceal(
              launcher.feed.railMotion.visuals(panel),
            );
            if (!panel || !resizeFrom) {
              snapshot?.remove();
              visuals.forEach((node) => node.style.removeProperty("opacity"));
              return;
            }
            window.requestAnimationFrame(() => {
              window.requestAnimationFrame(() => {
                launcher.resize?.run?.(panel, resizeFrom, { position: false });
                const duration = Math.max(
                  launcher.resize?.duration?.(panel) || 0,
                  launcher.feed.motionDuration("marker", "enter"),
                );
                panel.style.removeProperty("visibility");
                snapshot?.remove();
                launcher.feed.railMotion.fade(visuals, "in", {
                  duration,
                }).finally(() => {
                  visuals.forEach((node) => node.style.removeProperty("opacity"));
                });
              });
            });
          };
          if (!current) {
            render();
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
            render();
            enter();
          };
          const duration = launcher.feed.motionDuration("marker", "exit");
          const fade = launcher.feed.railMotion.fade(previous, "out", {
            duration,
          });
          const animation = launcher.feed.markerAnimation(current, "exit");
          if (!animation) {
            fade.then(swap).catch(swap);
            return true;
          }
          Promise.all([
            animation.finished.catch(() => null),
            fade,
          ]).then(swap).catch(() => {
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
        syncToolbox(value = "") {
          launcher.state.feed.toolboxMotion = String(value || "");
          return launcher.feed.toolboxMotion();
        },
        syncToolboxSpin(value = "") {
          launcher.state.feed.toolboxSpinMotion = String(value || "");
          return launcher.feed.toolboxSpinMotion();
        },
        motionDuration(id = "", motion = "") {
          if (id === "marker" && motion === "exit") return 880;
          if (id === "marker" && motion === "enter") return 880;
          if (id === "marker") return 880;
          if (id === "spin") {
            const panel = launcher.node?.panel?.();
            return Math.round(
              launcher.resize?.token?.(
                panel,
                "--surface-launchpad-click-spin-duration",
                480,
              ) || 480,
            );
          }
          if (id === "resize") return 480;
          if (id === "group" && motion === "enter") return 480;
          if (id === "pinned") {
            const panel = launcher.node?.panel?.();
            return Math.round(
              launcher.resize?.token?.(
                panel,
                "--surface-launchpad-pinned-motion-duration",
                320,
              ) || 320,
            );
          }
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
            if (render) launcher.render({ place: true, resize: false });
            else launcher.feed.syncPinnedSpinDom();
          }, launcher.feed.motionDuration("spin"));
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
        settlePinnedDom() {
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
          const size = launcher.feed.pinnedSize(popover, group);
          launcher.feed.syncPinned("");
          launcher.feed.syncPinnedSpin("");
          group.dataset.pinnedMotion = "";
          delete group.dataset.pinnedReady;
          if (popover) {
            popover.style.setProperty(
              "--surface-launchpad-pinned-popover-width",
              `${size.width}px`,
            );
            popover.style.setProperty(
              "--surface-launchpad-pinned-popover-height",
              `${size.height}px`,
            );
            popover.dataset.pinnedMotion = "";
            delete popover.dataset.pinnedReady;
          }
          if (button) delete button.dataset.inlineMotion;
          return true;
        },
        settlePinned() {
          if (launcher.state.feed.pinnedTimer) {
            window.clearTimeout(launcher.state.feed.pinnedTimer);
          }
          if (launcher.state.feed.pinnedSpinTimer) {
            window.clearTimeout(launcher.state.feed.pinnedSpinTimer);
          }
          launcher.state.feed.pinnedTimer = 0;
          launcher.state.feed.pinnedSpinTimer = 0;
          return launcher.feed.settlePinnedDom();
        },
        collapsePinned() {
          launcher.feed.settlePinned();
          launcher.state.feed.group = "";
          launcher.render({ place: false, resize: false });
          return launcher.state.feed.group;
        },
        toolboxClearLater(render = false) {
          if (launcher.state.feed.toolboxTimer) {
            window.clearTimeout(launcher.state.feed.toolboxTimer);
          }
          launcher.state.feed.toolboxTimer = window.setTimeout(() => {
            launcher.feed.syncToolbox("");
            launcher.state.feed.toolboxTimer = 0;
            if (render) launcher.render({ place: true, resize: false });
          }, launcher.feed.motionDuration("pinned", launcher.feed.toolboxMotion()));
        },
        toolboxSpinClearLater(render = false) {
          if (launcher.state.feed.toolboxSpinTimer) {
            window.clearTimeout(launcher.state.feed.toolboxSpinTimer);
          }
          launcher.state.feed.toolboxSpinTimer = window.setTimeout(() => {
            launcher.feed.syncToolboxSpin("");
            launcher.state.feed.toolboxSpinTimer = 0;
            if (render) launcher.render({ place: true, resize: false });
            else launcher.feed.syncToolboxSpinDom();
          }, launcher.feed.motionDuration("spin"));
        },
        syncToolboxSpinDom() {
          const panel = launcher.node?.panel?.();
          if (!panel) return false;
          const button = panel.querySelector(
            '[data-action="group"][data-id="toolbox"]',
          );
          if (!button) return false;
          const motion = launcher.feed.inlineMotion("toolbox");
          if (motion) button.dataset.inlineMotion = motion;
          else delete button.dataset.inlineMotion;
          return true;
        },
        syncToolboxDom() {
          const panel = launcher.node?.panel?.();
          if (!panel) return false;
          const group = panel.querySelector(
            '[data-launchpad-group="true"][data-group-id="toolbox"]',
          );
          if (!group) return false;
          const button = group.querySelector(
            '[data-action="group"][data-id="toolbox"]',
          );
          const popover = group.querySelector('[data-pinned-popover="true"]');
          const motion = launcher.feed.toolboxMotion();
          const size = launcher.feed.pinnedSize(popover, group);
          group.dataset.groupMotion = "";
          group.dataset.groupShellMotion = "";
          group.dataset.pinnedMotion = "";
          delete group.dataset.pinnedReady;
          if (popover) {
            popover.style.setProperty(
              "--surface-launchpad-pinned-popover-width",
              `${size.width}px`,
            );
            popover.style.setProperty(
              "--surface-launchpad-pinned-popover-height",
              `${size.height}px`,
            );
            popover.dataset.pinnedMotion = "";
            delete popover.dataset.pinnedReady;
          }
          if (button) delete button.dataset.inlineMotion;
          group.offsetWidth;
          group.dataset.pinnedMotion = motion;
          group.dataset.pinnedReady = "true";
          group.dataset.expanded = "true";
          if (popover) {
            popover.dataset.pinnedMotion = motion;
            popover.dataset.pinnedReady = "true";
          }
          if (button) {
            button.classList.toggle("is-active", motion !== "exit");
            const inlineMotion = launcher.feed.toolboxSpinMotion();
            if (inlineMotion) button.dataset.inlineMotion = inlineMotion;
            else delete button.dataset.inlineMotion;
          }
          return true;
        },
        pinnedSize(popover, group = null) {
          if (!popover) return { width: 0, height: 0 };
          const panel = launcher.node?.panel?.();
          const panelRect = panel?.getBoundingClientRect?.() || null;
          const groupRect = group?.getBoundingClientRect?.() || null;
          const vertical = Boolean(
            panelRect && panelRect.height > panelRect.width,
          );
          const clone = popover.cloneNode(true);
          clone.dataset.pinnedMotion = "";
          clone.style.cssText = [
            "position:fixed",
            "left:-10000px",
            "top:-10000px",
            vertical && groupRect?.width
              ? `width:${groupRect.width}px`
              : "width:max-content",
            "height:max-content",
            "max-width:none",
            "max-height:none",
            "flex:none",
            "animation:none",
            "visibility:hidden",
            "pointer-events:none",
          ].join(";");
          (panel || document.body).appendChild(clone);
          const rect = clone.getBoundingClientRect();
          clone.remove();
          return {
            width: Math.ceil(rect.width),
            height: Math.ceil(rect.height),
          };
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
          const size = launcher.feed.pinnedSize(popover, group);
          group.dataset.groupMotion = "";
          group.dataset.groupShellMotion = "";
          group.dataset.pinnedMotion = "";
          delete group.dataset.pinnedReady;
          if (popover) {
            popover.style.setProperty(
              "--surface-launchpad-pinned-popover-width",
              `${size.width}px`,
            );
            popover.style.setProperty(
              "--surface-launchpad-pinned-popover-height",
              `${size.height}px`,
            );
            popover.dataset.pinnedMotion = "";
            delete popover.dataset.pinnedReady;
          }
          if (button) {
            delete button.dataset.inlineMotion;
          }
          group.offsetWidth;
          group.dataset.groupMotion = "";
          group.dataset.groupShellMotion = "";
          group.dataset.pinnedMotion = motion;
          group.dataset.pinnedReady = "true";
          group.dataset.expanded = "true";
          if (popover) {
            popover.dataset.pinnedMotion = motion;
            popover.dataset.pinnedReady = "true";
          }
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
          const pinned = launcher.state.feed.group === "pinned";
          launcher.state.feed.group = pinned ? "pinned" : "";
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
          launcher.state.feed.toolboxMotion = "";
          if (launcher.state.feed.toolboxTimer) {
            window.clearTimeout(launcher.state.feed.toolboxTimer);
          }
          launcher.state.feed.toolboxTimer = 0;
          launcher.state.feed.toolboxSpinMotion = "";
          if (launcher.state.feed.toolboxSpinTimer) {
            window.clearTimeout(launcher.state.feed.toolboxSpinTimer);
          }
          launcher.state.feed.toolboxSpinTimer = 0;
          launcher.state.feed.toolboxTransitioning = false;
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
        runPinnedMotion(motion = "", render = false) {
          launcher.feed.syncPinned(motion);
          launcher.feed.syncPinnedDom();
          launcher.feed.pinnedClearLater(false);
          launcher.feed.pinnedSpinClearLater(render);
          return motion;
        },
        pinnedShow() {
          if (launcher.state.feed.pinnedTimer) {
            window.clearTimeout(launcher.state.feed.pinnedTimer);
          }
          launcher.state.feed.pinnedTimer = 0;
          launcher.resize?.clear?.(launcher.node?.panel?.());
          launcher.feed.roadmap(false);
          launcher.state.feed.group = "pinned";
          launcher.feed.syncPinned("enter");
          launcher.feed.syncPinnedSpin("enter");
          window.requestAnimationFrame(() => {
            launcher.feed.runPinnedMotion("enter");
          });
          return launcher.state.feed.group;
        },
        pinnedHide() {
          if (launcher.state.feed.pinnedTimer) {
            window.clearTimeout(launcher.state.feed.pinnedTimer);
          }
          launcher.state.feed.group = "";
          launcher.feed.syncPinnedSpin("exit");
          launcher.feed.runPinnedMotion("exit", true);
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
            return launcher.feed.toolbox()
              ? launcher.feed.toolboxHide()
              : launcher.feed.toolboxShow();
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
        toolboxShow() {
          if (launcher.state.feed.toolboxTimer) {
            window.clearTimeout(launcher.state.feed.toolboxTimer);
          }
          launcher.state.feed.toolboxTimer = 0;
          launcher.feed.toolbox(true);
          launcher.state.feed.group = "";
          launcher.state.feed.groupMotion = "";
          launcher.state.feed.groupMotionId = "";
          launcher.feed.syncToolbox("enter");
          launcher.feed.syncToolboxSpin("");
          launcher.render({ place: true, resize: false });
          window.requestAnimationFrame(() => {
            launcher.feed.syncToolboxSpin("enter");
            launcher.feed.syncToolboxDom();
            launcher.feed.toolboxClearLater(false);
            launcher.feed.toolboxSpinClearLater(false);
          });
          return launcher.feed.toolbox();
        },
        toolboxHide() {
          if (launcher.state.feed.toolboxTimer) {
            window.clearTimeout(launcher.state.feed.toolboxTimer);
          }
          launcher.feed.toolbox(false);
          launcher.state.feed.group = null;
          launcher.state.feed.groupMotion = "";
          launcher.state.feed.groupMotionId = "";
          launcher.feed.syncToolbox("exit");
          launcher.feed.syncToolboxSpin("exit");
          launcher.feed.syncToolboxDom();
          launcher.feed.toolboxClearLater(false);
          launcher.feed.toolboxSpinClearLater(true);
          return launcher.feed.toolbox();
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
            title: `${meta.title} \u00B7 Назад`,
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
            const groups = snapshot.toolboxGroups || snapshot.groups;
            return launcher.feed.toolbox() && launcher.feed.focusedGroup(groups)
              ? "superuser-toolbox-focused"
              : "superuser-top";
          }
          return launcher.feed.focusedGroup(snapshot.groups)
            ? "normal-focused"
            : "normal";
        },
        html(snapshot) {
          const current = launcher.view.current(snapshot);
          if (current === "superuser-top") {
            return launcher.htmlSuperuser(
              snapshot.toolboxGroups || snapshot.groups,
            );
          }
          if (current === "superuser-toolbox-focused") {
            return launcher.htmlFocused(
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
            title: "Журналист",
            emoji: "shark",
          },
          {
            id: "editors",
            title: "Корректор",
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
        const inlineMotion = launcher.feed.inlineMotionAttr("toolbox");
        return ui.controls.button({
          content: launcher.icon(launcher.feed.meta({ id: "toolbox" }).icon),
          action: "group",
          title: "Тулбокс",
          classes: launcher.feed.toolbox() ? "is-active" : "",
          attrs: ` data-id="toolbox" type="button"${inlineMotion}`,
        });
      },
      htmlToolbox(groups = []) {
        const motion = launcher.feed.toolboxMotion();
        const expanded = launcher.feed.toolbox() || motion === "exit";
        const head = `<span class="launchpad-tool-group-head" data-launchpad-group-head="true">${launcher.htmlToolboxControl()}</span>`;
        if (!expanded) return head;
        const popover = `<span data-pinned-popover="true" data-pinned-motion="${motion}">${launcher.htmlToolboxGroups(groups)}</span>`;
        return ui.shell.strip(`${head}${popover}`, {
          classes: "launchpad-tool-group",
          attrs: ` data-launchpad-group="true" data-group-id="toolbox" data-expanded="true" data-group-motion="" data-group-shell-motion="" data-pinned-motion="${motion}"`,
        });
      },
      htmlSuperuser(groups = []) {
        const separator = ui.controls.separator({
          attrs: ' data-separator-mode="dot"',
        });
        return `${launcher.htmlToolbox(groups)}${separator}${launcher.htmlRoleChoice()}`;
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
          `${ui.controls.button({ content: icon.emoji(toolbar.appearance.themeToggleIcon(theme)), action: "theme", title: "Тема", attrs: ' type="button" aria-label="Тема" data-theme-icon="auto" data-theme-scope="launcher"' })}${ui.controls.button({ content: icon.emoji("cross-mark"), action: "close", title: "Выход", attrs: ' type="button" aria-label="Выход"' })}`,
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

export { launchpadFeed, launchpadMotion };
