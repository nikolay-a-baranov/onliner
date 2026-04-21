(() => {
  const content = document.getElementById("content"),
        excerpt = document.getElementById("excerpt"),
        textarea = document.createElement("textarea");
  textarea.innerHTML = (content.value || "").split(/\n\s*\n/).find((s) => s.trim()) || "";
  const lead = textarea.value
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t\u00A0]+/g, " ")
    .replace(/\s*\n\s*/g, " ")
    .trim();
  if (excerpt.value.trim() && !confirm("Заменить цитату?")) return;
  excerpt.value = lead;
  excerpt.dispatchEvent(new Event("input", { bubbles: true }));
  excerpt.dispatchEvent(new Event("change", { bubbles: true }));
  if (lead.length > 444) alert("Цитата длинновата");
})();
