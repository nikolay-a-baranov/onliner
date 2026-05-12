import { frame } from "./core/panel.js";
import { css } from "./core/css.js";

(() => {
  const RevisionDiff = {
    ids: {
      style: "odi-style",
      panel: "odi-panel",
      inlineBox: "odi-inline-box",
    },

    init() {
      frame.mount("diff-panel-style", css.diff.panel());
      const mode = document.body.dataset.odiMode;

      this.clearView();

      if (mode === "compact") {
        this.inline();
        document.body.dataset.odiMode = "inline";
      } else {
        this.compact();
        document.body.dataset.odiMode = "compact";
      }
    },

    tables() {
      return [...document.querySelectorAll("table.diff")].filter((table) =>
        table.querySelector(".diff-deletedline,.diff-addedline,.diff-context"),
      );
    },

    decodeEntities(html) {
      const textarea = document.createElement("textarea");
      textarea.innerHTML = html;
      return textarea.value;
    },

    unwrapDiffTags(html) {
      return html.replace(/<\/?(ins|del)[^>]*>/gi, "");
    },

    decodeForAnalysis(html) {
      return this.decodeEntities(this.unwrapDiffTags(html));
    },

    visibleText(html) {
      return this.decodeForAnalysis(html)
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    },

    markupSkeleton(html) {
      return (this.decodeForAnalysis(html).match(/<\/?[a-z][^>]*>/gi) || [])
        .map((tag) => tag.replace(/\s+/g, " ").toLowerCase())
        .join(" ");
    },

    decodeWidgetPayloads(html) {
      return html.replace(
        /(\[onliner-promo-widget\])({[\s\S]*?})(\[\/onliner-promo-widget\])/g,
        (match, open, json, close) => {
          try {
            const data = JSON.parse(this.decodeEntities(json));

            if (typeof data.text === "string") {
              data.text = this.decodeEntities(data.text);
            }

            return (
              open +
              "<pre>" +
              this.escapeHtml(JSON.stringify(data, null, 2)) +
              "</pre>" +
              close
            );
          } catch {
            return match;
          }
        },
      );
    },

    displayHtml(html) {
      return this.decodeWidgetPayloads(html);
    },

    escapeHtml(text) {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    },

    classifyLine(del, add) {
      const oldHtml = del ? del.innerHTML : "";
      const newHtml = add ? add.innerHTML : "";

      const oldText = this.visibleText(oldHtml);
      const newText = this.visibleText(newHtml);

      const oldMarkup = this.markupSkeleton(oldHtml);
      const newMarkup = this.markupSkeleton(newHtml);

      if (!del || !add) {
        const html = del ? oldHtml : newHtml;

        return {
          text: !!this.visibleText(html),
          markup: !!this.markupSkeleton(html),
        };
      }

      return {
        text: oldText !== newText,
        markup: oldMarkup !== newMarkup,
      };
    },

    stats(tables) {
      const stats = {
        inserted: 0,
        deleted: 0,
        addedLines: 0,
        deletedLines: 0,
        text: 0,
        markup: 0,
        mixed: 0,
        warnings: [],
      };

      tables.forEach((table) => {
        stats.inserted += table.querySelectorAll("ins").length;
        stats.deleted += table.querySelectorAll("del").length;
        stats.addedLines += table.querySelectorAll(".diff-addedline").length;
        stats.deletedLines +=
          table.querySelectorAll(".diff-deletedline").length;

        table.querySelectorAll("tr").forEach((tr) => {
          const del = tr.querySelector(".diff-deletedline");
          const add = tr.querySelector(".diff-addedline");

          if (!del && !add) return;

          const type = this.classifyLine(del, add);

          if (type.text) stats.text++;
          if (type.markup) stats.markup++;
          if (type.text && type.markup) stats.mixed++;
        });
      });

      if (stats.deletedLines > 20) stats.warnings.push("много удалённых строк");
      if (stats.addedLines > 20) stats.warnings.push("много добавленных строк");
      if (stats.markup > 10) stats.warnings.push("много правок разметки");
      if (stats.mixed > 10) stats.warnings.push("много смешанных строк");

      return stats;
    },

    hideMarkers() {
      document
        .querySelectorAll(
          "td.diff-deletedline,td.diff-addedline,td.diff-context",
        )
        .forEach((td) => {
          const marker = td.previousElementSibling;

          if (
            marker &&
            marker.tagName === "TD" &&
            /^[+\-\s\u00a0]*$/.test(marker.textContent)
          ) {
            marker.dataset.odiMarker = "1";
            marker.dataset.odiDisplay = marker.style.display || "";
            marker.style.display = "none";
          }
        });
    },

    restoreMarkers() {
      document.querySelectorAll("[data-odi-marker]").forEach((marker) => {
        marker.style.display = marker.dataset.odiDisplay || "";
        marker.removeAttribute("data-odi-marker");
        marker.removeAttribute("data-odi-display");
      });
    },

    decodeDiffCells() {
      document
        .querySelectorAll(
          "td.diff-deletedline,td.diff-addedline,td.diff-context",
        )
        .forEach((td) => {
          if (td.dataset.odiHtml) return;

          td.dataset.odiHtml = td.innerHTML;
          td.innerHTML = this.displayHtml(td.innerHTML);
        });
    },

    restoreDiffCells() {
      document.querySelectorAll("[data-odi-html]").forEach((td) => {
        td.innerHTML = td.dataset.odiHtml;
        td.removeAttribute("data-odi-html");
      });
    },

    compact() {
      const tables = this.tables();
      if (!tables.length) return alert("Diff-таблицы не найдены");

      this.hideMarkers();
      this.decodeDiffCells();
      this.addCompactStyle();
      this.addPanel(this.stats(tables));
    },

    inline() {
      const tables = this.tables();
      if (!tables.length) return alert("Diff-таблицы не найдены");

      tables.forEach((table) => {
        const html = [...table.querySelectorAll("tr")]
          .map((tr) => this.lineHtml(tr))
          .join("");

        table.dataset.odiHidden = "1";
        table.dataset.odiDisplay = table.style.display || "";
        table.style.display = "none";

        table.insertAdjacentHTML(
          "beforebegin",
          `<div class="${this.ids.inlineBox}">${html}</div>`,
        );
      });

      this.addInlineStyle();
      this.addPanel(this.stats(tables));
    },

    lineHtml(tr) {
      const del = tr.querySelector(".diff-deletedline");
      const add = tr.querySelector(".diff-addedline");
      const ctx = tr.querySelector(".diff-context");

      if (del && add) {
        return `<div class="odi-line odi-change">${this.displayHtml(del.innerHTML)}<br>${this.displayHtml(add.innerHTML)}</div>`;
      }

      if (add) {
        return `<div class="odi-line odi-add">${this.displayHtml(add.innerHTML)}</div>`;
      }

      if (del) {
        return `<div class="odi-line odi-del">${this.displayHtml(del.innerHTML)}</div>`;
      }

      if (ctx) {
        return `<div class="odi-line">${this.displayHtml(ctx.innerHTML)}</div>`;
      }

      return "";
    },

    addPanel(stats) {
      const warningHtml = stats.warnings.length
        ? `<hr><div>⚠️ ${stats.warnings.join("<br>⚠️ ")}</div>`
        : "";

      document.body.insertAdjacentHTML(
        "beforeend",
        `<div id="${this.ids.panel}" class="panel">
          <div>Вставки: <b>${stats.inserted}</b> / строк: <b>${stats.addedLines}</b></div>
          <div>Удаления: <b>${stats.deleted}</b> / строк: <b>${stats.deletedLines}</b></div>
          <hr>
          <div>Текст: <b>${stats.text}</b></div>
          <div>Разметка: <b>${stats.markup}</b></div>
          <div>Смешанное: <b>${stats.mixed}</b></div>
          ${warningHtml}
        </div>`,
      );
    },

    addCompactStyle() {
      document.head.insertAdjacentHTML(
        "beforeend",
        `<style id="${this.ids.style}">
          body.revision-php #wpbody-content {
            overflow-x: hidden !important;
          }

          table.diff {
            width: 100% !important;
            max-width: 100% !important;
            table-layout: fixed !important;
          }

          table.diff colgroup {
            display: none !important;
          }

          table.diff td[colspan="2"] {
            display: none !important;
          }

          table.diff td,
          table.diff th,
          table.diff pre,
          table.diff code {
            white-space: pre-wrap !important;
            word-break: break-word !important;
            overflow-wrap: anywhere !important;
            vertical-align: top !important;
          }

          .diff-deletedline,
          .diff-addedline,
          .diff-context {
            width: 50% !important;
            max-width: 50% !important;
          }

          table.diff pre {
            margin: 6px 0;
            padding: 8px;
            background: rgba(0,0,0,.04);
            border: 1px solid rgba(0,0,0,.08);
          }

          ${this.panelCss()}
        </style>`,
      );
    },

    addInlineStyle() {
      document.head.insertAdjacentHTML(
        "beforeend",
        `<style id="${this.ids.style}">
          .${this.ids.inlineBox} {
            width: 100%;
            box-sizing: border-box;
            margin: 12px 0;
            padding: 12px;
            background: #fff;
            border: 1px solid #ddd;
            font: 13px/1.5 Consolas, Monaco, monospace;
          }

          .${this.ids.inlineBox},
          .${this.ids.inlineBox} * {
            white-space: pre-wrap !important;
            word-break: break-word !important;
            overflow-wrap: anywhere !important;
            box-sizing: border-box !important;
          }

          .${this.ids.inlineBox} pre {
            margin: 6px 0;
            padding: 8px;
            background: rgba(0,0,0,.04);
            border: 1px solid rgba(0,0,0,.08);
          }

          .odi-line {
            padding: 4px 6px;
            border-bottom: 1px solid #eee;
          }

          .odi-add {
            background: #eaffea;
          }

          .odi-del {
            background: #ffecec;
          }

          .odi-change {
            background: #fff8dc;
          }

          .${this.ids.inlineBox} ins {
            background: #b7f7b7 !important;
            text-decoration: none !important;
          }

          .${this.ids.inlineBox} del {
            background: #ffb8b8 !important;
            text-decoration: line-through !important;
          }

          ${this.panelCss()}
        </style>`,
      );
    },

    panelCss() {
      return "";
    },

    clearView() {
      document.getElementById(this.ids.style)?.remove();
      document.getElementById(this.ids.panel)?.remove();

      document
        .querySelectorAll(`.${this.ids.inlineBox}`)
        .forEach((box) => box.remove());

      document.querySelectorAll("[data-odi-hidden]").forEach((table) => {
        table.style.display = table.dataset.odiDisplay || "";
        table.removeAttribute("data-odi-hidden");
        table.removeAttribute("data-odi-display");
      });

      this.restoreDiffCells();
      this.restoreMarkers();
    },
  };

  RevisionDiff.init();
})();
