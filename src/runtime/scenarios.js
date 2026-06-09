const superuser = {
  users: ["baranov"],
};
const adminPostRole = {
  roles: ["editor", "author"],
};
const adminRole = {
  roles: ["author"],
};
const editorRole = {
  roles: ["editor"],
};
const only = (commands, exclude = []) =>
  commands.filter((command) => {
    const id = typeof command === "string" ? command : command.id;
    return !exclude.includes(id);
  });
const authorCommands = [
  { id: "author", ...adminRole },
  "lead",
  "toc",
  { id: "author.cleanup", ...adminRole },
];
const markupCommands = [
  { id: "author.emphasis", ...adminRole },
  { id: "author.heading", ...adminRole },
  { id: "author.quote", ...adminRole },
];
const blocksCommands = [
  { id: "author.embed", ...adminRole },
  { id: "author.photo", ...adminRole },
  { id: "author.video", ...adminRole },
  { id: "author.more", ...adminRole },
];
const editorCommands = [
  { id: "editor", ...editorRole },
  "reader",
  "lead",
  "toc",
  "proofread",
  { id: "cleanup", ...editorRole },
];
const parameterCommands = [
  {
    id: "parameters.time",
    title: "Время",
    section: "parameters",
    ...adminPostRole,
  },
  {
    id: "parameters.sticky",
    title: "Лепка",
    section: "parameters",
    ...adminPostRole,
  },
  {
    id: "parameters.updated",
    title: "Обнова",
    section: "parameters",
    ...adminPostRole,
  },
  {
    id: "parameters.access",
    title: "Видимость",
    section: "parameters",
    ...adminPostRole,
  },
  {
    id: "parameters.mode",
    title: "Режим",
    section: "parameters",
    ...adminPostRole,
  },
];
const adminGroups = ({ excludeAuthor = [], excludeEditor = [] } = {}) => [
  {
    id: "superuser",
    title: "Суперрежим",
    commands: [{ id: "diff", ...superuser }],
    users: ["baranov"],
  },
  {
    id: "editor",
    title: "Корректор",
    commands: only(editorCommands, excludeEditor),
    roles: ["editor"],
  },
  {
    id: "author",
    title: "Журналист",
    commands: only(authorCommands, excludeAuthor),
    roles: ["author"],
  },
  {
    id: "markup",
    title: "Вёрстка",
    commands: markupCommands,
    roles: ["author"],
  },
  {
    id: "blocks",
    title: "Блоки",
    commands: blocksCommands,
    roles: ["author"],
  },
  {
    id: "parameters",
    title: "Параметры",
    commands: parameterCommands,
    roles: ["editor", "author"],
  },
  {
    id: "submit",
    title: "Submit",
    commands: [{ id: "parameters.submit", title: "Submit", ...superuser }],
    roles: ["editor", "author"],
  },
];
const adminScenario = (page, options = {}) => ({
  id: `admin-${page}`,
  when: {
    surface: ["adminPost"],
    page: [page],
  },
  groups: adminGroups(options),
});

export const runtimeScenarios = [
  adminScenario("longread"),
  adminScenario("news", {
    excludeAuthor: ["toc"],
    excludeEditor: ["toc"],
  }),
  adminScenario("photoreport", {
    excludeAuthor: ["toc"],
    excludeEditor: ["toc"],
  }),
  {
    id: "published",
    title: "Published",
    emoji: "\u{1F9EF}",
    when: {
      surface: ["publicArticle"],
    },
    groups: [
      {
        id: "common",
        title: "\u041E\u0431\u0449\u0435\u0435",
        commands: ["locator"],
      },
    ],
  },
  {
    id: "madtest",
    title: "Тест",
    emoji: "\u2697\uFE0F",
    when: {
      surface: ["madtest"],
    },
    groups: [
      {
        id: "common",
        title: "\u041E\u0431\u0449\u0435\u0435",
        commands: ["madtest-find"],
      },
    ],
  },
];
