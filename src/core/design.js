export const design = {
  ui: {
    fontSize: "13px",
    fontFamily: '"YS Text Variable", "Segoe UI", Arial, sans-serif',
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
    radius: "calc(var(--panel-font-size) * 0.62)",
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
    reader: {
      buttonSize: "42px",
      buttonPaddingX: "0",
      buttonOpacity: ".82",
      buttonActiveScale: ".96",
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
      buttonSize: "30px",
      buttonPaddingX: "9px",
      buttonOpacity: ".78",
      emojiOpacity: "1",
      buttonActiveScale: ".96",
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
      lightActiveBackground: "#fff7cc",
      lightActiveInset: "#e6b800",
      lightMessageText: "#666",
      lightEmptyText: "#666",
      lightNoteBackground: "#fff",
      lightNoteBorder: "#dadada",
      lightNoteShadow: "0 10px 30px #00000026",
      darkRowBorder: "rgba(255,255,255,.14)",
      darkActiveBackground: "rgba(230,184,0,.24)",
      darkActiveInset: "rgba(255,214,92,.9)",
      darkMessageText: "rgba(255,255,255,.76)",
      darkEmptyText: "rgba(255,255,255,.68)",
      darkNoteBackground: "rgba(18,18,18,.96)",
      darkNoteBorder: "rgba(255,255,255,.16)",
      darkNoteShadow: "0 16px 40px #00000066",
      lightScrollTrack: "rgba(0,0,0,.08)",
      lightScrollThumb: "rgba(0,0,0,.26)",
      lightScrollThumbHover: "rgba(0,0,0,.38)",
      darkScrollTrack: "rgba(255,255,255,.10)",
      darkScrollThumb: "rgba(255,255,255,.28)",
      darkScrollThumbHover: "rgba(255,255,255,.42)",
      errorBorder: "#c00",
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
      "surface-reader-button-size": design.surface.reader.buttonSize,
      "surface-reader-button-padding-x": design.surface.reader.buttonPaddingX,
      "surface-reader-button-opacity": design.surface.reader.buttonOpacity,
      "surface-reader-button-active-scale":
        design.surface.reader.buttonActiveScale,
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
      "surface-proofread-light-row-border":
        design.surface.proofread.lightRowBorder,
      "surface-proofread-light-active-background":
        design.surface.proofread.lightActiveBackground,
      "surface-proofread-light-active-inset":
        design.surface.proofread.lightActiveInset,
      "surface-proofread-light-message-text":
        design.surface.proofread.lightMessageText,
      "surface-proofread-light-empty-text":
        design.surface.proofread.lightEmptyText,
      "surface-proofread-light-note-background":
        design.surface.proofread.lightNoteBackground,
      "surface-proofread-light-note-border":
        design.surface.proofread.lightNoteBorder,
      "surface-proofread-light-note-shadow":
        design.surface.proofread.lightNoteShadow,
      "surface-proofread-dark-row-border":
        design.surface.proofread.darkRowBorder,
      "surface-proofread-dark-active-background":
        design.surface.proofread.darkActiveBackground,
      "surface-proofread-dark-active-inset":
        design.surface.proofread.darkActiveInset,
      "surface-proofread-dark-message-text":
        design.surface.proofread.darkMessageText,
      "surface-proofread-dark-empty-text":
        design.surface.proofread.darkEmptyText,
      "surface-proofread-dark-note-background":
        design.surface.proofread.darkNoteBackground,
      "surface-proofread-dark-note-border":
        design.surface.proofread.darkNoteBorder,
      "surface-proofread-dark-note-shadow":
        design.surface.proofread.darkNoteShadow,
      "surface-proofread-light-scroll-track":
        design.surface.proofread.lightScrollTrack,
      "surface-proofread-light-scroll-thumb":
        design.surface.proofread.lightScrollThumb,
      "surface-proofread-light-scroll-thumb-hover":
        design.surface.proofread.lightScrollThumbHover,
      "surface-proofread-dark-scroll-track":
        design.surface.proofread.darkScrollTrack,
      "surface-proofread-dark-scroll-thumb":
        design.surface.proofread.darkScrollThumb,
      "surface-proofread-dark-scroll-thumb-hover":
        design.surface.proofread.darkScrollThumbHover,
      "surface-proofread-error-border": design.surface.proofread.errorBorder,
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
