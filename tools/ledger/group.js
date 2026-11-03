import { proofreadUsers } from "../../src/actions/proofread-roster.js";
import { cms } from "../../src/core/cms.js";

const groupSchema = "onliner-publications";
const groupSchemaVersion = 2;
const identity = {
  normalize(value = "") {
    return String(value || "")
      .replace(/^@/, "")
      .replace(/ё/gi, "е")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  },
  aliases(key, user = {}) {
    const name = String(user.name || "").trim();
    const parenthetical = name.match(/^(.+?)\s*\((.+?)\)$/);
    const firstName = name.split(/\s+/)[0] || "";
    return [
      name,
      key,
      user.telegram,
      user.wordpress?.username,
      parenthetical?.[1],
      parenthetical?.[2],
      parenthetical ? `${firstName} ${parenthetical[2]}` : "",
    ]
      .map(identity.normalize)
      .filter((value, index, list) => value && list.indexOf(value) === index);
  },
};
const authorReplacements = [
  ["darruiss", "Юрий Байдаков"],
  ["Валерий Волатович", "Юрий Байдаков"],
  ["Сергей Сергеев", "Ян Альшевский"],
  ["Ольга Прокопьева", "Наталья Злотник"],
  ["Артем", "Артём"],
];
const author = {
  enabled: true,
  replacements: new Map(authorReplacements.map(([source, target]) => [identity.normalize(source), target])),
  name(value = "") {
    const source = String(value || "").replace(/\s+/g, " ").trim();
    if (!author.enabled || !source) return source;
    return author.replacements.get(identity.normalize(source)) || source;
  },
};
const roster = Object.entries(proofreadUsers).map(([id, user]) => ({
  id,
  name: user.name,
  display: { dashboard: String(user.display?.dashboard || user.name || "").trim() },
  aliases: identity.aliases(id, user),
}));
const aggregate = { id: "all", name: "Все корректоры" };
const defaults = { proofreader: "nb" };
const display = {
  dashboard(value = "") {
    const name = String(value || "").trim();
    return roster.find((item) => item.name === name)?.display.dashboard || name;
  },
};
const terminology = {
  editorial: {
    sp: "Спецпроект",
    eg: "Зелень",
    ct: "Каталог",
  },
  layout: {
    news: "Ньюс",
    longread: "Лонг",
    photoreport: "Фоторепорт",
  },
};
const editorial = {
  tags(record = {}) {
    if (Array.isArray(record.tags)) return record.tags.map(String);
    return String(record.tags || "").split(",").map((item) => item.trim()).filter(Boolean);
  },
  catalog(record = {}) {
    return record.catalog === true || editorial.tags(record).some((item) => /^Каталог(?: Onl[ií]ner)?$/iu.test(item.trim()));
  },
};
const warning = {
  count(data) {
    if (!Number.isFinite(Number(data.count))) return [];
    return Number(data.count) === data.records.length
      ? []
      : [`Заявлено ${data.count} записей, в файле ${data.records.length}.`];
  },
  sections(data) {
    if (!Array.isArray(data.sections) || !Array.isArray(data.section_results)) return [];
    const results = new Map(data.section_results.map((item) => [String(item?.section || ""), item]));
    return data.sections.flatMap((section) => {
      const result = results.get(String(section));
      if (!result) return [`Нет результата сбора раздела ${section}.`];
      const actual = data.records.filter((record) => record?.section === section).length;
      if (!actual) return [];
      if (result.status !== "completed") return [`Раздел ${section}: статус ${result.status || "не указан"}.`];
      if (Number.isFinite(Number(result.count)) && Number(result.count) !== actual) {
        return [`Раздел ${section}: заявлено ${result.count}, в файле ${actual}.`];
      }
      return [];
    });
  },
  errors(data) {
    const sections = new Set(data.records.map((record) => String(record?.section || "")).filter(Boolean));
    const errors = Array.isArray(data.errors)
      ? data.errors.filter((item) => !item?.section || sections.has(String(item.section)))
      : [];
    return errors.length
      ? [`Сбор содержит ${errors.length} ${errors.length === 1 ? "ошибку" : "ошибки"}.`]
      : [];
  },
  get(data) {
    return [warning.count, warning.sections, warning.errors].flatMap((get) => get(data));
  },
};
const revision = {
  matches(item, aliases) {
    return aliases.includes(identity.normalize(item?.author));
  },
  proofreader(item = {}) {
    return roster.find((proofreader) => revision.matches(item, proofreader.aliases)) || null;
  },
  actor(item = {}) {
    return revision.proofreader(item)?.name || author.name(item.author);
  },
  matchesPeriod(item, period) {
    const month = String(period || "").replace(/^(\d{4})-?(\d{2})$/, "$1-$2");
    return /^\d{4}-\d{2}$/.test(month) && String(item?.date || "").slice(0, 7) === month;
  },
  compare(left, right) {
    return `${left?.date || ""}T${left?.time || ""}`.localeCompare(`${right?.date || ""}T${right?.time || ""}`);
  },
};
const proofreader = {
  getSurname(value = "") {
    const name = String(value || "").replace(/\s*\([^)]*\)\s*$/, "").trim();
    return name.split(/\s+/).slice(1).join(" ") || name;
  },
  compare(left = {}, right = {}) {
    const surname = proofreader.getSurname(left.name).localeCompare(proofreader.getSurname(right.name), "ru", { sensitivity: "base" });
    return surname || String(left.name || "").localeCompare(String(right.name || ""), "ru", { sensitivity: "base" });
  },
  list(data = {}) {
    const ids = new Set((Array.isArray(data.records) ? data.records : []).flatMap((record) => Array.isArray(record?.revisions) ? record.revisions : [])
      .filter((item) => item?.autosave !== true && revision.matchesPeriod(item, data.period))
      .map((item) => revision.proofreader(item)?.id)
      .filter(Boolean));
    const members = roster.filter((item) => ids.has(item.id)).sort(proofreader.compare);
    return members.length ? [...members, aggregate] : [];
  },
  select(data = {}, value = "") {
    const options = proofreader.list(data);
    const selected = String(value || "");
    if (options.some((item) => item.id === selected)) return selected;
    if (options.some((item) => item.id === defaults.proofreader)) return defaults.proofreader;
    return options.find((item) => item.id !== aggregate.id)?.id || "";
  },
};
const handoff = {
  config: {
    deadlineMinutes: 22 * 60,
    morningHours: [7, 8],
    eveningStartMinutes: 18 * 60,
    eveningEndMinutes: 22 * 60,
  },
  actor(item = {}) {
    return revision.actor(item);
  },
  stamp(item) {
    const match = `${item?.date || ""} ${item?.time || ""}`.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
    return match ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5])) : null;
  },
  minutes(value = "") {
    const match = String(value || "").match(/^(\d{2}):(\d{2})$/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  },
  context(record = {}) {
    const layout = String(record.layout || "");
    const time = String(record.published_at || "").slice(11, 16);
    const minutes = handoff.minutes(time);
    if (layout === "longread" && minutes !== null && handoff.config.morningHours.includes(Math.floor(minutes / 60))) return "Утренний лонг";
    if (layout === "news" && minutes !== null && minutes >= handoff.config.eveningStartMinutes && minutes <= handoff.config.eveningEndMinutes) return "Вечерний ньюс";
    return "";
  },
  get(items = [], aliases = [], period = "") {
    const ordered = items.filter((item) => item?.autosave !== true).sort(revision.compare);
    const first = ordered.find((item) => revision.matchesPeriod(item, period) && revision.matches(item, aliases)) || null;
    const previous = first ? ordered.slice(0, ordered.indexOf(first)).filter((item) => !revision.matches(item, aliases)).at(-1) || null : null;
    const previousStamp = handoff.stamp(previous);
    const firstStamp = handoff.stamp(first);
    const waitMinutes = previousStamp !== null && firstStamp !== null ? Math.max(0, Math.round((firstStamp - previousStamp) / 60000)) : null;
    return { previous, first, waitMinutes };
  },
  late(record = {}, value = {}) {
    const transfer = handoff.minutes(value.previous?.time);
    return Boolean(handoff.context(record)) && transfer !== null && transfer > handoff.config.deadlineMinutes;
  },
};
const replacement = {
  config: {
    proofreaders: ["nb"],
    morningTimes: ["07:00", "08:00"],
    dayStartHour: 9,
    eveningStartHour: 18,
    weekdays: [1, 2, 3, 4, 5],
  },
  published(record = {}) {
    const match = String(record.published_at || "").match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
    if (!match) return { date: "", time: "", hour: -1, weekday: -1 };
    return { date: match[1], time: `${match[2]}:${match[3]}`, hour: Number(match[2]), weekday: new Date(`${match[1]}T00:00:00Z`).getUTCDay() };
  },
  weekday(record = {}) {
    return replacement.config.weekdays.includes(replacement.published(record).weekday);
  },
  morningTech(record = {}) {
    const published = replacement.published(record);
    return replacement.weekday(record)
      && String(record.section || "") === "tech"
      && String(record.layout || "") === "longread"
      && replacement.config.morningTimes.includes(published.time);
  },
  dayNews(record = {}) {
    const published = replacement.published(record);
    return replacement.weekday(record)
      && String(record.layout || "") === "news"
      && published.hour >= replacement.config.dayStartHour
      && published.hour < replacement.config.eveningStartHour;
  },
  eveningNews(record = {}) {
    const published = replacement.published(record);
    return replacement.weekday(record)
      && String(record.layout || "") === "news"
      && published.hour >= replacement.config.eveningStartHour;
  },
  eveningMaterial(record = {}) {
    const published = replacement.published(record);
    return replacement.weekday(record)
      && ["news", "longread", "photoreport"].includes(String(record.layout || ""))
      && published.hour >= replacement.config.eveningStartHour;
  },
  eveningDates(rows = []) {
    return new Set(rows.filter((item) => replacement.eveningNews(item.record)).map((item) => replacement.published(item.record).date));
  },
  get(record = {}, eveningDates = new Set()) {
    const morning = replacement.morningTech(record);
    const evening = eveningDates.has(replacement.published(record).date) && replacement.eveningMaterial(record);
    return [
      morning ? "morning_replacement" : "",
      replacement.dayNews(record) ? "day_replacement" : "",
      evening ? "evening_replacement" : "",
      morning || evening ? "vacation_replacement" : "",
    ].filter(Boolean);
  },
  reason(record = {}, value = "") {
    if (value === "vacation_replacement") return "Замена";
    if (value === "morning_replacement" && replacement.morningTech(record)) return "Утро";
    if (value === "evening_replacement" && replacement.eveningMaterial(record)) return "Вечер";
    if (value !== "day_replacement") return "";
    if (replacement.dayNews(record)) return "День";
    return "";
  },
};
const signal = {
  periodStart(period = "") {
    const month = String(period || "").replace(/^(\d{4})-?(\d{2})$/, "$1-$2");
    return /^\d{4}-\d{2}$/.test(month) ? `${month}-01` : "";
  },
  evidence(record = {}, period = "") {
    const start = signal.periodStart(period);
    const revisions = Array.isArray(record.revisions) ? record.revisions : [];
    if (!start) return [];
    return revisions
      .filter((item) => item?.autosave !== true && String(item?.date || "") >= start)
      .map((item) => ({ item, proofreader: revision.proofreader(item) }))
      .filter(({ proofreader }) => proofreader)
      .sort((left, right) => revision.compare(left.item, right.item))
      .map(({ item, proofreader }) => ({ name: proofreader.name, date: String(item.date || ""), time: String(item.time || "") }));
  },
  proofreaders(record = {}, period = "") {
    return [...new Set(signal.evidence(record, period).map((item) => item.name))];
  },
  get(record = {}, transfer = {}, proofreaders = []) {
    return [
      record.special_project ? "special" : "",
      editorial.catalog(record) ? "catalog" : "",
      record.evergreen ? "evergreen" : "",
      handoff.late(record, transfer) ? "late_handoff" : "",
      proofreaders.length > 1 ? "shared_review" : "",
      /^[a-zA-Z0-9_-]{6,}$/.test(String(record.madtest || "").trim()) ? "madtest" : "",
    ].filter(Boolean);
  },
};
const duty = {
  config: {
    weekdays: [0, 6],
    minimumRecords: 5,
    minimumSections: 2,
  },
  rules: {
    weekend(item) {
      return duty.config.weekdays.includes(item.weekday);
    },
    volume(item) {
      return item.count >= duty.config.minimumRecords;
    },
    coverage(item) {
      return item.sections.size >= duty.config.minimumSections;
    },
    get() {
      return [duty.rules.weekend, duty.rules.volume, duty.rules.coverage];
    },
  },
  matches(item) {
    return duty.rules.get().every((rule) => rule(item));
  },
  get(rows = []) {
    const dates = rows.reduce((map, item) => {
      const date = analytics.date(item);
      const weekday = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`).getUTCDay() : -1;
      const current = map.get(date) || { type: "duty", date, weekday, count: 0, sections: new Set() };
      const section = String(item.record?.section || "");
      current.count += 1;
      if (section) current.sections.add(section);
      map.set(date, current);
      return map;
    }, new Map());
    const values = [...dates.values()].filter(duty.matches).sort((left, right) => left.date.localeCompare(right.date));
    return values.map((item) => ({
      type: item.type,
      date: item.date,
      count: item.count,
      sections: [...item.sections].sort(),
      sectionCount: item.sections.size,
      paired: values.some((candidate) => candidate !== item && Math.abs(Date.parse(candidate.date) - Date.parse(item.date)) === 86400000),
    }));
  },
};
const workload = {
  config: {
    minimumActiveDays: 5,
    minimumRecords: 5,
    minimumWords: 10000,
    baselineMultiplier: 2,
  },
  median(values = []) {
    const ordered = values.filter(Number.isFinite).sort((left, right) => left - right);
    if (!ordered.length) return 0;
    const middle = Math.floor(ordered.length / 2);
    return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
  },
  get(rows = [], period = "") {
    const dutyDates = new Set(duty.get(rows).map((item) => item.date));
    const days = analytics.days(rows, period).filter((item) => item.count && !dutyDates.has(item.date));
    if (days.length < workload.config.minimumActiveDays) return [];
    const baseline = {
      count: workload.median(days.map((item) => item.count)),
      words: workload.median(days.map((item) => item.words)),
    };
    const threshold = {
      count: Math.max(workload.config.minimumRecords, Math.ceil(baseline.count * workload.config.baselineMultiplier)),
      words: Math.max(workload.config.minimumWords, Math.ceil(baseline.words * workload.config.baselineMultiplier)),
    };
    return days
      .filter((item) => item.count >= threshold.count || item.words >= threshold.words)
      .map((item) => ({ type: "workload", ...item, baseline, threshold }));
  },
};
const analytics = {
  date(item = {}) {
    return String(item.record?.published_at || "").slice(0, 10);
  },
  words(item = {}) {
    return Number(item.record?.metrics?.words || 0);
  },
  days(rows = [], period = "") {
    const month = String(period || "").replace(/^(\d{4})-?(\d{2})$/, "$1-$2");
    const match = month.match(/^(\d{4})-(\d{2})$/);
    const total = match ? new Date(Date.UTC(Number(match[1]), Number(match[2]), 0)).getUTCDate() : 0;
    const values = new Map(Array.from({ length: total }, (_, index) => {
      const date = `${month}-${String(index + 1).padStart(2, "0")}`;
      return [date, { date, count: 0, words: 0, revisions: 0 }];
    }));
    rows.forEach((item) => {
      const date = analytics.date(item);
      if (!values.has(date)) return;
      const current = values.get(date);
      current.count += 1;
      current.words += analytics.words(item);
      current.revisions += Array.isArray(item.observed) ? item.observed.length : 0;
    });
    return [...values.values()];
  },
  sections(rows = []) {
    const values = rows.reduce((map, item) => {
      const section = String(item.record?.section || "none");
      map.set(section, (map.get(section) || 0) + 1);
      return map;
    }, new Map());
    const order = ["people", "sport", "money", "auto", "tech", "realt", "none"];
    return [...values.entries()]
      .map(([section, count]) => ({ section, count }))
      .sort((left, right) => order.indexOf(left.section) - order.indexOf(right.section));
  },
  extrema(rows = [], period = "") {
    const activeDays = analytics.days(rows, period).filter((item) => item.count);
    const byCount = [...activeDays].sort((left, right) => left.count - right.count || left.date.localeCompare(right.date));
    const withWords = rows.filter((item) => analytics.words(item) > 0);
    const byWords = [...withWords].sort((left, right) => analytics.words(left) - analytics.words(right));
    return {
      quietest: byCount[0] || null,
      busiest: byCount.at(-1) || null,
      smallest: byWords[0] || null,
      largest: byWords.at(-1) || null,
    };
  },
  anomalies(rows = []) {
    const longreads = rows.reduce((map, item) => {
      const time = String(item.record?.published_at || "").slice(11, 16);
      if (item.record?.layout !== "longread" || !/^(07|08):\d{2}$/.test(time)) return map;
      const date = analytics.date(item);
      const section = String(item.record?.section || "none");
      if (!date) return map;
      const key = `${date}|${section}`;
      const current = map.get(key) || { type: "multiple_longreads", date, section, count: 0 };
      current.count += 1;
      map.set(key, current);
      return map;
    }, new Map());
    return [...longreads.values()]
      .filter((item) => item.count > 1)
      .sort((left, right) => left.date.localeCompare(right.date) || left.section.localeCompare(right.section));
  },
  duties(rows = []) {
    return duty.get(rows);
  },
  workload(rows = [], period = "") {
    return workload.get(rows, period);
  },
  get(rows = [], period = "") {
    return {
      days: analytics.days(rows, period),
      sections: analytics.sections(rows),
      extrema: analytics.extrema(rows, period),
      anomalies: analytics.anomalies(rows),
      duties: analytics.duties(rows),
      workload: analytics.workload(rows, period),
    };
  },
};
const selection = {
  key(record, index) {
    return String(record?.post_id || record?.url || `record-${index}`);
  },
  members(proofreaderId = "") {
    if (proofreaderId === aggregate.id) return roster;
    const proofreader = roster.find((item) => item.id === proofreaderId);
    return proofreader ? [proofreader] : [];
  },
  aliases(members = []) {
    return [...new Set(members.flatMap((item) => item.aliases))];
  },
  get(data, proofreaderId = "") {
    const members = selection.members(proofreaderId);
    if (!members.length) return { rows: [], autosaveOnlyCount: 0 };
    const replacementEnabled = members.length === 1 && replacement.config.proofreaders.includes(members[0].id);
    const aliases = selection.aliases(members);
    const selected = new Map();
    const autosaveOnly = new Set();
    data.records.forEach((record, index) => {
      const key = selection.key(record, index);
      const revisions = Array.isArray(record?.revisions) ? record.revisions : [];
      const periodRevisions = revisions.filter((item) => revision.matchesPeriod(item, data.period));
      const matched = periodRevisions.filter((item) => revision.matches(item, aliases));
      const observed = matched.filter((item) => item?.autosave !== true);
      if (!observed.length) {
        if (matched.length) autosaveOnly.add(key);
        return;
      }
      if (selected.has(key)) return;
      const transfer = handoff.get(revisions, aliases, data.period);
      const proofreaders = signal.proofreaders(record, data.period);
      const proofreading = signal.evidence(record, data.period);
      selected.set(key, {
        record,
        observed,
        autosaves: matched.length - observed.length,
        lastRevision: [...observed].sort(revision.compare).at(-1) || null,
        handoff: transfer,
        proofreaders,
        proofreading,
        signals: signal.get(record, transfer, proofreaders),
      });
    });
    const rows = [...selected.values()];
    const eveningDates = replacementEnabled ? replacement.eveningDates(rows) : new Set();
    const enriched = replacementEnabled ? rows.map((item) => ({ ...item, signals: [...item.signals, ...replacement.get(item.record, eveningDates)] })) : rows;
    const autosaveOnlyCount = [...autosaveOnly].filter((key) => !selected.has(key)).length;
    return { rows: enriched, autosaveOnlyCount };
  },
};
export const ledgerGroup = {
  schema: groupSchema,
  schemaVersion: groupSchemaVersion,
  sections: cms.sections,
  author,
  analytics,
  duty,
  workload,
  replacement,
  handoff,
  signal,
  editorial,
  terminology,
  display,
  proofreader,
  aggregate,
  defaults,
  roster,
  validate(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Crawler JSON должен содержать объект.");
    }
    if (data.schema !== groupSchema || data.schema_version !== groupSchemaVersion) {
      throw new Error(`Crawler JSON должен использовать схему ${groupSchema} версии ${groupSchemaVersion}.`);
    }
    if (!Array.isArray(data.records)) {
      throw new Error("Crawler JSON: поле records должно быть массивом.");
    }
    return { data, warnings: warning.get(data) };
  },
  select(data, proofreaderId = "") {
    return selection.get(data, proofreaderId);
  },
};

globalThis.__ONLINER_LEDGER_GROUP__ = ledgerGroup;
