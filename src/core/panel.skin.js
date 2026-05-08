export const skin = {
  proofread: `
    #proofread-panel {
      --control-gap: var(--panel-row-gap);
      --proofread-field-width: calc(var(--control-font-size) * 9.4);
      --proofread-scrollbar-pad: calc(var(--panel-font-size) * 1.25);
      --proofread-header-height: calc(
        var(--control-height) + var(--panel-row-gap)
      );
      --proofread-row-height: var(--control-height);
      --proofread-main-gap: calc(var(--panel-font-size) * 0.92);
      --proofread-text-max-width: calc(var(--control-font-size) * 16.9);
      --proofread-active-inset: calc(var(--panel-font-size) * 0.23);
      --proofread-active-pad-left: calc(var(--panel-font-size) * 0.77);
      --proofread-message-font-size: calc(var(--panel-font-size) * 0.62);
      --proofread-message-line-height: 1.15;
      --proofread-message-margin-top: calc(var(--panel-font-size) * 0.15);
      --proofread-header-margin-bottom: calc(var(--panel-font-size) * 0.8);
      --proofread-panel-pad-bottom: calc(var(--panel-pad) + 2px);
      --proofread-list-max-height: calc(
        var(--proofread-row-height) * 4.2 + var(--panel-row-gap) * 10
      );
      right: 20px;
      top: 40px;
      width: max-content;
      max-width: min(768px, calc(100vw - 40px));
      min-width: 320px;
      padding: var(--panel-pad) var(--panel-pad) var(--proofread-panel-pad-bottom);
      overflow-x: hidden;
      overflow-y: visible;
    }

    #proofread-panel [data-header] {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: var(--proofread-header-height);
      margin: var(--panel-row-gap) 0 var(--proofread-header-margin-bottom) 0;
      padding: 0 var(--panel-pad);
      padding-right: calc(var(--panel-pad) + var(--proofread-scrollbar-pad));
    }

    #proofread-panel #proofread-title {
      font-size: calc(var(--panel-font-size) + 2px);
      font-weight: 600;
      white-space: nowrap;
    }

    #proofread-panel [data-tools],
    #proofread-list [data-tools-row] {
      display: flex;
      align-items: center;
      gap: var(--control-gap);
    }

    #proofread-list {
      max-height: var(--proofread-list-max-height);
      overflow-x: hidden;
      overflow-y: auto;
      scroll-snap-type: y proximity;
      scroll-padding-top: var(--panel-row-gap);
    }

    #proofread-list [data-row] {
      position: relative;
      padding: var(--panel-row-gap) var(--panel-pad);
      border-top: 1px solid #ddd;
      scroll-snap-align: start;
    }

    #proofread-list [data-row][data-active="true"] {
      padding-left: var(--proofread-active-pad-left);
      background: linear-gradient(90deg, #fff7cc 0, transparent 60%);
      box-shadow: inset var(--proofread-active-inset) 0 0 #e6b800;
    }

    #proofread-list .proofread-line {
      display: inline-grid;
      grid-template-columns: minmax(0, max-content) auto;
      align-items: center;
      gap: var(--panel-row-gap);
      min-height: var(--proofread-row-height);
      max-width: 100%;
    }

    #proofread-list [data-main] {
      display: grid !important;
      grid-template-columns: minmax(0, var(--proofread-text-max-width)) var(--proofread-field-width);
      align-items: center;
      gap: var(--proofread-main-gap);
      min-width: 0;
      cursor: pointer;
    }

    #proofread-list [data-main] span {
      max-width: var(--proofread-text-max-width);
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #proofread-list [data-main] select,
    #proofread-list [data-main] input,
    #proofread-list [data-select],
    #proofread-list [data-input] {
      width: var(--proofread-field-width);
      min-width: var(--proofread-field-width);
      max-width: var(--proofread-field-width);
      padding-right: calc(var(--control-font-size) * 1.45);
    }

    #proofread-list [data-main] select,
    #proofread-list [data-select] {
      padding-left: calc(var(--control-font-size) * 0.42);
    }

    #proofread-list [data-input] {
      display: none;
    }

    #proofread-list [data-go] {
      display: none !important;
    }

    #proofread-list [data-message] {
      margin-top: var(--proofread-message-margin-top);
      color: #888;
      font-size: var(--proofread-message-font-size);
      line-height: var(--proofread-message-line-height);
      opacity: 0.85;
    }

    #proofread-list [data-empty] {
      padding: var(--panel-row-gap) var(--panel-pad);
      color: #666;
    }

    @media (max-width: 820px) {
      #proofread-panel {
        left: 0 !important;
        right: 0 !important;
        top: 0 !important;
        width: 100vw !important;
        max-width: none !important;
        height: 100vh !important;
        border: 0 !important;
      }

      #proofread-list {
        max-height: calc(
          100vh - var(--proofread-header-height) - var(--panel-pad) * 2 -
            var(--panel-row-gap) * 2
        );
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
};

