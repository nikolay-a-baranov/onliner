export const sections = {
  people: { icon: "👫🏻", label: "Люди" },
  sport: { icon: "🏅", label: "Спорт" },
  money: { icon: "👛", label: "Кошель" },
  auto: { icon: "🚘", label: "Авто" },
  tech: { icon: "💻", label: "Течь" },
  realt: { icon: "🏙️", label: "Недвига" },
};

export const timezone = "Europe/Minsk";

export const editor = (() => {
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

export const vpn = {
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

export const debug = {
  cleanup: (() => {
    const marker =
      /(?:\n|^)\s*(?:<!--cleanup:[^>]+-->|<p>\[cleanup:[^\]]+\]<\/p>)\s*(?=\n|$)/g;
    return {
      stamp() {
        const date = new Date();
        const pad = (value) => String(value).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      },
      strip(value) {
        return value.replace(marker, "").replace(/\s+$/g, "");
      },
      append(value) {
        return `${this.strip(value)}\n\n<!--cleanup:${this.stamp()}-->`;
      },
    };
  })(),
};
