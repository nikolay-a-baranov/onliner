import { entity } from "../core/escape.js";
import { widget } from "../core/widget.js";
import { cms } from "../core/cms.js";
export const contentEmbed = {
  url: {
    parse(value) {
      try {
        return new URL(String(value || "").trim());
      } catch {
        return null;
      }
    },
    clean(value) {
      const clean = new URL(value.toString());
      clean.search = "";
      clean.hash = "";
      return clean.toString();
    },
    link(value = "") {
      const parsed = contentEmbed.url.parse(
        String(value).replace(/&amp;/gi, "&"),
      );
      if (!parsed) return "";
      return contentEmbed.url.clean(parsed);
    },
  },
  template: {
    instagram(value) {
      return `[instagram]\n<blockquote class="instagram-media" data-instgrm-version="14" data-instgrm-permalink="${value}"><a href="${value}">Instagram</a></blockquote>\n[/instagram]`;
    },
    threads(value) {
      return `[threads]\n<blockquote class="text-post-media" data-text-post-version="0" data-text-post-permalink="${value}"><a href="${value}">Threads</a></blockquote>\n[/threads]`;
    },
    tiktok(value) {
      const match = value.match(/\/video\/(\d+)/);
      if (!match) return "";
      return `[tiktok]\n<blockquote class="tiktok-embed" data-video-id="${match[1]}" cite="${value}"><section>TikTok</section></blockquote>\n[/tiktok]`;
    },
    tweet(value) {
      return `[tweet]\n<blockquote class="twitter-tweet"><a href="${value}">X</a></blockquote>\n[/tweet]`;
    },
    telegram(value) {
      const path = value.replace(/^https?:\/\/t\.me\//, "").replace(/^s\//, "");
      return `[telegram]${path}[/telegram]`;
    },
  },
  service: {
    get(value) {
      const host = value.hostname.replace(/^www\./, "");
      if (host === "instagram.com") return contentEmbed.template.instagram;
      if (host === "threads.com" || host === "threads.net") {
        return contentEmbed.template.threads;
      }
      if (host === "tiktok.com") return contentEmbed.template.tiktok;
      if (host === "x.com" || host === "twitter.com") {
        return contentEmbed.template.tweet;
      }
      if (host === "t.me") return contentEmbed.template.telegram;
      return null;
    },
  },
  build(value) {
    const parsedUrl = contentEmbed.url.parse(value);
    if (!parsedUrl) return "";
    const cleanUrl = contentEmbed.url.clean(parsedUrl);
    const builder = contentEmbed.service.get(parsedUrl);
    if (!builder) return "";
    return builder(cleanUrl);
  },
  normalize: {
    video(value) {
      return value.replace(/\[video\][\s\S]*?\[\/video\]/gi, (full) => {
        const link = full.match(
          /src="([^"]*youtube\.com\/embed\/[^"]*)"/i,
        )?.[1];
        const clean = contentEmbed.url.link(link);
        if (!clean) return full;
        const match = clean.match(/youtube\.com\/embed\/([^/?#&"]+)/i);
        if (!match) return full;
        return full.replace(
          /src="[^"]*youtube\.com\/embed\/[^"]*"/i,
          `src="https://www.youtube.com/embed/${match[1]}"`,
        );
      });
    },
    duplicatedClosing(value) {
      return value.replace(
        /(\[\/(instagram|threads|telegram|tiktok|tweet)\])(\s*\[\/\2\])+/g,
        "$1",
      );
    },
    instagram(value) {
      return value.replace(/\[instagram\][\s\S]*?\[\/instagram\]/gi, (full) => {
        const link =
          full.match(/data-instgrm-permalink="([^"]+)"/i)?.[1] ||
          full.match(/href="([^"]*instagram\.com[^"]*)"/i)?.[1];
        const clean = contentEmbed.url.link(link);
        if (!clean) return full;
        return contentEmbed.template.instagram(clean);
      });
    },
    threads(value) {
      return value.replace(/\[threads\][\s\S]*?\[\/threads\]/gi, (full) => {
        const link =
          full.match(/data-text-post-permalink="([^"]+)"/i)?.[1] ||
          full.match(/href="([^"]*threads\.(com|net)[^"]*)"/i)?.[1];
        const clean = contentEmbed.url.link(link);
        if (!clean) return full;
        return contentEmbed.template.threads(clean);
      });
    },
    tweet(value) {
      return value.replace(/\[tweet\][\s\S]*?\[\/tweet\]/gi, (full) => {
        const link = full.match(
          /href="([^"]*(x\.com|twitter\.com)[^"]*)"/i,
        )?.[1];
        const clean = contentEmbed.url.link(link);
        if (!clean) return full;
        return contentEmbed.template.tweet(clean);
      });
    },
    tiktok(value) {
      return value.replace(/\[tiktok\][\s\S]*?\[\/tiktok\]/gi, (full) => {
        const link =
          full.match(/cite="([^"]+)"/i)?.[1] ||
          full.match(/href="([^"]*tiktok\.com[^"]*)"/i)?.[1] ||
          full.match(/https?:\/\/(?:www\.)?tiktok\.com\/[^\s"'<>]+/i)?.[0];
        const clean = contentEmbed.url.link(link);
        if (!clean) return full;
        return contentEmbed.template.tiktok(clean) || full;
      });
    },
    run(value) {
      return [
        contentEmbed.normalize.video,
        contentEmbed.normalize.duplicatedClosing,
        contentEmbed.normalize.instagram,
        contentEmbed.normalize.threads,
        contentEmbed.normalize.tweet,
        contentEmbed.normalize.tiktok,
      ].reduce((state, step) => step(state), value);
    },
  },
};

export const inline = {
  normalize(string) {
    return string.replace(/<\/?(b|i)\b[^>]*>/gi, (tag, name) => {
      const next = name.toLowerCase() === "b" ? "strong" : "em";
      return tag[1] === "/" ? `</${next}>` : `<${next}>`;
    });
  },
};

export const markup = {
  helper: {
    pipe(value, ...steps) {
      return steps.reduce((result, step) => step(result), value);
    },
    stable(value, iterate) {
      let snap = "";
      while (value !== snap) {
        snap = value;
        value = iterate(value);
      }
      return value;
    },
    outsideLinks(string, transform) {
      return string
        .split(/(<a\b[^>]*>[\s\S]*?<\/a>)/gi)
        .map((segment) =>
          /^<a\b/i.test(segment) ? segment : transform(segment),
        )
        .join("");
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

  remove: {
    attributes: {
      global: ["id", "dir"],
      data: {
        keep: [
          "instgrm-version",
          "instgrm-permalink",
          "text-post-version",
          "text-post-permalink",
          "video-id",
        ],
      },
      style: [
        "\\s*text-align:\\s*left;?",
        '\\s*font-size\\s*:\\s*[^";]+;?\\s*',
        "\\s*color\\s*:\\s*#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?;?\\s*",
        "\\s*font-[a-z-]+\\s*:\\s*inherit;?\\s*",
      ],
      run(string) {
        const attrs = markup.remove.attributes.global.map((item) =>
          markup.helper.regex(`\\s${item}="[^"]*"`, ""),
        );
        const dataKeep = markup.remove.attributes.data.keep
          .map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("|");
        const stripStyle = (value) => {
          let next = value;
          markup.remove.attributes.style.forEach((item) => {
            next = next.replace(new RegExp(item, "gi"), "");
          });
          next = next
            .replace(/^\s*;\s*|\s*;\s*$/g, "")
            .replace(/\s*;\s*/g, "; ")
            .replace(/\s{2,}/g, " ")
            .trim();
          return next;
        };
        string = string.replace(/\sstyle="([^"]*)"/gi, (_, style) => {
          const next = stripStyle(style);
          return next ? ` style="${next}"` : "";
        });
        string = string.replace(
          new RegExp(`\\sdata-(?!(?:${dataKeep})\\b)[a-z0-9-]+="[^"]*"`, "gi"),
          "",
        );
        return markup.helper.replace(string, attrs);
      },
    },
    tags: {
      single: ["br"],
      paired: ["span", "section"],
      imageWrappers: "em|strong|h[1-6]",
      images(string) {
        const wrappers = markup.remove.tags.imageWrappers;
        const tag = String.raw`<(${wrappers})(\b[^>]*)>`;
        const close = String.raw`<\/\1>`;
        const image = String.raw`(<img\b[^>]*>)`;
        const content = String.raw`([\s\S]*?)`;
        const sole = (value) => {
          return value.replace(
            new RegExp(`${tag}\\s*${image}\\s*${close}`, "gi"),
            "$3",
          );
        };
        const leading = (value) => {
          return value.replace(
            new RegExp(`${tag}\\s*${image}\\s*${content}\\s*${close}`, "gi"),
            (full, name, attrs, img, body) => {
              const text = String(body || "").trim();
              if (!text) return img;
              return `${img}${markup.token.whitespace.block}<${name}${attrs}>${text}</${name}>`;
            },
          );
        };
        const trailing = (value) => {
          return value.replace(
            new RegExp(`${tag}\\s*${content}\\s*${image}\\s*${close}`, "gi"),
            (full, name, attrs, body, img) => {
              const text = String(body || "").trim();
              if (!text) return img;
              return `<${name}${attrs}>${text}</${name}>${markup.token.whitespace.block}${img}`;
            },
          );
        };
        return markup.helper.stable(string, (value) =>
          markup.helper.pipe(value, sole, leading, trailing),
        );
      },
      marks(string) {
        return string.replace(
          /<(em|strong|b|i)\b[^>]*>([\s.,!?…:;'"«»„“”()\-–—]{1,8})<\/\1>/gi,
          "$2",
        );
      },
      run(string) {
        string = markup.helper.replace(string, [
          [markup.regex.whitespace.nbsp, markup.token.whitespace.space],
        ]);
        string = string.replace(/<br\b[^>]*>/gi, markup.token.whitespace.block);
        string = markup.helper.replace(
          string,
          markup.remove.tags.single.map((item) =>
            markup.helper.regex(`</?${item}\\b[^>]*>`, ""),
          ),
        );
        string = markup.helper.stable(string, (value) => {
          markup.remove.tags.paired.forEach((item) => {
            if (item === "span") {
              value = value.replace(
                /<span\b([^>]*)>\s*([\s\S]*?)\s*<\/span>/gi,
                (full, attrs, content) =>
                  /\bunderline\b/i.test(attrs) ? full : content,
              );
              return;
            }
            value = markup.helper.replace(value, [
              [
                new RegExp(
                  `<${item}\\b[^>]*>\\s*([\\s\\S]*?)\\s*<\\/${item}>`,
                  "gi",
                ),
                (_, content) => content,
              ],
            ]);
          });
          value = value.replace(/<\/?section\b[^>]*>/gi, "");
          return markup.helper.pipe(
            value,
            markup.remove.tags.images,
            markup.remove.tags.marks,
          );
        });
        return markup.helper.replace(string, [
          [/\s+(<\/[a-z][a-z0-9]*>)/gi, "$1"],
          [/\s+<\/p>/gi, "</p>"],
          [markup.token.whitespace.empty.paragraph, ""],
        ]);
      },
    },
    run(string) {
      return markup.widget.guard(string, (value) =>
        markup.helper.pipe(
          value,
          markup.remove.attributes.run,
          markup.remove.tags.run,
          markup.rename.run,
        ),
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
    unwrapSingleMark(line) {
      return line.replace(
        /<(em|strong)>([\s.,!?…:;'"«»„“”()\-–—]{1,8})<\/\1>/gi,
        "$2",
      );
    },
    run(line) {
      const islands = markup.inline.unwrapSameTagIslands;
      const nested = markup.inline.unwrapNestedSameTag;
      const single = markup.inline.unwrapSingleLine;
      const mark = markup.flatten.unwrapSingleMark;
      const inlineWs = markup.token.whitespace.inline;
      line = markup.helper.pipe(line, islands, nested, single, mark);
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
          .replace(/<(em|strong)>([\s.,!?…:;'"«»„“”()\-–—]{1,8})<\/\1>/gi, "$2")
          .replace(/([\p{L}]+)<(em|strong)>([\p{L}]+)/gu, "<$2>$1$3")
          .replace(/([\p{L}]+)<\/(em|strong)>([\p{L}]+)/gu, "$1$3</$2>")
          .replace(/\n+<\/em>/g, "</em>");
      }
      return line;
    },
  },

  reconcile: {
    marker: {
      token: {
        more: "<!--more-->",
        end: "<!--end-tag-->",
      },
      unmore(string) {
        return markup.helper.replace(string, [
          markup.helper.regex(
            `\\s*${markup.reconcile.marker.token.more}\\s*`,
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
              `<([a-z][a-z0-9]*)\\b[^>]*>\\s*(${markup.reconcile.marker.token.more})\\s*<\\/\\1>`,
              "gi",
            ),
            "$2",
          );
        } while (string !== snap);
        string = markup.helper.replace(string, [
          markup.helper.regex(
            `\\s*${markup.reconcile.marker.token.more}\\s*`,
            markup.token.whitespace.block,
          ),
        ]);
        const parts = string.split(markup.token.whitespace.block);
        const index = parts.findIndex((part) => part.trim());
        if (index !== -1) {
          parts[index] =
            parts[index].trimEnd() + markup.reconcile.marker.token.more;
        }
        return parts.join(markup.token.whitespace.block);
      },
      unend(string) {
        return markup.helper.replace(string, [
          markup.helper.regex(
            `\\s*${markup.reconcile.marker.token.end}\\s*`,
            "",
          ),
        ]);
      },
      end(string) {
        const blocks = markup.reconcile.marker
          .unend(string)
          .split(markup.token.whitespace.block);
        const plain = (block) =>
          markup.transform.strip(block).replace(/\s+/g, " ").trim();
        const content = (block) =>
          !!plain(block) &&
          !new RegExp(`^${markup.token.phrase.readmore}`, "i").test(
            plain(block),
          ) &&
          !new RegExp(`\\b${markup.token.phrase.collab}\\b`, "i").test(
            plain(block),
          ) &&
          !markup.reconcile.footer.marker.telegram.test(block) &&
          !markup.reconcile.footer.marker.copyright.test(block);
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
            markup.reconcile.marker.token.end
          );
        }
        const index = blocks.reduce(
          (last, block, current) => (content(block) ? current : last),
          -1,
        );
        if (index === -1) {
          return (
            blocks.join(markup.token.whitespace.block).trimEnd() +
            markup.reconcile.marker.token.end
          );
        }
        blocks[index] =
          blocks[index].trimEnd() + markup.reconcile.marker.token.end;
        return blocks.join(markup.token.whitespace.block);
      },
      run(string) {
        return markup.helper.pipe(
          string,
          markup.reconcile.marker.more,
          markup.reconcile.marker.unend,
        );
      },
    },
    footer: {
      marker: {
        telegram: /Есть о чем рассказать\?[\s\S]*?\/newsonliner_bot/i,
        copyright:
          /Перепечатка текста[\s\S]*?mailto:[a-z0-9._%+-]+@onliner\.by/i,
        line: {
          telegram: /Есть о чем рассказать\?|newsonliner_bot/i,
          copyright: /Перепечатка текста|@onliner\.by/i,
        },
      },
      copyrightEmail() {
        return cms.chief.email();
      },
      copyrightHtml() {
        const email = markup.reconcile.footer.copyrightEmail();
        return `<p style="text-align: right;"><span style="font-size: small;"><strong>Перепечатка текста и фотографий Onlíner без разрешения редакции запрещена. <a href="mailto:${email}">${email}</a></strong></span></p>`;
      },
      normalize(text, layout = "", footer = true) {
        text = text.replace(
          /<\/(p|li|blockquote|ul|ol|dl)>\s*(?=<(?:p|ul|ol|li|blockquote|dl)\b)/gi,
          "</$1>\n",
        );
        const paragraph = (marker) =>
          new RegExp(
            `<p\\b[^>]*>(?:(?!<\\/p>)[\\s\\S])*?(?:${marker.source})(?:(?!<\\/p>)[\\s\\S])*?<\\/p>`,
            "gi",
          );
        const line = (marker) =>
          new RegExp(
            `(^|\\n)([^\\n]*?)(?:${marker.source})[^\\n]*(?=\\n|$)`,
            "gi",
          );
        text = [
          markup.reconcile.footer.marker.telegram,
          markup.reconcile.footer.marker.copyright,
        ]
          .reduce((value, marker) => value.replace(paragraph(marker), ""), text)
          .replace(/\n{3,}/g, "\n\n");
        text = [
          markup.reconcile.footer.marker.line.telegram,
          markup.reconcile.footer.marker.line.copyright,
        ]
          .reduce(
            (value, marker) =>
              value.replace(line(marker), (_, lead, prefix) => {
                const plain = prefix.replace(/<[^>]+>/g, "").trim();
                return plain ? `${lead}${prefix}` : lead;
              }),
            text,
          )
          .replace(
            /(?:<p\b[^>]*>\s*)?(?:<span\b[^>]*>\s*)?(?:<strong>\s*)?$/i,
            "",
          )
          .replace(/\s+$/g, "");
        if (!footer) return text;
        if (/news/i.test(layout || "")) {
          return `${text}\n${markup.token.phrase.telegram}`;
        }
        return `${text}\n${markup.token.phrase.telegram}\n${markup.reconcile.footer.copyrightHtml()}`;
      },
    },
    clear(string) {
      return markup.helper.pipe(
        string,
        markup.reconcile.marker.unend,
        markup.reconcile.marker.unmore,
        (value) => markup.reconcile.footer.normalize(value, "", false),
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
      return confirm("Может, не кликабельные картинки?")
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
  widget: {
    marker: widget.regex.marker.readable,
    readable(string) {
      return markup.widget.marker.test(string || "");
    },
    guard(string, transform) {
      const parts = [];
      string = string.replace(
        widget.regex.block.any,
        (full, tag, attrs, body) => {
          if (!markup.widget.readable(body)) return full;
          const key = `___WGR${parts.length}___`;
          parts.push(`[${tag}${attrs}]${body}[/${tag}]`);
          return key;
        },
      );
      string = transform(string);
      parts.forEach((part, index) => {
        string = string.replaceAll(`___WGR${index}___`, part);
      });
      return string;
    },
    extract: {
      "onliner-promo-widget": (data) =>
        typeof data.text === "string" ? [data.text] : [],
      "onliner-vote": (data) =>
        (data.variants || [])
          .map((item) => item?.description)
          .filter((value) => typeof value === "string"),
    },
    text(tag, raw) {
      const extract = markup.widget.extract[tag];
      if (!extract) return markup.token.whitespace.space;
      try {
        const data = JSON.parse(raw);
        const text = extract(data).join(markup.token.whitespace.space).trim();
        return text ? ` ${text} ` : markup.token.whitespace.space;
      } catch {
        return markup.token.whitespace.space;
      }
    },
  },
  normalize: {
    decode(string) {
      const protectedText = markup.transform.protect(string);
      protectedText.text = entity.decode(protectedText.text);
      return protectedText.restore(protectedText.text);
    },
    prepare(string) {
      return markup.helper.pipe(
        string,
        markup.inline.normalizeParagraphs,
        markup.inline.quoteParagraphs,
      );
    },
    apply(string) {
      const emphasized = markup.inline.protect(string);
      emphasized.text = markup.helper.pipe(
        emphasized.text,
        markup.normalize.decode,
        markup.inline.apply,
        markup.inline.markup,
        markup.link.clean,
      );
      return emphasized.restore(emphasized.text);
    },
    run(string) {
      return markup.helper.pipe(
        string,
        markup.normalize.prepare,
        markup.normalize.apply,
      );
    },
  },
  pipeline: {
    base: [
      (value) => markup.remove.run(value),
      (value) => markup.format.content(value),
      (value) => markup.normalize.run(value),
      (value) => markup.html.inlineSpacing(value),
      (value) => markup.embed.normalize(value),
      (value) => markup.reconcile.marker.run(value),
      (value, layout) => markup.reconcile.footer.normalize(value, layout),
    ],
    embedded: [
      (value) => markup.remove.run(value),
      (value) => markup.format.widget(value),
      (value) => markup.normalize.run(value),
      (value) => markup.html.inlineSpacing(value),
      (value) => markup.embed.normalize(value),
      (value) => markup.reconcile.clear(value),
    ],
    run(string, embedded = false, layout = "") {
      const mode = embedded ? markup.pipeline.embedded : markup.pipeline.base;
      if (embedded) {
        return markup.helper.pipe(string, ...mode);
      }
      return markup.widget.guard(string, (value) =>
        markup.pipeline.base.reduce(
          (result, step) => step(result, layout),
          value,
        ),
      );
    },
  },
  clean(string) {
    return markup.transform.clean(string);
  },
  strip(string) {
    return markup.transform.strip(string);
  },
  breaks(string) {
    return markup.html.breaks(string);
  },
  process(string, embedded = false, layout = "") {
    return markup.pipeline.run(string, embedded, layout);
  },
  transform: {
    clean(string) {
      return markup.remove.tags.run(string);
    },
    strip(html) {
      const node = document.createElement("textarea");
      html = html
        .replace(widget.regex.block.plain, (_, tag, raw) =>
          markup.widget.text(tag.toLowerCase(), raw),
        )
        .replace(markup.regex.tag.shortcode.all, (full) =>
          markup.regex.tag.shortcode.onliner.miscMatch.test(full)
            ? full
            : markup.token.whitespace.space,
        )
        .replace(/<br\b[^>]*>/gi, "\n")
        .replace(/<hr\b[^>]*\/?>/gi, "\n")
        .replace(/<img\b[^>]*\/?>/gi, markup.token.whitespace.space)
        .replace(
          /<\/?(?:p|div|section|article|header|footer|aside|blockquote|h[1-6]|ul|ol|li|dl|dt|dd|table|thead|tbody|tfoot|tr|td|th)\b[^>]*>/gi,
          "\n",
        )
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
    option: {
      targetMode: "all",
    },
    target: {
      internal(url) {
        return /\.onliner\.by(?:\/|$|\?|#)/i.test(url || "");
      },
      enabled(url) {
        if (!/^https?:\/\//i.test(url || "")) return false;
        const internal = markup.link.target.internal(url);
        const mode = markup.link.option.targetMode;
        if (mode === "internal") return internal;
        if (mode === "external") return !internal;
        return true;
      },
      apply(attrs, url) {
        const next = String(attrs || "").replace(
          /\s+target\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i,
          "",
        );
        if (!markup.link.target.enabled(url)) return next;
        return `${next} target="_blank"`;
      },
    },
    normalizeTarget(string) {
      return string.replace(/<a\b([^>]*)>/gi, (full, attrs) => {
        const hrefMatch = attrs.match(
          /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i,
        );
        let href = hrefMatch
          ? hrefMatch[1] || hrefMatch[2] || hrefMatch[3] || ""
          : "";
        if (!href || !/\.onliner\.by(?:\/|$|\?|#)/i.test(href)) return full;
        if (
          /^https?:\/\/[a-z0-9-]+\.onliner\.by\/\d{4}\/\d{2}\/\d{2}\/[^\/?#]+(?:$|\?|#)/i.test(
            href,
          )
        ) {
          href = href.replace(/([^\/?#])(?=($|[?#]))/, "$1/");
        }
        const next = markup.link.target.apply(attrs, href);
        const withHref = next.replace(
          /\bhref\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+)/i,
          `href="${href}"`,
        );
        return `<a${withHref}>`;
      });
    },
    mailto(string) {
      return markup.helper.outsideLinks(string, (segment) =>
        segment.replace(
          /\b([a-z0-9._%+-]+@onliner\.by)\b/gi,
          '<a href="mailto:$1">$1</a>',
        ),
      );
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
      string = string.replace(
        /<a\b([^>]*)>([\s\S]*?)<\/a>/gi,
        (full, attrs, body) => {
          const hrefMatch = attrs.match(
            /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i,
          );
          const href = hrefMatch
            ? hrefMatch[1] || hrefMatch[2] || hrefMatch[3] || ""
            : "";
          if (!href || /^\s*(#|mailto:|tel:)/i.test(href)) return full;
          let url = pure(href);
          const needsSlash =
            /^https?:\/\/[a-z0-9-]+\.onliner\.by\/\d{4}\/\d{2}\/\d{2}\/[^\/?#]+(?:$|\?|#)/i.test(
              url,
            );
          if (needsSlash) url = url.replace(/([^\/?#])(?=($|[?#]))/, "$1/");
          const target = markup.link.target.enabled(url)
            ? ' target="_blank"'
            : "";
          return `<a href="${url}"${target}>${body}</a>`;
        },
      );
      return markup.link.normalizeTarget(string);
    },
  },
  table: {
    numeric(value) {
      const text = markup.transform.strip(value).replace(/\s+/g, " ").trim();
      return /^[\d\s.,—–-]+(?:\s*(?:руб(?:лей|ля|ль)?|кг|г|л|мл|%))?(?:\s*\([^)]*\))?$/i.test(
        text,
      );
    },
    cell(content, rowIndex, cellIndex) {
      const header = rowIndex === 0;
      const tag = header ? "th" : "td";
      const clean = content
        .replace(/<\/?p\b[^>]*>/gi, "")
        .replace(/\s+/g, " ")
        .trim();
      const body = header
        ? `<strong>${clean.replace(/<\/?strong\b[^>]*>/gi, "")}</strong>`
        : clean;
      const align =
        header || (cellIndex > 0 && markup.table.numeric(body))
          ? ' align="center"'
          : "";
      return `<${tag}${align}>${body}</${tag}>`;
    },
    row(content, rowIndex) {
      let cellIndex = 0;
      const cells = content.replace(
        /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi,
        (_, cell) => {
          const value = markup.table.cell(cell, rowIndex, cellIndex);
          cellIndex += 1;
          return value;
        },
      );
      return `<tr>${cells}</tr>`;
    },
    normalize(table) {
      const rows = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(
        (item) => item[1],
      );
      if (!rows.length) return table;
      const normalized = rows
        .map((row, index) => markup.table.row(row, index))
        .filter((row) => markup.transform.strip(row).trim());
      if (!normalized.length) return "";
      const head = normalized.slice(0, 1).join("");
      const body = normalized.slice(1).join("");
      return `<table border="1" cellspacing="0" cellpadding="2"><thead>${head}</thead><tbody>${body}</tbody></table>`;
    },
    run(string) {
      return string.replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, (table) =>
        markup.table.normalize(table),
      );
    },
  },
  html: {
    readable(string) {
      return string
        .replace(/\r\n?/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(
          new RegExp(
            `([^\\n])\\n(@(${widget.source.markerGroup(widget.marker.readable)})\\b)`,
            "gi",
          ),
          "$1\n\n$2",
        )
        .replace(/(^|\n)(@item\d*)\n(?=@|\s*$)/gi, "$1$2\n\n")
        .trim();
    },
    inlineSpacing(string) {
      const note = {
        source:
          String.raw`\(([^()]*?)\s+[\u2014-]\s*(?:прим\.\s*(?:автора|ред\.?|редакции|Onl[^)\s]*ner)?|Onl[^)\s]*ner)\s*\)`,
        text(value) {
          const clean = String(value || "")
            .replace(/[\u0020\u00A0]+/g, " ")
            .trim()
            .replace(/[,:;]$/g, "");
          if (!clean) return "";
          return /[.!?\u2026]$/u.test(clean) ? clean : `${clean}.`;
        },
        build(value) {
          return `(${note.text(value)} — Прим. Onlíner)`;
        },
        normalize(value) {
          return value.replace(new RegExp(note.source, "giu"), (_, body) =>
            note.build(body),
          );
        },
        emphasis(value) {
          return value.replace(
            new RegExp(
              `<em>(\\s*\\u2014[^\\n]*?)${note.source}([^\\n]*?)<\\/em>`,
              "giu",
            ),
            (_, before, body, after) =>
              `<em>${before}</em>${note.build(body)}<em>${after}</em>`,
          );
        },
        orphans(value) {
          return value.replace(
            /<\/em><\/em>(\([^()]*?— Прим\. Onlíner\))<em><em>/giu,
            "$1",
          );
        },
        run(value) {
          return markup.helper.pipe(
            value,
            note.orphans,
            note.emphasis,
            note.normalize,
            note.orphans,
          );
        },
      };
      return markup.helper
        .pipe(string, note.run)
        .replace(/([^\u00A0])\u0020{2,}\(/g, "$1 (")
        .replace(
          /([,:;.!?\u2026])[\u0020\u0009\u00A0]+(<\/(?:strong|em|span)>)/gi,
          "$1$2",
        )
        .replace(/(<\/(?:strong|em|span)>)([,:;.!?\u2026])/gi, "$2$1")
        .replace(/(<\/(?:strong|em|span)>)(?=[^\s<\n,.:;!?…(])/gi, "$1 ");
    },
    content(string) {
      const readableBlocks = [];
      string = string.replace(
        widget.regex.block.any,
        (full, tag, attrs, body) => {
          if (!widget.regex.marker.readable.test(body)) {
            return full;
          }
          const key = `___WGT${readableBlocks.length}___`;
          readableBlocks.push({
            key,
            value: `[${tag}${attrs}]${markup.html.readable(body)}\n\n[/${tag}]`,
          });
          return key;
        },
      );
      const emphasized = markup.inline.protect(string);
      string = emphasized.text;
      string = markup.remove.attributes
        .run(string)
        .replace(/<img\b[^>]*>/gi, markup.format.image)
        .replace(/<dl\b[^>]*>/gi, '<dl class="wp-caption aligncenter">')
        .replace(
          /(<dt\b[^>]*>\s*<img\b[^>]*?)\sclass="([^"]*)"/gi,
          (_, head, classes) => {
            const next = classes
              .split(/\s+/)
              .filter((item) => item && item.toLowerCase() !== "aligncenter")
              .join(" ");
            return next ? `${head} class="${next}"` : head;
          },
        );
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
          .replace(/<(em|strong)>[ \t]*<\1>/gi, "<$1>")
          .replace(/<\/(em|strong)>[ \t]*<\/\1>/gi, "</$1>")
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
      string = string
        .replace(
          new RegExp(
            `${markup.token.whitespace.inline}+(</[a-z][a-z0-9]*>)`,
            "gi",
          ),
          "$1",
        )
        .replace(
          /<li\b([^>]*)>\s*<p\b[^>]*>([\s\S]*?)<\/p>\s*<\/li>/gi,
          "<li$1>$2</li>",
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
          (full, tag, attrs, content) => {
            if (
              widget.tag.list.includes(tag.toLowerCase()) &&
              widget.regex.marker.readable.test(content)
            ) {
              return `[${tag}${attrs}]${markup.html.readable(content)}[/${tag}]`;
            }
            return /<[a-z][\s\S]*>/i.test(content)
              ? `[${tag}${attrs}]${content.replace(/\n+/g, "").trim()}[/${tag}]`
              : full;
          },
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
          /([^\n])\n(\[([a-z][a-z0-9-]*)(?:[^\]]*)\][\s\S]*?\[\/\3\])/g,
          "$1\n\n$2",
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
            if (
              widget.tag.list.includes(tag.toLowerCase()) &&
              widget.regex.marker.readable.test(content)
            ) {
              return `[${tag}${attrs}]${markup.html.readable(content)}[/${tag}]`;
            }
            content = content.replace(/\n{2,}/g, "\n").trim();
            return /<blockquote\b/i.test(content)
              ? `[${tag}${attrs}]\n${content}\n[/${tag}]`
              : `[${tag}${attrs}]${content}[/${tag}]`;
          },
        )
        .replace(/([,:;.!?\u2026])(<\/a>)/gi, "$2$1")
        .replace(
          /(<a\b[^>]*>[\s\S]*?<\/a>)([,.!?\u2026])((?:<\/(?:strong|em)>)+)/gi,
          "$1$2$3",
        )
        .replace(/[\u0020\u0009\u00A0]+(<\/(?:strong|em|span)>)/gi, "$1");
      string = markup.table.run(string);
      readableBlocks.forEach(({ key, value }) => {
        string = string.replaceAll(key, value);
      });
      return markup.html
        .inlineSpacing(emphasized.restore(string))
        .replace(/<(em|strong)>\s*<\/\1>/gi, "")
        .replace(/<(em|strong)>\s*(<!--(?:more|end-tag)-->)\s*<\/\1>/gi, "$2");
    },
    widget(string) {
      string = markup.remove.attributes
        .run(string)
        .replace(/<img\b[^>]*>/gi, markup.format.image)
        .replace(/<dl\b[^>]*>/gi, '<dl class="wp-caption aligncenter">')
        .replace(
          /(<dt\b[^>]*>\s*<img\b[^>]*?)\sclass="([^"]*)"/gi,
          (_, head, classes) => {
            const next = classes
              .split(/\s+/)
              .filter((item) => item && item.toLowerCase() !== "aligncenter")
              .join(" ");
            return next ? `${head} class="${next}"` : head;
          },
        );
      return markup.html.inlineSpacing(string);
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
};

markup.embed = {
  normalize(value) {
    return contentEmbed.normalize.run(value);
  },
};

markup.source = {
  group(items) {
    return items.join("|");
  },
  shortcode(name) {
    return String.raw`\[${name}(?:[^\]]*)\][\s\S]*?\[\/${name}\]`;
  },
};

markup.pattern = {
  whitespace: {
    nbsp: String.raw`\u00A0|&nbsp;|&#160;`,
  },
  tag: {
    html: String.raw`[a-z][a-z0-9]*`,
    shortcode: {
      all: String.raw`\[([a-z][a-z0-9-]*)(?:[^\]]*)\][\s\S]*?\[\/\1\]`,
      onliner: {
        misc: markup.source.shortcode("onliner-[a-z][a-z0-9-]*"),
      },
    },
  },
  marker: {
    more: markup.reconcile.marker.token.more,
    end: markup.reconcile.marker.token.end,
  },
};

markup.regex = {
  whitespace: {
    nbsp: new RegExp(markup.pattern.whitespace.nbsp, "gi"),
  },
  tag: {
    html: new RegExp(`</?(?:${markup.pattern.tag.html})\\b[^>]*>`, "gi"),
    shortcode: {
      all: new RegExp(markup.pattern.tag.shortcode.all, "g"),
      onliner: {
        miscMatch: new RegExp(markup.pattern.tag.shortcode.onliner.misc, "i"),
      },
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
        .replace(/<(em|strong)>[ \t]*<\1>/gi, "<$1>")
        .replace(/<\/(em|strong)>[ \t]*<\/\1>/gi, "</$1>");
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
    const current = markup.inline.quoteView(line);
    if (current === "\u2014") return line;
    if (!/^\u2014(?:\s|["\u00AB\u201E]|$)/.test(current)) return line;
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
