import { editor } from "./core/admin.js";
import { excerpt } from "./core/excerpt.js";

(() => {
  editor.html();

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
      if (!confirm(`${state.message}. Заменить на лид?`)) {
        return;
      }
    }

    element.value = state.lead;
    if (innerWidth > 768) {
      element.focus();
      element.select();
    }
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    if (paint) paint();
  }, 50);
})();
