(async () => {
  const wrap = document.querySelector("#wp-content-wrap");
  if (!wrap.classList.contains("html-active")) {
    document.querySelector("#content-html").click();
    return;
  }

  const content = document.querySelector("#content");
  const sections = {
    people: { icon: "👫🏻", label: "Люди" },
    sport: { icon: "🏅", label: "Спорт" },
    money: { icon: "👛", label: "Кошель" },
    auto: { icon: "🚘", label: "Авто" },
    tech: { icon: "💻", label: "Течь" },
    realt: { icon: "🏙️", label: "Недвига" },
  };

  const section = (url) =>
    sections[new URL(url).hostname.split(".")[0]] || { icon: "🔗", label: "" };
  const parse = (text) =>
    text
      .split(/\s+/)
      .map((url) => url.trim())
      .filter((url) =>
        /^https?:\/\/[^/\s]+\.onliner\.by\/\d{4}\/\d{2}\/\d{2}\//.test(url),
      );

  let text = "";
  try {
    text = await navigator.clipboard.readText();
  } catch {}

  let urls = parse(text);
  if (!urls.length) {
    text = prompt("Ссылки гони:") || "";
    urls = parse(text);
  }
  if (!urls.length) return;

  const escape = (value) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const clean = (value) =>
    value.replace(/\s*[-–—]\s*.*onl[ií]ner.*$/i, "").trim();

  const title = async (url) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      const page = new DOMParser().parseFromString(
        await response.text(),
        "text/html",
      );
      const text = clean(
        page.querySelector("meta[property='og:title']")?.content ||
          page.title ||
          "",
      );
      return text || url;
    } catch {
      return url;
    } finally {
      clearTimeout(timer);
    }
  };

  const insert = (links) => {
    const items = links.map(
      ({ url, text }) =>
        `\t<li><a href="${escape(url)}">${escape(text)}</a></li>`,
    );
    const block = `<strong>Читайте также:</strong>\n<ul>\n${items.join("\n")}\n</ul>`;
    const value = content.value;
    const cursor = content.selectionStart ?? value.length;
    const lineStart = value.lastIndexOf("\n", cursor - 1) + 1;
    const lineEnd = value.indexOf("\n", cursor);
    const end = lineEnd < 0 ? value.length : lineEnd;
    const line = value.slice(lineStart, end);
    const before = value.slice(lineStart, cursor);
    const point = line.trim() && !before.trim() ? lineStart : end;
    const left = value
      .slice(0, point)
      .replace(/[ \t]+$/g, "")
      .replace(/\n*$/g, "");
    const right = value
      .slice(point)
      .replace(/^[ \t]+/g, "")
      .replace(/^\n*/g, "");
    const part = (left ? "\n\n" : "") + block + (right ? "\n\n" : "");
    content.value = left + part + right;
    content.selectionStart = content.selectionEnd = (left + part).length;
    content.focus();
    content.dispatchEvent(new Event("input", { bubbles: true }));
    content.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const links = await Promise.all(
    urls.map(async (url) => ({ url, text: await title(url) })),
  );
  const failed = links.filter((link) => link.text === link.url);
  if (!failed.length) return insert(links);

  document.querySelector("#readmore-panel")?.remove();

  const panel = document.createElement("div");
  panel.id = "readmore-panel";
  panel.style.cssText =
    "position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:999999;background:#fff;border:1px solid #d7d7d7;border-radius:16px;padding:18px;min-width:640px;max-width:780px;box-shadow:0 18px 50px rgba(0,0,0,.28);font:14px 'YS Text Variable',system-ui,Arial,sans-serif;color:#222";
  panel.innerHTML =
    `<style>
      #readmore-panel .rm-row{display:flex;gap:10px;align-items:center;margin:10px 0}
      #readmore-panel .rm-button{width:42px;height:42px;min-width:42px;padding:0;border:1px solid #d2d2d2;border-radius:12px;background:#f8f8f8;display:inline-flex;align-items:center;justify-content:center;font-size:21px;line-height:1;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.05)}
      #readmore-panel .rm-button:hover{background:#efefef;border-color:#bdbdbd}
      #readmore-panel .rm-input{flex:1;height:42px;padding:0 12px;border:1px solid #d2d2d2;border-radius:12px;font:14px 'YS Text Variable',system-ui,Arial,sans-serif;box-sizing:border-box;outline:none}
      #readmore-panel .rm-input:focus{border-color:#888;box-shadow:0 0 0 3px rgba(0,0,0,.06)}
      #readmore-panel .rm-input.rm-ready{border-color:#32a852;box-shadow:0 0 0 3px rgba(50,168,82,.12)}
      #readmore-panel .rm-actions{display:grid;grid-template-columns:42px 1fr 42px;gap:14px;align-items:center;margin-top:16px}
      #readmore-panel .rm-left{text-align:center;font-family:'YS Text Variable',system-ui,Arial,sans-serif;font-weight:700;font-size:34px;line-height:42px}
    </style>` +
    failed
      .map((link) => {
        const data = section(link.url);
        return `<div class="rm-row"><button type="button" class="rm-button" data-url="${escape(link.url)}" title="${escape(data.label)}">${data.icon}</button><input class="rm-input" data-url="${escape(link.url)}"></div>`;
      })
      .join("") +
    `<div class="rm-actions"><button type="button" class="rm-button" id="readmore-apply">✅</button><div class="rm-left" id="readmore-left">0/${failed.length}</div><button type="button" class="rm-button" id="readmore-cancel">❌</button></div>`;

  document.body.appendChild(panel);

  const opened = new Set();
  const inputs = () => [...panel.querySelectorAll("input[data-url]")];

  const update = () => {
    const list = inputs();
    const filled = list.filter((input) => input.value.trim()).length;
    const total = list.length || 1;
    const hue = Math.round((filled / total) * 120);
    const left = panel.querySelector("#readmore-left");
    left.textContent = `${filled}/${total}`;
    left.style.color = `hsl(${hue},70%,38%)`;
    list.forEach((input) =>
      input.classList.toggle("rm-ready", !!input.value.trim()),
    );
  };

  const openUrl = (url, force = false) => {
    if (!force && opened.has(url)) return;
    opened.add(url);
    open(url, "_blank");
  };

  const openInput = (input, force = false) => {
    if (!input || input.value.trim()) return;
    openUrl(input.dataset.url, force);
  };

  const focusNext = () => {
    const input = inputs().find((input) => !input.value.trim());
    if (input) {
      input.focus();
      openInput(input);
    }
  };

  panel.querySelectorAll("button[data-url]").forEach((button) => {
    button.onclick = () => {
      const input = inputs().find(
        (input) => input.dataset.url === button.dataset.url,
      );
      if (input) input.focus();
      openInput(input, true);
    };
  });

  inputs().forEach((input) => {
    input.onclick = () => openInput(input, true);
    input.oninput = () => {
      update();
      if (input.value.trim()) focusNext();
    };
  });

  panel.querySelector("#readmore-cancel").onclick = () => panel.remove();

  panel.querySelector("#readmore-apply").onclick = () => {
    const empty = inputs().find((input) => !input.value.trim());
    if (empty) {
      empty.focus();
      openInput(empty, true);
      update();
      return;
    }
    inputs().forEach((input) => {
      const link = links.find((link) => link.url === input.dataset.url);
      if (link) link.text = clean(input.value.trim());
    });
    insert(links);
    panel.remove();
  };

  update();
  focusNext();
})();
