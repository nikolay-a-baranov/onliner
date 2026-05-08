import { editor } from "./core/admin.js";

(() => {
  const key = "__sanitizeState";
  const state = (window[key] ??= { sanitized: false, records: {} });
  const emit = (element) => {
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const apply = (element, fn) => {
    if (!element) return;
    const original = element.value;
    const updated = fn(original);
    if (original === updated) return;
    element.value = updated;
    emit(element);
  };
  const paint = (element, changed, sanitized) => {
    if (!changed) {
      element.style.outline = "";
      return;
    }
    element.style.outline = sanitized
      ? "2px solid seagreen"
      : "2px solid crimson";
  };
  const footer = {
    telegram: {
      remove(text) {
        return text.replace(
          /<p\b[^>]*>\s*(?:<strong>)?\s*Есть о чем рассказать\?[\s\S]*?newsonliner_bot[\s\S]*?(?:<\/strong>)?\s*<\/p>/gi,
          "",
        );
      },
      add() {
        return '<p style="text-align: right;"><strong>Есть о чем рассказать? Пишите в наш <a href="https://t.me/newsonliner_bot" target="_blank">телеграм-бот</a>. Это анонимно и быстро</strong></p>';
      },
    },
    copyright: {
      remove(text) {
        return text.replace(
          /<p\b[^>]*>\s*(?:<span\b[^>]*>)?\s*(?:<strong>)?\s*Перепечатка текста и фотографий[\s\S]*?mailto:ga@onliner\.by[\s\S]*?<\/p>/gi,
          "",
        );
      },
      add() {
        return '<p style="text-align: right;"><span style="font-size: small;"><strong>Перепечатка текста и фотографий Onlíner без разрешения редакции запрещена. <a href="mailto:ga@onliner.by">ga@onliner.by</a></strong></span></p>';
      },
    },
    layout() {
      return (
        document.querySelector("#layout_select") ||
        document.querySelector('[name="layout"]')
      );
    },
    copyrighted() {
      const layout = this.layout();
      return layout && layout.value !== "news";
    },
    apply(text) {
      text = this.telegram.remove(text);
      text = this.copyright.remove(text);
      text = text.trimEnd() + "\n" + this.telegram.add();
      if (this.copyrighted()) text += "\n" + this.copyright.add();
      return text;
    },
  };
  const content = {
    wrap() {
      return document.querySelector("#wp-content-wrap");
    },
    mode() {
      const wrap = this.wrap();
      return {
        html: !!wrap?.classList.contains("html-active"),
        tmce: !!wrap?.classList.contains("tmce-active"),
      };
    },
    apply(transform) {
      const mode = this.mode();
      if (!mode.html) editor.html();
      apply(document.querySelector("#content"), (text) => transform(text));
      if (mode.tmce) editor.tmce({ click: true });
    },
  };
  const title = {
    elements: [
      "#title",
      "input[name='rotation_titles[]']",
      "#favourite_title",
      "input[name='seo_title']",
    ],
    normalize(text) {
      let quotes = 0;
      return text
        .replace(/\u00A0/g, "\u0020")
        .replace(/\u0022/g, () =>
          quotes++ % 4 < 2
            ? quotes % 2
              ? "\u00ab"
              : "\u00bb"
            : quotes % 2
              ? "\u201e"
              : "\u201c",
        )
        .replace(/\u0027/g, "\u2019")
        .replace(/\s*[\u002d\u2013\u2014\u2212]\s*/g, "\u0020\u2014\u0020")
        .replace(/[\u0020\u0009]+/g, "\u0020")
        .trim();
    },
    collect() {
      return this.elements.flatMap((selector) =>
        Array.from(document.querySelectorAll(selector)).map(
          (element, index) => {
            const id = `${selector}::${index}`;
            const record = (state.records[id] ??= { original: element.value });
            record.element = element;
            record.sanitized = this.normalize(record.original);
            return record;
          },
        ),
      );
    },
  };
  const repaint = () => {
    title.collect().forEach((record) => {
      const { element, original, sanitized } = record;
      const changed = original !== sanitized;
      const value = state.sanitized ? sanitized : original;
      if (element.value !== value) {
        element.value = value;
        emit(element);
      }
      paint(element, changed, state.sanitized);
    });
  };
  const records = title.collect();
  if (!state.sanitized) {
    records.forEach((record) => {
      record.original = record.element.value;
      record.sanitized = title.normalize(record.original);
    });
  }
  state.sanitized = !state.sanitized;
  repaint();
  content.apply((text) => footer.apply(text));
  window.scrollTo({ top: 0, behavior: "smooth" });
  [0, 50, 150].forEach((delay) => setTimeout(repaint, delay));
})();
