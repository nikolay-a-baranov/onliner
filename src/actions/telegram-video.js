const telegramVideo = {
  media(value = "") {
    let url;
    try {
      url = new URL(String(value || "").trim());
    } catch {
      return "";
    }
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || !/(^|\.)telesco\.pe$/.test(host)) return "";
    if (!/\.mp4$/i.test(url.pathname)) return "";
    return url.href;
  },
  sources(root = document) {
    const sources = [
      ...root.querySelectorAll(
        ".tgme_widget_message_video_player video[src],.tgme_widget_message_video_player source[src]",
      ),
    ]
      .map((element) => telegramVideo.media(element.getAttribute("src")))
      .filter(Boolean);
    return [...new Set(sources)];
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
  const video = {
    async run() {
      const saved = selection.capture();
      if (!saved) {
        alert("Не найден поддерживаемый редактор или позиция вставки.");
        return false;
      }
      let value;
      try {
        value = await navigator.clipboard.readText();
      } catch {
        alert("Не удалось прочитать буфер обмена. Разрешите доступ и повторите.");
        selection.restore(saved);
        return false;
      }
      const source = telegramVideo.media(value);
      if (!source) {
        alert("В буфере нет HTTPS MP4 URL с Telegram CDN telesco.pe.");
        selection.restore(saved);
        return false;
      }
      if (insert.run(saved, telegramVideo.html(source))) return true;
      selection.restore(saved);
      alert("Не удалось вставить видео в сохранённую позицию редактора.");
      return false;
    },
    async extract() {
      const sources = telegramVideo.sources(document);
      if (!sources.length) {
        alert("В посте не найдено основное MP4-видео.");
        return false;
      }
      if (sources.length > 1) {
        alert("В посте найдено несколько видео; выбор пока не поддерживается.");
        return false;
      }
      try {
        await navigator.clipboard.writeText(sources[0]);
        alert("MP4 URL скопирован.");
        return true;
      } catch {
        prompt("Скопируйте MP4 URL вручную", sources[0]);
        return false;
      }
    },
  };
  return { telegramVideo: video };
};

export { telegramVideo };
