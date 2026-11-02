const fs = require("fs");
const path = require("path");

const recordFields = [
  "post_id",
  "section",
  "url",
  "edit_url",
  "title",
  "author",
  "status",
  "published_at",
  "layout",
  "sticky",
  "source",
  "tags",
  "madtest",
  "special_project",
  "evergreen",
  "metrics",
  "revisions",
  "revisions_source",
  "sectionLabel",
];
const argument = {
  get(values, name, fallback) {
    const index = values.indexOf(name);
    return index >= 0 && values[index + 1] ? values[index + 1] : fallback;
  },
};
const file = {
  json(filename) {
    return JSON.parse(fs.readFileSync(filename, "utf8"));
  },
  list(directory) {
    return fs.readdirSync(directory)
      .filter((name) => name.toLowerCase().endsWith(".json"))
      .map((name) => path.join(directory, name));
  },
  size(filename) {
    return fs.statSync(filename).size;
  },
};
const dataset = {
  validate(data, filename) {
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error(`${filename}: корень JSON должен быть объектом.`);
    if (data.schema !== "onliner-publications" || data.schema_version !== 2) throw new Error(`${filename}: ожидается onliner-publications v2.`);
    if (!/^\d{6}$/.test(String(data.period || ""))) throw new Error(`${filename}: period должен иметь формат YYYYMM.`);
    if (!Array.isArray(data.records)) throw new Error(`${filename}: records должен быть массивом.`);
    if (Number(data.count) !== data.records.length) throw new Error(`${filename}: count не совпадает с records.length.`);
    data.records.forEach((record, index) => {
      if (!record || typeof record !== "object" || Array.isArray(record)) throw new Error(`${filename}: records[${index}] должен быть объектом.`);
      if (!String(record.post_id || "").trim()) throw new Error(`${filename}: records[${index}] не содержит post_id.`);
      if (!Number.isFinite(Number(record.metrics?.words))) throw new Error(`${filename}: records[${index}] не содержит metrics.words.`);
      if (!Array.isArray(record.revisions)) throw new Error(`${filename}: records[${index}] не содержит revisions.`);
    });
    return data;
  },
  timestamp(data, filename) {
    const collected = Date.parse(String(data.collected_at || ""));
    return Number.isFinite(collected) ? collected : 0;
  },
  select(entries) {
    return [...entries].sort((left, right) => right.timestamp - left.timestamp || right.filename.localeCompare(left.filename))[0];
  },
  clean(record) {
    return Object.fromEntries(recordFields.filter((field) => Object.hasOwn(record, field)).map((field) => [field, record[field]]));
  },
  prepare(data) {
    return { ...data, records: data.records.map(dataset.clean) };
  },
  verify(source, target, filename) {
    if (target.records.some((record) => Object.hasOwn(record, "content") || Object.hasOwn(record, "form_fields"))) throw new Error(`${filename}: тяжёлые поля не удалены.`);
    const sourceMadtests = source.records.filter((record) => String(record.madtest || "").trim()).length;
    const targetMadtests = target.records.filter((record) => String(record.madtest || "").trim()).length;
    if (sourceMadtests !== targetMadtests) throw new Error(`${filename}: потеряны признаки madtest.`);
    return { sourceMadtests, targetMadtests };
  },
};
const output = {
  write(directory, values, dryRun) {
    if (!dryRun) fs.mkdirSync(directory, { recursive: true });
    const summaries = values.map(({ data, filename }) => {
      const prepared = dataset.prepare(data);
      const verification = dataset.verify(data, prepared, filename);
      const content = JSON.stringify(prepared);
      const target = path.join(directory, `${data.period}.json`);
      if (!dryRun) fs.writeFileSync(target, content, "utf8");
      return {
        period: data.period,
        records: prepared.records.length,
        errors: Array.isArray(data.errors) ? data.errors.length : 0,
        madtests: verification.targetMadtests,
        source_bytes: file.size(filename),
        target_bytes: Buffer.byteLength(content),
        source: path.relative(process.cwd(), filename),
        target: path.relative(process.cwd(), target),
      };
    });
    const index = {
      schema: "onliner-ledger-local-index",
      schema_version: 1,
      datasets: values.map(({ data }) => ({ period: data.period, file: `${data.period}.json` })),
    };
    if (!dryRun) fs.writeFileSync(path.join(directory, "index.json"), `${JSON.stringify(index, null, 2)}\n`, "utf8");
    return summaries;
  },
};
const run = {
  execute(values = process.argv.slice(2)) {
    const root = process.cwd();
    const source = path.resolve(root, argument.get(values, "--source", "qa/onliner-crawler"));
    const target = path.resolve(root, argument.get(values, "--target", "local-data/ledger"));
    const dryRun = values.includes("--dry-run");
    const entries = file.list(source).map((filename) => {
      const data = dataset.validate(file.json(filename), filename);
      return { data, filename, timestamp: dataset.timestamp(data, filename) };
    });
    const selected = [...entries.reduce((map, entry) => {
      const current = map.get(entry.data.period) || [];
      map.set(entry.data.period, [...current, entry]);
      return map;
    }, new Map()).values()].map(dataset.select).sort((left, right) => left.data.period.localeCompare(right.data.period));
    if (!selected.length) throw new Error(`Нет crawler JSON в ${source}.`);
    const summaries = output.write(target, selected, dryRun);
    console.log(JSON.stringify({ dry_run: dryRun, source, target, datasets: summaries }, null, 2));
  },
};

run.execute();
