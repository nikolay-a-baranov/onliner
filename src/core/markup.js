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
      .replace(/<((?!em\b|strong\b)[a-z][a-z0-9]*)>([ \t]+)<\/\1>/gi, "$2")
      .replace(/<((?!em\b|strong\b)[a-z][a-z0-9]*)>([^<>\n])<\/\1>/gi, "$2")
      .replace(/<(em|strong)>\s*<\1>/gi, "<$1>")
      .replace(/<\/(em|strong)>\s*<\/\1>/gi, "</$1>")
      .replace(/<((?!em\b|strong\b)[a-z][a-z0-9]*)>[ \t]*<\/\1>/gi, "")
      .replace(/<\/(em|strong)>([ \t]+)<\1>/gi, "$2")
      .replace(/<\/([a-z][a-z0-9]*)><\1>/gi, "");
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
    .replace(/([,:;.!?\u2026])(<\/a>)/gi, "$2$1")
    .replace(
      /(<a\b[^>]*>[\s\S]*?<\/a>)([,.!?\u2026])((?:<\/(?:strong|em)>)+)/gi,
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

const emphasisPunctuation = "[,.!?\\u2026\\u00BB]";
const speechTail = String.raw`\s+\u2014\s+\p{Ll}`;
const speechLine = new RegExp(
  String.raw`(^|\n)(\u2014[^<\n]+?${emphasisPunctuation})(${speechTail})`,
  "gu",
);
const quotedFragment =
  "\\u00AB[^\\u00AB\\u00BB<>\\n]+(?:\\u00BB[.,]|[?!\\u2026]\\u00BB)";
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
      new RegExp(String.raw`^(${quotedFragment})(?=\s*\u2014)`, "g"),
      "<em>$1</em>",
    );
};

const quoteParagraphsEnabled = true;
const quoteView = (line) =>
  strip(line.replace(/<\/?(?:em|strong)\b[^>]*>/gi, ""))
    .replace(/\s+/g, " ")
    .trim();
const quoteBody = (line) =>
  line.replace(/<\/?(?:em|strong)\b[^>]*>/gi, "").trim();
const quoteEm = (text, strong = false) =>
  strong ? `<strong><em>${text}</em></strong>` : `<em>${text}</em>`;
