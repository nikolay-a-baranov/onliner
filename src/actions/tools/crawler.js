import { cms } from "../../core/cms.js";
import { widget } from "../../core/widget.js";
import { markup } from "../../pipe/markup.js";
export const attachCrawler = (admin) => {
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
        download(records = [], meta = {}) {
          const blob = new Blob(["\uFEFF" + admin.crawler.report.csv(records)], {
            type: "text/csv;charset=utf-8",
          });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          const period = meta.period?.key ? `${meta.period.key}-` : "";
          const section = meta.section ? `${String(meta.section)}-` : "";
          const user = meta.user
            ? `${admin.crawler.report.userSlug(meta.user)}-`
            : "";
          link.download = `onliner-report-${period}${section}${user}${records.length}-${admin.crawler.tags.stamp()}.csv`;
          document.body.append(link);
          link.click();
          setTimeout(() => {
            URL.revokeObjectURL(link.href);
            link.remove();
          }, 1000);
        },
        downloadText(records = [], meta = {}) {
          const blob = new Blob(["\uFEFF" + admin.crawler.report.tsv(records)], {
            type: "text/plain;charset=utf-8",
          });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          const period = meta.period?.key ? `${meta.period.key}-` : "";
          const user = meta.user
            ? `${admin.crawler.report.userSlug(meta.user)}-`
            : "";
          link.download = `onliner-report-${period}${user}${records.length}-${admin.crawler.tags.stamp()}.txt`;
          document.body.append(link);
          link.click();
          setTimeout(() => {
            URL.revokeObjectURL(link.href);
            link.remove();
          }, 1000);
        },
        downloadErrors(errors = [], meta = {}) {
          if (!errors.length) return false;
          const blob = new Blob([JSON.stringify(errors, null, 2)], {
            type: "application/json;charset=utf-8",
          });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          const period = meta.period?.key ? `${meta.period.key}-` : "";
          const section = meta.section ? `${String(meta.section)}-` : "";
          const user = meta.user
            ? `${admin.crawler.report.userSlug(meta.user)}-`
            : "";
          link.download = `onliner-report-errors-${period}${section}${user}${errors.length}-${admin.crawler.tags.stamp()}.json`;
          document.body.append(link);
          link.click();
          setTimeout(() => {
            URL.revokeObjectURL(link.href);
            link.remove();
          }, 1000);
          return true;
        },
        request() {
          return {
            timeout: 30000,
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
          admin.crawler.sections.progressMessage({
            title: String(value.title || ""),
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
          let knownTotalPages = 0;
          let knownTotalItems = 0;
          let scanned = 0;
          let url = startUrl;
          for (let page = 1; url && page <= maxPages; page += 1) {
            if (admin.crawler.report.stop()) break;
            admin.crawler.report.progress({
              title: titlePrefix,
              page,
              totalPages: knownTotalPages,
              done: scanned,
              totalItems: knownTotalItems,
              matched: records.length,
              failed: errors.length,
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
              page: pagination.page || page,
              totalPages: knownTotalPages,
              done: scanned,
              totalItems: knownTotalItems,
              matched: records.length,
              failed: errors.length,
            });
            for (const row of rows) {
              if (admin.crawler.report.stop()) break;
              scanned += 1;
              admin.crawler.report.progress({
                title: titlePrefix,
                page: pagination.page || page,
                totalPages: knownTotalPages,
                done: scanned,
                totalItems: knownTotalItems,
                matched: records.length,
                failed: errors.length,
              });
              try {
                const detail = await admin.crawler.tags.load(
                  row.edit,
                  admin.crawler.report.request(),
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
            url = admin.crawler.tags.next(doc);
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
          return records;
        },
        async run() {
          if (admin.crawler.report.state.running) return false;
          admin.crawler.report.state.running = true;
          window.reportStop = false;
          const title = document.title;
          try {
            const period = admin.crawler.sections.period.choose();
            const url = admin.crawler.sections.filteredUrl(location.hostname.split(".")[0], period);
            const user = admin.crawler.report.user();
            const errors = [];
            const records = await admin.crawler.report.collect(url, {
              title: period.key,
              period,
              user,
              errors,
            });
            admin.crawler.report.download(records, { period, user });
            admin.crawler.report.downloadErrors(errors, {
              period,
              section: admin.crawler.sections.section(),
              user,
            });
            if (errors.length) alert(`Отчёт готов. Пропущено записей: ${errors.length}. Скачан JSON с ошибками.`);
            return true;
          } catch (error) {
            console.error(error);
            alert(error?.message || "Не удалось собрать отчёт");
            return false;
          } finally {
            document.title = title;
            admin.crawler.report.state.running = false;
          }
        },
      },
      dataset: {
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
          prepare(records = [], errors = []) {
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
                section,
                id,
                title: item.title || "",
                url: item.edit_url || item.url || "",
                error: "Дубликат записи исключён из итогового набора",
              });
              return false;
            });
            return {
              values,
              errors: [...errors, ...duplicates],
            };
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
          const prepared = admin.crawler.dataset.records.prepare(records, errors);
          const payload = {
            schema: "onliner-publications",
            schema_version: 2,
            period: period.key,
            collected_at: new Date().toISOString(),
            sections,
            count: prepared.values.length,
            errors: prepared.errors,
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
              const period = admin.crawler.sections.period.choose();
              const section = admin.crawler.sections.section();
              const errors = [];
              const records = await admin.crawler.report.collect(
                admin.crawler.sections.filteredUrl(section, period),
                {
                  title: `${period.key} · ${admin.crawler.sections.label(section)}`,
                  period,
                  section,
                  dataset: true,
                  errors,
                },
              );
              admin.crawler.dataset.download(records, period, errors, {
                section,
                sections: [section],
              });
              if (errors.length) {
                alert(`Сбор готов. Пропущено записей: ${errors.length}. Причины записаны в JSON.`);
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
        },
        statusId: "launchpad-report-progress",
        workerParam: "worker",
        workerScriptId: "launchpad-report-worker-script",
        workerTimeout: 15000,
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
          return (
            {
              people: "👤",
              sport: "🏅",
              money: "💰",
              auto: "🚗",
              tech: "💻",
              realt: "🏠",
            }[String(section || "")] || admin.crawler.sections.label(section)
          );
        },
        pad(value = 0) {
          return String(value).padStart(2, "0");
        },
        period: {
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
          label(value) {
            const match = String(value?.key || "").match(/^(\d{4})(\d{2})$/);
            if (!match) return String(value?.key || "");
            return new Intl.DateTimeFormat("ru-RU", {
              month: "long",
              year: "numeric",
            }).format(new Date(Number(match[1]), Number(match[2]) - 1, 1));
          },
          choose(date = new Date()) {
            const current = admin.crawler.sections.period.resolve(date);
            const previous = admin.crawler.sections.period.resolve(date, -1);
            if (date.getDate() <= 5) return previous;
            const lastDay = new Date(
              date.getFullYear(),
              date.getMonth() + 1,
              0,
            ).getDate();
            if (date.getDate() === lastDay) return current;
            const usePrevious = confirm([
              `Собрать прошлый месяц — ${admin.crawler.sections.period.label(previous)}?`,
              "",
              "OK — прошлый месяц",
              `Отмена — текущий месяц (${admin.crawler.sections.period.label(current)})`,
            ].join("\n"));
            return usePrevious ? previous : current;
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
        statusNode() {
          let node = document.getElementById(admin.crawler.sections.statusId);
          if (node) return node;
          node = document.createElement("div");
          node.id = admin.crawler.sections.statusId;
          node.setAttribute("role", "status");
          node.style.cssText = [
            "position:fixed",
            "right:18px",
            "bottom:18px",
            "z-index:2147483647",
            "min-width:260px",
            "max-width:360px",
            "padding:14px 16px",
            "border-radius:18px",
            "background:rgba(18,18,22,.94)",
            "color:#fff",
            "box-shadow:0 12px 36px rgba(0,0,0,.28)",
            "font:13px/1.45 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",
            "white-space:pre-line",
            "pointer-events:none",
          ].join(";");
          document.body.append(node);
          return node;
        },
        status(value = {}) {
          const state = admin.crawler.sections.state;
          const section = String(value.section || state.sections[state.index] || "");
          const title = String(value.title || "Отчёт по разделам");
          const phase = String(value.phase || "");
          const page = Number(value.page) || 0;
          const totalPages = Number(value.totalPages) || 0;
          const done = Number(value.done) || 0;
          const totalItems = Number(value.totalItems) || 0;
          const failed = Number(value.failed) || 0;
          const sectionLine = section
            ? `${admin.crawler.sections.label(section)} · ${state.index + 1}/${state.sections.length}`
            : "Подготовка";
          const pageLine = totalPages
            ? `Страница ${page || 1}/${totalPages}`
            : page
              ? `Страница ${page}`
              : "";
          const itemLine = totalItems
            ? `Записи ${done}/${totalItems}`
            : done
              ? `Записи ${done}`
              : "";
          const totalLine = `Всего собрано: ${state.records.length}`;
          const errorLine = failed ? `Пропущено: ${failed}` : "";
          admin.crawler.sections.statusNode().textContent = [
            title,
            section
              ? `${admin.crawler.sections.marker(section)} · ${state.index + 1}/${state.sections.length}`
              : sectionLine,
            phase,
            pageLine,
            itemLine,
            errorLine,
            totalLine,
          ].filter(Boolean).join("\n");
          return true;
        },
        clearStatus() {
          document.getElementById(admin.crawler.sections.statusId)?.remove();
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
        watch(section = "") {
          const state = admin.crawler.sections.state;
          window.clearTimeout(state.workerTimer);
          state.workerStamp += 1;
          state.workerUrl = admin.crawler.sections.workerUrl(section);
          state.workerAnswered = false;
          const crossOrigin = !admin.crawler.sections.sameOrigin(section);
          const stamp = state.workerStamp;
          const fail = () => {
            if (!state.running || state.workerStamp !== stamp || state.workerAnswered) return false;
            const message = crossOrigin
              ? `Не удалось запустить раздел «${admin.crawler.sections.label(section)}». Проверь userscript Onliner Worker Bootstrap и разрешение всплывающих окон.`
              : `Не удалось запустить раздел «${admin.crawler.sections.label(section)}». Обнови Launchpad и повтори выгрузку.`;
            admin.crawler.sections.status({ section, phase: message });
            alert(message);
            admin.crawler.sections.reset();
            return false;
          };
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
              state.workerTimer = window.setTimeout(fail, admin.crawler.sections.workerTimeout);
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
              state.workerTimer = window.setTimeout(fail, admin.crawler.sections.workerTimeout);
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
            },
            "*",
          );
        },
        workerUrl(section = "") {
          return admin.crawler.sections.filteredUrl(
            section,
            admin.crawler.sections.state.period,
            true,
          );
        },
        next() {
          const state = admin.crawler.sections.state;
          state.index += 1;
          const section = state.sections[state.index];
          if (!section && state.mode === "dataset") {
            admin.crawler.sections.status({ phase: "Готово. Скачиваю JSON." });
            admin.crawler.dataset.download(state.records, state.period, state.errors);
            setTimeout(() => admin.crawler.sections.reset(), 4200);
            return true;
          }
          if (!section) {
            admin.crawler.sections.status({ phase: "Готово. Скачиваю CSV и TXT." });
            admin.crawler.report.download(state.records, {
              period: state.period,
              user: state.user,
            });
            setTimeout(() => {
              admin.crawler.report.downloadText(state.records, {
                period: state.period,
                user: state.user,
              });
            }, 350);
            setTimeout(() => {
              admin.crawler.report.downloadErrors(state.errors, {
                period: state.period,
                user: state.user,
              });
            }, 700);
            setTimeout(() => admin.crawler.sections.reset(), 4200);
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
          const section = String(data.section || state.sections[state.index] || "");
          if (event.origin !== admin.crawler.sections.currentOrigin(section)) return;
          if ((data.mode || "report") !== state.mode && data.type === "report.sections.worker") return;
          state.workerAnswered = true;
          window.clearTimeout(state.workerTimer);
          if (data.type === "report.sections.progress") {
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
            } else if (state.mode === "dataset") {
              state.records.push(...admin.crawler.sections.attach(data.records || [], section));
              admin.crawler.sections.status({
                section,
                done: (data.records || []).length,
                phase: "Раздел собран",
              });
            } else {
              admin.crawler.report.download(data.records || [], {
                period: state.period,
                section,
                user: data.user || state.user,
              });
              state.records.push(...admin.crawler.sections.attach(data.records || [], section));
              if (data.user && !state.user) state.user = data.user;
              admin.crawler.sections.status({
                section,
                done: (data.records || []).length,
                phase: "Раздел собран",
              });
            }
          } catch (error) {
            console.error(error);
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
          state.workerStamp = 0;
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
          document.title = `📄 0/? · 🧾 0`;
          admin.crawler.sections.progressMessage({
            title: section,
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
            });
            admin.crawler.sections.message(section, records, "", {
              user,
              mode: dataset ? "dataset" : "report",
              errors,
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
            admin.crawler.report.state.running = false;
          }
        },
        run(mode = "report") {
          if (admin.crawler.sections.state.running || admin.crawler.report.state.running) {
            alert("Выгрузка уже запущена");
            return false;
          }
          if (!admin.crawler.sections.bootstrap.remind()) return false;
          const state = admin.crawler.sections.state;
          state.mode = mode;
          state.errors = [];
          state.sections = admin.crawler.sections.values();
          state.period = admin.crawler.sections.period.choose();
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
