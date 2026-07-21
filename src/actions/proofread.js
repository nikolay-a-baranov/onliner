import { cms } from "../core/cms.js";
import { field } from "../core/dom.js";
const proofreadConfig = {
  users: {
    baranov: {
      name: "Николай Баранов",
      username: "nikolay_baranov",
    },
    shklyarik: {
      name: "Вадим Шклярик",
      username: "ancip",
    },
    mikhailava: {
      name: "Юлия Михайлова",
      username: "mikhailava8",
    },
    kevro: {
      name: "Юлия Петрович (Кевро)",
      username: "arizma",
    },
    kulieva: {
      name: "Елена Кулиева",
      username: "alenka_kulieva",
    },
    sivitskaya: {
      name: "Марина Сивицкая (Чернякевич)",
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
      const key = String(value || "")
        .replace(/^@/, "")
        .trim();
      if (!key) return "";
      const user = proofreadConfig.users?.[key] || null;
      return String(user?.username || key)
        .replace(/^@/, "")
        .trim();
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
      const url = `tg://resolve?domain=${encodeURIComponent(username)}`;
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (opened) return true;
      field.alert(`Не удалось открыть Telegram в новой вкладке.\n\n@${username}`);
      return false;
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
