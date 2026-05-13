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

        .panel[data-ui-surface="reader"] .button {
          appearance: none !important;
          -webkit-appearance: none !important;
          border: 1px solid transparent !important;
          border-radius: 999px !important;
          width: var(--surface-button-size) !important;
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
          width: calc(var(--control-font-size) * 2.35) !important;
          min-width: calc(var(--control-font-size) * 2.35) !important;
          height: calc(var(--control-font-size) * 2.35) !important;
          min-height: calc(var(--control-font-size) * 2.35) !important;
          padding: 0 !important;
          border-radius: calc(var(--control-font-size) * 1.2) !important;
          opacity: var(--surface-toolbar-emoji-opacity, var(--surface-button-opacity)) !important;
          filter: none !important;
          -webkit-text-fill-color: currentColor !important;
          text-rendering: geometricPrecision;
        }
        .panel[data-ui-surface="reader"] {
          --surface-button-size: var(--surface-reader-button-size);
          --surface-button-padding-x: var(--surface-reader-button-padding-x);
          --surface-button-opacity: var(--surface-reader-button-opacity);
          --surface-button-active-scale: var(--surface-reader-button-active-scale);
          border: 0 !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          background: transparent !important;
        }
        .panel[data-ui-surface="toolbar"] {
          --surface-button-size: var(--surface-toolbar-button-size);
          --surface-button-padding-x: var(--surface-toolbar-button-padding-x);
          --surface-button-opacity: var(--surface-toolbar-button-opacity);
          --surface-button-active-scale: var(--surface-toolbar-button-active-scale);
          --surface-button-bg: transparent;
        }
        .panel[data-ui-surface="reader"] .button:hover,
        .panel[data-ui-surface="reader"] .button:focus-visible,
        .panel[data-ui-surface="toolbar"] .button:hover,
        .panel[data-ui-surface="toolbar"] .button:focus-visible {
          opacity: 1;
        }
        .panel[data-ui-surface="reader"] .button:active,
        .panel[data-ui-surface="toolbar"] .button:active {
          transform: scale(var(--surface-button-active-scale));
        }
        .panel[data-ui-surface="reader"][data-theme="dark"] {
          --surface-button-text: var(--surface-reader-dark-text);
          --surface-button-bg: var(--surface-reader-dark-bg);
          --surface-button-bg-hover: var(--surface-reader-dark-bg-hover);
          --surface-button-border-hover: var(--surface-reader-dark-border-hover);
        }
        .panel[data-ui-surface="reader"][data-theme="light"] {
          --surface-button-text: var(--surface-reader-light-text);
          --surface-button-bg: var(--surface-reader-light-bg);
          --surface-button-bg-hover: var(--surface-reader-light-bg-hover);
          --surface-button-border-hover: var(--surface-reader-light-border-hover);
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
        .panel[data-ui-surface="reader"] .button,
        .panel[data-ui-surface="toolbar"] .button {
          color: var(--surface-button-text) !important;
        }
        .panel[data-ui-surface="reader"] .button:hover,
        .panel[data-ui-surface="reader"] .button:focus-visible,
        .panel[data-ui-surface="toolbar"] .button:hover,
        .panel[data-ui-surface="toolbar"] .button:focus-visible {
          background: var(--surface-button-bg-hover) !important;
          border-color: var(--surface-button-border-hover) !important;
        }
        .panel[data-ui-surface="toolbar"][data-theme="light"] .button:hover,
        .panel[data-ui-surface="toolbar"][data-theme="light"] .button:focus-visible {
          box-shadow: none !important;
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
          gap:10px!important;
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
          pointer-events:auto!important;
          font:16px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important
        }
      `;
    },
  },
  editor: {
    text() {
      return `
        #editor-panel {
          right: 20px;
          top: 40px;
          padding: var(--panel-pad);
        }
        #editor-panel .button {
          min-width: 28px;
          padding-inline: 6px;
        }
        #editor-panel [data-row] {
          display: flex;
          gap: var(--control-gap);
          margin-bottom: var(--panel-row-gap);
        }
        #editor-panel [data-row]:last-child {
          margin-bottom: 0;
        }
        #editor-panel[data-layout="bottom"],
        #editor-panel[data-layout="fullscreen"] {
          position: fixed;
          left: 0;
          right: auto;
          top: auto;
          bottom: 0;
          width: 100vw;
          box-sizing: border-box;
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding: 8px;
          opacity: 1;
          scrollbar-width: none;
        }
        #editor-panel[data-layout="bottom"]::-webkit-scrollbar,
        #editor-panel[data-layout="fullscreen"]::-webkit-scrollbar {
          display: none;
        }
        #editor-panel[data-layout="bottom"] {
          background: rgba(17,17,17,.94);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        #editor-panel[data-layout="bottom"] [data-row],
        #editor-panel[data-layout="fullscreen"] [data-row] {
          margin-bottom: 0;
          flex: 0 0 auto;
          gap: 6px;
        }
        #editor-panel[data-layout="bottom"] .button,
        #editor-panel[data-layout="fullscreen"] .button {
          min-width: 42px;
          height: 38px;
          padding-inline: 10px;
          white-space: nowrap;
        }
        #editor-panel[data-layout="fullscreen"] [data-action="close"] {
          display: none;
        }
        #editor-panel [data-action="keyboard"] {
          display: none;
        }
        #editor-panel[data-layout="fullscreen"][data-mobile="true"] [data-action="keyboard"] {
          display: inline-flex;
        }
        #editor-panel[data-layout="fullscreen"] {
          left: 50% !important;
          transform: translateX(-50%);
          width: fit-content !important;
          max-width: calc(100vw - 60px);
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none;
          justify-content: flex-start;
          padding: 12px 12px;
          gap: 8px;
          opacity: 1;
          border-radius: 999px;
          outline: 0 !important;
          bottom: 32px !important;
          backdrop-filter: blur(26px) saturate(1.6);
          -webkit-backdrop-filter: blur(26px) saturate(1.6);
        }
        #editor-panel[data-layout="fullscreen"]::-webkit-scrollbar {
          display: none;
        }
        body.onliner-reader-active,
        html:has(body.onliner-reader-active) {
          overflow: hidden !important;
        }
        @media (min-width: 1200px) {
          #editor-panel[data-layout="fullscreen"] {
            max-width: calc(100vw - 400px) !important;
          }
        }
        #editor-panel[data-layout="fullscreen"][data-theme="dark"] {
          background: rgba(34,34,34,.46) !important;
          border: 1px solid rgba(255,255,255,.14) !important;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.10),
            0 12px 36px rgba(0,0,0,.34) !important;
        }
        #editor-panel[data-layout="fullscreen"][data-theme="light"] {
          background: rgba(255,255,255,.48) !important;
          border: 1px solid rgba(0,0,0,.10) !important;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.82),
            0 10px 30px rgba(0,0,0,.06) !important;
        }
        #editor-panel[data-layout="fullscreen"]::before,
        #editor-panel[data-layout="fullscreen"]::after {
          display: none !important;
          content: none !important;
        }
        #editor-panel[data-layout="fullscreen"] [data-row] {
          background: transparent !important;
          border: 0 !important;
          box-shadow: none !important;
          flex: 0 0 auto;
        }
        #editor-panel [data-drag-handle="true"] {
          cursor: grab;
        }
        #editor-panel[data-layout="fullscreen"] [data-drag-handle="true"] {
          position: sticky;
          left: 0;
          z-index: 20;
          flex: 0 0 auto;
          border: 0 !important;
          background: transparent !important;
          overflow: visible;
        }
        #editor-panel[data-layout="fullscreen"] [data-drag-handle="true"] .emoji {
          position: relative;
          z-index: 2;
        }
        #editor-panel[data-layout="fullscreen"] [data-drag-handle="true"]::after {
          content: "";
          position: absolute;
          top: 4px;
          right: -16px;
          z-index: 2;
          width: 1px;
          height: 22px;
          pointer-events: none;
        }
        #editor-panel[data-layout="fullscreen"][data-theme="dark"] [data-drag-handle="true"]::after {
          background: rgba(255,255,255,.18);
        }
        #editor-panel[data-layout="fullscreen"][data-theme="light"] [data-drag-handle="true"]::after {
          background: rgba(0,0,0,.14);
        }
        #editor-panel[data-layout="fullscreen"] [data-drag-handle="true"]:active {
          cursor: grabbing;
        }
        #editor-panel[data-layout="fullscreen"] [data-drag-separator="true"] {
          position: sticky;
          left: 48px;
          z-index: 2;
          flex: 0 0 auto;
          width: 1px;
          height: 22px;
          margin: 4px 12px 0 8px;
          align-self: flex-start;
          pointer-events: none;
        }
        #editor-panel[data-layout="fullscreen"][data-mobile="true"] [data-drag-handle="true"],
        #editor-panel[data-layout="fullscreen"][data-mobile="true"] [data-drag-separator="true"] {
          display: none !important;
        }
        #editor-panel .toolbar-icon,
        #editor-panel .toolbar-logo {
          width: 18px !important;
          height: 18px !important;
          min-width: 18px !important;
          min-height: 18px !important;
          display: block;
          flex: 0 0 18px;
          object-fit: contain;
        }
        #editor-panel[data-theme="dark"] .toolbar-icon {
          filter: brightness(2.2) contrast(.9);
          opacity: .92;
        }
        #editor-panel[data-theme="light"] .toolbar-icon {
          filter: brightness(.45);
          opacity: .72;
        }
        #editor-panel[data-active~="nbsp"] [data-action="nbsp"],
        #editor-panel[data-active~="em"] [data-action="em"],
        #editor-panel[data-active~="strong"] [data-action="strong"],
        #editor-panel[data-active~="comma"] [data-action="comma"],
        #editor-panel[data-active~="dash"] [data-action="dash"],
        #editor-panel[data-active~="quote"] [data-action="quote"],
        #editor-panel[data-active~="list"] [data-action="list"],
        #editor-panel[data-active~="year"] [data-action="year"],
        #editor-panel[data-active~="abbr"] [data-action="abbr"],
        #editor-panel[data-active~="note"] [data-action="note"] {
          opacity: 1;
        }
        #editor-panel[data-layout="fullscreen"][data-theme="dark"][data-active~="nbsp"] [data-action="nbsp"],
        #editor-panel[data-layout="fullscreen"][data-theme="dark"][data-active~="em"] [data-action="em"],
        #editor-panel[data-layout="fullscreen"][data-theme="dark"][data-active~="strong"] [data-action="strong"],
        #editor-panel[data-layout="fullscreen"][data-theme="dark"][data-active~="comma"] [data-action="comma"],
        #editor-panel[data-layout="fullscreen"][data-theme="dark"][data-active~="dash"] [data-action="dash"],
        #editor-panel[data-layout="fullscreen"][data-theme="dark"][data-active~="quote"] [data-action="quote"],
        #editor-panel[data-layout="fullscreen"][data-theme="dark"][data-active~="list"] [data-action="list"],
        #editor-panel[data-layout="fullscreen"][data-theme="dark"][data-active~="year"] [data-action="year"],
        #editor-panel[data-layout="fullscreen"][data-theme="dark"][data-active~="abbr"] [data-action="abbr"],
        #editor-panel[data-layout="fullscreen"][data-theme="dark"][data-active~="note"] [data-action="note"] {
          background: rgba(255,255,255,.12) !important;
          border-color: rgba(255,255,255,.14) !important;
        }
        #editor-panel[data-layout="fullscreen"][data-theme="light"][data-active~="nbsp"] [data-action="nbsp"],
        #editor-panel[data-layout="fullscreen"][data-theme="light"][data-active~="em"] [data-action="em"],
        #editor-panel[data-layout="fullscreen"][data-theme="light"][data-active~="strong"] [data-action="strong"],
        #editor-panel[data-layout="fullscreen"][data-theme="light"][data-active~="comma"] [data-action="comma"],
        #editor-panel[data-layout="fullscreen"][data-theme="light"][data-active~="dash"] [data-action="dash"],
        #editor-panel[data-layout="fullscreen"][data-theme="light"][data-active~="quote"] [data-action="quote"],
        #editor-panel[data-layout="fullscreen"][data-theme="light"][data-active~="list"] [data-action="list"],
        #editor-panel[data-layout="fullscreen"][data-theme="light"][data-active~="year"] [data-action="year"],
        #editor-panel[data-layout="fullscreen"][data-theme="light"][data-active~="abbr"] [data-action="abbr"],
        #editor-panel[data-layout="fullscreen"][data-theme="light"][data-active~="note"] [data-action="note"] {
          background: rgba(0,0,0,.07) !important;
          border-color: rgba(0,0,0,.08) !important;
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
    proofread: `
    #proofread-panel {
      --control-gap: var(--panel-row-gap);
      --proofread-col-unit: var(--control-height);
      --proofread-col-main: calc(var(--proofread-col-unit) * 5.4);
      --proofread-col-field: var(--proofread-col-main);
      --proofread-col-tools: calc(var(--proofread-col-unit) * 3.75 + var(--control-gap) * 2);
      --proofread-field-width: var(--proofread-col-field);
      --proofread-row-height: var(--control-height);
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
      padding: calc(var(--panel-pad) * 1.35);
      overflow-x: hidden;
      overflow-y: visible;
      transform: translateX(-50%);
      border: 1px solid var(--proofread-panel-border) !important;
      border-radius: 22px;
      background: var(--proofread-panel-bg) !important;
      box-shadow: var(--proofread-panel-shadow) !important;
      backdrop-filter: var(--surface-toolbar-glass-backdrop);
      -webkit-backdrop-filter: var(--surface-toolbar-glass-backdrop);
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
      grid-template-rows: auto;
      align-items: center;
      column-gap: var(--proofread-cols-gap);
      row-gap: calc(var(--panel-row-gap) * 0.9);
      padding: 0 var(--panel-pad) calc(var(--panel-row-gap) * 4.4);
      margin: var(--panel-row-gap) 0 calc(var(--panel-row-gap) * 1.4);
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
      position: absolute;
      left: var(--proofread-progress-inset);
      right: var(--proofread-progress-inset);
      bottom: 0;
      height: 9px;
      overflow: hidden;
      border-radius: 999px;
      background: color-mix(in srgb, var(--proofread-active-background) 45%, transparent);
    }
    #proofread-panel[data-theme="dark"] [data-progress] {
      background: color-mix(in srgb, var(--proofread-active-background) 45%, transparent);
    }
    #proofread-panel[data-done="true"] [data-progress],
    #proofread-panel[data-done="true"] [data-status] {
      display: none;
    }
    #proofread-panel[data-done="false"] [data-headline] {
      grid-column: 1 / 4;
    }
    #proofread-panel[data-done="false"] [data-actions] {
      display: grid;
    }
    #proofread-panel[data-done="false"] [data-tools] {
      visibility: hidden;
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
    #proofread-panel .proofread-tab {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      min-width: 42px;
      font-size: var(--control-font-size);
      padding-inline: 6px;
      white-space: nowrap;
    }
    #proofread-panel .proofread-tab [data-icon] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    #proofread-panel .proofread-tab [data-count] {
      font-size: 1em;
      line-height: 1;
      opacity: 0.72;
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
      -ms-overflow-style: none;
    }
    #proofread-list::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
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
