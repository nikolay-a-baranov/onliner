import { entity } from "./escape.js";
import { markup } from "./markup.js";
import { text } from "./text.js";
import { widget } from "./widget.js";

const helper = {
  pipe(value, ...steps) {
    return steps.reduce((result, step) => step(result), value);
  },
  readable(string) {
    const parts = [];
    const marker =
      /^@(title|text|label|variants|item\d*|description|meta)\s*$/i;
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
      return markup.html.readable(output.join("\n"));
    };
    string = string.replace(
      /\[(onliner-promo-widget|onliner-vote)([^\]]*)\]([\s\S]*?)\[\/\1\]/gi,
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
    const widgetMarker =
      /^\s*@(title|text|label|variants|item\d*|description|meta)\s*$/i;
    string = string.replace(
      /\[(onliner-promo-widget|onliner-vote)\]([\s\S]*?)\[\/\1\]/gi,
      (full, tag, body) => {
        if (
          !/@(?:title|text|label|variants|item\d*|description|meta)\b/i.test(
            body,
          )
        ) {
          return full;
        }
        const open = put(`[${tag}]`);
        const close = put(`[/${tag}]`);
        const safeBody = body
          .split("\n")
          .map((line) => (widgetMarker.test(line) ? put(line) : line))
          .join("\n");
        return `${open}${safeBody}${close}`;
      },
    );
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
    const prepared = helper.pipe(string, markup.breaks, (value) =>
      widget.transform(value, (item) => rich(item, true)),
    );
    const protectedText = helper.protect(prepared);
    return protectedText.restore(
      embedded
        ? text.run(protectedText.text)
        : helper.pipe(
            protectedText.text,
            text.typography,
            text.punctuation,
            text.numbers,
          ),
    );
  },
};

export const rich = (string, embedded = false) => {
  const readable = helper.readable(string);
  const prepared = process.prepare(readable.text);
  const processed = markup.process(prepared, embedded);
  return readable.restore(process.finish(processed, embedded));
};

export const embed = (string) => entity.encode(rich(string, true));

export const content = (string) => {
  return markup.link.normalizeTarget(markup.reconcile.images(rich(string)));
};
