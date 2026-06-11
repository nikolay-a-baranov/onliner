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
        .panel .ui-message {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          line-height: 1.2;
        }
        .panel .ui-message-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 1em;
        }
        .panel .ui-message-text {
          display: inline-block;
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
          --surface-button-bg: transparent;
          --surface-toolbar-media-size: calc(var(--surface-button-size) * 0.88);
          --surface-emoji-icon-size: var(--surface-toolbar-media-size);
          --surface-toolbar-icon-size: var(--surface-toolbar-media-size);
          --surface-toolbar-logo-size: var(--surface-toolbar-media-size);
          --toolbar-unified-step: var(--surface-button-size);
          --toolbar-unified-icon-size: var(--surface-toolbar-media-size);
          --toolbar-unified-pad-x: var(--surface-toolbar-unified-pad-x);
          --surface-emoji-hover-scale: 1.12;
          --surface-emoji-active-scale: 1.08;
          --surface-active-scale: 1.1;
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
          --rail-side-size: var(--surface-toolbar-rail-side-size);
          --rail-side-pad-y: var(--surface-toolbar-rail-side-pad-y);
          --rail-side-pad-x: var(--surface-toolbar-rail-side-pad-x);
          --rail-pill-pad: var(--surface-toolbar-rail-pill);
          --rail-group-inset: var(--surface-toolbar-rail-inset);
          --rail-gap: var(--surface-toolbar-rail-gap);
          --rail-bar-pad-y: var(--surface-toolbar-rail-bar-pad-y);
          --rail-bar-pad-x: var(--surface-toolbar-rail-bar-pad-x);
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
          border-radius: var(--control-radius);
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
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"] [data-sticky-group="left"] {
          position: sticky;
          left: 0;
          z-index: 30;
          flex: 0 0 auto;
          margin-right: var(--panel-row-gap);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"] [data-sticky-group="right"] {
          position: sticky;
          right: 0;
          z-index: 30;
          flex: 0 0 auto;
          margin-left: var(--panel-row-gap);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-sticky-group="left"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-sticky-group="left"] {
          margin-right: 0;
          margin-bottom: var(--panel-row-gap);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-sticky-group="right"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-sticky-group="right"] {
          margin-left: 0;
          margin-top: var(--panel-row-gap);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-rail-group],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-rail-group] {
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
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] .ui-group > .ui-group-body,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] .ui-group > .ui-group-body {
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
        #launcher-panel[data-ui-surface="toolbar"] {
          min-height: calc(
            var(--surface-button-size) + var(--rail-bar-pad-y) * 2 + 2px
          );
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
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="start"] {
          justify-content: flex-start;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="center"] {
          justify-content: center;
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
        .panel[data-ui-surface="progress"] .ui-stack {
          display: flex;
          flex-direction: column;
          gap: var(--panel-row-gap);
          width: 100%;
        }
        .panel[data-ui-surface="progress"] {
          padding: var(--panel-pad);
          min-width: 0;
        }
        .panel[data-ui-surface="progress"] .ui-stack-row {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }
        .panel[data-ui-surface="progress"] .ui-message {
          width: 100%;
          gap: var(--panel-row-gap);
          line-height: var(--panel-line-height);
          justify-content: center;
        }
        .panel[data-ui-surface="progress"] [data-progress-drag="true"] {
          cursor: grab;
        }
        .panel[data-ui-surface="progress"][data-dragging="true"] [data-progress-drag="true"] {
          cursor: grabbing;
        }
        .panel[data-ui-surface="progress"] .ui-counter-pill {
          --counter-inset: var(--surface-counter-inset);
          --counter-inner-radius: calc(var(--surface-counter-radius) - var(--counter-inset));
          --counter-pad-x: var(--surface-counter-pad-x, 10px);
          --counter-min-height: calc(var(--control-height) - 6px);
          --counter-over-border: var(--surface-counter-over-border);
          --counter-base-background: var(--surface-counter-base-background);
          --counter-fill-background: var(--surface-counter-fill-background);
          --counter-overflow-background: var(--surface-counter-overflow-background);
          --counter-text-color: rgba(255, 255, 255, 0.86);
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--surface-counter-radius);
          overflow: hidden;
          border: var(--surface-counter-border);
          box-shadow: var(--surface-counter-track-shadow);
          background: var(--counter-base-background);
          color: inherit;
          padding: 0 var(--counter-pad-x);
          min-height: var(--counter-min-height);
          width: 100%;
          min-width: 100%;
          max-width: 100%;
        }
        .panel[data-ui-surface="progress"] .ui-counter-pill .ui-counter-fill {
          position: absolute;
          top: var(--counter-inset);
          bottom: var(--counter-inset);
          left: var(--counter-inset);
          width: calc(var(--counter-progress, 0) * 1%);
          border-radius: var(--counter-inner-radius);
          background: var(--counter-fill-background);
          pointer-events: none;
          transition: width .22s ease;
        }
        .panel[data-ui-surface="progress"] .ui-counter-pill .ui-counter-overflow {
          position: absolute;
          top: var(--counter-inset);
          bottom: var(--counter-inset);
          right: var(--counter-inset);
          width: calc(var(--counter-overflow, 0) * 1%);
          border-radius: var(--counter-inner-radius);
          background: var(--counter-overflow-background);
          pointer-events: none;
          transition: width .2s ease;
          opacity: 0;
        }
        .panel[data-ui-surface="progress"] .ui-counter-pill[data-over="true"] .ui-counter-overflow {
          opacity: 1;
        }
        .panel[data-ui-surface="progress"] .ui-counter-pill .ui-counter-text {
          position: relative;
          z-index: 1;
          font: 600 calc(var(--panel-font-size) - 1px)/1 var(--panel-font-family);
          letter-spacing: .02em;
          color: var(--counter-text-color);
        }
        .panel[data-ui-surface="progress"] .ui-counter-pill[data-show-text="false"] .ui-counter-text {
          display: none;
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
          pointer-events: auto;
          cursor: default;
        }
        .panel[data-ui-surface="toolbar"] .ui-button[data-disabled="true"] .toolbar-media-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-disabled="true"] .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-disabled="true"] .ui-icon-box {
          transform: none !important;
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
        .panel[data-ui-surface="toolbar"] .launcher-section-button {
          flex: 0 0 auto;
          width: var(--surface-button-size) !important;
          min-width: var(--surface-button-size) !important;
          max-width: var(--surface-button-size) !important;
          height: var(--surface-button-size) !important;
          min-height: var(--surface-button-size) !important;
          padding: 0 !important;
          opacity: 0.88;
          background: transparent !important;
        }
        .panel[data-ui-surface="toolbar"] .launcher-section-button .ui-icon-box {
          width: calc(var(--surface-button-size) - 4px);
          height: calc(var(--surface-button-size) - 4px);
          min-width: calc(var(--surface-button-size) - 4px);
          min-height: calc(var(--surface-button-size) - 4px);
          border: 1px solid var(--surface-group-border);
          border-radius: var(--surface-icon-box-radius);
          box-sizing: border-box;
          background: transparent;
        }
        .panel[data-ui-surface="toolbar"] .launcher-section-button .ui-icon-content {
          width: var(--surface-emoji-icon-size);
          height: var(--surface-emoji-icon-size);
          min-width: var(--surface-emoji-icon-size);
          min-height: var(--surface-emoji-icon-size);
          line-height: 1;
        }
        .panel[data-ui-surface="toolbar"] .launcher-section-button[data-active="true"] {
          opacity: 1;
          border-color: transparent !important;
          box-shadow: none !important;
        }
        .panel[data-ui-surface="toolbar"] .launcher-section-button[data-active="true"] .ui-icon-box {
          border-color: var(--surface-active-ring);
          box-shadow: 0 0 0 1px var(--surface-active-ring) inset;
        }
        /* rail: orientation-core */
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"] .toolbar-media-box,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"] .toolbar-icon-box {
          width: calc(var(--surface-button-size) - 4px);
          height: calc(var(--surface-button-size) - 4px);
          min-width: calc(var(--surface-button-size) - 4px);
          min-height: calc(var(--surface-button-size) - 4px);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"] .ui-shell {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: var(--rail-gap);
          width: 100%;
          min-width: 0;
          max-width: 100%;
          margin: 0 auto;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"] > .ui-shell > .ui-group {
          flex: 0 0 auto;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] .ui-shell,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] .ui-shell {
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          width: 100%;
          max-width: 100%;
        }
        .panel[data-ui-surface="toolbar"][data-theme="light"] .ui-group {
          background: rgba(0, 0, 0, 0.14);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] {
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
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] .ui-strip,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] .ui-strip {
          flex-direction: column;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] .ui-group-body,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] .ui-group-body {
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
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="top"] [data-rail-group],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="bottom"] [data-rail-group],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="floating"] [data-rail-group] {
          min-width: var(--rail-pill-main);
          min-height: var(--rail-pill-cross);
        }
        /* rail: behavior-scroll (horizontal docks) */
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="top"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="bottom"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="floating"] {
          padding: var(--rail-bar-pad-y) var(--rail-bar-pad-x);
          overflow-x: hidden;
          overflow-y: hidden;
          scroll-snap-type: x proximity;
          touch-action: pan-x;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="top"] .ui-line,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="bottom"] .ui-line,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="floating"] .ui-line {
          flex: 1 1 auto;
          width: auto;
          min-width: 0;
          max-width: var(--rail-track-x-max, 100%);
          height: calc(
            var(--surface-button-size) + var(--surface-line-cross-pad) * 2 + 2px
          );
          min-height: calc(
            var(--surface-button-size) + var(--surface-line-cross-pad) * 2 + 2px
          );
          max-height: calc(
            var(--surface-button-size) + var(--surface-line-cross-pad) * 2 + 2px
          );
          overflow-x: auto;
          overflow-y: hidden;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="top"] .ui-line > .ui-strip,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="bottom"] .ui-line > .ui-strip,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="floating"] .ui-line > .ui-strip {
          width: max-content;
          min-width: max-content;
        }
        /* rail: behavior-scroll (vertical docks) */
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] .ui-line,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] .ui-line {
          height: var(--rail-track-y, auto);
          max-height: var(--rail-track-y-max, none);
          width: auto;
          overflow-x: hidden;
          overflow-y: auto;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"] .ui-line {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"] .ui-line::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-draggable="true"] {
          cursor: grab;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-draggable="true"]:active {
          cursor: grabbing;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"] .button,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"] [data-action] {
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
      --control-gap: var(--surface-icon-box-gap);
      --proofread-inline-pad: var(--surface-proofread-inline-pad);
      --proofread-edge-inset: var(--surface-space-inset);
      --proofread-header-pad-y: var(--surface-space-inset);
      --proofread-row-pad-y: var(--surface-proofread-row-pad-y);
      --proofread-row-gap: var(--surface-proofread-row-gap);
      --proofread-row-font-size: var(--surface-proofread-row-font-size);
      --proofread-word-width: var(--surface-proofread-word-width);
      --proofread-actions-width: calc(
        var(--surface-button-size) * 3 +
        var(--surface-icon-box-gap) * 2 +
        var(--rail-group-inset) * 2 +
        var(--rail-pill-pad) * 2
      );
      --proofread-field-width: var(--proofread-actions-width);
      --proofread-source-width: var(--surface-proofread-source-width);
      --proofread-grid-width: calc(
        var(--proofread-word-width) +
        var(--proofread-field-width) +
        var(--proofread-actions-width) +
        var(--proofread-row-gap) * 2
      );
      --proofread-content-width: calc(
        var(--proofread-grid-width) +
        var(--proofread-edge-inset) * 2
      );
      --proofread-row-height: var(--rail-pill-cross, calc(var(--surface-button-size) + var(--rail-pill-pad) * 2));
      --proofread-row-step: calc(
        var(--proofread-row-height) +
        var(--proofread-row-pad-y) * 2 +
        var(--proofread-row-border-width)
      );
      --proofread-panel-width: calc(var(--proofread-content-width) + var(--proofread-inline-pad) * 2);
      --proofread-row-border-width: 1px;
      --proofread-source-count-gap: 6px;
      --proofread-row-border: var(--surface-proofread-light-row-border);
      --proofread-active-background: var(--surface-proofread-light-active-background);
      --proofread-active-inset-color: var(--surface-proofread-light-active-inset);
      --proofread-message-text: var(--surface-proofread-light-message-text);
      --proofread-empty-text: var(--surface-proofread-light-empty-text);
      --proofread-note-background: var(--surface-proofread-light-note-background);
      --proofread-note-border: var(--surface-proofread-light-note-border);
      --proofread-note-shadow: var(--surface-proofread-light-note-shadow);
      --proofread-field-background: var(--surface-toolbar-button-active-hint-light);
      --proofread-field-border: transparent;
      --control-focus-ring-color: var(--surface-proofread-focus-ring-light);
      left: 50%;
      top: 92px;
      right: auto;
      width: var(--proofread-panel-width);
      min-width: var(--proofread-panel-width);
      max-width: min(calc(100vw - 40px), var(--proofread-panel-width));
      padding: var(--proofread-inline-pad);
      overflow-x: hidden;
      overflow-y: hidden;
      transform: translateX(-50%);
      transition: height 0.18s ease;
    }
    #proofread-panel[data-theme="light"] {
      --proofread-field-background: var(--surface-toolbar-button-active-hint-light);
      --proofread-field-border: transparent;
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
      --proofread-field-background: var(--surface-toolbar-group-bg-dark);
      --proofread-field-border: transparent;
      --control-focus-ring-color: var(--surface-proofread-focus-ring-dark);
    }
    #proofread-panel {
      cursor: grab;
    }
    #proofread-panel[data-dragging="true"] {
      cursor: grabbing;
    }
    #proofread-panel [data-header] {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--proofread-header-pad-y) 0;
      margin: 0 0 var(--proofread-row-pad-y);
      cursor: grab;
    }
    #proofread-panel [data-header] .proofread-header-shell,
    #proofread-panel [data-header] .ui-shell,
    #proofread-panel [data-header] .ui-line {
      cursor: grab;
    }
    #proofread-panel [data-header]:active,
    #proofread-panel [data-header]:active .proofread-header-shell,
    #proofread-panel [data-header]:active .ui-shell,
    #proofread-panel [data-header]:active .ui-line {
      cursor: grabbing;
    }
    #proofread-panel [data-header] button,
    #proofread-panel [data-header] input,
    #proofread-panel [data-header] select,
    #proofread-panel [data-header] a {
      cursor: pointer;
    }
    #proofread-panel .proofread-header-shell {
      width: var(--proofread-content-width);
      min-width: var(--proofread-content-width);
      max-width: var(--proofread-content-width);
      box-sizing: border-box;
      padding-left: var(--proofread-edge-inset);
      padding-right: var(--proofread-edge-inset);
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: var(--proofread-row-gap);
      min-height: var(--rail-pill-cross);
    }
    #proofread-panel .proofread-header-shell > .ui-line {
      flex: 1 1 auto;
      min-width: 0;
      padding: 0;
      overflow: visible;
    }
    #proofread-panel .proofread-header-main {
      display: flex;
      align-items: center;
      gap: var(--proofread-row-gap);
      width: 100%;
      min-width: 0;
      overflow: visible;
    }
    #proofread-panel .proofread-engine-group {
      flex: 1 1 auto;
      min-width: 0;
    }
    #proofread-panel .proofread-engine-group > .ui-group-body {
      width: 100%;
      min-width: 0;
    }
    #proofread-panel .proofread-engine-group .ui-strip {
      width: 100%;
      min-width: 0;
      overflow: visible;
    }
    #proofread-panel [data-download] {
      margin-left: auto;
    }
    #proofread-panel [data-source].ui-button {
      width: var(--proofread-source-width) !important;
      min-width: var(--proofread-source-width) !important;
      max-width: var(--proofread-source-width) !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
    }
    #proofread-panel [data-source] .ui-icon-content {
      gap: var(--proofread-source-count-gap);
      font-size: calc(var(--panel-font-size) - 1px);
      font-weight: 600;
    }
    #proofread-panel [data-source][data-active="true"] .ui-icon-box,
    #proofread-panel [data-source][data-active="true"] .ui-icon-content,
    #proofread-panel [data-source][data-active="true"] [data-icon],
    #proofread-panel [data-source][data-active="true"] [data-count] {
      transform: none !important;
      filter: none !important;
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
    #proofread-list [data-word] {
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
      border-radius: var(--control-radius);
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
    #proofread-panel[data-done="false"] #proofread-theme {
      display: none;
    }
    #proofread-list {
      max-height: calc(var(--proofread-row-step) * 5);
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
    #proofread-list,
    #proofread-list * {
      cursor: default;
    }
    #proofread-list [data-row] {
      position: relative;
      display: flex;
      align-items: center;
      min-height: var(--proofread-row-height);
      padding-top: var(--proofread-row-pad-y);
      padding-bottom: var(--proofread-row-pad-y);
      padding-left: 0;
      padding-right: 0;
      border-top: var(--proofread-row-border-width) solid var(--proofread-row-border);
      scroll-snap-align: start;
    }
    #proofread-list [data-row][data-active="true"] {
      background: linear-gradient(90deg, var(--proofread-active-background) 0, var(--proofread-active-background) 30%, transparent 64%);
      box-shadow: none;
    }
    #proofread-list [data-row][data-active="true"]::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      border-radius: 0;
      background: var(--proofread-active-inset-color);
      pointer-events: none;
    }
    #proofread-list .proofread-line {
      display: grid;
      grid-template-columns: var(--proofread-word-width) var(--proofread-field-width) var(--proofread-actions-width);
      align-items: center;
      column-gap: var(--proofread-row-gap);
      width: var(--proofread-content-width);
      min-width: var(--proofread-content-width);
      max-width: var(--proofread-content-width);
      box-sizing: border-box;
      padding-left: var(--proofread-edge-inset);
      padding-right: var(--proofread-edge-inset);
      min-height: var(--proofread-row-height);
    }
    #proofread-list [data-main] {
      display: contents;
    }
    #proofread-list [data-word] {
      grid-column: 1;
      max-width: var(--proofread-word-width);
      min-width: 0;
      font-size: var(--proofread-row-font-size);
      font-weight: 400;
      cursor: pointer;
    }
    #proofread-list [data-field-cell] {
      grid-column: 2;
      display: flex;
      align-items: center;
      width: var(--proofread-field-width);
      min-width: var(--proofread-field-width);
      max-width: var(--proofread-field-width);
    }
    #proofread-list [data-tools-row] {
      grid-column: 3;
      display: flex;
      align-items: center;
      width: var(--proofread-actions-width);
      min-width: var(--proofread-actions-width);
      max-width: var(--proofread-actions-width);
      justify-content: flex-end;
    }
    #proofread-list [data-tools-row] .ui-group {
      width: 100%;
      min-width: 100%;
      max-width: 100%;
    }
    #proofread-list [data-tools-row],
    #proofread-list [data-tools-row] .ui-group,
    #proofread-list [data-tools-row] .ui-group-body,
    #proofread-list [data-tools-row] [data-action],
    #proofread-list [data-tools-row] button {
      cursor: pointer;
    }
    #proofread-list [data-tools-row] [data-disabled="true"],
    #proofread-list [data-tools-row] button:disabled {
      cursor: default;
    }
    #proofread-list .audit-field {
      appearance: none;
      -webkit-appearance: none;
      display: block;
      width: 100%;
      min-width: 100%;
      max-width: 100%;
      height: var(--proofread-row-height);
      min-height: var(--proofread-row-height);
      max-height: var(--proofread-row-height);
      border: 1px solid var(--proofread-field-border);
      border-radius: 999px;
      padding-block: 0;
      padding-left: var(--control-pad-x);
      padding-right: calc(var(--control-pad-x) * 2.1);
      background-color: var(--proofread-field-background) !important;
      color: inherit;
      font-family: var(--panel-font-family);
      font-size: var(--proofread-row-font-size);
      font-weight: 400;
      line-height: normal;
      outline: none;
      box-shadow: none;
    }
    #proofread-list .audit-field-select {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1.5 1.25L5 4.75L8.5 1.25' fill='none' stroke='%231e1e1e' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-position: calc(100% - var(--control-pad-x)) 50%;
      background-size: 10px 6px;
      background-repeat: no-repeat;
      cursor: pointer;
    }
    #proofread-panel[data-theme="dark"] #proofread-list .audit-field-select {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1.5 1.25L5 4.75L8.5 1.25' fill='none' stroke='%23f2f2f2' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    }
    #proofread-list .audit-field-input {
      line-height: normal;
    }
    #proofread-list .audit-field:focus {
      box-shadow: var(--surface-popup-field-focus-shadow);
    }
    #proofread-list .audit-field-input {
      display: none;
    }
    #proofread-panel[data-theme="dark"] .audit-field-select {
      color-scheme: dark;
    }
    #proofread-list [data-empty] {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: var(--proofread-row-height);
      padding: var(--proofread-row-pad-y) var(--proofread-edge-inset);
      color: var(--proofread-empty-text);
      text-align: center;
    }
    @media (max-width: 820px) {
      #proofread-panel {
        left: 0 !important;
        right: 0 !important;
        top: 0 !important;
        width: 100vw !important;
        min-width: 100vw !important;
        max-width: none !important;
        height: 100vh !important;
        transform: none !important;
        border: 0 !important;
      }
      #proofread-panel [data-header] .ui-shell {
        width: 100%;
        max-width: 100%;
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
    #filter-transition {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      cursor: progress;
    }
    #filter-transition::before {
      content: "";
      position: absolute;
      inset: 0;
      background: rgba(8, 10, 14, 0.34);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }
    #filter-transition .filter-transition-body {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      max-width: min(94vw, 1280px);
      width: max-content;
      padding: 8px 12px;
      pointer-events: none;
    }
    #filter-transition .filter-transition-group {
      background: transparent;
      border: 0;
      box-shadow: none;
      padding: 0;
    }
    #filter-transition .filter-transition-group .ui-group-body {
      background: transparent;
      border: 0;
      box-shadow: none;
      padding: 0;
    }
    #filter-transition .filter-transition-group .filter-transition-strip {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      justify-content: center;
      gap: clamp(20px, 2.2vw, 32px);
      max-width: min(94vw, 1280px);
      overflow: hidden;
      padding: 6px 4px;
    }
    #filter-transition .filter-transition-strip [data-role="section"] {
      width: clamp(96px, 7vw, 112px);
      height: clamp(96px, 7vw, 112px);
      min-width: clamp(96px, 7vw, 112px);
      min-height: clamp(96px, 7vw, 112px);
      max-width: clamp(96px, 7vw, 112px);
      max-height: clamp(96px, 7vw, 112px);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      flex: 0 0 auto;
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      padding: 0 !important;
      margin: 0 !important;
      cursor: default !important;
      opacity: 1 !important;
      transition: opacity .16s ease, transform .16s ease, filter .16s ease;
    }
    #filter-transition .filter-transition-strip [data-role="section"] .ui-icon-box {
      width: 100%;
      height: 100%;
      min-width: 100%;
      min-height: 100%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    #filter-transition .filter-transition-strip [data-role="section"] .ui-icon-content {
      width: 100% !important;
      height: 100% !important;
      min-width: 100% !important;
      min-height: 100% !important;
      font-size: clamp(96px, 7vw, 120px) !important;
      line-height: 1 !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    #filter-transition .filter-transition-strip [data-role="section"] .emoji {
      width: clamp(96px, 7vw, 120px) !important;
      height: clamp(96px, 7vw, 120px) !important;
      min-width: clamp(96px, 7vw, 120px) !important;
      min-height: clamp(96px, 7vw, 120px) !important;
      vertical-align: middle;
    }
    #filter-transition .filter-transition-strip [data-role="section"] .emoji img {
      width: clamp(96px, 7vw, 120px) !important;
      height: clamp(96px, 7vw, 120px) !important;
      min-width: clamp(96px, 7vw, 120px) !important;
      min-height: clamp(96px, 7vw, 120px) !important;
      image-rendering: auto;
    }
    #filter-transition .filter-transition-strip [data-status="completed"] {
      opacity: 0.5;
      filter: grayscale(1) saturate(0);
      transform: none;
    }
    #filter-transition .filter-transition-strip [data-status="completed"] .ui-icon-box,
    #filter-transition .filter-transition-strip [data-status="completed"] .ui-icon-content,
    #filter-transition .filter-transition-strip [data-status="completed"] .emoji,
    #filter-transition .filter-transition-strip [data-status="completed"] .emoji img {
      filter: none !important;
      box-shadow: none !important;
      text-shadow: none !important;
      transform: none !important;
    }
    #filter-transition .filter-transition-strip [data-status="upcoming"] {
      opacity: 0.65;
      filter: grayscale(1) saturate(0);
      transform: none;
    }
    #filter-transition .filter-transition-strip [data-status="upcoming"] .ui-icon-box,
    #filter-transition .filter-transition-strip [data-status="upcoming"] .ui-icon-content,
    #filter-transition .filter-transition-strip [data-status="upcoming"] .emoji,
    #filter-transition .filter-transition-strip [data-status="upcoming"] .emoji img {
      filter: none !important;
      box-shadow: none !important;
      text-shadow: none !important;
      transform: none !important;
    }
    #filter-transition .filter-transition-strip [data-status="current"] {
      width: clamp(104px, 7.4vw, 122px);
      height: clamp(104px, 7.4vw, 122px);
      min-width: clamp(104px, 7.4vw, 122px);
      min-height: clamp(104px, 7.4vw, 122px);
      max-width: clamp(104px, 7.4vw, 122px);
      max-height: clamp(104px, 7.4vw, 122px);
      opacity: 1;
      filter: none;
      transform: translateZ(0) scale(1.03);
      animation: filter-transition-current-pulse 1.6s ease-in-out infinite;
    }
    #filter-transition .filter-transition-strip [data-status="current"] .ui-icon-box,
    #filter-transition .filter-transition-strip [data-status="current"] .ui-icon-content,
    #filter-transition .filter-transition-strip [data-status="current"] .emoji,
    #filter-transition .filter-transition-strip [data-status="current"] .emoji img {
      filter: none !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }
    @keyframes filter-transition-current-pulse {
      0% { transform: translateZ(0) scale(1.03); }
      50% { transform: translateZ(0) scale(1.08); }
      100% { transform: translateZ(0) scale(1.03); }
    }
    @media (prefers-reduced-motion: reduce) {
      #filter-transition .filter-transition-strip [data-status="current"] {
        animation: none !important;
      }
    }
    #filter-transition .filter-transition-strip [data-status="current"] .ui-icon-content {
      font-size: clamp(104px, 7.5vw, 132px) !important;
    }
    #filter-transition .filter-transition-strip [data-status="current"] .emoji,
    #filter-transition .filter-transition-strip [data-status="current"] .emoji img {
      width: clamp(104px, 7.5vw, 132px) !important;
      height: clamp(104px, 7.5vw, 132px) !important;
      min-width: clamp(104px, 7.5vw, 132px) !important;
      min-height: clamp(104px, 7.5vw, 132px) !important;
    }
    #filter-progress {
      top: var(--surface-filter-progress-top);
      left: 50%;
      width: var(--surface-filter-progress-width);
      transform: translateX(-50%);
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
      width: max-content;
      min-width: 0;
      max-width: calc(100vw - 24px);
      padding: var(--surface-filter-panel-pad);
      border: 1px solid var(--surface-filter-panel-border);
      border-radius: var(--panel-radius);
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }
    #filter-panel[data-theme="dark"] {
      border-color: var(--surface-toolbar-dark-panel-border);
      background: var(--surface-filter-panel-background-dark);
      color: var(--surface-toolbar-dark-text);
      box-shadow: var(--surface-toolbar-dark-panel-shadow);
    }
    #filter-panel[data-theme="light"] {
      border-color: var(--surface-toolbar-light-panel-border);
      background: var(--surface-filter-panel-background-light);
      color: var(--surface-toolbar-light-text);
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
      align-items: center;
    }
    #filter-panel [data-header] {
      cursor: grab;
    }
    #filter-panel[data-dragging="true"] [data-header] {
      cursor: grabbing;
    }
    #filter-panel [data-header] button,
    #filter-panel [data-header] input,
    #filter-panel [data-header] select,
    #filter-panel [data-header] a,
    #filter-panel [data-header] [data-action] {
      cursor: pointer;
    }
    #filter-panel [data-role="nav-group"] .ui-group-body {
      display: flex;
      align-items: center;
      gap: var(--surface-filter-row-gap);
    }
    #filter-panel .ui-stack-row + .ui-stack-row {
      margin-top: var(--surface-filter-separator-margin-top);
      padding-top: var(--surface-filter-separator-pad-top);
      border-top: 0;
    }
    #filter-panel[data-theme="dark"] .ui-stack-row + .ui-stack-row {
      border-top-color: var(--surface-toolbar-dark-panel-border);
    }
    #filter-panel[data-theme="light"] .ui-stack-row + .ui-stack-row {
      border-top-color: var(--surface-toolbar-light-panel-border);
    }
    #filter-panel [data-role="period"] {
      min-width: var(--surface-filter-period-min-width);
      text-align: center;
      font-weight: 600;
    }
    #filter-panel [data-role="section"] {
      min-height: var(--surface-filter-button-min-height);
      padding: var(--surface-filter-button-pad-y) var(--surface-filter-button-pad-x);
      line-height: 1.2;
      text-align: center;
      white-space: nowrap;
    }
    #filter-panel [data-role="sections"] {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }
    #filter-panel [data-role="section"] {
      width: var(--surface-filter-button-min-height);
      height: var(--surface-filter-button-min-height);
      min-height: var(--surface-filter-button-min-height);
      padding: 0;
      margin: 0;
    }
    #filter-panel [data-role="section"][data-active="true"] {
      border: 1px solid var(--surface-filter-current-border);
      background: var(--surface-filter-current-background);
      color: var(--surface-filter-current-text);
      font-weight: 600;
      cursor: pointer;
      box-shadow: inset 0 0 0 1px var(--surface-filter-current-inset);
    }
    #filter-panel [data-role="mini"] {
      width: var(--surface-filter-button-min-height);
      height: var(--surface-filter-button-min-height);
      min-height: var(--surface-filter-button-min-height);
      padding: 0;
      text-align: center;
    }
    #filter-panel [data-role="mini"].button-emoji {
      font-size: calc(var(--control-font-size) + 2px);
    }
    #filter-panel [data-role="mini"]:disabled {
      opacity: 0.45;
      cursor: default;
    }
  `,
  diff: `
    body[data-diff-mode] {
      --diff-panel-border: var(--surface-diff-light-panel-border);
      --diff-add-background: var(--surface-diff-light-add-background);
      --diff-del-background: var(--surface-diff-light-del-background);
      --diff-code-background: var(--surface-diff-light-code-background);
    }
    @media (prefers-color-scheme: dark) {
      body[data-diff-mode] {
        --diff-panel-border: var(--surface-diff-dark-panel-border);
        --diff-add-background: var(--surface-diff-dark-add-background);
        --diff-del-background: var(--surface-diff-dark-del-background);
        --diff-code-background: var(--surface-diff-dark-code-background);
      }
    }
    body[data-diff-mode="compact"] #wpbody-content {
      overflow-x: hidden;
    }
    body[data-diff-mode="compact"] table.diff {
      width: 100%;
      max-width: 100%;
      table-layout: fixed;
    }
    body[data-diff-mode="compact"] table.diff colgroup,
    body[data-diff-mode="compact"] table.diff td[colspan="2"] {
      display: none;
    }
    body[data-diff-mode="compact"] table.diff td,
    body[data-diff-mode="compact"] table.diff th,
    body[data-diff-mode="compact"] table.diff pre,
    body[data-diff-mode="compact"] table.diff code {
      white-space: pre-wrap;
      word-break: break-word;
      overflow-wrap: anywhere;
      vertical-align: top;
      box-sizing: border-box;
    }
    body[data-diff-mode="compact"] .diff-deletedline,
    body[data-diff-mode="compact"] .diff-addedline,
    body[data-diff-mode="compact"] .diff-context {
      width: 50%;
      max-width: 50%;
    }
    body[data-diff-mode="compact"] table.diff pre,
    .diff-inline-box pre {
      margin: var(--surface-diff-line-gap) 0;
      padding: var(--surface-diff-inline-pad);
      border-radius: calc(var(--surface-diff-inline-radius) * 0.65);
      background: var(--diff-code-background);
      border: 1px solid var(--diff-panel-border);
    }
    #diff-panel {
      --panel-font-size: 12px;
      --panel-line-height: 1.35;
      --diff-panel-background: var(--surface-diff-light-panel-background);
      --diff-panel-border: var(--surface-diff-light-panel-border);
      --diff-panel-text: var(--surface-diff-light-panel-text);
      right: var(--surface-diff-panel-right);
      bottom: var(--surface-diff-panel-bottom);
      width: var(--surface-diff-panel-width);
      min-width: var(--surface-diff-panel-width);
      padding: var(--surface-diff-panel-pad);
      border-color: var(--diff-panel-border);
      border-radius: var(--surface-frame-capsule-radius);
      background: var(--diff-panel-background);
      color: var(--diff-panel-text);
      backdrop-filter: var(--surface-toolbar-glass-backdrop);
      -webkit-backdrop-filter: var(--surface-toolbar-glass-backdrop);
    }
    #diff-panel[data-theme="dark"] {
      --diff-panel-background: var(--surface-diff-dark-panel-background);
      --diff-panel-border: var(--surface-diff-dark-panel-border);
      --diff-panel-text: var(--surface-diff-dark-panel-text);
    }
    #diff-panel .ui-stack {
      display: flex;
      flex-direction: column;
      gap: var(--surface-diff-panel-gap);
    }
    #diff-panel .diff-head {
      min-height: var(--rail-pill-cross);
    }
    #diff-panel .diff-title {
      font-size: var(--panel-font-size);
      font-weight: 650;
      letter-spacing: 0.01em;
      color: var(--diff-panel-text);
    }
    #diff-panel .diff-stat-group {
      width: 100%;
      min-width: 100%;
    }
    #diff-panel .diff-stat-group > .ui-group-body {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--surface-diff-panel-gap);
      width: 100%;
    }
    #diff-panel .diff-stat {
      min-width: var(--surface-diff-stat-min-width);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    #diff-panel .diff-stat-label {
      opacity: 0.66;
      font-size: calc(var(--panel-font-size) - 1px);
      line-height: 1.1;
    }
    #diff-panel .diff-stat-value {
      font-size: calc(var(--panel-font-size) + 2px);
      line-height: 1.1;
      font-weight: 650;
      color: var(--diff-panel-text);
    }
    #diff-panel .diff-stat[data-diff-tone="add"] .diff-stat-value {
      color: var(--surface-diff-light-add-accent);
    }
    #diff-panel .diff-stat[data-diff-tone="del"] .diff-stat-value {
      color: var(--surface-diff-light-del-accent);
    }
    #diff-panel[data-theme="dark"] .diff-stat[data-diff-tone="add"] .diff-stat-value {
      color: var(--surface-diff-dark-add-accent);
    }
    #diff-panel[data-theme="dark"] .diff-stat[data-diff-tone="del"] .diff-stat-value {
      color: var(--surface-diff-dark-del-accent);
    }
    #diff-panel .diff-warnings {
      display: flex;
      flex-direction: column;
      gap: 4px;
      opacity: 0.78;
    }
    #diff-panel .diff-warning::before {
      content: "⚠️ ";
    }
    .diff-inline-box {
      --diff-box-background: var(--surface-diff-light-box-background);
      --diff-panel-border: var(--surface-diff-light-panel-border);
      --diff-line-background: var(--surface-diff-light-line-background);
      --diff-context-background: var(--surface-diff-light-context-background);
      --diff-add-background: var(--surface-diff-light-add-background);
      --diff-add-accent: var(--surface-diff-light-add-accent);
      --diff-del-background: var(--surface-diff-light-del-background);
      --diff-del-accent: var(--surface-diff-light-del-accent);
      --diff-change-background: var(--surface-diff-light-change-background);
      --diff-change-accent: var(--surface-diff-light-change-accent);
      --diff-code-background: var(--surface-diff-light-code-background);
      width: 100%;
      box-sizing: border-box;
      margin: var(--surface-diff-inline-margin-y) 0;
      padding: var(--surface-diff-inline-pad);
      border-radius: var(--surface-diff-inline-radius);
      background: var(--diff-box-background);
      border: 1px solid var(--diff-panel-border);
      font-family: var(--surface-diff-mono-font);
      font-size: var(--panel-font-size);
      line-height: 1.5;
    }
    .diff-inline-box,
    .diff-inline-box * {
      white-space: pre-wrap;
      word-break: break-word;
      overflow-wrap: anywhere;
      box-sizing: border-box;
    }
    .diff-line {
      display: grid;
      gap: var(--surface-diff-line-gap);
      margin: 0 0 var(--surface-diff-line-gap);
      padding: var(--surface-diff-line-pad-y) var(--surface-diff-line-pad-x);
      border-radius: calc(var(--surface-diff-inline-radius) * 0.75);
      background: var(--diff-line-background);
      border-left: var(--surface-diff-marker-width) solid transparent;
    }
    .diff-line:last-child {
      margin-bottom: 0;
    }
    .diff-line[data-diff-line="context"] {
      background: var(--diff-context-background);
    }
    .diff-line[data-diff-line="added"] {
      background: var(--diff-add-background);
      border-left-color: var(--diff-add-accent);
    }
    .diff-line[data-diff-line="deleted"] {
      background: var(--diff-del-background);
      border-left-color: var(--diff-del-accent);
    }
    .diff-line[data-diff-line="change"] {
      background: var(--diff-change-background);
      border-left-color: var(--diff-change-accent);
    }
    .diff-line-part[data-diff-part="deleted"] {
      color: inherit;
    }
    .diff-line-part[data-diff-part="added"] {
      color: inherit;
    }
    .diff-inline-box ins,
    body[data-diff-mode="compact"] table.diff ins {
      background: var(--diff-add-background);
      text-decoration: none;
      border-radius: 3px;
    }
    .diff-inline-box del,
    body[data-diff-mode="compact"] table.diff del {
      background: var(--diff-del-background);
      text-decoration: line-through;
      border-radius: 3px;
    }
    @media (prefers-color-scheme: dark) {
      .diff-inline-box {
        --diff-box-background: var(--surface-diff-dark-box-background);
        --diff-panel-border: var(--surface-diff-dark-panel-border);
        --diff-line-background: var(--surface-diff-dark-line-background);
        --diff-context-background: var(--surface-diff-dark-context-background);
        --diff-add-background: var(--surface-diff-dark-add-background);
        --diff-add-accent: var(--surface-diff-dark-add-accent);
        --diff-del-background: var(--surface-diff-dark-del-background);
        --diff-del-accent: var(--surface-diff-dark-del-accent);
        --diff-change-background: var(--surface-diff-dark-change-background);
        --diff-change-accent: var(--surface-diff-dark-change-accent);
        --diff-code-background: var(--surface-diff-dark-code-background);
      }
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
          pointer-events:auto!important;
          cursor:default!important
        }
        #${panel} .ui-button[data-disabled="true"] .ui-icon-box{
          transform:none!important
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
          pointer-events:auto!important;
          cursor:default!important
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
        #editor-panel [data-toolbar-modes="true"] {
          padding: 0;
          border: 0;
          background: transparent !important;
          height: var(--surface-button-size);
          min-height: var(--surface-button-size);
          max-height: var(--surface-button-size);
        }
        #editor-panel [data-toolbar-modes="true"] > .ui-group-body {
          padding-left: 0;
          padding-right: 0;
          height: var(--surface-button-size);
          min-height: var(--surface-button-size);
          max-height: var(--surface-button-size);
          border-radius: 999px;
          box-shadow: inset 0 0 0 1px var(--surface-toolbar-group-border-dark);
        }
        #editor-panel[data-theme="light"] [data-toolbar-modes="true"] > .ui-group-body {
          box-shadow: inset 0 0 0 1px var(--surface-toolbar-group-border-light);
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
      #ui-popup[hidden]{
        display:none!important;
      }
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
      #ui-popup .ui-nav{
        display:grid;
        grid-template-columns:auto 1fr auto;
        gap:var(--surface-popup-nav-gap);
        align-items:center;
        margin:0 0 var(--surface-popup-nav-margin-bottom);
      }
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
      #ui-popup .ui-head{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:var(--surface-popup-row-gap);
        margin:0 0 var(--surface-popup-head-margin-bottom);
      }
      #ui-popup .ui-title{
        font:600 calc(var(--popup-font-size) + 2px)/1.35 var(--panel-font-family);
        margin:0;
        white-space:normal;
        overflow-wrap:anywhere;
        word-break:break-word;
      }
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
      #ui-popup .panel[data-ui-surface="toolbar"][data-theme="dark"] .ui-field{
        background:var(--surface-popup-field-dark-background);
        border-color:var(--surface-toolbar-dark-panel-border);
        color:var(--surface-toolbar-dark-text);
      }
      #ui-popup .panel[data-ui-surface="toolbar"][data-theme="light"] .ui-field{
        background:var(--surface-popup-field-light-background);
        border-color:var(--surface-toolbar-light-panel-border);
      }
      #ui-popup .ui-field:focus{
        box-shadow:var(--surface-popup-field-focus-shadow);
      }
      #ui-popup .ui-row{
        display:flex;
        gap:var(--surface-popup-row-gap);
        align-items:center;
        justify-content:space-between;
        margin-top:var(--surface-popup-row-margin-top);
        min-width:0;
      }
      #ui-popup .actions{
        display:flex;
        align-items:center;
        gap:var(--surface-popup-row-gap);
        flex:0 0 auto;
      }
      #ui-popup .ui-counter-pill,
      #reader-fields-popup .ui-counter-pill{
        --counter-inset:var(--surface-counter-inset);
        --counter-inner-radius:calc(var(--surface-counter-radius) - var(--counter-inset));
        --counter-pad-x:var(--surface-counter-pad-x,10px);
        --counter-min-height:var(--surface-counter-min-height,30px);
        --counter-over-border:var(--surface-counter-over-border);
        --counter-base-background:var(--surface-counter-base-background);
        --counter-fill-background:var(--surface-counter-fill-background);
        --counter-overflow-background:var(--surface-counter-overflow-background);
        --counter-text-color:rgba(255,255,255,.86);
        --counter-text-display:inline;
        position:relative;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        border-radius:var(--surface-counter-radius);
        overflow:hidden;
        border:var(--surface-counter-border);
        box-shadow:var(--surface-counter-track-shadow);
        background:var(--counter-base-background);
        color:inherit;
        cursor:pointer;
        padding:0 var(--counter-pad-x);
        min-height:var(--counter-min-height);
        width:100%;
        min-width:100%;
        max-width:100%;
      }
      #ui-popup .ui-counter-pill .ui-counter-fill,
      #reader-fields-popup .ui-counter-pill .ui-counter-fill{
        position:absolute;
        top:var(--counter-inset);
        bottom:var(--counter-inset);
        left:var(--counter-inset);
        width:calc(var(--counter-progress, 0) * 1%);
        border-radius:var(--counter-inner-radius);
        background:var(--counter-fill-background);
        pointer-events:none;
        transition:width .22s ease;
      }
      #ui-popup .ui-counter-pill .ui-counter-overflow,
      #reader-fields-popup .ui-counter-pill .ui-counter-overflow{
        position:absolute;
        top:var(--counter-inset);
        bottom:var(--counter-inset);
        right:var(--counter-inset);
        width:calc(var(--counter-overflow, 0) * 1%);
        border-radius:var(--counter-inner-radius);
        background:var(--counter-overflow-background);
        pointer-events:none;
        transition:width .2s ease;
        opacity:0;
      }
      #ui-popup .ui-counter-pill[data-over="true"] .ui-counter-overflow,
      #reader-fields-popup .ui-counter-pill[data-over="true"] .ui-counter-overflow{
        opacity:1;
      }
      #ui-popup .ui-counter-pill .ui-counter-text,
      #reader-fields-popup .ui-counter-pill .ui-counter-text{
        display:var(--counter-text-display);
        position:relative;
        z-index:1;
        font:600 calc(var(--popup-font-size) - 2px)/1 var(--panel-font-family);
        letter-spacing:.02em;
        color:var(--counter-text-color);
      }
      #ui-popup .ui-counter-pill[data-show-text="false"] .ui-counter-text,
      #reader-fields-popup .ui-counter-pill[data-show-text="false"] .ui-counter-text{
        display:none;
      }
      #ui-popup .ui-counter-pill{
        --counter-pad-x:12px;
        --counter-min-height:calc(var(--surface-button-size) - 6px);
        --counter-over-border:var(--surface-counter-over-border);
        height:calc(var(--surface-button-size) - 6px);
        opacity:var(--surface-counter-opacity);
      }
      #ui-popup .ui-counter-group{
        width:min(228px,46vw);
        min-width:160px;
        max-width:100%;
      }
      #ui-popup .panel[data-ui-surface="toolbar"][data-theme="dark"] .ui-counter-pill{
        --counter-base-background:var(--surface-counter-base-background-dark);
        color:var(--surface-toolbar-dark-text);
      }
      #ui-popup .panel[data-ui-surface="toolbar"][data-theme="light"] .ui-counter-pill{
        --counter-base-background:var(--surface-counter-base-background-light);
        color:var(--surface-toolbar-light-text);
      }
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
      #reader-fields-popup [data-fields-header="true"] [data-sticky-group="left"],
      #reader-fields-popup [data-fields-header="true"] [data-sticky-group="right"]{
        margin-left:0!important;
        margin-right:0!important;
      }
      #reader-fields-popup .reader-fields-modes,
      #reader-fields-popup .reader-fields-system,
      #reader-fields-popup .reader-fields-counter-group{
        align-self:auto;
        cursor:grab;
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
        position:relative;
        flex:0 0 22px;
        margin:0;
        display:flex;
        align-items:center;
        justify-content:center;
      }
      #reader-fields-popup .reader-fields-excerpt-divider::before{
        content:"";
        position:absolute;
        left:0;
        right:0;
        top:50%;
        height:1px;
        transform:translateY(-50%);
        opacity:.16;
        background:linear-gradient(
          90deg,
          transparent 0%,
          currentColor 28%,
          currentColor 72%,
          transparent 100%
        );
      }
      #reader-fields-popup .reader-fields-excerpt-divider-mark{
        position:relative;
        z-index:1;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        width:26px;
        height:26px;
        border-radius:999px;
        background:transparent;
        border:0;
        padding:0;
        cursor:pointer;
      }
      #reader-fields-popup .reader-fields-excerpt-divider-mark .emoji,
      #reader-fields-popup .reader-fields-excerpt-divider-mark .emoji img{
        width:18px!important;
        height:18px!important;
        min-width:18px!important;
        min-height:18px!important;
      }
      #reader-fields-popup .reader-fields-excerpt-frame .reader-fields-input--excerpt{
        flex:1 1 50%;
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
        flex:1 1 50%;
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
      #reader-fields-popup .reader-fields-row--slug-cycle{
        justify-items:center;
        margin-top:-2px;
      }
      #reader-fields-popup .reader-fields-slug-cycle{
        display:flex;
        align-items:center;
        justify-content:center;
      }
      #reader-fields-popup .reader-fields-row--delivery{
        grid-template-columns:minmax(0,1fr);
        gap:8px;
      }
      #reader-fields-popup .reader-fields-row--delivery-grid{
        grid-template-columns:minmax(0,1fr);
        gap:10px;
        align-items:center;
      }
      #reader-fields-popup .reader-fields-row--delivery-grid{
        display:flex;
        align-items:center;
        justify-content:center;
        gap:10px;
      }
      #reader-fields-popup .reader-fields-delivery-capsule{
        width:max-content;
        max-width:100%;
        min-height:38px;
        border:var(--control-border);
        border-radius:999px;
        padding:4px 8px;
        display:flex;
        align-items:center;
        justify-content:center;
      }
      #reader-fields-popup .reader-fields-delivery-time{
        display:flex;
        align-items:center;
        justify-content:center;
        gap:8px;
      }
      #reader-fields-popup .reader-fields-delivery-actions{
        display:flex;
        align-items:center;
        gap:8px;
      }
      #reader-fields-popup .reader-fields-delivery-actions [data-action="fields-delivery"]{
        min-width:32px;
        width:32px;
        height:28px;
        border-radius:8px;
      }
      #reader-fields-popup .reader-fields-delivery-actions--time{
        margin-bottom:2px;
      }
      #reader-fields-popup .reader-fields-input--delivery-time{
        width:44px;
        min-width:44px;
        max-width:44px;
        min-height:30px;
        height:30px;
        text-align:center;
        padding:4px 6px;
      }
      #reader-fields-popup .reader-fields-input--delivery-time::-webkit-outer-spin-button,
      #reader-fields-popup .reader-fields-input--delivery-time::-webkit-inner-spin-button{
        -webkit-appearance:none;
        margin:0;
      }
      #reader-fields-popup .reader-fields-delivery-sep{
        opacity:.7;
        font:600 calc(var(--popup-font-size) - 2px)/1 var(--panel-font-family);
      }
      #reader-fields-popup .reader-fields-counter-group{
        width:var(--reader-fields-counter-width,184px);
        min-width:var(--reader-fields-counter-width,184px);
        max-width:var(--reader-fields-counter-width,184px);
      }
      #reader-fields-popup .reader-fields-delivery-top{
        width:100%;
        display:flex;
        align-items:center;
        justify-content:center;
      }
      #reader-fields-popup .reader-fields-delivery-top-group .ui-group-body{
        width:100%;
        display:flex;
        justify-content:center;
      }
      #reader-fields-popup .reader-fields-delivery-top-text{
        width:max-content;
        max-width:100%;
        min-height:32px;
        border:0;
        border-radius:999px;
        padding:6px 12px;
        font:600 calc(var(--popup-font-size) - 2px)/1.1 var(--panel-font-family);
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        text-align:center;
        display:flex;
        align-items:center;
        justify-content:center;
        gap:6px;
      }
      #reader-fields-popup .reader-fields-delivery-top-text .emoji,
      #reader-fields-popup .reader-fields-delivery-top-text .emoji img{
        width:var(--surface-emoji-icon-size)!important;
        height:var(--surface-emoji-icon-size)!important;
        min-width:var(--surface-emoji-icon-size)!important;
        min-height:var(--surface-emoji-icon-size)!important;
      }
      #reader-fields-popup .reader-fields-delivery-top [data-action="fields-delivery"]{
        min-width:28px;
        width:28px;
        height:24px;
        border-radius:6px;
        padding:0;
        border-color:transparent!important;
        background:transparent!important;
        box-shadow:none!important;
      }
      #reader-fields-popup .reader-fields-delivery-top [data-action="fields-delivery"]:hover,
      #reader-fields-popup .reader-fields-delivery-top [data-action="fields-delivery"]:focus-visible{
        border-color:transparent!important;
        background:color-mix(in srgb, currentColor 14%, transparent)!important;
      }
      #reader-fields-popup .reader-fields-delivery-top [data-action="fields-delivery"] .emoji{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        width:16px;
        height:16px;
      }
      #reader-fields-popup .panel[data-ui-surface="toolbar"] .ui-counter-group > .ui-group-body{
        width:100%;
        min-width:100%;
        max-width:100%;
      }
      #reader-fields-popup .panel[data-ui-surface="toolbar"][data-theme="dark"] .reader-fields-excerpt-frame{
        border-color:var(--surface-toolbar-dark-panel-border);
      }
      #reader-fields-popup .panel[data-ui-surface="toolbar"][data-theme="light"] .reader-fields-excerpt-frame{
        border-color:var(--surface-toolbar-light-panel-border);
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
      #reader-fields-popup[data-mode="phone"] .reader-fields-row--delivery-grid{
        display:grid;
        grid-template-columns:1fr;
      }
      #reader-fields-popup[data-mode="phone"] .reader-fields-delivery-actions{
        justify-content:flex-start;
      }
      #reader-fields-popup[data-mode="phone"] .reader-fields-input,
      #reader-fields-popup[data-mode="phone"] .reader-fields-preview{
        font-size:16px;
      }
      @media (max-width: 768px){
        #ui-popup{
          padding:var(--surface-popup-overlay-pad-mobile);
          align-items:flex-end;
        }
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
