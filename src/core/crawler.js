
export const crawler = {
  run,
};

async function run({
  startUrl,
  getRows,
  getNextPage,
  fetchDetail,
  shouldStop = () => false,
  onRow = () => {},
}) {
  let url = startUrl;
  const results = [];

  while (url && !shouldStop()) {
    const doc = await load(url);
    const rows = getRows(doc);

    for (const row of rows) {
      if (shouldStop()) break;

      const detailDoc = await load(row.edit || row.url);
      const enriched = await fetchDetail(row, detailDoc);

      results.push(enriched);
      onRow(enriched);
    }

    url = getNextPage(doc);
  }

  return results;
}

async function load(url) {
  const res = await fetch(url, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const html = await res.text();
  return new DOMParser().parseFromString(html, "text/html");
}
