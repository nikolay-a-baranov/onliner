const timezone = "Europe/Minsk";
const sections = {
  people: { icon: "\u{1F46B}", label: "\u041B\u044E\u0434\u0438" },
  sport: { icon: "\u{1F3C5}", label: "\u0421\u043F\u043E\u0440\u0442" },
  money: { icon: "\u{1F45B}", label: "\u041A\u043E\u0448\u0435\u043B\u044C" },
  auto: { icon: "\u{1F698}", label: "\u0410\u0432\u0442\u043E" },
  tech: { icon: "\u{1F4BB}", label: "\u0422\u0435\u0447\u044C" },
  realt: { icon: "\u{1F3D9}\uFE0F", label: "\u041D\u0435\u0434\u0432\u0438\u0433\u0430" },
};
const editor = (() => {
  const button = (mode) => document.querySelector(`#content-${mode}`);
  const action = (selector, { beforeClick, click = false } = {}) => {
    const target = document.querySelector(selector);
    if (!target) return null;
    if (typeof beforeClick === "function") {
      const key = `${selector}:beforeClick`;
      const hooks = target._editorBeforeClickHooks || {};
      const list = hooks[key] || [];
      list.push(beforeClick);
      hooks[key] = list;
      target._editorBeforeClickHooks = hooks;
      if (!target.dataset.editorBeforeClickHook) {
        target.dataset.editorBeforeClickHook = "1";
        const runHooks = () => {
          const map = target._editorBeforeClickHooks || {};
          Object.values(map).forEach((items) => {
            items.forEach((run) => {
              if (typeof run === "function") run();
            });
          });
        };
        target.addEventListener("mousedown", runHooks, true);
        target.addEventListener("click", runHooks, true);
      }
    }
    if (click) target.click();
    return target;
  };
  return {
    html() {
      const target = button("html");
      if (target) target.click();
      return target;
    },
    tmce({ beforeClick, click = false } = {}) {
      const target = button("tmce");
      if (!target) return null;
      if (typeof beforeClick === "function") {
        const hooks = target._editorTmceBeforeClickHooks || [];
        hooks.push(beforeClick);
        target._editorTmceBeforeClickHooks = hooks;
        if (target.dataset.editorTmceHook !== "1") {
          target.dataset.editorTmceHook = "1";
          const runHooks = () => {
            const list = target._editorTmceBeforeClickHooks || [];
            list.forEach((run) => {
              if (typeof run === "function") run();
            });
          };
          target.addEventListener("mousedown", runHooks, true);
          target.addEventListener("click", runHooks, true);
        }
      }
      if (click) target.click();
      return target;
    },
    save(options) {
      return action("#save-post", options);
    },
    publish(options) {
      return action("#publish", options);
    },
  };
})();
const layout = {
  element() {
    return (
      document.querySelector("#layout_select") ||
      [...document.querySelectorAll("select")].find((element) =>
        [...element.options].some((option) => option.value === "longread"),
      )
    );
  },
  value(element = layout.element()) {
    return element?.value || "";
  },
  longread(value) {
    return /longread/i.test(String(value || ""));
  },
};
const vpn = {
  ensure: async (message = "🛑 VPN", timeout = 1500) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(
        `${location.origin}/wp-admin/admin-ajax.php`,
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        },
      );
      if (!response.ok) throw new Error(message);
    } catch {
      throw new Error(message);
    } finally {
      clearTimeout(timer);
    }
  },
};
const cms = {
  sections,
  timezone,
  editor,
  layout,
  vpn,
};

export { cms };
