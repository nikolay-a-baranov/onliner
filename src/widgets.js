import { encode, encoded, fields, map, toggle } from "./core/escape.js";
import { clean } from "./core/markup.js";

(() => {
  const html = document.getElementById("content-html");
  const tmce = document.getElementById("content-tmce");
  const content = document.getElementById("content");
  if (!content) return;
  const emit = () => {
    content.dispatchEvent(new Event("input", { bubbles: true }));
    content.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const run = (fn) => {
    const source = content.value;
    const result = fn(source);
    if (result !== source) {
      content.value = result;
      emit();
    }
  };
  const hook = () => {
    if (!tmce || tmce.dataset.widgetHook === "1") return;
    tmce.dataset.widgetHook = "1";
    tmce.addEventListener(
      "click",
      () => {
        if (!fields(content.value).some(encoded)) {
          run((text) => map(text, encode));
        }
      },
      true,
    );
  };
  if (html) html.click();
  setTimeout(() => {
    run((text) => toggle(text, clean));
    hook();
  }, 0);
})();
