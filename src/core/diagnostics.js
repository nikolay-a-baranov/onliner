const diagnosticsConfig = {
  enabled: true,
  developers: {
    baranov: {
      telegram: "nikolay_baranov",
    },
  },
  developerUsers: ["baranov"],
  tools: [
    {
      command: "diagnostics",
      scriptId: "thumbnail-content",
      name: "Миниатюра / content",
      developer: "baranov",
      group: "diagnostics",
      users: [],
      userIds: ["146"],
      roles: [],
      feeds: ["author"],
    },
    {
      command: "diagnostics",
      scriptId: "render-pipeline",
      name: "Мегамозг",
      title: "Рендер",
      glyph: "Brain Circuit",
      developer: "baranov",
      group: "diagnostics",
      users: ["baranov"],
      userIds: [],
      roles: [],
      feeds: ["superuser"],
      surfaces: ["post"],
    },
    {
      command: "diagnostics",
      scriptId: "render-pipeline",
      name: "Мегамозг",
      title: "Рендер",
      glyph: "Cast Multiple",
      developer: "baranov",
      group: "diagnostics",
      users: ["baranov"],
      userIds: [],
      roles: [],
      feeds: [],
      surfaces: ["onliner"],
    },
  ],
};

export { diagnosticsConfig };
