
function extractText(doc) {
  const title = doc.querySelector(".row-title")?.textContent || "";
  const content = doc.querySelector("#content")?.value || "";
  return (title + " " + content).toLowerCase();
}

const TAG_RULES = [
  {
    name: "vacancies",
    keywords: ["вакансия", "работа", "зарплата", "офис", "резюме"]
  },
  {
    name: "politics",
    keywords: ["закон", "министр", "президент", "госдума"]
  }
];

function scoreTag(tag, text) {
  let score = 0;
  for (const kw of tag.keywords) {
    if (text.includes(kw)) score += 1;
  }
  return score;
}

function analyzeTags(doc) {
  const text = extractText(doc);

  return TAG_RULES
    .map(t => ({ tag: t.name, score: scoreTag(t, text) }))
    .filter(x => x.score > 0)
    .sort((a,b) => b.score - a.score)
    .map(x => x.tag);
}

export const modules = {
  tags: {
    analyze: analyzeTags
  }
};
