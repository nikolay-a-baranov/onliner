import { entity } from "./escape.js";

export const markup = {
  helper: {
    pipe(value, ...steps) {
      return steps.reduce((result, step) => step(result), value);
    },
    regex(pattern, replacement = "", flags = "gi") {
      return [new RegExp(pattern, flags), replacement];
    },
    replace(string, rules) {
      return rules.reduce(
        (result, [from, to]) => result.replace(from, to),
        string,
      );
    },
  },

  token: {
    whitespace: {
      space: "\u0020",
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
    },
    inline: {
      speech: {
        punctuation: "[,.!?\\u2026\\u00BB]",
        tail: String.raw`\s+\u2014\s+\p{Ll}`,
        fragment:
          "\\u00AB[^\\u00AB\\u00BB<>\\n]+(?:\\u00BB[.,]|[?!\\u2026]\\u00BB)",
      },
      marker: {
        emphasis: /___EMP\d+___/,
      },
      option: {
        enabled: true,
      },
    },
    phrase: {
      readmore: "Читайте также:",
      collab: "УНП",
      telegram:
        '<p style="text-align: right;"><strong>Есть о чем рассказать? Пишите в наш <a href="https://t.me/newsonliner_bot" target="_blank">телеграм-бот</a>. Это анонимно и быстро</strong></p>',
      copyright:
        '<p style="text-align: right;"><span style="font-size: small;"><strong>Перепечатка текста и фотографий Onlíner без разрешения редакции запрещена. <a href="mailto:ga@onliner.by">ga@onliner.by</a></strong></span></p>',
    },
  },

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

  remove: {
    attributes: {
      global: [
        "dir",
        "data-start",
        "data-end",
        "data-section-id",
        "data-is-last-node",
        "data-is-only-node",
      ],
      style: [
        "\\s*text-align:\\s*left;?",
        '\\s*font-size\\s*:\\s*[^";]+;?\\s*',
        "\\s*color\\s*:\\s*#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?;?\\s*",
      ],
      run(string) {
        const attrs = markup.remove.attributes.global.map((item) =>
          markup.helper.regex(`\\s${item}="[^"]*"`, ""),
        );
        const styles = markup.remove.attributes.style.map((item) =>
          markup.helper.regex(`\\sstyle="${item}"`, ""),
        );
        return markup.helper.replace(string, [...styles, ...attrs]);
      },
    },
    tags: {
      single: ["br"],
      paired: ["span"],
      run(string) {
        string = markup.helper.replace(string, [
          [markup.regex.whitespace.nbsp, markup.token.whitespace.space],
        ]);
        string = markup.helper.replace(
          string,
          markup.remove.tags.single.map((item) =>
            markup.helper.regex(`</?${item}\\b[^>]*>`, ""),
          ),
        );
        let snap = "";
        while (string !== snap) {
          snap = string;
          markup.remove.tags.paired.forEach((item) => {
            string = markup.helper.replace(string, [
              [
                new RegExp(`<${item}>\\s*([\\s\\S]*?)\\s*<\\/${item}>`, "gi"),
                (_, content) => content,
              ],
            ]);
          });
        }
        return markup.helper.replace(string, [
          [/\s+<\/p>/gi, "</p>"],
          [markup.token.whitespace.empty.paragraph, ""],
        ]);
      },
    },
    run(string) {
      return markup.helper.pipe(
        string,
        markup.remove.attributes.run,
        markup.remove.tags.run,
        markup.rename.run,
      );
    },
  },

  rename: {
    tags: {
      b: "strong",
      i: "em",
    },
    run(string) {
      return string.replace(/<\/?(b|i)\b[^>]*>/gi, (tag, name) => {
        const next = markup.rename.tags[name.toLowerCase()];
        return tag[1] === "/" ? `</${next}>` : `<${next}>`;
      });
    },
  },

  flatten: {
    run(line) {
      const islands = markup.inline.unwrapSameTagIslands;
      const nested = markup.inline.unwrapNestedSameTag;
      const single = markup.inline.unwrapSingleLine;
      const inlineWs = markup.token.whitespace.inline;
      line = markup.helper.pipe(line, islands, nested, single);
      let snap = "";
      while (line !== snap) {
        snap = line;
        line = markup.inline
          .mergeRuns(line)
          .replace(
            new RegExp(`<([a-z][a-z0-9]*)>(${inlineWs}+)<\\/\\1>`, "gi"),
            "$2",
          )
          .replace(/<(em|strong)>\s*<\/\1>/gi, "")
          .replace(
            new RegExp(`</([a-z][a-z0-9]*)>(${inlineWs}+)<\\1>`, "gi"),
            "$2",
          )
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
    },
  },

  reconcile: {
    marker: {
      more: "<!--more-->",
      unmore(string) {
        return markup.helper.replace(string, [
          markup.helper.regex(
            `\\s*${markup.reconcile.marker.more}\\s*`,
            markup.token.whitespace.block,
          ),
        ]);
      },
      more(string) {
        let snap;
        do {
          snap = string;
          string = string.replace(
            new RegExp(
              `<([a-z][a-z0-9]*)\\b[^>]*>\\s*(${markup.reconcile.marker.more})\\s*<\\/\\1>`,
              "gi",
            ),
            "$2",
          );
        } while (string !== snap);
        string = markup.helper.replace(string, [
          markup.helper.regex(
            `\\s*${markup.reconcile.marker.more}\\s*`,
            markup.token.whitespace.block,
          ),
        ]);
        const parts = string.split(markup.token.whitespace.block);
        const index = parts.findIndex((part) => part.trim());
        if (index !== -1) {
          parts[index] = parts[index].trimEnd() + markup.reconcile.marker.more;
        }
        return parts.join(markup.token.whitespace.block);
      },
      end: "<!--end-tag-->",
      unend(string) {
        return markup.helper.replace(string, [
          markup.helper.regex(`\\s*${markup.reconcile.marker.end}\\s*`, ""),
        ]);
      },
      end(string) {
        const blocks = markup.reconcile.marker
          .unend(string)
          .split(markup.token.whitespace.block);
        const plain = (block) =>
          markup.transform.strip(block).replace(/\s+/g, " ").trim();
        const textual = (block) =>
          !!plain(block) &&
          !new RegExp(`^${markup.token.phrase.readmore}`, "i").test(
            plain(block),
          ) &&
          !new RegExp(`\\b${markup.token.phrase.collab}\\b`, "i").test(
            plain(block),
          ) &&
          !/^<(?:ul|ol|li|dl|dt|dd|blockquote|img)\b/i.test(block.trim()) &&
          !/^\[(?:onliner-[a-z0-9-]+|video)\b/i.test(block.trim());
        const special =
          new RegExp(
            `<p\\b[^>]*>[\\s\\S]*?\\b${markup.token.phrase.collab}\\b[\\s\\S]*?<\\/p>`,
            "i",
          ).test(string) ||
          blocks.some((block) =>
            new RegExp(`^${markup.token.phrase.readmore}`, "i").test(
              plain(block),
            ),
          ) ||
          blocks.some((block) => /^\[onliner-[a-z0-9-]+\]/i.test(block.trim()));
        if (!special) {
          return (
            blocks.join(markup.token.whitespace.block).trimEnd() +
            markup.reconcile.marker.end
          );
        }
        const index = blocks.reduce(
          (last, block, current) => (textual(block) ? current : last),
          -1,
        );
        if (index === -1) {
          return (
            blocks.join(markup.token.whitespace.block).trimEnd() +
            markup.reconcile.marker.end
          );
        }
        blocks[index] = blocks[index].trimEnd() + markup.reconcile.marker.end;
        return blocks.join(markup.token.whitespace.block);
      },
      run(string) {
        return markup.helper.pipe(
          string,
          markup.reconcile.marker.more,
          markup.reconcile.marker.end,
        );
      },
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
            return markup.token.phrase.telegram;
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
            return markup.token.phrase.copyright;
          },
        };
      },
      remove(text) {
        const telegram = markup.reconcile.footer.telegram();
        const copyright = markup.reconcile.footer.copyright();
        return copyright.remove(telegram.remove(text));
      },
      add(text, longread) {
        const telegram = markup.reconcile.footer.telegram();
        const copyright = markup.reconcile.footer.copyright();
        text = markup.reconcile.footer.remove(text);
        text += "\n" + telegram.add();
        if (longread) {
          text += "\n" + copyright.add();
        }
        return text;
      },
      layout() {
        return (
          document.querySelector("#layout_select") ||
          document.querySelector('[name="layout"]')
        );
      },
      apply(text) {
        const layout = markup.reconcile.footer.layout();
        const copyright =
          layout && /(longread|photoreport)/i.test(layout.value);
        return markup.reconcile.footer.add(text, copyright);
      },
      replace(string) {
        return markup.reconcile.footer.apply(string);
      },
    },
    clear(string) {
      return markup.helper.pipe(
        string,
        markup.reconcile.marker.unend,
        markup.reconcile.marker.unmore,
        markup.reconcile.footer.remove,
      );
    },
    images(string) {
      if (
        !/<a\b[^>]*href="https?:\/\/content\.onliner\.by\/news\/large\/[^"]*"[^>]*>\s*<img\b[^>]*>\s*<\/a>/i.test(
          string,
        )
      ) {
        return string;
      }
      return confirm("Картинки без ссылок?")
        ? markup.html.images(string)
        : string;
    },
  },

  format: {
    image(tag) {
      const src = (tag.match(/\bsrc="([^"]*)"/i) || [, ""])[1];
      const alt = (tag.match(/\balt="([^"]*)"/i) || [, ""])[1];
      return src
        ? `<img class="aligncenter" src="${src}" alt="${alt}" />`
        : tag;
    },
    content(string) {
      return markup.html.content(string);
    },
    widget(string) {
      return markup.html.widget(string);
    },
  },
  transform: {
    clean(string) {
      return markup.remove.tags.run(string);
    },
    strip(html) {
      const node = document.createElement("textarea");
      html = html
        .replace(
          /\[(onliner-promo-widget|onliner-vote)\]([\s\S]*?)\[\/\1\]/gi,
          (_, tag, raw) => markup.widget.text(tag.toLowerCase(), raw),
        )
        .replace(markup.regex.tag.shortcode.all, (full) =>
          markup.regex.tag.shortcode.onliner.miscMatch.test(full)
            ? full
            : markup.token.whitespace.space,
        )
        .replace(/<br\b[^>]*>/gi, "\n")
        .replace(/<hr\b[^>]*\/?>/gi, "\n")
        .replace(/<img\b[^>]*\/?>/gi, markup.token.whitespace.space)
        .replace(markup.regex.tag.block, "\n")
        .replace(/<[^>]+>/g, markup.token.whitespace.space);
      node.innerHTML = html;
      return node.value
        .replace(/\u00A0/g, markup.token.whitespace.space)
        .replace(/[\u0020\u0009]+/g, markup.token.whitespace.space)
        .replace(/\n\s+/g, "\n")
        .replace(/\s+\n/g, "\n")
        .replace(
          markup.token.whitespace.empty.lines,
          markup.token.whitespace.block,
        )
        .trim();
    },
    protect(string) {
      const parts = [];
      const put = (part) => {
        const key = `___PRT${parts.length}___`;
        parts.push(part);
        return key;
      };
      string = string
        .replace(markup.regex.tag.shortcode.all, put)
        .replace(/<[^>]*>/g, put)
        .replace(/\[(\/)?([a-z][a-z0-9-]*)(?:[^\]]*)\]/g, put);
      return {
        text: string,
        restore: (string) =>
          string.replace(/___PRT(\d+)___/g, (_, index) => parts[+index]),
      };
    },
  },
  link: {
    mailto(string) {
      return string
        .split(/(<a\b[^>]*>[\s\S]*?<\/a>)/gi)
        .map((segment) =>
          /^<a\b/i.test(segment)
            ? segment
            : segment.replace(
                /\b([a-z0-9._%+-]+@onliner\.by)\b/gi,
                '<a href="mailto:$1">$1</a>',
              ),
        )
        .join("");
    },
    clean(string) {
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

      string = markup.link.mailto(string);
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
    },
  },
  html: {
    content(string) {
      string = markup.remove.attributes
        .run(string)
        .replace(/<img\b[^>]*>/gi, markup.format.image)
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
              `<((?!em\\b|strong\\b)[a-z][a-z0-9]*)>(${markup.token.whitespace.inline}+)<\\/\\1>`,
              "gi",
            ),
            "$2",
          )
          .replace(/<((?!em\b|strong\b)[a-z][a-z0-9]*)>([^<>\n])<\/\1>/gi, "$2")
          .replace(/<(em|strong)>\s*<\1>/gi, "<$1>")
          .replace(/<\/(em|strong)>\s*<\/\1>/gi, "</$1>")
          .replace(
            new RegExp(
              `<((?!em\\b|strong\\b)[a-z][a-z0-9]*)>${markup.token.whitespace.inline}*<\\/\\1>`,
              "gi",
            ),
            "",
          )
          .replace(
            new RegExp(
              `</(em|strong)>(${markup.token.whitespace.inline}+)<\\1>`,
              "gi",
            ),
            "$2",
          )
          .replace(/<\/([a-z][a-z0-9]*)><\1>/gi, "");
      }
      return string
        .replace(
          new RegExp(
            `${markup.token.whitespace.inline}+(</[a-z][a-z0-9]*>)`,
            "gi",
          ),
          "$1",
        )
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
    },
    widget(string) {
      return markup.remove.attributes
        .run(string)
        .replace(/<img\b[^>]*>/gi, markup.format.image)
        .replace(/<dl\b[^>]*>/gi, '<dl class="wp-caption aligncenter">');
    },
    breaks(string) {
      return markup.helper.pipe(
        string,
        (value) => value.replace(/\n{3,}/g, "\n\n"),
        (value) => value.replace(/(^|\n)\s*(<li\b)/gi, "$1\t$2"),
        (value) => value.trim(),
      );
    },
    images(string) {
      return string.replace(
        /<a\b[^>]*href="https?:\/\/content\.onliner\.by\/news\/large\/[^"]*"[^>]*>\s*(<img\b[^>]*>)\s*<\/a>/gi,
        "$1",
      );
    },
  },
});

