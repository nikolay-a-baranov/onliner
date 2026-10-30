import { cms } from "../../core/cms.js";
import { host } from "../../core/surface/host.js";
import { icon } from "../../core/surface/icon.js";
import { styles as css } from "../../core/surface/styles.js";
import { ui } from "../../core/surface/ui.js";
import { widget } from "../../core/widget.js";
import { markup } from "../../pipe/markup.js";
export const attachCrawler = (admin, archive = {}) => {
  admin.crawler = {
      tags: {
        state: {
          running: false,
        },
        decode(value) {
          const textarea = document.createElement("textarea");
          textarea.innerHTML = String(value || "");
          return textarea.value;
        },
        plain(value) {
          return admin.crawler.tags.decode(value)
            .replace(/\[onliner-[\s\S]*?\[\/onliner-[^\]]+\]/g, " ")
            .replace(/\[[^\]]+\]/g, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/[\u00a0\t\r\n]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        },
        split(value) {
          const source = String(value || "").replace(/\s+/g, " ").trim();
          if (!source || /меток нет/i.test(source)) return [];
          return source
            .split(/[,;]+/)
            .map((item) => item.replace(/^[×x]\s*/i, "").trim())
            .filter(Boolean);
        },
        row(element) {
          const id = String(element?.id || "").match(/\d+/)?.[0] || "";
          const title = element?.querySelector(".row-title") || null;
          const edit = title?.href || element?.querySelector('a[href*="action=edit"]')?.href || "";
          const tagsText = element?.querySelector(".tags")?.textContent || "";
          return {
            id,
            title: admin.crawler.tags.plain(title?.textContent || ""),
            edit,
            tags: admin.crawler.tags.split(tagsText),
          };
        },
        rows(doc) {
          return [...doc.querySelectorAll("#the-list tr[id^='post-']")]
            .map(admin.crawler.tags.row)
            .filter((item) => item.id && item.edit);
        },
        next(doc) {
          const link = doc.querySelector(".tablenav-pages .next-page:not(.disabled)");
          if (!link || link.classList.contains("disabled")) return "";
          const href = link.getAttribute("href") || "";
          return href ? new URL(href, location.href).href : "";
        },
        stamp() {
          const date = new Date();
          const pad = (value) => String(value).padStart(2, "0");
          return [
            date.getFullYear(),
            pad(date.getMonth() + 1),
            pad(date.getDate()),
            pad(date.getHours()),
            pad(date.getMinutes()),
            pad(date.getSeconds()),
          ].join("");
        },
        download(records) {
          const payload = JSON.stringify(records, null, 2);
          const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `onliner-tags-dataset-${admin.crawler.tags.stamp()}.json`;
          document.body.append(link);
          link.click();
          setTimeout(() => {
            URL.revokeObjectURL(link.href);
            link.remove();
          }, 1000);
        },
        async load(url, options = {}) {
          const timeout = Math.max(1000, Number(options.timeout) || 30000);
          const retries = Math.max(0, Number(options.retries) || 0);
          for (let attempt = 0; attempt <= retries; attempt += 1) {
            const controller = new AbortController();
            const timer = window.setTimeout(() => controller.abort(), timeout);
            try {
              const response = await fetch(url, {
                credentials: "include",
                cache: "no-store",
                signal: controller.signal,
              });
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              const html = await response.text();
              return new DOMParser().parseFromString(html, "text/html");
            } catch (error) {
              if (attempt < retries) {
                await new Promise((resolve) => window.setTimeout(resolve, 500));
                continue;
              }
              const reason = error?.name === "AbortError"
                ? `Тайм-аут ${Math.round(timeout / 1000)} с`
                : error?.message || "Ошибка загрузки";
              throw new Error(`${reason}: ${url}`, { cause: error });
            } finally {
              window.clearTimeout(timer);
            }
          }
          return null;
        },
        detailTags(doc) {
          return [...doc.querySelectorAll("#post_tag .tagchecklist span")]
            .map((item) => item.textContent || "")
            .flatMap(admin.crawler.tags.split);
        },
        detail(row, doc) {
          const title = admin.crawler.tags.plain(doc.querySelector("#title")?.value || row.title);
          const content = doc.querySelector("#content")?.value || "";
          const tags = admin.crawler.tags.detailTags(doc);
          return {
            ...row,
            title,
            text: admin.crawler.tags.plain(content),
            tags: tags.length ? tags : row.tags,
            url: doc.querySelector("#sample-permalink a")?.href || "",
          };
        },
        async collect(startUrl, limit) {
          const records = [];
          let url = startUrl;
          for (let page = 1; url && page <= limit; page += 1) {
            document.title = `Кроулер меток: ${page}/${limit}`;
            const doc = await admin.crawler.tags.load(url);
            const rows = admin.crawler.tags.rows(doc);
            for (const [index, row] of rows.entries()) {
              document.title = `Кроулер меток: ${page}/${limit} · ${index + 1}/${rows.length}`;
              const detail = await admin.crawler.tags.load(row.edit);
              records.push(admin.crawler.tags.detail(row, detail));
            }
            url = admin.crawler.tags.next(doc);
          }
          return records;
        },
        limit() {
          const value = prompt("Сколько страниц кроулить?", "1");
          const limit = Number.parseInt(value, 10);
          if (!Number.isFinite(limit) || limit < 1) return 0;
          return Math.min(limit, 20);
        },
        async run() {
          if (admin.crawler.tags.state.running) return false;
          const limit = admin.crawler.tags.limit();
          if (!limit) return false;
          admin.crawler.tags.state.running = true;
          const title = document.title;
          try {
            const records = await admin.crawler.tags.collect(location.href, limit);
            admin.crawler.tags.download(records);
            alert(`Готово: ${records.length}`);
            return true;
          } catch (error) {
            alert(error.message || "Ошибка кроулера меток");
            return false;
          } finally {
            document.title = title;
            admin.crawler.tags.state.running = false;
          }
        },
      },
      report: {
        state: {
          running: false,
        },
        rules: [
          {
            name: "vacancies",
            keywords: [
              "вакансия",
              "работа",
              "зарплата",
              "офис",
              "резюме",
            ],
          },
          {
            name: "politics",
            keywords: [
              "закон",
              "министр",
              "президент",
              "госдума",
            ],
          },
        ],
        text(title, content) {
          return admin.crawler.tags
            .plain(`${title} ${content}`)
            .toLocaleLowerCase("ru-RU");
        },
        score(rule, text) {
          let score = 0;
          for (const keyword of rule.keywords) {
            if (text.includes(keyword)) score += 1;
          }
          return score;
        },
        analyze(text) {
          return admin.crawler.report.rules
            .map((rule) => ({
              tag: rule.name,
              score: admin.crawler.report.score(rule, text),
            }))
            .filter((item) => item.score > 0)
            .sort((left, right) => right.score - left.score)
            .map((item) => item.tag);
        },
        weekdays: [
          "Вс",
          "Пн",
          "Вт",
          "Ср",
          "Чт",
          "Пт",
          "Сб",
        ],
        user(root = document) {
          return (
            root.querySelector("#wp-admin-bar-user-info .display-name")
              ?.textContent?.trim() || ""
          );
        },
        userSlug(value = "") {
          if (value === "Николай Баранов")
            return "nb";
          const last = String(value || "").split(/\s+/).pop() || "";
          return last.toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
        },
        reportMonth(value = "") {
          const source = String(value || "");
          return /^\d{6}$/.test(source)
            ? `${source.slice(0, 4)}-${source.slice(4, 6)}`
            : "";
        },
        reportStart(value = "") {
          const source = String(value || "");
          if (!/^\d{6}$/.test(source)) return null;
          return new Date(
            Number(source.slice(0, 4)),
            Number(source.slice(4, 6)) - 1,
            1,
          );
        },
        earlyRow(date = "", month = "") {
          const report = admin.crawler.report.reportMonth(month);
          if (!date || !report || !String(date).startsWith(report)) return false;
          const day = Number(String(date).slice(8, 10));
          return day >= 1 && day <= 3;
        },
        oldRevision({ revisionDate = "", month = "", date = "" } = {}) {
          const start = admin.crawler.report.reportStart(month);
          if (!revisionDate || !start) return "";
          if (revisionDate.startsWith(admin.crawler.report.reportMonth(month)))
            return "";
          const current = new Date(`${revisionDate}T00:00:00`);
          if (Number.isNaN(current.getTime())) return "";
          const diff = Math.round(
            (start.getTime() - current.getTime()) / 86400000,
          );
          if (
            diff >= 1 &&
            diff <= 3 &&
            admin.crawler.report.earlyRow(date, month)
          )
            return "";
          return "1";
        },
        weekday(date = "") {
          if (!date || date.includes("--")) return "";
          const value = new Date(`${date}T00:00:00`);
          return Number.isNaN(value.getTime())
            ? ""
            : admin.crawler.report.weekdays[value.getDay()] || "";
        },
        inline(row, id, selector) {
          return row.querySelector(`#inline_${id} ${selector}`)?.textContent?.trim() || "";
        },
        rowTags(row) {
          const value =
            row.querySelector(".tags")?.textContent?.replace(/\s+/g, " ").trim() || "";
          return /^меток нет$/i.test(value) ? "" : value;
        },
        specialTag(value = "") {
          return /(^|[\s,;|])(sp|сп)(?=$|[\s,;|])/i.test(String(value || ""));
        },
        specialContent(value = "") {
          return /<(?:p|h6)\b[^>]*>[\s\S]*?УНП\s+\d{9}[\s\S]*?<\/(?:p|h6)>/i.test(
            String(value || ""),
          );
        },
        specialProject({ tags = "", content = "" } = {}) {
          return admin.crawler.report.specialTag(tags) ||
            admin.crawler.report.specialContent(content)
            ? "1"
            : "";
        },
        evergreen(content = "") {
          let evergreen = "";
          widget.block.mapJson(
            String(content || ""),
            widget.tag.promo,
            (full, data) => {
              if (!data || typeof data.text !== "string") return full;
              const text = widget.read.raw(data.text);
              if (text.toLocaleLowerCase("ru-RU").includes("onlíner"))
                evergreen = "1";
              return full;
            },
          );
          return evergreen;
        },
        flags({ specialProject = "", evergreen = "" } = {}) {
          return [specialProject ? "special" : "", evergreen ? "evergreen" : ""]
            .filter(Boolean)
            .join(",");
        },
        layout(doc) {
          const element =
            doc.querySelector("#layout_select") ||
            doc.querySelector('[name="layout"]');
          return element?.value?.trim() || "";
        },
        sticky(doc, fallback = "") {
          const value =
            doc.querySelector("input[name='sticky']:checked")?.value || "";
          if (value === "left") return "left";
          if (value === "right") return "right";
          if (value === "off") return "";
          return fallback;
        },
        words(value = "") {
          return (
            String(value || "").match(
              /[A-Za-zА-Яа-яЁё0-9]+(?:[-’'][A-Za-zА-Яа-яЁё0-9]+)*/g,
            ) || []
          ).length;
        },
        volume(doc) {
          const text = doc.querySelector("#wp-word-count")?.textContent || "";
          const count = text.match(/\d+/)?.[0];
          if (count && count !== "0") return count;
          const content = doc.querySelector("#content")?.value || "";
          return content
            ? String(admin.crawler.report.words(admin.crawler.tags.plain(content)))
            : "";
        },
        row(element, section = admin.crawler.sections.section(), dataset = false) {
          const id = String(element?.id || "").match(/\d+/)?.[0] || "";
          const title = element?.querySelector(".row-title") || null;
          const date = `${admin.crawler.report.inline(element, id, ".aa")}-${admin.crawler.report.inline(element, id, ".mm")}-${admin.crawler.report.inline(element, id, ".jj")}`;
          return {
            section,
            id,
            date,
            weekday: admin.crawler.report.weekday(date),
            time: `${admin.crawler.report.inline(element, id, ".hh")}:${admin.crawler.report.inline(element, id, ".mn")}`,
            sticky: "",
            layout: "",
            live: element.querySelector('.row-actions a[rel="permalink"]')?.href || "",
            edit:
              title?.href ||
              `${location.origin}/wp-admin/post.php?post=${id}&action=edit`,
            author: element.querySelector(".author")?.textContent?.trim() || "",
            source: "",
            volume: "",
            revisions: "",
            userRevisions: "",
            previousRevisionDate: "",
            previousRevisionTime: "",
            userLastRevisionDate: "",
            userLastRevisionTime: "",
            oldRevision: "",
            title: admin.crawler.tags.plain(title?.textContent || ""),
            tags: admin.crawler.report.rowTags(element),
            ...(dataset ? { datasetTags: admin.crawler.dataset.tag.collect(element) } : {}),
            specialProject: "",
            evergreen: "",
          };
        },
        rows(doc, section = admin.crawler.sections.section(), dataset = false) {
          return [...doc.querySelectorAll("#the-list tr[id^='post-']")]
            .map((row) => admin.crawler.report.row(row, section, dataset))
            .filter((item) => item.id && item.edit);
        },
        revisionLink(item) {
          return item.querySelector("a")?.textContent?.replace(/\s+/g, " ").trim() || "";
        },
        revisionText(item) {
          return item.textContent.replace(/\s+/g, " ").trim();
        },
        revisionAuthor(item) {
          const link = admin.crawler.report.revisionLink(item);
          const text = admin.crawler.report.revisionText(item);
          return text.replace(link, "").replace(/^автора\s+/i, "").trim();
        },
        revisionMeta(item) {
          const match = admin.crawler.report
            .revisionLink(item)
            .match(/^(\d{2})\.(\d{2})\.(\d{4}),\s*(\d{2}):(\d{2})$/);
          if (!match) return null;
          const [, day, month, year, hour, minute] = match;
          const date = `${year}-${month}-${day}`;
          const time = `${hour}:${minute}`;
          const stamp = new Date(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hour),
            Number(minute),
            0,
          );
          if (Number.isNaN(stamp.getTime())) return null;
          return {
            date,
            time,
            stamp: stamp.getTime(),
            author: admin.crawler.report.revisionAuthor(item),
            text: admin.crawler.report.revisionText(item),
          };
        },
        normalizeAuthor(value = "") {
          return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
        },
        ownRevision(revision, user) {
          const current = admin.crawler.report.normalizeAuthor(user);
          if (!current) return false;
          if (
            admin.crawler.report.normalizeAuthor(revision.author) === current
          )
            return true;
          return admin.crawler.report
            .normalizeAuthor(revision.text)
            .includes(current);
        },
        revisionStats(doc, user) {
          const items = [...doc.querySelectorAll("#revisionsdiv li")];
          const revisions = items.map((item) => ({
            meta: admin.crawler.report.revisionMeta(item),
            author: admin.crawler.report.revisionAuthor(item),
            text: admin.crawler.report.revisionText(item),
          }));
          const own = revisions.filter((revision) =>
            admin.crawler.report.ownRevision(revision, user),
          );
          const parsed = revisions
            .filter((revision) => revision.meta)
            .map((revision) => ({
              ...revision.meta,
              user: admin.crawler.report.ownRevision(revision, user),
            }))
            .sort((left, right) => left.stamp - right.stamp);
          const parsedOwn = parsed.filter((revision) => revision.user);
          const firstOwn = parsedOwn[0] || null;
          const lastOwn = parsedOwn.at(-1) || null;
          const previous = firstOwn
            ? parsed
                .filter(
                  (revision) =>
                    !revision.user && revision.stamp < firstOwn.stamp,
                )
                .at(-1) || null
            : null;
          return {
            revisions: items.length,
            userRevisions: own.length,
            previousRevisionDate: previous?.date || "",
            previousRevisionTime: previous?.time || "",
            userLastRevisionDate: lastOwn?.date || "",
            userLastRevisionTime: lastOwn?.time || "",
          };
        },
        detail(row, doc, options = {}) {
          const user = options.user || admin.crawler.report.user(doc);
          const stats = admin.crawler.report.revisionStats(doc, user);
          if (!stats.userRevisions) return null;
          const content = doc.querySelector("#content")?.value || "";
          const title = admin.crawler.tags.plain(
            doc.querySelector("#title")?.value || row.title,
          );
          return {
            ...row,
            ...stats,
            title,
            sticky: admin.crawler.report.sticky(doc, row.sticky),
            layout: admin.crawler.report.layout(doc),
            source: doc.querySelector("#post_source")?.value?.trim() || "",
            volume: admin.crawler.report.volume(doc),
            oldRevision: admin.crawler.report.oldRevision({
              revisionDate: stats.userLastRevisionDate,
              month: options.period?.key || "",
              date: row.date,
            }),
            specialProject: admin.crawler.report.specialProject({
              tags: row.tags,
              content,
            }),
            evergreen: admin.crawler.report.evergreen(content),
          };
        },
        dataset(records = []) {
          return records.map((row) => ({
            section: row.section || "",
            weekday: row.weekday || "",
            date: row.date || "",
            time: row.time || "",
            sticky: row.sticky || "",
            layout: row.layout || "",
            live: row.live || "",
            edit: row.edit || "",
            author: row.author || "",
            source: row.source || "",
            volume: row.volume || "",
            title: row.title || "",
            tags: row.tags || "",
            flags: admin.crawler.report.flags(row),
            revisions: row.revisions || "",
            user_revisions: row.userRevisions || "",
            previous_revision_date: row.previousRevisionDate || "",
            previous_revision_time: row.previousRevisionTime || "",
            user_last_revision_date: row.userLastRevisionDate || "",
            user_last_revision_time: row.userLastRevisionTime || "",
          }));
        },
        csv(records = []) {
          return [
            [
              "section",
              "weekday",
              "date",
              "time",
              "sticky",
              "layout",
              "live",
              "edit",
              "author",
              "source",
              "volume",
              "title",
              "tags",
              "flags",
              "revisions",
              "user_revisions",
              "previous_revision_date",
              "previous_revision_time",
              "user_last_revision_date",
              "user_last_revision_time",
            ],
            ...admin.crawler.report.dataset(records).map((row) => [
              row.section,
              row.weekday,
              row.date,
              row.time,
              row.sticky,
              row.layout,
              row.live,
              row.edit,
              row.author,
              row.source,
              row.volume,
              row.title,
              row.tags,
              row.flags,
              row.revisions,
              row.user_revisions,
              row.previous_revision_date,
              row.previous_revision_time,
              row.user_last_revision_date,
              row.user_last_revision_time,
            ]),
          ]
            .map((line) =>
              line
                .map((value) => `"${String(value || "").replace(/"/g, '""')}"`)
                .join(";"),
            )
            .join("\n");
        },
        textDataset(records = []) {
          return records.map((row) => ({
            weekday: row.weekday || "",
            date: row.date || "",
            time: row.time || "",
            sticky: row.sticky || "",
            layout: row.layout || "",
            live: row.live || "",
            edit: row.edit || "",
            author: row.author || "",
            source: row.source || "",
            volume: row.volume || "",
            title: row.title || "",
            tags: row.tags || "",
            flags: admin.crawler.report.flags(row),
            revisions: row.revisions || "",
            user_revisions: row.userRevisions || "",
            previous_revision_date: row.previousRevisionDate || "",
            previous_revision_time: row.previousRevisionTime || "",
            user_last_revision_date: row.userLastRevisionDate || "",
            user_last_revision_time: row.userLastRevisionTime || "",
          }));
        },
        tsv(records = []) {
          return [
            [
              "weekday",
              "date",
              "time",
              "sticky",
              "layout",
              "live",
              "edit",
              "author",
              "source",
              "volume",
              "title",
              "tags",
              "flags",
              "revisions",
              "user_revisions",
              "previous_revision_date",
              "previous_revision_time",
              "user_last_revision_date",
              "user_last_revision_time",
            ],
            ...admin.crawler.report.textDataset(records).map((row) => [
              row.weekday,
              row.date,
              row.time,
              row.sticky,
              row.layout,
              row.live,
              row.edit,
              row.author,
              row.source,
              row.volume,
              row.title,
              row.tags,
              row.flags,
              row.revisions,
              row.user_revisions,
              row.previous_revision_date,
              row.previous_revision_time,
              row.user_last_revision_date,
              row.user_last_revision_time,
            ]),
          ]
            .map((line) =>
              line
                .map((value) =>
                  String(value || "")
                    .replace(/\t/g, " ")
                    .replace(/\r?\n/g, " ")
                    .trim(),
                )
                .join("\t"),
            )
            .join("\n");
        },
        archive: {
          base(records = [], meta = {}, stamp = admin.crawler.tags.stamp()) {
            const period = meta.period?.key ? `${meta.period.key}-` : "";
            const section = meta.section ? `${String(meta.section)}-` : "";
            const user = meta.user
              ? `${admin.crawler.report.userSlug(meta.user)}-`
              : "";
            return `onliner-report-${period}${section}${user}${records.length}-${stamp}`;
          },
          files(records = [], meta = {}, errors = [], stamp = admin.crawler.tags.stamp()) {
            if (!archive.textFile) throw new Error("Не подключён упаковщик файлов отчёта");
            const base = admin.crawler.report.archive.base(records, meta, stamp);
            return [
              archive.textFile(
                `${base}.csv`,
                "\uFEFF" + admin.crawler.report.csv(records),
                "text/csv;charset=utf-8",
              ),
              archive.textFile(
                `${base}.txt`,
                "\uFEFF" + admin.crawler.report.tsv(records),
                "text/plain;charset=utf-8",
              ),
              ...(errors.length
                ? [archive.textFile(
                    `${base}-errors.json`,
                    JSON.stringify(errors, null, 2),
                    "application/json;charset=utf-8",
                  )]
                : []),
            ];
          },
          async download(records = [], meta = {}, errors = []) {
            if (!archive.zipBlob || !archive.downloadBlob) {
              throw new Error("Не подключён ZIP-упаковщик отчёта");
            }
            const stamp = admin.crawler.tags.stamp();
            const base = admin.crawler.report.archive.base(records, meta, stamp);
            const files = admin.crawler.report.archive.files(records, meta, errors, stamp);
            const name = `${base}.zip`;
            const blob = await archive.zipBlob(files, name, { root: true });
            archive.downloadBlob(name, blob);
            return name;
          },
        },
        request(kind = "list") {
          return {
            timeout: kind === "detail" ? 20000 : 30000,
            retries: 1,
          };
        },
        maxPages() {
          return 100;
        },
        pagination(doc) {
          const page = Number.parseInt(
            doc.querySelector(".tablenav-pages .current-page")?.value || "1",
            10,
          );
          const totalPages = Number.parseInt(
            String(doc.querySelector(".tablenav-pages .total-pages")?.textContent || "")
              .replace(/\D+/g, ""),
            10,
          );
          const totalItems = Number.parseInt(
            String(doc.querySelector(".tablenav-pages .displaying-num")?.textContent || "")
              .replace(/\D+/g, ""),
            10,
          );
          return {
            page: Number.isFinite(page) && page > 0 ? page : 1,
            totalPages: Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1,
            totalItems: Number.isFinite(totalItems) && totalItems >= 0 ? totalItems : 0,
          };
        },
        progress(value = {}) {
          const page = Number(value.page) || 1;
          const totalPages = Number(value.totalPages) || 0;
          const done = Number(value.done) || 0;
          const totalItems = Number(value.totalItems) || 0;
          const matched = Number(value.matched) || 0;
          const failed = Number(value.failed) || 0;
          const pages = totalPages ? `${page}/${totalPages}` : `${page}/?`;
          const items = totalItems ? `${done}/${totalItems}` : String(done);
          const itemLabel = `${items} (${matched}${failed ? ` / !${failed}` : ""})`;
          document.title = `📄 ${pages} · 🧾 ${itemLabel}`;
          admin.crawler.sections.status({
            title: String(value.title || ""),
            period: value.period || null,
            section: admin.crawler.sections.section(),
            page,
            totalPages,
            done,
            totalItems,
            matched,
            failed,
            phase: "Собираю записи",
          });
          admin.crawler.sections.progressMessage({
            title: String(value.title || ""),
            period: value.period || null,
            page,
            totalPages,
            done,
            totalItems,
            matched,
            failed,
          });
        },
        stop() {
          return Boolean(window.reportStop);
        },
        async collect(startUrl, options = {}) {
          const records = [];
          const maxPages = Number(options.maxPages) || admin.crawler.report.maxPages();
          const titlePrefix = String(options.title || "");
          const user = String(options.user || admin.crawler.report.user()).trim();
          const period = options.period || null;
          const section = options.section || admin.crawler.sections.section(startUrl);
          const errors = Array.isArray(options.errors) ? options.errors : [];
          const errorStart = errors.length;
          let knownTotalPages = 0;
          let knownTotalItems = 0;
          let scanned = 0;
          let url = startUrl;
          for (let page = 1; url && page <= maxPages; page += 1) {
            if (admin.crawler.report.stop()) break;
            admin.crawler.report.progress({
              title: titlePrefix,
              period,
              page,
              totalPages: knownTotalPages,
              done: scanned,
              totalItems: knownTotalItems,
              matched: records.length,
              failed: errors.length,
              user: options.dataset ? "Все" : user,
            });
            let doc;
            try {
              doc = await admin.crawler.tags.load(url, admin.crawler.report.request());
            } catch (error) {
              if (!options.dataset) throw error;
              errors.push({
                section,
                page,
                url,
                error: error?.message || String(error),
              });
              url = "";
              break;
            }
            const pagination = admin.crawler.report.pagination(doc);
            knownTotalPages = pagination.totalPages || knownTotalPages;
            knownTotalItems = pagination.totalItems || knownTotalItems;
            const rows = admin.crawler.report.rows(doc, section, Boolean(options.dataset));
            const rowCount = doc.querySelectorAll("#the-list tr[id^='post-']").length;
            if (options.dataset && rows.length < rowCount) {
              errors.push({
                section,
                page,
                url,
                error: `Пропущено строк без id или edit URL: ${rowCount - rows.length}`,
              });
            }
            admin.crawler.report.progress({
              title: titlePrefix,
              period,
              page: pagination.page || page,
              totalPages: knownTotalPages,
              done: scanned,
              totalItems: knownTotalItems,
              matched: records.length,
              failed: errors.length,
              user: options.dataset ? "Все" : user,
            });
            for (const row of rows) {
              if (admin.crawler.report.stop()) break;
              scanned += 1;
              admin.crawler.report.progress({
                title: titlePrefix,
                period,
                page: pagination.page || page,
                totalPages: knownTotalPages,
                done: scanned,
                totalItems: knownTotalItems,
                matched: records.length,
                failed: errors.length,
                user: options.dataset ? "Все" : user,
              });
              try {
                const detail = await admin.crawler.tags.load(
                  row.edit,
                  admin.crawler.report.request("detail"),
                );
                const record = options.dataset
                  ? admin.crawler.dataset.detail(row, detail)
                  : admin.crawler.report.detail(row, detail, { user, period });
                if (record) records.push(record);
              } catch (error) {
                console.error(error);
                errors.push({
                  section,
                  id: row.id,
                  title: row.title,
                  url: row.edit,
                  error: error?.message || String(error),
                });
              }
            }
            const nextUrl = admin.crawler.tags.next(doc);
            const hasTotalPages = Boolean(
              doc.querySelector?.(".tablenav-pages .total-pages"),
            );
            const lastPage = hasTotalPages && pagination.page >= pagination.totalPages;
            url = rowCount === 0 || lastPage ? "" : nextUrl;
          }
          if (options.dataset && url) {
            errors.push({
              section,
              url,
              error: admin.crawler.report.stop()
                ? "Сбор остановлен до завершения раздела"
                : `Достигнут лимит страниц: ${maxPages}`,
            });
          }
          if (options.dataset && knownTotalItems > scanned) {
            errors.push({
              section,
              error: `WordPress показывает ${knownTotalItems} записей, обработано ${scanned}`,
            });
          }
          if (options.dataset && options.outcome) {
            Object.assign(options.outcome, {
              section,
              status: errors.length > errorStart
                ? "failed"
                : records.length
                  ? "completed"
                  : "empty",
              count: records.length,
              scanned,
              expected: knownTotalItems,
            });
          }
          return records;
        },
        async run() {
          if (admin.crawler.report.state.running) return false;
          admin.crawler.report.state.running = true;
          window.reportStop = false;
          const title = document.title;
          try {
            const period = await admin.crawler.sections.period.choose();
            if (!period) return false;
            const url = admin.crawler.sections.filteredUrl(location.hostname.split(".")[0], period);
            const user = admin.crawler.report.user();
            const errors = [];
            const records = await admin.crawler.report.collect(url, {
              title: period.key,
              period,
              user,
              errors,
            });
            await admin.crawler.report.archive.download(records, {
              period,
              section: admin.crawler.sections.section(),
              user,
            }, errors);
            if (errors.length) alert(`Отчёт готов. Пропущено записей: ${errors.length}. Причины лежат в ZIP.`);
            return true;
          } catch (error) {
            console.error(error);
            alert(error?.message || "Не удалось собрать отчёт");
            return false;
          } finally {
            document.title = title;
            admin.crawler.sections.clearStatus();
            admin.crawler.report.state.running = false;
          }
        },
      },
      dataset: {
        madtest: {
          id(content = "") {
            const match = String(content || "").match(
              /<div\b(?=[^>]*\bclass=(["'])[^"']*\bmadtest\b[^"']*\1)(?=[^>]*\bdata-id=(["'])([a-zA-Z0-9_-]+)\2)[^>]*>/i,
            );
            const id = match?.[3] || "";
            return id.length >= 6 ? id : null;
          },
        },
        tag: {
          collect(row) {
            return [...row.querySelectorAll(".tags a")]
              .map((item) => String(item.textContent || "")
                .replace(/[\u00a0\t\r\n]+/g, " ")
                .replace(/\s+/g, " ")
                .trim())
              .filter(Boolean);
          },
        },
        revision: {
          normalize(value = "") {
            const source = String(value || "").replace(/\s+/g, " ").trim();
            const autosave = /^\[Автосохранение\]\s*/i.test(source);
            const label = source.replace(/^\[Автосохранение\]\s*/i, "");
            const recognized = /^автора\s+/i.test(label);
            return {
              author: label.replace(/^автора\s+/i, "").trim(),
              autosave,
              ambiguous: !recognized || !label.replace(/^автора\s+/i, "").trim(),
            };
          },
          parse(item) {
            const link = item.querySelector("a[href]");
            const href = link?.getAttribute("href") || "";
            const id = href.match(/[?&](?:revision|revision_id)=(\d+)/)?.[1] || null;
            const meta = admin.crawler.report.revisionMeta(item);
            const normalized = admin.crawler.dataset.revision.normalize(
              admin.crawler.report.revisionAuthor(item),
            );
            const ambiguous = !id || !meta || normalized.ambiguous;
            return {
              id,
              author: normalized.author,
              autosave: normalized.autosave,
              date: meta?.date || null,
              time: meta?.time || null,
              ...(ambiguous ? { raw: admin.crawler.report.revisionText(item) } : {}),
            };
          },
        },
        records: {
          prepare(records = []) {
            const seen = new Set();
            const duplicates = [];
            const values = records.filter((item) => {
              const section = String(item?.section || "");
              const id = String(item?.post_id || "");
              if (!section || !id) return true;
              const key = `${section}:${id}`;
              if (!seen.has(key)) {
                seen.add(key);
                return true;
              }
              duplicates.push({
                type: "duplicate",
                section,
                id,
                title: item.title || "",
                url: item.edit_url || item.url || "",
                message: "Дубликат записи исключён из итогового набора",
              });
              return false;
            });
            return {
              values,
              diagnostics: duplicates,
            };
          },
        },
        results: {
          prepare(sections = [], results = []) {
            const errors = [];
            const values = sections.map((section) => {
              const result = results.find((item) => item?.section === section);
              if (result) return result;
              const error = "Нет подтверждённого результата сбора раздела";
              errors.push({ section, error });
              return {
                section,
                status: "failed",
                count: 0,
                scanned: 0,
                expected: 0,
                error,
              };
            });
            return { values, errors };
          },
        },
        metrics(content) {
          const plain = markup.strip(content);
          const chars = Array.from(plain);
          return {
            words: (plain.match(/[\p{L}\p{N}]+(?:[-’'][\p{L}\p{N}]+)*/gu) || []).length,
            chars: chars.length,
            chars_no_spaces: chars.filter((char) => !/\s/u.test(char)).length,
          };
        },
        detail(row, doc) {
          const content = doc.querySelector("#content")?.value;
          if (typeof content !== "string") throw new Error(`Нет поля #content: ${row.edit}`);
          const title = admin.crawler.tags.plain(doc.querySelector("#title")?.value || row.title);
          const url = row.live || doc.querySelector("#sample-permalink a")?.href || "";
          const publishedAt = /^\d{4}-\d{2}-\d{2}$/.test(row.date) &&
            /^\d{2}:\d{2}$/.test(row.time)
            ? `${row.date}T${row.time}:00`
            : "";
          const required = {
            post_id: row.id,
            section: row.section,
            url,
            edit_url: row.edit,
            title,
            author: row.author,
            published_at: publishedAt,
          };
          const missing = Object.entries(required)
            .filter(([, value]) => !String(value || "").trim())
            .map(([key]) => key);
          if (missing.length) throw new Error(`Нет обязательных полей: ${missing.join(", ")}`);
          const revisions = [...doc.querySelectorAll("#revisionsdiv li")]
            .map((item) => admin.crawler.dataset.revision.parse(item));
          return {
            post_id: row.id,
            section: row.section,
            url,
            edit_url: row.edit,
            title,
            author: row.author,
            status: doc.querySelector("#post_status")?.value || "publish",
            published_at: publishedAt,
            layout: admin.crawler.report.layout(doc),
            sticky: admin.crawler.report.sticky(doc, row.sticky),
            source: doc.querySelector("#post_source")?.value?.trim() || "",
            tags: Array.isArray(row.datasetTags) ? row.datasetTags : [],
            madtest: admin.crawler.dataset.madtest.id(content),
            special_project: Boolean(admin.crawler.report.specialProject({ tags: row.tags, content })),
            evergreen: Boolean(admin.crawler.report.evergreen(content)),
            metrics: admin.crawler.dataset.metrics(content),
            revisions,
            revisions_source: "visible_admin_list",
          };
        },
        filename(period, options = {}, stamp = admin.crawler.tags.stamp()) {
          const section = String(options.section || "").trim();
          const count = Math.max(0, Number.parseInt(options.count, 10) || 0);
          const scope = section ? `${section}-${count}-` : "";
          return `onliner-${period.key}-${scope}${stamp}.json`;
        },
        download(records, period, errors = [], options = {}) {
          const sections = Array.isArray(options.sections)
            ? options.sections
            : admin.crawler.sections.values();
          const prepared = admin.crawler.dataset.records.prepare(records);
          const results = admin.crawler.dataset.results.prepare(
            sections,
            Array.isArray(options.results) ? options.results : [],
          );
          const payload = {
            schema: "onliner-publications",
            schema_version: 2,
            period: period.key,
            collected_at: new Date().toISOString(),
            sections,
            count: prepared.values.length,
            section_results: results.values,
            errors: [...errors, ...results.errors],
            diagnostics: prepared.diagnostics,
            records: prepared.values,
          };
          const blob = new Blob([JSON.stringify(payload)], { type: "application/json;charset=utf-8" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = admin.crawler.dataset.filename(period, {
            ...options,
            count: prepared.values.length,
          });
          document.body.append(link);
          link.click();
          setTimeout(() => {
            URL.revokeObjectURL(link.href);
            link.remove();
          }, 1000);
        },
        section: {
          async run() {
            if (
              admin.crawler.report.state.running ||
              admin.crawler.sections.state.running
            ) {
              alert("Выгрузка уже запущена");
              return false;
            }
            admin.crawler.report.state.running = true;
            window.reportStop = false;
            const title = document.title;
            try {
              const period = await admin.crawler.sections.period.choose();
              if (!period) return false;
              const section = admin.crawler.sections.section();
              const errors = [];
              const outcome = {};
              const records = await admin.crawler.report.collect(
                admin.crawler.sections.filteredUrl(section, period),
                {
                  title: `${period.key} · ${admin.crawler.sections.label(section)}`,
                  period,
                  section,
                  dataset: true,
                  errors,
                  outcome,
                },
              );
              admin.crawler.dataset.download(records, period, errors, {
                section,
                sections: [section],
                results: [outcome],
              });
              if (errors.length) {
                alert(`Сбор готов. Ошибок сбора: ${errors.length}. Причины записаны в JSON.`);
              }
              return true;
            } catch (error) {
              console.error(error);
              alert(error?.message || "Не удалось собрать записи раздела");
              return false;
            } finally {
              document.title = title;
              admin.crawler.sections.clearStatus();
              admin.crawler.report.state.running = false;
            }
          },
        },
        run() {
          return admin.crawler.sections.run("dataset");
        },
      },
      sections: {
        state: {
          running: false,
          worker: null,
          workerTimer: 0,
          workerStamp: 0,
          workerUrl: "",
          workerAnswered: false,
          records: [],
          sections: [],
          period: null,
          user: "",
          index: 0,
          listener: null,
          title: "",
          mode: "report",
          errors: [],
          results: [],
        },
        statusId: "filter-transition",
        statusPanelId: "launchpad-report-progress-panel",
        statusStyleId: "launchpad-report-progress-style",
        workerParam: "worker",
        workerScriptId: "launchpad-report-worker-script",
        workerTimeout: 60000,
        workerSilenceTimeout: 75000,
        demo: {
          timer: 0,
          stop() {
            window.clearTimeout(admin.crawler.sections.demo.timer);
            admin.crawler.sections.demo.timer = 0;
            admin.crawler.sections.clearStatus();
            return true;
          },
          run() {
            admin.crawler.sections.demo.stop();
            const sections = admin.crawler.sections.values();
            const totalItems = 8;
            let index = 0;
            let done = 0;
            const step = () => {
              const section = sections[index] || "";
              const failed = section === "money" && done >= 4 ? 1 : 0;
              admin.crawler.sections.status({
                title: "Демо обхода · сентябрь",
                period: { key: "202609" },
                section,
                sections,
                index,
                page: Math.min(2, Math.floor(done / 4) + 1),
                totalPages: 2,
                done,
                totalItems,
                matched: Math.max(0, done - failed),
                failed,
                user: "Николай Баранов",
                phase: done >= totalItems ? "Раздел собран" : "Собираю записи",
              });
              if (done < totalItems) {
                done = Math.min(totalItems, done + 2);
                admin.crawler.sections.demo.timer = window.setTimeout(step, 420);
                return true;
              }
              if (index < sections.length - 1) {
                index += 1;
                done = 0;
                admin.crawler.sections.demo.timer = window.setTimeout(step, 620);
                return true;
              }
              admin.crawler.sections.demo.timer = window.setTimeout(
                admin.crawler.sections.demo.stop,
                1600,
              );
              return true;
            };
            return step();
          },
        },
        bootstrap: {
          storageKey: "onliner-worker-bootstrap-reminder",
          remind() {
            try {
              if (sessionStorage.getItem(admin.crawler.sections.bootstrap.storageKey) === "1") {
                return true;
              }
            } catch {
              // Continue with the reminder when storage is unavailable.
            }
            const proceed = confirm([
              "Для сбора по всем разделам нужен включённый userscript Onliner Worker Bootstrap в Tampermonkey.",
              "Также разреши всплывающие окна для админки Onlíner.",
              "",
              "Продолжить запуск?",
            ].join("\n"));
            if (!proceed) return false;
            try {
              sessionStorage.setItem(admin.crawler.sections.bootstrap.storageKey, "1");
            } catch {
              // The reminder remains best-effort without storage access.
            }
            return true;
          },
        },
        values() {
          return Object.keys(cms.sections || {}).filter((section) => section !== "gomelnews");
        },
        label(section = "") {
          return cms.sections?.[section]?.label || section;
        },
        marker(section = "") {
          return cms.sections?.[section]?.marker || admin.crawler.sections.label(section);
        },
        pad(value = 0) {
          return String(value).padStart(2, "0");
        },
        period: {
          id: "launchpad-report-period-panel",
          styleId: "launchpad-report-period-style",
          resolve(date = new Date(), offset = 0) {
            const start = new Date(
              date.getFullYear(),
              date.getMonth() + Number(offset || 0),
              1,
            );
            const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
            const key = `${start.getFullYear()}${admin.crawler.sections.pad(start.getMonth() + 1)}`;
            return {
              key,
              start: `${start.getFullYear()}-${admin.crawler.sections.pad(start.getMonth() + 1)}-01`,
              end: `${end.getFullYear()}-${admin.crawler.sections.pad(end.getMonth() + 1)}-01`,
            };
          },
          fromUrl(value = location.href) {
            try {
              const key = new URL(value, location.href).searchParams.get("m") || "";
              const match = key.match(/^(\d{4})(\d{2})$/);
              if (!match) return admin.crawler.sections.period.resolve();
              return admin.crawler.sections.period.resolve(
                new Date(Number(match[1]), Number(match[2]) - 1, 1),
              );
            } catch {
              return admin.crawler.sections.period.resolve();
            }
          },
          label(value, year = false) {
            const match = String(value?.key || "").match(/^(\d{4})(\d{2})$/);
            if (!match) return String(value?.key || "");
            const label = new Intl.DateTimeFormat("ru-RU", {
              month: "long",
              ...(year ? { year: "numeric" } : {}),
            })
              .format(new Date(Number(match[1]), Number(match[2]) - 1, 1))
              .replace(/\s+г\.$/u, "");
            return label.charAt(0).toUpperCase() + label.slice(1);
          },
          short(value) {
            const match = String(value?.key || "").match(/^(\d{4})(\d{2})$/);
            if (!match) return "—";
            const month = Array.from(admin.crawler.sections.period.label(value)).slice(0, 3).join("");
            return `${month} ${match[1]}`;
          },
          default(date = new Date()) {
            const current = admin.crawler.sections.period.resolve(date);
            const previous = admin.crawler.sections.period.resolve(date, -1);
            if (date.getDate() <= 5) return previous;
            const lastDay = new Date(
              date.getFullYear(),
              date.getMonth() + 1,
              0,
            ).getDate();
            if (date.getDate() === lastDay) return current;
            return previous;
          },
          options(date = new Date(), count = 360) {
            return Array.from(
              { length: Math.max(1, Number(count) || 1) },
              (_, index) => admin.crawler.sections.period.resolve(date, -index),
            );
          },
          html(date = new Date(), theme = "dark") {
            const selected = admin.crawler.sections.period.default(date);
            const periods = admin.crawler.sections.period.options(date);
            const years = [...new Set(periods.map((item) => item.key.slice(0, 4)))];
            const options = years
              .map((year) => ui.controls.optgroup({
                label: year,
                content: periods
                  .filter((item) => item.key.startsWith(year))
                  .map((item) => ui.controls.option({
                    value: item.key,
                    label: admin.crawler.sections.period.label(item),
                    selected: item.key === selected.key,
                  }))
                  .join(""),
              }))
              .join("");
            const marker = ui.controls.marker({
              content: ui.controls.icon(icon.emoji("calendar")),
              button: {
                title: "Месяц статистики",
                attrs: ' type="button" tabindex="-1" aria-label="Месяц статистики"',
              },
            });
            const apply = ui.controls.cluster({
              role: "actions",
              content: ui.controls.button({
                content: icon.emoji("check-mark-button"),
                action: "crawler.period.apply",
                title: "Собрать выбранный месяц",
                attrs: ' type="button"',
              }),
            });
            const chrome = ui.controls.chrome({
              theme,
              themeAction: "crawler.period.theme",
              closeAction: "crawler.period.close",
            });
            const head = ui.shell.shell({
              left: marker,
              main: apply,
              right: chrome,
              classes: "crawler-period-head",
              pack: "spread",
            });
            const select = ui.controls.select({
              content: options,
              classes: "crawler-period-select",
              attrs: ' data-crawler-period-select="true" aria-label="Месяц статистики"',
            });
            const body = ui.shell.row(
              ui.controls.fieldBox({
                content: select,
                classes: "crawler-period-field",
              }),
              ' data-crawler-period-body="true"',
            );
            return ui.shell.stack(`${head}${body}`);
          },
          choose(date = new Date()) {
            document.querySelector(
              `#${admin.crawler.sections.period.id} [data-action="crawler.period.close"]`,
            )?.click();
            host.mount(
              admin.crawler.sections.period.styleId,
              `${css.filter.panel()}${css.admin.stack()}`,
            );
            const theme = "dark";
            const root = host.create({
              id: admin.crawler.sections.period.id,
              html: admin.crawler.sections.period.html(date, theme),
              draggable: { handle: ".crawler-period-head" },
            });
            root.dataset.uiSurface = "toolbar";
            root.dataset.uiFrame = "capsule";
            root.dataset.toolbarFlow = "stack";
            root.dataset.dock = "floating";
            root.dataset.dockTarget = "viewport";
            ui.surface.sync(root, {
              layout: "fullscreen",
              theme,
              surface: "toolbar",
            });
            return new Promise((resolve) => {
              let closed = false;
              const close = (value = null) => {
                if (closed) return false;
                closed = true;
                ui.overlay.unregister(admin.crawler.sections.period.id);
                root.remove();
                resolve(value);
                return true;
              };
              const save = () => {
                const key = String(
                  root.querySelector("[data-crawler-period-select='true']")?.value || "",
                );
                const match = key.match(/^(\d{4})(\d{2})$/);
                if (!match) return false;
                return close(admin.crawler.sections.period.resolve(
                  new Date(Number(match[1]), Number(match[2]) - 1, 1),
                ));
              };
              root.addEventListener("click", (event) => {
                const action = event.target.closest("[data-action]")?.dataset?.action || "";
                if (action === "crawler.period.close") return close();
                if (action === "crawler.period.apply") return save();
                if (action !== "crawler.period.theme") return false;
                const next = root.dataset.theme === "dark" ? "light" : "dark";
                ui.surface.sync(root, {
                  layout: "fullscreen",
                  theme: next,
                  surface: "toolbar",
                });
                ui.controls.chrome.theme(root, {
                  theme: next,
                  action: "crawler.period.theme",
                });
                return true;
              });
              root.addEventListener("keydown", (event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  close();
                  return;
                }
                if (event.key !== "Enter") return;
                event.preventDefault();
                save();
              });
              ui.overlay.register({
                id: admin.crawler.sections.period.id,
                kind: "crawler-period",
                close: () => close(),
                editable: () => root.querySelector("[data-crawler-period-select='true']"),
              });
              root.querySelector("[data-crawler-period-select='true']")?.focus();
            });
          },
        },
        filteredUrl(
          section = "",
          period = admin.crawler.sections.period.resolve(),
          worker = false,
        ) {
          const url = new URL(`https://${section}.onliner.by/wp-admin/edit.php`);
          url.searchParams.set("post_status", "publish");
          url.searchParams.set("m", period.key);
          if (worker) url.searchParams.set(admin.crawler.sections.workerParam, "1");
          if (worker && admin.crawler.sections.state.mode === "dataset") url.searchParams.set("dataset", "1");
          return url.href;
        },
        section(value = location.hostname) {
          const source = String(value || "");
          const host = /^[a-z][a-z\d+.-]*:\/\//i.test(source)
            ? new URL(source).hostname
            : source;
          return host.split(".")[0] || "";
        },
        attach(records = [], section = "") {
          return records.map((item) => ({
            ...item,
            section,
            sectionLabel: admin.crawler.sections.label(section),
          }));
        },
        summary(records = []) {
          const counts = new Map();
          records.forEach((item) => {
            const section = item.section || "unknown";
            counts.set(section, (counts.get(section) || 0) + 1);
          });
          return [...counts.entries()]
            .map(([section, count]) => `${admin.crawler.sections.marker(section)} · ${count}`)
            .join("\n");
        },
        statusSections(section = "") {
          const state = admin.crawler.sections.state;
          if (state.sections.length) return state.sections;
          const available = new Set(admin.crawler.sections.values());
          const query = new URL(location.href).searchParams
            .get("worker_sections")
            ?.split(",")
            .filter((item) => available.has(item)) || [];
          return query.length ? query : [section].filter(Boolean);
        },
        statusIndex(section = "", sections = []) {
          const state = admin.crawler.sections.state;
          if (state.sections.length) return state.index;
          const query = Number.parseInt(
            new URL(location.href).searchParams.get("worker_index") || "",
            10,
          );
          if (Number.isFinite(query) && query >= 0 && query < sections.length) {
            return query;
          }
          return Math.max(0, sections.indexOf(section));
        },
        statusStrip(section = "", sections = [], index = 0) {
          return ui.shell.group(
            ui.shell.strip(
              sections.map((item, position) => ui.controls.button({
                content: icon.emoji(cms.sections?.[item]?.icon || "bookmark-tabs"),
                title: admin.crawler.sections.label(item),
                attrs: [
                  ' type="button" disabled',
                  ' data-role="section"',
                  ` data-section="${ui.controls.escape(item)}"`,
                  ` data-status="${position < index ? "completed" : position === index ? "current" : "upcoming"}"`,
                  ` aria-label="${ui.controls.escape(admin.crawler.sections.label(item))}"`,
                ].join(""),
              })).join(""),
              { classes: "filter-transition-strip" },
            ),
            { classes: "filter-transition-group", rail: false },
          );
        },
        display: {
          user(value = "") {
            const name = String(value || "").trim();
            if (!name || ["Все", "—"].includes(name)) return name || "—";
            const parts = name.split(/\s+/u).filter(Boolean);
            const values = parts.length > 1
              ? [parts[0], parts[parts.length - 1]]
              : parts;
            return values
              .map((part) => Array.from(part)[0] || "")
              .join("")
              .toLocaleUpperCase("ru-RU");
          },
        },
        statusData(value = {}) {
          const state = admin.crawler.sections.state;
          const page = Number(value.page) || 0;
          const totalPages = Number(value.totalPages) || 0;
          const done = Number(value.done) || 0;
          const totalItems = Number(value.totalItems) || 0;
          const matched = Number(value.matched) || 0;
          const dataset = state.mode === "dataset" ||
            new URL(location.href).searchParams.get("dataset") === "1";
          const period = value.period || state.period || admin.crawler.sections.period.fromUrl();
          const user = String(
            value.user || (dataset ? "Все" : state.user || admin.crawler.report.user()) || "—",
          ).trim();
          return {
            page: totalPages ? `${page || 1}/${totalPages}` : page || "—",
            done,
            totalItems,
            collected: matched || (!totalItems && done ? done : 0),
            period: admin.crawler.sections.period.short(period),
            user: admin.crawler.sections.display.user(user),
            userTitle: user,
          };
        },
        statusPanel(value = {}, section = "", sections = [], index = 0) {
          const progress = admin.crawler.sections.statusData(value);
          const position = sections.length ? `${index + 1}/${sections.length}` : "";
          const metric = (marker, label, content, attrs = "", title = content) => ui.controls.cluster({
            content: `<span title="${ui.controls.escape(label)}" aria-label="${ui.controls.escape(label)}">${marker}</span><strong title="${ui.controls.escape(title)}">${ui.controls.escape(content)}</strong>`,
            role: "status",
            size: "fill",
            group: {
              classes: "crawler-progress-metric",
              attrs,
            },
          });
          const head = ui.shell.frame({
            classes: "admin-fields-head crawler-progress-head",
            attrs: ' data-admin-stack-head="true" data-panel-head="true" data-panel-drag-handle="true"',
            pack: "spread",
            left: ui.controls.marker({
              content: icon.emoji(cms.sections?.[section]?.icon || "bookmark-tabs"),
              button: {
                title: admin.crawler.sections.label(section) || "Сбор записей",
                attrs: ' type="button" tabindex="-1" aria-hidden="true"',
              },
            }),
            main: ui.shell.strip(
              ui.controls.counter({
                current: progress.done,
                limit: progress.totalItems,
                label: "Записи",
                showLabel: false,
                classes: "admin-stack-counter",
                attrs: ' data-head-flex="true" data-crawler-progress-counter="true"',
              }),
              { classes: "admin-stack-main" },
            ),
            right: position
              ? ui.controls.cluster({
                  content: `<span class="crawler-progress-position">${ui.controls.escape(position)}</span>`,
                  role: "status",
                })
              : "",
          });
          const body = `
            <div data-admin-stack-body data-mode="crawler-progress">
              <div class="admin-fields-row crawler-progress-metrics">
                ${metric(icon.emoji("calendar"), "Месяц", progress.period, ' data-crawler-progress-metric="period"')}
                ${metric(icon.emoji("spiral-notepad"), "Записи", progress.collected, ' data-crawler-progress-metric="collected"')}
                ${metric(icon.emoji("bust-in-silhouette"), "Пользователь", progress.user, ' data-crawler-progress-metric="user"', progress.userTitle)}
              </div>
            </div>
          `;
          return ui.shell.stack(`${head}${body}`);
        },
        statusSync(panel, value = {}, sections = [], index = 0) {
          if (!panel) return false;
          const progress = admin.crawler.sections.statusData(value);
          ui.controls.counterSync(
            panel.querySelector("[data-crawler-progress-counter='true']"),
            {
              current: progress.done,
              limit: progress.totalItems,
              label: "Записи",
              showLabel: false,
            },
          );
          const position = panel.querySelector(".crawler-progress-position");
          if (position) position.textContent = sections.length ? `${index + 1}/${sections.length}` : "";
          ["collected", "period", "user"].forEach((name) => {
            const node = panel.querySelector(`[data-crawler-progress-metric="${name}"]`);
            const content = node?.querySelector("strong");
            if (content) {
              content.textContent = String(progress[name]);
              if (name === "user") content.title = progress.userTitle;
            }
          });
          return true;
        },
        statusNode(value = {}, section = "", sections = [], index = 0) {
          if (!document.body) return null;
          host.mount(
            admin.crawler.sections.statusStyleId,
            `${css.filter.panel()}${css.admin.stack()}`,
          );
          let overlay = document.getElementById(admin.crawler.sections.statusId);
          if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = admin.crawler.sections.statusId;
            overlay.setAttribute("role", "presentation");
            overlay.innerHTML = '<div class="filter-transition-body" data-crawler-progress-sections="true"></div>';
            document.body.append(overlay);
          }
          const strip = overlay.querySelector("[data-crawler-progress-sections='true']");
          const signature = `${sections.join(",")}:${index}`;
          if (strip && strip.dataset.crawlerProgressSignature !== signature) {
            strip.innerHTML = admin.crawler.sections.statusStrip(section, sections, index);
            strip.dataset.crawlerProgressSignature = signature;
          }
          let panel = document.getElementById(admin.crawler.sections.statusPanelId);
          if (!panel) {
            panel = host.create({
              id: admin.crawler.sections.statusPanelId,
              html: admin.crawler.sections.statusPanel(value, section, sections, index),
              draggable: true,
            });
            panel.dataset.crawlerProgressSignature = signature;
            panel.dataset.adminStack = "crawler-progress";
            panel.dataset.uiSurface = "toolbar";
            panel.dataset.uiFrame = "capsule";
            panel.dataset.toolbarFlow = "stack";
            panel.dataset.dock = "floating";
            panel.dataset.dockTarget = "viewport";
            ui.surface.sync(panel, {
              layout: "fullscreen",
              theme: "dark",
              surface: "toolbar",
            });
            panel.style.setProperty("z-index", "2147483647", "important");
          }
          return panel;
        },
        status(value = {}) {
          const state = admin.crawler.sections.state;
          const section = String(value.section || state.sections[state.index] || "");
          const provided = Array.isArray(value.sections)
            ? value.sections.filter((item) => admin.crawler.sections.values().includes(item))
            : [];
          const sections = provided.length
            ? provided
            : admin.crawler.sections.statusSections(section);
          const providedIndex = Number.parseInt(value.index, 10);
          const index = Number.isFinite(providedIndex) &&
            providedIndex >= 0 &&
            providedIndex < sections.length
            ? providedIndex
            : admin.crawler.sections.statusIndex(section, sections);
          const panel = admin.crawler.sections.statusNode(
            value,
            section,
            sections,
            index,
          );
          if (!panel) return false;
          const signature = `${sections.join(",")}:${index}`;
          if (panel.dataset.crawlerProgressSignature !== signature) {
            panel.innerHTML = admin.crawler.sections.statusPanel(
              value,
              section,
              sections,
              index,
            );
            panel.dataset.crawlerProgressSignature = signature;
          }
          return admin.crawler.sections.statusSync(panel, value, sections, index);
        },
        clearStatus() {
          document.getElementById(admin.crawler.sections.statusId)?.remove();
          document.getElementById(admin.crawler.sections.statusPanelId)?.remove();
        },
        workerActive() {
          return new URL(location.href).searchParams.get(admin.crawler.sections.workerParam) === "1";
        },
        script() {
          return (
            [...document.querySelectorAll("script[src]")]
              .map((node) => String(node.src || ""))
              .find((value) => /\/dist\/launchpad\.js(?:[?#]|$)/.test(value)) || ""
          );
        },
        workerDocument(value) {
          try {
            return value?.document || null;
          } catch {
            return null;
          }
        },
        workerReady(value) {
          const document = admin.crawler.sections.workerDocument(value);
          if (!document?.documentElement) return false;
          return Boolean(document.head || document.body || document.documentElement);
        },
        workerHref(value) {
          try {
            return String(value?.location?.href || "");
          } catch {
            return "";
          }
        },
        workerOrigin(value) {
          const href = admin.crawler.sections.workerHref(value);
          if (!href) return "";
          try {
            return new URL(href).origin;
          } catch {
            return "";
          }
        },
        currentOrigin(section = "") {
          try {
            return new URL(admin.crawler.sections.workerUrl(section)).origin;
          } catch {
            return "";
          }
        },
        sameOrigin(section = "") {
          const target = admin.crawler.sections.currentOrigin(section);
          return Boolean(target) && target === location.origin;
        },
        workerTarget(value) {
          const href = admin.crawler.sections.workerHref(value);
          const target = admin.crawler.sections.state.workerUrl;
          if (!href || !target) return false;
          return href === target;
        },
        workerMounted(value) {
          try {
            return Boolean(
              admin.crawler.sections.workerDocument(value)?.getElementById("launchpad-panel") ||
              admin.crawler.sections.workerDocument(value)?.getElementById(admin.crawler.sections.workerScriptId),
            );
          } catch {
            return false;
          }
        },
        inject(value) {
          const src = admin.crawler.sections.script();
          if (!src) return false;
          if (admin.crawler.sections.workerMounted(value)) return true;
          const document = admin.crawler.sections.workerDocument(value);
          if (!document) return false;
          if (document.getElementById(admin.crawler.sections.workerScriptId)) return false;
          const root = document.head || document.body || document.documentElement;
          if (!root) return false;
          const script = document.createElement("script");
          script.id = admin.crawler.sections.workerScriptId;
          script.src = src;
          script.onerror = () => script.remove();
          root.append(script);
          return true;
        },
        fail(section = "", stamp = 0) {
          const state = admin.crawler.sections.state;
          const current = String(state.sections[state.index] || "");
          if (!state.running || state.workerStamp !== stamp || section !== current) return false;
          const message = state.workerAnswered
            ? `Раздел «${admin.crawler.sections.label(section)}» не отвечает больше ${Math.round(admin.crawler.sections.workerSilenceTimeout / 1000)} секунд. Запусти выгрузку ещё раз.`
            : !admin.crawler.sections.sameOrigin(section)
              ? `Не удалось запустить раздел «${admin.crawler.sections.label(section)}». Проверь userscript Onliner Worker Bootstrap и разрешение всплывающих окон.`
              : `Не удалось запустить раздел «${admin.crawler.sections.label(section)}». Обнови Launchpad и повтори выгрузку.`;
          admin.crawler.sections.status({ section, phase: message });
          alert(message);
          if (state.mode === "dataset") {
            state.errors.push({ section, error: message });
            state.results.push({
              section,
              status: "failed",
              count: 0,
              scanned: 0,
              expected: 0,
              error: message,
            });
            admin.crawler.sections.next();
            return false;
          }
          admin.crawler.sections.reset();
          return false;
        },
        arm(section = "", timeout = admin.crawler.sections.workerTimeout) {
          const state = admin.crawler.sections.state;
          const stamp = state.workerStamp;
          window.clearTimeout(state.workerTimer);
          state.workerTimer = window.setTimeout(
            () => admin.crawler.sections.fail(section, stamp),
            timeout,
          );
          return true;
        },
        watch(section = "") {
          const state = admin.crawler.sections.state;
          window.clearTimeout(state.workerTimer);
          state.workerStamp += 1;
          state.workerUrl = admin.crawler.sections.workerUrl(section);
          state.workerAnswered = false;
          const crossOrigin = !admin.crawler.sections.sameOrigin(section);
          const stamp = state.workerStamp;
          const step = () => {
            if (!state.running || state.workerStamp !== stamp) return false;
            if (!state.worker || state.worker.closed) {
              alert("Worker-вкладка закрыта. Запусти выгрузку ещё раз и не закрывай служебную вкладку до завершения.");
              admin.crawler.sections.reset();
              return false;
            }
            if (crossOrigin) {
              admin.crawler.sections.status({
                section,
                phase: "Жду отдельный bootstrap в worker-вкладке",
              });
              admin.crawler.sections.arm(section);
              return true;
            }
            if (!admin.crawler.sections.workerTarget(state.worker)) {
              state.workerTimer = window.setTimeout(step, 250);
              return false;
            }
            if (!admin.crawler.sections.workerReady(state.worker)) {
              state.workerTimer = window.setTimeout(step, 250);
              return false;
            }
            if (admin.crawler.sections.workerMounted(state.worker)) {
              admin.crawler.sections.arm(section);
              return true;
            }
            admin.crawler.sections.inject(state.worker);
            admin.crawler.sections.status({ section, phase: "Запускаю worker" });
            state.workerTimer = window.setTimeout(step, 250);
            return false;
          };
          return step();
        },
        progressMessage(value = {}) {
          if (!admin.crawler.sections.workerActive()) return false;
          window.opener?.postMessage(
            {
              source: "launchpad",
              type: "report.sections.progress",
              section: admin.crawler.sections.section(),
              progress: value,
            },
            "*",
          );
          return true;
        },
        message(section = "", records = [], error = "", meta = {}) {
          window.opener?.postMessage(
            {
              source: "launchpad",
              type: "report.sections.worker",
              section,
              records,
              error,
              user: meta.user || "",
              mode: meta.mode || "report",
              errors: Array.isArray(meta.errors) ? meta.errors : [],
              result: meta.result || null,
            },
            "*",
          );
        },
        workerUrl(section = "") {
          const url = new URL(admin.crawler.sections.filteredUrl(
            section,
            admin.crawler.sections.state.period,
            true,
          ));
          const state = admin.crawler.sections.state;
          if (state.sections.length) {
            url.searchParams.set("worker_sections", state.sections.join(","));
            url.searchParams.set("worker_index", String(state.index));
          }
          return url.href;
        },
        next() {
          const state = admin.crawler.sections.state;
          state.index += 1;
          const section = state.sections[state.index];
          if (!section && state.mode === "dataset") {
            admin.crawler.sections.status({ phase: "Готово. Скачиваю JSON." });
            admin.crawler.dataset.download(state.records, state.period, state.errors, {
              sections: state.sections,
              results: state.results,
            });
            setTimeout(() => admin.crawler.sections.reset(), 4200);
            return true;
          }
          if (!section) {
            admin.crawler.sections.status({ phase: "Готово. Собираю ZIP." });
            admin.crawler.report.archive.download(
              state.records,
              {
                period: state.period,
                user: state.user,
              },
              state.errors,
            ).then(() => {
              setTimeout(() => admin.crawler.sections.reset(), 4200);
            }).catch((error) => {
              console.error(error);
              alert(error?.message || "Не удалось собрать ZIP отчёта");
              admin.crawler.sections.reset();
            });
            return true;
          }
          document.title = `Отчёт · ${admin.crawler.sections.marker(section)} · ${state.index + 1}/${state.sections.length}`;
          admin.crawler.sections.status({ section, phase: "Открываю раздел" });
          state.worker.location.href = admin.crawler.sections.workerUrl(section);
          admin.crawler.sections.watch(section);
          return true;
        },
        receive(event) {
          const data = event?.data || {};
          if (data.source !== "launchpad") return;
          const state = admin.crawler.sections.state;
          if (!state.running) return;
          if (event.source !== state.worker) return;
          if (!["report.sections.progress", "report.sections.worker"].includes(data.type)) return;
          const expected = String(state.sections[state.index] || "");
          const section = String(data.section || "");
          if (!section || section !== expected) return;
          if (event.origin !== admin.crawler.sections.currentOrigin(section)) return;
          if ((data.mode || "report") !== state.mode && data.type === "report.sections.worker") return;
          state.workerAnswered = true;
          window.clearTimeout(state.workerTimer);
          if (data.type === "report.sections.progress") {
            admin.crawler.sections.arm(
              section,
              admin.crawler.sections.workerSilenceTimeout,
            );
            admin.crawler.sections.status({
              ...(data.progress || {}),
              section: data.section || state.sections[state.index] || "",
              phase: "Собираю записи",
            });
            return;
          }
          if (data.type !== "report.sections.worker") return;
          try {
            state.errors.push(
              ...(Array.isArray(data.errors) ? data.errors : []).map((item) => ({
                ...item,
                section: item.section || section,
              })),
            );
            if (data.error) {
              console.error(data.error);
              state.errors.push({ section, error: data.error });
              if (state.mode === "dataset") {
                state.results.push({
                  section,
                  status: "failed",
                  count: 0,
                  scanned: 0,
                  expected: 0,
                  error: data.error,
                });
              }
            } else if (state.mode === "dataset") {
              const records = admin.crawler.sections.attach(data.records || [], section);
              const result = data.result;
              const statuses = ["completed", "empty", "failed"];
              const valid = result &&
                result.section === section &&
                statuses.includes(result.status) &&
                Number(result.count) === records.length &&
                !((result.status === "completed") && !records.length) &&
                !((result.status === "empty") && records.length);
              state.records.push(...records);
              if (valid) {
                state.results.push({ ...result, count: records.length });
              } else {
                const error = "Worker не передал согласованный результат сбора раздела";
                state.errors.push({ section, error });
                state.results.push({
                  section,
                  status: "failed",
                  count: records.length,
                  scanned: Number(result?.scanned) || 0,
                  expected: Number(result?.expected) || 0,
                  error,
                });
              }
              admin.crawler.sections.status({
                section,
                done: records.length,
                user: "Все",
                phase: valid && result.status !== "failed"
                  ? "Раздел собран"
                  : "Раздел собран не полностью",
              });
            } else {
              state.records.push(...admin.crawler.sections.attach(data.records || [], section));
              if (data.user && !state.user) state.user = data.user;
              admin.crawler.sections.status({
                section,
                done: (data.records || []).length,
                user: data.user || state.user,
                phase: "Раздел собран",
              });
            }
          } catch (error) {
            console.error(error);
            if (state.mode === "dataset") {
              state.errors.push({
                section,
                error: error?.message || String(error),
              });
              state.results.push({
                section,
                status: "failed",
                count: 0,
                scanned: 0,
                expected: 0,
                error: error?.message || String(error),
              });
            }
            admin.crawler.sections.status({
              section,
              phase: "Раздел собран, но выгрузка упала",
            });
          } finally {
            admin.crawler.sections.next();
          }
        },
        reset() {
          const state = admin.crawler.sections.state;
          if (state.listener) window.removeEventListener("message", state.listener);
          window.clearTimeout(state.workerTimer);
          admin.crawler.sections.clearStatus();
          document.title = state.title || document.title;
          state.running = false;
          state.worker = null;
          state.workerTimer = 0;
          state.workerStamp += 1;
          state.workerUrl = "";
          state.workerAnswered = false;
          state.records = [];
          state.sections = [];
          state.period = null;
          state.user = "";
          state.index = 0;
          state.listener = null;
          state.title = "";
          state.mode = "report";
          state.errors = [];
          state.results = [];
          admin.crawler.report.state.running = false;
          return true;
        },
        async worker() {
          if (!admin.crawler.sections.workerActive()) return false;
          if (admin.crawler.report.state.running) return false;
          const section = admin.crawler.sections.section();
          const period = admin.crawler.sections.state.period ||
            admin.crawler.sections.period.fromUrl();
          const user = admin.crawler.report.user();
          const dataset = new URL(location.href).searchParams.get("dataset") === "1";
          const errors = [];
          const outcome = {};
          document.title = `📄 0/? · 🧾 0`;
          admin.crawler.sections.status({
            title: section,
            period,
            section,
            phase: "Старт worker",
          });
          admin.crawler.sections.progressMessage({
            title: section,
            period,
            phase: "Старт worker",
          });
          admin.crawler.report.state.running = true;
          window.reportStop = false;
          try {
            const records = await admin.crawler.report.collect(location.href, {
              title: section,
              period,
              user,
              section,
              dataset,
              errors,
              ...(dataset ? { outcome } : {}),
            });
            admin.crawler.sections.message(section, records, "", {
              user,
              mode: dataset ? "dataset" : "report",
              errors,
              ...(dataset ? { result: outcome } : {}),
            });
            return true;
          } catch (error) {
            admin.crawler.sections.message(
              section,
              [],
              error.message || "Ошибка отчёта",
              { user, mode: dataset ? "dataset" : "report" },
            );
            return false;
          } finally {
            admin.crawler.sections.clearStatus();
            admin.crawler.report.state.running = false;
          }
        },
        async run(mode = "report") {
          if (admin.crawler.sections.state.running || admin.crawler.report.state.running) {
            alert("Выгрузка уже запущена");
            return false;
          }
          if (!admin.crawler.sections.bootstrap.remind()) return false;
          const period = await admin.crawler.sections.period.choose();
          if (!period) return false;
          const state = admin.crawler.sections.state;
          state.mode = mode;
          state.errors = [];
          state.results = [];
          state.sections = admin.crawler.sections.values();
          state.period = period;
          state.user = admin.crawler.report.user();
          state.index = 0;
          state.records = [];
          state.title = document.title;
          state.running = true;
          admin.crawler.report.state.running = true;
          window.reportStop = false;
          admin.crawler.sections.status({ phase: `Период ${state.period.key}. Открываю worker-вкладку.` });
          state.listener = (event) => admin.crawler.sections.receive(event);
          window.addEventListener("message", state.listener);
          if (!state.sections.length) {
            admin.crawler.sections.reset();
            alert("Не нашёл разделы для выгрузки");
            return false;
          }
          state.worker = window.open(
            admin.crawler.sections.workerUrl(state.sections[0]),
            "launchpad-report-sections",
          );
          if (!state.worker) {
            admin.crawler.sections.reset();
            alert("Браузер заблокировал worker-вкладку. Разреши всплывающие окна для админки Onlíner и повтори запуск.");
            return false;
          }
          document.title = `Отчёт · ${admin.crawler.sections.marker(state.sections[0])} · 1/${state.sections.length}`;
          admin.crawler.sections.status({
            section: state.sections[0],
            phase: "Открываю раздел",
          });
          admin.crawler.sections.watch(state.sections[0]);
          return true;
        },
      }
  };
};
