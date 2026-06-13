const tree = {
  user: {
    superuser: {
      id: "superuser",
      title: "Суперрежим",
      emoji: "👺",
    },
    service: {
      id: "service",
      title: "Сервис",
      emoji: "🛠️",
    },
  },
  role: {
    author: {
      id: "author",
      title: "Журналист",
      emoji: "🦈",
    },
    editor: {
      id: "editor",
      title: "Корректор",
      emoji: "🐝",
    },
    prodAuthor: {
      id: "prod-author",
      title: "Журналист",
      favicon: "onliner.by",
    },
    prodEditor: {
      id: "prod-editor",
      title: "Корректор",
      favicon: "onliner.by",
    },
  },
  workflow: {
    prep: {
      id: "prep",
      title: "Препарация",
      emoji: "🧨",
    },
    fields: {
      id: "fields",
      title: "Поля",
      emoji: "🗂️",
    },
    params: {
      id: "params",
      title: "Параметры",
      emoji: "📢",
    },
  },
  action: {
    punct: {
      id: "punct",
      title: "Знаки",
      emoji: "🖊️",
    },
    motion: {
      id: "motion",
      title: "Движение",
      emoji: "🛹",
    },
    tokens: {
      id: "tokens",
      title: "Токены",
      emoji: "🖋️",
    },
    markup: {
      id: "markup",
      title: "Вёрстка",
      emoji: "🖍️",
    },
    content: {
      id: "content",
      title: "Блоки",
      emoji: "🖌️",
    },
    search: {
      id: "search",
      title: "Поиск",
      emoji: "🌐",
    },
  },
  surface: {
    madtest: {
      id: "madtest",
      title: "Тест",
      emoji: "⚗️",
    },
    common: {
      id: "common",
      title: "Общее",
      emoji: "",
    },
  },
};

const flatten = (value) =>
  Object.values(value).reduce((items, item) => {
    if (!item || typeof item !== "object") return items;
    if (item.id) return [...items, item];
    return [...items, ...flatten(item)];
  }, []);
export const groups = {
  tree,
  byId: Object.fromEntries(flatten(tree).map((item) => [item.id, item])),
  meta(id) {
    return groups.byId[String(id || "")] || {};
  },
};
