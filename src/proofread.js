import { decode, map } from "./core/escape.js";
import { clean, strip } from "./core/markup.js";

(() => {
  if (!window.ltIgnored) window.ltIgnored = new Set();
  document.querySelector("#content-html")?.click();
  const content = document.querySelector("#content");
  if (!content) return;
  const ignoredWords = new Set([
    "телеграм-бот",
  ]);
  const punctuationOnly = (value) =>
    /^[\s.,!?…:;'"«»„“”()\-–—]+$/u.test(value || "");
  const safe = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const emit = () => {
    content.dispatchEvent(new Event("input", { bubbles: true }));
    content.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const decodeWidgets = () => {
    const source = content.value;
    const result = map(source, (text) => clean(decode(text)));
    if (result !== source) {
      content.value = result;
      emit();
    }
  };
  decodeWidgets();
  const text = strip(content.value);
  const key = (match) => `${match.word}|${match.message}`;
  const panel = document.createElement("div");
  document.querySelector("#lt-panel")?.remove();
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
    font: 13px Consolas, monospace;
    color: #111;
  `;
  panel.innerHTML = `
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
  const download = () => {
    try {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(
        new Blob([text], { type: "text/plain;charset=utf-8" }),
      );
      link.download = "lt-text.txt";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } catch {}
  };
  const split = (value) => {
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
  };
  const chunks = split(text);
  const checkChunk = (chunk) =>
    fetch("https://api.languagetool.org/v2/check", {
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
  const run = (index = 0, all = []) => {
    if (index >= chunks.length) return Promise.resolve(all);
    panel.querySelector("#lt-title").textContent =
      `LanguageTool: ${index + 1}/${chunks.length}`;
    return checkChunk(chunks[index]).then((data) => {
      const matches = (data.matches || []).map((match) => ({
        word: chunks[index].slice(match.offset, match.offset + match.length),
        fix: match.replacements?.[0]?.value || "",
        variants: (match.replacements || [])
          .slice(0, 10)
          .map((item) => item.value),
        message: match.message,
      }));
      return run(index + 1, all.concat(matches));
    });
  };
  const miss = (button) => {
    button.style.outline = "2px solid #c00";
    button.style.background = "#fff1f1";
    setTimeout(() => {
      button.style.outline = "";
      button.style.background = "";
    }, 2000);
  };
  const scrollToPos = (position) => {
    content.focus();
    const styles = getComputedStyle(content);
    const mirror = document.createElement("div");
    const mark = document.createElement("span");
    mirror.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: ${content.clientWidth}px;
      white-space: pre-wrap;
      word-wrap: break-word;
      font: ${styles.font};
      line-height: ${styles.lineHeight};
      padding: ${styles.padding};
      border: ${styles.border};
      box-sizing: ${styles.boxSizing};
    `;
    mirror.textContent = content.value.slice(0, position);
    mark.textContent = "|";
    mirror.appendChild(mark);
    document.body.appendChild(mirror);
    content.scrollTop = Math.max(0, mark.offsetTop - content.clientHeight / 2);
    mirror.remove();
  };
  const go = (match, button) => {
    const position = content.value.indexOf(match.word);
    if (position < 0) {
      miss(button);
      return -1;
    }
    content.setSelectionRange(position, position + match.word.length);
    scrollToPos(position);
    return position;
  };
  run()
    .then((rawMatches) => {
      const matches = rawMatches.filter(
        (match) =>
          match.word &&
          match.fix &&
          !ignoredWords.has(match.word.toLowerCase()) &&
          !punctuationOnly(match.fix) &&
          !window.ltIgnored.has(key(match)),
      );
      panel.querySelector("#lt-title").textContent =
        `LanguageTool: ${matches.length}`;
      const list = panel.querySelector("#lt-list");
      list.innerHTML = "";
      if (!matches.length) {
        list.innerHTML = `<div style="color:#666">Правок не найдено</div>`;
        return;
      }
      matches.slice(0, 50).forEach((match, index) => {
        const options = match.variants.slice();
        options.splice(1, 0, "__other__");
        const row = document.createElement("div");
        row.style.cssText = "border-top:1px solid #ddd;padding:8px 0";
        row.innerHTML = `
          <div style="display:flex;align-items:center;gap:6px">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;min-width:0;flex:1">
              <input type="checkbox" data-i="${index}">
              <span style="overflow:hidden;text-overflow:ellipsis">
                <b>${safe(match.word)}</b> →
              </span>
              <select data-select="${index}" style="height:28px;min-width:120px;max-width:160px">
                ${options
                  .map((option) =>
                    option === "__other__"
                      ? `<option value="">другое…</option>`
                      : `<option value="${safe(option)}">${safe(option)}</option>`,
                  )
                  .join("")}
              </select>
              <input data-input="${index}" style="display:none;height:28px;width:120px;box-sizing:border-box">
            </label>
            <button data-fix="${index}" style="height:28px;min-width:32px;line-height:1">✏️</button>
            <button data-go="${index}" style="height:28px;min-width:32px;line-height:1">🔎</button>
            <button data-search="${index}" style="height:28px;min-width:32px;line-height:1">🌐</button>
            <button data-ok="${index}" style="height:28px;min-width:32px;line-height:1">🆗</button>
          </div>
          <div style="color:#666;margin-top:3px">${safe(match.message)}</div>
        `;
        list.appendChild(row);
      });
      panel.insertAdjacentHTML(
        "beforeend",
        `<div style="display:flex;gap:8px;margin-top:10px">
          <button id="lt-apply" style="height:28px;min-width:34px;line-height:1">📝</button>
          <button id="lt-download" style="height:28px;min-width:34px;line-height:1">💾</button>
        </div>`,
      );
      panel.querySelectorAll("[data-select]").forEach((select) => {
        select.onchange = () => {
          const index = select.dataset.select;
          const input = panel.querySelector(`[data-input="${index}"]`);
          if (!input) return;
          if (select.value) {
            input.style.display = "none";
          } else {
            input.style.display = "block";
            input.value = matches[index].word;
            input.focus();
            input.select();
          }
        };
      });
      const getFix = (index) =>
        panel.querySelector(`[data-select="${index}"]`)?.value ||
        panel.querySelector(`[data-input="${index}"]`)?.value ||
        matches[index].fix;

      const refreshTitle = () => {
        const count = panel.querySelectorAll("[data-fix]").length;
        if (!count) {
          panel.remove();
          return;
        }
        panel.querySelector("#lt-title").textContent = `LanguageTool: ${count}`;
      };

      const removeMatches = (predicate) => {
        list.querySelectorAll("[data-fix]").forEach((button) => {
          const match = matches[button.dataset.fix];
          if (predicate(match)) {
            button.closest("div").parentElement.remove();
          }
        });
        refreshTitle();
      };

      const one = (index, button) => {
        const match = matches[index];
        const position = go(match, button);
        if (position < 0) return false;
        const fix = getFix(index);
        content.value =
          content.value.slice(0, position) +
          fix +
          content.value.slice(position + match.word.length);
        emit();
        content.setSelectionRange(position, position + fix.length);
        scrollToPos(position);
        return true;
      };
      panel.querySelectorAll("[data-go]").forEach((button) => {
        button.onclick = () => go(matches[button.dataset.go], button);
      });
      panel.querySelectorAll("[data-search]").forEach((button) => {
        button.onclick = () => {
          const match = matches[button.dataset.search];
          const query = encodeURIComponent(match.word);
          window.open(`https://www.google.com/search?q=${query}`, "_blank");
        };
      });
      panel.querySelectorAll("[data-fix]").forEach((button) => {
        button.onclick = () => {
          const row = button.closest("div").parentElement;
          if (one(button.dataset.fix, button)) {
            row.remove();
            refreshTitle();
          }
        };
      });
      panel.querySelectorAll("[data-ok]").forEach((button) => {
        button.onclick = () => {
          const match = matches[button.dataset.ok];
          if (go(match, button) >= 0) {
            const matchKey = key(match);
            window.ltIgnored.add(matchKey);
            removeMatches((item) => key(item) === matchKey);
          }
        };
      });
      panel.querySelector("#lt-apply").onclick = () => {
        panel
          .querySelectorAll('input[type="checkbox"]:checked')
          .forEach((input) => {
            one(
              input.dataset.i,
              panel.querySelector(`[data-fix="${input.dataset.i}"]`),
            );
          });
        panel.remove();
      };
      panel.querySelector("#lt-download").onclick = download;
    })
    .catch((error) => {
      panel.style.border = "2px solid #c00";
      panel.querySelector("#lt-title").textContent = "Ошибка";
      panel.querySelector("#lt-list").innerHTML =
        `<div style="color:#666">${safe(error.message)}</div>`;
    });
})();
