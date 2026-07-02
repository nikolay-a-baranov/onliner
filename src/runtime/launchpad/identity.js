const runtime = {
  assigned: {
    byUserId: {
      6: "editors",
      35: "editors",
      67: "editors",
      75: "editors",
      102: "editors",
      146: "authors",
      176: "editors",
      178: "editors",
    },
    role(userId = "", user = "", realRole = "") {
      return (
        runtime.assigned.byUserId[String(userId || "")] ||
        (user === "baranov" ? realRole : "")
      );
    },
    source(userId = "", user = "", realRole = "") {
      const role = runtime.assigned.role(userId, user, realRole);
      if (!role) return "realRole";
      if (user === "baranov" && role === realRole) return "realRole";
      return `userId:${String(userId || "")}`;
    },
  },
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
      const list = ["", "authors", "editors"];
      const index = Math.max(0, list.indexOf(current));
      return runtime.preview.set(value, user, list[(index + 1) % list.length]);
    },
  },
  rotate: {
    key: "ONLINER_LAUNCHPAD_ROLE_MODE",
    enabled(value) {
      return value.surface === "post";
    },
    pair(role = "") {
      const current = String(role || "");
      if (["editor", "editors"].includes(current)) {
        return ["editors", "editor"];
      }
      if (["author", "authors"].includes(current)) {
        return ["authors", "author"];
      }
      return [];
    },
    role(value, currentRole = "") {
      if (!runtime.rotate.enabled(value)) return "";
      const pair = runtime.rotate.pair(currentRole);
      if (!pair.length) return "";
      try {
        const role = localStorage.getItem(runtime.rotate.key) || "";
        return pair.includes(role) ? role : "";
      } catch {
        return "";
      }
    },
    set(value, currentRole = "", role = "") {
      if (!runtime.rotate.enabled(value)) return "";
      const pair = runtime.rotate.pair(currentRole);
      const next = pair.includes(role) ? role : "";
      try {
        if (next) localStorage.setItem(runtime.rotate.key, next);
        else localStorage.removeItem(runtime.rotate.key);
      } catch {}
      return next;
    },
    cycle(value, currentRole = "") {
      if (!runtime.rotate.enabled(value)) return "";
      const pair = runtime.rotate.pair(currentRole);
      if (!pair.length) return "";
      const current = runtime.rotate.role(value, currentRole) || pair[0];
      const index = Math.max(0, pair.indexOf(current));
      return runtime.rotate.set(value, currentRole, pair[(index + 1) % pair.length]);
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
    const assignedRole = runtime.assigned.role(realUserId, realUser, realRole);
    const baseRole = assignedRole || realRole;
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
        roleSource: "preview",
      };
    }
    const rotatedRole = runtime.rotate.role(value, baseRole);
    const effectiveRole = rotatedRole || baseRole;
    const roleSource = rotatedRole
      ? "marker"
      : runtime.assigned.source(realUserId, realUser, realRole);
    if (realUser !== "baranov") {
      return {
        realUser,
        realUserId,
        realRole,
        effectiveUser: realUser,
        effectiveUserId: realUserId,
        effectiveRole,
        previewRole: "",
        previewMode: false,
        impersonation: false,
        roleSource,
      };
    }
    return {
      realUser,
      realUserId,
      realRole,
      effectiveUser: realUser,
      effectiveUserId: realUserId,
      effectiveRole,
      previewRole: "",
      previewMode: false,
      impersonation: false,
      roleSource,
    };
  },
};

export const launchpadIdentity = runtime;
