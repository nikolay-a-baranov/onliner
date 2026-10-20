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
      const options = [new Option("Manual input", "")].concat(
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
  const view = {
    status(message = "", state = "") {
      const element = node.text("sandbox-status", message);
      if (element) element.dataset.state = state;
      return element;
    },
    result(report = {}) {
      const output = node.get("sandbox-result");
      if (!output) return false;
      output.hidden = false;
      output.dataset.changed = report.diff.changed ? "true" : "false";
      node.text("sandbox-before", report.before);
      node.text("sandbox-after", report.after);
      node.text("sandbox-removed", report.diff.removed || "—");
      node.text("sandbox-added", report.diff.added || "—");
      node.text(
        "sandbox-summary",
        report.diff.changed
          ? report.diff.whitespaceOnly
            ? "HTML изменился только по отображаемым пробелам или переносам."
            : `HTML изменился. Первое расхождение: ${report.diff.start}.`
          : "Cleanup не изменил HTML.",
      );
      node.text(
        "sandbox-events",
        `События: input ${report.events.input}, change ${report.events.change}.`,
      );
      return true;
    },
  };
  const cleanup = {
    run() {
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
      window.__ONLINER_SANDBOX_LAST_RESULT__ = result;
      view.result(report);
      view.status(
        changed ? "Cleanup выполнен: HTML изменён." : "Cleanup выполнен: изменений нет.",
        changed ? "changed" : "same",
      );
      return result;
    },
  };
  const reader = {
    async run() {
      const active = document.body.classList.contains("reader-active");
      view.status(active ? "Reader закрывается…" : "Reader загружается…", "pending");
      runtime.run("reader");
      await runtime.wait(
        () => document.body.classList.contains("reader-active") !== active,
      );
      const opened = document.body.classList.contains("reader-active");
      view.status(
        opened
          ? "Production Reader открыт. Он может нормализовать widget-разметку."
          : "Production Reader закрыт.",
        opened ? "changed" : "same",
      );
      return opened;
    },
  };
  const controls = {
    disable(value) {
      ["sandbox-load-sample", "sandbox-cleanup", "sandbox-reader"].forEach((id) => {
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
    cleanup() {
      controls.disable(true);
      try {
        cleanup.run();
      } catch (error) {
        view.status(error.message, "error");
      } finally {
        controls.disable(false);
      }
    },
    async sample() {
      const select = node.get("sandbox-sample");
      if (!select?.value) {
        view.status("Manual input remains unchanged.", "same");
        return false;
      }
      controls.disable(true);
      try {
        const entry = await fixture.load(select.value);
        view.status(
          `Fixture “${entry.label}” loaded without running Cleanup.`,
          "same",
        );
        return true;
      } catch (error) {
        view.status(`Fixture was not loaded: ${error.message}`, "error");
        return false;
      } finally {
        controls.disable(false);
      }
    },
    async local(event) {
      try {
        const file = await local.load(event.currentTarget.files?.[0]);
        if (!file) return false;
        view.status(
          `Local file “${file.name}” loaded in this browser and not saved.`,
          "same",
        );
        return true;
      } catch (error) {
        view.status(`Local file was not loaded: ${error.message}`, "error");
        return false;
      }
    },
    async fixtures() {
      try {
        const entries = await fixture.sync();
        if (runtime.launcher()) {
          view.status(
            `Launchpad ready. ${entries.length} fixtures available; Reader loads only on explicit command.`,
            "same",
          );
        }
        return entries;
      } catch (error) {
        view.status(
          `Fixtures unavailable: ${error.message}. Manual paste and Cleanup remain available.`,
          "error",
        );
        return [];
      }
    },
    bind() {
      node.get("sandbox-cleanup")?.addEventListener("click", controls.cleanup);
      node.get("sandbox-reader")?.addEventListener("click", controls.reader);
      node.get("sandbox-load-sample")?.addEventListener("click", controls.sample);
      node.get("sandbox-local-file")?.addEventListener("change", controls.local);
      return events.bind();
    },
  };
  controls.bind();
  window.__ONLINER_SANDBOX__ = { cleanup, reader, sample: fixture };
  window.__ONLINER_SANDBOX_LAST_RESULT__ = null;
  view.status(
    runtime.launcher()
      ? "Launchpad готов. Reader загружается только по явной команде."
      : "Launchpad не загрузился: сначала соберите dist и проверьте URL.",
    runtime.launcher() ? "same" : "error",
  );
  controls.fixtures();
})();
