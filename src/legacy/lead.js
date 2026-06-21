import { dom } from "./core/dom.js";
import { cms } from "./core/cms.js";
import { excerpt } from "./excerpt.js";

(() => {
  cms.editor.html();
  setTimeout(() => {
    const textarea = document.getElementById("content");
    const element = document.getElementById("excerpt");
    if (!textarea || !element) return;
    const paint = excerpt.style(element);
    const state = excerpt.state(element.value, textarea.value);
    if (!state.empty) {
      try {
        navigator.clipboard.writeText(element.value);
      } catch {}
      if (!confirm(`${state.message}. Заменить на лид?`)) return;
    }
    element.value = state.lead;
    if (innerWidth > 768) {
      element.focus();
      element.select();
    }
    dom.dispatch(element, "input");
    dom.dispatch(element, "change");
    if (paint) paint();
  }, 50);
})();
