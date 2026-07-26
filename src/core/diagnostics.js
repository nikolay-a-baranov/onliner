const diagnosticsConfig = {
  enabled: true,
  developerUsers: ["baranov"],
  tools: [
    {
      command: "diagnostics",
      scriptId: "thumbnail-content",
      name: "Миниатюра / content",
      group: "service",
      users: [],
      userIds: ["146"],
      roles: [],
      feeds: ["author"],
    },
  ],
};

export { diagnosticsConfig };
