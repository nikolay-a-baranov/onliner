import { dom } from "./core/dom.js";
import { cms } from "./core/cms.js";
import { content } from "./pipe/content.js";
import { text } from "./pipe/text.js";
import { widget } from "./core/widget.js";
import { icon } from "./core/icon.js";

(() => {
  const credit = {
    name: /[A-ZА-ЯЁ][A-Za-zА-Яа-яЁё-]+(?:\s+[A-ZА-ЯЁ][A-Za-zА-Яа-яЁё-]+){1,2}/,
    markers: {
      art: /^(.*?)(?:\s*,\s*|\s+)(иллюстрац(?:ия|ии)|коллаж|обложка)\s*[:—-]?\s*(.+)$/i,
      photo: /^(.*?)(?:\s*,\s*|\s+)(фото)\s*[:—-]?\s*(.+)$/i,
    },
    clean(value) {
      return String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[.,;:\s]+$/g, "");
    },
    role(label, value) {
      const map = {
        коллаж: "Коллаж",
        иллюстрация: "Иллюстрация",
        иллюстрации: "Иллюстрации",
      };
      const head = map[label.toLowerCase()] || label;
      const tail = credit.clean(value);
      return tail ? `${head}: ${tail}` : "";
    },
    splitExplicit(source) {
      const string = credit.clean(source);
      if (!string) return null;
      const photo = string.match(credit.markers.photo);
      if (photo) {
        const next = {
          source: credit.clean(photo[1]),
          photo: credit.clean(photo[3]),
        };
        return next.source && next.photo ? next : null;
      }
      const art = string.match(credit.markers.art);
      if (art) {
        const next = {
          source: credit.clean(art[1]),
          photo: credit.role(art[2], art[3]),
        };
        return next.source && next.photo ? next : null;
      }
      return null;
    },
    splitImplicit(source) {
      const string = credit.clean(source);
      if (!string) return null;
      const match = string.match(
        new RegExp(`^(${credit.name.source})([.,;:]\\s*.+)$`),
      );
      if (!match) return null;
      const next = {
        source: credit.clean(match[1]),
        photo: credit.clean(match[2].replace(/^[.,;:]\s*/, "")),
      };
      return next.source && next.photo ? next : null;
    },
    split(source) {
      return credit.splitExplicit(source) || credit.splitImplicit(source);
    },
    merge(current, next) {
      const left = credit.clean(current);
      const right = credit.clean(next);
      if (!left) return right;
      if (!right || left === right) return left;
      return `${right}. ${left}`;
    },
    normalize(source, photo, video = "") {
      const current = {
        source: credit.clean(source),
        photo: credit.clean(photo),
        video: credit.clean(video),
      };
      const split = credit.split(current.source);
      if (!split) {
        return {
          ...current,
          changed:
            current.source !== String(source || "").trim() ||
            current.photo !== String(photo || "").trim() ||
            current.video !== String(video || "").trim(),
        };
      }
      const next = {
        source: split.source,
        photo: credit.merge(current.photo, split.photo),
        video: current.video,
      };
      return {
        ...next,
        changed:
          next.source !== String(source || "").trim() ||
          next.photo !== String(photo || "").trim() ||
          next.video !== String(video || "").trim(),
      };
    },
  };
  const editorMode = cms.editor.getMode();
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
    encode() {
      cms.editor.runContent((value) => widget.ensure(value));
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
  cms.editor.runHtmlBridge((value) => cleanup.content(value), {
    mode: editorMode,
  });
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
