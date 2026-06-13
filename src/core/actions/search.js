import { search as searchTool } from "../search.js";

export const createSearch = (api) => {
  const queryRange = (element) => {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    if (start !== end) return null;
    const left = value
      .slice(0, start)
      .match(/[0-9A-Za-zА-Яа-яЁё.́-‑–—]+$/u);
    const right = value
      .slice(start)
      .match(/^[0-9A-Za-zА-Яа-яЁё.́-‑–—]+/u);
    return {
      start: left ? start - left[0].length : start,
      end: start + (right ? right[0].length : 0),
    };
  };
  const withQuery = (element, run) => {
    const range = queryRange(element);
    if (!range || range.start === range.end) return run();
    const start = element.selectionStart;
    const end = element.selectionEnd;
    element.setSelectionRange(range.start, range.end);
    const result = run();
    element.setSelectionRange(start, end);
    return result;
  };
  const open = (source = "") => {
    const element = api.element();
    if (!element) return false;
    return withQuery(element, () => searchTool.open(element, source));
  };
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