markup.source = {
  group(items) {
    return items.join("|");
  },
  shortcode(name) {
    return String.raw`\[${name}(?:[^\]]*)\][\s\S]*?\[\/${name}\]`;
  },
  shortcodes(items) {
    return String.raw`\[(?:${markup.source.group(items)})(?:[^\]]*)\][\s\S]*?\[\/(?:${markup.source.group(items)})\]`;
  },
};

markup.pattern = {
  whitespace: {
    nbsp: String.raw`\u00A0|&nbsp;|&#160;`,
  },
  tag: {
    block: markup.source.group(markup.tag.block),
    inline: markup.source.group(markup.tag.inline),
    single: markup.source.group(markup.tag.single),
    shortcode: {
      all: String.raw`\[([a-z][a-z0-9-]*)(?:[^\]]*)\][\s\S]*?\[\/\1\]`,
      onliner: {
        misc: markup.source.shortcodes(markup.tag.shortcode.onliner.misc),
        widget: markup.source.shortcodes(markup.tag.shortcode.onliner.widget),
      },
      media: markup.source.shortcodes(markup.tag.shortcode.media),
    },
  },
  marker: {
    more: markup.reconcile.marker.more,
    end: markup.reconcile.marker.end,
  },
};

markup.regex = {
  whitespace: {
    nbsp: new RegExp(markup.pattern.whitespace.nbsp, "gi"),
  },
  tag: {
    block: new RegExp(`</?(?:${markup.pattern.tag.block})\\b[^>]*>`, "gi"),
    shortcode: {
      all: new RegExp(markup.pattern.tag.shortcode.all, "g"),
      onliner: {
        miscMatch: new RegExp(markup.pattern.tag.shortcode.onliner.misc, "i"),
        misc: new RegExp(markup.pattern.tag.shortcode.onliner.misc, "gi"),
        widget: new RegExp(markup.pattern.tag.shortcode.onliner.widget, "gi"),
      },
      media: new RegExp(markup.pattern.tag.shortcode.media, "gi"),
    },
  },
  marker: {
    more: new RegExp(markup.pattern.marker.more, "gi"),
    end: new RegExp(markup.pattern.marker.end, "gi"),
  },
};

