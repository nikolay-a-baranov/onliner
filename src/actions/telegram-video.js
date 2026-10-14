const telegramVideo = {
  message: "onliner:telegram-video",
  post(value = "") {
    let url;
    try {
      url = new URL(String(value || "").trim());
    } catch {
      throw new Error("Нужна полная ссылка на публичный пост Telegram.");
    }
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || !["t.me", "telegram.me"].includes(host)) {
      throw new Error("Поддерживается ссылка вида https://t.me/channel/123.");
    }
    if (/^\/(?:c|joinchat)\/|^\/\+/i.test(url.pathname)) {
      throw new Error("Приватные и служебные ссылки Telegram не поддерживаются.");
    }
    const match = url.pathname.match(/^\/([a-z0-9_]{5,32})\/([1-9]\d*)\/?$/i);
    if (!match || match[1].toLowerCase() === "share") {
      throw new Error("Поддерживается ссылка вида https://t.me/channel/123.");
    }
    return `https://t.me/${match[1]}/${match[2]}?embed=1`;
  },
  media(value = "") {
    let url;
    try {
      url = new URL(String(value || ""));
    } catch {
      return "";
    }
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || !/(^|\.)telesco\.pe$/.test(host)) return "";
    if (!/\.mp4$/i.test(url.pathname)) return "";
    return url.href;
  },
  parse(value = "") {
    const page = new DOMParser().parseFromString(String(value || ""), "text/html");
    return telegramVideo.sources(page);
  },
  sources(root = document) {
    const sources = [
      ...root.querySelectorAll(".tgme_widget_message_video_player video[src]"),
    ]
      .map((element) => telegramVideo.media(element.getAttribute("src")))
      .filter(Boolean);
    return [...new Set(sources)];
  },
  id() {
    const values = new Uint32Array(4);
    crypto.getRandomValues(values);
    return [...values].map((value) => value.toString(16).padStart(8, "0")).join("");
  },
  origin(value = "") {
    try {
      const url = new URL(String(value || ""));
      const host = url.hostname.toLowerCase();
      if (url.protocol !== "https:") return "";
      if (host !== "onliner.by" && !host.endsWith(".onliner.by")) return "";
      return url.origin;
    } catch {
      return "";
    }
  },
  handoff(post = "", id = "", origin = "") {
    const url = new URL(post);
    const params = new URLSearchParams({
      "onliner-video-id": id,
      "onliner-video-origin": origin,
    });
    url.hash = params.toString();
    return url.href;
  },
  transfer(value = location.href) {
    const url = new URL(value);
    const params = new URLSearchParams(url.hash.slice(1));
    const id = params.get("onliner-video-id") || "";
    const origin = telegramVideo.origin(params.get("onliner-video-origin") || "");
    return /^[a-f0-9]{32}$/.test(id) && origin ? { id, origin } : null;
  },
  escape(value = "") {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  },
  html(value = "") {
    const source = telegramVideo.escape(value);
    return `<video controls playsinline preload="metadata" style="display:block;width:100%;max-width:700px;height:auto;"><source src="${source}" type="video/mp4"></video>`;
  },
};

