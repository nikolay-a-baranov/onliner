(() => {
  const normalize = (text) => {
    let quotes = 0;
    return text
      .replace(/\u00A0/g, " ")
      .replace(/"/g, () =>
        quotes++ % 4 < 2 ? (quotes % 2 ? "«" : "»") : quotes % 2 ? "„" : "“",
      )
      .replaceAll("'", "’")
      .replace(/\s*[-–—−]\s*/g, " — ")
      .replace(/[ \t]+/g, " ")
      .trim();
  };

  const sanitize = (element) => {
    const before = element.value;
    const after = normalize(before);
    if (before !== after) {
      element.value = after;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.style.outline = "2px solid orange";
    }
  };

  [
    "#title",
    "input[name='rotation_titles[]']",
    "#favourite_title",
    "input[name='seo_title']",
  ].forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      sanitize(element);
    });
  });
})();
