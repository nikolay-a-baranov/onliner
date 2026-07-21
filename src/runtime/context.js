export const context = {
  localOrigin: "https://192.168.31.112:5500",
  key(value = {}) {
    return [
      value.surface,
      value.path,
      Array.isArray(value.type) ? value.type.join("|") : "",
      Array.isArray(value.status) ? value.status.join("|") : "",
      Array.isArray(value.role) ? value.role.join("|") : "",
      value.userId || "",
      value.classList || "",
      value.madtestPage || "",
      value.madtestImport ? "madtest" : "",
    ].join("::");
  },
  projectHome: {
    host: {
      local(value = "") {
        const host = String(value || "").toLowerCase();
        return (
          ["localhost", "127.0.0.1", "::1", "192.168.31.112"].includes(host) ||
          /\.local$/i.test(host) ||
          /^10\./.test(host) ||
          /^192\.168\./.test(host) ||
          /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
        );
      },
      github(value = "") {
        return (
          String(value || "").toLowerCase() ===
          "nikolay-a-baranov.github.io"
        );
      },
    },
    page(root = document) {
      return Boolean(
        root?.querySelector?.(".launchpad-primary-card .card#launchpad"),
      );
    },
    localUrl(value = new URL(location.href)) {
      const url = new URL(context.localOrigin);
      url.pathname = "/";
      url.search = "";
      url.hash = "";
      return url.href;
    },
    githubUrl() {
      return "https://nikolay-a-baranov.github.io/onliner/";
    },
    local(value = new URL(location.href), root = document) {
      return context.projectHome.host.local(value.hostname) &&
        context.projectHome.page(root);
    },
    github(value = new URL(location.href), root = document) {
      return context.projectHome.host.github(value.hostname) &&
        context.projectHome.page(root);
    },
    found(value = new URL(location.href), root = document) {
      return (
        context.projectHome.local(value, root) ||
        context.projectHome.github(value, root)
      );
    },
    meta(value = new URL(location.href), root = document) {
      return {
        local: context.projectHome.local(value, root),
        github: context.projectHome.github(value, root),
        localUrl: context.projectHome.localUrl(value),
        githubUrl: context.projectHome.githubUrl(),
      };
    },
  },
  telegram: {
    host(value = "") {
      return ["t.me", "telegram.me"].includes(String(value || "").toLowerCase());
    },
    web(value = new URL(location.href)) {
      return value.hostname.toLowerCase() === "web.telegram.org";
    },
    post(value = new URL(location.href)) {
      if (!context.telegram.host(value.hostname)) return false;
      const parts = value.pathname
        .split("/")
        .map((item) => item.trim())
        .filter(Boolean);
      const offset = parts[0] === "s" ? 1 : 0;
      return Boolean(parts[offset] && /^\d+$/.test(parts[offset + 1] || ""));
    },
  },
  parseUser(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/^@/, "");
  },
  parseList(value) {
    if (!value) return [];
    return String(value)
      .toLowerCase()
      .split(/[\s,;|]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  },
  role(userId, roles = []) {
    const editors = new Set(["6", "35", "67", "75", "102", "176", "178"]);
    if (roles.length) return roles;
    if (editors.has(String(userId || ""))) return ["editor"];
    return ["author"];
  },
  wpAdmin: {
    editList(value = new URL(location.href)) {
      return value.pathname.toLowerCase().endsWith("/wp-admin/edit.php");
    },
  },
  surface() {
    const url = new URL(location.href);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    const params = url.searchParams;
    const madtest = host === "madtest.ru";
    const onliner = host.endsWith("onliner.by");
    const telegram = context.telegram.post(url) || context.telegram.web(url);
    const article = document
      .querySelector('meta[property="og:type"]')
      ?.getAttribute("content");
    if (madtest && path.startsWith("/app")) return "madtest";
    if (context.projectHome.found(url, document)) return "project-home";
    if (telegram) return "telegram";
    if (!onliner) return "source";
    if (document.body?.classList?.contains("reader-active")) return "reader";
    if (
      path.includes("/wp-admin/revision.php") &&
      params.get("action") === "diff"
    ) {
      return "revision";
    }
    if (context.wpAdmin.editList(url)) return "post-admin";
    if (params.get("action") === "edit") return "post";
    if (path.includes("/wp-admin/")) return "post";
    if (document.body?.classList?.contains("wp-admin")) return "post";
    if (article === "article") return "onliner";
    if (document.querySelector(".news-container[data-post-id]"))
      return "onliner";
    if (/^\/\d{4}\/\d{2}\/\d{2}\//.test(path)) return "onliner";
    return "unsupported";
  },
  account() {
    const source =
      document
        .querySelector("#wp-admin-bar-user-info .username")
        ?.textContent?.trim() ||
      document.querySelector('meta[name="user:login"]')?.content ||
      document.querySelector('meta[name="user:username"]')?.content ||
      "";
    return context.parseUser(source);
  },
  userId() {
    const html = document.documentElement?.innerHTML || "";
    return String(
      document.querySelector("#user_ID")?.value ||
        window.userSettings?.uid ||
        document.body?.className?.match(/\buser-id-(\d+)\b/)?.[1] ||
        html.match(/"uid"\s*:\s*"?(\d+)"?/i)?.[1] ||
        html.match(/"user_id"\s*:\s*"?(\d+)"?/i)?.[1] ||
        html.match(/user_id["']?\s*[:=]\s*["']?(\d+)/i)?.[1] ||
        "",
    ).trim();
  },
  madtest: {
    page(value = new URL(location.href)) {
      const path = String(value?.pathname || "").toLowerCase();
      if (path === "/app/login") return "login";
      if (path === "/app" || path === "/app/") return "home";
      if (/^\/app\/tests\/view\/\d+\/stat$/i.test(path)) return "stat";
      const route = path.match(/^\/app\/tests\/(\d+)\/([^/]+)/);
      if (!route) return path.startsWith("/app") ? "app" : "";
      return (
        {
          main: "main",
          questions: "questions",
          results: "results",
          preview: "preview",
        }[route[2]] || "test"
      );
    },
    accept(value) {
      const id = String(value || "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/["']/g, "");
      const blocked = new Set(["sdk-v2", "sdk", "embed", "widget", "api"]);
      if (!id) return "";
      if (blocked.has(id.toLowerCase())) return "";
      if (id.length < 6) return "";
      if (!/^[a-zA-Z0-9_-]+$/.test(id)) return "";
      return id;
    },
    normalizePath(value = "") {
      try {
        const url = new URL(String(value || ""), location.href);
        const path = url.pathname.replace(/\/+$/g, "");
        return path || "/";
      } catch {
        return "";
      }
    },
    pathVariants(value = "") {
      const path = context.madtest.normalizePath(value);
      if (!path) return [];
      const next = new Set([path]);
      if (path.startsWith("/comments/")) {
        next.add(path.replace(/^\/comments/, ""));
      } else if (path !== "/") {
        next.add(`/comments${path}`);
      }
      return [...next];
    },
    postRoots(root = document) {
      const primary = [
        ...root.querySelectorAll(".news-container[data-post-id]"),
      ];
      if (primary.length) return primary;
      return [...root.querySelectorAll("[data-post-id]")];
    },
    sources(node) {
      return [
        node?.getAttribute?.("href") || "",
        node?.dataset?.href || "",
        node?.dataset?.url || "",
        ...[...(node?.querySelectorAll?.("a[href]") || [])].map(
          (link) => link.getAttribute("href") || "",
        ),
      ].filter(Boolean);
    },
    root(root = document, value = location.href) {
      const nodes = context.madtest.postRoots(root);
      if (!nodes.length) return root;
      if (nodes.length === 1) return nodes[0];
      const variants = context.madtest.pathVariants(value);
      if (!variants.length) return null;
      return (
        nodes.find((node) =>
          context.madtest
            .sources(node)
            .some((item) =>
              variants.includes(context.madtest.normalizePath(item)),
            ),
        ) || null
      );
    },
    html(root = document, value = location.href) {
      const current = context.madtest.root(root, value);
      return current?.innerHTML || "";
    },
    id() {
      const html = context.madtest.html(document, location.href);
      if (!html) return "";
      const fromData = context.madtest.accept(
        html.match(
          /(?:class=["'][^"']*\bmadtest\b[^"']*["'][^>]*\s)?data-id=["']([a-zA-Z0-9_-]+)["']/i,
        )?.[1] || "",
      );
      if (fromData) return fromData;
      const fromConfig = context.madtest.accept(
        html.match(/"testId"\s*:\s*"([a-zA-Z0-9_-]+)"/i)?.[1] || "",
      );
      if (fromConfig) return fromConfig;
      return (
        [...html.matchAll(/madte\.st\/([a-zA-Z0-9_-]+)/gi)]
          .map((match) => context.madtest.accept(match[1]))
          .filter(Boolean)
          .filter((id) => !id.toLowerCase().startsWith("sdk"))[0] || ""
      );
    },
    found() {
      return Boolean(context.madtest.id());
    },
  },
  page: {
    longread(value) {
      return (
        value.type.includes("longread") ||
        value.path.includes("/longread/") ||
        value.classList.includes("longread")
      );
    },
    news(value) {
      return (
        value.type.includes("news") ||
        value.path.includes("/news/") ||
        value.classList.includes("news")
      );
    },
    photoreport(value) {
      return (
        value.type.includes("photoreport") ||
        value.path.includes("/photo/") ||
        value.path.includes("/photoreport/") ||
        value.classList.includes("photoreport")
      );
    },
    onliner(value) {
      return (
        value.status.includes("published") ||
        value.path.includes("/published/") ||
        /\bопублик|published\b/u.test(
          value.title,
        )
      );
    },
    madtest(value) {
      return Boolean(value.madtestImport);
    },
    name(flags, value) {
      if (flags.longread || value.type.includes("longread")) return "longread";
      if (flags.news) return "news";
      if (flags.photoreport) return "photoreport";
      if (flags.onliner) return "onliner";
      if (flags.madtest) return "madtest";
      return "unknown";
    },
    title(value = {}) {
      return (
        {
          longread: "Лонгрид",
          news: "Новость",
          photoreport: "Фоторепортаж",
        }[String(value.page || "")] || "Новость"
      );
    },
    emoji(value = {}) {
      return (
        {
          longread: "newspaper",
          news: "rolled-up-newspaper",
          photoreport: "camera-with-flash",
        }[String(value.page || "")] || "rolled-up-newspaper"
      );
    },
    meta(value = {}) {
      return {
        name: String(value.page || "news"),
        title: context.page.title(value),
        emoji: context.page.emoji(value),
      };
    },
  },
  detect() {
    const root = document.documentElement;
    const body = document.body;
    const url = new URL(location.href);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    const layout = document.querySelector("#layout_select")?.value || "";
    const type = context.parseList(
      layout ||
        body?.dataset?.type ||
        body?.dataset?.entity ||
        root?.dataset?.pageType ||
        root?.dataset?.entityType ||
        document
          .querySelector('meta[name="page:type"],meta[property="og:type"]')
          ?.getAttribute("content"),
    );
    const status = context.parseList(
      body?.dataset?.status ||
        root?.dataset?.status ||
        document
          .querySelector('meta[name="publication:status"]')
          ?.getAttribute("content"),
    );
    const rawRole = context.parseList(
      body?.dataset?.role ||
        body?.dataset?.userRole ||
        root?.dataset?.role ||
        root?.dataset?.userRole ||
        document.querySelector('meta[name="user:role"]')?.content,
    );
    const readerActive = body?.classList?.contains("reader-active");
    const detectedRole = context.role(context.userId(), rawRole);
    const role =
      readerActive && !detectedRole.includes("editor")
        ? [...detectedRole, "editor"]
        : detectedRole;
    const classList = [...(body?.classList || []), ...(root?.classList || [])]
      .map((item) => item.toLowerCase())
      .join(" ");
    const madtestImport = context.madtest.found();
    const projectHome = context.projectHome.meta(url, document);
    const value = {
      host,
      path,
      surface: context.surface(),
      madtestPage: context.madtest.page(url),
      user: context.account(),
      userId: context.userId(),
      title: `${document.title || ""} ${
        root?.getAttribute("data-page-title") || ""
      }`.toLowerCase(),
      type,
      status,
      role,
      classList,
      madtestImport,
      projectHome,
      postId:
        url.searchParams.get("post") ||
        document.querySelector(".news-container[data-post-id]")?.dataset
          ?.postId ||
        document.querySelector("[data-post-id]")?.dataset?.postId ||
        "",
      postStatus: status[0] || "",
      revision: {
        left: url.searchParams.get("left") || "",
        right: url.searchParams.get("right") || "",
        postType: url.searchParams.get("post_type") || "",
      },
    };
    const pageFlags = {
      longread: context.page.longread(value),
      news: context.page.news(value),
      photoreport: context.page.photoreport(value),
      onliner: context.page.onliner(value),
      madtest: context.page.madtest(value),
    };
    return {
      ...value,
      page: context.page.name(pageFlags, value),
      pageFlags,
    };
  },
};
