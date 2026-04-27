(() => {
  document.querySelector("#content-html")?.click();
  const fields = [
    { sel: "#title", mode: "plain" },
    { sel: 'input[name="rotation_titles[]"]', mode: "plain", multi: true },
    { sel: "#favourite_title", mode: "plain" },
    { sel: 'input[name="seo_title"]', mode: "plain" },
    { sel: "#post_source", mode: "plain" },
    { sel: "#photo_author", mode: "plain" },
    { sel: "#video_author", mode: "plain" },
    { sel: "#excerpt", mode: "plain" },
    { sel: "#content", mode: "content" },
  ];
  const emit = (element) => {
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const spaces = (text) => {
    text = text
      .replace(/\u00A0/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&#160;/gi, "&#32;");
    let snap;
    do {
      snap = text;
      text = text
        .replace(/((?:<[a-z][a-z0-9]*[^\/>]*>)+)([ \t]+)/gi, "$2$1")
        .replace(/([ \t]+)((?:<\/[a-z][a-z0-9]*>)+)/gi, "$2$1");
    } while (text !== snap);
    return text
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  };
  const markup = (text) => {
    text = text
      .replace(/\sstyle="text-align:\s*left;?"/gi, "")
      .replace(/\sstyle="\s*font-size\s*:\s*[^";]+;?\s*"/gi, "")
      .replace(/\sdir="ltr"/gi, "")
      .replace(/\sdata-start="\d+"/gi, "")
      .replace(/\sdata-end="\d+"/gi, "")
      .replace(/\sdata-is-last-node=""/gi, "")
      .replace(/\sdata-is-only-node=""/gi, "")
      .replace(/<img\b[^>]*>/gi, (tag) => {
        const src = (tag.match(/\bsrc="([^"]*)"/i) || [, ""])[1];
        const alt = (tag.match(/\balt="([^"]*)"/i) || [, ""])[1];
        return src
          ? `<img class="aligncenter" src="${src}" alt="${alt}" />`
          : tag;
      })
      .replace(/<dl\b[^>]*>/gi, '<dl class="wp-caption aligncenter">');
    let snap = "";
    while (text !== snap) {
      snap = text;
      text = text
        .replace(/<([a-z][a-z0-9]*)>([ \t]+)<\/\1>/gi, "$2")
        .replace(/<([a-z][a-z0-9]*)>([^<>\n])<\/\1>/gi, "$2")
        .replace(/<([a-z][a-z0-9]*)>[ \t]*<\/\1>/gi, "")
        .replace(/<\/([a-z][a-z0-9]*)>[ \t]*<\1>/gi, "");
    }
    return text
      .replace(/<\/?p>/g, "\n")
      .replace(/<blockquote>\s*\n+\s*/gi, "<blockquote>")
      .replace(/\s*\n+\s*<\/blockquote>/gi, "</blockquote>")
      .replace(
        /<h([1-6])>\s*<a\s+name="([^"]+)"\s*><\/a>\s*/gi,
        '<h$1 id="$2">',
      )
      .replace(
        /<h([1-6])([^>]*)>\s*<strong>([\s\S]*?)<\/strong>\s*<\/h\1>/gi,
        "<h$1$2>$3</h$1>",
      )
      .replace(
        /<em>\s*<strong>([\s\S]*?)<\/strong>\s*<\/em>/gi,
        "<strong><em>$1</em></strong>",
      )
      .replace(
        /\[([a-z][a-z0-9-]*)([^\]]*)\]\s*([\s\S]*?)\s*\[\/\1\]/g,
        (full, tag, attrs, content) =>
          /<[a-z][\s\S]*>/i.test(content)
            ? `[${tag}${attrs}]${content.replace(/\n+/g, "").trim()}[/${tag}]`
            : full,
      )
      .replace(
        /([^\n])\s*(<(?:h[1-6]|dl|blockquote|img)\b[^>]*>)/gi,
        "$1\n\n$2",
      )
      .replace(/(<\/(?:h[1-6]|dl|blockquote)>)\s*([^\n])/gi, "$1\n\n$2")
      .replace(/(<img\b[^>]*>)\s*(?!<\/(?:a|dt|dl)>)(?=\S)/gi, "$1\n\n")
      .replace(
        /([^\n])(\[([a-z][a-z0-9-]*)(?:[^\]]*)\][\s\S]*?\[\/\3\])/g,
        "$1\n\n$2",
      )
      .replace(
        /(\[([a-z][a-z0-9-]*)(?:[^\]]*)\][\s\S]*?\[\/\2\])([^\n])/g,
        "$1\n\n$3",
      )
      .replace(/([^\n])(<(?:p|ul|ol|li)\b[^>]*>)/gi, "$1\n$2")
      .replace(/(<\/(?:p|ul|ol|li)>)([^\n])/gi, "$1\n$2")
      .replace(/(<(?:dl|dt|a)\b[^>]*>)\n+(<img\b[^>]*>)/gi, "$1$2")
      .replace(/(<img\b[^>]*>)\n+(<\/(?:dt|a|dl)>)/gi, "$1$2")
      .replace(/([,:;.!?…])(<\/a>)/gi, "$2$1");
  };
  const inline = (text) =>
    text
      .replace(
        /(^|\n)(\s*)((?:--?|—|–)\s+)((?:<(?!\/)[a-z][a-z0-9]*\b[^>]*>\s*)+)(?=[^<\n])/gi,
        (_, start, indent, dash, tags) => `${start}${indent}${tags}— `,
      )
      .replace(
        /((?:<\/(?!a\b)[a-z][a-z0-9]*>\s*)+)([»”][,.!?…]?|[,.!?…])/gi,
        "$2$1",
      );
  const quotes = (text) =>
    text
      .replace(
        /(:\s*)(?!<em>)(«[^«»<>\n]+»[.,]|«[^«»<>\n]+[?!…]»)/g,
        "$1<em>$2</em>",
      )
      .replace(
        /(^|\n)(?!<em>)(«[^«»<>\n]+»[.,]|«[^«»<>\n]+[?!…]»)(?=\s*—)/g,
        "$1<em>$2</em>",
      );
  const links = (text) => {
    const pure = (url) => {
      if (/youtube\.com|youtu\.be/i.test(url)) {
        url = url
          .replace(/([?&])si=[^&#]+(&)?/i, (_, sep, tail) =>
            sep === "?" && tail ? "?" : tail ? "&" : "",
          )
          .replace(/\?$/, "")
          .replace(/&$/, "");
      }
      if (/instagram\.com|tiktok\.com/i.test(url)) {
        url = url.replace(/\?.*$/, "");
      }
      return url;
    };
    text = text.replace(/https?:\/\/[^\s"'<>]+/gi, (url) => pure(url));
    return text.replace(
      /<a\b([^>]*)>([\s\S]*?)<\/a>/gi,
      (full, attrs, body) => {
        const href = (attrs.match(/\bhref="([^"]*)"/i) || [, ""])[1];
        if (!href || /^\s*(#|mailto:|tel:)/i.test(href)) return full;
        let url = pure(href);
        const isInternal = /\.onliner\.by(?:\/|$|\?|#)/i.test(url);
        const needsSlash =
          /^https?:\/\/[a-z0-9-]+\.onliner\.by\/\d{4}\/\d{2}\/\d{2}\/[^\/?#]+(?:$|\?|#)/i.test(
            url,
          );
        if (needsSlash) url = url.replace(/([^\/?#])(?=($|[?#]))/, "$1/");
        return isInternal
          ? `<a href="${url}">${body}</a>`
          : `<a href="${url}" target="_blank">${body}</a>`;
      },
    );
  };
  const more = (text) => {
    let snap;
    do {
      snap = text;
      text = text.replace(
        /<([a-z][a-z0-9]*)\b[^>]*>\s*(<!--more-->)\s*<\/\1>/gi,
        "$2",
      );
    } while (text !== snap);
    text = text.replace(/\s*<!--more-->\s*/gi, "\n\n");
    const parts = text.split("\n\n");
    const index = parts.findIndex((part) => part.trim());
    if (index !== -1) parts[index] = parts[index].trimEnd() + "<!--more-->";
    return parts.join("\n\n");
  };
  const footer = (text) => {
    const telegram =
      '<p style="text-align: right;"><strong>Есть о чем рассказать? Пишите в наш <a href="https://t.me/newsonliner_bot" target="_blank">телеграм-бот</a>. Это анонимно и быстро</strong></p>';
    const copyright =
      '<p style="text-align: right;"><span style="font-size: small;"><strong>Перепечатка текста и фотографий Onlíner без разрешения редакции запрещена. <a href="mailto:ga@onliner.by">ga@onliner.by</a></strong></span></p>';
    const isLongread = () => {
      const layout =
        document.querySelector("#layout_select") ||
        document.querySelector('[name="layout"]');
      return layout && /longread/i.test(layout.value);
    };
    text = text
      .replace(/\n?[^\n]*\/newsonliner_bot[^\n]*анонимно[^\n]*(?=\n|$)/gi, "")
      .replace(
        /\n?[^\n]*без разрешения редакции[^\n]*mailto:ga@onliner\.by[^\n]*(?=\n|$)/gi,
        "",
      )
      .replace(/\s+$/g, "");
    text += "\n" + telegram;
    if (isLongread()) text += "\n" + copyright;
    return text;
  };
  const breaks = (text) =>
    text
      .replace(/\n{3,}/g, "\n\n")
      .replace(/(^|\n)\s*(<li\b)/gi, "$1\t$2")
      .trim();
  const protect = (text) => {
    const parts = [];
    const put = (part) => {
      const key = `___PRT${parts.length}___`;
      parts.push(part);
      return key;
    };
    text = text
      .replace(/\[([a-z][a-z0-9-]*)(?:[^\]]*)\][\s\S]*?\[\/\1\]/g, put)
      .replace(/<[^>]*>/g, put)
      .replace(/\[(\/)?([a-z][a-z0-9-]*)(?:[^\]]*)\]/g, put);
    return {
      text,
      restore: (text) =>
        text.replace(/___PRT(\d+)___/g, (_, index) => parts[+index]),
    };
  };
  const typography = (text) => {
    text = text
      .replace(/\bOnliner\b/g, "Onlíner")
      .replace(/\.{3}/g, "…")
      .replace(/“([^“”\n]*)”/g, "«$1»");
    const D = "[-–—]";
    const S = "[ \\t]";
    const C = "[^ \\t\\n]";
    text = text
      .replace(new RegExp(`(${S})${D}+(${S})`, "g"), "$1—$2")
      .replace(new RegExp(`(${C})${D}{2,}(${C})`, "g"), "$1—$2")
      .replace(new RegExp(`(${C})${D}+(${S})`, "g"), "$1—$2")
      .replace(new RegExp(`(${S})${D}+(${C})`, "g"), "$1—$2");
    let open = true;
    text = text.replace(/"/g, () => {
      const quote = open ? "«" : "»";
      open = !open;
      return quote;
    });
    let snap;
    do {
      snap = text;
      text = text.replace(/«([^«»\n]*)«([^«»\n]+)»([^«»\n]*)»/g, "«$1„$2“$3»");
    } while (text !== snap);
    return text;
  };
  const unwrap = (text) =>
    text.replace(
      /<a\b[^>]*href="https?:\/\/content\.onliner\.by\/news\/large\/[^"]*"[^>]*>\s*(<img\b[^>]*>)\s*<\/a>/gi,
      "$1",
    );
  const plain = (text) => typography(spaces(text));
  const rich = (text) => {
    const protectedText = protect(
      breaks(footer(more(links(quotes(inline(markup(spaces(text)))))))),
    );
    return protectedText.restore(typography(protectedText.text));
  };
  const contentMode = (text) => {
    let result = rich(text);
    if (
      /<a\b[^>]*href="https?:\/\/content\.onliner\.by\/news\/large\/[^"]*"[^>]*>\s*<img\b[^>]*>\s*<\/a>/i.test(
        result,
      ) &&
      confirm("Картинки без ссылок?")
    ) {
      result = unwrap(result);
    }
    return result;
  };
  const elements = (field) => {
    const list = Array.from(document.querySelectorAll(field.sel));
    return field.multi ? list : list.slice(0, 1);
  };
  fields.forEach((field) => {
    elements(field).forEach((element) => {
      const source = element.value || "";
      const result =
        field.mode === "content" ? contentMode(source) : plain(source);
      if (result !== source) {
        element.value = result;
        emit(element);
      }
    });
  });
})();
