export const entity = {
  decode(string) {
    const node = document.createElement("textarea");
    let value = string;
    let snap;
    do {
      snap = value;
      node.innerHTML = value;
      value = node.value;
    } while (value !== snap);
    return value;
  },
  encode(string) {
    return Array.from(string, (char) => `&#${char.codePointAt(0)};`).join("");
  },
  encoded(string) {
    return /&#\d+;|&#x[0-9a-f]+;|&lt;|&gt;|&quot;|&amp;#/i.test(string);
  },
};

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

  const read = (string) => entity.decode(string).replace(/\\"/g, '"');

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
    decode(string, fn = (value) => value) {
      return map(string, (value) => fn(read(value)));
    },
    encode(string) {
      return map(string, entity.encode);
    },
    ensure(string) {
      return map(string, (value) =>
        entity.encoded(value) ? value : entity.encode(value),
      );
    },
    transform(string, fn) {
      return map(string, (value) => entity.encode(fn(read(value))));
    },
    toggle(string, fn) {
      return this.encoded(string) ? this.decode(string, fn) : this.encode(string);
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
