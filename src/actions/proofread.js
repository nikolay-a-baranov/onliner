import { cms } from "../core/cms.js";
import { field } from "../core/dom.js";
const proofreadConfig = {
  users: {
    baranov: {
      name: "\u041d\u0438\u043a\u043e\u043b\u0430\u0439 \u0411\u0430\u0440\u0430\u043d\u043e\u0432",
      username: "nikolay_baranov",
    },
    shklyarik: {
      name: "\u0412\u0430\u0434\u0438\u043c \u0428\u043a\u043b\u044f\u0440\u0438\u043a",
      username: "ancip",
    },
    mikhailava: {
      name: "\u042e\u043b\u0438\u044f \u041c\u0438\u0445\u0430\u0439\u043b\u043e\u0432\u0430",
      username: "mikhailava8",
    },
    kevro: {
      name: "\u042e\u043b\u0438\u044f \u041f\u0435\u0442\u0440\u043e\u0432\u0438\u0447 (\u041a\u0435\u0432\u0440\u043e)",
      username: "arizma",
    },
    kulieva: {
      name: "\u0415\u043b\u0435\u043d\u0430 \u041a\u0443\u043b\u0438\u0435\u0432\u0430",
      username: "alenka_kulieva",
    },
    sivitskaya: {
      name: "\u041c\u0430\u0440\u0438\u043d\u0430 \u0421\u0438\u0432\u0438\u0446\u043a\u0430\u044f (\u0427\u0435\u0440\u043d\u044f\u043a\u0435\u0432\u0438\u0447)",
      username: "Maryna_Shypshyna",
    },
  },
  sections: {
    default: {
      default: {
        default: "baranov",
      },
    },
    people: {
      news: {
        default: "baranov",
      },
      longread: {
        default: "baranov",
      },
    },
  },
  days: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
};

export const createProofread = () => {
  const proofread = {
    day(date = proofread.now()) {
      return proofreadConfig.days[date.getDay()] || "";
    },
    now() {
      return new Date(
        new Date().toLocaleString("en-US", {
          timeZone: cms.timezone,
        }),
      );
    },
    section() {
      return String(location.hostname.split(".")[0] || "default").trim();
    },
    surface() {
      const url = new URL(location.href);
      const path = url.pathname.toLowerCase();
      if (url.searchParams.get("action") === "edit") return "post";
      if (path.includes("/wp-admin/")) return "post";
      if (document.body?.classList?.contains("wp-admin")) return "post";
      return "";
    },
    page() {
      const layout = cms.layout.element();
      if (!layout) return "news";
      return cms.layout.longread(cms.layout.value(layout))
        ? "longread"
        : "news";
    },
    username(value = "") {
      const key = String(value || "").replace(/^@/, "").trim();
      if (!key) return "";
      const user = proofreadConfig.users?.[key] || null;
      return String(user?.username || key).replace(/^@/, "").trim();
    },
    target(value = {}) {
      const section = String(value.section || proofread.section());
      const page = String(value.page || proofread.page());
      const day = String(value.day || proofread.day());
      const sectionConfig =
        proofreadConfig.sections[section] ||
        proofreadConfig.sections.default ||
        {};
      const pageConfig = sectionConfig[page] || sectionConfig.default || {};
      return proofread.username(pageConfig[day] || pageConfig.default || "");
    },
    postId() {
      const url = new URL(location.href);
      return String(
        url.searchParams.get("post") ||
          document.querySelector("#post_ID")?.value ||
          "",
      ).trim();
    },
    postUrl() {
      const url = new URL(location.href);
      const clean = new URL(url.pathname, url.origin);
      const postId = proofread.postId();
      if (postId) clean.searchParams.set("post", postId);
      clean.searchParams.set("action", "edit");
      return clean.href;
    },
    message(url = proofread.postUrl()) {
      return ["", url].join("\n");
    },
    fallbackCopy(text) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      return Promise.resolve(true);
    },
    copy(text) {
      if (navigator.clipboard?.writeText) {
        return navigator.clipboard.writeText(text).then(() => true);
      }
      return proofread.fallbackCopy(text);
    },
    open(username) {
      if (!username) return false;
      location.href = `tg://resolve?domain=${encodeURIComponent(username)}`;
      return true;
    },
    async run() {
      if (proofread.surface() !== "post") return false;
      const username = proofread.target();
      if (!username || username === "corrector_username") {
        field.alert("Корректор для вычитки не настроен");
        return false;
      }
      await proofread.copy(proofread.message());
      proofread.open(username);
      return true;
    },
  };
  return { proofread };
};
