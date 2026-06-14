export const design = {
  ui: {
    fontSize: "13px",
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
    lineHeight: "1.35",
    text: "#111",
    background: "#fff",
    border: "#ccd0d4",
    shadow: "0 6px 24px #00000033",
    focusRingColor: "#aac7ff",
    flashGreenBackground: "#dff5e6",
    flashBlueBackground: "#dcecff",
    flashRedBackground: "#ffe1e1",
  },
  panel: {
    radius: "12px",
    pad: "calc(var(--panel-font-size) * 0.75)",
    rowGap: "calc(var(--panel-font-size) * 0.45)",
  },
  control: {
    height: "calc(var(--control-font-size) * 2.3)",
    radius: "calc(var(--control-font-size) * 0.34)",
    gap: "calc(var(--control-font-size) * 0.75)",
    padX: "calc(var(--control-font-size) * 0.8)",
    border: "1px solid #d2d2d2",
    background: "transparent",
    backgroundHover: "#f3f4f6",
    backgroundActive: "#e7ebf0",
    focusRing: "0 0 0 2px var(--control-focus-ring-color)",
  },
  surface: {
    spacing: {
      inset: 8,
    },
    neutral: {
      light: {
        primary: "rgba(18, 20, 24, 0.92)",
        secondary: "rgba(245, 247, 250, 0.98)",
        tertiary: "rgba(22, 27, 34, 0.18)",
      },
      dark: {
        primary: "rgba(242, 245, 250, 0.94)",
        secondary: "rgba(58, 64, 72, 0.72)",
        tertiary: "rgba(255, 255, 255, 0.18)",
      },
    },
    reader: {
      buttonSize: "42px",
      buttonPaddingX: "0",
      buttonOpacity: ".82",
      buttonActiveScale: ".96",
      layout: {
        phoneMaxShortEdge: 768,
        topDesktop: 80,
        topTouchBase: 22,
        topTouchFade: 18,
        sideTouch: 16,
        sideDesktop: 12,
        bottomDesktop: 38,
        bottomTouch: 86,
        panelTouchHeight: 52,
        panelDesktopHeight: 64,
        panelInset: 12,
        keyboardOpenThreshold: 80,
        fontMinDesktop: 16,
        fontMinTablet: 12,
        fontMinPhone: 11,
        fontMax: 22,
      },
      auto: {
        topRatio: 0.2,
        bottomRatio: 0.75,
        keyboardBottomShift: 0.35,
        keyboardBottomMax: 0.32,
        minBottomGap: 0.25,
        minAim: 8,
        durationMin: 280,
        durationMax: 520,
        durationRatio: 0.55,
        deadzoneLineRatio: 1.15,
        deadzoneViewportRatio: 0.045,
        deadzoneParagraphRatio: 0.35,
        shiftBase: 0.34,
        shiftGain: 0.46,
        smartShiftBoost: 0.55,
      },
      palette: {
        lightBackground: "#fff",
        lightText: "#111",
        lightFade: "rgba(255,255,255,0)",
        lightShade: "rgba(255,255,255,.92)",
        lightShadow: "rgba(255,255,255,.55)",
        darkBackground: "#111",
        darkTextMain: "#f2f2f2",
        darkFade: "rgba(17,17,17,0)",
        darkShade: "rgba(17,17,17,.92)",
        darkShadow: "rgba(17,17,17,.55)",
      },
      fade: {
        topHeight: 100,
        bottomHeight: 60,
        stopSolid: 22,
        stopShade: 54,
        stopShadow: 78,
      },
      css: {
        contentPadding: 16,
        contentFontSize: 18,
        contentLineHeight: 1.45,
        panelGap: 6,
        shellGap: 8,
      },
      darkText: "rgba(255,255,255,.94)",
      darkBg: "transparent",
      darkBgHover: "rgba(255,255,255,.24)",
      darkBorderHover: "rgba(255,255,255,.14)",
      lightText: "rgba(0,0,0,.82)",
      lightBg: "transparent",
      lightBgHover: "rgba(0,0,0,.18)",
      lightBorderHover: "rgba(0,0,0,.08)",
    },
    toolbar: {
      buttonSize: "32px",
      buttonPaddingX: "9px",
      buttonOpacity: ".78",
      emojiOpacity: "1",
      buttonActiveScale: ".96",
      groupGapBase: 6,
      iconGapBase: 8,
      unifiedPadX: 8,
      linePadBase: 6,
      iconBoxRadius: "14px",
      railPillMainExtra: 16,
      railPillCrossExtra: 10,
      capsuleMaxViewportGap: 28,
      glyphFilterDark: "brightness(0) invert(0.88)",
      glyphFilterDarkActive: "brightness(0) invert(1)",
      glyphFilterLight: "none",
      glyphFilterLightActive: "brightness(0) contrast(1.35)",
      activeBgDark: "rgba(255, 255, 255, 0.16)",
      activeRingDark: "rgba(255, 255, 255, 0.36)",
      activeBgLight: "rgba(0, 0, 0, 0.09)",
      activeRingLight: "rgba(0, 0, 0, 0.22)",
      buttonActiveHintDark: "rgb(76, 76, 76)",
      buttonActiveHintLight: "rgba(0, 0, 0, 0.13)",
      groupBgDark: "rgb(76, 76, 76)",
      groupBgLight: "rgb(255, 255, 255)",
      groupBorderDark: "rgba(255, 255, 255, 0.38)",
      groupBorderLight: "rgba(0, 0, 0, 0.2)",
      capsuleTextDark: "rgba(255, 255, 255, 0.96)",
      capsuleTextLight: "rgba(0, 0, 0, 0.86)",
      glyphShadowDark:
        "drop-shadow(0 0 1px rgba(255, 255, 255, 0.62)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.34))",
      glyphShadowLight:
        "drop-shadow(0 0 1px rgba(0, 0, 0, 0.52)) drop-shadow(0 0 4px rgba(0, 0, 0, 0.3))",
      rail: {
        scale: 1,
        padY: 8,
        padX: 8,
        pill: 5,
        inset: 6,
        barPadY: 8,
        barPadX: 10,
        sideSize: 64,
        sidePadY: 8,
        sidePadX: 10,
        gap: 8,
        dockSnap: 88,
        dockMargin: 12,
        dockEdge: 12,
        snap: 96,
        snapTop: 96,
        snapBottom: 60,
      },
      metric: {
        touchBottom: "calc(env(safe-area-inset-bottom) + 60px)",
        desktopBottom: "60px",
        keyboardTop: "calc(env(safe-area-inset-top) + 80px)",
      },
      hint: {
        radius: "14px",
        startOpacity: "0",
        startScale: "0.985",
        transition:
          "opacity 0.12s ease, top 0.14s ease, left 0.14s ease, width 0.14s ease, height 0.14s ease, transform 0.14s ease",
        backdrop: "blur(2px)",
        darkBackground: "rgba(255, 255, 255, 0.13)",
        darkBorder: "1px solid rgba(255, 255, 255, 0.32)",
        darkShadow:
          "0 0 0 1px rgba(255,255,255,0.08) inset, 0 0 12px rgba(0, 0, 0, 0.22)",
        lightBackground: "rgba(0, 0, 0, 0.07)",
        lightBorder: "1px solid rgba(0, 0, 0, 0.2)",
        lightShadow:
          "0 0 0 1px rgba(255,255,255,0.45) inset, 0 0 12px rgba(0, 0, 0, 0.14)",
      },
      darkText: "rgba(255,255,255,.94)",
      darkBgHover: "rgba(255,255,255,.12)",
      darkBorderHover: "rgba(255,255,255,.14)",
      lightText: "rgba(0,0,0,.82)",
      lightBgHover: "rgba(0,0,0,.07)",
      lightBorderHover: "rgba(0,0,0,.08)",
      glassBackdrop: "blur(26px) saturate(1.6)",
      darkPanelBg: "rgba(34,34,34,.46)",
      darkPanelBorder: "rgba(255,255,255,.14)",
      darkPanelShadow: "inset 0 1px 0 rgba(255,255,255,.10), 0 12px 36px rgba(0,0,0,.34)",
      lightPanelBg: "rgba(255,255,255,.48)",
      lightPanelBorder: "rgba(0,0,0,.10)",
      lightPanelShadow: "inset 0 1px 0 rgba(255,255,255,.82), 0 10px 30px rgba(0,0,0,.06)",
    },
    proofread: {
      lightRowBorder: "#ddd",
      lightRowBackground: "rgba(255, 255, 255, 0.08)",
      lightActiveBackground: "#fff7cc",
      lightEmptyText: "#666",
      darkRowBorder: "rgba(255,255,255,.14)",
      darkRowBackground: "rgba(255, 255, 255, 0.04)",
      darkActiveBackground: "rgba(230,184,0,.24)",
      darkEmptyText: "rgba(255,255,255,.68)",
      focusRingLight: "rgba(0, 0, 0, 0.14)",
      focusRingDark: "rgba(255, 255, 255, 0.22)",
      inlinePad: 12,
      rowPadY: 5,
      rowGap: 8,
      rowStackGap: 4,
      rowFontSize: 16,
      viewportGap: 12,
      rowRadius: 22,
      listRadius: 22,
      wordWidth: 128,
      wordMinWidth: 88,
      wordTouchMinWidth: 72,
      fieldMinWidth: 104,
      fieldTouchMinWidth: 96,
      sourceWidth: 52,
    },
    diff: {
      panelWidth: 248,
      panelPad: 10,
      panelBottom: 16,
      panelRight: 16,
      panelGap: 8,
      statMinWidth: 68,
      inlineGap: 8,
      inlinePad: 10,
      inlineMarginY: 12,
      inlineRadius: 12,
      linePadY: 7,
      linePadX: 10,
      lineGap: 6,
      markerWidth: 4,
      monoFont:
        'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
      lightCanvasBackground: "rgb(255, 255, 255)",
      lightPanelBackground: "rgba(255, 255, 255, 0.92)",
      lightPanelBorder: "rgba(0, 0, 0, 0.14)",
      lightPanelText: "rgba(0, 0, 0, 0.86)",
      lightBoxBackground: "rgba(255, 255, 255, 0.96)",
      lightLineBackground: "rgba(0, 0, 0, 0.035)",
      lightContextBackground: "rgba(0, 0, 0, 0.025)",
      lightAddBackground: "rgba(42, 170, 82, 0.16)",
      lightAddAccent: "rgba(42, 170, 82, 0.82)",
      lightDelBackground: "rgba(216, 66, 66, 0.15)",
      lightDelAccent: "rgba(216, 66, 66, 0.78)",
      lightChangeBackground: "rgba(224, 168, 38, 0.16)",
      lightChangeAccent: "rgba(210, 145, 28, 0.82)",
      lightCodeBackground: "rgba(0, 0, 0, 0.045)",
      darkCanvasBackground: "rgb(17, 17, 17)",
      darkPanelBackground: "rgba(34, 34, 34, 0.72)",
      darkPanelBorder: "rgba(255, 255, 255, 0.18)",
      darkPanelText: "rgba(255, 255, 255, 0.92)",
      darkBoxBackground: "rgba(24, 24, 24, 0.94)",
      darkLineBackground: "rgba(255, 255, 255, 0.06)",
      darkContextBackground: "rgba(255, 255, 255, 0.045)",
      darkAddBackground: "rgba(75, 196, 112, 0.2)",
      darkAddAccent: "rgba(105, 230, 140, 0.9)",
      darkDelBackground: "rgba(255, 101, 101, 0.18)",
      darkDelAccent: "rgba(255, 135, 135, 0.9)",
      darkChangeBackground: "rgba(245, 184, 72, 0.18)",
      darkChangeAccent: "rgba(255, 211, 104, 0.92)",
      darkCodeBackground: "rgba(255, 255, 255, 0.08)",
    },
    popup: {
      overlayBackground: "rgba(8,10,14,.42)",
      overlayBlur: "blur(4px)",
      overlayPad: 20,
      mobileOverlayPad: 12,
      panelPad: 16,
      panelMaxWidth: 720,
      panelMaxHeight: 88,
      panelMobileMaxWidth: 760,
      panelMobileMaxHeight: 86,
      navGap: 8,
      navMarginBottom: 12,
      navLabelMinHeight: 40,
      navLabelPadX: 12,
      rowGap: 8,
      headMarginBottom: 12,
      fieldMinHeight: 136,
      fieldRadius: 12,
      fieldPadY: 10,
      fieldPadX: 12,
      actionsMinWidth: 88,
      fieldResize: "none",
      fieldFocusShadow: "none",
      fieldLightBackground: "#fff",
      fieldDarkBackground: "rgba(14,14,14,.96)",
      counterOpacity: ".86",
      fontBoost: 5,
      rowMarginTop: 12,
      counterPadX: 10,
      counterMinHeight: 32,
      counterInset: 2,
      counterBaseBackground: "rgba(148,163,184,.22)",
      counterBaseBackgroundDark: "rgba(148,163,184,.18)",
      counterBaseBackgroundLight: "rgba(100,116,139,.16)",
      counterFillBackground:
        "linear-gradient(90deg,color-mix(in srgb, #4da3ff 28%, transparent) 0%,color-mix(in srgb, #2dd4bf 30%, transparent) 54%,color-mix(in srgb, #59d66f 32%, transparent) 100%)",
      counterOverflowBackground:
        "linear-gradient(90deg,color-mix(in srgb, #ff3d6e 30%, transparent) 0%,color-mix(in srgb, #ffd84d 34%, transparent) 100%)",
      counterOverBorder: "rgba(248,113,113,.7)",
    },
    progress: {
      height: 8,
      gapTop: 6,
      border: "#ccd0d4",
      track: "#f0f0f1",
      fill: "#2f7a45",
    },
    filter: {
      progressTop: 80,
      progressWidth: 240,
      panelPad: 10,
      panelBorder: "#ccd0d4",
      panelBackgroundLight: "#ffffff",
      panelBackgroundDark: "#2f3338",
      modalTop: 80,
      rowGap: 6,
      rowMarginTop: 6,
      rowMarginBottom: 4,
      separatorMarginTop: 8,
      separatorPadTop: 6,
      periodMinWidth: 105,
      buttonMinHeight: 28,
      buttonMarginY: 3,
      buttonPadY: 2,
      buttonPadX: 8,
      currentBorder: "#2f7a45",
      currentBackground: "#e7f6eb",
      currentText: "#1f5f33",
      currentInset: "#b7dfc2",
    },
    frame: {
      capsuleRadius: "calc(var(--panel-radius) * 2.2)",
    },
  },
  page: {
    liftY: "-6px",
    liftScale: "1.02",
    navLiftY: "-2px",
    activeScale: "0.98",
  },
  root(value) {
    return `--${value[0]}: ${value[1]};`;
  },
  list(value) {
    return Object.entries(value)
      .map((entry) => design.root(entry))
      .join("\n    ");
  },
  run() {
    const ui = {
      "ui-font-size": design.ui.fontSize,
      "ui-font-family": design.ui.fontFamily,
      "ui-line-height": design.ui.lineHeight,
      "ui-text": design.ui.text,
      "ui-background": design.ui.background,
      "ui-border": design.ui.border,
      "ui-shadow": design.ui.shadow,
      "ui-focus-ring-color": design.ui.focusRingColor,
      "ui-flash-green-background": design.ui.flashGreenBackground,
      "ui-flash-blue-background": design.ui.flashBlueBackground,
      "ui-flash-red-background": design.ui.flashRedBackground,
    };
    const panel = {
      "panel-font-size": "var(--ui-font-size)",
      "panel-font-family": "var(--ui-font-family)",
      "panel-line-height": "var(--ui-line-height)",
      "panel-text": "var(--ui-text)",
      "panel-background": "var(--ui-background)",
      "panel-border": "var(--ui-border)",
      "panel-shadow": "var(--ui-shadow)",
      "panel-radius": design.panel.radius,
      "panel-pad": design.panel.pad,
      "panel-row-gap": design.panel.rowGap,
    };
    const control = {
      "control-font-size": "var(--ui-font-size)",
      "control-height": design.control.height,
      "control-radius": design.control.radius,
      "control-gap": design.control.gap,
      "control-pad-x": design.control.padX,
      "control-border": design.control.border,
      "control-background": design.control.background,
      "control-background-hover": design.control.backgroundHover,
      "control-background-active": design.control.backgroundActive,
      "control-focus-ring-color": "var(--ui-focus-ring-color)",
      "control-focus-ring": design.control.focusRing,
    };
    const flash = {
      "flash-green-background": "var(--ui-flash-green-background)",
      "flash-blue-background": "var(--ui-flash-blue-background)",
      "flash-red-background": "var(--ui-flash-red-background)",
    };
    const surface = {
      "surface-space-inset": `${design.surface.spacing.inset}px`,
      "surface-reader-button-size": design.surface.reader.buttonSize,
      "surface-reader-button-padding-x": design.surface.reader.buttonPaddingX,
      "surface-reader-button-opacity": design.surface.reader.buttonOpacity,
      "surface-reader-button-active-scale":
        design.surface.reader.buttonActiveScale,
      "surface-reader-palette-light-background":
        design.surface.reader.palette.lightBackground,
      "surface-reader-palette-light-text":
        design.surface.reader.palette.lightText,
      "surface-reader-palette-light-fade":
        design.surface.reader.palette.lightFade,
      "surface-reader-palette-light-shade":
        design.surface.reader.palette.lightShade,
      "surface-reader-palette-light-shadow":
        design.surface.reader.palette.lightShadow,
      "surface-reader-palette-dark-background":
        design.surface.reader.palette.darkBackground,
      "surface-reader-palette-dark-text":
        design.surface.reader.palette.darkTextMain,
      "surface-reader-palette-dark-fade":
        design.surface.reader.palette.darkFade,
      "surface-reader-palette-dark-shade":
        design.surface.reader.palette.darkShade,
      "surface-reader-palette-dark-shadow":
        design.surface.reader.palette.darkShadow,
      "surface-reader-fade-top-height":
        `${design.surface.reader.fade.topHeight}px`,
      "surface-reader-fade-bottom-height":
        `${design.surface.reader.fade.bottomHeight}px`,
      "surface-reader-fade-stop-solid":
        `${design.surface.reader.fade.stopSolid}%`,
      "surface-reader-fade-stop-shade":
        `${design.surface.reader.fade.stopShade}%`,
      "surface-reader-fade-stop-shadow":
        `${design.surface.reader.fade.stopShadow}%`,
      "surface-reader-css-content-padding":
        `${design.surface.reader.css.contentPadding}px`,
      "surface-reader-css-content-font-size":
        `${design.surface.reader.css.contentFontSize}px`,
      "surface-reader-css-content-line-height":
        String(design.surface.reader.css.contentLineHeight),
      "surface-reader-css-panel-gap":
        `${design.surface.reader.css.panelGap}px`,
      "surface-reader-css-shell-gap":
        `${design.surface.reader.css.shellGap}px`,
      "surface-reader-dark-text": design.surface.reader.darkText,
      "surface-reader-dark-bg": design.surface.reader.darkBg,
      "surface-reader-dark-bg-hover": design.surface.reader.darkBgHover,
      "surface-reader-dark-border-hover": design.surface.reader.darkBorderHover,
      "surface-reader-light-text": design.surface.reader.lightText,
      "surface-reader-light-bg": design.surface.reader.lightBg,
      "surface-reader-light-bg-hover": design.surface.reader.lightBgHover,
      "surface-reader-light-border-hover":
        design.surface.reader.lightBorderHover,
      "surface-toolbar-button-size": design.surface.toolbar.buttonSize,
      "surface-toolbar-button-padding-x":
        design.surface.toolbar.buttonPaddingX,
      "surface-toolbar-button-opacity": design.surface.toolbar.buttonOpacity,
      "surface-toolbar-emoji-opacity": design.surface.toolbar.emojiOpacity,
      "surface-toolbar-button-active-scale":
        design.surface.toolbar.buttonActiveScale,
      "surface-toolbar-group-gap-base":
        `${design.surface.toolbar.groupGapBase}px`,
      "surface-toolbar-icon-gap-base":
        `${design.surface.toolbar.iconGapBase}px`,
      "surface-toolbar-unified-pad-x":
        `${design.surface.toolbar.unifiedPadX}px`,
      "surface-toolbar-line-pad-base":
        `${design.surface.toolbar.linePadBase}px`,
      "surface-toolbar-icon-box-radius": design.surface.toolbar.iconBoxRadius,
      "surface-toolbar-rail-pill-main-extra":
        `${design.surface.toolbar.railPillMainExtra}px`,
      "surface-toolbar-rail-pill-cross-extra":
        `${design.surface.toolbar.railPillCrossExtra}px`,
      "surface-toolbar-capsule-max-viewport-gap":
        `${design.surface.toolbar.capsuleMaxViewportGap}px`,
      "surface-toolbar-glyph-filter-dark":
        design.surface.toolbar.glyphFilterDark,
      "surface-toolbar-glyph-filter-dark-active":
        design.surface.toolbar.glyphFilterDarkActive,
      "surface-toolbar-glyph-filter-light":
        design.surface.toolbar.glyphFilterLight,
      "surface-toolbar-glyph-filter-light-active":
        design.surface.toolbar.glyphFilterLightActive,
      "surface-toolbar-active-bg-dark": design.surface.toolbar.activeBgDark,
      "surface-toolbar-active-ring-dark": design.surface.toolbar.activeRingDark,
      "surface-toolbar-active-bg-light": design.surface.toolbar.activeBgLight,
      "surface-toolbar-active-ring-light":
        design.surface.toolbar.activeRingLight,
      "surface-toolbar-button-active-hint-dark":
        design.surface.toolbar.buttonActiveHintDark,
      "surface-toolbar-button-active-hint-light":
        design.surface.toolbar.buttonActiveHintLight,
      "surface-toolbar-group-bg-dark": design.surface.toolbar.groupBgDark,
      "surface-toolbar-group-bg-light": design.surface.toolbar.groupBgLight,
      "surface-toolbar-group-border-dark":
        design.surface.toolbar.groupBorderDark,
      "surface-toolbar-group-border-light":
        design.surface.toolbar.groupBorderLight,
      "surface-toolbar-capsule-text-dark":
        design.surface.toolbar.capsuleTextDark,
      "surface-toolbar-capsule-text-light":
        design.surface.toolbar.capsuleTextLight,
      "surface-toolbar-glyph-shadow-dark":
        design.surface.toolbar.glyphShadowDark,
      "surface-toolbar-glyph-shadow-light":
        design.surface.toolbar.glyphShadowLight,
      "surface-toolbar-rail-scale": String(design.surface.toolbar.rail.scale),
      "surface-toolbar-rail-pad-y": `${design.surface.toolbar.rail.padY}px`,
      "surface-toolbar-rail-pad-x": `${design.surface.toolbar.rail.padX}px`,
      "surface-toolbar-rail-pill": `${design.surface.toolbar.rail.pill}px`,
      "surface-toolbar-rail-inset": `${design.surface.toolbar.rail.inset}px`,
      "surface-toolbar-rail-bar-pad-y":
        `${design.surface.toolbar.rail.barPadY}px`,
      "surface-toolbar-rail-bar-pad-x":
        `${design.surface.toolbar.rail.barPadX}px`,
      "surface-toolbar-rail-side-size":
        `${design.surface.toolbar.rail.sideSize}px`,
      "surface-toolbar-rail-side-pad-y":
        `${design.surface.toolbar.rail.sidePadY}px`,
      "surface-toolbar-rail-side-pad-x":
        `${design.surface.toolbar.rail.sidePadX}px`,
      "surface-toolbar-rail-gap": `${design.surface.toolbar.rail.gap}px`,
      "surface-toolbar-dock-snap":
        `${design.surface.toolbar.rail.dockSnap}px`,
      "surface-toolbar-dock-margin":
        `${design.surface.toolbar.rail.dockMargin}px`,
      "surface-toolbar-dock-edge":
        `${design.surface.toolbar.rail.dockEdge}px`,
      "surface-toolbar-snap": `${design.surface.toolbar.rail.snap}px`,
      "surface-toolbar-snap-top": `${design.surface.toolbar.rail.snapTop}px`,
      "surface-toolbar-snap-bottom":
        `${design.surface.toolbar.rail.snapBottom}px`,
      "surface-toolbar-touch-bottom": design.surface.toolbar.metric.touchBottom,
      "surface-toolbar-desktop-bottom":
        design.surface.toolbar.metric.desktopBottom,
      "surface-toolbar-keyboard-top": design.surface.toolbar.metric.keyboardTop,
      "surface-toolbar-hint-radius": design.surface.toolbar.hint.radius,
      "surface-toolbar-hint-start-opacity":
        design.surface.toolbar.hint.startOpacity,
      "surface-toolbar-hint-start-scale":
        design.surface.toolbar.hint.startScale,
      "surface-toolbar-hint-transition":
        design.surface.toolbar.hint.transition,
      "surface-toolbar-hint-backdrop": design.surface.toolbar.hint.backdrop,
      "surface-toolbar-hint-dark-background":
        design.surface.toolbar.hint.darkBackground,
      "surface-toolbar-hint-dark-border": design.surface.toolbar.hint.darkBorder,
      "surface-toolbar-hint-dark-shadow": design.surface.toolbar.hint.darkShadow,
      "surface-toolbar-hint-light-background":
        design.surface.toolbar.hint.lightBackground,
      "surface-toolbar-hint-light-border":
        design.surface.toolbar.hint.lightBorder,
      "surface-toolbar-hint-light-shadow":
        design.surface.toolbar.hint.lightShadow,
      "surface-toolbar-dark-text": design.surface.toolbar.darkText,
      "surface-toolbar-dark-bg-hover": design.surface.toolbar.darkBgHover,
      "surface-toolbar-dark-border-hover":
        design.surface.toolbar.darkBorderHover,
      "surface-toolbar-light-text": design.surface.toolbar.lightText,
      "surface-toolbar-light-bg-hover": design.surface.toolbar.lightBgHover,
      "surface-toolbar-light-border-hover":
        design.surface.toolbar.lightBorderHover,
      "surface-toolbar-glass-backdrop": design.surface.toolbar.glassBackdrop,
      "surface-toolbar-dark-panel-bg": design.surface.toolbar.darkPanelBg,
      "surface-toolbar-dark-panel-border":
        design.surface.toolbar.darkPanelBorder,
      "surface-toolbar-dark-panel-shadow":
        design.surface.toolbar.darkPanelShadow,
      "surface-toolbar-light-panel-bg": design.surface.toolbar.lightPanelBg,
      "surface-toolbar-light-panel-border":
        design.surface.toolbar.lightPanelBorder,
      "surface-toolbar-light-panel-shadow":
        design.surface.toolbar.lightPanelShadow,
      "surface-neutral-light-primary":
        design.surface.neutral.light.primary,
      "surface-neutral-light-secondary":
        design.surface.neutral.light.secondary,
      "surface-neutral-light-tertiary":
        design.surface.neutral.light.tertiary,
      "surface-neutral-dark-primary":
        design.surface.neutral.dark.primary,
      "surface-neutral-dark-secondary":
        design.surface.neutral.dark.secondary,
      "surface-neutral-dark-tertiary":
        design.surface.neutral.dark.tertiary,
      "surface-proofread-light-row-border":
        design.surface.proofread.lightRowBorder,
      "surface-proofread-light-row-background":
        design.surface.proofread.lightRowBackground,
      "surface-proofread-light-active-background":
        design.surface.proofread.lightActiveBackground,
      "surface-proofread-light-empty-text":
        design.surface.proofread.lightEmptyText,
      "surface-proofread-dark-row-border":
        design.surface.proofread.darkRowBorder,
      "surface-proofread-dark-row-background":
        design.surface.proofread.darkRowBackground,
      "surface-proofread-dark-active-background":
        design.surface.proofread.darkActiveBackground,
      "surface-proofread-dark-empty-text":
        design.surface.proofread.darkEmptyText,
      "surface-proofread-focus-ring-light":
        design.surface.proofread.focusRingLight,
      "surface-proofread-focus-ring-dark":
        design.surface.proofread.focusRingDark,
      "surface-proofread-inline-pad":
        `${design.surface.proofread.inlinePad}px`,
      "surface-proofread-row-pad-y":
        `${design.surface.proofread.rowPadY}px`,
      "surface-proofread-row-gap": `${design.surface.proofread.rowGap}px`,
      "surface-proofread-row-stack-gap":
        `${design.surface.proofread.rowStackGap}px`,
      "surface-proofread-row-font-size":
        `${design.surface.proofread.rowFontSize}px`,
      "surface-proofread-viewport-gap":
        `${design.surface.proofread.viewportGap}px`,
      "surface-proofread-row-radius":
        `${design.surface.proofread.rowRadius}px`,
      "surface-proofread-list-radius":
        `${design.surface.proofread.listRadius}px`,
      "surface-proofread-word-width":
        `${design.surface.proofread.wordWidth}px`,
      "surface-proofread-word-min-width":
        `${design.surface.proofread.wordMinWidth}px`,
      "surface-proofread-word-touch-min-width":
        `${design.surface.proofread.wordTouchMinWidth}px`,
      "surface-proofread-field-min-width":
        `${design.surface.proofread.fieldMinWidth}px`,
      "surface-proofread-field-touch-min-width":
        `${design.surface.proofread.fieldTouchMinWidth}px`,
      "surface-proofread-source-width":
        `${design.surface.proofread.sourceWidth}px`,
      "surface-diff-panel-width": `${design.surface.diff.panelWidth}px`,
      "surface-diff-panel-pad": `${design.surface.diff.panelPad}px`,
      "surface-diff-panel-bottom": `${design.surface.diff.panelBottom}px`,
      "surface-diff-panel-right": `${design.surface.diff.panelRight}px`,
      "surface-diff-panel-gap": `${design.surface.diff.panelGap}px`,
      "surface-diff-stat-min-width": `${design.surface.diff.statMinWidth}px`,
      "surface-diff-inline-gap": `${design.surface.diff.inlineGap}px`,
      "surface-diff-inline-pad": `${design.surface.diff.inlinePad}px`,
      "surface-diff-inline-margin-y": `${design.surface.diff.inlineMarginY}px`,
      "surface-diff-inline-radius": `${design.surface.diff.inlineRadius}px`,
      "surface-diff-line-pad-y": `${design.surface.diff.linePadY}px`,
      "surface-diff-line-pad-x": `${design.surface.diff.linePadX}px`,
      "surface-diff-line-gap": `${design.surface.diff.lineGap}px`,
      "surface-diff-marker-width": `${design.surface.diff.markerWidth}px`,
      "surface-diff-mono-font": design.surface.diff.monoFont,
      "surface-diff-light-canvas-background":
        design.surface.diff.lightCanvasBackground,
      "surface-diff-light-panel-background":
        design.surface.diff.lightPanelBackground,
      "surface-diff-light-panel-border": design.surface.diff.lightPanelBorder,
      "surface-diff-light-panel-text": design.surface.diff.lightPanelText,
      "surface-diff-light-box-background": design.surface.diff.lightBoxBackground,
      "surface-diff-light-line-background": design.surface.diff.lightLineBackground,
      "surface-diff-light-context-background":
        design.surface.diff.lightContextBackground,
      "surface-diff-light-add-background": design.surface.diff.lightAddBackground,
      "surface-diff-light-add-accent": design.surface.diff.lightAddAccent,
      "surface-diff-light-del-background": design.surface.diff.lightDelBackground,
      "surface-diff-light-del-accent": design.surface.diff.lightDelAccent,
      "surface-diff-light-change-background":
        design.surface.diff.lightChangeBackground,
      "surface-diff-light-change-accent": design.surface.diff.lightChangeAccent,
      "surface-diff-light-code-background": design.surface.diff.lightCodeBackground,
      "surface-diff-dark-canvas-background": design.surface.diff.darkCanvasBackground,
      "surface-diff-dark-panel-background": design.surface.diff.darkPanelBackground,
      "surface-diff-dark-panel-border": design.surface.diff.darkPanelBorder,
      "surface-diff-dark-panel-text": design.surface.diff.darkPanelText,
      "surface-diff-dark-box-background": design.surface.diff.darkBoxBackground,
      "surface-diff-dark-line-background": design.surface.diff.darkLineBackground,
      "surface-diff-dark-context-background":
        design.surface.diff.darkContextBackground,
      "surface-diff-dark-add-background": design.surface.diff.darkAddBackground,
      "surface-diff-dark-add-accent": design.surface.diff.darkAddAccent,
      "surface-diff-dark-del-background": design.surface.diff.darkDelBackground,
      "surface-diff-dark-del-accent": design.surface.diff.darkDelAccent,
      "surface-diff-dark-change-background": design.surface.diff.darkChangeBackground,
      "surface-diff-dark-change-accent": design.surface.diff.darkChangeAccent,
      "surface-diff-dark-code-background": design.surface.diff.darkCodeBackground,
      "surface-popup-overlay-background": design.surface.popup.overlayBackground,
      "surface-popup-overlay-blur": design.surface.popup.overlayBlur,
      "surface-popup-overlay-pad": `${design.surface.popup.overlayPad}px`,
      "surface-popup-overlay-pad-mobile":
        `${design.surface.popup.mobileOverlayPad}px`,
      "surface-popup-panel-pad": `${design.surface.popup.panelPad}px`,
      "surface-popup-panel-max-width":
        `${design.surface.popup.panelMaxWidth}px`,
      "surface-popup-panel-max-height":
        `${design.surface.popup.panelMaxHeight}vh`,
      "surface-popup-panel-mobile-max-width":
        `${design.surface.popup.panelMobileMaxWidth}px`,
      "surface-popup-panel-mobile-max-height":
        `${design.surface.popup.panelMobileMaxHeight}vh`,
      "surface-popup-nav-gap": `${design.surface.popup.navGap}px`,
      "surface-popup-nav-margin-bottom":
        `${design.surface.popup.navMarginBottom}px`,
      "surface-popup-nav-label-min-height":
        `${design.surface.popup.navLabelMinHeight}px`,
      "surface-popup-nav-label-pad-x":
        `${design.surface.popup.navLabelPadX}px`,
      "surface-popup-row-gap": `${design.surface.popup.rowGap}px`,
      "surface-popup-head-margin-bottom":
        `${design.surface.popup.headMarginBottom}px`,
      "surface-popup-field-min-height":
        `${design.surface.popup.fieldMinHeight}px`,
      "surface-popup-field-radius": `${design.surface.popup.fieldRadius}px`,
      "surface-popup-field-pad-y": `${design.surface.popup.fieldPadY}px`,
      "surface-popup-field-pad-x": `${design.surface.popup.fieldPadX}px`,
      "surface-popup-actions-min-width":
        `${design.surface.popup.actionsMinWidth}px`,
      "surface-popup-field-resize": design.surface.popup.fieldResize,
      "surface-popup-field-focus-shadow": design.surface.popup.fieldFocusShadow,
      "surface-popup-field-light-background":
        design.surface.popup.fieldLightBackground,
      "surface-popup-field-dark-background":
        design.surface.popup.fieldDarkBackground,
      "surface-popup-counter-opacity": design.surface.popup.counterOpacity,
      "surface-popup-font-boost": `${design.surface.popup.fontBoost}px`,
      "surface-popup-row-margin-top": `${design.surface.popup.rowMarginTop}px`,
      "surface-popup-counter-pad-x": `${design.surface.popup.counterPadX}px`,
      "surface-popup-counter-min-height":
        `${design.surface.popup.counterMinHeight}px`,
      "surface-popup-counter-inset": `${design.surface.popup.counterInset}px`,
      "surface-popup-counter-base-background":
        design.surface.popup.counterBaseBackground,
      "surface-popup-counter-base-background-dark":
        design.surface.popup.counterBaseBackgroundDark,
      "surface-popup-counter-base-background-light":
        design.surface.popup.counterBaseBackgroundLight,
      "surface-popup-counter-fill-background":
        design.surface.popup.counterFillBackground,
      "surface-popup-counter-overflow-background":
        design.surface.popup.counterOverflowBackground,
      "surface-popup-counter-over-border":
        design.surface.popup.counterOverBorder,
      "surface-counter-opacity": design.surface.popup.counterOpacity,
      "surface-counter-pad-x": `${design.surface.popup.counterPadX}px`,
      "surface-counter-min-height":
        `${design.surface.popup.counterMinHeight}px`,
      "surface-counter-inset": `${design.surface.popup.counterInset}px`,
      "surface-counter-base-background":
        design.surface.popup.counterBaseBackground,
      "surface-counter-base-background-dark":
        design.surface.popup.counterBaseBackgroundDark,
      "surface-counter-base-background-light":
        design.surface.popup.counterBaseBackgroundLight,
      "surface-counter-fill-background":
        design.surface.popup.counterFillBackground,
      "surface-counter-overflow-background":
        design.surface.popup.counterOverflowBackground,
      "surface-counter-over-border":
        design.surface.popup.counterOverBorder,
      "surface-counter-radius": "999px",
      "surface-counter-border":
        "1px solid color-mix(in srgb, var(--panel-border) 72%, transparent)",
      "surface-counter-track-shadow":
        "inset 0 0 0 1px color-mix(in srgb, #ffffff 10%, transparent)",
      "surface-progress-height": `${design.surface.progress.height}px`,
      "surface-progress-gap-top": `${design.surface.progress.gapTop}px`,
      "surface-progress-border": design.surface.progress.border,
      "surface-progress-track": design.surface.progress.track,
      "surface-progress-fill": design.surface.progress.fill,
      "surface-filter-progress-top": `${design.surface.filter.progressTop}px`,
      "surface-filter-progress-width":
        `${design.surface.filter.progressWidth}px`,
      "surface-filter-panel-pad": `${design.surface.filter.panelPad}px`,
      "surface-filter-panel-border": design.surface.filter.panelBorder,
      "surface-filter-panel-background-light":
        design.surface.filter.panelBackgroundLight,
      "surface-filter-panel-background-dark":
        design.surface.filter.panelBackgroundDark,
      "surface-filter-modal-top": `${design.surface.filter.modalTop}px`,
      "surface-filter-row-gap": `${design.surface.filter.rowGap}px`,
      "surface-filter-row-margin-top":
        `${design.surface.filter.rowMarginTop}px`,
      "surface-filter-row-margin-bottom":
        `${design.surface.filter.rowMarginBottom}px`,
      "surface-filter-separator-margin-top":
        `${design.surface.filter.separatorMarginTop}px`,
      "surface-filter-separator-pad-top":
        `${design.surface.filter.separatorPadTop}px`,
      "surface-filter-period-min-width":
        `${design.surface.filter.periodMinWidth}px`,
      "surface-filter-button-min-height":
        `${design.surface.filter.buttonMinHeight}px`,
      "surface-filter-button-margin-y":
        `${design.surface.filter.buttonMarginY}px`,
      "surface-filter-button-pad-y": `${design.surface.filter.buttonPadY}px`,
      "surface-filter-button-pad-x": `${design.surface.filter.buttonPadX}px`,
      "surface-filter-current-border": design.surface.filter.currentBorder,
      "surface-filter-current-background":
        design.surface.filter.currentBackground,
      "surface-filter-current-text": design.surface.filter.currentText,
      "surface-filter-current-inset": design.surface.filter.currentInset,
      "surface-frame-capsule-radius": design.surface.frame.capsuleRadius,
      "surface-page-lift-y": design.page.liftY,
      "surface-page-lift-scale": design.page.liftScale,
      "surface-page-nav-lift-y": design.page.navLiftY,
      "surface-page-active-scale": design.page.activeScale,
    };
    return [ui, panel, control, flash, surface]
      .map((item) => design.list(item))
      .join("\n\n    ");
  },
};
