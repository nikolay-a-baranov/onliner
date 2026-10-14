const query = {
  valid(element) {
    if (!element) return false;
    if (typeof element.value !== "string") return false;
    if (typeof element.selectionStart !== "number") return false;
    if (typeof element.selectionEnd !== "number") return false;
    return true;
  },
  trim(value, range) {
    const source = String(value || "").slice(range.start, range.end);
    const tail = source.match(/[.,:;!?\u2026]+$/u)?.[0] || "";
    return {
      start: range.start,
      end: range.end - tail.length,
    };
  },
  token: String.raw`[0-9A-Za-z\u0410-\u042F\u0430-\u044F\u0401\u0451\u0301]+(?:[.\u002D\u2010\u2011][0-9A-Za-z\u0410-\u042F\u0430-\u044F\u0401\u0451\u0301]+)*`,
  space: String.raw`[\u0020\u00A0]+`,
  capital(value) {
    return /^[A-Z\u0410-\u042F\u0401]/u.test(String(value || ""));
  },
  word(value, start) {
    const left = value
      .slice(0, start)
      .match(new RegExp(`${query.token}$`, "u"));
    const right = value
      .slice(start)
      .match(new RegExp(`^${query.token}`, "u"));
    return {
      start: left ? start - left[0].length : start,
      end: start + (right ? right[0].length : 0),
    };
  },
  scope(value, cursor) {
    const source = String(value || "");
    const boundary = /\n|<\/?(?:address|article|aside|blockquote|div|h[1-6]|header|footer|li|main|ol|p|section|table|td|th|tr|ul)\b[^>]*>/gi;
    let start = 0;
    let end = source.length;
    for (const match of source.matchAll(boundary)) {
      const after = match.index + match[0].length;
      if (after <= cursor) {
        start = after;
        continue;
      }
      if (match.index >= cursor) {
        end = match.index;
        break;
      }
    }
    return { start, end };
  },
  phrase(value, range) {
    const word = value.slice(range.start, range.end);
    if (!query.capital(word)) return range;
    const token = query.token;
    const space = query.space;
    const previous = new RegExp(`(${token})(${space})$`, "u");
    const next = new RegExp(`^(${space})(${token})`, "u");
    const expand = (range) => {
      const before = value.slice(0, range.start).match(previous);
      const after = value.slice(range.end).match(next);
      const start = before && query.capital(before[1])
        ? range.start - before[0].length
        : range.start;
      const end = after && query.capital(after[2])
        ? range.end + after[0].length
        : range.end;
      if (start === range.start && end === range.end) return range;
      return expand({ start, end });
    };
    return expand(range);
  },
  nearby(value, range) {
    const word = value.slice(range.start, range.end);
    if (!query.capital(word)) return range;
    const previous = value
      .slice(0, range.start)
      .match(new RegExp(`(${query.token})(${query.space})$`, "u"));
    const next = value
      .slice(range.end)
      .match(new RegExp(`^(${query.space})(${query.token})`, "u"));
    return {
      start: previous && query.capital(previous[1])
        ? range.start - previous[0].length
        : range.start,
      end: next && query.capital(next[2])
        ? range.end + next[0].length
        : range.end,
    };
  },
  quoted(value, cursor) {
    const scope = query.scope(value, cursor);
    const source = value.slice(scope.start, scope.end);
    const point = cursor - scope.start;
    const pairs = [
      ["\u00ab", "\u00bb"],
      ["\u201e", "\u201c"],
      ["\u201c", "\u201d"],
      ["\u0022", "\u0022"],
    ];
    return pairs.reduce((current, [opening, closing]) => {
      if (opening === closing) {
        const count = source.slice(0, point).split(opening).length - 1;
        if (count % 2 === 0) return current;
      }
      const start = source.lastIndexOf(opening, point - 1);
      const end = source.indexOf(closing, point);
      if (start < 0 || end < point || end <= start) return current;
      if (
        opening !== closing &&
        source.lastIndexOf(closing, point - 1) > start
      ) {
        return current;
      }
      const candidate = {
        start: scope.start + start + opening.length,
        end: scope.start + end,
      };
      if (!current || candidate.start > current.start) return candidate;
      return current;
    }, null);
  },
  kinopoisk(value, cursor) {
    return (
      query.quoted(value, cursor) ||
      query.nearby(value, query.word(value, cursor))
    );
  },
  range(element, { kinopoisk = false } = {}) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    if (start !== end) return query.trim(value, { start, end });
    if (kinopoisk) return query.trim(value, query.kinopoisk(value, start));
    return query.trim(value, query.phrase(value, query.word(value, start)));
  },
  text(element, options = {}) {
    const range = query.range(element, options);
    if (!range || range.start === range.end) return "";
    return element.value.slice(range.start, range.end).trim();
  },
};

const service = {
  url(value, source = "") {
    const string = String(value || "").trim();
    if (!string) return "";
    const queryValue = encodeURIComponent(string);
    const exact = encodeURIComponent(`"${string}"`);
    if (source === "google") {
      return `https://www.google.com/search?igu=1&q=${exact}`;
    }
    if (source === "yandex") {
      return `https://ya.ru/search/?text=${queryValue}`;
    }
    if (source === "gramota") {
      return `https://gramota.ru/poisk?query=${queryValue}&mode=spravka`;
    }
    if (source === "kinopoisk") {
      return `https://www.kinopoisk.ru/index.php?kp_query=${queryValue}`;
    }
    return "";
  },
};

export const search = {
  open(element, source = "", options = {}) {
    if (!query.valid(element)) return false;
    const value = query.text(element, { kinopoisk: source === "kinopoisk" });
    if (!value) return false;
    const url = service.url(value, source);
    if (!url) return false;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const select =
      typeof options.select === "function"
        ? options.select
        : (element, start, end) => {
            element.selectionStart = start;
            element.selectionEnd = end;
          };
    window.open(url, "_blank", "noopener,noreferrer");
    select(element, start, end);
    element.focus?.();
    return true;
  },
};

export const createSearch = (api) => {
  const open = (source = "") =>
    search.open(api.element(), source, { select: api.select });
  const google = {
    run() {
      return open("google");
    },
  };
  const yandex = {
    run() {
      return open("yandex");
    },
  };
  const gramota = {
    run() {
      return open("gramota");
    },
  };
  const kinopoisk = {
    run() {
      return open("kinopoisk");
    },
  };
  return {
    search: {
      google,
      yandex,
      gramota,
      kinopoisk,
    },
  };
};
