export const sections = {
  people: { icon: "👫🏻", label: "Люди" },
  sport: { icon: "🏅", label: "Спорт" },
  money: { icon: "👛", label: "Кошель" },
  auto: { icon: "🚘", label: "Авто" },
  tech: { icon: "💻", label: "Течь" },
  realt: { icon: "🏙️", label: "Недвига" },
};

export const timezone = "Europe/Minsk";

export const editor = {
  button: (mode) => document.querySelector(`#content-${mode}`),
  html: () => {
    const button = editor.button("html");
    if (button) button.click();
    return button;
  },
  tmce: ({ beforeClick, click = false } = {}) => {
    const button = editor.button("tmce");
    if (!button) return null;
    if (
      typeof beforeClick === "function" &&
      button.dataset.editorTmceHook !== "1"
    ) {
      button.dataset.editorTmceHook = "1";
      button.addEventListener("click", () => beforeClick(), true);
    }
    if (click) button.click();
    return button;
  },
};

export const vpn = {
  ensure: async (message = "⚠️ VPN", timeout = 1500) => {
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
