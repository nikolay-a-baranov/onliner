(() => {
  if (!window.ltIgnored) window.ltIgnored = new Set();
  document.querySelector("#content-html")?.click();
  const content = document.querySelector("#content");
  if (!content) return;
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
  const decode = (text) => {
    const node = document.createElement("textarea");
    let snap;
    let value = text;
    do {
      snap = value;
      node.innerHTML = value;
      value = node.value;
    } while (value !== snap);
    return value;
  };
  const json = (text) =>
    text
      .replace(/&nbsp;|\u00a0/gi, " ")
      .replace(/<\/?span\b[^>]*>/gi, "")
      .replace(/<br\s*\/?>/gi, "")
      .replace(/\s+<\/p>/gi, "</p>")
      .replace(/<p>\s*<\/p>/gi, "")
      .replace(/<\/?b\b[^>]*>/gi, (tag) =>
        tag[1] === "/" ? "</strong>" : "<strong>",
      )
      .replace(/<\/?i\b[^>]*>/gi, (tag) => (tag[1] === "/" ? "</em>" : "<em>"));
  const replaceTag = (text, tag, edit) =>
    text.replace(
      new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`, "g"),
      (full, raw) => {
        try {
          const data = JSON.parse(raw);
          edit(data);
          return `[${tag}]${JSON.stringify(data)}[/${tag}]`;
        } catch {
          return full;
        }
      },
    );
  const decodeWidgets = () => {
    let value = content.value;
    value = replaceTag(value, "onliner-promo-widget", (data) => {
      if (typeof data.text === "string") {
        data.text = json(decode(data.text));
      }
    });
    value = replaceTag(value, "onliner-vote", (data) => {
      if (data.variants) {
        data.variants.forEach((item) => {
          if (item && typeof item.description === "string") {
            item.description = json(decode(item.description));
          }
        });
      }
    });
    content.value = value;
    emit();
  };
  decodeWidgets();
  const clean = (html) =>
    html
      .replace(/\[video\][\s\S]*?\[\/video\]/gi, " ")
      .replace(
        /<(script|style|iframe|code|pre|svg|video|audio)\b[\s\S]*?<\/\1>/gi,
        " ",
      )
      .replace(/<img\b[^>]*>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|blockquote|h[1-6]|li)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&laquo;|&#171;/g, "«")
      .replace(/&raquo;|&#187;/g, "»")
      .replace(/&mdash;|&#8212;/g, "—")
      .replace(/&ndash;|&#8211;/g, "–")
      .replace(/&quot;|&#34;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  const text = clean(content.value);
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
        (match) => match.word && match.fix && !window.ltIgnored.has(key(match)),
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
            <button data-ok="${index}" style="height:28px;min-width:32px;line-height:1">🆗</button>
          </div>
          <div style="color:#666;margin-top:3px">${safe(match.message)}</div>
        `;
        list.appendChild(row);
      });
      panel.insertAdjacentHTML(
        "beforeend",
        `<button id="lt-apply" style="margin-top:10px;height:28px;min-width:34px;line-height:1">📝</button>`,
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
      const next = (row) => {
        const nextRow = row.nextElementSibling;
        row.remove();
        nextRow?.querySelector("[data-go]")?.click();
      };
      panel.querySelectorAll("[data-go]").forEach((button) => {
        button.onclick = () => go(matches[button.dataset.go], button);
      });
      panel.querySelectorAll("[data-fix]").forEach((button) => {
        button.onclick = () => {
          const row = button.closest("div").parentElement;
          if (one(button.dataset.fix, button)) next(row);
        };
      });
      panel.querySelectorAll("[data-ok]").forEach((button) => {
        button.onclick = () => {
          const row = button.closest("div").parentElement;
          const match = matches[button.dataset.ok];
          if (go(match, button) >= 0) {
            window.ltIgnored.add(key(match));
            next(row);
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
    })
    .catch((error) => {
      panel.style.border = "2px solid #c00";
      panel.querySelector("#lt-title").textContent = "Ошибка";
      panel.querySelector("#lt-list").innerHTML =
        `<div style="color:#666">${safe(error.message)}</div>`;
    });
})();
