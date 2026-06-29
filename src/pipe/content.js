import { entity } from "../core/escape.js";
import { widget } from "../core/widget.js";
import { cms } from "../core/cms.js";
import { markup as contentMarkup } from "./markup.js";
import { text } from "./text.js";

const helper = {
  pipe(value, ...steps) {
    return steps.reduce((result, step) => step(result), value);
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
    return protectedText.restore(
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
          ),
    )
      .replace(/<\/li>\s*<li\b([^>]*)>/gi, "</li>\n\t<li$1>")
      .replace(/(^|\n)\s*(<li\b)/gi, "$1\t$2");
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
export const content = (string) => {
  return contentMarkup.link.normalizeTarget(
    contentMarkup.reconcile.images(rich(string)),
  );
};
