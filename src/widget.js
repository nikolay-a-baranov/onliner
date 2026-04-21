(() => {
  const content = document.getElementById("content");
  const html = document.getElementById("content-html");
  const tmce = document.getElementById("content-tmce");
  const wrap = document.getElementById("wp-content-wrap");

  if (!content) return;

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

  const encode = (text) =>
    Array.from(text, (char) => `&#${char.codePointAt(0)};`).join("");

  const json = (text) =>
    text
      .replace(/<\/?span\b[^>]*>/gi, "")
      .replace(/<br\s*\/?>/gi, "")
      .replace(/&nbsp;|\u00a0/gi, " ")
      .replace(/\s+<\/p>/gi, "</p>")
      .replace(/<p>\s*<\/p>/gi, "");

  const encoded = (text) =>
    /&#\d+;|&#x[0-9a-f]+;|&lt;|&gt;|&quot;|&amp;#/i.test(text);

  const fields = (text) => {
    const list = [];
    text.replace(/\[onliner-promo-widget\]([\s\S]*?)\[\/onliner-promo-widget\]/g, (_, raw) => {
        try {
          const data = JSON.parse(raw);
          if (typeof data.text === "string") {
            list.push(data.text);
          }
        } catch {}
        return _;
      },
    );
    text.replace(/\[onliner-vote\]([\s\S]*?)\[\/onliner-vote\]/g, (_, raw) => {
        try {
          const data = JSON.parse(raw);
          data.variants?.forEach((item) => {
            if (typeof item?.description === "string") {
              list.push(item.description);
            }
          });
        } catch {}
        return _;
      },
    );
    return list;
  };

  const replace = (text, tag, edit) =>
    text.replace(new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`, "g"), (full, raw) => {
        try {
          const data = JSON.parse(raw);
          edit(data);
          return `[${tag}]${JSON.stringify(data)}[/${tag}]`;
        } catch {
          return full;
        }
      },
    );

  const run = (mode) => {
    const convert = (text) =>
      mode === "decode" ? json(decode(text)) : encode(text);
    let value = content.value;
    value = replace(value, "onliner-promo-widget", (data) => {
      if (typeof data.text === "string") {
        data.text = convert(data.text);
      }
    });

    value = replace(value, "onliner-vote", (data) => {
      data.variants?.forEach((item) => {
        if (typeof item?.description === "string") {
          item.description = convert(item.description);
        }
      });
    });
    content.value = value;
  };

  const toggle = () => {
    const hasEncoded = fields(content.value).some(encoded);
    run(hasEncoded ? "decode" : "encode");
  };

  const hook = () => {
    if (tmce && tmce.dataset.widgetHook !== "1") {
      tmce.dataset.widgetHook = "1";
      tmce.addEventListener(
        "click",
        () => {
          const hasEncoded = fields(content.value).some(encoded);
          if (!hasEncoded) {
            run("encode");
          }
        },
        true,
      );
    }
  };

  const start = () => {
    toggle();
    hook();
  };

  if (wrap && !/\bhtml-active\b/.test(wrap.className) && html) {
    html.click();
    setTimeout(start, 0);
  } else {
    start();
  }
})();
