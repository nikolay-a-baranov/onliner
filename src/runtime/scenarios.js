export const runtimeScenarios = [
  {
    id: "admin-longread",
    when: {
      surface: ["adminPost"],
      page: ["longread"],
    },
    groups: [
      {
        id: "common",
        title: "Общее",
        commands: ["reader", "lead", "toc"],
      },
      {
        id: "author",
        title: "Журналист",
        commands: [
          { id: "author", roles: ["author"], users: ["baranov"] },
          { id: "readmore", roles: ["author"], users: ["baranov"] },
          { id: "embed", roles: ["author"], users: ["baranov"] },
        ],
      },
      {
        id: "editor",
        title: "Корректор",
        commands: [
          { id: "editor", roles: ["editor"], users: ["baranov"] },
          { id: "cleanup", roles: ["editor"], users: ["baranov"] },
        ],
      },
      {
        id: "superuser",
        title: "Суперрежим",
        commands: [
          { id: "schedule", users: ["baranov"] },
          { id: "private", users: ["baranov"] },
          { id: "save", users: ["baranov"] },
          { id: "publish", users: ["baranov"] },
          { id: "update", users: ["baranov"] },
          { id: "diff", users: ["baranov"] },
        ],
      },
    ],
  },
  {
    id: "admin-news",
    when: {
      surface: ["adminPost"],
      page: ["news"],
    },
    groups: [
      {
        id: "common",
        title: "Общее",
        commands: ["reader", "lead", "proofread"],
      },
      {
        id: "author",
        title: "Журналист",
        commands: [
          { id: "author", roles: ["author"], users: ["baranov"] },
          { id: "readmore", roles: ["author"], users: ["baranov"] },
          { id: "embed", roles: ["author"], users: ["baranov"] },
        ],
      },
      {
        id: "editor",
        title: "Корректор",
        commands: [
          { id: "editor", roles: ["editor"], users: ["baranov"] },
          { id: "cleanup", roles: ["editor"], users: ["baranov"] },
        ],
      },
      {
        id: "superuser",
        title: "Суперрежим",
        commands: [
          { id: "schedule", users: ["baranov"] },
          { id: "private", users: ["baranov"] },
          { id: "save", users: ["baranov"] },
          { id: "publish", users: ["baranov"] },
          { id: "update", users: ["baranov"] },
          { id: "diff", users: ["baranov"] },
        ],
      },
    ],
  },
  {
    id: "published",
    title: "Published",
    emoji: "🧯",
    when: {
      surface: ["publicArticle"],
    },
    groups: [
      {
        id: "common",
        title: "Общее",
        commands: ["locator"],
      },
    ],
  },
  {
    id: "madtest",
    title: "Madtest",
    emoji: "⚗️",
    when: {
      surface: ["madtest"],
    },
    groups: [
      {
        id: "common",
        title: "Общее",
        commands: ["madtest-find"],
      },
    ],
  },
];
