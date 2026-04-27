const getCode = (card) => {
  const href = card.getAttribute("href") || "";
  return href.startsWith("javascript:") ? href : "";
};

const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.left = "-9999px";
    area.style.top = "0";
    document.body.appendChild(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, area.value.length);
    const done = document.execCommand("copy");
    area.remove();
    return done;
  }
};

document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("click", async (event) => {
    event.preventDefault();
    const code = getCode(card);
    if (!code) return;
    const done = await copy(code);
    const icon = card.textContent;
    card.textContent = done ? "✅" : "❌";
    setTimeout(() => {
      card.textContent = icon;
    }, 700);
  });
});
