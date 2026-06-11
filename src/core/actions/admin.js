import { panel } from "../panel.js";
import { css } from "../css.js";
import { ui } from "../ui.js";
import { cms } from "../cms.js";
import { field } from "../dom.js";
import { widget } from "../widget.js";
import { tag } from "../../pipe/tag.js";
import { text } from "../../pipe/text.js";

export const createAdmin = () => {
  const admin = {
    diff: {
      ids: {
        style: "diff-style",
        panel: "diff-panel",
        inlineBox: "diff-inline-box",
      },
      legacy: {
        styles: ["odi-style", "diff-panel-style"],
        panels: ["odi-panel"],
        inlineBox: "odi-inline-box",
      },
      tables() {
        return [...document.querySelectorAll("table.diff")].filter((table) =>
          table.querySelector(".diff-deletedline,.diff-addedline,.diff-context"),
        );
      },
      decode(value) {
        const textarea = document.createElement("textarea");
        textarea.innerHTML = String(value || "");
        return textarea.value;
      },
      unwrap(value) {
        return String(value || "").replace(/<\/?(ins|del)[^>]*>/gi, "");
      },
      analyze(value) {
        return admin.diff.decode(admin.diff.unwrap(value));
      },
      visible(value) {
        return admin.diff
          .analyze(value)
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .trim();
      },
      skeleton(value) {
        return (admin.diff.analyze(value).match(/<\/?[a-z][^>]*>/gi) || [])
          .map((tag) => tag.replace(/\s+/g, " ").toLowerCase())
          .join(" ");
      },
      escape(value) {
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      },
      payloads(value) {
        return String(value || "").replace(
          /(\[onliner-promo-widget\])({[\s\S]*?})(\[\/onliner-promo-widget\])/g,
          (match, open, json, close) => {
            try {
              const data = JSON.parse(admin.diff.decode(json));
              if (typeof data.text === "string") {
                data.text = admin.diff.decode(data.text);
              }
              return `${open}<pre>${admin.diff.escape(
                JSON.stringify(data, null, 2),
              )}</pre>${close}`;
            } catch {
              return match;
            }
          },
        );
      },
      display(value) {
        return admin.diff.payloads(value);
      },
      classify(deleted, added) {
        const deletedHtml = deleted ? deleted.innerHTML : "";
        const addedHtml = added ? added.innerHTML : "";
        if (!deleted || !added) {
          const html = deleted ? deletedHtml : addedHtml;
          return {
            text: Boolean(admin.diff.visible(html)),
            markup: Boolean(admin.diff.skeleton(html)),
          };
        }
        return {
          text: admin.diff.visible(deletedHtml) !== admin.diff.visible(addedHtml),
          markup:
            admin.diff.skeleton(deletedHtml) !== admin.diff.skeleton(addedHtml),
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
          stats.deletedLines += table.querySelectorAll(".diff-deletedline").length;
          table.querySelectorAll("tr").forEach((row) => {
            const deleted = row.querySelector(".diff-deletedline");
            const added = row.querySelector(".diff-addedline");
            if (!deleted && !added) return;
            const type = admin.diff.classify(deleted, added);
            if (type.text) stats.text += 1;
            if (type.markup) stats.markup += 1;
            if (type.text && type.markup) stats.mixed += 1;
          });
        });
        if (stats.deletedLines > 20) stats.warnings.push("много удалённых строк");
        if (stats.addedLines > 20) stats.warnings.push("много добавленных строк");
        if (stats.markup > 10) stats.warnings.push("много правок разметки");
        if (stats.mixed > 10) stats.warnings.push("много смешанных строк");
        return stats;
      },
      theme() {
        return (
          document.querySelector('.panel[data-ui-surface="toolbar"]')?.dataset
            ?.theme ||
          document.getElementById("reader-panel")?.dataset?.theme ||
          "light"
        );
      },
      mode: {
        get() {
          return document.body.dataset.diffMode || document.body.dataset.odiMode || "";
        },
        set(value) {
          document.body.dataset.diffMode = value;
          delete document.body.dataset.odiMode;
        },
        clear() {
          delete document.body.dataset.diffMode;
          delete document.body.dataset.odiMode;
        },
      },
      style() {
        panel.mount(admin.diff.ids.style, css.diff.panel());
      },
      markers() {
        document
          .querySelectorAll("td.diff-deletedline,td.diff-addedline,td.diff-context")
          .forEach((cell) => {
            const marker = cell.previousElementSibling;
            if (
              marker &&
              marker.tagName === "TD" &&
              /^[+\-\s\u00a0]*$/.test(marker.textContent)
            ) {
              marker.dataset.diffMarker = "1";
              marker.dataset.diffDisplay = marker.style.display || "";
              marker.style.display = "none";
            }
          });
      },
      restoreMarkers() {
        document.querySelectorAll("[data-diff-marker],[data-odi-marker]").forEach((marker) => {
          marker.style.display =
            marker.dataset.diffDisplay || marker.dataset.odiDisplay || "";
          marker.removeAttribute("data-diff-marker");
          marker.removeAttribute("data-diff-display");
          marker.removeAttribute("data-odi-marker");
          marker.removeAttribute("data-odi-display");
        });
      },
      cells() {
        document
          .querySelectorAll("td.diff-deletedline,td.diff-addedline,td.diff-context")
          .forEach((cell) => {
            if (cell.dataset.diffHtml || cell.dataset.odiHtml) return;
            cell.dataset.diffHtml = cell.innerHTML;
            cell.innerHTML = admin.diff.display(cell.innerHTML);
          });
      },
      restoreCells() {
        document.querySelectorAll("[data-diff-html],[data-odi-html]").forEach((cell) => {
          cell.innerHTML = cell.dataset.diffHtml || cell.dataset.odiHtml || "";
          cell.removeAttribute("data-diff-html");
          cell.removeAttribute("data-odi-html");
        });
      },
      stat(label, value, tone = "neutral") {
        return `<div class="diff-stat" data-diff-tone="${tone}"><span class="diff-stat-label">${label}</span><b class="diff-stat-value">${value}</b></div>`;
      },
      panel(stats) {
        const close = ui.controls.button({
          content: "×",
          action: "diff.clear",
          title: "Закрыть",
          attrs: ' type="button"',
        });
        const warnings = stats.warnings.length
          ? `<div class="diff-warnings">${stats.warnings
              .map((item) => `<div class="diff-warning">${admin.diff.escape(item)}</div>`)
              .join("")}</div>`
          : "";
        const head = ui.shell.shell({
          classes: "diff-head",
          left: '<div class="diff-title">Дифф</div>',
          right: ui.shell.group(close, { rail: true }),
        });
        const changes = ui.shell.group(
          [
            admin.diff.stat("Вставки", stats.inserted, "add"),
            admin.diff.stat("Строк", stats.addedLines, "add"),
            admin.diff.stat("Удаления", stats.deleted, "del"),
            admin.diff.stat("Строк", stats.deletedLines, "del"),
          ].join(""),
          { classes: "diff-stat-group", rail: true },
        );
        const types = ui.shell.group(
          [
            admin.diff.stat("Текст", stats.text),
            admin.diff.stat("Разметка", stats.markup),
            admin.diff.stat("Смешанное", stats.mixed),
          ].join(""),
          { classes: "diff-stat-group", rail: true },
        );
        const element = panel.create({
          id: admin.diff.ids.panel,
          html: ui.shell.stack(`${head}${changes}${types}${warnings}`),
        });
        element.dataset.uiSurface = "toolbar";
        element.dataset.uiFrame = "capsule";
        element.dataset.toolbarFlow = "rail";
        ui.surface.sync(element, { theme: admin.diff.theme(), surface: "toolbar" });
        element.addEventListener("click", (event) => {
          const action = event.target.closest("[data-action]")?.dataset?.action;
          if (action !== "diff.clear") return;
          admin.diff.clear();
          admin.diff.mode.clear();
        });
      },
      linePart(kind, value) {
        return `<div class="diff-line-part" data-diff-part="${kind}">${admin.diff.display(value)}</div>`;
      },
      line(row) {
        const deleted = row.querySelector(".diff-deletedline");
        const added = row.querySelector(".diff-addedline");
        const context = row.querySelector(".diff-context");
        if (deleted && added) {
          return `<div class="diff-line" data-diff-line="change">${admin.diff.linePart(
            "deleted",
            deleted.innerHTML,
          )}${admin.diff.linePart("added", added.innerHTML)}</div>`;
        }
        if (added) {
          return `<div class="diff-line" data-diff-line="added">${admin.diff.linePart(
            "added",
            added.innerHTML,
          )}</div>`;
        }
        if (deleted) {
          return `<div class="diff-line" data-diff-line="deleted">${admin.diff.linePart(
            "deleted",
            deleted.innerHTML,
          )}</div>`;
        }
        if (context) {
          return `<div class="diff-line" data-diff-line="context">${admin.diff.linePart(
            "context",
            context.innerHTML,
          )}</div>`;
        }
        return "";
      },
      compact() {
        const tables = admin.diff.tables();
        if (!tables.length) {
          alert("Diff-таблицы не найдены");
          return false;
        }
        admin.diff.markers();
        admin.diff.cells();
        admin.diff.mode.set("compact");
        admin.diff.panel(admin.diff.stats(tables));
        return true;
      },
      inline() {
        const tables = admin.diff.tables();
        if (!tables.length) {
          alert("Diff-таблицы не найдены");
          return false;
        }
        tables.forEach((table) => {
          const html = [...table.querySelectorAll("tr")]
            .map((row) => admin.diff.line(row))
            .join("");
          table.dataset.diffHidden = "1";
          table.dataset.diffDisplay = table.style.display || "";
          table.style.display = "none";
          table.insertAdjacentHTML(
            "beforebegin",
            `<div class="${admin.diff.ids.inlineBox}">${html}</div>`,
          );
        });
        admin.diff.mode.set("inline");
        admin.diff.panel(admin.diff.stats(tables));
        return true;
      },
      clear() {
        document.getElementById(admin.diff.ids.style)?.remove();
        document.getElementById(admin.diff.ids.panel)?.remove();
        admin.diff.legacy.styles.forEach((id) => document.getElementById(id)?.remove());
        admin.diff.legacy.panels.forEach((id) => document.getElementById(id)?.remove());
        document
          .querySelectorAll(`.${admin.diff.ids.inlineBox},.${admin.diff.legacy.inlineBox}`)
          .forEach((box) => box.remove());
        document.querySelectorAll("[data-diff-hidden],[data-odi-hidden]").forEach((table) => {
          table.style.display =
            table.dataset.diffDisplay || table.dataset.odiDisplay || "";
          table.removeAttribute("data-diff-hidden");
          table.removeAttribute("data-diff-display");
          table.removeAttribute("data-odi-hidden");
          table.removeAttribute("data-odi-display");
        });
        admin.diff.restoreCells();
        admin.diff.restoreMarkers();
      },
      run() {
        const mode = admin.diff.mode.get();
        admin.diff.clear();
        admin.diff.style();
        if (mode === "compact") return admin.diff.inline();
        return admin.diff.compact();
      },
    },
    element(selector) {
      return field.element(selector);
    },
    emit(input) {
      field.emit(input);
    },
    text(selector) {
      const element = document.querySelector(selector);
      return element ? String(element.value || element.textContent || "").trim() : "";
    },
    list(selector) {
      return [...document.querySelectorAll(selector)]
        .map((element) => String(element.value || element.textContent || "").trim())
        .filter(Boolean);
    },
    picked(selector) {
      return [...document.querySelectorAll(selector)]
        .filter((element) => element.checked)
        .map((element) =>
          String(
            element.closest("li")?.querySelector("label")?.textContent || "",
          )
            .replace(/\s+/g, " ")
            .trim(),
        )
        .filter(Boolean);
    },
    set(selector, value) {
      field.input(admin.element(selector), value);
    },
    check(selector, value) {
      field.click(admin.element(selector), value);
    },
    content() {
      return String(admin.element("#content")?.value || "");
    },
    now() {
      return new Date(
        new Date().toLocaleString("en-US", {
          timeZone: cms.timezone,
        }),
      );
    },
    pad(value) {
      return String(value).padStart(2, "0");
    },
    stamp(date) {
      return {
        month: admin.pad(date.getMonth() + 1),
        day: admin.pad(date.getDate()),
        year: String(date.getFullYear()),
        hours: admin.pad(date.getHours()),
        minutes: admin.pad(date.getMinutes()),
      };
    },
    timestamp(hour) {
      const date = admin.now();
      if (date.getHours() >= hour) date.setDate(date.getDate() + 1);
      date.setHours(hour, 0, 0, 0);
      return admin.stamp(date);
    },
    visibility(value = {}) {
      admin.element(".edit-visibility")?.click();
      admin.check("#visibility-radio-public", value.access !== "link");
      admin.check("#visibility-radio-private", value.access === "link");
      admin.set(
        "#hidden-post-visibility",
        value.access === "link" ? "private" : "public",
      );
      if (value.access !== "link") {
        admin.set("#post_password", "");
        admin.set("#hidden-post-password", "");
      }
      if (value.sticky === "left" || value.sticky === "right") {
        admin.check(`input[name="sticky"][value="${value.sticky}"]`, true);
      } else {
        admin.check("input[name='sticky'][value='none']", true);
        admin.check("input[name='sticky'][value='off']", true);
      }
      admin.element(".save-post-visibility")?.click();
    },
    timestampFields(value) {
      return [
        ["#mm", value.month],
        ["#jj", value.day],
        ["#aa", value.year],
        ["#hh", value.hours],
        ["#mn", value.minutes],
      ];
    },
    applyTimestamp(value) {
      admin.element(".edit-timestamp")?.click();
      admin.timestampFields(value).forEach(([selector, current]) => {
        admin.set(selector, current);
      });
      admin.element(".save-timestamp")?.click();
    },
    time(hour) {
      admin.applyTimestamp(admin.timestamp(hour));
    },
    updated(value) {
      admin.check("#updated", value);
    },
    refresh: {
      run() {
        admin.applyTimestamp(admin.stamp(admin.now()));
        admin.updated(true);
        field.focus(admin.element("#updated"));
        return true;
      },
    },
    tag(name) {
      admin.set("#new-tag-post_tag", name);
      admin.element("#post_tag .tagadd")?.click();
    },
    layout() {
      const element = cms.layout.element();
      if (!element || cms.layout.longread(cms.layout.value(element))) return;
      const label = element.options[element.selectedIndex]?.text?.toLowerCase() || "";
      if (!field.confirm(`🚨 Точно ${label}, не лонгрид? Меняем?`)) return;
      field.input(element, "longread");
    },
    thumbnail() {
      if (admin.element("#postimagediv #set-post-thumbnail img")) return;
      field.alert("🛑 Минус мини");
    },
    focus() {
      field.focus(admin.element("#publish"));
    },
    evergreen() {
      let found = false;
      widget.block.mapJson(admin.content(), widget.tag.promo, (full, data) => {
        if (!data || typeof data.text !== "string") return full;
        const text = widget.read.raw(data.text).toLowerCase();
        if (text.includes("эта статья уже публиковалась")) found = true;
        return full;
      });
      return found;
    },
    dump: {
      mark(label, value) {
        return `[${label}]\n${value || "—"}`;
      },
      date() {
        const date = new Date();
        return [
          date.getFullYear(),
          String(date.getMonth() + 1).padStart(2, "0"),
          String(date.getDate()).padStart(2, "0"),
        ].join("");
      },
      file(id) {
        const section = location.hostname.split(".")[0];
        return `${admin.dump.date()}_${section}_${id}.txt`;
      },
      data() {
        const tags = admin
          .list("#post_tag .tagchecklist span")
          .map((value) => value.replace(/^X\s*/i, "").trim());
        return [
          admin.dump.mark("slug", admin.text("#editable-post-name-full")),
          admin.dump.mark("title", admin.text("#title")),
          admin.dump.mark(
            "rotation-titles",
            admin.list('input[name="rotation_titles[]"]').join("\n"),
          ),
          admin.dump.mark("favourite_title", admin.text("#favourite_title")),
          admin.dump.mark("seo_title", admin.text('input[name="seo_title"]')),
          admin.dump.mark("content", admin.text("#content")),
          admin.dump.mark("excerpt", admin.text("#excerpt")),
          admin.dump.mark(
            "categories",
            admin.picked("#categorychecklist input[type='checkbox']").join("\n"),
          ),
          admin.dump.mark("tags", tags.join("\n")),
        ].join("\n\n");
      },
      save(filename, text) {
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          URL.revokeObjectURL(link.href);
          link.remove();
        }, 1000);
      },
      run() {
        const url = new URL(location.href);
        if (!url.pathname.endsWith("/wp-admin/post.php")) return false;
        const id = admin.text("#post_ID") || String(url.searchParams.get("post") || "").trim();
        if (!id) return false;
        admin.dump.save(admin.dump.file(id), admin.dump.data());
        return true;
      },
    },
    tags: {
      async run() {
        const input = tag.input();
        const current = tag.get();
        const targets = tag.invalid();
        if (!targets.length) {
          alert("✔️ Метки норм");
          return true;
        }
        const planned = targets
          .map((name) => `${name} → ${tag.upper(name)}`)
          .join("\n");
        if (!confirm(`Поменять метки?\n\n${planned}`)) return true;
        try {
          await cms.vpn.ensure("⚠️ VPN");
          const results = [];
          for (const name of targets) {
            results.push(await tag.rename(name));
          }
          tag.apply(input, current, results);
          const report = tag.report(results);
          if (!report.ok.length) {
            alert(report.message);
            return true;
          }
          if (confirm(`${report.message}\n\nОткрыть обновлённые метки?`)) {
            report.ok.forEach((result) => {
              window.open(tag.page(result.next), "_blank");
            });
          }
          setTimeout(() => location.reload(), 300);
          return true;
        } catch (error) {
          alert(error.message);
          return false;
        }
      },
    },
    title: {
      normalize(value) {
        let quotes = 0;
        return text.nbsp(
          String(value || "")
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
            .replace(/\s*[\u002d\u2013\u2014\u2212]\s*/g, "\u0020\u2014\u0020")
            .replace(/[\u0020\u0009]+/g, "\u0020")
            .trim(),
        );
      },
      fields() {
        return [
          "#title",
          "input[name='rotation_titles[]']",
          "#favourite_title",
          "input[name='seo_title']",
        ].flatMap((selector) => field.elements(selector));
      },
      key(item, index) {
        return `${item.id || item.name || "field"}::${index}`;
      },
      record(item, index) {
        const records = admin.sanitize.state().records;
        const id = admin.title.key(item, index);
        const record = (records[id] ??= {
          original: item.value,
          sanitized: admin.title.normalize(item.value),
          background: item.style.backgroundColor || "",
        });
        record.field = item;
        record.changed = record.original !== record.sanitized;
        return record;
      },
      records() {
        return admin.title.fields().map(admin.title.record);
      },
      snapshot(active) {
        admin.title.records().forEach((record) => {
          const value = record.field.value;
          if (active && value === record.sanitized) return;
          record.original = value;
          record.sanitized = admin.title.normalize(value);
          record.changed = record.original !== record.sanitized;
        });
      },
      paint(record) {
        const item = record.field;
        item.style.outline = "";
        if (!record.changed) {
          item.style.backgroundColor = record.background || "";
          return;
        }
        item.style.backgroundColor = admin.sanitize.state().active
          ? "rgba(46, 125, 50, .14)"
          : "rgba(198, 40, 40, .12)";
      },
      sync() {
        admin.title.records().forEach((record) => {
          const value = admin.sanitize.state().active
            ? record.sanitized
            : record.original;
          if (record.field.value !== value) {
            record.field.value = value;
            admin.emit(record.field);
          }
          admin.title.paint(record);
        });
      },
    },
    footer: {
      telegram: {
        remove(value) {
          return value.replace(
            /<p\b[^>]*>\s*(?:<strong>)?\s*Есть о чем рассказать\?[\s\S]*?newsonliner_bot[\s\S]*?(?:<\/strong>)?\s*<\/p>/gi,
            "",
          );
        },
        add() {
          return '<p style="text-align: right;"><strong>Есть о чем рассказать? Пишите в наш <a href="https://t.me/newsonliner_bot" target="_blank">телеграм-бот</a>. Это анонимно и быстро</strong></p>';
        },
      },
      copyright: {
        remove(value) {
          return value.replace(
            /<p\b[^>]*>\s*(?:<span\b[^>]*>)?\s*(?:<strong>)?\s*Перепечатка текста и фотографий[\s\S]*?mailto:[a-z0-9._%+-]+@onliner\.by[\s\S]*?<\/p>/gi,
            "",
          );
        },
        add() {
          const email = cms.chief.email();
          return `<p style="text-align: right;"><span style="font-size: small;"><strong>Перепечатка текста и фотографий Onlíner без разрешения редакции запрещена. <a href="mailto:${email}">${email}</a></strong></span></p>`;
        },
      },
      layoutValue() {
        const element = cms.layout.element();
        if (!element) return "";
        return [
          cms.layout.value(element),
          element.options?.[element.selectedIndex]?.text || "",
        ].join(" ");
      },
      copyrighted() {
        const value = admin.footer.layoutValue();
        return (
          cms.layout.longread(value) ||
          /photo[-_\s]?report|photoreport|фоторепортаж/iu.test(value)
        );
      },
      apply(value) {
        const clean = [
          admin.footer.telegram.remove,
          admin.footer.copyright.remove,
        ].reduce((string, fn) => fn(string), value);
        const next = `${clean.trimEnd()}\n${admin.footer.telegram.add()}`;
        return admin.footer.copyrighted()
          ? `${next}\n${admin.footer.copyright.add()}`
          : next;
      },
    },
    sanitize: {
      key: "__sanitizeState",
      state() {
        return (window[admin.sanitize.key] ??= {
          active: false,
          records: {},
        });
      },
      run() {
        const state = admin.sanitize.state();
        admin.title.snapshot(state.active);
        state.active = !state.active;
        admin.title.sync();
        admin.title.snapshot(state.active);
        cms.editor.runHtmlBridge((value) => admin.footer.apply(value));
        window.scrollTo({ top: 0, behavior: "smooth" });
        [0, 50, 150].forEach((delay) =>
          setTimeout(() => {
            admin.title.snapshot(state.active);
            admin.title.sync();
          }, delay),
        );
        return true;
      },
    },
    whoami: {
      text(value) {
        return String(value || "").trim();
      },
      lower(value) {
        return admin.whoami.text(value).toLowerCase().replace(/^@/, "");
      },
      meta(name) {
        return document.querySelector(`meta[name="${name}"]`)?.content || "";
      },
      username() {
        return admin.whoami.lower(
          document.querySelector("#wp-admin-bar-user-info .username")
            ?.textContent ||
            admin.whoami.meta("user:login") ||
            admin.whoami.meta("user:username") ||
            "",
        );
      },
      displayName() {
        return admin.whoami.text(
          document.querySelector("#wp-admin-bar-user-info .display-name")
            ?.textContent ||
            document.querySelector("#wp-admin-bar-my-account .display-name")
              ?.textContent ||
            window.userSettings?.displayName ||
            admin.whoami.meta("user:display-name") ||
            admin.whoami.meta("user:display_name") ||
            "",
        );
      },
      userId() {
        const html = document.documentElement?.innerHTML || "";
        return admin.whoami.text(
          document.querySelector("#user_ID")?.value ||
            window.userSettings?.uid ||
            document.body?.className?.match(/\buser-id-(\d+)\b/)?.[1] ||
            html.match(/"uid"\s*:\s*"?(\d+)"?/i)?.[1] ||
            html.match(/"user_id"\s*:\s*"?(\d+)"?/i)?.[1] ||
            html.match(/user_id["']?\s*[:=]\s*["']?(\d+)/i)?.[1] ||
            "",
        );
      },
      read() {
        return {
          user_ID: admin.whoami.userId(),
          username: admin.whoami.username(),
          "display-name": admin.whoami.displayName(),
        };
      },
      format(value) {
        return JSON.stringify(value, null, 2);
      },
      async copy(value, options = {}) {
        const text = admin.whoami.format(value);
        try {
          await navigator.clipboard.writeText(text);
          if (!options.silent) alert(`Скопировано:\n\n${text}`);
        } catch {
          if (!options.silent) prompt("Whoami", text);
        }
        return true;
      },
      run(options = {}) {
        admin.whoami.copy(admin.whoami.read(), options);
        return true;
      },
    },
    plan: {
      url: "https://disk.yandex.ru/edit/d/XK4EauZVJqcws15FpXE4oSPegnqahzm72s0qoIz-cKg6VGNKZjliTXBFZw",
      run() {
        window.open(admin.plan.url, "_blank", "noopener");
        return true;
      },
    },
    prepare: {
      run() {
        const hour = admin.evergreen() ? 7 : 8;
        const sticky = hour === 7 ? "left" : "right";
        admin.visibility({ access: "public", sticky });
        admin.time(hour);
        admin.tag("Onliner");
        admin.layout();
        admin.thumbnail();
        admin.focus();
        return true;
      },
    },
  };
  return {
    admin: {
      diff: admin.diff,
      dump: admin.dump,
      tags: admin.tags,
      sanitize: admin.sanitize,
      prepare: admin.prepare,
      refresh: admin.refresh,
      whoami: admin.whoami,
      plan: admin.plan,
    },
  };
};
