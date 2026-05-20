import { cms } from "./core/cms.js";
import { dom } from "./core/dom.js";
import { panel as frame } from "./core/panel.js";
import { css } from "./core/css.js";

(async () => {
  const admin =
    location.pathname.includes("/wp-admin/post.php") &&
    new URLSearchParams(location.search).get("action") === "edit";
  const slash = (url) => (url.endsWith("/") ? url : `${url}/`);
  const same = (url) => slash(url.split("#")[0].split("?")[0]);
  const clean = (value) =>
    value.replace(/\s*[-–—]\s*.*onl[ií]ner.*$/i, "").trim();
  if (!admin) {
    const google = location.hostname.includes("google.");
    if (google) {
      const seen = new Set();
      const links = [...document.querySelectorAll("a[href]")]
        .map((link) => {
          let url = link.href;
          try {
            const value = new URL(url);
            url =
              value.searchParams.get("q") ||
              value.searchParams.get("url") ||
              url;
          } catch {}
          return { url: same(url), text: clean(link.textContent || "") };
        })
        .filter((link) =>
          /^https?:\/\/[a-z0-9-]+\.onliner\.by\/\d{4}\/\d{2}\/\d{2}\//i.test(
            link.url,
          ),
        )
        .filter((link) => link.text)
        .filter((link) => {
          if (seen.has(link.url)) return false;
          seen.add(link.url);
          return true;
        });
      if (!links.length) {
        alert("Не нашёл ссылок на Onliner");
        return;
      }
      const picked = [];
      for (const link of links.slice(0, 10)) {
        const ok = confirm(`${link.text}\n\n${link.url}`);
        if (ok) picked.push(link);
      }
      if (picked.length) {
        window.opener?.postMessage(
          { type: "readmore-links", links: picked },
          "*",
        );
      }
      return;
    }
    const title = clean(
      document.querySelector("h1")?.textContent ||
        document.querySelector("meta[property='og:title']")?.content ||
        document.title ||
        "",
    );
    window.addEventListener("message", (event) => {
      if (!/\.?onliner\.by$/.test(new URL(event.origin).hostname)) return;
      if (event.data?.type !== "readmore-next") return;
      if (event.data.close) {
        window.close();
        return;
      }
      if (event.data.url) location.href = event.data.url;
    });
    if (title) {
      window.opener?.postMessage(
        { type: "readmore", url: same(location.href), title },
        "*",
      );
    }
    return;
  }

  const wrap = document.querySelector("#wp-content-wrap");
  if (!wrap.classList.contains("html-active")) {
    cms.editor.html();
    return;
  }

  const content = document.querySelector("#content");

  const style = () => frame.mount("readmore-style", css.readmore.panel());
  const createPanel = ({ id, html, inlineStyle = "" }) =>
    frame.create({
      id,
      className: "panel readmore-panel",
      place: "center",
      html,
      inlineStyle,
    });

  const section = (url) =>
    cms.sections[new URL(url).hostname.split(".")[0]] || {
      icon: "🔗",
      label: "",
    };

  const parse = (text) =>
    [
      ...text.matchAll(
        /https?:\/\/[a-z0-9-]+\.onliner\.by\/\d{4}\/\d{2}\/\d{2}\/[^\s"'<>]+/gi,
      ),
    ].map(([url]) =>
      slash(url.replace(/&amp;/g, "&").replace(/[),.;:!?]+$/g, "")),
    );

  const escape = (value) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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
      .replace(/\n+$/g, "");
    const right = value
      .slice(point)
      .replace(/^[ \t]+/g, "")
      .replace(/^\n+/g, "");
    const part = (left ? "\n\n" : "") + block + (right ? "\n\n" : "");
    content.value = left + part + right;
    content.selectionStart = content.selectionEnd = (left + part).length;
    content.focus();
    dom.dispatch(content, "input");
    dom.dispatch(content, "change");
  };

  let text = "";
  try {
    text = await navigator.clipboard.readText();
  } catch {}

  let urls = parse(text);

  if (!urls.length) {
    text = prompt("Ссылки или погуглим??") || "";
    urls = parse(text);
    if (!urls.length && text.trim()) {
      if (typeof window.readmore === "function")
        window.removeEventListener("message", window.readmore);
      window.readmore = (event) => {
        const host = new URL(event.origin).hostname;
        if (!host.includes("google.")) return;
        if (event.data?.type !== "readmore-links") return;
        const links = event.data.links.filter((link) => link.url && link.text);
        if (links.length) insert(links);
        window.removeEventListener("message", window.readmore);
        window.readmore = null;
      };
      window.addEventListener("message", window.readmore);
      const query = `${text} site:onliner.by`;
      open(
        `https://www.google.com/search?q=${encodeURIComponent(query)}&tbs=qdr:y`,
        "_blank",
      );
      return;
    }
  }
  if (!urls.length) return;

  const title = async (url) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      const page = new DOMParser().parseFromString(
        await response.text(),
        "text/html",
      );
      const value = clean(
        page.querySelector("meta[property='og:title']")?.content ||
          page.title ||
          "",
      );
      return value || url;
    } catch {
      return url;
    } finally {
      clearTimeout(timer);
    }
  };

  const links = await Promise.all(
    urls.map(async (url) => ({ url, text: await title(url) })),
  );
  const failed = links.filter((link) => link.text === link.url);

  if (!failed.length) return insert(links);

  style();
  document.querySelector("#readmore-title-panel")?.remove();

  const panelNode = createPanel({
    id: "readmore-title-panel",
    html:
      failed
        .map((link) => {
          const data = section(link.url);
          return `<div class="readmore-row"><button type="button" class="button button-emoji readmore-button" data-url="${escape(link.url)}" title="${escape(data.label)}">${data.icon}</button><input class="field field-input readmore-input" data-url="${escape(link.url)}"></div>`;
        })
        .join("") +
      `<div class="readmore-actions"><button type="button" class="button button-emoji readmore-button" id="readmore-apply">✔️</button><div class="readmore-center" id="readmore-left">0/${failed.length}</div><button type="button" class="button button-emoji readmore-button" id="readmore-cancel">❌</button></div>`,
  });

  const opened = new Set();
  const inputs = () => [...panelNode.querySelectorAll("input[data-url]")];

  const accept = (data) => {
    if (data?.type === "readmore-links") {
      const found = data.links.filter((link) => link.url && link.text);
      if (found.length) insert(found);
      window.removeEventListener("message", window.readmore);
      window.readmore = null;
      return;
    }
    if (data?.type !== "readmore") return;
    const input = inputs().find(
      (item) => same(item.dataset.url) === same(data.url),
    );
    if (!input || input.value.trim()) return;
    input.value = clean(data.title);
    update();
    const empty = inputs().find((item) => !item.value.trim());
    if (empty) {
      empty.focus();
      data.source?.postMessage(
        { type: "readmore-next", url: same(empty.dataset.url) },
        "*",
      );
      return;
    }
    data.source?.postMessage({ type: "readmore-next", close: true }, "*");
    window.removeEventListener("message", window.readmore);
    window.readmore = null;
    apply();
  };

  if (typeof window.readmore === "function")
    window.removeEventListener("message", window.readmore);
  window.readmore = (event) => {
    const host = new URL(event.origin).hostname;
    if (!/\.?onliner\.by$/.test(host) && !host.includes("google.")) return;
    accept({ ...event.data, source: event.source });
  };
  window.addEventListener("message", window.readmore);

  const update = () => {
    const list = inputs();
    const filled = list.filter((input) => input.value.trim()).length;
    const total = list.length || 1;
    const hue = Math.round((filled / total) * 120);
    const left = panelNode.querySelector("#readmore-left");
    left.textContent = `${filled}/${total}`;
    left.style.color = `hsl(${hue},70%,38%)`;
    list.forEach(
      (input) => (input.dataset.ready = input.value.trim() ? "true" : "false"),
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
    const input = inputs().find((item) => !item.value.trim());
    if (input) {
      input.focus();
      openInput(input);
    }
  };

  const apply = () => {
    const empty = inputs().find((input) => !input.value.trim());
    if (empty) {
      empty.focus();
      openInput(empty, true);
      update();
      return;
    }

    inputs().forEach((input) => {
      const link = links.find((item) => item.url === input.dataset.url);
      if (link) link.text = clean(input.value.trim());
    });

    insert(links);
    panelNode.remove();
  };

  panelNode.querySelectorAll("button[data-url]").forEach((button) => {
    button.onclick = () => {
      const input = inputs().find(
        (item) => item.dataset.url === button.dataset.url,
      );
      if (input) input.focus();
      openInput(input, true);
    };
  });

  inputs().forEach((input) => {
    input.oninput = () => {
      update();
      if (!input.value.trim()) return;
      const empty = inputs().find((item) => !item.value.trim());
      if (empty) {
        empty.focus();
        openInput(empty);
        return;
      }
      apply();
    };
  });

  panelNode.querySelector("#readmore-cancel").onclick = () => panelNode.remove();
  panelNode.querySelector("#readmore-apply").onclick = apply;

  update();
  focusNext();
})();
