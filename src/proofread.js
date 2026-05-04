import { editor } from "./core/admin.js";
import { widget } from "./core/escape.js";
import { clean, strip } from "./core/markup.js";

const proofread = {
  state: {
    ignored: window.ltIgnored ?? (window.ltIgnored = new Set()),
    textarea: null,
    panel: null,
    list: null,
    undo: null,
    plain: "",
    chunks: [],
    matches: [],
  },

  text: {
    ignored: new Set(["телеграм-бот"]),

    punctuation(value) {
      return /^[\s.,!?…:;'"«»„“”()\-–—]+$/u.test(value || "");
    },

    safe(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    },

    message(value) {
      const message = String(value || "").trim();
      return message === "Возможно найдена орфографическая ошибка."
        ? ""
        : message;
    },

    copy(value) {
      try {
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(value);
          return;
        }

        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.cssText = "position:fixed;left:-9999px;top:0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      } catch {}
    },

    emit() {
      const { textarea } = proofread.state;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.dispatchEvent(new Event("change", { bubbles: true }));
    },

    decodeWidgets() {
      const { textarea } = proofread.state;
      const source = textarea.value;
      const result = widget.decode(source, clean);
      if (result === source) return;
      textarea.value = result;
      proofread.text.emit();
    },

    split(value) {
      const result = [];
      const limit = 8000;
      let rest = value;

      while (rest.length > limit) {
        let cut = rest.lastIndexOf("\n\n", limit);
        if (cut < limit * 0.5) cut = rest.lastIndexOf("\n", limit);
        if (cut < limit * 0.5) cut = rest.lastIndexOf(" ", limit);
        if (cut < limit * 0.5) cut = limit;
        result.push(rest.slice(0, cut));
        rest = rest.slice(cut).replace(/^\s+/, "");
      }

      if (rest) result.push(rest);
      return result;
    },

    plain() {
      return strip(proofread.state.textarea.value);
    },

    key(match) {
      return `${match.word}|${match.message}`;
    },
  },

  panel: {
    create() {
      document.querySelector("#lt-panel")?.remove();

      const panel = document.createElement("div");
      panel.id = "lt-panel";
      panel.style.cssText = `
        position: fixed;
        right: 20px;
        top: 40px;
        z-index: 999999;
        width: max-content;
        max-width: min(768px, calc(100vw - 40px));
        min-width: 320px;
        max-height: none;
        overflow: visible;
        background: #fff;
        border: 1px solid #999;
        box-shadow: 0 4px 20px #0003;
        padding: 6px;
        overflow-x: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
        color: #111;
      `;
      panel.innerHTML = `
        <style>
          #lt-panel {
            font-size: 10px;
            line-height: 1.2;
            box-sizing: border-box;
          }

          #lt-panel *,
          #lt-panel *::before,
          #lt-panel *::after {
            box-sizing: inherit;
          }

          #lt-panel [data-header] {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 28px;
            padding: 6px;
            padding-right: calc(6px + 10px);
            margin: 0;
          }

          #lt-panel #lt-title {
            font-weight: 600;
            font-size: 11px;
            white-space: nowrap;
          }

          #lt-panel [data-tools] {
            display: flex;
            gap: 3px;
          }

          #lt-panel button {
            width: 22px;
            height: 22px;
            min-width: 22px;
            padding: 0;
            font-size: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: none;
            outline: none;
            background: transparent;
            border-radius: 5px;
            transition:
              background 0.5s ease,
              box-shadow 0.5s ease,
              transform 0.25s ease;
          }

          #lt-panel button[data-flash="green"] {
            background: #dff5e7 !important;
            box-shadow: 0 0 0 1px #8fd19e !important;
          }

          #lt-panel button[data-flash="blue"] {
            background: #eaf3ff !important;
            box-shadow: 0 0 0 1px #cfe0ff !important;
          }

          #lt-panel button:hover {
            background: #f3f4f6;
            box-shadow: none;
            border-radius: 4px;
          }

          #lt-panel button:active {
            transform: scale(0.9);
          }

          #lt-panel button:focus-visible {
            box-shadow: 0 0 0 2px #aac7ff;
          }

          #lt-list {
            font-size: 10px;
            line-height: 1.2;
            max-height: 126px;
            overflow-y: auto;
            overflow-x: hidden;
            scroll-snap-type: y proximity;
            scroll-padding-top: 2px;
          }

          #lt-list select,
          #lt-list input {
            height: 22px;
            font-size: 10px;
            box-sizing: border-box;
          }

          #lt-list [data-lt-row] {
            position: relative;
            padding: 3px 6px;
            border-top: 1px solid #ddd;
            scroll-snap-align: start;
          }

          #lt-list [data-lt-message] {
            color: #888;
            margin-top: 2px;
            font-size: 8px;
            line-height: 1.1;
            opacity: 0.85;
          }

          #lt-list [data-lt-empty] {
            padding: 5px 6px;
            color: #666;
          }

          #lt-list [data-lt-row] {
            position: relative;
          }

          #lt-list [data-lt-row][data-active="true"] {
            background: linear-gradient(90deg, #fff7cc 0, transparent 60%);
            box-shadow: inset 3px 0 0 #e6b800;
            padding-left: 10px;
          }

          #lt-panel [data-tools],
          #lt-list [data-lt-tools] {
            display: flex;
            align-items: center;
            gap: 3px;
          }

          #lt-list [data-lt-row] > div:first-child {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: center;
            min-height: 24px;
            gap: 6px;
          }

          #lt-list [data-lt-main] {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) 100px;
            align-items: center;
            gap: 12px;
            min-width: 0;
          }

          #lt-list [data-lt-main] span {
            max-width: 220px;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          #lt-list [data-lt-main] select,
          #lt-list [data-lt-main] input {
            width: 96px;
            padding-right: 12px;
          }

          #lt-list [data-go] {
            display: none !important;
          }

          @media (max-width: 820px) {
            #lt-panel {
              left: 0 !important;
              right: 0 !important;
              top: 0 !important;
              width: 100vw !important;
              max-width: none !important;
              height: 100vh !important;
              border: 0 !important;
            }

            #lt-list {
              max-height: calc(100vh - 44px);
            }
          }
        </style>
        <div data-header>
          <div id="lt-title">LanguageTool</div>
          <div data-tools>
            <button id="lt-undo" title="Вернуть" disabled>↩️</button>
            <button data-download title="Скачать">💾</button>
            <button id="lt-close" title="Закрыть">❌</button>
          </div>
        </div>
        <div id="lt-list">
          <div data-lt-empty>Засылаю…</div>
        </div>
      `;

      document.body.appendChild(panel);
      panel.querySelector("#lt-close").onclick = () => panel.remove();

      proofread.state.panel = panel;
      proofread.state.list = panel.querySelector("#lt-list");
      return panel;
    },

    title(value) {
      proofread.state.panel.querySelector("#lt-title").textContent = value;
    },

    empty(message) {
      proofread.state.list.innerHTML = `<div data-lt-empty>${message}</div>`;
    },

    row(index) {
      return proofread.state.panel.querySelector(`[data-lt-row="${index}"]`);
    },

    rows() {
      return [...proofread.state.panel.querySelectorAll("[data-lt-row]")];
    },

    active() {
      return proofread.state.panel.querySelector(
        '[data-lt-row][data-active="true"]',
      );
    },

    next(row, predicate = () => false) {
      let next = row?.nextElementSibling || null;
      while (next && predicate(proofread.state.matches[next.dataset.ltRow])) {
        next = next.nextElementSibling;
      }
      return next;
    },

    activate(index, button, from = 0) {
      const row = proofread.panel.row(index);
      if (!row) return false;

      proofread.panel
        .rows()
        .forEach((item) => item.removeAttribute("data-active"));
      row.dataset.active = "true";

      return proofread.match.go(
        proofread.state.matches[index],
        button || row.querySelector("[data-fix]"),
        from,
      );
    },

    activateNext(row, from = 0, predicate = () => false) {
      let next = row?.matches?.("[data-lt-row]")
        ? row
        : (row && proofread.panel.next(row, predicate)) ||
          proofread.state.panel.querySelector("[data-lt-row]");
      while (next) {
        const index = next.dataset.ltRow;
        const button = next.querySelector("[data-fix]");
        if (proofread.panel.activate(index, button, from)) return;
        next.remove();
        proofread.panel.refreshTitle();
        next = proofread.state.panel.querySelector("[data-lt-row]");
      }
    },

    refreshTitle() {
      const count = proofread.state.panel.querySelectorAll("[data-fix]").length;
      if (!count) {
        proofread.state.panel.remove();
        return;
      }
      proofread.panel.title(`Правок: ${count}`);
    },

    remove(predicate) {
      proofread.state.list.querySelectorAll("[data-fix]").forEach((button) => {
        const match = proofread.state.matches[button.dataset.fix];
        if (predicate(match)) {
          button.closest("[data-lt-row]").remove();
        }
      });
      proofread.panel.refreshTitle();
    },

    undo(value) {
      const button = proofread.state.panel?.querySelector("#lt-undo");
      if (button) button.disabled = !value;
    },

    renderMatches(matches) {
      proofread.state.matches = matches;
      proofread.panel.title(`Правок: ${matches.length}`);
      proofread.state.list.innerHTML = "";

      if (!matches.length) {
        proofread.panel.empty("Правок не найдено");
        return;
      }

      matches.slice(0, 50).forEach((match, index) => {
        const options = match.variants.slice();
        options.splice(1, 0, "__other__");

        const row = document.createElement("div");
        row.dataset.ltRow = index;
        row.innerHTML = `
          <div style="display:flex;align-items:center;gap:6px">
            <label data-lt-main style="display:flex;align-items:center;gap:6px;cursor:pointer;min-width:0;flex:1">
              <span style="overflow:hidden;text-overflow:ellipsis">
                <b>${proofread.text.safe(match.word)}</b>${match.count > 1 ? ` ×${match.count}` : ""} →
              </span>
              <select data-select="${index}" style="min-width:90px;max-width:130px">
                ${options
                  .map((option) =>
                    option === "__other__"
                      ? `<option value="">другое…</option>`
                      : `<option value="${proofread.text.safe(option)}">${proofread.text.safe(option)}</option>`,
                  )
                  .join("")}
              </select>
              <input data-input="${index}" style="display:none;box-sizing:border-box">
            </label>
            <div data-lt-tools>
              <button data-fix="${index}">✏️</button>
              <button data-go="${index}">🔎</button>
              <button data-search="${index}">🌐</button>
              <button data-ok="${index}">🆗</button>
            </div>
          </div>
          ${proofread.text.message(match.message) ? `<div data-lt-message>${proofread.text.safe(proofread.text.message(match.message))}</div>` : ""}
        `;
        proofread.state.list.appendChild(row);
      });

      proofread.bind.selects();
      proofread.bind.actions();
      proofread.panel.activateNext();
    },

    error(error) {
      proofread.state.panel.style.border = "2px solid #c00";
      proofread.panel.title("Ошибка");
      proofread.panel.empty(proofread.text.safe(error.message));
    },
  },

  lt: {
    checkChunk(chunk) {
      return fetch("https://api.languagetool.org/v2/check", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          text: chunk,
          language: "ru",
        }),
      })
        .then((response) => response.text())
        .then((raw) => {
          try {
            return JSON.parse(raw);
          } catch {
            throw new Error(raw.slice(0, 300));
          }
        });
    },

    run(index = 0, all = []) {
      if (index >= proofread.state.chunks.length) return Promise.resolve(all);

      proofread.panel.title(
        `LanguageTool: ${index + 1}/${proofread.state.chunks.length}`,
      );

      return proofread.lt
        .checkChunk(proofread.state.chunks[index])
        .then((data) => {
          const matches = (data.matches || []).map((match) => ({
            word: proofread.state.chunks[index].slice(
              match.offset,
              match.offset + match.length,
            ),
            fix: match.replacements?.[0]?.value || "",
            variants: (match.replacements || [])
              .slice(0, 10)
              .map((item) => item.value),
            message: match.message,
          }));

          return proofread.lt.run(index + 1, all.concat(matches));
        });
    },

    filter(matches) {
      return proofread.lt.group(
        matches.filter(
          (match) =>
            match.word &&
            match.fix &&
            !proofread.text.ignored.has(match.word.toLowerCase()) &&
            !proofread.text.punctuation(match.fix) &&
            !proofread.state.ignored.has(proofread.text.key(match)),
        ),
      );
    },

    group(matches) {
      const groups = new Map();

      matches.forEach((match) => {
        const groupKey = proofread.text.key(match);
        const current = groups.get(groupKey);

        if (!current) {
          groups.set(groupKey, { ...match, count: 1 });
          return;
        }

        current.count += 1;
      });

      return [...groups.values()];
    },
  },

  match: {
    miss(button) {
      button.style.background = "#fff1f1";
      setTimeout(() => {
        button.style.background = "";
      }, 2000);
    },

    flash(button, type = "green") {
      if (!button) return;

      clearTimeout(button._ltFlashTimer);
      delete button.dataset.flash;

      requestAnimationFrame(() => {
        button.dataset.flash = type;

        button._ltFlashTimer = setTimeout(() => {
          delete button.dataset.flash;
        }, 900);
      });
    },

    scroll(position) {
      const { textarea } = proofread.state;
      const styles = getComputedStyle(textarea);
      const mirror = document.createElement("div");
      const mark = document.createElement("span");
      mirror.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: ${textarea.clientWidth}px;
        white-space: pre-wrap;
        word-wrap: break-word;
        font: ${styles.font};
        line-height: ${styles.lineHeight};
        padding: ${styles.padding};
        border: ${styles.border};
        box-sizing: ${styles.boxSizing};
      `;
      mirror.textContent = textarea.value.slice(0, position);
      mark.textContent = "|";
      mirror.appendChild(mark);
      document.body.appendChild(mirror);
      textarea.scrollTop = Math.max(
        0,
        mark.offsetTop - textarea.clientHeight / 2,
      );
      mirror.remove();
    },

    focus(position, length) {
      const { textarea } = proofread.state;
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(position, position + length);
      proofread.match.scroll(position);
      requestAnimationFrame(() => {
        textarea.focus({ preventScroll: true });
        textarea.setSelectionRange(position, position + length);
        proofread.match.scroll(position);
      });
    },

    go(match, button, from = 0) {
      const { textarea } = proofread.state;
      let position = textarea.value.indexOf(match.word, from);
      if (position < 0 && from > 0) {
        position = textarea.value.indexOf(match.word);
      }
      if (position < 0) {
        proofread.match.miss(button);
        return false;
      }
      proofread.match.focus(position, match.word.length);
      return true;
    },

    fix(index) {
      return (
        proofread.state.panel.querySelector(`[data-select="${index}"]`)
          ?.value ||
        proofread.state.panel.querySelector(`[data-input="${index}"]`)?.value ||
        proofread.state.matches[index].fix
      );
    },

    apply(index, button, from = 0) {
      const { textarea, matches } = proofread.state;
      const match = matches[index];
      let position = textarea.value.indexOf(match.word, from);
      if (position < 0 && from > 0) {
        position = textarea.value.indexOf(match.word);
      }
      if (position < 0) {
        proofread.match.miss(button);
        return false;
      }
      const fix = proofread.match.fix(index);
      const after = textarea.value.split(match.word).join(fix);
      proofread.state.undo = {
        type: "apply",
        before: textarea.value,
        after,
      };
      proofread.panel.undo(true);
      textarea.value = after;
      proofread.text.emit();
      proofread.match.focus(position, fix.length);
      return true;
    },

    ignore(index) {
      const match = proofread.state.matches[index];
      const row = proofread.panel.row(index);
      if (!match || !row) return;
      const from = proofread.state.textarea.selectionEnd;
      const matchKey = proofread.text.key(match);
      const same = (item) => proofread.text.key(item) === matchKey;
      proofread.state.ignored.add(matchKey);
      row.remove();
      proofread.panel.refreshTitle();
      proofread.panel.activateNext(null, from, same);
    },
  },

  bind: {
    selects() {
      proofread.state.panel
        .querySelectorAll("[data-select]")
        .forEach((select) => {
          select.onchange = () => {
            const index = select.dataset.select;
            const input = proofread.state.panel.querySelector(
              `[data-input="${index}"]`,
            );
            if (!input) return;
            if (select.value) {
              select.style.display = "";
              input.style.display = "none";
              return;
            }
            select.style.display = "none";
            input.style.display = "inline-block";
            input.value = proofread.state.matches[index].word;
            input.focus();
            input.select();
            input.onblur = () => {
              input.style.display = "none";
              select.style.display = "";
            };
          };
        });
    },
    actions() {
      proofread.state.panel.querySelectorAll("[data-go]").forEach((button) => {
        button.onclick = () => {
          const index = button.dataset.go;
          const row = proofread.panel.row(index);
          const from = proofread.state.textarea.selectionEnd;
          if (proofread.panel.activate(index, button, from)) return;
          row?.remove();
          proofread.panel.refreshTitle();
          proofread.panel.activateNext(null, from);
        };
      });
      proofread.state.panel.querySelectorAll("[data-lt-row]").forEach((row) => {
        row.onclick = (event) => {
          if (event.target.closest("button,select,input")) return;
          const index = row.dataset.ltRow;
          const button = row.querySelector("[data-go]");
          const from = proofread.state.textarea.selectionEnd;
          if (proofread.panel.activate(index, button, from)) return;
          row.remove();
          proofread.panel.refreshTitle();
          proofread.panel.activateNext(null, from);
        };
      });
      proofread.state.panel
        .querySelectorAll("[data-search]")
        .forEach((button) => {
          button.onclick = () => {
            const index = button.dataset.search;
            const match = proofread.state.matches[index];
            proofread.panel.activate(index, button);
            proofread.text.copy(match.word);
            const query = encodeURIComponent(match.word);
            proofread.match.flash(button, "blue");
            window.open(`https://www.google.com/search?q=${query}`, "_blank");
          };
        });
      proofread.state.panel.querySelectorAll("[data-fix]").forEach((button) => {
        button.onclick = () => {
          const index = button.dataset.fix;
          const row = proofread.panel.row(index);
          if (!row) return;
          if (proofread.panel.active() !== row) {
            proofread.panel.activate(index, button);
            return;
          }
          if (
            proofread.match.apply(
              index,
              button,
              proofread.state.textarea.selectionStart,
            )
          ) {
            const from = proofread.state.textarea.selectionEnd;
            proofread.match.flash(button, "green");
            setTimeout(() => {
              row.remove();
              proofread.panel.refreshTitle();
              proofread.panel.activateNext(row, from);
            }, 1000);
          }
        };
      });
      proofread.state.panel.querySelectorAll("[data-ok]").forEach((button) => {
        button.onclick = () => {
          const index = button.dataset.ok;
          const match = proofread.state.matches[index];
          const row = button.closest("[data-lt-row]");
          if (!match || !row) return;
          const from = proofread.state.textarea.selectionEnd;
          const matchKey = proofread.text.key(match);
          const same = (item) => proofread.text.key(item) === matchKey;
          const next = proofread.panel.next(row, same);
          proofread.state.undo = {
            type: "ignore",
            key: matchKey,
            row: row.cloneNode(true),
            next: row.nextElementSibling,
          };
          proofread.panel.undo(true);
          proofread.state.ignored.add(matchKey);
          proofread.match.flash(button, "green");
          setTimeout(() => {
            row.remove();
            proofread.panel.refreshTitle();
            proofread.panel.activateNext(next, from, same);
          }, 1000);
        };
      });
      proofread.state.panel.querySelector("#lt-undo").onclick = () => {
        const undo = proofread.state.undo;
        if (!undo) return;
        if (undo.type === "apply") {
          proofread.state.textarea.value = undo.before;
          proofread.text.emit();
        }
        if (undo.type === "ignore") {
          proofread.state.ignored.delete(undo.key);
          if (undo.next?.parentNode) {
            undo.next.before(undo.row);
          } else {
            proofread.state.list.appendChild(undo.row);
          }
          proofread.panel
            .rows()
            .forEach((item) => item.removeAttribute("data-active"));
          undo.row.dataset.active = "true";
          proofread.bind.actions();
          const index = undo.row.dataset.ltRow;
          const button = undo.row.querySelector("[data-fix]");
          proofread.panel.activate(
            index,
            button,
            proofread.state.textarea.selectionEnd,
          );
        }
        proofread.state.undo = null;
        proofread.panel.undo(false);
        proofread.panel.refreshTitle();
      };
      proofread.state.panel
        .querySelectorAll("[data-download]")
        .forEach((button) => {
          button.onclick = proofread.download;
        });
    },
  },

  download() {
    try {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(
        new Blob([proofread.state.plain], {
          type: "text/plain;charset=utf-8",
        }),
      );
      link.download = "lt-text.txt";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } catch {}
  },

  init() {
    editor.html();
    const textarea = document.querySelector("#content");
    if (!textarea) return false;
    proofread.state.textarea = textarea;
    proofread.text.decodeWidgets();
    proofread.state.plain = proofread.text.plain();
    proofread.state.chunks = proofread.text.split(proofread.state.plain);
    proofread.panel.create();
    return true;
  },

  run() {
    if (!proofread.init()) return;
    proofread.lt
      .run()
      .then((matches) =>
        proofread.panel.renderMatches(proofread.lt.filter(matches)),
      )
      .catch((error) => proofread.panel.error(error));
  },
};

proofread.run();
