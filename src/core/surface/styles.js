import { design } from "./design.js";

const base = {
  join(items) {
    return items.map((item) => item()).join("");
  },
  tokens() {
    return `
        :root {
          ${design.run()}
        }
`;
  },
  panel() {
    return `
        html[data-ui-dragging="true"],
        html[data-ui-dragging="true"] * {
          cursor: grabbing !important;
        }
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
          overscroll-behavior: contain;
        }
        .panel [data-line],
        .panel .ui-strip {
          overscroll-behavior: contain;
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
          height: var(--surface-progress-size-height);
          border: 1px solid var(--surface-progress-track-border);
          background: var(--surface-progress-track-background);
          overflow: hidden;
        }
        .panel .progress-fill {
          width: 0%;
          height: 100%;
          background: var(--surface-progress-fill-background);
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
          --surface-box-size: calc(var(--surface-toolbar-box-size) * var(--toolbar-scale, 1));
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
          --cluster-pad-y: var(--surface-toolbar-cluster-pad-y, var(--surface-toolbar-rail-pill));
          --cluster-pad-x: var(--surface-toolbar-cluster-pad-x, var(--surface-toolbar-rail-pill));
          --cluster-inset-x: var(--surface-toolbar-cluster-inset-x, var(--surface-toolbar-rail-inset));
          --cluster-inset-y: var(--surface-toolbar-cluster-inset-y, var(--surface-toolbar-rail-inset));
          --rail-pill-pad: var(--cluster-pad-y);
          --rail-group-inset: var(--cluster-inset-x);
          --surface-box-gap: var(--surface-icon-box-gap);
          --surface-box-edge-x: calc(var(--cluster-pad-x) + var(--cluster-inset-x));
          --surface-box-border: 1px;
          --surface-box-1-width: calc(var(--surface-box-size) + var(--surface-box-edge-x) + var(--surface-box-edge-x) + var(--surface-box-border) + var(--surface-box-border));
          --surface-box-2-width: calc(var(--surface-box-size) + var(--surface-box-size) + var(--surface-box-gap) + var(--surface-box-edge-x) + var(--surface-box-edge-x) + var(--surface-box-border) + var(--surface-box-border));
          --surface-box-3-width: calc(var(--surface-box-size) + var(--surface-box-size) + var(--surface-box-size) + var(--surface-box-gap) + var(--surface-box-gap) + var(--surface-box-edge-x) + var(--surface-box-edge-x) + var(--surface-box-border) + var(--surface-box-border));
          --surface-box-4-width: calc(var(--surface-box-size) + var(--surface-box-size) + var(--surface-box-size) + var(--surface-box-size) + var(--surface-box-gap) + var(--surface-box-gap) + var(--surface-box-gap) + var(--surface-box-edge-x) + var(--surface-box-edge-x) + var(--surface-box-border) + var(--surface-box-border));
          --rail-gap: var(--surface-toolbar-rail-gap);
          --rail-bar-pad-y: var(--surface-toolbar-rail-bar-pad-y);
          --rail-bar-pad-x: var(--surface-toolbar-rail-bar-pad-x);
          --rail-item-size: var(--surface-button-size);
          --rail-pill-main: calc(var(--rail-item-size) + var(--surface-toolbar-rail-pill-main-extra));
          --rail-pill-cross: calc(var(--rail-item-size) + var(--surface-toolbar-rail-pill-cross-extra));
          --toolbar-layer-base: var(--surface-toolbar-layer-base);
          --toolbar-layer-glyph: var(--surface-toolbar-layer-glyph);
          --toolbar-layer-emoji: var(--surface-toolbar-layer-emoji);
          --toolbar-layer-cluster: var(--surface-toolbar-layer-cluster);
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
        .panel[data-ui-surface="toolbar"] .toolbar-media .audit-icon,
        .panel[data-ui-surface="toolbar"] .toolbar-icon-content .emoji,
        .panel[data-ui-surface="toolbar"] .toolbar-icon-content .emoji img,
        .panel[data-ui-surface="toolbar"] .toolbar-icon-content .audit-icon {
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
          position: relative;
          z-index: var(--toolbar-layer-glyph);
          width: var(--surface-toolbar-icon-size) !important;
          height: var(--surface-toolbar-icon-size) !important;
          min-width: var(--surface-toolbar-icon-size) !important;
          min-height: var(--surface-toolbar-icon-size) !important;
          display: block;
          flex: 0 0 var(--surface-toolbar-icon-size);
          object-fit: contain;
          filter: var(--surface-glyph-filter);
        }
        .panel[data-ui-surface="toolbar"] .emoji,
        .panel[data-ui-surface="toolbar"] .audit-icon {
          position: relative;
          z-index: var(--toolbar-layer-emoji);
        }
        .panel[data-ui-surface="toolbar"] .toolbar-logo {
          position: relative;
          z-index: var(--toolbar-layer-glyph);
          width: var(--surface-toolbar-logo-size) !important;
          height: var(--surface-toolbar-logo-size) !important;
          min-width: var(--surface-toolbar-logo-size) !important;
          min-height: var(--surface-toolbar-logo-size) !important;
          display: block;
          flex: 0 0 var(--surface-toolbar-logo-size);
          object-fit: contain;
          border-radius: calc(var(--surface-toolbar-logo-size) * 0.16);
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
          position: relative;
          z-index: var(--toolbar-layer-base);
          display: inline-flex;
          align-items: center;
          gap: var(--surface-group-gap);
          width: fit-content;
          min-width: 0;
          max-width: 100%;
          padding: var(--cluster-pad-y) var(--cluster-pad-x);
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
          z-index: var(--toolbar-layer-cluster);
          flex: 0 0 auto;
          margin-right: var(--panel-row-gap);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"] [data-sticky-group="right"] {
          position: sticky;
          right: 0;
          z-index: var(--toolbar-layer-cluster);
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
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-sticky-group="left"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-sticky-group="left"] {
          position: sticky;
          top: 0;
          z-index: var(--toolbar-layer-cluster);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-sticky-group="right"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-sticky-group="right"] {
          position: sticky;
          bottom: 0;
          z-index: var(--toolbar-layer-cluster);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-sticky-group],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-sticky-group] {
          width: var(--rail-pill-cross);
          min-width: var(--rail-pill-cross);
          max-width: var(--rail-pill-cross);
          justify-content: center;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-rail-group]:not([data-sticky-group]),
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-rail-group]:not([data-sticky-group]) {
          position: static;
          left: auto;
          right: auto;
          display: flex;
          flex-direction: column;
          width: var(--rail-pill-cross);
          min-width: var(--rail-pill-cross);
          max-width: var(--rail-pill-cross);
          min-height: var(--rail-pill-main);
          justify-content: center;
          align-items: center;
          padding: var(--cluster-pad-y) var(--cluster-pad-x);
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
          padding-left: var(--cluster-inset-x);
          padding-right: var(--cluster-inset-x);
        }
        .panel[data-ui-surface="toolbar"] [data-ui-boxes="1"] {
          --ui-boxes-width: var(--surface-box-1-width);
        }
        .panel[data-ui-surface="toolbar"] [data-ui-boxes="2"] {
          --ui-boxes-width: var(--surface-box-2-width);
        }
        .panel[data-ui-surface="toolbar"] [data-ui-boxes="3"] {
          --ui-boxes-width: var(--surface-box-3-width);
        }
        .panel[data-ui-surface="toolbar"] [data-ui-boxes="4"] {
          --ui-boxes-width: var(--surface-box-4-width);
        }
        .panel[data-ui-surface="toolbar"] [data-ui-boxes] {
          box-sizing: border-box;
          width: var(--ui-boxes-width);
          min-width: var(--ui-boxes-width);
          max-width: var(--ui-boxes-width);
        }
        .panel[data-ui-surface="toolbar"] .ui-group[data-ui-boxes] > .ui-group-body {
          width: 100%;
          min-width: 0;
          max-width: 100%;
          justify-content: center;
          box-sizing: border-box;
        }
        .panel[data-ui-surface="toolbar"] .ui-field-box[data-ui-boxes] .ui-field-control,
        .panel[data-ui-surface="toolbar"] .ui-field-box[data-ui-boxes] .ui-field {
          width: 100%;
          min-width: 100%;
          max-width: 100%;
        }
        .panel[data-ui-surface="toolbar"] [data-launchpad-group-head="true"] {
          display: inline-flex;
          flex: 0 0 auto;
          z-index: var(--toolbar-layer-cluster);
        }
        .panel[data-ui-surface="toolbar"] [data-launchpad-group="true"] {
          gap: var(--surface-icon-box-gap);
          position: relative;
          z-index: var(--toolbar-layer-base);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] .ui-group > .ui-group-body,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] .ui-group > .ui-group-body {
          padding-top: var(--cluster-inset-y);
          padding-bottom: var(--cluster-inset-y);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="top"] [data-launchpad-group="true"][data-expanded="true"] [data-launchpad-group-head="true"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="bottom"] [data-launchpad-group="true"][data-expanded="true"] [data-launchpad-group-head="true"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="floating"] [data-launchpad-group="true"][data-expanded="true"] [data-launchpad-group-head="true"] {
          position: sticky;
          left: 0;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-launchpad-group="true"][data-expanded="true"] [data-launchpad-group-head="true"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-launchpad-group="true"][data-expanded="true"] [data-launchpad-group-head="true"] {
          position: sticky;
          top: 0;
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
        #launchpad-panel[data-ui-surface="toolbar"] {
          min-height: calc(
            var(--surface-button-size) + var(--rail-bar-pad-y) * 2 + 2px
          );
        }
        #launchpad-panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="floating"] {
          width: max-content;
          max-width: calc(100dvw - var(--surface-toolbar-capsule-max-viewport-gap));
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
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="stack"] {
          padding: var(--rail-bar-pad-y) var(--rail-bar-pad-x);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="stack"] [data-stretch-group="true"] {
          width: 100%;
          min-width: 100%;
          max-width: 100%;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="stack"] [data-stretch-group="true"] > .ui-group-body {
          width: 100%;
          min-width: 0;
        }
        #tags-suggest-panel[data-ui-surface="toolbar"] {
          --tags-suggest-panel-width: min(calc(var(--surface-shared-panel-width, 440px) * 0.5), calc(100vw - var(--surface-toolbar-capsule-max-viewport-gap)));
          width: var(--tags-suggest-panel-width) !important;
          min-width: var(--tags-suggest-panel-width) !important;
          max-width: var(--tags-suggest-panel-width) !important;
          user-select: none;
          -webkit-user-select: none;
          cursor: grab;
        }
        #tags-suggest-panel[data-panel-dragging="true"] {
          cursor: grabbing;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="stack"] [data-tags-suggest-head="true"] {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          width: 100%;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="stack"] [data-tags-suggest-head="true"] .ui-line {
          flex: 1 1 auto;
          min-width: 0;
          padding-left: var(--rail-gap);
          padding-right: var(--rail-gap);
          display: flex;
          justify-content: center;
        }
        #tags-suggest-panel[data-ui-surface="toolbar"] .tags-suggest-counter {
          --counter-min-width: calc(var(--surface-button-size) * 1.95);
          --counter-min-height: var(--rail-pill-cross);
          --counter-pad-x: calc(var(--rail-gap) * 1.25);
          max-width: calc(var(--surface-button-size) * 2.35);
        }
        #tags-suggest-panel[data-ui-surface="toolbar"] [data-tags-suggest-list="true"] {
          padding-bottom: max(0px, calc(var(--rail-bar-pad-x) - var(--rail-bar-pad-y)));
        }
        #tags-suggest-panel[data-ui-surface="toolbar"] [data-tags-suggest-list="true"] > .ui-stack {
          gap: var(--rail-gap);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="stack"] [data-tags-suggest-status="true"] {
          justify-content: center;
          min-height: var(--surface-button-size);
          opacity: 0.72;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="stack"] [data-tags-suggest-row="true"] {
          display: grid;
          grid-template-columns: var(--surface-button-size) minmax(0, 1fr);
          align-items: center;
          width: 100%;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="stack"] [data-tags-suggest-row="true"] .ui-line {
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: left;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="stack"] [data-tags-suggest-row="true"] > .ui-button {
          justify-self: start;
        }
        .panel[data-panel-draggable="true"] [data-panel-drag-handle="true"] {
          cursor: grab;
        }
        .panel[data-panel-dragging="true"] [data-panel-drag-handle="true"] {
          cursor: grabbing;
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
          --counter-pad-x: var(--surface-counter-size-pad-x, 10px);
          --counter-min-height: calc(var(--control-height) - 6px);
          width: 100%;
          min-width: 100%;
          max-width: 100%;
        }
        .panel[data-ui-surface="toolbar"] .ui-button {
          position: relative;
          z-index: var(--toolbar-layer-base);
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
        .panel[data-ui-surface="toolbar"] .ui-separator {
          display: inline-flex;
          flex: 0 0 auto;
          align-self: center;
          width: 1px;
          height: calc(var(--surface-button-size) * 0.62);
          margin: 0 calc(var(--surface-icon-box-gap) * 0.25);
          border-radius: 999px;
          background: currentColor;
          opacity: 0.24;
          pointer-events: none;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] .ui-separator,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] .ui-separator {
          width: calc(var(--surface-button-size) * 0.62);
          height: 1px;
          margin: calc(var(--surface-icon-box-gap) * 0.25) 0;
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
        .panel[data-ui-surface="toolbar"] input,
        .panel[data-ui-surface="toolbar"] textarea,
        .panel[data-ui-surface="toolbar"] select,
        .panel[data-ui-surface="toolbar"] .ui-field {
          caret-color: var(--surface-feedback-field-focus-border);
        }
        .panel[data-ui-surface="toolbar"] input::selection,
        .panel[data-ui-surface="toolbar"] textarea::selection,
        .panel[data-ui-surface="toolbar"] select::selection,
        .panel[data-ui-surface="toolbar"] .ui-field::selection {
          background: color-mix(in srgb, var(--surface-feedback-field-focus-border) 38%, transparent);
          color: inherit;
        }
        .panel[data-ui-surface="toolbar"] .ui-field {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
          resize: none;
        }
        .panel[data-ui-surface="toolbar"] .ui-field::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }
        .panel[data-ui-surface="toolbar"] .ui-field::-webkit-scrollbar-thumb,
        .panel[data-ui-surface="toolbar"] .ui-field::-webkit-scrollbar-track,
        .panel[data-ui-surface="toolbar"] .ui-field::-webkit-scrollbar-corner {
          background: transparent !important;
          border: 0 !important;
        }
        .panel[data-ui-surface="toolbar"] .ui-corner {
          --ui-corner-bg: var(--admin-field-bg, var(--feedback-field-bg, var(--surface-toolbar-group-bg-dark)));
          --ui-corner-bleed: -6px;
          --ui-corner-size: var(--surface-button-size);
          position: absolute;
          right: 8px;
          bottom: 8px;
          z-index: 12;
          opacity: 1 !important;
          color: var(--surface-toolbar-capsule-text-dark) !important;
          background: transparent !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          overflow: visible;
          isolation: isolate;
          width: var(--ui-corner-size) !important;
          min-width: var(--ui-corner-size) !important;
          max-width: var(--ui-corner-size) !important;
          height: var(--ui-corner-size) !important;
          min-height: var(--ui-corner-size) !important;
          max-height: var(--ui-corner-size) !important;
        }
        .panel[data-ui-surface="toolbar"] .ui-corner::before {
          content: "";
          position: absolute;
          inset: var(--ui-corner-bleed);
          z-index: 0;
          border-radius: 12px;
          background: var(--ui-corner-bg);
          box-shadow: 0 0 0 1px var(--ui-corner-bg);
          pointer-events: none;
        }
        .panel[data-ui-surface="toolbar"] .ui-corner .ui-icon-box {
          position: relative;
          z-index: 1;
          background: transparent !important;
          box-shadow: none !important;
        }
        .panel[data-ui-surface="toolbar"] .ui-corner,
        .panel[data-ui-surface="toolbar"] .ui-corner .ui-icon-box {
          border-radius: 0 !important;
        }
        .panel[data-ui-surface="toolbar"] .ui-corner .ui-icon-content,
        .panel[data-ui-surface="toolbar"] .ui-corner .toolbar-icon {
          position: relative;
          z-index: 13;
        }
        .panel[data-ui-surface="toolbar"][data-theme="light"] .ui-corner {
          color: var(--surface-toolbar-capsule-text-light) !important;
        }
        .panel[data-ui-surface="toolbar"] .ui-corner .toolbar-icon {
          filter: var(--surface-glyph-filter) !important;
        }
        .panel[data-ui-surface="toolbar"][data-theme="dark"] .ui-corner .toolbar-icon {
          filter: var(--surface-toolbar-glyph-filter-dark-active) !important;
        }
        .panel[data-ui-surface="toolbar"][data-theme="light"] .ui-corner .toolbar-icon {
          filter: var(--surface-toolbar-glyph-filter-light-active) !important;
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
        .panel[data-ui-surface="toolbar"] .launchpad-section-button {
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
        .panel[data-ui-surface="toolbar"] .launchpad-section-button .ui-icon-box {
          width: calc(var(--surface-button-size) - 4px);
          height: calc(var(--surface-button-size) - 4px);
          min-width: calc(var(--surface-button-size) - 4px);
          min-height: calc(var(--surface-button-size) - 4px);
          border: 1px solid var(--surface-group-border);
          border-radius: var(--surface-icon-box-radius);
          box-sizing: border-box;
          background: transparent;
        }
        .panel[data-ui-surface="toolbar"] .launchpad-section-button .ui-icon-content {
          width: var(--surface-emoji-icon-size);
          height: var(--surface-emoji-icon-size);
          min-width: var(--surface-emoji-icon-size);
          min-height: var(--surface-emoji-icon-size);
          line-height: 1;
        }
        #launchpad-panel[data-ui-surface="toolbar"] .ui-button.is-focused-back .ui-icon-content {
          display: grid;
          place-items: center;
        }
        #launchpad-panel[data-ui-surface="toolbar"] .launchpad-back-icon {
          display: grid;
          place-items: center;
          width: var(--surface-emoji-icon-size);
          height: var(--surface-emoji-icon-size);
        }
        #launchpad-panel[data-ui-surface="toolbar"] .launchpad-back-face {
          grid-area: 1 / 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          transition: opacity .14s ease;
        }
        #launchpad-panel[data-ui-surface="toolbar"] .launchpad-back-face-hover {
          opacity: 0;
        }
        @media (hover: hover) and (pointer: fine) {
          #launchpad-panel[data-ui-surface="toolbar"] .ui-button.is-focused-back:hover .launchpad-back-face-default,
          #launchpad-panel[data-ui-surface="toolbar"] .ui-button.is-focused-back:focus-visible .launchpad-back-face-default,
          #launchpad-panel[data-ui-surface="toolbar"] .ui-button.is-focused-back:active .launchpad-back-face-default {
            opacity: 0;
          }
          #launchpad-panel[data-ui-surface="toolbar"] .ui-button.is-focused-back:hover .launchpad-back-face-hover,
          #launchpad-panel[data-ui-surface="toolbar"] .ui-button.is-focused-back:focus-visible .launchpad-back-face-hover,
          #launchpad-panel[data-ui-surface="toolbar"] .ui-button.is-focused-back:active .launchpad-back-face-hover {
            opacity: 1;
          }
        }
        .panel[data-ui-surface="toolbar"] .launchpad-section-button[data-active="true"] {
          opacity: 1;
          border-color: transparent !important;
          box-shadow: none !important;
        }
        .panel[data-ui-surface="toolbar"] .launchpad-section-button[data-active="true"] .ui-icon-box {
          border-color: var(--surface-active-ring);
          box-shadow: 0 0 0 1px var(--surface-active-ring) inset;
        }
        /* rail: orientation-core */
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"] {
          isolation: isolate;
          --surface-toolbar-media-size: calc(var(--surface-button-size) * 0.78);
          --surface-emoji-icon-size: var(--surface-toolbar-media-size);
          --surface-toolbar-icon-size: var(--surface-toolbar-media-size);
          --surface-toolbar-logo-size: var(--surface-toolbar-media-size);
        }
        #launchpad-panel[data-ui-surface="toolbar"] {
          --surface-toolbar-media-size: calc(var(--surface-button-size) * 0.88);
          --surface-emoji-icon-size: var(--surface-toolbar-media-size);
          --surface-toolbar-icon-size: var(--surface-toolbar-media-size);
          --surface-toolbar-logo-size: var(--surface-toolbar-media-size);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"] .toolbar-media-box,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"] .toolbar-icon-box {
          width: calc(var(--surface-button-size) - 4px);
          height: calc(var(--surface-button-size) - 4px);
          min-width: calc(var(--surface-button-size) - 4px);
          min-height: calc(var(--surface-button-size) - 4px);
        }
        #launchpad-panel[data-ui-surface="toolbar"] .toolbar-media-box,
        #launchpad-panel[data-ui-surface="toolbar"] .toolbar-icon-box,
        #launchpad-panel[data-ui-surface="toolbar"] .ui-icon-box {
          overflow: hidden;
        }
        #launchpad-panel[data-ui-surface="toolbar"] .toolbar-logo {
          border-radius: calc(var(--surface-toolbar-logo-size) * 0.36);
          transform: scale(1.06);
        }
        #launchpad-panel[data-ui-surface="toolbar"] .toolbar-logo.launchpad-acute-icon {
          border-radius: 0;
          transform: scale(1);
        }
        #launchpad-panel[data-ui-surface="toolbar"] .ui-button.launchpad-acute-icon .ui-icon-box {
          border-radius: 0;
          overflow: visible;
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
          position: relative;
          z-index: var(--toolbar-layer-base);
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
          background: var(--surface-toolbar-group-bg-light);
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
          overflow-y: hidden;
          scroll-snap-type: none;
          scrollbar-width: none;
          -ms-overflow-style: none;
          touch-action: pan-y;
        }
        #launchpad-panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"],
        #launchpad-panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] {
          padding-top: calc(var(--rail-side-pad-y) + 2px);
          padding-bottom: calc(var(--rail-side-pad-y) + 2px);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"]::-webkit-scrollbar,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"]::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
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
          scroll-snap-type: none;
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
          overflow-x: hidden;
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
          overflow-y: hidden;
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
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"] [data-ui-marker="true"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"] [data-sticky-group] {
          z-index: var(--toolbar-layer-cluster);
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
  counter() {
    return `
        .panel .ui-counter-pill {
          --counter-radius: var(--surface-counter-shape-radius, 999px);
          --counter-pad-x: var(--surface-counter-size-pad-x, 12px);
          --counter-min-height: var(--surface-counter-size-min-height, calc(var(--control-height) - 4px));
          --counter-min-width: var(--surface-counter-size-min-width, calc(var(--counter-min-height) * 4.8));
          --counter-over-border: var(--surface-counter-overflow-border);
          --counter-track-background: var(--surface-counter-track-background);
          --counter-fill-background: var(--surface-counter-fill-background);
          --counter-overflow-background: transparent;
          --counter-overflow-opacity: 0;
          --counter-warning-frame: 0px;
          --counter-warning-stripe-background: transparent;
          --counter-text-color: var(--surface-counter-text-color);
          --counter-text-size: var(--surface-counter-text-size);
          --counter-overflow-size: min(100%, calc(var(--counter-overflow-width, var(--counter-overflow, 0)) * 1%));
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-width: var(--counter-min-width);
          min-height: var(--counter-min-height);
          padding: 0 var(--counter-pad-x);
          border: var(--surface-counter-shape-border);
          border-radius: var(--counter-radius);
          overflow: hidden;
          isolation: isolate;
          box-shadow: var(--surface-counter-track-shadow);
          background: var(--counter-track-background);
          color: inherit;
        }
        .panel .ui-counter-pill::before,
        .panel .ui-counter-pill::after {
          content: "";
          position: absolute;
          pointer-events: none;
        }
        .panel .ui-counter-pill::before {
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 0;
          width: calc(var(--counter-progress, 0) * 1%);
          max-width: 100%;
          background: var(--counter-fill-background);
          border-radius: var(--counter-radius) 0 0 var(--counter-radius);
          box-shadow: var(--counter-fill-shadow, none);
        }
        .panel .ui-counter-pill::after {
          inset: var(--counter-warning-frame);
          z-index: 0;
          width: auto;
          background: var(--counter-overflow-background);
          border-radius: calc(var(--counter-radius) - var(--counter-warning-frame));
          box-shadow: var(--counter-overflow-shadow, none);
          opacity: var(--counter-overflow-opacity);
        }
        .panel[data-theme="dark"] .ui-counter-pill {
          --counter-track-background: var(--surface-counter-theme-dark-track-background, var(--surface-counter-track-background));
          --counter-text-color: var(--surface-counter-theme-dark-text-color, var(--surface-counter-text-color));
        }
        .panel[data-theme="light"] .ui-counter-pill {
          --counter-track-background: var(--surface-counter-theme-light-track-background, var(--surface-counter-track-background));
          --counter-text-color: var(--surface-counter-theme-light-text-color, var(--surface-counter-text-color));
        }
        .panel .ui-counter-pill[data-over="true"] {
          --counter-overflow-background: var(--counter-warning-stripe-background);
          --counter-overflow-opacity: 1;
          --counter-warning-frame: 0px;
          border-color: var(--counter-over-border);
          box-shadow: var(--surface-counter-track-shadow);
        }
        .panel .ui-counter-pill[data-over="true"]::before {
          width: 100%;
          max-width: 100%;
          border-radius: inherit;
        }
        .panel .ui-counter-pill[data-over="true"]::after {
          top: 0;
          right: 0;
          bottom: 0;
          left: auto;
          width: var(--counter-overflow-size);
          max-width: 100%;
          border-radius: 0 var(--counter-radius) var(--counter-radius) 0;
          background: var(--counter-overflow-background);
          box-shadow: none;
          opacity: var(--counter-overflow-opacity);
        }
        .panel .ui-counter-pill .ui-counter-fill,
        .panel .ui-counter-pill .ui-counter-overflow {
          display: none !important;
        }
        .panel .ui-counter-pill .ui-counter-label,
        .panel .ui-counter-pill .ui-counter-text {
          position: relative;
          z-index: 1;
          display: none;
          font: 400 var(--counter-text-size)/1 var(--panel-font-family);
          letter-spacing: .02em;
          color: var(--counter-text-color);
          white-space: nowrap;
        }
        .panel .ui-counter-pill .ui-counter-label {
          opacity: var(--surface-counter-text-label-opacity);
        }
        .panel .ui-counter-pill[data-show-label="true"] .ui-counter-label,
        .panel .ui-counter-pill[data-show-text="true"] .ui-counter-text {
          display: inline;
        }
`;
  },
  run() {
    return base.join([
      base.tokens,
      base.panel,
      base.toolbar,
      base.counter,
      base.fields,
    ]);
  },
};

const skin = {
  audit: `
    #audit-panel {
      --control-height: var(--surface-toolbar-button-size);
      --control-gap: var(--surface-icon-box-gap);
      --audit-inline-pad: var(--surface-audit-panel-pad);
      --audit-pad-bottom: var(--surface-audit-panel-pad-bottom);
      --audit-edge-inset: var(--surface-audit-content-inset);
      --audit-header-gap: var(--surface-audit-header-gap);
      --audit-header-height: calc(var(--audit-row-control-height) + var(--audit-header-gap));
      --audit-header-pad-y: 0px;
      --audit-list-pad-bottom: var(--surface-audit-list-pad-bottom);
      --audit-select-chevron-shift: var(--surface-audit-select-chevron-shift);
      --audit-row-radius: var(--surface-audit-row-radius);
      --audit-list-radius: var(--surface-audit-list-radius);
      --audit-row-pad-y: var(--surface-audit-row-pad-y);
      --audit-row-gap: var(--surface-audit-row-gap);
      --audit-row-stack-gap: var(--surface-audit-row-stack-gap);
      --audit-word-inset: var(--surface-audit-word-inset);
      --audit-field-inset: var(--surface-audit-field-inset);
      --audit-input-line-height: var(--surface-input-line-height);
      --audit-row-font-size: var(--surface-audit-row-font-size);
      --audit-viewport-gap: var(--surface-audit-viewport-gap);
      --audit-word-min-width: var(--surface-audit-word-min-width);
      --audit-field-min-width: var(--surface-audit-field-min-width);
      --audit-word-width: var(--surface-audit-word-width);
      --audit-control-width: var(--surface-box-3-width);
      --audit-source-width: var(--surface-audit-source-width);
      --audit-grid-width: calc(
        var(--audit-word-width) +
        var(--audit-control-width) +
        var(--audit-control-width) +
        var(--audit-row-gap) * 2
      );
      --audit-content-width: calc(
        var(--audit-grid-width) +
        var(--audit-edge-inset) * 2
      );
      --audit-row-control-height: var(
        --rail-pill-cross,
        calc(var(--surface-button-size) + var(--rail-pill-pad) * 2)
      );
      --audit-row-height: calc(
        var(--audit-row-control-height) +
        var(--surface-audit-row-height-extra)
      );
      --audit-row-box-height: calc(
        var(--audit-row-control-height) +
        var(--audit-row-pad-y) +
        var(--audit-row-border-width)
      );
      --audit-row-step: calc(
        var(--audit-row-box-height) +
        var(--audit-row-stack-gap)
      );
      --audit-list-height-max: calc(
        var(--audit-row-box-height) * 5 +
        var(--audit-row-stack-gap) * 4
      );
      --audit-panel-content-width: calc(var(--audit-content-width) + var(--audit-inline-pad) * 2);
      --audit-panel-width: min(
        var(--surface-shared-panel-width),
        var(--surface-shared-panel-max-width)
      );
      --audit-panel-fit-width: var(--audit-panel-width);
      --audit-row-border-width: 0px;
      --audit-source-count-gap: calc(var(--surface-space-inset) * 1.15);
      --audit-cluster-background: var(--panel-background);
      --audit-row-border: var(--surface-audit-light-row-border);
      --audit-row-background: transparent;
      --audit-row-separator: var(--surface-audit-light-row-separator);
      --audit-active-background: transparent;
      --audit-empty-text: var(--surface-audit-light-empty-text);
      --audit-field-background: transparent;
      --audit-field-hover-background: var(--surface-button-active-hint-bg);
      --audit-field-focus-background: transparent;
      --audit-field-hover-scale: 1;
      --audit-field-edit-background: var(--audit-cluster-background);
      --audit-field-menu-background: color-mix(in srgb, var(--surface-toolbar-group-bg-light) 84%, black 16%);
      --audit-field-menu-text: var(--surface-toolbar-capsule-text-light);
      --audit-field-option-hover-background: var(--surface-toolbar-group-bg-dark);
      --audit-field-option-hover-text: var(--surface-toolbar-capsule-text-dark);
      --audit-field-border: transparent;
      --audit-field-focus-border: var(--surface-feedback-field-focus-border);
      --audit-word-active-background: transparent;
      --audit-word-active-color: var(--surface-toolbar-group-bg-dark);
      --audit-row-idle-text: color-mix(in srgb, var(--surface-toolbar-capsule-text-light) 42%, var(--surface-toolbar-group-bg-light) 58%);
      --audit-row-active-text: var(--surface-toolbar-group-bg-dark);
      --audit-word-idle-opacity: 1;
      --audit-word-active-opacity: 1;
      --audit-word-pill-pad-x: calc(var(--surface-space-inset) * 0.75);
      --audit-row-shadow: none;
      --audit-active-shadow: none;
      --control-focus-ring-color: var(--surface-audit-focus-ring-light);
      left: 50%;
      top: 92px;
      right: auto;
      width: var(--audit-panel-fit-width);
      min-width: var(--audit-panel-fit-width);
      max-width: var(--audit-panel-fit-width);
      max-height: calc(100vh - var(--audit-viewport-gap) * 2);
      padding: var(--audit-inline-pad);
      padding-bottom: var(--audit-pad-bottom);
      overflow-x: hidden;
      overflow-y: hidden;
      cursor: grab;
      transform: translateX(-50%);
      transition: height 0.18s ease;
    }
    #audit-panel[data-theme="light"] {
      --audit-cluster-background: var(--panel-background);
      --audit-field-background: transparent;
      --audit-field-hover-background: var(--surface-button-active-hint-bg);
      --audit-field-focus-background: transparent;
      --audit-field-hover-scale: 1;
      --audit-field-edit-background: var(--audit-cluster-background);
      --audit-field-menu-background: color-mix(in srgb, var(--surface-toolbar-group-bg-light) 84%, black 16%);
      --audit-field-menu-text: var(--surface-toolbar-capsule-text-light);
      --audit-field-option-hover-background: var(--surface-toolbar-group-bg-dark);
      --audit-field-option-hover-text: var(--surface-toolbar-capsule-text-dark);
      --audit-field-border: transparent;
      --audit-field-focus-border: var(--surface-feedback-field-focus-border);
      --audit-word-active-background: transparent;
      --audit-word-active-color: var(--surface-toolbar-group-bg-dark);
      --audit-row-idle-text: color-mix(in srgb, var(--surface-toolbar-capsule-text-light) 42%, var(--surface-toolbar-group-bg-light) 58%);
      --audit-row-active-text: var(--surface-toolbar-group-bg-dark);
      --audit-word-idle-opacity: 1;
      --audit-word-active-opacity: 1;
      --audit-word-pill-pad-x: calc(var(--surface-space-inset) * 0.75);
      --audit-row-shadow: none;
      --audit-active-shadow: none;
    }
    #audit-panel[data-theme="dark"] {
      --audit-cluster-background: var(--surface-toolbar-group-bg-dark);
      --audit-row-border: var(--surface-audit-dark-row-border);
      --audit-row-background: transparent;
      --audit-row-separator: var(--surface-audit-dark-row-separator);
      --audit-active-background: transparent;
      --audit-empty-text: var(--surface-audit-dark-empty-text);
      --audit-field-background: transparent;
      --audit-field-hover-background: var(--surface-button-active-hint-bg);
      --audit-field-focus-background: transparent;
      --audit-field-hover-scale: 1;
      --audit-field-edit-background: var(--audit-cluster-background);
      --audit-field-menu-background: var(--surface-toolbar-group-bg-dark);
      --audit-field-menu-text: var(--surface-toolbar-capsule-text-dark);
      --audit-field-option-hover-background: var(--surface-toolbar-group-bg-light);
      --audit-field-option-hover-text: var(--surface-toolbar-capsule-text-light);
      --audit-field-border: transparent;
      --audit-field-focus-border: var(--surface-feedback-field-focus-border);
      --audit-word-active-background: transparent;
      --audit-word-active-color: var(--surface-toolbar-group-bg-light);
      --audit-row-idle-text: color-mix(in srgb, var(--surface-toolbar-capsule-text-dark) 56%, var(--surface-toolbar-group-bg-dark) 44%);
      --audit-row-active-text: var(--surface-toolbar-group-bg-light);
      --audit-word-idle-opacity: 1;
      --audit-word-active-opacity: 1;
      --audit-row-shadow: none;
      --audit-active-shadow: none;
      --control-focus-ring-color: var(--surface-audit-focus-ring-dark);
    }
    #audit-panel[data-dragging="true"] {
      cursor: grabbing;
    }
    #audit-panel[data-dragging="true"] #audit-list,
    #audit-panel[data-dragging="true"] #audit-list [data-row],
    #audit-panel[data-dragging="true"] #audit-list .audit-line {
      cursor: grabbing;
    }
    #audit-panel [data-header] {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--audit-header-pad-y) 0;
      margin: 0 0 var(--audit-header-gap);
      cursor: grab;
    }
    #audit-panel [data-header] .audit-header-shell,
    #audit-panel [data-header] .ui-shell,
    #audit-panel [data-header] .ui-line {
      cursor: grab;
    }
    #audit-panel [data-header]:active,
    #audit-panel [data-header]:active .audit-header-shell,
    #audit-panel [data-header]:active .ui-shell,
    #audit-panel [data-header]:active .ui-line {
      cursor: grabbing;
    }
    #audit-panel [data-header] button,
    #audit-panel [data-header] input,
    #audit-panel [data-header] select,
    #audit-panel [data-header] a {
      cursor: pointer;
    }
    #audit-panel .audit-header-shell {
      width: 100%;
      min-width: 0;
      max-width: 100%;
      position: relative;
      z-index: 1;
      box-sizing: border-box;
      padding-left: var(--audit-edge-inset);
      padding-right: var(--audit-edge-inset);
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: var(--audit-row-gap);
      min-height: var(--rail-pill-cross);
    }
    #audit-panel .audit-header-shell > .ui-line {
      flex: 1 1 auto;
      min-width: 0;
      padding: 0;
      overflow: visible;
    }
    #audit-panel .audit-header-main {
      display: flex;
      align-items: center;
      gap: var(--audit-row-gap);
      width: 100%;
      min-width: 0;
      overflow: visible;
    }
    #audit-panel .audit-engine-group {
      flex: 1 1 auto;
      min-width: 0;
    }
    #audit-panel .audit-engine-group > .ui-group-body {
      width: 100%;
      min-width: 0;
    }
    #audit-panel .audit-engine-group .ui-strip {
      width: 100%;
      min-width: 0;
      overflow: visible;
    }
    #audit-panel [data-download] {
      margin-left: auto;
    }
    #audit-panel [data-source].ui-button {
      width: var(--audit-source-width) !important;
      min-width: var(--audit-source-width) !important;
      max-width: var(--audit-source-width) !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
    }
    #audit-panel [data-source] .ui-icon-content {
      gap: var(--audit-source-count-gap);
      font-size: var(--panel-font-size);
      font-weight: 600;
    }
    #audit-panel [data-source] [data-count] {
      font-size: calc(var(--panel-font-size) + 1px);
      line-height: 1;
      transform: none;
      transform-origin: 50% 50%;
    }
    #audit-panel [data-source] .ui-icon-box,
    #audit-panel [data-source] .ui-icon-content,
    #audit-panel [data-source] [data-count] {
      transform: none !important;
      filter: none !important;
    }
    #audit-panel [data-source] [data-icon] {
      transform: translateZ(0) scale(1);
      transform-origin: 50% 50%;
      transition: transform 0.18s ease, opacity 0.18s ease, filter 0.18s ease;
    }
    #audit-panel [data-source][data-active="false"] .ui-icon-content,
    #audit-panel [data-source][data-checked="false"] .ui-icon-content {
      color: var(--surface-muted-text);
    }
    #audit-panel [data-source][data-active="false"] [data-icon],
    #audit-panel [data-source][data-checked="false"] [data-icon] {
      opacity: 0.38;
      filter: grayscale(1);
    }
    #audit-panel [data-source][data-active="false"] [data-count],
    #audit-panel [data-source][data-checked="false"] [data-count] {
      opacity: 0.42;
    }
    #audit-panel [data-source="languagetool"][data-mode="rejected"] [data-count] {
      color: #4f8cff;
    }
    #audit-panel [data-source]:not([data-hover-muted="true"]):hover .ui-icon-content,
    #audit-panel [data-source]:not([data-hover-muted="true"]):focus-visible .ui-icon-content {
      color: inherit;
    }
    #audit-panel [data-source]:not([data-hover-muted="true"]):hover [data-count],
    #audit-panel [data-source]:not([data-hover-muted="true"]):focus-visible [data-count] {
      opacity: 1;
    }
    #audit-panel [data-source]:not([data-hover-muted="true"]):hover [data-icon],
    #audit-panel [data-source]:not([data-hover-muted="true"]):focus-visible [data-icon] {
      opacity: 1;
      filter: none;
      transform: translateZ(0) scale(var(--surface-active-scale));
    }
    #audit-panel[data-loading="true"][data-loading-source="languagetool"] [data-source="languagetool"] .ui-icon-content,
    #audit-panel[data-loading="true"][data-loading-source="gemini"] [data-source="gemini"] .ui-icon-content,
    #audit-panel[data-loading="true"][data-loading-source="qwen"] [data-source="qwen"] .ui-icon-content {
      color: inherit;
    }
    #audit-panel[data-loading="true"][data-loading-source="languagetool"] [data-source="languagetool"] [data-icon],
    #audit-panel[data-loading="true"][data-loading-source="gemini"] [data-source="gemini"] [data-icon],
    #audit-panel[data-loading="true"][data-loading-source="qwen"] [data-source="qwen"] [data-icon] {
      opacity: 1;
      filter: none;
    }
    #audit-panel[data-loading="true"][data-loading-source="languagetool"] [data-source="languagetool"] [data-count],
    #audit-panel[data-loading="true"][data-loading-source="gemini"] [data-source="gemini"] [data-count],
    #audit-panel[data-loading="true"][data-loading-source="qwen"] [data-source="qwen"] [data-count] {
      opacity: 1;
    }
    #audit-panel[data-loading="true"] [data-source]:not([data-hover-muted="true"]):hover [data-icon],
    #audit-panel[data-loading="true"] [data-source]:not([data-hover-muted="true"]):focus-visible [data-icon] {
      transform: translateZ(0) scale(var(--surface-active-scale));
    }
    #audit-panel[data-tools-ready="false"] [data-tabs] {
      visibility: hidden;
    }
    #audit-panel[data-loading="true"] [data-tabs] {
      visibility: visible;
    }
    #audit-panel[data-loading="true"][data-loading-source="languagetool"] [data-source="languagetool"] [data-icon] img,
    #audit-panel[data-loading="true"][data-loading-source="gemini"] [data-source="gemini"] [data-icon] img,
    #audit-panel[data-loading="true"][data-loading-source="qwen"] [data-source="qwen"] [data-icon] img {
      animation: audit-logo-spin 1s linear infinite;
      transform-origin: 50% 50%;
    }
    #audit-panel [data-progress] {
      display: none;
    }
    #audit-panel[data-done="true"] [data-status] {
      display: none;
    }
    #audit-panel[data-done="false"] {
      --audit-loading-logo-size: 34px;
      overflow: hidden;
    }
    #audit-panel[data-done="false"] [data-header] .ui-shell {
      display: none !important;
    }
    #audit-panel[data-done="false"] [data-header] {
      margin: 0;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
    }
    #audit-panel[data-done="false"] [data-status] {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0 auto;
    }
    #audit-panel[data-done="false"] #audit-title {
      margin-left: 0 !important;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    #audit-panel[data-done="false"] #audit-list {
      display: none;
    }
    #audit-panel [data-progress-bar] {
      display: block;
      width: min(var(--audit-progress, 0%), 100%);
      max-width: 100%;
      height: 100%;
      border-radius: inherit;
      background: var(--surface-audit-progress-fill-background);
      opacity: 0.95;
      transition: width 0.2s ease;
    }
    #audit-panel [data-status] {
      min-height: 0;
      color: var(--audit-empty-text);
      font-size: 12px;
      line-height: 1.2;
    }
    #audit-panel[data-done="false"] [data-status] {
      font-size: calc(var(--panel-font-size) * 1.5);
      line-height: 1.15;
      font-weight: 700;
    }
    #audit-model,
    #audit-title,
    #audit-list [data-word] {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    #audit-panel[data-done="false"] #audit-model,
    #audit-panel[data-done="false"] #audit-title {
      overflow: visible;
      text-overflow: clip;
      white-space: normal;
    }
    #audit-model,
    #audit-title {
      display: inline-block;
      max-width: 100%;
      vertical-align: top;
    }
    #audit-title:not(:empty) {
      margin-left: 8px;
      font-weight: 700;
    }
    #audit-panel [data-status-logo] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    #audit-panel [data-status-logo] img {
      width: 18px;
      height: 18px;
      display: block;
      border-radius: var(--control-radius);
      pointer-events: none;
      -webkit-user-drag: none;
      user-select: none;
    }
    #audit-panel[data-done="false"] [data-status-logo] img {
      width: calc(var(--audit-loading-logo-size) - 10px);
      height: calc(var(--audit-loading-logo-size) - 10px);
      border-radius: 8px;
      position: relative;
      z-index: 2;
    }
    #audit-panel[data-done="false"] [data-status-logo] {
      position: relative;
      width: var(--audit-loading-logo-size);
      height: var(--audit-loading-logo-size);
    }
    #audit-panel[data-done="false"] [data-status-logo]::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 999px;
      border: 2px solid color-mix(in srgb, currentColor 24%, transparent);
      border-top-color: color-mix(in srgb, currentColor 78%, transparent);
      animation: audit-logo-spin 1s linear infinite;
      z-index: 1;
    }
    @keyframes audit-logo-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    #audit-panel[data-done="false"] [data-action="audit-theme"] {
      display: none;
    }
    #audit-list {
      display: flex;
      flex-direction: column;
      width: 100%;
      min-width: 0;
      max-width: 100%;
      gap: var(--audit-row-stack-gap);
      max-height: var(--audit-list-height-max);
      border-radius: var(--audit-list-radius);
      overflow-x: hidden;
      overflow-y: auto;
      clip-path: inset(0);
      padding-right: 0;
      padding-bottom: var(--audit-list-pad-bottom);
      margin-right: 0;
      scroll-snap-type: y mandatory;
      scroll-padding: 0;
      scrollbar-width: none !important;
      scrollbar-color: transparent transparent !important;
      -ms-overflow-style: none !important;
      transition: max-height 0.18s ease;
      touch-action: pan-y;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
    }
    #audit-panel [data-audit-resize="true"] {
      position: absolute;
      left: calc(var(--audit-inline-pad) + var(--audit-edge-inset));
      right: calc(var(--audit-inline-pad) + var(--audit-edge-inset));
      bottom: 3px;
      height: 8px;
      border-radius: 999px;
      cursor: ns-resize;
      opacity: 0;
      background: transparent;
      touch-action: none;
    }
    #audit-list::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
      background: transparent !important;
    }
    #audit-list::-webkit-scrollbar-thumb,
    #audit-list::-webkit-scrollbar-track {
      background: transparent !important;
      border: 0 !important;
    }
    #audit-list {
      cursor: grab;
    }
    #audit-list [data-row] {
      position: relative;
      cursor: grab;
      display: flex;
      align-items: flex-start;
      height: var(--audit-row-box-height);
      min-height: var(--audit-row-box-height);
      max-height: var(--audit-row-box-height);
      padding-top: 0;
      padding-bottom: 0;
      padding-left: 0;
      padding-right: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
      scroll-snap-align: start;
      scroll-snap-stop: always;
      overflow: hidden;
    }
    #audit-list [data-row]:not(:last-child)::after {
      display: none;
      content: none;
    }
    #audit-list [data-row][data-active="true"] {
      background: transparent;
      box-shadow: none;
    }
    #audit-list [data-row][data-active="true"] [data-word],
    #audit-list [data-row][data-active="true"] .audit-field-select,
    #audit-list [data-row][data-active="true"] .audit-field-input {
      font-weight: inherit;
      background-color: transparent;
      color: var(--audit-row-active-text);
      opacity: var(--audit-word-active-opacity);
      -webkit-text-fill-color: currentColor;
      text-shadow: none;
    }
    #audit-list .audit-line {
      display: grid;
      grid-template-columns:
        minmax(0, 1fr)
        var(--audit-control-width)
        var(--audit-control-width);
      align-items: center;
      column-gap: var(--audit-row-gap);
      width: 100%;
      min-width: 0;
      max-width: 100%;
      position: relative;
      z-index: 1;
      box-sizing: border-box;
      padding-left: var(--audit-edge-inset);
      padding-right: var(--audit-edge-inset);
      height: var(--audit-row-height);
      min-height: var(--audit-row-height);
      max-height: var(--audit-row-height);
    }
    #audit-list [data-main] {
      grid-column: 1;
      display: flex;
      align-items: center;
      min-width: 0;
      height: var(--audit-row-height);
      cursor: grab;
      user-select: none;
      -webkit-user-select: none;
    }
    #audit-list [data-word] {
      grid-column: 1;
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
      justify-self: start;
      max-width: calc(var(--audit-word-width) - var(--audit-word-inset));
      min-width: 0;
      display: inline-flex;
      align-items: center;
      box-sizing: border-box;
      margin-left: var(--audit-word-inset);
      padding-left: var(--audit-word-pill-pad-x);
      padding-right: var(--audit-word-pill-pad-x);
      height: var(--audit-row-control-height);
      border-radius: 999px;
      font-size: var(--audit-row-font-size);
      font-weight: 400;
      line-height: 1.1;
      color: var(--audit-row-idle-text);
      opacity: var(--audit-word-idle-opacity);
      cursor: pointer;
    }
    #audit-list [data-audit-field="true"] {
      grid-column: 2;
      display: flex;
      align-items: center;
      width: var(--audit-control-width);
      min-width: var(--audit-control-width);
      max-width: var(--audit-control-width);
      justify-self: end;
      box-sizing: border-box;
      padding-left: 0;
    }
    #audit-list .audit-field-box {
      width: var(--audit-control-width);
      min-width: var(--audit-control-width);
      max-width: var(--audit-control-width);
    }
    #audit-list .audit-field-choice[data-audit-input="false"] {
      position: relative;
      width: var(--audit-control-width);
      min-width: var(--audit-control-width);
      max-width: var(--audit-control-width);
      color: var(--audit-row-idle-text);
      cursor: default;
    }
    #audit-list [data-row][data-active="true"] .audit-field-choice[data-audit-input="false"] {
      color: var(--audit-row-active-text);
    }
    #audit-list .audit-field-choice[data-audit-input="false"]::before {
      content: "";
      position: absolute;
      left: calc(var(--control-pad-x) * 0.62);
      top: calc(50% + var(--audit-select-chevron-shift));
      width: 10px;
      height: 6px;
      background-color: currentColor;
      transform: translateY(-50%);
      pointer-events: none;
      z-index: 2;
      -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1.5 1.25L5 4.75L8.5 1.25' fill='none' stroke='black' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / contain no-repeat;
      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1.5 1.25L5 4.75L8.5 1.25' fill='none' stroke='black' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / contain no-repeat;
    }
    #audit-list .audit-field-box .ui-field-control {
      display: block;
      width: var(--audit-control-width);
      min-width: var(--audit-control-width);
      max-width: var(--audit-control-width);
      border: 0;
      background: transparent;
      box-shadow: none;
    }
    #audit-list .audit-field-choice[data-audit-input="false"] .ui-field-control {
      display: block;
      width: var(--audit-control-width);
      min-width: var(--audit-control-width);
      max-width: var(--audit-control-width);
      cursor: default;
    }
    #audit-list .audit-field-choice[data-audit-input="true"],
    #audit-list .audit-field-choice[data-audit-input="true"] .ui-field-control {
      width: var(--audit-control-width);
      min-width: var(--audit-control-width);
      max-width: var(--audit-control-width);
    }
    #audit-list [data-audit-actions="true"] {
      grid-column: 3;
      display: flex;
      align-items: center;
      box-sizing: border-box;
      width: var(--audit-control-width);
      min-width: var(--audit-control-width);
      max-width: var(--audit-control-width);
      justify-self: end;
      justify-content: center;
    }
    #audit-list [data-audit-actions="true"] > .ui-group-body {
      width: 100%;
      min-width: 0;
      max-width: 100%;
      justify-content: center;
      box-sizing: border-box;
    }
    #audit-list [data-audit-actions="true"],
    #audit-list [data-audit-actions="true"] .ui-group-body,
    #audit-list [data-audit-actions="true"] [data-action],
    #audit-list [data-audit-actions="true"] button {
      cursor: pointer;
    }
    #audit-list [data-audit-field="true"],
    #audit-list .audit-field-box,
    #audit-list .ui-field-control {
      cursor: default;
    }
    #audit-list [data-audit-actions="true"] [data-disabled="true"],
    #audit-list [data-audit-actions="true"] button:disabled {
      cursor: default;
    }
    #audit-list .audit-field {
      appearance: none;
      -webkit-appearance: none;
      box-sizing: border-box;
      display: block;
      width: var(--audit-control-width);
      min-width: var(--audit-control-width);
      max-width: var(--audit-control-width);
      height: var(--audit-row-height);
      min-height: var(--audit-row-height);
      max-height: var(--audit-row-height);
      border: 1px solid var(--audit-field-border);
      border-radius: 999px;
      padding-top: 0;
      padding-bottom: 0;
      padding-left: var(--control-pad-x);
      padding-right: var(--control-pad-x);
      background-color: var(--audit-field-background) !important;
      color: var(--audit-row-idle-text);
      font-family: var(--panel-font-family);
      font-size: var(--audit-row-font-size);
      font-weight: 400;
      line-height: var(--audit-row-height);
      outline: none;
      box-shadow: none;
      transform: translateZ(0) scale(1);
      transform-origin: center;
      user-select: none;
      -webkit-user-select: none;
      transition:
        background-color 0.12s ease,
        box-shadow 0.12s ease,
        transform 0.12s ease;
    }
    #audit-list .audit-field-select {
      display: block;
      width: 100% !important;
      min-width: 100% !important;
      max-width: 100% !important;
      background-image: none !important;
      padding-left: calc(var(--control-pad-x) * 2.05);
      padding-right: var(--control-pad-x);
      background-color: transparent !important;
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
    }
    #audit-list .audit-field-select option {
      background: var(--audit-field-menu-background);
      color: var(--audit-field-menu-text);
      padding-inline-start: 0 !important;
      padding-inline-end: 0 !important;
      text-align: left;
      user-select: none;
      -webkit-user-select: none;
    }
    #audit-list .audit-field-select,
    #audit-list .audit-field-select:not(:hover):not([data-audit-select-open="true"]),
    #audit-list .audit-field-select:is(:focus, :focus-visible, :active):not(:hover):not([data-audit-select-open="true"]) {
      background-color: transparent !important;
      box-shadow: none !important;
      transform: translateZ(0) scale(1);
    }
    #audit-list .audit-field-select[data-audit-select-open="true"] {
      background-color: var(--audit-field-hover-background) !important;
      box-shadow: none !important;
      transform: translateZ(0) scale(1);
    }
    @media (hover: hover) and (pointer: fine) {
      #audit-panel #audit-list .audit-field-select:hover {
        background-color: var(--audit-field-hover-background) !important;
        box-shadow: none !important;
        transform: translateZ(0) scale(1);
      }
    }
    #audit-list .audit-field-select option:checked {
      background: var(--audit-field-menu-background);
      color: var(--audit-field-menu-text);
    }
    #audit-list .audit-field-select option:hover {
      background: var(--audit-field-option-hover-background);
      color: var(--audit-field-option-hover-text);
    }
    #audit-list .audit-field-input {
      display: none;
      width: 100%;
      min-width: 100%;
      max-width: 100%;
      line-height: var(--audit-input-line-height);
      background-color: var(--audit-field-edit-background) !important;
      box-shadow: none;
    }
    #audit-list .audit-field-input:focus {
      background-color: var(--audit-field-edit-background) !important;
      box-shadow: none;
    }
    #audit-panel[data-theme="dark"] .audit-field-select {
      color-scheme: dark;
    }
    #audit-list [data-empty] {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: var(--audit-row-box-height);
      padding: calc(var(--audit-row-pad-y) / 2) var(--audit-edge-inset);
      color: var(--audit-empty-text);
      text-align: center;
    }
    @media (max-width: 820px) {
      #audit-panel {
        top: calc(env(safe-area-inset-top) + var(--audit-viewport-gap));
      }
      #audit-panel .audit-header-shell {
        padding-left: 0;
        padding-right: 0;
      }
      #audit-list .audit-line {
        grid-template-columns:
          minmax(0, 1fr)
          var(--audit-control-width)
          var(--audit-control-width);
      }
      #audit-list {
        max-height: min(50vh, calc(var(--audit-row-step) * 5));
      }
    }
    @media (max-width: 520px) {
      #audit-panel {
        --audit-word-min-width: var(--surface-audit-word-touch-min-width);
        --audit-field-min-width: var(--surface-audit-field-touch-min-width);
        --audit-inline-pad: calc(var(--surface-audit-panel-pad) * 0.75);
      }
      #audit-panel .audit-marker-group {
        display: none;
      }
    }
    @media (max-width: 360px) {
      #audit-list .audit-line {
        grid-template-columns:
          minmax(var(--audit-word-min-width), 0.8fr)
          minmax(var(--audit-field-min-width), 1fr);
        row-gap: var(--audit-row-pad-y);
      }
      #audit-list [data-audit-actions="true"] {
        grid-column: 1 / -1;
        width: 100%;
        min-width: 0;
        max-width: 100%;
        justify-content: flex-end;
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

  feedback: `
    #feedback-panel {
      --feedback-panel-width:min(var(--surface-shared-panel-width), var(--surface-shared-panel-max-width));
      width:var(--feedback-panel-width) !important;
      min-width:var(--feedback-panel-width) !important;
      max-width:var(--feedback-panel-width) !important;
      --feedback-field-bg:var(--surface-toolbar-group-bg-dark);
      height:auto!important;
      min-height:0!important;
      max-height:calc(100dvh - 32px);
      padding:12px;
      overflow:hidden;
      border-radius:var(--surface-shared-panel-radius)!important;
    }
    #feedback-panel .feedback-head {
      cursor:grab;
    }
    #feedback-panel[data-panel-dragging="true"] .feedback-head {
      cursor:grabbing;
    }
    #feedback-panel[data-theme="dark"] {
      --feedback-field-bg:var(--surface-toolbar-group-bg-dark);
    }
    #feedback-panel[data-theme="light"] {
      --feedback-field-bg:var(--surface-feedback-theme-light-field-background);
    }
    #feedback-panel > .ui-stack,
    #feedback-panel [data-feedback-body="true"] {
      width:100%;
      min-width:0;
      gap:10px;
    }
    #feedback-panel [data-feedback-selection="true"],
    #feedback-panel [data-feedback-message="true"] {
      width:100%;
      min-width:0;
      max-width:100%;
    }
    #feedback-selection.feedback-selection,
    #feedback-message.feedback-message {
      --feedback-field-font-size:16px;
      --feedback-field-line-height:24px;
      --feedback-field-pad-y:10px;
      --feedback-field-pad-x:12px;
      --feedback-selection-max-height:calc(var(--feedback-field-line-height) * 5 + var(--feedback-field-pad-y) * 2);
      box-sizing:border-box;
      display:block;
      width:100%;
      min-width:0;
      max-width:100%;
      padding-left:var(--feedback-field-pad-x);
      padding-right:var(--feedback-field-pad-x);
      font-family:var(--panel-font-family);
      font-size:var(--feedback-field-font-size);
      font-weight:400;
      line-height:var(--feedback-field-line-height);
    }
    #feedback-panel .feedback-selection-wrap {
      position:relative;
      width:100%;
      min-width:0;
      max-width:100%;
      border-radius:12px;
      overflow:hidden;
    }
    #feedback-panel .feedback-selection-wrap::before,
    #feedback-panel .feedback-selection-wrap::after {
      content:"";
      position:absolute;
      left:0;
      right:0;
      z-index:2;
      height:22px;
      pointer-events:none;
    }
    #feedback-panel .feedback-selection-wrap::before {
      top:0;
      background:linear-gradient(to bottom,var(--feedback-field-bg) 0%,color-mix(in srgb,var(--feedback-field-bg) 92%,transparent) 18%,color-mix(in srgb,var(--feedback-field-bg) 52%,transparent) 42%,color-mix(in srgb,var(--feedback-field-bg) 14%,transparent) 70%,transparent 100%);
    }
    #feedback-panel .feedback-selection-wrap::after {
      bottom:0;
      background:linear-gradient(to top,var(--feedback-field-bg) 0%,color-mix(in srgb,var(--feedback-field-bg) 92%,transparent) 18%,color-mix(in srgb,var(--feedback-field-bg) 52%,transparent) 42%,color-mix(in srgb,var(--feedback-field-bg) 14%,transparent) 70%,transparent 100%);
    }
    #feedback-selection.feedback-selection {
      min-height:calc(var(--feedback-field-line-height) + var(--feedback-field-pad-y) * 2);
      max-height:var(--feedback-selection-max-height);
      padding-top:var(--feedback-field-pad-y);
      padding-bottom:var(--feedback-field-pad-y);
      overflow-x:hidden;
      overflow-y:auto;
      scrollbar-width:none;
      border-radius:12px;
      background:var(--feedback-field-bg);
      white-space:pre-wrap;
      overflow-wrap:anywhere;
      word-break:break-word;
      user-select:none;
      -webkit-user-select:none;
      box-shadow:none;
      color:color-mix(in srgb, currentColor 58%, transparent);
    }
    #feedback-panel .feedback-selection-wrap[data-empty="false"] #feedback-selection.feedback-selection {
      padding-right:48px;
    }
    #feedback-selection.feedback-selection::-webkit-scrollbar {
      display:none;
      width:0;
      height:0;
    }
    #feedback-selection.feedback-selection[data-empty="true"] {
      overflow:hidden;
      box-shadow:none;
    }
    #feedback-panel .feedback-message-wrap {
      position:relative;
      width:100%;
      min-width:0;
      max-width:100%;
      border:1px solid transparent;
      border-radius:14px;
      overflow:hidden;
      background:var(--feedback-field-bg);
    }
    #feedback-panel .feedback-message-wrap:focus-within {
      border-color:var(--surface-feedback-field-focus-border);
    }
    #feedback-panel .feedback-message-wrap::before,
    #feedback-panel .feedback-message-wrap::after {
      content:"";
      position:absolute;
      left:1px;
      right:1px;
      z-index:2;
      height:22px;
      pointer-events:none;
    }
    #feedback-panel .feedback-message-wrap::before {
      top:1px;
      border-top-left-radius:13px;
      border-top-right-radius:13px;
      background:linear-gradient(to bottom,var(--feedback-field-bg) 0%,color-mix(in srgb,var(--feedback-field-bg) 92%,transparent) 18%,color-mix(in srgb,var(--feedback-field-bg) 52%,transparent) 42%,color-mix(in srgb,var(--feedback-field-bg) 14%,transparent) 70%,transparent 100%);
    }
    #feedback-panel .feedback-message-wrap::after {
      bottom:1px;
      border-bottom-left-radius:13px;
      border-bottom-right-radius:13px;
      background:linear-gradient(to top,var(--feedback-field-bg) 0%,color-mix(in srgb,var(--feedback-field-bg) 92%,transparent) 18%,color-mix(in srgb,var(--feedback-field-bg) 52%,transparent) 42%,color-mix(in srgb,var(--feedback-field-bg) 14%,transparent) 70%,transparent 100%);
    }
    #feedback-message.feedback-message {
      height:auto;
      min-height:calc(var(--feedback-field-line-height) * 3 + var(--feedback-field-pad-y) * 2 + 28px);
      max-height:var(--feedback-selection-max-height);
      padding-top:var(--feedback-field-pad-y);
      padding-bottom:52px;
      border:0;
      border-radius:13px;
      outline:none;
      resize:vertical;
      overflow-x:hidden;
      overflow-y:auto;
      background:var(--feedback-field-bg);
      color:inherit;
      box-shadow:none;
    }

    #feedback-message.feedback-message::-webkit-resizer,
    #feedback-message.feedback-message::-webkit-scrollbar-corner {
      background:transparent !important;
      border:0 !important;
      opacity:0 !important;
    }
    #feedback-message.feedback-message::placeholder {
      color:currentColor;
      opacity:.58;
    }
    #feedback-message.feedback-message:focus {
      box-shadow:none;
    }
    #feedback-panel .feedback-corner {
      position:absolute;
      right:8px;
      bottom:8px;
      z-index:12;
      opacity:1 !important;
      color:var(--surface-toolbar-capsule-text-dark) !important;
      background:transparent !important;
      border-radius:0 !important;
      box-shadow:none !important;
      overflow:visible;
      isolation:isolate;
    }
    #feedback-panel .feedback-corner::before {
      content:"";
      position:absolute;
      inset:-6px;
      z-index:0;
      border-radius:12px;
      background:var(--feedback-field-bg);
      box-shadow:0 0 0 1px var(--feedback-field-bg);
      pointer-events:none;
    }
    #feedback-panel .feedback-corner .ui-icon-box {
      position:relative;
      z-index:1;
      background:transparent !important;
      box-shadow:none !important;
    }
    #feedback-panel .feedback-corner,
    #feedback-panel .feedback-corner .ui-icon-box {
      border-radius:0 !important;
    }
    #feedback-panel .feedback-corner .ui-icon-content,
    #feedback-panel .feedback-corner .toolbar-icon {
      position:relative;
      z-index:13;
    }
    #feedback-panel[data-theme="light"] .feedback-corner {
      color:var(--surface-toolbar-capsule-text-light) !important;
    }
    #feedback-panel .feedback-corner .toolbar-icon {
      filter:var(--surface-glyph-filter) !important;
    }
    #feedback-panel[data-theme="dark"] .feedback-corner .toolbar-icon {
      filter:var(--surface-toolbar-glyph-filter-dark-active) !important;
    }
    #feedback-panel[data-theme="light"] .feedback-corner .toolbar-icon {
      filter:var(--surface-toolbar-glyph-filter-light-active) !important;
    }
    #feedback-panel .feedback-selection-clear {
      top:8px;
      right:8px;
      bottom:auto;
      --ui-corner-bleed:0px;
    }
    #feedback-selection-clear[hidden] {
      display:none !important;
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
      background: var(--surface-filter-panel-theme-dark-background);
      color: var(--surface-toolbar-dark-text);
      box-shadow: var(--surface-toolbar-dark-panel-shadow);
    }
    #filter-panel[data-theme="light"] {
      border-color: var(--surface-toolbar-light-panel-border);
      background: var(--surface-filter-panel-theme-light-background);
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
      min-width: var(--surface-filter-period-width);
      text-align: center;
      font-weight: 600;
    }
    #filter-panel [data-role="section"] {
      min-height: var(--surface-filter-button-height);
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
      width: var(--surface-filter-button-height);
      height: var(--surface-filter-button-height);
      min-height: var(--surface-filter-button-height);
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
      width: var(--surface-filter-button-height);
      height: var(--surface-filter-button-height);
      min-height: var(--surface-filter-button-height);
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
      --diff-canvas-background: var(--surface-diff-theme-light-canvas-background);
      --diff-panel-background: var(--surface-diff-theme-light-panel-background);
      --diff-panel-border: var(--surface-diff-theme-light-panel-border);
      --diff-panel-text: var(--surface-diff-theme-light-panel-text);
      --diff-box-background: var(--surface-diff-theme-light-box-background);
      --diff-line-background: var(--surface-diff-theme-light-line-background);
      --diff-context-background: var(--surface-diff-theme-light-context-background);
      --diff-add-background: var(--surface-diff-theme-light-add-background);
      --diff-add-accent: var(--surface-diff-theme-light-add-accent);
      --diff-del-background: var(--surface-diff-theme-light-remove-background);
      --diff-del-accent: var(--surface-diff-theme-light-remove-accent);
      --diff-change-background: var(--surface-diff-theme-light-change-background);
      --diff-change-accent: var(--surface-diff-theme-light-change-accent);
      --diff-code-background: var(--surface-diff-theme-light-code-background);
    }
    body[data-diff-theme="dark"] {
      --diff-canvas-background: var(--surface-diff-theme-dark-canvas-background);
      --diff-panel-background: var(--surface-diff-theme-dark-panel-background);
      --diff-panel-border: var(--surface-diff-theme-dark-panel-border);
      --diff-panel-text: var(--surface-diff-theme-dark-panel-text);
      --diff-box-background: var(--surface-diff-theme-dark-box-background);
      --diff-line-background: var(--surface-diff-theme-dark-line-background);
      --diff-context-background: var(--surface-diff-theme-dark-context-background);
      --diff-add-background: var(--surface-diff-theme-dark-add-background);
      --diff-add-accent: var(--surface-diff-theme-dark-add-accent);
      --diff-del-background: var(--surface-diff-theme-dark-remove-background);
      --diff-del-accent: var(--surface-diff-theme-dark-remove-accent);
      --diff-change-background: var(--surface-diff-theme-dark-change-background);
      --diff-change-accent: var(--surface-diff-theme-dark-change-accent);
      --diff-code-background: var(--surface-diff-theme-dark-code-background);
    }
    @media (prefers-color-scheme: dark) {
      body[data-diff-mode]:not([data-diff-theme="light"]) {
        --diff-canvas-background: var(--surface-diff-theme-dark-canvas-background);
        --diff-panel-background: var(--surface-diff-theme-dark-panel-background);
        --diff-panel-border: var(--surface-diff-theme-dark-panel-border);
        --diff-panel-text: var(--surface-diff-theme-dark-panel-text);
        --diff-box-background: var(--surface-diff-theme-dark-box-background);
        --diff-line-background: var(--surface-diff-theme-dark-line-background);
        --diff-context-background: var(--surface-diff-theme-dark-context-background);
        --diff-add-background: var(--surface-diff-theme-dark-add-background);
        --diff-add-accent: var(--surface-diff-theme-dark-add-accent);
        --diff-del-background: var(--surface-diff-theme-dark-remove-background);
        --diff-del-accent: var(--surface-diff-theme-dark-remove-accent);
        --diff-change-background: var(--surface-diff-theme-dark-change-background);
        --diff-change-accent: var(--surface-diff-theme-dark-change-accent);
        --diff-code-background: var(--surface-diff-theme-dark-code-background);
      }
    }
    body[data-diff-mode="fit"] #wpbody-content {
      overflow-x: hidden;
    }
    body[data-diff-mode="fit"] table.diff {
      width: 100% !important;
      max-width: 100% !important;
      table-layout: fixed !important;
    }
    body[data-diff-mode="fit"] table.diff colgroup {
      display: table-column-group !important;
    }
    body[data-diff-mode="fit"] table.diff col.ltype {
      width: 2px !important;
    }
    body[data-diff-mode="fit"] table.diff col.content {
      width: calc((100% - 4px) / 2) !important;
    }
    body[data-diff-mode="fit"] table.diff td:not([class]):not([colspan]) {
      width: 2px !important;
      min-width: 2px !important;
      max-width: 2px !important;
      padding: 0 !important;
      border: 0 !important;
      color: transparent !important;
      font-size: 0 !important;
      line-height: 0 !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
      white-space: nowrap !important;
    }
    body[data-diff-mode="fit"] table.diff td[colspan="2"] {
      display: table-cell !important;
    }
    body[data-diff-mode="fit"] table.diff td,
    body[data-diff-mode="fit"] table.diff th,
    body[data-diff-mode="fit"] table.diff pre,
    body[data-diff-mode="fit"] table.diff code {
      white-space: pre-wrap !important;
      word-break: break-word !important;
      overflow-wrap: anywhere !important;
      vertical-align: top !important;
      box-sizing: border-box !important;
    }
    body[data-diff-mode="fit"] table.diff td.diff-deletedline,
    body[data-diff-mode="fit"] table.diff td.diff-addedline,
    body[data-diff-mode="fit"] table.diff td.diff-context {
      width: auto !important;
      max-width: none !important;
      padding-left: 8px !important;
      padding-right: 8px !important;
      text-align: left !important;
    }
    body[data-diff-mode="fit"] table.diff ins,
    .diff-inline-box ins,
    .diff-change-content ins {
      background: var(--diff-add-background) !important;
      border-radius: 3px !important;
      text-decoration: none !important;
    }
    body[data-diff-mode="fit"] table.diff del,
    .diff-inline-box del,
    .diff-change-content del,
    body[data-diff-mode="inline"] .diff-inline-part[data-diff-part="deleted"] {
      background: var(--diff-del-background) !important;
      border-radius: 3px !important;
      text-decoration: none !important;
    }
    body[data-diff-mode="split"],
    body[data-diff-mode="inline"] {
      overflow: hidden !important;
    }
    html:has(body[data-diff-mode="split"]),
    html:has(body[data-diff-mode="inline"]) {
      overflow: hidden !important;
    }
    body[data-diff-mode="split"] .diff-reader-list,
    body[data-diff-mode="inline"] .diff-reader-list {
      position: fixed !important;
      inset: 0 !important;
      z-index: 999999 !important;
      width: auto !important;
      max-width: none !important;
      min-height: 100vh !important;
      margin: 0 !important;
      padding: 28px clamp(12px, 1.6vw, 28px) 104px !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      scrollbar-width: none;
      -ms-overflow-style: none;
      box-sizing: border-box;
      background: var(--diff-canvas-background);
      color: var(--diff-panel-text);
    }
    body[data-diff-mode="split"] .diff-reader-list::-webkit-scrollbar,
    body[data-diff-mode="inline"] .diff-reader-list::-webkit-scrollbar {
      width: 0;
      height: 0;
      display: none;
    }
    .diff-inline-box {
      width: 100%;
      max-width: none;
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      color: inherit;
      box-shadow: none;
      font-family: var(--surface-diff-mono-font);
      font-size: 13px;
      line-height: 1.55;
    }
    .diff-inline-box,
    .diff-inline-box * {
      white-space: pre-wrap;
      word-break: break-word;
      overflow-wrap: anywhere;
      box-sizing: border-box;
    }
    .diff-inline-box pre,
    body[data-diff-mode="fit"] table.diff pre {
      margin: var(--surface-diff-line-gap) 0;
      padding: var(--surface-diff-inline-pad);
      border: 1px solid var(--diff-panel-border);
      border-radius: calc(var(--surface-diff-inline-radius) * 0.65);
      background: var(--diff-code-background);
    }
    .diff-change-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .diff-change-section + .diff-change-section {
      margin-top: 12px;
    }
    .diff-change-title {
      width: max-content;
      max-width: 100%;
      padding: 5px 10px;
      border: 1px solid var(--diff-panel-border);
      border-radius: 999px;
      appearance: none;
      background: var(--diff-box-background);
      color: inherit;
      font: 400 12px/1.2 var(--panel-font-family);
      text-align: left;
      opacity: 0.86;
      cursor: pointer;
    }
    body[data-diff-mode="inline"] .diff-change-title {
      cursor: default;
    }
    .diff-change-list,
    body[data-diff-mode="inline"] .diff-inline-flow {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .diff-change-card {
      min-width: 0;
    }
    body[data-diff-mode="split"] .diff-change-card {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      overflow: visible;
      border: 0;
      border-radius: 0;
      background: transparent;
    }
    body[data-diff-mode="split"] .diff-change-card[data-diff-change="context"] {
      display: block;
      padding: 9px 11px;
      border: 1px solid var(--diff-panel-border);
      border-radius: var(--surface-diff-inline-radius);
      background: var(--diff-context-background);
      opacity: 0.78;
    }
    body[data-diff-mode="inline"] .diff-change-card {
      display: flex;
      flex-direction: column;
      gap: 0;
      overflow: hidden;
      border: 1px solid var(--diff-panel-border);
      border-radius: var(--surface-diff-inline-radius);
      background: var(--diff-line-background);
    }
    .diff-change-side {
      min-width: 0;
      display: block;
      padding: 9px 11px;
      border: 1px solid var(--diff-panel-border);
      border-radius: var(--surface-diff-inline-radius);
    }
    body[data-diff-mode="inline"] .diff-change-side {
      border: 0;
      border-radius: 0;
    }
    body[data-diff-mode="inline"] .diff-change-side + .diff-change-side {
      border-top: 1px solid var(--diff-panel-border);
    }
    .diff-change-side[data-diff-side="added"] {
      background: color-mix(in srgb, var(--diff-add-background) 78%, transparent);
    }
    .diff-change-side[data-diff-side="deleted"] {
      background: color-mix(in srgb, var(--diff-del-background) 78%, transparent);
    }
    body[data-diff-mode="split"] .diff-change-side[data-diff-empty="true"] {
      min-height: 38px;
      border-style: dashed;
      background: var(--diff-line-background);
      opacity: 0.42;
    }
    .diff-change-content {
      min-width: 0;
    }
    .diff-change-label {
      display: none;
    }
    .diff-change-glyph {
      width: max-content;
      margin: 0 0 6px;
      opacity: 0.72;
    }
    .diff-change-glyph svg {
      display: block;
      stroke-width: 1.45 !important;
    }
    .diff-change-side[data-diff-side="added"] .diff-change-glyph {
      color: var(--diff-add-accent);
    }
    .diff-change-side[data-diff-side="deleted"] .diff-change-glyph {
      color: var(--diff-del-accent);
    }
    .diff-html-token {
      opacity: 0.46;
    }
    #diff-panel {
      --panel-font-size: 12px;
      --panel-line-height: 1.35;
      z-index: 1000000;
      right: var(--surface-diff-panel-right);
      bottom: var(--surface-diff-panel-bottom);
      width: max-content;
      min-width: max-content;
      max-width: calc(100vw - 32px);
      height: auto;
      max-height: none;
      overflow: visible;
      padding: var(--surface-diff-panel-pad);
      border-color: var(--diff-panel-border);
      border-radius: var(--surface-frame-capsule-radius);
      background: var(--diff-panel-background);
      color: var(--diff-panel-text);
      box-shadow: var(--surface-toolbar-dark-panel-shadow);
      backdrop-filter: var(--surface-toolbar-glass-backdrop);
      -webkit-backdrop-filter: var(--surface-toolbar-glass-backdrop);
    }
    #diff-panel[data-theme="light"] {
      box-shadow: var(--surface-toolbar-light-panel-shadow);
    }
    #diff-panel .ui-stack {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 6px;
      width: max-content;
      min-width: 100%;
    }
    #diff-panel .diff-head {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--surface-diff-panel-gap);
      width: max-content;
      max-width: 100%;
      margin: 0 auto;
      cursor: grab;
    }
    #diff-panel .diff-head > [data-line] {
      display: flex;
      align-items: center;
      justify-content: center;
      width: auto;
      min-width: 0;
      flex: 0 0 auto;
      padding: 0;
    }
    #diff-panel [data-diff-mode-button="true"] {
      flex: 0 0 auto;
    }
    #diff-panel .diff-mode-group,
    #diff-panel .diff-mode-label,
    #diff-panel .diff-title,
    #diff-panel .diff-warnings {
      display: none !important;
    }
    #diff-panel,
    #diff-panel * {
      font-weight: 400 !important;
    }
    #diff-panel .diff-stat-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--surface-diff-panel-gap);
      width: 100%;
    }
    #diff-panel .diff-stat-cluster {
      flex: 0 0 auto;
    }
    #diff-panel .diff-stat-cluster > .ui-group-body {
      width: auto !important;
      background: transparent !important;
      box-shadow: none !important;
    }
    #diff-panel .diff-stat {
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 4px 3px;
      border-radius: 12px;
      background: transparent;
    }
    #diff-panel .diff-stat-label {
      font-size: 10px;
      line-height: 1.1;
      opacity: 0.58;
    }
    #diff-panel .diff-stat-value {
      font-size: 13px;
      line-height: 1.1;
      white-space: nowrap;
      color: var(--diff-panel-text);
    }
    #diff-panel .diff-stat[data-diff-tone="add"] .diff-stat-value {
      color: var(--diff-add-accent);
    }
    #diff-panel .diff-stat[data-diff-tone="del"] .diff-stat-value {
      color: var(--diff-del-accent);
    }
    .panel[data-ui-surface="toolbar"] [data-ui-marker="true"],
    .panel[data-ui-surface="toolbar"] [data-ui-cluster="true"]:not([data-ui-role="marker"]) {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      width: max-content;
      min-width: 0;
      max-width: max-content;
    }
    .panel[data-ui-surface="toolbar"] [data-ui-marker="true"] > .ui-group-body,
    .panel[data-ui-surface="toolbar"] [data-ui-cluster="true"]:not([data-ui-role="marker"]) > .ui-group-body {
      display: inline-flex !important;
      flex-direction: row !important;
      align-items: center;
      justify-content: center;
      width: auto !important;
      min-width: 0 !important;
      max-width: none !important;
    }
    @media (max-width: 760px) {
      body[data-diff-mode="split"] .diff-reader-list,
      body[data-diff-mode="inline"] .diff-reader-list {
        padding: 14px 0 96px !important;
      }
      body[data-diff-mode="split"] .diff-change-card {
        grid-template-columns: 1fr;
      }
    }
  `,
};

