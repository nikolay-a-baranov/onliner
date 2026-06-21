const runtime = {
  preview: {
    key: "ONLINER_LAUNCHPAD_PREVIEW_ROLE",
    roles: ["author", "editor", "authors", "editors", "test"],
    usage() {
      return {
        setAuthor: 'localStorage.ONLINER_LAUNCHPAD_PREVIEW_ROLE = "author"',
        setEditor: 'localStorage.ONLINER_LAUNCHPAD_PREVIEW_ROLE = "editor"',
        setAuthors: 'localStorage.ONLINER_LAUNCHPAD_PREVIEW_ROLE = "authors"',
        setEditors: 'localStorage.ONLINER_LAUNCHPAD_PREVIEW_ROLE = "editors"',
        setTest: 'localStorage.ONLINER_LAUNCHPAD_PREVIEW_ROLE = "test"',
        clear: 'localStorage.removeItem("ONLINER_LAUNCHPAD_PREVIEW_ROLE")',
      };
    },
    enabled(value, user) {
      return user === "baranov" && value.surface === "post";
    },
    role(value, user) {
      if (!runtime.preview.enabled(value, user)) return "";
      try {
        const role = localStorage.getItem(runtime.preview.key) || "";
        return runtime.preview.roles.includes(role) ? role : "";
      } catch {
        return "";
      }
    },
    set(value, user, role = "") {
      if (!runtime.preview.enabled(value, user)) return "";
      const next = runtime.preview.roles.includes(role) ? role : "";
      try {
        if (next) localStorage.setItem(runtime.preview.key, next);
        else localStorage.removeItem(runtime.preview.key);
      } catch {}
      return next;
    },
    cycle(value, user) {
      if (!runtime.preview.enabled(value, user)) return "";
      const current = runtime.preview.role(value, user);
      const list = ["", "test", "authors", "editors"];
      const index = Math.max(0, list.indexOf(current));
      return runtime.preview.set(value, user, list[(index + 1) % list.length]);
    },
  },
  userRole(value) {
    if (value.role.includes("editor")) return "editor";
    if (value.role.includes("author")) return "author";
    if (!value.user) return "unknown";
    return "author";
  },
  identity(value) {
    const realUser = value.user;
    const realUserId = value.userId || "";
    const realRole = runtime.userRole(value);
    const previewRole = runtime.preview.role(value, realUser);
    if (previewRole) {
      return {
        realUser,
        realUserId,
        realRole,
        effectiveUser: "__preview__",
        effectiveUserId: previewRole === "test" ? realUserId : "",
        effectiveRole: previewRole,
        previewRole,
        previewMode: true,
        impersonation: true,
      };
    }
    if (realUser !== "baranov") {
      return {
        realUser,
        realUserId,
        realRole,
        effectiveUser: realUser,
        effectiveUserId: realUserId,
        effectiveRole: realRole,
        previewRole: "",
        previewMode: false,
        impersonation: false,
      };
    }
    return {
      realUser,
      realUserId,
      realRole,
      effectiveUser: realUser,
      effectiveUserId: realUserId,
      effectiveRole: realRole,
      previewRole: "",
      previewMode: false,
      impersonation: false,
    };
  },
};

export const launchpadIdentity = runtime;
