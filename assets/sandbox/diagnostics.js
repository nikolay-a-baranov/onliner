import { toolbar } from "../../src/core/surface/toolbar.js";
import { ui } from "../../src/core/surface/ui.js";

(() => {
  const node = {
    get(id) {
      return document.getElementById(id);
    },
    text(id, value = "") {
      const element = node.get(id);
      if (element) element.textContent = String(value || "");
      return element;
    },
  };
  const field = {
    element() {
      return document.querySelector("textarea#content");
    },
    get() {
      const element = field.element();
      if (!element) throw new Error("textarea#content not found");
      return String(element.value || "");
    },
    set(value = "") {
      const element = field.element();
      if (!element) throw new Error("textarea#content not found");
      const setter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )?.set;
      if (!setter) throw new Error("Native textarea setter not found");
      setter.call(element, String(value || ""));
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.focus();
      return element.value;
    },
  };
  const fixture = {
    entries: new Map(),
    manifest() {
      return new URL("./fixtures/index.json", document.baseURI);
    },
    parse(value) {
      if (!value || !Array.isArray(value.fixtures)) {
        throw new Error("Fixture manifest must contain a fixtures array");
      }
      return value.fixtures.map((entry) => {
        if (!entry?.id || !entry?.label || !entry?.file) {
          throw new Error("Fixture manifest entry is incomplete");
        }
        return {
          id: String(entry.id),
          label: String(entry.label),
          file: String(entry.file),
        };
      });
    },
    options(entries = []) {
      const select = node.get("sandbox-sample");
      if (!select) return false;
      const selected = select.value;
      const options = [new Option("Вручную", "")].concat(
        entries.map((entry) => new Option(entry.label, entry.id)),
      );
      select.replaceChildren(...options);
      select.value = entries.some((entry) => entry.id === selected)
        ? selected
        : "";
      return true;
    },
    set(entries = []) {
      fixture.entries = new Map(entries.map((entry) => [entry.id, entry]));
      fixture.options(entries);
      return entries;
    },
    async sync() {
      const response = await fetch(fixture.manifest(), { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fixture manifest returned HTTP ${response.status}`);
      }
      return fixture.set(fixture.parse(await response.json()));
    },
    async load(id = "") {
      const entry = fixture.entries.get(String(id || ""));
      if (!entry) return false;
      const response = await fetch(new URL(entry.file, fixture.manifest()), {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Fixture returned HTTP ${response.status}`);
      }
      field.set(await response.text());
      return entry;
    },
  };
  const local = {
    async load(file) {
      if (!file) return false;
      field.set(await file.text());
      const select = node.get("sandbox-sample");
      if (select) select.value = "";
      return file;
    },
  };
  const compare = {
    readable(value = "") {
      return String(value || "")
        .replace(/\r\n?/g, "\n")
        .replace(/[\u0020\u0009]+/g, " ")
        .replace(/[\u0020\u0009]*\n[\u0020\u0009]*/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    },
    range(before = "", after = "") {
      let start = 0;
      while (
        start < before.length &&
        start < after.length &&
        before[start] === after[start]
      ) {
        start += 1;
      }
      let beforeEnd = before.length;
      let afterEnd = after.length;
      while (
        beforeEnd > start &&
        afterEnd > start &&
        before[beforeEnd - 1] === after[afterEnd - 1]
      ) {
        beforeEnd -= 1;
        afterEnd -= 1;
      }
      return {
        start: before === after ? -1 : start,
        removed: before.slice(start, beforeEnd),
        added: after.slice(start, afterEnd),
      };
    },
    build(before = "", after = "") {
      const changed = before !== after;
      return {
        changed,
        whitespaceOnly:
          changed && compare.readable(before) === compare.readable(after),
        ...compare.range(before, after),
      };
    },
  };
  const events = {
    counts: { input: 0, change: 0 },
    bind() {
      const element = field.element();
      if (!element) return false;
      Object.keys(events.counts).forEach((type) => {
        element.addEventListener(type, () => {
          events.counts[type] += 1;
        });
      });
      return true;
    },
    snapshot() {
      return { ...events.counts };
    },
    difference(before = {}) {
      return Object.fromEntries(
        Object.entries(events.counts).map(([name, count]) => [
          name,
          count - Number(before[name] || 0),
        ]),
      );
    },
  };
  const runtime = {
    launcher() {
      return window.__ONLINER_LAUNCHPAD__ || null;
    },
    run(id) {
      const launcher = runtime.launcher();
      if (!launcher || typeof launcher.runCommand !== "function") {
        throw new Error("Launchpad is not ready");
      }
      return launcher.runCommand(id);
    },
    wait(check, timeout = 5000) {
      const started = Date.now();
      return new Promise((resolve, reject) => {
        const tick = () => {
          if (check()) return resolve(true);
          if (Date.now() - started >= timeout) {
            return reject(new Error("Reader did not change state"));
          }
          window.setTimeout(tick, 50);
        };
        tick();
      });
    },
  };
  const theme = {
    get() {
      return ui.surface.theme.get(toolbar.appearance.theme("sandbox-editor"));
    },
    set(value = "") {
      const next = value === "dark" ? "dark" : "light";
      document.documentElement.dataset.uiTheme = next;
      const page = node.get("sandbox-page");
      if (page) page.dataset.theme = next;
      return next;
    },
    toggle() {
      const panel = node.get("sandbox-toolbar");
      if (!panel) return "light";
      return theme.set(
        ui.surface.themeLocal(panel, {
          action: "sandbox-theme",
          scope: "sandbox",
        }),
      );
    },
  };
  const view = {
    controls() {
      const panel = node.get("sandbox-toolbar");
      if (!panel) return false;
      const currentTheme = theme.get();
      const button = ({
        id,
        title,
        fluent = "",
        fallback = fluent,
        glyph = "",
        action = "",
        attrs = "",
      }) =>
        ui.controls.button({
          fluent,
          fallback,
          glyph,
          action,
          title,
          attrs: ` id="${id}" type="button" aria-label="${title}"${attrs}`,
        });
      const select = ui.controls.fieldBox({
        content: '<select class="audit-field audit-field-select" id="sandbox-sample" aria-label="Тестовый пример"><option value="">Вручную</option></select>',
        classes: "audit-field-box audit-field-choice sandbox-choice",
        attrs: ' data-audit-input="false"',
      });
      const input = ui.shell.group(
        `${select}${button({
          id: "sandbox-local-file-open",
          title: "Загрузка",
          fluent: "Arrow Upload",
          fallback: "Document Text Extract",
        })}`,
        {
          classes: "sandbox-group sandbox-input-group",
          role: "input",
        },
      );
      const comparison = ui.shell.group(
        button({
          id: "sandbox-cleanup",
          title: "Сравнение",
          fluent: "Scales",
        }),
        {
          classes: "sandbox-group sandbox-command-group",
          role: "actions",
        },
      );
      const reading = ui.shell.group(
        button({
          id: "sandbox-reader",
          title: "Чтение",
          fluent: "Glasses",
        }),
        {
          classes: "sandbox-group sandbox-command-group",
          role: "actions",
        },
      );
      const appearance = ui.shell.group(
        button({
          id: "sandbox-theme",
          title: "Тема",
          glyph: toolbar.appearance.themeToggleIcon(currentTheme),
          action: "sandbox-theme",
          attrs: ' data-theme-icon="auto" data-theme-scope="sandbox"',
        }),
        {
          classes: "sandbox-group sandbox-theme-group",
          stick: "right",
          role: "chrome",
        },
      );
      panel.innerHTML = [
        input,
        comparison,
        reading,
        '<input class="sandbox-file-input" id="sandbox-local-file" type="file" accept=".html,text/html" tabindex="-1">',
        '<span class="sandbox-status" id="sandbox-status" role="status" aria-live="polite"></span>',
        appearance,
      ].join("");
      ui.surface.sync(panel, {
        layout: "inline",
        theme: currentTheme,
        surface: "toolbar",
      });
      panel.dataset.toolbarFlow = "rail";
      panel.dataset.dock = "top";
      panel.dataset.dockTarget = "content";
      theme.set(currentTheme);
      return true;
    },
    status(message = "", state = "") {
      const element = node.text("sandbox-status", message);
      if (element) element.dataset.state = state;
      return element;
    },
    result(report = {}) {
      const output = node.get("sandbox-result");
      if (!output) return false;
      output.hidden = false;
      output.open = true;
      output.dataset.changed = report.diff.changed ? "true" : "false";
      node.text("sandbox-before", report.before);
      node.text("sandbox-after", report.after);
      node.text("sandbox-removed", report.diff.removed || "—");
      node.text("sandbox-added", report.diff.added || "—");
      node.text(
        "sandbox-summary",
        report.diff.changed
          ? report.diff.whitespaceOnly
            ? "Пробелы"
            : `Изменено · ${report.diff.start}`
          : "Совпадает",
      );
      node.text(
        "sandbox-events",
        `input ${report.events.input} · change ${report.events.change}`,
      );
      return true;
    },
  };
  const cleanup = {
    report: null,
    current() {
      return Boolean(cleanup.report) && field.get() === cleanup.report.after;
    },
    visible() {
      const output = node.get("sandbox-result");
      return Boolean(output && !output.hidden && output.open);
    },
    hide() {
      const output = node.get("sandbox-result");
      if (!output) return false;
      output.hidden = true;
      return true;
    },
    show() {
      if (!cleanup.report) return false;
      view.result(cleanup.report);
      return true;
    },
    run() {
      cleanup.report = null;
      cleanup.hide();
      const before = field.get();
      const eventSnapshot = events.snapshot();
      runtime.run("cleanup");
      const after = field.get();
      const changed = before !== after;
      const result = { before, after, changed };
      const report = {
        ...result,
        diff: compare.build(before, after),
        events: events.difference(eventSnapshot),
      };
      cleanup.report = report;
      window.__ONLINER_SANDBOX_LAST_RESULT__ = result;
      view.result(report);
      view.status(
        changed ? "Изменено" : "Без изменений",
        changed ? "changed" : "same",
      );
      return result;
    },
    toggle() {
      if (!cleanup.current()) return cleanup.run();
      if (cleanup.visible()) {
        cleanup.hide();
        view.status("Скрыто", "same");
      } else {
        cleanup.show();
        view.status("Показано", "same");
      }
      return cleanup.report
        ? {
            before: cleanup.report.before,
            after: cleanup.report.after,
            changed: cleanup.report.changed,
          }
        : null;
    },
  };
  const reader = {
    async run() {
      const active = document.body.classList.contains("reader-active");
      view.status(active ? "Закрытие…" : "Открытие…", "pending");
      runtime.run("reader");
      await runtime.wait(
        () => document.body.classList.contains("reader-active") !== active,
      );
      const opened = document.body.classList.contains("reader-active");
      view.status(
        opened ? "Открыто" : "Закрыто",
        opened ? "changed" : "same",
      );
      return opened;
    },
  };
  const controls = {
    disable(value) {
      [
        "sandbox-sample",
        "sandbox-local-file-open",
        "sandbox-local-file",
        "sandbox-cleanup",
        "sandbox-reader",
      ].forEach((id) => {
        const element = node.get(id);
        if (element) element.disabled = Boolean(value);
      });
    },
    async reader() {
      controls.disable(true);
      try {
        await reader.run();
      } catch (error) {
        view.status(error.message, "error");
      } finally {
        controls.disable(false);
      }
    },
    compare() {
      controls.disable(true);
      try {
        cleanup.toggle();
      } catch (error) {
        view.status(error.message, "error");
      } finally {
        controls.disable(false);
      }
    },
    async sample() {
      const select = node.get("sandbox-sample");
      if (!select?.value) {
        view.status("Вручную", "same");
        return false;
      }
      controls.disable(true);
      try {
        const entry = await fixture.load(select.value);
        view.status(`${entry.label}: загружен`, "same");
        return true;
      } catch (error) {
        view.status(`Fixture: ${error.message}`, "error");
        return false;
      } finally {
        controls.disable(false);
      }
    },
    async local(event) {
      try {
        const file = await local.load(event.currentTarget.files?.[0]);
        if (!file) return false;
        view.status(`${file.name}: локально`, "same");
        event.currentTarget.value = "";
        return true;
      } catch (error) {
        view.status(`Файл: ${error.message}`, "error");
        return false;
      }
    },
    async fixtures() {
      try {
        const entries = await fixture.sync();
        if (runtime.launcher()) {
          view.status(`Готово · ${entries.length}`, "same");
        }
        return entries;
      } catch (error) {
        view.status(
          `Fixtures: ${error.message}`,
          "error",
        );
        return [];
      }
    },
    bind() {
      node.get("sandbox-cleanup")?.addEventListener("click", controls.compare);
      node.get("sandbox-reader")?.addEventListener("click", controls.reader);
      node.get("sandbox-theme")?.addEventListener("click", theme.toggle);
      node.get("sandbox-sample")?.addEventListener("change", controls.sample);
      node.get("sandbox-local-file-open")?.addEventListener("click", () =>
        node.get("sandbox-local-file")?.click(),
      );
      node.get("sandbox-local-file")?.addEventListener("change", controls.local);
      return events.bind();
    },
  };
  view.controls();
  controls.bind();
  window.__ONLINER_SANDBOX__ = { cleanup, reader, sample: fixture };
  window.__ONLINER_SANDBOX_LAST_RESULT__ = null;
  view.status(
    runtime.launcher()
      ? "Готово"
      : "Launchpad не загружен",
    runtime.launcher() ? "same" : "error",
  );
  controls.fixtures();
})();