const reader = {
  color(theme) {
    if (theme === "light")
      return {
        background: design.surface.reader.theme.light.background,
        color: design.surface.reader.theme.light.text,
        fade: design.surface.reader.theme.light.fade,
        shade: design.surface.reader.theme.light.shade,
        shadow: design.surface.reader.theme.light.shadow,
      };
    return {
      background: design.surface.reader.theme.dark.background,
      color: design.surface.reader.theme.dark.text,
      fade: design.surface.reader.theme.dark.fade,
      shade: design.surface.reader.theme.dark.shade,
      shadow: design.surface.reader.theme.dark.shadow,
    };
  },
  text({ theme, panel, hud }) {
    const color = reader.color(theme);
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
          touch-action:manipulation!important;
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
        body.reader-active{
          position:fixed!important;
          inset:0!important;
          width:100%!important;
          height:100%!important;
          overflow:hidden!important;
          touch-action:none!important
        }
        html:has(body.reader-active){
          overflow:hidden!important;
          height:100%!important;
          touch-action:none!important
        }
        body.reader-active,
        body.reader-active #${panel},
        body.reader-active #${hud},
        body.reader-active #${hud} *{
          touch-action:manipulation!important
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
        #${hud}{
          position:fixed!important;
          left:var(--reader-viewport-left,0px)!important;
          top:var(--reader-viewport-top,0px)!important;
          width:var(--reader-viewport-width,100vw)!important;
          height:var(--reader-viewport-height,100vh)!important;
          right:auto!important;
          bottom:auto!important;
          z-index:1000001!important;
          pointer-events:none!important;
          border:0!important;
          border-radius:0!important;
          box-shadow:none!important;
          background:transparent!important;
          overflow:visible!important
        }
        #${hud}{
          --reader-hud-gap:var(--surface-reader-hud-gap);
          --reader-hud-inset:var(--surface-reader-hud-inset);
          --reader-hud-button-size:var(--surface-reader-hud-button-size);
          --reader-hud-keyboard-shift:0px;
          --reader-hud-icon-size:calc(var(--reader-hud-button-size) * var(--surface-reader-hud-icon-ratio));
          --reader-hud-radius:calc(var(--reader-hud-button-size) * var(--surface-reader-hud-radius-ratio));
          --reader-hud-top:calc(env(safe-area-inset-top) + var(--surface-reader-hud-top-offset))
        }
        #${hud}:not([data-interaction="touch-virtual"]){
          display:none!important
        }
        #${hud}[data-interaction="touch-virtual"]{
          --reader-hud-keyboard-shift:0px
        }
        #${hud} .reader-hud-zone{
          position:absolute!important;
          display:flex!important;
          align-items:center!important;
          gap:var(--reader-hud-gap)!important;
          pointer-events:none!important
        }
        #${hud} .reader-hud-zone[data-reader-hud-zone="left-bottom"]{
          left:var(--reader-hud-inset)!important;
          bottom:calc(env(safe-area-inset-bottom) + var(--reader-hud-bottom-gap,20px) - var(--reader-hud-keyboard-shift,0px))!important
        }
        #${hud} .reader-hud-zone[data-reader-hud-zone="left-middle"]{
          left:var(--reader-hud-inset)!important;
          top:50%!important;
          transform:translateY(-50%)!important;
          flex-direction:column!important
        }
        #${hud} .reader-hud-zone[data-reader-hud-zone="left-bottom-right"]{
          left:calc(var(--reader-hud-inset) + var(--reader-hud-button-size) + var(--reader-hud-gap))!important;
          bottom:calc(env(safe-area-inset-bottom) + var(--reader-hud-bottom-gap,20px) - var(--reader-hud-keyboard-shift,0px))!important
        }
        #${hud} .reader-hud-zone[data-reader-hud-zone="center-bottom"]{
          left:50%!important;
          bottom:calc(env(safe-area-inset-bottom) + var(--reader-hud-bottom-gap,20px) - var(--reader-hud-keyboard-shift,0px))!important;
          transform:translateX(-50%)!important
        }
        #${hud} .reader-hud-zone[data-reader-hud-zone="right-middle"]{
          right:var(--reader-hud-inset)!important;
          top:50%!important;
          transform:translateY(-50%)!important;
          flex-direction:column!important
        }
        #${hud} .reader-hud-zone[data-reader-hud-zone="right-bottom"]{
          right:var(--reader-hud-inset)!important;
          bottom:calc(env(safe-area-inset-bottom) + var(--reader-hud-bottom-gap,20px) - var(--reader-hud-keyboard-shift,0px))!important
        }
        #${hud} .reader-hud-zone[data-reader-hud-zone="top-right"]{
          right:var(--reader-hud-inset)!important;
          top:var(--reader-hud-top)!important
        }
        @media (max-width: 700px) {
          #${hud}{
            --reader-hud-gap:var(--surface-reader-hud-phone-gap);
            --reader-hud-inset:var(--surface-reader-hud-phone-inset);
            --reader-hud-button-size:var(--surface-reader-hud-phone-button-size)
          }
          #${hud} .reader-hud-zone[data-reader-hud-zone="left-bottom"]{
            flex-direction:column!important;
            align-items:flex-start!important
          }
          #${hud} .reader-hud-zone[data-reader-hud-zone="left-middle"]{
            top:auto!important;
            bottom:calc(env(safe-area-inset-bottom) + var(--reader-hud-bottom-gap,20px) + var(--reader-hud-button-size) + var(--reader-hud-gap) - var(--reader-hud-keyboard-shift,0px))!important;
            transform:none!important
          }
          #${hud} .reader-hud-zone[data-reader-hud-zone="left-bottom-right"]{
            left:calc(var(--reader-hud-inset) + var(--reader-hud-button-size) + var(--reader-hud-gap))!important;
            bottom:calc(env(safe-area-inset-bottom) + var(--reader-hud-bottom-gap,20px) - var(--reader-hud-keyboard-shift,0px))!important
          }
          #${hud} .reader-hud-zone[data-reader-hud-zone="right-middle"]{
            top:auto!important;
            bottom:calc(env(safe-area-inset-bottom) + var(--reader-hud-bottom-gap,20px) + var(--reader-hud-button-size) + var(--reader-hud-gap) - var(--reader-hud-keyboard-shift,0px))!important;
            transform:none!important
          }
        }
        #${hud} .reader-hud-zone:empty{
          display:none!important
        }
        #${hud} .reader-hud-button{
          pointer-events:auto!important;
          min-width:var(--reader-hud-button-size)!important;
          min-height:var(--reader-hud-button-size)!important;
          width:var(--reader-hud-button-size)!important;
          height:var(--reader-hud-button-size)!important;
          padding:0!important;
          border:1px solid rgba(255,255,255,.24)!important;
          border-radius:var(--reader-hud-radius)!important;
          background:rgba(34,34,34,.58)!important;
          color:var(--surface-toolbar-dark-text)!important;
          opacity:.96!important;
          backdrop-filter:var(--surface-toolbar-glass-backdrop)!important;
          -webkit-backdrop-filter:var(--surface-toolbar-glass-backdrop)!important;
          box-shadow:0 10px 30px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.14)!important
        }
        #${hud}[data-theme="light"] .reader-hud-button{
          border-color:rgba(0,0,0,.18)!important;
          background:rgba(255,255,255,.72)!important;
          color:var(--surface-toolbar-light-text)!important;
          box-shadow:0 10px 30px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.54)!important
        }
        #${hud} .reader-hud-button:active{
          background:rgba(64,64,64,.7)!important
        }
        #${hud}[data-theme="light"] .reader-hud-button:active{
          background:rgba(245,245,245,.86)!important
        }
        #${hud} .reader-hud-button[data-active="true"]{
          background:rgba(255,255,255,.18)!important;
          box-shadow:0 10px 30px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.18)!important
        }
        #${hud}[data-theme="light"] .reader-hud-button[data-active="true"]{
          background:rgba(0,0,0,.14)!important;
          box-shadow:0 10px 30px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.54)!important
        }
        #${hud} .reader-hud-button .ui-icon-box{
          width:100%!important;
          height:100%!important
        }
        #${hud} .reader-hud-icon{
          width:var(--reader-hud-icon-size)!important;
          height:var(--reader-hud-icon-size)!important;
          min-width:var(--reader-hud-icon-size)!important;
          min-height:var(--reader-hud-icon-size)!important
        }
        @media (pointer:fine) {
          #${hud}{
            display:none!important
          }
        }
      `;
  },
};

const editor = {
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

const ui = {
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
        background:var(--surface-popup-overlay-bg);
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
        margin:0 0 var(--surface-popup-nav-bottom);
      }
      #ui-popup .ui-nav-label{
        min-height:var(--surface-popup-nav-label-height);
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
        margin:0 0 var(--surface-popup-head-bottom);
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
        min-height:var(--surface-popup-field-height);
        border:var(--control-border);
        border-radius:var(--surface-popup-field-radius);
        padding:var(--surface-popup-field-pad-y) var(--surface-popup-field-pad-x);
        background:var(--surface-popup-field-theme-light-background);
        color:inherit;
        font:400 calc(var(--popup-font-size) + 1px)/1.45 var(--panel-font-family);
        resize:var(--surface-popup-field-resize);
        outline:none;
      }
      #ui-popup .panel[data-ui-surface="toolbar"][data-theme="dark"] .ui-field{
        background:var(--surface-popup-field-theme-dark-background);
        border-color:var(--surface-toolbar-dark-panel-border);
        color:var(--surface-toolbar-dark-text);
      }
      #ui-popup .panel[data-ui-surface="toolbar"][data-theme="light"] .ui-field{
        background:var(--surface-popup-field-theme-light-background);
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
        margin-top:var(--surface-popup-row-top);
        min-width:0;
      }
      #ui-popup .actions{
        display:flex;
        align-items:center;
        gap:var(--surface-popup-row-gap);
        flex:0 0 auto;
      }
      #ui-popup .ui-counter-pill{
        --counter-pad-x:var(--surface-popup-counter-pad-x);
        --counter-min-height:var(--surface-popup-counter-height);
        --counter-text-size:calc(var(--popup-font-size) - 2px);
        cursor:pointer;
        width:100%;
        min-width:100%;
        max-width:100%;
        height:calc(var(--surface-button-size) - 6px);
        opacity:var(--surface-counter-state-opacity);
      }
      #ui-popup .ui-counter-group{
        width:var(--surface-popup-counter-group-width);
        min-width:var(--surface-popup-counter-group-min-width);
        max-width:100%;
      }
      #ui-popup .panel[data-ui-surface="toolbar"][data-theme="dark"] .ui-counter-pill{
        color:var(--surface-toolbar-dark-text);
      }
      #ui-popup .panel[data-ui-surface="toolbar"][data-theme="light"] .ui-counter-pill{
        color:var(--surface-toolbar-light-text);
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

const admin = {
  popover(id = "launchpad-field-diff-popover") {
    const selector = `#${id}`;
    return `
      [data-launchpad-field-normalized="true"]{
        background:var(--surface-popover-field-normalized-background)!important;
        transition:var(--surface-popover-field-normalized-transition);
      }
      ${selector}{
        position:fixed;
        z-index:2147483000;
        width:var(--surface-popover-size-width);
        box-sizing:border-box;
        pointer-events:none;
        opacity:0;
        visibility:hidden;
        transform:var(--surface-popover-motion-hidden);
        transition:var(--surface-popover-motion-hidden-transition);
        border-radius:var(--surface-popover-shape-radius);
        overflow:visible;
      }
      ${selector}[data-open="true"]{
        pointer-events:auto;
        opacity:1;
        visibility:visible;
        transform:var(--surface-popover-motion-visible);
        transition:var(--surface-popover-motion-visible-transition);
      }
      ${selector}[data-theme="dark"]{
        background:var(--surface-popover-theme-dark-background);
        border-color:var(--surface-popover-theme-dark-border);
        color:var(--surface-popover-theme-dark-text);
        box-shadow:var(--surface-popover-theme-dark-shadow);
      }
      ${selector}[data-theme="light"]{
        background:var(--surface-popover-theme-light-background);
        border-color:var(--surface-popover-theme-light-border);
        color:var(--surface-popover-theme-light-text);
        box-shadow:var(--surface-popover-theme-light-shadow);
      }
      ${selector} .launchpad-popover{
        overflow:visible;
        font-size:var(--surface-popover-text-size);
        line-height:var(--surface-popover-text-line);
        user-select:none;
        -webkit-user-select:none;
      }
      ${selector} .launchpad-popover-row{
        position:relative;
        display:block;
        min-height:var(--surface-popover-size-min-height);
        padding:var(--surface-popover-row-pad-y) var(--surface-popover-row-action-pad-x) var(--surface-popover-row-pad-y) var(--surface-popover-row-pad-x);
      }
      ${selector} .launchpad-popover-body{
        min-width:0;
        white-space:normal;
        word-break:normal;
        overflow-wrap:break-word;
        padding:var(--surface-popover-row-body-pad-y) 0;
      }
      ${selector} .launchpad-popover-actions{
        position:absolute;
        right:var(--surface-popover-action-right);
        top:0;
        height:var(--surface-popover-size-min-height);
        display:flex;
        align-items:center;
        gap:var(--surface-popover-action-gap);
      }
      ${selector} .launchpad-popover-action{
        appearance:none;
        -webkit-appearance:none;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        width:var(--surface-popover-action-size);
        height:var(--surface-popover-action-size);
        min-width:var(--surface-popover-action-size);
        min-height:var(--surface-popover-action-size);
        margin:0;
        padding:0;
        background:transparent!important;
        border:0!important;
        border-radius:0!important;
        box-shadow:none!important;
        color:currentColor;
        cursor:pointer;
        opacity:var(--surface-popover-action-idle-opacity);
        line-height:1;
      }
      ${selector} .launchpad-popover-action:hover,
      ${selector} .launchpad-popover-action:focus-visible{
        background:transparent!important;
        border:0!important;
        box-shadow:none!important;
        opacity:var(--surface-popover-action-active-opacity);
      }
      ${selector} .launchpad-popover-action .ui-glyph{
        display:block;
        width:var(--surface-popover-action-size);
        height:var(--surface-popover-action-size);
        line-height:1;
      }
      ${selector} .launchpad-popover-action svg{
        display:block;
        width:100%;
        height:100%;
      }
      ${selector} .launchpad-popover-diff-add{
        background:var(--surface-popover-diff-add-background);
        box-shadow:var(--surface-popover-diff-add-shadow);
        text-decoration:none;
      }
      ${selector} .launchpad-popover-diff-remove{
        background:var(--surface-popover-diff-remove-background);
        box-shadow:var(--surface-popover-diff-remove-shadow);
        text-decoration:none!important;
      }
      ${selector} .launchpad-popover-diff-part{
        border-radius:var(--surface-popover-diff-part-radius);
        padding:var(--surface-popover-diff-part-pad-y) var(--surface-popover-diff-part-pad-x);
        box-decoration-break:clone;
        -webkit-box-decoration-break:clone;
      }
      ${selector} .launchpad-popover-diff-block{
        display:inline;
        border-radius:var(--surface-popover-diff-part-radius);
        margin:0;
        padding:0;
      }
    `;
  },
  stack() {
    return `
      .panel[data-admin-stack] .ui-counter-pill{
        --counter-radius:var(--surface-counter-shape-radius,999px);
        --counter-pad-x:var(--surface-counter-size-pad-x,10px);
        --counter-min-height:var(--rail-pill-cross,calc(var(--surface-button-size) + var(--rail-pill-pad) * 2));
        --counter-min-width:100%;
        --counter-track-background:var(--surface-counter-track-background);
        --counter-fill-background:var(--surface-counter-fill-background);
        --counter-over-border:var(--surface-warning-border);
        --counter-warning-stripe-background:var(--surface-warning-stripe-background);
        --counter-overflow-background:var(--counter-warning-stripe-background);
        --counter-text-color:var(--admin-counter-text,currentColor);
        --counter-text-size:calc(var(--admin-font-size) - 2px);
        cursor:pointer!important;
        width:100%;
        min-width:100%;
        max-width:100%;
        height:var(--counter-min-height);
        opacity:var(--surface-counter-state-opacity);
      }
      .panel[data-admin-stack] .ui-counter-pill[data-over="true"]{
        --counter-warning-stripe-background:var(--surface-warning-stripe-background);
        --counter-overflow-background:var(--surface-warning-stripe-background);
        --counter-overflow-opacity:1;
        --counter-text-color:var(--surface-warning-text);
        border-color:var(--surface-warning-border)!important;
      }
      .panel[data-admin-stack] .ui-counter-pill[data-over="true"]::after{
        z-index:2;
        background:var(--surface-warning-stripe-background)!important;
        background-size:auto!important;
        opacity:1!important;
      }
      .panel[data-admin-stack] .ui-counter-pill[data-over="true"] .ui-counter-label,
      .panel[data-admin-stack] .ui-counter-pill[data-over="true"] .ui-counter-text{
        z-index:3;
      }
      .panel[data-ui-surface="toolbar"][data-admin-stack]{
        --admin-panel-width:min(var(--surface-shared-panel-width), var(--surface-shared-panel-max-width));
        --admin-field-width:100%;
        --admin-font-size:16px;
        --admin-field-pad-x:12px;
        --admin-field-bg:var(--surface-toolbar-group-bg-dark);
        position:fixed;
        z-index:1000004;
        display:flex;
        flex-direction:column;
        width:var(--admin-panel-width) !important;
        min-width:var(--admin-panel-width) !important;
        max-width:var(--admin-panel-width) !important;
        height:auto;
        max-height:calc(100vh - 84px);
        min-height:0;
        overflow:hidden;
        overscroll-behavior:contain;
        touch-action:none;
        padding:var(--panel-pad);
        border-radius:var(--surface-shared-panel-radius)!important;
        font-size:var(--admin-font-size);
        font-weight:400;
        outline:0!important;
        -webkit-tap-highlight-color:transparent;
      }
      .panel[data-ui-surface="toolbar"][data-admin-stack]:focus,
      .panel[data-ui-surface="toolbar"][data-admin-stack]:focus-visible,
      .panel[data-ui-surface="toolbar"][data-admin-stack]:active{
        outline:0!important;
      }
      .panel[data-admin-stack][data-panel-draggable="true"]{
        cursor:grab;
      }
      .panel[data-admin-stack][data-panel-dragging="true"]{
        cursor:grabbing;
      }
      .panel[data-admin-stack] input,
      .panel[data-admin-stack] textarea{
        cursor:text!important;
      }
      .panel[data-admin-stack] button,
      .panel[data-admin-stack] [data-action]{
        cursor:pointer!important;
      }
      .panel[data-admin-stack][data-theme="dark"]{
        --admin-field-bg:var(--surface-toolbar-group-bg-dark);
        --admin-counter-text:var(--surface-toolbar-capsule-text-dark);
      }
      .panel[data-admin-stack][data-theme="light"]{
        --admin-field-bg:rgb(238,238,238);
        --admin-counter-text:var(--surface-toolbar-capsule-text-light);
      }
      .panel[data-admin-stack] [data-admin-stack-head="true"]{
        min-height:40px;
        align-items:center;
        cursor:grab;
      }
      .panel[data-admin-stack][data-panel-dragging="true"] [data-admin-stack-head="true"]{
        cursor:grabbing;
      }
      .panel[data-admin-stack] [data-admin-stack-head="true"] > [data-line="true"]{
        flex:1 1 auto;
        min-width:0;
        display:flex;
        justify-content:center;
        max-width:100%;
      }
      .panel[data-admin-stack] [data-admin-stack-head="true"] *{
        cursor:inherit;
      }
      .panel[data-admin-stack] [data-admin-stack-head="true"] button,
      .panel[data-admin-stack] [data-admin-stack-head="true"] input,
      .panel[data-admin-stack] [data-admin-stack-head="true"] select,
      .panel[data-admin-stack] [data-admin-stack-head="true"] a,
      .panel[data-admin-stack] [data-admin-stack-head="true"] [data-action]{
        cursor:pointer!important;
      }
      .panel[data-admin-stack] [data-admin-stack-head="true"] .ui-counter-pill,
      .panel[data-admin-stack] [data-admin-stack-head="true"] .ui-counter-pill *{
        cursor:pointer!important;
      }
      .panel[data-admin-stack] .admin-stack-main{
        display:flex;
        align-items:center;
        justify-content:center;
        gap:var(--rail-gap);
        width:100%;
        max-width:100%;
        min-width:0;
      }
      .panel[data-admin-stack] .admin-fields-apply-group{
        flex:0 0 auto;
        width:auto;
        min-width:0;
        max-width:max-content;
      }
      .panel[data-admin-stack] .admin-fields-apply-group > .ui-group-body{
        width:auto!important;
        min-width:0!important;
        max-width:max-content!important;
      }
      .panel[data-admin-stack],
      .panel[data-admin-stack] *{
        font-weight:400;
      }
      .panel[data-admin-stack] .ui-counter-pill .ui-counter-label,
      .panel[data-admin-stack] .ui-counter-pill .ui-counter-text{
        font-weight:400!important;
      }
      .panel[data-admin-stack] .ui-counter-pill .ui-counter-fill,
      .panel[data-admin-stack] .ui-counter-pill .ui-counter-overflow{
        display:none!important;
      }
      .panel[data-admin-stack] .admin-fields-system{
        align-self:auto;
      }
      .panel[data-admin-stack] .admin-stack-counter{
        align-self:auto;
        flex:1 1 auto;
        width:100%!important;
        min-width:min(190px,100%)!important;
        max-width:100%!important;
      }
      .panel[data-admin-stack] [data-admin-stack-body]{
        margin-top:10px;
        display:flex;
        flex-direction:column;
        align-items:center;
        gap:10px;
        flex:1 1 auto;
        min-height:0;
        overflow:hidden;
        padding:0 2px 2px;
        box-sizing:border-box;
      }
      .panel[data-admin-stack] .admin-fields-row{
        display:grid;
        grid-template-columns:minmax(0,1fr);
        gap:10px;
        align-items:center;
        width:var(--admin-field-width);
        min-width:0;
        max-width:100%;
        margin-left:auto;
        margin-right:auto;
      }
      .panel[data-admin-stack] .ui-field-box{
        display:flex;
        flex-direction:column;
        width:100%;
        min-width:0;
        max-width:100%;
        box-sizing:border-box;
        overflow:visible;
        contain:inline-size;
      }
      .panel[data-admin-stack] .ui-field-control{
        --ui-field-bg:var(--admin-field-bg);
        position:relative;
        display:block;
        width:100%;
        min-width:0;
        max-width:100%;
        box-sizing:border-box;
        border:1px solid transparent;
        border-radius:14px;
        background:var(--ui-field-bg);
        box-shadow:none;
        overflow:visible;
      }
      .panel[data-admin-stack] .ui-field-control[data-field-actions="true"]{
        display:grid;
        grid-template-columns:minmax(0,1fr) auto;
        align-items:stretch;
        gap:0;
        overflow:hidden;
      }
      .panel[data-admin-stack] .ui-field-actions{
        display:inline-flex;
        align-items:stretch;
        justify-content:center;
        align-self:stretch;
        min-width:0;
        margin:0;
        border:0;
        border-radius:0;
        overflow:visible;
        pointer-events:auto;
        background:transparent;
      }
      .panel[data-admin-stack] .ui-field-box[data-field-fade="true"] .ui-field-control{
        overflow:hidden;
      }
      .panel[data-admin-stack] .ui-field-box[data-field-fade="true"] .ui-field-control::before,
      .panel[data-admin-stack] .ui-field-box[data-field-fade="true"] .ui-field-control::after{
        content:"";
        position:absolute;
        left:1px;
        right:1px;
        z-index:2;
        height:28px;
        pointer-events:none;
      }
      .panel[data-admin-stack] .ui-field-box[data-field-fade="true"] .ui-field-control::before{
        top:1px;
        border-top-left-radius:12px;
        border-top-right-radius:12px;
        background:linear-gradient(to bottom,var(--ui-field-bg) 0%,color-mix(in srgb,var(--ui-field-bg) 92%,transparent) 18%,color-mix(in srgb,var(--ui-field-bg) 52%,transparent) 42%,color-mix(in srgb,var(--ui-field-bg) 14%,transparent) 70%,transparent 100%);
      }
      .panel[data-admin-stack] .ui-field-box[data-field-fade="true"] .ui-field-control::after{
        bottom:1px;
        border-bottom-left-radius:12px;
        border-bottom-right-radius:12px;
        background:linear-gradient(to top,var(--ui-field-bg) 0%,color-mix(in srgb,var(--ui-field-bg) 92%,transparent) 18%,color-mix(in srgb,var(--ui-field-bg) 52%,transparent) 42%,color-mix(in srgb,var(--ui-field-bg) 14%,transparent) 70%,transparent 100%);
      }
      .panel[data-admin-stack] .ui-field-label{
        display:block;
        box-sizing:border-box;
        width:100%;
        max-width:100%;
        margin:0 0 4px;
        padding:0 calc(var(--admin-field-pad-x) + 1px);
        color:color-mix(in srgb,currentColor 58%,transparent);
        font:400 calc(var(--admin-font-size) - 2px)/1.2 var(--panel-font-family);
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
        pointer-events:none;
        user-select:none;
      }
      .panel[data-admin-stack] .ui-field-note{
        position:relative;
        display:flex;
        align-items:center;
        gap:6px;
        box-sizing:border-box;
        width:100%;
        min-width:0;
        margin-top:7px;
        padding:0 calc(var(--admin-field-pad-x) + 1px);
        color:color-mix(in srgb,currentColor 64%,transparent);
        font:400 calc(var(--admin-font-size) - 2px)/1.35 var(--panel-font-family);
        text-align:left;
        white-space:pre-wrap;
        overflow:hidden;
        overflow-wrap:anywhere;
        word-break:break-word;
        contain:inline-size;
        pointer-events:none;
        user-select:none;
        -webkit-user-select:none;
      }
      .panel[data-admin-stack] .ui-field-note-text{
        display:block;
        flex:0 1 auto;
        min-width:0;
        overflow:hidden;
        overflow-wrap:anywhere;
        word-break:break-word;
      }
      .panel[data-admin-stack] .ui-field-note[data-empty="true"]{
        opacity:.58;
      }
      .panel[data-admin-stack] .ui-field-note[data-note-state="match"]{
        min-height:22px;
        align-items:center;
      }
      .panel[data-admin-stack] .ui-field-note-icon{
        display:inline-flex;
        flex:0 0 18px;
        width:18px;
        height:18px;
        align-items:center;
        justify-content:center;
        opacity:.78;
        pointer-events:none;
      }
      .panel[data-admin-stack] .ui-field-note-icon .toolbar-icon{
        width:18px!important;
        height:18px!important;
        min-width:18px!important;
        min-height:18px!important;
        filter:var(--surface-glyph-filter);
      }
      .panel[data-admin-stack][data-theme="dark"] .ui-field-note-icon .toolbar-icon{
        filter:var(--surface-toolbar-glyph-filter-dark-active)!important;
      }
      .panel[data-admin-stack][data-theme="light"] .ui-field-note-icon .toolbar-icon{
        filter:var(--surface-toolbar-glyph-filter-light-active)!important;
      }
      .panel[data-admin-stack][data-excerpt-diff="true"] [data-admin-stack-body]{
        overflow-y:auto;
        overscroll-behavior:contain;
        -webkit-overflow-scrolling:touch;
        scrollbar-width:none;
      }
      .panel[data-admin-stack][data-excerpt-diff="true"] [data-admin-stack-body]::-webkit-scrollbar{
        display:none;
        width:0;
        height:0;
      }
      .panel[data-admin-stack] .ui-field-note[data-note-state="diff"],
      .panel[data-admin-stack] .ui-field-note[data-note-state="replace"]{
        display:block;
        max-height:none;
        overflow:visible;
        white-space:pre-wrap;
        line-height:1.45;
        pointer-events:auto;
        user-select:text;
        -webkit-user-select:text;
      }
      .panel[data-admin-stack] .ui-field-note[data-note-state="replace"]{
        padding-left:0;
        padding-right:0;
      }
      .panel[data-admin-stack] .ui-field-note[data-note-state="diff"] .ui-field-note-text,
      .panel[data-admin-stack] .ui-field-note[data-note-state="replace"] .ui-field-note-text{
        display:block;
        width:100%;
        max-width:100%;
        overflow:visible;
      }
      .panel[data-admin-stack] .admin-excerpt-diff-part,
      .panel[data-admin-stack] .admin-excerpt-diff-block{
        border-radius:4px;
        box-decoration-break:clone;
        -webkit-box-decoration-break:clone;
      }
      .panel[data-admin-stack] .admin-excerpt-diff-replacement{
        display:flex;
        flex-direction:column;
        gap:8px;
        width:100%;
        max-width:100%;
      }
      .panel[data-admin-stack] .admin-excerpt-diff-block{
        display:block;
        width:100%;
        padding:10px 11px;
        margin:0;
        box-sizing:border-box;
        border:1px solid transparent;
        border-radius:13px;
        font:400 calc(var(--admin-font-size) - 2px)/1.35 var(--panel-font-family);
      }
      .panel[data-admin-stack] .admin-excerpt-diff-add{
        background:color-mix(in srgb,#2fbf5b 24%,transparent);
        box-shadow:0 0 0 1px color-mix(in srgb,#2fbf5b 24%,transparent) inset;
      }
      .panel[data-admin-stack] .admin-excerpt-diff-remove{
        background:color-mix(in srgb,#ff4d4d 24%,transparent);
        box-shadow:0 0 0 1px color-mix(in srgb,#ff4d4d 24%,transparent) inset;
        text-decoration:none!important;
      }

      .panel[data-admin-stack] .admin-excerpt-equal-pair{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        gap:3px;
        width:auto;
        min-width:0;
        max-width:none;
        line-height:1;
      }
      .panel[data-admin-stack] .admin-excerpt-equal-part{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        width:22px;
        min-width:22px;
        height:22px;
        min-height:22px;
        border-radius:6px;
        box-sizing:border-box;
      }
      .panel[data-admin-stack] .admin-excerpt-equal-remove{
        background:color-mix(in srgb,#ff4d4d 24%,transparent);
        box-shadow:0 0 0 1px color-mix(in srgb,#ff4d4d 24%,transparent) inset;
      }
      .panel[data-admin-stack] .admin-excerpt-equal-add{
        background:color-mix(in srgb,#2fbf5b 24%,transparent);
        box-shadow:0 0 0 1px color-mix(in srgb,#2fbf5b 24%,transparent) inset;
      }
      .panel[data-admin-stack] .admin-excerpt-equal-part .toolbar-icon{
        width:16px!important;
        height:16px!important;
        min-width:16px!important;
        min-height:16px!important;
      }
      .panel[data-admin-stack] .ui-field-note[data-note-state="same"] .ui-field-note-icon{
        flex:0 0 auto;
        width:auto;
        min-width:0;
        height:22px;
      }
      .panel[data-admin-stack] .admin-fields-input--excerpt{
        padding-right:82px;
      }
      .panel[data-admin-stack] .admin-fields-replace{
        top:8px;
        right:8px;
        bottom:auto;
        --ui-corner-size:28px;
        --ui-corner-bleed:0px;
      }
      .panel[data-admin-stack] .admin-excerpt-state-badge{
        position:absolute;
        right:8px;
        bottom:8px;
        z-index:14;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        width:28px;
        min-width:28px;
        max-width:28px;
        height:28px;
        min-height:28px;
        max-height:28px;
        border:0!important;
        border-radius:0!important;
        background:transparent!important;
        box-shadow:none!important;
        color:color-mix(in srgb,currentColor 46%,transparent);
        opacity:.82;
        pointer-events:none;
        user-select:none;
        -webkit-user-select:none;
      }
      .panel[data-admin-stack] .admin-excerpt-state-badge .ui-icon-box,
      .panel[data-admin-stack] .admin-excerpt-state-badge .toolbar-icon-box,
      .panel[data-admin-stack] .admin-excerpt-state-badge .ui-icon-content{
        background:transparent!important;
        box-shadow:none!important;
        border:0!important;
        transform:none!important;
      }
      .panel[data-admin-stack] .admin-excerpt-state-badge .toolbar-icon{
        width:18px!important;
        height:18px!important;
        min-width:18px!important;
        min-height:18px!important;
        opacity:.86;
        filter:var(--surface-glyph-filter);
      }
      .panel[data-admin-stack][data-theme="dark"] .admin-excerpt-state-badge .toolbar-icon{
        filter:var(--surface-toolbar-glyph-filter-dark)!important;
      }
      .panel[data-admin-stack][data-theme="light"] .admin-excerpt-state-badge .toolbar-icon{
        filter:var(--surface-toolbar-glyph-filter-light)!important;
      }
      .panel[data-admin-stack] .ui-field-note[data-note-state="same"]{
        min-height:22px;
        justify-content:center;
      }
      .panel[data-admin-stack] .ui-field-note[data-note-state="same"] .ui-field-note-text{
        display:none;
      }
      .panel[data-admin-stack] .ui-field-resize-edge{
        position:absolute;
        left:12px;
        right:12px;
        bottom:0;
        z-index:10;
        height:10px;
        cursor:ns-resize;
        background:transparent;
        touch-action:none;
      }
      .panel[data-admin-stack] .ui-field-box[data-field-resize="vertical"]{
        padding-bottom:3px;
      }

      .panel[data-admin-stack] .ui-field-box[data-title-touch="true"] .ui-field-control{
        min-height:78px;
      }
      .panel[data-admin-stack] .admin-title-entry{
        position:relative;
        display:block;
        width:100%;
        min-width:0;
        min-height:44px;
      }
      .panel[data-admin-stack] .admin-title-entry[data-title-has-add="true"]{
        display:grid;
        grid-template-columns:42px minmax(0,1fr);
        align-items:stretch;
      }
      .panel[data-admin-stack] .admin-title-entry .admin-fields-input{
        min-width:0;
      }
      .panel[data-admin-stack] .admin-title-entry[data-title-has-add="true"] .admin-fields-input{
        grid-column:2;
        padding-left:8px;
      }
      .panel[data-admin-stack] .admin-title-entry[data-title-clearable="true"] .admin-fields-input{
        padding-right:52px;
      }
      .panel[data-admin-stack] .admin-title-entry[data-title-locked="true"] .admin-fields-input{
        pointer-events:none;
        cursor:default;
      }
      .panel[data-admin-stack] .ui-field-box[data-title-touch="true"] .admin-title-entry{
        display:block;
        min-height:78px;
      }
      .panel[data-admin-stack] .ui-field-box[data-title-touch="true"] .admin-fields-input{
        min-height:78px;
        height:78px;
        max-height:106px;
        padding-right:10px;
        line-height:28px;
        resize:none;
        white-space:pre-wrap;
        overflow-x:hidden;
        overflow-y:auto;
        overflow-wrap:break-word;
        touch-action:pan-y;
        overscroll-behavior:contain;
        -webkit-overflow-scrolling:touch;
      }
      .panel[data-admin-stack] .ui-field-box[data-title-touch="true"] .admin-title-entry[data-title-clearable="true"] .admin-fields-input{
        padding-right:10px;
        padding-bottom:10px;
      }
      .panel[data-admin-stack] .ui-field-box[data-title-touch="true"] .admin-title-entry[data-title-has-add="true"] .admin-fields-input{
        grid-column:auto;
        padding-left:10px;
        padding-bottom:34px;
      }
      .panel[data-admin-stack] .admin-title-add{
        grid-column:1;
        width:42px!important;
        min-width:42px!important;
        max-width:42px!important;
        height:100%!important;
        min-height:44px!important;
        border:0!important;
        border-radius:0!important;
        background:transparent!important;
        background-color:transparent!important;
        background-image:none!important;
        box-shadow:none!important;
        outline:0!important;
        opacity:.72;
        transform:none!important;
        transition:none!important;
        -webkit-tap-highlight-color:transparent!important;
      }
      .panel[data-admin-stack] .admin-title-add:hover,
      .panel[data-admin-stack] .admin-title-add:focus,
      .panel[data-admin-stack] .admin-title-add:focus-visible,
      .panel[data-admin-stack] .admin-title-add:active{
        background:transparent!important;
        background-color:transparent!important;
        background-image:none!important;
        box-shadow:none!important;
        outline:0!important;
        opacity:.82;
        transform:none!important;
      }
      .panel[data-admin-stack] .admin-title-add .ui-icon-box,
      .panel[data-admin-stack] .admin-title-add:hover .ui-icon-box,
      .panel[data-admin-stack] .admin-title-add:focus .ui-icon-box,
      .panel[data-admin-stack] .admin-title-add:focus-visible .ui-icon-box,
      .panel[data-admin-stack] .admin-title-add:active .ui-icon-box{
        width:100%;
        height:100%;
        min-width:100%;
        min-height:100%;
        background:transparent!important;
        box-shadow:none!important;
        transform:none!important;
        transition:none!important;
      }
      .panel[data-admin-stack] .admin-title-add .toolbar-icon{
        width:24px!important;
        height:24px!important;
        min-width:24px!important;
        min-height:24px!important;
        object-fit:contain;
      }
      .panel[data-admin-stack] .admin-title-clear{
        position:absolute;
        right:8px;
        bottom:8px;
        z-index:12;
        width:34px!important;
        min-width:34px!important;
        max-width:34px!important;
        height:34px!important;
        min-height:34px!important;
        max-height:34px!important;
        padding:0!important;
        border:0!important;
        border-radius:0!important;
        background:transparent!important;
        box-shadow:none!important;
        opacity:.64;
        transform:none!important;
        transition:none!important;
        -webkit-tap-highlight-color:transparent!important;
      }
      .panel[data-admin-stack] .admin-title-clear:hover,
      .panel[data-admin-stack] .admin-title-clear:focus,
      .panel[data-admin-stack] .admin-title-clear:focus-visible,
      .panel[data-admin-stack] .admin-title-clear:active{
        background:transparent!important;
        box-shadow:none!important;
        opacity:.78;
        transform:none!important;
        outline:0!important;
      }
      .panel[data-admin-stack] .admin-title-clear[data-title-clear-restore="true"]{
        opacity:.9;
      }
      .panel[data-admin-stack] .admin-title-clear .ui-icon-box,
      .panel[data-admin-stack] .admin-title-clear .ui-icon-content{
        width:100%;
        height:100%;
        min-width:100%;
        min-height:100%;
        background:transparent!important;
        box-shadow:none!important;
        transform:none!important;
      }
      .panel[data-admin-stack] .admin-title-clear .toolbar-icon{
        width:24px!important;
        height:24px!important;
        min-width:24px!important;
        min-height:24px!important;
        object-fit:contain;
      }
      .panel[data-admin-stack] .ui-field-box[data-title-touch="true"] .admin-title-touch-tools{
        display:flex;
        align-items:center;
        justify-content:center;
        width:46px;
        min-width:46px;
        max-width:46px;
        height:42px;
        min-height:42px;
        max-height:42px;
        padding-bottom:0;
      }
      .panel[data-admin-stack] .ui-field-box[data-title-touch="true"] .admin-title-touch-tools:empty{
        display:none;
      }
      .panel[data-admin-stack] .ui-field-box[data-title-touch="true"] .admin-title-entry > .admin-title-add{
        position:absolute;
        left:8px;
        bottom:10px;
        z-index:14;
        grid-column:auto;
        width:34px!important;
        min-width:34px!important;
        max-width:34px!important;
        height:34px!important;
        min-height:34px!important;
        max-height:34px!important;
        opacity:.76;
        transform:none!important;
      }
      .panel[data-admin-stack] .ui-field-box[data-title-touch="true"] .admin-title-touch-tools .admin-title-clear{
        position:relative;
        inset:auto;
        z-index:14;
        flex:0 0 34px;
        width:34px!important;
        min-width:34px!important;
        max-width:34px!important;
        height:34px!important;
        min-height:34px!important;
        max-height:34px!important;
        opacity:.76;
        transform:none!important;
      }
      .panel[data-admin-stack] .ui-field-box[data-title-touch="true"] .admin-title-add:hover,
      .panel[data-admin-stack] .ui-field-box[data-title-touch="true"] .admin-title-add:focus,
      .panel[data-admin-stack] .ui-field-box[data-title-touch="true"] .admin-title-add:focus-visible,
      .panel[data-admin-stack] .ui-field-box[data-title-touch="true"] .admin-title-add:active,
      .panel[data-admin-stack] .ui-field-box[data-title-touch="true"] .admin-title-clear:hover,
      .panel[data-admin-stack] .ui-field-box[data-title-touch="true"] .admin-title-clear:focus,
      .panel[data-admin-stack] .ui-field-box[data-title-touch="true"] .admin-title-clear:focus-visible,
      .panel[data-admin-stack] .ui-field-box[data-title-touch="true"] .admin-title-clear:active{
        opacity:.88;
        transform:none!important;
      }
      .panel[data-admin-stack] .ui-field-box[data-title-touch="true"] .admin-title-add .toolbar-icon,
      .panel[data-admin-stack] .ui-field-box[data-title-touch="true"] .admin-title-clear .toolbar-icon{
        width:24px!important;
        height:24px!important;
        min-width:24px!important;
        min-height:24px!important;
      }
      .panel[data-admin-stack] .ui-field-box[data-title-touch="true"] .ui-field-actions{
        position:relative;
        align-self:start;
        display:grid;
        grid-template-rows:39px 39px 42px;
        align-items:start;
        justify-items:center;
        align-content:start;
        width:46px;
        min-width:46px;
        max-width:46px;
        height:120px;
        min-height:120px;
        max-height:120px;
        border:0;
        border-radius:0;
        overflow:hidden;
        background:transparent!important;
      }
      .panel[data-admin-stack] .ui-field-box[data-title-touch="true"] .ui-field-actions::before{
        content:"";
        position:absolute;
        left:10px;
        right:10px;
        top:39px;
        z-index:5;
        height:1px;
        background:color-mix(in srgb,currentColor 22%,transparent);
        pointer-events:none;
      }
      .panel[data-admin-stack] .admin-title-cycle{
        position:relative;
        width:46px!important;
        min-width:46px!important;
        max-width:46px!important;
        height:39px!important;
        min-height:39px!important;
        max-height:39px!important;
        border:0!important;
        border-radius:0!important;
        background:transparent!important;
        background-color:transparent!important;
        opacity:.86;
        transform:none!important;
        transition:none!important;
        box-shadow:none!important;
        outline:0!important;
        -webkit-tap-highlight-color:transparent!important;
      }
      .panel[data-admin-stack] .admin-title-cycle:hover,
      .panel[data-admin-stack] .admin-title-cycle:focus,
      .panel[data-admin-stack] .admin-title-cycle:focus-visible,
      .panel[data-admin-stack] .admin-title-cycle:active{
        background:transparent!important;
        background-color:transparent!important;
        background-image:none!important;
        opacity:.86;
        transform:none!important;
        border-color:transparent!important;
        box-shadow:none!important;
        outline:0!important;
      }
      .panel[data-admin-stack] .admin-title-cycle .ui-icon-box{
        width:100%;
        height:100%;
        min-width:100%;
        min-height:100%;
        transform:none!important;
        transition:none!important;
        background:transparent!important;
        box-shadow:none!important;
      }
      .panel[data-admin-stack] .admin-title-cycle:hover .ui-icon-box,
      .panel[data-admin-stack] .admin-title-cycle:focus .ui-icon-box,
      .panel[data-admin-stack] .admin-title-cycle:focus-visible .ui-icon-box,
      .panel[data-admin-stack] .admin-title-cycle:active .ui-icon-box{
        transform:none!important;
        background:transparent!important;
        box-shadow:none!important;
      }
      .panel[data-admin-stack] .admin-title-cycle,
      .panel[data-admin-stack] .admin-title-cycle *,
      .panel[data-admin-stack] .admin-title-cycle::before,
      .panel[data-admin-stack] .admin-title-cycle::after{
        box-shadow:none!important;
        text-shadow:none!important;
        background-color:transparent!important;
      }
      .panel[data-admin-stack] .admin-title-add::before,
      .panel[data-admin-stack] .admin-title-add::after,
      .panel[data-admin-stack] .admin-title-cycle::before,
      .panel[data-admin-stack] .admin-title-cycle::after,
      .panel[data-admin-stack] .admin-title-cycle .ui-icon-box::before,
      .panel[data-admin-stack] .admin-title-cycle .ui-icon-box::after,
      .panel[data-admin-stack] .admin-title-cycle .toolbar-icon-box::before,
      .panel[data-admin-stack] .admin-title-cycle .toolbar-icon-box::after{
        display:none!important;
        opacity:0!important;
        background:transparent!important;
      }
      .panel[data-admin-stack] .admin-title-cycle .toolbar-icon{
        width:24px!important;
        height:24px!important;
        min-width:24px!important;
        min-height:24px!important;
        object-fit:contain;
        transform:none!important;
        transition:none!important;
      }
      .panel[data-ui-surface="toolbar"][data-admin-stack] .admin-title-cycle.ui-button,
      .panel[data-ui-surface="toolbar"][data-admin-stack] .admin-title-cycle.ui-button:hover,
      .panel[data-ui-surface="toolbar"][data-admin-stack] .admin-title-cycle.ui-button:focus,
      .panel[data-ui-surface="toolbar"][data-admin-stack] .admin-title-cycle.ui-button:focus-visible,
      .panel[data-ui-surface="toolbar"][data-admin-stack] .admin-title-cycle.ui-button:active{
        background:transparent!important;
        background-color:transparent!important;
        background-image:none!important;
        box-shadow:none!important;
        border-color:transparent!important;
        outline:0!important;
        transform:none!important;
        filter:none!important;
      }
      .panel[data-ui-surface="toolbar"][data-admin-stack] .admin-title-cycle .ui-icon-content,
      .panel[data-ui-surface="toolbar"][data-admin-stack] .admin-title-cycle:hover .ui-icon-content,
      .panel[data-ui-surface="toolbar"][data-admin-stack] .admin-title-cycle:focus .ui-icon-content,
      .panel[data-ui-surface="toolbar"][data-admin-stack] .admin-title-cycle:focus-visible .ui-icon-content,
      .panel[data-ui-surface="toolbar"][data-admin-stack] .admin-title-cycle:active .ui-icon-content{
        background:transparent!important;
        box-shadow:none!important;
        transform:none!important;
        transition:none!important;
      }
      .panel[data-ui-surface="toolbar"][data-admin-stack] .admin-title-cycle:active .toolbar-icon{
        transform:scale(1.06)!important;
      }
      .panel[data-admin-stack] .admin-fields-input{
        display:block;
        width:100%;
        min-height:44px;
        max-width:100%;
        box-sizing:border-box;
        border:0;
        border-radius:13px;
        padding:10px var(--admin-field-pad-x);
        background:transparent;
        color:inherit;
        font:400 var(--admin-font-size)/24px var(--panel-font-family);
        scrollbar-width:none!important;
        -ms-overflow-style:none!important;
        opacity:1;
        outline:none;
        box-shadow:none;
        position:relative;
        z-index:1;
        touch-action:manipulation;
        overscroll-behavior:contain;
      }
      .panel[data-admin-stack] .admin-fields-input::-webkit-scrollbar{
        display:none!important;
        width:0!important;
        height:0!important;
        background:transparent!important;
      }
      .panel[data-admin-stack] .admin-fields-input::-webkit-scrollbar-thumb,
      .panel[data-admin-stack] .admin-fields-input::-webkit-scrollbar-track,
      .panel[data-admin-stack] .admin-fields-input::-webkit-scrollbar-corner{
        background:transparent!important;
        border:0!important;
      }
      .panel[data-admin-stack] .admin-fields-input:focus{
        box-shadow:none;
      }
      .panel[data-admin-stack] .ui-field-control:focus-within{
        border-color:var(--surface-feedback-field-focus-border);
        box-shadow:0 0 0 1px var(--surface-feedback-field-focus-border) inset;
        outline:1px solid var(--surface-feedback-field-focus-border);
        outline-offset:-1px;
      }
      .panel[data-admin-stack][data-admin-title-commanding="true"] .ui-field-control:focus-within{
        border-color:transparent;
        box-shadow:none;
        outline:0;
      }
      .panel[data-admin-stack] .ui-field-control:focus-within::before,
      .panel[data-admin-stack] .ui-field-control:focus-within::after{
        z-index:2;
      }
      .panel[data-admin-stack] .admin-fields-input::placeholder{
        color:currentColor;
        opacity:.58;
      }
      .panel[data-admin-stack] .admin-fields-input::selection,
      .panel[data-admin-stack] .ui-field-note::selection,
      .panel[data-admin-stack] .ui-field-note *::selection{
        background:color-mix(in srgb,var(--surface-feedback-field-focus-border) 38%,transparent);
        color:inherit;
      }
      .panel[data-admin-stack] .ui-field-box[data-field-corner="true"] .admin-fields-input{
        padding-right:48px;
      }
      .panel[data-admin-stack] .admin-fields-corner{
        --ui-corner-bg:var(--admin-field-bg);
        --ui-corner-bleed:0px;
        --ui-corner-size:28px;
        right:8px;
        bottom:8px;
      }
      .panel[data-admin-stack] .ui-field-box[data-slug-field="true"] .ui-field-control{
        --admin-slug-inline-size:28px;
        --admin-slug-inline-inset:8px;
        --admin-slug-inline-gap:6px;
        --admin-slug-text-gap:6px;
        --admin-slug-inline-width:calc(var(--admin-slug-inline-size) * 2 + var(--admin-slug-inline-gap));
      }
      .panel[data-admin-stack] .admin-fields-input--slug{
        min-height:44px;
        max-height:44px;
      }
      .panel[data-admin-stack] .ui-field-box[data-field-corner="true"] .admin-fields-input.admin-fields-input--slug{
        padding-right:calc(var(--admin-field-pad-x) + var(--admin-slug-inline-inset) + var(--admin-slug-inline-width) + var(--admin-slug-text-gap))!important;
      }
      .panel[data-admin-stack] .admin-slug-cycle{
        right:var(--admin-slug-inline-inset);
        top:8px;
        bottom:auto;
        --ui-corner-size:var(--admin-slug-inline-size);
        --ui-corner-bleed:0px;
      }
      .panel[data-admin-stack] .admin-slug-state-badge{
        position:absolute;
        right:calc(var(--admin-slug-inline-inset) + var(--admin-slug-inline-size) + var(--admin-slug-inline-gap));
        bottom:8px;
        z-index:14;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        width:28px;
        min-width:28px;
        max-width:28px;
        height:28px;
        min-height:28px;
        max-height:28px;
        border:0!important;
        border-radius:0!important;
        background:transparent!important;
        box-shadow:none!important;
        color:color-mix(in srgb,currentColor 46%,transparent);
        opacity:.82;
        pointer-events:none;
        user-select:none;
        -webkit-user-select:none;
      }
      .panel[data-admin-stack] .admin-slug-state-badge .ui-icon-box,
      .panel[data-admin-stack] .admin-slug-state-badge .toolbar-icon-box,
      .panel[data-admin-stack] .admin-slug-state-badge .ui-icon-content{
        background:transparent!important;
        box-shadow:none!important;
        border:0!important;
        transform:none!important;
      }
      .panel[data-admin-stack] .admin-slug-state-badge .toolbar-icon{
        width:18px!important;
        height:18px!important;
        min-width:18px!important;
        min-height:18px!important;
        opacity:.86;
        filter:var(--surface-glyph-filter);
      }
      .panel[data-admin-stack][data-theme="dark"] .admin-slug-state-badge .toolbar-icon{
        filter:var(--surface-toolbar-glyph-filter-dark)!important;
      }
      .panel[data-admin-stack][data-theme="light"] .admin-slug-state-badge .toolbar-icon{
        filter:var(--surface-toolbar-glyph-filter-light)!important;
      }
      .panel[data-admin-stack] .admin-fields-input--excerpt{
        min-height:110px;
        resize:none;
        line-height:24px;
        overflow-x:hidden;
        overflow-y:auto;
        touch-action:pan-y;
        overscroll-behavior:contain;
        -webkit-overflow-scrolling:touch;
      }
      .panel[data-admin-stack] .admin-fields-input--excerpt::-webkit-resizer,
      .panel[data-admin-stack] .admin-fields-input--excerpt::-webkit-scrollbar-corner{
        background:transparent!important;
        border:0!important;
        opacity:0!important;
      }
      .panel[data-admin-stack] .admin-fields-preview{
        max-width:100%;
        padding:0 2px;
        background:transparent;
        color:color-mix(in srgb,currentColor 72%,transparent);
        font:400 calc(var(--admin-font-size) - 1px)/1.35 var(--panel-font-family);
        white-space:pre-wrap;
        overflow-wrap:anywhere;
        opacity:1;
      }
      .panel[data-admin-stack] .admin-fields-static--slug-live{
        min-height:22px;
        max-height:none;
        line-height:1.35;
        display:block;
        overflow:hidden;
        white-space:nowrap;
        text-overflow:ellipsis;
        text-align:center;
        font-size:calc(var(--admin-font-size) - 2px);
        color:color-mix(in srgb,currentColor 72%,transparent);
      }
      .panel[data-admin-stack] .admin-fields-static{
        user-select:none;
        -webkit-user-select:none;
      }
      .panel[data-admin-stack] .admin-fields-slug-edit{
        display:block;
        width:100%;
        min-width:0;
      }
      .panel[data-admin-stack] .admin-fields-row--slug-cycle{
        margin-top:-2px;
      }
      .panel[data-admin-stack] .admin-stack-counter{
        flex:1 1 auto;
        width:100%!important;
        min-width:min(190px,100%)!important;
        max-width:100%!important;
      }
      .panel[data-ui-surface="toolbar"][data-admin-stack][data-mode="phone"]{
        --admin-panel-width:min(var(--surface-shared-panel-width), calc(100vw - 20px));
        height:auto;
        max-height:calc(100vh - 86px);
        min-height:0;
        padding:var(--panel-pad);
        overflow:hidden;
      }
      .panel[data-admin-stack][data-mode="phone"] .admin-stack-counter{
        flex:1 1 auto;
        width:100%!important;
        min-width:min(180px,100%)!important;
        max-width:100%!important;
      }

      .panel[data-admin-stack][data-mode="phone"] .admin-fields-head{
        position:relative;
        display:grid;
        grid-template-columns:auto minmax(var(--rail-gap),1fr) auto minmax(var(--rail-gap),1fr) auto;
        grid-template-areas:
          "admin-head-left admin-head-gap-left admin-head-apply admin-head-gap-right admin-head-right"
          "admin-head-main admin-head-main admin-head-main admin-head-main admin-head-main";
        align-items:center;
        justify-content:stretch;
        column-gap:0;
        row-gap:8px;
        width:100%;
        min-width:0;
      }
      .panel[data-admin-stack][data-mode="phone"] .admin-fields-head > :first-child{
        grid-area:admin-head-left;
        justify-self:start;
      }
      .panel[data-admin-stack][data-mode="phone"] .admin-fields-head > [data-line="true"]{
        display:contents;
      }
      .panel[data-admin-stack][data-mode="phone"] .admin-fields-head > [data-line="true"] > .admin-stack-counter{
        grid-area:admin-head-main;
        justify-self:stretch;
        width:100%!important;
        min-width:0!important;
        max-width:100%!important;
      }
      .panel[data-admin-stack][data-mode="phone"] .admin-fields-head > :last-child{
        grid-area:admin-head-right;
        justify-self:end;
      }
      .panel[data-admin-stack][data-mode="phone"] .admin-stack-main{
        display:contents;
      }
      .panel[data-admin-stack][data-mode="phone"] .admin-stack-main .admin-stack-counter{
        grid-area:admin-head-main;
        justify-self:stretch;
        width:100%!important;
        min-width:0!important;
        max-width:100%!important;
      }
      .panel[data-admin-stack][data-mode="phone"] .admin-stack-main .admin-fields-apply-group{
        grid-area:admin-head-apply;
        justify-self:center;
        position:relative;
        z-index:6;
      }
      .panel[data-admin-stack][data-mode="phone"] [data-admin-stack-body][data-mode="excerpt"] .ui-field-note{
        display:flex;
      }
      .panel[data-admin-stack][data-mode="phone"][data-excerpt-editing="true"] [data-admin-stack-body][data-mode="excerpt"] .ui-field-note{
        display:none!important;
      }
      .panel[data-admin-stack][data-mode="phone"][data-excerpt-diff="true"] [data-admin-stack-body][data-mode="excerpt"]{
        overflow:hidden;
      }
      .panel[data-admin-stack][data-mode="phone"]:not([data-excerpt-editing="true"])[data-excerpt-diff="true"] [data-admin-stack-body][data-mode="excerpt"]{
        overflow:auto;
      }
      .panel[data-admin-stack][data-mode="phone"]:not([data-excerpt-editing="true"]) [data-admin-stack-body][data-mode="excerpt"]{
        padding-bottom:16px;
      }
      .panel[data-admin-stack][data-mode="phone"]:not([data-excerpt-editing="true"]) [data-admin-stack-body][data-mode="excerpt"] .admin-fields-row:last-child{
        margin-bottom:8px;
      }

      .panel[data-admin-stack][data-tight="true"]{
        max-height:calc(100vh - 32px);
        padding:10px;
      }
      .panel[data-admin-stack][data-tight="true"] [data-admin-stack-body]{
        gap:8px;
        margin-top:8px;
      }
      .panel[data-admin-stack][data-tight="true"] .admin-fields-input--excerpt{
        min-height:82px;
      }
      .panel[data-admin-stack][data-tight="true"] .ui-field-note{
        margin-top:5px;
        line-height:1.25;
      }
      .panel[data-admin-stack][data-mode="phone"] .admin-fields-row{
        grid-template-columns:1fr;
      }
      .panel[data-admin-stack][data-mode="phone"] .admin-fields-input{
        font-size:16px;
      }
    `;
  },
};

const host = {
  theme() {
    return base.run();
  },
};

export const styles = {
  host,
  panel: {
    theme() {
      return host.theme();
    },
  },
  reader,

  editor,
  ui,
  admin,

  diff: {
    root() {
      return skin.diff;
    },
    panel() {
      return styles.diff.root();
    },
  },
  audit: {
    root() {
      return skin.audit;
    },
    panel() {
      return skin.audit;
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
  feedback: {
    panel() {
      return skin.feedback;
    },
  },
  skin,
};
