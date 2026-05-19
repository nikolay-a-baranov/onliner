import { design } from "./design.js";

export const css = {
  panel: {
    theme() {
      return `
        :root {
          ${design.run()}
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
          --surface-button-size: var(--surface-toolbar-button-size);
          --surface-button-padding-x: var(--surface-toolbar-button-padding-x);
          --surface-button-opacity: var(--surface-toolbar-button-opacity);
          --surface-button-active-scale: var(--surface-toolbar-button-active-scale);
          --surface-group-gap: 6px;
          --surface-icon-box-gap: 8px;
          --surface-toolbar-icon-size: var(--surface-emoji-icon-size);
          --surface-toolbar-logo-size: var(--surface-emoji-icon-size);
          --surface-button-bg: transparent;
          --surface-emoji-icon-size: calc(var(--surface-button-size) * 0.84);
          --toolbar-unified-step: var(--surface-button-size);
          --toolbar-unified-icon-size: var(--surface-emoji-icon-size);
          --toolbar-unified-pad-x: 8px;
          --surface-emoji-hover-scale: 1.12;
          --surface-emoji-active-scale: 1.08;
        }
        .panel[data-ui-surface="toolbar"][data-icon-mode="glyph"] {
          --surface-icon-box-gap: 12px;
          --surface-button-padding-x: 2px;
        }
        .panel[data-ui-surface="toolbar"][data-icon-mode="glyph"] .toolbar-strip {
          margin-left: 6px;
          margin-right: 6px;
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
        .panel[data-ui-surface="toolbar"] .toolbar-icon-box {
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
          border-radius: calc(var(--surface-button-size) * 0.28);
        }
        .panel[data-ui-surface="toolbar"] .toolbar-media,
        .panel[data-ui-surface="toolbar"] .toolbar-icon-content {
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
        }
        .panel[data-ui-surface="toolbar"][data-theme="light"] {
          --surface-button-text: var(--surface-toolbar-light-text);
          --surface-button-bg-hover: var(--surface-toolbar-light-bg-hover);
          --surface-button-border-hover: var(--surface-toolbar-light-border-hover);
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
        .panel[data-ui-surface="toolbar"] .toolbar-group {
          display: inline-flex;
          align-items: center;
          gap: var(--surface-group-gap);
          width: fit-content;
          min-width: 0;
          max-width: 100%;
          padding: 4px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.38);
          background: transparent;
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          transition: none !important;
        }
        .panel[data-ui-surface="toolbar"] [data-sticky-group="left"] {
          position: sticky;
          left: 0;
          z-index: 30;
          flex: 0 0 auto;
          margin-right: var(--panel-row-gap);
        }
        .panel[data-ui-surface="toolbar"] [data-sticky-group="right"] {
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
        .panel[data-ui-surface="toolbar"][data-theme="dark"] [data-sticky-group] {
          background: rgba(76, 76, 76, 0.92);
          border-color: rgba(255, 255, 255, 0.24);
        }
        .panel[data-ui-surface="toolbar"][data-theme="light"] [data-sticky-group] {
          background: rgba(255, 255, 255, 0.92);
          border-color: rgba(0, 0, 0, 0.2);
        }
        .panel[data-ui-surface="toolbar"] .toolbar-segment-group {
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
        .panel[data-ui-surface="toolbar"] .toolbar-strip {
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
        .panel[data-ui-surface="toolbar"] .toolbar-segment {
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
          max-width: calc(100vw - 28px);
          padding: 8px 10px;
          border: 1px solid transparent;
          border-radius: 999px;
          backdrop-filter: var(--surface-toolbar-glass-backdrop);
          -webkit-backdrop-filter: var(--surface-toolbar-glass-backdrop);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-capsule="true"][data-theme="dark"] {
          border-color: var(--surface-toolbar-dark-panel-border);
          background: var(--surface-toolbar-dark-panel-bg);
          color: rgba(255, 255, 255, 0.96);
          box-shadow: var(--surface-toolbar-dark-panel-shadow);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-capsule="true"][data-theme="light"] {
          border-color: var(--surface-toolbar-light-panel-border);
          background: var(--surface-toolbar-light-panel-bg);
          color: rgba(0, 0, 0, 0.86);
          box-shadow: var(--surface-toolbar-light-panel-shadow);
        }
        .panel[data-ui-surface="toolbar"] .toolbar-segment:active {
          transform: none !important;
        }
        .panel[data-ui-surface="toolbar"] .toolbar-segment[data-disabled="true"] {
          opacity: 0.45;
          pointer-events: none;
        }
        .panel[data-ui-surface="toolbar"] .toolbar-segment:hover {
          transform: none !important;
          background: transparent !important;
          border-color: transparent !important;
          box-shadow: none !important;
        }
        .panel[data-ui-surface="toolbar"] .toolbar-segment:hover .toolbar-media-box,
        .panel[data-ui-surface="toolbar"] .toolbar-segment:hover .toolbar-icon-box,
        .panel[data-ui-surface="toolbar"] .toolbar-segment:focus-visible .toolbar-media-box,
        .panel[data-ui-surface="toolbar"] .toolbar-segment:focus-visible .toolbar-icon-box {
          transform: translateZ(0) scale(1.12);
        }
        .panel[data-ui-surface="toolbar"] .toolbar-segment:active .toolbar-media-box,
        .panel[data-ui-surface="toolbar"] .toolbar-segment:active .toolbar-icon-box {
          transform: translateZ(0) scale(1.08);
        }
        .panel[data-ui-surface="toolbar"] .toolbar-segment:hover .toolbar-media .emoji,
        .panel[data-ui-surface="toolbar"] .toolbar-segment:hover .toolbar-media .emoji img,
        .panel[data-ui-surface="toolbar"] .toolbar-segment:hover .toolbar-icon-content .emoji,
        .panel[data-ui-surface="toolbar"] .toolbar-segment:hover .toolbar-icon-content .emoji img,
        .panel[data-ui-surface="toolbar"] .toolbar-segment:hover .toolbar-icon-content img,
        .panel[data-ui-surface="toolbar"] .toolbar-segment:focus-visible .toolbar-media .emoji,
        .panel[data-ui-surface="toolbar"] .toolbar-segment:focus-visible .toolbar-media .emoji img,
        .panel[data-ui-surface="toolbar"] .toolbar-segment:focus-visible .toolbar-icon-content .emoji,
        .panel[data-ui-surface="toolbar"] .toolbar-segment:focus-visible .toolbar-icon-content .emoji img,
        .panel[data-ui-surface="toolbar"] .toolbar-segment:focus-visible .toolbar-icon-content img {
          filter: none;
        }
        .panel[data-ui-surface="toolbar"] .toolbar-segment:active .toolbar-media .emoji,
        .panel[data-ui-surface="toolbar"] .toolbar-segment:active .toolbar-media .emoji img,
        .panel[data-ui-surface="toolbar"] .toolbar-segment:active .toolbar-icon-content .emoji,
        .panel[data-ui-surface="toolbar"] .toolbar-segment:active .toolbar-icon-content .emoji img,
        .panel[data-ui-surface="toolbar"] .toolbar-segment:active .toolbar-icon-content img {
          filter: none;
        }
        .panel[data-ui-surface="toolbar"][data-theme="light"] .toolbar-group {
          background: rgba(0, 0, 0, 0.14);
          border-color: rgba(0, 0, 0, 0.28);
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="left"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="right"] {
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow-x: hidden;
          overflow-y: auto;
          scroll-snap-type: y mandatory;
          touch-action: pan-y;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="left"] .toolbar-strip,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="right"] .toolbar-strip {
          flex-direction: column;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="top"] .toolbar-strip,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="bottom"] .toolbar-strip,
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="floating"] .toolbar-strip {
          flex-direction: row;
        }
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="top"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="bottom"],
        .panel[data-ui-surface="toolbar"][data-toolbar-flow="single-row"][data-dock="floating"] {
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x mandatory;
          touch-action: pan-x;
        }
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
  },
  reader: {
    color(theme) {
      if (theme === "light")
        return {
          background: "#fff",
          color: "#111",
          fade: "rgba(255,255,255,0)",
          shade: "rgba(255,255,255,.92)",
          shadow: "rgba(255,255,255,.55)",
        };
      return {
        background: "#111",
        color: "#f2f2f2",
        fade: "rgba(17,17,17,0)",
        shade: "rgba(17,17,17,.92)",
        shadow: "rgba(17,17,17,.55)",
      };
    },
    text({ theme, panel }) {
      const color = css.reader.color(theme);
      return `
        html,
        body,
        body.onliner-reader-active,
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
          padding:16px!important;
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
          font-size:18px!important;
          line-height:1.45!important;
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
        body.onliner-reader-active{
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
          gap:var(--surface-group-gap, 6px)!important;
          padding:0 12px!important;
          pointer-events:none!important;
          border:0!important;
          border-radius:0!important;
          box-shadow:none!important;
          background:transparent!important
        }
        #${panel}::after{
          content:""!important;
          position:absolute!important;
          left:-1px!important;
          right:calc(var(--reader-scrollbar-gap,0px) - 1px)!important;
          top:-1px!important;
          height:100px!important;
          background:linear-gradient(
            to bottom,
            ${color.background} 0%,
            ${color.background} 22%,
            ${color.shade} 54%,
            ${color.shadow} 78%,
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
          height:60px!important;
          pointer-events:none!important;
          z-index:1000000!important;
          background:linear-gradient(
            to top,
            ${color.background} 0%,
            ${color.background} 22%,
            ${color.shade} 54%,
            ${color.shadow} 78%,
            ${color.fade} 100%
          )!important
        }
        #${panel} .button{
          pointer-events:auto!important
        }
      `;
    },
  },
  editor: {
    text() {
      return `
        #editor-panel {
          --editor-visible-x: 10;
          --editor-visible-y: 5;
          right: 20px;
          top: 40px;
        }
        #editor-panel .editor-row {
          display: flex;
          align-items: center;
          width: fit-content !important;
          max-width: 100%;
          margin-bottom: 0;
        }
        #editor-panel .editor-shell {
          display: flex;
          align-items: center;
          gap: var(--panel-row-gap);
          width: max-content;
          max-width: 100%;
        }
        #editor-panel .editor-line {
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
          touch-action: pan-x;
        }
        #editor-panel .editor-line::-webkit-scrollbar {
          display: none;
        }
        #editor-panel[data-layout="bottom"],
        #editor-panel[data-layout="fullscreen"] {
          display: flex !important;
          align-items: center;
          overflow: visible;
        }
        #editor-panel[data-layout="bottom"] .editor-row,
        #editor-panel[data-layout="fullscreen"] .editor-row {
          flex: 0 0 auto;
        }
        #editor-panel[data-layout="bottom"] .toolbar-group,
        #editor-panel[data-layout="fullscreen"] .toolbar-group,
        #editor-panel[data-layout="bottom"] .toolbar-strip,
        #editor-panel[data-layout="fullscreen"] .toolbar-strip {
          scroll-snap-align: start;
          scroll-snap-stop: always;
        }
        #editor-panel[data-layout="bottom"][data-dock="left"],
        #editor-panel[data-layout="fullscreen"][data-dock="left"],
        #editor-panel[data-layout="bottom"][data-dock="right"],
        #editor-panel[data-layout="fullscreen"][data-dock="right"] {
          flex-direction: column;
        }
        #editor-panel[data-layout="bottom"][data-dock="left"] .editor-shell,
        #editor-panel[data-layout="fullscreen"][data-dock="left"] .editor-shell,
        #editor-panel[data-layout="bottom"][data-dock="right"] .editor-shell,
        #editor-panel[data-layout="fullscreen"][data-dock="right"] .editor-shell {
          flex-direction: column;
        }
        #editor-panel[data-layout="bottom"][data-dock="left"] .editor-line,
        #editor-panel[data-layout="fullscreen"][data-dock="left"] .editor-line,
        #editor-panel[data-layout="bottom"][data-dock="right"] .editor-line,
        #editor-panel[data-layout="fullscreen"][data-dock="right"] .editor-line {
          overflow-x: hidden;
          overflow-y: auto;
          touch-action: pan-y;
        }
        #editor-panel [data-drag-handle="true"] {
          cursor: grab;
        }
        #editor-panel[data-layout="fullscreen"] [data-drag-handle="true"]:active,
        #editor-panel[data-layout="bottom"] [data-drag-handle="true"]:active {
          cursor: grabbing;
        }
        #editor-panel[data-layout="fullscreen"][data-mobile="true"][data-keyboard-open="true"] [data-drag-handle="true"],
        #editor-panel[data-layout="fullscreen"][data-mobile="true"][data-keyboard-open="true"] [data-sticky-group="left"] {
          display: none !important;
        }
        #editor-panel[data-mobile="true"] [data-action="scroll"] {
          display: none !important;
        }
      `;
    },
  },
  diff: {
    panel() {
      return `
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
      `;
    },
  },
  launcher: {
    panel() {
      return css.skin.launcher;
    },
  },
  proofread: {
    panel() {
      return css.skin.proofread;
    },
  },
  readmore: {
    panel() {
      return css.skin.readmore;
    },
  },
  clone: {
    panel() {
      return css.skin.clone;
    },
  },
  filter: {
    panel() {
      return css.skin.filter;
    },
    progress() {
      return css.skin.filterProgress;
    },
  },
  skin: {
    launcher: `
    #launcher-panel {
      --control-gap: var(--panel-row-gap);
      --launcher-step: 32px;
      --launcher-gap: 8px;
      --launcher-scroll-gap: 8px;
      --launcher-visible: 3;
      --launcher-edge-pad: 8px;
      --launcher-cell: calc(var(--launcher-step) + var(--launcher-scroll-gap));
      --launcher-track: calc(
        var(--launcher-visible) * var(--launcher-cell) - var(--launcher-scroll-gap)
      );
      right: 14px;
      top: 14px;
      width: max-content;
      min-width: 0;
      max-width: calc(100vw - 28px);
      max-height: calc(100vh - 28px);
      padding: 8px 10px;
      overflow-x: hidden;
      overflow-y: hidden;
      cursor: grab;
      border: 1px solid transparent;
      border-radius: 999px;
      background: var(--surface-toolbar-dark-panel-bg);
      color: rgba(255, 255, 255, 0.96);
      box-shadow: var(--surface-toolbar-dark-panel-shadow);
      backdrop-filter: var(--surface-toolbar-glass-backdrop);
      -webkit-backdrop-filter: var(--surface-toolbar-glass-backdrop);
      user-select: none;
      -webkit-user-select: none;
    }
    #launcher-panel[data-theme="dark"] {
      border-color: var(--surface-toolbar-dark-panel-border);
      background: var(--surface-toolbar-dark-panel-bg);
      color: rgba(255, 255, 255, 0.96);
      box-shadow: var(--surface-toolbar-dark-panel-shadow);
    }
    #launcher-panel[data-theme="light"] {
      border-color: var(--surface-toolbar-light-panel-border);
      background: var(--surface-toolbar-light-panel-bg);
      color: rgba(0, 0, 0, 0.86);
      box-shadow: var(--surface-toolbar-light-panel-shadow);
    }
    .launcher-head {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: center;
      gap: 0;
      margin-bottom: 0;
    }
    #launcher-panel .toolbar-shell {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: var(--launcher-gap);
      width: max-content;
      max-width: 100%;
      margin: 0 auto;
    }
    .launcher-mode-group {
      display: inline-flex;
      align-items: center;
      gap: var(--launcher-gap);
    }
    .launcher-row {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      justify-content: center;
      gap: var(--launcher-scroll-gap);
    }
    #launcher-panel .toolbar-line {
      position: relative;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
      -ms-overflow-style: none;
      width: var(--launcher-track);
      max-width: calc(100vw - 56px);
      box-sizing: border-box;
      padding: 4px 0;
      cursor: grab;
      scroll-snap-type: x mandatory;
      touch-action: pan-x;
    }
    #launcher-panel .toolbar-line-status {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 var(--launcher-edge-pad);
      font-size: 11px;
      font-weight: 600;
      color: #ffb6b6;
      background: inherit;
      pointer-events: none;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    #launcher-panel .toolbar-line:not(.is-status) .toolbar-line-status {
      display: none;
    }
    #launcher-panel .toolbar-line.is-status [data-button] {
      visibility: hidden;
    }
    #launcher-panel .toolbar-line::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }
    #launcher-panel .launcher-button:focus-visible,
    #launcher-panel .launcher-button:hover,
    #launcher-panel .launcher-button:active,
    #launcher-panel .toolbar-segment-group:focus-visible {
      box-shadow: none !important;
      border-color: transparent !important;
      outline: none !important;
    }
    #launcher-panel .launcher-button {
      display: inline-flex;
      width: var(--launcher-step);
      max-width: var(--launcher-step);
      justify-content: center !important;
      align-items: center;
      min-width: var(--launcher-step);
      height: var(--launcher-step);
      min-height: var(--launcher-step);
      margin: 0;
      padding: 0;
      border: 0 !important;
      border-color: transparent !important;
      border-radius: 999px;
      background: transparent;
      font-weight: 600;
      text-align: center;
      color: inherit;
      line-height: 1;
      white-space: nowrap;
      transform: none;
      transition: none;
      flex: 0 0 auto;
      scroll-snap-align: start;
      scroll-snap-stop: always;
      overflow: hidden;
    }
    #launcher-panel[data-ui-surface="toolbar"] .toolbar-segment-group,
    #launcher-panel[data-ui-surface="toolbar"] .launcher-button {
      border: 0 !important;
      border-color: transparent !important;
      box-shadow: none !important;
    }
    #launcher-panel .toolbar-media,
    #launcher-panel .toolbar-media .emoji,
    #launcher-panel .toolbar-media .emoji img {
      pointer-events: none;
      -webkit-user-drag: none;
      user-drag: none;
      -webkit-touch-callout: none;
      user-select: none;
      -webkit-user-select: none;
    }
    #launcher-panel .launcher-button:hover {
      transform: none !important;
      background: transparent !important;
      border-color: transparent !important;
      box-shadow: none !important;
    }
    #launcher-panel .launcher-button:active {
      transform: none !important;
      background: transparent !important;
      border-color: transparent !important;
      box-shadow: none !important;
    }
    #launcher-panel:active {
      cursor: grabbing;
    }
    #launcher-panel .button,
    #launcher-panel [data-theme-toggle],
    #launcher-panel [data-close] {
      cursor: pointer;
    }
    #launcher-panel[data-dock="top"] .toolbar-line,
    #launcher-panel[data-dock="bottom"] .toolbar-line,
    #launcher-panel[data-dock="floating"] .toolbar-line {
      flex-direction: row;
      justify-content: flex-start;
      overflow-x: auto;
      overflow-y: hidden;
      width: var(--launcher-track);
      max-width: calc(100vw - 56px);
      max-height: none;
      margin: 0 auto;
    }
    #launcher-panel[data-dock="top"] .toolbar-shell,
    #launcher-panel[data-dock="bottom"] .toolbar-shell,
    #launcher-panel[data-dock="floating"] .toolbar-shell {
      flex-direction: row;
      align-items: center;
    }
    #launcher-panel[data-dock="left"] .toolbar-line,
    #launcher-panel[data-dock="right"] .toolbar-line {
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
      scroll-snap-type: y mandatory;
      touch-action: pan-y;
      width: 100%;
      height: calc(
        var(--launcher-visible) * var(--launcher-cell) - var(--launcher-scroll-gap)
      );
      max-height: calc(100vh - 80px);
      max-width: none;
      padding: 0;
      scroll-padding-top: 0;
      scroll-padding-bottom: 0;
    }
    #launcher-panel[data-dock="left"] .toolbar-line::-webkit-scrollbar,
    #launcher-panel[data-dock="right"] .toolbar-line::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
    #launcher-panel[data-dock="left"] .toolbar-shell,
    #launcher-panel[data-dock="right"] .toolbar-shell {
      flex-direction: column;
      align-items: center;
      width: 100%;
    }
    #launcher-panel[data-dock="left"] [data-sticky-group="left"].launcher-mode-group,
    #launcher-panel[data-dock="right"] [data-sticky-group="left"].launcher-mode-group,
    #launcher-panel[data-dock="left"] [data-sticky-group="right"].launcher-mode-group,
    #launcher-panel[data-dock="right"] [data-sticky-group="right"].launcher-mode-group {
      display: flex;
      flex-direction: column;
      width: calc(var(--launcher-step) + 12px);
      min-width: calc(var(--launcher-step) + 12px);
      max-width: calc(var(--launcher-step) + 12px);
      height: fit-content;
      min-height: 0;
      justify-content: flex-start;
      align-items: center;
      padding: 5px;
      gap: var(--launcher-gap);
      border-radius: 999px;
    }
    #launcher-panel[data-dock="left"] .toolbar-segment-group,
    #launcher-panel[data-dock="right"] .toolbar-segment-group {
      position: static;
      left: auto;
      display: flex !important;
      flex-direction: column;
      width: fit-content !important;
      min-width: 0 !important;
      height: fit-content !important;
      min-height: 0 !important;
      padding: 0;
      gap: var(--launcher-gap);
      align-items: center;
      justify-content: flex-start;
    }
    #launcher-panel[data-dock="left"],
    #launcher-panel[data-dock="right"] {
      width: 64px;
      min-width: 64px;
      max-width: 64px;
      border-radius: 30px;
      padding: var(--launcher-edge-pad) 5px;
      overflow: hidden;
    }
    #launcher-panel[data-dock="left"] .launcher-button,
    #launcher-panel[data-dock="right"] .launcher-button,
    #launcher-panel[data-dock="left"] .toolbar-segment-group,
    #launcher-panel[data-dock="right"] .toolbar-segment-group {
      padding: 0 !important;
      justify-content: center !important;
    }
  `,
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
      --control-focus-ring-color: rgba(0, 0, 0, 0.14);
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
      --control-focus-ring-color: rgba(255, 255, 255, 0.22);
      --proofread-panel-bg: var(--surface-toolbar-dark-panel-bg);
      --proofread-panel-border: var(--surface-toolbar-dark-panel-border);
      --proofread-panel-shadow: var(--surface-toolbar-dark-panel-shadow);
      color: rgba(255, 255, 255, 0.92);
    }
    #proofread-panel [data-header] {
      position: relative;
      display: grid;
      grid-template-columns: var(--proofread-col-main) var(--proofread-col-field) var(--proofread-col-tools);
      grid-template-rows: 1fr;
      align-items: center;
      column-gap: var(--proofread-cols-gap);
      row-gap: calc(var(--panel-row-gap) * 0.9);
      height: var(--proofread-header-height);
      padding: 0 var(--panel-pad);
      margin: 0 0 var(--proofread-header-gap);
    }
    #proofread-panel [data-headline],
    #proofread-panel [data-actions] {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    #proofread-panel [data-headline] {
      grid-column: 1;
      grid-row: 1;
      flex: 1 1 auto;
      justify-content: flex-start;
    }
    #proofread-panel [data-actions] {
      grid-column: 2 / 4;
      grid-row: 1;
      display: grid;
      grid-template-columns: var(--proofread-col-field) var(--proofread-col-tools);
      justify-items: start;
      align-items: center;
      column-gap: var(--proofread-cols-gap);
    }
    #proofread-panel [data-status] {
      display: inline-flex;
      align-items: center;
      min-width: 0;
    }
    #proofread-panel [data-tabs],
    #proofread-panel [data-tools],
    #proofread-list [data-tools-row] {
      display: flex;
      align-items: center;
      gap: var(--control-gap);
    }
    #proofread-panel .proofread-source-group {
      gap: var(--control-gap);
    }
    #proofread-panel [data-tools] {
      justify-content: flex-start;
      min-width: 0;
      width: var(--proofread-col-tools);
    }
    #proofread-panel[data-tools-ready="false"] [data-tabs],
    #proofread-panel[data-tools-ready="false"] [data-tools] {
      visibility: hidden;
    }
    #proofread-panel [data-progress] {
      display: none;
    }
    #proofread-panel[data-done="true"] [data-status] {
      display: none;
    }
    #proofread-panel[data-done="false"] {
      --proofread-loading-logo-size: 34px;
      width: calc(var(--proofread-loading-logo-size) + var(--panel-pad) * 4.8) !important;
      min-width: calc(var(--proofread-loading-logo-size) + var(--panel-pad) * 4.8) !important;
      max-width: calc(var(--proofread-loading-logo-size) + var(--panel-pad) * 4.8) !important;
      height: calc(var(--proofread-loading-logo-size) + var(--panel-pad) * 4.2) !important;
      min-height: calc(var(--proofread-loading-logo-size) + var(--panel-pad) * 4.2) !important;
      max-height: calc(var(--proofread-loading-logo-size) + var(--panel-pad) * 4.2) !important;
      padding: calc(var(--panel-pad) * 0.9) calc(var(--panel-pad) * 1.2) !important;
      border-radius: calc(var(--panel-radius) * 2.8) !important;
      overflow: hidden;
    }
    #proofread-panel[data-done="false"] [data-headline] {
      grid-column: 1 / 4;
      justify-content: center;
      width: 100%;
    }
    #proofread-panel[data-done="false"] [data-tabs] {
      display: none !important;
    }
    #proofread-panel[data-done="false"] [data-actions] {
      display: none;
    }
    #proofread-panel[data-done="false"] [data-tools] {
      visibility: hidden;
    }
    #proofread-panel[data-done="false"] [data-header] {
      height: 100%;
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
    #proofread-panel[data-done="false"] #proofread-list,
    #proofread-panel[data-done="false"] [data-resize-edge] {
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
      width: var(--proofread-loading-logo-size);
      height: var(--proofread-loading-logo-size);
      border-radius: 8px;
      animation: proofread-logo-spin 1.2s linear infinite;
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
      border: 0 !important;
      border-color: transparent !important;
      border-radius: 999px;
      background: transparent !important;
      box-shadow: none !important;
      font-size: var(--control-font-size);
      white-space: nowrap;
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
      font-size: 1em;
      line-height: 1;
      opacity: 0.72;
    }
    #proofread-panel .proofread-icon {
      border-radius: 3px;
    }
    #proofread-panel [data-mode] {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: var(--proofread-col-field);
      min-width: var(--proofread-col-field);
      padding-right: calc(var(--panel-row-gap) * 0.35);
    }
    #proofread-panel[data-done="false"] #proofread-theme {
      display: none;
    }
    #proofread-panel [data-source][data-active="true"] {
      background: color-mix(in srgb, currentColor 20%, transparent) !important;
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
      background: rgba(0, 0, 0, 0.05);
    }
    #proofread-panel .field:focus {
      border-color: currentColor;
      box-shadow: none;
    }
    #proofread-panel[data-theme="dark"] .field {
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.94);
      border-color: rgba(255, 255, 255, 0.22);
    }
    #proofread-panel[data-theme="dark"] .field-select:hover {
      background: rgba(255, 255, 255, 0.14);
      border-color: rgba(255, 255, 255, 0.32);
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
    #proofread-panel [data-resize-edge] {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 8;
      height: 8px;
      cursor: ns-resize;
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
      #proofread-panel [data-header] {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto;
      }
      #proofread-panel [data-headline],
      #proofread-panel [data-actions] {
        grid-column: 1;
        width: 100%;
      }
      #proofread-panel [data-actions] {
        grid-template-columns: 1fr;
        grid-row: 2;
      }
      #proofread-panel [data-mode] {
        width: auto;
        min-width: 0;
      }
      #proofread-panel [data-tools] {
        justify-content: flex-start;
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
    filterProgress: `
    #filter-progress {
      top: 80px;
      left: 50%;
      width: 240px;
      padding: 10px;
      transform: translateX(-50%);
      border: 1px solid #ccd0d4;
      text-align: center;
      font: inherit;
    }
    #filter-progress [data-bar-wrap] {
      height: 8px;
      margin-top: 6px;
      border: 1px solid #ccd0d4;
      background: #f0f0f1;
    }
    #filter-progress [data-bar] {
      width: 0%;
      height: 100%;
      background: #2f7a45;
      transition: width 0.2s ease;
    }
  `,
    filter: `
    #filter-panel,
    #filter-panel * {
      box-sizing: border-box;
    }
    #filter-panel {
      text-align: center;
      font: inherit;
    }
    #filter-panel .filter-overlay {
      position: fixed;
      inset: 0;
      z-index: 999998;
    }
    #filter-panel .filter-box {
      position: fixed;
      top: 80px;
      left: 50%;
      z-index: 999999;
      width: max-content;
      padding: 10px;
      transform: translateX(-50%);
      border: 1px solid #ccd0d4;
      background: #fff;
      color: inherit;
    }
    #filter-panel .filter-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin: 6px 0 4px;
    }
    #filter-panel .filter-separator {
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px solid #ccd0d4;
    }
    #filter-panel .filter-period {
      min-width: 105px;
      text-align: center;
      font-weight: 600;
    }
    #filter-panel .filter-button,
    #filter-panel .filter-current {
      width: 100%;
      min-height: 28px;
      margin: 3px 0;
      padding: 2px 8px;
      line-height: 1.2;
      text-align: center;
      white-space: nowrap;
    }
    #filter-panel .filter-current {
      border: 1px solid #2f7a45;
      background: #e7f6eb;
      color: #1f5f33;
      font-weight: 600;
      cursor: pointer;
      box-shadow: inset 0 0 0 1px #b7dfc2;
    }
    #filter-panel .filter-mini {
      width: 28px;
      height: 28px;
      min-height: 28px;
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
  },
};
