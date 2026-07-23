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
        .panel .ui-wait {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1em;
          min-width: 1em;
          height: 1em;
          perspective: 560px;
          transform: translateZ(0);
        }
        .panel .ui-wait-shell {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1em;
          height: 1em;
          transform-style: preserve-3d;
        }
        .panel .ui-wait-frame {
          position: absolute;
          inset: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          filter: blur(0.32px);
          will-change: opacity, transform, filter;
        }
        .panel .ui-wait-glyph {
          width: 1em !important;
          height: 1em !important;
          min-width: 1em !important;
          min-height: 1em !important;
          flex-basis: 1em !important;
          display: block;
        }
        .panel .ui-wait-frame[data-ui-wait-frame="1"] {
          animation: ui-wait-hourglass-stage-1 3.2s ease-in-out infinite;
        }
        .panel .ui-wait-frame[data-ui-wait-frame="2"] {
          animation: ui-wait-hourglass-stage-2 3.2s ease-in-out infinite;
        }
        .panel .ui-wait-frame[data-ui-wait-frame="3"] {
          animation: ui-wait-hourglass-stage-3 3.2s ease-in-out infinite;
        }
        .panel .ui-wait-frame[data-ui-wait-frame="4"] {
          animation: ui-wait-hourglass-stage-4 3.2s ease-in-out infinite;
        }
        @keyframes ui-wait-hourglass-stage-1 {
          0%, 18% {
            opacity: 1;
            transform: translateZ(0) rotateX(180deg) scale(1);
            filter: blur(0px);
          }
          24% {
            opacity: 0.62;
            transform: translateZ(0) rotateX(180deg) scale(0.988);
            filter: blur(0.12px);
          }
          30%, 100% {
            opacity: 0;
            transform: translateZ(0) rotateX(180deg) scale(0.965);
            filter: blur(0.32px);
          }
        }
        @keyframes ui-wait-hourglass-stage-2 {
          0%, 20% {
            opacity: 0;
            transform: translateZ(0) rotateX(180deg) scale(0.965);
            filter: blur(0.32px);
          }
          24% {
            opacity: 0.42;
            transform: translateZ(0) rotateX(180deg) scale(0.976);
            filter: blur(0.18px);
          }
          30% {
            opacity: 0.68;
            transform: translateZ(0) rotateX(180deg) scale(0.99);
            filter: blur(0.1px);
          }
          36%, 46% {
            opacity: 1;
            transform: translateZ(0) rotateX(180deg) scale(1);
            filter: blur(0px);
          }
          52% {
            opacity: 0.58;
            transform: translateZ(0) rotateX(180deg) scale(0.986);
            filter: blur(0.12px);
          }
          58%, 100% {
            opacity: 0;
            transform: translateZ(0) rotateX(180deg) scale(0.965);
            filter: blur(0.32px);
          }
        }
        @keyframes ui-wait-hourglass-stage-3 {
          0%, 42% {
            opacity: 0;
            transform: translateZ(0) scale(0.965);
            filter: blur(0.32px);
          }
          46% {
            opacity: 0.4;
            transform: translateZ(0) scale(0.976);
            filter: blur(0.18px);
          }
          52% {
            opacity: 0.68;
            transform: translateZ(0) scale(0.99);
            filter: blur(0.1px);
          }
          58%, 68% {
            opacity: 1;
            transform: translateZ(0) scale(1);
            filter: blur(0px);
          }
          74% {
            opacity: 0.58;
            transform: translateZ(0) scale(0.988);
            filter: blur(0.12px);
          }
          82%, 100% {
            opacity: 0;
            transform: translateZ(0) scale(0.965);
            filter: blur(0.32px);
          }
        }
        @keyframes ui-wait-hourglass-stage-4 {
          0%, 66% {
            opacity: 0;
            transform: translateZ(0) scale(0.965);
            filter: blur(0.32px);
          }
          72% {
            opacity: 0.46;
            transform: translateZ(0) scale(0.978);
            filter: blur(0.18px);
          }
          78% {
            opacity: 0.7;
            transform: translateZ(0) scale(0.99);
            filter: blur(0.1px);
          }
          84%, 92% {
            opacity: 1;
            transform: translateZ(0) scale(1);
            filter: blur(0px);
          }
          96% {
            opacity: 0.82;
            transform: translateZ(0) rotateX(90deg) scale(0.992);
            filter: blur(0.08px);
          }
          97%, 100% {
            opacity: 0;
            transform: translateZ(0) rotateX(180deg) scale(0.965);
            filter: blur(0.32px);
          }
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
          transition:
            opacity .12s ease,
            background-color .12s ease,
            border-color .12s ease,
            font-size var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing);
        }
        .panel[data-ui-surface="toolbar"] .button.button-text .ui-icon-content {
          width: auto !important;
          height: auto !important;
          min-width: 0 !important;
          min-height: 0 !important;
          font-size: var(--control-font-size) !important;
          line-height: 1 !important;
          transition: font-size var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing) !important;
        }
        .panel[data-ui-surface="toolbar"] .button.button-text:hover .ui-icon-content,
        .panel[data-ui-surface="toolbar"] .button.button-text:focus-visible .ui-icon-content {
          font-size: calc(var(--control-font-size) * var(--surface-toolbar-text-hover-scale)) !important;
        }
        .panel[data-ui-surface="toolbar"] [data-ui-ribbon-text="true"] {
          position:relative;
          display:block;
          width:100%;
          min-width:0;
          height:1.2em;
          overflow:hidden;
          white-space:nowrap;
        }
        .panel[data-ui-surface="toolbar"] [data-ui-ribbon-text-value="true"] {
          display:flex;
          align-items:center;
          justify-content:center;
          width:100%;
          min-width:0;
          height:100%;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
          will-change:transform,opacity,filter,text-shadow;
        }
        .panel[data-ui-surface="toolbar"] [data-ui-ribbon-phase] {
          position:absolute;
          inset:0;
        }
        .panel[data-ui-surface="toolbar"] [data-ui-ribbon-text-value="true"][data-ui-ribbon-phase="exit"] {
          animation:ui-ribbon-text-exit var(--surface-toolbar-ribbon-exit-duration) var(--surface-toolbar-ribbon-easing) both;
        }
        .panel[data-ui-surface="toolbar"] [data-ui-ribbon-text-value="true"][data-ui-ribbon-phase="enter"] {
          animation:ui-ribbon-text-enter var(--surface-toolbar-ribbon-enter-duration) var(--surface-toolbar-ribbon-easing) both;
        }
        @keyframes ui-ribbon-text-exit {
          from {
            transform:translateX(0);
            opacity:1;
            filter:blur(0);
            text-shadow:0 0 0 currentColor;
          }
          to {
            transform:translateX(calc(var(--surface-toolbar-ribbon-distance) * -1));
            opacity:0;
            filter:blur(var(--surface-toolbar-ribbon-blur));
            text-shadow:var(--surface-toolbar-ribbon-tail) 0 var(--surface-toolbar-ribbon-blur) currentColor;
          }
        }
        @keyframes ui-ribbon-text-enter {
          from {
            transform:translateX(var(--surface-toolbar-ribbon-distance));
            opacity:0;
            filter:blur(var(--surface-toolbar-ribbon-blur));
            text-shadow:calc(var(--surface-toolbar-ribbon-tail) * -1) 0 var(--surface-toolbar-ribbon-blur) currentColor;
          }
          to {
            transform:translateX(0);
            opacity:1;
            filter:blur(0);
            text-shadow:0 0 0 currentColor;
          }
        }
        [data-ui-swipe-phase="exit"] {
          animation:ui-swipe-exit var(--surface-toolbar-ribbon-exit-duration) var(--surface-toolbar-ribbon-easing) both!important;
          pointer-events:none!important;
        }
        [data-ui-swipe-phase="enter"] {
          animation:ui-swipe-enter var(--surface-toolbar-ribbon-enter-duration) var(--surface-toolbar-ribbon-easing) both!important;
          pointer-events:none!important;
        }
        @keyframes ui-swipe-exit {
          from{transform:translateX(0);opacity:1;filter:blur(0);}
          to{transform:translateX(calc(var(--surface-toolbar-ribbon-distance) * -1));opacity:0;filter:blur(var(--surface-toolbar-ribbon-blur));}
        }
        @keyframes ui-swipe-enter {
          from{transform:translateX(var(--surface-toolbar-ribbon-distance));opacity:0;filter:blur(var(--surface-toolbar-ribbon-blur));}
          to{transform:translateX(0);opacity:1;filter:blur(0);}
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
          --surface-toolbar-icon-box-size: calc(var(--surface-button-size) + 4px);
          --surface-emoji-icon-size: var(--surface-toolbar-media-size);
          --surface-toolbar-icon-size: var(--surface-toolbar-media-size);
          --surface-toolbar-logo-size: var(--surface-toolbar-media-size);
          --toolbar-unified-step: var(--surface-button-size);
          --toolbar-unified-icon-size: var(--surface-toolbar-media-size);
          --toolbar-unified-pad-x: var(--surface-toolbar-unified-pad-x);
          --surface-emoji-hover-scale: 1.12;
          --surface-emoji-active-scale: 1.08;
          --surface-active-scale: 1.1;
          --surface-toolbar-icon-hover-size: calc(var(--surface-toolbar-icon-size) * var(--surface-toolbar-icon-hover-scale) + 1px);
          --surface-toolbar-icon-hover-entry-scale: calc(1 / var(--surface-toolbar-icon-hover-scale));
          --surface-toolbar-icon-active-size: calc(var(--surface-toolbar-icon-size) * var(--surface-toolbar-icon-active-scale));
          --surface-scroll-step-extra: 0px;
          --surface-glyph-filter: none;
          --surface-line-edge-pad: calc(var(--surface-toolbar-line-pad-base) * var(--toolbar-scale, 1));
          --surface-line-cross-pad: calc(var(--surface-toolbar-line-pad-base) * var(--toolbar-scale, 1));
          --surface-launchpad-motion-enter-duration: var(--surface-toolbar-launchpad-motion-enter-duration);
          --surface-launchpad-motion-exit-duration: var(--surface-toolbar-launchpad-motion-exit-duration);
          --surface-launchpad-travel-motion-duration: 420ms;
          --surface-launchpad-click-spin-duration: 480ms;
          --surface-launchpad-resize-duration-min: 280ms;
          --surface-launchpad-resize-duration-max: 420ms;
          --surface-launchpad-resize-duration-per-px: 1.4;
          --surface-launchpad-pinned-motion-duration: 320ms;
          --surface-launchpad-pinned-motion-duration-current: var(--surface-launchpad-pinned-motion-duration);
          --surface-launchpad-pinned-motion-enter-duration: var(--surface-launchpad-pinned-motion-duration-current);
          --surface-launchpad-pinned-motion-exit-duration: var(--surface-launchpad-pinned-motion-duration-current);
          --surface-launchpad-toolbar-resize-duration: 320ms;
          --surface-launchpad-roadmap-motion-enter-duration: var(--surface-launchpad-motion-enter-duration);
          --surface-launchpad-roadmap-motion-exit-duration: var(--surface-launchpad-motion-exit-duration);
          --surface-launchpad-motion-easing: var(--surface-toolbar-launchpad-motion-easing);
          --surface-launchpad-motion-offset: var(--surface-toolbar-launchpad-motion-offset);
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
          --surface-box-edge-y: calc(var(--cluster-pad-y) + var(--cluster-inset-y));
          --surface-box-border: 1px;
          --surface-box-1-width: calc(var(--surface-box-size) + var(--surface-box-edge-x) + var(--surface-box-edge-x) + var(--surface-box-border) + var(--surface-box-border));
          --surface-box-2-width: calc(var(--surface-box-size) + var(--surface-box-size) + var(--surface-box-gap) + var(--surface-box-edge-x) + var(--surface-box-edge-x) + var(--surface-box-border) + var(--surface-box-border));
          --surface-box-3-width: calc(var(--surface-box-size) + var(--surface-box-size) + var(--surface-box-size) + var(--surface-box-gap) + var(--surface-box-gap) + var(--surface-box-edge-x) + var(--surface-box-edge-x) + var(--surface-box-border) + var(--surface-box-border));
          --surface-box-4-width: calc(var(--surface-box-size) + var(--surface-box-size) + var(--surface-box-size) + var(--surface-box-size) + var(--surface-box-gap) + var(--surface-box-gap) + var(--surface-box-gap) + var(--surface-box-edge-x) + var(--surface-box-edge-x) + var(--surface-box-border) + var(--surface-box-border));
          --surface-box-1-height: calc(var(--surface-box-size) + var(--surface-box-edge-y) + var(--surface-box-edge-y) + var(--surface-box-border) + var(--surface-box-border));
          --rail-horizontal-cross-size: calc(var(--surface-box-size) + var(--cluster-pad-y) + var(--cluster-pad-y) + var(--surface-box-border) + var(--surface-box-border));
          --surface-box-2-height: calc(var(--surface-box-size) + var(--surface-box-size) + var(--surface-box-gap) + var(--surface-box-edge-y) + var(--surface-box-edge-y) + var(--surface-box-border) + var(--surface-box-border));
          --surface-box-3-height: calc(var(--surface-box-size) + var(--surface-box-size) + var(--surface-box-size) + var(--surface-box-gap) + var(--surface-box-gap) + var(--surface-box-edge-y) + var(--surface-box-edge-y) + var(--surface-box-border) + var(--surface-box-border));
          --surface-box-4-height: calc(var(--surface-box-size) + var(--surface-box-size) + var(--surface-box-size) + var(--surface-box-size) + var(--surface-box-gap) + var(--surface-box-gap) + var(--surface-box-gap) + var(--surface-box-edge-y) + var(--surface-box-edge-y) + var(--surface-box-border) + var(--surface-box-border));
          --rail-gap: var(--surface-toolbar-rail-gap);
          --rail-bar-pad-y: var(--surface-toolbar-rail-bar-pad-y);
          --rail-bar-pad-x: var(--surface-toolbar-rail-bar-pad-x);
          --rail-item-size: var(--surface-button-size);
          --rail-pill-main: calc(var(--rail-item-size) + var(--surface-toolbar-rail-pill-main-extra));
          --rail-pill-cross: calc(var(--rail-item-size) + var(--surface-toolbar-rail-pill-cross-extra));
          --rail-sticky-main-min-x: calc(var(--surface-box-1-width) + var(--surface-box-2-width) + var(--rail-gap) * 2);
          --rail-sticky-main-min-y: calc(var(--surface-box-1-height) + var(--surface-box-2-height) + var(--rail-gap) * 2);
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
        .panel[data-ui-surface="toolbar"],
        .panel[data-ui-surface="toolbar"] .ui-group,
        .panel[data-ui-surface="toolbar"] .ui-group-body,
        .panel[data-ui-surface="toolbar"] .ui-strip,
        .panel[data-ui-surface="toolbar"] .ui-button,
        .panel[data-ui-surface="toolbar"] .ui-field,
        .panel[data-ui-surface="toolbar"] .ui-counter-pill,
        .panel[data-ui-surface="toolbar"] .ui-corner {
          transition-property: background-color, border-color, color, box-shadow, filter;
          transition-duration: 820ms;
          transition-timing-function: cubic-bezier(.22,1,.36,1);
        }
        .panel[data-ui-surface="toolbar"] .toolbar-icon,
        .panel[data-ui-surface="toolbar"] .toolbar-logo,
        .panel[data-ui-surface="toolbar"] .audit-icon {
          transition: filter 820ms cubic-bezier(.22,1,.36,1), opacity 820ms cubic-bezier(.22,1,.36,1);
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
          width: var(--surface-toolbar-icon-box-size);
          height: var(--surface-toolbar-icon-box-size);
          min-width: var(--surface-toolbar-icon-box-size);
          min-height: var(--surface-toolbar-icon-box-size);
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
        @keyframes surface-toolbar-icon-hover-settle {
          0% {
            transform: translateZ(0) scale(var(--surface-toolbar-icon-hover-entry-scale));
          }
          68% {
            transform: translateZ(0) scale(calc(1 + ((var(--surface-toolbar-icon-hover-scale) - 1) * 0.18)));
          }
          100% {
            transform: translateZ(0) scale(1);
          }
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
          line-height: 0;
          font-size: var(--surface-emoji-icon-size);
          flex: 0 0 auto;
          pointer-events: none;
        }
        .panel[data-ui-surface="toolbar"] .toolbar-media .emoji,
        .panel[data-ui-surface="toolbar"] .toolbar-media .emoji img,
        .panel[data-ui-surface="toolbar"] .toolbar-media .audit-icon,
        .panel[data-ui-surface="toolbar"] .toolbar-icon-content .emoji,
        .panel[data-ui-surface="toolbar"] .toolbar-icon-content .emoji img,
        .panel[data-ui-surface="toolbar"] .toolbar-icon-content .audit-icon,
        .panel[data-ui-surface="toolbar"] .ui-icon-content .emoji,
        .panel[data-ui-surface="toolbar"] .ui-icon-content .emoji img,
        .panel[data-ui-surface="toolbar"] .ui-icon-content .audit-icon {
          width: var(--surface-emoji-icon-size) !important;
          height: var(--surface-emoji-icon-size) !important;
          min-width: var(--surface-emoji-icon-size) !important;
          min-height: var(--surface-emoji-icon-size) !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          vertical-align: middle;
          pointer-events: none;
          -webkit-user-drag: none;
          user-drag: none;
          user-select: none;
          -webkit-user-select: none;
        }
        .panel[data-ui-surface="toolbar"] .toolbar-media .emoji img,
        .panel[data-ui-surface="toolbar"] .toolbar-icon-content .emoji img,
        .panel[data-ui-surface="toolbar"] .ui-icon-content .emoji img {
          display: block;
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
          transition:
            width var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing),
            height var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing),
            min-width var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing),
            min-height var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing),
            flex-basis var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing),
            filter var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing);
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
          opacity: 0.5;
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
          z-index: calc(var(--toolbar-layer-cluster) + 2);
          flex: 0 0 auto;
          margin-right: 0;
          isolation: isolate;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"] [data-sticky-group="right"] {
          position: sticky;
          right: 0;
          z-index: calc(var(--toolbar-layer-cluster) + 2);
          flex: 0 0 auto;
          margin-left: 0;
          isolation: isolate;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-sticky-group="left"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-sticky-group="left"] {
          margin-right: 0;
          margin-bottom: 0;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-sticky-group="right"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-sticky-group="right"] {
          margin-left: 0;
          margin-top: 0;
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
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-rail-group],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-rail-group] {
          width: var(--rail-pill-cross);
          min-width: var(--rail-pill-cross);
          max-width: var(--rail-pill-cross);
          min-height: var(--rail-pill-main);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-ui-boxes],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-ui-boxes] {
          width: var(--rail-pill-cross);
          min-width: var(--rail-pill-cross);
          max-width: var(--rail-pill-cross);
          height: var(--ui-boxes-height);
          min-height: var(--ui-boxes-height);
          max-height: var(--ui-boxes-height);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-rail-group]:not([data-sticky-group]),
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-rail-group]:not([data-sticky-group]) {
          position: static;
          left: auto;
          right: auto;
          display: flex;
          flex-direction: column;
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

        .panel[data-ui-surface="toolbar"] [data-ui-glyph-scale="true"] {
          --ui-glyph-scale: 1;
          --ui-scaled-glyph-size: calc(var(--surface-toolbar-icon-size) * var(--ui-glyph-scale));
          --ui-scaled-control-size: calc(var(--surface-button-size) * var(--ui-glyph-scale));
          --ui-scaled-cluster-pad-x: calc(var(--cluster-pad-x) * var(--ui-glyph-scale));
          --ui-scaled-cluster-pad-y: calc(var(--cluster-pad-y) * var(--ui-glyph-scale));
        }
        .panel[data-ui-surface="toolbar"] [data-ui-glyph-scale="true"] .button,
        .panel[data-ui-surface="toolbar"] [data-ui-glyph-scale="true"] button {
          width: var(--ui-scaled-control-size) !important;
          min-width: var(--ui-scaled-control-size) !important;
          max-width: var(--ui-scaled-control-size) !important;
          height: var(--ui-scaled-control-size) !important;
          min-height: var(--ui-scaled-control-size) !important;
          max-height: var(--ui-scaled-control-size) !important;
          padding: 0 !important;
          flex: 0 0 var(--ui-scaled-control-size) !important;
        }
        .panel[data-ui-surface="toolbar"] [data-ui-glyph-scale="true"] .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] [data-ui-glyph-scale="true"] .ui-icon-box,
        .panel[data-ui-surface="toolbar"] [data-ui-glyph-scale="true"] .toolbar-icon-content,
        .panel[data-ui-surface="toolbar"] [data-ui-glyph-scale="true"] .ui-icon-content,
        .panel[data-ui-surface="toolbar"] [data-ui-glyph-scale="true"] .toolbar-icon,
        .panel[data-ui-surface="toolbar"] [data-ui-glyph-scale="true"] .emoji,
        .panel[data-ui-surface="toolbar"] [data-ui-glyph-scale="true"] .emoji img {
          width: var(--ui-scaled-glyph-size) !important;
          min-width: var(--ui-scaled-glyph-size) !important;
          max-width: var(--ui-scaled-glyph-size) !important;
          height: var(--ui-scaled-glyph-size) !important;
          min-height: var(--ui-scaled-glyph-size) !important;
          max-height: var(--ui-scaled-glyph-size) !important;
          flex-basis: var(--ui-scaled-glyph-size) !important;
          font-size: var(--ui-scaled-glyph-size) !important;
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
          line-height: 0;
        }
        .panel[data-ui-surface="toolbar"] .ui-group > .ui-group-body {
          box-sizing: border-box;
          padding-inline: var(--cluster-inset-x);
        }
        .panel[data-ui-surface="toolbar"] [data-ui-boxes="1"] {
          --ui-boxes-width: var(--surface-box-1-width);
          --ui-boxes-height: var(--surface-box-1-height);
        }
        .panel[data-ui-surface="toolbar"] [data-ui-boxes="2"] {
          --ui-boxes-width: var(--surface-box-2-width);
          --ui-boxes-height: var(--surface-box-2-height);
        }
        .panel[data-ui-surface="toolbar"] [data-ui-boxes="3"] {
          --ui-boxes-width: var(--surface-box-3-width);
          --ui-boxes-height: var(--surface-box-3-height);
        }
        .panel[data-ui-surface="toolbar"] [data-ui-boxes="4"] {
          --ui-boxes-width: var(--surface-box-4-width);
          --ui-boxes-height: var(--surface-box-4-height);
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
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="top"] [data-launchpad-group="true"][data-group-shell-motion="enter"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="bottom"] [data-launchpad-group="true"][data-group-shell-motion="enter"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="floating"] [data-launchpad-group="true"][data-group-shell-motion="enter"] {
          animation: launchpad-roadmap-enter-x var(--surface-launchpad-motion-enter-duration) var(--surface-launchpad-motion-easing) both;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-launchpad-group="true"][data-group-shell-motion="enter"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-launchpad-group="true"][data-group-shell-motion="enter"] {
          animation: launchpad-group-enter-y var(--surface-launchpad-motion-enter-duration) var(--surface-launchpad-motion-easing) both;
        }
        .panel[data-ui-surface="toolbar"] .launchpad-inline-invert {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          overflow: visible;
          isolation: isolate;
          z-index: var(--toolbar-layer-cluster);
          line-height: 0;
        }
        .panel[data-ui-surface="toolbar"] [data-inline-invert-popover="true"] {
          position: absolute;
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          white-space: nowrap;
          pointer-events: auto;
          z-index: var(--toolbar-layer-cluster);
          line-height: 0;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="top"] [data-inline-invert-popover="true"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="bottom"] [data-inline-invert-popover="true"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="floating"] [data-inline-invert-popover="true"] {
          right: calc(100% + var(--surface-icon-box-gap));
          top: 0;
          bottom: 0;
          margin-top: auto;
          margin-bottom: auto;
          height: max-content;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-inline-invert-popover="true"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-inline-invert-popover="true"] {
          bottom: calc(100% + var(--surface-icon-box-gap));
          left: 50%;
          transform: translateX(-50%);
          width: max-content;
          justify-content: center;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="top"] [data-roadmap-popover="true"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="bottom"] [data-roadmap-popover="true"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="floating"] [data-roadmap-popover="true"] {
          opacity: 1;
          transform: translateX(0);
          transform-origin: right center;
          transition: opacity var(--surface-launchpad-motion-exit-duration) var(--surface-launchpad-motion-easing), transform var(--surface-launchpad-motion-exit-duration) var(--surface-launchpad-motion-easing);
          will-change: opacity, transform;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-roadmap-popover="true"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-roadmap-popover="true"] {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
          transform-origin: center bottom;
          transition: opacity var(--surface-launchpad-motion-exit-duration) var(--surface-launchpad-motion-easing), transform var(--surface-launchpad-motion-exit-duration) var(--surface-launchpad-motion-easing);
          will-change: opacity, transform;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="top"] [data-roadmap-popover="true"][data-roadmap-motion="enter"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="bottom"] [data-roadmap-popover="true"][data-roadmap-motion="enter"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="floating"] [data-roadmap-popover="true"][data-roadmap-motion="enter"] {
          animation: launchpad-roadmap-enter-x var(--surface-launchpad-motion-enter-duration) var(--surface-launchpad-motion-easing) both;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-roadmap-popover="true"][data-roadmap-motion="enter"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-roadmap-popover="true"][data-roadmap-motion="enter"] {
          animation: launchpad-roadmap-enter-y var(--surface-launchpad-motion-enter-duration) var(--surface-launchpad-motion-easing) both;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="top"] [data-roadmap-popover="true"][data-roadmap-motion="exit"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="bottom"] [data-roadmap-popover="true"][data-roadmap-motion="exit"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="floating"] [data-roadmap-popover="true"][data-roadmap-motion="exit"] {
          animation: launchpad-roadmap-exit-x var(--surface-launchpad-motion-exit-duration) var(--surface-launchpad-motion-easing) both;
          pointer-events: none;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-roadmap-popover="true"][data-roadmap-motion="exit"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-roadmap-popover="true"][data-roadmap-motion="exit"] {
          animation: launchpad-roadmap-exit-y var(--surface-launchpad-motion-exit-duration) var(--surface-launchpad-motion-easing) both;
          pointer-events: none;
        }
        .panel[data-ui-surface="toolbar"] [data-pinned-popover="true"] {
          display: inline-flex;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          gap: var(--surface-icon-box-gap);
          line-height: 0;
          overflow: hidden;
          will-change: width, height;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-pinned-popover="true"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-pinned-popover="true"] {
          flex-direction: column;
        }
        .panel[data-ui-surface="toolbar"] [data-pinned-popover="true"] .ui-icon-box,
        .panel[data-ui-surface="toolbar"] [data-pinned-popover="true"] .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] [data-pinned-popover="true"] .toolbar-media-box,
        .panel[data-ui-surface="toolbar"] [data-pinned-popover="true"] .toolbar-logo,
        .panel[data-ui-surface="toolbar"] [data-pinned-popover="true"] .launchpad-scenario-icon {
          will-change: opacity, transform;
        }
        .panel[data-ui-surface="toolbar"] [data-launchpad-group="true"][data-group-id="pinned"] {
          transition: gap var(--surface-launchpad-pinned-motion-exit-duration) linear;
        }
        .panel[data-ui-surface="toolbar"] [data-launchpad-group="true"][data-group-id="pinned"][data-pinned-motion="enter"]:not([data-pinned-ready="true"]),
        .panel[data-ui-surface="toolbar"] [data-launchpad-group="true"][data-group-id="pinned"][data-pinned-motion="exit"] {
          gap: 0;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="top"] [data-pinned-popover="true"][data-pinned-motion="enter"]:not([data-pinned-ready="true"]),
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="bottom"] [data-pinned-popover="true"][data-pinned-motion="enter"]:not([data-pinned-ready="true"]),
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="floating"] [data-pinned-popover="true"][data-pinned-motion="enter"]:not([data-pinned-ready="true"]) {
          width: 0;
          animation: none;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-pinned-popover="true"][data-pinned-motion="enter"]:not([data-pinned-ready="true"]),
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-pinned-popover="true"][data-pinned-motion="enter"]:not([data-pinned-ready="true"]) {
          height: 0;
          animation: none;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="top"] [data-pinned-popover="true"][data-pinned-motion="enter"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="bottom"] [data-pinned-popover="true"][data-pinned-motion="enter"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="floating"] [data-pinned-popover="true"][data-pinned-motion="enter"] {
          animation: launchpad-pinned-width-enter var(--surface-launchpad-pinned-motion-enter-duration) linear both;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-pinned-popover="true"][data-pinned-motion="enter"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-pinned-popover="true"][data-pinned-motion="enter"] {
          animation: launchpad-pinned-height-enter var(--surface-launchpad-pinned-motion-enter-duration) linear both;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="top"] [data-pinned-popover="true"][data-pinned-motion="exit"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="bottom"] [data-pinned-popover="true"][data-pinned-motion="exit"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="floating"] [data-pinned-popover="true"][data-pinned-motion="exit"] {
          animation: launchpad-pinned-width-exit var(--surface-launchpad-pinned-motion-exit-duration) linear both;
          pointer-events: none;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-pinned-popover="true"][data-pinned-motion="exit"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-pinned-popover="true"][data-pinned-motion="exit"] {
          animation: launchpad-pinned-height-exit var(--surface-launchpad-pinned-motion-exit-duration) linear both;
          pointer-events: none;
        }
        .panel[data-ui-surface="toolbar"] [data-pinned-popover="true"][data-pinned-motion="enter"]:not([data-pinned-ready="true"]) .ui-icon-box,
        .panel[data-ui-surface="toolbar"] [data-pinned-popover="true"][data-pinned-motion="enter"]:not([data-pinned-ready="true"]) .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] [data-pinned-popover="true"][data-pinned-motion="enter"]:not([data-pinned-ready="true"]) .toolbar-media-box,
        .panel[data-ui-surface="toolbar"] [data-pinned-popover="true"][data-pinned-motion="enter"]:not([data-pinned-ready="true"]) .toolbar-logo,
        .panel[data-ui-surface="toolbar"] [data-pinned-popover="true"][data-pinned-motion="enter"]:not([data-pinned-ready="true"]) .launchpad-scenario-icon {
          animation: launchpad-pinned-content-enter var(--surface-launchpad-pinned-motion-enter-duration) var(--surface-launchpad-motion-easing) both;
        }
        .panel[data-ui-surface="toolbar"] [data-pinned-popover="true"][data-pinned-motion="exit"] .ui-icon-box,
        .panel[data-ui-surface="toolbar"] [data-pinned-popover="true"][data-pinned-motion="exit"] .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] [data-pinned-popover="true"][data-pinned-motion="exit"] .toolbar-media-box,
        .panel[data-ui-surface="toolbar"] [data-pinned-popover="true"][data-pinned-motion="exit"] .toolbar-logo,
        .panel[data-ui-surface="toolbar"] [data-pinned-popover="true"][data-pinned-motion="exit"] .launchpad-scenario-icon {
          animation: launchpad-pinned-content-exit var(--surface-launchpad-pinned-motion-exit-duration) var(--surface-launchpad-motion-easing) both;
        }
        .panel[data-ui-surface="toolbar"] [data-roadmap-popover="true"][data-roadmap-motion="exit"] *,
        .panel[data-ui-surface="toolbar"] [data-roadmap-popover="true"][aria-hidden="true"],
        .panel[data-ui-surface="toolbar"] [data-roadmap-popover="true"][aria-hidden="true"] * {
          pointer-events: none !important;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="top"] [data-launchpad-group="true"][data-expanded="false"] [data-roadmap-popover="true"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="bottom"] [data-launchpad-group="true"][data-expanded="false"] [data-roadmap-popover="true"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="floating"] [data-launchpad-group="true"][data-expanded="false"] [data-roadmap-popover="true"] {
          opacity: 0;
          transform: translateX(var(--surface-launchpad-motion-offset));
          pointer-events: none;
          visibility: hidden;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-launchpad-group="true"][data-expanded="false"] [data-roadmap-popover="true"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-launchpad-group="true"][data-expanded="false"] [data-roadmap-popover="true"] {
          opacity: 0;
          transform: translateX(-50%) translateY(var(--surface-launchpad-motion-offset));
          pointer-events: none;
          visibility: hidden;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="top"] [data-launchpad-group="true"][data-group-motion="enter"] > :not([data-launchpad-group-head="true"]),
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="bottom"] [data-launchpad-group="true"][data-group-motion="enter"] > :not([data-launchpad-group-head="true"]),
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="floating"] [data-launchpad-group="true"][data-group-motion="enter"] > :not([data-launchpad-group-head="true"]) {
          animation: launchpad-group-enter-x var(--surface-launchpad-motion-enter-duration) var(--surface-launchpad-motion-easing) both;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-launchpad-group="true"][data-group-motion="enter"] > :not([data-launchpad-group-head="true"]),
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-launchpad-group="true"][data-group-motion="enter"] > :not([data-launchpad-group-head="true"]) {
          animation: launchpad-group-enter-y var(--surface-launchpad-motion-enter-duration) var(--surface-launchpad-motion-easing) both;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="top"] [data-launchpad-group="true"][data-group-id="pinned"][data-group-motion="enter"] > :not([data-launchpad-group-head="true"]),
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="bottom"] [data-launchpad-group="true"][data-group-id="pinned"][data-group-motion="enter"] > :not([data-launchpad-group-head="true"]),
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="floating"] [data-launchpad-group="true"][data-group-id="pinned"][data-group-motion="enter"] > :not([data-launchpad-group-head="true"]) {
          animation: launchpad-group-enter-x var(--surface-launchpad-pinned-motion-enter-duration) var(--surface-launchpad-motion-easing) both;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-launchpad-group="true"][data-group-id="pinned"][data-group-motion="enter"] > :not([data-launchpad-group-head="true"]),
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-launchpad-group="true"][data-group-id="pinned"][data-group-motion="enter"] > :not([data-launchpad-group-head="true"]) {
          animation: launchpad-group-enter-y var(--surface-launchpad-pinned-motion-enter-duration) var(--surface-launchpad-motion-easing) both;
        }
        .panel[data-ui-surface="toolbar"] .ui-button[data-inline-motion] .ui-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-inline-motion] .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-inline-motion] .toolbar-media-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-inline-motion] > .toolbar-logo,
        .panel[data-ui-surface="toolbar"] .ui-button[data-inline-motion] > .launchpad-scenario-icon {
          --surface-launchpad-inline-spin: 360deg;
          --surface-launchpad-inline-motion-duration: var(--surface-launchpad-click-spin-duration);
          animation: launchpad-inline-spin var(--surface-launchpad-inline-motion-duration) var(--surface-launchpad-motion-easing) both !important;
        }
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="pinned"][data-inline-motion="enter"] .ui-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="pinned"][data-inline-motion="enter"] .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="pinned"][data-inline-motion="enter"] .toolbar-media-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="pinned"][data-inline-motion="enter"] > .toolbar-logo,
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="pinned"][data-inline-motion="enter"] > .launchpad-scenario-icon {
          --surface-launchpad-inline-spin: 360deg;
        }
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="pinned"][data-inline-motion="exit"] .ui-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="pinned"][data-inline-motion="exit"] .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="pinned"][data-inline-motion="exit"] .toolbar-media-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="pinned"][data-inline-motion="exit"] > .toolbar-logo,
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="pinned"][data-inline-motion="exit"] > .launchpad-scenario-icon {
          --surface-launchpad-inline-spin: -360deg;
        }
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="toolbox"][data-inline-motion="exit"] .ui-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="toolbox"][data-inline-motion="exit"] .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="toolbox"][data-inline-motion="exit"] .toolbar-media-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="toolbox"][data-inline-motion="exit"] > .toolbar-logo,
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="toolbox"][data-inline-motion="exit"] > .launchpad-scenario-icon {
          --surface-launchpad-inline-spin: -360deg;
        }
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="roadmap"][data-inline-motion="enter"] .ui-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="roadmap"][data-inline-motion="enter"] .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="roadmap"][data-inline-motion="enter"] .toolbar-media-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="roadmap"][data-inline-motion="enter"] > .toolbar-logo,
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="roadmap"][data-inline-motion="enter"] > .launchpad-scenario-icon {
          --surface-launchpad-inline-spin: -360deg;
        }
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="roadmap"][data-inline-motion="exit"] .ui-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="roadmap"][data-inline-motion="exit"] .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="roadmap"][data-inline-motion="exit"] .toolbar-media-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="roadmap"][data-inline-motion="exit"] > .toolbar-logo,
        .panel[data-ui-surface="toolbar"] .ui-button[data-id="roadmap"][data-inline-motion="exit"] > .launchpad-scenario-icon {
          --surface-launchpad-inline-spin: 360deg;
        }
        #launchpad-panel[data-ui-surface="toolbar"] .ui-button[data-launchpad-marker="true"] > .launchpad-marker-visual {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          transform-origin: center center;
        }
        #launchpad-panel[data-ui-surface="toolbar"] .ui-button[data-launchpad-marker="true"][data-inline-motion] > .launchpad-marker-visual {
          --surface-launchpad-inline-motion-duration: 880ms;
          animation: launchpad-marker-enter var(--surface-launchpad-inline-motion-duration) cubic-bezier(.18,.72,.24,1) both !important;
          will-change: transform;
        }
        #launchpad-panel[data-ui-surface="toolbar"] .ui-button[data-launchpad-marker="true"][data-inline-motion="exit"] > .launchpad-marker-visual {
          animation-name: launchpad-marker-exit !important;
          animation-timing-function: cubic-bezier(.55,0,.82,.3) !important;
        }
        .panel[data-ui-surface="toolbar"] [data-feed-travel] {
          position: relative;
          z-index: var(--toolbar-layer-cluster);
          transform-origin: center center;
          will-change: transform, opacity;
        }
        .panel[data-ui-surface="toolbar"][data-feed-traveling="true"] {
          pointer-events: none;
        }
        .panel[data-ui-surface="toolbar"] .ui-button[data-feed-travel-hidden="true"] .ui-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-feed-travel-hidden="true"] .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-feed-travel-hidden="true"] .toolbar-media-box {
          opacity: 0;
        }
        .panel[data-ui-surface="toolbar"][data-feed-traveling="true"] [data-line="true"] {
          transition: none;
        }
        .panel[data-ui-surface="toolbar"][data-feed-traveling="true"][data-feed-travel-phase="travel"] [data-line="true"] {
          opacity: 0;
        }
        .panel[data-ui-surface="toolbar"][data-feed-traveling="true"][data-feed-travel-phase="reveal"] [data-line="true"] {
          animation: launchpad-feed-reveal var(--surface-launchpad-travel-motion-duration) linear both;
        }
        .launchpad-travel-ghost {
          position: fixed !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          z-index: 2147483647 !important;
          isolation: isolate;
          filter: none !important;
          transform-origin: center center;
          will-change: transform, opacity;
        }
        .launchpad-travel-ghost .ui-icon-content,
        .launchpad-travel-ghost .toolbar-icon-content,
        .launchpad-travel-ghost .toolbar-media,
        .launchpad-travel-ghost .toolbar-icon,
        .launchpad-travel-ghost .toolbar-logo,
        .launchpad-travel-ghost .emoji {
          display: block;
          width: 100% !important;
          height: 100% !important;
          min-width: 100% !important;
          min-height: 100% !important;
        }
        .launchpad-travel-ghost .emoji img,
        .launchpad-travel-ghost img {
          display: block;
          width: 100% !important;
          height: 100% !important;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="top"] [data-launchpad-group="true"][data-group-id="pinned"][data-group-motion="exit"] > :not([data-launchpad-group-head="true"]),
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="bottom"] [data-launchpad-group="true"][data-group-id="pinned"][data-group-motion="exit"] > :not([data-launchpad-group-head="true"]),
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="floating"] [data-launchpad-group="true"][data-group-id="pinned"][data-group-motion="exit"] > :not([data-launchpad-group-head="true"]) {
          animation: launchpad-group-exit-x var(--surface-launchpad-pinned-motion-exit-duration) var(--surface-launchpad-motion-easing) both;
          pointer-events: none;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-launchpad-group="true"][data-group-id="pinned"][data-group-motion="exit"] > :not([data-launchpad-group-head="true"]),
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-launchpad-group="true"][data-group-id="pinned"][data-group-motion="exit"] > :not([data-launchpad-group-head="true"]) {
          animation: launchpad-group-exit-y var(--surface-launchpad-pinned-motion-exit-duration) var(--surface-launchpad-motion-easing) both;
          pointer-events: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .panel[data-ui-surface="toolbar"] [data-roadmap-popover="true"],
          .panel[data-ui-surface="toolbar"] .ui-button[data-inline-motion],
          .panel[data-ui-surface="toolbar"] .ui-button[data-inline-motion] *,
          .panel[data-ui-surface="toolbar"] [data-launchpad-group="true"][data-group-shell-motion],
          .panel[data-ui-surface="toolbar"] [data-launchpad-group="true"] > :not([data-launchpad-group-head="true"]) {
            transition: none !important;
            animation: none !important;
          }
        }
        @keyframes launchpad-roadmap-enter-x {
          from {
            opacity: 0;
            transform: translateX(var(--surface-launchpad-motion-offset));
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes launchpad-roadmap-enter-y {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(var(--surface-launchpad-motion-offset));
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        @keyframes launchpad-group-enter-x {
          from {
            opacity: 0;
            transform: translateX(var(--surface-launchpad-motion-offset));
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes launchpad-group-enter-y {
          from {
            opacity: 0;
            transform: translateY(var(--surface-launchpad-motion-offset));
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes launchpad-group-exit-x {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(var(--surface-launchpad-motion-offset));
          }
        }
        @keyframes launchpad-group-exit-y {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(var(--surface-launchpad-motion-offset));
          }
        }
        @keyframes launchpad-pinned-content-enter {
          0%, 69% {
            opacity: 0;
            transform: scale(.96);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes launchpad-pinned-content-exit {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          69%, 100% {
            opacity: 0;
            transform: scale(.96);
          }
        }
        @keyframes launchpad-pinned-width-enter {
          from {
            width: 0;
          }
          to {
            width: var(--surface-launchpad-pinned-popover-width, auto);
          }
        }
        @keyframes launchpad-pinned-height-enter {
          from {
            height: 0;
          }
          to {
            height: var(--surface-launchpad-pinned-popover-height, auto);
          }
        }
        @keyframes launchpad-pinned-width-exit {
          from {
            width: var(--surface-launchpad-pinned-popover-width, auto);
          }
          to {
            width: 0;
          }
        }
        @keyframes launchpad-pinned-height-exit {
          from {
            height: var(--surface-launchpad-pinned-popover-height, auto);
          }
          to {
            height: 0;
          }
        }
        @keyframes launchpad-feed-reveal {
          0% {
            opacity: 0;
          }
          22% {
            opacity: 0.08;
          }
          58% {
            opacity: 0.42;
          }
          82% {
            opacity: 0.78;
          }
          100% {
            opacity: 1;
          }
        }
        @keyframes launchpad-roadmap-exit-x {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(var(--surface-launchpad-motion-offset));
          }
        }
        @keyframes launchpad-roadmap-exit-y {
          from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          to {
            opacity: 0;
            transform: translateX(-50%) translateY(var(--surface-launchpad-motion-offset));
          }
        }
        @keyframes launchpad-inline-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(var(--surface-launchpad-inline-spin));
          }
        }
        @keyframes launchpad-marker-exit {
          0% {
            transform: rotate(0deg) scale(1);
          }
          34% {
            transform: rotate(110deg) scale(0.82);
          }
          68% {
            transform: rotate(410deg) scale(0.4);
          }
          100% {
            transform: rotate(900deg) scale(0.03125);
          }
        }
        @keyframes launchpad-marker-enter {
          0% {
            transform: rotate(-900deg) scale(0.03125);
          }
          32% {
            transform: rotate(-410deg) scale(0.4);
          }
          66% {
            transform: rotate(-110deg) scale(0.82);
          }
          100% {
            transform: rotate(0deg) scale(1);
          }
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
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"] .ui-line {
          --surface-line-edge-pad: 0px;
          --surface-line-cross-pad: 0px;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: var(--rail-gap);
          min-width: 0;
          width: 100%;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="start"] {
          justify-content: flex-start;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="between"] > .ui-line {
          flex: 1 1 auto;
          min-width: 0;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="between"] > :last-child:not(.ui-line) {
          margin-left: auto;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="center"] {
          justify-content: center;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] {
          display: grid;
          grid-template-columns: max-content minmax(0, 1fr) max-content;
          align-items: center;
          column-gap: var(--rail-gap);
          row-gap: 0;
          width: 100%;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line {
          min-width: 0;
          width: 100%;
          padding-left: 0;
          padding-right: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--rail-gap);
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip {
          width: 100%;
          min-width: 0;
          display: grid;
          align-items: center;
          justify-content: stretch;
          gap: 0;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > :first-child:not(.ui-line) {
          justify-self: start;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > :last-child:not(.ui-line) {
          justify-self: end;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip > * {
          justify-self: center;
          min-width: 0;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] [data-head-flex="true"] {
          box-sizing: border-box;
          justify-self: stretch;
          margin-left: var(--ui-head-flex-gap, 0px);
          margin-right: var(--ui-head-flex-gap, 0px);
          width: var(--ui-head-flex-width, auto) !important;
          min-width: min(var(--ui-head-flex-min, 0px), 100%) !important;
          max-width: var(--ui-head-flex-width, 100%) !important;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip:has(> :only-child) {
          grid-template-columns:
            minmax(var(--rail-gap), 1fr)
            max-content
            minmax(var(--rail-gap), 1fr)
            ;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip:has(> :only-child) > :only-child {
          grid-column: 2;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip:has(> :only-child[data-head-flex="true"]) {
          grid-template-columns:
            minmax(min(var(--ui-head-flex-min, 0px), 100%), 1fr)
            ;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip:has(> :only-child[data-head-flex="true"]) > :only-child {
          grid-column: 1;
          width: 100% !important;
          max-width: 100% !important;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip:has(> :nth-child(2):last-child) {
          grid-template-columns:
            minmax(var(--rail-gap), 1fr)
            max-content
            minmax(var(--rail-gap), 1fr)
            max-content
            minmax(var(--rail-gap), 1fr)
            ;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip:has(> :nth-child(2):last-child) > :nth-child(1) {
          grid-column: 2;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip:has(> :nth-child(2):last-child) > :nth-child(2) {
          grid-column: 4;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip:has(> :nth-child(3):last-child) {
          grid-template-columns:
            minmax(var(--rail-gap), 1fr)
            max-content
            minmax(var(--rail-gap), 1fr)
            max-content
            minmax(var(--rail-gap), 1fr)
            max-content
            minmax(var(--rail-gap), 1fr)
            ;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip:has(> :nth-child(3):last-child) > :nth-child(1) {
          grid-column: 2;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip:has(> :nth-child(3):last-child) > :nth-child(2) {
          grid-column: 4;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip:has(> :nth-child(3):last-child) > :nth-child(3) {
          grid-column: 6;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip:has(> :nth-child(3):last-child) > :nth-child(2)[data-head-flex="true"] {
          width: 100% !important;
          min-width: min(var(--ui-head-flex-min, 0px), 100%) !important;
          max-width: 100% !important;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip:has(> :nth-child(3):last-child):has(> :nth-child(2)[data-head-flex="true"]) {
          grid-template-columns:
            max-content
            minmax(min(var(--ui-head-flex-min, 0px), 100%), 1fr)
            max-content
            ;
          column-gap: var(--rail-gap);
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip:has(> :nth-child(3):last-child):has(> :nth-child(2)[data-head-flex="true"]) > :nth-child(1) {
          grid-column: 1;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip:has(> :nth-child(3):last-child):has(> :nth-child(2)[data-head-flex="true"]) > :nth-child(2) {
          grid-column: 2;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip:has(> :nth-child(3):last-child):has(> :nth-child(2)[data-head-flex="true"]) > :nth-child(3) {
          grid-column: 3;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip:has(> :nth-child(4):last-child) {
          grid-template-columns:
            minmax(var(--rail-gap), 1fr)
            max-content
            minmax(var(--rail-gap), 1fr)
            max-content
            minmax(var(--rail-gap), 1fr)
            max-content
            minmax(var(--rail-gap), 1fr)
            max-content
            minmax(var(--rail-gap), 1fr)
            ;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip:has(> :nth-child(4):last-child) > :nth-child(1) {
          grid-column: 2;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip:has(> :nth-child(4):last-child) > :nth-child(2) {
          grid-column: 4;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip:has(> :nth-child(4):last-child) > :nth-child(3) {
          grid-column: 6;
        }
        .panel[data-ui-surface="toolbar"] .ui-shell[data-pack="spread"] > .ui-line > .ui-strip:has(> :nth-child(4):last-child) > :nth-child(4) {
          grid-column: 8;
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
          line-height: 0;
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
          width: var(--surface-toolbar-icon-active-size) !important;
          height: var(--surface-toolbar-icon-active-size) !important;
          min-width: var(--surface-toolbar-icon-active-size) !important;
          min-height: var(--surface-toolbar-icon-active-size) !important;
          flex-basis: var(--surface-toolbar-icon-active-size);
          filter: var(--surface-glyph-filter-active);
        }
        .panel[data-ui-surface="toolbar"] .ui-button[data-active="true"]:has(.toolbar-icon) .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button[data-active="true"]:has(.toolbar-icon) .ui-icon-box {
          transform: translateZ(0) scale(1);
        }
        .panel[data-ui-surface="toolbar"]:not([data-icon-mode="glyph"]) .ui-button[data-active="true"] .toolbar-media,
        .panel[data-ui-surface="toolbar"]:not([data-icon-mode="glyph"]) .ui-button[data-active="true"] .toolbar-icon-content,
        .panel[data-ui-surface="toolbar"]:not([data-icon-mode="glyph"]) .ui-button[data-active="true"] .ui-icon-content {
          transform: none;
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
          align-items: center;
          justify-content: center;
          align-self: center;
          width: 0;
          min-width: 0;
          max-width: 0;
          height: 0;
          min-height: 0;
          max-height: 0;
          margin-left: calc(var(--surface-icon-box-gap) * -0.5);
          margin-right: calc(var(--surface-icon-box-gap) * -0.5);
          opacity: 1;
          pointer-events: none;
          overflow: visible;
          position: relative;
          color: var(--surface-toolbar-group-bg-light);
        }
        .panel[data-ui-surface="toolbar"][data-theme="light"] .ui-separator {
          color: var(--surface-toolbar-group-bg-dark);
        }
        .panel[data-ui-surface="toolbar"][data-theme="dark"] .ui-separator {
          color: var(--surface-toolbar-group-bg-light);
        }
        .panel[data-ui-surface="toolbar"] .ui-separator::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          display: block;
          width: 1px;
          height: calc(var(--surface-button-size) * 0.62);
          border-radius: 999px;
          background: currentColor;
          transform: translate(-50%, -50%);
        }
        .panel[data-ui-surface="toolbar"] .ui-separator[data-separator-mode="dot"]::before {
          width: 5px;
          height: 5px;
          border-radius: 999px;
        }
        .panel[data-ui-surface="toolbar"] .ui-separator[data-separator-mode="dot"] {
          width: calc(var(--surface-launchpad-slot-size, var(--surface-button-size)) * 0.5);
          min-width: calc(var(--surface-launchpad-slot-size, var(--surface-button-size)) * 0.5);
          max-width: calc(var(--surface-launchpad-slot-size, var(--surface-button-size)) * 0.5);
          height: calc(var(--surface-launchpad-slot-size, var(--surface-button-size)) * 0.5);
          min-height: calc(var(--surface-launchpad-slot-size, var(--surface-button-size)) * 0.5);
          max-height: calc(var(--surface-launchpad-slot-size, var(--surface-button-size)) * 0.5);
          margin-left: 0;
          margin-right: 0;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] .ui-separator,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] .ui-separator {
          width: 0;
          min-width: 0;
          max-width: 0;
          height: 0;
          min-height: 0;
          max-height: 0;
          margin-left: 0;
          margin-right: 0;
          margin-top: calc(var(--rail-gap) * -0.5);
          margin-bottom: calc(var(--rail-gap) * -0.5);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] .ui-separator::before,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] .ui-separator::before {
          width: calc(var(--surface-button-size) * 0.62);
          height: 1px;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] .ui-separator[data-separator-mode="dot"]::before,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] .ui-separator[data-separator-mode="dot"]::before {
          width: 5px;
          height: 5px;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] .ui-separator[data-separator-mode="dot"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] .ui-separator[data-separator-mode="dot"] {
          width: calc(var(--surface-launchpad-slot-size, var(--surface-button-size)) * 0.5);
          min-width: calc(var(--surface-launchpad-slot-size, var(--surface-button-size)) * 0.5);
          max-width: calc(var(--surface-launchpad-slot-size, var(--surface-button-size)) * 0.5);
          height: calc(var(--surface-launchpad-slot-size, var(--surface-button-size)) * 0.5);
          min-height: calc(var(--surface-launchpad-slot-size, var(--surface-button-size)) * 0.5);
          max-height: calc(var(--surface-launchpad-slot-size, var(--surface-button-size)) * 0.5);
          margin-top: 0;
          margin-bottom: 0;
        }
        .panel[data-ui-surface="toolbar"] .ui-button:hover:not([data-active="true"]) {
          transform: none !important;
          background: transparent !important;
          border-color: transparent !important;
          box-shadow: none !important;
        }
        .panel[data-ui-surface="toolbar"] .ui-button:hover:not(:has(.toolbar-icon)) .toolbar-media-box,
        .panel[data-ui-surface="toolbar"] .ui-button:hover:not(:has(.toolbar-icon)) .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button:hover:not(:has(.toolbar-icon)) .ui-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button:focus-visible:not(:has(.toolbar-icon)) .toolbar-media-box,
        .panel[data-ui-surface="toolbar"] .ui-button:focus-visible:not(:has(.toolbar-icon)) .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button:focus-visible:not(:has(.toolbar-icon)) .ui-icon-box {
          transform: translateZ(0) scale(1.12);
        }
        .panel[data-ui-surface="toolbar"] .ui-button:active:not(:has(.toolbar-icon)) .toolbar-media-box,
        .panel[data-ui-surface="toolbar"] .ui-button:active:not(:has(.toolbar-icon)) .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button:active:not(:has(.toolbar-icon)) .ui-icon-box {
          transform: translateZ(0) scale(1.08);
        }
        .panel[data-ui-surface="toolbar"] .ui-button:has(.toolbar-icon):hover .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button:has(.toolbar-icon):hover .ui-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button:has(.toolbar-icon):focus-visible .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button:has(.toolbar-icon):focus-visible .ui-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button:has(.toolbar-icon):active .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button:has(.toolbar-icon):active .ui-icon-box,
        .panel[data-ui-surface="toolbar"][data-icon-mode="glyph"] .ui-button:hover .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"][data-icon-mode="glyph"] .ui-button:hover .ui-icon-box,
        .panel[data-ui-surface="toolbar"][data-icon-mode="glyph"] .ui-button:focus-visible .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"][data-icon-mode="glyph"] .ui-button:focus-visible .ui-icon-box,
        .panel[data-ui-surface="toolbar"][data-icon-mode="glyph"] .ui-button:active .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"][data-icon-mode="glyph"] .ui-button:active .ui-icon-box {
          transform: translateZ(0) scale(1);
        }
        .panel[data-ui-surface="toolbar"] .ui-button:hover:not([data-active="true"]):has(.toolbar-icon) .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button:hover:not([data-active="true"]):has(.toolbar-icon) .ui-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button:focus-visible:not([data-active="true"]):has(.toolbar-icon) .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .ui-button:focus-visible:not([data-active="true"]):has(.toolbar-icon) .ui-icon-box,
        .panel[data-ui-surface="toolbar"][data-icon-mode="glyph"] .ui-button:hover:not([data-active="true"]) .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"][data-icon-mode="glyph"] .ui-button:hover:not([data-active="true"]) .ui-icon-box,
        .panel[data-ui-surface="toolbar"][data-icon-mode="glyph"] .ui-button:focus-visible:not([data-active="true"]) .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"][data-icon-mode="glyph"] .ui-button:focus-visible:not([data-active="true"]) .ui-icon-box {
          animation: surface-toolbar-icon-hover-settle var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing) 1 both;
        }
        .panel[data-ui-surface="toolbar"] .ui-button:has(.toolbar-icon):hover .toolbar-icon,
        .panel[data-ui-surface="toolbar"] .ui-button:has(.toolbar-icon):focus-visible .toolbar-icon,
        .panel[data-ui-surface="toolbar"][data-icon-mode="glyph"] .ui-button:hover .toolbar-icon,
        .panel[data-ui-surface="toolbar"][data-icon-mode="glyph"] .ui-button:focus-visible .toolbar-icon {
          width: var(--surface-toolbar-icon-hover-size) !important;
          height: var(--surface-toolbar-icon-hover-size) !important;
          min-width: var(--surface-toolbar-icon-hover-size) !important;
          min-height: var(--surface-toolbar-icon-hover-size) !important;
          flex-basis: var(--surface-toolbar-icon-hover-size);
          transition-delay: 0s, 0s, 0s, 0s, 0s, 0s;
        }
        .panel[data-ui-surface="toolbar"] .ui-button[data-active="true"]:has(.toolbar-icon):hover .toolbar-icon,
        .panel[data-ui-surface="toolbar"] .ui-button[data-active="true"]:has(.toolbar-icon):focus-visible .toolbar-icon,
        .panel[data-ui-surface="toolbar"][data-icon-mode="glyph"] .ui-button[data-active="true"]:hover .toolbar-icon,
        .panel[data-ui-surface="toolbar"][data-icon-mode="glyph"] .ui-button[data-active="true"]:focus-visible .toolbar-icon {
          width: var(--surface-toolbar-icon-size) !important;
          height: var(--surface-toolbar-icon-size) !important;
          min-width: var(--surface-toolbar-icon-size) !important;
          min-height: var(--surface-toolbar-icon-size) !important;
          flex-basis: var(--surface-toolbar-icon-size);
          transition-delay: 0s, 0s, 0s, 0s, 0s, 0s;
        }
        .panel[data-ui-surface="toolbar"] .ui-button:has(.toolbar-icon):active .toolbar-icon,
        .panel[data-ui-surface="toolbar"][data-icon-mode="glyph"] .ui-button:active .toolbar-icon {
          width: var(--surface-toolbar-icon-size) !important;
          height: var(--surface-toolbar-icon-size) !important;
          min-width: var(--surface-toolbar-icon-size) !important;
          min-height: var(--surface-toolbar-icon-size) !important;
          flex-basis: var(--surface-toolbar-icon-size);
          transition-delay: 0s, 0s, 0s, 0s, 0s, 0s;
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
        .panel,
        .panel * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .panel::-webkit-scrollbar,
        .panel *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }
        .panel::-webkit-scrollbar-thumb,
        .panel::-webkit-scrollbar-track,
        .panel::-webkit-scrollbar-corner,
        .panel *::-webkit-scrollbar-thumb,
        .panel *::-webkit-scrollbar-track,
        .panel *::-webkit-scrollbar-corner {
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
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        #launchpad-panel[data-ui-surface="toolbar"] .launchpad-back-icon {
          display: grid;
          place-items: center;
          width: var(--surface-emoji-icon-size);
          height: var(--surface-emoji-icon-size);
          line-height: 0;
          flex: 0 0 auto;
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
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dragging="true"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dragging="true"] * {
          transition: none !important;
          animation: none !important;
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
          --surface-launchpad-slot-size: 32px;
          --surface-toolbar-media-size: calc(var(--surface-button-size) * 0.88);
          --surface-emoji-icon-size: var(--surface-toolbar-media-size);
          --surface-toolbar-icon-size: var(--surface-toolbar-media-size);
          --surface-toolbar-logo-size: var(--surface-toolbar-media-size);
        }
        #launchpad-panel[data-ui-surface="toolbar"] .ui-button,
        #launchpad-panel[data-ui-surface="toolbar"] .button-emoji,
        #launchpad-panel[data-ui-surface="toolbar"] .launchpad-section-button {
          width: var(--surface-launchpad-slot-size) !important;
          min-width: var(--surface-launchpad-slot-size) !important;
          max-width: var(--surface-launchpad-slot-size) !important;
          height: var(--surface-launchpad-slot-size) !important;
          min-height: var(--surface-launchpad-slot-size) !important;
          max-height: var(--surface-launchpad-slot-size) !important;
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
        #launchpad-panel[data-ui-surface="toolbar"] .toolbar-media-box,
        #launchpad-panel[data-ui-surface="toolbar"] .toolbar-icon-box,
        #launchpad-panel[data-ui-surface="toolbar"] .ui-button .ui-icon-box {
          width: var(--surface-launchpad-slot-size);
          height: var(--surface-launchpad-slot-size);
          min-width: var(--surface-launchpad-slot-size);
          min-height: var(--surface-launchpad-slot-size);
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
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"] .ui-shell[data-launchpad-compact="true"] [data-line="true"] {
          flex: 0 0 auto;
          width: max-content;
          max-width: none;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"] > .ui-shell > .ui-group {
          flex: 0 0 auto;
          position: relative;
          z-index: var(--toolbar-layer-base);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] .ui-shell,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] .ui-shell {
          flex: 1 1 auto;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          width: 100%;
          max-width: 100%;
          min-height: 0;
          height: 100%;
          overflow: visible;
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
          min-height: calc(var(--rail-side-pad-y) * 2 + var(--rail-sticky-main-min-y));
          padding: var(--rail-side-pad-y) var(--rail-side-pad-x);
          overflow-x: visible;
          overflow-y: hidden;
          scroll-snap-type: none;
          scrollbar-width: none;
          -ms-overflow-style: none;
          touch-action: pan-y;
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
          height: max-content;
          min-height: max-content;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] .ui-line > .ui-strip::after,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] .ui-line > .ui-strip::after {
          width: 0;
          height: 0;
          margin-top: calc(var(--surface-line-end-spacer, 0px) - var(--surface-icon-box-gap));
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
          display: flex;
          align-items: center;
          min-width: calc(var(--rail-bar-pad-x) * 2 + var(--rail-sticky-main-min-x));
          height: calc(var(--rail-bar-pad-y) * 2 + var(--rail-horizontal-cross-size));
          min-height: calc(var(--rail-bar-pad-y) * 2 + var(--rail-horizontal-cross-size));
          max-height: calc(var(--rail-bar-pad-y) * 2 + var(--rail-horizontal-cross-size));
          padding: var(--rail-bar-pad-y) var(--rail-bar-pad-x);
          overflow-x: hidden;
          overflow-y: hidden;
          scroll-snap-type: none;
          touch-action: pan-x;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="top"] .ui-shell,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="bottom"] .ui-shell,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="floating"] .ui-shell {
          height: 100%;
          min-height: 0;
          align-items: center;
          width: max-content;
          max-width: none;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-toolbar-resizing="true"]:is([data-dock="top"],[data-dock="bottom"],[data-dock="floating"]) .ui-shell:not([data-launchpad-compact="true"]) {
          width: 100%;
          max-width: 100%;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-toolbar-resizing="true"]:is([data-dock="top"],[data-dock="bottom"],[data-dock="floating"]) .ui-shell:not([data-launchpad-compact="true"]) > :first-child,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-toolbar-resizing="true"]:is([data-dock="top"],[data-dock="bottom"],[data-dock="floating"]) .ui-shell:not([data-launchpad-compact="true"]) > :last-child {
          flex: 0 0 auto;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-toolbar-resizing="true"]:is([data-dock="top"],[data-dock="bottom"],[data-dock="floating"]) .ui-shell:not([data-launchpad-compact="true"]) > .ui-line {
          flex: 1 1 auto;
          min-width: 0;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-toolbar-resizing="true"]:is([data-dock="top"],[data-dock="bottom"],[data-dock="floating"]) .ui-shell:not([data-launchpad-compact="true"]) > :last-child:not(.ui-line) {
          margin-left: auto;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="top"] .ui-line,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="bottom"] .ui-line,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="floating"] .ui-line {
          display: flex;
          align-items: center;
          flex: 0 1 auto;
          width: auto;
          min-width: 0;
          max-width: var(--rail-track-x-max, 100%);
          height: 100%;
          min-height: 0;
          max-height: 100%;
          padding-top: 0;
          padding-bottom: 0;
          overflow-x: auto;
          overflow-y: hidden;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="top"] .ui-line > .ui-strip,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="bottom"] .ui-line > .ui-strip,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="floating"] .ui-line > .ui-strip {
          width: max-content;
          min-width: max-content;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"] .ui-line > .ui-strip::after {
          content: "";
          display: block;
          flex: 0 0 0;
          width: 0;
          height: 1px;
          margin-left: calc(var(--surface-line-end-spacer, 0px) - var(--surface-icon-box-gap));
          pointer-events: none;
        }
        /* rail: behavior-scroll (vertical docks) */
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] .ui-line,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] .ui-line {
          display: flex;
          justify-content: center;
          flex: 1 1 auto;
          position: relative;
          isolation: isolate;
          height: var(--rail-track-y, 100%);
          min-height: 0;
          max-height: var(--rail-track-y-max, 100%);
          width: var(--rail-pill-cross);
          min-width: var(--rail-pill-cross);
          max-width: var(--rail-pill-cross);
          padding-top: 4px;
          padding-bottom: 4px;
          padding-left: 0;
          padding-right: 0;
          box-sizing: border-box;
          scroll-padding-top: 4px;
          scroll-padding-bottom: 4px;
          overflow-x: hidden;
          overflow-y: auto;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-sticky-group],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-sticky-group] {
          overflow: visible;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="left"] [data-sticky-group] > .ui-group-body,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="rail"][data-dock="right"] [data-sticky-group] > .ui-group-body {
          overflow: visible;
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
          z-index: calc(var(--toolbar-layer-cluster) + 2);
          isolation: isolate;
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
          user-select: none;
          -webkit-user-select: none;
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
          user-select: none;
          -webkit-user-select: none;
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
      --audit-actions-width: var(--surface-box-3-width);
      --audit-source-width: var(--surface-audit-source-width);
      --audit-grid-width: calc(var(--surface-shared-panel-width) - var(--audit-edge-inset) * 2);
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
      min-height: var(--rail-pill-cross);
    }
    #audit-panel .audit-header-shell > .ui-line {
      min-width: 0;
      overflow: visible;
    }
    #audit-panel .audit-header-main {
      width: 100%;
      min-width: 0;
      overflow: visible;
    }
    #audit-panel .audit-engine-group {
      flex: 0 0 auto;
      width: auto;
      min-width: 0;
      max-width: max-content;
    }
    #audit-panel .audit-engine-group > .ui-group-body {
      width: auto;
      min-width: 0;
      max-width: max-content;
    }
    #audit-panel .audit-engine-group .ui-strip {
      display: flex;
      align-items: center;
      width: auto;
      min-width: 0;
      max-width: max-content;
      overflow: visible;
    }
    #audit-panel [data-download] {
      margin-left: 0;
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
        minmax(0, 1fr)
        var(--audit-actions-width);
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
      width: calc(100% - var(--audit-word-inset));
      max-width: calc(100% - var(--audit-word-inset));
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
      transition:
        opacity .12s ease,
        color .12s ease,
        font-size var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing);
    }
    #audit-list [data-main]:hover [data-word],
    #audit-list [data-main]:focus-within [data-word],
    #audit-list [data-word]:hover,
    #audit-list [data-word]:focus-visible {
      font-size: calc(var(--audit-row-font-size) * 1.03);
    }
    #audit-list [data-audit-field="true"] {
      grid-column: 2;
      display: flex;
      align-items: center;
      width: 100%;
      min-width: 0;
      max-width: 100%;
      justify-self: stretch;
      box-sizing: border-box;
      padding-left: 0;
    }
    #audit-list .audit-field-box {
      width: 100%;
      min-width: 0;
      max-width: 100%;
    }
    #audit-list .audit-field-choice[data-audit-input="false"] {
      position: relative;
      width: 100%;
      min-width: 0;
      max-width: 100%;
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
      width: 100%;
      min-width: 0;
      max-width: 100%;
      border: 0;
      background: transparent;
      box-shadow: none;
    }
    #audit-list .audit-field-choice[data-audit-input="false"] .ui-field-control {
      display: block;
      width: 100%;
      min-width: 0;
      max-width: 100%;
      cursor: default;
    }
    #audit-list .audit-field-choice[data-audit-input="true"],
    #audit-list .audit-field-choice[data-audit-input="true"] .ui-field-control {
      width: 100%;
      min-width: 0;
      max-width: 100%;
    }
    #audit-list [data-audit-actions="true"] {
      grid-column: 3;
      display: flex;
      align-items: center;
      box-sizing: border-box;
      width: var(--audit-actions-width);
      min-width: var(--audit-actions-width);
      max-width: var(--audit-actions-width);
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
      width: 100%;
      min-width: 0;
      max-width: 100%;
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
      font-size: var(--audit-row-font-size) !important;
      font-weight: 400 !important;
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
      font-size: var(--audit-row-font-size) !important;
      font-weight: 400 !important;
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
          minmax(0, 1fr)
          var(--audit-actions-width);
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
      #audit-panel .audit-return-group {
        display: none;
      }
    }
    @media (max-width: 360px) {
      #audit-list .audit-line {
        grid-template-columns:
          minmax(var(--audit-word-min-width), 1fr)
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
    .panel[data-ui-surface="toolbar"] [data-ui-cluster-row] {
      box-sizing: border-box;
      display: grid;
      align-items: center;
      width: 100%;
      min-width: 0;
      column-gap: var(--rail-gap);
    }
    .panel[data-ui-surface="toolbar"] [data-ui-cluster-row="spread"] {
      grid-template-columns:
        max-content
        minmax(var(--ui-cluster-row-fill-min, max-content), 1fr)
        max-content;
    }
    .panel[data-ui-surface="toolbar"] [data-ui-cluster-row="toolbar"] {
      grid-template-columns:
        max-content
        max-content
        minmax(max-content, 1fr)
        max-content
        max-content;
    }
    .panel[data-ui-surface="toolbar"] [data-ui-cluster-row][data-ui-cluster-wrapped="true"] {
      grid-template-columns: repeat(4, max-content);
      grid-template-rows: auto auto;
      justify-content: space-between;
      row-gap: var(--rail-gap);
    }
    .panel[data-ui-surface="toolbar"] [data-ui-cluster-row][data-ui-cluster-wrapped="true"] > [data-ui-cluster-wrapped="true"] {
      grid-column: 1 / -1;
      grid-row: 2;
      justify-self: center;
      width: max-content;
      max-width: 100%;
    }
    .panel[data-ui-surface="toolbar"] [data-ui-responsive-header="true"] {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: var(--rail-gap);
      width: 100%;
      min-width: 0;
      max-width: 100%;
    }
    .panel[data-ui-surface="toolbar"] [data-ui-responsive-header-main="true"],
    .panel[data-ui-surface="toolbar"] [data-ui-responsive-header-navigation="true"] {
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      max-width: 100%;
    }
    .panel[data-ui-surface="toolbar"] [data-ui-responsive-header-layout="wide"] [data-ui-responsive-header-mode-slot="true"]:empty {
      display: none;
    }
    .panel[data-ui-surface="toolbar"] [data-ui-responsive-header-mode-slot="true"] {
      box-sizing: border-box;
      display: grid;
      place-items: center;
      width: 100%;
      min-width: 0;
    }
    .panel[data-ui-surface="toolbar"] [data-ui-responsive-header-mode-slot="true"] > [data-ui-cluster-slot="mode"] {
      width: 100%;
      min-width: 0;
      max-width: 100%;
    }
    .panel[data-ui-surface="toolbar"] [data-ui-cluster-row="balanced"] {
      grid-template-columns:minmax(0,1fr) var(--ui-cluster-row-center-width,11.5ch) minmax(0,1fr);
      column-gap:var(--rail-gap);
    }
    .panel[data-ui-surface="toolbar"] [data-ui-cluster-row="fixed-center-spread"] {
      grid-template-columns:max-content var(--ui-cluster-row-center-width,14ch) max-content;
      justify-content:space-between;
      column-gap:var(--rail-gap);
    }
    .panel[data-ui-surface="toolbar"] [data-ui-cluster-row="fixed-center-spread"] > :nth-child(2) {
      width:var(--ui-cluster-row-center-width,14ch);
      min-width:var(--ui-cluster-row-center-width,14ch);
      max-width:var(--ui-cluster-row-center-width,14ch);
    }
    .panel[data-ui-surface="toolbar"] [data-ui-cluster-row="balanced"] > :first-child {
      justify-self:start;
    }
    .panel[data-ui-surface="toolbar"] [data-ui-cluster-row="balanced"] > :nth-child(2) {
      width:var(--ui-cluster-row-center-width,11.5ch);
      min-width:var(--ui-cluster-row-center-width,11.5ch);
      max-width:var(--ui-cluster-row-center-width,11.5ch);
      justify-self:center;
    }
    .panel[data-ui-surface="toolbar"] [data-ui-cluster-row="balanced"] > :last-child {
      justify-self:end;
    }
    .panel[data-ui-surface="toolbar"] [data-ui-cluster-row="spread"] > [data-ui-cluster-size="content"] {
      width: max-content;
      min-width: 0;
      max-width: max-content;
    }
    .panel[data-ui-surface="toolbar"] [data-ui-cluster-row="spread"] > [data-ui-cluster-size="fill"] {
      width: 100%;
      min-width: max-content;
      max-width: none;
    }
    .panel[data-ui-surface="toolbar"] [data-ui-marker="true"],
    .panel[data-ui-surface="toolbar"] [data-ui-cluster-size="content"] {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      width: max-content;
      min-width: 0;
      max-width: max-content;
    }
    .panel[data-ui-surface="toolbar"] [data-ui-cluster-size="fill"] {
      display: flex;
      flex: 1 1 auto;
      align-items: center;
      width: auto;
      min-width: 0;
      max-width: none;
    }
    .panel[data-ui-surface="toolbar"] [data-ui-marker="true"] > .ui-group-body,
    .panel[data-ui-surface="toolbar"] [data-ui-cluster-size="content"] > .ui-group-body {
      display: inline-flex !important;
      flex-direction: row !important;
      align-items: center;
      justify-content: center;
      width: auto !important;
      min-width: 0 !important;
      max-width: none !important;
    }
    .panel[data-ui-surface="toolbar"] [data-ui-cluster-size="fill"] > .ui-group-body {
      display: flex !important;
      flex-direction: row !important;
      align-items: center;
      justify-content: center;
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
    }
    .panel[data-ui-surface="toolbar"] [data-ui-cluster-size="fill"] > .ui-group-body > :only-child {
      box-sizing: border-box;
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      flex: 1 1 auto !important;
    }
    .panel[data-ui-surface="toolbar"] [data-ui-pulse="true"] .ui-icon-content {
      animation: ui-control-pulse 760ms ease-in-out infinite;
    }
    @keyframes ui-control-pulse {
      0%, 100% { opacity: .42; transform: scale(.92); }
      50% { opacity: 1; transform: scale(1.06); }
    }
    @media (prefers-reduced-motion: reduce) {
      .panel[data-ui-surface="toolbar"] [data-ui-pulse="true"] .ui-icon-content {
        animation: none;
        opacity: .72;
      }
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
          background:${color.background}!important;
          transition:background-color 480ms linear,color 480ms linear!important
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
          overflow-wrap:anywhere!important;
          transition:background-color 480ms linear,color 480ms linear,caret-color 480ms linear!important
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
          background:transparent!important;
          transition:color 480ms linear,background-color 480ms linear,border-color 480ms linear,box-shadow 480ms linear!important
        }
        #${panel} .reader-inline-spin-visual{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          transform-origin:50% 50%;
          will-change:transform;
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
        body.reader-active[data-reader-interaction="touch-hardware"] #launchpad-panel,
        body.reader-active[data-reader-interaction="touch-virtual"] #launchpad-panel{
          display:none!important
        }
        #${panel}[data-reader-tools="true"]{
          overflow:visible!important;
          z-index:1000002!important;
          --reader-tools-column-gap:var(--surface-icon-box-gap);
          --reader-tools-cluster-inset:var(--cluster-inset-x);
          --reader-tools-side-gap:calc(var(--reader-tools-column-gap) + (var(--reader-tools-cluster-inset) * 2));
          --reader-tools-center-gap:calc(var(--surface-reader-hud-gap) * .75);
          --reader-tools-motion-duration:680ms;
          --reader-tools-motion-easing:cubic-bezier(.22,.8,.28,1);
          --reader-tools-motion-offset:18px;
          --reader-tools-motion-scale:.985;
          --reader-tools-motion-exit-scale:.985;
          --reader-tools-card-duration:360ms;
          --reader-tools-card-step:270ms;
          --reader-tools-card-fold:-180deg;
          --reader-tools-card-fold-offset:calc(var(--reader-tools-column-gap) * -1);
          --reader-tools-card-easing:cubic-bezier(.18,.78,.24,1)
        }
        #${panel}[data-reader-tools="true"] .reader-header-shell{
          display:grid!important;
          grid-template-columns:minmax(0,1fr) auto minmax(0,1fr)!important;
          align-items:center!important;
          width:100%!important;
          max-width:calc(100vw - 24px)!important;
          overflow:visible!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-shell > [data-sticky-group="left"]{
          justify-self:end!important;
          margin-right:var(--reader-tools-center-gap)!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-shell > [data-line="true"]{
          justify-self:center!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-shell > [data-sticky-group="right"]{
          justify-self:start!important;
          margin-left:var(--reader-tools-center-gap)!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-side{
          display:flex!important;
          align-items:center!important;
          gap:var(--reader-tools-side-gap)!important;
          overflow:visible!important
        }
        #${panel}[data-reader-tools="true"] .ui-shell,
        #${panel}[data-reader-tools="true"] .ui-line,
        #${panel}[data-reader-tools="true"] .ui-strip,
        #${panel}[data-reader-tools="true"] .ui-group,
        #${panel}[data-reader-tools="true"] .ui-group-body{
          overflow:visible!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-cluster{
          flex:0 0 auto!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-cluster > .ui-group-body{
          padding-left:var(--reader-tools-cluster-inset)!important;
          padding-right:var(--reader-tools-cluster-inset)!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-cluster[data-rail-group="true"]{
          background:transparent!important;
          border-color:transparent!important;
          box-shadow:none!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-marker-group > .ui-group-body{
          display:flex!important;
          align-items:center!important;
          justify-content:center!important
        }
        #${panel} [data-action="tools"] > .launchpad-marker-visual{
          display:inline-flex!important;
          align-items:center!important;
          justify-content:center!important;
          width:100%!important;
          height:100%!important;
          transform-origin:center center!important;
          will-change:transform
        }
        #${panel}[data-reader-tools="true"] .reader-tools-dropdown{
          position:relative!important;
          display:inline-flex!important;
          align-items:center!important;
          justify-content:center!important;
          flex:0 0 auto!important;
          overflow:visible!important;
          isolation:isolate!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-dropdown > [data-action="group"]{
          position:relative!important;
          z-index:2!important;
          backface-visibility:hidden!important;
          -webkit-backface-visibility:hidden!important;
          transform:translateZ(0)!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-dropdown > [data-action="group"] .ui-icon-box,
        #${panel}[data-reader-tools="true"] .reader-tools-dropdown > [data-action="group"] .toolbar-icon-box,
        #${panel}[data-reader-tools="true"] .reader-tools-dropdown > [data-action="group"] > .launchpad-scenario-icon{
          backface-visibility:hidden!important;
          -webkit-backface-visibility:hidden!important
        }
        #${panel}[data-reader-tools="true"] [data-reader-tools-popover="true"]{
          position:absolute!important;
          top:calc(100% + var(--surface-icon-box-gap) + 8px)!important;
          left:50%!important;
          right:auto!important;
          width:max-content!important;
          max-width:calc(100vw - 24px)!important;
          pointer-events:auto!important;
          z-index:calc(var(--toolbar-layer-cluster) + 3)!important;
          opacity:1!important;
          visibility:visible!important;
          transform:translateX(-50%) translateY(0) scale(1)!important;
          transform-origin:top center!important;
          transition:opacity var(--reader-tools-motion-duration) var(--reader-tools-motion-easing),transform var(--reader-tools-motion-duration) var(--reader-tools-motion-easing),visibility 0s linear 0s!important;
          will-change:transform!important
        }
        #${panel}[data-reader-tools="true"] [data-reader-tools-popover="true"][aria-hidden="true"]{
          opacity:0!important;
          visibility:hidden!important;
          transform:translateX(-50%) translateY(calc(var(--reader-tools-motion-offset) * -1)) scale(var(--reader-tools-motion-scale))!important;
          transition:opacity var(--reader-tools-motion-duration) var(--reader-tools-motion-easing),transform var(--reader-tools-motion-duration) var(--reader-tools-motion-easing),visibility 0s linear var(--reader-tools-motion-duration)!important
        }
        #${panel}[data-reader-tools="true"] [data-reader-tools-popover="true"][data-reader-tools-motion="opening"],
        #${panel}[data-reader-tools="true"] [data-reader-tools-popover="true"][data-reader-tools-motion="open"]{
          opacity:1!important;
          visibility:visible!important;
          transform:translateX(-50%) translateY(0) scale(1)!important;
          transition:none!important
        }
        #${panel}[data-reader-tools="true"] [data-reader-tools-popover="true"][data-reader-tools-motion="closing"],
        #${panel}[data-reader-tools="true"] [data-reader-tools-popover="true"][data-reader-tools-motion="closed"]{
          position:fixed!important;
          pointer-events:none!important;
          opacity:1!important;
          visibility:visible!important;
          transform:translateY(0) scale(1)!important;
          transform-origin:top center!important;
          transition:none!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-cluster[data-rail-group]:has(.reader-tools-dropdown[data-expanded="true"]){
          background:transparent!important;
          border-color:var(--reader-action-button-border)!important;
          box-shadow:none!important
        }
        #${panel}[data-reader-tools="true"] [data-reader-tools-popover="true"][aria-hidden="true"],
        #${panel}[data-reader-tools="true"] [data-reader-tools-popover="true"][aria-hidden="true"] *{
          pointer-events:none!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-popover-list{
          position:relative!important;
          display:flex!important;
          align-items:flex-start!important;
          justify-content:center!important;
          width:max-content!important;
          min-width:var(--reader-hud-button-size)!important;
          padding:0!important;
          border-radius:0!important;
          background:transparent!important;
          box-shadow:none!important;
          max-width:min(calc(100vw - 24px),320px)!important;
          max-height:calc(var(--reader-viewport-height,100vh) - 140px)!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-popover-main,
        #${panel}[data-reader-tools="true"] .reader-tools-popover-column{
          display:flex!important;
          flex-direction:column!important;
          align-items:flex-start!important;
          gap:var(--reader-tools-column-gap)!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-popover-extra{
          position:absolute!important;
          top:0!important;
          display:flex!important;
          align-items:flex-start!important;
          gap:var(--reader-tools-column-gap)!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-popover-list[data-reader-tools-side="left"] .reader-tools-popover-extra{
          left:calc(100% + var(--reader-tools-column-gap))!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-popover-list[data-reader-tools-side="right"] .reader-tools-popover-extra{
          right:calc(100% + var(--reader-tools-column-gap))!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-command-slot{
          width:auto!important;
          direction:ltr!important;
          opacity:1!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-command-slot .ui-button{
          width:var(--reader-hud-button-size)!important;
          min-width:var(--reader-hud-button-size)!important;
          min-height:var(--reader-hud-button-size)!important;
          justify-content:center!important;
          opacity:1!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-command-slot .reader-tools-command{
          position:relative!important;
          z-index:1!important;
          opacity:1!important;
          background:
            linear-gradient(var(--reader-action-button-background),var(--reader-action-button-background)),
            linear-gradient(var(--reader-action-button-background),var(--reader-action-button-background)),
            var(--reader-action-button-background)!important;
          backface-visibility:hidden!important;
          -webkit-backface-visibility:hidden!important;
          transform:translateZ(1px)!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-popover-column > .reader-tools-command-slot:not(:first-child)::before{
          content:"";
          position:absolute;
          top:0;
          left:0;
          width:var(--reader-hud-button-size);
          height:var(--reader-hud-button-size);
          box-sizing:border-box;
          z-index:0;
          border:1px solid var(--reader-action-button-border);
          border-radius:var(--reader-hud-radius);
          background:var(--reader-action-button-background);
          box-shadow:var(--reader-action-button-shadow);
          transform:rotateX(180deg) translateZ(1px);
          transform-origin:center;
          backface-visibility:hidden;
          -webkit-backface-visibility:hidden;
          pointer-events:none
        }
        #${panel}[data-reader-tools="true"] .reader-tools-command-slot .reader-tools-command .ui-icon-box{
          transform:none!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-command-slot .reader-tools-command .toolbar-icon,
        #${panel}[data-reader-tools="true"] .reader-tools-command-slot .reader-tools-command .ui-icon-content,
        #${panel}[data-reader-tools="true"] .reader-tools-command-slot .reader-tools-command svg{
          width:var(--reader-hud-icon-size)!important;
          height:var(--reader-hud-icon-size)!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-command-slot{
          --reader-tools-card-local-fold-offset:var(--reader-tools-card-fold-offset);
          position:relative!important;
          transform-origin:top center!important;
          transform-style:preserve-3d!important;
          backface-visibility:visible!important;
          -webkit-backface-visibility:visible!important;
          opacity:1!important;
          z-index:calc(1000 - var(--reader-tools-card-index))!important;
          will-change:transform!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-popover-column > .reader-tools-command-slot:first-child{
          --reader-tools-card-local-fold-offset:0px
        }
        #${panel}[data-reader-tools="true"] .reader-tools-command-slot,
        #${panel}[data-reader-tools="true"] .reader-tools-command-slot *,
        #${panel}[data-reader-tools="true"] .reader-tools-command-slot::before,
        #${panel}[data-reader-tools="true"] .reader-tools-command-slot::after{
          opacity:1!important
        }
        #${panel}[data-reader-tools="true"] [data-reader-tools-popover="true"][data-reader-tools-motion="opening"] .reader-tools-command-slot{
          opacity:0!important;
          visibility:hidden!important;
          transform:perspective(720px) translateY(var(--reader-tools-card-local-fold-offset)) rotateX(var(--reader-tools-card-fold))!important
        }
        #${panel}[data-reader-tools="true"] [data-reader-tools-popover="true"][data-reader-tools-motion="open"] .reader-tools-command-slot{
          animation:readerToolsCardOpen var(--reader-tools-card-duration) var(--reader-tools-card-easing) both!important;
          animation-delay:calc(var(--reader-tools-card-index) * var(--reader-tools-card-step))!important
        }
        #${panel}[data-reader-tools="true"] [data-reader-tools-popover="true"][data-reader-tools-motion="open"] .reader-tools-popover-column > .reader-tools-command-slot:first-child{
          animation-name:readerToolsFirstCardOpen!important
        }
        #${panel}[data-reader-tools="true"] [data-reader-tools-popover="true"][data-reader-tools-motion="closed"] .reader-tools-command-slot{
          animation:readerToolsCardClose var(--reader-tools-card-duration) var(--reader-tools-card-easing) both!important;
          animation-delay:calc(var(--reader-tools-card-reverse-index) * var(--reader-tools-card-step))!important
        }
        #${panel}[data-reader-tools="true"] [data-reader-tools-popover="true"][data-reader-tools-motion="closed"] .reader-tools-popover-column > .reader-tools-command-slot:first-child{
          animation-name:readerToolsFirstCardClose!important
        }
        #${panel}[data-reader-tools="true"] [data-action="group"][data-reader-tools-icon-motion] .ui-icon-box,
        #${panel}[data-reader-tools="true"] [data-action="group"][data-reader-tools-icon-motion] .toolbar-icon-box,
        #${panel}[data-reader-tools="true"] [data-action="group"][data-reader-tools-icon-motion] > .launchpad-scenario-icon{
          transform-origin:center!important;
          will-change:transform!important
        }
        #${panel}[data-reader-tools="true"] [data-action="group"][data-reader-tools-icon-motion="opening"] .ui-icon-box,
        #${panel}[data-reader-tools="true"] [data-action="group"][data-reader-tools-icon-motion="opening"] .toolbar-icon-box,
        #${panel}[data-reader-tools="true"] [data-action="group"][data-reader-tools-icon-motion="opening"] > .launchpad-scenario-icon{
          animation:readerToolsIconOpen 460ms cubic-bezier(.2,.7,.2,1) both!important
        }
        #${panel}[data-reader-tools="true"] [data-action="group"][data-reader-tools-icon-motion="closing"] .ui-icon-box,
        #${panel}[data-reader-tools="true"] [data-action="group"][data-reader-tools-icon-motion="closing"] .toolbar-icon-box,
        #${panel}[data-reader-tools="true"] [data-action="group"][data-reader-tools-icon-motion="closing"] > .launchpad-scenario-icon{
          animation:readerToolsIconClose 460ms cubic-bezier(.2,.7,.2,1) both!important
        }
        @keyframes readerToolsFirstCardOpen{
          0%{
            visibility:hidden;
            transform:perspective(720px) translateY(0) rotateX(var(--reader-tools-card-fold))
          }
          .01%{
            visibility:visible;
            transform:perspective(720px) translateY(0) rotateX(-89deg)
          }
          100%{
            visibility:visible;
            transform:perspective(720px) translateY(0) rotateX(0)
          }
        }
        @keyframes readerToolsFirstCardClose{
          0%{
            visibility:visible;
            transform:perspective(720px) translateY(0) rotateX(0)
          }
          99.99%{
            visibility:visible;
            transform:perspective(720px) translateY(0) rotateX(-89deg)
          }
          100%{
            visibility:hidden;
            transform:perspective(720px) translateY(0) rotateX(var(--reader-tools-card-fold))
          }
        }
        @keyframes readerToolsCardOpen{
          0%{
            visibility:hidden;
            transform:perspective(720px) translateY(var(--reader-tools-card-local-fold-offset)) rotateX(var(--reader-tools-card-fold))
          }
          .01%,100%{
            visibility:visible
          }
          100%{
            transform:perspective(720px) translateY(0) rotateX(0)
          }
        }
        @keyframes readerToolsCardClose{
          0%,99.99%{
            visibility:visible
          }
          0%{
            transform:perspective(720px) translateY(0) rotateX(0)
          }
          100%{
            visibility:hidden;
            transform:perspective(720px) translateY(var(--reader-tools-card-local-fold-offset)) rotateX(var(--reader-tools-card-fold))
          }
        }
        @keyframes readerToolsIconOpen{
          0%{transform:rotate(0) scale(1)}
          100%{transform:rotate(360deg) scale(1)}
        }
        @keyframes readerToolsIconClose{
          0%{transform:rotate(0) scale(1)}
          100%{transform:rotate(-360deg) scale(1)}
        }
        @media (prefers-reduced-motion: reduce){
          #${panel}[data-reader-tools="true"] [data-reader-tools-popover="true"],
          #${panel}[data-reader-tools="true"] [data-reader-tools-popover="true"] .reader-tools-command-slot,
          #${panel}[data-reader-tools="true"] [data-action="group"][data-reader-tools-icon-motion] .ui-icon-box,
          #${panel}[data-reader-tools="true"] [data-action="group"][data-reader-tools-icon-motion] .toolbar-icon-box,
          #${panel}[data-reader-tools="true"] [data-action="group"][data-reader-tools-icon-motion] > .launchpad-scenario-icon{
            animation:none!important;
            transition:none!important
          }
          #${panel}[data-reader-tools="true"] [data-reader-tools-popover="true"] .reader-tools-command-slot{
            opacity:1!important;
            transform:none!important
          }
        }
        @media (max-width: 768px){
          #${panel}[data-reader-tools="true"]{
            --reader-tools-side-gap:calc(var(--surface-reader-hud-phone-gap) * .55);
            --reader-tools-center-gap:calc(var(--surface-reader-hud-phone-gap) * .5)
          }
          #${panel}[data-reader-tools="true"] .reader-header-shell{
            max-width:calc(100vw - 16px)!important
          }
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
          border-radius:0!important;
          transition:background 480ms linear!important
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
          )!important;
          transition:background 480ms linear!important
        }
        #${panel} .button{
          pointer-events:auto!important
        }
        #${panel} .button[data-disabled="true"]{
          pointer-events:auto!important;
          cursor:default!important
        }
        #${hud}{
          --reader-tools-motion-duration:280ms;
          --reader-tools-motion-easing:cubic-bezier(.22,.8,.28,1);
          --reader-tools-motion-offset:28px;
          --reader-tools-motion-scale:.96;
          --reader-tools-motion-exit-scale:.96;
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
          overflow:visible!important;
          opacity:1!important;
          visibility:visible!important;
          transform:translateY(0) scale(1)!important;
          transition:opacity var(--reader-tools-motion-duration) var(--reader-tools-motion-easing),transform var(--reader-tools-motion-duration) var(--reader-tools-motion-easing),visibility 0s linear 0s!important
        }
        #${hud}{
          --reader-hud-gap:var(--surface-reader-hud-gap);
          --reader-hud-inset:var(--surface-reader-hud-inset);
          --reader-hud-button-size:var(--surface-reader-hud-button-size);
          --reader-hud-keyboard-shift:0px;
          --reader-hud-icon-size:calc(var(--reader-hud-button-size) * var(--surface-reader-hud-icon-ratio));
          --reader-hud-radius:calc(var(--reader-hud-button-size) * var(--surface-reader-hud-radius-ratio));
          --reader-action-button-text:var(--surface-reader-theme-dark-button-text);
          --reader-action-button-background:var(--surface-reader-theme-dark-button-background);
          --reader-action-button-border:var(--surface-reader-theme-dark-button-border);
          --reader-action-button-shadow:var(--surface-reader-theme-dark-button-shadow);
          --reader-action-button-hover-background:var(--surface-reader-theme-dark-button-hover-background);
          --reader-action-button-active-background:var(--surface-reader-theme-dark-button-active-background);
          --reader-action-button-active-shadow:var(--surface-reader-theme-dark-button-active-shadow);
          --reader-hud-top:calc(env(safe-area-inset-top) + var(--surface-reader-hud-top-offset))
        }
        #${panel}[data-reader-tools="true"]{
          --reader-hud-gap:var(--surface-reader-hud-gap);
          --reader-hud-inset:var(--surface-reader-hud-inset);
          --reader-hud-button-size:var(--surface-reader-hud-button-size);
          --reader-hud-icon-size:calc(var(--reader-hud-button-size) * var(--surface-reader-hud-icon-ratio));
          --reader-hud-radius:calc(var(--reader-hud-button-size) * var(--surface-reader-hud-radius-ratio));
          --reader-action-button-text:var(--surface-reader-theme-dark-button-text);
          --reader-action-button-background:var(--surface-reader-theme-dark-button-background);
          --reader-action-button-border:var(--surface-reader-theme-dark-button-border);
          --reader-action-button-shadow:var(--surface-reader-theme-dark-button-shadow);
          --reader-action-button-hover-background:var(--surface-reader-theme-dark-button-hover-background);
          --reader-action-button-active-background:var(--surface-reader-theme-dark-button-active-background);
          --reader-action-button-active-shadow:var(--surface-reader-theme-dark-button-active-shadow)
        }
        #${hud}[data-theme="light"],
        #${panel}[data-reader-tools="true"][data-theme="light"]{
          --reader-action-button-text:var(--surface-reader-theme-light-button-text);
          --reader-action-button-background:var(--surface-reader-theme-light-button-background);
          --reader-action-button-border:var(--surface-reader-theme-light-button-border);
          --reader-action-button-shadow:var(--surface-reader-theme-light-button-shadow);
          --reader-action-button-hover-background:var(--surface-reader-theme-light-button-hover-background);
          --reader-action-button-active-background:var(--surface-reader-theme-light-button-active-background);
          --reader-action-button-active-shadow:var(--surface-reader-theme-light-button-active-shadow)
        }
        #${hud}:not([data-interaction="touch-virtual"]),
        #${hud}[data-visible="false"]{
          opacity:0!important;
          visibility:visible!important;
          transform:translateY(var(--reader-tools-motion-offset)) scale(var(--reader-tools-motion-exit-scale))!important;
          animation:readerHudExit var(--reader-tools-motion-duration) var(--reader-tools-motion-easing) both!important;
          transition:none!important
        }
        #${hud}[data-interaction="touch-virtual"][data-visible="true"]{
          --reader-hud-keyboard-shift:0px;
          animation:readerHudEnter var(--reader-tools-motion-duration) var(--reader-tools-motion-easing) both!important
        }
        @keyframes readerHudEnter{
          0%{
            opacity:0;
            transform:translateY(calc(var(--reader-tools-motion-offset) * -1)) scale(var(--reader-tools-motion-scale))
          }
          70%{
            opacity:1;
            transform:translateY(2px) scale(1.01)
          }
          100%{
            opacity:1;
            transform:translateY(0) scale(1)
          }
        }
        @keyframes readerHudExit{
          0%{
            opacity:1;
            transform:translateY(0) scale(1)
          }
          100%{
            opacity:0;
            transform:translateY(var(--reader-tools-motion-offset)) scale(var(--reader-tools-motion-exit-scale))
          }
        }
        #${hud} .reader-hud-zone{
          position:absolute!important;
          display:flex!important;
          align-items:center!important;
          gap:var(--reader-hud-gap)!important;
          pointer-events:none!important;
          perspective:760px!important
        }
        #${hud} .reader-hud-zone[data-reader-hud-zone="left-x"]{
          left:var(--reader-hud-inset)!important;
          bottom:calc(env(safe-area-inset-bottom) + var(--reader-hud-bottom-gap,20px) - var(--reader-hud-keyboard-shift,0px))!important
        }
        #${hud} .reader-hud-zone[data-reader-hud-zone="left-y"]{
          left:calc(var(--reader-hud-inset) + (var(--reader-hud-button-size) * 2) + (var(--reader-hud-gap) * 2))!important;
          bottom:calc(env(safe-area-inset-bottom) + var(--reader-hud-bottom-gap,20px) - var(--reader-hud-keyboard-shift,0px))!important
        }
        #${hud} .reader-hud-zone[data-reader-hud-zone="center-x"]{
          left:50%!important;
          bottom:calc(env(safe-area-inset-bottom) + var(--reader-hud-bottom-gap,20px) - var(--reader-hud-keyboard-shift,0px))!important;
          transform:translateX(-50%)!important
        }
        #${hud} .reader-hud-zone[data-reader-hud-zone="right-y"]{
          right:calc(var(--reader-hud-inset) + (var(--reader-hud-button-size) * 2) + (var(--reader-hud-gap) * 2))!important;
          bottom:calc(env(safe-area-inset-bottom) + var(--reader-hud-bottom-gap,20px) - var(--reader-hud-keyboard-shift,0px))!important
        }
        #${hud} .reader-hud-zone[data-reader-hud-zone="right-x"]{
          right:var(--reader-hud-inset)!important;
          bottom:calc(env(safe-area-inset-bottom) + var(--reader-hud-bottom-gap,20px) - var(--reader-hud-keyboard-shift,0px))!important
        }
        #${hud} .reader-hud-zone[data-reader-hud-zone="top-right"]{
          right:var(--reader-hud-inset)!important;
          top:var(--reader-hud-top)!important
        }
        @media (max-width: 700px) {
          #${hud}[data-reader-mode="phone"]{
            --reader-hud-gap:var(--surface-reader-hud-phone-gap);
            --reader-hud-inset:var(--surface-reader-hud-phone-inset);
            --reader-hud-button-size:var(--surface-reader-hud-phone-button-size)
          }
          #${panel}[data-reader-mode="phone"][data-reader-tools="true"]{
            --reader-hud-gap:var(--surface-reader-hud-phone-gap);
            --reader-hud-inset:var(--surface-reader-hud-phone-inset);
            --reader-hud-button-size:var(--surface-reader-hud-phone-button-size)
          }
          #${hud}[data-reader-mode="phone"] .reader-hud-zone[data-reader-hud-zone="left-y"]{
            left:var(--reader-hud-inset)!important;
            bottom:calc(env(safe-area-inset-bottom) + var(--reader-hud-bottom-gap,20px) + var(--reader-hud-button-size) + var(--reader-hud-gap) - var(--reader-hud-keyboard-shift,0px))!important;
            flex-direction:column!important;
            align-items:flex-start!important
          }
          #${hud}[data-reader-mode="phone"] .reader-hud-zone[data-reader-hud-zone="right-y"]{
            right:var(--reader-hud-inset)!important;
            bottom:calc(env(safe-area-inset-bottom) + var(--reader-hud-bottom-gap,20px) + var(--reader-hud-button-size) + var(--reader-hud-gap) - var(--reader-hud-keyboard-shift,0px))!important;
            flex-direction:column!important;
            align-items:flex-end!important
          }
        }
        #${hud} .reader-hud-zone:empty{
          display:none!important
        }
        #${hud} .reader-hud-button{
          perspective:700px!important
        }
        #${hud} .reader-hud-button[data-reader-hud-mode="true"] .reader-hud-mode-glyph{
          display:inline-flex!important;
          align-items:center!important;
          justify-content:center!important;
          width:100%!important;
          height:100%!important;
        }
        #${hud} .reader-hud-button .reader-hud-flip-shell{
          position:relative!important;
          display:block!important;
          width:100%!important;
          height:100%!important;
          transform-style:preserve-3d!important;
          transform-origin:center center!important;
          will-change:transform,filter!important
        }
        #${hud} .reader-hud-button .reader-hud-flip-face{
          position:absolute!important;
          inset:0!important;
          display:flex!important;
          align-items:center!important;
          justify-content:center!important;
          overflow:hidden!important;
          border:0!important;
          border-radius:var(--reader-hud-radius)!important;
          background:transparent!important;
          color:var(--reader-action-button-text)!important;
          box-shadow:none!important;
          backdrop-filter:none!important;
          -webkit-backdrop-filter:none!important;
          transform:translateZ(.1px)!important
        }
        #${hud} .reader-hud-mode-glyph[data-reader-hud-mirrored="true"]{
          transform:scaleX(-1)!important
        }
        #${hud} .reader-hud-button,
        #${panel}[data-reader-tools="true"] .reader-tools-command.reader-hud-button{
          pointer-events:auto!important;
          min-width:var(--reader-hud-button-size)!important;
          min-height:var(--reader-hud-button-size)!important;
          width:var(--reader-hud-button-size)!important;
          max-width:var(--reader-hud-button-size)!important;
          height:var(--reader-hud-button-size)!important;
          max-height:var(--reader-hud-button-size)!important;
          padding:0!important;
          border:1px solid var(--reader-action-button-border)!important;
          border-radius:var(--reader-hud-radius)!important;
          background:var(--reader-action-button-background)!important;
          color:var(--reader-action-button-text)!important;
          opacity:.96!important;
          backdrop-filter:var(--surface-toolbar-glass-backdrop)!important;
          -webkit-backdrop-filter:var(--surface-toolbar-glass-backdrop)!important;
          box-shadow:var(--reader-action-button-shadow)!important
        }
        #${panel}[data-reader-tools="true"] .reader-tools-command.reader-hud-button{
          opacity:1!important
        }
        #${hud} .reader-hud-button{
          overflow:visible!important;
          transform-style:preserve-3d!important;
          perspective:none!important
        }
        #${hud} .reader-hud-button:hover:not([data-active="true"]),
        #${panel}[data-reader-tools="true"] .reader-tools-command.reader-hud-button:hover:not([data-active="true"]),
        #${hud} .reader-hud-button:focus-visible:not([data-active="true"]),
        #${panel}[data-reader-tools="true"] .reader-tools-command.reader-hud-button:focus-visible:not([data-active="true"]),
        #${hud} .reader-hud-button:active,
        #${panel}[data-reader-tools="true"] .reader-tools-command.reader-hud-button:active{
          background:var(--reader-action-button-hover-background)!important;
          border-color:var(--reader-action-button-border)!important;
          box-shadow:var(--reader-action-button-shadow)!important
        }
        #${hud} .reader-hud-button[data-active="true"],
        #${panel}[data-reader-tools="true"] .reader-tools-command.reader-hud-button[data-active="true"]{
          background:var(--reader-action-button-active-background)!important;
          box-shadow:var(--reader-action-button-active-shadow),inset 0 0 0 1px var(--reader-action-button-border)!important
        }
        #${hud} .reader-hud-button[data-reader-hud-flipping="true"]{
          border-color:transparent!important;
          background:transparent!important;
          box-shadow:none!important;
          backdrop-filter:none!important;
          -webkit-backdrop-filter:none!important;
          transform-style:preserve-3d!important;
          transform-origin:center center!important;
          will-change:transform,filter!important;
          transition:none!important
        }
        #${hud} .reader-hud-button[data-reader-hud-flip-visible="true"],
        #${hud} .reader-hud-button[data-reader-hud-flip-done="true"]{
          border-color:var(--reader-action-button-border)!important;
          background:var(--reader-action-button-background)!important;
          box-shadow:var(--reader-action-button-shadow)!important;
          backdrop-filter:var(--surface-toolbar-glass-backdrop)!important;
          -webkit-backdrop-filter:var(--surface-toolbar-glass-backdrop)!important;
          transition:none!important
        }
        #${hud} .reader-hud-button[data-reader-hud-flip-visible="true"][data-active="true"],
        #${hud} .reader-hud-button[data-reader-hud-flip-done="true"][data-active="true"]{
          background:var(--reader-action-button-active-background)!important;
          box-shadow:var(--reader-action-button-active-shadow),inset 0 0 0 1px var(--reader-action-button-border)!important
        }
        #${hud} .reader-hud-button[data-reader-hud-flip-ready="true"] .reader-hud-flip-face,
        #${hud} .reader-hud-button[data-reader-hud-flipping="true"] .reader-hud-flip-face{
          opacity:1!important;
          background:var(--reader-action-button-background)!important;
          box-shadow:var(--reader-action-button-shadow),inset 0 0 0 1px var(--reader-action-button-border)!important;
          backdrop-filter:var(--surface-toolbar-glass-backdrop)!important;
          -webkit-backdrop-filter:var(--surface-toolbar-glass-backdrop)!important;
          transition:none!important
        }
        #${hud} .reader-hud-button[data-reader-hud-flip-visible="true"] .reader-hud-flip-face,
        #${hud} .reader-hud-button[data-reader-hud-flip-done="true"] .reader-hud-flip-face{
          background:transparent!important;
          box-shadow:none!important;
          backdrop-filter:none!important;
          -webkit-backdrop-filter:none!important
        }
        #${hud} .reader-hud-button[data-reader-hud-flip-ready="true"]:active .reader-hud-flip-face,
        #${hud} .reader-hud-button[data-reader-hud-flipping="true"]:active .reader-hud-flip-face{
          background:var(--reader-action-button-hover-background)!important
        }
        #${hud} .reader-hud-button[data-reader-hud-flip-ready="true"][data-active="true"] .reader-hud-flip-face,
        #${hud} .reader-hud-button[data-reader-hud-flipping="true"][data-active="true"] .reader-hud-flip-face{
          background:var(--reader-action-button-active-background)!important;
          box-shadow:var(--reader-action-button-active-shadow),inset 0 0 0 1px var(--reader-action-button-border)!important
        }
        #${hud} .reader-hud-button .ui-icon-box,
        #${hud} .reader-hud-button .ui-icon-content,
        #${panel}[data-reader-tools="true"] .reader-tools-command.reader-hud-button .ui-icon-box{
          width:100%!important;
          height:100%!important
        }
        #${hud} .reader-hud-button .ui-icon-content{
          display:flex!important;
          align-items:center!important;
          justify-content:center!important
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
        --surface-popover-action-box-size: calc(var(--surface-popover-action-size) + 4px);
        appearance:none;
        -webkit-appearance:none;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        width:var(--surface-popover-action-box-size);
        height:var(--surface-popover-action-box-size);
        min-width:var(--surface-popover-action-box-size);
        min-height:var(--surface-popover-action-box-size);
        margin:0;
        padding:0;
        background:transparent!important;
        border:0!important;
        border-radius:0!important;
        box-shadow:none!important;
        color:currentColor;
        cursor:pointer;
        opacity:var(--surface-popover-action-active-opacity);
        line-height:1;
        overflow:visible;
      }
      ${selector} .launchpad-popover-action:hover,
      ${selector} .launchpad-popover-action:focus-visible{
        background:transparent!important;
        border:0!important;
        box-shadow:none!important;
        opacity:var(--surface-popover-action-active-opacity);
      }
      ${selector} .launchpad-popover-action .ui-glyph,
      ${selector} .launchpad-popover-action .toolbar-icon,
      ${selector} .launchpad-popover-action .ui-icon-content,
      ${selector} .launchpad-popover-action svg{
        display:block;
        width:var(--surface-popover-action-size)!important;
        height:var(--surface-popover-action-size)!important;
        min-width:var(--surface-popover-action-size)!important;
        min-height:var(--surface-popover-action-size)!important;
        flex-basis:var(--surface-popover-action-size);
        line-height:1;
        filter:var(--surface-glyph-filter-active);
        transform:none;
        transition:width 0.16s cubic-bezier(.22,.8,.28,1), height 0.16s cubic-bezier(.22,.8,.28,1), min-width 0.16s cubic-bezier(.22,.8,.28,1), min-height 0.16s cubic-bezier(.22,.8,.28,1);
      }
      ${selector} .launchpad-popover-action:hover .ui-glyph,
      ${selector} .launchpad-popover-action:hover .toolbar-icon,
      ${selector} .launchpad-popover-action:hover .ui-icon-content,
      ${selector} .launchpad-popover-action:hover svg,
      ${selector} .launchpad-popover-action:focus-visible .ui-glyph,
      ${selector} .launchpad-popover-action:focus-visible .toolbar-icon,
      ${selector} .launchpad-popover-action:focus-visible .ui-icon-content,
      ${selector} .launchpad-popover-action:focus-visible svg{
        width:calc(var(--surface-popover-action-size) * var(--surface-active-scale) + 1px)!important;
        height:calc(var(--surface-popover-action-size) * var(--surface-active-scale) + 1px)!important;
        min-width:calc(var(--surface-popover-action-size) * var(--surface-active-scale) + 1px)!important;
        min-height:calc(var(--surface-popover-action-size) * var(--surface-active-scale) + 1px)!important;
        flex-basis:calc(var(--surface-popover-action-size) * var(--surface-active-scale) + 1px);
      }
      .launchpad-popover-action:hover .ui-glyph,
      .launchpad-popover-action:hover .toolbar-icon,
      .launchpad-popover-action:hover .ui-icon-content,
      .launchpad-popover-action:hover svg,
      .launchpad-popover-action:focus-visible .ui-glyph,
      .launchpad-popover-action:focus-visible .toolbar-icon,
      .launchpad-popover-action:focus-visible .ui-icon-content,
      .launchpad-popover-action:focus-visible svg{
        width:calc(var(--surface-popover-action-size) * var(--surface-active-scale) + 1px)!important;
        height:calc(var(--surface-popover-action-size) * var(--surface-active-scale) + 1px)!important;
        min-width:calc(var(--surface-popover-action-size) * var(--surface-active-scale) + 1px)!important;
        min-height:calc(var(--surface-popover-action-size) * var(--surface-active-scale) + 1px)!important;
        flex-basis:calc(var(--surface-popover-action-size) * var(--surface-active-scale) + 1px);
      }
      ${selector} .launchpad-popover-action:active .ui-glyph,
      ${selector} .launchpad-popover-action:active .toolbar-icon,
      ${selector} .launchpad-popover-action:active .ui-icon-content,
      ${selector} .launchpad-popover-action:active svg{
        width:var(--surface-popover-action-size)!important;
        height:var(--surface-popover-action-size)!important;
        min-width:var(--surface-popover-action-size)!important;
        min-height:var(--surface-popover-action-size)!important;
        flex-basis:var(--surface-popover-action-size);
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
        --counter-min-width:min(var(--ui-head-flex-min, 100%), 100%);
        --counter-track-background:var(--surface-counter-track-background);
        --counter-fill-background:var(--surface-counter-fill-background);
        --counter-over-border:var(--surface-warning-border);
        --counter-warning-stripe-background:var(--surface-warning-stripe-background);
        --counter-overflow-background:var(--counter-warning-stripe-background);
        --counter-text-color:var(--admin-counter-text,currentColor);
        --counter-text-size:calc(var(--admin-font-size) - 2px);
        cursor:pointer!important;
        width:auto;
        min-width:var(--counter-min-width);
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
        --admin-head-min-height:40px;
        --admin-apply-slot-width:calc(var(--surface-button-size) + 12px);
        --admin-field-min-height:42px;
        --admin-field-line-height:24px;
        --admin-title-field-min-height:38px;
        --admin-title-field-min-height-touch:68px;
        --admin-title-field-max-height-touch:96px;
        --admin-slug-field-min-height:42px;
        --admin-excerpt-field-min-height:104px;
        --admin-excerpt-field-min-height-tight:80px;
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
        min-height:var(--admin-head-min-height);
        align-items:center;
        cursor:grab;
      }
      .panel[data-admin-stack][data-panel-dragging="true"] [data-admin-stack-head="true"]{
        cursor:grabbing;
      }
      .panel[data-admin-stack] [data-admin-stack-head="true"]:not([data-pack="spread"]) > [data-line="true"]{
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
        position:relative;
        width:100%;
        max-width:100%;
        min-width:0;
      }
      .panel[data-admin-stack] [data-admin-stack-head="true"]:not([data-pack="spread"]) .admin-stack-main{
        display:flex;
        align-items:center;
        justify-content:center;
        gap:var(--rail-gap);
      }
      .panel[data-admin-stack] .admin-fields-apply-slot{
        flex:0 0 auto;
        display:flex;
        align-items:center;
        justify-content:center;
        min-width:var(--admin-apply-slot-width);
        min-height:var(--surface-button-size);
        max-width:max-content;
      }
      .panel[data-admin-stack] .admin-fields-apply-slot:empty{
        visibility:hidden;
        position:absolute;
        right:0;
        top:50%;
        transform:translateY(-50%);
        pointer-events:none;
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
      .panel[data-admin-stack] .admin-fields-apply-group .ui-button[data-apply-state="applied"]:hover .toolbar-icon,
      .panel[data-admin-stack] .admin-fields-apply-group .ui-button[data-apply-state="applied"]:focus-visible .toolbar-icon,
      .panel[data-admin-stack] .admin-fields-apply-group .ui-button[data-apply-state="applied"]:active .toolbar-icon{
        width:var(--surface-toolbar-icon-size)!important;
        height:var(--surface-toolbar-icon-size)!important;
        min-width:var(--surface-toolbar-icon-size)!important;
        min-height:var(--surface-toolbar-icon-size)!important;
        flex-basis:var(--surface-toolbar-icon-size)!important;
      }
      .panel[data-admin-stack] .admin-fields-apply-group .ui-button[data-apply-state="applied"]:hover .toolbar-icon-box,
      .panel[data-admin-stack] .admin-fields-apply-group .ui-button[data-apply-state="applied"]:hover .ui-icon-box,
      .panel[data-admin-stack] .admin-fields-apply-group .ui-button[data-apply-state="applied"]:focus-visible .toolbar-icon-box,
      .panel[data-admin-stack] .admin-fields-apply-group .ui-button[data-apply-state="applied"]:focus-visible .ui-icon-box,
      .panel[data-admin-stack] .admin-fields-apply-group .ui-button[data-apply-state="applied"]:active .toolbar-icon-box,
      .panel[data-admin-stack] .admin-fields-apply-group .ui-button[data-apply-state="applied"]:active .ui-icon-box{
        animation:none!important;
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
        width:auto!important;
        min-width:min(190px,100%)!important;
        max-width:100%;
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
        width:calc(var(--surface-toolbar-icon-size) * 1.06)!important;
        height:calc(var(--surface-toolbar-icon-size) * 1.06)!important;
        min-width:calc(var(--surface-toolbar-icon-size) * 1.06)!important;
        min-height:calc(var(--surface-toolbar-icon-size) * 1.06)!important;
        flex-basis:calc(var(--surface-toolbar-icon-size) * 1.06);
      }
      .panel[data-admin-stack] .admin-fields-input{
        display:block;
        width:100%;
        min-height:var(--admin-field-min-height);
        max-width:100%;
        box-sizing:border-box;
        border:0;
        border-radius:13px;
        padding:10px var(--admin-field-pad-x);
        background:transparent;
        color:inherit;
        font:400 var(--admin-font-size)/var(--admin-field-line-height) var(--panel-font-family);
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
      .panel[data-admin-stack] .admin-fields-input--title{
        min-height:var(--admin-title-field-min-height);
        padding-top:8px;
        padding-bottom:8px;
        resize:none;
        line-height:var(--admin-field-line-height);
        overflow-x:hidden;
        overflow-y:hidden;
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
      .panel[data-admin-stack] [data-admin-stack-body][data-mode="slug"] .ui-field-control:focus-within,
      .panel[data-admin-stack] [data-admin-stack-body][data-mode="excerpt"] .ui-field-control:focus-within{
        border-color:transparent;
        box-shadow:none;
        outline:0;
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
        --admin-slug-agent-size:32px;
        --admin-slug-agent-inset:6px;
        --admin-slug-text-gap:6px;
        --admin-slug-inline-width:calc(var(--admin-slug-inline-size) * 2 + var(--admin-slug-inline-gap));
      }
      .panel[data-admin-stack] .admin-fields-input--slug{
        min-height:var(--admin-slug-field-min-height);
        max-height:var(--admin-slug-field-min-height);
      }
      .panel[data-admin-stack] .ui-field-box[data-slug-agent-button="true"] .admin-fields-input.admin-fields-input--slug{
        padding-left:calc(var(--admin-field-pad-x) + 42px)!important;
      }
      .panel[data-admin-stack] .ui-field-box[data-slug-agent-button="true"] .admin-slug-agent-trigger[data-text="true"] ~ .admin-fields-input.admin-fields-input--slug{
        padding-left:calc(var(--admin-field-pad-x) + 146px)!important;
      }
      .panel[data-admin-stack] .ui-field-box[data-field-corner="true"] .admin-fields-input.admin-fields-input--slug{
        padding-right:calc(var(--admin-field-pad-x) + var(--admin-slug-inline-inset) + var(--admin-slug-inline-width) + var(--admin-slug-text-gap))!important;
      }
      .panel[data-admin-stack] .admin-slug-agent-trigger{
        appearance:none;
        -webkit-appearance:none;
        position:absolute;
        left:var(--admin-slug-agent-inset);
        top:5px;
        z-index:14;
        display:inline-flex;
        align-items:center;
        justify-content:flex-start;
        gap:8px;
        width:auto;
        min-width:var(--admin-slug-agent-size);
        max-width:none;
        height:var(--admin-slug-agent-size);
        min-height:var(--admin-slug-agent-size);
        max-height:var(--admin-slug-agent-size);
        margin:0;
        padding:0 6px 0 0;
        border:0!important;
        border-radius:10px;
        background:transparent!important;
        box-shadow:none!important;
        transform:none;
        cursor:pointer;
        outline:none!important;
      }
      .panel[data-admin-stack] .admin-slug-agent-trigger .toolbar-icon-box{
        transform:translateZ(0) scale(1);
        transition:transform .16s ease;
      }
      .panel[data-admin-stack] .admin-slug-agent-trigger .toolbar-icon{
        transform:translateZ(0) scale(1);
      }
      .panel[data-admin-stack] .admin-slug-agent-trigger:hover,
      .panel[data-admin-stack] .admin-slug-agent-trigger:focus,
      .panel[data-admin-stack] .admin-slug-agent-trigger:active{
        background:transparent!important;
        box-shadow:none!important;
      }
      .panel[data-admin-stack] .admin-slug-agent-trigger:hover .toolbar-icon-box,
      .panel[data-admin-stack] .admin-slug-agent-trigger:focus-visible .toolbar-icon-box{
        transform:translateZ(0) scale(1.12);
      }
      .panel[data-admin-stack] .admin-slug-agent-trigger:active .toolbar-icon-box{
        transform:translateZ(0) scale(1.06);
      }
      .panel[data-admin-stack] .admin-slug-agent-trigger[data-busy="true"]{
        opacity:.92;
      }
      .panel[data-admin-stack] .admin-slug-agent-trigger .toolbar-icon{
        width:22px!important;
        height:22px!important;
        min-width:22px!important;
        min-height:22px!important;
        filter:var(--surface-glyph-filter)!important;
      }
      .panel[data-admin-stack][data-theme="dark"] .admin-slug-agent-trigger .toolbar-icon{
        filter:var(--surface-toolbar-glyph-filter-dark-active)!important;
      }
      .panel[data-admin-stack][data-theme="light"] .admin-slug-agent-trigger .toolbar-icon{
        filter:var(--surface-toolbar-glyph-filter-light-active)!important;
      }
      .panel[data-admin-stack] .admin-slug-agent-trigger[data-busy="true"] .toolbar-icon-box,
      .panel[data-admin-stack] .admin-slug-agent-trigger[data-busy="true"] .toolbar-icon{
        animation:admin-slug-agent-spin 1s linear infinite!important;
      }
      .panel[data-admin-stack] .admin-slug-agent-hint{
        position:absolute;
        left:calc(var(--admin-field-pad-x) + 36px);
        top:10px;
        z-index:16;
        display:inline-flex;
        align-items:flex-start;
        min-width:0;
        max-width:calc(100% - 118px);
        overflow:hidden;
        white-space:nowrap;
        text-overflow:ellipsis;
        color:color-mix(in srgb,currentColor 58%,transparent);
        font:400 var(--admin-font-size)/1.2 var(--panel-font-family);
        line-height:1.2;
        opacity:.88;
        user-select:none;
        -webkit-user-select:none;
        pointer-events:none;
      }
      .panel[data-admin-stack] .admin-slug-agent-hint[data-error="true"]{
        color:color-mix(in srgb,currentColor 72%,transparent);
      }
      .panel[data-admin-stack] .admin-fields-input--slug[readonly][data-slug-input-locked="true"]{
        color:transparent!important;
        caret-color:transparent!important;
        user-select:none!important;
        -webkit-user-select:none!important;
        pointer-events:none!important;
      }
      .panel[data-admin-stack] .admin-fields-input--slug[readonly][data-slug-input-locked="true"]::selection{
        background:transparent!important;
        color:transparent!important;
      }
      .panel[data-admin-stack] .admin-fields-apply-group .ui-button[data-apply-state="locked"]{
        opacity:.62;
        cursor:default!important;
      }
      .panel[data-admin-stack] .admin-fields-apply-group .ui-button[data-apply-state="locked"]:hover .toolbar-icon,
      .panel[data-admin-stack] .admin-fields-apply-group .ui-button[data-apply-state="locked"]:focus-visible .toolbar-icon,
      .panel[data-admin-stack] .admin-fields-apply-group .ui-button[data-apply-state="locked"]:active .toolbar-icon{
        transform:none!important;
        animation:none!important;
      }
      @keyframes admin-slug-agent-spin{
        from{transform:rotate(0deg);}
        to{transform:rotate(360deg);}
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
        min-height:var(--admin-excerpt-field-min-height);
        resize:none;
        line-height:var(--admin-field-line-height);
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
        width:auto!important;
        min-width:min(190px,100%)!important;
        max-width:100%;
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
        width:auto!important;
        min-width:min(180px,100%)!important;
        max-width:100%;
      }

      .panel[data-admin-stack][data-head-mode="compact"] .admin-fields-head{
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
      .panel[data-admin-stack][data-head-mode="compact"] .admin-fields-head > :first-child{
        grid-area:admin-head-left;
        justify-self:start;
      }
      .panel[data-admin-stack][data-head-mode="compact"] .admin-fields-head > [data-line="true"]{
        display:contents;
      }
      .panel[data-admin-stack][data-head-mode="compact"] .admin-fields-head > :last-child{
        grid-area:admin-head-right;
        justify-self:end;
      }
      .panel[data-admin-stack][data-head-mode="compact"] .admin-stack-main{
        display:contents;
      }
      .panel[data-admin-stack][data-head-mode="compact"] .admin-stack-main .admin-stack-counter{
        grid-area:admin-head-main;
        justify-self:stretch;
      }
      .panel[data-admin-stack][data-head-mode="compact"] .admin-stack-main .admin-fields-apply-slot{
        grid-area:admin-head-apply;
        justify-self:center;
      }
      .panel[data-admin-stack][data-head-mode="compact"] .admin-stack-main .admin-fields-apply-group{
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
        min-height:var(--admin-excerpt-field-min-height-tight);
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
  media: {
    uploadParent() {
      return `
        body.media-upload-flow-open #TB_overlay{display:none!important;opacity:0!important;pointer-events:none!important;}
        body.media-upload-flow-open #TB_window.media-upload-flow-hidden-engine{position:fixed!important;left:-10000px!important;top:-10000px!important;width:1px!important;height:1px!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important;}
        body.media-upload-flow-open #TB_window.media-upload-flow-hidden-engine iframe{width:1px!important;height:1px!important;}
        #media-upload-flow-control{
          --surface-toolbar-media-size:calc(var(--surface-button-size) * 0.88);
          --surface-emoji-icon-size:var(--surface-toolbar-media-size);
          --surface-toolbar-icon-size:var(--surface-toolbar-media-size);
          --surface-toolbar-logo-size:var(--surface-toolbar-media-size);
          position:fixed!important;
          z-index:2147483647!important;
          width:max-content!important;
          max-width:calc(100vw - 24px)!important;
          cursor:grab!important;
          pointer-events:auto!important;
        }
        #media-upload-flow-control,#media-upload-flow-control *{box-sizing:border-box!important;}
        #media-upload-flow-control .toolbar-icon{width:24px!important;height:24px!important;}
        #media-upload-flow-control .ui-icon-content img.toolbar-icon{display:block!important;}
        #media-upload-flow-control .media-upload-flow-marker .emoji,#media-upload-flow-control .media-upload-flow-marker img.emoji{width:24px!important;height:24px!important;font-size:24px!important;}
        #media-upload-flow-control .media-upload-flow-actions{align-items:center!important;}
        #media-upload-flow-control .media-upload-flow-status{display:inline-flex!important;align-items:center!important;max-width:180px!important;min-width:112px!important;padding:0 8px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font:500 12px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif!important;opacity:.78!important;}
        #media-upload-flow-control[data-media-upload-phase="uploading"] .media-upload-flow-status,#media-upload-flow-control[data-media-upload-phase="inserting"] .media-upload-flow-status,#media-upload-flow-control[data-media-upload-phase="failed"] .media-upload-flow-status{opacity:1!important;}
        #media-upload-flow-control[data-media-upload-phase="uploading"] [data-media-upload-choose],#media-upload-flow-control[data-media-upload-phase="inserting"] [data-media-upload-choose]{pointer-events:none!important;opacity:.5!important;}
      `;
    },
    uploadFrame() {
      return `
        html,body{background:transparent!important;margin:0!important;min-height:0!important;overflow:hidden!important;}
        body > *{position:absolute!important;left:-10000px!important;top:0!important;width:1px!important;height:1px!important;max-width:1px!important;max-height:1px!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important;}
        #plupload-upload-ui,#html-upload-ui,#media-items,#file-form,#image-form{display:block!important;}
      `;
    },
    thumb(id = "media-thumb-flow-control") {
      return `
        #${id}{
          --surface-toolbar-ribbon-exit-duration:320ms;
          --surface-toolbar-ribbon-enter-duration:420ms;
          --surface-toolbar-ribbon-blur:1.25px;
          --surface-toolbar-ribbon-distance:1.15em;
          --thumb-panel-width:min(var(--surface-shared-panel-width),var(--surface-shared-panel-max-width));
          --thumb-gap:var(--surface-stack-gap,8px);
          --thumb-results-min:86px;
          --thumb-results-max-height:min(50vh,360px);
          --thumb-stage-height:min(42vh,320px);
          --thumb-stage-max-height:var(--thumb-stage-height);
          --thumb-card-radius:var(--surface-shared-panel-radius,var(--panel-radius));
          --thumb-image-radius:var(--control-radius);
          --thumb-tool-height:var(--rail-pill-cross,var(--surface-toolbar-icon-box-size,var(--surface-button-size)));
          --thumb-tool-pad-x:var(--surface-toolbar-button-padding-x);
          --thumb-surface-bg-dark:rgba(255,255,255,.12);
          --thumb-surface-bg-light:rgba(255,255,255,.74);
          --thumb-stage-bg-dark:rgba(255,255,255,.08);
          --thumb-stage-bg-light:rgba(0,0,0,.035);
          box-sizing:border-box!important;
          width:var(--thumb-panel-width)!important;
          min-width:var(--thumb-panel-width)!important;
          max-width:var(--thumb-panel-width)!important;
          inline-size:var(--thumb-panel-width)!important;
          min-inline-size:var(--thumb-panel-width)!important;
          max-inline-size:var(--thumb-panel-width)!important;
          flex:0 0 var(--thumb-panel-width)!important;
          padding:var(--surface-toolbar-pad,8px)!important;
          cursor:grab!important;
          max-height:calc(100vh - 32px)!important;
          overflow-x:hidden!important;
          overflow-y:auto!important;
          contain:inline-size!important;
        }
        #${id} > .ui-stack{gap:var(--surface-stack-gap,8px)!important;}
        #${id}[data-panel-dragging="true"]{cursor:grabbing!important;}
        #${id} button,#${id} input,#${id} textarea,#${id} select{cursor:auto!important;}
        #${id} [data-thumb-crop-stage="true"],#${id} [data-thumb-crop-gallery="true"]{cursor:default!important;}
        #${id}[data-panel-dragging="true"] [data-thumb-crop-stage="true"],#${id}[data-panel-dragging="true"] [data-thumb-crop-gallery="true"]{cursor:default!important;}
        #${id} [data-thumb-body="true"]{display:grid!important;gap:var(--thumb-gap)!important;}
        #${id} [data-thumb-head="true"]{width:100%!important;min-width:0!important;max-width:100%!important;overflow:hidden!important;}
        #${id} [data-thumb-head="true"] > .ui-shell,
        #${id} [data-thumb-head="true"] .ui-shell-main{
          box-sizing:border-box!important;
          width:100%!important;
          min-width:0!important;
          max-width:100%!important;
        }
        #${id} [data-thumb-head="true"] .ui-shell-main{flex:1 1 auto!important;}
        #${id} [data-thumb-head="true"] > .ui-shell{
          display:grid!important;
          grid-template-columns:auto minmax(0,1fr) auto!important;
          grid-template-rows:auto auto!important;
          align-items:start!important;
          column-gap:var(--rail-gap)!important;
        }
        #${id} [data-thumb-head="true"] > .ui-shell > :first-child{grid-column:1!important;grid-row:1!important;align-self:start!important;}
        #${id} [data-thumb-head="true"] > .ui-shell > .ui-shell-main{grid-column:2!important;grid-row:1 / span 2!important;align-self:start!important;}
        #${id} [data-thumb-head="true"] > .ui-shell > :last-child{grid-column:3!important;grid-row:1!important;align-self:start!important;}
        #${id} [data-thumb-head-actions="true"]{
          box-sizing:border-box!important;
          display:flex!important;
          flex-direction:column!important;
          align-items:stretch!important;
          justify-content:flex-start!important;
          gap:var(--thumb-gap)!important;
          width:100%!important;
          min-width:0!important;
          max-width:100%!important;
          padding:0!important;
        }
        #${id} [data-thumb-head-row]{
          box-sizing:border-box!important;
          width:100%!important;
          min-width:0!important;
          max-width:100%!important;
        }
        #${id}[data-thumb-gallery-browsing] [data-thumb-head-row="primary"]{
          row-gap:var(--rail-gap)!important;
        }
        #${id} [data-thumb-head-actions="true"] [data-thumb-actions]{
          box-sizing:border-box!important;
          min-width:0!important;
          height:auto!important;
          min-height:0!important;
          max-height:none!important;
          overflow:visible!important;
        }
        #${id} [data-thumb-head-actions="true"] [data-thumb-actions] > .ui-group-body{
          align-items:center!important;
          justify-content:center!important;
          min-width:0!important;
          height:auto!important;
          overflow:hidden!important;
        }
        #${id} [data-thumb-actions="gallery"] [data-action],
        #${id} [data-thumb-actions="apply"] [data-action]{
          width:var(--surface-button-size)!important;
          min-width:var(--surface-button-size)!important;
          max-width:var(--surface-button-size)!important;
          flex:0 0 var(--surface-button-size)!important;
          overflow:visible!important;
        }
        #${id} [data-thumb-actions="mode"] [data-action]{
          width:100%!important;
          min-width:0!important;
          max-width:100%!important;
        }

        #${id} [data-thumb-actions="mode"] [data-action="crop.size"] > .ui-icon-content{
          display:block!important;
          width:100%!important;
          min-width:100%!important;
          max-width:100%!important;
          flex:1 1 100%!important;
          line-height:normal!important;
          overflow:visible!important;
          text-align:center!important;
        }
        #${id} [data-thumb-actions="mode"] [data-action="crop.size"] [data-ui-ribbon-text="true"],
        #${id} [data-thumb-actions="mode"] [data-action="crop.size"] [data-ui-ribbon-text-value="true"]{
          width:100%!important;
          min-width:100%!important;
          max-width:100%!important;
          text-align:center!important;
          text-overflow:clip!important;
        }
        #${id} [data-thumb-actions="mode"] [data-action]:hover .ui-icon-content,
        #${id} [data-thumb-actions="mode"] [data-action]:focus-visible .ui-icon-content{
          font-size:var(--control-font-size)!important;
          transform:none!important;
        }
        #${id} [data-thumb-actions="mode"] [data-action] .ui-icon-content,
        #${id} [data-thumb-actions="mode"] [data-action] .media-thumb-flow-tool-label,
        #${id} [data-thumb-actions="mode"] [data-action] [data-ui-ribbon-text="true"],
        #${id} [data-thumb-actions="mode"] [data-action] [data-ui-ribbon-text-value="true"]{
          box-sizing:border-box!important;
          display:block!important;
          width:100%!important;
          min-width:0!important;
          max-width:100%!important;
          text-align:center!important;
          white-space:nowrap!important;
        }
        #${id} [data-thumb-actions="mode"] [data-action] [data-ui-ribbon-text="true"]{
          overflow:hidden!important;
        }
        #${id} [data-thumb-actions="mode"] [data-action] [data-ui-ribbon-text-value="true"]{
          overflow:visible!important;
          text-overflow:clip!important;
        }
        #${id} [data-thumb-head-actions="true"] [data-action] .toolbar-icon{
          transition:
            width var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing),
            height var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing),
            min-width var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing),
            min-height var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing),
            flex-basis var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing)!important;
        }
        #${id} [data-thumb-head-actions="true"] [data-action]:hover .toolbar-icon,
        #${id} [data-thumb-head-actions="true"] [data-action]:focus-visible .toolbar-icon{
          width:calc(var(--surface-toolbar-icon-size) * 1.14)!important;
          height:calc(var(--surface-toolbar-icon-size) * 1.14)!important;
          min-width:calc(var(--surface-toolbar-icon-size) * 1.14)!important;
          min-height:calc(var(--surface-toolbar-icon-size) * 1.14)!important;
          flex-basis:calc(var(--surface-toolbar-icon-size) * 1.14)!important;
        }
        #${id} [data-thumb-head="true"] [data-thumb-input-group="true"]{width:100%!important;min-width:0!important;max-width:100%!important;}
        #${id} [data-thumb-field="true"]{display:flex!important;gap:var(--thumb-gap)!important;align-items:center!important;justify-content:flex-start!important;min-width:0!important;max-width:100%!important;}
        #${id} [data-thumb-input-group="true"]{
          box-sizing:border-box!important;
          width:100%!important;
          min-width:0!important;
          max-width:100%!important;
          height:var(--rail-pill-cross,var(--surface-toolbar-icon-box-size,var(--surface-button-size)))!important;
          min-height:var(--rail-pill-cross,var(--surface-toolbar-icon-box-size,var(--surface-button-size)))!important;
          max-height:var(--rail-pill-cross,var(--surface-toolbar-icon-box-size,var(--surface-button-size)))!important;
          align-items:center!important;
        }
        #${id} [data-thumb-input-group="true"] > .ui-group-body{
          box-sizing:border-box!important;
          width:100%!important;
          min-width:0!important;
          max-width:100%!important;
          height:100%!important;
          align-items:center!important;
        }
        #${id} .media-thumb-flow-input{
          box-sizing:border-box!important;
          display:block!important;
          width:100%!important;
          min-width:0!important;
          height:100%!important;
          min-height:0!important;
          max-height:100%!important;
          border:0!important;
          border-radius:999px!important;
          background:transparent!important;
          color:inherit!important;
          padding:0 var(--thumb-tool-pad-x)!important;
          font:400 13px/normal system-ui,-apple-system,Segoe UI,Roboto,sans-serif!important;
          letter-spacing:0!important;
          outline:none!important;
          box-shadow:none!important;
        }
        #${id} .media-thumb-flow-input::placeholder{color:currentColor!important;opacity:.55!important;font-weight:400!important;}
        #${id} [data-thumb-actions="true"]{display:flex!important;gap:var(--thumb-gap)!important;align-items:center!important;}
        #${id} [data-thumb-results="true"]{
          display:grid!important;
          grid-template-columns:repeat(auto-fill,minmax(var(--thumb-results-min),1fr))!important;
          gap:var(--thumb-gap)!important;
          max-height:var(--thumb-results-max-height)!important;
          overflow:auto!important;
          padding:2px!important;
        }
        #${id} [data-thumb-status="true"]{
          display:flex!important;
          align-items:center!important;
          justify-content:center!important;
          gap:8px!important;
          box-sizing:border-box!important;
          min-height:86px!important;
          padding:16px!important;
          border-radius:var(--thumb-card-radius)!important;
          background:var(--thumb-surface-bg-dark)!important;
          color:inherit!important;
          font:400 13px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif!important;
          opacity:.78!important;
        }
        #${id}[data-theme="light"] [data-thumb-status="true"]{background:var(--thumb-surface-bg-light)!important;}
        #${id} [data-thumb-status-glyph="true"]{display:flex!important;align-items:center!important;justify-content:center!important;width:22px!important;height:22px!important;}
        #${id} [data-thumb-status-glyph="true"] .toolbar-icon{width:20px!important;height:20px!important;min-width:20px!important;min-height:20px!important;max-width:none!important;max-height:none!important;display:block!important;}
        #${id} [data-thumb-status="true"][data-busy="true"]{gap:0!important;min-height:156px!important;}
        #${id} [data-thumb-status="true"][data-busy="true"] [data-thumb-status-glyph="true"]{width:136px!important;height:136px!important;animation:media-thumb-flow-pulse 1.1s ease-in-out infinite!important;}
        #${id} [data-thumb-status="true"][data-busy="true"] [data-thumb-status-glyph="true"] .toolbar-icon{width:112px!important;height:112px!important;min-width:112px!important;min-height:112px!important;max-width:none!important;max-height:none!important;flex-basis:112px!important;}
        #${id} [data-thumb-body="true"][data-thumb-mode="crop"] > [data-thumb-field="true"],
        #${id} [data-thumb-body="true"][data-thumb-mode="crop"] [data-thumb-results="true"],
        #${id} [data-thumb-body="true"][data-thumb-mode="crop"] [data-thumb-status="true"]{display:none!important;}
        #${id} .media-thumb-flow-item{
          display:block!important;
          width:100%!important;
          padding:0!important;
          border:0!important;
          border-radius:var(--thumb-card-radius)!important;
          background:transparent!important;
          cursor:pointer!important;
          overflow:hidden!important;
        }
        #${id}[data-theme="light"] .media-thumb-flow-item{background:transparent!important;}
        #${id} .media-thumb-flow-item img{
          display:block!important;
          width:100%!important;
          height:100%!important;
          aspect-ratio:1.6!important;
          object-fit:cover!important;
          object-position:center!important;
          border-radius:var(--thumb-card-radius)!important;
        }
        #${id} [data-thumb-crop="true"]{
          display:grid!important;
          gap:var(--thumb-gap)!important;
          width:100%!important;
          min-width:0!important;
          max-width:100%!important;
          position:relative!important;
          overflow:visible!important;
        }
        #${id} [data-thumb-file="true"]{display:none!important;}
        #${id} [data-thumb-crop-stage="true"]{
          position:relative!important;
          box-sizing:border-box!important;
          display:grid!important;
          place-items:center!important;
          width:100%!important;
          min-width:0!important;
          max-width:100%!important;
          inline-size:100%!important;
          min-inline-size:0!important;
          max-inline-size:100%!important;
          overflow:hidden!important;
          height:var(--thumb-stage-height)!important;
          min-height:var(--thumb-stage-height)!important;
          max-height:var(--thumb-stage-height)!important;
          aspect-ratio:auto!important;
          padding:0!important;
          border:0!important;
          border-radius:0!important;
          background:transparent!important;
          touch-action:none!important;
          user-select:none!important;
          cursor:default!important;
          contain:inline-size!important;
        }

        #${id} [data-thumb-crop-viewport="true"]{
          position:relative!important;
          box-sizing:border-box!important;
          display:block!important;
          flex:0 0 auto!important;
          min-width:1px!important;
          min-height:1px!important;
          max-width:100%!important;
          max-height:100%!important;
          overflow:hidden!important;
          border:1px solid color-mix(in srgb,currentColor 24%, transparent)!important;
          border-radius:var(--thumb-card-radius)!important;
          background:var(--surface-toolbar-group-bg-dark)!important;
          cursor:pointer!important;
        }
        #${id} [data-thumb-crop-gallery="true"]{
          position:absolute!important;
          inset:0!important;
          z-index:8!important;
          box-sizing:border-box!important;
          display:grid!important;
          grid-template-columns:repeat(auto-fill,minmax(min(118px,42%),1fr))!important;
          grid-auto-rows:max-content!important;
          align-content:start!important;
          gap:var(--thumb-gap)!important;
          padding:var(--thumb-gap)!important;
          overflow-x:hidden!important;
          overflow-y:auto!important;
          scrollbar-width:none!important;
          overscroll-behavior:contain!important;
          border-radius:inherit!important;
          background:color-mix(in srgb,var(--surface-toolbar-group-bg-dark) 94%,transparent)!important;
          backdrop-filter:blur(12px)!important;
        }
        #${id} [data-thumb-crop-gallery="true"]::-webkit-scrollbar{display:none!important;}
        #${id}[data-theme="light"] [data-thumb-crop-gallery="true"]{background:color-mix(in srgb,var(--surface-toolbar-group-bg-light) 94%,transparent)!important;}
        #${id} [data-thumb-crop-gallery="true"][hidden]{display:none!important;}
        #${id} [data-thumb-crop-gallery="true"] button{
          display:block!important;
          box-sizing:border-box!important;
          width:100%!important;
          min-width:0!important;
          height:auto!important;
          aspect-ratio:var(--thumb-gallery-ratio,4/3)!important;
          margin:0!important;
          padding:0!important;
          overflow:hidden!important;
          border:0!important;
          border-radius:8px!important;
          background:transparent!important;
          cursor:pointer!important;
        }
        #${id} [data-thumb-crop-gallery="true"] img{display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;}
        #${id} [data-thumb-gallery-browser-cluster]{
          box-sizing:border-box!important;
          width:max-content!important;
          min-width:0!important;
        }
        #${id} [data-thumb-gallery-browser-cluster][hidden]{display:none!important;}
        #${id} [data-thumb-gallery-browser-cluster] button{
          color:inherit!important;
          cursor:pointer!important;
        }
        #${id} [data-thumb-gallery-browser-cluster] button[disabled]{opacity:.35!important;cursor:default!important;}
        #${id}:is([data-thumb-crop-mode="text"],[data-thumb-crop-mode="neuroslop"]) [data-thumb-crop-stage="true"],
        #${id}:is([data-thumb-crop-mode="text"],[data-thumb-crop-mode="neuroslop"]) [data-thumb-gallery-browser-cluster]{display:none!important;}
        #${id}:is([data-thumb-crop-mode="text"],[data-thumb-crop-mode="neuroslop"]) [data-thumb-mode-actions="true"]{
          --thumb-text-action-gap:calc(var(--rail-gap) * 2.5);
          --thumb-text-label-scale:1.35;
          display:grid!important;
          box-sizing:border-box!important;
          grid-template-columns:repeat(2,minmax(0,1fr))!important;
          grid-auto-rows:max-content!important;
          align-content:center!important;
          align-items:center!important;
          gap:var(--thumb-text-action-gap)!important;
          width:100%!important;
          min-width:0!important;
          height:var(--thumb-stage-height)!important;
          min-height:var(--thumb-stage-height)!important;
          padding:var(--thumb-text-action-gap)!important;
          margin:0!important;
        }
        #${id}[data-thumb-crop-mode="text"] [data-thumb-neuroslop-actions="true"],
        #${id}[data-thumb-crop-mode="neuroslop"] [data-thumb-text-actions="true"]{display:none!important;}
        #${id}:is([data-thumb-crop-mode="text"],[data-thumb-crop-mode="neuroslop"]) [data-thumb-text-action-cluster="true"]{
          --thumb-text-hover-reserve:calc(var(--ui-scaled-control-size) * (var(--surface-toolbar-icon-hover-scale) - 1) / 2);
          box-sizing:border-box!important;
          display:flex!important;
          align-items:center!important;
          justify-content:stretch!important;
          width:100%!important;
          min-width:0!important;
          max-width:100%!important;
          height:max-content!important;
          min-height:0!important;
          padding:
            calc(var(--cluster-pad-y) + var(--thumb-text-hover-reserve))
            calc(var(--cluster-pad-x) + var(--thumb-text-hover-reserve))!important;
          border-color:transparent!important;
          background:transparent!important;
          cursor:pointer!important;
        }
        #${id}:is([data-thumb-crop-mode="text"],[data-thumb-crop-mode="neuroslop"]) [data-thumb-text-action-cluster="true"][data-selected]{
          border-color:var(--surface-toolbar-group-border-dark)!important;
          background:var(--surface-toolbar-group-bg-dark)!important;
        }
        #${id}[data-theme="light"]:is([data-thumb-crop-mode="text"],[data-thumb-crop-mode="neuroslop"]) [data-thumb-text-action-cluster="true"][data-selected]{
          border-color:var(--surface-toolbar-group-border-light)!important;
          background:var(--surface-toolbar-group-bg-light)!important;
        }
        #${id}:is([data-thumb-crop-mode="text"],[data-thumb-crop-mode="neuroslop"]) [data-thumb-text-action-cluster="true"] > .ui-group-body{
          display:block!important;
          box-sizing:border-box!important;
          width:100%!important;
          min-width:0!important;
          max-width:100%!important;
          height:auto!important;
          min-height:0!important;
          padding-inline:var(--cluster-inset-x)!important;
          overflow:visible!important;
        }
        #${id}:is([data-thumb-crop-mode="text"],[data-thumb-crop-mode="neuroslop"]) [data-thumb-text-action-button="true"]{
          display:block!important;
          box-sizing:border-box!important;
          width:100%!important;
          min-width:0!important;
          max-width:100%!important;
          height:auto!important;
          min-height:0!important;
          max-height:none!important;
          padding:0!important;
          color:inherit!important;
          background:transparent!important;
          border:0!important;
          border-radius:inherit!important;
          cursor:pointer!important;
        }
        #${id}:is([data-thumb-crop-mode="text"],[data-thumb-crop-mode="neuroslop"]) [data-thumb-text-action-content="true"]{
          display:grid!important;
          grid-template-columns:var(--ui-scaled-control-size) minmax(0,1fr)!important;
          align-items:center!important;
          column-gap:calc(var(--cluster-pad-x) / 2)!important;
          width:100%!important;
          min-width:0!important;
          max-width:100%!important;
          pointer-events:none!important;
        }
        #${id}:is([data-thumb-crop-mode="text"],[data-thumb-crop-mode="neuroslop"]) [data-thumb-text-action-label="true"]{
          display:block!important;
          min-width:0!important;
          font-size:calc(var(--control-font-size) * var(--thumb-text-label-scale))!important;
          line-height:1.15!important;
          text-align:left!important;
          white-space:normal!important;
          overflow-wrap:anywhere!important;
          transition:font-size var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing)!important;
        }
        #${id}:is([data-thumb-crop-mode="text"],[data-thumb-crop-mode="neuroslop"]) [data-thumb-text-action-button="true"]:hover [data-thumb-text-action-label="true"],
        #${id}:is([data-thumb-crop-mode="text"],[data-thumb-crop-mode="neuroslop"]) [data-thumb-text-action-button="true"]:focus-visible [data-thumb-text-action-label="true"]{
          font-size:calc(var(--control-font-size) * var(--thumb-text-label-scale) * var(--surface-toolbar-text-hover-scale))!important;
        }
        #${id}:is([data-thumb-crop-mode="text"],[data-thumb-crop-mode="neuroslop"]) [data-thumb-text-action-cluster="true"] [data-action] .toolbar-icon-box,
        #${id}:is([data-thumb-crop-mode="text"],[data-thumb-crop-mode="neuroslop"]) [data-thumb-text-action-cluster="true"] [data-action] .ui-icon-box{
          animation:none!important;
          transform:translateZ(0) scale(1)!important;
          transition:transform var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing)!important;
        }
        #${id}:is([data-thumb-crop-mode="text"],[data-thumb-crop-mode="neuroslop"]) [data-thumb-text-action-cluster="true"] [data-action]:hover .toolbar-icon-box,
        #${id}:is([data-thumb-crop-mode="text"],[data-thumb-crop-mode="neuroslop"]) [data-thumb-text-action-cluster="true"] [data-action]:hover .ui-icon-box,
        #${id}:is([data-thumb-crop-mode="text"],[data-thumb-crop-mode="neuroslop"]) [data-thumb-text-action-cluster="true"] [data-action]:focus-visible .toolbar-icon-box,
        #${id}:is([data-thumb-crop-mode="text"],[data-thumb-crop-mode="neuroslop"]) [data-thumb-text-action-cluster="true"] [data-action]:focus-visible .ui-icon-box{
          animation:none!important;
          transform:translateZ(0) scale(var(--surface-toolbar-icon-hover-scale))!important;
        }
        #${id}:is([data-thumb-crop-mode="text"],[data-thumb-crop-mode="neuroslop"]) [data-thumb-text-action-cluster="true"] [data-action]:hover .toolbar-icon,
        #${id}:is([data-thumb-crop-mode="text"],[data-thumb-crop-mode="neuroslop"]) [data-thumb-text-action-cluster="true"] [data-action]:focus-visible .toolbar-icon{
          width:var(--ui-scaled-glyph-size)!important;
          height:var(--ui-scaled-glyph-size)!important;
          min-width:var(--ui-scaled-glyph-size)!important;
          min-height:var(--ui-scaled-glyph-size)!important;
          max-width:var(--ui-scaled-glyph-size)!important;
          max-height:var(--ui-scaled-glyph-size)!important;
          flex-basis:var(--ui-scaled-glyph-size)!important;
        }
        #${id}[data-thumb-crop-mode="section"] .media-thumb-flow-canvas{cursor:default!important;}
        #${id}[data-thumb-crop-mode="section"] [data-thumb-crop-stage="true"],
        #${id}[data-thumb-crop-mode="section"] [data-thumb-crop-viewport="true"]{
          overflow:hidden!important;
          overscroll-behavior:none!important;
          scrollbar-width:none!important;
        }
        #${id}[data-thumb-crop-mode="section"] [data-thumb-crop-stage="true"]::-webkit-scrollbar,
        #${id}[data-thumb-crop-mode="section"] [data-thumb-crop-viewport="true"]::-webkit-scrollbar{display:none!important;}
        #${id} [data-thumb-crop-stage="true"][data-file-dragging="true"] [data-thumb-crop-viewport="true"]{outline:2px solid currentColor!important;outline-offset:-6px!important;}
        #${id} [data-thumb-crop-stage="true"][data-has-image="true"]{border-color:transparent!important;}
        #${id}[data-theme="light"] [data-thumb-crop-viewport="true"]{background:var(--surface-toolbar-group-bg-light)!important;}
        #${id} .media-thumb-flow-canvas{
          box-sizing:border-box!important;
          display:block!important;
          width:100%!important;
          inline-size:100%!important;
          height:100%!important;
          block-size:100%!important;
          max-width:none!important;
          max-inline-size:none!important;
          max-height:none!important;
          max-block-size:none!important;
          object-fit:fill!important;
          border:0!important;
          border-radius:inherit!important;
          background:transparent!important;
          contain:layout paint!important;
          touch-action:none!important;
          cursor:pointer!important;
        }
        #${id} [data-thumb-crop-stage="true"]:not([data-has-image="true"]) .media-thumb-flow-canvas{
          border-color:transparent!important;
        }
        #${id} [data-thumb-crop-stage="true"][data-has-image="true"] .media-thumb-flow-canvas{cursor:grab!important;}
        #${id} [data-thumb-crop-stage="true"][data-invalid-frame="true"] .media-thumb-flow-canvas{
          border-color:color-mix(in srgb,#ff4d4f 72%, currentColor)!important;
          box-shadow:0 0 0 1px color-mix(in srgb,#ff4d4f 44%, transparent)!important;
        }
        #${id} [data-thumb-crop-stage="true"][data-divider-hover="true"] .media-thumb-flow-canvas{cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='white' d='M12 4a8 8 0 0 1 7.75 6H17l4 4 4-4h-3.2A10 10 0 1 0 12 22v-2a8 8 0 1 1 0-16z'/%3E%3C/svg%3E") 12 12, alias!important;}
        #${id} [data-thumb-crop-stage="true"][data-dragging="true"] .media-thumb-flow-canvas{cursor:grabbing!important;}
        #${id} [data-thumb-crop-stage="true"][data-divider-dragging="true"] .media-thumb-flow-canvas{cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='white' d='M12 4a8 8 0 0 1 7.75 6H17l4 4 4-4h-3.2A10 10 0 1 0 12 22v-2a8 8 0 1 1 0-16z'/%3E%3C/svg%3E") 12 12, alias!important;}
        #${id} .media-thumb-flow-canvas{
          filter:none!important;
        }
        #${id}[data-thumb-crop-guide-active="true"] .media-thumb-flow-canvas{
          filter:blur(10px)!important;
        }
        #${id} .media-thumb-flow-preview{
          position:absolute!important;
          z-index:1!important;
          inset:0!important;
          display:block!important;
          width:100%!important;
          height:100%!important;
          border:0!important;
          border-radius:inherit!important;
          pointer-events:none!important;
          clip-path:inset(var(--thumb-guide-top,0) var(--thumb-guide-right,0) var(--thumb-guide-bottom,0) var(--thumb-guide-left,0) round calc(var(--thumb-card-radius) - 1px))!important;
        }
        #${id} .media-thumb-flow-preview[hidden]{display:none!important;}
        #${id} [data-thumb-crop-guide="true"]{
          position:absolute!important;
          z-index:2!important;
          inset:0!important;
          pointer-events:none!important;
          overflow:visible!important;
        }
        #${id} [data-thumb-crop-guide="true"][hidden]{display:none!important;}
        #${id} [data-thumb-crop-guide-frame="true"]{
          position:absolute!important;
          box-sizing:border-box!important;
          left:var(--thumb-guide-left,0)!important;
          top:var(--thumb-guide-top,0)!important;
          width:var(--thumb-guide-width,100%)!important;
          height:var(--thumb-guide-height,100%)!important;
          border:0!important;
          border-radius:calc(var(--thumb-card-radius) - 1px)!important;
          box-shadow:0 0 0 2px #fff,0 4px 18px rgba(0,0,0,.28)!important;
          outline:0!important;
          pointer-events:none!important;
        }
        #${id} [data-thumb-crop-tools="true"]{
          display:grid!important;
          grid-template-columns:minmax(0,1fr) auto!important;
          gap:var(--thumb-gap)!important;
          align-items:center!important;
          width:100%!important;
          min-width:0!important;
          max-width:100%!important;
          overflow:visible!important;
        }
        #${id} [data-thumb-crop-left="true"]{
          display:flex!important;
          align-items:center!important;
          justify-content:flex-start!important;
          min-width:0!important;
          max-width:100%!important;
        }
        #${id} [data-thumb-crop-meta="true"]{
          min-width:0!important;
          max-width:100%!important;
          overflow:hidden!important;
          text-overflow:ellipsis!important;
          white-space:nowrap!important;
          text-align:center!important;
          justify-self:center!important;
          font:400 11px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif!important;
          opacity:.72!important;
        }
        #${id} [data-thumb-crop-meta="true"][hidden]{display:block!important;visibility:hidden!important;}
        #${id} [data-thumb-crop-actions="true"]{
          display:flex!important;
          gap:var(--thumb-gap)!important;
          align-items:center!important;
          justify-content:flex-end!important;
          min-width:0!important;
          max-width:100%!important;
        }
        #${id} [data-thumb-crop-cluster="true"]{
          display:inline-flex!important;
          flex:0 0 auto!important;
          align-items:center!important;
          width:auto!important;
          min-width:0!important;
          max-width:100%!important;
          overflow:visible!important;
        }
        #${id} [data-thumb-crop-cluster="true"] > .ui-group-body{
          display:inline-flex!important;
          flex-direction:row!important;
          align-items:center!important;
          justify-content:center!important;
          gap:0!important;
          width:auto!important;
          min-width:0!important;
          max-width:100%!important;
          overflow:visible!important;
        }
        #${id} [data-thumb-crop-preset-cluster="true"] .media-thumb-flow-crop-text,
        #${id} [data-thumb-actions="mode"] .media-thumb-flow-crop-text{
          width:100%!important;
          min-width:0!important;
          max-width:100%!important;
        }
        #${id} [data-thumb-actions="mode"] .media-thumb-flow-crop-text:hover .ui-icon-content,
        #${id} [data-thumb-actions="mode"] .media-thumb-flow-crop-text:focus-visible .ui-icon-content{
          font-size:var(--control-font-size)!important;
        }
        #${id} [data-thumb-crop-action-cluster="true"],
        #${id} [data-thumb-crop-action-cluster="true"] > .ui-group-body,
        #${id} [data-thumb-crop-action-cluster="true"] .media-thumb-flow-crop-icon{
          width:auto!important;
          min-width:0!important;
          max-width:none!important;
        }
        #${id} [data-action="crop.apply"][data-thumb-apply-inactive="true"]{
          opacity:.34!important;
          filter:grayscale(1)!important;
          cursor:default!important;
          transform:none!important;
          box-shadow:none!important;
        }

        #${id} [data-thumb-collage-controls="true"]{
          box-sizing:border-box!important;
          display:none!important;
          align-items:center!important;
          justify-content:center!important;
          gap:var(--rail-gap)!important;
          width:100%!important;
          min-width:0!important;
          padding:0!important;
        }
        #${id}[data-has-collage="true"] [data-thumb-collage-controls="true"]{display:flex!important;}
        #${id} [data-thumb-collage-controls="true"] [data-thumb-crop-collage-cluster="true"]{display:inline-flex!important;}
        #${id} .media-thumb-flow-crop-text{
          font-weight:500!important;
        }
        #${id} .media-thumb-flow-crop-text .ui-icon-content{
          display:flex!important;
          align-items:center!important;
          justify-content:center!important;
          width:100%!important;
          font-weight:400!important;
          white-space:nowrap!important;
        }
        #${id} .media-thumb-flow-crop-icon{
          flex:0 0 auto!important;
        }
        #${id} [data-thumb-actions="mode"] .media-thumb-flow-crop-text{
          flex:1 1 auto!important;
        }
        #${id} [data-thumb-actions="mode"],
        #${id} [data-thumb-actions="mode"] > .ui-group-body,
        #${id} [data-thumb-actions="mode"] .media-thumb-flow-crop-text{
          width:100%!important;
          min-width:0!important;
          max-width:none!important;
        }
        #${id} [data-thumb-actions="mode"] .media-thumb-flow-crop-text{
          display:block!important;
          padding:0 10px!important;
          overflow:hidden!important;
          line-height:var(--surface-button-size)!important;
          color:var(--surface-button-text, currentColor)!important;
          text-align:center!important;
          font-size:calc(var(--control-font-size) * 1.35)!important;
          font-weight:400!important;
        }
        #${id} [data-thumb-actions="mode"] .media-thumb-flow-crop-text [data-ui-ribbon-text="true"]{
          width:100%!important;
          height:1.2em!important;
          margin:auto!important;
          line-height:1.2!important;
          text-align:center!important;
        }
        #${id} [data-thumb-actions="mode"] .media-thumb-flow-crop-text [data-ui-ribbon-text-value="true"]{
          overflow:visible!important;
          text-overflow:clip!important;
          text-align:center!important;
        }
        #${id} [data-thumb-crop-remove]{
          position:absolute!important;
          z-index:8!important;
          top:var(--thumb-remove-top,8px)!important;
          left:var(--thumb-remove-left,8px)!important;
          width:48px!important;
          height:48px!important;
          min-width:48px!important;
          min-height:48px!important;
          max-width:48px!important;
          max-height:48px!important;
          display:none!important;
          align-items:center!important;
          justify-content:center!important;
          padding:0!important;
          border:1px solid rgba(255,255,255,.78)!important;
          border-radius:999px!important;
          background:rgba(0,0,0,.42)!important;
          color:#fff!important;
          cursor:pointer!important;
          box-shadow:none!important;
          text-shadow:0 1px 5px rgba(0,0,0,.55)!important;
        }
        #${id} [data-thumb-crop-remove]:hover,
        #${id} [data-thumb-crop-remove]:focus{
          background:transparent!important;
          box-shadow:none!important;
          outline:0!important;
        }
        #${id} [data-thumb-crop-remove="0"],
        #${id} [data-thumb-crop-remove="1"],
        #${id} [data-thumb-crop-remove="2"]{right:auto!important;}
        #${id} [data-thumb-crop-stage="true"][data-has-collage="true"] [data-thumb-crop-remove][data-thumb-remove-active="true"],
        #${id}[data-has-collage="true"] [data-thumb-crop-remove][data-thumb-remove-active="true"]{
          display:flex!important;
          visibility:visible!important;
          opacity:1!important;
          pointer-events:auto!important;
        }
        #${id} [data-thumb-crop-remove] .toolbar-icon{
          width:28px!important;
          height:28px!important;
          min-width:28px!important;
          min-height:28px!important;
          transition:width .22s cubic-bezier(.22,1,.36,1),height .22s cubic-bezier(.22,1,.36,1)!important;
        }
        #${id} [data-thumb-crop-remove]:hover .toolbar-icon{
          width:34px!important;
          height:34px!important;
        }
        #${id} [data-thumb-crop-status="true"]{
          position:absolute!important;
          inset:0!important;
          display:flex!important;
          align-items:center!important;
          justify-content:center!important;
          box-sizing:border-box!important;
          min-width:0!important;
          padding:18px!important;
          text-align:center!important;
          font:400 13px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif!important;
          opacity:.72!important;
          word-break:break-word!important;
          pointer-events:none!important;
        }
        #${id} [data-thumb-crop-status-label="true"][hidden]{display:none!important;}
        #${id} [data-thumb-crop-status-glyph="true"]{
          display:none!important;
          align-items:center!important;
          justify-content:center!important;
        }
        #${id} [data-thumb-crop-status="true"][data-thumb-crop-empty="true"]{
          opacity:.82!important;
        }
        #${id} [data-thumb-crop-status="true"][data-thumb-crop-empty="true"] [data-thumb-crop-status-glyph="true"]{
          display:flex!important;
        }
        #${id} [data-thumb-crop-status="true"][data-thumb-crop-empty="true"] [data-thumb-crop-status-glyph="true"] .toolbar-icon{
          --thumb-crop-status-glyph-size:60px;
          width:var(--thumb-crop-status-glyph-size)!important;
          height:var(--thumb-crop-status-glyph-size)!important;
          min-width:var(--thumb-crop-status-glyph-size)!important;
          min-height:var(--thumb-crop-status-glyph-size)!important;
          flex-basis:var(--thumb-crop-status-glyph-size)!important;
          transition:
            width var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing),
            height var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing),
            min-width var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing),
            min-height var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing),
            flex-basis var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing)!important;
          transform:rotate(180deg)!important;
        }
        #${id} [data-thumb-crop-stage="true"]:hover [data-thumb-crop-status="true"][data-thumb-crop-empty="true"] [data-thumb-crop-status-glyph="true"] .toolbar-icon,
        #${id} [data-thumb-crop-stage="true"]:focus-within [data-thumb-crop-status="true"][data-thumb-crop-empty="true"] [data-thumb-crop-status-glyph="true"] .toolbar-icon{
          width:calc(var(--thumb-crop-status-glyph-size) * var(--surface-toolbar-icon-hover-scale))!important;
          height:calc(var(--thumb-crop-status-glyph-size) * var(--surface-toolbar-icon-hover-scale))!important;
          min-width:calc(var(--thumb-crop-status-glyph-size) * var(--surface-toolbar-icon-hover-scale))!important;
          min-height:calc(var(--thumb-crop-status-glyph-size) * var(--surface-toolbar-icon-hover-scale))!important;
          flex-basis:calc(var(--thumb-crop-status-glyph-size) * var(--surface-toolbar-icon-hover-scale))!important;
        }
        #${id} [data-thumb-crop-work="true"]{
          position:absolute!important;
          inset:0!important;
          z-index:12!important;
          display:none!important;
          align-items:center!important;
          justify-content:center!important;
          pointer-events:none!important;
          color:#fff!important;
          text-shadow:0 2px 12px rgba(0,0,0,.72)!important;
          font-size:96px!important;
        }
        #${id} [data-thumb-crop-work="true"] .ui-wait,
        #${id} [data-thumb-crop-work="true"] .ui-wait-shell{
          position:relative!important;
          display:inline-flex!important;
          align-items:center!important;
          justify-content:center!important;
          width:1em!important;
          min-width:1em!important;
          height:1em!important;
          min-height:1em!important;
          overflow:visible!important;
          transform-style:preserve-3d!important;
        }
        #${id} [data-thumb-crop-work="true"] .ui-wait-frame{
          position:absolute!important;
          inset:0!important;
          display:inline-flex!important;
          align-items:center!important;
          justify-content:center!important;
        }
        #${id} [data-thumb-crop-work="true"] .ui-wait-glyph{
          display:block!important;
          width:1em!important;
          min-width:1em!important;
          height:1em!important;
          min-height:1em!important;
          flex-basis:1em!important;
        }
        #${id} [data-thumb-crop-stage="true"][data-working="true"] [data-thumb-crop-canvas="true"],
        #${id} [data-thumb-crop-stage="true"][data-working="true"] [data-thumb-crop-preview="true"],
        #${id} [data-thumb-crop-stage="true"][data-working="true"] [data-thumb-crop-guide="true"],
        #${id} [data-thumb-crop-stage="true"][data-working="true"] [data-thumb-crop-status="true"],
        #${id} [data-thumb-crop-stage="true"][data-working="true"] [data-thumb-crop-gallery="true"],
        #${id} [data-thumb-crop-stage="true"][data-working="true"] [data-thumb-crop-remove]{
          filter:blur(8px)!important;
          transition:filter 120ms ease!important;
        }
        #${id} [data-thumb-crop-stage="true"][data-uploading="true"] [data-thumb-crop-work="true"],
        #${id} [data-thumb-crop-stage="true"][data-working="true"] [data-thumb-crop-work="true"]{display:flex!important;}
        #${id} [data-thumb-crop-status="true"][data-dots="true"]::after{
          content:""!important;
          display:inline-block!important;
          width:1.4em!important;
          text-align:left!important;
          animation:media-thumb-flow-dots 1.05s steps(4,end) infinite!important;
        }
        #${id} [data-thumb-crop-status="true"][hidden]{display:none!important;}
        @keyframes media-thumb-flow-dots{0%{content:"";}25%{content:".";}50%{content:"..";}75%,100%{content:"...";}}
        @keyframes media-thumb-flow-pulse{0%,100%{opacity:.45;transform:scale(.94);}50%{opacity:1;transform:scale(1.06);}}
      `;
    },
  },
  content: {
    promo(id = "promo-widget-panel") {
      return `
        #${id}{
          --promo-panel-width:min(440px,var(--surface-shared-panel-width),calc(100vw - 32px));
          --promo-widget-color:#F5F5F5;
          --promo-input-min-height:128px;
          --promo-input-max-height:min(320px,42vh);
          --promo-inline-gap:8px;
          --promo-color-button-size:34px;
          width:var(--promo-panel-width)!important;
          min-width:var(--promo-panel-width)!important;
          max-width:var(--promo-panel-width)!important;
        }
        #${id}[data-panel-draggable="true"]{cursor:grab;}
        #${id}[data-panel-dragging="true"]{cursor:grabbing;}
        #${id} :is(button,input,textarea,select,a,label){cursor:auto;}
        #${id} > .ui-stack,
        #${id} [data-promo-body="true"],
        #${id} [data-promo-input-row="true"],
        #${id} [data-promo-input-row="true"] > .ui-shell,
        #${id} [data-promo-input-row="true"] .ui-shell-main,
        #${id} .promo-widget-message-wrap{
          box-sizing:border-box;
          width:100%;
          max-width:100%;
          min-width:0;
          align-self:stretch;
        }
        #${id} [data-promo-input-row="true"] > .ui-shell,
        #${id} [data-promo-input-row="true"] .ui-shell-main{display:block;}
        #${id} .promo-widget-head{
          display:grid!important;
          grid-template-columns:auto 1fr auto;
          align-items:center;
          column-gap:var(--promo-inline-gap);
        }
        #${id} .promo-widget-head > :first-child{justify-self:start;}
        #${id} .promo-widget-head > :nth-child(2){justify-self:center;}
        #${id} .promo-widget-head > :last-child{justify-self:end;}
        #${id} .promo-widget-message-wrap{position:relative;}
        #${id} .promo-widget-message{
          box-sizing:border-box;
          display:block;
          width:100%!important;
          min-width:0!important;
          max-width:100%;
          min-height:var(--promo-input-min-height);
          max-height:var(--promo-input-max-height);
          padding:12px calc(var(--promo-color-button-size) + 14px) 12px 12px;
          resize:vertical;
          line-height:1.45;
          border:0!important;
          border-radius:var(--surface-shared-control-radius,18px)!important;
          outline:none!important;
          background-color:var(--promo-widget-color)!important;
          box-shadow:inset 0 0 0 1px color-mix(in srgb,currentColor 18%,transparent)!important;
        }
        #${id} .promo-widget-message:focus{
          box-shadow:inset 0 0 0 1px color-mix(in srgb,currentColor 32%,transparent),0 0 0 2px color-mix(in srgb,currentColor 12%,transparent)!important;
        }
        #${id} .promo-widget-color{
          position:absolute!important;
          right:var(--promo-inline-gap)!important;
          bottom:var(--promo-inline-gap)!important;
          display:inline-flex!important;
          align-items:center!important;
          justify-content:center!important;
          width:var(--promo-color-button-size)!important;
          height:var(--promo-color-button-size)!important;
          padding:0!important;
          margin:0!important;
          border:0!important;
          border-radius:50%!important;
          background:transparent!important;
          background-color:transparent!important;
          box-shadow:none!important;
          cursor:pointer!important;
        }
        #${id} .promo-widget-color:hover,
        #${id} .promo-widget-color:focus-visible,
        #${id} .promo-widget-color:active{
          background:transparent!important;
          background-color:transparent!important;
        }
        #${id} .promo-widget-color,
        #${id} .promo-widget-color *,
        #${id} .promo-widget-color::before,
        #${id} .promo-widget-color::after,
        #${id} .promo-widget-color *::before,
        #${id} .promo-widget-color *::after{
          border-color:transparent!important;
          box-shadow:none!important;
        }
        #${id} .promo-widget-color .ui-icon-box,
        #${id} .promo-widget-color .ui-icon-content,
        #${id} .promo-widget-color .ui-icon-box::before,
        #${id} .promo-widget-color .ui-icon-content *{
          background:transparent!important;
          background-color:transparent!important;
        }
        #${id}[data-theme="dark"] .promo-widget-color .toolbar-icon{
          filter:var(--surface-toolbar-glyph-filter-dark)!important;
        }
        #${id}[data-theme="light"] .promo-widget-color .toolbar-icon{
          filter:var(--surface-toolbar-glyph-filter-light)!important;
        }
        #${id} .promo-widget-color .toolbar-icon{
          transition:
            width var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing),
            height var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing),
            min-width var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing),
            min-height var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing),
            flex-basis var(--surface-toolbar-icon-motion-duration) var(--surface-toolbar-icon-motion-easing),
            opacity 120ms ease;
          transform-origin:center;
          opacity:.82;
        }
        #${id} .promo-widget-color:hover .toolbar-icon,
        #${id} .promo-widget-color:focus-visible .toolbar-icon{
          width:var(--surface-toolbar-icon-hover-size)!important;
          height:var(--surface-toolbar-icon-hover-size)!important;
          min-width:var(--surface-toolbar-icon-hover-size)!important;
          min-height:var(--surface-toolbar-icon-hover-size)!important;
          flex-basis:var(--surface-toolbar-icon-hover-size)!important;
          opacity:1;
        }
        #${id} .promo-widget-color:active .toolbar-icon{
          width:var(--surface-toolbar-icon-size)!important;
          height:var(--surface-toolbar-icon-size)!important;
          min-width:var(--surface-toolbar-icon-size)!important;
          min-height:var(--surface-toolbar-icon-size)!important;
          flex-basis:var(--surface-toolbar-icon-size)!important;
          opacity:1;
        }
      `;
    },
  },
  skin,
};
