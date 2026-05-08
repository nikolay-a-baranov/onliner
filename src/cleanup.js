import { editor } from "./core/admin.js";
import { content } from "./core/content.js";
import { credit } from "./core/credit.js";
import { field } from "./core/fields.js";
import { widget } from "./core/widget.js";
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
    content: (value) => text.nbsp(content(widget.ensure(value))),
    credits() {
      const source = document.querySelector("#post_source");
      const photo = document.querySelector("#photo_author");
      const video = document.querySelector("#video_author");
      if (!source || !photo) return;

      const next = credit.normalize(source.value, photo.value, video?.value || "");
      if (!next.changed) return;

      field.input(source, next.source);
      field.input(photo, next.photo);
      if (video) field.input(video, next.video);
    },
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
  cleanup.credits();
})();
