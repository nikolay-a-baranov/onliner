import { entity, widget } from "./escape.js";
import { text } from "./text.js";

const whitespace = {
  inline: "[\\u0020\\u0009]",
  line: "\n",
  block: "\n\n",
  nbsp: {
    char: "\u00A0",
    html: ["&nbsp;", "&#160;"],
  },
  empty: {
    paragraph: /<p>\s*<\/p>/gi,
    lines: /\n{3,}/g,
  },
};

const model = {
  tag: {
    block: [
      "p",
      "div",
      "section",
      "article",
      "aside",
      "blockquote",
      "h[1-6]",
      "ul",
      "ol",
      "li",
      "dl",
      "dt",
      "dd",
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "td",
      "th",
      "figure",
      "figcaption",
    ],
    inline: ["a", "span", "strong", "em", "b", "i", "u", "s", "sup", "sub"],
    single: ["br", "hr", "img"],
    shortcode: {
      onliner: {
        misc: ["onliner-[a-z][a-z0-9-]*"],
        widget: ["onliner-promo-widget", "onliner-vote"],
      },
      media: [
        "video",
        "threads",
        "instagram",
        "tiktok",
        "telegram",
        "before-after",
      ],
    },
  },
  marker: {
    more: "<!--more-->",
    end: "<!--end-tag-->",
  },
  footer: {
    telegram() {
      return {
        marker: /\/newsonliner_bot/i,
        remove(text) {
          return text
            .replace(
              /<p\b[^>]*>[\s\S]*?newsonliner_bot[\s\S]*?(?:<\/p>|(?=<p\b[^>]*>)|$)/gi,
              "",
            )
            .replace(/\s+$/g, "");
        },
        add() {
          return '<p style="text-align: right;"><strong>Есть о чем рассказать? Пишите в наш <a href="https://t.me/newsonliner_bot" target="_blank">телеграм-бот</a>. Это анонимно и быстро</strong></p>';
        },
      };
    },
    copyright() {
      return {
        marker: /mailto:ga@onliner\.by/i,
        remove(text) {
          return text
            .replace(
              /<p\b[^>]*>[\s\S]*?mailto:ga@onliner\.by[\s\S]*?(?:<\/p>|(?=<p\b[^>]*>)|$)/gi,
              "",
            )
            .replace(/\s+$/g, "");
        },
        add() {
          return '<p style="text-align: right;"><span style="font-size: small;"><strong>Перепечатка текста и фотографий Onlíner без разрешения редакции запрещена. <a href="mailto:ga@onliner.by">ga@onliner.by</a></strong></span></p>';
        },
      };
    },
    remove(text) {
      const telegram = this.telegram();
      const copyright = this.copyright();
      return copyright.remove(telegram.remove(text));
    },
    add(text, longread) {
      const telegram = this.telegram();
      const copyright = this.copyright();
      text = this.remove(text);
      text += "\n" + telegram.add();
      if (longread) text += "\n" + copyright.add();
      return text;
    },
  },
  attribute: {
    style: {
      drop: [
        "\\s*text-align:\\s*left;?",
        '\\s*font-size\\s*:\\s*[^";]+;?\\s*',
        "\\s*color\\s*:\\s*#000000;?\\s*",
      ],
    },
    drop: {
      global: [
        "dir",
        "data-start",
        "data-end",
        "data-section-id",
        "data-is-last-node",
        "data-is-only-node",
      ],
    },
  },
  clean: {
    drop: ["span", "br"],
    rename: {
      b: "strong",
      i: "em",
    },
  },
  widget: {
    extract: {
      "onliner-promo-widget": (data) =>
        typeof data.text === "string" ? [data.text] : [],
      "onliner-vote": (data) =>
        (data.variants || [])
          .map((item) => item?.description)
          .filter((value) => typeof value === "string"),
    },
  },
};

const source = {
  group: (items) => items.join("|"),
  shortcode: (name) => String.raw`\[${name}(?:[^\]]*)\][\s\S]*?\[\/${name}\]`,
  shortcodes: (items) =>
    String.raw`\[(?:${source.group(items)})(?:[^\]]*)\][\s\S]*?\[\/(?:${source.group(items)})\]`,
};

