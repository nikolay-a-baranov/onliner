import { dom } from "./core/dom.js";
import { cms } from "./core/cms.js";
import { credit } from "./pipe/credit.js";
import { content } from "./pipe/content.js";
import { text } from "./pipe/text.js";
import { widget } from "./core/widget.js";
import { icon } from "./core/icon.js";

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
    content: (value) => text.nbsp(text.finalize(content(value))),
    credits() {
      const source = document.querySelector("#post_source");
      const photo = document.querySelector("#photo_author");
      const video = document.querySelector("#video_author");
      if (!source || !photo) return;
      const next = credit.normalize(
        source.value,
        photo.value,
        video?.value || "",
      );
      if (!next.changed) return;
      dom.input(source, next.source);
      dom.input(photo, next.photo);
      if (video) dom.input(video, next.video);
    },
  };
  const submit = {
    lock: false,
    pass: "cleanupSubmitPass",
    mark: "cleanupSubmitGuard",
    content() {
      return document.querySelector("#content");
    },
    encode() {
      apply(submit.content(), widget.ensure);
    },
    async vpn() {
      await cms.vpn.ensure("🛑 VPN");
    },
    allowed(button) {
      return button.dataset[submit.pass] === "1";
    },
    open(button) {
      button.dataset[submit.pass] = "1";
      button.click();
      delete button.dataset[submit.pass];
    },
    async guard(event, button) {
      if (submit.allowed(button)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (submit.lock) return;
      submit.lock = true;
      submit.encode();
      try {
        await submit.vpn();
        submit.lock = false;
        submit.open(button);
        return;
      } catch (error) {
        dom.alert(error.message);
      }
      submit.lock = false;
    },
    bind(selector) {
      const button = document.querySelector(selector);
      if (!button || button.dataset[submit.mark] === "1") return;
      button.dataset[submit.mark] = "1";
      button.addEventListener(
        "click",
        (event) => submit.guard(event, button),
        true,
      );
    },
    run() {
      submit.bind("#save-post");
      submit.bind("#publish");
    },
  };
  cms.editor.html();
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
  cms.admin.lazyTool({
    id: "onliner-reader-button",
    icon: icon.emoji("🕶️", "reader"),
    html: true,
    from: "cleanup.js",
    to: "reader.js",
    exists: ["reader-button"],
  });
  submit.run();
})();
