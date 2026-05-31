import { cms } from "./cms.js";

const fixed = {
  adminNow() {
    return new Date(
      new Date().toLocaleString("en-US", {
        timeZone: cms.timezone,
      }),
    );
  },
  time(state = {}, hours = "", minutes = "") {
    return {
      ...state,
      hours: String(hours || "").padStart(2, "0"),
      minutes: String(minutes || "").padStart(2, "0"),
    };
  },
  date(value = new Date()) {
    return [
      String(value.getFullYear()),
      String(value.getMonth() + 1).padStart(2, "0"),
      String(value.getDate()).padStart(2, "0"),
    ].join("-");
  },
  now(step = 0) {
    const now = fixed.adminNow();
    const next = new Date(
      now.getTime() + Math.max(0, Number(step) || 0) * 60000,
    );
    next.setSeconds(0, 0);
    return {
      hours: String(next.getHours()).padStart(2, "0"),
      minutes: String(next.getMinutes()).padStart(2, "0"),
      date: fixed.date(next),
    };
  },
  hourPreset(state = {}, hour = 8) {
    const now = fixed.adminNow();
    const next = new Date(now);
    if (next.getHours() >= hour) next.setDate(next.getDate() + 1);
    next.setHours(hour, 0, 0, 0);
    return {
      ...fixed.time(state, String(next.getHours()), "00"),
      date: fixed.date(next),
    };
  },
};
export const delivery = {
  actions: {
    groups() {
      return [
        {
          kind: "time",
          items: [
            { name: "time-custom", kind: "emoji", icon: "\u{2A}\uFE0F\u{20E3}" },
            { name: "time-now", kind: "emoji", icon: "\u{30}\uFE0F\u{20E3}" },
            { name: "time-07", kind: "emoji", icon: "\u{37}\uFE0F\u{20E3}" },
            { name: "time-08", kind: "emoji", icon: "\u{38}\uFE0F\u{20E3}" },
          ],
        },
        {
          kind: "options",
          items: [
            { name: "vis-public", kind: "emoji", icon: "\u{1F30D}" },
            { name: "vis-link", kind: "emoji", icon: "\u{1F517}" },
            { name: "pin-left", kind: "emoji", icon: "\u25C0\uFE0F" },
            { name: "pin-right", kind: "emoji", icon: "\u25B6\uFE0F" },
            { name: "update", kind: "emoji", icon: "\u{1F199}" },
          ],
        },
      ];
    },
  },
  pin(state = {}) {
    if (state.left) return "прилеплено слева";
    if (state.right) return "прилеплено справа";
    return "не прилеплено";
  },
  summary(state = {}) {
    const hours = String(state.hours || "").trim();
    const minutes = String(state.minutes || "").trim();
    const time =
      hours && minutes
        ? `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`
        : "сразу";
    const update = state.update ? ", UPD" : "";
    return `Публикация: ${time}, ${delivery.pin(state)}${update}`;
  },
  summaryTop(state = {}) {
    const timeIcon = {
      "time-custom": "\u{2A}\uFE0F\u{20E3}",
      "time-now": "\u{30}\uFE0F\u{20E3}",
      "time-07": "\u{37}\uFE0F\u{20E3}",
      "time-08": "\u{38}\uFE0F\u{20E3}",
      "time-manual": "\u{1F550}",
    }[String(state.timeAction || "time-manual")] || "\u{1F550}";
    const pinIcon = state.left ? "\u25C0\uFE0F" : state.right ? "\u25B6\uFE0F" : "";
    const visIcon = state.visibility === "link" ? "\u{1F517}" : "\u{1F30D}";
    const updateIcon = state.update ? " \u{1F199}" : "";
    return [timeIcon, pinIcon, visIcon].filter(Boolean).join(" ") + updateIcon;
  },
  schedule(state = {}) {
    const hours = Number(String(state.hours || "").replace(/\D+/g, ""));
    const minutes = Number(String(state.minutes || "").replace(/\D+/g, ""));
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    const date = String(state.date || "");
    const base =
      /^\d{4}-\d{2}-\d{2}$/u.test(date)
        ? new Date(`${date}T00:00:00`)
        : fixed.adminNow();
    const next = new Date(base);
    next.setHours(hours, minutes, 0, 0);
    return {
      month: String(next.getMonth() + 1).padStart(2, "0"),
      day: String(next.getDate()).padStart(2, "0"),
      year: String(next.getFullYear()),
      hours: String(hours).padStart(2, "0"),
      minutes: String(minutes).padStart(2, "0"),
    };
  },
  preset(state = {}, action = "") {
    if (action === "time-07")
      return { ...fixed.hourPreset(state, 7), timeAction: "time-07" };
    if (action === "time-08")
      return { ...fixed.hourPreset(state, 8), timeAction: "time-08" };
    if (action === "time-now")
      return { ...state, ...fixed.now(0), timeAction: "time-now" };
    if (action === "time-custom")
      return { ...state, ...fixed.now(10), timeAction: "time-custom" };
    if (action === "pin-left") {
      return {
        ...state,
        left: !state.left,
        right: false,
        pinAction: "pin-left",
      };
    }
    if (action === "pin-right") {
      return {
        ...state,
        right: !state.right,
        left: false,
        pinAction: "pin-right",
      };
    }
    if (action === "update") {
      return {
        ...state,
        update: !state.update,
      };
    }
    if (action === "vis-link") {
      return {
        ...state,
        visibility: "link",
      };
    }
    if (action === "vis-public") {
      return {
        ...state,
        visibility: "public",
      };
    }
    return { ...state };
  },
};
