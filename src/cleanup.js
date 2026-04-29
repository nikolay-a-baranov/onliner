import { encode, encoded, map } from "./core/escape.js";
import { content } from "./core/markup.js";
import { text } from "./core/text.js";

(() => {
  const query = (selector) => document.querySelector(selector);
  const emit = (element) =>
    ["input", "change"].forEach((type) =>
      element.dispatchEvent(new Event(type, { bubbles: true })),
    );
  const apply = (element, process) => {
    if (!element) return;
    const before = element.value;
    const after = process(before);
    if (before === after) return;
    element.value = after;
    emit(element);
  };
  const pad2 = (value) => String(value).padStart(2, "0");
  const stamp = () => {
    const date = new Date();
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
  };
  const debugMarker =
    /(?:\n|^)\s*(?:<!--cleanup-debug:[^>]+-->|<p>\[cleanup-debug:[^\]]+\]<\/p>)\s*(?=\n|$)/g;
  const contentSafe = (value) => {
    const result = content(
      map(value, (text) => (encoded(text) ? text : encode(text))),
    )
      .replace(debugMarker, "")
      .replace(/\s+$/g, "");
    return `${result}\n\n<!--cleanup-debug:${stamp()}-->`;
  };

  const html = query("#content-html");
  if (html) html.click();

  [
    "#title",
    "input[name='rotation_titles[]']",
    "#favourite_title",
    "input[name='seo_title']",
    "#post_source",
    "#photo_author",
    "#video_author",
    "#excerpt",
  ].forEach((selector) =>
    document
      .querySelectorAll(selector)
      .forEach((element) => apply(element, text)),
  );

  apply(query("#content"), contentSafe);
})();
