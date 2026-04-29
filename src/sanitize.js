(() => {
  const key = "__onlinerSanitize";
  const selectors = [
    "#title",
    "input[name='rotation_titles[]']",
    "#favourite_title",
    "input[name='seo_title']",
  ];

  const normalize = (text) => {
    let quotes = 0;
    return text
      .replace(/\u00A0/g, "\u0020")
      .replace(/\u0022/g, () =>
        quotes++ % 4 < 2
          ? quotes % 2
            ? "\u00ab"
            : "\u00bb"
          : quotes % 2
            ? "\u201e"
            : "\u201c",
      )
      .replace(/\u0027/g, "\u2019")
      .replace(/\s*[-\u2013\u2014\u2212]\s*/g, "\u0020\u2014\u0020")
      .replace(/[\u0020\u0009]+/g, "\u0020")
      .trim();
  };

  const emit = (element) => {
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const paint = (element, changed, sanitized) => {
    if (!changed) {
      element.style.outline = "";
      return;
    }
    element.style.outline = sanitized
      ? "2px solid seagreen"
      : "2px solid crimson";
  };

  const state = (window[key] ??= {
    sanitized: false,
    records: {},
  });

  const records = selectors.flatMap((selector) =>
    Array.from(document.querySelectorAll(selector)).map((element, index) => {
      const id = `${selector}::${index}`;
      const record = (state.records[id] ??= {
        original: element.value,
      });
      record.element = element;
      record.sanitized = normalize(record.original);
      return record;
    }),
  );

  if (!state.sanitized) {
    records.forEach((record) => {
      record.original = record.element.value;
      record.sanitized = normalize(record.original);
    });
  }

  state.sanitized = !state.sanitized;

  records.forEach((record) => {
    const { element, original, sanitized } = record;
    const changed = original !== sanitized;
    const value = state.sanitized ? sanitized : original;
    if (element.value !== value) {
      element.value = value;
      emit(element);
    }
    paint(element, changed, state.sanitized);
  });
})();
