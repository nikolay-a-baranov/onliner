import { editor } from "./core/admin.js";
import { widget } from "./core/escape.js";
import { content } from "./core/markup.js";
import { text } from "./core/text.js";

(() => {
  const apply = (element, process) => {
    if (!element) return;
    const before = element.value;
    const after = process(before);
    if (before === after) return;
    element.value = after;
    ["input", "change"].forEach((type) =>
      element.dispatchEvent(new Event(type, { bubbles: true })),
    );
  };

  const contentSafe = (value) => {
    const pad = (part) => String(part).padStart(2, "0");
    const stamp = () => {
      const date = new Date();
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };
    const marker =
      /(?:\n|^)\s*(?:<!--cleanup-debug:[^>]+-->|<p>\[cleanup-debug:[^\]]+\]<\/p>)\s*(?=\n|$)/g;
    const result = content(widget.ensure(value))
      .replace(marker, "")
      .replace(/\s+$/g, "");
    return `${result}\n\n<!--cleanup-debug:${stamp()}-->`;
  };

  editor.html();

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

  apply(document.querySelector("#content"), contentSafe);
})();
