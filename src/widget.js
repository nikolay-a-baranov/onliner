(() => {
  const html = document.getElementById("content-html");
  const tmce = document.getElementById("content-tmce");
  const content = document.getElementById("content");
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
  const encoded = (text) =>
    /&#\d+;|&#x[0-9a-f]+;|&lt;|&gt;|&quot;|&amp;#/i.test(text);
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
  const replace = (text, tag, edit) =>
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
  const fields = (text) => {
    const list = [];
    const collect = {
      "onliner-promo-widget": (data) => {
        if (typeof data.text === "string") list.push(data.text);
      },
      "onliner-vote": (data) => {
        data.variants?.forEach((item) => {
          if (typeof item?.description === "string")
            list.push(item.description);
        });
      },
    };
    Object.entries(collect).forEach(([tag, add]) => {
      text.replace(
        new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`, "g"),
        (_, raw) => {
          try {
            add(JSON.parse(raw));
          } catch {}
          return _;
        },
      );
    });
    return list;
  };
  const run = (mode) => {
    const convert = (text) =>
      mode === "decode" ? json(decode(text)) : encode(text);
    let value = content.value;
    const edit = {
      "onliner-promo-widget": (data) => {
        if (typeof data.text === "string") data.text = convert(data.text);
      },
      "onliner-vote": (data) => {
        data.variants?.forEach((item) => {
          if (typeof item?.description === "string")
            item.description = convert(item.description);
        });
      },
    };
    Object.entries(edit).forEach(([tag, change]) => {
      value = replace(value, tag, change);
    });
    content.value = value;
  };
  const toggle = () => {
    run(fields(content.value).some(encoded) ? "decode" : "encode");
  };
  const hook = () => {
    if (tmce && tmce.dataset.widgetHook !== "1") {
      tmce.dataset.widgetHook = "1";
      tmce.addEventListener(
        "click",
        () => {
          if (!fields(content.value).some(encoded)) run("encode");
        },
        true,
      );
    }
  };
  const start = () => {
    toggle();
    hook();
  };
  html?.click();
  setTimeout(start, 0);
})();