const pattern = {
  whitespace: {
    nbsp: String.raw`\u00A0|&nbsp;|&#160;`,
  },
  tag: {
    block: source.group(model.tag.block),
    inline: source.group(model.tag.inline),
    single: source.group(model.tag.single),
    shortcode: {
      all: String.raw`\[([a-z][a-z0-9-]*)(?:[^\]]*)\][\s\S]*?\[\/\1\]`,
      onliner: {
        misc: source.shortcodes(model.tag.shortcode.onliner.misc),
        widget: source.shortcodes(model.tag.shortcode.onliner.widget),
      },
      media: source.shortcodes(model.tag.shortcode.media),
    },
  },
  marker: {
    more: model.marker.more,
    end: model.marker.end,
  },
};

const regex = {
  whitespace: {
    nbsp: new RegExp(pattern.whitespace.nbsp, "gi"),
  },
  tag: {
    block: new RegExp(`</?(?:${pattern.tag.block})\\b[^>]*>`, "gi"),
    shortcode: {
      all: new RegExp(pattern.tag.shortcode.all, "g"),
      onliner: {
        miscMatch: new RegExp(pattern.tag.shortcode.onliner.misc, "i"),
        misc: new RegExp(pattern.tag.shortcode.onliner.misc, "gi"),
        widget: new RegExp(pattern.tag.shortcode.onliner.widget, "gi"),
      },
      media: new RegExp(pattern.tag.shortcode.media, "gi"),
    },
  },
  marker: {
    more: new RegExp(pattern.marker.more, "gi"),
    end: new RegExp(pattern.marker.end, "gi"),
  },
};

const scrub = (string) => {
  model.attribute.style.drop.forEach((value) => {
    string = string.replace(new RegExp(`\\sstyle="${value}"`, "gi"), "");
  });
  model.attribute.drop.global.forEach((name) => {
    string = string.replace(new RegExp(`\\s${name}="[^"]*"`, "gi"), "");
  });
  return string;
};

const widgetText = (tag, raw) => {
  const extract = model.widget.extract[tag];
  if (!extract) return "\u0020";
  try {
    const data = JSON.parse(raw);
    const text = extract(data).join("\u0020").trim();
    return text ? ` ${text} ` : "\u0020";
  } catch {
    return "\u0020";
  }
};

export const clean = (string) =>
  string
    .replace(regex.whitespace.nbsp, "\u0020")
    .replace(
      new RegExp(`</?(?:${source.group(model.clean.drop)})\\b[^>]*>`, "gi"),
      "",
    )
    .replace(/\s+<\/p>/gi, "</p>")
    .replace(whitespace.empty.paragraph, "")
    .replace(/<\/?(b|i)\b[^>]*>/gi, (tag, name) => {
      const next = model.clean.rename[name.toLowerCase()];
      return tag[1] === "/" ? `</${next}>` : `<${next}>`;
    });

export const strip = (html) => {
  const node = document.createElement("textarea");
  html = html
    .replace(
      /\[(onliner-promo-widget|onliner-vote)\]([\s\S]*?)\[\/\1\]/gi,
      (_, tag, raw) => widgetText(tag.toLowerCase(), raw),
    )
    .replace(regex.tag.shortcode.all, (full) =>
      regex.tag.shortcode.onliner.miscMatch.test(full) ? full : "\u0020",
    )
    .replace(/<br\b[^>]*>/gi, "\n")
    .replace(/<hr\b[^>]*\/?>/gi, "\n")
    .replace(/<img\b[^>]*\/?>/gi, "\u0020")
    .replace(regex.tag.block, "\n")
    .replace(/<[^>]+>/g, "\u0020");
  node.innerHTML = html;
  return node.value
    .replace(/\u00A0/g, "\u0020")
    .replace(/[\u0020\u0009]+/g, "\u0020")
    .replace(/\n\s+/g, "\n")
    .replace(/\s+\n/g, "\n")
    .replace(whitespace.empty.lines, whitespace.block)
    .trim();
};

