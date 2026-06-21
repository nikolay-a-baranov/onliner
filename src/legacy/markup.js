export const markup = (() => {
const string = (value) => String(value ?? "");
const state = (value, start, end) => ({
  value,
  start,
  end,
});
const editorRange = {
  block(value, start, end = start) {
    const source = string(value);
    const left = source.lastIndexOf("\n", start - 1) + 1;
    const right = source.indexOf("\n", end);
    return {
      start: left,
      end: right < 0 ? source.length : right,
    };
  },
  trim(value, start, end) {
    const source = string(value).slice(start, end);
    const left = source.match(/^\s*/)?.[0].length || 0;
    const right = source.match(/\s*$/)?.[0].length || 0;
    return {
      start: start + left,
      end: end - right,
    };
  },
  inside(value, start, end) {
    const source = string(value).slice(start, end);
    const left = source.match(/^\s*(?:<[^/][^>]*>\s*)*/)?.[0].length || 0;
    const right = source.match(/(?:\s*<\/[^>]+>)*\s*$/)?.[0].length || 0;
    return {
      start: start + left,
      end: end - right,
    };
  },
  value(value, start, end) {
    if (start !== end) return editorRange.trim(value, start, end);
    const block = editorRange.block(value, start, end);
    return editorRange.inside(value, block.start, block.end);
  },
};
const editorTag = {
  data(value, start, name = "") {
    const openTag = `<${name}>`;
    const closeTag = `</${name}>`;
    const left = string(value).slice(0, start);
    const open = left.lastIndexOf(openTag);
    const close = left.lastIndexOf(closeTag);
    if (open < 0 || open < close) return null;
    const right = string(value).slice(start);
    const end = right.indexOf(closeTag);
    if (end < 0) return null;
    return {
      start: open,
      end: start + end + closeTag.length,
      bodyStart: open + openTag.length,
      bodyEnd: start + end,
      openTag,
      closeTag,
    };
  },
  wrapped(value, range, name = "") {
    const source = string(value);
    const index = Math.max(0, Math.min(range.start, source.length - 1));
    const data = editorTag.data(source, index, name);
    if (!data) return false;
    return range.start >= data.bodyStart && range.end <= data.bodyEnd;
  },
  compact(value, name = "") {
    const openTag = `<${name}>`;
    const closeTag = `</${name}>`;
    let next = string(value);
    while (true) {
      const merged = next
        .replace(new RegExp(`${openTag}\\s*${openTag}`, "g"), openTag)
        .replace(new RegExp(`${closeTag}\\s*${closeTag}`, "g"), closeTag);
      if (merged === next) return next;
      next = merged;
    }
  },
  plain(value, start, end) {
    const text = string(value).slice(start, end);
    const data = { value, start, end, text, clean: "", map: [] };
    const tag = /<\/?[^>]+>/y;
    const entity = /&(?:nbsp|#160);/iy;
    let index = 0;
    while (index < text.length) {
      tag.lastIndex = index;
      entity.lastIndex = index;
      const tagged = tag.exec(text);
      const space = entity.exec(text);
      if (tagged) {
        index = tag.lastIndex;
        continue;
      }
      if (space) {
        data.clean += " ";
        data.map.push(start + index);
        index = entity.lastIndex;
        continue;
      }
      data.clean += text[index];
      data.map.push(start + index);
      index += 1;
    }
    return data;
  },
  quoteParts(value = "") {
    const cut = string(value).match(/^\s*/)?.[0].length || 0;
    const text = string(value).slice(cut);
    if (!/^\u2014\s+/u.test(text)) return null;
    const split = text.match(
      /^(\u2014[\s\S]*?,)\s+\u2014\s+([\u0430-\u044f\u0451][\s\S]*?[.!?\u2026])\s+\u2014\s+([\s\S]+)$/u,
    );
    if (split) {
      const first = split[1];
      const third = split[3];
      const thirdStart = text.length - third.length;
      return {
        cut,
        parts: [
          { start: 0, end: first.length },
          { start: thirdStart, end: text.length },
        ],
      };
    }
    const mid = text.match(
      /^(\u2014[\s\S]*?,)\s+\u2014\s+([\u0430-\u044f\u0451][\s\S]*?),\s+(\u2014[\s\S]+)$/u,
    );
    if (mid) {
      const first = mid[1];
      const third = mid[3];
      return {
        cut,
        parts: [
          { start: 0, end: first.length },
          { start: text.length - third.length, end: text.length },
        ],
      };
    }
    const tail =
      text.match(/^(\u2014[\s\S]*?[.!?\u2026\u00bb"'])\s+\u2014\s+[\u0430-\u044f\u0451][\s\S]*$/u) ||
      text.match(/^(\u2014[\s\S]*?,)\s+\u2014\s+[\u0430-\u044f\u0451][\s\S]*$/u);
    if (tail) {
      return {
        cut,
        parts: [{ start: 0, end: tail[1].length }],
      };
    }
    return {
      cut,
      parts: [{ start: 0, end: text.length }],
    };
  },
  emQuote(value = "", start = 0, end = start) {
    if (start !== end) return null;
    const source = string(value);
    const block = editorRange.block(source, start, start);
    const blockText = source.slice(block.start, block.end);
    const text = blockText.replace(/<\/?em>/gi, "");
    const data = editorTag.plain(text, 0, text.length);
    const quote = editorTag.quoteParts(data.clean);
    if (!quote?.parts?.length) return null;
    const spans = quote.parts
      .map((part) => {
        const left = quote.cut + part.start;
        const right = quote.cut + part.end - 1;
        const localStart = data.map[left];
        const localEnd = data.map[right];
        if (localStart === undefined || localEnd === undefined) return null;
        const span = {
          start: localStart,
          end: localEnd + 1,
        };
        while (span.start < span.end && /[\s\u00a0]/.test(text[span.start] || "")) {
          span.start += 1;
        }
        while (
          span.end > span.start &&
          /[\s\u00a0]/.test(text[span.end - 1] || "")
        ) {
          span.end -= 1;
        }
        if (span.start >= span.end) return null;
        return span;
      })
      .filter(Boolean)
      .sort((a, b) => b.start - a.start);
    if (!spans.length) return null;
    const next = spans.reduce(
      (result, span) =>
        result.slice(0, span.start) +
        `<em>${result.slice(span.start, span.end)}</em>` +
        result.slice(span.end),
      text,
    );
    return state(
      source.slice(0, block.start) + next + source.slice(block.end),
      start,
      start,
    );
  },
  toggle(value = "", start = 0, end = start, name = "") {
    const source = string(value);
    if (start === end) {
      const data = editorTag.data(source, start, name);
      if (data) {
        const body = source.slice(data.bodyStart, data.bodyEnd);
        const cursor = Math.max(data.start, start - data.openTag.length);
        return state(
          source.slice(0, data.start) + body + source.slice(data.end),
          cursor,
          cursor,
        );
      }
    }
    if (start !== end) {
      const range = editorRange.trim(source, start, end);
      if (editorTag.wrapped(source, range, name)) {
        return state(source, start, end);
      }
    }
    const range = editorRange.value(source, start, end);
    const text = source.slice(range.start, range.end);
    const openTag = `<${name}>`;
    const closeTag = `</${name}>`;
    const wrapped =
      source.slice(0, range.start) +
      openTag +
      text +
      closeTag +
      source.slice(range.end);
    const compact = editorTag.compact(wrapped, name);
    const cursor = Math.min(start + openTag.length, compact.length);
    return state(compact, cursor, cursor);
  },
};
return {
  em(value) {
    const source = value || {};
    const quote = editorTag.emQuote(source.value, source.start, source.end);
    if (quote) return quote;
    return editorTag.toggle(source.value, source.start, source.end, "em");
  },
  strong(value) {
    const source = value || {};
    return editorTag.toggle(source.value, source.start, source.end, "strong");
  },
};
})();
