import { encode, encoded, map } from "./core/escape.js";
import { content } from "./core/markup.js";
import { text } from "./core/text.js";

(() => {
  document.querySelector("#content-html")?.click();

  const emit = (element) => {
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const clean = (element, process) => {
    const source = element.value || "";
    const result = process(source);
    if (result === source) return;
    element.value = result;
    emit(element);
  };

  const contentSafe = (value) =>
    content(map(value, (text) => (encoded(text) ? text : encode(text))));

  [
    "#title",
    "input[name='rotation_titles[]']",
    "#favourite_title",
    "input[name='seo_title']",
    "#photo_author",
    "#video_author",
    "#post_source",
    "#excerpt",
  ].forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      clean(element, text);
    });
  });
  document.querySelectorAll("#content").forEach((element) => {
    clean(element, contentSafe);
  });
})();