export const protect = (string) => {
  const parts = [];
  const put = (part) => {
    const key = `___PRT${parts.length}___`;
    parts.push(part);
    return key;
  };
  string = string
    .replace(regex.tag.shortcode.all, put)
    .replace(/<[^>]*>/g, put)
    .replace(/\[(\/)?([a-z][a-z0-9-]*)(?:[^\]]*)\]/g, put);
  return {
    text: string,
    restore: (string) =>
      string.replace(/___PRT(\d+)___/g, (_, index) => parts[+index]),
  };
};

const entities = (string) => {
  const protectedText = protect(string);
  protectedText.text = protectedText.text
    .replace(regex.whitespace.nbsp, "\u0020")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;|&#39;/gi, "'");
  return protectedText.restore(protectedText.text);
};

export const markup = (string) => {
  string = scrub(string)
    .replace(/<img\b[^>]*>/gi, (tag) => {
      const src = (tag.match(/\bsrc="([^"]*)"/i) || [, ""])[1];
      const alt = (tag.match(/\balt="([^"]*)"/i) || [, ""])[1];
      return src
        ? `<img class="aligncenter" src="${src}" alt="${alt}" />`
        : tag;
    })
    .replace(/<dl\b[^>]*>/gi, '<dl class="wp-caption aligncenter">');
  let snap = "";
  while (string !== snap) {
    snap = string;
    string = string
      .replace(
        /<((?!a\b|dl\b|dt\b)[a-z][a-z0-9]*)(?:\b[^>]*)>\s*((?:<(?!\/|a\b|dl\b|dt\b)[a-z][a-z0-9]*\b[^>]*>\s*)*(?:<a\b[^>]*>\s*)?<img\b[^>]*>(?:\s*<\/a>)?(?:\s*<\/(?!a\b|dl\b|dt\b)[a-z][a-z0-9]*>)*)\s*<\/\1>/gi,
        "$2",
      )
      .replace(
        /<(em|strong)>([\s\S]*?)<\1>([\s\S]*?)<\/\1>([\s\S]*?)<\/\1>/gi,
        "<$1>$2$3$4</$1>",
      )
      .replace(
        new RegExp(
          `<((?!em\\b|strong\\b)[a-z][a-z0-9]*)>(${whitespace.inline}+)<\\/\\1>`,
          "gi",
        ),
        "$2",
      )
      .replace(/<((?!em\b|strong\b)[a-z][a-z0-9]*)>([^<>\n])<\/\1>/gi, "$2")
      .replace(/<(em|strong)>\s*<\1>/gi, "<$1>")
      .replace(/<\/(em|strong)>\s*<\/\1>/gi, "</$1>")
      .replace(
        new RegExp(
          `<((?!em\\b|strong\\b)[a-z][a-z0-9]*)>${whitespace.inline}*<\\/\\1>`,
          "gi",
        ),
        "",
      )
      .replace(
        new RegExp(`</(em|strong)>(${whitespace.inline}+)<\\1>`, "gi"),
        "$2",
      )
      .replace(/<\/([a-z][a-z0-9]*)><\1>/gi, "");
  }
  return string
    .replace(new RegExp(`${whitespace.inline}+(</[a-z][a-z0-9]*>)`, "gi"), "$1")
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
      /(\[[a-z][a-z0-9-]*(?:[^\]]*)\])\n+(<(?:blockquote|dl|img)\b[^>]*>)/gi,
      "$1$2",
    )
    .replace(
      /(<\/(?:blockquote|dl)>|<img\b[^>]*>)\n+(\[\/[a-z][a-z0-9-]*\])/gi,
      "$1$2",
    )
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
    .replace(
      /\[([a-z][a-z0-9-]*)([^\]]*)\]([\s\S]*?)\[\/\1\]/gi,
      (_, tag, attrs, content) => {
        content = content.replace(/\n{2,}/g, "\n").trim();
        return /<blockquote\b/i.test(content)
          ? `[${tag}${attrs}]\n${content}\n[/${tag}]`
          : `[${tag}${attrs}]${content}[/${tag}]`;
      },
    )
    .replace(/([,:;.!?\u2026])(<\/a>)/gi, "$2$1")
    .replace(
      /(<a\b[^>]*>[\s\S]*?<\/a>)([,.!?\u2026])((?:<\/(?:strong|em)>)+)/gi,
      "$1$3$2",
    );
};

