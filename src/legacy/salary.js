(() => {
  const nb = "1TSNzzpZnt6aomXp4NQHOWouwW3FxfgQ7R0hgZH4h_io";
  const id = location.pathname.match(/\/d\/([^/]+)/)?.[1];
  if (id !== nb) {
    open(`https://docs.google.com/spreadsheets/d/${nb}`, "_blank");
    return;
  }
  const url =
    "https://script.google.com/a/macros/onliner.by/s/AKfycbwdOHo4MKU_6Pn7hjVz3XGDwInsfSVBM6A0zhRIiJOSMcwiitQkchscTXlhengWMl3h0w/exec";
  open(url, "_blank");
})();
