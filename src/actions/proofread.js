import { cms } from "../core/cms.js";
import { field } from "../core/dom.js";
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
    vs: {
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
  longreads: {
    beforeHour: 8,
    sections: {
      people: "nb",
      money: "nb",
      auto: "vs",
      realt: "vs",
      tech: "yp",
    },
    sport: {
      anchorMonday: "2026-08-03",
      users: ["nb", "vs"],
    },
  },
  chats: {
    default: "-1001952773701",
    auto: "1818965767",
    people: "-1001871494382",
    money: "-1001979021771",
    tech: "-1001851346262",
  },
  shifts: {
    eveningFromHour: 17,
    eveningFromMinute: 50,
  },
  calendarOverrides: {},
  duty: {
    "2026-07": {
      3: "ym",
      4: "ek",
      5: "ek",
      11: "ms",
      12: "ms",
      18: "vs",
      19: "vs",
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
      22: "vs",
      23: "vs",
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
      return evening ? "evening" : "section";
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
    dateKey(date = proofread.now()) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    override(date = proofread.now()) {
      return proofread.telegram(
        proofreadConfig.calendarOverrides[proofread.dateKey(date)] || "",
      );
    },
    sport(date = proofread.now()) {
      const anchor = new Date(`${proofreadConfig.longreads.sport.anchorMonday}T00:00:00`);
      const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const offset = Math.floor((current - anchor) / (7 * 24 * 60 * 60 * 1000));
      const users = proofreadConfig.longreads.sport.users;
      return users[((offset % users.length) + users.length) % users.length] || "";
    },
    longreadDate(date = proofread.now()) {
      const routingDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );
      if (date.getHours() >= proofreadConfig.longreads.beforeHour) {
        routingDate.setDate(routingDate.getDate() + 1);
      }
      return routingDate;
    },
    longread(date = proofread.now(), section = proofread.section()) {
      if (proofread.page() !== "longread") return "";
      const routingDate = proofread.longreadDate(date);
      const override = proofread.override(routingDate);
      if (override) return override;
      const duty = proofread.duty(routingDate);
      if (duty) return duty;
      const user =
        section === "sport"
          ? proofread.sport(routingDate)
          : proofreadConfig.longreads.sections[section] || "";
      return proofread.telegram(user);
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
      const date = proofread.date(value.date);
      const section = String(value.section || proofread.section());
      const override = proofread.override(date);
      if (override) return override;
      const duty = proofread.duty(date);
      if (duty) return duty;
      if (proofread.page() === "longread") {
        return proofread.longread(date, section);
      }
      return "";
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
      if (!username) return false;
      const params = new URLSearchParams({ domain: username });
      if (text) params.set("text", text);
      window.open(
        `tg://resolve?${params.toString()}`,
        "_blank",
        "noopener,noreferrer",
      );
      return true;
    },
    chat(section = proofread.section(), date = proofread.now()) {
      const key = proofread.shift(date) === "evening" ? "default" : section;
      return String(
        proofreadConfig.chats[key] || proofreadConfig.chats.default || "",
      ).trim();
    },
    pasteHotkey() {
      const apple =
        /Mac|iPhone|iPad|iPod/.test(navigator.platform) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      return apple ? "Cmd+V" : "Ctrl+V";
    },
    alertPaste() {
      alert(
        `Не забудь нажать ${proofread.pasteHotkey()}: ссылка уже скопирована в буфер.`,
      );
      return true;
    },
    openChat(chatId = "") {
      const value = String(chatId || "").trim();
      if (!/^(?:-100)?\d+$/.test(value)) return false;
      const channelId = value.startsWith("-100") ? value.slice(4) : value;
      location.href = `tg://privatepost?channel=${channelId}&post=1`;
      return true;
    },
    pick(text = "") {
      if (!text) return false;
      const params = new URLSearchParams({ url: text });
      window.open(
        `tg://msg_url?${params.toString()}`,
        "_blank",
        "noopener,noreferrer",
      );
      return true;
    },
    async run() {
      if (proofread.surface() !== "post") return false;
      const message = proofread.message();
      await proofread.copy(message);
      const currentDate = proofread.now();
      const target = proofread.target({ date: currentDate });
      if (target) {
        proofread.open(target, message);
        return true;
      }
      const chat = proofread.chat(proofread.section(), currentDate);
      if (chat) {
        if (proofread.openChat(chat)) return proofread.alertPaste();
      }
      proofread.pick(message);
      return true;
    },
  };
  return { proofread };
};