export const createTelegramVideo = (api) => {
  const selection = {
    capture() {
      if (api.editor.visual()) {
        const editor = api.editor.tiny();
        const bookmark = editor?.selection?.getBookmark?.(2, true) || null;
        return editor && bookmark ? { mode: "visual", editor, bookmark } : null;
      }
      const element = api.editor.textarea();
      if (!element) return null;
      const start = element.selectionStart ?? 0;
      const end = element.selectionEnd ?? start;
      return { mode: "html", element, start, end };
    },
    restore(state = null) {
      if (!state) return false;
      if (state.mode === "visual") {
        try {
          state.editor.selection.moveToBookmark(state.bookmark);
          state.editor.focus?.();
          return true;
        } catch {
          return false;
        }
      }
      const size = String(state.element?.value || "").length;
      const start = Math.max(0, Math.min(state.start, size));
      const end = Math.max(start, Math.min(state.end, size));
      state.element?.focus?.();
      state.element?.setSelectionRange?.(start, end);
      return true;
    },
  };
  const insert = {
    visual(state, value) {
      const editor = state?.editor;
      if (!editor || !selection.restore(state)) return false;
      const run = () => {
        editor.selection?.collapse?.(false);
        editor.execCommand("mceInsertContent", false, value);
      };
      if (editor.undoManager?.transact) editor.undoManager.transact(run);
      else run();
      editor.focus?.();
      editor.save?.();
      return true;
    },
    html(state, value) {
      const element = state?.element;
      if (!element || !selection.restore(state)) return false;
      const source = String(element.value || "");
      const point = Math.max(0, Math.min(state.end, source.length));
      const before = api.undo.capture(element);
      if (!before) return false;
      api.set(element, source.slice(0, point) + value + source.slice(point));
      api.select(element, point + value.length);
      api.emit(element);
      element.focus?.();
      api.undo.commit(element, before);
      return true;
    },
    run(state, value) {
      return state?.mode === "visual"
        ? insert.visual(state, value)
        : insert.html(state, value);
    },
  };
  const operation = {
    current: null,
    clear(restore = false) {
      const current = operation.current;
      if (!current) return false;
      window.removeEventListener("message", operation.receive);
      window.clearTimeout(current.timer);
      operation.current = null;
      if (restore) selection.restore(current.saved);
      return true;
    },
    fail(message = "") {
      operation.clear(true);
      alert(message);
      return false;
    },
    finish(source = "") {
      const current = operation.current;
      if (!current) return false;
      const saved = current.saved;
      operation.clear(false);
      if (insert.run(saved, telegramVideo.html(source))) return true;
      selection.restore(saved);
      alert("Не удалось вставить видео в сохранённую позицию редактора.");
      return false;
    },
    receive(event) {
      const current = operation.current;
      if (!current) return;
      if (event.origin !== "https://t.me") return;
      if (event.source !== current.popup) return;
      const data = event.data;
      if (!data || data.type !== telegramVideo.message || data.id !== current.id) {
        return;
      }
      if (data.error) {
        operation.fail(`Не удалось извлечь видео из Telegram: ${data.error}`);
        return;
      }
      const source = telegramVideo.media(data.source);
      if (!source) {
        operation.fail("Telegram вернул неподдерживаемый адрес MP4-видео.");
        return;
      }
      operation.finish(source);
    },
    open(saved, popup, id) {
      const timer = window.setTimeout(() => {
        operation.fail("Ожидание извлечения Telegram-видео завершено.");
      }, 300000);
      operation.current = { saved, popup, id, timer };
      window.addEventListener("message", operation.receive);
      return true;
    },
    paste() {
      const current = operation.current;
      if (!current) return false;
      const value = prompt("Вставьте скопированный MP4 URL из Telegram");
      if (value === null || !String(value).trim()) {
        operation.clear(true);
        return false;
      }
      const source = telegramVideo.media(value);
      if (!source) {
        alert("Нужен HTTPS MP4 URL с Telegram CDN telesco.pe.");
        selection.restore(current.saved);
        return false;
      }
      return operation.finish(source);
    },
  };
  const transfer = {
    send(data = {}) {
      const current = telegramVideo.transfer();
      if (!current) return false;
      const opener = window.opener;
      if (!opener || opener.closed) return false;
      opener.postMessage(
        { type: telegramVideo.message, id: current.id, ...data },
        current.origin,
      );
      return true;
    },
    async copy(source = "") {
      try {
        await navigator.clipboard.writeText(source);
        alert("MP4 URL скопирован. Вернитесь в редактор и снова нажмите «Видео из Telegram».");
        return true;
      } catch {
        prompt("Скопируйте MP4 URL, вернитесь в редактор и снова нажмите «Видео из Telegram»", source);
        return false;
      }
    },
  };
  const video = {
    run() {
      if (operation.current) return operation.paste();
      const saved = selection.capture();
      if (!saved) {
        alert("Не найден поддерживаемый редактор или позиция вставки.");
        return false;
      }
      const value = prompt("Ссылка на публичный пост Telegram");
      if (value === null || !String(value).trim()) {
        selection.restore(saved);
        return false;
      }
      try {
        const post = telegramVideo.post(value);
        const id = telegramVideo.id();
        const target = telegramVideo.handoff(post, id, location.origin);
        const popup = window.open(target, "_blank");
        if (!popup) throw new Error("Браузер заблокировал новое окно Telegram.");
        operation.open(saved, popup, id);
        alert("На странице Telegram запустите bookmarklet и нажмите «Передать видео».");
        return true;
      } catch (error) {
        alert(`Не удалось открыть Telegram: ${error.message}`);
        selection.restore(saved);
        return false;
      }
    },
    async extract() {
      const current = telegramVideo.transfer();
      if (!current) {
        alert("Откройте Telegram-пост командой из редактора Onliner.");
        return false;
      }
      const sources = telegramVideo.sources(document);
      if (!sources.length) {
        transfer.send({ error: "В посте не найдено основное MP4-видео." });
        alert("В посте не найдено основное MP4-видео.");
        return false;
      }
      if (sources.length > 1) {
        transfer.send({ error: "В посте найдено несколько видео; выбор пока не поддерживается." });
        alert("В посте найдено несколько видео; выбор пока не поддерживается.");
        return false;
      }
      if (transfer.send({ source: sources[0] })) {
        alert("Видео передано в редактор Onliner.");
        window.close();
        return true;
      }
      return transfer.copy(sources[0]);
    },
  };
  return { telegramVideo: video };
};

export { telegramVideo };
