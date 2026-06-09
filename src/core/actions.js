import { transform } from "./transform.js";
import { embed as embedCore } from "./embed.js";
import { more } from "./more.js";
import { block } from "./block.js";
import { edit } from "./edit.js";

export const actions = {
  element() {
    const element = document.getElementById("content");
    if (!element) return null;
    if (element.tagName !== "TEXTAREA" && element.tagName !== "INPUT")
      return null;
    return element;
  },
  apply(run) {
    const element = actions.element();
    if (!element) return false;
    return edit.apply(element, run);
  },
  insert(value, caretOffset = null) {
    const element = actions.element();
    if (!element) return false;
    return block.insert(element, value, caretOffset);
  },
  embed() {
    return navigator.clipboard
      .readText()
      .then((value) => {
        const element = actions.element();
        const shortcode = embedCore.build(value);
        if (!element || !shortcode) return false;
        return block.insert(element, shortcode);
      })
      .catch(() => false);
  },
  has(id) {
    return String(id || "").startsWith("author.");
  },
  run(id) {
    if (id === "author.heading") {
      return actions.apply((value) =>
        transform.heading(value.value, {
          start: value.start,
          end: value.end,
        }),
      );
    }
    if (id === "author.emphasis") {
      return actions.apply((value) =>
        transform.emphasis(value.value, {
          start: value.start,
          end: value.end,
        }),
      );
    }
    if (id === "author.quote") {
      return actions.apply((value) =>
        transform.quote(value.value, {
          start: value.start,
          end: value.end,
        }),
      );
    }
    if (id === "author.more") {
      const element = actions.element();
      if (!element) return false;
      return more.run(element);
    }
    if (id === "author.embed") {
      actions.embed();
      return true;
    }
    if (id === "author.photo") return actions.insert("ФОТО ", 5);
    if (id === "author.video") return actions.insert("[video][/video]", 7);
    if (id === "author.cleanup") {
      return actions.apply((value) =>
        transform.cleanup(value.value, {
          start: value.start,
          end: value.end,
        }),
      );
    }
    return false;
  },
};
