import { design } from "./design.js";

const sheet = {
  join(items) {
    return items.map((item) => item()).join("");
  },
  base: {
    tokens() {
      return `
        :root {
          ${design.run()}
        }
`;
    },
    panel() {
      return `
        .panel,
        .panel * {
          box-sizing: border-box;
        }
        .panel {
          position: fixed;
          z-index: 999999;
          background: var(--panel-background);
          color: var(--panel-text);
          border: 1px solid var(--panel-border);
          box-shadow: var(--panel-shadow);
          border-radius: var(--panel-radius);
          font-family: var(--panel-font-family);
          font-size: var(--panel-font-size);
          line-height: var(--panel-line-height);
        }
        .panel.place-right {
          right: 20px;
          top: 40px;
        }
        .panel.place-left {
          left: 20px;
          top: 40px;
        }
        .panel.place-center {
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }
        .panel .emoji {
          width: 1.2em;
          height: 1.2em;
          display: inline-block;
          vertical-align: -0.2em;
        }
        .panel .emoji img {
          width: 100%;
          height: 100%;
          display: block;
        }
        .panel button,
        .panel input,
        .panel select {
          font: inherit;
        }
        .panel .button {
          height: var(--control-height);
          min-height: var(--control-height);
          border: 0;
          border-radius: var(--control-radius);
          background: var(--control-background);
          color: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: calc(var(--control-font-size) * 0.45);
          padding: 0 var(--control-pad-x);
          cursor: pointer;
          transition:
            background 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.2s ease;
        }
        .panel .button:hover {
          background: var(--control-background-hover);
        }
        .panel .button:active {
          background: var(--control-background-active);
          transform: scale(0.9);
        }
        .panel .button:disabled {
          opacity: 0.45;
          cursor: default;
        }
        .panel .button:focus-visible {
          box-shadow: var(--control-focus-ring);
          outline: none;
        }
        .panel .button[data-hover="bg"]:hover,
        .panel .button[data-hover="bg"]:focus-visible {
          background: var(--control-background-hover);
        }
        .panel .button[data-hover="bg"]:active {
          background: var(--control-background-active);
          transform: scale(0.9);
        }
        .panel .button[data-hover="scale"] {
          background: rgba(0, 0, 0, 0.08);
        }
        .panel .button[data-hover="scale"]:hover,
        .panel .button[data-hover="scale"]:focus-visible {
          background: transparent;
          transform: translateZ(0) scale(1.1);
        }
        .panel .button[data-hover="scale"]:active {
          background: transparent;
          transform: translateZ(0) scale(1.06);
        }
        .panel .button[data-flash="green"] {
          background: var(--flash-green-background) !important;
        }
        .panel .button[data-flash="blue"] {
          background: var(--flash-blue-background) !important;
        }
        .panel .button[data-flash="red"] {
          background: var(--flash-red-background) !important;
        }
        .panel .button[data-flash]:focus-visible {
          box-shadow: var(--control-focus-ring) !important;
        }
        .panel .button-emoji {
          width: var(--control-height);
          min-width: var(--control-height);
          padding: 0;
          font-size: calc(var(--control-font-size) + 2px);
          line-height: 1;
        }
        .panel .button-text {
          min-width: calc(var(--control-font-size) * 6.5);
          font-size: var(--control-font-size);
          font-weight: 600;
        }
        .panel .progress {
          display: flex;
          flex-direction: column;
          gap: var(--surface-progress-gap-top);
        }
        .panel .progress-track {
          height: var(--surface-progress-height);
          border: 1px solid var(--surface-progress-border);
          background: var(--surface-progress-track);
          overflow: hidden;
        }
        .panel .progress-fill {
          width: 0%;
          height: 100%;
          background: var(--surface-progress-fill);
          transition: width 0.2s ease;
        }
`;
    },
    toolbar() {
      return `
        .panel[data-ui-surface="toolbar"] .button {
          appearance: none !important;
          -webkit-appearance: none !important;
          border: 1px solid transparent !important;
          border-radius: 999px !important;
          width: auto !important;
          min-width: var(--surface-button-size) !important;
          height: var(--surface-button-size) !important;
          min-height: var(--surface-button-size) !important;
          padding: 0 var(--surface-button-padding-x) !important;
          outline: 0 !important;
          box-shadow: none !important;
          background: var(--surface-button-bg) !important;
          background-image: none !important;
          text-shadow: none !important;
          opacity: var(--surface-button-opacity);
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          transition:
            opacity .12s ease,
            background-color .12s ease,
            border-color .12s ease;
        }
        .panel[data-ui-surface="toolbar"] .button { font-weight: 400 !important; }
        .panel[data-ui-surface="toolbar"] .button.button-text {
          border-radius: 999px !important;
          background-image: none !important;
          line-height: 30px !important;
        }
        .panel[data-ui-surface="toolbar"] .button-emoji {
          width: var(--surface-button-size) !important;
          min-width: var(--surface-button-size) !important;
          height: var(--surface-button-size) !important;
          min-height: var(--surface-button-size) !important;
          padding: 0 !important;
          border-radius: calc(var(--control-font-size) * 1.2) !important;
          opacity: var(--surface-toolbar-emoji-opacity, var(--surface-button-opacity)) !important;
          filter: none !important;
          -webkit-text-fill-color: currentColor !important;
          text-rendering: geometricPrecision;
        }
        .panel[data-ui-surface="toolbar"] {
          --surface-button-size: calc(var(--surface-toolbar-button-size) * var(--toolbar-scale, 1));
          --surface-button-padding-x: var(--surface-toolbar-button-padding-x);
          --surface-button-opacity: var(--surface-toolbar-button-opacity);
          --surface-button-active-scale: var(--surface-toolbar-button-active-scale);
          --surface-group-gap: calc(var(--surface-toolbar-group-gap-base) * var(--toolbar-scale, 1));
          --surface-icon-box-gap: calc(var(--surface-toolbar-icon-gap-base) * var(--toolbar-scale, 1));
          --surface-toolbar-icon-size: var(--surface-emoji-icon-size);
          --surface-toolbar-logo-size: var(--surface-emoji-icon-size);
          --surface-button-bg: transparent;
          --surface-emoji-icon-size: calc(var(--surface-button-size) * 0.84);
          --toolbar-unified-step: var(--surface-button-size);
          --toolbar-unified-icon-size: var(--surface-emoji-icon-size);
          --toolbar-unified-pad-x: var(--surface-toolbar-unified-pad-x);
          --surface-emoji-hover-scale: 1.12;
          --surface-emoji-active-scale: 1.08;
          --surface-active-scale: 1.35;
          --surface-scroll-step-extra: 0px;
          --surface-glyph-filter: none;
          --surface-line-edge-pad: calc(var(--surface-toolbar-line-pad-base) * var(--toolbar-scale, 1));
          --surface-line-cross-pad: calc(var(--surface-toolbar-line-pad-base) * var(--toolbar-scale, 1));
          --surface-button-active-hint-bg: rgba(0, 0, 0, 0.14);
          --surface-icon-box-radius: var(--surface-toolbar-icon-box-radius);
          --surface-group-bg: rgb(255, 255, 255);
          --surface-glyph-filter-active: var(--surface-glyph-filter);
          --surface-active-bg: rgba(255, 255, 255, 0.18);
          --surface-active-ring: rgba(255, 255, 255, 0.34);
          --rail-item-size: var(--surface-button-size);
          --rail-pill-main: calc(var(--rail-item-size) + var(--surface-toolbar-rail-pill-main-extra));
          --rail-pill-cross: calc(var(--rail-item-size) + var(--surface-toolbar-rail-pill-cross-extra));
        }
        .panel[data-ui-surface="toolbar"][data-theme="dark"] {
          --surface-active-bg: var(--surface-toolbar-active-bg-dark);
          --surface-active-ring: var(--surface-toolbar-active-ring-dark);
        }
        .panel[data-ui-surface="toolbar"][data-theme="light"] {
          --surface-active-bg: var(--surface-toolbar-active-bg-light);
          --surface-active-ring: var(--surface-toolbar-active-ring-light);
        }
        .panel[data-ui-surface="toolbar"][data-icon-mode="glyph"] {
          --surface-icon-box-gap: 12px;
          --surface-button-padding-x: 2px;
          --surface-scroll-step-extra: 0px;
        }
        .panel[data-ui-surface="toolbar"] .toolbar-unified-button {
          min-width: calc(var(--toolbar-unified-step) + 10px);
          height: var(--toolbar-unified-step);
          min-height: var(--toolbar-unified-step);
          padding: 0 var(--toolbar-unified-pad-x);
          border: 0 !important;
          border-color: transparent !important;
          border-radius: 999px;
          background: transparent !important;
          box-shadow: none !important;
        }
        .panel[data-ui-surface="toolbar"] .toolbar-unified-button [data-icon] img {
          width: var(--toolbar-unified-icon-size);
          height: var(--toolbar-unified-icon-size);
          min-width: var(--toolbar-unified-icon-size);
          min-height: var(--toolbar-unified-icon-size);
        }
        .panel[data-ui-surface="toolbar"] .toolbar-media-box,
        .panel[data-ui-surface="toolbar"] .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-icon-box {
          width: var(--surface-button-size);
          height: var(--surface-button-size);
          min-width: var(--surface-button-size);
          min-height: var(--surface-button-size);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transform: translateZ(0) scale(1);
          transition: transform 0.16s cubic-bezier(.22,.8,.28,1);
          transform-origin: 50% 50%;
          will-change: transform;
          pointer-events: none;
          -webkit-user-drag: none;
          user-drag: none;
          user-select: none;
          -webkit-user-select: none;
          overflow: visible;
          border-radius: var(--surface-icon-box-radius);
          position: relative;
        }
        .panel[data-ui-surface="toolbar"] .toolbar-media-box::before,
        .panel[data-ui-surface="toolbar"] .toolbar-icon-box::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          border-radius: inherit;
          background: transparent;
          opacity: 0;
          pointer-events: none;
        }
        .panel[data-ui-surface="toolbar"] .toolbar-media,
        .panel[data-ui-surface="toolbar"] .toolbar-icon-content,
        .panel[data-ui-surface="toolbar"] .ui-icon-content {
          width: var(--surface-emoji-icon-size);
          height: var(--surface-emoji-icon-size);
          min-width: var(--surface-emoji-icon-size);
          min-height: var(--surface-emoji-icon-size);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          font-size: var(--surface-emoji-icon-size);
          flex: 0 0 auto;
          pointer-events: none;
        }
        .panel[data-ui-surface="toolbar"] .toolbar-media .emoji,
        .panel[data-ui-surface="toolbar"] .toolbar-media .emoji img,
        .panel[data-ui-surface="toolbar"] .toolbar-media .proofread-icon,
        .panel[data-ui-surface="toolbar"] .toolbar-icon-content .emoji,
        .panel[data-ui-surface="toolbar"] .toolbar-icon-content .emoji img,
        .panel[data-ui-surface="toolbar"] .toolbar-icon-content .proofread-icon {
          width: var(--surface-emoji-icon-size) !important;
          height: var(--surface-emoji-icon-size) !important;
          min-width: var(--surface-emoji-icon-size) !important;
          min-height: var(--surface-emoji-icon-size) !important;
          vertical-align: 0;
          pointer-events: none;
          -webkit-user-drag: none;
          user-drag: none;
          user-select: none;
          -webkit-user-select: none;
        }
        .panel[data-ui-surface="toolbar"] .toolbar-icon {
          width: var(--surface-toolbar-icon-size) !important;
          height: var(--surface-toolbar-icon-size) !important;
          min-width: var(--surface-toolbar-icon-size) !important;
          min-height: var(--surface-toolbar-icon-size) !important;
          display: block;
          flex: 0 0 var(--surface-toolbar-icon-size);
          object-fit: contain;
          filter: var(--surface-glyph-filter);
        }
        .panel[data-ui-surface="toolbar"] .toolbar-logo {
          width: var(--surface-toolbar-logo-size) !important;
          height: var(--surface-toolbar-logo-size) !important;
          min-width: var(--surface-toolbar-logo-size) !important;
          min-height: var(--surface-toolbar-logo-size) !important;
          display: block;
          flex: 0 0 var(--surface-toolbar-logo-size);
          object-fit: contain;
          border-radius: 4px;
        }
        .panel[data-ui-surface="toolbar"] .button-emoji:hover {
          transform: none !important;
          background: transparent !important;
          border-color: transparent !important;
          box-shadow: none !important;
        }
        .panel[data-ui-surface="toolbar"] .button-emoji:hover .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .button-emoji:focus-visible .toolbar-icon-box {
          transform: translateZ(0) scale(var(--surface-emoji-hover-scale));
        }
        .panel[data-ui-surface="toolbar"] .button-emoji:active {
          transform: none !important;
        }
        .panel[data-ui-surface="toolbar"] .button-emoji:active .toolbar-icon-box {
          transform: translateZ(0) scale(var(--surface-emoji-active-scale));
        }
        @media (hover: none), (pointer: coarse) {
          .panel[data-ui-surface="toolbar"] .button-emoji:hover .toolbar-icon-box,
          .panel[data-ui-surface="toolbar"] .button-emoji:focus-visible .toolbar-icon-box {
            transform: translateZ(0) scale(1);
          }
          .panel[data-ui-surface="toolbar"] .button-emoji:active .toolbar-icon-box {
            transform: translateZ(0) scale(1.12);
          }
        }
        .panel[data-ui-surface="toolbar"] .button:hover,
        .panel[data-ui-surface="toolbar"] .button:focus-visible {
          opacity: 1;
        }
        .panel[data-ui-surface="toolbar"] .button:active {
          transform: scale(var(--surface-button-active-scale));
        }
        .panel[data-ui-surface="toolbar"][data-theme="dark"] {
          --surface-button-text: var(--surface-toolbar-dark-text);
          --surface-button-bg-hover: var(--surface-toolbar-dark-bg-hover);
          --surface-button-border-hover: var(--surface-toolbar-dark-border-hover);
          --surface-glyph-filter: var(--surface-toolbar-glyph-filter-dark);
          --surface-glyph-filter-active: var(--surface-toolbar-glyph-filter-dark-active);
          --surface-button-active-hint-bg: var(--surface-toolbar-button-active-hint-dark);
          --surface-group-bg: var(--surface-toolbar-group-bg-dark);
        }
        .panel[data-ui-surface="toolbar"][data-theme="light"] {
          --surface-button-text: var(--surface-toolbar-light-text);
          --surface-button-bg-hover: var(--surface-toolbar-light-bg-hover);
          --surface-button-border-hover: var(--surface-toolbar-light-border-hover);
          --surface-glyph-filter: var(--surface-toolbar-glyph-filter-light);
          --surface-glyph-filter-active: var(--surface-toolbar-glyph-filter-light-active);
          --surface-button-active-hint-bg: var(--surface-toolbar-button-active-hint-light);
          --surface-group-bg: var(--surface-toolbar-group-bg-light);
        }
        .panel[data-ui-surface="toolbar"] .button {
          color: var(--surface-button-text) !important;
        }
        .panel[data-ui-surface="toolbar"] .button.button-text:hover,
        .panel[data-ui-surface="toolbar"] .button.button-text:focus-visible {
          background: var(--surface-button-bg-hover) !important;
          border-color: var(--surface-button-border-hover) !important;
        }
        .panel[data-ui-surface="toolbar"][data-theme="light"] .button:hover,
        .panel[data-ui-surface="toolbar"][data-theme="light"] .button:focus-visible {
          box-shadow: none !important;
        }
        .panel[data-ui-surface="toolbar"] .ui-group {
          display: inline-flex;
          align-items: center;
          gap: var(--surface-group-gap);
          width: fit-content;
          min-width: 0;
          max-width: 100%;
          padding: var(--rail-pill-pad);
          border-radius: 999px;
          border: 1px solid var(--surface-toolbar-group-border-dark);
          background: transparent;
          box-shadow: none;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          transition: none !important;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"] [data-sticky-group="left"] {
          position: sticky;
          left: 0;
          z-index: 30;
          flex: 0 0 auto;
          margin-right: var(--panel-row-gap);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"] [data-sticky-group="right"] {
          position: sticky;
          right: 0;
          z-index: 30;
          flex: 0 0 auto;
          margin-left: var(--panel-row-gap);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="left"] [data-sticky-group="left"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="right"] [data-sticky-group="left"] {
          margin-right: 0;
          margin-bottom: var(--panel-row-gap);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="left"] [data-sticky-group="right"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="right"] [data-sticky-group="right"] {
          margin-left: 0;
          margin-top: var(--panel-row-gap);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="left"] [data-rail-group],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="right"] [data-rail-group] {
          position: static;
          left: auto;
          right: auto;
          display: flex;
          flex-direction: column;
          width: 100%;
          min-width: 100%;
          max-width: 100%;
          min-height: var(--rail-pill-main);
          justify-content: center;
          align-items: center;
          padding: var(--rail-pill-pad);
          gap: var(--rail-gap);
          border-radius: 999px;
        }
        .panel[data-ui-surface="toolbar"][data-theme="dark"] [data-rail-group] {
          background: rgb(76, 76, 76);
          border-color: var(--surface-toolbar-group-border-dark);
        }
        .panel[data-ui-surface="toolbar"][data-theme="light"] [data-rail-group] {
          background: var(--surface-toolbar-group-bg-light);
          border-color: var(--surface-toolbar-group-border-light);
        }
        .panel[data-ui-surface="toolbar"] .ui-group-body {
          display: inline-flex;
          align-items: center;
          gap: var(--surface-icon-box-gap);
          min-width: 0;
          padding: 0;
          margin: 0;
          border: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .panel[data-ui-surface="toolbar"] .ui-group > .ui-group-body {
          padding-left: var(--rail-group-inset);
          padding-right: var(--rail-group-inset);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="left"] .ui-group > .ui-group-body,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="right"] .ui-group > .ui-group-body {
          padding-top: var(--rail-group-inset);
          padding-bottom: var(--rail-group-inset);
        }
        .panel[data-ui-surface="toolbar"] .ui-strip {
          display: inline-flex;
          align-items: center;
          gap: var(--surface-icon-box-gap);
          flex: 0 0 auto;
          min-width: 0;
          margin: 0;
          padding: 0;
          border: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .panel[data-ui-surface="toolbar"] .ui-line {
          box-sizing: border-box;
          min-width: 0;
          min-height: 0;
          flex: 0 1 auto;
          padding-top: var(--surface-line-cross-pad);
          padding-bottom: var(--surface-line-cross-pad);
          padding-left: var(--surface-line-edge-pad);
          padding-right: var(--surface-line-edge-pad);
          scroll-padding-left: var(--surface-line-edge-pad);
          scroll-padding-right: var(--surface-line-edge-pad);
        }
        .panel[data-ui-surface="toolbar"] .ui-shell {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--rail-gap);
          min-width: 0;
          width: 100%;
        }
        .panel[data-ui-surface="toolbar"] .ui-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }
        .panel[data-ui-surface="toolbar"] .ui-stack-row {
          display: flex;
          align-items: center;
          width: 100%;
        }
        .panel[data-ui-surface="toolbar"] .ui-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: var(--surface-button-size) !important;
          min-width: var(--surface-button-size) !important;
          max-width: var(--surface-button-size) !important;
          height: var(--surface-button-size) !important;
          min-height: var(--surface-button-size) !important;
          margin: 0;
          padding: 0 !important;
          border: 0 !important;
          border-color: transparent !important;
          border-radius: 999px;
          background: transparent !important;
          box-shadow: none !important;
          line-height: 1;
          transform: none !important;
          transition: none !important;
          flex: 0 0 auto;
          overflow: visible;
          cursor: pointer;
          pointer-events: auto;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-capsule="true"] {
          width: max-content;
          min-width: 0;
          max-width: calc(100vw - var(--surface-toolbar-capsule-max-viewport-gap));
          padding: var(--rail-bar-pad-y) var(--rail-bar-pad-x);
          border: 1px solid transparent;
          border-radius: 999px;
          backdrop-filter: var(--surface-toolbar-glass-backdrop);
          -webkit-backdrop-filter: var(--surface-toolbar-glass-backdrop);
        }
        .panel[data-ui-frame="capsule"] {
          border: 1px solid transparent;
          border-radius: var(--surface-frame-capsule-radius);
          backdrop-filter: var(--surface-toolbar-glass-backdrop);
          -webkit-backdrop-filter: var(--surface-toolbar-glass-backdrop);
        }
        .panel[data-ui-frame="capsule"][data-theme="dark"] {
          border-color: var(--surface-toolbar-dark-panel-border);
          background: var(--surface-toolbar-dark-panel-bg);
          color: var(--surface-toolbar-capsule-text-dark);
          box-shadow: var(--surface-toolbar-dark-panel-shadow);
        }
        .panel[data-ui-frame="capsule"][data-theme="light"] {
          border-color: var(--surface-toolbar-light-panel-border);
          background: var(--surface-toolbar-light-panel-bg);
          color: var(--surface-toolbar-capsule-text-light);
          box-shadow: var(--surface-toolbar-light-panel-shadow);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-capsule="true"][data-theme="dark"] {
          border-color: var(--surface-toolbar-dark-panel-border);
          background: var(--surface-toolbar-dark-panel-bg);
          color: var(--surface-toolbar-capsule-text-dark);
          box-shadow: var(--surface-toolbar-dark-panel-shadow);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-capsule="true"][data-theme="light"] {
          border-color: var(--surface-toolbar-light-panel-border);
          background: var(--surface-toolbar-light-panel-bg);
          color: var(--surface-toolbar-capsule-text-light);
          box-shadow: var(--surface-toolbar-light-panel-shadow);
        }
        .panel[data-ui-surface="toolbar"] .ui-button:active {
          transform: none !important;
        }
        .panel[data-ui-surface="toolbar"] .ui-button[data-disabled="true"] {
          opacity: 0.45;
          pointer-events: none;
        }
        .panel[data-ui-surface="toolbar"] .ui-button[data-active="true"] {
          background: transparent !important;
          box-shadow: none !important;
        }
        .panel[data-ui-surface="toolbar"] .ui-button[data-active="true"] .toolbar-icon {
          filter: var(--surface-glyph-filter-active);
          transform: scale(var(--surface-active-scale));
          transform-origin: 50% 50%;
        }
        .panel[data-ui-surface="toolbar"]:not([data-icon-mode="glyph"]) .ui-button[data-active="true"] .toolbar-media,
        .panel[data-ui-surface="toolbar"]:not([data-icon-mode="glyph"]) .ui-button[data-active="true"] .toolbar-icon-content,
        .panel[data-ui-surface="toolbar"]:not([data-icon-mode="glyph"]) .ui-button[data-active="true"] .ui-icon-content {
          transform: scale(var(--surface-active-scale));
          transform-origin: 50% 50%;
        }
        .panel[data-ui-surface="toolbar"][data-theme="dark"] .ui-button[data-active="true"] .toolbar-icon {
          filter: var(--surface-glyph-filter-active) var(--surface-toolbar-glyph-shadow-dark);
        }
        .panel[data-ui-surface="toolbar"][data-theme="light"] .ui-button[data-active="true"] .toolbar-icon {
          filter: var(--surface-glyph-filter-active) var(--surface-toolbar-glyph-shadow-light);
        }
        .panel[data-ui-surface="toolbar"] .ui-button[data-active="true"] .toolbar-media-box::before,
        .panel[data-ui-surface="toolbar"] .ui-button[data-active="true"] .toolbar-icon-box::before,
        .panel[data-ui-surface="toolbar"] .ui-button[data-active="true"] .ui-icon-box::before {
          opacity: 0;
          background: transparent;
        }
        .panel[data-ui-surface="toolbar"] .ui-button:hover:not([data-active="true"]) {
          transform: none !important;
          background: transparent !important;
          border-color: transparent !important;
          box-shadow: none !important;
        }
        .panel[data-ui-surface="toolbar"] .ui-button:hover .toolbar-media-box,
        .panel[data-ui-surface="toolbar"] .ui-button:hover .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button:hover .ui-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button:focus-visible .toolbar-media-box,
        .panel[data-ui-surface="toolbar"] .ui-button:focus-visible .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button:focus-visible .ui-icon-box {
          transform: translateZ(0) scale(1.12);
        }
        .panel[data-ui-surface="toolbar"] .ui-button:active .toolbar-media-box,
        .panel[data-ui-surface="toolbar"] .ui-button:active .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button:active .ui-icon-box {
          transform: translateZ(0) scale(1.08);
        }
        .panel[data-ui-surface="toolbar"] .ui-button:hover .toolbar-media .emoji,
        .panel[data-ui-surface="toolbar"] .ui-button:hover .toolbar-media .emoji img,
        .panel[data-ui-surface="toolbar"] .ui-button:hover .toolbar-icon-content .emoji,
        .panel[data-ui-surface="toolbar"] .ui-button:hover .toolbar-icon-content .emoji img,
        .panel[data-ui-surface="toolbar"] .ui-button:hover .ui-icon-content .emoji,
        .panel[data-ui-surface="toolbar"] .ui-button:hover .ui-icon-content .emoji img,
        .panel[data-ui-surface="toolbar"] .ui-button:focus-visible .toolbar-media .emoji,
        .panel[data-ui-surface="toolbar"] .ui-button:focus-visible .toolbar-media .emoji img,
        .panel[data-ui-surface="toolbar"] .ui-button:focus-visible .toolbar-icon-content .emoji,
        .panel[data-ui-surface="toolbar"] .ui-button:focus-visible .toolbar-icon-content .emoji img,
        .panel[data-ui-surface="toolbar"] .ui-button:focus-visible .ui-icon-content .emoji,
        .panel[data-ui-surface="toolbar"] .ui-button:focus-visible .ui-icon-content .emoji img {
          filter: none;
        }
        .panel[data-ui-surface="toolbar"] .ui-button:active .toolbar-media .emoji,
        .panel[data-ui-surface="toolbar"] .ui-button:active .toolbar-media .emoji img,
        .panel[data-ui-surface="toolbar"] .ui-button:active .toolbar-icon-content .emoji,
        .panel[data-ui-surface="toolbar"] .ui-button:active .toolbar-icon-content .emoji img,
        .panel[data-ui-surface="toolbar"] .ui-button:active .ui-icon-content .emoji,
        .panel[data-ui-surface="toolbar"] .ui-button:active .ui-icon-content .emoji img {
          filter: none;
        }
        /* single-row: orientation-core */
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"] .toolbar-media-box,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"] .toolbar-icon-box {
          width: calc(var(--surface-button-size) - 4px);
          height: calc(var(--surface-button-size) - 4px);
          min-width: calc(var(--surface-button-size) - 4px);
          min-height: calc(var(--surface-button-size) - 4px);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"] .ui-shell {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: var(--rail-gap);
          width: max-content;
          max-width: 100%;
          margin: 0 auto;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="left"] .ui-shell,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="right"] .ui-shell {
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          width: 100%;
          max-width: 100%;
        }
        .panel[data-ui-surface="toolbar"][data-theme="light"] .ui-group {
          background: rgba(0, 0, 0, 0.14);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="left"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="right"] {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: var(--rail-side-size);
          min-width: var(--rail-side-size);
          max-width: var(--rail-side-size);
          padding: var(--rail-side-pad-y) var(--rail-side-pad-x);
          overflow-x: hidden;
          overflow-y: auto;
          scroll-snap-type: y proximity;
          touch-action: pan-y;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="left"] .ui-strip,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="right"] .ui-strip {
          flex-direction: column;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="left"] .ui-group-body,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="right"] .ui-group-body {
          position: static;
          left: auto;
          right: auto;
          display: flex !important;
          flex-direction: column;
          width: fit-content !important;
          min-width: 0 !important;
          height: fit-content !important;
          min-height: 0 !important;
          padding: 0;
          gap: var(--rail-gap);
          align-items: center;
          justify-content: flex-start;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="top"] [data-rail-group],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="bottom"] [data-rail-group],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="floating"] [data-rail-group] {
          min-width: var(--rail-pill-main);
          min-height: var(--rail-pill-cross);
        }
        /* single-row: behavior-scroll (horizontal docks) */
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="top"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="bottom"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="floating"] {
          padding: var(--rail-bar-pad-y) var(--rail-bar-pad-x);
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x proximity;
          touch-action: pan-x;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="top"] .ui-line,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="bottom"] .ui-line,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="floating"] .ui-line {
          width: var(--rail-track-x, auto);
          max-width: var(--rail-track-x-max, calc(100vw - 56px));
          overflow-x: auto;
          overflow-y: hidden;
        }
        /* single-row: behavior-scroll (vertical docks) */
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="left"] .ui-line,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="right"] .ui-line {
          height: var(--rail-track-y, auto);
          max-height: var(--rail-track-y-max, none);
          width: auto;
          overflow-x: hidden;
          overflow-y: auto;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"] .ui-line {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"] .ui-line::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-draggable="true"] {
          cursor: grab;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-draggable="true"]:active {
          cursor: grabbing;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"] .button,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"] [data-action] {
          cursor: pointer;
        }
`;
    },
    fields() {
      return `
        .panel .field {
          height: var(--control-height);
          border: var(--control-border);
          border-radius: var(--control-radius);
          padding: 0 var(--control-pad-x);
          box-sizing: border-box;
          outline: none;
          background: #fff;
          color: inherit;
          font-size: var(--control-font-size);
        }
        .panel .field:focus {
          box-shadow: var(--control-focus-ring);
        }
        .panel .field-input {
          width: 100%;
        }
        .panel .field-select {
          min-width: calc(var(--control-font-size) * 7);
        }
        .panel .row {
          display: flex;
          align-items: center;
          gap: var(--control-gap);
        }
        .panel .actions {
          display: flex;
          align-items: center;
          gap: var(--control-gap);
        }
`;
    },
    run() {
      return sheet.join([
        sheet.base.tokens,
        sheet.base.panel,
        sheet.base.toolbar,
        sheet.base.fields,
      ]);
    },
  },
};

