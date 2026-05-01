export const decode = (text) => {
  const node = document.createElement("textarea");
  let value = text;
  let snap;
  do {
    snap = value;
    node.innerHTML = value;
    value = node.value;
  } while (value !== snap);
  return value;
};

export const encode = (text) =>
  Array.from(text, (char) => `&#${char.codePointAt(0)};`).join("");

export const encoded = (text) =>
  /&#\d+;|&#x[0-9a-f]+;|&lt;|&gt;|&quot;|&amp;#/i.test(text);

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

const convert = (text, tag, fn) =>
  text.replace(
    new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`, "g"),
    (full, raw) => {
      try {
        const data = JSON.parse(raw);
        fn(data);
        return `[${tag}]${JSON.stringify(data)}[/${tag}]`;
      } catch {
        return full;
      }
    },
  );

const map = (text, fn) =>
  Object.entries(schema).reduce(
    (result, [name, { visit }]) =>
      convert(result, name, (data) => visit(data, fn)),
    text,
  );

const fields = (text) => {
  const list = [];
  map(text, (value) => {
    list.push(value);
    return value;
  });
  return list;
};

const hasEncoded = (text) => fields(text).some(encoded);

export const widget = {
  decode: (text, fn = (value) => value) =>
    map(text, (value) => fn(decode(value).replace(/\\"/g, '"'))),
  encode: (text) => map(text, encode),
  ensure: (text) =>
    map(text, (value) => (encoded(value) ? value : encode(value))),
  transform: (text, fn) =>
    map(text, (value) => encode(fn(decode(value).replace(/\\"/g, '"')))),
  hasEncoded,
  toggle: (text, fn) =>
    hasEncoded(text) ? widget.decode(text, fn) : widget.encode(text),
};
