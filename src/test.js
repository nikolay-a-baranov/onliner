import { cms } from "./core/cms.js";
import { markup } from "./pipe/markup.js";

(() => {
  cms.editor.runContent((value) => markup.embed.normalize(value));
})();