markup.inline = {
  get speechLine() {
    return new RegExp(
      String.raw`(^|\n)(\u2014[^<\n]+?${markup.token.inline.speech.punctuation})(${markup.token.inline.speech.tail})`,
      "gu",
    );
  },

  unwrap(string) {
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
  },

  protect(string) {
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
  },

  emphasizeLine(line) {
    if (markup.token.inline.marker.emphasis.test(line)) return line;
    return line
      .replace(markup.inline.speechLine, "$1<em>$2</em>$3")
      .replace(
        new RegExp(
          String.raw`(:\s*)(${markup.token.inline.speech.fragment})`,
          "g",
        ),
        "$1<em>$2</em>",
      )
      .replace(
        new RegExp(
          String.raw`^(${markup.token.inline.speech.fragment})(?=\s*\u2014)`,
          "g",
        ),
        "<em>$1</em>",
      );
  },

  quoteView(line) {
    return markup.transform
      .strip(line.replace(/<\/?(?:em|strong)\b[^>]*>/gi, ""))
      .replace(/\s+/g, " ")
      .trim();
  },

  quoteBody(line) {
    return line.replace(/<\/?(?:em|strong)\b[^>]*>/gi, "").trim();
  },

  quoteEm(string, strong = false) {
    return strong
      ? `<strong><em>${string}</em></strong>`
      : `<em>${string}</em>`;
  },

  quoteLine(line, strong = false) {
    if (!/^\u2014(?:\s|["\u00AB\u201E]|$)/.test(markup.inline.quoteView(line))) {
      return line;
    }
    const body = markup.inline.quoteBody(line);
    const split = body.match(
      /^(\u2014[\s\S]*?[,.!?\u2026\u00BB])(\s+\u2014\s+\p{Ll}[\s\S]*?)([,.!?\u2026]\s+\u2014\s+)([\s\S]+)$/u,
    );
    if (split) {
      return `${markup.inline.quoteEm(split[1], strong)}${split[2]}${split[3]}${markup.inline.quoteEm(split[4])}`;
    }
    const tail = body.match(
      /^(\u2014[\s\S]*?[,.!?\u2026\u00BB])(\s+\u2014\s+\p{Ll}[\s\S]*)$/u,
    );
    if (tail) return `${markup.inline.quoteEm(tail[1], strong)}${tail[2]}`;
    return markup.inline.quoteEm(body, strong);
  },

  quoteParagraphs(string) {
    if (!markup.token.inline.option.enabled) return string;
    return string
      .split("\n")
      .map((line, index, lines) => {
        const current = markup.inline.quoteView(line);
        const next = lines
          .slice(index + 1)
          .map((item) => markup.inline.quoteView(item))
          .find(Boolean);
        const strong =
          /^\u2014/.test(current) &&
          /\?\s*$/.test(current) &&
          /^\u2014/.test(next || "");
        return markup.inline.quoteLine(line, strong);
      })
      .join("\n");
  },

  normalizeParagraphs(string) {
    return string
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
  },

  mergeRuns(line) {
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
  },

  unwrapSingleLine(line) {
    if (/^(?:\s*<em>[\s\S]*?<\/em>\s*)+$/i.test(line)) {
      return `<em>${line.replace(/<\/?em>/gi, "")}</em>`;
    }
    if (/^(?:\s*<strong>[\s\S]*?<\/strong>\s*)+$/i.test(line)) {
      return `<strong>${line.replace(/<\/?strong>/gi, "")}</strong>`;
    }
    return line;
  },

  unwrapNestedSameTag(line) {
    return line.replace(
      /^\s*<(em|strong)>([\s\S]*)<\/\1>\s*$/i,
      (_, tag, body) =>
        `<${tag}>${body.replace(new RegExp(`</?${tag}>`, "gi"), "")}</${tag}>`,
    );
  },

  unwrapSameTagIslands(line) {
    return ["em", "strong"].reduce(
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
  },

  normalizeLine(line) {
    return /<\/?em\b/i.test(line) ? markup.flatten.run(line) : line;
  },

  normalize(string) {
    return string
      .split("\n")
      .map((line) => markup.inline.normalizeLine(line))
      .join("\n");
  },

  normalizeMarkupLine(line) {
    return /<\/?em\b/i.test(line)
      ? line
      : line
          .replace(
            /(^|\n)(\s*)((?:--?|\u2014|\u2013)\s+)((?:<(?!\/)[a-z][a-z0-9]*\b[^>]*>\s*)+)(?=[^<\n])/gi,
            (_, start, indent, dash, tags) => `${start}${indent}${tags}\u2014 `,
          )
          .replace(
            /(<\/a>)([,.!?\u2026])((?:<\/(?:strong|em)>\s*)+)/gi,
            "$1$3$2",
          )
          .replace(
            /((?:<\/(?!a\b)[a-z][a-z0-9]*>\s*)+)([\u00BB\u201D][,.!?\u2026]?)/gi,
            "$2$1",
          );
  },

  markup(string) {
    return string
      .split("\n")
      .map((line) => markup.inline.normalizeMarkupLine(line))
      .join("\n");
  },

  apply(string) {
    return markup.inline.unwrap(
      string
        .split("\n")
        .map((line) => markup.inline.emphasizeLine(line))
        .join("\n"),
    );
  },
};




