export const search = {
  field: {
    valid(value) {
      if (!value) return false;
      if (typeof value.value !== "string") return false;
      if (typeof value.selectionStart !== "number") return false;
      if (typeof value.selectionEnd !== "number") return false;
      return true;
    },
  },
  range: {
    block(value, start, end) {
      const left = String(value || "").lastIndexOf("\n", start - 1) + 1;
      const right = String(value || "").indexOf("\n", end);
      return {
        start: left,
        end: right < 0 ? String(value || "").length : right,
      };
    },
    word(value, start) {
      const before = String(value || "").slice(0, start).match(/[А-Яа-яA-Za-zЁё0-9]+$/);
      const after = String(value || "").slice(start).match(/^[А-Яа-яA-Za-zЁё0-9]+/);
      return {
        start: before ? start - before[0].length : start,
        end: start + (after ? after[0].length : 0),
      };
    },
    kinopoisk(value, start) {
      const base = search.range.word(value, start);
      if (base.start === base.end) return base;
      const block = search.range.block(value, start, start);
      const text = String(value || "").slice(block.start, block.end);
      const token = /[A-Za-zА-Яа-яЁё]+(?:-[A-Za-zА-Яа-яЁё]+)*/g;
      const list = [...text.matchAll(token)].map((item) => ({
        start: block.start + item.index,
        end: block.start + item.index + item[0].length,
        text: item[0],
      }));
      if (!list.length) return base;
      const pivot = list.findIndex(
        (item) => item.start < base.end && item.end > base.start,
      );
      if (pivot < 0) return base;
      const upper = (string) => /^[A-ZА-ЯЁ]/.test(string);
      if (!upper(list[pivot].text)) return base;
      let left = pivot;
      let right = pivot;
      while (left > 0) {
        const gap = String(value || "").slice(
          list[left - 1].end,
          list[left].start,
        );
        if (!/^[ \u00a0]+$/.test(gap) || !upper(list[left - 1].text)) break;
        left -= 1;
      }
      while (right < list.length - 1) {
        const gap = String(value || "").slice(
          list[right].end,
          list[right + 1].start,
        );
        if (!/^[ \u00a0]+$/.test(gap) || !upper(list[right + 1].text)) break;
        right += 1;
      }
      return {
        start: list[left].start,
        end: list[right].end,
      };
    },
    current(element, source = "") {
      if (!search.field.valid(element)) return null;
      const start = element.selectionStart;
      const end = element.selectionEnd;
      if (start !== end) return { start, end };
      if (source === "kinopoisk" || source === "google") {
        return search.range.kinopoisk(element.value, start);
      }
      return search.range.word(element.value, start);
    },
  },
  service: {
    url(value, source) {
      const string = String(value || "").trim();
      if (!string) return "";
      const query = encodeURIComponent(string);
      const exact = encodeURIComponent(`"${string}"`);
      if (source === "google") {
        return `https://www.google.com/search?igu=1&q=${exact}`;
      }
      if (source === "gramota") {
        return `https://gramota.ru/poisk?query=${query}&mode=spravka`;
      }
      if (source === "kinopoisk") {
        return `https://www.kinopoisk.ru/index.php?kp_query=${query}`;
      }
      return "";
    },
  },
  open(element, source) {
    if (!search.field.valid(element)) return false;
    const range = search.range.current(element, source);
    if (!range) return false;
    if (range.start === range.end) return false;
    const string = element.value.slice(range.start, range.end).trim();
    if (!string) return false;
    const url = search.service.url(string, source);
    if (!url) return false;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    window.open(url, "_blank", "noopener,noreferrer");
    element.selectionStart = start;
    element.selectionEnd = end;
    element.focus();
    return true;
  },
};
