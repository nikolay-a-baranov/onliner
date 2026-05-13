import { widget } from "./widget.js";

export const markupSchema = {
  tag: {
    block: [
      "p",
      "div",
      "section",
      "article",
      "aside",
      "blockquote",
      "h[1-6]",
      "ul",
      "ol",
      "li",
      "dl",
      "dt",
      "dd",
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "td",
      "th",
      "figure",
      "figcaption",
    ],
    inline: ["a", "span", "strong", "em", "b", "i", "u", "s", "sup", "sub"],
    single: ["br", "hr", "img"],
    shortcode: {
      onliner: {
        misc: ["onliner-[a-z][a-z0-9-]*"],
        widget: widget.tag.list,
      },
      media: [
        "video",
        "threads",
        "instagram",
        "tiktok",
        "telegram",
        "before-after",
      ],
    },
  },
};
