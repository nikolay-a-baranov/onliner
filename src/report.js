import { crawler } from "./core/crawler.js";

const report = {
  text(doc) {
    const title = doc.querySelector(".row-title")?.textContent || "";
    const content = doc.querySelector("#content")?.value || "";
    return `${title} ${content}`.toLowerCase();
  },
  tags: {
    rules: [
      {
        name: "vacancies",
        keywords: [
          "\u0432\u0430\u043a\u0430\u043d\u0441\u0438\u044f",
          "\u0440\u0430\u0431\u043e\u0442\u0430",
          "\u0437\u0430\u0440\u043f\u043b\u0430\u0442\u0430",
          "\u043e\u0444\u0438\u0441",
          "\u0440\u0435\u0437\u044e\u043c\u0435",
        ],
      },
      {
        name: "politics",
        keywords: [
          "\u0437\u0430\u043a\u043e\u043d",
          "\u043c\u0438\u043d\u0438\u0441\u0442\u0440",
          "\u043f\u0440\u0435\u0437\u0438\u0434\u0435\u043d\u0442",
          "\u0433\u043e\u0441\u0434\u0443\u043c\u0430",
        ],
      },
    ],
    score(rule, text) {
      let score = 0;
      for (const keyword of rule.keywords) {
        if (text.includes(keyword)) score += 1;
      }
      return score;
    },
    analyze(text) {
      return report.tags.rules
        .map((rule) => ({
          tag: rule.name,
          score: report.tags.score(rule, text),
        }))
        .filter((item) => item.score > 0)
        .sort((left, right) => right.score - left.score)
        .map((item) => item.tag);
    },
  },
  compose(row, doc) {
    const text = report.text(doc);
    return {
      ...row,
      text,
      tags: report.tags.analyze(text),
    };
  },
  dataset(records) {
    return records.map((item) => ({
      id: item.id,
      title: item.title,
      text: item.text,
      tags: item.tags,
    }));
  },
};

export async function runReport(choice) {
  const records = await crawler.run({
    startUrl: buildUrl(choice),
    getRows(doc) {
      return getRows(doc, choice.section);
    },
    getNextPage(doc) {
      return getNextUrl(doc);
    },
    fetchDetail(row, doc) {
      return report.compose(row, doc);
    },
    shouldStop() {
      return window.reportStop;
    },
    onRow() {},
  });
  return {
    records,
    dataset: report.dataset(records),
  };
}
