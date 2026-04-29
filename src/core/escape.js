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

const readable = (text) => text.replace(/\\"/g, '"');

export const encode = (text) =>
  Array.from(text, (char) => `&#${char.codePointAt(0)};`).join("");

export const encoded = (text) =>
  /&#\d+;|&#x[0-9a-f]+;|&lt;|&gt;|&quot;|&amp;#/i.test(text);

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

const each = (data, fn) => {
  if (typeof data.text === "string") {
    data.text = fn(data.text);
  }
  data.variants?.forEach((item) => {
    if (typeof item?.description === "string") {
      item.description = fn(item.description);
    }
  });
};

export const map = (text, fn) => {
  text = convert(text, "onliner-promo-widget", (data) => each(data, fn));
  text = convert(text, "onliner-vote", (data) => each(data, fn));
  return text;
};

export const fields = (text) => {
  const list = [];
  map(text, (value) => {
    list.push(value);
    return value;
  });
  return list;
};
export const toggle = (text, fn) => {
  const decodeMode = fields(text).some(encoded);
  return map(text, (value) =>
    decodeMode ? fn(readable(decode(value))) : encode(value),
  );
};
