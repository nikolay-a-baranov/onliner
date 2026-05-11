import { design } from "./design.js";

export const theme = `
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