const widgetMarkup = (string) =>
  scrub(string)
    .replace(/<img\b[^>]*>/gi, (tag) => {
      const src = (tag.match(/\bsrc="([^"]*)"/i) || [, ""])[1];
      const alt = (tag.match(/\balt="([^"]*)"/i) || [, ""])[1];
      return src
        ? `<img class="aligncenter" src="${src}" alt="${alt}" />`
        : tag;
    })
    .replace(/<dl\b[^>]*>/gi, '<dl class="wp-caption aligncenter">');

const unwrapInline = (string) => {
  let snap = "";
  while (string !== snap) {
    snap = string;
    string = string
      .replace(
        /<(em|strong)>([\s\S]*?)<\1>([\s\S]*?)<\/\1>([\s\S]*?)<\/\1>/gi,
        "<$1>$2$3$4</$1>",
      )
      .replace(/<(em|strong)>\s*<\1>/gi, "<$1>")
      .replace(/<\/(em|strong)>\s*<\/\1>/gi, "</$1>");
  }
  return string;
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
const protectEmphasis = (string) => {
  const parts = [];
  return {
    text: string.replace(
      /<strong><em>[\s\S]*?<\/em><\/strong>|<em><strong>[\s\S]*?<\/strong><\/em>|<em>[\s\S]*?<\/em>/gi,
      (part) => {
        const key = `___EMP${parts.length}___`;
        parts.push(part);
        return key;
      },
    ),
    restore: (string) =>
      string.replace(/___EMP(\d+)___/g, (_, index) => parts[+index]),
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
const quoteEm = (string, strong = false) =>
  strong ? `<strong><em>${string}</em></strong>` : `<em>${string}</em>`;
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
const quoteParagraphs = (string) =>
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
          .join("\n"))(string.split("\n"))
    : string;

const normalizeInlineParagraphs = (string) =>
  string
    .split("\n")
    .map((line) => {
      const emOnly = line.match(/^\s*((?:<em>[\s\S]*?<\/em>|[ \t])+)\s*$/i);
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
  const merge = (string, tag) =>
    string.replace(
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
        new RegExp(`(?:<${tag}>[\\s\\S]*?<\\/${tag}>\\s*){2,}`, "gi"),
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
      .replace(
        /\s*<\/em>\s+([\u0410-\u042F\u0430-\u044F\u0401\u0451])<em>/gu,
        "$1",
      )
      .replace(/\n+<\/em>/g, "</em>");
  }
  return line;
};

const normalizeInline = (line) =>
  /<\/?em\b/i.test(line) ? repairEmphasis(line) : line;

export const inline = (string) =>
  string
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

export const inlineMarkup = (string) =>
  string
    .split("\n")
    .map((line) => normalizeInlineMarkup(line))
    .join("\n");

export const emphasis = (string) =>
  unwrapInline(
    string
      .split("\n")
      .map((line) => emphasizeLine(line))
      .join("\n"),
  );

export const links = (string) => {
  const pure = (url) => {
    url = entity.decode(url);
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
  string = string.replace(/https?:\/\/[^\s"'<>]+/gi, (url) => pure(url));
  return string.replace(
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

export const more = (string) => {
  let snap;
  do {
    snap = string;
    string = string.replace(
      new RegExp(
        `<([a-z][a-z0-9]*)\\b[^>]*>\\s*(${pattern.marker.more})\\s*<\\/\\1>`,
        "gi",
      ),
      "$2",
    );
  } while (string !== snap);
  string = string.replace(
    new RegExp(`\\s*${pattern.marker.more}\\s*`, "gi"),
    whitespace.block,
  );
  const parts = string.split(whitespace.block);
  const index = parts.findIndex((part) => part.trim());
  if (index !== -1) parts[index] = parts[index].trimEnd() + model.marker.more;
  return parts.join(whitespace.block);
};

const unmore = (string) =>
  string.replace(
    new RegExp(`\\s*${pattern.marker.more}\\s*`, "gi"),
    whitespace.block,
  );
const unend = (string) =>
  string.replace(new RegExp(`\\s*${pattern.marker.end}\\s*`, "gi"), "");

const end = (string) => {
  const blocks = unend(string).split(whitespace.block);
  const plain = (block) => strip(block).replace(/\s+/g, " ").trim();
  const textual = (block) =>
    !!plain(block) &&
    !/^\u0427\u0438\u0442\u0430\u0439\u0442\u0435 \u0442\u0430\u043a\u0436\u0435:/i.test(
      plain(block),
    ) &&
    !/\b\u0423\u041d\u041f\b/i.test(plain(block)) &&
    !/^<(?:ul|ol|li|dl|dt|dd|blockquote|img)\b/i.test(block.trim()) &&
    !/^\[(?:onliner-[a-z0-9-]+|video)\b/i.test(block.trim());
  const special =
    /<p\b[^>]*>[\s\S]*?\b\u0423\u041d\u041f\b[\s\S]*?<\/p>/i.test(string) ||
    blocks.some((block) =>
      /^\u0427\u0438\u0442\u0430\u0439\u0442\u0435 \u0442\u0430\u043a\u0436\u0435:/i.test(
        plain(block),
      ),
    ) ||
    blocks.some((block) => /^\[onliner-[a-z0-9-]+\]/i.test(block.trim()));

  if (!special)
    return blocks.join(whitespace.block).trimEnd() + model.marker.end;

  const index = blocks.reduce(
    (last, block, current) => (textual(block) ? current : last),
    -1,
  );
  if (index === -1)
    return blocks.join(whitespace.block).trimEnd() + model.marker.end;
  blocks[index] = blocks[index].trimEnd() + model.marker.end;
  return blocks.join(whitespace.block);
};

const stripFooterSmart = (string) => model.footer.remove(string);

const appendFooter = (string) => {
  const layout =
    document.querySelector("#layout_select") ||
    document.querySelector('[name="layout"]');
  const longread = layout && /longread/i.test(layout.value);
  return model.footer.add(string, longread);
};

export const footer = appendFooter;

export const breaks = (string) =>
  string
    .replace(/\n{3,}/g, "\n\n")
    .replace(/(^|\n)\s*(<li\b)/gi, "$1\t$2")
    .trim();

export const images = (string) =>
  string.replace(
    /<a\b[^>]*href="https?:\/\/content\.onliner\.by\/news\/large\/[^"]*"[^>]*>\s*(<img\b[^>]*>)\s*<\/a>/gi,
    "$1",
  );

const process = {
  prepare(string) {
    return text.spaces(string);
  },

  inline(string) {
    string = normalizeInlineParagraphs(string);
    string = quoteParagraphs(string);
    const emphasized = protectEmphasis(string);
    emphasized.text = entities(emphasized.text);
    emphasized.text = emphasis(emphasized.text);
    string = emphasized.restore(emphasized.text);
    string = inlineMarkup(string);
    return links(string);
  },

  content(string) {
    string = markup(string);
    string = process.inline(string);
    string = more(string);
    string = end(string);
    return appendFooter(string);
  },

  widget(string) {
    string = clean(string);
    string = widgetMarkup(string);
    string = process.inline(string);
    return stripFooterSmart(unmore(unend(string)));
  },

  finish(string, embedded) {
    string = breaks(string);
    string = widget.transform(string, (value) => rich(value, true));
    const protectedText = protect(string);
    return protectedText.restore(
      embedded
        ? text.run(protectedText.text)
        : text.typography(protectedText.text),
    );
  },
};

export const rich = (string, embedded = false) => {
  string = process.prepare(string);
  string = embedded ? process.widget(string) : process.content(string);
  return process.finish(string, embedded);
};

export const embed = (string) => entity.encode(rich(string, true));

export const content = (string) => {
  let result = rich(string);
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
