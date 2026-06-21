const currentScript = document.currentScript;
const currentPath = String(currentScript?.src || "");
const currentName = currentPath.match(/\/([^/?#]+)\.js(?:[?#]|$)/i)?.[1] || "";
window.__madtestMode =
  {
    "madtest-find": "find",
    "madtest-export": "export",
    "madtest-cleanup": "sanitize",
    "madtest-editor": "editor",
  }[currentName] || "auto";

(() => {
  const setter = {
    input: Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set,
    textarea: Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set,
    set(element, value) {
      if (!element) return false;
      if (element.isContentEditable) {
        element.innerText = value;
        return true;
      }
      const set =
        element.tagName === "TEXTAREA" ? setter.textarea : setter.input;
      if (set) {
        set.call(element, value);
        return true;
      }
      element.value = value;
      return true;
    },
  };
  const pipe = (value, fns) => fns.reduce((state, fn) => fn(state), value);
  const existing = window.madtest;
  if (existing?.state?.consultantObserver) {
    existing.state.consultantObserver.disconnect();
  }
  const madtest = {
    base: "https://madtest.ru",
    creds: {
      key: {
        login: `cred:${location.hostname}:madtest:login`,
        pass: `cred:${location.hostname}:madtest:pass`,
      },
      defaults: {
        login: "ng@onliner.by",
      },
      get(name) {
        const key = this.key[name];
        const value = key ? localStorage.getItem(key) : "";
        return String(value || "").trim();
      },
      set(name, value) {
        const key = this.key[name];
        if (!key) return;
        const next = String(value || "").trim();
        if (!next) {
          localStorage.removeItem(key);
          return;
        }
        localStorage.setItem(key, next);
      },
      ensure(name, label) {
        const saved = this.get(name);
        if (saved) return saved;
        if (name === "login" && this.defaults.login) {
          this.set(name, this.defaults.login);
          return this.defaults.login;
        }
        const value = prompt(label, this.defaults[name] || "");
        if (!value) throw new Error(`Madtest: ${label}`);
        this.set(name, value);
        return value.trim();
      },
      clear() {
        localStorage.removeItem(this.key.login);
        localStorage.removeItem(this.key.pass);
      },
    },
    state: {
      consultantObserver: null,
      sanitizeKey: "madtest.sanitize.step",
      findOverlayId: "madtest-find-overlay",
    },
    notice: {
      ensure() {
        const id = madtest.state.findOverlayId;
        let node = document.getElementById(id);
        if (node) return node;
        node = document.createElement("div");
        node.id = id;
        node.style.cssText = [
          "position:fixed",
          "right:24px",
          "top:24px",
          "z-index:2147483647",
          "display:none",
          "pointer-events:none",
        ].join(";");
        node.innerHTML =
          '<div style="display:inline-flex;align-items:center;gap:10px;background:rgba(32,35,41,.92);backdrop-filter:blur(10px);color:#fff;padding:9px 14px;border-radius:999px;box-shadow:0 10px 28px rgba(0,0,0,.34);font:600 13px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;white-space:nowrap"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#6ee7b7;box-shadow:0 0 0 5px rgba(110,231,183,.22)"></span><span data-find-text></span></div>';
        document.body.appendChild(node);
        return node;
      },
      show(text) {
        const node = this.ensure();
        const box = node.querySelector("[data-find-text]");
        if (!box) return;
        box.textContent = String(text || "");
        node.style.display = "block";
      },
      hide() {
        const node = document.getElementById(madtest.state.findOverlayId);
        if (!node) return;
        node.style.display = "none";
      },
    },
    run(mode = "auto") {
      this.consultant.watch();
      if (mode === "auto" && this.find.scan.active())
        return this.find.scan.step();
      if (mode === "export") return this.current.run("export");
      if (mode === "sanitize") return this.current.run("sanitize");
      if (mode === "editor") return this.editor.run();
      if (mode === "find") return this.find.run(this.find.queued());
      const queuedNeedle = this.find.queued();
      if (queuedNeedle) return this.find.run(queuedNeedle);
      const afterLogin = sessionStorage.getItem("madtest.afterLogin");
      if (afterLogin && location.pathname !== "/app/login") {
        sessionStorage.removeItem("madtest.afterLogin");
        return this.go(afterLogin);
      }
      if (location.pathname === "/app/login") return this.login.run();
      if (location.pathname.startsWith("/app/tests/"))
        return this.current.run("auto");
      if (location.pathname === "/app" || location.pathname === "/app/")
        return this.app.run();
      return this.go("/app/");
    },
    go(path) {
      location.href = new URL(path, this.base).href;
    },
    emit(element) {
      ["input", "change"].forEach((type) =>
        element.dispatchEvent(new Event(type, { bubbles: true })),
      );
    },
    wait(getter, limit = 10000, step = 120) {
      return new Promise((resolve, reject) => {
        const started = Date.now();
        const timer = setInterval(() => {
          const value = getter();
          if (value) {
            clearInterval(timer);
            resolve(value);
          }
          if (Date.now() - started > limit) {
            clearInterval(timer);
            reject(new Error("wait timeout"));
          }
        }, step);
      });
    },
    route: {
      get() {
        const match = location.pathname.match(/^\/app\/tests\/(\d+)\/([^/]+)/);
        if (!match) return null;
        return {
          testId: match[1],
          page: match[2],
        };
      },
    },
    app: {
      run() {},
    },
    current: {
      run(mode) {
        const route = madtest.route.get();
        const page = route?.page;
        const handler = madtest.pages[page]?.[mode];
        if (!handler) {
          if (mode === "auto") return;
          alert(
            `Madtest: для страницы "${page || location.pathname}" нет сценария "${mode}"`,
          );
          return;
        }
        return handler.call(madtest.pages[page], route);
      },
    },
    login: {
      run() {
        const redirect = this.redirect();
        let loginValue = "";
        let passValue = "";
        try {
          loginValue = madtest.creds.ensure("login", "Madtest login");
          passValue = madtest.creds.ensure("pass", "Madtest password");
        } catch {
          return;
        }
        const login = document.querySelector(
          "input[name='login'],input[name='email'],input[type='text']",
        );
        const pass = document.querySelector(
          "input[name='password'],input[type='password']",
        );
        const form =
          login?.form || pass?.form || document.querySelector("form");
        if (!login || !pass || !form) {
          alert("Madtest: не нашел форму логина");
          return;
        }
        setter.set(login, loginValue);
        setter.set(pass, passValue);
        madtest.emit(login);
        madtest.emit(pass);
        sessionStorage.setItem("madtest.afterLogin", redirect);
        if (form.requestSubmit) form.requestSubmit();
        else form.submit();
      },
      redirect() {
        const redirect = new URL(location.href).searchParams.get("r");
        return redirect && redirect.startsWith("/") ? redirect : "/app/";
      },
    },
    consultant: {
      selector:
        "jdiv,iframe[src*='jivo'],iframe[src*='jivosite'],[class*='jivo'],[id*='jivo'],#jivo-iframe-container",
      css() {
        return `${madtest.consultant.selector}{display:none!important;visibility:hidden!important;pointer-events:none!important}`;
      },
      hide() {
        if (!document.querySelector("#madtest-hide-consultant")) {
          document.head.insertAdjacentHTML(
            "beforeend",
            `<style id="madtest-hide-consultant">${madtest.consultant.css()}</style>`,
          );
        }
        document
          .querySelectorAll(madtest.consultant.selector)
          .forEach((element) => element.remove());
      },
      watch() {
        this.hide();
        if (madtest.state.consultantObserver) return;
        madtest.state.consultantObserver = new MutationObserver(() =>
          this.hide(),
        );
        madtest.state.consultantObserver.observe(document.documentElement, {
          childList: true,
          subtree: true,
        });
      },
    },
    read: {
      selector: [
        "input:not([type])",
        "input[type='text']",
        "input[type='url']",
        "textarea",
        "[contenteditable='true']",
      ].join(","),
      visible(element) {
        return !!(
          element.offsetWidth ||
          element.offsetHeight ||
          element.getClientRects().length
        );
      },
      editable(element) {
        if (element.matches("[disabled]")) return false;
        if (element.matches("[readonly]")) return false;
        return true;
      },
      get(element) {
        return element.isContentEditable ? element.innerText : element.value;
      },
      label(element) {
        const block = element.closest(
          "label,._formGroup_ctv2j_1,._contentBlock_vu34e_1,._spacer_margin_20_yzn1c_20",
        );
        return block?.innerText?.split("\n")?.[0]?.trim() || "";
      },
      fields() {
        return [...document.querySelectorAll(this.selector)]
          .filter((element) => this.visible(element))
          .filter((element) => this.editable(element))
          .map((element, index) => ({
            el: element,
            index: index + 1,
            name:
              element.name ||
              element.placeholder ||
              element.getAttribute("aria-label") ||
              "",
            label: this.label(element),
            value: this.get(element),
          }));
      },
    },
    write: {
      set(element, value) {
        const prev = madtest.read.get(element);
        if (prev === value) return false;
        setter.set(element, value);
        madtest.emit(element);
        return true;
      },
    },
    text: {
      normalize(value) {
        const clean = String(value || "");
        const spaces = (string) =>
          string.replace(/\u00A0/g, " ").replace(/[ \t]+/g, " ");
        const yo = (string) => string.replace(/ё/g, "е").replace(/Ё/g, "Е");
        const dots = (string) => string.replace(/\.{3}/g, "…");
        const dashes = (string) => string.replace(/\s*[-–—−]\s*/g, " — ");
        const quotes = (string) => {
          let index = 0;
          return string.replace(/"/g, () => (index++ % 2 ? "»" : "«"));
        };
        const apostrophe = (string) => string.replace(/'/g, "’");
        const lines = (string) =>
          string
            .replace(/[ \t]+\n/g, "\n")
            .replace(/\n[ \t]+/g, "\n")
            .trim();
        return pipe(clean, [
          spaces,
          yo,
          dots,
          dashes,
          quotes,
          apostrophe,
          lines,
        ]);
      },
    },
    sanitize: {
      queue(fields) {
        return fields.filter((field) => String(field.value || "").trim());
      },
      routeKey() {
        const route = madtest.route.get();
        if (!route) return location.pathname;
        return `${route.testId}:${route.page}`;
      },
      stepRead() {
        const key = `${madtest.state.sanitizeKey}:${this.routeKey()}`;
        const value = Number(sessionStorage.getItem(key) || 0);
        return Number.isFinite(value) && value >= 0 ? value : 0;
      },
      stepWrite(value) {
        const key = `${madtest.state.sanitizeKey}:${this.routeKey()}`;
        sessionStorage.setItem(key, String(value));
      },
      fields(fields) {
        const changed = fields.filter((field) =>
          madtest.write.set(field.el, madtest.text.normalize(field.value)),
        ).length;
        return { total: fields.length, changed };
      },
      run() {
        const fields = this.queue(madtest.read.fields());
        if (!fields.length) {
          alert("Madtest: нет полей для пошаговой очистки");
          return { total: 0, changed: 0, step: 0 };
        }
        const step = this.stepRead();
        const index = step >= fields.length ? 0 : step;
        const field = fields[index];
        const changed = madtest.write.set(
          field.el,
          madtest.text.normalize(field.value),
        )
          ? 1
          : 0;
        const next = index + 1 >= fields.length ? 0 : index + 1;
        this.stepWrite(next);
        field.el.scrollIntoView({ block: "center" });
        field.el.focus();
        alert(
          `Madtest: шаг ${index + 1}/${fields.length}, изменено ${changed}`,
        );
        return { total: fields.length, changed, step: index + 1 };
      },
    },
    editor: {
      styleId: "madtest-editor-style",
      style() {
        return "[data-madtest-editor='true']{outline:2px solid #f05f50!important;outline-offset:2px}";
      },
      mount() {
        if (document.getElementById(this.styleId)) return;
        const style = document.createElement("style");
        style.id = this.styleId;
        style.textContent = this.style();
        document.head.appendChild(style);
      },
      mark(fields) {
        document
          .querySelectorAll("[data-madtest-editor='true']")
          .forEach((element) => element.removeAttribute("data-madtest-editor"));
        fields.forEach((field) =>
          field.el.setAttribute("data-madtest-editor", "true"),
        );
      },
      run() {
        const fields = madtest.read.fields();
        if (!fields.length) {
          alert("Madtest: не нашел видимых редактируемых полей");
          return;
        }
        this.mount();
        this.mark(fields);
        fields[0].el.focus();
        fields[0].el.scrollIntoView({ block: "center" });
        alert(`Madtest: подсветил полей ${fields.length}`);
      },
    },
    export: {
      build(fields) {
        return fields
          .map((field) =>
            [
              `[Поле ${field.index}]`,
              field.label ? `[Метка] ${field.label}` : "",
              field.name ? `[Имя] ${field.name}` : "",
              "[Значение]",
              field.value,
            ]
              .filter(Boolean)
              .join("\n"),
          )
          .join("\n\n----------\n\n");
      },
      current(route) {
        const fields = madtest.read.fields();
        const text = this.build(fields);
        const name = `${route?.testId || "unknown"}-${route?.page || "page"}.txt`;
        this.download(name, text);
        return { total: fields.length };
      },
      download(name, text) {
        const link = document.createElement("a");
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        link.href = URL.createObjectURL(blob);
        link.download = name;
        link.click();
        URL.revokeObjectURL(link.href);
      },
    },
    list: {
      selectors: {
        questions:
          "[data-rbd-draggable-id^='questions['] ._menuItem_8hkty_1,[data-rbd-draggable-id^='questions[']",
        results:
          "[data-rbd-draggable-id^='results['] ._menuItem_8hkty_1,[data-rbd-draggable-id^='results[']",
      },
      items(kind) {
        const selector = this.selectors[kind];
        if (!selector) return [];
        return [...document.querySelectorAll(selector)].filter((element) =>
          madtest.read.visible(element),
        );
      },
      key() {
        return madtest.read
          .fields()
          .map((field) => field.name || field.label || field.value.slice(0, 40))
          .join("|");
      },
      async step(item) {
        const before = this.key();
        item.click();
        await madtest
          .wait(() => {
            const after = this.key();
            return after && after !== before;
          }, 4000)
          .catch(() => null);
      },
      async run(kind, action) {
        const items = this.items(kind);
        if (items.length < 2) return null;
        const pages = [];
        for (let index = 0; index < items.length; index += 1) {
          const item = this.items(kind)[index];
          if (!item) continue;
          await this.step(item);
          pages.push(action(index + 1));
        }
        return pages;
      },
    },
    pages: {
      main: {
        auto() {},
        export(route) {
          return madtest.export.current(route);
        },
        sanitize() {
          return madtest.sanitize.run();
        },
      },
      questions: {
        auto() {},
        async export(route) {
          const pages = await madtest.list.run("questions", (index) => {
            const fields = madtest.read.fields();
            return { index, fields };
          });
          if (!pages) return madtest.export.current(route);
          const text = pages
            .map((page) =>
              [
                `[Элемент ${page.index}]`,
                madtest.export.build(page.fields),
              ].join("\n"),
            )
            .join("\n\n==========\n\n");
          madtest.export.download(`${route.testId}-questions.txt`, text);
          return { total: pages.length };
        },
        async sanitize() {
          const pages = await madtest.list.run("questions", () =>
            madtest.sanitize.fields(madtest.read.fields()),
          );
          if (!pages) return madtest.sanitize.run();
          const total = pages.reduce((sum, page) => sum + page.total, 0);
          const changed = pages.reduce((sum, page) => sum + page.changed, 0);
          alert(
            `Madtest: найдено ${total}, изменено ${changed}, карточек ${pages.length}`,
          );
          return { total, changed };
        },
      },
      results: {
        auto() {},
        async export(route) {
          const pages = await madtest.list.run("results", (index) => {
            const fields = madtest.read.fields();
            return { index, fields };
          });
          if (!pages) return madtest.export.current(route);
          const text = pages
            .map((page) =>
              [
                `[Элемент ${page.index}]`,
                madtest.export.build(page.fields),
              ].join("\n"),
            )
            .join("\n\n==========\n\n");
          madtest.export.download(`${route.testId}-results.txt`, text);
          return { total: pages.length };
        },
        async sanitize() {
          const pages = await madtest.list.run("results", () =>
            madtest.sanitize.fields(madtest.read.fields()),
          );
          if (!pages) return madtest.sanitize.run();
          const total = pages.reduce((sum, page) => sum + page.total, 0);
          const changed = pages.reduce((sum, page) => sum + page.changed, 0);
          alert(
            `Madtest: найдено ${total}, изменено ${changed}, карточек ${pages.length}`,
          );
          return { total, changed };
        },
      },
      preview: {
        auto() {},
        export(route) {
          const text = [
            "[Ссылка]",
            madtest.preview.link(),
            "",
            "[Embed]",
            madtest.preview.embed(),
          ].join("\n");
          madtest.export.download(`${route.testId}-preview.txt`, text);
        },
        sanitize() {
          alert("Madtest: на preview нечего чистить");
        },
      },
    },
    preview: {
      link() {
        return (
          [...document.querySelectorAll("a[href*='madte.st']")]
            .map((element) => element.href)
            .find(Boolean) ||
          [...document.querySelectorAll(".madtest[data-id]")]
            .map((element) => element.getAttribute("data-id"))
            .filter(Boolean)
            .map((id) => `https://madte.st/${id}`)[0] ||
          ""
        );
      },
      embed() {
        const box = document.querySelector("._codeBlock__text_1sv8m_7");
        if (box?.innerText) return box.innerText;
        return [...document.querySelectorAll("script,.madtest")]
          .map((element) => element.outerHTML)
          .filter(
            (value) => value.includes("madte.st") || value.includes("Madtest"),
          )
          .join("\n");
      },
    },
    tests: {
      list() {
        return [
          ...document.querySelectorAll(
            'a[href*="/app/tests/view/"][href$="/stat"]',
          ),
        ]
          .map((link) => {
            const id = link
              .getAttribute("href")
              ?.match(/\/app\/tests\/view\/(\d+)\/stat/)?.[1];
            const card = link.closest("._testCard_ptt32_1");
            const title = card?.querySelector("span")?.innerText?.trim() || "";
            return id ? { id, title } : null;
          })
          .filter(Boolean);
      },
    },
    find: {
      scan: {
        key: "madtest.find.scan",
        active() {
          return Boolean(sessionStorage.getItem(this.key));
        },
        read() {
          try {
            return JSON.parse(sessionStorage.getItem(this.key) || "{}");
          } catch {
            return {};
          }
        },
        write(value) {
          sessionStorage.setItem(this.key, JSON.stringify(value));
        },
        clear() {
          sessionStorage.removeItem(this.key);
        },
        start(needle, tests) {
          const ordered = [...tests].reverse();
          this.write({
            needle,
            ids: ordered.map((item) => item.id),
            index: 0,
          });
          madtest.notice.show(`🔎 1/${ordered.length}`);
          madtest.go(`/app/tests/${ordered[0].id}/preview`);
        },
        step() {
          const state = this.read();
          const ids = Array.isArray(state.ids) ? state.ids : [];
          if (!state.needle || !ids.length) {
            this.clear();
            return;
          }
          const route = madtest.route.get();
          if (!route || route.page !== "preview") return;
          const current = ids[state.index] || "";
          if (route.testId !== current) {
            madtest.notice.show(`🔎 ${state.index + 1}/${ids.length}`);
            madtest.go(`/app/tests/${current}/preview`);
            return;
          }
          madtest.notice.show(`🔎 ${state.index + 1}/${ids.length}`);
          const html = document.documentElement?.innerHTML || "";
          if (html.includes(state.needle)) {
            const target = `${madtest.base}/app/tests/${route.testId}/main`;
            this.clear();
            madtest.notice.hide();
            prompt("Нашел ссылку на редактирование:", target);
            madtest.go(`/app/tests/${route.testId}/main`);
            return;
          }
          const next = state.index + 1;
          if (next >= ids.length) {
            this.clear();
            madtest.notice.hide();
            alert(
              `Madtest: не нашел ${state.needle} после обхода ${ids.length} тестов`,
            );
            madtest.go("/app/");
            return;
          }
          this.write({ ...state, index: next });
          madtest.go(`/app/tests/${ids[next]}/preview`);
        },
      },
      queued() {
        const url = new URL(location.href);
        const query = url.searchParams.get("madtest-find");
        const hash = (
          location.hash.match(/madtest-find=([^&]+)/)?.[1] || ""
        ).trim();
        const value = query || decodeURIComponent(hash || "");
        if (!value) return "";
        url.searchParams.delete("madtest-find");
        if (query)
          history.replaceState(
            null,
            "",
            `${url.pathname}${url.search}${location.hash}`,
          );
        if (hash)
          history.replaceState(
            null,
            "",
            `${location.pathname}${location.search}`,
          );
        return this.clean(value);
      },
      clean(value) {
        return String(value)
          .trim()
          .replace(/^.*madte\.st\//, "")
          .split(/[/?#]/)[0];
      },
      async run(seed = "") {
        if (!location.pathname.startsWith("/app")) {
          alert("Madtest: режим find запускайте на /app");
          return;
        }
        const value = seed || prompt("Madtest public id или ссылка madte.st:");
        if (!value) return;
        const needle = this.clean(value);
        madtest.notice.show("🔎 …");
        let tests = madtest.tests.list();
        if (!tests.length && location.pathname === "/app") {
          await madtest
            .wait(() => {
              tests = madtest.tests.list();
              return tests.length;
            }, 10000)
            .catch(() => null);
        }
        if (!tests.length) {
          madtest.notice.hide();
          alert("Madtest: не нашел карточки тестов на странице");
          return;
        }
        const ordered = [...tests].reverse();
        for (let index = 0; index < ordered.length; index += 1) {
          const test = ordered[index];
          madtest.notice.show(`🔎 ${index + 1}/${ordered.length}`);
          const html = await fetch(`/app/tests/${test.id}/preview`, {
            credentials: "include",
          }).then((response) => response.text());
          if (!html.includes(needle)) continue;
          const url = `${madtest.base}/app/tests/${test.id}/main`;
          console.log("Madtest found:", { needle, ...test, url });
          prompt("Нашел ссылку на редактирование:", url);
          madtest.notice.hide();
          madtest.go(`/app/tests/${test.id}/main`);
          return;
        }
        this.scan.start(needle, ordered);
      },
    },
  };
  window.madtest = madtest;
  madtest.run(window.__madtestMode || "auto");
})();
