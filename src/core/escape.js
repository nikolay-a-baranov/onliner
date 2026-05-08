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
