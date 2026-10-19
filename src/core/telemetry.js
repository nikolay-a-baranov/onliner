const telemetry = {
  enabled: true,
  userIds: ["35"],
  allow(userId = "") {
    const current = String(userId || "").trim();
    if (telemetry.enabled !== true || !/^[1-9]\d*$/.test(current)) return false;
    return telemetry.userIds.map(String).includes(current);
  },
};

export { telemetry };
