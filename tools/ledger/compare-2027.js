const policy = {
  id: "2027-third-proofreader",
  version: 1,
  sections: ["people", "sport", "money", "auto", "tech", "realt"],
  rates: { base: 2500, duty: 260, assignedExtra: 18, externalPerThousand: 7 },
  wordsPerMinute: 100,
};

const calendar = {
  valid(value = "") {
    return /^2026-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(String(value));
  },
  date(value = "") {
    return calendar.valid(value) ? new Date(`${value}T00:00:00Z`) : null;
  },
  shift(value = "", days = 0) {
    const current = calendar.date(value);
    if (!current) return "";
    current.setUTCDate(current.getUTCDate() + days);
    return current.toISOString().slice(0, 10);
  },
  weekday(value = "") {
    return calendar.date(value)?.getUTCDay() ?? -1;
  },
  period(value = "") {
    return String(value).replace(/^(\d{4})(\d{2})$/, "$1-$2");
  },
  pair(value = "") {
    const weekday = calendar.weekday(value);
    if (weekday === 0) return { key: value, sunday: value, monday: calendar.shift(value, 1) };
    if (weekday === 1) {
      const sunday = calendar.shift(value, -1);
      return { key: sunday, sunday, monday: value };
    }
    return null;
  },
  pairs(period = "") {
    const month = calendar.period(period);
    if (!/^2026-\d{2}$/.test(month)) return [];
    const [year, number] = month.split("-").map(Number);
    const start = new Date(Date.UTC(year, number - 1, 1));
    const end = new Date(Date.UTC(year, number, 0));
    const cursor = new Date(start);
    cursor.setUTCDate(cursor.getUTCDate() - 7);
    const values = [];
    while (cursor <= end) {
      if (cursor.getUTCDay() === 0) {
        const sunday = cursor.toISOString().slice(0, 10);
        const monday = calendar.shift(sunday, 1);
        if (sunday.startsWith(month) || monday.startsWith(month)) values.push({ key: sunday, sunday, monday, boundary: !sunday.startsWith(month) || !monday.startsWith(month) });
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return values;
  },
  days(period = "") {
    const month = calendar.period(period);
    const match = month.match(/^(2026)-(\d{2})$/);
    if (!match) return [];
    const count = new Date(Date.UTC(Number(match[1]), Number(match[2]), 0)).getUTCDate();
    return Array.from({ length: count }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`);
  },
};

const record = {
  id(item = {}, index = 0) {
    return String(item.post_id || item.url || `record-${index}`);
  },
  date(item = {}) {
    return String(item.published_at || "").slice(0, 10);
  },
  section(item = {}) {
    return String(item.section || "");
  },
  words(item = {}) {
    const value = Number(item.metrics?.words);
    return Number.isFinite(value) && value >= 0 ? value : null;
  },
  longread(item = {}) {
    return item.layout === "longread" && policy.sections.includes(record.section(item)) && calendar.valid(record.date(item));
  },
  special(item = {}) {
    return item.special_project === true;
  },
};

const coverage = {
  get(data = {}) {
    const counts = policy.sections.reduce((map, section) => ({ ...map, [section]: 0 }), {});
    (Array.isArray(data.records) ? data.records : []).forEach((item) => {
      if (Object.hasOwn(counts, record.section(item))) counts[record.section(item)] += 1;
    });
    const positive = Object.values(counts).filter((value) => value > 0).sort((left, right) => left - right);
    const median = positive.length ? positive[Math.floor(positive.length / 2)] : 0;
    const results = new Map((Array.isArray(data.section_results) ? data.section_results : []).map((item) => [String(item.section || ""), item]));
    const missing = policy.sections.filter((section) => {
      const current = results.get(section);
      return current?.status !== "completed" || counts[section] < Math.max(5, Math.floor(median * .1));
    });
    const errors = Array.isArray(data.errors) ? data.errors : [];
    return { complete: !missing.length && !errors.length, counts, missing, errors: errors.length };
  },
};

const allocation = {
  get(item = {}, assignments = {}) {
    const date = record.date(item);
    const weekday = calendar.weekday(date);
    if (weekday >= 2 && weekday <= 6) return { owner: "nikolai", type: "regular", pair: null };
    const pair = calendar.pair(date);
    const assignee = pair ? String(assignments[pair.key] || "unknown") : "unknown";
    if (assignee === "nikolai") return { owner: "nikolai", type: "duty", pair };
    if (assignee === "other") return { owner: "other-duty", type: "duty", pair };
    return { owner: "unknown", type: "duty", pair };
  },
  rows(data = {}, assignments = {}) {
    return (Array.isArray(data.records) ? data.records : []).filter(record.longread).map((item, index) => {
      const date = record.date(item);
      const assigned = allocation.get(item, assignments);
      const weekday = calendar.weekday(date);
      return {
        id: record.id(item, index),
        title: String(item.title || ""),
        section: record.section(item),
        publicationDate: date,
        workEvening: calendar.shift(date, -1),
        workTiming: [0, 1].includes(weekday) ? "uncertain-weekend" : "hypothetical-d-1",
        words: record.words(item),
        special: record.special(item),
        owner: assigned.owner,
        allocation: assigned.type,
        classification: "exact-layout-longread",
        pair: assigned.pair?.key || "",
      };
    });
  },
};

const workload = {
  summarize(rows = [], pace = policy.wordsPerMinute) {
    const validWords = rows.map((item) => item.words).filter(Number.isFinite);
    const words = validWords.reduce((sum, value) => sum + value, 0);
    const speed = Number(pace) > 0 ? Number(pace) : policy.wordsPerMinute;
    const dates = rows.reduce((map, item) => map.set(item.publicationDate, (map.get(item.publicationDate) || 0) + 1), new Map());
    const maximumPerDay = dates.size ? Math.max(...dates.values()) : 0;
    const bySection = rows.reduce((map, item) => ({ ...map, [item.section]: (map[item.section] || 0) + 1 }), {});
    return {
      count: rows.length,
      words: validWords.length === rows.length ? words : null,
      missingWords: rows.length - validWords.length,
      estimatedReadingMinutes: validWords.length === rows.length ? words / speed : null,
      activeDays: dates.size,
      averagePerDay: dates.size ? rows.length / dates.size : 0,
      maximumPerDay,
      peakDays: [...dates].filter(([, count]) => count === maximumPerDay).map(([date]) => date),
      bySection,
    };
  },
  actual(rows = [], pace = policy.wordsPerMinute) {
    const values = rows.map((item) => item.record || item).filter(record.longread).map((item, index) => ({
      id: record.id(item, index),
      title: String(item.title || ""),
      section: record.section(item),
      publicationDate: record.date(item),
      workEvening: "",
      workTiming: "not-observed",
      words: record.words(item),
      owner: "nikolai",
      allocation: "actual-revision",
      classification: "actual-revision-and-exact-layout-longread",
    }));
    return { rows: values, summary: workload.summarize(values, pace) };
  },
  days(period = "", actualRows = [], scenarioRows = []) {
    return calendar.days(period).map((date) => {
      const actual = actualRows.filter((item) => item.publicationDate === date);
      const assigned = scenarioRows.filter((item) => item.publicationDate === date && item.owner === "nikolai");
      const conditional = scenarioRows.filter((item) => item.publicationDate === date && item.owner === "unknown");
      const duplicates = Object.entries([...assigned, ...conditional].reduce((map, item) => ({ ...map, [item.section]: (map[item.section] || 0) + 1 }), {})).filter(([, count]) => count > 1).map(([section, count]) => ({ section, count }));
      return { date, actual, assigned, conditional, duplicates };
    });
  },
};

const payment = {
  extras(rows = []) {
    const groups = rows.filter((item) => item.special).reduce((map, item) => {
      const current = map.get(item.publicationDate) || [];
      current.push(item);
      map.set(item.publicationDate, current);
      return map;
    }, new Map());
    return [...groups.values()].flatMap((items) => items.slice(1)).map((item) => ({ ...item, reason: "Второй СП за день: требуется назначение менеджера" }));
  },
  scenario(period = "", coverageValue = {}, rows = [], pairs = [], assignments = {}) {
    const base = { key: "base", status: coverageValue.complete ? "confirmed" : "manual", rate: policy.rates.base, count: 1, amount: coverageValue.complete ? policy.rates.base : 0 };
    const duties = pairs.filter((item) => assignments[item.key] === "nikolai" && item.sunday.startsWith(calendar.period(period))).map((item) => ({ key: `duty:${item.key}`, status: "confirmed", rate: policy.rates.duty, count: 1, amount: policy.rates.duty, dates: [item.sunday, item.monday] }));
    const candidates = payment.extras(rows);
    const confirmed = [base, ...duties].reduce((sum, item) => sum + item.amount, 0);
    return {
      events: [base, ...duties],
      candidates,
      confirmed,
      traffic: 0,
      illustrative: [policy.rates.base, policy.rates.base + policy.rates.duty, policy.rates.base + policy.rates.duty * 2],
      unknowns: ["К/ВЗ/второй СП требуют назначения менеджера", "Внешние тексты требуют подтверждённых знаков и правила округления", "Вечерние новости не начисляются автоматически"],
    };
  },
};

const compare = {
  get({ data = {}, actualRows = [], actualPayment = null, assignments = {}, pace = policy.wordsPerMinute } = {}) {
    const sourceCoverage = coverage.get(data);
    const scenarioRows = allocation.rows(data, assignments);
    const assignedRows = scenarioRows.filter((item) => item.owner === "nikolai");
    const actual = workload.actual(actualRows, pace);
    const pairs = calendar.pairs(data.period);
    const scenarioPayment = payment.scenario(data.period, sourceCoverage, scenarioRows, pairs, assignments);
    return {
      schema: "onliner-ledger-retrospective-scenario",
      schemaVersion: 1,
      policy: { ...policy },
      period: String(data.period || ""),
      provenance: { schema: data.schema, schemaVersion: data.schema_version, sourceCount: Number(data.count || data.records?.length || 0) },
      coverage: sourceCoverage,
      assumptions: { pace: Number(pace) > 0 ? Number(pace) : policy.wordsPerMinute, handoff: "18:00 planned, not observed", workEvening: "D-1 hypothetical; Sunday/Monday timing uncertain" },
      rota: { pairs, assignments: { ...assignments } },
      actual: { ...actual, payment: actualPayment, paymentStatus: actualPayment ? "calculated-local-profile" : "missing" },
      scenario: { rows: scenarioRows, assignedRows, summary: workload.summarize(assignedRows, pace), payment: scenarioPayment },
      days: workload.days(data.period, actual.rows, scenarioRows),
    };
  },
};

export const ledgerCompare2027 = { policy, calendar, record, coverage, allocation, workload, payment, compare };
