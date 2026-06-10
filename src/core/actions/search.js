import { search as searchTool } from "../search.js";

export const createSearch = (api) => {
  const open = (source = "") => {
    const element = api.element();
    if (!element) return false;
    return searchTool.open(element, source);
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
