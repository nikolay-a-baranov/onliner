import { editor } from "./core/admin.js";
import { widget } from "./core/escape.js";
import { clean, strip } from "./core/markup.js";

const proofread = {
  state: {
    ignored: window.ltIgnored ?? (window.ltIgnored = new Set()),
    textarea: null,
    panel: null,
    list: null,
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
        width: 520px;
        max-height: 80vh;
        overflow: auto;
        background: #fff;
        border: 1px solid #999;
        box-shadow: 0 4px 20px #0003;
        padding: 12px;
        font: 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
        color: #111;
      `;
      panel.innerHTML = `
        <style>
          #lt-panel {
            box-sizing: border-box;
          }

          #lt-panel *,
          #lt-panel *::before,
          #lt-panel *::after {
            box-sizing: inherit;
          }

          #lt-list [data-lt-row][data-active="true"] {
            background: #eef6ff;
          }

          #lt-list [data-lt-tools] {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          #lt-list [data-lt-main] {
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 0;
            flex: 1;
          }

          @media (max-width: 820px) {
            #lt-panel {
              left: 0 !important;
              right: 0 !important;
              top: 0 !important;
              width: 100vw !important;
              max-height: 100vh !important;
              height: 100vh !important;
              border: 0 !important;
              border-radius: 0 !important;
              padding: 10px !important;
            }

            #lt-list [data-lt-row] > div:first-child {
              flex-wrap: wrap;
              align-items: flex-start !important;
            }

            #lt-list [data-lt-main] {
              width: 100%;
              flex: 1 0 100%;
              flex-wrap: wrap;
            }

            #lt-list [data-lt-main] > span {
              min-width: 0;
              flex: 1 1 auto;
            }

            #lt-list [data-lt-main] select,
            #lt-list [data-lt-main] input {
              min-width: 0 !important;
              max-width: none !important;
              width: 100% !important;
              flex: 1 0 100%;
            }

            #lt-list [data-lt-tools] {
              width: 100%;
              justify-content: flex-end;
              flex-wrap: wrap;
            }

            #lt-panel button,
            #lt-panel select,
            #lt-panel input {
              min-height: 36px !important;
              font-size: 16px !important;
            }
          }
        </style>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <b id="lt-title">LanguageTool: проверка…</b>
          <button id="lt-close" style="height:28px;min-width:28px;line-height:1">×</button>
        </div>
        <div id="lt-list">
          <div style="color:#666">Отправляю текст…</div>
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
      proofread.state.list.innerHTML = `<div style="color:#666">${message}</div>`;
    },

    appendFooter() {
      proofread.state.panel.insertAdjacentHTML(
        "beforeend",
        `<div style="display:flex;gap:8px;margin-top:10px">
          <button id="lt-apply" style="height:28px;min-width:34px;line-height:1">📝</button>
          <button id="lt-download" style="height:28px;min-width:34px;line-height:1">💾</button>
        </div>`,
      );
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
      const next =
        proofread.panel.next(row, predicate) ||
        proofread.state.panel.querySelector("[data-lt-row]");
      if (!next) return;
      proofread.panel.activate(
        next.dataset.ltRow,
        next.querySelector("[data-fix]"),
        from,
      );
    },

    refreshTitle() {
      const count = proofread.state.panel.querySelectorAll("[data-fix]").length;
      if (!count) {
        proofread.state.panel.remove();
        return;
      }
      proofread.panel.title(`LanguageTool: ${count}`);
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

    renderMatches(matches) {
      proofread.state.matches = matches;
      proofread.panel.title(`LanguageTool: ${matches.length}`);
      proofread.state.list.innerHTML = "";

      if (!matches.length) {
        proofread.panel.empty("Правок не найдено");
        return;
      }

      matches.slice(0, 50).forEach((match, index) => {
        const options = match.variants.slice();
        options.splice(1, 0, "__other__");

        const row = document.createElement("div");
        row.style.cssText = "border-top:1px solid #ddd;padding:8px 0";
        row.dataset.ltRow = index;
        row.innerHTML = `
          <div style="display:flex;align-items:center;gap:6px">
            <label data-lt-main style="display:flex;align-items:center;gap:6px;cursor:pointer;min-width:0;flex:1">
              <input type="checkbox" data-i="${index}">
              <span style="overflow:hidden;text-overflow:ellipsis">
                <b>${proofread.text.safe(match.word)}</b>${match.count > 1 ? ` ×${match.count}` : ""} →
              </span>
              <select data-select="${index}" style="height:28px;min-width:120px;max-width:160px">
                ${options
                  .map((option) =>
                    option === "__other__"
                      ? `<option value="">другое…</option>`
                      : `<option value="${proofread.text.safe(option)}">${proofread.text.safe(option)}</option>`,
                  )
                  .join("")}
              </select>
              <input data-input="${index}" style="display:none;height:28px;width:120px;box-sizing:border-box">
            </label>
            <div data-lt-tools>
              <button data-fix="${index}" style="height:28px;min-width:32px;line-height:1">✏️</button>
              <button data-go="${index}" style="height:28px;min-width:32px;line-height:1">🔎</button>
              <button data-search="${index}" style="height:28px;min-width:32px;line-height:1">🌐</button>
              <button data-ok="${index}" style="height:28px;min-width:32px;line-height:1">🆗</button>
            </div>
          </div>
          ${proofread.text.message(match.message) ? `<div style="color:#666;margin-top:3px">${proofread.text.safe(proofread.text.message(match.message))}</div>` : ""}
        `;
        proofread.state.list.appendChild(row);
      });

      proofread.panel.appendFooter();
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
      button.style.outline = "2px solid #c00";
      button.style.background = "#fff1f1";
      setTimeout(() => {
        button.style.outline = "";
        button.style.background = "";
      }, 2000);
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
      textarea.value = textarea.value.split(match.word).join(fix);
      proofread.text.emit();
      proofread.match.focus(position, fix.length);
      return true;
    },

    ignore(index, button) {
      const match = proofread.state.matches[index];
      const row = proofread.panel.row(index);
      if (!proofread.panel.activate(index, button)) return;
      const from = proofread.state.textarea.selectionEnd;
      const matchKey = proofread.text.key(match);
      proofread.state.ignored.add(matchKey);
      const same = (item) => proofread.text.key(item) === matchKey;
      proofread.panel.remove(same);
      proofread.panel.activateNext(row, from, same);
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
              input.style.display = "none";
              return;
            }
            input.style.display = "block";
            input.value = proofread.state.matches[index].word;
            input.focus();
            input.select();
          };
        });
    },

    actions() {
      proofread.state.panel.querySelectorAll("[data-go]").forEach((button) => {
        button.onclick = () => {
          proofread.panel.activate(button.dataset.go, button);
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
            row.remove();
            proofread.panel.refreshTitle();
            proofread.panel.activateNext(row, from);
          }
        };
      });

      proofread.state.panel.querySelectorAll("[data-ok]").forEach((button) => {
        button.onclick = () => {
          proofread.match.ignore(button.dataset.ok, button);
        };
      });

      proofread.state.panel.querySelector("#lt-apply").onclick = () => {
        proofread.state.panel
          .querySelectorAll('input[type="checkbox"]:checked')
          .forEach((input) => {
            proofread.match.apply(
              input.dataset.i,
              proofread.state.panel.querySelector(
                `[data-fix="${input.dataset.i}"]`,
              ),
              proofread.state.textarea.selectionStart,
            );
          });
        proofread.state.panel.remove();
      };

      proofread.state.panel.querySelector("#lt-download").onclick =
        proofread.download;
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
