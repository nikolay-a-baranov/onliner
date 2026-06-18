
import { crawler } from "../core/crawler.js";
import { composer } from "../core/composer.js";

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
      return composer.build(row, doc);
    },

    shouldStop() {
      return window.reportStop;
    },

    onRow(row) {
      // optional realtime hook
    }
  });

  const dataset = records.map(r => ({
    id: r.id,
    title: r.title,
    text: r.text,
    tags: r.tags
  }));

  return {
    records,
    dataset
  };
}
