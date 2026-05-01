import { sections, vpn } from "./core/admin.js";

(async () => {
  if (window.bmlFilterRunning) {
    const stop = confirm("⏳ Работаю\nТормозить?");
    if (!stop) return;
    window.bmlFilterStop = true;
    window.bmlFilterRunning = false;
    document.querySelector("#bml-progress")?.remove();
    return;
  }

  window.bmlFilterRunning = true;
  window.bmlFilterStop = false;
  const started = performance.now();

  const monthNames = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ];

  const weekdays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const parse = (html) => new DOMParser().parseFromString(html, "text/html");
  const currentSection = location.hostname.split(".")[0];
  let period = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  const maxPeriod = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const ym = () =>
    `${period.getFullYear()}${String(period.getMonth() + 1).padStart(2, "0")}`;

  const periodLabel = () =>
    `${monthNames[period.getMonth()]} ${period.getFullYear()}`;

  const getWeekday = (date) => {
    if (!date || date.includes("--")) return "";
    const parsed = new Date(`${date}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? "" : weekdays[parsed.getDay()];
  };

  const getCurrentUser = () =>
    document.querySelector("#wp-admin-bar-user-info .display-name")?.textContent?.trim() ||
    "";

  const getUserSlug = (name) => {
    if (name === "Николай Баранов") return "nb";
    const last = name.split(/\s+/).pop() || "";
    return last.toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
  };

  const decode = (value) => {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = value;
    return textarea.value;
  };

  const stripContent = (value) =>
    decode(value)
      .replace(/\[[^\]]+\]/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const countWords = (value) =>
    (
      value.match(
        /[A-Za-zА-Яа-яЁё0-9]+(?:[-’'][A-Za-zА-Яа-яЁё0-9]+)*/g,
      ) || []
    ).length;

  const getVolume = (doc) => {
    const wpText = doc.querySelector("#wp-word-count")?.textContent || "";
    const wpCount = wpText.match(/\d+/)?.[0];
    if (wpCount && wpCount !== "0") return wpCount;
    const content = doc.querySelector("#content")?.value || "";
    return content ? String(countWords(stripContent(content))) : "";
  };

  const getLayout = (doc) => {
    const layout =
      doc.querySelector("#layout_select") ||
      doc.querySelector('[name="layout"]');
    return layout?.value?.trim() || "";
  };

  const showProgress = (text) => {
    let box = document.querySelector("#bml-progress");
    if (!box) {
      box = document.createElement("div");
      box.id = "bml-progress";
      box.innerHTML = `
        <div id="bml-progress-text"></div>
        <div style="height:8px;margin-top:6px;border:1px solid #ccd0d4;background:#f0f0f1;">
          <div id="bml-progress-bar" style="height:100%;width:0%;background:#2f7a45;transition:width .2s ease;"></div>
        </div>
      `;
      box.style.cssText = `
        position:fixed;
        top:80px;
        left:50%;
        transform:translateX(-50%);
        z-index:999999;
        background:#fff;
        padding:10px;
        border:1px solid #ccd0d4;
        font:inherit;
        width:240px;
        text-align:center;
      `;
      document.body.appendChild(box);
    }
    box.querySelector("#bml-progress-text").textContent = text;
    return box;
  };

  const setProgress = (done, total, text) => {
    const box = showProgress(text);
    const percent = total ? Math.round((done / total) * 100) : 0;
    box.querySelector("#bml-progress-bar").style.width = percent + "%";
  };

  const getChoice = async () => {
    const section = sections[currentSection] ? currentSection : "people";
    document.querySelector("#bml-filter-panel")?.remove();

    const panel = document.createElement("div");
    panel.id = "bml-filter-panel";

    const sectionButtons = Object.entries(sections)
      .map(
        ([key, item]) => `
        <button
          type="button"
          data-section="${key}"
          class="${key === section ? "bml-current" : "bml-btn"}"
        >
          ${item.icon} ${item.label}
        </button>
      `,
      )
      .join("");

    panel.innerHTML = `
      <style>
        #bml-filter-panel,
        #bml-filter-panel * { box-sizing: border-box; }
        #bml-filter-panel { font: inherit; text-align: center; }
        #bml-filter-panel button { font: inherit; }
        #bml-filter-panel .bml-overlay {
          position: fixed;
          inset: 0;
          z-index: 999998;
        }
        #bml-filter-panel .bml-box {
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 999999;
          background: #fff;
          color: inherit;
          padding: 10px;
          border: 1px solid #ccd0d4;
          width: max-content;
        }
        #bml-filter-panel .bml-btn,
        #bml-filter-panel .bml-current {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 28px;
          margin: 3px 0;
          padding: 2px 8px;
          white-space: nowrap;
          text-align: center;
          line-height: 1.2;
        }
        #bml-filter-panel .bml-current {
          border: 1px solid #2f7a45;
          background: #e7f6eb;
          box-shadow: inset 0 0 0 1px #b7dfc2;
          color: #1f5f33;
          font-weight: 600;
          cursor: pointer;
        }
        #bml-filter-panel .bml-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin: 6px 0 4px;
        }
        #bml-filter-panel .bml-period {
          min-width: 105px;
          font-weight: 600;
          text-align: center;
        }
        #bml-filter-panel .bml-mini {
          width: 28px;
          height: 28px;
          min-height: 28px;
          padding: 0;
          text-align: center;
        }
        #bml-filter-panel .bml-mini:disabled {
          opacity: .45;
          cursor: default;
        }
        #bml-filter-panel .bml-separator {
          margin-top: 8px;
          padding-top: 6px;
          border-top: 1px solid #ccd0d4;
        }
      </style>
      <div class="bml-overlay"></div>
      <div class="bml-box">
        <div class="bml-row">
          <button id="bml-prev" type="button" class="bml-mini">⬅️</button>
          <div id="bml-period" class="bml-period"></div>
          <button id="bml-next" type="button" class="bml-mini">➡️</button>
        </div>
        <div class="bml-separator">${sectionButtons}</div>
        <div class="bml-separator">
          <button id="bml-cancel" type="button" class="bml-btn">❌</button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    const renderPeriod = () => {
      panel.querySelector("#bml-period").textContent = periodLabel();
      panel.querySelector("#bml-next").disabled = period >= maxPeriod;
    };

    renderPeriod();

    const choice = await new Promise((resolve) => {
      panel.querySelector("#bml-prev").onclick = () => {
        period = new Date(period.getFullYear(), period.getMonth() - 1, 1);
        renderPeriod();
      };

      panel.querySelector("#bml-next").onclick = () => {
        if (period >= maxPeriod) return;
        period = new Date(period.getFullYear(), period.getMonth() + 1, 1);
        renderPeriod();
      };

      panel.querySelector("#bml-cancel").onclick = () => resolve(null);

      panel.querySelectorAll("[data-section]").forEach((button) => {
        button.onclick = () => {
          const target = button.dataset.section;
          if (target === section) {
            resolve({
              section,
              month: ym(),
              user: getCurrentUser(),
            });
            return;
          }
          location.href = `https://${target}.onliner.by/wp-admin/edit.php`;
          resolve(null);
        };
      });
    });

    panel.remove();
    return choice;
  };

  const getNextUrl = (doc) => {
    const next = doc.querySelector(".tablenav-pages a.next-page");
    return next && !next.classList.contains("disabled")
      ? new URL(next.href, location.origin).href
      : null;
  };

  const getTotalPages = (doc) =>
    Number(doc.querySelector(".total-pages")?.textContent?.trim()) || 1;

  const getInline = (row, id, sel) =>
    row.querySelector(`#inline_${id} ${sel}`)?.textContent?.trim() || "";

  const getRows = (doc) =>
    [...doc.querySelectorAll("#the-list tr[id^='post-']")]
      .map((row) => {
        const id = row.id.replace("post-", "");
        const titleLink = row.querySelector(".row-title");
        const liveLink = row.querySelector('.row-actions a[rel="permalink"]');
        const date = `${getInline(row, id, ".aa")}-${getInline(row, id, ".mm")}-${getInline(row, id, ".jj")}`;

        return {
          section: currentSection,
          id,
          date,
          weekday: getWeekday(date),
          time: `${getInline(row, id, ".hh")}:${getInline(row, id, ".mn")}`,
          sticky: getInline(row, id, ".sticky") ? "Прилеплено" : "",
          layout: "",
          live: liveLink ? liveLink.href : "",
          edit: titleLink
            ? titleLink.href
            : `${location.origin}/wp-admin/post.php?post=${id}&action=edit`,
          author: row.querySelector(".author")?.textContent.trim() || "",
          source: "",
          volume: "",
          revisions: "",
          userRevisions: "",
          title: titleLink?.textContent.trim() || "",
        };
      })
      .filter((row) => row.id && row.edit);

  const getRevisionStats = (doc, user) => {
    const items = [...doc.querySelectorAll("#revisionsdiv li")];
    return {
      revisions: items.length,
      userRevisions: items.filter((item) =>
        item.textContent.replace(/\s+/g, " ").includes(user),
      ).length,
    };
  };

  try {
    const choice = await getChoice();
    if (!choice) return;
    if (!choice.user) return alert("Не удалось определить пользователя");

    await vpn.ensure();

    const host = `${choice.section}.onliner.by`;
    const resultUrl = `https://${host}/wp-admin/edit.php?s&post_status=publish&m=${choice.month}`;
    let url = resultUrl;
    let totalPages = 1;
    const rows = [];
    const matched = [];

    for (let page = 1; page <= 50 && url; page++) {
      if (window.bmlFilterStop) throw new Error("Остановлено");
      setProgress(page - 1, totalPages, `📄 ${page}...`);
      const html = await fetch(url, { credentials: "include" }).then((r) =>
        r.text(),
      );
      const doc = parse(html);
      totalPages = getTotalPages(doc);
      rows.push(...getRows(doc));
      url = getNextUrl(doc);
    }

    for (let i = 0; i < rows.length; i++) {
      if (window.bmlFilterStop) throw new Error("Остановлено");
      setProgress(i, rows.length, `🔎 ${i + 1}/${rows.length}`);
      const html = await fetch(rows[i].edit, { credentials: "include" }).then(
        (r) => r.text(),
      );
      const doc = parse(html);
      const stats = getRevisionStats(doc, choice.user);

      if (stats.userRevisions) {
        rows[i].revisions = stats.revisions;
        rows[i].userRevisions = stats.userRevisions;
        rows[i].source = doc.querySelector("#post_source")?.value?.trim() || "";
        rows[i].layout = getLayout(doc);
        rows[i].volume = getVolume(doc);
        matched.push(rows[i]);
      }
    }

    const csv = [
      [
        "section",
        "date",
        "weekday",
        "time",
        "sticky",
        "layout",
        "live",
        "edit",
        "author",
        "source",
        "volume",
        "revisions",
        "user_revisions",
        "title",
      ],
      ...matched.map((row) => [
        row.section,
        row.date,
        row.weekday,
        row.time,
        row.sticky,
        row.layout,
        row.live,
        row.edit,
        row.author,
        row.source,
        row.volume,
        row.revisions,
        row.userRevisions,
        row.title,
      ]),
    ]
      .map((line) =>
        line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(";"),
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const link = document.createElement("a");
    const userSlug = getUserSlug(choice.user);
    link.href = URL.createObjectURL(blob);
    link.download = `onliner-${choice.section}-${choice.month}-${userSlug}-${matched.length}.csv`;
    link.click();

    const seconds = Math.round((performance.now() - started) / 1000);
    alert(
      `${sections[choice.section].icon} ${sections[choice.section].label}\n` +
        `🗓️ ${periodLabel()}\n` +
        `📄 ${totalPages} · 📝 ${rows.length}\n` +
        `👤 ${choice.user} · ✍️ ${matched.length}\n\n` +
        `⏱️ ${seconds} с`,
    );

    location.href = resultUrl;
  } catch (error) {
    if (error.message === "Остановлено") {
      alert("🛑 Остановлено");
    } else {
      console.error(error);
      alert("❌ Ошибка");
    }
  } finally {
    window.bmlFilterRunning = false;
    window.bmlFilterStop = false;
  }
})();
