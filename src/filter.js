import { cms } from "./core/cms.js";
import { panel } from "./core/panel.js";
import { css } from "./core/css.js";
import { icon } from "./core/icon.js";
import { ui } from "./core/ui.js";
import { toolbar } from "./core/toolbar.js";

(async () => {
  let navigating = false;
  if (window.filterRunning) {
    const stop = confirm("⏳ Работаю\nТормозить?");
    if (!stop) return;
    window.filterStop = true;
    window.filterRunning = false;
    document.querySelector("#filter-progress")?.remove();
    document.querySelector("#filter-transition")?.remove();
    return;
  }
  window.filterRunning = true;
  window.filterStop = false;
  const started = performance.now();
  panel.mount("filter-style", css.filter.panel());
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
  const allStateKey = "__onliner_filter_all__:";
  let period = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  const maxPeriod = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const ym = () =>
    `${period.getFullYear()}${String(period.getMonth() + 1).padStart(2, "0")}`;
  const periodLabel = () => `${monthNames[period.getMonth()]} ${period.getFullYear()}`;
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
    decode(value).replace(/\[[^\]]+\]/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const countWords = (value) =>
    (value.match(/[A-Za-zА-Яа-яЁё0-9]+(?:[-’'][A-Za-zА-Яа-яЁё0-9]+)*/g) || []).length;
  const getVolume = (doc) => {
    const wpText = doc.querySelector("#wp-word-count")?.textContent || "";
    const wpCount = wpText.match(/\d+/)?.[0];
    if (wpCount && wpCount !== "0") return wpCount;
    const content = doc.querySelector("#content")?.value || "";
    return content ? String(countWords(stripContent(content))) : "";
  };
  const getLayout = (doc) => {
    const layout = doc.querySelector("#layout_select") || doc.querySelector('[name="layout"]');
    return layout?.value?.trim() || "";
  };
  const fetchText = async (url) => {
    const response = await fetch(url, {
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  };
  const delay = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));
  const buildSectionButtons = ({
    keys = [],
    active = "",
    mode = "panel",
    status = () => "",
  } = {}) =>
    keys
      .map((key) => {
        const item = cms.sections[key];
        const state = status(key);
        const attrs =
          mode === "overlay"
            ? ` type="button" data-role="section" data-status="${state}"${key === active ? ' data-active="true"' : ""} disabled`
            : ` type="button" data-role="section" data-section="${key}"${key === active ? ' data-active="true"' : ""}`;
        return ui.controls.button({
          content: icon.emoji(item?.icon || "", "default"),
          title: item?.label || key,
          attrs,
        });
      })
      .join("");
  const setWorkOverlay = ({ sections = [], index = 0, section = "" } = {}) => {
    let node = document.getElementById("filter-transition");
    if (!node) {
      node = document.createElement("div");
      node.id = "filter-transition";
      node.innerHTML = `<div class="filter-transition-body"></div>`;
      document.body.appendChild(node);
    }
    const list = Array.isArray(sections) ? sections : [];
    const safeIndex = Math.max(0, Math.min(list.length - 1, index));
    const currentSection = section || list[safeIndex] || "";
    const row = buildSectionButtons({
      keys: list.length ? list : [currentSection],
      active: currentSection,
      mode: "overlay",
      status(key) {
        const itemIndex = list.indexOf(key);
        if (itemIndex < 0) return "current";
        if (itemIndex < safeIndex) return "completed";
        if (itemIndex > safeIndex) return "upcoming";
        return "current";
      },
    });
    const strip = ui.shell.strip(row, {
      classes: "filter-transition-strip",
      attrs: ' data-transition-row="true"',
    });
    const group = ui.shell.group(strip, {
      rail: true,
      classes: "filter-transition-group",
      attrs: ' data-transition-group="true"',
    });
    node.querySelector(".filter-transition-body").innerHTML = group;
    node.hidden = false;
    return node;
  };
  const showWorkOverlay = (value) => setWorkOverlay(value);
  const updateWorkOverlay = (value) => setWorkOverlay(value);
  const hideWorkOverlay = () => {
    document.getElementById("filter-transition")?.remove();
  };
  const syncProgress = (done, total, value) => {
    const theme =
      document.querySelector("#filter-panel")?.dataset?.theme ||
      document.querySelector('.panel[data-ui-surface="toolbar"]')?.dataset
        ?.theme ||
      ui.surface.theme.get("") ||
      "light";
    const box = ui.surface.progress.ensure({
      id: "filter-progress",
      textId: "filter-progress-text",
      meterId: "filter-progress-counter",
      rowAttrs: ' data-progress-drag="true"',
    });
    if (box.dataset.drag !== "true") {
      toolbar.behavior.drag({
        panel: box,
        keepWidth: true,
        canStart(event) {
          if (event.button !== 0) return false;
          if (!event.target.closest("[data-progress-drag='true']")) return false;
          if (event.target.closest("button,input,select,a,.ui-counter-pill")) return false;
          return true;
        },
      });
    }
    ui.surface.sync(box, { theme, surface: "progress", frame: "capsule" });
    const content =
      typeof value === "string"
        ? ui.controls.message({ icon: "\u{1F4C4}", text: value, scope: "default" })
        : ui.controls.message({
            icon: value?.icon || "\u{1F4C4}",
            text: value?.text || "",
            scope: "default",
          });
    ui.surface.progress.sync(box, {
      text: content,
      current: done,
      limit: total,
      textId: "filter-progress-text",
      meterId: "filter-progress-counter",
    });
  };
  const allState = {
    read() {
      if (!String(window.name || "").startsWith(allStateKey)) return null;
      try {
        return JSON.parse(window.name.slice(allStateKey.length));
      } catch {
        return null;
      }
    },
    write(value) {
      window.name = allStateKey + JSON.stringify(value);
    },
    clear() {
      if (!String(window.name || "").startsWith(allStateKey)) return;
      window.name = "";
    },
  };
  const getChoice = async () => {
    const section = cms.sections[currentSection] ? currentSection : "people";
    document.querySelector("#filter-panel")?.remove();
    const theme =
      document.querySelector('.panel[data-ui-surface="toolbar"]')?.dataset?.theme ||
      "light";
    const sectionButtons = buildSectionButtons({
      keys: Object.keys(cms.sections),
      active: section,
      mode: "panel",
    });
    const allButton = ui.controls.button({
      content: icon.emoji("\u{1F534}", "default"),
      title: "Все домены",
      attrs: ' type="button" data-role="section" data-section="all"',
    });
    const emojiButton = (id, content, attrs = "") =>
      ui.controls.button({
        action: id.replace("filter-", ""),
        content: icon.emoji(content, "default"),
        attrs: ` id="${id}" type="button" data-role="mini"${attrs}`,
      });
    const nav = ui.shell.group(
      `${emojiButton("filter-prev", "\u25C0\uFE0F")}<div id="filter-period" data-role="period"></div>${emojiButton("filter-next", "\u25B6\uFE0F")}`,
      { rail: true, attrs: ' data-role="nav-group"' },
    );
    const system = ui.shell.group(
      `${emojiButton("filter-theme", icon.glyph(theme), ' data-theme-icon="auto" data-theme-scope="default"')}${emojiButton("filter-cancel", "\u274C")}`,
      { rail: true, attrs: ' data-role="system-group"' },
    );
    const head = ui.shell.shell({ left: nav, right: system, pack: "start" });
    const sections = ui.shell.group(
      ui.shell.strip(sectionButtons + allButton, { attrs: ' data-role="sections"' }),
      { rail: true, attrs: ' data-role="sections-group"' },
    );
    const body = ui.shell.stack(`${ui.shell.row(head, " data-header")}${ui.shell.row(sections)}`);
    const panelNode = panel.create({
      id: "filter-panel",
      className: "panel",
      place: "center",
      html: body,
    });
    panelNode.dataset.uiSurface = "toolbar";
    panelNode.dataset.theme = theme;
    ui.surface.sync(panelNode, { theme, surface: "toolbar", capsule: false });
    const controller = toolbar.creature({
      panel: panelNode,
      ...toolbar.presets.multiRowFixed("content"),
      theme: () => panelNode.dataset.theme || theme,
      drag: {
        keepWidth: true,
        canStart(event) {
          if (event.button !== 0) return false;
          if (!event.target.closest("[data-header]")) return false;
          if (event.target.closest("button,input,select,a")) return false;
          return true;
        },
      },
      resize: null,
    });
    controller.behavior.bind();
    const renderPeriod = () => {
      panelNode.querySelector("#filter-period").textContent = periodLabel();
      panelNode.querySelector("#filter-next").disabled = period >= maxPeriod;
    };
    renderPeriod();
    const choice = await new Promise((resolve) => {
      panelNode.querySelector("#filter-prev").onclick = () => {
        period = new Date(period.getFullYear(), period.getMonth() - 1, 1);
        renderPeriod();
      };
      panelNode.querySelector("#filter-next").onclick = () => {
        if (period >= maxPeriod) return;
        period = new Date(period.getFullYear(), period.getMonth() + 1, 1);
        renderPeriod();
      };
      panelNode.querySelector("#filter-theme").onclick = () => {
        const next = panelNode.dataset.theme === "dark" ? "light" : "dark";
        panelNode.dataset.theme = next;
        ui.surface.theme.set(next);
        ui.surface.theme.syncButton(panelNode, { scope: "default" });
      };
      panelNode.querySelector("#filter-cancel").onclick = () => resolve(null);
      panelNode.querySelectorAll("[data-section]").forEach((button) => {
        button.onclick = () => {
          const target = button.dataset.section;
          if (target === "all") {
            resolve({ section: "all", month: ym(), user: getCurrentUser() });
            return;
          }
          if (target === section) {
            resolve({ section, month: ym(), user: getCurrentUser() });
            return;
          }
          location.href = `https://${target}.onliner.by/wp-admin/edit.php`;
          resolve(null);
        };
      });
    });
    controller?.behavior.destroy();
    panelNode.remove();
    return choice;
  };
  const getNextUrl = (doc) => {
    const next = doc.querySelector(".tablenav-pages a.next-page");
    return next && !next.classList.contains("disabled")
      ? new URL(next.href, location.origin).href
      : null;
  };
  const getTotalPages = (doc) => Number(doc.querySelector(".total-pages")?.textContent?.trim()) || 1;
  const getInline = (row, id, sel) => row.querySelector(`#inline_${id} ${sel}`)?.textContent?.trim() || "";
  const getTags = (row) =>
    row.querySelector(".tags")?.textContent?.replace(/\s+/g, " ").trim() || "";
  const getRows = (doc, section) =>
    [...doc.querySelectorAll("#the-list tr[id^='post-']")]
      .map((row) => {
        const id = row.id.replace("post-", "");
        const titleLink = row.querySelector(".row-title");
        const liveLink = row.querySelector('.row-actions a[rel="permalink"]');
        const date = `${getInline(row, id, ".aa")}-${getInline(row, id, ".mm")}-${getInline(row, id, ".jj")}`;
        return {
          section,
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
          tags: getTags(row),
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
  const nowIso = () => new Date().toISOString();
  const allStateModel = {
    freshHours: 18,
    valid(value) {
      if (!value || typeof value !== "object") return false;
      if (value.active !== true) return false;
      if (!value.month || !value.user) return false;
      if (!Array.isArray(value.sections) || !value.sections.length) return false;
      if (!Array.isArray(value.matched)) return false;
      if (!Array.isArray(value.failed)) return false;
      if (!Array.isArray(value.successful)) return false;
      if (!Number.isInteger(value.index) || value.index < 0) return false;
      if (typeof value.rowsCount !== "number") return false;
      if (typeof value.pagesCount !== "number") return false;
      if (!value.startedAt || !value.updatedAt) return false;
      if (value.index > value.sections.length) return false;
      return true;
    },
    stale(value) {
      const time = Date.parse(String(value?.updatedAt || ""));
      if (!Number.isFinite(time)) return true;
      return Date.now() - time > allStateModel.freshHours * 60 * 60 * 1000;
    },
    create({ month, user }) {
      const stamp = nowIso();
      return {
        active: true,
        month,
        user,
        sections: Object.keys(cms.sections),
        index: 0,
        rowsCount: 0,
        pagesCount: 0,
        matched: [],
        failed: [],
        successful: [],
        startedAt: stamp,
        updatedAt: stamp,
      };
    },
    touch(value) {
      value.updatedAt = nowIso();
      return value;
    },
  };
  try {
    const runningState = allState.read();
    const hasState = Boolean(runningState);
    const validActive = allStateModel.valid(runningState) && !allStateModel.stale(runningState);
    let resumedState = validActive ? runningState : null;
    if (hasState && !validActive) {
      const restore = confirm("⚠️ Старое/повреждённое состояние all-сбора.\nВосстановить?");
      if (restore && allStateModel.valid(runningState)) {
        resumedState = runningState;
      } else {
        allState.clear();
      }
    }
    const choice = resumedState
      ? { section: "all", month: resumedState.month, user: resumedState.user }
      : await getChoice();
    if (!choice) return;
    if (!choice.user) return alert("Не удалось определить пользователя");
    syncProgress(0, 1, { icon: "\u{1F680}", text: "Старт..." });
    await cms.vpn.ensure();
    const modeAll = choice.section === "all";
    const state =
      modeAll && resumedState
        ? resumedState
        : modeAll
          ? allStateModel.create({ month: choice.month, user: choice.user })
          : null;
    if (modeAll && state.index >= state.sections.length) {
      allState.clear();
      alert("✅ All-сбор уже завершён. Запусти новый, если нужен свежий отчёт.");
      return;
    }
    const targetSection = modeAll ? state.sections[state.index] : choice.section;
    if (modeAll && !targetSection) {
      allState.clear();
      alert("❌ Некорректное состояние all-сбора.");
      return;
    }
    const host = `${targetSection}.onliner.by`;
    const resultUrl = `https://${host}/wp-admin/edit.php?s&post_status=publish&m=${choice.month}`;
    if (modeAll && currentSection !== targetSection) {
      const step = `${targetSection} ${state.index + 1}/${state.sections.length} · старт`;
      syncProgress(state.index, state.sections.length, { icon: "\u21AA\uFE0F", text: step });
      allState.write(allStateModel.touch(state));
      showWorkOverlay({
        sections: state.sections,
        index: state.index,
        section: targetSection,
      });
      await delay(850);
      navigating = true;
      location.href = resultUrl;
      return;
    }
    if (modeAll) {
      syncProgress(state.index, state.sections.length, {
        icon: "\u{1F680}",
        text: `${targetSection} ${state.index + 1}/${state.sections.length} · старт`,
      });
      showWorkOverlay({
        sections: state.sections,
        index: state.index,
        section: targetSection,
      });
    }
    await cms.vpn.ensure();
    let url = resultUrl;
    let totalPages = 1;
    const rows = [];
    const matched = [];
    let sectionFailed = false;
    try {
      for (let page = 1; page <= 50 && url; page++) {
        if (window.filterStop) throw new Error("Остановлено");
        const step = modeAll
          ? `${targetSection} ${state.index + 1}/${state.sections.length} · страницы`
          : "Страницы";
        syncProgress(page - 1, totalPages, { icon: "\u{1F4C4}", text: step });
        const html = await fetchText(url);
        const doc = parse(html);
        totalPages = getTotalPages(doc);
        rows.push(...getRows(doc, targetSection));
        url = getNextUrl(doc);
      }
      for (let index = 0; index < rows.length; index++) {
        if (window.filterStop) throw new Error("Остановлено");
        const step = modeAll
          ? `${targetSection} ${state.index + 1}/${state.sections.length} · записи`
          : "Записи";
        syncProgress(index, rows.length, { icon: "\u{1F50E}", text: step });
        const html = await fetchText(rows[index].edit);
        const doc = parse(html);
        const stats = getRevisionStats(doc, choice.user);
        if (!stats.userRevisions) continue;
        rows[index].revisions = stats.revisions;
        rows[index].userRevisions = stats.userRevisions;
        rows[index].source = doc.querySelector("#post_source")?.value?.trim() || "";
        rows[index].layout = getLayout(doc);
        rows[index].volume = getVolume(doc);
        matched.push(rows[index]);
      }
    } catch (error) {
      if (!modeAll || error.message === "Остановлено") throw error;
      sectionFailed = true;
      state.failed.push({
        section: targetSection,
        message: String(error.message || "Ошибка"),
      });
      state.index += 1;
      allStateModel.touch(state);
      if (state.index < state.sections.length) {
        const nextSection = state.sections[state.index];
        const nextUrl = `https://${nextSection}.onliner.by/wp-admin/edit.php?s&post_status=publish&m=${choice.month}`;
        allState.write(state);
        updateWorkOverlay({
          sections: state.sections,
          index: state.index,
          section: nextSection,
        });
        await delay(850);
        navigating = true;
        location.href = nextUrl;
        return;
      }
    }
    if (modeAll) {
      if (!sectionFailed) {
        state.pagesCount += totalPages;
        state.rowsCount += rows.length;
        state.matched.push(...matched);
        state.successful.push(targetSection);
        state.index += 1;
      }
      allStateModel.touch(state);
      if (state.index < state.sections.length) {
        const nextSection = state.sections[state.index];
        const nextUrl = `https://${nextSection}.onliner.by/wp-admin/edit.php?s&post_status=publish&m=${choice.month}`;
        syncProgress(state.index, state.sections.length, {
          icon: "\u21AA\uFE0F",
          text: `${nextSection} ${state.index + 1}/${state.sections.length} · старт`,
        });
        allState.write(state);
        updateWorkOverlay({
          sections: state.sections,
          index: state.index,
          section: nextSection,
        });
        await delay(850);
        navigating = true;
        location.href = nextUrl;
        return;
      }
    }
    if (modeAll) {
      syncProgress(state.sections.length, state.sections.length, {
        icon: "\u2705",
        text: `${targetSection} ${state.sections.length}/${state.sections.length} · готово`,
      });
    }
    const finalMatched = modeAll ? state.matched : matched;
    const finalRowsCount = modeAll ? state.rowsCount : rows.length;
    const finalPagesCount = modeAll ? state.pagesCount : totalPages;
    if (modeAll) hideWorkOverlay();
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
        "tags",
      ],
      ...finalMatched.map((row) => [
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
        row.tags,
      ]),
    ]
      .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    const userSlug = getUserSlug(choice.user);
    const scope = modeAll ? "all" : choice.section;
    link.href = URL.createObjectURL(blob);
    link.download = `onliner-${scope}-${choice.month}-${userSlug}-${finalMatched.length}.csv`;
    link.click();
    const seconds = Math.round((performance.now() - started) / 1000);
    const sectionLabel = modeAll
      ? "\u{1F534} Все домены"
      : `${cms.sections[choice.section].icon} ${cms.sections[choice.section].label}`;
    const failedList = modeAll
      ? state.failed
          .slice(0, 6)
          .map((item) => `• ${item.section}: ${item.message}`)
          .join("\n")
      : "";
    const failedTail = modeAll && state.failed.length > 6 ? `\n• ... ещё ${state.failed.length - 6}` : "";
    const allSummary = modeAll
      ? `✅ ${state.successful.length} · ❌ ${state.failed.length}\n`
      : "";
    alert(
      `${sectionLabel}\n` +
        `🗓️ ${periodLabel()}\n` +
        allSummary +
        `📄 ${finalPagesCount} · 📝 ${finalRowsCount}\n` +
        `👤 ${choice.user} · ✍️ ${finalMatched.length}` +
        (failedList ? `\n\n${failedList}${failedTail}` : "") +
        `\n\n` +
        `⏱️ ${seconds} с`,
    );
    if (modeAll) allState.clear();
    if (!modeAll) location.href = resultUrl;
  } catch (error) {
    if (error.message === "Остановлено") {
      allState.clear();
      hideWorkOverlay();
      alert("🛑 Остановлено");
    } else {
      hideWorkOverlay();
      console.error(error);
      alert("❌ Ошибка");
    }
  } finally {
    if (!navigating) hideWorkOverlay();
    window.filterRunning = false;
    window.filterStop = false;
  }
})();
