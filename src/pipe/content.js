import { entity } from "../core/escape.js";
import { widget } from "../core/widget.js";
import { cms } from "../core/cms.js";
import { markup as contentMarkup } from "./markup.js";
import { text } from "./text.js";

const helper = {
  pipe(value, ...steps) {
    return steps.reduce((result, step) => step(result), value);
  },
  shortcode: {
    space(string) {
      const parts = [];
      const put = (part) => {
        const key = `___SCT${parts.length}___`;
        parts.push(part);
        return key;
      };
      const restore = (value) =>
        String(value || "").replace(/___SCT(\d+)___/g, (_, index) => parts[+index]);
      const pattern = new RegExp(contentMarkup.pattern.tag.shortcode.all, "g");
      const protectedText = String(string || "").replace(pattern, put);
      return restore(
        protectedText
          .replace(/([^\n])(___SCT\d+___)/g, "$1\n\n$2")
          .replace(/(___SCT\d+___)([^\n])/g, "$1\n\n$2")
          .replace(/\n{3,}/g, "\n\n"),
      );
    },
  },
  widget: {
    space(string) {
      return String(string || "")
        .replace(
          new RegExp(`([^\\n])(${widget.pattern.block.any})`, "gi"),
          "$1\n\n$2",
        )
        .replace(
          new RegExp(`(${widget.pattern.block.any})([^\\n])`, "gi"),
          "$1\n\n$3",
        )
        .replace(/\n{3,}/g, "\n\n");
    },
  },
  compact: {
    dl(string) {
      return contentMarkup.html.compact.dl(string);
    },
    shortcode(string) {
      return helper.shortcode.space(string);
    },
    list(string) {
      return helper.pipe(string, helper.block.list, helper.block.items);
    },
    run(string) {
      return helper.pipe(string, helper.compact.list, helper.compact.dl);
    },
  },
  block: {
    tags: {
      frame: "(?:blockquote|dl|img|ul|ol|h[1-6])",
      close: "(?:blockquote|dl|ul|ol|h[1-6])",
    },
    shortcode: {
      protect(string) {
        const parts = [];
        const put = (part) => {
          const key = `___BLK${parts.length}___`;
          parts.push(part);
          return key;
        };
        return {
          text: String(string || "").replace(
            new RegExp(contentMarkup.pattern.tag.shortcode.all, "g"),
            put,
          ),
          restore(value) {
            return String(value || "").replace(
              /___BLK(\d+)___/g,
              (_, index) => parts[+index],
            );
          },
        };
      },
    },
    list(string) {
      const parts = [];
      const put = (part) => {
        const key = `___LST${parts.length}___`;
        parts.push(part);
        return key;
      };
      const restore = (value) =>
        String(value || "").replace(/___LST(\d+)___/g, (_, index) => parts[+index]);
      const normalized = String(string || "").replace(
        /<(ul|ol)\b[^>]*>[\s\S]*?<\/\1>/gi,
        (value) =>
          put(
            String(value || "")
              .replace(/\r\n?/g, "\n")
              .replace(/<(ul|ol)\b([^>]*)>\s*/i, "<$1$2>\n")
              .replace(/\s*<\/(ul|ol)>$/i, "\n</$1>")
              .replace(/<\/li>\s*<li\b([^>]*)>/gi, "</li>\n<li$1>")
              .replace(/\n{2,}/g, "\n"),
          ),
      );
      return restore(
        normalized
          .replace(/([^\n])(___LST\d+___)/g, "$1\n\n$2")
          .replace(/([^\n])\n(___LST\d+___)/g, "$1\n\n$2")
          .replace(/(___LST\d+___)([^\n])/g, "$1\n\n$2")
          .replace(/(___LST\d+___)\n([^\n])/g, "$1\n\n$2")
          .replace(/\n{3,}/g, "\n\n"),
      );
    },
    items(string) {
      return String(string || "")
        .replace(/<(ul|ol)\b([^>]*)>\s*<li\b([^>]*)>/gi, "<$1$2>\n\t<li$3>")
        .replace(/<\/li>\s*<li\b([^>]*)>/gi, "</li>\n\t<li$1>")
        .replace(/(^|\n)\s*(<li\b)/gi, "$1\t$2");
    },
    normalize(string) {
      const protectedText = helper.block.shortcode.protect(string);
      return protectedText.restore(
        helper.pipe(
          protectedText.text,
        (value) =>
          value.replace(
            /<(em|strong)>\s*(<blockquote\b[^>]*>)([\s\S]*?)(<\/blockquote>)\s*<\/\1>/gi,
            "$2<$1>$3</$1>$4",
          ),
        (value) =>
          value.replace(
            new RegExp(`([^\\n])\\s*(<${helper.block.tags.frame}\\b[^>]*>)`, "gi"),
            "$1\n\n$2",
          ),
        (value) =>
          value.replace(
            new RegExp(`(<\\/${helper.block.tags.close}>|<img\\b[^>]*>)\\s*([^\\n])`, "gi"),
            "$1\n\n$2",
          ),
        (value) =>
          value
            .replace(/(<a\b[^>]*>)\n+(<img\b[^>]*>)/gi, "$1$2")
            .replace(/(<img\b[^>]*>)\n+(<\/a>)/gi, "$1$2"),
        helper.compact.run,
        (value) => value.replace(/\n{3,}/g, "\n\n"),
        ),
      );
    },
  },
  readable(string) {
    const parts = [];
    const marker = widget.regex.marker.fullLine;
    const editable = /^(title|text|label|description)$/i;
    const normalizeReadableField = (value) => {
      const source = value
        .replace(/\r\n?/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n[ \t]+/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      if (!source) return "";
      return source
        .split(/\n{2,}/)
        .map((item) => rich(item, true).trim())
        .filter(Boolean)
        .join("\n\n");
    };
    const processBody = (body) => {
      const lines = body.replace(/\r\n?/g, "\n").split("\n");
      const output = [];
      let mode = null;
      let buffer = [];
      const flush = () => {
        if (!buffer.length) return;
        const value = buffer.join("\n");
        if (mode && editable.test(mode)) {
          const processed = normalizeReadableField(value);
          if (processed) output.push(...processed.split("\n"));
        } else {
          output.push(...buffer);
        }
        buffer = [];
      };
      lines.forEach((line) => {
        const match = line.match(marker);
        if (match) {
          flush();
          mode = match[1];
          output.push(line);
          return;
        }
        buffer.push(line);
      });
      flush();
      return contentMarkup.html.readable(output.join("\n"));
    };
    string = string.replace(
      widget.regex.block.any,
      (full, tag, attrs, body) => {
        if (!widget.readable(body)) return full;
        const key = `___WGT${parts.length}___`;
        parts.push(`[${tag}${attrs}]${processBody(body)}[/${tag}]`);
        return key;
      },
    );
    return {
      text: string,
      restore(value) {
        return value.replace(/___WGT(\d+)___/g, (_, index) => parts[+index]);
      },
    };
  },
  protect(string) {
    const parts = [];
    const put = (part) => {
      const key = `___PRT${parts.length}___`;
      parts.push(part);
      return key;
    };
    const widgetMarker = widget.regex.marker.fullLine;
    string = string.replace(widget.regex.block.plain, (full, tag, body) => {
      if (!widget.regex.marker.full.test(body)) {
        return full;
      }
      const open = put(`[${tag}]`);
      const close = put(`[/${tag}]`);
      const safeBody = body
        .split("\n")
        .map((line) => (widgetMarker.test(line) ? put(line) : line))
        .join("\n");
      return `${open}${safeBody}${close}`;
    });
    string = string
      .replace(/\[([a-z][a-z0-9-]*)(?:[^\]]*)\][\s\S]*?\[\/\1\]/g, put)
      .replace(/<[^>]*>/g, put)
      .replace(/\[(\/)?([a-z][a-z0-9-]*)(?:[^\]]*)\]/g, put);
    return {
      text: string,
      restore: (value) =>
        value.replace(/___PRT(\d+)___/g, (_, index) => parts[+index]),
    };
  },
};
const process = {
  prepare(string) {
    const protectedText = helper.protect(string);
    protectedText.text = text.whitespace(protectedText.text);
    return protectedText.restore(protectedText.text);
  },
  finish(string, embedded) {
    const prepared = helper.pipe(string, contentMarkup.breaks, (value) =>
      widget.transform.run(value, (item) => rich(item, true)),
    );
    const protectedText = helper.protect(prepared);
    return helper.pipe(
      helper.widget.space(
        helper.compact.shortcode(
          protectedText.restore(
            embedded
              ? text.run(protectedText.text)
              : helper.pipe(
                  protectedText.text,
                  text.typography,
                  text.punctuation,
                  text.spelling,
                  text.grammar,
                  text.collocations,
                  text.numbers,
                  (value) => text.units(value, "short"),
                  text.money,
                  text.nbsp,
                ),
          ),
        ),
      ),
      helper.block.normalize,
    );
  },
};
export const rich = (string, embedded = false) => {
  const readable = helper.readable(contentMarkup.embed.normalize(string));
  const prepared = process.prepare(readable.text);
  const processed = contentMarkup.process(
    prepared,
    embedded,
    cms.layout.value(),
  );
  return readable.restore(process.finish(processed, embedded));
};
export const embedContent = (string) => entity.encode(rich(string, true));
export const normalizeBlocks = (string) => helper.block.normalize(string);
export const finalize = (string) => {
  const protectedText = helper.protect(string);
  protectedText.text = text.nbsp(text.finalize(protectedText.text));
  return helper.block.normalize(protectedText.restore(protectedText.text));
};
export const content = (string) => {
  return contentMarkup.link.normalizeTarget(
    contentMarkup.reconcile.images(rich(string)),
  );
};
