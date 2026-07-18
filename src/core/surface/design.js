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
    input: {
      lineHeight: 1.11,
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
      button: {
        size: "42px",
        paddingX: "0",
        opacity: ".82",
        activeScale: ".96",
      },
      layout: {
        phoneMaxShortEdge: 600,
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
      theme: {
        light: {
          background: "#fff",
          text: "#111",
          fade: "rgba(255,255,255,0)",
          shade: "rgba(255,255,255,.92)",
          shadow: "rgba(255,255,255,.55)",
          button: {
            text: "rgba(0,0,0,.82)",
            background: "rgba(255,255,255,.72)",
            border: "rgba(0,0,0,.18)",
            shadow: "0 10px 30px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.54)",
            active: {
              background: "rgba(0,0,0,.14)",
              shadow:
                "0 10px 30px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.54)",
            },
            hover: {
              background: "rgba(245,245,245,.86)",
              border: "rgba(0,0,0,.08)",
            },
          },
        },
        dark: {
          background: "#111",
          text: "#f2f2f2",
          fade: "rgba(17,17,17,0)",
          shade: "rgba(17,17,17,.92)",
          shadow: "rgba(17,17,17,.55)",
          button: {
            text: "rgba(255,255,255,.94)",
            background: "rgba(34,34,34,.58)",
            border: "rgba(255,255,255,.24)",
            shadow:
              "0 10px 30px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.14)",
            active: {
              background: "rgba(255,255,255,.18)",
              shadow:
                "0 10px 30px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.18)",
            },
            hover: {
              background: "rgba(64,64,64,.7)",
              border: "rgba(255,255,255,.14)",
            },
          },
        },
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
      hud: {
        gap: 12,
        inset: 12,
        buttonSize: 64,
        phoneGap: 8,
        phoneInset: 8,
        phoneButtonSize: 56,
        iconRatio: 0.44,
        radiusRatio: 0.3125,
        topOffset: 76,
      },
    },
    toolbar: {
      button: {
        size: "32px",
        padX: "9px",
        opacity: ".78",
        activeScale: ".96",
      },
      box: {
        size: "var(--surface-toolbar-button-size)",
      },
      emoji: {
        opacity: "1",
      },
      group: {
        gap: 6,
      },
      cluster: {
        pad: 5,
        inset: 6,
      },
      icon: {
        gap: 8,
        radius: "14px",
        hoverScale: "1.11",
        activeScale: "1.11",
        motion: {
          duration: "0.24s",
          easing: "cubic-bezier(.16,.84,.32,1)",
        },
      },
      text: {
        hoverScale: "1.03",
      },
      motion: {
        enterDuration: "0.48s",
        exitDuration: "0.56s",
        easing: "cubic-bezier(.16, .84, .24, 1)",
        offset: "4px",
      },
      unified: {
        padX: 8,
      },
      line: {
        pad: 6,
      },
      capsule: {
        viewportGap: 28,
      },
      glass: {
        backdrop: "blur(26px) saturate(1.6)",
      },
      theme: {
        dark: {
          text: "rgba(255,255,255,.94)",
          button: {
            hover: {
              background: "rgba(255,255,255,.12)",
              border: "rgba(255,255,255,.14)",
            },
            active: {
              background: "rgba(255, 255, 255, 0.16)",
              ring: "rgba(255, 255, 255, 0.36)",
              hint: "rgb(76, 76, 76)",
            },
          },
          group: {
            background: "rgb(76, 76, 76)",
            border: "rgba(255, 255, 255, 0.38)",
          },
          capsule: {
            text: "rgba(255, 255, 255, 0.96)",
          },
          glyph: {
            filter: {
              idle: "brightness(0) invert(0.88)",
              active: "brightness(0) invert(1)",
            },
            shadow:
              "drop-shadow(0 0 1px rgba(255, 255, 255, 0.62)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.34))",
          },
          panel: {
            background: "rgba(34,34,34,.46)",
            border: "rgba(255,255,255,.14)",
            shadow:
              "inset 0 1px 0 rgba(255,255,255,.10), 0 12px 36px rgba(0,0,0,.34)",
          },
        },
        light: {
          text: "rgba(0,0,0,.82)",
          button: {
            hover: {
              background: "rgba(0,0,0,.07)",
              border: "rgba(0,0,0,.08)",
            },
            active: {
              background: "rgba(0, 0, 0, 0.09)",
              ring: "rgba(0, 0, 0, 0.22)",
              hint: "rgba(0, 0, 0, 0.13)",
            },
          },
          group: {
            background: "rgb(219, 219, 219)",
            border: "rgba(0, 0, 0, 0.2)",
          },
          capsule: {
            text: "rgba(0, 0, 0, 0.86)",
          },
          glyph: {
            filter: {
              idle: "none",
              active: "brightness(0) contrast(1.35)",
            },
            shadow:
              "drop-shadow(0 0 1px rgba(0, 0, 0, 0.52)) drop-shadow(0 0 4px rgba(0, 0, 0, 0.3))",
          },
          panel: {
            background: "rgba(255,255,255,.48)",
            border: "rgba(0,0,0,.10)",
            shadow:
              "inset 0 1px 0 rgba(255,255,255,.82), 0 10px 30px rgba(0,0,0,.06)",
          },
        },
      },
      layer: {
        base: 0,
        glyph: 10,
        emoji: 20,
        cluster: 80,
      },
      rail: {
        scale: 1,
        gap: 8,
        pad: 8,
        pill: {
          pad: 5,
          inset: 6,
          extra: {
            main: 16,
            cross: 10,
          },
        },
        dock: {
          snap: 88,
          margin: 12,
          edge: 12,
        },
        snap: {
          base: 96,
          top: 96,
          bottom: 60,
        },
      },
      position: {
        touch: {
          bottom: "calc(env(safe-area-inset-bottom) + 60px)",
        },
        desktop: {
          bottom: "60px",
        },
        keyboard: {
          top: "calc(env(safe-area-inset-top) + 80px)",
        },
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
        shape: {
          radius: "14px",
        },
        state: {
          hidden: {
            opacity: "0",
            scale: "0.985",
          },
        },
        motion: {
          transition:
            "opacity 0.12s ease, top 0.14s ease, left 0.14s ease, width 0.14s ease, height 0.14s ease, transform 0.14s ease",
        },
        glass: {
          backdrop: "blur(2px)",
        },
        theme: {
          dark: {
            background: "rgba(255, 255, 255, 0.13)",
            border: "1px solid rgba(255, 255, 255, 0.32)",
            shadow:
              "0 0 0 1px rgba(255,255,255,0.08) inset, 0 0 12px rgba(0, 0, 0, 0.22)",
          },
          light: {
            background: "rgba(0, 0, 0, 0.07)",
            border: "1px solid rgba(0, 0, 0, 0.2)",
            shadow:
              "0 0 0 1px rgba(255,255,255,0.45) inset, 0 0 12px rgba(0, 0, 0, 0.14)",
          },
        },
        darkBackground: "rgba(255, 255, 255, 0.13)",
        darkBorder: "1px solid rgba(255, 255, 255, 0.32)",
        darkShadow:
          "0 0 0 1px rgba(255,255,255,0.08) inset, 0 0 12px rgba(0, 0, 0, 0.22)",
        lightBackground: "rgba(0, 0, 0, 0.07)",
        lightBorder: "1px solid rgba(0, 0, 0, 0.2)",
        lightShadow:
          "0 0 0 1px rgba(255,255,255,0.45) inset, 0 0 12px rgba(0, 0, 0, 0.14)",
      },
    },
    audit: {
      theme: {
        light: {
          row: {
            border: "#ddd",
            background: "rgba(255, 255, 255, 0.08)",
            activeBackground: "#fff7cc",
            separator: "rgba(0, 0, 0, 0.08)",
          },
          empty: {
            text: "#666",
          },
          focus: {
            ring: "rgba(0, 0, 0, 0.14)",
          },
        },
        dark: {
          row: {
            border: "rgba(255,255,255,.14)",
            background: "rgba(255, 255, 255, 0.04)",
            activeBackground: "rgba(230,184,0,.24)",
            separator: "rgba(255, 255, 255, 0.1)",
          },
          empty: {
            text: "rgba(255,255,255,.68)",
          },
          focus: {
            ring: "rgba(255, 255, 255, 0.22)",
          },
        },
      },
      panel: {
        pad: 10,
        padBottom: 20,
      },
      content: {
        inset: 0,
      },
      header: {
        gap: 16,
      },
      list: {
        padBottom: 0,
        radius: 22,
      },
      row: {
        heightExtra: 0,
        padY: 10,
        gap: 8,
        stackGap: 0,
        fontSize: 16,
        radius: 22,
      },
      select: {
        chevronShift: 2,
      },
      inline: {
        pad: 8,
      },
      word: {
        inset: 8,
        width: 128,
        minWidth: 88,
        touchMinWidth: 72,
      },
      field: {
        inset: 8,
        minWidth: 104,
        touchMinWidth: 96,
      },
      viewport: {
        gap: 12,
      },
      source: {
        width: 52,
      },
      progress: {
        fill: "linear-gradient(90deg, #f1ce4f 0%, #e6b800 100%)",
      },
    },
    diff: {
      panel: {
        width: 248,
        pad: 10,
        bottom: 16,
        right: 16,
        gap: 8,
      },
      stat: {
        minWidth: 68,
      },
      inline: {
        gap: 8,
        pad: 10,
        marginY: 12,
        radius: 12,
      },
      line: {
        padY: 7,
        padX: 10,
        gap: 6,
      },
      marker: {
        width: 4,
      },
      text: {
        monoFont:
          'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
      },
      theme: {
        light: {
          canvas: {
            background: "rgb(255, 255, 255)",
          },
          panel: {
            background: "rgba(255, 255, 255, 0.92)",
            border: "rgba(0, 0, 0, 0.14)",
            text: "rgba(0, 0, 0, 0.86)",
          },
          box: {
            background: "rgba(255, 255, 255, 0.96)",
          },
          line: {
            background: "rgba(0, 0, 0, 0.035)",
          },
          context: {
            background: "rgba(0, 0, 0, 0.025)",
          },
          add: {
            background: "rgba(42, 170, 82, 0.16)",
            accent: "rgba(42, 170, 82, 0.82)",
          },
          remove: {
            background: "rgba(216, 66, 66, 0.15)",
            accent: "rgba(216, 66, 66, 0.78)",
          },
          change: {
            background: "rgba(224, 168, 38, 0.16)",
            accent: "rgba(210, 145, 28, 0.82)",
          },
          code: {
            background: "rgba(0, 0, 0, 0.045)",
          },
        },
        dark: {
          canvas: {
            background: "rgb(17, 17, 17)",
          },
          panel: {
            background: "rgba(34, 34, 34, 0.72)",
            border: "rgba(255, 255, 255, 0.18)",
            text: "rgba(255, 255, 255, 0.92)",
          },
          box: {
            background: "rgba(24, 24, 24, 0.94)",
          },
          line: {
            background: "rgba(255, 255, 255, 0.06)",
          },
          context: {
            background: "rgba(255, 255, 255, 0.045)",
          },
          add: {
            background: "rgba(75, 196, 112, 0.2)",
            accent: "rgba(105, 230, 140, 0.9)",
          },
          remove: {
            background: "rgba(255, 101, 101, 0.18)",
            accent: "rgba(255, 135, 135, 0.9)",
          },
          change: {
            background: "rgba(245, 184, 72, 0.18)",
            accent: "rgba(255, 211, 104, 0.92)",
          },
          code: {
            background: "rgba(255, 255, 255, 0.08)",
          },
        },
      },
    },
    sharedPanel: {
      width: "520px",
      compactWidth: "260px",
      maxWidth: "calc(100vw - 32px)",
      radius: "calc(var(--panel-radius) * 2.2)",
    },
    popover: {
      size: {
        width: "min(420px, calc(100vw - 32px))",
        minHeight: "32px",
      },
      shape: {
        radius: "var(--control-radius)",
      },
      motion: {
        hidden: "translateY(5px) scale(.98)",
        visible: "translateY(0) scale(1)",
        hiddenTransition:
          "opacity .28s ease, transform .28s ease, visibility 0s linear .28s",
        visibleTransition:
          "opacity .28s ease, transform .28s ease, visibility 0s linear 0s",
      },
      text: {
        size: "15px",
        line: "1.45",
      },
      row: {
        padY: "6px",
        padX: "10px",
        actionPadX: "36px",
        bodyPadY: "1px",
      },
      action: {
        size: "18px",
        right: "10px",
        gap: "8px",
        idle: {
          opacity: ".72",
        },
        active: {
          opacity: "1",
        },
      },
      theme: {
        dark: {
          opacity: "96%",
          background:
            "color-mix(in srgb, var(--surface-toolbar-group-bg-dark) var(--surface-popover-theme-dark-opacity), transparent)",
          border: "var(--surface-toolbar-group-border-dark)",
          text: "var(--surface-toolbar-capsule-text-dark)",
          shadow: "var(--surface-toolbar-dark-panel-shadow)",
        },
        light: {
          opacity: "94%",
          background:
            "color-mix(in srgb, var(--surface-toolbar-group-bg-light) var(--surface-popover-theme-light-opacity), transparent)",
          border: "var(--surface-toolbar-group-border-light)",
          text: "var(--surface-toolbar-capsule-text-light)",
          shadow: "var(--surface-toolbar-light-panel-shadow)",
        },
      },
      field: {
        normalized: {
          background: "rgba(46, 125, 50, .14)",
          transition: "background-color .18s ease",
        },
      },
      diff: {
        part: {
          radius: "4px",
          padY: "1px",
          padX: "0",
        },
        add: {
          background: "rgba(46, 125, 50, .18)",
          shadow: "0 0 0 1px rgba(46, 125, 50, .16) inset",
        },
        remove: {
          background: "rgba(198, 40, 40, .16)",
          shadow: "0 0 0 1px rgba(198, 40, 40, .16) inset",
        },
      },
    },
    warning: {
      stripeBackground:
        "repeating-linear-gradient(135deg,#ffd400 0 10px,#111 10px 20px)",
      border: "rgba(255, 212, 0, 0.94)",
      text: "rgba(255, 77, 79, 0.96)",
    },
    counter: {
      size: {
        padX: "10px",
        minHeight: "32px",
        minWidth: "calc(var(--counter-min-height) * 4.8)",
        inset: "2px",
      },
      shape: {
        radius: "999px",
        border:
          "1px solid color-mix(in srgb, var(--panel-border) 72%, transparent)",
      },
      state: {
        opacity: ".86",
      },
      track: {
        background: "rgba(148,163,184,.22)",
        shadow: "inset 0 0 0 1px color-mix(in srgb, #ffffff 10%, transparent)",
      },
      fill: {
        background:
          "linear-gradient(90deg,color-mix(in srgb, #4da3ff 28%, transparent) 0%,color-mix(in srgb, #2dd4bf 30%, transparent) 54%,color-mix(in srgb, #59d66f 32%, transparent) 100%)",
      },
      overflow: {
        background:
          "linear-gradient(90deg,color-mix(in srgb, #ff3d6e 30%, transparent) 0%,color-mix(in srgb, #ffd84d 34%, transparent) 100%)",
        border: "rgba(248,113,113,.7)",
      },
      text: {
        color: "rgba(255, 255, 255, 0.88)",
        size: "calc(var(--panel-font-size) - 1px)",
        labelOpacity: ".78",
      },
      theme: {
        dark: {
          track: {
            background: "rgba(148,163,184,.18)",
          },
          text: {
            color:
              "var(--surface-toolbar-capsule-text-dark, rgba(255, 255, 255, 0.88))",
          },
        },
        light: {
          track: {
            background: "rgba(100,116,139,.16)",
          },
          text: {
            color:
              "var(--surface-toolbar-capsule-text-light, rgba(0, 0, 0, 0.86))",
          },
        },
      },
    },
    popup: {
      overlay: {
        background: "rgba(8,10,14,.42)",
        blur: "blur(4px)",
        pad: {
          base: 20,
          mobile: 12,
        },
      },
      panel: {
        pad: 16,
        max: {
          width: 720,
          height: 88,
        },
        mobile: {
          max: {
            width: 760,
            height: 86,
          },
        },
      },
      font: {
        boost: 5,
      },
      nav: {
        gap: 8,
        bottom: 12,
        label: {
          height: 40,
          padX: 12,
        },
      },
      head: {
        bottom: 12,
      },
      row: {
        gap: 8,
        top: 12,
      },
      field: {
        height: 136,
        radius: 12,
        pad: {
          y: 10,
          x: 12,
        },
        resize: "none",
        focus: {
          shadow: "none",
        },
        theme: {
          light: {
            background: "#fff",
          },
          dark: {
            background: "rgba(14,14,14,.96)",
          },
        },
      },
      counter: {
        padX: "12px",
        height: "calc(var(--surface-button-size) - 6px)",
        group: {
          width: "min(228px,46vw)",
          minWidth: "160px",
        },
      },
    },
    feedback: {
      panel: {
        width: "var(--surface-shared-panel-width)",
        radius: "var(--surface-shared-panel-radius)",
      },
      field: {
        focus: {
          border: "rgba(224, 168, 38, 0.92)",
        },
      },
      theme: {
        light: {
          field: {
            background: "rgb(238,238,238)",
          },
        },
      },
    },
    progress: {
      size: {
        height: 8,
      },
      gap: {
        top: 6,
      },
      track: {
        border: "#ccd0d4",
        background: "#f0f0f1",
      },
      fill: {
        background: "#2f7a45",
      },
    },
    filter: {
      progress: {
        top: 80,
        width: 240,
      },
      panel: {
        pad: 10,
        border: "#ccd0d4",
        theme: {
          light: {
            background: "#ffffff",
          },
          dark: {
            background: "#2f3338",
          },
        },
      },
      modal: {
        top: 80,
      },
      row: {
        gap: 6,
        margin: {
          top: 6,
          bottom: 4,
        },
      },
      separator: {
        margin: {
          top: 8,
        },
        pad: {
          top: 6,
        },
      },
      period: {
        width: 105,
      },
      button: {
        height: 28,
        margin: {
          y: 3,
        },
        pad: {
          y: 2,
          x: 8,
        },
      },
      current: {
        border: "#2f7a45",
        background: "#e7f6eb",
        text: "#1f5f33",
        inset: "#b7dfc2",
      },
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
      "surface-reader-button-size": design.surface.reader.button.size,
      "surface-reader-button-padding-x": design.surface.reader.button.paddingX,
      "surface-reader-button-opacity": design.surface.reader.button.opacity,
      "surface-reader-button-active-scale":
        design.surface.reader.button.activeScale,
      "surface-reader-theme-light-background":
        design.surface.reader.theme.light.background,
      "surface-reader-theme-light-text": design.surface.reader.theme.light.text,
      "surface-reader-theme-light-fade": design.surface.reader.theme.light.fade,
      "surface-reader-theme-light-shade":
        design.surface.reader.theme.light.shade,
      "surface-reader-theme-light-shadow":
        design.surface.reader.theme.light.shadow,
      "surface-reader-theme-dark-background":
        design.surface.reader.theme.dark.background,
      "surface-reader-theme-dark-text": design.surface.reader.theme.dark.text,
      "surface-reader-theme-dark-fade": design.surface.reader.theme.dark.fade,
      "surface-reader-theme-dark-shade": design.surface.reader.theme.dark.shade,
      "surface-reader-theme-dark-shadow":
        design.surface.reader.theme.dark.shadow,
      "surface-reader-fade-top-height": `${design.surface.reader.fade.topHeight}px`,
      "surface-reader-fade-bottom-height": `${design.surface.reader.fade.bottomHeight}px`,
      "surface-reader-fade-stop-solid": `${design.surface.reader.fade.stopSolid}%`,
      "surface-reader-fade-stop-shade": `${design.surface.reader.fade.stopShade}%`,
      "surface-reader-fade-stop-shadow": `${design.surface.reader.fade.stopShadow}%`,
      "surface-reader-css-content-padding": `${design.surface.reader.css.contentPadding}px`,
      "surface-reader-css-content-font-size": `${design.surface.reader.css.contentFontSize}px`,
      "surface-reader-css-content-line-height": String(
        design.surface.reader.css.contentLineHeight,
      ),
      "surface-reader-css-panel-gap": `${design.surface.reader.css.panelGap}px`,
      "surface-reader-css-shell-gap": `${design.surface.reader.css.shellGap}px`,
      "surface-reader-keyboard-open-threshold": `${design.surface.reader.layout.keyboardOpenThreshold}px`,
      "surface-reader-hud-gap": `${design.surface.reader.hud.gap}px`,
      "surface-reader-hud-inset": `${design.surface.reader.hud.inset}px`,
      "surface-reader-hud-button-size": `${design.surface.reader.hud.buttonSize}px`,
      "surface-reader-hud-phone-gap": `${design.surface.reader.hud.phoneGap}px`,
      "surface-reader-hud-phone-inset": `${design.surface.reader.hud.phoneInset}px`,
      "surface-reader-hud-phone-button-size": `${design.surface.reader.hud.phoneButtonSize}px`,
      "surface-reader-hud-icon-ratio": String(
        design.surface.reader.hud.iconRatio,
      ),
      "surface-reader-hud-radius-ratio": String(
        design.surface.reader.hud.radiusRatio,
      ),
      "surface-reader-hud-top-offset": `${design.surface.reader.hud.topOffset}px`,
      "surface-reader-theme-dark-button-text":
        design.surface.reader.theme.dark.button.text,
      "surface-reader-theme-dark-button-background":
        design.surface.reader.theme.dark.button.background,
      "surface-reader-theme-dark-button-border":
        design.surface.reader.theme.dark.button.border,
      "surface-reader-theme-dark-button-shadow":
        design.surface.reader.theme.dark.button.shadow,
      "surface-reader-theme-dark-button-hover-background":
        design.surface.reader.theme.dark.button.hover.background,
      "surface-reader-theme-dark-button-hover-border":
        design.surface.reader.theme.dark.button.hover.border,
      "surface-reader-theme-dark-button-active-background":
        design.surface.reader.theme.dark.button.active.background,
      "surface-reader-theme-dark-button-active-shadow":
        design.surface.reader.theme.dark.button.active.shadow,
      "surface-reader-theme-light-button-text":
        design.surface.reader.theme.light.button.text,
      "surface-reader-theme-light-button-background":
        design.surface.reader.theme.light.button.background,
      "surface-reader-theme-light-button-border":
        design.surface.reader.theme.light.button.border,
      "surface-reader-theme-light-button-shadow":
        design.surface.reader.theme.light.button.shadow,
      "surface-reader-theme-light-button-hover-background":
        design.surface.reader.theme.light.button.hover.background,
      "surface-reader-theme-light-button-hover-border":
        design.surface.reader.theme.light.button.hover.border,
      "surface-reader-theme-light-button-active-background":
        design.surface.reader.theme.light.button.active.background,
      "surface-reader-theme-light-button-active-shadow":
        design.surface.reader.theme.light.button.active.shadow,
      "surface-toolbar-button-size": design.surface.toolbar.button.size,
      "surface-toolbar-button-padding-x": design.surface.toolbar.button.padX,
      "surface-toolbar-button-opacity": design.surface.toolbar.button.opacity,
      "surface-toolbar-emoji-opacity": design.surface.toolbar.emoji.opacity,
      "surface-toolbar-button-active-scale":
        design.surface.toolbar.button.activeScale,
      "surface-toolbar-box-size": design.surface.toolbar.box.size,
      "surface-toolbar-group-gap-base": `${design.surface.toolbar.group.gap}px`,
      "surface-toolbar-cluster-pad-y": `${design.surface.toolbar.cluster.pad}px`,
      "surface-toolbar-cluster-pad-x": `${design.surface.toolbar.cluster.pad}px`,
      "surface-toolbar-cluster-inset-x": `${design.surface.toolbar.cluster.inset}px`,
      "surface-toolbar-cluster-inset-y": `${design.surface.toolbar.cluster.inset}px`,
      "surface-toolbar-icon-gap-base": `${design.surface.toolbar.icon.gap}px`,
      "surface-toolbar-icon-hover-scale":
        design.surface.toolbar.icon.hoverScale,
      "surface-toolbar-icon-active-scale":
        design.surface.toolbar.icon.activeScale,
      "surface-toolbar-icon-motion-duration":
        design.surface.toolbar.icon.motion.duration,
      "surface-toolbar-icon-motion-easing":
        design.surface.toolbar.icon.motion.easing,
      "surface-toolbar-text-hover-scale":
        design.surface.toolbar.text.hoverScale,
      "surface-toolbar-launchpad-motion-enter-duration":
        design.surface.toolbar.motion.enterDuration,
      "surface-toolbar-launchpad-motion-exit-duration":
        design.surface.toolbar.motion.exitDuration,
      "surface-toolbar-launchpad-motion-easing":
        design.surface.toolbar.motion.easing,
      "surface-toolbar-launchpad-motion-offset":
        design.surface.toolbar.motion.offset,
      "surface-toolbar-unified-pad-x": `${design.surface.toolbar.unified.padX}px`,
      "surface-toolbar-line-pad-base": `${design.surface.toolbar.line.pad}px`,
      "surface-toolbar-icon-box-radius": design.surface.toolbar.icon.radius,
      "surface-toolbar-rail-pill": `${design.surface.toolbar.rail.pill.pad}px`,
      "surface-toolbar-rail-inset": `${design.surface.toolbar.rail.pill.inset}px`,
      "surface-toolbar-rail-pill-main-extra": `${design.surface.toolbar.rail.pill.extra.main}px`,
      "surface-toolbar-rail-pill-cross-extra": `${design.surface.toolbar.rail.pill.extra.cross}px`,
      "surface-toolbar-capsule-max-viewport-gap": `${design.surface.toolbar.capsule.viewportGap}px`,
      "surface-toolbar-glyph-filter-dark":
        design.surface.toolbar.theme.dark.glyph.filter.idle,
      "surface-toolbar-glyph-filter-dark-active":
        design.surface.toolbar.theme.dark.glyph.filter.active,
      "surface-toolbar-glyph-filter-light":
        design.surface.toolbar.theme.light.glyph.filter.idle,
      "surface-toolbar-glyph-filter-light-active":
        design.surface.toolbar.theme.light.glyph.filter.active,
      "surface-toolbar-active-bg-dark":
        design.surface.toolbar.theme.dark.button.active.background,
      "surface-toolbar-active-ring-dark":
        design.surface.toolbar.theme.dark.button.active.ring,
      "surface-toolbar-active-bg-light":
        design.surface.toolbar.theme.light.button.active.background,
      "surface-toolbar-active-ring-light":
        design.surface.toolbar.theme.light.button.active.ring,
      "surface-toolbar-button-active-hint-dark":
        design.surface.toolbar.theme.dark.button.active.hint,
      "surface-toolbar-button-active-hint-light":
        design.surface.toolbar.theme.light.button.active.hint,
      "surface-toolbar-group-bg-dark":
        design.surface.toolbar.theme.dark.group.background,
      "surface-toolbar-group-bg-light":
        design.surface.toolbar.theme.light.group.background,
      "surface-toolbar-group-border-dark":
        design.surface.toolbar.theme.dark.group.border,
      "surface-toolbar-group-border-light":
        design.surface.toolbar.theme.light.group.border,
      "surface-toolbar-capsule-text-dark":
        design.surface.toolbar.theme.dark.capsule.text,
      "surface-toolbar-capsule-text-light":
        design.surface.toolbar.theme.light.capsule.text,
      "surface-toolbar-glyph-shadow-dark":
        design.surface.toolbar.theme.dark.glyph.shadow,
      "surface-toolbar-glyph-shadow-light":
        design.surface.toolbar.theme.light.glyph.shadow,
      "surface-toolbar-layer-base": String(design.surface.toolbar.layer.base),
      "surface-toolbar-layer-glyph": String(design.surface.toolbar.layer.glyph),
      "surface-toolbar-layer-emoji": String(design.surface.toolbar.layer.emoji),
      "surface-toolbar-layer-cluster": String(
        design.surface.toolbar.layer.cluster,
      ),
      "surface-toolbar-rail-scale": String(design.surface.toolbar.rail.scale),
      "surface-toolbar-rail-pad": `${design.surface.toolbar.rail.pad}px`,
      "surface-toolbar-rail-pad-y": `${design.surface.toolbar.rail.pad}px`,
      "surface-toolbar-rail-pad-x": `${design.surface.toolbar.rail.pad}px`,
      "surface-toolbar-rail-bar-pad-y": `${design.surface.toolbar.rail.pad}px`,
      "surface-toolbar-rail-bar-pad-x": `${design.surface.toolbar.rail.pad}px`,
      "surface-toolbar-rail-side-pad-y": `${design.surface.toolbar.rail.pad}px`,
      "surface-toolbar-rail-side-pad-x": `${design.surface.toolbar.rail.pad}px`,
      "surface-toolbar-rail-gap": `${design.surface.toolbar.rail.gap}px`,
      "surface-toolbar-dock-snap": `${design.surface.toolbar.rail.dock.snap}px`,
      "surface-toolbar-dock-margin": `${design.surface.toolbar.rail.dock.margin}px`,
      "surface-toolbar-dock-edge": `${design.surface.toolbar.rail.dock.edge}px`,
      "surface-toolbar-snap": `${design.surface.toolbar.rail.snap.base}px`,
      "surface-toolbar-snap-top": `${design.surface.toolbar.rail.snap.top}px`,
      "surface-toolbar-snap-bottom": `${design.surface.toolbar.rail.snap.bottom}px`,
      "surface-toolbar-touch-bottom":
        design.surface.toolbar.position.touch.bottom,
      "surface-toolbar-desktop-bottom":
        design.surface.toolbar.position.desktop.bottom,
      "surface-toolbar-keyboard-top":
        design.surface.toolbar.position.keyboard.top,
      "surface-toolbar-hint-radius": design.surface.toolbar.hint.shape.radius,
      "surface-toolbar-hint-start-opacity":
        design.surface.toolbar.hint.state.hidden.opacity,
      "surface-toolbar-hint-start-scale":
        design.surface.toolbar.hint.state.hidden.scale,
      "surface-toolbar-hint-transition":
        design.surface.toolbar.hint.motion.transition,
      "surface-toolbar-hint-backdrop":
        design.surface.toolbar.hint.glass.backdrop,
      "surface-toolbar-hint-dark-background":
        design.surface.toolbar.hint.theme.dark.background,
      "surface-toolbar-hint-dark-border":
        design.surface.toolbar.hint.theme.dark.border,
      "surface-toolbar-hint-dark-shadow":
        design.surface.toolbar.hint.theme.dark.shadow,
      "surface-toolbar-hint-light-background":
        design.surface.toolbar.hint.theme.light.background,
      "surface-toolbar-hint-light-border":
        design.surface.toolbar.hint.theme.light.border,
      "surface-toolbar-hint-light-shadow":
        design.surface.toolbar.hint.theme.light.shadow,
      "surface-toolbar-dark-text": design.surface.toolbar.theme.dark.text,
      "surface-toolbar-dark-bg-hover":
        design.surface.toolbar.theme.dark.button.hover.background,
      "surface-toolbar-dark-border-hover":
        design.surface.toolbar.theme.dark.button.hover.border,
      "surface-toolbar-light-text": design.surface.toolbar.theme.light.text,
      "surface-toolbar-light-bg-hover":
        design.surface.toolbar.theme.light.button.hover.background,
      "surface-toolbar-light-border-hover":
        design.surface.toolbar.theme.light.button.hover.border,
      "surface-toolbar-glass-backdrop": design.surface.toolbar.glass.backdrop,
      "surface-toolbar-dark-panel-bg":
        design.surface.toolbar.theme.dark.panel.background,
      "surface-toolbar-dark-panel-border":
        design.surface.toolbar.theme.dark.panel.border,
      "surface-toolbar-dark-panel-shadow":
        design.surface.toolbar.theme.dark.panel.shadow,
      "surface-toolbar-light-panel-bg":
        design.surface.toolbar.theme.light.panel.background,
      "surface-toolbar-light-panel-border":
        design.surface.toolbar.theme.light.panel.border,
      "surface-toolbar-light-panel-shadow":
        design.surface.toolbar.theme.light.panel.shadow,
      "surface-neutral-light-primary": design.surface.neutral.light.primary,
      "surface-neutral-light-secondary": design.surface.neutral.light.secondary,
      "surface-neutral-light-tertiary": design.surface.neutral.light.tertiary,
      "surface-neutral-dark-primary": design.surface.neutral.dark.primary,
      "surface-neutral-dark-secondary": design.surface.neutral.dark.secondary,
      "surface-neutral-dark-tertiary": design.surface.neutral.dark.tertiary,
      "surface-audit-light-row-border":
        design.surface.audit.theme.light.row.border,
      "surface-audit-light-row-background":
        design.surface.audit.theme.light.row.background,
      "surface-audit-light-active-background":
        design.surface.audit.theme.light.row.activeBackground,
      "surface-audit-light-row-separator":
        design.surface.audit.theme.light.row.separator,
      "surface-audit-light-empty-text":
        design.surface.audit.theme.light.empty.text,
      "surface-audit-dark-row-border":
        design.surface.audit.theme.dark.row.border,
      "surface-audit-dark-row-background":
        design.surface.audit.theme.dark.row.background,
      "surface-audit-dark-active-background":
        design.surface.audit.theme.dark.row.activeBackground,
      "surface-audit-dark-row-separator":
        design.surface.audit.theme.dark.row.separator,
      "surface-audit-dark-empty-text":
        design.surface.audit.theme.dark.empty.text,
      "surface-audit-focus-ring-light":
        design.surface.audit.theme.light.focus.ring,
      "surface-audit-focus-ring-dark":
        design.surface.audit.theme.dark.focus.ring,
      "surface-audit-panel-pad": `${design.surface.audit.panel.pad}px`,
      "surface-audit-panel-pad-bottom": `${design.surface.audit.panel.padBottom}px`,
      "surface-audit-content-inset": `${design.surface.audit.content.inset}px`,
      "surface-audit-header-gap": `${design.surface.audit.header.gap}px`,
      "surface-audit-list-pad-bottom": `${design.surface.audit.list.padBottom}px`,
      "surface-audit-row-height-extra": `${design.surface.audit.row.heightExtra}px`,
      "surface-audit-select-chevron-shift": `${design.surface.audit.select.chevronShift}px`,
      "surface-audit-inline-pad": `${design.surface.audit.inline.pad}px`,
      "surface-audit-row-pad-y": `${design.surface.audit.row.padY}px`,
      "surface-audit-row-gap": `${design.surface.audit.row.gap}px`,
      "surface-audit-row-stack-gap": `${design.surface.audit.row.stackGap}px`,
      "surface-audit-word-inset": `${design.surface.audit.word.inset}px`,
      "surface-audit-field-inset": `${design.surface.audit.field.inset}px`,
      "surface-input-line-height": `${design.surface.input.lineHeight}`,
      "surface-audit-row-font-size": `${design.surface.audit.row.fontSize}px`,
      "surface-audit-viewport-gap": `${design.surface.audit.viewport.gap}px`,
      "surface-audit-row-radius": `${design.surface.audit.row.radius}px`,
      "surface-audit-list-radius": `${design.surface.audit.list.radius}px`,
      "surface-audit-word-width": `${design.surface.audit.word.width}px`,
      "surface-audit-word-min-width": `${design.surface.audit.word.minWidth}px`,
      "surface-audit-word-touch-min-width": `${design.surface.audit.word.touchMinWidth}px`,
      "surface-audit-field-min-width": `${design.surface.audit.field.minWidth}px`,
      "surface-audit-field-touch-min-width": `${design.surface.audit.field.touchMinWidth}px`,
      "surface-audit-source-width": `${design.surface.audit.source.width}px`,
      "surface-audit-progress-fill-background":
        design.surface.audit.progress.fill,
      "surface-diff-panel-width": `${design.surface.diff.panel.width}px`,
      "surface-diff-panel-pad": `${design.surface.diff.panel.pad}px`,
      "surface-diff-panel-bottom": `${design.surface.diff.panel.bottom}px`,
      "surface-diff-panel-right": `${design.surface.diff.panel.right}px`,
      "surface-diff-panel-gap": `${design.surface.diff.panel.gap}px`,
      "surface-diff-stat-min-width": `${design.surface.diff.stat.minWidth}px`,
      "surface-diff-inline-gap": `${design.surface.diff.inline.gap}px`,
      "surface-diff-inline-pad": `${design.surface.diff.inline.pad}px`,
      "surface-diff-inline-margin-y": `${design.surface.diff.inline.marginY}px`,
      "surface-diff-inline-radius": `${design.surface.diff.inline.radius}px`,
      "surface-diff-line-pad-y": `${design.surface.diff.line.padY}px`,
      "surface-diff-line-pad-x": `${design.surface.diff.line.padX}px`,
      "surface-diff-line-gap": `${design.surface.diff.line.gap}px`,
      "surface-diff-marker-width": `${design.surface.diff.marker.width}px`,
      "surface-diff-mono-font": design.surface.diff.text.monoFont,
      "surface-diff-theme-light-canvas-background":
        design.surface.diff.theme.light.canvas.background,
      "surface-diff-theme-light-panel-background":
        design.surface.diff.theme.light.panel.background,
      "surface-diff-theme-light-panel-border":
        design.surface.diff.theme.light.panel.border,
      "surface-diff-theme-light-panel-text":
        design.surface.diff.theme.light.panel.text,
      "surface-diff-theme-light-box-background":
        design.surface.diff.theme.light.box.background,
      "surface-diff-theme-light-line-background":
        design.surface.diff.theme.light.line.background,
      "surface-diff-theme-light-context-background":
        design.surface.diff.theme.light.context.background,
      "surface-diff-theme-light-add-background":
        design.surface.diff.theme.light.add.background,
      "surface-diff-theme-light-add-accent":
        design.surface.diff.theme.light.add.accent,
      "surface-diff-theme-light-remove-background":
        design.surface.diff.theme.light.remove.background,
      "surface-diff-theme-light-remove-accent":
        design.surface.diff.theme.light.remove.accent,
      "surface-diff-theme-light-change-background":
        design.surface.diff.theme.light.change.background,
      "surface-diff-theme-light-change-accent":
        design.surface.diff.theme.light.change.accent,
      "surface-diff-theme-light-code-background":
        design.surface.diff.theme.light.code.background,
      "surface-diff-theme-dark-canvas-background":
        design.surface.diff.theme.dark.canvas.background,
      "surface-diff-theme-dark-panel-background":
        design.surface.diff.theme.dark.panel.background,
      "surface-diff-theme-dark-panel-border":
        design.surface.diff.theme.dark.panel.border,
      "surface-diff-theme-dark-panel-text":
        design.surface.diff.theme.dark.panel.text,
      "surface-diff-theme-dark-box-background":
        design.surface.diff.theme.dark.box.background,
      "surface-diff-theme-dark-line-background":
        design.surface.diff.theme.dark.line.background,
      "surface-diff-theme-dark-context-background":
        design.surface.diff.theme.dark.context.background,
      "surface-diff-theme-dark-add-background":
        design.surface.diff.theme.dark.add.background,
      "surface-diff-theme-dark-add-accent":
        design.surface.diff.theme.dark.add.accent,
      "surface-diff-theme-dark-remove-background":
        design.surface.diff.theme.dark.remove.background,
      "surface-diff-theme-dark-remove-accent":
        design.surface.diff.theme.dark.remove.accent,
      "surface-diff-theme-dark-change-background":
        design.surface.diff.theme.dark.change.background,
      "surface-diff-theme-dark-change-accent":
        design.surface.diff.theme.dark.change.accent,
      "surface-diff-theme-dark-code-background":
        design.surface.diff.theme.dark.code.background,
      "surface-popup-overlay-bg": design.surface.popup.overlay.background,
      "surface-popup-overlay-blur": design.surface.popup.overlay.blur,
      "surface-popup-overlay-pad": `${design.surface.popup.overlay.pad.base}px`,
      "surface-popup-overlay-pad-mobile": `${design.surface.popup.overlay.pad.mobile}px`,
      "surface-popup-panel-pad": `${design.surface.popup.panel.pad}px`,
      "surface-popup-panel-max-width": `${design.surface.popup.panel.max.width}px`,
      "surface-popup-panel-max-height": `${design.surface.popup.panel.max.height}vh`,
      "surface-popup-panel-mobile-max-width": `${design.surface.popup.panel.mobile.max.width}px`,
      "surface-popup-panel-mobile-max-height": `${design.surface.popup.panel.mobile.max.height}vh`,
      "surface-popup-font-boost": `${design.surface.popup.font.boost}px`,
      "surface-popup-nav-gap": `${design.surface.popup.nav.gap}px`,
      "surface-popup-nav-bottom": `${design.surface.popup.nav.bottom}px`,
      "surface-popup-nav-label-height": `${design.surface.popup.nav.label.height}px`,
      "surface-popup-nav-label-pad-x": `${design.surface.popup.nav.label.padX}px`,
      "surface-popup-head-bottom": `${design.surface.popup.head.bottom}px`,
      "surface-popup-row-gap": `${design.surface.popup.row.gap}px`,
      "surface-popup-row-top": `${design.surface.popup.row.top}px`,
      "surface-popup-field-height": `${design.surface.popup.field.height}px`,
      "surface-popup-field-radius": `${design.surface.popup.field.radius}px`,
      "surface-popup-field-pad-y": `${design.surface.popup.field.pad.y}px`,
      "surface-popup-field-pad-x": `${design.surface.popup.field.pad.x}px`,
      "surface-popup-field-resize": design.surface.popup.field.resize,
      "surface-popup-field-focus-shadow":
        design.surface.popup.field.focus.shadow,
      "surface-popup-field-theme-light-background":
        design.surface.popup.field.theme.light.background,
      "surface-popup-field-theme-dark-background":
        design.surface.popup.field.theme.dark.background,
      "surface-popup-counter-pad-x": design.surface.popup.counter.padX,
      "surface-popup-counter-height": design.surface.popup.counter.height,
      "surface-popup-counter-group-width":
        design.surface.popup.counter.group.width,
      "surface-popup-counter-group-min-width":
        design.surface.popup.counter.group.minWidth,
      "surface-counter-size-pad-x": design.surface.counter.size.padX,
      "surface-counter-size-min-height": design.surface.counter.size.minHeight,
      "surface-counter-size-min-width": design.surface.counter.size.minWidth,
      "surface-counter-size-inset": design.surface.counter.size.inset,
      "surface-counter-shape-radius": design.surface.counter.shape.radius,
      "surface-counter-shape-border": design.surface.counter.shape.border,
      "surface-counter-state-opacity": design.surface.counter.state.opacity,
      "surface-counter-track-background":
        design.surface.counter.track.background,
      "surface-counter-track-shadow": design.surface.counter.track.shadow,
      "surface-counter-fill-background": design.surface.counter.fill.background,
      "surface-counter-overflow-background":
        design.surface.counter.overflow.background,
      "surface-counter-overflow-border": design.surface.counter.overflow.border,
      "surface-counter-text-color": design.surface.counter.text.color,
      "surface-counter-text-size": design.surface.counter.text.size,
      "surface-counter-text-label-opacity":
        design.surface.counter.text.labelOpacity,
      "surface-counter-theme-dark-track-background":
        design.surface.counter.theme.dark.track.background,
      "surface-counter-theme-dark-text-color":
        design.surface.counter.theme.dark.text.color,
      "surface-counter-theme-light-track-background":
        design.surface.counter.theme.light.track.background,
      "surface-counter-theme-light-text-color":
        design.surface.counter.theme.light.text.color,
      "surface-shared-panel-width": design.surface.sharedPanel.width,
      "surface-shared-panel-compact-width":
        design.surface.sharedPanel.compactWidth,
      "surface-shared-panel-max-width": design.surface.sharedPanel.maxWidth,
      "surface-shared-panel-radius": design.surface.sharedPanel.radius,
      "surface-warning-stripe-background":
        design.surface.warning.stripeBackground,
      "surface-warning-border": design.surface.warning.border,
      "surface-warning-text": design.surface.warning.text,
      "surface-feedback-panel-width": design.surface.feedback.panel.width,
      "surface-feedback-panel-radius": design.surface.feedback.panel.radius,
      "surface-feedback-field-focus-border":
        design.surface.feedback.field.focus.border,
      "surface-feedback-theme-light-field-background":
        design.surface.feedback.theme.light.field.background,
      "surface-progress-size-height": `${design.surface.progress.size.height}px`,
      "surface-progress-gap-top": `${design.surface.progress.gap.top}px`,
      "surface-progress-track-border": design.surface.progress.track.border,
      "surface-progress-track-background":
        design.surface.progress.track.background,
      "surface-progress-fill-background":
        design.surface.progress.fill.background,
      "surface-filter-progress-top": `${design.surface.filter.progress.top}px`,
      "surface-filter-progress-width": `${design.surface.filter.progress.width}px`,
      "surface-filter-panel-pad": `${design.surface.filter.panel.pad}px`,
      "surface-filter-panel-border": design.surface.filter.panel.border,
      "surface-filter-panel-theme-light-background":
        design.surface.filter.panel.theme.light.background,
      "surface-filter-panel-theme-dark-background":
        design.surface.filter.panel.theme.dark.background,
      "surface-filter-modal-top": `${design.surface.filter.modal.top}px`,
      "surface-filter-row-gap": `${design.surface.filter.row.gap}px`,
      "surface-filter-row-margin-top": `${design.surface.filter.row.margin.top}px`,
      "surface-filter-row-margin-bottom": `${design.surface.filter.row.margin.bottom}px`,
      "surface-filter-separator-margin-top": `${design.surface.filter.separator.margin.top}px`,
      "surface-filter-separator-pad-top": `${design.surface.filter.separator.pad.top}px`,
      "surface-filter-period-width": `${design.surface.filter.period.width}px`,
      "surface-filter-button-height": `${design.surface.filter.button.height}px`,
      "surface-filter-button-margin-y": `${design.surface.filter.button.margin.y}px`,
      "surface-filter-button-pad-y": `${design.surface.filter.button.pad.y}px`,
      "surface-filter-button-pad-x": `${design.surface.filter.button.pad.x}px`,
      "surface-filter-current-border": design.surface.filter.current.border,
      "surface-filter-current-background":
        design.surface.filter.current.background,
      "surface-filter-current-text": design.surface.filter.current.text,
      "surface-filter-current-inset": design.surface.filter.current.inset,
      "surface-popover-size-width": design.surface.popover.size.width,
      "surface-popover-size-min-height": design.surface.popover.size.minHeight,
      "surface-popover-shape-radius": design.surface.popover.shape.radius,
      "surface-popover-motion-hidden": design.surface.popover.motion.hidden,
      "surface-popover-motion-visible": design.surface.popover.motion.visible,
      "surface-popover-motion-hidden-transition":
        design.surface.popover.motion.hiddenTransition,
      "surface-popover-motion-visible-transition":
        design.surface.popover.motion.visibleTransition,
      "surface-popover-text-size": design.surface.popover.text.size,
      "surface-popover-text-line": design.surface.popover.text.line,
      "surface-popover-row-pad-y": design.surface.popover.row.padY,
      "surface-popover-row-pad-x": design.surface.popover.row.padX,
      "surface-popover-row-action-pad-x": design.surface.popover.row.actionPadX,
      "surface-popover-row-body-pad-y": design.surface.popover.row.bodyPadY,
      "surface-popover-action-size": design.surface.popover.action.size,
      "surface-popover-action-right": design.surface.popover.action.right,
      "surface-popover-action-gap": design.surface.popover.action.gap,
      "surface-popover-action-idle-opacity":
        design.surface.popover.action.idle.opacity,
      "surface-popover-action-active-opacity":
        design.surface.popover.action.active.opacity,
      "surface-popover-theme-dark-opacity":
        design.surface.popover.theme.dark.opacity,
      "surface-popover-theme-dark-background":
        design.surface.popover.theme.dark.background,
      "surface-popover-theme-dark-border":
        design.surface.popover.theme.dark.border,
      "surface-popover-theme-dark-text": design.surface.popover.theme.dark.text,
      "surface-popover-theme-dark-shadow":
        design.surface.popover.theme.dark.shadow,
      "surface-popover-theme-light-opacity":
        design.surface.popover.theme.light.opacity,
      "surface-popover-theme-light-background":
        design.surface.popover.theme.light.background,
      "surface-popover-theme-light-border":
        design.surface.popover.theme.light.border,
      "surface-popover-theme-light-text":
        design.surface.popover.theme.light.text,
      "surface-popover-theme-light-shadow":
        design.surface.popover.theme.light.shadow,
      "surface-popover-field-normalized-background":
        design.surface.popover.field.normalized.background,
      "surface-popover-field-normalized-transition":
        design.surface.popover.field.normalized.transition,
      "surface-popover-diff-part-radius":
        design.surface.popover.diff.part.radius,
      "surface-popover-diff-part-pad-y": design.surface.popover.diff.part.padY,
      "surface-popover-diff-part-pad-x": design.surface.popover.diff.part.padX,
      "surface-popover-diff-add-background":
        design.surface.popover.diff.add.background,
      "surface-popover-diff-add-shadow": design.surface.popover.diff.add.shadow,
      "surface-popover-diff-remove-background":
        design.surface.popover.diff.remove.background,
      "surface-popover-diff-remove-shadow":
        design.surface.popover.diff.remove.shadow,
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
