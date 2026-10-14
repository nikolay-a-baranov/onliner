const nbsp = "\u00a0";
const terminal = /[?!…]$/;
const ending = /[.!?…]$/;
const normalizeDashes = (value) => value.replace(/(^|[ ,.!?…:])[-–—][ \u00a0]+(?=[А-Яа-яЁё])/g, "$1— ");
const speech = {
  parse(value) {
    const parts = [];
    const joins = [];
    let remaining = value;
    while (true) {
      const split = /^(.*?)(,|[?!…]) — ([^—]+?)([,.:]) — (.+)$/.exec(remaining);
      if (!split) break;
      const [, first, mark, author, join, rest] = split;
      if (!first || !/^[а-яё]/i.test(author.trim())) return null;
      if (join === "," && (mark !== "," || !/^[а-яё]/.test(rest))) return null;
      if (join !== "," && !/^[А-ЯЁ]/.test(rest)) return null;
      parts.push(first + mark);
      joins.push(` — ${author}${join} —${nbsp}`);
      remaining = rest;
    }
    const after = /^(.*?), — ([а-яё][^—]*[.!?…])$/.exec(remaining);
    if (after && !/[.!?…]\s+[А-ЯЁ]/.test(after[2].slice(0, -1))) {
      parts.push(after[1] + ",");
      return { parts, joins, after: ` — ${after[2]}` };
    }
    if (!ending.test(remaining) || remaining.includes(" — ")) return null;
    parts.push(remaining);
    return { parts, joins, after: "" };
  },
  render(data, mode, italic) {
    const parts = data.parts.map((part, index) => {
      const first = index === 0;
      const last = index === data.parts.length - 1;
      let content = mode === "quote" ? part.replace(/«/g, "„").replace(/»/g, "“") : part;
      if (first) content = mode === "dash" ? `—${nbsp}${content}` : `«${content}`;
      if (last && mode === "quote") {
        if (data.after) content = `${content.slice(0, -1)}»,`;
        else if (content.endsWith(".")) content = `${content.slice(0, -1)}».`;
        else content += "»";
      }
      return italic ? `<em>${content}</em>` : content;
    });
    return parts.map((part, index) => part + (data.joins[index] || "")).join("") + data.after;
  },
  decode(value) {
    const dash = /^[—–-][ \u00a0]+(.+)$/.exec(value);
    if (dash) return { mode: "dash", body: dash[1] };
    const after = /^«(.+)»,( — [а-яё][^—]*[.!?…])$/.exec(value);
    if (after) return { mode: "quote", body: `${after[1]},${after[2]}`, ended: true };
    const quote = /^«(.+)»([.]?)$/.exec(value);
    if (!quote) return null;
    return { mode: "quote", body: quote[1] + quote[2] };
  },
};
export const qswapText = (text, cursor = 0) => {
  if (/[\r\n]/.test(text)) return null;
  const leading = text.match(/^[ \t]*/)?.[0] || "";
  const trailing = text.match(/[ \t]*$/)?.[0] || "";
  const source = text.slice(leading.length, text.length - trailing.length);
  if (!source || cursor < leading.length || cursor > text.length - trailing.length) return null;
  if (/<(?!\/?em>)[^>]*>/i.test(source)) return null;
  const opening = (source.match(/<em>/g) || []).length;
  const closing = (source.match(/<\/em>/g) || []).length;
  if (opening !== closing) return null;
  const italic = opening > 0;
  const plain = source.replace(/<\/?em>/g, "");
  const decoded = speech.decode(normalizeDashes(plain));
  if (!decoded) return null;
  const body = decoded.mode === "quote" ? decoded.body.replace(/„/g, "«").replace(/“/g, "»") : decoded.body;
  const parsed = speech.parse(body);
  if (!parsed || (decoded.mode === "quote" && Boolean(parsed.after) !== Boolean(decoded.ended))) return null;
  if (italic) {
    if (opening !== parsed.parts.length) return null;
    const actual = [...source.matchAll(/<em>(.*?)<\/em>/g)].map((match) => match[1]);
    if (actual.length !== opening) return null;
    const expected = [...speech.render(parsed, decoded.mode, true).matchAll(/<em>(.*?)<\/em>/g)].map((match) => match[1]);
    const normalize = (value) => normalizeDashes(value).replace(/—[ \u00a0]+/g, `—${nbsp}`);
    if (actual.some((part, index) => normalize(part) !== normalize(expected[index]))) return null;
  }
  const nextMode = decoded.mode === "dash" ? "quote" : "dash";
  const result = leading + speech.render(parsed, nextMode, italic) + trailing;
  if (result === text) return null;
  const delta = result.length - text.length;
  return { text: result, cursor: Math.max(leading.length, Math.min(result.length - trailing.length, cursor + delta)), delta };
};
