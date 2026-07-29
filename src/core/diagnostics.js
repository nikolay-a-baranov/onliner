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
      group: "service",
      users: [],
      userIds: ["146"],
      roles: [],
      feeds: ["author"],
    },
  ],
};

export { diagnosticsConfig };