const skin = {
  proofread: `
    #proofread-panel {
      --control-height: var(--surface-toolbar-button-size);
      --control-gap: var(--panel-row-gap);
      --proofread-col-unit: var(--surface-toolbar-button-size);
      --proofread-tools-count: 4;
      --proofread-col-main: calc(var(--proofread-col-unit) * 5.4);
      --proofread-col-field: var(--proofread-col-main);
      --proofread-col-tools: calc(
        var(--surface-button-size) * var(--proofread-tools-count) +
        var(--control-gap) * (var(--proofread-tools-count) - 1)
      );
      --proofread-field-width: var(--proofread-col-field);
      --proofread-row-height: var(--control-height);
      --proofread-header-gap: calc(var(--panel-pad) * 0.6);
      --proofread-header-height: calc(
        var(--control-height) +
        var(--panel-row-gap) * 4 -
        var(--proofread-header-gap)
      );
      --proofread-row-step: calc(
        var(--proofread-row-height) +
        var(--panel-row-gap) * 2 +
        var(--proofread-row-border-width)
      );
      --proofread-text-max-width: calc(var(--control-font-size) * 16.9);
      --proofread-cols-gap: calc(var(--panel-row-gap) * 2.2);
      --proofread-progress-inset: calc(var(--panel-pad) * 1.6);
      --proofread-progress-offset: calc(var(--panel-row-gap) * 0.9);
      --proofread-content-width: calc(
        var(--proofread-col-main) +
        var(--proofread-col-field) +
        var(--proofread-col-tools) +
        var(--proofread-cols-gap) * 2
      );
      --proofread-panel-width: calc(
        var(--proofread-content-width) +
        var(--panel-pad) * 2
      );
      --proofread-row-border-width: 1px;
      --proofread-row-border: var(--surface-proofread-light-row-border);
      --proofread-active-background: var(--surface-proofread-light-active-background);
      --proofread-active-inset-color: var(--surface-proofread-light-active-inset);
      --proofread-message-text: var(--surface-proofread-light-message-text);
      --proofread-empty-text: var(--surface-proofread-light-empty-text);
      --proofread-note-background: var(--surface-proofread-light-note-background);
      --proofread-note-border: var(--surface-proofread-light-note-border);
      --proofread-note-shadow: var(--surface-proofread-light-note-shadow);
      --control-focus-ring-color: var(--surface-proofread-focus-ring-light);
      --proofread-panel-bg: var(--surface-toolbar-light-panel-bg);
      --proofread-panel-border: var(--surface-toolbar-light-panel-border);
      --proofread-panel-shadow: var(--surface-toolbar-light-panel-shadow);
      left: 50%;
      top: 92px;
      right: auto;
      width: min(var(--proofread-panel-width), calc(100vw - 40px));
      max-width: min(var(--proofread-panel-width), calc(100vw - 40px));
      min-width: 320px;
      padding: var(--panel-pad);
      overflow-x: hidden;
      overflow-y: hidden;
      transform: translateX(-50%);
      border: 1px solid var(--proofread-panel-border) !important;
      border-radius: calc(var(--panel-radius) + 2px);
      background: var(--proofread-panel-bg) !important;
      box-shadow: var(--proofread-panel-shadow) !important;
      backdrop-filter: var(--surface-toolbar-glass-backdrop);
      -webkit-backdrop-filter: var(--surface-toolbar-glass-backdrop);
      transition: height 0.18s ease;
    }
    #proofread-panel[data-theme="dark"] {
      --proofread-row-border: var(--surface-proofread-dark-row-border);
      --proofread-active-background: var(--surface-proofread-dark-active-background);
      --proofread-active-inset-color: var(--surface-proofread-dark-active-inset);
      --proofread-message-text: var(--surface-proofread-dark-message-text);
      --proofread-empty-text: var(--surface-proofread-dark-empty-text);
      --proofread-note-background: var(--surface-proofread-dark-note-background);
      --proofread-note-border: var(--surface-proofread-dark-note-border);
      --proofread-note-shadow: var(--surface-proofread-dark-note-shadow);
      --control-focus-ring-color: var(--surface-proofread-focus-ring-dark);
      --proofread-panel-bg: var(--surface-toolbar-dark-panel-bg);
      --proofread-panel-border: var(--surface-toolbar-dark-panel-border);
      --proofread-panel-shadow: var(--surface-toolbar-dark-panel-shadow);
      color: var(--surface-proofread-panel-text-dark);
    }
    #proofread-panel [data-header] {
      position: relative;
      display: block;
      padding: 0 var(--panel-pad);
      margin: 0 0 var(--proofread-header-gap);
      cursor: grab;
    }
    #proofread-panel [data-header]:active {
      cursor: grabbing;
    }
    #proofread-panel [data-header] button,
    #proofread-panel [data-header] input,
    #proofread-panel [data-header] select,
    #proofread-panel [data-header] a {
      cursor: pointer;
    }
    #proofread-panel [data-header] .ui-shell {
      min-height: var(--proofread-header-height);
    }
    #proofread-panel [data-status] {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }
    #proofread-mode {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    #proofread-panel [data-tabs] {
      display: flex;
      align-items: center;
      gap: calc(var(--surface-icon-box-gap) * 0.55);
    }
    #proofread-list [data-tools-row] {
      display: flex;
      align-items: center;
      gap: var(--surface-icon-box-gap);
    }
    #proofread-panel [data-tabs] {
      min-width: 0;
      width: auto;
      justify-content: flex-start;
      position: relative;
    }
    #proofread-panel[data-tools-ready="false"] [data-tabs] {
      visibility: hidden;
    }
    #proofread-panel[data-loading="true"] [data-tabs] {
      visibility: visible;
    }
    #proofread-panel[data-loading="true"][data-loading-source="languagetool"] [data-source="languagetool"] [data-icon] img,
    #proofread-panel[data-loading="true"][data-loading-source="llm"] [data-source="llm"] [data-icon] img {
      animation: proofread-logo-spin 1s linear infinite;
      transform-origin: 50% 50%;
    }
    #proofread-panel [data-progress] {
      display: none;
    }
    #proofread-panel[data-done="true"] [data-status] {
      display: none;
    }
    #proofread-panel[data-done="false"] {
      --proofread-loading-logo-size: 34px;
      overflow: hidden;
    }
    #proofread-panel[data-done="false"] [data-tabs] {
      display: none !important;
    }
    #proofread-panel[data-done="false"] [data-header] .ui-shell {
      display: none !important;
    }
    #proofread-panel[data-done="false"] [data-header] {
      margin: 0;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
    }
    #proofread-panel[data-done="false"] [data-status] {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0 auto;
    }
    #proofread-panel[data-done="false"] #proofread-title {
      margin-left: 0 !important;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    #proofread-panel[data-done="false"] #proofread-list {
      display: none;
    }
    #proofread-panel [data-progress-bar] {
      display: block;
      width: min(var(--proofread-progress, 0%), 100%);
      max-width: 100%;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #f1ce4f 0%, #e6b800 100%);
      opacity: 0.95;
      transition: width 0.2s ease;
    }
    #proofread-panel [data-status] {
      min-height: 0;
      color: var(--proofread-empty-text);
      font-size: 12px;
      line-height: 1.2;
    }
    #proofread-panel[data-done="false"] [data-status] {
      font-size: calc(var(--panel-font-size) * 1.5);
      line-height: 1.15;
      font-weight: 700;
    }
    #proofread-model,
    #proofread-title,
    #proofread-list [data-main] span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    #proofread-panel[data-done="false"] #proofread-model,
    #proofread-panel[data-done="false"] #proofread-title {
      overflow: visible;
      text-overflow: clip;
      white-space: normal;
    }
    #proofread-model,
    #proofread-title {
      display: inline-block;
      max-width: 100%;
      vertical-align: top;
    }
    #proofread-title:not(:empty) {
      margin-left: 8px;
      font-weight: 700;
    }
    #proofread-panel [data-status-logo] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    #proofread-panel [data-status-logo] img {
      width: 18px;
      height: 18px;
      display: block;
      border-radius: 5px;
      pointer-events: none;
      -webkit-user-drag: none;
      user-select: none;
    }
    #proofread-panel[data-done="false"] [data-status-logo] img {
      width: calc(var(--proofread-loading-logo-size) - 10px);
      height: calc(var(--proofread-loading-logo-size) - 10px);
      border-radius: 8px;
      position: relative;
      z-index: 2;
    }
    #proofread-panel[data-done="false"] [data-status-logo] {
      position: relative;
      width: var(--proofread-loading-logo-size);
      height: var(--proofread-loading-logo-size);
    }
    #proofread-panel[data-done="false"] [data-status-logo]::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 999px;
      border: 2px solid color-mix(in srgb, currentColor 24%, transparent);
      border-top-color: color-mix(in srgb, currentColor 78%, transparent);
      animation: proofread-logo-spin 1s linear infinite;
      z-index: 1;
    }
    @keyframes proofread-logo-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    #proofread-panel .proofread-tab {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-size: var(--control-font-size);
      white-space: nowrap;
    }
    #proofread-panel .proofread-tab.toolbar-unified-button {
      min-width: auto;
      width: auto;
      max-width: none;
      padding: 0 8px;
    }
    #proofread-panel .proofread-source-strip {
      gap: 4px;
    }
    #proofread-panel .proofread-tab [data-icon] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    #proofread-panel .proofread-tab [data-icon] img {
      display: block;
      border-radius: 3px;
    }
    #proofread-panel .proofread-tab [data-count] {
      font-size: 0.9em;
      line-height: 1;
      opacity: 0.92;
      min-width: 1.25em;
      height: 1.25em;
      padding: 0 0.28em;
      margin-left: 2px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: color-mix(in srgb, currentColor 16%, transparent);
    }
    #proofread-panel .proofread-icon {
      border-radius: 3px;
    }
    #proofread-panel[data-done="false"] #proofread-theme {
      display: none;
    }
    #proofread-panel [data-source][data-active="true"] {
      font-weight: 700;
    }
    #proofread-list {
      max-height: calc(var(--proofread-row-height) * 4.2 + var(--panel-row-gap) * 10);
      overflow-x: visible;
      overflow-y: auto;
      padding-right: 0;
      margin-right: 0;
      scroll-snap-type: y proximity;
      scroll-padding: var(--panel-row-gap) 0;
      scrollbar-width: none !important;
      scrollbar-color: transparent transparent !important;
      -ms-overflow-style: none !important;
      transition: max-height 0.18s ease;
    }
    #proofread-list::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
      background: transparent !important;
    }
    #proofread-list::-webkit-scrollbar-thumb,
    #proofread-list::-webkit-scrollbar-track {
      background: transparent !important;
      border: 0 !important;
    }
    #proofread-list [data-row] {
      position: relative;
      display: flex;
      align-items: center;
      min-height: calc(var(--proofread-row-height) + var(--panel-row-gap) * 2);
      padding: var(--panel-row-gap) var(--panel-pad);
      border-top: var(--proofread-row-border-width) solid var(--proofread-row-border);
      scroll-snap-align: start;
    }
    #proofread-list [data-row][data-active="true"] {
      background: linear-gradient(90deg, var(--proofread-active-background) 0, var(--proofread-active-background) 20%, transparent 48%);
      box-shadow: inset calc(var(--panel-font-size) * 0.23) 0 0 var(--proofread-active-inset-color);
    }
    #proofread-list [data-row][data-active="true"] [data-main] span {
      padding-left: calc(var(--panel-font-size) * 0.23 + var(--panel-row-gap) * 0.45);
    }
    #proofread-list .proofread-line {
      display: grid;
      grid-template-columns: var(--proofread-col-main) var(--proofread-col-field) var(--proofread-col-tools);
      align-items: center;
      column-gap: var(--proofread-cols-gap);
      row-gap: 0;
      width: 100%;
      min-height: var(--proofread-row-height);
    }
    #proofread-list [data-main] {
      display: contents;
    }
    #proofread-list [data-main] span {
      grid-column: 1;
      max-width: var(--proofread-text-max-width);
      min-width: 0;
      font-weight: 400;
      cursor: pointer;
    }
    #proofread-list [data-main] select,
    #proofread-list [data-main] input,
    #proofread-list [data-select],
    #proofread-list [data-input] {
      grid-column: 2;
      width: var(--proofread-col-field);
      min-width: var(--proofread-col-field);
      max-width: var(--proofread-col-field);
      padding-right: calc(var(--control-font-size) * 1.45);
    }
    #proofread-list [data-tools-row] {
      grid-column: 3;
      width: var(--proofread-col-tools);
      justify-content: flex-end;
    }
    #proofread-list [data-input] {
      display: none;
    }
    #proofread-list [data-go] {
      display: none !important;
    }
    #proofread-list [data-row][data-note]::after {
      content: attr(data-note);
      position: absolute;
      right: calc(100% + 10px);
      top: 50%;
      z-index: 6;
      display: none;
      width: max-content;
      max-width: min(520px, calc(100vw - 80px));
      padding: 7px 8px;
      transform: translateY(-50%);
      border: 1px solid var(--proofread-note-border);
      border-radius: 8px;
      background: var(--proofread-note-background);
      color: var(--proofread-message-text);
      box-shadow: var(--proofread-note-shadow);
      font-size: var(--proofread-message-font-size);
      line-height: 1.35;
      white-space: normal;
    }
    #proofread-list [data-row][data-note]:hover::after {
      display: block;
    }
    #proofread-list [data-empty] {
      padding: var(--panel-row-gap) var(--panel-pad);
      color: var(--proofread-empty-text);
    }
    #proofread-panel .field {
      outline: none;
    }
    #proofread-panel .field-select:hover {
      background: var(--surface-proofread-field-hover-light);
    }
    #proofread-panel .field:focus {
      border-color: currentColor;
      box-shadow: none;
    }
    #proofread-panel[data-theme="dark"] .field {
      background: var(--surface-proofread-field-bg-dark);
      color: var(--surface-proofread-field-text-dark);
      border-color: var(--surface-proofread-field-border-dark);
    }
    #proofread-panel[data-theme="dark"] .field-select:hover {
      background: var(--surface-proofread-field-hover-dark);
      border-color: var(--surface-proofread-field-hover-border-dark);
    }
    #proofread-panel[data-theme="dark"] .field-select {
      color-scheme: light;
    }
    @media (pointer: coarse) {
      #proofread-panel[data-theme="dark"] .field-select {
        color-scheme: dark;
      }
    }
    #proofread-panel .field-select option {
      background: #f4f5f7;
      color: #1a1a1a;
    }
    #proofread-panel .field-select option:hover {
      background: #d8dde6;
      color: #111111;
    }
    #proofread-panel[data-theme="dark"] .field-select option {
      background: #2f2f2f;
      color: #f2f2f2;
    }
    #proofread-panel[data-theme="dark"] .field-select option:hover {
      background: #202020;
      color: #ffffff;
    }
    @media (max-width: 820px) {
      #proofread-panel {
        left: 0 !important;
        right: 0 !important;
        top: 0 !important;
        width: 100vw !important;
        max-width: none !important;
        height: 100vh !important;
        transform: none !important;
        border: 0 !important;
      }
      #proofread-panel [data-header] .ui-shell {
        width: 100%;
        flex-wrap: wrap;
        row-gap: var(--surface-group-gap);
      }
      #proofread-list {
        max-height: calc(100vh - 130px);
      }
    }
  `,
  readmore: `
    .readmore-panel {
      --control-gap: 10px;
      width: min(560px, calc(100vw - 24px));
      padding: 10px;
    }
    .readmore-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 10px 0;
    }
    .readmore-actions {
      display: grid;
      grid-template-columns: var(--control-height) 1fr var(--control-height);
      align-items: center;
      gap: var(--control-gap);
      margin-top: 10px;
    }
    .readmore-title {
      margin-bottom: 8px;
      text-align: center;
      font-size: 11px;
      font-weight: 700;
    }
    .readmore-center {
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      line-height: var(--control-height);
    }
    .readmore-input {
      flex: 1;
    }
    .readmore-input[data-ready="true"] {
      border-color: #32a852;
      box-shadow: 0 0 0 3px #32a8521f;
    }
    @media (max-width: 700px) {
      .readmore-panel {
        width: calc(100vw - 16px);
        padding: 10px;
      }
    }
  `,
  clone: `
    .clone-panel {
      --panel-font-family: Arial, sans-serif;
      --panel-font-size: 10px;
      --panel-line-height: 1.4;
      right: 20px;
      top: 40px;
      max-width: 390px;
      padding: 14px 16px;
      border: 0;
      border-radius: 10px;
      color: #fff;
      white-space: pre-line;
      box-shadow: 0 8px 30px #00000059;
    }
    .clone-panel[data-tone="work"] {
      background: #111;
    }
    .clone-panel[data-tone="error"] {
      background: #7a0000;
    }
  `,
  filter: `
    #filter-progress {
      top: var(--surface-filter-progress-top);
      left: 50%;
      width: var(--surface-filter-progress-width);
      padding: var(--surface-filter-panel-pad);
      transform: translateX(-50%);
      border: 1px solid var(--surface-filter-panel-border);
      text-align: center;
      font: inherit;
    }
    #filter-progress .progress-track {
      border-color: var(--surface-filter-panel-border);
    }
    #filter-panel,
    #filter-panel * {
      box-sizing: border-box;
    }
    #filter-panel {
      text-align: center;
      font: inherit;
      font-family: var(--panel-font-family);
      font-size: var(--panel-font-size);
      line-height: var(--panel-line-height);
    }
    #filter-panel .filter-overlay {
      position: fixed;
      inset: 0;
      z-index: 999998;
    }
    #filter-panel .filter-box {
      position: fixed;
      top: var(--surface-filter-modal-top);
      left: 50%;
      z-index: 999999;
      width: max-content;
      padding: var(--surface-filter-panel-pad);
      transform: translateX(-50%);
      border: 1px solid var(--surface-filter-panel-border);
      background: #fff;
      color: inherit;
    }
    #filter-panel[data-theme="dark"] .filter-box {
      border-color: var(--surface-toolbar-dark-panel-border);
      background: var(--surface-toolbar-dark-panel-bg);
      color: var(--surface-toolbar-capsule-text-dark);
      box-shadow: var(--surface-toolbar-dark-panel-shadow);
    }
    #filter-panel[data-theme="light"] .filter-box {
      border-color: var(--surface-toolbar-light-panel-border);
      background: var(--surface-toolbar-light-panel-bg);
      color: var(--surface-toolbar-capsule-text-light);
      box-shadow: var(--surface-toolbar-light-panel-shadow);
    }
    #filter-panel .ui-stack-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--surface-filter-row-gap);
      margin: var(--surface-filter-row-margin-top) 0 var(--surface-filter-row-margin-bottom);
    }
    #filter-panel .ui-stack-row[data-header] .ui-shell {
      width: 100%;
      justify-content: space-between;
      align-items: center;
    }
    #filter-panel .filter-nav-group .ui-group-body {
      display: flex;
      align-items: center;
      gap: var(--surface-filter-row-gap);
    }
    #filter-panel .ui-stack-row + .ui-stack-row {
      margin-top: var(--surface-filter-separator-margin-top);
      padding-top: var(--surface-filter-separator-pad-top);
      border-top: 1px solid var(--surface-filter-panel-border);
    }
    #filter-panel[data-theme="dark"] .ui-stack-row + .ui-stack-row {
      border-top-color: var(--surface-toolbar-dark-panel-border);
    }
    #filter-panel[data-theme="light"] .ui-stack-row + .ui-stack-row {
      border-top-color: var(--surface-toolbar-light-panel-border);
    }
    #filter-panel .filter-period {
      min-width: var(--surface-filter-period-min-width);
      text-align: center;
      font-weight: 600;
    }
    #filter-panel .filter-button,
    #filter-panel .filter-current {
      min-height: var(--surface-filter-button-min-height);
      padding: var(--surface-filter-button-pad-y) var(--surface-filter-button-pad-x);
      line-height: 1.2;
      text-align: center;
      white-space: nowrap;
    }
    #filter-panel .filter-sections {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }
    #filter-panel .filter-section {
      width: var(--surface-filter-button-min-height);
      height: var(--surface-filter-button-min-height);
      min-height: var(--surface-filter-button-min-height);
      padding: 0;
      margin: 0;
    }
    #filter-panel .filter-current {
      border: 1px solid var(--surface-filter-current-border);
      background: var(--surface-filter-current-background);
      color: var(--surface-filter-current-text);
      font-weight: 600;
      cursor: pointer;
      box-shadow: inset 0 0 0 1px var(--surface-filter-current-inset);
    }
    #filter-panel .filter-mini {
      width: var(--surface-filter-button-min-height);
      height: var(--surface-filter-button-min-height);
      min-height: var(--surface-filter-button-min-height);
      padding: 0;
      text-align: center;
    }
    #filter-panel .filter-mini.button-emoji {
      font-size: calc(var(--control-font-size) + 2px);
    }
    #filter-panel .filter-mini:disabled {
      opacity: 0.45;
      cursor: default;
    }
  `,
  diff: `
    #odi-panel {
      --panel-font-family: Arial, sans-serif;
      --panel-font-size: 10px;
      --panel-line-height: 1.35;
      right: 16px;
      bottom: 16px;
      padding: 10px 12px;
      border: 0;
      border-radius: 8px;
      background: #111;
      color: #fff;
      box-shadow: 0 4px 18px #00000040;
    }
    #odi-panel b {
      color: #9fe870;
    }
    #odi-panel hr {
      margin: 6px 0;
      border: 0;
      border-top: 1px solid #444;
    }
  `,
};

