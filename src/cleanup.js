import { debug, editor } from "./core/admin.js";
import { field } from "./core/fields.js";
import { widget } from "./core/escape.js";
import { content } from "./core/markup.js";
import { text } from "./core/text.js";

(() => {
  const apply = (element, transform) => {
    if (!element) return;
    const before = element.value;
    const after = transform(before);
    if (before === after) return;
    element.value = after;
    ["input", "change"].forEach((type) =>
      element.dispatchEvent(new Event(type, { bubbles: true })),
    );
  };

  const cleanup = {
    text: text.run,
    content: (value) =>
      debug.cleanup.append(text.nbsp(content(widget.ensure(value)))),
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
      .forEach((element) => apply(element, cleanup.text)),
  );

  apply(document.querySelector("#content"), cleanup.content);
})();

