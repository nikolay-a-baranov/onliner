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

const entities = (text) => {
  const protectedText = protect(text);
  protectedText.text = protectedText.text
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;|&#39;/gi, "'");
  return protectedText.restore(protectedText.text);
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
      .replace(
        /<((?!a\b)[a-z][a-z0-9]*)(?:\b[^>]*)>\s*((?:<(?!\/|a\b)[a-z][a-z0-9]*\b[^>]*>\s*)*(?:<a\b[^>]*>\s*)?<img\b[^>]*>(?:\s*<\/a>)?(?:\s*<\/(?!a\b)[a-z][a-z0-9]*>)*)\s*<\/\1>/gi,
        "$2",
      )
      .replace(
        /<(em|strong)>([\s\S]*?)<\1>([\s\S]*?)<\/\1>([\s\S]*?)<\/\1>/gi,
        "<$1>$2$3$4</$1>",
      )
      .replace(/<([a-z][a-z0-9]*)>([ \t]+)<\/\1>/gi, "$2")
      .replace(/<([a-z][a-z0-9]*)>([^<>\n])<\/\1>/gi, "$2")
      .replace(/<(em|strong)>\s*<\1>/gi, "<$1>")
      .replace(/<\/(em|strong)>\s*<\/\1>/gi, "</$1>")
      .replace(/<([a-z][a-z0-9]*)>[ \t]*<\/\1>/gi, "")
      .replace(/<\/([a-z][a-z0-9]*)>[ \t]*<\1>/gi, "");
  }
  return text
    .replace(/[ \t]+(<\/[a-z][a-z0-9]*>)/gi, "$1")
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
    .replace(/([,:;.!?…])(<\/a>)/gi, "$2$1")
    .replace(
      /(<a\b[^>]*>[\s\S]*?<\/a>)([,.!?…])((?:<\/(?:strong|em)>)+)/gi,
      "$1$3$2",
    );
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

const unwrapInline = (text) => {
  let snap = "";
  while (text !== snap) {
    snap = text;
    text = text
      .replace(
        /<(em|strong)>([\s\S]*?)<\1>([\s\S]*?)<\/\1>([\s\S]*?)<\/\1>/gi,
        "<$1>$2$3$4</$1>",
      )
      .replace(/<(em|strong)>\s*<\1>/gi, "<$1>")
      .replace(/<\/(em|strong)>\s*<\/\1>/gi, "</$1>");
  }
  return text;
};

const emphasisPunctuation = "[,.!?…»]";
const speechTail = String.raw`\s+—\s+\p{Ll}`;
const speechLine = new RegExp(
  String.raw`(^|\n)(—[^<\n]+?${emphasisPunctuation})(${speechTail})`,
  "gu",
);
const quotedFragment = "«[^«»<>\\n]+(?:»[.,]|[?!…]»)";
const emphasisMarker = /___EMP\d+___/;
const protectEmphasis = (text) => {
  const parts = [];
  return {
    text: text.replace(
      /<strong><em>[\s\S]*?<\/em><\/strong>|<em><strong>[\s\S]*?<\/strong><\/em>|<em>[\s\S]*?<\/em>/gi,
      (part) => {
        const key = `___EMP${parts.length}___`;
        parts.push(part);
        return key;
      },
    ),
    restore: (text) =>
      text.replace(/___EMP(\d+)___/g, (_, index) => parts[+index]),
  };
};
const emphasizeLine = (line) => {
  if (emphasisMarker.test(line)) return line;
  return line
    .replace(speechLine, "$1<em>$2</em>$3")
    .replace(
      new RegExp(String.raw`(:\s*)(${quotedFragment})`, "g"),
      "$1<em>$2</em>",
    )
    .replace(
      new RegExp(String.raw`^(${quotedFragment})(?=\s*—)`, "g"),
      "<em>$1</em>",
    );
};

const repairEmphasis = (line) =>
  line
    .replace(/([\p{L}]+)<(em|strong)>([\p{L}]+)/gu, "<$2>$1$3")
    .replace(/([\p{L}]+)<\/(em|strong)>([\p{L}]+)/gu, "$1$3</$2>")
    .replace(/\s*<\/em>\s+([А-Яа-яЁё])<em>/gu, "$1")
    .replace(/\n+<\/em>/g, "</em>");