const quoteLine = (line, strong = false) => {
  if (!/^\u2014(?:\s|["\u00AB\u201E]|$)/.test(quoteView(line))) return line;
  const body = quoteBody(line);
  const split = body.match(
    /^(\u2014[\s\S]*?[,.!?\u2026\u00BB])(\s+\u2014\s+\p{Ll}[\s\S]*?)([,.!?\u2026]\s+\u2014\s+)([\s\S]+)$/u,
  );
  if (split) {
    return `${quoteEm(split[1], strong)}${split[2]}${split[3]}${quoteEm(split[4])}`;
  }
  const tail = body.match(
    /^(\u2014[\s\S]*?[,.!?\u2026\u00BB])(\s+\u2014\s+\p{Ll}[\s\S]*)$/u,
  );
  if (tail) return `${quoteEm(tail[1], strong)}${tail[2]}`;
  return quoteEm(body, strong);
};
const quoteParagraphs = (text) =>
  quoteParagraphsEnabled
    ? ((lines) =>
        lines
          .map((line, index) => {
            const current = quoteView(line);
            const next = lines
              .slice(index + 1)
              .map((item) => quoteView(item))
              .find(Boolean);
            const strong =
              /^\u2014/.test(current) &&
              /\?\s*$/.test(current) &&
              /^\u2014/.test(next || "");
            return quoteLine(line, strong);
          })
          .join("\n"))(text.split("\n"))
    : text;

const normalizeInlineParagraphs = (text) =>
  text
    .split("\n")
    .map((line) => {
      const emOnly = line.match(
        /^\s*((?:<em>[\s\S]*?<\/em>|[ \t])+)\s*$/i,
      );
      if (emOnly && /<em>/i.test(emOnly[1])) {
        return `<em>${emOnly[1].replace(/<\/?em>/gi, "")}</em>`;
      }
      const strongOnly = line.match(
        /^\s*((?:<strong>[\s\S]*?<\/strong>|[ \t])+)\s*$/i,
      );
      if (strongOnly && /<strong>/i.test(strongOnly[1])) {
        return `<strong>${strongOnly[1].replace(/<\/?strong>/gi, "")}</strong>`;
      }
      return line;
    })
    .join("\n");

const mergeInlineRuns = (line) => {
  const merge = (text, tag) =>
    text.replace(
      new RegExp(
        `<${tag}>[\\s\\S]*?<\\/${tag}>(?:[\\u0020\\u0009]*<${tag}>[\\s\\S]*?<\\/${tag}>)+`,
        "gi",
      ),
      (chunk) =>
        `<${tag}>${chunk.replace(new RegExp(`</?${tag}>`, "gi"), "")}</${tag}>`,
    );
  line = merge(line, "em");
  line = merge(line, "strong");
  return line;
};

const unwrapSingleEmphasisLine = (line) => {
  if (/^(?:\s*<em>[\s\S]*?<\/em>\s*)+$/i.test(line)) {
    return `<em>${line.replace(/<\/?em>/gi, "")}</em>`;
  }
  if (/^(?:\s*<strong>[\s\S]*?<\/strong>\s*)+$/i.test(line)) {
    return `<strong>${line.replace(/<\/?strong>/gi, "")}</strong>`;
  }
  return line;
};

const unwrapNestedSameTag = (line) =>
  line.replace(
    /^\s*<(em|strong)>([\s\S]*)<\/\1>\s*$/i,
    (_, tag, body) =>
      `<${tag}>${body.replace(new RegExp(`</?${tag}>`, "gi"), "")}</${tag}>`,
  );

const unwrapSameTagIslands = (line) =>
  ["em", "strong"].reduce(
    (result, tag) =>
      result.replace(
        new RegExp(
          `(?:<${tag}>[\\s\\S]*?<\\/${tag}>\\s*){2,}`,
          "gi",
        ),
        (chunk) => {
          const space = /\s+$/.test(chunk) ? chunk.match(/\s+$/)[0] : "";
          return `<${tag}>${chunk.replace(new RegExp(`</?${tag}>`, "gi"), "").trimEnd()}</${tag}>${space}`;
        },
      ),
    line,
  );

const repairEmphasis = (line) => {
  line = unwrapSameTagIslands(line);
  line = unwrapNestedSameTag(line);
  line = unwrapSingleEmphasisLine(line);
  let snap = "";
  while (line !== snap) {
    snap = line;
    line = mergeInlineRuns(line)
      .replace(/<(em|strong)>([\u0020\u0009]+)<\/\1>/gi, "$2")
      .replace(/<(em|strong)>\s*<\/\1>/gi, "")
      .replace(/<\/(em|strong)>([\u0020\u0009]+)<\1>/gi, "$2")
      .replace(/<\/(em|strong)><\1>/gi, "")
      .replace(/([\p{L}]+)<(em|strong)>([\p{L}]+)/gu, "<$2>$1$3")
    .replace(/([\p{L}]+)<\/(em|strong)>([\p{L}]+)/gu, "$1$3</$2>")
    .replace(/\s*<\/em>\s+([\u0410-\u042F\u0430-\u044F\u0401\u0451])<em>/gu, "$1")
    .replace(/\n+<\/em>/g, "</em>");

  }
  return line;
};

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
          /(^|\n)(\s*)((?:--?|\u2014|\u2013)\s+)((?:<(?!\/)[a-z][a-z0-9]*\b[^>]*>\s*)+)(?=[^<\n])/gi,
          (_, start, indent, dash, tags) => `${start}${indent}${tags}\u2014 `,
        )
        .replace(/(<\/a>)([,.!?\u2026])((?:<\/(?:strong|em)>\s*)+)/gi, "$1$3$2")
        .replace(
          /((?:<\/(?!a\b)[a-z][a-z0-9]*>\s*)+)([\u00BB\u201D][,.!?\u2026]?)/gi,
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
    !/^\u0427\u0438\u0442\u0430\u0439\u0442\u0435 \u0442\u0430\u043a\u0436\u0435:/i.test(plain(block)) &&
    !/\b\u0423\u041d\u041f\b/i.test(plain(block)) &&
    !/^<(?:ul|ol|li|dl|dt|dd|blockquote|img)\b/i.test(block.trim()) &&
    !/^\[(?:onliner-[a-z0-9-]+|video)\b/i.test(block.trim());
  const special =
    /<p\b[^>]*>[\s\S]*?\b\u0423\u041d\u041f\b[\s\S]*?<\/p>/i.test(text) ||
    blocks.some((block) =>
      /^\u0427\u0438\u0442\u0430\u0439\u0442\u0435 \u0442\u0430\u043a\u0436\u0435:/i.test(plain(block)),
    ) ||
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


const stripFooterSmart = (text) => {
  const telegramStart =
    /^\u0415\u0441\u0442\u044c \u043e \u0447\u0435\u043c \u0440\u0430\u0441\u0441\u043a\u0430\u0437\u0430\u0442\u044c\?/i;
  const copyrightStart =
    /^\u041f\u0435\u0440\u0435\u043f\u0435\u0447\u0430\u0442\u043a\u0430 \u0442\u0435\u043a\u0441\u0442\u0430/i;
  return text
    .replace(
      /<p\b[^>]*>[\s\S]*?newsonliner_bot[\s\S]*?(?:<\/p>|(?=<p\b[^>]*>)|$)/gi,
      "",
    )
    .replace(
      /<p\b[^>]*>[\s\S]*?mailto:ga@onliner\.by[\s\S]*?(?:<\/p>|(?=<p\b[^>]*>)|$)/gi,
      "",
    )
    .split("\n\n")
    .filter((block) => {
      const plain = strip(block).replace(/\s+/g, " ").trim();
      const telegram =
        /\/newsonliner_bot/i.test(block) && telegramStart.test(plain);
      const copyright =
        /mailto:ga@onliner\.by/i.test(block) && copyrightStart.test(plain);
      return !telegram && !copyright;
    })
    .join("\n\n")
    .replace(/\s+$/g, "");
};

const footerTelegram =
  '<p style="text-align: right;"><strong>\u0415\u0441\u0442\u044c \u043e \u0447\u0435\u043c \u0440\u0430\u0441\u0441\u043a\u0430\u0437\u0430\u0442\u044c? \u041f\u0438\u0448\u0438\u0442\u0435 \u0432 \u043d\u0430\u0448 <a href="https://t.me/newsonliner_bot" target="_blank">\u0442\u0435\u043b\u0435\u0433\u0440\u0430\u043c-\u0431\u043e\u0442</a>. \u042d\u0442\u043e \u0430\u043d\u043e\u043d\u0438\u043c\u043d\u043e \u0438 \u0431\u044b\u0441\u0442\u0440\u043e</strong></p>';

const footerCopyright =
  '<p style="text-align: right;"><span style="font-size: small;"><strong>\u041f\u0435\u0440\u0435\u043f\u0435\u0447\u0430\u0442\u043a\u0430 \u0442\u0435\u043a\u0441\u0442\u0430 \u0438 \u0444\u043e\u0442\u043e\u0433\u0440\u0430\u0444\u0438\u0439 Onl\u00edner \u0431\u0435\u0437 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043d\u0438\u044f \u0440\u0435\u0434\u0430\u043a\u0446\u0438\u0438 \u0437\u0430\u043f\u0440\u0435\u0449\u0435\u043d\u0430. <a href="mailto:ga@onliner.by">ga@onliner.by</a></strong></span></p>';

const appendFooter = (text) => {
  const layout =
    document.querySelector("#layout_select") ||
    document.querySelector('[name="layout"]');
  const longread = layout && /longread/i.test(layout.value);
  text = stripFooterSmart(text);
  text += "\n" + footerTelegram;
  if (longread) text += "\n" + footerCopyright;
  return text;
};


export const footer = appendFooter;

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
    text = normalizeInlineParagraphs(text);
    text = quoteParagraphs(text);
    const emphasized = protectEmphasis(text);
    emphasized.text = entities(emphasized.text);
    emphasized.text = emphasis(emphasized.text);
    text = emphasized.restore(emphasized.text);
    text = inlineMarkup(text);
    text = links(text);
    text = more(text);
    text = end(text);
    text = appendFooter(text);
  } else {
    text = clean(text);
    text = widgetMarkup(text);
    text = normalizeInlineParagraphs(text);
    text = quoteParagraphs(text);
    const emphasized = protectEmphasis(text);
    emphasized.text = entities(emphasized.text);
    emphasized.text = emphasis(emphasized.text);
    text = emphasized.restore(emphasized.text);
    text = inlineMarkup(text);
    text = links(text);
    text = stripFooterSmart(unmore(unend(text)));
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
    confirm(
      "\u041a\u0430\u0440\u0442\u0438\u043d\u043a\u0438 \u0431\u0435\u0437 \u0441\u0441\u044b\u043b\u043e\u043a?",
    )
  ) {
    result = images(result);
  }
  return result;
};
