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
  range(element) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    if (start !== end) return query.trim(value, { start, end });
    const left = value
      .slice(0, start)
      .match(/[0-9A-Za-z\u0410-\u042F\u0430-\u044F\u0401\u0451.\u0301-\u2011\u2013\u2014]+$/u);
    const right = value
      .slice(start)
      .match(/^[0-9A-Za-z\u0410-\u042F\u0430-\u044F\u0401\u0451.\u0301-\u2011\u2013\u2014]+/u);
    return query.trim(value, {
      start: left ? start - left[0].length : start,
      end: start + (right ? right[0].length : 0),
    });
  },
  text(element) {
    const range = query.range(element);
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
    const value = query.text(element);
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
      gramota,
      kinopoisk,
    },
  };
};