const normalizeInline = (line) =>
  /<\/?em\b/i.test(line) ? repairEmphasis(line) : line;

export const inline = (text) =>
  text
    .split("\n")
    .map((line) => normalizeInline(line))
    .join("\n");

const normalizeInlineMarkup = (line) =>
  /<\/?em\b/i.test(line)
    ? line
    : line
        .replace(
          /(^|\n)(\s*)((?:--?|—|–)\s+)((?:<(?!\/)[a-z][a-z0-9]*\b[^>]*>\s*)+)(?=[^<\n])/gi,
          (_, start, indent, dash, tags) => `${start}${indent}${tags}— `,
        )
        .replace(/(<\/a>)([,.!?…])((?:<\/(?:strong|em)>\s*)+)/gi, "$1$3$2")
        .replace(
          /((?:<\/(?!a\b)[a-z][a-z0-9]*>\s*)+)([»”][,.!?…]?)/gi,
          "$2$1",
        );

export const inlineMarkup = (text) =>
  text
    .split("\n")
    .map((line) => normalizeInlineMarkup(line))
    .join("\n");

export const emphasis = (text) =>
  unwrapInline(
    text
      .split("\n")
      .map((line) => emphasizeLine(line))
      .join("\n"),
  );

export const links = (text) => {
  const pure = (url) => {
    url = decode(url);
    if (
      /^https?:\/\/b2bblog\.onliner\.by\/2018\/01\/01\/specproekty-onliner-by\/?(?:[?#].*)?$/i.test(
        url,
      )
    ) {
      return "https://content.onliner.by/b2b/spec.pdf";
    }
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
      url = url.replace(/([^\/?#])(?=($|[?#]))/, "$1/");
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
const unend = (text) => text.replace(/\s*<!--end-tag-->\s*/gi, "");

const end = (text) => {
  const blocks = unend(text).split("\n\n");
  const plain = (block) => strip(block).replace(/\s+/g, " ").trim();
  const textual = (block) =>
    !!plain(block) &&
    !/^Читайте также:/i.test(plain(block)) &&
    !/\bУНП\b/i.test(plain(block)) &&
    !/^<(?:ul|ol|li|dl|dt|dd|blockquote|img)\b/i.test(block.trim()) &&
    !/^\[(?:onliner-[a-z0-9-]+|video)\b/i.test(block.trim());
  const special =
    /<p\b[^>]*>[\s\S]*?\bУНП\b[\s\S]*?<\/p>/i.test(text) ||
    blocks.some((block) => /^Читайте также:/i.test(plain(block))) ||
    blocks.some((block) => /^\[onliner-[a-z0-9-]+\]/i.test(block.trim()));

  if (!special) return blocks.join("\n\n").trimEnd() + "<!--end-tag-->";

  const index = blocks.reduce(
    (last, block, current) => (textual(block) ? current : last),
    -1,
  );
  if (index === -1) return blocks.join("\n\n").trimEnd() + "<!--end-tag-->";
  blocks[index] = blocks[index].trimEnd() + "<!--end-tag-->";
  return blocks.join("\n\n");
};

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
  const emphasized = protectEmphasis(text);
  if (!embedded) {
    emphasized.text = markup(emphasized.text);
    emphasized.text = entities(emphasized.text);
    emphasized.text = inline(emphasized.text);
    emphasized.text = inlineMarkup(emphasized.text);
    emphasized.text = emphasis(emphasized.text);
    text = emphasized.restore(emphasized.text);
    text = links(text);
    text = more(text);
    text = end(text);
    text = footer(text);
  } else {
    emphasized.text = clean(emphasized.text);
    emphasized.text = widgetMarkup(emphasized.text);
    emphasized.text = entities(emphasized.text);
    emphasized.text = inline(emphasized.text);
    emphasized.text = inlineMarkup(emphasized.text);
    emphasized.text = emphasis(emphasized.text);
    text = emphasized.restore(emphasized.text);
    text = links(text);
    text = stripFooter(unmore(unend(text)));
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
