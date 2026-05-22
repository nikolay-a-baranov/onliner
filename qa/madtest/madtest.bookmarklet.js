(() => {
  const pipe = (value, fns) => fns.reduce((state, fn) => fn(state), value);
  const madtest = {
    base: "https://madtest.ru",
    creds: {
      login: "PASTE_LOGIN_HERE",
      pass: "PASTE_PASSWORD_HERE",
    },
    run(mode = "auto") {
      this.consultant.watch();
      if (mode === "export") return this.current.run("export");
      if (mode === "sanitize") return this.current.run("sanitize");
      if (mode === "find") return this.find.run();
      const afterLogin = sessionStorage.getItem("madtest.afterLogin");
      if (afterLogin && location.pathname !== "/app/login") {
        sessionStorage.removeItem("madtest.afterLogin");
        return this.go(afterLogin);
      }
      if (location.pathname === "/app/login") return this.login.run();
      const route = this.route.get();
      if (route) return this.test.run(route);
      return this.go("/app/");
    },
    go(path) {
      location.href = new URL(path, this.base).href;
    },
    emit(el) {
      ["input", "change"].forEach((type) => el.dispatchEvent(new Event(type, { bubbles: true })));
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
    current: {
      run(mode) {
        const route = madtest.route.get();
        const page = route?.page;
        const handler = madtest.pages[page]?.[mode];
        if (!handler) {
          alert(`Madtest: для страницы "${page || location.pathname}" нет сценария "${mode}"`);
          return;
        }
        return handler.call(madtest.pages[page], route);
      },
    },
    login: {
      run() {
        const redirect = this.redirect();
        const login = document.querySelector("input[name='login'], input[name='email'], input[type='text']");
        const pass = document.querySelector("input[name='password'], input[type='password']");
        const form = login?.form || pass?.form || document.querySelector("form");
        if (!login || !pass || !form) {
          alert("Madtest: не нашёл форму логина");
          return;
        }
        login.value = madtest.creds.login;
        pass.value = madtest.creds.pass;
        madtest.emit(login);
        madtest.emit(pass);
        sessionStorage.setItem("madtest.afterLogin", redirect);
        form.requestSubmit ? form.requestSubmit() : form.submit();
      },
      redirect() {
        const redirect = new URL(location.href).searchParams.get("r");
        return redirect && redirect.startsWith("/") ? redirect : "/app/";
      },
    },
    consultant: {
      hide() {
        const css = "jdiv,iframe[src*='jivo'],iframe[src*='jivosite'],[class*='jivo'],[id*='jivo']{display:none!important;visibility:hidden!important;pointer-events:none!important}";
        if (!document.querySelector("#madtest-hide-consultant")) {
          document.head.insertAdjacentHTML("beforeend", `<style id="madtest-hide-consultant">${css}</style>`);
        }
        document.querySelectorAll("jdiv,iframe[src*='jivo'],iframe[src*='jivosite'],[class*='jivo'],[id*='jivo']").forEach((el) => el.remove());
      },
      watch() {
        this.hide();
        if (window.__madtestConsultantObserver) return;
        window.__madtestConsultantObserver = new MutationObserver(() => this.hide());
        window.__madtestConsultantObserver.observe(document.documentElement, {
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
      fields() {
        return [...document.querySelectorAll(this.selector)]
          .filter((el) => !el.disabled && !el.readOnly && this.visible(el))
          .map((el, index) => ({
            el,
            index: index + 1,
            name: el.name || el.placeholder || el.getAttribute("aria-label") || "",
            label: this.label(el),
            value: this.get(el),
          }))
          .filter((field) => field.value.trim());
      },
      get(el) {
        return el.isContentEditable ? el.innerText : el.value;
      },
      label(el) {
        const block = el.closest("label, ._spacer_margin_20_yzn1c_20, ._formGroup_ctv2j_1, ._contentBlock_vu34e_1");
        return block?.innerText?.split("\n")[0]?.trim() || "";
      },
      visible(el) {
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      },
    },
    write: {
      set(el, value) {
        const oldValue = madtest.read.get(el);
        if (oldValue === value) return false;
        if (el.isContentEditable) {
          el.innerText = value;
        } else {
          el.value = value;
        }
        madtest.emit(el);
        return true;
      },
    },
    text: {
      normalize(value) {
        const normalizeSpaces = (string) => string.replace(/\u00A0/g, " ").replace(/[ \t]+/g, " ");
        const normalizeYo = (string) => string.replace(/ё/g, "е").replace(/Ё/g, "Е");
        const normalizeEllipsis = (string) => string.replace(/\.{3}/g, "…");
        const normalizeDashes = (string) => string.replace(/\s*[-–—−]\s*/g, " — ");
        const normalizeQuotes = (string) => {
          let index = 0;
          return string.replace(/"/g, () => index++ % 2 ? "»" : "«");
        };
        const normalizeApostrophe = (string) => string.replace(/'/g, "’");
        const normalizeEdges = (string) => string.replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n").trim();
        return pipe(String(value || ""), [
          normalizeSpaces,
          normalizeYo,
          normalizeEllipsis,
          normalizeDashes,
          normalizeQuotes,
          normalizeApostrophe,
          normalizeEdges,
        ]);
      },
    },
    sanitize: {
      run() {
        const fields = madtest.read.fields();
        const changed = fields.filter((field) => madtest.write.set(field.el, madtest.text.normalize(field.value))).length;
        alert(`Madtest: найдено ${fields.length}, изменено ${changed}`);
      },
    },
    export: {
      current(route) {
        const fields = madtest.read.fields();
        const text = fields.map((field) => [
          `[Поле ${field.index}]`,
          field.label ? `[Метка] ${field.label}` : "",
          field.name ? `[Имя] ${field.name}` : "",
          "[Значение]",
          field.value,
        ].filter(Boolean).join("\n")).join("\n\n----------\n\n");
        return this.download(`${route?.testId || "unknown"}-${route?.page || "page"}.txt`, text);
      },
      download(name, text) {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
        link.download = name;
        link.click();
        URL.revokeObjectURL(link.href);
      },
    },
    pages: {
      main: {
        export(route) {
          return madtest.export.current(route);
        },
        sanitize() {
          return madtest.sanitize.run();
        },
      },
      questions: {
        export(route) {
          return madtest.export.current(route);
        },
        sanitize() {
          return madtest.sanitize.run();
        },
      },
      results: {
        export(route) {
          return madtest.export.current(route);
        },
        sanitize() {
          return madtest.sanitize.run();
        },
      },
      preview: {
        export(route) {
          const text = [
            "[Ссылка]",
            madtest.preview.link(),
            "",
            "[Embed]",
            madtest.preview.embed(),
          ].join("\n");
          return madtest.export.download(`${route.testId}-preview.txt`, text);
        },
        sanitize() {
          alert("Madtest: на preview пока нечего чистить");
        },
      },
    },
    preview: {
      link() {
        return [...document.querySelectorAll("a, div")]
          .map((el) => el.href || el.innerText)
          .find((value) => value?.includes("madte.st")) || "";
      },
      embed() {
        return [...document.querySelectorAll("script, .madtest")]
          .map((el) => el.outerHTML)
          .filter((value) => value.includes("madte.st") || value.includes("madtest"))
          .join("\n");
      },
    },
    tests: {
      list() {
        return [...document.querySelectorAll('a[href*="/app/tests/view/"][href$="/stat"]')]
          .map((link) => {
            const id = link.getAttribute("href")?.match(/\/app\/tests\/view\/(\d+)\/stat/)?.[1];
            const card = link.closest("._testCard_ptt32_1");
            const title = card?.querySelector("span")?.innerText?.trim() || "";
            return id ? { id, title } : null;
          })
          .filter(Boolean);
      },
    },
    find: {
      async run() {
        const value = prompt("Madtest public id или ссылка madte.st:");
        if (!value) return;
        const needle = this.clean(value);
        const tests = madtest.tests.list();
        for (const test of tests) {
          const html = await fetch(`/app/tests/${test.id}/preview`, { credentials: "include" }).then((response) => response.text());
          if (!html.includes(needle)) continue;
          const url = `${madtest.base}/app/tests/${test.id}/main`;
          console.log("Madtest found:", { needle, ...test, url });
          prompt("Нашёл ссылку на редактирование:", url);
          return;
        }
        alert(`Madtest: не нашёл ${needle} среди ${tests.length} тестов на странице`);
      },
      clean(value) {
        return String(value).trim().replace(/^.*madte\.st\//, "").split(/[/?#]/)[0];
      },
    },
    test: {
      run(route) {
        alert(`Madtest: страница ${route.page}, тест ${route.testId}`);
      },
    },
  };
  window.madtest = madtest;
  madtest.run(window.__madtestMode || "auto");
})();
