export const theme = `
  :root {
    --ui-font-size: 13px;
    --ui-font-family: "YS Text Variable", "Segoe UI", Arial, sans-serif;
    --ui-line-height: 1.35;
    --ui-text: #111;
    --ui-background: #fff;
    --ui-border: #ccd0d4;
    --ui-shadow: 0 6px 24px #00000033;
    --ui-focus-ring-color: #aac7ff;
    --ui-flash-green-background: #dff5e6;
    --ui-flash-blue-background: #dcecff;
    --ui-flash-red-background: #ffe1e1;

    --panel-font-size: var(--ui-font-size);
    --panel-font-family: var(--ui-font-family);
    --panel-line-height: var(--ui-line-height);
    --panel-text: var(--ui-text);
    --panel-background: var(--ui-background);
    --panel-border: var(--ui-border);
    --panel-shadow: var(--ui-shadow);
    --panel-radius: calc(var(--panel-font-size) * 0.62);
    --panel-pad: calc(var(--panel-font-size) * 0.75);
    --panel-row-gap: calc(var(--panel-font-size) * 0.45);

    --control-font-size: var(--ui-font-size);
    --control-height: calc(var(--control-font-size) * 2.3);
    --control-radius: calc(var(--control-font-size) * 0.34);
    --control-gap: calc(var(--control-font-size) * 0.75);
    --control-pad-x: calc(var(--control-font-size) * 0.8);
    --control-border: 1px solid #d2d2d2;
    --control-background: transparent;

    --control-background-hover: #f3f4f6;
    --control-background-active: #e7ebf0;
    --control-focus-ring-color: var(--ui-focus-ring-color);
    --control-focus-ring: 0 0 0 2px var(--control-focus-ring-color);

    --flash-green-background: var(--ui-flash-green-background);
    --flash-blue-background: var(--ui-flash-blue-background);
    --flash-red-background: var(--ui-flash-red-background);
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

  .panel .button[data-flash="green"] {
    background: var(--flash-green-background) !important;
  }

  .panel .button[data-flash="blue"] {
    background: var(--flash-blue-background) !important;
  }

  .panel .button[data-flash="red"] {
    background: var(--flash-red-background) !important;
  }

  .panel .button:focus-visible {
    box-shadow: var(--control-focus-ring);
    outline: none;
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
