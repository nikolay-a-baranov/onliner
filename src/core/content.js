import { entity, widget } from "./escape.js";
import { markup } from "./markup.js";
import { text } from "./text.js";

const helper = {
  pipe(value, ...steps) {
    return steps.reduce((result, step) => step(result), value);
  },
  protect(string) {
    const parts = [];
    const put = (part) => {
      const key = `___PRT${parts.length}___`;
      parts.push(part);
      return key;
    };
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
    const prepared = helper.pipe(
      string,
      markup.breaks,
      (value) => widget.transform(value, (item) => rich(item, true)),
    );
    const protectedText = helper.protect(prepared);
    return protectedText.restore(
      embedded
        ? text.run(protectedText.text)
        : text.typography(protectedText.text),
    );
  },
};

export const rich = (string, embedded = false) => {
  const prepared = process.prepare(string);
  const processed = markup.process(prepared, embedded);
  return process.finish(processed, embedded);
};

export const embed = (string) => entity.encode(rich(string, true));

export const content = (string) => {
  return markup.reconcile.images(rich(string));
};
