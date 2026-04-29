(async () => {
  const wrap = document.querySelector("#wp-content-wrap");
  if (!wrap.classList.contains("html-active")) {
    document.querySelector("#content-html").click();
    return;
  }

  const content = document.querySelector("#content");

  const sections = {
    people: { icon: "👫🏻" },
    sport: { icon: "🏅" },
    money: { icon: "👛" },
    auto: { icon: "🚘" },
    tech: { icon: "💻" },
    realt: { icon: "🏙️" },
  };

  const style = () => {
    if (document.querySelector("#readmore-style")) return;
    document.head.insertAdjacentHTML(
      "beforeend",
      `<style id="readmore-style">
        .rm-panel{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:999999;background:#fff;border:1px solid #d7d7d7;border-radius:16px;padding:18px;min-width:640px;max-width:780px;box-shadow:0 18px 50px rgba(0,0,0,.28);font:14px 'YS Text Variable',system-ui,Arial,sans-serif;color:#222}
        .rm-row{display:flex;gap:10px;align-items:center;margin:10px 0}
        .rm-button{width:42px;height:42px;border:1px solid #d2d2d2;border-radius:12px;background:#f8f8f8;display:flex;align-items:center;justify-content:center;font-size:21px;cursor:pointer}
        .rm-button:hover{background:#eee}
        .rm-input{flex:1;height:42px;padding:0 12px;border:1px solid #d2d2d2;border-radius:12px;font:14px 'YS Text Variable',system-ui,Arial,sans-serif}
        .rm-actions{display:grid;grid-template-columns:42px 1fr 42px;gap:14px;align-items:center;margin-top:16px}
        .rm-center{text-align:center;font-weight:700;font-size:32px}
        .rm-title{text-align:center;font-weight:700;font-size:18px;margin-bottom:10px}
      </style>`,
    );
  };

  const parse = (text) =>
    text
      .split(/\s+/)
      .filter((url) =>
        /^https?:\/\/[^/\s]+\.onliner\.by\/\d{4}\/\d{2}\/\d{2}\//.test(url),
      );

  const escape = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const clean = (s) => s.replace(/\s*[-–—]\s*.*onl[ií]ner.*$/i, "").trim();

  const search = (text) => {
    style();
    const panel = document.createElement("div");
    panel.className = "rm-panel";
    panel.style.minWidth = "0";
    panel.style.width = Math.min(520, Math.max(360, text.length * 8)) + "px";
    panel.style.maxWidth = "520px";
    panel.innerHTML = `
      <div class="rm-title">Гуглим</div>
      <div class="rm-row">
        <input class="rm-input" id="q" value="${escape(text)}">
      </div>
      <div class="rm-actions">
        <button class="rm-button" id="ok">🔎</button>
        <div class="rm-center"></div>
        <button class="rm-button" id="cancel">❌</button>
      </div>
    `;
    document.body.appendChild(panel);
    const input = panel.querySelector("#q");
    input.focus();
    input.select();
    panel.querySelector("#ok").onclick = () => {
      const value = input.value.trim();
      if (!value) return;
      const query = `${value} site:onliner.by -inurl:catalog. -inurl:forum. -inurl:baraholka. -inurl:ab.`;
      open(
        `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=nws&tbs=qdr:y,sbd:1`,
        "_blank",
      );
      panel.remove();
    };
    panel.querySelector("#cancel").onclick = () => panel.remove();
  };

  let text = "";
  try {
    text = await navigator.clipboard.readText();
  } catch {}

  let urls = parse(text);

  if (!urls.length) {
    text = prompt("Ссылки или запрос гони:") || "";
    urls = parse(text);
    if (!urls.length && text.trim()) return search(text);
  }

  if (!urls.length) return;

  const title = async (url) => {
    try {
      const r = await fetch(url);
      const d = new DOMParser().parseFromString(await r.text(), "text/html");
      return clean(d.title) || url;
    } catch {
      return url;
    }
  };

  const insert = (links) => {
    const html = `<strong>Читайте также:</strong>\n<ul>\n${links
      .map((l) => `\t<li><a href="${l.url}">${escape(l.text)}</a></li>`)
      .join("\n")}\n</ul>`;
    const pos = content.selectionStart || 0;
    content.value =
      content.value.slice(0, pos) +
      "\n\n" +
      html +
      "\n\n" +
      content.value.slice(pos);
  };

  const links = await Promise.all(
    urls.map(async (url) => ({ url, text: await title(url) })),
  );

  const failed = links.filter((l) => l.text === l.url);
  if (!failed.length) return insert(links);

  style();

  const panel = document.createElement("div");
  panel.id = "readmore-title-panel";
  panel.className = "rm-panel";
  panel.innerHTML =
    failed
      .map((l) => {
        const key = new URL(l.url).hostname.split(".")[0];
        return `<div class="rm-row">
          <button class="rm-button" data-url="${l.url}">${
            sections[key]?.icon || "🔗"
          }</button>
          <input class="rm-input" data-url="${l.url}">
        </div>`;
      })
      .join("") +
    `<div class="rm-actions">
      <button class="rm-button" id="ok">✅</button>
      <div class="rm-center" id="count">0/${failed.length}</div>
      <button class="rm-button" id="cancel">❌</button>
    </div>`;

  document.body.appendChild(panel);

  const inputs = [...panel.querySelectorAll("input")];

  const update = () => {
    const filled = inputs.filter((i) => i.value.trim()).length;
    panel.querySelector("#count").textContent = `${filled}/${inputs.length}`;
  };

  const next = () => inputs.find((i) => !i.value.trim());

  inputs.forEach((input) => {
    input.onclick = () => open(input.dataset.url, "_blank");
    input.oninput = () => {
      update();
      const n = next();
      if (n) {
        n.focus();
        open(n.dataset.url, "_blank");
      }
    };
  });

  panel.querySelectorAll("button[data-url]").forEach((btn) => {
    btn.onclick = () => open(btn.dataset.url, "_blank");
  });

  panel.querySelector("#cancel").onclick = () => panel.remove();

  panel.querySelector("#ok").onclick = () => {
    if (next()) return next().focus();

    inputs.forEach((input) => {
      const link = links.find((l) => l.url === input.dataset.url);
      if (link) link.text = clean(input.value);
    });

    insert(links);
    panel.remove();
  };

  update();
  const first = next();
  if (first) {
    first.focus();
    open(first.dataset.url, "_blank");
  }
})();
