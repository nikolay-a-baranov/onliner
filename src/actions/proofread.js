import { cms } from "../core/cms.js";
import { field } from "../core/dom.js";
import { telegram } from "../core/telegram.js";
const proofreadConfig = {
  users: {
    nb: {
      name: "Николай Баранов",
      wordpress: {
        username: "baranov",
        userId: "146",
      },
      telegram: "nikolay_baranov",
    },
    vsh: {
      name: "Вадим Шклярик",
      wordpress: {
        username: "",
        userId: "",
      },
      telegram: "ancip",
    },
    ym: {
      name: "Юлия Михайлова",
      wordpress: {
        username: "",
        userId: "",
      },
      telegram: "mikhailava8",
    },
    yp: {
      name: "Юлия Петрович (Кевро)",
      wordpress: {
        username: "",
        userId: "",
      },
      telegram: "arizma",
    },
    ek: {
      name: "Елена Кулиева",
      wordpress: {
        username: "",
        userId: "",
      },
      telegram: "alenka_kulieva",
    },
    ms: {
      name: "Марина Сивицкая (Чернякевич)",
      wordpress: {
        username: "",
        userId: "",
      },
      telegram: "Maryna_Shypshyna",
    },
  },
  sections: {
    default: {
      morning: {
        default: "nb",
      },
      day: {
        default: "nb",
      },
    },
    people: {
      morning: {
        default: "nb",
      },
      day: {
        default: "nb",
      },
    },
    sport: {
      morning: {
        default: "nb",
      },
      day: {
        default: "nb",
      },
    },
    money: {
      morning: {
        default: "nb",
      },
      day: {
        default: "nb",
      },
    },
    auto: {
      morning: {
        default: "nb",
      },
      day: {
        default: "nb",
      },
    },
    tech: {
      morning: {
        default: "nb",
      },
      day: {
        default: "nb",
      },
    },
    realt: {
      morning: {
        default: "nb",
      },
      day: {
        default: "nb",
      },
    },
  },
  chats: {
    default: "-1001952773701",
    people: "-1001871494382",
    money: "-1001979021771",
    tech: "-1001851346262",
  },
  shifts: {
    morningBeforeHour: 12,
    eveningFromHour: 17,
    eveningFromMinute: 50,
  },
  duty: {
    "2026-07": {
      3: "ym",
      4: "ek",
      5: "ek",
      11: "ms",
      12: "ms",
      18: "vsh",
      19: "vsh",
      25: "nb",
      26: "nb",
    },
    "2026-08": {
      1: "yp",
      2: "yp",
      8: "ek",
      9: "ek",
      15: "ym",
      16: "ym",
      22: "vsh",
      23: "vsh",
      29: "ms",
      30: "ms",
    },
  },
  days: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
};
const proofreadRoute = {
  key(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  },
  pick(value, day = "") {
    if (typeof value === "string") return value;
    if (!value || typeof value !== "object") return "";
    return value[day] || value.default || "";
  },
};

export const createProofread = () => {
  const proofread = {
    day(date = proofread.now()) {
      return proofreadConfig.days[date.getDay()] || "";
    },
    duty(date = proofread.now()) {
      const month = proofreadConfig.duty[proofreadRoute.key(date)] || {};
      return proofread.telegram(month[date.getDate()] || "");
    },
    shift(date = proofread.now()) {
      const hour = date.getHours();
      const minute = date.getMinutes();
      const evening =
        hour > proofreadConfig.shifts.eveningFromHour ||
        (hour === proofreadConfig.shifts.eveningFromHour &&
          minute >= proofreadConfig.shifts.eveningFromMinute);
      if (evening) return "evening";
      return hour < proofreadConfig.shifts.morningBeforeHour ? "morning" : "day";
    },
    now() {
      return new Date(
        new Date().toLocaleString("en-US", {
          timeZone: cms.timezone,
        }),
      );
    },
    date(value) {
      return value instanceof Date && !Number.isNaN(value.getTime())
        ? value
        : proofread.now();
    },
    publicationDate() {
      const values = ["aa", "mm", "jj", "hh", "mn"].map((id) =>
        String(document.querySelector(`#${id}`)?.value || "").trim(),
      );
      if (values.some((value) => !/^\d+$/.test(value))) return proofread.now();
      const [year, month, day, hour, minute] = values.map(Number);
      return proofread.date(new Date(year, month - 1, day, hour, minute));
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
    telegram(value = "") {
      const key = String(value || "")
        .replace(/^@/, "")
        .trim();
      if (!key) return "";
      const user = proofreadConfig.users?.[key] || null;
      return String(user?.telegram || key)
        .replace(/^@/, "")
        .trim();
    },
    target(value = {}) {
      const section = String(value.section || proofread.section());
      const page = String(value.page || proofread.page());
      const day = String(value.day || proofread.day());
      const shift = String(value.shift || proofread.shift());
      const duty = proofread.duty(proofread.date(value.date));
      if (duty) return duty;
      const sectionConfig =
        proofreadConfig.sections[section] ||
        proofreadConfig.sections.default ||
        {};
      const shiftConfig =
        sectionConfig[shift] ||
        sectionConfig.default ||
        proofreadConfig.sections.default?.[shift] ||
        {};
      const pageConfig = shiftConfig[page] || shiftConfig.default || {};
      const legacyConfig = sectionConfig[page] || sectionConfig.default || {};
      return proofread.telegram(
        proofreadRoute.pick(pageConfig, day) ||
          proofreadRoute.pick(shiftConfig, day) ||
          proofreadRoute.pick(legacyConfig, day) ||
          "",
      );
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
      return url;
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
    open(username, text = "") {
      return telegram.open.user(username, text);
    },
    chat(section = proofread.section(), date = proofread.now()) {
      const key = proofread.shift(date) === "evening" ? "default" : section;
      return String(
        proofreadConfig.chats[key] || proofreadConfig.chats.default || "",
      ).trim();
    },
    openChat(chatId = "") {
      return telegram.open.chat(chatId);
    },
    pick(text = "") {
      return telegram.open.share(text);
    },
    async run() {
      if (proofread.surface() !== "post") return false;
      const message = proofread.message();
      await proofread.copy(message);
      const currentDate = proofread.now();
      const duty = proofread.duty(currentDate);
      if (duty) {
        proofread.open(duty, message);
        return true;
      }
      const chat = proofread.chat(proofread.section(), currentDate);
      if (chat) {
        proofread.openChat(chat);
        return true;
      }
      proofread.pick(message);
      return true;
    },
  };
  return { proofread };
};
