import { markup } from "./markup.js";

export const excerpt = {
  limit: 444,
  threshold: 125,

  lead(string) {
    return markup.strip(
      (string || "").split(/\n\s*\n/).find((part) => part.trim()) || "",
    );
  },

  percent(value, max = this.limit) {
    return Math.round((((value || "").trim().length || 0) / max) * 100);
  },

  empty(value) {
    return !(value || "").trim();
  },

  long(value, threshold = this.threshold, max = this.limit) {
    return this.percent(value, max) > threshold;
  },

  message(value, max = this.limit) {
    const percent = this.percent(value, max);
    if (percent <= 100) return `Цитата и так хороша (${percent}%)`;
    if (percent <= this.threshold) return `Цитата так себе (${percent}%)`;
    return `Цитата совсем плоха (${percent}%)`;
  },

  state(value, content, threshold = this.threshold, max = this.limit) {
    const current = (value || "").trim();
    const lead = this.lead(content);
    const percent = this.percent(current, max);
    const empty = !current;
    const long = percent > threshold;
    return {
      current,
      lead,
      percent,
      empty,
      long,
      invalid: empty || long,
      message: this.message(current, max),
    };
  },

  style(field, max = this.limit) {
    if (!field) return null;
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
      field.insertAdjacentElement("afterend", counter);
    }

    const paint = () => {
      const value = field.value || "";
      const percent = this.percent(value, max);
      const ratio = percent / 100;
      const tone =
        ratio <= 1
          ? `hsl(${220 - 100 * Math.max(0, Math.min((ratio - 0.75) / 0.25, 1))} 60% 45%)`
          : `hsl(${120 - 120 * Math.max(0, Math.min((ratio - 1) / 0.25, 1))} 75% 45%)`;
      const width =
        (1 + Math.max(0, 1 - Math.abs(ratio - 1) / 0.1)).toFixed(2) + "px";
      field.style.outlineWidth = width;
      field.style.outlineStyle = "solid";
      field.style.outlineColor = tone;
      field.style.transition = "outline-color .2s ease, outline-width .2s ease";
      counter.style.color = tone;
      counter.style.width = field.offsetWidth + "px";
      counter.textContent = `${value.length}/${max} · ${percent}%`;
    };

    field.removeEventListener("input", field._excerptPaint);
    field._excerptPaint = paint;
    field.addEventListener("input", paint);
    paint();
    return paint;
  },
};
