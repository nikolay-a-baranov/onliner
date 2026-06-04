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
    if (params.get("action") === "edit") return "edit";
    if (path.includes("/wp-admin/")) return "edit";
    if (document.body?.classList?.contains("wp-admin")) return "edit";
    if (article === "article") return "published";
    if (document.querySelector(".news-container[data-post-id]"))
      return "published";
    if (/^\/\d{4}\/\d{2}\/\d{2}\//.test(path)) return "published";
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
    published(value) {
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
    const role = context.parseList(
      body?.dataset?.role ||
        body?.dataset?.userRole ||
        root?.dataset?.role ||
        root?.dataset?.userRole ||
        document.querySelector('meta[name="user:role"]')?.content,
    );
    const classList = [...(body?.classList || []), ...(root?.classList || [])]
      .map((item) => item.toLowerCase())
      .join(" ");
    const madtestImport = Boolean(
      document.querySelector(
        '.madtest[data-id],iframe[src*="madte.st"],a[href*="madte.st"]',
      ) || /madte\.st\/[a-z0-9_-]+/i.test(document.documentElement?.innerHTML || ""),
    );
    const value = {
      host,
      path,
      surface: context.surface(),
      user: context.account(),
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
    };
    return {
      ...value,
      page: {
        longread: context.page.longread(value),
        news: context.page.news(value),
        photoreport: context.page.photoreport(value),
        published: context.page.published(value),
        madtest: context.page.madtest(value),
      },
    };
  },
};
