(() => {
  const id = "onliner-revision-compact-style";
  const old = document.getElementById(id);

  if (old) {
    old.remove();
    return;
  }

  document
    .querySelectorAll("td.diff-deletedline, td.diff-addedline, td.diff-context")
    .forEach((cell) => {
      const marker = cell.previousElementSibling;
      if (!marker || marker.tagName !== "TD") return;

      const text = marker.textContent.replace(/\u00a0/g, " ").trim();

      if (text === "+" || text === "-" || text === "") {
        marker.remove();
      }
    });

  document.querySelectorAll("table.diff colgroup").forEach((colgroup) => {
    colgroup.remove();
  });

  document.head.insertAdjacentHTML(
    "beforeend",
    `<style id="${id}">
      body.revision-php #wpbody-content {
        overflow-x: hidden !important;
      }

      body.revision-php .wrap,
      body.revision-php form,
      body.revision-php table.diff {
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }

      body.revision-php table.diff {
        table-layout: fixed !important;
      }

      body.revision-php table.diff th,
      body.revision-php table.diff td {
        white-space: normal !important;
        word-break: break-word !important;
        overflow-wrap: anywhere !important;
        vertical-align: top !important;
      }

      body.revision-php td.diff-deletedline,
      body.revision-php td.diff-addedline,
      body.revision-php td.diff-context {
        width: 50% !important;
        max-width: 50% !important;
      }

      body.revision-php table.diff pre,
      body.revision-php table.diff code {
        white-space: pre-wrap !important;
        word-break: break-word !important;
        overflow-wrap: anywhere !important;
      }
    </style>`,
  );
})();
