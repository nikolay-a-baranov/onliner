import { editor } from "./core/admin.js";
import { widget } from "./core/escape.js";
import { markup } from "./core/markup.js";
import { frame } from "./core/panel.js";
import { skin } from "./core/panel.skin.js";

const proofread = {
  id: {
    skin: "proofread-style",
  },
  state: {
    ignored: window.proofreadIgnored ?? (window.proofreadIgnored = window.ltIgnored ?? new Set()),
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

    decode() {
      const { textarea } = proofread.state;
      const source = textarea.value;
      const result = widget.decode(source, markup.clean);
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
      return markup.strip(proofread.state.textarea.value);
    },

    key(match) {
      return `${match.word}|${match.message}`;
    },
  },

  panel: {
    create() {
      frame.mount(proofread.id.skin, skin.proofread);
      const panel = frame.create({
        id: "proofread-panel",
        className: "panel",
        html: `
        <div data-header>
          <div id="proofread-title">LanguageTool</div>
          <div data-tools>
            <button class="button button-emoji" id="proofread-undo" title="Вернуть" disabled>↩️</button>
            <button class="button button-emoji" data-download title="Скачать">💾</button>
            <button class="button button-emoji" id="proofread-close" title="Закрыть">❌</button>
          </div>
        </div>
        <div id="proofread-list">
          <div data-empty>Засылаю…</div>
        </div>
      `,
      });
      panel.querySelector("#proofread-close").onclick = () => panel.remove();
      proofread.state.panel = panel;
      proofread.state.list = panel.querySelector("#proofread-list");
      return panel;
    },

    title(value) {
      proofread.state.panel.querySelector("#proofread-title").textContent =
        value;
    },

    empty(message) {
      proofread.state.list.innerHTML = `<div data-empty>${message}</div>`;
    },

    row(index) {
      return proofread.state.panel.querySelector(`[data-row="${index}"]`);
    },

    rows() {
      return [...proofread.state.panel.querySelectorAll("[data-row]")];
    },

    active() {
      return proofread.state.panel.querySelector(
        '[data-row][data-active="true"]',
      );
    },

    next(row, predicate = () => false) {
      let next = row?.nextElementSibling || null;
      while (next && predicate(proofread.state.matches[next.dataset.row])) {
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
      let next = row?.matches?.("[data-row]")
        ? row
        : (row && proofread.panel.next(row, predicate)) ||
          proofread.state.panel.querySelector("[data-row]");
      while (next) {
        const index = next.dataset.row;
        const button = next.querySelector("[data-fix]");
        if (proofread.panel.activate(index, button, from)) return;
        next.remove();
        proofread.panel.refreshTitle();
        next = proofread.state.panel.querySelector("[data-row]");
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
          button.closest("[data-row]").remove();
        }
      });
      proofread.panel.refreshTitle();
    },

    undo(value) {
      const button = proofread.state.panel?.querySelector("#proofread-undo");
      if (button) button.disabled = !value;
    },

    render(matches) {
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
        row.dataset.row = index;
        row.innerHTML = `
          <div class="proofread-line">
            <label data-main>
              <span>
                <b>${proofread.text.safe(match.word)}</b>${match.count > 1 ? ` ×${match.count}` : ""} →
              </span>
              <select class="field field-select" data-select="${index}">
                ${options
                  .map((option) =>
                    option === "__other__"
                      ? `<option value="__other__">это другое…</option>`
                      : `<option value="${proofread.text.safe(option)}">${proofread.text.safe(option)}</option>`,
                  )
                  .join("")}
              </select>
              <input class="field field-input" data-input="${index}">
            </label>
            <div data-tools-row>
              <button class="button button-emoji" data-fix="${index}">✏️</button>
              <button class="button button-emoji" data-go="${index}">🔎</button>
              <button class="button button-emoji" data-search="${index}">🌐</button>
              <button class="button button-emoji" data-ok="${index}">🆗</button>
            </div>
          </div>
          ${proofread.text.message(match.message) ? `<div data-message>${proofread.text.safe(proofread.text.message(match.message))}</div>` : ""}
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

  engine: {
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
      return proofread.engine
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
          return proofread.engine.run(index + 1, all.concat(matches));
        });
    },

    filter(matches) {
      return proofread.engine.group(
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
      proofread.match.flash(button, "red", 900);
    },
    flash(button, type = "green", timeout = 500) {
      if (!button) return;
      clearTimeout(button._flashTimer);
      delete button.dataset.flash;
      requestAnimationFrame(() => {
        button.dataset.flash = type;
        button._flashTimer = setTimeout(() => {
          delete button.dataset.flash;
        }, timeout);
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
      const select = proofread.state.panel.querySelector(
        `[data-select="${index}"]`,
      );
      const input = proofread.state.panel.querySelector(
        `[data-input="${index}"]`,
      );
      if (select?.value === "__other__") {
        return input?.value || proofread.state.matches[index].fix;
      }
      return select?.value || input?.value || proofread.state.matches[index].fix;
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
            if (select.value !== "__other__") {
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
      proofread.state.panel.querySelectorAll("[data-row]").forEach((row) => {
        row.onclick = (event) => {
          if (event.target.closest("button,select,input")) return;
          const index = row.dataset.row;
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
            }, 220);
          }
        };
      });
      proofread.state.panel.querySelectorAll("[data-ok]").forEach((button) => {
        button.onclick = () => {
          const index = button.dataset.ok;
          const match = proofread.state.matches[index];
          const row = button.closest("[data-row]");
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
          }, 220);
        };
      });
      proofread.state.panel.querySelector("#proofread-undo").onclick = () => {
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
          const index = undo.row.dataset.row;
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
      link.download = "proofread-text.txt";
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
    proofread.text.decode();
    proofread.state.plain = proofread.text.plain();
    proofread.state.chunks = proofread.text.split(proofread.state.plain);
    proofread.panel.create();
    return true;
  },

  run() {
    if (!proofread.init()) return;
    proofread.engine
      .run()
      .then((matches) => proofread.panel.render(proofread.engine.filter(matches)))
      .catch((error) => proofread.panel.error(error));
  },
};

proofread.run();




