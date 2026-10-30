const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const moduleUrl = (file) => pathToFileURL(path.join(__dirname, "..", file)).href;

const run = async () => {
  let events = 0;
  class SmokeInput {
    constructor(tagName = "INPUT") {
      this.tagName = tagName;
      this.current = "";
    }
    dispatchEvent() {
      events += 1;
    }
  }
  Object.defineProperty(SmokeInput.prototype, "value", {
    get() {
      return this.current;
    },
    set(value) {
      this.current = String(value);
    },
  });
  class SmokeTextarea extends SmokeInput {
    constructor() {
      super("TEXTAREA");
    }
  }
  class SmokeSelect extends SmokeInput {
    constructor() {
      super("SELECT");
    }
  }
  global.HTMLInputElement = SmokeInput;
  global.HTMLTextAreaElement = SmokeTextarea;
  global.HTMLSelectElement = SmokeSelect;
  const { design } = await import(moduleUrl("src/core/surface/design.js"));
  const { field } = await import(moduleUrl("src/core/dom.js"));
  const { ui } = await import(moduleUrl("src/core/surface/ui.js"));
  const { styles } = await import(moduleUrl("src/core/surface/styles.js"));
  const input = ui.controls.input({
    value: 0,
    placeholder: '"<',
    classes: "smoke-input",
    attrs: ' disabled aria-disabled="true"',
  });
  assert.equal(
    input,
    '<input class="ui-field smoke-input" type="text" placeholder="&quot;&lt;" value="0" disabled aria-disabled="true">',
  );
  assert.equal(
    ui.controls.textarea({ value: "<b>&", placeholder: "Текст" }),
    '<textarea class="ui-field" placeholder="Текст">&lt;b&gt;&amp;</textarea>',
  );
  assert.equal(
    ui.controls.select({
      content: '<option value="one">Один</option>',
      classes: "smoke-select",
      attrs: " disabled",
    }),
    '<select class="ui-select smoke-select" disabled><option value="one">Один</option></select>',
  );
  assert.equal(
    ui.controls.option({
      value: '"<',
      label: "<Один>",
      selected: true,
    }),
    '<option value="&quot;&lt;" selected>&lt;Один&gt;</option>',
  );
  assert.equal(
    ui.controls.optgroup({
      label: '2026"<',
      content: '<option value="one">Один</option>',
    }),
    '<optgroup label="2026&quot;&lt;"><option value="one">Один</option></optgroup>',
  );
  assert.equal(
    ui.controls.button({
      content: "OK",
      title: '"<',
      classes: "smoke-button",
      attrs: " disabled",
    }),
    '<button class="button button-emoji button-icon ui-button smoke-button" title="&quot;&lt;" disabled><span class="ui-icon-box"><span class="ui-icon-content">OK</span></span></button>',
  );
  const tokens = design.run();
  assert.match(tokens, /--surface-control-select-shape-radius: 999px;/);
  assert.match(tokens, /--surface-control-select-chevron-width: 10px;/);
  assert.match(tokens, /--surface-control-select-state-hover-background: var\(--surface-button-active-hint-bg\);/);
  assert.match(tokens, /--surface-control-select-state-focus-ring: 0 0 0 1px var\(--surface-button-text\);/);
  assert.match(tokens, /--surface-selection-glow-text-shadow: 0 0 12px currentColor;/);
  assert.match(tokens, /--surface-selection-glow-media-filter: drop-shadow\(0 0 1px rgba\(255,255,255,\.95\)\) drop-shadow\(0 0 5px rgba\(255,255,255,\.56\)\);/);
  assert.match(tokens, /--surface-selection-glow-emoji-filter: drop-shadow\(0 0 1px rgba\(255,255,255,\.55\)\) drop-shadow\(0 0 3px rgba\(255,255,255,\.25\)\);/);
  assert.match(tokens, /--surface-analytics-picker-gap: 24px;/);
  assert.match(tokens, /--surface-analytics-divider: rgba\(255,255,255,\.12\);/);
  assert.match(tokens, /--surface-analytics-panel-radius: 18px;/);
  assert.match(tokens, /--surface-analytics-cluster-background: rgba\(255,255,255,\.09\);/);
  assert.match(tokens, /--surface-analytics-cluster-border: rgba\(255,255,255,\.18\);/);
  assert.match(tokens, /--surface-analytics-control-height: 34px;/);
  assert.match(tokens, /--surface-analytics-chart-primary-active: #f2cf8a;/);
  const css = styles.host.theme();
  assert.match(css, /width: var\(--surface-control-select-chevron-width\);/);
  assert.match(css, /border-radius: var\(--surface-control-select-shape-radius\);/);
  assert.match(css, /background: var\(--surface-control-select-state-hover-background\);/);
  assert.match(css, /box-shadow: var\(--surface-control-select-state-focus-ring\);/);
  assert.match(css, /\[data-ui-selection-glow\]\[data-active="true"\]/);
  assert.match(css, /\[data-ui-selection-glow\]:hover/);
  assert.match(css, /\[data-ui-selection-glow\]:focus-visible img/);
  assert.match(css, /text-shadow: var\(--surface-selection-glow-text-shadow\) !important;/);
  assert.match(css, /filter: var\(--surface-selection-glow-media-filter\) !important;/);
  assert.match(css, /img\.emoji-icon \{\s*filter: var\(--surface-selection-glow-emoji-filter\) !important;/);
  assert.match(css, /\[data-ui-scrollbar="hidden"\]/);
  const surface = { dataset: {} };
  ui.surface.sync(surface, { surface: "toolbar" });
  assert.equal(surface.dataset.uiScrollbar, "hidden");
  ui.surface.scrollbar.reset(surface);
  assert.equal(surface.dataset.uiScrollbar, undefined);
  const elements = [new SmokeInput(), new SmokeTextarea(), new SmokeSelect()];
  elements.forEach((element, index) => {
    assert.equal(field.set(element, index), true);
    assert.equal(element.value, String(index));
  });
  let frameSets = 0;
  class FrameInput extends SmokeInput {}
  Object.defineProperty(FrameInput.prototype, "value", {
    get() {
      return this.current;
    },
    set(value) {
      frameSets += 1;
      this.current = String(value);
    },
  });
  const frame = new FrameInput();
  frame.ownerDocument = {
    defaultView: {
      HTMLInputElement: FrameInput,
      HTMLTextAreaElement: SmokeTextarea,
      HTMLSelectElement: SmokeSelect,
    },
  };
  assert.equal(field.set(frame, "frame"), true);
  assert.equal(frame.value, "frame");
  assert.equal(frameSets, 1);
  assert.equal(events, 0);
  console.log("surface control primitives: ok");
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
