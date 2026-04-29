import { strip } from "./markup.js";

export const excerptLimit = 444;

export const leadFromContent = (text) =>
  strip((text || "").split(/\n\s*\n/).find((part) => part.trim()) || "");

export const excerptLabel = (len, limit = excerptLimit) => {
  const percent = Math.round((len / limit) * 100);
  if (percent <= 100) return `Цитата и так хороша (${percent}%)`;
  if (percent <= 125) return `Цитата так себе (${percent}%)`;
  return `Цитата совсем плоха (${percent}%)`;
};

const excerptColor = (len, limit = excerptLimit) => {
  const ratio = len / limit;
  if (ratio <= 1) {
    const t = Math.max(0, Math.min((ratio - 0.75) / 0.25, 1));
    return `hsl(${220 - 100 * t} 60% 45%)`;
  }
  const t = Math.max(0, Math.min((ratio - 1) / 0.25, 1));
  return `hsl(${120 - 120 * t} 75% 45%)`;
};

const excerptWidth = (len, limit = excerptLimit) =>
  (
    1 + Math.max(0, 1 - Math.abs(len / limit - 1) / 0.1)
  ).toFixed(2) + "px";

export const styleExcerpt = (excerpt, limit = excerptLimit) => {
  if (!excerpt) return null;

  let counter = document.getElementById("excerpt-counter");
  if (!counter) {
    counter = document.createElement("div");
    counter.id = "excerpt-counter";
    counter.style.cssText = [
      "margin-top:5px",
      "font:10px Consolas,Monaco,monospace",
      "text-align:right",
      "white-space:nowrap",
      "padding:0",
      "box-sizing:border-box",
    ].join(";");
    excerpt.insertAdjacentElement("afterend", counter);
  }

  const paint = () => {
    const len = excerpt.value.length;
    const percent = Math.round((len / limit) * 100);
    const color = excerptColor(len, limit);
    excerpt.style.outlineWidth = excerptWidth(len, limit);
    excerpt.style.outlineStyle = "solid";
    excerpt.style.outlineColor = color;
    excerpt.style.transition = "outline-color .2s ease, outline-width .2s ease";
    counter.style.color = color;
    counter.style.width = excerpt.offsetWidth + "px";
    counter.textContent = `${len}/${limit} · ${percent}%`;
  };

  excerpt.removeEventListener("input", excerpt._excerptPaint);
  excerpt._excerptPaint = paint;
  excerpt.addEventListener("input", paint);
  paint();
  return paint;
};
