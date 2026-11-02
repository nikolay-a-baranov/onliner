const payrollSchema = "onliner-ledger-local-payroll";
const payrollSchemaVersion = 1;

const record = {
  id(item = {}, index = 0) {
    return String(item.record?.post_id || item.record?.url || `record-${index}`);
  },
  date(item = {}) {
    return String(item.record?.published_at || "").slice(0, 10);
  },
  time(item = {}) {
    return String(item.record?.published_at || "").slice(11, 16);
  },
  section(item = {}) {
    return String(item.record?.section || "");
  },
  layout(item = {}) {
    return String(item.record?.layout || "");
  },
  sticky(item = {}) {
    return String(item.record?.sticky || "");
  },
  article(item = {}) {
    return ["longread", "photoreport"].includes(record.layout(item));
  },
  morning(item = {}) {
    return record.article(item) && /^(07|08):\d{2}$/.test(record.time(item));
  },
  nearMorning(item = {}) {
    return record.article(item) && /^(07|08|09):\d{2}$/.test(record.time(item));
  },
  weekday(item = {}) {
    const date = record.date(item);
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`).getUTCDay() : -1;
  },
  week(item = {}) {
    const date = record.date(item);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
    const current = new Date(`${date}T00:00:00Z`);
    const weekday = current.getUTCDay() || 7;
    current.setUTCDate(current.getUTCDate() - weekday + 1);
    return current.toISOString().slice(0, 10);
  },
  compare(left = {}, right = {}) {
    const published = String(left.record?.published_at || "").localeCompare(String(right.record?.published_at || ""));
    return published || record.id(left).localeCompare(record.id(right), undefined, { numeric: true });
  },
};

const profile = {
  validate(value = {}) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Локальный payroll-профиль должен содержать объект.");
    if (value.schema !== payrollSchema || value.schema_version !== payrollSchemaVersion) {
      throw new Error(`Локальный payroll-профиль должен использовать схему ${payrollSchema} версии ${payrollSchemaVersion}.`);
    }
    if (!String(value.proofreader || "")) throw new Error("В локальном payroll-профиле не указан корректор.");
    if (!value.rates || typeof value.rates !== "object" || Array.isArray(value.rates)) throw new Error("В локальном payroll-профиле не указаны ставки.");
    return value;
  },
  blocks(value = {}, period = "") {
    const defaults = Array.isArray(value.blocks) ? value.blocks : [];
    const monthly = Array.isArray(value.periods?.[period]?.blocks) ? value.periods[period].blocks : [];
    return [...defaults, ...monthly]
      .map((item) => ({
        key: String(item?.key || ""),
        label: String(item?.label || ""),
        amount: Number(item?.amount || 0),
        count: Number(item?.count || 1),
        rate: Number(item?.rate || item?.amount || 0),
        components: Array.isArray(item?.components) ? item.components : [],
      }))
      .filter((item) => item.key && item.label && Number.isFinite(item.amount));
  },
  rules(value = {}) {
    const rules = value.rules && typeof value.rules === "object" && !Array.isArray(value.rules) ? value.rules : {};
    return {
      sport: { minimumWeeks: Number(rules.sport?.minimumWeeks || 2), minimumRowsPerWeek: Number(rules.sport?.minimumRowsPerWeek || 2) },
      duty: { minimumRecords: Number(rules.duty?.minimumRecords || 5), minimumSections: Number(rules.duty?.minimumSections || 2) },
      smm: { paidThrough: String(rules.smm?.paidThrough || "") },
    };
  },
  allowsPeriod(period = "", paidThrough = "") {
    const current = String(period).replace(/\D/g, "").slice(0, 6);
    const boundary = String(paidThrough).replace(/\D/g, "").slice(0, 6);
    return !boundary || !current || current <= boundary;
  },
};

const category = {
  get(item = {}) {
    if (item.record?.evergreen === true) return "xtra_eg";
    if (item.record?.special_project === true) return "xtra_sp";
    return "xtra_lr";
  },
  rate(value = {}, key = "") {
    return Number(value.rates?.[key] || 0);
  },
  label(key = "") {
    return {
      xtra_eg: "Эвергрин",
      xtra_sp: "Спецпроект",
      xtra_lr: "Дополнительный текст",
      duty_lr: "Дополнительный текст на дежурстве",
      duty_sunday: "Воскресный текст Спорт/Течь",
    }[key] || key;
  },
  components(key = "", materials = []) {
    const positions = [...new Set(materials.map((item) => item.textOrder).filter((value) => [2, 3].includes(value)))].sort((left, right) => left - right).map((value) => ({ type: "signal", value: value === 2 ? "second_text" : "third_text" }));
    if (key === "xtra_sp") return [...positions, { type: "signal", value: "special" }];
    if (key === "xtra_eg") return [...positions, { type: "signal", value: "evergreen" }];
    if (key === "duty_lr") return [{ type: "signal", value: "duty" }, ...positions];
    if (key === "duty_sunday") {
      const sections = [...new Set(materials.map((item) => item.section).filter(Boolean))];
      return [{ type: "signal", value: "duty" }, ...sections.map((value) => ({ type: "section", value }))];
    }
    return positions;
  },
};

const heuristic = {
  groups(rows = []) {
    return rows.filter(record.nearMorning).reduce((map, item) => {
      const key = `${record.date(item)}|${record.section(item) || "none"}`;
      const current = map.get(key) || [];
      current.push(item);
      map.set(key, current);
      return map;
    }, new Map());
  },
  main(rows = []) {
    return [...rows].sort((left, right) => {
      const sticky = Number(right.record?.sticky === "right") - Number(left.record?.sticky === "right");
      if (sticky) return sticky;
      const eight = Number(record.time(right) === "08:00") - Number(record.time(left) === "08:00");
      return eight || record.compare(left, right);
    })[0] || null;
  },
  baseGroups(rows = [], dutyDates = new Set(), sections = []) {
    return rows.filter((item) => !dutyDates.has(record.date(item)) && sections.includes(record.section(item)) && record.layout(item) === "longread").reduce((map, item) => {
      const key = `${record.date(item)}|${record.section(item)}`;
      const current = map.get(key) || [];
      current.push(item);
      map.set(key, current);
      return map;
    }, new Map());
  },
  baseMain(rows = []) {
    return rows.filter((item) => record.time(item) === "08:00" && record.sticky(item) === "right").sort(record.compare)[0] || null;
  },
  baseExtras(rows = [], main = null) {
    return rows.filter((item) => item !== main && ["left", "right"].includes(record.sticky(item))).sort((left, right) => {
      const priority = Number(record.time(left) !== "07:00") - Number(record.time(right) !== "07:00");
      return priority || record.compare(left, right);
    });
  },
  base(rows = [], dutyDates = new Set(), sections = []) {
    const values = new Map();
    heuristic.baseGroups(rows, dutyDates, sections).forEach((items) => {
      const main = heuristic.baseMain(items);
      if (!main) return;
      heuristic.baseExtras(items, main).forEach((item, index) => {
        const textOrder = index + 2;
        const name = { 2: "Второй", 3: "Третий" }[textOrder] || `${textOrder}-й`;
        values.set(record.id(item, index), { bucket: category.get(item), textOrder, reason: `${name} текст поверх базы` });
      });
    });
    return values;
  },
  sport(rows = [], rules = {}) {
    const evidence = rows.filter((item) => record.section(item) === "sport" && record.morning(item));
    const weeks = evidence.reduce((map, item) => {
      const key = record.week(item);
      const current = map.get(key) || [];
      current.push(item);
      map.set(key, current);
      return map;
    }, new Map());
    const activeWeeks = [...weeks.values()].filter((items) => items.length >= rules.minimumRowsPerWeek);
    return { confirmed: activeWeeks.length >= rules.minimumWeeks, evidence, activeWeeks: activeWeeks.length };
  },
  duties(rows = [], rules = {}) {
    const candidates = rows.reduce((map, item) => {
      if (![0, 6].includes(record.weekday(item))) return map;
      const date = record.date(item);
      const current = map.get(date) || { date, count: 0, sections: new Set() };
      current.count += 1;
      if (record.section(item)) current.sections.add(record.section(item));
      map.set(date, current);
      return map;
    }, new Map());
    const qualified = [...candidates.values()].filter((item) => item.count >= rules.minimumRecords && item.sections.size >= rules.minimumSections);
    const dates = new Set(qualified.filter((item) => qualified.some((candidate) => candidate !== item && Math.abs(Date.parse(candidate.date) - Date.parse(item.date)) === 86400000)).map((item) => item.date));
    return { dates, evidence: rows.filter((item) => dates.has(record.date(item))) };
  },
  paid(rows = [], dutyDates = new Set(), sections = []) {
    const values = sections.length ? heuristic.base(rows, dutyDates, sections) : new Map();
    rows.filter((item) => dutyDates.has(record.date(item)) && record.weekday(item) === 0 && ["sport", "tech"].includes(record.section(item)) && record.article(item)).forEach((item, index) => {
      values.set(record.id(item, index), { bucket: "duty_sunday", secondText: false, reason: "Воскресный текст на дежурстве" });
    });
    heuristic.groups(rows.filter((item) => dutyDates.has(record.date(item)))).forEach((items) => {
      if (items.length < 2 || !items.some(record.morning)) return;
      const main = heuristic.main(items);
      items.filter((item) => item !== main).sort(record.compare).forEach((item, index) => {
        const id = record.id(item, index);
        if (values.has(id)) return;
        const bucket = dutyDates.has(record.date(item)) ? "duty_lr" : category.get(item);
        const textOrder = index + 2;
        const name = { 2: "Второй", 3: "Третий" }[textOrder] || `${textOrder}-й`;
        values.set(id, { bucket, textOrder, reason: `${name} текст на утро` });
      });
    });
    return values;
  },
};

const override = {
  normalize(value = {}) {
    return {
      include: [...new Set(Array.isArray(value.include) ? value.include.map(String) : [])],
      exclude: [...new Set(Array.isArray(value.exclude) ? value.exclude.map(String) : [])],
    };
  },
  paid(id = "", inferred = false, value = {}) {
    if (value.exclude.includes(id)) return false;
    if (value.include.includes(id)) return true;
    return inferred;
  },
};

const coverage = {
  block(blocks = [], key = "") {
    if (key === "base") return blocks.find((item) => item.components.some((component) => component.type === "section" && component.value === "people") && item.components.some((component) => component.type === "section" && component.value === "money")) || null;
    return blocks.find((item) => item.key === key || item.key.startsWith(`${key}_`)) || null;
  },
  get(item = {}, detected = null, blocks = [], sport = {}, duties = {}) {
    if (detected) return null;
    const base = coverage.block(blocks, "base");
    const sportBlock = coverage.block(blocks, "sport");
    const duty = coverage.block(blocks, "duty");
    const dutyDate = duties.dates?.has(record.date(item));
    if (dutyDate && record.weekday(item) === 0 && duty) return { key: "duty", label: duty.label, amount: duty.rate };
    if (sport.confirmed && sportBlock && record.section(item) === "sport" && record.morning(item)) return { key: "sport", label: sportBlock.label, amount: sportBlock.amount };
    if (base && ["people", "money"].includes(record.section(item)) && record.morning(item)) return { key: "base", label: base.label, amount: base.amount };
    if (dutyDate && duty) return { key: "duty", label: duty.label, amount: duty.rate };
    return null;
  },
};

const calculate = {
  lines(materials = []) {
    return [...materials.filter((item) => item.paid).reduce((map, item) => {
      const current = map.get(item.bucket) || [];
      current.push(item);
      map.set(item.bucket, current);
      return map;
    }, new Map())].map(([bucket, items]) => {
      const rate = items[0]?.rate || 0;
      return {
        key: bucket,
        label: category.label(bucket),
        count: items.length,
        rate,
        amount: Math.round(rate * items.length),
        components: category.components(bucket, items),
        material: true,
      };
    });
  },
  get({ rows = [], period = "", proofreaderId = "", profile: source = {}, overrides = {} } = {}) {
    const current = profile.validate(source);
    if (String(current.proofreader) !== String(proofreaderId)) return null;
    const normalized = override.normalize(overrides);
    const rules = profile.rules(current);
    const sport = heuristic.sport(rows, rules.sport);
    const duties = heuristic.duties(rows, rules.duty);
    const smmAllowed = profile.allowsPeriod(period, rules.smm.paidThrough);
    const blocks = profile.blocks(current, period).filter((item) => item.key !== "duty_smm" || smmAllowed);
    const regularSections = [
      ...(coverage.block(blocks, "base") ? ["people", "money"] : []),
      ...(sport.confirmed ? ["sport"] : []),
    ];
    const inferred = heuristic.paid(rows, duties.dates, regularSections);
    if (sport.confirmed && !blocks.some((item) => item.key.startsWith("sport"))) {
      const rate = category.rate(current, "sport");
      blocks.push({ key: "sport", label: "Спорт", count: 1, rate, amount: rate, components: [{ type: "section", value: "sport" }], detected: true });
    }
    if (duties.dates.size && !blocks.some((item) => item.key === "duty")) {
      const rate = category.rate(current, "duty");
      blocks.push({ key: "duty", label: "Дежурство", count: duties.dates.size, rate, amount: rate * duties.dates.size, components: [{ type: "signal", value: "duty" }], detected: true });
      const smmRate = category.rate(current, "duty_smm");
      if (smmAllowed && smmRate) blocks.push({ key: "duty_smm", label: "SMM", count: duties.dates.size, rate: smmRate, amount: smmRate * duties.dates.size, components: [{ type: "signal", value: "duty_smm" }], detected: true });
    }
    const materials = rows.map((item, index) => {
      const id = record.id(item, index);
      const detected = inferred.get(id) || null;
      const bucket = detected?.bucket || category.get(item);
      const eligible = record.article(item);
      const covered = coverage.get(item, detected, blocks, sport, duties);
      const toggleable = eligible && !covered;
      const paid = toggleable && override.paid(id, Boolean(detected), normalized);
      const rate = category.rate(current, bucket);
      return {
        id,
        bucket,
        label: category.label(bucket),
        section: record.section(item),
        eligible,
        toggleable,
        covered: Boolean(covered),
        coverage: covered,
        inferred: Boolean(detected),
        textOrder: Number(detected?.textOrder || 0),
        secondText: Number(detected?.textOrder || 0) === 2,
        thirdText: Number(detected?.textOrder || 0) === 3,
        reason: detected?.reason || "",
        paid,
        rate,
        amount: paid ? rate : 0,
      };
    });
    const materialLines = calculate.lines(materials);
    const blockAmount = blocks.reduce((sum, item) => sum + item.amount, 0);
    const materialAmount = materialLines.reduce((sum, item) => sum + item.amount, 0);
    return {
      proofreader: proofreaderId,
      period,
      blocks,
      materials,
      lines: [...blocks, ...materialLines],
      signals: {
        secondTextIds: materials.filter((item) => item.secondText).map((item) => item.id),
        thirdTextIds: materials.filter((item) => item.thirdText).map((item) => item.id),
        dutyDates: [...duties.dates].sort(),
        sport: sport.confirmed,
      },
      totals: { blocks: blockAmount, materials: materialAmount, amount: blockAmount + materialAmount },
      overrides: normalized,
    };
  },
};

export const ledgerPayroll = {
  schema: payrollSchema,
  schemaVersion: payrollSchemaVersion,
  calculate: calculate.get,
  profile,
  record,
};

globalThis.__ONLINER_LEDGER_PAYROLL__ = ledgerPayroll;
