import { proofreadUsers } from "./proofread-roster.js";

export const proofreadConfig = {
  users: proofreadUsers,
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
      "4-5": "ek",
      "11-12": "ms",
      "18-19": "vs",
      "25-26": "nb",
    },
    "2026-08": {
      "1-2": "yp",
      "8-9": "ek",
      "15-16": "ym",
      "22-23": "vs",
      "29-30": "ms",
    },
    "2026-09": {
      "5-6": "ek",
      "12-13": "nb",
      "19-20": "yp",
      "26-27": "ms",
    },
    "2026-10": {
      "3-4": "ym",
      "10-11": "nb",
      "17-18": "vs",
      "24-25": "ek",
      31: "yp",
    },
    "2026-11": {
      1: "yp",
      "7-8": "ym",
      "14-15": "ms",
      "21-22": "nb",
      "28-29": "vs",
    },
  },
  days: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
};
