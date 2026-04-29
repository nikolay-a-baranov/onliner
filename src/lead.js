import {
  excerptLabel,
  leadFromContent,
  styleExcerpt,
} from "./core/excerpt.js";

(() => {
  document.querySelector("#content-html")?.click();

  const content = document.getElementById("content");
  const excerpt = document.getElementById("excerpt");
  const paint = styleExcerpt(excerpt);

  if (excerpt.value.trim()) {
    try {
      navigator.clipboard.writeText(excerpt.value);
    } catch {}
    if (!confirm(`${excerptLabel(excerpt.value.length)}. Заменить цитату?`)) {
      return;
    }
  }

  excerpt.value = leadFromContent(content.value);
  if (innerWidth > 768) excerpt.focus();
  excerpt.dispatchEvent(new Event("input", { bubbles: true }));
  excerpt.dispatchEvent(new Event("change", { bubbles: true }));
  paint?.();
})();
