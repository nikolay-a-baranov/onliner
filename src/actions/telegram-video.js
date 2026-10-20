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
  documents(root = document) {
    const children = [...root.querySelectorAll("iframe")].flatMap((frame) => {
      try {
        return frame.contentDocument
          ? telegramVideo.documents(frame.contentDocument)
          : [];
      } catch {
        return [];
      }
    });
    return [root, ...children];
  },
  sources(root = document) {
    const sources = telegramVideo
      .documents(root)
      .flatMap((current) => [
        ...current.querySelectorAll("video[src],video source[src]"),
      ])
      .map((element) =>
        telegramVideo.media(
          element.currentSrc || element.getAttribute("src"),
        ),
      )
      .filter(Boolean);
    return [...new Set(sources)];
  },
  file: {
    getName(value = "") {
      try {
        return decodeURIComponent(new URL(value).pathname.split("/").pop()) ||
          "telegram-video.mp4";
      } catch {
        return "telegram-video.mp4";
      }
    },
    async save(value = "") {
      const response = await fetch(value);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = telegramVideo.file.getName(value);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    },
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
    return [
      '<video controls playsinline preload="metadata" style="display:block; width:100%; max-width:700px; height:auto">',
      `<source src="${source}" type="video/mp4"></source></video>`,
    ].join("");
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
      const source = sources[0];
      const html = telegramVideo.html(source);
      const [clipboard, download] = await Promise.allSettled([
        navigator.clipboard.writeText(html),
        telegramVideo.file.save(source),
      ]);
      const copied = clipboard.status === "fulfilled";
      const saved = download.status === "fulfilled";
      if (copied) alert(`Вставь код в запись (он уже скопирован)\n\n${html}`);
      if (!copied) prompt("Скопируйте код видео вручную", html);
      if (!saved) {
        alert("Не удалось скачать видео. Код остаётся доступен для копирования.");
      }
      return copied && saved;
    },
  };
  return { telegramVideo: video };
};

export { telegramVideo };
