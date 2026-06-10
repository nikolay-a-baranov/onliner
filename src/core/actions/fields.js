import { cms } from "../cms.js";

export const createFields = () => {
  const excerpt = {
    limit: 444,
    threshold: 125,
    content() {
      const element = document.getElementById("content");
      if (!element) return null;
      if (element.tagName !== "TEXTAREA" && element.tagName !== "INPUT")
        return null;
      return element;
    },
    field() {
      const element = document.getElementById("excerpt");
      if (!element) return null;
      if (element.tagName !== "TEXTAREA" && element.tagName !== "INPUT")
        return null;
      return element;
    },
    decode(value = "") {
      const field = document.createElement("textarea");
      field.innerHTML = String(value || "");
      return field.value;
    },
    strip(value = "") {
      return excerpt.decode(
        String(value || "")
          .replace(/<script\b[\s\S]*?<\/script>/gi, "")
          .replace(/<style\b[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;|&#160;/gi, " "),
      );
    },
    normalize(value = "") {
      return String(value || "")
        .replace(/[\s\u00a0]+/g, " ")
        .trim();
    },
    first(value = "") {
      const source = String(value || "");
      const beforeMore = source.split(/<!--more-->/i)[0] || source;
      const paragraph = beforeMore.match(/<p\b[^>]*>[\s\S]*?<\/p>/i)?.[0];
      if (paragraph) return paragraph;
      return (
        beforeMore.split(/\n\s*\n/).find((item) =>
          excerpt.normalize(excerpt.strip(item)),
        ) || ""
      );
    },
    lead(value = "") {
      return excerpt.normalize(excerpt.strip(excerpt.first(value)));
    },
    percent(value = "", max = excerpt.limit) {
      return Math.round(((String(value || "").trim().length || 0) / max) * 100);
    },
    message(value = "", max = excerpt.limit) {
      const percent = excerpt.percent(value, max);
      if (percent <= 100) return `Цитата и так хороша (${percent}%)`;
      if (percent <= excerpt.threshold) return `Цитата так себе (${percent}%)`;
      return `Цитата совсем плоха (${percent}%)`;
    },
    state(value = "", content = "") {
      const current = String(value || "").trim();
      const lead = excerpt.lead(content);
      const percent = excerpt.percent(current);
      const empty = !current;
      const long = percent > excerpt.threshold;
      return {
        current,
        lead,
        percent,
        empty,
        long,
        invalid: empty || long,
        message: excerpt.message(current),
      };
    },
    paint(field) {
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
        const percent = excerpt.percent(value);
        const ratio = percent / 100;
        const tone =
          ratio <= 1
            ? `hsl(${220 - 100 * Math.max(0, Math.min((ratio - 0.75) / 0.25, 1))} 60% 45%)`
            : `hsl(${120 - 120 * Math.max(0, Math.min((ratio - 1) / 0.25, 1))} 75% 45%)`;
        const width =
          (1 + Math.max(0, 1 - Math.abs(ratio - 1) / 0.1)).toFixed(2) +
          "px";
        field.style.outlineWidth = width;
        field.style.outlineStyle = "solid";
        field.style.outlineColor = tone;
        field.style.transition =
          "outline-color .2s ease, outline-width .2s ease";
        counter.style.color = tone;
        counter.style.width = `${field.offsetWidth}px`;
        counter.textContent = `${value.length}/${excerpt.limit} · ${percent}%`;
      };
      field.removeEventListener("input", field._excerptPaint);
      field._excerptPaint = paint;
      field.addEventListener("input", paint);
      paint();
      return paint;
    },
    emit(field) {
      if (!field) return;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    },
    replace(field, value = "") {
      if (!field) return false;
      if (!value) return false;
      if (field.value === value) return false;
      field.value = value;
      excerpt.emit(field);
      return true;
    },
    apply() {
      const content = excerpt.content();
      const field = excerpt.field();
      if (!content || !field) return false;
      const paint = excerpt.paint(field);
      const state = excerpt.state(field.value, content.value);
      if (!state.lead) return false;
      if (!state.empty) {
        try {
          navigator.clipboard.writeText(field.value);
        } catch {}
        if (!confirm(`${state.message}. Заменить на лид?`)) return false;
      }
      const changed = excerpt.replace(field, state.lead);
      if (innerWidth > 768) {
        field.focus();
        field.select();
      }
      if (paint) paint();
      return changed;
    },
    run() {
      cms.editor.html();
      window.setTimeout(() => excerpt.apply(), 50);
      return true;
    },
  };
  return {
    fields: {
      excerpt,
    },
  };
};
