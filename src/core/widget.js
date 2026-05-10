import { entity } from "./escape.js";
import { inline } from "./markup.js";

export const widget = (() => {
  const schema = {
    "onliner-promo-widget": {
      visit(data, fn) {
        if (typeof data.text === "string") {
          data.text = fn(data.text);
        }
      },
    },
    "onliner-vote": {
      visit(data, fn) {
        data.variants?.forEach((item) => {
          if (typeof item?.description === "string") {
            item.description = fn(item.description);
          }
        });
      },
    },
  };

  const read = (string, { normalizeInline = true } = {}) => {
    const decoded = entity
      .decode(string)
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
    return normalizeInline ? inline.normalize(decoded) : decoded;
  };

  const map = (string, fn) =>
    Object.entries(schema).reduce(
      (result, [tag, { visit }]) =>
        result.replace(
          new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`, "g"),
          (full, raw) => {
            try {
              const data = JSON.parse(raw);
              visit(data, fn);
              return `[${tag}]${JSON.stringify(data)}[/${tag}]`;
            } catch {
              return full;
            }
          },
        ),
      string,
    );

  return {
    readable(string) {
      if (!string) return false;
      return /\[(onliner-promo-widget|onliner-vote)\][\s\S]*?@(title|text|label|variants|item\d*|description|meta)/i.test(
        string,
      );
    },
    decode(string, fn = (value) => value, options = {}) {
      return map(string, (value) => fn(read(value, options)));
    },
    encode(string) {
      return map(string, entity.encode);
    },
    ensure(string) {
      return map(string, (value) =>
        entity.encoded(value) ? value : entity.encode(value),
      );
    },
    transform(string, fn, options = {}) {
      return map(string, (value) => entity.encode(fn(read(value, options))));
    },
    toggle(string, fn) {
      return this.encoded(string)
        ? this.decode(string, fn)
        : this.encode(string);
    },
    encoded(string) {
      let found = false;
      map(string, (value) => {
        if (entity.encoded(value)) found = true;
        return value;
      });
      return found;
    },
  };
})();
