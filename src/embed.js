import { cms } from "./core/cms.js";
import { embed } from "./core/embed.js";

(() => {
  const run = (value = "") => {
    const shortcode = embed.build(value);
    if (shortcode) cms.editor.insert.block(shortcode);
  };
  navigator.clipboard
    .readText()
    .then(run)
    .catch(() => run(""));
})();
