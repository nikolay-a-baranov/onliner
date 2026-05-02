import { editor } from "./core/admin.js";
import { widget } from "./core/escape.js";
import { clean } from "./core/markup.js";

(() => {
  const textarea = document.getElementById("content");
  if (!textarea) return;

  const readable = {
    open: "⟦",
    close: "⟧",
  };

  const show = (string) =>
    widget
      .decode(string, clean)
      .replace(
        /("text"\s*:\s*)"((?:\\.|[^"\\])*)"/g,
        (_, before, value) =>
          `${before}${readable.open}${value.replace(/\\"/g, '"')}${readable.close}`,
      )
      .replace(
        /("description"\s*:\s*)"((?:\\.|[^"\\])*)"/g,
        (_, before, value) =>
          `${before}${readable.open}${value.replace(/\\"/g, '"')}${readable.close}`,
      );

  const hide = (string) =>
    widget.encode(
      string
        .replace(
          /("text"\s*:\s*)⟦([\s\S]*?)⟧/g,
          (_, before, value) => `${before}${JSON.stringify(value)}`,
        )
        .replace(
          /("description"\s*:\s*)⟦([\s\S]*?)⟧/g,
          (_, before, value) => `${before}${JSON.stringify(value)}`,
        ),
    );

  const mode = {
    get: () =>
      textarea.dataset.widgetMode ||
      (textarea.value.includes(readable.open) || !widget.encoded(textarea.value)
        ? "decoded"
        : "encoded"),

    set(value) {
      textarea.dataset.widgetMode = value;
    },

    sync() {
      mode.set(
        textarea.value.includes(readable.open) ||
          !widget.encoded(textarea.value)
          ? "decoded"
          : "encoded",
      );
    },
  };

  const emit = () => {
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const run = (fn) => {
    const source = textarea.value;
    const result = fn(source);
    if (result === source) return;
    textarea.value = result;
    emit();
  };

  const toggle = () => {
    if (mode.get() === "encoded") {
      run(show);
      mode.set("decoded");
      return;
    }

    run(hide);
    mode.set("encoded");
  };

  editor.html();

  setTimeout(() => {
    mode.sync();
    toggle();

    editor.tmce({
      beforeClick: () => {
        if (mode.get() !== "encoded") {
          run(hide);
          mode.set("encoded");
        }
      },
    });
  }, 0);
})();
