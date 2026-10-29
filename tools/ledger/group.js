import { proofreadUsers } from "../../src/actions/proofread-roster.js";

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
const roster = Object.entries(proofreadUsers).map(([id, user]) => ({
  id,
  name: user.name,
  aliases: identity.aliases(id, user),
}));
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
      if (result.status !== "completed") return [`Раздел ${section}: статус ${result.status || "не указан"}.`];
      const actual = data.records.filter((record) => record?.section === section).length;
      if (Number.isFinite(Number(result.count)) && Number(result.count) !== actual) {
        return [`Раздел ${section}: заявлено ${result.count}, в файле ${actual}.`];
      }
      return [];
    });
  },
  errors(data) {
    return Array.isArray(data.errors) && data.errors.length
      ? [`Сбор содержит ${data.errors.length} ${data.errors.length === 1 ? "ошибку" : "ошибки"}.`]
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
  compare(left, right) {
    return `${left?.date || ""}T${left?.time || ""}`.localeCompare(`${right?.date || ""}T${right?.time || ""}`);
  },
};
const selection = {
  key(record, index) {
    return String(record?.post_id || record?.url || `record-${index}`);
  },
  get(data, proofreaderId = "") {
    const proofreader = roster.find((item) => item.id === proofreaderId);
    if (!proofreader) return { rows: [], autosaveOnlyCount: 0 };
    const selected = new Map();
    const autosaveOnly = new Set();
    data.records.forEach((record, index) => {
      const key = selection.key(record, index);
      const revisions = Array.isArray(record?.revisions) ? record.revisions : [];
      const matched = revisions.filter((item) => revision.matches(item, proofreader.aliases));
      const observed = matched.filter((item) => item?.autosave !== true);
      if (!observed.length) {
        if (matched.length) autosaveOnly.add(key);
        return;
      }
      if (selected.has(key)) return;
      selected.set(key, {
        record,
        observed,
        autosaves: matched.length - observed.length,
        lastRevision: [...observed].sort(revision.compare).at(-1) || null,
      });
    });
    const autosaveOnlyCount = [...autosaveOnly].filter((key) => !selected.has(key)).length;
    return { rows: [...selected.values()], autosaveOnlyCount };
  },
};
export const ledgerGroup = {
  schema: groupSchema,
  schemaVersion: groupSchemaVersion,
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
