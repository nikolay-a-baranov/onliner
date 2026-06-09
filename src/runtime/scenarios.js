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
const idOf = (command) => (typeof command === "string" ? command : command.id);
const only = (commands, exclude = []) =>
  commands.filter((command) => !exclude.includes(idOf(command)));
const pick = (commands, ids = []) =>
  commands.filter((command) => ids.includes(idOf(command)));
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
  "toc",
];
const authorPinnedCommands = [
  { id: "author", ...adminRole },
  "lead",
  ...pick(markupCommands, ["author.heading", "author.quote"]),
  { id: "author.cleanup", ...adminRole },
];
const prepCommands = [{ id: "cleanup", ...editorRole }, "proofread", "reader"];

const punctCommands = [
  { id: "editor.nbsp", ...editorRole },
  { id: "editor.comma", ...editorRole },
  { id: "editor.colon", ...editorRole },
  { id: "editor.dash", ...editorRole },
  { id: "editor.punct", ...editorRole },
  { id: "editor.quote", ...editorRole },
  { id: "editor.qswap", ...editorRole },
  { id: "editor.accent", ...editorRole },
  { id: "editor.symbol", ...editorRole },
  { id: "editor.math", ...editorRole },
];
const transformCommands = [
  { id: "editor.home", ...editorRole },
  { id: "editor.left", ...editorRole },
  { id: "editor.right", ...editorRole },
  { id: "editor.letter", ...editorRole },
  { id: "editor.number", ...editorRole },
  { id: "editor.branch", ...editorRole },
  { id: "editor.abbr", ...editorRole },
  { id: "editor.year", ...editorRole },
];
const editorPinnedCommands = [
  { id: "editor", ...editorRole },
  ...pick(punctCommands, ["editor.nbsp", "editor.punct", "editor.quote"]),
  ...pick(transformCommands, ["editor.left", "editor.right"]),
];
const editorMarkupCommands = [
  { id: "editor.em", ...editorRole },
  { id: "editor.strong", ...editorRole },
  { id: "editor.killem", ...editorRole },
  { id: "editor.note", ...editorRole },
  { id: "editor.list", ...editorRole },
];
const editorSearchCommands = [
  { id: "editor.google", ...editorRole },
  { id: "editor.gramota", ...editorRole },
  { id: "editor.kinopoisk", ...editorRole },
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
    commands: only(editorPinnedCommands, excludeEditor),
    roles: ["editor"],
  },
  {
    id: "prep",
    title: "Препарация",
    commands: only(prepCommands, excludeEditor),
    roles: ["editor"],
  },
  {
    id: "blocks",
    title: "Блоки",
    commands: only(blocksCommands, excludeEditor),
    roles: ["editor"],
  },
  {
    id: "keys",
    title: "Клавиатура",
    commands: punctCommands,
    roles: ["editor"],
  },
  {
    id: "misc",
    title: "Правка",
    commands: transformCommands,
    roles: ["editor"],
  },
  {
    id: "markup",
    title: "Разметка",
    commands: editorMarkupCommands,
    roles: ["editor"],
  },
  {
    id: "search",
    title: "Поиск",
    commands: editorSearchCommands,
    roles: ["editor"],
  },
  {
    id: "author",
    title: "Журналист",
    commands: only(authorPinnedCommands, excludeAuthor),
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
    commands: only(blocksCommands, excludeAuthor),
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
    commands: [{ id: "parameters.submit", title: "Submit", ...adminPostRole }],
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
