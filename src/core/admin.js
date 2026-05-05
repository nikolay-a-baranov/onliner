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
  return {
    html() {
      const target = button("html");
      if (target) target.click();
      return target;
    },
    tmce({ beforeClick, click = false } = {}) {
      const target = button("tmce");
      if (!target) return null;
      if (
        typeof beforeClick === "function" &&
        target.dataset.editorTmceHook !== "1"
      ) {
        target.dataset.editorTmceHook = "1";
        target.addEventListener("click", () => beforeClick(), true);
      }
      if (click) target.click();
      return target;
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
      /(?:\n|^)\s*(?:<!--cleanup-debug:[^>]+-->|<p>\[cleanup-debug:[^\]]+\]<\/p>)\s*(?=\n|$)/g;
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
        return `${this.strip(value)}\n\n<!--cleanup-debug:${this.stamp()}-->`;
      },
    };
  })(),
};
