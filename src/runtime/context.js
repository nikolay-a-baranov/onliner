export const context = {
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
  surface() {
    const url = new URL(location.href);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    const params = url.searchParams;
    const madtest = host === "madtest.ru";
    const onliner = host.endsWith("onliner.by");
    const article = document
      .querySelector('meta[property="og:type"]')
      ?.getAttribute("content");
    if (madtest && path.startsWith("/app")) return "madtest";
    if (!onliner) return "unsupported";
    if (document.body?.classList?.contains("reader-active")) return "reader";
    if (
      path.includes("/wp-admin/revision.php") &&
      params.get("action") === "diff"
    ) {
      return "revision";
    }
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
    id() {
      const html = document.documentElement?.innerHTML || "";
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
        /\b\u043E\u043F\u0443\u0431\u043B\u0438\u043A|published\b/u.test(
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
    const role =
      readerActive && !rawRole.includes("editor")
        ? [...rawRole, "editor"]
        : rawRole;
    const classList = [...(body?.classList || []), ...(root?.classList || [])]
      .map((item) => item.toLowerCase())
      .join(" ");
    const madtestImport = context.madtest.found();
    const value = {
      host,
      path,
      surface: context.surface(),
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