const cssReader = {
  color(theme) {
    if (theme === "light")
      return {
        background: design.surface.reader.palette.lightBackground,
        color: design.surface.reader.palette.lightText,
        fade: design.surface.reader.palette.lightFade,
        shade: design.surface.reader.palette.lightShade,
        shadow: design.surface.reader.palette.lightShadow,
      };
    return {
      background: design.surface.reader.palette.darkBackground,
      color: design.surface.reader.palette.darkTextMain,
      fade: design.surface.reader.palette.darkFade,
      shade: design.surface.reader.palette.darkShade,
      shadow: design.surface.reader.palette.darkShadow,
    };
  },
  text({ theme, panel }) {
    const color = cssReader.color(theme);
    const fade = design.surface.reader.fade;
    return `
        html,
        body,
        body.reader-active,
        
        #wpwrap,
        #wpcontent,
        #wpbody,
        #wpbody-content,
        .wrap,
        #post,
        #poststuff,
        #post-body,
        #post-body-content,
        #postdivrich,
        #wp-content-wrap,
        #wp-content-editor-container{
          margin:0!important;
          padding:0!important;
          width:100%!important;
          max-width:none!important;
          height:auto!important;
          overflow:visible!important;
          background:${color.background}!important
        }
        #adminmenuback,
        #adminmenuwrap,
        #wpadminbar,
        #screen-meta,
        #screen-meta-links,
        #titlediv,
        .hndle,
        .title-preview,
        #postbox-container-1,
        #postbox-container-2,
        #wp-content-editor-tools,
        #ed_toolbar{
          display:none!important
        }
        #content{
          position:fixed!important;
          left:0!important;
          top:0!important;
          z-index:999999!important;
          width:100vw!important;
          height:100vh!important;
          min-height:0!important;
          box-sizing:border-box!important;
          padding:var(--surface-reader-css-content-padding)!important;
          border:0!important;
          border-radius:0!important;
          appearance:none!important;
          -webkit-appearance:none!important;
          box-shadow:none!important;
          outline:none!important;
          resize:none!important;
          background:${color.background}!important;
          color:${color.color}!important;
          caret-color:${color.color}!important;
          font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;
          font-size:var(--surface-reader-css-content-font-size)!important;
          line-height:var(--surface-reader-css-content-line-height)!important;
          letter-spacing:.01em!important;
          white-space:pre-wrap!important;
          overflow:auto!important;
          overflow-x:hidden!important;
          -webkit-overflow-scrolling:touch!important;
          overscroll-behavior:contain!important;
          overscroll-behavior-x:none!important;
          touch-action:auto!important;
          -webkit-text-size-adjust:100%!important;
          word-break:break-word!important;
          overflow-wrap:anywhere!important
        }
        html,
        body,
        body.reader-active,
        body.reader-active{
          overflow-x:hidden!important
        }
        #${panel}{
          position:fixed!important;
          left:0!important;
          right:0!important;
          top:0!important;
          bottom:auto!important;
          z-index:1000000!important;
          height:64px!important;
          box-sizing:border-box!important;
          display:flex!important;
          align-items:center!important;
          justify-content:center!important;
          gap:var(--surface-group-gap, var(--surface-reader-css-panel-gap))!important;
          padding:0 12px!important;
          pointer-events:none!important;
          border:0!important;
          border-radius:0!important;
          box-shadow:none!important;
          background:transparent!important
        }
        #${panel} .reader-header-shell{
          display:flex!important;
          align-items:center!important;
          justify-content:center!important;
          gap:var(--rail-gap, var(--surface-reader-css-shell-gap))!important;
          width:max-content!important;
          max-width:100%!important;
          margin:0 auto!important;
          padding:0!important;
          border:0!important;
          border-radius:0!important;
          background:transparent!important;
          box-shadow:none!important;
          backdrop-filter:none!important;
          -webkit-backdrop-filter:none!important;
          pointer-events:none!important
        }
        #${panel} .ui-button[data-disabled="true"]{
          opacity:.45!important;
          pointer-events:none!important;
          cursor:default!important
        }
        #${panel}::after{
          content:""!important;
          position:absolute!important;
          left:-1px!important;
          right:calc(var(--reader-scrollbar-gap,0px) - 1px)!important;
          top:-1px!important;
          height:${fade.topHeight}px!important;
          background:linear-gradient(
            to bottom,
            ${color.background} 0%,
            ${color.background} ${fade.stopSolid}%,
            ${color.shade} ${fade.stopShade}%,
            ${color.shadow} ${fade.stopShadow}%,
            ${color.fade} 100%
          )!important;
          z-index:-1!important;
          border-radius:0!important
        }
        #${panel}-bottom{
          position:fixed!important;
          left:0!important;
          right:var(--reader-scrollbar-gap,0px)!important;
          bottom:0!important;
          height:${fade.bottomHeight}px!important;
          pointer-events:none!important;
          z-index:1000000!important;
          background:linear-gradient(
            to top,
            ${color.background} 0%,
            ${color.background} ${fade.stopSolid}%,
            ${color.shade} ${fade.stopShade}%,
            ${color.shadow} ${fade.stopShadow}%,
            ${color.fade} 100%
          )!important
        }
        #${panel} .button{
          pointer-events:auto!important
        }
        #${panel} .button[data-disabled="true"]{
          pointer-events:none!important
        }
      `;
  },
};

