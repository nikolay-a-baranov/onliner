const telegram = {
  username(value = "") {
    return String(value || "")
      .replace(/^@/, "")
      .trim();
  },
  user(value = "", text = "") {
    const username = telegram.username(value);
    if (!username) return "";
    const params = new URLSearchParams({ domain: username });
    if (text) params.set("text", text);
    return `tg://resolve?${params.toString()}`;
  },
  share(text = "") {
    if (!text) return "";
    const params = new URLSearchParams({ url: text });
    return `tg://msg_url?${params.toString()}`;
  },
  chat(value = "") {
    const string = String(value || "").trim();
    if (!/^-100\d+$/.test(string)) return "";
    return `tg://privatepost?channel=${string.slice(4)}&post=1`;
  },
  open: {
    url(value = "") {
      if (!value) return false;
      window.open(value, "_blank", "noopener,noreferrer");
      return true;
    },
    user(value = "", text = "") {
      return telegram.open.url(telegram.user(value, text));
    },
    share(text = "") {
      return telegram.open.url(telegram.share(text));
    },
    chat(value = "") {
      const url = telegram.chat(value);
      if (!url) return false;
      location.href = url;
      return true;
    },
  },
};

export { telegram };
