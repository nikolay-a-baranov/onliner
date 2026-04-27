import { decode, encode, map } from "./escape.js";
import { spaces, text as textRules, typography } from "./text.js";

export const clean = (text) =>
  text
    .replace(/\u00a0|&nbsp;/gi, " ")
    .replace(/<\/?span\b[^>]*>/gi, "")
    .replace(/<br\s*\/?>/gi, "")
    .replace(/\s+<\/p>/gi, "</p>")
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/<\/?b\b[^>]*>/gi, (tag) =>
      tag[1] === "/" ? "</strong>" : "<strong>",
    )
    .replace(/<\/?i\b[^>]*>/gi, (tag) => (tag[1] === "/" ? "</em>" : "<em>"));

export const strip = (html) => {
  const node = document.createElement("textarea");
  html = html
    .replace(
      /\[onliner-promo-widget\]([\s\S]*?)\[\/onliner-promo-widget\]/gi,
      (_, raw) => {
        try {
          const data = JSON.parse(raw);
          return typeof data.text === "string" ? ` ${data.text} ` : " ";
        } catch {
          return " ";
        }
      },
    )
    .replace(/\[onliner-vote\]([\s\S]*?)\[\/onliner-vote\]/gi, (_, raw) => {
      try {
        const data = JSON.parse(raw);
        return (data.variants || [])
          .map((item) => item?.description)
          .filter((value) => typeof value === "string")
          .join(" ");
      } catch {
        return " ";
      }
    })
    .replace(
      /\[(?!onliner-)([a-z][a-z0-9-]*)(?:[^\]]*)\][\s\S]*?\[\/\1\]/gi,
      " ",
    )
    .replace(/<br\b[^>]*>/gi, "\n")
    .replace(/<hr\b[^>]*\/?>/gi, "\n")
    .replace(/<img\b[^>]*\/?>/gi, " ")
    .replace(
      /<\/?(?:p|div|section|article|aside|blockquote|h[1-6]|ul|ol|li|dl|dt|dd|table|thead|tbody|tfoot|tr|td|th|figure|figcaption)\b[^>]*>/gi,
      "\n",
    )
    .replace(/<[^>]+>/g, " ");
  node.innerHTML = html;
  return node.value
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

export const protect = (text) => {
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

export const markup = (text) => {
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
    .replace(/<h([1-6])>\s*<a\s+name="([^"]+)"\s*><\/a>\s*/gi, '<h$1 id="$2">')
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
    .replace(/([^\n])\s*(<(?:h[1-6]|dl|blockquote|img)\b[^>]*>)/gi, "$1\n\n$2")
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

const widgetMarkup = (text) =>
  text
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

export const inline = (text) =>
  text
    .replace(
      /(^|\n)(\s*)((?:--?|—|–)\s+)((?:<(?!\/)[a-z][a-z0-9]*\b[^>]*>\s*)+)(?=[^<\n])/gi,
      (_, start, indent, dash, tags) => `${start}${indent}${tags}— `,
    )
    .replace(
      /((?:<\/(?!a\b)[a-z][a-z0-9]*>\s*)+)([»”][,.!?…]?|[,.!?…])/gi,
      "$2$1",
    );

export const quotes = (text) =>
  text
    .replace(
      /(:\s*)(?!<em>)(«[^«»<>\n]+»[.,]|«[^«»<>\n]+[?!…]»)/g,
      "$1<em>$2</em>",
    )
    .replace(
      /(^|\n)(?!<em>)(«[^«»<>\n]+»[.,]|«[^«»<>\n]+[?!…]»)(?=\s*—)/g,
      "$1<em>$2</em>",
    );

export const links = (text) => {
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
  return text.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (full, attrs, body) => {
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
  });
};

export const more = (text) => {
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

const unmore = (text) => text.replace(/\s*<!--more-->\s*/gi, "\n\n");

const stripFooter = (text) =>
  text
    .replace(/\n?[^\n]*\/newsonliner_bot[^\n]*анонимно[^\n]*(?=\n|$)/gi, "")
    .replace(
      /\n?[^\n]*без разрешения редакции[^\n]*mailto:ga@onliner\.by[^\n]*(?=\n|$)/gi,
      "",
    )
    .replace(/\s+$/g, "");

export const footer = (text) => {
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
  text = stripFooter(text);
  text += "\n" + telegram;
  if (isLongread()) text += "\n" + copyright;
  return text;
};

export const breaks = (text) =>
  text
    .replace(/\n{3,}/g, "\n\n")
    .replace(/(^|\n)\s*(<li\b)/gi, "$1\t$2")
    .trim();

export const images = (text) =>
  text.replace(
    /<a\b[^>]*href="https?:\/\/content\.onliner\.by\/news\/large\/[^"]*"[^>]*>\s*(<img\b[^>]*>)\s*<\/a>/gi,
    "$1",
  );

export const rich = (text, embedded = false) => {
  text = spaces(text);
  if (!embedded) {
    text = markup(text);
    text = inline(text);
    text = quotes(text);
    text = links(text);
    text = more(text);
    text = footer(text);
  } else {
    text = clean(text);
    text = widgetMarkup(text);
    text = inline(text);
    text = quotes(text);
    text = links(text);
    text = stripFooter(unmore(text));
  }
  text = breaks(text);
  text = map(text, (value) => encode(rich(decode(value), true)));
  const protectedText = protect(text);
  return protectedText.restore(
    embedded
      ? textRules(protectedText.text)
      : typography(protectedText.text),
  );
};

export const widget = (text) => encode(rich(text, true));

export const content = (text) => {
  let result = rich(text);
  if (
    /<a\b[^>]*href="https?:\/\/content\.onliner\.by\/news\/large\/[^"]*"[^>]*>\s*<img\b[^>]*>\s*<\/a>/i.test(
      result,
    ) &&
    confirm("Картинки без ссылок?")
  ) {
    result = images(result);
  }
  return result;
};
