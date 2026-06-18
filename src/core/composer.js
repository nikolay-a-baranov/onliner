
import { modules } from "./modules.js";

function extractText(doc) {
  const title = doc.querySelector(".row-title")?.textContent || "";
  const content = doc.querySelector("#content")?.value || "";
  return (title + " " + content).toLowerCase();
}

export const composer = {
  build(row, doc) {
    const text = extractText(doc);

    const tags = modules.tags.analyze(doc);

    return {
      ...row,
      text,
      tags
    };
  }
};
