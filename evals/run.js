const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const evaluation = {
  root: path.resolve(__dirname, ".."),
  path: {
    suites() {
      return path.join(evaluation.root, "evals", "editorial");
    },
    prompt() {
      return path.join(evaluation.root, "src", "prompts", "editorial.js");
    },
    resolve(value = "") {
      return path.resolve(evaluation.root, String(value || ""));
    },
  },
  json: {
    read(file) {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    },
    write(file, value) {
      if (fs.existsSync(file)) throw new Error(`File already exists: ${file}`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    },
    files(root) {
      if (!fs.existsSync(root)) throw new Error(`Path not found: ${root}`);
      if (fs.statSync(root).isFile()) return [root];
      return fs.readdirSync(root, { withFileTypes: true }).flatMap((item) => {
        const file = path.join(root, item.name);
        if (item.isDirectory()) return evaluation.json.files(file);
        return item.isFile() && item.name.endsWith(".json") ? [file] : [];
      });
    },
  },
  argument(name) {
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] || "" : "";
  },
  arguments(name, count = 1) {
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv.slice(index + 1, index + 1 + count) : [];
  },
  suites(root = evaluation.path.suites()) {
    return fs
      .readdirSync(root)
      .filter((file) => file.endsWith(".json"))
      .sort()
      .map((file) => evaluation.json.read(path.join(root, file)));
  },
  cases(root = evaluation.path.suites()) {
    const cases = evaluation.suites(root).flatMap((suite) => {
      if (suite.schema !== "onliner.prompt-eval-suite/v1") {
        throw new Error(`Unsupported suite schema: ${suite.schema || "empty"}`);
      }
      return (Array.isArray(suite.cases) ? suite.cases : []).map((item) => ({
        ...item,
        task: suite.task,
        revision: suite.revision,
      }));
    });
    const ids = new Set(cases.map((item) => item.id));
    if (ids.size !== cases.length) throw new Error("Duplicate eval case id.");
    return cases;
  },
  prompt() {
    const file = evaluation.path.prompt();
    const source = fs.readFileSync(file, "utf8");
    return {
      file: path.relative(evaluation.root, file).replace(/\\/g, "/"),
      hash: crypto.createHash("sha256").update(source, "utf8").digest("hex"),
    };
  },
  template(root = evaluation.path.suites()) {
    return {
      schema: "onliner.prompt-eval-run/v1",
      createdAt: new Date().toISOString(),
      prompt: evaluation.prompt(),
      provider: "",
      model: "",
      samples: evaluation.cases(root).map((item) => ({
        caseId: item.id,
        attempt: 1,
        latencyMs: null,
        usage: {
          inputTokens: null,
          outputTokens: null,
        },
        output: null,
        review: {
          accepted: null,
          factuality: "pending",
          usefulness: null,
          notes: "",
        },
      })),
    };
  },
  check: {
    create(id, pass, detail = "") {
      return { id, pass: Boolean(pass), detail };
    },
    audit(item, output) {
      const expect = item.expect || {};
      const edits = Array.isArray(output?.edits) ? output.edits : [];
      const required = Array.isArray(expect.edits) ? expect.edits : [];
      const minimum = Number(expect.confidenceMin) || 0;
      const key = (edit) => `${String(edit?.before || "")}\u0000${String(edit?.after || "")}`;
      const requiredKeys = new Set(required.map(key));
      const outputKeys = new Set(edits.map(key));
      return [
        evaluation.check.create("audit.edits-array", Array.isArray(output?.edits)),
        evaluation.check.create(
          "audit.before-present",
          edits.every((edit) => item.input.includes(String(edit?.before || ""))),
        ),
        evaluation.check.create(
          "audit.confidence",
          edits.every((edit) => Number(edit?.confidence) >= minimum),
          `minimum=${minimum}`,
        ),
        evaluation.check.create(
          "audit.required-edits",
          [...requiredKeys].every((value) => outputKeys.has(value)),
          `required=${requiredKeys.size}`,
        ),
        evaluation.check.create(
          "audit.unexpected-edits",
          expect.allowUnexpectedEdits === true ||
            [...outputKeys].every((value) => requiredKeys.has(value)),
          `actual=${outputKeys.size}`,
        ),
      ];
    },
    slug(item, output) {
      const expect = item.expect || {};
      const value = String(output?.slug?.text || "");
      const forbidden = Array.isArray(expect.forbiddenTerms)
        ? expect.forbiddenTerms
        : [];
      return [
        evaluation.check.create(
          "slug.non-empty",
          expect.nonEmpty !== true || value.length > 0,
        ),
        evaluation.check.create(
          "slug.format",
          !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
        ),
        evaluation.check.create(
          "slug.length",
          value.length <= (Number(expect.maxLength) || 34),
          `length=${value.length}`,
        ),
        evaluation.check.create(
          "slug.forbidden-terms",
          forbidden.every((term) => !value.includes(String(term).toLowerCase())),
        ),
      ];
    },
    excerpt(item, output) {
      const expect = item.expect || {};
      const value = String(output?.excerpt?.text || "");
      const forbidden = Array.isArray(expect.forbiddenTerms)
        ? expect.forbiddenTerms
        : [];
      return [
        evaluation.check.create(
          "excerpt.non-empty",
          expect.nonEmpty !== true || value.length > 0,
        ),
        evaluation.check.create(
          "excerpt.length",
          value.length <= (Number(expect.maxLength) || 420),
          `length=${value.length}`,
        ),
        evaluation.check.create(
          "excerpt.html",
          expect.allowHtml === true || !/<[^>]+>/.test(value),
        ),
        evaluation.check.create(
          "excerpt.forbidden-terms",
          forbidden.every((term) =>
            !value.toLocaleLowerCase("ru-RU").includes(
              String(term).toLocaleLowerCase("ru-RU"),
            )),
        ),
      ];
    },
    run(item, output) {
      if (!output || typeof output !== "object") {
        return [evaluation.check.create("output.object", false)];
      }
      const task = evaluation.check[item.task];
      if (typeof task !== "function") {
        return [evaluation.check.create("task.supported", false, item.task)];
      }
      return task(item, output);
    },
  },
  review(value = {}) {
    const usefulness = Number(value.usefulness);
    return {
      reviewed:
        typeof value.accepted === "boolean" &&
        ["pass", "fail"].includes(value.factuality) &&
        usefulness >= 1 &&
        usefulness <= 5,
      accepted: value.accepted === true,
      factuality: value.factuality || "pending",
      usefulness: usefulness >= 1 && usefulness <= 5 ? usefulness : null,
      notes: String(value.notes || ""),
    };
  },
  measure: {
    audit(item, output) {
      const required = Array.isArray(item.expect?.edits) ? item.expect.edits : [];
      const edits = Array.isArray(output?.edits) ? output.edits : [];
      const key = (edit) => `${String(edit?.before || "")}\u0000${String(edit?.after || "")}`;
      const requiredKeys = new Set(required.map(key));
      const outputKeys = new Set(edits.map(key));
      const matched = [...outputKeys].filter((value) => requiredKeys.has(value)).length;
      return {
        expectedEdits: requiredKeys.size,
        suggestedEdits: outputKeys.size,
        matchedEdits: matched,
        missedEdits: requiredKeys.size - matched,
        unexpectedEdits: outputKeys.size - matched,
      };
    },
    slug(item, output) {
      return { characters: String(output?.slug?.text || "").length };
    },
    excerpt(item, output) {
      return { characters: String(output?.excerpt?.text || "").length };
    },
    run(item, output) {
      const task = evaluation.measure[item.task];
      return typeof task === "function" ? task(item, output) : {};
    },
  },
  summary(results) {
    const build = (items) => {
      const reviewed = items.filter((item) => item.review.reviewed);
      const useful = reviewed
        .map((item) => item.review.usefulness)
        .filter((value) => Number.isFinite(value));
      const latency = items
        .map((item) => item.latencyMs)
        .filter((value) => Number.isFinite(value));
      const tokens = (name) => {
        const values = items
          .map((item) => item.usage?.[name])
          .filter((value) => value != null)
          .map(Number)
          .filter((value) => Number.isFinite(value));
        return values.length
          ? values.reduce((sum, value) => sum + value, 0)
          : null;
      };
      return {
        samples: items.length,
        hardPassed: items.filter((item) => item.pass).length,
        hardFailed: items.filter((item) => !item.pass).length,
        reviewed: reviewed.length,
        accepted: reviewed.filter((item) => item.review.accepted).length,
        acceptanceRate: reviewed.length
          ? reviewed.filter((item) => item.review.accepted).length / reviewed.length
          : null,
        factualityFailed: reviewed.filter(
          (item) => item.review.factuality === "fail",
        ).length,
        usefulnessAverage: useful.length
          ? useful.reduce((sum, value) => sum + value, 0) / useful.length
          : null,
        latencyAverageMs: latency.length
          ? latency.reduce((sum, value) => sum + value, 0) / latency.length
          : null,
        inputTokens: tokens("inputTokens"),
        outputTokens: tokens("outputTokens"),
      };
    };
    const audit = results.filter((item) => item.task === "audit");
    const expected = audit.reduce(
      (sum, item) => sum + Number(item.metrics.expectedEdits || 0),
      0,
    );
    const suggested = audit.reduce(
      (sum, item) => sum + Number(item.metrics.suggestedEdits || 0),
      0,
    );
    const matched = audit.reduce(
      (sum, item) => sum + Number(item.metrics.matchedEdits || 0),
      0,
    );
    return {
      all: build(results),
      audit: {
        ...build(audit),
        editPrecision: suggested ? matched / suggested : null,
        editRecall: expected ? matched / expected : null,
      },
      slug: build(results.filter((item) => item.task === "slug")),
      excerpt: build(results.filter((item) => item.task === "excerpt")),
    };
  },
  score(run, root = evaluation.path.suites()) {
    if (run.schema !== "onliner.prompt-eval-run/v1") {
      throw new Error(`Unsupported run schema: ${run.schema || "empty"}`);
    }
    const cases = new Map(evaluation.cases(root).map((item) => [item.id, item]));
    const samples = Array.isArray(run.samples) ? run.samples : [];
    const results = samples.map((sample) => {
      const item = cases.get(sample.caseId);
      if (!item) {
        return {
          caseId: sample.caseId,
          task: "unknown",
          attempt: sample.attempt || 1,
          pass: false,
          checks: [evaluation.check.create("case.known", false)],
          review: evaluation.review(sample.review),
          metrics: {},
        };
      }
      const checks = evaluation.check.run(item, sample.output);
      return {
        caseId: item.id,
        task: item.task,
        attempt: sample.attempt || 1,
        pass: checks.every((check) => check.pass),
        checks,
        review: evaluation.review(sample.review),
        metrics: evaluation.measure.run(item, sample.output),
        latencyMs: Number(sample.latencyMs) || null,
        usage: sample.usage || null,
      };
    });
    const covered = new Set(results.map((item) => item.caseId));
    const missing = [...cases.keys()].filter((id) => !covered.has(id));
    return {
      schema: "onliner.prompt-eval-report/v1",
      createdAt: new Date().toISOString(),
      run: {
        provider: run.provider || "",
        model: run.model || "",
        prompt: run.prompt || null,
      },
      summary: {
        cases: cases.size,
        missing: missing.length,
        ...evaluation.summary(results),
      },
      missing,
      results,
    };
  },
  compare(baseline, candidate) {
    const metric = (report, task, name) => report.summary?.[task]?.[name] ?? null;
    const delta = (before, after) =>
      Number.isFinite(before) && Number.isFinite(after) ? after - before : null;
    const tasks = ["all", "audit", "slug", "excerpt"];
    const names = [
      "hardPassed",
      "hardFailed",
      "acceptanceRate",
      "factualityFailed",
      "usefulnessAverage",
      "latencyAverageMs",
      "inputTokens",
      "outputTokens",
      "editPrecision",
      "editRecall",
    ];
    const metrics = Object.fromEntries(tasks.map((task) => [
      task,
      Object.fromEntries(names.map((name) => {
        const before = metric(baseline, task, name);
        const after = metric(candidate, task, name);
        return [name, { baseline: before, candidate: after, delta: delta(before, after) }];
      })),
    ]));
    return {
      schema: "onliner.prompt-eval-comparison/v1",
      createdAt: new Date().toISOString(),
      baseline: baseline.run,
      candidate: candidate.run,
      coverage: {
        baselineMissing: baseline.summary.missing,
        candidateMissing: candidate.summary.missing,
      },
      comparable: {
        provider: baseline.run.provider === candidate.run.provider,
        model: baseline.run.model === candidate.run.model,
        samples:
          baseline.summary.all.samples === candidate.summary.all.samples,
      },
      metrics,
    };
  },
  observations(root) {
    const records = evaluation.json
      .files(root)
      .sort()
      .map((file) => ({ file, value: evaluation.json.read(file) }))
      .filter(({ value }) => value.schema === "onliner.prompt-eval-observation/v1")
      .map(({ file, value }) => {
        const generated = Array.isArray(value.suggestions?.generated)
          ? value.suggestions.generated
          : [];
        const presented = Array.isArray(value.suggestions?.presented)
          ? value.suggestions.presented
          : [];
        const decisions = Array.isArray(value.review?.decisions)
          ? value.review.decisions
          : [];
        const accepted = decisions.filter((item) => item.outcome === "accepted");
        const dismissed = decisions.filter((item) => item.outcome === "dismissed");
        const started = Date.parse(value.execution?.startedAt || "");
        const completed = Date.parse(value.execution?.completedAt || "");
        return {
          file: path.relative(evaluation.root, file).replace(/\\/g, "/"),
          capturedAt: value.capturedAt || "",
          postId: value.context?.postId || "unknown",
          provider: value.execution?.provider || "",
          model: value.execution?.model || "",
          latencyMs:
            Number.isFinite(started) && Number.isFinite(completed)
              ? Math.max(0, completed - started)
              : null,
          usage: value.execution?.usage || null,
          task: value.task || null,
          prompt: {
            hash: value.prompt?.hash || "",
            hashAlgorithm: value.prompt?.hashAlgorithm || "",
          },
          generated: generated.length,
          presented: presented.length,
          runtimeFiltered: Math.max(0, generated.length - presented.length),
          accepted: accepted.length,
          dismissed: dismissed.length,
          pending: Math.max(0, presented.length - accepted.length - dismissed.length),
          customized: accepted.filter(
            (item) => String(item.applied || "") !== String(item.suggested || ""),
          ).length,
          slug: String(value.output?.slug?.text || ""),
          excerpt: String(value.output?.excerpt?.text || ""),
        };
      });
    const sum = (name, items = records) => items.reduce(
      (total, item) => total + Number(item[name] || 0),
      0,
    );
    const summarize = (items) => {
      const accepted = sum("accepted", items);
      const dismissed = sum("dismissed", items);
      const presented = sum("presented", items);
      const decided = accepted + dismissed;
      const latency = items
        .map((item) => item.latencyMs)
        .filter((value) => Number.isFinite(value));
      const tokens = (name) => {
        const values = items
          .map((item) => item.usage?.[name])
          .filter((value) => value != null)
          .map(Number)
          .filter((value) => Number.isFinite(value));
        return values.length
          ? values.reduce((total, value) => total + value, 0)
          : null;
      };
      return {
        observations: items.length,
        generated: sum("generated", items),
        presented,
        runtimeFiltered: sum("runtimeFiltered", items),
        accepted,
        dismissed,
        pending: sum("pending", items),
        customized: sum("customized", items),
        acceptanceRate: decided ? accepted / decided : null,
        resolutionRate: presented ? decided / presented : null,
        latencyAverageMs: latency.length
          ? latency.reduce((total, value) => total + value, 0) / latency.length
          : null,
        inputTokens: tokens("inputTokens"),
        outputTokens: tokens("outputTokens"),
        slugNonEmpty: items.filter((item) => item.slug).length,
        excerptNonEmpty: items.filter((item) => item.excerpt).length,
      };
    };
    const groups = new Map();
    records.forEach((item) => {
      const key = [
        item.task?.id || "unknown",
        item.task?.revision || "unknown",
        item.prompt.hash || "unknown",
        item.provider || "unknown",
        item.model || "unknown",
      ].join("|");
      groups.set(key, [...(groups.get(key) || []), item]);
    });
    return {
      schema: "onliner.prompt-eval-observation-report/v1",
      createdAt: new Date().toISOString(),
      summary: summarize(records),
      executions: Object.fromEntries(
        [...groups.entries()].map(([key, items]) => [key, summarize(items)]),
      ),
      records,
    };
  },
  print(report) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (report.summary.all.hardFailed || report.summary.missing) process.exitCode = 1;
  },
  printComparison(report) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (
      report.coverage.candidateMissing > report.coverage.baselineMissing ||
      !Object.values(report.comparable).every(Boolean) ||
      report.metrics.all.hardFailed.candidate > report.metrics.all.hardFailed.baseline
    ) {
      process.exitCode = 1;
    }
  },
  run() {
    const suites = evaluation.argument("--suites");
    const root = suites
      ? evaluation.path.resolve(suites)
      : evaluation.path.suites();
    const init = evaluation.argument("--init");
    if (init) {
      const file = evaluation.path.resolve(init);
      evaluation.json.write(file, evaluation.template(root));
      process.stdout.write(`${path.relative(evaluation.root, file)}\n`);
      return;
    }
    const compare = evaluation.arguments("--compare", 2);
    if (compare.length === 2) {
      const reports = compare.map((file) =>
        evaluation.score(
          evaluation.json.read(evaluation.path.resolve(file)),
          root,
        ),
      );
      evaluation.printComparison(evaluation.compare(reports[0], reports[1]));
      return;
    }
    const observations = evaluation.argument("--observations");
    if (observations) {
      process.stdout.write(`${JSON.stringify(
        evaluation.observations(evaluation.path.resolve(observations)),
        null,
        2,
      )}\n`);
      return;
    }
    const run = evaluation.argument("--run");
    if (!run) {
      throw new Error("Use --init, --run, --compare or --observations.");
    }
    evaluation.print(
      evaluation.score(evaluation.json.read(evaluation.path.resolve(run)), root),
    );
  },
};

try {
  evaluation.run();
} catch (error) {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
}