const cssEditor = {
  text() {
    return `
        @media (pointer: coarse) {
          #content,
          #title {
            font-size: 16px !important;
          }
        }
        #editor-panel {
          --editor-visible-x: 10;
          --editor-visible-y: 5;
        }
        #editor-panel[data-layout="fullscreen"][data-mobile="true"][data-keyboard-open="true"] [data-sticky-group="left"] {
          display: none !important;
        }
        #editor-panel[data-mobile="true"] [data-action="scroll"] {
          display: none !important;
        }
      `;
  },
};

const cssUi = {
  popup() {
    return `
      #ui-popup,
      #ui-popup{
        position:fixed;
        inset:0;
        z-index:1000005;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:var(--surface-popup-overlay-pad);
        background:var(--surface-popup-overlay-background);
        backdrop-filter:var(--surface-popup-overlay-blur);
        -webkit-backdrop-filter:var(--surface-popup-overlay-blur);
      }
      #ui-popup[hidden],
      #ui-popup[hidden]{
        display:none!important;
      }
      #ui-popup .panel,
      #ui-popup .panel{
        position:relative;
        max-width:min(var(--surface-popup-panel-max-width),96vw);
        width:min(var(--surface-popup-panel-max-width),96vw);
        max-height:var(--surface-popup-panel-max-height);
        overflow-y:auto;
        overflow-x:hidden;
        --surface-button-size: var(--surface-toolbar-button-size);
        --surface-emoji-icon-size: calc(var(--surface-button-size) * 0.84);
        --popup-font-size: calc(var(--panel-font-size) + var(--surface-popup-font-boost));
        font-size: var(--popup-font-size);
        padding:var(--surface-popup-panel-pad);
      }
      #ui-popup .ui-nav,
      #ui-popup .ui-nav{
        display:grid;
        grid-template-columns:auto 1fr auto;
        gap:var(--surface-popup-nav-gap);
        align-items:center;
        margin:0 0 var(--surface-popup-nav-margin-bottom);
      }
      #ui-popup .ui-nav-label,
      #ui-popup .ui-nav-label{
        min-height:var(--surface-popup-nav-label-min-height);
        border-radius:999px;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:0 var(--surface-popup-nav-label-pad-x);
        border:var(--control-border);
        background:var(--control-background);
        font:600 calc(var(--popup-font-size) + 0px)/1.2 var(--panel-font-family);
      }
      #ui-popup .ui-head,
      #ui-popup .ui-head{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:var(--surface-popup-row-gap);
        margin:0 0 var(--surface-popup-head-margin-bottom);
      }
      #ui-popup .ui-title,
      #ui-popup .ui-title{
        font:600 calc(var(--popup-font-size) + 2px)/1.35 var(--panel-font-family);
        margin:0;
        white-space:normal;
        overflow-wrap:anywhere;
        word-break:break-word;
      }
      #ui-popup .ui-field,
      #ui-popup .ui-field{
        display:block;
        width:100%;
        box-sizing:border-box;
        min-height:var(--surface-popup-field-min-height);
        border:var(--control-border);
        border-radius:var(--surface-popup-field-radius);
        padding:var(--surface-popup-field-pad-y) var(--surface-popup-field-pad-x);
        background:var(--surface-popup-field-light-background);
        color:inherit;
        font:400 calc(var(--popup-font-size) + 1px)/1.45 var(--panel-font-family);
        resize:var(--surface-popup-field-resize);
        outline:none;
      }
      #ui-popup .panel[data-ui-surface="toolbar"][data-theme="dark"] .ui-field,
      #ui-popup .panel[data-ui-surface="toolbar"][data-theme="dark"] .ui-field{
        background:var(--surface-popup-field-dark-background);
        border-color:var(--surface-toolbar-dark-panel-border);
        color:var(--surface-toolbar-dark-text);
      }
      #ui-popup .panel[data-ui-surface="toolbar"][data-theme="light"] .ui-field,
      #ui-popup .panel[data-ui-surface="toolbar"][data-theme="light"] .ui-field{
        background:var(--surface-popup-field-light-background);
        border-color:var(--surface-toolbar-light-panel-border);
      }
      #ui-popup .ui-field:focus,
      #ui-popup .ui-field:focus{
        box-shadow:var(--surface-popup-field-focus-shadow);
      }
      #ui-popup .ui-row,
      #ui-popup .ui-row{
        display:flex;
        gap:var(--surface-popup-row-gap);
        align-items:center;
        justify-content:space-between;
        margin-top:var(--surface-popup-row-margin-top);
        min-width:0;
      }
      #ui-popup .actions,
      #ui-popup .actions{
        display:flex;
        align-items:center;
        gap:var(--surface-popup-row-gap);
        flex:0 0 auto;
      }
      #ui-popup .ui-counter-pill,
      #ui-popup .ui-counter-pill,
      #reader-fields-popup .ui-counter-pill{
        --counter-inset:var(--surface-popup-counter-inset);
        --counter-inner-radius:calc(999px - var(--counter-inset));
        --counter-pad-x:var(--surface-popup-counter-pad-x,10px);
        --counter-min-height:var(--surface-popup-counter-min-height,30px);
        --counter-over-border:var(--surface-popup-counter-over-border);
        --counter-base-background:var(--surface-popup-counter-base-background);
        --counter-fill-background:var(--surface-popup-counter-fill-background);
        --counter-overflow-background:var(--surface-popup-counter-overflow-background);
        --counter-text-display:inline;
        position:relative;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        border-radius:999px;
        overflow:hidden;
        border:var(--control-border);
        background:var(--counter-base-background);
        color:inherit;
        padding:0 var(--counter-pad-x);
        min-height:var(--counter-min-height);
      }
      #ui-popup .ui-counter-pill .ui-counter-fill,
      #ui-popup .ui-counter-pill .ui-counter-fill,
      #reader-fields-popup .ui-counter-pill .ui-counter-fill{
        position:absolute;
        inset:var(--counter-inset);
        border-radius:var(--counter-inner-radius);
        transform-origin:left center;
        transform:scaleX(calc(var(--counter-progress, 0) / 100));
        background:var(--counter-fill-background);
        pointer-events:none;
        transition:transform .22s ease;
      }
      #ui-popup .ui-counter-pill .ui-counter-overflow,
      #ui-popup .ui-counter-pill .ui-counter-overflow,
      #reader-fields-popup .ui-counter-pill .ui-counter-overflow{
        position:absolute;
        inset:var(--counter-inset);
        border-radius:var(--counter-inner-radius);
        transform-origin:right center;
        transform:scaleX(calc(var(--counter-overflow, 0) / 100));
        background:var(--counter-overflow-background);
        pointer-events:none;
        transition:transform .2s ease;
      }
      #ui-popup .ui-counter-pill .ui-counter-text,
      #ui-popup .ui-counter-pill .ui-counter-text,
      #reader-fields-popup .ui-counter-pill .ui-counter-text{
        display:var(--counter-text-display);
        position:relative;
        z-index:1;
        font:600 calc(var(--popup-font-size) - 2px)/1 var(--panel-font-family);
        letter-spacing:.02em;
      }
      #ui-popup .ui-counter-pill,
      #ui-popup .ui-counter-pill{
        --counter-pad-x:12px;
        --counter-min-height:calc(var(--surface-button-size) - 6px);
        --counter-over-border:var(--surface-popup-counter-over-border);
        width:min(228px,46vw);
        min-width:160px;
        max-width:100%;
        height:calc(var(--surface-button-size) - 6px);
        border:1px solid transparent;
        opacity:var(--surface-popup-counter-opacity);
      }
      #ui-popup .panel[data-ui-surface="toolbar"][data-theme="dark"] .ui-counter-pill,
      #ui-popup .panel[data-ui-surface="toolbar"][data-theme="dark"] .ui-counter-pill{
        --counter-base-background:var(--surface-popup-counter-base-background-dark);
        color:var(--surface-toolbar-dark-text);
      }
      #ui-popup .panel[data-ui-surface="toolbar"][data-theme="light"] .ui-counter-pill,
      #ui-popup .panel[data-ui-surface="toolbar"][data-theme="light"] .ui-counter-pill{
        --counter-base-background:var(--surface-popup-counter-base-background-light);
        color:var(--surface-toolbar-light-text);
      }
      #ui-popup .ui-counter-pill[data-over="true"],
      #ui-popup .ui-counter-pill[data-over="true"]{
        border-color:var(--counter-over-border);
      }
      #reader-fields-popup{
        position:fixed;
        inset:0;
        z-index:1000004;
        display:flex;
        justify-content:center;
        background:var(--surface-popup-overlay-background);
        backdrop-filter:var(--surface-popup-overlay-blur);
        -webkit-backdrop-filter:var(--surface-popup-overlay-blur);
      }
      #reader-fields-popup[data-mode="phone"]{
        align-items:flex-start;
        padding-top:56px;
      }
      #reader-fields-popup[data-mode="desktop"]{
        align-items:center;
        padding:16px;
      }
      #reader-fields-popup .panel{
        --popup-font-size:16px;
        width:min(98ch,calc(100vw - 40px));
        min-width:min(98ch,calc(100vw - 40px));
        max-width:min(98ch,calc(100vw - 40px));
        height:auto;
        max-height:calc(100vh - 84px);
        min-height:0;
        overflow:hidden;
        padding:14px;
        border-radius:18px!important;
        font-size:var(--popup-font-size);
        display:flex;
        flex-direction:column;
      }
      #reader-fields-popup [data-fields-header="true"]{
        min-height:40px;
        align-items:center;
        cursor:grab;
      }
      #reader-fields-popup [data-fields-header="true"] *{
        cursor:inherit;
      }
      #reader-fields-popup[data-dragging="true"] [data-fields-header="true"]{
        cursor:grabbing;
      }
      #reader-fields-popup[data-dragging="true"] [data-fields-header="true"] *{
        cursor:inherit;
      }
      #reader-fields-popup [data-fields-header="true"] button,
      #reader-fields-popup [data-fields-header="true"] input,
      #reader-fields-popup [data-fields-header="true"] select,
      #reader-fields-popup [data-fields-header="true"] a,
      #reader-fields-popup [data-fields-header="true"] [data-action]{
        cursor:pointer!important;
      }
      #reader-fields-popup .reader-fields-modes,
      #reader-fields-popup .reader-fields-system,
      #reader-fields-popup .reader-fields-counter-group{
        align-self:auto;
      }
      #reader-fields-popup [data-fields-body]{
        margin-top:12px;
        display:flex;
        flex-direction:column;
        gap:10px;
        flex:1 1 auto;
        min-height:0;
        padding-right:2px;
        overflow:hidden;
      }
      #reader-fields-popup .reader-fields-row{
        display:grid;
        grid-template-columns:minmax(0,1fr);
        gap:10px;
        align-items:center;
      }
      #reader-fields-popup .reader-fields-input{
        display:block;
        width:100%;
        min-height:38px;
        max-width:100%;
        box-sizing:border-box;
        border:var(--control-border);
        border-radius:var(--panel-radius);
        padding:8px 10px;
        background:var(--surface-popup-field-light-background);
        color:inherit;
        font:400 calc(var(--popup-font-size) - 1px)/1.3 var(--panel-font-family);
        opacity:1;
      }
      #reader-fields-popup .reader-fields-input[data-multiline="true"]{
        min-height:302px;
        resize:none;
      }
      #reader-fields-popup .reader-fields-input--excerpt{
        min-height:0;
        max-height:none;
        overflow:auto;
        scrollbar-width:none;
        -ms-overflow-style:none;
      }
      #reader-fields-popup .reader-fields-input--excerpt-plain{
        border:0;
        border-radius:0;
        background:transparent;
        padding:0;
      }
      #reader-fields-popup .reader-fields-input--excerpt::-webkit-scrollbar{
        width:0;
        height:0;
      }
      #reader-fields-popup .reader-fields-input--slug{
        min-height:38px;
        max-height:38px;
      }
      #reader-fields-popup .reader-fields-preview{
        min-height:302px;
        max-width:100%;
        border:var(--control-border);
        border-radius:var(--panel-radius);
        padding:10px;
        background:var(--surface-popup-field-light-background);
        color:inherit;
        font:400 calc(var(--popup-font-size) - 1px)/1.35 var(--panel-font-family);
        white-space:pre-wrap;
        overflow-wrap:anywhere;
        opacity:1;
      }
      #reader-fields-popup .panel[data-ui-surface="toolbar"][data-theme="dark"] .reader-fields-input,
      #reader-fields-popup .panel[data-ui-surface="toolbar"][data-theme="dark"] .reader-fields-preview{
        background:var(--surface-popup-field-dark-background);
        border-color:var(--surface-toolbar-dark-panel-border);
        color:var(--surface-toolbar-dark-text);
      }
      #reader-fields-popup .panel[data-ui-surface="toolbar"][data-theme="light"] .reader-fields-input,
      #reader-fields-popup .panel[data-ui-surface="toolbar"][data-theme="light"] .reader-fields-preview{
        background:var(--surface-popup-field-light-background);
        border-color:var(--surface-toolbar-light-panel-border);
      }
      #reader-fields-popup .reader-fields-preview--slug{
        min-height:38px;
        max-height:38px;
        padding:8px 10px;
        line-height:1.2;
        display:flex;
        align-items:center;
        overflow:hidden;
      }
      #reader-fields-popup .reader-fields-preview--slug-live{
        min-height:32px;
        max-height:32px;
        padding:6px 10px;
      }
      #reader-fields-popup .reader-fields-static{
        opacity:.72;
        font-size:calc(var(--popup-font-size) - 3px);
        line-height:1.3;
      }
      #reader-fields-popup .reader-fields-preview--readonly{
        min-height:0;
        max-height:none;
        margin-top:0;
        opacity:.88;
        box-sizing:border-box;
        overflow-y:auto;
        overflow-x:hidden;
        word-break:break-word;
        scrollbar-width:none;
        -ms-overflow-style:none;
      }
      #reader-fields-popup .reader-fields-preview--readonly::-webkit-scrollbar{
        width:0;
        height:0;
      }
      #reader-fields-popup .reader-fields-preview--excerpt-plain{
        border:0;
        border-radius:0;
        background:transparent;
        padding:0;
      }
      #reader-fields-popup .reader-diff{
        border-radius:4px;
        padding:0 1px;
        -webkit-box-decoration-break:clone;
        box-decoration-break:clone;
      }
      #reader-fields-popup .reader-diff-del{
        background:color-mix(in srgb, #ff3d6e 16%, transparent);
      }
      #reader-fields-popup .reader-diff-add{
        background:color-mix(in srgb, #59d66f 14%, transparent);
      }
      #reader-fields-popup .reader-diff-char-del{
        background:color-mix(in srgb, #ff3d6e 20%, transparent);
      }
      #reader-fields-popup .reader-diff-char-add{
        background:color-mix(in srgb, #59d66f 20%, transparent);
      }
      #reader-fields-popup [data-fields-body][data-mode="excerpt"]{
        display:flex;
        flex-direction:column;
        min-height:0;
      }
      #reader-fields-popup [data-fields-body][data-mode="excerpt"] .reader-fields-row{
        min-height:0;
        flex:1 1 auto;
        align-items:stretch;
      }
      #reader-fields-popup .reader-fields-excerpt-frame{
        min-height:0;
        height:100%;
        flex:1 1 auto;
        display:flex;
        flex-direction:column;
        border:var(--control-border);
        border-radius:var(--panel-radius);
        overflow:hidden;
      }
      #reader-fields-popup .reader-fields-excerpt-divider{
        flex:0 0 1px;
        background:currentColor;
        opacity:.16;
        margin:0;
      }
      #reader-fields-popup .reader-fields-excerpt-frame .reader-fields-input--excerpt{
        flex:0 0 45%;
        min-height:0;
        max-height:none;
        border:0;
        border-radius:0;
        background:transparent;
        padding:10px;
      }
      #reader-fields-popup .reader-fields-excerpt-frame .reader-fields-input--excerpt:focus,
      #reader-fields-popup .reader-fields-excerpt-frame .reader-fields-input--excerpt:focus-visible{
        outline:none;
        box-shadow:none;
      }
      #reader-fields-popup .reader-fields-excerpt-frame .reader-fields-preview--readonly{
        flex:1 1 auto;
        min-height:0;
        max-height:none;
        border:0;
        border-radius:0;
        background:transparent;
        padding:10px;
      }
      #reader-fields-popup .reader-fields-slug-edit{
        display:grid;
        grid-template-columns:minmax(0,1fr) auto;
        gap:10px;
        align-items:center;
      }
      #reader-fields-popup .ui-counter-pill{
        --counter-text-display:none;
        width:100%;
        min-width:100%;
        max-width:100%;
        font:400 calc(var(--popup-font-size) - 3px)/1 var(--panel-font-family);
      }
      #reader-fields-popup .panel[data-ui-surface="toolbar"][data-theme="dark"] .ui-counter-pill{
        background:var(--surface-popup-field-dark-background);
        border-color:var(--surface-toolbar-dark-panel-border);
        color:var(--surface-toolbar-dark-text);
      }
      #reader-fields-popup .panel[data-ui-surface="toolbar"][data-theme="light"] .ui-counter-pill{
        background:var(--surface-popup-field-light-background);
        border-color:var(--surface-toolbar-light-panel-border);
      }
      #reader-fields-popup .reader-fields-counter-main::before{
        content:attr(data-label);
        position:relative;
        z-index:1;
        font-weight:400;
        opacity:.82;
      }
      #reader-fields-popup .reader-fields-counter-group{
        width:var(--reader-fields-counter-width,184px);
        min-width:var(--reader-fields-counter-width,184px);
        max-width:var(--reader-fields-counter-width,184px);
      }
      #reader-fields-popup .panel[data-ui-surface="toolbar"][data-theme="dark"] .reader-fields-excerpt-frame{
        border-color:var(--surface-toolbar-dark-panel-border);
      }
      #reader-fields-popup .panel[data-ui-surface="toolbar"][data-theme="light"] .reader-fields-excerpt-frame{
        border-color:var(--surface-toolbar-light-panel-border);
      }
      #reader-fields-popup .reader-fields-counter-main[data-over="true"]{
        border-color:#ff3d6e;
        color:#ff3d6e;
      }
      #reader-fields-popup .ui-counter-pill[data-over="true"]{
        border-color:var(--counter-over-border);
        color:#ff3d6e;
      }
      #reader-fields-popup[data-mode="phone"] .panel{
        width:min(100vw - 20px,96ch);
        min-width:min(100vw - 20px,96ch);
        max-width:min(100vw - 20px,96ch);
        height:auto;
        max-height:calc(100vh - 86px);
        min-height:0;
        padding:12px;
        overflow:hidden;
      }
      #reader-fields-popup[data-mode="phone"] .reader-fields-row{
        grid-template-columns:1fr;
      }
      #reader-fields-popup[data-mode="phone"] .reader-fields-input,
      #reader-fields-popup[data-mode="phone"] .reader-fields-preview{
        font-size:16px;
      }
      #reader-fields-popup[data-mode="phone"] [data-fields-header="true"]{
        display:grid;
        grid-template-columns:minmax(0,1fr) minmax(0,1fr);
        grid-template-areas:
          "left right"
          "main main";
        column-gap:var(--rail-gap);
        row-gap:8px;
        align-items:center;
      }
      #reader-fields-popup[data-mode="phone"] .reader-fields-modes{
        grid-area:left;
        justify-self:stretch;
        width:100%;
        display:flex;
        justify-content:flex-start;
      }
      #reader-fields-popup[data-mode="phone"] .reader-fields-system{
        grid-area:right;
        justify-self:stretch;
        width:100%;
        display:flex;
        justify-content:flex-end;
      }
      #reader-fields-popup[data-mode="phone"] [data-fields-header="true"] > [data-line]{
        grid-area:main;
        justify-self:stretch;
        width:100%;
        display:flex;
        justify-content:center;
        padding-left:0;
        padding-right:0;
      }
      #reader-fields-popup[data-mode="phone"] .reader-fields-counter-group{
        width:100%;
      }
      #reader-fields-popup[data-mode="phone"] .reader-fields-counter-group .ui-counter-pill{
        width:100%;
        min-width:100%;
        max-width:100%;
      }
      @media (max-width: 768px){
        #ui-popup,
        #ui-popup{
          padding:var(--surface-popup-overlay-pad-mobile);
          align-items:flex-end;
        }
        #ui-popup .panel,
        #ui-popup .panel{
          width:min(var(--surface-popup-panel-mobile-max-width),100%);
          max-height:var(--surface-popup-panel-mobile-max-height);
          border-radius:calc(var(--panel-radius) * 1.15);
        }
      }
    `;
  },
};

export const css = {
  panel: {
    theme() {
      return sheet.base.run();
    },
  },
  reader: cssReader,

  editor: cssEditor,
  ui: cssUi,

  diff: {
    panel() {
      return skin.diff;
    },
  },
  proofread: {
    root() {
      return skin.proofread;
    },
    panel() {
      return css.proofread.root();
    },
  },
  readmore: {
    panel() {
      return skin.readmore;
    },
  },
  clone: {
    panel() {
      return skin.clone;
    },
  },
  filter: {
    panel() {
      return skin.filter;
    },
  },
  skin,
};


