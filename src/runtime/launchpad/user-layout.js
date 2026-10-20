const layout = {
  key: "ONLINER_LAUNCHPAD_USER_LAYOUT",
  version: 1,
  normalize(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    if (value.version !== layout.version || !Array.isArray(value.commands)) return null;
    if (value.commands.some((id) => typeof id !== "string")) return null;
    return {
      version: layout.version,
      commands: [...new Set(value.commands.map((id) => id.trim()).filter(Boolean))],
    };
  },
  get() {
    try {
      const raw = localStorage.getItem(layout.key);
      if (raw === null) return null;
      return layout.normalize(JSON.parse(raw));
    } catch {
      return null;
    }
  },
  set(value) {
    const next = layout.normalize(value);
    if (!next) return false;
    try {
      localStorage.setItem(layout.key, JSON.stringify(next));
      return true;
    } catch {
      return false;
    }
  },
  reset() {
    try {
      localStorage.removeItem(layout.key);
      return true;
    } catch {
      return false;
    }
  },
  resolve(value, allowed = []) {
    const current = layout.normalize(value);
    if (!current) return [];
    const byId = new Map(allowed.map((command) => [command.id, command]));
    return current.commands.map((id) => byId.get(id)).filter(Boolean);
  },
  modeKey: "ONLINER_LAUNCHPAD_USER_LAYOUT_MODE",
  active() {
    try {
      return localStorage.getItem(layout.modeKey) === "custom";
    } catch {
      return false;
    }
  },
  mode(active) {
    try {
      if (active) localStorage.setItem(layout.modeKey, "custom");
      else localStorage.removeItem(layout.modeKey);
      return true;
    } catch {
      return false;
    }
  },
};
export const userLayout = layout;
